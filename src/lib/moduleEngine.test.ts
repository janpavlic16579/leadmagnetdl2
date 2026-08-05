import { describe, it, expect } from 'vitest';
import {
  aggregateBuckets,
  computeModules,
  DEFAULT_COST_CONTEXT,
  findHighestModule,
  isModuleAnswered,
  resolveActiveModules,
  resolveInputs,
  selectTopModules,
} from './moduleEngine';
import { calculateTotalAnnualLoss } from './calculations';
import { ALL_MODULES, getModules, MODULE_REGISTRY } from '../config/modules';
import { SEGMENTS, SEGMENT_ORDER } from '../config/segments';
import { MODULE_METHODOLOGY } from '../../content/methodology';
import { ACTION_PLANS } from '../../content/actions/actions';
import type { ModuleOutput } from '../config/modules/moduleTypes';

const output = (partial: Partial<ModuleOutput> & Pick<ModuleOutput, 'bucket'>): ModuleOutput => ({
  moduleId: 'test',
  label: 'test',
  ...partial,
});

describe('aggregateBuckets', () => {
  it('enkratni kapital se NIKOLI ne prišteje k neposrednim izgubam', () => {
    const totals = aggregateBuckets([
      output({ bucket: 'directLoss', valueEUR: 10000 }),
      output({ bucket: 'oneTimeCapital', valueEUR: 500000 }),
    ]);

    expect(totals.directLossEUR).toBe(10000);
    expect(totals.oneTimeCapitalEUR).toBe(500000);
  });

  it('kapaciteta se sešteva ločeno, skupaj z urami', () => {
    const totals = aggregateBuckets([
      output({ bucket: 'capacity', valueEUR: 12000, hoursPerMonth: 40 }),
      output({ bucket: 'capacity', valueEUR: 6000, hoursPerMonth: 20 }),
      output({ bucket: 'directLoss', valueEUR: 1000 }),
    ]);

    expect(totals.capacityEUR).toBe(18000);
    expect(totals.capacityHoursPerMonth).toBe(60);
    expect(totals.directLossEUR).toBe(1000);
  });

  it('tveganja se zbirajo kot seznam, ne kot znesek', () => {
    const totals = aggregateBuckets([
      output({ bucket: 'risk', label: 'SQL Server 2016', riskLevel: 'high' }),
    ]);

    expect(totals.risks).toHaveLength(1);
    expect(totals.directLossEUR).toBe(0);
  });
});

describe('resolveInputs', () => {
  it('manjkajoča polja dobijo privzeto vrednost, nikoli delnega vnosa', () => {
    const definition = MODULE_REGISTRY.A_trgovina;
    const resolved = resolveInputs(definition, { documentsPerMonth: 800 });

    expect(resolved.documentsPerMonth).toBe(800);
    expect(resolved.minutesPerDocument).toBe(3);
    expect(resolved.hourlyLaborCostEUR).toBe(25);
  });

  it('nedefinirana vrednost ne povozi privzete z NaN', () => {
    const definition = MODULE_REGISTRY.A_trgovina;
    const resolved = resolveInputs(definition, { documentsPerMonth: Number.NaN });

    expect(resolved.documentsPerMonth).toBe(0);
  });
});

describe('Skladnost s prejšnjim motorjem', () => {
  // Ključni test migracije: directLossEUR mora biti številčno enak nekdanjemu
  // totalAnnualLossEUR, sicer se je matematika ob prepisu v register tiho spremenila.
  //
  // Id-ji so navedeni izrecno in ne prek SEGMENTS.trgovina: veleprodaja je od
  // predelave naprej na svojih modulih, teh pa ne uporablja noben segment več.
  // Test zato varuje legacy.ts neposredno — in ravno zato mora ostati: dokler te
  // definicije obstajajo, je edini dokaz, da se njihova matematika ni premaknila.
  const LEGACY_TRGOVINA = ['A_trgovina', 'B_trgovina', 'C_trgovina', 'D_trgovina', 'E'];

  const scenario = {
    documentsPerMonth: 800,
    minutesPerDocument: 3,
    hourlyLaborCostEUR: 25,
    transactionsPerMonth: 20000,
    errorRatePercent: 0.015,
    costPerErrorEUR: 25,
    inventoryValueEUR: 500000,
    achievableReductionPercent: 0.04,
    capitalCostPercent: 0.1,
    annualRevenueEUR: 5000000,
    currentDSODays: 60,
    targetReductionDays: 5,
    opportunityCostPercent: 0.06,
  };

  it('preneseni moduli A–D: vsota po koših je enaka calculateTotalAnnualLoss', () => {
    const definitions = getModules(LEGACY_TRGOVINA);
    const inputs = Object.fromEntries(definitions.map((d) => [d.id, scenario]));
    const totals = aggregateBuckets(computeModules(definitions, inputs));

    const expected = calculateTotalAnnualLoss({
      A: { annualEUR: (800 * 3) / 60 * 25 * 12, hoursFreedPerMonth: 40 },
      B: { annualEUR: 20000 * 0.015 * 25 * 12 },
      C: { annualEUR: 500000 * 0.04 * 0.1, releasedCapitalEUR: 500000 * 0.04 },
      D: { annualEUR: (5000000 / 365) * 5 * 0.06 },
    });

    expect(totals.directLossEUR).toBeCloseTo(expected, 6);
  });

  it('sproščen kapital modula C ostane izven letne vsote', () => {
    const definitions = getModules(LEGACY_TRGOVINA);
    const inputs = Object.fromEntries(definitions.map((d) => [d.id, scenario]));
    const totals = aggregateBuckets(computeModules(definitions, inputs));

    expect(totals.oneTimeCapitalEUR).toBeCloseTo(500000 * 0.04, 6);
    expect(totals.directLossEUR).not.toBeCloseTo(totals.oneTimeCapitalEUR, 0);
  });

  it('modul E prispeva tveganja in nič evrov', () => {
    const definitions = getModules(['E']);
    const totals = aggregateBuckets(
      computeModules(definitions, { E: { sqlServer2016: 1, windowsServer2016: 0, eInvoiceZierded: 1 } }),
    );

    expect(totals.risks).toHaveLength(2);
    expect(totals.directLossEUR).toBe(0);
    expect(totals.capacityEUR).toBe(0);
  });
});

describe('findHighestModule', () => {
  const order = ['a', 'b', 'c'];

  it('izbere modul z najvišjo denarno postavko', () => {
    const highest = findHighestModule(
      [
        { moduleId: 'a', bucket: 'directLoss', label: '', valueEUR: 100 },
        { moduleId: 'b', bucket: 'directLoss', label: '', valueEUR: 900 },
        { moduleId: 'c', bucket: 'capacity', label: '', valueEUR: 500 },
      ],
      order,
    );
    expect(highest).toBe('b');
  });

  it('enkratni kapital ne more povoziti ponavljajoče se izgube', () => {
    const highest = findHighestModule(
      [
        { moduleId: 'a', bucket: 'directLoss', label: '', valueEUR: 100 },
        { moduleId: 'b', bucket: 'oneTimeCapital', label: '', valueEUR: 900000 },
      ],
      order,
    );
    expect(highest).toBe('a');
  });

  it('ob izenačenju zmaga modul, ki je prej po prioriteti', () => {
    const highest = findHighestModule(
      [
        { moduleId: 'b', bucket: 'directLoss', label: '', valueEUR: 500 },
        { moduleId: 'a', bucket: 'directLoss', label: '', valueEUR: 500 },
      ],
      order,
    );
    expect(highest).toBe('a');
  });

  it('vrne null, ko ni nobene pozitivne postavke', () => {
    expect(findHighestModule([], order)).toBeNull();
    expect(
      findHighestModule([{ moduleId: 'a', bucket: 'directLoss', label: '', valueEUR: 0 }], order),
    ).toBeNull();
  });
});

describe('Triaža', () => {
  const triageable = ['planiranje', 'material', 'zaloge', 'nalogi', 'zamude'];

  it('izbere tri najbolj boleče module', () => {
    const selected = selectTopModules(
      triageable,
      { planiranje: 1, material: 3, zaloge: 0, nalogi: 2, zamude: 3 },
      3,
    );
    expect(selected).toEqual(['material', 'nalogi', 'zamude']);
  });

  it('izenačenje razreši vrstni red prioritete', () => {
    const selected = selectTopModules(
      triageable,
      { planiranje: 2, material: 2, zaloge: 2, nalogi: 2, zamude: 2 },
      3,
    );
    expect(selected).toEqual(['planiranje', 'material', 'zaloge']);
  });

  it('brez odgovorov dobi obiskovalec prve tri po prioriteti, ne naključnih', () => {
    const selected = selectTopModules(triageable, {}, 3);
    expect(selected).toEqual(['planiranje', 'material', 'zaloge']);
  });

  it('izbrani moduli so vrnjeni v prioritetnem vrstnem redu', () => {
    const selected = selectTopModules(
      triageable,
      { zamude: 3, planiranje: 3, nalogi: 3 },
      3,
    );
    expect(selected).toEqual(['planiranje', 'nalogi', 'zamude']);
  });

  it('brez preference se vedenje ne spremeni', () => {
    // Varuje privzeto vrednost četrtega parametra: dejavnost brez defaultIds mora
    // dobiti natanko isto izbiro kot pred uvedbo preference.
    expect(selectTopModules(triageable, {}, 3, [])).toEqual(selectTopModules(triageable, {}, 3));
    expect(selectTopModules(triageable, {}, 3, undefined)).toEqual(
      selectTopModules(triageable, {}, 3),
    );
  });

  it('preferenca določi privzeto izbiro, izid pa ostane v vrstnem redu prikaza', () => {
    const selected = selectTopModules(triageable, {}, 3, ['zamude', 'nalogi', 'material']);
    // Izbrani so preferirani trije, vrnjeni pa po moduleIds — to je nosilna
    // lastnost: vrstni red prikaza v rezultatih se s preferenco ne premakne.
    expect(selected).toEqual(['material', 'nalogi', 'zamude']);
  });

  it('višja ocena premaga preferenco', () => {
    const selected = selectTopModules(triageable, { planiranje: 3 }, 1, ['zamude']);
    expect(selected).toEqual(['planiranje']);
  });

  it('preferenca razreši izenačenje pri enakih ocenah', () => {
    const scores = { planiranje: 2, material: 2, zaloge: 2, nalogi: 2, zamude: 2 };
    // Brez preference bi zmagal planiranje (prvi po prikazu).
    expect(selectTopModules(triageable, scores, 1)).toEqual(['planiranje']);
    expect(selectTopModules(triageable, scores, 1, ['zaloge'])).toEqual(['zaloge']);
  });

  it('delna preferenca se dopolni po vrstnem redu prikaza', () => {
    const selected = selectTopModules(triageable, {}, 3, ['zamude', 'nalogi']);
    expect(selected).toEqual(['planiranje', 'nalogi', 'zamude']);
  });

  it('neznan id v preferenci se preskoči in ne pusti praznega mesta', () => {
    const selected = selectTopModules(triageable, {}, 2, ['neobstojec', 'zamude']);
    expect(selected).toEqual(['planiranje', 'zamude']);
  });
});

describe('isModuleAnswered', () => {
  const definition = MODULE_REGISTRY.planiranje;

  it('modul na samih privzetih vrednostih ni izpolnjen', () => {
    expect(isModuleAnswered(definition, resolveInputs(definition, {}))).toBe(false);
  });

  it('manjkajoče vrednosti ne veljajo za izpolnjene', () => {
    expect(isModuleAnswered(definition, undefined)).toBe(false);
    expect(isModuleAnswered(definition, {})).toBe(false);
  });

  it('ena vnesena številka zadošča', () => {
    expect(isModuleAnswered(definition, resolveInputs(definition, { waitingHoursPerMonth: 10 }))).toBe(
      true,
    );
  });

  it('polje contextOnly ne velja za odgovor — ne premakne nobene številke', () => {
    // planningMethod je contextOnly; sprememba samo tega pusti izračun pri 0 EUR.
    expect(isModuleAnswered(definition, resolveInputs(definition, { planningMethod: 3 }))).toBe(false);
  });

  it('spremenjen glavni vzrok velja za odgovor', () => {
    expect(isModuleAnswered(definition, resolveInputs(definition, { mainCause: 0 }))).toBe(true);
  });
});

describe('resolveActiveModules', () => {
  it('moduli brez triaže se prikažejo vedno, tudi če niso izbrani', () => {
    const definitions = getModules(SEGMENTS.proizvodnja.moduleIds);
    const active = resolveActiveModules(definitions, ['planiranje']);
    const ids = active.map((d) => d.id);

    expect(ids).toContain('planiranje');
    expect(ids).toContain('diagnostika');
    expect(ids).toContain('E');
    expect(ids).not.toContain('material');
  });

  it('brez triaže segment obdrži vse module', () => {
    // Splošni segment je od predelave naprej edini brez triaže — veleprodaja jo je
    // dobila skupaj s svojimi moduli.
    const definitions = getModules(SEGMENTS.splosno.moduleIds);
    expect(resolveActiveModules(definitions, null)).toHaveLength(definitions.length);
  });
});

describe('Celovitost registra', () => {
  it('noben id modula se ne ponovi čez dejavnosti', () => {
    // Register je ena preslikava: podvojen id bi tiho povozil prejšnji modul in
    // obiskovalec bi dobil vprašanja druge dejavnosti. Napaka bi bila vidna šele
    // v vprašalniku, ne pri prevajanju.
    expect(Object.keys(MODULE_REGISTRY)).toHaveLength(ALL_MODULES.length);
  });

  it('vsak moduleId vsakega segmenta obstaja v registru', () => {
    for (const segmentId of SEGMENT_ORDER) {
      const segment = SEGMENTS[segmentId];
      for (const moduleId of segment.moduleIds) {
        expect(MODULE_REGISTRY[moduleId], `${segmentId} → ${moduleId}`).toBeDefined();
      }
    }
  });

  it('noben id modula se ne pojavi dvakrat', () => {
    // MODULE_REGISTRY je Object.fromEntries(ALL_MODULES): ob trku id-jev bi drugi
    // modul tiho povozil prvega in kalkulator bi zastavil vprašanja druge dejavnosti.
    // Register je s trgovino in maloprodajo zrasel s 15 na 27 vnosov — ročno tega
    // nihče več ne preveri.
    const ids = ALL_MODULES.map((definition) => definition.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('vsak modul s triažo ima razlago metodologije in akcijski načrt', () => {
    // Modul brez vnosa se prikaže brez razlage, brez akcijskega načrta pa tiho
    // izgine "3 ukrepi ta teden" — ravno takrat, ko je modul največja postavka.
    for (const definition of Object.values(MODULE_REGISTRY)) {
      if (definition.triage === undefined) continue;
      expect(MODULE_METHODOLOGY[definition.id], `metodologija: ${definition.id}`).toBeDefined();
      expect(ACTION_PLANS[definition.id], `ukrepi: ${definition.id}`).toBeDefined();
    }
  });

  it('ključi polj so znotraj modula unikatni', () => {
    for (const definition of Object.values(MODULE_REGISTRY)) {
      const keys = definition.fields.map((field) => field.key);
      expect(new Set(keys).size, definition.id).toBe(keys.length);
    }
  });

  it('polja tipa choice imajo možnosti, ki vključujejo privzeto vrednost', () => {
    for (const definition of Object.values(MODULE_REGISTRY)) {
      for (const field of definition.fields) {
        if (field.kind !== 'choice') continue;
        expect(field.choices, `${definition.id}.${field.key}`).toBeDefined();
        expect(field.choices!.map((choice) => choice.value)).toContain(field.default);
      }
    }
  });

  it('vsak modul s privzetimi vrednostmi vrne izide brez NaN', () => {
    for (const definition of Object.values(MODULE_REGISTRY)) {
      const outputs = definition.compute(resolveInputs(definition, undefined), DEFAULT_COST_CONTEXT);
      for (const item of outputs) {
        if (item.valueEUR !== undefined) {
          expect(Number.isFinite(item.valueEUR), `${definition.id}: ${item.label}`).toBe(true);
        }
      }
    }
  });

  it('nedotaknjeno področje prispeva natanko 0 EUR', () => {
    // Invarianta, zaradi katere je varno, da obiskovalec obkljuka vseh pet področij:
    // izbira sama ne sme dodati nobenega evra. Vsak neničelni privzetek (delež izmeta,
    // strošek kilometra) se mora množiti s količino, ki ima privzetek 0. Modul z
    // neničelno privzeto KOLIČINO bi obiskovalcu izmislil znesek, ki ga ni vnesel.
    for (const definition of Object.values(MODULE_REGISTRY)) {
      const outputs = definition.compute(resolveInputs(definition, undefined), DEFAULT_COST_CONTEXT);
      for (const item of outputs) {
        if (item.valueEUR !== undefined) {
          expect(item.valueEUR, `${definition.id}: ${item.label}`).toBe(0);
        }
      }
    }
  });

  it('privzeta triažna izbira je skladna s konfiguracijo segmenta', () => {
    // Vse odpovedi napačnega defaultIds so tihe: neznan id se ne ujame z ničimer in
    // mesto zapolni naslednji po vrstnem redu prikaza. Konfiguracija se torej ne
    // podre — samo napačna področja predizbere.
    for (const segmentId of SEGMENT_ORDER) {
      const segment = SEGMENTS[segmentId];
      if (!segment.triage) continue;

      const triageableIds = getModules(segment.moduleIds)
        .filter((definition) => definition.triage)
        .map((definition) => definition.id);

      expect(segment.triage.recommendedCount, `${segmentId}: recommendedCount`).toBeGreaterThanOrEqual(1);
      expect(segment.triage.recommendedCount, `${segmentId}: recommendedCount`).toBeLessThanOrEqual(
        triageableIds.length,
      );

      const defaultIds = segment.triage.defaultIds;
      if (!defaultIds) continue;

      expect(new Set(defaultIds).size, `${segmentId}: podvojen defaultId`).toBe(defaultIds.length);
      // Delen seznam bi tiho vrnil sklicevanje na vrstni red moduleIds, prav to pa
      // ta konfiguracija odpravlja — zato mora pokriti vsa priporočena mesta.
      expect(defaultIds.length, `${segmentId}: defaultIds`).toBeGreaterThanOrEqual(
        segment.triage.recommendedCount,
      );
      for (const id of defaultIds) {
        expect(triageableIds, `${segmentId}: defaultId "${id}" ni triažno področje`).toContain(id);
      }
    }
  });
});
