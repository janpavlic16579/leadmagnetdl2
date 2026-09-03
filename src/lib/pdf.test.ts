import { describe, it, expect } from 'vitest';
import pdfSource from './pdf.ts?raw';
import pdfSalesSource from './pdfSales.ts?raw';
import deadlinesSource from './deadlines.ts?raw';
import reportVisualsSource from './reportVisuals.ts?raw';

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

  /**
   * Test zgoraj bere samo pdf.ts in posrednega uvoza ne vidi. Modula, ki sta
   * nastala za grafične prikaze poročila, sta prvi datoteki, ki ju uvažata OBA
   * dokumenta — prav tam bi prodajna vsebina prišla v strankino poročilo, ne da
   * bi kdo opazil.
   */
  it('tudi moduli, ki jih uvaža, ostanejo zunaj prodajne poti', () => {
    const shared = { 'deadlines.ts': deadlinesSource, 'reportVisuals.ts': reportVisualsSource };

    for (const [name, source] of Object.entries(shared)) {
      for (const forbidden of ['./salesReport', './salesPlaybook', '../config/icp', './pdfSales']) {
        expect(source, `${name} → ${forbidden}`).not.toContain(`from '${forbidden}'`);
      }
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

/**
 * Oznaka zanesljivosti je iz strankinega poročila odstranjena.
 *
 * Stopnja ("Nizka zanesljivost") in merilnik treh segmentov sta stala ob
 * naslovnem znesku, kjer ju je stranka brala kot oceno NAŠEGA izračuna, čeprav
 * sta merila njene vnose. Ostane poved pod kartico, ker edina pove tudi smer
 * napake — zneski so spodnja meja.
 *
 * Preverja se vir in ne izdelan PDF: jsPDF besedilne tokove stisne (glej
 * utemeljitev zgoraj), zato grep po bajtih ne dokaže ničesar.
 */
describe('Strankin PDF ne izpiše stopnje zanesljivosti', () => {
  it('ne pozna ne značke ne merilnika', () => {
    expect(pdfSource).not.toContain('CONFIDENCE_LABEL');
    expect(pdfSource).not.toContain('confidenceMeterSegments');
    expect(pdfSource).not.toContain('drawConfidenceBadge');
  });

  it('pojasnilo pod kartico pa ostane', () => {
    expect(pdfSource).toContain('CONFIDENCE_NOTE');
    expect(pdfSource).toContain('params.confidenceReason');
  });

  it('prodajna priprava stopnjo obdrži — sicer test zgoraj ne dokazuje ničesar', () => {
    // Kontrolni test: prodajnik oceno vhodnih podatkov potrebuje pred pogovorom.
    expect(pdfSalesSource).toContain('CONFIDENCE_LABEL');
  });
});

/**
 * Tabela povračila je iz strankinega poročila odstranjena.
 *
 * Primerjava izmerjenega potenciala z investicijo je pogovor s svetovalcem in ne
 * izdelek izračuna, ki stranki pride po e-pošti brez sogovornika. Podlaga
 * (horizon.paybackRows) ostane — spremeni se le, kdo tabelo bere.
 */
describe('Strankin PDF ne kaže povračila investicije', () => {
  it('ne pozna ne vrstic ne razdelka', () => {
    expect(pdfSource).not.toContain('paybackRows');
    expect(pdfSource).not.toContain('drawPaybackSection');
    expect(pdfSource).not.toContain('paybackTitle');
  });

  it('prodajna priprava tabelo obdrži — sicer test zgoraj ne dokazuje ničesar', () => {
    // Kontrolni test: svetovalec dobe povračila potrebuje za pogovor o ceni.
    expect(pdfSalesSource).toContain('paybackInvestmentHeader');
  });
});

/**
 * Znamka na poročilih je ista kot v glavi vprašalnika.
 *
 * Stranka je obrazec izpolnila pod logotipom PANTHEON svoje dejavnosti; dokument,
 * ki ga dobi po e-pošti, ne sme priti pod drugo znamko. Preverja se vir: v Node
 * okolju testov ni ne Image ne canvasa, zato se logotip v izdelanem PDF-ju nikoli
 * ne izriše in bi ga vsak test nad blobom zgrešil.
 */
describe('Oba PDF-ja nosita logotip PANTHEON, ne datalab', () => {
  it('strankino poročilo bere register po segmentu', () => {
    expect(pdfSource).not.toContain('logo-datalab');
    expect(pdfSource).toContain('PANTHEON_BRAND[params.segment.id]');
  });

  it('prodajna priprava bere isti register po istem ključu', () => {
    expect(pdfSalesSource).not.toContain('logo-datalab');
    expect(pdfSalesSource).toContain('PANTHEON_BRAND[report.qualification.segmentId]');
  });

  it('oba vzameta TEMNO različico, ker je glava temna', () => {
    // Napis svetle različice je v znamčni temni #231F20 in bi na glavi izginil —
    // napaka, ki se pokaže šele na natisnjenem dokumentu (glej pantheonLogos.ts).
    for (const source of [pdfSource, pdfSalesSource]) {
      expect(source).toContain('.dark');
      expect(source).not.toContain('.light');
    }
  });
});
