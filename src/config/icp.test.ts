import { describe, it, expect } from 'vitest';
import {
  ICP_BANDS,
  ICP_DIMENSIONS,
  dealSizeLabel,
  icpBandOf,
  scoreIcp,
  type IcpSignals,
} from './icp';

/**
 * Model je namenjen uravnavanju: merila idealnega profila še niso dokončna in se
 * bodo premikala. Testi zato varujejo LASTNOSTI modela (uteži, meje, obveznost
 * utemeljitve), ne konkretnih ocen — te se smejo spreminjati brez popravljanja
 * testov, sicer bi vsako uravnavanje pomenilo tudi urejanje testov.
 */

const NOW = '2026-08-06T09:00:00.000Z';

const EMPTY: IcpSignals = {
  employeeCount: 0,
  systemGapMax: 0.3,
  isPantheonCustomer: false,
  roleId: null,
  measuredLossEUR: 0,
  highLossThresholdEUR: 15_000,
  deadlineDates: [],
  confidence: 'low',
  measuredAreaCount: 0,
  offeredAreaCount: 5,
  hasPhone: false,
  hasTaxNumber: false,
  consentOffers: false,
  generatedAtISO: NOW,
};

const IDEAL: IcpSignals = {
  employeeCount: 120,
  systemGapMax: 0.4,
  isPantheonCustomer: false,
  roleId: 'direktor',
  measuredLossEUR: 60_000,
  highLossThresholdEUR: 15_000,
  deadlineDates: ['2026-07-14'], // že potekel
  confidence: 'high',
  measuredAreaCount: 5,
  offeredAreaCount: 5,
  hasPhone: true,
  hasTaxNumber: true,
  consentOffers: true,
  generatedAtISO: NOW,
};

describe('Zgradba modela', () => {
  it('vsota uteži je 1 — sicer "100 točk" ni 100', () => {
    const sum = ICP_DIMENSIONS.reduce((total, dimension) => total + dimension.weight, 0);
    expect(sum).toBeCloseTo(1, 10);
  });

  it('id-ji dimenzij so unikatni', () => {
    const keys = ICP_DIMENSIONS.map((dimension) => dimension.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('vsaka dimenzija vrne utemeljitev — ocene brez razlage ni mogoče umerjati', () => {
    for (const scenario of [EMPTY, IDEAL]) {
      for (const dimension of scoreIcp(scenario).dimensions) {
        expect(dimension.note.length, dimension.key).toBeGreaterThan(10);
      }
    }
  });
});

describe('Meje ocene', () => {
  it('vsaka dimenzija ostane med 0 in 1 tudi pri skrajnih vhodih', () => {
    const extremes: IcpSignals[] = [
      EMPTY,
      IDEAL,
      { ...EMPTY, employeeCount: 100_000, measuredLossEUR: 9_000_000, systemGapMax: 1 },
      { ...EMPTY, measuredLossEUR: -5, systemGapMax: 0, employeeCount: -3 },
      { ...EMPTY, highLossThresholdEUR: undefined, offeredAreaCount: 0 },
      { ...EMPTY, confidence: undefined, roleId: 'nekaj-cisto-novega' },
    ];

    for (const signals of extremes) {
      const score = scoreIcp(signals);
      expect(score.total).toBeGreaterThanOrEqual(0);
      expect(score.total).toBeLessThanOrEqual(100);
      for (const dimension of score.dimensions) {
        expect(dimension.value, dimension.key).toBeGreaterThanOrEqual(0);
        expect(dimension.value, dimension.key).toBeLessThanOrEqual(1);
      }
    }
  });

  it('prazen obrazec ne da visoke ocene, izpolnjen pa je bistveno višji', () => {
    const empty = scoreIcp(EMPTY);
    const ideal = scoreIcp(IDEAL);

    expect(empty.total).toBeLessThan(ICP_BANDS.b);
    expect(ideal.total).toBeGreaterThan(empty.total + 30);
  });

  it('neznana vloga ne podre ocene — nova vloga v kontekstu ne sme ničesar zlomiti', () => {
    const unknown = scoreIcp({ ...IDEAL, roleId: 'popolnoma-nova-vloga' });
    expect(unknown.total).toBeGreaterThan(0);
    expect(unknown.dimensions.find((d) => d.key === 'role')!.value).toBeLessThan(1);
  });
});

describe('Pasovi', () => {
  it('se ne prekrivajo in pokrijejo celoten razpon', () => {
    expect(ICP_BANDS.a).toBeGreaterThan(ICP_BANDS.b);
    expect(icpBandOf(100)).toBe('A');
    expect(icpBandOf(ICP_BANDS.a)).toBe('A');
    expect(icpBandOf(ICP_BANDS.a - 1)).toBe('B');
    expect(icpBandOf(ICP_BANDS.b)).toBe('B');
    expect(icpBandOf(ICP_BANDS.b - 1)).toBe('C');
    expect(icpBandOf(0)).toBe('C');
  });
});

describe('Posamezne dimenzije', () => {
  it('potekel rok šteje več kot oddaljen', () => {
    const past = scoreIcp({ ...EMPTY, deadlineDates: ['2026-07-14'] });
    const future = scoreIcp({ ...EMPTY, deadlineDates: ['2028-01-01'] });
    const urgency = (score: ReturnType<typeof scoreIcp>) =>
      score.dimensions.find((d) => d.key === 'urgency')!.value;

    expect(urgency(past)).toBeGreaterThan(urgency(future));
  });

  it('odsotnost roka je ubesedena previdno — modul E se marsikomu sploh ne prikaže', () => {
    const note = scoreIcp(EMPTY).dimensions.find((d) => d.key === 'urgency')!.note;
    expect(note).toContain('ni nujno podatek o podjetju');
  });

  it('večja vrzel v sistemu da višjo oceno priložnosti', () => {
    const opportunity = (max: number) =>
      scoreIcp({ ...EMPTY, systemGapMax: max }).dimensions.find(
        (d) => d.key === 'opportunity',
      )!.value;

    expect(opportunity(0.4)).toBeGreaterThan(opportunity(0.2));
    expect(opportunity(0.2)).toBeGreaterThan(opportunity(0.08));
  });

  it('status uporabnika PANTHEON je dejstvo v utemeljitvi, ne kazen v oceni', () => {
    // Smer te ocene je poslovna odločitev, ki še ni sprejeta. Dokler ni, uporabnik
    // PANTHEON pri enaki vrzeli ne sme dobiti drugačnega števila točk.
    const base = { ...EMPTY, systemGapMax: 0.2 };
    const pantheon = scoreIcp({ ...base, isPantheonCustomer: true });
    const other = scoreIcp({ ...base, isPantheonCustomer: false });

    const value = (score: ReturnType<typeof scoreIcp>) =>
      score.dimensions.find((d) => d.key === 'opportunity')!.value;
    expect(value(pantheon)).toBe(value(other));
    expect(
      pantheon.dimensions.find((d) => d.key === 'opportunity')!.note,
    ).toContain('Obstoječi uporabnik PANTHEON');
  });

  it('bolečina se meri proti segmentnemu pragu, ne proti absolutni številki', () => {
    const painOf = (loss: number, threshold: number) =>
      scoreIcp({ ...EMPTY, measuredLossEUR: loss, highLossThresholdEUR: threshold }).dimensions.find(
        (d) => d.key === 'pain',
      )!.value;

    // Ista izguba je za računovodski servis (prag 10k) hujša kot za logistiko (20k).
    expect(painOf(20_000, 10_000)).toBeGreaterThan(painOf(20_000, 20_000));
  });
});

describe('Velikost posla', () => {
  it('narašča z velikostjo podjetja in je totalna funkcija', () => {
    expect(dealSizeLabel(5)).toBe('majhen posel');
    expect(dealSizeLabel(30)).toBe('srednji posel');
    expect(dealSizeLabel(120)).toBe('večji posel');
    expect(dealSizeLabel(900)).toContain('velik posel');
    expect(dealSizeLabel(0)).toBeTruthy();
  });
});
