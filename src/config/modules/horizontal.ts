import { addressableShareOf, mainCauseField, type CauseOption } from './addressableShare';
import type { ModuleDefinition } from './moduleTypes';
import { MONTHS_PER_YEAR } from './shared';

/**
 * Pet horizontalnih področij, ki presegajo posamezno dejavnost: analitika,
 * računovodstvo in finance, kadri in plače, dokumentacija ter reklamacije in
 * poprodajni servis.
 *
 * Panožni vprašalnik meri samo bolečino osnovne dejavnosti — proizvodno podjetje
 * pa poročila sestavlja, plače obračunava in dokumente potrjuje enako kot vsako
 * drugo. Ta področja se dodajo v triažo VEČ segmentov hkrati (config/segments.ts),
 * po istem vzorcu kot skupni modul E: ena definicija, en id, več segmentov.
 * Poglobljena vprašanja dobijo le, če jih obiskovalec v triaži oceni visoko —
 * vprašalnik se zato ne podaljša, pokrije pa širšo bolečino.
 *
 * Veljata isti dve načeli kot pri panožnih modulih (glej proizvodnja.ts):
 * compute() vrne dejanski sedanji strošek, in ista ura se ne sme pojaviti v dveh
 * področjih. Tretje načelo je značilno samo tu: besedilo mora držati v VSAKEM
 * segmentu, zato razmejitveni napotki ne imenujejo sosednjih področij — ta so v
 * vsakem segmentu druga. Kjer se horizontala z obstoječim modulom segmenta
 * prekriva preveč, da bi razmejitev z besedilom zadoščala, je iz tistega
 * segmenta izpuščena (glej matriko v config/segments.ts).
 */

// --- 1. Analitika in poročanje ----------------------------------------------

const ANALITIKA_CAUSES: CauseOption[] = [
  { label: 'Podatki so v več sistemih in preglednicah', category: 'data' },
  // Ne gre za osebo, ampak za vir: poročilo, ki ga sestavi sistem, tega dela nima.
  { label: 'Poročila ročno sestavlja ena oseba', category: 'data' },
  { label: 'Vsak oddelek ima svoje številke', category: 'data' },
  { label: 'Zahteve po poročilih se pogosto spreminjajo', category: 'planning' },
  { label: 'Podatke dobimo od zunanjega računovodstva', category: 'external' },
];

export const analitikaHz: ModuleDefinition = {
  id: 'analitikaHz',
  title: 'Analitika in poročanje',
  summary: 'Ročna priprava poročil za vodstvo, izredne analize in združevanje podatkov iz več virov.',
  triage: {
    prompt: 'Koliko ročnega dela zahteva priprava poročil in ključnih številk za odločanje?',
    options: [
      { value: 0, label: 'Poročila se sestavijo sama' },
      { value: 1, label: 'Nekaj ur ob koncu meseca' },
      { value: 2, label: 'Vsak teden po nekaj ur' },
      { value: 3, label: 'S poročili se nekdo ukvarja skoraj vsak dan' },
    ],
  },
  fields: [
    {
      key: 'reportPrepHoursPerMonth',
      // "vašega podjetja" je nosilno in ne okrasno: v računovodskem servisu je bilo to
      // polje neločljivo od priprave poročil ZA STRANKE, ki jo meri panožno področje.
      // Zamejitev je izražena vsebinsko in ne z imenom sosednjega področja — horizontala
      // je ista v šestih dejavnostih in ne sme imenovati področja, ki ga v peti ni
      // (glej pravilo na vrhu datoteke).
      label:
        'Koliko ur mesečno gre za ročno pripravo rednih poročil za vodstvo ali lastnike vašega podjetja?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Samo poročila, po katerih vodite svoje podjetje. Ure, ki ste jih že vpisali v drugem področju, tu ne ponavljajte.',
      explainer:
        'Ročno sestavljanje poročil: izvoz v Excel, lepljenje, oblikovanje, usklajevanje številk pred ' +
        'sestankom. Ocenite: koliko poročil na mesec × koliko ur na poročilo. Primer: 4 poročila × 3 h ≈ ' +
        '12 ur na mesec.',
    },
    {
      key: 'adHocAnalysisHoursPerMonth',
      label: 'Koliko ur mesečno vzamejo izredne analize in vprašanja "na hitro potrebujemo številko"?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'dataMergeHoursPerMonth',
      label:
        'Koliko ur mesečno gre za zbiranje in ročno združevanje podatkov iz različnih virov v eno preglednico?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'reportFreshness',
      label: 'Kako stare so ključne številke, ko jih vodstvo vidi?',
      kind: 'choice',
      default: 2,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Sprotne, iz sistema' },
        { value: 1, label: 'Stare nekaj dni' },
        { value: 2, label: 'Stare nekaj tednov' },
        { value: 3, label: 'Vidimo jih šele ob obračunu' },
      ],
    },
    mainCauseField(ANALITIKA_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(ANALITIKA_CAUSES, input.mainCause);
    const rate = context.adminHourCostEUR;

    // Tri ločene postavke namesto ene vsote: razčlenitev pokaže, kje ročno delo
    // dejansko nastaja, in obiskovalec vidi, da vprašanja niso podvojena.
    return [
      {
        bucket: 'capacity',
        label: 'Ročna priprava rednih poročil',
        valueEUR: input.reportPrepHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.reportPrepHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Izredne analize in iskanje številk',
        valueEUR: input.adHocAnalysisHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.adHocAnalysisHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Združevanje podatkov iz več virov',
        valueEUR: input.dataMergeHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.dataMergeHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Nadzorne plošče in poročila nad živimi podatki, brez ročnega sestavljanja',
    'Ena resnica: isti podatek za vse oddelke in poročila',
    'Vrtilne analize po strankah, artiklih in obdobjih neposredno iz sistema',
  ],
};

// --- 2. Računovodstvo in finance --------------------------------------------

const FINANCE_CAUSES: CauseOption[] = [
  { label: 'Dokumenti do knjiženja potujejo ročno', category: 'data' },
  { label: 'Isti podatek vnašamo v več sistemov', category: 'data' },
  { label: 'Napake odkrijemo šele pri usklajevanju', category: 'planning' },
  { label: 'Odvisni smo od zunanjega servisa', category: 'external' },
  // Proces ni postavljen; z enotnim sistemom ročno usklajevanje odpade.
  { label: 'Nihče nima financ v celoti za svojo nalogo', category: 'planning' },
];

export const financeHz: ModuleDefinition = {
  id: 'financeHz',
  title: 'Računovodstvo in finance',
  summary:
    'Ročno knjiženje in priprava dokumentov, usklajevanje evidenc ter davčni obračuni in poročanje.',
  triage: {
    prompt: 'Koliko ročnega dela je v vašem računovodstvu in financah (knjiženje, usklajevanje, obračuni)?',
    options: [
      { value: 0, label: 'Večina poteka samodejno' },
      { value: 1, label: 'Nekaj ur ob koncu meseca' },
      { value: 2, label: 'Več dni vsak mesec' },
      { value: 3, label: 'Konec meseca je vsakič zamašek' },
    ],
  },
  fields: [
    {
      key: 'bookingHoursPerMonth',
      label:
        'Koliko ur mesečno gre za ročno knjiženje in pripravo dokumentov za računovodstvo (interno ali zunanji servis)?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Ure, ki ste jih že vpisali v drugem področju, tu ne ponavljajte.',
      explainer:
        'Ročno knjiženje in priprava dokumentov zanj — vnos računov, priprava plačil, urejanje prilog. ' +
        'Ocenite: koliko ljudi × koliko ur na teden × 4,3. Primer: 1 oseba × 6 h na teden ≈ 26 ur na ' +
        'mesec.',
    },
    {
      key: 'reconciliationHoursPerMonth',
      label:
        'Koliko ur mesečno porabite za usklajevanje — banka, kartice kupcev in dobaviteljev, medsebojni IOP?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Štejte samo usklajevanje evidenc, ne opominjanja kupcev.',
      explainer:
        'Ure, ko primerjate dve evidenci, ki se ne ujemata: banka proti odprtim postavkam, saldakonti ' +
        'proti dobaviteljem, zaloga proti knjigovodstvu. Primer: 2 osebi × 3 h ob koncu meseca + 4 h med ' +
        'mesecem ≈ 10 ur.',
    },
    {
      key: 'closingHoursPerMonth',
      label: 'Koliko ur mesečno vzamejo davčni obračuni, DDV in poročanje državi?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      // "zaradi davčnih obračunov in poročanja" je nosilna zamejitev: zamudne obresti so
      // bile naštete kot primer tudi pri dokumentih (annualDocDelayEUR), zato je
      // obiskovalec, ki je izbral obe področji, isti znesek vpisal dvakrat. Vsako polje
      // je zdaj omejeno na svoj vzrok — tu obračun, tam prepozno potrjen dokument.
      key: 'annualPenaltyEUR',
      label:
        'Koliko so v zadnjih 12 mesecih znašale zamudne obresti, globe in stroški popravkov zaradi davčnih obračunov in poročanja?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Samo posledice napačnega ali prepoznega obračuna. Stroške prepozno potrjenih dokumentov merimo posebej.',
      explainer:
        'Seštejte zadnjih 12 mesecev: zamudne obresti na davčne obveznosti, globe zaradi ' +
        'prepozne oddaje, stroški popravkov in samoprijav. Primer: 2 samoprijavi × 400 EUR + ' +
        '600 EUR obresti ≈ 1.400 EUR.',
    },
    mainCauseField(FINANCE_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(FINANCE_CAUSES, input.mainCause);
    const rate = context.adminHourCostEUR;

    return [
      {
        bucket: 'capacity',
        label: 'Ročno knjiženje in priprava dokumentov',
        valueEUR: input.bookingHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.bookingHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Usklajevanje evidenc',
        valueEUR: input.reconciliationHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.reconciliationHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Obračuni in poročanje državi',
        valueEUR: input.closingHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.closingHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Zamudne obresti, globe in popravki',
        valueEUR: input.annualPenaltyEUR,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Samodejno knjiženje prejetih in izdanih dokumentov',
    'DDV in davčna poročila neposredno iz sistema, brez prepisovanja',
    'Kartice kupcev in dobaviteljev, usklajene brez ročnega primerjanja',
  ],
};

// --- 3. Kadri in plače ------------------------------------------------------

const KADRI_CAUSES: CauseOption[] = [
  { label: 'Evidence ur se zbirajo ročno — papir ali preglednice', category: 'data' },
  { label: 'Podatki za plače pridejo iz več virov', category: 'data' },
  { label: 'Pravila za dodatke in nadomestila so zapletena', category: 'planning' },
  { label: 'Zunanji obračun plač zahteva ročno pripravo podatkov', category: 'external' },
  // Ob urejeni evidenci naloga skoraj izgine — vzrok je nepostavljen proces, ne človek.
  { label: 'Kadrovska evidenca ni nikogaršnja glavna naloga', category: 'planning' },
];

export const kadriHz: ModuleDefinition = {
  id: 'kadriHz',
  title: 'Kadri in plače',
  summary: 'Evidence delovnega časa, priprava obračuna plač in kadrovska administracija.',
  triage: {
    prompt: 'Koliko dela zahtevajo evidence delovnega časa, dopusti in priprava plač?',
    options: [
      { value: 0, label: 'Malo — večina poteka samodejno' },
      { value: 1, label: 'Nekaj ur na mesec' },
      { value: 2, label: 'Nekaj dni vsak mesec' },
      { value: 3, label: 'Vsak mesec je to velik projekt' },
    ],
  },
  fields: [
    {
      key: 'timesheetHoursPerMonth',
      // "za plačo, ne za račun naročniku" je nosilna zamejitev: v storitvenih podjetjih je
      // bilo to polje neločljivo od projektne časovnice, ki je podlaga za obračun stranki.
      // Meja je izražena vsebinsko in ne z imenom sosednjega področja — horizontala je ista
      // v sedmih dejavnostih (glej pravilo na vrhu datoteke).
      label:
        'Koliko ur mesečno gre za zbiranje in urejanje evidenc prisotnosti in delovnih ur vaših zaposlenih?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Evidenca za plačo, ne za račun naročniku. Ure, ki ste jih že vpisali v drugem področju, tu ne ponavljajte.',
      explainer:
        'Zbiranje in urejanje evidenc: prepisovanje listov, lovljenje manjkajočih vnosov, popravki pred ' +
        'obračunom plač. Ocenite: koliko ur ob koncu meseca × koliko oseb to dela. Primer: 2 osebi × 5 h ' +
        '≈ 10 ur.',
    },
    {
      key: 'payrollPrepHoursPerMonth',
      label: 'Koliko ur mesečno vzame priprava podatkov za obračun plač in popravki po obračunu?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'hrAdminHoursPerMonth',
      label:
        'Koliko ur mesečno gre za dopuste, potne naloge, potrdila in drugo kadrovsko administracijo?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'annualPayrollErrorEUR',
      label:
        'Koliko so v zadnjih 12 mesecih stali napačni obračuni plač (poračuni, zamudne obresti, zunanja pomoč)?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
    },
    mainCauseField(KADRI_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(KADRI_CAUSES, input.mainCause);
    const rate = context.adminHourCostEUR;

    return [
      {
        bucket: 'capacity',
        label: 'Evidence prisotnosti in delovnih ur',
        valueEUR: input.timesheetHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.timesheetHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Priprava in popravki obračuna plač',
        valueEUR: input.payrollPrepHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.payrollPrepHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Kadrovska administracija',
        valueEUR: input.hrAdminHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.hrAdminHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Stroški napačnih obračunov plač',
        valueEUR: input.annualPayrollErrorEUR,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Registracija delovnega časa, neposredno povezana z obračunom plač',
    'Obračun plač po slovenski zakonodaji, brez zunanjih preglednic',
    'Dopusti, potni nalogi in kadrovske evidence na enem mestu',
  ],
};

// --- 4. Dokumentacija in e-poslovanje ---------------------------------------

const DOKUMENTI_CAUSES: CauseOption[] = [
  { label: 'Dokumenti so v mapah in e-pošti, ne v sistemu', category: 'data' },
  // Kategorija 'data' in ne 'planning': ročno potrjevanje po e-pošti je ročni prenos
  // dokumenta, kar je drugod v registru dosledno uvrščeno med podatkovne vzroke
  // (npr. "Podatke vodimo v več različnih orodjih", "Dokumenti so v mapah in e-pošti").
  // Kot 'planning' je isti vzrok dobil 65 % namesto 75 % naslovljivega deleža —
  // razlika ni kozmetična, ker vstopa neposredno v realistični potencial.
  { label: 'Potrjevanje poteka ročno, po e-pošti ali na papirju', category: 'data' },
  { label: 'Dokumenti prihajajo papirno ali kot skeni', category: 'external' },
  { label: 'Ni jasno, katera različica dokumenta je veljavna', category: 'data' },
  // Znanje v glavi je posledica neurejenih dokumentov — urejen sistem lokacijo pove sam.
  { label: 'Le ena oseba ve, kje kaj je', category: 'data' },
];

export const dokumentiHz: ModuleDefinition = {
  id: 'dokumentiHz',
  title: 'Dokumentacija in e-poslovanje',
  summary:
    'Potrjevanje dokumentov, iskanje in arhiviranje ter tiskanje in ročno pošiljanje, ki bi lahko potekalo elektronsko.',
  triage: {
    prompt: 'Koliko časa se izgubi s potrjevanjem, iskanjem in ročnim pošiljanjem dokumentov?',
    options: [
      { value: 0, label: 'Dokumenti so urejeni in dostopni' },
      { value: 1, label: 'Občasno kaj iščemo' },
      { value: 2, label: 'Potrjevanje in iskanje se redno vlečeta' },
      { value: 3, label: 'Dokumentacija je stalna težava' },
    ],
  },
  fields: [
    {
      key: 'approvalHoursPerMonth',
      label:
        'Koliko ur mesečno gre za ročno potrjevanje dokumentov — računov, naročil, pogodb — in priganjanje podpisnikov?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Ure, ki ste jih že vpisali v drugem področju, tu ne ponavljajte.',
      explainer:
        'Čas za lovljenje podpisov in potrditev: pošiljanje v podpis, opominjanje, iskanje, kje se je ' +
        'dokument ustavil. Ocenite: koliko dokumentov na mesec × koliko minut na dokument. Primer: 60 ' +
        'dokumentov × 10 min ≈ 10 ur.',
    },
    {
      key: 'searchArchiveHoursPerMonth',
      label: 'Koliko ur mesečno gre za iskanje in arhiviranje dokumentov?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'manualExchangeHoursPerMonth',
      label:
        'Koliko ur mesečno gre za tiskanje, skeniranje in ročno pošiljanje dokumentov, ki bi lahko potovali elektronsko?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      // Brez "zamudnih obresti" v naštevanju: isti primer je stal tudi pri financah
      // (annualPenaltyEUR) in je vabil k dvojnemu vpisu istega zneska. Ostanejo primeri,
      // ki jih povzroči izključno pot dokumenta.
      key: 'annualDocDelayEUR',
      label:
        'Koliko so v zadnjih 12 mesecih stali izgubljeni ali prepozno potrjeni dokumenti (zamujeni skonti, opomini dobaviteljev, ponovna izstavitev)?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Samo posledice poti dokumenta. Obresti in globe zaradi davčnih obračunov merimo posebej.',
      explainer:
        'Seštejte zadnjih 12 mesecev: zamujeni skonti za predčasno plačilo, stroški ponovne ' +
        'izstavitve izgubljenih dokumentov, opomini zaradi računa, ki je obtičal v potrjevanju. ' +
        'Primer: 20 zamujenih skontov × 80 EUR ≈ 1.600 EUR.',
    },
    mainCauseField(DOKUMENTI_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(DOKUMENTI_CAUSES, input.mainCause);
    const rate = context.adminHourCostEUR;

    return [
      {
        bucket: 'capacity',
        label: 'Potrjevanje dokumentov',
        valueEUR: input.approvalHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.approvalHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Iskanje in arhiviranje dokumentov',
        valueEUR: input.searchArchiveHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.searchArchiveHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Tiskanje, skeniranje in ročno pošiljanje',
        valueEUR: input.manualExchangeHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.manualExchangeHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Stroški izgubljenih in prepozno potrjenih dokumentov',
        valueEUR: input.annualDocDelayEUR,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Elektronsko potrjevanje dokumentov z revizijsko sledjo',
    'E-računi in e-izmenjava skladno z ZIERDED, brez ročnega pošiljanja',
    'Dokumentni arhiv, povezan s knjižbami, naročili in posli',
  ],
};

// --- 5. Reklamacije in poprodajni servis ------------------------------------

const SERVIS_CAUSES: CauseOption[] = [
  { label: 'Primere vodimo ročno — po e-pošti in v preglednicah', category: 'data' },
  { label: 'Ne vidimo zgodovine izdelka in prejšnjih posegov', category: 'data' },
  { label: 'Postopek reševanja ni enoten — vsak primer teče po svoje', category: 'planning' },
  { label: 'Napake izvirajo pri dobaviteljih ali proizvajalcih', category: 'external' },
  { label: 'Okvare zaradi obrabe in narave izdelka', category: 'physical' },
];

/**
 * Meri samo, česar panožni moduli ne: servis in garancije PO predaji ter vodenje
 * reklamacijskega postopka. Dobropisi, vračila kupnine in poškodovano blago so
 * izrecno izključeni — te evre že merijo panožna področja, zato bi bil isti znesek
 * sicer štet dvakrat.
 */
export const servisHz: ModuleDefinition = {
  id: 'servisHz',
  title: 'Reklamacije in poprodajni servis',
  summary:
    'Garancijska popravila in servisni posegi po predaji, vodenje reklamacijskega postopka ter nadomestni deli in zunanji servis.',
  triage: {
    prompt: 'Koliko dela vam povzročajo garancijska popravila, servis in vodenje reklamacij po predaji?',
    options: [
      { value: 0, label: 'Skoraj nič — primerov je malo' },
      { value: 1, label: 'Nekaj primerov na mesec' },
      { value: 2, label: 'Vsak teden več primerov' },
      { value: 3, label: 'S servisom se nekdo ukvarja vsak dan' },
    ],
  },
  fields: [
    {
      key: 'serviceWorkHoursPerMonth',
      label:
        'Koliko ur mesečno gre za garancijska popravila in servisne posege po predaji izdelka, blaga ali projekta?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Ure, ki ste jih že vpisali v drugem področju, tu ne ponavljajte.',
      explainer:
        'Ure tehnikov in serviserjev za garancijske ter servisne posege po predaji. Ocenite: koliko ' +
        'primerov na mesec × koliko ur na primer. Primer: 10 primerov × 2,5 h ≈ 25 ur.',
    },
    {
      key: 'rmaAdminHoursPerMonth',
      label:
        'Koliko ur mesečno vzame vodenje reklamacijskega postopka — sprejem in evidenca primerov, komunikacija s stranko ter uveljavljanje garancij in RMA pri dobaviteljih?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Štejte samo garancijske in servisne primere, ne urejanja običajnih vračil in dobropisov.',
      explainer:
        'Pisarniški del reklamacije: sprejem prijave, dokumentacija, usklajevanje z dobaviteljem, ' +
        'obveščanje stranke. Primer: 20 primerov × 45 min ≈ 15 ur na mesec.',
    },
    {
      key: 'annualServiceCostEUR',
      label:
        'Koliko so v zadnjih 12 mesecih znašali nadomestni deli, zunanji servis in kulanca pri garancijskih popravilih?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Samo stroški, ki še niso zajeti drugje — dobropisi, vračila kupnine in poškodovano blago sem ne sodijo.',
      explainer:
        'Denar, ki odteče poleg porabljenih ur: nadomestni deli, prevozi na teren, zunanji servis, ' +
        'odškodnine. Če tega ne vodite ločeno, vzemite povprečen primer × število primerov na leto.',
    },
    {
      key: 'caseTracking',
      label: 'Kako spremljate odprte reklamacijske in servisne primere?',
      kind: 'choice',
      default: 2,
      contextOnly: true,
      choices: [
        { value: 0, label: 'V sistemu, s statusi in roki' },
        { value: 1, label: 'V skupni preglednici' },
        { value: 2, label: 'Po e-pošti in po spominu' },
        { value: 3, label: 'Evidence nimamo' },
      ],
    },
    mainCauseField(SERVIS_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(SERVIS_CAUSES, input.mainCause);

    return [
      {
        // Servisni poseg opravi tisti, ki sicer proizvaja ali izvaja — neposredna
        // ura, po istem precedensu kot dodelave v panožnih modulih.
        bucket: 'capacity',
        label: 'Garancijska popravila in servisni posegi',
        valueEUR: input.serviceWorkHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.serviceWorkHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Vodenje reklamacijskega postopka',
        valueEUR: input.rmaAdminHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.rmaAdminHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Nadomestni deli, zunanji servis in kulanca',
        valueEUR: input.annualServiceCostEUR,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Servisni nalogi z zgodovino izdelka in vseh posegov na enem mestu',
    'Reklamacijski postopek s statusi in roki, ne po e-pošti',
    'Poraba nadomestnih delov, povezana z zalogo in nabavo',
  ],
};

/** Vrstni red je hkrati prioriteta — odloči ob izenačenju v triaži. */
export const HORIZONTAL_MODULES: ModuleDefinition[] = [
  analitikaHz,
  financeHz,
  kadriHz,
  dokumentiHz,
  servisHz,
];
