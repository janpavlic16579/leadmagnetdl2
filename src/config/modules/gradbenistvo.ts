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
 * Pet medsebojno izključujočih se stroškovnih področij za gradbeništvo (SKD F41–F43:
 * gradnja stavb, inženirski objekti, specializirana gradbena dela).
 *
 * Zakaj svoj segment in ne storitve: gradbinec je projektno podjetje, a njegova
 * bolečina ni nezaračunana ura. Je marža projekta, ki jo izve šele ob zaključnem
 * obračunu; situacija, ki nastane v Excelu iz izmer; material in ure brez projektne
 * oznake; podizvajalci in zadržki — pojmi, ki jih storitveni vprašalnik sploh ne
 * vpraša. Osrednja teza raziskave panoge (Datalab_raziskava_GRADBENISTVO_model.xlsx,
 * list Naslovnica): odločilno vprašanje direktorja ni, koliko ur prihranimo, ampak
 * KDAJ izve, da projekt izgublja maržo. Nabor področij sledi katalogu bolečin (list
 * Katalog_bolecin): marža ob zaključku (B01), ročne situacije (B02), poraba
 * materiala (B03), ure brez projekta (B04), podizvajalci (B05), spremembe obsega
 * pred papirjem (B07) in zadržana sredstva (B09). Sedem vprašanj z lista Kalkulator
 * je razporejenih po teh področjih in po skupni finančni osnovi (contexts/gradbenistvo.ts).
 *
 * Veljata isti dve načeli kot v storitve.ts:
 *
 * 1. compute() vrne DEJANSKI sedanji strošek — brez množenja z deležem izboljšave.
 *    Koliko je od tega mogoče nasloviti, izračuna motor iz glavnega vzroka.
 * 2. Ista ura ali evro se ne sme pojaviti v dveh področjih. Meje so v besedilih
 *    help: priprava situacije je Situacije, primerjava plana z realizacijo Marža;
 *    pripis ur projektu je Gradbišče, evidenca prisotnosti za plačo horizontala
 *    Kadri in plače; situacija podizvajalca je Podizvajalci, račun za material
 *    horizontala Dokumentacija in e-poslovanje. Marža, izgubljena zaradi prepozne
 *    informacije, IZKLJUČUJE evre, ki jih vpišejo Situacije, Gradbišče in
 *    Podizvajalci — sicer bi bil isti odstop od kalkulacije štet dvakrat. Tega
 *    noben test ne more ujeti; meja živi v besedilu polja in tu.
 *
 * Kar PANTHEON ne pokriva, ni obljubljeno: dneve do potrditve situacije določa
 * nadzor, penale podizvajalcev povzroči podizvajalec. Oboje je vprašano kot
 * contextOnly — prodajnik obseg težave vidi, poročilo pa zanj ne obljublja
 * prihranka (isti vzorec kot penaltyStojnineEUR v logistiki). V evre vstopa samo
 * prekoračitev plačilnega roka NAD dogovorjenim (vzorec terjatve_trgovina).
 *
 * Urne postavke iz konteksta: operativna ura je delavec na gradbišču, administrativna
 * pa vodja gradbišča, priprava dela, kalkulant in obračun. Vsa ročna dela s podatki v
 * tej datoteki opravlja slednja skupina, zato se vrednotijo po administrativni uri.
 * Delavčeva ura vstopa v natanko eno postavko — čakanje ekipe na gradbišču (material,
 * stroj, navodilo): to je edini čas delavcev, ki ga vodja gradbišča zna oceniti na
 * pamet, ne da bi si ga izmislil. Varuje test v gradbenistvo.test.ts.
 */

// --- 1. Marža projekta in kontrola stroškov ---------------------------------

const MARZA_CAUSES: CauseOption[] = [
  { label: 'Stroški se projektu pripišejo z zamikom ali sploh ne', category: 'data' },
  { label: 'Ure in material nimajo projektne oznake', category: 'data' },
  { label: 'Plan in realizacija sta v ločenih orodjih', category: 'data' },
  // Nepostavljen proces: kalkulacija, ki po oddaji ponudbe ne živi naprej, ne more
  // biti merilo — odstopanja zato nihče ne išče.
  { label: 'Kalkulacija ponudbe ni podlaga za spremljanje izvedbe', category: 'planning' },
  { label: 'Naročnik spreminja obseg med izvedbo', category: 'external' },
];

export const marza_gradbenistvo: ModuleDefinition = {
  id: 'marza_gradbenistvo',
  title: 'Marža projekta in kontrola stroškov',
  summary:
    'Kdaj izveste, da projekt odstopa od kalkulacije, ročno seštevanje plana in realizacije ter marža, izgubljena zaradi prepozne informacije.',
  triage: {
    prompt: 'Kako pogosto izveste, da projekt odstopa od kalkulacije, šele ko za ukrepanje ni več časa?',
    options: [
      { value: 0, label: 'Sproti med izvedbo' },
      { value: 1, label: 'Občasno prepozno' },
      { value: 2, label: 'Redno prepozno' },
      { value: 3, label: 'Skoraj vedno šele ob zaključnem obračunu' },
    ],
  },
  fields: [
    {
      // "Najmočnejše vprašanje v panogi" (raziskava, list Kalkulator, Q3): meri zamik
      // informacije, ne stroška — zato contextOnly. V CRM in prodajno pripravo potuje
      // kot prvi podatek o zrelosti, v evre ne vstopa.
      key: 'marginTiming',
      label: 'Kdaj po koncu meseca veste, koliko je zaslužil posamezen projekt?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Sproti med izvedbo' },
        { value: 1, label: 'V desetih dneh' },
        { value: 2, label: 'Do konca naslednjega meseca' },
        { value: 3, label: 'Šele ob zaključnem obračunu projekta' },
      ],
    },
    {
      key: 'activeProjects',
      label: 'Koliko projektov imate hkrati v teku?',
      kind: 'number',
      unit: 'projektov',
      default: 0,
      contextOnly: true,
      help: 'Podatek ne vstopa v izračun — pove obseg, na katerem nastajajo spodnje postavke.',
      explainer:
        'Gradbišča in pogodbe, na katerih se ta mesec dela ali obračunava; zaključeni projekti v ' +
        'garancijski dobi ne štejejo. Groba ocena zadostuje.',
    },
    {
      key: 'costControlHoursPerMonth',
      label:
        'Koliko ur mesečno porabite za ročno primerjavo plana in realizacije po projektih — zbiranje stroškov iz računov, ur in dobavnic v Excel?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help:
        'Samo spremljanje stroškov projekta. Priprava situacij sodi v področje Situacije, obračun in ' +
        'dodatna dela, poročila za vodstvo v Analitika in poročanje, knjiženje v Računovodstvo in finance.',
      explainer:
        'Ure, ko nekdo iz računov, dobavnic in evidenc ur sestavlja, koliko je projekt do zdaj stal, in ' +
        'to primerja s kalkulacijo. Ocena: 2 osebi × 6 h na teden ≈ 50 ur na mesec.',
    },
    {
      key: 'lateDetectionMarginEUR',
      label:
        'Kolikšno maržo ste v zadnjih 12 mesecih izgubili na projektih, pri katerih ste odstopanje od kalkulacije opazili prepozno, da bi ukrepali?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help:
        'Brez neobračunanih dodatnih del, izginulega materiala in preplačil podizvajalcem — te vpišete v ' +
        'svojih področjih. Tu štejejo prekoračitve lastnih ur, strojnih ur in cen materiala, ki bi jih ob ' +
        'pravočasni informaciji še lahko ustavili.',
      explainer:
        'Ne vrednost projekta, ampak razlika med načrtovano in dejansko maržo pri projektih, kjer ste ' +
        'odstopanje videli šele ob obračunu. Primer: kalkulirana marža 60.000 EUR, dosežena 35.000 EUR → ' +
        '25.000 EUR; seštejte zadnjih 12 mesecev.',
    },
    {
      // Raziskava (list Kalkulator, Q6): "sprašuj po pogostosti, ne po znesku".
      key: 'deviationShare',
      label: 'Pri kolikšnem deležu projektov marža na koncu odstopa od načrtovane?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Skoraj pri nobenem' },
        { value: 1, label: 'Pri manj kot tretjini' },
        { value: 2, label: 'Pri tretjini do polovici' },
        { value: 3, label: 'Pri večini' },
      ],
    },
    mainCauseField(MARZA_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(MARZA_CAUSES, input.mainCause);

    return [
      {
        bucket: 'capacity',
        label: 'Ročna primerjava plana in realizacije',
        valueEUR: input.costControlHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.costControlHoursPerMonth,
        addressableShare,
      },
      {
        // Koš 'lostMargin' in ne 'directLoss': marža, ki je podjetje ni zaslužilo,
        // stoji na predpostavki, da bi jo ob pravočasni informaciji rešilo — trditev
        // z manjšo težo dokaza kot knjižen odliv, zato jo poročilo prikaže ločeno.
        bucket: 'lostMargin',
        label: 'Marža, izgubljena zaradi prepozne informacije',
        valueEUR: input.lateDetectionMarginEUR,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Projektno stroškovno mesto s sprotnim knjiženjem stroškov',
    'Plan proti realizaciji po projektu, brez ročnega seštevanja',
    'Kalkulacija ponudbe kot izhodišče za spremljanje izvedbe',
  ],
};

// --- 2. Situacije, obračun in dodatna dela ----------------------------------

const SITUACIJE_CAUSES: CauseOption[] = [
  { label: 'Količine se iz izmer in popisa prepisujejo ročno', category: 'data' },
  { label: 'Popis del ni v sistemu, ampak v Excelu', category: 'data' },
  { label: 'Dodatna dela se izvedejo pred pisno potrditvijo', category: 'planning' },
  { label: 'Nadzor situacije vrača ali potrjuje z zamudo', category: 'external' },
  // Ostaja people: gre za disciplino oddaje izmer, ne za obliko zapisa — težava
  // ostane tudi ob dobro postavljenem sistemu, le manjša.
  { label: 'Vodje gradbišč izmere oddajo z zamudo', category: 'people' },
];

export const situacije_gradbenistvo: ModuleDefinition = {
  id: 'situacije_gradbenistvo',
  title: 'Situacije, obračun in dodatna dela',
  summary:
    'Ročna priprava situacij iz izmer in popisa, popravki po vrnitvi z nadzora in dodatna dela, ki niso bila nikoli obračunana.',
  triage: {
    prompt: 'Koliko ročnega dela in popravkov zahtevajo situacije in obračun dodatnih del?',
    options: [
      { value: 0, label: 'Situacija nastane iz sistema' },
      { value: 1, label: 'Nekaj ur na situacijo' },
      { value: 2, label: 'Več dni vsak mesec' },
      { value: 3, label: 'Obračun je vsak mesec velik projekt' },
    ],
  },
  fields: [
    {
      key: 'situationPrepHoursPerMonth',
      label: 'Koliko ur mesečno porabite za pripravo situacij — količine iz izmer in popisa, cene, priloge?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Samo priprava lastnih situacij naročniku. Preverjanje situacij podizvajalcev sodi v področje Podizvajalci, pogodbe in zadržki.',
      explainer:
        'Delo od izmer na gradbišču do oddane situacije: prepis količin v popis, cene, sestavljanje prilog ' +
        'in dokazil. Ocena: 8 situacij × 3 h ≈ 24 ur na mesec.',
    },
    {
      key: 'situationReworkHoursPerMonth',
      label:
        'Koliko ur mesečno gre za popravke in ponovno pripravo situacij, ki jih je nadzor zavrnil ali potrdil samo delno?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Ne vključujte prve priprave iz prejšnjega vprašanja — samo delo po vrnitvi z nadzora.',
      explainer:
        'Iskanje manjkajočih prilog, ponovne izmere, popravljene količine in ponovna oddaja. Ocena: 2 ' +
        'vrnjeni situaciji × 5 h ≈ 10 ur na mesec.',
    },
    {
      key: 'unbilledExtrasEUR',
      label:
        'Kolikšno vrednost izvedenih dodatnih del in sprememb obsega v letu dni ne obračunate, ker niso bila pisno potrjena?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help:
        'Delo je opravljeno in strošek zanj že nastal — manjka samo račun. Ne vpisujte marže, ki ste jo ' +
        'izgubili zaradi prepozne informacije; to meri področje Marža projekta in kontrola stroškov.',
      explainer:
        'Dodatna dela po ustnem dogovoru, nepredvidena dela in spremembe načrta, ki jih naročnik ob ' +
        'situaciji ni priznal, ker ni bilo aneksa. Ocena: 5 primerov × 4.000 EUR ≈ 20.000 EUR na leto.',
    },
    {
      /*
       * contextOnly NAMENOMA. Dneve do potrditve določata nadzor in naročnik, ne
       * gradbinec — PANTHEON jih ne skrajša. Znesek bi torej v poročilu obljubljal
       * prihranek, ki ga ne moremo dostaviti. Vprašanje ostane, ker prodajniku pove,
       * koliko denarnega toka čaka v potrjevanju (raziskava, KPI K07).
       */
      key: 'approvalDays',
      label: 'Koliko dni v povprečju mine od oddaje situacije do njene potrditve pri nadzoru in naročniku?',
      kind: 'number',
      unit: 'dni',
      default: 0,
      contextOnly: true,
      help:
        'Podatek ne vstopa v izračun — služi za oceno obsega težave. Zamude plačil po zapadlosti meri ' +
        'področje Plačila, zadržana sredstva in terjatve.',
      explainer:
        'Dnevi od datuma oddaje situacije do podpisa nadzornika oziroma potrditve naročnika, ne do plačila. ' +
        'Primer: oddana 5., potrjena 23. → 18 dni; povprečje zadnjih šestih situacij.',
    },
    {
      key: 'changeOrderTiming',
      label: 'Kdaj se sprememba obsega praviloma pisno potrdi?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Pred izvedbo' },
        { value: 1, label: 'Med izvedbo' },
        { value: 2, label: 'Ob situaciji' },
        { value: 3, label: 'Šele ob zaključnem obračunu ali sploh ne' },
      ],
    },
    mainCauseField(SITUACIJE_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(SITUACIJE_CAUSES, input.mainCause);
    const rate = context.adminHourCostEUR;

    return [
      {
        bucket: 'capacity',
        label: 'Priprava situacij',
        valueEUR: input.situationPrepHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.situationPrepHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Popravki vrnjenih situacij',
        valueEUR: input.situationReworkHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.situationReworkHoursPerMonth,
        addressableShare,
      },
      {
        // Delo je opravljeno in strošek zanj že nastal, zato je neobračunano dodatno
        // delo neposredna izguba in ne nezaslužena marža: manjka samo račun.
        bucket: 'directLoss',
        label: 'Neobračunana dodatna dela in spremembe obsega',
        valueEUR: input.unbilledExtrasEUR,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Popis del in količine v sistemu, situacija brez ponovnega vnosa',
    'Sprememba obsega kot aneks z lastnim statusom, ne kot tiha dodelava',
    'Pregled izvedenih, a še neobračunanih del pred zaključkom meseca',
  ],
};

// --- 3. Ure, material in mehanizacija na gradbišču --------------------------

const GRADBISCE_CAUSES: CauseOption[] = [
  { label: 'Ure in material se zapisujejo na papir ali v Excel', category: 'data' },
  { label: 'Vsako gradbišče vodi svojo evidenco', category: 'data' },
  { label: 'Material se izdaja brez prevzemnice in projekta', category: 'planning' },
  { label: 'Dobavitelji dobavljajo na gradbišče brez naročilnice', category: 'external' },
  { label: 'Disciplina zapisovanja na terenu', category: 'people' },
];

export const gradbisce_gradbenistvo: ModuleDefinition = {
  id: 'gradbisce_gradbenistvo',
  title: 'Ure, material in mehanizacija na gradbišču',
  summary:
    'Čakanje ekipe na material in navodila, naknadni pripis ur projektu, material, ki ni ne vgrajen ne vrnjen, in vodje gradbišč brez podatkov na terenu.',
  triage: {
    prompt: 'Kako dobro veste, koliko ur, materiala in strojnih ur je porabil posamezen projekt?',
    options: [
      { value: 0, label: 'Sproti, po projektu' },
      { value: 1, label: 'Približno, ob koncu meseca' },
      { value: 2, label: 'Šele ob obračunu, z lovljenjem podatkov' },
      { value: 3, label: 'Tega ne vemo' },
    ],
  },
  fields: [
    {
      key: 'siteIdleHoursPerMonth',
      label:
        'Koliko skupnih ur mesečno delavci na gradbišču čakajo na material, stroj ali navodilo?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Samo ure delavcev na gradbišču, ki stojijo. Ure vodij gradbišč za klice v pisarno so v spodnjem vprašanju.',
      explainer:
        'Ekipa stoji, ker material ni prišel, stroj ni prost ali načrt ni jasen. Ocena: 12 delavcev × 2 h ' +
        'na teden ≈ 100 ur na mesec.',
    },
    {
      // Ključ ni `timesheetHoursPerMonth`: pod tem imenom isto polje obstaja v
      // horizontali Kadri in plače, ki je v tem segmentu prav tako aktivna. Ločnica
      // je v namenu evidence: tu pripis ur PROJEKTU kot podlaga za stroške projekta,
      // tam evidenca prisotnosti kot podlaga za plačo (isti razlog kot v storitve.ts).
      key: 'projectLaborAllocationHoursPerMonth',
      label:
        'Koliko ur mesečno porabite za naknadno zbiranje in razporejanje ur delavcev po projektih in postavkah?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Samo pripis ur projektu kot podlaga za stroške projekta. Evidenco prisotnosti in podlago za plačo meri področje Kadri in plače.',
      explainer:
        'Prepis gradbenih listov in dnevnikov v evidenco po projektih, iskanje ur brez projekta, ' +
        'usklajevanje z vodji gradbišč. Ocena: 1 oseba × 8 h na teden ≈ 34 ur na mesec.',
    },
    {
      key: 'materialLossEUR',
      label:
        'Kolikšna je bila v zadnjih 12 mesecih vrednost materiala, ki je bil naročen ali izdan na gradbišče, a ni bil ne vgrajen ne vrnjen?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help:
        'Razlika med naročenim in obračunanim ter inventurne razlike po gradbiščih. Material, ki ste ga ' +
        'porabili več zaradi napačne kalkulacije, sodi v Marža projekta in kontrola stroškov.',
      explainer:
        'Primerjajte dobavnice na gradbišče z vgrajenimi količinami iz situacij in ostankom, vrnjenim v ' +
        'skladišče; razlika je ta postavka. Ocena: 6 gradbišč × 2.000 EUR ≈ 12.000 EUR na leto.',
    },
    {
      key: 'fieldInfoHoursPerMonth',
      label:
        'Koliko ur mesečno vodje gradbišč porabijo za klice v pisarno in čakanje na podatek — aktualni načrt, popis, stanje naročila — ki ga na terenu nimajo?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Samo čas na terenu brez podatka. Iskanje dokumentov v arhivu in potrjevanje meri področje Dokumentacija in e-poslovanje.',
      explainer:
        'Vsak klic "katera verzija načrta velja" ali "je material že naročen" in čakanje na odgovor. ' +
        'Ocena: 4 vodje × 3 h na teden ≈ 50 ur na mesec.',
    },
    {
      // Mehanizacija v splošnih stroških (raziskava, B06) ni strošek, ampak popačenje
      // marže — zato kontekst in ne znesek. Kdor stroje najema, ima stroške na računu.
      key: 'machineAllocation',
      label: 'Kako se strojne ure lastne mehanizacije pripišejo projektu?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Sproti, po stroju in projektu' },
        { value: 1, label: 'Ocenjeno ob koncu meseca' },
        { value: 2, label: 'Ostanejo v splošnih stroških' },
        { value: 3, label: 'Lastne mehanizacije nimamo' },
      ],
    },
    mainCauseField(GRADBISCE_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(GRADBISCE_CAUSES, input.mainCause);
    const rate = context.adminHourCostEUR;

    return [
      {
        // Edina postavka v segmentu po delavčevi uri: stoji tisti, ki dela.
        bucket: 'capacity',
        label: 'Čakanje ekipe na gradbišču',
        valueEUR: input.siteIdleHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.siteIdleHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Naknadni pripis ur projektom',
        valueEUR: input.projectLaborAllocationHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.projectLaborAllocationHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Material brez vgradnje in vračila',
        valueEUR: input.materialLossEUR,
        addressableShare,
      },
      {
        // Vodja gradbišča je vodstvena ura (glej help pri adminHour v kontekstu),
        // zato po administrativni in ne po delavčevi postavki.
        bucket: 'capacity',
        label: 'Klici in čakanje na podatke s terena',
        valueEUR: input.fieldInfoHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.fieldInfoHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Evidenca ur z obvezno projektno oznako, potrjena po gradbišču',
    'Naročila materiala vezana na projekt in terminski plan, dobava vidna vodji gradbišča',
    'Vsako gradbišče kot skladišče: izdaja, poraba in vračilo materiala po projektu',
    'Spletni dostop do načrtov, popisov in naročil za vodje gradbišč',
  ],
};

// --- 4. Podizvajalci, pogodbe in zadržki ------------------------------------

const PODIZVAJALCI_CAUSES: CauseOption[] = [
  { label: 'Pogodbe, situacije in zadržki podizvajalcev niso na enem mestu', category: 'data' },
  { label: 'Situacija podizvajalca se ne primerja s pogodbo in izmerami', category: 'data' },
  { label: 'Zadržki in roki se ne spremljajo po datumih', category: 'planning' },
  { label: 'Podizvajalci obračunajo več, kot je izvedeno', category: 'external' },
  { label: 'Vodje gradbišč izvedbo potrdijo brez preverjanja', category: 'people' },
];

export const podizvajalci_gradbenistvo: ModuleDefinition = {
  id: 'podizvajalci_gradbenistvo',
  title: 'Podizvajalci, pogodbe in zadržki',
  summary:
    'Preverjanje situacij podizvajalcev proti pogodbi, dvojno ali preveč plačane postavke in penali, ki jih povzročijo podizvajalci.',
  triage: {
    prompt: 'Koliko dela in sporov vam povzročajo situacije, pogodbe in zadržki podizvajalcev?',
    options: [
      { value: 0, label: 'Malo — vse je v sistemu' },
      { value: 1, label: 'Nekaj ur na mesec' },
      { value: 2, label: 'Vsak mesec več dni preverjanja' },
      { value: 3, label: 'Spori in dvojni obračuni so stalnica' },
    ],
  },
  fields: [
    {
      key: 'subcontractorCount',
      label: 'Koliko podizvajalcev vodite hkrati?',
      kind: 'number',
      unit: 'podizvajalcev',
      default: 0,
      contextOnly: true,
      help: 'Podatek ne vstopa v izračun — pove, koliko pogodb in situacij je treba vsak mesec preveriti.',
      explainer:
        'Podizvajalci z veljavno pogodbo na vsaj enem odprtem gradbišču ta mesec; dobavitelji materiala ' +
        'ne štejejo. Groba ocena zadostuje.',
    },
    {
      key: 'subcontractorAdminHoursPerMonth',
      label:
        'Koliko ur mesečno porabite za preverjanje situacij podizvajalcev — primerjavo s pogodbo in izmerami — in njihovo potrjevanje?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help:
        'Samo situacije podizvajalcev. Potrjevanje računov za material in storitve meri področje ' +
        'Dokumentacija in e-poslovanje, priprava lastnih situacij pa Situacije, obračun in dodatna dela.',
      explainer:
        'Iskanje pogodbe, primerjava obračunanih količin z izmerami, preverjanje, ali je bilo isto delo že ' +
        'obračunano, odbitek zadržka. Ocena: 8 podizvajalcev × 2 h ≈ 16 ur na mesec.',
    },
    {
      key: 'subcontractorOverpayEUR',
      label:
        'Kolikšna je bila v zadnjih 12 mesecih vrednost dvojno ali preveč plačanih situacij podizvajalcev in spornih postavk, ki jih niste mogli uveljaviti?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help:
        'Samo, kar ste dejansko plačali preveč. Dodatna dela, ki jih vi niste obračunali naročniku, sodijo ' +
        'v področje Situacije, obračun in dodatna dela.',
      explainer:
        'Isto delo obračunano na dveh situacijah, količine nad izmerami, zadržek, ki ni bil odbit, in ' +
        'sporne postavke, ki ste jih na koncu priznali. Ocena: 3 primeri × 3.000 EUR ≈ 9.000 EUR na leto.',
    },
    {
      /*
       * contextOnly NAMENOMA. Penal za zamudo, ki jo povzroči podizvajalec, ostane
       * tudi ob urejeni evidenci — PANTHEON zamude ne prepreči. Vprašanje ostane, ker
       * prodajniku pove velikost težave (isti vzorec kot penaltyStojnineEUR v logistiki).
       */
      key: 'subcontractorPenaltyEUR',
      label:
        'Kolikšni so bili v zadnjih 12 mesecih pogodbeni penali in stroški zamud, ki so jih povzročili podizvajalci?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      contextOnly: true,
      help: 'Podatek ne vstopa v izračun — služi za oceno obsega težave.',
      explainer:
        'Penali naročnika in dodatni stroški (nadure, prestavljanje drugih ekip), ki so nastali, ker ' +
        'podizvajalec ni prišel ali ni dokončal pravočasno. Seštejte zadnjih 12 mesecev.',
    },
    mainCauseField(PODIZVAJALCI_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(PODIZVAJALCI_CAUSES, input.mainCause);

    return [
      {
        bucket: 'capacity',
        label: 'Preverjanje in potrjevanje situacij podizvajalcev',
        valueEUR: input.subcontractorAdminHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.subcontractorAdminHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Preplačane in dvojno obračunane situacije podizvajalcev',
        valueEUR: input.subcontractorOverpayEUR,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Pogodbe, situacije in zadržki podizvajalcev, vezani na projekt',
    'Primerjava situacije podizvajalca s pogodbo in izmerami pred potrditvijo',
    'Opomnik po datumu za sprostitev zadržkov in potek garancij',
  ],
};

// --- 5. Plačila, zadržana sredstva in terjatve ------------------------------

const PLACILA_CAUSES: CauseOption[] = [
  { label: 'Zapadlosti situacij, zadržkov in garancij se ne spremljajo po datumih', category: 'data' },
  { label: 'Situacija je zavrnjena zaradi manjkajočih prilog ali napak', category: 'data' },
  { label: 'Obračun se pripravi pozno po izvedbi', category: 'planning' },
  { label: 'Naročniki plačujejo z zamudo', category: 'external' },
  { label: 'Razpoložljivost ljudi za izterjavo', category: 'people' },
];

export const placila_gradbenistvo: ModuleDefinition = {
  id: 'placila_gradbenistvo',
  usesRevenue: true,
  title: 'Plačila, zadržana sredstva in terjatve',
  summary:
    'Denar, vezan v prekoračenih plačilnih rokih in zadržkih, odpisane terjatve ter ure opominjanja in usklajevanja.',
  triage: {
    prompt: 'Kako pogosto čakate na plačilo ali sprostitev zadržkov dlje, kot bi morali?',
    options: [
      { value: 0, label: 'Plačila in zadržki prihajajo ob roku' },
      { value: 1, label: 'Občasno' },
      { value: 2, label: 'Redno, pri več naročnikih' },
      { value: 3, label: 'Zamude so pravilo' },
    ],
  },
  fields: [
    {
      key: 'overdueDays',
      label: 'Za koliko dni v povprečju naročniki prekoračijo dogovorjeni plačilni rok?',
      kind: 'number',
      unit: 'dni',
      default: 0,
      help:
        'Samo dnevi PO zapadlosti, ne celoten plačilni rok. Čas potrjevanja situacije pri nadzoru je ' +
        'vprašan v področju Situacije, obračun in dodatna dela in v izračun ne vstopa.',
      explainer:
        'Povprečna razlika med datumom zapadlosti in datumom plačila pri situacijah zadnjih 12 mesecev. ' +
        'Primer: rok 60 dni, plačano po 95 dneh → 35 dni.',
    },
    {
      key: 'retentionEUR',
      label:
        'Kolikšna je skupna vrednost zadržanih sredstev pri naročnikih — zadržki na situacijah in garancijski zadržki?',
      kind: 'number',
      unit: 'EUR',
      default: 0,
      help: 'Stanje danes, ne letni znesek. Zadržkov, ki jih vi držite podizvajalcem, ne vpisujte.',
      explainer:
        'Seštevek vseh zneskov, ki jih naročniki zadržujejo do primopredaje ali do poteka garancije — ' +
        'običajno 5 do 10 % vsake situacije. Iz saldakontov ali iz zadnjih situacij.',
    },
    // Lastno pojasnilo in ne REDUCIBLE_STOCK_EXPLAINER: tisto govori o blagu na
    // polici, tu gre za denar, ki ga drži naročnik.
    reducibleShareField(
      'Kolikšen delež tega bi po vaši oceni lahko sprostili s sprotnim spremljanjem rokov in pravočasnim unovčenjem?',
      {
        help: 'Brez pogajanj z naročnikom — samo zadržki, ki so že zapadli ali jih lahko nadomesti bančna garancija.',
        explainer:
          'Ne koliko denarja je zadržanega, ampak koliko bi ga trajno lahko bilo manj, če bi vsak zadržek ' +
          'ob poteku roka takoj terjali ali ga nadomestili z garancijo. Groba ocena zadostuje.',
      },
    ),
    {
      key: 'writeOffEUR',
      label:
        'Kolikšna je bila v zadnjih 12 mesecih vrednost odpisanih terjatev — stečaji naročnikov, neizterljive situacije?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Samo dokončno odpisano. Zadržki, ki jih še lahko unovčite, so v zgornjem vprašanju.',
      explainer:
        'Terjatve, ki ste jih v zadnjem letu odpisali ali prijavili v stečajno maso brez pričakovanega ' +
        'poplačila. Iz zaključnega računa ali saldakontov.',
    },
    {
      key: 'dunningHoursPerMonth',
      label:
        'Koliko ur mesečno porabite za opominjanje, usklajevanje odprtih postavk z naročniki in preverjanje zapadlih zadržkov in garancij?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Ne vključujte popravkov vrnjenih situacij — te meri področje Situacije, obračun in dodatna dela.',
      explainer:
        'Klici in e-pošta zaradi neplačanih situacij, usklajevanje odprtih postavk, iskanje datumov ' +
        'zapadlosti zadržkov in garancij. Ocena: 1 oseba × 4 h na teden ≈ 17 ur na mesec.',
    },
    mainCauseField(PLACILA_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(PLACILA_CAUSES, input.mainCause);
    const dailyRevenue = context.annualRevenueEUR / 365;

    return [
      {
        // Šteje se samo prekoračitev NAD dogovorjenim rokom — financiranje roka, ki ga
        // je gradbinec naročniku sam odobril, je normalno poslovanje. Brez odgovora o
        // prihodku je to 0: prometa si ne izmišljamo (annualRevenue.fallback v
        // contexts/gradbenistvo.ts).
        bucket: 'directLoss',
        label: 'Denar, vezan v prekoračenih plačilnih rokih',
        valueEUR: dailyRevenue * input.overdueDays * context.capitalCostRate,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Odpisane terjatve',
        valueEUR: input.writeOffEUR,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Opominjanje in usklajevanje plačil',
        valueEUR: input.dunningHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.dunningHoursPerMonth,
        addressableShare,
      },
      {
        // Brez addressableShare: ta znesek JE potencial, ne sedanji strošek.
        // Množenje z naslovljivim deležem bi ga štelo dvakrat.
        bucket: 'oneTimeCapital',
        label: 'Sprostljiva zadržana sredstva',
        valueEUR: input.retentionEUR * reducibleShareOf(input.reducibleShare),
      },
    ];
  },
  pantheon: [
    'Saldakonti s koledarjem zapadlosti situacij, zadržkov in garancij',
    'Samodejni opomniki in pregled odprtih postavk po naročniku',
    'Stanje odprtih postavk naročnika, vidno pred sprejemom novega posla',
  ],
};

// --- Kratka diagnostika -----------------------------------------------------

const DATA_RISK_NOTE: Record<RiskLevel, string> = {
  low: 'Ure in strojne ure so pripisane projektu, marža projekta je znana med izvedbo. Odstopanje opazite, ko ga je še mogoče popraviti.',
  medium:
    'Podatki so delni. Odstopanje od kalkulacije praviloma opazite šele ob situaciji ali zaključnem obračunu, ko projekta ni več mogoče popraviti.',
  high: 'Dokler stroški niso pripisani projektu, marže ni mogoče izračunati — in prav to je težava. Natančnega zneska izgubljene marže zato ni, dejanski pa je praviloma višji od vpisanega.',
};

const PROCESS_RISK_NOTE: Record<RiskLevel, string> = {
  low: 'Spremembe obsega so potrjene pred izvedbo in gradbišče ni odvisno od posameznika.',
  medium: 'Spremembe so potrjene le delno. Ob sporu o dodatnih delih je težko dokazati, kaj je bilo naročeno.',
  high: 'Dodatna dela se izvajajo brez pisne potrditve, znanje o gradbišču pa je v glavi ene osebe. En spor ali odhod vodje gradbišča lahko ustavi obračun več projektov.',
};

/**
 * Štiri vprašanja, ki se prikažejo vedno in NE prispevajo nobenega evra.
 *
 * Namenoma brez zneska: kjer stroški niso pripisani projektu ali sprememba obsega
 * ni zapisana, natančnega zneska ni mogoče izračunati, navidezno natančna številka
 * pa bi prav to težavo skrila. Modul zato nima triaže in ne more biti "največja
 * postavka".
 */
export const diagnostika_gradbenistvo: ModuleDefinition = {
  id: 'diagnostika_gradbenistvo',
  title: 'Kratka diagnostika',
  summary: 'Štiri vprašanja o podatkih in odpornosti procesa. Ne prispevajo k finančnemu rezultatu.',
  fields: [
    {
      key: 'hoursMachinesAllocated',
      label: 'Ali so vse ure delavcev in strojne ure pripisane projektu, na katerem so nastale?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'knowsMarginInProgress',
      label: 'Ali poznate dejansko maržo posameznega projekta že med izvedbo, ne šele ob zaključku?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'changeOrdersDocumented',
      label: 'Ali so spremembe obsega in dodatna dela pisno potrjeni, preden se izvedejo?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      // Raziskava, B17: "Podatki so v glavi enega vodje gradbišča" — operativna krhkost.
      key: 'siteRunsWithoutKeyPerson',
      label: 'Ali gradbišče in obračun tečeta normalno tudi brez vodje gradbišča ali ene ključne osebe?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
  ],
  compute: (input) => {
    const dataLevel = assuranceRiskLevel(input.hoursMachinesAllocated, input.knowsMarginInProgress);
    const processLevel = assuranceRiskLevel(input.changeOrdersDocumented, input.siteRunsWithoutKeyPerson);

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
    'Projektno stroškovno mesto z vsemi urami, materialom in stroji',
    'Aneksi in spremembe obsega s statusom in sledljivostjo',
    'Dokumentiran proces obračuna namesto znanja v glavah',
  ],
};

/** Vrstni red je hkrati prioriteta — odloči ob izenačenju v triaži. */
export const GRADBENISTVO_MODULES: ModuleDefinition[] = [
  marza_gradbenistvo,
  situacije_gradbenistvo,
  gradbisce_gradbenistvo,
  podizvajalci_gradbenistvo,
  placila_gradbenistvo,
  diagnostika_gradbenistvo,
];
