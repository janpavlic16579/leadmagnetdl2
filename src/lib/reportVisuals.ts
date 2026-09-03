import { heroValueEUR, type HeroBuckets } from './heroTotals';
import { HORIZON_YEARS, multiYearEUR } from './horizon';

/**
 * Podatki za grafične prikaze strankinega poročila — na enem mestu za oba medija.
 *
 * Zaslon in strankin PDF izrisujeta iste vizuale z različnima orodjema (Recharts
 * oziroma ročne pravokotnike v jsPDF). Dokler je vsak sam računal deleže, vrstni
 * red in višine, je bil razhod vprašanje časa: dokument, ki roma do uprave, bi
 * področja razvrstil drugače od zaslona, ki ga je obiskovalec pravkar gledal.
 *
 * Vse funkcije so čiste in brez I/O — vitest teče v okolju 'node' brez jsdom,
 * zato logike v JSX ni mogoče pokriti s testi (enako načelo kot horizon.ts).
 * Prikaz sme sestavljati nize, računati pa ne.
 */

// --- Sestava naslovne vsote --------------------------------------------------

export type CompositionKey = 'directLoss' | 'lostMargin' | 'capacity';

export interface CompositionSegment {
  key: CompositionKey;
  valueEUR: number;
  /** Delež naslovne vsote, 0–1. Deleži prisotnih segmentov se seštejejo v 1. */
  share: number;
}

/**
 * Iz česa je naslovna številka sestavljena.
 *
 * Opomba pod hero zneskom je to doslej povedala z besedami, kar je zahtevalo, da
 * bralec tri vrste denarja sešteje v glavi. Naložena vrstica isto pove s
 * širinami: vidi se, kateri koš nosi večino zneska, in da so koši trije.
 *
 * Ničelni koši izpadejo — segment širine nič bi bil v legendi naveden kot
 * postavka, na vrstici pa ga ne bi bilo videti, kar izpade kot napaka izrisa.
 * Pri ničelni vsoti vrne prazen seznam in ne segmentov z NaN deleži.
 */
export function compositionSegments(buckets: HeroBuckets): CompositionSegment[] {
  const total = heroValueEUR(buckets);
  if (!(total > 0)) return [];

  const all: { key: CompositionKey; valueEUR: number }[] = [
    { key: 'directLoss', valueEUR: buckets.directLossEUR },
    { key: 'lostMargin', valueEUR: buckets.lostMarginEUR },
    { key: 'capacity', valueEUR: buckets.capacityEUR },
  ];

  return all
    .filter((segment) => segment.valueEUR > 0)
    .map((segment) => ({ ...segment, share: segment.valueEUR / total }));
}

// --- Razčlenitev po področjih ------------------------------------------------

export interface BreakdownDatum {
  /** Naslov modula — ena vrstica na področje, ne na posamezno postavko. */
  name: string;
  directLossEUR: number;
  lostMarginEUR: number;
  capacityEUR: number;
}

export interface BreakdownRow extends BreakdownDatum {
  totalEUR: number;
  /** Delež vsote vseh vrstic, 0–1. */
  share: number;
  /** Največja postavka — dobi poudarek in svojo omembo nad grafom. */
  isTop: boolean;
}

/**
 * Področja, urejena po velikosti — EDINA avtoriteta vrstnega reda za oba medija.
 *
 * Doslej sta zaslon in PDF vsak zase sestavila polje v vrstnem redu segmenta
 * (segments.ts), torej po vsebinski logiki vprašalnika in ne po velikosti
 * zneska. Bralec je moral sam poiskati, kje izgublja največ — to je prvo
 * vprašanje, ki ga ob razčlenitvi ima, in postavitev nanj ni odgovarjala.
 *
 * Vezanost pri enakem znesku razreši vrstni red vhoda (stabilno razvrščanje),
 * kar je vrstni red segmenta — enako pravilo kot pri findHighestModule.
 */
export function breakdownRows(data: BreakdownDatum[]): BreakdownRow[] {
  const withTotals = data.map((datum) => ({
    ...datum,
    totalEUR: datum.directLossEUR + datum.lostMarginEUR + datum.capacityEUR,
  }));

  const sum = withTotals.reduce((total, row) => total + row.totalEUR, 0);
  const sorted = [...withTotals].sort((a, b) => b.totalEUR - a.totalEUR);

  return sorted.map((row, index) => ({
    ...row,
    share: sum > 0 ? row.totalEUR / sum : 0,
    isTop: index === 0,
  }));
}

/** Višina ene vrstice grafa v pikslih — ime področja, naložen stolpec in zrak. */
export const BREAKDOWN_ROW_HEIGHT_PX = 56;

/** Prostor za legendo in os pod vrsticami. */
const BREAKDOWN_CHROME_PX = 48;

/**
 * Višina grafa razčlenitve.
 *
 * Ista funkcija hrani višino grafa IN rezervata, ki stoji namesto njega, dokler
 * se Recharts nalaga. Dokler je bil rezervat fiksnih 260 px, graf pa na ozkem
 * zaslonu visok toliko, kolikor je vrstic, je vsebina pod njim ob prihodu grafa
 * poskočila — točno tisto, kar naj bi rezervat preprečil.
 *
 * Stoji tu in ne v BreakdownChart.tsx: ResultsView uvaža iz te komponente samo
 * tip (izbrisan ob prevodu, verbatimModuleSyntax), uvoz vrednosti pa bi Recharts
 * potegnil v glavni sveženj in izničil leno nalaganje.
 */
export function breakdownChartHeightPx(rowCount: number): number {
  if (rowCount <= 0) return 0;
  return rowCount * BREAKDOWN_ROW_HEIGHT_PX + BREAKDOWN_CHROME_PX;
}

// --- Večletna projekcija -----------------------------------------------------

export interface ProjectionPoint {
  /** Zaporedno leto, 1 … HORIZON_YEARS. */
  year: number;
  cumulativeEUR: number;
  /** Delež zadnjega leta, 0–1 — dolžina stolpca. Zadnje leto je vedno 1. */
  fraction: number;
}

/**
 * Kumulativa po letih.
 *
 * Trojni znesek je bil doslej ena sama številka. Kot ena številka je trditev, ki
 * jo bralec vzame ali ne vzame; kot naraščajoče vrstice je pot, po kateri znesek
 * do nje pride — in prav ta pot je argument, da odlašanje ni brezplačno.
 *
 * Vrednosti gredo skozi multiYearEUR in ne skozi lastno množenje: kadar bi
 * obzorje kdaj dobilo rast ali diskontiranje, se mora projekcija spremeniti z
 * njim, ne pa ostati zvesta stari formuli.
 */
export function projectionSeries(annualEUR: number, years: number = HORIZON_YEARS): ProjectionPoint[] {
  if (!(annualEUR > 0) || years < 1) return [];

  const points: ProjectionPoint[] = [];
  const finalEUR = multiYearEUR(annualEUR, years);

  for (let year = 1; year <= years; year += 1) {
    const cumulativeEUR = multiYearEUR(annualEUR, year);
    points.push({
      year,
      cumulativeEUR,
      fraction: finalEUR > 0 ? cumulativeEUR / finalEUR : 0,
    });
  }

  return points;
}

// --- Pokritost ---------------------------------------------------------------

export interface CoverageSegment {
  index: number;
  measured: boolean;
}

/**
 * Pokritost izračuna kot vrstica segmentov: koliko področij je izmerjenih od
 * ponujenih.
 *
 * Stavek "Izmerjeno 3 od 11 področij" je resničen, a ga bralec prebere kot
 * opombo. Enajst kvadratkov, od katerih so trije polni, pove isto kot slika in
 * postavi naslovni znesek tja, kamor spada: to je spodnja meja, ne meritev
 * celote (ista utemeljitev kot pri okvirju "Česa ta znesek ne vsebuje").
 */
export function coverageSegments(measuredCount: number, triageableCount: number): CoverageSegment[] {
  const total = Math.max(0, Math.floor(triageableCount));
  const measured = Math.min(Math.max(0, Math.floor(measuredCount)), total);

  return Array.from({ length: total }, (_, index) => ({
    index,
    measured: index < measured,
  }));
}
