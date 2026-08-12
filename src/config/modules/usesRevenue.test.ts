import { describe, it, expect } from 'vitest';
import { ALL_MODULES } from '.';

/**
 * Zastavica usesRevenue je metapodatek in bi se ob spremembi formule tiho razšla
 * z resnico — modul bi računal iz prihodka, ocena zanesljivosti pa tega ne bi
 * vedela (ali obratno). Vir resnice je formula sama: compute.toString() v testnem
 * okolju ohrani izvorno ime parametra `context`.
 */
describe('usesRevenue ustreza dejanski formuli', () => {
  it('zastavica je nastavljena natanko na modulih, ki množijo context.annualRevenueEUR', () => {
    for (const definition of ALL_MODULES) {
      const usesInFormula = definition.compute.toString().includes('context.annualRevenueEUR');
      expect(definition.usesRevenue === true, definition.id).toBe(usesInFormula);
    }
  });

  it('usesMargin je nastavljena natanko na modulih, ki množijo context.contributionMarginRate', () => {
    for (const definition of ALL_MODULES) {
      const usesInFormula = definition.compute.toString().includes('context.contributionMarginRate');
      expect(definition.usesMargin === true, definition.id).toBe(usesInFormula);
    }
  });
});
