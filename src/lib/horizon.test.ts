import { describe, expect, it } from 'vitest';
import {
  HORIZON_YEARS,
  MIN_POTENTIAL_FOR_PAYBACK_EUR,
  monthsLabel,
  multiYearEUR,
  PAYBACK_TIERS_EUR,
  paybackMonths,
  perMonthEUR,
  perWorkingDayEUR,
  WORKING_DAYS_PER_YEAR,
  yearsLabel,
} from './horizon';

describe('večletni pogled', () => {
  it('je gola multiplikacija — brez rasti, inflacije in diskontiranja', () => {
    expect(multiYearEUR(71_452)).toBe(71_452 * HORIZON_YEARS);
    expect(multiYearEUR(71_452, 5)).toBe(357_260);
  });

  it('ničle ne spremeni v znesek', () => {
    expect(multiYearEUR(0)).toBe(0);
  });
});

describe('cena odlašanja', () => {
  it('dnevni ekvivalent deli z delovnimi in ne s koledarskimi dnevi', () => {
    expect(perWorkingDayEUR(71_452)).toBeCloseTo(71_452 / WORKING_DAYS_PER_YEAR, 6);
    // Sidro, ki ga bralec preveri na pamet: ~283 EUR na delovni dan.
    expect(Math.round(perWorkingDayEUR(71_452))).toBe(284);
  });

  it('mesečni ekvivalent je dvanajstina letnega zneska', () => {
    expect(perMonthEUR(71_452)).toBeCloseTo(71_452 / 12, 6);
  });
});

describe('doba povračila', () => {
  it('pretvori razmerje investicije in letnega potenciala v mesece', () => {
    // 100.000 EUR pri 32.150 EUR letno ≈ 37 mesecev.
    expect(Math.round(paybackMonths(100_000, 32_150)!)).toBe(37);
    expect(paybackMonths(60_000, 60_000)).toBe(12);
  });

  it('brez potenciala vrne null in ne neskončnosti', () => {
    // "Infinity mesecev" na zaslonu je slabše od odsotnosti podatka.
    expect(paybackMonths(100_000, 0)).toBeNull();
    expect(paybackMonths(100_000, -5)).toBeNull();
    expect(paybackMonths(100_000, Number.NaN)).toBeNull();
  });

  it('brez investicije prav tako vrne null', () => {
    expect(paybackMonths(0, 32_150)).toBeNull();
  });

  it('stopnje so naraščajoče in prag potenciala pozitiven', () => {
    const ascending = [...PAYBACK_TIERS_EUR].sort((a, b) => a - b);
    expect(PAYBACK_TIERS_EUR).toEqual(ascending);
    expect(MIN_POTENTIAL_FOR_PAYBACK_EUR).toBeGreaterThan(0);
  });

  it('pri najnižjem smiselnem potencialu nobena stopnja ne pade v desetletja', () => {
    // Prag obstaja prav zato, da tabela ne postane argument proti sami sebi.
    const longest = paybackMonths(
      PAYBACK_TIERS_EUR[PAYBACK_TIERS_EUR.length - 1],
      MIN_POTENTIAL_FOR_PAYBACK_EUR,
    );
    expect(longest).not.toBeNull();
    expect(longest!).toBeLessThanOrEqual(12 * 12);
  });
});

describe('slovenska števna oblika', () => {
  it('mesece sklanja z dvojino', () => {
    expect(monthsLabel(1)).toBe('1 mesec');
    expect(monthsLabel(2)).toBe('2 meseca');
    expect(monthsLabel(3)).toBe('3 mesece');
    expect(monthsLabel(4)).toBe('4 mesece');
    expect(monthsLabel(5)).toBe('5 mesecev');
    expect(monthsLabel(37)).toBe('37 mesecev');
  });

  it('sklanjatev se ravna po ostanku pri sto, ne po zadnji števki', () => {
    expect(monthsLabel(101)).toBe('101 mesec');
    expect(monthsLabel(102)).toBe('102 meseca');
    expect(monthsLabel(104)).toBe('104 mesece');
    expect(monthsLabel(111)).toBe('111 mesecev');
  });

  it('zaokroži in nikoli ne vrne negativnega', () => {
    expect(monthsLabel(36.7)).toBe('37 mesecev');
    expect(monthsLabel(-3)).toBe('0 mesecev');
  });

  it('leta sklanja enako', () => {
    expect(yearsLabel(1)).toBe('1 leto');
    expect(yearsLabel(2)).toBe('2 leti');
    expect(yearsLabel(3)).toBe('3 leta');
    expect(yearsLabel(5)).toBe('5 let');
  });
});
