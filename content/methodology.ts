export interface ModuleMethodology {
  formula: string;
  rationale: string;
}

/**
 * Razlaga metodologije po ID-ju modula iz src/config/modules/.
 *
 * Urejano brez poseganja v izračunsko logiko — vsak modul ima eno razlagalno poved
 * ("zakaj tako računamo"). Manjkajoč vnos ni napaka: modul se prikaže brez razlage.
 */
export const MODULE_METHODOLOGY: Record<string, ModuleMethodology> = {
  // --- Obstoječi moduli (trgovina, računovodstvo, splošno) -------------------
  A_trgovina: {
    formula: '(dokumenti/mesec × minute/dokument / 60) × EUR/h × 12',
    rationale:
      'Ročno prepisovanje in vnos dokumentov porabi resnične delovne ure — sešteti čez leto dajo realen strošek te dejavnosti.',
  },
  A_racunovodstvo: {
    formula: '(dokumenti/mesec × minute/dokument / 60) × EUR/h × 12',
    rationale:
      'Ročno prepisovanje in vnos dokumentov porabi resnične delovne ure — sešteti čez leto dajo realen strošek te dejavnosti.',
  },
  A_splosno: {
    formula: '(dokumenti/mesec × minute/dokument / 60) × EUR/h × 12',
    rationale:
      'Ročno prepisovanje in vnos dokumentov porabi resnične delovne ure — sešteti čez leto dajo realen strošek te dejavnosti.',
  },
  B_trgovina: {
    formula: 'transakcije/mesec × % napak × strošek ene napake × 12',
    rationale:
      'Vsaka napaka terja ponovno dostavo, popravek ali izgubo zaupanja kupca — strošek je resničen, tudi če ga nihče posebej ne knjiži.',
  },
  C_trgovina: {
    formula: 'sproščen kapital = zaloge × % znižanja; letni prihranek = sproščen kapital × % stroška kapitala',
    rationale:
      'Denar, vezan v presežnih zalogah, vas stane toliko, kolikor bi ta denar zaslužil, če bi bil prost — zato prikazujemo enkraten sproščen kapital in letni prihranek ločeno.',
  },
  C_splosno: {
    formula: 'sproščen kapital = zaloge × % znižanja; letni prihranek = sproščen kapital × % stroška kapitala',
    rationale:
      'Denar, vezan v presežnih zalogah, vas stane toliko, kolikor bi ta denar zaslužil, če bi bil prost — zato prikazujemo enkraten sproščen kapital in letni prihranek ločeno.',
  },
  D_trgovina: {
    formula: '(letni prihodki / 365) × dni skrajšanja plačilnega roka × oportunitetni strošek',
    rationale:
      'Počasnejši plačilni rok pomeni, da je vaš denar dlje na poti, kot bi moral biti — to ima ceno, tudi če noben račun ni izgubljen.',
  },
  D_splosno: {
    formula: '(letni prihodki / 365) × dni skrajšanja plačilnega roka × oportunitetni strošek',
    rationale:
      'Počasnejši plačilni rok pomeni, da je vaš denar dlje na poti, kot bi moral biti — to ima ceno, tudi če noben račun ni izgubljen.',
  },

  // --- Proizvodnja ----------------------------------------------------------
  planiranje: {
    formula:
      'zastoji = ure čakanja × strošek proizvodne ure × 12 × delež; nadure = ure × strošek × 1,3 × 12 × delež',
    rationale:
      'Ure, ko proizvodnja čaka na material ali informacijo, so plačane, a ne ustvarijo ničesar. Šteje samo čakanje zaradi planiranja, materiala ali informacij — okvar strojev ne pripisujemo ERP-ju, delež izboljšave pa izhaja iz tega, kako danes planirate.',
  },
  material: {
    formula: 'izmet = letni material × % izmeta × delež; dodelave = ure × EUR/h × 12 × delež',
    rationale:
      'Ne predpostavljamo, da je mogoče odpraviti ves izmet — upoštevamo samo delež, ki ga je realno mogoče izboljšati z zanesljivimi normativi in evidentiranjem dejanske porabe.',
  },
  zaloge: {
    formula:
      'sproščeno = (surovine + nedokončana + izdelki) × delež znižanja + nekurantne × 0,5; letno = sproščeno × % stroška kapitala + odpisi × delež',
    rationale:
      'Modul meri dva nasprotna problema hkrati: preveč zaloge in premalo pravega materiala. Pogosti zastoji zaradi manjkajočega materiala znižajo delež, za katerega je zaloge realno mogoče zmanjšati — podjetje, ki že zdaj ostaja brez materiala, ne more rezati globoko.',
  },
  nalogi: {
    formula: 'ure = nalogi × min/nalog / 60 + prepisovanje + usklajevanje; vrednost = ure × EUR/h × 12 × delež',
    rationale:
      'Rezultat imenujemo vrednost sproščene kapacitete, ker to običajno ni neposreden prihranek pri plačah — zaposleni ostane, njegov čas pa se preusmeri v delo, ki prinaša vrednost.',
  },
  zamude: {
    formula: '(ekspresne nabave + penali + nadure × 1,3) × 0,35',
    rationale:
      'Štejemo samo neposredne posledice zamud; ure zastojev ostanejo v modulu planiranja, da jih ne bi upoštevali dvakrat. Delež 0,35 je konservativen: tudi z odličnim planiranjem del zamud ostane zaradi dobaviteljev in sprememb kupca.',
  },
  marza: {
    formula: 'ocena tveganja iz kakovosti kalkulacij → pas v % prihodkov',
    rationale:
      'Če podjetje ne pozna dejanskega stroška izdelka in delovnega naloga, natančnega zneska izgubljene marže ni mogoče izračunati — prav to je težava. Zato prikazujemo pas, ne navidezno natančne številke.',
  },
  sledljivost: {
    formula: 'ocena tveganja iz sledljivosti serij, porekla in odvisnosti od posameznikov',
    rationale:
      'Procesnega tveganja se ne da pošteno pretvoriti v evre, dokler se ne uresniči. Prikazujemo ga kot oceno, ker je odgovor na vprašanje "kaj se zgodi ob resni reklamaciji" pomembnejši od izmišljenega zneska.',
  },
};
