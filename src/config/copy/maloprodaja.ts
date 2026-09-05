import type { SegmentCopy } from './copyTypes';

export const MALOPRODAJA_COPY: SegmentCopy = {
  id: 'maloprodaja',
  displayName: 'Maloprodaja',

  landing: {
    heroTitle: 'Koliko marže vam letno vzamejo prazne police in odpisi?',
    // Trgovčeva izguba se nabira po centih na artikel, zato v mesečnem izkazu ne
    // izstopa nikoli — to je edini razlog, da je ta kalkulator zanj sploh zanimiv.
    heroSubtitle:
      'Nedobavljiv artikel, presežna zaloga, znižanja ob koncu sezone in manko na blagajni odnesejo maržo po centih na artikel — zato v mesečnem izkazu ne izstopajo.',
  },

  context: {
    title: 'Nekaj o vaši maloprodaji',
    intro:
      'Tri vprašanja, ki ne sprašujejo po številkah. Iz njih izvemo, kako danes delate — to nam pove, o čem se je smiselno pogovoriti, in nam pomaga razumeti, zakaj stroški sploh nastajajo. V izračun zneskov ta odgovor ne vstopa.',
  },

  triage: {
    title: 'Kje v trgovini vas najbolj tišči?',
    intro:
      'Na hitro ocenite vsako področje — od praznih polic in odpisov do cen, blagajne, prevzemov in spletne prodaje. Podrobna vprašanja zastavimo samo za največje težave, zato vprašalnik ostane kratek, izračun pa vezan na vaše police.',
  },

  costBasis: {
    intro:
      'Pet številk, ki veljajo za vsa področja. Polni strošek ure pomeni bruto plačo s prispevki delodajalca ter regresom, malico in prevozom — ne neto izplačila in ne režije. Prihodek in maržo vprašamo enkrat, ker se iz njiju računa vsak odstotek v nadaljevanju.',
  },

  results: {
    headline: 'Toliko vas stane sedanji način dela v trgovini',
  },

  figures: {
    directLoss: {
      // Doslej te opombe ni bilo in trgovec je dobil nevtralno besedilo. Naštete
      // so postavke, ki jih merijo moduli te dejavnosti in so res knjižen odliv;
      // izgubljena marža ob prazni polici sodi v koš lostMargin, ne sem.
      note: 'Denar, ki dejansko odteka: odpisi in znižanja, manko na blagajni, reklamacije in vračila, popravki po napačnem prevzemu.',
    },
  },

  emailGate: {
    title: 'Rezultat in PDF poročilo s tremi ukrepi za vašo trgovino',
    subtitle:
      'Po oddaji se na zaslonu odpre vaš izračun in z njim PDF poročilo za upravo ali lastnika — razčlenjeno po področjih, s formulo pod vsako postavko in tremi ukrepi, ki jih je v trgovini mogoče začeti ta teden.',
  },

  pdf: { documentTitle: 'Analiza skritih stroškov v maloprodaji' },
};
