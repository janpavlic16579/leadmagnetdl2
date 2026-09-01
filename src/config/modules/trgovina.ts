import { addressableShareOf, mainCauseField, type CauseOption } from './addressableShare';
import { UNANSWERED_CHOICE } from './moduleTypes';
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
import type { ModuleDefinition, RiskLevel } from './moduleTypes';

/**
 * Pet medsebojno izključujočih se stroškovnih področij za veleprodajo in distribucijo.
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
 * Področja sledijo poti blaga in denarja: naročilo -> skladišče -> zaloga ->
 * odprema -> plačilo. Meja med njimi je zato časovna in ne tematska, kar je edini
 * način, da si veleprodajalec ob vsakem vprašanju zna odgovoriti, ali "to sodi sem".
 *
 * En strošek je NAMENOMA neštet: fizično ponovno komisioniranje napačne pošiljke.
 * V področju Skladišče ga ni, ker je posledica napake pri odpremi; v področju
 * Odprema ga ni, ker se tam ure vrednotijo po administrativni postavki za
 * pisarniško reševanje reklamacije. Podštevanje je boljše od dvojnega štetja —
 * napihnjen znesek je edina napaka, ki jo bralec opazi takoj in mu vzame zaupanje
 * v celoten izračun.
 *
 * Maloprodaja ima svoja področja (maloprodaja.ts): polica, blagajna in manko so
 * drug posel z drugimi številkami.
 *
 * Strošek skladiščne in administrativne ure prideta iz konteksta: sta lastnost
 * podjetja, ne področja, in se vprašata enkrat v svojem koraku.
 */

// --- 1. Naročila, ponudbe in cene -------------------------------------------

const NAROCILA_CAUSES: CauseOption[] = [
  { label: 'Naročila prihajajo v več različnih oblikah', category: 'data' },
  { label: 'Ceniki, rabati in pogodbeni pogoji niso na enem mestu', category: 'data' },
  { label: 'Podatki se ročno prepisujejo med orodji', category: 'data' },
  // Potrjevanje cen je delovni tok, ki ga sistem določi — ne vprašanje discipline.
  { label: 'Odgovornosti pri potrjevanju cen niso jasne', category: 'planning' },
  { label: 'Kupci pogosto spreminjajo naročila', category: 'external' },
];

export const narocilaTrgovina: ModuleDefinition = {
  id: 'narocila_trgovina',
  title: 'Naročila, ponudbe in cene',
  summary:
    'Ročni vnos naročil in ponudb, prepisovanje med orodji in marža, izgubljena zaradi napačnih cen ali popustov.',
  triage: {
    prompt: 'Koliko ročnega dela imate z vnosom naročil, izdelavo ponudb in usklajevanjem cen?',
    options: [
      { value: 0, label: 'Naročila prihajajo večinoma digitalno' },
      { value: 1, label: 'Nekaj ur tedensko' },
      { value: 2, label: 'Vsak dan' },
      { value: 3, label: 'Za to je potreben skoraj cel človek' },
    ],
  },
  fields: [
    {
      key: 'orderChannel',
      label: 'Kako večinoma prejemate naročila kupcev?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Samodejno v ERP (EDI, spletni portal)' },
        { value: 1, label: 'Digitalno, a z ročnim vnosom v sistem' },
        { value: 2, label: 'E-pošta in telefon' },
        { value: 3, label: 'Telefon, papir, sprotni dogovor' },
      ],
    },
    {
      key: 'orderEntryHoursPerMonth',
      label: 'Koliko skupnih ur mesečno porabite za ročni vnos naročil in izdelavo ponudb?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Ne vključujte komisioniranja in priprave blaga — te ure sodijo v področje Skladišče.',
      explainer:
        'Ure od prejema naročila do vnosa v sistem in izdelave ponudbe: branje e-pošte, tipkanje postavk, ' +
        'preverjanje cen. Ocena: 2 komercialista × 2 h na dan ≈ 84 ur na mesec.',
    },
    {
      key: 'retypingHoursPerMonth',
      label:
        'Koliko skupnih ur mesečno porabite samo za prepisovanje istih podatkov med spletno trgovino, ERP-jem in Excelom?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Ne vključujte ur iz prejšnjega vprašanja — tam je prvi vnos naročila, tu podvojen prenos istega podatka.',
      explainer:
        'Isti podatek, prenesen drugič: iz ERP-ja v Excel, iz Excela v spletno trgovino. Ocena: 1 oseba × ' +
        '1 h na dan ≈ 21 ur na mesec.',
    },
    {
      key: 'priceFixHoursPerMonth',
      label:
        'Koliko ur mesečno porabite za urejanje cenikov in rabatov ter popravljanje napačno zaračunanih cen?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'annualPricingMarginLossEUR',
      label:
        'Kolikšno maržo ste v zadnjih 12 mesecih izgubili zaradi napačnih cen, pozabljenih rabatov ali zastarelih cenikov?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Samo razlika v marži, ne celotna vrednost računa. Dobropisi zaradi napačne pošiljke sodijo v področje Odprema.',
      explainer:
        'Samo razlika v marži, ne vrednost računa. Primer: 40 računov s po 250 EUR premalo zaračunane ' +
        'marže ≈ 10.000 EUR na leto.',
    },
    mainCauseField(NAROCILA_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(NAROCILA_CAUSES, input.mainCause);
    const rate = context.adminHourCostEUR;

    // Tri ločene postavke namesto ene vsote: razčlenitev pokaže, kje ročno delo
    // dejansko nastaja, in obiskovalec vidi, da vprašanja niso podvojena.
    return [
      {
        bucket: 'capacity',
        label: 'Ročni vnos naročil in ponudb',
        valueEUR: input.orderEntryHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.orderEntryHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Prepisovanje naročil med orodji',
        valueEUR: input.retypingHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.retypingHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Urejanje cenikov in popravljanje cen',
        valueEUR: input.priceFixHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.priceFixHoursPerMonth,
        addressableShare,
      },
      {
        // Koš 'lostMargin' in ne 'directLoss': marža, ki je nismo zaslužili, ker je bila
        // cena napačna, ni denar, ki bi ga bilo mogoče pokazati na kontu — stoji na oceni,
        // kaj bi kupec plačal ob pravi ceni. Ločen koš ohrani dokazljivi del naslovnega
        // zneska tudi takrat, ko sogovornik to oceno zavrne.
        bucket: 'lostMargin',
        label: 'Izgubljena marža zaradi napačnih cen',
        valueEUR: input.annualPricingMarginLossEUR,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Prevzem naročil prek spletne trgovine in EDI neposredno v dokument',
    'Cenik s pogodbenimi cenami, rabatnimi lestvicami in akcijami po kupcu',
    'Ponudba, naročilo in dobavnica iz enega dokumenta, brez ponovnega vnosa',
  ],
};

// --- 2. Skladišče in komisioniranje -----------------------------------------

const SKLADISCE_CAUSES: CauseOption[] = [
  { label: 'Lokacije blaga niso vodene ali niso ažurne', category: 'data' },
  { label: 'Stanje zalog v sistemu se ne ujema z dejanskim', category: 'data' },
  { label: 'Prevzemi se ne knjižijo sproti', category: 'data' },
  { label: 'Razporeditev in prostor skladišča', category: 'physical' },
  { label: 'Konice naročil in sezona', category: 'external' },
];

export const skladisceTrgovina: ModuleDefinition = {
  id: 'skladisce_trgovina',
  title: 'Skladišče in komisioniranje',
  summary:
    'Iskanje blaga, ročno urejanje prevzemov, inventure in nadure — čas, ki ga skladišče porabi, ne da bi blago prišlo bliže kupcu.',
  triage: {
    prompt:
      'Kako pogosto se v skladišču izgublja čas z iskanjem blaga, popravljanjem lokacij ali usklajevanjem stanj?',
    options: [
      { value: 0, label: 'Skladišče teče gladko' },
      { value: 1, label: 'Občasno' },
      { value: 2, label: 'Redno, z vplivom na odpremo' },
      { value: 3, label: 'Skoraj vsak dan' },
    ],
  },
  fields: [
    {
      key: 'pickingMethod',
      label: 'Kako danes komisionirate?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'S terminali in vodenimi lokacijami' },
        { value: 1, label: 'Z natisnjenim seznamom iz ERP-ja' },
        { value: 2, label: 'Delno ERP, delno Excel ali listek' },
        { value: 3, label: 'Po spominu in vprašanju sodelavca' },
      ],
    },
    {
      key: 'searchingHoursPerMonth',
      label:
        'Koliko skupnih človek-ur mesečno skladišče porabi za iskanje blaga, ki ni na pričakovani lokaciji?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Samo izgubljen čas iskanja, ne celotnega komisioniranja. Ponovno komisioniranje napačne pošiljke se namenoma ne šteje nikjer — raje podcenimo, kot da bi isto uro šteli dvakrat.',
      explainer:
        'Samo čas iskanja: hoja po skladišču, preverjanje, kje artikel je, klici sodelavcem. Ocena: 3 ' +
        'komisionarji × 20 min na izmeno ≈ 21 ur na mesec.',
    },
    {
      key: 'receivingHoursPerMonth',
      label: 'Koliko skupnih ur mesečno porabite za prevzeme, ki jih je treba ročno preverjati ali popravljati?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Reden prevzem brez odstopanj ne šteje — samo dodatno delo z neusklajenimi količinami in dokumenti.',
      explainer:
        'Dodatno delo, ko se količine ali dokumenti ne ujemajo: preštevanje, klici dobavitelju, popravki. ' +
        'Ocena: 15 spornih prevzemov × 1 h ≈ 15 ur na mesec.',
    },
    {
      key: 'stockCountHoursPerYear',
      label: 'Koliko skupnih človek-ur na leto porabite za inventure in vmesna preštevanja?',
      kind: 'number',
      unit: 'h/leto',
      default: 0,
      help: 'Letna vrednost, ker se inventura ne dogaja vsak mesec.',
      explainer:
        'Vse ure vseh ljudi skupaj, na leto. Primer: 10 ljudi × 8 h za inventuro + 4 preštevanja × 6 h ≈ ' +
        '104 ure.',
    },
    {
      key: 'warehouseOvertimeHoursPerMonth',
      label: 'Koliko nadur mesečno v skladišču povzročajo konice, zamude pri prevzemih ali iskanje blaga?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Ne vključujte nadur, ki so reden del sezonske razporeditve dela.',
      explainer:
        'Samo nadure zaradi nereda: konica ob zamujenem prevzemu, iskanje blaga, popravljanje napak. ' +
        'Ocena: 3 ljudje × 4 h ≈ 12 ur na mesec.',
    },
    mainCauseField(SKLADISCE_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(SKLADISCE_CAUSES, input.mainCause);
    const rate = context.operationalHourCostEUR;
    const searchingAndOvertime = input.searchingHoursPerMonth + input.warehouseOvertimeHoursPerMonth;

    return [
      {
        bucket: 'capacity',
        label: 'Iskanje blaga in nadure v skladišču',
        valueEUR: searchingAndOvertime * rate * MONTHS_PER_YEAR,
        hoursPerMonth: searchingAndOvertime,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Ročno urejanje prevzemov',
        valueEUR: input.receivingHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.receivingHoursPerMonth,
        addressableShare,
      },
      {
        // Edini letni vnos ur v datoteki — inventura se ne dogaja mesečno, zato tu
        // NI množenja z MONTHS_PER_YEAR. Mesečne ure so izpeljane nazaj, da se
        // seštevek sproščenih ur ne pokvari.
        bucket: 'capacity',
        label: 'Inventure in preštevanja',
        valueEUR: input.stockCountHoursPerYear * rate,
        hoursPerMonth: input.stockCountHoursPerYear / MONTHS_PER_YEAR,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Vodenje skladiščnih mest in lokacij',
    'Komisioniranje s terminali in črtno kodo namesto papirnatega seznama',
    'Sprotna inventura po lokacijah, brez zaustavitve skladišča',
  ],
};

// --- 3. Zaloge, nekurantnost in izpad prodaje -------------------------------

const ZALOGE_CAUSES: CauseOption[] = [
  { label: 'Naročamo po občutku, ne po obratu zaloge', category: 'planning' },
  { label: 'Stanje zalog v sistemu ni zanesljivo', category: 'data' },
  { label: 'Nabava in prodaja nista usklajeni', category: 'planning' },
  { label: 'Dobavitelji so nezanesljivi ali imajo dolge roke', category: 'external' },
  { label: 'Zalogo zavestno držimo kot varovalko', category: 'planning' },
];

export const zalogeTrgovina: ModuleDefinition = {
  id: 'zaloge_trgovina',
  title: 'Zaloge, nekurantnost in izpad prodaje',
  summary:
    'Blago, ki se ne obrača, marža, izgubljena zaradi manjkajočega artikla, in kapital, vezan v zalogah.',
  triage: {
    prompt: 'Kako pogosto imate hkrati preveč zaloge in premalo tistega, kar kupec res naroči?',
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
      label: 'Kolikšna je povprečna skupna vrednost zalog blaga?',
      kind: 'number',
      unit: 'EUR',
      default: 0,
      help: 'Vnesite nabavno vrednost blaga na zalogi, ne prodajne.',
      explainer:
        'Povprečno stanje med letom po nabavni vrednosti, ne prodajni. Vzemite postavko iz bilance ali ' +
        'povprečje nekaj mesečnih stanj.',
    },
    {
      key: 'annualWriteOffEUR',
      label:
        'Kolikšna je bila v zadnjih 12 mesecih vrednost odpisov, razprodaj pod nabavno ceno in razvrednotenj zaradi nekurantnosti?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
    },
    {
      key: 'annualStockoutMarginLossEUR',
      label: 'Kolikšno prispevno maržo ste v zadnjih 12 mesecih izgubili, ker blaga ni bilo na zalogi?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Samo izgubljena marža, ne celotna vrednost naročila. Ure iskanja in nadure v skladišču sodijo v področje Skladišče.',
      explainer:
        'Samo marža, ki je niste zaslužili, ker blaga ni bilo — ne vrednost naročila. Primer: 60 naročil ' +
        '× 800 EUR × 20 % marže ≈ 9.600 EUR na leto.',
    },
    reducibleShareField(
      'Kolikšen delež zalog bi po vaši oceni lahko znižali brez izgube prodaje?',
      { explainer: REDUCIBLE_STOCK_EXPLAINER },
    ),
    {
      key: 'stockVisibility',
      label: 'Kako dober je vaš pregled nad dejansko zalogo po artiklu?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Sproten in po lokacijah' },
        { value: 1, label: 'Večinoma zanesljiv' },
        { value: 2, label: 'Deloma ERP, deloma Excel' },
        { value: 3, label: 'Zanesljivo šele po inventuri' },
      ],
    },
    mainCauseField(ZALOGE_CAUSES),
  ],
  compute: (input) => {
    const addressableShare = addressableShareOf(ZALOGE_CAUSES, input.mainCause);

    return [
      {
        bucket: 'directLoss',
        label: 'Odpisi in nekurantna zaloga',
        valueEUR: input.annualWriteOffEUR,
        addressableShare,
      },
      {
        // Koš 'lostMargin' in ne 'directLoss': prodaja, do katere ni prišlo, stoji na
        // predpostavki, da bi kupec kupil, če bi blago bilo. Maloprodaja isto postavko
        // vodi v 'lostMargin' (maloprodaja.ts, prazna polica) — vzorec je enoten.
        bucket: 'lostMargin',
        label: 'Izgubljena marža zaradi manjkajočega blaga',
        valueEUR: input.annualStockoutMarginLossEUR,
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
    'Minimalne zaloge, točke naročanja in samodejni predlogi nabave',
    'ABC analiza obrata in pregled ležeče zaloge po artiklu',
    'Skladišča, lokacije, serije in roki uporabnosti',
  ],
};

// --- 4. Odprema, vračila in reklamacije -------------------------------------

const ODPREMA_CAUSES: CauseOption[] = [
  { label: 'Podatki o artiklih, količinah ali pakiranju niso zanesljivi', category: 'data' },
  { label: 'Odprema poteka brez preverjanja s črtno kodo', category: 'data' },
  { label: 'Naslovi in podatki o dostavi se prepisujejo ročno', category: 'data' },
  // Ostaja people: manjkajočo kontrolo pokriva sosednja možnost o črtni kodi,
  // ta pa opisuje napako kljub kontrolam in pomanjkanje usposabljanja.
  { label: 'Napake pri izvedbi oziroma pomanjkanje usposabljanja', category: 'people' },
  { label: 'Prevozniki in zunanje dostave', category: 'external' },
];

export const odpremaTrgovina: ModuleDefinition = {
  id: 'odprema_trgovina',
  title: 'Odprema, vračila in reklamacije',
  summary:
    'Napačne in nepopolne pošiljke: ponovne dostave, dobropisi, vračila in čas, porabljen za reševanje reklamacij.',
  triage: {
    prompt: 'Kako pogosto pošiljka odide narobe — napačen artikel, količina ali naslov?',
    options: [
      { value: 0, label: 'Skoraj nikoli' },
      { value: 1, label: 'Nekajkrat mesečno' },
      { value: 2, label: 'Tedensko' },
      { value: 3, label: 'Pri velikem deležu pošiljk' },
    ],
  },
  fields: [
    {
      key: 'shipmentsPerMonth',
      label: 'Koliko pošiljk mesečno odpremite?',
      kind: 'number',
      unit: 'pošiljk/mesec',
      default: 0,
      contextOnly: true,
      help: 'Podatek ne vstopa v izračun — služi za oceno obsega težave.',
      explainer: 'Skupno število odpremljenih pošiljk na mesec; groba ocena zadostuje.',
    },
    {
      key: 'annualRedeliveryCostEUR',
      label:
        'Koliko ste v zadnjih 12 mesecih porabili za ponovne in nujne dostave zaradi napačnih ali nepopolnih pošiljk?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Samo dodatni prevozni in manipulativni strošek nad običajno dostavo.',
      explainer:
        'Samo doplačilo nad redno dostavo, ne celotna cena prevoza. Ocena: 50 ponovnih dostav × 45 EUR ≈ ' +
        '2.250 EUR na leto.',
    },
    {
      key: 'annualCreditNoteEUR',
      label: 'Kolikšna je bila letna vrednost dobropisov, popustov in odškodnin zaradi napak pri odpremi?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Ne vpisujte dobropisov zaradi napačno zaračunane cene — ti sodijo v področje Naročila.',
      explainer:
        'Dobropisi in popusti, izdani zato, ker je bila pošiljka napačna, nepopolna ali poškodovana. ' +
        'Seštejte zadnjih 12 mesecev.',
    },
    {
      key: 'annualReturnedGoodsLossEUR',
      label:
        'Kolikšne vrednosti vrnjenega blaga v zadnjih 12 mesecih ni bilo mogoče znova prodati po polni ceni?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Samo izguba vrednosti vrnjenega blaga. Ležeča zaloga brez vračila sodi v področje Zaloge.',
      explainer:
        'Samo izguba vrednosti, ne celotna vrednost vrnjenega blaga: poškodovana embalaža, odprt artikel, ' +
        'znižanje ob nadaljnji prodaji.',
    },
    {
      key: 'claimHandlingHoursPerMonth',
      label:
        'Koliko ur mesečno porabite za reševanje reklamacij, usklajevanje s kupci in prevozniki ter urejanje vračil?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Samo pisarniške ure. Ur skladišča tu ne štejte — izračun jih raje izpusti, kot da bi jih štel dvakrat.',
      explainer:
        'Pisarniške ure: sprejem reklamacije, dogovor s kupcem, izdaja dobropisa. Ocena: 25 reklamacij × ' +
        '40 min ≈ 17 ur na mesec.',
    },
    mainCauseField(ODPREMA_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(ODPREMA_CAUSES, input.mainCause);

    return [
      {
        bucket: 'directLoss',
        label: 'Ponovne in nujne dostave',
        valueEUR: input.annualRedeliveryCostEUR,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Dobropisi in odškodnine',
        valueEUR: input.annualCreditNoteEUR,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Izguba vrednosti vrnjenega blaga',
        valueEUR: input.annualReturnedGoodsLossEUR,
        addressableShare,
      },
      {
        // Ure reklamacij so že plačan čas komerciale — sproščene ure ne znižajo
        // plačne mase, zato so kapaciteta in ne denar, ki odteka.
        bucket: 'capacity',
        label: 'Reševanje reklamacij in vračil',
        valueEUR: input.claimHandlingHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.claimHandlingHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Preverjanje odpreme s črtno kodo in terminali',
    'Dobavnica, dobropis in vračilo iz istega dokumenta s polno sledljivostjo',
    'Sledenje serijam in lotom do vzroka reklamacije',
  ],
};

// --- 5. Plačilni roki in terjatve -------------------------------------------

const TERJATVE_CAUSES: CauseOption[] = [
  { label: 'Opominjanje ni sistematično oziroma se začne prepozno', category: 'planning' },
  { label: 'Stanje odprtih postavk ni sproti vidno', category: 'data' },
  { label: 'Računi odidejo z zamudo ali z napako', category: 'data' },
  { label: 'Bonitete kupcev pred prodajo ne preverjamo', category: 'planning' },
  { label: 'Plačilna disciplina na trgu', category: 'external' },
];

export const terjatveTrgovina: ModuleDefinition = {
  id: 'terjatve_trgovina',
  usesRevenue: true,
  title: 'Plačilni roki in terjatve',
  summary:
    'Strošek denarja, ki predolgo čaka na kupca, čas za opominjanje in izterjavo ter odpisane terjatve.',
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
    {
      key: 'currentDSODays',
      label: 'Kolikšen je povprečen dejanski plačilni rok kupcev (DSO)?',
      kind: 'number',
      unit: 'dni',
      default: 0,
      contextOnly: true,
      help: 'Podatek ne vstopa v izračun — služi za primerjavo z dogovorjenim rokom.',
      explainer:
        'Povprečno število dni od izdaje računa do plačila. Izračun: odprte terjatve ÷ letni prihodek × ' +
        '365.',
    },
    // Prihodek pride iz skupne finančne osnove (contexts/trgovina.ts) — je lastnost
    // podjetja, ne področja, in mora obstajati tudi, kadar to področje ni izbrano.
    {
      key: 'overdueDaysAverage',
      label: 'Za koliko dni povprečno kupci prekoračijo dogovorjeni plačilni rok?',
      kind: 'number',
      unit: 'dni',
      default: 0,
      help: 'Samo prekoračitev NAD dogovorjenim rokom. Financiranje dogovorjenega roka je normalno poslovanje in ni strošek napake.',
      explainer:
        'Samo dnevi NAD dogovorjenim rokom. Primer: dogovorjeno 30 dni, kupci plačajo v 45 → vpišite 15.',
    },
    {
      key: 'dunningHoursPerMonth',
      label: 'Koliko ur mesečno porabite za opominjanje, usklajevanje odprtih postavk in izterjavo?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Ne vključujte reševanja reklamacij in dobropisov — ti sodijo v področje Odprema.',
      explainer:
        'Ure za opominjanje, usklajevanje odprtih postavk in izterjavo. Ocena: 1 oseba × 4 h na teden ≈ ' +
        '17 ur na mesec.',
    },
    {
      key: 'annualBadDebtEUR',
      label: 'Kolikšna je bila v zadnjih 12 mesecih vrednost odpisanih ali neizterljivih terjatev?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
    },
    mainCauseField(TERJATVE_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(TERJATVE_CAUSES, input.mainCause);
    const dailyRevenue = context.annualRevenueEUR / 365;

    return [
      {
        bucket: 'directLoss',
        label: 'Strošek zamud pri plačilih',
        valueEUR: dailyRevenue * input.overdueDaysAverage * context.capitalCostRate,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Opominjanje in izterjava',
        valueEUR: input.dunningHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.dunningHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Odpisane terjatve',
        valueEUR: input.annualBadDebtEUR,
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

// --- Kratka diagnostika -----------------------------------------------------

const DATA_RISK_NOTE: Record<RiskLevel, string> = {
  low: 'Zaloga in marža sta znani sproti. Odstopanje opazite, ko ga je še mogoče popraviti.',
  medium:
    'Podatki so delni. Razliko praviloma opazite šele ob inventuri ali mesečnem obračunu, ko cen in naročil ni več mogoče popraviti.',
  high: 'Dejanske zaloge in marže po artiklu ne poznate. Dokler je tako, natančnega zneska izgubljene marže ni mogoče izračunati — in prav to je težava.',
};

const PROCESS_RISK_NOTE: Record<RiskLevel, string> = {
  low: 'Sledljivost je urejena in odprema ni odvisna od posameznika.',
  medium: 'Sledljivost je delna. Ob resnejši reklamaciji je vzrok težko dokazati.',
  high: 'Sledljivosti praktično ni, znanje pa je v glavah posameznikov. Ena reklamacija ali odsotnost ključne osebe lahko ustavi odpremo.',
};

/**
 * Štiri vprašanja, ki se prikažejo vedno in NE prispevajo nobenega evra.
 *
 * Namenoma brez zneska: kjer veleprodajalec ne pozna marže po artiklu ali nima
 * sledljivosti pošiljke, natančnega zneska ni mogoče izračunati, navidezno natančna
 * številka pa bi prav to težavo skrila. Modul zato nima triaže in ne more biti
 * "največja postavka".
 */
export const diagnostikaTrgovina: ModuleDefinition = {
  id: 'diagnostika_trgovina',
  title: 'Kratka diagnostika',
  summary: 'Štiri vprašanja o podatkih in odpornosti procesa. Ne prispevajo k finančnemu rezultatu.',
  fields: [
    {
      key: 'stockAccuracy',
      label: 'Ali se stanje zalog v sistemu ujema z dejanskim stanjem v skladišču?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'knowsItemMargin',
      label: 'Ali poznate dejansko maržo po artiklu in po kupcu, z rabati in stroški dostave vred?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'shipmentTraceability',
      label: 'Ali lahko za posamezno pošiljko zanesljivo ugotovite, kdo, kdaj in kaj je komisioniral?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'keyPersonIndependence',
      label: 'Ali skladišče in prodaja delujeta normalno tudi brez ključne osebe?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
  ],
  compute: (input) => {
    const dataLevel = assuranceRiskLevel(input.stockAccuracy, input.knowsItemMargin);
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
    'Kalkulacija marže po artiklu, kupcu in dokumentu',
    'Sledljivost serij, lotov in komisioniranja po uporabniku',
    'Dokumentiran proces namesto znanja v glavah',
  ],
};

/** Vrstni red je hkrati prioriteta — odloči ob izenačenju v triaži. */
export const TRGOVINA_MODULES: ModuleDefinition[] = [
  narocilaTrgovina,
  skladisceTrgovina,
  zalogeTrgovina,
  odpremaTrgovina,
  terjatveTrgovina,
  diagnostikaTrgovina,
];
