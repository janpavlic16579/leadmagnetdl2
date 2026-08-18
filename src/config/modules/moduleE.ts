import type { ModuleDefinition, ModuleOutputDraft } from './moduleTypes';

/**
 * Modul E — tehnološka in regulatorna tveganja.
 *
 * Edini od nekdanjih modulov A–E, ki je še živ: prikaže se obstoječim uporabnikom
 * PANTHEON in ne meri evrov, ampak opozorila. Trgovinski A–D so se preselili v
 * legacyTrgovina.ts, ker jih uporablja le še migracijski test.
 */

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
