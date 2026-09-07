import type { SegmentCopy } from './copyTypes';

/**
 * Nagovor kovinarja.
 *
 * Osrednja teza raziskave panoge: podizvajalec cene kupcu ne more dvigniti, zato
 * mu ostane samo notranja učinkovitost — in prodajni argument ni prihranek
 * administracije, ampak dejanski strošek delovnega naloga. Naslov zato vpraša
 * po strošku naloga, podnaslov pa imenuje štiri postavke, ki jih moduli te
 * dejavnosti res merijo in nobena nima svojega konta.
 */
export const KOVINARSTVO_COPY: SegmentCopy = {
  id: 'kovinarstvo',
  displayName: 'Kovinarstvo',

  landing: {
    heroTitle: 'Koliko vas letno stane, da ne poznate dejanskega stroška naloga?',
    heroSubtitle:
      'Odstopanje porabe od normativa, nemerjene nastavitve, material v kooperaciji in iskanje šarž nimajo svoje vrstice v izkazu. Cene kupcu ne dvignete — ostane vam notranja učinkovitost.',
  },

  context: {
    title: 'Nekaj o vaši kovinarski proizvodnji',
    intro:
      'Tri vprašanja brez številk: kako pretežno delate, kako danes vodite proizvodnjo in kdo ste v podjetju. Delavnica s posamičnimi kosi in serijski dobavitelj avtomobilske verige imata iste stroje, a drugačne bolečine — iz odgovorov izvemo, o čem se je smiselno pogovoriti. V izračun zneskov ta odgovor ne vstopa.',
  },

  triage: {
    title: 'Kje v kovinarstvu vas najbolj tišči?',
    intro:
      'Na hitro ocenite vsako področje — od stroška delovnega naloga in porabe materiala do zalog, certifikatov, kooperacije in rokov. Podrobna vprašanja zastavimo samo za največje težave, zato vprašalnik ostane kratek, izračun pa vezan na vaše naloge in ne na povprečje panoge.',
  },

  costBasis: {
    intro:
      'Tri številke, ki veljajo za vsa področja: dve urni postavki in prihodek. Polni strošek ure pomeni bruto plačo s prispevki delodajalca ter regresom, malico in prevozom — ne neto izplačila in ne režije. Prihodek je lastnost podjetja, ne posameznega področja, zato ga vprašamo enkrat.',
  },

  results: {
    headline: 'Toliko vas stane sedanji način dela v kovinarstvu',
  },

  figures: {
    directLoss: {
      note: 'Denar, ki dejansko odteka: presežna poraba materiala nad normativom, inventurne razlike in odpisi, nujne nabave, izgube v kooperaciji, reklamacije in penali zaradi zamud.',
    },
  },

  emailGate: {
    title: 'Rezultat in PDF poročilo s tremi ukrepi za vaše kovinarstvo',
    subtitle:
      'Po oddaji se na zaslonu odpre vaš izračun, PDF poročilo za upravo ali lastnika pa prejmete na vpisani e-naslov — razčlenjeno po področjih, s formulo pod vsako postavko in tremi ukrepi, ki jih je pri delovnem nalogu, materialu in zalogah mogoče začeti ta teden.',
  },

  pdf: { documentTitle: 'Analiza skritih stroškov v kovinarstvu' },
};
