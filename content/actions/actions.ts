export interface ActionPlanEntry {
  headline: string;
  actions: string[];
}

/**
 * Akcijski načrt po ID-ju modula iz src/config/modules/.
 * Uredništvo vsebine (marketing) lahko besedila spodaj spreminja brez poseganja
 * v logiko izračuna.
 */
export const ACTION_PLANS: Record<string, ActionPlanEntry> = {
  // --- Obstoječi moduli -----------------------------------------------------
  A_trgovina: {
    headline: 'Največji strošek: ročno delo',
    actions: [
      'Vzpostavite en sam kanal za prejem dokumentov (npr. ena e-poštna skrinka ali portal) namesto razpršenih virov.',
      'Določite eno osebo, ki dokumente potrjuje — brez podvajanja pregleda.',
      'Popišite trenutni proces v 5 korakih in odstranite tiste, ki ne dodajajo vrednosti.',
    ],
  },
  B_trgovina: {
    headline: 'Največji strošek: napake',
    actions: [
      'Pripravite checklist pred odpremo za 10 najpogostejših napak.',
      'Uvedite dvojno preverjanje samo za transakcije nad določeno vrednostjo, ne za vse.',
      'Tedensko beležite vzroke napak, da odkrijete ponavljajoči se izvor.',
    ],
  },
  C_trgovina: {
    headline: 'Največji strošek: vezan kapital v zalogah',
    actions: [
      'Uvedite tedenski ABC pregled zalog (A = najvišja vrednost/promet).',
      'Zamrznite nova naročila za C-artikle z nizkim obratom.',
      'Določite mesečni cilj znižanja zalog in ga spremljajte na enem grafu.',
    ],
  },
  D_trgovina: {
    headline: 'Največji strošek: počasen denarni tok',
    actions: [
      'Uvedite avtomatski opomnik 3 dni pred zapadlostjo računa.',
      'Začnite izterjavo najkasneje 7 dni po zapadlosti, brez izjem.',
      'Ponudite popust za predčasno plačilo najvišjim dolžnikom.',
    ],
  },

  // --- Proizvodnja ----------------------------------------------------------
  planiranje: {
    headline: 'Največji strošek: zastoji in spreminjanje plana',
    actions: [
      'Teden dni beležite vsak zastoj z vzrokom (material / informacija / plan) — brez tega ne veste, kateri od treh vas res stane.',
      'Zamrznite proizvodni plan za prvih 48 ur; spremembe uvrščajte šele za tem oknom.',
      'Pred sprostitvijo delovnega naloga preverite razpoložljivost materiala, ne po njej.',
    ],
  },
  material: {
    headline: 'Največji strošek: izmet in dodelave',
    actions: [
      'Za 10 izdelkov z največ izmeta primerjajte dejansko porabo z normativom — običajno je odstopanje sistematično, ne naključno.',
      'Zabeležite vzrok vsake dodelave en mesec; večina jih izvira iz nekaj ponavljajočih se razlogov.',
      'Preverite, ali so sestavnice ažurne — zastarel normativ tiho ustvarja presežno porabo.',
    ],
  },
  zaloge: {
    headline: 'Največji strošek: zaloge in pomanjkanje materiala',
    actions: [
      'Popišite artikle brez prometa v zadnjih 12 mesecih in določite datum za razprodajo ali odpis.',
      'Za 20 najbolj kritičnih materialov določite minimalno zalogo in točko naročanja.',
      'Vsako nujno nabavo zabeležite z vzrokom — pokažejo, kje minimalne zaloge manjkajo.',
    ],
  },
  nalogi: {
    headline: 'Največji strošek: ročno delo z nalogi in poročanjem',
    actions: [
      'Popišite, kje isti podatek vnesete več kot enkrat — to so mesta, kjer nastajajo tudi napake.',
      'Preverite, koliko delovnih nalogov je mogoče ustvariti neposredno iz naročila kupca.',
      'Uvedite sprotno poročanje na eni delovni postaji kot poskus, preden ga razširite.',
    ],
  },
  zamude: {
    headline: 'Največji strošek: zamude in nujni stroški',
    actions: [
      'Za vsako ekspresno dostavo zadnjega meseca zabeležite vzrok — večina jih izvira iz prepoznega naročila, ne iz kupčeve spremembe.',
      'Uvedite tedenski pregled naročil, ki jim grozi zamuda, dokler je še čas za ukrepanje.',
      'Kupca obvestite o zamudi takoj, ko jo predvidite — penali in popusti so pogosto posledica molka, ne zamude same.',
    ],
  },
  marza: {
    headline: 'Največje tveganje: nepoznavanje dejanske marže',
    actions: [
      'Za tri najbolj prodajane izdelke izračunajte dejanski strošek in ga primerjajte s kalkulacijo.',
      'Določite, kdo in kdaj preveri odstopanje med načrtovano in dejansko porabo.',
      'Uvedite pregled marže po delovnem nalogu, ne le po mesecu.',
    ],
  },
  sledljivost: {
    headline: 'Največje tveganje: pomanjkljiva sledljivost',
    actions: [
      'Preizkusite, kako hitro najdete, iz katere dobave materiala je nastal konkreten izdelek.',
      'Popišite postopke, ki jih obvlada samo ena oseba, in določite nadomestnega izvajalca.',
      'Določite, katere serije in lote je treba beležiti obvezno — začnite z izdelki za zahtevne kupce.',
    ],
  },
};

export function getActionPlan(highestModule: string | null): ActionPlanEntry | null {
  if (!highestModule) return null;
  return ACTION_PLANS[highestModule] ?? null;
}
