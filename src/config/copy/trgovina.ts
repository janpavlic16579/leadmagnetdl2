import type { SegmentCopy } from './copyTypes';

export const TRGOVINA_COPY: SegmentCopy = {
  id: 'trgovina',
  displayName: 'Veleprodaja in distribucija',

  landing: {
    heroTitle: 'Koliko denarja vam letno obleži v zalogah in terjatvah?',
    // Veleprodajalec ima dve izgubi hkrati: vezan kapital (zaloga, terjatve) in
    // nezasluženo maržo (praznina, napačna cena). Prvo vidi ob inventuri, drugo
    // praviloma nikoli — zato sta v podnaslovu obe.
    heroSubtitle:
      'Nekurantno blago, izpad prodaje ob praznini, ročno popravljene cene in plačila po roku vežejo kapital in maržo hkrati. Prvo vidite ob inventuri, drugega nikoli.',
  },

  context: {
    title: 'Nekaj o vaši veleprodaji',
    intro:
      'Tri vprašanja, ki ne sprašujejo po številkah. Iz njih izpeljemo, koliko od izmerjenega stroška je realno mogoče nasloviti — podjetje, ki skladišče že vodi po lokacijah in s terminali, je lažje izboljšave namreč večinoma že pobralo.',
  },

  triage: {
    title: 'Kje v veleprodaji vas najbolj tišči?',
    intro:
      'Na hitro ocenite vsako področje — od naročil in cen do komisioniranja, zalog in plačilnih rokov. Podrobna vprašanja zastavimo samo za največje težave, zato vprašalnik ostane kratek, izračun pa vezan na vaš asortiman in vaše kupce.',
  },

  costBasis: {
    intro:
      'Pet številk, ki veljajo za vsa področja. Polni strošek ure pomeni bruto plačo s prispevki delodajalca ter regresom, malico in prevozom — ne neto izplačila in ne režije. Prihodek in maržo vprašamo enkrat — iz prihodka se med drugim izračuna strošek plačilnih zamud.',
  },

  results: {
    headline: 'Toliko vas stane sedanji način dela v veleprodaji in skladišču',
  },

  figures: {
    directLoss: {
      // Doslej te opombe ni bilo in veleprodajalec je dobil nevtralno besedilo.
      // Naštete so postavke, ki jih merijo moduli te dejavnosti in so res odliv:
      // odpisi nekurantnosti, reklamacije, vračila in stroški plačilnih zamud.
      note: 'Denar, ki dejansko odteka: odpisi nekurantne zaloge, reklamacije in vračila, stroški dobave po napaki, obresti in stroški izterjave.',
    },
  },

  emailGate: {
    title: 'PDF poročilo in trije ukrepi za vašo veleprodajo',
    subtitle:
      'Isti izračun v dokumentu za upravo ali lastnika — razčlenjen po področjih, s formulo pod vsako postavko in tremi ukrepi, ki jih je v prodaji in skladišču mogoče začeti ta teden.',
  },

  pdf: { documentTitle: 'Analiza skritih stroškov v veleprodaji' },
};
