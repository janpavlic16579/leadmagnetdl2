import { describe, it, expect } from 'vitest';
import {
  aggregateResults,
  assessConfidence,
  buildComputeContext,
  computePotentialRange,
  type AssessConfidenceParams,
  type ConfidenceLevel,
} from './potential';
import { computeModules, resolveInputs } from './moduleEngine';
import {
  emptyProfileFor,
  getSegmentContext,
  improvementBandFor,
  isTechnicalRiskModuleVisible,
  type BusinessProfile,
} from '../config/contexts';
import { SEGMENT_ORDER } from '../config/segments';
import { napake } from '../config/modules/logistika';
import { material, planiranje } from '../config/modules/proizvodnja';
import { obracun } from '../config/modules/storitve';
import type { ModuleOutput } from '../config/modules/moduleTypes';

const output = (partial: Partial<ModuleOutput> & Pick<ModuleOutput, 'bucket'>): ModuleOutput => ({
  moduleId: 'test',
  label: 'test',
  ...partial,
});

const PROIZVODNJA = getSegmentContext('proizvodnja')!;
const LOGISTIKA = getSegmentContext('logistika')!;
const EMPTY_PROFILE = emptyProfileFor(PROIZVODNJA);

const profileWith = (overrides: Partial<BusinessProfile>): BusinessProfile => ({
  ...EMPTY_PROFILE,
  ...overrides,
});

const EXACT_HOURS = {
  operationalHour: { valueEUR: 50, estimated: false },
  adminHour: { valueEUR: 35, estimated: false },
};

const STORITVE = getSegmentContext('storitve')!;

describe('computePotentialRange', () => {
  const band = { min: 0.25, max: 0.4 };

  it('upošteva neposredne izgube in kapaciteto', () => {
    const range = computePotentialRange(
      [
        output({ bucket: 'directLoss', valueEUR: 10_000, addressableShare: 0.75 }),
        output({ bucket: 'capacity', valueEUR: 10_000, addressableShare: 0.75 }),
      ],
      band,
    );

    expect(range.minEUR).toBeCloseTo(20_000 * 0.75 * 0.25, 6);
    expect(range.maxEUR).toBeCloseTo(20_000 * 0.75 * 0.4, 6);
  });

  it('enkratnega kapitala ne šteje — ta znesek je že sam potencial', () => {
    const range = computePotentialRange(
      [output({ bucket: 'oneTimeCapital', valueEUR: 500_000, addressableShare: 0.75 })],
      band,
    );
    expect(range.maxEUR).toBe(0);
  });

  it('postavka brez naslovljivega deleža v potencial ne vstopi', () => {
    const range = computePotentialRange([output({ bucket: 'directLoss', valueEUR: 50_000 })], band);
    expect(range.maxEUR).toBe(0);
  });

  it('spodnja meja nikoli ne preseže zgornje', () => {
    const range = computePotentialRange(
      [output({ bucket: 'directLoss', valueEUR: 80_000, addressableShare: 0.65 })],
      band,
    );
    expect(range.minEUR).toBeLessThanOrEqual(range.maxEUR);
  });

  it('potencial ostane pod teoretično zgornjo mejo 30 % izmerjenega stroška', () => {
    // Najvišji možni zmnožek je 0.75 (podatki) × 0.40 (Excel/papir) = 0.30.
    // Če se delež kje pomnoži dvakrat, ta test pade.
    const outputs = [
      output({ bucket: 'directLoss', valueEUR: 60_000, addressableShare: 0.75 }),
      output({ bucket: 'capacity', valueEUR: 40_000, addressableShare: 0.75 }),
    ];
    const range = computePotentialRange(outputs, band);
    expect(range.maxEUR).toBeLessThanOrEqual(100_000 * 0.3 + 1e-6);
  });
});

describe('Pas izboljšave po sedanjem sistemu', () => {
  it('vsaka možnost sistema v vsaki dejavnosti ima veljaven pas', () => {
    // Pas visi na možnosti in ne v ločeni tabeli, zato ga ni mogoče pozabiti —
    // ta test drži samo še, da je smiseln (min < max) in ne obljublja preveč.
    for (const segmentId of SEGMENT_ORDER) {
      const context = getSegmentContext(segmentId);
      if (!context) continue;
      for (const option of context.currentSystem.options) {
        expect(option.band.min, `${segmentId}/${option.id}`).toBeLessThan(option.band.max);
        expect(option.band.max, `${segmentId}/${option.id}`).toBeLessThanOrEqual(0.5);
      }
    }
  });

  it('brez odgovora vzame srednji pas, ne najugodnejšega', () => {
    const fallback = improvementBandFor(PROIZVODNJA, null);
    const best = PROIZVODNJA.currentSystem.options.find((option) => option.id === 'excelPaper')!;
    expect(fallback.max).toBeLessThan(best.band.max);
  });

  it('obstoječi uporabnik PANTHEON MF ima ožji potencial kot podjetje na Excelu', () => {
    const outputs = [output({ bucket: 'directLoss', valueEUR: 100_000, addressableShare: 0.65 })];
    const pantheon = computePotentialRange(outputs, improvementBandFor(PROIZVODNJA, 'pantheonMfMt'));
    const excel = computePotentialRange(outputs, improvementBandFor(PROIZVODNJA, 'excelPaper'));

    expect(pantheon.maxEUR).toBeLessThan(excel.maxEUR);
  });

  it('logistika ima svoje sisteme in svoj najnižji pas za podjetje z namenskim sistemom', () => {
    const logistika = getSegmentContext('logistika')!;
    const outputs = [output({ bucket: 'directLoss', valueEUR: 100_000, addressableShare: 0.65 })];
    const withSystem = computePotentialRange(outputs, improvementBandFor(logistika, 'pantheonWmsTms'));
    const excel = computePotentialRange(outputs, improvementBandFor(logistika, 'excelPaper'));

    expect(withSystem.maxEUR).toBeLessThan(excel.maxEUR);
    // Proizvodni id v logistiki ne sme tiho ujeti nobene možnosti — pas mora
    // pasti na varovalo, ne na napačno dejavnost.
    expect(improvementBandFor(logistika, 'pantheonMfMt')).toEqual(improvementBandFor(logistika, null));
  });
});

describe('isTechnicalRiskModuleVisible', () => {
  it('v proizvodnji se prikaže samo obstoječim uporabnikom PANTHEON', () => {
    expect(isTechnicalRiskModuleVisible('proizvodnja', 'pantheonMfMt')).toBe(true);
    expect(isTechnicalRiskModuleVisible('proizvodnja', 'pantheonNoMf')).toBe(true);
    expect(isTechnicalRiskModuleVisible('proizvodnja', 'otherErp')).toBe(false);
    expect(isTechnicalRiskModuleVisible('proizvodnja', 'excelPaper')).toBe(false);
    expect(isTechnicalRiskModuleVisible('proizvodnja', null)).toBe(false);
  });

  it('v logistiki velja isto pravilo z lastnimi id-ji sistemov', () => {
    expect(isTechnicalRiskModuleVisible('logistika', 'pantheonWmsTms')).toBe(true);
    expect(isTechnicalRiskModuleVisible('logistika', 'pantheonNoWms')).toBe(true);
    expect(isTechnicalRiskModuleVisible('logistika', 'otherErp')).toBe(false);
    expect(isTechnicalRiskModuleVisible('logistika', null)).toBe(false);
  });

  it('v veleprodaji in maloprodaji velja isto pravilo z lastnimi id-ji sistemov', () => {
    expect(isTechnicalRiskModuleVisible('trgovina', 'pantheonWms')).toBe(true);
    expect(isTechnicalRiskModuleVisible('trgovina', 'pantheonNoWms')).toBe(true);
    expect(isTechnicalRiskModuleVisible('trgovina', 'excelPaper')).toBe(false);
    expect(isTechnicalRiskModuleVisible('trgovina', null)).toBe(false);

    expect(isTechnicalRiskModuleVisible('maloprodaja', 'pantheonRetail')).toBe(true);
    expect(isTechnicalRiskModuleVisible('maloprodaja', 'posNoStockLink')).toBe(false);
    expect(isTechnicalRiskModuleVisible('maloprodaja', null)).toBe(false);
  });

  it('v storitvah velja isto pravilo z lastnimi id-ji sistemov', () => {
    expect(isTechnicalRiskModuleVisible('storitve', 'pantheonProjects')).toBe(true);
    expect(isTechnicalRiskModuleVisible('storitve', 'pantheonNoProjects')).toBe(true);
    expect(isTechnicalRiskModuleVisible('storitve', 'otherErpPsa')).toBe(false);
    expect(isTechnicalRiskModuleVisible('storitve', 'excelPaper')).toBe(false);
    expect(isTechnicalRiskModuleVisible('storitve', null)).toBe(false);
  });

  it('v računovodskem servisu velja isto pravilo z lastnimi id-ji sistemov', () => {
    expect(isTechnicalRiskModuleVisible('racunovodstvo', 'pantheonZajem')).toBe(true);
    expect(isTechnicalRiskModuleVisible('racunovodstvo', 'pantheonRocno')).toBe(true);
    expect(isTechnicalRiskModuleVisible('racunovodstvo', 'drugProgram')).toBe(false);
    expect(isTechnicalRiskModuleVisible('racunovodstvo', 'rocno')).toBe(false);
    expect(isTechnicalRiskModuleVisible('racunovodstvo', null)).toBe(false);
  });

  it('v splošnem segmentu velja isto pravilo z lastnimi id-ji sistemov', () => {
    // Odkar tudi splošni segment vpraša za sedanji sistem, ni več segmenta brez
    // konteksta: pravilo je zdaj enotno za VSE dejavnosti. Prej je bila prav ta
    // veja izjema, ki je opozorila kazala tudi tistim, ki PANTHEON-a nimajo.
    expect(isTechnicalRiskModuleVisible('splosno', 'pantheonPoln')).toBe(true);
    expect(isTechnicalRiskModuleVisible('splosno', 'pantheonDelno')).toBe(true);
    expect(isTechnicalRiskModuleVisible('splosno', 'otherErp')).toBe(false);
    expect(isTechnicalRiskModuleVisible('splosno', 'excelPaper')).toBe(false);
    expect(isTechnicalRiskModuleVisible('splosno', null)).toBe(false);
  });

  it('vsaka dejavnost ima kontekst — pravilo za modul E nima več izjeme', () => {
    for (const segmentId of SEGMENT_ORDER) {
      expect(getSegmentContext(segmentId), segmentId).toBeDefined();
    }
  });
});

describe('buildComputeContext', () => {
  it('ocenjena vrednost je sredina pasu in nikoli 0', () => {
    const context = buildComputeContext(EMPTY_PROFILE);
    expect(context.operationalHourCostEUR).toBeGreaterThan(0);
    expect(context.adminHourCostEUR).toBeGreaterThan(0);
  });
});

describe('assessConfidence', () => {
  const modules = [planiranje];
  const valuesWith = (overrides: Record<string, number>) => ({
    planiranje: resolveInputs(planiranje, overrides),
  });

  /**
   * Izidi so v assessConfidence UTEŽ po denarju področja, ne dodaten podatek. Zato
   * jih tu izpeljemo iz istih modulov, vrednosti in profila kot oceno samo — vpisan
   * seznam bi test spremenil v preverjanje uteži, ki v aplikaciji ne nastane.
   */
  function assess(params: Omit<AssessConfidenceParams, 'outputs'>): ConfidenceLevel {
    return assessConfidence({
      ...params,
      outputs: computeModules(params.modules, params.values, buildComputeContext(params.profile)),
    });
  }

  const allFilled = {
    waitingHoursPerMonth: 100,
    overtimeHoursPerMonth: 20,
    replanningHoursPerMonth: 40,
    mainCause: 0,
  };

  it('visoka: točni urni postavki, izpolnjena polja in znan vzrok', () => {
    const level = assess({
      context: PROIZVODNJA,
      profile: profileWith(EXACT_HOURS),
      modules,
      values: valuesWith(allFilled),
    });
    expect(level).toBe('high');
  });

  it('srednja: ena urna postavka je le ocenjen razpon', () => {
    const level = assess({
      context: PROIZVODNJA,
      profile: profileWith({
        operationalHour: { valueEUR: 50, estimated: true },
        adminHour: { valueEUR: 35, estimated: false },
      }),
      modules,
      values: valuesWith(allFilled),
    });
    expect(level).toBe('medium');
  });

  it('nizka: obe urni postavki sta ocenjeni', () => {
    const level = assess({
      context: PROIZVODNJA,
      profile: EMPTY_PROFILE,
      modules,
      values: valuesWith(allFilled),
    });
    expect(level).toBe('low');
  });

  it('nizka: večina številskih polj je praznih', () => {
    const level = assess({
      context: PROIZVODNJA,
      profile: profileWith(EXACT_HOURS),
      modules,
      values: valuesWith({ waitingHoursPerMonth: 100, mainCause: 0 }),
    });
    expect(level).toBe('low');
  });

  it('nedotaknjen drsnik s privzetkom nad 0 ne velja za izpolnjeno polje', () => {
    // napake ima dve polji s privzetkom nad 0 (delež napak, strošek napake). Če bi
    // se šteli med izpolnjena, bi obiskovalec, ki je vnesel samo število pošiljk,
    // dobil visoko zanesljivost — natanko obratno od resnice.
    const untouched = assess({
      context: LOGISTIKA,
      profile: profileWith(EXACT_HOURS),
      modules: [napake],
      values: { napake: resolveInputs(napake, { shipmentsPerMonth: 2_000, mainCause: 0 }) },
    });
    expect(untouched).toBe('low');

    const answered = assess({
      context: LOGISTIKA,
      profile: profileWith(EXACT_HOURS),
      modules: [napake],
      values: {
        napake: resolveInputs(napake, {
          shipmentsPerMonth: 2_000,
          errorSharePercent: 0.03,
          costPerErrorEUR: 60,
          annualDamageCostEUR: 18_000,
          claimHoursPerMonth: 30,
          mainCause: 0,
        }),
      },
    });
    expect(answered).toBe('high');
  });

  it('"Ne vemo" pri glavnem vzroku prepreči visoko zanesljivost', () => {
    const level = assess({
      context: PROIZVODNJA,
      profile: profileWith(EXACT_HOURS),
      modules,
      values: valuesWith({ ...allFilled, mainCause: 5 }),
    });
    expect(level).toBe('medium');
  });

  it('polja s contextOnly se ne štejejo med manjkajoče podatke', () => {
    // planningMethod je contextOnly; če bi se štel, bi izpolnjenost padla pod prag.
    const level = assess({
      context: PROIZVODNJA,
      profile: profileWith(EXACT_HOURS),
      modules,
      values: valuesWith(allFilled),
    });
    expect(level).toBe('high');
  });

  it('nedotaknjeno področje ne zniža oznake — prispeva 0 EUR, torej isto številko', () => {
    // Odkar je mogoče obkljukati vseh pet področij, bi štetje neizpolnjenih merilo
    // obiskovalčevo potrpežljivost in ne kakovosti podatkov: znesek je v obeh
    // primerih enak, oznaka pa ne bi bila.
    const onlyAnswered = assess({
      context: PROIZVODNJA,
      profile: profileWith(EXACT_HOURS),
      modules: [planiranje],
      values: valuesWith(allFilled),
    });

    const withUntouched = assess({
      context: PROIZVODNJA,
      profile: profileWith(EXACT_HOURS),
      modules: [planiranje, material],
      values: {
        ...valuesWith(allFilled),
        material: resolveInputs(material, {}),
      },
    });

    expect(onlyAnswered).toBe('high');
    expect(withUntouched).toBe(onlyAnswered);
  });

  it('obrazec, kjer je vse na privzetkih, ostane nizka zanesljivost', () => {
    const level = assess({
      context: PROIZVODNJA,
      profile: profileWith(EXACT_HOURS),
      modules: [planiranje, material],
      values: {
        planiranje: resolveInputs(planiranje, {}),
        material: resolveInputs(material, {}),
      },
    });
    expect(level).toBe('low');
  });

  it('drugo izpolnjeno področje z manjkajočimi podatki oznako še vedno zniža', () => {
    // Preskok velja samo za povsem nedotaknjena področja. Kdor se področja dotakne
    // in ga pusti na pol, mora oznako znižati — sicer bi preskok postal izhod v sili.
    const level = assess({
      context: PROIZVODNJA,
      profile: profileWith(EXACT_HOURS),
      modules: [planiranje, material],
      values: {
        ...valuesWith(allFilled),
        material: resolveInputs(material, { annualMaterialSpendEUR: 500_000 }),
      },
    });
    expect(level).not.toBe('high');
  });

  it('dejavnost s tremi urnimi postavkami se ocenjuje po razmerju, ne po števcu', () => {
    // Storitve vprašajo tri postavke. Staro pravilo "dve ocenjeni → nizka" bi
    // podjetje z dvema pravima in eno ugibano vrglo na 'low', proizvodno z enim
    // ugibanjem od dveh pa pustilo na 'medium' — enak delež, različna kazen.
    const modulesSt = [obracun];
    const values = {
      obracun_storitve: resolveInputs(obracun, {
        unbilledHoursPerMonth: 40,
        timesheetHoursPerMonth: 25,
        creditNoteCostEUR: 12_000,
        mainCause: 0,
      }),
    };
    const exact = { valueEUR: 50, estimated: false };

    const oneGuessed = assess({
      context: STORITVE,
      profile: {
        ...emptyProfileFor(STORITVE),
        operationalHour: exact,
        adminHour: exact,
        chargeOutRate: { valueEUR: 80, estimated: true },
      },
      modules: modulesSt,
      values,
    });
    expect(oneGuessed).toBe('medium');

    const allExact = assess({
      context: STORITVE,
      profile: {
        ...emptyProfileFor(STORITVE),
        operationalHour: exact,
        adminHour: exact,
        chargeOutRate: { valueEUR: 80, estimated: false },
      },
      modules: modulesSt,
      values,
    });
    expect(allExact).toBe('high');

    // Vse tri ugibane → nizka, enako kot dve od dveh pri proizvodnji.
    const allGuessed = assess({
      context: STORITVE,
      profile: emptyProfileFor(STORITVE),
      modules: modulesSt,
      values,
    });
    expect(allGuessed).toBe('low');
  });

  it('zaračunane postavke ne šteje dejavnosti, ki je ne vpraša', () => {
    // Proizvodni profil ima chargeOutRate vedno označen kot ocenjen. Če bi se štel,
    // bi bila najboljša dosegljiva ocena proizvodnje 'medium' namesto 'high'.
    const level = assess({
      context: PROIZVODNJA,
      profile: profileWith(EXACT_HOURS),
      modules,
      values: valuesWith(allFilled),
    });
    expect(level).toBe('high');
  });
});

describe('aggregateResults', () => {
  it('brez pasu izboljšave potenciala ne izračuna — kartica se ne prikaže', () => {
    const totals = aggregateResults([
      output({ bucket: 'directLoss', valueEUR: 10_000, addressableShare: 0.75 }),
    ]);
    expect(totals.potential).toBeUndefined();
    expect(totals.confidence).toBeUndefined();
    expect(totals.directLossEUR).toBe(10_000);
  });

  it('sešteje koše in doda potencial, kadar je pas podan', () => {
    const outputs = computeModules(
      [planiranje, material],
      {
        planiranje: { waitingHoursPerMonth: 100, mainCause: 0 },
        material: { annualMaterialSpendEUR: 1_000_000, scrapSharePercent: 0.03, mainCause: 0 },
      },
      // Prihodek in marža v tem scenariju ne nastopata (planiranje in material ju ne
      // berete), zato 0 — izmišljen promet bi v vsoto vnesel znesek brez podlage.
      {
        operationalHourCostEUR: 50,
        adminHourCostEUR: 35,
        chargeOutRateEUR: 75,
        annualRevenueEUR: 0,
        contributionMarginRate: 0,
      },
    );

    const totals = aggregateResults(outputs, {
      band: improvementBandFor(PROIZVODNJA, 'excelPaper'),
      confidence: 'medium',
    });

    expect(totals.directLossEUR).toBeGreaterThan(0);
    expect(totals.capacityEUR).toBeGreaterThan(0);
    expect(totals.potential!.minEUR).toBeGreaterThan(0);
    expect(totals.potential!.minEUR).toBeLessThan(totals.potential!.maxEUR);
    expect(totals.potential!.maxEUR).toBeLessThan(totals.directLossEUR + totals.capacityEUR);
    expect(totals.confidence).toBe('medium');
  });
});
