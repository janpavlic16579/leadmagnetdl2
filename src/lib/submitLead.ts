import type { LeadExportRecord } from './exportRecord';

/**
 * Dostava leada na konfigurabilen webhook — zapiranje kalibracijske zanke.
 *
 * Vse konstante izračuna so označene "preveriti po prvih ~50 vnosih", a aplikacija
 * brez backenda ni imela poti, po kateri bi en sam vnos sploh prišel do Datalaba:
 * exportRecord je bil mrtva koda, prodajna priprava pa se je prenesla na napravo
 * STRANKE. Ta modul je najmanjša možna pot ven: en POST na naslov, ki ga določi
 * gostitelj ob buildu.
 *
 * Brez nastavljenega naslova se vedenje ne spremeni — orodje ostane samostojno
 * in vse konča v lokalno prenesenih datotekah, kot doslej.
 */

export interface LeadSubmission {
  record: LeadExportRecord;
  /** Prodajna priprava kot samostojen HTML — ob uspešni dostavi se stranki NE prenese. */
  salesReportHtml: string;
}

/**
 * Naslov webhooka iz build okolja (.env: VITE_LEAD_WEBHOOK_URL). Null pomeni
 * "ni konfigurirano" in klicatelj obdrži dosedanje vedenje.
 */
export function leadWebhookUrl(env: Record<string, unknown> = import.meta.env): string | null {
  const url = env.VITE_LEAD_WEBHOOK_URL;
  if (typeof url !== 'string' || url.trim() === '') return null;
  return url.trim();
}

/**
 * Koliko časa čakamo webhook, preden odnehamo.
 *
 * Brez omejitve je viseč strežnik pomenil, da obiskovalec gleda vrteči se gumb,
 * dokler ne obupa — njegovega poročila tedaj ni prenesel nihče. Osem sekund je
 * krepko čez vsak zdrav odziv; ob prekoračitvi lead pade v lokalno pot.
 */
const REQUEST_TIMEOUT_MS = 8_000;

/**
 * Pošlje zapis. Nikoli ne vrže: napaka omrežja ali strežnika ne sme pokvariti
 * prenosa strankinega poročila, zato se dostava le sporoči kot false in klicatelj
 * pade nazaj na lokalne prenose.
 */
export async function submitLead(
  submission: LeadSubmission,
  url: string,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
      // Zahteva preživi zaprtje zavihka: obiskovalec po prenosu poročila pogosto
      // zapre stran, preden strežnik odgovori, in lead je bil s tem izgubljen.
      keepalive: true,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      console.warn(`Oddaja leada ni uspela: ${response.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn('Oddaja leada ni uspela:', error);
    return false;
  }
}
