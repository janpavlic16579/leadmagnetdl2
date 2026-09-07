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

  // --- Živilstvo ------------------------------------------------------------
  'zivilstvo:pantheonMfSarze': {
    headline: `Izraba obstoječih šarž, receptur in rokov (${UPGRADE})`,
    why: 'Proizvodni modul in šarže že imajo, kalo in sledljivost pa ju kljub temu staneta. Pogovor ni o nakupu, ampak o disciplini zajema: šarža ob prevzemu, izhod ob zaključku, rok ob izdaji — najpogosteje manjka eno od treh.',
  },
  'zivilstvo:pantheonNoMf': {
    headline: `Proizvodni modul MF s šaržami in recepturami (${UPGRADE})`,
    why: 'PANTHEON že uporabljajo za finance in zaloge, proizvodnjo in sledljivost pa vodijo mimo njega. Najkrajša pot: artikli, dobavitelji in kupci so že notri, manjka vez šarža–receptura–dobavnica.',
  },
  'zivilstvo:otherErp': {
    headline: `Zamenjava proizvodnega dela ali namenskega živilskega programa (${NEW})`,
    why: 'Sistem imajo. Preverite, ali sledljivost res teče v obe smeri in ali je donos šarže v njem — vaja odpoklica na sestanku pove več kot predstavitev (raziskava panoge, hipoteza H08).',
  },
  'zivilstvo:erpExcelPaper': {
    headline: `Poenotenje v en sistem s šaržami in recepturami (${NEW})`,
    why: 'Excel in papir ob ERP-ju pomenita, da sledljivost in donos živita zunaj sistema. Vsak zapis, ki ga vodijo dvakrat, je ura prepisa in luknja v odpoklicu — to je najbolj oprijemljiv argument.',
  },
  'zivilstvo:excelPaper': {
    headline: `Celovita postavitev s proizvodnjo in šaržami (${NEW})`,
    why: 'Največja vrzel in največji potencial. Ne začnite s celoto: vstopna točka je sledljivost in odpoklic, ne prihranek administracije — izmerite čas do izsleditve ene šarže in začnite tam.',
  },

  // --- Predelava plastike ---------------------------------------------------
  'plastika:pantheonMfMt': {
    headline: `Izraba obstoječih modulov MF in MT (${UPGRADE})`,
    why: 'Proizvodni modul in terminale že imajo, menjave in izmet pa ju kljub temu staneta. Pogovor ni o nakupu, ampak o tem, kateri del že plačane funkcionalnosti ni v uporabi — najpogosteje ločena operacija menjave, javljanje izmeta z vzrokom ali normativi z regranulatom.',
  },
  'plastika:pantheonNoMf': {
    headline: `Proizvodni modul MF s terminali MT ob strojih (${UPGRADE})`,
    why: 'PANTHEON že uporabljajo za finance in zaloge, proizvodnjo pa vodijo mimo njega. Najkrajša pot: artikli, kupci in dobavitelji granulata so že notri, manjka vez odpoklic–nalog–stroj–serija.',
  },
  'plastika:otherErp': {
    headline: `Zamenjava proizvodnega dela ERP-ja ali sistema MES (${NEW})`,
    why: 'Sistem imajo. Preverite, ali so v njem cikli s strojev, menjave kot ločena operacija in šarža granulata na seriji — vprašanje o izkoriščenosti strojev na sestanku pove več kot predstavitev (raziskava panoge, hipoteza H01).',
  },
  'plastika:erpExcelPaper': {
    headline: `Poenotenje v en sistem z modulom MF (${NEW})`,
    why: 'Excel in obratovalni listi ob ERP-ju pomenijo, da izkoriščenost, izmet in odpoklici živijo zunaj sistema. Vsak podatek, ki ga vodijo dvakrat, je ura prepisa in luknja v sledljivosti do šarže — to je najbolj oprijemljiv argument.',
  },
  'plastika:excelPaper': {
    headline: `Celovita postavitev s proizvodnjo in terminali (${NEW})`,
    why: 'Največja vrzel in največji potencial. Ne začnite s celoto: vstopna točka je izkoriščenost strojev — če je ne merijo, je to prva številka, ki jo pokažete, uredba PPWR pa drugi povod za pogovor.',
  },

  // --- Kovinarstvo ----------------------------------------------------------
  'kovinarstvo:pantheonMfMt': {
    headline: `Izraba obstoječih modulov MF in MT za obračun naloga (${UPGRADE})`,
    why: 'Proizvodni modul že imajo, stroška naloga pa kljub temu ne poznajo. Pogovor ni o nakupu, ampak o tem, kateri del že plačane funkcionalnosti ni v uporabi — najpogosteje normativi, ločena operacija nastavitve, šarže ob prevzemu ali javljanje na terminalih.',
  },
  'kovinarstvo:pantheonNoMf': {
    headline: `Proizvodni modul MF s kosovnicami in šaržami, po potrebi terminali MT (${UPGRADE})`,
    why: 'PANTHEON že uporabljajo za finance in nabavo, naloge in kooperacijo pa vodijo mimo njega. Najkrajša pot: artikli, partnerji in kooperanti so že notri, manjka vez nalog–material–delo.',
  },
  'kovinarstvo:otherErp': {
    headline: `Zamenjava proizvodnega dela ERP-ja (${NEW})`,
    why: 'Sistem imajo, a jih kljub temu stane. Najprej ugotovite, ali sistem obračuna nalog po dejanskem materialu in delu in ali sledi šarži do dobavnice — test izsleditve šarže na sestanku pove več kot predstavitev (raziskava panoge, hipoteza H03).',
  },
  'kovinarstvo:erpExcelPaper': {
    headline: `Poenotenje nalogov, kosovnic in kooperacije v en sistem z modulom MF (${NEW})`,
    why: 'Excel in izpisi iz CAD-a ob ERP-ju pomenijo, da normativi, javljanje in kooperacija živijo zunaj sistema. Vsak podatek, ki ga vodijo dvakrat, je ura prepisa in luknja v strošku naloga — to je najbolj oprijemljiv argument.',
  },
  'kovinarstvo:excelPaper': {
    headline: `Celovita postavitev s proizvodnim modulom (${NEW})`,
    why: 'Največja vrzel in največji potencial. Ne prodajajte celote naenkrat: vstopna točka je dejanski strošek naloga, ne prihranek administracije — začnite pri področju z največjo postavko in pokažite obračun enega naloga.',
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

  // --- Inženiring in izvedba na ključ ----------------------------------------
  'inzeniring:pantheonProjects': {
    headline: `Izraba projektnega stroškovnega mesta in zaloge po projektu (${UPGRADE})`,
    why: 'Projekte, ure in zalogo po projektu že vodijo v sistemu, marža pa kljub temu uhaja. Pogovor ni o nakupu, ampak o disciplini zajema: ura z obvezno fazo, naročilo s projektno oznako, zapisnik o prevzemu kot sprožilec računa — najpogosteje manjka eno od treh.',
  },
  'inzeniring:pantheonNoProjects': {
    headline: `Projektno stroškovno mesto, evidenca ur in zaloga po projektu (${UPGRADE})`,
    why: 'PANTHEON že uporabljajo za finance in nabavo, projektov pa ne spremljajo v njem. Najkrajša pot: artikli, dobavitelji in računi so že notri, manjka vez projekt–faza–dokument, ki iz njih naredi maržo projekta.',
  },
  'inzeniring:otherErp': {
    headline: `Zamenjava projektnega dela ali projektnega orodja (${NEW})`,
    why: 'Sistem imajo. Preverite, ali je v njem tudi oprema po projektu in obračun po fazah ali samo ure — projektno orodje brez zaloge in situacij pusti največji del marže zunaj sistema.',
  },
  'inzeniring:erpExcel': {
    headline: `Poenotenje projektov, ur, opreme in obračuna v en sistem (${NEW})`,
    why: 'Projektni Excel ob računovodskem programu pomeni, da marža projekta nastane s prepisom. Vsak prepis je priložnost, da ura ali kos opreme izpade — to je najbolj oprijemljiv argument.',
  },
  'inzeniring:excelPaper': {
    headline: `Celovita postavitev s projekti, evidenco ur in zalogo po projektu (${NEW})`,
    why: 'Največja vrzel in največji potencial. Ne začnite s celoto: vstopna točka je marža po projektu — izmerite, čez koliko dni po zaključku jo poznajo, in začnite tam (raziskava panoge, hipoteza H02).',
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

  // --- Gradbeništvo ---------------------------------------------------------
  'gradbenistvo:pantheonProjectCost': {
    headline: `Izraba projektnega stroškovnega mesta (${UPGRADE})`,
    why: 'Projekte in ure že vodijo v sistemu, marža pa kljub temu pride prepozno. Pogovor ni o nakupu, ampak o disciplini zajema: kateri stroški še pridejo na projekt z zamikom — najpogosteje material z gradbišča in situacije podizvajalcev.',
  },
  'gradbenistvo:pantheonNoProjects': {
    headline: `Projektno stroškovno mesto in evidenca ur (${UPGRADE})`,
    why: 'PANTHEON že uporabljajo za finance, projekte pa vodijo mimo njega. Najkrajša pot: partnerji, artikli in računi so že notri — manjka projektna oznaka na uri, dobavnici in situaciji, in prav to je celoten zamik do znane marže.',
  },
  'gradbenistvo:otherErpConstruction': {
    headline: `Zamenjava ali povezava gradbenega programa (${NEW})`,
    why: 'Orodje za kalkulacije in situacije imajo. Preverite, ali stroški vanj pridejo sproti ali šele iz računovodstva ob koncu meseca — če slednje, težava ni v programu, ampak v tem, da sta plan in realizacija v dveh sistemih.',
  },
  'gradbenistvo:erpExcel': {
    headline: `Poenotenje projektov, ur in situacij v en sistem (${NEW})`,
    why: 'Računovodski program in Excel za projekte pomenita dva vira resnice: marža v Excelu in marža v knjigah se razhajata. Vsak podatek, ki ga vodijo dvakrat, je ura prepisa in mesec zamika — to je najbolj oprijemljiv argument.',
  },
  'gradbenistvo:excelPaper': {
    headline: `Celovita postavitev s projektnim stroškovnim mestom (${NEW})`,
    why: 'Največja vrzel in največji potencial. Ne prodajajte celote naenkrat — začnite pri pripisu ur in materiala projektu, ker brez tega nobena situacija in nobena marža ne stoji na podatkih.',
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
