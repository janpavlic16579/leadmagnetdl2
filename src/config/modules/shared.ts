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
 * Letni strošek kapitala, umerjen avgusta 2026: 6 % → 8,5 %.
 *
 * NI vir resnice v izvajanju. Strošek kapitala je od koraka 5 prenove del skupne
 * finančne osnove (ComputeContext.capitalCostRate); privzetek, ki dejansko vstopa
 * v izračun, je DEFAULT_COST_CONTEXT v moduleTypes.ts in `fallback` v
 * config/contexts/*.ts. Ta konstanta ostaja kot zapisana referenca in kot
 * pričakovanje v testih — ob spremembi je treba premakniti VSE tri.
 *
 * Zakaj 8,5 in ne 6: 6 % je bila obrestna mera posojila, ne strošek kapitala
 * podjetja. Konvencija za denar, vezan v zalogah in terjatvah, je WACC — KPMG
 * Cost of Capital Study 2025 meri povprečje 8,5 %, evropska MSP z velikostno
 * premijo 10–14 %, faktoring pa je efektivno 6–12 % letno. Dolžniška spodnja meja
 * je ~4 % (ECB MIR, junij 2026: mala posojila 3,91 %).
 *
 * Zakaj 8,5 in ne 8: pasovi vprašanja so zaprti na obeh straneh in se stikajo pri
 * 0,08 (5–8 % in 8–12 %). Privzetek 0,08 bi ustrezal DVEMA pasovoma —
 * contexts.test.ts to ujame, industryAverageScaleBand pa bi vrnil prvega in
 * obiskovalec bi videl 8 % ob razponu, ki se pri 8 % konča. 8,5 % je hkrati
 * natanko izmerjena vrednost KPMG. Izpeljava:
 * docs/erp-koristi-benchmarki-2026-08.md, razdelek B.
 */
export const RECEIVABLES_CAPITAL_COST = 0.085;

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

/**
 * Opomba ob paru, ki je ostal pri "Nismo preverili".
 *
 * Ne "niste odgovorili": privzeta izbira JE "Nismo preverili" in radio je ob
 * prvem izrisu označen — trditev, da odgovora ni bilo, je ob označenem radiu
 * izmerljivo napačna in je bila prva stvar, ki jo je pregled UX očital rezultatu.
 */
export const ASSURANCE_UNANSWERED_NOTE =
  'Ni ocenjeno — ti vprašanji sta ostali pri „Nismo preverili". Stopnje tveganja zato ne prikazujemo; ocene si ne izmišljamo.';

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
 * deleži: enake vrednosti bi v ModuleInput označile dva radia hkrati (glej
 * FieldChoice).
 *
 * KALIBRIRANO avgusta 2026 proti zunanjemu viru. Prej [0.05, 0.08, 0.15, 0.22, 0.05]:
 *
 * - "Ne vem" (indeks 4) 0,05 → 0,10. Doslej je padel na isti delež kot "Do 5 %",
 *   kar je bila POLOVICA spodnjega roba izmerjenega razpona: Aberdeen (anketa
 *   1.680 podjetij) meri povprečno znižanje stroškov zalog ob uvedbi ERP 17,2 %
 *   (13,4–25 % po ponudnikih), konservativno sidro pred CFO pa je 10–15 %.
 *   Neodgovor je torej obljubljal manj od najslabšega izmerjenega projekta.
 * - "Več kot 20 %" (indeks 3) 0,22 → 0,25. Stranka je izrekla "več kot 20";
 *   sredina odprtega razpona je kvečjemu 25, kar je hkrati Aberdeenov zgornji rob.
 *
 * S tem odpade odprto vprašanje o nepreverljivem sklicu "A18" iz pregleda
 * maloprodaje (ZM-06): namesto rekonstrukcije stare predpostavke so pasovi
 * privezani na zapisan in preverljiv zunanji vir
 * (docs/erp-koristi-benchmarki-2026-08.md, razdelek A1).
 *
 * Dodatna previdnost, kadar se to zgodi: ta nabor uporablja ŠEST dejavnosti, v
 * storitve.ts pa isti delež množi nezaračunano delo (WIP) in ne zaloge blaga —
 * maloprodajna predpostavka tam ne velja in potrebuje svojo kalibracijo.
 */
const REDUCIBLE_SHARES = [0.05, 0.08, 0.15, 0.25, 0.1];

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
