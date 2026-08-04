export type Theme = 'light' | 'dark';

/**
 * Izbira teme je uporabnikova nastavitev vmesnika, zato jo hranimo lokalno.
 * Ni sledilni piškotek — je funkcionalna preferenca, ki ne zapusti naprave.
 */
export const THEME_STORAGE_KEY = 'datalab-kalkulator-tema';

/**
 * Privzeto je svetla tema, tudi če ima obiskovalec v sistemu vklopljen temni način.
 * Temno dobi šele, ko jo sam izbere — to je zavestna odločitev, ne opustitev.
 */
export const DEFAULT_THEME: Theme = 'light';

export function readStoredTheme(): Theme {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : DEFAULT_THEME;
  } catch {
    // Zasebno brskanje ali blokiran localStorage — tiho pademo na privzeto temo.
    return DEFAULT_THEME;
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Shranjevanje ni nujno za delovanje — tema velja vsaj za to sejo.
  }
}
