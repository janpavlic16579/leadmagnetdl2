import {
  DEFAULT_COST_CONTEXT,
  isUnansweredChoice,
  isUnknownAnswer,
  isUnknownChoiceValue,
  type ComputeContext,
  type ModuleDefinition,
  type ModuleOutput,
} from '../config/modules/moduleTypes';
import { MAIN_CAUSE_KEY } from '../config/modules/addressableShare';

/**
 * Zasilne predpostavke živijo pri tipu, ki ga opisujejo (config/modules/moduleTypes).
 * Tu se ponovno izvozijo, ker jih pod tem imenom uvaža več testov in ker je motor
 * njihov glavni uporabnik.
 */
export { DEFAULT_COST_CONTEXT };

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
    // "Ne vem" in neodgovorjena izbira nista izmerjena podatka: oba prispevata
    // 0 EUR in oba padeta na konservativni delež. Doslej ju je pokrivala že
    // primerjava s privzetkom, ker je bil privzetek glavnega vzroka prav "Ne vemo".
    // Odkar vzrok privzetka nima (MAIN_CAUSE_UNANSWERED), mora biti pravilo
    // izrecno — sicer bi izbrani "Ne vemo" štel kot odgovor in bi področje brez
    // ene same vnesene številke izpadlo iz razdelka "Česa nismo izmerili".
    if (isUnknownChoiceValue(field, value) || isUnansweredChoice(field, value)) return false;
    return value !== undefined && value !== field.default;
  });
}

/**
 * Področja, kjer je znesek že vnesen, glavni vzrok pa ne izbran.
 *
 * Pogoj je NAMENOMA dvojni. Obiskovalcu, ki področja sploh ni izpolnil, se
 * neodgovorjen vzrok ne sme očitati — opozorilo je smiselno šele, ko obstaja
 * znesek, ki ga delež množi. Brez tega bi vsak, ki stran preleti, dobil očitek
 * za polje, ki na njegov rezultat sploh ne vpliva.
 *
 * Živi tu in ne v komponenti, ker vitest teče v okolju 'node' brez jsdom in
 * logike v JSX ni mogoče pokriti s testi.
 */
export function modulesMissingMainCause(
  definitions: ModuleDefinition[],
  values: Record<string, Record<string, number>>,
): ModuleDefinition[] {
  return definitions.filter((definition) => {
    const moduleValues = values[definition.id];
    if (!isModuleAnswered(definition, moduleValues)) return false;
    return definition.fields.some(
      (field) => field.key === MAIN_CAUSE_KEY && isUnansweredChoice(field, moduleValues?.[field.key]),
    );
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

/**
 * Razdelitev koraka z vnosi na strani: eno stroškovno področje na stran.
 *
 * Moduli brez triaže (diagnostika, E) si delijo zadnjo stran — nista stroškovni
 * področji, ampak kratki dodatek, in vsak na svoji strani bi obiskovalcu obljubil
 * dva koraka dela tam, kjer sta skupaj pet vprašanj.
 *
 * Vrstni red se ohrani sam: seznam prihaja urejen po registru, kjer sta diagnostika
 * in E že na koncu.
 */
export function splitIntoInputPages(modules: ModuleDefinition[]): ModuleDefinition[][] {
  const pages = modules.filter((definition) => definition.triage).map((definition) => [definition]);
  const alwaysShown = modules.filter((definition) => !definition.triage);
  if (alwaysShown.length) pages.push(alwaysShown);
  return pages;
}
