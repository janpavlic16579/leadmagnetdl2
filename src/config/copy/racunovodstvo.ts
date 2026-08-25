import type { SegmentCopy } from './copyTypes';

export const RACUNOVODSTVO_COPY: SegmentCopy = {
  id: 'racunovodstvo',
  displayName: 'Računovodski servis',

  landing: {
    heroTitle: 'Koliko novih strank bi lahko sprejeli z isto ekipo?',
    // Edina dejavnost, pri kateri je vodilna zgodba kapaciteta in ne odliv:
    // servis raste tako, da sprejme stranko, in prav to mu ure preprečujejo.
    heroSubtitle:
      'Ročni prepis listin, lovljenje strank pred rokom in konice ob obračunih pojedo ure, ki bi jih lahko prodali. Vaša omejitev pri rasti niso stranke, ampak kapaciteta.',
  },

  context: {
    title: 'Nekaj o vašem servisu',
    intro:
      'Tri vprašanja, ki ne sprašujejo po številkah. Iz njih izpeljemo, koliko od izmerjenega stroška je realno mogoče nasloviti — servis, ki listine že zajema samodejno, je lažje izboljšave namreč večinoma že pobral.',
  },

  triage: {
    title: 'Kje v servisu vas najbolj tišči?',
    intro:
      'Na hitro ocenite vsako področje — od zajema listin in komunikacije s strankami do obračunov, popravkov in donosnosti strank. Podrobna vprašanja zastavimo samo za največje težave, zato vprašalnik ostane kratek.',
  },

  costBasis: {
    intro:
      'Štiri številke, ki veljajo za vsa področja. Polni strošek pomeni bruto plačo s prispevki delodajalca ter regresom, malico in prevozom — ne neto izplačila, ne režije in ne cene, ki jo za uro zaračunate stranki. Prihodek in maržo vprašamo enkrat — sta lastnost servisa, ne posameznega področja.',
  },

  results: {
    headline: 'Toliko vas stane sedanji način dela v servisu',
    // Kapaciteta je za servis merilo, ki ga razume takoj: ure so vhod, stranke
    // so izhod. Izračun stoji na vprašanju o urah na stranko, sicer na rezervi
    // iz segments.ts (accountingCapacity).
    capacitySecondary: 'To je {count} dodatnih strank brez nove zaposlitve.',
  },

  figures: {
    directLoss: {
      note: 'Denar, ki dejansko odteka: zunanja pomoč v konicah, globe in obresti, samoprijave in dobropisi.',
    },
  },

  emailGate: {
    title: 'PDF poročilo in trije ukrepi za vaš servis',
    subtitle:
      'Isti izračun v dokumentu za lastnika ali partnerje — razčlenjen po področjih, s formulo pod vsako postavko in tremi ukrepi, ki jih je v servisu mogoče začeti ta teden.',
  },

  pdf: { documentTitle: 'Analiza skritih stroškov in kapacitete servisa' },
};
