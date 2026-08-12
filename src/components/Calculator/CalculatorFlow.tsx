import { useEffect, useMemo, useState } from 'react';
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
  /** Obvesti starša o trenutno aktivnem segmentu (npr. za logotip v headerju). */
  onActiveSegmentChange?: (id: SegmentId) => void;
}

export function CalculatorFlow({
  initialIndustry,
  utmSource,
  onActiveSegmentChange,
}: CalculatorFlowProps) {
  const [step, setStep] = useState<FlowStep>('industry');
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    industry: initialIndustry,
    employeeCount: 0,
  });
  /**
   * Privzetka urnih postavk pripadata dejavnosti (voznikova ura ni operaterjeva),
   * zato se profil ob vsaki spremembi dejavnosti ali profila izračuna postavi na
   * novo. Brez tega bi obiskovalec, ki koraka s stroškovno osnovo ne izpolni,
   * dobil privzetek tiste dejavnosti, ki jo je izbral najprej.
   */
  const [profile, setProfile] = useState<BusinessProfile>(() =>
    emptyProfileFor(getSegmentContext(getSegmentForIndustry(initialIndustry))),
  );
  const [moduleInputs, setModuleInputs] = useState<ModuleInputsState>({});
  const [triageScores, setTriageScores] = useState<TriageScores>({});
  /** null = uporabnik še ni bil v triaži; takrat velja samodejni predlog. */
  const [triageSelection, setTriageSelection] = useState<string[] | null>(null);
  /**
   * Katero področje je na vrsti v koraku z vnosi. Hranjen kot id modula in ne kot
   * indeks: gumb "izmeri to področje" na rezultatih doda modul v izbiro, zato bi
   * indeks meril po seznamu, ki v naslednjem izrisu ne velja več. null = prva stran.
   */
  const [inputsModuleId, setInputsModuleId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  /** Pripravljeno poročilo za svetovalca — hranimo ga, da ga je mogoče prenesti znova. */
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
    hasModuleERisk: totals.risks.length > 0,
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

  async function handleEmailSubmit({
    contact,
    consents,
  }: {
    contact: LeadContact;
    consents: LeadConsents;
  }) {
    // jsPDF je težka knjižnica in je potrebna šele tu — naloži se ob oddaji, ne ob
    // prvem prikazu strani. Prodajna dela gresta v isti blok, da ostaneta izven
    // začetnega svežnja.
    const [
      { buildResultsPdfFile },
      { buildSalesReport },
      { buildSalesPdfFile },
      { buildSalesHtmlFile, buildSalesReportHtml },
      { downloadSequentially },
      { buildLeadExportRecord },
      { leadWebhookUrl, submitLead },
    ] = await Promise.all([
      import('../../lib/pdf'),
      import('../../lib/salesReport'),
      import('../../lib/pdfSales'),
      import('../../lib/salesReportHtml'),
      import('../../lib/download'),
      import('../../lib/exportRecord'),
      import('../../lib/submitLead'),
    ]);

    // Strankino poročilo se sestavi PRVO in izven try/catch: je edina datoteka, ki
    // mora priti vedno, in napaka v prodajnem delu je ne sme odnesti s seboj.
    const customerFile = await buildResultsPdfFile({
      segment,
      // Samo ime podjetja: poročilo gre upravi stranke, ki ve, kdo ga je izpolnil,
      // in se posreduje interno — osebni podatki v njem so odveč.
      companyName: contact.companyName,
      outputs,
      totals,
      totalsRange,
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
      highestModule,
      accountingCapacity,
    });

    // Priprava za svetovalca. Vse, kar potrebuje, obstaja samo tu in bi se sicer
    // ob prehodu na zahvalni zaslon zavrglo — vključno z odgovori, triažnimi
    // ocenami neizmerjenih področij in podatkom, katere številke so bile ugibane.
    const salesFiles: DownloadFile[] = [];
    try {
      const report = buildSalesReport({
        generatedAtISO: new Date().toISOString(),
        contact,
        consents,
        utmSource,
        industry: basicInfo.industry,
        employeeCount: basicInfo.employeeCount,
        segment,
        context,
        profile,
        segmentModules,
        activeModules,
        values: resolvedValues,
        triageScores,
        outputs,
        totals,
        totalsRange,
        highestModule,
        followUpSequence,
      });
      setSalesReport(report);

      /**
       * Dostava prodajne priprave in izvoznega zapisa (kalibracijska zanka):
       * kadar je konfiguriran webhook (VITE_LEAD_WEBHOOK_URL), gre vse na
       * strežnik — prodajna priprava je INTERNI dokument in ob uspešni dostavi
       * ne pristane na napravi stranke. Brez webhooka (ali ob napaki) ostane
       * dosedanje vedenje: prenos k stranki, da orodje deluje samostojno.
       */
      let deliveredToWebhook = false;
      const webhookUrl = leadWebhookUrl();
      if (webhookUrl) {
        const record = buildLeadExportRecord({
          timestampISO: report.meta.generatedAtISO,
          contact,
          consents,
          industry: basicInfo.industry,
          segment: segment.id,
          employeeCount: basicInfo.employeeCount,
          profile,
          selectedModules: activeModules.map((definition) => definition.id),
          triageScores,
          moduleInputs: resolvedValues,
          outputs,
          totals,
          followUpSequence,
          utmSource,
        });
        if (record) {
          deliveredToWebhook = await submitLead(
            { record, salesReportHtml: buildSalesReportHtml(report) },
            webhookUrl,
          );
        }
      }

      if (!deliveredToWebhook) {
        salesFiles.push(await buildSalesPdfFile(report), buildSalesHtmlFile(report));
      }
    } catch {
      // Strankina datoteka je že sestavljena in se prenese tako ali tako.
    }

    // Zaporedno in z razmikom: trije prenosi v isti niti so za brskalnik en sam
    // dogodek, ki ga po prvi datoteki zavrne — prav zato strankino poročilo prej
    // ni pristalo. Prva v vrsti je zato tista, ki mora priti.
    await downloadSequentially([customerFile, ...salesFiles]);

    setSubmitted(true);
  }

  if (step === 'industry') {
    return (
      <StepIndustry
        value={basicInfo}
        onChange={(value) => {
          setBasicInfo(value);

          /**
           * Odgovori pripadajo vprašalniku, vprašalnik pa segmentu — zato je sprožilec
           * sprememba SEGMENTA in ne dejavnosti: 'trgovina' in 'drugo_blago' vodita v
           * isti vprašalnik, zato bi brisanje pomenilo izgubo dela brez razloga.
           *
           * Kadar se segment spremeni, ne pomeni isto noben odgovor — niti modul 'E',
           * ki si ga delijo vsi segmenti in se je doslej tiho prenesel v novo dejavnost.
           */
          const nextSegmentId = getSegmentForIndustry(value.industry);
          if (nextSegmentId === activeSegmentId) return;

          setProfile(emptyProfileFor(getSegmentContext(nextSegmentId)));
          setTriageScores({});
          setTriageSelection(null);
          setModuleInputs({});
        }}
        onNext={goNext('industry')}
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
        onNext={goNext('triage')}
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
        stepLabel={stepLabel('results')}
        onMeasureModule={(id) => {
          // Odkar je "neizmerjeno" izpeljano iz podatkov, se gumb prikaže tudi pri
          // področju, ki JE izbrano, a prazno — brez Set bi id podvojili.
          setTriageSelection([...new Set([...selectedIds, id])]);
          // Naravnost na stran tega področja: sicer bi obiskovalec pristal na prvem
          // in moral do svojega priklikati skozi vsa vmesna.
          openInputsAt(id);
        }}
        onProceedToEmail={() => setStep('emailGate')}
        onBack={() => openInputsAt(inputPages.at(-1)?.[0].id ?? null)}
      />
    );
  }

  if (step === 'emailGate') {
    return (
      <EmailGate
        submitted={submitted}
        followUpSequenceDebug={followUpSequence}
        onSubmit={handleEmailSubmit}
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
