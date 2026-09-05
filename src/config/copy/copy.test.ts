import { describe, it, expect } from 'vitest';
import { SEGMENT_COPY, getSegmentCopy, segmentLabelWithSize } from './index';
import { NEUTRAL_COPY, SHARED_COPY } from './copyTypes';
import { SEGMENT_ORDER, SEGMENTS } from '../segments';

/**
 * Varovala registra besedil.
 *
 * Tip drži, da obvezno polje obstaja. Vsega ostalega ne more: da ni prazno, da
 * ni SEDEMKRAT ISTO in da naslov ne preraste prostora, ki mu ga rezervira
 * postavitev. Vsaka od teh napak se prevede in se pokaže šele obiskovalcu -
 * praviloma kot dejavnost, ki jo nagovarjamo z besedami neke druge.
 */

/** Vsi nizi objekta kot pari pot -> vrednost; null pomeni "te vrstice ta dejavnost nima". */
function flatten(value: unknown, prefix = ''): [string, string][] {
  if (typeof value === 'string') return [[prefix, value]];
  if (value === null || typeof value !== 'object') return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}.${key}` : key),
  );
}

/** Poti, ki so obvezne po tipu in morajo biti napisane, ne le prisotne. */
const REQUIRED_PATHS = [
  'displayName',
  'landing.heroTitle',
  'landing.heroSubtitle',
  'context.title',
  'context.intro',
  'triage.title',
  'triage.intro',
  'costBasis.intro',
  'results.headline',
  'figures.directLoss.note',
  'emailGate.title',
  'emailGate.subtitle',
];

/**
 * Zgornje meje dolžine.
 *
 * Niso estetika: na uvodnem zaslonu stoji spustni seznam POD naslovom, zato
 * daljši podnaslov ob menjavi dejavnosti premakne seznam izpod kazalca. Višino
 * rezervira CSS, tu se varuje predpostavka, na kateri ta rezervacija stoji.
 */
const MAX_LENGTH: Record<string, number> = {
  'landing.heroTitle': 70,
  'landing.heroSubtitle': 200,
  'results.headline': 90,
  'emailGate.title': 70,
};

/** Splošna meja za vse ostalo: uvod sme pojasniti, ne sme pa postati esej. */
const MAX_LENGTH_DEFAULT = 400;

const ENTRIES = SEGMENT_ORDER.map((id) => [id, SEGMENT_COPY[id]] as const);

describe('Register besedil po dejavnosti', () => {
  it('pokriva natanko dejavnosti iz SEGMENT_ORDER', () => {
    // Manjkajoča dejavnost bi se izrisala z nevtralnim naslovom, odvečna pa bi
    // bila mrtva koda, ki jo nekdo vzdržuje v prepričanju, da je vidna.
    expect(Object.keys(SEGMENT_COPY).sort()).toEqual([...SEGMENT_ORDER].sort());
    for (const [id] of ENTRIES) {
      expect(SEGMENTS[id], id).toBeDefined();
    }
  });

  it('vsaka dejavnost ima svoj id v svojem vnosu', () => {
    for (const [id, copy] of ENTRIES) {
      expect(copy.id, `${id}: id v datoteki se ne ujema s ključem registra`).toBe(id);
    }
  });

  it('vsako obvezno polje je napisano, ne le prisotno', () => {
    for (const [id, copy] of ENTRIES) {
      const values = new Map(flatten(copy));
      for (const path of REQUIRED_PATHS) {
        const value = values.get(path);
        expect(value, `${id}/${path}: manjka`).toBeTypeOf('string');
        expect((value ?? '').trim().length, `${id}/${path}: prazno`).toBeGreaterThan(0);
      }
    }
  });

  it('nobeno polje ni pri vseh sedmih dejavnostih enako', () => {
    // Detektor neprilagojenega kopiranja. Sproži se samo, kadar pot definira
    // VSEH sedem in so vse vrednosti iste - pot, ki jo ima ena ali nobena, je
    // sredi pisanja, ne napaka. Niz, ki je res povsod enak, sodi v SHARED_COPY
    // ali v NEUTRAL_COPY; sedem prepisov pomeni, da se bo šesti pozabil.
    const byPath = new Map<string, string[]>();
    for (const [, copy] of ENTRIES) {
      for (const [path, value] of flatten(copy)) {
        if (path === 'id') continue;
        byPath.set(path, [...(byPath.get(path) ?? []), value]);
      }
    }
    for (const [path, values] of byPath) {
      if (values.length < ENTRIES.length) continue;
      expect(
        new Set(values).size,
        `${path}: sedemkrat isto besedilo - sodi v SHARED_COPY ali NEUTRAL_COPY`,
      ).toBeGreaterThan(1);
    }
  });

  it('naslovi ostanejo kratki, uvodi pa ne preidejo v esej', () => {
    for (const [id, copy] of ENTRIES) {
      for (const [path, value] of flatten(copy)) {
        if (path === 'id') continue;
        const limit = MAX_LENGTH[path] ?? MAX_LENGTH_DEFAULT;
        expect(value.length, `${id}/${path}: ${value.length} znakov, dovoljeno ${limit}`).toBeLessThanOrEqual(limit);
      }
    }
  });

  it('naslov obrazca poimenuje rezultat in poročilo', () => {
    // Obrazec stoji pred rezultatom in odklene dvoje. Naslov, ki bi obljubil samo
    // PDF, pusti obiskovalca v prepričanju, da je rezultat brezplačen (tako je
    // nekoč pisalo na uvodu); naslov brez poročila pa bi razšel gumb na
    // rezultatih ("Prenesi PDF poročilo") z obljubo, ki jo je pravkar izpolnil.
    for (const [id, copy] of ENTRIES) {
      const title = copy.emailGate.title.toLowerCase();
      expect(title, `${id}: naslov obrazca ne omenja rezultata`).toMatch(/rezultat/);
      expect(title, `${id}: naslov obrazca ne omenja poročila`).toMatch(/poročil/);
    }
  });

  it('ograda pri potencialu preživi vsak prepis', () => {
    // Konservativna ocena, ki izgubi ta stavek, se bere kot zaveza o prihranku.
    for (const id of SEGMENT_ORDER) {
      expect(getSegmentCopy(id).figures.potential.note, id).toMatch(/ni obljuba prihranka/i);
    }
  });

  it('nevtralno besedilo je popolno - razrešitev ne sme vrniti undefined', () => {
    for (const id of SEGMENT_ORDER) {
      for (const [path, value] of flatten(getSegmentCopy(id))) {
        expect(value, `${id}/${path}`).toBeTypeOf('string');
      }
    }
    // Vsaka pot nevtralnega besedila mora obstajati tudi po razrešitvi: če se
    // skupina doda v NEUTRAL_COPY in se pozabi v getSegmentCopy, jo komponenta
    // dobi kot undefined in naslov tiho izgine.
    const neutralPaths = flatten(NEUTRAL_COPY).map(([path]) => path);
    for (const id of SEGMENT_ORDER) {
      const resolved = new Map(flatten(getSegmentCopy(id)));
      for (const path of neutralPaths) {
        expect(resolved.has(path), `${id}/${path}: pot se je pri razreševanju izgubila`).toBe(true);
      }
    }
  });

  it('vrstica o kapaciteti obstaja samo tam, kjer jo je iz česa izračunati', () => {
    // Besedilo obljublja "N dodatnih strank"; brez accountingCapacity ali brez
    // vprašanja o urah na stranko števila ni in vrstica bi ostala prazna.
    for (const id of SEGMENT_ORDER) {
      const secondary = getSegmentCopy(id).results.capacitySecondary;
      if (secondary === null) continue;
      expect(SEGMENTS[id].accountingCapacity, `${id}: obljublja stranke, nima kapacitetnega preračuna`).toBeDefined();
      expect(secondary, `${id}: v besedilu manjka oznaka {count}`).toContain('{count}');
    }
  });

  it('skupna besedila niso prazna', () => {
    for (const [path, value] of flatten(SHARED_COPY)) {
      expect(value.trim().length, `SHARED_COPY.${path}`).toBeGreaterThan(0);
    }
  });
});

describe('Oznaka segmenta z velikostnim razredom', () => {
  it('ime dejavnosti ne nosi velikostnega razpona', () => {
    // Regresija: "Storitve in projekti 10–249 zaposlenih" je ostalo na zaslonu
    // tudi pri vnosu 400 zaposlenih, ker je bil razpon del imena. Razred je
    // izpeljan podatek in sodi v segmentLabelWithSize, ne v register besedil.
    for (const [id, copy] of ENTRIES) {
      expect(copy.displayName, `${id}: razpon sodi v segmentLabelWithSize`).not.toMatch(/\d/);
    }
  });

  it('pripne razred, ki ustreza vnesenemu številu', () => {
    expect(segmentLabelWithSize('Proizvodnja', 9)).toBe('Proizvodnja · 1–9 zaposlenih');
    expect(segmentLabelWithSize('Proizvodnja', 10)).toBe('Proizvodnja · 10–49 zaposlenih');
    expect(segmentLabelWithSize('Proizvodnja', 249)).toBe('Proizvodnja · 50–249 zaposlenih');
    expect(segmentLabelWithSize('Proizvodnja', 250)).toBe('Proizvodnja · 250+ zaposlenih');
    expect(segmentLabelWithSize('Storitve in projekti', 400)).toBe(
      'Storitve in projekti · 250+ zaposlenih',
    );
  });

  it('brez vnosa ostane samo ime — razred bi bil trditev brez podatka', () => {
    expect(segmentLabelWithSize('Proizvodnja', 0)).toBe('Proizvodnja');
  });
});
