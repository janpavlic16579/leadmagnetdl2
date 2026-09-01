import { CSV_COLUMNS, buildCsvRow, type LeadExportRecord } from './exportRecord';

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
 *
 * Sprejemnik, za katerega je oblika ubrana, je Apps Script pri Google Sheetu
 * (`tools/google-sheet/`). Od tod dve odločitvi, ki bi bili sicer nenavadni:
 * glava in vrstica CSV potujeta ZRAVEN zapisa (glej `sheet` spodaj), tip vsebine
 * pa je `text/plain` (glej POST).
 */

export interface LeadSubmission {
  record: LeadExportRecord;
  /** Prodajna priprava kot samostojen HTML — ob uspešni dostavi se stranki NE prenese. */
  salesReportHtml: string;
}

/**
 * Kar gre dejansko po žici. Zapis ostane nedotaknjen — `sheet` je dodatek zanj,
 * ki ga sprejemnik lahko prezre.
 */
export interface LeadWirePayload extends LeadSubmission {
  /**
   * Ista glava in ista vrstica kot pri ročnem izvozu CSV.
   *
   * Sprejemnik s tem ne pozna nobenega polja izračuna: vrstico samo pripne. Če bi
   * stolpce sestavljal sam, bi bila preslikava podvojena — enkrat v
   * `exportRecord.ts` (testirano) in enkrat v Apps Scriptu (netestirano, urejano
   * v brskalniku). Vsak nov stolpec bi bilo treba dodati na obeh mestih, sicer bi
   * se podatki v preglednici tiho zamaknili.
   */
  sheet: {
    columns: readonly string[];
    row: string[];
  };
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
 * Meja, do katere sme zahteva uporabiti `keepalive`.
 *
 * `keepalive` je tisto, kar ohrani POST pri življenju, ko obiskovalec po prenosu
 * poročila zapre zavihek — brez njega je lead izgubljen. Cena: specifikacija
 * omejuje telo takih zahtev na 64 KiB, brskalnik pa večjo zavrne, ne skrajša.
 * Priprava v HTML je pri običajnem izračunu okoli 10 KB, pri razvejanem lahko
 * bistveno več; ob prekoračitvi je bolje poslati brez `keepalive` (lead pride,
 * če zavihek ostane odprt) kot ne poslati nič.
 */
const KEEPALIVE_MAX_BYTES = 60_000;

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
    const payload: LeadWirePayload = {
      ...submission,
      sheet: { columns: CSV_COLUMNS, row: buildCsvRow(submission.record) },
    };
    const body = JSON.stringify(payload);

    const response = await fetchImpl(url, {
      method: 'POST',
      // NE `application/json`: ta tip sproži predhodno zahtevo CORS (OPTIONS),
      // na katero Apps Script ne zna odgovoriti — dostava bi padla, še preden bi
      // karkoli odšlo. `text/plain` je "enostavna" zahteva brez predhodne. Telo
      // ostane JSON; sprejemnik ga prebere kot niz in razčleni sam.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
      // Zahteva preživi zaprtje zavihka: obiskovalec po prenosu poročila pogosto
      // zapre stran, preden strežnik odgovori, in lead je bil s tem izgubljen.
      keepalive: new TextEncoder().encode(body).length <= KEEPALIVE_MAX_BYTES,
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
