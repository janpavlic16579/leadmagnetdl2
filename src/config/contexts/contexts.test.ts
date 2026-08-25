import { describe, it, expect } from 'vitest';
import {
  FALLBACK_SYSTEM_GAP,
  SEGMENT_CONTEXTS,
  emptyProfileFor,
  industryAverageBand,
  industryAverageScaleBand,
} from './index';
import { SEGMENTS } from '../segments';
import type { ContextQuestion, CostQuestion, ScaleQuestion, SegmentContext } from './contextTypes';

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

/**
 * Vsa vprašanja koraka Skupna finančna osnova — urne postavke in velikostne
 * predpostavke skupaj. Uporabljajo ga preverbe, ki veljajo za oboje (pojasnilo
 * gumba "?"); preverbe, ki poznajo `midpointEUR`, ostajajo pri ratesOf.
 */
function costBasisQuestionsOf(context: SegmentContext): [string, CostQuestion | ScaleQuestion][] {
  const questions: [string, CostQuestion | ScaleQuestion][] = [...ratesOf(context)];
  if (context.annualRevenue) questions.push(['annualRevenue', context.annualRevenue]);
  if (context.contributionMargin) questions.push(['contributionMargin', context.contributionMargin]);
  if (context.capitalCostRate) questions.push(['capitalCostRate', context.capitalCostRate]);
  return questions;
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

  it('vrzel sedanjega sistema je smiselna in ne obljublja preveč', () => {
    for (const [segmentId, context] of ENTRIES) {
      for (const option of context.currentSystem.options) {
        const where = `${segmentId}/${option.id}`;
        expect(option.gap.min, where).toBeGreaterThan(0);
        expect(option.gap.min, where).toBeLessThan(option.gap.max);
        expect(option.gap.max, where).toBeLessThan(1);
      }
    }
  });

  it('nadomestna vrzel ni ugodnejša od nobene ponujene možnosti', () => {
    // "Brez odgovora vzamemo srednjo vrzel — nikoli najugodnejše." Doslej je bilo
    // to zapisano samo v komentarju.
    for (const [segmentId, context] of ENTRIES) {
      const widest = Math.max(...context.currentSystem.options.map((option) => option.gap.max));
      expect(FALLBACK_SYSTEM_GAP.max, segmentId).toBeLessThan(widest);
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

  it('vsaka dejavnost ponudi vlogo z lastnim vpisom, drugod vpisa ni', () => {
    // Vloga je obvezno vprašanje: brez možnosti "Drugo" z lastnim vpisom obiskovalec,
    // ki se v naštetem ne najde, ne more naprej drugače kot z napačnim odgovorom.
    // Obratno pa vpis pri pretežnem delu ali sistemu ni predviden nikjer — "Nič od
    // tega" v splosno.ts nosi isti id `drugo` in bi ga ujemanje po id-ju odprlo.
    for (const [segmentId, context] of ENTRIES) {
      for (const [name, question] of questionsOf(context)) {
        const freeText = question.options.filter((option) => option.freeText);
        expect(freeText.length, `${segmentId}/${name}`).toBe(name === 'role' ? 1 : 0);
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

  it('povprečje panoge leži v natanko enem pasu', () => {
    /**
     * Gumb "vzemi povprečje panoge" vpiše `fallbackEUR`, izračun pa se nato požene
     * z mejama pasu, ki to povprečje vsebuje (industryAverageBand) — povprečje je
     * ocena z razpršenostjo in ne meritev, zato mora rezultat priti kot razpon.
     *
     * Brez pasu bi gumb tiho vrnil točko in bi se naša ocena predstavila kot
     * natančna. Dva pasova pa bi pomenila, da je izbira odvisna od vrstnega reda
     * v konfiguraciji — povprečje ne sme pasti na mejo dveh pasov.
     *
     * Ta test je nadomestil prejšnjega ("privzetek se ne ujema z nobeno sredino
     * pasu"). Tisti je varoval ugibanje pasu po sredini, ki ga od uvedbe polja
     * `source` ni več nikjer.
     *
     * Velja za VSA vprašanja finančne osnove, ne le za urne postavke. Dokler je
     * tekel samo prek `ratesOf`, je bila napaka mejnega pasu pri maržah leta in
     * dan neopažena: privzetek 0,25 je ležal hkrati v "15–25 %" in "25–35 %",
     * `find` je vrnil prvega in izračun je tekel s 15–25 %, čeprav je obiskovalec
     * v polju videl 25 %. Vprašanja s `fallback === 0` (letni prihodek) so
     * izvzeta po istem pogoju kot `hasIndustryAverage` v StepCostBasis — prometa
     * si ne izmišljamo, zato zanj povprečja panoge sploh ne ponudimo.
     */
    for (const [segmentId, context] of ENTRIES) {
      for (const [name, question] of costBasisQuestionsOf(context)) {
        const isRate = 'fallbackEUR' in question;
        const fallback = isRate ? question.fallbackEUR : question.fallback;
        if (fallback <= 0) continue;

        const containing = isRate
          ? question.bands.filter(
              (band) => fallback >= band.minEUR && fallback <= band.maxEUR,
            )
          : question.bands.filter((band) => fallback >= band.min && fallback <= band.max);

        expect(
          containing.map((band) => band.id),
          `${segmentId}/${name}: povprečje ${fallback}`,
        ).toHaveLength(1);

        const chosen = isRate
          ? industryAverageBand(question)
          : industryAverageScaleBand(question);
        expect(chosen?.id, `${segmentId}/${name}`).toBe(containing[0].id);
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

  /**
   * Pojasnila gumba "?". Tip drži samo to, da polje obstaja; da ni prazno, ni
   * prepisano iz `help` in ne preraste v odstavek, ne more. Prav ta korak množi
   * vse nadaljnje izračune — vprašanje, ki ga obiskovalec napačno razume, popači
   * celoten rezultat, in to tiho.
   */
  it('vsako vprašanje finančne osnove ima uporabno pojasnilo', () => {
    for (const [segmentId, context] of ENTRIES) {
      for (const [name, question] of costBasisQuestionsOf(context)) {
        const where = `${segmentId}/${name}`;
        expect(question.explainer.trim().length, where).toBeGreaterThan(40);
        // Zgornja meja lovi pojasnilo, ki se je razraslo v esej, in ne omejuje
        // gostote podatkov: postavka z izpeljavo in virom je upravičeno daljša
        // od tiste, ki potrebuje eno poved.
        expect(question.explainer.length, where).toBeLessThanOrEqual(600);
        // Kopija kratke razlage ne pove nič novega — gumb bi bil podvojen klik.
        expect(question.explainer, where).not.toBe(question.help);
      }
    }
  });
});
