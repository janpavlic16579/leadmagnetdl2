import { ADMIN_HOUR_BANDS } from './shared';
import type { CostBand, SegmentContext } from './contextTypes';

/**
 * Kontekst storitvenih in projektnih podjetij.
 *
 * Edina dejavnost, ki poleg dveh stroškovnih ur vpraša tudi ZARAČUNANO urno
 * postavko. Razlog je v naravi izgube: proizvodnja izgublja material, storitveno
 * podjetje pa opravljene ure, ki nikoli ne pridejo na račun. Ta ura ni izgubljena
 * kapaciteta — je izgubljen prihodek, zato se vrednoti po ceni in ne po strošku.
 */

/** Izvedbena ura je dražja od proizvodne: svetovalec in inženir sta višje plačana. */
const DELIVERY_HOUR_BANDS: CostBand[] = [
  { id: 'do35', label: 'Do 35 EUR', midpointEUR: 30, minEUR: 25, maxEUR: 35 },
  { id: '35do50', label: '35–50 EUR', midpointEUR: 42, minEUR: 35, maxEUR: 50 },
  { id: '50do70', label: '50–70 EUR', midpointEUR: 60, minEUR: 50, maxEUR: 70 },
  { id: 'nad70', label: 'Več kot 70 EUR', midpointEUR: 85, minEUR: 70, maxEUR: 100 },
];

/**
 * Zaračunana postavka je cena, ne strošek — zato so razponi višji od izvedbene ure.
 * Sredine morajo biti različne od vseh drugih znotraj istega vprašanja: StepCostBasis
 * prepozna izbrani pas po sredini, enaki vrednosti bi označili dva radia hkrati.
 */
const CHARGE_OUT_BANDS: CostBand[] = [
  { id: 'do50', label: 'Do 50 EUR', midpointEUR: 40, minEUR: 30, maxEUR: 50 },
  { id: '50do75', label: '50–75 EUR', midpointEUR: 62, minEUR: 50, maxEUR: 75 },
  { id: '75do100', label: '75–100 EUR', midpointEUR: 87, minEUR: 75, maxEUR: 100 },
  { id: 'nad100', label: 'Več kot 100 EUR', midpointEUR: 120, minEUR: 100, maxEUR: 140 },
];

export const STORITVE_CONTEXT: SegmentContext = {
  title: 'Nekaj o vašem delu z naročniki',
  intro:
    'Tri vprašanja, ki ne sprašujejo po številkah. Iz njih izpeljemo, koliko od izmerjenega stroška je realno mogoče nasloviti — podjetje, ki že spremlja projekte in evidenco dela, je lažje izboljšave namreč večinoma že pobralo.',
  costBasisIntro:
    'Pet številk, ki veljajo za vsa področja. Polni strošek pomeni bruto plačo z vsemi prispevki in režijo, ne neto izplačila; zaračunana postavka pa je to, kar za uro dela v povprečju zaračunate naročniku. Prihodek in maržo vprašamo enkrat — sta lastnost podjetja, ne posameznega področja.',

  businessType: {
    legend: 'Kako pretežno delate?',
    options: [
      { id: 'fiksnaCena', label: 'Projektno po fiksni ceni' },
      { id: 'poPorabi', label: 'Projektno po porabi (čas in material)' },
      { id: 'vzdrzevanje', label: 'Vzdrževalne in podporne pogodbe' },
      { id: 'poUrah', label: 'Svetovanje po urah' },
      { id: 'kombinirano', label: 'Kombinirano' },
    ],
  },

  currentSystem: {
    legend: 'Kako danes vodite projekte in evidenco dela?',
    options: [
      {
        id: 'pantheonProjects',
        label: 'PANTHEON s projekti in evidenco dela',
        band: { min: 0.08, max: 0.2 },
        isPantheon: true,
      },
      {
        id: 'pantheonNoProjects',
        label: 'PANTHEON brez projektnega spremljanja',
        band: { min: 0.15, max: 0.3 },
        isPantheon: true,
      },
      { id: 'otherErpPsa', label: 'Drug ERP ali projektno orodje', band: { min: 0.15, max: 0.3 } },
      { id: 'erpExcel', label: 'Kombinacija ERP-ja in Excela', band: { min: 0.25, max: 0.4 } },
      {
        id: 'excelPaper',
        label: 'Večinoma Excel, koledar ali sprotni dogovor',
        band: { min: 0.25, max: 0.4 },
      },
    ],
  },

  role: {
    legend: 'Kakšna je vaša vloga?',
    options: [
      { id: 'direktor', label: 'Direktor/-ica' },
      { id: 'vodjaProjektov', label: 'Vodja projektov' },
      { id: 'finance', label: 'Finance ali računovodstvo' },
      { id: 'prodaja', label: 'Prodaja ali skrb za naročnike' },
      { id: 'drugo', label: 'Drugo' },
    ],
  },

  operationalHour: {
    label: 'Približen polni strošek izvedbene ure',
    help: 'Svetovalec, inženir, tehnik, oblikovalec — kdor dela na projektu za naročnika.',
    bands: DELIVERY_HOUR_BANDS,
    fallbackEUR: 45,
  },

  adminHour: {
    label: 'Približen polni strošek administrativne oziroma vodstvene ure',
    help: 'Vodja projektov, priprava ponudb, obračun, podpora prodaji.',
    bands: ADMIN_HOUR_BANDS,
    fallbackEUR: 35,
  },

  chargeOutRate: {
    label: 'Povprečna zaračunana urna postavka',
    help: 'Koliko v povprečju zaračunate naročniku za uro dela. Po tej postavki se ovrednotijo opravljene, a nezaračunane ure.',
    bands: CHARGE_OUT_BANDS,
    fallbackEUR: 75,
  },

  /** KALIBRACIJA: sredine so geometrijske, preveriti po prvih ~50 vnosih. */
  annualRevenue: {
    label: 'Letni prihodki od prodaje storitev',
    help: 'Neto, brez DDV. Če razpona ne izberete, postavk, vezanih na prihodek, ne bomo ocenili — prihodka si ne izmišljamo.',
    bands: [
      { id: 'do05mio', label: 'Do 0,5 mio EUR', midpoint: 300_000, min: 100_000, max: 500_000 },
      { id: '05do2mio', label: '0,5–2 mio EUR', midpoint: 1_100_000, min: 500_000, max: 2_000_000 },
      { id: '2do5mio', label: '2–5 mio EUR', midpoint: 3_200_000, min: 2_000_000, max: 5_000_000 },
      { id: 'nad5mio', label: 'Več kot 5 mio EUR', midpoint: 8_000_000, min: 5_000_000, max: 11_000_000 },
    ],
    fallback: 0,
    unit: 'EUR/leto',
  },

  contributionMargin: {
    label: 'Povprečna prispevna marža',
    help: 'Kar od zaračunanega ostane po neposrednih stroških izvedbe (plače na projektu, podizvajalci, licence).',
    bands: [
      { id: 'do30', label: 'Do 30 %', midpoint: 0.25, min: 0.2, max: 0.3 },
      { id: '30do50', label: '30–50 %', midpoint: 0.4, min: 0.3, max: 0.5 },
      { id: '50do70', label: '50–70 %', midpoint: 0.6, min: 0.5, max: 0.7 },
      { id: 'nad70', label: 'Več kot 70 %', midpoint: 0.78, min: 0.7, max: 0.86 },
    ],
    fallback: 0.25,
    unit: '%',
    asPercent: true,
  },
};
