import { describe, it, expect } from 'vitest';
import {
  blagajnaMp,
  diagnostikaMp,
  kanaliMp,
  marzeMp,
  prevzemMp,
  razpolozljivostMp,
  zalogeMp,
} from './maloprodaja';
import { ADDRESSABLE_SHARE } from './addressableShare';
import type { ComputeContext, ModuleDefinition, ModuleOutputDraft } from './moduleTypes';
import { resolveInputs } from '../../lib/moduleEngine';

/**
 * Testi držijo iste tri lastnosti kot pri proizvodnji in logistiki: postavka je v
 * natanko enem košu, compute() vrne dejanski sedanji strošek (ne stroška, vnaprej
 * pomnoženega z domnevnim deležem izboljšave), in ista ura ali evro se ne pojavi
 * v dveh področjih.
 */

// Maloprodajni moduli prihodek in maržo BERETE iz konteksta (prazne police, napačne
// cene, preklicana spletna naročila), zato tu ne smeta biti 0 — sicer bi testi
// preverjali množenje z nič in ne izračuna.
const CONTEXT: ComputeContext = {
  operationalHourCostEUR: 24,
  adminHourCostEUR: 32,
  chargeOutRateEUR: 75,
  annualRevenueEUR: 3_000_000,
  contributionMarginRate: 0.25,
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

const COSTED_MODULES = [razpolozljivostMp, zalogeMp, marzeMp, blagajnaMp, prevzemMp, kanaliMp];

describe('Presežna zaloga, odpisi in znižanja', () => {
  const outputs = run(zalogeMp, {
    inventoryValueEUR: 800_000,
    annualWriteOffEUR: 26_000,
    forcedMarkdownMarginEUR: 40_000,
    reducibleShare: 2, // 11–20 % → 0.15
    mainCause: 1, // Stanje zalog v sistemu ni zanesljivo → data
  });

  it('odpisano blago je izguba denarja, prisilno znižanje pa nezaslužena marža', () => {
    // Ločena koša namenoma: odpis je denar, ki je odtekel, znižanje pa marža, ki
    // ni bila zaslužena. V enem znesku bi se razlika izgubila.
    expect(pick(outputs, 'Odpisi ter poteklo in poškodovano blago').bucket).toBe('directLoss');
    expect(pick(outputs, 'Odpisi ter poteklo in poškodovano blago').valueEUR).toBe(26_000);
    expect(pick(outputs, 'Marža, izgubljena s prisilnimi znižanji').bucket).toBe('lostMargin');
    expect(pick(outputs, 'Marža, izgubljena s prisilnimi znižanji').valueEUR).toBe(40_000);
  });

  it('strošek financiranja in sprostljivi kapital se ne podvojita', () => {
    // Kapital je enkraten denarni učinek, financiranje pa cena, ki se plačuje vsako
    // leto, dokler zaloga leži. Isti znesek v dveh vlogah, zato ločena izida.
    const sprostljivo = 800_000 * 0.15;
    expect(pick(outputs, 'Strošek financiranja presežne zaloge').bucket).toBe('directLoss');
    expect(pick(outputs, 'Strošek financiranja presežne zaloge').valueEUR).toBeCloseTo(
      sprostljivo * 0.06,
      6,
    );
    expect(pick(outputs, 'Sprostljiv obratni kapital v zalogah').valueEUR).toBe(sprostljivo);
  });

  it('sprostljiv kapital je enkraten in nima naslovljivega deleža — ta znesek JE potencial', () => {
    const item = pick(outputs, 'Sprostljiv obratni kapital v zalogah');
    expect(item.bucket).toBe('oneTimeCapital');
    expect(item.valueEUR).toBe(800_000 * 0.15);
    expect(item.addressableShare).toBeUndefined();
  });

  it('"Ne vem" pade na najkonservativnejši delež znižanja', () => {
    const unknown = run(zalogeMp, { inventoryValueEUR: 800_000, reducibleShare: 4 });
    const lowest = run(zalogeMp, { inventoryValueEUR: 800_000, reducibleShare: 0 });
    expect(pick(unknown, 'Sprostljiv obratni kapital v zalogah').valueEUR).toBe(
      pick(lowest, 'Sprostljiv obratni kapital v zalogah').valueEUR,
    );
  });

  it('vzrok v podatkih da najvišji naslovljiv delež', () => {
    expect(pick(outputs, 'Odpisi ter poteklo in poškodovano blago').addressableShare).toBe(
      ADDRESSABLE_SHARE.data,
    );
  });
});

describe('Prazne police in nedobavljivi artikli', () => {
  const outputs = run(razpolozljivostMp, {
    lostSalesSharePercent: 0.02,
    substitutionShare: 0,
    expressDeliveryCostEUR: 15_000,
    stockCheckHoursPerMonth: 30,
    mainCause: 1,
  });

  it('nezaslužena marža praznih polic ima svoj koš, ločen od odtekanja denarja', () => {
    expect(pick(outputs, 'Nezaslužena marža zaradi praznih polic').bucket).toBe('lostMargin');
  });

  it('ekspresne dobave so denar, ki odteče, iskanje zaloge pa porabljen čas', () => {
    expect(pick(outputs, 'Ekspresne dobave in nujni prevozi').bucket).toBe('directLoss');
    expect(pick(outputs, 'Ekspresne dobave in nujni prevozi').valueEUR).toBe(15_000);
    const iskanje = pick(outputs, 'Iskanje in preverjanje zaloge po enotah');
    expect(iskanje.bucket).toBe('capacity');
    expect(iskanje.valueEUR).toBe(30 * CONTEXT.operationalHourCostEUR * MONTHS);
  });
});

describe('Cene, akcije in marža', () => {
  const outputs = run(marzeMp, {
    wrongPriceSalesSharePercent: 0.015,
    marginGapPercent: 0.2,
    unclaimedRebatesEUR: 18_000,
    priceMaintenanceHoursPerMonth: 45,
    mainCause: 0, // Cenike in akcije vzdržujemo ročno → data
  });

  it('napačna cena vzame maržo, neuveljavljen rabat pa denar', () => {
    // Marža se računa iz prihodka v kontekstu, ne iz nabavne vrednosti v modulu —
    // prihodek je lastnost podjetja in ne enega stroškovnega področja.
    expect(pick(outputs, 'Marža, izgubljena pri prodaji po napačni ceni').bucket).toBe('lostMargin');
    expect(pick(outputs, 'Marža, izgubljena pri prodaji po napačni ceni').valueEUR).toBeCloseTo(
      CONTEXT.annualRevenueEUR * 0.015 * 0.2,
      6,
    );
    expect(pick(outputs, 'Neizkoriščeni dobaviteljski rabati in bonusi').bucket).toBe('directLoss');
    expect(pick(outputs, 'Neizkoriščeni dobaviteljski rabati in bonusi').valueEUR).toBe(18_000);
  });

  it('vzdrževanje cenikov je kapaciteta po administrativni uri — plačna masa se ne zniža', () => {
    const item = pick(outputs, 'Vzdrževanje cenikov, akcij in oznak');
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(45 * CONTEXT.adminHourCostEUR * MONTHS);
    expect(item.hoursPerMonth).toBe(45);
  });
});

describe('Blagajna, zaključki in manko', () => {
  const outputs = run(blagajnaMp, {
    tillCount: 8,
    closingMinutesPerTillPerDay: 15,
    shrinkageEUR: 36_000,
    stocktakeHoursPerYear: 480,
    mainCause: 3, // Kraja kupcev ali zunanjih oseb → external
  });

  it('manko se vzame, kot je vpisan — ne izpelje se iz prihodka', () => {
    // Prej se je manko računal kot odstotek prihodka. Zdaj ga trgovec odčita z
    // inventure in vpiše v evrih: ocena iz prometa je bila videti natančna, čeprav
    // je bila ugibanje.
    expect(pick(outputs, 'Inventurni manko').bucket).toBe('directLoss');
    expect(pick(outputs, 'Inventurni manko').valueEUR).toBe(36_000);
  });

  it('zaključki blagajn se merijo po eni blagajni in pomnožijo z odprtimi dnevi', () => {
    const item = pick(outputs, 'Dnevni zaključki blagajn');
    const urNaLeto = (8 * 15 * 305) / 60;
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(urNaLeto * CONTEXT.operationalHourCostEUR);
    expect(item.hoursPerMonth).toBe(urNaLeto / MONTHS);
  });

  it('inventura je kapaciteta in ločena od manka, ki ga odkrije', () => {
    const item = pick(outputs, 'Izvedba inventur');
    expect(item.bucket).toBe('capacity');
    expect(item.valueEUR).toBe(480 * CONTEXT.operationalHourCostEUR);
    expect(item.hoursPerMonth).toBe(480 / MONTHS);
  });

  it('zunanji vzrok močno zniža naslovljiv delež', () => {
    expect(pick(outputs, 'Inventurni manko').addressableShare).toBe(ADDRESSABLE_SHARE.external);
  });
});

describe('Prevzem blaga, dokumenti in prenosi', () => {
  const outputs = run(prevzemMp, {
    goodsReceiptHoursPerMonth: 60,
    documentMatchingHoursPerMonth: 25,
    transferHoursPerMonth: 30,
    mainCause: 0,
  });

  it('vse tri postavke so kapaciteta in ločene, da je vidno, kje delo nastaja', () => {
    expect(outputs).toHaveLength(3);
    expect(outputs.every((output) => output.bucket === 'capacity')).toBe(true);
  });

  it('delo v poslovalnici se vrednoti po operativni, pisarniško pa po administrativni uri', () => {
    // Ista ura po dveh postavkah bi bila povprečje, ki ne opisuje ne enega ne drugega.
    expect(pick(outputs, 'Prevzem blaga in vnos dokumentov').valueEUR).toBe(
      60 * CONTEXT.operationalHourCostEUR * MONTHS,
    );
    expect(pick(outputs, 'Prenosi med poslovalnicami in skladiščem').valueEUR).toBe(
      30 * CONTEXT.operationalHourCostEUR * MONTHS,
    );
    expect(pick(outputs, 'Usklajevanje dokumentov z dobavitelji').valueEUR).toBe(
      25 * CONTEXT.adminHourCostEUR * MONTHS,
    );
  });
});

describe('Spletna prodaja, vračila in usklajenost kanalov', () => {
  const outputs = run(kanaliMp, {
    cancelledOrderSalesEUR: 48_000,
    returnsPerMonth: 120,
    costPerReturnEUR: 9,
    catalogSyncHoursPerMonth: 18,
    orderProcessingHoursPerMonth: 40,
    mainCause: 0, // Artikle in cene vzdržujemo ločeno za vsak kanal → data
  });

  it('odpoved vzame maržo, vračilo pa stane denar — vsak v svojem košu', () => {
    // Vprašana je PRODAJNA vrednost odpovedanih naročil, maržo iz nje izpelje
    // kontekst; prej je moral trgovec sam vpisati maržo, ki je običajno ne pozna.
    expect(pick(outputs, 'Nezaslužena marža odpovedanih spletnih naročil').bucket).toBe('lostMargin');
    expect(pick(outputs, 'Nezaslužena marža odpovedanih spletnih naročil').valueEUR).toBeCloseTo(
      48_000 * CONTEXT.contributionMarginRate,
      6,
    );
    expect(pick(outputs, 'Neposredni stroški vračil').bucket).toBe('directLoss');
    expect(pick(outputs, 'Neposredni stroški vračil').valueEUR).toBe(120 * 9 * MONTHS);
  });

  it('obdelava naročil in usklajevanje kanalov sta ločeni kapaciteti', () => {
    expect(pick(outputs, 'Ročna obdelava spletnih naročil').bucket).toBe('capacity');
    expect(pick(outputs, 'Ročna obdelava spletnih naročil').valueEUR).toBe(
      40 * CONTEXT.operationalHourCostEUR * MONTHS,
    );
    expect(pick(outputs, 'Usklajevanje artiklov, cen in zalog med kanali').valueEUR).toBe(
      18 * CONTEXT.adminHourCostEUR * MONTHS,
    );
  });

  it('trgovec brez spletne prodaje ne dobi izmišljenega zneska', () => {
    // Vsa polja tega področja so 0 ali privzeta; noben privzetek ne sme sam ustvariti evra.
    const noOnline = run(kanaliMp);
    for (const output of noOnline) {
      expect(output.valueEUR, output.label).toBe(0);
    }
  });
});

describe('Kratka diagnostika', () => {
  it('vrne dve oceni tveganja brez evrov', () => {
    const outputs = run(diagnostikaMp);
    expect(outputs).toHaveLength(2);
    for (const output of outputs) {
      expect(output.bucket).toBe('risk');
      expect(output.valueEUR).toBeUndefined();
    }
  });

  it('najboljši odgovori dajo nizko, najslabši visoko tveganje', () => {
    const best = run(diagnostikaMp, {
      stockAccuracy: 0,
      knowsItemMargin: 0,
      goodsTraceability: 0,
      keyPersonIndependence: 0,
    });
    const worst = run(diagnostikaMp, {
      stockAccuracy: 3,
      knowsItemMargin: 3,
      goodsTraceability: 3,
      keyPersonIndependence: 3,
    });

    expect(best.every((output) => output.riskLevel === 'low')).toBe(true);
    expect(worst.every((output) => output.riskLevel === 'high')).toBe(true);
  });

  it('ni v triaži — vprašanja se prikažejo vedno', () => {
    expect(diagnostikaMp.triage).toBeUndefined();
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
        definition: zalogeMp,
        base: { annualWriteOffEUR: 26_000, inventoryValueEUR: 800_000, staleStockShare: 0 },
        twist: { annualWriteOffEUR: 26_000, inventoryValueEUR: 800_000, staleStockShare: 3 },
      },
      {
        definition: marzeMp,
        base: { unclaimedRebatesEUR: 18_000, previousPriceProof: 0 },
        twist: { unclaimedRebatesEUR: 18_000, previousPriceProof: 3 },
      },
      {
        definition: blagajnaMp,
        base: { shrinkageEUR: 36_000, stocktakeMethod: 0 },
        twist: { shrinkageEUR: 36_000, stocktakeMethod: 3 },
      },
      {
        definition: razpolozljivostMp,
        base: { expressDeliveryCostEUR: 15_000, replenishmentMethod: 0 },
        twist: { expressDeliveryCostEUR: 15_000, replenishmentMethod: 3 },
      },
      {
        definition: prevzemMp,
        base: { goodsReceiptHoursPerMonth: 60, receiptMethod: 0 },
        twist: { goodsReceiptHoursPerMonth: 60, receiptMethod: 3 },
      },
      // kanaliMp nima polja contextOnly, zato ga tu ni: scenarij s poljem, ki ne
      // obstaja, bi primerjal dva enaka izračuna in tiho ne preverjal ničesar.
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

  it('znana in neznana izguba blaga sta ločena izida — najostrejša meja v maloprodaji', () => {
    // Odpisano, poteklo in znižano blago VEMO; inventurni manko je tisto, česar ne
    // vemo. V enem znesku bi se razlika izgubila, z njo pa vsak ukrep, ki iz nje sledi.
    const znano = run(zalogeMp, { annualWriteOffEUR: 26_000 });
    const neznano = run(blagajnaMp, { shrinkageEUR: 36_000 });

    expect(pick(znano, 'Odpisi ter poteklo in poškodovano blago').valueEUR).toBe(26_000);
    expect(pick(neznano, 'Inventurni manko').valueEUR).toBe(36_000);
  });

  it('ure se ne štejejo dvakrat: vzdrževanje cen in usklajevanje kanalov sta ločena izida', () => {
    const cene = run(marzeMp, { priceMaintenanceHoursPerMonth: 45 });
    const kanali = run(kanaliMp, { catalogSyncHoursPerMonth: 18 });

    expect(pick(cene, 'Vzdrževanje cenikov, akcij in oznak').hoursPerMonth).toBe(45);
    expect(pick(kanali, 'Usklajevanje artiklov, cen in zalog med kanali').hoursPerMonth).toBe(18);
  });
});
