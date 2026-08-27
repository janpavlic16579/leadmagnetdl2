/**
 * Večletni pogled, cena odlašanja in doba povračila.
 *
 * Izračun je bil doslej izključno letni. ERP projekt se odloča na tri- do
 * petletnem obzorju, zato je letni znesek sam po sebi sidro, ki je za dokument,
 * s katerim se opravičuje investicija, prenizko — ne ker bi bil napačen, ampak
 * ker meri krajše obdobje od odločitve, ki jo podpira.
 *
 * Vse funkcije so čiste in brez I/O: vitest teče v okolju 'node' brez jsdom,
 * zato logike v JSX ni mogoče pokriti s testi. Prikaz sme sestavljati nize,
 * računati pa ne.
 */

/**
 * Obzorje večletnega pogleda.
 *
 * Tri leta in ne pet: pri petih bi bila predpostavka o nespremenjenem poslovanju
 * že težko branljiva, tri leta pa so hkrati sredina razpona, v katerem raziskave
 * merijo dobo povračila ERP projektov (1,5–3 leta; Panorama ERP Report,
 * docs/erp-koristi-benchmarki-2026-08.md, razdelek A6).
 */
export const HORIZON_YEARS = 3;

/**
 * Delovni dnevi na leto: 261 koledarskih minus prazniki na delovni dan.
 *
 * Namerno delovni in ne koledarski dnevi — znesek nastaja med delom. Isti
 * delitelj kot pri urnih postavkah (docs/urne-postavke.md, "Zakaj 1.700 ur").
 */
export const WORKING_DAYS_PER_YEAR = 252;

export const MONTHS_PER_YEAR = 12;

/**
 * Stopnje za tabelo povračila.
 *
 * Nevtralne in NE cene PANTHEON: v tem repozitoriju ni nobene cene in vsebina to
 * izrecno prepoveduje (content/sales/pantheonFit.ts, content/sales/licences.ts).
 * Tabela pokaže, pri kateri investiciji se izmerjeni potencial povrne — kar je
 * primerjava, ne ponudba.
 */
export const PAYBACK_TIERS_EUR = [30_000, 60_000, 120_000];

/**
 * Pod tem letnim potencialom se tabela povračila ne prikaže.
 *
 * Pri nizkem potencialu bi vsaka stopnja dala dobo povračila v desetletjih —
 * tabela bi torej delovala proti temu, kar naj pokaže, in bralcu ponudila prav
 * argument, da se ne splača.
 */
export const MIN_POTENTIAL_FOR_PAYBACK_EUR = 10_000;

/**
 * Letni znesek čez obzorje.
 *
 * Gola multiplikacija: brez rasti podjetja, brez inflacije, brez diskontiranja.
 * Vsaka od teh predpostavk bi bila napadljiva in bi terjala svojo obrambo, ta pa
 * ne — in je celo konservativna, saj kapacitetne postavke rastejo s plačami
 * (~4–5 % letno), česar tu ne upoštevamo.
 */
export function multiYearEUR(annualEUR: number, years: number = HORIZON_YEARS): number {
  return annualEUR * years;
}

/** Kar znesek stane vsak delovni dan — najmočnejše sidro, ker ga bralec preveri na pamet. */
export function perWorkingDayEUR(annualEUR: number): number {
  return annualEUR / WORKING_DAYS_PER_YEAR;
}

/** Cena enega meseca odlašanja: dvanajstina letnega zneska. */
export function perMonthEUR(annualEUR: number): number {
  return annualEUR / MONTHS_PER_YEAR;
}

/**
 * Mesecev do povračila investicije pri danem letnem potencialu.
 *
 * Vrne null, kadar potencial ni pozitiven — deljenje z nič bi dalo Infinity in
 * "Infinity mesecev" na zaslonu. Ničelni potencial ni doba povračila, ki je
 * neskončna, ampak podatek, ki ga nimamo.
 */
export function paybackMonths(investmentEUR: number, annualPotentialEUR: number): number | null {
  if (!Number.isFinite(annualPotentialEUR) || annualPotentialEUR <= 0) return null;
  if (!Number.isFinite(investmentEUR) || investmentEUR <= 0) return null;
  return (investmentEUR / annualPotentialEUR) * MONTHS_PER_YEAR;
}

export interface PaybackRow {
  investmentEUR: number;
  /** `null`, kadar dobe ni mogoče izračunati (glej paybackMonths). */
  months: number | null;
}

/**
 * Vrstice tabele povračila — ali `null`, kadar tabele ni videl nihče.
 *
 * Vrata so tu funkcija in ne pogoj pri klicatelju, ker jih odslej potrebujeta dva
 * dokumenta: strankino poročilo jo izriše, prodajna priprava pa mora vedeti natanko to,
 * kar je stranka videla — tudi kadar je to nič. Prepisan pogoj bi se ob prvi spremembi
 * praga razšel in priprava bi trdila, da je stranka videla tabelo, ki je ni.
 */
export function paybackRows(annualPotentialEUR: number | undefined): PaybackRow[] | null {
  if (annualPotentialEUR === undefined || annualPotentialEUR < MIN_POTENTIAL_FOR_PAYBACK_EUR) {
    return null;
  }
  return PAYBACK_TIERS_EUR.map((investmentEUR) => ({
    investmentEUR,
    months: paybackMonths(investmentEUR, annualPotentialEUR),
  }));
}

/**
 * Slovenska števna oblika z dvojino: 1 mesec, 2 meseca, 3 mesece, 5 mesecev.
 *
 * Ista potreba kot pri painfulNote() v ResultsView, le da je ta izraz uporabljen
 * na treh mestih (zaslon, strankin PDF, tabela povračila) in mora zato stati na
 * enem. Sklanjatev se ravna po ostanku pri 100 — "101 mesec", ne "101 mesecev".
 */
export function monthsLabel(months: number): string {
  const rounded = Math.max(0, Math.round(months));
  return `${rounded} ${slovenianForm(rounded, ['mesec', 'meseca', 'mesece', 'mesecev'])}`;
}

/** Enako za leta: 1 leto, 2 leti, 3 leta, 5 let. */
export function yearsLabel(years: number): string {
  const rounded = Math.max(0, Math.round(years));
  return `${rounded} ${slovenianForm(rounded, ['leto', 'leti', 'leta', 'let'])}`;
}

/**
 * Izbira med štirimi oblikami: ednina, dvojina, množina 3–4 in rodilnik množine.
 * Vrstni red v `forms` je [1, 2, 3–4, 5+].
 *
 * Izvoženo, ker isto sklanjatev potrebujejo tudi dnevi do tehničnega roka v prodajni
 * pripravi. Drugi zapis istega pravila bi se zmotil prav tam, kjer se je ta že: pri
 * ostanku nad sto ("101 dan", ne "101 dni").
 */
export function slovenianForm(count: number, forms: [string, string, string, string]): string {
  const remainder = count % 100;
  if (remainder === 1) return forms[0];
  if (remainder === 2) return forms[1];
  if (remainder === 3 || remainder === 4) return forms[2];
  return forms[3];
}
