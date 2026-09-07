import { describe, it, expect } from 'vitest';
import {
  diagnostika_kovinarstvo,
  kooperacija_kovinarstvo,
  material_kovinarstvo,
  nalog_kovinarstvo,
  plan_kovinarstvo,
  sledljivost_kovinarstvo,
  zaloge_kovinarstvo,
  KOVINARSTVO_MODULES,
} from './kovinarstvo';
import { ADDRESSABLE_SHARE } from './addressableShare';
import type { ComputeContext, ModuleDefinition, ModuleOutputDraft } from './moduleTypes';
import { resolveInputs } from '../../lib/moduleEngine';
import { reducibleShareOf } from './shared';
import { SEGMENTS } from '../segments';

/**
 * Testi držijo iste lastnosti kot pri proizvodnji in živilstvu: postavka je v
 * natanko enem košu, compute() vrne dejanski sedanji strošek, ista ura ali evro ni
 * v dveh področjih. Lastnosti, značilni za to dejavnost: prodaja pod lastno ceno
 * je nezaslužena marža (lostMargin) in ne odtekel denar, presežna poraba materiala
 * pa ima mejo naslovljivosti (tehnološko dno razreza).
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
  nalog_kovinarstvo,
  material_kovinarstvo,
  zaloge_kovinarstvo,
  sledljivost_kovinarstvo,
  kooperacija_kovinarstvo,
  plan_kovinarstvo,
];

describe('Delovni nalog in dejanski strošek', () => {
  const outputs = run(nalog_kovinarstvo, {
    workOrdersPerMonth: 250,
    manualReportingHoursPerMonth: 58,
    priceBelowCostEUR: 12_000,
    mainCause: 0, // Podatki se vnašajo naknadno → data
  });

  it('ročno evidentiranje je kapaciteta po administrativni uri', () => {
    const item = pick(outputs, 'Ročno evidentiranje proizvodnje');
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(58 * CONTEXT.adminHourCostEUR * MONTHS);
    expect(item.hoursPerMonth).toBe(58);
  });

  it('prodaja pod lastno ceno je nezaslužena marža, ne neposredna izguba', () => {
    // Cena pod kalkulacijo stoji na predpostavki, da bi kupec pravo ceno plačal —
    // to je "prodaja po napačni ceni" iz definicije koša lostMargin, ne odtekel
    // denar, ki bi ga bilo mogoče pokazati na kontu.
    const item = pick(outputs, 'Prodaja pod lastno ceno');
    expect(item.bucket).toBe('lostMargin');
    expect(item.valueEUR).toBe(12_000);
    expect(item.addressableCap).toBeUndefined();
  });

  it('glavni vzrok v podatkih da najvišji naslovljiv delež', () => {
    expect(pick(outputs, 'Ročno evidentiranje proizvodnje').addressableShare).toBe(ADDRESSABLE_SHARE.data);
  });

  it('število nalogov je kontekst in ne premakne nobene številke', () => {
    expect(run(nalog_kovinarstvo, { manualReportingHoursPerMonth: 10, workOrdersPerMonth: 900 })).toEqual(
      run(nalog_kovinarstvo, { manualReportingHoursPerMonth: 10 }),
    );
  });
});

describe('Poraba materiala, izmet in ponovna izdelava', () => {
  const outputs = run(material_kovinarstvo, {
    annualMaterialSpendEUR: 3_500_000,
    materialDeviationPercent: 0.04,
    reworkHoursPerMonth: 48,
    mainCause: 0, // Normativi niso osveženi → data
  });

  it('presežna poraba je neposredna izguba: vrednost materiala × delež odstopanja', () => {
    const item = pick(outputs, 'Presežna poraba materiala nad normativom');
    expect(item.bucket).toBe('directLoss');
    expect(item.valueEUR).toBe(140_000);
  });

  it('presežna poraba ima tehnološko dno — meja naslovljivosti, ne glede na vzrok', () => {
    expect(pick(outputs, 'Presežna poraba materiala nad normativom').addressableCap).toBe(0.5);
    expect(pick(outputs, 'Presežna poraba materiala nad normativom').addressableShare).toBe(
      ADDRESSABLE_SHARE.data,
    );
  });

  it('ponovna izdelava je kapaciteta po proizvodni uri in brez meje', () => {
    const item = pick(outputs, 'Ponovna izdelava, dodelave in sortiranje');
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(48 * CONTEXT.operationalHourCostEUR * MONTHS);
    expect(item.hoursPerMonth).toBe(48);
    expect(item.addressableCap).toBeUndefined();
  });

  it('delež odstopanja brez vrednosti materiala ne ustvari zneska in obratno', () => {
    // Zmnožek dveh polj: samo delež trdi, da težava obstaja, zato mora priti od
    // obiskovalca — privzetek 0 varuje tudi defaults.test.ts.
    expect(
      pick(run(material_kovinarstvo, { materialDeviationPercent: 0.05 }), 'Presežna poraba materiala nad normativom')
        .valueEUR,
    ).toBe(0);
    expect(
      pick(run(material_kovinarstvo, { annualMaterialSpendEUR: 900_000 }), 'Presežna poraba materiala nad normativom')
        .valueEUR,
    ).toBe(0);
  });
});

describe('Zaloge materiala in zastoji', () => {
  const outputs = run(zaloge_kovinarstvo, {
    inventoryValueEUR: 1_200_000,
    annualWriteOffEUR: 9_600,
    materialStoppageHoursPerMonth: 18,
    expediteCostEUR: 3_000,
    reducibleShare: 2, // 11–20 % → 0.15
    mainCause: 0, // Stanje zalog ni zanesljivo → data
  });

  it('inventurne razlike in nujne nabave sta ločeni neposredni izgubi', () => {
    expect(pick(outputs, 'Inventurne razlike in odpisi').bucket).toBe('directLoss');
    expect(pick(outputs, 'Inventurne razlike in odpisi').valueEUR).toBe(9_600);
    expect(pick(outputs, 'Nujne nabave in ekspresne dostave').bucket).toBe('directLoss');
    expect(pick(outputs, 'Nujne nabave in ekspresne dostave').valueEUR).toBe(3_000);
  });

  it('zastoji zaradi materiala so kapaciteta po proizvodni uri', () => {
    const item = pick(outputs, 'Zastoji zaradi manjkajočega materiala');
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(18 * CONTEXT.operationalHourCostEUR * MONTHS);
    expect(item.hoursPerMonth).toBe(18);
  });

  it('sprostljiv kapital je enkraten in nima naslovljivega deleža — ta znesek JE potencial', () => {
    const item = pick(outputs, 'Sprostljiv obratni kapital v zalogah');
    expect(item.bucket).toBe('oneTimeCapital');
    expect(item.valueEUR).toBe(1_200_000 * 0.15);
    expect(item.addressableShare).toBeUndefined();
  });

  it('"Ne vem" pri deležu zaloge pade na izmerjeno spodnjo mejo, ne na najnižji pas', () => {
    const valueOf = (share: number) =>
      pick(run(zaloge_kovinarstvo, { inventoryValueEUR: 1_200_000, reducibleShare: share }), 'Sprostljiv obratni kapital v zalogah').valueEUR ?? 0;
    expect(valueOf(4)).toBe(1_200_000 * reducibleShareOf(4));
    expect(valueOf(4)).toBeGreaterThan(valueOf(0));
    expect(valueOf(4)).toBeLessThan(valueOf(2));
  });
});

describe('Sledljivost šarž, certifikati in reklamacije', () => {
  const outputs = run(sledljivost_kovinarstvo, {
    docSearchHoursPerMonth: 30,
    claimHandlingHoursPerMonth: 30,
    annualClaimsCostEUR: 10_800,
    mainCause: 3, // Zahteve kupcev so se povečale → external
  });

  it('iskanje dokumentacije in obravnava reklamacij sta kapaciteta po administrativni uri', () => {
    const docs = pick(outputs, 'Iskanje certifikatov in priprava dokumentacije');
    expect(docs.bucket).toBe('capacity');
    expect(docs.valueEUR).toBe(30 * CONTEXT.adminHourCostEUR * MONTHS);
    expect(docs.hoursPerMonth).toBe(30);
    expect(pick(outputs, 'Obravnava reklamacij in iskanje šarž').valueEUR).toBe(
      30 * CONTEXT.adminHourCostEUR * MONTHS,
    );
  });

  it('neposredni stroški reklamacij so neposredna izguba', () => {
    const item = pick(outputs, 'Neposredni stroški reklamacij');
    expect(item.bucket).toBe('directLoss');
    expect(item.valueEUR).toBe(10_800);
  });

  it('zunanji vzrok močno zniža naslovljiv delež', () => {
    expect(pick(outputs, 'Neposredni stroški reklamacij').addressableShare).toBe(ADDRESSABLE_SHARE.external);
  });

  it('čas do šarže je kontekst in ne premakne nobene številke', () => {
    expect(run(sledljivost_kovinarstvo, { docSearchHoursPerMonth: 10, batchTraceTime: 3 })).toEqual(
      run(sledljivost_kovinarstvo, { docSearchHoursPerMonth: 10, batchTraceTime: 0 }),
    );
  });
});

describe('Kooperacija in zunanje operacije', () => {
  const outputs = run(kooperacija_kovinarstvo, {
    cooperationAdminHoursPerMonth: 30,
    cooperationWaitingHoursPerMonth: 16,
    cooperationLossEUR: 2_400,
    mainCause: 1, // Material izgine iz evidence → data
  });

  it('administracija gre po administrativni, čakanje po proizvodni uri', () => {
    // Edino področje te dejavnosti z obema urnima postavkama: oddajo pripravi
    // pisarna, na vračilo čaka stroj. Zamenjava se takoj pozna.
    expect(pick(outputs, 'Administracija kooperacije').valueEUR).toBe(30 * CONTEXT.adminHourCostEUR * MONTHS);
    expect(pick(outputs, 'Čakanje na vračilo iz kooperacije').valueEUR).toBe(
      16 * CONTEXT.operationalHourCostEUR * MONTHS,
    );
    expect(pick(outputs, 'Čakanje na vračilo iz kooperacije').hoursPerMonth).toBe(16);
  });

  it('izgube pri kooperaciji so neposredna izguba', () => {
    const item = pick(outputs, 'Izgube pri kooperaciji');
    expect(item.bucket).toBe('directLoss');
    expect(item.valueEUR).toBe(2_400);
    expect(item.addressableShare).toBe(ADDRESSABLE_SHARE.data);
  });

  it('delež kooperacije je kontekst in ne premakne nobene številke', () => {
    expect(run(kooperacija_kovinarstvo, { cooperationLossEUR: 500, cooperationShare: 3 })).toEqual(
      run(kooperacija_kovinarstvo, { cooperationLossEUR: 500, cooperationShare: 0 }),
    );
  });
});

describe('Plan, kapacitete in roki', () => {
  const outputs = run(plan_kovinarstvo, {
    planWaitingHoursPerMonth: 35,
    overtimeHoursPerMonth: 20,
    penaltyCostEUR: 4_200,
    mainCause: 4, // Okvare strojev → physical
  });

  it('čakanje in nadure sta ena kapacitetna postavka po proizvodni uri', () => {
    const item = pick(outputs, 'Čakanje in nadure v proizvodnji');
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(55 * CONTEXT.operationalHourCostEUR * MONTHS);
    expect(item.hoursPerMonth).toBe(55);
  });

  it('penali so neposredna izguba', () => {
    const item = pick(outputs, 'Penali in popusti zaradi zamud');
    expect(item.bucket).toBe('directLoss');
    expect(item.valueEUR).toBe(4_200);
  });

  it('fizični vzrok da najnižji naslovljiv delež', () => {
    expect(pick(outputs, 'Penali in popusti zaradi zamud').addressableShare).toBe(ADDRESSABLE_SHARE.physical);
  });
});

describe('Kratka diagnostika', () => {
  it('vrne dve oceni tveganja brez evrov', () => {
    const outputs = run(diagnostika_kovinarstvo);
    expect(outputs).toHaveLength(2);
    for (const output of outputs) {
      expect(output.bucket).toBe('risk');
      expect(output.valueEUR).toBeUndefined();
    }
  });

  it('najboljši odgovori dajo nizko, najslabši visoko tveganje', () => {
    const best = run(diagnostika_kovinarstvo, {
      operationReporting: 0,
      bomVersionControl: 0,
      auditReadiness: 0,
      keyPersonIndependence: 0,
    });
    const worst = run(diagnostika_kovinarstvo, {
      operationReporting: 3,
      bomVersionControl: 3,
      auditReadiness: 3,
      keyPersonIndependence: 3,
    });
    expect(best.every((output) => output.riskLevel === 'low')).toBe(true);
    expect(worst.every((output) => output.riskLevel === 'high')).toBe(true);
  });

  it('ni v triaži — vprašanja se prikažejo vedno', () => {
    expect(diagnostika_kovinarstvo.triage).toBeUndefined();
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
        definition: nalog_kovinarstvo,
        base: { manualReportingHoursPerMonth: 20, setupTimeTracking: 0, workOrdersPerMonth: 0 },
        twist: { manualReportingHoursPerMonth: 20, setupTimeTracking: 3, workOrdersPerMonth: 400 },
      },
      {
        definition: material_kovinarstvo,
        base: { annualMaterialSpendEUR: 500_000, materialDeviationPercent: 0.03, scrapHandling: 0 },
        twist: { annualMaterialSpendEUR: 500_000, materialDeviationPercent: 0.03, scrapHandling: 3 },
      },
      {
        definition: sledljivost_kovinarstvo,
        base: { claimHandlingHoursPerMonth: 10, batchTraceTime: 0 },
        twist: { claimHandlingHoursPerMonth: 10, batchTraceTime: 3 },
      },
      {
        definition: kooperacija_kovinarstvo,
        base: { cooperationAdminHoursPerMonth: 10, cooperationShare: 0 },
        twist: { cooperationAdminHoursPerMonth: 10, cooperationShare: 3 },
      },
      {
        definition: plan_kovinarstvo,
        base: { planWaitingHoursPerMonth: 10, planningMethod: 0, onTimeDelivery: 0 },
        twist: { planWaitingHoursPerMonth: 10, planningMethod: 3, onTimeDelivery: 3 },
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
    // Izguba se v tej dejavnosti meri kot delež porabljenega materiala in v urah,
    // ne kot delež prometa; kontekst zato marže ne vpraša (contexts/kovinarstvo.ts).
    // Če bi jo kak modul začel uporabljati, mora vprašanje priti zraven.
    const input = {
      manualReportingHoursPerMonth: 20,
      priceBelowCostEUR: 5_000,
      annualMaterialSpendEUR: 1_000_000,
      materialDeviationPercent: 0.03,
      annualWriteOffEUR: 5_000,
      docSearchHoursPerMonth: 10,
      cooperationLossEUR: 1_000,
      planWaitingHoursPerMonth: 10,
    };
    const rich = { ...CONTEXT, chargeOutRateEUR: 1_000, annualRevenueEUR: 50_000_000, contributionMarginRate: 0.9 };
    for (const definition of COSTED_MODULES) {
      const resolved = resolveInputs(definition, input);
      expect(definition.compute(resolved, rich), definition.id).toEqual(definition.compute(resolved, CONTEXT));
    }
  });

  it('register segmenta našteje natanko te module, panožne pred horizontalami', () => {
    const ids = SEGMENTS.kovinarstvo.moduleIds;
    const industryIds = KOVINARSTVO_MODULES.map((definition) => definition.id);
    for (const id of industryIds) {
      expect(ids, id).toContain(id);
    }
    // Panožna stroškovna področja stojijo pred prvo horizontalo, diagnostika za njo.
    const firstHorizontal = ids.indexOf('analitikaHz');
    for (const definition of COSTED_MODULES) {
      expect(ids.indexOf(definition.id), definition.id).toBeLessThan(firstHorizontal);
    }
    expect(ids.indexOf('diagnostika_kovinarstvo')).toBeGreaterThan(firstHorizontal);
    // servisHz meri servis po predaji; reklamacije kupcev meri panožni modul Sledljivost.
    expect(ids).not.toContain('servisHz');
  });
});
