import { industryAverageBand, industryAverageScaleBand } from '../config/contexts';
import type {
  BusinessProfile,
  CostAssumption,
  CostQuestion,
  ScaleAssumption,
  ScaleQuestion,
  SegmentContext,
} from '../config/contexts';
import type { ComputeContext, ModuleDefinition } from '../config/modules/moduleTypes';
import { aggregateBuckets, computeModules } from './moduleEngine';
import { computeAddressablePotentialEUR } from './potential';

/**
 * Rezultat kot razpon, kadar finančna osnova stoji na izbranih razponih.
 *
 * Sredina pasu je doslej vstopila v izračun kot točka: kdor je izbral "3–10 mio
 * EUR", je dobil izračun iz natanko 5,5 mio — številko, ki je ni nikoli izrekel,
 * prikazano z natančnostjo, ki je podatek nima. Pas "3–10 mio" sam pokriva
 * 3,3-kratni razpon, stisnjen v eno piko.
 *
 * Rešitev: izračun se požene še dvakrat — enkrat s spodnjimi in enkrat z zgornjimi
 * mejami vseh IZBRANIH pasov. Vnesena vrednost ostane točka (low = high = vnos),
 * privzetek dejavnosti prav tako (zanj razpona ni, ker ga uporabnik ni izbral).
 * Prevzeto povprečje panoge šteje kot pas: obiskovalec je izbral NAŠO oceno, ta pa
 * ima razpršenost, ki je ena sama pika ne pokaže.
 * Moduli se ne spreminjajo — spremeni se samo kontekst, s katerim se pokličejo.
 *
 * Kadar nič ni ocenjeno s pasom, funkcija vrne null in prikaz ostane točka —
 * "12.400 EUR – 12.400 EUR" bi izgledalo kot napaka.
 */

export interface EURRange {
  minEUR: number;
  maxEUR: number;
}

export interface TotalsRange {
  directLoss: EURRange;
  lostMargin: EURRange;
  capacity: EURRange;
  oneTimeCapital: EURRange;
  /**
   * Naslovljiv potencial iz spodnjega in zgornjega konteksta. Razpon izvira SAMO iz
   * razpršenosti skupnih predpostavk — odpravljivost je ocenjena enkrat, z naslovljivim
   * deležem glavnega vzroka. Kadar so vse predpostavke vnesene, sta meji enaki in
   * displayRange prikaz vrne na točko.
   */
  potential?: EURRange;
}

interface ValueRange {
  low: number;
  high: number;
}

/**
 * Razpon postavke izhaja iz zapisanega izvora, ne več iz ujemanja sredine.
 *
 * Izbran pas da svoji meji. Prevzeto povprečje panoge da meji pasu, ki povprečje
 * vsebuje — je ocena z razpršenostjo in ne meritev. Vneseno število in neodgovor
 * ostaneta točka: prvo, ker je podatek, drugo, ker si razpona okoli privzetka, ki
 * ga obiskovalec ni izbral, ne smemo pripisati.
 */
function costRange(question: CostQuestion | undefined, assumption: CostAssumption): ValueRange {
  if (question) {
    if (assumption.source === 'band') {
      const band = question.bands.find((candidate) => candidate.id === assumption.bandId);
      if (band) return { low: band.minEUR, high: band.maxEUR };
    }
    if (assumption.source === 'industryAverage') {
      const band = industryAverageBand(question);
      if (band) return { low: band.minEUR, high: band.maxEUR };
    }
  }
  return { low: assumption.valueEUR, high: assumption.valueEUR };
}

function scaleRange(question: ScaleQuestion | undefined, assumption: ScaleAssumption): ValueRange {
  if (question) {
    if (assumption.source === 'band') {
      const band = question.bands.find((candidate) => candidate.id === assumption.bandId);
      if (band) return { low: band.min, high: band.max };
    }
    // Enako kot pri urni postavki: prevzeto povprečje je ocena z razpršenostjo.
    // Brez te veje bi isti klik pri marži dal navidezno natančno točko, pri urni
    // postavki pa razpon — ista poteza z dvema različnima merama natančnosti.
    if (assumption.source === 'industryAverage') {
      const band = industryAverageScaleBand(question);
      if (band) return { low: band.min, high: band.max };
    }
  }
  return { low: assumption.value, high: assumption.value };
}

/** Spodnji in zgornji kontekst; null, kadar sta enaka (nič ni izbran pas). */
export function buildComputeContextRange(
  profile: BusinessProfile,
  context: SegmentContext | undefined,
): { low: ComputeContext; high: ComputeContext } | null {
  if (!context) return null;

  const operational = costRange(context.operationalHour, profile.operationalHour);
  const admin = costRange(context.adminHour, profile.adminHour);
  const chargeOut = costRange(context.chargeOutRate, profile.chargeOutRate);
  const revenue = scaleRange(context.annualRevenue, profile.annualRevenue);
  const margin = scaleRange(context.contributionMargin, profile.contributionMargin);
  const capital = scaleRange(context.capitalCostRate, profile.capitalCostRate);

  const spans = [operational, admin, chargeOut, revenue, margin, capital];
  if (spans.every((span) => span.low === span.high)) return null;

  return {
    low: {
      operationalHourCostEUR: operational.low,
      adminHourCostEUR: admin.low,
      chargeOutRateEUR: chargeOut.low,
      annualRevenueEUR: revenue.low,
      contributionMarginRate: margin.low,
      capitalCostRate: capital.low,
    },
    high: {
      operationalHourCostEUR: operational.high,
      adminHourCostEUR: admin.high,
      chargeOutRateEUR: chargeOut.high,
      annualRevenueEUR: revenue.high,
      contributionMarginRate: margin.high,
      capitalCostRate: capital.high,
    },
  };
}

export interface BuildTotalsRangeParams {
  modules: ModuleDefinition[];
  /** Vrednosti, že dopolnjene s privzetimi (resolveInputs). */
  values: Record<string, Record<string, number>>;
  profile: BusinessProfile;
  context: SegmentContext | undefined;
  /** Ali segment potencial sploh računa — enako stikalo kot pri aggregateResults. */
  includePotential?: boolean;
}

export function buildTotalsRange(params: BuildTotalsRangeParams): TotalsRange | null {
  const contexts = buildComputeContextRange(params.profile, params.context);
  if (!contexts) return null;

  const outputsLow = computeModules(params.modules, params.values, contexts.low);
  const outputsHigh = computeModules(params.modules, params.values, contexts.high);
  const low = aggregateBuckets(outputsLow);
  const high = aggregateBuckets(outputsHigh);

  return {
    directLoss: { minEUR: low.directLossEUR, maxEUR: high.directLossEUR },
    lostMargin: { minEUR: low.lostMarginEUR, maxEUR: high.lostMarginEUR },
    capacity: { minEUR: low.capacityEUR, maxEUR: high.capacityEUR },
    oneTimeCapital: { minEUR: low.oneTimeCapitalEUR, maxEUR: high.oneTimeCapitalEUR },
    potential: params.includePotential
      ? {
          minEUR: computeAddressablePotentialEUR(outputsLow),
          maxEUR: computeAddressablePotentialEUR(outputsHigh),
        }
      : undefined,
  };
}

/**
 * Razpon za prikaz ene postavke: null pomeni "prikaži točko". Zavrne se tudi
 * izrojen razpon (min == max) — nastane, kadar postavke ne množi nobena ocenjena
 * predpostavka.
 */
export function displayRange(range: EURRange | undefined): EURRange | null {
  if (!range) return null;
  if (Math.round(range.minEUR) === Math.round(range.maxEUR)) return null;
  return range;
}
