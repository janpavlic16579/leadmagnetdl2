import {
  calculateModuleA,
  calculateModuleB,
  calculateModuleC,
  calculateModuleD,
} from '../../lib/calculations';
import type { ModuleDefinition, ModuleField, ModuleOutputDraft } from './moduleTypes';

/**
 * Obstoječi moduli A–E, prepisani v register.
 *
 * compute() namenoma DELEGIRA na funkcije v lib/calculations.ts — matematika se ni
 * spremenila, zato calculations.test.ts z validacijskimi primeri ostane nedotaknjen
 * in še naprej velja. Koši so izbrani tako, da je directLossEUR za trgovino,
 * računovodstvo in splošno številčno enak nekdanjemu totalAnnualLossEUR
 * (glej test enakosti v moduleEngine.test.ts).
 *
 * Vprašanja so bila doslej segmentno različna, zato ima vsak modul po eno različico
 * na segment. Podvojitev je tu cenejša od segmentnega prekrivanja besedil, ki bi
 * vrnilo prav kompleksnost, ki jo register odpravlja.
 */

// --- Skupna polja -----------------------------------------------------------

const hourlyLaborCostField = (label: string, defaultEUR: number): ModuleField => ({
  key: 'hourlyLaborCostEUR',
  label,
  kind: 'slider',
  min: 18,
  max: 35,
  step: 1,
  unit: 'EUR/h',
  default: defaultEUR,
});

const HOURLY_COST_QUESTION = 'Kolikšen je polni strošek dela na uro (EUR)?';

// --- Modul A: ročno delo ----------------------------------------------------

interface ModuleAOptions {
  id: string;
  documentsQuestion: string;
  minutesQuestion: string;
  documentsUnit: string;
  minutesDefault: number;
}

function makeModuleA({
  id,
  documentsQuestion,
  minutesQuestion,
  documentsUnit,
  minutesDefault,
}: ModuleAOptions): ModuleDefinition {
  return {
    id,
    title: 'Ročno delo',
    summary: 'Čas, ki gre za ročno obdelavo dokumentov.',
    fields: [
      { key: 'documentsPerMonth', label: documentsQuestion, kind: 'number', unit: documentsUnit, default: 0 },
      {
        key: 'minutesPerDocument',
        label: minutesQuestion,
        kind: 'slider',
        min: 0.5,
        max: 15,
        step: 0.5,
        unit: 'min',
        default: minutesDefault,
      },
      hourlyLaborCostField(HOURLY_COST_QUESTION, 25),
    ],
    compute: (input) => {
      const result = calculateModuleA({
        documentsPerMonth: input.documentsPerMonth,
        minutesPerDocument: input.minutesPerDocument,
        hourlyLaborCostEUR: input.hourlyLaborCostEUR,
      });
      return [
        {
          bucket: 'directLoss',
          label: 'Ročno delo',
          valueEUR: result.annualEUR,
          hoursPerMonth: result.hoursFreedPerMonth,
        },
      ];
    },
  };
}

// --- Modul B: napake --------------------------------------------------------

interface ModuleBOptions {
  id: string;
  transactionsQuestion: string;
  errorRateQuestion: string;
  costPerErrorQuestion: string;
  transactionsUnit: string;
  errorRateDefault: number;
}

function makeModuleB({
  id,
  transactionsQuestion,
  errorRateQuestion,
  costPerErrorQuestion,
  transactionsUnit,
  errorRateDefault,
}: ModuleBOptions): ModuleDefinition {
  return {
    id,
    title: 'Napake',
    summary: 'Strošek transakcij, ki gredo narobe.',
    fields: [
      { key: 'transactionsPerMonth', label: transactionsQuestion, kind: 'number', unit: transactionsUnit, default: 0 },
      {
        key: 'errorRatePercent',
        label: errorRateQuestion,
        kind: 'percent',
        min: 0,
        max: 0.1,
        step: 0.001,
        default: errorRateDefault,
      },
      {
        key: 'costPerErrorEUR',
        label: costPerErrorQuestion,
        kind: 'slider',
        min: 5,
        max: 200,
        step: 5,
        unit: 'EUR',
        default: 25,
      },
    ],
    compute: (input) => [
      {
        bucket: 'directLoss',
        label: 'Napake',
        valueEUR: calculateModuleB({
          transactionsPerMonth: input.transactionsPerMonth,
          errorRatePercent: input.errorRatePercent,
          costPerErrorEUR: input.costPerErrorEUR,
        }).annualEUR,
      },
    ],
  };
}

// --- Modul C: vezan kapital v zalogah ---------------------------------------

function makeModuleC(id: string, inventoryQuestion: string, reductionDefault: number): ModuleDefinition {
  return {
    id,
    title: 'Vezan kapital v zalogah',
    summary: 'Denar, ki leži v skladišču, in letni strošek tega kapitala.',
    fields: [
      { key: 'inventoryValueEUR', label: inventoryQuestion, kind: 'number', unit: 'EUR', default: 0 },
      {
        key: 'achievableReductionPercent',
        label: 'Za koliko odstotkov bi realno lahko znižali zaloge?',
        kind: 'percent',
        min: 0.03,
        max: 0.15,
        step: 0.01,
        default: reductionDefault,
      },
      {
        key: 'capitalCostPercent',
        label: 'Kolikšen je strošek kapitala + skladiščenja letno (%)?',
        kind: 'percent',
        min: 0.05,
        max: 0.2,
        step: 0.01,
        default: 0.1,
      },
    ],
    compute: (input) => {
      const result = calculateModuleC({
        inventoryValueEUR: input.inventoryValueEUR,
        achievableReductionPercent: input.achievableReductionPercent,
        capitalCostPercent: input.capitalCostPercent,
      });
      return [
        { bucket: 'directLoss', label: 'Zaloge (letni strošek kapitala)', valueEUR: result.annualEUR },
        { bucket: 'oneTimeCapital', label: 'Sproščen kapital v zalogah', valueEUR: result.releasedCapitalEUR },
      ];
    },
  };
}

// --- Modul D: počasen denarni tok -------------------------------------------

function makeModuleD(id: string, dsoQuestion: string): ModuleDefinition {
  return {
    id,
    title: 'Počasen denarni tok',
    summary: 'Oportunitetni strošek predolgih plačilnih rokov.',
    fields: [
      {
        key: 'annualRevenueEUR',
        label: 'Kolikšni so vaši letni prihodki (EUR)?',
        kind: 'number',
        unit: 'EUR/leto',
        default: 0,
      },
      { key: 'currentDSODays', label: dsoQuestion, kind: 'number', unit: 'dni', default: 0 },
      {
        key: 'targetReductionDays',
        label: 'Za koliko dni bi realno lahko skrajšali plačilni rok?',
        kind: 'slider',
        min: 1,
        max: 30,
        step: 1,
        unit: 'dni',
        default: 5,
      },
      {
        key: 'opportunityCostPercent',
        label: 'Kolikšen je oportunitetni strošek kapitala letno (%)?',
        kind: 'percent',
        min: 0.02,
        max: 0.12,
        step: 0.01,
        default: 0.06,
      },
    ],
    compute: (input) => [
      {
        bucket: 'directLoss',
        label: 'Denarni tok',
        valueEUR: calculateModuleD({
          annualRevenueEUR: input.annualRevenueEUR,
          currentDSODays: input.currentDSODays,
          targetReductionDays: input.targetReductionDays,
          opportunityCostPercent: input.opportunityCostPercent,
        }).annualEUR,
      },
    ],
  };
}

// --- Modul E: tehnološka in regulatorna tveganja ----------------------------

export interface ModuleEChecklistItem {
  key: 'sqlServer2016' | 'windowsServer2016' | 'eInvoiceZierded';
  label: string;
  warningDate: string;
  warningText: string;
}

/** Modul E je vsebinsko enak za vse segmente (spec pogl. 3) — ni segmentne variacije. */
export const MODULE_E_ITEMS: ModuleEChecklistItem[] = [
  {
    key: 'sqlServer2016',
    label: 'Uporabljamo SQL Server 2016',
    warningDate: '2026-07-14',
    warningText: 'Podpora za SQL Server 2016 je potekla 14. 7. 2026 — rok je že mimo.',
  },
  {
    key: 'windowsServer2016',
    label: 'Uporabljamo Windows Server 2016',
    warningDate: '2027-01-12',
    warningText: 'Podpora za Windows Server 2016 se konča 12. 1. 2027.',
  },
  {
    key: 'eInvoiceZierded',
    label: 'Nimamo urejenega kanala za e-račune',
    warningDate: '2028-01-01',
    warningText:
      'Od 1. 1. 2028 velja ZIERDED: brez urejenega e-računa vam kupec preprosto ne bo mogel plačati — globa do 3.000 EUR je ob tem obrobna.',
  },
];

export const moduleE: ModuleDefinition = {
  id: 'E',
  title: 'Tvegani stroški',
  summary: 'Roki, ki vas dohitijo, tudi če danes vse deluje.',
  fields: MODULE_E_ITEMS.map((item) => ({
    key: item.key,
    label: item.label,
    kind: 'checkbox' as const,
    default: 0,
  })),
  compute: (input) =>
    MODULE_E_ITEMS.filter((item) => input[item.key] === 1).map(
      (item): ModuleOutputDraft => ({
        bucket: 'risk',
        label: item.label,
        riskLevel: 'high',
        note: item.warningText,
      }),
    ),
};

// --- Segmentne različice ----------------------------------------------------

export const LEGACY_MODULES: ModuleDefinition[] = [
  makeModuleA({
    id: 'A_trgovina',
    documentsQuestion: 'Koliko naročil/dobavnic ročno obdelate mesečno?',
    minutesQuestion: 'Koliko minut zahteva obdelava enega dokumenta?',
    documentsUnit: 'dokumentov/mesec',
    minutesDefault: 3,
  }),
  // A_racunovodstvo in A/C/D_splosno so odstranjeni: obe dejavnosti imata od tu
  // naprej svojih pet področij (config/modules/racunovodstvo.ts oziroma
  // splosno.ts) in nobenega segmenta ni več, ki bi te module uporabljal.
  // Ohranjeni bi bili mrtvi vnosi v registru.
  //
  // Trgovinski ostanejo: noben segment jih ne uporablja, so pa edina priča
  // migracijskega testa skladnosti (lib/moduleEngine.test.ts → LEGACY_TRGOVINA),
  // ki drži, da se matematika ob prepisu v register ni tiho spremenila.
  makeModuleB({
    id: 'B_trgovina',
    transactionsQuestion: 'Koliko pošiljk/naročil odpremite mesečno?',
    errorRateQuestion: 'Kolikšen delež pošiljk vsebuje napako (%)?',
    costPerErrorQuestion: 'Kolikšen je povprečen strošek ene napačne pošiljke (EUR)?',
    transactionsUnit: 'pošiljk/mesec',
    errorRateDefault: 0.015,
  }),
  makeModuleC('C_trgovina', 'Kolikšna je povprečna vrednost vaših zalog (EUR)?', 0.04),
  makeModuleD('D_trgovina', 'Kolikšen je povprečen dejanski plačilni rok kupcev (dni)?'),
  moduleE,
];
