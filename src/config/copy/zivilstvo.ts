import type { SegmentCopy } from './copyTypes';

/**
 * Nagovor živilskega proizvajalca.
 *
 * Osrednja teza raziskave panoge: vstopna točka je sledljivost in odpoklic, ne
 * prihranek administracije. Naslov zato ne obljublja "manj papirja", ampak
 * imenuje tri postavke, ki jih moduli te dejavnosti res merijo — kalo, potekle
 * roke in ročno sledljivost — in nobena od njih nima svojega konta.
 */
export const ZIVILSTVO_COPY: SegmentCopy = {
  id: 'zivilstvo',
  displayName: 'Živilstvo',

  landing: {
    heroTitle: 'Koliko vas letno stanejo kalo, potekli roki in ročna sledljivost?',
    heroSubtitle:
      'Razlika med recepturo in dejanskim donosom, odpisi zaradi roka, HACCP mape in odpoklic, ki ga sestavljate iz papirjev — nič od tega nima svoje vrstice v izkazu. Plačate skozi maržo.',
  },

  context: {
    title: 'Nekaj o vaši živilski proizvodnji',
    intro:
      'Tri vprašanja brez številk: kaj proizvajate, kako danes vodite proizvodnjo in sledljivost ter kdo ste v podjetju. Mlekarna in mesnica imata iste zakone, a drugačne bolečine — iz odgovorov izvemo, o čem se je smiselno pogovoriti. V izračun zneskov ta odgovor ne vstopa.',
  },

  triage: {
    title: 'Kje v živilski proizvodnji vas najbolj tišči?',
    intro:
      'Na hitro ocenite vsako področje — od donosa šarže in rokov uporabnosti do sledljivosti, HACCP evidenc in naročil trgovcev. Podrobna vprašanja zastavimo samo za največje težave, zato vprašalnik ostane kratek, izračun pa vezan na vaše šarže in ne na povprečje panoge.',
  },

  costBasis: {
    intro:
      'Tri številke, ki veljajo za vsa področja. Polni strošek ure pomeni bruto plačo s prispevki delodajalca ter regresom, malico in prevozom — ne neto izplačila in ne režije. Prihodek vprašamo enkrat — je lastnost podjetja, ne posameznega področja.',
  },

  results: {
    headline: 'Toliko vas stane sedanji način dela v živilski proizvodnji',
  },

  figures: {
    directLoss: {
      note: 'Denar, ki dejansko odteka: kalo nad recepturo, odpisi zaradi roka, inventurne razlike, dobropisi in odpoklici, napačne etikete, ekspresne nabave in penali trgovcev.',
    },
  },

  emailGate: {
    title: 'Rezultat in PDF poročilo s tremi ukrepi za vaš živilski obrat',
    subtitle:
      'Po oddaji se na zaslonu odpre vaš izračun, PDF poročilo za upravo ali lastnika pa prejmete na vpisani e-naslov — razčlenjeno po področjih, s formulo pod vsako postavko in tremi ukrepi, ki jih je pri donosu, rokih in sledljivosti mogoče začeti ta teden.',
  },

  pdf: { documentTitle: 'Analiza skritih stroškov v živilski proizvodnji' },
};
