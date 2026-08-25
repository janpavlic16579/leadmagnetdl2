import {
  ADMIN_HOUR_BANDS,
  ADMIN_HOUR_EXPLAINER,
  ANNUAL_REVENUE_EXPLAINER,
  CAPITAL_COST_EXPLAINER,
  CONTRIBUTION_MARGIN_EXPLAINER,
  HOURLY_COST_EXPLAINER,
} from './shared';
import type { CostBand, ScaleBand, SegmentContext } from './contextTypes';

/**
 * Ura v poslovalnici je bistveno cenejša od proizvodne, zato ima svoje razpone.
 * Če bi maloprodaja podedovala proizvodne, bi vsak kapacitetni znesek pretiraval
 * za faktor dve — in prav pretiravanje je tisto, kar direktor najprej opazi.
 *
 * Sidro 2026 (SURS, zasebni sektor, oktober 2025, prevrednoteno): polnjenje polic
 * 16,4 EUR/h, prodajalec 18,4, blagajnik 18,6, skladiščnik 20,8; panožno povprečje
 * trgovine na drobno (G47) 20,6. Prodajalčev spodnji kvartil je bil oktobra 2025
 * (1.425 EUR) pod minimalno plačo 2026, zato je dvig v tem poklicu večji od
 * panožnega povprečja — korekcija je v privzetku upoštevana. Spodnji pas je
 * namenoma nad golo izpeljavo iz plače: poslovalnica dela ob sobotah, praznikih in
 * v izmenah, dodatki pa to uro sistematično dvignejo.
 * Izpeljava in viri: docs/urne-postavke.md.
 */
const SHOP_HOUR_BANDS: CostBand[] = [
  { id: 'do17', label: 'Do 17 EUR', midpointEUR: 16, minEUR: 15, maxEUR: 17 },
  { id: '17do20', label: '17–20 EUR', midpointEUR: 18, minEUR: 17, maxEUR: 20 },
  { id: '20do24', label: '20–24 EUR', midpointEUR: 22, minEUR: 20, maxEUR: 24 },
  { id: 'nad24', label: 'Več kot 24 EUR', midpointEUR: 27, minEUR: 24, maxEUR: 31 },
];

/**
 * Razponi prihodka pokrivajo ciljni razred (mikro trgovina do manjše verige).
 * Sredina je geometrijska in ne aritmetična: pri razponu 3–10 mio je 6,5 mio bližje
 * dejanski porazdelitvi kot 6,5 mio bi bilo pri enakomerni — trgovcev s 3,5 mio je
 * bistveno več kot tistih z 9,5 mio.
 *
 * KALIBRACIJA: začetne ocene, preveriti po prvih ~50 vnosih.
 */
const REVENUE_BANDS: ScaleBand[] = [
  { id: 'do1mio', label: 'Do 1 mio EUR', midpoint: 600_000, min: 200_000, max: 1_000_000 },
  { id: '1do3mio', label: '1–3 mio EUR', midpoint: 1_800_000, min: 1_000_000, max: 3_000_000 },
  { id: '3do10mio', label: '3–10 mio EUR', midpoint: 5_500_000, min: 3_000_000, max: 10_000_000 },
  { id: 'nad10mio', label: 'Več kot 10 mio EUR', midpoint: 15_000_000, min: 10_000_000, max: 20_000_000 },
];

/**
 * Prispevna marža, ne bruto marža in ne pribitek.
 *
 * Razponi so umerjeni na IZMERJENO bruto maržo na blago (Eurostat SBS, SI,
 * 2021–2023), ne več na scenarije raziskave — ti so bili nižji od vsega, kar
 * statistika pokaže. Po podrazredih 2023: bencinski servisi 9,5 %, živila v
 * nespecializiranih prodajalnah 30,1 %, IKT 28,2 %, druge specializirane 32,6 %,
 * gospodinjska oprema 36,4 %, specializirana živila 37,5 %. Zato pas ostane širok
 * navzdol: "do 15 %" ni prazen, zaseda ga gorivo.
 *
 * Izpeljava: docs/prispevne-marze-raziskava-2026-08.md
 */
const MARGIN_BANDS: ScaleBand[] = [
  { id: 'do15', label: 'Do 15 %', midpoint: 0.12, min: 0.09, max: 0.15 },
  { id: '15do25', label: '15–25 %', midpoint: 0.2, min: 0.15, max: 0.25 },
  { id: '25do35', label: '25–35 %', midpoint: 0.3, min: 0.25, max: 0.35 },
  { id: 'nad35', label: 'Več kot 35 %', midpoint: 0.42, min: 0.35, max: 0.49 },
];

export const MALOPRODAJA_CONTEXT: SegmentContext = {
  businessType: {
    legend: 'Kako pretežno prodajate?',
    options: [
      { id: 'enaPoslovalnica', label: 'Ena poslovalnica' },
      { id: 'vecPoslovalnic', label: 'Več poslovalnic' },
      { id: 'poslovalniceInSplet', label: 'Poslovalnice in spletna trgovina' },
      { id: 'samoSplet', label: 'Samo spletna trgovina' },
      { id: 'maloInVeleprodaja', label: 'Maloprodaja in veleprodaja' },
    ],
  },

  /**
   * Ločnica, ki v maloprodaji največ pojasni, ni "imamo ERP", ampak "ali blagajna
   * ve, kaj je na zalogi". Blagajna brez te povezave ima zato širši pas izboljšave
   * kot podjetje z drugim, a povezanim sistemom.
   */
  currentSystem: {
    legend: 'Kako danes vodite maloprodajo?',
    options: [
      {
        id: 'pantheonRetail',
        label: 'PANTHEON z maloprodajnim modulom (POS)',
        band: { min: 0.08, max: 0.2 },
        isPantheon: true,
      },
      {
        id: 'pantheonNoRetail',
        label: 'PANTHEON brez maloprodajnega modula',
        band: { min: 0.15, max: 0.3 },
        isPantheon: true,
      },
      { id: 'otherRetailSystem', label: 'Drug maloprodajni sistem, povezan z zalogami', band: { min: 0.15, max: 0.3 } },
      { id: 'posNoStockLink', label: 'Blagajna, ki ni povezana z zalogami', band: { min: 0.25, max: 0.4 } },
      { id: 'excelPaper', label: 'Večinoma Excel, papir ali sprotni dogovor', band: { min: 0.25, max: 0.4 } },
    ],
  },

  role: {
    legend: 'Kakšna je vaša vloga?',
    options: [
      { id: 'direktor', label: 'Direktor/-ica' },
      { id: 'vodjaTrgovine', label: 'Vodja trgovine ali poslovalnice' },
      { id: 'nabava', label: 'Nabava ali kategorijski vodja' },
      { id: 'finance', label: 'Finance ali računovodstvo' },
      { id: 'drugo', label: 'Drugo', freeText: true },
    ],
  },

  operationalHour: {
    label: 'Približen polni strošek ure v poslovalnici ali skladišču',
    help: 'Prodajalec, blagajnik, skladiščnik — kdor dela z blagom in kupci.',
    explainer: HOURLY_COST_EXPLAINER,
    bands: SHOP_HOUR_BANDS,
    fallbackEUR: 19,
  },

  adminHour: {
    label: 'Približen polni strošek administrativne oziroma vodstvene ure',
    help: 'Vodja poslovalnice, nabava, kategorijski vodja, priprava cen in akcij.',
    explainer: ADMIN_HOUR_EXPLAINER,
    bands: ADMIN_HOUR_BANDS,
    fallbackEUR: 26,
  },

  annualRevenue: {
    label: 'Letni prihodek od prodaje blaga',
    help: 'Neto, brez DDV, vse poslovalnice in kanali skupaj. Če razpona ne izberete, odstotkovnih izgub ne bomo ocenili — prometa si ne izmišljamo.',
    explainer: ANNUAL_REVENUE_EXPLAINER,
    bands: REVENUE_BANDS,
    fallback: 0,
    unit: 'EUR/leto',
  },

  contributionMargin: {
    label: 'Povprečna prispevna marža',
    help: 'Kar ostane od prodajne cene po nabavni vrednosti in neposrednih stroških kanala (provizije, kartice, dostava). Ni pribitek na nabavno ceno.',
    explainer: CONTRIBUTION_MARGIN_EXPLAINER,
    bands: MARGIN_BANDS,
    // Sidro 2026: bruto marža na blago v prodajalnah (brez goriv in brez prodaje
    // zunaj prodajaln) 31,9 % za 2023, manj pribl. 1 o. t. za kartice in dostavo.
    // Edina marža, ki premakne evre — množi jo modules/maloprodaja.ts.
    fallback: 0.31,
    unit: '%',
    asPercent: true,
  },
  /**
   * KALIBRACIJA: dosedanja konstanta 6 % (modules/shared.ts) je privzetek ob
   * praznem vnosu; legacy modul je spraševal z 10 %. Sredine pasov se namenoma
   * ne ujemajo s privzetkom, da "ni odgovora" ostane razpoznavno stanje.
   */
  capitalCostRate: {
    label: 'Letni strošek financiranja obratnega kapitala',
    help: 'Obrestna mera posojila oziroma donos, ki bi ga denar prinesel drugje. Množi denar, vezan v terjatvah in zalogah.',
    explainer: CAPITAL_COST_EXPLAINER,
    bands: [
      { id: 'do5', label: 'Do 5 %', midpoint: 0.04, min: 0.03, max: 0.05 },
      { id: '5do8', label: '5–8 %', midpoint: 0.065, min: 0.05, max: 0.08 },
      { id: '8do12', label: '8–12 %', midpoint: 0.1, min: 0.08, max: 0.12 },
      { id: 'nad12', label: 'Več kot 12 %', midpoint: 0.15, min: 0.12, max: 0.18 },
    ],
    fallback: 0.06,
    unit: '%',
    asPercent: true,
  },
};
