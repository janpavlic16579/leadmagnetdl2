import type { SegmentCopy } from './copyTypes';

/**
 * Nagovor predelovalca plastike.
 *
 * Osrednja teza raziskave panoge: izkoriščenost strojev in PPWR, ne prihranek
 * administracije. Naslov zato imenuje postavke, ki jih moduli te dejavnosti res
 * merijo — menjave orodij, izmet granulata, okvare sredi serije, odpoklice v
 * Excelu — in nobena od njih nima svojega konta.
 *
 * Kartica kapacitete je pri tej dejavnosti drugačna od ostalih: tri od petih
 * področij merijo STROJNE ure, ne ure ljudi, motor pa jih sešteje v isto vsoto.
 * Opomba mora to povedati, sicer nevtralna ("zaposleni ostane") govori samo o
 * ljudeh in bralec strojne ure prebere kot plače.
 */
export const PLASTIKA_COPY: SegmentCopy = {
  id: 'plastika',
  displayName: 'Predelava plastike',

  landing: {
    heroTitle: 'Koliko vas letno stane sedanji način dela v predelavi plastike?',
    heroSubtitle:
      'Menjave orodij, izmet granulata, okvare sredi serije in odpoklici v Excelu nimajo svoje vrstice v izkazu. Plačate jih skozi maržo, opazite pa šele ob letnem rezultatu.',
  },

  context: {
    title: 'Nekaj o vaši predelavi',
    intro:
      'Tri vprašanja brez številk: kaj izdelujete, kako danes vodite proizvodnjo in kdo ste v podjetju. Proizvajalec embalaže in orodjarna s predelavo imata iste stroje, a drugačne bolečine — iz odgovorov izvemo, o čem se je smiselno pogovoriti. V izračun zneskov ta odgovor ne vstopa.',
  },

  triage: {
    title: 'Kje v predelavi plastike vas najbolj tišči?',
    intro:
      'Na hitro ocenite vsako področje — od menjav orodij in izmeta do planiranja strojev, okvar in zaloge granulata. Podrobna vprašanja zastavimo samo za največje težave, zato vprašalnik ostane kratek, izračun pa vezan na vaše stroje in ne na povprečje panoge.',
  },

  costBasis: {
    intro:
      'Tri številke, ki veljajo za vsa področja. Strojna ura z operaterjem pomeni plačo operaterja s prispevki, energijo ter amortizacijo in vzdrževanje stroja — ne le neto plače, ker stroj stane tudi takrat, ko stoji. Administrativna ura in prihodek se vprašata enkrat — sta lastnost podjetja, ne posameznega področja.',
  },

  results: {
    headline: 'Toliko vas stane sedanji način dela v predelavi plastike',
  },

  figures: {
    directLoss: {
      note: 'Denar, ki dejansko odteka: izmet in odpadna plastika, reklamacije, nenačrtovana popravila orodij, odpisi zaloge granulata, ekspresni prevozi in penali.',
    },
    capacity: {
      note: 'Strojne in delovne ure skupaj. To ni prihranek pri plačah ne pri amortizaciji — stroj in ekipa ostaneta, njun čas pa se lahko usmeri v izdelavo.',
      // Mala začetnica namenoma: v PDF-ju se izpiše ZA "10 h/mesec — ".
      shortNote: 'strojne in delovne ure skupaj; ni prihranek pri plačah ne pri amortizaciji.',
    },
  },

  emailGate: {
    title: 'Rezultat in PDF poročilo s tremi ukrepi za vašo predelavo',
    subtitle:
      'Po oddaji se na zaslonu odpre vaš izračun, PDF poročilo za upravo ali lastnika pa prejmete na vpisani e-naslov — razčlenjeno po področjih, s formulo pod vsako postavko in tremi ukrepi, ki jih je pri menjavah, izmetu in planiranju mogoče začeti ta teden.',
  },

  pdf: { documentTitle: 'Analiza skritih stroškov v predelavi plastike' },
};
