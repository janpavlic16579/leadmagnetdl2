import {
  ADMIN_HOUR_BANDS,
  ADMIN_HOUR_EXPLAINER,
  ANNUAL_REVENUE_EXPLAINER,
  HOURLY_COST_EXPLAINER,
  MANUFACTURING_HOUR_BANDS,
} from './shared';
import type { SegmentContext } from './contextTypes';

/**
 * Kontekst kovinarja (SKD C25 kovinski izdelki, C28 stroji in naprave).
 *
 * Prvo vprašanje sprašuje po načinu dela in ne po skupini izdelkov: raziskava
 * panoge (lista Segmenti S1–S5 in Arhetipi) loči delavnico s posamičnimi kosi,
 * serijskega podizvajalca, strojegradnjo z orodjarstvom in sistemskega dobavitelja
 * z zahtevami kupcev po dokumentaciji — bolečine in prodajni pogovor so pri vsakem
 * drugačni, čeprav so stroji isti.
 *
 * Marže ta dejavnost NE vpraša: noben njen modul je ne uporablja (izguba se meri
 * kot delež porabljenega materiala in v urah, ne kot delež prometa), vprašanje brez
 * učinka na rezultat pa bi vprašalnik samo podaljšalo — isti razlog kot pri
 * živilstvu. Prihodek se vpraša, ker ga bere prodajna priprava (kvalifikacija) in
 * ker raziskava ICP meri po prihodku na zaposlenega (list Naslovnica).
 */
export const KOVINARSTVO_CONTEXT: SegmentContext = {
  businessType: {
    legend: 'Kako pretežno delate?',
    options: [
      { id: 'posamicniKosi', label: 'Posamični kosi in male serije po naročilu' },
      { id: 'serije', label: 'Ponavljajoče se serije za stalne kupce' },
      { id: 'strojegradnja', label: 'Strojegradnja, orodjarstvo ali projektna proizvodnja' },
      { id: 'sistemskiDobavitelj', label: 'Sistemski dobavitelj z zahtevami kupcev po dokumentaciji' },
      { id: 'kombinirano', label: 'Kombinirano' },
    ],
  },

  currentSystem: {
    // Isti id-ji in vrzeli kot v proizvodnji: sistem je isti, panoga ne. Ključi v
    // content/sales/pantheonFit.ts so `kovinarstvo:<id>`.
    legend: 'Kako danes vodite proizvodnjo?',
    options: [
      { id: 'pantheonMfMt', label: 'PANTHEON MF in/ali MT', gap: { min: 0.08, max: 0.2 }, isPantheon: true },
      { id: 'pantheonNoMf', label: 'PANTHEON brez proizvodnega modula', gap: { min: 0.15, max: 0.3 }, isPantheon: true },
      { id: 'otherErp', label: 'Drug ERP za proizvodnjo', gap: { min: 0.15, max: 0.3 } },
      {
        id: 'erpExcelPaper',
        label: 'Kombinacija ERP-ja, Excela, CAD/CAM programov in papirja',
        gap: { min: 0.25, max: 0.4 },
      },
      { id: 'excelPaper', label: 'Večinoma Excel, papir ali sprotni dogovor', gap: { min: 0.25, max: 0.4 } },
    ],
  },

  role: {
    legend: 'Kakšna je vaša vloga?',
    options: [
      { id: 'direktor', label: 'Direktor/-ica' },
      { id: 'vodjaProizvodnje', label: 'Vodja proizvodnje' },
      // Tehnolog je persona raziskave (list Vprasalnik Q10–Q12): kosovnice, normativi
      // in kalkulacija so njegovo področje. Lastna vloga in ne "Drugo"; v oceni ICP
      // se ujame po predponi 'vodja' (0,60), enako kot vodja kakovosti pri živilstvu.
      { id: 'vodjaTehnologije', label: 'Tehnolog ali vodja tehnologije' },
      { id: 'finance', label: 'Finance ali računovodstvo' },
      { id: 'nabava', label: 'Nabava ali skladišče' },
      { id: 'drugo', label: 'Drugo', freeText: true },
    ],
  },

  /**
   * Sidro: SURS, drseče povprečje do junija 2026 (docs/urne-postavke.md), C25
   * kovinski izdelki 23,6 EUR/h, C28 stroji 27,3 — panožno povprečje vključuje
   * tudi tehnologe in vodje. Neposredni proizvodni poklici (SURS, zasebni sektor,
   * oktober 2025, prevrednoteno): varilec 20,7, operater na stroju 20,9, orodjar
   * 21,8, strugar 23,1. Sredina teh štirih je 22 in leži v natanko enem pasu
   * (20–25). Nad splošno proizvodnjo (21), ker je delež kvalificiranih profilov
   * (CNC, varilec z atestom) v kovinarstvu višji.
   */
  operationalHour: {
    label: 'Približen polni strošek neposredne proizvodne ure',
    help: 'Strugar, varilec, CNC-operater, orodjar — kdor dela na delovnem nalogu.',
    explainer: HOURLY_COST_EXPLAINER,
    bands: MANUFACTURING_HOUR_BANDS,
    fallbackEUR: 22,
  },

  adminHour: {
    label: 'Približen polni strošek administrativne oziroma vodstvene ure',
    help: 'Tehnolog, planer, vodja proizvodnje, priprava dela, nabava.',
    explainer: ADMIN_HOUR_EXPLAINER,
    bands: ADMIN_HOUR_BANDS,
    fallbackEUR: 26,
  },

  /**
   * Razponi pokrivajo ciljni razred 10–249 zaposlenih. Mediana prihodkov v
   * segmentu A (20+ zaposlenih) obstoječega seznama je 6,3 mio EUR, prihodek na
   * zaposlenega 173.000 EUR (raziskava, list Naslovnica) — pade v tretji pas.
   * Sredine so geometrijske. KALIBRACIJA: preveriti po prvih ~50 vnosih.
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
