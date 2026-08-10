import { describe, it, expect } from 'vitest';
import {
  diagnostikaTrgovina,
  narocilaTrgovina,
  odpremaTrgovina,
  skladisceTrgovina,
  terjatveTrgovina,
  zalogeTrgovina,
} from './trgovina';
import { ADDRESSABLE_SHARE } from './addressableShare';
import { RECEIVABLES_CAPITAL_COST } from './shared';
import type { ComputeContext, ModuleDefinition, ModuleOutputDraft } from './moduleTypes';
import { resolveInputs } from '../../lib/moduleEngine';

/**
 * Testi držijo iste tri lastnosti kot pri proizvodnji, logistiki in maloprodaji:
 * postavka je v natanko enem košu, compute() vrne dejanski sedanji strošek (ne
 * stroška, vnaprej pomnoženega z domnevnim deležem izboljšave), in ista ura ali
 * evro se ne pojavi v dveh področjih.
 */

const CONTEXT: ComputeContext = {
  operationalHourCostEUR: 24,
  adminHourCostEUR: 32,
  chargeOutRateEUR: 75,
  // Ta segment prihodek vpraša kot svoje polje modula (glej terjatve), iz konteksta
  // ga ne bere — zato 0. Sicer bi test meril nekaj, česar modul ne uporablja.
  annualRevenueEUR: 0,
  contributionMarginRate: 0,
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
  narocilaTrgovina,
  skladisceTrgovina,
  zalogeTrgovina,
  odpremaTrgovina,
  terjatveTrgovina,
];

describe('Naročila, ponudbe in cene', () => {
  const outputs = run(narocilaTrgovina, {
    orderEntryHoursPerMonth: 70,
    retypingHoursPerMonth: 30,
    priceFixHoursPerMonth: 20,
    annualPricingMarginLossEUR: 25_000,
    mainCause: 2, // Podatki se ročno prepisujejo med orodji → data
  });

  it('vse tri vrste ročnega dela so kapaciteta in ločene, da je vidno, kje delo nastaja', () => {
    const capacity = outputs.filter((output) => output.bucket === 'capacity');
    expect(capacity).toHaveLength(3);
  });

  it('pisarniške ure se vrednotijo po administrativni, ne skladiščni uri', () => {
    expect(pick(outputs, 'Ročni vnos naročil in ponudb').valueEUR).toBe(
      70 * CONTEXT.adminHourCostEUR * MONTHS,
    );
    expect(pick(outputs, 'Prepisovanje naročil med orodji').valueEUR).toBe(
      30 * CONTEXT.adminHourCostEUR * MONTHS,
    );
  });

  it('izgubljena marža zaradi napačnih cen je neposredna izguba', () => {
    const item = pick(outputs, 'Izgubljena marža zaradi napačnih cen');
    expect(item.bucket).toBe('directLoss');
    expect(item.valueEUR).toBe(25_000);
  });

  it('sproščene ure so surove mesečne ure, ne skrčene z deležem izboljšave', () => {
    expect(pick(outputs, 'Ročni vnos naročil in ponudb').hoursPerMonth).toBe(70);
  });

  it('vzrok v podatkih da najvišji naslovljiv delež', () => {
    expect(pick(outputs, 'Izgubljena marža zaradi napačnih cen').addressableShare).toBe(
      ADDRESSABLE_SHARE.data,
    );
  });
});

describe('Skladišče in komisioniranje', () => {
  const outputs = run(skladisceTrgovina, {
    searchingHoursPerMonth: 90,
    warehouseOvertimeHoursPerMonth: 30,
    receivingHoursPerMonth: 40,
    stockCountHoursPerYear: 240,
    mainCause: 0, // Lokacije blaga niso vodene ali niso ažurne → data
  });

  it('iskanje in nadure sta en izid — obe uri se izgubita iz istega razloga', () => {
    const item = pick(outputs, 'Iskanje blaga in nadure v skladišču');
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(120 * CONTEXT.operationalHourCostEUR * MONTHS);
    expect(item.hoursPerMonth).toBe(120);
  });

  it('skladiščne ure se vrednotijo po operativni, ne administrativni uri', () => {
    expect(pick(outputs, 'Ročno urejanje prevzemov').valueEUR).toBe(
      40 * CONTEXT.operationalHourCostEUR * MONTHS,
    );
  });

  it('inventura je LETNI podatek in se ne množi z dvanajstimi meseci', () => {
    // Edini letni vnos ur v datoteki. Množenje z MONTHS bi znesek napihnilo
    // dvanajstkrat — natanko tista napaka, ki bralcu vzame zaupanje v cel izračun.
    const item = pick(outputs, 'Inventure in preštevanja');
    expect(item.valueEUR).toBe(240 * CONTEXT.operationalHourCostEUR);
    expect(item.hoursPerMonth).toBe(20);
  });
});

describe('Zaloge, nekurantnost in izpad prodaje', () => {
  const outputs = run(zalogeTrgovina, {
    inventoryValueEUR: 900_000,
    annualWriteOffEUR: 30_000,
    annualStockoutMarginLossEUR: 45_000,
    reducibleShare: 2, // 11–20 % → 0.15
    mainCause: 1, // Stanje zalog v sistemu ni zanesljivo → data
  });

  it('odpisi in izgubljena marža sta neposredni izgubi', () => {
    expect(pick(outputs, 'Odpisi in nekurantna zaloga').bucket).toBe('directLoss');
    expect(pick(outputs, 'Odpisi in nekurantna zaloga').valueEUR).toBe(30_000);
    expect(pick(outputs, 'Izgubljena marža zaradi manjkajočega blaga').bucket).toBe('directLoss');
    expect(pick(outputs, 'Izgubljena marža zaradi manjkajočega blaga').valueEUR).toBe(45_000);
  });

  it('sprostljiv kapital nima naslovljivega deleža — ta znesek JE potencial', () => {
    const item = pick(outputs, 'Sprostljiv obratni kapital v zalogah');
    expect(item.bucket).toBe('oneTimeCapital');
    expect(item.valueEUR).toBe(900_000 * 0.15);
    expect(item.addressableShare).toBeUndefined();
  });

  it('področje ne prispeva nobene ure — ure skladišča so drugo področje', () => {
    for (const output of outputs) {
      expect(output.hoursPerMonth, output.label).toBeUndefined();
    }
  });

  it('"Ne vem" pade na najkonservativnejši delež znižanja', () => {
    const unknown = run(zalogeTrgovina, { inventoryValueEUR: 900_000, reducibleShare: 4 });
    const lowest = run(zalogeTrgovina, { inventoryValueEUR: 900_000, reducibleShare: 0 });
    expect(pick(unknown, 'Sprostljiv obratni kapital v zalogah').valueEUR).toBe(
      pick(lowest, 'Sprostljiv obratni kapital v zalogah').valueEUR,
    );
  });
});

describe('Odprema, vračila in reklamacije', () => {
  const outputs = run(odpremaTrgovina, {
    annualRedeliveryCostEUR: 22_000,
    annualCreditNoteEUR: 14_000,
    annualReturnedGoodsLossEUR: 9_000,
    claimHandlingHoursPerMonth: 35,
    mainCause: 4, // Prevozniki in zunanje dostave → external
  });

  it('trije denarni stroški so neposredne izgube', () => {
    const directLoss = outputs.filter((output) => output.bucket === 'directLoss');
    expect(directLoss).toHaveLength(3);
    expect(directLoss.reduce((sum, output) => sum + (output.valueEUR ?? 0), 0)).toBe(45_000);
  });

  it('reševanje reklamacij je kapaciteta po administrativni uri', () => {
    const item = pick(outputs, 'Reševanje reklamacij in vračil');
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(35 * CONTEXT.adminHourCostEUR * MONTHS);
  });

  it('zunanji vzrok močno zniža naslovljiv delež', () => {
    expect(pick(outputs, 'Ponovne in nujne dostave').addressableShare).toBe(
      ADDRESSABLE_SHARE.external,
    );
  });
});

describe('Plačilni roki in terjatve', () => {
  const outputs = run(terjatveTrgovina, {
    annualRevenueEUR: 8_000_000,
    overdueDaysAverage: 18,
    dunningHoursPerMonth: 25,
    annualBadDebtEUR: 12_000,
    mainCause: 0, // Opominjanje ni sistematično → planning
  });

  it('šteje se samo prekoračitev roka, ne celoten DSO', () => {
    // currentDSODays je 60 in je contextOnly. Če bi vstopil v formulo, bi bil
    // znesek več kot trikrat večji — in vsak finančnik bi izračun takoj zavrnil.
    const item = pick(outputs, 'Strošek zamud pri plačilih');
    expect(item.bucket).toBe('directLoss');
    expect(item.valueEUR).toBeCloseTo((8_000_000 / 365) * 18 * RECEIVABLES_CAPITAL_COST, 6);
  });

  it('opominjanje je kapaciteta, odpisane terjatve pa neposredna izguba', () => {
    expect(pick(outputs, 'Opominjanje in izterjava').bucket).toBe('capacity');
    expect(pick(outputs, 'Opominjanje in izterjava').valueEUR).toBe(
      25 * CONTEXT.adminHourCostEUR * MONTHS,
    );
    expect(pick(outputs, 'Odpisane terjatve').bucket).toBe('directLoss');
    expect(pick(outputs, 'Odpisane terjatve').valueEUR).toBe(12_000);
  });

  it('kupec, ki roke drži, ne dobi izmišljenega stroška zamude', () => {
    const onTime = run(terjatveTrgovina, { annualRevenueEUR: 8_000_000, overdueDaysAverage: 0 });
    expect(pick(onTime, 'Strošek zamud pri plačilih').valueEUR).toBe(0);
  });
});

describe('Kratka diagnostika', () => {
  it('vrne dve oceni tveganja brez evrov', () => {
    const outputs = run(diagnostikaTrgovina);
    expect(outputs).toHaveLength(2);
    for (const output of outputs) {
      expect(output.bucket).toBe('risk');
      expect(output.valueEUR).toBeUndefined();
    }
  });

  it('najboljši odgovori dajo nizko, najslabši visoko tveganje', () => {
    const best = run(diagnostikaTrgovina, {
      stockAccuracy: 0,
      knowsItemMargin: 0,
      shipmentTraceability: 0,
      keyPersonIndependence: 0,
    });
    const worst = run(diagnostikaTrgovina, {
      stockAccuracy: 3,
      knowsItemMargin: 3,
      shipmentTraceability: 3,
      keyPersonIndependence: 3,
    });

    expect(best.every((output) => output.riskLevel === 'low')).toBe(true);
    expect(worst.every((output) => output.riskLevel === 'high')).toBe(true);
  });

  it('ni v triaži — vprašanja se prikažejo vedno', () => {
    expect(diagnostikaTrgovina.triage).toBeUndefined();
  });
});

describe('Skupne lastnosti stroškovnih modulov', () => {
  it('vsak modul ima 5–6 polj, da vprašalnik ostane kratek', () => {
    for (const definition of COSTED_MODULES) {
      expect(definition.fields.length, definition.id).toBeGreaterThanOrEqual(5);
      expect(definition.fields.length, definition.id).toBeLessThanOrEqual(6);
    }
  });

  it('privzeti glavni vzrok je "Ne vemo" in da konservativen delež', () => {
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
        definition: narocilaTrgovina,
        base: { orderEntryHoursPerMonth: 70, orderChannel: 0 },
        twist: { orderEntryHoursPerMonth: 70, orderChannel: 3 },
      },
      {
        definition: skladisceTrgovina,
        base: { searchingHoursPerMonth: 90, pickingMethod: 0 },
        twist: { searchingHoursPerMonth: 90, pickingMethod: 3 },
      },
      {
        definition: zalogeTrgovina,
        base: { inventoryValueEUR: 900_000, annualWriteOffEUR: 30_000, stockVisibility: 0 },
        twist: { inventoryValueEUR: 900_000, annualWriteOffEUR: 30_000, stockVisibility: 3 },
      },
      {
        definition: odpremaTrgovina,
        base: { annualRedeliveryCostEUR: 22_000, shipmentsPerMonth: 0 },
        twist: { annualRedeliveryCostEUR: 22_000, shipmentsPerMonth: 4_000 },
      },
      {
        definition: terjatveTrgovina,
        base: { annualRevenueEUR: 8_000_000, overdueDaysAverage: 18, currentDSODays: 0 },
        twist: { annualRevenueEUR: 8_000_000, overdueDaysAverage: 18, currentDSODays: 90 },
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

  it('ure se ne štejejo dvakrat: skladiščne in pisarniške ure so ločeni izidi', () => {
    const warehouse = run(skladisceTrgovina, { searchingHoursPerMonth: 90 });
    const office = run(odpremaTrgovina, { claimHandlingHoursPerMonth: 35 });

    expect(pick(warehouse, 'Iskanje blaga in nadure v skladišču').hoursPerMonth).toBe(90);
    expect(pick(office, 'Reševanje reklamacij in vračil').hoursPerMonth).toBe(35);
  });

  it('vsako področje meri svoj korak poti blaga — nobeno ne podvaja sosednjega', () => {
    // Meja je časovna: naročilo -> skladišče -> zaloga -> odprema -> plačilo.
    // Če bi kdo dodal polje v napačno področje, bi tu padlo število postavk.
    expect(run(narocilaTrgovina).filter((o) => o.bucket === 'directLoss')).toHaveLength(1);
    expect(run(skladisceTrgovina).every((o) => o.bucket === 'capacity')).toBe(true);
    expect(run(zalogeTrgovina).some((o) => o.bucket === 'capacity')).toBe(false);
    expect(run(odpremaTrgovina).filter((o) => o.bucket === 'directLoss')).toHaveLength(3);
    expect(run(terjatveTrgovina).filter((o) => o.bucket === 'directLoss')).toHaveLength(2);
  });
});
