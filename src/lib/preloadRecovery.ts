/**
 * Osvežitev strani ob padlem kosu kode.
 *
 * Kosi (jsPDF, dostava, graf) se naložijo šele pozno v obisku — po desetih
 * minutah izpolnjevanja, ob oddaji ali na rezultatih. Vsaka objava zamenja
 * zgoščena imena datotek; kjer strežnik stare izbriše, obiskovalec sredi seje
 * dobi 404 na kos, ki ga zahteva njegov stari index.html. Brskalnik si padli
 * uvoz zapomni, zato "Poskusite znova" ne pomaga; pomaga samo osvežitev, ki
 * prinese nov index.html z novimi imeni. Napredek jo preživi
 * (lib/progressStorage.ts), oddaja tudi, kontakt ne.
 *
 * Vite ob padlem nalaganju kosa sproži dogodek `vite:preloadError` — za
 * dinamični uvoz in za njegove odvisnosti enako. Tu se stran ob njem osveži,
 * a NAJVEČ ENKRAT NA MINUTO: če kosa ni tudi po osvežitvi (objava na pol,
 * strežnik v okvari), bi se sicer vrtela v zanki. Drugi padec v tem oknu gre
 * naprej — do meje napak (components/ErrorBoundary.tsx), ki ponudi gumb.
 */

export const RELOAD_STORAGE_KEY = 'lm10-osvezitev-kosa';
const RELOAD_WINDOW_MS = 60_000;

export interface ReloadStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * Ali naj se stran ob padlem kosu osveži. Čista funkcija: shrambo in čas
 * poda klicatelj, test ju ponaredi.
 *
 * Brez shrambe (zasebno brskanje, blokiran sessionStorage) vrne `false`: brez
 * varovala pred zanko je prazna stran z gumbom za osvežitev varnejša od
 * samodejnega osveževanja v nedogled.
 */
export function shouldReloadAfterPreloadError(storage: ReloadStorage | null, now: number): boolean {
  if (!storage) return false;
  try {
    const last = Number(storage.getItem(RELOAD_STORAGE_KEY));
    if (Number.isFinite(last) && last > 0 && now - last < RELOAD_WINDOW_MS) return false;
    storage.setItem(RELOAD_STORAGE_KEY, String(now));
    return true;
  } catch {
    return false;
  }
}

/** Priklopi poslušalca na okno; enkrat, ob zagonu (main.tsx). */
export function installPreloadRecovery(target: Window = window): void {
  target.addEventListener('vite:preloadError', () => {
    let storage: ReloadStorage | null = null;
    try {
      storage = target.sessionStorage;
    } catch {
      storage = null;
    }
    if (shouldReloadAfterPreloadError(storage, Date.now())) target.location.reload();
  });
}
