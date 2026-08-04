import { describe, it, expect } from 'vitest';
import { aggregateBuckets } from '../../lib/moduleEngine';
import { marza, material, nalogi, planiranje, sledljivost, zaloge, zamude } from './proizvodnja';
import type { BucketId, ModuleOutputDraft } from './moduleTypes';

/** Izid določenega koša in oznake — testi naj se ne opirajo na vrstni red v tabeli. */
function pick(outputs: ModuleOutputDraft[], bucket: BucketId, label: string): ModuleOutputDraft {
  const found = outputs.find((output) => output.bucket === bucket && output.label === label);
  if (!found) throw new Error(`Manjka izid "${label}" v košu ${bucket}`);
  return found;
}

describe('Modul 1: planiranje proizvodnje in zastoji', () => {
  const outputs = planiranje.compute({
    planningMethod: 0.45, // Excel
    productionHoursPerMonth: 2000,
    waitingHoursPerMonth: 100,
    overtimeHoursPerMonth: 40,
    reschedulesPerMonth: 20,
    productionHourCostEUR: 50,
  });

  it('zastoji gredo v kapaciteto, ne med neposredne izgube', () => {
    // 100 h × 50 EUR × 12 × 0,45
    const zastoji = pick(outputs, 'capacity', 'Zastoji proizvodnje');
    expect(zastoji.valueEUR).toBeCloseTo(27000, 6);
    expect(zastoji.hoursPerMonth).toBeCloseTo(45, 6);
  });

  it('nadure so neposredna izguba, s 30 % pribitkom', () => {
    // 40 h × 50 EUR × 1,3 × 12 × 0,45
    expect(pick(outputs, 'directLoss', 'Nadure zaradi sprememb plana').valueEUR).toBeCloseTo(14040, 6);
  });

  it('prestavljanje nalogov stane pol ure nastavitve na nalog', () => {
    // 20 × 0,5 h × 50 EUR × 12 × 0,45
    expect(
      pick(outputs, 'directLoss', 'Dodatne menjave in prestavljanje nalogov').valueEUR,
    ).toBeCloseTo(2700, 6);
  });

  it('ur čakanja ne more biti več, kot je proizvodnih ur', () => {
    const capped = planiranje.compute({
      planningMethod: 0.45,
      productionHoursPerMonth: 2000,
      waitingHoursPerMonth: 3000, // tipkarska napaka
      overtimeHoursPerMonth: 0,
      reschedulesPerMonth: 0,
      productionHourCostEUR: 50,
    });
    // Omejeno na 2000 h: 2000 × 50 × 12 × 0,45
    expect(pick(capped, 'capacity', 'Zastoji proizvodnje').valueEUR).toBeCloseTo(540000, 6);
  });

  it('boljše planiranje zniža izgubo pri enakih vnosih', () => {
    const withMrp = planiranje.compute({
      planningMethod: 0.15,
      productionHoursPerMonth: 2000,
      waitingHoursPerMonth: 100,
      overtimeHoursPerMonth: 40,
      reschedulesPerMonth: 20,
      productionHourCostEUR: 50,
    });
    const totalMrp = aggregateBuckets(withMrp.map((o) => ({ ...o, moduleId: 'planiranje' })));
    const totalExcel = aggregateBuckets(outputs.map((o) => ({ ...o, moduleId: 'planiranje' })));

    expect(totalMrp.directLossEUR).toBeLessThan(totalExcel.directLossEUR);
  });
});

describe('Modul 2: material, izmet in dodelave', () => {
  const outputs = material.compute({
    annualMaterialValueEUR: 2000000,
    scrapRatePercent: 0.03,
    reworkHoursPerMonth: 60,
    bomDeviation: 0.2, // redko
    annualClaimsCostEUR: 30000,
    hourlyLaborCostEUR: 28,
  });

  it('izmet šteje samo realistično izboljšljiv delež, ne celote', () => {
    // 2.000.000 × 3 % = 60.000 EUR izmeta, od tega izboljšljivih 20 %
    expect(pick(outputs, 'directLoss', 'Izmet materiala').valueEUR).toBeCloseTo(12000, 6);
  });

  it('reklamacije so neposredna izguba', () => {
    expect(pick(outputs, 'directLoss', 'Reklamacije in vračila').valueEUR).toBeCloseTo(6000, 6);
  });

  it('ure dodelav so kapaciteta, ne neposredna izguba', () => {
    // 60 h × 28 EUR × 12 × 0,2
    const dodelave = pick(outputs, 'capacity', 'Dodelave in ponovna izdelava');
    expect(dodelave.valueEUR).toBeCloseTo(4032, 6);
    expect(dodelave.hoursPerMonth).toBeCloseTo(12, 6);
  });
});

describe('Modul 3: zaloge in pomanjkanje materiala', () => {
  const outputs = zaloge.compute({
    rawMaterialValueEUR: 300000,
    wipValueEUR: 100000,
    finishedGoodsValueEUR: 200000,
    obsoleteStockValueEUR: 50000,
    annualWriteOffEUR: 20000,
    stockoutsPerMonth: 4,
    emergencyPurchasesPerMonth: 6,
    stockVisibility: 0.06, // delen pregled
    capitalCostPercent: 0.1,
  });

  // kazen zaradi zastojev = max(0,5; 1 − 4/20) = 0,8 → delež znižanja 0,06 × 0,8 = 0,048
  // sproščeno = 600.000 × 0,048 + 50.000 × 0,5 = 28.800 + 25.000 = 53.800
  it('sproščen kapital združi znižanje zalog in unovčenje nekurantnih', () => {
    expect(pick(outputs, 'oneTimeCapital', 'Enkratno sprostljiv kapital v zalogah').valueEUR).toBeCloseTo(
      53800,
      6,
    );
  });

  it('letni strošek je strošek kapitala plus izogibljivi odpisi', () => {
    // 53.800 × 10 % + 20.000 × min(0,5; 0,048 × 4)
    expect(pick(outputs, 'directLoss', 'Letni strošek presežnih zalog in odpisov').valueEUR).toBeCloseTo(
      9220,
      6,
    );
  });

  it('pogosti zastoji znižajo delež, za katerega je zaloge realno mogoče zmanjšati', () => {
    const manyStockouts = zaloge.compute({
      rawMaterialValueEUR: 300000,
      wipValueEUR: 100000,
      finishedGoodsValueEUR: 200000,
      obsoleteStockValueEUR: 0,
      annualWriteOffEUR: 0,
      stockoutsPerMonth: 20,
      emergencyPurchasesPerMonth: 0,
      stockVisibility: 0.06,
      capitalCostPercent: 0.1,
    });
    // kazen doseže spodnjo mejo 0,5 → 600.000 × 0,03
    expect(
      pick(manyStockouts, 'oneTimeCapital', 'Enkratno sprostljiv kapital v zalogah').valueEUR,
    ).toBeCloseTo(18000, 6);
  });

  it('nujne nabave se v tem modulu ne ovrednotijo (štejejo se v modulu Zamude)', () => {
    const withEmergencies = zaloge.compute({
      rawMaterialValueEUR: 300000,
      wipValueEUR: 100000,
      finishedGoodsValueEUR: 200000,
      obsoleteStockValueEUR: 50000,
      annualWriteOffEUR: 20000,
      stockoutsPerMonth: 4,
      emergencyPurchasesPerMonth: 99,
      stockVisibility: 0.06,
      capitalCostPercent: 0.1,
    });
    expect(pick(withEmergencies, 'directLoss', 'Letni strošek presežnih zalog in odpisov').valueEUR).toBe(
      pick(outputs, 'directLoss', 'Letni strošek presežnih zalog in odpisov').valueEUR,
    );
  });
});

describe('Modul 4: delovni nalogi in ročno poročanje', () => {
  const outputs = nalogi.compute({
    workOrdersPerMonth: 400,
    minutesPerWorkOrder: 20,
    rekeyingPeople: 2,
    rekeyingHoursPerPerson: 10,
    realtimeReporting: 0.5, // naslednji dan
    reconciliationHoursPerMonth: 15,
    hourlyLaborCostEUR: 28,
  });

  it('sešteje pripravo nalogov, prepisovanje in usklajevanje v kapaciteto', () => {
    // 400 × 20 min = 133,33 h + 2 × 10 h + 15 h = 168,33 h; × 28 EUR × 12 × 0,5
    const izid = pick(outputs, 'capacity', 'Ročno delo z nalogi in poročanjem');
    expect(izid.valueEUR).toBeCloseTo(28280, 6);
    expect(izid.hoursPerMonth).toBeCloseTo(84.16667, 4);
  });

  it('ne prispeva nič k neposrednim izgubam', () => {
    expect(outputs.every((output) => output.bucket === 'capacity')).toBe(true);
  });
});

describe('Modul 5: zamude in nujni stroški', () => {
  const outputs = zamude.compute({
    lateOrdersPerMonth: 12,
    annualExpeditingCostEUR: 40000,
    deadlineOvertimeHoursPerMonth: 30,
    annualPenaltiesEUR: 25000,
    replanningHoursPerMonth: 20,
    hourlyLaborCostEUR: 28,
  });

  it('ekspresne nabave in penali so neposredna izguba', () => {
    expect(pick(outputs, 'directLoss', 'Ekspresne nabave in dostave').valueEUR).toBeCloseTo(14000, 6);
    expect(pick(outputs, 'directLoss', 'Penali, popusti in odpovedana naročila').valueEUR).toBeCloseTo(
      8750,
      6,
    );
  });

  it('nadure zaradi rokov nosijo 30 % pribitek', () => {
    // 30 h × 28 EUR × 1,3 × 12 × 0,35
    expect(pick(outputs, 'directLoss', 'Nadure zaradi lovljenja rokov').valueEUR).toBeCloseTo(4586.4, 4);
  });

  it('ponovno planiranje je kapaciteta', () => {
    const izid = pick(outputs, 'capacity', 'Ponovno planiranje in obveščanje kupcev');
    expect(izid.valueEUR).toBeCloseTo(2352, 6);
    expect(izid.hoursPerMonth).toBeCloseTo(7, 6);
  });

  it('število zamujenih naročil ne vstopa v izračun', () => {
    const more = zamude.compute({
      lateOrdersPerMonth: 500,
      annualExpeditingCostEUR: 40000,
      deadlineOvertimeHoursPerMonth: 30,
      annualPenaltiesEUR: 25000,
      replanningHoursPerMonth: 20,
      hourlyLaborCostEUR: 28,
    });
    expect(more).toEqual(outputs);
  });
});

describe('Diagnostična modula', () => {
  it('marža vrne pas in nikoli zneska v košu z evri', () => {
    const outputs = marza.compute({
      knowsCostPerProduct: 3,
      knowsCostPerWorkOrder: 3,
      deviationDetectionSpeed: 3,
      annualRevenueEUR: 5000000,
    });

    expect(outputs).toHaveLength(1);
    expect(outputs[0].bucket).toBe('risk');
    expect(outputs[0].valueEUR).toBeUndefined();
    expect(outputs[0].riskLevel).toBe('high');
    expect(outputs[0].note).toContain('3–6 % prihodkov');
  });

  it('marža ob urejenih kalkulacijah pade na nizko tveganje', () => {
    const outputs = marza.compute({
      knowsCostPerProduct: 0,
      knowsCostPerWorkOrder: 0,
      deviationDetectionSpeed: 0,
      annualRevenueEUR: 5000000,
    });
    expect(outputs[0].riskLevel).toBe('low');
  });

  it('marža brez podatka o prihodkih navede samo odstotke', () => {
    const outputs = marza.compute({
      knowsCostPerProduct: 3,
      knowsCostPerWorkOrder: 3,
      deviationDetectionSpeed: 3,
      annualRevenueEUR: 0,
    });
    expect(outputs[0].note).not.toContain('EUR');
  });

  it('sledljivost vrne oceno tveganja brez evrov', () => {
    const high = sledljivost.compute({
      batchLotTracking: 3,
      materialOrigin: 3,
      keyPersonDependency: 3,
      claimRootCauseTime: 3,
    });
    expect(high[0].riskLevel).toBe('high');
    expect(high[0].valueEUR).toBeUndefined();

    const low = sledljivost.compute({
      batchLotTracking: 0,
      materialOrigin: 0,
      keyPersonDependency: 0,
      claimRootCauseTime: 0,
    });
    expect(low[0].riskLevel).toBe('low');
  });
});
