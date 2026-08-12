import { addressableShareOf, mainCauseField, type CauseOption } from './addressableShare';
import type { ModuleDefinition, RiskLevel } from './moduleTypes';
import {
  ASSURANCE_CHOICES,
  MONTHS_PER_YEAR,
  reducibleShareField,
  reducibleShareOf,
  riskLevelFromScore,
} from './shared';

/**
 * Pet stroškovnih področij za podjetje, ki ne sodi v nobeno specifično dejavnost.
 *
 * Zgrajeno po istih dveh načelih kot ostale dejavnosti (glej proizvodnja.ts):
 * compute() vrne dejanski sedanji strošek, in ista ura se ne sme pojaviti v dveh
 * področjih.
 *
 * Tretje načelo je značilno samo tu: nobeno vprašanje ne sme predpostaviti, KAJ
 * podjetje počne. Do teh vprašanj pride le obiskovalec, ki je izbral "Drugo" in
 * nato zavrnil vse štiri ponujene poslovne modele (config/industries.ts) — torej
 * holding, zavod ali mešano podjetje. Vprašanje o izmetu, praznih kilometrih ali
 * nezaračunanih urah bi mu merilo nekaj, česar nima.
 *
 * Zato so področja izbrana tako, da jih ima vsako podjetje: podatki, usklajevanje,
 * napake, denar in zaloge. Kjer področje vseeno ne velja (podjetje brez zalog),
 * ga reši TRIAŽA — obiskovalec ga oceni z 0 in se sploh ne vpraša. Vnaprejšnje
 * ugibanje, katero področje je relevantno, zato ni potrebno.
 *
 * CENA UNIVERZALNOSTI: izmerjena osnova je nujno manj popolna kot pri panožnem
 * vprašalniku. To ni skrito v izračunu, ampak v pasovih izboljšave — ti so za ta
 * segment ožji (config/contexts/splosno.ts).
 */

// --- 1. Ročno delo s podatki in dokumenti -----------------------------------

const PODATKI_CAUSES: CauseOption[] = [
  { label: 'Podatke vodimo v več ločenih orodjih', category: 'data' },
  { label: 'Isti podatek vnašamo večkrat', category: 'data' },
  { label: 'Poročila sestavljamo ročno v preglednicah', category: 'data' },
  { label: 'Dokumenti prihajajo v papirni ali slikovni obliki', category: 'external' },
  { label: 'Odgovornosti za podatke niso jasne', category: 'people' },
];

export const podatkiSp: ModuleDefinition = {
  id: 'podatkiSp',
  title: 'Ročno delo s podatki in dokumenti',
  summary: 'Vnašanje in prepisovanje podatkov, popravljanje napak v njih ter ročna priprava poročil.',
  triage: {
    prompt: 'Koliko dela pri vas pomeni ročno vnašanje, prepisovanje in urejanje podatkov?',
    options: [
      { value: 0, label: 'Večina poteka samodejno' },
      { value: 1, label: 'Nekaj ur tedensko' },
      { value: 2, label: 'Vsak dan' },
      { value: 3, label: 'Za to je potreben skoraj cel človek' },
    ],
  },
  fields: [
    {
      key: 'entryHoursPerMonth',
      label: 'Koliko skupnih ur mesečno porabite za ročno vnašanje in prepisovanje podatkov med orodji?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Iskanje podatkov, ki jih ne najdete, sem ne sodi — to meri področje Iskanje informacij.',
    },
    {
      key: 'dataFixHoursPerMonth',
      label: 'Koliko ur mesečno porabite za popravljanje napačnih, manjkajočih ali neusklajenih podatkov?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Popravljanje PODATKA, ne popravljanje izdelka ali storitve — to meri področje Napake.',
    },
    {
      key: 'reportingHoursPerMonth',
      label: 'Koliko ur mesečno porabite za ročno sestavljanje poročil in preglednic za vodstvo?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'toolCount',
      label: 'V koliko ločenih orodjih vodite ključne poslovne podatke?',
      kind: 'choice',
      default: 2,
      contextOnly: true,
      choices: [
        { value: 0, label: 'V enem' },
        { value: 1, label: 'V dveh' },
        { value: 2, label: 'V treh ali štirih' },
        { value: 3, label: 'V več kot štirih' },
      ],
    },
    mainCauseField(PODATKI_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(PODATKI_CAUSES, input.mainCause);
    const rate = context.adminHourCostEUR;

    // Tri ločene postavke namesto ene vsote: razčlenitev pokaže, kje ročno delo
    // dejansko nastaja, in obiskovalec vidi, da vprašanja niso podvojena.
    return [
      {
        bucket: 'capacity',
        label: 'Vnašanje in prepisovanje podatkov',
        valueEUR: input.entryHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.entryHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Popravljanje napačnih podatkov',
        valueEUR: input.dataFixHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.dataFixHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Ročna priprava poročil',
        valueEUR: input.reportingHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.reportingHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Enoten vir podatkov namesto Excela ob poslovnem programu',
    'Poročila, ki se osvežijo sama, brez ročnega sestavljanja',
    'Dokumenti in knjižbe brez ponovnega vnosa',
  ],
};

// --- 2. Iskanje informacij in usklajevanje ----------------------------------

const USKLAJEVANJE_CAUSES: CauseOption[] = [
  { label: 'Podatki niso na enem mestu', category: 'data' },
  { label: 'Statusi in napredek niso vidni sproti', category: 'planning' },
  { label: 'Odločitve se sprejemajo počasi', category: 'people' },
  { label: 'Prioritete niso jasno postavljene', category: 'planning' },
  { label: 'Čakamo na zunanje partnerje ali stranke', category: 'external' },
];

export const usklajevanjeSp: ModuleDefinition = {
  id: 'usklajevanjeSp',
  title: 'Iskanje informacij in usklajevanje',
  summary: 'Čakanje na odločitve in informacije, iskanje pravih številk ter statusna vprašanja med oddelki.',
  triage: {
    prompt: 'Kako pogosto delo zastane, ker informacije ali odločitve ni pravočasno?',
    options: [
      { value: 0, label: 'Redko — informacije so dostopne' },
      { value: 1, label: 'Občasno' },
      { value: 2, label: 'Redno, z vplivom' },
      { value: 3, label: 'Skoraj vsak dan' },
    ],
  },
  fields: [
    {
      key: 'waitingHoursPerMonth',
      label: 'Koliko skupnih ur mesečno delo stoji, ker čakate na odločitev, potrditev ali informacijo?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Čakanje na plačilo kupca sem ne sodi — to meri področje Plačilni roki in terjatve.',
    },
    {
      key: 'searchHoursPerMonth',
      label: 'Koliko ur mesečno porabite za iskanje dokumentov, podatkov in pravih številk?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Iskanje podatka, ne vnašanje ali popravljanje — to meri področje Ročno delo s podatki.',
    },
    {
      key: 'statusHoursPerMonth',
      label: 'Koliko ur mesečno gre za statusna vprašanja, usklajevanje med oddelki in sestanke brez izida?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'infoAccess',
      label: 'Kako pridete do ključnih poslovnih številk?',
      kind: 'choice',
      default: 2,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Sproti, iz sistema' },
        { value: 1, label: 'Isti dan, z nekaj klici' },
        { value: 2, label: 'Nekdo jih mora pripraviti' },
        { value: 3, label: 'Šele ob mesečnem obračunu' },
      ],
    },
    mainCauseField(USKLAJEVANJE_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(USKLAJEVANJE_CAUSES, input.mainCause);

    return [
      {
        // Zastoj zadene tistega, ki dela — zato neposredna ura.
        bucket: 'capacity',
        label: 'Zastoji zaradi manjkajočih odločitev in informacij',
        valueEUR: input.waitingHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.waitingHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Iskanje informacij in dokumentov',
        valueEUR: input.searchHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.searchHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Statusna vprašanja in usklajevanje',
        valueEUR: input.statusHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.statusHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Statusi dokumentov in naročil, vidni sproti',
    'Ključne številke na enem mestu, brez klicanja po oddelkih',
    'Zgodovina dokumentov po stranki, artiklu in projektu',
  ],
};

// --- 3. Napake in ponovno delo ----------------------------------------------

const NAPAKE_CAUSES: CauseOption[] = [
  { label: 'Podatki ali dokumentacija so napačni oziroma zastareli', category: 'data' },
  { label: 'Prenos informacij med koraki je ročen', category: 'data' },
  { label: 'Ni sprotne kontrole, napako opazimo pozno', category: 'planning' },
  { label: 'Usposobljenost oziroma menjava ljudi', category: 'people' },
  { label: 'Napake dobaviteljev ali partnerjev', category: 'external' },
];

export const napakeSp: ModuleDefinition = {
  id: 'napakeSp',
  title: 'Napake in ponovno delo',
  summary: 'Ure, porabljene za popravljanje že opravljenega dela, ter reklamacije in dobropisi zaradi lastnih napak.',
  triage: {
    prompt: 'Kako pogosto je treba delo, ki je bilo že opravljeno, popraviti ali ponoviti?',
    options: [
      { value: 0, label: 'Redko' },
      { value: 1, label: 'Mesečno' },
      { value: 2, label: 'Tedensko' },
      { value: 3, label: 'Stalno' },
    ],
  },
  fields: [
    {
      key: 'reworkHoursPerMonth',
      label: 'Koliko skupnih ur mesečno porabite za popravljanje ali ponavljanje že opravljenega dela?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Popravljanje izdelka, storitve ali posla. Popravljanje samih podatkov meri področje Ročno delo s podatki.',
    },
    {
      key: 'annualClaimCostEUR',
      label:
        'Kolikšni so bili v zadnjih 12 mesecih stroški reklamacij, dobropisov in popustov, ki ste jih dali zaradi lastne napake?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      help: 'Vpišite samo stroške, ki še niso zajeti v urah ponovnega dela.',
    },
    {
      key: 'annualLostMarginEUR',
      label: 'Kolikšno izgubljeno prispevno maržo ocenjujete zaradi strank ali poslov, izgubljenih po napaki?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      help: 'Ne vpisujte celotne vrednosti izgubljenega posla.',
    },
    {
      key: 'errorDetection',
      label: 'Kdaj napako običajno opazite?',
      kind: 'choice',
      default: 2,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Takoj, ob nastanku' },
        { value: 1, label: 'Pri notranji kontroli' },
        { value: 2, label: 'Tik pred oddajo stranki' },
        { value: 3, label: 'Opozori nas stranka' },
      ],
    },
    mainCauseField(NAPAKE_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(NAPAKE_CAUSES, input.mainCause);

    return [
      {
        // Ure ponovnega dela so že plačan čas ekipe — sproščene ure ne znižajo
        // plačne mase, zato so kapaciteta in ne denar, ki odteka.
        bucket: 'capacity',
        label: 'Popravljanje in ponavljanje dela',
        valueEUR: input.reworkHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.reworkHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Reklamacije, dobropisi in popusti',
        valueEUR: input.annualClaimCostEUR,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Izgubljena prispevna marža',
        valueEUR: input.annualLostMarginEUR,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Kontrole obveznih podatkov že ob vnosu',
    'Sledljivost dokumenta od naročila do izdaje',
    'Zgodovina sprememb z revizijsko sledjo',
  ],
};

// --- 4. Plačilni roki in terjatve -------------------------------------------

const DENAR_CAUSES: CauseOption[] = [
  { label: 'Opominjanje ni sistematično', category: 'planning' },
  { label: 'Odprte postavke niso sproti vidne', category: 'data' },
  { label: 'Račun izdamo z zamikom po opravljenem delu', category: 'planning' },
  { label: 'Kupci plačujejo slabo ne glede na opomine', category: 'external' },
  { label: 'Nihče nima izterjave med svojimi nalogami', category: 'people' },
];

export const denarSp: ModuleDefinition = {
  id: 'denarSp',
  usesRevenue: true,
  title: 'Plačilni roki in terjatve',
  summary: 'Strošek denarja, ki predolgo čaka na kupca, čas za izterjavo in odpisane terjatve.',
  triage: {
    prompt: 'Kako pogosto kupci plačajo po dogovorjenem roku?',
    options: [
      { value: 0, label: 'Roke večinoma držijo' },
      { value: 1, label: 'Nekaj zamud mesečno' },
      { value: 2, label: 'Redno zamujajo' },
      { value: 3, label: 'Zamude so pravilo' },
    ],
  },
  fields: [
    // Prihodek pride iz skupne finančne osnove (contexts/splosno.ts) — je lastnost
    // podjetja, ne področja, in mora obstajati tudi, kadar to področje ni izbrano.
    {
      key: 'overdueDaysAverage',
      label: 'Za koliko dni povprečno kupci prekoračijo dogovorjeni plačilni rok?',
      kind: 'number',
      unit: 'dni',
      default: 0,
      help: 'Samo prekoračitev NAD dogovorjenim rokom. Financiranje dogovorjenega roka je normalno poslovanje in ni strošek napake.',
    },
    {
      key: 'dunningHoursPerMonth',
      label: 'Koliko ur mesečno porabite za opominjanje, usklajevanje odprtih postavk in izterjavo?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'annualBadDebtEUR',
      label: 'Kolikšna je bila v zadnjih 12 mesecih vrednost odpisanih ali neizterljivih terjatev?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
    },
    {
      key: 'currentDSODays',
      label: 'Kolikšen je povprečen dejanski plačilni rok kupcev (DSO)?',
      kind: 'number',
      unit: 'dni',
      default: 0,
      contextOnly: true,
      help: 'Podatek ne vstopa v izračun — služi za primerjavo z dogovorjenim rokom.',
    },
    mainCauseField(DENAR_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(DENAR_CAUSES, input.mainCause);
    const dailyRevenue = context.annualRevenueEUR / 365;

    return [
      {
        bucket: 'directLoss',
        label: 'Strošek zamud pri plačilih',
        valueEUR: dailyRevenue * input.overdueDaysAverage * context.capitalCostRate,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Odpisane terjatve',
        valueEUR: input.annualBadDebtEUR,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Opominjanje in izterjava',
        valueEUR: input.dunningHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.dunningHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Samodejni opomini in lestvica opominjanja po zapadlosti',
    'Odprte postavke in limit kupca vidni že ob vnosu naročila',
    'Izdaja e-računov skladno z ZIERDED, brez ročnega pošiljanja',
  ],
};

// --- 5. Zaloge in vezan kapital ---------------------------------------------

const ZALOGE_CAUSES: CauseOption[] = [
  { label: 'Stanje zalog ni zanesljivo', category: 'data' },
  { label: 'Naročanje ni vezano na dejansko porabo', category: 'planning' },
  { label: 'Zalogo zavestno držimo kot varovalko', category: 'people' },
  { label: 'Dobavitelji so nezanesljivi', category: 'external' },
  { label: 'Blago zastara ali se pokvari', category: 'physical' },
];

export const zalogeSp: ModuleDefinition = {
  id: 'zalogeSp',
  title: 'Zaloge in vezan kapital',
  summary: 'Odpisi in razvrednotenja zalog ter denar, ki nepotrebno leži v skladišču.',
  triage: {
    prompt: 'Koliko denarja vam po nepotrebnem leži v zalogah?',
    options: [
      { value: 0, label: 'Zalog nimamo oziroma so pod nadzorom' },
      { value: 1, label: 'Nekaj presežka' },
      { value: 2, label: 'Precej' },
      { value: 3, label: 'To je naš največji vezan kapital' },
    ],
  },
  fields: [
    {
      key: 'inventoryValueEUR',
      label: 'Kolikšna je povprečna skupna vrednost vaših zalog?',
      kind: 'number',
      unit: 'EUR',
      default: 0,
      help: 'Če zalog nimate, vpišite 0 — področje se v izračunu ne bo pojavilo.',
    },
    {
      key: 'annualWriteOffEUR',
      label:
        'Kolikšna je bila v zadnjih 12 mesecih vrednost odpisov, razvrednotenj ali prisilnih znižanj zaradi zastaranja?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
    },
    reducibleShareField(
      'Kolikšen delež zalog bi po vaši oceni lahko znižali brez večjega tveganja za oskrbo?',
    ),
    {
      key: 'stockVisibility',
      label: 'Kako dober je vaš pregled nad dejanskimi zalogami?',
      kind: 'choice',
      default: 2,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Sproten in po lokacijah' },
        { value: 1, label: 'Večinoma zanesljiv' },
        { value: 2, label: 'Deloma v sistemu, deloma v Excelu' },
        { value: 3, label: 'Pogosto ugotovimo šele ob inventuri' },
      ],
    },
    mainCauseField(ZALOGE_CAUSES),
  ],
  compute: (input) => {
    const addressableShare = addressableShareOf(ZALOGE_CAUSES, input.mainCause);

    return [
      {
        bucket: 'directLoss',
        label: 'Odpisi in razvrednotenja zalog',
        valueEUR: input.annualWriteOffEUR,
        addressableShare,
      },
      {
        // Brez addressableShare: ta znesek JE potencial, ne sedanji strošek.
        // Množenje s pasom izboljšave bi ga štelo dvakrat.
        bucket: 'oneTimeCapital',
        label: 'Sprostljiv obratni kapital v zalogah',
        valueEUR: input.inventoryValueEUR * reducibleShareOf(input.reducibleShare),
      },
    ];
  },
  pantheon: [
    'Sproten pregled nad zalogo po skladiščih in lokacijah',
    'Minimalne zaloge in točke naročanja',
    'Poraba, vezana na dokument, brez naknadnega usklajevanja',
  ],
};

// --- Kratka diagnostika -----------------------------------------------------

const DATA_RISK_NOTE: Record<RiskLevel, string> = {
  low: 'Lastna cena je znana in podatki so na enem mestu. Odstopanje opazite, dokler ga je še mogoče popraviti.',
  medium:
    'Podatki so delni. Da je bil posel nedonosen, praviloma ugotovite šele ob obračunu, ko cene ni več mogoče popraviti.',
  high: 'Dejanske lastne cene ne poznate. Dokler je ne, natančnega zneska izgubljene marže ni mogoče izračunati — in prav to je težava.',
};

const PROCESS_RISK_NOTE: Record<RiskLevel, string> = {
  low: 'Sledljivost je urejena in poslovanje ni odvisno od posameznika.',
  medium: 'Sledljivost je delna. Ob resnejši reklamaciji ali pregledu je izvor napake težko dokazati.',
  high: 'Sledljivosti praktično ni, znanje pa je v glavah posameznikov. Odsotnost ene osebe lahko ustavi cel proces.',
};

/**
 * Štiri vprašanja, ki se prikažejo vedno in NE prispevajo nobenega evra.
 *
 * Namenoma brez zneska: kjer podjetje ne pozna lastne cene ali nima sledljivosti,
 * natančnega zneska ni mogoče izračunati, navidezno natančna številka pa bi prav
 * to težavo skrila. Modul zato nima triaže in ne more biti "največja postavka".
 */
export const diagnostikaSp: ModuleDefinition = {
  id: 'diagnostikaSp',
  title: 'Kratka diagnostika',
  summary: 'Štiri vprašanja o podatkih in odpornosti procesa. Ne prispevajo k finančnemu rezultatu.',
  fields: [
    {
      key: 'knowsUnitCost',
      label: 'Ali poznate dejansko lastno ceno svojega izdelka, storitve ali posla?',
      kind: 'choice',
      default: 1,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'singleSourceOfTruth',
      label: 'Ali so ključni poslovni podatki na enem mestu in med seboj usklajeni?',
      kind: 'choice',
      default: 1,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'auditTrail',
      label: 'Ali lahko za pomembno spremembo ugotovite, kdo jo je naredil in kdaj?',
      kind: 'choice',
      default: 2,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'keyPersonIndependence',
      label: 'Ali podjetje deluje normalno tudi brez ključne osebe?',
      kind: 'choice',
      default: 1,
      choices: ASSURANCE_CHOICES,
    },
  ],
  compute: (input) => {
    const dataLevel = riskLevelFromScore(input.knowsUnitCost + input.singleSourceOfTruth, 6);
    const processLevel = riskLevelFromScore(input.auditTrail + input.keyPersonIndependence, 6);

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
    'Kalkulacije lastne cene po izdelku, storitvi in dokumentu',
    'Revizijska sled vseh vnosov in sprememb',
    'Dokumentiran proces namesto znanja v glavah',
  ],
};

/** Vrstni red je hkrati prioriteta — odloči ob izenačenju v triaži. */
export const SPLOSNO_MODULES: ModuleDefinition[] = [
  podatkiSp,
  usklajevanjeSp,
  napakeSp,
  denarSp,
  zalogeSp,
  diagnostikaSp,
];
