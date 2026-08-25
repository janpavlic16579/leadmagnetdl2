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
 * Neposredna ura v neznani dejavnosti: nekje operater, drugje monter, tehnik ali
 * terenski delavec. Razponi so zato širši od proizvodnih in nižje zasidrani —
 * privzetek naj raje podceni kot preceni, ker podjetja ne poznamo.
 *
 * Sidro 2026 (SURS, zasebni sektor, oktober 2025, prevrednoteno): povprečje vseh
 * zaposlenih v zasebnem sektorju 24,5 EUR/h (z vodstvom, mediana 20,9), neposredno
 * delo pod njim — prodajalec 18,4, sestavljavec 18,5, operater 20,9, skladiščnik
 * 20,8, mehanik 25,0.
 * Izpeljava in viri: docs/urne-postavke.md.
 */
const OPERATIONAL_HOUR_BANDS: CostBand[] = [
  { id: 'do17', label: 'Do 17 EUR', midpointEUR: 16, minEUR: 15, maxEUR: 17 },
  { id: '17do19', label: '17–19 EUR', midpointEUR: 18, minEUR: 17, maxEUR: 19 },
  { id: '19do23', label: '19–23 EUR', midpointEUR: 21, minEUR: 19, maxEUR: 23 },
  { id: 'nad23', label: 'Več kot 23 EUR', midpointEUR: 26, minEUR: 23, maxEUR: 30 },
];

/**
 * Kontekst za podjetje, ki ne sodi v nobeno od specifičnih dejavnosti.
 *
 * Do sem pride le obiskovalec, ki je v prvem koraku izbral "Drugo" in nato
 * zavrnil vse štiri ponujene poslovne modele (glej config/industries.ts). To je
 * torej trdo jedro: holdingi, zavodi, mešana podjetja, posebnosti. Vprašanja so
 * zato edina v kalkulatorju, ki NE smejo predpostaviti, kaj podjetje počne.
 *
 * Prvo vprašanje ne usmerja več — obiskovalec je preusmeritev že zavrnil in
 * ponovno spraševanje bi delovalo, kot da mu nismo verjeli. Služi branju zapisa
 * v CRM: prodajnik mora vedeti, ali gre za proizvajalca, trgovca ali izvajalca
 * storitev, tudi kadar se sam ni prepoznal v nobeni od ponujenih dejavnosti.
 *
 * PASOVI IZBOLJŠAVE so namenoma OŽJI od specifičnih dejavnosti. Ne zato, ker bi
 * bilo pri teh podjetjih manj mogoče izboljšati, ampak ker univerzalna vprašanja
 * strošek zajamejo manj natančno: kjer ne vprašamo po izmetu, praznih kilometrih
 * ali nezaračunanih urah, je izmerjena osnova nujno nepopolna. Ožji pas je
 * poštena posledica tega, ne ocena podjetja.
 */
export const SPLOSNO_CONTEXT: SegmentContext = {
  businessType: {
    legend: 'Kaj najbolje opiše vaše poslovanje?',
    options: [
      { id: 'izdelki', label: 'Pretežno izdelki' },
      { id: 'blago', label: 'Pretežno blago' },
      { id: 'storitve', label: 'Pretežno storitve' },
      { id: 'kombinirano', label: 'Kombinirano' },
      { id: 'drugo', label: 'Nič od tega' },
    ],
  },

  currentSystem: {
    legend: 'Kako danes vodite poslovanje?',
    options: [
      {
        id: 'pantheonPoln',
        label: 'PANTHEON za večino procesov',
        gap: { min: 0.08, max: 0.18 },
        isPantheon: true,
      },
      {
        id: 'pantheonDelno',
        label: 'PANTHEON ob veliko Excela',
        gap: { min: 0.12, max: 0.25 },
        isPantheon: true,
      },
      { id: 'otherErp', label: 'Drug ERP ali poslovni program', gap: { min: 0.12, max: 0.25 } },
      {
        id: 'erpExcelPaper',
        label: 'Kombinacija programa, Excela in papirja',
        gap: { min: 0.2, max: 0.35 },
      },
      { id: 'excelPaper', label: 'Večinoma Excel, papir ali sprotni dogovor', gap: { min: 0.2, max: 0.35 } },
    ],
  },

  role: {
    legend: 'Kakšna je vaša vloga?',
    options: [
      { id: 'direktor', label: 'Direktor/-ica' },
      { id: 'lastnik', label: 'Lastnik/-ica' },
      { id: 'finance', label: 'Finance ali računovodstvo' },
      { id: 'vodjaOddelka', label: 'Vodja oddelka' },
      { id: 'drugo', label: 'Drugo', freeText: true },
    ],
  },

  operationalHour: {
    label: 'Približen polni strošek neposredne ure',
    help: 'Kdor dela na izdelku, blagu ali pri stranki — ne pisarniško oziroma vodstveno delo.',
    explainer: HOURLY_COST_EXPLAINER,
    bands: OPERATIONAL_HOUR_BANDS,
    fallbackEUR: 20,
  },

  adminHour: {
    label: 'Približen polni strošek administrativne oziroma vodstvene ure',
    help: 'Uprava, finance, nabava, prodaja, priprava dela.',
    explainer: ADMIN_HOUR_EXPLAINER,
    bands: ADMIN_HOUR_BANDS,
    fallbackEUR: 26,
  },

  /**
   * Prihodek je doslej spraševalo področje Terjatve — kdor ga v triaži ni izbral,
   * je ostal brez osnove. KALIBRACIJA: sredine so geometrijske, preveriti po ~50 vnosih.
   */
  annualRevenue: {
    label: 'Letni prihodki',
    help: 'Neto, brez DDV. Če razpona ne izberete, postavk, vezanih na prihodek (npr. strošek plačilnih zamud), ne bomo ocenili — prihodka si ne izmišljamo.',
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

  contributionMargin: {
    label: 'Povprečna prispevna marža',
    help: 'Kar od prodajne cene ostane po neposrednih stroških (material, blago ali izvedba).',
    explainer: CONTRIBUTION_MARGIN_EXPLAINER,
    bands: [
      { id: 'do15', label: 'Do 15 %', midpoint: 0.12, min: 0.09, max: 0.15 },
      { id: '15do25', label: '15–25 %', midpoint: 0.2, min: 0.15, max: 0.25 },
      { id: '25do35', label: '25–35 %', midpoint: 0.3, min: 0.25, max: 0.35 },
      { id: 'nad35', label: 'Več kot 35 %', midpoint: 0.42, min: 0.35, max: 0.49 },
    ],
    // Segment ni panoga in svoje statistike nima — je zbiralnik za podjetja, ki se
    // v triaži niso prepoznala. Sidro 2026 je zato sredina umerjenih dejavnosti:
    // nad proizvodnjo (26 %) in veleprodajo (21 %), pod storitvami (40 %). Dodana
    // vrednost celotnega gospodarstva (23,2 % pri MSP) tu ni prava mera, ker jo
    // navzdol vleče trgovina, ki ima lasten segment.
    // Izpeljava: docs/prispevne-marze-raziskava-2026-08.md
    fallback: 0.28,
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
