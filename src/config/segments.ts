import type { ModuleId, SegmentId } from './segmentTypes';

export type { ModuleId, SegmentId };

export interface ModuleDefaultsA {
  documentsPerMonth: number;
  minutesPerDocument: number;
  hourlyLaborCostEUR: number;
}
export interface ModuleDefaultsB {
  transactionsPerMonth: number;
  errorRatePercent: number;
  costPerErrorEUR: number;
}
export interface ModuleDefaultsC {
  inventoryValueEUR: number;
  achievableReductionPercent: number;
  capitalCostPercent: number;
}
export interface ModuleDefaultsD {
  annualRevenueEUR: number;
  currentDSODays: number;
  targetReductionDays: number;
  opportunityCostPercent: number;
}

export interface ModuleEChecklistItem {
  id: 'sqlServer2016' | 'windowsServer2016' | 'eInvoiceZierded';
  label: string;
  warningDate: string;
  warningText: string;
}

interface ModuleLabelsA {
  documentsQuestion: string;
  minutesQuestion: string;
  hourlyCostQuestion: string;
}
interface ModuleLabelsB {
  transactionsQuestion: string;
  errorRateQuestion: string;
  costPerErrorQuestion: string;
}
interface ModuleLabelsC {
  inventoryQuestion: string;
  reductionQuestion: string;
  capitalCostQuestion: string;
}
interface ModuleLabelsD {
  revenueQuestion: string;
  dsoQuestion: string;
  targetReductionQuestion: string;
  opportunityCostQuestion: string;
}

export interface SegmentConfig {
  id: SegmentId;
  displayName: string;
  modulesEnabled: ModuleId[];
  headlineModules: ModuleId[];
  headlineStory: string;
  moduleLabels: {
    A?: ModuleLabelsA;
    B?: ModuleLabelsB;
    C?: ModuleLabelsC;
    D?: ModuleLabelsD;
  };
  defaults: {
    A?: ModuleDefaultsA;
    B?: ModuleDefaultsB;
    C?: ModuleDefaultsC;
    D?: ModuleDefaultsD;
  };
  /** Samo za segment 'racunovodstvo': povprečne ure na stranko/mesec za kapacitetni preračun. */
  accountingCapacity?: {
    avgHoursPerClientPerMonth: number;
  };
  /**
   * Začetna ocena za follow-up kalibracijo (spec pogl. 6) — po prvih 50 vnosih
   * je treba prag preveriti na realnih podatkih. Ni v EUR za računovodstvo (glej spodaj).
   */
  highLossThresholdEUR?: number;
  highLossThresholdHoursPerMonth?: number;
}

export const SEGMENTS: Record<SegmentId, SegmentConfig> = {
  proizvodnja: {
    id: 'proizvodnja',
    displayName: 'Proizvodnja 10–249 zaposlenih',
    modulesEnabled: ['A', 'B', 'C', 'E'],
    headlineModules: ['C'],
    headlineStory: 'Koliko denarja vam leži v skladišču?',
    moduleLabels: {
      A: {
        documentsQuestion: 'Koliko dokumentov (naročila, dobavnice, računi) ročno obdelate mesečno?',
        minutesQuestion: 'Koliko minut ročne obdelave zahteva povprečen dokument?',
        hourlyCostQuestion: 'Kolikšen je polni strošek dela na uro (EUR)?',
      },
      B: {
        transactionsQuestion: 'Koliko transakcij (naročil/pošiljk) obdelate mesečno?',
        errorRateQuestion: 'Kolikšen delež transakcij vsebuje napako (%)?',
        costPerErrorQuestion: 'Kolikšen je povprečen strošek ene napake (EUR)?',
      },
      C: {
        inventoryQuestion: 'Kolikšna je povprečna vrednost vaših zalog (EUR)?',
        reductionQuestion: 'Za koliko odstotkov bi realno lahko znižali zaloge?',
        capitalCostQuestion: 'Kolikšen je strošek kapitala + skladiščenja letno (%)?',
      },
    },
    defaults: {
      A: { documentsPerMonth: 0, minutesPerDocument: 3, hourlyLaborCostEUR: 25 },
      B: { transactionsPerMonth: 0, errorRatePercent: 0.01, costPerErrorEUR: 25 },
      C: { inventoryValueEUR: 0, achievableReductionPercent: 0.05, capitalCostPercent: 0.1 },
    },
    highLossThresholdEUR: 15000,
  },
  trgovina: {
    id: 'trgovina',
    displayName: 'Veleprodaja / logistika',
    modulesEnabled: ['A', 'B', 'C', 'D', 'E'],
    headlineModules: ['B', 'C'],
    headlineStory: 'Koliko vas stane vsaka napačna pošiljka?',
    moduleLabels: {
      A: {
        documentsQuestion: 'Koliko naročil/dobavnic ročno obdelate mesečno?',
        minutesQuestion: 'Koliko minut zahteva obdelava enega dokumenta?',
        hourlyCostQuestion: 'Kolikšen je polni strošek dela na uro (EUR)?',
      },
      B: {
        transactionsQuestion: 'Koliko pošiljk/naročil odpremite mesečno?',
        errorRateQuestion: 'Kolikšen delež pošiljk vsebuje napako (%)?',
        costPerErrorQuestion: 'Kolikšen je povprečen strošek ene napačne pošiljke (EUR)?',
      },
      C: {
        inventoryQuestion: 'Kolikšna je povprečna vrednost vaših zalog (EUR)?',
        reductionQuestion: 'Za koliko odstotkov bi realno lahko znižali zaloge?',
        capitalCostQuestion: 'Kolikšen je strošek kapitala + skladiščenja letno (%)?',
      },
      D: {
        revenueQuestion: 'Kolikšni so vaši letni prihodki (EUR)?',
        dsoQuestion: 'Kolikšen je povprečen dejanski plačilni rok kupcev (dni)?',
        targetReductionQuestion: 'Za koliko dni bi realno lahko skrajšali plačilni rok?',
        opportunityCostQuestion: 'Kolikšen je oportunitetni strošek kapitala letno (%)?',
      },
    },
    defaults: {
      A: { documentsPerMonth: 0, minutesPerDocument: 3, hourlyLaborCostEUR: 25 },
      B: { transactionsPerMonth: 0, errorRatePercent: 0.015, costPerErrorEUR: 25 },
      C: { inventoryValueEUR: 0, achievableReductionPercent: 0.04, capitalCostPercent: 0.1 },
      D: { annualRevenueEUR: 0, currentDSODays: 0, targetReductionDays: 5, opportunityCostPercent: 0.06 },
    },
    highLossThresholdEUR: 20000,
  },
  racunovodstvo: {
    id: 'racunovodstvo',
    displayName: 'Računovodski servis',
    modulesEnabled: ['A', 'E'],
    headlineModules: ['A'],
    headlineStory: 'Koliko novih strank bi lahko sprejeli z isto ekipo?',
    moduleLabels: {
      A: {
        documentsQuestion: 'Koliko dokumentov skupno mesečno prejmete od vseh strank?',
        minutesQuestion: 'Koliko minut ročne obdelave zahteva povprečen dokument?',
        hourlyCostQuestion: 'Kolikšen je polni strošek dela na uro (EUR)?',
      },
    },
    defaults: {
      A: { documentsPerMonth: 0, minutesPerDocument: 3, hourlyLaborCostEUR: 25 },
    },
    accountingCapacity: { avgHoursPerClientPerMonth: 8 },
    highLossThresholdHoursPerMonth: 100,
  },
  splosno: {
    id: 'splosno',
    displayName: 'Direktor / CFO — splošno',
    modulesEnabled: ['A', 'C', 'D', 'E'],
    headlineModules: ['D', 'C'],
    headlineStory: 'Koliko vas stane počasen denar?',
    moduleLabels: {
      A: {
        documentsQuestion: 'Koliko dokumentov ročno obdelate mesečno?',
        minutesQuestion: 'Koliko minut ročne obdelave zahteva povprečen dokument?',
        hourlyCostQuestion: 'Kolikšen je polni strošek dela na uro (EUR)?',
      },
      C: {
        inventoryQuestion: 'Kolikšna je povprečna vrednost zalog (EUR)? (pustite 0, če ni relevantno)',
        reductionQuestion: 'Za koliko odstotkov bi realno lahko znižali zaloge?',
        capitalCostQuestion: 'Kolikšen je strošek kapitala letno (%)?',
      },
      D: {
        revenueQuestion: 'Kolikšni so vaši letni prihodki (EUR)?',
        dsoQuestion: 'Kolikšen je povprečen dejanski plačilni rok (dni)?',
        targetReductionQuestion: 'Za koliko dni bi realno lahko skrajšali plačilni rok?',
        opportunityCostQuestion: 'Kolikšen je oportunitetni strošek kapitala letno (%)?',
      },
    },
    defaults: {
      A: { documentsPerMonth: 0, minutesPerDocument: 3, hourlyLaborCostEUR: 25 },
      C: { inventoryValueEUR: 0, achievableReductionPercent: 0.05, capitalCostPercent: 0.1 },
      D: { annualRevenueEUR: 0, currentDSODays: 0, targetReductionDays: 5, opportunityCostPercent: 0.06 },
    },
    highLossThresholdEUR: 15000,
  },
};

export const SEGMENT_ORDER: SegmentId[] = ['proizvodnja', 'trgovina', 'racunovodstvo', 'splosno'];

// Modul E je vsebinsko enak za vse segmente (spec pogl. 3) — ni segmentne variacije.
export const MODULE_E_ITEMS: ModuleEChecklistItem[] = [
  {
    id: 'sqlServer2016',
    label: 'Uporabljamo SQL Server 2016',
    warningDate: '2026-07-14',
    warningText: 'Podpora za SQL Server 2016 je potekla 14. 7. 2026 — rok je že mimo.',
  },
  {
    id: 'windowsServer2016',
    label: 'Uporabljamo Windows Server 2016',
    warningDate: '2027-01-12',
    warningText: 'Podpora za Windows Server 2016 se konča 12. 1. 2027.',
  },
  {
    id: 'eInvoiceZierded',
    label: 'Nimamo urejenega kanala za e-račune',
    warningDate: '2028-01-01',
    warningText:
      'Od 1. 1. 2028 velja ZIERDED: brez urejenega e-računa vam kupec preprosto ne bo mogel plačati — globa do 3.000 EUR je ob tem obrobna.',
  },
];

export function getSegmentFromUrlParam(param: string | null): SegmentConfig | null {
  if (!param) return null;
  const match = SEGMENT_ORDER.find((id) => id === param);
  return match ? SEGMENTS[match] : null;
}

// FAZA 2 (namerno izven obsega te gradnje):
// - benchmark proti vrstnikom (pravno neopredeljeno, spec §5b)
// - prava CRM/e-mail API integracija (glej lib/exportRecord.ts za ročni izvoz)
// - HR/RS/BA lokalizacija (arhitektura pušča prostor prek besedilnih polj v SegmentConfig,
//   a locale switcher ni zgrajen zdaj)
