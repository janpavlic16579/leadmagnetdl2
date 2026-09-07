import type { SegmentCopy } from './copyTypes';

/**
 * Nagovor inženiringa in izvedbe na ključ.
 *
 * Osrednja teza raziskave panoge: sporočilo ne sme govoriti o urah projektantov,
 * ampak o marži projekta na ključ, o fazah in o opremi, vezani na projekt. Naslov
 * zato ne obljublja "več zaračunanih ur", ampak imenuje tri postavke, ki jih moduli
 * te dejavnosti res merijo — aneksi, oprema in ure brez projekta — in nobena od
 * njih nima svojega konta.
 */
export const INZENIRING_COPY: SegmentCopy = {
  id: 'inzeniring',
  displayName: 'Inženiring',

  landing: {
    heroTitle: 'Koliko marže projekta vam letno vzamejo aneksi, oprema in ure?',
    heroSubtitle:
      'Dodatna dela brez aneksa, oprema, ki konča na drugem projektu, zaključene faze brez računa in ure, ki jih nihče ne pripiše projektu. Nič od tega nima svojega konta — plačate skozi maržo.',
  },

  context: {
    title: 'Nekaj o vašem inženiringu',
    intro:
      'Tri vprašanja brez številk: kaj izvajate, kako danes vodite projekte, ure in opremo ter kdo ste v podjetju. Projektant in izvajalec na ključ imata isti poklic, a drugačne bolečine — iz odgovorov izvemo, o čem se je smiselno pogovoriti. V izračun zneskov ta odgovor ne vstopa.',
  },

  triage: {
    title: 'Kje pri vodenju projektov vas najbolj tišči?',
    intro:
      'Na hitro ocenite vsako področje — od marže projekta in aneksov do opreme, obračuna po fazah in projektne dokumentacije. Podrobna vprašanja zastavimo samo za največje težave, zato vprašalnik ostane kratek, izračun pa vezan na vaše projekte in ne na povprečje panoge.',
  },

  costBasis: {
    intro:
      'Štiri številke, ki veljajo za vsa področja. Polni strošek ure pomeni bruto plačo s prispevki delodajalca ter regresom, malico in prevozom — ne neto izplačila in ne režije. Letno vrednost projektov in strošek financiranja vprašamo enkrat — sta lastnost podjetja, ne posameznega področja; množita denar, vezan v fazah brez računa.',
  },

  results: {
    headline: 'Toliko vas stane projekt, katerega marže ne poznate do zaključka',
  },

  figures: {
    directLoss: {
      note: 'Denar, ki dejansko odteka: dodatna dela brez aneksa, ekspresne dobave in kazni zaradi opreme, neobračunani servisni posegi in strošek denarja, vezanega v zaključenih fazah brez računa.',
    },
  },

  emailGate: {
    title: 'Rezultat in PDF poročilo s tremi ukrepi za vaše projekte na ključ',
    subtitle:
      'Po oddaji se na zaslonu odpre vaš izračun, PDF poročilo za upravo ali lastnika pa prejmete na vpisani e-naslov — razčlenjeno po področjih, s formulo pod vsako postavko in tremi ukrepi, ki jih je pri marži projektov, aneksih in opremi mogoče začeti ta teden.',
  },

  pdf: { documentTitle: 'Analiza marže projektov in skritih stroškov v inženiringu' },
};
