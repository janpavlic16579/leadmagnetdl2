export type Theme = 'light' | 'dark';

/**
 * Izbira teme je uporabnikova nastavitev vmesnika, zato jo hranimo lokalno.
 * Ni sledilni piškotek — je funkcionalna preferenca, ki ne zapusti naprave.
 */
export const THEME_STORAGE_KEY = 'datalab-kalkulator-tema';

/** Zadnja varovalka, kadar sistemske nastavitve ni mogoče prebrati (starejši brskalnik). */
export const DEFAULT_THEME: Theme = 'light';

/** Sistemska nastavitev — privzetek, dokler obiskovalec teme ne izbere sam. */
function systemTheme(): Theme {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return DEFAULT_THEME;
  }
}

export function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    // Shranjena vrednost je ročna izbira in ima vedno prednost pred sistemsko.
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // Zasebno brskanje ali blokiran localStorage — sistemska nastavitev odloči namesto tega.
  }
  return systemTheme();
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Shranjevanje ni nujno za delovanje — tema velja vsaj za to sejo.
  }
}
