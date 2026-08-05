/**
 * Prenos datotek iz brskalnika, brez omrežnega klica.
 *
 * Izdelava dokumenta in njegova dostava sta namenoma ločeni: generatorji vrnejo
 * DownloadFile, prenese ga to mesto. Dokler je vsak dokument prenašal sam sebe
 * (jsPDF `doc.save()`), zaporedja ni bilo mogoče krmiliti — in prav to je bila
 * napaka, zaradi katere strankino poročilo ni pristalo v mapi za prenose.
 */

export interface DownloadFile {
  filename: string;
  blob: Blob;
}

/**
 * Čas, ki ga damo brskalniku, da blob prebere, preden ga sprostimo.
 *
 * Prejšnja različica je klicala URL.revokeObjectURL takoj za anchor.click().
 * Klik prenosa ne opravi sinhrono — brskalnik ga uvrsti v vrsto — zato je takojšen
 * preklic vir podatkov odstranil, še preden ga je prebral, in prenos je tiho
 * odpovedal. Deset sekund je krepko čez vsak realen čas branja, sprostitev pa se
 * vseeno zgodi.
 */
const REVOKE_DELAY_MS = 10_000;

/**
 * Razmik med zaporednimi prenosi.
 *
 * Brskalnik iz ene uporabnikove geste zanesljivo dovoli en prenos; naslednje bodisi
 * pogojuje z dovoljenjem ("Prenesti več datotek?") bodisi jih tiho zavrže. Trije
 * klici v isti niti so zato loterija. Z razmikom obravnava vsakega kot svoj dogodek.
 */
const DEFAULT_GAP_MS = 1200;

export function downloadFile(file: DownloadFile): void {
  const url = URL.createObjectURL(file.blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();

  window.setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, REVOKE_DELAY_MS);
}

/**
 * Prenese datoteke po vrsti, z razmikom med njimi.
 *
 * Vrstni red je pomemben: prvi prenos je edini, ki ga brskalnik dovoli brez
 * vprašanja, zato mora biti na prvem mestu tista datoteka, ki je nujna — strankino
 * poročilo. Klicatelj to zagotovi z vrstnim redom seznama.
 */
export async function downloadSequentially(
  files: DownloadFile[],
  gapMs: number = DEFAULT_GAP_MS,
): Promise<void> {
  for (const [index, file] of files.entries()) {
    if (index > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, gapMs));
    }
    downloadFile(file);
  }
}

/** Prenos besedilne vsebine — ovoj okoli downloadFile, da pot do prenosa ostane ena sama. */
export function triggerDownload(filename: string, content: string, mimeType: string): void {
  downloadFile({ filename, blob: new Blob([content], { type: mimeType }) });
}

/**
 * Ime podjetja, primerno za ime datoteke: šumniki v osnovne črke, vse ostalo v
 * vezaje. Brez tega bi "D.O.O. Kovinar & sin" dal ime, ki ga Windows zavrne.
 */
export function slugify(value: string): string {
  // NFD razstavi "č" na "c" + ločeno strešico; ta se nato pobriše po razponu
  // združevalnih znamenj. "đ" ni razstavljivo, zato ga je treba nasloviti posebej.
  const folded = value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd');

  return folded
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}
