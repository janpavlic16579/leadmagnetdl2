import jsPDF from 'jspdf';
import { formatEUR, formatHours, formatPercent } from './format';
import { slugify, type DownloadFile } from './download';
import {
  CONFIDENCE_LABEL,
  CONTENT_WIDTH,
  drawFooterOnEveryPage,
  drawMutedParagraph,
  drawSectionTitle,
  drawTable,
  ensurePageSpace,
  loadImage,
  MARGIN,
  PAGE_WIDTH,
  PALETTE,
  PDF_DISCLAIMER,
  registerFonts,
  RISK_LEVEL_COLORS,
  RISK_LEVEL_LABEL,
  setFont,
} from './pdfKit';
import { hourAssumptionSource, type MeasuredArea, type SalesReport } from './salesReport';

/**
 * Prodajna priprava na pogovor.
 *
 * Ni druga različica strankinega poročila: strankino odgovarja na "koliko me
 * stane", to pa na "kaj mi je stranka povedala in česa še ne vem". Zato ni grafa
 * (skupni znesek je tu postranski) in je namesto njega tabela vseh odgovorov.
 *
 * Datoteka se prenese na napravo, kjer sedi stranka. Zato tu ni ničesar, česar ji
 * prodajnik ne bi mogel povedati v obraz — nobenega točkovanja leada, nobenih
 * scenarijev. Vsebina je: kaj je odgovorila, katere številke so trdne, kaj se
 * splača preveriti.
 */

const HEADER_HEIGHT = 30;
const DATE_TIME = new Intl.DateTimeFormat('sl-SI', { dateStyle: 'short', timeStyle: 'short' });

/** Sestavi pripravo in jo vrne — dostavo opravi lib/download.ts (glej pdf.ts). */
export async function buildSalesPdfFile(report: SalesReport): Promise<DownloadFile> {
  const doc = new jsPDF();
  registerFonts(doc);
  const logo = await loadImage(`${import.meta.env.BASE_URL}logo-datalab.png`);

  let y = drawHeader(doc, report, logo);
  y = drawQualification(doc, report, y);
  y = drawSummary(doc, report, y);
  y = drawSoftness(doc, report, y);
  y = drawTriage(doc, report, y);
  y = drawAreas(doc, report, y);
  y = drawRisks(doc, report, y);
  drawActions(doc, report, y);

  drawFooterOnEveryPage(doc, 'Datalab · Priprava na pogovor', PDF_DISCLAIMER);

  const company = slugify(report.meta.companyName);
  return {
    filename: `datalab-prodajna-priprava${company ? `-${company}` : ''}-${report.meta.generatedAtISO.slice(0, 10)}.pdf`,
    blob: doc.output('blob'),
  };
}

// --- Glava -------------------------------------------------------------------

function drawHeader(
  doc: jsPDF,
  report: SalesReport,
  logo: { dataUrl: string; width: number; height: number } | null,
): number {
  doc.setFillColor(...PALETTE.brandDark);
  doc.rect(0, 0, PAGE_WIDTH, HEADER_HEIGHT, 'F');
  doc.setFillColor(...PALETTE.brandYellow);
  doc.rect(0, HEADER_HEIGHT - 1.5, PAGE_WIDTH, 1.5, 'F');

  if (logo) {
    const logoHeight = 9;
    doc.addImage(logo.dataUrl, 'PNG', MARGIN, 7, (logo.width / logo.height) * logoHeight, logoHeight);
  }

  doc.setTextColor(...PALETTE.white);
  setFont(doc, 'bold');
  doc.setFontSize(14);
  doc.text('Priprava na pogovor', MARGIN, logo ? 24 : 16);

  setFont(doc, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...PALETTE.cream);
  const info = [
    `Podjetje: ${report.meta.companyName || '—'}`,
    `E-naslov: ${report.meta.email || '—'}`,
    `Izpolnjeno: ${DATE_TIME.format(new Date(report.meta.generatedAtISO))}`,
  ];
  info.forEach((line, index) => {
    doc.text(line, PAGE_WIDTH - MARGIN, 10 + index * 5, { align: 'right' });
  });

  return HEADER_HEIGHT + 8;
}

// --- Kdo je stranka ----------------------------------------------------------

function drawQualification(doc: jsPDF, report: SalesReport, startY: number): number {
  const q = report.qualification;
  const band = `${formatPercent(q.improvementBand.min)} – ${formatPercent(q.improvementBand.max)}`;

  const rows: string[][] = [
    ['Dejavnost', q.industryLabel],
    ['Vprašalnik', q.segmentName],
    ['Velikost', `${q.sizeClass} zaposlenih (vneseno: ${q.employeeCount})`],
    ['Vlogo navaja kot', q.roleLabel ?? '—'],
    ['Pretežno dela', q.businessTypeLabel ?? '—'],
    ['Sedanji sistem', q.currentSystemLabel ?? '—'],
    ['Obstoječi uporabnik PANTHEON', q.isPantheonCustomer ? 'Da' : 'Ne'],
    ['Pas realistične izboljšave', band],
    ['Vir obiska', report.meta.utmSource ?? 'neposredno'],
    ['Privolitev za obdelavo (GDPR)', report.meta.gdprConsent ? 'Da' : 'Ne'],
  ];

  let y = ensurePageSpace(doc, startY, 24);
  y = drawSectionTitle(doc, 'Kdo je stranka', y);
  y = drawTable(doc, { head: ['', 'Odgovor'], rows, startY: y, columnWidths: [62] });

  if (!q.isPantheonCustomer) {
    y = drawMutedParagraph(
      doc,
      'Stranka ni obstoječi uporabnik PANTHEON, zato ji tehnična opozorila o rokih (SQL Server, Windows Server, ZIERDED) niso bila prikazana. Njihova odsotnost v tem poročilu torej ni podatek o podjetju.',
      y,
    );
  }

  return y;
}

// --- Zneski ------------------------------------------------------------------

function drawSummary(doc: jsPDF, report: SalesReport, startY: number): number {
  const s = report.summary;
  const rows: string[][] = [
    ['Neposredne letne izgube', formatEUR(s.directLossEUR), 'Denar, ki odteka'],
    [
      'Vrednost izgubljene kapacitete',
      formatEUR(s.capacityEUR),
      `${formatHours(s.capacityHoursPerMonth)}/mesec — ni prihranek pri plačah`,
    ],
  ];
  if (s.oneTimeCapitalEUR > 0) {
    rows.push([
      'Sprostljiv obratni kapital',
      formatEUR(s.oneTimeCapitalEUR),
      'Enkraten učinek, se z letnimi zneski ne sešteva',
    ]);
  }
  if (s.potentialMinEUR !== undefined && s.potentialMaxEUR !== undefined) {
    rows.push([
      'Realistični potencial',
      `${formatEUR(s.potentialMinEUR)} – ${formatEUR(s.potentialMaxEUR)}`,
      'Letno, konservativno — ni obljuba prihranka',
    ]);
  }

  let y = ensurePageSpace(doc, startY, 30);
  y = drawSectionTitle(doc, 'Kaj je izračun pokazal', y);
  y = drawTable(doc, {
    head: ['Postavka', 'Znesek', 'Kaj pomeni'],
    rows,
    startY: y,
    columnWidths: [58, 34],
  });

  if (s.confidence) {
    y = drawMutedParagraph(doc, `${CONFIDENCE_LABEL[s.confidence]}. ${s.confidenceReason}`, y);
  }
  return y;
}

// --- Kje so številke mehke ---------------------------------------------------

function drawSoftness(doc: jsPDF, report: SalesReport, startY: number): number {
  const { hourAssumptions, unknownAnswers, untouchedFields } = report.softness;

  let y = ensurePageSpace(doc, startY, 30);
  y = drawSectionTitle(doc, 'Kje so številke trdne in kje ne', y);
  y = drawMutedParagraph(
    doc,
    'Ta razdelek pove, katero številko je smiselno vzeti zares in katero je treba na sestanku najprej preveriti.',
    y,
  );

  if (hourAssumptions.length > 0) {
    y = drawTable(doc, {
      head: ['Urna postavka', 'Vrednost', 'Vir'],
      rows: hourAssumptions.map((row) => [
        row.label,
        formatEUR(row.valueEUR),
        hourAssumptionSource(row),
      ]),
      startY: ensurePageSpace(doc, y, 22),
      columnWidths: [82, 26],
    });
  }

  if (unknownAnswers.length > 0) {
    y = drawTable(doc, {
      head: ['Odgovor "Ne vem"', 'Področje'],
      rows: unknownAnswers.map((row) => [row.question, row.moduleTitle]),
      startY: ensurePageSpace(doc, y, 22),
      columnWidths: [120],
    });
  }

  if (untouchedFields.length > 0) {
    y = drawTable(doc, {
      head: ['Ostalo na privzeti vrednosti', 'Področje'],
      rows: untouchedFields.map((row) => [row.question, row.moduleTitle]),
      startY: ensurePageSpace(doc, y, 22),
      columnWidths: [120],
      trailingNotes: [
        'Ta polja v izračun vstopajo z ničlo ali privzetkom. Vsaka številka, ki jo stranka na sestanku doda, znesek zviša — nikoli zniža.',
      ],
    });
  }

  if (hourAssumptions.length === 0 && unknownAnswers.length === 0 && untouchedFields.length === 0) {
    y = drawMutedParagraph(doc, 'Stranka je odgovorila na vsa vprašanja. Zneske je mogoče vzeti takšne, kot so.', y);
  }

  return y;
}

// --- Triaža ------------------------------------------------------------------

function drawTriage(doc: jsPDF, report: SalesReport, startY: number): number {
  if (report.triage.length === 0) return startY;

  let y = ensurePageSpace(doc, startY, 30);
  y = drawSectionTitle(doc, 'Kaj stranko tišči', y);

  const painfulUnmeasured = report.triage.filter((row) => !row.measured && row.score >= 2);

  y = drawTable(doc, {
    head: ['Področje', 'Ocena stranke', 'Izmerjeno'],
    rows: report.triage.map((row) => [
      row.title,
      row.scoreLabel ? `${row.scoreLabel} (${row.score}/3)` : String(row.score),
      row.measured ? 'da' : 'ne',
    ]),
    startY: y,
    columnWidths: [78, 62],
  });

  if (painfulUnmeasured.length > 0) {
    // Najboljše vprašanje za sestanek: področje, ki ga je stranka sama označila za
    // boleče, a ga ni izbrala za izračun. Znesek zanj torej sploh ni na papirju.
    y = drawMutedParagraph(
      doc,
      `Neizmerjeno, a ocenjeno kot boleče: ${painfulUnmeasured
        .map((row) => row.title)
        .join(', ')}. Za ta področja ni v poročilu nobenega zneska — vprašanje zanje je najbolj naravno izhodišče pogovora.`,
      y,
    );
  }

  return y;
}

// --- Po področjih ------------------------------------------------------------

function drawAreas(doc: jsPDF, report: SalesReport, startY: number): number {
  let y = startY;

  for (const area of report.measured) {
    y = ensurePageSpace(doc, y, 40);
    y = drawSectionTitle(doc, area.title, y);
    y = drawAreaIntro(doc, area, y);

    y = drawTable(doc, {
      head: ['Vprašanje', 'Odgovor', 'Vir'],
      rows: area.answers.map((row) => [
        row.contextOnly ? `${row.question} (kontekst)` : row.question,
        row.answer,
        row.answered ? 'vneseno' : 'privzeto',
      ]),
      startY: ensurePageSpace(doc, y, 24),
      columnWidths: [104, 46],
    });

    const outputRows = area.outputs
      .filter((output) => (output.valueEUR ?? 0) > 0)
      .map((output) => [
        output.hoursPerMonth
          ? `${output.label} (${formatHours(output.hoursPerMonth)}/mesec)`
          : output.label,
        formatEUR(output.valueEUR ?? 0),
      ]);
    if (outputRows.length > 0) {
      y = drawTable(doc, {
        head: ['Izračunana postavka', 'Letni znesek'],
        rows: outputRows,
        startY: ensurePageSpace(doc, y, 22),
        lastColumnIsAmount: true,
      });
    }

    if (area.pantheon.length > 0) {
      y = drawMutedParagraph(doc, `PANTHEON naslavlja: ${area.pantheon.join(' · ')}`, y, 8);
    }
    if (area.methodology) {
      y = drawMutedParagraph(
        doc,
        `Izračun: ${area.methodology.formula} — ${area.methodology.rationale}`,
        y,
        7.5,
      );
    }
    y += 2;
  }

  return y;
}

function drawAreaIntro(doc: jsPDF, area: MeasuredArea, y: number): number {
  const parts = [`Skupaj ${formatEUR(area.totalEUR)} letno.`];
  if (area.mainCauseLabel) {
    parts.push(`Glavni vzrok po oceni stranke: ${area.mainCauseLabel.toLowerCase()}.`);
  }
  if (area.addressableShare !== null) {
    parts.push(
      `Iz tega vzroka izhaja naslovljiv delež ${formatPercent(area.addressableShare)} — toliko od zneska je z boljšimi procesi sploh mogoče nasloviti.`,
    );
  }
  return drawMutedParagraph(doc, parts.join(' '), y);
}

// --- Tveganja ----------------------------------------------------------------

function drawRisks(doc: jsPDF, report: SalesReport, startY: number): number {
  if (report.risks.length === 0) return startY;

  let y = ensurePageSpace(doc, startY, 30);
  y = drawSectionTitle(doc, 'Podatki, procesna tveganja in roki', y);

  for (const risk of report.risks) {
    const level = risk.riskLevel ?? 'low';
    const colors = RISK_LEVEL_COLORS[level];
    setFont(doc, 'normal');
    doc.setFontSize(8.5);
    const noteLines = doc.splitTextToSize(risk.note ?? '', CONTENT_WIDTH - 8);
    const cardHeight = 8 + noteLines.length * 4.2 + 4;

    y = ensurePageSpace(doc, y, cardHeight + 3);
    doc.setFillColor(...colors.bg);
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, cardHeight, 1.5, 1.5, 'FD');

    setFont(doc, 'semibold');
    doc.setFontSize(9);
    doc.setTextColor(...PALETTE.brandDark);
    doc.text(risk.label, MARGIN + 4, y + 6);

    setFont(doc, colors.bold ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...colors.text);
    doc.text(RISK_LEVEL_LABEL[level], PAGE_WIDTH - MARGIN - 4, y + 6, { align: 'right' });

    if (noteLines.length > 0) {
      setFont(doc, 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...PALETTE.text);
      doc.text(noteLines, MARGIN + 4, y + 11.5);
    }

    y += cardHeight + 3;
  }

  return y;
}

// --- Ukrepi ------------------------------------------------------------------

function drawActions(doc: jsPDF, report: SalesReport, startY: number): void {
  if (!report.actionPlan) return;

  let y = ensurePageSpace(doc, startY, 40);
  y = drawSectionTitle(doc, report.actionPlan.headline, y);
  y = drawMutedParagraph(
    doc,
    'Isti trije ukrepi so v strankinem poročilu. Stranka jih je torej že prebrala — na sestanku so izhodišče, ne novica.',
    y,
  );

  report.actionPlan.actions.forEach((action, index) => {
    setFont(doc, 'normal');
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(action, CONTENT_WIDTH - 12);
    const rowHeight = Math.max(7, lines.length * 4.6 + 2);
    y = ensurePageSpace(doc, y, rowHeight);

    doc.setFillColor(...PALETTE.brandYellow);
    doc.circle(MARGIN + 3, y + 2.2, 3, 'F');
    setFont(doc, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...PALETTE.brandDark);
    doc.text(String(index + 1), MARGIN + 3, y + 3.4, { align: 'center' });

    setFont(doc, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...PALETTE.text);
    doc.text(lines, MARGIN + 9, y + 3.2);
    y += rowHeight;
  });
}
