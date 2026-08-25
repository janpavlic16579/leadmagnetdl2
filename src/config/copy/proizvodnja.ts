import type { SegmentCopy } from './copyTypes';

export const PROIZVODNJA_COPY: SegmentCopy = {
  id: 'proizvodnja',
  displayName: 'Proizvodnja 10–249 zaposlenih',

  landing: {
    heroTitle: 'Koliko vas letno stane sedanji način dela v proizvodnji?',
    // Nobena od naštetih postavk nima svojega konta — prav to je razlog, da jih
    // direktor ne vidi, dokler mu jih nekdo ne sešteje. Naštete so tiste, ki jih
    // moduli te dejavnosti res merijo (planiranje, material, zaloge, nalogi, zamude).
    heroSubtitle:
      'Izmet, dodelave, zastoji zaradi materiala in ekspresne nabave nimajo svoje vrstice v izkazu. Plačate jih skozi maržo, opazite pa šele pri letnem rezultatu.',
  },

  context: {
    title: 'Nekaj o vaši proizvodnji',
    intro:
      'Tri vprašanja, ki ne sprašujejo po številkah. Iz njih izpeljemo, koliko od izmerjenega stroška je realno mogoče nasloviti — podjetje, ki že uporablja proizvodni modul, je lažje izboljšave namreč večinoma že pobralo.',
  },

  triage: {
    title: 'Kje v proizvodnji vas najbolj tišči?',
    intro:
      'Na hitro ocenite vsako področje — od plana in izmeta do zalog in rokov. Podrobna vprašanja zastavimo samo za največje težave, zato vprašalnik ostane kratek, izračun pa vezan na vašo proizvodnjo in ne na povprečje panoge.',
  },

  costBasis: {
    intro:
      'Štiri številke, ki veljajo za vsa področja. Polni strošek ure pomeni bruto plačo s prispevki delodajalca ter regresom, malico in prevozom — ne neto izplačila in ne režije. Prihodek in maržo vprašamo enkrat — sta lastnost podjetja, ne posameznega področja.',
  },

  results: {
    headline: 'Toliko vas stane sedanji način dela v proizvodnji',
  },

  figures: {
    directLoss: {
      note: 'Denar, ki dejansko odteka: izmet, odpisi, ekspresne nabave, penali, reklamacije.',
    },
  },

  emailGate: {
    title: 'PDF poročilo in trije ukrepi za vašo proizvodnjo',
    subtitle:
      'Isti izračun v dokumentu za upravo ali lastnika — razčlenjen po področjih, s formulo pod vsako postavko in tremi ukrepi, ki jih je v proizvodnji mogoče začeti ta teden.',
  },

  pdf: { documentTitle: 'Analiza skritih stroškov v proizvodnji' },
};
