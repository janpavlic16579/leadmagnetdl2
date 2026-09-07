import { addressableShareOf, mainCauseField, type CauseOption } from './addressableShare';
import { UNANSWERED_CHOICE } from './moduleTypes';
import type { ModuleDefinition, RiskLevel } from './moduleTypes';
import {
  ASSURANCE_CHOICES,
  ASSURANCE_UNANSWERED,
  ASSURANCE_UNANSWERED_NOTE,
  MONTHS_PER_YEAR,
  REDUCIBLE_STOCK_EXPLAINER,
  assuranceRiskLevel,
  reducibleShareField,
  reducibleShareOf,
} from './shared';

/**
 * Pet medsebojno izključujočih se stroškovnih področij za živilsko proizvodnjo
 * (SKD C10 in C11: meso, mleko, pekarstvo, pijače, predelava).
 *
 * Zakaj svoj segment in ne splošna proizvodnja: mesar, mlekar in pek so
 * proizvajalci, a njihova bolečina ni izmet in delovni nalog. Je donos šarže,
 * rok uporabnosti in sledljivost ob odpoklicu — trije pojmi, ki jih splošni
 * proizvodni vprašalnik sploh ne vpraša. Nabor področij sledi katalogu bolečin
 * iz raziskave panoge (Datalab_raziskava_ZIVILSKA_INDUSTRIJA_model.xlsx, list
 * Katalog_bolecin): prvih pet po prednosti so odstopanje donosa (B02), odpisi
 * zaradi roka (B03), zaloge s kratkim rokom (B08), sledljivost ob odpoklicu
 * (B01) in HACCP na papirju (B04). Osrednja teza raziskave: vstopna točka je
 * sledljivost in odpoklic, ne prihranek administracije.
 *
 * Veljata isti dve načeli kot v proizvodnja.ts:
 *
 * 1. compute() vrne DEJANSKI sedanji strošek — brez množenja z deležem izboljšave.
 *    Koliko je od tega mogoče nasloviti, izračuna motor iz glavnega vzroka.
 * 2. Ista ura ali evro se ne sme pojaviti v dveh področjih. Meje so v besedilih
 *    help: kalo med proizvodnjo je Donos, potekli rok je Roki; reklamacija zaradi
 *    kakovosti je Sledljivost, odbitek zaradi nedobave pa Naročila; HACCP zapis
 *    je Kakovost, zapis porabe šarže pa Donos.
 *
 * Kar PANTHEON ne pokriva, ni obljubljeno: elektronske HACCP evidence in
 * temperaturni zapisi so praviloma zunanji sistem (raziskava, list
 * PANTHEON_zemljevid), zato ima ta postavka mejo naslovljivosti in alineje
 * "PANTHEON naslavlja" govorijo o podatkih okoli zapisa, ne o zapisu samem.
 */

// --- 1. Donos, kalo in recepture --------------------------------------------

const DONOS_CAUSES: CauseOption[] = [
  { label: 'Recepture in normativi niso ažurni ali obstajajo v več verzijah', category: 'data' },
  { label: 'Poraba surovin in izhod šarže se ne beležita sproti', category: 'data' },
  // Nepostavljen proces: kalkulacija, ki donosa ne meri, odstopanja tudi ne išče.
  { label: 'Kalkulacija ne upošteva dejanskega donosa, zato odstopanja nihče ne išče', category: 'planning' },
  { label: 'Napake pri tehtanju in izvedbi oziroma menjave ljudi', category: 'people' },
  { label: 'Nihanje kakovosti surovine ali oprema', category: 'physical' },
];

export const donos_zivilstvo: ModuleDefinition = {
  id: 'donos_zivilstvo',
  title: 'Donos, kalo in recepture',
  summary:
    'Razlika med teoretičnim in dejanskim donosom šarže, ročno beleženje porabe in ponovna predelava neustreznih šarž.',
  triage: {
    prompt: 'Kako pogosto je dejanski izhod šarže občutno manjši od tistega po recepturi?',
    options: [
      { value: 0, label: 'Donos držimo po recepturi' },
      { value: 1, label: 'Občasno, pri posameznih izdelkih' },
      { value: 2, label: 'Redno, razlike ne poznamo natančno' },
      { value: 3, label: 'Donosa sploh ne merimo' },
    ],
  },
  fields: [
    {
      key: 'annualRawMaterialSpendEUR',
      label: 'Kolikšna je letna vrednost porabljenih surovin in embalaže?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Nabavna vrednost surovin, dodatkov in embalaže v zadnjih 12 mesecih — brez energije in dela.',
      explainer:
        'Vzemite postavko stroški materiala iz izkaza ali vsoto računov dobaviteljev surovin in embalaže. ' +
        'Primer: 2,5 mio EUR prihodkov pri 55 % deležu surovin ≈ 1,4 mio EUR.',
    },
    {
      key: 'yieldLossPercent',
      label:
        'Kolikšen delež surovine izgubite kot razliko med teoretičnim donosom po recepturi in dejanskim izhodom šarže?',
      kind: 'percent',
      min: 0,
      // Zgornja meja 0,20: pri sveži predelavi (meso, sadje) je odstopanje nad 10 %
      // realno, prejšnja proizvodna meja 0,15 bi take vnose tiho obrezala.
      max: 0.2,
      step: 0.005,
      // Privzetek 0 in ne panožno povprečje: skupaj z vrednostjo surovin je to zmnožek
      // dveh polj, zato bi vsak privzetek nad 0 ustvaril znesek že ob vpisu same
      // vrednosti surovin. Delež je edino polje, ki trdi, da težava obstaja.
      default: 0,
      help:
        'Samo izguba nad tehnološko nujnim kalom, ki ga receptura že upošteva. Odpise zaradi poteka roka merimo ' +
        'posebej v področju Roki uporabnosti.',
      explainer:
        'Primerjajte, koliko izdelka bi po recepturi moralo nastati iz porabljene surovine, in koliko ga je res ' +
        'nastalo. Primer: iz 1.000 kg surovine po recepturi 900 kg izdelka, dejansko 855 kg → 5 %.',
    },
    {
      key: 'batchRecordingHoursPerMonth',
      label:
        'Koliko skupnih ur mesečno gre za ročno beleženje porabe surovin in izhoda šarž ter prepis teh zapisov v Excel ali sistem?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Zapis na proizvodnem listu in prepis. HACCP in temperaturne evidence merimo posebej v področju Kakovost.',
      explainer:
        'Tehtanje in vpis na proizvodni list, nato prepis v preglednico ali program — isti podatek, vpisan ' +
        'dvakrat. Ocena: 3 linije × 30 min na dan × 21 dni ≈ 32 ur na mesec.',
    },
    {
      key: 'reworkHoursPerMonth',
      label:
        'Koliko skupnih ur mesečno porabite za ponovno predelavo, prebiranje ali prepakiranje neustreznih šarž?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'recipeControl',
      label: 'Kje so danes recepture in kdo jih spreminja?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'V sistemu, z verzijami in datumom' },
        { value: 1, label: 'V Excelu pri tehnologu' },
        { value: 2, label: 'V mapah na papirju' },
        { value: 3, label: 'V glavi tehnologa ali mojstra' },
      ],
    },
    mainCauseField(DONOS_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(DONOS_CAUSES, input.mainCause);

    return [
      {
        bucket: 'directLoss',
        label: 'Odstopanje donosa in kalo nad recepturo',
        valueEUR: input.annualRawMaterialSpendEUR * input.yieldLossPercent,
        addressableShare,
        // Odstopanje donosa ima biološko dno: surovina niha po sezoni, vlagi in
        // maščobi tudi ob popolnih podatkih. Raziskava panoge (Predpostavke A16
        // in A17) računa z realizacijo 40–80 % izmerjene izboljšave; brez te meje
        // bi vzrok "recepture niso ažurne" trdil, da je odpravljivih 75 % vsakega
        // odstopanja. Isti razlog kot addressableCap pri izmetu v proizvodnja.ts.
        addressableCap: 0.6,
      },
      {
        // Zapis na liniji opravi operater med delom, zato neposredna ura; prepis
        // je manjši del in bi ga ločena postavka po administrativni uri prej
        // zameglila kot razjasnila.
        bucket: 'capacity',
        label: 'Ročno beleženje in prepis porabe šarž',
        valueEUR: input.batchRecordingHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.batchRecordingHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Ponovna predelava in prepakiranje šarž',
        valueEUR: input.reworkHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.reworkHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Recepture kot normativi z verzijami in dejanskim donosom po šarži',
    'Javljanje porabe in izhoda šarže na proizvodnem terminalu',
    'Kalkulacija lastne cene izdelka na dejanski, ne teoretični donos',
  ],
};

// --- 2. Roki uporabnosti, zaloge in odpisi ----------------------------------

const ROKI_CAUSES: CauseOption[] = [
  { label: 'Zaloge s kratkim rokom niso vidne pravočasno', category: 'data' },
  { label: 'Naročanje surovin ni vezano na plan proizvodnje in naročila kupcev', category: 'planning' },
  { label: 'Izdaja ne poteka po roku uporabnosti (FEFO)', category: 'planning' },
  { label: 'Nihanje naročil kupcev in trgovskih verig', category: 'external' },
  { label: 'Zalogo zavestno držimo kot varovalko', category: 'planning' },
];

export const roki_zivilstvo: ModuleDefinition = {
  id: 'roki_zivilstvo',
  title: 'Roki uporabnosti, zaloge in odpisi',
  summary:
    'Odpisi zaradi poteka roka, inventurne razlike v hladilnicah in kapital, vezan v surovinah in gotovih izdelkih.',
  triage: {
    prompt: 'Kako pogosto odpisujete surovine ali izdelke zaradi poteka roka uporabnosti?',
    options: [
      { value: 0, label: 'Skoraj nikoli' },
      { value: 1, label: 'Nekajkrat na leto' },
      { value: 2, label: 'Vsak mesec' },
      { value: 3, label: 'Vsak teden' },
    ],
  },
  fields: [
    {
      key: 'inventoryValueEUR',
      label: 'Kolikšna je povprečna skupna vrednost zalog surovin, embalaže in gotovih izdelkov?',
      kind: 'number',
      unit: 'EUR',
      default: 0,
      help: 'Povprečno stanje med letom po nabavni oziroma lastni ceni — vključno s hladilnicami in zamrzovalnicami.',
      explainer:
        'Povprečje nekaj mesečnih stanj ali postavka zaloge iz bilance — ne stanje na današnji dan in ne ' +
        'letna poraba. Primer: 180.000 EUR surovin + 40.000 EUR embalaže + 220.000 EUR izdelkov ≈ 440.000 EUR.',
    },
    {
      key: 'annualExpiryWriteOffEUR',
      label:
        'Kolikšna je bila v zadnjih 12 mesecih vrednost odpisov in razprodaj pod ceno zaradi poteka ali kratkega roka uporabnosti?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Surovine in gotovi izdelki. Kalo med proizvodnjo merimo posebej v področju Donos.',
      explainer:
        'Vsota odpisov s konta plus razlika v ceni pri razprodajah izdelkov s kratkim rokom. Primer: 14 odpisov ' +
        '× 600 EUR + 5.000 EUR znižanj ≈ 13.400 EUR na leto.',
    },
    {
      key: 'annualStockDifferenceEUR',
      label:
        'Kolikšne so bile v zadnjih 12 mesecih inventurne razlike v skladiščih, hladilnicah in zamrzovalnicah?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Samo neto manko po inventuri — brez odpisov zaradi roka iz prejšnjega vprašanja.',
      explainer:
        'Razlika med knjižnim in dejanskim stanjem ob letni ali ciklični inventuri, v evrih. Če vodite samo ' +
        'količine, jih pomnožite z nabavno ceno. Primer: 1,2 % od 440.000 EUR ≈ 5.300 EUR.',
    },
    reducibleShareField(
      'Kolikšen delež zalog bi po vaši oceni lahko trajno zmanjšali, ne da bi zmanjkalo surovine za proizvodnjo ali izdelka za kupca?',
      { explainer: REDUCIBLE_STOCK_EXPLAINER },
    ),
    {
      key: 'fefoPractice',
      label: 'Kako izdajate zalogo glede na rok uporabnosti?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Sistem predlaga po roku (FEFO)' },
        { value: 1, label: 'Skladiščnik izbere sam, roki so vidni' },
        { value: 2, label: 'Po vrsti prevzema (FIFO), brez rokov' },
        { value: 3, label: 'Kakor pride pod roko' },
      ],
    },
    mainCauseField(ROKI_CAUSES),
  ],
  compute: (input) => {
    const addressableShare = addressableShareOf(ROKI_CAUSES, input.mainCause);
    const reducibleShare = reducibleShareOf(input.reducibleShare);

    return [
      {
        bucket: 'directLoss',
        label: 'Odpisi zaradi poteka roka uporabnosti',
        valueEUR: input.annualExpiryWriteOffEUR,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Inventurne razlike v skladiščih in hladilnicah',
        valueEUR: input.annualStockDifferenceEUR,
        addressableShare,
      },
      {
        // Brez addressableShare: ta znesek JE potencial, ne sedanji strošek.
        bucket: 'oneTimeCapital',
        label: 'Sprostljiv obratni kapital v zalogah',
        valueEUR: input.inventoryValueEUR * reducibleShare,
      },
    ];
  },
  pantheon: [
    'Roki uporabnosti in serije na zalogi, izdaja po načelu FEFO',
    'Več skladišč, hladilnic in lokacij z izpisom zaloge po preostalem roku',
    'Planiranje potreb po surovinah iz naročil kupcev in receptur',
  ],
};

// --- 3. Sledljivost šarž, reklamacije in odpoklic ---------------------------

const SLEDLJIVOST_CAUSES: CauseOption[] = [
  { label: 'Šarža dobavitelja se ob prevzemu ne zabeleži', category: 'data' },
  { label: 'Šarža ni na dobavnici kupcu', category: 'data' },
  { label: 'Proizvodnja, kakovost in prodaja vodijo ločene evidence', category: 'data' },
  { label: 'Reklamacije rešujemo vsak po svoje, brez enotnega postopka', category: 'planning' },
  { label: 'Napake izvirajo pri dobaviteljih surovin', category: 'external' },
];

export const sledljivost_zivilstvo: ModuleDefinition = {
  id: 'sledljivost_zivilstvo',
  title: 'Sledljivost šarž, reklamacije in odpoklic',
  summary:
    'Ročno sestavljanje sledljivosti šarže, reševanje reklamacij brez znane šarže ter dobropisi in stroški odpoklicev.',
  triage: {
    prompt:
      'Kako hitro bi ob reklamaciji ali odpoklicu ugotovili, katere surovine so šle v šaržo in kateri kupci so jo prejeli?',
    options: [
      { value: 0, label: 'V nekaj minutah, iz sistema' },
      { value: 1, label: 'V nekaj urah, iz evidenc' },
      { value: 2, label: 'V nekaj dneh, s papirji in klici' },
      { value: 3, label: 'Ne bi mogli z gotovostjo' },
    ],
  },
  fields: [
    {
      key: 'traceHoursPerMonth',
      label:
        'Koliko ur mesečno gre za ročno iskanje in sestavljanje sledljivosti — šarže dobaviteljev, izdaje v proizvodnjo, dobavnice kupcem?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help:
        'Ob reklamacijah, presojah, zahtevah trgovcev in vajah odpoklica. Pripravo na presojo kot celoto merimo ' +
        'v področju Kakovost.',
      explainer:
        'Čas, ko nekdo lista prevzemnice, proizvodne liste in dobavnice, da sestavi pot ene šarže. Ocena: 6 ' +
        'zahtev × 3 h ≈ 18 ur na mesec.',
    },
    {
      key: 'claimHoursPerMonth',
      label: 'Koliko ur mesečno porabite za reševanje reklamacij kupcev in iskanje vzroka?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Sprejem, pregled, komunikacija s kupcem in dobaviteljem. Ur sledljivosti iz prejšnjega vprašanja ne ponavljajte.',
      explainer:
        'Pisarniški in tehnološki čas na reklamacijo: pregled vzorca, zapis, odgovor kupcu, uveljavljanje pri ' +
        'dobavitelju surovine. Ocena: 8 reklamacij × 2 h ≈ 16 ur na mesec.',
    },
    {
      key: 'annualClaimCostEUR',
      label:
        'Kolikšni so bili v zadnjih 12 mesecih neposredni stroški reklamacij — dobropisi, vračila, nadomestne dobave, uničenje?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Brez stroškov odpoklica iz naslednjega vprašanja in brez izdelkov, odpisanih zaradi roka.',
      explainer:
        'Denar, ki je odtekel zaradi reklamacij: dobropis kupcu, prevzem in uničenje vrnjenega blaga, nadomestna ' +
        'dostava. Ocena: 30 reklamacij × 350 EUR ≈ 10.500 EUR na leto.',
    },
    {
      key: 'annualRecallCostEUR',
      label:
        'Koliko so vas v zadnjih 12 mesecih stali odpoklici ali umiki s trga — umik, uničenje, obveščanje, izpad prodaje?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Če odpoklica ni bilo, pustite 0 — to je podatek, ne izgovor.',
      explainer:
        'Vse, kar je odpoklic stal: prevzem blaga s polic, uničenje, obveščanje kupcev in inšpekcije, nadomestna ' +
        'proizvodnja. Ocenite po zadnjem dogodku; brez dogodka pustite 0.',
    },
    {
      key: 'recallDrill',
      label: 'Kako pogosto izvedete vajo odpoklica (simulacijo sledljivosti ene šarže)?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Vsaj vsako četrtletje, z merjenjem časa' },
        { value: 1, label: 'Enkrat na leto, pred presojo' },
        { value: 2, label: 'Samo kadar jo zahteva presoja ali inšpekcija' },
        { value: 3, label: 'Nikoli' },
      ],
    },
    mainCauseField(SLEDLJIVOST_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(SLEDLJIVOST_CAUSES, input.mainCause);
    const rate = context.adminHourCostEUR;

    return [
      {
        bucket: 'capacity',
        label: 'Ročno sestavljanje sledljivosti',
        valueEUR: input.traceHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.traceHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Reševanje reklamacij in iskanje vzroka',
        valueEUR: input.claimHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.claimHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Dobropisi, vračila in uničenje ob reklamacijah',
        valueEUR: input.annualClaimCostEUR,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Stroški odpoklicev in umikov s trga',
        valueEUR: input.annualRecallCostEUR,
        addressableShare,
        // Sledljivost odpoklic OMEJI na eno šaržo, ne prepreči ga — vzrok je v
        // surovini ali procesu, ne v evidenci. Raziskava panoge (Predpostavke A19)
        // računa z znižanjem tveganja 10–45 %; 0,5 je zgornji rob tega razpona.
        // Brez meje bi vzrok "šarža ni na dobavnici" trdil, da je odpravljivih
        // 75 % stroška odpoklica, kar ni mogoče niti načeloma.
        addressableCap: 0.5,
      },
    ];
  },
  pantheon: [
    'Serije in šarže od prevzema surovine prek proizvodnje do dobavnice kupcu',
    'Izsleditev šarže v obe smeri z eno poizvedbo, brez listanja evidenc',
    'Reklamacijski postopek s statusi, vezan na šaržo in dobavitelja',
  ],
};

// --- 4. HACCP evidence, deklaracije in presoje ------------------------------

const KAKOVOST_CAUSES: CauseOption[] = [
  { label: 'Evidence so na papirju in ločene od sistema', category: 'data' },
  { label: 'Recepture, deklaracije in šifranti niso povezani', category: 'data' },
  { label: 'Dokazila za presojo zbiramo vsakič znova, ker niso na enem mestu', category: 'data' },
  { label: 'Zahteve trgovcev in presojevalcev se pogosto spreminjajo', category: 'external' },
  { label: 'Premalo ljudi oziroma znanje pri eni osebi', category: 'people' },
];

export const kakovost_zivilstvo: ModuleDefinition = {
  id: 'kakovost_zivilstvo',
  title: 'HACCP evidence, deklaracije in presoje',
  summary:
    'Ročne HACCP in temperaturne evidence, priprava na presoje in inšpekcije ter posodabljanje deklaracij in alergenov.',
  triage: {
    prompt: 'Koliko ročnega dela zahtevajo HACCP evidence, priprava na presoje in deklaracije?',
    options: [
      { value: 0, label: 'Malo — evidence so elektronske' },
      { value: 1, label: 'Nekaj ur na teden' },
      { value: 2, label: 'Vsak dan po nekaj ur' },
      { value: 3, label: 'Pred presojo se ustavi pol podjetja' },
    ],
  },
  fields: [
    {
      key: 'haccpHoursPerMonth',
      label:
        'Koliko skupnih ur mesečno gre za ročno vodenje HACCP evidenc in temperaturnih zapisov na papirju ter njihov prepis?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help:
        'Kritične kontrolne točke, temperature hladilnic in vozil, čiščenje. Beleženje porabe in izhoda šarž ' +
        'merimo v področju Donos.',
      explainer:
        'Vsak zapis na kontrolni točki in vsak temperaturni obhod, nato prepis in arhiviranje listov. Ocena: 4 ' +
        'točke × 3 zapisi na dan × 5 min × 30 dni ≈ 30 ur na mesec.',
    },
    {
      key: 'auditPrepHoursPerYear',
      label:
        'Koliko skupnih ur na leto porabite za pripravo na presoje (IFS, BRC, ISO) in inšpekcije — zbiranje dokazil, urejanje evidenc, popravke?',
      kind: 'number',
      unit: 'h/leto',
      default: 0,
      help: 'Letna vrednost, ker presoja ni vsak mesec. Samo priprava, ne sama presoja.',
      explainer:
        'Dnevi, ko vodja kakovosti in ekipa zbirajo zapise, iščejo dokazila in dopolnjujejo mape. Ocena: 2 ' +
        'presoji × 3 ljudje × 5 dni × 8 h ≈ 240 ur na leto.',
    },
    {
      key: 'labelingHoursPerMonth',
      label:
        'Koliko ur mesečno gre za ročno posodabljanje deklaracij, hranilnih vrednosti in alergenov ob spremembi recepture ali dobavitelja?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'annualLabelErrorCostEUR',
      label:
        'Koliko so v zadnjih 12 mesecih stale napačne deklaracije ali etikete — ponovno tiskanje, prepakiranje, umik izdelka, globe?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Samo posledice napačne oznake. Reklamacije zaradi kakovosti izdelka merimo v področju Sledljivost.',
      explainer:
        'Napačen alergen, rok ali sestavina na etiketi: nova naklada etiket, ročno prelepljanje, umik serije s ' +
        'police. Ocena: 3 dogodki × 1.500 EUR ≈ 4.500 EUR na leto.',
    },
    {
      key: 'recordsMethod',
      label: 'Kje vodite HACCP evidence in temperaturne zapise?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Elektronsko, s samodejnim zajemom temperatur' },
        { value: 1, label: 'Elektronsko, z ročnim vnosom' },
        { value: 2, label: 'Na papirju, s prepisom v Excel' },
        { value: 3, label: 'Samo na papirju v mapah' },
      ],
    },
    mainCauseField(KAKOVOST_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(KAKOVOST_CAUSES, input.mainCause);

    return [
      {
        // Zapis na kontrolni točki opravi operater na liniji, zato neposredna ura.
        bucket: 'capacity',
        label: 'Ročne HACCP in temperaturne evidence',
        valueEUR: input.haccpHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.haccpHoursPerMonth,
        addressableShare,
        // Regulatorno dno: zapis na kontrolni točki ostane obvezen tudi
        // elektronsko (Uredba (ES) 852/2004) in še vedno vzame čas. Odpade prepis,
        // iskanje in arhiviranje — približno polovica. Elektronske evidence so
        // poleg tega praviloma zunanji sistem (raziskava, list PANTHEON_zemljevid),
        // zato bi delež brez meje obljubljal več, kot produkt sam dostavi.
        addressableCap: 0.5,
      },
      {
        bucket: 'capacity',
        label: 'Priprava na presoje in inšpekcije',
        valueEUR: input.auditPrepHoursPerYear * context.adminHourCostEUR,
        hoursPerMonth: input.auditPrepHoursPerYear / MONTHS_PER_YEAR,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Posodabljanje deklaracij in alergenov',
        valueEUR: input.labelingHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.labelingHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Napačne deklaracije in etikete',
        valueEUR: input.annualLabelErrorCostEUR,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Deklaracija in alergeni iz recepture — sprememba sestavine je vidna pri vsakem izdelku, ki jo vsebuje',
    'Dokumentni arhiv, vezan na šaržo in artikel: dokazila za presojo na enem mestu, ne v mapah',
    'Šarže, izdaje in izvidi, ki jih presojevalec zahteva, iz sistema in ne iz papirjev',
  ],
};

// --- 5. Naročila kupcev, planiranje in nujne dobave -------------------------

const NAROCILA_CAUSES: CauseOption[] = [
  { label: 'Naročila prihajajo po e-pošti in telefonu in jih prepisujemo', category: 'data' },
  { label: 'Plan proizvodnje ni povezan z naročili in zalogami surovin', category: 'planning' },
  { label: 'Roki surovin in kapacitete ob planiranju niso vidni', category: 'data' },
  { label: 'Kupci in trgovske verige spreminjajo naročila v zadnjem hipu', category: 'external' },
  { label: 'Okvare opreme in izpadi linije', category: 'physical' },
];

export const narocila_zivilstvo: ModuleDefinition = {
  id: 'narocila_zivilstvo',
  title: 'Naročila kupcev, planiranje in nujne dobave',
  summary:
    'Ročni vnos naročil trgovcev, planiranje proizvodnje in nabave na pamet ter ekspresne nabave, penali in odbitki zaradi nedobave.',
  triage: {
    prompt: 'Kako pogosto naročila kupcev in plan proizvodnje usklajujete ročno ali rešujete nujno?',
    options: [
      { value: 0, label: 'Naročila in plan tečejo iz sistema' },
      { value: 1, label: 'Nekajkrat na mesec' },
      { value: 2, label: 'Vsak teden' },
      { value: 3, label: 'Vsak dan' },
    ],
  },
  fields: [
    {
      key: 'orderEntryHoursPerMonth',
      label:
        'Koliko ur mesečno gre za ročni vnos in prepisovanje naročil kupcev — iz e-pošte, telefona in portalov trgovskih verig?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Samo vnos in potrjevanje naročil. Ure, ki ste jih že vpisali v drugem področju, tu ne ponavljajte.',
      explainer:
        'Naročilo, ki pride po e-pošti ali telefonu in ga nekdo pretipka v sistem ali preglednico, nato preveri ' +
        'cene in količine. Ocena: 40 naročil na dan × 4 min ≈ 56 ur na mesec.',
    },
    {
      key: 'planningHoursPerMonth',
      label:
        'Koliko ur mesečno porabite za planiranje proizvodnje in naročanje surovin — usklajevanje naročil, zalog, rokov surovin in kapacitet?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Vodja proizvodnje, nabava, tehnolog. Reševanja posameznih reklamacij ne štejte.',
      explainer:
        'Tedenski in dnevni plan, preračun potreb po surovinah, klici dobaviteljem, prestavljanje šarž. Ocena: ' +
        '2 osebi × 1,5 h na dan ≈ 63 ur na mesec.',
    },
    {
      key: 'expediteCostEUR',
      label:
        'Koliko ste v zadnjih 12 mesecih doplačali za ekspresne nabave surovin ali embalaže in nujne dostave kupcem?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Samo doplačilo nad redno ceno oziroma rednim prevozom.',
      explainer:
        'Razlika med nujno in redno izvedbo: manjša količina po višji ceni, dodatni prevoz, nočna dostava. ' +
        'Primer: nujna embalaža 2.400 EUR namesto 1.800 EUR → vpišite 600 EUR.',
    },
    {
      key: 'chainPenaltyEUR',
      label:
        'Kolikšni so bili v zadnjih 12 mesecih penali, odbitki in dobropisi trgovcem zaradi nedobave, delne dobave ali zamude?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Samo zaradi količin in rokov. Dobropise zaradi kakovosti izdelka merimo v področju Sledljivost.',
      explainer:
        'Trgovske verige nedobavo zaračunajo: odbitek na računu, pogodbeni penal, izpad z akcijskega letaka. ' +
        'Ocena: 12 dogodkov × 500 EUR ≈ 6.000 EUR na leto.',
    },
    {
      key: 'orderChannel',
      label: 'Kako večinoma prihajajo naročila kupcev?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Elektronsko (EDI, portal, spletno naročanje) neposredno v sistem' },
        { value: 1, label: 'Elektronsko, a jih prepišemo' },
        { value: 2, label: 'Po e-pošti' },
        { value: 3, label: 'Po telefonu in na sestankih' },
      ],
    },
    mainCauseField(NAROCILA_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(NAROCILA_CAUSES, input.mainCause);
    const rate = context.adminHourCostEUR;

    return [
      {
        bucket: 'capacity',
        label: 'Ročni vnos naročil kupcev',
        valueEUR: input.orderEntryHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.orderEntryHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Planiranje proizvodnje in naročanje surovin',
        valueEUR: input.planningHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.planningHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Ekspresne nabave in nujne dostave',
        valueEUR: input.expediteCostEUR,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Penali in odbitki trgovcev zaradi nedobave',
        valueEUR: input.chainPenaltyEUR,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Naročila kupcev prek e-izmenjave in spletnega naročanja neposredno v sistem',
    'Planiranje potreb po surovinah iz naročil, receptur in rokov zaloge',
    'Statusi naročil in dobavljivost, vidni prodaji in proizvodnji hkrati',
  ],
};

// --- Kratka diagnostika -----------------------------------------------------

const DATA_RISK_NOTE: Record<RiskLevel, string> = {
  low: 'Poraba in izhod šarže se evidentirata sproti, dejanski donos in lastna cena izdelka sta znana. Odstopanje opazite pri šarži, ne ob letnem obračunu.',
  medium:
    'Podatki so delni. Razliko med recepturo in dejanskim donosom praviloma opazite šele ob inventuri ali obračunu, ko je surovina že porabljena.',
  high: 'Dejanskega donosa in lastne cene izdelka ne poznate. Dokler tega ni, natančnega zneska kala in prodaje pod lastno ceno ni mogoče izračunati — in prav to je težava.',
};

const PROCESS_RISK_NOTE: Record<RiskLevel, string> = {
  low: 'Sledljivost šarže je urejena v obe smeri in proizvodnja ni odvisna od posameznika. Odpoklic bi omejili na eno šaržo.',
  medium:
    'Sledljivost je delna. Ob resnem odpoklicu bi bilo obseg težko omejiti, priprava na presojo pa sloni na nekaj ljudeh.',
  high: 'Sledljivosti praktično ni, recepture in znanje so pri eni osebi. En odpoklic bi pomenil umik vsega, odsotnost tehnologa pa zastoj proizvodnje.',
};

/**
 * Štiri vprašanja, ki se prikažejo vedno in NE prispevajo nobenega evra.
 *
 * Tretje vprašanje je prepis najbolj prodajno relevantne hipoteze raziskave
 * (H01, list Hipoteze): čas do izsleditve šarže pod eno uro. Kjer podjetje tega
 * ne zmore, natančnega zneska tveganja ni mogoče izračunati — in prav to je
 * ugotovitev, ne številka.
 */
export const diagnostika_zivilstvo: ModuleDefinition = {
  id: 'diagnostika_zivilstvo',
  title: 'Kratka diagnostika',
  summary: 'Štiri vprašanja o podatkih in odpornosti procesa. Ne prispevajo k finančnemu rezultatu.',
  fields: [
    {
      key: 'realtimeBatchRecording',
      label: 'Ali sproti evidentirate porabo surovin in izhod vsake šarže?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'knowsProductCost',
      label: 'Ali poznate dejanski strošek in donos posameznega izdelka?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'batchTraceability',
      label:
        'Ali lahko v eni uri za katero koli šaržo ugotovite dobavitelje surovin in kupce, ki so jo prejeli?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'keyPersonIndependence',
      label: 'Ali proizvodnja in kakovost delujeta normalno tudi brez tehnologa ali vodje kakovosti?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
  ],
  compute: (input) => {
    const dataLevel = assuranceRiskLevel(input.realtimeBatchRecording, input.knowsProductCost);
    const processLevel = assuranceRiskLevel(input.batchTraceability, input.keyPersonIndependence);

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
    'Šarže s popolno sledljivostjo v obe smeri',
    'Kalkulacija lastne cene na dejanski donos šarže',
    'Recepture, postopki in dokumentacija v sistemu namesto v glavah',
  ],
};

/**
 * Vrstni red je hkrati prioriteta — odloči ob izenačenju v triaži. Sledi
 * prednosti iz kataloga bolečin: donos (B02, 15 točk), roki (B03, 14),
 * sledljivost (B01, 13), HACCP (B04, 13), naročila (B15/B21, 12–13).
 */
export const ZIVILSTVO_MODULES: ModuleDefinition[] = [
  donos_zivilstvo,
  roki_zivilstvo,
  sledljivost_zivilstvo,
  kakovost_zivilstvo,
  narocila_zivilstvo,
  diagnostika_zivilstvo,
];
