import { describe, it, expect } from 'vitest';
import { FALLBACK_IMPROVEMENT_BAND, SEGMENT_CONTEXTS, emptyProfileFor } from './index';
import { SEGMENTS } from '../segments';
import type { ContextQuestion, CostQuestion, SegmentContext } from './contextTypes';

/**
 * Varovala registra kontekstov.
 *
 * Tipi držijo, da ima vsaka možnost sistema pas izboljšave. Vsega ostalega ne
 * morejo: da je vsaj ena možnost označena kot PANTHEON, da so id-ji znotraj
 * vprašanja unikatni in da sredine stroškovnih pasov niso enake. Vsaka od teh
 * napak se prevede in se pokaže šele obiskovalcu — praviloma kot tiho napačen
 * zaslon, ne kot zrušitev.
 */

const ENTRIES = Object.entries(SEGMENT_CONTEXTS) as [string, SegmentContext][];

/** Vsa tri kontekstna vprašanja dejavnosti na kupu. */
function questionsOf(context: SegmentContext): [string, ContextQuestion][] {
  return [
    ['businessType', context.businessType],
    ['currentSystem', context.currentSystem],
    ['role', context.role],
  ];
}

/** Vse urne postavke, ki jih dejavnost vpraša — zaračunana je neobvezna. */
function ratesOf(context: SegmentContext): [string, CostQuestion][] {
  const rates: [string, CostQuestion][] = [
    ['operationalHour', context.operationalHour],
    ['adminHour', context.adminHour],
  ];
  if (context.chargeOutRate) rates.push(['chargeOutRate', context.chargeOutRate]);
  return rates;
}

describe('Register kontekstov dejavnosti', () => {
  it('ni prazen — sicer bi bil ves korak konteksta mrtva koda', () => {
    expect(ENTRIES.length).toBeGreaterThan(0);
  });

  it('vsak vpisan segment obstaja v SEGMENTS', () => {
    for (const [segmentId] of ENTRIES) {
      expect(SEGMENTS[segmentId as keyof typeof SEGMENTS], segmentId).toBeDefined();
    }
  });

  it('vsaka dejavnost ima vsaj eno možnost, označeno kot PANTHEON', () => {
    // Brez nje isTechnicalRiskModuleVisible vrne false za VSAK odgovor in modul E
    // tiho izgine iz cele dejavnosti — brez napake in brez sledi v vprašalniku.
    for (const [segmentId, context] of ENTRIES) {
      const pantheon = context.currentSystem.options.filter((option) => option.isPantheon);
      expect(pantheon.length, `${segmentId}: nobena možnost ni isPantheon`).toBeGreaterThan(0);
    }
  });

  it('pas izboljšave je smiseln in ne obljublja preveč', () => {
    for (const [segmentId, context] of ENTRIES) {
      for (const option of context.currentSystem.options) {
        const where = `${segmentId}/${option.id}`;
        expect(option.band.min, where).toBeGreaterThan(0);
        expect(option.band.min, where).toBeLessThan(option.band.max);
        expect(option.band.max, where).toBeLessThan(1);
      }
    }
  });

  it('nadomestni pas ni ugodnejši od nobene ponujene možnosti', () => {
    // "Brez odgovora vzamemo srednji pas — nikoli najugodnejšega." Doslej je bilo
    // to zapisano samo v komentarju.
    for (const [segmentId, context] of ENTRIES) {
      const widest = Math.max(...context.currentSystem.options.map((option) => option.band.max));
      expect(FALLBACK_IMPROVEMENT_BAND.max, segmentId).toBeLessThan(widest);
    }
  });

  it('id-ji možnosti so znotraj vprašanja unikatni', () => {
    // Id gre v izvozni zapis za CRM, hkrati pa ključi radie v StepContext.
    for (const [segmentId, context] of ENTRIES) {
      for (const [name, question] of questionsOf(context)) {
        const ids = question.options.map((option) => option.id);
        expect(new Set(ids).size, `${segmentId}/${name}`).toBe(ids.length);
      }
    }
  });

  it('vsako vprašanje ima legendo in vsaj dve možnosti', () => {
    for (const [segmentId, context] of ENTRIES) {
      for (const [name, question] of questionsOf(context)) {
        expect(question.legend.length, `${segmentId}/${name}`).toBeGreaterThan(0);
        expect(question.options.length, `${segmentId}/${name}`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('sredine stroškovnih pasov so znotraj vprašanja različne', () => {
    // StepCostBasis prepozna izbrani pas po `midpointEUR === value.valueEUR`.
    // Dva pasova z isto sredino bi označila dva radia hkrati.
    for (const [segmentId, context] of ENTRIES) {
      for (const [name, rate] of ratesOf(context)) {
        const midpoints = rate.bands.map((band) => band.midpointEUR);
        expect(new Set(midpoints).size, `${segmentId}/${name}`).toBe(midpoints.length);
      }
    }
  });

  it('nobena stroškovna vrednost ni 0 — ničla bi tiho izničila celo področje', () => {
    for (const [segmentId, context] of ENTRIES) {
      for (const [name, rate] of ratesOf(context)) {
        expect(rate.fallbackEUR, `${segmentId}/${name}`).toBeGreaterThan(0);
        for (const band of rate.bands) {
          expect(band.midpointEUR, `${segmentId}/${name}/${band.id}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('prazen profil ima vse tri postavke označene kot ocenjene in nikoli 0', () => {
    // chargeOutRate je prisoten tudi pri dejavnostih, ki ga ne vprašajo: modul,
    // ki bi ga uporabil, mora dobiti število in ne undefined (NaN v rezultatu).
    for (const [segmentId, context] of ENTRIES) {
      const profile = emptyProfileFor(context);
      for (const assumption of [profile.operationalHour, profile.adminHour, profile.chargeOutRate]) {
        expect(assumption.valueEUR, segmentId).toBeGreaterThan(0);
        expect(assumption.estimated, segmentId).toBe(true);
      }
    }
  });

  it('zaračunano postavko vpraša samo dejavnost, ki prodaja ure', () => {
    const asking = ENTRIES.filter(([, context]) => context.chargeOutRate).map(([id]) => id);
    expect(asking).toEqual(['storitve']);
  });
});
