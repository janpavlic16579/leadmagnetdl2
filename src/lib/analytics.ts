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
  /** Rezultat je na zaslonu — po oddaji obrazca. */
  | 'lm10_results_view'
  /** Obiskovalec je prišel do obrazca (naprej iz vnosov) — imenovalec deleža oddaj. */
  | 'lm10_email_gate_view'
  /** Obrazec oddan. */
  | 'lm10_lead_submitted'
  /**
   * Prenos strankinega poročila z rezultatov. Vsak prenos je ročen (ob oddaji se
   * ne prenese nič), zato dogodek pove, koliko obiskovalcev poročilo sploh vzame.
   */
  | 'lm10_report_download'
  /** Zaključena finančna osnova — vir vsake postavke (vneseno/povprečje/razpon/prazno). */
  | 'lm10_cost_basis_done'
  /** Validacija je ustavila oddajo — katero polje ustavi največ ljudi. */
  | 'lm10_form_blocked'
  /** Lead je prišel do prodaje (webhook uspel). */
  | 'lm10_delivery_ok'
  /**
   * Lead NI prišel do prodaje: webhook padel, vrnil napako ali sploh ni
   * nastavljen. lm10_lead_submitted se namerno sproži pred dostavo — brez tega
   * para se konverzije štejejo tudi takrat, ko do prodaje niso prišle.
   */
  | 'lm10_delivery_failed';

export function track(event: AnalyticsEvent, props: Record<string, string | number> = {}): void {
  try {
    const target = window as DataLayerWindow;
    target.dataLayer = target.dataLayer ?? [];
    target.dataLayer.push({ event, ...props });
  } catch {
    // Merjenje ne sme nikoli ustaviti vprašalnika.
  }
}
