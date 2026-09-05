import { CSV_COLUMNS, buildRowValues, type LeadExportRecord } from './exportRecord';
import type { DownloadFile } from './download';

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

/**
 * Datoteka za prilogo e-obvestila. Base64 zato, ker telo potuje kot JSON v
 * `text/plain` (glej POST) in binarnega dela ne more nositi drugače; sprejemnik
 * jo dekodira z `Utilities.base64Decode`.
 */
export interface LeadAttachment {
  filename: string;
  contentType: 'application/pdf';
  base64: string;
}

export interface LeadSubmission {
  record: LeadExportRecord;
  /**
   * Prodajna priprava kot samostojen HTML — ob uspešni dostavi se stranki NE
   * prenese. Prazen niz, kadar priprava ni nastala (lib/deliverLead.ts):
   * sprejemnik jo tedaj preskoči, zapis pa vseeno pripne.
   */
  salesReportHtml: string;
  /**
   * PDF-ja za prilogi obvestila: najprej poročilo za stranko, nato priprava na
   * pogovor (lib/deliverLead.ts). Neobvezno — sprejemnik brez njiju dela naprej,
   * starejši sprejemnik ju prezre.
   */
  attachments?: LeadAttachment[];
}

/**
 * Kar gre dejansko po žici. Zapis ostane nedotaknjen — `sheet` je dodatek zanj,
 * ki ga sprejemnik lahko prezre.
 */
export interface LeadWirePayload extends LeadSubmission {
  /**
   * Ista glava in ista vrstica kot pri ročnem izvozu CSV, le brez ubežanja —
   * to pripada obliki CSV, ne podatku (celica preglednice narekovajev ne
   * potrebuje in jih je prikazala kot del besedila).
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
 * Koliko časa čakamo webhook, preden odnehamo — osnova, h kateri se prišteje
 * čas za prenos telesa (requestTimeoutMs).
 *
 * Brez omejitve je viseč strežnik pomenil, da obiskovalec gleda vrteči se gumb,
 * dokler ne obupa. Osem sekund je krepko čez vsak zdrav odziv na majhno telo; s
 * prilogama (≈ 175 kB) pa gre na počasni mobilni povezavi nekaj sekund samo za
 * prenos, preden strežnik telo sploh dobi. Prekoračitev ni le čas: dostava se šteje kot
 * neuspela in prodajna priprava gre stranki (deliverLead.ts), zato je daljši rok
 * cenejši od lažnega padca.
 */
const REQUEST_TIMEOUT_MS = 8_000;
/** Počasna mobilna povezava, s katero računamo prenos telesa: ~50 kB/s. */
const SLOW_UPLINK_BYTES_PER_MS = 50;

/** Rok zahteve glede na velikost telesa: samo HTML ≈ 8 s, s prilogama ≈ 12 s. */
export function requestTimeoutMs(bodyBytes: number): number {
  return REQUEST_TIMEOUT_MS + Math.ceil(bodyBytes / SLOW_UPLINK_BYTES_PER_MS);
}

/**
 * Meja, do katere sme zahteva uporabiti `keepalive`.
 *
 * `keepalive` ohrani POST pri življenju, ko obiskovalec zapre zavihek, preden
 * strežnik odgovori — brez njega je lead izgubljen. Cena: specifikacija omejuje
 * telo takih zahtev na 64 KiB, brskalnik pa večjo zavrne, ne skrajša. S
 * prilogama (≈ 175 kB) meja pade vedno in to je sprejeto: ob oddaji se nič ne
 * prenese, obiskovalec čaka na rezultate ob zasedenem gumbu in zavihek sredi
 * čakanja zapre le redko. Brez prilog (PDF ni nastal) ostane vedenje kot prej:
 * bolje poslati brez `keepalive` kot ne poslati nič.
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
      sheet: { columns: CSV_COLUMNS, row: buildRowValues(submission.record) },
    };
    const body = JSON.stringify(payload);
    const bodyBytes = new TextEncoder().encode(body).length;

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
      keepalive: bodyBytes <= KEEPALIVE_MAX_BYTES,
      signal: AbortSignal.timeout(requestTimeoutMs(bodyBytes)),
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

/**
 * Pretvori datoteko generatorja v prilogo za žico.
 *
 * Brez FileReaderja: tega v node (vitest) ni, `Blob.arrayBuffer` in `btoa` pa
 * sta v brskalniku in v node enaka. Binarni niz nastaja po kosih, ker
 * `String.fromCharCode(...bytes)` z več sto tisoč argumenti preseže mejo sklada.
 */
export async function attachmentFromFile(file: DownloadFile): Promise<LeadAttachment> {
  const bytes = new Uint8Array(await file.blob.arrayBuffer());
  const CHUNK = 0x8000;
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + CHUNK));
  }
  return { filename: file.filename, contentType: 'application/pdf', base64: btoa(binary) };
}
