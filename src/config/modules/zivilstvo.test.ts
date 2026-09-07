import { describe, it, expect } from 'vitest';
import {
  diagnostika_zivilstvo,
  donos_zivilstvo,
  kakovost_zivilstvo,
  narocila_zivilstvo,
  roki_zivilstvo,
  sledljivost_zivilstvo,
  ZIVILSTVO_MODULES,
} from './zivilstvo';
import { ADDRESSABLE_SHARE } from './addressableShare';
import type { ComputeContext, ModuleDefinition, ModuleOutputDraft } from './moduleTypes';
import { resolveInputs } from '../../lib/moduleEngine';
import { reducibleShareOf } from './shared';
import { SEGMENTS } from '../segments';

/**
 * Testi držijo iste lastnosti kot pri proizvodnji: postavka je v natanko enem
 * košu, compute() vrne dejanski sedanji strošek, ista ura ali evro ni v dveh
 * področjih. Lastnost, značilna za to dejavnost: dve postavki imata mejo
 * naslovljivosti (kalo — biološko dno, odpoklic — sledljivost ga omeji, ne
 * prepreči), HACCP ure pa regulatorno.
 */

// Postavki sta namenoma taki, da ena ni večkratnik druge: zamenjava proizvodne
// (22) in administrativne (25) ure se v izidu takoj pozna.
const CONTEXT: ComputeContext = {
  operationalHourCostEUR: 22,
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
  donos_zivilstvo,
  roki_zivilstvo,
  sledljivost_zivilstvo,
  kakovost_zivilstvo,
  narocila_zivilstvo,
];

describe('Donos, kalo in recepture', () => {
  const outputs = run(donos_zivilstvo, {
    annualRawMaterialSpendEUR: 1_400_000,
    yieldLossPercent: 0.04,
    batchRecordingHoursPerMonth: 32,
    reworkHoursPerMonth: 10,
    mainCause: 0, // Recepture niso ažurne → data
  });

  it('kalo je neposredna izguba: vrednost surovin × delež odstopanja', () => {
    const item = pick(outputs, 'Odstopanje donosa in kalo nad recepturo');
    expect(item.bucket).toBe('directLoss');
    expect(item.valueEUR).toBe(56_000);
  });

  it('kalo ima biološko dno — meja naslovljivosti, ne glede na vzrok', () => {
    expect(pick(outputs, 'Odstopanje donosa in kalo nad recepturo').addressableCap).toBe(0.6);
    expect(pick(outputs, 'Odstopanje donosa in kalo nad recepturo').addressableShare).toBe(
      ADDRESSABLE_SHARE.data,
    );
  });

  it('beleženje šarž in ponovna predelava sta kapaciteta po proizvodni uri', () => {
    const recording = pick(outputs, 'Ročno beleženje in prepis porabe šarž');
    expect(recording.bucket).toBe('capacity');
    expect(recording.valueEUR).toBe(32 * CONTEXT.operationalHourCostEUR * MONTHS);
    expect(recording.hoursPerMonth).toBe(32);
    expect(pick(outputs, 'Ponovna predelava in prepakiranje šarž').valueEUR).toBe(
      10 * CONTEXT.operationalHourCostEUR * MONTHS,
    );
  });

  it('delež odstopanja brez vrednosti surovin ne ustvari zneska in obratno', () => {
    // Zmnožek dveh polj: samo delež trdi, da težava obstaja, zato mora priti od
    // obiskovalca — privzetek 0 varuje tudi defaults.test.ts.
    expect(pick(run(donos_zivilstvo, { yieldLossPercent: 0.05 }), 'Odstopanje donosa in kalo nad recepturo').valueEUR).toBe(0);
    expect(
      pick(run(donos_zivilstvo, { annualRawMaterialSpendEUR: 900_000 }), 'Odstopanje donosa in kalo nad recepturo')
        .valueEUR,
    ).toBe(0);
  });
});

describe('Roki uporabnosti, zaloge in odpisi', () => {
  const outputs = run(roki_zivilstvo, {
    inventoryValueEUR: 440_000,
    annualExpiryWriteOffEUR: 13_400,
    annualStockDifferenceEUR: 5_300,
    reducibleShare: 2, // 11–20 % → 0.15
    mainCause: 0, // Kratki roki niso vidni → data
  });

  it('odpisi in inventurne razlike sta ločeni neposredni izgubi', () => {
    const expiry = pick(outputs, 'Odpisi zaradi poteka roka uporabnosti');
    const difference = pick(outputs, 'Inventurne razlike v skladiščih in hladilnicah');
    expect(expiry.bucket).toBe('directLoss');
    expect(expiry.valueEUR).toBe(13_400);
    expect(difference.bucket).toBe('directLoss');
    expect(difference.valueEUR).toBe(5_300);
  });

  it('sprostljiv kapital je enkraten in nima naslovljivega deleža — ta znesek JE potencial', () => {
    const item = pick(outputs, 'Sprostljiv obratni kapital v zalogah');
    expect(item.bucket).toBe('oneTimeCapital');
    expect(item.valueEUR).toBe(440_000 * 0.15);
    expect(item.addressableShare).toBeUndefined();
  });

  it('"Ne vem" pri deležu zaloge pade na izmerjeno spodnjo mejo, ne na najnižji pas', () => {
    const valueOf = (share: number) =>
      pick(run(roki_zivilstvo, { inventoryValueEUR: 440_000, reducibleShare: share }), 'Sprostljiv obratni kapital v zalogah').valueEUR ?? 0;
    expect(valueOf(4)).toBe(440_000 * reducibleShareOf(4));
    expect(valueOf(4)).toBeGreaterThan(valueOf(0));
  });

  it('nobena postavka ne uporabi urne postavke — področje meri denar, ne ure', () => {
    const cheap = run(roki_zivilstvo, { annualExpiryWriteOffEUR: 9_000 });
    const rich = roki_zivilstvo.compute(
      resolveInputs(roki_zivilstvo, { annualExpiryWriteOffEUR: 9_000 }),
      { ...CONTEXT, operationalHourCostEUR: 1_000, adminHourCostEUR: 1_000 },
    );
    expect(rich).toEqual(cheap);
  });
});

describe('Sledljivost šarž, reklamacije in odpoklic', () => {
  const outputs = run(sledljivost_zivilstvo, {
    traceHoursPerMonth: 18,
    claimHoursPerMonth: 16,
    annualClaimCostEUR: 10_500,
    annualRecallCostEUR: 30_000,
    mainCause: 1, // Šarža ni na dobavnici → data
  });

  it('sestavljanje sledljivosti in reševanje reklamacij sta kapaciteta po administrativni uri', () => {
    const trace = pick(outputs, 'Ročno sestavljanje sledljivosti');
    expect(trace.bucket).toBe('capacity');
    expect(trace.valueEUR).toBe(18 * CONTEXT.adminHourCostEUR * MONTHS);
    expect(pick(outputs, 'Reševanje reklamacij in iskanje vzroka').valueEUR).toBe(
      16 * CONTEXT.adminHourCostEUR * MONTHS,
    );
  });

  it('dobropisi in odpoklic sta neposredni izgubi', () => {
    expect(pick(outputs, 'Dobropisi, vračila in uničenje ob reklamacijah').bucket).toBe('directLoss');
    expect(pick(outputs, 'Dobropisi, vračila in uničenje ob reklamacijah').valueEUR).toBe(10_500);
    expect(pick(outputs, 'Stroški odpoklicev in umikov s trga').bucket).toBe('directLoss');
    expect(pick(outputs, 'Stroški odpoklicev in umikov s trga').valueEUR).toBe(30_000);
  });

  it('odpoklic ima mejo naslovljivosti — sledljivost ga omeji, ne prepreči; dobropisi je nimajo', () => {
    expect(pick(outputs, 'Stroški odpoklicev in umikov s trga').addressableCap).toBe(0.5);
    expect(pick(outputs, 'Dobropisi, vračila in uničenje ob reklamacijah').addressableCap).toBeUndefined();
  });

  it('vzrok pri dobaviteljih močno zniža naslovljiv delež', () => {
    const external = run(sledljivost_zivilstvo, { annualClaimCostEUR: 5_000, mainCause: 4 });
    expect(pick(external, 'Dobropisi, vračila in uničenje ob reklamacijah').addressableShare).toBe(
      ADDRESSABLE_SHARE.external,
    );
  });
});

describe('HACCP evidence, deklaracije in presoje', () => {
  const outputs = run(kakovost_zivilstvo, {
    haccpHoursPerMonth: 30,
    auditPrepHoursPerYear: 240,
    labelingHoursPerMonth: 6,
    annualLabelErrorCostEUR: 4_500,
    mainCause: 0, // Evidence na papirju → data
  });

  it('HACCP zapis gre po proizvodni uri, presoje in deklaracije po administrativni', () => {
    // Edino področje te dejavnosti z dvema urnima postavkama: zapis na kontrolni
    // točki opravi operater, dokazila zbira tehnolog. Zamenjava se takoj pozna.
    expect(pick(outputs, 'Ročne HACCP in temperaturne evidence').valueEUR).toBe(
      30 * CONTEXT.operationalHourCostEUR * MONTHS,
    );
    expect(pick(outputs, 'Posodabljanje deklaracij in alergenov').valueEUR).toBe(
      6 * CONTEXT.adminHourCostEUR * MONTHS,
    );
  });

  it('priprava na presoje je letna vrednost — ure se ne množijo z 12, mesečne ure so dvanajstina', () => {
    const item = pick(outputs, 'Priprava na presoje in inšpekcije');
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(240 * CONTEXT.adminHourCostEUR);
    expect(item.hoursPerMonth).toBe(20);
  });

  it('HACCP ure imajo regulatorno mejo naslovljivosti, druge ure je nimajo', () => {
    expect(pick(outputs, 'Ročne HACCP in temperaturne evidence').addressableCap).toBe(0.5);
    expect(pick(outputs, 'Priprava na presoje in inšpekcije').addressableCap).toBeUndefined();
  });

  it('napačne etikete so neposredna izguba', () => {
    const item = pick(outputs, 'Napačne deklaracije in etikete');
    expect(item.bucket).toBe('directLoss');
    expect(item.valueEUR).toBe(4_500);
  });
});

describe('Naročila kupcev, planiranje in nujne dobave', () => {
  const outputs = run(narocila_zivilstvo, {
    orderEntryHoursPerMonth: 56,
    planningHoursPerMonth: 63,
    expediteCostEUR: 6_000,
    chainPenaltyEUR: 8_000,
    mainCause: 3, // Kupci spreminjajo naročila → external
  });

  it('vnos naročil in planiranje sta kapaciteta po administrativni uri', () => {
    expect(pick(outputs, 'Ročni vnos naročil kupcev').valueEUR).toBe(56 * CONTEXT.adminHourCostEUR * MONTHS);
    expect(pick(outputs, 'Planiranje proizvodnje in naročanje surovin').bucket).toBe('capacity');
    expect(pick(outputs, 'Planiranje proizvodnje in naročanje surovin').hoursPerMonth).toBe(63);
  });

  it('ekspresne nabave in penali trgovcev sta neposredni izgubi', () => {
    const directLoss = outputs.filter((output) => output.bucket === 'directLoss');
    expect(directLoss).toHaveLength(2);
    expect(directLoss.reduce((sum, output) => sum + (output.valueEUR ?? 0), 0)).toBe(14_000);
  });

  it('zunanji vzrok močno zniža naslovljiv delež', () => {
    expect(pick(outputs, 'Penali in odbitki trgovcev zaradi nedobave').addressableShare).toBe(
      ADDRESSABLE_SHARE.external,
    );
  });
});

describe('Kratka diagnostika', () => {
  it('vrne dve oceni tveganja brez evrov', () => {
    const outputs = run(diagnostika_zivilstvo);
    expect(outputs).toHaveLength(2);
    for (const output of outputs) {
      expect(output.bucket).toBe('risk');
      expect(output.valueEUR).toBeUndefined();
    }
  });

  it('najboljši odgovori dajo nizko, najslabši visoko tveganje', () => {
    const best = run(diagnostika_zivilstvo, {
      realtimeBatchRecording: 0,
      knowsProductCost: 0,
      batchTraceability: 0,
      keyPersonIndependence: 0,
    });
    const worst = run(diagnostika_zivilstvo, {
      realtimeBatchRecording: 3,
      knowsProductCost: 3,
      batchTraceability: 3,
      keyPersonIndependence: 3,
    });
    expect(best.every((output) => output.riskLevel === 'low')).toBe(true);
    expect(worst.every((output) => output.riskLevel === 'high')).toBe(true);
  });

  it('ni v triaži — vprašanja se prikažejo vedno', () => {
    expect(diagnostika_zivilstvo.triage).toBeUndefined();
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
        definition: donos_zivilstvo,
        base: { annualRawMaterialSpendEUR: 500_000, yieldLossPercent: 0.03, recipeControl: 0 },
        twist: { annualRawMaterialSpendEUR: 500_000, yieldLossPercent: 0.03, recipeControl: 3 },
      },
      {
        definition: roki_zivilstvo,
        base: { annualExpiryWriteOffEUR: 9_000, fefoPractice: 0 },
        twist: { annualExpiryWriteOffEUR: 9_000, fefoPractice: 3 },
      },
      {
        definition: sledljivost_zivilstvo,
        base: { traceHoursPerMonth: 10, recallDrill: 0 },
        twist: { traceHoursPerMonth: 10, recallDrill: 3 },
      },
      {
        definition: kakovost_zivilstvo,
        base: { haccpHoursPerMonth: 20, recordsMethod: 0 },
        twist: { haccpHoursPerMonth: 20, recordsMethod: 3 },
      },
      {
        definition: narocila_zivilstvo,
        base: { orderEntryHoursPerMonth: 30, orderChannel: 0 },
        twist: { orderEntryHoursPerMonth: 30, orderChannel: 3 },
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

  it('nobeno področje ne uporabi zaračunane postavke, prihodka ali marže', () => {
    // Izguba se v tej dejavnosti meri kot delež porabljenih surovin, ne prometa;
    // kontekst zato marže ne vpraša (contexts/zivilstvo.ts). Če bi jo kak modul
    // začel uporabljati, mora vprašanje priti zraven — ta test to zahtevo drži.
    const input = {
      annualRawMaterialSpendEUR: 1_000_000,
      yieldLossPercent: 0.03,
      annualExpiryWriteOffEUR: 5_000,
      traceHoursPerMonth: 10,
      haccpHoursPerMonth: 20,
      orderEntryHoursPerMonth: 30,
    };
    const rich = { ...CONTEXT, chargeOutRateEUR: 1_000, annualRevenueEUR: 50_000_000, contributionMarginRate: 0.9 };
    for (const definition of COSTED_MODULES) {
      const resolved = resolveInputs(definition, input);
      expect(definition.compute(resolved, rich), definition.id).toEqual(definition.compute(resolved, CONTEXT));
    }
  });

  it('register segmenta našteje natanko te module, panožne pred horizontalami', () => {
    const ids = SEGMENTS.zivilstvo.moduleIds;
    const industryIds = ZIVILSTVO_MODULES.map((definition) => definition.id);
    for (const id of industryIds) {
      expect(ids, id).toContain(id);
    }
    // Panožna stroškovna področja stojijo pred prvo horizontalo, diagnostika za njo.
    const firstHorizontal = ids.indexOf('analitikaHz');
    for (const definition of COSTED_MODULES) {
      expect(ids.indexOf(definition.id), definition.id).toBeLessThan(firstHorizontal);
    }
    expect(ids.indexOf('diagnostika_zivilstvo')).toBeGreaterThan(firstHorizontal);
    // servisHz meri servis po predaji; reklamacije in odpoklic meri panožni modul.
    expect(ids).not.toContain('servisHz');
  });
});
