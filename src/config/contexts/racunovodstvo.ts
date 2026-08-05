import { ADMIN_HOUR_BANDS } from './shared';
import type { CostBand, SegmentContext } from './contextTypes';

/**
 * Referent oziroma knjigovodja je cenejša ura od operaterja na stroju, zato
 * računovodstvo ne sme podedovati proizvodnih razponov: privzeta sredina 45 EUR
 * bi pri isti vneseni uri prikazala skoraj dvakrat previsok znesek.
 */
const OPERATIONAL_HOUR_BANDS: CostBand[] = [
  { id: 'do20', label: 'Do 20 EUR', midpointEUR: 17 },
  { id: '20do28', label: '20–28 EUR', midpointEUR: 24 },
  { id: '28do36', label: '28–36 EUR', midpointEUR: 32 },
  { id: 'nad36', label: 'Več kot 36 EUR', midpointEUR: 42 },
];

/**
 * Kontekst računovodskega servisa.
 *
 * Servis se od drugih dejavnosti loči po tem, da je njegova zaloga čas, njegov
 * material pa dokument, ki ga prinese nekdo drug. Zato prvo vprašanje meri
 * strukturo strank in ne načina "proizvodnje": servis dvajsetih mikro s.p.-jev
 * in servis petih srednjih podjetij imata ob enakem številu ur povsem drugačno
 * strukturo dela — prvi ima veliko drobnih dokumentov in malo obračunov, drugi
 * obratno.
 *
 * Odgovori ne vstopajo v nobeno formulo posameznega modula. Sedanji sistem
 * določa pas realistične izboljšave in ali so tehnična opozorila (SQL Server,
 * Windows Server, ZIERDED) za tega obiskovalca sploh smiselna.
 *
 * PANTHEON: možnost z najnižjim pasom opisuje servis, ki samodejni zajem listin
 * in izmenjavo dokumentov s strankami že uporablja — ne trdi, da tak zajem
 * prinaša šele PANTHEON. Meja je stanje procesa pri obiskovalcu, ne blagovna
 * znamka; obratna trditev bi presegala objavljeni slovenski cenik.
 */
export const RACUNOVODSTVO_CONTEXT: SegmentContext = {
  title: 'Nekaj o vašem servisu',
  intro:
    'Tri vprašanja, ki ne sprašujejo po številkah. Iz njih izpeljemo, koliko od izmerjenega stroška je realno mogoče nasloviti — servis, ki listine že zajema samodejno, je lažje izboljšave namreč večinoma že pobral.',
  costBasisIntro:
    'Dve številki, ki veljata za vsa področja. Polni strošek pomeni bruto plačo z vsemi prispevki in režijo, ne neto izplačila — in ne cene, ki jo za uro zaračunate stranki.',

  businessType: {
    legend: 'Kakšna je pretežna struktura vaših strank?',
    options: [
      { id: 'mikro', label: 'Pretežno s.p. in mikro podjetja' },
      { id: 'malaSrednja', label: 'Pretežno mala in srednja podjetja' },
      { id: 'mesano', label: 'Mešano' },
      { id: 'panozno', label: 'Specializirano za posamezno panogo' },
      { id: 'svetovanje', label: 'Poleg računovodstva tudi davčno in poslovno svetovanje' },
    ],
  },

  currentSystem: {
    legend: 'Kako danes vodite servis?',
    options: [
      {
        id: 'pantheonZajem',
        label: 'PANTHEON s samodejnim zajemom listin in izmenjavo dokumentov',
        band: { min: 0.08, max: 0.2 },
        isPantheon: true,
      },
      {
        id: 'pantheonRocno',
        label: 'PANTHEON, listine vnašamo ročno',
        band: { min: 0.15, max: 0.3 },
        isPantheon: true,
      },
      { id: 'drugProgram', label: 'Drug računovodski program', band: { min: 0.15, max: 0.3 } },
      {
        id: 'programExcel',
        label: 'Kombinacija programa, Excela in papirja',
        band: { min: 0.25, max: 0.4 },
      },
      { id: 'rocno', label: 'Večinoma ročno, Excel in papir', band: { min: 0.25, max: 0.4 } },
    ],
  },

  role: {
    legend: 'Kakšna je vaša vloga?',
    options: [
      { id: 'lastnik', label: 'Lastnik/-ica ali direktor/-ica servisa' },
      { id: 'vodjaRacunovodstva', label: 'Vodja računovodstva' },
      { id: 'racunovodja', label: 'Računovodja ali referent/-ka' },
      { id: 'davcni', label: 'Davčni svetovalec' },
      { id: 'drugo', label: 'Drugo' },
    ],
  },

  operationalHour: {
    label: 'Približen polni strošek računovodske ure',
    help: 'Računovodja, referent, knjigovodja — kdor obdeluje listine stranke.',
    bands: OPERATIONAL_HOUR_BANDS,
    fallbackEUR: 26,
  },

  adminHour: {
    label: 'Približen polni strošek vodstvene oziroma strokovne ure',
    help: 'Vodja računovodstva, davčni svetovalec, pregled in podpis pred oddajo.',
    bands: ADMIN_HOUR_BANDS,
    // Višje od proizvodne administrativne ure: podpis pod obračun nosi odgovornost,
    // ki je referent ne more prevzeti, zato ta ura ni zamenljiva z operativno.
    fallbackEUR: 38,
  },
};
