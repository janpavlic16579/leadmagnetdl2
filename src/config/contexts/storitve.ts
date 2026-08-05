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
  { id: 'do35', label: 'Do 35 EUR', midpointEUR: 30 },
  { id: '35do50', label: '35–50 EUR', midpointEUR: 42 },
  { id: '50do70', label: '50–70 EUR', midpointEUR: 60 },
  { id: 'nad70', label: 'Več kot 70 EUR', midpointEUR: 85 },
];

/**
 * Zaračunana postavka je cena, ne strošek — zato so razponi višji od izvedbene ure.
 * Sredine morajo biti različne od vseh drugih znotraj istega vprašanja: StepCostBasis
 * prepozna izbrani pas po sredini, enaki vrednosti bi označili dva radia hkrati.
 */
const CHARGE_OUT_BANDS: CostBand[] = [
  { id: 'do50', label: 'Do 50 EUR', midpointEUR: 40 },
  { id: '50do75', label: '50–75 EUR', midpointEUR: 62 },
  { id: '75do100', label: '75–100 EUR', midpointEUR: 87 },
  { id: 'nad100', label: 'Več kot 100 EUR', midpointEUR: 120 },
];

export const STORITVE_CONTEXT: SegmentContext = {
  title: 'Nekaj o vašem delu z naročniki',
  intro:
    'Tri vprašanja, ki ne sprašujejo po številkah. Iz njih izpeljemo, koliko od izmerjenega stroška je realno mogoče nasloviti — podjetje, ki že spremlja projekte in evidenco dela, je lažje izboljšave namreč večinoma že pobralo.',
  costBasisIntro:
    'Tri številke, ki veljajo za vsa področja. Polni strošek pomeni bruto plačo z vsemi prispevki in režijo, ne neto izplačila; zaračunana postavka pa je to, kar za uro dela v povprečju zaračunate naročniku.',

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
};
