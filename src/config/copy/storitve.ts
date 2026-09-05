import type { SegmentCopy } from './copyTypes';

export const STORITVE_COPY: SegmentCopy = {
  id: 'storitve',
  displayName: 'Storitve in projekti',

  landing: {
    heroTitle: 'Koliko dela letno opravite in ne zaračunate?',
    // Storitveno podjetje nima materiala ne zaloge: izguba je skoraj v celoti v
    // urah, ki so bile odslužene in nikoli spremenjene v prihodek.
    heroSubtitle:
      'Ure brez evidence, tiho širjenje obsega, brezplačne dodelave in računi, plačani po roku. Vsaka od teh postavk je delo, ki ste ga opravili in zanj niste dobili plačila.',
  },

  context: {
    title: 'Nekaj o vašem delu z naročniki',
    intro:
      'Tri vprašanja, ki ne sprašujejo po številkah. Iz njih izvemo, kako danes delate — to nam pove, o čem se je smiselno pogovoriti, in nam pomaga razumeti, zakaj stroški sploh nastajajo. V izračun zneskov ta odgovor ne vstopa.',
  },

  triage: {
    title: 'Kje pri delu z naročniki vas najbolj tišči?',
    intro:
      'Na hitro ocenite vsako področje — od zasedenosti ekipe in evidence dela do obsega, administracije in plačil. Podrobna vprašanja zastavimo samo za največje težave, zato vprašalnik ostane kratek, izračun pa vezan na vaše projekte.',
  },

  costBasis: {
    intro:
      'Pet številk, ki veljajo za vsa področja. Polni strošek pomeni bruto plačo s prispevki delodajalca ter regresom, malico in prevozom — ne neto izplačila in ne režije; zaračunana postavka pa je to, kar za uro dela v povprečju zaračunate naročniku. Prihodek in maržo vprašamo enkrat — sta lastnost podjetja, ne posameznega področja.',
  },

  results: {
    headline: 'Toliko vas stane delo, ki ni zaračunano',
  },

  figures: {
    directLoss: {
      note: 'Denar, ki dejansko odteka: nezaračunane ure, dobropisi, odpisi ob obračunu, kazni in izgubljena marža.',
    },
  },

  emailGate: {
    title: 'Rezultat in PDF poročilo s tremi ukrepi za vaše projekte',
    subtitle:
      'Po oddaji se na zaslonu odpre vaš izračun in z njim PDF poročilo za upravo ali lastnika — razčlenjeno po področjih, s formulo pod vsako postavko in tremi ukrepi, ki jih je pri vodenju projektov mogoče začeti ta teden.',
  },

  pdf: { documentTitle: 'Analiza nezaračunanega dela in skritih stroškov' },
};
