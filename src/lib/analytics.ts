import {
  createFunnelQueue,
  describeVisit,
  newVisitId,
  sendBeaconOrFetch,
  type FunnelQueue,
} from './funnel';
import { leadWebhookUrl } from './webhookUrl';

/**
 * Merjenje lijaka.
 *
 * Vprašalnik ima deset korakov, o odpadanju pa dolgo ni bilo znano nič: ne kje
 * obiskovalci odnehajo, ne katera dejavnost pride do rezultata, ne kolikšen
 * delež jih odda e-naslov. Vsaka razprava o skrajšanju vprašalnika je bila zato
 * razprava o mnenjih.
 *
 * Vsak dogodek gre na dve mesti:
 *
 * - v `window.dataLayer` (Google Tag Manager) — za primer, da bi GTM na strani
 *   kdaj bil; aplikacija ga sama ne naloži;
 * - na webhook (lib/funnel.ts), kadar je `VITE_LEAD_WEBHOOK_URL` nastavljen —
 *   isti naslov kot za oddaje; sprejemnik iz dogodkov sestavi list "Lijak".
 *
 * Aplikacija ne naloži nobene zunanje skripte in ne postavi nobenega piškotka;
 * id obiska živi samo v pomnilniku strani (lib/funnel.ts, odločitev 1).
 *
 * OSEBNIH PODATKOV TU NI. Ne e-naslova, ne imena podjetja, ne vnesenih zneskov;
 * samo korak, segment in razredi (oznaka zanesljivosti, število področij). Kar
 * potrebuje prodaja, potuje po webhooku s privolitvijo — ne po analitiki.
 */

interface DataLayerWindow extends Window {
  dataLayer?: Record<string, unknown>[];
}

export type AnalyticsEvent =
  /**
   * Prikaz koraka — osnova vsakega lijaka. Nosi `stepIndex`/`stepsTotal` (isto
   * štetje kot "Korak N od M" na zaslonu) in pri vnosih `moduleId`: korak z
   * vnosi je ena stran na področje in brez id-ja ni videti, katero področje
   * ljudi ustavi.
   */
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
   * ne prenese nič). Odkar gre poročilo stranki po e-pošti, je gumb REZERVA:
   * `reason` pove, zakaj je bil sploh na voljo (no_webhook, delivery_failed,
   * not_sent, unknown, internal), zato dogodek meri odpovedi pošte, ne zanimanja.
   */
  | 'lm10_report_download'
  /** Sprejemnik je strankino poročilo poslal na e-naslov iz obrazca. */
  | 'lm10_report_emailed'
  /**
   * Sprejemnik je zapis sprejel, poročila stranki pa NI poslal (`reason`: razlog
   * sprejemnika — no_attachment, send_failed …). Stranka ima tedaj na rezultatih
   * gumb za prenos. Par z lm10_report_emailed, kot lm10_delivery_ok/failed.
   */
  | 'lm10_report_email_failed'
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

/**
 * Vrsta za webhook — nastane ob prvem dogodku in živi do konca strani.
 * `undefined` = še ni odločeno, `null` = brez webhooka ali brez brskalnika
 * (vitest teče v node): tedaj ostane samo dataLayer.
 */
let queue: FunnelQueue | null | undefined;

function funnelQueue(): FunnelQueue | null {
  if (queue !== undefined) return queue;
  queue = null;
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined') return null;
    const url = leadWebhookUrl();
    if (!url) return null;

    const created = createFunnelQueue({
      visit: describeVisit({
        id: newVisitId(),
        startedAt: new Date(),
        search: window.location.search,
        // Razred zaslona in ne naprava: dovolj za vprašanje "ali telefon odpada
        // drugje kot namizje", brez branja user agenta.
        narrowScreen: window.matchMedia('(max-width: 768px)').matches,
      }),
      send: (body) => sendBeaconOrFetch(url, body),
    });
    // Ob skritju zavihka (menjava aplikacije na telefonu, zaprtje) gre vse, kar
    // čaka, takoj — odlog četrt sekunde bi sicer pojedel prav zadnji korak, na
    // katerem je obiskovalec odnehal.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') created.flush();
    });
    window.addEventListener('pagehide', () => created.flush());
    queue = created;
  } catch {
    queue = null;
  }
  return queue;
}

export function track(event: AnalyticsEvent, props: Record<string, string | number> = {}): void {
  try {
    const target = window as DataLayerWindow;
    target.dataLayer = target.dataLayer ?? [];
    target.dataLayer.push({ event, ...props });
  } catch {
    // Merjenje ne sme nikoli ustaviti vprašalnika.
  }
  try {
    funnelQueue()?.record(event, props);
  } catch {
    // Isto pravilo za webhook.
  }
}
