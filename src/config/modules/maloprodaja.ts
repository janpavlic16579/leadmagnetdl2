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
import type { ModuleDefinition, ModuleField, RiskLevel } from './moduleTypes';

/**
 * Šest medsebojno izključujočih se stroškovnih področij za maloprodajo.
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
 * Tri ločnice, ki jih postavlja panožna raziskava in jih ni dovoljeno zabrisati:
 *
 * - PRAZNA POLICA proti PRESEŽNI ZALOGI. To sta nasprotna problema z nasprotnima
 *   vzrokoma (premalo oziroma preveč naročenega) in ju en sam "glavni vzrok" ne
 *   more opisati. Zato dve področji in ne eno (§8.4).
 * - ZNANA proti NEZNANI izgubi blaga. Odpisano, poteklo in prisilno znižano blago
 *   je področje Presežna zaloga (vemo, kaj se je zgodilo), inventurni manko pa
 *   področje Blagajna (ne vemo). V enem znesku bi bila razlika izgubljena — z njo
 *   pa vsak ukrep, ki iz nje sledi.
 * - ODTEKEL DENAR proti NEZASLUŽENI MARŽI. Odpis je na kontu, izgubljena marža
 *   stoji na predpostavki o kupčevem vedenju. Zato ločena koša (glej BucketId).
 *
 * Prihodek, prispevna marža in strošek ure pridejo iz konteksta: so lastnost
 * podjetja, ne področja, in se vprašajo enkrat v svojem koraku.
 */

/**
 * Odprti dnevi na leto po odgovoru "Koliko dni v tednu obratujete?" (5/6/7).
 * Prej fiksnih 305 dni (šest dni na teden) za vse — napaka ±16 % pri najbolj
 * dokazljivi številki vprašalnika. Privzetek ostane šest dni.
 */
const OPEN_DAYS_PER_YEAR_BY_CHOICE = [255, 305, 355];
const DEFAULT_OPEN_DAYS_PER_YEAR = 305;

const MINUTES_PER_HOUR = 60;

// --- 1. Prazne police in nedobavljivi artikli --------------------------------

const POLICE_CAUSES: CauseOption[] = [
  { label: 'Naročamo po oceni, ne po podatkih o prodaji', category: 'planning' },
  { label: 'Stanje zalog v sistemu ni zanesljivo', category: 'data' },
  { label: 'Ne vidimo zaloge v drugih poslovalnicah ali skladišču', category: 'data' },
  { label: 'Police ne dopolnjujemo dovolj hitro', category: 'people' },
  { label: 'Dobavitelji zamujajo ali dobavijo le del naročila', category: 'external' },
];

/**
 * Deleži nadomeščenega ali odloženega nakupa za izbrane indekse.
 *
 * Brez tega vprašanja bi vsak izgubljen obisk štel kot izgubljena marža, kar je
 * najpogostejši način, kako kalkulatorji precenijo stockout: velik del kupcev vzame
 * drug artikel ali se vrne. Vprašanje zato ostane in svoj del odšteje ENKRAT.
 *
 * "Ne vem" 0,45 → 0,50: Gruen & Corsten (72.000 kupcev) merijo, da ob prazni polici
 * 26 % kupcev zamenja znamko, 19 % zamenja artikel znotraj znamke in 15 % nakup
 * odloži — v trgovini torej ostane 45–60 % nakupov. 0,50 je sredina izmerjenega,
 * 0,45 je bil njegov spodnji rob. Vir: docs/erp-koristi-benchmarki-2026-08.md, A5.
 */
const SUBSTITUTION_SHARES = [0.7, 0.5, 0.2, 0.5];

/**
 * Delež povpraševanja, ki zadene ob prazno polico, po izbranem pasu.
 *
 * Vprašanje je bilo prej drsnik 0–3 % z besedilom "kolikšen delež prodaje
 * IZGUBITE" — torej neto formulacija, ki jo je formula nato pomnožila še z
 * (1 − substitucija) in isti odbitek uporabila drugič. Hkrati je bil strop
 * dosegljivega neto izida 3 % × 0,55 = 1,65 % prometa, kar je POD izmerjenim
 * povprečjem panoge (~4 % neto, Gruen & Corsten).
 *
 * Odslej meri BRUTO povpraševanje ob prazni polici, substitucija pa ga zniža
 * enkrat in upravičeno. Sidro panoge je 8,3 % svetovno oziroma 8,6 % v Evropi —
 * "vsak trinajsti iskani artikel manjka". Indeks 4 je "Ne vem" in ostane 0:
 * prazen obrazec mora še naprej pokazati 0 EUR.
 */
const STOCKOUT_DEMAND_SHARES = [0.015, 0.035, 0.075, 0.08, 0];

const substitutionField: ModuleField = {
  key: 'substitutionShare',
  label: 'Kolikšen del teh kupcev kupi drug artikel pri vas ali se vrne pozneje?',
  kind: 'choice',
  default: 3,
  help: 'Ta del prodaje ni izgubljen, zato ga od izgubljene marže odštejemo.',
  explainer:
    'Del kupcev, ki ob prazni polici vzame drug artikel ali se vrne pozneje — ta prodaja ni izgubljena. ' +
    'Pri osnovnih živilih je delež visok (70–80 %), pri modnih artiklih nizek (20–30 %).',
  choices: [
    { value: 0, label: 'Skoraj vsi — nad 60 %' },
    { value: 1, label: 'Približno polovica' },
    { value: 2, label: 'Manjši del — pod 30 %' },
    { value: 3, label: 'Ne vem', unknown: true },
  ],
};

export const razpolozljivostMp: ModuleDefinition = {
  id: 'razpolozljivostMp',
  usesRevenue: true,
  usesMargin: true,
  title: 'Prazne police in nedobavljivi artikli',
  summary:
    'Marža, ki je ne zaslužite, ker artikla ni na zalogi, ekspresne dobave in čas iskanja blaga po enotah.',
  triage: {
    prompt: 'Kako pogosto kupec pri vas ne dobi artikla, ki bi ga kupil — ker ga ni na polici ali ni dobavljiv?',
    options: [
      { value: 0, label: 'Redko — police so polne' },
      { value: 1, label: 'Nekajkrat na mesec' },
      { value: 2, label: 'Vsak teden' },
      { value: 3, label: 'Vsak dan — koliko nas stane, pa ne vemo' },
    ],
  },
  fields: [
    {
      key: 'stockoutDemandShare',
      label: 'Kolikšen del povpraševanja pri vas zadene ob artikel, ki ga ni na zalogi?',
      kind: 'choice',
      default: 4,
      help: 'Delež iskanj, ne izgubljene prodaje — koliko od tega je res izgubljeno, odšteje naslednje vprašanje.',
      explainer:
        'Delež iskanj, ki zadenejo ob prazno polico. Meritve v trgovini na drobno kažejo povprečno 8,3 % ' +
        'svetovno in 8,6 % v Evropi (Gruen & Corsten) — če svojega podatka nimate, vzemite povprečje.',
      choices: [
        { value: 0, label: 'Redko — pod 2 %' },
        { value: 1, label: '2–5 %' },
        { value: 2, label: '5–10 %' },
        { value: 3, label: 'Vzemi povprečje panoge (8 %)' },
        { value: 4, label: 'Ne vem', unknown: true },
      ],
    },
    substitutionField,
    {
      key: 'expressDeliveryCostEUR',
      label:
        'Koliko ste v zadnjih 12 mesecih plačali za ekspresne dobave in nujne prevoze, da polica ne bi ostala prazna?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
    },
    {
      key: 'stockCheckHoursPerMonth',
      label:
        'Koliko ur mesečno gre za preverjanje, ali je artikel na zalogi v drugi poslovalnici ali skladišču?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Klici med enotami, iskanje po skladišču, obljube kupcu. Prenos blaga sam po sebi šteje področje Prevzem.',
      explainer:
        'Ure za preverjanje, ali je artikel kje drugje: klici med enotami, iskanje po skladišču. Ocena: 3 ' +
        'zaposleni × 15 min na dan ≈ 20 ur na mesec.',
    },
    {
      key: 'replenishmentMethod',
      label: 'Kako danes določate, kaj in koliko naročiti?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Samodejni predlog naročila iz sistema' },
        { value: 1, label: 'Predlog sistema, ki ga večinoma ročno popravimo' },
        { value: 2, label: 'Excel in izkušnje' },
        { value: 3, label: 'Na oko, v poslovalnici' },
      ],
    },
    mainCauseField(POLICE_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(POLICE_CAUSES, input.mainCause);
    const substitution = SUBSTITUTION_SHARES[input.substitutionShare] ?? SUBSTITUTION_SHARES[3];

    return [
      {
        // Formula raziskave (F01): povpraševanje ob prazni polici × prispevna
        // marža × (1 − nadomeščeni ali odloženi nakup). Prvi člen je BRUTO in ne
        // neto: prej je vprašanje spraševalo, koliko prodaje trgovec "izgubi", in
        // je formula od tega odštela substitucijo še enkrat.
        // Prihodek in marža prideta iz skupne finančne osnove.
        bucket: 'lostMargin',
        label: 'Nezaslužena marža zaradi praznih polic',
        valueEUR:
          context.annualRevenueEUR *
          (STOCKOUT_DEMAND_SHARES[input.stockoutDemandShare] ?? 0) *
          context.contributionMarginRate *
          (1 - substitution),
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Ekspresne dobave in nujni prevozi',
        valueEUR: input.expressDeliveryCostEUR,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Iskanje in preverjanje zaloge po enotah',
        valueEUR: input.stockCheckHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.stockCheckHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Samodejni predlogi naročil iz dejanske prodaje',
    'Minimalne in maksimalne zaloge po poslovalnici',
    'Zaloga vseh poslovalnic in skladišč na enem zaslonu',
  ],
};

// --- 2. Presežna zaloga, odpisi in znižanja ---------------------------------

const ZALOGE_CAUSES: CauseOption[] = [
  { label: 'Naročamo preveč, ker podatkov o obračanju nimamo', category: 'planning' },
  { label: 'Artiklov brez prodaje ne opazimo pravočasno', category: 'data' },
  { label: 'Roki uporabnosti in serije niso sproti vidni', category: 'data' },
  { label: 'Zalogo zavestno držimo kot varovalko', category: 'planning' },
  { label: 'Dobavitelji zahtevajo velike minimalne količine', category: 'external' },
];

export const zalogeMp: ModuleDefinition = {
  id: 'zalogeMp',
  title: 'Presežna zaloga, odpisi in znižanja',
  summary:
    'Odpisano in poteklo blago, marža, izgubljena s prisilnimi znižanji, ter kapital, vezan v zalogah.',
  triage: {
    prompt: 'Koliko blaga vam obleži — poteče, se poškoduje ali ga morate prodati z znižanjem?',
    options: [
      { value: 0, label: 'Skoraj nič' },
      { value: 1, label: 'Občasno' },
      { value: 2, label: 'Redno, predvsem ob koncu sezone' },
      { value: 3, label: 'Veliko — obsega pa ne merimo' },
    ],
  },
  fields: [
    {
      key: 'annualWriteOffEUR',
      label:
        'Kolikšna je bila v zadnjih 12 mesecih vrednost odpisov ter poteklega in poškodovanega blaga?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Po nabavni vrednosti in samo ZNANA izguba. Neznano razliko, ki jo ugotovite šele ob inventuri, vpišite v področju Blagajna — sicer bo ista izguba šteta dvakrat.',
      explainer:
        'Samo znana izguba po nabavni vrednosti: poteklo, poškodovano, odpisano blago. Seštejte odpise ' +
        'zadnjih 12 mesecev iz knjigovodstva.',
    },
    {
      key: 'forcedMarkdownMarginEUR',
      label:
        'Koliko marže ste v zadnjih 12 mesecih izgubili s prisilnimi znižanji — razprodajo sezone, odprodajo pred rokom?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Samo razlika do marže, ki ste jo načrtovali, ne celoten popust. Načrtovane sezonske razprodaje sem ne sodijo — te bi bile tudi z boljšim sistemom.',
      explainer:
        'Samo izpad do načrtovane marže, ne celoten popust. Primer: artikel z načrtovano maržo 10 EUR ste ' +
        'prodali z 2 EUR → izpad 8 EUR × število kosov.',
    },
    {
      key: 'inventoryValueEUR',
      label: 'Kolikšna je povprečna vrednost zalog v vseh poslovalnicah in skladišču?',
      kind: 'number',
      unit: 'EUR',
      default: 0,
      allowUnknown: true,
      help: 'Vnesite nabavno vrednost, ne prodajne.',
      explainer:
        'Povprečna zaloga po nabavni vrednosti, vse poslovalnice in skladišče skupaj. Vzemite postavko iz ' +
        'bilance ali povprečje nekaj mesečnih stanj.',
    },
    reducibleShareField(
      'Kolikšen delež zalog bi po vaši oceni lahko zmanjšali, ne da bi se police spraznile?',
      { explainer: REDUCIBLE_STOCK_EXPLAINER },
    ),
    {
      key: 'staleStockShare',
      label: 'Kolikšen del zaloge se v zadnjih šestih mesecih ni prodal?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Skoraj nič' },
        { value: 1, label: 'Do desetine' },
        { value: 2, label: 'Petina ali več' },
        { value: 3, label: 'Tega ne vemo' },
      ],
    },
    mainCauseField(ZALOGE_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(ZALOGE_CAUSES, input.mainCause);
    const releasableEUR = input.inventoryValueEUR * reducibleShareOf(input.reducibleShare);

    return [
      {
        bucket: 'directLoss',
        label: 'Odpisi ter poteklo in poškodovano blago',
        valueEUR: input.annualWriteOffEUR,
        addressableShare,
      },
      {
        bucket: 'lostMargin',
        label: 'Marža, izgubljena s prisilnimi znižanji',
        valueEUR: input.forcedMarkdownMarginEUR,
        addressableShare,
      },
      {
        // Letni strošek denarja, ki leži v presežni zalogi (F03). Ločen od
        // sprostljivega kapitala spodaj in ne podvojen z njim: kapital je enkraten
        // denarni učinek, to pa cena, ki se plačuje vsako leto, dokler zaloga leži.
        //
        // Brez addressableShare iz istega razloga kot postavka pod njo: obe stojita
        // na releasableEUR, torej na zalogi, za katero je stranka SAMA ocenila, da
        // bi je trajno lahko bilo manj. Odpravljivost je s tem že ocenjena; množenje
        // z deležem glavnega vzroka bi isti problem zmanjšalo dvakrat — natanko
        // vzorec dvojnega diskonta, ki je bil avgusta 2026 odpravljen pri potencialu.
        bucket: 'directLoss',
        label: 'Strošek financiranja presežne zaloge',
        valueEUR: releasableEUR * context.capitalCostRate,
      },
      {
        // Brez addressableShare: ta znesek JE potencial, ne sedanji strošek.
        // Množenje s pasom izboljšave bi ga štelo dvakrat.
        bucket: 'oneTimeCapital',
        label: 'Sprostljiv obratni kapital v zalogah',
        valueEUR: releasableEUR,
      },
    ];
  },
  pantheon: [
    'Analiza obračanja zalog in artiklov brez prometa',
    'Roki uporabnosti in serije s samodejnim opozorilom pred potekom',
    'Predlog odprodaje, dokler ima blago še vrednost',
  ],
};

// --- 3. Cene, akcije in marža -----------------------------------------------

const MARZE_CAUSES: CauseOption[] = [
  { label: 'Cenike in akcije vzdržujemo ročno', category: 'data' },
  { label: 'Dobaviteljski pogoji niso zapisani na enem mestu', category: 'data' },
  { label: 'Marže po artiklu ne spremljamo sproti', category: 'planning' },
  // Ostaja people: ročno vzdrževanje cenikov je svoja možnost (data),
  // ta pa opisuje napako pri vnosu, ki ostane tudi ob urejenem ceniku.
  { label: 'Napake pri vnosu cen ali na blagajni', category: 'people' },
  { label: 'Dobavitelji cene spreminjajo brez najave', category: 'external' },
];

export const marzeMp: ModuleDefinition = {
  id: 'marzeMp',
  usesRevenue: true,
  title: 'Cene, akcije in marža',
  summary:
    'Prodaja po napačni ceni, neizkoriščeni dobaviteljski pogoji in ročno vzdrževanje cenikov ter akcij.',
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
      key: 'wrongPriceSalesSharePercent',
      label: 'Kolikšen delež prodaje steče po napačni, zastareli ali pozabljeni akcijski ceni?',
      kind: 'percent',
      min: 0,
      max: 0.15,
      step: 0.005,
      default: 0,
      help: 'Delež prodaje, ki je napake dejansko prizadela — ne celotnega prometa in ne celotne nabavne vrednosti.',
      explainer:
        'Delež prodaje, ki je stekel po napačni ceni — ne celoten promet. Primer: 3 od 100 računov nosijo ' +
        'napačno ceno → 3 %.',
    },
    {
      key: 'marginGapPercent',
      label: 'Za koliko odstotnih točk je marža pri tej prodaji nižja od načrtovane?',
      kind: 'percent',
      min: 0,
      max: 0.2,
      step: 0.01,
      default: 0,
      help: 'Primer: načrtovanih 30 %, dosežene 22 % — razlika je 8 odstotnih točk.',
      explainer:
        'Odstotne točke, ne odstotki. Če razlike ne veste, vzemite tipičen popust take napake in ga ' +
        'izrazite v odstotnih točkah marže.',
    },
    {
      key: 'unclaimedRebatesEUR',
      label:
        'Kolikšno vrednost dobaviteljskih rabatov, bonusov in sofinanciranja akcij letno ne uveljavite?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Če tega ne vodite, odkljukajte "Tega podatka ne vodimo" — nižja zanesljivost rezultata je boljša od izmišljene številke.',
      explainer:
        'Bonusi in rabati, do katerih ste po pogodbi upravičeni, a jih niste zahtevali ali dokazali. ' +
        'Primer: dogovorjen bonus 2 % na 500.000 EUR nabave = 10.000 EUR; uveljavili ste polovico → 5.000 ' +
        'EUR.',
    },
    {
      key: 'priceMaintenanceHoursPerMonth',
      label: 'Koliko skupnih ur mesečno porabite za vzdrževanje cenikov, akcij, etiket in oznak na policah?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Ne vključujte prevzema blaga in usklajevanja dokumentov — to meri področje Prevzem.',
      explainer:
        'Ure za vnos cen in akcij, tiskanje in menjavo etiket, oznake na policah. Ocena: 2 osebi × 5 h na ' +
        'teden ≈ 43 ure na mesec.',
    },
    {
      key: 'previousPriceProof',
      label:
        'Ali lahko za posamezen artikel, poslovalnico in kanal dokažete najnižjo ceno zadnjih 30 dni?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      help: 'Zakon o varstvu potrošnikov zahteva, da je ob znižanju navedena najnižja cena zadnjih 30 dni.',
      explainer:
        'Vprašanje ni, ali pravilo poznate, ampak ali ga danes lahko dokažete za posamezen artikel in ' +
        'poslovalnico. Kjer se cene vodijo ročno ali v Excelu, zgodovine praviloma ni.',
      choices: [
        { value: 0, label: 'Da, neposredno iz sistema' },
        { value: 1, label: 'Da, z ročnim iskanjem po evidencah' },
        { value: 2, label: 'Le približno' },
        { value: 3, label: 'Ne' },
      ],
    },
    mainCauseField(MARZE_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(MARZE_CAUSES, input.mainCause);

    return [
      {
        // Osnova je PRIZADETA PRODAJA in ne celotna nabavna vrednost: napačna cena
        // ne pokvari marže na vsem prodanem blagu, ampak na tistem delu, ki je
        // stekel po napačni ceni. Prejšnja različica je odstotek množila s celotnim
        // COGS in je znesek precenila za red velikosti.
        bucket: 'lostMargin',
        label: 'Marža, izgubljena pri prodaji po napačni ceni',
        valueEUR:
          context.annualRevenueEUR * input.wrongPriceSalesSharePercent * input.marginGapPercent,
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
    'Cenik, akcije in popusti na enem mestu za vse poslovalnice in kanale',
    'Zgodovina cen z dokazom najnižje cene zadnjih 30 dni',
    'Nabavni pogoji, rabati in bonusi po dobavitelju',
  ],
};

// --- 4. Blagajna, zaključki in manko ----------------------------------------

const BLAGAJNA_CAUSES: CauseOption[] = [
  { label: 'Prevzem in odpis nista evidentirana sproti', category: 'data' },
  { label: 'Zaloga v sistemu se ne ujema z dejansko', category: 'data' },
  // Ostaja people: neujemanje zaloge in neevidentiran prevzem sta svoji možnosti,
  // ta pa opisuje napako pri delu, ki je sistem težko prepreči.
  { label: 'Napake pri delu na blagajni', category: 'people' },
  { label: 'Kraja kupcev ali zunanjih oseb', category: 'external' },
  { label: 'Poškodbe blaga pri rokovanju ali skladiščenju', category: 'physical' },
];

export const blagajnaMp: ModuleDefinition = {
  id: 'blagajnaMp',
  title: 'Blagajna, zaključki in manko',
  summary:
    'Dnevni zaključki blagajn, inventure ter neznane razlike med sistemom in dejanskim stanjem.',
  triage: {
    prompt:
      'Koliko časa in denarja poberejo dnevni zaključki blagajn ter razlike, ki jih odkrijete šele ob inventuri?',
    options: [
      { value: 0, label: 'Zaključek je hiter, razlike zanemarljive' },
      { value: 1, label: 'Nekaj minut na blagajno, manjše razlike' },
      { value: 2, label: 'Opazno — vsak dan in ob vsaki inventuri' },
      { value: 3, label: 'Veliko ali pa tega sploh ne merimo' },
    ],
  },
  fields: [
    {
      key: 'tillCount',
      label: 'Koliko blagajniških mest imate skupaj v vseh poslovalnicah?',
      kind: 'number',
      unit: 'blagajn',
      default: 0,
    },
    {
      key: 'closingMinutesPerTillPerDay',
      label: 'Koliko minut na dan porabi ena blagajna za odprtje, zaključek in oddajo izkupička?',
      kind: 'number',
      unit: 'min/dan',
      default: 0,
      help: 'Najbolj dokazljiva številka v trgovini — izmerite jo v enem dnevu.',
      explainer:
        'Minute na ENO blagajno na dan: odprtje, zaključek, štetje in oddaja izkupička. Izmerite jih v ' +
        'enem dnevu — običajno okoli 12 minut.',
    },
    {
      // Fiksnih 305 dni je 7-dnevno živilsko trgovino podcenilo in specializirano
      // 5-dnevno precenilo za ±16 % pri najbolj dokazljivi številki vprašalnika.
      key: 'openDaysPerWeek',
      label: 'Koliko dni v tednu obratujete?',
      kind: 'choice',
      default: 1,
      choices: [
        { value: 0, label: '5 dni' },
        { value: 1, label: '6 dni' },
        { value: 2, label: '7 dni' },
      ],
    },
    {
      key: 'shrinkageEUR',
      label: 'Kolikšna je bila po nabavni vrednosti neznana razlika (manko) ob zadnji inventuri?',
      kind: 'number',
      unit: 'EUR',
      default: 0,
      allowUnknown: true,
      help: 'Samo NEZNANA razlika, skupaj z nepojasnjenimi blagajniškimi razlikami. Znano odpisano, poteklo ali znižano blago sodi v področje Presežna zaloga. Če inventura ni letna, vrednost preračunajte na leto.',
      explainer:
        'Razlika, ki je ne znate pojasniti: kraja, napake na blagajni, neevidentiran izmet. Vzemite jo iz ' +
        'zapisnika zadnje inventure, po nabavni vrednosti.',
    },
    {
      key: 'stocktakeHoursPerYear',
      label: 'Koliko ur na leto skupaj porabite za inventure — s pripravo, štetjem in vnosom razlik?',
      kind: 'number',
      unit: 'h/leto',
      default: 0,
    },
    {
      key: 'stocktakeMethod',
      label: 'Kako izvajate inventuro?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Sproti po skupinah, s terminali' },
        { value: 1, label: 'Enkrat letno, s terminali' },
        { value: 2, label: 'Enkrat letno, ročno z listi' },
        { value: 3, label: 'Redne inventure praktično ne izvajamo' },
      ],
    },
    mainCauseField(BLAGAJNA_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(BLAGAJNA_CAUSES, input.mainCause);

    // Zaključki: minute × blagajne × odprti dnevi. Vprašano po ENI blagajni in ne
    // skupno, ker je to edina številka, ki jo vodja lahko izmeri z uro v roki —
    // skupno oceno bi moral šele izračunati, in ravno tam nastane največja napaka.
    const openDaysPerYear =
      OPEN_DAYS_PER_YEAR_BY_CHOICE[input.openDaysPerWeek] ?? DEFAULT_OPEN_DAYS_PER_YEAR;
    const closingHoursPerYear =
      (input.tillCount * input.closingMinutesPerTillPerDay * openDaysPerYear) / MINUTES_PER_HOUR;

    return [
      {
        bucket: 'capacity',
        label: 'Dnevni zaključki blagajn',
        valueEUR: closingHoursPerYear * context.operationalHourCostEUR,
        hoursPerMonth: closingHoursPerYear / MONTHS_PER_YEAR,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Inventurni manko',
        valueEUR: input.shrinkageEUR,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Izvedba inventur',
        valueEUR: input.stocktakeHoursPerYear * context.operationalHourCostEUR,
        hoursPerMonth: input.stocktakeHoursPerYear / MONTHS_PER_YEAR,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Blagajna POS z davčnim potrjevanjem in samodejnim dnevnim zaključkom',
    'Inventura s terminali, tudi sprotna po skupinah',
    'Sledljivost gibanja artikla od prevzema do računa',
  ],
};

// --- 5. Prevzem blaga, dokumenti in prenosi ---------------------------------

const PREVZEM_CAUSES: CauseOption[] = [
  { label: 'Podatke vodimo v več različnih orodjih', category: 'data' },
  { label: 'Prevzem se ne opravi sproti', category: 'data' },
  { label: 'Prenosi med enotami niso dosledno evidentirani', category: 'data' },
  { label: 'Odgovornosti niso jasne', category: 'planning' },
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
      explainer:
        'Ure za iskanje razlik med dobavnico, računom in ceno: klici dobavitelju, popravki. Ocena: 1 ' +
        'oseba × 6 h na teden ≈ 26 ur na mesec.',
    },
    {
      key: 'transferHoursPerMonth',
      label:
        'Koliko ur mesečno porabite za prenose blaga med poslovalnicami in skladiščem ter za usklajevanje razlik pri prenosih?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Šteje samo administrativni del prenosa, ne prevoza.',
      explainer:
        'Samo administrativni del prenosa med enotami: dokumenti, knjiženje, usklajevanje zalog. Ocena: ' +
        '30 prenosov × 20 min ≈ 10 ur na mesec.',
    },
    {
      key: 'receiptMethod',
      label: 'Kako prevzemate blago?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
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

// --- 6. Spletna prodaja, vračila in usklajenost kanalov ---------------------

const KANALI_CAUSES: CauseOption[] = [
  { label: 'Artikle in cene vzdržujemo ločeno za vsak kanal', category: 'data' },
  { label: 'Zaloga za splet ni sproti vidna', category: 'planning' },
  { label: 'Prenos naročil med sistemoma je ročen', category: 'data' },
  // Integracija kanalov odpravi ročno breme; zadolžitev je posledica, ne vzrok.
  { label: 'Za spletno prodajo ni izrecno zadolžen nihče', category: 'planning' },
  { label: 'Omejitve ponudnika spletne trgovine', category: 'external' },
];

export const kanaliMp: ModuleDefinition = {
  id: 'kanaliMp',
  usesMargin: true,
  title: 'Spletna prodaja, vračila in usklajenost kanalov',
  summary:
    'Odpovedana spletna naročila, dejanski strošek vračil ter ročno usklajevanje artiklov, cen in zalog med kanali.',
  triage: {
    prompt:
      'Kako pogosto spletna prodaja povzroči dodatno delo ali strošek — odpovedi, vračila, ročno usklajevanje?',
    options: [
      { value: 0, label: 'Spletne prodaje nimamo ali je usklajena sproti' },
      { value: 1, label: 'Občasno' },
      { value: 2, label: 'Redno' },
      { value: 3, label: 'Vsak dan — usklajujemo ročno' },
    ],
  },
  fields: [
    {
      key: 'cancelledOrderSalesEUR',
      label:
        'Kolikšna je letna prodajna vrednost spletnih naročil, ki jih odpoveste ali ne morete dobaviti?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Vrednost naročil, ne marže — maržo izračunamo sami. Izgubljeno prodajo v poslovalnici šteje področje Prazne police.',
      explainer:
        'Vrednost spletnih naročil, ki ste jih morali odpovedati, ker artikla ni bilo — vrednost, ne ' +
        'marža. Ocena: 15 odpovedi × 60 EUR × 12 ≈ 10.800 EUR na leto.',
    },
    {
      key: 'returnsPerMonth',
      label: 'Koliko spletnih naročil vam kupci mesečno vrnejo?',
      kind: 'number',
      unit: 'vračil/mesec',
      default: 0,
    },
    {
      key: 'costPerReturnEUR',
      label: 'Koliko vas v povprečju stane eno vračilo?',
      kind: 'number',
      unit: 'EUR/vračilo',
      default: 0,
      help: 'Delo, povratna dostava, nevrnjene provizije in znižanje vrnjenega artikla. BREZ vrnjene kupnine — artikel se večinoma proda znova, zato kupnina sama po sebi ni strošek.',
      explainer:
        'Kaj vas stane ENO vračilo brez vrnjene kupnine: delo, povratna dostava, provizija, znižanje ' +
        'artikla. Primer: 4 + 5 + 3 EUR ≈ 12 EUR.',
    },
    {
      key: 'catalogSyncHoursPerMonth',
      label: 'Koliko ur mesečno porabite za ročno usklajevanje artiklov, opisov, cen in zalog med kanali?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Vzdrževanje cenikov za poslovalnice šteje področje Cene — tu samo delo, ki nastane zaradi drugega kanala.',
      explainer:
        'Ure za ročno usklajevanje artiklov, cen in zalog med spletno trgovino in poslovalnicami. Ocena: ' +
        '1 oseba × 5 h na teden ≈ 21 ur na mesec.',
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
        bucket: 'lostMargin',
        label: 'Nezaslužena marža odpovedanih spletnih naročil',
        valueEUR: input.cancelledOrderSalesEUR * context.contributionMarginRate,
        addressableShare,
      },
      {
        // Formula raziskave (F06): število vračil × neposredni strošek enega.
        // Vrnjena kupnina je izrecno izven — to je najpogostejša napaka pri
        // vrednotenju vračil in bi znesek napihnila za velikostni razred.
        bucket: 'directLoss',
        label: 'Neposredni stroški vračil',
        valueEUR: input.returnsPerMonth * input.costPerReturnEUR * MONTHS_PER_YEAR,
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
    'Samodejen prenos spletnih naročil v odpremo, račun in vračilo',
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
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'knowsItemMargin',
      label: 'Ali poznate dejansko maržo po posameznem artiklu in poslovalnici?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'goodsTraceability',
      label: 'Ali lahko za posamezen artikel zanesljivo ugotovite dobavitelja, serijo in rok uporabnosti?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'keyPersonIndependence',
      label: 'Ali poslovalnica deluje normalno tudi brez ključne osebe?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
  ],
  compute: (input) => {
    const dataLevel = assuranceRiskLevel(input.stockAccuracy, input.knowsItemMargin);
    const processLevel = assuranceRiskLevel(input.goodsTraceability, input.keyPersonIndependence);

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
    'Sprotna zaloga in marža po artiklu ter poslovalnici',
    'Serije, loti in roki uporabnosti s popolno sledljivostjo',
    'Dokumentiran proces namesto znanja v glavah',
  ],
};

/** Vrstni red je hkrati prioriteta — odloči ob izenačenju v triaži. */
export const MALOPRODAJA_MODULES: ModuleDefinition[] = [
  razpolozljivostMp,
  zalogeMp,
  marzeMp,
  blagajnaMp,
  prevzemMp,
  kanaliMp,
  diagnostikaMp,
];
