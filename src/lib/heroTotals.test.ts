import { describe, expect, it } from 'vitest';
import { heroRangeEUR, heroValueEUR } from './heroTotals';
import type { TotalsRange } from './range';

describe('Naslovna letna številka', () => {
  it('sešteje tri letne koše in izpusti enkratni kapital', () => {
    // Enkratni znesek se z letnimi ne sešteva — prav to napako ločeni koši preprečujejo.
    expect(
      heroValueEUR({ directLossEUR: 10_000, lostMarginEUR: 5_000, capacityEUR: 2_500 }),
    ).toBe(17_500);
  });

  it('brez razpona vrne undefined, ne ničelnega razpona', () => {
    // `undefined` je oblika, ki jo pričakujeta formatAmount in displayRange; razpon
    // 0–0 bi se izpisal kot razpon in trdil, da negotovost obstaja.
    expect(heroRangeEUR(null)).toBeUndefined();
    expect(heroRangeEUR(undefined)).toBeUndefined();
  });

  it('razpon sešteje meje istih treh košev', () => {
    const range: TotalsRange = {
      directLoss: { minEUR: 8_000, maxEUR: 12_000 },
      lostMargin: { minEUR: 4_000, maxEUR: 6_000 },
      capacity: { minEUR: 2_000, maxEUR: 3_000 },
      oneTimeCapital: { minEUR: 100_000, maxEUR: 200_000 },
    };

    // Enkratni kapital ostane zunaj tudi v razponu.
    expect(heroRangeEUR(range)).toEqual({ minEUR: 14_000, maxEUR: 21_000 });
  });
});
