import {
  ADMIN_HOUR_BANDS,
  ADMIN_HOUR_EXPLAINER,
  ANNUAL_REVENUE_EXPLAINER,
  CONTRIBUTION_MARGIN_EXPLAINER,
  HOURLY_COST_EXPLAINER,
  MANUFACTURING_HOUR_BANDS,
} from './shared';
import type { SegmentContext } from './contextTypes';


export const PROIZVODNJA_CONTEXT: SegmentContext = {
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
      { id: 'pantheonMfMt', label: 'PANTHEON MF in/ali MT', gap: { min: 0.08, max: 0.2 }, isPantheon: true },
      { id: 'pantheonNoMf', label: 'PANTHEON brez proizvodnega modula', gap: { min: 0.15, max: 0.3 }, isPantheon: true },
      { id: 'otherErp', label: 'Drug ERP za proizvodnjo', gap: { min: 0.15, max: 0.3 } },
      { id: 'erpExcelPaper', label: 'Kombinacija ERP-ja, Excela in papirja', gap: { min: 0.25, max: 0.4 } },
      { id: 'excelPaper', label: 'Večinoma Excel, papir ali sprotni dogovor', gap: { min: 0.25, max: 0.4 } },
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
    bands: MANUFACTURING_HOUR_BANDS,
    fallbackEUR: 21,
  },

  adminHour: {
    label: 'Približen polni strošek administrativne oziroma vodstvene ure',
    help: 'Planer, vodja proizvodnje, nabava, priprava dela.',
    explainer: ADMIN_HOUR_EXPLAINER,
    bands: ADMIN_HOUR_BANDS,
    fallbackEUR: 26,
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
    /**
     * Umerjeno na SURS, podjetja z 10–249 zaposlenimi, 2022–2024: dodana vrednost
     * 31,9 % prihodka, stroški dela 21,2 %, bruto poslovni presežek 10,7 %. Marža
     * leži med presežkom in dodano vrednostjo; po odbitku materiala z energijo
     * (pribl. 56 %), neposrednih storitev (5 %) in neposrednega dela (63 % stroška
     * dela) ostane po oddelkih: les 19 %, živila 20 %, guma in plastika 25 %,
     * stroji 25 %, pohištvo 25 %, kovinski izdelki 28 %.
     *
     * Prejšnja pasova "35–50 %" in "nad 50 %" sta bila nedosegljiva — noben
     * oddelek se jima ne približa. Izpeljava:
     * docs/prispevne-marze-raziskava-2026-08.md
     */
    bands: [
      { id: 'do18', label: 'Do 18 %', midpoint: 0.13, min: 0.08, max: 0.18 },
      { id: '18do28', label: '18–28 %', midpoint: 0.23, min: 0.18, max: 0.28 },
      { id: '28do38', label: '28–38 %', midpoint: 0.33, min: 0.28, max: 0.38 },
      { id: 'nad38', label: 'Več kot 38 %', midpoint: 0.44, min: 0.38, max: 0.52 },
    ],
    // Sidro 2026: 24–26 % za predelovalne dejavnosti kot celoto.
    fallback: 0.26,
    unit: '%',
    asPercent: true,
  },
};
