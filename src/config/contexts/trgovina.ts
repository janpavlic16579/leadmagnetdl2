import {
  ADMIN_HOUR_BANDS,
  ADMIN_HOUR_EXPLAINER,
  ANNUAL_REVENUE_EXPLAINER,
  CAPITAL_COST_EXPLAINER,
  CONTRIBUTION_MARGIN_EXPLAINER,
  HOURLY_COST_EXPLAINER,
} from './shared';
import type { CostBand, SegmentContext } from './contextTypes';

/**
 * Ura komisionarja je cenejša od proizvodne in dražja od ure v poslovalnici.
 * Če bi veleprodaja podedovala proizvodne razpone, bi vsak kapacitetni znesek
 * pretiraval — in prav pretiravanje je tisto, kar skeptičen direktor najprej opazi
 * in zaradi česar zavrne cel izračun.
 *
 * Sidro 2026 (SURS, zasebni sektor, oktober 2025, prevrednoteno): preprosta
 * skladiščna dela 19,9 EUR/h, prekladalna dela 20,0, skladiščnik in komisionar 20,8;
 * panožno povprečje trgovine na debelo (G46) 25,8 — a to je povprečje cele panoge z
 * vodstvom, ne skladiščne ure. Vprašanje voznika ne omenja, zato sidro ni voznikovo.
 * Enak nabor kot v logistiki — isti poklici, ista kalibracija.
 * Izpeljava in viri: docs/urne-postavke.md.
 */
const WHOLESALE_HOUR_BANDS: CostBand[] = [
  { id: 'do17', label: 'Do 17 EUR', midpointEUR: 16, minEUR: 15, maxEUR: 17 },
  { id: '17do19', label: '17–19 EUR', midpointEUR: 18, minEUR: 17, maxEUR: 19 },
  { id: '19do23', label: '19–23 EUR', midpointEUR: 21, minEUR: 19, maxEUR: 23 },
  { id: 'nad23', label: 'Več kot 23 EUR', midpointEUR: 26, minEUR: 23, maxEUR: 30 },
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
        gap: { min: 0.08, max: 0.2 },
        isPantheon: true,
      },
      {
        id: 'pantheonNoWms',
        label: 'PANTHEON brez vodenja skladiščnih lokacij',
        gap: { min: 0.15, max: 0.3 },
        isPantheon: true,
      },
      { id: 'otherErp', label: 'Drug ERP, povezan s skladiščem', gap: { min: 0.15, max: 0.3 } },
      { id: 'erpExcelPaper', label: 'Kombinacija ERP-ja, Excela in papirja', gap: { min: 0.25, max: 0.4 } },
      { id: 'excelPaper', label: 'Večinoma Excel, papir ali sprotni dogovor', gap: { min: 0.25, max: 0.4 } },
    ],
  },

  role: {
    legend: 'Kakšna je vaša vloga?',
    options: [
      { id: 'direktor', label: 'Direktor/-ica' },
      { id: 'vodjaProdaje', label: 'Vodja prodaje ali komerciale' },
      { id: 'vodjaSkladisca', label: 'Vodja skladišča ali logistike' },
      { id: 'finance', label: 'Finance ali računovodstvo' },
      { id: 'drugo', label: 'Drugo', freeText: true },
    ],
  },

  operationalHour: {
    label: 'Približen polni strošek ure v skladišču',
    help: 'Skladiščnik, komisionar, viličarist — kdor blago dejansko premakne.',
    explainer: HOURLY_COST_EXPLAINER,
    bands: WHOLESALE_HOUR_BANDS,
    fallbackEUR: 20,
  },

  adminHour: {
    label: 'Približen polni strošek administrativne oziroma vodstvene ure',
    help: 'Komercialist, vodja prodaje, nabava, finance, reklamacije.',
    explainer: ADMIN_HOUR_EXPLAINER,
    bands: ADMIN_HOUR_BANDS,
    fallbackEUR: 26,
  },

  /**
   * Prihodek je doslej spraševalo področje Terjatve — kdor ga v triaži ni izbral,
   * je ostal brez osnove. KALIBRACIJA: sredine so geometrijske, preveriti po ~50 vnosih.
   */
  annualRevenue: {
    label: 'Letni prihodki od prodaje blaga',
    help: 'Neto, brez DDV. Če razpona ne izberete, postavk, vezanih na prihodek (npr. strošek plačilnih zamud), ne bomo ocenili — prihodka si ne izmišljamo.',
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
    help: 'Kar od prodajne cene ostane po nabavni vrednosti in neposrednih stroških (prevoz, provizije). Ni pribitek na nabavno ceno.',
    explainer: CONTRIBUTION_MARGIN_EXPLAINER,
    /**
     * Umerjeno na izmerjeno bruto maržo na blago (Eurostat SBS, SI, 2021–2023),
     * brez podrazreda posredništva, ki kot prihodek knjiži provizijo in ne
     * vrednosti blaga. Po blagovnih skupinah 2023: IKT 17,3 %, kmetijske surovine
     * 18,7 %, druga specializirana 18,9 %, živila 19,1 %, izdelki široke porabe
     * 25,6 %, stroji in naprave 29,6 %, nespecializirana 31,1 %.
     *
     * Prejšnji pasovi so bili prazni na dnu (nič ni pod 15 %) in previsoki v
     * sredini. Izpeljava: docs/prispevne-marze-raziskava-2026-08.md
     */
    bands: [
      { id: 'do12', label: 'Do 12 %', midpoint: 0.09, min: 0.05, max: 0.12 },
      { id: '12do18', label: '12–18 %', midpoint: 0.15, min: 0.12, max: 0.18 },
      { id: '18do26', label: '18–26 %', midpoint: 0.22, min: 0.18, max: 0.26 },
      { id: 'nad26', label: 'Več kot 26 %', midpoint: 0.32, min: 0.26, max: 0.4 },
    ],
    // Sidro 2026: bruto marža na blago 22,9 % (povprečje 2021–2023, brez
    // posredništva), manj pribl. 2 o. t. za prevoz do kupca in provizije.
    fallback: 0.21,
    unit: '%',
    asPercent: true,
  },
  /**
   * KALIBRACIJA: dosedanja konstanta 6 % (modules/shared.ts) je privzetek ob
   * praznem vnosu; legacy modul je spraševal z 10 %. Sredine pasov se namenoma
   * ne ujemajo s privzetkom, da "ni odgovora" ostane razpoznavno stanje.
   */
  capitalCostRate: {
    label: 'Letni strošek financiranja obratnega kapitala',
    help: 'Obrestna mera posojila oziroma donos, ki bi ga denar prinesel drugje. Množi denar, vezan v terjatvah in zalogah.',
    explainer: CAPITAL_COST_EXPLAINER,
    bands: [
      { id: 'do5', label: 'Do 5 %', midpoint: 0.04, min: 0.03, max: 0.05 },
      { id: '5do8', label: '5–8 %', midpoint: 0.065, min: 0.05, max: 0.08 },
      { id: '8do12', label: '8–12 %', midpoint: 0.1, min: 0.08, max: 0.12 },
      { id: 'nad12', label: 'Več kot 12 %', midpoint: 0.15, min: 0.12, max: 0.18 },
    ],
    fallback: 0.06,
    unit: '%',
    asPercent: true,
  },
};
