import { describe, it, expect } from 'vitest';
import { countUpProgress, easeOutCubic, heroAmountAtProgress, isBelowViewport } from './animation';
import { formatAmount } from './format';

describe('easeOutCubic', () => {
  it('gre od 0 do 1 in vmes narašča', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.25)).toBeLessThan(easeOutCubic(0.5));
    expect(easeOutCubic(0.5)).toBeLessThan(easeOutCubic(0.75));
  });

  it('vrednosti zunaj območja omeji', () => {
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(5)).toBe(1);
  });
});

describe('countUpProgress', () => {
  it('omeji delež na 0–1', () => {
    expect(countUpProgress(0, 800)).toBe(0);
    expect(countUpProgress(400, 800)).toBe(0.5);
    expect(countUpProgress(2_000, 800)).toBe(1);
    expect(countUpProgress(-10, 800)).toBe(0);
  });

  it('brez trajanja je animacija takoj končana', () => {
    expect(countUpProgress(0, 0)).toBe(1);
  });
});

/**
 * Osrednja zahteva: animacija ne sme spremeniti prikazane vrednosti. Ob koncu
 * mora biti niz znak za znakom enak tistemu, ki bi ga izpisal formatAmount brez
 * animacije — sicer bi zaslon in PDF trdila različno številko.
 */
describe('heroAmountAtProgress', () => {
  const cases = [
    { name: 'gola številka', inputs: { valueEUR: 71_452 } },
    { name: 'najmanj pri nizki zanesljivosti', inputs: { valueEUR: 44_000, lowConfidence: true } },
    { name: 'razpon', inputs: { valueEUR: 34_000, range: { minEUR: 29_232, maxEUR: 39_672 } } },
    { name: 'ni izmerjeno', inputs: { valueEUR: 0 } },
    {
      name: 'razpon ima prednost pred najmanj',
      inputs: { valueEUR: 34_000, range: { minEUR: 29_232, maxEUR: 39_672 }, lowConfidence: true },
    },
  ];

  for (const { name, inputs } of cases) {
    it(`pri koncu je enak formatAmount — ${name}`, () => {
      expect(heroAmountAtProgress(1, inputs)).toBe(formatAmount(inputs.valueEUR, inputs));
    });
  }

  it('razpon ostane razpon tudi pri majhnih deležih', () => {
    const inputs = { valueEUR: 34_000, range: { minEUR: 29_232, maxEUR: 39_672 } };

    for (const progress of [0, 0.01, 0.2, 0.5, 0.99, 1]) {
      expect(heroAmountAtProgress(progress, inputs), `delež ${progress}`).toContain('–');
    }
  });

  it('neizmerjeni znesek se ne spreminja med animacijo', () => {
    for (const progress of [0, 0.5, 1]) {
      expect(heroAmountAtProgress(progress, { valueEUR: 0 })).toBe('ni izmerjeno');
    }
  });

  it('vmesne vrednosti ne padejo v "ni izmerjeno"', () => {
    const inputs = { valueEUR: 71_452, lowConfidence: true };

    for (const progress of [0, 0.05, 0.5]) {
      expect(heroAmountAtProgress(progress, inputs)).toContain('najmanj');
      expect(heroAmountAtProgress(progress, inputs)).not.toContain('ni izmerjeno');
    }
  });

  it('znesek med animacijo narašča', () => {
    const inputs = { valueEUR: 71_452 };

    expect(heroAmountAtProgress(0, inputs)).toBe('0 EUR');
    expect(heroAmountAtProgress(0.5, inputs)).toBe('35.726 EUR');
    expect(heroAmountAtProgress(1, inputs)).toBe('71.452 EUR');
  });
});

describe('isBelowViewport', () => {
  it('element v vidnem polju se ne skriva', () => {
    expect(isBelowViewport(100, 800)).toBe(false);
    expect(isBelowViewport(700, 800)).toBe(false);
  });

  it('element krepko pod pregibom se sme razkriti', () => {
    expect(isBelowViewport(900, 800)).toBe(true);
  });
});
