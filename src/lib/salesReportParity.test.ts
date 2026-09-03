import { describe, expect, it } from 'vitest';
import pdfSalesSource from './pdfSales.ts?raw';
import htmlSource from './salesReportHtml.ts?raw';
import { emptyProfileFor, getSegmentContext } from '../config/contexts';
import { getModules } from '../config/modules';
import { SEGMENTS } from '../config/segments';
import { buildSalesReport, qualificationRows, scoreRows } from './salesReport';
import { buildSalesReportHtml } from './salesReportHtml';
import { aggregateResults, assessConfidence, buildComputeContext } from './potential';
import { computeModules, resolveActiveModules, resolveInputs } from './moduleEngine';

/**
 * Prodajno pripravo izrisujeta dve datoteki in svetovalec bere obe. Razlika med njima
 * izgleda kot razlika v podatkih, zato so vrstice razdelkov 1 in 2 izpeljane enkrat, v
 * salesReport.ts. Ta datoteka to varuje: doslej je bil edini varovalo komentar
 * "zrcali vrstice v salesReportHtml.ts", ki ga prevajalnik ne prebere.
 */

const STAMP = '2026-08-05T09:30:00.000Z';

function reportFor(
  options: {
    consultingRequested?: boolean;
    deadlineChecked?: boolean;
    stamp?: string;
    /** Nedotaknjen obrazec: brez vnosov, torej brez zneskov. */
    empty?: boolean;
  } = {},
) {
  const segment = SEGMENTS.trgovina;
  const context = getSegmentContext('trgovina')!;
  const segmentModules = getModules(segment.moduleIds);

  const profile = emptyProfileFor(context);
  // Uporabnik PANTHEON, sicer se modul s tehničnimi roki sploh ne prikaže.
  profile.currentSystem =
    context.currentSystem.options.find((option) => option.isPantheon)?.id ?? null;
  profile.businessType = context.businessType.options[0].id;
  profile.role = context.role.options[0].id;

  const activeModules = resolveActiveModules(segmentModules, ['zaloge_trgovina']);
  const inputs: Record<string, Record<string, number>> = options.empty
    ? {}
    : {
    zaloge_trgovina: {
      inventoryValueEUR: 900_000,
      annualWriteOffEUR: 30_000,
      annualStockoutMarginLossEUR: 45_000,
      reducibleShare: 2,
      mainCause: 1,
    },
    ...(options.deadlineChecked ? { E: { sqlServer2016: 1 } } : {}),
  };

  const values: Record<string, Record<string, number>> = {};
  for (const definition of activeModules) {
    values[definition.id] = resolveInputs(definition, inputs[definition.id]);
  }

  const outputs = computeModules(activeModules, values, buildComputeContext(profile));
  const totals = aggregateResults(outputs, {
    includePotential: true,
    confidence: assessConfidence({ profile, context, modules: activeModules, values, outputs }),
  });

  return buildSalesReport({
    generatedAtISO: options.stamp ?? STAMP,
    contact: {
      firstName: 'Janez',
      lastName: 'Novak',
      companyName: 'Testno podjetje d.o.o.',
      email: 'test@example.com',
      phone: '+386 1 234 5678',
      taxNumber: '12345679',
    },
    consents: {
      consentProcessing: true,
      consentOffers: true,
      consentContent: false,
      consentConsulting: options.consultingRequested ?? false,
    },
    utmSource: null,
    industry: 'trgovina',
    employeeCount: 45,
    segment,
    context,
    profile,
    segmentModules,
    activeModules,
    values,
    triageScores: { terjatve_trgovina: 3 },
    outputs,
    totals,
    highestModule: null,
    followUpSequence: 'high-loss-no-risk',
  });
}

describe('Izrisovalca poročata isto', () => {
  it('vsaka oznaka vrstic razdelkov 1 in 2 se pojavi v HTML izrisu', () => {
    const report = reportFor();
    const html = buildSalesReportHtml(report);

    for (const [label] of [...scoreRows(report), ...qualificationRows(report)]) {
      expect(html, label).toContain(label);
    }
  });

  it('noben izrisovalec teh vrstic ne sestavlja sam', () => {
    // Če se oznaka pojavi kot dobesedni niz v izrisovalcu, je nekdo vrstico prepisal
    // namesto uporabil skupno funkcijo — in od tam naprej se datoteki lahko razideta.
    for (const source of [pdfSalesSource, htmlSource]) {
      expect(source).not.toContain("'Velikost posla'");
      expect(source).not.toContain("'Kontaktna oseba'");
      expect(source).not.toContain("'Privolitev — obdelava osebnih podatkov'");
    }
    // Obe datoteki morata vrstice dobiti iz builderja.
    expect(pdfSalesSource).toContain('qualificationRows');
    expect(htmlSource).toContain('qualificationRows');
  });
});

describe('Ogledalo pokaže to, kar vidi stranka', () => {
  it('naslovni znesek nosi isto obliko kot strankino poročilo', () => {
    /**
     * Pri nizki zanesljivosti stranka bere "najmanj X" (format.ts, formatAmount) —
     * to je hkrati edino mesto, kjer priprava pove, da je znesek spodnja meja. Gola
     * točka bi svetovalca poslala na sestanek z drugo številko od tiste, ki jo ima
     * stranka pred sabo.
     */
    const report = reportFor();
    const heroText = report.clientView.heroText;

    if (report.summary.confidence === 'low') {
      expect(heroText.startsWith('najmanj') || heroText.includes('–'), heroText).toBe(true);
    }
    // Znesek se v razdelku 1 pove enkrat: vrstica o nujnosti ga ne ponovi.
    const urgency = scoreRows(report).find(([label]) => label === 'Nujnost');
    expect(urgency?.[1]).not.toContain('EUR');
  });

  it('pri ničelnem znesku ne izpiše izpeljank, ki jih stranka ni videla', () => {
    // Strankin PDF izpeljanke izriše samo pri hero > 0 (pdf.ts). Ogledalo brez istih
    // vrat bi trdilo "0 EUR vsak delovni dan" — številko, ki je ni videl nihče.
    const empty = reportFor({ empty: true });
    expect(empty.clientView.derivativesText).toBeNull();
  });

  it('povračilo ne stoji v ogledalu, ker ga stranka v poročilu nima', () => {
    // Tabela je iz strankinega poročila odstranjena. Dokler je bila del clientView,
    // je prodajna priprava trdila, da jo ima stranka pred sabo — po odstranitvi bi
    // bila ta trditev neresnična, svetovalec pa bi se skliceval na prikaz, ki ga ni.
    const report = reportFor();
    expect(report.clientView).not.toHaveProperty('payback');
    expect(report.payback.rows).not.toBeNull();

    const empty = reportFor({ empty: true });
    expect(empty.payback.rows).toBeNull();
    expect(empty.payback.note).not.toContain('EUR');
    expect(empty.payback.note).not.toContain('stranka');
  });
});

describe('Datoteka prestane branje stranke', () => {
  /**
   * Brez nastavljenega webhooka se prodajni PDF prenese na napravo stranke
   * (deliverLead.ts). Vse, kar je v njem, mora torej zdržati njeno branje.
   */
  it('ne izpiše internih ključev ne poti do izvorne kode', () => {
    const html = buildSalesReportHtml(reportFor({ consultingRequested: true }));

    for (const internal of [
      'high-loss-no-risk',
      'low-loss-newsletter',
      'accounting-lm07-bridge',
      'src/config',
      'src/lib',
    ]) {
      expect(html, internal).not.toContain(internal);
    }
  });

  it('prošnjo za posvet navede kot strankino poved, brez obljube klica', () => {
    const html = buildSalesReportHtml(reportFor({ consultingRequested: true }));

    expect(html).toContain('želim brezplačen posvet');
    // Roka ne obljubljamo nikjer — obrazec ga namenoma ne obljublja niti stranki.
    expect(html).not.toMatch(/pokličemo v \d/i);
    expect(html).not.toContain('24 ur');
  });
});

describe('Gradnik ostane čist', () => {
  it('isti vhod ob dveh datumih da dva različna izpisa roka', () => {
    /**
     * Čistost je pogodba (glej glavo salesReport.ts): čas pride kot parameter. Če bi
     * kdo posegel po uri sistema, bi bil ta test edini, ki to opazi — vsi drugi
     * uporabljajo isti žig.
     */
    const report = reportFor({ deadlineChecked: true });
    expect(report.qualification.deadlines).toHaveLength(1);

    const [deadline] = report.qualification.deadlines;
    expect(deadline.dateISO).toBe('2026-07-14');
    // 5. 8. 2026 je po 14. 7. 2026 — rok je torej mimo.
    expect(deadline.expired).toBe(true);
    expect(deadline.text).toContain('POTEKEL');
    expect(deadline.text).toContain('14. 7. 2026');
    // Datum je sestavljen iz delov ISO niza in ne prek Date: polnoč po UTC bi v našem
    // pasu pozimi izpisala prejšnji dan (isti hazard kot pri isoDate v format.ts).
    expect(deadline.text).not.toContain('13. 7.');
  });

  it('dneve do roka sklanja po slovensko, tudi nad sto', () => {
    /**
     * Rok SQL Server 2016 je 14. 7. 2026; premikamo časovni žig poročila okoli njega.
     * Sklanjatev je skupna s horizon.slovenianForm, ker se lasten zapis zmoti prav tam,
     * kjer se je ta že: pri ostanku nad sto je "101 dan" in ne "101 dni". Pretekli rok
     * stoji v orodniku, prihodnji v tožilniku — to sta dve različni preglednici.
     */
    const cases: [string, string][] = [
      ['2026-07-15T09:00:00.000Z', 'pred 1 dnem'],
      ['2026-07-16T09:00:00.000Z', 'pred 2 dnevoma'],
      ['2026-07-17T09:00:00.000Z', 'pred 3 dnevi'],
      ['2026-07-13T09:00:00.000Z', 'čez 1 dan'],
      ['2026-07-12T09:00:00.000Z', 'čez 2 dneva'],
      ['2026-04-04T09:00:00.000Z', 'čez 101 dan'],
    ];

    for (const [stamp, expected] of cases) {
      const report = reportFor({ deadlineChecked: true, stamp });
      expect(report.qualification.deadlines[0].statusText, stamp).toContain(expected);
    }
  });

  it('štetje dni ni odvisno od ure oddaje', () => {
    /**
     * Rok je koledarski datum, žig pa trenutek. Dokler sta se primerjala mešano, je
     * bilo štetje odvisno od ure: popoldne na dan roka je dokument izpisal današnji
     * datum in zraven trdil, da je potekel včeraj. Isto štetje napaja oceno nujnosti,
     * zato bi si dokument nasprotoval sam s sabo.
     */
    for (const hour of ['00:01', '09:00', '13:00', '23:59']) {
      const report = reportFor({ deadlineChecked: true, stamp: `2026-07-14T${hour}:00.000Z` });
      const [deadline] = report.qualification.deadlines;
      expect(deadline.expired, hour).toBe(false);
      expect(deadline.statusText, hour).toBe('14. 7. 2026 — poteče danes');
    }
  });
});
