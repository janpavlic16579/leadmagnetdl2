import { describe, it, expect } from 'vitest';
import { clampNumber, formatNumberInput, parseNumberInput } from './numberInput';

describe('parseNumberInput', () => {
  it('vejica in pika sta enakovredni', () => {
    expect(parseNumberInput('22,5')).toBe(22.5);
    expect(parseNumberInput('22.5')).toBe(22.5);
  });

  it('presledki kot ločilo tisočic se zavržejo', () => {
    expect(parseNumberInput('2 000 000')).toBe(2_000_000);
    expect(parseNumberInput('2 000')).toBe(2000);
  });

  it('vrednosti pod 1 z vodilno ničlo', () => {
    expect(parseNumberInput('0,5')).toBe(0.5);
    expect(parseNumberInput('0')).toBe(0);
  });

  it('nedokončan vnos ni številka — in ne 0', () => {
    // Razlika je bistvena: 0 je izjava "te postavke nimamo", nedokončan vnos pa
    // vmesno stanje tipkanja, ki ga ni dovoljeno zapisati v stanje kot ničlo.
    expect(parseNumberInput('')).toBeNull();
    expect(parseNumberInput('-')).toBeNull();
    expect(parseNumberInput(',')).toBeNull();
    expect(parseNumberInput('abc')).toBeNull();
  });

  it('Infinity ni veljavna številka', () => {
    expect(parseNumberInput('1e400')).toBeNull();
    expect(parseNumberInput('Infinity')).toBeNull();
  });
});

describe('clampNumber', () => {
  it('negativnih vrednosti ne spusti naprej', () => {
    expect(clampNumber(-20)).toBe(0);
    expect(clampNumber(-0.5, { min: 0.2 })).toBe(0.2);
  });

  it('upošteva zgornjo mejo in celoštevilskost', () => {
    expect(clampNumber(1.5, { max: 1 })).toBe(1);
    expect(clampNumber(12.6, { integer: true })).toBe(13);
  });

  it('neštevilo pade na spodnjo mejo', () => {
    expect(clampNumber(Number.NaN)).toBe(0);
    expect(clampNumber(Number.POSITIVE_INFINITY, { max: 100 })).toBe(0);
  });
});

describe('formatNumberInput', () => {
  it('decimalke se vrnejo z vejico, kot jih uporabnik vpiše', () => {
    expect(formatNumberInput(22.5)).toBe('22,5');
    expect(formatNumberInput(13)).toBe('13');
    expect(formatNumberInput(null)).toBe('');
  });
});
