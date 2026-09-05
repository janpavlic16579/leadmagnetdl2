import type { SegmentCopy } from './copyTypes';

export const LOGISTIKA_COPY: SegmentCopy = {
  id: 'logistika',
  displayName: 'Logistika in transport',

  landing: {
    heroTitle: 'Koliko vas letno stanejo nezaračunani dodatki in pozni računi?',
    // Naštete so postavke, ki jih merijo moduli te dejavnosti (obracun_logistika,
    // vozniki, terjatve_logistika, dokumentacija, napake, skladisce). Prazni
    // kilometri in stojnine so bili tu do avgusta 2026 — odšli so skupaj z
    // modulom, ki jih je meril: PANTHEON nima TMS in tega ne more znižati.
    heroSubtitle:
      'Čakanja, ki jih pozabite zaračunati, računi, ki čakajo na dokazilo, potni nalogi in dnevnice ter denar, ki predolgo stoji pri naročniku. Nobena od teh postavk nima svoje vrstice.',
  },

  context: {
    title: 'Nekaj o vaši logistiki',
    intro:
      'Tri vprašanja, ki ne sprašujejo po številkah. Iz njih izvemo, kako danes delate — to nam pove, o čem se je smiselno pogovoriti, in nam pomaga razumeti, zakaj stroški sploh nastajajo. V izračun zneskov ta odgovor ne vstopa.',
  },

  triage: {
    title: 'Kje v logistiki vas najbolj tišči?',
    intro:
      'Na hitro ocenite vsako področje — od obračuna prevozov in potnih nalogov do dokumentacije, reklamacij in skladišča. Podrobna vprašanja zastavimo samo za največje težave, zato vprašalnik ostane kratek, izračun pa vezan na vaše naročnike in vašo ekipo.',
  },

  costBasis: {
    intro:
      'Pet številk, ki veljajo za vsa področja. Polni strošek ure pomeni bruto plačo s prispevki delodajalca ter regresom, malico in prevozom — ne neto izplačila in ne režije. Prihodek, maržo in strošek financiranja vprašamo enkrat — so lastnost podjetja, ne posameznega področja.',
  },

  results: {
    headline: 'Toliko vas stane sedanji način dela v logistiki',
  },

  figures: {
    directLoss: {
      note: 'Denar, ki dejansko odteka: nezaračunani dodatki, napačno zaračunani prevozi, odpisane terjatve in poračuni dnevnic.',
    },
  },

  emailGate: {
    title: 'Rezultat in PDF poročilo s tremi ukrepi za vašo logistiko',
    subtitle:
      'Po oddaji se na zaslonu odpre vaš izračun in z njim PDF poročilo za upravo ali lastnika — razčlenjeno po področjih, s formulo pod vsako postavko in tremi ukrepi, ki jih je v obračunu, dokumentaciji in skladišču mogoče začeti ta teden.',
  },

  pdf: { documentTitle: 'Analiza skritih stroškov v logistiki' },
};
