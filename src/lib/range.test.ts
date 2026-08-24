import { describe, it, expect } from 'vitest';
import { buildComputeContextRange, buildTotalsRange, displayRange } from './range';
import {
  emptyProfileFor,
  getSegmentContext,
  industryAverageBand,
  industryAverageScaleBand,
  SEGMENT_CONTEXTS,
} from '../config/contexts';
import { resolveInputs } from './moduleEngine';
import { planiranje } from '../config/modules/proizvodnja';
import type { BusinessProfile } from '../config/contexts';

const PROIZVODNJA = getSegmentContext('proizvodnja')!;

function profileWith(overrides: Partial<BusinessProfile>): BusinessProfile {
  return { ...emptyProfileFor(PROIZVODNJA), ...overrides };
}

describe('buildComputeContextRange', () => {
  it('vnesene vrednosti in privzetki ne dajo razpona', () => {
    // Privzetek dejavnosti se namenoma ne ujema z nobeno sredino pasu, zato zanj
    // razpona ni; vnesena vrednost je točka po definiciji. Invarianto za vse
    // dejavnosti drži config/contexts/contexts.test.ts — tu je le njena posledica.
    expect(buildComputeContextRange(profileWith({}), PROIZVODNJA)).toBeNull();
    expect(
      buildComputeContextRange(
        profileWith({
          operationalHour: { valueEUR: 42, estimated: false, source: 'entered' },
          adminHour: { valueEUR: 33, estimated: false, source: 'entered' },
        }),
        PROIZVODNJA,
      ),
    ).toBeNull();
  });

  it('izbran pas da meji pasu, ostalo ostane točka', () => {
    const band = PROIZVODNJA.operationalHour.bands[1]; // 18–25 EUR, sredina 21
    const contexts = buildComputeContextRange(
      profileWith({
        operationalHour: {
          valueEUR: band.midpointEUR,
          estimated: true,
          source: 'band',
          bandId: band.id,
        },
      }),
      PROIZVODNJA,
    )!;
    expect(contexts.low.operationalHourCostEUR).toBe(band.minEUR);
    expect(contexts.high.operationalHourCostEUR).toBe(band.maxEUR);
    // Neizbrana postavka ostane enaka v obeh kontekstih.
    expect(contexts.low.adminHourCostEUR).toBe(contexts.high.adminHourCostEUR);
  });

  it('prevzeto povprečje panoge da meji pasu, v katerem povprečje leži', () => {
    /**
     * Povprečje je točka, a točka z razpršenostjo — operater za 21 EUR/h je ocena
     * za dejavnost in ne meritev tega podjetja. Zato mora tudi ta vir dati razpon;
     * če bi dal točko, bi se naša ocena prikazala z natančnostjo, ki je nima.
     *
     * Vrednost je enaka privzetku dejavnosti, ki sam razpona NE da (test zgoraj) —
     * razliko naredi izključno zapisani `source`.
     */
    const band = industryAverageBand(PROIZVODNJA.operationalHour)!;
    const contexts = buildComputeContextRange(
      profileWith({
        operationalHour: {
          valueEUR: PROIZVODNJA.operationalHour.fallbackEUR,
          estimated: true,
          source: 'industryAverage',
        },
      }),
      PROIZVODNJA,
    )!;

    expect(contexts.low.operationalHourCostEUR).toBe(band.minEUR);
    expect(contexts.high.operationalHourCostEUR).toBe(band.maxEUR);
  });

  it('prevzeto povprečje da razpon tudi pri deležu, ne le pri urni postavki', () => {
    /**
     * Zrcalo testa zgoraj za velikostne predpostavke. Brez tega je ista poteza
     * obiskovalca merjena z dvema natančnostma: klik "vzemi povprečje" pri urni
     * postavki da razpon, pri marži pa navidezno natančno točko.
     */
    const band = industryAverageScaleBand(PROIZVODNJA.contributionMargin!)!;
    const contexts = buildComputeContextRange(
      profileWith({
        contributionMargin: {
          value: PROIZVODNJA.contributionMargin!.fallback,
          estimated: true,
          source: 'industryAverage',
        },
      }),
      PROIZVODNJA,
    )!;

    expect(contexts.low.contributionMarginRate).toBe(band.min);
    expect(contexts.high.contributionMarginRate).toBe(band.max);
  });
});

describe('buildTotalsRange', () => {
  const band = PROIZVODNJA.operationalHour.bands[1];
  const values = {
    planiranje: resolveInputs(planiranje, {
      waitingHoursPerMonth: 100,
      overtimeHoursPerMonth: 0,
      replanningHoursPerMonth: 0,
      mainCause: 0,
    }),
  };

  it('razpon objema sredinsko vrednost', () => {
    const range = buildTotalsRange({
      modules: [planiranje],
      values,
      profile: profileWith({
        operationalHour: {
          valueEUR: band.midpointEUR,
          estimated: true,
          source: 'band',
          bandId: band.id,
        },
      }),
      context: PROIZVODNJA,
      includePotential: true,
    })!;

    // 100 h × [18, 25] × 12 — sredina 21 je vmes.
    expect(range.capacity.minEUR).toBe(100 * band.minEUR * 12);
    expect(range.capacity.maxEUR).toBe(100 * band.maxEUR * 12);
    expect(range.capacity.minEUR).toBeLessThan(100 * band.midpointEUR * 12);
    expect(range.capacity.maxEUR).toBeGreaterThan(100 * band.midpointEUR * 12);

    // Potencial: min iz spodnjega konteksta, max iz zgornjega (vzrok 0 = planning → 0,65).
    // Razpon izvira SAMO iz razpršenosti urne postavke — odpravljivost je ocenjena
    // enkrat, zato drugega množitelja ni.
    expect(range.potential!.minEUR).toBeCloseTo(range.capacity.minEUR * 0.65, 5);
    expect(range.potential!.maxEUR).toBeCloseTo(range.capacity.maxEUR * 0.65, 5);
  });

  it('brez izbranega pasu vrne null', () => {
    expect(
      buildTotalsRange({
        modules: [planiranje],
        values,
        profile: profileWith({}),
        context: PROIZVODNJA,
      }),
    ).toBeNull();
  });
});

describe('displayRange', () => {
  it('izrojen razpon se prikaže kot točka', () => {
    expect(displayRange({ minEUR: 100, maxEUR: 100 })).toBeNull();
    expect(displayRange({ minEUR: 100.2, maxEUR: 100.4 })).toBeNull();
    expect(displayRange(undefined)).toBeNull();
    expect(displayRange({ minEUR: 100, maxEUR: 200 })).toEqual({ minEUR: 100, maxEUR: 200 });
  });
});

describe('meje pasov v vseh kontekstih', () => {
  it('min ≤ sredina ≤ max in min < max za vsak pas', () => {
    for (const [segmentId, context] of Object.entries(SEGMENT_CONTEXTS)) {
      if (!context) continue;
      const costQuestions = [context.operationalHour, context.adminHour, context.chargeOutRate].filter(
        (question) => question !== undefined,
      );
      for (const question of costQuestions) {
        for (const bandEntry of question.bands) {
          const tag = `${segmentId}/${question.label}/${bandEntry.id}`;
          expect(bandEntry.minEUR, tag).toBeLessThan(bandEntry.maxEUR);
          expect(bandEntry.midpointEUR, tag).toBeGreaterThanOrEqual(bandEntry.minEUR);
          expect(bandEntry.midpointEUR, tag).toBeLessThanOrEqual(bandEntry.maxEUR);
        }
      }
      const scaleQuestions = [context.annualRevenue, context.contributionMargin].filter(
        (question) => question !== undefined,
      );
      for (const question of scaleQuestions) {
        for (const bandEntry of question.bands) {
          const tag = `${segmentId}/${question.label}/${bandEntry.id}`;
          expect(bandEntry.min, tag).toBeLessThan(bandEntry.max);
          expect(bandEntry.midpoint, tag).toBeGreaterThanOrEqual(bandEntry.min);
          expect(bandEntry.midpoint, tag).toBeLessThanOrEqual(bandEntry.max);
        }
      }
    }
  });
});
