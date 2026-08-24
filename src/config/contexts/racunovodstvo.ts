import {
  ADMIN_HOUR_BANDS,
  ADMIN_HOUR_EXPLAINER,
  ANNUAL_REVENUE_EXPLAINER,
  CONTRIBUTION_MARGIN_EXPLAINER,
  HOURLY_COST_EXPLAINER,
} from './shared';
import type { CostBand, SegmentContext } from './contextTypes';

/**
 * Referent oziroma knjigovodja je DRAŽJA ura od operaterja na stroju — ne cenejša,
 * kot je trdil prejšnji komentar. Knjigovodja je v Sloveniji plačan približno na
 * ravni povprečja vseh zaposlenih, operater pa pod njim.
 *
 * Sidro 2026 (SURS, zasebni sektor, oktober 2025, prevrednoteno): računovodski
 * uradnik 25,4 EUR/h, knjigovodja 25,7, strokovnjak za računovodstvo in revizijo
 * 34,4 (ta je sidro vodstvene ure); panožno povprečje računovodskih dejavnosti
 * (N69.20) 23,6, strokovnih dejavnosti 26,9.
 * Izpeljava in viri: docs/urne-postavke.md.
 */
const OPERATIONAL_HOUR_BANDS: CostBand[] = [
  { id: 'do19', label: 'Do 19 EUR', midpointEUR: 17, minEUR: 15, maxEUR: 19 },
  { id: '19do24', label: '19–24 EUR', midpointEUR: 22, minEUR: 19, maxEUR: 24 },
  { id: '24do30', label: '24–30 EUR', midpointEUR: 27, minEUR: 24, maxEUR: 30 },
  { id: 'nad30', label: 'Več kot 30 EUR', midpointEUR: 35, minEUR: 30, maxEUR: 40 },
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
    'Štiri številke, ki veljajo za vsa področja. Polni strošek pomeni bruto plačo s prispevki delodajalca ter regresom, malico in prevozom — ne neto izplačila, ne režije in ne cene, ki jo za uro zaračunate stranki. Prihodek in maržo vprašamo enkrat — sta lastnost servisa, ne posameznega področja.',

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
      { id: 'drugo', label: 'Drugo', freeText: true },
    ],
  },

  operationalHour: {
    label: 'Približen polni strošek računovodske ure',
    help: 'Računovodja, referent, knjigovodja — kdor obdeluje listine stranke.',
    explainer: HOURLY_COST_EXPLAINER,
    bands: OPERATIONAL_HOUR_BANDS,
    fallbackEUR: 25,
  },

  adminHour: {
    label: 'Približen polni strošek vodstvene oziroma strokovne ure',
    help: 'Vodja računovodstva, davčni svetovalec, pregled in podpis pred oddajo.',
    explainer: ADMIN_HOUR_EXPLAINER,
    bands: ADMIN_HOUR_BANDS,
    // Višje od administrativne ure v drugih dejavnostih: podpis pod obračun nosi
    // odgovornost, ki je referent ne more prevzeti, zato ta ura ni zamenljiva z
    // operativno. Sidro 2026: računovodski strokovnjak 34,8 EUR/h.
    fallbackEUR: 33,
  },

  /** KALIBRACIJA: sredine so geometrijske, preveriti po prvih ~50 vnosih. */
  annualRevenue: {
    label: 'Letni prihodki servisa',
    help: 'Neto, brez DDV. Če razpona ne izberete, postavk, vezanih na prihodek, ne bomo ocenili — prihodka si ne izmišljamo.',
    explainer: ANNUAL_REVENUE_EXPLAINER,
    bands: [
      { id: 'do03mio', label: 'Do 0,3 mio EUR', midpoint: 200_000, min: 100_000, max: 300_000 },
      { id: '03do1mio', label: '0,3–1 mio EUR', midpoint: 600_000, min: 300_000, max: 1_000_000 },
      { id: '1do3mio', label: '1–3 mio EUR', midpoint: 1_800_000, min: 1_000_000, max: 3_000_000 },
      { id: 'nad3mio', label: 'Več kot 3 mio EUR', midpoint: 5_000_000, min: 3_000_000, max: 7_000_000 },
    ],
    fallback: 0,
    unit: 'EUR/leto',
  },

  contributionMargin: {
    label: 'Povprečna prispevna marža',
    help: 'Kar od zaračunanega ostane po neposrednih stroških izvedbe (plače na strankah, licence, zunanji sodelavci).',
    explainer: CONTRIBUTION_MARGIN_EXPLAINER,
    bands: [
      { id: 'do30', label: 'Do 30 %', midpoint: 0.25, min: 0.2, max: 0.3 },
      { id: '30do50', label: '30–50 %', midpoint: 0.4, min: 0.3, max: 0.5 },
      { id: '50do70', label: '50–70 %', midpoint: 0.6, min: 0.5, max: 0.7 },
      { id: 'nad70', label: 'Več kot 70 %', midpoint: 0.78, min: 0.7, max: 0.86 },
    ],
    // Ne 0,25: to je sredina pasu "Do 30 %", zato bi bil radio označen že ob prvem
    // izrisu in "ni odgovora" bi se prikazalo kot izbran razpon.
    fallback: 0.3,
    unit: '%',
    asPercent: true,
  },
};
