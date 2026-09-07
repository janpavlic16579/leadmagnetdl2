import { describe, it, expect } from 'vitest';
import {
  MACHINE_HOURS_UNIT,
  PLASTIKA_MODULES,
  diagnostika_plastika,
  granulat_plastika,
  orodja_plastika,
  planiranje_plastika,
  stroji_plastika,
  zaloge_plastika,
} from './plastika';
import { ADDRESSABLE_SHARE } from './addressableShare';
import type { ComputeContext, ModuleDefinition, ModuleOutputDraft } from './moduleTypes';
import { resolveInputs } from '../../lib/moduleEngine';
import { assessHoursPlausibility } from '../../lib/plausibility';
import { reducibleShareOf } from './shared';
import { SEGMENTS } from '../segments';

/**
 * Testi držijo iste lastnosti kot pri proizvodnji: postavka je v natanko enem
 * košu, compute() vrne dejanski sedanji strošek, ista ura ali evro ni v dveh
 * področjih. Lastnosti, značilni za to dejavnost: operativna ura je STROJNA ura
 * (menjave, zastoji in čakanje na material se vrednotijo po njej, človek-ure po
 * administrativni) in strojne ure ne vstopajo v plauzibilnostno ovojnico
 * zaposlenih.
 */

// Postavki sta namenoma taki, da ena ni večkratnik druge: zamenjava strojne (31)
// in administrativne (25) ure se v izidu takoj pozna.
const CONTEXT: ComputeContext = {
  operationalHourCostEUR: 31,
  adminHourCostEUR: 25,
  chargeOutRateEUR: 55,
  // Moduli te dejavnosti prihodka in marže ne berejo. 0 in ne izmišljena vrednost:
  // promet, ki ga ni, ne sme ustvariti zneska, če ga kak izid vseeno uporabi.
  annualRevenueEUR: 0,
  contributionMarginRate: 0,
  capitalCostRate: 0.06,
};
const MONTHS = 12;

function run(definition: ModuleDefinition, overrides: Record<string, number> = {}): ModuleOutputDraft[] {
  return definition.compute(resolveInputs(definition, overrides), CONTEXT);
}

/** Testi naj se ne opirajo na vrstni red izidov v tabeli. */
function pick(outputs: ModuleOutputDraft[], label: string): ModuleOutputDraft {
  const found = outputs.find((output) => output.label === label);
  if (!found) throw new Error(`Ni izida z oznako "${label}"`);
  return found;
}

const COSTED_MODULES = [
  stroji_plastika,
  granulat_plastika,
  planiranje_plastika,
  orodja_plastika,
  zaloge_plastika,
];

describe('Izkoriščenost strojev, menjave orodij in javljanje', () => {
  const outputs = run(stroji_plastika, {
    toolChangesPerWeek: 12,
    avgToolChangeMinutes: 45,
    manualReportingHoursPerMonth: 48,
    mainCause: 1, // Časi menjav se ne merijo → data
  });

  it('menjave so kapaciteta po strojni uri: menjav/teden × minute → strojne ure na mesec', () => {
    const item = pick(outputs, 'Menjave orodij (strojne ure)');
    expect(item.bucket).toBe('capacity');
    // 12 × 45 min = 9 h na teden × 52 / 12 = 39 strojnih ur na mesec.
    expect(item.hoursPerMonth).toBeCloseTo(39, 6);
    expect(item.valueEUR).toBeCloseTo(39 * CONTEXT.operationalHourCostEUR * MONTHS, 6);
  });

  it('menjava ima fizično dno — meja naslovljivosti veže tudi podatkovni vzrok', () => {
    const item = pick(outputs, 'Menjave orodij (strojne ure)');
    expect(item.addressableShare).toBe(ADDRESSABLE_SHARE.data);
    expect(item.addressableCap).toBe(0.3);
  });

  it('ročno javljanje je delo ob stroju in gre po administrativni uri, brez meje', () => {
    const item = pick(outputs, 'Ročno javljanje in prepisovanje proizvodnih podatkov');
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(48 * CONTEXT.adminHourCostEUR * MONTHS);
    expect(item.hoursPerMonth).toBe(48);
    expect(item.addressableCap).toBeUndefined();
  });

  it('število menjav brez trajanja ne ustvari zneska in obratno', () => {
    expect(pick(run(stroji_plastika, { toolChangesPerWeek: 20 }), 'Menjave orodij (strojne ure)').valueEUR).toBe(0);
    expect(pick(run(stroji_plastika, { avgToolChangeMinutes: 60 }), 'Menjave orodij (strojne ure)').valueEUR).toBe(0);
  });

  it('število strojev in način merjenja izkoriščenosti sta samo kontekst', () => {
    const base = run(stroji_plastika, { toolChangesPerWeek: 10, avgToolChangeMinutes: 30 });
    const twist = run(stroji_plastika, {
      toolChangesPerWeek: 10,
      avgToolChangeMinutes: 30,
      machineCount: 40,
      utilizationTracking: 3,
    });
    expect(twist).toEqual(base);
  });
});

describe('Poraba granulata, izmet in reklamacije', () => {
  const outputs = run(granulat_plastika, {
    annualGranulateSpendEUR: 4_000_000,
    scrapSharePercent: 0.03,
    annualClaimsCostEUR: 6_000,
    mainCause: 0, // Normativi niso ažurni → data
  });

  it('izmet je neposredna izguba: vrednost granulata × delež izmeta, s tehnološkim dnom', () => {
    const item = pick(outputs, 'Izmet in odpadni material');
    expect(item.bucket).toBe('directLoss');
    expect(item.valueEUR).toBe(120_000);
    expect(item.addressableShare).toBe(ADDRESSABLE_SHARE.data);
    expect(item.addressableCap).toBe(0.5);
  });

  it('reklamacije so neposredna izguba brez meje', () => {
    const item = pick(outputs, 'Reklamacije kupcev zaradi kakovosti');
    expect(item.bucket).toBe('directLoss');
    expect(item.valueEUR).toBe(6_000);
    expect(item.addressableCap).toBeUndefined();
  });

  it('delež izmeta brez vrednosti granulata ne ustvari zneska in obratno', () => {
    // Zmnožek dveh polj: samo delež trdi, da težava obstaja, zato mora priti od
    // obiskovalca — privzetek 0 varuje tudi defaults.test.ts.
    expect(pick(run(granulat_plastika, { scrapSharePercent: 0.05 }), 'Izmet in odpadni material').valueEUR).toBe(0);
    expect(
      pick(run(granulat_plastika, { annualGranulateSpendEUR: 2_000_000 }), 'Izmet in odpadni material').valueEUR,
    ).toBe(0);
  });

  it('nobena postavka ne uporabi urne postavke — področje meri denar, ne ure', () => {
    const cheap = run(granulat_plastika, { annualGranulateSpendEUR: 1_000_000, scrapSharePercent: 0.02 });
    const rich = granulat_plastika.compute(
      resolveInputs(granulat_plastika, { annualGranulateSpendEUR: 1_000_000, scrapSharePercent: 0.02 }),
      { ...CONTEXT, operationalHourCostEUR: 1_000, adminHourCostEUR: 1_000 },
    );
    expect(rich).toEqual(cheap);
  });
});

describe('Planiranje strojev in odpoklici kupcev', () => {
  const outputs = run(planiranje_plastika, {
    planningHoursPerMonth: 42,
    calloffAdminHoursPerMonth: 22,
    lateDeliveryCostEUR: 9_000,
    mainCause: 3, // Kupci spreminjajo odpoklice → external
  });

  it('planiranje in prepisovanje odpoklicov sta kapaciteta po administrativni uri', () => {
    const planning = pick(outputs, 'Planiranje in usklajevanje prioritet');
    expect(planning.bucket).toBe('capacity');
    expect(planning.valueEUR).toBe(42 * CONTEXT.adminHourCostEUR * MONTHS);
    expect(planning.hoursPerMonth).toBe(42);
    expect(pick(outputs, 'Prepisovanje naročil in odpoklicov kupcev').valueEUR).toBe(
      22 * CONTEXT.adminHourCostEUR * MONTHS,
    );
  });

  it('doplačila zaradi zamud so neposredna izguba', () => {
    const item = pick(outputs, 'Ekspresni prevozi, penali in popusti zaradi zamud');
    expect(item.bucket).toBe('directLoss');
    expect(item.valueEUR).toBe(9_000);
  });

  it('zunanji vzrok močno zniža naslovljiv delež', () => {
    expect(pick(outputs, 'Ekspresni prevozi, penali in popusti zaradi zamud').addressableShare).toBe(
      ADDRESSABLE_SHARE.external,
    );
  });
});

describe('Orodja, vzdrževanje in zastoji strojev', () => {
  const outputs = run(orodja_plastika, {
    toolBreakdownsPerMonth: 6,
    unplannedDowntimeHoursPerMonth: 24,
    annualRepairCostEUR: 12_000,
    mainCause: 0, // Cikli se ne spremljajo → data
  });

  it('nenačrtovani zastoji so kapaciteta po strojni uri', () => {
    const item = pick(outputs, 'Nenačrtovani zastoji strojev (strojne ure)');
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(24 * CONTEXT.operationalHourCostEUR * MONTHS);
    expect(item.hoursPerMonth).toBe(24);
  });

  it('popravila so neposredna izguba', () => {
    const item = pick(outputs, 'Nenačrtovana popravila in nadomestni deli');
    expect(item.bucket).toBe('directLoss');
    expect(item.valueEUR).toBe(12_000);
  });

  it('okvare ostanejo tudi ob načrtovanem vzdrževanju — meja 0,2 veže podatkovni vzrok pri obeh postavkah', () => {
    for (const label of ['Nenačrtovani zastoji strojev (strojne ure)', 'Nenačrtovana popravila in nadomestni deli']) {
      expect(pick(outputs, label).addressableShare, label).toBe(ADDRESSABLE_SHARE.data);
      expect(pick(outputs, label).addressableCap, label).toBe(0.2);
    }
  });

  it('število okvar je samo kontekst — ure zastojev so vnesene, ne izpeljane', () => {
    const base = run(orodja_plastika, { unplannedDowntimeHoursPerMonth: 10 });
    const twist = run(orodja_plastika, { unplannedDowntimeHoursPerMonth: 10, toolBreakdownsPerMonth: 30 });
    expect(twist).toEqual(base);
  });
});

describe('Zaloga granulata in gotovih izdelkov', () => {
  const outputs = run(zaloge_plastika, {
    inventoryValueEUR: 900_000,
    annualWriteOffEUR: 18_000,
    materialWaitingHoursPerMonth: 12,
    reducibleShare: 2, // 11–20 % → 0.15
    mainCause: 0, // Stanje zalog ni zanesljivo → data
  });

  it('odpisi so neposredna izguba, čakanje strojev na material pa kapaciteta po strojni uri', () => {
    expect(pick(outputs, 'Odpisi zaloge in inventurne razlike').bucket).toBe('directLoss');
    expect(pick(outputs, 'Odpisi zaloge in inventurne razlike').valueEUR).toBe(18_000);
    const waiting = pick(outputs, 'Čakanje strojev na material (strojne ure)');
    expect(waiting.bucket).toBe('capacity');
    expect(waiting.valueEUR).toBe(12 * CONTEXT.operationalHourCostEUR * MONTHS);
    expect(waiting.hoursPerMonth).toBe(12);
  });

  it('sprostljiv kapital je enkraten in nima naslovljivega deleža — ta znesek JE potencial', () => {
    const item = pick(outputs, 'Sprostljiv obratni kapital v zalogah');
    expect(item.bucket).toBe('oneTimeCapital');
    expect(item.valueEUR).toBe(900_000 * 0.15);
    expect(item.addressableShare).toBeUndefined();
  });

  it('"Ne vem" pri deležu zaloge pade na izmerjeno spodnjo mejo, ne na najnižji pas', () => {
    const valueOf = (share: number) =>
      pick(run(zaloge_plastika, { inventoryValueEUR: 900_000, reducibleShare: share }), 'Sprostljiv obratni kapital v zalogah').valueEUR ?? 0;
    expect(valueOf(4)).toBe(900_000 * reducibleShareOf(4));
    expect(valueOf(4)).toBeGreaterThan(valueOf(0));
  });
});

describe('Kratka diagnostika', () => {
  it('vrne tri ocene tveganja brez evrov', () => {
    const outputs = run(diagnostika_plastika);
    expect(outputs).toHaveLength(3);
    for (const output of outputs) {
      expect(output.bucket).toBe('risk');
      expect(output.valueEUR).toBeUndefined();
    }
  });

  it('najboljši odgovori dajo nizko, najslabši visoko tveganje', () => {
    const best = run(diagnostika_plastika, {
      realtimeProductionRecording: 0,
      knowsUnitCost: 0,
      batchTraceability: 0,
      materialCompositionKnown: 0,
      keyPersonIndependence: 0,
      documentedSettings: 0,
    });
    const worst = run(diagnostika_plastika, {
      realtimeProductionRecording: 3,
      knowsUnitCost: 3,
      batchTraceability: 3,
      materialCompositionKnown: 3,
      keyPersonIndependence: 3,
      documentedSettings: 3,
    });
    expect(best.every((output) => output.riskLevel === 'low')).toBe(true);
    expect(worst.every((output) => output.riskLevel === 'high')).toBe(true);
  });

  it('par o sledljivosti in sestavi materiala je ločena ocena (PPWR)', () => {
    const outputs = run(diagnostika_plastika, { batchTraceability: 3, materialCompositionKnown: 3 });
    expect(pick(outputs, 'Sledljivost in dokazovanje sestave (PPWR)').riskLevel).toBe('high');
    expect(pick(outputs, 'Zanesljivost podatkov').riskLevel).toBeUndefined();
    expect(pick(outputs, 'Procesna odpornost').riskLevel).toBeUndefined();
  });

  it('kljukica o trgu EU je samo kontekst — ocene ne premakne', () => {
    const base = run(diagnostika_plastika, { batchTraceability: 1 });
    const twist = run(diagnostika_plastika, { batchTraceability: 1, packagingOnEuMarket: 1 });
    expect(twist).toEqual(base);
  });

  it('ni v triaži — vprašanja se prikažejo vedno', () => {
    expect(diagnostika_plastika.triage).toBeUndefined();
  });
});

describe('Strojne ure', () => {
  it('polja s strojnimi urami nosijo enoto, ki se ne začne s h/ — ovojnica zaposlenih jih ne šteje', () => {
    const machineHourFields = COSTED_MODULES.flatMap((definition) =>
      definition.fields.filter((field) => field.unit === MACHINE_HOURS_UNIT).map((field) => `${definition.id}/${field.key}`),
    );
    expect(machineHourFields).toEqual([
      'orodja_plastika/unplannedDowntimeHoursPerMonth',
      'zaloge_plastika/materialWaitingHoursPerMonth',
    ]);
    expect(MACHINE_HOURS_UNIT.startsWith('h/')).toBe(false);
  });

  it('1.000 strojnih ur pri 12 zaposlenih ne sproži opozorila, 1.000 delovnih ur ga', () => {
    // 12 × 160 h = 1.920 h; prag 40 % = 768 h. Strojne ure niso ure ljudi: 30
    // strojev v treh izmenah pošteno vnese več ur, kot jih ima cela ekipa.
    const machine = assessHoursPlausibility(
      [orodja_plastika],
      { orodja_plastika: { unplannedDowntimeHoursPerMonth: 1_000 } },
      12,
    );
    expect(machine).toBeNull();

    const people = assessHoursPlausibility(
      [planiranje_plastika],
      { planiranje_plastika: { planningHoursPerMonth: 1_000 } },
      12,
    )!;
    expect(people.exceedsPlausible).toBe(true);
  });

  it('strojne postavke nosijo enoto v oznaki, ker motor strojne in delovne ure sešteje', () => {
    const labels = [
      ...run(stroji_plastika, { toolChangesPerWeek: 1, avgToolChangeMinutes: 60 }),
      ...run(orodja_plastika, { unplannedDowntimeHoursPerMonth: 1 }),
      ...run(zaloge_plastika, { materialWaitingHoursPerMonth: 1 }),
    ]
      .filter(
        (output) =>
          output.bucket === 'capacity' &&
          (output.hoursPerMonth ?? 0) > 0 &&
          // Toleranca zaradi vrstnega reda množenja (ure × postavka × 12 proti postavka × 12 × ure).
          Math.abs((output.valueEUR ?? 0) - CONTEXT.operationalHourCostEUR * MONTHS * (output.hoursPerMonth ?? 0)) < 1e-6,
      )
      .map((output) => output.label);
    for (const label of labels) {
      expect(label, label).toContain('strojne ure');
    }
    expect(labels.length).toBeGreaterThanOrEqual(3);
  });
});

describe('Skupne lastnosti stroškovnih modulov', () => {
  it('vsak modul ima 5–6 polj, da vprašalnik ostane kratek', () => {
    for (const definition of COSTED_MODULES) {
      expect(definition.fields.length, definition.id).toBeGreaterThanOrEqual(5);
      expect(definition.fields.length, definition.id).toBeLessThanOrEqual(6);
    }
  });

  it('neodgovorjen glavni vzrok da konservativen delež', () => {
    for (const definition of COSTED_MODULES) {
      const outputs = run(definition).filter((output) => output.addressableShare !== undefined);
      expect(outputs.length, definition.id).toBeGreaterThan(0);
      for (const output of outputs) {
        expect(output.addressableShare, `${definition.id}: ${output.label}`).toBe(
          ADDRESSABLE_SHARE.unknown,
        );
      }
    }
  });

  it('privzete vrednosti dajo 0 EUR — neizpolnjeno področje ne prispeva ničesar', () => {
    for (const definition of COSTED_MODULES) {
      for (const output of run(definition)) {
        if (output.valueEUR === undefined) continue;
        expect(Number.isFinite(output.valueEUR), `${definition.id}: ${output.label}`).toBe(true);
        expect(output.valueEUR, `${definition.id}: ${output.label}`).toBe(0);
      }
    }
  });

  it('polja s contextOnly ne premaknejo nobene številke', () => {
    const scenarios: {
      definition: ModuleDefinition;
      base: Record<string, number>;
      twist: Record<string, number>;
    }[] = [
      {
        definition: granulat_plastika,
        base: { annualGranulateSpendEUR: 500_000, scrapSharePercent: 0.03, consumptionVsNorm: 0, regranulateTracking: 0 },
        twist: { annualGranulateSpendEUR: 500_000, scrapSharePercent: 0.03, consumptionVsNorm: 2, regranulateTracking: 2 },
      },
      {
        definition: planiranje_plastika,
        base: { planningHoursPerMonth: 30, planningMethod: 0, calloffChannel: 0 },
        twist: { planningHoursPerMonth: 30, planningMethod: 3, calloffChannel: 3 },
      },
      {
        definition: orodja_plastika,
        base: { annualRepairCostEUR: 9_000, cycleTracking: 0, energyTracking: 0 },
        twist: { annualRepairCostEUR: 9_000, cycleTracking: 2, energyTracking: 2 },
      },
      {
        definition: zaloge_plastika,
        base: { annualWriteOffEUR: 9_000, stockVisibility: 0 },
        twist: { annualWriteOffEUR: 9_000, stockVisibility: 3 },
      },
    ];

    for (const { definition, base, twist } of scenarios) {
      expect(run(definition, twist), definition.id).toEqual(run(definition, base));
    }
  });

  it('ista oznaka postavke nikoli ne pristane v dveh koših', () => {
    const bucketByLabel = new Map<string, string>();
    for (const definition of COSTED_MODULES) {
      for (const output of run(definition)) {
        const previous = bucketByLabel.get(output.label);
        expect(previous === undefined || previous === output.bucket, output.label).toBe(true);
        bucketByLabel.set(output.label, output.bucket);
      }
    }
  });

  it('ure se ne štejejo dvakrat: menjava, okvara in čakanje na material so trije ločeni izidi', () => {
    expect(pick(run(stroji_plastika, { toolChangesPerWeek: 3, avgToolChangeMinutes: 60 }), 'Menjave orodij (strojne ure)').hoursPerMonth).toBeCloseTo(13, 6);
    expect(pick(run(orodja_plastika, { unplannedDowntimeHoursPerMonth: 20 }), 'Nenačrtovani zastoji strojev (strojne ure)').hoursPerMonth).toBe(20);
    expect(pick(run(zaloge_plastika, { materialWaitingHoursPerMonth: 7 }), 'Čakanje strojev na material (strojne ure)').hoursPerMonth).toBe(7);
  });

  it('nobeno področje ne uporabi zaračunane postavke, prihodka ali marže', () => {
    // Izguba se v tej dejavnosti meri kot delež porabljenega granulata in kot
    // strojne ure, ne kot delež prometa; kontekst zato marže ne vpraša
    // (contexts/plastika.ts). Če bi jo kak modul začel uporabljati, mora vprašanje
    // priti zraven — ta test to zahtevo drži.
    const input = {
      toolChangesPerWeek: 10,
      avgToolChangeMinutes: 30,
      manualReportingHoursPerMonth: 20,
      annualGranulateSpendEUR: 1_000_000,
      scrapSharePercent: 0.03,
      planningHoursPerMonth: 30,
      unplannedDowntimeHoursPerMonth: 10,
      annualWriteOffEUR: 5_000,
    };
    const rich = { ...CONTEXT, chargeOutRateEUR: 1_000, annualRevenueEUR: 50_000_000, contributionMarginRate: 0.9 };
    for (const definition of COSTED_MODULES) {
      const resolved = resolveInputs(definition, input);
      expect(definition.compute(resolved, rich), definition.id).toEqual(definition.compute(resolved, CONTEXT));
    }
  });

  it('register segmenta našteje natanko te module, panožne pred horizontalami', () => {
    const ids = SEGMENTS.plastika.moduleIds;
    const industryIds = PLASTIKA_MODULES.map((definition) => definition.id);
    for (const id of industryIds) {
      expect(ids, id).toContain(id);
    }
    // Panožna stroškovna področja stojijo pred prvo horizontalo, diagnostika za njo.
    const firstHorizontal = ids.indexOf('analitikaHz');
    for (const definition of COSTED_MODULES) {
      expect(ids.indexOf(definition.id), definition.id).toBeLessThan(firstHorizontal);
    }
    expect(ids.indexOf('diagnostika_plastika')).toBeGreaterThan(firstHorizontal);
    // servisHz meri servis po predaji; reklamacije meri panožni modul granulat_plastika.
    expect(ids).not.toContain('servisHz');
  });
});
