import { describe, it, expect } from 'vitest';
import { administracija, diagnostika, obracun, obseg, projekti, terjatve } from './storitve';
import { ADDRESSABLE_SHARE } from './addressableShare';
import type { ComputeContext, ModuleDefinition, ModuleOutputDraft } from './moduleTypes';
import { resolveInputs } from '../../lib/moduleEngine';
import { reducibleShareOf } from './shared';

/**
 * Testi držijo iste tri lastnosti kot pri proizvodnji in logistiki: postavka je v
 * natanko enem košu, compute() vrne dejanski sedanji strošek (ne stroška, vnaprej
 * pomnoženega z domnevnim deležem izboljšave), in ista ura se ne pojavi v dveh
 * področjih.
 *
 * Četrta lastnost je značilna samo za to dejavnost: nezaračunana ura se vrednoti
 * po ZARAČUNANI postavki, vse interno delo pa po strošku ure. Zamenjava obojega je
 * napaka, ki je noben drug test ne bi opazil — številka bi ostala videti verjetna.
 */

// Postavke so namenoma različne, da test loči, katera je bila uporabljena:
// zaračunana (90) ni večkratnik ne izvedbene (30) ne administrativne (25).
const CONTEXT: ComputeContext = {
  operationalHourCostEUR: 30,
  adminHourCostEUR: 25,
  chargeOutRateEUR: 90,
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

const COSTED_MODULES = [projekti, obracun, obseg, administracija, terjatve];

describe('Plan, prioritete in zasedenost ekipe', () => {
  const outputs = run(projekti, {
    idleHoursPerMonth: 100,
    overtimeHoursPerMonth: 20,
    replanningHoursPerMonth: 40,
    mainCause: 0, // Zasedenost ni vidna vnaprej → planning
  });

  it('zastoji in nadure so kapaciteta, ne neposredna izguba', () => {
    const item = pick(outputs, 'Zastoji in nadure v ekipi');
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(120 * CONTEXT.operationalHourCostEUR * MONTHS);
  });

  it('sproščene ure so surove mesečne ure, ne skrčene z deležem izboljšave', () => {
    expect(pick(outputs, 'Zastoji in nadure v ekipi').hoursPerMonth).toBe(120);
  });

  it('prerazporejanje se vrednoti po administrativni, ne izvedbeni uri', () => {
    expect(pick(outputs, 'Prerazporejanje in usklajevanje').valueEUR).toBe(
      40 * CONTEXT.adminHourCostEUR * MONTHS,
    );
  });

  it('glavni vzrok določi naslovljiv delež', () => {
    expect(pick(outputs, 'Zastoji in nadure v ekipi').addressableShare).toBe(ADDRESSABLE_SHARE.planning);
  });
});

describe('Evidenca dela in zaračunavanje', () => {
  const outputs = run(obracun, {
    unbilledHoursPerMonth: 40,
    projectTimesheetHoursPerMonth: 25,
    creditNoteCostEUR: 12_000,
    mainCause: 0, // Ure se ne evidentirajo sproti → data
  });

  it('nezaračunane ure so neposredna izguba, vrednotena po ZARAČUNANI postavki', () => {
    const item = pick(outputs, 'Opravljene, a nezaračunane ure');
    expect(item.bucket).toBe('directLoss');
    expect(item.valueEUR).toBe(40 * CONTEXT.chargeOutRateEUR * MONTHS);
  });

  it('nezaračunane ure se NE vrednotijo po strošku ure — to bi izgubo podcenilo', () => {
    const item = pick(outputs, 'Opravljene, a nezaračunane ure');
    expect(item.valueEUR).not.toBe(40 * CONTEXT.operationalHourCostEUR * MONTHS);
    expect(item.valueEUR).toBeGreaterThan(40 * CONTEXT.operationalHourCostEUR * MONTHS);
  });

  it('dobropisi so neposredna izguba', () => {
    expect(pick(outputs, 'Dobropisi in popravki računov').bucket).toBe('directLoss');
    expect(pick(outputs, 'Dobropisi in popravki računov').valueEUR).toBe(12_000);
  });

  it('urejanje evidence je interno delo — kapaciteta po administrativni uri', () => {
    const item = pick(outputs, 'Naknadna evidenca in potrjevanje ur');
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(25 * CONTEXT.adminHourCostEUR * MONTHS);
  });

  it('vzrok v podatkih da najvišji naslovljiv delež', () => {
    expect(pick(outputs, 'Opravljene, a nezaračunane ure').addressableShare).toBe(ADDRESSABLE_SHARE.data);
  });
});

describe('Obseg, spremembe in dodelave', () => {
  const outputs = run(obseg, {
    overrunHoursPerMonth: 30,
    reworkHoursPerMonth: 20,
    writeOffEUR: 15_000,
    mainCause: 3, // Naročnik pogosto spreminja zahteve → external
  });

  it('ure nad obsegom in popravki so kapaciteta po strošku izvedbene ure', () => {
    // Namerno NE po zaračunani postavki: za to delo ni bilo dogovora, da bo
    // plačano, zato ni izgubljenega prihodka, ampak porabljena kapaciteta.
    expect(pick(outputs, 'Delo nad dogovorjenim obsegom').bucket).toBe('capacity');
    expect(pick(outputs, 'Delo nad dogovorjenim obsegom').valueEUR).toBe(
      30 * CONTEXT.operationalHourCostEUR * MONTHS,
    );
    expect(pick(outputs, 'Popravki po pripombah naročnika').valueEUR).toBe(
      20 * CONTEXT.operationalHourCostEUR * MONTHS,
    );
  });

  it('odpisi ob obračunu so neposredna izguba', () => {
    expect(pick(outputs, 'Odpisi in popusti ob obračunu').bucket).toBe('directLoss');
    expect(pick(outputs, 'Odpisi in popusti ob obračunu').valueEUR).toBe(15_000);
  });

  it('zunanji vzrok močno zniža naslovljiv delež', () => {
    expect(pick(outputs, 'Odpisi in popusti ob obračunu').addressableShare).toBe(
      ADDRESSABLE_SHARE.external,
    );
  });
});

describe('Projektna administracija in podatki', () => {
  const outputs = run(administracija, {
    projectAdminHoursPerMonth: 30,
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

describe('Roki, plačila in vezan denar', () => {
  const outputs = run(terjatve, {
    penaltyCostEUR: 8_000,
    lostMarginEUR: 12_000,
    clientCommsHoursPerMonth: 20,
    unbilledWipEUR: 300_000,
    reducibleShare: 2, // 11–20 % → 0.15
    mainCause: 3, // Naročniki plačujejo z zamudo → external
  });

  // Namerna sprememba pričakovanja: izgubljena prispevna marža je bila prestavljena iz
  // 'directLoss' v 'lostMargin'. Penal je plačan in dokazljiv; izgubljen projekt stoji na
  // predpostavki o vedenju naročnika. Test meri prav to ločnico.
  it('penal je neposredna izguba, izgubljen projekt pa nezaslužena marža', () => {
    const directLoss = outputs.filter((output) => output.bucket === 'directLoss');
    expect(directLoss).toHaveLength(1);
    expect(directLoss.reduce((sum, output) => sum + (output.valueEUR ?? 0), 0)).toBe(8_000);

    const lostMargin = outputs.filter((output) => output.bucket === 'lostMargin');
    expect(lostMargin).toHaveLength(1);
    expect(lostMargin[0].valueEUR).toBe(12_000);
  });

  it('usklajevanje z naročniki je kapaciteta', () => {
    const item = pick(outputs, 'Obveščanje in usklajevanje z naročniki');
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(20 * CONTEXT.adminHourCostEUR * MONTHS);
  });

  it('sprostljiv kapital je enkraten in se ne meša med letne zneske', () => {
    const item = pick(outputs, 'Sprostljiv kapital v nezaračunanem delu in terjatvah');
    expect(item.bucket).toBe('oneTimeCapital');
    expect(item.valueEUR).toBe(300_000 * 0.15);
  });

  it('sprostljiv kapital nima naslovljivega deleža — ta znesek JE potencial', () => {
    expect(
      pick(outputs, 'Sprostljiv kapital v nezaračunanem delu in terjatvah').addressableShare,
    ).toBeUndefined();
  });

  // Doslej je "Ne vem" padel na natanko isti delež kot najnižji pas (0,05).
  // To ni bila konservativnost, ampak polovica spodnjega roba tega, kar Aberdeen
  // izmeri ob uvedbi ERP (13,4–25 %, konservativno sidro 10–15 %) — neodgovor je
  // obljubljal manj od najslabšega izmerjenega projekta. Odslej 0,10.
  it('"Ne vem" pade na izmerjeno spodnjo mejo, ne na najnižji pas', () => {
    const valueOf = (share: number) =>
      pick(run(terjatve, { unbilledWipEUR: 300_000, reducibleShare: share }), 'Sprostljiv kapital v nezaračunanem delu in terjatvah').valueEUR ?? 0;

    expect(valueOf(4)).toBe(300_000 * reducibleShareOf(4));
    expect(valueOf(4)).toBeGreaterThan(valueOf(0));
    expect(valueOf(4)).toBeLessThan(valueOf(2));
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
      knowsProjectMargin: 0,
      scopeDocumented: 0,
      keyPersonIndependence: 0,
    });
    const worst = run(diagnostika, {
      realtimeRecording: 3,
      knowsProjectMargin: 3,
      scopeDocumented: 3,
      keyPersonIndependence: 3,
    });

    expect(best.every((output) => output.riskLevel === 'low')).toBe(true);
    expect(worst.every((output) => output.riskLevel === 'high')).toBe(true);
  });

  it('ni v triaži — vprašanja se prikažejo vedno', () => {
    expect(diagnostika.triage).toBeUndefined();
  });
});

describe('Meja med zaračunano in interno uro', () => {
  it('samo nezaračunane ure se vrednotijo po zaračunani postavki', () => {
    // Dvig zaračunane postavke sme premakniti natanko eno postavko v celotni
    // dejavnosti. Če se premakne še katera, je nekje uporabljena napačna cena in
    // ista ura šteje kot izgubljen prihodek IN kot porabljena kapaciteta.
    const cheap: ComputeContext = { ...CONTEXT, chargeOutRateEUR: 90 };
    const pricey: ComputeContext = { ...CONTEXT, chargeOutRateEUR: 180 };

    const filled: Record<string, Record<string, number>> = {
      projekti_storitve: { idleHoursPerMonth: 50, replanningHoursPerMonth: 20 },
      obracun_storitve: { unbilledHoursPerMonth: 40, projectTimesheetHoursPerMonth: 25 },
      obseg_storitve: { overrunHoursPerMonth: 30, reworkHoursPerMonth: 20 },
      administracija_storitve: { projectAdminHoursPerMonth: 30, retypingHoursPerMonth: 25 },
      terjatve_storitve: { clientCommsHoursPerMonth: 20, unbilledWipEUR: 300_000 },
    };

    const moved: string[] = [];
    for (const definition of COSTED_MODULES) {
      const input = resolveInputs(definition, filled[definition.id]);
      const before = definition.compute(input, cheap);
      const after = definition.compute(input, pricey);

      for (const [index, output] of after.entries()) {
        if (output.valueEUR !== before[index].valueEUR) moved.push(output.label);
      }
    }

    expect(moved).toEqual(['Opravljene, a nezaračunane ure']);
  });

  it('ure se ne štejejo dvakrat: čakanje, nezaračunano in presežen obseg so ločeni izidi', () => {
    const idle = run(projekti, { idleHoursPerMonth: 100 });
    const unbilled = run(obracun, { unbilledHoursPerMonth: 40 });
    const overrun = run(obseg, { overrunHoursPerMonth: 30 });

    expect(pick(idle, 'Zastoji in nadure v ekipi').hoursPerMonth).toBe(100);
    // Nezaračunane ure namenoma NIMAJO hoursPerMonth: koš directLoss meri denar,
    // ne sproščene kapacitete — sicer bi se ista ura pojavila tudi med urami.
    expect(pick(unbilled, 'Opravljene, a nezaračunane ure').hoursPerMonth).toBeUndefined();
    expect(pick(overrun, 'Delo nad dogovorjenim obsegom').hoursPerMonth).toBe(30);
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
        definition: projekti,
        base: { idleHoursPerMonth: 100, replanningHoursPerMonth: 40, planningMethod: 0 },
        twist: { idleHoursPerMonth: 100, replanningHoursPerMonth: 40, planningMethod: 3 },
      },
      {
        definition: obracun,
        base: { unbilledHoursPerMonth: 40, recordingTiming: 0 },
        twist: { unbilledHoursPerMonth: 40, recordingTiming: 3 },
      },
      {
        definition: obseg,
        base: { overrunHoursPerMonth: 30, fixedPriceSharePercent: 0 },
        twist: { overrunHoursPerMonth: 30, fixedPriceSharePercent: 1 },
      },
      {
        definition: administracija,
        base: { projectAdminHoursPerMonth: 30, toolCount: 0 },
        twist: { projectAdminHoursPerMonth: 30, toolCount: 3 },
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
});
