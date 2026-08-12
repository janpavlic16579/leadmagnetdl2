import {
  isUnknownAnswer,
  type ComputeContext,
  type ModuleDefinition,
  type ModuleOutput,
} from '../config/modules/moduleTypes';

/**
 * Zasilne predpostavke za module, ki jih uporabljajo, kadar jih klicatelj ne poda
 * (starejši segmenti in testi). Urne postavke namenoma niso 0 — ničla bi tiho
 * vrnila 0 EUR in izgledala kot veljaven izračun.
 *
 * Prihodek je izjema in je 0: je edina predpostavka, ki jo uporabnikov odstotek
 * množi in ne obratno, zato bi privzeta vrednost ustvarila znesek, ki ga ni vnesel
 * nihče (glej ComputeContext.annualRevenueEUR).
 */
export const DEFAULT_COST_CONTEXT: ComputeContext = {
  operationalHourCostEUR: 45,
  adminHourCostEUR: 35,
  chargeOutRateEUR: 75,
  annualRevenueEUR: 0,
  contributionMarginRate: 0.25,
  capitalCostRate: 0.06,
};

/**
 * Motor registra modulov. Vse funkcije so čiste — vsa logika (seštevanje po koših,
 * triažno ocenjevanje, izbira modulov) živi tu in ne v JSX, ker vitest teče v
 * okolju 'node' brez jsdom in komponent ni mogoče testirati.
 */

export interface BucketTotals {
  /** Hero znesek: samo trdi denar. */
  directLossEUR: number;
  /** Marža, ki ni bila zaslužena — letna, a druge vrste dokaz kot directLoss. */
  lostMarginEUR: number;
  capacityEUR: number;
  capacityHoursPerMonth: number;
  /** Enkraten znesek — nikoli se ne prišteje k directLossEUR. */
  oneTimeCapitalEUR: number;
  risks: ModuleOutput[];
}

export function aggregateBuckets(outputs: ModuleOutput[]): BucketTotals {
  const totals: BucketTotals = {
    directLossEUR: 0,
    lostMarginEUR: 0,
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
      case 'lostMargin':
        totals.lostMarginEUR += output.valueEUR ?? 0;
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
  context: ComputeContext = DEFAULT_COST_CONTEXT,
): ModuleOutput[] {
  const outputs: ModuleOutput[] = [];
  for (const definition of definitions) {
    const input = withoutUnknowns(resolveInputs(definition, inputsByModule[definition.id]));
    for (const draft of definition.compute(input, context)) {
      outputs.push({ ...draft, moduleId: definition.id });
    }
  }
  return outputs;
}

/**
 * "Ne vem" pretvori v 0 tik pred compute().
 *
 * Na enem mestu in ne v vsakem modulu: sentinela je negativna, zato bi pozabljena
 * pretvorba dala negativen znesek, ki bi se v vsoti tiho odštel od resničnih izgub.
 * Razlika med "ne vem" in "nič" ostane vidna v neobdelanih vrednostih, ki jih dobi
 * ocena zanesljivosti in izvozni zapis — izračun je edini, ki je ne sme videti.
 */
function withoutUnknowns(values: Record<string, number>): Record<string, number> {
  const clean: Record<string, number> = {};
  for (const [key, value] of Object.entries(values)) {
    clean[key] = isUnknownAnswer(value) ? 0 : value;
  }
  return clean;
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

/** Koši, ki merijo LETNO bolečino. Enkratni kapital ni med njimi. */
export const ANNUAL_BUCKETS = ['directLoss', 'lostMargin', 'capacity'] as const;

function isAnnualBucket(output: ModuleOutput): boolean {
  return (ANNUAL_BUCKETS as readonly string[]).includes(output.bucket);
}

/**
 * Modul z največjo denarno postavko — določa akcijski načrt.
 * Štejejo se letni koši; enkratni kapital ne, ker bi ena velika zaloga povozila vse
 * ostalo, akcijski načrt pa mora naslavljati ponavljajočo se izgubo.
 * Ob izenačenju zmaga modul, ki je prej v podanem vrstnem redu (prioriteta segmenta).
 */
export function findHighestModule(outputs: ModuleOutput[], moduleOrder: string[]): string | null {
  const sums = new Map<string, number>();
  for (const output of outputs) {
    if (!isAnnualBucket(output)) continue;
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
 * Izbere module z najvišjo triažno oceno za podrobna vprašanja.
 *
 * `triageable` je vrstni red PRIKAZA (moduleIds segmenta); v njem se izid tudi vrne,
 * da je vprašalnik predvidljiv.
 *
 * `preferred` je vrstni red PREDNOSTI — področja, ki stranke te dejavnosti najbolj
 * mučijo. Odloči ob izenačenih ocenah in s tem določi privzeto izbiro obiskovalca,
 * ki še ni odgovoril ničesar (vse ocene 0). Pojma sta ločena namenoma: vrstni red
 * prikaza razrešuje tudi "največjo postavko" in vrstni red v PDF-ju, zato ga ni
 * mogoče premakniti samo zato, da bi popravili privzeto izbiro.
 *
 * Brez `preferred` je razvrstitev identična prejšnji — prednost je kar vrstni red prikaza.
 * Neznan id v `preferred` (napačna konfiguracija) se tiho preskoči: ne ujame se z
 * ničimer, mesto pa zapolni naslednji po vrstnem redu prikaza. Skladnost varuje test.
 */
export function selectTopModules(
  triageable: string[],
  scores: TriageScores,
  count: number,
  preferred: string[] = [],
): string[] {
  const rankOf = (id: string) => {
    const index = preferred.indexOf(id);
    return index === -1 ? preferred.length + triageable.indexOf(id) : index;
  };

  return triageable
    .map((id) => ({ id, score: scores[id] ?? 0, rank: rankOf(id) }))
    .sort((a, b) => (b.score - a.score) || (a.rank - b.rank))
    .slice(0, count)
    .map((entry) => entry.id)
    // Vrni jih spet v vrstnem redu prikaza, da je vprašalnik predvidljiv.
    .sort((a, b) => triageable.indexOf(a) - triageable.indexOf(b));
}

/**
 * Je obiskovalec to področje sploh izpolnil?
 *
 * Nedotaknjeno področje prispeva natanko 0 EUR — vsak neničelni privzetek je delež
 * ali postavka, ki se vedno množi s količino s privzetkom 0. Ker izbira področja
 * torej sama po sebi ne doda nobenega evra, se sme neizpolnjeno področje šteti kot
 * neizmerjeno: ne pri oceni zanesljivosti in ne v razdelku "Česa nismo izmerili".
 *
 * Polja contextOnly se ne štejejo (ne vstopajo v formulo), polja checkbox pa tudi ne:
 * njihov privzetek 0 pomeni "ni odkljukano" in ne "ni odgovorjeno".
 *
 * "Ne vem" prav tako ne šteje kot izmerjeno. Je poštena izjava in ne izmikanje,
 * vendar prispeva natanko 0 EUR — če bi štela, bi področje, kjer obiskovalec ne ve
 * ničesar, izpadlo izmerjeno in ne bi pristalo v razdelku "Česa nismo izmerili".
 */
export function isModuleAnswered(
  definition: ModuleDefinition,
  values: Record<string, number> | undefined,
): boolean {
  if (!values) return false;
  return definition.fields.some((field) => {
    if (field.contextOnly || field.kind === 'checkbox') return false;
    const value = values[field.key];
    if (isUnknownAnswer(value)) return false;
    return value !== undefined && value !== field.default;
  });
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
