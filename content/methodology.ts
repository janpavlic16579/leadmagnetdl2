import type { ModuleKeyForHighest } from '../src/lib/calculations';

export interface ModuleMethodology {
  formula: string;
  rationale: string;
}

// Urejano brez poseganja v izračunsko logiko — vsak modul ima eno razlagalno poved ("zakaj tako računamo").
export const MODULE_METHODOLOGY: Record<ModuleKeyForHighest, ModuleMethodology> = {
  A: {
    formula: '(dokumenti/mesec × minute/dokument / 60) × EUR/h × 12',
    rationale:
      'Ročno prepisovanje in vnos dokumentov porabi resnične delovne ure — sešteti čez leto dajo realen strošek te dejavnosti.',
  },
  B: {
    formula: 'transakcije/mesec × % napak × strošek ene napake × 12',
    rationale:
      'Vsaka napaka terja ponovno dostavo, popravek ali izgubo zaupanja kupca — strošek je resničen, tudi če ga nihče posebej ne knjiži.',
  },
  C: {
    formula: 'sproščen kapital = zaloge × % znižanja; letni prihranek = sproščen kapital × % stroška kapitala',
    rationale:
      'Denar, vezan v presežnih zalogah, vas stane toliko, kolikor bi ta denar zaslužil, če bi bil prost — zato prikazujemo enkraten sproščen kapital in letni prihranek ločeno.',
  },
  D: {
    formula: '(letni prihodki / 365) × dni skrajšanja plačilnega roka × oportunitetni strošek',
    rationale:
      'Počasnejši plačilni rok pomeni, da je vaš denar dlje na poti, kot bi moral biti — to ima ceno, tudi če noben račun ni izgubljen.',
  },
};
