import { describe, it, expect } from 'vitest';
import {
  assessHoursPlausibility,
  hoursPlausibilityWarning,
  HOURS_PER_EMPLOYEE_PER_MONTH,
  PLAUSIBLE_CAPACITY_SHARE,
} from './plausibility';
import { UNKNOWN_ANSWER, type ModuleDefinition } from '../config/modules/moduleTypes';
import { ALL_MODULES } from '../config/modules';

/** Minimalen modul z urnimi polji — compute ni predmet teh testov. */
const MODULE: ModuleDefinition = {
  id: 'testni',
  title: 'Testni',
  summary: '',
  fields: [
    { key: 'monthly', label: 'Ure na mesec', kind: 'number', unit: 'h/mesec', default: 0 },
    { key: 'yearly', label: 'Ure na leto', kind: 'number', unit: 'h/leto', default: 0 },
    {
      key: 'context',
      label: 'Kontekstne ure',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      contextOnly: true,
    },
    { key: 'money', label: 'Znesek', kind: 'number', unit: 'EUR/leto', default: 0 },
  ],
  compute: () => [],
  pantheon: [],
};

describe('assessHoursPlausibility', () => {
  it('brez podatka o zaposlenih ali brez vnesenih ur ni presoje', () => {
    expect(assessHoursPlausibility([MODULE], { testni: { monthly: 100 } }, 0)).toBeNull();
    expect(assessHoursPlausibility([MODULE], { testni: { monthly: 0 } }, 12)).toBeNull();
  });

  it('sešteje h/mesec in h/leto (deljeno z 12), preskoči contextOnly, "Ne vem" in denar', () => {
    const check = assessHoursPlausibility(
      [MODULE],
      { testni: { monthly: 100, yearly: 120, context: 999, money: 50_000 } },
      12,
    )!;
    expect(check.enteredHoursPerMonth).toBe(110);
    expect(check.availableHoursPerMonth).toBe(12 * HOURS_PER_EMPLOYEE_PER_MONTH);

    const unknown = assessHoursPlausibility([MODULE], { testni: { monthly: UNKNOWN_ANSWER } }, 12);
    expect(unknown).toBeNull();
  });

  it('pod pragom ni opozorila, nad pragom je', () => {
    // 12 zaposlenih × 160 h = 1 920 h; prag 40 % = 768 h.
    const below = assessHoursPlausibility([MODULE], { testni: { monthly: 700 } }, 12)!;
    expect(below.exceedsPlausible).toBe(false);
    expect(hoursPlausibilityWarning(below)).toBeNull();

    const above = assessHoursPlausibility([MODULE], { testni: { monthly: 900 } }, 12)!;
    expect(above.exceedsPlausible).toBe(true);
    expect(above.capacityShare).toBeGreaterThan(PLAUSIBLE_CAPACITY_SHARE);

    const warning = hoursPlausibilityWarning(above)!;
    expect(warning).toContain('900 h/mesec');
    expect(warning).toContain('12 zaposlenih');
    expect(warning).toContain('dveh področjih');
  });

  it('hoursPlausibilityWarning(null) je null', () => {
    expect(hoursPlausibilityWarning(null)).toBeNull();
  });
});

describe('pokritost urnih enot v registru', () => {
  it('vsaka urna enota registra je h/mesec, h/leto ali izrecno izvzeta', () => {
    // h/stranko (donosnostRs) je razmerje na stranko, ne skupna izguba — v ovojnico
    // ne sodi. Nova urna enota mora bodisi v plausibility.ts bodisi na ta seznam.
    const exempt = new Set(['h/stranko']);
    for (const definition of ALL_MODULES) {
      for (const field of definition.fields) {
        if (!field.unit || !field.unit.startsWith('h/')) continue;
        if (exempt.has(field.unit)) continue;
        expect(['h/mesec', 'h/leto'], `${definition.id}.${field.key}`).toContain(field.unit);
      }
    }
  });
});
