import { describe, it, expect } from 'vitest';
import {
  calculateModuleA,
  calculateModuleB,
  calculateModuleC,
  calculateModuleD,
  calculateAccountingCapacity,
  calculateTotalAnnualLoss,
} from './calculations';

describe('Modul A — ročno delo', () => {
  it('validacijski primer 1: 800 dok/mes, 3 min, 25 EUR/h -> 12.000 EUR/leto', () => {
    const r = calculateModuleA({ documentsPerMonth: 800, minutesPerDocument: 3, hourlyLaborCostEUR: 25 });
    expect(r.hoursFreedPerMonth).toBeCloseTo(40);
    expect(r.annualEUR).toBeCloseTo(12000);
  });

  it('validacijski primer 2 (servis, razpon): 100 strank x 80 dok = 8.000 dok/mes, 45-90 s/dok', () => {
    const lowMinutes = 45 / 60;
    const highMinutes = 90 / 60;
    const low = calculateModuleA({ documentsPerMonth: 8000, minutesPerDocument: lowMinutes, hourlyLaborCostEUR: 22 });
    const high = calculateModuleA({ documentsPerMonth: 8000, minutesPerDocument: highMinutes, hourlyLaborCostEUR: 30 });
    expect(low.hoursFreedPerMonth).toBeCloseTo(100);
    expect(high.hoursFreedPerMonth).toBeCloseTo(200);
    expect(low.annualEUR).toBeCloseTo(26400); // znotraj 26.000-72.000 razpona
    expect(high.annualEUR).toBeCloseTo(72000);
  });

  it('validacijski primer 4 (distributer): 20.000 naročil x 3 min -> 1.000 h', () => {
    const r = calculateModuleA({ documentsPerMonth: 20000, minutesPerDocument: 3, hourlyLaborCostEUR: 25 });
    expect(r.hoursFreedPerMonth).toBeCloseTo(1000);
  });
});

describe('Modul B — napake', () => {
  it('izračuna letni strošek napak', () => {
    const r = calculateModuleB({ transactionsPerMonth: 20000, errorRatePercent: 0.015, costPerErrorEUR: 25 });
    expect(r.annualEUR).toBeCloseTo(90000);
  });
});

describe('Modul C — vezan kapital v zalogah', () => {
  it('validacijski primer 3: zaloge 400.000 EUR, -15% -> 60.000 EUR sproščenega kapitala', () => {
    const r = calculateModuleC({ inventoryValueEUR: 400000, achievableReductionPercent: 0.15, capitalCostPercent: 0.1 });
    expect(r.releasedCapitalEUR).toBeCloseTo(60000);
    expect(r.annualEUR).toBeCloseTo(6000);
  });

  it('validacijski primer 4 (distributer): zaloge 1,5 mio EUR, -4% -> 60.000 EUR', () => {
    const r = calculateModuleC({ inventoryValueEUR: 1_500_000, achievableReductionPercent: 0.04, capitalCostPercent: 0.1 });
    expect(r.releasedCapitalEUR).toBeCloseTo(60000);
  });

  it('sproščenega kapitala nikoli ne enači z letnim zneskom (dvojni, ločen prikaz)', () => {
    const r = calculateModuleC({ inventoryValueEUR: 400000, achievableReductionPercent: 0.15, capitalCostPercent: 0.1 });
    expect(r.annualEUR).not.toBeCloseTo(r.releasedCapitalEUR);
  });
});

describe('Modul D — počasen denarni tok', () => {
  it('izračuna letni oportunitetni strošek iz ciljnega skrajšanja DSO', () => {
    const r = calculateModuleD({
      annualRevenueEUR: 1_200_000,
      currentDSODays: 60,
      targetReductionDays: 5,
      opportunityCostPercent: 0.06,
    });
    expect(r.annualEUR).toBeCloseTo((1_200_000 / 365) * 5 * 0.06);
  });
});

describe('Kapaciteta za računovodski servis (posebnost modula A)', () => {
  it('dodatne stranke = sproščene ure / ure na stranko', () => {
    const hoursFreed = calculateModuleA({ documentsPerMonth: 8000, minutesPerDocument: 1, hourlyLaborCostEUR: 25 }).hoursFreedPerMonth;
    expect(calculateAccountingCapacity(hoursFreed, 8)).toBeCloseTo(hoursFreed / 8);
  });
});

describe('Skupna letna izguba', () => {
  it('C prispeva v skupno vsoto samo z annualEUR, ne z releasedCapitalEUR', () => {
    const c = calculateModuleC({ inventoryValueEUR: 400000, achievableReductionPercent: 0.15, capitalCostPercent: 0.1 });
    const total = calculateTotalAnnualLoss({ C: c });
    expect(total).toBeCloseTo(6000);
  });
});
