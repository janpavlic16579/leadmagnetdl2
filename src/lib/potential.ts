import type { BusinessProfile, ImprovementBand, SegmentContext } from '../config/contexts';
import {
  isUnknownAnswer,
  type ComputeContext,
  type ModuleDefinition,
  type ModuleOutput,
} from '../config/modules/moduleTypes';
import { aggregateBuckets, isModuleAnswered, ANNUAL_BUCKETS, type BucketTotals } from './moduleEngine';

/**
 * Realistični potencial in zanesljivost ocene.
 *
 * Ločeno od moduleEngine namenoma: aggregateBuckets ostane nedotaknjen, da
 * migracijski test skladnosti s prejšnjim motorjem ostane neurejena priča. Če bi
 * ga za to razširili, bi test popravljali prav takrat, ko bi moral opozarjati.
 */

export interface PotentialRange {
  minEUR: number;
  maxEUR: number;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';

/** Vsota po koših, razširjena s potencialom in zanesljivostjo, kadar ju segment pozna. */
export interface ResultTotals extends BucketTotals {
  potential?: PotentialRange;
  confidence?: ConfidenceLevel;
}

/**
 * Σ (znesek × naslovljiv delež × pas izboljšave) čez vse LETNE koše.
 *
 * Enkratni kapital je izpuščen iz dveh razlogov: enkraten znesek se ne meša med
 * letne, pri zalogah pa je ta znesek že sam potencial in ne sedanji strošek —
 * množenje bi ga štelo dvakrat.
 */
export function computePotentialRange(outputs: ModuleOutput[], band: ImprovementBand): PotentialRange {
  let addressableEUR = 0;

  for (const output of outputs) {
    if (!ANNUAL_BUCKETS.includes(output.bucket as (typeof ANNUAL_BUCKETS)[number])) continue;
    if (output.addressableShare === undefined) continue;
    addressableEUR += (output.valueEUR ?? 0) * output.addressableShare;
  }

  return {
    minEUR: addressableEUR * band.min,
    maxEUR: addressableEUR * band.max,
  };
}

/** Skupne predpostavke za module. Ocenjena vrednost je sredina pasu, nikoli 0. */
export function buildComputeContext(profile: BusinessProfile): ComputeContext {
  return {
    operationalHourCostEUR: profile.operationalHour.valueEUR,
    adminHourCostEUR: profile.adminHour.valueEUR,
    chargeOutRateEUR: profile.chargeOutRate.valueEUR,
    annualRevenueEUR: profile.annualRevenue.value,
    contributionMarginRate: profile.contributionMargin.value,
  };
}

export interface AssessConfidenceParams {
  profile: BusinessProfile;
  /**
   * Kontekst dejavnosti — pove, KATERE urne postavke so bile sploh vprašane.
   * Brez njega bi se štela tudi zaračunana postavka pri proizvodnji, ki je ne
   * vpraša, in bi vsak proizvodni rezultat po nepotrebnem padel za eno stopnjo.
   */
  context: SegmentContext | undefined;
  /** Moduli, ki so bili dejansko vprašani. */
  modules: ModuleDefinition[];
  /** Vrednosti po modulu, že dopolnjene s privzetimi. */
  values: Record<string, Record<string, number>>;
  /**
   * Izidi istih modulov. Prispevajo utež in ne vsebine: brez njih bi bila
   * zanesljivost povprečje po ŠTEVILU polj (glej spodaj).
   */
  outputs: ModuleOutput[];
}

/**
 * Oznaka zanesljivosti. Kalkulator, ki ob praznem obrazcu pokaže natančen znesek,
 * ni verodostojen — zato je pomembno tudi povedati, koliko od tega je podatek in
 * koliko privzeta vrednost.
 *
 * Tehtano po DENARJU področja, ne po številu odgovorov (raziskava maloprodaje, F11).
 * Neizpolnjeno polje za 500 EUR in neizpolnjeno polje za 80.000 EUR sta doslej štela
 * enako, zato je oznaka merila potrpežljivost obiskovalca namesto zanesljivosti
 * prikazanega zneska. Področja brez denarja uteži nimajo — na natančnost vsote,
 * ki jo obiskovalec vidi, ne vplivajo.
 *
 * Polja s contextOnly se ne štejejo: vprašana so zaradi konteksta in jih uporabnik
 * ne more "pozabiti" izpolniti.
 */
export function assessConfidence({
  profile,
  context,
  modules,
  values,
  outputs,
}: AssessConfidenceParams): ConfidenceLevel {
  // Razmerje in ne števec: dejavnosti vprašajo različno število urnih postavk
  // (storitve tri, proizvodnja dve). Trdi "=== 2" bi storitveno podjetje, ki je
  // vneslo dve pravi postavki in eno ugibalo, kaznoval huje kot proizvodno z
  // enim ugibanjem od dveh.
  const asked: (boolean | undefined)[] = [
    profile.operationalHour.estimated,
    profile.adminHour.estimated,
    context?.chargeOutRate ? profile.chargeOutRate.estimated : undefined,
    context?.annualRevenue ? profile.annualRevenue.estimated : undefined,
    context?.contributionMargin ? profile.contributionMargin.estimated : undefined,
  ];
  const askedCount = asked.filter((estimated) => estimated !== undefined).length;
  const estimatedCount = asked.filter((estimated) => estimated === true).length;

  const allEstimated = askedCount > 0 && estimatedCount === askedCount;
  const noneEstimated = estimatedCount === 0;

  const weightByModule = annualEurByModule(outputs);

  let unknownAnswers = 0;
  let weightedFilled = 0;
  let weightSum = 0;
  let filledNumeric = 0;
  let totalNumeric = 0;

  for (const definition of modules) {
    const moduleValues = values[definition.id] ?? {};

    // Področje, ki ga je obiskovalec pustil v celoti na privzetih vrednostih, se ne
    // šteje. Prispeva namreč 0 EUR, zato je prikazana številka enaka, kot če ga sploh
    // ne bi izbral — različna oznaka za isti znesek bi merila obiskovalčevo
    // potrpežljivost in ne kakovosti podatkov. Neizmerjena področja se povedo drugje:
    // po imenu, v razdelku "Česa nismo izmerili".
    if (definition.triage && !isModuleAnswered(definition, moduleValues)) continue;

    let filled = 0;
    let total = 0;

    for (const field of definition.fields) {
      if (field.contextOnly) continue;
      const value = moduleValues[field.key];

      if (field.kind === 'choice') {
        const choice = field.choices?.find((option) => option.value === value);
        if (choice?.unknown) unknownAnswers += 1;
        continue;
      }
      if (field.kind === 'checkbox') continue;

      total += 1;
      // "Ne vem" je odgovor, ne podatek: ne šteje med izpolnjena in hkrati prepreči
      // najvišjo oznako. Prav to je razlika, ki jo pravilo "če ne veste, vpišite 0"
      // doslej skrilo.
      if (isUnknownAnswer(value)) {
        unknownAnswers += 1;
        continue;
      }
      // Nedotaknjen drsnik s privzetkom nad 0 (delež napak, strošek kilometra) ni
      // uporabnikov podatek — šteti ga med izpolnjena bi zvišalo zanesljivost prav
      // pri obiskovalcu, ki ni vnesel ničesar. Kdor vnese natanko privzeto vrednost,
      // je štet konservativno; smer napake je s tem vedno navzdol, nikoli navzgor.
      if (value > 0 && value !== field.default) filled += 1;
    }

    if (total === 0) continue;
    filledNumeric += filled;
    totalNumeric += total;

    const weight = weightByModule.get(definition.id) ?? 0;
    weightedFilled += weight * (filled / total);
    weightSum += weight;
  }

  const filledRatio =
    weightSum > 0
      ? weightedFilled / weightSum
      : totalNumeric === 0
        ? 0
        : filledNumeric / totalNumeric;

  if (filledRatio <= 0.5 || allEstimated) return 'low';
  if (noneEstimated && unknownAnswers === 0 && filledRatio >= 0.8) return 'high';
  return 'medium';
}

/** Letni denar po modulu — utež za zanesljivost. Enkratni kapital ne šteje. */
function annualEurByModule(outputs: ModuleOutput[]): Map<string, number> {
  const sums = new Map<string, number>();
  for (const output of outputs) {
    if (!ANNUAL_BUCKETS.includes(output.bucket as (typeof ANNUAL_BUCKETS)[number])) continue;
    sums.set(output.moduleId, (sums.get(output.moduleId) ?? 0) + (output.valueEUR ?? 0));
  }
  return sums;
}

export interface AggregateResultsOptions {
  /** Odsoten = segment potenciala ne računa; kartica se ne prikaže. */
  band?: ImprovementBand;
  confidence?: ConfidenceLevel;
}

export function aggregateResults(
  outputs: ModuleOutput[],
  options: AggregateResultsOptions = {},
): ResultTotals {
  const totals: ResultTotals = aggregateBuckets(outputs);
  if (options.band) totals.potential = computePotentialRange(outputs, options.band);
  if (options.confidence) totals.confidence = options.confidence;
  return totals;
}
