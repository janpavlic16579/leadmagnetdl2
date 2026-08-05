import { ADMIN_HOUR_BANDS } from './shared';
import type { CostBand, SegmentContext } from './contextTypes';

/**
 * Ura komisionarja je cenejša od proizvodne in dražja od ure v poslovalnici.
 * Če bi veleprodaja podedovala proizvodne razpone (sredina 45 EUR), bi vsak
 * kapacitetni znesek pretiraval za približno faktor dve — in prav pretiravanje je
 * tisto, kar skeptičen direktor najprej opazi in zaradi česar zavrne cel izračun.
 */
const WHOLESALE_HOUR_BANDS: CostBand[] = [
  { id: 'do20', label: 'Do 20 EUR', midpointEUR: 17 },
  { id: '20do28', label: '20–28 EUR', midpointEUR: 24 },
  { id: '28do38', label: '28–38 EUR', midpointEUR: 33 },
  { id: 'nad38', label: 'Več kot 38 EUR', midpointEUR: 45 },
];

/**
 * Kontekst veleprodajnega in distribucijskega podjetja.
 *
 * Maloprodaja ima od tu naprej svoj segment (config/contexts/maloprodaja.ts), zato
 * ta vprašalnik ne poskuša pokrivati police in blagajne. Veleprodajalec meri drugo:
 * pot od naročila do odpremljene pošiljke in denar, ki na tej poti obtiči.
 *
 * Ločnica, ki v veleprodaji največ pojasni, ni "imamo ERP", ampak ali sistem ve,
 * KJE v skladišču blago je. Podjetje z ERP-jem brez skladiščnega modela zato dobi
 * širši pas izboljšave kot podjetje z drugim, a s skladiščem povezanim sistemom.
 */
export const TRGOVINA_CONTEXT: SegmentContext = {
  title: 'Nekaj o vaši veleprodaji',
  intro:
    'Tri vprašanja, ki ne sprašujejo po številkah. Iz njih izpeljemo, koliko od izmerjenega stroška je realno mogoče nasloviti — podjetje, ki skladišče že vodi po lokacijah in s terminali, je lažje izboljšave namreč večinoma že pobralo.',
  costBasisIntro:
    'Dve številki, ki veljata za vsa področja. Polni strošek pomeni bruto plačo z vsemi prispevki in režijo, ne neto izplačila.',

  businessType: {
    legend: 'Kaj pretežno prodajate?',
    options: [
      { id: 'veleprodaja', label: 'Veleprodaja poslovnim kupcem' },
      { id: 'distribucija', label: 'Distribucija za blagovne znamke' },
      { id: 'uvozInVeleprodaja', label: 'Uvoz in veleprodaja' },
      { id: 'spletnaVeleprodaja', label: 'Veleprodaja prek spletnega portala ali EDI' },
      { id: 'kombinirano', label: 'Kombinirano' },
    ],
  },

  currentSystem: {
    legend: 'Kako danes vodite prodajo in skladišče?',
    options: [
      {
        id: 'pantheonWms',
        label: 'PANTHEON s skladiščnim modulom in lokacijami',
        band: { min: 0.08, max: 0.2 },
        isPantheon: true,
      },
      {
        id: 'pantheonNoWms',
        label: 'PANTHEON brez vodenja skladiščnih lokacij',
        band: { min: 0.15, max: 0.3 },
        isPantheon: true,
      },
      { id: 'otherErp', label: 'Drug ERP, povezan s skladiščem', band: { min: 0.15, max: 0.3 } },
      { id: 'erpExcelPaper', label: 'Kombinacija ERP-ja, Excela in papirja', band: { min: 0.25, max: 0.4 } },
      { id: 'excelPaper', label: 'Večinoma Excel, papir ali sprotni dogovor', band: { min: 0.25, max: 0.4 } },
    ],
  },

  role: {
    legend: 'Kakšna je vaša vloga?',
    options: [
      { id: 'direktor', label: 'Direktor/-ica' },
      { id: 'vodjaProdaje', label: 'Vodja prodaje ali komerciale' },
      { id: 'vodjaSkladisca', label: 'Vodja skladišča ali logistike' },
      { id: 'finance', label: 'Finance ali računovodstvo' },
      { id: 'drugo', label: 'Drugo' },
    ],
  },

  operationalHour: {
    label: 'Približen polni strošek ure v skladišču',
    help: 'Skladiščnik, komisionar, viličarist — kdor blago dejansko premakne.',
    bands: WHOLESALE_HOUR_BANDS,
    fallbackEUR: 24,
  },

  adminHour: {
    label: 'Približen polni strošek administrativne oziroma vodstvene ure',
    help: 'Komercialist, vodja prodaje, nabava, finance, reklamacije.',
    bands: ADMIN_HOUR_BANDS,
    fallbackEUR: 32,
  },
};
