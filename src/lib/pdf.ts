import jsPDF from 'jspdf';
import { getSegmentCopy, type ResolvedSegmentCopy } from '../config/copy';
import { getModules, MODULE_REGISTRY } from '../config/modules';
import type { ModuleOutput, RiskLevel } from '../config/modules/moduleTypes';
import type { SegmentConfig } from '../config/segments';
import { getActionPlan } from '../../content/actions/actions';
import { groupByModule } from './moduleEngine';
import type { ConfidenceLevel, ResultTotals } from './potential';
import { formatEUR, formatEURRange, formatHours, formatNumber, isoDate } from './format';
import { displayRange, type EURRange, type TotalsRange } from './range';
import { slugify, type DownloadFile } from './download';
import {
  CONFIDENCE_LABEL,
  CONFIDENCE_NOTE,
  CONTENT_WIDTH,
  drawFooterOnEveryPage,
  drawSectionTitle,
  drawTable,
  ensurePageSpace,
  createPdfDocument,
  loadImage,
  MARGIN,
  PAGE_WIDTH,
  PALETTE,
  PDF_DISCLAIMER,
  RISK_LEVEL_COLORS,
  RISK_LEVEL_LABEL,
  RISK_LEVEL_UNRATED_LABEL,
  setFont,
  truncateToWidth,
} from './pdfKit';

export interface GeneratePdfParams {
  segment: SegmentConfig;
  companyName: string;
  outputs: ModuleOutput[];
  totals: ResultTotals;
  /** Razpon, kadar finančna osnova stoji na izbranih pasovih (lib/range.ts). */
  totalsRange?: TotalsRange | null;
  /**
   * Pokritost izračuna: hero številka meri samo izbrana področja (privzeto 3 od
   * 9–11). PDF brez tega pripisa se bere, kot da meri vse — enako kot na zaslonu
   * (ResultsView.coverageNote).
   */
  coverage?: {
    measuredCount: number;
    offeredCount: number;
    unmeasured: { title: string; scoreLabel: string | null }[];
  };
  highestModule: string | null;
  accountingCapacity?: number;
}

/** Ista logika kot na zaslonu: razpon ima prednost, "najmanj" le pri točki. */
function heroAmount(value: number, range: EURRange | undefined, lowConfidence: boolean): string {
  const span = displayRange(range);
  if (span) return formatEURRange(span.minEUR, span.maxEUR);
  return lowConfidence ? `najmanj ${formatEUR(value)}` : formatEUR(value);
}

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

interface ChartDatum {
  name: string;
  directLossEUR: number;
  lostMarginEUR: number;
  capacityEUR: number;
}

/** Ena skupina stolpcev na modul (ne na posamezno postavko) — enako kot BreakdownChart na zaslonu. */
function buildChartData(segment: SegmentConfig, outputs: ModuleOutput[]): ChartDatum[] {
  const outputsByModule = groupByModule(outputs);
  return getModules(segment.moduleIds)
    .map((definition) => {
      const moduleOutputs = outputsByModule[definition.id] ?? [];
      const sumBucket = (bucket: string) =>
        moduleOutputs.filter((output) => output.bucket === bucket).reduce((sum, output) => sum + (output.valueEUR ?? 0), 0);
      return {
        name: definition.title,
        directLossEUR: sumBucket('directLoss'),
        lostMarginEUR: sumBucket('lostMargin'),
        capacityEUR: sumBucket('capacity'),
      };
    })
    .filter((datum) => datum.directLossEUR > 0 || datum.lostMarginEUR > 0 || datum.capacityEUR > 0);
}

/** Najbližje "lepo" zaokroženo zgornje število za osne oznake grafa (1/2/2,5/5/10 × 10^n). */
function niceCeiling(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const steps = [1, 2, 2.5, 5, 10];
  const step = steps.find((candidate) => candidate * magnitude >= value) ?? 10;
  return step * magnitude;
}

/**
 * Sestavi strankino poročilo in ga VRNE — ne prenese ga.
 *
 * Prej je zadnja vrstica klicala doc.save(), s čimer je dokument prenašal sam sebe
 * po poti jsPDF, ki je ni mogoče ne zakasniti ne uvrstiti v vrsto. Ker se ob oddaji
 * prenesejo tri datoteke, je brskalnik zaporedne prenose zavračal in strankino
 * poročilo — prav tisto, ki mora priti vedno — je izpadlo. Dostavo zdaj opravi
 * lib/download.ts, ki lahko zaporedje krmili.
 *
 * Vsebina dokumenta je nespremenjena.
 */
export async function buildResultsPdfFile(params: GeneratePdfParams): Promise<DownloadFile> {
  const doc = createPdfDocument();
  /**
   * Ista besedila kot na zaslonu. Doslej so bili naslovi kartic in njihove opombe
   * tu zapisani še enkrat — in ker sta bili to dve evidenci, je poročilo vsakega
   * proizvajalca še vedno navajalo "prazna polica, napačna cena".
   */
  const copy = getSegmentCopy(params.segment.id);
  const dateStr = new Intl.DateTimeFormat('sl-SI').format(new Date());
  // Poti do public/ morajo iti prek BASE_URL — aplikacija se strežе izpod
  // /leadmagnetdl/ (glej vite.config.ts), zato bi trdo kodiran koren 404-iral.
  const logo = await loadImage(`${import.meta.env.BASE_URL}logo-datalab.png`);

  let y = drawHeader(doc, params, copy, dateStr, logo);
  y = drawHeroSection(doc, params, copy, y);

  const chartData = buildChartData(params.segment, params.outputs);
  // Nezaslužena marža sodi v isto razčlenitev kot neposredna izguba — enako kot na
  // zaslonu (ResultsView: buckets={['directLoss', 'lostMargin']}). Brez nje trgovec
  // z največjo postavko "prazne police" v PDF-ju te postavke sploh ne bi videl.
  const directLossRows = [
    ...rowsForBucket(params.outputs, 'directLoss'),
    ...rowsForBucket(params.outputs, 'lostMargin'),
  ];
  if (chartData.length > 0 || directLossRows.length > 0) {
    y = ensurePageSpace(doc, y, 24);
    y = drawSectionTitle(doc, copy.results.breakdownTitle, y);
    if (chartData.length > 0) {
      y = ensurePageSpace(doc, y, CHART_TOTAL_HEIGHT);
      y = drawBreakdownChart(doc, chartData, y);
    }
    if (directLossRows.length > 0) {
      y = drawResultsTable(doc, directLossRows, y);
    }
  }

  const capacityRows = rowsForBucket(params.outputs, 'capacity');
  if (capacityRows.length > 0) {
    y = ensurePageSpace(doc, y, 24);
    y = drawSectionTitle(doc, copy.results.capacityTitle, y);
    y = drawResultsTable(doc, capacityRows, y, [
      `Skupaj ${formatHours(params.totals.capacityHoursPerMonth)}/mesec sproščenega časa. ${copy.figures.capacity.note}`,
    ]);
  }

  if (params.totals.risks.length > 0) {
    y = drawRisksSection(doc, params.totals.risks, copy.results.risksTitle, y);
  }

  if (params.coverage && params.coverage.unmeasured.length > 0) {
    y = drawUnmeasuredSection(doc, params.coverage, copy.results.unmeasuredTitle, y);
  }

  const actionPlan = getActionPlan(params.highestModule);
  if (actionPlan) {
    drawActionPlanSection(doc, actionPlan.actions, y);
  }

  drawFooterOnEveryPage(doc, 'Datalab · Analiza skritih stroškov', PDF_DISCLAIMER);

  // Ime nosi podjetje in datum: prej je bilo trdo zakodirano, zato sta se dva
  // izračuna v mapi Prenosi tiho podvojila kot "…(1).pdf".
  const company = slugify(params.companyName);
  return {
    filename: `datalab-analiza-skritih-stroskov${company ? `-${company}` : ''}-${isoDate(new Date())}.pdf`,
    blob: doc.output('blob'),
  };
}

// --- Glava -------------------------------------------------------------------

const HEADER_HEIGHT = 30;

function drawHeader(
  doc: jsPDF,
  params: GeneratePdfParams,
  copy: ResolvedSegmentCopy,
  dateStr: string,
  logo: { dataUrl: string; width: number; height: number } | null,
): number {
  doc.setFillColor(...PALETTE.brandDark);
  doc.rect(0, 0, PAGE_WIDTH, HEADER_HEIGHT, 'F');
  // Tanek rumen pas na spodnjem robu glave loči temen pas od telesa dokumenta.
  doc.setFillColor(...PALETTE.brandYellow);
  doc.rect(0, HEADER_HEIGHT - 1.5, PAGE_WIDTH, 1.5, 'F');

  const textLeft = MARGIN;
  if (logo) {
    const logoHeight = 9;
    const logoWidth = (logo.width / logo.height) * logoHeight;
    doc.addImage(logo.dataUrl, 'PNG', MARGIN, 7, logoWidth, logoHeight);
  }

  doc.setTextColor(...PALETTE.white);
  setFont(doc, 'bold');
  doc.setFontSize(14);
  doc.text(copy.pdf.documentTitle, textLeft, logo ? 24 : 16);

  setFont(doc, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...PALETTE.cream);
  const infoLines = [
    `Podjetje: ${params.companyName || '—'}`,
    `Segment: ${copy.displayName}`,
    `Datum: ${dateStr}`,
  ];
  infoLines.forEach((line, index) => {
    doc.text(line, PAGE_WIDTH - MARGIN, 10 + index * 5, { align: 'right' });
  });

  return HEADER_HEIGHT + 8;
}

// --- Hero ----------------------------------------------------------------

function drawConfidenceBadge(doc: jsPDF, level: ConfidenceLevel, x: number, y: number): void {
  const colors = level === 'high' ? { bg: PALETTE.cream, text: PALETTE.amber } : { bg: PALETTE.warningBg, text: PALETTE.warningText };
  setFont(doc, level === 'low' ? 'bold' : 'normal');
  doc.setFontSize(8);
  const label = CONFIDENCE_LABEL[level];
  const textWidth = doc.getTextWidth(label);
  const badgeWidth = textWidth + 6;
  const badgeHeight = 6;
  doc.setFillColor(...colors.bg);
  if (level !== 'high') {
    doc.setDrawColor(...PALETTE.warningBorder);
    doc.roundedRect(x - badgeWidth, y, badgeWidth, badgeHeight, 1.5, 1.5, 'FD');
  } else {
    doc.roundedRect(x - badgeWidth, y, badgeWidth, badgeHeight, 1.5, 1.5, 'F');
  }
  doc.setTextColor(...colors.text);
  doc.text(label, x - badgeWidth / 2, y + badgeHeight / 2 + 1.4, { align: 'center' });
}

function drawHeroSection(
  doc: jsPDF,
  params: GeneratePdfParams,
  copy: ResolvedSegmentCopy,
  startY: number,
): number {
  let y = startY;

  // Računovodstvo dobi poseben poudarjen pas nad standardno kartico — enaka
  // logika kot na zaslonu (ResultsView: isAccounting && accountingCapacity).
  if (params.accountingCapacity !== undefined) {
    doc.setFillColor(...PALETTE.brandYellow);
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 16, 2, 2, 'F');
    doc.setTextColor(...PALETTE.brandDark);
    setFont(doc, 'bold');
    doc.setFontSize(15);
    doc.text(`+${params.accountingCapacity.toFixed(1)} strank brez nove zaposlitve`, PAGE_WIDTH / 2, y + 10.5, {
      align: 'center',
    });
    y += 22;
  }

  const heroHeight = 36;
  doc.setFillColor(...PALETTE.cream);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, heroHeight, 3, 3, 'F');

  setFont(doc, 'semibold');
  doc.setFontSize(9);
  doc.setTextColor(...PALETTE.textMuted);
  doc.text(copy.figures.directLoss.title.toUpperCase(), MARGIN + 8, y + 11);

  if (params.totals.confidence) {
    drawConfidenceBadge(doc, params.totals.confidence, MARGIN + CONTENT_WIDTH - 8, y + 7.5);
  }

  setFont(doc, 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...PALETTE.brandDark);
  const amountLabel = heroAmount(
    params.totals.directLossEUR,
    params.totalsRange?.directLoss,
    params.totals.confidence === 'low',
  );
  doc.text(amountLabel, MARGIN + 8, y + 23);

  setFont(doc, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.textMuted);
  const heroNote =
    params.totals.confidence
      ? CONFIDENCE_NOTE[params.totals.confidence]
      : copy.figures.directLoss.note;
  const heroNoteLines = doc.splitTextToSize(heroNote, CONTENT_WIDTH - 16);
  doc.text(heroNoteLines, MARGIN + 8, y + 30);

  y += heroHeight + 6;

  // Pokritost tik pod hero zneskom — znesek meri samo izbrana področja.
  if (params.coverage && params.coverage.measuredCount < params.coverage.offeredCount) {
    setFont(doc, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...PALETTE.textMuted);
    doc.text(
      `Izmerjeno ${params.coverage.measuredCount} od ${params.coverage.offeredCount} področij — neizmerjena v zneske ne vstopajo (glej zadnji razdelek).`,
      MARGIN,
      y,
    );
    y += 6;
  }

  // Sekundarne kartice: marža, kapaciteta, enkratni kapital, potencial — vsaka samo, če je prisotna.
  const cardValue = (value: number, range: EURRange | undefined): string => {
    const span = displayRange(range);
    return span ? formatEURRange(span.minEUR, span.maxEUR) : formatEUR(value);
  };
  const figures: { title: string; value: string; note: string }[] = [];
  if (params.totals.lostMarginEUR > 0) {
    figures.push({
      title: copy.figures.lostMargin.title.toUpperCase(),
      value: cardValue(params.totals.lostMarginEUR, params.totalsRange?.lostMargin),
      note: copy.figures.lostMargin.shortNote,
    });
  }
  if (params.totals.capacityEUR > 0) {
    figures.push({
      title: copy.figures.capacity.title.toUpperCase(),
      value: cardValue(params.totals.capacityEUR, params.totalsRange?.capacity),
      note: `${formatHours(params.totals.capacityHoursPerMonth)}/mesec — ${copy.figures.capacity.shortNote}`,
    });
  }
  if (params.totals.oneTimeCapitalEUR > 0) {
    figures.push({
      title: copy.figures.oneTimeCapital.title.toUpperCase(),
      value: cardValue(params.totals.oneTimeCapitalEUR, params.totalsRange?.oneTimeCapital),
      note: copy.figures.oneTimeCapital.shortNote,
    });
  }
  if (params.totals.addressablePotentialEUR !== undefined) {
    figures.push({
      title: copy.figures.potential.title.toUpperCase(),
      value: cardValue(params.totals.addressablePotentialEUR, params.totalsRange?.potential),
      note: copy.figures.potential.shortNote,
    });
  }

  if (figures.length > 0) {
    const gap = 4;
    const cardWidth = (CONTENT_WIDTH - gap * (figures.length - 1)) / figures.length;
    const cardHeight = 28;
    figures.forEach((figure, index) => {
      const x = MARGIN + index * (cardWidth + gap);
      doc.setFillColor(...PALETTE.white);
      doc.setDrawColor(...PALETTE.border);
      doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'FD');

      setFont(doc, 'semibold');
      doc.setFontSize(7);
      doc.setTextColor(...PALETTE.textMuted);
      const titleLines = doc.splitTextToSize(figure.title, cardWidth - 8);
      doc.text(titleLines, x + 4, y + 6);

      setFont(doc, 'bold');
      doc.setFontSize(12.5);
      doc.setTextColor(...PALETTE.amber);
      doc.text(figure.value, x + 4, y + 6 + titleLines.length * 3.6 + 4);

      setFont(doc, 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(...PALETTE.textMuted);
      const noteLines = doc.splitTextToSize(figure.note, cardWidth - 8);
      doc.text(noteLines, x + 4, y + 6 + titleLines.length * 3.6 + 9);
    });
    y += cardHeight + 8;
  } else {
    y += 4;
  }

  return y;
}

// --- Graf razčlenitve --------------------------------------------------------

const CHART_LEGEND_HEIGHT = 8;
const CHART_PLOT_HEIGHT = 42;
const CHART_LABEL_HEIGHT = 10;
const CHART_TOTAL_HEIGHT = CHART_LEGEND_HEIGHT + CHART_PLOT_HEIGHT + CHART_LABEL_HEIGHT + 6;

/**
 * Ročno narisan stolpčni graf (jsPDF ne zna izrisati React/SVG grafov) — vizualno
 * zrcali BreakdownChart s spletne strani: ena skupina stolpcev na področje,
 * rumena za neposredno izgubo, temna za sproščeno kapaciteto. Enkratni kapital
 * namenoma ni del tega grafa — mešanje enkratnega zneska med letne bi bila prav
 * napaka, ki jo ločeni koši rezultatov preprečujejo.
 */
function drawBreakdownChart(doc: jsPDF, data: ChartDatum[], startY: number): number {
  let y = startY;
  const hasLostMargin = data.some((datum) => datum.lostMarginEUR > 0);
  const hasCapacity = data.some((datum) => datum.capacityEUR > 0);

  setFont(doc, 'normal');
  doc.setFontSize(8);
  doc.setFillColor(...PALETTE.brandYellow);
  doc.rect(MARGIN, y, 3, 3, 'F');
  doc.setTextColor(...PALETTE.textMuted);
  doc.text('Neposredna izguba', MARGIN + 5, y + 2.6);
  let legendX = MARGIN + 5 + doc.getTextWidth('Neposredna izguba') + 8;
  if (hasLostMargin) {
    doc.setFillColor(...PALETTE.amber);
    doc.rect(legendX, y, 3, 3, 'F');
    doc.text('Nezaslužena marža', legendX + 5, y + 2.6);
    legendX += 5 + doc.getTextWidth('Nezaslužena marža') + 8;
  }
  if (hasCapacity) {
    doc.setFillColor(...PALETTE.brandDark);
    doc.rect(legendX, y, 3, 3, 'F');
    doc.text('Sproščena kapaciteta', legendX + 5, y + 2.6);
  }
  y += CHART_LEGEND_HEIGHT;

  const plotBottom = y + CHART_PLOT_HEIGHT;
  const maxValue = Math.max(
    ...data.flatMap((datum) => [datum.directLossEUR, datum.lostMarginEUR, datum.capacityEUR]),
  );
  const niceMax = niceCeiling(maxValue);

  const steps = 4;
  setFont(doc, 'normal');
  doc.setFontSize(6.5);
  doc.setDrawColor(...PALETTE.border);
  doc.setLineWidth(0.1);
  for (let step = 0; step <= steps; step += 1) {
    const value = (niceMax / steps) * step;
    const gridY = plotBottom - (value / niceMax) * CHART_PLOT_HEIGHT;
    doc.line(MARGIN, gridY, MARGIN + CONTENT_WIDTH, gridY);
    doc.setTextColor(...PALETTE.textMuted);
    doc.text(formatNumber(value), MARGIN - 2, gridY + 1.2, { align: 'right' });
  }

  // Serije so prisotne le, kadar imajo denar — enako kot na zaslonu, kjer stolpec
  // brez vrednosti ne zaseda širine skupine.
  const series: { color: typeof PALETTE.brandYellow; value: (datum: ChartDatum) => number }[] = [
    { color: PALETTE.brandYellow, value: (datum) => datum.directLossEUR },
    ...(hasLostMargin ? [{ color: PALETTE.amber, value: (datum: ChartDatum) => datum.lostMarginEUR }] : []),
    ...(hasCapacity ? [{ color: PALETTE.brandDark, value: (datum: ChartDatum) => datum.capacityEUR }] : []),
  ];

  const slotWidth = CONTENT_WIDTH / data.length;
  const barGap = Math.min(2, slotWidth * 0.08);
  const barWidth = (slotWidth - barGap * (series.length + 1)) / series.length;

  data.forEach((datum, index) => {
    const slotX = MARGIN + index * slotWidth;

    series.forEach((entry, seriesIndex) => {
      const height = (entry.value(datum) / niceMax) * CHART_PLOT_HEIGHT;
      if (height > 0) {
        doc.setFillColor(...entry.color);
        doc.rect(
          slotX + barGap * (seriesIndex + 1) + barWidth * seriesIndex,
          plotBottom - height,
          barWidth,
          height,
          'F',
        );
      }
    });

    setFont(doc, 'normal');
    doc.setFontSize(6.3);
    doc.setTextColor(...PALETTE.textMuted);
    const label = truncateToWidth(doc, datum.name, slotWidth - 1);
    doc.text(label, slotX + slotWidth / 2, plotBottom + 5, { align: 'center' });
  });

  return plotBottom + CHART_LABEL_HEIGHT;
}

/** Denarna tabela strankinega poročila — povsod ista trojica stolpcev. */
function drawResultsTable(
  doc: jsPDF,
  rows: string[][],
  startY: number,
  trailingNotes: string[] = [],
): number {
  return drawTable(doc, {
    head: ['Področje', 'Postavka', 'Letni znesek'],
    rows,
    startY,
    trailingNotes,
    lastColumnIsAmount: true,
  });
}

// --- Tveganja ------------------------------------------------------------

function drawRisksSection(doc: jsPDF, risks: ModuleOutput[], title: string, startY: number): number {
  let y = ensurePageSpace(doc, startY, 24);
  y = drawSectionTitle(doc, title, y);

  setFont(doc, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.textMuted);
  const intro = doc.splitTextToSize(
    'Ta ocena namenoma nima zneska. Kjer ni kalkulacije ali sledljivosti, natančnega zneska ni mogoče izračunati — navidezno natančna številka bi prav to težavo skrila.',
    CONTENT_WIDTH,
  );
  doc.text(intro, MARGIN, y);
  y += intro.length * 4.5 + 4;

  for (const risk of risks) {
    // Nevtralne barve ('low'), a besedilo pove, da ocene ni — sicer bi PDF podjetju,
    // ki na diagnostiko ni odgovorilo, sporočil "nizko tveganje".
    const level: RiskLevel = risk.riskLevel ?? 'low';
    const levelLabel = risk.riskLevel ? RISK_LEVEL_LABEL[risk.riskLevel] : RISK_LEVEL_UNRATED_LABEL;
    const colors = RISK_LEVEL_COLORS[level];

    setFont(doc, 'semibold');
    doc.setFontSize(9);
    const noteLines = risk.note ? doc.splitTextToSize(risk.note, CONTENT_WIDTH - 8) : [];
    const cardHeight = 8 + noteLines.length * 4.2 + 4;
    y = ensurePageSpace(doc, y, cardHeight + 4);

    doc.setFillColor(...colors.bg);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, cardHeight, 2, 2, 'FD');

    doc.setTextColor(...PALETTE.brandDark);
    doc.text(risk.label, MARGIN + 4, y + 6);

    setFont(doc, colors.bold ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...colors.text);
    doc.text(levelLabel, MARGIN + CONTENT_WIDTH - 4, y + 6, { align: 'right' });

    if (noteLines.length > 0) {
      setFont(doc, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...PALETTE.text);
      doc.text(noteLines, MARGIN + 4, y + 11.5);
    }

    y += cardHeight + 4;
  }

  return y;
}

// --- Česa nismo izmerili ----------------------------------------------------

/**
 * Neizmerjena področja poimensko, z obiskovalčevo lastno triažno oceno. Lead
 * magnet, ki zamolči, česa ni izmeril, prikaže hero znesek kot celoto — in ravno
 * področje z oceno "vsak dan" brez zneska je najmočnejši razlog za pogovor.
 */
function drawUnmeasuredSection(
  doc: jsPDF,
  coverage: NonNullable<GeneratePdfParams['coverage']>,
  title: string,
  startY: number,
): number {
  let y = ensurePageSpace(doc, startY, 24);
  y = drawSectionTitle(doc, title, y);

  setFont(doc, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.textMuted);
  const intro = doc.splitTextToSize(
    'Za ta področja nimamo vaših številk, zato v zgornje zneske ne vstopajo z nobenim zneskom. Kjer je navedena vaša ocena, ste področje sami označili kot problematično — dejanski skupni strošek je torej višji od prikazanega.',
    CONTENT_WIDTH,
  );
  doc.text(intro, MARGIN, y);
  y += intro.length * 4.5 + 4;

  return drawTable(doc, {
    head: ['Področje', 'Vaša ocena'],
    rows: coverage.unmeasured.map((entry) => [entry.title, entry.scoreLabel ?? '—']),
    startY: y,
  });
}

// --- Akcijski načrt --------------------------------------------------------

function drawActionPlanSection(doc: jsPDF, actions: string[], startY: number): void {
  let y = ensurePageSpace(doc, startY, 24);
  y = drawSectionTitle(doc, '3 ukrepi ta teden', y);

  actions.forEach((action, index) => {
    setFont(doc, 'normal');
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(action, CONTENT_WIDTH - 12);
    const rowHeight = Math.max(7, lines.length * 4.6 + 2);
    y = ensurePageSpace(doc, y, rowHeight + 2);

    doc.setFillColor(...PALETTE.brandYellow);
    doc.circle(MARGIN + 3, y + 2.2, 3, 'F');
    setFont(doc, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...PALETTE.brandDark);
    doc.text(String(index + 1), MARGIN + 3, y + 3.2, { align: 'center' });

    setFont(doc, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...PALETTE.text);
    doc.text(lines, MARGIN + 9, y + 3.2);

    y += rowHeight;
  });
}

// --- Noga ------------------------------------------------------------------

