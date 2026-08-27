import { describe, it, expect } from 'vitest';
import { buildSalesReportHtml } from './salesReportHtml';
import type { SalesReport } from './salesReport';

/**
 * HTML se odpre kot datoteka v brskalniku, ime podjetja pa vpiše obiskovalec —
 * to je edino mesto v aplikaciji, kjer njegov vnos konča kot oznake na strani.
 */

const BASE: SalesReport = {
  meta: {
    generatedAtISO: '2026-08-05T09:30:00.000Z',
    firstName: 'Janez',
    lastName: 'Novak',
    companyName: 'Kovinar & sin d.o.o.',
    email: 'info@kovinar.si',
    phone: '+386 1 234 5678',
    taxNumber: '12345679',
    consentProcessing: true,
    consentOffers: false,
    consentContent: false,
    consentConsulting: false,
    utmSource: null,
    taxNumberLooksValid: true,
  },
  clientView: {
    heroText: '109.440 EUR',
    derivativesText: null,
    payback: null,
    paybackNote: 'Tabele povračila stranka ni videla.',
    coverageText: null,
    accountingCapacityText: null,
  },
  qualification: {
    industryLabel: 'Trgovina, veleprodaja in distribucija',
    segmentName: 'Veleprodaja in distribucija',
    sizeClass: '10–49',
    employeeCount: 30,
    roleLabel: 'Direktor/-ica',
    roleOther: null,
    businessTypeLabel: 'Veleprodaja poslovnim kupcem',
    currentSystemLabel: 'Večinoma Excel, papir ali sprotni dogovor',
    isPantheonCustomer: false,
    systemGap: { min: 0.25, max: 0.4 },
    followUpSequence: 'high-loss-no-risk',
    deadlines: [],
    technicalRiskModuleShown: false,
  },
  summary: {
    directLossEUR: 45_000,
    lostMarginEUR: 0,
    rangeEUR: null,
    capacityEUR: 64_440,
    capacityHoursPerMonth: 215,
    oneTimeCapitalEUR: 0,
    confidence: 'low',
    confidenceReason: 'Zneski so spodnja meja.',
  },
  softness: { assumptions: [], unknownAnswers: [], unansweredChoices: [], untouchedFields: [], plausibilityWarning: null },
  triage: [],
  measured: [],
  risks: [],
  actionPlan: null,
  highestModuleTitle: null,
  playbook: {
    openingQuestions: [],
    recommendedPantheon: {
      headline: 'Celovita postavitev s skladiščnim modulom (nova postavitev)',
      why: 'Največja vrzel in največji potencial.',
      confirm: 'Točno licenco potrdite po ceniku.',
      addresses: [],
      licence: { name: 'PANTHEON Retail', note: '' },
    },
    objections: [],
    dealSizing: {
      sizeLabel: 'srednji posel',
      urgency: 'nizka',
      urgencyReason: 'Ni odkljukanega tehničnega roka.',
      measuredLossEUR: 109_440,
    },
  },
  icp: {
    total: 58,
    band: 'B',
    bandNote: 'Srednja ustreznost — vredno klica, a ne pred pasom A.',
    dimensions: [
      {
        key: 'size',
        label: 'Velikost podjetja',
        weight: 0.2,
        value: 1,
        points: 20,
        note: '30 zaposlenih. V ciljnem razredu.',
      },
    ],
  },
};

describe('buildSalesReportHtml', () => {
  it('je samostojna datoteka brez zunanjih virov', () => {
    // Odpira se prek file://, kjer vsak zunanji vir tiho odpove, in je namenjena
    // pošiljanju naprej — delovati mora tudi brez omrežja.
    const html = buildSalesReportHtml(BASE);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).not.toMatch(/<link[^>]+href=/i);
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/https?:\/\//);
  });

  it('ubeži vsak vnos obiskovalca, ki pristane v oznakah', () => {
    // Zanka in ne eno polje: obiskovalčevih nizov je šest namesto enega, ta oblika
    // pa ujame tudi SEDMO polje, ki ga bo nekdo dodal in pozabil ubežati.
    const visitorFields = [
      'firstName',
      'lastName',
      'companyName',
      'email',
      'phone',
      'taxNumber',
    ] as const;

    for (const field of visitorFields) {
      const html = buildSalesReportHtml({
        ...BASE,
        meta: { ...BASE.meta, [field]: '<img src=x onerror=alert(1)>' },
      });

      // Nevaren je oglati oklepaj, ne beseda "onerror": ubežan niz ostane v izpisu
      // kot navadno besedilo in tam ne more ničesar sprožiti.
      expect(html, field).not.toContain('<img');
      expect(html, field).toContain('&lt;img src=x');
    }
  });

  it('ima natanko pet razdelkov, v dogovorjenem vrstnem redu', () => {
    // Poročilo je prej naraščalo s prištevanjem razdelkov in doseglo dvanajst
    // naslovov. Petdelna zgradba je dogovor: sodba, dejstva, ukrep, utemeljitev.
    const html = buildSalesReportHtml(BASE);
    const headings = [...html.matchAll(/<h2>([^<]+)<\/h2>/g)].map((match) => match[1]);

    expect(headings).toEqual([
      'Ocena — kvalifikacija stranke',
      'Osnovni podatki',
      'Rezultati vprašalnika',
      'Priporočilo licenc glede na kriterije',
      'Kvalifikacija stranke — podrobnejša razlaga',
    ]);
  });

  it('rezultati imajo oba podnaslova, a ne kot samostojna razdelka', () => {
    const html = buildSalesReportHtml(BASE);
    expect(html).toContain('<h3>Njihove info</h3>');
    expect(html).toContain('<h3>Njihovi največji painpointi</h3>');
  });

  it('ocena je na vrhu, razčlenitev na dnu', () => {
    const html = buildSalesReportHtml(BASE);
    const score = html.indexOf('Ocena — kvalifikacija stranke');
    const detail = html.indexOf('Kvalifikacija stranke — podrobnejša razlaga');

    expect(score).toBeGreaterThan(-1);
    expect(detail).toBeGreaterThan(score);
    // Skupna ocena mora biti vidna zgoraj, ne šele v razčlenitvi.
    expect(html.slice(score, detail)).toContain('58 / 100');
  });

  it('priporočilo imenuje licenco segmenta', () => {
    const html = buildSalesReportHtml(BASE);
    expect(html).toContain('PANTHEON Retail');
  });

  it('izpiše ime podjetja in e-naslov', () => {
    const html = buildSalesReportHtml(BASE);
    expect(html).toContain('Kovinar &amp; sin d.o.o.');
    expect(html).toContain('info@kovinar.si');
  });

  it('izpiše kontaktne podatke in vse tri privolitve ločeno', () => {
    const html = buildSalesReportHtml(BASE);
    expect(html).toContain('Janez Novak');
    expect(html).toContain('+386 1 234 5678');
    expect(html).toContain('12345679');
    expect(html).toContain('Privolitev — obdelava osebnih podatkov');
    expect(html).toContain('Privolitev — ponudbe PANTHEON');
    expect(html).toContain('Privolitev — vsebine in dogodki');
  });

  it('vlogi "Drugo" pripne, kar si je obiskovalec vpisal sam', () => {
    const html = buildSalesReportHtml({
      ...BASE,
      qualification: { ...BASE.qualification, roleLabel: 'Drugo', roleOther: 'Vodja IT' },
    });
    expect(html).toContain('Drugo — Vodja IT');
  });

  it('ubeži tudi vlogo, vpisano na roko', () => {
    // Prosti vnos je sedmo obiskovalčevo polje, a ne živi v meta, zato ga zanka
    // nad meta polji ne ujame.
    const html = buildSalesReportHtml({
      ...BASE,
      qualification: {
        ...BASE.qualification,
        roleLabel: 'Drugo',
        roleOther: '<img src=x onerror=alert(1)>',
      },
    });
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img src=x');
  });

  it('sumljivo davčno označi, namesto da bi jo pokazal kot verodostojno', () => {
    const html = buildSalesReportHtml({
      ...BASE,
      meta: { ...BASE.meta, taxNumber: '12345678', taxNumberLooksValid: false },
    });
    expect(html).toContain('ni videti veljavna');
  });

  it('loči tri stanja tehničnih rokov, ne dveh', () => {
    /**
     * Brez te povedi bi prazen razdelek s tveganji izpadel kot podatek o podjetju.
     * Stanja so tri in vsako pomeni nekaj drugega: modula ni videla / videla ga je in
     * ni odkljukala nič (to je ODGOVOR) / odkljukala je. Pogoj je zato vidnost modula
     * in ne "je uporabnik PANTHEON" — to je bil le približek.
     */
    expect(buildSalesReportHtml(BASE)).toContain('niso bila prikazana');

    const shownNothingChecked = buildSalesReportHtml({
      ...BASE,
      qualification: { ...BASE.qualification, technicalRiskModuleShown: true },
    });
    expect(shownNothingChecked).not.toContain('niso bila prikazana');
    expect(shownNothingChecked).toContain('odkljukala ni nobenega');

    const checked = buildSalesReportHtml({
      ...BASE,
      qualification: {
        ...BASE.qualification,
        technicalRiskModuleShown: true,
        deadlines: [
          {
            key: 'sqlServer2016',
            label: 'SQL Server 2016',
            dateISO: '2026-07-14',
            daysUntil: -22,
            expired: true,
            statusText: 'POTEKEL 14. 7. 2026 (pred 22 dnevi)',
            text: 'POTEKEL 14. 7. 2026 (pred 22 dnevi) — SQL Server 2016',
          },
        ],
      },
    });
    expect(checked).not.toContain('odkljukala ni nobenega');
    expect(checked).toContain('POTEKEL 14. 7. 2026');
  });

  it('izpiše prošnjo za posvet samo, kadar je stranka zanjo zaprosila', () => {
    // Edino polje obrazca, ki izraža namero in ne dovoljenja. Doslej ga izrisovalca
    // nista pokazala nikjer — svetovalec je topel lead klical kot mrzlega.
    expect(buildSalesReportHtml(BASE)).not.toContain('želim brezplačen posvet');
    // Vrstica med privolitvami je vedno, ker je revizijski podatek.
    expect(buildSalesReportHtml(BASE)).toContain('Prošnja za posvet');

    const asked = buildSalesReportHtml({
      ...BASE,
      meta: { ...BASE.meta, consentConsulting: true },
    });
    expect(asked).toContain('želim brezplačen posvet');
    expect(asked).toContain('+386 1 234 5678');
  });

  it('imenuje predvideno nadaljevanje z dejanjem, ne z interno oznako', () => {
    // Datoteka se v rezervnem načinu prenese na napravo stranke, zato oznaka opisuje
    // NAŠ korak in ne, kam smo stranko uvrstili.
    const html = buildSalesReportHtml(BASE);
    expect(html).toContain('Klic svetovalca');
    expect(html).not.toContain('high-loss-no-risk');
  });
});
