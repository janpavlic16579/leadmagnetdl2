import { addressableShareOf, mainCauseField, type CauseOption } from './addressableShare';
import {
  ASSURANCE_CHOICES,
  MONTHS_PER_YEAR,
  reducibleShareField,
  reducibleShareOf,
  riskLevelFromScore,
} from './shared';
import type { ModuleDefinition, RiskLevel } from './moduleTypes';

/**
 * Pet medsebojno izključujočih se stroškovnih področij za maloprodajo.
 *
 * Zgrajeno po istem vzorcu kot proizvodnja — z istima načeloma, ki ju je treba
 * ohraniti ob vsaki spremembi:
 *
 * 1. compute() vrne DEJANSKI sedanji strošek — brez množenja z "deležem izboljšave".
 *    Koliko od tega je realno mogoče nasloviti, izračuna motor iz naslovljivega
 *    deleža (glavni vzrok) in pasu izboljšave (sedanji sistem podjetja).
 *
 * 2. Ista ura ali evro se ne sme pojaviti v dveh področjih. Meje so zapisane v
 *    besedilih help, ne le v komentarjih — obiskovalec je edini, ki jih lahko
 *    upošteva pri vnosu.
 *
 * Najostrejša meja v maloprodaji je med ZNANO in NEZNANO izgubo blaga:
 * odpisano, poteklo in prisilno znižano blago je področje Zaloge (vemo, kaj se je
 * zgodilo), inventurni manko pa področje Blagajna (ne vemo). Trgovec obe številki
 * pozna ločeno, v enem znesku pa bi bila razlika izgubljena — z njo pa tudi vsak
 * ukrep, ki iz nje sledi.
 *
 * Strošek ure v poslovalnici in administrativne ure prideta iz konteksta: sta
 * lastnost podjetja, ne področja, in se vprašata enkrat v svojem koraku.
 */

// --- 1. Zaloge, police in odpisi --------------------------------------------

const ZALOGE_CAUSES: CauseOption[] = [
  { label: 'Naročamo po oceni, ne po podatkih o prodaji', category: 'planning' },
  { label: 'Stanje zalog v sistemu ni zanesljivo', category: 'data' },
  { label: 'Podatki o artiklih in dobavnih rokih niso ažurni', category: 'data' },
  { label: 'Dobavitelji so nezanesljivi', category: 'external' },
  { label: 'Zalogo zavestno držimo kot varovalko', category: 'people' },
];

export const zalogeMp: ModuleDefinition = {
  id: 'zalogeMp',
  title: 'Zaloge, police in odpisi',
  summary:
    'Izgubljena marža zaradi praznih polic, odpisi in prisilna znižanja ter kapital, vezan v zalogah.',
  triage: {
    prompt:
      'Kako pogosto se zgodi, da artikla ni na polici, hkrati pa imate na zalogi blago, ki se ne prodaja?',
    options: [
      { value: 0, label: 'Zaloge so pod nadzorom' },
      { value: 1, label: 'Občasno' },
      { value: 2, label: 'Redno' },
      { value: 3, label: 'Skoraj vsak teden' },
    ],
  },
  fields: [
    {
      key: 'inventoryValueEUR',
      label: 'Kolikšna je povprečna vrednost zalog v vseh poslovalnicah in skladišču?',
      kind: 'number',
      unit: 'EUR',
      default: 0,
      help: 'Vnesite nabavno vrednost, ne prodajne.',
    },
    {
      key: 'annualWriteOffEUR',
      label:
        'Kolikšna je bila v zadnjih 12 mesecih vrednost odpisov, poteklega blaga in prisilnih znižanj zaradi sezone ali zastaranja?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      help: 'Sem sodi samo ZNANA izguba. Neznano razliko, ki jo ugotovite šele ob inventuri, vpišite v področju Blagajna — sicer bo ista izguba šteta dvakrat.',
    },
    {
      key: 'stockoutLostMarginEUR',
      label: 'Kolikšno prispevno maržo letno izgubite, ker artikla ni na zalogi?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      help: 'Vpišite izgubljeno maržo, ne celotne prodajne vrednosti nerealizirane prodaje.',
    },
    reducibleShareField(
      'Kolikšen delež zalog bi po vaši oceni lahko zmanjšali, ne da bi se police spraznile?',
    ),
    {
      key: 'replenishmentMethod',
      label: 'Kako danes določate, kaj in koliko naročiti?',
      kind: 'choice',
      default: 2,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Samodejni predlog naročila iz sistema' },
        { value: 1, label: 'Predlog sistema, ki ga večinoma ročno popravimo' },
        { value: 2, label: 'Excel in izkušnje' },
        { value: 3, label: 'Na oko, v poslovalnici' },
      ],
    },
    mainCauseField(ZALOGE_CAUSES),
  ],
  compute: (input) => {
    const addressableShare = addressableShareOf(ZALOGE_CAUSES, input.mainCause);
    const reducibleShare = reducibleShareOf(input.reducibleShare);

    return [
      {
        bucket: 'directLoss',
        label: 'Odpisi in prisilna znižanja',
        valueEUR: input.annualWriteOffEUR,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Izgubljena marža zaradi praznih polic',
        valueEUR: input.stockoutLostMarginEUR,
        addressableShare,
      },
      {
        // Brez addressableShare: ta znesek JE potencial, ne sedanji strošek.
        // Množenje s pasom izboljšave bi ga štelo dvakrat.
        bucket: 'oneTimeCapital',
        label: 'Sprostljiv obratni kapital v zalogah',
        valueEUR: input.inventoryValueEUR * reducibleShare,
      },
    ];
  },
  pantheon: [
    'Samodejni predlogi naročil iz dejanske prodaje',
    'Minimalne in maksimalne zaloge po poslovalnici',
    'Analiza obračanja zalog in artiklov brez prometa',
  ],
};

// --- 2. Nabavne cene, akcije in marža ---------------------------------------

const MARZE_CAUSES: CauseOption[] = [
  { label: 'Cenike in akcije vzdržujemo ročno', category: 'data' },
  { label: 'Dobaviteljski pogoji niso zapisani na enem mestu', category: 'data' },
  { label: 'Marže po artiklu ne spremljamo sproti', category: 'planning' },
  { label: 'Napake pri vnosu cen ali na blagajni', category: 'people' },
  { label: 'Dobavitelji cene spreminjajo brez najave', category: 'external' },
];

export const marzeMp: ModuleDefinition = {
  id: 'marzeMp',
  title: 'Nabavne cene, akcije in marža',
  summary:
    'Neizkoriščeni dobaviteljski pogoji, prodaja po napačni ceni in ročno vzdrževanje cenikov ter akcij.',
  triage: {
    prompt:
      'Kako pogosto ugotovite, da je bil artikel prodan po napačni ceni ali da dogovorjen dobaviteljski pogoj ni bil izkoriščen?',
    options: [
      { value: 0, label: 'Cene in pogoji so pod nadzorom' },
      { value: 1, label: 'Občasno' },
      { value: 2, label: 'Redno' },
      { value: 3, label: 'Stalno — obsega pa ne poznamo' },
    ],
  },
  fields: [
    {
      key: 'annualPurchaseSpendEUR',
      label: 'Kolikšna je letna nabavna vrednost prodanega blaga?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
    },
    {
      key: 'priceErrorSharePercent',
      label:
        'Kolikšen delež te vrednosti po vaši oceni izgubite zaradi zastarelih prodajnih cen in nepravilno obračunanih akcij?',
      kind: 'percent',
      min: 0,
      max: 0.05,
      step: 0.0025,
      default: 0.01,
    },
    {
      key: 'unclaimedRebatesEUR',
      label: 'Kolikšno vrednost dobaviteljskih rabatov in bonusov letno ne uveljavite ali je ne znate preveriti?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      help: 'Če vrednosti ne poznate, pustite 0 — nižja zanesljivost rezultata je boljša od izmišljene številke.',
    },
    {
      key: 'priceMaintenanceHoursPerMonth',
      label: 'Koliko skupnih ur mesečno porabite za vzdrževanje cenikov, akcij, etiket in oznak na policah?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Ne vključujte prevzema blaga in usklajevanja dokumentov — to meri področje Prevzem.',
    },
    {
      key: 'marginVisibility',
      label: 'Kako dober je vaš pregled nad dejansko maržo?',
      kind: 'choice',
      default: 2,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Sproten, po artiklu in poslovalnici' },
        { value: 1, label: 'Mesečno, na ravni blagovne skupine' },
        { value: 2, label: 'Le skupno za podjetje' },
        { value: 3, label: 'Šele ob zaključku leta' },
      ],
    },
    mainCauseField(MARZE_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(MARZE_CAUSES, input.mainCause);

    return [
      {
        bucket: 'directLoss',
        label: 'Izgubljena marža zaradi napačnih cen in akcij',
        valueEUR: input.annualPurchaseSpendEUR * input.priceErrorSharePercent,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Neizkoriščeni dobaviteljski rabati in bonusi',
        valueEUR: input.unclaimedRebatesEUR,
        addressableShare,
      },
      {
        // Vzdrževanje cenikov je že plačan čas vodij — sproščene ure ne znižajo
        // plačne mase, zato so kapaciteta in ne denar, ki odteka.
        bucket: 'capacity',
        label: 'Vzdrževanje cenikov, akcij in oznak',
        valueEUR: input.priceMaintenanceHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.priceMaintenanceHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Cenik, akcije in popusti na enem mestu za vse poslovalnice',
    'Nabavni pogoji, rabati in bonusi po dobavitelju',
    'Analitika marže po artiklu, poslovalnici in obdobju',
  ],
};

// --- 3. Blagajna, manko in vračila ------------------------------------------

const MANKO_CAUSES: CauseOption[] = [
  { label: 'Prevzem in odpis nista evidentirana sproti', category: 'data' },
  { label: 'Zaloga v sistemu se ne ujema z dejansko', category: 'data' },
  { label: 'Napake pri delu na blagajni', category: 'people' },
  { label: 'Kraja kupcev ali zunanjih oseb', category: 'external' },
  { label: 'Poškodbe blaga pri rokovanju ali skladiščenju', category: 'physical' },
];

export const mankoMp: ModuleDefinition = {
  id: 'mankoMp',
  title: 'Blagajna, manko in vračila',
  summary:
    'Neznane inventurne razlike, vračila in blagajniške napake ter čas, ki gre za njihovo razčiščevanje.',
  triage: {
    prompt: 'Kolikšne so razlike med sistemom in dejanskim stanjem, ki jih ugotovite šele ob inventuri?',
    options: [
      { value: 0, label: 'Razlike so zanemarljive' },
      { value: 1, label: 'Manjše, a jih poznamo' },
      { value: 2, label: 'Opazne' },
      { value: 3, label: 'Velike ali jih sploh ne merimo' },
    ],
  },
  fields: [
    {
      key: 'annualRetailRevenueEUR',
      label: 'Kolikšen je letni prihodek maloprodaje?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
    },
    {
      key: 'shrinkageSharePercent',
      label: 'Kolikšen delež prihodka je znašala zadnja ugotovljena inventurna razlika (manko)?',
      kind: 'percent',
      min: 0,
      max: 0.05,
      step: 0.0025,
      default: 0.01,
      help: 'Samo NEZNANA razlika. Znano odpisano, poteklo ali znižano blago sodi v področje Zaloge.',
    },
    {
      key: 'annualReturnsCostEUR',
      label: 'Kolikšni so letni neposredni stroški vračil, reklamacij in napačno obračunanih računov?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      help: 'Vnesite samo stroške, ki še niso zajeti v manku.',
    },
    {
      key: 'cashDeskFixHoursPerMonth',
      label: 'Koliko skupnih ur mesečno porabite za razčiščevanje blagajniških razlik, storniranih računov in vračil?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'stocktakeMethod',
      label: 'Kako izvajate inventuro?',
      kind: 'choice',
      default: 2,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Sproti po skupinah, s terminali' },
        { value: 1, label: 'Enkrat letno, s terminali' },
        { value: 2, label: 'Enkrat letno, ročno z listi' },
        { value: 3, label: 'Redne inventure praktično ne izvajamo' },
      ],
    },
    mainCauseField(MANKO_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(MANKO_CAUSES, input.mainCause);

    return [
      {
        bucket: 'directLoss',
        label: 'Inventurni manko',
        valueEUR: input.annualRetailRevenueEUR * input.shrinkageSharePercent,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Vračila, reklamacije in blagajniške napake',
        valueEUR: input.annualReturnsCostEUR,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Razčiščevanje razlik in vračil',
        valueEUR: input.cashDeskFixHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.cashDeskFixHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Blagajna POS z davčnim potrjevanjem in sledenjem storniranj',
    'Inventura s terminali, tudi sprotna po skupinah',
    'Sledljivost gibanja artikla od prevzema do računa',
  ],
};

// --- 4. Prevzem blaga, dokumenti in prenosi ---------------------------------

const PREVZEM_CAUSES: CauseOption[] = [
  { label: 'Podatke vodimo v več različnih orodjih', category: 'data' },
  { label: 'Prevzem se ne opravi sproti', category: 'data' },
  { label: 'Prenosi med enotami niso dosledno evidentirani', category: 'data' },
  { label: 'Odgovornosti niso jasne', category: 'people' },
  { label: 'Dobavitelji dokumentov ne pošiljajo elektronsko', category: 'external' },
];

export const prevzemMp: ModuleDefinition = {
  id: 'prevzemMp',
  title: 'Prevzem blaga, dokumenti in prenosi',
  summary:
    'Prevzem dobav, usklajevanje dobavnic in računov ter prenosi blaga med poslovalnicami in skladiščem.',
  triage: {
    prompt: 'Koliko ročnega dela imate s prevzemom blaga, dokumenti dobaviteljev in prenosi med enotami?',
    options: [
      { value: 0, label: 'Večina poteka elektronsko' },
      { value: 1, label: 'Nekaj ur tedensko' },
      { value: 2, label: 'Vsak dan' },
      { value: 3, label: 'Za to je potreben skoraj cel človek' },
    ],
  },
  fields: [
    {
      key: 'goodsReceiptHoursPerMonth',
      label: 'Koliko skupnih ur mesečno porabite za prevzem blaga in vnos dobaviteljskih dokumentov?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'documentMatchingHoursPerMonth',
      label: 'Koliko ur mesečno porabite za usklajevanje dobavnic, računov in cen z dobavitelji?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Ne vključujte samega prevzema iz prvega vprašanja.',
    },
    {
      key: 'transferHoursPerMonth',
      label:
        'Koliko ur mesečno porabite za prenose blaga med poslovalnicami in skladiščem ter za usklajevanje razlik pri prenosih?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Šteje samo administrativni del prenosa, ne prevoza.',
    },
    {
      key: 'receiptMethod',
      label: 'Kako prevzemate blago?',
      kind: 'choice',
      default: 2,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Elektronski dokument dobavitelja neposredno v sistem' },
        { value: 1, label: 'Skeniranje s terminalom, dokument ročno' },
        { value: 2, label: 'Ročni vnos iz papirne dobavnice' },
        { value: 3, label: 'Prevzem naknadno, včasih šele po prodaji' },
      ],
    },
    mainCauseField(PREVZEM_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(PREVZEM_CAUSES, input.mainCause);

    // Tri ločene postavke namesto ene vsote: razčlenitev pokaže, kje ročno delo
    // dejansko nastaja, in obiskovalec vidi, da vprašanja niso podvojena.
    // Prevzem in prenosi so delo v poslovalnici, usklajevanje dokumentov pa
    // pisarniško — zato dve različni urni postavki, ne ena povprečna.
    return [
      {
        bucket: 'capacity',
        label: 'Prevzem blaga in vnos dokumentov',
        valueEUR: input.goodsReceiptHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.goodsReceiptHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Usklajevanje dokumentov z dobavitelji',
        valueEUR: input.documentMatchingHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.documentMatchingHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Prenosi med poslovalnicami in skladiščem',
        valueEUR: input.transferHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.transferHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Elektronski prevzem dobaviteljevega dokumenta (eSLOG)',
    'Terminali za prevzem in kontrolo dobave',
    'Medskladiščni prenosi z evidenco razlik',
  ],
};

// --- 5. Spletna prodaja in usklajenost kanalov ------------------------------

const KANALI_CAUSES: CauseOption[] = [
  { label: 'Artikle in cene vzdržujemo ločeno za vsak kanal', category: 'data' },
  { label: 'Zaloga za splet ni sproti vidna', category: 'planning' },
  { label: 'Prenos naročil med sistemoma je ročen', category: 'data' },
  { label: 'Za spletno prodajo ni izrecno zadolžen nihče', category: 'people' },
  { label: 'Omejitve ponudnika spletne trgovine', category: 'external' },
];

export const kanaliMp: ModuleDefinition = {
  id: 'kanaliMp',
  title: 'Spletna prodaja in usklajenost kanalov',
  summary:
    'Odpovedana spletna naročila ter ročno usklajevanje artiklov, cen in zalog med spletno trgovino in poslovalnicami.',
  triage: {
    prompt: 'Kako pogosto se spletna trgovina in poslovalnice razhajajo v zalogah, cenah ali podatkih o artiklih?',
    options: [
      { value: 0, label: 'Spletne prodaje nimamo ali je usklajena sproti' },
      { value: 1, label: 'Občasno' },
      { value: 2, label: 'Redno' },
      { value: 3, label: 'Vsak dan — usklajujemo ročno' },
    ],
  },
  fields: [
    {
      key: 'onlineOrdersPerMonth',
      label: 'Koliko spletnih naročil mesečno prejmete?',
      kind: 'number',
      unit: 'naročil/mesec',
      default: 0,
      contextOnly: true,
      help: 'Podatek ne vstopa v izračun — služi za oceno obsega.',
    },
    {
      key: 'cancelledOrderMarginEUR',
      label: 'Kolikšno prispevno maržo letno izgubite zaradi odpovedanih ali nedobavljivih spletnih naročil?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      help: 'Ne vpisujte celotne vrednosti naročila. Izgubljeno prodajo v poslovalnici šteje področje Zaloge.',
    },
    {
      key: 'catalogSyncHoursPerMonth',
      label: 'Koliko ur mesečno porabite za ročno usklajevanje artiklov, opisov, cen in zalog med kanali?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Vzdrževanje cenikov za poslovalnice šteje področje Cene — tu samo delo, ki nastane zaradi drugega kanala.',
    },
    {
      key: 'orderProcessingHoursPerMonth',
      label: 'Koliko skupnih ur mesečno porabite za ročno obdelavo spletnih naročil, pripravo in odpremne dokumente?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    mainCauseField(KANALI_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(KANALI_CAUSES, input.mainCause);

    return [
      {
        bucket: 'directLoss',
        label: 'Izgubljena marža odpovedanih spletnih naročil',
        valueEUR: input.cancelledOrderMarginEUR,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Usklajevanje artiklov, cen in zalog med kanali',
        valueEUR: input.catalogSyncHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.catalogSyncHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Ročna obdelava spletnih naročil',
        valueEUR: input.orderProcessingHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.orderProcessingHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Enotna baza artiklov in cenikov za vse prodajne kanale',
    'Sprotna zaloga, vidna spletni trgovini',
    'Samodejen prenos spletnih naročil v odpremo in račun',
  ],
};

// --- Kratka diagnostika -----------------------------------------------------

const DATA_RISK_NOTE: Record<RiskLevel, string> = {
  low: 'Zaloga v sistemu se ujema z dejansko, maržo poznate po artiklu in poslovalnici. Odstopanje opazite, ko ga je še mogoče popraviti.',
  medium:
    'Podatki so delni. Odstopanje praviloma opazite šele ob inventuri ali mesečnem obračunu, ko naročil in cen ni več mogoče popraviti.',
  high: 'Dejanske zaloge in dejanske marže po artiklu ne poznate. Dokler je tako, natančnega zneska izgube ni mogoče izračunati — in prav to je težava.',
};

const PROCESS_RISK_NOTE: Record<RiskLevel, string> = {
  low: 'Sledljivost blaga je urejena in poslovalnica ni odvisna od posameznika.',
  medium: 'Sledljivost je delna. Ob odpoklicu dobavitelja ali resnejši reklamaciji je obseg težko omejiti.',
  high: 'Sledljivosti praktično ni, znanje pa je v glavah posameznikov. En odpoklic ali odsotnost ključne osebe lahko ustavi poslovalnico.',
};

/**
 * Štiri vprašanja, ki se prikažejo vedno in NE prispevajo nobenega evra.
 *
 * Namenoma brez zneska: kjer trgovec ne pozna dejanske zaloge ali marže, natančnega
 * zneska ni mogoče izračunati, navidezno natančna številka pa bi prav to težavo
 * skrila. Modul zato nima triaže in ne more biti "največja postavka".
 */
export const diagnostikaMp: ModuleDefinition = {
  id: 'diagnostikaMp',
  title: 'Kratka diagnostika',
  summary: 'Štiri vprašanja o podatkih in odpornosti procesa. Ne prispevajo k finančnemu rezultatu.',
  fields: [
    {
      key: 'stockAccuracy',
      label: 'Ali se zaloga v sistemu ujema z dejansko zalogo na polici?',
      kind: 'choice',
      default: 1,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'knowsItemMargin',
      label: 'Ali poznate dejansko maržo po posameznem artiklu in poslovalnici?',
      kind: 'choice',
      default: 1,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'goodsTraceability',
      label: 'Ali lahko za posamezen artikel zanesljivo ugotovite dobavitelja, serijo in rok uporabnosti?',
      kind: 'choice',
      default: 2,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'keyPersonIndependence',
      label: 'Ali poslovalnica deluje normalno tudi brez ključne osebe?',
      kind: 'choice',
      default: 1,
      choices: ASSURANCE_CHOICES,
    },
  ],
  compute: (input) => {
    const dataLevel = riskLevelFromScore(input.stockAccuracy + input.knowsItemMargin, 6);
    const processLevel = riskLevelFromScore(input.goodsTraceability + input.keyPersonIndependence, 6);

    return [
      {
        bucket: 'risk',
        label: 'Zanesljivost podatkov',
        riskLevel: dataLevel,
        note: DATA_RISK_NOTE[dataLevel],
      },
      {
        bucket: 'risk',
        label: 'Procesna odpornost',
        riskLevel: processLevel,
        note: PROCESS_RISK_NOTE[processLevel],
      },
    ];
  },
  pantheon: [
    'Sprotna zaloga in marža po artiklu ter poslovalnici',
    'Serije, loti in roki uporabnosti s popolno sledljivostjo',
    'Dokumentiran proces namesto znanja v glavah',
  ],
};

/** Vrstni red je hkrati prioriteta — odloči ob izenačenju v triaži. */
export const MALOPRODAJA_MODULES: ModuleDefinition[] = [
  zalogeMp,
  marzeMp,
  mankoMp,
  prevzemMp,
  kanaliMp,
  diagnostikaMp,
];
