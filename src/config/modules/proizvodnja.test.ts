import { describe, it, expect } from 'vitest';
import { diagnostika, material, nalogi, planiranje, zaloge, zamude } from './proizvodnja';
import { ADDRESSABLE_SHARE } from './addressableShare';
import type { ComputeContext, ModuleDefinition, ModuleOutputDraft } from './moduleTypes';
import { resolveInputs } from '../../lib/moduleEngine';
import { reducibleShareOf } from './shared';

/**
 * Testi držijo dve lastnosti, na katerih stoji verodostojnost izračuna:
 * postavka je v natanko enem košu, in compute() vrne dejanski sedanji strošek —
 * ne stroška, vnaprej pomnoženega z domnevnim deležem izboljšave.
 */

const CONTEXT: ComputeContext = {
  operationalHourCostEUR: 22,
  adminHourCostEUR: 25,
  chargeOutRateEUR: 55,
  // Prihodek in marža sta obvezna v ComputeContext, moduli tega segmenta pa ju iz
  // konteksta ne berejo. 0 in ne izmišljena vrednost: promet, ki ga ni, ne sme
  // ustvariti zneska, če ga kak izid vseeno uporabi.
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

const COSTED_MODULES = [planiranje, material, zaloge, nalogi, zamude];

describe('Plan, kapacitete in navodila', () => {
  const outputs = run(planiranje, {
    waitingHoursPerMonth: 100,
    overtimeHoursPerMonth: 20,
    replanningHoursPerMonth: 40,
    mainCause: 0, // Plan in kapacitete niso ažurni → planning
  });

  it('zastoji in nadure so kapaciteta, ne neposredna izguba', () => {
    const item = pick(outputs, 'Zastoji in nadure v proizvodnji');
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(120 * CONTEXT.operationalHourCostEUR * MONTHS);
  });

  it('sproščene ure so surove mesečne ure, ne skrčene z deležem izboljšave', () => {
    expect(pick(outputs, 'Zastoji in nadure v proizvodnji').hoursPerMonth).toBe(120);
  });

  it('ponovno planiranje se vrednoti po administrativni, ne proizvodni uri', () => {
    expect(pick(outputs, 'Ponovno planiranje in usklajevanje').valueEUR).toBe(
      40 * CONTEXT.adminHourCostEUR * MONTHS,
    );
  });

  it('glavni vzrok določi naslovljiv delež', () => {
    expect(pick(outputs, 'Zastoji in nadure v proizvodnji').addressableShare).toBe(
      ADDRESSABLE_SHARE.planning,
    );
  });
});

describe('Izmet, dodelave in kakovost', () => {
  const outputs = run(material, {
    annualMaterialSpendEUR: 1_000_000,
    scrapSharePercent: 0.03,
    reworkHoursPerMonth: 50,
    annualClaimsCostEUR: 20_000,
    mainCause: 0, // Zastarele sestavnice → data
  });

  it('izmet in reklamacije sta neposredni izgubi', () => {
    expect(pick(outputs, 'Izmet materiala').bucket).toBe('directLoss');
    expect(pick(outputs, 'Izmet materiala').valueEUR).toBe(30_000);
    expect(pick(outputs, 'Reklamacije in vračila').valueEUR).toBe(20_000);
  });

  it('ure dodelav so kapaciteta — plačna masa se z njimi ne zniža', () => {
    const item = pick(outputs, 'Dodelave in ponovna izdelava');
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(50 * CONTEXT.operationalHourCostEUR * MONTHS);
  });

  it('vzrok v podatkih da najvišji naslovljiv delež', () => {
    expect(pick(outputs, 'Izmet materiala').addressableShare).toBe(ADDRESSABLE_SHARE.data);
  });
});

describe('Zaloge in razpoložljivost materiala', () => {
  const outputs = run(zaloge, {
    inventoryValueEUR: 800_000,
    annualWriteOffEUR: 25_000,
    materialWaitingHoursPerMonth: 60,
    reducibleShare: 2, // 11–20 % → 0.15
    mainCause: 1, // Stanje zalog ni zanesljivo → data
  });

  it('odpisi so neposredna izguba, čakanje na material pa kapaciteta', () => {
    expect(pick(outputs, 'Odpisi in razvrednotenja zalog').bucket).toBe('directLoss');
    expect(pick(outputs, 'Odpisi in razvrednotenja zalog').valueEUR).toBe(25_000);
    expect(pick(outputs, 'Čakanje na manjkajoč material').bucket).toBe('capacity');
    expect(pick(outputs, 'Čakanje na manjkajoč material').valueEUR).toBe(
      60 * CONTEXT.operationalHourCostEUR * MONTHS,
    );
  });

  it('sprostljiv kapital je enkraten in se ne meša med letne zneske', () => {
    const item = pick(outputs, 'Sprostljiv obratni kapital v zalogah');
    expect(item.bucket).toBe('oneTimeCapital');
    expect(item.valueEUR).toBe(800_000 * 0.15);
  });

  it('sprostljiv kapital nima naslovljivega deleža — ta znesek JE potencial', () => {
    expect(pick(outputs, 'Sprostljiv obratni kapital v zalogah').addressableShare).toBeUndefined();
  });

  // Doslej je "Ne vem" padel na natanko isti delež kot najnižji pas (0,05).
  // To ni bila konservativnost, ampak polovica spodnjega roba tega, kar Aberdeen
  // izmeri ob uvedbi ERP (13,4–25 %, konservativno sidro 10–15 %) — neodgovor je
  // obljubljal manj od najslabšega izmerjenega projekta. Odslej 0,10.
  it('"Ne vem" pade na izmerjeno spodnjo mejo, ne na najnižji pas', () => {
    const valueOf = (share: number) =>
      pick(run(zaloge, { inventoryValueEUR: 800_000, reducibleShare: share }), 'Sprostljiv obratni kapital v zalogah').valueEUR ?? 0;

    expect(valueOf(4)).toBe(800_000 * reducibleShareOf(4));
    expect(valueOf(4)).toBeGreaterThan(valueOf(0));
    expect(valueOf(4)).toBeLessThan(valueOf(2));
  });
});

describe('Delovni nalogi in podatki', () => {
  const outputs = run(nalogi, {
    orderAdminHoursPerMonth: 30,
    retypingHoursPerMonth: 25,
    dataFixHoursPerMonth: 15,
    mainCause: 0,
  });

  it('vse tri postavke so kapaciteta in ločene, da je vidno, kje delo nastaja', () => {
    expect(outputs).toHaveLength(3);
    expect(outputs.every((output) => output.bucket === 'capacity')).toBe(true);
  });

  it('ure se vrednotijo po administrativni uri', () => {
    expect(pick(outputs, 'Prepisovanje podatkov med orodji').valueEUR).toBe(
      25 * CONTEXT.adminHourCostEUR * MONTHS,
    );
  });
});

describe('Roki in nujni stroški', () => {
  const outputs = run(zamude, {
    expediteCostEUR: 15_000,
    penaltyCostEUR: 8_000,
    lostMarginEUR: 12_000,
    customerCommsHoursPerMonth: 20,
    mainCause: 3, // Zunanji dobavitelji ali kupci → external
  });

  // Namerna sprememba pričakovanja: izgubljena prispevna marža je bila prestavljena iz
  // 'directLoss' v 'lostMargin'. Ekspresna nabava in penal sta plačana in dokazljiva na
  // kontu; odpovedano naročilo je denar, ki ni nikoli prišel. Test meri prav to ločnico.
  it('plačani stroški so neposredne izgube, odpovedano naročilo pa nezaslužena marža', () => {
    const directLoss = outputs.filter((output) => output.bucket === 'directLoss');
    expect(directLoss).toHaveLength(2);
    expect(directLoss.reduce((sum, output) => sum + (output.valueEUR ?? 0), 0)).toBe(23_000);

    const lostMargin = outputs.filter((output) => output.bucket === 'lostMargin');
    expect(lostMargin).toHaveLength(1);
    expect(lostMargin[0].valueEUR).toBe(12_000);
  });

  it('obveščanje kupcev je kapaciteta', () => {
    const item = pick(outputs, 'Obveščanje in usklajevanje s kupci');
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(20 * CONTEXT.adminHourCostEUR * MONTHS);
  });

  it('zunanji vzrok močno zniža naslovljiv delež', () => {
    expect(pick(outputs, 'Ekspresne nabave in dostave').addressableShare).toBe(
      ADDRESSABLE_SHARE.external,
    );
  });
});

describe('Kratka diagnostika', () => {
  it('vrne dve oceni tveganja brez evrov', () => {
    const outputs = run(diagnostika);
    expect(outputs).toHaveLength(2);
    for (const output of outputs) {
      expect(output.bucket).toBe('risk');
      expect(output.valueEUR).toBeUndefined();
    }
  });

  it('najboljši odgovori dajo nizko, najslabši visoko tveganje', () => {
    const best = run(diagnostika, {
      realtimeRecording: 0,
      knowsUnitCost: 0,
      materialTraceability: 0,
      keyPersonIndependence: 0,
    });
    const worst = run(diagnostika, {
      realtimeRecording: 3,
      knowsUnitCost: 3,
      materialTraceability: 3,
      keyPersonIndependence: 3,
    });

    expect(best.every((output) => output.riskLevel === 'low')).toBe(true);
    expect(worst.every((output) => output.riskLevel === 'high')).toBe(true);
  });

  it('ni v triaži — vprašanja se prikažejo vedno', () => {
    expect(diagnostika.triage).toBeUndefined();
  });
});

describe('Skupne lastnosti stroškovnih modulov', () => {
  it('vsak modul ima 5–6 polj, da vprašalnik ostane kratek', () => {
    for (const definition of COSTED_MODULES) {
      expect(definition.fields.length, definition.id).toBeGreaterThanOrEqual(5);
      expect(definition.fields.length, definition.id).toBeLessThanOrEqual(6);
    }
  });

  // Vprašanje o glavnem vzroku nima privzetka (MAIN_CAUSE_UNANSWERED): brez izbire
  // ni označen noben radio, delež pa pade na konservativni 'unknown'. Ta test hodi
  // prek compute() in NE prek withoutUnknowns — celotno pot varuje moduleEngine.test.ts.
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

  it('polja s contextOnly ne premaknejo nobene številke', () => {
    const scenarios: {
      definition: ModuleDefinition;
      base: Record<string, number>;
      twist: Record<string, number>;
    }[] = [
      {
        definition: planiranje,
        base: { waitingHoursPerMonth: 100, replanningHoursPerMonth: 40, planningMethod: 0 },
        twist: { waitingHoursPerMonth: 100, replanningHoursPerMonth: 40, planningMethod: 3 },
      },
      {
        definition: zaloge,
        base: { inventoryValueEUR: 500_000, annualWriteOffEUR: 9_000, stockVisibility: 0 },
        twist: { inventoryValueEUR: 500_000, annualWriteOffEUR: 9_000, stockVisibility: 3 },
      },
      {
        definition: nalogi,
        base: { orderAdminHoursPerMonth: 30, reportingTiming: 0 },
        twist: { orderAdminHoursPerMonth: 30, reportingTiming: 3 },
      },
      {
        definition: zamude,
        base: { expediteCostEUR: 15_000, lateOrdersPerMonth: 0 },
        twist: { expediteCostEUR: 15_000, lateOrdersPerMonth: 90 },
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

  it('ure se ne štejejo dvakrat: zastoj zaradi plana in zaradi materiala sta ločena izida', () => {
    const planOutputs = run(planiranje, { waitingHoursPerMonth: 100 });
    const stockOutputs = run(zaloge, { materialWaitingHoursPerMonth: 60 });

    expect(pick(planOutputs, 'Zastoji in nadure v proizvodnji').hoursPerMonth).toBe(100);
    expect(pick(stockOutputs, 'Čakanje na manjkajoč material').hoursPerMonth).toBe(60);
  });
});
