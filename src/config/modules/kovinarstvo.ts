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
 * Šest medsebojno izključujočih se stroškovnih področij za kovinarstvo
 * (kovinskopredelovalna in strojna industrija: SKD C25 kovinski izdelki, C28
 * stroji in naprave — obdelava kovin, varjenje, orodjarstvo, strojegradnja).
 *
 * Zakaj svoj segment in ne splošna proizvodnja: kovinar je praviloma podizvajalec
 * izvozne verige brez cenovne moči — če cene ne more dvigniti, mu ostane samo
 * notranja učinkovitost. Raziskava panoge
 * (Datalab_raziskava_KOVINSKA_INDUSTRIJA_model.xlsx, list Naslovnica) zato pravi:
 * prodajni argument ni prihranek administracije, ampak DEJANSKI STROŠEK DELOVNEGA
 * NALOGA. Splošni proizvodni vprašalnik ne vpraša po odstopanju porabe od
 * normativa, kooperaciji, certifikatih 3.1, šaržah in nalogih, prodanih pod lastno
 * ceno — to je pet od šestih področij tu. Nabor sledi katalogu bolečin (list
 * Katalog_bolecin): strošek naloga ni znan (B01, 15 točk), odstopanje
 * normativ–poraba (B03, 15), nastavitveni časi (B02, 14), sledljivost šarže (B05,
 * 14), ročni vnos proizvodnje (B08, 14), zaloga v sistemu ni dejanska (B09, 14),
 * material v kooperaciji (B04, 13), planiranje v Excelu (B10, 13).
 *
 * Veljata isti dve načeli kot v proizvodnja.ts:
 *
 * 1. compute() vrne DEJANSKI sedanji strošek — brez množenja z deležem izboljšave.
 *    Koliko je od tega mogoče nasloviti, izračuna motor iz glavnega vzroka.
 * 2. Ista ura ali evro se ne sme pojaviti v dveh področjih. Meje so v besedilih
 *    help, v obe smeri: presežna poraba na nalogu je Material, manko ob inventuri
 *    Zaloge, razlika ob vračilu iz kooperacije Kooperacija; sortiranje in ponovna
 *    izdelava je Material, iskanje šarže in 8D je Sledljivost; čakanje na material
 *    je Zaloge, na kooperanta Kooperacija, na plan ali risbo Plan; prevoz zaradi
 *    kakovosti je Sledljivost, zaradi zamude Plan; evidenca prisotnosti za plače je
 *    horizontala Kadri in plače, ne Delovni nalog.
 *
 * Prodaja pod lastno ceno (nalog_kovinarstvo) gre v koš lostMargin in ne v
 * directLoss: cena, potrjena pod kalkulacijo, je "prodaja po napačni ceni" in
 * stoji na predpostavki, da bi kupec pravo ceno plačal. Presežna poraba in ure, ki
 * nalog dejansko podražijo, so v drugih področjih — sicer bi bil isti evro štet
 * dvakrat.
 */

// --- 1. Delovni nalog in dejanski strošek -----------------------------------

const NALOG_CAUSES: CauseOption[] = [
  { label: 'Podatki o proizvodnji se vnašajo naknadno, s papirja', category: 'data' },
  { label: 'Ure delavcev in stroja niso vezane na nalog ali operacijo', category: 'data' },
  { label: 'Normativi in kalkulacije niso osveženi', category: 'data' },
  // Nastavitev, ki ni ločena od izdelave, je manjkajoč podatek v normativu, ne
  // slabo planiranje: ko je v postopku ločena operacija, jo sistem ovrednoti sam.
  { label: 'Nastavitve in male serije v kalkulaciji niso ločeno ovrednotene', category: 'data' },
  { label: 'Usposobljenost oziroma menjava ljudi', category: 'people' },
];

export const nalog_kovinarstvo: ModuleDefinition = {
  id: 'nalog_kovinarstvo',
  title: 'Delovni nalog in dejanski strošek',
  summary:
    'Ročno evidentiranje proizvodnje, nemerjeni nastavitveni časi in nalogi, ki so bili prodani pod polno lastno ceno.',
  triage: {
    // Osrednje vprašanje panoge (raziskava, list Vprasalnik Q02 in list Kalkulator):
    // po hipotezi H02 najmočnejši kvalifikacijski filter v tej dejavnosti.
    prompt: 'Ali po zaključku naloga veste, koliko vas je dejansko stal — material, delo in stroj?',
    options: [
      { value: 0, label: 'Da, iz sistema ob zaključku' },
      { value: 1, label: 'Približno, po kalkulaciji' },
      { value: 2, label: 'Šele ob mesečnem ali letnem obračunu' },
      { value: 3, label: 'Ne vemo' },
    ],
  },
  fields: [
    {
      key: 'workOrdersPerMonth',
      label: 'Koliko delovnih nalogov odprete na mesec?',
      kind: 'number',
      unit: 'nalogov/mesec',
      default: 0,
      contextOnly: true,
      help: 'Podatek ne vstopa v izračun — pove obseg in olajša oceno ur v naslednjem vprašanju.',
      explainer:
        'Odprti delovni nalogi, tudi interni in za polizdelke — ne naročila kupcev, ker eno naročilo ' +
        'pogosto razpade na več nalogov. Podatek je v sistemu ali v mapi nalogov za zadnji mesec.',
    },
    {
      key: 'manualReportingHoursPerMonth',
      label:
        'Koliko skupnih ur mesečno porabite za ročno evidentiranje in prepisovanje podatkov o proizvodnji — izdelani kosi, čas in izmet s spremnih listov v sistem ali Excel?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help:
        'Evidenco prisotnosti za plače merimo v področju Kadri in plače; kalkulacij, ponudb in poročil za vodstvo tu ne štejte.',
      explainer:
        'Vsak nalog se vsaj enkrat prepiše: s spremnega lista v Excel ali sistem, ob zaključku še kosi in ' +
        'izmet. Ocena: 250 nalogov × 14 min ≈ 58 ur na mesec.',
    },
    {
      key: 'priceBelowCostEUR',
      label:
        'Za koliko so bile v zadnjih 12 mesecih potrjene cene nižje od polne lastne cene po kalkulaciji?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help:
        'Samo razlika med ceno in kalkulirano lastno ceno ob ponudbi — presežno porabo materiala in ure merimo v področjih Material, Zaloge in Plan. Če razlike ne spremljate, izberite "Ne vem": prav to je podatek.',
      explainer:
        'Nalogi, pri katerih je bila cena kupcu potrjena pod polno lastno ceno (material, delo, stroj in ' +
        'nastavitev). Primer: 8 nalogov na leto, vsak v povprečju 1.500 EUR pod lastno ceno ≈ 12.000 EUR.',
    },
    {
      key: 'setupTimeTracking',
      label: 'Kako merite nastavitveni čas stroja — menjavo orodja in prvi kos?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Ločena operacija v sistemu' },
        { value: 1, label: 'Ocenjen v normativu' },
        { value: 2, label: 'Vštet v čas izdelave' },
        { value: 3, label: 'Ga ne merimo' },
      ],
    },
    mainCauseField(NALOG_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(NALOG_CAUSES, input.mainCause);

    return [
      {
        // Prepis opravi priprava dela, planer ali vodja izmene — administrativna ura.
        bucket: 'capacity',
        label: 'Ročno evidentiranje proizvodnje',
        valueEUR: input.manualReportingHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.manualReportingHoursPerMonth,
        addressableShare,
      },
      {
        // Koš lostMargin: cena pod kalkulacijo je prodaja po napačni ceni in stoji na
        // predpostavki, da bi kupec pravo ceno plačal. Ni odtekel denar, ki bi ga
        // bilo mogoče pokazati na kontu — ta je v presežni porabi in urah drugod.
        bucket: 'lostMargin',
        label: 'Prodaja pod lastno ceno',
        valueEUR: input.priceBelowCostEUR,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Obračun delovnega naloga po materialu, delu in stroju',
    'Proizvodni terminali MT za sprotno javljanje operacij',
    'Ločena operacija nastavitve v tehnološkem postopku',
  ],
};

// --- 2. Poraba materiala, izmet in ponovna izdelava -------------------------

const MATERIAL_CAUSES: CauseOption[] = [
  { label: 'Normativi v kosovnicah niso osveženi', category: 'data' },
  { label: 'Izdelava po napačni verziji kosovnice ali risbe', category: 'data' },
  { label: 'Poraba se ne evidentira na nalog', category: 'data' },
  { label: 'Napake pri nastavitvi ali izvedbi, premalo usposabljanja', category: 'people' },
  { label: 'Kakovost vhodnega materiala ali orodja', category: 'physical' },
];

export const material_kovinarstvo: ModuleDefinition = {
  id: 'material_kovinarstvo',
  title: 'Poraba materiala, izmet in ponovna izdelava',
  summary:
    'Razlika med normativom in dejansko porabo, izmet in ostanki pločevine ter ure ponovne izdelave in sortiranja.',
  triage: {
    prompt:
      'Kako pogosto dejanska poraba materiala odstopa od normativa ali nastajata izmet in ponovna izdelava?',
    options: [
      { value: 0, label: 'Redko, odstopanja spremljamo' },
      { value: 1, label: 'Mesečno' },
      { value: 2, label: 'Tedensko' },
      { value: 3, label: 'Pri velikem deležu nalogov ali odstopanja ne merimo' },
    ],
  },
  fields: [
    {
      key: 'annualMaterialSpendEUR',
      label: 'Kolikšna je letna vrednost porabljenega materiala — jeklo, aluminij, polizdelki?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Nabavna vrednost materiala, ki gre v izdelke — brez orodij, olj, plinov in energije.',
      explainer:
        'Postavka "stroški materiala" iz izkaza poslovnega izida ali vsota nabav za proizvodnjo v zadnjem ' +
        'letu. V tej panogi je material praviloma največja posamezna postavka stroškov.',
    },
    {
      key: 'materialDeviationPercent',
      label: 'Za koliko odstotkov material, izdan na naloge, presega normativ iz kosovnic?',
      kind: 'percent',
      min: 0,
      // Zgornja meja 0,20: pri razrezu pločevine in profilov je odstopanje nad 10 %
      // realno, zato bi nižja meja take vnose tiho obrezala.
      max: 0.2,
      step: 0.005,
      // Privzetek 0 in ne panožno povprečje: skupaj z vrednostjo materiala je to
      // zmnožek dveh polj in samo delež trdi, da težava obstaja (defaults.test.ts).
      default: 0,
      help:
        'Izdano na nalog proti normativu — vključno z ostanki pločevine in izmetom. Manko, ugotovljen ob inventuri, sodi v področje Zaloge; ure ponovne izdelave merimo v naslednjem vprašanju.',
      explainer:
        'Primerjava izdanega materiala z normativom po kosovnicah za zadnji mesec ali za 10 največjih ' +
        'nalogov. Primer: izdanih 105 t pri normativu 100 t je 5 %. Delež vrednosti, ne kosov.',
    },
    {
      key: 'reworkHoursPerMonth',
      label:
        'Koliko skupnih človek-ur mesečno porabite za ponovno izdelavo, dodelave in sortiranje neskladnih kosov?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Ure obravnave reklamacij s kupci — iskanje šarže in poročila 8D — sodijo v področje Sledljivost.',
      explainer:
        'Ure operaterjev in kontrole za popravilo, ponovno izdelavo ali prebiranje kosov, ki niso šli ' +
        'skozi prvič — tudi sortiranje pri kupcu. Ocena: 6 primerov × 2 delavca × 4 h ≈ 48 ur na mesec.',
    },
    {
      key: 'scrapHandling',
      label: 'Kaj se zgodi z ostružki in ostanki pločevine?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Tehtamo in prodajamo, prihodek je knjižen po vrsti odpadka' },
        { value: 1, label: 'Prodajamo, a evidence po nalogu ali vrsti ni' },
        { value: 2, label: 'Odvaža jih zbiralec, prihodek je zanemarljiv' },
        { value: 3, label: 'Ne spremljamo' },
      ],
    },
    mainCauseField(MATERIAL_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(MATERIAL_CAUSES, input.mainCause);

    return [
      {
        bucket: 'directLoss',
        label: 'Presežna poraba materiala nad normativom',
        valueEUR: input.annualMaterialSpendEUR * input.materialDeviationPercent,
        addressableShare,
        // Odstopanje ima tehnološko dno: izplen razreza in ostanki profilov ostanejo
        // tudi ob popolnih podatkih, prihodek od ostružkov pa tu ni odštet. Raziskava
        // (list Predpostavke, A16 in A17) računa z znižanjem odstopanja za 0,5–3 %
        // vrednosti materiala in realizacijskim faktorjem 0,4 / 0,6 / 0,8 — 0,5 leži
        // med konservativnim in realističnim scenarijem. Brez te meje bi vzrok
        // "normativi niso osveženi" trdil, da je odpravljivih 75 % odstopanja.
        addressableCap: 0.5,
      },
      {
        // Ure ponovne izdelave so že plačan čas ekipe — kapaciteta, ne odtekel denar.
        bucket: 'capacity',
        label: 'Ponovna izdelava, dodelave in sortiranje',
        valueEUR: input.reworkHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.reworkHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Kosovnice in tehnološki postopki z normativi in verzijami',
    'Izdaja materiala na delovni nalog s primerjavo z normativom',
    'Evidenca neskladnosti in stroška ponovne izdelave po nalogu',
  ],
};

// --- 3. Zaloge materiala in zastoji -----------------------------------------

const ZALOGE_CAUSES: CauseOption[] = [
  { label: 'Stanje zalog v sistemu ni zanesljivo', category: 'data' },
  { label: 'Material se izdaja brez naloga ali naknadno', category: 'data' },
  { label: 'Nabava ni povezana s planom nalogov', category: 'planning' },
  { label: 'Dobavitelji zamujajo ali dobavijo brez certifikata', category: 'external' },
  { label: 'Zalogo zavestno držimo kot varovalko', category: 'planning' },
];

export const zaloge_kovinarstvo: ModuleDefinition = {
  id: 'zaloge_kovinarstvo',
  title: 'Zaloge materiala in zastoji',
  summary:
    'Inventurne razlike in odpisi, zastoji zaradi manjkajočega materiala, nujne nabave in kapital, vezan v zalogi.',
  triage: {
    // Vprašanje Q09 iz raziskave: razlika med sistemom in resničnostjo.
    prompt: 'Kako pogosto se stroj ustavi, ker materiala ni, čeprav bi po sistemu moral biti?',
    options: [
      { value: 0, label: 'Zaloge so pod nadzorom' },
      { value: 1, label: 'Nekajkrat na leto' },
      { value: 2, label: 'Vsak mesec' },
      { value: 3, label: 'Vsak teden' },
    ],
  },
  fields: [
    {
      key: 'inventoryValueEUR',
      label:
        'Kolikšna je povprečna skupna vrednost zalog materiala, polizdelkov in nedokončane proizvodnje?',
      kind: 'number',
      unit: 'EUR',
      default: 0,
      help: 'Vključite surovine, polizdelke, nedokončano proizvodnjo in gotove izdelke.',
      explainer:
        'Povprečno stanje med letom po nabavni vrednosti — ne stanje na današnji dan in ne letna poraba. ' +
        'Vzemite postavko iz bilance ali povprečje nekaj mesečnih stanj.',
    },
    {
      key: 'annualWriteOffEUR',
      label:
        'Kolikšne so bile v zadnjih 12 mesecih inventurne razlike, odpisi in razvrednotenja zaloge?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help:
        'Samo neto manko in odpis ob inventuri — presežna poraba na nalogu sodi v področje Material, razlike, ugotovljene ob vračilu iz kooperacije, pa v področje Kooperacija.',
      explainer:
        'Iz inventurnega zapisnika: vrednost manjka plus material, odpisan brez uporabe. Primer: 0,8 % ' +
        'manjka pri 1,2 mio EUR zaloge ≈ 9.600 EUR na leto.',
    },
    {
      key: 'materialStoppageHoursPerMonth',
      label: 'Koliko skupnih človek-ur mesečno proizvodnja stoji samo zaradi manjkajočega materiala?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help:
        'Čakanje na plan ali risbo štejte v področju Plan, čakanje na vračilo iz kooperacije pa v področju Kooperacija.',
      explainer:
        'Samo zastoji, ko delo stoji, ker materiala ni ali ni pravega. Ocena: 3 zastoji × 3 ljudje × 2 h ' +
        '≈ 18 ur na mesec.',
    },
    {
      key: 'expediteCostEUR',
      label: 'Koliko ste v zadnjih 12 mesecih doplačali za nujne nabave materiala in ekspresne dostave?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Samo doplačilo nad redno ceno. Dodatni prevozi h kupcu zaradi zamud sodijo v področje Plan.',
      explainer:
        'Razlika med nujno in redno izvedbo, ne celotna nabava. Primer: hitra dobava pločevine 1.400 EUR ' +
        'namesto 900 EUR → vpišite 500 EUR.',
    },
    reducibleShareField(
      'Kolikšen delež zalog bi lahko trajno zmanjšali, ne da bi zmanjkalo materiala?',
      { explainer: REDUCIBLE_STOCK_EXPLAINER },
    ),
    mainCauseField(ZALOGE_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(ZALOGE_CAUSES, input.mainCause);
    const reducibleShare = reducibleShareOf(input.reducibleShare);

    return [
      {
        bucket: 'directLoss',
        label: 'Inventurne razlike in odpisi',
        valueEUR: input.annualWriteOffEUR,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Zastoji zaradi manjkajočega materiala',
        valueEUR: input.materialStoppageHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.materialStoppageHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Nujne nabave in ekspresne dostave',
        valueEUR: input.expediteCostEUR,
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
    'Skladišča, lokacije in šarže materiala',
    'Izdaja materiala na delovni nalog',
    'MRP: potrebe po materialu iz nalogov s točkami naročanja',
  ],
};

// --- 4. Sledljivost šarž, certifikati in reklamacije ------------------------

const SLEDLJIVOST_CAUSES: CauseOption[] = [
  { label: 'Certifikati so v mapah in e-pošti, ne vezani na šaržo', category: 'data' },
  { label: 'Šarža se ob prevzemu ali izdaji ne zabeleži', category: 'data' },
  { label: 'Zapisniki meritev so na papirju', category: 'data' },
  { label: 'Zahteve kupcev po dokumentaciji so se povečale', category: 'external' },
  { label: 'Premalo ljudi v kontroli kakovosti', category: 'people' },
];

export const sledljivost_kovinarstvo: ModuleDefinition = {
  id: 'sledljivost_kovinarstvo',
  title: 'Sledljivost šarž, certifikati in reklamacije',
  summary:
    'Iskanje certifikatov 3.1 in šarž, priprava dokumentacije za kupce in presoje ter neposredni stroški reklamacij.',
  triage: {
    prompt: 'Kako pogosto iščete certifikate, šarže ali zapisnike za kupca, reklamacijo ali presojo?',
    options: [
      { value: 0, label: 'Redko — vse je na enem mestu' },
      { value: 1, label: 'Nekajkrat na mesec' },
      { value: 2, label: 'Tedensko' },
      { value: 3, label: 'Skoraj vsak dan, iskanje traja ure' },
    ],
  },
  fields: [
    {
      key: 'docSearchHoursPerMonth',
      label:
        'Koliko ur mesečno porabite za iskanje in prilaganje materialnih certifikatov (3.1), merilnih zapisnikov in dokumentacije ob dobavi ali presoji?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Potrjevanje računov in splošno iskanje po arhivu sodi v področje Dokumentacija in e-poslovanje.',
      explainer:
        'Certifikat k vsaki dobavi, ki ga zahteva kupec, in dokazila pred presojo. Ocena: 40 dobav × 20 min ' +
        'iskanja + priprava na eno presojo 16 h ≈ 30 ur na mesec.',
    },
    {
      key: 'claimHandlingHoursPerMonth',
      label:
        'Koliko ur mesečno porabite za obravnavo reklamacij kupcev — iskanje izvorne šarže, poročila 8D in komunikacijo s kupcem?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Ure sortiranja in ponovne izdelave neskladnih kosov sodijo v področje Material.',
      explainer:
        'Pisarniški del reklamacije: ugotoviti, iz katere šarže je bil kos, napisati poročilo in uskladiti ' +
        'ukrepe s kupcem. Ocena: 3 reklamacije × (6 h iskanja šarže + 4 h poročilo 8D) ≈ 30 ur na mesec.',
    },
    {
      key: 'annualClaimsCostEUR',
      label:
        'Kolikšni so bili v zadnjih 12 mesecih neposredni stroški reklamacij — dobropisi, sortiranje pri kupcu, prevozi in odpoklici zaradi kakovosti?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help:
        'Brez vrednosti ponovno izdelanih kosov — ta je v področju Material. Prevozi in popusti zaradi zamud sodijo v področje Plan.',
      explainer:
        'Denar, ki je odtekel zaradi neskladne dobave: dobropis, zunanje sortiranje, nujni prevoz ' +
        'nadomestne dobave. Primer: 12 reklamacij × 900 EUR ≈ 10.800 EUR na leto.',
    },
    {
      // Vprašanje Q06 iz raziskave (list Kalkulator): "odgovor običajno preseneti
      // direktorja samega". Izbira in ne ure na reklamacijo: enota na reklamacijo
      // bi padla iz plauzibilnostne ovojnice (plausibility.ts sešteva samo h/mesec).
      key: 'batchTraceTime',
      label: 'Kako dolgo traja, da pri reklamaciji najdete, iz katere šarže materiala je bil kos?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Manj kot uro, iz sistema' },
        { value: 1, label: 'Nekaj ur' },
        { value: 2, label: 'Dan ali več' },
        { value: 3, label: 'Šarže praviloma ne najdemo' },
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
        label: 'Iskanje certifikatov in priprava dokumentacije',
        valueEUR: input.docSearchHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.docSearchHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Obravnava reklamacij in iskanje šarž',
        valueEUR: input.claimHandlingHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.claimHandlingHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Neposredni stroški reklamacij',
        valueEUR: input.annualClaimsCostEUR,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Serijske številke in šarže od prevzema do dobavnice',
    'Certifikat, vezan na šaržo in priložen dobavnici samodejno',
    'Evidenca reklamacij in neskladnosti z vzrokom in stroškom',
  ],
};

// --- 5. Kooperacija in zunanje operacije ------------------------------------

const KOOPERACIJA_CAUSES: CauseOption[] = [
  { label: 'Oddaje in vračila se vodijo ročno ali po e-pošti', category: 'data' },
  { label: 'Material, oddan kooperantu, izgine iz evidence zalog', category: 'data' },
  { label: 'Plan ne upošteva časa pri kooperantu', category: 'planning' },
  { label: 'Kooperanti ne držijo rokov ali količin', category: 'external' },
  { label: 'Kakovost dela kooperantov', category: 'external' },
];

export const kooperacija_kovinarstvo: ModuleDefinition = {
  id: 'kooperacija_kovinarstvo',
  title: 'Kooperacija in zunanje operacije',
  summary:
    'Material, oddan v cinkanje, kaljenje ali obdelavo pri kooperantu: evidenca oddaj, usklajevanje vračil, izgube in čakanje.',
  triage: {
    prompt: 'Kako pogosto pri kooperaciji nastanejo razlike v količinah, zamude ali izgubljen material?',
    options: [
      { value: 0, label: 'Kooperacije nimamo ali poteka brez težav' },
      { value: 1, label: 'Občasno' },
      { value: 2, label: 'Mesečno' },
      { value: 3, label: 'Pri večini oddaj' },
    ],
  },
  fields: [
    {
      // Vprašanje Q05 iz raziskave (list Kalkulator). Izbira in ne odstotek:
      // prodajna priprava tako loči "ni odgovora" od "0 % kooperacije".
      key: 'cooperationShare',
      label:
        'Kolikšen delež nalogov gre skozi vsaj eno zunanjo operacijo — cinkanje, kaljenje, obdelavo pri kooperantu?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Kooperacije nimamo' },
        { value: 1, label: 'Do 10 % nalogov' },
        { value: 2, label: '10–30 % nalogov' },
        { value: 3, label: 'Več kot 30 % nalogov' },
      ],
    },
    {
      key: 'cooperationAdminHoursPerMonth',
      label:
        'Koliko ur mesečno porabite za oddaje v kooperacijo, spremljanje rokov in usklajevanje vrnjenih količin?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Splošno prepisovanje podatkov o proizvodnji sodi v področje Delovni nalog.',
      explainer:
        'Priprava izdajnice in spremnega lista, klici kooperantu, štetje ob vračilu in usklajevanje ' +
        'računa. Ocena: 40 oddaj × 30 min + usklajevanje 10 h ≈ 30 ur na mesec.',
    },
    {
      key: 'cooperationWaitingHoursPerMonth',
      label: 'Koliko skupnih človek-ur mesečno proizvodnja čaka na vračilo kosov iz kooperacije?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Čakanje na material iz nabave sodi v področje Zaloge.',
      explainer:
        'Samo zastoji, ko naslednja operacija stoji, ker se kosi od kooperanta niso vrnili v roku. ' +
        'Ocena: 2 zamudi × 2 ljudje × 4 h ≈ 16 ur na mesec.',
    },
    {
      key: 'cooperationLossEUR',
      label:
        'Kolikšne izgube so v zadnjih 12 mesecih nastale zaradi razlik v količinah ob vračilu in neuveljavljenih reklamacij pri kooperantih?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Manko, ugotovljen šele ob inventuri, sodi v področje Zaloge.',
      explainer:
        'Kosi, ki so odšli h kooperantu in se niso vrnili ali so se vrnili neuporabni, brez povračila. ' +
        'Primer: 3 primeri × 20 manjkajočih kosov × 40 EUR ≈ 2.400 EUR na leto.',
    },
    mainCauseField(KOOPERACIJA_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(KOOPERACIJA_CAUSES, input.mainCause);

    return [
      {
        bucket: 'capacity',
        label: 'Administracija kooperacije',
        valueEUR: input.cooperationAdminHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.cooperationAdminHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Čakanje na vračilo iz kooperacije',
        valueEUR: input.cooperationWaitingHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.cooperationWaitingHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Izgube pri kooperaciji',
        valueEUR: input.cooperationLossEUR,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Izdajni in prevzemni dokumenti za zunanje operacije',
    'Zaloga pri kooperantu kot ločeno skladišče',
    'Kooperacijska operacija v tehnološkem postopku z rokom vračila',
  ],
};

// --- 6. Plan, kapacitete in roki --------------------------------------------

const PLAN_CAUSES: CauseOption[] = [
  { label: 'Plan ni ažuren ali kapacitete niso znane', category: 'planning' },
  { label: 'Kosovnice, risbe in postopki so v več verzijah', category: 'data' },
  { label: 'Stanje nalogov ni vidno sproti', category: 'planning' },
  { label: 'Kupci spreminjajo naročila in odpoklice', category: 'external' },
  { label: 'Okvare strojev in orodij', category: 'physical' },
];

export const plan_kovinarstvo: ModuleDefinition = {
  id: 'plan_kovinarstvo',
  title: 'Plan, kapacitete in roki',
  summary:
    'Čakanje na plan, risbo ali prioriteto, nadure zaradi sprememb in penali zaradi zamujenih dobav.',
  triage: {
    prompt:
      'Kako pogosto se plan spreminja, proizvodnja čaka na prioriteto ali risbo ali zamujate z dobavo?',
    options: [
      { value: 0, label: 'Plan je stabilen, roke držimo' },
      { value: 1, label: 'Občasno' },
      { value: 2, label: 'Tedensko' },
      { value: 3, label: 'Skoraj vsak dan' },
    ],
  },
  fields: [
    {
      key: 'planningMethod',
      label: 'Kako danes planirate zasedenost strojev?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'V sistemu nad delovnimi nalogi' },
        { value: 1, label: 'V Excelu' },
        { value: 2, label: 'Na tabli' },
        { value: 3, label: 'V glavi vodje proizvodnje' },
      ],
    },
    {
      key: 'planWaitingHoursPerMonth',
      label:
        'Koliko skupnih človek-ur mesečno proizvodnja čaka zaradi nejasne prioritete, manjkajoče risbe ali napačne verzije dokumentacije?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help:
        'Čakanje na material sodi v področje Zaloge, čakanje na vračilo iz kooperacije pa v področje Kooperacija.',
      explainer:
        'Ure, ko delo stoji, ker ni jasno, kaj naprej — čakanje na plan, risbo, verzijo ali potrditev. ' +
        'Ocena: 5 ljudi × 20 min × 21 dni ≈ 35 ur na mesec.',
    },
    {
      key: 'overtimeHoursPerMonth',
      label: 'Koliko nadur mesečno nastane predvsem zaradi sprememb plana in nujnih naročil?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'penaltyCostEUR',
      label:
        'Kolikšni so bili v zadnjih 12 mesecih penali, popusti in dodatni prevozi zaradi zamujenih dobav?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help:
        'Doplačila za nujne nabave materiala sodijo v področje Zaloge, stroški zaradi kakovosti pa v področje Sledljivost.',
      explainer:
        'Samo posledice zamude: pogodbeni penal, popust za zamujen rok, nujni prevoz h kupcu. Primer: ' +
        '6 zamud × 500 EUR popusta + 4 nujni prevozi × 300 EUR ≈ 4.200 EUR na leto.',
    },
    {
      // KPI K10 iz raziskave (delež dobav v roku, cilj nad 95 %): preverljiv
      // podatek, ki ga podjetje pozna — ali pa mu ta odgovor pove, da ga ne meri.
      key: 'onTimeDelivery',
      label: 'Kolikšen delež naročil odpremite v potrjenem roku?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Nad 95 %' },
        { value: 1, label: '85–95 %' },
        { value: 2, label: 'Pod 85 %' },
        { value: 3, label: 'Ne merimo' },
      ],
    },
    mainCauseField(PLAN_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(PLAN_CAUSES, input.mainCause);
    const productionHours = input.planWaitingHoursPerMonth + input.overtimeHoursPerMonth;

    return [
      {
        bucket: 'capacity',
        label: 'Čakanje in nadure v proizvodnji',
        valueEUR: productionHours * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: productionHours,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Penali in popusti zaradi zamud',
        valueEUR: input.penaltyCostEUR,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Planiranje kapacitet nad delovnimi nalogi',
    'Statusi nalogov in rokov, vidni prodaji in proizvodnji hkrati',
    'Verzioniranje kosovnic in tehnoloških postopkov',
  ],
};

// --- Kratka diagnostika -----------------------------------------------------

const DATA_RISK_NOTE: Record<RiskLevel, string> = {
  low: 'Operacije se javljajo sproti, kosovnice so v eni veljavni verziji in strošek naloga je znan ob zaključku. Odstopanje od kalkulacije opazite, ko ga je še mogoče popraviti.',
  medium:
    'Podatki so delni. Razliko med kalkulacijo in dejanskim stroškom naloga praviloma opazite šele ob obračunu, ko naloga ni več mogoče popraviti.',
  high: 'Dejanskega stroška naloga in veljavne verzije kosovnice ne poznate. Dokler tega ni, natančnega zneska prodaje pod lastno ceno ni mogoče izračunati — in prav to je težava.',
};

const PROCESS_RISK_NOTE: Record<RiskLevel, string> = {
  low: 'Dokumentacija za presojo je pripravljena sproti in proizvodnja ni odvisna od posameznika.',
  medium:
    'Dokazila za presojo se zbirajo šele ob presoji, tehnologija pa sloni na nekaj ljudeh. Ob odsotnosti tehnologa se odločitve odložijo.',
  high: 'Presoja kupca bi zahtevala tedne priprave, znanje o tehnologiji pa je v glavi ene osebe. Ena presoja ali ena odsotnost lahko ustavi dobave.',
};

/**
 * Štiri vprašanja, ki se prikažejo vedno in NE prispevajo nobenega evra.
 *
 * Prvi par meri zanesljivost podatkov (javljanje operacij, verzija kosovnice),
 * drugi procesno odpornost (presoja kupca, ključna oseba — raziskava, vprašanje
 * Q05 "Kaj se ustavi, ko tehnologa ni?" in bolečina B19). Vprašanje o strošku
 * naloga je namenoma v triaži področja Delovni nalog in ne tu, čas do šarže pa v
 * samem področju Sledljivost — diagnostika ne sprašuje dvakrat.
 */
export const diagnostika_kovinarstvo: ModuleDefinition = {
  id: 'diagnostika_kovinarstvo',
  title: 'Kratka diagnostika',
  summary: 'Štiri vprašanja o podatkih in odpornosti procesa. Ne prispevajo k finančnemu rezultatu.',
  fields: [
    {
      key: 'operationReporting',
      label: 'Ali operaterji sproti javljajo izdelane kose, čas in izmet po operaciji?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'bomVersionControl',
      label: 'Ali so kosovnice in tehnološki postopki v sistemu v eni sami veljavni verziji?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'auditReadiness',
      label:
        'Ali bi presojo kupca (ISO 9001, IATF 16949) prestali brez večtedenske priprave dokumentacije?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'keyPersonIndependence',
      label: 'Ali proizvodnja teče normalno tudi brez tehnologa oziroma ključne osebe?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
  ],
  compute: (input) => {
    const dataLevel = assuranceRiskLevel(input.operationReporting, input.bomVersionControl);
    const processLevel = assuranceRiskLevel(input.auditReadiness, input.keyPersonIndependence);

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
    'Kalkulacija in obračun lastne cene po delovnem nalogu',
    'Kosovnice in postopki z verzijami namesto risb v mapah',
    'Dokumentiran tehnološki postopek namesto znanja v glavah',
  ],
};

/**
 * Vrstni red je hkrati prioriteta — odloči ob izenačenju v triaži. Sledi
 * prednosti iz kataloga bolečin: strošek naloga (B01, 15 točk), material (B03,
 * 15), zaloge (B09, 14), sledljivost (B05, 14), kooperacija (B04, 13), plan
 * (B10, 13). Prva tri so hkrati privzeta triaža — ima jih vsak kovinar.
 */
export const KOVINARSTVO_MODULES: ModuleDefinition[] = [
  nalog_kovinarstvo,
  material_kovinarstvo,
  zaloge_kovinarstvo,
  sledljivost_kovinarstvo,
  kooperacija_kovinarstvo,
  plan_kovinarstvo,
  diagnostika_kovinarstvo,
];
