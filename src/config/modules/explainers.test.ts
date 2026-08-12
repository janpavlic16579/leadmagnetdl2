import { describe, it, expect } from 'vitest';
import { ALL_MODULES } from './index';
import type { ModuleField } from './moduleTypes';

/**
 * Varovalo popolnosti pojasnil za gumb "?".
 *
 * `explainer` je na ModuleField neobvezen, ker ga polje brez pomožnega besedila
 * ne potrebuje — vprašanja tipa "koliko ur mesečno" so razumljiva sama po sebi.
 * Tega, kar potrebuje, pa tip ne more izraziti: kjer OBSTAJA `help`, je vprašanje
 * po definiciji tako, da je bilo treba nekaj pojasniti, in tam mora biti tudi
 * pojasnilo. Pri ~100 poljih čez osem dejavnosti je to edino, kar prepreči tiho
 * izpuščeno polje — manjkajoč gumb "?" se ne pokaže kot napaka, ampak kot
 * vprašanje, na katerega obiskovalec ne zna odgovoriti.
 */

/** Vsa polja registra z modulom, iz katerega prihajajo — za berljivo sporočilo napake. */
const FIELDS: [string, ModuleField][] = ALL_MODULES.flatMap((definition) =>
  definition.fields.map((field): [string, ModuleField] => [`${definition.id}/${field.key}`, field]),
);

const WITH_HELP = FIELDS.filter(([, field]) => field.help);

describe('Pojasnila modulskih polj (gumb "?")', () => {
  it('register sploh ima polja s pomožnim besedilom — sicer test ne preverja ničesar', () => {
    expect(WITH_HELP.length).toBeGreaterThan(50);
  });

  it('vsako polje s pomožnim besedilom ima tudi pojasnilo', () => {
    const missing = WITH_HELP.filter(([, field]) => !field.explainer).map(([where]) => where);
    expect(missing).toEqual([]);
  });

  it('pojasnilo ni prepisano pomožno besedilo', () => {
    // Kopija ne pove nič novega — gumb "?" bi bil tedaj le podvojen klik.
    for (const [where, field] of WITH_HELP) {
      expect(field.explainer, where).not.toBe(field.help);
    }
  });

  it('pojasnilo ostane kratko in ni prazno', () => {
    // Zgornja meja lovi pojasnilo, ki se je razraslo v esej — takega nihče ne
    // prebere. Ni pa omejitev gostote podatkov: polje, ki potrebuje izpeljavo in
    // primer, je upravičeno daljše od tistega, ki potrebuje eno poved.
    for (const [where, field] of FIELDS) {
      if (!field.explainer) continue;
      expect(field.explainer.trim().length, where).toBeGreaterThan(40);
      expect(field.explainer.length, where).toBeLessThanOrEqual(600);
    }
  });
});
