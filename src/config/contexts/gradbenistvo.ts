import {
  ADMIN_HOUR_BANDS,
  ADMIN_HOUR_EXPLAINER,
  ANNUAL_REVENUE_EXPLAINER,
  CAPITAL_COST_EXPLAINER,
  HOURLY_COST_EXPLAINER,
} from './shared';
import type { CostBand, SegmentContext } from './contextTypes';

/**
 * Ura delavca na gradbišču.
 *
 * KALIBRACIJA — sidro je posredno. SURS v strukturni statistiki plač (0711360S)
 * zidarja, tesarja in strojnika (SKP 7112, 7115, 8342) v zapisniku
 * docs/urne-postavke.md še nima; nabor je zato prevzet od proizvodne operativne
 * ure, ki ima isto dno (15,07 EUR/h — minimalna plača, pod katero v gradbeništvu
 * leži spodnji kvartil) in isti red velikosti. Zgornja meja panoge je izmerjena:
 * Eurostat lc_lci_lev daje za gradbeništvo (F) 25,4 EUR/h strošek dela na
 * opravljeno uro (2025) — a to je povprečje cele panoge z inženirji in vodstvom,
 * zato za delavca velja kot strop, ne kot sredina. Rast stroškov dela v panogi je
 * nad 7 % letno (raziskava panoge, list Trzni_benchmarki). Preveriti po prvih
 * ~50 vnosih in ob naslednji objavi SURS.
 */
const SITE_HOUR_BANDS: CostBand[] = [
  { id: 'do17', label: 'Do 17 EUR', midpointEUR: 16, minEUR: 15, maxEUR: 17 },
  { id: '17do20', label: '17–20 EUR', midpointEUR: 18, minEUR: 17, maxEUR: 20 },
  { id: '20do25', label: '20–25 EUR', midpointEUR: 22, minEUR: 20, maxEUR: 25 },
  { id: 'nad25', label: 'Več kot 25 EUR', midpointEUR: 29, minEUR: 25, maxEUR: 33 },
];

/**
 * Kontekst gradbenega podjetja.
 *
 * Prvo vprašanje sprašuje po vrsti del in ne po načinu dela kot v storitvah:
 * gradnja stavb, inženirski objekti in specializirana dela (SKD F41–F43) imajo
 * iste situacije in iste zadržke, a drugačen delež podizvajalcev in mehanizacije
 * (raziskava panoge, list Segmenti S1–S6). Vprašanje o sedanjem sistemu je
 * dobesedno vprašanje Q7 z lista Kalkulator: "kje danes vodite evidenco pogodb,
 * situacij in ur" — raziskava ga vodi kot kvalifikacijo, ali posel sploh obstaja.
 *
 * Skupna finančna osnova ima ŠTIRI številke, ne pet: zaračunane postavke ni
 * (gradbinec ne prodaja ur — v evre gre situacija po popisu), prispevne marže pa
 * ne bere noben modul segmenta (izgubljena marža je vprašana kot znesek, ker
 * raziskava svetuje "sprašuj po pogostosti, ne po odstotku"). Prihodek je vprašan
 * kot "letna vrednost izvedenih del", ker ga v tej obliki direktor pozna na pamet
 * (Kalkulator, Q2) in ker ga množi prekoračitev plačilnega roka; strošek
 * financiranja je vprašan iz istega razloga.
 */
export const GRADBENISTVO_CONTEXT: SegmentContext = {
  businessType: {
    legend: 'Kaj pretežno izvajate?',
    options: [
      { id: 'stavbe', label: 'Gradnja stavb (novogradnje in prenove)' },
      { id: 'inzenirskiObjekti', label: 'Inženirski objekti (ceste, infrastruktura, komunala)' },
      {
        id: 'specializiranaDela',
        label: 'Specializirana gradbena dela (instalacije, fasade, strehe, zaključna dela)',
      },
      { id: 'inzeniringNaKljuc', label: 'Inženiring in gradnja na ključ' },
      { id: 'kombinirano', label: 'Kombinirano' },
    ],
  },

  currentSystem: {
    legend: 'Kje danes vodite pogodbe, situacije in ure po projektih?',
    options: [
      {
        id: 'pantheonProjectCost',
        label: 'PANTHEON s projektnim stroškovnim mestom in evidenco ur',
        gap: { min: 0.08, max: 0.2 },
        isPantheon: true,
      },
      {
        id: 'pantheonNoProjects',
        label: 'PANTHEON brez projektnega spremljanja',
        gap: { min: 0.15, max: 0.3 },
        isPantheon: true,
      },
      {
        id: 'otherErpConstruction',
        label: 'Drug ERP ali gradbeni program za kalkulacije in situacije',
        gap: { min: 0.15, max: 0.3 },
      },
      // Arhetip A3 "Delni digitalizator" iz raziskave: računovodski program in
      // Excel za projekte — dva vira resnice.
      { id: 'erpExcel', label: 'Računovodski program in Excel za projekte', gap: { min: 0.25, max: 0.4 } },
      // Arhetipa A1 "Papirni pragmatik" in A2 "Excel obrtnik".
      {
        id: 'excelPaper',
        label: 'Večinoma Excel, gradbeni dnevnik na papirju in e-pošta',
        gap: { min: 0.25, max: 0.4 },
      },
    ],
  },

  role: {
    legend: 'Kakšna je vaša vloga?',
    options: [
      { id: 'direktor', label: 'Direktor/-ica' },
      { id: 'vodjaGradbisca', label: 'Vodja gradbišča ali projekta' },
      // Raziskava (list Vprasalnik) vodi pripravo dela in obračun kot lastni
      // personi: kalkulant pozna kalkulacijo in situacije, ne odloča pa o nakupu.
      // Zato lastna vloga in ne "Drugo" — v oceni ICP se ujame po predponi 'vodja'.
      { id: 'vodjaPripraveDela', label: 'Vodja priprave dela, kalkulacij ali obračuna' },
      { id: 'finance', label: 'Finance ali računovodstvo' },
      { id: 'drugo', label: 'Drugo', freeText: true },
    ],
  },

  operationalHour: {
    label: 'Približen polni strošek ure delavca na gradbišču',
    help: 'Zidar, tesar, monter, strojnik — kdor dela na gradbišču.',
    explainer: HOURLY_COST_EXPLAINER,
    bands: SITE_HOUR_BANDS,
    fallbackEUR: 21,
  },

  adminHour: {
    label: 'Približen polni strošek ure vodje gradbišča oziroma pisarne',
    help: 'Vodja gradbišča, priprava dela, kalkulant, obračun — kdor dela s podatki o projektu.',
    explainer: ADMIN_HOUR_EXPLAINER,
    bands: ADMIN_HOUR_BANDS,
    // 28 in ne 26 kot drugod: vodja gradbišča in kalkulant sta tehnik ali inženir,
    // ne pisarniški uradnik (20,9 EUR/h). Sidro 2026: tehnik 27,7, nadzornik 29,6,
    // panoga N71.12 inženiring 29,6 (docs/urne-postavke.md). Leži samo v pasu 25–31.
    fallbackEUR: 28,
  },

  /**
   * Pasovi pokrivajo ciljni razred 10–249 zaposlenih pri ~110–130 tisoč EUR
   * prihodka na zaposlenega (segment A raziskave: mediana 43 zaposlenih, razpon
   * 21–263; list Predpostavke A15 uporablja 3, 6 in 12 mio EUR). Sredine so
   * geometrijske. KALIBRACIJA: preveriti po prvih ~50 vnosih.
   */
  annualRevenue: {
    label: 'Letna vrednost izvedenih del',
    help: 'Prihodki od prodaje, neto, brez DDV. Če razpona ne izberete, denarja v prekoračenih plačilnih rokih ne bomo ocenili — prihodka si ne izmišljamo.',
    explainer: ANNUAL_REVENUE_EXPLAINER,
    bands: [
      { id: 'do1mio', label: 'Do 1 mio EUR', midpoint: 600_000, min: 200_000, max: 1_000_000 },
      { id: '1do3mio', label: '1–3 mio EUR', midpoint: 1_800_000, min: 1_000_000, max: 3_000_000 },
      { id: '3do10mio', label: '3–10 mio EUR', midpoint: 5_500_000, min: 3_000_000, max: 10_000_000 },
      { id: 'nad10mio', label: 'Več kot 10 mio EUR', midpoint: 15_000_000, min: 10_000_000, max: 20_000_000 },
    ],
    fallback: 0,
    unit: 'EUR/leto',
  },

  /**
   * Vprašan, ker ga množi prekoračitev plačilnega roka (modul placila_gradbenistvo).
   * Pasovi in sidro so isti kot pri trgovini in logistiki — strošek financiranja je
   * lastnost kapitalskega trga in ne panoge. Izpeljava:
   * docs/erp-koristi-benchmarki-2026-08.md, razdelek B.
   */
  capitalCostRate: {
    label: 'Letni strošek financiranja obratnega kapitala',
    help: 'Obrestna mera posojila oziroma donos, ki bi ga denar prinesel drugje. Množi denar, vezan v prekoračenih plačilnih rokih naročnikov.',
    explainer: CAPITAL_COST_EXPLAINER,
    bands: [
      { id: 'do5', label: 'Do 5 %', midpoint: 0.04, min: 0.03, max: 0.05 },
      { id: '5do8', label: '5–8 %', midpoint: 0.065, min: 0.05, max: 0.08 },
      { id: '8do12', label: '8–12 %', midpoint: 0.1, min: 0.08, max: 0.12 },
      { id: 'nad12', label: 'Več kot 12 %', midpoint: 0.15, min: 0.12, max: 0.18 },
    ],
    fallback: 0.085,
    unit: '%',
    asPercent: true,
  },
};
