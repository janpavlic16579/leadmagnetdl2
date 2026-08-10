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
 * Pet medsebojno izključujočih se stroškovnih področij za storitvena in projektna
 * podjetja.
 *
 * Tri načela, ki jih je treba ohraniti ob vsaki spremembi:
 *
 * 1. compute() vrne DEJANSKI sedanji strošek — brez množenja z "deležem izboljšave".
 *    Koliko od tega je realno mogoče nasloviti, izračuna motor iz naslovljivega
 *    deleža (glavni vzrok) in pasu izboljšave (sedanji sistem podjetja).
 *
 * 2. Ista ura ali evro se ne sme pojaviti v dveh področjih. Meje so zapisane v
 *    besedilih help, ne le v komentarjih — obiskovalec je edini, ki jih lahko
 *    upošteva pri vnosu.
 *
 * 3. NOVO GLEDE NA PROIZVODNJO — ura gre ALI med nezaračunane ALI med interne,
 *    nikoli oboje:
 *
 *      - opravljena za naročnika, a ni prišla na račun  → obracun_storitve,
 *        koš directLoss, vrednotena po ZARAČUNANI postavki (izgubljen prihodek)
 *      - interna, presežena ali administrativna         → projekti/obseg/administracija,
 *        koš capacity, vrednotena po STROŠKU ure (vrednost porabljenega časa)
 *
 *    Proizvodnja te pasti nima, ker ur ne prodaja. Če bi ista ura štela obakrat,
 *    bi se pojavila v hero znesku in v kapaciteti hkrati.
 */

// --- 1. Plan, prioritete in zasedenost ekipe --------------------------------

const PROJEKTI_CAUSES: CauseOption[] = [
  { label: 'Zasedenost ekipe ni vidna vnaprej', category: 'planning' },
  { label: 'Podatki o projektih niso enotni oziroma so zastareli', category: 'data' },
  { label: 'Stanje nalog ni vidno sproti', category: 'planning' },
  { label: 'Pogoste spremembe naročnikov', category: 'external' },
  { label: 'Odsotnosti in menjave v ekipi', category: 'people' },
];

export const projekti: ModuleDefinition = {
  id: 'projekti_storitve',
  title: 'Plan, prioritete in zasedenost ekipe',
  summary: 'Čakanje na odločitve in vhodne podatke, nadure zaradi premikanja rokov in čas za prerazporejanje.',
  triage: {
    prompt: 'Kako pogosto se prioritete spreminjajo ali ekipa čaka na odločitev, vhodne podatke ali potrditev?',
    options: [
      { value: 0, label: 'Plan je stabilen' },
      { value: 1, label: 'Občasno' },
      { value: 2, label: 'Redno, z vplivom' },
      { value: 3, label: 'Skoraj vsak dan' },
    ],
  },
  fields: [
    {
      key: 'planningMethod',
      label: 'Kako danes planirate delo ekipe?',
      kind: 'choice',
      default: 2,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Projektno orodje z zasedenostjo' },
        { value: 1, label: 'ERP brez planiranja zasedenosti' },
        { value: 2, label: 'Excel' },
        { value: 3, label: 'Koledar oziroma sprotni dogovor' },
      ],
    },
    {
      key: 'idleHoursPerMonth',
      label:
        'Koliko skupnih človek-ur mesečno ekipa čaka na odločitev, vhodne podatke ali potrditev naročnika?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Ne vključujte opravljenih ur, ki niso bile zaračunane — te sodijo v področje Evidenca dela in zaračunavanje.',
    },
    {
      key: 'overtimeHoursPerMonth',
      label: 'Koliko nadur mesečno povzroča predvsem premikanje rokov in prerazporejanje?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'replanningHoursPerMonth',
      label:
        'Koliko ur mesečno porabite za prerazporejanje ekipe, usklajevanje prioritet in iskanje informacij?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    mainCauseField(PROJEKTI_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(PROJEKTI_CAUSES, input.mainCause);
    const deliveryHours = input.idleHoursPerMonth + input.overtimeHoursPerMonth;

    return [
      {
        bucket: 'capacity',
        label: 'Zastoji in nadure v ekipi',
        valueEUR: deliveryHours * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: deliveryHours,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Prerazporejanje in usklajevanje',
        valueEUR: input.replanningHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.replanningHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Projekti z nalogami, roki in zasedenostjo ekipe',
    'Evidenca dela, povezana s planom projekta',
    'Pregled nad razpoložljivostjo pred sprejemom novega posla',
  ],
};

// --- 2. Evidenca dela in zaračunavanje --------------------------------------

const OBRACUN_CAUSES: CauseOption[] = [
  { label: 'Ure se ne evidentirajo sproti', category: 'data' },
  { label: 'Dogovor o obsegu ni zapisan dovolj natančno', category: 'data' },
  { label: 'Zaračunljivost ni vidna pred obračunom', category: 'planning' },
  { label: 'Naročnik opravljenega dela ne potrdi', category: 'external' },
  { label: 'Ekipa evidence ne vodi dosledno', category: 'people' },
];

export const obracun: ModuleDefinition = {
  id: 'obracun_storitve',
  title: 'Evidenca dela in zaračunavanje',
  summary: 'Opravljene ure, ki nikoli ne pridejo na račun, naknadno urejanje evidence in dobropisi.',
  triage: {
    prompt: 'Kako pogosto se zgodi, da opravljeno delo ni zaračunano ali je zaračunano prepozno?',
    options: [
      { value: 0, label: 'Zaračunamo vse opravljeno' },
      { value: 1, label: 'Občasno kaj uide' },
      { value: 2, label: 'Redno, pri več projektih' },
      { value: 3, label: 'Pri velikem delu dela' },
    ],
  },
  fields: [
    {
      key: 'unbilledHoursPerMonth',
      label: 'Koliko opravljenih ur mesečno na koncu ni zaračunanih nikomur?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Samo ure, opravljene za naročnika, ki niso prišle na noben račun. Interne, administrativne in prodajne ure tu ne štejejo — te po naravi niso zaračunljive.',
    },
    {
      key: 'timesheetHoursPerMonth',
      label:
        'Koliko ur mesečno porabite za naknadno rekonstrukcijo, zbiranje in potrjevanje evidence dela?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'creditNoteCostEUR',
      label: 'Kolikšna je bila letna vrednost dobropisov in popravkov računov zaradi napačno obračunanega dela?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
    },
    {
      key: 'recordingTiming',
      label: 'Kdaj se opravljene ure evidentirajo?',
      kind: 'choice',
      default: 2,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Sproti ob delu' },
        { value: 1, label: 'Isti dan' },
        { value: 2, label: 'Ob koncu tedna' },
        { value: 3, label: 'Šele ob obračunu' },
      ],
    },
    mainCauseField(OBRACUN_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(OBRACUN_CAUSES, input.mainCause);

    return [
      {
        // Vrednoteno po ZARAČUNANI postavki, ne po strošku ure: strošek te ure je
        // podjetje že plačalo in ga ne dobi nazaj — izgubljen je prihodek, ki bi ga
        // ta ura morala prinesti. Vrednotenje po strošku bi izgubo podcenilo.
        bucket: 'directLoss',
        label: 'Opravljene, a nezaračunane ure',
        valueEUR: input.unbilledHoursPerMonth * context.chargeOutRateEUR * MONTHS_PER_YEAR,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Dobropisi in popravki računov',
        valueEUR: input.creditNoteCostEUR,
        addressableShare,
      },
      {
        // Urejanje evidence je interno delo — plačan čas, ki se preusmeri, ne denar,
        // ki odteka. Zato kapaciteta po administrativni uri.
        bucket: 'capacity',
        label: 'Naknadna evidenca in potrjevanje ur',
        valueEUR: input.timesheetHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.timesheetHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Evidenca dela z zaračunljivostjo po nalogu',
    'Samodejni predlog računa iz opravljenih ur',
    'Pregled nezaračunanega dela pred zaključkom meseca',
  ],
};

// --- 3. Obseg, spremembe in dodelave ----------------------------------------

const OBSEG_CAUSES: CauseOption[] = [
  { label: 'Obseg ni dovolj natančno zapisan v pogodbi', category: 'data' },
  { label: 'Spremembe se ne beležijo kot dodatno naročilo', category: 'data' },
  { label: 'Napredek ni viden, dokler ni presežen', category: 'planning' },
  { label: 'Naročnik pogosto spreminja zahteve', category: 'external' },
  { label: 'Kakovost izvedbe oziroma pomanjkanje usposabljanja', category: 'people' },
];

export const obseg: ModuleDefinition = {
  id: 'obseg_storitve',
  title: 'Obseg, spremembe in dodelave',
  summary: 'Delo nad dogovorjenim obsegom, popravki po pripombah naročnika in odpisi ob obračunu.',
  triage: {
    prompt: 'Kako pogosto delate več, kot je bilo dogovorjeno, ali stvari popravljate brez doplačila?',
    options: [
      { value: 0, label: 'Obseg se drži' },
      { value: 1, label: 'Občasno' },
      { value: 2, label: 'Redno' },
      { value: 3, label: 'Pri večini projektov' },
    ],
  },
  fields: [
    {
      key: 'fixedPriceSharePercent',
      label: 'Kolikšen delež poslov sklenete po fiksni ceni?',
      kind: 'percent',
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.5,
      contextOnly: true,
      help: 'Podatek ne vstopa v izračun — pri fiksni ceni presežen obseg nosi izvajalec, pri delu po porabi naročnik.',
    },
    {
      key: 'overrunHoursPerMonth',
      label: 'Koliko ur mesečno porabite nad dogovorjenim obsegom, ne da bi jih lahko zaračunali?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Ure, ki niso bile zaračunane zaradi pomanjkljive evidence, sodijo v področje Evidenca dela — sicer bi bila ista ura šteta dvakrat.',
    },
    {
      key: 'reworkHoursPerMonth',
      label: 'Koliko ur mesečno porabite za popravke in dodelave po pripombah naročnika?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Popravki med izvedbo projekta. Servis in garancijska popravila po predaji sodijo v področje Reklamacije in poprodajni servis.',
    },
    {
      key: 'writeOffEUR',
      label: 'Kolikšna je bila letna vrednost odpisanih postavk in popustov ob obračunu?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      help: 'Samo tisto, kar še ni zajeto v nezaračunanih urah ali v urah nad obsegom iz zgornjih vprašanj.',
    },
    mainCauseField(OBSEG_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(OBSEG_CAUSES, input.mainCause);

    return [
      {
        bucket: 'capacity',
        label: 'Delo nad dogovorjenim obsegom',
        valueEUR: input.overrunHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.overrunHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Popravki po pripombah naročnika',
        valueEUR: input.reworkHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.reworkHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Odpisi in popusti ob obračunu',
        valueEUR: input.writeOffEUR,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Pogodbe in aneksi z zapisanim obsegom',
    'Sprememba obsega kot dodatno naročilo, ne kot tiha dodelava',
    'Primerjava načrtovanih in dejanskih ur po projektu',
  ],
};

// --- 4. Projektna administracija in podatki ---------------------------------

const ADMINISTRACIJA_CAUSES: CauseOption[] = [
  { label: 'Podatke vodimo v več različnih orodjih', category: 'data' },
  { label: 'Ponudbe in poročila nastajajo ročno', category: 'data' },
  { label: 'Podatki se ne vnašajo sproti', category: 'data' },
  { label: 'Odgovornosti niso jasne', category: 'people' },
];

export const administracija: ModuleDefinition = {
  id: 'administracija_storitve',
  title: 'Projektna administracija in podatki',
  summary: 'Priprava ponudb in poročil, prepisovanje med orodji in popravljanje napačnih podatkov.',
  triage: {
    prompt: 'Koliko ročnega dela imate s ponudbami, poročili in prepisovanjem med orodji?',
    options: [
      { value: 0, label: 'Večina poteka samodejno' },
      { value: 1, label: 'Nekaj ur tedensko' },
      { value: 2, label: 'Vsak dan' },
      { value: 3, label: 'Za to je potreben skoraj cel človek' },
    ],
  },
  fields: [
    {
      key: 'projectAdminHoursPerMonth',
      label:
        'Koliko skupnih ur mesečno porabite za pripravo ponudb, odpiranje in zaključevanje projektov ter poročila naročnikom?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'retypingHoursPerMonth',
      label:
        'Koliko skupnih ur mesečno porabite samo za prepisovanje podatkov med projektnim orodjem, Excelom in ERP-jem?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Ne vključujte urejanja evidence ur — to meri področje Evidenca dela in zaračunavanje.',
    },
    {
      key: 'dataFixHoursPerMonth',
      label: 'Koliko ur mesečno porabite za popravljanje napačnih, manjkajočih ali neusklajenih podatkov?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'toolCount',
      label: 'V koliko ločenih orodjih vodite podatke o projektu?',
      kind: 'choice',
      default: 2,
      contextOnly: true,
      choices: [
        { value: 0, label: 'V enem' },
        { value: 1, label: 'V dveh' },
        { value: 2, label: 'V treh' },
        { value: 3, label: 'V štirih ali več' },
      ],
    },
    mainCauseField(ADMINISTRACIJA_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(ADMINISTRACIJA_CAUSES, input.mainCause);
    const rate = context.adminHourCostEUR;

    // Tri ločene postavke namesto ene vsote: razčlenitev pokaže, kje ročno delo
    // dejansko nastaja, in obiskovalec vidi, da vprašanja niso podvojena.
    return [
      {
        bucket: 'capacity',
        label: 'Ponudbe, poročila in vodenje projektov',
        valueEUR: input.projectAdminHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.projectAdminHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Prepisovanje podatkov med orodji',
        valueEUR: input.retypingHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.retypingHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Popravljanje napačnih podatkov',
        valueEUR: input.dataFixHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.dataFixHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Ponudba, projekt in račun iz istega vira podatkov',
    'Samodejna poročila o napredku in porabi',
    'Enoten vir podatkov namesto Excela ob ERP-ju',
  ],
};

// --- 5. Roki, plačila in vezan denar ----------------------------------------

const TERJATVE_CAUSES: CauseOption[] = [
  { label: 'Napredek in roki niso pravočasno vidni', category: 'planning' },
  { label: 'Obračun se pripravi šele po zaključku projekta', category: 'data' },
  { label: 'Prenos podatkov med izvedbo, prodajo in financami je ročen', category: 'data' },
  { label: 'Naročniki plačujejo z zamudo', category: 'external' },
  { label: 'Razpoložljivost ključnih ljudi', category: 'people' },
];

export const terjatve: ModuleDefinition = {
  id: 'terjatve_storitve',
  title: 'Roki, plačila in vezan denar',
  summary: 'Pogodbene kazni, izgubljena marža, usklajevanje z naročniki in kapital, vezan v nezaračunanem delu.',
  triage: {
    prompt: 'Kako pogosto zamujate z oddajo ali čakate na plačilo dlje, kot bi morali?',
    options: [
      { value: 0, label: 'Roke in plačila držimo' },
      { value: 1, label: 'Nekajkrat mesečno' },
      { value: 2, label: 'Redno' },
      { value: 3, label: 'Zamude so pogoste' },
    ],
  },
  fields: [
    {
      key: 'penaltyCostEUR',
      label: 'Kolikšni so bili letni popusti, pogodbene kazni ali drugi neposredni stroški zaradi zamud?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
    },
    {
      key: 'lostMarginEUR',
      label: 'Kolikšno izgubljeno prispevno maržo ocenjujete zaradi odpovedanih ali izgubljenih projektov?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      help: 'Ne vpisujte celotne vrednosti izgubljenega posla.',
    },
    {
      key: 'clientCommsHoursPerMonth',
      label: 'Koliko ur mesečno porabite za obveščanje naročnikov in usklajevanje zaradi zamud?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Ne vključujte prerazporejanja ekipe — to meri področje Plan, prioritete in zasedenost.',
    },
    {
      key: 'unbilledWipEUR',
      label:
        'Kolikšna je povprečna vrednost opravljenega, a še ne plačanega dela (nedokončano delo in zapadle terjatve)?',
      kind: 'number',
      unit: 'EUR',
      default: 0,
    },
    reducibleShareField(
      'Kolikšen delež tega bi po vaši oceni lahko sprostili s hitrejšim obračunom in izterjavo?',
      'Brez večjega tveganja za odnos z naročnikom.',
    ),
    mainCauseField(TERJATVE_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(TERJATVE_CAUSES, input.mainCause);

    return [
      {
        bucket: 'directLoss',
        label: 'Kazni in popusti zaradi zamud',
        valueEUR: input.penaltyCostEUR,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Izgubljena prispevna marža',
        valueEUR: input.lostMarginEUR,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Obveščanje in usklajevanje z naročniki',
        valueEUR: input.clientCommsHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.clientCommsHoursPerMonth,
        addressableShare,
      },
      {
        // Brez addressableShare: ta znesek JE potencial, ne sedanji strošek.
        // Množenje s pasom izboljšave bi ga štelo dvakrat.
        bucket: 'oneTimeCapital',
        label: 'Sprostljiv kapital v nezaračunanem delu in terjatvah',
        valueEUR: input.unbilledWipEUR * reducibleShareOf(input.reducibleShare),
      },
    ];
  },
  pantheon: [
    'Obračun po mejnikih namesto ob zaključku projekta',
    'Statusi projektov in obveščanje naročnikov iz ERP-ja',
    'Spremljanje zapadlih terjatev in samodejni opomniki',
  ],
};

// --- Kratka diagnostika -----------------------------------------------------

const DATA_RISK_NOTE: Record<RiskLevel, string> = {
  low: 'Ure se evidentirajo sproti, marža projekta je znana. Odstopanje opazite, ko ga je še mogoče popraviti.',
  medium:
    'Podatki so delni. Odstopanje od načrta praviloma opazite šele ob obračunu, ko projekta ni več mogoče popraviti.',
  high: 'Dejanske porabe in marže projekta ne poznate. Dokler tega ni, natančnega zneska izgubljenega prihodka ni mogoče izračunati — in prav to je težava.',
};

const PROCESS_RISK_NOTE: Record<RiskLevel, string> = {
  low: 'Dogovori so zapisani in izvedba ni odvisna od posameznika.',
  medium: 'Dogovori so delno zapisani. Ob sporu o obsegu je težko dokazati, kaj je bilo dogovorjeno.',
  high: 'Dogovorjeni obseg ni zapisan, znanje pa je v glavah posameznikov. En spor ali odhod ključne osebe lahko ustavi več projektov.',
};

/**
 * Štiri vprašanja, ki se prikažejo vedno in NE prispevajo nobenega evra.
 *
 * Namenoma brez zneska: kjer podjetje ne pozna marže projekta ali nima zapisanega
 * obsega, natančnega zneska ni mogoče izračunati, navidezno natančna številka pa bi
 * prav to težavo skrila. Modul zato nima triaže in ne more biti "največja postavka".
 */
export const diagnostika: ModuleDefinition = {
  id: 'diagnostika_storitve',
  title: 'Kratka diagnostika',
  summary: 'Štiri vprašanja o podatkih in odpornosti procesa. Ne prispevajo k finančnemu rezultatu.',
  fields: [
    {
      key: 'realtimeRecording',
      label: 'Ali se opravljene ure evidentirajo sproti, na dan izvedbe?',
      kind: 'choice',
      default: 1,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'knowsProjectMargin',
      label: 'Ali poznate dejansko maržo posameznega projekta oziroma naročnika?',
      kind: 'choice',
      default: 1,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'scopeDocumented',
      label: 'Ali je dogovorjeni obseg zapisan tako, da je spremembo mogoče dokazati?',
      kind: 'choice',
      default: 2,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'keyPersonIndependence',
      label: 'Ali projekti tečejo normalno tudi brez ključne osebe?',
      kind: 'choice',
      default: 1,
      choices: ASSURANCE_CHOICES,
    },
  ],
  compute: (input) => {
    const dataLevel = riskLevelFromScore(input.realtimeRecording + input.knowsProjectMargin, 6);
    const processLevel = riskLevelFromScore(input.scopeDocumented + input.keyPersonIndependence, 6);

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
    'Kalkulacija marže po projektu in naročniku',
    'Zapisan obseg, aneksi in sledljivost sprememb',
    'Dokumentiran proces namesto znanja v glavah',
  ],
};

/** Vrstni red je hkrati prioriteta — odloči ob izenačenju v triaži. */
export const STORITVE_MODULES: ModuleDefinition[] = [
  projekti,
  obracun,
  obseg,
  administracija,
  terjatve,
  diagnostika,
];
