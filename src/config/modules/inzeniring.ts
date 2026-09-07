import { addressableShareOf, mainCauseField, type CauseOption } from './addressableShare';
import { UNANSWERED_CHOICE } from './moduleTypes';
import type { ModuleDefinition, RiskLevel } from './moduleTypes';
import {
  ASSURANCE_CHOICES,
  ASSURANCE_UNANSWERED,
  ASSURANCE_UNANSWERED_NOTE,
  MONTHS_PER_YEAR,
  assuranceRiskLevel,
  reducibleShareField,
  reducibleShareOf,
} from './shared';

/**
 * Pet medsebojno izključujočih se stroškovnih področij za inženiring in izvedbo
 * na ključ (SKD M71 in F43 v kombinaciji: projektiranje, nabava opreme, montaža
 * s podizvajalci, zagon in prevzem).
 *
 * Zakaj svoj segment in ne storitve: podjetja iz raziskave panoge imajo 279.000 EUR
 * prihodkov na zaposlenega — skozi knjige prevaljajo opremo in podizvajalce. Njihova
 * bolečina ni nezaračunana ura svetovalca, ampak marža projekta, faza brez računa in
 * oprema, ki ni vezana na projekt. Nabor področij sledi katalogu bolečin iz raziskave
 * (Datalab_raziskava_INZENIRING_model.xlsx, list Katalog_bolecin): ure brez projekta
 * (B01), aneksi (B02), oprema med projekti (B03), faza in račun (B04), dobavni roki
 * (B05), garancije (B06), kalkulacija proti realizaciji (B07), dokumentacija (B09).
 * Osrednja teza raziskave: sporočilo ne sme govoriti o urah projektantov, ampak o
 * marži projekta na ključ, o fazah in o opremi, vezani na projekt.
 *
 * Zato ta dejavnost — za razliko od storitev — NE vpraša zaračunane urne postavke.
 * Nezaračunano delo je vprašano v evrih (dodatna dela brez aneksa, servisni posegi)
 * in gre v koš directLoss; vse interne ure gredo v koš capacity po strošku ure.
 * Ista ura ali evro se ne sme pojaviti v dveh področjih; meje so v besedilih help:
 * preseganje LASTNE kalkulacije je Marža (ure), dodatno delo NAROČNIKA je Aneksi
 * (evri); čakanje na opremo je Oprema, čakanje na podatke je Dokumentacija; servis,
 * ki bi ga smeli zaračunati, je Obračun, garancijski servis na lasten strošek pa
 * horizontala Reklamacije in poprodajni servis.
 *
 * Veljata isti dve načeli kot v storitve.ts in zivilstvo.ts:
 *
 * 1. compute() vrne DEJANSKI sedanji strošek — brez množenja z deležem izboljšave.
 *    Koliko je od tega mogoče nasloviti, izračuna motor iz glavnega vzroka.
 * 2. Enkratni kapital (oprema brez projekta, zadržki) se nikoli ne sešteva z
 *    letnimi zneski.
 *
 * Alineje "PANTHEON naslavlja" se opirajo na list PANTHEON_zemljevid raziskave:
 * projektno stroškovno mesto, evidenca ur po projektu in fazi, zaloga po projektu in
 * ponavljajoče fakturiranje so tam označeni kot javno potrjeni (A); servisni nalogi
 * kot A/C, zato so ubesedeni kot evidenca posegov in ne kot servisni modul.
 */

// --- 1. Marža projekta in evidenca ur ---------------------------------------

const MARZA_CAUSES: CauseOption[] = [
  { label: 'Ure se na projekte vpisujejo šele ob koncu meseca ali po spominu', category: 'data' },
  { label: 'Kalkulacija in dejanski stroški projekta niso v istem sistemu', category: 'data' },
  { label: 'Stanje stroškov projekta ni vidno sproti, ampak šele ob zaključku', category: 'planning' },
  { label: 'Inženirji evidence ne vodijo dosledno', category: 'people' },
  { label: 'Naročniki spreminjajo obseg med izvedbo', category: 'external' },
];

export const marza_inzeniring: ModuleDefinition = {
  id: 'marza_inzeniring',
  title: 'Marža projekta in evidenca ur',
  summary:
    'Ure, ki niso pripisane projektu, delo nad lastno kalkulacijo in ročno sestavljanje stanja stroškov in marže po projektih.',
  triage: {
    prompt: 'Kako hitro po zaključku projekta veste, kakšno maržo je dejansko prinesel?',
    options: [
      { value: 0, label: 'Sproti, med izvedbo' },
      { value: 1, label: 'V nekaj tednih po zaključku' },
      { value: 2, label: 'Šele ob letnem obračunu' },
      { value: 3, label: 'Marže po projektu ne poznamo' },
    ],
  },
  fields: [
    {
      key: 'postCalcPractice',
      label: 'Kako primerjate kalkulacijo projekta z dejanskimi stroški?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Sproti, v sistemu po projektu in fazi' },
        { value: 1, label: 'Ob zaključku projekta' },
        { value: 2, label: 'Občasno, v Excelu' },
        { value: 3, label: 'Ne primerjamo' },
      ],
    },
    {
      key: 'timesheetReconstructionHoursPerMonth',
      label:
        'Koliko ur mesečno gre za naknadno vpisovanje, rekonstrukcijo in razporejanje ur inženirjev na projekte in faze?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help:
        'Samo razporejanje ur na projekte in faze za stroške projekta. Evidenco prisotnosti, dopustov in podlago ' +
        'za plačo merimo v področju Kadri in plače.',
      explainer:
        'Vodja projekta ali pisarna ob koncu meseca sestavlja, kdo je koliko delal na katerem projektu, ' +
        'in to prepiše v preglednico ali sistem. Ocena: 4 vodje × 4 h na mesec + 8 h pisarne ≈ 24 ur na mesec.',
    },
    {
      key: 'overrunHoursPerMonth',
      label:
        'Koliko ur inženirjev in monterjev mesečno porabite nad lastno kalkulacijo pri nespremenjenem obsegu projekta?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help:
        'Samo ure nad lastno kalkulacijo pri nespremenjenem obsegu. Dodatna dela po zahtevi naročnika, ki niso ' +
        'bila zaračunana, vpišite v evrih v področju Spremembe obsega in aneksi.',
      explainer:
        'Projekt s fiksno ceno, kalkuliran na 400 ur, je vzel 460 — 60 ur je šlo iz marže, ne da bi kdo ' +
        'kaj spremenil. Ocena: 3 projekti na mesec × 15 % nad kalkulacijo × 300 ur ≈ 135 ur na mesec.',
    },
    {
      key: 'marginTrackingHoursPerMonth',
      label:
        'Koliko ur mesečno vodje projektov in računovodstvo porabijo za sestavljanje stanja stroškov in marže po projektih ter oceno nedokončanih projektov?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help:
        'Samo stanje posameznega projekta. Redna poročila za vodstvo merimo v področju Analitika in poročanje, ' +
        'knjiženje in pripravo listin pa v področju Računovodstvo in finance.',
      explainer:
        'Zbiranje računov dobaviteljev, podizvajalskih situacij in ur, da nastane stanje stroškov enega ' +
        'projekta; ob zaključkih še ocena stopnje dokončanosti za bilanco. Ocena: 5 projektov × 3 h ≈ 15 ur na mesec.',
    },
    {
      key: 'daysToKnownMargin',
      label: 'Koliko dni po zaključku projekta poznate njegovo dejansko maržo?',
      kind: 'number',
      unit: 'dni',
      default: 0,
      contextOnly: true,
      help: 'Podatek ne vstopa v izračun — pove, kako hitro se odstopanje sploh opazi.',
      explainer:
        'Dnevi od primopredaje do trenutka, ko so vsi stroški projekta knjiženi in primerjani s kalkulacijo. ' +
        'Če marže po projektu ne računate, vpišite 0 in to povejte v naslednjem vprašanju.',
    },
    mainCauseField(MARZA_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(MARZA_CAUSES, input.mainCause);

    return [
      {
        bucket: 'capacity',
        label: 'Naknadno razporejanje ur na projekte',
        valueEUR: input.timesheetReconstructionHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.timesheetReconstructionHoursPerMonth,
        addressableShare,
      },
      {
        // Namerno po strošku inženirske ure in ne po ceni: za to delo ni bilo
        // dogovora, da bo plačano, zato ni izgubljenega prihodka, ampak porabljena
        // kapaciteta — isto načelo kot "Delo nad dogovorjenim obsegom" pri storitvah.
        bucket: 'capacity',
        label: 'Delo nad lastno kalkulacijo',
        valueEUR: input.overrunHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.overrunHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Sestavljanje stanja stroškov in marže projektov',
        valueEUR: input.marginTrackingHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.marginTrackingHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Projektno stroškovno mesto: stroški, prihodki in marža po projektu in fazi',
    'Evidenca ur inženirjev z obvezno projektno in fazno oznako',
    'Primerjava kalkulacije z dejanskimi stroški brez prepisovanja v Excel',
  ],
};

// --- 2. Spremembe obsega in aneksi ------------------------------------------

const ANEKSI_CAUSES: CauseOption[] = [
  { label: 'Obseg v pogodbi in ponudbi ni natančno zapisan', category: 'data' },
  { label: 'Spremembe se ne beležijo kot dodatno naročilo s statusom', category: 'data' },
  { label: 'Cene opreme in stare kalkulacije niso na enem mestu', category: 'data' },
  { label: 'Naročnik ali nadzor sprememb ne potrdi pisno', category: 'external' },
  { label: 'Vodje dodatno delo raje opravijo, kot dokumentirajo', category: 'people' },
];

export const aneksi_inzeniring: ModuleDefinition = {
  id: 'aneksi_inzeniring',
  title: 'Spremembe obsega in aneksi',
  summary:
    'Dodatna dela, izvedena pred aneksom in nikoli zaračunana, naknadno dokazovanje sprememb ter ponudbe in kalkulacije iz starih datotek.',
  triage: {
    prompt: 'Kako pogosto izvedete dodatna dela, preden je sprememba obsega pisno potrjena?',
    options: [
      { value: 0, label: 'Nikoli — aneks je pred izvedbo' },
      { value: 1, label: 'Občasno, pri manjših spremembah' },
      { value: 2, label: 'Redno, aneks uredimo za nazaj' },
      { value: 3, label: 'Praviloma; del sprememb nikoli ne zaračunamo' },
    ],
  },
  fields: [
    {
      key: 'unbilledChangeWorkEUR',
      label:
        'Kolikšna je bila v zadnjih 12 mesecih vrednost dodatnih del in opreme po zahtevi naročnika, ki ste jih izvedli brez aneksa in jih niste zaračunali?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help:
        'Vrednost po ponudbi ali kalkulaciji — delo in oprema skupaj. Preseganje lastne kalkulacije pri ' +
        'nespremenjenem obsegu merimo v urah v področju Marža projekta.',
      explainer:
        'Naročnik je zahteval dodatno napeljavo, drug tip opreme ali prestavitev — izvedli ste, aneksa ni bilo, ' +
        'račun tudi ne. Ocena: 8 projektov × 2 spremembi × 1.500 EUR ≈ 24.000 EUR na leto.',
    },
    {
      key: 'changeDocumentationHoursPerMonth',
      label:
        'Koliko ur mesečno gre za naknadno dokazovanje sprememb, pripravo aneksov za nazaj in usklajevanje z naročnikom ali nadzorom?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Samo delo okrog sprememb obsega. Ročno pripravo situacij in računov merimo v področju Obračun po fazah.',
      explainer:
        'Iskanje e-pošte in gradbenega dnevnika, ki dokazuje, da je bila sprememba naročena, in sestavljanje ' +
        'aneksa, ko je delo že opravljeno. Ocena: 6 sprememb × 3 h ≈ 18 ur na mesec.',
    },
    {
      key: 'quoteHoursPerMonth',
      label:
        'Koliko ur mesečno porabite za iskanje starih kalkulacij, ponovno poizvedovanje cen opreme in prepisovanje med ponudbo, naročilom in projektom?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Samo iskanje, poizvedovanje in prepisovanje — ne celotne priprave ponudbe.',
      explainer:
        'Ponudba se začne z lansko datoteko: cene opreme je treba znova preveriti pri dobaviteljih, postavke ' +
        'prepisati v naročilo in projekt. Ocena: 5 ponudb × 4 h ≈ 20 ur na mesec.',
    },
    {
      key: 'changeApprovalTiming',
      label: 'Kdaj se sprememba obsega praviloma potrdi?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Pisno pred izvedbo' },
        { value: 1, label: 'Ustno pred izvedbo, pisno po njej' },
        { value: 2, label: 'Šele ob obračunu' },
        { value: 3, label: 'Pogosto nikoli' },
      ],
    },
    mainCauseField(ANEKSI_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(ANEKSI_CAUSES, input.mainCause);
    const rate = context.adminHourCostEUR;

    return [
      {
        // Delo je opravljeno, oprema vgrajena in strošek zanju že nastal, zato je
        // nezaračunana sprememba neposredna izguba in ne nezaslužena marža: manjka
        // samo račun. Vrednotena po ponudbeni vrednosti, ne po strošku ure — to je
        // edini znesek v tej dejavnosti, ki meri izgubljen prihodek.
        bucket: 'directLoss',
        label: 'Dodatna dela brez aneksa, nikoli zaračunana',
        valueEUR: input.unbilledChangeWorkEUR,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Naknadno dokazovanje sprememb in aneksi za nazaj',
        valueEUR: input.changeDocumentationHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.changeDocumentationHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Iskanje kalkulacij in poizvedovanje cen opreme',
        valueEUR: input.quoteHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.quoteHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Pogodbe in aneksi z zapisanim obsegom',
    'Sprememba obsega kot dodatno naročilo s statusom, ne kot tiha dodelava',
    'Ponudba, kalkulacija in cene opreme iz istega šifranta artiklov',
  ],
};

// --- 3. Oprema, nabava in podizvajalci --------------------------------------

const OPREMA_CAUSES: CauseOption[] = [
  { label: 'Naročilo in prevzem opreme ne nosita projektne oznake', category: 'data' },
  { label: 'Dobavni roki opreme niso povezani s terminskim planom', category: 'planning' },
  { label: 'Podizvajalci in njihove situacije nimajo enotne evidence', category: 'data' },
  { label: 'Nabava poteka mimo okvirnih pogodb, vsakič znova', category: 'planning' },
  { label: 'Dobavitelji opreme zamujajo', category: 'external' },
];

export const oprema_inzeniring: ModuleDefinition = {
  id: 'oprema_inzeniring',
  title: 'Oprema, nabava in podizvajalci',
  summary:
    'Oprema, ki ostane po projektih ali konča na drugem projektu, ekspresne dobave in kazni zaradi zamud opreme, čakanje na terenu ter usklajevanje podizvajalcev.',
  triage: {
    prompt: 'Kako pogosto se oprema, naročena za en projekt, porabi drugje ali ekipa na terenu čaka nanjo?',
    options: [
      { value: 0, label: 'Oprema je vezana na projekt in prispe pravočasno' },
      { value: 1, label: 'Občasno' },
      { value: 2, label: 'Redno, brez sledi v evidenci' },
      { value: 3, label: 'Ne vemo, katera oprema je čigava' },
    ],
  },
  fields: [
    {
      key: 'orphanEquipmentStockEUR',
      label:
        'Kolikšna je nabavna vrednost opreme in materiala na zalogi, ki nista vezana na noben odprt projekt (ostanki projektov)?',
      kind: 'number',
      unit: 'EUR',
      default: 0,
      allowUnknown: true,
      help:
        'Samo ostanki projektov: oprema, naročena za projekt, ki je zaključen, in material, ki ga nihče ne ' +
        'načrtuje. Načrtovane zaloge rezervnih delov za servis sem ne sodijo.',
      explainer:
        'Sprehod po skladišču: kabli, omarice, ventili in naprave, za katere nihče ne ve, na kateri projekt ' +
        'gredo. Ocena: 12 zaključenih projektov × 1,5 % vrednosti opreme ostane ≈ 40.000 EUR.',
    },
    reducibleShareField(
      'Kolikšen delež te opreme bi po vaši oceni lahko porabili na projektih ali prodali, ne da bi kaj zmanjkalo?',
      {
        explainer:
          'Oprema brez projekta je denar, ki stoji na polici. Delež, ki bi ga z evidenco po projektu vgradili ' +
          'drugje ali vrnili dobavitelju, je sprostljiv kapital; ostanek je odpis, ki ga tu ne štejemo.',
      },
    ),
    {
      key: 'urgentDeliveryCostEUR',
      label:
        'Koliko ste v zadnjih 12 mesecih plačali za ekspresne dobave, dodatne prevoze, stojnine podizvajalcev in pogodbene kazni zaradi zamud opreme?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help:
        'Samo stroški, ki ste jih plačali vi zaradi opreme in rokov. Globe zaradi davčnih obračunov merimo v ' +
        'področju Računovodstvo in finance.',
      explainer:
        'Razlika med nujno in redno izvedbo: letalska dostava namesto kamiona, monterji, ki jih plačate za ' +
        'čakanje, penal naročniku, ker oprema ni prišla. Ocena: 6 dogodkov × 2.000 EUR ≈ 12.000 EUR na leto.',
    },
    {
      key: 'siteWaitingHoursPerMonth',
      label:
        'Koliko ur mesečno lastni monterji in inženirji na terenu čakajo na opremo, material ali podizvajalca?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help:
        'Samo čakanje na opremo, material in podizvajalce. Čas brez dostopa do načrtov in podatkov merimo v ' +
        'področju Projektna dokumentacija.',
      explainer:
        'Ekipa je na objektu, omarica pa še ni prispela ali podizvajalec še ni končal svoje faze. Ocena: 2 ' +
        'ekipi × 3 osebe × 4 h na teden ≈ 100 ur na mesec.',
    },
    {
      key: 'procurementCoordinationHoursPerMonth',
      label:
        'Koliko ur mesečno gre za spremljanje dobavnih rokov, iskanje opreme po projektih, usklajevanje podizvajalcev in preverjanje njihovih situacij?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Nabava in vodje projektov. Ure, ki ste jih že vpisali v drugem področju, tu ne ponavljajte.',
      explainer:
        'Klici dobaviteljem za potrditev roka, iskanje, kje je oprema za projekt, primerjava podizvajalske ' +
        'situacije s pogodbo in izvedbo. Ocena: 2 osebi × 1,5 h na dan ≈ 63 ur na mesec.',
    },
    mainCauseField(OPREMA_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(OPREMA_CAUSES, input.mainCause);
    const reducibleShare = reducibleShareOf(input.reducibleShare);

    return [
      {
        // Brez addressableShare: ta znesek JE potencial, ne sedanji strošek.
        bucket: 'oneTimeCapital',
        label: 'Sprostljiv kapital v opremi brez projekta',
        valueEUR: input.orphanEquipmentStockEUR * reducibleShare,
      },
      {
        bucket: 'directLoss',
        label: 'Ekspresne dobave, stojnine in kazni zaradi opreme',
        valueEUR: input.urgentDeliveryCostEUR,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Čakanje na terenu na opremo ali podizvajalca',
        valueEUR: input.siteWaitingHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.siteWaitingHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Spremljanje rokov in usklajevanje podizvajalcev',
        valueEUR: input.procurementCoordinationHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.procurementCoordinationHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Zaloga po projektu: naročilo, prevzem in izdaja opreme nosijo projektno oznako',
    'Naročila dobaviteljem s potrjenimi roki, vidnimi ob terminskem planu projekta',
    'Podizvajalske pogodbe in prejete situacije, vezane na projekt in fazo',
  ],
};

// --- 4. Obračun po fazah, zadržki in vzdrževalne pogodbe --------------------

const OBRACUN_CAUSES: CauseOption[] = [
  { label: 'Zaključek faze in izstavitev računa nista povezana v sistemu', category: 'data' },
  { label: 'Zadržki, garancije in vzdrževalne pogodbe nimajo opomnikov', category: 'planning' },
  { label: 'Servisni posegi po prevzemu niso vezani na pogodbo', category: 'data' },
  { label: 'Obračun je odvisen od ene osebe, ki spremlja mejnike', category: 'people' },
  { label: 'Naročnik prevzema ne potrdi pravočasno', category: 'external' },
];

export const obracun_inzeniring: ModuleDefinition = {
  id: 'obracun_inzeniring',
  usesRevenue: true,
  title: 'Obračun po fazah, zadržki in vzdrževalne pogodbe',
  summary:
    'Denar, vezan v zaključenih fazah brez računa, zapadli zadržki in garancije, neobračunani servis po prevzemu ter ročna priprava situacij.',
  triage: {
    prompt: 'Koliko časa mine od zaključka faze ali prevzema do izstavitve računa?',
    options: [
      { value: 0, label: 'Nekaj dni, ob zapisniku' },
      { value: 1, label: 'Do dva tedna' },
      { value: 2, label: 'Mesec ali več' },
      { value: 3, label: 'Odvisno, kdo se spomni' },
    ],
  },
  fields: [
    // Prihodek pride iz skupne finančne osnove (contexts/inzeniring.ts) — je lastnost
    // podjetja, ne področja, in mora obstajati tudi, kadar to področje ni izbrano.
    {
      key: 'phaseInvoiceLagDays',
      label:
        'Koliko dni po zaključku faze (prevzemu, dobavi opreme, mejniku) v povprečju izdate situacijo ali račun?',
      kind: 'number',
      unit: 'dni',
      default: 0,
      help:
        'Do izdaje računa, ne do plačila. Zamude naročnikov pri plačilu tu ne štejejo — to je pogodbeni rok, ne ' +
        'napaka obračuna.',
      explainer:
        'Dnevi od potrjenega mejnika do datuma računa. Zapisnik o prevzemu faze je hkrati dokazilo o datumu ' +
        'opravljene storitve za DDV — prepozen račun pomeni tudi DDV v napačnem obdobju. Primer: faza končana 3., ' +
        'račun 24. → 21.',
    },
    {
      key: 'retentionOverdueEUR',
      label:
        'Kolikšna je vrednost zapadlih, nespornih, a še neunovčenih zadržanih sredstev in bančnih garancij?',
      kind: 'number',
      unit: 'EUR',
      default: 0,
      allowUnknown: true,
      help: 'Samo zadržki in garancije, ki jih že smete zahtevati, pa jih še niste. Odprte terjatve v roku sem ne sodijo.',
      explainer:
        'Zadržek 5–10 % vrednosti projekta se sprosti po garancijski dobi ali ob prevzemu — če nihče ne ' +
        'spremlja datuma, ostane pri naročniku. Ocena: 4 projekti × 15.000 EUR zadržka po roku ≈ 60.000 EUR.',
    },
    {
      key: 'unbilledServiceEUR',
      label:
        'Kolikšna je bila v zadnjih 12 mesecih vrednost servisnih posegov in vzdrževalnih pogodb po prevzemu, ki bi jih smeli zaračunati, pa jih niste?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help:
        'Samo zaračunljivo delo po pogodbi ali na klic. Garancijska popravila na vaš strošek — ure, deli, ' +
        'kulanca — merimo v področju Reklamacije in poprodajni servis.',
      explainer:
        'Serviser gre na objekt po klicu, poseg ni na nobenem nalogu, račun ne nastane; ali pa vzdrževalna ' +
        'pogodba poteče, ne da bi jo kdo obnovil. Ocena: 30 posegov × 400 EUR ≈ 12.000 EUR na leto.',
    },
    {
      key: 'phaseBillingHoursPerMonth',
      label:
        'Koliko ur mesečno gre za ročno pripravo situacij in obračunov po fazah, poročil o napredku za naročnika in spremljanje zadržkov?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help:
        'Samo obračun projektov. Usklajevanje bank, kartic in odprtih postavk merimo v področju Računovodstvo ' +
        'in finance.',
      explainer:
        'Vodja projekta zbere količine in mejnike, računovodstvo jih prepiše v situacijo, nekdo ročno preverja, ' +
        'kateri zadržek zapade. Ocena: 8 situacij × 3 h + 6 h spremljanja ≈ 30 ur na mesec.',
    },
    {
      key: 'billingTrigger',
      label: 'Kaj sproži izstavitev računa za fazo?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Zapisnik o prevzemu v sistemu' },
        { value: 1, label: 'Vodja projekta sporoči računovodstvu' },
        { value: 2, label: 'Pregled ob koncu meseca' },
        { value: 3, label: 'Ko vpraša naročnik ali banka' },
      ],
    },
    mainCauseField(OBRACUN_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(OBRACUN_CAUSES, input.mainCause);
    const dailyRevenue = context.annualRevenueEUR / 365;

    return [
      {
        // Brez odgovora o prihodku je to 0 — prometa si ne izmišljamo (glej
        // annualRevenue.fallback v contexts/inzeniring.ts). Osnova je celotna
        // letna vrednost projektov, ker podjetje do situacije predfinancira tudi
        // opremo in podizvajalce, ne le lastnega dela.
        bucket: 'directLoss',
        label: 'Denar, vezan v zaključenih fazah brez računa',
        valueEUR: dailyRevenue * input.phaseInvoiceLagDays * context.capitalCostRate,
        addressableShare,
      },
      {
        // Brez addressableShare in brez deleža: znesek je po definiciji zapadel in
        // nesporen, zato JE potencial v celoti — enkraten, ne letni.
        bucket: 'oneTimeCapital',
        label: 'Zapadli, neunovčeni zadržki in garancije',
        valueEUR: input.retentionOverdueEUR,
      },
      {
        // Poseg je opravljen in strošek zanj že nastal, zato je neobračunan servis
        // neposredna izguba: manjka samo račun.
        bucket: 'directLoss',
        label: 'Neobračunani servisni posegi in vzdrževalne pogodbe',
        valueEUR: input.unbilledServiceEUR,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Ročna priprava situacij in spremljanje zadržkov',
        valueEUR: input.phaseBillingHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.phaseBillingHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Obračun po mejnikih namesto ob zaključku projekta',
    'Zapisnik o prevzemu kot datum opravljene storitve za DDV in sprožilec računa',
    'Vzdrževalne pogodbe s ponavljajočim fakturiranjem in evidenco posegov po napravi',
  ],
};

// --- 5. Projektna dokumentacija, razpisi in prevzem -------------------------

const DOKUMENTACIJA_CAUSES: CauseOption[] = [
  { label: 'Dokumenti so v mapah, e-pošti in osebnih računalnikih', category: 'data' },
  { label: 'Meritve, certifikati in protokoli nastajajo ločeno od projekta', category: 'data' },
  { label: 'Teren nima dostopa do sistema in načrtov', category: 'planning' },
  { label: 'Znanje o projektu je pri enem inženirju', category: 'people' },
  { label: 'Vsak naročnik in razpis zahteva svojo obliko dokumentacije', category: 'external' },
];

export const dokumentacija_inzeniring: ModuleDefinition = {
  id: 'dokumentacija_inzeniring',
  title: 'Projektna dokumentacija, razpisi in prevzem',
  summary:
    'Iskanje veljavnih načrtov in dokazil, zbiranje referenc za razpise, ponovno sestavljanje dokumentacije ob predaji in teren brez dostopa do podatkov.',
  triage: {
    prompt: 'Kako hitro najdete veljavni načrt, meritev ali dobavnico za katerikoli projekt?',
    options: [
      { value: 0, label: 'V nekaj minutah, iz sistema' },
      { value: 1, label: 'V nekaj urah, iz map' },
      { value: 2, label: 'V nekaj dneh, s klici' },
      { value: 3, label: 'Odvisno, kdo je projekt vodil' },
    ],
  },
  fields: [
    {
      key: 'docStorage',
      label: 'Kje je danes projektna dokumentacija?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'V dokumentnem sistemu, vezana na projekt' },
        { value: 1, label: 'V omrežnih mapah po projektih' },
        { value: 2, label: 'V e-pošti in osebnih računalnikih' },
        { value: 3, label: 'Različno, odvisno od projekta' },
      ],
    },
    {
      key: 'docSearchHoursPerMonth',
      label:
        'Koliko ur mesečno inženirji porabijo za iskanje veljavne različice načrtov, specifikacij, dopisov in dobavnic?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Samo iskanje projektnih dokumentov. Iskanje opreme in usklajevanje rokov merimo v področju Oprema.',
      explainer:
        'Katera različica načrta velja, kje je potrjena specifikacija, kdo ima dobavnico — vsak inženir po nekaj ' +
        'minut na dan. Ocena: 8 inženirjev × 20 min na dan × 21 dni ≈ 56 ur na mesec.',
    },
    {
      key: 'tenderDocHoursPerMonth',
      label:
        'Koliko ur mesečno gre za zbiranje referenc, potrdil in sestavljanje razpisne dokumentacije iz starih projektov?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Samo reference in razpisi. Poročila za vodstvo merimo v področju Analitika in poročanje.',
      explainer:
        'Za vsak razpis znova: potrdila naročnikov, opisi in fotografije zaključenih projektov, seznam ' +
        'kadrov. Ocena: 2 razpisa na mesec × 12 h ≈ 24 ur na mesec.',
    },
    {
      key: 'handoverDocHoursPerMonth',
      label:
        'Koliko dodatnih ur mesečno gre ob predaji za ponovno zbiranje meritev, CE izjav, zagonskih poročil in dokumentacije izvedenih del?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help:
        'Ne celotne priprave projekta izvedenih del — samo čas, izgubljen z iskanjem in ponovnim zbiranjem ' +
        'dokazil, ki že obstajajo.',
      explainer:
        'Meritve so pri električarju, CE izjave pri dobavitelju, zagonsko poročilo v e-pošti — ob prevzemu jih ' +
        'nekdo zbira dneve. Ocena: 3 prevzemi × 10 h ≈ 30 ur na mesec.',
    },
    {
      key: 'fieldCallsHoursPerMonth',
      label:
        'Koliko ur mesečno monterji in inženirji na terenu izgubijo, ker nimajo dostopa do načrtov, stanja naročil in podatkov o projektu?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help:
        'Klici v pisarno in čakanje na podatek. Čakanje na opremo ali podizvajalca merimo v področju Oprema, ' +
        'potne naloge v področju Kadri in plače.',
      explainer:
        'Monter kliče v pisarno, ker ne ve, ali je bila sprememba potrjena in kdaj pride oprema; inženir vozi ' +
        'načrte na objekt. Ocena: 6 ljudi na terenu × 2 h na teden ≈ 50 ur na mesec.',
    },
    mainCauseField(DOKUMENTACIJA_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(DOKUMENTACIJA_CAUSES, input.mainCause);

    return [
      {
        bucket: 'capacity',
        label: 'Iskanje veljavne projektne dokumentacije',
        valueEUR: input.docSearchHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.docSearchHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Reference in razpisna dokumentacija',
        valueEUR: input.tenderDocHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.tenderDocHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Ponovno zbiranje dokumentacije ob predaji',
        valueEUR: input.handoverDocHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.handoverDocHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Teren brez dostopa do projektnih podatkov',
        valueEUR: input.fieldCallsHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.fieldCallsHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Dokumenti, vezani na projekt: načrti, meritve, protokoli in dobavnice na enem mestu',
    'Dostop do projektnih podatkov prek brskalnika tudi s terena',
    'Reference in dokazila iz zaključenih projektov brez ponovnega zbiranja',
  ],
};

// --- Kratka diagnostika -----------------------------------------------------

const DATA_RISK_NOTE: Record<RiskLevel, string> = {
  low: 'Ure in oprema so pripisane projektu sproti; marža projekta je znana med izvedbo, ne šele ob zaključku.',
  medium:
    'Podatki so delni. Del ur in opreme se projektu pripiše za nazaj, zato je marža ob zaključku ocena, ne izmerjena.',
  high: 'Ure in oprema niso vezane na projekt. Dokler tega ni, natančnega zneska izgubljene marže ni mogoče izračunati — in prav to je težava.',
};

const PROCESS_RISK_NOTE: Record<RiskLevel, string> = {
  low: 'Spremembe obsega so potrjene pred izvedbo in projekt ne stoji, ko vodilnega inženirja ni.',
  medium:
    'Del sprememb se izvede pred potrditvijo, znanje o projektu pa je pri nekaj ljudeh; ob odsotnosti se izvedba upočasni.',
  high: 'Dodatna dela se izvajajo brez potrditve, projekt pa živi v glavi enega inženirja. Ena odsotnost ali en spor z naročnikom stane maržo celotnega projekta.',
};

/**
 * Štiri vprašanja, ki se prikažejo vedno in NE prispevajo nobenega evra.
 *
 * Prvo vprašanje je prepis najmočnejšega kvalifikacijskega filtra iz raziskave
 * (list Kalkulator, vprašanje 3; hipoteza H02): ali podjetje ve, koliko ur je
 * posamezen inženir porabil za posamezen projekt. Kjer tega ne ve, natančnega
 * zneska izgubljene marže ni mogoče izračunati — in prav to je ugotovitev.
 */
export const diagnostika_inzeniring: ModuleDefinition = {
  id: 'diagnostika_inzeniring',
  title: 'Kratka diagnostika',
  summary: 'Štiri vprašanja o podatkih in odpornosti procesa. Ne prispevajo k finančnemu rezultatu.',
  fields: [
    {
      key: 'hoursPerProject',
      label: 'Ali veste, koliko ur je posamezen inženir porabil za posamezen projekt in fazo?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'equipmentPerProject',
      label: 'Ali je vsak kos opreme od naročila do vgradnje vezan na projekt?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'changeApprovedBefore',
      label: 'Ali je vsaka sprememba obsega pisno potrjena, preden jo izvedete?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'keyPersonIndependence',
      label: 'Ali projekt teče normalno tudi brez vodilnega inženirja ali vodje projekta?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
  ],
  compute: (input) => {
    const dataLevel = assuranceRiskLevel(input.hoursPerProject, input.equipmentPerProject);
    const processLevel = assuranceRiskLevel(input.changeApprovedBefore, input.keyPersonIndependence);

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
    'Kalkulacija marže po projektu in naročniku',
    'Zapisan obseg, aneksi in sledljivost sprememb',
    'Oprema in dokumenti, vezani na projekt, namesto znanja v glavah',
  ],
};

/**
 * Vrstni red je hkrati prioriteta — odloči ob izenačenju v triaži. Sledi
 * prednosti iz kataloga bolečin: ure in marža (B01, 15 točk; B07, 13), aneksi
 * (B02, 14), oprema (B03, 14; B05, 13), obračun (B04, 14; B13, 12), dokumentacija
 * (B09, 13; B15/B16, 11).
 */
export const INZENIRING_MODULES: ModuleDefinition[] = [
  marza_inzeniring,
  aneksi_inzeniring,
  oprema_inzeniring,
  obracun_inzeniring,
  dokumentacija_inzeniring,
  diagnostika_inzeniring,
];
