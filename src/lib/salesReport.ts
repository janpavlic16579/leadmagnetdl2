import type { SegmentContext, BusinessProfile, ImprovementBand } from '../config/contexts';
import { improvementBandFor, isTechnicalRiskModuleVisible } from '../config/contexts';
import { getIndustryLabel } from '../config/industries';
import type { ModuleDefinition, ModuleOutput } from '../config/modules/moduleTypes';
import type { SegmentConfig } from '../config/segments';
import { getSizeClass } from '../config/sizeClasses';
import { getActionPlan, type ActionPlanEntry } from '../../content/actions/actions';
import { MODULE_METHODOLOGY, type ModuleMethodology } from '../../content/methodology';
import {
  contextOptionLabel,
  costBandLabel,
  fieldAnswerText,
  isAnswered,
  isPantheonCustomer,
  isUnknownChoice,
  mainCauseLabel,
  triageScoreLabel,
} from './answerLabels';
import type { FollowUpSequence } from './followUp';
import { groupByModule, type TriageScores } from './moduleEngine';
import type { ConfidenceLevel, ResultTotals } from './potential';

/**
 * Priprava na pogovor: kar je stranka vnesla, zbrano na enem mestu.
 *
 * Doslej se je ob oddaji obrazca zgodil samo strankin PDF, vse ostalo pa se je
 * zavrglo — odgovori, triažne ocene za neizmerjena področja, podatek o tem, katere
 * številke so bile ugibane. Prodajnik je torej prišel na sestanek z istim listom
 * kot stranka in brez enega samega podatka več.
 *
 * NAMENOMA BREZ INTERNIH OCEN LEADA. Datoteka se prenese na napravo, kjer sedi
 * stranka, zato tu ni ničesar, česar ji prodajnik ne bi mogel povedati v obraz:
 * nobenega točkovanja, nobenih scenarijev za pritisk. Poročilo pove, kaj je stranka
 * odgovorila, katere številke so trdne in katere ne, ter kaj se splača preveriti.
 * To ni omejitev uporabnosti — na sestanku šteje prav to.
 *
 * Gradnik je čista funkcija brez dostopa do DOM ali datuma: časovni žig pride kot
 * parameter. Predstavitev (PDF, HTML) je zato zamenljiva, test pa determinističen.
 */

export interface SalesReportMeta {
  generatedAtISO: string;
  companyName: string;
  email: string;
  gdprConsent: boolean;
  utmSource: string | null;
}

export interface SalesReportQualification {
  industryLabel: string;
  segmentName: string;
  sizeClass: string;
  employeeCount: number;
  /** Oznaka, ne id — "Vodja skladišča ali logistike" in ne "vodjaSkladisca". */
  roleLabel: string | null;
  businessTypeLabel: string | null;
  currentSystemLabel: string | null;
  /** Od tega je odvisno, ali so tehnična opozorila (ZIERDED, SQL Server) sploh smiselna. */
  isPantheonCustomer: boolean;
  improvementBand: ImprovementBand;
  followUpSequence: FollowUpSequence;
}

export interface SalesReportSummary {
  directLossEUR: number;
  capacityEUR: number;
  capacityHoursPerMonth: number;
  oneTimeCapitalEUR: number;
  potentialMinEUR?: number;
  potentialMaxEUR?: number;
  confidence?: ConfidenceLevel;
  /** Zakaj ta oznaka — brez tega je "nizka zanesljivost" očitek brez naslova. */
  confidenceReason: string;
}

export interface HourAssumptionRow {
  label: string;
  valueEUR: number;
  estimated: boolean;
  /**
   * Izbrani razpon, kadar postavka ni vnesena — sicer null.
   *
   * Trije primeri, ki jih je treba razlikovati, ker vsak pove nekaj drugega:
   * `estimated === false` je strankin podatek; `estimated` z oznako razpona pomeni,
   * da je stranka razpon vsaj izbrala; `estimated` brez oznake pa, da ni odgovorila
   * nič in je v veljavi privzetek dejavnosti (fallbackEUR se namenoma ne ujema z
   * nobeno sredino razpona, sicer bi izgledal kot izbira). Zadnji primer je najšibkejši
   * in prodajnik mora to vedeti.
   */
  bandLabel: string | null;
}

/** Besedilo, ki ga za urno postavko vidi bralec poročila. */
export function hourAssumptionSource(row: HourAssumptionRow): string {
  if (!row.estimated) return 'vneseno';
  return row.bandLabel ? `izbran razpon ${row.bandLabel}` : 'ni odgovora — privzetek dejavnosti';
}

export interface SoftFieldRow {
  moduleTitle: string;
  question: string;
}

/**
 * Kje izračun stoji na ugibanju. To je razdelek, zaradi katerega poročilo obstaja:
 * pove, katero številko sme prodajnik na sestanku izpostaviti in katere ne.
 */
export interface SalesReportSoftness {
  hourAssumptions: HourAssumptionRow[];
  /** Polja, kjer je stranka izbrala "Ne vem" oziroma "Ne vemo". */
  unknownAnswers: SoftFieldRow[];
  /** Številska polja, ki so ostala na privzeti vrednosti. */
  untouchedFields: SoftFieldRow[];
}

export interface TriageRow {
  moduleId: string;
  title: string;
  score: number;
  scoreLabel: string | null;
  /** Področja z visoko oceno, ki NISO izmerjena, so najboljše vprašanje za sestanek. */
  measured: boolean;
}

export interface AnswerRow {
  question: string;
  answer: string;
  /** Vprašano zaradi konteksta; v formulo ne vstopa, a pove, kako podjetje dela. */
  contextOnly: boolean;
  /** Je stranka vrednost vnesla ali je ostala privzeta. */
  answered: boolean;
}

export interface MeasuredArea {
  moduleId: string;
  title: string;
  summary: string;
  totalEUR: number;
  mainCauseLabel: string | null;
  addressableShare: number | null;
  answers: AnswerRow[];
  outputs: ModuleOutput[];
  pantheon: string[];
  methodology: ModuleMethodology | null;
}

export interface SalesReport {
  meta: SalesReportMeta;
  qualification: SalesReportQualification;
  summary: SalesReportSummary;
  softness: SalesReportSoftness;
  triage: TriageRow[];
  measured: MeasuredArea[];
  risks: ModuleOutput[];
  actionPlan: ActionPlanEntry | null;
  highestModuleTitle: string | null;
}

export interface BuildSalesReportParams {
  generatedAtISO: string;
  companyName: string;
  email: string;
  gdprConsent: boolean;
  utmSource: string | null;
  industry: string;
  employeeCount: number;
  segment: SegmentConfig;
  context: SegmentContext | undefined;
  profile: BusinessProfile;
  /** Vsi moduli segmenta — tudi neizbrani, ker triažne ocene veljajo za vse. */
  segmentModules: ModuleDefinition[];
  /** Moduli, ki so bili dejansko vprašani in izračunani. */
  activeModules: ModuleDefinition[];
  values: Record<string, Record<string, number>>;
  triageScores: TriageScores;
  outputs: ModuleOutput[];
  totals: ResultTotals;
  highestModule: string | null;
  followUpSequence: FollowUpSequence;
}

export function buildSalesReport(params: BuildSalesReportParams): SalesReport {
  const { context, profile, segment, values } = params;
  const activeIds = new Set(params.activeModules.map((definition) => definition.id));
  const outputsByModule = groupByModule(params.outputs);

  return {
    meta: {
      generatedAtISO: params.generatedAtISO,
      companyName: params.companyName,
      email: params.email,
      gdprConsent: params.gdprConsent,
      utmSource: params.utmSource,
    },

    qualification: {
      industryLabel: getIndustryLabel(params.industry) || segment.displayName,
      segmentName: segment.displayName,
      sizeClass: getSizeClass(params.employeeCount),
      employeeCount: params.employeeCount,
      roleLabel: contextOptionLabel(context?.role, profile.role),
      businessTypeLabel: contextOptionLabel(context?.businessType, profile.businessType),
      currentSystemLabel: contextOptionLabel(context?.currentSystem, profile.currentSystem),
      isPantheonCustomer: isPantheonCustomer(context, profile.currentSystem),
      improvementBand: improvementBandFor(context, profile.currentSystem),
      followUpSequence: params.followUpSequence,
    },

    summary: {
      directLossEUR: params.totals.directLossEUR,
      capacityEUR: params.totals.capacityEUR,
      capacityHoursPerMonth: params.totals.capacityHoursPerMonth,
      oneTimeCapitalEUR: params.totals.oneTimeCapitalEUR,
      potentialMinEUR: params.totals.potential?.minEUR,
      potentialMaxEUR: params.totals.potential?.maxEUR,
      confidence: params.totals.confidence,
      confidenceReason: buildConfidenceReason(params),
    },

    softness: {
      hourAssumptions: buildHourAssumptions(context, profile),
      unknownAnswers: collectFields(params.activeModules, values, isUnknownChoice),
      untouchedFields: collectFields(params.activeModules, values, isUntouchedNumeric),
    },

    triage: params.segmentModules
      .filter((definition) => definition.triage !== undefined)
      .map((definition) => ({
        moduleId: definition.id,
        title: definition.title,
        score: params.triageScores[definition.id] ?? 0,
        scoreLabel: triageScoreLabel(definition, params.triageScores[definition.id] ?? 0),
        measured: activeIds.has(definition.id),
      })),

    measured: params.activeModules
      // Modul E ni področje, ampak seznam rokov — njegovi izidi so med tveganji.
      .filter((definition) => definition.id !== 'E')
      .map((definition) => buildMeasuredArea(definition, values, outputsByModule)),

    risks: params.totals.risks,
    actionPlan: getActionPlan(params.highestModule),
    highestModuleTitle:
      params.segmentModules.find((definition) => definition.id === params.highestModule)?.title ??
      null,
  };
}

// --- Podrobnosti -------------------------------------------------------------

function buildMeasuredArea(
  definition: ModuleDefinition,
  values: Record<string, Record<string, number>>,
  outputsByModule: Record<string, ModuleOutput[]>,
): MeasuredArea {
  const moduleValues = values[definition.id] ?? {};
  const outputs = outputsByModule[definition.id] ?? [];

  return {
    moduleId: definition.id,
    title: definition.title,
    summary: definition.summary,
    totalEUR: outputs
      .filter((output) => output.bucket === 'directLoss' || output.bucket === 'capacity')
      .reduce((sum, output) => sum + (output.valueEUR ?? 0), 0),
    mainCauseLabel: mainCauseLabel(definition, moduleValues.mainCause),
    // Vsi izidi enega področja delijo isti delež, zato zadošča prvi, ki ga ima.
    addressableShare: outputs.find((output) => output.addressableShare !== undefined)?.addressableShare ?? null,
    answers: definition.fields.map((field) => ({
      question: field.label,
      answer: fieldAnswerText(field, moduleValues[field.key] ?? field.default),
      contextOnly: field.contextOnly === true,
      answered: isAnswered(field, moduleValues[field.key]),
    })),
    outputs,
    pantheon: definition.pantheon ?? [],
    methodology: MODULE_METHODOLOGY[definition.id] ?? null,
  };
}

function buildHourAssumptions(
  context: SegmentContext | undefined,
  profile: BusinessProfile,
): HourAssumptionRow[] {
  const rows: HourAssumptionRow[] = [];

  if (context) {
    rows.push({
      label: context.operationalHour.label,
      valueEUR: profile.operationalHour.valueEUR,
      estimated: profile.operationalHour.estimated,
      bandLabel: costBandLabel(context.operationalHour, profile.operationalHour),
    });
    rows.push({
      label: context.adminHour.label,
      valueEUR: profile.adminHour.valueEUR,
      estimated: profile.adminHour.estimated,
      bandLabel: costBandLabel(context.adminHour, profile.adminHour),
    });
    // Zaračunano postavko vpraša samo dejavnost, ki prodaja ure. Drugod je v profilu
    // prisotna kot varovalo pred NaN, a je stranka ni videla — navesti jo kot njen
    // odgovor bi bilo neresnično.
    if (context.chargeOutRate) {
      rows.push({
        label: context.chargeOutRate.label,
        valueEUR: profile.chargeOutRate.valueEUR,
        estimated: profile.chargeOutRate.estimated,
        bandLabel: costBandLabel(context.chargeOutRate, profile.chargeOutRate),
      });
    }
  }

  return rows;
}

type FieldPredicate = (
  field: ModuleDefinition['fields'][number],
  value: number | undefined,
) => boolean;

function collectFields(
  modules: ModuleDefinition[],
  values: Record<string, Record<string, number>>,
  predicate: FieldPredicate,
): SoftFieldRow[] {
  const rows: SoftFieldRow[] = [];
  for (const definition of modules) {
    const moduleValues = values[definition.id] ?? {};
    for (const field of definition.fields) {
      if (field.contextOnly) continue;
      if (predicate(field, moduleValues[field.key])) {
        rows.push({ moduleTitle: definition.title, question: field.label });
      }
    }
  }
  return rows;
}

/** Številsko polje, ki je ostalo na privzetku — checkbox in choice imata svoje merilo. */
function isUntouchedNumeric(
  field: ModuleDefinition['fields'][number],
  value: number | undefined,
): boolean {
  if (field.kind === 'choice' || field.kind === 'checkbox') return false;
  return !isAnswered(field, value);
}

/**
 * Ubesedi oznako zanesljivosti.
 *
 * Sama ocena ostane v assessConfidence — tu se iz istih treh signalov sestavi samo
 * razlaga. Podvojen prag bi pomenil dve resnici o istem vprašanju, ki se ob prvi
 * kalibraciji razideta.
 */
function buildConfidenceReason(params: BuildSalesReportParams): string {
  const soft = buildHourAssumptions(params.context, params.profile).filter((row) => row.estimated);
  const unknown = collectFields(params.activeModules, params.values, isUnknownChoice);
  const untouched = collectFields(params.activeModules, params.values, isUntouchedNumeric);

  const parts: string[] = [];
  if (soft.length > 0) {
    parts.push(
      soft.length === 1
        ? 'ena urna postavka je izbran razpon in ne podatek'
        : `${soft.length} urne postavke so izbran razpon in ne podatek`,
    );
  }
  if (unknown.length > 0) {
    parts.push(`${unknown.length}× je izbran odgovor "Ne vem"`);
  }
  if (untouched.length > 0) {
    parts.push(`${untouched.length} številskih polj je ostalo na privzeti vrednosti`);
  }

  if (parts.length === 0) {
    return 'Stranka je vnesla vse ključne podatke — zneske je mogoče vzeti takšne, kot so.';
  }

  return `Zneski so spodnja meja: ${parts.join('; ')}. Dejanski stroški so praviloma višji, ne nižji.`;
}

/**
 * Je bil modul tehničnih opozoril temu obiskovalcu sploh prikazan.
 *
 * Prodajnik mora vedeti, da odsotnost rokov v poročilu ni podatek o podjetju —
 * modul se podjetju brez PANTHEON-a namenoma ne prikaže.
 */
export function wasTechnicalRiskModuleShown(
  segment: SegmentConfig,
  profile: BusinessProfile,
): boolean {
  return (
    segment.moduleIds.includes('E') &&
    isTechnicalRiskModuleVisible(segment.id, profile.currentSystem)
  );
}
