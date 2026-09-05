import jsPDF from 'jspdf';
import {
  getSegmentCopy,
  segmentLabelWithSize,
  SHARED_COPY,
  type ResolvedSegmentCopy,
} from '../config/copy';
import { getModules, MODULE_REGISTRY } from '../config/modules';
import { MODULE_METHODOLOGY } from '../../content/methodology';
import { SALES_CONTACT } from '../config/salesContact';
import type { ModuleOutput, RiskLevel } from '../config/modules/moduleTypes';
import type { SegmentConfig } from '../config/segments';
import { getActionPlan } from '../../content/actions/actions';
import { groupByModule } from './moduleEngine';
import type { ResultTotals } from './potential';
import {
  formatAmount,
  formatDecimal,
  formatEUR,
  formatHours,
  formatPercent,
  isoDate,
  MIN_FIGURE_EUR,
} from './format';
import {
  multiYearEUR,
  perMonthEUR,
  perWorkingDayEUR,
  yearsLabel,
} from './horizon';
import { heroValueEUR as heroTotal, heroRangeEUR as heroTotalRange } from './heroTotals';
import {
  breakdownRows,
  compositionSegments,
  projectionSeries,
  type BreakdownRow,
} from './reportVisuals';
import { PANTHEON_BRAND } from '../config/pantheonLogos';
import { PANTHEON_LOGO_SVG } from '../config/pantheonLogoSources';
import { HEADER_LOGO_RASTER_WIDTH_PX, rasterizeSvg } from './svgRaster';
import { deadlineChipText, riskDeadline } from './deadlines';
import { displayRange, type EURRange, type TotalsRange } from './range';
import { slugify, type DownloadFile } from './download';
import {
  CONFIDENCE_NOTE,
  CONTENT_WIDTH,
  drawFooterOnEveryPage,
  drawMutedParagraph,
  drawSectionTitle,
  drawTable,
  ensurePageSpace,
  createPdfDocument,
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
  /** Vneseno število zaposlenih — glava pripne velikostni razred k imenu segmenta. */
  employeeCount: number;
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
  /**
   * Izračunan razlog nizke zanesljivosti (lib/confidenceReason.ts, brezosebna
   * oblika). Splošno besedilo iz registra pravi "podatki manjkajo" — kar je
   * napačno, kadar so vsa polja vnesena in sta le urni postavki panožna ocena.
   */
  confidenceReason?: string | null;
}

/**
 * Znesek, kot ga vidi obiskovalec — ista funkcija kot na zaslonu.
 *
 * Prej je bilo isto pravilo tu zapisano še enkrat po svoje in ni poznalo primera 0:
 * prazen izračun je v PDF izpisal "0 EUR" oziroma "najmanj 0 EUR", zaslon pa
 * "ni izmerjeno". Komentar v format.ts to poenotenje razglaša za namero že dlje.
 */
function amountLabelOf(value: number, range: EURRange | undefined, lowConfidence: boolean): string {
  return formatAmount(value, { range: displayRange(range), lowConfidence });
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

/**
 * Ena vrstica na modul (ne na posamezno postavko) — enako kot BreakdownChart na
 * zaslonu, vključno z razvrstitvijo po velikosti, ki jo opravi breakdownRows.
 */
function buildChartData(segment: SegmentConfig, outputs: ModuleOutput[]): BreakdownRow[] {
  const outputsByModule = groupByModule(outputs);
  return breakdownRows(
    getModules(segment.moduleIds)
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
      .filter((datum) => datum.directLossEUR > 0 || datum.lostMarginEUR > 0 || datum.capacityEUR > 0),
  );
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
  // En sam trenutek za cel dokument: glava in roki tveganj morata govoriti o
  // istem dnevu, sicer bi lahko žeton trdil "poteklo" na dokumentu z datumom
  // pred rokom (izris ob polnoči).
  const now = new Date();
  const dateStr = new Intl.DateTimeFormat('sl-SI').format(now);
  // Logotip PANTHEON iste znamke, kot jo je stranka videla v glavi vprašalnika
  // (Header.tsx bere isti PANTHEON_BRAND). Temna različica, ker je glava temna —
  // napis svetle je v #231F20 in bi na njej izginil. Rasterizacija je nujna:
  // jsPDF SVG-ja ne sprejme (glej lib/svgRaster.ts).
  const logo = await rasterizeSvg(
    PANTHEON_LOGO_SVG[PANTHEON_BRAND[params.segment.id]].dark,
    HEADER_LOGO_RASTER_WIDTH_PX,
  );

  let y = drawHeader(doc, params, copy, dateStr, logo);
  y = drawHeroSection(doc, params, copy, y);

  // Vrstni red pripovedi: koliko stane (hero), iz česa je sestavljeno (kartice),
  // zakaj je znesek spodnja meja (ograde), kako je razčlenjen (graf in tabela).
  // Tabele povračila tu ni več: primerjava z investicijo je pogovor s svetovalcem
  // in ne izdelek izračuna. Živi naprej v prodajni pripravi, kot njegovo gradivo.
  y = drawNotIncludedSection(doc, y);

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
      // Višina je odslej odvisna od števila vrstic — pri fiksni konstanti bi graf
      // s sedmimi področji ušel čez rob strani.
      y = ensurePageSpace(doc, y, chartHeightMm(chartData.length));
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

  y = drawMethodologySection(doc, params, y);

  if (params.totals.risks.length > 0) {
    // Isti datum kot glava dokumenta — rok, ki bi bil izračunan iz drugega
    // trenutka, bi lahko trdil "poteklo" na dokumentu z včerajšnjim datumom.
    y = drawRisksSection(doc, params.totals.risks, copy.results.risksTitle, y, now);
  }

  if (params.coverage && params.coverage.unmeasured.length > 0) {
    y = drawUnmeasuredSection(doc, params.coverage, copy.results.unmeasuredTitle, y);
  }

  const actionPlan = getActionPlan(params.highestModule);
  if (actionPlan) {
    y = drawActionPlanSection(doc, actionPlan.actions, y);
  }

  // Zadnji blok dokumenta: pot nazaj k Datalabu. Dokument po lastni obljubi
  // "kroži po upravi" — bere ga tudi nekdo, ki kalkulatorja ni nikoli odprl, in
  // brez kontakta se zanj zgodba tu konča.
  drawNextStepSection(doc, y);

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

/**
 * Desno poravnane vrstice glave.
 *
 * Ločeno od izrisa, ker izrisanega besedila ni mogoče prebrati nazaj — vdelana
 * pisava ga zapiše kot številke glifov. Segment je edina od treh oznak, ki je
 * obiskovalec ne vidi na zaslonu, ampak šele v prejeti datoteki.
 */
export function headerInfoLines(params: GeneratePdfParams, copy: ResolvedSegmentCopy, dateStr: string): string[] {
  return [
    `Podjetje: ${params.companyName || '—'}`,
    `Segment: ${segmentLabelWithSize(copy.displayName, params.employeeCount)}`,
    `Datum: ${dateStr}`,
  ];
}

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
  headerInfoLines(params, copy, dateStr).forEach((line, index) => {
    doc.text(line, PAGE_WIDTH - MARGIN, 10 + index * 5, { align: 'right' });
  });

  return HEADER_HEIGHT + 8;
}

// --- Hero ----------------------------------------------------------------

/**
 * Naložena vrstica sestave naslovne vsote — zrcalo CompositionBar z zaslona.
 *
 * Opomba pod zneskom z besedami našteje tri vrste denarja in bralec jih mora
 * sešteti v glavi. Vrstica isto pove s širinami: vidi se, kateri koš nosi
 * večino, in da so koši trije.
 */
function drawCompositionBar(
  doc: jsPDF,
  totals: ResultTotals,
  copy: ResolvedSegmentCopy,
  x: number,
  y: number,
  width: number,
): number {
  const segments = compositionSegments(totals);
  if (segments.length === 0) return y;

  const color = {
    directLoss: PALETTE.brandYellow,
    lostMargin: PALETTE.amber,
    capacity: PALETTE.brandDark,
  } as const;
  const title = {
    directLoss: copy.figures.directLoss.title,
    lostMargin: copy.figures.lostMargin.title,
    capacity: copy.figures.capacity.title,
  } as const;

  const barHeight = 3.4;
  let segmentX = x;
  for (const segment of segments) {
    doc.setFillColor(...color[segment.key]);
    doc.rect(segmentX, y, segment.share * width, barHeight, 'F');
    segmentX += segment.share * width;
  }

  // Legenda v eni vrstici pod trakom: barva, ime in delež. Znesek tu ne, ker ga
  // nosijo sekundarne kartice tik pod hero blokom.
  let legendX = x;
  setFont(doc, 'normal');
  doc.setFontSize(6.5);
  for (const segment of segments) {
    doc.setFillColor(...color[segment.key]);
    doc.rect(legendX, y + barHeight + 2.4, 2.4, 2.4, 'F');
    doc.setTextColor(...PALETTE.textMuted);
    const label = `${title[segment.key]} ${formatPercent(segment.share)}`;
    doc.text(label, legendX + 3.6, y + barHeight + 4.5);
    legendX += 3.6 + doc.getTextWidth(label) + 6;
  }

  return y + barHeight + 7;
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
    // formatDecimal in ne toFixed: pika je v tem dokumentu ločilo tisočic
    // ("12.400 EUR"), zato je "3.4 stranke" mogoče brati kot tri tisoč štiristo.
    // Zaslon je isto številko že pisal po slovensko (ResultsView, formatDecimal).
    doc.text(
      `+${formatDecimal(params.accountingCapacity)} strank brez nove zaposlitve`,
      PAGE_WIDTH / 2,
      y + 10.5,
      { align: 'center' },
    );
    y += 22;
  }

  /**
   * Hero znesek je ISTA vsota kot na zaslonu (ResultsView: directLoss + lostMargin
   * + capacity), ne le prvi koš.
   *
   * Dotlej je dokument, ki roma do uprave, kot glavno številko izpisal samo
   * neposredno izgubo: obiskovalec je na zaslonu videl 71.452 EUR, PDF pa 17.000 —
   * marža in kapaciteta sta bili pomanjšani v stranski kartici. Ločeni koši
   * ostanejo ločeni tam, kjer to nekaj pomeni (kartice, razčlenitev, graf);
   * naslovna številka mora biti ena in ista v obeh medijih.
   * Enkratni kapital ostane zunaj vsote — enkraten znesek se z letnimi ne sešteva.
   */
  const heroValueEUR = heroTotal(params.totals);
  const heroRange = heroTotalRange(params.totalsRange);

  setFont(doc, 'normal');
  doc.setFontSize(8.5);
  const heroNoteLines: string[] = doc.splitTextToSize(copy.results.heroNote, CONTENT_WIDTH - 16);
  const hasComposition = compositionSegments(params.totals).length > 0;
  // Kartica se prilagodi besedilu: opomba o sestavi vsote je daljša od prejšnje
  // enovrstične in bi ob fiksni višini ušla čez rob. Traku sestave in vrstici
  // časovnih leč se prišteje njuna izmerjena višina.
  const heroHeight =
    26 + heroNoteLines.length * 4.2 + 4 + (hasComposition ? 13 : 0) + (heroValueEUR > 0 ? 16 : 0);

  doc.setFillColor(...PALETTE.cream);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, heroHeight, 3, 3, 'F');

  setFont(doc, 'semibold');
  doc.setFontSize(9);
  doc.setTextColor(...PALETTE.textMuted);
  doc.text(copy.results.heroLabel.toUpperCase(), MARGIN + 8, y + 11);

  setFont(doc, 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...PALETTE.brandDark);
  doc.text(
    amountLabelOf(heroValueEUR, heroRange, params.totals.confidence === 'low'),
    MARGIN + 8,
    y + 23,
  );

  setFont(doc, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.textMuted);
  doc.text(heroNoteLines, MARGIN + 8, y + 30);

  let innerY = y + 30 + heroNoteLines.length * 4.2 + 1;

  if (hasComposition) {
    innerY = drawCompositionBar(doc, params.totals, copy, MARGIN + 8, innerY, CONTENT_WIDTH - 16);
  }

  /**
   * Tri časovne leče: isti letni znesek na delovni dan, na mesec in v treh letih.
   *
   * Dnevni ekvivalent je bil doslej zakopan v opombo pod večletnim pogledom,
   * čeprav je edina številka na strani, ki jo bralec preveri na pamet — in prav
   * zato tista, ki letnemu znesku podeli verodostojnost.
   */
  if (heroValueEUR > 0) {
    const lenses = [
      { label: SHARED_COPY.lensDayLabel, value: formatEUR(perWorkingDayEUR(heroValueEUR)) },
      { label: SHARED_COPY.lensMonthLabel, value: formatEUR(perMonthEUR(heroValueEUR)) },
      {
        label: SHARED_COPY.horizonLabel,
        value: amountLabelOf(
          multiYearEUR(heroValueEUR),
          heroRange
            ? { minEUR: multiYearEUR(heroRange.minEUR), maxEUR: multiYearEUR(heroRange.maxEUR) }
            : undefined,
          params.totals.confidence === 'low',
        ),
      },
    ];

    const lensGap = 3;
    const lensWidth = (CONTENT_WIDTH - 16 - lensGap * 2) / 3;
    lenses.forEach((lens, index) => {
      const lensX = MARGIN + 8 + index * (lensWidth + lensGap);
      doc.setFillColor(...PALETTE.white);
      doc.rect(lensX, innerY, lensWidth, 13, 'F');
      // Trojni znesek je sidro odločitve o ERP — rumen rob, ne večja pisava:
      // druga velika številka bi tekmovala z naslovnim zneskom.
      if (index === 2) {
        doc.setFillColor(...PALETTE.brandYellow);
        doc.rect(lensX, innerY, 1, 13, 'F');
      }

      setFont(doc, 'semibold');
      doc.setFontSize(6.2);
      doc.setTextColor(...PALETTE.textMuted);
      doc.text(lens.label.toUpperCase(), lensX + 3, innerY + 4.5);

      setFont(doc, 'bold');
      doc.setTextColor(...PALETTE.brandDark);
      // Znesek se skrči, dokler ne gre v ploščico: razpon "336.360 EUR –
      // 360.984 EUR" je pri fiksni velikosti ušel čez rob, jsPDF pa besedila
      // sam ne skrajša in ne prelomi.
      let lensFontSize = 9.5;
      doc.setFontSize(lensFontSize);
      while (lensFontSize > 5.5 && doc.getTextWidth(lens.value) > lensWidth - 6) {
        lensFontSize -= 0.5;
        doc.setFontSize(lensFontSize);
      }
      doc.text(lens.value, lensX + 3, innerY + 10);
    });
  }

  y += heroHeight + 6;

  // Pojasnilo o kakovosti vhodnih podatkov pod kartico. Značke in merilnika nad
  // njim ni več (glej ConfidenceNote): stopnja je stranki na naslovnem znesku
  // brala kot ocena našega izračuna, čeprav je merila njene vnose. Poved ostane,
  // ker edina pove tudi smer napake. Pri nizki oceni ima prednost izračunan
  // razlog: splošni stavek trdi, da podatki manjkajo, tudi kadar so vneseni vsi
  // in so ocene le urne postavke.
  if (params.totals.confidence) {
    const note =
      params.totals.confidence === 'low' && params.confidenceReason
        ? params.confidenceReason
        : CONFIDENCE_NOTE[params.totals.confidence];
    y = drawMutedParagraph(doc, note, y, 8);
  }

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

  /**
   * Kumulativa po letih — zrcalo ProjectionBars z zaslona.
   *
   * Trojni znesek stoji tudi med lečami v hero kartici, in to namenoma: tam je
   * SIDRO (ena številka, s katero se odločitev primerja), tu pa POT do njega.
   * Naraščajoči stolpci povedo tisto, česar ena številka ne more — da znesek ne
   * čaka na odločitev, ampak med njo nastaja.
   */
  const projection = projectionSeries(heroValueEUR);
  if (projection.length > 0) {
    setFont(doc, 'semibold');
    doc.setFontSize(8);
    doc.setTextColor(...PALETTE.textMuted);
    doc.text(SHARED_COPY.projectionTitle.toUpperCase(), MARGIN, y);
    y += 4;

    const trackX = MARGIN + 16;
    const trackWidth = CONTENT_WIDTH - 16 - 46;
    projection.forEach((point) => {
      setFont(doc, 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...PALETTE.textMuted);
      doc.text(yearsLabel(point.year), MARGIN, y + 3.4);

      doc.setFillColor(...PALETTE.cream);
      doc.rect(trackX, y, trackWidth, 4, 'F');
      // Zadnje leto je trojni znesek — isti rumeni poudarek kot leča v hero kartici.
      doc.setFillColor(...(point.fraction === 1 ? PALETTE.brandYellow : PALETTE.amber));
      doc.rect(trackX, y, point.fraction * trackWidth, 4, 'F');

      setFont(doc, 'semibold');
      doc.setFontSize(7);
      doc.setTextColor(...PALETTE.text);
      doc.text(
        amountLabelOf(
          point.cumulativeEUR,
          heroRange
            ? {
                minEUR: multiYearEUR(heroRange.minEUR, point.year),
                maxEUR: multiYearEUR(heroRange.maxEUR, point.year),
              }
            : undefined,
          params.totals.confidence === 'low',
        ),
        MARGIN + CONTENT_WIDTH,
        y + 3.4,
        { align: 'right' },
      );
      y += 6;
    });

    y = drawMutedParagraph(
      doc,
      `${SHARED_COPY.horizonNote} ${SHARED_COPY.delayNote
        .replace('{daily}', formatEUR(perWorkingDayEUR(heroValueEUR)))
        .replace('{monthly}', formatEUR(perMonthEUR(heroValueEUR)))}`,
      y + 4,
      8,
    );
    y += 2;
  }

  // Sekundarne kartice: izguba, marža, kapaciteta, enkratni kapital, potencial —
  // vsaka samo, če je prisotna. Neposredna izguba je odkar hero nosi vsoto ena od
  // njih in ne več naslovna številka.
  // `lowConfidence` mora potovati enako kot na zaslonu (ResultsSummary): brez
  // njega je zaslon pisal "najmanj 44.000 EUR", PDF pa isto kartico "44.000 EUR"
  // — dokument za upravo je trdil natančneje kot zaslon. Kapital in potencial
  // sta tudi na zaslonu brez te predpone, zato jo dobita samo denarna koša in
  // kapaciteta.
  const cardValue = (value: number, range: EURRange | undefined, lowConfidence = false): string =>
    formatAmount(value, { range: displayRange(range), lowConfidence });
  const isLowConfidence = params.totals.confidence === 'low';
  const figures: { title: string; value: string; note: string }[] = [];
  if (params.totals.directLossEUR >= MIN_FIGURE_EUR) {
    figures.push({
      title: copy.figures.directLoss.title.toUpperCase(),
      value: cardValue(params.totals.directLossEUR, params.totalsRange?.directLoss, isLowConfidence),
      note: copy.figures.directLoss.shortNote,
    });
  }
  if (params.totals.lostMarginEUR >= MIN_FIGURE_EUR) {
    figures.push({
      title: copy.figures.lostMargin.title.toUpperCase(),
      value: cardValue(params.totals.lostMarginEUR, params.totalsRange?.lostMargin, isLowConfidence),
      note: copy.figures.lostMargin.shortNote,
    });
  }
  if (params.totals.capacityEUR > 0) {
    figures.push({
      title: copy.figures.capacity.title.toUpperCase(),
      value: cardValue(params.totals.capacityEUR, params.totalsRange?.capacity, isLowConfidence),
      note: `${formatHours(params.totals.capacityHoursPerMonth)}/mesec — ${copy.figures.capacity.shortNote}`,
    });
  }
  if (params.totals.oneTimeCapitalEUR >= MIN_FIGURE_EUR) {
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

      // Znesek se skrči, dokler ne gre v kartico. Odkar je kartic lahko pet
      // (neposredna izguba se jim je pridružila, ko je hero prevzel vsoto), je
      // kartica ožja, razpon "29.232 – 39.672 EUR" pa je pri fiksni velikosti
      // ušel čez rob — jsPDF besedila sam ne skrajša in ne prelomi.
      setFont(doc, 'bold');
      doc.setTextColor(...PALETTE.amber);
      let valueFontSize = 12.5;
      doc.setFontSize(valueFontSize);
      while (valueFontSize > 7 && doc.getTextWidth(figure.value) > cardWidth - 8) {
        valueFontSize -= 0.5;
        doc.setFontSize(valueFontSize);
      }
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

// --- Česa znesek ne vsebuje --------------------------------------------------

/**
 * Ograde na enem mestu.
 *
 * Vse so obstajale že prej, raztresene po opombah kartic in po razdelku o
 * neizmerjenem — torej tam, kjer jih bralec sreča šele, ko si je o številki že
 * ustvaril mnenje. Skupaj povedo, da izračun meri manj, kot podjetje izgublja.
 */
function drawNotIncludedSection(doc: jsPDF, startY: number): number {
  setFont(doc, 'normal');
  doc.setFontSize(8);
  const itemLines = SHARED_COPY.notIncluded.map(
    // "–" in ne "•": pisava pike nima (glej pdfGlyphs.test.ts) in bi jo izrisala
    // kot prazno mesto.
    (item) => doc.splitTextToSize(`–  ${item}`, CONTENT_WIDTH - 12) as string[],
  );
  const lineCount = itemLines.reduce((sum, lines) => sum + lines.length, 0);
  const boxHeight = 10 + lineCount * 4 + 8;

  let y = ensurePageSpace(doc, startY, boxHeight + 4);

  doc.setFillColor(...PALETTE.warningBg);
  doc.setDrawColor(...PALETTE.warningBorder);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, boxHeight, 2, 2, 'FD');

  setFont(doc, 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.warningText);
  doc.text(SHARED_COPY.notIncludedTitle.toUpperCase(), MARGIN + 5, y + 6.5);

  setFont(doc, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...PALETTE.text);
  let itemY = y + 12;
  for (const lines of itemLines) {
    doc.text(lines, MARGIN + 5, itemY);
    itemY += lines.length * 4;
  }

  setFont(doc, 'bold');
  doc.setFontSize(8);
  doc.text(SHARED_COPY.notIncludedClosing, MARGIN + 5, itemY + 2.5);

  return y + boxHeight + 6;
}

// --- Graf razčlenitve --------------------------------------------------------

const CHART_LEGEND_HEIGHT = 8;
/** Višina ene vrstice: ime področja, naložen stolpec, znesek in delež. */
const CHART_ROW_HEIGHT = 9;
const CHART_BAR_HEIGHT = 5;
/** Širina stolpca z imenom področja — imena so dolga in dobijo celo vrstico. */
const CHART_LABEL_WIDTH = 56;
/** Prostor za znesek in delež na desni. */
const CHART_VALUE_WIDTH = 34;

function chartHeightMm(rowCount: number): number {
  return CHART_LEGEND_HEIGHT + rowCount * CHART_ROW_HEIGHT + 4;
}

/**
 * Ročno narisan graf (jsPDF ne zna izrisati React/SVG grafov) — vizualno zrcali
 * BreakdownChart s spletne strani: ena NALOŽENA vodoravna vrstica na področje,
 * urejeno po velikosti, z zneskom in deležem ob koncu.
 *
 * Naložen in ne vzporeden: dokler je bila naslovna številka samo neposredna
 * izguba, sta bila koša ločena tudi vizualno, ker se nista seštevala. Odkar hero
 * nosi vsoto vseh treh (lib/heroTotals.ts), je naložen stolpec natanko to, kar
 * naslovna številka trdi — iz česa je sestavljena. Ločenost košev nosi barva.
 *
 * Vrstni red določi breakdownRows (lib/reportVisuals.ts) — ista funkcija kot na
 * zaslonu, da dokument in zaslon področij ne razvrstita različno.
 *
 * Enkratni kapital namenoma ni del grafa: mešanje enkratnega zneska med letne bi
 * bila prav napaka, ki jo ločeni koši rezultatov preprečujejo.
 */
function drawBreakdownChart(doc: jsPDF, rows: BreakdownRow[], startY: number): number {
  let y = startY;
  const hasLostMargin = rows.some((row) => row.lostMarginEUR > 0);
  const hasCapacity = rows.some((row) => row.capacityEUR > 0);

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

  const trackX = MARGIN + CHART_LABEL_WIDTH;
  const trackWidth = CONTENT_WIDTH - CHART_LABEL_WIDTH - CHART_VALUE_WIDTH;
  // Merilo postavi največja vrstica: ta zasede ves tir, ostale so v razmerju z
  // njo. Lepo zaokrožena os tu ni potrebna, ker so vrednosti izpisane ob vrstici.
  const maxTotal = Math.max(...rows.map((row) => row.totalEUR), 1);

  rows.forEach((row, index) => {
    const rowY = y + index * CHART_ROW_HEIGHT;
    const barY = rowY + (CHART_ROW_HEIGHT - CHART_BAR_HEIGHT) / 2;

    // Največja postavka je krepka: prvo vprašanje ob razčlenitvi je "kje
    // izgubljam največ" in odgovor nanj ne sme terjati primerjanja dolžin.
    setFont(doc, row.isTop ? 'semibold' : 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...(row.isTop ? PALETTE.text : PALETTE.textMuted));
    doc.text(truncateToWidth(doc, row.name, CHART_LABEL_WIDTH - 3), MARGIN, barY + 3.6);

    // Podlaga tira: brez nje krajše vrstice lebdijo in razmerja ni videti.
    doc.setFillColor(...PALETTE.cream);
    doc.rect(trackX, barY, trackWidth, CHART_BAR_HEIGHT, 'F');

    const segments: { color: typeof PALETTE.brandYellow; valueEUR: number }[] = [
      { color: PALETTE.brandYellow, valueEUR: row.directLossEUR },
      { color: PALETTE.amber, valueEUR: row.lostMarginEUR },
      { color: PALETTE.brandDark, valueEUR: row.capacityEUR },
    ];

    let segmentX = trackX;
    for (const segment of segments) {
      if (segment.valueEUR <= 0) continue;
      const width = (segment.valueEUR / maxTotal) * trackWidth;
      doc.setFillColor(...segment.color);
      doc.rect(segmentX, barY, width, CHART_BAR_HEIGHT, 'F');
      segmentX += width;
    }

    setFont(doc, row.isTop ? 'semibold' : 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...PALETTE.text);
    doc.text(formatEUR(row.totalEUR), MARGIN + CONTENT_WIDTH, barY + 2, { align: 'right' });

    setFont(doc, 'normal');
    doc.setFontSize(6.3);
    doc.setTextColor(...PALETTE.textMuted);
    doc.text(formatPercent(row.share), MARGIN + CONTENT_WIDTH, barY + 5.6, { align: 'right' });
  });

  return y + rows.length * CHART_ROW_HEIGHT + 4;
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

function drawRisksSection(
  doc: jsPDF,
  risks: ModuleOutput[],
  title: string,
  startY: number,
  now: Date,
): number {
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
    // Širina oznake se izmeri, DOKLER je nastavljena njena pisava: izmerjena po
    // preklopu na drobnejšo pisavo žetona je bila prekratka in žeton je zlezel
    // čez besedilo "visoko tveganje".
    const levelLabelWidth = doc.getTextWidth(levelLabel);

    /**
     * Žeton z rokom levo od stopnje — enako kot RiskCard na zaslonu.
     *
     * Datum je doslej živel samo sredi stavka v opombi, kjer se bere kot podatek.
     * Kot žeton se bere kot ura, ki teče, in prav to tehnični rok tudi je.
     */
    const deadline = riskDeadline(risk, now);
    if (deadline) {
      setFont(doc, deadline.expired ? 'bold' : 'normal');
      doc.setFontSize(7);
      const chipText = deadlineChipText(deadline);
      const chipWidth = doc.getTextWidth(chipText) + 5;
      const chipX = MARGIN + CONTENT_WIDTH - 4 - levelLabelWidth - 4 - chipWidth;

      doc.setFillColor(...PALETTE.white);
      doc.setDrawColor(...(deadline.expired ? PALETTE.danger : PALETTE.border));
      doc.roundedRect(chipX, y + 2, chipWidth, 5.5, 1.5, 1.5, 'FD');
      doc.setTextColor(...(deadline.expired ? PALETTE.danger : PALETTE.textMuted));
      doc.text(chipText, chipX + chipWidth / 2, y + 5.9, { align: 'center' });
    }

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

function drawActionPlanSection(doc: jsPDF, actions: string[], startY: number): number {
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

  return y;
}

// --- Kako smo računali ------------------------------------------------------

/**
 * Formula in "PANTHEON naslavlja" za vsako izmerjeno področje.
 *
 * Obrazec za prevzem obljublja "s formulo pod vsako postavko" — formula pa je
 * bila doslej na zaslonu (zastonj) in v interni pripravi, v edinem dokumentu,
 * za katerega obiskovalec plača z e-naslovom, pa ne. Enkrat na PODROČJE in ne
 * pod vsako tabelo: modul, ki polni oba koša, bi sicer dobil identičen blok
 * dvakrat — ista podvojitev, ki jo je pregled UX očital zaslonu.
 */
function drawMethodologySection(doc: jsPDF, params: GeneratePdfParams, startY: number): number {
  // Področja z denarnim izidom, v vrstnem redu registra segmenta — istem kot v
  // tabelah zgoraj in v razčlenitvi na zaslonu.
  const byModule = groupByModule(params.outputs);
  const measured = params.segment.moduleIds
    .filter((id) =>
      (byModule[id] ?? []).some((output) => output.bucket !== 'risk' && (output.valueEUR ?? 0) > 0),
    )
    .map((id) => MODULE_REGISTRY[id])
    .filter((definition) => definition !== undefined);
  if (measured.length === 0) return startY;

  let y = ensurePageSpace(doc, startY, 26);
  y = drawSectionTitle(doc, 'Kako smo računali', y);

  for (const definition of measured) {
    const methodology = MODULE_METHODOLOGY[definition.id];
    const pantheon = definition.pantheon ?? [];
    if (!methodology && pantheon.length === 0) continue;

    setFont(doc, 'normal');
    doc.setFontSize(8);
    const formulaLines = methodology
      ? doc.splitTextToSize(`Izračun: ${methodology.formula} — ${methodology.rationale}`, CONTENT_WIDTH)
      : [];
    const pantheonLines = pantheon.length
      ? doc.splitTextToSize(`PANTHEON naslavlja: ${pantheon.join(' · ')}`, CONTENT_WIDTH)
      : [];
    const blockHeight = 5 + formulaLines.length * 3.6 + pantheonLines.length * 3.6 + 4;
    y = ensurePageSpace(doc, y, blockHeight);

    setFont(doc, 'semibold');
    doc.setFontSize(9);
    doc.setTextColor(...PALETTE.text);
    doc.text(definition.title, MARGIN, y + 3);
    y += 5.5;

    if (formulaLines.length > 0) {
      setFont(doc, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...PALETTE.textMuted);
      doc.text(formulaLines, MARGIN, y + 2.5);
      y += formulaLines.length * 3.6 + 1;
    }

    if (pantheonLines.length > 0) {
      setFont(doc, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...PALETTE.brandDark);
      doc.text(pantheonLines, MARGIN, y + 2.5);
      y += pantheonLines.length * 3.6 + 1;
    }

    y += 2.5;
  }

  return y;
}

// --- Naslednji korak --------------------------------------------------------

/**
 * Kontakt na koncu dokumenta — edina pot nazaj k Datalabu.
 *
 * Isti zapis kot na rezultatih (config/salesContact.ts): dokument in zaslon
 * morata imenovati isto številko. Brez cen in brez obljub — točen obseg
 * potrdi svetovalec, kar pove že pravni pridržek v nogi.
 */
function drawNextStepSection(doc: jsPDF, startY: number): number {
  let y = ensurePageSpace(doc, startY + 2, 34);
  y = drawSectionTitle(doc, 'Naslednji korak', y);

  const intro =
    'Te številke lahko v kratkem pogovoru preverite s svetovalcem — brez obveznosti. ' +
    'Svetovalec pregleda vaš izračun in pove, katere postavke je v vašem primeru mogoče nasloviti najhitreje.';
  setFont(doc, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...PALETTE.text);
  const introLines = doc.splitTextToSize(intro, CONTENT_WIDTH);
  doc.text(introLines, MARGIN, y + 3);
  y += introLines.length * 4.2 + 4;

  setFont(doc, 'semibold');
  doc.setFontSize(9.5);
  doc.setTextColor(...PALETTE.brandDark);
  doc.text(
    `${SALES_CONTACT.label} · ${SALES_CONTACT.phone} · ${SALES_CONTACT.email}`,
    MARGIN,
    y + 3,
  );

  return y + 8;
}

// --- Noga ------------------------------------------------------------------

