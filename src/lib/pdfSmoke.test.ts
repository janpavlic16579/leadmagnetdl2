import { describe, it, expect } from 'vitest';
import { buildResultsPdfFile } from './pdf';
import { buildSalesPdfFile } from './pdfSales';
import { buildSalesReport } from './salesReport';
import { aggregateResults, assessConfidence, buildComputeContext } from './potential';
import { computeModules, findHighestModule, resolveInputs } from './moduleEngine';
import { getModules } from '../config/modules';
import { SEGMENTS, SEGMENT_ORDER } from '../config/segments';
import { emptyProfileFor, getSegmentContext } from '../config/contexts';

/**
 * Dimni test izrisa: PDF se res sestavi.
 *
 * pdf.test.ts varuje MEJO med dokumentoma, tega pa nihče: `tsc` v testih ne teče
 * (vitest tipov ne preverja), zato je manjkajoč uvoz `RISK_LEVEL_UNRATED_LABEL`
 * prišel skozi vseh 473 testov in bi se pokazal šele obiskovalcu — kot
 * ReferenceError sredi oddaje, po kateri se lead ne pošlje nikamor.
 *
 * Ključni primer je NEDOTAKNJENA DIAGNOSTIKA: diagnostični izidi tedaj nimajo
 * `riskLevel` in prav ta veja je bila pokvarjena. Ker je to hkrati privzeta pot
 * (obiskovalec diagnostike ne izpolni), test teče brez vsakega vnosa.
 */

/** Vhod za oba generatorja, sestavljen po isti poti kot CalculatorFlow. */
function scenarioFor(segmentId: (typeof SEGMENT_ORDER)[number], values: Record<string, Record<string, number>> = {}) {
  const segment = SEGMENTS[segmentId];
  const context = getSegmentContext(segmentId);
  const profile = emptyProfileFor(context);
  const modules = getModules(segment.moduleIds);
  const resolved: Record<string, Record<string, number>> = {};
  for (const definition of modules) {
    resolved[definition.id] = resolveInputs(definition, values[definition.id]);
  }
  const outputs = computeModules(modules, resolved, buildComputeContext(profile));
  const totals = aggregateResults(outputs, {
    includePotential: context !== undefined,
    confidence: context
      ? assessConfidence({ profile, context, modules, values: resolved, outputs })
      : undefined,
  });

  return {
    segment,
    context,
    profile,
    modules,
    resolved,
    outputs,
    totals,
    highestModule: findHighestModule(outputs, segment.moduleIds),
  };
}

describe('Strankin PDF se sestavi', () => {
  it.each(SEGMENT_ORDER)('%s — brez vnosov, z nedotaknjeno diagnostiko', async (segmentId) => {
    const scenario = scenarioFor(segmentId);
    // Brez odgovorov diagnostike izidi nimajo stopnje tveganja — veja, ki se je
    // sesuvala. Če je tu prazno, test ne preverja ničesar in mora pasti.
    expect(scenario.totals.risks.some((risk) => !risk.riskLevel)).toBe(true);

    const file = await buildResultsPdfFile({
      segment: scenario.segment,
      companyName: 'Testno podjetje d.o.o.',
      outputs: scenario.outputs,
      totals: scenario.totals,
      highestModule: scenario.highestModule,
    });

    expect(file.filename).toMatch(/\.pdf$/);
    expect(file.blob.size).toBeGreaterThan(1000);
  });
});

describe('Prodajni PDF se sestavi', () => {
  it('z nedotaknjeno diagnostiko', async () => {
    const scenario = scenarioFor('proizvodnja');
    const report = buildSalesReport({
      generatedAtISO: '2026-01-15T09:00:00.000Z',
      contact: {
        firstName: 'Test',
        lastName: 'Testni',
        companyName: 'Testno podjetje d.o.o.',
        email: 'test@example.com',
        phone: '',
        taxNumber: '',
      },
      consents: { consentProcessing: true, consentOffers: false, consentContent: false },
      utmSource: null,
      industry: 'proizvodnja',
      employeeCount: 45,
      segment: scenario.segment,
      context: scenario.context,
      profile: scenario.profile,
      segmentModules: scenario.modules,
      activeModules: scenario.modules,
      values: scenario.resolved,
      triageScores: {},
      outputs: scenario.outputs,
      totals: scenario.totals,
      totalsRange: null,
      highestModule: scenario.highestModule,
      followUpSequence: 'low-loss-newsletter',
    });

    const file = await buildSalesPdfFile(report);
    expect(file.blob.size).toBeGreaterThan(1000);
  });
});
