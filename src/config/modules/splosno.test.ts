import { describe, it, expect } from 'vitest';
import { denarSp, diagnostikaSp, napakeSp, podatkiSp, usklajevanjeSp, zalogeSp } from './splosno';
import { ADDRESSABLE_SHARE } from './addressableShare';
import { RECEIVABLES_CAPITAL_COST } from './shared';
import type { ComputeContext, ModuleDefinition, ModuleOutputDraft } from './moduleTypes';
import { resolveInputs } from '../../lib/moduleEngine';

/**
 * Testi držijo iste tri lastnosti kot pri ostalih dejavnostih: postavka je v
 * natanko enem košu, compute() vrne dejanski sedanji strošek (ne stroška, vnaprej
 * pomnoženega z domnevnim deležem izboljšave), in ista ura se ne pojavi v dveh
 * področjih.
 *
 * Četrta lastnost je značilna za to dejavnost: nobeno vprašanje ne sme
 * predpostaviti, KAJ podjetje počne. Praktična posledica, ki jo je mogoče
 * testirati: vsako področje mora vrniti smiseln izid tudi pri samih ničlah —
 * podjetje brez zalog ali brez terjatev ne sme dobiti NaN ali Infinity.
 */

// Postavki sta namenoma taki, da ena ni večkratnik druge: če bi compute() zamenjal
// neposredno (30) in administrativno (35) uro, se to v izidu takoj pozna.
const CONTEXT: ComputeContext = {
  operationalHourCostEUR: 30,
  adminHourCostEUR: 35,
  // Splošni segment ur ne prodaja po ceniku — postavka je tu samo zato, ker je v
  // ComputeContext obvezna. Noben izid je ne sme uporabiti.
  chargeOutRateEUR: 90,
  // V osnovnem kontekstu 0: od modulov segmenta prihodek bere samo terjatve (ima
  // svoj kontekst spodaj) in vsak drug modul, ki bi ga tiho začel brati, test takoj izda.
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

const COSTED_MODULES = [podatkiSp, usklajevanjeSp, napakeSp, denarSp, zalogeSp];

describe('Ročno delo s podatki in dokumenti', () => {
  const outputs = run(podatkiSp, {
    entryHoursPerMonth: 40,
    dataFixHoursPerMonth: 20,
    reportingHoursPerMonth: 15,
    mainCause: 0, // Podatki v več ločenih orodjih → data
  });

  it('vse tri postavke so kapaciteta in ločene, da je vidno, kje delo nastaja', () => {
    expect(outputs).toHaveLength(3);
    expect(outputs.every((output) => output.bucket === 'capacity')).toBe(true);
  });

  it('pisarniško delo se vrednoti po administrativni uri', () => {
    expect(pick(outputs, 'Vnašanje in prepisovanje podatkov').valueEUR).toBe(
      40 * CONTEXT.adminHourCostEUR * MONTHS,
    );
  });

  it('vzrok v podatkih da najvišji naslovljiv delež', () => {
    expect(pick(outputs, 'Ročna priprava poročil').addressableShare).toBe(ADDRESSABLE_SHARE.data);
  });
});

describe('Iskanje informacij in usklajevanje', () => {
  const outputs = run(usklajevanjeSp, {
    waitingHoursPerMonth: 50,
    searchHoursPerMonth: 25,
    statusHoursPerMonth: 30,
    mainCause: 1, // Statusi niso vidni sproti → planning
  });

  it('zastoj zadene tistega, ki dela — zato neposredna ura', () => {
    expect(pick(outputs, 'Zastoji zaradi manjkajočih odločitev in informacij').valueEUR).toBe(
      50 * CONTEXT.operationalHourCostEUR * MONTHS,
    );
  });

  it('iskanje in usklajevanje sta pisarniško delo — administrativna ura', () => {
    expect(pick(outputs, 'Iskanje informacij in dokumentov').valueEUR).toBe(
      25 * CONTEXT.adminHourCostEUR * MONTHS,
    );
    expect(pick(outputs, 'Statusna vprašanja in usklajevanje').valueEUR).toBe(
      30 * CONTEXT.adminHourCostEUR * MONTHS,
    );
  });

  it('vzrok v planiranju da srednji naslovljiv delež', () => {
    expect(pick(outputs, 'Iskanje informacij in dokumentov').addressableShare).toBe(
      ADDRESSABLE_SHARE.planning,
    );
  });
});

describe('Napake in ponovno delo', () => {
  const outputs = run(napakeSp, {
    reworkHoursPerMonth: 35,
    annualClaimCostEUR: 12_000,
    annualLostMarginEUR: 8_000,
    mainCause: 4, // Napake dobaviteljev → external
  });

  it('ure ponovnega dela so kapaciteta — plačna masa se z njimi ne zniža', () => {
    const item = pick(outputs, 'Popravljanje in ponavljanje dela');
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(35 * CONTEXT.operationalHourCostEUR * MONTHS);
  });

  it('reklamacije in izgubljena marža sta neposredni izgubi', () => {
    const directLoss = outputs.filter((output) => output.bucket === 'directLoss');
    expect(directLoss).toHaveLength(2);
    expect(directLoss.reduce((sum, output) => sum + (output.valueEUR ?? 0), 0)).toBe(20_000);
  });

  it('zunanji vzrok močno zniža naslovljiv delež', () => {
    expect(pick(outputs, 'Reklamacije, dobropisi in popusti').addressableShare).toBe(
      ADDRESSABLE_SHARE.external,
    );
  });
});

describe('Plačilni roki in terjatve', () => {
  // Prihodek pride iz skupne finančne osnove, ne iz polja modula (korak 2 prenove).
  const REVENUE_CONTEXT: ComputeContext = { ...CONTEXT, annualRevenueEUR: 4_000_000 };
  const outputs = denarSp.compute(
    resolveInputs(denarSp, {
      overdueDaysAverage: 20,
      dunningHoursPerMonth: 12,
      annualBadDebtEUR: 15_000,
      mainCause: 0, // Opominjanje ni sistematično → planning
    }),
    REVENUE_CONTEXT,
  );

  it('strošek zamud šteje samo prekoračitev nad dogovorjenim rokom', () => {
    expect(pick(outputs, 'Strošek zamud pri plačilih').valueEUR).toBeCloseTo(
      (4_000_000 / 365) * 20 * RECEIVABLES_CAPITAL_COST,
      6,
    );
  });

  it('odpisane terjatve so neposredna izguba, izterjava pa kapaciteta', () => {
    expect(pick(outputs, 'Odpisane terjatve').bucket).toBe('directLoss');
    expect(pick(outputs, 'Opominjanje in izterjava').bucket).toBe('capacity');
    expect(pick(outputs, 'Opominjanje in izterjava').valueEUR).toBe(
      12 * CONTEXT.adminHourCostEUR * MONTHS,
    );
  });
});

describe('Zaloge in vezan kapital', () => {
  const outputs = run(zalogeSp, {
    inventoryValueEUR: 600_000,
    annualWriteOffEUR: 18_000,
    reducibleShare: 2, // 11–20 % → 0.15
    mainCause: 0, // Stanje zalog ni zanesljivo → data
  });

  it('odpisi so neposredna izguba', () => {
    expect(pick(outputs, 'Odpisi in razvrednotenja zalog').bucket).toBe('directLoss');
    expect(pick(outputs, 'Odpisi in razvrednotenja zalog').valueEUR).toBe(18_000);
  });

  it('sprostljiv kapital je enkraten in se ne meša med letne zneske', () => {
    const item = pick(outputs, 'Sprostljiv obratni kapital v zalogah');
    expect(item.bucket).toBe('oneTimeCapital');
    expect(item.valueEUR).toBe(600_000 * 0.15);
  });

  it('sprostljiv kapital nima naslovljivega deleža — ta znesek JE potencial', () => {
    expect(pick(outputs, 'Sprostljiv obratni kapital v zalogah').addressableShare).toBeUndefined();
  });

  it('"Ne vem" pade na najkonservativnejši delež znižanja', () => {
    const unknown = run(zalogeSp, { inventoryValueEUR: 600_000, reducibleShare: 4 });
    const lowest = run(zalogeSp, { inventoryValueEUR: 600_000, reducibleShare: 0 });
    expect(pick(unknown, 'Sprostljiv obratni kapital v zalogah').valueEUR).toBe(
      pick(lowest, 'Sprostljiv obratni kapital v zalogah').valueEUR,
    );
  });
});

describe('Kratka diagnostika', () => {
  it('vrne dve oceni tveganja brez evrov', () => {
    const outputs = run(diagnostikaSp);
    expect(outputs).toHaveLength(2);
    for (const output of outputs) {
      expect(output.bucket).toBe('risk');
      expect(output.valueEUR).toBeUndefined();
    }
  });

  it('najboljši odgovori dajo nizko, najslabši visoko tveganje', () => {
    const best = run(diagnostikaSp, {
      knowsUnitCost: 0,
      singleSourceOfTruth: 0,
      auditTrail: 0,
      keyPersonIndependence: 0,
    });
    const worst = run(diagnostikaSp, {
      knowsUnitCost: 3,
      singleSourceOfTruth: 3,
      auditTrail: 3,
      keyPersonIndependence: 3,
    });

    expect(best.every((output) => output.riskLevel === 'low')).toBe(true);
    expect(worst.every((output) => output.riskLevel === 'high')).toBe(true);
  });

  it('ni v triaži — vprašanja se prikažejo vedno', () => {
    expect(diagnostikaSp.triage).toBeUndefined();
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

  it('podjetje brez zalog in terjatev ne dobi NaN ne Infinity', () => {
    // Edina dejavnost, kjer je to realen scenarij: do teh vprašanj pride podjetje,
    // ki se ni prepoznalo v nobeni panogi, zato sme biti polovica področij zanj
    // prazna. Deljenje s 365 pri praznih prihodkih je najbližje pasti.
    for (const definition of COSTED_MODULES) {
      for (const output of run(definition)) {
        if (output.valueEUR === undefined) continue;
        expect(Number.isFinite(output.valueEUR), `${definition.id}: ${output.label}`).toBe(true);
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
        definition: podatkiSp,
        base: { entryHoursPerMonth: 40, toolCount: 0 },
        twist: { entryHoursPerMonth: 40, toolCount: 3 },
      },
      {
        definition: usklajevanjeSp,
        base: { waitingHoursPerMonth: 50, infoAccess: 0 },
        twist: { waitingHoursPerMonth: 50, infoAccess: 3 },
      },
      {
        definition: napakeSp,
        base: { reworkHoursPerMonth: 35, errorDetection: 0 },
        twist: { reworkHoursPerMonth: 35, errorDetection: 3 },
      },
      {
        definition: denarSp,
        base: { overdueDaysAverage: 20, currentDSODays: 0 },
        twist: { overdueDaysAverage: 20, currentDSODays: 95 },
      },
      {
        definition: zalogeSp,
        base: { inventoryValueEUR: 600_000, annualWriteOffEUR: 18_000, stockVisibility: 0 },
        twist: { inventoryValueEUR: 600_000, annualWriteOffEUR: 18_000, stockVisibility: 3 },
      },
    ];

    for (const { definition, base, twist } of scenarios) {
      expect(run(definition, twist), definition.id).toEqual(run(definition, base));
    }
  });

  it('nobeno področje ne uporabi zaračunane postavke — splošni segment ur ne prodaja', () => {
    const cheap = { ...CONTEXT, chargeOutRateEUR: 1 };
    const rich = { ...CONTEXT, chargeOutRateEUR: 1_000 };
    for (const definition of COSTED_MODULES) {
      const input = resolveInputs(definition, { reworkHoursPerMonth: 35, entryHoursPerMonth: 40 });
      expect(definition.compute(input, rich), definition.id).toEqual(definition.compute(input, cheap));
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

  it('ure se ne štejejo dvakrat: vnos, iskanje in ponovno delo so ločeni izidi', () => {
    const data = run(podatkiSp, { entryHoursPerMonth: 40 });
    const coord = run(usklajevanjeSp, { searchHoursPerMonth: 25 });
    const rework = run(napakeSp, { reworkHoursPerMonth: 35 });

    expect(pick(data, 'Vnašanje in prepisovanje podatkov').hoursPerMonth).toBe(40);
    expect(pick(coord, 'Iskanje informacij in dokumentov').hoursPerMonth).toBe(25);
    expect(pick(rework, 'Popravljanje in ponavljanje dela').hoursPerMonth).toBe(35);
  });
});
