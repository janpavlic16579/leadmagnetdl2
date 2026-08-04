import type { ModuleKeyForHighest } from '../../src/lib/calculations';

export interface ActionPlanEntry {
  module: ModuleKeyForHighest;
  headline: string;
  actions: string[];
}

// Uredništvo vsebine (marketing) lahko besedila spodaj spreminja brez poseganja v logiko izračuna.
export const ACTION_PLANS: Record<ModuleKeyForHighest, ActionPlanEntry> = {
  A: {
    module: 'A',
    headline: 'Največji strošek: ročno delo',
    actions: [
      'Vzpostavite en sam kanal za prejem dokumentov (npr. ena e-poštna skrinka ali portal) namesto razpršenih virov.',
      'Določite eno osebo, ki dokumente potrjuje — brez podvajanja pregleda.',
      'Popišite trenutni proces v 5 korakih in odstranite tiste, ki ne dodajajo vrednosti.',
    ],
  },
  B: {
    module: 'B',
    headline: 'Največji strošek: napake',
    actions: [
      'Pripravite checklist pred odpremo za 10 najpogostejših napak.',
      'Uvedite dvojno preverjanje samo za transakcije nad določeno vrednostjo, ne za vse.',
      'Tedensko beležite vzroke napak, da odkrijete ponavljajoči se izvor.',
    ],
  },
  C: {
    module: 'C',
    headline: 'Največji strošek: vezan kapital v zalogah',
    actions: [
      'Uvedite tedenski ABC pregled zalog (A = najvišja vrednost/promet).',
      'Zamrznite nova naročila za C-artikle z nizkim obratom.',
      'Določite mesečni cilj znižanja zalog in ga spremljajte na enem grafu.',
    ],
  },
  D: {
    module: 'D',
    headline: 'Največji strošek: počasen denarni tok',
    actions: [
      'Uvedite avtomatski opomnik 3 dni pred zapadlostjo računa.',
      'Začnite izterjavo najkasneje 7 dni po zapadlosti, brez izjem.',
      'Ponudite popust za predčasno plačilo najvišjim dolžnikom.',
    ],
  },
};

export function getActionPlan(highestModule: ModuleKeyForHighest | null): ActionPlanEntry | null {
  if (!highestModule) return null;
  return ACTION_PLANS[highestModule];
}
