import { ADMIN_HOUR_BANDS } from './shared';
import type { CostBand, SegmentContext } from './contextTypes';

const PRODUCTION_HOUR_BANDS: CostBand[] = [
  { id: 'do30', label: 'Do 30 EUR', midpointEUR: 25 },
  { id: '30do45', label: '30–45 EUR', midpointEUR: 37 },
  { id: '45do60', label: '45–60 EUR', midpointEUR: 52 },
  { id: 'nad60', label: 'Več kot 60 EUR', midpointEUR: 70 },
];

export const PROIZVODNJA_CONTEXT: SegmentContext = {
  title: 'Nekaj o vaši proizvodnji',
  intro:
    'Tri vprašanja, ki ne sprašujejo po številkah. Iz njih izpeljemo, koliko od izmerjenega stroška je realno mogoče nasloviti — podjetje, ki že uporablja proizvodni modul, je lažje izboljšave namreč večinoma že pobralo.',
  costBasisIntro:
    'Dve številki, ki veljata za vsa področja. Polni strošek pomeni bruto plačo z vsemi prispevki in režijo, ne neto izplačila.',

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
      { id: 'drugo', label: 'Drugo' },
    ],
  },

  operationalHour: {
    label: 'Približen polni strošek neposredne proizvodne ure',
    help: 'Operater, varilec, monter — kdor dela na delovnem nalogu.',
    bands: PRODUCTION_HOUR_BANDS,
    fallbackEUR: 45,
  },

  adminHour: {
    label: 'Približen polni strošek administrativne oziroma vodstvene ure',
    help: 'Planer, vodja proizvodnje, nabava, priprava dela.',
    bands: ADMIN_HOUR_BANDS,
    fallbackEUR: 35,
  },
};
