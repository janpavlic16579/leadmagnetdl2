import { useEffect, useMemo, useState } from 'react';
import { MODULE_E_ITEMS, SEGMENTS, type SegmentId } from '../../config/segments';
import { getIndustryLabel, getSegmentForIndustry } from '../../config/industries';
import { getSizeClass } from '../../config/sizeClasses';
import {
  calculateAccountingCapacity,
  calculateModuleA,
  calculateModuleB,
  calculateModuleC,
  calculateModuleD,
  calculateTotalAnnualLoss,
  findHighestModule,
  hasAnyModuleERisk,
  type ModuleAResult,
  type ModuleBResult,
  type ModuleCResult,
  type ModuleDResult,
  type ModuleEChecked,
} from '../../lib/calculations';
import { selectFollowUpSequence } from '../../lib/followUp';
import { downloadAsCsv, downloadAsJson, type LeadExportRecord } from '../../lib/exportRecord';
import type { BasicInfo, FlowStep, ModuleInputsState } from '../../types';
import { StepBasicInfo } from './StepBasicInfo';
import { StepInputs } from './StepInputs';
import { SegmentLanding } from './SegmentLanding';
import { ResultsView } from '../Results/ResultsView';
import { EmailGate } from '../Results/EmailGate';

const EMPTY_E_CHECKED: ModuleEChecked = {
  sqlServer2016: false,
  windowsServer2016: false,
  eInvoiceZierded: false,
};

interface CalculatorFlowProps {
  /** Segment iz ?s= — če je podan, se ne izpelje iz dejavnosti (kampanjska povezava). */
  initialSegmentOverride: SegmentId | null;
  utmSource: string | null;
  /** Obvesti starša o trenutno aktivnem segmentu (npr. za logotip v headerju). */
  onActiveSegmentChange?: (id: SegmentId) => void;
}

interface ComputedResults {
  A?: ModuleAResult;
  B?: ModuleBResult;
  C?: ModuleCResult;
  D?: ModuleDResult;
}

export function CalculatorFlow({ initialSegmentOverride, utmSource, onActiveSegmentChange }: CalculatorFlowProps) {
  const [step, setStep] = useState<FlowStep>('basicInfo');
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({ industry: '', employeeCount: 0 });
  const [moduleInputs, setModuleInputs] = useState<ModuleInputsState>({});
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

  const effectiveInputs = useMemo(() => {
    const modules = segment.modulesEnabled;
    return {
      A: modules.includes('A') && segment.defaults.A ? { ...segment.defaults.A, ...moduleInputs.A } : undefined,
      B: modules.includes('B') && segment.defaults.B ? { ...segment.defaults.B, ...moduleInputs.B } : undefined,
      C: modules.includes('C') && segment.defaults.C ? { ...segment.defaults.C, ...moduleInputs.C } : undefined,
      D: modules.includes('D') && segment.defaults.D ? { ...segment.defaults.D, ...moduleInputs.D } : undefined,
      E: modules.includes('E') ? { ...EMPTY_E_CHECKED, ...moduleInputs.E } : EMPTY_E_CHECKED,
    };
  }, [segment, moduleInputs]);

  const results: ComputedResults = useMemo(
    () => ({
      A: effectiveInputs.A ? calculateModuleA(effectiveInputs.A) : undefined,
      B: effectiveInputs.B ? calculateModuleB(effectiveInputs.B) : undefined,
      C: effectiveInputs.C ? calculateModuleC(effectiveInputs.C) : undefined,
      D: effectiveInputs.D ? calculateModuleD(effectiveInputs.D) : undefined,
    }),
    [effectiveInputs],
  );

  const totalAnnualLossEUR = calculateTotalAnnualLoss(results);
  const highestModule = findHighestModule(results);
  const moduleERisk = hasAnyModuleERisk(effectiveInputs.E);

  const accountingCapacity =
    segment.id === 'racunovodstvo' && segment.accountingCapacity && results.A
      ? calculateAccountingCapacity(results.A.hoursFreedPerMonth, segment.accountingCapacity.avgHoursPerClientPerMonth)
      : undefined;

  const followUpSequence = selectFollowUpSequence({
    segment: segment.id,
    totalAnnualLossEUR,
    hasModuleERisk: moduleERisk,
    highLossThresholdEUR: segment.highLossThresholdEUR,
    highLossThresholdHoursPerMonth: segment.highLossThresholdHoursPerMonth,
    hoursFreedPerMonth: results.A?.hoursFreedPerMonth,
  });

  async function handleEmailSubmit({ companyName, email }: { companyName: string; email: string }) {
    const timestampISO = new Date().toISOString();
    const moduleERisksChecked = (Object.keys(effectiveInputs.E) as Array<keyof ModuleEChecked>).filter(
      (key) => effectiveInputs.E[key],
    );

    const record: LeadExportRecord = {
      timestampISO,
      segment: segment.id,
      industry: basicInfo.industry,
      industryLabel: getIndustryLabel(basicInfo.industry),
      sizeClass: getSizeClass(basicInfo.employeeCount),
      employeeCount: basicInfo.employeeCount,
      companyName,
      email,
      gdprConsent: true,
      inputs: {
        ...(effectiveInputs.A ?? {}),
        ...(effectiveInputs.B ?? {}),
        ...(effectiveInputs.C ?? {}),
        ...(effectiveInputs.D ?? {}),
      },
      results: {
        A: results.A ? { annualEUR: results.A.annualEUR, hoursFreedPerMonth: results.A.hoursFreedPerMonth } : undefined,
        B: results.B ? { annualEUR: results.B.annualEUR } : undefined,
        C: results.C ? { releasedCapitalEUR: results.C.releasedCapitalEUR, annualEUR: results.C.annualEUR } : undefined,
        D: results.D ? { annualEUR: results.D.annualEUR } : undefined,
      },
      totalAnnualLossEUR,
      moduleERisksChecked,
      followUpSequence,
      utmSource,
    };

    const moduleEWarnings = MODULE_E_ITEMS.filter((item) => effectiveInputs.E[item.id]).map((item) => item.warningText);

    downloadAsJson(record);
    downloadAsCsv(record);

    // jsPDF je težka knjižnica in je potrebna šele tu — naloži se ob oddaji, ne ob prvem prikazu strani.
    const { generateResultsPdf } = await import('../../lib/pdf');
    generateResultsPdf({
      segment,
      companyName,
      results,
      totalAnnualLossEUR,
      moduleEWarnings,
      highestModule,
    });

    setSubmitted(true);
  }

  if (step === 'basicInfo') {
    return <StepBasicInfo value={basicInfo} onChange={setBasicInfo} onNext={() => setStep('inputs')} />;
  }

  if (step === 'changeSegment') {
    return (
      <SegmentLanding
        activeSegmentId={activeSegmentId}
        onSelect={(id) => {
          setSegmentOverride(id);
          setStep('inputs');
        }}
        onBack={() => setStep('inputs')}
      />
    );
  }

  if (step === 'inputs') {
    return (
      <StepInputs
        segment={segment}
        value={moduleInputs}
        onChange={setModuleInputs}
        liveTotalEUR={totalAnnualLossEUR}
        onNext={() => setStep('results')}
        onBack={() => setStep('basicInfo')}
        onChangeSegment={() => setStep('changeSegment')}
      />
    );
  }

  if (step === 'results') {
    return (
      <ResultsView
        segment={segment}
        results={results}
        totalAnnualLossEUR={totalAnnualLossEUR}
        moduleEChecked={effectiveInputs.E}
        accountingCapacity={accountingCapacity}
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
