/**
 * SVG -> PNG za jsPDF.
 *
 * jsPDF pozna PNG, JPEG in še nekaj rastrskih zapisov, SVG-ja pa ne; `svg2pdf`
 * ali `canvg` v odvisnosti nismo dodajali zaradi enega logotipa. Zato ga narišemo
 * na canvas in oddamo kot PNG.
 *
 * Vhod je IZVORNO BESEDILO in ne naslov: data URL, sestavljen tu, ne potrebuje
 * omrežja (poročilo lahko nastane tudi offline) in ne obhoda z `BASE_URL`. Ker je
 * data URL istega izvora, canvas ni onesnažen in `toDataURL` deluje.
 *
 * Izid ima namenoma isto obliko kot `loadImage` iz pdfKit.ts — klicni mesti v
 * obeh poročilih se s tem ne spremenita.
 */

/**
 * Koliko gostejši je raster od končnega odtisa. Logotip je v glavi širok ~33 mm;
 * pri 1× bi bil na 300-dpi tiskalniku viden kot mehak, pri 4× je ostrina zunaj
 * zaznave, datoteka pa zraste za nekaj deset kilobajtov — enkrat na dokument.
 */
const PRINT_SCALE = 4;

/**
 * Nominalna širina logotipa v glavi poročila, v CSS-pikslih.
 *
 * Glava ga izriše 9 mm visoko, širino pa izpelje iz razmerja sredstva (230:63),
 * kar da ~33 mm ≈ 124 px. Skupna konstanta, ker jo uporabljata oba dokumenta in
 * bi se razhajajoči številki poznali kot razlika v ostrini.
 */
export const HEADER_LOGO_RASTER_WIDTH_PX = 124;

export async function rasterizeSvg(
  source: string,
  cssPixelWidth: number,
): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('svg decode failed'));
      img.src = svgUrl;
    });

    // Razmerje vzamemo iz same datoteke (vsi logotipi so 230x63), da klicatelju
    // ni treba poznati mer sredstva — enako kot pri loadImage.
    const ratio = image.naturalHeight > 0 ? image.naturalWidth / image.naturalHeight : 1;
    const width = Math.round(cssPixelWidth * PRINT_SCALE);
    const height = Math.round(width / ratio);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(image, 0, 0, width, height);

    return { dataUrl: canvas.toDataURL('image/png'), width, height };
  } catch {
    // Enako varovalo kot pri loadImage: logotip je okras in ne sme podreti
    // generacije dokumenta. V testih (environment: 'node') ni ne Image ne canvas,
    // zato tu pot vedno konča — poročilo nastane brez logotipa in to je v redu.
    return null;
  }
}
