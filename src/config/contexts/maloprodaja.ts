import { ADMIN_HOUR_BANDS } from './shared';
import type { CostBand, SegmentContext } from './contextTypes';

/**
 * Ura v poslovalnici je bistveno cenejša od proizvodne, zato ima svoje razpone.
 * Če bi maloprodaja podedovala proizvodne, bi vsak kapacitetni znesek pretiraval
 * za faktor dve — in prav pretiravanje je tisto, kar direktor najprej opazi.
 */
const SHOP_HOUR_BANDS: CostBand[] = [
  { id: 'do18', label: 'Do 18 EUR', midpointEUR: 15 },
  { id: '18do25', label: '18–25 EUR', midpointEUR: 21 },
  { id: '25do32', label: '25–32 EUR', midpointEUR: 28 },
  { id: 'nad32', label: 'Več kot 32 EUR', midpointEUR: 38 },
];

export const MALOPRODAJA_CONTEXT: SegmentContext = {
  title: 'Nekaj o vaši maloprodaji',
  intro:
    'Tri vprašanja, ki ne sprašujejo po številkah. Iz njih izpeljemo, koliko od izmerjenega stroška je realno mogoče nasloviti — trgovec, ki ima blagajno že povezano z zalogami, je lažje izboljšave namreč večinoma že pobral.',
  costBasisIntro:
    'Dve številki, ki veljata za vsa področja. Polni strošek pomeni bruto plačo z vsemi prispevki in režijo, ne neto izplačila.',

  businessType: {
    legend: 'Kako pretežno prodajate?',
    options: [
      { id: 'enaPoslovalnica', label: 'Ena poslovalnica' },
      { id: 'vecPoslovalnic', label: 'Več poslovalnic' },
      { id: 'poslovalniceInSplet', label: 'Poslovalnice in spletna trgovina' },
      { id: 'samoSplet', label: 'Samo spletna trgovina' },
      { id: 'maloInVeleprodaja', label: 'Maloprodaja in veleprodaja' },
    ],
  },

  /**
   * Ločnica, ki v maloprodaji največ pojasni, ni "imamo ERP", ampak "ali blagajna
   * ve, kaj je na zalogi". Blagajna brez te povezave ima zato širši pas izboljšave
   * kot podjetje z drugim, a povezanim sistemom.
   */
  currentSystem: {
    legend: 'Kako danes vodite maloprodajo?',
    options: [
      {
        id: 'pantheonRetail',
        label: 'PANTHEON z maloprodajnim modulom (POS)',
        band: { min: 0.08, max: 0.2 },
        isPantheon: true,
      },
      {
        id: 'pantheonNoRetail',
        label: 'PANTHEON brez maloprodajnega modula',
        band: { min: 0.15, max: 0.3 },
        isPantheon: true,
      },
      { id: 'otherRetailSystem', label: 'Drug maloprodajni sistem, povezan z zalogami', band: { min: 0.15, max: 0.3 } },
      { id: 'posNoStockLink', label: 'Blagajna, ki ni povezana z zalogami', band: { min: 0.25, max: 0.4 } },
      { id: 'excelPaper', label: 'Večinoma Excel, papir ali sprotni dogovor', band: { min: 0.25, max: 0.4 } },
    ],
  },

  role: {
    legend: 'Kakšna je vaša vloga?',
    options: [
      { id: 'direktor', label: 'Direktor/-ica' },
      { id: 'vodjaTrgovine', label: 'Vodja trgovine ali poslovalnice' },
      { id: 'nabava', label: 'Nabava ali kategorijski vodja' },
      { id: 'finance', label: 'Finance ali računovodstvo' },
      { id: 'drugo', label: 'Drugo' },
    ],
  },

  operationalHour: {
    label: 'Približen polni strošek ure v poslovalnici ali skladišču',
    help: 'Prodajalec, blagajnik, skladiščnik — kdor dela z blagom in kupci.',
    bands: SHOP_HOUR_BANDS,
    fallbackEUR: 24,
  },

  adminHour: {
    label: 'Približen polni strošek administrativne oziroma vodstvene ure',
    help: 'Vodja poslovalnice, nabava, kategorijski vodja, priprava cen in akcij.',
    bands: ADMIN_HOUR_BANDS,
    fallbackEUR: 32,
  },
};
