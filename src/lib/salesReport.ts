import type {
  AssumptionSource,
  SegmentContext,
  BusinessProfile,
  ImprovementBand,
} from '../config/contexts';
import { improvementBandFor, isTechnicalRiskModuleVisible } from '../config/contexts';
import { getIndustryLabel } from '../config/industries';
import type { ModuleDefinition, ModuleOutput } from '../config/modules/moduleTypes';
import type { SegmentConfig } from '../config/segments';
import { getSizeClass } from '../config/sizeClasses';
import { getActionPlan, type ActionPlanEntry } from '../../content/actions/actions';
import { MODULE_METHODOLOGY, type ModuleMethodology } from '../../content/methodology';
import {
  answerSource,
  contextOptionLabel,
  costBandLabel,
  fieldAnswerText,
  isAnswered,
  isPantheonCustomer,
  isUnknownChoice,
  mainCauseLabel,
  triageScoreLabel,
} from './answerLabels';
import { scoreIcp, type IcpScore, type IcpSignals } from '../config/icp';
import { MODULE_E_ITEMS } from '../config/modules/moduleE';
import { buildSalesPlaybook, type SalesPlaybook } from './salesPlaybook';
import type { FollowUpSequence } from './followUp';
import { ANNUAL_BUCKETS, groupByModule, isModuleAnswered, type TriageScores } from './moduleEngine';
import { assessHoursPlausibility, hoursPlausibilityWarning } from './plausibility';
import { isRevenueMissing, type ConfidenceLevel, type ResultTotals } from './potential';
import type { TotalsRange } from './range';
import { taxNumberState } from './validation';
import type { LeadConsents, LeadContact } from '../types';

/**
 * Priprava na pogovor: kar je stranka vnesla, zbrano na enem mestu.
 *
 * Doslej se je ob oddaji obrazca zgodil samo strankin PDF, vse ostalo pa se je
 * zavrglo — odgovori, triažne ocene za neizmerjena področja, podatek o tem, katere
 * številke so bile ugibane. Prodajnik je torej prišel na sestanek z istim listom
 * kot stranka in brez enega samega podatka več.
 *
 * TO JE INTERNI DOKUMENT, strogo ločen od poročila, ki ga dobi stranka. Vsebuje
 * iztočnice za pogovor, priporočeno ponudbo, pričakovane ugovore in ICP oceno
 * ustreznosti. Strankino poročilo (lib/pdf.ts) ne vsebuje ničesar od tega.
 *
 * Kljub temu velja eno pravilo pri ubeseditvi: datoteka se fizično prenese na
 * napravo, kjer sedi stranka. Ocena je zato zapisana kot USTREZNOST in ne kot sodba
 * o podjetju — "velikost: pod ciljnim razredom" in ne "premajhen". Isti podatek,
 * brez stavka, ki bi ga bilo nerodno pojasniti, če bi ga stranka odprla.
 *
 * Gradnik je čista funkcija brez dostopa do DOM ali datuma: časovni žig pride kot
 * parameter. Predstavitev (PDF, HTML) je zato zamenljiva, test pa determinističen.
 */

/**
 * Kontakt in privolitve sta razširjena ploskó, ne ugnezdena: oba izrisovalca
 * bereta posamezne skalarje v vrstice tabele in nihče kontakta ne potrebuje kot
 * celoto. Razširjanje vmesnikov pomeni, da dodano polje v LeadContact tu ni
 * mogoče pozabiti.
 */
export interface SalesReportMeta extends LeadContact, LeadConsents {
  generatedAtISO: string;
  utmSource: string | null;
  /**
   * Davčna je neobvezna in napačna ne blokira oddaje — dvom zato pripotuje sem,
   * kjer ga vidi svetovalec, ki lahko ukrepa. Izračunano enkrat, da ostaneta
   * izrisovalca brez logike.
   */
  taxNumberLooksValid: boolean;
}

export interface SalesReportQualification {
  industryLabel: string;
  segmentName: string;
  sizeClass: string;
  employeeCount: number;
  /**
   * Oznaka, ne id — "Vodja skladišča ali logistike" in ne "vodjaSkladisca".
   * Ostane čista naštevna oznaka: playbook nad njo išče "direktor|lastnik" in
   * zlit prosti vnos bi ugovor "o tem ne odločam jaz" izklopil vsakemu, ki bi si
   * v polje napisal "direktor IT".
   */
  roleLabel: string | null;
  /** Vloga, ki si jo je obiskovalec vpisal sam ob možnosti "Drugo". */
  roleOther: string | null;
  businessTypeLabel: string | null;
  currentSystemLabel: string | null;
  /** Od tega je odvisno, ali so tehnična opozorila (ZIERDED, SQL Server) sploh smiselna. */
  isPantheonCustomer: boolean;
  improvementBand: ImprovementBand;
  followUpSequence: FollowUpSequence;
}

export interface SalesReportSummary {
  directLossEUR: number;
  /** Marža, ki ni bila zaslužena — letna kot directLoss, a druge vrste dokaz. */
  lostMarginEUR: number;
  capacityEUR: number;
  /**
   * Razpon zneskov, kadar finančna osnova stoji na izbranih pasovih (lib/range.ts).
   * Prodajnik mora videti isti razpon kot stranka — točka, ki je stranka ni videla,
   * bi bila na sestanku takoj izpodbita.
   */
  rangeEUR: TotalsRange | null;
  capacityHoursPerMonth: number;
  oneTimeCapitalEUR: number;
  /** Točka; razpon prinesejo izbrani pasovi predpostavk prek `rangeEUR.potential`. */
  addressablePotentialEUR?: number;
  confidence?: ConfidenceLevel;
  /** Zakaj ta oznaka — brez tega je "nizka zanesljivost" očitek brez naslova. */
  confidenceReason: string;
}

export interface HourAssumptionRow {
  label: string;
  valueEUR: number;
  estimated: boolean;
  /**
   * Od kod je številka. Štirje primeri, ki jih mora prodajnik ločiti, ker vsak pove
   * nekaj drugega o tem, koliko je izračun vreden:
   *
   * `entered` je strankin podatek; `band` pomeni, da je razpon vsaj izbrala — to je
   * njena presoja o lastnem podjetju; `industryAverage` pomeni, da je prevzela NAŠO
   * oceno za dejavnost, torej o svojem podjetju ni povedala nič; `none` pa, da ni
   * odgovorila nič in je v veljavi privzetek. Zadnja dva sta po vsebini enako šibka,
   * a ne enako povedna: kdor je povprečje kliknil, je vprašanje vsaj videl.
   */
  source: AssumptionSource;
  /** Razpon, v katerem se izračun giblje — pri `entered` in `none` null. */
  bandLabel: string | null;
}

/** Besedilo, ki ga za urno postavko vidi bralec poročila. */
export function hourAssumptionSource(row: HourAssumptionRow): string {
  if (row.source === 'entered') return 'vneseno';
  if (row.source === 'industryAverage') {
    return `povprečje panoge (${row.valueEUR} EUR/h)`;
  }
  return row.bandLabel ? `izbran razpon ${row.bandLabel}` : 'ni odgovora — privzetek dejavnosti';
}

/**
 * Izpisi kontakta so tu in ne v izrisovalcih, da PDF in HTML ne moreta razhajati —
 * enaka vrstica v dveh datotekah se ob prvi spremembi razide.
 */
export function contactPerson(report: SalesReport): string {
  return `${report.meta.firstName} ${report.meta.lastName}`.trim();
}

/** Davčna z opozorilom, kadar ne prestane kontrolne vsote — napačna izgleda enako verodostojno kot prava. */
export function taxNumberCell(report: SalesReport): string {
  if (!report.meta.taxNumber) return '—';
  return report.meta.taxNumberLooksValid
    ? report.meta.taxNumber
    : `${report.meta.taxNumber} (ni videti veljavna)`;
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
  /**
   * Opozorilo, kadar vnesene ure presegajo verjetni delež kapacitete podjetja
   * (lib/plausibility). Isti sum, kot ga je videla stranka pri vnosu — prodajnik
   * mora vedeti, da je znesek morda precenjen, sicer ga na sestanku brani naslepo.
   */
  plausibilityWarning: string | null;
}

export interface TriageRow {
  moduleId: string;
  title: string;
  /**
   * `null` pomeni, da obiskovalec področja ni ocenil.
   *
   * Ni 0: vsaka triažna lestvica ima možnost z vrednostjo 0 ("Plan je stabilen",
   * "Redko"), zato bi 0 svetovalcu sporočila, da je podjetje področje ocenilo kot
   * brezbolečinsko. Razlika med "tu nas ne boli" in "tega nismo ocenili" je za
   * pripravo sestanka bistvena — prvo je odgovor, drugo je vprašanje.
   */
  score: number | null;
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
  /**
   * Od kod vrednost prihaja: "vneseno", "privzeto", '„Ne vem"'.
   *
   * Doslej je bilo to svoj razdelek („Kje so številke trdne in kje ne") s tremi
   * tabelami, ki so ista polja naštele drugič — prodajnik je moral trdnost številke
   * iskati dvajset vrstic niže od nje same. Izpeljano tu in ne v izrisovalcih, da
   * PDF in HTML ne moreta razhajati.
   */
  source: string;
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
  /** Kaj vprašati, kaj ponuditi, kaj bo slišal v odgovor in kako velik je posel. */
  playbook: SalesPlaybook;
  /** Ustreznost idealnemu profilu. Merila so v config/icp.ts in se uravnavajo tam. */
  icp: IcpScore;
}

export interface BuildSalesReportParams {
  generatedAtISO: string;
  /** Enota, ki potuje EmailGate → CalculatorFlow → sem; razbije se šele v meta. */
  contact: LeadContact;
  consents: LeadConsents;
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
  /** Razpon, kadar finančna osnova stoji na izbranih pasovih (lib/range.ts). */
  totalsRange?: TotalsRange | null;
  highestModule: string | null;
  followUpSequence: FollowUpSequence;
}

export function buildSalesReport(params: BuildSalesReportParams): SalesReport {
  const { context, profile, segment, values } = params;
  const activeIds = new Set(params.activeModules.map((definition) => definition.id));
  const outputsByModule = groupByModule(params.outputs);

  // Ocena in playbook se sestavita iz že izračunanega poročila, zato nastane najprej
  // ono. Vrstni red je pomemben: playbook bere iztočnice iz triaže in mehkih številk.
  const base: Omit<SalesReport, 'playbook' | 'icp'> = {
    meta: {
      generatedAtISO: params.generatedAtISO,
      ...params.contact,
      ...params.consents,
      utmSource: params.utmSource,
      taxNumberLooksValid: taxNumberState(params.contact.taxNumber) !== 'invalid',
    },

    qualification: {
      industryLabel: getIndustryLabel(params.industry) || segment.displayName,
      segmentName: segment.displayName,
      sizeClass: getSizeClass(params.employeeCount),
      employeeCount: params.employeeCount,
      roleLabel: contextOptionLabel(context?.role, profile.role),
      roleOther: profile.roleOther.trim() || null,
      businessTypeLabel: contextOptionLabel(context?.businessType, profile.businessType),
      currentSystemLabel: contextOptionLabel(context?.currentSystem, profile.currentSystem),
      isPantheonCustomer: isPantheonCustomer(context, profile.currentSystem),
      improvementBand: improvementBandFor(context, profile.currentSystem),
      followUpSequence: params.followUpSequence,
    },

    summary: {
      directLossEUR: params.totals.directLossEUR,
      lostMarginEUR: params.totals.lostMarginEUR,
      capacityEUR: params.totals.capacityEUR,
      rangeEUR: params.totalsRange ?? null,
      capacityHoursPerMonth: params.totals.capacityHoursPerMonth,
      oneTimeCapitalEUR: params.totals.oneTimeCapitalEUR,
      addressablePotentialEUR: params.totals.addressablePotentialEUR,
      confidence: params.totals.confidence,
      confidenceReason: buildConfidenceReason(params),
    },

    softness: {
      hourAssumptions: buildHourAssumptions(context, profile),
      unknownAnswers: collectFields(params.activeModules, values, isUnknownChoice),
      untouchedFields: collectFields(params.activeModules, values, isUntouchedNumeric),
      plausibilityWarning: hoursPlausibilityWarning(
        assessHoursPlausibility(params.activeModules, values, params.employeeCount),
      ),
    },

    triage: params.segmentModules
      .filter((definition) => definition.triage !== undefined)
      .map((definition) => ({
        moduleId: definition.id,
        title: definition.title,
        score: params.triageScores[definition.id] ?? null,
        scoreLabel:
          definition.id in params.triageScores
            ? triageScoreLabel(definition, params.triageScores[definition.id])
            : null,
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

  const icp = scoreIcp(buildIcpSignals(params, base));
  return {
    ...base,
    icp,
    playbook: buildSalesPlaybook(base, segment.id, profile.currentSystem, icp),
  };
}

/**
 * Signali za oceno ustreznosti — vsi iz podatkov, ki jih poročilo že ima.
 *
 * Zbrani na enem mestu, da model (config/icp.ts) ne pozna ne poročila ne modulov:
 * uravnavanje meril je zato urejanje ene tabele in ne iskanje po kodi.
 */
function buildIcpSignals(
  params: BuildSalesReportParams,
  base: Omit<SalesReport, 'playbook' | 'icp'>,
): IcpSignals {
  const triageable = params.segmentModules.filter((definition) => definition.triage !== undefined);

  return {
    employeeCount: params.employeeCount,
    improvementBandMax: base.qualification.improvementBand.max,
    isPantheonCustomer: base.qualification.isPantheonCustomer,
    roleId: params.profile.role,
    measuredLossEUR:
      base.summary.directLossEUR + base.summary.lostMarginEUR + base.summary.capacityEUR,
    highLossThresholdEUR: params.segment.highLossThresholdEUR,
    // Roki iz modula E: odkljukana polja preslikamo v datume, ki jih nosi vsebina.
    // `warningDate` doslej ni bil uporabljen nikjer — prikazovalo se je le besedilo.
    deadlineDates: MODULE_E_ITEMS.filter(
      (item) => (params.values.E?.[item.key] ?? 0) === 1,
    ).map((item) => item.warningDate),
    confidence: base.summary.confidence,
    measuredAreaCount: triageable.filter(
      (definition) =>
        params.activeModules.some((active) => active.id === definition.id) &&
        isModuleAnswered(definition, params.values[definition.id]),
    ).length,
    offeredAreaCount: triageable.length,
    hasPhone: params.contact.phone.trim().length > 0,
    hasTaxNumber: params.contact.taxNumber.trim().length > 0,
    consentOffers: params.consents.consentOffers,
    generatedAtISO: params.generatedAtISO,
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
    // Vsi letni koši — tudi lostMargin, sicer je izpisan "Skupaj" manjši od vsote
    // postavk, naštetih tik pod njim (maloprodajno največjo postavko je izpuščal).
    totalEUR: outputs
      .filter((output) => (ANNUAL_BUCKETS as readonly string[]).includes(output.bucket))
      .reduce((sum, output) => sum + (output.valueEUR ?? 0), 0),
    mainCauseLabel: mainCauseLabel(definition, moduleValues.mainCause),
    // Vsi izidi enega področja delijo isti delež, zato zadošča prvi, ki ga ima.
    addressableShare: outputs.find((output) => output.addressableShare !== undefined)?.addressableShare ?? null,
    answers: definition.fields.map((field) => ({
      question: field.label,
      answer: fieldAnswerText(field, moduleValues[field.key] ?? field.default),
      contextOnly: field.contextOnly === true,
      answered: isAnswered(field, moduleValues[field.key]),
      source: answerSource(field, moduleValues[field.key]),
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
      source: profile.operationalHour.source,
      bandLabel: costBandLabel(context.operationalHour, profile.operationalHour),
    });
    rows.push({
      label: context.adminHour.label,
      valueEUR: profile.adminHour.valueEUR,
      estimated: profile.adminHour.estimated,
      source: profile.adminHour.source,
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
        source: profile.chargeOutRate.source,
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
  if (isRevenueMissing(params.profile, params.activeModules, params.values)) {
    parts.push('prihodek ni podan, zato so postavke, vezane na prihodek, enake 0');
  }
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
