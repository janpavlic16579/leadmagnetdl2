import type { SegmentCopy } from './copyTypes';

export const LOGISTIKA_COPY: SegmentCopy = {
  id: 'logistika',
  displayName: 'Logistika in transport',

  landing: {
    heroTitle: 'Koliko vas letno stanejo prazni kilometri in stojnine?',
    // Postavke prevoznika se razpršijo med gorivo, delo in penale, zato v izkazu
    // ni vrstice, ki bi jih seštela. Naštete so tiste, ki jih merijo moduli te
    // dejavnosti (odprema, napake, skladisce, dokumentacija, roki).
    heroSubtitle:
      'Slabo izkoriščene vožnje, napačne dostave, poškodovano blago in nujni podnajemi se razpršijo med gorivo, delo in penale. Nobena od teh postavk nima svoje vrstice.',
  },

  context: {
    title: 'Nekaj o vaši logistiki',
    intro:
      'Tri vprašanja, ki ne sprašujejo po številkah. Iz njih izvemo, kako danes delate — to nam pove, o čem se je smiselno pogovoriti, in nam pomaga razumeti, zakaj stroški sploh nastajajo. V izračun zneskov ta odgovor ne vstopa.',
  },

  triage: {
    title: 'Kje v logistiki vas najbolj tišči?',
    intro:
      'Na hitro ocenite vsako področje — od planiranja prevozov in napačnih dostav do skladišča in stojnin. Podrobna vprašanja zastavimo samo za največje težave, zato vprašalnik ostane kratek, izračun pa vezan na vaš vozni park in vaše stranke.',
  },

  costBasis: {
    intro:
      'Štiri številke, ki veljajo za vsa področja. Polni strošek ure pomeni bruto plačo s prispevki delodajalca ter regresom, malico in prevozom — ne neto izplačila in ne režije. Prihodek in maržo vprašamo enkrat — sta lastnost podjetja, ne posameznega področja.',
  },

  results: {
    headline: 'Toliko vas stane sedanji način dela v logistiki',
  },

  figures: {
    directLoss: {
      note: 'Denar, ki dejansko odteka: prazni kilometri, poškodovano blago, nujni podnajemi, penali in stojnine.',
    },
  },

  emailGate: {
    title: 'PDF poročilo in trije ukrepi za vašo logistiko',
    subtitle:
      'Isti izračun v dokumentu za upravo ali lastnika — razčlenjen po področjih, s formulo pod vsako postavko in tremi ukrepi, ki jih je v prevozu in skladišču mogoče začeti ta teden.',
  },

  pdf: { documentTitle: 'Analiza skritih stroškov v logistiki' },
};
