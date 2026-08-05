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
 * Letni oportunitetni strošek denarja, ki obtiči v zapadlih terjatvah.
 *
 * Konstanta in ne vprašanje: strošek kapitala je lastnost podjetja, ne področja,
 * omejitev na šest polj na modul pa je ostrejša od koristi tega vprašanja — večina
 * obiskovalcev nanj tako ali tako odgovori z ugibanjem.
 *
 * KALIBRACIJA: začetna ocena, ne empirija. Po prvih ~50 vnosih jo je treba preveriti
 * na realnih podatkih — enako kot naslovljive deleže in pasove izboljšave.
 */
export const RECEIVABLES_CAPITAL_COST = 0.06;

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

export function reducibleShareField(label: string, help?: string): ModuleField {
  return {
    key: REDUCIBLE_SHARE_KEY,
    label,
    kind: 'choice',
    default: 4,
    ...(help ? { help } : {}),
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
