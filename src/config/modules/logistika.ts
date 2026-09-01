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
 * Šest medsebojno izključujočih se stroškovnih področij za logistiko in transport.
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
 * razpadel — špediter brez vozil vpiše 0 voznikov, skladiščnik tujega blaga 0
 * vrednosti zaloge, in izračun kljub temu ostane smiseln.
 *
 * Strošek operativne (skladiščnik, komisionar) in administrativne (disponent,
 * obračun, prodaja) ure prideta iz konteksta: sta lastnost podjetja, ne področja.
 *
 * PANTHEON — ZAKAJ TA NABOR IN NE PREJŠNJI. Do avgusta 2026 sta dve od petih
 * področij merili prazne kilometre, izkoriščenost voznega parka in razporejanje
 * voženj. To je delo transportnega sistema (TMS), ki ga Datalab NE ponuja — niti
 * kot licenco niti kot vertikalo (te so samo Farming, Vet in Public Service).
 * Izračun je torej obljubljal prihranek, ki ga produkt ne more dostaviti; da smo
 * pri tistem področju kot edinem v content/actions/actions.ts znali ponuditi le
 * procesni nasvet ("poiščite povratni tovor"), je bil simptom iste napake.
 *
 * Odslej merijo področja tisto, kar PANTHEON res pokriva: obračun in izdajo
 * računov, potne naloge z dnevnicami, saldakonte in opomine, dokumente in
 * e-izmenjavo, sledljivost serij ter zaloge po lokacijah. Stroški, ki jih
 * PANTHEON ne zniža (penali, stojnine, obseg voznega parka), ostanejo VPRAŠANI
 * kot contextOnly — prodajnik obseg težave vidi, poročilo pa zanj ne obljublja
 * prihranka.
 */

// --- 1. Obračun prevozov in nezaračunane storitve ---------------------------

const OBRACUN_CAUSES: CauseOption[] = [
  { label: 'Dokazila o dostavi pridejo z zamikom', category: 'data' },
  { label: 'Dodatki in čakanja se nikjer sproti ne evidentirajo', category: 'data' },
  { label: 'Ceniki in pogodbeni pogoji niso na enem mestu', category: 'data' },
  { label: 'Obračun je odvisen od ene osebe', category: 'planning' },
  { label: 'Naročniki spornih postavk ne priznajo', category: 'external' },
];

export const obracun: ModuleDefinition = {
  id: 'obracun_logistika',
  usesRevenue: true,
  title: 'Obračun prevozov in nezaračunane storitve',
  summary:
    'Dodatki, ki jih ne zaračunate, računi, ki čakajo na dokazilo, napačno zaračunani prevozi in čas za pripravo obračuna.',
  triage: {
    prompt: 'Kako pogosto opravljeno storitev zaračunate pozneje, kot bi lahko, ali je sploh ne zaračunate?',
    options: [
      { value: 0, label: 'Zaračunamo sproti in v celoti' },
      { value: 1, label: 'Občasno kaj uide' },
      { value: 2, label: 'Redno, opazno' },
      { value: 3, label: 'To je stalna težava' },
    ],
  },
  fields: [
    {
      key: 'unbilledExtrasEUR',
      label:
        'Kolikšno vrednost opravljenih dodatkov v letu dni ne zaračunate — čakanje, dodatne postaje, ležarine, doplačila?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Samo delo, ki ste ga opravili in bi ga smeli zaračunati, pa ga niste. Stojnine, ki jih plačate vi, vpišite spodaj.',
      explainer:
        'Opravljeni dodatki, ki jih niste zaračunali: čakanje, dodatne postaje, ležarine. Ocena: 15 ' +
        'čakanj × 40 EUR × 12 ≈ 7.200 EUR na leto.',
    },
    {
      key: 'invoiceLagDays',
      label: 'Koliko dni po opravljeni dostavi v povprečju izdate račun?',
      kind: 'number',
      unit: 'dni',
      default: 0,
      help: 'Če račun izdate isti ali naslednji dan, vpišite 0. Zamude naročnikov pri plačilu merimo v področju Plačilni roki.',
      explainer:
        'Dnevi od opravljene dostave do izdaje računa, ne do plačila — najpogosteje zamuja dokazilo o ' +
        'dostavi. Primer: dostava v ponedeljek, račun čez enajst dni → 11.',
    },
    {
      key: 'pricingErrorEUR',
      label:
        'Kolikšna je bila v zadnjih 12 mesecih vrednost napačno zaračunanih prevozov — napačna cena, pozabljen rabat, izdani dobropisi?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Samo napake v ceni. Dobropisi zaradi napačne ali poškodovane pošiljke sodijo v področje Napačne dostave.',
      explainer:
        'Samo dobropisi in popravki zaradi napačne cene, ne zaradi napake v izvedbi. Ocena: 18 dobropisov ' +
        '× 250 EUR ≈ 4.500 EUR na leto.',
    },
    {
      key: 'billingHoursPerMonth',
      label:
        'Koliko ur mesečno porabite za pripravo obračuna prevozov — zbiranje dokazil, preverjanje cen, izstavljanje računov?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Knjiženje prejetih računov sodi v področje Računovodstvo in finance, ne sem.',
      explainer:
        'Delo od zaključene vožnje do izdanega računa: zbiranje CMR in dokazil, preverjanje cene, vnos ' +
        'dodatkov. Ocena: 1 oseba × 8 h na teden ≈ 34 ur na mesec.',
    },
    {
      /*
       * contextOnly NAMENOMA. Penali in stojnine so resničen strošek, a nastanejo,
       * ker prevoz zamuja — tega PANTHEON ne prepreči. Znesek bi torej v poročilu
       * obljubljal prihranek, ki ga ne moremo dostaviti. Vprašanje ostane, ker
       * prodajniku pove velikost težave; enak vzorec kot lateDeliveriesPerMonth prej.
       */
      key: 'penaltyStojnineEUR',
      label: 'Kolikšni so bili letni penali in stojnine, ki ste jih plačali vi?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      contextOnly: true,
      help: 'Podatek ne vstopa v izračun — služi za oceno obsega težave.',
      explainer:
        'Penali, stojnine (demurrage, detention) in popusti kot odškodnina, ki ste jih plačali vi — ne ' +
        'tisti, ki jih zaračunate naročniku. Seštejte zadnjih 12 mesecev.',
    },
    mainCauseField(OBRACUN_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(OBRACUN_CAUSES, input.mainCause);
    const dailyRevenue = context.annualRevenueEUR / 365;

    return [
      {
        // Delo je opravljeno in strošek zanj že nastal, zato je nezaračunan
        // dodatek neposredna izguba in ne nezaslužena marža: manjka samo račun.
        bucket: 'directLoss',
        label: 'Nezaračunani dodatki in čakanja',
        valueEUR: input.unbilledExtrasEUR,
        addressableShare,
      },
      {
        // Brez odgovora o prihodku je to 0 — prometa si ne izmišljamo (glej
        // annualRevenue.fallback v contexts/logistika.ts).
        bucket: 'directLoss',
        label: 'Denar, vezan v prepozno izdanih računih',
        valueEUR: dailyRevenue * input.invoiceLagDays * context.capitalCostRate,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Napačno zaračunani prevozi',
        valueEUR: input.pricingErrorEUR,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Priprava obračuna prevozov',
        valueEUR: input.billingHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.billingHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Cenik s pogodbenimi cenami, rabati in doplačili po naročniku',
    'Dokazilo o dostavi vezano na dokument, račun brez ponovnega vnosa',
    'Kalkulacije lastne cene po dokumentu in stranki',
  ],
};

// --- 2. Vozniki, potni nalogi in dnevnice -----------------------------------

const VOZNIKI_CAUSES: CauseOption[] = [
  { label: 'Potni nalogi se izpolnjujejo na papirju ali v preglednicah', category: 'data' },
  { label: 'Podatki za obračun pridejo iz več virov', category: 'data' },
  { label: 'Pravila za dnevnice in dodatke so zapletena', category: 'planning' },
  { label: 'Zunanji obračun plač zahteva ročno pripravo podatkov', category: 'external' },
  // Ostaja people: gre za disciplino oddaje in ne za obliko zapisa — težava
  // ostane tudi ob dobro postavljenem sistemu, le manjša.
  { label: 'Vozniki dokumentacijo oddajo z zamudo', category: 'people' },
];

/**
 * To področje v tem segmentu NADOMEŠČA horizontalo kadriHz.
 *
 * Razlog je isti kot pri izključitvi dokumentiHz: horizontala v vprašanju
 * hrAdminHoursPerMonth izrecno našteva potne naloge, zato bi obe področji merili
 * iste ure. Pri prevozniku je to hkrati največji del kadrovske administracije —
 * mednarodni voznik ima potni nalog za vsako vožnjo — zato panožno področje
 * horizontalo pokrije, ne obratno.
 */
export const vozniki: ModuleDefinition = {
  id: 'vozniki',
  title: 'Vozniki, potni nalogi in dnevnice',
  summary:
    'Izdaja in obračun potnih nalogov, dnevnice in kilometrine, evidence delovnega časa voznikov ter priprava plač.',
  triage: {
    prompt: 'Koliko dela zahtevajo potni nalogi, dnevnice in evidence delovnega časa voznikov?',
    options: [
      { value: 0, label: 'Večina poteka samodejno' },
      { value: 1, label: 'Nekaj ur na mesec' },
      { value: 2, label: 'Nekaj dni vsak mesec' },
      { value: 3, label: 'Vsak mesec je to velik projekt' },
    ],
  },
  fields: [
    {
      key: 'travelOrderHoursPerMonth',
      label: 'Koliko ur mesečno porabite za izdajo, obračun in popravke potnih nalogov ter dnevnic?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Šteje pisarniško delo, ne čas voznika na poti.',
      explainer:
        'Izdaja naloga pred potjo, obračun dnevnic in kilometrine po njej, popravki pred plačami. Ocena: ' +
        '300 nalogov × 6 min ≈ 30 ur na mesec.',
    },
    {
      key: 'driverTimesheetHoursPerMonth',
      label:
        'Koliko ur mesečno gre za zbiranje in urejanje evidenc delovnega časa, odsotnosti in dopustov voznikov?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Evidenca za plačo. Analize tahografa in nadzora voznih časov sem ne štejte.',
      explainer:
        'Prepisovanje evidenc, lovljenje manjkajočih vnosov, usklajevanje odsotnosti pred obračunom plač. ' +
        'Ocena: 2 osebi × 6 h ob koncu meseca ≈ 12 ur.',
    },
    {
      key: 'payrollHoursPerMonth',
      label: 'Koliko ur mesečno vzame priprava podatkov za obračun plač in popravki po obračunu?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'annualPayrollCorrectionEUR',
      label:
        'Koliko so v zadnjih 12 mesecih stali napačni obračuni dnevnic in plač (poračuni, zamudne obresti, zunanja pomoč)?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
    },
    {
      key: 'driverCount',
      label: 'Koliko voznikov zaposlujete?',
      kind: 'number',
      unit: 'voznikov',
      default: 0,
      contextOnly: true,
      help: 'Podatek ne vstopa v izračun — pove, kako velik je obseg potnih nalogov.',
      explainer:
        'Štejte vse, za katere izdajate potne naloge — tudi občasne in tiste s krajšim delovnim časom. Če ' +
        'prevoze samo organizirate, vpišite 0.',
    },
    mainCauseField(VOZNIKI_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(VOZNIKI_CAUSES, input.mainCause);
    const rate = context.adminHourCostEUR;

    return [
      {
        bucket: 'capacity',
        label: 'Potni nalogi in obračun dnevnic',
        valueEUR: input.travelOrderHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.travelOrderHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Evidence delovnega časa voznikov',
        valueEUR: input.driverTimesheetHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.driverTimesheetHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Priprava in popravki obračuna plač',
        valueEUR: input.payrollHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.payrollHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Stroški napačnih obračunov dnevnic in plač',
        valueEUR: input.annualPayrollCorrectionEUR,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Samodejni izračun domačih in tujih dnevnic z znižanjem za obroke',
    'Kilometrine in potni stroški s foto-zajemom računov na terenu',
    'Obračun po stroškovnih mestih in izplačilo prek plače, brez prepisovanja',
  ],
};

// --- 3. Plačilni roki in terjatve -------------------------------------------

const TERJATVE_CAUSES: CauseOption[] = [
  { label: 'Računi gredo ven z zamikom', category: 'data' },
  { label: 'Odprtih postavk ne vidimo sproti', category: 'data' },
  { label: 'Ena sporna postavka zadrži celoten račun', category: 'data' },
  { label: 'Opominjanje ni nikogaršnja glavna naloga', category: 'planning' },
  { label: 'Naročniki plačujejo po svojem ritmu', category: 'external' },
];

export const terjatve: ModuleDefinition = {
  id: 'terjatve_logistika',
  usesRevenue: true,
  title: 'Plačilni roki in terjatve',
  summary:
    'Strošek denarja, ki predolgo čaka na naročnika, čas za opominjanje in izterjavo ter odpisane terjatve.',
  triage: {
    prompt: 'Kako pogosto naročniki plačajo po dogovorjenem roku?',
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
      label: 'Kolikšen je povprečen dejanski plačilni rok vaših naročnikov (DSO)?',
      kind: 'number',
      unit: 'dni',
      default: 0,
      contextOnly: true,
      help: 'Podatek ne vstopa v izračun — služi za primerjavo z dogovorjenim rokom.',
      explainer:
        'Povprečno število dni od izdaje računa do plačila. Izračun: odprte terjatve ÷ letni prihodek × ' +
        '365.',
    },
    {
      key: 'overdueDaysAverage',
      label: 'Za koliko dni povprečno naročniki prekoračijo dogovorjeni plačilni rok?',
      kind: 'number',
      unit: 'dni',
      default: 0,
      help: 'Samo prekoračitev NAD dogovorjenim rokom. Financiranje dogovorjenega roka je normalno poslovanje in ni strošek napake.',
      explainer:
        'Samo dnevi nad dogovorjenim rokom. Primer: dogovorjeno 60 dni, naročniki plačajo v 75 → vpišite ' +
        '15.',
    },
    {
      key: 'dunningHoursPerMonth',
      label: 'Koliko ur mesečno porabite za opominjanje, usklajevanje odprtih postavk in izterjavo?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Ne vključujte priprave obračuna in izstavljanja računov — te ure meri področje Obračun prevozov.',
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
    'Odprte postavke in limit naročnika vidni že ob vnosu naročila',
    'Izdaja e-računov skladno z ZIERDED, brez ročnega pošiljanja',
  ],
};

// --- 4. Prevozna dokumentacija, podatki in statusi --------------------------

const DOKUMENTACIJA_CAUSES: CauseOption[] = [
  { label: 'Podatke vodimo v več različnih orodjih', category: 'data' },
  { label: 'Listine so večinoma papirne', category: 'data' },
  { label: 'Vsaka stranka zahteva svoj portal oziroma obrazec', category: 'external' },
  { label: 'Podatki se ne vnašajo sproti', category: 'data' },
  { label: 'Odgovornosti niso jasne', category: 'planning' },
];

export const dokumentacija: ModuleDefinition = {
  id: 'dokumentacija',
  title: 'Prevozna dokumentacija, podatki in statusi',
  summary:
    'Priprava in zbiranje listin, prepisovanje med orodji, popravljanje napačnih podatkov in odgovarjanje na vprašanja o pošiljkah.',
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
        'sistem. Ocena: 2 osebi × 40 min na dan ≈ 28 ur na mesec.',
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
      /*
       * Preseljeno iz ukinjenega področja Zamude. Same zamude PANTHEON ne odpravi —
       * to je delo TMS. Poizvedbe "kje je pošiljka" pa nastanejo, ker naročnik
       * statusa ne vidi sam, in prav to je dokumentna težava, ki jo ERP naslovi.
       */
      key: 'statusHoursPerMonth',
      label:
        'Koliko ur mesečno porabite za odgovarjanje na vprašanja, kje je pošiljka, in za obveščanje o zamudah?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Reševanje reklamacij zaradi napačnih ali poškodovanih pošiljk sodi v področje Napačne dostave.',
      explainer:
        'Klici in e-pošta, ki jih ne bi bilo, če bi naročnik status videl sam. Ocena: 12 poizvedb × 5 min ' +
        '× 21 dni ≈ 21 ur na mesec.',
    },
    {
      key: 'podTiming',
      label: 'Kdaj dokazilo o dostavi (POD) pride v vaš sistem?',
      kind: 'choice',
      default: UNANSWERED_CHOICE,
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

    // Štiri ločene postavke namesto ene vsote: razčlenitev pokaže, kje ročno delo
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
      {
        bucket: 'capacity',
        label: 'Obveščanje o statusih in zamudah',
        valueEUR: input.statusHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.statusHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Naročilo, dobavnica in račun brez ponovnega vnosa',
    'E-računi in elektronska izmenjava dokumentov (eSlog)',
    'Statusi dokumentov in zgodovina po naročniku, vidni sproti',
  ],
};

// --- 5. Napačne dostave, poškodbe in reklamacije ----------------------------

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
        'Zamuda brez napake v vsebini sem ne sodi.',
      explainer:
        'Če deleža ne vodite, ga ocenite iz reklamacij: primere na mesec delite s številom pošiljk. ' +
        'Primer: 60 reklamacij pri 5.000 pošiljkah je 1,2 %.',
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
        'Kaj vas stane ena napaka brez vrednosti blaga: ponovna dostava, prepakiranje, čas disponenta. ' +
        'Primer: 60 EUR prevoza + 1 ura dela ≈ 90 EUR.',
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
        'Vrednost poškodovanega ali izgubljenega blaga, ki ste jo nosili vi — nad franšizo oziroma tisto, ' +
        'česar zavarovalnica ni pokrila. Seštejte primere zadnjih 12 mesecev.',
    },
    {
      key: 'claimHoursPerMonth',
      label: 'Koliko ur mesečno porabite za reševanje reklamacij in iskanje izgubljenih pošiljk?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Obveščanje naročnikov o statusih in zamudah sodi v področje Prevozna dokumentacija, ne sem.',
      explainer:
        'Pisarniško reševanje: sprejem reklamacije, iskanje pošiljke, usklajevanje z voznikom in stranko. ' +
        'Ocena: 15 primerov × 1 h ≈ 15 ur na mesec.',
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
    'Reklamacije od kupcev in do dobaviteljev v enem postopku, z zgodovino dokumentov',
  ],
};

// --- 6. Skladiščne operacije in zaloga --------------------------------------

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
      help: 'Iskanje listin in dokazil sodi v področje Prevozna dokumentacija, ne sem.',
      explainer:
        'Ure iskanja blaga, ki jih ne bi bilo, če bi sistem vedel, kje kaj leži. Ocena: 4 ljudje × 15 min ' +
        'na izmeno ≈ 21 ur na mesec.',
    },
    {
      key: 'inventoryValueEUR',
      label: 'Kolikšna je povprečna vrednost zaloge, ki je v vaši lasti?',
      kind: 'number',
      unit: 'EUR',
      default: 0,
      help: 'Če skladiščite izključno tuje blago, vpišite 0 — tujega kapitala ne sproščate vi.',
      explainer:
        'Samo blago, ki je vaša last, po nabavni vrednosti — ne tuje blago v hrambi. Vzemite postavko iz ' +
        'bilance ali povprečje nekaj mesečnih stanj.',
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
      default: UNANSWERED_CHOICE,
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
  // Namenoma brez tasking, slotting in waves: to je delo naprednega WMS, ki ga
  // Datalab ne ponuja. Komisijsko skladišče in inventura s čitalci sta v ponudbi.
  pantheon: [
    'Skladišča, lokacije, serije in loti — tudi komisijsko skladišče za tuje blago',
    'Inventura s čitalci črtnih kod in sproten pregled zaloge po skladiščih',
    'Minimalne zaloge in točke naročanja',
  ],
};

// --- Kratka diagnostika -----------------------------------------------------

const DATA_RISK_NOTE: Record<RiskLevel, string> = {
  low: 'Poraba, dodatki in statusi se evidentirajo sproti, lastna cena vožnje je znana. Odstopanje opazite, dokler ga je še mogoče popraviti.',
  medium:
    'Podatki so delni. Da je bila vožnja ali pošiljka nedonosna, praviloma ugotovite šele ob obračunu, ko cene ni več mogoče popraviti.',
  high: 'Dejanske lastne cene vožnje ne poznate. Dokler je ne, natančnega zneska izgubljene marže ni mogoče izračunati — in prav to je težava.',
};

const PROCESS_RISK_NOTE: Record<RiskLevel, string> = {
  low: 'Dokazila so vezana na dokument in obračun ni odvisen od posameznika.',
  medium: 'Sledljivost dokumentov je delna. Ob resnejši reklamaciji je odgovornost težko dokazati.',
  high: 'Dokazila se iščejo po mapah in e-pošti, znanje o naročnikih in cenah pa je v glavah posameznikov. Ena izgubljena listina ali odsotnost ključne osebe ustavi obračun.',
};

/**
 * Štiri vprašanja, ki se prikažejo vedno in NE prispevajo nobenega evra.
 *
 * Namenoma brez zneska: kjer podjetje ne pozna lastne cene vožnje ali ne najde
 * dokazila o dostavi, natančnega zneska ni mogoče izračunati, navidezno natančna
 * številka pa bi prav to težavo skrila. Modul zato nima triaže in ne more biti
 * "največja postavka".
 *
 * Vprašanji 3 in 4 sta avgusta 2026 spremenjeni: prej sta merili, ali podjetje ve,
 * KJE je pošiljka, in ali razporejanje deluje brez ključne osebe. Oboje je delo
 * telematike in TMS. Odslej merita sledljivost DOKUMENTA in odpornost OBRAČUNA —
 * eno in drugo je v dosegu PANTHEON.
 */
export const diagnostikaLogistika: ModuleDefinition = {
  id: 'diagnostika_logistika',
  title: 'Kratka diagnostika',
  summary: 'Štiri vprašanja o podatkih in odpornosti procesa. Ne prispevajo k finančnemu rezultatu.',
  fields: [
    {
      key: 'realtimeRecording',
      label: 'Ali se opravljene vožnje, dodatki in ure evidentirajo sproti?',
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
      key: 'documentTraceability',
      label: 'Ali za vsako opravljeno storitev takoj najdete dokazilo o dostavi in pripadajoči dokument?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'keyPersonIndependence',
      label: 'Ali obračun prevozov in plač deluje normalno tudi brez ključne osebe?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
  ],
  compute: (input) => {
    const dataLevel = assuranceRiskLevel(input.realtimeRecording, input.knowsTripCost);
    const processLevel = assuranceRiskLevel(input.documentTraceability, input.keyPersonIndependence);

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
    'Dokumentni arhiv z dokazili, vezanimi na knjižbo',
    'Dokumentiran proces namesto znanja v glavah',
  ],
};

/** Vrstni red je hkrati prioriteta — odloči ob izenačenju v triaži. */
export const LOGISTIKA_MODULES: ModuleDefinition[] = [
  obracun,
  vozniki,
  terjatve,
  dokumentacija,
  napake,
  skladisce,
  diagnostikaLogistika,
];
