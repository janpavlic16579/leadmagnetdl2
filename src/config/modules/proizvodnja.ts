import { addressableShareOf, mainCauseField, type CauseOption } from './addressableShare';
import { UNANSWERED_CHOICE } from './moduleTypes';
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
 * Pet medsebojno izključujočih se stroškovnih področij za proizvodnjo.
 *
 * Dve načeli, ki ju je treba ohraniti ob vsaki spremembi:
 *
 * 1. compute() vrne DEJANSKI sedanji strošek — brez množenja z "deležem izboljšave".
 *    Koliko od tega je realno mogoče nasloviti, izračuna motor iz naslovljivega
 *    deleža (glavni vzrok) in pasu izboljšave (sedanji sistem podjetja). Prej sta
 *    bila oba pojma zmešana v eno številko, ki ni pomenila ne enega ne drugega.
 *
 * 2. Ista ura ali evro se ne sme pojaviti v dveh področjih. Meje so zapisane v
 *    besedilih help, ne le v komentarjih — obiskovalec je edini, ki jih lahko
 *    upošteva pri vnosu.
 *
 * Strošek proizvodne in administrativne ure prideta iz konteksta: sta lastnost
 * podjetja, ne področja, in se vprašata enkrat v svojem koraku.
 */

// --- 1. Plan, kapacitete in navodila ----------------------------------------

const PLANIRANJE_CAUSES: CauseOption[] = [
  { label: 'Plan in kapacitete niso ažurni', category: 'planning' },
  { label: 'Podatki ali navodila niso enotni oziroma so zastareli', category: 'data' },
  { label: 'Stanje nalogov ni vidno sproti', category: 'planning' },
  { label: 'Pogoste spremembe kupcev', category: 'external' },
  { label: 'Okvare strojev ali drugi tehnični razlogi', category: 'physical' },
];

export const planiranje: ModuleDefinition = {
  id: 'planiranje',
  title: 'Plan, kapacitete in navodila',
  summary: 'Čakanje zaradi nejasnih prioritet, spremembe plana in čas, porabljen za ponovno usklajevanje.',
  triage: {
    prompt:
      'Kako pogosto se plan spreminja ali proizvodnja čaka zaradi nejasnih prioritet, navodil ali podatkov?',
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
      label: 'Kako danes planirate proizvodnjo?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'MRP oziroma ERP plan' },
        { value: 1, label: 'ERP brez zanesljivega planiranja' },
        { value: 2, label: 'Excel' },
        { value: 3, label: 'Papir oziroma sprotni dogovor' },
      ],
    },
    {
      key: 'waitingHoursPerMonth',
      label:
        'Koliko skupnih človek-ur mesečno proizvodnja čaka zaradi nejasnega plana, napačnih prioritet ali manjkajočih navodil?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Ne vključujte čakanja na material ali okvar strojev — čakanje na material sodi v področje Zaloge.',
      explainer:
        'Ure, ko delo stoji, ker ni jasno, kaj naprej — čakanje na plan, navodilo, risbo ali potrditev. ' +
        'Ocena: 5 ljudi × 20 min × 21 dni ≈ 35 ur na mesec.',
    },
    {
      key: 'overtimeHoursPerMonth',
      label: 'Koliko nadur mesečno povzroča predvsem spreminjanje plana?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'replanningHoursPerMonth',
      label: 'Koliko ur mesečno porabite za ponovno planiranje, usklajevanje prioritet in iskanje informacij?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    mainCauseField(PLANIRANJE_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(PLANIRANJE_CAUSES, input.mainCause);
    const productionHours = input.waitingHoursPerMonth + input.overtimeHoursPerMonth;

    return [
      {
        bucket: 'capacity',
        label: 'Zastoji in nadure v proizvodnji',
        valueEUR: productionHours * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: productionHours,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Ponovno planiranje in usklajevanje',
        valueEUR: input.replanningHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.replanningHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'MRP in planiranje potreb po materialu',
    'Delovni nalogi neposredno iz naročil',
    'Proizvodni terminali za sproten pregled nad zasedenostjo',
  ],
};

// --- 2. Izmet, dodelave in kakovost -----------------------------------------

const MATERIAL_CAUSES: CauseOption[] = [
  { label: 'Zastarele ali napačne sestavnice oziroma normativi', category: 'data' },
  { label: 'Napačna verzija dokumentacije ali navodil', category: 'data' },
  { label: 'Poraba materiala ni evidentirana sproti', category: 'data' },
  { label: 'Napake pri izvedbi oziroma pomanjkanje usposabljanja', category: 'people' },
  { label: 'Kakovost materiala ali okvare strojev', category: 'physical' },
];

export const material: ModuleDefinition = {
  id: 'material',
  title: 'Izmet, dodelave in kakovost',
  summary: 'Material, ki konča kot izmet, ure ponovne izdelave in stroški reklamacij.',
  triage: {
    prompt: 'Kako pogosto nastajajo izmet, dodelave ali reklamacije?',
    options: [
      { value: 0, label: 'Redko' },
      { value: 1, label: 'Mesečno' },
      { value: 2, label: 'Tedensko' },
      { value: 3, label: 'Pri velikem deležu nalogov' },
    ],
  },
  fields: [
    {
      key: 'annualMaterialSpendEUR',
      label: 'Kolikšna je letna vrednost porabljenega materiala?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
    },
    {
      key: 'scrapSharePercent',
      label: 'Kolikšen delež porabljenega materiala postane izmet, ki ga ni mogoče uporabiti ali prodati?',
      kind: 'percent',
      min: 0,
      // Zgornja meja 0,30 in ne 0,15: v kovinarstvu in procesni industriji je delež izmeta
      // nad 15 % realen, prejšnja meja pa je take vnose tiho obrezala navzdol.
      max: 0.3,
      step: 0.005,
      // Privzetek 0 in ne 0,03: skupaj z letno vrednostjo materiala je to zmnožek dveh polj,
      // zato bi vsak privzetek nad 0 ustvaril znesek že ob vpisu same vrednosti materiala —
      // podatka, ki ga podjetje pozna in vpiše brez pomisleka. Delež izmeta je edino od
      // obeh polj, ki trdi, da težava obstaja, zato mora priti od obiskovalca.
      default: 0,
      help:
        'Samo material, ki konča kot odpadek — ne to, kar predelate ali prodate kot drugo kakovost. ' +
        'Ure dodelav merimo posebej v naslednjem vprašanju.',
      explainer:
        'Delež vrednosti, ne kosov: vrednost odpisanega materiala delite z vrednostjo porabljenega. ' +
        'Primer: 6.000 EUR izmeta pri 200.000 EUR porabe je 3 %.',
    },
    {
      key: 'reworkHoursPerMonth',
      label: 'Koliko skupnih človek-ur mesečno porabite za dodelave in ponovno izdelavo?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'annualClaimsCostEUR',
      label: 'Kolikšni so letni dodatni stroški reklamacij?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Vnesite samo stroške, ki še niso vključeni v izmet ali dodelave.',
      explainer:
        'Denar, ki je odtekel zaradi reklamacij kupcev: prevozi, nadomestna dobava, odškodnine, ' +
        'dobropisi. Ocena: 12 reklamacij × 400 EUR ≈ 4.800 EUR na leto.',
    },
    mainCauseField(MATERIAL_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(MATERIAL_CAUSES, input.mainCause);

    return [
      {
        bucket: 'directLoss',
        label: 'Izmet materiala',
        valueEUR: input.annualMaterialSpendEUR * input.scrapSharePercent,
        addressableShare,
        // Izmet ima tehnološko dno: razrez, zagon serije in izplen materiala
        // ostanejo tudi ob popolnih podatkih. Povprečje panoge je 3–8 %, dobra
        // praksa pod 2,5 % — odpravljiva je torej približno polovica, in še to
        // skupaj s tehnološkimi ukrepi, ne z evidenco. Brez te meje bi vzrok
        // "zastarele sestavnice" trdil, da je odpravljivih 75 % izmeta.
        addressableCap: 0.5,
      },
      {
        bucket: 'directLoss',
        label: 'Reklamacije in vračila',
        valueEUR: input.annualClaimsCostEUR,
        addressableShare,
      },
      {
        // Ure dodelav so že plačan čas ekipe — sproščene ure ne znižajo plačne mase,
        // zato so kapaciteta in ne denar, ki odteka.
        bucket: 'capacity',
        label: 'Dodelave in ponovna izdelava',
        valueEUR: input.reworkHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.reworkHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Sestavnice z normativi in alternativami materialov',
    'Evidentiranje dejanske porabe na delovnem nalogu',
    'Sledljivost serij in lotov do vzroka reklamacije',
  ],
};

// --- 3. Zaloge in razpoložljivost materiala ---------------------------------

const ZALOGE_CAUSES: CauseOption[] = [
  { label: 'Parametri zalog in plan niso ustrezni', category: 'planning' },
  { label: 'Stanje zalog oziroma lokacij ni zanesljivo', category: 'data' },
  { label: 'Nabava ni dovolj povezana s planom proizvodnje', category: 'planning' },
  { label: 'Dobavitelji so nezanesljivi', category: 'external' },
  { label: 'Zalogo zavestno držimo kot varovalko', category: 'planning' },
];

export const zaloge: ModuleDefinition = {
  id: 'zaloge',
  title: 'Zaloge in razpoložljivost materiala',
  summary: 'Odpisi in razvrednotenja, čakanje na manjkajoč material in kapital, vezan v zalogah.',
  triage: {
    prompt: 'Kako pogosto imate preveč zaloge, hkrati pa manjka pravi material?',
    options: [
      { value: 0, label: 'Zaloge so pod nadzorom' },
      { value: 1, label: 'Občasno' },
      { value: 2, label: 'Redno' },
      { value: 3, label: 'Stalno' },
    ],
  },
  fields: [
    {
      key: 'inventoryValueEUR',
      label: 'Kolikšna je povprečna skupna vrednost zalog?',
      kind: 'number',
      unit: 'EUR',
      default: 0,
      help: 'Vključite surovine, nedokončano proizvodnjo in končne izdelke.',
      explainer:
        'Povprečno stanje med letom po nabavni vrednosti — ne stanje na današnji dan in ne letna poraba. ' +
        'Vzemite postavko iz bilance ali povprečje nekaj mesečnih stanj.',
    },
    {
      key: 'annualWriteOffEUR',
      label:
        'Kolikšna je bila vrednost odpisov, razvrednotenj ali dodatnih popustov zaradi zastaranja zaloge v zadnjih 12 mesecih?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
    },
    {
      key: 'materialWaitingHoursPerMonth',
      label: 'Koliko skupnih človek-ur mesečno proizvodnja čaka samo zaradi manjkajočega materiala?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Zastoje zaradi nejasnega plana štejte v področju Plan, ne tukaj.',
      explainer:
        'Samo zastoji, ko delo stoji zaradi manjkajočega materiala. Ocena: 4 zastoji × 3 ljudje × 2 h ≈ ' +
        '24 ur na mesec.',
    },
    reducibleShareField(
      'Kolikšen delež zalog bi po vaši oceni lahko zmanjšali brez večjega tveganja za oskrbo?',
      { explainer: REDUCIBLE_STOCK_EXPLAINER },
    ),
    {
      key: 'stockVisibility',
      label: 'Kako dober je vaš pregled nad dejanskimi zalogami?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Sproten in po lokacijah' },
        { value: 1, label: 'Večinoma zanesljiv' },
        { value: 2, label: 'Deloma ERP, deloma Excel' },
        { value: 3, label: 'Pogosto ugotovimo šele ob inventuri' },
      ],
    },
    mainCauseField(ZALOGE_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(ZALOGE_CAUSES, input.mainCause);
    const reducibleShare = reducibleShareOf(input.reducibleShare);

    return [
      {
        bucket: 'directLoss',
        label: 'Odpisi in razvrednotenja zalog',
        valueEUR: input.annualWriteOffEUR,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Čakanje na manjkajoč material',
        valueEUR: input.materialWaitingHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.materialWaitingHoursPerMonth,
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
    'MRP z minimalnimi zalogami in točkami naročanja',
    'Skladišča, lokacije, serije in loti',
    'Povezava nabave s proizvodnim planom',
  ],
};

// --- 4. Delovni nalogi in podatki -------------------------------------------

const NALOGI_CAUSES: CauseOption[] = [
  { label: 'Podatke vodimo v več različnih orodjih', category: 'data' },
  { label: 'Delovni nalogi so večinoma papirni', category: 'data' },
  { label: 'Podatki se ne vnašajo sproti', category: 'data' },
  // Nejasna odgovornost je nepostavljen proces; sistem z delovnimi tokovi jo določi in sledi.
  { label: 'Odgovornosti niso jasne', category: 'planning' },
  // Peta možnost je nizka namenoma. Brez nje so bile vse štiri 'data' ali
  // 'planning' in najnižji dosegljivi delež je bil 0,65 — podjetje, katerega
  // nalogi zastajajo zaradi usposobljenosti ali menjav v ekipi, tega ni moglo
  // povedati in mu je ostal samo molk.
  { label: 'Usposobljenost oziroma menjava ljudi', category: 'people' },
];

export const nalogi: ModuleDefinition = {
  id: 'nalogi',
  title: 'Delovni nalogi in podatki',
  summary: 'Priprava in zaključevanje nalogov, prepisovanje med orodji in popravljanje napačnih podatkov.',
  triage: {
    prompt: 'Koliko ročnega dela imate s pripravo nalogov, papirji in prepisovanjem?',
    options: [
      { value: 0, label: 'Večina poteka digitalno' },
      { value: 1, label: 'Nekaj ur tedensko' },
      { value: 2, label: 'Vsak dan' },
      { value: 3, label: 'Za to je potreben skoraj cel človek' },
    ],
  },
  fields: [
    {
      key: 'orderAdminHoursPerMonth',
      label: 'Koliko skupnih ur mesečno porabite za pripravo, tiskanje, zbiranje in zaključevanje delovnih nalogov?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'retypingHoursPerMonth',
      label: 'Koliko skupnih ur mesečno porabite samo za prepisovanje podatkov med ERP-jem, Excelom in papirjem?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Ne vključujte priprave in zaključevanja nalogov iz prvega vprašanja.',
      explainer:
        'Isti podatek, vpisan drugič: z naloga v Excel, iz Excela v ERP, s papirja v sistem. Ocena: 3 ' +
        'ljudje × 30 min na dan ≈ 32 ur na mesec.',
    },
    {
      key: 'dataFixHoursPerMonth',
      label: 'Koliko ur mesečno porabite za popravljanje napačnih, manjkajočih ali neusklajenih podatkov?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'reportingTiming',
      label: 'Kdaj se dejanska poraba materiala in opravljeno delo evidentirata?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Sproti na terminalu' },
        { value: 1, label: 'Isti dan' },
        { value: 2, label: 'Naslednji dan' },
        { value: 3, label: 'Šele ob zaključku naloga' },
      ],
    },
    mainCauseField(NALOGI_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(NALOGI_CAUSES, input.mainCause);
    const rate = context.adminHourCostEUR;

    // Tri ločene postavke namesto ene vsote: razčlenitev tako pokaže, kje ročno
    // delo dejansko nastaja, in obiskovalec vidi, da vprašanja niso podvojena.
    return [
      {
        bucket: 'capacity',
        label: 'Priprava in zaključevanje nalogov',
        valueEUR: input.orderAdminHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.orderAdminHoursPerMonth,
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
    'Samodejno ustvarjanje delovnih nalogov',
    'Proizvodni terminali MT za sprotno poročanje',
    'Enoten vir podatkov namesto Excela ob ERP-ju',
  ],
};

// --- 5. Roki in nujni stroški -----------------------------------------------

const ZAMUDE_CAUSES: CauseOption[] = [
  { label: 'Plan in stanje proizvodnje nista pravočasno vidna', category: 'planning' },
  { label: 'Material ali zaloge niso pravočasno na voljo', category: 'planning' },
  { label: 'Prenos podatkov med prodajo, nabavo in proizvodnjo je ročen', category: 'data' },
  { label: 'Zunanji dobavitelji ali kupci', category: 'external' },
  { label: 'Zmogljivosti oziroma stroji', category: 'physical' },
];

export const zamude: ModuleDefinition = {
  id: 'zamude',
  title: 'Roki in nujni stroški',
  summary: 'Ekspresne nabave, penali, izgubljena marža in čas, porabljen za pojasnjevanje zamud kupcem.',
  triage: {
    prompt: 'Kako pogosto zamujate ali rešujete naročila nujno?',
    options: [
      { value: 0, label: 'Roke držimo' },
      { value: 1, label: 'Nekajkrat mesečno' },
      { value: 2, label: 'Tedensko' },
      { value: 3, label: 'Zamude so pogoste' },
    ],
  },
  fields: [
    {
      key: 'lateOrdersPerMonth',
      // "Od koliko naročil … jih" je spraševalo po imenovalcu, polje pa pričakuje
      // števec (enota naročil/mesec) — obiskovalec je lahko vpisal skupno število naročil.
      label: 'Koliko naročil mesečno odpremite z zamudo?',
      kind: 'number',
      unit: 'naročil/mesec',
      default: 0,
      contextOnly: true,
      help: 'Podatek ne vstopa v izračun — služi za oceno obsega težave.',
      explainer:
        'Koliko naročil na mesec ne odide v roku, ki ste ga potrdili kupcu. Če vodite dobavno točnost: ' +
        'delež zamud × število naročil.',
    },
    {
      key: 'expediteCostEUR',
      label: 'Koliko ste v zadnjih 12 mesecih porabili za ekspresne nabave ali dostave?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Samo dodatni strošek nad običajno nabavo oziroma dostavo.',
      explainer:
        'Samo doplačilo, ne celotna cena: razlika med nujno in redno izvedbo. Primer: nujna dostava 900 ' +
        'EUR namesto 300 EUR → vpišite 600 EUR.',
    },
    {
      key: 'penaltyCostEUR',
      label: 'Kolikšni so bili letni popusti, penali ali drugi neposredni stroški zaradi zamud?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
    },
    {
      key: 'lostMarginEUR',
      label: 'Kolikšno izgubljeno prispevno maržo ocenjujete zaradi odpovedanih naročil?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Ne vpisujte celotne vrednosti izgubljenega naročila.',
      explainer:
        'Ne vrednost naročila, ampak samo marža, ki bi vam od njega ostala. Primer: odpovedano naročilo ' +
        'za 50.000 EUR pri 25 % marži → 12.500 EUR.',
    },
    {
      key: 'customerCommsHoursPerMonth',
      label: 'Koliko ur mesečno porabite za obveščanje kupcev in usklajevanje zaradi zamud?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Ne vključujte ponovnega planiranja proizvodnje iz področja Plan.',
      explainer:
        'Klici, e-pošta in sestanki, ki jih ne bi bilo, če bi rok držal. Ocena: 8 zamud × 1,5 h ≈ 12 ur ' +
        'na mesec.',
    },
    mainCauseField(ZAMUDE_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(ZAMUDE_CAUSES, input.mainCause);

    return [
      {
        bucket: 'directLoss',
        label: 'Ekspresne nabave in dostave',
        valueEUR: input.expediteCostEUR,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Penali in popusti zaradi zamud',
        valueEUR: input.penaltyCostEUR,
        addressableShare,
      },
      {
        // Koš 'lostMargin' in ne 'directLoss': odpoved naročila je denar, ki ni nikoli
        // prišel, in stoji na predpostavki, kaj bi kupec storil. Odpis je denar, ki je
        // odtekel in ga je mogoče pokazati na kontu. Ker sta bili trditvi doslej v istem
        // košu, je prvi ugovor ("tega naročila morda tako ne bi dobili") podrl tudi
        // dokazljivi del naslovnega zneska.
        bucket: 'lostMargin',
        label: 'Izgubljena prispevna marža',
        valueEUR: input.lostMarginEUR,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Obveščanje in usklajevanje s kupci',
        valueEUR: input.customerCommsHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.customerCommsHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Planiranje potreb, ki zamudo pokaže vnaprej',
    'Statusi naročil in obveščanje kupcev iz ERP-ja',
    'Povezava nabave s proizvodnim planom',
  ],
};

// --- Kratka diagnostika -----------------------------------------------------

const DATA_RISK_NOTE: Record<RiskLevel, string> = {
  low: 'Poraba in delo se evidentirata sproti, lastna cena naloga je znana. Odstopanje opazite, ko ga je še mogoče popraviti.',
  medium:
    'Podatki so delni. Odstopanje od kalkulacije praviloma opazite šele ob obračunu, ko naloga ni več mogoče popraviti.',
  high: 'Dejanske porabe in lastne cene naloga ne poznate. Dokler tega ni, natančnega zneska izgubljene marže ni mogoče izračunati — in prav to je težava.',
};

const PROCESS_RISK_NOTE: Record<RiskLevel, string> = {
  low: 'Sledljivost je urejena in proizvodnja ni odvisna od posameznika.',
  medium: 'Sledljivost je delna. Ob resnejši reklamaciji je obseg odpoklica težko omejiti.',
  high: 'Sledljivosti praktično ni, znanje pa je v glavah posameznikov. Ena reklamacija ali odsotnost ključne osebe lahko ustavi več serij.',
};

/**
 * Štiri vprašanja, ki se prikažejo vedno in NE prispevajo nobenega evra.
 *
 * Namenoma brez zneska: kjer podjetje nima kalkulacije ali sledljivosti, natančnega
 * zneska ni mogoče izračunati, navidezno natančna številka pa bi prav to težavo
 * skrila. Modul zato nima triaže in ne more biti "največja postavka".
 */
export const diagnostika: ModuleDefinition = {
  id: 'diagnostika',
  title: 'Kratka diagnostika',
  summary: 'Štiri vprašanja o podatkih in odpornosti procesa. Ne prispevajo k finančnemu rezultatu.',
  fields: [
    {
      key: 'realtimeRecording',
      label: 'Ali sproti evidentirate dejansko porabo materiala in opravljeno delo?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'knowsUnitCost',
      label: 'Ali poznate dejanski strošek posameznega izdelka oziroma delovnega naloga?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'materialTraceability',
      label: 'Ali lahko zanesljivo sledite materialu od dobave do končnega izdelka?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'keyPersonIndependence',
      label: 'Ali proizvodnja deluje normalno tudi brez ključne osebe?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
  ],
  compute: (input) => {
    const dataLevel = assuranceRiskLevel(input.realtimeRecording, input.knowsUnitCost);
    const processLevel = assuranceRiskLevel(input.materialTraceability, input.keyPersonIndependence);

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
    'Kalkulacije lastne cene po izdelku in delovnem nalogu',
    'Serije in loti s popolno sledljivostjo',
    'Dokumentiran proces namesto znanja v glavah',
  ],
};

/** Vrstni red je hkrati prioriteta iz specifikacije — odloči ob izenačenju v triaži. */
export const PROIZVODNJA_MODULES: ModuleDefinition[] = [
  planiranje,
  material,
  zaloge,
  nalogi,
  zamude,
  diagnostika,
];
