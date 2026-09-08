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
 * Komu je priloga namenjena — po tem sprejemnik izbere, kaj gre stranki po
 * e-pošti. 'customer' je poročilo za stranko, 'sales' priprava na pogovor, ki
 * stranki ne gre nikoli. Sprejemnik odloča po tej oznaki in ne po imenu
 * datoteke (ime je le rezerva za starejši build brez oznake).
 */
export type LeadAttachmentAudience = 'customer' | 'sales';

/**
 * Datoteka za prilogo e-obvestila. Base64 zato, ker telo potuje kot JSON v
 * `text/plain` (glej POST) in binarnega dela ne more nositi drugače; sprejemnik
 * jo dekodira z `Utilities.base64Decode`.
 */
export interface LeadAttachment {
  filename: string;
  contentType: 'application/pdf';
  base64: string;
  audience: LeadAttachmentAudience;
}

/**
 * Zakaj sprejemnik poročila stranki ni poslal SAM — ključi iz Koda.gs
 * (`RAZLOGI_POROCILA_STRANKI`); 'unknown' = odgovor tega ne pove (star
 * sprejemnik, neberljivo telo, neznan ključ).
 *
 * 'queued' je poseben: ni odpoved, ampak "poslal bo ActiveCampaign v nekaj
 * minutah" (sprejemnik v načinu POSTA_PREK_AC). Rezultati ob njem povedo, da je
 * poročilo na poti, in OBDRŽIJO gumb za prenos — potrditve ob oddaji ni.
 * 'unsubscribed' pa je odpoved: kontakt se je v CRM odjavil in mu ta pot ne
 * more pisati.
 */
export type CustomerReportReason =
  | 'disabled'
  | 'no_address'
  | 'invalid_address'
  | 'no_attachment'
  | 'send_failed'
  | 'queued'
  | 'unsubscribed'
  | 'unknown';

export type CustomerReportOutcome = { sent: true } | { sent: false; reason: CustomerReportReason };

export interface SubmitLeadResult {
  /** Zapis je prišel do sprejemnika in vrstica je zapisana. */
  delivered: boolean;
  /** Ali je sprejemnik strankino poročilo poslal na e-naslov iz obrazca. */
  customerReport: CustomerReportOutcome;
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
   * pogovor (lib/deliverLead.ts). Strankino sprejemnik pošlje še stranki — po
   * oznaki `audience`. Neobvezno — sprejemnik brez njiju dela naprej (stranki
   * tedaj ne pošlje nič in to pove v odgovoru), starejši sprejemnik ju prezre.
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
 * Naslov webhooka — živi v lib/webhookUrl.ts, ker ga potrebuje tudi merjenje
 * lijaka v glavnem svežnju. Tu ostane izvožen, da klicatelji dostave (in test)
 * ne poznajo te delitve.
 */
export { leadWebhookUrl } from './webhookUrl';

/**
 * Koliko časa čakamo webhook, preden odnehamo — osnova, h kateri se prišteje
 * čas za prenos telesa (requestTimeoutMs).
 *
 * Brez omejitve je viseč strežnik pomenil, da obiskovalec gleda vrteči se gumb,
 * dokler ne obupa. Deset sekund je krepko čez vsak zdrav odziv na majhno telo; s
 * prilogama (≈ 175 kB) pa gre na počasni mobilni povezavi nekaj sekund samo za
 * prenos, preden strežnik telo sploh dobi. Prekoračitev ni le čas: dostava se šteje kot
 * neuspela in prodajna priprava gre stranki (deliverLead.ts), zato je daljši rok
 * cenejši od lažnega padca. Z osmih na deset sekund, odkar sprejemnik pred
 * odgovorom opravi še delo za obe sporočili — shrani oba PDF-ja na Drive in
 * pokliče CRM (v načinu MailApp namesto tega pošlje dve sporočili): lažen padec
 * zdaj pomeni tudi gumb za prenos ob pošti, ki je že na poti.
 */
const REQUEST_TIMEOUT_MS = 10_000;
/** Počasna mobilna povezava, s katero računamo prenos telesa: ~50 kB/s. */
const SLOW_UPLINK_BYTES_PER_MS = 50;

/** Rok zahteve glede na velikost telesa: samo HTML ≈ 10 s, s prilogama ≈ 13,5 s. */
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

const UNKNOWN_OUTCOME: CustomerReportOutcome = { sent: false, reason: 'unknown' };
const CUSTOMER_REPORT_REASONS: readonly CustomerReportReason[] = [
  'disabled',
  'no_address',
  'invalid_address',
  'no_attachment',
  'send_failed',
  'queued',
  'unsubscribed',
];

/**
 * Izid pošte stranki iz telesa odgovora `{ ok, customerReport: { sent, reason } }`.
 * Vse, kar ni te oblike — odgovor starejšega sprejemnika `{ ok: true }`, neznan
 * ključ razloga — je 'unknown': o pošti ni znano nič in rezultati ponudijo prenos.
 */
export function parseCustomerReport(body: unknown): CustomerReportOutcome {
  if (typeof body !== 'object' || body === null) return UNKNOWN_OUTCOME;
  const report = (body as { customerReport?: unknown }).customerReport;
  if (typeof report !== 'object' || report === null) return UNKNOWN_OUTCOME;
  const { sent, reason } = report as { sent?: unknown; reason?: unknown };
  if (sent === true) return { sent: true };
  const known = CUSTOMER_REPORT_REASONS.find((candidate) => candidate === reason);
  return { sent: false, reason: known ?? 'unknown' };
}

/**
 * Pošlje zapis. Nikoli ne vrže: napaka omrežja ali strežnika ne sme pokvariti
 * prikaza rezultatov, zato se dostava le sporoči kot neuspela in klicatelj pade
 * nazaj na rezervne poti (prenosi na rezultatih).
 */
export async function submitLead(
  submission: LeadSubmission,
  url: string,
  fetchImpl: typeof fetch = fetch,
): Promise<SubmitLeadResult> {
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
      return { delivered: false, customerReport: UNKNOWN_OUTCOME };
    }
    return readReceipt(response);
  } catch (error) {
    console.warn('Oddaja leada ni uspela:', error);
    return { delivered: false, customerReport: UNKNOWN_OUTCOME };
  }
}

/**
 * Telo odgovora ob statusu 200.
 *
 * NEBERLJIVO telo (odgovor brez `text`, prekinjen tok) ne spremeni ničesar:
 * dostava velja po statusu kot doslej, o pošti stranki pa ni znano nič.
 * BERLJIVO telo, ki ni JSON z `ok: true`, pa je Googlova stran z napako: Apps
 * Script napako skripte (žeton, prazno telo, nezapisana vrstica) vrne kot HTML s
 * statusom 200 — status tu laže, telo ne. Dokler se je gledal samo status, je
 * taka oddaja štela kot uspešna in priprava ni šla ne stranki ne na Drive.
 */
async function readReceipt(response: Response): Promise<SubmitLeadResult> {
  let text: string;
  try {
    if (typeof response.text !== 'function') throw new Error('odgovor brez telesa');
    text = await response.text();
  } catch {
    return { delivered: true, customerReport: UNKNOWN_OUTCOME };
  }

  let body: unknown;
  try {
    body = JSON.parse(text) as unknown;
  } catch {
    console.warn('Sprejemnik ni odgovoril z JSON — dostava šteje kot neuspela:', text.slice(0, 200));
    return { delivered: false, customerReport: UNKNOWN_OUTCOME };
  }
  const ok = typeof body === 'object' && body !== null && (body as { ok?: unknown }).ok === true;
  if (!ok) {
    console.warn('Sprejemnik dostave ni potrdil:', text.slice(0, 200));
    return { delivered: false, customerReport: UNKNOWN_OUTCOME };
  }
  return { delivered: true, customerReport: parseCustomerReport(body) };
}

/**
 * Pretvori datoteko generatorja v prilogo za žico.
 *
 * Brez FileReaderja: tega v node (vitest) ni, `Blob.arrayBuffer` in `btoa` pa
 * sta v brskalniku in v node enaka. Binarni niz nastaja po kosih, ker
 * `String.fromCharCode(...bytes)` z več sto tisoč argumenti preseže mejo sklada.
 */
export async function attachmentFromFile(
  file: DownloadFile,
  audience: LeadAttachmentAudience,
): Promise<LeadAttachment> {
  const bytes = new Uint8Array(await file.blob.arrayBuffer());
  const CHUNK = 0x8000;
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + CHUNK));
  }
  return { filename: file.filename, contentType: 'application/pdf', base64: btoa(binary), audience };
}
