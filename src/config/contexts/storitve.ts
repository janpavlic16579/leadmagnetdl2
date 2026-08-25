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
 * poklicev v kalkulatorju: grafični oblikovalec (24,0 EUR/h) in mehanik-serviser
 * (25,0) na eni strani, inženir strojništva in programer (35+) na drugi. Spodnja
 * pasova zajameta terensko ekipo, zgornja svetovalca in inženirja — sidro 2026
 * (SURS, zasebni sektor, oktober 2025, prevrednoteno): tehnik za strojništvo 27,7,
 * strokovnjak tehnično-tehnoloških strok 32,0, inženir/tehnolog 33,2, programer
 * aplikacij 34,6, inženir strojništva 35,8; panoga K62 33,5, N71.12 inženiring 27,4.
 * Zgornji pas je odrezan pri 46 in ne višje: nad tem ni več izvedbena ura, ampak
 * partner. Cena te
 * izbire je zavestna: širši pas pomeni, da se rezultat pogosteje prikaže kot razpon
 * in ne kot ena številka. Izpeljava in viri: docs/urne-postavke.md.
 */
const DELIVERY_HOUR_BANDS: CostBand[] = [
  { id: 'do22', label: 'Do 22 EUR', midpointEUR: 18, minEUR: 15, maxEUR: 22 },
  { id: '22do28', label: '22–28 EUR', midpointEUR: 25, minEUR: 22, maxEUR: 28 },
  { id: '28do35', label: '28–35 EUR', midpointEUR: 32, minEUR: 28, maxEUR: 35 },
  { id: 'nad35', label: 'Več kot 35 EUR', midpointEUR: 40, minEUR: 35, maxEUR: 46 },
];

/**
 * Zaračunana postavka je cena, ne strošek — zato so razponi višji od izvedbene ure
 * in zato je sidro drugo: ne plače, ampak objavljeni ceniki. IZS za 2026 priporoča
 * temeljno vrednost storitve 72,52 EUR/h (±15 %), po storitvenih razredih od 50,76
 * do 152,29; referenčni cenik GZS za IKT gre od 32 EUR (pomožna dela) prek 58
 * (programer I) in 79 (analitik) do 143 EUR za ekspertno svetovanje; računovodsko
 * knjiženje stane 50–88 EUR/h, svetovanje 81–190; povprečen programer na trgu 50
 * EUR/h. Sredina trga za splošno storitveno podjetje je zato 50–72 EUR/h.
 *
 * Najnižji pas se začne pri 30 in ne 25 EUR: pod 32 EUR (pomožna dela po ceniku
 * GZS) ni nobene objavljene postavke, tudi ne za najpreprostejše delo.
 *
 * Sredine morajo biti različne od vseh drugih znotraj istega vprašanja: StepCostBasis
 * prepozna izbrani pas po sredini, enaki vrednosti bi označili dva radia hkrati.
 */
const CHARGE_OUT_BANDS: CostBand[] = [
  { id: 'do42', label: 'Do 42 EUR', midpointEUR: 36, minEUR: 30, maxEUR: 42 },
  { id: '42do60', label: '42–60 EUR', midpointEUR: 50, minEUR: 42, maxEUR: 60 },
  { id: '60do85', label: '60–85 EUR', midpointEUR: 72, minEUR: 60, maxEUR: 85 },
  { id: 'nad85', label: 'Več kot 85 EUR', midpointEUR: 105, minEUR: 85, maxEUR: 130 },
];

export const STORITVE_CONTEXT: SegmentContext = {
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
    fallbackEUR: 29,
  },

  adminHour: {
    label: 'Približen polni strošek administrativne oziroma vodstvene ure',
    help: 'Vodja projektov, priprava ponudb, obračun, podpora prodaji.',
    explainer: ADMIN_HOUR_EXPLAINER,
    bands: ADMIN_HOUR_BANDS,
    fallbackEUR: 26,
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
    /**
     * Sidro 2026: izpeljano iz obeh postavk tega vprašalnika. Izvedbena ura stane
     * 29 EUR (:116), zaračunana je 55 EUR (:137) — neposredno delo je torej 52,7 %
     * zaračunanega, licence in podizvajalci pribl. 8 %. SURS 2024 da po dejavnostih
     * 49 % (projektiranje), 50 % (svetovanje) in 60 % (programiranje), a statistika
     * podizvajalcev ne loči od stalnih storitev, zato je vzeta nižja, lastna pot.
     *
     * Prejšnjih 30 % je bilo v nasprotju s postavkama zgoraj: pomenilo bi
     * zaračunano uro 42 EUR namesto 55.
     * Izpeljava: docs/prispevne-marze-raziskava-2026-08.md
     */
    fallback: 0.4,
    unit: '%',
    asPercent: true,
  },
};
