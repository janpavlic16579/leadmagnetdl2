import { describe, it, expect } from 'vitest';
import {
  aneksi_inzeniring,
  diagnostika_inzeniring,
  dokumentacija_inzeniring,
  INZENIRING_MODULES,
  marza_inzeniring,
  obracun_inzeniring,
  oprema_inzeniring,
} from './inzeniring';
import { ADDRESSABLE_SHARE } from './addressableShare';
import type { ComputeContext, ModuleDefinition, ModuleOutputDraft } from './moduleTypes';
import { resolveInputs } from '../../lib/moduleEngine';
import { reducibleShareOf } from './shared';
import { SEGMENTS } from '../segments';

/**
 * Testi držijo iste lastnosti kot pri storitvah in živilstvu: postavka je v
 * natanko enem košu, compute() vrne dejanski sedanji strošek, ista ura ali evro
 * ni v dveh področjih.
 *
 * Lastnost, značilna za to dejavnost: zaračunane postavke NI. Nezaračunano delo
 * je vprašano v evrih, vsaka ura pa se vrednoti po strošku — zato sprememba
 * chargeOutRateEUR ne sme premakniti nobenega izida. Če ga premakne, je nekje
 * uporabljena cena namesto stroška in privzetek 55 EUR bi tiho cenil nekaj, česar
 * obiskovalec ni nikoli vpisal.
 */

// Postavke so namenoma različne, da test loči, katera je bila uporabljena:
// zaračunana (90) ni večkratnik ne inženirske (30) ne administrativne (25).
// Prihodek 3.650.000 da dnevni prihodek natanko 10.000.
const CONTEXT: ComputeContext = {
  operationalHourCostEUR: 30,
  adminHourCostEUR: 25,
  chargeOutRateEUR: 90,
  annualRevenueEUR: 3_650_000,
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
  marza_inzeniring,
  aneksi_inzeniring,
  oprema_inzeniring,
  obracun_inzeniring,
  dokumentacija_inzeniring,
];

describe('Marža projekta in evidenca ur', () => {
  const outputs = run(marza_inzeniring, {
    timesheetReconstructionHoursPerMonth: 24,
    overrunHoursPerMonth: 60,
    marginTrackingHoursPerMonth: 15,
    mainCause: 0, // Ure ob koncu meseca → data
  });

  it('vse tri postavke so kapaciteta — plačan čas, ne odtekel denar', () => {
    expect(outputs).toHaveLength(3);
    expect(outputs.every((output) => output.bucket === 'capacity')).toBe(true);
  });

  it('razporejanje ur in stanje marže gresta po administrativni uri', () => {
    expect(pick(outputs, 'Naknadno razporejanje ur na projekte').valueEUR).toBe(
      24 * CONTEXT.adminHourCostEUR * MONTHS,
    );
    expect(pick(outputs, 'Sestavljanje stanja stroškov in marže projektov').valueEUR).toBe(
      15 * CONTEXT.adminHourCostEUR * MONTHS,
    );
  });

  it('delo nad lastno kalkulacijo gre po strošku inženirske ure, ne po ceni', () => {
    // Za to delo ni bilo dogovora, da bo plačano: ni izgubljen prihodek, ampak
    // porabljena kapaciteta — isto načelo kot pri storitvah.
    const item = pick(outputs, 'Delo nad lastno kalkulacijo');
    expect(item.valueEUR).toBe(60 * CONTEXT.operationalHourCostEUR * MONTHS);
    expect(item.valueEUR).not.toBe(60 * CONTEXT.chargeOutRateEUR * MONTHS);
    expect(item.hoursPerMonth).toBe(60);
  });

  it('vzrok v podatkih da najvišji naslovljiv delež', () => {
    expect(pick(outputs, 'Delo nad lastno kalkulacijo').addressableShare).toBe(ADDRESSABLE_SHARE.data);
  });
});

describe('Spremembe obsega in aneksi', () => {
  const outputs = run(aneksi_inzeniring, {
    unbilledChangeWorkEUR: 24_000,
    changeDocumentationHoursPerMonth: 18,
    quoteHoursPerMonth: 20,
    mainCause: 3, // Naročnik ne potrdi pisno → external
  });

  it('dodatna dela brez aneksa so neposredna izguba po ponudbeni vrednosti', () => {
    const item = pick(outputs, 'Dodatna dela brez aneksa, nikoli zaračunana');
    expect(item.bucket).toBe('directLoss');
    expect(item.valueEUR).toBe(24_000);
    // Koš directLoss meri denar, ne sproščene kapacitete — brez ur.
    expect(item.hoursPerMonth).toBeUndefined();
  });

  it('dokazovanje in iskanje sta kapaciteta po administrativni uri', () => {
    expect(pick(outputs, 'Naknadno dokazovanje sprememb in aneksi za nazaj').valueEUR).toBe(
      18 * CONTEXT.adminHourCostEUR * MONTHS,
    );
    expect(pick(outputs, 'Iskanje kalkulacij in poizvedovanje cen opreme').valueEUR).toBe(
      20 * CONTEXT.adminHourCostEUR * MONTHS,
    );
  });

  it('zunanji vzrok močno zniža naslovljiv delež', () => {
    expect(pick(outputs, 'Dodatna dela brez aneksa, nikoli zaračunana').addressableShare).toBe(
      ADDRESSABLE_SHARE.external,
    );
  });
});

describe('Oprema, nabava in podizvajalci', () => {
  const outputs = run(oprema_inzeniring, {
    orphanEquipmentStockEUR: 40_000,
    reducibleShare: 2, // 11–20 % → 0.15
    urgentDeliveryCostEUR: 12_000,
    siteWaitingHoursPerMonth: 100,
    procurementCoordinationHoursPerMonth: 63,
    mainCause: 1, // Roki niso povezani s planom → planning
  });

  it('oprema brez projekta je enkraten sprostljiv kapital brez naslovljivega deleža', () => {
    const item = pick(outputs, 'Sprostljiv kapital v opremi brez projekta');
    expect(item.bucket).toBe('oneTimeCapital');
    expect(item.valueEUR).toBe(40_000 * 0.15);
    expect(item.addressableShare).toBeUndefined();
  });

  it('"Ne vem" pade na izmerjeno spodnjo mejo, ne na najnižji pas', () => {
    const valueOf = (share: number) =>
      pick(run(oprema_inzeniring, { orphanEquipmentStockEUR: 40_000, reducibleShare: share }), 'Sprostljiv kapital v opremi brez projekta').valueEUR ?? 0;
    expect(valueOf(4)).toBe(40_000 * reducibleShareOf(4));
    expect(valueOf(4)).toBeGreaterThan(valueOf(0));
    expect(valueOf(4)).toBeLessThan(valueOf(2));
  });

  it('ekspresne dobave in kazni so neposredna izguba', () => {
    const item = pick(outputs, 'Ekspresne dobave, stojnine in kazni zaradi opreme');
    expect(item.bucket).toBe('directLoss');
    expect(item.valueEUR).toBe(12_000);
  });

  it('čakanje na terenu gre po inženirski uri, usklajevanje po administrativni', () => {
    expect(pick(outputs, 'Čakanje na terenu na opremo ali podizvajalca').valueEUR).toBe(
      100 * CONTEXT.operationalHourCostEUR * MONTHS,
    );
    expect(pick(outputs, 'Spremljanje rokov in usklajevanje podizvajalcev').valueEUR).toBe(
      63 * CONTEXT.adminHourCostEUR * MONTHS,
    );
  });

  it('vzrok v planiranju da srednji naslovljiv delež', () => {
    expect(pick(outputs, 'Čakanje na terenu na opremo ali podizvajalca').addressableShare).toBe(
      ADDRESSABLE_SHARE.planning,
    );
  });
});

describe('Obračun po fazah, zadržki in vzdrževalne pogodbe', () => {
  const outputs = run(obracun_inzeniring, {
    phaseInvoiceLagDays: 21,
    retentionOverdueEUR: 60_000,
    unbilledServiceEUR: 12_000,
    phaseBillingHoursPerMonth: 30,
    mainCause: 0, // Faza in račun nista povezana → data
  });

  it('denar v fazah brez računa = dnevni prihodek × dni × strošek financiranja', () => {
    const item = pick(outputs, 'Denar, vezan v zaključenih fazah brez računa');
    expect(item.bucket).toBe('directLoss');
    expect(item.valueEUR).toBeCloseTo(10_000 * 21 * 0.06, 6);
  });

  it('brez prihodka je zamik računa 0 EUR — prometa si ne izmišljamo', () => {
    const noRevenue: ComputeContext = { ...CONTEXT, annualRevenueEUR: 0 };
    const item = obracun_inzeniring
      .compute(resolveInputs(obracun_inzeniring, { phaseInvoiceLagDays: 21 }), noRevenue)
      .find((output) => output.label === 'Denar, vezan v zaključenih fazah brez računa');
    expect(item?.valueEUR).toBe(0);
    expect(obracun_inzeniring.usesRevenue).toBe(true);
  });

  it('zapadli zadržki so enkraten kapital v celoti, brez deleža', () => {
    const item = pick(outputs, 'Zapadli, neunovčeni zadržki in garancije');
    expect(item.bucket).toBe('oneTimeCapital');
    expect(item.valueEUR).toBe(60_000);
    expect(item.addressableShare).toBeUndefined();
  });

  it('neobračunan servis je neposredna izguba, situacije pa kapaciteta', () => {
    expect(pick(outputs, 'Neobračunani servisni posegi in vzdrževalne pogodbe').bucket).toBe('directLoss');
    expect(pick(outputs, 'Neobračunani servisni posegi in vzdrževalne pogodbe').valueEUR).toBe(12_000);
    const hours = pick(outputs, 'Ročna priprava situacij in spremljanje zadržkov');
    expect(hours.bucket).toBe('capacity');
    expect(hours.valueEUR).toBe(30 * CONTEXT.adminHourCostEUR * MONTHS);
  });
});

describe('Projektna dokumentacija, razpisi in prevzem', () => {
  const outputs = run(dokumentacija_inzeniring, {
    docSearchHoursPerMonth: 56,
    tenderDocHoursPerMonth: 24,
    handoverDocHoursPerMonth: 30,
    fieldCallsHoursPerMonth: 50,
    mainCause: 0,
  });

  it('vse štiri postavke so kapaciteta in ločene, da je vidno, kje delo nastaja', () => {
    expect(outputs).toHaveLength(4);
    expect(outputs.every((output) => output.bucket === 'capacity')).toBe(true);
  });

  it('inženirsko delo gre po inženirski uri, razpisi po administrativni', () => {
    expect(pick(outputs, 'Iskanje veljavne projektne dokumentacije').valueEUR).toBe(
      56 * CONTEXT.operationalHourCostEUR * MONTHS,
    );
    expect(pick(outputs, 'Ponovno zbiranje dokumentacije ob predaji').valueEUR).toBe(
      30 * CONTEXT.operationalHourCostEUR * MONTHS,
    );
    expect(pick(outputs, 'Teren brez dostopa do projektnih podatkov').valueEUR).toBe(
      50 * CONTEXT.operationalHourCostEUR * MONTHS,
    );
    expect(pick(outputs, 'Reference in razpisna dokumentacija').valueEUR).toBe(
      24 * CONTEXT.adminHourCostEUR * MONTHS,
    );
  });
});

describe('Kratka diagnostika', () => {
  it('vrne dve oceni tveganja brez evrov', () => {
    const outputs = run(diagnostika_inzeniring);
    expect(outputs).toHaveLength(2);
    for (const output of outputs) {
      expect(output.bucket).toBe('risk');
      expect(output.valueEUR).toBeUndefined();
    }
  });

  it('najboljši odgovori dajo nizko, najslabši visoko tveganje', () => {
    const best = run(diagnostika_inzeniring, {
      hoursPerProject: 0,
      equipmentPerProject: 0,
      changeApprovedBefore: 0,
      keyPersonIndependence: 0,
    });
    const worst = run(diagnostika_inzeniring, {
      hoursPerProject: 3,
      equipmentPerProject: 3,
      changeApprovedBefore: 3,
      keyPersonIndependence: 3,
    });
    expect(best.every((output) => output.riskLevel === 'low')).toBe(true);
    expect(worst.every((output) => output.riskLevel === 'high')).toBe(true);
  });

  it('ni v triaži — vprašanja se prikažejo vedno', () => {
    expect(diagnostika_inzeniring.triage).toBeUndefined();
  });
});

describe('Brez zaračunane postavke', () => {
  it('sprememba zaračunane postavke ne premakne nobenega izida v celotni dejavnosti', () => {
    // Ta dejavnost postavke ne vpraša; privzetek 55 EUR bi sicer tiho cenil nekaj,
    // česar obiskovalec ni nikoli vpisal.
    const cheap: ComputeContext = { ...CONTEXT, chargeOutRateEUR: 1 };
    const pricey: ComputeContext = { ...CONTEXT, chargeOutRateEUR: 1_000 };

    const filled: Record<string, Record<string, number>> = {
      marza_inzeniring: { timesheetReconstructionHoursPerMonth: 24, overrunHoursPerMonth: 60, marginTrackingHoursPerMonth: 15 },
      aneksi_inzeniring: { unbilledChangeWorkEUR: 24_000, changeDocumentationHoursPerMonth: 18, quoteHoursPerMonth: 20 },
      oprema_inzeniring: { orphanEquipmentStockEUR: 40_000, urgentDeliveryCostEUR: 12_000, siteWaitingHoursPerMonth: 100, procurementCoordinationHoursPerMonth: 63 },
      obracun_inzeniring: { phaseInvoiceLagDays: 21, retentionOverdueEUR: 60_000, unbilledServiceEUR: 12_000, phaseBillingHoursPerMonth: 30 },
      dokumentacija_inzeniring: { docSearchHoursPerMonth: 56, tenderDocHoursPerMonth: 24, handoverDocHoursPerMonth: 30, fieldCallsHoursPerMonth: 50 },
    };

    for (const definition of COSTED_MODULES) {
      const input = resolveInputs(definition, filled[definition.id]);
      expect(definition.compute(input, pricey), definition.id).toEqual(definition.compute(input, cheap));
    }
  });

  it('ure se ne štejejo dvakrat: ure so samo pri kapaciteti, evri brez ur', () => {
    for (const definition of COSTED_MODULES) {
      // Vsako številsko polje dobi vrednost, izpeljano iz enote — test ne sme
      // pozabiti polja, ki bi ga kdo dodal pozneje.
      const filled: Record<string, number> = {};
      for (const field of definition.fields) {
        if (field.kind !== 'number' || field.contextOnly) continue;
        filled[field.key] = field.unit === 'h/mesec' ? 10 : field.unit === 'dni' ? 10 : 1_000;
      }
      const input = resolveInputs(definition, filled);
      for (const output of definition.compute(input, CONTEXT)) {
        if (output.bucket === 'capacity') {
          expect(output.hoursPerMonth, `${definition.id}: ${output.label}`).toBeGreaterThan(0);
        } else {
          expect(output.hoursPerMonth, `${definition.id}: ${output.label}`).toBeUndefined();
        }
      }
    }
  });
});

describe('Skupne lastnosti stroškovnih modulov', () => {
  it('vsak modul ima 5–6 polj, da vprašalnik ostane kratek', () => {
    for (const definition of COSTED_MODULES) {
      expect(definition.fields.length, definition.id).toBeGreaterThanOrEqual(5);
      expect(definition.fields.length, definition.id).toBeLessThanOrEqual(6);
    }
  });

  it('privzete vrednosti dajo končnih 0 EUR — neizpolnjeno področje ne prispeva ničesar', () => {
    for (const definition of INZENIRING_MODULES) {
      for (const output of run(definition)) {
        if (output.valueEUR === undefined) continue;
        expect(Number.isFinite(output.valueEUR), `${definition.id}: ${output.label}`).toBe(true);
        expect(output.valueEUR, `${definition.id}: ${output.label}`).toBe(0);
      }
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

  it('polja s contextOnly ne premaknejo nobene številke', () => {
    const scenarios: {
      definition: ModuleDefinition;
      base: Record<string, number>;
      twist: Record<string, number>;
    }[] = [
      {
        definition: marza_inzeniring,
        base: { overrunHoursPerMonth: 60, postCalcPractice: 0, daysToKnownMargin: 0 },
        twist: { overrunHoursPerMonth: 60, postCalcPractice: 3, daysToKnownMargin: 90 },
      },
      {
        definition: aneksi_inzeniring,
        base: { unbilledChangeWorkEUR: 24_000, changeApprovalTiming: 0 },
        twist: { unbilledChangeWorkEUR: 24_000, changeApprovalTiming: 3 },
      },
      {
        definition: obracun_inzeniring,
        base: { phaseInvoiceLagDays: 21, billingTrigger: 0 },
        twist: { phaseInvoiceLagDays: 21, billingTrigger: 3 },
      },
      {
        definition: dokumentacija_inzeniring,
        base: { docSearchHoursPerMonth: 56, docStorage: 0 },
        twist: { docSearchHoursPerMonth: 56, docStorage: 3 },
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

  it('segment vsebuje vse module dejavnosti v vrstnem redu prednosti, brez dokumentiHz', () => {
    const ids = SEGMENTS.inzeniring.moduleIds;
    const own = INZENIRING_MODULES.map((definition) => definition.id);
    expect(ids.filter((id) => own.includes(id))).toEqual(own);
    expect(ids).not.toContain('dokumentiHz');
    expect(ids).toContain('servisHz');
  });
});
