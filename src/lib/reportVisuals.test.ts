import { describe, it, expect } from 'vitest';
import { HORIZON_YEARS, multiYearEUR } from './horizon';
import {
  breakdownChartHeightPx,
  breakdownRows,
  compositionSegments,
  confidenceMeterSegments,
  coverageSegments,
  projectionSeries,
} from './reportVisuals';

describe('compositionSegments', () => {
  const buckets = { directLossEUR: 5_000, lostMarginEUR: 3_000, capacityEUR: 2_000 };

  it('deleži prisotnih košev se seštejejo v 1', () => {
    const segments = compositionSegments(buckets);
    const sum = segments.reduce((total, segment) => total + segment.share, 0);

    expect(segments).toHaveLength(3);
    expect(sum).toBeCloseTo(1, 10);
    expect(segments.map((segment) => segment.key)).toEqual(['directLoss', 'lostMargin', 'capacity']);
  });

  it('ničelni koš izpade — segment širine nič bi izpadel kot napaka izrisa', () => {
    const segments = compositionSegments({ ...buckets, lostMarginEUR: 0 });

    expect(segments.map((segment) => segment.key)).toEqual(['directLoss', 'capacity']);
    expect(segments.reduce((total, segment) => total + segment.share, 0)).toBeCloseTo(1, 10);
  });

  it('pri ničelni vsoti vrne prazen seznam in ne deležev NaN', () => {
    const segments = compositionSegments({ directLossEUR: 0, lostMarginEUR: 0, capacityEUR: 0 });

    expect(segments).toEqual([]);
  });
});

describe('breakdownRows', () => {
  const data = [
    { name: 'Zaloge', directLossEUR: 1_000, lostMarginEUR: 0, capacityEUR: 500 },
    { name: 'Planiranje', directLossEUR: 4_000, lostMarginEUR: 1_000, capacityEUR: 0 },
    { name: 'Nalogi', directLossEUR: 0, lostMarginEUR: 0, capacityEUR: 2_000 },
  ];

  it('uredi padajoče po skupnem znesku in označi največjo postavko', () => {
    const rows = breakdownRows(data);

    expect(rows.map((row) => row.name)).toEqual(['Planiranje', 'Nalogi', 'Zaloge']);
    expect(rows[0].totalEUR).toBe(5_000);
    expect(rows[0].isTop).toBe(true);
    expect(rows.slice(1).every((row) => !row.isTop)).toBe(true);
  });

  it('deleži so glede na vsoto vseh vrstic', () => {
    const rows = breakdownRows(data);
    const sum = rows.reduce((total, row) => total + row.share, 0);

    expect(rows[0].share).toBeCloseTo(5_000 / 8_500, 10);
    expect(sum).toBeCloseTo(1, 10);
  });

  it('pri sami ničli ne deli z nič', () => {
    const rows = breakdownRows([{ name: 'Prazno', directLossEUR: 0, lostMarginEUR: 0, capacityEUR: 0 }]);

    expect(rows[0].share).toBe(0);
    expect(rows[0].totalEUR).toBe(0);
  });

  it('vhodnega polja ne spremeni', () => {
    const input = [...data];
    breakdownRows(input);

    expect(input.map((row) => row.name)).toEqual(['Zaloge', 'Planiranje', 'Nalogi']);
  });

  it('pri enakem znesku ohrani vrstni red segmenta', () => {
    const rows = breakdownRows([
      { name: 'Prvi', directLossEUR: 1_000, lostMarginEUR: 0, capacityEUR: 0 },
      { name: 'Drugi', directLossEUR: 1_000, lostMarginEUR: 0, capacityEUR: 0 },
    ]);

    expect(rows.map((row) => row.name)).toEqual(['Prvi', 'Drugi']);
  });
});

describe('breakdownChartHeightPx', () => {
  it('raste z vrsticami in je pri praznem grafu nič', () => {
    expect(breakdownChartHeightPx(0)).toBe(0);
    expect(breakdownChartHeightPx(3)).toBeGreaterThan(breakdownChartHeightPx(2));
    expect(breakdownChartHeightPx(1)).toBeGreaterThan(0);
  });
});

describe('projectionSeries', () => {
  it('kumulativa se ujema z multiYearEUR za vsako leto', () => {
    const points = projectionSeries(10_000);

    expect(points).toHaveLength(HORIZON_YEARS);
    points.forEach((point) => {
      expect(point.cumulativeEUR).toBe(multiYearEUR(10_000, point.year));
    });
  });

  it('zadnje leto je polna dolžina stolpca', () => {
    const points = projectionSeries(10_000);

    expect(points[points.length - 1].fraction).toBeCloseTo(1, 10);
    expect(points[0].fraction).toBeCloseTo(1 / HORIZON_YEARS, 10);
  });

  it('brez letnega zneska ni projekcije', () => {
    expect(projectionSeries(0)).toEqual([]);
    expect(projectionSeries(-100)).toEqual([]);
  });
});

describe('confidenceMeterSegments', () => {
  it('nizka 1, srednja 2, visoka 3 od treh', () => {
    expect(confidenceMeterSegments('low')).toEqual({ filled: 1, total: 3 });
    expect(confidenceMeterSegments('medium')).toEqual({ filled: 2, total: 3 });
    expect(confidenceMeterSegments('high')).toEqual({ filled: 3, total: 3 });
  });
});

describe('coverageSegments', () => {
  it('polni segmenti so na začetku, skupno število je ponujenih področij', () => {
    const segments = coverageSegments(3, 11);

    expect(segments).toHaveLength(11);
    expect(segments.filter((segment) => segment.measured)).toHaveLength(3);
    expect(segments.slice(0, 3).every((segment) => segment.measured)).toBe(true);
  });

  it('izmerjenih ne more biti več kot ponujenih', () => {
    expect(coverageSegments(9, 5).filter((segment) => segment.measured)).toHaveLength(5);
    expect(coverageSegments(-2, 4).filter((segment) => segment.measured)).toHaveLength(0);
  });

  it('brez ponujenih področij ni vrstice', () => {
    expect(coverageSegments(0, 0)).toEqual([]);
  });
});
