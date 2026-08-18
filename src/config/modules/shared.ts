import type { FieldChoice, ModuleField, RiskLevel } from './moduleTypes';

/**
 * Gradniki, ki jih deli več dejavnosti.
 *
 * Ločeni od posameznih datotek z moduli, ker sta proizvodnja in logistika prvi
 * dve dejavnosti, ki merita isto vrsto stvari z drugimi besedami: diagnostična
 * lestvica, pretvorba ocene v stopnjo tveganja in vprašanje o sprostljivem
 * deležu zaloge so povsod enaki. Kopija bi se ob prvi kalibraciji razšla —
 * deleži in pragovi so začetne ocene, ki jih bo treba popraviti na enem mestu.
 */

export const MONTHS_PER_YEAR = 12;

/**
 * Privzeti letni strošek kapitala, kadar obiskovalec vprašanja ne odgovori.
 *
 * Ni več konstanta v formulah: strošek kapitala je od koraka 5 prenove del skupne
 * finančne osnove (ComputeContext.capitalCostRate) in ga vprašajo dejavnosti,
 * katerih moduli množijo denar v terjatvah ali zalogah. Ta vrednost je samo še
 * privzetek (contextTypes.emptyProfileFor in DEFAULT_COST_CONTEXT) — prej je bila
 * fiksna tu, legacy modul pa je isti koncept spraševal z 10 %.
 *
 * KALIBRACIJA: začetna ocena, ne empirija. Po prvih ~50 vnosih jo je treba preveriti
 * na realnih podatkih — enako kot naslovljive deleže in pasove izboljšave.
 */
export const RECEIVABLES_CAPITAL_COST = 0.06;

/**
 * Isti letni strošek kapitala za denar, vezan v zalogah.
 *
 * Sklic in ne nova konstanta: denar v zalogi ni nič cenejši od denarja v terjatvah,
 * dve številki pa bi se ob prvi kalibraciji razšli. Sprostljiva zaloga je enkraten
 * denarni učinek, ta strošek pa letni — zato sta v poročilu ločena (raziskava
 * maloprodaje, F02 in F03).
 */
export const INVENTORY_CAPITAL_COST = RECEIVABLES_CAPITAL_COST;

/**
 * Vrednost, ki pomeni "na to vprašanje nismo odgovorili".
 *
 * Ni ocena in v vsoto ne vstopa. Obstaja, ker so bili privzetki diagnostike doslej
 * sredinski odgovori (1, 1, 2, 1): obiskovalec, ki koraka ni niti odprl, je na
 * rezultatih dobil DVE oceni "srednje tveganje", zapisani kot dejstvo, in ti dve
 * oceni sta šli tudi v PDF in v prodajno pripravo. Sodba o podjetju brez enega
 * samega podatka o podjetju.
 *
 * Zakaj ne preprosto privzetek 0: to bi tiho trdilo "vse je zanesljivo" in samo
 * obrnilo smer napake. Odsotnost odgovora mora biti razpoznavna kot odsotnost.
 */
export const ASSURANCE_UNANSWERED = 4;

/**
 * Enotne stopnje za diagnostična vprašanja — višja ocena pomeni večje tveganje.
 *
 * Peta možnost NAMERNO nima `unknown: true`, čeprav pomeni neznanje. Zastavica v
 * potential.ts prepove oznako "visoka zanesljivost" za celoten izračun, diagnostika
 * pa ne prispeva nobenega evra — nedotaknjen diagnostični korak zato ne sme znižati
 * zanesljivosti denarnega dela. Da odgovor manjka, je razvidno iz besedila možnosti,
 * ki se izpiše tudi v prodajni pripravi.
 */
export const ASSURANCE_CHOICES: FieldChoice[] = [
  { value: 0, label: 'Da, zanesljivo' },
  { value: 1, label: 'Večinoma' },
  { value: 2, label: 'Le približno' },
  { value: 3, label: 'Ne' },
  { value: ASSURANCE_UNANSWERED, label: 'Nismo preverili' },
];

/** Opomba ob paru, na katerega obiskovalec ni odgovoril. */
export const ASSURANCE_UNANSWERED_NOTE =
  'Ni ocenjeno — na ta vprašanja niste odgovorili. Stopnje tveganja zato ne prikazujemo; ocene si ne izmišljamo.';

export function riskLevelFromScore(score: number, maxScore: number): RiskLevel {
  const ratio = score / maxScore;
  if (ratio <= 0.3) return 'low';
  if (ratio <= 0.6) return 'medium';
  return 'high';
}

/**
 * Stopnja tveganja iz para diagnostičnih odgovorov.
 *
 * Neodgovorjena vprašanja se izločijo, najvišja možna ocena pa se skrči na tista,
 * ki so bila odgovorjena — sicer bi en sam odgovor "Ne" (3) ob enem neodgovorjenem
 * dal razmerje 3/6 in bi bil videti kot zmerno tveganje, čeprav je edini prejeti
 * odgovor najslabši možen.
 *
 * Vrne `undefined`, kadar ni odgovorjeno nobeno vprašanje para. Izid tedaj ostane
 * brez `riskLevel` (na ModuleOutputDraft je neobvezen, RiskCard odsotnost prenese),
 * kar je edini pošten prikaz: brez odgovora ni sodbe.
 */
export function assuranceRiskLevel(...answers: number[]): RiskLevel | undefined {
  const answered = answers.filter((value) => value !== ASSURANCE_UNANSWERED);
  if (answered.length === 0) return undefined;

  const score = answered.reduce((sum, value) => sum + value, 0);
  return riskLevelFromScore(score, 3 * answered.length);
}

/**
 * Deleži za izbrane razpone znižanja zaloge. Vrednosti polja so INDEKSI, ne
 * deleži: "Ne vem" pade na isti konservativni delež kot "Do 5 %", enaki
 * vrednosti pa bi v ModuleInput označili dva radia hkrati (glej FieldChoice).
 *
 * ODPRTO VPRAŠANJE KALIBRACIJE (ni popravljeno namenoma).
 * Pregled maloprodaje (ZM-06) predlaga [0.03, 0.08, 0.15, 0.20, 0.03] z utemeljitvijo,
 * da je zgornji pas 0,22 približno 2,2-krat nad najvišjo vrednostjo iz raziskave
 * (sklic "A18"). Te trditve v dostopnem gradivu ni bilo mogoče preveriti: v
 * Raziskava_maloprodaja_PANTHEON.md je ni, register v .xlsx pa se ni dal prebrati.
 *
 * Zamenjava ene neutemeljene številke z drugo neutemeljeno ni izboljšava, zato
 * vrednosti ostajajo. Preden se spremenijo, je treba iz registra prebrati dejansko
 * predpostavko A18 in jo zapisati sem kot vir.
 *
 * Dodatna previdnost, kadar se to zgodi: ta nabor uporablja ŠEST dejavnosti, v
 * storitve.ts pa isti delež množi nezaračunano delo (WIP) in ne zaloge blaga —
 * maloprodajna predpostavka tam ne velja in potrebuje svojo kalibracijo.
 */
const REDUCIBLE_SHARES = [0.05, 0.08, 0.15, 0.22, 0.05];

export const REDUCIBLE_SHARE_KEY = 'reducibleShare';

/**
 * Pojasnilo za gumb "?" pri različici vprašanja, ki meri zalogo. Pet dejavnosti
 * vpraša isto z drugimi besedami, zato pojasnilo stoji tu in ne petkrat.
 * Terjatvena različica (storitve) ima svoje — tam ne gre za blago.
 */
export const REDUCIBLE_STOCK_EXPLAINER =
  'Ne gre za to, koliko zaloge imate, ampak koliko bi je lahko trajno bilo manj, ne da bi kdaj zmanjkalo. ' +
  'Mišljena je zaloga, ki leži zaradi previdnosti, podvojenih naročil ali slabega pregleda. ' +
  'Groba ocena zadostuje; če niste prepričani, izberite nižji razpon.';

export function reducibleShareField(
  label: string,
  /** Neobvezni besedili pod vprašanjem in za gumbom "?" — glej ModuleField. */
  texts: { help?: string; explainer?: string } = {},
): ModuleField {
  const { help, explainer } = texts;
  return {
    key: REDUCIBLE_SHARE_KEY,
    label,
    kind: 'choice',
    default: 4,
    ...(help ? { help } : {}),
    ...(explainer ? { explainer } : {}),
    choices: [
      { value: 0, label: 'Do 5 %' },
      { value: 1, label: '6–10 %' },
      { value: 2, label: '11–20 %' },
      { value: 3, label: 'Več kot 20 %' },
      { value: 4, label: 'Ne vem', unknown: true },
    ],
  };
}

/** Delež za izbrani indeks; neznan indeks pade na najkonservativnejšega. */
export function reducibleShareOf(index: number): number {
  return REDUCIBLE_SHARES[index] ?? REDUCIBLE_SHARES[0];
}
