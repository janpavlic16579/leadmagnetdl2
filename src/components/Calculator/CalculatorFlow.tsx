import { useEffect, useMemo, useState } from 'react';
import { SEGMENTS, type SegmentId } from '../../config/segments';
import { getModules } from '../../config/modules';
import { getIndustryLabel, getSegmentForIndustry } from '../../config/industries';
import { getSizeClass } from '../../config/sizeClasses';
import { calculateAccountingCapacity } from '../../lib/calculations';
import {
  aggregateBuckets,
  computeModules,
  findHighestModule,
  groupByModule,
  resolveActiveModules,
  resolveInputs,
  selectTopModules,
  type TriageScores,
} from '../../lib/moduleEngine';
import { selectFollowUpSequence } from '../../lib/followUp';
import { downloadAsCsv, downloadAsJson, type LeadExportRecord } from '../../lib/exportRecord';
import type { BasicInfo, FlowStep, ModuleInputsState } from '../../types';
import { StepBasicInfo } from './StepBasicInfo';
import { StepTriage } from './StepTriage';
import { StepInputs } from './StepInputs';
import { SegmentLanding } from './SegmentLanding';
import { ResultsView } from '../Results/ResultsView';
import { EmailGate } from '../Results/EmailGate';

interface CalculatorFlowProps {
  /** Segment iz ?s= — če je podan, se ne izpelje iz dejavnosti (kampanjska povezava). */
  initialSegmentOverride: SegmentId | null;
  utmSource: string | null;
  /** Obvesti starša o trenutno aktivnem segmentu (npr. za logotip v headerju). */
  onActiveSegmentChange?: (id: SegmentId) => void;
}

export function CalculatorFlow({ initialSegmentOverride, utmSource, onActiveSegmentChange }: CalculatorFlowProps) {
  const [step, setStep] = useState<FlowStep>('basicInfo');
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({ industry: '', employeeCount: 0 });
  const [moduleInputs, setModuleInputs] = useState<ModuleInputsState>({});
  const [triageScores, setTriageScores] = useState<TriageScores>({});
  /** null = uporabnik še ni bil v triaži; takrat velja samodejni predlog. */
  const [triageSelection, setTriageSelection] = useState<string[] | null>(null);
  const [submitted, setSubmitted] = useState(false);

  /**
   * Ročno izbran profil — nastavi ga kampanjski ?s= ali uporabnik prek "spremeni".
   * Kadar je null, se segment izpelje iz izbrane dejavnosti.
   */
  const [segmentOverride, setSegmentOverride] = useState<SegmentId | null>(initialSegmentOverride);

  const activeSegmentId = segmentOverride ?? getSegmentForIndustry(basicInfo.industry);
  const segment = SEGMENTS[activeSegmentId];

  useEffect(() => {
    onActiveSegmentChange?.(activeSegmentId);
  }, [activeSegmentId, onActiveSegmentChange]);

  const segmentModules = useMemo(() => getModules(segment.moduleIds), [segment]);
  /** Samo moduli s triažo se lahko izločijo; diagnostični in E se prikažejo vedno. */
  const triageableIds = useMemo(
    () => segmentModules.filter((definition) => definition.triage).map((definition) => definition.id),
    [segmentModules],
  );

  const detailCount = segment.triage?.detailCount ?? 0;
  const autoSelection = useMemo(
    () => (segment.triage ? selectTopModules(triageableIds, triageScores, detailCount) : []),
    [segment.triage, triageableIds, triageScores, detailCount],
  );
  const selectedIds = triageSelection ?? autoSelection;

  const activeModules = useMemo(
    () => resolveActiveModules(segmentModules, segment.triage ? selectedIds : null),
    [segmentModules, segment.triage, selectedIds],
  );

  /** Vrednosti, dopolnjene s privzetimi — modul nikoli ne dobi delnega vnosa. */
  const resolvedValues = useMemo(() => {
    const values: Record<string, Record<string, number>> = {};
    for (const definition of activeModules) {
      values[definition.id] = resolveInputs(definition, moduleInputs[definition.id]);
    }
    return values;
  }, [activeModules, moduleInputs]);

  const outputs = useMemo(
    () => computeModules(activeModules, resolvedValues),
    [activeModules, resolvedValues],
  );
  const totals = useMemo(() => aggregateBuckets(outputs), [outputs]);
  const highestModule = findHighestModule(outputs, segment.moduleIds);

  const accountingCapacity =
    segment.id === 'racunovodstvo' && segment.accountingCapacity
      ? calculateAccountingCapacity(totals.capacityHoursPerMonth || hoursFromDirectLoss(outputs), segment.accountingCapacity.avgHoursPerClientPerMonth)
      : undefined;

  const followUpSequence = selectFollowUpSequence({
    segment: segment.id,
    directLossEUR: totals.directLossEUR,
    hasModuleERisk: totals.risks.length > 0,
    highLossThresholdEUR: segment.highLossThresholdEUR,
  });

  /** Moduli, ki jih obiskovalec ni izbral — na rezultatih jih pokažemo kot neizmerjene. */
  const unmeasuredModules = segmentModules.filter(
    (definition) => definition.triage && !selectedIds.includes(definition.id),
  );

  const stepLabel = (current: number) =>
    `Korak ${current} od ${segment.triage ? 4 : 3}`;

  async function handleEmailSubmit({ companyName, email }: { companyName: string; email: string }) {
    const record: LeadExportRecord = {
      timestampISO: new Date().toISOString(),
      segment: segment.id,
      industry: basicInfo.industry,
      industryLabel: getIndustryLabel(basicInfo.industry),
      sizeClass: getSizeClass(basicInfo.employeeCount),
      employeeCount: basicInfo.employeeCount,
      companyName,
      email,
      gdprConsent: true,
      selectedModules: activeModules.map((definition) => definition.id),
      triageScores,
      moduleInputs: resolvedValues,
      outputs,
      totals: {
        directLossEUR: totals.directLossEUR,
        capacityEUR: totals.capacityEUR,
        capacityHoursPerMonth: totals.capacityHoursPerMonth,
        oneTimeCapitalEUR: totals.oneTimeCapitalEUR,
      },
      followUpSequence,
      utmSource,
    };

    downloadAsJson(record);
    downloadAsCsv(record);

    // jsPDF je težka knjižnica in je potrebna šele tu — naloži se ob oddaji, ne ob prvem prikazu strani.
    const { generateResultsPdf } = await import('../../lib/pdf');
    generateResultsPdf({
      segment,
      companyName,
      outputs,
      totals,
      highestModule,
      accountingCapacity,
    });

    setSubmitted(true);
  }

  if (step === 'basicInfo') {
    return (
      <StepBasicInfo
        value={basicInfo}
        onChange={setBasicInfo}
        onNext={() => setStep(segment.triage ? 'triage' : 'inputs')}
      />
    );
  }

  if (step === 'changeSegment') {
    return (
      <SegmentLanding
        activeSegmentId={activeSegmentId}
        onSelect={(id) => {
          setSegmentOverride(id);
          // Triažna izbira velja za prejšnji segment — ob zamenjavi se zavrže.
          setTriageSelection(null);
          setStep(SEGMENTS[id].triage ? 'triage' : 'inputs');
        }}
        onBack={() => setStep('inputs')}
      />
    );
  }

  if (step === 'triage') {
    return (
      <StepTriage
        modules={segmentModules.filter((definition) => definition.triage)}
        scores={triageScores}
        onScoresChange={(scores) => {
          setTriageScores(scores);
          // Ročni popravek velja le, dokler uporabnik ne spremeni ocen.
          setTriageSelection(null);
        }}
        selected={selectedIds}
        onSelectedChange={setTriageSelection}
        maxSelected={detailCount + 1}
        stepLabel={stepLabel(2)}
        onNext={() => setStep('inputs')}
        onBack={() => setStep('basicInfo')}
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
        liveTotalEUR={totals.directLossEUR}
        stepLabel={stepLabel(segment.triage ? 3 : 2)}
        onNext={() => setStep('results')}
        onBack={() => setStep(segment.triage ? 'triage' : 'basicInfo')}
        onChangeSegment={() => setStep('changeSegment')}
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
        stepLabel={stepLabel(segment.triage ? 4 : 3)}
        onMeasureModule={(id) => {
          setTriageSelection([...selectedIds, id]);
          setStep('inputs');
        }}
        onProceedToEmail={() => setStep('emailGate')}
        onBack={() => setStep('inputs')}
      />
    );
  }

  return (
    <EmailGate
      submitted={submitted}
      followUpSequenceDebug={followUpSequence}
      onSubmit={handleEmailSubmit}
      onBack={() => setStep('results')}
    />
  );
}

/**
 * Računovodstvo meri kapaciteto prek modula A, ki je zaradi ohranjene matematike
 * v košu directLoss — sproščene ure zato poberemo iz izidov, ne iz koša capacity.
 */
function hoursFromDirectLoss(outputs: { hoursPerMonth?: number }[]): number {
  return outputs.reduce((sum, output) => sum + (output.hoursPerMonth ?? 0), 0);
}
