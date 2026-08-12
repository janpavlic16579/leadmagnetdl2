import { ADMIN_HOUR_BANDS } from './shared';
import type { CostBand, SegmentContext } from './contextTypes';

/**
 * Ura komisionarja je cenejša od proizvodne in dražja od ure v poslovalnici.
 * Če bi veleprodaja podedovala proizvodne razpone (sredina 45 EUR), bi vsak
 * kapacitetni znesek pretiraval za približno faktor dve — in prav pretiravanje je
 * tisto, kar skeptičen direktor najprej opazi in zaradi česar zavrne cel izračun.
 */
const WHOLESALE_HOUR_BANDS: CostBand[] = [
  { id: 'do20', label: 'Do 20 EUR', midpointEUR: 17, minEUR: 14, maxEUR: 20 },
  { id: '20do28', label: '20–28 EUR', midpointEUR: 24, minEUR: 20, maxEUR: 28 },
  { id: '28do38', label: '28–38 EUR', midpointEUR: 33, minEUR: 28, maxEUR: 38 },
  { id: 'nad38', label: 'Več kot 38 EUR', midpointEUR: 45, minEUR: 38, maxEUR: 52 },
];

/**
 * Kontekst veleprodajnega in distribucijskega podjetja.
 *
 * Maloprodaja ima od tu naprej svoj segment (config/contexts/maloprodaja.ts), zato
 * ta vprašalnik ne poskuša pokrivati police in blagajne. Veleprodajalec meri drugo:
 * pot od naročila do odpremljene pošiljke in denar, ki na tej poti obtiči.
 *
 * Ločnica, ki v veleprodaji največ pojasni, ni "imamo ERP", ampak ali sistem ve,
 * KJE v skladišču blago je. Podjetje z ERP-jem brez skladiščnega modela zato dobi
 * širši pas izboljšave kot podjetje z drugim, a s skladiščem povezanim sistemom.
 */
export const TRGOVINA_CONTEXT: SegmentContext = {
  title: 'Nekaj o vaši veleprodaji',
  intro:
    'Tri vprašanja, ki ne sprašujejo po številkah. Iz njih izpeljemo, koliko od izmerjenega stroška je realno mogoče nasloviti — podjetje, ki skladišče že vodi po lokacijah in s terminali, je lažje izboljšave namreč večinoma že pobralo.',
  costBasisIntro:
    'Pet številk, ki veljajo za vsa področja. Polni strošek ure pomeni bruto plačo z vsemi prispevki in režijo, ne neto izplačila. Prihodek in maržo vprašamo enkrat — iz prihodka se med drugim izračuna strošek plačilnih zamud.',

  businessType: {
    legend: 'Kaj pretežno prodajate?',
    options: [
      { id: 'veleprodaja', label: 'Veleprodaja poslovnim kupcem' },
      { id: 'distribucija', label: 'Distribucija za blagovne znamke' },
      { id: 'uvozInVeleprodaja', label: 'Uvoz in veleprodaja' },
      { id: 'spletnaVeleprodaja', label: 'Veleprodaja prek spletnega portala ali EDI' },
      { id: 'kombinirano', label: 'Kombinirano' },
    ],
  },

  currentSystem: {
    legend: 'Kako danes vodite prodajo in skladišče?',
    options: [
      {
        id: 'pantheonWms',
        label: 'PANTHEON s skladiščnim modulom in lokacijami',
        band: { min: 0.08, max: 0.2 },
        isPantheon: true,
      },
      {
        id: 'pantheonNoWms',
        label: 'PANTHEON brez vodenja skladiščnih lokacij',
        band: { min: 0.15, max: 0.3 },
        isPantheon: true,
      },
      { id: 'otherErp', label: 'Drug ERP, povezan s skladiščem', band: { min: 0.15, max: 0.3 } },
      { id: 'erpExcelPaper', label: 'Kombinacija ERP-ja, Excela in papirja', band: { min: 0.25, max: 0.4 } },
      { id: 'excelPaper', label: 'Večinoma Excel, papir ali sprotni dogovor', band: { min: 0.25, max: 0.4 } },
    ],
  },

  role: {
    legend: 'Kakšna je vaša vloga?',
    options: [
      { id: 'direktor', label: 'Direktor/-ica' },
      { id: 'vodjaProdaje', label: 'Vodja prodaje ali komerciale' },
      { id: 'vodjaSkladisca', label: 'Vodja skladišča ali logistike' },
      { id: 'finance', label: 'Finance ali računovodstvo' },
      { id: 'drugo', label: 'Drugo' },
    ],
  },

  operationalHour: {
    label: 'Približen polni strošek ure v skladišču',
    help: 'Skladiščnik, komisionar, viličarist — kdor blago dejansko premakne.',
    bands: WHOLESALE_HOUR_BANDS,
    fallbackEUR: 24,
  },

  adminHour: {
    label: 'Približen polni strošek administrativne oziroma vodstvene ure',
    help: 'Komercialist, vodja prodaje, nabava, finance, reklamacije.',
    bands: ADMIN_HOUR_BANDS,
    fallbackEUR: 32,
  },

  /**
   * Prihodek je doslej spraševalo področje Terjatve — kdor ga v triaži ni izbral,
   * je ostal brez osnove. KALIBRACIJA: sredine so geometrijske, preveriti po ~50 vnosih.
   */
  annualRevenue: {
    label: 'Letni prihodki od prodaje blaga',
    help: 'Neto, brez DDV. Če razpona ne izberete, postavk, vezanih na prihodek (npr. strošek plačilnih zamud), ne bomo ocenili — prihodka si ne izmišljamo.',
    bands: [
      { id: 'do2mio', label: 'Do 2 mio EUR', midpoint: 1_200_000, min: 400_000, max: 2_000_000 },
      { id: '2do5mio', label: '2–5 mio EUR', midpoint: 3_200_000, min: 2_000_000, max: 5_000_000 },
      { id: '5do15mio', label: '5–15 mio EUR', midpoint: 8_500_000, min: 5_000_000, max: 15_000_000 },
      { id: 'nad15mio', label: 'Več kot 15 mio EUR', midpoint: 25_000_000, min: 15_000_000, max: 35_000_000 },
    ],
    fallback: 0,
    unit: 'EUR/leto',
  },

  contributionMargin: {
    label: 'Povprečna prispevna marža',
    help: 'Kar od prodajne cene ostane po nabavni vrednosti in neposrednih stroških (prevoz, provizije). Ni pribitek na nabavno ceno.',
    bands: [
      { id: 'do10', label: 'Do 10 %', midpoint: 0.08, min: 0.06, max: 0.1 },
      { id: '10do20', label: '10–20 %', midpoint: 0.15, min: 0.1, max: 0.2 },
      { id: '20do30', label: '20–30 %', midpoint: 0.25, min: 0.2, max: 0.3 },
      { id: 'nad30', label: 'Več kot 30 %', midpoint: 0.35, min: 0.3, max: 0.4 },
    ],
    fallback: 0.25,
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
