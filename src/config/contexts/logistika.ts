import {
  ADMIN_HOUR_BANDS,
  ADMIN_HOUR_EXPLAINER,
  ANNUAL_REVENUE_EXPLAINER,
  CONTRIBUTION_MARGIN_EXPLAINER,
  HOURLY_COST_EXPLAINER,
} from './shared';
import type { CostBand, SegmentContext } from './contextTypes';

/**
 * Logistika ima lasten nabor, ker vprašanje meri tri različno plačane poklice
 * hkrati. Sidro NI voznik, čeprav ga vprašanje našteje prvega: dva od treh
 * naštetih poklicev sta dražja od njega, zato sredina pripada skladiščniku.
 *
 * Sidro 2026: skladiščnik 22,1 EUR/h, prekladalna dela 21,9, preprosta transportna
 * dela 21,4, voznik težkega tovornjaka 19,5; panožno povprečje prevoza in
 * skladiščenja 22,3. Zgornja pasova nista teoretična:
 * mednarodni prevoz z dnevnicami uro dvigne bistveno nad plačilno listo.
 * Izpeljava in viri: docs/urne-postavke.md.
 */
const OPERATIONAL_HOUR_BANDS: CostBand[] = [
  { id: 'do19', label: 'Do 19 EUR', midpointEUR: 17, minEUR: 15, maxEUR: 19 },
  { id: '19do25', label: '19–25 EUR', midpointEUR: 21, minEUR: 19, maxEUR: 25 },
  { id: '25do33', label: '25–33 EUR', midpointEUR: 29, minEUR: 25, maxEUR: 33 },
  { id: 'nad33', label: 'Več kot 33 EUR', midpointEUR: 38, minEUR: 33, maxEUR: 45 },
];

/**
 * Kontekst logističnega in transportnega podjetja.
 *
 * Dejavnost je bolj raznolika od proizvodnje: prevoznik z lastnim voznim parkom,
 * špediter brez vozil in skladiščnik za tuje blago odgovarjajo na isti vprašalnik.
 * Prvo vprašanje zato ni okras — določi, katere številke bo obiskovalec sploh
 * lahko vnesel, in pomaga prodaji brati zapis (špediter brez vozil bo imel 0
 * praznih kilometrov, ne pa zato tudi 0 stroška).
 *
 * PANTHEON: Datalab nima ločene logistične licence — logistiko pokrivata licenci
 * SE in ME (modula LT in LT3) na ravni financ, naročil, dokumentacije, stroškov
 * in obračunavanja (glej config/industries.ts). Zato možnost z najnižjim pasom
 * izboljšave ne trdi, da PANTHEON prinaša namenski WMS ali TMS: opisuje podjetje,
 * ki tak sistem že ima, ne glede na to, čigav je.
 */
export const LOGISTIKA_CONTEXT: SegmentContext = {
  title: 'Nekaj o vaši logistiki',
  intro:
    'Tri vprašanja, ki ne sprašujejo po številkah. Iz njih izpeljemo, koliko od izmerjenega stroška je realno mogoče nasloviti — podjetje, ki namenski skladiščni ali transportni sistem že uporablja, je lažje izboljšave namreč večinoma že pobralo.',
  costBasisIntro:
    'Štiri številke, ki veljajo za vsa področja. Polni strošek ure pomeni bruto plačo s prispevki delodajalca ter regresom, malico in prevozom — ne neto izplačila in ne režije. Prihodek in maržo vprašamo enkrat — sta lastnost podjetja, ne posameznega področja.',

  businessType: {
    legend: 'Kaj pretežno izvajate?',
    options: [
      { id: 'lastniPrevoz', label: 'Prevozi z lastnim voznim parkom' },
      { id: 'podizvajalci', label: 'Prevozi s pogodbenimi prevozniki' },
      { id: 'skladiscenje', label: 'Skladiščenje in distribucija' },
      { id: 'spedicija', label: 'Špedicija in organizacija prevozov' },
      { id: 'kombinirano', label: 'Kombinirano' },
    ],
  },

  currentSystem: {
    legend: 'Kako danes vodite logistiko?',
    options: [
      {
        id: 'pantheonWmsTms',
        label: 'PANTHEON in namenski skladiščni oziroma transportni sistem',
        band: { min: 0.08, max: 0.2 },
        isPantheon: true,
      },
      {
        id: 'pantheonNoWms',
        label: 'PANTHEON brez namenskega logističnega sistema',
        band: { min: 0.15, max: 0.3 },
        isPantheon: true,
      },
      { id: 'otherErp', label: 'Drug ERP ali namenski logistični sistem', band: { min: 0.15, max: 0.3 } },
      { id: 'erpExcelPaper', label: 'Kombinacija ERP-ja, Excela in papirja', band: { min: 0.25, max: 0.4 } },
      { id: 'excelPaper', label: 'Večinoma Excel, papir ali telefon', band: { min: 0.25, max: 0.4 } },
    ],
  },

  role: {
    legend: 'Kakšna je vaša vloga?',
    options: [
      { id: 'direktor', label: 'Direktor/-ica' },
      { id: 'vodjaLogistike', label: 'Vodja logistike ali disponent' },
      { id: 'finance', label: 'Finance ali računovodstvo' },
      { id: 'nabava', label: 'Nabava ali skladišče' },
      { id: 'drugo', label: 'Drugo', freeText: true },
    ],
  },

  operationalHour: {
    label: 'Približen polni strošek operativne ure',
    help: 'Voznik, skladiščnik, komisionar — kdor pošiljko dejansko premakne.',
    explainer: HOURLY_COST_EXPLAINER,
    bands: OPERATIONAL_HOUR_BANDS,
    fallbackEUR: 22,
  },

  adminHour: {
    label: 'Približen polni strošek administrativne oziroma vodstvene ure',
    help: 'Disponent, prodaja, prevozna dokumentacija, vodja logistike.',
    explainer: ADMIN_HOUR_EXPLAINER,
    bands: ADMIN_HOUR_BANDS,
    fallbackEUR: 27,
  },

  /** KALIBRACIJA: sredine so geometrijske, preveriti po prvih ~50 vnosih. */
  annualRevenue: {
    label: 'Letni prihodki od prodaje storitev',
    help: 'Neto, brez DDV. Če razpona ne izberete, postavk, vezanih na prihodek, ne bomo ocenili — prihodka si ne izmišljamo.',
    explainer: ANNUAL_REVENUE_EXPLAINER,
    bands: [
      { id: 'do1mio', label: 'Do 1 mio EUR', midpoint: 600_000, min: 200_000, max: 1_000_000 },
      { id: '1do3mio', label: '1–3 mio EUR', midpoint: 1_800_000, min: 1_000_000, max: 3_000_000 },
      { id: '3do10mio', label: '3–10 mio EUR', midpoint: 5_500_000, min: 3_000_000, max: 10_000_000 },
      { id: 'nad10mio', label: 'Več kot 10 mio EUR', midpoint: 15_000_000, min: 10_000_000, max: 20_000_000 },
    ],
    fallback: 0,
    unit: 'EUR/leto',
  },

  contributionMargin: {
    label: 'Povprečna prispevna marža',
    help: 'Kar od zaračunane cene ostane po neposrednih stroških izvedbe (gorivo, podizvajalci, cestnine).',
    explainer: CONTRIBUTION_MARGIN_EXPLAINER,
    bands: [
      { id: 'do15', label: 'Do 15 %', midpoint: 0.12, min: 0.09, max: 0.15 },
      { id: '15do30', label: '15–30 %', midpoint: 0.22, min: 0.15, max: 0.3 },
      { id: '30do45', label: '30–45 %', midpoint: 0.37, min: 0.3, max: 0.45 },
      { id: 'nad45', label: 'Več kot 45 %', midpoint: 0.52, min: 0.45, max: 0.59 },
    ],
    fallback: 0.25,
    unit: '%',
    asPercent: true,
  },
};
