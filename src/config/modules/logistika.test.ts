import { describe, it, expect } from 'vitest';
import {
  diagnostikaLogistika,
  dokumentacija,
  napake,
  odprema,
  roki,
  skladisce,
} from './logistika';
import { ADDRESSABLE_SHARE } from './addressableShare';
import type { ComputeContext, ModuleDefinition, ModuleOutputDraft } from './moduleTypes';
import { resolveInputs } from '../../lib/moduleEngine';

/**
 * Testi držijo iste tri lastnosti kot pri proizvodnji: postavka je v natanko enem
 * košu, compute() vrne dejanski sedanji strošek (ne stroška, vnaprej pomnoženega
 * z domnevnim deležem izboljšave), in ista ura se ne pojavi v dveh področjih.
 */

const CONTEXT: ComputeContext = {
  operationalHourCostEUR: 19,
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

const COSTED_MODULES = [odprema, napake, skladisce, dokumentacija, roki];

describe('Planiranje prevozov in izkoriščenost', () => {
  const outputs = run(odprema, {
    emptyKmPerMonth: 4_000,
    costPerKmEUR: 0.8,
    waitingHoursPerMonth: 120,
    dispatchHoursPerMonth: 40,
    mainCause: 0, // Razpored ni ažuren → planning
  });

  it('prazni kilometri so neposredna izguba — gorivo je že porabljeno', () => {
    const item = pick(outputs, 'Prazni in slabo izkoriščeni kilometri');
    expect(item.bucket).toBe('directLoss');
    expect(item.valueEUR).toBe(4_000 * 0.8 * MONTHS);
  });

  it('čakanje voznikov je kapaciteta in se vrednoti po operativni uri', () => {
    const item = pick(outputs, 'Čakanje vozil in voznikov');
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(120 * CONTEXT.operationalHourCostEUR * MONTHS);
    expect(item.hoursPerMonth).toBe(120);
  });

  it('razporejanje se vrednoti po administrativni, ne operativni uri', () => {
    expect(pick(outputs, 'Razporejanje in usklajevanje voženj').valueEUR).toBe(
      40 * CONTEXT.adminHourCostEUR * MONTHS,
    );
  });

  it('glavni vzrok določi naslovljiv delež', () => {
    expect(pick(outputs, 'Prazni in slabo izkoriščeni kilometri').addressableShare).toBe(
      ADDRESSABLE_SHARE.planning,
    );
  });

  it('špediter brez voznega parka ne dobi izmišljenih kilometrov', () => {
    // Privzeti strošek kilometra ni 0 (drsnik), zato bi brez tega testa 0 vnesenih
    // kilometrov lahko tiho postalo neničeln znesek.
    const noFleet = run(odprema, { emptyKmPerMonth: 0, dispatchHoursPerMonth: 40 });
    expect(pick(noFleet, 'Prazni in slabo izkoriščeni kilometri').valueEUR).toBe(0);
  });
});

describe('Napačne dostave, poškodbe in reklamacije', () => {
  const outputs = run(napake, {
    shipmentsPerMonth: 2_000,
    errorSharePercent: 0.02,
    costPerErrorEUR: 45,
    annualDamageCostEUR: 18_000,
    claimHoursPerMonth: 30,
    mainCause: 0, // Podatki o pošiljki so nepopolni → data
  });

  it('napačne dostave in poškodovano blago sta neposredni izgubi', () => {
    expect(pick(outputs, 'Napačne in nepopolne dostave').bucket).toBe('directLoss');
    expect(pick(outputs, 'Napačne in nepopolne dostave').valueEUR).toBe(2_000 * 0.02 * 45 * MONTHS);
    expect(pick(outputs, 'Poškodovano in izgubljeno blago').bucket).toBe('directLoss');
    expect(pick(outputs, 'Poškodovano in izgubljeno blago').valueEUR).toBe(18_000);
  });

  it('ure reklamacij so kapaciteta — plačna masa se z njimi ne zniža', () => {
    const item = pick(outputs, 'Reševanje reklamacij in iskanje pošiljk');
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(30 * CONTEXT.adminHourCostEUR * MONTHS);
  });

  it('vzrok v podatkih da najvišji naslovljiv delež', () => {
    expect(pick(outputs, 'Napačne in nepopolne dostave').addressableShare).toBe(ADDRESSABLE_SHARE.data);
  });
});

describe('Skladiščne operacije in zaloga', () => {
  const outputs = run(skladisce, {
    searchHoursPerMonth: 80,
    inventoryValueEUR: 600_000,
    annualWriteOffEUR: 22_000,
    reducibleShare: 2, // 11–20 % → 0.15
    mainCause: 0, // Lokacije niso ažurne → data
  });

  it('odpisi so neposredna izguba, iskanje blaga pa kapaciteta', () => {
    expect(pick(outputs, 'Popisne razlike in odpisi').bucket).toBe('directLoss');
    expect(pick(outputs, 'Popisne razlike in odpisi').valueEUR).toBe(22_000);
    expect(pick(outputs, 'Iskanje in prekladanje blaga').bucket).toBe('capacity');
    expect(pick(outputs, 'Iskanje in prekladanje blaga').valueEUR).toBe(
      80 * CONTEXT.operationalHourCostEUR * MONTHS,
    );
  });

  it('sprostljiv kapital je enkraten in nima naslovljivega deleža', () => {
    const item = pick(outputs, 'Sprostljiv obratni kapital v zalogi');
    expect(item.bucket).toBe('oneTimeCapital');
    expect(item.valueEUR).toBe(600_000 * 0.15);
    expect(item.addressableShare).toBeUndefined();
  });

  it('"Ne vem" pade na najkonservativnejši delež znižanja', () => {
    const unknown = run(skladisce, { inventoryValueEUR: 600_000, reducibleShare: 4 });
    const lowest = run(skladisce, { inventoryValueEUR: 600_000, reducibleShare: 0 });
    expect(pick(unknown, 'Sprostljiv obratni kapital v zalogi').valueEUR).toBe(
      pick(lowest, 'Sprostljiv obratni kapital v zalogi').valueEUR,
    );
  });

  it('skladiščnik tujega blaga ne dobi sproščenega kapitala', () => {
    const foreignGoods = run(skladisce, { inventoryValueEUR: 0, searchHoursPerMonth: 80 });
    expect(pick(foreignGoods, 'Sprostljiv obratni kapital v zalogi').valueEUR).toBe(0);
    expect(pick(foreignGoods, 'Iskanje in prekladanje blaga').valueEUR).toBeGreaterThan(0);
  });
});

describe('Prevozna dokumentacija in podatki', () => {
  const outputs = run(dokumentacija, {
    documentHoursPerMonth: 35,
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

describe('Zamude, stojnine in nujni prevozi', () => {
  const outputs = run(roki, {
    expediteCostEUR: 20_000,
    penaltyCostEUR: 9_000,
    lostMarginEUR: 14_000,
    customerCommsHoursPerMonth: 25,
    mainCause: 3, // Stranke, podizvajalci ali carina → external
  });

  it('denarni stroški so neposredne izgube', () => {
    const directLoss = outputs.filter((output) => output.bucket === 'directLoss');
    expect(directLoss).toHaveLength(3);
    expect(directLoss.reduce((sum, output) => sum + (output.valueEUR ?? 0), 0)).toBe(43_000);
  });

  it('obveščanje strank je kapaciteta', () => {
    const item = pick(outputs, 'Obveščanje in usklajevanje s strankami');
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(25 * CONTEXT.adminHourCostEUR * MONTHS);
  });

  it('zunanji vzrok močno zniža naslovljiv delež', () => {
    expect(pick(outputs, 'Nujni podnajemi in ekspresni prevozi').addressableShare).toBe(
      ADDRESSABLE_SHARE.external,
    );
  });
});

describe('Kratka diagnostika', () => {
  it('vrne dve oceni tveganja brez evrov', () => {
    const outputs = run(diagnostikaLogistika);
    expect(outputs).toHaveLength(2);
    for (const output of outputs) {
      expect(output.bucket).toBe('risk');
      expect(output.valueEUR).toBeUndefined();
    }
  });

  it('najboljši odgovori dajo nizko, najslabši visoko tveganje', () => {
    const best = run(diagnostikaLogistika, {
      realtimeRecording: 0,
      knowsTripCost: 0,
      shipmentTraceability: 0,
      keyPersonIndependence: 0,
    });
    const worst = run(diagnostikaLogistika, {
      realtimeRecording: 3,
      knowsTripCost: 3,
      shipmentTraceability: 3,
      keyPersonIndependence: 3,
    });

    expect(best.every((output) => output.riskLevel === 'low')).toBe(true);
    expect(worst.every((output) => output.riskLevel === 'high')).toBe(true);
  });

  it('ni v triaži — vprašanja se prikažejo vedno', () => {
    expect(diagnostikaLogistika.triage).toBeUndefined();
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
        definition: odprema,
        base: { waitingHoursPerMonth: 120, dispatchHoursPerMonth: 40, dispatchMethod: 0 },
        twist: { waitingHoursPerMonth: 120, dispatchHoursPerMonth: 40, dispatchMethod: 3 },
      },
      {
        definition: skladisce,
        base: { inventoryValueEUR: 400_000, annualWriteOffEUR: 8_000, stockVisibility: 0 },
        twist: { inventoryValueEUR: 400_000, annualWriteOffEUR: 8_000, stockVisibility: 3 },
      },
      {
        definition: dokumentacija,
        base: { documentHoursPerMonth: 35, podTiming: 0 },
        twist: { documentHoursPerMonth: 35, podTiming: 3 },
      },
      {
        definition: roki,
        base: { expediteCostEUR: 20_000, lateDeliveriesPerMonth: 0 },
        twist: { expediteCostEUR: 20_000, lateDeliveriesPerMonth: 120 },
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

  it('ure se ne štejejo dvakrat: čakanje na rampi in iskanje v skladišču sta ločena izida', () => {
    const dispatchOutputs = run(odprema, { waitingHoursPerMonth: 120 });
    const warehouseOutputs = run(skladisce, { searchHoursPerMonth: 80 });

    expect(pick(dispatchOutputs, 'Čakanje vozil in voznikov').hoursPerMonth).toBe(120);
    expect(pick(warehouseOutputs, 'Iskanje in prekladanje blaga').hoursPerMonth).toBe(80);
  });
});
