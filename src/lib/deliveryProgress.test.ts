import { describe, expect, it } from 'vitest';
import { DELIVERY_PHASES, DELIVERY_PHASE_ORDER, progressPercent } from './deliveryProgress';

describe('deliveryProgress', () => {
  it('faze so urejene: nobena se ne začne pod koncem prejšnje, konec je 100', () => {
    DELIVERY_PHASE_ORDER.slice(1).forEach((phase, index) => {
      const previous = DELIVERY_PHASES[DELIVERY_PHASE_ORDER[index]];
      expect(DELIVERY_PHASES[phase].from).toBeGreaterThanOrEqual(previous.to);
    });
    expect(DELIVERY_PHASES.done.from).toBe(100);
    expect(progressPercent('done', 0)).toBe(100);
  });

  it('znotraj faze začne na spodnji meji, ne pada in zgornje meje ne doseže', () => {
    for (const phase of DELIVERY_PHASE_ORDER) {
      const { from, to } = DELIVERY_PHASES[phase];
      expect(progressPercent(phase, 0)).toBe(from);
      let last = from;
      for (const ms of [50, 200, 1000, 5000, 20_000, 120_000]) {
        const value = progressPercent(phase, ms);
        expect(value).toBeGreaterThanOrEqual(last);
        expect(value).toBeLessThanOrEqual(phase === 'done' ? 100 : to - 1);
        last = value;
      }
    }
  });

  it('pošiljanje se še po pol minute ne izda za končano, a se vidno premakne', () => {
    expect(progressPercent('send', 30_000)).toBeLessThan(100);
    expect(progressPercent('send', 3000)).toBeGreaterThan(DELIVERY_PHASES.send.from + 10);
  });

  it('napisi ne omenjajo prodaje ali svetovalca — dokument govori o stranki, ne zanjo', () => {
    for (const phase of DELIVERY_PHASE_ORDER) {
      expect(DELIVERY_PHASES[phase].label).not.toMatch(/prodaj|svetoval/i);
    }
  });
});
