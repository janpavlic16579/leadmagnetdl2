import type { SegmentCopy } from './copyTypes';

export const SPLOSNO_COPY: SegmentCopy = {
  id: 'splosno',
  displayName: 'Direktor / CFO — splošno',

  landing: {
    heroTitle: 'Koliko vas letno stane sedanji način dela?',
    // Ta segment namerno ne predpostavi, kaj podjetje počne, zato podnaslov
    // našteje samo tisto, kar ima res vsako podjetje: podatke, usklajevanje,
    // napake in plačila.
    heroSubtitle:
      'Ročno prepisovanje podatkov, usklajevanje med sistemi, popravljanje napak in plačila po roku. Nobena postavka nima svojega konta, vse skupaj pa se poznajo na rezultatu.',
  },

  context: {
    title: 'Nekaj o vašem podjetju',
    intro:
      'Tri vprašanja, ki ne sprašujejo po številkah. Ker vaše dejavnosti nismo mogli natančneje opredeliti, so naslednja vprašanja splošna — izračun bo zato bolj zadržan kot pri panožno prilagojenem vprašalniku.',
  },

  triage: {
    title: 'Kje vas najbolj tišči?',
    intro:
      'Na hitro ocenite vsako področje — od ročnega dela s podatki in usklajevanja do napak, plačilnih rokov in zalog. Podrobna vprašanja zastavimo samo za največje težave, zato vprašalnik ostane kratek.',
  },

  costBasis: {
    intro:
      'Pet številk, ki veljajo za vsa področja. Polni strošek ure pomeni bruto plačo s prispevki delodajalca ter regresom, malico in prevozom — ne neto izplačila in ne režije. Prihodek in maržo vprašamo enkrat — iz prihodka se med drugim izračuna strošek plačilnih zamud.',
  },

  results: {
    headline: 'Toliko vas stane sedanji način dela',
  },

  figures: {
    directLoss: {
      note: 'Denar, ki dejansko odteka: reklamacije in dobropisi, izgubljena marža, zamude pri plačilih, odpisane terjatve in odpisi zalog.',
    },
  },

  emailGate: {
    title: 'PDF poročilo in trije ukrepi ta teden',
    subtitle:
      'Isti izračun v dokumentu za upravo ali lastnika — razčlenjen po področjih, s formulo pod vsako postavko in tremi ukrepi za področje z največjim zneskom.',
  },

  pdf: { documentTitle: 'Analiza skritih stroškov sedanjega načina dela' },
};
