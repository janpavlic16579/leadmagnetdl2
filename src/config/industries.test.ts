import { describe, it, expect } from 'vitest';
import { INDUSTRIES, getSegmentForIndustry, getIndustryLabel } from './industries';
import { SEGMENTS } from './segments';

describe('Preslikava dejavnost -> segment', () => {
  it('vsaka dejavnost se preslika v obstoječ segment', () => {
    for (const industry of INDUSTRIES) {
      expect(SEGMENTS[industry.segment]).toBeDefined();
    }
  });

  it('vsi id-ji dejavnosti so unikatni', () => {
    const ids = INDUSTRIES.map((industry) => industry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('reprezentativni primeri se preslikajo pravilno', () => {
    expect(getSegmentForIndustry('kovinarstvo')).toBe('proizvodnja');
    expect(getSegmentForIndustry('logistika')).toBe('trgovina');
    expect(getSegmentForIndustry('racunovodstvo')).toBe('racunovodstvo');
    expect(getSegmentForIndustry('it')).toBe('splosno');
  });

  it('vsak od štirih segmentov je dosegljiv iz vsaj ene dejavnosti', () => {
    const reachable = new Set(INDUSTRIES.map((industry) => industry.segment));
    expect(reachable).toEqual(new Set(['proizvodnja', 'trgovina', 'racunovodstvo', 'splosno']));
  });

  it('neznana ali prazna dejavnost pade v splošni segment', () => {
    expect(getSegmentForIndustry('neobstojeca-panoga')).toBe('splosno');
    expect(getSegmentForIndustry('')).toBe('splosno');
  });

  it('getIndustryLabel vrne oznako oz. prazen niz za neznano dejavnost', () => {
    expect(getIndustryLabel('kovinarstvo')).toBe('Kovinska predelava');
    expect(getIndustryLabel('neobstojeca-panoga')).toBe('');
  });
});
