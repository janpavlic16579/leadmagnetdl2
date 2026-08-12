import { describe, it, expect } from 'vitest';
import { CSV_COLUMNS, buildCsvRow, type LeadExportRecord } from './exportRecord';
import { emptyProfileFor, getSegmentContext } from '../config/contexts';

/**
 * Modul še ni ožičen, a glava CSV je namenoma fiksna in preslikave v CRM so
 * pozicijske. Edina napaka, ki jo je tu vredno loviti, je torej razhajanje med
 * seznamom stolpcev in vrstico — tiho zamakne vsak podatek za sabo.
 */

const RECORD: LeadExportRecord = {
  timestampISO: '2026-08-05T09:30:00.000Z',
  segment: 'trgovina',
  industry: 'trgovina',
  industryLabel: 'Trgovina, veleprodaja in distribucija',
  sizeClass: '10–49',
  employeeCount: 45,
  companyName: 'Kovinar & sin d.o.o.',
  email: 'info@kovinar.si',
  gdprConsent: true,
  firstName: 'Janez',
  lastName: 'Novak',
  phone: '+386 1 234 5678',
  taxNumber: '12345679',
  consentOffers: true,
  consentContent: false,
  selectedModules: ['narocila_trgovina'],
  triageScores: { narocila_trgovina: 2 },
  moduleInputs: { narocila_trgovina: { orderHoursPerMonth: 30 } },
  outputs: [],
  totals: {
    directLossEUR: 12000,
    lostMarginEUR: 5000,
    capacityEUR: 8000,
    capacityHoursPerMonth: 20,
    oneTimeCapitalEUR: 0,
  },
  confidence: 'medium',
  followUpSequence: 'low-loss-newsletter',
  utmSource: null,
};

describe('Izvozni zapis za CRM', () => {
  it('vrstica ima natanko toliko celic, kolikor je stolpcev', () => {
    expect(buildCsvRow(RECORD)).toHaveLength(CSV_COLUMNS.length);
  });

  it('imena stolpcev se ne ponavljajo', () => {
    expect(new Set(CSV_COLUMNS).size).toBe(CSV_COLUMNS.length);
  });

  it('novi stolpci gredo na konec, za obstoječimi', () => {
    // Vrivanje na vsebinsko "pravo" mesto bi premaknilo vse pozicijske preslikave,
    // ki so bile narejene pred spremembo.
    const tail = CSV_COLUMNS.slice(-10);
    expect(tail).toEqual([
      'firstName',
      'lastName',
      'phone',
      'taxNumber',
      'consentOffers',
      'consentContent',
      'lostMarginEUR',
      'roleOther',
      'operationalHourSource',
      'adminHourSource',
    ]);
  });

  it('vpisana vloga pristane pod svojim stolpcem', () => {
    const record: LeadExportRecord = {
      ...RECORD,
      profile: { ...emptyProfileFor(getSegmentContext('trgovina')), role: 'drugo', roleOther: 'Vodja IT' },
    };
    const row = buildCsvRow(record);
    expect(row[CSV_COLUMNS.indexOf('role')]).toBe('drugo');
    expect(row[CSV_COLUMNS.indexOf('roleOther')]).toBe('Vodja IT');
  });

  it('nezaslužena marža pristane pod svojim stolpcem', () => {
    const row = buildCsvRow(RECORD);
    expect(row[CSV_COLUMNS.indexOf('lostMarginEUR')]).toBe('5000');
  });

  it('kontaktna vrednost pristane pod svojim stolpcem', () => {
    const row = buildCsvRow(RECORD);
    for (const [column, expected] of [
      ['firstName', 'Janez'],
      ['lastName', 'Novak'],
      ['taxNumber', '12345679'],
      ['consentOffers', 'true'],
      ['consentContent', 'false'],
    ] as const) {
      expect(row[CSV_COLUMNS.indexOf(column)], column).toBe(expected);
    }
  });

  it('vejica v imenu podjetja ne razbije vrstice', () => {
    const row = buildCsvRow({ ...RECORD, companyName: 'Kovinar, sin in hči d.o.o.' });
    expect(row[CSV_COLUMNS.indexOf('companyName')]).toBe('"Kovinar, sin in hči d.o.o."');
  });
});
