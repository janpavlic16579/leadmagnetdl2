import {
  ADMIN_HOUR_BANDS,
  ADMIN_HOUR_EXPLAINER,
  ANNUAL_REVENUE_EXPLAINER,
  HOURLY_COST_EXPLAINER,
} from './shared';
import type { CostBand, SegmentContext } from './contextTypes';

/**
 * Živilska proizvodnja plačuje operativno uro pod povprečjem predelovalnih
 * dejavnosti: mesar, pek in operater na polnilni liniji so med najnižje plačanimi
 * proizvodnimi poklici, oddelka C10 in C11 pa SURS v strukturni statistiki plač
 * ne izkazuje ločeno. Sidro je zato posredno — upravljavci strojev 20,9 EUR/h
 * (SURS, zasebni sektor, oktober 2025, docs/urne-postavke.md), zamaknjeno za en
 * pas navzdol; dvig minimalne plače januarja 2026 (+16 %) je v tej panogi
 * zadel največji delež zaposlenih (raziskava panoge, list Trzni_benchmarki).
 * Spodnja meja 15 EUR je zakonska, ne okrogla.
 *
 * KALIBRACIJA: sidro je posredno, preveriti po prvih ~50 vnosih.
 */
const FOOD_HOUR_BANDS: CostBand[] = [
  { id: 'do17', label: 'Do 17 EUR', midpointEUR: 16, minEUR: 15, maxEUR: 17 },
  { id: '17do19', label: '17–19 EUR', midpointEUR: 18, minEUR: 17, maxEUR: 19 },
  { id: '19do23', label: '19–23 EUR', midpointEUR: 21, minEUR: 19, maxEUR: 23 },
  { id: 'nad23', label: 'Več kot 23 EUR', midpointEUR: 26, minEUR: 23, maxEUR: 30 },
];

/**
 * Kontekst živilskega proizvajalca.
 *
 * Prvo vprašanje sprašuje po skupini izdelkov in ne po načinu proizvodnje kot v
 * splošni proizvodnji: mlekarna, mesnica in pekarna imajo iste zakone (178/2002,
 * 852/2004, 1169/2011), a drugačne bolečine in drugačna pravila po vertikali
 * (raziskava, segment S5 "Specialist"). Prodajniku pove, o čem bo tekel pogovor,
 * preden odpre poročilo.
 *
 * Marže ta dejavnost NE vpraša: noben njen modul je ne uporablja (izguba se meri
 * kot delež porabljenih surovin, ne prometa), vprašanje brez učinka na rezultat
 * pa bi vprašalnik samo podaljšalo. Prihodek se vpraša, ker ga bere prodajna
 * priprava (kvalifikacija) in ker raziskava panoge ICP meri po prihodku na
 * zaposlenega.
 */
export const ZIVILSTVO_CONTEXT: SegmentContext = {
  businessType: {
    legend: 'Kaj pretežno proizvajate?',
    options: [
      { id: 'meso', label: 'Mesni izdelki' },
      { id: 'mleko', label: 'Mlečni izdelki' },
      { id: 'pekarstvo', label: 'Pekarski in slaščičarski izdelki' },
      { id: 'pijace', label: 'Pijače' },
      { id: 'predelava', label: 'Predelava sadja, zelenjave in drugih surovin' },
      { id: 'kombinirano', label: 'Več skupin izdelkov' },
    ],
  },

  currentSystem: {
    legend: 'Kako danes vodite proizvodnjo in sledljivost šarž?',
    options: [
      {
        id: 'pantheonMfSarze',
        label: 'PANTHEON s proizvodnim modulom in šaržami',
        gap: { min: 0.08, max: 0.2 },
        isPantheon: true,
      },
      {
        id: 'pantheonNoMf',
        label: 'PANTHEON brez proizvodnega modula',
        gap: { min: 0.15, max: 0.3 },
        isPantheon: true,
      },
      { id: 'otherErp', label: 'Drug ERP ali namenski program za živilsko proizvodnjo', gap: { min: 0.15, max: 0.3 } },
      { id: 'erpExcelPaper', label: 'Kombinacija ERP-ja, Excela in papirnih evidenc', gap: { min: 0.25, max: 0.4 } },
      { id: 'excelPaper', label: 'Večinoma Excel, papir in HACCP mape', gap: { min: 0.25, max: 0.4 } },
    ],
  },

  role: {
    legend: 'Kakšna je vaša vloga?',
    options: [
      { id: 'direktor', label: 'Direktor/-ica' },
      { id: 'vodjaProizvodnje', label: 'Vodja proizvodnje' },
      // Raziskava (H02) domneva, da je vodja kakovosti boljši prvi stik kot
      // direktor: presoje, odpoklic in HACCP so njegovo področje. Zato lastna
      // vloga in ne "Drugo" — v oceni ICP se ujame po predponi 'vodja'.
      { id: 'vodjaKakovosti', label: 'Vodja kakovosti ali tehnolog' },
      { id: 'finance', label: 'Finance ali računovodstvo' },
      { id: 'nabava', label: 'Nabava ali skladišče' },
      { id: 'drugo', label: 'Drugo', freeText: true },
    ],
  },

  operationalHour: {
    label: 'Približen polni strošek neposredne proizvodne ure',
    help: 'Operater na liniji, mesar, pek, pakirec — kdor dela na šarži.',
    explainer: HOURLY_COST_EXPLAINER,
    bands: FOOD_HOUR_BANDS,
    fallbackEUR: 18,
  },

  adminHour: {
    label: 'Približen polni strošek administrativne oziroma vodstvene ure',
    help: 'Tehnolog, vodja kakovosti, planer, nabava, prodaja.',
    explainer: ADMIN_HOUR_EXPLAINER,
    bands: ADMIN_HOUR_BANDS,
    fallbackEUR: 26,
  },

  /**
   * Razponi pokrivajo ciljni razred 10–249 zaposlenih. Mediana prihodkov v
   * segmentu A (20+ zaposlenih) obstoječega seznama je 8,6 mio EUR, prihodek na
   * zaposlenega 207.000 EUR — najvišji med petimi raziskanimi panogami
   * (raziskava, list Naslovnica). Sredine so geometrijske.
   * KALIBRACIJA: preveriti po prvih ~50 vnosih.
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
};
