import { describe, it, expect } from 'vitest';
import { HORIZONTAL_MODULES } from './horizontal';
import { MODULE_REGISTRY } from './index';
import { SEGMENTS, SEGMENT_ORDER } from '../segments';
import type { ModuleDefinition } from './moduleTypes';

/**
 * Varovalo panožne nevtralnosti horizontalnih področij.
 *
 * Horizontala je EN objekt v registru, ki ga uporablja do sedem dejavnosti
 * (`horizontal.ts`, pravilo na vrhu datoteke). Njeno besedilo mora zato držati v
 * vsaki od njih. Kadar zamejitev imenuje sosednje področje — "ure iz področja
 * Zajem listin tu ne štejte" — je stavek pravilen v eni dejavnosti in nesmiseln
 * v ostalih šestih, ki takega področja sploh nimajo.
 *
 * Ta napaka je bila v ročnih pregledih pogosta: v enem samem pregledu so štirje
 * predlagani popravki besedil to pravilo kršili in jih je morala ujeti šele
 * skeptična preverba. Meja mora biti izražena VSEBINSKO ("evidenca za plačo, ne
 * za račun naročniku"), ne z imenom sosednjega področja.
 *
 * Obratna smer je dovoljena in zaželena: panožna datoteka SME imenovati
 * horizontalo, ker velja samo za svojo dejavnost.
 */

/** Naslovi vseh panožnih (ne-horizontalnih) področij, do katerih je mogoče priti. */
const HORIZONTAL_IDS = new Set(HORIZONTAL_MODULES.map((definition) => definition.id));

const INDUSTRY_TITLES: string[] = [
  ...new Set(
    SEGMENT_ORDER.flatMap((segmentId) => SEGMENTS[segmentId].moduleIds)
      .filter((moduleId) => !HORIZONTAL_IDS.has(moduleId))
      .map((moduleId) => MODULE_REGISTRY[moduleId])
      .filter((definition): definition is ModuleDefinition => Boolean(definition))
      .map((definition) => definition.title),
  ),
];

/** Vsa besedila ene horizontale, z opisom mesta za berljivo sporočilo napake. */
function textsOf(definition: ModuleDefinition): [string, string][] {
  const texts: [string, string][] = [
    [`${definition.id}/summary`, definition.summary],
    ...(definition.triage ? [[`${definition.id}/triage`, definition.triage.prompt] as [string, string]] : []),
  ];

  for (const field of definition.fields) {
    texts.push([`${definition.id}/${field.key}/label`, field.label]);
    if (field.help) texts.push([`${definition.id}/${field.key}/help`, field.help]);
    if (field.explainer) texts.push([`${definition.id}/${field.key}/explainer`, field.explainer]);
    for (const choice of field.choices ?? []) {
      texts.push([`${definition.id}/${field.key}/choice`, choice.label]);
    }
  }

  return texts;
}

describe('Nevtralnost horizontalnih področij', () => {
  it('register sploh ima horizontale in panožne naslove — sicer test ne preverja ničesar', () => {
    expect(HORIZONTAL_MODULES.length).toBeGreaterThan(0);
    expect(INDUSTRY_TITLES.length).toBeGreaterThan(10);
  });

  it('nobeno besedilo horizontale ne imenuje panožnega področja po naslovu', () => {
    const offenders: string[] = [];

    for (const definition of HORIZONTAL_MODULES) {
      for (const [where, text] of textsOf(definition)) {
        for (const title of INDUSTRY_TITLES) {
          if (text.includes(title)) {
            offenders.push(`${where}: imenuje področje "${title}"`);
          }
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('horizontale so res v rabi v več dejavnostih — sicer pravilo nima podlage', () => {
    // Če bi katera horizontala ostala v enem samem segmentu, bi jo bilo smiselno
    // pretvoriti v panožno področje in ji dovoliti konkretno besedilo. Ta test to
    // odločitev naredi vidno, namesto da bi pravilo tiho veljalo naprej.
    for (const definition of HORIZONTAL_MODULES) {
      const usedIn = SEGMENT_ORDER.filter((segmentId) =>
        SEGMENTS[segmentId].moduleIds.includes(definition.id),
      );
      expect(usedIn.length, `${definition.id} je samo v ${usedIn.join(', ')}`).toBeGreaterThan(1);
    }
  });
});
