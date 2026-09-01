import { describe, it, expect } from 'vitest';
import {
  diagnostikaLogistika,
  dokumentacija,
  napake,
  obracun,
  skladisce,
  terjatve,
  vozniki,
} from './logistika';
import { ADDRESSABLE_SHARE } from './addressableShare';
import type { ComputeContext, ModuleDefinition, ModuleOutputDraft } from './moduleTypes';
import { resolveInputs } from '../../lib/moduleEngine';
import { reducibleShareOf } from './shared';

/**
 * Testi držijo iste tri lastnosti kot pri proizvodnji: postavka je v natanko enem
 * košu, compute() vrne dejanski sedanji strošek (ne stroška, vnaprej pomnoženega
 * z domnevnim deležem izboljšave), in ista ura se ne pojavi v dveh področjih.
 */

const CONTEXT: ComputeContext = {
  operationalHourCostEUR: 19,
  adminHourCostEUR: 25,
  chargeOutRateEUR: 55,
  // 3.650.000 / 365 = natanko 10.000 EUR dnevnega prometa — obe področji, ki
  // množita dneve (obracun_logistika, terjatve_logistika), tako preverjamo brez
  // zaokroževanja. Marže moduli tega segmenta ne berejo.
  annualRevenueEUR: 3_650_000,
  contributionMarginRate: 0,
  capitalCostRate: 0.06,
};
const MONTHS = 12;
const DAILY_REVENUE = CONTEXT.annualRevenueEUR / 365;

function run(definition: ModuleDefinition, overrides: Record<string, number> = {}): ModuleOutputDraft[] {
  return definition.compute(resolveInputs(definition, overrides), CONTEXT);
}

/** Testi naj se ne opirajo na vrstni red izidov v tabeli. */
function pick(outputs: ModuleOutputDraft[], label: string): ModuleOutputDraft {
  const found = outputs.find((output) => output.label === label);
  if (!found) throw new Error(`Ni izida z oznako "${label}"`);
  return found;
}

const COSTED_MODULES = [obracun, vozniki, terjatve, dokumentacija, napake, skladisce];

describe('Obračun prevozov in nezaračunane storitve', () => {
  const outputs = run(obracun, {
    unbilledExtrasEUR: 12_000,
    invoiceLagDays: 10,
    pricingErrorEUR: 4_500,
    billingHoursPerMonth: 30,
    penaltyStojnineEUR: 9_000,
    mainCause: 0, // Dokazila pridejo z zamikom → data
  });

  it('nezaračunan dodatek je neposredna izguba in ne nezaslužena marža', () => {
    const item = pick(outputs, 'Nezaračunani dodatki in čakanja');
    expect(item.bucket).toBe('directLoss');
    expect(item.valueEUR).toBe(12_000);
    expect(item.addressableShare).toBe(ADDRESSABLE_SHARE.data);
  });

  it('dnevi do izdaje računa se vrednotijo po strošku financiranja', () => {
    const item = pick(outputs, 'Denar, vezan v prepozno izdanih računih');
    expect(item.bucket).toBe('directLoss');
    expect(item.valueEUR).toBe(DAILY_REVENUE * 10 * CONTEXT.capitalCostRate);
  });

  it('napačno zaračunani prevozi so ločena postavka', () => {
    expect(pick(outputs, 'Napačno zaračunani prevozi').valueEUR).toBe(4_500);
  });

  it('ure obračuna gredo po administrativni uri in nosijo hoursPerMonth', () => {
    const item = pick(outputs, 'Priprava obračuna prevozov');
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(30 * CONTEXT.adminHourCostEUR * MONTHS);
    expect(item.hoursPerMonth).toBe(30);
  });

  it('brez odgovora o prihodku ne nastane znesek iz dni', () => {
    const [item] = obracun
      .compute(resolveInputs(obracun, { invoiceLagDays: 30 }), { ...CONTEXT, annualRevenueEUR: 0 })
      .filter((output) => output.label === 'Denar, vezan v prepozno izdanih računih');
    expect(item.valueEUR).toBe(0);
  });

  it('penali in stojnine ne dodajo nobene postavke', () => {
    // PANTHEON zamude ne prepreči, zato znesek ostane izven izračuna. Vprašanje
    // je vseeno postavljeno — prodajnik mora obseg težave videti.
    expect(outputs).toHaveLength(4);
    const withoutPenalty = run(obracun, {
      unbilledExtrasEUR: 12_000,
      invoiceLagDays: 10,
      pricingErrorEUR: 4_500,
      billingHoursPerMonth: 30,
      mainCause: 0,
    });
    expect(outputs.map((output) => output.valueEUR)).toEqual(
      withoutPenalty.map((output) => output.valueEUR),
    );
  });
});

describe('Vozniki, potni nalogi in dnevnice', () => {
  const outputs = run(vozniki, {
    travelOrderHoursPerMonth: 30,
    driverTimesheetHoursPerMonth: 12,
    payrollHoursPerMonth: 8,
    annualPayrollCorrectionEUR: 1_500,
    driverCount: 20,
    mainCause: 0, // Potni nalogi na papirju → data
  });

  it('tri vrste pisarniškega dela so ločene postavke po administrativni uri', () => {
    expect(pick(outputs, 'Potni nalogi in obračun dnevnic').valueEUR).toBe(
      30 * CONTEXT.adminHourCostEUR * MONTHS,
    );
    expect(pick(outputs, 'Evidence delovnega časa voznikov').valueEUR).toBe(
      12 * CONTEXT.adminHourCostEUR * MONTHS,
    );
    expect(pick(outputs, 'Priprava in popravki obračuna plač').valueEUR).toBe(
      8 * CONTEXT.adminHourCostEUR * MONTHS,
    );
    for (const label of [
      'Potni nalogi in obračun dnevnic',
      'Evidence delovnega časa voznikov',
      'Priprava in popravki obračuna plač',
    ]) {
      expect(pick(outputs, label).bucket).toBe('capacity');
    }
  });

  it('strošek napačnih obračunov je neposredna izguba', () => {
    const item = pick(outputs, 'Stroški napačnih obračunov dnevnic in plač');
    expect(item.bucket).toBe('directLoss');
    expect(item.valueEUR).toBe(1_500);
    expect(item.addressableShare).toBe(ADDRESSABLE_SHARE.data);
  });
});

describe('Plačilni roki in terjatve', () => {
  const outputs = run(terjatve, {
    currentDSODays: 75,
    overdueDaysAverage: 15,
    dunningHoursPerMonth: 17,
    annualBadDebtEUR: 8_000,
    mainCause: 4, // Naročniki plačujejo po svojem ritmu → external
  });

  it('šteje se samo prekoračitev nad dogovorjenim rokom', () => {
    const item = pick(outputs, 'Strošek zamud pri plačilih');
    expect(item.valueEUR).toBe(DAILY_REVENUE * 15 * CONTEXT.capitalCostRate);
    expect(item.addressableShare).toBe(ADDRESSABLE_SHARE.external);
  });

  it('opominjanje je kapaciteta, odpis pa neposredna izguba', () => {
    const dunning = pick(outputs, 'Opominjanje in izterjava');
    expect(dunning.bucket).toBe('capacity');
    expect(dunning.valueEUR).toBe(17 * CONTEXT.adminHourCostEUR * MONTHS);
    expect(pick(outputs, 'Odpisane terjatve').bucket).toBe('directLoss');
  });
});

describe('Prevozna dokumentacija, podatki in statusi', () => {
  const outputs = run(dokumentacija, {
    documentHoursPerMonth: 20,
    retypingHoursPerMonth: 28,
    dataFixHoursPerMonth: 10,
    statusHoursPerMonth: 21,
    podTiming: 3,
    mainCause: 1, // Listine so papirne → data
  });

  it('štiri vrste dela, vse kapaciteta po administrativni uri', () => {
    expect(outputs).toHaveLength(4);
    expect(outputs.every((output) => output.bucket === 'capacity')).toBe(true);
    const total = outputs.reduce((sum, output) => sum + (output.valueEUR ?? 0), 0);
    expect(total).toBe((20 + 28 + 10 + 21) * CONTEXT.adminHourCostEUR * MONTHS);
  });

  it('obveščanje o statusih je svoja postavka in ne del priprave listin', () => {
    const item = pick(outputs, 'Obveščanje o statusih in zamudah');
    expect(item.valueEUR).toBe(21 * CONTEXT.adminHourCostEUR * MONTHS);
    expect(item.hoursPerMonth).toBe(21);
  });
});

describe('Napačne dostave, poškodbe in reklamacije', () => {
  const outputs = run(napake, {
    shipmentsPerMonth: 5_000,
    errorSharePercent: 0.012,
    costPerErrorEUR: 90,
    annualDamageCostEUR: 12_000,
    claimHoursPerMonth: 15,
    mainCause: 0, // Podatki o pošiljki nepopolni → data
  });

  it('dve neposredni izgubi in ena kapaciteta po administrativni uri', () => {
    expect(pick(outputs, 'Napačne in nepopolne dostave').valueEUR).toBeCloseTo(
      5_000 * 0.012 * 90 * MONTHS,
      6,
    );
    expect(pick(outputs, 'Poškodovano in izgubljeno blago').valueEUR).toBe(12_000);
    const claims = pick(outputs, 'Reševanje reklamacij in iskanje pošiljk');
    expect(claims.bucket).toBe('capacity');
    expect(claims.valueEUR).toBe(15 * CONTEXT.adminHourCostEUR * MONTHS);
  });

  it('poškodbe pri prevozu so fizičen vzrok in zato najmanj naslovljive', () => {
    const physical = run(napake, { annualDamageCostEUR: 10_000, mainCause: 4 });
    expect(pick(physical, 'Poškodovano in izgubljeno blago').addressableShare).toBe(
      ADDRESSABLE_SHARE.physical,
    );
  });
});

describe('Skladiščne operacije in zaloga', () => {
  const outputs = run(skladisce, {
    searchHoursPerMonth: 80,
    inventoryValueEUR: 200_000,
    annualWriteOffEUR: 15_000,
    reducibleShare: 1,
    stockVisibility: 2,
    mainCause: 0, // Lokacije niso ažurne → data
  });

  it('iskanje blaga gre po operativni uri, ne po administrativni', () => {
    const item = pick(outputs, 'Iskanje in prekladanje blaga');
    expect(item.valueEUR).toBe(80 * CONTEXT.operationalHourCostEUR * MONTHS);
    expect(item.hoursPerMonth).toBe(80);
  });

  it('sprostljiv kapital je enkraten in brez naslovljivega deleža', () => {
    const item = pick(outputs, 'Sprostljiv obratni kapital v zalogi');
    expect(item.bucket).toBe('oneTimeCapital');
    expect(item.valueEUR).toBe(200_000 * reducibleShareOf(1));
    expect(item.addressableShare).toBeUndefined();
  });

  it('brez lastne zaloge ni sprostljivega kapitala', () => {
    const foreign = run(skladisce, { inventoryValueEUR: 0, reducibleShare: 3 });
    expect(pick(foreign, 'Sprostljiv obratni kapital v zalogi').valueEUR).toBe(0);
  });
});

describe('Kratka diagnostika', () => {
  it('vrne natanko dve oceni tveganja in nobenega zneska', () => {
    const outputs = run(diagnostikaLogistika, {
      realtimeRecording: 0,
      knowsTripCost: 0,
      documentTraceability: 0,
      keyPersonIndependence: 0,
    });
    expect(outputs).toHaveLength(2);
    expect(outputs.every((output) => output.bucket === 'risk')).toBe(true);
    expect(outputs.every((output) => output.valueEUR === undefined)).toBe(true);
    expect(outputs.every((output) => output.riskLevel === 'low')).toBe(true);
  });

  it('sami odgovori "Ne" dajo visoko tveganje', () => {
    const outputs = run(diagnostikaLogistika, {
      realtimeRecording: 3,
      knowsTripCost: 3,
      documentTraceability: 3,
      keyPersonIndependence: 3,
    });
    expect(outputs.every((output) => output.riskLevel === 'high')).toBe(true);
  });

  it('nima triaže, zato se prikaže vedno', () => {
    expect(diagnostikaLogistika.triage).toBeUndefined();
  });
});

describe('Skupne lastnosti področij', () => {
  it('vsako stroškovno področje ima pet ali šest vprašanj', () => {
    for (const definition of COSTED_MODULES) {
      expect(definition.fields.length, definition.id).toBeGreaterThanOrEqual(5);
      expect(definition.fields.length, definition.id).toBeLessThanOrEqual(6);
    }
  });

  it('neodgovorjen glavni vzrok pade na konservativni delež', () => {
    for (const definition of COSTED_MODULES) {
      const withShare = run(definition).filter((output) => output.addressableShare !== undefined);
      expect(withShare.length, definition.id).toBeGreaterThan(0);
      for (const output of withShare) {
        expect(output.addressableShare, `${definition.id}/${output.label}`).toBe(
          ADDRESSABLE_SHARE.unknown,
        );
      }
    }
  });

  it('kontekstna vprašanja ne premaknejo nobene številke', () => {
    const scenarios: { definition: ModuleDefinition; key: string }[] = [
      { definition: obracun, key: 'penaltyStojnineEUR' },
      { definition: vozniki, key: 'driverCount' },
      { definition: terjatve, key: 'currentDSODays' },
      { definition: dokumentacija, key: 'podTiming' },
      { definition: skladisce, key: 'stockVisibility' },
    ];

    for (const { definition, key } of scenarios) {
      const low = run(definition, { [key]: 0 }).map((output) => output.valueEUR);
      const high = run(definition, { [key]: 99_000 }).map((output) => output.valueEUR);
      expect(high, `${definition.id}/${key}`).toEqual(low);
    }
  });

  it('ista oznaka ne pristane v dveh koših', () => {
    const seen = new Map<string, string>();
    for (const definition of COSTED_MODULES) {
      for (const output of run(definition)) {
        const previous = seen.get(output.label);
        if (previous) expect(previous, output.label).toBe(output.bucket);
        seen.set(output.label, output.bucket);
      }
    }
  });

  it('operativne in administrativne ure se ne mešajo v isti postavki', () => {
    const warehouse = pick(
      run(skladisce, { searchHoursPerMonth: 80 }),
      'Iskanje in prekladanje blaga',
    );
    const billing = pick(
      run(obracun, { billingHoursPerMonth: 80 }),
      'Priprava obračuna prevozov',
    );
    expect(warehouse.valueEUR).toBe(80 * CONTEXT.operationalHourCostEUR * MONTHS);
    expect(billing.valueEUR).toBe(80 * CONTEXT.adminHourCostEUR * MONTHS);
    expect(warehouse.valueEUR).not.toBe(billing.valueEUR);
  });
});
