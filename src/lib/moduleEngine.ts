import type { ModuleDefinition, ModuleOutput } from '../config/modules/moduleTypes';

/**
 * Motor registra modulov. Vse funkcije so čiste — vsa logika (seštevanje po koših,
 * triažno ocenjevanje, izbira modulov) živi tu in ne v JSX, ker vitest teče v
 * okolju 'node' brez jsdom in komponent ni mogoče testirati.
 */

export interface BucketTotals {
  /** Hero znesek: samo trdi denar. */
  directLossEUR: number;
  capacityEUR: number;
  capacityHoursPerMonth: number;
  /** Enkraten znesek — nikoli se ne prišteje k directLossEUR. */
  oneTimeCapitalEUR: number;
  risks: ModuleOutput[];
}

export function aggregateBuckets(outputs: ModuleOutput[]): BucketTotals {
  const totals: BucketTotals = {
    directLossEUR: 0,
    capacityEUR: 0,
    capacityHoursPerMonth: 0,
    oneTimeCapitalEUR: 0,
    risks: [],
  };

  for (const output of outputs) {
    switch (output.bucket) {
      case 'directLoss':
        totals.directLossEUR += output.valueEUR ?? 0;
        break;
      case 'capacity':
        totals.capacityEUR += output.valueEUR ?? 0;
        totals.capacityHoursPerMonth += output.hoursPerMonth ?? 0;
        break;
      case 'oneTimeCapital':
        totals.oneTimeCapitalEUR += output.valueEUR ?? 0;
        break;
      case 'risk':
        totals.risks.push(output);
        break;
    }
  }

  return totals;
}

/**
 * Požene compute() vsakega izbranega modula in izide opremi z moduleId.
 * Moduli brez vnosa dobijo prazen zapis — compute() mora zdržati manjkajoča polja,
 * zato jih motor prej dopolni s privzetimi vrednostmi (glej resolveInputs).
 */
export function computeModules(
  definitions: ModuleDefinition[],
  inputsByModule: Record<string, Record<string, number>>,
): ModuleOutput[] {
  const outputs: ModuleOutput[] = [];
  for (const definition of definitions) {
    const input = resolveInputs(definition, inputsByModule[definition.id]);
    for (const draft of definition.compute(input)) {
      outputs.push({ ...draft, moduleId: definition.id });
    }
  }
  return outputs;
}

/** Privzete vrednosti modula, prekrite z uporabnikovim vnosom. Nikoli delno polje. */
export function resolveInputs(
  definition: ModuleDefinition,
  partial: Record<string, number> | undefined,
): Record<string, number> {
  const resolved: Record<string, number> = {};
  for (const field of definition.fields) {
    const value = partial?.[field.key];
    resolved[field.key] = Number.isFinite(value) ? (value as number) : field.default;
  }
  return resolved;
}

/** Izidi, razvrščeni po modulu — za razčlenitev in iskanje največje postavke. */
export function groupByModule(outputs: ModuleOutput[]): Record<string, ModuleOutput[]> {
  const grouped: Record<string, ModuleOutput[]> = {};
  for (const output of outputs) {
    (grouped[output.moduleId] ??= []).push(output);
  }
  return grouped;
}

/**
 * Modul z največjo denarno postavko — določa akcijski načrt.
 * Šteje se directLoss + capacity; enkratni kapital ne, ker bi ena velika zaloga
 * povozila vse ostalo, akcijski načrt pa mora naslavljati ponavljajočo se izgubo.
 * Ob izenačenju zmaga modul, ki je prej v podanem vrstnem redu (prioriteta segmenta).
 */
export function findHighestModule(outputs: ModuleOutput[], moduleOrder: string[]): string | null {
  const sums = new Map<string, number>();
  for (const output of outputs) {
    if (output.bucket !== 'directLoss' && output.bucket !== 'capacity') continue;
    sums.set(output.moduleId, (sums.get(output.moduleId) ?? 0) + (output.valueEUR ?? 0));
  }

  let best: string | null = null;
  let bestValue = 0;
  for (const id of moduleOrder) {
    const value = sums.get(id) ?? 0;
    if (value > bestValue) {
      best = id;
      bestValue = value;
    }
  }
  return best;
}

// --- Triaža -----------------------------------------------------------------

/** Ocene 0–3 po modulu, kot jih uporabnik izbere v koraku triaže. */
export type TriageScores = Record<string, number>;

/**
 * Izbere modula z najvišjo triažno oceno za podrobna vprašanja.
 *
 * `triageable` mora biti v prioritetnem vrstnem redu segmenta — ta odloči ob
 * izenačenju in hkrati poskrbi, da uporabnik brez odgovorov (vse ocene 0) dobi
 * prve module po prioriteti, ne naključnih.
 */
export function selectTopModules(
  triageable: string[],
  scores: TriageScores,
  detailCount: number,
): string[] {
  return triageable
    .map((id, index) => ({ id, score: scores[id] ?? 0, index }))
    .sort((a, b) => (b.score - a.score) || (a.index - b.index))
    .slice(0, detailCount)
    .map((entry) => entry.id)
    // Vrni jih spet v prioritetnem vrstnem redu, da je vprašalnik predvidljiv.
    .sort((a, b) => triageable.indexOf(a) - triageable.indexOf(b));
}

/**
 * Moduli, ki se dejansko vprašajo in izračunajo: izbrani stroškovni moduli plus
 * vsi moduli brez triaže (diagnostični in E), ki se prikažejo vedno.
 * Brez triaže (segment je nima) se vrnejo vsi moduli, kot je bilo doslej.
 */
export function resolveActiveModules(
  definitions: ModuleDefinition[],
  selected: string[] | null,
): ModuleDefinition[] {
  if (selected === null) return definitions;
  return definitions.filter(
    (definition) => definition.triage === undefined || selected.includes(definition.id),
  );
}
