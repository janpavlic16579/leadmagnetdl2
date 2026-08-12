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

/** Enotne stopnje za diagnostična vprašanja — višja ocena pomeni večje tveganje. */
export const ASSURANCE_CHOICES: FieldChoice[] = [
  { value: 0, label: 'Da, zanesljivo' },
  { value: 1, label: 'Večinoma' },
  { value: 2, label: 'Le približno' },
  { value: 3, label: 'Ne' },
];

export function riskLevelFromScore(score: number, maxScore: number): RiskLevel {
  const ratio = score / maxScore;
  if (ratio <= 0.3) return 'low';
  if (ratio <= 0.6) return 'medium';
  return 'high';
}

/**
 * Deleži za izbrane razpone znižanja zaloge. Vrednosti polja so INDEKSI, ne
 * deleži: "Ne vem" pade na isti konservativni delež kot "Do 5 %", enaki
 * vrednosti pa bi v ModuleInput označili dva radia hkrati (glej FieldChoice).
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
