/**
 * Zbiralnik dogodkov lijaka — pot iz brskalnika do lista "Dogodki".
 *
 * Dogodki iz lib/analytics.ts so doslej končali v `window.dataLayer`, GTM pa na
 * strani ni nameščen: nabrali so se v polju in odšli nikamor. O odpadanju po
 * korakih zato ni bilo znano nič in vsaka razprava o krajšanju vprašalnika je
 * bila razprava o mnenjih.
 *
 * Ta modul jih pošlje na isti webhook kot oddaje (lib/webhookUrl.ts); sprejemnik
 * (tools/google-sheet/Koda.gs, `zapisiDogodke`) jih pripne na list, dnevna ura
 * pa iz njih sestavi list "Lijak". Brez nastavljenega naslova se ne zgodi nič.
 *
 * TRI ODLOČITVE, ki so videti kot pomanjkljivosti in niso:
 *
 * 1. ID OBISKA ŽIVI SAMO V POMNILNIKU STRANI. Ne v piškotku, ne v sessionStorage.
 *    Identifikator za merjenje, shranjen v brskalniku, po ZEKom-2 terja
 *    privolitev; naključni id, ki umre z osvežitvijo, je ne. Cena: osvežitev
 *    sredi vprašalnika je videti kot dva obiska — prvi odneha na koraku N, drugi
 *    se na njem začne. Sprejemnik drugega prepozna (prvi prikazani korak ni
 *    uvodni) in ga šteje posebej kot "nadaljevanje", ne kot nov obisk.
 *
 * 2. POŠILJANJE JE "IZSTRELI IN POZABI". `navigator.sendBeacon` s telesom kot
 *    nizom: tip vsebine je text/plain (brez predhodne zahteve CORS, na katero
 *    Apps Script ne zna odgovoriti), zahteva pa preživi zaprtje zavihka — prav
 *    tam, kjer se odpadanje dogaja. Odgovora ne bere nihče: merjenje sme izgubiti
 *    dogodek, vprašalnik pa ne sme izgubiti sekunde, zato ni ničesar, kar bi z
 *    odgovorom počeli.
 *
 * 3. DOGODKI SE ZDRUŽUJEJO. Pred pošiljanjem se počaka četrt sekunde, da gre,
 *    kar se sproži v istem trenutku (zaključena triaža in prikaz naslednjega
 *    koraka), v en paket; ob skritju zavihka gre takoj. Na obisk je to okrog
 *    deset zahtev — daleč pod dnevno kvoto Apps Scripta tudi ob tisočih obiskov.
 *
 * OSEBNIH PODATKOV TU NI — velja isto kot za lib/analytics.ts. Vrednosti so
 * omejene na nize in števila, nizi na 120 znakov; kar je večje ali drugačno, se
 * izpusti. Vnosi vprašalnika ne gredo skozi ta modul nikoli.
 */

import { isInternalMode } from './internalMode';

/** Razred zaslona ob začetku obiska — ne naprava, ne user agent. */
export type FunnelDevice = 'mobile' | 'desktop';

export interface FunnelVisit {
  id: string;
  startedAt: string;
  device: FunnelDevice;
  /** `utm_source` iz naslova ali prazen niz. Isti podatek, kot ga nosi izvozni zapis. */
  utmSource: string;
  /** Interni način (?debug=<žeton>, lib/internalMode.ts): povzetek te obiske izpusti. */
  internal: boolean;
}

export type FunnelProps = Record<string, string | number>;

export interface FunnelWireEvent {
  /** Zaporedna številka v obisku — vrstni red, neodvisen od ure naprave. */
  seq: number;
  /** Čas na napravi (ISO). Sprejemnik iz razlik računa čas na koraku. */
  t: string;
  event: string;
  props: FunnelProps;
}

/** Kar gre dejansko po žici: en obisk, en ali več dogodkov. */
export interface FunnelEnvelope {
  visit: FunnelVisit;
  events: FunnelWireEvent[];
}

export interface FunnelQueueOptions {
  visit: FunnelVisit;
  /** Pošlje en paket; true = brskalnik ga je sprejel. Nikoli ne sme vreči. */
  send: (body: string) => boolean;
  now?: () => Date;
  /** Odloži pošiljanje; privzeto setTimeout s FLUSH_DELAY_MS. Test poda takojšnjega. */
  defer?: (flush: () => void) => void;
}

export interface FunnelQueue {
  record(event: string, props?: FunnelProps): void;
  /** Pošlje vse, kar čaka — takoj, mimo odloga. */
  flush(): void;
  /** Koliko dogodkov še čaka na pošiljanje. */
  pending(): number;
}

/** Odlog pred pošiljanjem: dogodki istega trenutka gredo v en paket. */
export const FLUSH_DELAY_MS = 250;
/** Največ dogodkov v enem paketu; večja vrsta gre v več paketov. */
export const MAX_EVENTS_PER_BATCH = 50;
/**
 * Največ čakajočih dogodkov. Brez pošiljanja (zavrnjen beacon) bi vrsta rasla do
 * konca obiska; nad mejo odpadejo najstarejši. Merjenje sme izgubiti dogodek.
 */
export const MAX_PENDING = 200;
/** Daljši nizi so že sumljivi: nobena lastnost lijaka ni daljša od imena polja. */
export const MAX_STRING_LENGTH = 120;

export function createFunnelQueue(options: FunnelQueueOptions): FunnelQueue {
  const now = options.now ?? (() => new Date());
  const defer =
    options.defer ??
    ((flush: () => void) => {
      setTimeout(flush, FLUSH_DELAY_MS);
    });

  let seq = 0;
  let pending: FunnelWireEvent[] = [];
  let scheduled = false;

  const flush = () => {
    scheduled = false;
    while (pending.length) {
      const batch = pending.slice(0, MAX_EVENTS_PER_BATCH);
      pending = pending.slice(batch.length);
      const envelope: FunnelEnvelope = { visit: options.visit, events: batch };
      try {
        // Zavrnjen paket se ne ponavlja: beacon zavrne le ob polnem medpomnilniku
        // (64 KiB), kar pri paketih pod kilobajtom pomeni, da je narobe nekaj
        // večjega od tega paketa.
        options.send(JSON.stringify(envelope));
      } catch {
        // Merjenje ne sme nikoli ustaviti vprašalnika.
      }
    }
  };

  return {
    record(event, props = {}) {
      seq += 1;
      pending.push({ seq, t: now().toISOString(), event, props: sanitizeProps(props) });
      if (pending.length > MAX_PENDING) pending = pending.slice(pending.length - MAX_PENDING);
      if (!scheduled) {
        scheduled = true;
        defer(flush);
      }
    },
    flush,
    pending: () => pending.length,
  };
}

/**
 * Obdrži samo nize in končna števila; nize obreže. Vse drugo (objekti, polja,
 * logične vrednosti) se izpusti — lastnosti lijaka so razredi, ne podatki.
 */
export function sanitizeProps(props: Record<string, unknown>): FunnelProps {
  const clean: FunnelProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'number' && Number.isFinite(value)) clean[key] = value;
    else if (typeof value === 'string') clean[key] = value.slice(0, MAX_STRING_LENGTH);
  }
  return clean;
}

export interface DescribeVisitInput {
  id: string;
  startedAt: Date;
  /** `window.location.search` — od tod utm_source in interni način. */
  search: string;
  /** Ozek zaslon ob začetku obiska (matchMedia). */
  narrowScreen: boolean;
  /**
   * Žeton internega načina (VITE_INTERNAL_TOKEN). Neobvezen: brez njega velja
   * vrednost iz gradnje, test poda svojega.
   */
  internalToken?: unknown;
}

/**
 * Opis obiska iz okolja. Čista funkcija: analytics.ts ji poda, kar prebere iz
 * `window`, test pa vrednosti brez brskalnika.
 */
export function describeVisit(input: DescribeVisitInput): FunnelVisit {
  const params = new URLSearchParams(input.search);
  return {
    id: input.id,
    startedAt: input.startedAt.toISOString(),
    device: input.narrowScreen ? 'mobile' : 'desktop',
    utmSource: (params.get('utm_source') ?? '').slice(0, MAX_STRING_LENGTH),
    // Isto pravilo kot v App.tsx (readInitialParams) — en vir, lib/internalMode.ts.
    // Žeton `undefined` pomeni privzetega iz gradnje (privzeti parameter).
    internal: isInternalMode(input.search, input.internalToken),
  };
}

/**
 * Naključen id obiska. `crypto.randomUUID` obstaja samo v varnem kontekstu
 * (https, localhost); drugod zadošča naključje, ki loči obiske istega dne.
 */
export function newVisitId(cryptoImpl: Pick<Crypto, 'randomUUID'> | undefined = globalThis.crypto): string {
  try {
    if (cryptoImpl && typeof cryptoImpl.randomUUID === 'function') return cryptoImpl.randomUUID();
  } catch {
    // Pade v rezervo spodaj.
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export interface BeaconTransport {
  sendBeacon?: (url: string, body: string) => boolean;
  fetch?: typeof fetch;
}

/**
 * Pošlje paket, ne da bi čakal na odgovor. Najprej beacon (preživi zaprtje
 * zavihka, tip vsebine text/plain brez predhodne zahteve), sicer fetch s
 * `keepalive` in istim tipom vsebine — glej submitLead.ts, zakaj NE
 * application/json. Nikoli ne vrže.
 */
export function sendBeaconOrFetch(
  url: string,
  body: string,
  transport: BeaconTransport = {
    sendBeacon:
      typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function'
        ? navigator.sendBeacon.bind(navigator)
        : undefined,
    fetch: typeof fetch === 'function' ? fetch : undefined,
  },
): boolean {
  try {
    if (transport.sendBeacon && transport.sendBeacon(url, body)) return true;
  } catch {
    // Pade v rezervo spodaj.
  }
  try {
    if (!transport.fetch) return false;
    transport
      .fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body,
        keepalive: true,
      })
      .catch(() => {
        // Odgovora ne bere nihče — tudi napake ne.
      });
    return true;
  } catch {
    return false;
  }
}
