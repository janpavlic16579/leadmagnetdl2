import { describe, it, expect, vi } from 'vitest';
import { leadWebhookUrl, submitLead, type LeadSubmission } from './submitLead';
import { buildLeadExportRecord } from './exportRecord';
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
  consents: { consentProcessing: true, consentOffers: false, consentContent: false },
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
      consents: { consentProcessing: false, consentOffers: true, consentContent: true },
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

  it('napaka strežnika ali omrežja NIKOLI ne vrže — vrne false', async () => {
    const serverError = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    expect(await submitLead(SUBMISSION, 'https://x', serverError as never)).toBe(false);

    const networkError = vi.fn().mockRejectedValue(new Error('offline'));
    expect(await submitLead(SUBMISSION, 'https://x', networkError as never)).toBe(false);
  });
});
