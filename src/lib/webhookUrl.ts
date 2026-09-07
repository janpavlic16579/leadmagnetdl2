/**
 * Naslov webhooka iz build okolja (.env: VITE_LEAD_WEBHOOK_URL). Null pomeni
 * "ni konfigurirano" in klicatelj obdrži dosedanje vedenje.
 *
 * Isti naslov uporabljata dve poti: oddaja leada (lib/submitLead.ts) in dogodki
 * lijaka (lib/analytics.ts). Sprejemnik ju loči po obliki telesa. Ena
 * spremenljivka in ne dve: kdor nastavi zbiralnik leadov, s tem nastavi tudi
 * merjenje — brez drugega koraka, ki bi ga bilo mogoče pozabiti.
 *
 * V svoji datoteki zato, ker lib/analytics.ts teče v glavnem svežnju od prvega
 * izrisa, submitLead pa se naloži šele ob oddaji (skupaj z izvoznim zapisom):
 * uvoz iz submitLead bi vse to potegnil v prvi prenos.
 */
export function leadWebhookUrl(env: Record<string, unknown> = import.meta.env): string | null {
  const url = env.VITE_LEAD_WEBHOOK_URL;
  if (typeof url !== 'string' || url.trim() === '') return null;
  return url.trim();
}
