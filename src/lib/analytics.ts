/**
 * Merjenje lijaka.
 *
 * Vprašalnik ima deset korakov, o odpadanju pa doslej ni bilo znano nič: ne kje
 * obiskovalci odnehajo, ne katera dejavnost pride do rezultata, ne kolikšen
 * delež jih odda e-naslov. Vsaka razprava o skrajšanju vprašalnika je bila zato
 * razprava o mnenjih.
 *
 * Dogodki gredo v `window.dataLayer` (Google Tag Manager). Aplikacija ne naloži
 * nobene zunanje skripte in ne postavi nobenega piškotka — če GTM na strani ni
 * nameščen, se dogodki tiho naberejo v polju in nikamor ne odidejo.
 *
 * OSEBNIH PODATKOV TU NI. Ne e-naslova, ne imena podjetja, ne vnesenih zneskov;
 * samo korak, segment in razredi (oznaka zanesljivosti, število področij). Kar
 * potrebuje prodaja, potuje po webhooku s privolitvijo — ne po analitiki.
 */

interface DataLayerWindow extends Window {
  dataLayer?: Record<string, unknown>[];
}

export type AnalyticsEvent =
  /** Prikaz koraka — osnova vsakega lijaka. */
  | 'lm10_step_view'
  /** Izbrana dejavnost (in s tem segment). */
  | 'lm10_industry_selected'
  /** Zapuščena triaža: koliko področij gre v podroben izračun. */
  | 'lm10_triage_done'
  /** Rezultat je na zaslonu — konec brezplačnega dela. */
  | 'lm10_results_view'
  /** Obiskovalec je odprl obrazec za PDF. */
  | 'lm10_email_gate_view'
  /** Obrazec oddan. */
  | 'lm10_lead_submitted'
  /** Ponovni prenos poročila — pove, kako pogosto samodejni prenos odpove. */
  | 'lm10_report_redownload';

export function track(event: AnalyticsEvent, props: Record<string, string | number> = {}): void {
  try {
    const target = window as DataLayerWindow;
    target.dataLayer = target.dataLayer ?? [];
    target.dataLayer.push({ event, ...props });
  } catch {
    // Merjenje ne sme nikoli ustaviti vprašalnika.
  }
}
