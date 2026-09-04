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
  it('POST-a JSON celotne oddaje in ob 200 vrne true', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const delivered = await submitLead(SUBMISSION, 'https://crm.example/hook', fetchImpl as never);

    expect(delivered).toBe(true);
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
      { filename: 'porocilo.pdf', contentType: 'application/pdf', base64: 'A'.repeat(70_000) },
      { filename: 'priprava.pdf', contentType: 'application/pdf', base64: 'QQ==' },
    ];

    await submitLead({ ...SUBMISSION, attachments }, 'https://x', fetchImpl as never);

    const [, init] = fetchImpl.mock.calls[0];
    expect(JSON.parse(init.body).attachments).toEqual(attachments);
    expect(init.keepalive).toBe(false);
  });

  it('napaka strežnika ali omrežja NIKOLI ne vrže — vrne false', async () => {
    const serverError = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    expect(await submitLead(SUBMISSION, 'https://x', serverError as never)).toBe(false);

    const networkError = vi.fn().mockRejectedValue(new Error('offline'));
    expect(await submitLead(SUBMISSION, 'https://x', networkError as never)).toBe(false);
  });
});

describe('attachmentFromFile', () => {
  it('pretvori datoteko generatorja v base64 z imenom in tipom PDF', async () => {
    const file = { filename: 'x.pdf', blob: new Blob([Uint8Array.from([0x25, 0x50, 0x44, 0x46])]) };
    expect(await attachmentFromFile(file)).toEqual({
      filename: 'x.pdf',
      contentType: 'application/pdf',
      base64: 'JVBERg==',
    });
  });

  /**
   * Pretvorba teče po kosih po 32 KiB (meja sklada pri `String.fromCharCode`);
   * PDF je večji od enega kosa, zato mora šiv med kosoma ostati brez izgube.
   */
  it('večjo datoteko pretvori po kosih brez izgube', async () => {
    const bytes = Uint8Array.from({ length: 100_000 }, (_, i) => (i * 7) & 0xff);
    const { base64 } = await attachmentFromFile({ filename: 'x.pdf', blob: new Blob([bytes]) });

    const decoded = atob(base64);
    expect(decoded.length).toBe(bytes.length);
    expect(Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')).toBe(decoded);
  });
});

describe('requestTimeoutMs', () => {
  /**
   * Rok raste s telesom: samo HTML ostane pri osmih sekundah kot doslej, s
   * prilogama (≈ 175 kB) pa počasna mobilna povezava dobi čas za prenos —
   * prekoračitev namreč pošlje prodajno pripravo stranki.
   */
  it('samo HTML ≈ 8 s, s prilogama ≈ 12 s', () => {
    expect(requestTimeoutMs(10_000)).toBe(8_200);
    expect(requestTimeoutMs(175_000)).toBe(11_500);
  });
});
