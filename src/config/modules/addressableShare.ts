import type { ModuleField } from './moduleTypes';

/**
 * Koliko izmerjenega stroška je sploh mogoče nasloviti z boljšimi procesi.
 *
 * Vsak stroškovni modul vpraša za glavni vzrok. Vzrok, ki je v podatkih in
 * dokumentaciji, je skoraj v celoti naslovljiv; okvara stroja skoraj nič.
 * Brez tega bi izračun tiho predpostavljal, da je vsak strošek odpravljiv —
 * ravno trditev, ki jo skeptičen direktor najprej napade.
 *
 * To je EDINI koeficient, ki zmanjša izmerjeni strošek. Odgovor o sedanjem sistemu
 * je doslej prispeval še drugega ("pas izboljšave") in isti problem je bil zmanjšan
 * dvakrat; odslej je ta odgovor prodajni signal (SystemGap) in v evre ne vstopa.
 * Nov množitelj se sme dodati samo, če meri nekaj, česar glavni vzrok ne pove.
 *
 * KALIBRACIJA: deleži so začetne ocene iz specifikacije, ne empirija. Po prvih
 * ~50 vnosih jih je treba preveriti na realnih podatkih.
 */

export type CauseCategory =
  /** Podatki, normativi, dokumentacija, ročni prenosi. */
  | 'data'
  /** Planiranje, zaloge, vidnost nalogov, nepostavljen proces. */
  | 'planning'
  /**
   * Znanje, disciplina, kadrovska kapaciteta.
   *
   * Namenoma ozka kategorija. Kadar ljudje grešijo, ker prepisujejo podatke, jih
   * držijo v glavi ali delajo v nepovezanih sistemih, vzrok NI človek — je podatek
   * oziroma proces, in takšna težava ob urejenem informacijskem sistemu izgine.
   * 'people' uporabi samo, kadar bi težava ostala tudi ob dobro postavljenem
   * sistemu: pomanjkanje usposabljanja, slaba disciplina, premalo ljudi, odsotnosti
   * in napake, ki jih sistem težko prepreči. Široka razlaga je rezultat po nepotrebnem
   * nižala, saj je 0,45 skoraj polovico manj od 0,75 pri vzroku v podatkih.
   */
  | 'people'
  /** Dobavitelji, kupci, zunanji dejavniki. */
  | 'external'
  /** Strojne okvare, kakovost vhodnega materiala. */
  | 'physical'
  | 'unknown';

export const ADDRESSABLE_SHARE: Record<CauseCategory, number> = {
  data: 0.75,
  planning: 0.65,
  people: 0.45,
  external: 0.25,
  physical: 0.15,
  unknown: 0.3,
};

export interface CauseOption {
  label: string;
  category: CauseCategory;
}

/** Enotno besedilo — vprašanje je v vseh modulih isto, razlikujejo se le možnosti. */
const MAIN_CAUSE_LABEL = 'Kaj je glavni vzrok?';
export const MAIN_CAUSE_KEY = 'mainCause';

/** Možnost "Ne vemo" je v vsakem modulu zadnja in hkrati privzeta. */
const UNKNOWN_CAUSE: CauseOption = { label: 'Ne vemo', category: 'unknown' };

/**
 * Sestavi izbirno polje za glavni vzrok.
 *
 * Vrednosti so ZAPOREDNI INDEKSI, ne deleži: več vzrokov si deli isti naslovljivi
 * delež, ModuleInput pa radie ključi po `choice.value` in preverja enakost — enake
 * vrednosti bi označile dva radia hkrati in podvojile React ključ.
 */
export function mainCauseField(causes: CauseOption[]): ModuleField {
  const all = withUnknown(causes);
  return {
    key: MAIN_CAUSE_KEY,
    label: MAIN_CAUSE_LABEL,
    kind: 'choice',
    default: all.length - 1,
    choices: all.map((cause, index) => ({
      value: index,
      label: cause.label,
      ...(cause.category === 'unknown' ? { unknown: true as const } : {}),
    })),
  };
}

/** Naslovljivi delež za izbrani indeks; neznan indeks pade na konservativni 'unknown'. */
export function addressableShareOf(causes: CauseOption[], index: number): number {
  const all = withUnknown(causes);
  const cause = all[index];
  return ADDRESSABLE_SHARE[cause ? cause.category : 'unknown'];
}

function withUnknown(causes: CauseOption[]): CauseOption[] {
  return [...causes, UNKNOWN_CAUSE];
}
