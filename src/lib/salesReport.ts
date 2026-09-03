import type {
  AssumptionSource,
  CostAssumption,
  CostQuestion,
  ScaleAssumption,
  ScaleQuestion,
  SegmentContext,
  BusinessProfile,
  SystemGap,
} from '../config/contexts';
import { systemGapFor, isTechnicalRiskModuleVisible } from '../config/contexts';
import { getSegmentCopy } from '../config/copy';
import { getIndustryLabel } from '../config/industries';
import { isUnansweredChoice } from '../config/modules/moduleTypes';
import type { ModuleDefinition, ModuleOutput } from '../config/modules/moduleTypes';
import type { SegmentConfig } from '../config/segments';
import type { SegmentId } from '../config/segmentTypes';
import { getSizeClass } from '../config/sizeClasses';
import { getActionPlan, type ActionPlanEntry } from '../../content/actions/actions';
import { MODULE_METHODOLOGY, type ModuleMethodology } from '../../content/methodology';
import {
  answerSource,
  contextOptionLabel,
  costBandLabel,
  scaleBandLabel,
  fieldAnswerText,
  isAnswered,
  isPantheonCustomer,
  isUnknownChoice,
  mainCauseLabel,
  roleDisplay,
  triageScoreLabel,
} from './answerLabels';
import { SHARED_COPY } from '../config/copy';
import { formatAmount, formatEUR, formatHours, formatPercent } from './format';
import { heroRangeEUR, heroValueEUR } from './heroTotals';
import {
  monthsLabel,
  multiYearEUR,
  paybackRows,
  perMonthEUR,
  perWorkingDayEUR,
  slovenianForm,
} from './horizon';
import { displayRange } from './range';
import { daysUntil, scoreIcp, type IcpScore, type IcpSignals } from '../config/icp';
import { MODULE_E_ITEMS } from '../config/modules/moduleE';
import { buildSalesPlaybook, type SalesPlaybook } from './salesPlaybook';
import { followUpSequenceLabel, type FollowUpSequence } from './followUp';
import { ANNUAL_BUCKETS, groupByModule, isModuleAnswered, type TriageScores } from './moduleEngine';
import { assessHoursPlausibility, hoursPlausibilityWarning } from './plausibility';
import type { ConfidenceLevel, ResultTotals } from './potential';
import { collectConfidenceSignals } from './confidenceReason';
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
  /**
   * Id in ne oznaka — edino polje te vrste tukaj. Oba prodajna izrisovalca po njem
   * izbereta logotip PANTHEON iste znamke, kot jo je stranka videla v glavi
   * vprašalnika (config/pantheonLogos.ts). Oznaka `segmentName` je za bralca in se
   * sme spremeniti; ključ registra ne sme biti odvisen od nje.
   */
  segmentId: SegmentId;
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
  systemGap: SystemGap;
  followUpSequence: FollowUpSequence;
  /** Odkljukani tehnični roki z datumi; prazno, kadar ni odkljukan noben. */
  deadlines: DeadlineRow[];
  /**
   * Ali je stranka modul s tehničnimi roki sploh videla.
   *
   * Brez tega sta neločljiva dva različna primera: modula ni videla (ni uporabnik
   * PANTHEON) in videla ga je, a ni odkljukala nič. Drugo je odgovor — po njeni izjavi
   * roki zanjo ne veljajo — in prodajnika obvaruje pred vprašanjem, na katero je
   * stranka že odgovorila.
   */
  technicalRiskModuleShown: boolean;
}

export interface DeadlineRow {
  key: string;
  label: string;
  dateISO: string;
  /** Negativno pomeni, da je rok že mimo. */
  daysUntil: number;
  expired: boolean;
  /** Datum in preostanek brez oznake: "POTEKEL 14. 7. 2026 (pred 43 dnevi)". */
  statusText: string;
  /**
   * Isto z oznako, za vrstico v razdelku 1, kjer roka nič drugega ne imenuje.
   *
   * Oboje je ubesedeno tu, ker izrisovalec ne sme računati ne datuma ne dni — čas
   * pride v gradnik kot parameter in mora ostati tam.
   */
  text: string;
}

export interface PaybackTableRow {
  investmentText: string;
  durationText: string;
}

/**
 * Povračilo investicije — svetovalčevo gradivo in NE ogledalo.
 *
 * Tabela je bila do zdaj del strankinega poročila in jo je prodajna priprava
 * zrcalila. Iz poročila je odstranjena: primerjava izmerjenega potenciala z
 * investicijo je pogovor s svetovalcem, ne izdelek izračuna, ki stranki pride
 * po e-pošti brez sogovornika. Podlaga ostane ista (horizon.paybackRows), le
 * bralec je odslej en sam — zato tudi ne stoji več v razdelku "Kaj stranka
 * gleda", ki mora ostati zvest temu, kar je stranka res videla.
 */
export interface SalesReportPayback {
  /** `null`, kadar dobe ni mogoče izračunati (potencial manjka ali je pod pragom). */
  rows: PaybackTableRow[] | null;
  /** Ubesedena podlaga ali razlog, zakaj tabele ni. */
  note: string;
}

/**
 * Kaj ima stranka pred sabo v SVOJEM poročilu.
 *
 * Prodajna priprava je doslej poznala iste letne zneske, ne pa izpeljank, ki jih
 * strankino poročilo naredi iz njih — trojni znesek, ceno delovnega dne in ceno meseca
 * odlašanja. Stranka pride na sestanek s temi številkami; svetovalec jih mora poznati
 * vnaprej, sicer je presenečen nad podatkom iz lastne hiše.
 *
 * Vsa polja so že ubesedena in gredo skozi ISTE formatirnike in ISTA vrata kot
 * lib/pdf.ts — ogledalo, ki bi pokazalo številko, ki je stranka ni videla, bi bilo
 * slabše od nobenega.
 */
export interface SalesReportClientView {
  /** Naslovna letna številka v strankini obliki: razpon ali "najmanj X" ali "ni izmerjeno". */
  heroText: string;
  /** Izpeljanke v eni vrstici; `null`, kadar jih stranka ni videla (hero = 0). */
  derivativesText: string | null;
  coverageText: string | null;
  accountingCapacityText: string | null;
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

export interface AssumptionRow {
  label: string;
  /**
   * Vrednost z enoto, že izpisana: "20 EUR/h", "2.000.000 EUR", "23,5 %".
   *
   * Izpeljano tu in ne v izrisovalcih, ker enota ni ista za vse predpostavke — urna
   * postavka je EUR/h, prihodek EUR, marža in strošek kapitala pa odstotek. Dokler je
   * tabela naštevala samo ure, je enoto lahko pripel izrisovalec; odkar so v njej tudi
   * prihodek in deleži, bi ista koda prihodek izpisala kot "2000000 EUR/h".
   */
  valueText: string;
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
  /**
   * Kaj neodgovor pomeni za izračun, kadar pomeni kaj posebnega.
   *
   * Samo prihodek pade na 0 in s tem izniči cele postavke (lib/potential.ts,
   * `isRevenueMissing`); marža in strošek kapitala imata privzetek dejavnosti, zato
   * se izračun z njima izvede — le s številko, ki je stranka ni videla.
   */
  consequence: string | null;
}

/** Besedilo, ki ga za predpostavko vidi bralec poročila. */
export function assumptionSource(row: AssumptionRow): string {
  if (row.source === 'entered') return 'vneseno';
  if (row.source === 'industryAverage') {
    return `povprečje panoge (${row.valueText})`;
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

/**
 * Vrstice razdelkov 1 in 2, sestavljene enkrat za oba izrisovalca.
 *
 * Doslej je isto tabelo ročno nosila vsaka od obeh datotek, varovana samo s komentarjem
 * "zrcali vrstice v salesReportHtml.ts". Svetovalec bere obe datoteki in razlika med
 * njima izgleda kot razlika v podatkih — zato vrstice odslej nastanejo tu, izrisovalca
 * pa ju samo izpišeta. Isti razlog kot pri `AnswerRow.source`.
 */
export type ReportRow = [string, string];

export function scoreRows(report: SalesReport): ReportRow[] {
  const deal = report.playbook.dealSizing;
  const rows: ReportRow[] = [
    ['Velikost posla', `${deal.sizeLabel} (${report.qualification.sizeClass} zaposlenih)`],
    // Ista oblika, kot jo bere stranka: razpon, kadar obstaja, in "najmanj" pri nizki
    // zanesljivosti. Gola točka je bila številka, ki je stranka ni videla.
    ['Izmerjena letna bolečina', report.clientView.heroText],
  ];
  if (report.clientView.derivativesText) {
    rows.push(['Kar stranka bere iz tega', report.clientView.derivativesText]);
  }
  rows.push(['Nujnost', `${deal.urgency} — ${deal.urgencyReason}`]);
  const deadline = nearestDeadline(report);
  if (deadline) rows.push(['Tehnični rok', deadline.text]);
  rows.push(['Predvideno nadaljevanje', followUpSequenceLabel(report.qualification.followUpSequence)]);
  rows.push(['Priporočena licenca', report.playbook.recommendedPantheon.licence.name]);
  return rows;
}

/**
 * Kje boli in s čim začeti — dvignjeno na vrh, ne dodano.
 *
 * Obe vrstici sta doslej obstajali niže v dokumentu (opomba o neizmerjenih bolečih
 * področjih v 3b, prvo vprašanje v "Kaj vprašati"), zato si je moral svetovalec odgovor
 * na "kje je največ denarja" sestaviti sam iz blokov področij.
 */
export function headlinePainRows(report: SalesReport): ReportRow[] {
  const rows: ReportRow[] = [];

  const richest = [...report.measured].sort((a, b) => b.totalEUR - a.totalEUR)[0];
  if (richest && richest.totalEUR > 0) {
    rows.push(['Največ denarja', `${richest.title} — ${formatEUR(richest.totalEUR)} letno`]);
  }

  const painful = report.triage.filter(
    (row) => !row.answered && row.score !== null && row.score >= 2,
  );
  if (painful.length > 0) {
    rows.push([
      'Najbolj boleče brez številke',
      `${painful[0].title} — ocena ${painful[0].score}/3; za to področje v poročilu ni nobenega zneska`,
    ]);
  }

  const question = report.playbook.openingQuestions[0];
  if (question) rows.push(['Prvo vprašanje', question.question]);

  return rows;
}

/**
 * Oznaka postavke v tabeli "Letni znesek".
 *
 * Enkratni kapital stoji v isti tabeli pod isto glavo, a se z letnimi zneski ne sešteva —
 * kdor stolpec sešteje, dobi drug rezultat od vrstice "Skupaj" nad njim. Pripis pove,
 * katera postavka je izjema.
 */
export function outputLabel(output: ModuleOutput): string {
  const hours = output.hoursPerMonth ? ` (${formatHours(output.hoursPerMonth)}/mesec)` : '';
  const once = output.bucket === 'oneTimeCapital' ? ' — enkratno, se ne sešteva' : '';
  return `${output.label}${hours}${once}`;
}

export function qualificationRows(report: SalesReport): ReportRow[] {
  const q = report.qualification;
  const band = `${formatPercent(q.systemGap.min)} – ${formatPercent(q.systemGap.max)}`;

  return [
    // Kontakt gre na vrh: svetovalec najprej potrebuje, koga pokliče.
    ['Kontaktna oseba', contactPerson(report) || '—'],
    ['E-naslov', report.meta.email || '—'],
    ['Telefon', report.meta.phone || '—'],
    ['Davčna številka', taxNumberCell(report)],
    ['Dejavnost', q.industryLabel],
    ['Vprašalnik', q.segmentName],
    ['Velikost', `${q.sizeClass} zaposlenih (vneseno: ${q.employeeCount})`],
    ['Vlogo navaja kot', roleDisplay(q.roleLabel, q.roleOther)],
    ['Pretežno dela', q.businessTypeLabel ?? '—'],
    ['Sedanji sistem', q.currentSystemLabel ?? '—'],
    ['Obstoječi uporabnik PANTHEON', q.isPantheonCustomer ? 'Da' : 'Ne'],
    ['Možnost izboljšave sedanjega sistema', `${band} — v izračun zneskov ne vstopa`],
    ['Vir obiska', report.meta.utmSource ?? 'neposredno'],
    // Štiri ločene vrstice in ne ena združena: revizijsko vprašanje je "ali je
    // privolil v trženje?", na kar skupna celica ne odgovori. Zadnja ni privolitev,
    // ampak prošnja — stranka je sama zaprosila za klic.
    ['Privolitev — obdelava osebnih podatkov', report.meta.consentProcessing ? 'Da' : 'Ne'],
    ['Privolitev — ponudbe PANTHEON', report.meta.consentOffers ? 'Da' : 'Ne'],
    ['Privolitev — vsebine in dogodki', report.meta.consentContent ? 'Da' : 'Ne'],
    ['Prošnja za posvet — „kontaktirajte me“', report.meta.consentConsulting ? 'Da' : 'Ne'],
  ];
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
  /**
   * Finančna osnova, kot jo je navedla stranka: urne postavke, prihodek, marža in
   * strošek kapitala. Doslej so bile tu samo ure — prihodek in marža sta bila
   * najdragocenejša podatka vprašalnika in nista bila prikazana nikjer, čeprav marža
   * množi cel koš nezaslužene marže, prihodek pa vse odstotkovne postavke.
   */
  assumptions: AssumptionRow[];
  /** Polja, kjer je stranka izbrala "Ne vem" oziroma "Ne vemo". */
  unknownAnswers: SoftFieldRow[];
  /**
   * Izbirna vprašanja, ki so ostala BREZ odgovora — ločeno od "Ne vem".
   *
   * Razlika ni odtenek. "Ne vem" je odgovor: nekdo je vprašanje prebral in
   * priznal, da podatka nima. Neodgovor je molk in za sestanek pomeni drugo
   * vprašanje ("kdo pri vas to ve?" namesto "kako bi to izmerili?"). Odkar
   * glavni vzrok nima privzetka, je molk pogost in ga ni več mogoče prikazati
   * kot priznanje — prodajni priročnik bi sicer trdil, da je stranka nekaj
   * rekla, česar ni.
   */
  unansweredChoices: SoftFieldRow[];
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
  /** Obiskovalec je področje v triaži izbral za podroben izračun. */
  selected: boolean;
  /**
   * Je v njem tudi kaj odgovoril.
   *
   * Ločeno od `selected`, ker sta to za sestanek dva različna primera. Doslej je
   * stolpec "Izmerjeno" izpisal "da" za vsako izbrano področje — tudi za tisto, ki ga je
   * obiskovalec odprl in pustil prazno. Strankino poročilo isto področje šteje med
   * neizmerjena (moduleEngine.isModuleAnswered), zato sta dokumenta o istem področju
   * trdila nasprotno. Izbrano in prazno je poleg tega samostojen signal: podjetje je
   * področje prepoznalo kot svoje, številk pa ni imelo pri roki.
   */
  answered: boolean;
  /**
   * Letni znesek področja; `null` pri neizmerjenih.
   *
   * Ni 0 — iz istega razloga kot pri `score`: nič bi pomenilo izmerjeno brez učinka,
   * neizmerjeno pa je odsotnost podatka.
   */
  annualEUR: number | null;
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
  /** Postavke, kjer je v izračunu obveljala nižja kapica od deleža področja. */
  cappedOutputs: { label: string; cap: number }[];
  answers: AnswerRow[];
  outputs: ModuleOutput[];
  pantheon: string[];
  methodology: ModuleMethodology | null;
}

export interface SalesReport {
  meta: SalesReportMeta;
  qualification: SalesReportQualification;
  summary: SalesReportSummary;
  /** Iste številke, kot jih bere stranka v svojem poročilu. */
  clientView: SalesReportClientView;
  /** Povračilo investicije — samo za svetovalca; glej SalesReportPayback. */
  payback: SalesReportPayback;
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
  /** "+N strank brez nove zaposlitve" — pri računovodskih servisih strankina naslovna številka. */
  accountingCapacity?: number;
  /** Pokritost, kot jo vidi stranka: hero meri samo izbrana področja. */
  coverage?: { measuredCount: number; offeredCount: number };
}

export function buildSalesReport(params: BuildSalesReportParams): SalesReport {
  const { context, profile, segment, values } = params;
  // Ime dejavnosti je odslej v registru besedil; prodajna priprava in strankino
  // poročilo morata imenovati isto dejavnost z istimi besedami.
  const segmentCopy = getSegmentCopy(segment.id);
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
      industryLabel: getIndustryLabel(params.industry) || segmentCopy.displayName,
      segmentName: segmentCopy.displayName,
      segmentId: segment.id,
      sizeClass: getSizeClass(params.employeeCount),
      employeeCount: params.employeeCount,
      roleLabel: contextOptionLabel(context?.role, profile.role),
      roleOther: profile.roleOther.trim() || null,
      businessTypeLabel: contextOptionLabel(context?.businessType, profile.businessType),
      currentSystemLabel: contextOptionLabel(context?.currentSystem, profile.currentSystem),
      isPantheonCustomer: isPantheonCustomer(context, profile.currentSystem),
      systemGap: systemGapFor(context, profile.currentSystem),
      followUpSequence: params.followUpSequence,
      deadlines: buildDeadlines(params),
      technicalRiskModuleShown: wasTechnicalRiskModuleShown(segment, profile),
    },

    clientView: buildClientView(params),
    payback: buildPayback(params),

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
      assumptions: buildAssumptions(context, profile),
      unknownAnswers: collectFields(params.activeModules, values, isUnknownChoice),
      unansweredChoices: collectFields(params.activeModules, values, isUnansweredChoice),
      untouchedFields: collectFields(params.activeModules, values, isUntouchedNumeric),
      plausibilityWarning: hoursPlausibilityWarning(
        assessHoursPlausibility(params.activeModules, values, params.employeeCount),
      ),
    },

    triage: sortTriage(
      params.segmentModules
        .filter((definition) => definition.triage !== undefined)
        .map((definition) => {
          const answered =
            activeIds.has(definition.id) && isModuleAnswered(definition, values[definition.id]);
          return {
            moduleId: definition.id,
            title: definition.title,
            score: params.triageScores[definition.id] ?? null,
            scoreLabel:
              definition.id in params.triageScores
                ? triageScoreLabel(definition, params.triageScores[definition.id])
                : null,
            selected: activeIds.has(definition.id),
            answered,
            annualEUR: answered ? annualTotalEUR(outputsByModule[definition.id] ?? []) : null,
          };
        }),
    ),

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
    systemGapMax: base.qualification.systemGap.max,
    isPantheonCustomer: base.qualification.isPantheonCustomer,
    roleId: params.profile.role,
    measuredLossEUR: heroValueEUR(base.summary),
    highLossThresholdEUR: params.segment.highLossThresholdEUR,
    // Isti seznam, kot ga izpiše razdelek 1 — ne drugi filter čez iste kljukice.
    // Dvoje štetje rokov bi pomenilo, da dokument o istem roku trdi dvoje.
    deadlineDates: base.qualification.deadlines.map((row) => row.dateISO),
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
    totalEUR: annualTotalEUR(outputs),
    mainCauseLabel: mainCauseLabel(definition, moduleValues.mainCause),
    // Vsi izidi enega področja delijo isti delež, zato zadošča prvi, ki ga ima.
    addressableShare: outputs.find((output) => output.addressableShare !== undefined)?.addressableShare ?? null,
    // Postavke z lastno kapico (izmet materiala, prazni kilometri) so v izračunu
    // omejene niže od deleža, ki ga področje razglasi. Brez tega pripisa svetovalec
    // znesek pomnoži s prikazanim deležem in dobi drugo številko od kartice potenciala.
    cappedOutputs: outputs
      .filter(
        (output) =>
          // Le postavke, ki so v tabeli tudi vidne (isti prag kot pri izrisu) — pripis
          // k postavki, ki je v poročilu ni, bi svetovalca pošiljal iskat ničlo.
          (output.valueEUR ?? 0) > 0 &&
          output.addressableCap !== undefined &&
          output.addressableShare !== undefined &&
          output.addressableCap < output.addressableShare,
      )
      .map((output) => ({ label: output.label, cap: output.addressableCap as number })),
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

/**
 * Letna vsota področja.
 *
 * Vsi letni koši — tudi lostMargin, sicer je izpisan "Skupaj" manjši od vsote postavk,
 * naštetih tik pod njim (maloprodajno največjo postavko je izpuščal). Ista vsota stoji
 * v bloku področja in v triažni tabeli, zato je tu in ne dvakrat.
 */
function annualTotalEUR(outputs: ModuleOutput[]): number {
  return outputs
    .filter((output) => (ANNUAL_BUCKETS as readonly string[]).includes(output.bucket))
    .reduce((sum, output) => sum + (output.valueEUR ?? 0), 0);
}

/**
 * Vrstni red triaže: najprej tam, kjer najbolj boli.
 *
 * Doslej je bila tabela v vrstnem redu registra, kar pomeni, da je področje z oceno 3/3
 * lahko stalo pod tremi z oceno 0. Znotraj iste ocene gredo neizpolnjena pred
 * izpolnjena — boleče področje brez številke je najboljše vprašanje za sestanek —, nato
 * večji znesek pred manjšim. Neocenjena padejo na dno: to ni ocena 0, ampak odsotnost
 * odgovora. Razvrsti se enkrat, tu, da izrisovalca ne moreta pokazati različnega
 * vrstnega reda.
 */
function sortTriage(rows: TriageRow[]): TriageRow[] {
  return rows.map((row, index) => ({ row, index })).sort((a, b) => {
      const scoreA = a.row.score ?? -1;
      const scoreB = b.row.score ?? -1;
      if (scoreA !== scoreB) return scoreB - scoreA;
      if (a.row.answered !== b.row.answered) return a.row.answered ? 1 : -1;
      const eurA = a.row.annualEUR ?? 0;
      const eurB = b.row.annualEUR ?? 0;
      if (eurA !== eurB) return eurB - eurA;
      return a.index - b.index;
    })
    .map((entry) => entry.row);
}

/**
 * Datum po slovensko iz ISO zapisa, brez `Date`.
 *
 * `new Date('2026-07-14')` je polnoč po UTC in `Intl` jo v našem pasu izpiše kot
 * 14. julij samo do konca oktobra — pozimi bi bil 13. Datum roka je koledarski podatek
 * brez ure, zato ga sestavimo iz delov niza. Isti razlog kot pri `isoDate` v format.ts.
 */
function slovenianDate(dateISO: string): string {
  const [year, month, day] = dateISO.split('-');
  return `${Number(day)}. ${Number(month)}. ${year}`;
}

/**
 * "pred 1 dnem" / "pred 2 dnevoma" / "čez 2 dneva" / "čez 139 dni".
 *
 * Pretekli rok stoji v orodniku ("pred dvema dnevoma"), prihodnji v tožilniku ("čez dva
 * dneva") — dve različni preglednici oblik. Izbiro oblike opravi skupna slovenianForm,
 * ki edina pozna pravilo o ostanku nad sto.
 */
function dayCountLabel(days: number): string {
  const absolute = Math.abs(days);
  return days < 0
    ? `pred ${absolute} ${slovenianForm(absolute, ['dnem', 'dnevoma', 'dnevi', 'dnevi'])}`
    : `čez ${absolute} ${slovenianForm(absolute, ['dan', 'dneva', 'dni', 'dni'])}`;
}

function buildDeadlines(params: BuildSalesReportParams): DeadlineRow[] {
  const checked = params.values.E ?? {};
  return MODULE_E_ITEMS.filter((item) => checked[item.key] === 1)
    .map((item) => {
      const days = daysUntil(item.warningDate, params.generatedAtISO);
      const expired = days < 0;
      const date = slovenianDate(item.warningDate);
      const statusText = expired
        ? `POTEKEL ${date} (${dayCountLabel(days)})`
        : days === 0
          ? `${date} — poteče danes`
          : `${date} (${dayCountLabel(days)})`;
      return {
        key: item.key,
        label: item.label,
        dateISO: item.warningDate,
        daysUntil: days,
        expired,
        statusText,
        text: `${statusText} — ${item.label}`,
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

/** Najbližji oziroma najdlje pretečeni rok — vrstica na vrhu pokaže enega. */
export function nearestDeadline(report: SalesReport): DeadlineRow | null {
  const [first, ...rest] = report.qualification.deadlines;
  if (!first) return null;
  if (rest.length === 0) return first;
  return { ...first, text: `${first.text} … in še ${rest.length} med tveganji` };
}

/**
 * Povračilo investicije za svetovalca — glej SalesReportPayback.
 *
 * Podlaga in prag ostaneta v horizon.paybackRows: prepisan pogoj bi se ob
 * spremembi praga razšel z izračunom, ki ga ubeseduje.
 */
function buildPayback(params: BuildSalesReportParams): SalesReportPayback {
  const rows = paybackRows(params.totals.addressablePotentialEUR);
  if (rows) {
    return {
      rows: rows.map((row) => ({
        investmentText: formatEUR(row.investmentEUR),
        durationText: row.months === null ? '—' : monthsLabel(row.months),
      })),
      // Ograda ostane ista, kot jo je nosila tabela v strankinem poročilu: stopnje
      // so primerjalne in brez imena izdelka, ceno potrdi svetovalec po ceniku.
      note: SHARED_COPY.paybackNote,
    };
  }

  // Dva različna razloga za odsotnost tabele: potenciala ni izračunanega (dejavnost
  // brez konteksta) ali je pod pragom. Ena sama poved bi v prvem primeru trdila
  // nekaj, kar ni res. Praga ne imenujemo — je notranja kalibracija, dokument pa
  // lahko pristane pri stranki.
  return {
    rows: null,
    note:
      params.totals.addressablePotentialEUR === undefined
        ? 'Povračila ni mogoče izračunati — za to dejavnost naslovljiv potencial ni izračunan.'
        : 'Povračila ne kaži — izmerjen potencial je za tak prikaz prenizek, dobe bi bile argument proti.',
  };
}

function buildClientView(params: BuildSalesReportParams): SalesReportClientView {
  const heroEUR = heroValueEUR(params.totals);
  const heroRange = heroRangeEUR(params.totalsRange);
  const lowConfidence = params.totals.confidence === 'low';
  const heroText = formatAmount(heroEUR, { range: displayRange(heroRange), lowConfidence });

  // Vrata so ista kot v strankinem PDF: pri ničelnem znesku izpeljank ne izriše.
  // Asimetrija spodaj ni spregled — trojni znesek gre skozi formatAmount (dobi razpon
  // in "najmanj"), dnevni in mesečni pa sta pri stranki VEDNO goli točki.
  const derivativesText =
    heroEUR > 0
      ? `${SHARED_COPY.horizonLabel.toLowerCase()} ${formatAmount(multiYearEUR(heroEUR), {
          range: heroRange
            ? displayRange({
                minEUR: multiYearEUR(heroRange.minEUR),
                maxEUR: multiYearEUR(heroRange.maxEUR),
              })
            : null,
          lowConfidence,
        })} · vsak delovni dan ${formatEUR(perWorkingDayEUR(heroEUR))} · vsak mesec odlašanja ${formatEUR(
          perMonthEUR(heroEUR),
        )}`
      : null;

  return {
    heroText,
    derivativesText,
    coverageText:
      params.coverage && params.coverage.measuredCount < params.coverage.offeredCount
        ? `Izmerjeno ${params.coverage.measuredCount} od ${params.coverage.offeredCount} področij — neizmerjena v zneske ne vstopajo.`
        : null,
    accountingCapacityText:
      params.accountingCapacity === undefined
        ? null
        : `+${params.accountingCapacity.toFixed(1)} strank brez nove zaposlitve`,
  };
}

function costRow(question: CostQuestion, assumption: CostAssumption): AssumptionRow {
  return {
    label: question.label,
    valueText: `${assumption.valueEUR} EUR/h`,
    estimated: assumption.estimated,
    source: assumption.source,
    bandLabel: costBandLabel(question, assumption),
    consequence: null,
  };
}

function scaleRow(
  question: ScaleQuestion,
  assumption: ScaleAssumption,
  consequence: string | null = null,
): AssumptionRow {
  return {
    label: question.label,
    // Odstotke stranka vidi kot odstotke (StepCostBasis pretvarja ob vsakem prikazu),
    // zato jih tako tudi navedemo — ulomek 0,235 v poročilu ni njen odgovor.
    valueText: question.asPercent ? formatPercent(assumption.value) : formatEUR(assumption.value),
    estimated: assumption.estimated,
    source: assumption.source,
    bandLabel: scaleBandLabel(question, assumption),
    consequence: assumption.source === 'none' ? consequence : null,
  };
}

function buildAssumptions(
  context: SegmentContext | undefined,
  profile: BusinessProfile,
): AssumptionRow[] {
  const rows: AssumptionRow[] = [];
  if (!context) return rows;

  rows.push(costRow(context.operationalHour, profile.operationalHour));
  rows.push(costRow(context.adminHour, profile.adminHour));
  // Zaračunano postavko vpraša samo dejavnost, ki prodaja ure. Drugod je v profilu
  // prisotna kot varovalo pred NaN, a je stranka ni videla — navesti jo kot njen
  // odgovor bi bilo neresnično. Isto velja za strošek kapitala spodaj.
  if (context.chargeOutRate) {
    rows.push(costRow(context.chargeOutRate, profile.chargeOutRate));
  }
  if (context.annualRevenue) {
    // Ista posledica, kot jo prebere stranka (lib/confidenceReason.ts) — dve
    // ubeseditvi istega dejstva bi izgledali kot dva različna podatka.
    rows.push(
      scaleRow(
        context.annualRevenue,
        profile.annualRevenue,
        'brez njega postavke, vezane na prihodek, štejejo 0',
      ),
    );
  }
  // Marža in strošek kapitala ob neodgovoru dobita privzetek dejavnosti — to že pove
  // sam vir ("ni odgovora — privzetek dejavnosti"), zato posledice ne pripisujemo.
  // Prihodek je izjema, ker ne dobi privzetka, ampak ničlo.
  if (context.contributionMargin) {
    rows.push(scaleRow(context.contributionMargin, profile.contributionMargin));
  }
  if (context.capitalCostRate) {
    rows.push(scaleRow(context.capitalCostRate, profile.capitalCostRate));
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
 * Sama ocena ostane v assessConfidence — tu se iz istih signalov sestavi samo
 * razlaga. Signale šteje lib/confidenceReason.ts, ki napaja tudi zaslon in
 * strankin PDF: podvojen prag bi pomenil dve resnici o istem vprašanju, ki se
 * ob prvi kalibraciji razideta.
 */
function buildConfidenceReason(params: BuildSalesReportParams): string {
  const signals = collectConfidenceSignals({
    context: params.context,
    profile: params.profile,
    modules: params.activeModules,
    values: params.values,
  });

  const parts: string[] = [];
  if (signals.revenueMissing) {
    parts.push('prihodek ni podan, zato so postavke, vezane na prihodek, enake 0');
  }
  if (signals.estimatedRates > 0) {
    parts.push(
      signals.estimatedRates === 1
        ? 'ena urna postavka je izbran razpon in ne podatek'
        : `${signals.estimatedRates} urne postavke so izbran razpon in ne podatek`,
    );
  }
  if (signals.unknownChoices > 0) {
    parts.push(`${signals.unknownChoices}× je izbran odgovor "Ne vem"`);
  }
  // Ločeno od "Ne vem": molk ni priznanje in pred stranko se ga ne sme tako
  // predstaviti. Za sestanek je to drugo vprašanje — ne "kako bi to izmerili",
  // ampak "kdo pri vas to ve".
  if (signals.unansweredChoices > 0) {
    parts.push(
      signals.unansweredChoices === 1
        ? 'eno izbirno vprašanje je ostalo brez odgovora'
        : `${signals.unansweredChoices} izbirnih vprašanj je ostalo brez odgovora`,
    );
  }
  if (signals.untouchedNumeric > 0) {
    parts.push(`${signals.untouchedNumeric} številskih polj je ostalo na privzeti vrednosti`);
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
