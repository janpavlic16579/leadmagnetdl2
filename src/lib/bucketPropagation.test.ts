import { describe, it, expect } from 'vitest';
import { getSegmentCopy } from '../config/copy';
import { buildSalesReport, type BuildSalesReportParams } from './salesReport';
import { buildSalesReportHtml } from './salesReportHtml';
import { computeModules, resolveActiveModules, resolveInputs } from './moduleEngine';
import { aggregateResults, assessConfidence, buildComputeContext } from './potential';
import { selectFollowUpSequence } from './followUp';
import { emptyProfileFor, getSegmentContext } from '../config/contexts';
import { getModules } from '../config/modules';
import { SEGMENTS } from '../config/segments';
import pdfSource from './pdf.ts?raw';

/**
 * Koš lostMargin je bil uveden z maloprodajo in NI bil propagiran v potrošnike
 * seštevkov: strankin PDF, povzetek prodajne priprave, "Skupaj" področja, živi
 * seštevek in prag follow-upa so šteli samo directLoss (+ capacity). Trgovec z
 * največjo postavko "prazne police" je dobil poročilo, kjer te postavke ni bilo.
 *
 * Ta test je priča: vsak potrošnik BucketTotals mora obravnavati vse letne koše.
 */

/** Maloprodajni scenarij z neničelno nezasluženo maržo, po isti poti kot CalculatorFlow. */
function retailReport() {
  const segment = SEGMENTS.maloprodaja;
  const context = getSegmentContext('maloprodaja');
  const segmentModules = getModules(segment.moduleIds);

  const profile = emptyProfileFor(context);
  profile.currentSystem = context?.currentSystem.options[0].id ?? null;
  profile.businessType = context?.businessType.options[0].id ?? null;
  profile.role = context?.role.options[0].id ?? null;
  profile.annualRevenue = { value: 2_000_000, estimated: false, source: 'entered' };
  profile.contributionMargin = { value: 0.3, estimated: false, source: 'entered' };

  const selected = ['razpolozljivostMp'];
  const activeModules = resolveActiveModules(segmentModules, selected);

  const values: Record<string, Record<string, number>> = {};
  for (const definition of activeModules) {
    values[definition.id] = resolveInputs(
      definition,
      definition.id === 'razpolozljivostMp'
        ? { lostSalesSharePercent: 0.02, substitutionShare: 2, expressDeliveryCostEUR: 4_000 }
        : undefined,
    );
  }

  const outputs = computeModules(activeModules, values, buildComputeContext(profile));
  const totals = aggregateResults(outputs, {
    includePotential: context !== undefined,
    confidence: context
      ? assessConfidence({ profile, context, modules: activeModules, values, outputs })
      : undefined,
  });

  const params: BuildSalesReportParams = {
    generatedAtISO: '2026-08-05T09:30:00.000Z',
    contact: {
      firstName: 'Ana',
      lastName: 'Trgovka',
      companyName: 'Polica d.o.o.',
      email: 'ana@example.com',
      phone: '',
      taxNumber: '',
    },
    consents: { consentProcessing: true, consentOffers: false, consentContent: false, consentConsulting: false },
    utmSource: null,
    industry: 'maloprodaja',
    employeeCount: 30,
    segment,
    context,
    profile,
    segmentModules,
    activeModules,
    values,
    triageScores: {},
    outputs,
    totals,
    highestModule: 'razpolozljivostMp',
    followUpSequence: 'low-loss-newsletter',
  };

  return { report: buildSalesReport(params), totals, segment };
}

describe('lostMargin doseže vse potrošnike seštevkov', () => {
  it('scenarij ima neničelno nezasluženo maržo (sicer test ne priča ničesar)', () => {
    const { totals } = retailReport();
    // 2 mio × 2 % × 0,30 × (1 − 0,2) = 9 600 EUR
    expect(totals.lostMarginEUR).toBeCloseTo(9_600, 0);
  });

  it('povzetek prodajne priprave nosi lostMarginEUR', () => {
    const { report, totals } = retailReport();
    expect(report.summary.lostMarginEUR).toBe(totals.lostMarginEUR);
  });

  it('"Skupaj" področja je vsota VSEH letnih postavk pod njim', () => {
    const { report } = retailReport();
    const area = report.measured.find((item) => item.moduleId === 'razpolozljivostMp')!;
    const annualSum = area.outputs
      .filter((output) => output.bucket !== 'oneTimeCapital' && output.bucket !== 'risk')
      .reduce((sum, output) => sum + (output.valueEUR ?? 0), 0);
    expect(area.totalEUR).toBeCloseTo(annualSum, 5);
    expect(area.totalEUR).toBeGreaterThan(9_000);
  });

  it('velikost posla in ICP bolečina štejeta tudi maržo', () => {
    const { report, totals } = retailReport();
    expect(report.playbook.dealSizing.measuredLossEUR).toBeCloseTo(
      totals.directLossEUR + totals.lostMarginEUR + totals.capacityEUR,
      5,
    );
  });

  it('HTML prodajne priprave maržo prikaže kot kartico', () => {
    const { report } = retailReport();
    expect(buildSalesReportHtml(report)).toContain('Nezaslužena letna marža');
  });

  it('prag follow-upa jo šteje: marža sama lahko sproži high-loss', () => {
    const sequence = selectFollowUpSequence({
      segment: 'maloprodaja',
      annualLossEUR: 16_000, // npr. 1 000 directLoss + 15 000 lostMargin
      hasModuleERisk: false,
      highLossThresholdEUR: SEGMENTS.maloprodaja.highLossThresholdEUR,
    });
    expect(sequence).toBe('high-loss-no-risk');
  });

  it('strankin PDF maržo pozna (kartica, tabela in graf)', () => {
    // PDF vsebine ni mogoče grepati po bajtih (jsPDF tokove stisne) — meja se
    // preverja pri vhodu, enako kot v pdf.test.ts.
    expect(pdfSource).toContain('lostMarginEUR');
    // Naslov kartice je od selitve besedil v config/copy tam in ne več tu; grep
    // po njem bi odslej preverjal samo, da nekdo ni prepisal niza nazaj v pdf.ts.
    expect(pdfSource).toContain('copy.figures.lostMargin');
    expect(getSegmentCopy('maloprodaja').figures.lostMargin.title).toBe('Nezaslužena letna marža');
    expect(pdfSource).toContain("rowsForBucket(params.outputs, 'lostMargin')");
  });
});
