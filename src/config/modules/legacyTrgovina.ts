import {
  calculateModuleA,
  calculateModuleB,
  calculateModuleC,
  calculateModuleD,
} from '../../lib/calculations';
import type { ModuleDefinition, ModuleField } from './moduleTypes';

/**
 * Zastareli trgovinski moduli A–D — SAMO za migracijski test.
 *
 * A_racunovodstvo in A/C/D_splosno so bili odstranjeni: obe dejavnosti imata svojih
 * pet področij (racunovodstvo.ts oziroma splosno.ts) in noben segment jih ni več
 * uporabljal. Trgovinski so ostali, ker na njih stoji dokaz, da prepis v register
 * ni premaknil nobene številke.
 *
 * compute() namenoma DELEGIRA na funkcije v lib/calculations.ts — matematika se ni
 * spremenila, zato calculations.test.ts z validacijskimi primeri ostane nedotaknjen
 * in še naprej velja.
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

// --- Segmentne različice ----------------------------------------------------

/**
 * Zastareli trgovinski moduli A–D.
 *
 * NISO v registru (config/modules/index.ts) in obiskovalec do njih ne more priti:
 * veleprodaja je že dolgo na svojih petih področjih. Ostajajo kot edina priča
 * migracijskega testa skladnosti (lib/moduleEngine.test.ts), ki drži, da se
 * matematika ob prepisu v register ni tiho spremenila.
 *
 * Ločeni od modula E prav zato, da ta besedila ne potujejo v produkcijski sveženj:
 * dokler so bila v isti datoteki kot živ modul, jih je uvoz registra potegnil s
 * seboj — nekaj kilobajtov vprašanj, ki jih ne vidi nihče.
 */
export const LEGACY_TRGOVINA_MODULES: ModuleDefinition[] = [
  makeModuleA({
    id: 'A_trgovina',
    documentsQuestion: 'Koliko naročil/dobavnic ročno obdelate mesečno?',
    minutesQuestion: 'Koliko minut zahteva obdelava enega dokumenta?',
    documentsUnit: 'dokumentov/mesec',
    minutesDefault: 3,
  }),
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
];
