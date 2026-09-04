import type { SegmentId } from '../segmentTypes';

/**
 * Marketinško besedilo ene dejavnosti.
 *
 * VPRAŠANJ TU NI. Kaj vpraša modul, je v config/modules/; kaj vpraša kontekst, je
 * v config/contexts/. Tu je samo tisto, kar obiskovalcu pove, ZAKAJ naj odgovarja:
 * naslovi, uvodi, naslovi kartic in pozivi. Ločnica ni estetska — vprašanja so
 * vezana na formule in na izvozni zapis za CRM, besedilo okoli njih pa se sme
 * prepisati, ne da bi se premaknila ena sama številka.
 *
 * Naslovnik je v vseh sedmih dejavnostih isti: direktor ali lastnik podjetja z
 * 10–249 zaposlenimi (ocena ICP daje direktorju utež 1,00, financam 0,80, vodji
 * 0,60 — glej config/icp.ts). Panoga se spreminja, raven nagovora ne.
 *
 * Ton: bolečina po imenu, vsaka trditev pokrita z izračunom. Kar se ne da
 * izračunati, se ne obljubi — to je edino, kar loči lead magnet od oglasa.
 *
 * Neobvezna polja se razrešijo proti NEUTRAL_COPY (getSegmentCopy), zato je
 * mogoče dejavnost pisati po delih, ne da bi vmes nastal zaslon brez naslova.
 * Obvezna so tista, pri katerih bi nevtralno besedilo pomenilo, da dejavnosti
 * sploh ne nagovarjamo.
 */
/**
 * Kartica z zneskom.
 *
 * Dve opombi in ne ena: kartica v PDF-ju je široka okoli 34 mm pri 6,8 pt, zato
 * vanjo gre kakšnih petdeset znakov. Daljše besedilo se ne prelomi na naslednjo
 * kartico, ampak se izriše ČEZ rob okvirja. Sosednji zapis je edini način, da
 * se krajša različica ne razide s tisto na zaslonu — prav to se je zgodilo, ko
 * sta bili vsaka v svoji datoteki.
 */
export interface FigureCopy {
  title?: string;
  /** Zaslon: prostora je dovolj, opomba sme pojasniti. */
  note?: string;
  /** PDF kartica: ista trditev v enem stavku. */
  shortNote?: string;
}

export interface SegmentCopy {
  id: SegmentId;

  /**
   * ČISTO ime dejavnosti, brez velikostnega razpona ("Proizvodnja", ne
   * "Proizvodnja 10–249 zaposlenih"): trdo zapisan razpon je ostal na zaslonu
   * tudi pri vnosu 250+ zaposlenih. Dejanski razred pripne ob izrisu
   * segmentLabelWithSize (copy/index.ts) iz vnesenega števila — tam, kjer ime
   * vidi obiskovalec ("Izračun prilagojen za: …") in v glavi strankinega PDF-ja.
   * Prodajna priprava (salesReport.qualification) razred vodi kot LOČENO polje
   * sizeClass in ime uporablja golo.
   */
  displayName: string;

  /**
   * Korak 1 — uvodni zaslon. Izriše se šele, ko je izbira dejavnosti POPOLN
   * odgovor (isCompleteIndustryChoice); do tedaj velja NEUTRAL_COPY.landing.
   * Sam "drugo" ni odgovor, ker manjka podizbira, zato hero tam še ne zamenja.
   *
   * Obljuba ponudbe (brez e-naslova, koliko časa vzame) je v SHARED_COPY -
   * enaka je za vse in sedem prepisov bi se razšlo ob prvi spremembi.
   */
  landing: {
    /** Naslovno vprašanje. Kratko: pod njim je spustni seznam, ki se ne sme premakniti. */
    heroTitle: string;
    /** Ena poved o tem, kje denar odteka prav v tej dejavnosti. */
    heroSubtitle: string;
  };

  /** Korak 3 — kontekst. Legende in možnosti ostanejo v config/contexts/: to so vprašanja. */
  context: {
    title: string;
    intro: string;
  };

  /**
   * Korak triaže. Pozivi posameznih področij (triage.prompt) in oznake ocen so
   * v config/modules/ — tudi to so vprašanja.
   */
  triage: {
    title: string;
    intro: string;
  };

  /**
   * Korak skupne finančne osnove. Naslov je funkcijska oznaka in ostane skupen,
   * dokler ga dejavnost ne prepiše; uvod pove, katere številke sledijo in zakaj.
   */
  costBasis: {
    title?: string;
    intro: string;
  };

  /**
   * Strani z vnosi. Vse troje je funkcijska oznaka, ne sporočilo, zato je
   * privzeto skupno — panožna različica "Naprej" bi bila slabši, ne boljši copy.
   */
  inputs?: {
    hoursFootnote?: string;
    runningTotalLabel?: string;
    lastPageCta?: string;
  };

  results: {
    /**
     * h1 strani z rezultatom. TRDITEV, ne vprašanje: stran, ki naj odgovori, se
     * je doslej začela z istim vprašanjem kot uvodni zaslon. Pod njim stoji
     * znesek, zato se naslov bere kot njegov uvod.
     */
    headline: string;
    heroLabel?: string;
    /**
     * Ena poved pod zneskom: iz česa je sestavljen. Hero brez nje je trditev,
     * z njo je izračun — in prav to je razlika, ki jo ta vprašalnik prodaja.
     */
    heroNote?: string;
    /**
     * Vrstica pod hero zneskom z oznako {count} za število. Izriše se samo pri
     * dejavnosti s kapacitetnim preračunom — danes edino računovodstvo.
     * null pomeni "ta dejavnost te vrstice nima".
     */
    capacitySecondary?: string | null;
    breakdownTitle?: string;
    capacityTitle?: string;
    risksTitle?: string;
    unmeasuredTitle?: string;
  };

  /**
   * Kartice z zneski — ista besedila na zaslonu IN v PDF-ju.
   *
   * Doslej sta bili to dve evidenci z različnimi besedami: pdf.ts je v poročilu
   * vsakega proizvajalca še vedno pisal "prazna polica, napačna cena", čeprav je
   * bilo isto besedilo na zaslonu že panožno nevtralizirano.
   */
  figures: {
    /**
     * note je obvezen: naštejejo se postavke, ki jih TA dejavnost dejansko meri.
     * Proizvodni "izmet" prevozniku ne pove ničesar in vzbudi dvom o celotnem
     * izračunu. Sme našteti samo tisto, kar je res knjižen odliv.
     */
    directLoss: FigureCopy & { note: string };
    lostMargin?: { title?: string; note?: string };
    /** note se izpiše ZA predpono "X h/mesec. " — ure doda izrisovalec, ne besedilo. */
    capacity?: { title?: string; note?: string };
    oneTimeCapital?: { title?: string; note?: string };
    potential?: { title?: string; note?: string };
  };

  /** Obrazec med vnosi in rezultati — odklene rezultat na zaslonu in PDF poročilo. */
  emailGate: {
    /**
     * Mora poimenovati OBOJE, kar obrazec odklene: REZULTAT in POROČILO. Naslov,
     * ki bi obljubil samo PDF, pusti vtis, da je rezultat brezplačen (tako je
     * nekoč pisalo na uvodu); naslov brez poročila pa bi razšel gumb na
     * rezultatih ("Prenesi PDF poročilo") z obljubo, ki jo je obiskovalec
     * pravkar izpolnil. Varuje ga copy.test.ts.
     */
    title: string;
    subtitle: string;
    consultingTitle?: string;
    consultingNote?: string;
  };

  /**
   * Naslov v temni glavi strankinega PDF-ja. Dokument gre upravi — naslov je
   * edino, kar prebere, preden pogleda znesek. Noga in ime datoteke ostaneta
   * skupna: prvo je znamka, drugo konvencija.
   */
  pdf?: { documentTitle?: string };
}

/**
 * Razrešeno besedilo — kar dobijo komponente. Vsako polje obstaja, zato nikjer
 * ni "?? nevtralno besedilo": rezerva ima eno mesto, ne enega na izrisovalca.
 * Isto načelo kot emptyProfileFor v contexts/contextTypes.ts.
 */
export interface ResolvedSegmentCopy {
  id: SegmentId;
  displayName: string;
  landing: Required<SegmentCopy['landing']>;
  context: Required<SegmentCopy['context']>;
  triage: Required<SegmentCopy['triage']>;
  costBasis: Required<SegmentCopy['costBasis']>;
  inputs: Required<NonNullable<SegmentCopy['inputs']>>;
  results: Required<SegmentCopy['results']>;
  figures: {
    directLoss: Required<SegmentCopy['figures']['directLoss']>;
    lostMargin: Required<FigureCopy>;
    capacity: Required<FigureCopy>;
    oneTimeCapital: Required<FigureCopy>;
    potential: Required<FigureCopy>;
  };
  emailGate: Required<SegmentCopy['emailGate']>;
  pdf: Required<NonNullable<SegmentCopy['pdf']>>;
}

/**
 * Besedila, ki se po dejavnosti NE smejo razlikovati.
 *
 * Trije razlogi za vpis sem in noben drug: (1) niz je vprašanje ali oznaka
 * kontrolnika, (2) niz je pravna ali metodološka ograda, ki mora povsod stati
 * enako, (3) niz nosi slovensko dvojino ali drugo sklanjatveno logiko, ki bi se
 * v sedmih prepisih razšla.
 *
 * Kar je tu, namenoma ni v SegmentCopy: polje, ki bi ga sedem datotek prepisalo
 * z isto vsebino, je vabilo, da se šesta pozabi.
 */
export const SHARED_COPY = {
  /**
   * Obljuba ponudbe pod naslovom uvodnega zaslona. Ista v vseh dejavnostih, ker
   * je ista ponudba — "okoli deset minut" pa mora držati tudi po prepisu naslova.
   *
   * Obrazec s kontaktom stoji PRED rezultatom, zato uvod tega ne sme zamolčati:
   * kdor za kontakt izve šele na predzadnjem koraku, to bere kot past. Prav
   * nasprotno je uvod nekoč obljubljal ("rezultat vidite brez vnosa e-naslova").
   */
  landingOffer:
    'Dobite razčlenjen letni znesek po področjih — z vašimi številkami in formulo pod vsako postavko, na zaslonu in v PDF poročilu za upravo. Za priporočena tri področja vzame okoli deset minut; pred rezultatom vas prosimo za kontakt.',

  /** Vprašanje, ne nagovor: sedem različic bi razšlo tudi izvoz vprašalnika. */
  employeeCountTitle: 'Koliko ljudi zaposlujete?',
  employeeCountNote:
    'Podatek ne vstopa v noben znesek — iz njega izpeljemo velikostni razred podjetja in preverimo, ali so vnesene ure skladne z velikostjo vaše ekipe.',
  /**
   * Sporočilo ob kliku na "Naprej" brez vnosa. Gumb ni onemogočen: siv gumb ne
   * pove, KAJ manjka, in samostojni podjetnik, ki pošteno vpiše 0, je obtičal
   * brez razlage. Drugi stavek mu pove, da šteje tudi sebe.
   */
  employeeCountMissing:
    'Vpišite število zaposlenih — vsaj 1. Če ste samostojni podjetnik brez zaposlenih, štejte sebe.',

  /**
   * Primarni gumb na rezultatih: poročilo prenese neposredno, brez vmesnega
   * zaslona — obrazec je obiskovalec izpolnil že PRED rezultati. Vsak klik je
   * sveža gesta, zato prenos ne odpade, kot je nekoč samodejni po oddaji.
   * Poimenuje isti dokument, ki ga je obljubil naslov obrazca (emailGate.title)
   * — varuje copy.test.ts.
   */
  resultsPrimaryCta: 'Prenesi PDF poročilo',

  /**
   * Oznaka in pojasnilo zanesljivosti.
   *
   * Metodološka ograda: ista v vseh dejavnostih, sicer bi bili rezultati med
   * njimi neprimerljivi.
   *
   * confidenceNotePdf je namerno v drugem slovničnem licu. Zaslon govori
   * obiskovalcu, ki je pravkar vnašal ("Vnesli ste"), poročilo pa kroži po
   * upravi in ga bere nekdo, ki obrazca ni izpolnil ("Vnesene so"). Doslej sta
   * ta dva zapisa živela vsak v svoji datoteki in nihče ni vedel, da obstajata
   * oba; tu sta drug ob drugem, da se razlika vidi in zavestno vzdržuje.
   */
  confidenceLabel: {
    high: 'Visoka zanesljivost',
    medium: 'Srednja zanesljivost',
    low: 'Nizka zanesljivost',
  },
  confidenceNote: {
    high: 'Vnesli ste konkretne ure, stroške in glavni vzrok. Številke stojijo na vaših podatkih.',
    medium:
      'Del vrednosti je iz izbranih razponov ali privzetih ocen. Rezultat je pravega velikostnega reda.',
    low: 'Večina ključnih podatkov manjka, zato so zneski označeni kot "najmanj" — dejanski so praviloma višji, ne nižji.',
  },
  confidenceNotePdf: {
    high: 'Vnesene so konkretne ure, stroški in glavni vzroki. Številke stojijo na podatkih podjetja.',
    medium:
      'Del vrednosti izhaja iz izbranih razponov ali privzetih ocen — rezultat je pravega velikostnega reda.',
    low: 'Večina ključnih podatkov manjka, zato so zneski spodnja meja — dejanski so praviloma višji, ne nižji.',
  },

  /** Trditev o zasebnosti. Panožna različica bi bila vabilo k razhajanju. */
  privacyNote:
    'Ves izračun poteka v vašem brskalniku. Nič od vnesenih podatkov ne zapusti brskalnika, dokler se sami ne odločite oddati obrazca za PDF poročilo.',

  /**
   * Večletni pogled in cena odlašanja.
   *
   * Metodološka ograda, ne nagovor: obe številki sta gola preračuna letnega
   * zneska, in prav to morata povedati. "Ob nespremenjenem načinu dela" ni
   * mašilo — je predpostavka, brez katere trojni znesek ne bi bil pošten.
   * Oznaki nosita vzorec {value}, ker znesek sestavi izrisovalec.
   */
  horizonLabel: 'V treh letih',
  horizonNote:
    'Ob nespremenjenem načinu dela in brez rasti. Zmnožek letnega zneska s tremi — brez inflacije in brez diskontiranja, ker bi vsaka od teh predpostavk terjala svojo obrambo.',
  delayNote: 'To je {daily} vsak delovni dan oziroma {monthly} za vsak mesec brez odločitve.',

  /**
   * Časovne leče ob naslovnem znesku.
   *
   * Isti letni znesek, izražen v treh obdobjih. Dnevni ekvivalent je edina
   * številka na strani, ki jo bralec preveri na pamet, in zato tista, ki letnemu
   * znesku podeli verodostojnost — doslej je bil zakopan v opombo pod večletnim
   * pogledom. Tretja leča je večletni pogled sam (horizonLabel zgoraj).
   */
  lensDayLabel: 'Na delovni dan',
  lensMonthLabel: 'Na mesec',

  /**
   * Naslovi grafičnih razdelkov. Metodološke oznake in ne nagovor: povedati
   * morajo, kaj slika prikazuje, in to enako v vseh dejavnostih.
   */
  compositionTitle: 'Iz česa je znesek sestavljen',
  compositionNote:
    'Tri vrste denarja v enem znesku. Naložena vrstica pokaže, koliko prispeva vsaka — odtekli stroški, nezaslužena marža in vrednost izgubljenih ur.',
  projectionTitle: 'Kako znesek raste z odlašanjem',
  coverageTitle: 'Koliko področij je izmerjenih',

  /** Nadomestna besedila slik za bralnike zaslona — iste številke so v besedilu ob njih. */
  compositionChartAlt:
    'Sestava letnega zneska po treh vrstah denarja v obliki naložene vrstice. Iste številke so navedene ob njej.',
  coverageChartAlt: 'Delež izmerjenih področij v obliki vrstice. Isti podatek je zapisan pod njo.',
  projectionChartAlt:
    'Kumulativni znesek po letih v obliki stolpcev. Iste številke so navedene ob stolpcih.',

  /**
   * Kaj v znesku NI zajeto.
   *
   * Ograde so bile razpršene po opombah kartic, pod grafom in v razdelku o
   * neizmerjenem — kjer jih bralec sreča šele, ko si je o številki že ustvaril
   * mnenje. Zbrane povedo eno stvar: izračun meri manj, kot podjetje dejansko
   * izgublja. Prav to je razlika med konservativno oceno in podcenjeno.
   */
  notIncludedTitle: 'Česa ta znesek ne vsebuje',
  notIncluded: [
    'Režije na sproščene ure — najemnina, vodenje in amortizacija tečejo naprej, zato jih ne štejemo.',
    'Rasti podjetja in rasti plač; izračun stoji pri današnjem obsegu in današnjih postavkah.',
    'Področij, ki jih niste izmerili — ta v znesek ne vstopajo z nobenim evrom.',
    'Vsega, kar ste označili z "Ne vem": tam smo vzeli najbolj zadržano vrednost.',
  ],
  notIncludedClosing: 'Dejanski strošek je torej višji od prikazanega, ne nižji.',

  /**
   * Tabela povračila. NI ponudba in ne sme je spominjati.
   *
   * V tem repozitoriju ni nobene cene in vsebina to izrecno prepoveduje
   * (content/sales/pantheonFit.ts, content/sales/licences.ts). Stopnje so zato
   * primerjalne in brez imena izdelka, ograda pod tabelo pa ponovi isto, kar
   * prodajnemu gradivu nalaga PANTHEON_FIT_CONFIRM.
   */
  paybackTitle: 'Pri kateri investiciji se to povrne',
  paybackNote:
    'Primerjalne vrednosti, ne ponudba: koliko časa bi trajalo, da se vloženi znesek povrne iz zgoraj ocenjenega letnega potenciala. Točen obseg in ceno potrdi svetovalec po veljavnem ceniku.',
  paybackInvestmentHeader: 'Primerjalna investicija',
  paybackDurationHeader: 'Povrne se v',
} as const;

/**
 * Nevtralno besedilo: rezerva za neobvezna polja IN naslov uvodnega zaslona,
 * dokler dejavnost ni izbrana.
 *
 * Ni "splošna dejavnost" — segment splosno ima svojo datoteko. To je besedilo za
 * trenutek, ko o obiskovalcu ne vemo še ničesar, in privzetek za vse, česar
 * posamezna dejavnost ne prepiše.
 */
export const NEUTRAL_COPY: ResolvedSegmentCopy = {
  id: 'splosno',
  displayName: 'Vaše podjetje',

  landing: {
    heroTitle: 'Koliko vas stane sedanji način dela?',
    // Zadnji stavek je namenoma poziv k izbiri: naslov se bo ob njej zamenjal in
    // obiskovalec mora vedeti, da to ni napaka, ampak prilagoditev.
    heroSubtitle:
      'Ročno delo, napake, vezan kapital in zamude nimajo svoje vrstice v izkazu — plačate jih skozi maržo. Izberite dejavnost in izračun se prilagodi vašemu poslovanju.',
  },

  context: {
    title: 'Nekaj o vašem podjetju',
    intro:
      'Tri vprašanja, ki ne sprašujejo po številkah. Iz njih izvemo, kako danes delate — to nam pove, o čem se je smiselno pogovoriti, in nam pomaga razumeti, zakaj stroški sploh nastajajo. V izračun zneskov ta odgovor ne vstopa.',
  },

  triage: {
    title: 'Kje vas najbolj tišči?',
    intro:
      'Na hitro ocenite vsako področje. Podrobna vprašanja vam nato zastavimo samo za največje težave — tako vprašalnik ostane kratek, izračun pa specifičen za vaše podjetje.',
  },

  costBasis: {
    title: 'Skupna finančna osnova',
    intro:
      'Nekaj številk, ki veljajo za vsa področja. Polni strošek ure pomeni bruto plačo s prispevki delodajalca ter regresom, malico in prevozom — ne neto izplačila in ne režije.',
  },

  inputs: {
    hoursFootnote:
      'Sproščene ure ne pomenijo nižje plačne mase — zaposleni ostane. Gre za čas, ki ga lahko usmerite v drugo delo.',
    runningTotalLabel: 'Trenutni letni strošek izbranih področij',
    /**
     * Zadnja stran vnosov pelje na obrazec s kontaktom, ne na rezultat. Nekdanji
     * "Poglej rezultat" je bil točen, dokler so rezultati sledili vnosom; gumb,
     * ki obljubi rezultat in pristane na obrazcu, je prav razkorak, kakršnega
     * je ta koda že enkrat odpravila (glej emailGate.title).
     */
    lastPageCta: 'Zaključi vnos',
  },

  results: {
    headline: 'Toliko vas stane sedanji način dela',
    heroLabel: 'Skupaj na leto',
    // Naslovi razdelkov in ta opomba so metodologija, ne nagovor: povedo, kako je
    // znesek sestavljen. Ista razlaga povsod je pogoj, da je izračun primerljiv.
    heroNote:
      'V vsoti so tri vrste zneska: denar, ki odteka, marža, ki je niste zaslužili, in vrednost izgubljenega časa. Sprostljiv obratni kapital je zunaj nje — enkraten znesek se z letnimi ne sešteva.',
    capacitySecondary: null,
    breakdownTitle: 'Razčlenitev po področjih',
    capacityTitle: 'Kje se izgublja kapaciteta',
    risksTitle: 'Podatki in procesna tveganja',
    unmeasuredTitle: 'Česa nismo izmerili',
  },

  figures: {
    directLoss: {
      title: 'Neposredni letni stroški',
      note: 'Denar, ki dejansko odteka, ne izgubljen čas.',
      shortNote: 'Denar, ki dejansko odteka, ne izgubljen čas.',
    },
    lostMargin: {
      title: 'Nezaslužena letna marža',
      note: 'Marža, ki je niste zaslužili — posel, do katerega ni prišlo, ali prodaja po napačni ceni. Denar ni odtekel, zato je prikazana ločeno.',
      // Prejšnja različica v PDF-ju je navajala "prazna polica, napačna cena" —
      // trgovinski primer, ki je pristal tudi v poročilu proizvajalca.
      shortNote: 'Posel, do katerega ni prišlo, ali prodaja po napačni ceni.',
    },
    capacity: {
      title: 'Vrednost izgubljene kapacitete',
      note: 'To ni prihranek pri plačah — zaposleni ostane, njegov čas pa se lahko usmeri v delo, ki prinaša vrednost.',
      // Mala začetnica namenoma: v PDF-ju se izpiše ZA "10 h/mesec — ".
      shortNote: 'ni prihranek pri plačah, zaposleni ostane.',
    },
    oneTimeCapital: {
      title: 'Sprostljiv obratni kapital',
      note: 'Enkraten učinek, ne letni prihranek — zato se z zneski zgoraj ne sešteva.',
      shortNote: 'Enkraten učinek — z zneski zgoraj se ne sešteva.',
    },
    potential: {
      title: 'Ocenjen naslovljiv potencial',
      // "ni obljuba prihranka" je ograda, ki mora preživeti vsak prepis — varuje
      // jo copy.test.ts. Brez nje se konservativna ocena bere kot zaveza.
      // Sistemi, ki jih podjetje danes uporablja, se tu namenoma ne omenjajo:
      // v oceno vstopajo samo glavni vzroki, sicer bi bil diskont dvojen.
      note: 'Letno. Del izmerjenega stroška, ki ga je po glavnih vzrokih, ki ste jih navedli, realno mogoče odpraviti. Ni obljuba prihranka, ampak konservativen poslovni potencial, ki ga je mogoče preveriti na uvodnem sestanku.',
      shortNote: 'Letno, po glavnih vzrokih — konservativna ocena, ne obljuba prihranka.',
    },
  },

  emailGate: {
    title: 'Rezultat in PDF poročilo z akcijskim načrtom',
    subtitle:
      'Po oddaji se na zaslonu odpre vaš izračun in z njim PDF poročilo za upravo — razčlenjeno po področjih, s formulo pod vsako postavko in tremi ukrepi za področje z največjim zneskom.',
    consultingTitle: 'Želite, da vaše številke pregledamo skupaj?',
    consultingNote:
      'Brez obveznosti. Svetovalec pogleda vaš izračun in pove, katere postavke je v vašem primeru mogoče nasloviti najhitreje.',
  },

  pdf: {
    documentTitle: 'Analiza skritih stroškov sedanjega načina dela',
  },
};
