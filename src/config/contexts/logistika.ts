import { ADMIN_HOUR_BANDS } from './shared';
import type { CostBand, SegmentContext } from './contextTypes';

/**
 * Voznik in skladiščnik sta cenejša ura od operaterja na stroju, zato logistika
 * ne sme podedovati proizvodnih razponov: privzeta sredina 45 EUR bi pri isti
 * vneseni uri prikazala skoraj dvakrat previsok znesek. To je edini razlog za
 * lasten nabor — vprašanje je isto, kalibracija ni.
 */
const OPERATIONAL_HOUR_BANDS: CostBand[] = [
  { id: 'do20', label: 'Do 20 EUR', midpointEUR: 17 },
  { id: '20do28', label: '20–28 EUR', midpointEUR: 24 },
  { id: '28do38', label: '28–38 EUR', midpointEUR: 33 },
  { id: 'nad38', label: 'Več kot 38 EUR', midpointEUR: 45 },
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
    'Dve številki, ki veljata za vsa področja. Polni strošek pomeni bruto plačo z vsemi prispevki in režijo, ne neto izplačila.',

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
      { id: 'drugo', label: 'Drugo' },
    ],
  },

  operationalHour: {
    label: 'Približen polni strošek operativne ure',
    help: 'Voznik, skladiščnik, komisionar — kdor pošiljko dejansko premakne.',
    bands: OPERATIONAL_HOUR_BANDS,
    fallbackEUR: 28,
  },

  adminHour: {
    label: 'Približen polni strošek administrativne oziroma vodstvene ure',
    help: 'Disponent, prodaja, prevozna dokumentacija, vodja logistike.',
    bands: ADMIN_HOUR_BANDS,
    fallbackEUR: 32,
  },
};
