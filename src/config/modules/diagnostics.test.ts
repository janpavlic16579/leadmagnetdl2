import { describe, it, expect } from 'vitest';
import { MODULE_REGISTRY } from './index';
import { SEGMENTS, SEGMENT_ORDER } from '../segments';
import { ASSURANCE_UNANSWERED, assuranceRiskLevel } from './shared';
import { moduleDefaults } from './moduleTypes';
import { DEFAULT_COST_CONTEXT } from '../../lib/moduleEngine';
import type { ModuleDefinition } from './moduleTypes';

/**
 * Varovalo proti sodbi brez podatka.
 *
 * Diagnostika je edino področje, ki se prikaže VEDNO — nima triaže, zato jo vidi
 * vsak obiskovalec. Njeni privzetki so bili doslej sredinski odgovori (1, 1, 2, 1),
 * kar je pomenilo, da je obiskovalec, ki koraka ni niti odprl, na rezultatih dobil
 * dve oceni "srednje tveganje", zapisani kot dejstvo. Ti dve oceni sta šli tudi v
 * PDF za upravo in v prodajno pripravo.
 *
 * Napaka je bila v vseh sedmih dejavnostih hkrati in je ni ujel noben test — prav
 * zato ta obstaja. Pokriva obe smeri: brez odgovora ni stopnje, z odgovorom je.
 */

const DIAGNOSTIC_MODULES: [string, ModuleDefinition][] = [
  ...new Set(SEGMENT_ORDER.flatMap((segmentId) => SEGMENTS[segmentId].moduleIds)),
]
  .map((moduleId): [string, ModuleDefinition | undefined] => [moduleId, MODULE_REGISTRY[moduleId]])
  .filter((entry): entry is [string, ModuleDefinition] => {
    const [, definition] = entry;
    if (!definition) return false;
    // Diagnostika je področje brez triaže, ki vrne izključno izide koša 'risk'.
    if (definition.triage) return false;
    const outputs = definition.compute(moduleDefaults(definition), DEFAULT_COST_CONTEXT);
    return outputs.length > 0 && outputs.every((output) => output.bucket === 'risk');
  });

describe('Diagnostika brez odgovora', () => {
  it('vsaka dejavnost ima diagnostično področje — sicer test ne preverja ničesar', () => {
    // Sedem dejavnosti, diagnostika v vsaki. Če jih je manj, je katera ostala brez.
    expect(DIAGNOSTIC_MODULES.length).toBeGreaterThanOrEqual(SEGMENT_ORDER.length);
  });

  it('vsa diagnostična polja se začnejo brez odgovora', () => {
    const answered: string[] = [];

    for (const [moduleId, definition] of DIAGNOSTIC_MODULES) {
      for (const field of definition.fields) {
        if (field.kind !== 'choice') continue;
        if (field.default !== ASSURANCE_UNANSWERED) {
          answered.push(`${moduleId}/${field.key} (privzetek ${field.default})`);
        }
      }
    }

    expect(answered).toEqual([]);
  });

  it('nedotaknjena diagnostika ne izreče nobene stopnje tveganja', () => {
    for (const [moduleId, definition] of DIAGNOSTIC_MODULES) {
      const outputs = definition.compute(moduleDefaults(definition), DEFAULT_COST_CONTEXT);

      for (const output of outputs) {
        expect(output.riskLevel, `${moduleId}/${output.label}`).toBeUndefined();
        // Namesto stopnje mora stati pojasnilo, zakaj je ni — prazna kartica bi
        // bila videti kot napaka in ne kot zavestna vzdržnost od sodbe.
        expect(output.note, `${moduleId}/${output.label}`).toBeTruthy();
      }
    }
  });

  it('en sam odgovorjen par vrne stopnjo, drugi ostane neocenjen', () => {
    for (const [moduleId, definition] of DIAGNOSTIC_MODULES) {
      const choiceKeys = definition.fields
        .filter((field) => field.kind === 'choice')
        .map((field) => field.key);
      expect(choiceKeys.length, moduleId).toBeGreaterThanOrEqual(4);

      // Odgovorimo samo na prvi par (prvi dve vprašanji).
      const input = moduleDefaults(definition);
      input[choiceKeys[0]] = 3;
      input[choiceKeys[1]] = 3;

      const outputs = definition.compute(input, DEFAULT_COST_CONTEXT);
      expect(outputs[0].riskLevel, `${moduleId}: prvi par`).toBeDefined();
      expect(outputs[1].riskLevel, `${moduleId}: drugi par`).toBeUndefined();
    }
  });
});

describe('assuranceRiskLevel', () => {
  it('brez odgovorov ni stopnje', () => {
    expect(assuranceRiskLevel(ASSURANCE_UNANSWERED, ASSURANCE_UNANSWERED)).toBeUndefined();
  });

  it('najvišja možna ocena se skrči na odgovorjena vprašanja', () => {
    // Edini prejeti odgovor je najslabši možen (3). Če bi imenovalec ostal 6, bi
    // razmerje 3/6 dalo "srednje" — torej bi neodgovorjeno vprašanje delovalo kot
    // odgovor "vse je v redu" in bi ublažilo edino stvar, ki jo podjetje je povedalo.
    expect(assuranceRiskLevel(3, ASSURANCE_UNANSWERED)).toBe('high');
    expect(assuranceRiskLevel(0, ASSURANCE_UNANSWERED)).toBe('low');
  });

  it('oba odgovora se seštejeta kot doslej', () => {
    expect(assuranceRiskLevel(0, 0)).toBe('low');
    expect(assuranceRiskLevel(1, 1)).toBe('medium');
    expect(assuranceRiskLevel(3, 3)).toBe('high');
  });
});
