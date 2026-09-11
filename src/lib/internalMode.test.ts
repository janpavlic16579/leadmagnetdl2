import { describe, expect, it } from 'vitest';
import { isInternalMode } from './internalMode';

describe('isInternalMode', () => {
  it('vklopi samo natanko žeton iz gradnje', () => {
    expect(isInternalMode('?debug=abc123', 'abc123')).toBe(true);
    expect(isInternalMode('?s=proizvodnja&debug=abc123&utm_source=x', 'abc123')).toBe(true);
    expect(isInternalMode('?debug=abc12', 'abc123')).toBe(false);
    expect(isInternalMode('?debug=1', 'abc123')).toBe(false);
    expect(isInternalMode('', 'abc123')).toBe(false);
  });

  it('brez žetona v gradnji je način izklopljen — tudi za nekdanji ?debug=1', () => {
    expect(isInternalMode('?debug=1', '')).toBe(false);
    expect(isInternalMode('?debug=1', null)).toBe(false);
    expect(isInternalMode('?debug=', '')).toBe(false);
  });

  it('presledki okoli žetona iz okolja ne štejejo', () => {
    expect(isInternalMode('?debug=abc123', ' abc123 ')).toBe(true);
  });
});
