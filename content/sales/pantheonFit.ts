import type { SegmentId } from '../../src/config/segmentTypes';

/**
 * Kaj ponuditi glede na sedanji sistem stranke.
 *
 * Ključ je `segment:sedanjiSistem`, ker so id-ji sistemov segmentno unikatni
 * (`pantheonMfMt`, `pantheonWms`, `pantheonRetail`, `pantheonZajem` …). Vsak segment
 * ima še rezervo za primer, ko sistem ni izbran ali ko se seznam možnosti razširi —
 * manjkajoč vnos ne sme pomeniti praznega razdelka.
 *
 * NAMENOMA BREZ CEN IN BREZ OBLJUB O LICENCAH. Izjava o omejitvi v obeh poročilih
 * pravi, da izračun ne obljublja funkcionalnosti izven objavljenega cenika; ta
 * datoteka je zato SMER pogovora ("to je tisto, česar nimajo"), točno licenco in
 * ceno pa svetovalec potrdi po veljavnem ceniku. Zato je tu tudi `confirm`.
 */

export interface PantheonFit {
  /** Kaj nasloviti — kratko, kot naslov razdelka. */
  headline: string;
  /** Zakaj prav to pri tej stranki. */
  why: string;
}

/** Opomnik, ki se izpiše pod vsakim priporočilom. */
export const PANTHEON_FIT_CONFIRM =
  'Točno licenco in obseg potrdite po veljavnem ceniku — to je smer pogovora, ne ponudba.';

const UPGRADE = 'nadgradnja obstoječe postavitve';
const NEW = 'nova postavitev';

export const PANTHEON_FIT: Record<string, PantheonFit> = {
  // --- Proizvodnja ----------------------------------------------------------
  'proizvodnja:pantheonMfMt': {
    headline: `Izraba obstoječih modulov MF in MT (${UPGRADE})`,
    why: 'Proizvodni modul že imajo, izguba pa kljub temu ostaja. Pogovor ni o nakupu, ampak o tem, kateri del že plačane funkcionalnosti ni v uporabi — najpogosteje normativi, terminali ali planiranje potreb.',
  },
  'proizvodnja:pantheonNoMf': {
    headline: `Proizvodni modul MF, po potrebi terminali MT (${UPGRADE})`,
    why: 'PANTHEON že uporabljajo za finance in nabavo, proizvodnjo pa vodijo mimo njega. To je najkrajša pot: baza, artikli in partnerji so že notri.',
  },
  'proizvodnja:otherErp': {
    headline: `Zamenjava proizvodnega dela ERP-ja (${NEW})`,
    why: 'Sistem imajo, a jih kljub temu stane. Najprej ugotovite, ali je težava v modulu ali v tem, kako je postavljen — izpodrivanje je najdražji in najdaljši cikel.',
  },
  'proizvodnja:erpExcelPaper': {
    headline: `Poenotenje v en sistem z modulom MF (${NEW})`,
    why: 'Excel ob ERP-ju je znak, da sistem ne pokriva proizvodnje. Vsak podatek, ki ga vodijo dvakrat, je vir napake in ročnega dela — to je najbolj oprijemljiv argument.',
  },
  'proizvodnja:excelPaper': {
    headline: `Celovita postavitev s proizvodnim modulom (${NEW})`,
    why: 'Največja vrzel in največji potencial. Ne prodajajte celote naenkrat — začnite pri področju z največjo postavko in pokažite, kaj se z njim spremeni.',
  },

  // --- Logistika ------------------------------------------------------------
  'logistika:pantheonWmsTms': {
    headline: `Izraba obstoječe postavitve (${UPGRADE})`,
    why: 'Namenski sistem že imajo. Izguba, ki ostane, je najpogosteje v podatkih in dokumentaciji, ne v manjkajočem modulu.',
  },
  'logistika:pantheonNoWms': {
    headline: `Skladiščni in dokumentacijski del na PANTHEON-u (${UPGRADE})`,
    why: 'PANTHEON imajo, logistiko pa vodijo ob njem. Datalab za logistiko nima ločene licence — pokrivata jo SE in ME, zato je pogovor o obsegu obstoječe licence, ne o novem produktu.',
  },
  'logistika:otherErp': {
    headline: `Zamenjava ali dopolnitev sedanjega sistema (${NEW})`,
    why: 'Namenski sistem imajo. Preverite, ali je težava v sistemu ali v tem, da dokazila o dostavi pridejo vanj prepozno.',
  },
  'logistika:erpExcelPaper': {
    headline: `Poenotenje naročil, odprem in dokumentacije (${NEW})`,
    why: 'Excel ob ERP-ju pomeni, da se isti podatek o pošiljki vnaša večkrat. Tam nastajajo tudi napačne dostave.',
  },
  'logistika:excelPaper': {
    headline: `Celovita postavitev (${NEW})`,
    why: 'Največja vrzel. Začnite pri dokumentaciji — je najbolj oprijemljiva in najhitreje pokaže učinek.',
  },

  // --- Veleprodaja ----------------------------------------------------------
  'trgovina:pantheonWms': {
    headline: `Izraba skladiščnega modula (${UPGRADE})`,
    why: 'Lokacije in terminale že imajo. Izguba, ki ostane, je običajno v naročilih in cenikih, ne v skladišču.',
  },
  'trgovina:pantheonNoWms': {
    headline: `Skladiščni modul z lokacijami in terminali (${UPGRADE})`,
    why: 'PANTHEON imajo, skladišča pa ne vodijo po lokacijah. Iskanje blaga in inventure so neposredna posledica — številke za oboje so v poročilu.',
  },
  'trgovina:otherErp': {
    headline: `Zamenjava sistema za prodajo in skladišče (${NEW})`,
    why: 'ERP imajo in je povezan s skladiščem. Izpodrivanje je smiselno le, če je izguba velika in vzrok v podatkih — preverite oboje.',
  },
  'trgovina:erpExcelPaper': {
    headline: `Poenotenje naročil, cenikov in zalog (${NEW})`,
    why: 'Ceniki in rabati v Excelu ob ERP-ju so najpogostejši vir izgubljene marže. To je najlažje dokazljiv del.',
  },
  'trgovina:excelPaper': {
    headline: `Celovita postavitev s skladiščnim modulom (${NEW})`,
    why: 'Največja vrzel in največji potencial. Začnite pri področju z največjo postavko.',
  },

  // --- Maloprodaja ----------------------------------------------------------
  'maloprodaja:pantheonRetail': {
    headline: `Izraba maloprodajnega modula (${UPGRADE})`,
    why: 'POS in zaloge so že povezani. Kar ostaja, je običajno v nabavnih pogojih in maržah.',
  },
  'maloprodaja:pantheonNoRetail': {
    headline: `Maloprodajni modul (POS), povezan z zalogami (${UPGRADE})`,
    why: 'PANTHEON imajo brez maloprodajnega dela. Manko in razlike med sistemom in polico so neposredna posledica nepovezane blagajne.',
  },
  'maloprodaja:otherRetailSystem': {
    headline: `Zamenjava maloprodajnega sistema (${NEW})`,
    why: 'Sistem imajo in je povezan z zalogami. Preverite, kje se povezava dejansko pretrga — pogosto pri prevzemu, ne pri blagajni.',
  },
  'maloprodaja:posNoStockLink': {
    headline: `Povezava blagajne z zalogami (${NEW})`,
    why: 'Najmočnejši argument v tem segmentu: blagajna, ki ne ve, kaj je na zalogi, naredi vsako inventuro presenečenje. Manko v poročilu je merilo.',
  },
  'maloprodaja:excelPaper': {
    headline: `Celovita postavitev z blagajno in zalogami (${NEW})`,
    why: 'Največja vrzel. Začnite pri manku in odpisih — sta najbolj oprijemljiva.',
  },

  // --- Storitve -------------------------------------------------------------
  'storitve:pantheonProjects': {
    headline: `Izraba projektnega dela (${UPGRADE})`,
    why: 'Projekte in evidenco dela že vodijo v sistemu. Nezaračunane ure, ki ostajajo, so navadno stvar postopka ob obračunu, ne orodja.',
  },
  'storitve:pantheonNoProjects': {
    headline: `Projekti in evidenca dela (${UPGRADE})`,
    why: 'PANTHEON imajo, projektov pa ne spremljajo v njem. Ura, ki ni evidentirana ob izvedbi, se ob obračunu ne pojavi — to je celoten znesek nezaračunanega dela.',
  },
  'storitve:otherErpPsa': {
    headline: `Zamenjava projektnega orodja (${NEW})`,
    why: 'Orodje imajo. Preverite, ali je težava v evidenci ur ali v tem, da obseg dela ni nikjer zapisan.',
  },
  'storitve:erpExcel': {
    headline: `Poenotenje projektov, ur in obračuna (${NEW})`,
    why: 'Ure v Excelu ob ERP-ju pomenijo, da obračun temelji na prepisu. Vsak prepis je priložnost, da ura izpade.',
  },
  'storitve:excelPaper': {
    headline: `Celovita postavitev s projekti in evidenco dela (${NEW})`,
    why: 'Največja vrzel. Nezaračunane ure so najhitrejši argument — so čist izgubljen prihodek, ne strošek.',
  },

  // --- Računovodski servis --------------------------------------------------
  'racunovodstvo:pantheonZajem': {
    headline: `Izraba samodejnega zajema (${UPGRADE})`,
    why: 'Zajem listin že imajo. Kar ostaja, je običajno v strankah, ki oddajajo prepozno — to je stvar dogovora, ne programa.',
  },
  'racunovodstvo:pantheonRocno': {
    headline: `Samodejni zajem listin in izmenjava dokumentov (${UPGRADE})`,
    why: 'PANTHEON že uporabljajo, listine pa vnašajo ročno. Kapaciteta, ki se s tem sprosti, je v poročilu izražena v novih strankah brez nove zaposlitve — to je njihov jezik.',
  },
  'racunovodstvo:drugProgram': {
    headline: `Zamenjava računovodskega programa (${NEW})`,
    why: 'Program imajo. Preverite, koliko listin pride elektronsko — če jih malo, težava ni v programu.',
  },
  'racunovodstvo:programExcel': {
    headline: `Poenotenje in zajem listin (${NEW})`,
    why: 'Excel ob programu pomeni dvojno evidenco. Pri servisu se to pozna pri vsaki stranki hkrati.',
  },
  'racunovodstvo:rocno': {
    headline: `Celovita postavitev z zajemom listin (${NEW})`,
    why: 'Največja vrzel. Argument ni prihranek, ampak kapaciteta: koliko strank bi sprejeli z isto ekipo.',
  },

  // --- Splošno --------------------------------------------------------------
  'splosno:pantheonPoln': {
    headline: `Izraba obstoječe postavitve (${UPGRADE})`,
    why: 'PANTHEON uporabljajo za večino procesov. Vprašajte, kateri podatek še vedno vodijo ob njem — tam je preostala izguba.',
  },
  'splosno:pantheonDelno': {
    headline: `Razširitev na procese, ki so še v Excelu (${UPGRADE})`,
    why: 'PANTHEON imajo ob veliko Excelu. Število ločenih orodij iz vprašalnika je najboljša iztočnica.',
  },
  'splosno:otherErp': {
    headline: `Zamenjava poslovnega programa (${NEW})`,
    why: 'Program imajo. Izpodrivanje je smiselno le ob veliki izgubi in jasnem vzroku v podatkih.',
  },
  'splosno:erpExcelPaper': {
    headline: `Poenotenje v en sistem (${NEW})`,
    why: 'Kombinacija programa in Excela je najpogostejši vzrok podvojenih vnosov in neusklajenih številk.',
  },
  'splosno:excelPaper': {
    headline: `Celovita postavitev (${NEW})`,
    why: 'Največja vrzel. Najprej ugotovite dejavnost — splošni vprašalnik pomeni, da se v nobeni panogi niso prepoznali.',
  },
};

/** Rezerva, kadar sistema ni izbral ali ključa ni v tabeli. */
export const PANTHEON_FIT_FALLBACK: PantheonFit = {
  headline: 'Sedanjega sistema ne poznamo',
  why: 'Stranka ni odgovorila, kako danes vodi poslovanje. To je prvo vprašanje na sestanku — brez njega ni mogoče presoditi, ali gre za nadgradnjo ali za novo postavitev.',
};

export function getPantheonFit(segmentId: SegmentId, systemId: string | null): PantheonFit {
  if (!systemId) return PANTHEON_FIT_FALLBACK;
  return PANTHEON_FIT[`${segmentId}:${systemId}`] ?? PANTHEON_FIT_FALLBACK;
}
