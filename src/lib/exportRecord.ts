import type { SegmentId } from '../config/segmentTypes';
import type { FollowUpSequence } from './followUp';

// Ni CRM API — ta modul nadomešča pravo integracijo z ročnim izvozom (spec pogl. 8, MVP tabela).
// Prenese CSV + JSON datoteko neposredno v brskalniku, brez omrežnega klica.

export interface LeadExportRecord {
  timestampISO: string;
  segment: SegmentId;
  /** id dejavnosti in njena oznaka — prodajnik dobi "Kovinska predelava", ne le "proizvodnja". */
  industry: string;
  industryLabel: string;
  sizeClass: string;
  employeeCount: number;
  companyName: string;
  email: string;
  gdprConsent: true;
  inputs: Record<string, number>;
  results: {
    A?: { annualEUR: number; hoursFreedPerMonth: number };
    B?: { annualEUR: number };
    C?: { releasedCapitalEUR: number; annualEUR: number };
    D?: { annualEUR: number };
  };
  totalAnnualLossEUR: number;
  moduleERisksChecked: string[];
  followUpSequence: FollowUpSequence;
  utmSource: string | null;
}

function triggerDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function downloadAsJson(record: LeadExportRecord): void {
  const filename = `datalab-lead-${record.segment}-${record.timestampISO.slice(0, 10)}.json`;
  triggerDownload(filename, JSON.stringify(record, null, 2), 'application/json');
}

const CSV_INPUT_KEYS = [
  'documentsPerMonth',
  'minutesPerDocument',
  'hourlyLaborCostEUR',
  'transactionsPerMonth',
  'errorRatePercent',
  'costPerErrorEUR',
  'inventoryValueEUR',
  'achievableReductionPercent',
  'capitalCostPercent',
  'annualRevenueEUR',
  'currentDSODays',
  'targetReductionDays',
  'opportunityCostPercent',
] as const;

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadAsCsv(record: LeadExportRecord): void {
  const headerColumns = [
    'timestampISO',
    'segment',
    'industry',
    'industryLabel',
    'sizeClass',
    'employeeCount',
    'companyName',
    'email',
    'gdprConsent',
    ...CSV_INPUT_KEYS.map((key) => `input_${key}`),
    'result_A_annualEUR',
    'result_A_hoursFreedPerMonth',
    'result_B_annualEUR',
    'result_C_releasedCapitalEUR',
    'result_C_annualEUR',
    'result_D_annualEUR',
    'totalAnnualLossEUR',
    'moduleERisksChecked',
    'followUpSequence',
    'utmSource',
  ];

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
    ...CSV_INPUT_KEYS.map((key) => (record.inputs[key] !== undefined ? String(record.inputs[key]) : '')),
    record.results.A ? String(record.results.A.annualEUR) : '',
    record.results.A ? String(record.results.A.hoursFreedPerMonth) : '',
    record.results.B ? String(record.results.B.annualEUR) : '',
    record.results.C ? String(record.results.C.releasedCapitalEUR) : '',
    record.results.C ? String(record.results.C.annualEUR) : '',
    record.results.D ? String(record.results.D.annualEUR) : '',
    String(record.totalAnnualLossEUR),
    record.moduleERisksChecked.join(';'),
    record.followUpSequence,
    record.utmSource ?? '',
  ].map((value) => csvEscape(value));

  const csv = `${headerColumns.join(',')}\n${row.join(',')}`;
  const filename = `datalab-lead-${record.segment}-${record.timestampISO.slice(0, 10)}.csv`;
  triggerDownload(filename, csv, 'text/csv');
}
