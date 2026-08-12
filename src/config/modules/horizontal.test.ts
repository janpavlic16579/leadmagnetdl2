import { describe, it, expect } from 'vitest';
import { analitikaHz, dokumentiHz, financeHz, HORIZONTAL_MODULES, kadriHz, servisHz } from './horizontal';
import { ADDRESSABLE_SHARE } from './addressableShare';
import { MODULE_REGISTRY } from './index';
import { SEGMENTS } from '../segments';
import type { ComputeContext, ModuleDefinition, ModuleOutputDraft } from './moduleTypes';
import { resolveInputs } from '../../lib/moduleEngine';

/**
 * Testi držijo iste lastnosti kot pri panožnih modulih: postavka je v natanko
 * enem košu, compute() vrne dejanski sedanji strošek in ista ura se ne pojavi
 * v dveh področjih.
 *
 * Lastnost, značilna samo za horizontale: ista definicija je vključena v VEČ
 * segmentov, zato testi preverjajo tudi umestitev — horizontala mora biti v
 * vsakem segmentu ZA panožnimi moduli (prikaz in tie-break favorizirata panožno
 * bolečino) in PRED diagnostiko.
 */

// Postavki sta namenoma taki, da ena ni večkratnik druge: če bi compute() zamenjal
// neposredno (22) in administrativno (25) uro, se to v izidu takoj pozna.
const CONTEXT: ComputeContext = {
  operationalHourCostEUR: 22,
  adminHourCostEUR: 25,
  // Horizontale merijo pisarniško delo in ur ne prodajajo po ceniku — postavka
  // je tu samo zato, ker je v ComputeContext obvezna. Noben izid je ne sme uporabiti.
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

describe('Analitika in poročanje', () => {
  const outputs = run(analitikaHz, {
    reportPrepHoursPerMonth: 20,
    adHocAnalysisHoursPerMonth: 10,
    dataMergeHoursPerMonth: 15,
    mainCause: 0, // Podatki v več sistemih → data
  });

  it('vse tri postavke so kapaciteta in ločene, da je vidno, kje delo nastaja', () => {
    expect(outputs).toHaveLength(3);
    expect(outputs.every((output) => output.bucket === 'capacity')).toBe(true);
  });

  it('priprava poročil se vrednoti po administrativni uri', () => {
    expect(pick(outputs, 'Ročna priprava rednih poročil').valueEUR).toBe(
      20 * CONTEXT.adminHourCostEUR * MONTHS,
    );
  });

  it('vzrok v podatkih da najvišji naslovljiv delež', () => {
    expect(pick(outputs, 'Združevanje podatkov iz več virov').addressableShare).toBe(
      ADDRESSABLE_SHARE.data,
    );
  });
});

describe('Računovodstvo in finance', () => {
  const outputs = run(financeHz, {
    bookingHoursPerMonth: 30,
    reconciliationHoursPerMonth: 12,
    closingHoursPerMonth: 8,
    annualPenaltyEUR: 4_000,
    mainCause: 3, // Odvisni od zunanjega servisa → external
  });

  it('ure so kapaciteta po administrativni uri, globe pa neposredna izguba', () => {
    expect(pick(outputs, 'Ročno knjiženje in priprava dokumentov').valueEUR).toBe(
      30 * CONTEXT.adminHourCostEUR * MONTHS,
    );
    const penalty = pick(outputs, 'Zamudne obresti, globe in popravki');
    expect(penalty.bucket).toBe('directLoss');
    expect(penalty.valueEUR).toBe(4_000);
  });

  it('zunanji vzrok močno zniža naslovljiv delež', () => {
    expect(pick(outputs, 'Usklajevanje evidenc').addressableShare).toBe(ADDRESSABLE_SHARE.external);
  });
});

describe('Kadri in plače', () => {
  const outputs = run(kadriHz, {
    timesheetHoursPerMonth: 16,
    payrollPrepHoursPerMonth: 10,
    hrAdminHoursPerMonth: 6,
    annualPayrollErrorEUR: 2_500,
    mainCause: 0, // Evidence ur ročno → data
  });

  it('evidence ur so kapaciteta po administrativni uri', () => {
    const item = pick(outputs, 'Evidence prisotnosti in delovnih ur');
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(16 * CONTEXT.adminHourCostEUR * MONTHS);
  });

  it('napačni obračuni so neposredna izguba', () => {
    const item = pick(outputs, 'Stroški napačnih obračunov plač');
    expect(item.bucket).toBe('directLoss');
    expect(item.valueEUR).toBe(2_500);
  });
});

describe('Dokumentacija in e-poslovanje', () => {
  const outputs = run(dokumentiHz, {
    approvalHoursPerMonth: 8,
    searchArchiveHoursPerMonth: 12,
    manualExchangeHoursPerMonth: 10,
    annualDocDelayEUR: 3_000,
    mainCause: 1, // Potrjevanje ročno → planning
  });

  it('iskanje in pošiljanje sta kapaciteta po administrativni uri', () => {
    expect(pick(outputs, 'Iskanje in arhiviranje dokumentov').valueEUR).toBe(
      12 * CONTEXT.adminHourCostEUR * MONTHS,
    );
    expect(pick(outputs, 'Tiskanje, skeniranje in ročno pošiljanje').valueEUR).toBe(
      10 * CONTEXT.adminHourCostEUR * MONTHS,
    );
  });

  it('izgubljeni dokumenti so neposredna izguba, vzrok v procesu da srednji delež', () => {
    const item = pick(outputs, 'Stroški izgubljenih in prepozno potrjenih dokumentov');
    expect(item.bucket).toBe('directLoss');
    expect(item.addressableShare).toBe(ADDRESSABLE_SHARE.planning);
  });
});

describe('Reklamacije in poprodajni servis', () => {
  const outputs = run(servisHz, {
    serviceWorkHoursPerMonth: 14,
    rmaAdminHoursPerMonth: 6,
    annualServiceCostEUR: 5_000,
    mainCause: 0, // Primere vodimo ročno → data
  });

  it('servisni poseg gre po neposredni uri, vodenje postopka po administrativni', () => {
    // Edini horizontalni modul z dvema različnima postavkama: serviser je izvajalec,
    // papirologija je pisarna. Zamenjava postavk se v teh dveh vrsticah takoj pozna.
    expect(pick(outputs, 'Garancijska popravila in servisni posegi').valueEUR).toBe(
      14 * CONTEXT.operationalHourCostEUR * MONTHS,
    );
    expect(pick(outputs, 'Vodenje reklamacijskega postopka').valueEUR).toBe(
      6 * CONTEXT.adminHourCostEUR * MONTHS,
    );
  });

  it('obe urni postavki sta kapaciteta, deli in zunanji servis pa neposredna izguba', () => {
    expect(pick(outputs, 'Garancijska popravila in servisni posegi').bucket).toBe('capacity');
    expect(pick(outputs, 'Vodenje reklamacijskega postopka').bucket).toBe('capacity');
    const parts = pick(outputs, 'Nadomestni deli, zunanji servis in kulanca');
    expect(parts.bucket).toBe('directLoss');
    expect(parts.valueEUR).toBe(5_000);
  });

  it('ročno vodenje primerov je vzrok v podatkih — najvišji naslovljiv delež', () => {
    expect(pick(outputs, 'Nadomestni deli, zunanji servis in kulanca').addressableShare).toBe(
      ADDRESSABLE_SHARE.data,
    );
  });
});

describe('Skupne lastnosti horizontalnih modulov', () => {
  it('vsak modul ima 5–6 polj, da vprašalnik ostane kratek', () => {
    for (const definition of HORIZONTAL_MODULES) {
      expect(definition.fields.length, definition.id).toBeGreaterThanOrEqual(5);
      expect(definition.fields.length, definition.id).toBeLessThanOrEqual(6);
    }
  });

  it('vsak modul ima triažo — horizontala se nikoli ne vsili, obiskovalec jo izbere', () => {
    for (const definition of HORIZONTAL_MODULES) {
      expect(definition.triage, definition.id).toBeDefined();
    }
  });

  it('privzeti glavni vzrok je "Ne vemo" in da konservativen delež', () => {
    for (const definition of HORIZONTAL_MODULES) {
      const outputs = run(definition).filter((output) => output.addressableShare !== undefined);
      expect(outputs.length, definition.id).toBeGreaterThan(0);
      for (const output of outputs) {
        expect(output.addressableShare, `${definition.id}: ${output.label}`).toBe(
          ADDRESSABLE_SHARE.unknown,
        );
      }
    }
  });

  it('privzete vrednosti dajo končnih 0 EUR — neizpolnjena horizontala ne prispeva ničesar', () => {
    for (const definition of HORIZONTAL_MODULES) {
      for (const output of run(definition)) {
        if (output.valueEUR === undefined) continue;
        expect(Number.isFinite(output.valueEUR), `${definition.id}: ${output.label}`).toBe(true);
        expect(output.valueEUR, `${definition.id}: ${output.label}`).toBe(0);
      }
    }
  });

  it('polje s contextOnly ne premakne nobene številke', () => {
    const base = run(analitikaHz, { reportPrepHoursPerMonth: 20, reportFreshness: 0 });
    const twist = run(analitikaHz, { reportPrepHoursPerMonth: 20, reportFreshness: 3 });
    expect(twist).toEqual(base);
  });

  it('nobeno področje ne uporabi zaračunane postavke — horizontale ur ne prodajajo', () => {
    const cheap = { ...CONTEXT, chargeOutRateEUR: 1 };
    const rich = { ...CONTEXT, chargeOutRateEUR: 1_000 };
    for (const definition of HORIZONTAL_MODULES) {
      // Ključi vseh horizontal skupaj: vsak modul pobere svoje, ostale prezre —
      // sicer bi modul s samimi ničlami test opravil, ne da bi ga sploh izvedel.
      const input = resolveInputs(definition, {
        bookingHoursPerMonth: 30,
        reportPrepHoursPerMonth: 20,
        serviceWorkHoursPerMonth: 14,
        rmaAdminHoursPerMonth: 6,
      });
      expect(definition.compute(input, rich), definition.id).toEqual(definition.compute(input, cheap));
    }
  });
});

describe('Umestitev v segmente', () => {
  const HORIZONTAL_IDS = new Set(HORIZONTAL_MODULES.map((definition) => definition.id));

  it('horizontala je v vsakem segmentu ZA panožnimi moduli in PRED diagnostiko', () => {
    for (const segment of Object.values(SEGMENTS)) {
      const included = segment.moduleIds.filter((id) => HORIZONTAL_IDS.has(id));
      if (included.length === 0) continue;

      const firstHorizontal = segment.moduleIds.findIndex((id) => HORIZONTAL_IDS.has(id));
      for (const [index, id] of segment.moduleIds.entries()) {
        if (HORIZONTAL_IDS.has(id)) continue;
        const definition = MODULE_REGISTRY[id];
        // Panožni moduli s triažo morajo biti pred horizontalami (tie-break),
        // moduli brez triaže (diagnostika, E) pa za njimi (prikaz).
        if (definition?.triage) {
          expect(index, `${segment.id}: ${id}`).toBeLessThan(firstHorizontal);
        } else {
          expect(index, `${segment.id}: ${id}`).toBeGreaterThan(firstHorizontal);
        }
      }
    }
  });

  it('vsak segment ponudi vsaj dve horizontali, računovodski servis brez financeHz', () => {
    for (const segment of Object.values(SEGMENTS)) {
      const included = segment.moduleIds.filter((id) => HORIZONTAL_IDS.has(id));
      expect(included.length, segment.id).toBeGreaterThanOrEqual(2);
    }
    expect(SEGMENTS.racunovodstvo.moduleIds).not.toContain('financeHz');
    expect(SEGMENTS.racunovodstvo.moduleIds).not.toContain('dokumentiHz');
    expect(SEGMENTS.logistika.moduleIds).not.toContain('dokumentiHz');
    expect(SEGMENTS.splosno.moduleIds).not.toContain('analitikaHz');
    // servisHz meri servis PO predaji; kjer reklamacijske ure in stroške že meri
    // panožni modul (napake, popravkiRs, napakeSp), bi šlo za dvojno štetje.
    expect(SEGMENTS.logistika.moduleIds).not.toContain('servisHz');
    expect(SEGMENTS.racunovodstvo.moduleIds).not.toContain('servisHz');
    expect(SEGMENTS.splosno.moduleIds).not.toContain('servisHz');
  });
});
