import { describe, it, expect } from 'vitest';
import pdfSource from './pdf.ts?raw';
import pdfSalesSource from './pdfSales.ts?raw';

/**
 * Meja med strankinim in prodajnim dokumentom.
 *
 * Strankino poročilo ne sme nikoli vsebovati ocene ustreznosti, priporočila licenc
 * ali pričakovanih ugovorov. Iskanje teh nizov v izdelanem PDF-ju tega NE dokaže:
 * jsPDF besedilne tokove stisne, zato grep po bajtih vrne prazen rezultat tudi
 * takrat, ko je vsebina notri — kar je enkrat že dalo lažno pomirjujoč rezultat.
 *
 * Zato se meja preverja tam, kjer je resnična: pri VHODU. Če v generator ne pride
 * ne poročilo ne ocena, jih izpisati ni mogoče, ne glede na to, kaj kdo nariše.
 *
 * Vir se bere prek Vitovega `?raw` in ne prek node:fs — tsconfig.app.json nima
 * tipov za Node in dodajanje odvisnosti zaradi enega testa se ne izplača.
 */

describe('Strankin PDF je ločen od prodajnega', () => {
  it('ne uvaža ničesar iz prodajne poti', () => {
    for (const forbidden of ['./salesReport', './salesPlaybook', '../config/icp', './pdfSales']) {
      expect(pdfSource, forbidden).not.toContain(`from '${forbidden}'`);
    }
  });

  it('njegov vhodni tip ne pozna ne ocene ne playbooka', () => {
    const start = pdfSource.indexOf('export interface GeneratePdfParams');
    const params = pdfSource.slice(start, pdfSource.indexOf('}', start));

    expect(start).toBeGreaterThan(-1);
    expect(params).not.toContain('icp');
    expect(params).not.toContain('playbook');
    expect(params).not.toContain('SalesReport');
  });

  it('prodajni PDF pa oboje uporablja — sicer bi bil test zgoraj brez pomena', () => {
    // Kontrolni test: brez njega bi zgornja dva veljala tudi, če bi ocena izginila
    // iz obeh dokumentov, in bi izpadla kot dokazana ločnica.
    expect(pdfSalesSource).toMatch(/\bicp\b/);
    expect(pdfSalesSource).toContain('playbook');
  });
});
