import { describe, it, expect } from 'vitest';
import { MODULE_REGISTRY } from './index';
import { SEGMENTS, SEGMENT_ORDER } from '../segments';
import type { ModuleDefinition, ModuleField } from './moduleTypes';

/**
 * Varovalo jamstva "nobene številke si nismo izmislili".
 *
 * Znesek v tej aplikaciji praviloma nastane kot zmnožek dveh ali treh polj:
 * količina × delež × cena. Količina (listin na mesec, pošiljk na mesec, letna
 * vrednost materiala) je nevtralen poslovni podatek, ki ga obiskovalec vpiše brez
 * pomisleka. Delež pa je edini člen, ki TRDI, da težava obstaja.
 *
 * Kadar ima tak delež privzetek nad 0, znesek nastane iz enega samega vnosa, ki
 * ni bil izjava o težavi. Trije taki privzetki so bili v kodi hkrati:
 *
 *   racunovodstvo  4.800 listin × 0,6 × 3 min      → 41.472 EUR/leto
 *   logistika      5.000 pošiljk × 0,02 × 40 EUR   → 48.000 EUR/leto
 *   proizvodnja    200.000 EUR materiala × 0,03    →  6.000 EUR/leto
 *
 * Napaka je bila neopazna z obeh strani: noben test je ni pokrival, ocena
 * zanesljivosti pa nedotaknjenega privzetka ne šteje med izpolnjena polja
 * (potential.ts), zato se je tak znesek izpisal celo z oznako "najmanj" —
 * izmišljena številka s pridihom konservativnosti.
 *
 * Zato pravilo: polje vrste `percent`, ki vstopa v formulo, ima privzetek 0.
 *
 * Pravilo NE velja za:
 *  - `contextOnly` polja (v formulo ne vstopajo),
 *  - `choice` polja (diagnostika in vzroki — te pokriva svoj test),
 *  - cenovne drsnike (`costPerErrorEUR`, `minutesPerManualDocument`): brez količine
 *    ne množijo ničesar, njihov `min` pa 0 pogosto sploh ne dopušča.
 */

/**
 * Preverjajo se samo moduli, do katerih obiskovalec sploh lahko pride — torej tisti,
 * ki jih našteje kak segment. Zastareli `A_trgovina`–`D_trgovina` so v registru le kot
 * priče migracije (`moduleEngine.test.ts` primerja nove formule z njihovimi) in v
 * nobenem segmentu niso; njihovih privzetkov se NE sme spreminjati, ker so del
 * zamrznjenega pričakovanja. Modul, ki ga nihče ne vidi, tudi ne more izmisliti zneska.
 */
const REACHABLE: ModuleDefinition[] = [
  ...new Set(SEGMENT_ORDER.flatMap((segmentId) => SEGMENTS[segmentId].moduleIds)),
]
  .map((moduleId) => MODULE_REGISTRY[moduleId])
  .filter((definition): definition is ModuleDefinition => Boolean(definition));

const FIELDS: [string, ModuleDefinition, ModuleField][] = REACHABLE.flatMap((definition) =>
  definition.fields.map(
    (field): [string, ModuleDefinition, ModuleField] => [
      `${definition.id}/${field.key}`,
      definition,
      field,
    ],
  ),
);

describe('Privzete vrednosti polj', () => {
  it('register sploh ima deležna polja — sicer test ne preverja ničesar', () => {
    expect(FIELDS.filter(([, , field]) => field.kind === 'percent').length).toBeGreaterThan(3);
  });

  it('noben delež, ki vstopa v formulo, ne ustvari zneska brez vnosa', () => {
    const offenders = FIELDS.filter(([, , field]) => {
      if (field.kind !== 'percent') return false;
      if (field.contextOnly) return false;
      return field.default > 0;
    }).map(([where, , field]) => `${where} (privzetek ${field.default})`);

    expect(offenders).toEqual([]);
  });

  it('cenovni drsnik s privzetkom nad 0 množi količino, ki se začne pri 0', () => {
    // Drsniki cene (EUR/km, EUR na napako, minute na listino) smejo imeti privzetek,
    // ker brez količine ne proizvedejo ničesar. Ta test to predpostavko preveri:
    // vsak modul, ki ima tak drsnik, mora imeti vsaj eno numerično polje s privzetkom
    // 0 — količino, brez katere je zmnožek nič. Če bi kdo dodal drsnik v modul brez
    // take količine, bi privzetek spet postal samostojen vir zneska.
    const withPricedSlider = REACHABLE.filter((definition) =>
      definition.fields.some(
        (field) => field.kind === 'slider' && !field.contextOnly && field.default > 0,
      ),
    );

    expect(withPricedSlider.length).toBeGreaterThan(0);

    for (const definition of withPricedSlider) {
      const hasZeroQuantity = definition.fields.some(
        (field) => field.kind === 'number' && !field.contextOnly && field.default === 0,
      );
      expect(hasZeroQuantity, `${definition.id}: drsnik s ceno brez količine s privzetkom 0`).toBe(
        true,
      );
    }
  });
});
