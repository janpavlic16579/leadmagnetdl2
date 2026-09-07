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
 * Pet medsebojno izključujočih se stroškovnih področij za predelavo plastike
 * (SKD C22.2: brizganje, ekstruzija, pihanje, termoformiranje).
 *
 * Zakaj svoj segment in ne splošna proizvodnja: predelovalec plastike je
 * proizvajalec, a njegova enota ni delovni nalog, ampak SERIJA NA STROJU. Tišči
 * ga izkoriščenost strojev, menjava orodja, poraba granulata proti normi in od
 * avgusta 2026 uredba PPWR o sestavi embalaže — štirje pojmi, ki jih splošni
 * proizvodni vprašalnik sploh ne vpraša. Nabor področij sledi katalogu bolečin
 * iz raziskave panoge (Datalab_raziskava_PLASTIKA_model.xlsx, list
 * Katalog_bolecin): najvišje ocenjene so izkoriščenost strojev (B01, 15 točk),
 * poraba granulata proti normi (B03, 15), menjave orodij (B02, 14), izmet brez
 * vzroka (B04, 14) ter planiranje na tabli, odpoklici v Excelu, orodja v ciklih
 * in zaloga granulata po tipih (B23, B10, B06, B09, po 13). Osrednja teza
 * raziskave: odgovor »izkoriščenosti ne merimo« je sam po sebi prodajni argument.
 *
 * Veljata isti dve načeli kot v proizvodnja.ts:
 *
 * 1. compute() vrne DEJANSKI sedanji strošek — brez množenja z deležem izboljšave.
 *    Koliko je od tega mogoče nasloviti, izračuna motor iz glavnega vzroka.
 * 2. Ista ura ali evro se ne sme pojaviti v dveh področjih. Meje so v besedilih
 *    help: načrtovana menjava je Stroji, okvara sredi serije je Orodja, čakanje
 *    na granulat je Zaloge; izmet iz proizvodnje je Granulat, odpis zaloge je
 *    Zaloge; reklamacija zaradi kakovosti je Granulat, doplačilo zaradi roka pa
 *    Planiranje; prepis proizvodnih podatkov je Stroji, prepis odpoklicev
 *    Planiranje, evidenca za plačo pa horizontala Kadri.
 *
 * STROJNA URA. Kontekst te dejavnosti (contexts/plastika.ts) definira operativno
 * uro kot polni strošek STROJNE ure z operaterjem — stroj, operater, energija in
 * amortizacija — ker so vse strojne postavke (menjave, zastoji, čakanje na
 * material) strojni čas, ne čas ljudi. Posledica: segment nima postavke za uro
 * operaterja in človek-ure (ročno javljanje, planiranje, odpoklici) se vrednotijo
 * po administrativni uri. Polja s strojnimi urami nosijo enoto MACHINE_HOURS_UNIT,
 * ki jo lib/plausibility.ts namenoma NE sešteva proti kapaciteti zaposlenih.
 *
 * Kar PANTHEON ne pokriva, ni obljubljeno: zajem signala neposredno s strojev
 * (raziskava, list PANTHEON_zemljevid: »zajem s strojev je treba rešiti
 * posebej«) in energija po stroju nista del standardne licence, zato energija
 * ostane kontekstno vprašanje brez zneska, alineje »PANTHEON naslavlja« pa
 * govorijo o terminalih in podatkih okoli stroja, ne o krmilniku.
 */

/** Tedni na mesec: menjave orodij se štejejo na teden, izračun je mesečen. */
const WEEKS_PER_MONTH = 52 / 12;

/**
 * Enota strojnih ur.
 *
 * Namenoma NI 'h/mesec': lib/plausibility.ts sešteje vsa polja z enoto h/mesec
 * in h/leto ter jih primerja s kapaciteto ZAPOSLENIH (160 h × število ljudi).
 * Strojna ura ni ura človeka — 30 strojev × 3 izmene bi pošteno vneseno številko
 * razglasilo za neverjetno. Izjema je izrecno zapisana v plausibility.test.ts;
 * enota ostane v oznakah izidov ("(strojne ure)"), ker motor strojne in delovne
 * ure sešteje v eno vsoto kapacitete.
 */
export const MACHINE_HOURS_UNIT = 'strojnih h/mesec';

// --- 1. Izkoriščenost strojev, menjave orodij in javljanje -------------------

const STROJI_CAUSES: CauseOption[] = [
  { label: 'Zaporedje nalogov ne upošteva orodij, barv in materialov', category: 'planning' },
  { label: 'Časi menjav in cikli se ne merijo oziroma se javljajo ročno z zamikom', category: 'data' },
  { label: 'Orodje, material ali nastavitve niso pripravljeni ob začetku menjave', category: 'planning' },
  { label: 'Usposobljenost nastavljalcev oziroma menjave ljudi', category: 'people' },
  { label: 'Stari stroji ali orodja brez hitrih vpenjal', category: 'physical' },
];

export const stroji_plastika: ModuleDefinition = {
  id: 'stroji_plastika',
  title: 'Izkoriščenost strojev, menjave orodij in javljanje',
  summary:
    'Strojni čas, ki ga vzamejo menjave orodij, in ure ročnega javljanja izdelanih kosov, izmeta in časov s strojev.',
  triage: {
    prompt:
      'Koliko strojnega časa izgubite z menjavami orodij in koliko ročnega dela imate z javljanjem proizvodnje?',
    options: [
      { value: 0, label: 'Malo — menjave so hitre, podatki pridejo s strojev' },
      { value: 1, label: 'Nekaj ur tedensko' },
      { value: 2, label: 'Vsak dan' },
      { value: 3, label: 'Stroji redno stojijo, podatki se prepisujejo' },
    ],
  },
  fields: [
    {
      key: 'machineCount',
      label: 'Koliko strojev imate v proizvodnji?',
      kind: 'number',
      unit: 'strojev',
      default: 0,
      // Prvo vprašanje lead magneta iz raziskave (list Kalkulator). V znesek ne
      // vstopa: strojne ure spodaj so vnesene, ne izpeljane. Prodajniku pove, ali
      // so vnesene strojne ure sploh verjetne — ovojnica za strojne ure še ne obstaja.
      contextOnly: true,
      help: 'Podatek ne vstopa v izračun — služi za oceno obsega.',
      explainer:
        'Brizgalni stroji, ekstruderji, pihalni in termoformirni stroji, ki dejansko obratujejo. Iz tega ' +
        'števila je mogoče presoditi, ali so strojne ure v naslednjih vprašanjih verjetne.',
    },
    {
      key: 'utilizationTracking',
      // Osrednja hipoteza raziskave (H01): način merjenja je najmočnejši
      // kvalifikacijski filter. Vrednosti v odstotkih namenoma ne vprašamo — kdor
      // ne meri, bi vpisal 0 ali oceno, in oboje bi izgledalo kot podatek.
      label: 'Kako merite izkoriščenost strojev?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Sproti, z zajemom ciklov s strojev' },
        { value: 1, label: 'Iz delovnih nalogov ali obratovalnih listov' },
        { value: 2, label: 'Ocenjujemo' },
        { value: 3, label: 'Ne merimo' },
      ],
    },
    {
      key: 'toolChangesPerWeek',
      label: 'Koliko menjav orodij naredite na teden na vseh strojih skupaj?',
      kind: 'number',
      unit: 'menjav/teden',
      default: 0,
    },
    {
      key: 'avgToolChangeMinutes',
      label: 'Koliko minut traja povprečna menjava orodja?',
      kind: 'number',
      unit: 'min',
      default: 0,
      help:
        'Od zadnjega dobrega kosa prejšnje serije do prvega dobrega kosa nove — ne le montaža orodja. ' +
        'Samo načrtovane menjave; okvaro orodja sredi serije štejte v področju Orodja.',
      explainer:
        'Čas, ko stroj ne izdeluje: demontaža, montaža, ogrevanje, nastavitev in vzorčenje do potrjenega ' +
        'prvega kosa. Če menjav ne merite, vzemite zadnjih pet in ocenite. Primer: 12 menjav na teden po ' +
        '45 minut ≈ 39 strojnih ur na mesec.',
    },
    {
      key: 'manualReportingHoursPerMonth',
      // Osrednji časovni vzvod raziskave (Predpostavke A01–A03: serije × ročni
      // delež evidentiranja × minute na serijo; B15 »ročno vnašanje proizvodnih
      // podatkov«). Horizontale merijo poročila in evidence za plačo, ne javljanja
      // kosov s strojev — brez tega polja bi ta ura ostala neizmerjena.
      label:
        'Koliko skupnih ur mesečno gre za ročno javljanje izdelanih kosov, izmeta in časov s strojev ter prepis v Excel ali sistem?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help:
        'Zapis na obratovalnem listu in prepis. Evidence prisotnosti za plačo (Kadri), poročila za vodstvo ' +
        '(Analitika) in prepisovanje odpoklicev kupcev (Planiranje) tu ne štejte.',
      explainer:
        'Operater ob koncu izmene vpiše kose, izmet in zastoje na list, planer jih prepiše v preglednico ali ' +
        'sistem — isti podatek dvakrat. Ocena: serije na mesec × minut na serijo: 180 serij × 16 min ≈ 48 ur ' +
        'na mesec.',
    },
    mainCauseField(STROJI_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(STROJI_CAUSES, input.mainCause);
    const changeHoursPerMonth =
      ((input.toolChangesPerWeek * input.avgToolChangeMinutes) / 60) * WEEKS_PER_MONTH;

    return [
      {
        bucket: 'capacity',
        label: 'Menjave orodij (strojne ure)',
        valueEUR: changeHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: changeHoursPerMonth,
        addressableShare,
        // Menjava orodja ima fizično dno: demontaža, montaža in ogrevanje ostanejo
        // tudi ob popolnih podatkih. Informacijski sistem naslovi ŠTEVILO menjav
        // (zaporedje nalogov po orodju, barvi in materialu) in pripravo nanje;
        // krajšanje same menjave je SMED — organizacijska disciplina ob stroju, ne
        // programska oprema. Brez meje bi vzrok "menjave ne merimo" trdil, da je
        // odpravljivih 75 % vsake menjave. KALIBRACIJA: raziskava (vrzel G11) šele
        // meri dejanski čas menjave v slovenskih podjetjih; 0,3 je zadržana ocena
        // in ne meritev, preveriti po prvih time studyjih.
        addressableCap: 0.3,
      },
      {
        // Ročno javljanje je delo ob stroju, ne strojni čas: vrednoti se po
        // administrativni uri, ker ta segment postavke za uro operaterja nima
        // (operativna ura je strojna ura, glej glavo datoteke).
        bucket: 'capacity',
        label: 'Ročno javljanje in prepisovanje proizvodnih podatkov',
        valueEUR: input.manualReportingHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.manualReportingHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Ločena operacija menjave orodja v tehnološkem postopku',
    'Zajem ciklov, kosov in izmeta s proizvodnimi terminali MT',
    'Zaporedje nalogov po orodjih, barvah in materialih',
  ],
};

// --- 2. Poraba granulata, izmet in reklamacije -------------------------------

const GRANULAT_CAUSES: CauseOption[] = [
  { label: 'Normativi porabe in recepture niso ažurni', category: 'data' },
  { label: 'Izmet se javlja zbirno, brez vzroka in brez vezave na stroj in orodje', category: 'data' },
  // Nepostavljen proces: serija, ki steče brez potrjenega prvega kosa, izmet
  // proizvaja, dokler ga kdo ne opazi.
  { label: 'Serija se zažene brez potrjenega prvega kosa', category: 'planning' },
  { label: 'Usposobljenost operaterjev in nastavljalcev', category: 'people' },
  { label: 'Kakovost granulata ali dotrajana orodja', category: 'physical' },
];

export const granulat_plastika: ModuleDefinition = {
  id: 'granulat_plastika',
  title: 'Poraba granulata, izmet in reklamacije',
  summary:
    'Granulat, ki konča kot izmet ali odpadna plastika, odstopanje porabe od norme in stroški reklamacij kupcev.',
  triage: {
    prompt: 'Kako pogosto nastajajo izmet, odstopanja porabe granulata od norme ali reklamacije?',
    options: [
      { value: 0, label: 'Redko' },
      { value: 1, label: 'Mesečno' },
      { value: 2, label: 'Tedensko' },
      { value: 3, label: 'Pri velikem deležu serij' },
    ],
  },
  fields: [
    {
      key: 'annualGranulateSpendEUR',
      label: 'Kolikšna je letna vrednost porabljenega granulata, barvil in aditivov?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Nabavna vrednost materiala v zadnjih 12 mesecih — brez energije, dela in embalaže.',
      explainer:
        'Vzemite postavko stroški materiala iz izkaza ali vsoto računov dobaviteljev granulata. Primer: 9 ' +
        'mio EUR prihodkov pri 45 % deležu materiala ≈ 4 mio EUR.',
    },
    {
      key: 'scrapSharePercent',
      label:
        'Kolikšen delež porabljenega materiala konča kot izmet, ki ga ne morete zmleti in vrniti v proces?',
      kind: 'percent',
      min: 0,
      // Zgornja meja 0,30 kot v proizvodnji: pri tankostenskih in tehničnih kosih
      // z zahtevnimi tolerancami je izmet nad 15 % realen.
      max: 0.3,
      step: 0.005,
      // Privzetek 0 in ne panožno povprečje: skupaj z vrednostjo granulata je to
      // zmnožek dveh polj, zato bi vsak privzetek nad 0 ustvaril znesek že ob vpisu
      // same vrednosti materiala. Delež je edino polje, ki trdi, da težava obstaja.
      default: 0,
      help:
        'Samo material, ki gre iz hiše kot odpadek ali se proda kot odpadna plastika. Regranulat, ki se ' +
        'vrne v proces, ne šteje; odpise zaloge granulata merimo v področju Zaloge.',
      explainer:
        'Delež vrednosti, ne kosov: vrednost odpadnega materiala delite z vrednostjo porabljenega. ' +
        'Primer: 120.000 EUR izmeta in odpadne plastike pri 4 mio EUR porabe je 3 %.',
    },
    {
      key: 'consumptionVsNorm',
      // Vprašanje Q10 raziskave in šesto vprašanje lead magneta: razkrije, ali
      // podjetje sploh ima merjenje. Odstopanja v odstotkih ne vprašamo — kdor ne
      // primerja, ga ne pozna, in ocena bi bila izmišljena številka.
      label: 'Ali dejansko porabo granulata na kos primerjate z normativom?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Da, po vsaki seriji' },
        { value: 1, label: 'Občasno ali za izbrane izdelke' },
        { value: 2, label: 'Ne' },
      ],
    },
    {
      key: 'regranulateTracking',
      // Regranulat brez evidence pomeni dvojno štetje ali izgubo vrednosti (B05);
      // zneska iz tega ni mogoče pošteno izpeljati, zato je to prodajni signal.
      label: 'Kako vodite regranulat?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Kot artikel v zalogi z deležem v recepturi' },
        { value: 1, label: 'Evidenca mletja brez vrednosti' },
        { value: 2, label: 'Ne vodimo' },
      ],
    },
    {
      key: 'annualClaimsCostEUR',
      label: 'Kolikšni so letni stroški reklamacij kupcev zaradi kakovosti?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help:
        'Samo, kar še ni v izmetu: nadomestna dobava, sortiranje pri kupcu, dobropisi. Doplačila zaradi ' +
        'zamud rokov merimo v področju Planiranje.',
      explainer:
        'Denar, ki je odtekel zaradi reklamacije: prevoz nadomestne serije, ure sortiranja, ki jih zaračuna ' +
        'kupec, dobropisi. Ocena: 10 reklamacij × 600 EUR ≈ 6.000 EUR na leto.',
    },
    mainCauseField(GRANULAT_CAUSES),
  ],
  compute: (input) => {
    const addressableShare = addressableShareOf(GRANULAT_CAUSES, input.mainCause);

    return [
      {
        bucket: 'directLoss',
        label: 'Izmet in odpadni material',
        valueEUR: input.annualGranulateSpendEUR * input.scrapSharePercent,
        addressableShare,
        // Izmet ima tehnološko dno: zagon serije, dolivki brez vročih kanalov in
        // vzorčenje ostanejo tudi ob popolnih podatkih. Raziskava panoge
        // (Predpostavke A16 in A17) računa z zmanjšanjem izmeta in odstopanja porabe
        // za 0,5–4 % osnove ob realizaciji 40–80 % — odpravljiva je približno
        // polovica, in še to skupaj s tehnološkimi ukrepi. Isti razlog kot
        // addressableCap pri izmetu v proizvodnja.ts.
        addressableCap: 0.5,
      },
      {
        bucket: 'directLoss',
        label: 'Reklamacije kupcev zaradi kakovosti',
        valueEUR: input.annualClaimsCostEUR,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Normativi porabe in recepture z deležem regranulata',
    'Javljanje izmeta z obveznim vzrokom, vezano na stroj in orodje',
    'Sledljivost šarže granulata do dobavljene serije',
  ],
};

// --- 3. Planiranje strojev in odpoklici kupcev --------------------------------

const PLANIRANJE_CAUSES: CauseOption[] = [
  { label: 'Plan ne upošteva razpoložljivosti orodij in strojev', category: 'planning' },
  { label: 'Naročila in odpoklici se prepisujejo ročno', category: 'data' },
  { label: 'Stanje serij in nalogov ni vidno sproti', category: 'planning' },
  { label: 'Kupci spreminjajo odpoklice in količine', category: 'external' },
  { label: 'Okvare strojev ali orodij', category: 'physical' },
];

export const planiranje_plastika: ModuleDefinition = {
  id: 'planiranje_plastika',
  title: 'Planiranje strojev in odpoklici kupcev',
  summary:
    'Ure razporejanja orodij na stroje in ponovnega planiranja, prepisovanje naročil in odpoklicov kupcev ter doplačila zaradi zamud.',
  triage: {
    prompt: 'Kako pogosto se plan strojev spreminja ali odpoklici kupcev prehitijo plan?',
    options: [
      { value: 0, label: 'Plan je stabilen' },
      { value: 1, label: 'Občasno' },
      { value: 2, label: 'Tedensko' },
      { value: 3, label: 'Skoraj vsak dan' },
    ],
  },
  fields: [
    {
      key: 'planningMethod',
      label: 'Kako danes planirate stroje in orodja?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'V sistemu, z omejitvami strojev in orodij' },
        { value: 1, label: 'V ERP-ju brez zanesljivega planiranja' },
        { value: 2, label: 'V Excelu' },
        { value: 3, label: 'Na tabli ali s sprotnim dogovorom' },
      ],
    },
    {
      key: 'calloffChannel',
      label: 'Kako prihajajo naročila in odpoklici kupcev?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Prek EDI ali portala neposredno v sistem' },
        { value: 1, label: 'Po e-pošti, prepišemo jih v sistem' },
        { value: 2, label: 'Po e-pošti, vodimo jih v Excelu' },
        { value: 3, label: 'Po telefonu in z dogovorom' },
      ],
    },
    {
      key: 'planningHoursPerMonth',
      label:
        'Koliko ur mesečno porabite za razporejanje orodij na stroje, ponovno planiranje in usklajevanje prioritet?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Ure planerja in vodje proizvodnje. Ročno javljanje proizvodnih podatkov merimo v področju Stroji.',
      explainer:
        'Sestanki o prioritetah, prestavljanje serij ob spremembi odpoklica, iskanje prostega stroja za nujno ' +
        'orodje. Ocena: 2 osebi × 1 h na dan × 21 dni ≈ 42 ur na mesec.',
    },
    {
      key: 'calloffAdminHoursPerMonth',
      label: 'Koliko ur mesečno porabite za prepisovanje in usklajevanje naročil ter odpoklicov kupcev?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help:
        'Samo naročila in odpoklici. Potrjevanje računov in e-izmenjavo drugih dokumentov merimo v področju ' +
        'Dokumentacija.',
      explainer:
        'Odpoklic pride po e-pošti ali s portala kupca, nekdo ga prepiše v Excel ali sistem in ob vsaki ' +
        'spremembi popravi. Ocena: 15 odpoklicev na teden × 20 min ≈ 22 ur na mesec.',
    },
    {
      key: 'lateDeliveryCostEUR',
      label:
        'Koliko so vas v zadnjih 12 mesecih stali ekspresni prevozi, penali in popusti zaradi zamud rokov?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help:
        'Samo doplačilo nad redno izvedbo in samo zaradi rokov. Reklamacije zaradi kakovosti merimo v ' +
        'področju Granulat; nadure so čas ekipe in sem ne sodijo.',
      explainer:
        'Razlika med nujno in redno izvedbo, ne celotna cena: nujna dostava 900 EUR namesto 300 EUR → 600 ' +
        'EUR. K temu penali in popusti, ki jih je kupec odbil zaradi zamude.',
    },
    mainCauseField(PLANIRANJE_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(PLANIRANJE_CAUSES, input.mainCause);
    const rate = context.adminHourCostEUR;

    return [
      {
        bucket: 'capacity',
        label: 'Planiranje in usklajevanje prioritet',
        valueEUR: input.planningHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.planningHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Prepisovanje naročil in odpoklicov kupcev',
        valueEUR: input.calloffAdminHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.calloffAdminHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Ekspresni prevozi, penali in popusti zaradi zamud',
        valueEUR: input.lateDeliveryCostEUR,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Planiranje strojev in orodij s kapacitetnimi omejitvami',
    'Odpoklici kupcev v sistemu prek EDI ali portala',
    'Delovni nalogi in potrebe po materialu neposredno iz odpoklicev',
  ],
};

// --- 4. Orodja, vzdrževanje in zastoji strojev -------------------------------

const ORODJA_CAUSES: CauseOption[] = [
  { label: 'Cikli in servisni intervali orodij se ne spremljajo', category: 'data' },
  { label: 'Vzdrževanje ni planirano — ukrepamo ob okvari', category: 'planning' },
  { label: 'Premalo vzdrževalcev ali znanja o orodjih', category: 'people' },
  { label: 'Dobavitelji orodij in rezervnih delov', category: 'external' },
  { label: 'Dotrajani stroji ali orodja', category: 'physical' },
];

export const orodja_plastika: ModuleDefinition = {
  id: 'orodja_plastika',
  title: 'Orodja, vzdrževanje in zastoji strojev',
  summary:
    'Nenačrtovani zastoji zaradi okvar strojev in orodij sredi serije ter stroški nenačrtovanih popravil in nadomestnih delov.',
  triage: {
    prompt: 'Kako pogosto se stroj ali orodje pokvari sredi serije?',
    options: [
      { value: 0, label: 'Redko' },
      { value: 1, label: 'Nekajkrat na mesec' },
      { value: 2, label: 'Tedensko' },
      { value: 3, label: 'Skoraj vsak dan' },
    ],
  },
  fields: [
    {
      key: 'toolBreakdownsPerMonth',
      label: 'Kolikokrat na mesec se orodje ali stroj pokvari sredi serije?',
      kind: 'number',
      unit: 'okvar/mesec',
      default: 0,
      // Kot lateOrdersPerMonth v proizvodnji: števec, ki ne vstopa v formulo —
      // ure zastojev spodaj so vnesene neposredno, sicer bi bil isti zastoj
      // štet dvakrat (število × trajanje in vnesene ure).
      contextOnly: true,
      help: 'Podatek ne vstopa v izračun — služi za oceno obsega težave.',
      explainer:
        'Vsaka zaustavitev, ki ni bila planirana: zlomljen izmetalec, puščanje hidravlike, okvara grelca. ' +
        'Če evidence ni, preštejte zadnji mesec po spominu — natančnost tu ni pomembna, ure v naslednjem ' +
        'vprašanju so.',
    },
    {
      key: 'unplannedDowntimeHoursPerMonth',
      label: 'Koliko strojnih ur mesečno stroji stojijo zaradi nenačrtovanih okvar strojev in orodij?',
      kind: 'number',
      unit: MACHINE_HOURS_UNIT,
      default: 0,
      help:
        'Samo nenačrtovane okvare. Menjave orodij merimo v področju Stroji, čakanje na material v področju ' +
        'Zaloge.',
      explainer:
        'Od zaustavitve do ponovnega zagona serije, sešteto po strojih. Ocena: okvar na mesec × povprečno ' +
        'trajanje: 6 okvar × 4 h ≈ 24 strojnih ur na mesec.',
    },
    {
      key: 'annualRepairCostEUR',
      label: 'Kolikšni so letni stroški nenačrtovanih popravil orodij in strojev?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Nadomestni deli, zunanji servis in nujni prevozi delov — brez rednega, planiranega vzdrževanja.',
      explainer:
        'Računi zunanjih servisov in orodjarjev za popravila, ki niso bila v planu, plus nujno naročeni ' +
        'deli. Iz kontov vzdrževanja izločite redne servise. Primer: 8 popravil × 1.500 EUR ≈ 12.000 EUR ' +
        'na leto.',
    },
    {
      key: 'cycleTracking',
      label: 'Kako spremljate cikle in servisne intervale orodij?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'S števci na orodjih in servisnimi intervali v sistemu' },
        { value: 1, label: 'Ročno, v Excelu ali na kartici orodja' },
        { value: 2, label: 'Ne spremljamo' },
      ],
    },
    {
      key: 'energyTracking',
      // B11 »poraba energije po stroju ni znana« (prednost 12, fit 3): energija je
      // po hipotezi H10 tema, ki pri direktorju odpre pogovor, meritev pa je
      // podštevec in ne PANTHEON. Zato signal brez zneska.
      label: 'Ali merite porabo energije po stroju?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Da, s podštevci' },
        { value: 1, label: 'Ocenjujemo iz nazivne moči' },
        { value: 2, label: 'Ne, energija je v režiji' },
      ],
    },
    mainCauseField(ORODJA_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(ORODJA_CAUSES, input.mainCause);

    // Okvare ostanejo tudi ob načrtovanem vzdrževanju: docs/naslovljivost-raziskava-2026-08.md
    // meri znižanje nenačrtovanih zastojev ob uvedbi CMMS za 10–20 %, ob načrtovanem
    // vzdrževanju 5–10 %. Meja 0,2 je zgornji rob tega razpona; brez nje bi vzrok
    // "cikli se ne spremljajo" trdil, da je odpravljivih 75 % zastojev in popravil,
    // kar ni mogoče niti načeloma — orodje se obrabi ne glede na evidenco.
    const addressableCap = 0.2;

    return [
      {
        bucket: 'capacity',
        label: 'Nenačrtovani zastoji strojev (strojne ure)',
        valueEUR: input.unplannedDowntimeHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.unplannedDowntimeHoursPerMonth,
        addressableShare,
        addressableCap,
      },
      {
        bucket: 'directLoss',
        label: 'Nenačrtovana popravila in nadomestni deli',
        valueEUR: input.annualRepairCostEUR,
        addressableShare,
        addressableCap,
      },
    ];
  },
  pantheon: [
    'Števci ciklov in servisni intervali orodij z opomniki',
    'Evidenca zastojev z vzrokom po stroju in orodju',
    'Planirano vzdrževanje kot delovni nalog z nadomestnimi deli',
  ],
};

// --- 5. Zaloga granulata in gotovih izdelkov ---------------------------------

const ZALOGE_CAUSES: CauseOption[] = [
  { label: 'Stanje zalog po tipih, barvah in šaržah ni zanesljivo', category: 'data' },
  { label: 'Nabava ni povezana z odpoklici in planom proizvodnje', category: 'planning' },
  { label: 'Šarže in lokacije se ne vodijo', category: 'data' },
  { label: 'Dobavitelji granulata in nihanje cen', category: 'external' },
  { label: 'Zalogo zavestno držimo kot varovalko', category: 'planning' },
];

export const zaloge_plastika: ModuleDefinition = {
  id: 'zaloge_plastika',
  title: 'Zaloga granulata in gotovih izdelkov',
  summary:
    'Odpisi in inventurne razlike, stroji, ki čakajo na pravi granulat ali barvo, in kapital, vezan v zalogah.',
  triage: {
    prompt: 'Kako pogosto imate preveč granulata, hkrati pa manjka pravi tip ali barva?',
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
      help: 'Vključite granulat, barvila in aditive, regranulat, nedokončano proizvodnjo in gotove izdelke.',
      explainer:
        'Povprečno stanje med letom po nabavni vrednosti — ne stanje na današnji dan in ne letna poraba. ' +
        'Vzemite postavko iz bilance ali povprečje nekaj mesečnih stanj.',
    },
    {
      key: 'annualWriteOffEUR',
      label: 'Kolikšna je bila v zadnjih 12 mesecih vrednost odpisov zaloge in inventurnih razlik?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help:
        'Zastaran ali kontaminiran granulat, inventurne razlike, razvrednoteni gotovi izdelki. Izmet iz ' +
        'proizvodnje merimo v področju Granulat.',
      explainer:
        'Odpisi ob inventuri in razvrednotenja: granulat, ki se je navlažil ali mu je potekel rok, barve za ' +
        'ukinjene izdelke, gotovi izdelki brez kupca. Vzemite zapisnik zadnje inventure.',
    },
    {
      key: 'materialWaitingHoursPerMonth',
      label: 'Koliko strojnih ur mesečno stroji stojijo, ker pravega granulata, barve ali embalaže ni na zalogi?',
      kind: 'number',
      unit: MACHINE_HOURS_UNIT,
      default: 0,
      help:
        'Samo čakanje stroja na material. Zastoje zaradi okvar merimo v področju Orodja, menjave orodij v ' +
        'področju Stroji.',
      explainer:
        'Stroj z nameščenim orodjem čaka, ker granulata ni, ni posušen ali je napačne barve. Ocena: 4 ' +
        'zastoji × 3 h ≈ 12 strojnih ur na mesec.',
    },
    reducibleShareField(
      'Kolikšen delež zalog bi po vaši oceni lahko zmanjšali brez tveganja za oskrbo?',
      { explainer: REDUCIBLE_STOCK_EXPLAINER },
    ),
    {
      key: 'stockVisibility',
      label: 'Kako dober je vaš pregled nad zalogo granulata po tipih, barvah in šaržah?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Sproten, po tipu, barvi in šarži' },
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
        label: 'Odpisi zaloge in inventurne razlike',
        valueEUR: input.annualWriteOffEUR,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Čakanje strojev na material (strojne ure)',
        valueEUR: input.materialWaitingHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.materialWaitingHoursPerMonth,
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
    'Zaloga granulata po tipu, barvi, šarži in lokaciji',
    'Potrebe po materialu iz odpoklicev in receptur',
    'Prevzem regranulata v zalogo kot artikel',
  ],
};

// --- Kratka diagnostika -----------------------------------------------------

const DATA_RISK_NOTE: Record<RiskLevel, string> = {
  low: 'Kosi, izmet in poraba se evidentirajo sproti po nalogu, dejanski strošek kosa je znan. Odstopanje od kalkulacije opazite pri seriji, ne ob letnem obračunu.',
  medium:
    'Podatki so delni. Odstopanje od kalkulacije praviloma opazite šele ob obračunu, ko serije ni več mogoče popraviti.',
  high: 'Dejanske porabe in stroška kosa ne poznate. Dokler tega ni, zneska prodaje pod lastno ceno ni mogoče izračunati — in prav to je težava.',
};

const PPWR_RISK_NOTE: Record<RiskLevel, string> = {
  low: 'Serijo izdelka povežete s šaržo granulata, strojem in orodjem, sestava materiala in delež reciklata sta znana po izdelku. Dokumentacijo po uredbi PPWR lahko sestavite iz sistema.',
  medium:
    'Sledljivost je delna, sestava materiala je znana za del izdelkov. Ob reklamaciji ali zahtevi kupca po podatkih o reciklatu se podatki zbirajo ročno.',
  high: 'Sledljivosti do šarže granulata praktično ni in sestava materiala po izdelku ni znana. Uredba PPWR velja od 12. 8. 2026 in zahteva tehnično dokumentacijo o sestavi embalaže s hrambo 5 oziroma 10 let — zahteve kupca po teh podatkih danes ne morete izpolniti.',
};

const PROCESS_RISK_NOTE: Record<RiskLevel, string> = {
  low: 'Nastavitve strojev in tehnološki listi so zapisani in verzionirani, proizvodnja teče tudi brez tehnologa.',
  medium: 'Del nastavitev je zapisan, del v glavah. Odsotnost tehnologa upočasni zagon serij in menjave.',
  high: 'Nastavitve in znanje so pri eni osebi, tehnološki listi obstajajo v več verzijah. Odsotnost tehnologa lahko ustavi zagon serij, napačna verzija pa povzroči izmet.',
};

/**
 * Šest vprašanj v treh parih, ki se prikažejo vedno in NE prispevajo nobenega evra,
 * ter eno da/ne o trgu EU.
 *
 * Tretji par je pri tej dejavnosti več kot pri drugih: uredba PPWR (Uredba (EU)
 * 2025/40) se uporablja od 12. 8. 2026 brez izjeme za mala in srednja podjetja
 * (raziskava, list Regulatorni_koledar) in zahteva sestavo materiala in delež
 * reciklata NA RAVNI IZDELKA — kar je natanko sledljivost šarže granulata. Kjer
 * te ni, natančnega zneska tveganja ni mogoče izračunati, in to je ugotovitev,
 * ne številka. Vprašanje o sestavi je zastavljeno tako, da velja za vsakega
 * predelovalca (tudi kupci tehničnih delov zahtevajo podatek o reciklatu), ne
 * samo za proizvajalce embalaže: pogojnega prikaza motor ne pozna.
 *
 * Kljukica o trgu EU (sedmo vprašanje lead magneta iz raziskave) je prodajni
 * signal in nič drugega — pove, ali je PPWR za to podjetje neposredna obveznost
 * ali samo zahteva njegovih kupcev.
 */
export const diagnostika_plastika: ModuleDefinition = {
  id: 'diagnostika_plastika',
  title: 'Kratka diagnostika',
  summary:
    'Šest vprašanj o podatkih, sledljivosti in odpornosti procesa ter eno o trgu EU. Ne prispevajo k finančnemu rezultatu.',
  fields: [
    {
      key: 'realtimeProductionRecording',
      label: 'Ali sproti evidentirate izdelane kose, izmet in porabo granulata po delovnem nalogu?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'knowsUnitCost',
      label: 'Ali poznate dejanski strošek kosa iz izmerjenega cikla, porabe in energije?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'batchTraceability',
      label: 'Ali lahko vsako dobavljeno serijo povežete s šaržo granulata, strojem in orodjem?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'materialCompositionKnown',
      label: 'Ali za vsak izdelek poznate sestavo materiala in delež reciklata, kot ju zahteva uredba PPWR?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'keyPersonIndependence',
      label: 'Ali proizvodnja teče normalno tudi brez tehnologa ali vodje proizvodnje?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'documentedSettings',
      label: 'Ali so nastavitve strojev in tehnološki listi zapisani, verzionirani in dostopni ob stroju?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'packagingOnEuMarket',
      label: 'Dajemo embalažo ali embalirane izdelke na trg EU (velja uredba PPWR)',
      kind: 'checkbox',
      default: 0,
      contextOnly: true,
    },
  ],
  compute: (input) => {
    const dataLevel = assuranceRiskLevel(input.realtimeProductionRecording, input.knowsUnitCost);
    const ppwrLevel = assuranceRiskLevel(input.batchTraceability, input.materialCompositionKnown);
    const processLevel = assuranceRiskLevel(input.keyPersonIndependence, input.documentedSettings);

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
        label: 'Sledljivost in dokazovanje sestave (PPWR)',
        ...(ppwrLevel
          ? { riskLevel: ppwrLevel, note: PPWR_RISK_NOTE[ppwrLevel] }
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
    'Kalkulacija lastne cene kosa na dejanski cikel in porabo',
    'Šarže granulata s sledljivostjo do dobavljene serije',
    'Tehnološki listi in nastavitve v sistemu namesto v glavah',
  ],
};

/**
 * Vrstni red je hkrati prioriteta — odloči ob izenačenju v triaži. Sledi
 * prednosti iz kataloga bolečin: stroji in menjave (B01/B02, 15 in 14 točk),
 * granulat in izmet (B03/B04, 15 in 14), planiranje in odpoklici (B23/B10, 13),
 * orodja (B06, 13), zaloga granulata (B09, 13). Prva tri so privzeta v triaži.
 */
export const PLASTIKA_MODULES: ModuleDefinition[] = [
  stroji_plastika,
  granulat_plastika,
  planiranje_plastika,
  orodja_plastika,
  zaloge_plastika,
  diagnostika_plastika,
];
