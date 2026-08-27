import type { EURRange, TotalsRange } from './range';

/**
 * Naslovna letna številka ("Skupaj na leto") in njen razpon — na enem mestu.
 *
 * Vsota treh letnih košev je bila zapisana petkrat: na zaslonu (ResultsView), v
 * strankinem PDF (pdf.ts), v signalih za oceno ustreznosti (salesReport.ts) in dvakrat v
 * prodajnem priročniku (salesPlaybook.ts). Sestava razpona iz treh razponov pa dvakrat.
 * Dokler je bila razlika samo teoretična, to ni motilo; odkar prodajna priprava izpisuje
 * ISTO številko, kot jo bere stranka, bi vsak razhod pomenil, da svetovalec na sestanku
 * pove drug znesek od tistega, ki ga ima stranka pred sabo.
 *
 * Modul je namenoma nevtralen in ne ve ne za strankino ne za prodajno poročilo: pdf.ts
 * ne sme uvažati ničesar s prodajne poti (varuje pdf.test.ts), zato skupni izračun ne
 * more živeti v salesReport.ts.
 *
 * Enkratni kapital ostane zunaj: enkraten znesek se z letnimi ne sešteva.
 */
export interface HeroBuckets {
  directLossEUR: number;
  lostMarginEUR: number;
  capacityEUR: number;
}

export function heroValueEUR(buckets: HeroBuckets): number {
  return buckets.directLossEUR + buckets.lostMarginEUR + buckets.capacityEUR;
}

/**
 * Razpon naslovne številke, kadar finančna osnova stoji na izbranih pasovih.
 *
 * `undefined` in ne `null`, ker je to oblika, ki jo pričakujeta `formatAmount` in
 * `displayRange`.
 */
export function heroRangeEUR(range: TotalsRange | null | undefined): EURRange | undefined {
  if (!range) return undefined;
  return {
    minEUR: range.directLoss.minEUR + range.lostMargin.minEUR + range.capacity.minEUR,
    maxEUR: range.directLoss.maxEUR + range.lostMargin.maxEUR + range.capacity.maxEUR,
  };
}
