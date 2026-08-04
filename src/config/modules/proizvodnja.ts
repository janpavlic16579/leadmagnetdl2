import { formatEUR } from '../../lib/format';
import type { ModuleDefinition, ModuleField, RiskLevel } from './moduleTypes';

/**
 * Stroškovni moduli za proizvodnjo.
 *
 * Privzete vrednosti so umerjene na slovenskega proizvajalca z 10–249 zaposlenimi.
 *
 * KALIBRACIJA: vsi deleži izboljšave (improvableShare) so začetne ocene, ne empirika.
 * Po prvih 50 vnosih jih je treba preveriti na realnih podatkih — enako velja za
 * prag visoke izgube v segments.ts (spec pogl. 6).
 *
 * Nikjer ne trdimo, da je izgubo mogoče odpraviti v celoti: vsak denarni izid se
 * pomnoži z realistično izboljšljivim deležem, izpeljanim iz diagnostičnega
 * izbirnega vprašanja (način planiranja, sprotnost poročanja, preglednost zalog).
 */

const OVERTIME_PREMIUM = 0.3;

const hourlyLaborCostField: ModuleField = {
  key: 'hourlyLaborCostEUR',
  label: 'Kolikšen je polni strošek delovne ure (EUR)?',
  kind: 'slider',
  min: 18,
  max: 45,
  step: 1,
  unit: 'EUR/h',
  default: 28,
};

// --- 1. Planiranje proizvodnje in zastoji -----------------------------------

/** Izgubljen nastavitveni čas ob vsakem prestavljenem nalogu. */
const HOURS_LOST_PER_RESCHEDULE = 0.5;

export const planiranje: ModuleDefinition = {
  id: 'planiranje',
  title: 'Planiranje proizvodnje in zastoji',
  summary: 'Čakanje zaradi materiala, napačnih informacij, sprememb plana in neusklajenih kapacitet.',
  triage: {
    prompt: 'Kako pogosto proizvodnja stoji ali se plan spreminja?',
    options: [
      { value: 0, label: 'Skoraj nikoli' },
      { value: 1, label: 'Nekajkrat na mesec' },
      { value: 2, label: 'Tedensko' },
      { value: 3, label: 'Skoraj vsak dan' },
    ],
  },
  fields: [
    {
      key: 'planningMethod',
      label: 'Kako trenutno planirate proizvodnjo?',
      kind: 'choice',
      default: 0.45,
      choices: [
        { value: 0.15, label: 'ERP s planiranjem potreb (MRP)' },
        { value: 0.3, label: 'ERP brez planiranja' },
        { value: 0.45, label: 'Excel' },
        { value: 0.6, label: 'Papir ali sproten dogovor' },
      ],
    },
    {
      key: 'productionHoursPerMonth',
      label: 'Koliko proizvodnih ur imate mesečno?',
      kind: 'number',
      unit: 'h/mesec',
      default: 2000,
    },
    {
      key: 'waitingHoursPerMonth',
      label: 'Koliko ur proizvodnja čaka zaradi manjkajočega materiala, informacij ali neusklajenega plana?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Štejte samo zastoje, povezane s planiranjem, materialom ali informacijami — okvar strojev ne.',
    },
    {
      key: 'overtimeHoursPerMonth',
      label: 'Koliko nadur mesečno povzroči spreminjanje plana?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'reschedulesPerMonth',
      label: 'Kolikokrat mesečno prestavite že razporejen delovni nalog?',
      kind: 'number',
      unit: 'krat/mesec',
      default: 0,
    },
    {
      key: 'productionHourCostEUR',
      label: 'Kolikšen je strošek proizvodne ure (EUR)?',
      kind: 'slider',
      min: 25,
      max: 120,
      step: 5,
      unit: 'EUR/h',
      default: 45,
    },
  ],
  compute: (input) => {
    const share = input.planningMethod;
    const cost = input.productionHourCostEUR;
    // Varovalo pred tipkarsko napako: ur čakanja ne more biti več, kot je proizvodnih ur.
    const waitingHours = Math.min(input.waitingHoursPerMonth, input.productionHoursPerMonth);

    return [
      {
        bucket: 'capacity',
        label: 'Zastoji proizvodnje',
        valueEUR: waitingHours * cost * 12 * share,
        hoursPerMonth: waitingHours * share,
      },
      {
        bucket: 'directLoss',
        label: 'Nadure zaradi sprememb plana',
        valueEUR: input.overtimeHoursPerMonth * cost * (1 + OVERTIME_PREMIUM) * 12 * share,
      },
      {
        bucket: 'directLoss',
        label: 'Dodatne menjave in prestavljanje nalogov',
        valueEUR: input.reschedulesPerMonth * HOURS_LOST_PER_RESCHEDULE * cost * 12 * share,
      },
    ];
  },
  pantheon: [
    'MRP in planiranje potreb po materialu',
    'Sestavnice in normativi',
    'Delovni nalogi neposredno iz naročil',
    'Proizvodni terminali za sproten pregled nad zasedenostjo',
  ],
};

// --- 2. Material, izmet in dodelave -----------------------------------------

export const material: ModuleDefinition = {
  id: 'material',
  title: 'Material, izmet in dodelave',
  summary: 'Presežna poraba materiala, izmet, ponovna izdelava in odpravljanje napak.',
  triage: {
    prompt: 'Kako pogosto se pojavijo izmet, dodelave ali reklamacije?',
    options: [
      { value: 0, label: 'Redko' },
      { value: 1, label: 'Mesečno' },
      { value: 2, label: 'Tedensko' },
      { value: 3, label: 'Skoraj pri vsakem nalogu' },
    ],
  },
  fields: [
    {
      key: 'annualMaterialValueEUR',
      label: 'Kolikšna je letna vrednost porabljenega materiala (EUR)?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
    },
    {
      key: 'scrapRatePercent',
      label: 'Kolikšen delež materiala predstavlja izmet (%)?',
      kind: 'percent',
      min: 0,
      max: 0.15,
      step: 0.005,
      default: 0.03,
    },
    {
      key: 'reworkHoursPerMonth',
      label: 'Koliko ur mesečno porabite za dodelave in ponovno izdelavo?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'bomDeviation',
      label: 'Kako pogosto dejanska poraba odstopa od sestavnice oziroma normativa?',
      kind: 'choice',
      default: 0.2,
      choices: [
        { value: 0.1, label: 'Skoraj nikoli' },
        { value: 0.2, label: 'Redko' },
        { value: 0.3, label: 'Pogosto' },
        { value: 0.4, label: 'Stalno — normativom ne zaupamo' },
      ],
    },
    {
      key: 'annualClaimsCostEUR',
      label: 'Kolikšni so letni stroški reklamacij in vračil (EUR)?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
    },
    hourlyLaborCostField,
  ],
  compute: (input) => {
    const share = input.bomDeviation;
    return [
      {
        bucket: 'directLoss',
        label: 'Izmet materiala',
        valueEUR: input.annualMaterialValueEUR * input.scrapRatePercent * share,
      },
      {
        bucket: 'directLoss',
        label: 'Reklamacije in vračila',
        valueEUR: input.annualClaimsCostEUR * share,
      },
      {
        // Ure dodelav so plačan čas ekipe — sproščene ure ne znižajo plačne mase,
        // zato veljajo za kapaciteto in ne za neposredno izgubo (enako kot modul 4).
        bucket: 'capacity',
        label: 'Dodelave in ponovna izdelava',
        valueEUR: input.reworkHoursPerMonth * input.hourlyLaborCostEUR * 12 * share,
        hoursPerMonth: input.reworkHoursPerMonth * share,
      },
    ];
  },
  pantheon: [
    'Sestavnice z normativi in alternativami materialov',
    'Evidentiranje dejanske porabe na delovnem nalogu',
    'Sledljivost serij in lotov do vzroka reklamacije',
  ],
};

// --- 3. Zaloge in pomanjkanje materiala -------------------------------------

/**
 * Boljša preglednost zalog prepreči del odpisov — več kot je preglednosti, več
 * odpisov je izogibljivih. Faktor pretvori delež znižanja zalog v delež odpisov.
 */
const WRITE_OFF_FACTOR = 4;
const MAX_WRITE_OFF_SHARE = 0.5;
/** Nekurantne zaloge je realno mogoče unovčiti le deloma (razprodaja, odkup, predelava). */
const OBSOLETE_RECOVERY_SHARE = 0.5;

export const zaloge: ModuleDefinition = {
  id: 'zaloge',
  title: 'Zaloge in pomanjkanje materiala',
  summary: 'Presežne zaloge, nekurantno blago, vezan kapital in ustavitve zaradi manjkajočega materiala.',
  triage: {
    prompt: 'Kako pogosto imate hkrati preveč zaloge in premalo pravega materiala?',
    options: [
      { value: 0, label: 'Zaloge so pod nadzorom' },
      { value: 1, label: 'Občasno se zatakne' },
      { value: 2, label: 'Redno' },
      { value: 3, label: 'Stalno — kupujemo na zalogo za vsak primer' },
    ],
  },
  fields: [
    {
      key: 'rawMaterialValueEUR',
      label: 'Kolikšna je povprečna vrednost surovin (EUR)?',
      kind: 'number',
      unit: 'EUR',
      default: 0,
    },
    {
      key: 'wipValueEUR',
      label: 'Kolikšna je povprečna vrednost nedokončane proizvodnje (EUR)?',
      kind: 'number',
      unit: 'EUR',
      default: 0,
    },
    {
      key: 'finishedGoodsValueEUR',
      label: 'Kolikšna je povprečna vrednost končnih izdelkov (EUR)?',
      kind: 'number',
      unit: 'EUR',
      default: 0,
    },
    {
      key: 'obsoleteStockValueEUR',
      label: 'Kolikšna je vrednost nekurantnih oziroma počasi obračajočih se zalog (EUR)?',
      kind: 'number',
      unit: 'EUR',
      default: 0,
    },
    {
      key: 'annualWriteOffEUR',
      label: 'Koliko zaloge ste odpisali v zadnjem letu (EUR)?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
    },
    {
      key: 'stockoutsPerMonth',
      label: 'Kolikokrat mesečno proizvodnja obstane zaradi manjkajočega materiala?',
      kind: 'number',
      unit: 'krat/mesec',
      default: 0,
    },
    {
      key: 'emergencyPurchasesPerMonth',
      label: 'Koliko nujnih nabav izvedete mesečno?',
      kind: 'number',
      unit: 'krat/mesec',
      default: 0,
      help: 'Njihov strošek štejemo v modulu Zamude in nujni stroški — tu služi le oceni, koliko zaloge realno potrebujete.',
    },
    {
      key: 'stockVisibility',
      label: 'Ali imate sproten pregled nad zalogami po skladiščih in lokacijah?',
      kind: 'choice',
      default: 0.06,
      choices: [
        { value: 0.03, label: 'Da, sproten in po lokacijah' },
        { value: 0.06, label: 'Delen — nekaj je v ERP, nekaj v Excelu' },
        { value: 0.09, label: 'Le ob mesečni inventuri' },
        { value: 0.12, label: 'Ne — zanašamo se na oceno' },
      ],
    },
    {
      key: 'capitalCostPercent',
      label: 'Kolikšen je strošek kapitala in skladiščenja letno (%)?',
      kind: 'percent',
      min: 0.05,
      max: 0.2,
      step: 0.01,
      default: 0.1,
    },
  ],
  compute: (input) => {
    const inventoryValue = input.rawMaterialValueEUR + input.wipValueEUR + input.finishedGoodsValueEUR;
    // Podjetje, ki pogosto ostane brez materiala, zalog ne more veliko rezati —
    // pogostost zastojev zato zniža realno dosegljiv delež znižanja.
    const stockoutPenalty = Math.max(0.5, 1 - input.stockoutsPerMonth / 20);
    const reductionShare = input.stockVisibility * stockoutPenalty;
    const writeOffShare = Math.min(MAX_WRITE_OFF_SHARE, reductionShare * WRITE_OFF_FACTOR);

    const releasedCapitalEUR =
      inventoryValue * reductionShare + input.obsoleteStockValueEUR * OBSOLETE_RECOVERY_SHARE;

    return [
      {
        bucket: 'directLoss',
        label: 'Letni strošek presežnih zalog in odpisov',
        valueEUR: releasedCapitalEUR * input.capitalCostPercent + input.annualWriteOffEUR * writeOffShare,
      },
      {
        bucket: 'oneTimeCapital',
        label: 'Enkratno sprostljiv kapital v zalogah',
        valueEUR: releasedCapitalEUR,
      },
    ];
  },
  pantheon: [
    'MRP z minimalnimi zalogami in točkami naročanja',
    'Skladišča, lokacije, serije in loti',
    'Črtne kode za sproten odpis porabe',
    'Povezava nabave s proizvodnim planom',
  ],
};

// --- 4. Delovni nalogi in ročno poročanje -----------------------------------

export const nalogi: ModuleDefinition = {
  id: 'nalogi',
  title: 'Delovni nalogi in ročno poročanje',
  summary: 'Priprava nalogov, prepisovanje podatkov, Excel, papir in naknadno poročanje proizvodnje.',
  triage: {
    prompt: 'Koliko dela je s pripravo nalogov in prepisovanjem podatkov?',
    options: [
      { value: 0, label: 'Malo — večina teče samodejno' },
      { value: 1, label: 'Nekaj ur na teden' },
      { value: 2, label: 'Vsak dan nekdo prepisuje' },
      { value: 3, label: 'To je zaposlitev za polni delovni čas' },
    ],
  },
  fields: [
    {
      key: 'workOrdersPerMonth',
      label: 'Koliko delovnih nalogov obdelate mesečno?',
      kind: 'number',
      unit: 'nalogov/mesec',
      default: 0,
    },
    {
      key: 'minutesPerWorkOrder',
      label: 'Koliko minut zahteva priprava, tiskanje in zaključevanje enega naloga?',
      kind: 'slider',
      min: 5,
      max: 120,
      step: 5,
      unit: 'min',
      default: 20,
    },
    {
      key: 'rekeyingPeople',
      label: 'Koliko ljudi prepisuje podatke med Excelom, papirjem in ERP-jem?',
      kind: 'number',
      unit: 'oseb',
      default: 2,
    },
    {
      key: 'rekeyingHoursPerPerson',
      label: 'Koliko ur mesečno porabi vsak od njih za prepisovanje?',
      kind: 'slider',
      min: 0,
      max: 60,
      step: 2,
      unit: 'h/mesec',
      default: 10,
    },
    {
      key: 'realtimeReporting',
      label: 'Ali zaposleni sproti poročajo porabo materiala in opravljeno delo?',
      kind: 'choice',
      default: 0.5,
      choices: [
        { value: 0.2, label: 'Da, sproti na terminalu' },
        { value: 0.35, label: 'Isti dan' },
        { value: 0.5, label: 'Naslednji dan' },
        { value: 0.65, label: 'Šele ob zaključku naloga' },
      ],
    },
    {
      key: 'reconciliationHoursPerMonth',
      label: 'Koliko ur mesečno porabite za usklajevanje napačnih ali manjkajočih podatkov?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    hourlyLaborCostField,
  ],
  compute: (input) => {
    const share = input.realtimeReporting;
    const hoursPerMonth =
      (input.workOrdersPerMonth * input.minutesPerWorkOrder) / 60 +
      input.rekeyingPeople * input.rekeyingHoursPerPerson +
      input.reconciliationHoursPerMonth;

    return [
      {
        bucket: 'capacity',
        label: 'Ročno delo z nalogi in poročanjem',
        valueEUR: hoursPerMonth * input.hourlyLaborCostEUR * 12 * share,
        hoursPerMonth: hoursPerMonth * share,
      },
    ];
  },
  pantheon: [
    'Samodejno ustvarjanje delovnih nalogov',
    'Proizvodni terminali MT za sprotno poročanje',
    'Enoten vir podatkov namesto Excela ob ERP-ju',
  ],
};

// --- 5. Zamude in nujni stroški ---------------------------------------------

/**
 * Konservativna začetna ocena: tudi z odličnim planiranjem del zamud ostane
 * (zamude dobaviteljev, spremembe kupca). Za umeritev po prvih realnih vnosih.
 */
const DELAY_IMPROVABLE_SHARE = 0.35;

export const zamude: ModuleDefinition = {
  id: 'zamude',
  title: 'Zamude in nujni stroški',
  summary: 'Nujne nabave, ekspresne dostave, nadure, pogodbene kazni in popusti zaradi zamud.',
  triage: {
    prompt: 'Kako pogosto odpremljate z zamudo ali rešujete stvari nujno?',
    options: [
      { value: 0, label: 'Roke držimo' },
      { value: 1, label: 'Nekaj naročil na mesec' },
      { value: 2, label: 'Tedensko gasimo požare' },
      { value: 3, label: 'Zamuda je pravilo, ne izjema' },
    ],
  },
  fields: [
    {
      key: 'lateOrdersPerMonth',
      label: 'Koliko naročil mesečno odpremite z zamudo?',
      kind: 'number',
      unit: 'naročil/mesec',
      default: 0,
      help: 'Podatek ne vstopa v izračun — služi za oceno obsega težave.',
    },
    {
      key: 'annualExpeditingCostEUR',
      label: 'Koliko letno porabite za ekspresne nabave in dostave (EUR)?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
    },
    {
      key: 'deadlineOvertimeHoursPerMonth',
      label: 'Koliko nadur mesečno je posledica lovljenja rokov?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Ure zastojev ostanejo v modulu Planiranje — tu jih ne štejte znova.',
    },
    {
      key: 'annualPenaltiesEUR',
      label: 'Kolikšni so letni popusti, penali in odpovedana naročila zaradi zamud (EUR)?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
    },
    {
      key: 'replanningHoursPerMonth',
      label: 'Koliko ur mesečno porabite za ponovno planiranje in obveščanje kupcev?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    hourlyLaborCostField,
  ],
  compute: (input) => {
    const share = DELAY_IMPROVABLE_SHARE;
    const hourly = input.hourlyLaborCostEUR;

    return [
      {
        bucket: 'directLoss',
        label: 'Ekspresne nabave in dostave',
        valueEUR: input.annualExpeditingCostEUR * share,
      },
      {
        bucket: 'directLoss',
        label: 'Penali, popusti in odpovedana naročila',
        valueEUR: input.annualPenaltiesEUR * share,
      },
      {
        bucket: 'directLoss',
        label: 'Nadure zaradi lovljenja rokov',
        valueEUR: input.deadlineOvertimeHoursPerMonth * hourly * (1 + OVERTIME_PREMIUM) * 12 * share,
      },
      {
        bucket: 'capacity',
        label: 'Ponovno planiranje in obveščanje kupcev',
        valueEUR: input.replanningHoursPerMonth * hourly * 12 * share,
        hoursPerMonth: input.replanningHoursPerMonth * share,
      },
    ];
  },
  pantheon: [
    'Planiranje potreb, ki zamudo pokaže vnaprej',
    'Statusi naročil in obveščanje kupcev iz ERP-ja',
    'Povezava nabave s proizvodnim planom',
  ],
};

// --- Diagnostična modula ----------------------------------------------------

/** Diagnostična modula nimata triaže — sta kratka in se prikažeta vedno. */

const FREQUENCY_CHOICES = [
  { value: 0, label: 'Da, zanesljivo' },
  { value: 1, label: 'Večinoma' },
  { value: 2, label: 'Le približno' },
  { value: 3, label: 'Ne' },
];

function riskLevelFromScore(score: number, maxScore: number): RiskLevel {
  const ratio = score / maxScore;
  if (ratio <= 0.3) return 'low';
  if (ratio <= 0.6) return 'medium';
  return 'high';
}

/** Pas maržnega tveganja v deležu prihodkov — namerno pas, ne navidezno natančen znesek. */
const MARGIN_RISK_BANDS: Record<RiskLevel, [number, number]> = {
  low: [0.005, 0.01],
  medium: [0.01, 0.03],
  high: [0.03, 0.06],
};

export const marza: ModuleDefinition = {
  id: 'marza',
  title: 'Kalkulacije in pregled nad maržo',
  summary: 'Ali poznate dejanski strošek izdelka in delovnega naloga ter kako hitro opazite odstopanje.',
  fields: [
    {
      key: 'knowsCostPerProduct',
      label: 'Ali poznate dejanski strošek posameznega izdelka?',
      kind: 'choice',
      default: 1,
      choices: FREQUENCY_CHOICES,
    },
    {
      key: 'knowsCostPerWorkOrder',
      label: 'Ali poznate dejanski strošek posameznega delovnega naloga?',
      kind: 'choice',
      default: 1,
      choices: FREQUENCY_CHOICES,
    },
    {
      key: 'deviationDetectionSpeed',
      label: 'Kako hitro opazite odstopanje od kalkulacije?',
      kind: 'choice',
      default: 2,
      choices: [
        { value: 0, label: 'Sproti, med izdelavo' },
        { value: 1, label: 'V nekaj dneh' },
        { value: 2, label: 'Ob mesečnem obračunu' },
        { value: 3, label: 'Šele ob letnem zaključku' },
      ],
    },
    {
      key: 'annualRevenueEUR',
      label: 'Kolikšni so vaši letni prihodki (EUR)?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
    },
  ],
  compute: (input) => {
    const score = input.knowsCostPerProduct + input.knowsCostPerWorkOrder + input.deviationDetectionSpeed;
    const riskLevel = riskLevelFromScore(score, 9);
    const [low, high] = MARGIN_RISK_BANDS[riskLevel];
    const revenue = input.annualRevenueEUR;

    const note =
      revenue > 0
        ? `Marža pod tveganjem: ${formatEUR(revenue * low)} – ${formatEUR(revenue * high)} letno (${low * 100}–${high * 100} % prihodkov).`
        : `Marža pod tveganjem: ${low * 100}–${high * 100} % prihodkov.`;

    return [
      {
        bucket: 'risk',
        label: 'Marža pod tveganjem',
        riskLevel,
        note: `${note} Ocena je pas, ne natančen znesek — dokler kalkulacije ni, natančnega zneska ni mogoče izračunati.`,
      },
    ];
  },
  pantheon: [
    'Kalkulacije lastne cene po izdelku in delovnem nalogu',
    'Primerjava načrtovane in dejanske porabe',
    'Poročila o odstopanjih med izdelavo, ne po zaključku',
  ],
};

export const sledljivost: ModuleDefinition = {
  id: 'sledljivost',
  title: 'Sledljivost in procesno tveganje',
  summary: 'Serije, loti, poreklo materiala, odvisnost od posameznikov in čas do vzroka reklamacije.',
  fields: [
    {
      key: 'batchLotTracking',
      label: 'Ali sledite serijam in lotom skozi celotno proizvodnjo?',
      kind: 'choice',
      default: 2,
      choices: FREQUENCY_CHOICES,
    },
    {
      key: 'materialOrigin',
      label: 'Ali za vsak izdelek veste, iz katere dobave materiala je nastal?',
      kind: 'choice',
      default: 2,
      choices: FREQUENCY_CHOICES,
    },
    {
      key: 'keyPersonDependency',
      label: 'Ali proizvodnja teče normalno, tudi če ključna oseba ni na delu?',
      kind: 'choice',
      default: 1,
      choices: FREQUENCY_CHOICES,
    },
    {
      key: 'claimRootCauseTime',
      label: 'Kako hitro najdete vzrok reklamacije?',
      kind: 'choice',
      default: 2,
      choices: [
        { value: 0, label: 'V nekaj minutah' },
        { value: 1, label: 'V nekaj urah' },
        { value: 2, label: 'V nekaj dneh' },
        { value: 3, label: 'Pogosto sploh ne' },
      ],
    },
  ],
  compute: (input) => {
    const score =
      input.batchLotTracking + input.materialOrigin + input.keyPersonDependency + input.claimRootCauseTime;
    const riskLevel = riskLevelFromScore(score, 12);

    const note: Record<RiskLevel, string> = {
      low: 'Sledljivost je urejena — vzrok reklamacije najdete hitro in niste odvisni od posameznika.',
      medium: 'Sledljivost je delna. Ob resnejši reklamaciji je obseg odpoklica težko omejiti.',
      high: 'Sledljivosti praktično ni. Ena reklamacija lahko pomeni zaustavitev več serij in odvisnost od spomina posameznika.',
    };

    return [
      {
        bucket: 'risk',
        label: 'Procesno tveganje',
        riskLevel,
        note: note[riskLevel],
      },
    ];
  },
  pantheon: [
    'Serije in loti s popolno sledljivostjo',
    'Poreklo materiala do dobave',
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
  marza,
  sledljivost,
];
