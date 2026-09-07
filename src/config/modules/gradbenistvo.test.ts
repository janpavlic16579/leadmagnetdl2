import { describe, it, expect } from 'vitest';
import {
  diagnostika_gradbenistvo,
  gradbisce_gradbenistvo,
  marza_gradbenistvo,
  placila_gradbenistvo,
  podizvajalci_gradbenistvo,
  situacije_gradbenistvo,
  GRADBENISTVO_MODULES,
} from './gradbenistvo';
import { ADDRESSABLE_SHARE } from './addressableShare';
import type { ComputeContext, ModuleDefinition, ModuleOutputDraft } from './moduleTypes';
import { resolveInputs } from '../../lib/moduleEngine';
import { reducibleShareOf } from './shared';
import { SEGMENTS } from '../segments';

/**
 * Testi držijo iste tri lastnosti kot pri storitvah: postavka je v natanko enem
 * košu, compute() vrne dejanski sedanji strošek (ne stroška, vnaprej pomnoženega z
 * domnevnim deležem izboljšave), in ista ura se ne pojavi v dveh področjih.
 *
 * Lastnosti, značilne za to dejavnost: (1) edini koš lostMargin v segmentu je
 * marža, izgubljena zaradi prepozne informacije — trditev z manjšo težo dokaza kot
 * knjižen odliv; (2) v evre vstopa samo prekoračitev plačilnega roka NAD
 * dogovorjenim, dnevi do potrditve situacije pri nadzoru pa ostanejo kontekst;
 * (3) delavčeva (operativna) ura vstopa v natanko eno postavko, čakanje ekipe na
 * gradbišču — vse ročno delo s podatki opravlja pisarna in vodje gradbišč.
 */

// Postavki sta namenoma taki, da ena ni večkratnik druge; prihodek da okroglih
// 10.000 EUR na dan, strošek kapitala pa 10 %, da se zmnožek preveri na pamet.
const CONTEXT: ComputeContext = {
  operationalHourCostEUR: 30,
  adminHourCostEUR: 25,
  chargeOutRateEUR: 90,
  annualRevenueEUR: 3_650_000,
  contributionMarginRate: 0.15,
  capitalCostRate: 0.1,
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
  marza_gradbenistvo,
  situacije_gradbenistvo,
  gradbisce_gradbenistvo,
  podizvajalci_gradbenistvo,
  placila_gradbenistvo,
];

describe('Marža projekta in kontrola stroškov', () => {
  const outputs = run(marza_gradbenistvo, {
    costControlHoursPerMonth: 50,
    lateDetectionMarginEUR: 25_000,
    mainCause: 0, // Stroški se pripišejo z zamikom → data
  });

  it('ročna primerjava plana in realizacije je kapaciteta po administrativni uri', () => {
    const item = pick(outputs, 'Ročna primerjava plana in realizacije');
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(50 * CONTEXT.adminHourCostEUR * MONTHS);
    expect(item.hoursPerMonth).toBe(50);
  });

  it('izgubljena marža je nezaslužena marža, ne neposredna izguba', () => {
    // Denar ni odtekel — ni nikoli prišel, in stoji na predpostavki, da bi ga
    // pravočasna informacija rešila. Poročilo jo mora prikazati ločeno.
    const item = pick(outputs, 'Marža, izgubljena zaradi prepozne informacije');
    expect(item.bucket).toBe('lostMargin');
    expect(item.valueEUR).toBe(25_000);
  });

  it('vzrok v podatkih da najvišji naslovljiv delež', () => {
    for (const output of outputs) {
      expect(output.addressableShare).toBe(ADDRESSABLE_SHARE.data);
    }
  });

  it('je edino področje s košem lostMargin v segmentu', () => {
    const withLostMargin = COSTED_MODULES.filter((definition) =>
      run(definition).some((output) => output.bucket === 'lostMargin'),
    ).map((definition) => definition.id);
    expect(withLostMargin).toEqual(['marza_gradbenistvo']);
  });
});

describe('Situacije, obračun in dodatna dela', () => {
  const outputs = run(situacije_gradbenistvo, {
    situationPrepHoursPerMonth: 24,
    situationReworkHoursPerMonth: 10,
    unbilledExtrasEUR: 20_000,
    mainCause: 3, // Nadzor vrača z zamudo → external
  });

  it('priprava in popravki situacij sta ločeni kapaciteti po administrativni uri', () => {
    const prep = pick(outputs, 'Priprava situacij');
    const rework = pick(outputs, 'Popravki vrnjenih situacij');
    expect(prep.bucket).toBe('capacity');
    expect(prep.valueEUR).toBe(24 * CONTEXT.adminHourCostEUR * MONTHS);
    expect(rework.bucket).toBe('capacity');
    expect(rework.valueEUR).toBe(10 * CONTEXT.adminHourCostEUR * MONTHS);
  });

  it('neobračunana dodatna dela so neposredna izguba — delo je opravljeno, manjka račun', () => {
    const item = pick(outputs, 'Neobračunana dodatna dela in spremembe obsega');
    expect(item.bucket).toBe('directLoss');
    expect(item.valueEUR).toBe(20_000);
  });

  it('zunanji vzrok močno zniža naslovljiv delež', () => {
    for (const output of outputs) {
      expect(output.addressableShare).toBe(ADDRESSABLE_SHARE.external);
    }
  });

  it('dnevi do potrditve situacije ne premaknejo nobene številke', () => {
    // Potrjuje nadzor, ne gradbinec — PANTHEON tega ne skrajša, zato znesek ne sme
    // obljubljati prihranka. Podatek ostane vprašan za prodajno pripravo.
    const base = run(situacije_gradbenistvo, { situationPrepHoursPerMonth: 24, approvalDays: 0 });
    const slow = run(situacije_gradbenistvo, { situationPrepHoursPerMonth: 24, approvalDays: 45 });
    expect(slow).toEqual(base);
  });
});

describe('Ure, material in mehanizacija na gradbišču', () => {
  const outputs = run(gradbisce_gradbenistvo, {
    siteIdleHoursPerMonth: 100,
    projectLaborAllocationHoursPerMonth: 34,
    materialLossEUR: 12_000,
    fieldInfoHoursPerMonth: 50,
    mainCause: 1, // Vsako gradbišče svoja evidenca → data
  });

  it('čakanje ekipe je kapaciteta po DELAVČEVI uri — stoji tisti, ki dela', () => {
    const item = pick(outputs, 'Čakanje ekipe na gradbišču');
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(100 * CONTEXT.operationalHourCostEUR * MONTHS);
    expect(item.hoursPerMonth).toBe(100);
  });

  it('pripis ur in klici s terena sta kapaciteta po administrativni uri', () => {
    const labor = pick(outputs, 'Naknadni pripis ur projektom');
    const field = pick(outputs, 'Klici in čakanje na podatke s terena');
    expect(labor.bucket).toBe('capacity');
    expect(labor.valueEUR).toBe(34 * CONTEXT.adminHourCostEUR * MONTHS);
    expect(field.bucket).toBe('capacity');
    expect(field.valueEUR).toBe(50 * CONTEXT.adminHourCostEUR * MONTHS);
  });

  it('material brez vgradnje in vračila je neposredna izguba', () => {
    const item = pick(outputs, 'Material brez vgradnje in vračila');
    expect(item.bucket).toBe('directLoss');
    expect(item.valueEUR).toBe(12_000);
  });

  it('pripis strojnih ur je kontekst — ne premakne nobene številke', () => {
    const base = run(gradbisce_gradbenistvo, { materialLossEUR: 5_000, machineAllocation: 0 });
    const twist = run(gradbisce_gradbenistvo, { materialLossEUR: 5_000, machineAllocation: 2 });
    expect(twist).toEqual(base);
  });
});

describe('Podizvajalci, pogodbe in zadržki', () => {
  const outputs = run(podizvajalci_gradbenistvo, {
    subcontractorAdminHoursPerMonth: 16,
    subcontractorOverpayEUR: 9_000,
    subcontractorPenaltyEUR: 30_000,
    mainCause: 4, // Vodje potrdijo brez preverjanja → people
  });

  it('preverjanje situacij podizvajalcev je kapaciteta po administrativni uri', () => {
    const item = pick(outputs, 'Preverjanje in potrjevanje situacij podizvajalcev');
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(16 * CONTEXT.adminHourCostEUR * MONTHS);
  });

  it('preplačane situacije so neposredna izguba', () => {
    const item = pick(outputs, 'Preplačane in dvojno obračunane situacije podizvajalcev');
    expect(item.bucket).toBe('directLoss');
    expect(item.valueEUR).toBe(9_000);
  });

  it('penali podizvajalcev ne premaknejo nobene številke — PANTHEON zamude ne prepreči', () => {
    const withoutPenalty = run(podizvajalci_gradbenistvo, {
      subcontractorAdminHoursPerMonth: 16,
      subcontractorOverpayEUR: 9_000,
      mainCause: 4,
    });
    expect(outputs).toEqual(withoutPenalty);
    expect(outputs.reduce((sum, output) => sum + (output.valueEUR ?? 0), 0)).toBe(
      16 * CONTEXT.adminHourCostEUR * MONTHS + 9_000,
    );
  });

  it('vzrok pri ljudeh da nižji delež kot vzrok v podatkih', () => {
    for (const output of outputs) {
      expect(output.addressableShare).toBe(ADDRESSABLE_SHARE.people);
    }
  });
});

describe('Plačila, zadržana sredstva in terjatve', () => {
  const outputs = run(placila_gradbenistvo, {
    overdueDays: 35,
    retentionEUR: 200_000,
    reducibleShare: 2, // 11–20 % → 0,15
    writeOffEUR: 15_000,
    dunningHoursPerMonth: 17,
    mainCause: 0, // Zapadlosti se ne spremljajo → data
  });

  it('prekoračen plačilni rok je denar × dnevi × strošek kapitala', () => {
    // 3.650.000 / 365 = 10.000 EUR na dan; 35 dni × 10 % = 35.000 EUR.
    const item = pick(outputs, 'Denar, vezan v prekoračenih plačilnih rokih');
    expect(item.bucket).toBe('directLoss');
    expect(item.valueEUR).toBeCloseTo(10_000 * 35 * 0.1, 6);
  });

  it('brez prihodka je prekoračitev roka 0 — prometa si ne izmišljamo', () => {
    const noRevenue: ComputeContext = { ...CONTEXT, annualRevenueEUR: 0 };
    const item = placila_gradbenistvo
      .compute(resolveInputs(placila_gradbenistvo, { overdueDays: 35 }), noRevenue)
      .find((output) => output.label === 'Denar, vezan v prekoračenih plačilnih rokih');
    expect(item?.valueEUR).toBe(0);
    expect(placila_gradbenistvo.usesRevenue).toBe(true);
  });

  it('odpisane terjatve so neposredna izguba, opominjanje kapaciteta', () => {
    expect(pick(outputs, 'Odpisane terjatve').bucket).toBe('directLoss');
    expect(pick(outputs, 'Odpisane terjatve').valueEUR).toBe(15_000);
    const dunning = pick(outputs, 'Opominjanje in usklajevanje plačil');
    expect(dunning.bucket).toBe('capacity');
    expect(dunning.valueEUR).toBe(17 * CONTEXT.adminHourCostEUR * MONTHS);
  });

  it('sprostljiva zadržana sredstva so enkraten kapital brez naslovljivega deleža', () => {
    // Ta znesek JE potencial, ne sedanji strošek — množenje z deležem bi ga štelo dvakrat.
    const item = pick(outputs, 'Sprostljiva zadržana sredstva');
    expect(item.bucket).toBe('oneTimeCapital');
    expect(item.valueEUR).toBeCloseTo(200_000 * 0.15, 6);
    expect(item.addressableShare).toBeUndefined();
  });

  it('"Ne vem" pri deležu zadržkov pade na izmerjeno spodnjo mejo, ne na najnižji pas', () => {
    const unknown = run(placila_gradbenistvo, { retentionEUR: 100_000 });
    expect(pick(unknown, 'Sprostljiva zadržana sredstva').valueEUR).toBeCloseTo(
      100_000 * reducibleShareOf(4),
      6,
    );
    expect(reducibleShareOf(4)).toBeGreaterThan(reducibleShareOf(0));
  });
});

describe('Kratka diagnostika', () => {
  it('vrne dve oceni tveganja brez evrov', () => {
    const outputs = run(diagnostika_gradbenistvo);
    expect(outputs).toHaveLength(2);
    for (const output of outputs) {
      expect(output.bucket).toBe('risk');
      expect(output.valueEUR).toBeUndefined();
    }
  });

  it('najboljši odgovori dajo nizko, najslabši visoko tveganje', () => {
    const best = run(diagnostika_gradbenistvo, {
      hoursMachinesAllocated: 0,
      knowsMarginInProgress: 0,
      changeOrdersDocumented: 0,
      siteRunsWithoutKeyPerson: 0,
    });
    const worst = run(diagnostika_gradbenistvo, {
      hoursMachinesAllocated: 3,
      knowsMarginInProgress: 3,
      changeOrdersDocumented: 3,
      siteRunsWithoutKeyPerson: 3,
    });

    expect(best.every((output) => output.riskLevel === 'low')).toBe(true);
    expect(worst.every((output) => output.riskLevel === 'high')).toBe(true);
  });

  it('ni v triaži — vprašanja se prikažejo vedno', () => {
    expect(diagnostika_gradbenistvo.triage).toBeUndefined();
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
        definition: marza_gradbenistvo,
        base: { costControlHoursPerMonth: 50, marginTiming: 0, activeProjects: 0, deviationShare: 0 },
        twist: { costControlHoursPerMonth: 50, marginTiming: 3, activeProjects: 12, deviationShare: 3 },
      },
      {
        definition: situacije_gradbenistvo,
        base: { situationPrepHoursPerMonth: 24, approvalDays: 0, changeOrderTiming: 0 },
        twist: { situationPrepHoursPerMonth: 24, approvalDays: 60, changeOrderTiming: 3 },
      },
      {
        definition: gradbisce_gradbenistvo,
        base: { materialLossEUR: 12_000, machineAllocation: 0 },
        twist: { materialLossEUR: 12_000, machineAllocation: 3 },
      },
      {
        definition: podizvajalci_gradbenistvo,
        base: { subcontractorOverpayEUR: 9_000, subcontractorCount: 0, subcontractorPenaltyEUR: 0 },
        twist: { subcontractorOverpayEUR: 9_000, subcontractorCount: 20, subcontractorPenaltyEUR: 50_000 },
      },
    ];

    for (const { definition, base, twist } of scenarios) {
      expect(run(definition, twist), definition.id).toEqual(run(definition, base));
    }
  });

  it('delavčeva ura premakne natanko eno postavko — čakanje ekipe na gradbišču', () => {
    // Vse ročno delo s podatki opravita pisarna in vodja gradbišča (administrativna
    // ura). Če dvig delavčeve postavke premakne še kaj drugega, je nekje uporabljena
    // napačna cena in ista ura šteje kot delavčeva IN kot vodstvena.
    const filled: Record<string, Record<string, number>> = {
      marza_gradbenistvo: { costControlHoursPerMonth: 50, lateDetectionMarginEUR: 25_000 },
      situacije_gradbenistvo: { situationPrepHoursPerMonth: 24, situationReworkHoursPerMonth: 10 },
      gradbisce_gradbenistvo: {
        siteIdleHoursPerMonth: 100,
        projectLaborAllocationHoursPerMonth: 34,
        fieldInfoHoursPerMonth: 50,
      },
      podizvajalci_gradbenistvo: { subcontractorAdminHoursPerMonth: 16 },
      placila_gradbenistvo: { overdueDays: 35, dunningHoursPerMonth: 17, retentionEUR: 100_000 },
    };
    const pricey: ComputeContext = { ...CONTEXT, operationalHourCostEUR: 300 };

    const moved: string[] = [];
    for (const definition of COSTED_MODULES) {
      const input = resolveInputs(definition, filled[definition.id]);
      const before = definition.compute(input, CONTEXT);
      const after = definition.compute(input, pricey);
      for (const [index, output] of after.entries()) {
        if (output.valueEUR !== before[index].valueEUR) moved.push(output.label);
      }
    }

    expect(moved).toEqual(['Čakanje ekipe na gradbišču']);
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

  it('samo plačila berejo prihodek; marže in zaračunane postavke ne bere nihče', () => {
    for (const definition of GRADBENISTVO_MODULES) {
      const source = definition.compute.toString();
      expect(source.includes('context.annualRevenueEUR'), definition.id).toBe(
        definition.id === 'placila_gradbenistvo',
      );
      expect(source.includes('contributionMarginRate'), definition.id).toBe(false);
      expect(source.includes('chargeOutRateEUR'), definition.id).toBe(false);
    }
  });

  it('register segmenta našteje natanko te module, panožne pred horizontalami', () => {
    const ids = SEGMENTS.gradbenistvo.moduleIds;
    const own = GRADBENISTVO_MODULES.map((definition) => definition.id);
    for (const id of own) expect(ids, id).toContain(id);
    // Pet stroškovnih na začetku, diagnostika tik pred E na koncu.
    expect(ids.slice(0, 5)).toEqual(own.slice(0, 5));
    expect(ids.slice(-2)).toEqual(['diagnostika_gradbenistvo', 'E']);
  });
});
