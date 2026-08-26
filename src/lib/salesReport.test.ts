import { describe, it, expect } from 'vitest';
import { buildSalesReport, hourAssumptionSource, type BuildSalesReportParams } from './salesReport';
import { computeModules, resolveActiveModules, resolveInputs } from './moduleEngine';
import { aggregateResults, assessConfidence, buildComputeContext } from './potential';
import {
  emptyProfileFor,
  getSegmentContext,
  industryAverageBand,
} from '../config/contexts';
import { getModules } from '../config/modules';
import { SEGMENTS, SEGMENT_ORDER } from '../config/segments';
import { INDUSTRIES } from '../config/industries';
import type { SegmentId } from '../config/segmentTypes';

/**
 * Poročilo je zadnja postaja podatkov: če se tu izgubijo ali ostanejo strojni,
 * tega ne ujame noben drug test — prodajnik to opazi šele pred stranko.
 */

const STAMP = '2026-08-05T09:30:00.000Z';

interface ScenarioOptions {
  selectedIds?: string[];
  triageScores?: Record<string, number>;
  inputs?: Record<string, Record<string, number>>;
  currentSystem?: string | null;
  exactHours?: boolean;
  /** Obiskovalec je prevzel našo oceno za dejavnost namesto lastne številke. */
  industryAverageHours?: boolean;
  taxNumber?: string;
  role?: string;
  roleOther?: string;
}

/** Sestavi poročilo za dani segment po isti poti kot CalculatorFlow. */
function reportFor(segmentId: SegmentId, options: ScenarioOptions = {}) {
  const segment = SEGMENTS[segmentId];
  const context = getSegmentContext(segmentId);
  const segmentModules = getModules(segment.moduleIds);

  const profile = emptyProfileFor(context);
  profile.currentSystem = options.currentSystem ?? context?.currentSystem.options[0].id ?? null;
  profile.businessType = context?.businessType.options[0].id ?? null;
  profile.role = options.role ?? context?.role.options[0].id ?? null;
  profile.roleOther = options.roleOther ?? '';
  if (options.exactHours) {
    profile.operationalHour = { valueEUR: 30, estimated: false, source: 'entered' };
    profile.adminHour = { valueEUR: 40, estimated: false, source: 'entered' };
    profile.chargeOutRate = { valueEUR: 90, estimated: false, source: 'entered' };
  }
  if (options.industryAverageHours && context) {
    // Vrednost je natanko privzetek dejavnosti — prav to je pri tem viru bistvo:
    // po sami številki ga od neodgovora ni mogoče ločiti.
    profile.operationalHour = {
      valueEUR: context.operationalHour.fallbackEUR,
      estimated: true,
      source: 'industryAverage',
    };
  }

  const triageable = segmentModules.filter((d) => d.triage).map((d) => d.id);
  const selected = options.selectedIds ?? triageable.slice(0, 2);
  const activeModules = resolveActiveModules(segmentModules, segment.triage ? selected : null);

  const values: Record<string, Record<string, number>> = {};
  for (const definition of activeModules) {
    values[definition.id] = resolveInputs(definition, options.inputs?.[definition.id]);
  }

  const outputs = computeModules(activeModules, values, buildComputeContext(profile));
  const totals = aggregateResults(outputs, {
    includePotential: context !== undefined,
    confidence: context
      ? assessConfidence({ profile, context, modules: activeModules, values, outputs })
      : undefined,
  });

  const params: BuildSalesReportParams = {
    generatedAtISO: STAMP,
    contact: {
      firstName: 'Janez',
      lastName: 'Novak',
      companyName: 'Testno podjetje d.o.o.',
      email: 'test@example.com',
      phone: '+386 1 234 5678',
      taxNumber: options.taxNumber ?? '12345679',
    },
    consents: {
      consentProcessing: true,
      consentOffers: true,
      consentContent: false,
      consentConsulting: true,
    },
    utmSource: 'linkedin',
    industry: INDUSTRIES.find((i) => i.segment === segmentId)?.id ?? '',
    employeeCount: 45,
    segment,
    context,
    profile,
    segmentModules,
    activeModules,
    values,
    triageScores: options.triageScores ?? {},
    outputs,
    totals,
    highestModule: null,
    followUpSequence: 'high-loss-no-risk',
  };

  return buildSalesReport(params);
}

describe('Poročilo se sestavi za vsako dejavnost', () => {
  it('nobena oznaka ne ostane surov id', () => {
    for (const segmentId of SEGMENT_ORDER) {
      const report = reportFor(segmentId);
      const context = getSegmentContext(segmentId);
      if (!context) continue;

      // Preslikave id -> oznaka doslej ni bilo nikjer; brez nje bi prodajnik v
      // poročilu bral "pantheonWms" in ne bi vedel, kaj stranka uporablja.
      const systemIds = context.currentSystem.options.map((option) => option.id);
      expect(report.qualification.currentSystemLabel, segmentId).not.toBeNull();
      expect(systemIds, segmentId).not.toContain(report.qualification.currentSystemLabel);
      expect(report.qualification.roleLabel, segmentId).not.toBeNull();
      expect(report.qualification.businessTypeLabel, segmentId).not.toBeNull();
    }
  });

  it('vpisana vloga pripotuje v poročilo, oznaka ostane naštevna', () => {
    // roleLabel ostane "Drugo", ker nad njim playbook išče "direktor|lastnik";
    // vpisano besedilo živi ločeno in ga izrisovalca pripneta ob prikazu.
    const report = reportFor('trgovina', { role: 'drugo', roleOther: '  Vodja IT  ' });
    expect(report.qualification.roleLabel).toBe('Drugo');
    expect(report.qualification.roleOther).toBe('Vodja IT');
  });

  it('brez vpisa vloge ostane polje prazno in ne prazen niz', () => {
    expect(reportFor('trgovina').qualification.roleOther).toBeNull();
  });

  it('velikostni razred se izpelje iz števila zaposlenih', () => {
    expect(reportFor('trgovina').qualification.sizeClass).toBe('10–49');
  });

  it('dejavnost je oznaka iz spustnega seznama, ne id segmenta', () => {
    expect(reportFor('trgovina').qualification.industryLabel).toBe(
      'Trgovina, veleprodaja in distribucija',
    );
  });

  it('vrzel sedanjega sistema in status uporabnika PANTHEON sta izpolnjena', () => {
    const pantheon = reportFor('trgovina', { currentSystem: 'pantheonWms' });
    expect(pantheon.qualification.isPantheonCustomer).toBe(true);
    expect(pantheon.qualification.systemGap.max).toBeLessThan(0.25);

    const excel = reportFor('trgovina', { currentSystem: 'excelPaper' });
    expect(excel.qualification.isPantheonCustomer).toBe(false);
    expect(excel.qualification.systemGap.max).toBeGreaterThan(
      pantheon.qualification.systemGap.max,
    );
  });

  it('vrzel sistema je prodajni signal in prikazanega zneska ne zmanjša', () => {
    // Ista dejavnost, isti vnosi, različen sedanji sistem: kvalifikacijski signal se
    // razlikuje, naslovljiv potencial pa ne. Varovalo proti vrnitvi dvojnega diskonta
    // po poti prodajnega poročila.
    const scenarij = {
      selectedIds: ['terjatve_trgovina'],
      inputs: { terjatve_trgovina: { dunningHoursPerMonth: 30, mainCause: 0 } },
    };
    const pantheon = reportFor('trgovina', { currentSystem: 'pantheonWms', ...scenarij });
    const excel = reportFor('trgovina', { currentSystem: 'excelPaper', ...scenarij });

    expect(excel.summary.addressablePotentialEUR).toBeGreaterThan(0);
    expect(pantheon.summary.addressablePotentialEUR).toBeCloseTo(
      excel.summary.addressablePotentialEUR!,
      6,
    );
  });

  it('segment brez konteksta ne vrže izjeme', () => {
    // Register kontekstov je Partial<Record<...>> — nova dejavnost bo spet začela
    // brez njega, poročilo pa se zaradi tega ne sme podreti.
    const segment = SEGMENTS.trgovina;
    const segmentModules = getModules(segment.moduleIds);
    const report = buildSalesReport({
      generatedAtISO: STAMP,
      contact: { firstName: '', lastName: '', companyName: '', email: '', phone: '', taxNumber: '' },
      consents: {
        consentProcessing: true,
        consentOffers: false,
        consentContent: false,
        consentConsulting: false,
      },
      utmSource: null,
      industry: 'trgovina',
      employeeCount: 12,
      segment,
      context: undefined,
      profile: emptyProfileFor(undefined),
      segmentModules,
      activeModules: [],
      values: {},
      triageScores: {},
      outputs: [],
      totals: {
        directLossEUR: 0,
        lostMarginEUR: 0,
        capacityEUR: 0,
        capacityHoursPerMonth: 0,
        oneTimeCapitalEUR: 0,
        risks: [],
      },
      highestModule: null,
      followUpSequence: 'low-loss-newsletter',
    });

    expect(report.qualification.currentSystemLabel).toBeNull();
    expect(report.softness.hourAssumptions).toHaveLength(0);
    expect(report.measured).toHaveLength(0);
  });
});

describe('Kje so številke mehke', () => {
  it('neodgovorjena urna postavka se loči od izbranega razpona', () => {
    // Vir je odslej zapisan (CostAssumption.source) in se ne ugiba iz vrednosti,
    // zato je "ni odgovora" razpoznavno stanje ne glede na kalibracijo postavk.
    // Prodajnik mora to ločiti — sicer bere izračun, kot da mu je stranka dala
    // številke, ki jih ni.
    const untouched = reportFor('trgovina');
    for (const row of untouched.softness.hourAssumptions) {
      expect(row.estimated, row.label).toBe(true);
      expect(row.source, row.label).toBe('none');
      expect(row.bandLabel, row.label).toBeNull();
      expect(hourAssumptionSource(row)).toBe('ni odgovora — privzetek dejavnosti');
    }

    const chosenBand = reportFor('trgovina');
    const band = getSegmentContext('trgovina')!.adminHour.bands[1];
    chosenBand.softness.hourAssumptions[1] = {
      ...chosenBand.softness.hourAssumptions[1],
      valueEUR: band.midpointEUR,
      source: 'band',
      bandLabel: band.label,
    };
    expect(hourAssumptionSource(chosenBand.softness.hourAssumptions[1])).toBe(
      `izbran razpon ${band.label}`,
    );
  });

  it('prevzeto povprečje panoge ni ne vnos ne neodgovor', () => {
    /**
     * Trije viri se v tej vrstici stikajo in vsak pomeni nekaj drugega za prodajnika.
     * Povprečje panoge je NAŠA ocena: vrednost je enaka privzetku dejavnosti, zato
     * ga stari izračun po vrednosti ni mogel ločiti od "ni odgovora" — z zapisanim
     * virom pa se izpiše kot svoj primer, skupaj s številko, ki jo je stranka videla.
     */
    const context = getSegmentContext('trgovina')!;
    const report = reportFor('trgovina', { industryAverageHours: true });
    const operational = report.softness.hourAssumptions[0];

    expect(operational.source).toBe('industryAverage');
    expect(operational.estimated).toBe(true);
    expect(operational.valueEUR).toBe(context.operationalHour.fallbackEUR);
    expect(hourAssumptionSource(operational)).toBe(
      `povprečje panoge (${context.operationalHour.fallbackEUR} EUR/h)`,
    );
    // Razpon je pas, v katerem povprečje leži — izračun ni točka.
    expect(operational.bandLabel).toBe(industryAverageBand(context.operationalHour)!.label);
  });

  it('vnesena urna postavka nima oznake razpona', () => {
    const report = reportFor('trgovina', { exactHours: true });
    for (const row of report.softness.hourAssumptions) {
      expect(row.estimated).toBe(false);
      expect(row.bandLabel).toBeNull();
    }
  });

  it('zaračunana postavka se navede samo tam, kjer je vprašana', () => {
    // V profilu je prisotna povsod kot varovalo pred NaN. Navesti jo kot odgovor
    // proizvajalca, ki je nikoli ni videl, bi bilo neresnično.
    expect(reportFor('storitve').softness.hourAssumptions).toHaveLength(3);
    expect(reportFor('proizvodnja').softness.hourAssumptions).toHaveLength(2);
  });

  // Vprašanje o glavnem vzroku nima več privzetka, zato neizpolnjen obrazec ne
  // pomeni več izbranega "Ne vemo", ampak molk. Za prodajnika sta to dve različni
  // iztočnici — "kako bi to izmerili" proti "kdo pri vas to ve" — in prodajni
  // priročnik ne sme trditi, da je stranka rekla nekaj, česar ni.
  it('neodgovorjen glavni vzrok je naveden ločeno od izbranega "Ne vem"', () => {
    const report = reportFor('trgovina');
    const question = 'Kaj je glavni vzrok?';

    const unanswered = report.softness.unansweredChoices.filter((row) => row.question === question);
    expect(unanswered.length).toBeGreaterThan(0);

    const claimedUnknown = report.softness.unknownAnswers.filter((row) => row.question === question);
    expect(claimedUnknown).toHaveLength(0);
  });

  it('izbrani "Ne vemo" pri glavnem vzroku ostane med izrecnimi odgovori', () => {
    // Nasprotni primer istega para: kdor "Ne vemo" izbere, je odgovoril.
    const report = reportFor('trgovina', {
      selectedIds: ['skladisce_trgovina'],
      inputs: { skladisce_trgovina: { mainCause: 5 } },
    });
    const question = 'Kaj je glavni vzrok?';

    expect(report.softness.unknownAnswers.filter((row) => row.question === question)).toHaveLength(1);
    expect(report.softness.unansweredChoices.filter((row) => row.question === question)).toHaveLength(
      0,
    );
  });

  it('nedotaknjeno številsko polje je našteto, vneseno pa ne', () => {
    const untouched = reportFor('trgovina', {
      selectedIds: ['skladisce_trgovina'],
    }).softness.untouchedFields.map((row) => row.question);
    const question = 'Koliko skupnih človek-ur mesečno skladišče porabi za iskanje blaga, ki ni na pričakovani lokaciji?';
    expect(untouched).toContain(question);

    const answered = reportFor('trgovina', {
      selectedIds: ['skladisce_trgovina'],
      inputs: { skladisce_trgovina: { searchingHoursPerMonth: 90 } },
    }).softness.untouchedFields.map((row) => row.question);
    expect(answered).not.toContain(question);
  });

  it('razlaga zanesljivosti našteje razloge, ne le oznake', () => {
    const report = reportFor('trgovina');
    expect(report.summary.confidenceReason).toContain('spodnja meja');
    expect(report.summary.confidenceReason).toContain('brez odgovora');
  });

  it('izpolnjen obrazec dobi razlago brez očitkov', () => {
    const report = reportFor('trgovina', {
      exactHours: true,
      selectedIds: ['zaloge_trgovina'],
      inputs: {
        zaloge_trgovina: {
          inventoryValueEUR: 900_000,
          annualWriteOffEUR: 30_000,
          annualStockoutMarginLossEUR: 45_000,
          reducibleShare: 2,
          mainCause: 1,
        },
      },
    });
    expect(report.summary.confidenceReason).toContain('vnesla vse ključne podatke');
  });
});

describe('Triaža in izmerjena področja', () => {
  it('našteje VSA področja, tudi neizmerjena — to je iztočnica za pogovor', () => {
    const report = reportFor('trgovina', {
      selectedIds: ['zaloge_trgovina'],
      triageScores: { terjatve_trgovina: 3, zaloge_trgovina: 1 },
    });

    const boleceNeizmerjeno = report.triage.find((row) => row.moduleId === 'terjatve_trgovina');
    expect(boleceNeizmerjeno?.score).toBe(3);
    expect(boleceNeizmerjeno?.measured).toBe(false);
    expect(boleceNeizmerjeno?.scoreLabel).toBe('Zamude so pravilo');

    expect(report.triage.find((row) => row.moduleId === 'zaloge_trgovina')?.measured).toBe(true);
  });

  it('diagnostika ni v triaži in se zato med področji ne pojavi', () => {
    const report = reportFor('trgovina');
    expect(report.triage.map((row) => row.moduleId)).not.toContain('diagnostika_trgovina');
  });

  it('polja s contextOnly so med odgovori — stranka jih nazaj ne vidi, prodajnik jih rabi', () => {
    const report = reportFor('trgovina', { selectedIds: ['skladisce_trgovina'] });
    const area = report.measured.find((item) => item.moduleId === 'skladisce_trgovina')!;
    const contextAnswer = area.answers.find((row) => row.question === 'Kako danes komisionirate?');

    expect(contextAnswer).toBeDefined();
    expect(contextAnswer!.contextOnly).toBe(true);
    // Nedotaknjeno kontekstno vprašanje je NEODGOVORJENO, ne "privzeti odgovor":
    // vnaprej izbran "Delno ERP, delno Excel ali listek" je v CRM in pripravo
    // potoval kot podatek o podjetju, ki tega ni nikoli izjavilo.
    expect(contextAnswer!.answer).toBe('Ni odgovora');
    expect(contextAnswer!.source).toBe('ni odgovora');
  });

  it('izbran odgovor kontekstnega vprašanja potuje v pripravo kot vnesen', () => {
    const report = reportFor('trgovina', {
      selectedIds: ['skladisce_trgovina'],
      inputs: { skladisce_trgovina: { pickingMethod: 2 } },
    });
    const area = report.measured.find((item) => item.moduleId === 'skladisce_trgovina')!;
    const contextAnswer = area.answers.find((row) => row.question === 'Kako danes komisionirate?');

    expect(contextAnswer!.answer).toBe('Delno ERP, delno Excel ali listek');
    expect(contextAnswer!.source).toBe('vneseno');
  });

  it('odgovor nosi oznako izbire in enoto, ne surove številke', () => {
    const report = reportFor('trgovina', {
      selectedIds: ['skladisce_trgovina'],
      inputs: { skladisce_trgovina: { searchingHoursPerMonth: 90, mainCause: 0 } },
    });
    const area = report.measured.find((item) => item.moduleId === 'skladisce_trgovina')!;

    const hours = area.answers.find((row) => row.question.startsWith('Koliko skupnih človek-ur'))!;
    expect(hours.answer).toBe('90 h/mesec');
    expect(hours.answered).toBe(true);

    expect(area.mainCauseLabel).toBe('Lokacije blaga niso vodene ali niso ažurne');
    expect(area.addressableShare).toBe(0.75);
  });

  it('modul E ni področje — njegovi roki so med tveganji', () => {
    const report = reportFor('trgovina', { currentSystem: 'pantheonWms' });
    expect(report.measured.map((area) => area.moduleId)).not.toContain('E');
  });

  it('vsako izmerjeno področje nosi funkcionalnosti PANTHEON in metodologijo', () => {
    const report = reportFor('trgovina', { selectedIds: ['zaloge_trgovina'] });
    const area = report.measured.find((item) => item.moduleId === 'zaloge_trgovina')!;

    expect(area.pantheon.length).toBeGreaterThan(0);
    expect(area.methodology?.formula).toBeTruthy();
    expect(area.methodology?.rationale).toBeTruthy();
  });
});

describe('Zapis ne izgubi podatkov, ki jih je tok doslej zavrgel', () => {
  it('vsa kontaktna polja pristanejo v zapisu', () => {
    // Edini test, ki ujame polje, pozabljeno v razširjanju (spread) v buildSalesReport:
    // manjkajoče polje se tam ne pozna ne pri prevajanju ne v izrisu.
    const report = reportFor('trgovina');
    expect(report.meta.firstName).toBe('Janez');
    expect(report.meta.lastName).toBe('Novak');
    expect(report.meta.companyName).toBe('Testno podjetje d.o.o.');
    expect(report.meta.email).toBe('test@example.com');
    expect(report.meta.phone).toBe('+386 1 234 5678');
    expect(report.meta.taxNumber).toBe('12345679');
  });

  it('vse štiri privolitve so ločene, ne združene v eno zastavico', () => {
    const report = reportFor('trgovina');
    expect(report.meta.consentProcessing).toBe(true);
    expect(report.meta.consentOffers).toBe(true);
    expect(report.meta.consentContent).toBe(false);
    // Prošnja za posvet je ločena od privolitve za ponudbe: "smem pošiljati" ni
    // isto kot "prosil je, naj ga pokličem".
    expect(report.meta.consentConsulting).toBe(true);
  });

  it('vir kampanje in časovni žig sta v poročilu', () => {
    const report = reportFor('trgovina');
    expect(report.meta.utmSource).toBe('linkedin');
    expect(report.meta.generatedAtISO).toBe(STAMP);
  });

  it('dvom o davčni potuje s podatkom, ne ostane v obrazcu', () => {
    // Napačna davčna oddaje ne blokira, zato mora opozorilo priti tja, kjer ga
    // vidi svetovalec — sicer se napaka tiho preseli v CRM.
    expect(reportFor('trgovina').meta.taxNumberLooksValid).toBe(true);
    expect(reportFor('trgovina', { taxNumber: '12345678' }).meta.taxNumberLooksValid).toBe(false);
  });

  it('nevnesena davčna ne velja za sumljivo', () => {
    expect(reportFor('trgovina', { taxNumber: '' }).meta.taxNumberLooksValid).toBe(true);
  });
});
