import {
  ADMIN_HOUR_BANDS,
  ADMIN_HOUR_EXPLAINER,
  ANNUAL_REVENUE_EXPLAINER,
  CAPITAL_COST_EXPLAINER,
  HOURLY_COST_EXPLAINER,
} from './shared';
import type { CostBand, SegmentContext } from './contextTypes';

/**
 * Kontekst inženiringa in izvedbe na ključ.
 *
 * Za razliko od storitev ta dejavnost NE vpraša zaračunane urne postavke:
 * raziskava panoge (Datalab_raziskava_INZENIRING_model.xlsx, list Naslovnica)
 * pravi, da sporočilo ne sme govoriti o urah projektantov, ampak o marži
 * projekta, fazah in opremi. Nezaračunano delo se zato vpraša v evrih
 * (config/modules/inzeniring.ts), ure pa se vrednotijo po strošku.
 *
 * Marže ta dejavnost NE vpraša: noben njen modul je ne uporablja, vprašanje brez
 * učinka na rezultat pa bi vprašalnik samo podaljšalo (isto načelo kot pri
 * živilstvu). Letna vrednost projektov in strošek financiranja SE vprašata, ker
 * ju bere modul obracun_inzeniring (denar, vezan v fazah brez računa) in ker
 * raziskava ICP meri po prihodku na zaposlenega.
 */

/**
 * Inženirska ura je dražja od proizvodne in za las dražja od storitvene izvedbene:
 * v košarici ni oblikovalca in programerja, so pa inženir, tehnik, nadzornik
 * (vodja montaže) in serviser. Sidro 2026 (SURS, zasebni sektor, oktober 2025,
 * prevrednoteno; docs/urne-postavke.md): tehnik za strojništvo 27,7, serviser 25,0,
 * nadzornik v predelovalnih dejavnostih 29,6, strokovnjak tehnično-tehnoloških
 * strok 32,0, inženir/tehnolog 33,2, inženir strojništva 35,8. Sredina košarice po
 * obeh poteh (povprečje in mediana) je 29,4 → privzetek 30. Ne več: povprečje
 * panoge N71.12 z vodstvom vred je 29,6 in je zgornja meja verjetnosti, ne sidro;
 * raziskava panoge (Predpostavke A04) računa z 32–45 EUR/h, a vključuje režijo,
 * ki je ta kalkulator namenoma ne šteje.
 *
 * Pasovi so isti kot pri storitvah, ker se košarici prekrivata v štirih od šestih
 * poklicev — drugačne meje bi pomenile razliko v besedah, ne v poklicih. Zgornji
 * pas je odrezan pri 46: nad tem ni več inženirska ura, ampak partner. Izpeljava
 * in viri: docs/urne-postavke.md.
 */
const ENGINEERING_HOUR_BANDS: CostBand[] = [
  { id: 'do22', label: 'Do 22 EUR', midpointEUR: 18, minEUR: 15, maxEUR: 22 },
  { id: '22do28', label: '22–28 EUR', midpointEUR: 25, minEUR: 22, maxEUR: 28 },
  { id: '28do35', label: '28–35 EUR', midpointEUR: 32, minEUR: 28, maxEUR: 35 },
  { id: 'nad35', label: 'Več kot 35 EUR', midpointEUR: 40, minEUR: 35, maxEUR: 46 },
];

export const INZENIRING_CONTEXT: SegmentContext = {
  /**
   * Segmenti iz raziskave (list Segmenti, S1–S6): projektantski biro in inženiring
   * brez izvedbe, izvedba na ključ v energetiki, izvedba na ključ v industriji,
   * inženiring s servisom, skupina povezanih družb. Prodajniku pove, ali gre
   * pogovor o urah (biro) ali o opremi in fazah (izvedba na ključ).
   */
  businessType: {
    legend: 'Kaj pretežno izvajate?',
    options: [
      { id: 'projektiranje', label: 'Projektiranje in inženiring brez lastne izvedbe' },
      { id: 'energetika', label: 'Izvedba na ključ — energetika in elektro sistemi' },
      { id: 'industrija', label: 'Izvedba na ključ — industrijski in procesni sistemi' },
      { id: 'servis', label: 'Inženiring z lastnim servisom in vzdrževanjem po prevzemu' },
      { id: 'kombinirano', label: 'Več od tega ali skupina povezanih družb' },
    ],
  },

  currentSystem: {
    legend: 'Kako danes vodite projekte, ure in opremo?',
    options: [
      {
        id: 'pantheonProjects',
        label: 'PANTHEON s projekti, evidenco ur in zalogo po projektu',
        gap: { min: 0.08, max: 0.2 },
        isPantheon: true,
      },
      {
        id: 'pantheonNoProjects',
        label: 'PANTHEON brez projektnega spremljanja',
        gap: { min: 0.15, max: 0.3 },
        isPantheon: true,
      },
      { id: 'otherErp', label: 'Drug ERP ali projektno orodje', gap: { min: 0.15, max: 0.3 } },
      {
        id: 'erpExcel',
        label: 'Računovodski program in projektni Excel',
        gap: { min: 0.25, max: 0.4 },
      },
      { id: 'excelPaper', label: 'Večinoma Excel, e-pošta in papir', gap: { min: 0.25, max: 0.4 } },
    ],
  },

  role: {
    legend: 'Kakšna je vaša vloga?',
    options: [
      { id: 'direktor', label: 'Direktor/-ica ali lastnik' },
      // Raziskava (H07) domneva, da je tehnični direktor pogosto močnejši prvi stik
      // kot direktor: oprema, faze in podizvajalci so njegovo področje. Zato lastna
      // vloga in ne "Drugo" — v oceni ICP se ujame po predponi 'vodja'.
      { id: 'vodjaTehnike', label: 'Tehnični direktor ali vodja tehnike' },
      { id: 'vodjaProjektov', label: 'Vodja projektov' },
      { id: 'finance', label: 'Finance ali računovodstvo' },
      { id: 'nabava', label: 'Nabava ali servis' },
      { id: 'drugo', label: 'Drugo', freeText: true },
    ],
  },

  operationalHour: {
    label: 'Približen polni strošek inženirske ure',
    help: 'Inženir, tehnik, vodja montaže, serviser — kdor dela na projektu ali na terenu.',
    explainer: HOURLY_COST_EXPLAINER,
    bands: ENGINEERING_HOUR_BANDS,
    fallbackEUR: 30,
  },

  adminHour: {
    label: 'Približen polni strošek administrativne oziroma vodstvene ure',
    help: 'Vodja projekta pri obračunu, nabava, priprava ponudb, računovodstvo.',
    explainer: ADMIN_HOUR_EXPLAINER,
    bands: ADMIN_HOUR_BANDS,
    fallbackEUR: 26,
  },

  /**
   * Razponi pokrivajo ciljni razred 10–130 zaposlenih. Mediana prihodkov v
   * segmentu A (20+ zaposlenih) obstoječega seznama je 6,7 mio EUR, prihodek na
   * zaposlenega 279.000 EUR — najvišji med petimi raziskanimi panogami, ker skozi
   * knjige teče oprema (raziskava, list Naslovnica). Sredine so geometrijske.
   * KALIBRACIJA: preveriti po prvih ~50 vnosih.
   */
  annualRevenue: {
    label: 'Letna vrednost izvedenih projektov',
    help: 'Neto, brez DDV — vključno z opremo in podizvajalci, ki gredo skozi vaše račune. Če razpona ne izberete, postavk, vezanih na prihodek, ne bomo ocenili — prihodka si ne izmišljamo.',
    explainer: ANNUAL_REVENUE_EXPLAINER,
    bands: [
      { id: 'do2mio', label: 'Do 2 mio EUR', midpoint: 1_200_000, min: 400_000, max: 2_000_000 },
      { id: '2do5mio', label: '2–5 mio EUR', midpoint: 3_200_000, min: 2_000_000, max: 5_000_000 },
      { id: '5do12mio', label: '5–12 mio EUR', midpoint: 8_000_000, min: 5_000_000, max: 12_000_000 },
      { id: 'nad12mio', label: 'Več kot 12 mio EUR', midpoint: 18_000_000, min: 12_000_000, max: 30_000_000 },
    ],
    fallback: 0,
    unit: 'EUR/leto',
  },

  /**
   * Vprašan, ker obracun_inzeniring meri denar, vezan v zaključenih fazah brez
   * računa. Brez njega bi znesek padel na privzetek in obiskovalec ne bi mogel
   * popraviti številke, ki ga množi.
   *
   * Pasovi in sidro so isti kot pri trgovini in logistiki — strošek financiranja
   * je lastnost kapitalskega trga in ne panoge. Izpeljava: docs/erp-koristi-benchmarki-2026-08.md, B.
   */
  capitalCostRate: {
    label: 'Letni strošek financiranja obratnega kapitala',
    help: 'Obrestna mera posojila oziroma donos, ki bi ga denar prinesel drugje. Množi denar, vezan v zaključenih fazah, ki še niso zaračunane.',
    explainer: CAPITAL_COST_EXPLAINER,
    bands: [
      { id: 'do5', label: 'Do 5 %', midpoint: 0.04, min: 0.03, max: 0.05 },
      { id: '5do8', label: '5–8 %', midpoint: 0.065, min: 0.05, max: 0.08 },
      { id: '8do12', label: '8–12 %', midpoint: 0.1, min: 0.08, max: 0.12 },
      { id: 'nad12', label: 'Več kot 12 %', midpoint: 0.15, min: 0.12, max: 0.18 },
    ],
    // Sidro 2026: povprečni WACC 8,5 % (KPMG Cost of Capital Study 2025). Ne 8 %:
    // ta se stika z mejo dveh pasov in bi povprečje panoge postavil na rob
    // prikazanega razpona.
    fallback: 0.085,
    unit: '%',
    asPercent: true,
  },
};
