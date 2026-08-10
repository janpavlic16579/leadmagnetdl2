import { dealSizeLabel, type IcpScore } from '../config/icp';
import type { SegmentId } from '../config/segmentTypes';
import { getPantheonFit, PANTHEON_FIT_CONFIRM, type PantheonFit } from '../../content/sales/pantheonFit';
import { OBJECTIONS, type ObjectionEntry, type ObjectionId } from '../../content/sales/objections';
import { getSegmentLicence, type LicenceFit } from '../../content/sales/licences';
import { formatEUR } from './format';
import type { SalesReport } from './salesReport';

/**
 * Iz popisa odgovorov v navodilo.
 *
 * Poročilo je doslej povedalo, KAJ je stranka odgovorila. Ta datoteka pove, KAJ
 * NAJ PRODAJNIK NAREDI: kaj vprašati, kaj ponuditi, kaj bo slišal v odgovor in
 * kako velik je posel. Vse je izpeljano iz istih podatkov — nobenega novega
 * vprašanja v vprašalniku.
 *
 * Čista funkcija brez UI in brez datuma v telesu: časovni žig pride iz poročila.
 */

export interface OpeningQuestion {
  question: string;
  /** Zakaj prav to vprašanje pri tej stranki — brez tega je seznam splošen. */
  why: string;
}

export interface DealSizing {
  sizeLabel: string;
  urgency: 'visoka' | 'srednja' | 'nizka';
  urgencyReason: string;
  /** Letna izmerjena bolečina — merilo, ob katerem se velikost posla bere. */
  measuredLossEUR: number;
}

export interface SalesPlaybook {
  openingQuestions: OpeningQuestion[];
  recommendedPantheon: PantheonFit & {
    confirm: string;
    addresses: string[];
    /** Znamka, ki pripada dejavnosti — z zadržki, kjer obstajajo. */
    licence: LicenceFit;
  };
  objections: (ObjectionEntry & { id: ObjectionId })[];
  dealSizing: DealSizing;
}

/** Več kot toliko vprašanj sestanka ne odpre, ampak ga zapre. */
const MAX_QUESTIONS = 6;

/**
 * Playbook nastane IZ poročila, zato tega ob sestavljanju še ni v celoti.
 *
 * Namesto laganja s `as SalesReport` je tip natanko to, kar funkcija bere. Če bo
 * kdaj potrebovala še oceno, jo bo dobila kot parameter — kot jo dobi zdaj.
 */
export type PlaybookInput = Omit<SalesReport, 'playbook' | 'icp'>;

export function buildSalesPlaybook(
  report: PlaybookInput,
  segmentId: SegmentId,
  currentSystemId: string | null,
  icp: IcpScore,
): SalesPlaybook {
  return {
    openingQuestions: buildOpeningQuestions(report),
    recommendedPantheon: buildRecommendation(report, segmentId, currentSystemId),
    objections: buildObjections(report),
    dealSizing: buildDealSizing(report, icp),
  };
}

// --- Iztočnice ---------------------------------------------------------------

/**
 * Vrstni red ni naključen: najprej tisto, kar v poročilu SPLOH NIMA zneska.
 *
 * Področje, ki ga je stranka sama ocenila kot boleče, a ga ni izbrala za izračun,
 * je najboljše možno vprašanje — pogovor odpre o njeni bolečini in hkrati pojasni,
 * zakaj je prikazana številka nižja od resnične.
 */
function buildOpeningQuestions(report: PlaybookInput): OpeningQuestion[] {
  const questions: OpeningQuestion[] = [];

  for (const row of report.triage.filter((item) => !item.measured && item.score >= 2)) {
    questions.push({
      question: `${row.title}: ocenili ste "${row.scoreLabel ?? row.score}" — koliko vas to dejansko stane?`,
      why: 'Sami so to označili za boleče, a področja niso izmerili. V poročilu zanj ni nobenega zneska.',
    });
  }

  for (const row of report.softness.unknownAnswers) {
    questions.push({
      question: `${row.moduleTitle}: "${row.question}" — kdo v podjetju to ve?`,
      why: 'Odgovorili so "Ne vem". Izračun je zato vzel najkonservativnejšo vrednost.',
    });
  }

  for (const row of report.softness.untouchedFields) {
    questions.push({
      question: `${row.moduleTitle}: "${row.question}"`,
      why: 'Polje je ostalo na privzeti vrednosti — v izračun je vstopilo z ničlo ali privzetkom.',
    });
  }

  // Kontekstna polja niso številke, a povedo, KAKO podjetje dela. Uporabna so
  // takrat, ko drugih iztočnic ni — stranka je izpolnila vse.
  if (questions.length === 0) {
    for (const area of report.measured) {
      for (const answer of area.answers.filter((row) => row.contextOnly)) {
        questions.push({
          question: `${area.title}: "${answer.question}" → ${answer.answer}. Kaj bi se moralo spremeniti, da bi bilo drugače?`,
          why: 'Stranka je izpolnila vse, zato ni odprtih številk — pogovor odprite pri načinu dela.',
        });
      }
    }
  }

  return questions.slice(0, MAX_QUESTIONS);
}

// --- Kaj ponuditi ------------------------------------------------------------

function buildRecommendation(
  report: PlaybookInput,
  segmentId: SegmentId,
  currentSystemId: string | null,
): SalesPlaybook['recommendedPantheon'] {
  const fit = getPantheonFit(segmentId, currentSystemId);

  // Alineje jemljemo iz področja z največjo postavko: to je tisto, kar stranko
  // najbolj stane, in hkrati edino, za kar imamo njeno številko.
  const biggest = [...report.measured].sort((a, b) => b.totalEUR - a.totalEUR)[0];
  const addresses = biggest?.pantheon ?? [];

  return {
    ...fit,
    confirm: PANTHEON_FIT_CONFIRM,
    addresses,
    licence: getSegmentLicence(segmentId),
  };
}

// --- Ugovori -----------------------------------------------------------------

/**
 * Ugovor se prikaže samo, kadar iz podatkov res sledi.
 *
 * Splošen seznam vseh možnih ugovorov je za prodajnika enak nič: prebrati bi ga
 * moral vsakič in vsakič sam ugotoviti, kateri velja. Zato sprožilci.
 */
function buildObjections(report: PlaybookInput): SalesPlaybook['objections'] {
  const triggered: ObjectionId[] = [];

  if (report.summary.confidence === 'low') triggered.push('inflatedNumber');

  if (report.softness.unknownAnswers.length + report.softness.untouchedFields.length >= 3) {
    triggered.push('noData');
  }

  // Naslovljiv delež 0,25 pripada kategoriji "external" (config/modules/addressableShare.ts).
  if (report.measured.some((area) => area.addressableShare === 0.25)) {
    triggered.push('externalCause');
  }

  if (report.qualification.isPantheonCustomer) triggered.push('alreadyHavePantheon');

  if (report.triage.some((row) => !row.measured && row.score >= 2)) {
    triggered.push('unmeasuredAreas');
  }

  const painEUR = report.summary.directLossEUR + report.summary.capacityEUR;
  if (painEUR > 0 && report.qualification.improvementBand.max >= 0.25) {
    triggered.push('noTimeToImplement');
  }

  // Vlogo poznamo samo kot oznako; direktor in lastnik sta edina, ki odločata sama.
  const role = report.qualification.roleLabel ?? '';
  if (role && !/direktor|lastnik/i.test(role)) triggered.push('notMyDecision');

  if (report.qualification.improvementBand.max <= 0.2) triggered.push('triedBefore');

  return triggered.map((id) => ({ id, ...OBJECTIONS[id] }));
}

// --- Velikost posla in nujnost ----------------------------------------------

function buildDealSizing(report: PlaybookInput, icp: IcpScore): DealSizing {
  const measuredLossEUR = report.summary.directLossEUR + report.summary.capacityEUR;
  const urgencyValue = icp.dimensions.find((dimension) => dimension.key === 'urgency');

  const urgency: DealSizing['urgency'] =
    urgencyValue && urgencyValue.value >= 0.8
      ? 'visoka'
      : urgencyValue && urgencyValue.value >= 0.5
        ? 'srednja'
        : 'nizka';

  const lossNote =
    report.summary.confidence === 'low'
      ? `Izmerjeno ${formatEUR(measuredLossEUR)} letno, a je to spodnja meja.`
      : `Izmerjeno ${formatEUR(measuredLossEUR)} letno.`;

  return {
    sizeLabel: dealSizeLabel(report.qualification.employeeCount),
    urgency,
    urgencyReason: `${urgencyValue?.note ?? 'Rokov ni.'} ${lossNote}`,
    measuredLossEUR,
  };
}
