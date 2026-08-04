import { describe, it, expect } from 'vitest';
import { SIZE_CLASSES, getSizeClass } from './sizeClasses';

describe('Izpeljava velikostnega razreda iz števila zaposlenih', () => {
  it('meje razredov se ujemajo', () => {
    expect(getSizeClass(1)).toBe('1–9');
    expect(getSizeClass(9)).toBe('1–9');
    expect(getSizeClass(10)).toBe('10–49');
    expect(getSizeClass(49)).toBe('10–49');
    expect(getSizeClass(50)).toBe('50–249');
    expect(getSizeClass(249)).toBe('50–249');
    expect(getSizeClass(250)).toBe('250+');
    expect(getSizeClass(1000)).toBe('250+');
  });

  it('robne vrednosti padejo v najnižji razred namesto v napako', () => {
    expect(getSizeClass(0)).toBe('1–9');
    expect(getSizeClass(-5)).toBe('1–9');
  });

  it('razredi se ne prekrivajo in ne puščajo lukenj', () => {
    for (let i = 0; i < SIZE_CLASSES.length - 1; i++) {
      expect(SIZE_CLASSES[i].max).not.toBeNull();
      expect(SIZE_CLASSES[i + 1].min).toBe((SIZE_CLASSES[i].max as number) + 1);
    }
    expect(SIZE_CLASSES[SIZE_CLASSES.length - 1].max).toBeNull();
  });
});
