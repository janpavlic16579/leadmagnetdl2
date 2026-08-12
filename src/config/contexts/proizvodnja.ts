import {
  ADMIN_HOUR_BANDS,
  ADMIN_HOUR_EXPLAINER,
  ANNUAL_REVENUE_EXPLAINER,
  CONTRIBUTION_MARGIN_EXPLAINER,
  HOURLY_COST_EXPLAINER,
} from './shared';
import type { CostBand, SegmentContext } from './contextTypes';

/**
 * Sidro: operater na stroju 19,9 EUR/h, panožno povprečje predelovalnih dejavnosti 23,6.
 * Zgornja pasova pokrijeta izmenske in nevarnostne dodatke ter specializirane profile
 * (CNC, varilec z atestom). Izpeljava in viri: docs/urne-postavke.md.
 */
const PRODUCTION_HOUR_BANDS: CostBand[] = [
  { id: 'do18', label: 'Do 18 EUR', midpointEUR: 16, minEUR: 13, maxEUR: 18 },
  { id: '18do25', label: '18–25 EUR', midpointEUR: 21, minEUR: 18, maxEUR: 25 },
  { id: '25do33', label: '25–33 EUR', midpointEUR: 29, minEUR: 25, maxEUR: 33 },
  { id: 'nad33', label: 'Več kot 33 EUR', midpointEUR: 38, minEUR: 33, maxEUR: 46 },
];

export const PROIZVODNJA_CONTEXT: SegmentContext = {
  title: 'Nekaj o vaši proizvodnji',
  intro:
    'Tri vprašanja, ki ne sprašujejo po številkah. Iz njih izpeljemo, koliko od izmerjenega stroška je realno mogoče nasloviti — podjetje, ki že uporablja proizvodni modul, je lažje izboljšave namreč večinoma že pobralo.',
  costBasisIntro:
    'Štiri številke, ki veljajo za vsa področja. Polni strošek ure pomeni bruto plačo s prispevki delodajalca ter regresom, malico in prevozom — ne neto izplačila in ne režije. Prihodek in maržo vprašamo enkrat — sta lastnost podjetja, ne posameznega področja.',

  businessType: {
    legend: 'Kako pretežno proizvajate?',
    options: [
      { id: 'poNarocilu', label: 'Po naročilu' },
      { id: 'serijsko', label: 'Serijsko' },
      { id: 'naZalogo', label: 'Na zalogo' },
      { id: 'projektno', label: 'Projektno' },
      { id: 'kombinirano', label: 'Kombinirano' },
    ],
  },

  currentSystem: {
    legend: 'Kako danes vodite proizvodnjo?',
    options: [
      { id: 'pantheonMfMt', label: 'PANTHEON MF in/ali MT', band: { min: 0.08, max: 0.2 }, isPantheon: true },
      { id: 'pantheonNoMf', label: 'PANTHEON brez proizvodnega modula', band: { min: 0.15, max: 0.3 }, isPantheon: true },
      { id: 'otherErp', label: 'Drug ERP za proizvodnjo', band: { min: 0.15, max: 0.3 } },
      { id: 'erpExcelPaper', label: 'Kombinacija ERP-ja, Excela in papirja', band: { min: 0.25, max: 0.4 } },
      { id: 'excelPaper', label: 'Večinoma Excel, papir ali sprotni dogovor', band: { min: 0.25, max: 0.4 } },
    ],
  },

  role: {
    legend: 'Kakšna je vaša vloga?',
    options: [
      { id: 'direktor', label: 'Direktor/-ica' },
      { id: 'vodjaProizvodnje', label: 'Vodja proizvodnje' },
      { id: 'finance', label: 'Finance ali računovodstvo' },
      { id: 'nabava', label: 'Nabava ali logistika' },
      { id: 'drugo', label: 'Drugo', freeText: true },
    ],
  },

  operationalHour: {
    label: 'Približen polni strošek neposredne proizvodne ure',
    help: 'Operater, varilec, monter — kdor dela na delovnem nalogu.',
    explainer: HOURLY_COST_EXPLAINER,
    bands: PRODUCTION_HOUR_BANDS,
    fallbackEUR: 22,
  },

  adminHour: {
    label: 'Približen polni strošek administrativne oziroma vodstvene ure',
    help: 'Planer, vodja proizvodnje, nabava, priprava dela.',
    explainer: ADMIN_HOUR_EXPLAINER,
    bands: ADMIN_HOUR_BANDS,
    fallbackEUR: 25,
  },

  /**
   * KALIBRACIJA: razponi pokrivajo ciljni razred 10–249 zaposlenih; sredine so
   * geometrijske (glej contexts/maloprodaja.ts). Preveriti po prvih ~50 vnosih.
   */
  annualRevenue: {
    label: 'Letni prihodki od prodaje',
    help: 'Neto, brez DDV. Če razpona ne izberete, postavk, vezanih na prihodek, ne bomo ocenili — prihodka si ne izmišljamo.',
    explainer: ANNUAL_REVENUE_EXPLAINER,
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
    help: 'Kar od prodajne cene ostane po materialu in neposrednih stroških izdelave. Ni razlika v ceniku, ampak dejanski ostanek.',
    explainer: CONTRIBUTION_MARGIN_EXPLAINER,
    bands: [
      { id: 'do20', label: 'Do 20 %', midpoint: 0.15, min: 0.1, max: 0.2 },
      { id: '20do35', label: '20–35 %', midpoint: 0.28, min: 0.2, max: 0.35 },
      { id: '35do50', label: '35–50 %', midpoint: 0.42, min: 0.35, max: 0.5 },
      { id: 'nad50', label: 'Več kot 50 %', midpoint: 0.58, min: 0.5, max: 0.66 },
    ],
    fallback: 0.25,
    unit: '%',
    asPercent: true,
  },
};
