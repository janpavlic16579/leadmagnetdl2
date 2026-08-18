import { describe, it, expect } from 'vitest';
import { MODULE_REGISTRY } from './index';
import { SEGMENTS, SEGMENT_ORDER } from '../segments';
import type { ModuleDefinition, ModuleField } from './moduleTypes';

/**
 * Varovalo proti tihi ničli pri letnih zneskih.
 *
 * Brez `allowUnknown` dasta enak odgovor dve povsem različni podjetji: tisto, ki
 * dobropisov nima, in tisto, ki jih ne vodi ločeno. Obe pustita polje na 0, motor
 * pa 0 obravnava kot potrjeno dejstvo. Rezultat je znesek, ki je videti natančnejši,
 * kot je, prodajnik pa izgubi iztočnico — `unknownAnswers` v prodajni pripravi
 * ostane prazen tam, kjer bi moral opozoriti "tega podatka ne vodijo".
 *
 * Pravilo velja za letne zneske (`EUR/leto`), ker so to postavke, ki jih podjetje
 * bodisi vodi bodisi ne. NE velja za ure in števila: tam je "ne vem" izgovor in ne
 * dejstvo, ponujena možnost pa bi kakovost vnosa znižala namesto zvišala
 * (glej komentar ob `allowUnknown` v moduleTypes.ts).
 *
 * Tehnična omejitev: `allowUnknown` deluje samo pri `kind: 'number'`
 * (ModuleInput.tsx) — pri drsniku ali odstotku ga ni mogoče ponuditi.
 */

const REACHABLE: ModuleDefinition[] = [
  ...new Set(SEGMENT_ORDER.flatMap((segmentId) => SEGMENTS[segmentId].moduleIds)),
]
  .map((moduleId) => MODULE_REGISTRY[moduleId])
  .filter((definition): definition is ModuleDefinition => Boolean(definition));

const ANNUAL_AMOUNTS: [string, ModuleField][] = REACHABLE.flatMap((definition) =>
  definition.fields
    .filter((field) => field.kind === 'number' && field.unit === 'EUR/leto' && !field.contextOnly)
    .map((field): [string, ModuleField] => [`${definition.id}/${field.key}`, field]),
);

describe('Možnost "ne vem" pri letnih zneskih', () => {
  it('register sploh ima letne zneske — sicer test ne preverja ničesar', () => {
    expect(ANNUAL_AMOUNTS.length).toBeGreaterThan(15);
  });

  it('vsak letni znesek, ki vstopa v izračun, dopušča odgovor "ne vem"', () => {
    const missing = ANNUAL_AMOUNTS.filter(([, field]) => !field.allowUnknown).map(
      ([where]) => where,
    );
    expect(missing).toEqual([]);
  });

  it('"ne vem" se ne ponuja tam, kjer je odgovor mogoče oceniti', () => {
    // Obratna smer istega pravila: pri urah in številih je "ne vem" izgovor.
    // Kdor lahko oceni "koliko ur na mesec", naj oceni — ponujen izhod bi kakovost
    // vnosa znižal in hkrati po nepotrebnem znižal oznako zanesljivosti.
    const wrong: string[] = [];

    for (const definition of REACHABLE) {
      for (const field of definition.fields) {
        if (!field.allowUnknown) continue;
        if (field.unit?.startsWith('h/')) {
          wrong.push(`${definition.id}/${field.key} (ure)`);
        }
        if (field.kind !== 'number') {
          wrong.push(`${definition.id}/${field.key} (${field.kind} — motor tega ne izriše)`);
        }
      }
    }

    expect(wrong).toEqual([]);
  });
});
