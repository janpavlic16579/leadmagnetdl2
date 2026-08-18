import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { RiskLevel } from '../config/modules/moduleTypes';
import type { ConfidenceLevel } from './potential';
import { TITILLIUM_BOLD_BASE64, TITILLIUM_REGULAR_BASE64, TITILLIUM_SEMIBOLD_BASE64 } from './pdfFonts';

/**
 * Skupni gradniki obeh PDF dokumentov.
 *
 * Doslej je bilo vse to privatno v pdf.ts, ker je bil dokument en sam. Ko je poleg
 * strankinega nastal še prodajni, sta bili na voljo samo dve poti: kopirati paleto,
 * pisave in prelome strani, ali ju dvigniti sem. Kopija bi se razšla ob prvi
 * spremembi znamke — in razlika bi se pokazala kot dva dokumenta, ki trdita, da
 * prihajata od istega podjetja.
 *
 * Tu je SAMO tisto, kar rabita oba. Hero kartice, graf in akcijski načrt ostanejo
 * v pdf.ts: to je strankina zgodba, ne skupno orodje.
 */

/** Mutabilna trojica — tako jo sprejmeta jsPDF (spread v setFillColor idr.) IN jspdf-autotable (Color). */
export type RGB = [number, number, number];

/**
 * Znamčna paleta, prepisana iz src/styles/tokens.css (svetla tema — PDF se
 * tiska/bere na zaslonu, temna tema tu ni primerna). Iste barve uporabljata
 * ResultsSummary in RiskCard na zaslonu, da PDF govori isti vizualni jezik.
 */
export const PALETTE = {
  brandDark: [35, 31, 32] as RGB, // --color-on-primary #231f20
  brandYellow: [250, 175, 23] as RGB, // --color-primary #faaf17
  amber: [138, 96, 13] as RGB, // --color-primary-text #8a600d
  cream: [241, 237, 226] as RGB, // --color-accent #f1ede2
  white: [255, 255, 255] as RGB,
  border: [223, 227, 232] as RGB, // --color-border #dfe3e8
  text: [68, 68, 68] as RGB, // --color-text #444444
  textMuted: [91, 103, 115] as RGB, // --color-text-muted #5b6773
  warningBg: [255, 244, 229] as RGB, // --color-warning-bg #fff4e5
  warningBorder: [240, 180, 41] as RGB, // --color-warning-border #f0b429
  warningText: [122, 74, 0] as RGB, // --color-warning-text #7a4a00
};

/**
 * jsPDF-jevi vgrajeni fonti (helvetica ipd.) uporabljajo WinAnsi nabor, ki NE
 * vsebuje č (ima pa š, ž) — slovensko besedilo je zato izgubljalo prav ta znak.
 * Vdelamo Titillium Web (isto pisavo kot spletna aplikacija, glej pdfFonts.ts),
 * kar reši manjkajoče znake in hkrati poenoti videz PDF-ja z znamko.
 */
export const FONT = 'TitilliumWeb';
export type FontStyle = 'normal' | 'semibold' | 'bold';

export function registerFonts(doc: jsPDF): void {
  doc.addFileToVFS('TitilliumWeb-Regular.ttf', TITILLIUM_REGULAR_BASE64);
  doc.addFont('TitilliumWeb-Regular.ttf', FONT, 'normal');
  doc.addFileToVFS('TitilliumWeb-SemiBold.ttf', TITILLIUM_SEMIBOLD_BASE64);
  doc.addFont('TitilliumWeb-SemiBold.ttf', FONT, 'semibold');
  doc.addFileToVFS('TitilliumWeb-Bold.ttf', TITILLIUM_BOLD_BASE64);
  doc.addFont('TitilliumWeb-Bold.ttf', FONT, 'bold');
}

export function setFont(doc: jsPDF, style: FontStyle): void {
  doc.setFont(FONT, style);
}

/**
 * Znaki, ki jih vdelani podnabor Titilliuma NIMA.
 *
 * jsPDF manjkajočega glifa ne nadomesti in ne javi — tiho ga IZPUSTI. Formula
 * "(1 − delež)" se je v PDF izpisala kot "(1  delež)", puščica v odpiralnem
 * vprašanju pa je izginila sredi stavka. Napaka je bila zato vidna samo tistemu,
 * ki je PDF odprl in besedilo poznal na pamet.
 *
 * Zamenjava je na strani PDF-ja in ne v content/ datotekah namenoma: na zaslonu
 * so ti znaki pravilni in lepši, uredništvo pa jih sme uporabljati naprej.
 */
const PDF_TEXT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\u2212/g, '-'], // minus − → vezaj
  [/\u2192/g, '->'], // puščica
  [/\u2248/g, '~'], // približno
];

/** Besedilo, pripravljeno za izris: manjkajoči znaki zamenjani z razpoložljivimi. */
export function sanitizePdfText(value: string): string {
  let result = value;
  for (const [pattern, replacement] of PDF_TEXT_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

const sanitizeDeep = (value: unknown): unknown =>
  typeof value === 'string'
    ? sanitizePdfText(value)
    : Array.isArray(value)
      ? value.map(sanitizeDeep)
      : value;

/**
 * Edina pot do novega dokumenta.
 *
 * Poleg pisav vgradi še čiščenje besedila, in sicer na ravni instance: metodi
 * `text` in `splitTextToSize` uporablja tudi jspdf-autotable, zato so z enim
 * mestom pokrite tudi vse tabele. Alternativa — klicati sanitizePdfText na vsakem
 * izrisu — bi pomenila, da en pozabljen klic vrne prav tisto tiho izgubo znakov,
 * ki jo popravljamo. `splitTextToSize` je zajet zato, ker se prelom vrstic računa
 * po širini KONČNEGA besedila; če bi čistili šele ob izrisu, bi se vrstice lomile
 * po napačni meri.
 */
export function createPdfDocument(): jsPDF {
  const doc = new jsPDF();
  registerFonts(doc);

  const originalText = doc.text.bind(doc);
  doc.text = ((text: string | string[], ...rest: unknown[]) =>
    (originalText as (...args: unknown[]) => jsPDF)(sanitizeDeep(text), ...rest)) as typeof doc.text;

  const originalSplit = doc.splitTextToSize.bind(doc);
  doc.splitTextToSize = ((text: string, ...rest: unknown[]) =>
    (originalSplit as (...args: unknown[]) => string[])(
      sanitizeDeep(text),
      ...rest,
    )) as typeof doc.splitTextToSize;

  return doc;
}

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  low: 'nizko tveganje',
  medium: 'srednje tveganje',
  high: 'visoko tveganje',
};

/**
 * Oznaka za tveganje BREZ stopnje — kadar obiskovalec na diagnostična vprašanja
 * para ni odgovoril (glej assuranceRiskLevel v config/modules/shared.ts).
 *
 * Obstaja, ker so izrisovalniki doslej manjkajočo stopnjo brali kot `?? 'low'`.
 * To ni nevtralen privzetek, ampak najbolj pomirjujoča od treh možnih trditev:
 * PDF bi podjetju, ki ni odgovorilo, sporočil "nizko tveganje". Barve ostanejo
 * nevtralne (kot pri 'low'), besedilo pa pove resnico.
 */
export const RISK_LEVEL_UNRATED_LABEL = 'ni ocenjeno';

/** Preslikava iz RiskCard.module.css — low je nevtralen krem, medium/high opozorilna barva. */
export const RISK_LEVEL_COLORS: Record<RiskLevel, { bg: RGB; border: RGB; text: RGB; bold: boolean }> = {
  low: { bg: PALETTE.cream, border: PALETTE.border, text: PALETTE.textMuted, bold: false },
  medium: { bg: PALETTE.warningBg, border: PALETTE.warningBorder, text: PALETTE.warningText, bold: false },
  high: { bg: PALETTE.warningBg, border: PALETTE.warningBorder, text: PALETTE.warningText, bold: true },
};

export const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  high: 'Visoka zanesljivost',
  medium: 'Srednja zanesljivost',
  low: 'Nizka zanesljivost',
};

export const CONFIDENCE_NOTE: Record<ConfidenceLevel, string> = {
  high: 'Vnesene so konkretne ure, stroški in glavni vzroki. Številke stojijo na podatkih podjetja.',
  medium: 'Del vrednosti izhaja iz izbranih razponov ali privzetih ocen — rezultat je pravega velikostnega reda.',
  low: 'Večina ključnih podatkov manjka, zato so zneski spodnja meja — dejanski so praviloma višji, ne nižji.',
};

export const PAGE_WIDTH = 210;
export const PAGE_HEIGHT = 297;
export const MARGIN = 14;
export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
export const PAGE_BOTTOM = 275;
/** Y, na katerem se začne vsebina nove strani (glej ensurePageSpace). */
export const PAGE_TOP = 20;

/**
 * Preostane prostora na trenutni strani ni dovolj → nova stran.
 *
 * ČISTA funkcija, ki vrne (morebiti resetiran) y — namenoma NE zapira nad
 * mutabilno spremenljivko iz klicatelja. Prejšnja različica je uporabljala
 * `ensureSpace` kot closure nad `y` iz generateResultsPdf, medtem ko so
 * posamezne draw*Section funkcije vodile svoj LASTEN lokalni `y`; closure je
 * ob prelomu strani resetiral napačno spremenljivko, zato je vsebina pristala
 * pri stari (napačni, prevelik) y-koordinati na novi strani — v praksi
 * prekrivanje z nogo na dnu skoraj prazne strani.
 *
 * Prodajni dokument ima bistveno več tabel kot strankin in s tem več prelomov,
 * zato je to pravilo tam še bolj zavezujoče.
 */
export function ensurePageSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_BOTTOM) {
    doc.addPage();
    return PAGE_TOP;
  }
  return y;
}

export function drawSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(...PALETTE.brandYellow);
  doc.rect(MARGIN, y, 3, 5, 'F');
  setFont(doc, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...PALETTE.brandDark);
  doc.text(title, MARGIN + 6, y + 4.2);
  return y + 10;
}

/** Skrajša besedilo na eno vrstico, ki še stane v dani prostor (za osne oznake). */
export function truncateToWidth(doc: jsPDF, text: string, maxWidth: number): string {
  if (doc.getTextWidth(text) <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 1 && doc.getTextWidth(`${truncated}…`) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
}

/** Naloži javno sliko kot data URL + naravne dimenzije. Vrne null, če nalaganje spodleti (npr. brez omrežja) — logotip je okras, ne sme podreti generacije PDF-ja. */
export async function loadImage(
  url: string,
): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error('image decode failed'));
      img.src = dataUrl;
    });
    return { dataUrl, width, height };
  } catch {
    return null;
  }
}

export interface TableOptions {
  head: string[];
  rows: string[][];
  startY: number;
  trailingNotes?: string[];
  /** Poravnava in poudarek zadnjega stolpca — pri denarnih tabelah znesek desno. */
  lastColumnIsAmount?: boolean;
  /** Širine stolpcev v mm; brez tega jih razporedi autotable sam. */
  columnWidths?: number[];
}

/**
 * Tabela z znamčnim slogom.
 *
 * Glava je parameter in ne konstanta: strankin dokument ima povsod isto trojico
 * stolpcev, prodajni pa ima tabele odgovorov, triaže in urnih postavk, ki nimajo
 * ničesar skupnega razen videza.
 */
export function drawTable(doc: jsPDF, options: TableOptions): number {
  const columnStyles: Record<number, Record<string, unknown>> = {};

  if (options.lastColumnIsAmount) {
    columnStyles[options.head.length - 1] = {
      halign: 'right',
      fontStyle: 'bold',
      textColor: PALETTE.amber,
    };
  }
  options.columnWidths?.forEach((width, index) => {
    columnStyles[index] = { ...columnStyles[index], cellWidth: width };
  });

  autoTable(doc, {
    startY: options.startY,
    /*
      Spodnja meja je NUJNA in ne kozmetična: brez nje autotable privzame 40/scale
      = 14,1 mm in sme risati do y ≈ 282,9 — noga (črta na 280, besedilo na 284,5)
      je torej pod tabelo in ne za njo. Zgornja poskrbi, da se nadaljevanje tabele
      na novi strani začne na isti višini kot vsaka druga vsebina (PAGE_TOP).
    */
    margin: { top: PAGE_TOP, bottom: PAGE_HEIGHT - PAGE_BOTTOM, left: MARGIN, right: MARGIN },
    head: [options.head],
    body: options.rows,
    theme: 'plain',
    styles: {
      font: FONT,
      fontSize: 9,
      textColor: PALETTE.text,
      cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
      lineColor: PALETTE.border,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: PALETTE.brandDark,
      textColor: PALETTE.white,
      // autotable pozna samo normal/bold/italic; semibold je vpisan v isti dokument.
      fontStyle: 'semibold' as unknown as 'bold',
    },
    alternateRowStyles: {
      fillColor: PALETTE.cream,
    },
    columnStyles,
  });

  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  for (const note of options.trailingNotes ?? []) {
    setFont(doc, 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...PALETTE.textMuted);
    const lines = doc.splitTextToSize(note, CONTENT_WIDTH);
    y = ensurePageSpace(doc, y, lines.length * 4.5 + 2);
    doc.text(lines, MARGIN, y);
    y += lines.length * 4.5 + 4;
  }

  return y;
}

/** Odstavek drobnega, umirjenega besedila. Vrne novi y. */
export function drawMutedParagraph(doc: jsPDF, text: string, y: number, fontSize = 8.5): number {
  setFont(doc, 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(...PALETTE.textMuted);
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
  const next = ensurePageSpace(doc, y, lines.length * 4.5 + 2);
  doc.text(lines, MARGIN, next);
  return next + lines.length * 4.5 + 3;
}

/**
 * Noga na vsaki strani. Levi napis in izjava sta parametra, ker prodajni dokument
 * ni ista stvar kot strankin in se ne sme predstavljati kot ona.
 */
export function drawFooterOnEveryPage(doc: jsPDF, leftLabel: string, disclaimer: string): void {
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);

    doc.setDrawColor(...PALETTE.border);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, 280, PAGE_WIDTH - MARGIN, 280);

    setFont(doc, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...PALETTE.textMuted);
    doc.text(leftLabel, MARGIN, 284.5);
    doc.text(`Stran ${page} od ${pageCount}`, PAGE_WIDTH - MARGIN, 284.5, { align: 'right' });

    doc.setFontSize(7);
    doc.setTextColor(...PALETTE.textMuted);
    doc.text(doc.splitTextToSize(disclaimer, CONTENT_WIDTH), MARGIN, 289);
  }
}

/** Enotna izjava o omejitvi — ista v obeh dokumentih, da si ne nasprotujeta. */
export const PDF_DISCLAIMER =
  'To je samostojna ocena za interno rabo, ne plačan strokovni pregled. Izračun ne predpostavlja in ne obljublja specifičnih funkcionalnosti PANTHEON izven trenutno objavljenega slovenskega cenika.';
