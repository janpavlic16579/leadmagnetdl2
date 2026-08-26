import type { BusinessProfile, SegmentContext } from '../config/contexts';
import { isUnansweredChoice, type ModuleDefinition } from '../config/modules/moduleTypes';
import { isAnswered, isUnknownChoice } from './answerLabels';
import { isRevenueMissing } from './potential';

/**
 * Signali, iz katerih se ubesedi RAZLOG oznake zanesljivosti.
 *
 * Ocena sama ostaja v assessConfidence (lib/potential.ts). Ta modul obstaja,
 * ker je oznaka "Nizka zanesljivost" doslej na zaslonu in v strankinem PDF-ju
 * vedno trdila "večina ključnih podatkov manjka" — tudi obiskovalcu, ki je
 * vnesel vsa polja in le urni postavki prevzel kot panožno oceno. Prodajna
 * priprava je pravi razlog že izračunavala; od tod naprej ga vsi trije
 * dokumenti berejo iz istih signalov in se ne morejo razhajati.
 */
export interface ConfidenceSignals {
  /** Prihodek manjka, čeprav ga kateri od izpolnjenih modulov množi. */
  revenueMissing: boolean;
  /** Urne postavke, prevzete kot povprečje panoge ali izbran razpon. */
  estimatedRates: number;
  /** Koliko urnih postavk je dejavnost sploh vprašala (storitve tri, ostale dve). */
  askedRates: number;
  /** Izbirna vprašanja z izrecnim odgovorom "Ne vem". */
  unknownChoices: number;
  /** Izbirna vprašanja brez odgovora — molk, ne priznanje. */
  unansweredChoices: number;
  /** Številska polja, ki so ostala na privzeti vrednosti. */
  untouchedNumeric: number;
}

export interface CollectConfidenceSignalsParams {
  context: SegmentContext | undefined;
  profile: BusinessProfile;
  /** Aktivni (v triaži izbrani) moduli — isti nabor kot v prodajni pripravi. */
  modules: ModuleDefinition[];
  values: Record<string, Record<string, number>>;
}

export function collectConfidenceSignals({
  context,
  profile,
  modules,
  values,
}: CollectConfidenceSignalsParams): ConfidenceSignals {
  // Zaračunano postavko vpraša samo dejavnost, ki prodaja ure — drugod je v
  // profilu le varovalo pred NaN in je obiskovalec ni videl (glej salesReport).
  const rates = context
    ? [
        profile.operationalHour,
        profile.adminHour,
        ...(context.chargeOutRate ? [profile.chargeOutRate] : []),
      ]
    : [];

  let unknownChoices = 0;
  let unansweredChoices = 0;
  let untouchedNumeric = 0;
  for (const definition of modules) {
    const moduleValues = values[definition.id] ?? {};
    for (const field of definition.fields) {
      if (field.contextOnly) continue;
      const value = moduleValues[field.key];
      if (isUnknownChoice(field, value)) unknownChoices += 1;
      if (isUnansweredChoice(field, value)) unansweredChoices += 1;
      if (field.kind !== 'choice' && field.kind !== 'checkbox' && !isAnswered(field, value)) {
        untouchedNumeric += 1;
      }
    }
  }

  return {
    revenueMissing: isRevenueMissing(profile, modules, values),
    estimatedRates: rates.filter((rate) => rate.estimated).length,
    askedRates: rates.length,
    unknownChoices,
    unansweredChoices,
    untouchedNumeric,
  };
}

/** Slovenske oblike ob števniku: [1, 2, 3–4, 5+]. */
function pick(n: number, forms: [string, string, string, string]): string {
  if (n === 1) return forms[0];
  if (n === 2) return forms[1];
  if (n === 3 || n === 4) return forms[2];
  return forms[3];
}

/* Srednji spol — števnik tu vedno stoji ob "vprašanje" ali "polje". */
const NUMERALS = ['nič', 'eno', 'dve', 'tri', 'štiri'];
function numeral(n: number): string {
  return NUMERALS[n] ?? String(n);
}

/**
 * Stavek o urnih postavkah — edini signal, ki ga je staro besedilo opisovalo
 * NAPAČNO ("podatki manjkajo"): postavke ne manjkajo, so panožne ocene.
 */
function ratesClause(signals: ConfidenceSignals, ownerWord: string): string | null {
  const { estimatedRates: n, askedRates: asked } = signals;
  if (n === 0) return null;
  const suffix = `panožn${n === 1 ? 'a ocena' : n === 2 ? 'i oceni' : 'e ocene'} (povprečje ali razpon), ne ${ownerWord}`;
  if (n === asked) {
    if (asked === 1) return `urna postavka je ${suffix}`;
    if (asked === 2) return `obe urni postavki sta ${suffix}`;
    return `vse urne postavke so ${suffix}`;
  }
  if (n === 1) return `ena od urnih postavk je ${suffix}`;
  if (n === 2) return `dve od urnih postavk sta ${suffix}`;
  return `${numeral(n)} od urnih postavk so ${suffix}`;
}

/**
 * Razlog za zaslon — obiskovalcu, ki je pravkar vnašal ("ste"). `null`, kadar
 * signalov ni; tedaj naj oznako pojasni splošno besedilo iz registra.
 */
export function confidenceReasonScreen(signals: ConfidenceSignals): string | null {
  const parts: string[] = [];
  if (signals.revenueMissing) {
    parts.push('prihodka niste vnesli, zato postavke, vezane nanj, štejejo 0');
  }
  const rates = ratesClause(signals, 'vaš podatek');
  if (rates) parts.push(rates);
  if (signals.unknownChoices > 0) {
    const n = signals.unknownChoices;
    parts.push(
      `${n === 1 ? 'enkrat' : n === 2 ? 'dvakrat' : `${n}×`} ste odgovorili z "Ne vem"`,
    );
  }
  if (signals.unansweredChoices > 0) {
    const n = signals.unansweredChoices;
    parts.push(
      `${numeral(n)} ${pick(n, [
        'izbirno vprašanje',
        'izbirni vprašanji',
        'izbirna vprašanja',
        'izbirnih vprašanj',
      ])} ste pustili brez odgovora`,
    );
  }
  if (signals.untouchedNumeric > 0) {
    const n = signals.untouchedNumeric;
    parts.push(
      `${numeral(n)} ${pick(n, [
        'številsko polje je ostalo prazno in šteje kot 0',
        'številski polji sta ostali prazni in štejeta kot 0',
        'številska polja so ostala prazna in štejejo kot 0',
        'številskih polj je ostalo praznih in štejejo kot 0',
      ])}`,
    );
  }

  if (parts.length === 0) return null;
  return `Zneski so označeni kot "najmanj". Razlog: ${parts.join('; ')}. Dejanski so praviloma višji, ne nižji.`;
}

/**
 * Razlog za strankin PDF — dokument kroži po upravi in ga bere nekdo, ki
 * obrazca ni izpolnil, zato brez "ste" (ista delitev kot confidenceNotePdf).
 */
export function confidenceReasonPdf(signals: ConfidenceSignals): string | null {
  const parts: string[] = [];
  if (signals.revenueMissing) {
    parts.push('prihodek ni podan, zato postavke, vezane nanj, štejejo 0');
  }
  const rates = ratesClause(signals, 'izmerjen podatek');
  if (rates) parts.push(rates);
  if (signals.unknownChoices > 0) {
    const n = signals.unknownChoices;
    parts.push(
      `${n === 1 ? 'enkrat' : n === 2 ? 'dvakrat' : `${n}×`} je izbran odgovor "Ne vem"`,
    );
  }
  if (signals.unansweredChoices > 0) {
    const n = signals.unansweredChoices;
    parts.push(
      `${numeral(n)} ${pick(n, [
        'izbirno vprašanje je brez odgovora',
        'izbirni vprašanji sta brez odgovora',
        'izbirna vprašanja so brez odgovora',
        'izbirnih vprašanj je brez odgovora',
      ])}`,
    );
  }
  if (signals.untouchedNumeric > 0) {
    const n = signals.untouchedNumeric;
    parts.push(
      `${numeral(n)} ${pick(n, [
        'številsko polje je prazno in šteje kot 0',
        'številski polji sta prazni in štejeta kot 0',
        'številska polja so prazna in štejejo kot 0',
        'številskih polj je praznih in štejejo kot 0',
      ])}`,
    );
  }

  if (parts.length === 0) return null;
  return `Zneski so spodnja meja. Razlog: ${parts.join('; ')}. Dejanski so praviloma višji, ne nižji.`;
}
