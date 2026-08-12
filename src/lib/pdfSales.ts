import jsPDF from 'jspdf';
import { formatEUR, formatEURRange, formatHours, formatPercent } from './format';
import { displayRange, type EURRange } from './range';
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
import {
  contactPerson,
  hourAssumptionSource,
  taxNumberCell,
  type MeasuredArea,
  type SalesReport,
} from './salesReport';

/**
 * Prodajna priprava na pogovor.
 *
 * Ni druga različica strankinega poročila: strankino odgovarja na "koliko me
 * stane", to pa na "kaj mi je stranka povedala in česa še ne vem". Zato ni grafa
 * (skupni znesek je tu postranski) in je namesto njega tabela vseh odgovorov.
 *
 * PET RAZDELKOV, v tem vrstnem redu: sodba (ocena) → dejstva (osnovni podatki,
 * rezultati) → ukrep (priporočilo) → utemeljitev sodbe (razčlenitev ocene).
 * Poročilo je prej naraščalo s prištevanjem in doseglo dvanajst naslovov; vse
 * ostalo je zdaj podnaslov znotraj teh petih, nič vsebine ni izpadlo.
 *
 * Zgradba mora biti ista kot v salesReportHtml.ts — svetovalec bere obe datoteki
 * in razlika med njima bi izgledala kot razlika v podatkih.
 *
 * Datoteka se fizično prenese na napravo, kjer sedi stranka, zato je ocena
 * ustreznosti ubesedena kot ustreznost in ne kot sodba o podjetju.
 */

const HEADER_HEIGHT = 30;
const DATE_TIME = new Intl.DateTimeFormat('sl-SI', { dateStyle: 'short', timeStyle: 'short' });

/** Sestavi pripravo in jo vrne — dostavo opravi lib/download.ts (glej pdf.ts). */
export async function buildSalesPdfFile(report: SalesReport): Promise<DownloadFile> {
  const doc = new jsPDF();
  registerFonts(doc);
  const logo = await loadImage(`${import.meta.env.BASE_URL}logo-datalab.png`);

  // Pet razdelkov: sodba → dejstva → ukrep → utemeljitev sodbe.
  let y = drawHeader(doc, report, logo);
  y = drawScore(doc, report, y);             // 1. Ocena — kvalifikacija stranke
  y = drawQualification(doc, report, y);     // 2. Osnovni podatki
  y = drawResults(doc, report, y);           // 3. Rezultati vprašalnika (3a + 3b)
  y = drawRecommendation(doc, report, y);    // 4. Priporočilo licenc
  drawIcp(doc, report, y);                   // 5. Podrobnejša razlaga

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

// --- 2. Osnovni podatki ------------------------------------------------------

function drawQualification(doc: jsPDF, report: SalesReport, startY: number): number {
  const q = report.qualification;
  const band = `${formatPercent(q.improvementBand.min)} – ${formatPercent(q.improvementBand.max)}`;

  // Zrcali vrstice v salesReportHtml.ts, isti vrstni red — svetovalec bere obe
  // datoteki in razlika med njima bi izgledala kot razlika v podatkih.
  const rows: string[][] = [
    ['Kontaktna oseba', contactPerson(report) || '—'],
    ['E-naslov', report.meta.email || '—'],
    ['Telefon', report.meta.phone || '—'],
    ['Davčna številka', taxNumberCell(report)],
    ['Dejavnost', q.industryLabel],
    ['Vprašalnik', q.segmentName],
    ['Velikost', `${q.sizeClass} zaposlenih (vneseno: ${q.employeeCount})`],
    ['Vlogo navaja kot', q.roleLabel ?? '—'],
    ['Pretežno dela', q.businessTypeLabel ?? '—'],
    ['Sedanji sistem', q.currentSystemLabel ?? '—'],
    ['Obstoječi uporabnik PANTHEON', q.isPantheonCustomer ? 'Da' : 'Ne'],
    ['Pas realistične izboljšave', band],
    ['Vir obiska', report.meta.utmSource ?? 'neposredno'],
    ['Privolitev — obdelava osebnih podatkov', report.meta.consentProcessing ? 'Da' : 'Ne'],
    ['Privolitev — ponudbe PANTHEON', report.meta.consentOffers ? 'Da' : 'Ne'],
    ['Privolitev — vsebine in dogodki', report.meta.consentContent ? 'Da' : 'Ne'],
  ];

  let y = ensurePageSpace(doc, startY, 24);
  y = drawSectionTitle(doc, 'Osnovni podatki', y);
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

// --- 3a. Njihove info --------------------------------------------------------

function drawSummary(doc: jsPDF, report: SalesReport, startY: number): number {
  const s = report.summary;
  // Isti razpon kot na strankinem zaslonu (glej salesReportHtml.ts).
  const value = (point: number, range: EURRange | undefined): string => {
    const span = displayRange(range);
    return span ? formatEURRange(span.minEUR, span.maxEUR) : formatEUR(point);
  };
  const rows: string[][] = [
    ['Neposredne letne izgube', value(s.directLossEUR, s.rangeEUR?.directLoss), 'Denar, ki odteka'],
    ...(s.lostMarginEUR > 0
      ? [['Nezaslužena letna marža', value(s.lostMarginEUR, s.rangeEUR?.lostMargin), 'Prazna polica, napačna cena']]
      : []),
    [
      'Vrednost izgubljene kapacitete',
      value(s.capacityEUR, s.rangeEUR?.capacity),
      `${formatHours(s.capacityHoursPerMonth)}/mesec — ni prihranek pri plačah`,
    ],
  ];
  if (s.oneTimeCapitalEUR > 0) {
    rows.push([
      'Sprostljiv obratni kapital',
      value(s.oneTimeCapitalEUR, s.rangeEUR?.oneTimeCapital),
      'Enkraten učinek, se z letnimi zneski ne sešteva',
    ]);
  }
  if (s.potentialMinEUR !== undefined && s.potentialMaxEUR !== undefined) {
    rows.push([
      'Realistični potencial',
      formatEURRange(
        s.rangeEUR?.potential?.minEUR ?? s.potentialMinEUR,
        s.rangeEUR?.potential?.maxEUR ?? s.potentialMaxEUR,
      ),
      'Letno, konservativno — ni obljuba prihranka',
    ]);
  }

  let y = ensurePageSpace(doc, startY, 30);
  y = drawTable(doc, {
    head: ['Postavka', 'Znesek', 'Kaj pomeni'],
    rows,
    startY: y,
    columnWidths: [58, 34],
  });

  if (s.confidence) {
    y = drawMutedParagraph(doc, `${CONFIDENCE_LABEL[s.confidence]}. ${s.confidenceReason}`, y);
  }
  if (report.softness.plausibilityWarning) {
    y = drawMutedParagraph(
      doc,
      `Opozorilo o verjetnosti: ${report.softness.plausibilityWarning}`,
      y,
    );
  }
  return y;
}

// --- 3b. Njihovi največji painpointi -----------------------------------------

function drawTriage(doc: jsPDF, report: SalesReport, startY: number): number {
  if (report.triage.length === 0) return startY;

  let y = ensurePageSpace(doc, startY, 30);

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
        // Trdnost stoji OB številki, ne v ločenem razdelku dvajset vrstic niže.
        row.source,
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
  y = drawSubTitle(doc, 'Podatki, procesna tveganja in roki', y);

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

function drawActions(doc: jsPDF, report: SalesReport, startY: number): number {
  if (!report.actionPlan) return startY;

  let y = ensurePageSpace(doc, startY, 40);
  y = drawSubTitle(doc, report.actionPlan.headline, y);
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

  return y + 2;
}

// --- 1. Ocena — kvalifikacija stranke ----------------------------------------

/**
 * Sodba na vrh, utemeljitev na dno (glej drawIcp).
 *
 * Prodajnik mora v treh sekundah vedeti, ali je to A ali C; razčlenitev po
 * dimenzijah ga takrat ne zanima.
 */
function drawScore(doc: jsPDF, report: SalesReport, startY: number): number {
  const { icp } = report;
  const deal = report.playbook.dealSizing;

  let y = ensurePageSpace(doc, startY, 46);
  y = drawSectionTitle(doc, 'Ocena — kvalifikacija stranke', y);

  const cardHeight = 16;
  y = ensurePageSpace(doc, y, cardHeight + 4);
  doc.setFillColor(...PALETTE.cream);
  doc.setDrawColor(...PALETTE.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, cardHeight, 1.5, 1.5, 'FD');

  setFont(doc, 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...PALETTE.amber);
  doc.text(`${icp.total} / 100 · pas ${icp.band}`, MARGIN + 5, y + 10);

  setFont(doc, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.textMuted);
  doc.text(icp.bandNote, PAGE_WIDTH - MARGIN - 5, y + 10, { align: 'right' });
  y += cardHeight + 5;

  return drawTable(doc, {
    head: ['', 'Ocena'],
    rows: [
      ['Velikost posla', `${deal.sizeLabel} (${report.qualification.sizeClass} zaposlenih)`],
      ['Izmerjena letna bolečina', formatEUR(deal.measuredLossEUR)],
      ['Nujnost', `${deal.urgency} — ${deal.urgencyReason}`],
      ['Priporočena licenca', report.playbook.recommendedPantheon.licence.name],
    ],
    startY: ensurePageSpace(doc, y, 24),
    columnWidths: [56],
  });
}

// --- 3. Rezultati vprašalnika ------------------------------------------------

/** Dva podnaslova v enem razdelku, da zgradba ostane petdelna. */
function drawResults(doc: jsPDF, report: SalesReport, startY: number): number {
  let y = ensurePageSpace(doc, startY, 30);
  y = drawSectionTitle(doc, 'Rezultati vprašalnika', y);
  y = drawSubTitle(doc, 'Njihove info', y);
  y = drawSummary(doc, report, y);
  y = drawHourAssumptions(doc, report, y);
  y = drawAreas(doc, report, y);

  y = drawSubTitle(doc, 'Njihovi največji painpointi', ensurePageSpace(doc, y, 24));
  y = drawTriage(doc, report, y);
  y = drawRisks(doc, report, y);
  y = drawOpeningQuestions(doc, report, y);
  return drawObjections(doc, report, y);
}

/** Podnaslov znotraj razdelka — brez rumene oznake, ki pripada le razdelkom. */
function drawSubTitle(doc: jsPDF, title: string, y: number): number {
  const next = ensurePageSpace(doc, y, 12);
  setFont(doc, 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...PALETTE.brandDark);
  doc.text(title, MARGIN, next + 3);
  return next + 8;
}

/** Urne postavke: niso odgovor na modul, zato svoja kratka tabela. */
function drawHourAssumptions(doc: jsPDF, report: SalesReport, startY: number): number {
  const rows = report.softness.hourAssumptions;
  if (rows.length === 0) return startY;

  return drawTable(doc, {
    head: ['Urna postavka', 'Vrednost', 'Vir'],
    rows: rows.map((row) => [row.label, formatEUR(row.valueEUR), hourAssumptionSource(row)]),
    startY: ensurePageSpace(doc, startY, 22),
    columnWidths: [82, 26],
  });
}

function drawOpeningQuestions(doc: jsPDF, report: SalesReport, startY: number): number {
  const questions = report.playbook.openingQuestions;
  if (questions.length === 0) return startY;

  let y = ensurePageSpace(doc, startY, 30);
  y = drawSubTitle(doc, 'Kaj vprašati', y);
  y = drawMutedParagraph(
    doc,
    'Po vrsti, od najmočnejše. Prva so področja, ki jih je stranka sama označila za boleča, a jih ni izmerila — zanje v poročilu ni nobenega zneska.',
    y,
  );

  return drawTable(doc, {
    head: ['Vprašajte', 'Zakaj prav to'],
    rows: questions.map((item) => [item.question, item.why]),
    startY: ensurePageSpace(doc, y, 24),
    columnWidths: [104],
  });
}

function drawRecommendation(doc: jsPDF, report: SalesReport, startY: number): number {
  const fit = report.playbook.recommendedPantheon;

  let y = ensurePageSpace(doc, startY, 40);
  y = drawSectionTitle(doc, 'Priporočilo licenc glede na kriterije', y);

  // Merila najprej: prodajnik mora videti, IZ ČESA je priporočilo izpeljano,
  // preden prebere, kaj naj ponudi.
  y = drawTable(doc, {
    head: ['', 'Ocena'],
    rows: [
      ['Licenca', fit.licence.name],
      ['Dejavnost', report.qualification.industryLabel],
      ['Sedanji sistem', report.qualification.currentSystemLabel ?? '—'],
      ['Velikost', `${report.qualification.sizeClass} zaposlenih`],
    ],
    startY: y,
    columnWidths: [56],
  });

  if (fit.licence.note) {
    y = drawMutedParagraph(doc, `Pozor: ${fit.licence.note}`, y);
  }

  setFont(doc, 'semibold');
  doc.setFontSize(10);
  doc.setTextColor(...PALETTE.brandDark);
  const headlineLines = doc.splitTextToSize(fit.headline, CONTENT_WIDTH);
  y = ensurePageSpace(doc, y, headlineLines.length * 5 + 2);
  doc.text(headlineLines, MARGIN, y);
  y += headlineLines.length * 5 + 2;

  y = drawMutedParagraph(doc, fit.why, y);
  if (fit.addresses.length > 0) {
    y = drawMutedParagraph(doc, `Naslavlja: ${fit.addresses.join(' · ')}`, y, 8);
  }
  y = drawMutedParagraph(doc, fit.confirm, y, 7.5);

  // "3 ukrepi" spadajo k ponudbi: ukrep brez ponudbe je nasvet, ki ga stranka že ima.
  return drawActions(doc, report, y);
}

function drawObjections(doc: jsPDF, report: SalesReport, startY: number): number {
  const objections = report.playbook.objections;
  if (objections.length === 0) return startY;

  let y = ensurePageSpace(doc, startY, 30);
  y = drawSubTitle(doc, 'Kaj boste slišali in kaj odgovoriti', y);
  y = drawMutedParagraph(
    doc,
    'Našteti so samo ugovori, ki iz njenih odgovorov res sledijo — ne seznam vseh možnih.',
    y,
  );

  for (const objection of objections) {
    y = ensurePageSpace(doc, y, 26);

    setFont(doc, 'semibold');
    doc.setFontSize(9.5);
    doc.setTextColor(...PALETTE.brandDark);
    const objectionLines = doc.splitTextToSize(objection.objection, CONTENT_WIDTH);
    doc.text(objectionLines, MARGIN, y);
    y += objectionLines.length * 4.6 + 1;

    y = drawMutedParagraph(doc, `Sproženo: ${objection.trigger}`, y, 7.5);

    setFont(doc, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...PALETTE.text);
    const answerLines = doc.splitTextToSize(objection.answer, CONTENT_WIDTH);
    y = ensurePageSpace(doc, y, answerLines.length * 4.6 + 4);
    doc.text(answerLines, MARGIN, y);
    y += answerLines.length * 4.6 + 5;
  }

  return y;
}

// --- Velikost posla in ICP ocena ---------------------------------------------


/**
 * Ocena ustreznosti idealnemu profilu.
 *
 * Na dnu in z razčlenitvijo: skupno število brez utemeljitev je neuporabno pri
 * pogovoru in neuravnavljivo pozneje. Merila so v config/icp.ts.
 */
function drawIcp(doc: jsPDF, report: SalesReport, startY: number): void {
  const { icp } = report;

  let y = ensurePageSpace(doc, startY, 40);
  y = drawSectionTitle(doc, 'Kvalifikacija stranke — podrobnejša razlaga', y);

  // Skupna ocena kot kartica, da je vidna na prvi pogled.
  const cardHeight = 16;
  y = ensurePageSpace(doc, y, cardHeight + 4);
  doc.setFillColor(...PALETTE.cream);
  doc.setDrawColor(...PALETTE.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, cardHeight, 1.5, 1.5, 'FD');

  setFont(doc, 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...PALETTE.amber);
  doc.text(`${icp.total} / 100 · pas ${icp.band}`, MARGIN + 5, y + 10);

  setFont(doc, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.textMuted);
  doc.text(icp.bandNote, PAGE_WIDTH - MARGIN - 5, y + 10, { align: 'right' });
  y += cardHeight + 5;

  y = drawTable(doc, {
    head: ['Dimenzija', 'Točke', 'Iz česa'],
    rows: icp.dimensions.map((dimension) => [
      dimension.label,
      `${Math.round(dimension.points)} / ${Math.round(dimension.weight * 100)}`,
      dimension.note,
    ]),
    startY: ensurePageSpace(doc, y, 24),
    columnWidths: [44, 20],
  });

  drawMutedParagraph(
    doc,
    'Merila so začetne ocene brez empirije in se uravnavajo v src/config/icp.ts. Ocena pove ustreznost profilu, ne kakovosti podjetja.',
    y,
    7.5,
  );
}
