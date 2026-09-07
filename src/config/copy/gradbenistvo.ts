import type { SegmentCopy } from './copyTypes';

/**
 * Nagovor gradbenega podjetja.
 *
 * Osrednja teza raziskave panoge: odločilno vprašanje direktorja ni, koliko ur
 * prihranimo, ampak KDAJ izve, da projekt izgublja maržo. Naslov zato ne obljublja
 * "manj papirja", ampak imenuje prav to — in podnaslov našteje postavke, ki jih
 * moduli te dejavnosti res merijo. Besedišče je iz kampanjskega dokumenta
 * (navodila/kampanje/linkedin-gradbenistvo-heyreach.md): material, delo,
 * podizvajalci in mehanizacija · plan proti realizaciji · pogodbe, situacije,
 * roki in plačila. Brez referenc in brez številk iz gradbeništva — teh Datalab
 * nima (kampanja, §7).
 */
export const GRADBENISTVO_COPY: SegmentCopy = {
  id: 'gradbenistvo',
  displayName: 'Gradbeništvo',

  landing: {
    heroTitle: 'Koliko vas stane, da maržo projekta izveste šele ob zaključku?',
    heroSubtitle:
      'Material, delo, podizvajalci in mehanizacija se seštejejo šele ob zaključnem obračunu, ko za ukrepanje ni več časa. Ročne situacije, neobračunana dodatna dela in zadržki nimajo svoje vrstice v izkazu.',
  },

  context: {
    title: 'Nekaj o vašem podjetju in gradbiščih',
    intro:
      'Tri vprašanja brez številk: kaj gradite, kje danes vodite pogodbe, situacije in ure ter kdo ste v podjetju. Iz odgovorov izvemo, kako danes delate — to nam pove, o čem se je smiselno pogovoriti. V izračun zneskov ta odgovor ne vstopa.',
  },

  triage: {
    title: 'Kje pri vodenju projektov vas najbolj tišči?',
    intro:
      'Na hitro ocenite vsako področje — od marže projekta in situacij do ur in materiala na gradbišču, podizvajalcev in plačil. Podrobna vprašanja zastavimo samo za največje težave, zato vprašalnik ostane kratek, izračun pa vezan na vaše projekte in ne na povprečje panoge.',
  },

  costBasis: {
    intro:
      'Štiri številke, ki veljajo za vsa področja. Polni strošek ure pomeni bruto plačo s prispevki delodajalca ter regresom, malico in prevozom — ne neto izplačila in ne režije. Letno vrednost izvedenih del in strošek financiranja vprašamo enkrat — sta lastnost podjetja, ne posameznega področja.',
  },

  results: {
    headline: 'Toliko vas stane, da projekt seštejete šele ob zaključku',
  },

  figures: {
    directLoss: {
      note: 'Denar, ki dejansko odteka: neobračunana dodatna dela, material brez vgradnje in vračila, preplačane situacije podizvajalcev, denar v prekoračenih plačilnih rokih in odpisane terjatve.',
    },
  },

  emailGate: {
    title: 'Rezultat in PDF poročilo s tremi ukrepi za vaša gradbišča',
    subtitle:
      'Po oddaji se na zaslonu odpre vaš izračun, PDF poročilo za upravo ali lastnika pa prejmete na vpisani e-naslov — razčlenjeno po področjih, s formulo pod vsako postavko in tremi ukrepi, ki jih je pri marži projekta, situacijah in gradbišču mogoče začeti ta teden.',
  },

  pdf: { documentTitle: 'Analiza skritih stroškov vodenja gradbenih projektov' },
};
