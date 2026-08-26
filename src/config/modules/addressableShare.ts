import { UNANSWERED_CHOICE, type ModuleField } from './moduleTypes';

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
 * KALIBRACIJA, avgust 2026: deleži niso več "začetne ocene iz specifikacije" —
 * vsak je preverjen proti literaturi v docs/naslovljivost-raziskava-2026-08.md in
 * docs/erp-koristi-benchmarki-2026-08.md, vir pa je zapisan ob vrednosti. Kar
 * ostaja odprto, je domača empirija: nobena od meritev ni slovenska in prava
 * kalibracija bo prišla iz Datalabovih lastnih uvedb po prvih ~50 vnosih.
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
   * in napake, ki jih sistem težko prepreči. Široka razlaga rezultat po nepotrebnem
   * niža: 'people' je precej pod 'data' in razvrstitev sem je zato trditev, da
   * težava ob urejenem sistemu NE bi izginila.
   */
  | 'people'
  /** Dobavitelji, kupci, zunanji dejavniki. */
  | 'external'
  /** Strojne okvare, kakovost vhodnega materiala. */
  | 'physical'
  | 'unknown';

export const ADDRESSABLE_SHARE: Record<CauseCategory, number> = {
  /**
   * ZAVESTNA ODLOČITEV pri zgornjem robu pasu, ne privzeta ocena.
   *
   * Literatura daje 0,45–0,78: Ardent 2025 meri razliko med povprečnim in
   * najboljšim stroškom obdelave računa (−70 %), Billentis 60–80 % pri prehodu s
   * papirja na e-račun, Hackett 45 % za celotno finančno funkcijo, McKinsey pa
   * 64–69 % kot TEHNIČNO mejo avtomatizacije zajema in obdelave podatkov.
   * 0,75 torej leži nad McKinseyjevim stropom in ga brani samo dejstvo, da so
   * možnosti v tej kategoriji izrazito ozko podatkovne ("isti podatek vnašamo v
   * več sistemov", "listine so večinoma papirne") — prav naloge, za katere
   * Billentis meri 60–80 %.
   *
   * Zato: ne dviguj. Predlog 0,80 iz docs/erp-koristi-benchmarki-2026-08.md je
   * bil zavrnjen, ker bi ležal nad vsemi izmerjenimi dosežki in nad tehničnim
   * stropom hkrati. Ob prvem izpodbijanju je to prva vrednost, ki se umakne —
   * docs/naslovljivost-raziskava-2026-08.md §4.1 predlaga 0,65.
   */
  data: 0.75,
  /**
   * Prav tako pri zgornjem robu in prav tako zavestno.
   *
   * Kategorija je vsebinsko dvodelna: pri zalogah in napovedovanju meritve dajejo
   * 0,10–0,30 (Aberdeen −22 % pri najboljših, MRP −10 do −19 %), pri vidnosti in
   * nepostavljenem procesu pa je učinek bližje podatkovnemu. Ker isti koeficient
   * pokriva oboje, docs/naslovljivost-raziskava-2026-08.md §4.2 predlaga 0,50 in
   * kot boljšo rešitev razcep na planning-process (0,60) in planning-inventory
   * (0,30). Do razcepa vrednost ostane — a je to izbira, ne meritev.
   */
  planning: 0.65,
  /** Deming 94/6 vleče navzdol, SURS 2025 (41 % podjetij: kader je ovira) navzgor. */
  people: 0.45,
  /**
   * 0,25 → 0,30. Dobavitelja ne popravimo, pred njim se pa zavarujemo: meritve
   * znižanja DSO ob avtomatizaciji terjatev dajejo 0,29–0,41, Corsten & Gruen pa
   * merijo, da dobavna veriga povzroči le ~28 % izpadov zaloge — "zunanji"
   * problem je večinoma notranji. Oba zapisnika se pri tej vrednosti ujemata.
   */
  external: 0.3,
  /**
   * Edini delež, ki je bil umerjen brez popravka: CMMS in načrtovano vzdrževanje
   * dajeta 0,10–0,20, 0,15 leži na sredini. TPM doseže bistveno več, a je to
   * dveletni program preoblikovanja vzdrževanja in ne informacijski sistem.
   */
  physical: 0.15,
  /**
   * 0,30 → 0,45. Najbolj obremenjena številka v datoteki, ker je privzetek.
   *
   * Ob dejanski porazdelitvi 203 ponujenih možnosti bi odgovor dal povprečno
   * 0,579 in mediano 0,65; 0,30 je ležal pri ~24. percentilu, torej POD kategorijo
   * "krivi so ljudje". Kdor ni odgovoril, je bil obravnavan slabše, kot če bi
   * rekel karkoli — to ni konservativnost, ampak kazen za neizpolnjeno neobvezno
   * polje, ki je obiskovalec niti ne vidi (odstotka mu ne pokažemo).
   * 0,45 je 25. percentil: tri četrtine odgovorov bi dale več, previdnost torej
   * ostane. Vir: docs/naslovljivost-raziskava-2026-08.md §4.6.
   *
   * Oznaka zanesljivosti to pot še naprej kaznuje ločeno in to je prav — kazen
   * nosi oznaka, koeficient nosi oceno.
   */
  unknown: 0.45,
};

export interface CauseOption {
  label: string;
  category: CauseCategory;
}

/** Enotno besedilo — vprašanje je v vseh modulih isto, razlikujejo se le možnosti. */
const MAIN_CAUSE_LABEL = 'Kaj je glavni vzrok?';
export const MAIN_CAUSE_KEY = 'mainCause';

/** Možnost "Ne vemo" je v vsakem modulu zadnja — izbrati jo je treba zavestno. */
const UNKNOWN_CAUSE: CauseOption = { label: 'Ne vemo', category: 'unknown' };

/**
 * "Na to vprašanje ni odgovora" — privzetek polja z glavnim vzrokom.
 *
 * NAMENOMA ni med `choices`: ModuleInput riše radie s `checked={value === choice.value}`,
 * zato vrednost izven seznama pomeni, da ni označen noben. Doslej je bil privzetek
 * kar zadnja možnost ("Ne vemo") — vprašanje je torej pričakalo obiskovalca z že
 * izbranim odgovorom, ki ga zato ni nikoli premislil, in tihi 0,30 je bil pri
 * dejanski porazdelitvi odgovorov skoraj polovica tega, kar bi mu dal en klik.
 *
 * Zakaj 99 in ne −1: UNKNOWN_ANSWER je −1 in withoutUnknowns ga tik pred compute()
 * prepiše v 0 — kar je PRVI vzrok na seznamu, torej v vsakem modulu 'data' ali
 * 'planning' in s tem najvišji delež v sistemu. Sentinela mora biti pozitivna tudi
 * zato, ker komentar ob UNKNOWN_ANSWER vabi k posplošitvi na "vsaka negativna
 * vrednost"; pozitivna je proti temu strukturno odporna.
 *
 * addressableShareOf za neznan indeks že vrne ADDRESSABLE_SHARE.unknown, zato
 * neodgovor ostane konservativen — a odslej z oceno in ne s kaznijo.
 *
 * Vzdevek skupne sentinele: isto pravilo "ni izbrano" zdaj uporabljajo tudi
 * kontekstna vprašanja (UNANSWERED_CHOICE v moduleTypes.ts).
 */
export const MAIN_CAUSE_UNANSWERED = UNANSWERED_CHOICE;

/**
 * Sestavi izbirno polje za glavni vzrok.
 *
 * Vrednosti so ZAPOREDNI INDEKSI, ne deleži: več vzrokov si deli isti naslovljivi
 * delež, ModuleInput pa radie ključi po `choice.value` in preverja enakost — enake
 * vrednosti bi označile dva radia hkrati in podvojile React ključ.
 *
 * `default` polja ni med `choices` (skupna sentinela UNANSWERED_CHOICE) — isto
 * odslej velja za kontekstna vprašanja. Stražo drži moduleEngine.test.ts.
 */
export function mainCauseField(causes: CauseOption[]): ModuleField {
  const all = withUnknown(causes);
  return {
    key: MAIN_CAUSE_KEY,
    label: MAIN_CAUSE_LABEL,
    kind: 'choice',
    default: MAIN_CAUSE_UNANSWERED,
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
