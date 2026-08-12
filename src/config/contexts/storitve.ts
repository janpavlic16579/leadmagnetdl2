import {
  ADMIN_HOUR_BANDS,
  ADMIN_HOUR_EXPLAINER,
  ANNUAL_REVENUE_EXPLAINER,
  CONTRIBUTION_MARGIN_EXPLAINER,
  HOURLY_COST_EXPLAINER,
} from './shared';
import type { CostBand, SegmentContext } from './contextTypes';

/**
 * Kontekst storitvenih in projektnih podjetij.
 *
 * Edina dejavnost, ki poleg dveh stroškovnih ur vpraša tudi ZARAČUNANO urno
 * postavko. Razlog je v naravi izgube: proizvodnja izgublja material, storitveno
 * podjetje pa opravljene ure, ki nikoli ne pridejo na račun. Ta ura ni izgubljena
 * kapaciteta — je izgubljen prihodek, zato se vrednoti po ceni in ne po strošku.
 */

/**
 * Izvedbena ura je dražja od proizvodne: svetovalec in inženir sta višje plačana.
 *
 * Nabor je NAMENOMA širši od vseh ostalih, ker segment pokriva najširši razpon
 * poklicev v kalkulatorju: monter in serviser (~20 EUR/h) na eni strani, senior IT
 * svetovalec (35+) na drugi. Spodnja pasova zajameta terensko ekipo, zgornja
 * svetovalca in inženirja (inženir/tehnolog 30,2 EUR/h, panoga IKT 31,1). Cena te
 * izbire je zavestna: širši pas pomeni, da se rezultat pogosteje prikaže kot razpon
 * in ne kot ena številka. Izpeljava in viri: docs/urne-postavke.md.
 */
const DELIVERY_HOUR_BANDS: CostBand[] = [
  { id: 'do24', label: 'Do 24 EUR', midpointEUR: 20, minEUR: 16, maxEUR: 24 },
  { id: '24do33', label: '24–33 EUR', midpointEUR: 28, minEUR: 24, maxEUR: 33 },
  { id: '33do45', label: '33–45 EUR', midpointEUR: 38, minEUR: 33, maxEUR: 45 },
  { id: 'nad45', label: 'Več kot 45 EUR', midpointEUR: 55, minEUR: 45, maxEUR: 68 },
];

/**
 * Zaračunana postavka je cena, ne strošek — zato so razponi višji od izvedbene ure
 * in zato je sidro drugo: ne plače, ampak objavljeni ceniki. IZS priporoča osnovno
 * vrednost storitve 70 EUR/h (±15 %) za licencirano projektiranje, ZING zahtevno
 * svetovanje 67 EUR/h (47 EUR za člane), računovodsko svetovanje sega od 81 do
 * 180 EUR/h, samostojni razvijalec pa dela za 25–45 EUR/h. Sredina trga za splošno
 * storitveno podjetje je zato 45–70 EUR/h, ne 75–90.
 *
 * Sredine morajo biti različne od vseh drugih znotraj istega vprašanja: StepCostBasis
 * prepozna izbrani pas po sredini, enaki vrednosti bi označili dva radia hkrati.
 */
const CHARGE_OUT_BANDS: CostBand[] = [
  { id: 'do40', label: 'Do 40 EUR', midpointEUR: 33, minEUR: 25, maxEUR: 40 },
  { id: '40do60', label: '40–60 EUR', midpointEUR: 50, minEUR: 40, maxEUR: 60 },
  { id: '60do85', label: '60–85 EUR', midpointEUR: 72, minEUR: 60, maxEUR: 85 },
  { id: 'nad85', label: 'Več kot 85 EUR', midpointEUR: 105, minEUR: 85, maxEUR: 130 },
];

export const STORITVE_CONTEXT: SegmentContext = {
  title: 'Nekaj o vašem delu z naročniki',
  intro:
    'Tri vprašanja, ki ne sprašujejo po številkah. Iz njih izpeljemo, koliko od izmerjenega stroška je realno mogoče nasloviti — podjetje, ki že spremlja projekte in evidenco dela, je lažje izboljšave namreč večinoma že pobralo.',
  costBasisIntro:
    'Pet številk, ki veljajo za vsa področja. Polni strošek pomeni bruto plačo s prispevki delodajalca ter regresom, malico in prevozom — ne neto izplačila in ne režije; zaračunana postavka pa je to, kar za uro dela v povprečju zaračunate naročniku. Prihodek in maržo vprašamo enkrat — sta lastnost podjetja, ne posameznega področja.',

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
      { id: 'drugo', label: 'Drugo', freeText: true },
    ],
  },

  operationalHour: {
    label: 'Približen polni strošek izvedbene ure',
    help: 'Svetovalec, inženir, tehnik, oblikovalec — kdor dela na projektu za naročnika.',
    explainer: HOURLY_COST_EXPLAINER,
    bands: DELIVERY_HOUR_BANDS,
    fallbackEUR: 30,
  },

  adminHour: {
    label: 'Približen polni strošek administrativne oziroma vodstvene ure',
    help: 'Vodja projektov, priprava ponudb, obračun, podpora prodaji.',
    explainer: ADMIN_HOUR_EXPLAINER,
    bands: ADMIN_HOUR_BANDS,
    fallbackEUR: 25,
  },

  chargeOutRate: {
    label: 'Povprečna zaračunana urna postavka',
    help: 'Koliko v povprečju zaračunate naročniku za uro dela. Po tej postavki se ovrednotijo opravljene, a nezaračunane ure.',
    // Edino pojasnilo, ki ni skupno: cena ure je pojem, ki ga pozna samo dejavnost,
    // ki ure prodaja — drugod je vprašanja sploh ni.
    explainer:
      'Cena in ne strošek: koliko naročniku zaračunate za uro dela — po ceniku ali v povprečju čez projekte. ' +
      'Hiter izračun: letne prihodke od storitev delite z zaračunanimi urami. Primer: 600.000 EUR / 12.000 ur = 50 EUR/h. ' +
      'Po tej postavki ovrednotimo ure, ki ste jih opravili, a jih niste zaračunali.',
    bands: CHARGE_OUT_BANDS,
    fallbackEUR: 55,
  },

  /** KALIBRACIJA: sredine so geometrijske, preveriti po prvih ~50 vnosih. */
  annualRevenue: {
    label: 'Letni prihodki od prodaje storitev',
    help: 'Neto, brez DDV. Če razpona ne izberete, postavk, vezanih na prihodek, ne bomo ocenili — prihodka si ne izmišljamo.',
    explainer: ANNUAL_REVENUE_EXPLAINER,
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
    explainer: CONTRIBUTION_MARGIN_EXPLAINER,
    bands: [
      { id: 'do30', label: 'Do 30 %', midpoint: 0.25, min: 0.2, max: 0.3 },
      { id: '30do50', label: '30–50 %', midpoint: 0.4, min: 0.3, max: 0.5 },
      { id: '50do70', label: '50–70 %', midpoint: 0.6, min: 0.5, max: 0.7 },
      { id: 'nad70', label: 'Več kot 70 %', midpoint: 0.78, min: 0.7, max: 0.86 },
    ],
    // Ne 0,25: to je sredina pasu "Do 30 %", zato bi bil radio označen že ob prvem
    // izrisu in "ni odgovora" bi se prikazalo kot izbran razpon.
    fallback: 0.3,
    unit: '%',
    asPercent: true,
  },
};
