import { describe, expect, it } from 'vitest';
import { TITILLIUM_REGULAR_BASE64 } from './pdfFonts';
import { sanitizePdfText } from './pdfKit';

/**
 * Straža nad znaki, ki jih vdelana pisava pozna.
 *
 * jsPDF manjkajoč glif tiho izpusti — ne vrže, ne opozori, samo ne nariše ga.
 * Tako sta iz prodajne priprave izginila minus v formuli ("(1 − delež)") in
 * puščica v odpiralnem vprašanju; opazil bi ju le človek, ki besedilo pozna na
 * pamet.
 *
 * Nabor dovoljenih znakov se BERE IZ PISAVE in ni prepisan v seznam. Ročni
 * seznam je prva različica tega testa tudi imela — in je javil napako pri „§",
 * ki ga pisava v resnici ima. Seznam bi torej silil v dve napaki hkrati: lažne
 * prijave in tiho zastaranje, ko se podnabor pisave zamenja.
 *
 * Ko test pade, sta na voljo dve pravi potezi: znak dodaj v podnabor pisave
 * (pyftsubset) ali v PDF_TEXT_REPLACEMENTS v pdfKit.ts.
 *
 * Vir se bere prek Vitovega `?raw` in ne prek node:fs — iz istega razloga kot v
 * pdf.test.ts: tsconfig.app.json namenoma nima tipov za Node, da se `process` in
 * `Buffer` ne moreta prikrasti v kodo, ki teče v brskalniku.
 */

/** Kodne točke, ki jih TTF res pokriva — prebrane iz tabele cmap (format 4). */
function supportedCodepoints(base64: string): Set<number> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const view = new DataView(bytes.buffer);
  const tag = (offset: number) =>
    String.fromCharCode(...bytes.subarray(offset, offset + 4));

  let cmapOffset = 0;
  const tableCount = view.getUint16(4);
  for (let i = 0; i < tableCount; i += 1) {
    const record = 12 + i * 16;
    if (tag(record) === 'cmap') {
      cmapOffset = view.getUint32(record + 8);
      break;
    }
  }
  if (!cmapOffset) throw new Error('Pisava nima tabele cmap');

  // Podtabela za Unicode BMP: (3,1) je tista, ki jo pišejo podnabori.
  let subtable = 0;
  const encodingCount = view.getUint16(cmapOffset + 2);
  for (let i = 0; i < encodingCount; i += 1) {
    const record = cmapOffset + 4 + i * 8;
    const platform = view.getUint16(record);
    const encoding = view.getUint16(record + 2);
    if ((platform === 3 && encoding === 1) || platform === 0) {
      subtable = cmapOffset + view.getUint32(record + 4);
      break;
    }
  }
  if (!subtable) throw new Error('Pisava nima podtabele za Unicode');

  const format = view.getUint16(subtable);
  if (format !== 4) throw new Error(`Nepodprt format cmap: ${format}`);

  const segments = view.getUint16(subtable + 6) / 2;
  const endCodes = subtable + 14;
  const startCodes = endCodes + segments * 2 + 2;
  const idDeltas = startCodes + segments * 2;
  const idRangeOffsets = idDeltas + segments * 2;

  const covered = new Set<number>();
  for (let segment = 0; segment < segments; segment += 1) {
    const end = view.getUint16(endCodes + segment * 2);
    const start = view.getUint16(startCodes + segment * 2);
    const delta = view.getInt16(idDeltas + segment * 2);
    const rangeOffset = view.getUint16(idRangeOffsets + segment * 2);

    for (let code = start; code <= end && code !== 0xffff; code += 1) {
      let glyph: number;
      if (rangeOffset === 0) {
        glyph = (code + delta) & 0xffff;
      } else {
        const at = idRangeOffsets + segment * 2 + rangeOffset + (code - start) * 2;
        if (at + 1 >= bytes.length) continue;
        glyph = view.getUint16(at);
        if (glyph !== 0) glyph = (glyph + delta) & 0xffff;
      }
      if (glyph !== 0) covered.add(code);
    }
  }
  return covered;
}

const COVERED = supportedCodepoints(TITILLIUM_REGULAR_BASE64);
/** Znaki, ki so v izvorni kodi, v PDF pa ne pridejo — in tudi ne smejo. */
const IGNORED = new Set([...'\n\r\t'].map((char) => char.codePointAt(0) ?? 0));

/** Datoteke z besedili, ki lahko pristanejo v PDF-ju. */
const SOURCES = {
  ...import.meta.glob('../../content/**/*.ts', { query: '?raw', eager: true, import: 'default' }),
  ...import.meta.glob(['../config/**/*.ts', '!../config/**/*.test.ts'], {
    query: '?raw',
    eager: true,
    import: 'default',
  }),
  // Prodajna pot piše svoja besedila v src/lib/ in doslej ni bila pregledana: znak,
  // ki ga pisava nima in ga sanitizePdfText ne nadomesti, bi iz PDF tiho izginil.
  ...import.meta.glob(
    [
      './salesPlaybook.ts',
      './salesReport.ts',
      './salesReportHtml.ts',
      './pdfSales.ts',
      // Oznake nadaljevanja gredo prek scoreRows naravnost v tabelo razdelka 1.
      './followUp.ts',
      // Žetoni z roki in oznake grafičnih prikazov — nizi obeh gredo v izris PDF.
      './deadlines.ts',
      './reportVisuals.ts',
    ],
    { query: '?raw', eager: true, import: 'default' },
  ),
} as Record<string, string>;

describe('Vdelana pisava', () => {
  it('pokriva slovenske znake in evro', () => {
    // Nizov, zapisanih v src/lib/, spodnji pregled po content/ in config/ ne
    // zajame — znak, ki ga uporablja izris v pdf.ts, mora zato stati na tem
    // seznamu. Pisava npr. NIMA "•" (preverjeno), zato okvir "Česa ta znesek ne
    // vsebuje" našteva z "–".
    for (const char of 'čšžćđČŠŽ€–—…„"·×°') {
      expect(COVERED.has(char.codePointAt(0) ?? 0), `manjka ${char}`).toBe(true);
    }
  });

  it('nima znakov, ki jih zato zamenjuje sanitizePdfText', () => {
    for (const char of '−→≈') {
      expect(COVERED.has(char.codePointAt(0) ?? 0), `${char} je v pisavi`).toBe(false);
    }
  });
});

describe('sanitizePdfText', () => {
  it('zamenja znake, ki jih pisava nima', () => {
    expect(sanitizePdfText('(1 − delež)')).toBe('(1 - delež)');
    expect(sanitizePdfText('vprašanje → odgovor')).toBe('vprašanje -> odgovor');
    expect(sanitizePdfText('≈ 5 ur')).toBe('~ 5 ur');
  });

  it('pusti pri miru znake, ki jih pisava ima', () => {
    const untouched = 'Izmet — 12.400 EUR · marža × 0,25 „citat" … šumniki čžš';
    expect(sanitizePdfText(untouched)).toBe(untouched);
  });
});

describe('Besedila ne vsebujejo znakov, ki bi v PDF tiho izginili', () => {
  const files = Object.keys(SOURCES);

  it('pregleda vse datoteke z besedili', () => {
    // Če se mape preimenujejo, naj se to pozna tu in ne kot tiho prazen test.
    expect(files.length).toBeGreaterThan(20);
  });

  it.each(files)('%s', (file) => {
    const source: string = SOURCES[file] ?? '';
    const missing = [...new Set(source)].filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return !IGNORED.has(code) && !COVERED.has(code);
    });
    // Znak sme manjkati v pisavi, ČE ga sanitizePdfText zna zamenjati — takrat v
    // PDF pride nadomestek in ne luknja. Preverja se prav to, ne odsotnost znaka.
    const unhandled = missing.filter((char) => sanitizePdfText(char) === char);
    expect(unhandled).toEqual([]);
  });
});
