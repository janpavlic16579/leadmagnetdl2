import { useEffect, useMemo, useRef, useState } from 'react';
import { SEGMENTS, type SegmentId } from '../../config/segments';
import { getModules } from '../../config/modules';
import {
  emptyProfileFor,
  getSegmentContext,
  improvementBandFor,
  isTechnicalRiskModuleVisible,
  type BusinessProfile,
} from '../../config/contexts';
import { getSegmentForIndustry } from '../../config/industries';
import { calculateAccountingCapacity } from '../../lib/calculations';
import {
  computeModules,
  findHighestModule,
  groupByModule,
  isModuleAnswered,
  resolveActiveModules,
  resolveInputs,
  selectTopModules,
  splitIntoInputPages,
  type TriageScores,
} from '../../lib/moduleEngine';
import { aggregateResults, assessConfidence, buildComputeContext } from '../../lib/potential';
import { buildTotalsRange } from '../../lib/range';
import { assessHoursPlausibility, hoursPlausibilityWarning } from '../../lib/plausibility';
import { selectFollowUpSequence } from '../../lib/followUp';
import { triageScoreLabel } from '../../lib/answerLabels';
import { track } from '../../lib/analytics';
import { deliverLead, loadDeliveryModules } from '../../lib/deliverLead';
import { clearProgress, readProgress, saveProgress } from '../../lib/progressStorage';
import type { DownloadFile } from '../../lib/download';
import type { SalesReport } from '../../lib/salesReport';
import type {
  BasicInfo,
  FlowStep,
  LeadConsents,
  LeadContact,
  ModuleInputsState,
} from '../../types';
import { StepIndustry } from './StepIndustry';
import { StepEmployeeCount } from './StepEmployeeCount';
import { StepContext } from './StepContext';
import { StepTriage } from './StepTriage';
import { StepCostBasis } from './StepCostBasis';
import { StepInputs } from './StepInputs';
import { ResultsView } from '../Results/ResultsView';
import { EmailGate } from '../Results/EmailGate';

interface CalculatorFlowProps {
  /** Dejavnost, ki jo prednastavi kampanjski ?s= — obiskovalec jo v Koraku 1 vidi in sme popraviti. */
  initialIndustry: string;
  utmSource: string | null;
  /**
   * Interni način (?debug=1): edina pot, po kateri se prodajna priprava prenese
   * na napravo. Brez njega je dostava mogoča samo prek webhooka — dokument je
   * napisan O stranki in ne ZANJO.
   */
  internalMode?: boolean;
  /** Obvesti starša o trenutno aktivnem segmentu (npr. za logotip v headerju). */
  onActiveSegmentChange?: (id: SegmentId) => void;
}

export function CalculatorFlow({
  initialIndustry,
  utmSource,
  internalMode = false,
  onActiveSegmentChange,
}: CalculatorFlowProps) {
  /**
   * Napredek prejšnje seje v tem zavihku (lib/progressStorage.ts). Prebere se
   * enkrat, ob prvem izrisu: po tem tok krmili stanje, ne shramba.
   */
  const [restored] = useState(readProgress);

  /**
   * Kampanjski `?s=` prevlada le, dokler obiskovalec dejavnosti še ni izbral.
   *
   * Obnovljen zapis je sicer močnejši od povezave — je obiskovalčeva lastna
   * izbira, ki je povezava ne sme povoziti sredi vprašalnika. Prazna dejavnost v
   * zapisu pa ni izbira, ampak sled obiska, ki se je končal na prvem koraku;
   * brez te veje je star prazen zapis v zavihku pobral prednastavitev vsaki
   * naslednji kampanjski povezavi.
   *
   * Profil se drži iste odločitve: urne postavke so privzetki DEJAVNOSTI, zato
   * bi ob prevzeti dejavnosti in obnovljenem profilu obiskovalec dobil postavke
   * druge panoge.
   */
  const useRestoredIndustry = Boolean(restored?.basicInfo.industry);
  const startingIndustry = useRestoredIndustry ? restored!.basicInfo.industry : initialIndustry;

  const [step, setStep] = useState<FlowStep>(restored?.step ?? 'industry');
  const [basicInfo, setBasicInfo] = useState<BasicInfo>(() => ({
    ...(restored?.basicInfo ?? { employeeCount: 0 }),
    industry: startingIndustry,
  }));
  const [profile, setProfile] = useState<BusinessProfile>(() =>
    useRestoredIndustry && restored
      ? restored.profile
      : emptyProfileFor(getSegmentContext(getSegmentForIndustry(startingIndustry))),
  );
  const [moduleInputs, setModuleInputs] = useState<ModuleInputsState>(restored?.moduleInputs ?? {});
  const [triageScores, setTriageScores] = useState<TriageScores>(restored?.triageScores ?? {});
  /** null = uporabnik še ni bil v triaži; takrat velja samodejni predlog. */
  const [triageSelection, setTriageSelection] = useState<string[] | null>(
    restored?.triageSelection ?? null,
  );
  /**
   * Katero področje je na vrsti v koraku z vnosi. Hranjen kot id modula in ne kot
   * indeks: gumb "izmeri to področje" na rezultatih doda modul v izbiro, zato bi
   * indeks meril po seznamu, ki v naslednjem izrisu ne velja več. null = prva stran.
   */
  const [inputsModuleId, setInputsModuleId] = useState<string | null>(
    restored?.inputsModuleId ?? null,
  );
  const [submitted, setSubmitted] = useState(false);
  /**
   * Strankino poročilo, kot je bilo preneseno.
   *
   * Hranimo ga, ker prenos bloba ni zanesljiv — iOS Safari ga pogosto odpre v
   * zavihku ali zavrne, zahvalni zaslon pa je doslej trdil, da je datoteka v mapi
   * za prenose, in ni ponudil nobene poti nazaj.
   */
  const [customerFile, setCustomerFile] = useState<DownloadFile | null>(null);
  /** Pripravljeno poročilo za svetovalca — samo v internem načinu (glej internalMode). */
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);

  /**
   * Segment ima en sam vir: izbrano dejavnost. Prej je obstajal še ročni override
   * (kampanjski ?s= in zaslon "Izberite profil izračuna"), ki se ni počistil nikoli
   * — od prve nastavitve naprej je bil spustni seznam v Koraku 1 okrasen, saj je
   * obiskovalec zamenjal dejavnost, vprašalnik in rezultati pa so ostali na starem.
   */
  const activeSegmentId = getSegmentForIndustry(basicInfo.industry);
  const segment = SEGMENTS[activeSegmentId];
  /**
   * Segment, po katerem so nastali obstoječi odgovori.
   *
   * Loči "obiskovalec premika spustni seznam" od "obiskovalec je izbiro potrdil":
   * odgovore zavrže šele drugo. Brez tega je vsak vmesni premik po seznamu
   * pomenil izgubo, tudi kadar se je obiskovalec takoj popravil nazaj.
   */
  const committedSegmentId = useRef(activeSegmentId);
  /**
   * Odsoten kontekst je hkrati stikalo: segment brez njega nima koraka "nekaj o
   * vas" ne skupne finančne osnove, zato tudi ne pasu izboljšave in ne oznake
   * zanesljivosti. Doslej so to krmilile zastavice v segments.ts — dvojna
   * evidenca, pri kateri je zastavica brez konfiguracije prikazala prazen korak.
   */
  const context = getSegmentContext(activeSegmentId);

  useEffect(() => {
    onActiveSegmentChange?.(activeSegmentId);
  }, [activeSegmentId, onActiveSegmentChange]);

  /**
   * Vsak korak je svoja stran, zato se začne na vrhu. Brskalnik ob zamenjavi
   * vsebine odmik ohrani — na daljšem koraku je obiskovalec naslednjega zagledal
   * nekje na sredini, pod naslovom in uvodnim besedilom, ki mu povesta, kaj se od
   * njega pričakuje. 'instant' namenoma: drsenje čez cel zaslon bi bil prehod,
   * kakršnega menjava strani nima.
   */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [step, inputsModuleId]);

  /**
   * Napredek preživi osvežitev strani.
   *
   * Po oddaji ne shranjujemo več in zapis pobrišemo: tok je končan, obiskovalec
   * pa ob naslednjem obisku ne sme pristati sredi tujega vprašalnika.
   */
  useEffect(() => {
    if (submitted) {
      clearProgress();
      return;
    }
    saveProgress({ step, basicInfo, profile, moduleInputs, triageScores, triageSelection, inputsModuleId });
  }, [submitted, step, basicInfo, profile, moduleInputs, triageScores, triageSelection, inputsModuleId]);

  /**
   * Gumb "Nazaj" v brskalniku (in gib "swipe back" na telefonu) pelje korak
   * nazaj, ne pa z aplikacije.
   *
   * Vsak korak dobi svoj vnos v zgodovini. Brez tega je bil najbolj naraven gib
   * za "nazaj" hkrati najbolj poguben: obiskovalca je odnesel s strani, s tem pa
   * je izginil ves vprašalnik.
   */
  useEffect(() => {
    const state = window.history.state as {
      lm10Step?: FlowStep;
      lm10InputsModuleId?: string | null;
    } | null;
    // Tudi inputsModuleId in ne le step: korak z vnosi je ena stran na področje,
    // zato bi sicer vsa področja delila en vnos v zgodovini in bi "Nazaj" s
    // tretjega področja skočil na finančno osnovo.
    const unchanged =
      state?.lm10Step === step && (state?.lm10InputsModuleId ?? null) === inputsModuleId;
    if (unchanged) return;

    // Prvi korak samo označimo (replace), da v zgodovini ne nastane prazen vnos.
    const method = state?.lm10Step ? 'pushState' : 'replaceState';
    window.history[method]({ lm10Step: step, lm10InputsModuleId: inputsModuleId }, '');
  }, [step, inputsModuleId]);

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const state = event.state as { lm10Step?: FlowStep; lm10InputsModuleId?: string | null } | null;
      // Vnos brez naše oznake pomeni, da smo prišli iz zgodovine pred aplikacijo —
      // takrat naj brskalnik odnavigira, kot bi sicer.
      if (!state?.lm10Step) return;
      setStep(state.lm10Step);
      setInputsModuleId(state.lm10InputsModuleId ?? null);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  /**
   * Opozorilo pred zaprtjem zavihka, kadar je kaj za izgubiti.
   *
   * Le kadar so vnosi neprazni in obrazec še ni oddan: opozorilo brez vsebine je
   * zoprnost, ki jo obiskovalci nehajo brati, in bi zato ne delovalo takrat, ko
   * bi moralo.
   */
  const hasAnswers = Object.keys(moduleInputs).length > 0;
  useEffect(() => {
    if (!hasAnswers || submitted) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasAnswers, submitted]);

  /**
   * Lijak (lib/analytics.ts). Korak in segment, nič osebnega — brez tega o
   * odpadanju skozi deset korakov ni znano nič, s tem pa je vsaka razprava o
   * krajšanju vprašalnika razprava o mnenjih.
   */
  useEffect(() => {
    track('lm10_step_view', { step, segment: activeSegmentId });
  }, [step, activeSegmentId]);

  /**
   * Zaporedje korakov je izpeljano iz konfiguracije segmenta, ne iz verige ternarjev.
   * Dodajanje koraka pomeni en vnos tu — številčenje in navigacija se prilagodita sama.
   */
  const stepOrder = useMemo(() => {
    const order: FlowStep[] = ['industry', 'employeeCount'];
    if (context) order.push('context');
    if (segment.triage) order.push('triage');
    if (context) order.push('costBasis');
    order.push('inputs', 'results');
    return order;
  }, [segment, context]);

  const segmentModules = useMemo(() => getModules(segment.moduleIds), [segment]);
  /** Samo moduli s triažo se lahko izločijo; diagnostični in E se prikažejo vedno. */
  const triageableIds = useMemo(
    () => segmentModules.filter((definition) => definition.triage).map((definition) => definition.id),
    [segmentModules],
  );

  const recommendedCount = segment.triage?.recommendedCount ?? 0;
  const defaultIds = segment.triage?.defaultIds;
  const autoSelection = useMemo(
    () =>
      segment.triage
        ? selectTopModules(triageableIds, triageScores, recommendedCount, defaultIds)
        : [],
    [segment.triage, triageableIds, triageScores, recommendedCount, defaultIds],
  );
  const selectedIds = triageSelection ?? autoSelection;

  const activeModules = useMemo(() => {
    const selected = resolveActiveModules(segmentModules, segment.triage ? selectedIds : null);
    // Tehnična opozorila (SQL Server, Windows Server, ZIERDED) so smiselna le
    // obstoječim uporabnikom PANTHEON — drugim so šum, ne proizvodni prihranek.
    return selected.filter(
      (definition) =>
        definition.id !== 'E' || isTechnicalRiskModuleVisible(segment.id, profile.currentSystem),
    );
  }, [segmentModules, segment.triage, segment.id, selectedIds, profile.currentSystem]);

  /** Korak z vnosi ni ena stran, ampak ena stran na področje (glej splitIntoInputPages). */
  const inputPages = useMemo(() => splitIntoInputPages(activeModules), [activeModules]);
  const inputsPageIndex = Math.max(
    0,
    inputPages.findIndex((page) => page.some((definition) => definition.id === inputsModuleId)),
  );

  /**
   * Številčenje korakov. stepOrder šteje vnose kot EN korak, obiskovalec pa jih
   * prehodi toliko, kolikor je področij — zato se skupno število razširi in vsaka
   * stran vnosov dobi svojo številko. Ena funkcija, da aritmetika ne zaide v JSX.
   */
  const inputsAt = stepOrder.indexOf('inputs');
  const totalSteps = stepOrder.length - 1 + inputPages.length;
  const stepNumber = (current: FlowStep, pageIndex = 0) => {
    const index = stepOrder.indexOf(current);
    if (index < inputsAt) return index + 1;
    if (current === 'inputs') return inputsAt + 1 + pageIndex;
    // Rezultati in vse za njimi: vnosi so pojedli inputPages.length mest namesto enega.
    return index + inputPages.length;
  };

  const stepLabel = (current: FlowStep, pageIndex = 0) =>
    `Korak ${stepNumber(current, pageIndex)} od ${totalSteps}`;
  const goNext = (current: FlowStep) => () => {
    const next = stepOrder[stepOrder.indexOf(current) + 1];
    // Naprej v vnose se vedno začne na prvem področju — ne glede na to, kateri korak
    // je pred njimi (dejavnost brez konteksta pride iz triaže, ne iz osnove).
    if (next === 'inputs') setInputsModuleId(null);
    setStep(next);
  };
  const goBack = (current: FlowStep) => () => setStep(stepOrder[stepOrder.indexOf(current) - 1]);

  /** Vstop v vnose od zadaj (z rezultatov) pristane na zadnji strani — pravi inverz. */
  const openInputsAt = (moduleId: string | null) => {
    setInputsModuleId(moduleId);
    setStep('inputs');
  };

  /** Vrednosti, dopolnjene s privzetimi — modul nikoli ne dobi delnega vnosa. */
  const resolvedValues = useMemo(() => {
    const values: Record<string, Record<string, number>> = {};
    for (const definition of activeModules) {
      values[definition.id] = resolveInputs(definition, moduleInputs[definition.id]);
    }
    return values;
  }, [activeModules, moduleInputs]);

  const outputs = useMemo(
    () => computeModules(activeModules, resolvedValues, buildComputeContext(profile)),
    [activeModules, resolvedValues, profile],
  );

  const totals = useMemo(
    () =>
      aggregateResults(outputs, {
        // Potencial pozna le segment, ki vpraša za sedanji sistem; drugod kartica odpade.
        band: context ? improvementBandFor(context, profile.currentSystem) : undefined,
        confidence: context
          ? assessConfidence({
              profile,
              context,
              modules: activeModules,
              values: resolvedValues,
              outputs,
            })
          : undefined,
      }),
    [outputs, context, profile, activeModules, resolvedValues],
  );

  const highestModule = findHighestModule(outputs, segment.moduleIds);

  /**
   * Rezultat kot razpon, kadar je katera od skupnih predpostavk izbran pas in ne
   * vnesena številka (lib/range.ts) — sredina pasu je približek in prikaz tega ne
   * sme skriti v navidezno natančni piki. Null = vse vneseno, prikaz ostane točka.
   */
  const totalsRange = useMemo(
    () =>
      buildTotalsRange({
        modules: activeModules,
        values: resolvedValues,
        profile,
        context,
        band: context ? improvementBandFor(context, profile.currentSystem) : undefined,
      }),
    [activeModules, resolvedValues, profile, context],
  );

  /**
   * Mehko opozorilo, kadar vsota vnesenih ur preseže verjetni delež kapacitete
   * podjetja — število zaposlenih tu prvič dela, namesto da bi se zavrglo.
   * Opozorilo nikoli ne blokira: podatek je lahko resničen, sum pa vseeno pripotuje
   * do prodajnika v prodajni pripravi (buildSalesReport ga izračuna sam).
   */
  const plausibilityWarning = useMemo(
    () =>
      hoursPlausibilityWarning(
        assessHoursPlausibility(activeModules, resolvedValues, basicInfo.employeeCount),
      ),
    [activeModules, resolvedValues, basicInfo.employeeCount],
  );

  /**
   * "+X strank brez nove zaposlitve" = sproščene ure / povprečne ure na stranko.
   *
   * Delitelja ne določa več skrita konstanta: vpraša ga področje Neobračunano delo
   * in donosnost strank. Kadar tega področja obiskovalec v triaži ne izbere,
   * vprašanja sploh ni — takrat (in ob vpisani ničli) obvelja rezerva iz segmenta,
   * ker bi delitev z nič dala Infinity in izpis "+∞ strank".
   */
  const accountingCapacity =
    segment.id === 'racunovodstvo' && segment.accountingCapacity
      ? calculateAccountingCapacity(
          totals.capacityHoursPerMonth,
          resolvedValues.donosnostRs?.hoursPerClientPerMonth ||
            segment.accountingCapacity.avgHoursPerClientPerMonth,
        )
      : undefined;

  const followUpSequence = selectFollowUpSequence({
    segment: segment.id,
    annualLossEUR: totals.directLossEUR + totals.lostMarginEUR,
    /**
     * Tehnično opozorilo modula E in ne "kakršnokoli tveganje".
     *
     * Prej je bil pogoj `totals.risks.length > 0`, ta pa je bil vedno resničen:
     * med izidi koša 'risk' sta tudi obe diagnostični oceni, ki sta prisotni v
     * vsakem segmentu in tudi tedaj, ko obiskovalec na diagnostiko ne odgovori.
     * Sekvenca 'high-loss-no-risk' zato ni bila dosegljiva nikoli — modul E, ki
     * naj bi o njej odločal, na izbiro ni vplival.
     */
    hasModuleERisk: outputs.some((output) => output.moduleId === 'E' && output.bucket === 'risk'),
    highLossThresholdEUR: segment.highLossThresholdEUR,
  });

  /**
   * Področja, ki na rezultatih niso izmerjena — bodisi jih obiskovalec ni izbral,
   * bodisi jih je izbral in pustil prazna.
   *
   * Izpeljano iz podatkov in ne iz izbire: odkar je mogoče obkljukati vseh pet, bi
   * obiskovalec, ki izbere pet in izpolni dve, videl prazen razdelek — tri področja
   * z 0 EUR bi bila tiho predstavljena kot izmerjena. To bi jamstvo "nobene številke
   * si ne izmislimo" obrnilo v nasprotje.
   */
  const unmeasuredModules = segmentModules.filter(
    (definition) =>
      definition.triage &&
      (!selectedIds.includes(definition.id) ||
        !isModuleAnswered(definition, resolvedValues[definition.id])),
  );

/**
   * Rezultat je konec brezplačnega dela in edina točka, kjer je smiselno meriti
   * KAKOVOST izračuna (oznaka zanesljivosti, koliko področij je izmerjenih) —
   * s tem se pokaže, ali obiskovalci odpadejo zaradi šibkih ali močnih številk.
   * Zneskov med njimi ni; ti so poslovni podatek stranke, ne merilo lijaka.
   */
  const resultsSeen = useRef(false);
  useEffect(() => {
    if (step !== 'results' || resultsSeen.current) return;
    resultsSeen.current = true;

    /**
     * jsPDF s pisavami vred je 540 kB in se doslej začel nalagati šele ob kliku
     * na "Prenesi poročilo" — obiskovalec je po oddaji obrazca gledal vrteči se
     * gumb tudi nekaj sekund. Tu je naslednji klik že skoraj gotov, povezava pa
     * med branjem rezultatov prosta.
     */
    void import('../../lib/pdf');

    track('lm10_results_view', {
      segment: activeSegmentId,
      confidence: totals.confidence ?? 'unknown',
      measuredAreas: triageableIds.length - unmeasuredModules.length,
      offeredAreas: triageableIds.length,
    });
  });

  async function handleEmailSubmit({
    contact,
    consents,
  }: {
    contact: LeadContact;
    consents: LeadConsents;
  }) {
    // Orkestracija dostave živi v lib/deliverLead.ts: vitest teče brez jsdom, zato
    // je bilo tu — sredi komponente — pravilo "prodajna priprava nikoli k stranki"
    // nepreverljivo s testom. Tu ostane samo vezava na stanje in na brskalnik.
    const [modules, { downloadFile, downloadSequentially }] = await Promise.all([
      loadDeliveryModules(),
      import('../../lib/download'),
    ]);

    await deliverLead(
      {
        contact,
        consents,
        utmSource,
        internalMode,
        segment,
        context,
        profile,
        industry: basicInfo.industry,
        employeeCount: basicInfo.employeeCount,
        segmentModules,
        activeModules,
        values: resolvedValues,
        triageScores,
        outputs,
        totals,
        totalsRange,
        highestModule,
        accountingCapacity,
        // Ista pokritost kot na zaslonu: hero znesek meri samo izbrana področja.
        coverage: {
          measuredCount: triageableIds.length - unmeasuredModules.length,
          offeredCount: triageableIds.length,
          unmeasured: unmeasuredModules.map((definition) => ({
            title: definition.title,
            scoreLabel:
              (triageScores[definition.id] ?? 0) > 0
                ? triageScoreLabel(definition, triageScores[definition.id] ?? 0)
                : null,
          })),
        },
        followUpSequence,
      },
      modules,
      {
        downloadFile,
        downloadSequentially,
        onCustomerFile: setCustomerFile,
        onSalesReport: setSalesReport,
        onSubmitted: () => setSubmitted(true),
      },
    );
  }

  if (step === 'industry') {
    return (
      <StepIndustry
        value={basicInfo}
        /**
         * Odgovori pripadajo vprašalniku, vprašalnik pa segmentu — zato je sprožilec
         * sprememba SEGMENTA in ne dejavnosti: 'trgovina' in 'drugo_blago' vodita v
         * isti vprašalnik, zato bi brisanje pomenilo izgubo dela brez razloga.
         *
         * Zavrže jih šele "Naprej" in ne že premik v spustnem seznamu: kdor je
         * pomotoma izbral sosednjo dejavnost in se takoj popravil, je doslej vse
         * izgubil — dvakrat sprožena sprememba segmenta, brez opozorila in brez
         * razveljavitve. Zdaj do zadnjega trenutka nič ne izgine, opozorilo v
         * koraku pa pove, kaj bo "Naprej" stalo.
         */
        answersAtRisk={hasAnswers}
        onChange={setBasicInfo}
        onNext={() => {
          const nextSegmentId = getSegmentForIndustry(basicInfo.industry);
          if (nextSegmentId !== committedSegmentId.current) {
            // Kadar se segment spremeni, ne pomeni isto noben odgovor — niti modul 'E',
            // ki si ga delijo vsi segmenti in se je doslej tiho prenesel v novo dejavnost.
            setProfile(emptyProfileFor(getSegmentContext(nextSegmentId)));
            setTriageScores({});
            setTriageSelection(null);
            setModuleInputs({});
          }
          committedSegmentId.current = nextSegmentId;
          track('lm10_industry_selected', { industry: basicInfo.industry, segment: nextSegmentId });
          goNext('industry')();
        }}
      />
    );
  }

  if (step === 'employeeCount') {
    return (
      <StepEmployeeCount
        value={basicInfo}
        onChange={setBasicInfo}
        stepLabel={stepLabel('employeeCount')}
        onNext={goNext('employeeCount')}
        onBack={goBack('employeeCount')}
      />
    );
  }

  if (step === 'context' && context) {
    return (
      <StepContext
        context={context}
        profile={profile}
        onChange={setProfile}
        stepLabel={stepLabel('context')}
        onNext={goNext('context')}
        onBack={goBack('context')}
      />
    );
  }

  if (step === 'triage') {
    return (
      <StepTriage
        modules={segmentModules.filter((definition) => definition.triage)}
        scores={triageScores}
        // Ocene NE prepišejo ročne izbire: triageSelection === null je že oznaka
        // "obiskovalec se izbire ni dotaknil", zato predlog do prvega klika živo
        // sledi ocenam, po njem pa obvelja izbira. Prej je vsak premik ocene izbiro
        // zavrgel — tudi tisto, ki jo je obiskovalec pravkar sestavil.
        onScoresChange={setTriageScores}
        selected={selectedIds}
        onSelectedChange={setTriageSelection}
        recommendedCount={recommendedCount}
        stepLabel={stepLabel('triage')}
        onNext={() => {
          track('lm10_triage_done', { segment: segment.id, selectedAreas: selectedIds.length });
          goNext('triage')();
        }}
        onBack={goBack('triage')}
      />
    );
  }

  if (step === 'costBasis' && context) {
    return (
      <StepCostBasis
        context={context}
        profile={profile}
        onChange={setProfile}
        stepLabel={stepLabel('costBasis')}
        onNext={goNext('costBasis')}
        onBack={goBack('costBasis')}
      />
    );
  }

  if (step === 'inputs') {
    const isLastPage = inputsPageIndex === inputPages.length - 1;
    const pageModules = inputPages[inputsPageIndex] ?? [];
    return (
      <StepInputs
        segment={segment}
        modules={pageModules}
        // Ime strani je ime področja — na zadnji strani z dvema modula spoj obeh,
        // ne izmišljen nadnaslov ("Dodatno" ipd.). Isti niz kot legenda v triaži.
        pageTitle={pageModules.map((definition) => definition.title).join(' in ')}
        values={resolvedValues}
        raw={moduleInputs}
        onChange={setModuleInputs}
        liveTotalEUR={totals.directLossEUR + totals.lostMarginEUR + totals.capacityEUR}
        plausibilityWarning={plausibilityWarning}
        stepLabel={stepLabel('inputs', inputsPageIndex)}
        isLastPage={isLastPage}
        // Na robovih koraka gre navigacija ven po stepOrder, vmes pa le na sosednje
        // področje — prvi modul strani je njen ključ.
        onNext={
          isLastPage
            ? goNext('inputs')
            : () => setInputsModuleId(inputPages[inputsPageIndex + 1][0].id)
        }
        onBack={
          inputsPageIndex === 0
            ? goBack('inputs')
            : () => setInputsModuleId(inputPages[inputsPageIndex - 1][0].id)
        }
        // Vprašalnik določa dejavnost, zato je popravek tam in ne na ločenem zaslonu
        // z drugim besednjakom. 'industry' je prvi člen stepOrder — ista navigacija
        // kot "Nazaj" s Koraka 2, brez skoka na sredino toka.
        onChangeSegment={() => setStep('industry')}
      />
    );
  }

  if (step === 'results') {
    return (
      <ResultsView
        segment={segment}
        outputsByModule={groupByModule(outputs)}
        totals={totals}
        totalsRange={totalsRange}
        accountingCapacity={accountingCapacity}
        unmeasuredModules={unmeasuredModules}
        triageScores={triageScores}
        valuesByModule={resolvedValues}
        stepLabel={stepLabel('results')}
        onMeasureModule={(id) => {
          // Odkar je "neizmerjeno" izpeljano iz podatkov, se gumb prikaže tudi pri
          // področju, ki JE izbrano, a prazno — brez Set bi id podvojili.
          setTriageSelection([...new Set([...selectedIds, id])]);
          // Naravnost na stran tega področja: sicer bi obiskovalec pristal na prvem
          // in moral do svojega priklikati skozi vsa vmesna.
          openInputsAt(id);
        }}
        onProceedToEmail={() => {
          track('lm10_email_gate_view', { segment: segment.id });
          setStep('emailGate');
        }}
        onBack={() => openInputsAt(inputPages.at(-1)?.[0].id ?? null)}
      />
    );
  }

  if (step === 'emailGate') {
    return (
      <EmailGate
        submitted={submitted}
        internalMode={internalMode}
        followUpSequenceDebug={followUpSequence}
        onSubmit={handleEmailSubmit}
        onDownloadCustomerPdf={
          customerFile
            ? async () => {
                const { downloadFile } = await import('../../lib/download');
                downloadFile(customerFile);
                // Pove, kako pogosto samodejni prenos odpove — brez tega o
                // zanesljivosti prenosa bloba na iOS ugibamo.
                track('lm10_report_redownload', { segment: segment.id });
              }
            : undefined
        }
        onBackToResults={() => setStep('results')}
        onDownloadSalesPdf={
          salesReport
            ? async () => {
                const [{ buildSalesPdfFile }, { downloadFile }] = await Promise.all([
                  import('../../lib/pdfSales'),
                  import('../../lib/download'),
                ]);
                downloadFile(await buildSalesPdfFile(salesReport));
              }
            : undefined
        }
        onDownloadSalesHtml={
          salesReport
            ? async () => {
                const [{ buildSalesHtmlFile }, { downloadFile }] = await Promise.all([
                  import('../../lib/salesReportHtml'),
                  import('../../lib/download'),
                ]);
                downloadFile(buildSalesHtmlFile(salesReport));
              }
            : undefined
        }
        onBack={() => setStep('results')}
      />
    );
  }

  // Nov korak brez veje bi se sicer tiho izrisal kot zadnja veja — raje nič kot napačen zaslon.
  return null;
}
