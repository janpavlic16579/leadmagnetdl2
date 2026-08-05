import type { BusinessProfile } from '../config/contexts';
import type { ModuleOutput } from '../config/modules/moduleTypes';
import type { SegmentId } from '../config/segmentTypes';
import { triggerDownload } from './download';
import type { FollowUpSequence } from './followUp';
import type { TriageScores } from './moduleEngine';
import type { ConfidenceLevel } from './potential';

// Ni CRM API — ta modul nadomešča pravo integracijo z ročnim izvozom (spec pogl. 8, MVP tabela).
// Prenese CSV + JSON datoteko neposredno v brskalniku, brez omrežnega klica.

export interface LeadExportRecord {
  timestampISO: string;
  segment: SegmentId;
  /** id dejavnosti in njena oznaka — prodajnik dobi "Maloprodaja", ne le "trgovina". */
  industry: string;
  industryLabel: string;
  sizeClass: string;
  employeeCount: number;
  companyName: string;
  email: string;
  gdprConsent: true;
  /** Moduli, ki so bili dejansko izračunani. */
  selectedModules: string[];
  /** Ocene VSEH modulov iz triaže — "stalno prestavljamo naloge" je signal tudi brez evrov. */
  triageScores: TriageScores;
  moduleInputs: Record<string, Record<string, number>>;
  outputs: ModuleOutput[];
  totals: {
    directLossEUR: number;
    capacityEUR: number;
    capacityHoursPerMonth: number;
    oneTimeCapitalEUR: number;
    /** Odsotna pri segmentih, ki pasu izboljšave ne poznajo. */
    potentialMinEUR?: number;
    potentialMaxEUR?: number;
  };
  /** Koliko od izračuna je podatek in koliko privzeta vrednost — za presojo leada. */
  confidence?: ConfidenceLevel;
  /** Kontekst podjetja; samo segmenti, ki ga vprašajo. */
  profile?: BusinessProfile;
  followUpSequence: FollowUpSequence;
  utmSource: string | null;
}


export function downloadAsJson(record: LeadExportRecord): void {
  const filename = `datalab-lead-${record.segment}-${record.timestampISO.slice(0, 10)}.json`;
  triggerDownload(filename, JSON.stringify(record, null, 2), 'application/json');
}

/**
 * Glava CSV je NAMENOMA fiksna in enaka za vse segmente.
 *
 * Moduli se zdaj razlikujejo po dejavnosti, zato bi dinamični stolpci pomenili
 * drugačno glavo za vsak segment — kar podre vsako CRM preslikavo. Stabilni
 * stolpci nosijo tisto, po čemer prodaja filtrira; celoten vnos po modulih gre
 * v en JSON stolpec, kjer ostane na voljo za analizo.
 *
 * Novi stolpci se dodajajo NA KONEC. Vsaka obstoječa preslikava je pozicijska,
 * zato bi vrivanje na sredino tiho premaknilo vse za njim.
 */
const CSV_COLUMNS = [
  'timestampISO',
  'segment',
  'industry',
  'industryLabel',
  'sizeClass',
  'employeeCount',
  'companyName',
  'email',
  'gdprConsent',
  'directLossEUR',
  'capacityEUR',
  'capacityHoursPerMonth',
  'oneTimeCapitalEUR',
  'riskCount',
  'risks',
  'selectedModules',
  'triageScores',
  'moduleInputsJson',
  'followUpSequence',
  'utmSource',
  'potentialMinEUR',
  'potentialMaxEUR',
  'confidence',
  // Stolpci so odgovori na kontekstna vprašanja dejavnosti: "businessType" je v
  // proizvodnji način proizvodnje, v logistiki pa vrsta storitve. Poimenovanje po
  // eni dejavnosti bi v CRM-ju trdilo nekaj, česar lead ni odgovoril.
  'businessType',
  'currentSystem',
  'role',
  'operationalHourCostEUR',
  'adminHourCostEUR',
  'hourCostsEstimated',
] as const;

/** Prazna celica namesto "0" — segment brez te vrednosti je ni izračunal, ni je izmeril kot nič. */
function optionalRounded(value: number | undefined): string {
  return value === undefined ? '' : String(Math.round(value));
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadAsCsv(record: LeadExportRecord): void {
  const risks = record.outputs.filter((output) => output.bucket === 'risk');

  const row = [
    record.timestampISO,
    record.segment,
    record.industry,
    record.industryLabel,
    record.sizeClass,
    String(record.employeeCount),
    record.companyName,
    record.email,
    String(record.gdprConsent),
    String(Math.round(record.totals.directLossEUR)),
    String(Math.round(record.totals.capacityEUR)),
    String(Math.round(record.totals.capacityHoursPerMonth)),
    String(Math.round(record.totals.oneTimeCapitalEUR)),
    String(risks.length),
    risks.map((risk) => `${risk.label} (${risk.riskLevel ?? 'n/a'})`).join('; '),
    record.selectedModules.join(';'),
    Object.entries(record.triageScores)
      .map(([id, score]) => `${id}=${score}`)
      .join(';'),
    JSON.stringify(record.moduleInputs),
    record.followUpSequence,
    record.utmSource ?? '',
    optionalRounded(record.totals.potentialMinEUR),
    optionalRounded(record.totals.potentialMaxEUR),
    record.confidence ?? '',
    record.profile?.businessType ?? '',
    record.profile?.currentSystem ?? '',
    record.profile?.role ?? '',
    optionalRounded(record.profile?.operationalHour.valueEUR),
    optionalRounded(record.profile?.adminHour.valueEUR),
    // Prodaja mora vedeti, ali sta urni postavki podatek ali le izbran razpon.
    record.profile ? String(record.profile.operationalHour.estimated || record.profile.adminHour.estimated) : '',
  ].map((value) => csvEscape(value));

  const csv = `${CSV_COLUMNS.join(',')}\n${row.join(',')}`;
  const filename = `datalab-lead-${record.segment}-${record.timestampISO.slice(0, 10)}.csv`;
  triggerDownload(filename, csv, 'text/csv');
}
