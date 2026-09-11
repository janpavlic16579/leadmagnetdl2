import { describe, it, expect, vi } from 'vitest';
import {
  attachmentFromFile,
  leadWebhookUrl,
  requestTimeoutMs,
  submitLead,
  type LeadAttachment,
  type LeadSubmission,
} from './submitLead';
import { buildLeadExportRecord, CSV_COLUMNS, buildRowValues } from './exportRecord';
import type { ResultTotals } from './potential';

const TOTALS: ResultTotals = {
  directLossEUR: 12_000,
  lostMarginEUR: 3_000,
  capacityEUR: 8_000,
  capacityHoursPerMonth: 20,
  oneTimeCapitalEUR: 0,
  risks: [],
  confidence: 'medium',
};

const RECORD = buildLeadExportRecord({
  timestampISO: '2026-08-11T10:00:00.000Z',
  contact: {
    firstName: 'Janez',
    lastName: 'Novak',
    companyName: 'Testko d.o.o.',
    email: 'janez@testko.si',
    phone: '',
    taxNumber: '',
  },
  consents: { consentProcessing: true, consentOffers: false, consentContent: false, consentConsulting: false },
  industry: 'trgovina',
  segment: 'trgovina',
  employeeCount: 30,
  profile: undefined,
  selectedModules: ['terjatve_trgovina'],
  triageScores: { terjatve_trgovina: 3 },
  moduleInputs: {},
  outputs: [],
  totals: TOTALS,
  followUpSequence: 'low-loss-newsletter',
  utmSource: 'linkedin',
})!;

const SUBMISSION: LeadSubmission = { record: RECORD, salesReportHtml: '<!doctype html>' };

/** Odgovor sprejemnika s telesom, kot ga vrne Apps Script (`ContentService`, JSON). */
const odgovor = (body: unknown) => ({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify(body)) });

describe('buildLeadExportRecord', () => {
  it('sestavi zapis z oznako dejavnosti, velikostnim razredom in vsemi koši', () => {
    expect(RECORD.industryLabel).toBe('Trgovina, veleprodaja in distribucija');
    expect(RECORD.sizeClass).toBe('10–49');
    expect(RECORD.totals.lostMarginEUR).toBe(3_000);
    expect(RECORD.confidence).toBe('medium');
    expect(RECORD.gdprConsent).toBe(true);
  });

  it('brez obvezne privolitve zapisa NI', () => {
    const withoutConsent = buildLeadExportRecord({
      timestampISO: '2026-08-11T10:00:00.000Z',
      contact: RECORD,
      consents: { consentProcessing: false, consentOffers: true, consentContent: true, consentConsulting: false },
      industry: 'trgovina',
      segment: 'trgovina',
      employeeCount: 30,
      profile: undefined,
      selectedModules: [],
      triageScores: {},
      moduleInputs: {},
      outputs: [],
      totals: TOTALS,
      followUpSequence: 'low-loss-newsletter',
      utmSource: null,
    });
    expect(withoutConsent).toBeNull();
  });
});

describe('leadWebhookUrl', () => {
  it('brez nastavitve ali ob praznem nizu vrne null', () => {
    expect(leadWebhookUrl({})).toBeNull();
    expect(leadWebhookUrl({ VITE_LEAD_WEBHOOK_URL: '' })).toBeNull();
    expect(leadWebhookUrl({ VITE_LEAD_WEBHOOK_URL: '   ' })).toBeNull();
  });

  it('nastavljen naslov vrne obrezan', () => {
    expect(leadWebhookUrl({ VITE_LEAD_WEBHOOK_URL: ' https://crm.example/hook ' })).toBe(
      'https://crm.example/hook',
    );
  });
});

describe('submitLead', () => {
  it('POST-a JSON celotne oddaje; ob 200 brez berljivega telesa dostavo potrdi, o pošti stranki pa ne ve nič', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const result = await submitLead(SUBMISSION, 'https://crm.example/hook', fetchImpl as never);

    expect(result).toEqual({ delivered: true, customerReport: { sent: false, reason: 'unknown' } });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://crm.example/hook');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    expect(body.record.email).toBe('janez@testko.si');
    expect(body.salesReportHtml).toContain('doctype');
  });

  /**
   * `application/json` sproži predhodno zahtevo CORS, na katero Apps Script ne
   * odgovori — dostava v Google Sheet bi padla pri vsakem leadu, v testih pa se
   * to ne bi poznalo. Zato je tip vsebine tu trditev in ne podrobnost izvedbe.
   */
  it('pošlje kot text/plain — sicer bi predhodna zahteva CORS ustavila Apps Script', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    await submitLead(SUBMISSION, 'https://crm.example/hook', fetchImpl as never);

    expect(fetchImpl.mock.calls[0][1].headers['Content-Type']).toBe('text/plain;charset=utf-8');
  });

  it('priloži glavo in vrstico CSV, da sprejemniku ni treba poznati nobenega polja', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    await submitLead(SUBMISSION, 'https://crm.example/hook', fetchImpl as never);

    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body.sheet.columns).toEqual(CSV_COLUMNS);
    expect(body.sheet.row).toEqual(buildRowValues(RECORD));
    expect(body.sheet.row).toHaveLength(CSV_COLUMNS.length);
  });

  /**
   * Vejica v oznaki dejavnosti je v CSV razlog za narekovaje, v celici
   * preglednice pa se pokažejo kot del besedila.
   */
  it('vrednosti NISO ubežane za CSV — narekovaji pripadajo obliki, ne podatku', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    await submitLead(SUBMISSION, 'https://x', fetchImpl as never);

    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body.sheet.row[CSV_COLUMNS.indexOf('industryLabel')]).toBe(
      'Trgovina, veleprodaja in distribucija',
    );
  });

  /**
   * `keepalive` je edino, kar POST obdrži pri življenju ob zaprtem zavihku, a
   * specifikacija omejuje telo takih zahtev na 64 KiB in brskalnik večje ZAVRNE.
   * Razvejana priprava zato ne sme tiho odnesti celotne dostave.
   */
  it('pri veliki pripravi opusti keepalive namesto da bi brskalnik zahtevo zavrnil', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200 });

    await submitLead(SUBMISSION, 'https://x', fetchImpl as never);
    expect(fetchImpl.mock.calls[0][1].keepalive).toBe(true);

    const huge: LeadSubmission = { record: RECORD, salesReportHtml: 'x'.repeat(70_000) };
    await submitLead(huge, 'https://x', fetchImpl as never);
    expect(fetchImpl.mock.calls[1][1].keepalive).toBe(false);
  });

  /**
   * Prilogi sta del oddaje in ne posebna pot: gresta v isto telo, nespremenjeni.
   * Zaradi njune velikosti `keepalive` odpade — to je sprejeto (glej submitLead.ts).
   */
  it('prilogi gresta v telo nespremenjeni, keepalive pa zaradi velikosti odpade', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const attachments: LeadAttachment[] = [
      { filename: 'porocilo.pdf', contentType: 'application/pdf', base64: 'A'.repeat(70_000), audience: 'customer' },
      { filename: 'priprava.pdf', contentType: 'application/pdf', base64: 'QQ==', audience: 'sales' },
    ];

    await submitLead({ ...SUBMISSION, attachments }, 'https://x', fetchImpl as never);

    const [, init] = fetchImpl.mock.calls[0];
    expect(JSON.parse(init.body).attachments).toEqual(attachments);
    expect(init.keepalive).toBe(false);
  });

  it('napaka strežnika ali omrežja NIKOLI ne vrže — dostava je neuspela', async () => {
    const serverError = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    expect((await submitLead(SUBMISSION, 'https://x', serverError as never)).delivered).toBe(false);

    const networkError = vi.fn().mockRejectedValue(new Error('offline'));
    expect((await submitLead(SUBMISSION, 'https://x', networkError as never)).delivered).toBe(false);
  });

  /**
   * Sprejemnik (Koda.gs) v telesu pove, ali je strankino poročilo odšlo na
   * e-naslov iz obrazca. Od tega je odvisno, ali rezultati pokažejo obvestilo
   * ali gumb za prenos — zato se telo bere, ne le status.
   */
  it('iz telesa prebere izid pošte stranki', async () => {
    const sent = vi.fn().mockResolvedValue(odgovor({ ok: true, customerReport: { sent: true } }));
    expect(await submitLead(SUBMISSION, 'https://x', sent as never)).toEqual({
      delivered: true,
      customerReport: { sent: true },
    });

    const skipped = vi
      .fn()
      .mockResolvedValue(odgovor({ ok: true, customerReport: { sent: false, reason: 'no_attachment' } }));
    expect(await submitLead(SUBMISSION, 'https://x', skipped as never)).toEqual({
      delivered: true,
      customerReport: { sent: false, reason: 'no_attachment' },
    });

    // Načina, v katerem pošilja CRM: 'queued' ni odpoved, 'unsubscribed' je.
    // Oba morata priti skozi nespremenjena, sicer bi ju rezultati brali kot 'unknown'.
    for (const reason of ['queued', 'unsubscribed'] as const) {
      const crm = vi.fn().mockResolvedValue(odgovor({ ok: true, customerReport: { sent: false, reason } }));
      expect(await submitLead(SUBMISSION, 'https://x', crm as never)).toEqual({
        delivered: true,
        customerReport: { sent: false, reason },
      });
    }
  });

  it('odgovor starejšega sprejemnika, neznan razlog ali neberljivo telo: dostava uspela, pošta neznana', async () => {
    const unknown = { delivered: true, customerReport: { sent: false, reason: 'unknown' } };

    const old = vi.fn().mockResolvedValue(odgovor({ ok: true }));
    expect(await submitLead(SUBMISSION, 'https://x', old as never)).toEqual(unknown);

    const strange = vi
      .fn()
      .mockResolvedValue(odgovor({ ok: true, customerReport: { sent: false, reason: 'teapot' } }));
    expect(await submitLead(SUBMISSION, 'https://x', strange as never)).toEqual(unknown);

    const unreadable = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.reject(new Error('prekinjen tok')),
    });
    expect(await submitLead(SUBMISSION, 'https://x', unreadable as never)).toEqual(unknown);
  });

  /**
   * Apps Script napako skripte vrne kot HTML s statusom 200 — status laže, telo
   * ne. Dokler se je gledal samo status, je taka oddaja štela kot uspešna in
   * priprava ni šla ne stranki ne na Drive.
   */
  it('berljivo telo, ki ni JSON z ok: true, je neuspela dostava', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const html = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('<!doctype html><title>Napaka</title>'),
    });
    expect((await submitLead(SUBMISSION, 'https://x', html as never)).delivered).toBe(false);

    const notOk = vi.fn().mockResolvedValue(odgovor({ ok: false }));
    expect((await submitLead(SUBMISSION, 'https://x', notOk as never)).delivered).toBe(false);
    warn.mockRestore();
  });
});

describe('attachmentFromFile', () => {
  it('pretvori datoteko generatorja v base64 z imenom, tipom PDF in občinstvom', async () => {
    const file = { filename: 'x.pdf', blob: new Blob([Uint8Array.from([0x25, 0x50, 0x44, 0x46])]) };
    expect(await attachmentFromFile(file, 'customer')).toEqual({
      filename: 'x.pdf',
      contentType: 'application/pdf',
      base64: 'JVBERg==',
      audience: 'customer',
    });
  });

  /**
   * Pretvorba teče po kosih po 32 KiB (meja sklada pri `String.fromCharCode`);
   * PDF je večji od enega kosa, zato mora šiv med kosoma ostati brez izgube.
   */
  it('večjo datoteko pretvori po kosih brez izgube', async () => {
    const bytes = Uint8Array.from({ length: 100_000 }, (_, i) => (i * 7) & 0xff);
    const { base64 } = await attachmentFromFile({ filename: 'x.pdf', blob: new Blob([bytes]) }, 'sales');

    const decoded = atob(base64);
    expect(decoded.length).toBe(bytes.length);
    expect(Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')).toBe(decoded);
  });
});

describe('requestTimeoutMs', () => {
  /**
   * Rok raste s telesom: samo HTML ostane pri petindvajsetih sekundah, s
   * prilogama (≈ 175 kB) pa počasna mobilna povezava dobi čas za prenos —
   * prekoračitev namreč šteje kot neuspela dostava in ponudi prenos poročila,
   * ki je po e-pošti morda že na poti.
   */
  it('samo HTML ≈ 25 s, s prilogama ≈ 28,5 s', () => {
    expect(requestTimeoutMs(10_000)).toBe(25_200);
    expect(requestTimeoutMs(175_000)).toBe(28_500);
  });
});
