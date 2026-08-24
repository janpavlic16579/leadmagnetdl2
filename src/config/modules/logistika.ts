import { addressableShareOf, mainCauseField, type CauseOption } from './addressableShare';
import type { ModuleDefinition, RiskLevel } from './moduleTypes';
import {
  ASSURANCE_CHOICES,
  MONTHS_PER_YEAR,
  REDUCIBLE_STOCK_EXPLAINER,
  reducibleShareField,
  reducibleShareOf,
  ASSURANCE_UNANSWERED,
  ASSURANCE_UNANSWERED_NOTE,
  assuranceRiskLevel,
} from './shared';

/**
 * Pet medsebojno izključujočih se stroškovnih področij za logistiko in transport.
 *
 * Zgrajeno po istih dveh načelih kot proizvodnja (glej proizvodnja.ts):
 *
 * 1. compute() vrne DEJANSKI sedanji strošek — brez množenja z "deležem izboljšave".
 *    Koliko od tega je realno mogoče nasloviti, izračuna motor iz naslovljivega
 *    deleža (glavni vzrok) in pasu izboljšave (sedanji sistem podjetja).
 *
 * 2. Ista ura ali evro se ne sme pojaviti v dveh področjih. Meje so zapisane v
 *    besedilih help, ker jih upošteva samo obiskovalec ob vnosu.
 *
 * Dejavnost je bolj raznolika od proizvodnje: prevoznik z lastnim voznim parkom,
 * špediter brez vozil in 3PL skladiščnik odgovarjajo na isti vprašalnik. Zato
 * ima vsako področje vsaj eno vprašanje, ki sme ostati 0, ne da bi izračun
 * razpadel — kdor nima voznega parka, vpiše 0 praznih kilometrov in področje
 * zanj meri samo čakanje in razporejanje.
 *
 * Strošek operativne (voznik, skladiščnik) in administrativne (disponent,
 * prodaja) ure prideta iz konteksta: sta lastnost podjetja, ne področja.
 *
 * PANTHEON: seznami funkcionalnosti spodaj ostajajo znotraj objavljenega
 * slovenskega cenika. Datalab nima ločene logistične licence — logistiko
 * pokrivata licenci SE in ME (modula LT in LT3) na ravni financ, naročil,
 * dokumentacije, stroškov in obračunavanja (glej config/industries.ts). Nobena
 * postavka zato ne obljublja namenskega TMS ali WMS.
 */

// --- 1. Planiranje prevozov in izkoriščenost --------------------------------

const ODPREMA_CAUSES: CauseOption[] = [
  { label: 'Razpored voženj ni ažuren oziroma ni viden sproti', category: 'planning' },
  { label: 'Naročila prihajajo prepozno ali nepopolna', category: 'data' },
  { label: 'Podatki o pošiljkah so raztreseni po orodjih', category: 'data' },
  { label: 'Stranke pogosto spreminjajo termine in količine', category: 'external' },
  { label: 'Okvare vozil ali pomanjkanje voznikov', category: 'physical' },
];

export const odprema: ModuleDefinition = {
  id: 'odprema',
  title: 'Planiranje prevozov in izkoriščenost',
  summary:
    'Prazne in slabo izkoriščene vožnje, čakanje vozil in voznikov ter čas, porabljen za razporejanje.',
  triage: {
    prompt: 'Kako pogosto se razpored prevozov podre — prazne vožnje, čakanje, ponovno razporejanje?',
    options: [
      { value: 0, label: 'Razpored drži' },
      { value: 1, label: 'Občasno' },
      { value: 2, label: 'Redno, z vplivom' },
      { value: 3, label: 'Skoraj vsak dan' },
    ],
  },
  fields: [
    {
      key: 'dispatchMethod',
      label: 'Kako danes razporejate prevoze?',
      kind: 'choice',
      default: 2,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Namenski sistem za razporejanje' },
        { value: 1, label: 'ERP brez zanesljivega razporejanja' },
        { value: 2, label: 'Excel' },
        { value: 3, label: 'Telefon oziroma sprotni dogovor' },
      ],
    },
    {
      key: 'emptyKmPerMonth',
      label:
        'Koliko kilometrov mesečno vozila prevozijo prazna ali z manj kot polovično izkoriščenostjo?',
      kind: 'number',
      unit: 'km/mesec',
      default: 0,
      help: 'Če voznega parka nimate, vpišite 0. Nujne podnajeme prevoznikov meri področje Zamude.',
      explainer:
        'Kilometri brez tovora — vračanje praznega vozila, vožnja do naslednjega nakladalnega mesta. Če ' +
        'deleža ne vodite, ocenite: skupni kilometri × ocenjen delež praznih voženj. Primer: 20.000 km × ' +
        '20 % = 4.000 km na mesec.',
    },
    {
      key: 'costPerKmEUR',
      label: 'Kolikšen je vaš povprečen variabilen strošek kilometra (gorivo, cestnine, obraba, gume)?',
      kind: 'slider',
      min: 0.2,
      max: 1.6,
      step: 0.05,
      unit: 'EUR/km',
      default: 0.75,
      help: 'Brez stroška voznika — njegove ure so zajete v naslednjem vprašanju.',
      explainer:
        'Samo stroški, ki nastanejo z vožnjo: gorivo, cestnine, gume, obraba, olja. Brez plače voznika, ' +
        'zavarovanja in leasinga. Hiter izračun: letni strošek goriva in cestnin delite s prevoženimi ' +
        'kilometri. Primer: 0,45 EUR/km.',
    },
    {
      key: 'waitingHoursPerMonth',
      label:
        'Koliko skupnih ur mesečno vozniki in vozila čakajo na nakladu, razkladu ali zaradi nejasnega razporeda?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Čakanja, ki ga stranki zaračunate kot stojnino, ne štejte — tega ne plačujete vi.',
      explainer:
        'Ure, ko vozilo in voznik stojita, ne da bi to kdo plačal — čakanje na rampi, na dokumente, na ' +
        'nakladanje. Ocenite: koliko voženj na mesec × povprečno čakanje. Primer: 120 voženj × 30 min ≈ ' +
        '60 ur.',
    },
    {
      key: 'dispatchHoursPerMonth',
      label:
        'Koliko ur mesečno porabite za razporejanje, prerazporejanje in iskanje informacij o vožnjah?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    mainCauseField(ODPREMA_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(ODPREMA_CAUSES, input.mainCause);

    return [
      {
        // Gorivo in cestnine so že porabljen denar, ne izgubljen čas — zato
        // neposredna izguba. Da je vsak prazen kilometer odpravljiv, izračun ne
        // trdi: to omeji naslovljiv delež iz glavnega vzroka.
        bucket: 'directLoss',
        label: 'Prazni in slabo izkoriščeni kilometri',
        valueEUR: input.emptyKmPerMonth * input.costPerKmEUR * MONTHS_PER_YEAR,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Čakanje vozil in voznikov',
        valueEUR: input.waitingHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.waitingHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Razporejanje in usklajevanje voženj',
        valueEUR: input.dispatchHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.dispatchHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Naročila in odpreme na enem mestu, brez vzporednih preglednic',
    'Statusi dokumentov, vidni sproti',
    'Stroški prevoza, vezani na dokument in stranko',
  ],
};

// --- 2. Napačne dostave, poškodbe in reklamacije ----------------------------

const NAPAKE_CAUSES: CauseOption[] = [
  { label: 'Podatki o pošiljki so nepopolni ali napačni', category: 'data' },
  { label: 'Naročilo se ročno prepisuje med orodji', category: 'data' },
  { label: 'Blago ni zanesljivo označeno oziroma ni sledljivo', category: 'data' },
  // Ostaja people: sistemski del ('Blago ni zanesljivo označeno') je svoja možnost,
  // ta pa opisuje napako kljub kontrolam in pomanjkanje usposabljanja.
  { label: 'Napake pri komisioniranju oziroma pomanjkanje usposabljanja', category: 'people' },
  { label: 'Poškodbe pri prevozu, embalaža ali oprema', category: 'physical' },
];

export const napake: ModuleDefinition = {
  id: 'napake',
  title: 'Napačne dostave, poškodbe in reklamacije',
  summary: 'Ponovne dostave, poškodovano ali izgubljeno blago in čas, porabljen za reševanje reklamacij.',
  triage: {
    prompt: 'Kako pogosto pride do napačne dostave, poškodbe ali reklamacije?',
    options: [
      { value: 0, label: 'Redko' },
      { value: 1, label: 'Mesečno' },
      { value: 2, label: 'Tedensko' },
      { value: 3, label: 'Pri velikem deležu pošiljk' },
    ],
  },
  fields: [
    {
      key: 'shipmentsPerMonth',
      label: 'Koliko pošiljk oziroma dostav mesečno opravite?',
      kind: 'number',
      unit: 'pošiljk/mesec',
      default: 0,
    },
    {
      key: 'errorSharePercent',
      label: 'Kolikšen delež pošiljk je napačnih, nepopolnih ali poškodovanih tako, da terja popravek?',
      kind: 'percent',
      min: 0,
      max: 0.1,
      step: 0.005,
      // Privzetek 0 in ne 0,02: znesek nastane kot zmnožek treh polj, od katerih je število
      // pošiljk nevtralen podatek, ki ga vsak vpiše takoj. Pri 5.000 pošiljkah na mesec sta
      // nedotaknjena privzetka 0,02 in 40 EUR sama proizvedla 48.000 EUR neposredne izgube.
      // Delež napak je edino od treh polj, ki trdi, da težava obstaja — mora priti od
      // obiskovalca. Strošek napake ostane s privzetkom, ker brez deleža ne množi ničesar.
      default: 0,
      help:
        'Samo pošiljke, ki so terjale popravek — ponovno dostavo, prepakiranje ali vračilo. ' +
        'Zamude brez napake v vsebini sodijo v področje Roki.',
      explainer:
        'Če deleža ne vodite, ga ocenite iz reklamacij: koliko primerov na mesec delite s ' +
        'številom pošiljk. Primer: 60 reklamacij pri 5.000 pošiljkah je 1,2 %.',
    },
    {
      key: 'costPerErrorEUR',
      label: 'Kolikšen je povprečen neposreden strošek ene take napake?',
      kind: 'slider',
      min: 5,
      max: 300,
      step: 5,
      unit: 'EUR',
      default: 40,
      help: 'Ponovna dostava, prepakiranje, vračilo. Vrednost samega blaga vpišite v naslednje vprašanje.',
      explainer:
        'Kaj vas stane ena napaka brez vrednosti blaga: ponovna dostava, prepakiranje, dodatna ' +
        'manipulacija, čas disponenta. Primer: ponovna dostava 60 EUR + 1 ura dela ≈ 90 EUR.',
    },
    {
      key: 'annualDamageCostEUR',
      label:
        'Kolikšna je bila letna vrednost poškodovanega, izgubljenega ali ukradenega blaga, ki ste jo krili sami?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Samo del, ki ga ni pokrilo zavarovanje.',
      explainer:
        'Vrednost poškodovanega ali izgubljenega blaga, ki ste jo nosili vi — nad odbitno franšizo ' +
        'oziroma tisto, česar zavarovalnica ni pokrila. Seštejte primere zadnjih 12 mesecev.',
    },
    {
      key: 'claimHoursPerMonth',
      label: 'Koliko ur mesečno porabite za reševanje reklamacij in iskanje izgubljenih pošiljk?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Obveščanje strank o zamudah sodi v področje Zamude, ne sem.',
      explainer:
        'Pisarniško reševanje: sprejem reklamacije, iskanje pošiljke, usklajevanje z voznikom in ' +
        'stranko, papirologija. Primer: 15 primerov na mesec × 1 h ≈ 15 ur.',
    },
    mainCauseField(NAPAKE_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(NAPAKE_CAUSES, input.mainCause);

    return [
      {
        bucket: 'directLoss',
        label: 'Napačne in nepopolne dostave',
        valueEUR: input.shipmentsPerMonth * input.errorSharePercent * input.costPerErrorEUR * MONTHS_PER_YEAR,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Poškodovano in izgubljeno blago',
        valueEUR: input.annualDamageCostEUR,
        addressableShare,
      },
      {
        // Ure reševanja reklamacij so že plačan čas ekipe — sproščene ure ne
        // znižajo plačne mase, zato so kapaciteta in ne denar, ki odteka.
        bucket: 'capacity',
        label: 'Reševanje reklamacij in iskanje pošiljk',
        valueEUR: input.claimHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.claimHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Dobavnice in prevzemi neposredno iz naročil',
    'Serije in loti s sledljivostjo do posamezne pošiljke',
    'Zgodovina dokumentov po stranki in artiklu',
  ],
};

// --- 3. Skladiščne operacije in zaloga --------------------------------------

const SKLADISCE_CAUSES: CauseOption[] = [
  { label: 'Lokacije blaga niso vodene oziroma niso ažurne', category: 'data' },
  { label: 'Prevzemi in izdaje se ne evidentirajo sproti', category: 'data' },
  { label: 'Parametri zaloge in naročanje niso usklajeni', category: 'planning' },
  { label: 'Dobavitelji dostavljajo nepredvidljivo', category: 'external' },
  { label: 'Premalo prostora oziroma neustrezna oprema', category: 'physical' },
];

export const skladisce: ModuleDefinition = {
  id: 'skladisce',
  title: 'Skladiščne operacije in zaloga',
  summary: 'Iskanje in prekladanje blaga, popisne razlike in kapital, vezan v zalogi.',
  triage: {
    prompt: 'Kako pogosto v skladišču iščete blago, ki bi moralo biti na svojem mestu?',
    options: [
      { value: 0, label: 'Skoraj nikoli' },
      { value: 1, label: 'Občasno' },
      { value: 2, label: 'Redno' },
      { value: 3, label: 'Vsak dan' },
    ],
  },
  fields: [
    {
      key: 'searchHoursPerMonth',
      label:
        'Koliko skupnih ur mesečno v skladišču porabite za iskanje blaga, prekladanje in ponovno urejanje lokacij?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Čakanje vozil na rampi štejte v področju Planiranje prevozov, ne tukaj.',
      explainer:
        'Ure iskanja blaga, ki jih ne bi bilo, če bi sistem vedel, kje kaj leži. Ocenite: koliko ljudi × ' +
        'koliko minut na izmeno × 21 dni. Primer: 4 ljudje × 15 min ≈ 21 ur na mesec.',
    },
    {
      key: 'inventoryValueEUR',
      label: 'Kolikšna je povprečna vrednost zaloge, ki je v vaši lasti?',
      kind: 'number',
      unit: 'EUR',
      default: 0,
      help: 'Če skladiščite izključno tuje blago, vpišite 0 — tujega kapitala ne sproščate vi.',
      explainer:
        'Povprečna vrednost blaga, ki je VAŠA last, po nabavni vrednosti — ne vrednost tujega blaga v ' +
        'hrambi. Vzemite postavko zaloge iz bilance ali povprečje nekaj mesečnih stanj.',
    },
    {
      key: 'annualWriteOffEUR',
      label:
        'Kolikšna je bila v zadnjih 12 mesecih vrednost popisnih razlik, odpisov in zastarane zaloge?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
    },
    reducibleShareField(
      'Kolikšen delež zaloge bi po vaši oceni lahko znižali brez večjega tveganja za oskrbo?',
      { explainer: REDUCIBLE_STOCK_EXPLAINER },
    ),
    {
      key: 'stockVisibility',
      label: 'Kako dober je vaš pregled nad zalogo po lokacijah?',
      kind: 'choice',
      default: 2,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Sproten in po lokacijah' },
        { value: 1, label: 'Večinoma zanesljiv' },
        { value: 2, label: 'Deloma ERP, deloma Excel' },
        { value: 3, label: 'Pogosto ugotovimo šele ob inventuri' },
      ],
    },
    mainCauseField(SKLADISCE_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(SKLADISCE_CAUSES, input.mainCause);

    return [
      {
        bucket: 'directLoss',
        label: 'Popisne razlike in odpisi',
        valueEUR: input.annualWriteOffEUR,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Iskanje in prekladanje blaga',
        valueEUR: input.searchHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.searchHoursPerMonth,
        addressableShare,
      },
      {
        // Brez addressableShare: ta znesek JE potencial, ne sedanji strošek.
        // Množenje s pasom izboljšave bi ga štelo dvakrat.
        bucket: 'oneTimeCapital',
        label: 'Sprostljiv obratni kapital v zalogi',
        valueEUR: input.inventoryValueEUR * reducibleShareOf(input.reducibleShare),
      },
    ];
  },
  pantheon: [
    'Skladišča, lokacije, serije in loti',
    'Sproten pregled nad zalogo po skladiščih',
    'Minimalne zaloge in točke naročanja',
  ],
};

// --- 4. Prevozna dokumentacija in podatki -----------------------------------

const DOKUMENTACIJA_CAUSES: CauseOption[] = [
  { label: 'Podatke vodimo v več različnih orodjih', category: 'data' },
  { label: 'Listine so večinoma papirne', category: 'data' },
  { label: 'Vsaka stranka zahteva svoj portal oziroma obrazec', category: 'external' },
  { label: 'Podatki se ne vnašajo sproti', category: 'data' },
  { label: 'Odgovornosti niso jasne', category: 'planning' },
];

export const dokumentacija: ModuleDefinition = {
  id: 'dokumentacija',
  title: 'Prevozna dokumentacija in podatki',
  summary: 'Priprava in zbiranje listin, prepisovanje med orodji in popravljanje napačnih podatkov.',
  triage: {
    prompt: 'Koliko ročnega dela imate z listinami, dokazili o dostavi in prepisovanjem?',
    options: [
      { value: 0, label: 'Večina poteka digitalno' },
      { value: 1, label: 'Nekaj ur tedensko' },
      { value: 2, label: 'Vsak dan' },
      { value: 3, label: 'Za to je potreben skoraj cel človek' },
    ],
  },
  fields: [
    {
      key: 'documentHoursPerMonth',
      label:
        'Koliko ur mesečno porabite za pripravo, tiskanje in zbiranje prevoznih listin (CMR, dobavnice, dokazila o dostavi)?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'retypingHoursPerMonth',
      label:
        'Koliko ur mesečno porabite samo za prepisovanje podatkov med ERP-jem, Excelom, portali strank in papirjem?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Ne vključujte priprave listin iz prvega vprašanja.',
      explainer:
        'Isti podatek, vpisan drugič: iz naročila v prevozni nalog, iz naloga v Excel, s papirja v ' +
        'sistem. Ocenite: koliko ljudi × koliko minut na dan × 21 dni. Primer: 2 osebi × 40 min ≈ 28 ur.',
    },
    {
      key: 'dataFixHoursPerMonth',
      label:
        'Koliko ur mesečno porabite za popravljanje napačnih ali manjkajočih podatkov (naslovi, teže, cene prevoza)?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'podTiming',
      label: 'Kdaj dokazilo o dostavi (POD) pride v vaš sistem?',
      kind: 'choice',
      default: 2,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Sproti, elektronsko' },
        { value: 1, label: 'Isti dan' },
        { value: 2, label: 'V nekaj dneh' },
        { value: 3, label: 'Šele ob obračunu' },
      ],
    },
    mainCauseField(DOKUMENTACIJA_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(DOKUMENTACIJA_CAUSES, input.mainCause);
    const rate = context.adminHourCostEUR;

    // Tri ločene postavke namesto ene vsote: razčlenitev pokaže, kje ročno delo
    // dejansko nastaja, in obiskovalec vidi, da vprašanja niso podvojena.
    return [
      {
        bucket: 'capacity',
        label: 'Priprava in zbiranje listin',
        valueEUR: input.documentHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.documentHoursPerMonth,
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
    'Naročilo, dobavnica in račun brez ponovnega vnosa',
    'E-računi in elektronska izmenjava dokumentov',
    'Enoten vir podatkov namesto Excela ob ERP-ju',
  ],
};

// --- 5. Zamude, stojnine in nujni prevozi -----------------------------------

const ZAMUDE_CAUSES: CauseOption[] = [
  { label: 'Razpored in status pošiljk nista pravočasno vidna', category: 'planning' },
  { label: 'Naročila oziroma podatki pridejo prepozno', category: 'data' },
  { label: 'Prenos podatkov med prodajo, skladiščem in prevozom je ročen', category: 'data' },
  { label: 'Stranke, podizvajalci ali carina', category: 'external' },
  { label: 'Vozila, vozniki ali zastoji na cesti', category: 'physical' },
];

export const roki: ModuleDefinition = {
  id: 'roki',
  title: 'Zamude, stojnine in nujni prevozi',
  summary:
    'Nujni podnajemi prevoznikov, penali in stojnine, izgubljena marža in čas za pojasnjevanje zamud.',
  triage: {
    prompt: 'Kako pogosto zamujate z dostavo ali morate prevoz reševati nujno?',
    options: [
      { value: 0, label: 'Roke držimo' },
      { value: 1, label: 'Nekajkrat mesečno' },
      { value: 2, label: 'Tedensko' },
      { value: 3, label: 'Zamude so pogoste' },
    ],
  },
  fields: [
    {
      key: 'lateDeliveriesPerMonth',
      label: 'Koliko dostav mesečno opravite z zamudo?',
      kind: 'number',
      unit: 'dostav/mesec',
      default: 0,
      contextOnly: true,
      help: 'Podatek ne vstopa v izračun — služi za oceno obsega težave.',
      explainer: 'Groba ocena zadostuje: koliko dostav na mesec ne pride v dogovorjenem terminu.',
    },
    {
      key: 'expediteCostEUR',
      label:
        'Koliko ste v zadnjih 12 mesecih porabili za nujne podnajeme prevoznikov ali ekspresne prevoze?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Samo dodatni strošek nad ceno običajnega prevoza.',
      explainer:
        'Samo doplačilo nad redno ceno: podizvajalec v zadnjem hipu, ekspresni prevoz, dodatna vožnja. ' +
        'Primer: nujni prevoz 700 EUR namesto rednih 400 EUR → vpišite 300 EUR. Seštejte zadnjih 12 ' +
        'mesecev.',
    },
    {
      key: 'penaltyCostEUR',
      label: 'Kolikšni so bili letni penali, stojnine in popusti zaradi zamud?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Stojnine, ki jih plačate vi (demurrage, detention), ne tiste, ki jih zaračunate stranki.',
      explainer:
        'Denar, ki ste ga plačali ali vam je bil odbit zaradi zamude: pogodbeni penali, stojnine ' +
        '(demurrage, detention), popusti kot odškodnina. Seštejte zadnjih 12 mesecev iz računov in ' +
        'dobropisov.',
    },
    {
      key: 'lostMarginEUR',
      label: 'Kolikšno izgubljeno prispevno maržo ocenjujete zaradi odpovedanih ali izgubljenih poslov?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Ne vpisujte celotne vrednosti izgubljenega posla.',
      explainer:
        'Ne vrednost izgubljenega posla, ampak samo marža, ki bi vam ostala. Primer: izgubljena pogodba ' +
        'za 80.000 EUR na leto pri 20 % marži → 16.000 EUR.',
    },
    {
      key: 'customerCommsHoursPerMonth',
      label: 'Koliko ur mesečno porabite za obveščanje strank in usklajevanje zaradi zamud?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Reklamacije zaradi napačnih ali poškodovanih pošiljk sodijo v področje Napačne dostave.',
      explainer:
        'Klici in e-pošta, ki jih ne bi bilo, če bi prevoz tekel po načrtu — obveščanje o zamudi, ' +
        'iskanje novega termina, pojasnjevanje. Primer: 20 zamud × 45 min ≈ 15 ur na mesec.',
    },
    mainCauseField(ZAMUDE_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(ZAMUDE_CAUSES, input.mainCause);

    return [
      {
        bucket: 'directLoss',
        label: 'Nujni podnajemi in ekspresni prevozi',
        valueEUR: input.expediteCostEUR,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Penali, stojnine in popusti',
        valueEUR: input.penaltyCostEUR,
        addressableShare,
      },
      {
        // Koš 'lostMargin' in ne 'directLoss' — glej razlago pri istem polju v proizvodnji:
        // izgubljen posel je denar, ki ni nikoli prišel, in ga ni mogoče pokazati na kontu.
        bucket: 'lostMargin',
        label: 'Izgubljena prispevna marža',
        valueEUR: input.lostMarginEUR,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Obveščanje in usklajevanje s strankami',
        valueEUR: input.customerCommsHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.customerCommsHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Statusi naročil in obveščanje strank iz ERP-ja',
    'Pogodbeni pogoji in zapadlosti na enem mestu',
    'Povezava naročil s planom odprem',
  ],
};

// --- Kratka diagnostika -----------------------------------------------------

const DATA_RISK_NOTE: Record<RiskLevel, string> = {
  low: 'Poraba in statusi se evidentirajo sproti, lastna cena vožnje je znana. Odstopanje opazite, dokler ga je še mogoče popraviti.',
  medium:
    'Podatki so delni. Da je bila vožnja ali pošiljka nedonosna, praviloma ugotovite šele ob obračunu, ko cene ni več mogoče popraviti.',
  high: 'Dejanske lastne cene vožnje ne poznate. Dokler je ne, natančnega zneska izgubljene marže ni mogoče izračunati — in prav to je težava.',
};

const PROCESS_RISK_NOTE: Record<RiskLevel, string> = {
  low: 'Pošiljka je sledljiva in razporejanje ni odvisno od posameznika.',
  medium: 'Sledljivost je delna. Ob resnejši reklamaciji je odgovornost težko dokazati.',
  high: 'Sledljivosti praktično ni, znanje o strankah in relacijah pa je v glavah posameznikov. Ena izgubljena pošiljka ali odsotnost disponenta ustavi dan.',
};

/**
 * Štiri vprašanja, ki se prikažejo vedno in NE prispevajo nobenega evra.
 *
 * Namenoma brez zneska: kjer podjetje ne pozna lastne cene vožnje ali nima
 * sledljivosti pošiljke, natančnega zneska ni mogoče izračunati, navidezno
 * natančna številka pa bi prav to težavo skrila. Modul zato nima triaže in ne
 * more biti "največja postavka".
 */
export const diagnostikaLogistika: ModuleDefinition = {
  id: 'diagnostika_logistika',
  title: 'Kratka diagnostika',
  summary: 'Štiri vprašanja o podatkih in odpornosti procesa. Ne prispevajo k finančnemu rezultatu.',
  fields: [
    {
      key: 'realtimeRecording',
      label: 'Ali se opravljene vožnje, kilometri in ure evidentirajo sproti?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'knowsTripCost',
      label: 'Ali poznate dejansko lastno ceno posamezne vožnje oziroma pošiljke?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'shipmentTraceability',
      label: 'Ali lahko kadar koli zanesljivo poveste, kje je posamezna pošiljka?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'keyPersonIndependence',
      label: 'Ali razporejanje prevozov deluje normalno tudi brez ključne osebe?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
  ],
  compute: (input) => {
    const dataLevel = assuranceRiskLevel(input.realtimeRecording, input.knowsTripCost);
    const processLevel = assuranceRiskLevel(input.shipmentTraceability, input.keyPersonIndependence);

    return [
      {
        bucket: 'risk',
        label: 'Zanesljivost podatkov',
        ...(dataLevel
          ? { riskLevel: dataLevel, note: DATA_RISK_NOTE[dataLevel] }
          : { note: ASSURANCE_UNANSWERED_NOTE }),
      },
      {
        bucket: 'risk',
        label: 'Procesna odpornost',
        ...(processLevel
          ? { riskLevel: processLevel, note: PROCESS_RISK_NOTE[processLevel] }
          : { note: ASSURANCE_UNANSWERED_NOTE }),
      },
    ];
  },
  pantheon: [
    'Kalkulacije lastne cene po dokumentu in stranki',
    'Serije in loti s popolno sledljivostjo',
    'Dokumentiran proces namesto znanja v glavah',
  ],
};

/** Vrstni red je hkrati prioriteta — odloči ob izenačenju v triaži. */
export const LOGISTIKA_MODULES: ModuleDefinition[] = [
  odprema,
  napake,
  skladisce,
  dokumentacija,
  roki,
  diagnostikaLogistika,
];
