import { describe, it, expect } from 'vitest';
import { buildSalesReportHtml } from './salesReportHtml';
import type { SalesReport } from './salesReport';

/**
 * HTML se odpre kot datoteka v brskalniku, ime podjetja pa vpiše obiskovalec —
 * to je edino mesto v aplikaciji, kjer njegov vnos konča kot oznake na strani.
 */

const BASE: SalesReport = {
  meta: {
    generatedAtISO: '2026-08-05T09:30:00.000Z',
    companyName: 'Kovinar & sin d.o.o.',
    email: 'info@kovinar.si',
    gdprConsent: true,
    utmSource: null,
  },
  qualification: {
    industryLabel: 'Trgovina, veleprodaja in distribucija',
    segmentName: 'Veleprodaja in distribucija',
    sizeClass: '10–49',
    employeeCount: 30,
    roleLabel: 'Direktor/-ica',
    businessTypeLabel: 'Veleprodaja poslovnim kupcem',
    currentSystemLabel: 'Večinoma Excel, papir ali sprotni dogovor',
    isPantheonCustomer: false,
    improvementBand: { min: 0.25, max: 0.4 },
    followUpSequence: 'high-loss-no-risk',
  },
  summary: {
    directLossEUR: 45_000,
    capacityEUR: 64_440,
    capacityHoursPerMonth: 215,
    oneTimeCapitalEUR: 0,
    confidence: 'low',
    confidenceReason: 'Zneski so spodnja meja.',
  },
  softness: { hourAssumptions: [], unknownAnswers: [], untouchedFields: [] },
  triage: [],
  measured: [],
  risks: [],
  actionPlan: null,
  highestModuleTitle: null,
};

describe('buildSalesReportHtml', () => {
  it('je samostojna datoteka brez zunanjih virov', () => {
    // Odpira se prek file://, kjer vsak zunanji vir tiho odpove, in je namenjena
    // pošiljanju naprej — delovati mora tudi brez omrežja.
    const html = buildSalesReportHtml(BASE);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).not.toMatch(/<link[^>]+href=/i);
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/https?:\/\//);
  });

  it('ubeži ime podjetja — edini vnos obiskovalca, ki pristane v oznakah', () => {
    const html = buildSalesReportHtml({
      ...BASE,
      meta: { ...BASE.meta, companyName: '<img src=x onerror=alert(1)>' },
    });

    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x');
  });

  it('vsebuje ključne razdelke priprave', () => {
    const html = buildSalesReportHtml(BASE);
    expect(html).toContain('Kdo je stranka');
    expect(html).toContain('Kje so številke trdne in kje ne');
    expect(html).toContain('Kovinar &amp; sin d.o.o.');
    expect(html).toContain('info@kovinar.si');
  });

  it('pove, da tehnična opozorila niso bila prikazana, kadar stranka ni na PANTHEON-u', () => {
    // Brez te povedi bi prazen razdelek s tveganji izpadel kot podatek o podjetju.
    expect(buildSalesReportHtml(BASE)).toContain('niso bila prikazana');
    const pantheon = buildSalesReportHtml({
      ...BASE,
      qualification: { ...BASE.qualification, isPantheonCustomer: true },
    });
    expect(pantheon).not.toContain('niso bila prikazana');
  });
});
