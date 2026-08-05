import type { BusinessProfile, ImprovementBand, SegmentContext } from '../config/contexts';
import type { ComputeContext, ModuleDefinition, ModuleOutput } from '../config/modules/moduleTypes';
import { aggregateBuckets, isModuleAnswered, type BucketTotals } from './moduleEngine';

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
 * Σ (znesek × naslovljiv delež × pas izboljšave) čez neposredne izgube in kapaciteto.
 *
 * Enkratni kapital je izpuščen iz dveh razlogov: enkraten znesek se ne meša med
 * letne, pri zalogah pa je ta znesek že sam potencial in ne sedanji strošek —
 * množenje bi ga štelo dvakrat.
 */
export function computePotentialRange(outputs: ModuleOutput[], band: ImprovementBand): PotentialRange {
  let addressableEUR = 0;

  for (const output of outputs) {
    if (output.bucket !== 'directLoss' && output.bucket !== 'capacity') continue;
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
}

/**
 * Oznaka zanesljivosti. Kalkulator, ki ob praznem obrazcu pokaže natančen znesek,
 * ni verodostojen — zato je pomembno tudi povedati, koliko od tega je podatek in
 * koliko privzeta vrednost.
 *
 * Polja s contextOnly se ne štejejo: vprašana so zaradi konteksta in jih uporabnik
 * ne more "pozabiti" izpolniti.
 */
export function assessConfidence({
  profile,
  context,
  modules,
  values,
}: AssessConfidenceParams): ConfidenceLevel {
  // Razmerje in ne števec: dejavnosti vprašajo različno število urnih postavk
  // (storitve tri, proizvodnja dve). Trdi "=== 2" bi storitveno podjetje, ki je
  // vneslo dve pravi postavki in eno ugibalo, kaznoval huje kot proizvodno z
  // enim ugibanjem od dveh.
  const asked: (boolean | undefined)[] = [
    profile.operationalHour.estimated,
    profile.adminHour.estimated,
    context?.chargeOutRate ? profile.chargeOutRate.estimated : undefined,
  ];
  const askedCount = asked.filter((estimated) => estimated !== undefined).length;
  const estimatedCount = asked.filter((estimated) => estimated === true).length;

  const allEstimated = askedCount > 0 && estimatedCount === askedCount;
  const noneEstimated = estimatedCount === 0;

  let unknownChoices = 0;
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

    for (const field of definition.fields) {
      if (field.contextOnly) continue;
      const value = moduleValues[field.key];

      if (field.kind === 'choice') {
        const choice = field.choices?.find((option) => option.value === value);
        if (choice?.unknown) unknownChoices += 1;
        continue;
      }
      if (field.kind === 'checkbox') continue;

      totalNumeric += 1;
      // Nedotaknjen drsnik s privzetkom nad 0 (delež napak, strošek kilometra) ni
      // uporabnikov podatek — šteti ga med izpolnjena bi zvišalo zanesljivost prav
      // pri obiskovalcu, ki ni vnesel ničesar. Kdor vnese natanko privzeto vrednost,
      // je štet konservativno; smer napake je s tem vedno navzdol, nikoli navzgor.
      if (value > 0 && value !== field.default) filledNumeric += 1;
    }
  }

  const filledRatio = totalNumeric === 0 ? 0 : filledNumeric / totalNumeric;

  if (filledRatio <= 0.5 || allEstimated) return 'low';
  if (noneEstimated && unknownChoices === 0 && filledRatio >= 0.8) return 'high';
  return 'medium';
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
