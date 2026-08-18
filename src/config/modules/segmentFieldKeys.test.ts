import { describe, it, expect } from 'vitest';
import { SEGMENTS, SEGMENT_ORDER } from '../segments';
import { MODULE_REGISTRY } from './index';

/**
 * Varovalo proti dvojnemu štetju iste ure prek podvojenega ključa polja.
 *
 * Ključi polj se hranijo po modulu (`values[moduleId][fieldKey]`), zato tehnične
 * kolizije ni: isti ključ v dveh modulih se shrani ločeno. Pomenska pa je — in
 * je dražja. Kadar se ISTI ključ pojavi v dveh področjih ISTEGA segmenta, gre
 * praviloma za isto vprašanje, postavljeno dvakrat: obiskovalec, ki izbere obe
 * področji, isto uro vpiše dvakrat, izračun pa jo enkrat ovrednoti po operativni
 * in enkrat po vodstveni uri.
 *
 * Ročni pregledi so tako napako našli dvakrat (`timesheetHoursPerMonth` v
 * storitvah, `reportPrepHoursPerMonth` v računovodstvu) — vsakič po veliko dela.
 * Ta test jo najde v milisekundah in prepreči, da bi se pojavila znova.
 *
 * Ključi se čez RAZLIČNE segmente smejo ponavljati: obiskovalec vidi en sam
 * segment, zato `annualWriteOffEUR` v proizvodnji in v trgovini nista v konfliktu.
 * Zato se preverja po segmentih in ne čez cel register.
 */

/**
 * Ključi, ki se v enem segmentu smejo ponoviti, ker so po zasnovi na vsakem modulu
 * svoji. `mainCause` je edini tak: vsako stroškovno področje sprašuje po svojem
 * glavnem vzroku in ima svoj nabor možnosti (glej `mainCauseField`).
 */
const SHARED_BY_DESIGN = new Set(['mainCause']);

describe('Ključi polj znotraj segmenta', () => {
  it('segmenti sploh imajo module — sicer test ne preverja ničesar', () => {
    expect(SEGMENT_ORDER.length).toBeGreaterThan(0);
    for (const segmentId of SEGMENT_ORDER) {
      expect(SEGMENTS[segmentId].moduleIds.length, segmentId).toBeGreaterThan(0);
    }
  });

  it('noben ključ polja se ne pojavi v dveh področjih istega segmenta', () => {
    const collisions: string[] = [];

    for (const segmentId of SEGMENT_ORDER) {
      const seenIn = new Map<string, string[]>();

      for (const moduleId of SEGMENTS[segmentId].moduleIds) {
        const definition = MODULE_REGISTRY[moduleId];
        // Neznan id lovi drug test (moduleEngine); tu bi samo zameglil sporočilo.
        if (!definition) continue;

        for (const field of definition.fields) {
          if (SHARED_BY_DESIGN.has(field.key)) continue;
          const where = seenIn.get(field.key) ?? [];
          where.push(moduleId);
          seenIn.set(field.key, where);
        }
      }

      for (const [key, modules] of seenIn) {
        if (modules.length > 1) {
          collisions.push(`${segmentId}: "${key}" v ${modules.join(' in ')}`);
        }
      }
    }

    // Sporočilo našteje vse kolizije naenkrat, da jih izvajalec ne odkriva po eno.
    expect(collisions).toEqual([]);
  });
});
