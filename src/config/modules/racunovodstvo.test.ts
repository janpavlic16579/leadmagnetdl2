import { describe, it, expect } from 'vitest';
import { diagnostikaRs, donosnostRs, obracuniRs, popravkiRs, strankeRs, zajemRs } from './racunovodstvo';
import { ADDRESSABLE_SHARE } from './addressableShare';
import type { ComputeContext, ModuleDefinition, ModuleOutputDraft } from './moduleTypes';
import { resolveInputs } from '../../lib/moduleEngine';

/**
 * Testi držijo iste tri lastnosti kot pri ostalih dejavnostih: postavka je v
 * natanko enem košu, compute() vrne dejanski sedanji strošek (ne stroška, vnaprej
 * pomnoženega z domnevnim deležem izboljšave), in ista ura se ne pojavi v dveh
 * področjih.
 *
 * Četrta lastnost je značilna za to dejavnost: računovodska in vodstvena ura NISTA
 * zamenljivi. Referent lovi listine in popravlja knjižbe, vodja odgovarja strankam
 * in podpiše obračun. Zamenjava postavk je napaka, ki je noben drug test ne bi
 * opazil — številka bi ostala videti verjetna.
 */

// Postavki sta namenoma taki, da ena ni večkratnik druge: če bi compute() zamenjal
// računovodsko (26) in vodstveno (38) uro, se to v izidu takoj pozna.
const CONTEXT: ComputeContext = {
  operationalHourCostEUR: 26,
  adminHourCostEUR: 38,
  // Računovodstvo ur ne prodaja po ceniku (glej donosnostRs) — postavka je tu samo
  // zato, ker je v ComputeContext obvezna. Noben izid je ne sme uporabiti.
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

const COSTED_MODULES = [zajemRs, strankeRs, obracuniRs, popravkiRs, donosnostRs];

describe('Zajem in vnos listin', () => {
  const outputs = run(zajemRs, {
    documentsPerMonth: 2_000,
    manualSharePercent: 0.6,
    minutesPerManualDocument: 3,
    retypingHoursPerMonth: 20,
    filingHoursPerMonth: 10,
    mainCause: 0, // Listine v papirni obliki → data
  });

  it('ročni vnos se izračuna iz listin, deleža in minut — ne iz vnesenih ur', () => {
    // 2000 × 0,6 × 3 min = 3600 min = 60 h/mesec
    const item = pick(outputs, 'Ročni vnos listin');
    expect(item.hoursPerMonth).toBe(60);
    expect(item.valueEUR).toBe(60 * CONTEXT.operationalHourCostEUR * MONTHS);
  });

  it('vse tri postavke so kapaciteta — plačna masa se z njimi ne zniža', () => {
    expect(outputs).toHaveLength(3);
    expect(outputs.every((output) => output.bucket === 'capacity')).toBe(true);
  });

  it('vnos listin se vrednoti po računovodski, ne po vodstveni uri', () => {
    expect(pick(outputs, 'Prepisovanje podatkov med programi').valueEUR).toBe(
      20 * CONTEXT.operationalHourCostEUR * MONTHS,
    );
  });

  it('vzrok v podatkih da najvišji naslovljiv delež', () => {
    expect(pick(outputs, 'Ročni vnos listin').addressableShare).toBe(ADDRESSABLE_SHARE.data);
  });
});

describe('Listine strank in komunikacija', () => {
  const outputs = run(strankeRs, {
    chasingHoursPerMonth: 30,
    inquiryHoursPerMonth: 15,
    mainCause: 3, // Stranke se ne držijo dogovorov → external
  });

  it('lovljenje listin opravi referent — računovodska ura', () => {
    expect(pick(outputs, 'Opominjanje in lovljenje listin').valueEUR).toBe(
      30 * CONTEXT.operationalHourCostEUR * MONTHS,
    );
  });

  it('na vsebinsko vprašanje odgovori vodja — vodstvena ura', () => {
    expect(pick(outputs, 'Odgovarjanje na ponavljajoča se vprašanja').valueEUR).toBe(
      15 * CONTEXT.adminHourCostEUR * MONTHS,
    );
  });

  it('zunanji vzrok močno zniža naslovljiv delež', () => {
    expect(pick(outputs, 'Opominjanje in lovljenje listin').addressableShare).toBe(
      ADDRESSABLE_SHARE.external,
    );
  });
});

describe('Obračuni, roki in konice', () => {
  const outputs = run(obracuniRs, {
    overtimeHoursPerMonth: 25,
    reportPrepHoursPerMonth: 40,
    externalHelpCostEUR: 12_000,
    latePenaltyCostEUR: 3_000,
    mainCause: 0, // Podatki niso pripravljeni pravočasno → planning
  });

  it('zunanja pomoč in globe so neposredne izgube', () => {
    const directLoss = outputs.filter((output) => output.bucket === 'directLoss');
    expect(directLoss).toHaveLength(2);
    expect(directLoss.reduce((sum, output) => sum + (output.valueEUR ?? 0), 0)).toBe(15_000);
  });

  it('nadure so kapaciteta: urejen servis opravi enak obseg, le brez konice', () => {
    const item = pick(outputs, 'Nadure ob obračunih in rokih');
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(25 * CONTEXT.operationalHourCostEUR * MONTHS);
  });

  it('glavni vzrok določi naslovljiv delež', () => {
    expect(pick(outputs, 'Zunanja pomoč v konicah').addressableShare).toBe(ADDRESSABLE_SHARE.planning);
  });
});

describe('Napake in popravki', () => {
  const outputs = run(popravkiRs, {
    correctionHoursPerMonth: 20,
    reviewHoursPerMonth: 12,
    selfReportCostEUR: 5_000,
    creditNoteCostEUR: 4_000,
    mainCause: 0, // Ročni vnos brez sprotnih kontrol → data
  });

  it('popravljanje knjižb opravi referent, kontrolo pred oddajo pa vodja', () => {
    expect(pick(outputs, 'Popravljanje knjižb in usklajevanje kontov').valueEUR).toBe(
      20 * CONTEXT.operationalHourCostEUR * MONTHS,
    );
    expect(pick(outputs, 'Dodatne kontrole pred oddajo').valueEUR).toBe(
      12 * CONTEXT.adminHourCostEUR * MONTHS,
    );
  });

  it('samoprijave in dobropisi so neposredne izgube', () => {
    expect(pick(outputs, 'Samoprijave, doplačila in obresti').bucket).toBe('directLoss');
    expect(pick(outputs, 'Dobropisi in odpisane storitve').valueEUR).toBe(4_000);
  });
});

describe('Neobračunano delo in donosnost strank', () => {
  const outputs = run(donosnostRs, {
    unbilledHoursPerMonth: 50,
    belowCostClients: 6,
    belowCostDeficitEUR: 150,
    mainCause: 1, // Dodatnega dela ne evidentiramo → data
  });

  it('neobračunana ura se vrednoti po STROŠKU ure, ne po ceniku', () => {
    // Izračun namenoma ne trdi, da bi stranka to uro plačala, če bi jo zaračunali.
    const item = pick(outputs, 'Neobračunano opravljeno delo');
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(50 * CONTEXT.operationalHourCostEUR * MONTHS);
    expect(item.valueEUR).not.toBe(50 * CONTEXT.chargeOutRateEUR * MONTHS);
  });

  it('sproščene ure so surove mesečne ure — naslov "+X strank" jih deli naprej', () => {
    expect(pick(outputs, 'Neobračunano opravljeno delo').hoursPerMonth).toBe(50);
  });

  it('primanjkljaj pri strankah pod lastno ceno je denar, ki odteka', () => {
    const item = pick(outputs, 'Stranke pod lastno ceno');
    expect(item.bucket).toBe('directLoss');
    expect(item.valueEUR).toBe(6 * 150 * MONTHS);
  });

  it('ure na stranko so contextOnly — v stroškovni izračun ne vstopijo', () => {
    const doubled = run(donosnostRs, {
      unbilledHoursPerMonth: 50,
      belowCostClients: 6,
      belowCostDeficitEUR: 150,
      mainCause: 1,
      hoursPerClientPerMonth: 40,
    });
    expect(doubled).toEqual(outputs);
  });
});

describe('Kratka diagnostika', () => {
  it('vrne dve oceni tveganja brez evrov', () => {
    const outputs = run(diagnostikaRs);
    expect(outputs).toHaveLength(2);
    for (const output of outputs) {
      expect(output.bucket).toBe('risk');
      expect(output.valueEUR).toBeUndefined();
    }
  });

  it('najboljši odgovori dajo nizko, najslabši visoko tveganje', () => {
    const best = run(diagnostikaRs, {
      knowsHoursPerClient: 0,
      knowsClientProfitability: 0,
      auditTrail: 0,
      keyPersonIndependence: 0,
    });
    const worst = run(diagnostikaRs, {
      knowsHoursPerClient: 3,
      knowsClientProfitability: 3,
      auditTrail: 3,
      keyPersonIndependence: 3,
    });

    expect(best.every((output) => output.riskLevel === 'low')).toBe(true);
    expect(worst.every((output) => output.riskLevel === 'high')).toBe(true);
  });

  it('ni v triaži — vprašanja se prikažejo vedno', () => {
    expect(diagnostikaRs.triage).toBeUndefined();
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
        definition: strankeRs,
        base: { chasingHoursPerMonth: 30, lateClientsSharePercent: 0, deliveryMethod: 0 },
        twist: { chasingHoursPerMonth: 30, lateClientsSharePercent: 0.9, deliveryMethod: 3 },
      },
      {
        definition: obracuniRs,
        base: { overtimeHoursPerMonth: 25, closingProcess: 0 },
        twist: { overtimeHoursPerMonth: 25, closingProcess: 3 },
      },
      {
        definition: donosnostRs,
        base: { unbilledHoursPerMonth: 50, declinedClientsPerYear: 0 },
        twist: { unbilledHoursPerMonth: 50, declinedClientsPerYear: 12 },
      },
    ];

    for (const { definition, base, twist } of scenarios) {
      expect(run(definition, twist), definition.id).toEqual(run(definition, base));
    }
  });

  it('nobeno področje ne uporabi zaračunane postavke — servis ur ne prodaja po ceniku', () => {
    // Storitvena dejavnost nezaračunano uro vrednoti po ceniku; računovodstvo
    // namenoma ne. Če bi kdo vzorec prekopiral sem, ta test pade.
    const cheap = { ...CONTEXT, chargeOutRateEUR: 1 };
    const rich = { ...CONTEXT, chargeOutRateEUR: 1_000 };
    for (const definition of COSTED_MODULES) {
      const input = resolveInputs(definition, { unbilledHoursPerMonth: 50 });
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

  it('ure se ne štejejo dvakrat: vnos, lovljenje in popravki so ločeni izidi', () => {
    const entry = run(zajemRs, { documentsPerMonth: 600, manualSharePercent: 1, minutesPerManualDocument: 6 });
    const chasing = run(strankeRs, { chasingHoursPerMonth: 30 });
    const fixing = run(popravkiRs, { correctionHoursPerMonth: 20 });

    expect(pick(entry, 'Ročni vnos listin').hoursPerMonth).toBe(60);
    expect(pick(chasing, 'Opominjanje in lovljenje listin').hoursPerMonth).toBe(30);
    expect(pick(fixing, 'Popravljanje knjižb in usklajevanje kontov').hoursPerMonth).toBe(20);
  });

  it('servis nima zaloge, zato nobeno področje ne vrača enkratnega kapitala', () => {
    // Vsiljena postavka bi bila prazna številka, ki bi delovala kot prihranek.
    for (const definition of COSTED_MODULES) {
      expect(run(definition).some((output) => output.bucket === 'oneTimeCapital'), definition.id).toBe(
        false,
      );
    }
  });
});
