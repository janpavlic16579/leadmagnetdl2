import { ADMIN_HOUR_BANDS } from './shared';
import type { CostBand, ScaleBand, SegmentContext } from './contextTypes';

/**
 * Ura v poslovalnici je bistveno cenejša od proizvodne, zato ima svoje razpone.
 * Če bi maloprodaja podedovala proizvodne, bi vsak kapacitetni znesek pretiraval
 * za faktor dve — in prav pretiravanje je tisto, kar direktor najprej opazi.
 */
const SHOP_HOUR_BANDS: CostBand[] = [
  { id: 'do18', label: 'Do 18 EUR', midpointEUR: 15 },
  { id: '18do25', label: '18–25 EUR', midpointEUR: 21 },
  { id: '25do32', label: '25–32 EUR', midpointEUR: 28 },
  { id: 'nad32', label: 'Več kot 32 EUR', midpointEUR: 38 },
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
  { id: 'do1mio', label: 'Do 1 mio EUR', midpoint: 600_000 },
  { id: '1do3mio', label: '1–3 mio EUR', midpoint: 1_800_000 },
  { id: '3do10mio', label: '3–10 mio EUR', midpoint: 5_500_000 },
  { id: 'nad10mio', label: 'Več kot 10 mio EUR', midpoint: 15_000_000 },
];

/**
 * Prispevna marža, ne bruto marža in ne pribitek.
 *
 * Razponi izhajajo iz scenarijev raziskave (konzervativno 22 %, realistično 27 %,
 * potencial 30 %), razširjeni navzdol za živila in tehniko, kjer je prispevna marža
 * po stroških kanala pogosto pod 20 %.
 */
const MARGIN_BANDS: ScaleBand[] = [
  { id: 'do15', label: 'Do 15 %', midpoint: 0.12 },
  { id: '15do25', label: '15–25 %', midpoint: 0.2 },
  { id: '25do35', label: '25–35 %', midpoint: 0.3 },
  { id: 'nad35', label: 'Več kot 35 %', midpoint: 0.42 },
];

export const MALOPRODAJA_CONTEXT: SegmentContext = {
  title: 'Nekaj o vaši maloprodaji',
  intro:
    'Tri vprašanja, ki ne sprašujejo po številkah. Iz njih izpeljemo, koliko od izmerjenega stroška je realno mogoče nasloviti — trgovec, ki ima blagajno že povezano z zalogami, je lažje izboljšave namreč večinoma že pobral.',
  costBasisIntro:
    'Štiri številke, ki veljajo za vsa področja. Polni strošek ure pomeni bruto plačo z vsemi prispevki in režijo, ne neto izplačila. Prihodek in maržo vprašamo enkrat, ker se iz njiju računa vsak odstotek v nadaljevanju.',

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
      { id: 'drugo', label: 'Drugo' },
    ],
  },

  operationalHour: {
    label: 'Približen polni strošek ure v poslovalnici ali skladišču',
    help: 'Prodajalec, blagajnik, skladiščnik — kdor dela z blagom in kupci.',
    bands: SHOP_HOUR_BANDS,
    fallbackEUR: 24,
  },

  adminHour: {
    label: 'Približen polni strošek administrativne oziroma vodstvene ure',
    help: 'Vodja poslovalnice, nabava, kategorijski vodja, priprava cen in akcij.',
    bands: ADMIN_HOUR_BANDS,
    fallbackEUR: 32,
  },

  annualRevenue: {
    label: 'Letni prihodek od prodaje blaga',
    help: 'Neto, brez DDV, vse poslovalnice in kanali skupaj. Če razpona ne izberete, odstotkovnih izgub ne bomo ocenili — prometa si ne izmišljamo.',
    bands: REVENUE_BANDS,
    fallback: 0,
    unit: 'EUR/leto',
  },

  contributionMargin: {
    label: 'Povprečna prispevna marža',
    help: 'Kar ostane od prodajne cene po nabavni vrednosti in neposrednih stroških kanala (provizije, kartice, dostava). Ni pribitek na nabavno ceno.',
    bands: MARGIN_BANDS,
    fallback: 0.25,
    unit: '%',
    asPercent: true,
  },
};
