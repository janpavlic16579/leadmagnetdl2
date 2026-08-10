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
  type TriageScores,
} from '../../lib/moduleEngine';
import { aggregateResults, assessConfidence, buildComputeContext } from '../../lib/potential';
import { selectFollowUpSequence } from '../../lib/followUp';
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

  const stepLabel = (current: FlowStep) =>
    `Korak ${stepOrder.indexOf(current) + 1} od ${stepOrder.length}`;
  const goNext = (current: FlowStep) => () => setStep(stepOrder[stepOrder.indexOf(current) + 1]);
  const goBack = (current: FlowStep) => () => setStep(stepOrder[stepOrder.indexOf(current) - 1]);

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
    directLossEUR: totals.directLossEUR,
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
    const [{ buildResultsPdfFile }, { buildSalesReport }, { buildSalesPdfFile }, { buildSalesHtmlFile }, { downloadSequentially }] =
      await Promise.all([
        import('../../lib/pdf'),
        import('../../lib/salesReport'),
        import('../../lib/pdfSales'),
        import('../../lib/salesReportHtml'),
        import('../../lib/download'),
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
        highestModule,
        followUpSequence,
      });
      setSalesReport(report);
      salesFiles.push(await buildSalesPdfFile(report), buildSalesHtmlFile(report));
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
    return (
      <StepInputs
        segment={segment}
        modules={activeModules}
        values={resolvedValues}
        raw={moduleInputs}
        onChange={setModuleInputs}
        liveTotalEUR={totals.directLossEUR + totals.capacityEUR}
        stepLabel={stepLabel('inputs')}
        onNext={goNext('inputs')}
        onBack={goBack('inputs')}
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
        accountingCapacity={accountingCapacity}
        unmeasuredModules={unmeasuredModules}
        stepLabel={stepLabel('results')}
        onMeasureModule={(id) => {
          // Odkar je "neizmerjeno" izpeljano iz podatkov, se gumb prikaže tudi pri
          // področju, ki JE izbrano, a prazno — brez Set bi id podvojili.
          setTriageSelection([...new Set([...selectedIds, id])]);
          setStep('inputs');
        }}
        onProceedToEmail={() => setStep('emailGate')}
        onBack={() => setStep('inputs')}
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
