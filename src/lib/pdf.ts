import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SegmentConfig } from '../config/segments';
import type { ModuleAResult, ModuleBResult, ModuleCResult, ModuleDResult, ModuleKeyForHighest } from './calculations';
import { getActionPlan } from '../../content/actions/actions';
import { formatEUR } from './format';

export interface GeneratePdfParams {
  segment: SegmentConfig;
  companyName: string;
  results: {
    A?: ModuleAResult;
    B?: ModuleBResult;
    C?: ModuleCResult;
    D?: ModuleDResult;
  };
  totalAnnualLossEUR: number;
  moduleEWarnings: string[];
  highestModule: ModuleKeyForHighest | null;
}

const MODULE_ROW_LABEL: Record<'A' | 'B' | 'C' | 'D', string> = {
  A: 'A — Ročno delo',
  B: 'B — Napake',
  C: 'C — Vezan kapital v zalogah',
  D: 'D — Počasen denarni tok',
};

export function generateResultsPdf(params: GeneratePdfParams): void {
  const doc = new jsPDF();
  const dateStr = new Intl.DateTimeFormat('sl-SI').format(new Date());

  doc.setFontSize(16);
  doc.text('Datalab — Analiza skritih stroškov sedanjega načina dela', 14, 18);
  doc.setFontSize(10);
  doc.text(`Podjetje: ${params.companyName || '—'}`, 14, 26);
  doc.text(`Segment: ${params.segment.displayName}`, 14, 32);
  doc.text(`Datum: ${dateStr}`, 14, 38);

  const rows: string[][] = [];
  if (params.results.A) {
    const label = params.segment.id === 'racunovodstvo' ? 'A — Ročno delo (kapaciteta)' : MODULE_ROW_LABEL.A;
    rows.push([label, `${params.results.A.hoursFreedPerMonth.toFixed(0)} h/mesec sproščenih`, formatEUR(params.results.A.annualEUR)]);
  }
  if (params.results.B) {
    rows.push([MODULE_ROW_LABEL.B, '—', formatEUR(params.results.B.annualEUR)]);
  }
  if (params.results.C) {
    rows.push([`${MODULE_ROW_LABEL.C} — sproščen kapital (enkratno)`, '—', formatEUR(params.results.C.releasedCapitalEUR)]);
    rows.push([`${MODULE_ROW_LABEL.C} — letni prihranek na kapitalu`, '—', formatEUR(params.results.C.annualEUR)]);
  }
  if (params.results.D) {
    rows.push([MODULE_ROW_LABEL.D, '—', formatEUR(params.results.D.annualEUR)]);
  }

  autoTable(doc, {
    startY: 46,
    head: [['Modul', 'Dodatni podatek', 'Letni znesek']],
    body: rows,
  });

  const afterTableY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  doc.setFontSize(12);
  doc.text(`Skupna letna skrita izguba: ${formatEUR(params.totalAnnualLossEUR)}`, 14, afterTableY);
  doc.setFontSize(9);
  doc.text('(brez enkratnega sproščenega kapitala iz modula C — ta je prikazan ločeno zgoraj)', 14, afterTableY + 6);

  let y = afterTableY + 16;

  if (params.moduleEWarnings.length > 0) {
    doc.setFontSize(12);
    doc.text('Tvegani stroški — datumski sprožilci', 14, y);
    y += 6;
    doc.setFontSize(9);
    for (const warning of params.moduleEWarnings) {
      const lines = doc.splitTextToSize(`• ${warning}`, 180);
      doc.text(lines, 14, y);
      y += lines.length * 5 + 2;
    }
    y += 6;
  }

  const actionPlan = getActionPlan(params.highestModule);
  if (actionPlan) {
    doc.setFontSize(12);
    doc.text('3 ukrepi ta teden', 14, y);
    y += 6;
    doc.setFontSize(9);
    actionPlan.actions.forEach((action, index) => {
      const lines = doc.splitTextToSize(`${index + 1}. ${action}`, 180);
      doc.text(lines, 14, y);
      y += lines.length * 5 + 2;
    });
    y += 6;
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
