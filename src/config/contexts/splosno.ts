import { ADMIN_HOUR_BANDS } from './shared';
import type { CostBand, SegmentContext } from './contextTypes';

/**
 * Neposredna ura v neznani dejavnosti: nekje operater, drugje monter, tehnik ali
 * terenski delavec. Razponi so zato širši od proizvodnih in nižje zasidrani —
 * privzetek naj raje podceni kot preceni, ker podjetja ne poznamo.
 */
const OPERATIONAL_HOUR_BANDS: CostBand[] = [
  { id: 'do25', label: 'Do 25 EUR', midpointEUR: 21 },
  { id: '25do35', label: '25–35 EUR', midpointEUR: 30 },
  { id: '35do50', label: '35–50 EUR', midpointEUR: 42 },
  { id: 'nad50', label: 'Več kot 50 EUR', midpointEUR: 58 },
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
  title: 'Nekaj o vašem podjetju',
  intro:
    'Tri vprašanja, ki ne sprašujejo po številkah. Ker vaše dejavnosti nismo mogli natančneje opredeliti, so naslednja vprašanja splošna — izračun bo zato bolj zadržan kot pri panožno prilagojenem vprašalniku.',
  costBasisIntro:
    'Dve številki, ki veljata za vsa področja. Polni strošek pomeni bruto plačo z vsemi prispevki in režijo, ne neto izplačila.',

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
        band: { min: 0.08, max: 0.18 },
        isPantheon: true,
      },
      {
        id: 'pantheonDelno',
        label: 'PANTHEON ob veliko Excela',
        band: { min: 0.12, max: 0.25 },
        isPantheon: true,
      },
      { id: 'otherErp', label: 'Drug ERP ali poslovni program', band: { min: 0.12, max: 0.25 } },
      {
        id: 'erpExcelPaper',
        label: 'Kombinacija programa, Excela in papirja',
        band: { min: 0.2, max: 0.35 },
      },
      { id: 'excelPaper', label: 'Večinoma Excel, papir ali sprotni dogovor', band: { min: 0.2, max: 0.35 } },
    ],
  },

  role: {
    legend: 'Kakšna je vaša vloga?',
    options: [
      { id: 'direktor', label: 'Direktor/-ica' },
      { id: 'lastnik', label: 'Lastnik/-ica' },
      { id: 'finance', label: 'Finance ali računovodstvo' },
      { id: 'vodjaOddelka', label: 'Vodja oddelka' },
      { id: 'drugo', label: 'Drugo' },
    ],
  },

  operationalHour: {
    label: 'Približen polni strošek neposredne ure',
    help: 'Kdor dela na izdelku, blagu ali pri stranki — ne pisarniško oziroma vodstveno delo.',
    bands: OPERATIONAL_HOUR_BANDS,
    fallbackEUR: 30,
  },

  adminHour: {
    label: 'Približen polni strošek administrativne oziroma vodstvene ure',
    help: 'Uprava, finance, nabava, prodaja, priprava dela.',
    bands: ADMIN_HOUR_BANDS,
    fallbackEUR: 35,
  },
};
