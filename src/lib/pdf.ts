import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MODULE_REGISTRY } from '../config/modules';
import type { ModuleOutput } from '../config/modules/moduleTypes';
import type { SegmentConfig } from '../config/segments';
import { getActionPlan } from '../../content/actions/actions';
import type { BucketTotals } from './moduleEngine';
import { formatEUR, formatHours } from './format';

export interface GeneratePdfParams {
  segment: SegmentConfig;
  companyName: string;
  outputs: ModuleOutput[];
  totals: BucketTotals;
  highestModule: string | null;
  accountingCapacity?: number;
}

const RISK_LEVEL_LABEL: Record<string, string> = {
  low: 'nizko',
  medium: 'srednje',
  high: 'visoko',
};

function moduleTitle(moduleId: string): string {
  return MODULE_REGISTRY[moduleId]?.title ?? moduleId;
}

/** Vrstice ene tabele: modul, postavka, znesek — enotno za vse denarne koše. */
function rowsForBucket(outputs: ModuleOutput[], bucket: ModuleOutput['bucket']): string[][] {
  return outputs
    .filter((output) => output.bucket === bucket && (output.valueEUR ?? 0) > 0)
    .map((output) => [
      moduleTitle(output.moduleId),
      output.hoursPerMonth ? `${output.label} (${formatHours(output.hoursPerMonth)}/mesec)` : output.label,
      formatEUR(output.valueEUR ?? 0),
    ]);
}

export function generateResultsPdf(params: GeneratePdfParams): void {
  const doc = new jsPDF();
  const dateStr = new Intl.DateTimeFormat('sl-SI').format(new Date());
  const pageBottom = 275;

  doc.setFontSize(16);
  doc.text('Datalab — Analiza skritih stroškov sedanjega načina dela', 14, 18);
  doc.setFontSize(10);
  doc.text(`Podjetje: ${params.companyName || '—'}`, 14, 26);
  doc.text(`Segment: ${params.segment.displayName}`, 14, 32);
  doc.text(`Datum: ${dateStr}`, 14, 38);

  doc.setFontSize(12);
  doc.text(`Neposredne letne izgube: ${formatEUR(params.totals.directLossEUR)}`, 14, 48);
  if (params.accountingCapacity !== undefined) {
    doc.text(`Kapaciteta: +${params.accountingCapacity.toFixed(1)} strank brez nove zaposlitve`, 14, 55);
  }

  autoTable(doc, {
    startY: params.accountingCapacity !== undefined ? 60 : 54,
    head: [['Modul', 'Postavka', 'Letni znesek']],
    body: rowsForBucket(params.outputs, 'directLoss'),
  });

  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  /** Zagotovi prostor za naslednji blok; ob potrebi začne novo stran. */
  const ensureSpace = (needed: number) => {
    if (y + needed > pageBottom) {
      doc.addPage();
      y = 20;
    }
  };

  const capacityRows = rowsForBucket(params.outputs, 'capacity');
  if (capacityRows.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Vrednost sproščene kapacitete: ${formatEUR(params.totals.capacityEUR)}`, 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [['Modul', 'Postavka', 'Letna vrednost']],
      body: capacityRows,
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

    doc.setFontSize(9);
    const note = doc.splitTextToSize(
      `Skupaj ${formatHours(params.totals.capacityHoursPerMonth)}/mesec sproščenega časa. To ni prihranek pri plačah — zaposleni ostane, njegov čas pa se lahko usmeri v delo, ki prinaša vrednost.`,
      180,
    );
    doc.text(note, 14, y);
    y += note.length * 5 + 8;
  }

  if (params.totals.oneTimeCapitalEUR > 0) {
    ensureSpace(24);
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Enkratno sprostljiv kapital v zalogah: ${formatEUR(params.totals.oneTimeCapitalEUR)}`, 14, y);
    y += 6;
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(
      'Enkraten dogodek, ne letni prihranek — zato se z zneski zgoraj ne sešteva. Letni strošek tega kapitala je že vštet med neposredne izgube.',
      180,
    );
    doc.text(lines, 14, y);
    y += lines.length * 5 + 8;
  }

  if (params.totals.risks.length > 0) {
    ensureSpace(20 + params.totals.risks.length * 12);
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Marža in procesna tveganja', 14, y);
    y += 6;
    doc.setFontSize(9);
    for (const risk of params.totals.risks) {
      const level = risk.riskLevel ? ` (${RISK_LEVEL_LABEL[risk.riskLevel]} tveganje)` : '';
      const lines = doc.splitTextToSize(`• ${risk.label}${level}: ${risk.note ?? ''}`.trim(), 180);
      ensureSpace(lines.length * 5 + 4);
      doc.text(lines, 14, y);
      y += lines.length * 5 + 2;
    }
    y += 6;
  }

  const actionPlan = getActionPlan(params.highestModule);
  if (actionPlan) {
    ensureSpace(20 + actionPlan.actions.length * 12);
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('3 ukrepi ta teden', 14, y);
    y += 6;
    doc.setFontSize(9);
    actionPlan.actions.forEach((action, index) => {
      const lines = doc.splitTextToSize(`${index + 1}. ${action}`, 180);
      ensureSpace(lines.length * 5 + 4);
      doc.text(lines, 14, y);
      y += lines.length * 5 + 2;
    });
  }

  doc.setFontSize(8);
  doc.setTextColor(120);
  const disclaimerLines = doc.splitTextToSize(
    'To je samostojna ocena za interno rabo, ne plačan strokovni pregled. Izračun ne predpostavlja in ne obljublja specifičnih funkcionalnosti PANTHEON izven trenutno objavljenega slovenskega cenika.',
    180,
  );
  doc.text(disclaimerLines, 14, 285);

  doc.save('datalab-analiza-skritih-stroskov.pdf');
}
