/**
 * LM-10 — beleženje oddaj vprašalnika v Google Sheet.
 *
 * Sprejme POST, ki ga pošlje `src/lib/submitLead.ts`, in doda eno vrstico na
 * list. Navodila za namestitev so v `tools/google-sheet/README.md`; brez njih
 * ta datoteka nima učinka — v repozitoriju je zato, da koda skripte ni samo v
 * brskalniku enega računa.
 *
 * ŠTIRIH REČI SE NE SPLAČA SPREMINJATI, ne da bi prej prebrali, zakaj so take:
 *
 * 1. STOLPCEV SKRIPTA NE POZNA. Glava in vrstica prideta v telesu zahteve
 *    (`sheet.columns`, `sheet.row`), sestavi ju `src/lib/exportRecord.ts`, kjer
 *    ju pokriva test. Če bi jih sestavljala skripta, bi bila preslikava
 *    podvojena — nov stolpec v aplikaciji bi tiho zamaknil vse podatke v
 *    preglednici, dokler ne bi kdo posodobil še te datoteke.
 * 2. VRSTICA SE PIŠE PO IMENIH STOLPCEV in ne po zaporedju. Nov stolpec se zato
 *    pripne na konec glave, obstoječe vrstice pa ostanejo poravnane.
 * 3. NAPAKA SE VRŽE NAPREJ. Apps Script pri `ContentService` vedno odgovori 200,
 *    zato aplikacija bere TELO odgovora: `{ ok: true }` je uspeh, vse drugo —
 *    tudi Googlova stran z napako — je neuspela dostava, po kateri stranka dobi
 *    samo prenos svojega poročila. Vsaka pot, ki ne konča z zapisano vrstico, mora
 *    zato pustiti napako ven (glej `doPost`).
 * 4. PRIPRAVA NIKOLI STRANKI. Strankino poročilo gre tudi STRANKI — na naslov
 *    iz obrazca, s samo njenim PDF-jem. Odloča oznaka `audience` na prilogi:
 *    'customer' je poročilo za stranko, 'sales' je priprava na pogovor in tej
 *    poti ne ubere nikoli, tudi z napačnim imenom datoteke. Velja v obeh načinih
 *    pošiljanja: v `posljiPorociloStranki` (MailApp) odloča o prilogi, v načinu
 *    ActiveCampaign pa o tem, kateri PDF pristane v katerem polju (strankin v
 *    %PDF_LINK%, priprava v %PDF_LINK_PRODAJA%).
 *
 * KDO POŠILJA. Privzeto ActiveCampaign (`POSTA_PREK_AC`): skripta oba PDF-ja
 * shrani na Drive, povezavi zapiše v vrstico in v polji kontakta, e-pošto stranki
 * in obvestilo prodaji pa pošljeta avtomatizaciji v AC — s pošiljatelja Datalab
 * in ne z računa, ki je skripto razmestil. Brez nastavljenega AC (ali z
 * `POSTA_PREK_AC: false`) pošilja skripta sama, z MailApp, kot doslej.
 *
 * Telo lahko nosi še `attachments[]` — PDF-ja v base64 (prilogi obvestila v
 * načinu MailApp, vir datotek za Drive v načinu AC; glej `pripraviPriloge`,
 * `shraniPorocilo`, `shraniPripravo`). Skripta mora delati tudi brez njih:
 * starejši build aplikacije jih ne pošlje, PDF pa v brskalniku tudi kdaj ne
 * nastane. Po vsaki
 * spremembi te datoteke je treba razmestiti NOVO RAZLIČICO (Deploy → Manage
 * deployments → New version) in znova vpisati E_NASLOV_ZA_OBVESTILA, ker ga
 * datoteka v repozitoriju nima.
 *
 * Odgovor `doPost` pove aplikaciji, ali je poročilo odšlo stranki
 * (`customerReport`, glej `odgovorOddaje`): na rezultatih tedaj pokaže
 * obvestilo namesto gumba za prenos, sicer gumb. Razmestitev: NAJPREJ nova
 * različica te skripte, ŠELE NATO objava aplikacije — vsaka kombinacija stare
 * in nove deluje (stara aplikacija brez oznake: poročilo se prepozna po imenu
 * datoteke; stara skripta brez odgovora: aplikacija ponudi gumb), a le v tem
 * vrstnem redu ves čas drži obljuba, ki jo nova aplikacija da že na obrazcu:
 * "PDF poročilo prejmete na vpisani e-naslov".
 *
 * Telo lahko namesto `record` nosi `events` in `visit` — dogodke lijaka, ki jih
 * pošilja src/lib/funnel.ts. Ti gredo na list Dogodki, iz njega pa
 * `sestaviLijak` naredi list Lijak: kje obiskovalci odnehajo. Glej razdelek
 * LIJAK na dnu datoteke.
 */

var NASTAVITVE = {
  /** List, na katerega se piše. Nastane sam, če ga ni. */
  IME_LISTA: 'Leadi',

  /** List s pregledom številk. Nastane in se sestavi ob `urediStolpce`. */
  IME_LISTA_ANALITIKA: 'Analitika',

  /** List s surovimi dogodki lijaka — ena vrstica na dogodek (glej razdelek LIJAK). */
  IME_LISTA_DOGODKI: 'Dogodki',

  /** List s povzetkom lijaka. Sestavi ga `sestaviLijak` (ročno ali dnevna ura). */
  IME_LISTA_LIJAK: 'Lijak',

  /**
   * Koliko dni nazaj šteje povzetek lijaka. 0 = vsi dogodki. Pri majhnem
   * prometu pustite 0: pri dvajsetih obiskih na teden je odstotek za zadnjih
   * sedem dni šum. Ožje obdobje ima smisel, ko se vprašalnik spremeni in je
   * treba primerjati prej in potem.
   */
  LIJAK_OBDOBJE_DNI: 0,

  /**
   * Po koliko dneh dnevna ura pobriše surove dogodke. 0 = nikoli. Obisk pusti
   * okoli deset vrstic; pri sto obiskih na dan je to milijon celic na leto
   * (meja preglednice je deset milijonov), zato je brisanje vprašanje šele
   * drugega leta.
   */
  DOGODKI_HRANI_DNI: 0,

  /**
   * Neobvezen žeton (`?zeton=...` v naslovu webhooka). Prazno = izklopljeno.
   *
   * NI skrivnost: naslov webhooka je zaradi predpone VITE_ v javnem svežnju
   * aplikacije in ga lahko prebere vsak obiskovalec. Ustavi naključne robote,
   * ne pa nekoga, ki pogleda izvorno kodo strani.
   */
  ZETON: '',

  /**
   * Prodajna priprava (HTML) se shrani na Drive, v vrstico gre povezava.
   *
   * Ob delujočem webhooku se priprava stranki NE prenese — če je skripta ne
   * shrani, ne obstaja nikjer. Izklopite samo, če ste ji našli drugo pot.
   */
  SHRANI_PRIPRAVO: true,
  IME_MAPE_PRIPRAV: 'LM-10 prodajne priprave',

  /**
   * Strankino poročilo (PDF) se shrani na Drive, povezava gre v stolpec
   * `porociloPdf` in v ActiveCampaign kot polje %PDF_LINK%.
   *
   * V načinu POSTA_PREK_AC je ta povezava EDINA pot, po kateri stranka dobi
   * poročilo — brez nje avtomatizacija v AC nima česa poslati (doGet na to
   * opozori). V načinu MailApp je kopija za CRM: PDF stranka dobi v prilogi,
   * svetovalec pa ga odpre iz kartice kontakta. Napaka pri shranjevanju ne vrže:
   * v celici ostane "NAPAKA: …", polje v AC izpade (`shraniPorocilo`).
   */
  SHRANI_POROCILO: true,
  IME_MAPE_POROCIL: 'LM-10 poročila strankam',

  /**
   * true = datoteka poročila je dostopna vsakomur s povezavo, samo za branje.
   * Brez tega povezava iz AC vsakomur razen računu skripte odpre "Zahtevajte
   * dostop" — tudi stranki v sporočilu iz AC. Povezava nosi naključen id in ni
   * uganljiva; kdor jo ima, jo je dobil od nas ali od stranke.
   *
   * V načinu POSTA_PREK_AC je enako deljena tudi PRIPRAVA (`shraniPripravo`):
   * obvestilo prodaji pride iz AC in svetovalec ga odpre v telefonu, brez
   * prijave v Google. Zavestna odločitev — dokument O stranki je s tem dosegljiv
   * vsakomur, ki povezavo pozna, zato obvestil ne posredujte naprej. V načinu
   * MailApp ostane priprava nedeljena: tam gre kot priloga in povezave nihče ne
   * potrebuje.
   */
  POROCILO_DOSTOPNO_S_POVEZAVO: true,

  /**
   * Komu gre obvestilo ob vsaki oddaji. Prazno = brez obvestil.
   * Več naslovov ločite z vejico: 'prodaja@datalab.si, jan@datalab.si'.
   */
  E_NASLOV_ZA_OBVESTILA: '',

  /**
   * Strankino poročilo (PDF) gre na e-naslov iz obrazca — s tega računa.
   * Pripeta je SAMO priloga z oznako `audience: 'customer'`; priprava na
   * pogovor stranki ne gre nikoli (načelo 4 v glavi). false = stranka poročilo
   * prenese sama: aplikacija ob takem odgovoru na rezultatih ponudi gumb.
   */
  POSLJI_POROCILO_STRANKI: true,

  /**
   * KDO POŠILJA obe sporočili — poročilo stranki in obvestilo prodaji.
   *
   * true (privzeto) = ActiveCampaign. Skripta oba PDF-ja shrani na Drive,
   * povezavi zapiše v polji kontakta (%PDF_LINK%, %PDF_LINK_PRODAJA%), pošlje pa
   * NIČESAR — sporočili odpravita avtomatizaciji v AC, sproženi ob spremembi
   * polja. Pošiljatelj je s tem Datalabov račun v AC in ne račun, ki je skripto
   * razmestil; cena je, da sporočili prispeta v minuti ali dveh in da nosita
   * povezavi namesto prilog (AC prilog ne zna).
   *
   * false = skripta pošilja sama z MailApp, kot je bilo pred priklopom AC.
   *
   * VELJA SAMO OB NASTAVLJENEM AC (`postaPrekAC`): brez lastnosti AC_NASLOV /
   * AC_KLJUC / AC_SEZNAM ta nastavitev ne stori ničesar in pošilja MailApp —
   * sicer bi napačna nastavitev pomenila leada brez vsakega sporočila.
   * Podrobnosti in postavitev avtomatizacij: README, razdelek ActiveCampaign.
   */
  POSTA_PREK_AC: true,

  /**
   * Prikazano ime pošiljatelja. NASLOV pošiljatelja je račun, ki je skripto
   * razmestil — MailApp drugega ne zna — zato skripta sodi na Datalabov
   * Workspace račun, ne na zasebnega. Tja pride tudi odbita pošta (napačno
   * vpisan naslov), ne na ODGOVORI_NA.
   */
  IME_POSILJATELJA: 'Datalab',

  /** Kam gre strankin odgovor na poročilo. Prazno = na račun skripte. */
  ODGOVORI_NA: 'prodaja@datalab.si',

  /**
   * ActiveCampaign. Naslov računa, ključ API in id seznama NISO tu, ampak v
   * lastnostih skripte (Nastavitve projekta → Lastnosti skripte): ta datoteka je
   * v repozitoriju in ključ bi bil s tem v gitu. Stranski dobiček je, da
   * nastavitve preživijo lepljenje nove različice te datoteke — za razliko od
   * E_NASLOV_ZA_OBVESTILA zgoraj.
   */
  AC: {
    /**
     * false = vsak lead gre na seznam kot NAROČEN (status 1). Tržna privolitev
     * iz obrazca gre zraven kot oznaki `LM-10 privolitev: ponudbe` in
     * `LM-10 privolitev: vsebine` (glej `acOznake`) — kampanje se segmentirajo
     * po njih, ne po statusu na seznamu.
     * true = naročen je le, kdor je privolil; ostali pridejo na seznam kot
     * ODJAVLJENI (status 2). Pozor: privzeti pogled seznama v AC odjavljenih ne
     * kaže — leadi so tam, videti pa jih ni. Glej `acNaSeznam`.
     */
    SAMO_S_PRIVOLITVIJO: false,

    /** Predpona vseh oznak v AC. Po njej se v CRM-ju loči, od kod je kontakt. */
    OSNOVNA_OZNAKA: 'LM-10',

    /**
     * true = kontakt gre v AC že ob oddaji (in ob zamudi vseeno pade na uro).
     * false = vse prepusti uri; lead je v CRM-ju v nekaj minutah namesto takoj.
     */
    POSILJAJ_TAKOJ: true,

    /**
     * Koliko zaostalih vrstic sme pobrati en zagon ure.
     *
     * Nizko namenoma. Ura drži ISTO ključavnico kot oddaja leada, in to ves čas
     * svoje zanke — pri vsaki vrstici gredo trije klici v ActiveCampaign, torej
     * bi trideset vrstic ključavnico držalo tudi pol minute. Oddaja, ki bi
     * medtem prišla, bi čakala; aplikacija ima na voljo petindvajset sekund, ob
     * prekoračitvi pa razume dostavo kot neuspelo in stranki ponudi prenos
     * poročila, ki je morda že na poti.
     *
     * Pet vrstic drži ključavnico nekaj sekund. Zaostanek se zato pobere v več
     * zaporednih zagonih, kar pri minutnem intervalu (`namestiUroZaAC`) ni ovira:
     * pet leadov na minuto je tristo na uro.
     */
    NAJVEC_NA_ZAGON: 5,
  },

  /** Prazno = skripta teče v preglednici (Razširitve → Apps Script). */
  ID_PREGLEDNICE: '',
};

/** Stolpca, ki ju doda skripta; pred stolpci iz aplikacije, ker se bereta prva. */
var PREJETO = 'prejeto';
var PRIPRAVA = 'prodajnaPriprava';

/**
 * Izid pošte stranki: "poslano <čas>" ali "ni poslano: <razlog>". Zapiše se
 * ŠELE za vrstico (kot `activeCampaign`), zato mora ime obstajati že ob zapisu
 * — glej `dopolniIzpeljano`. Klicatelj tako vidi, ali ima stranka poročilo,
 * ne da bi brskal po pošti.
 */
var POROCILO_STRANKI = 'porociloStranki';

/**
 * Povezava do strankinega PDF-ja na Drivu (`shraniPorocilo`) — isti dokument,
 * kot ga stranka dobi po e-pošti. Od tod gre v ActiveCampaign (%PDF_LINK%),
 * da ga svetovalec odpre iz kartice kontakta, ne da bi brskal po pošti.
 */
var POROCILO_PDF = 'porociloPdf';

/**
 * Kontakt prodaje v sporočilu stranki — isti kot v aplikaciji
 * (`src/config/salesContact.ts`); spremembo je treba narediti na obeh mestih.
 */
var KONTAKT_PRODAJE = { ime: 'Datalab prodaja', telefon: '01 252 89 50', email: 'prodaja@datalab.si' };

/**
 * Stolpec z id-jem kontakta v ActiveCampaignu ali z napako zadnjega poskusa.
 *
 * Deklariran TU in ne v razdelku AC na dnu: `VRSTNI_RED` ga navede že zgoraj,
 * `var` na dnu datoteke pa se ovrednoti šele za njim — v vrstnem redu bi
 * pristal `undefined` in stolpec bi vsakič pristal na koncu lista.
 */
var AC_STOLPEC = 'activeCampaign';

/**
 * Izpeljani stolpec: prošnja za posvet, zapisana tako, da jo klicatelj vidi ob
 * telefonski številki.
 *
 * `consentConsulting` isto pove z "true"/"false" in ostane skrit — po njem
 * filtrira stroj. Ta stolpec je za oko: v seznamu leadov mora biti v pol
 * sekunde jasno, koga je obljubljeno poklicati.
 */
var KLICI_TAKOJ = 'kliciTakoj';

/**
 * Izpeljani stolpec: skupni letni znesek — vsota odliva, nezaslužene marže in
 * vrednosti časa.
 *
 * Ista številka je uvodna poved klica in je bila doslej SAMO v e-obvestilu
 * (`posljiObvestilo`). V preglednici je klicatelj ni mogel dobiti drugače kot s
 * seštevanjem treh stolpcev na pamet.
 */
var LETNO = 'letno';

/**
 * Stolpci, v katere piše KLICATELJ in ne aplikacija.
 *
 * Stojijo takoj za `email` in ne skrajno desno: pot od telefonske številke do
 * polja za vpis bi bila sicer dve do tri širine zaslona, ravnanje, ki terja
 * toliko drsenja, pa se ne obdrži — klicatelj si začne beležiti drugam in
 * stolpci ostanejo prazni.
 *
 * Lega je čista ergonomska izbira, brez podatkovnih posledic: nova oddaja jih ne
 * more povoziti, ker `zapisiVrstico` piše po IMENIH stolpcev, teh imen pa v
 * oddaji ni — pusti jih prazne v svoji vrstici in se že vpisanih vrstic sploh ne
 * dotakne. `urediStolpce` pa dela z indeksi in stolpca ne more izgubiti.
 *
 * IMEN NE PREIMENUJTE v preglednici. Vezava je po imenu: preimenovan stolpec
 * skripta razume kot tuj, ob naslednji oddaji pa nastane nov, prazen zraven.
 *
 * ZAKAJ JE `sestanek` KLJUKICA in ne več spustni seznam („sestanek / ne želi /
 * drugič"): klicatelj z eno kljukico pove edino, kar lijak šteje — sestanek je
 * ali ga ni —, razlog zavrnitve pa sodi v `opombe`, kjer ima zanj cel stavek
 * namesto ene od dveh vnaprej izbranih besed. Cena je ena: „poklican, izida še
 * nisem vpisal" ni več ločljiv od „poklican, sestanka ni", ker neobkljukano
 * polje pomeni oboje. Analitika tega zato ne šteje več in namesto tega opozori
 * na dogovorjen sestanek brez vpisanega datuma.
 *
 * ZAKAJ STA DATUM IN URA DVA STOLPCA in ne en časovni žig: datum ima strogo
 * veljavnost in s tem koledarski izbirnik, ura pa je gola oblika `HH:mm`. Ura se
 * pogosto uskladi šele za datumom; kot del datuma bi pomenila, da klicatelj
 * najprej vpiše polnoč in se k celici vrača, popravek same ure pa bi moral iti
 * skozi datumsko polje, ki zanjo ni.
 *
 * Ime `sestanek datum` je s presledkom NAMENOMA: tak stolpec na listu že stoji,
 * vezava pa je po imenu — `sestanekDatum` bi zraven naredil še enega, praznega.
 */
var POKLICANO = 'poklicano';
var SESTANEK = 'sestanek';
var SESTANEK_DATUM = 'sestanek datum';
var SESTANEK_URA = 'ura';
var OPOMBE = 'opombe';
var DELOVNI_STOLPCI = [POKLICANO, SESTANEK, SESTANEK_DATUM, SESTANEK_URA, OPOMBE];

/**
 * Vrstni red stolpcev na listu — SAMO za branje s strani človeka.
 *
 * Ni isto kot `CSV_COLUMNS` v aplikaciji: tam je zaporedje zamrznjeno, ker so
 * preslikave v CRM pozicijske in bi vsako vrivanje tiho zamaknilo vse za sabo.
 * Tu tega tveganja ni — vrstica se piše po IMENIH stolpcev (glej `zapisiVrstico`),
 * zato je zaporedje na listu prosto in sme slediti temu, kako se lead bere:
 * kdaj, kdo, kje dela, kako velik je, kako ga dosežem — šele nato številke.
 *
 * Imena, ki jih tu ni, se pripnejo za temi, v vrstnem redu iz aplikacije.
 * Spreminjanje tega seznama ne pokvari ničesar; da preuredi ŽE zapisane vrstice,
 * je treba enkrat pognati `urediStolpce`.
 */
var VRSTNI_RED = [
  PREJETO,
  'firstName',
  'lastName',
  'companyName',
  'industryLabel',
  'employeeCount',
  // Velikost posla ob velikosti ekipe: 30 zaposlenih pri dveh milijonih prometa
  // je drug pogovor kot 30 zaposlenih pri dvajsetih.
  'annualRevenueEUR',
  'email',
  'phone',
  // Ob telefonu in ne pri privolitvah: klicatelj gleda ta dva podatka skupaj.
  KLICI_TAKOJ,
  POKLICANO,
  // Za "poklicano" in pred izidom: ko je klic opravljen, je to iztočnica za
  // pogovor — edini stolpec, ki pove, O ČEM govoriti. Vse ostalo je "kdo" in
  // "koliko".
  'risks',
  SESTANEK,
  // Datum in ura takoj za kljukico: kdaj je sestanek, se vpiše v isti sapi, ko
  // se ga dogovori. Vmesni stolpec bi pomenil, da klicatelj med kljukico in
  // datumom drsi čez nekaj, kar ga v tistem trenutku ne zanima.
  SESTANEK_DATUM,
  SESTANEK_URA,
  OPOMBE,
  LETNO,
  'directLossEUR',
  'lostMarginEUR',
  'capacityEUR',
  'capacityHoursPerMonth',
  'oneTimeCapitalEUR',
  'potentialMinEUR',
  'confidence',
  'selectedModules',
  PRIPRAVA,
  // Ob pripravi: oba stolpca povesta, ali ima druga stran svoj dokument.
  POROCILO_STRANKI,
  POROCILO_PDF,
  AC_STOLPEC,
  'role',
  'roleOther',
  'businessType',
  'currentSystem',
  'operationalHourCostEUR',
  'adminHourCostEUR',
  'taxNumber',
  'consentOffers',
  'consentContent',
  'followUpSequence',
  'utmSource',
];

/**
 * Stolpci, ki se ob `urediStolpce` SKRIJEJO — ne izbrišejo.
 *
 * Vsi so bodisi strojni dvojniki nečesa berljivega (`industry` proti
 * `industryLabel`, `timestampISO` proti `prejeto`), bodisi vrednost, ki je za
 * vsak lead enaka (`gdprConsent` je vedno true, sicer zapisa ne bi bilo), bodisi
 * surov JSON, ki je uporaben za analizo in nemogoč za branje. Podatek ostane —
 * skrit stolpec se kadarkoli vrne z desnim klikom na sosednja stolpca.
 *
 * `sizeClass` je tu na izrecno željo: velikost podjetja se bere iz števila
 * zaposlenih, razred pa je iz njega izpeljan in v pogledu podvaja isto.
 */
var SKRIJ = [
  'timestampISO',
  'segment',
  'industry',
  'sizeClass',
  'gdprConsent',
  // Število tveganj brez njihove vsebine ne pove nič; vsebino nosi `risks`, ki
  // je zato viden.
  'riskCount',
  'triageScores',
  'moduleInputsJson',
  'potentialMaxEUR',
  'hourCostsEstimated',
  'operationalHourSource',
  'adminHourSource',
  // Vir prometa: zanimiv ob presoji, odveč v pogledu. Vrednost nosi
  // annualRevenueEUR.
  'annualRevenueSource',
  // Isto pove KLICI_TAKOJ, le berljivo. Strojna oblika ostane za filtre.
  'consentConsulting',
];

/**
 * Odgovor v brskalniku, ko naslov objave odprete z GET — edini hiter način
 * preveriti, ali je razmestitev živa in ali gleda v pravo preglednico.
 */
function doGet() {
  var list = pridobiList();
  var lastnosti = PropertiesService.getScriptProperties();
  // Brez ustvarjanja lista: doGet je javen in ne sme puščati sledi.
  var dogodki = poisciList(NASTAVITVE.IME_LISTA_DOGODKI);
  var stDogodkov = dogodki ? Math.max(0, dogodki.getLastRow() - 1) : 0;

  // Stanje obvestil je tu zato, ker se je enkrat že zgodilo: vrstice so se
  // pisale, pošte pa ni bilo, in vzroka ni bilo mogoče videti od zunaj — napaka
  // pošte je namreč namerno pogoltnjena (glej doPost). Te tri vrstice ločijo
  // "naslov ni nastavljen" od "razmeščena je stara različica" od "pošiljanje
  // je vrglo napako", brez brskanja po dnevniku izvedb.
  var vrstice = [
    'LM-10 zbiralnik deluje. List: ' + list.getName() + ', vrstic: ' + Math.max(0, list.getLastRow() - 1) + '.',
    // Kdo pošilja — prva vrstica, ki jo je treba prebrati ob "sporočila ne
    // prihajajo": v načinu AC skripta ne pošlje ničesar in iskati je treba v AC.
    'Pošta: ' +
      (postaPrekAC()
        ? 'prek ActiveCampaigna — avtomatizaciji na poljih PDF_LINK (stranki) in ' +
          'LM10_ODDAJA / PDF_LINK_PRODAJA (prodaji); MailApp ne pošilja' +
          (NASTAVITVE.SHRANI_POROCILO
            ? ''
            : ' — POZOR: SHRANI_POROCILO je false, zato stranka poročila ne dobi')
        : 'prek MailApp (poročilo stranki in obvestilo prodaji pošlje skripta)'),
    'Obvestila: ' + (NASTAVITVE.E_NASLOV_ZA_OBVESTILA ? 'nastavljena' : 'IZKLOPLJENA (prazen E_NASLOV_ZA_OBVESTILA)'),
    'Zadnja poslana pošta: ' + (lastnosti.getProperty('ZADNJA_POSTA') || 'še nobena'),
    'Zadnja napaka pošte: ' + (lastnosti.getProperty('ZADNJA_NAPAKA_POSTE') || 'brez'),
    // Poročilo stranki ima svoje vrstice: pošta prodaji in pošta stranki lahko
    // odpovesta vsaka zase (prazen naslov prodaje, neveljaven naslov stranke).
    'Poročilo stranki po e-pošti: ' +
      (NASTAVITVE.POSLJI_POROCILO_STRANKI ? 'vklopljeno' : 'IZKLOPLJENO (POSLJI_POROCILO_STRANKI)'),
    'Zadnje poročilo stranki: ' + (lastnosti.getProperty('ZADNJA_POSTA_STRANKI') || 'še nobeno'),
    'Zadnja napaka poročila stranki: ' + (lastnosti.getProperty('ZADNJA_NAPAKA_POSTE_STRANKI') || 'brez'),
    // Kopija poročila na Drivu (povezava v AC): čas in ne povezava — doGet je
    // javen, povezava pa odpre strankin dokument.
    'Poročilo na Drivu: ' +
      (NASTAVITVE.SHRANI_POROCILO
        ? lastnosti.getProperty('ZADNJE_POROCILO_NA_DRIVU') || 'še nobeno'
        : 'IZKLOPLJENO (SHRANI_POROCILO)'),
    'Zadnja napaka poročila na Drivu: ' + (lastnosti.getProperty('ZADNJA_NAPAKA_POROCILA_NA_DRIVU') || 'brez'),
    // Deljenje je tiha okvara: datoteke se shranijo, povezavi iz AC pa zahtevata
    // dostop. Preverite s `preizkusDeljenja`, preden gre prvi lead.
    'Zadnja napaka deljenja na Drivu: ' + (lastnosti.getProperty('DRIVE_NAPAKA_DELJENJA') || 'brez'),
    'Zadnje urejanje stolpcev: ' + (lastnosti.getProperty('ZADNJE_UREJANJE') || 'še nobeno'),
    'ActiveCampaign: ' + acStanje(),
    'Zadnji v AC: ' + (lastnosti.getProperty('AC_ZADNJI') || 'še nobeden'),
    'Zadnja napaka AC: ' + (lastnosti.getProperty('AC_ZADNJA_NAPAKA') || 'brez'),
    // Izid enkratnega poseganja po preklopu SAMO_S_PRIVOLITVIJO: brez te vrstice
    // je viden samo v dnevniku izvedb. Hkrati je znamenje nove različice.
    'Ponovno naročilo obstoječih (narociObstojeceVAC): ' +
      (lastnosti.getProperty('AC_NAROCILO_OBSTOJECIH') || 'še ni teklo'),
    'Vrstic v listu (getMaxRows): ' + list.getMaxRows() + ', stolpcev: ' + list.getMaxColumns(),
    // Pravi leadi proti vsem vrsticam. Razlika je edini znak za okvaro, ki je
    // od zunaj videti kot "leadi se ne vpisujejo": prazne vrstice s sledjo
    // potrditvenega polja odrinejo vsako novo oddajo na dno lista, kjer je ne
    // vidi nihče. Dokler sta številki blizu, je list zdrav.
    'Od tega pravih leadov: ' + prestejLeade(list),
    // Lijak: ali dogodki sploh prihajajo (razmeščena stara različica jih zavrača
    // z napako, ki je aplikacija ne vidi) in kdaj je bil povzetek nazadnje sestavljen.
    'Dogodki lijaka: ' +
      stDogodkov +
      ' vrstic' +
      (stDogodkov ? ', zadnji prejet: ' + zadnjiPrejemDogodka(dogodki) : ''),
    'Lijak: ' + (lastnosti.getProperty('LIJAK_ZADNJI') || 'še ni sestavljen — poženite sestaviLijak'),
  ];
  return ContentService.createTextOutput(vrstice.join('\n'));
}

function doPost(e) {
  if (NASTAVITVE.ZETON && (!e || !e.parameter || e.parameter.zeton !== NASTAVITVE.ZETON)) {
    throw new Error('Napačen ali manjkajoč žeton.');
  }
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Zahteva je brez telesa.');
  }

  // Merjeno od začetka obdelave: aplikacija čaka odgovor petindvajset sekund (plus čas
  // prenosa telesa) in vse, kar sledi, se dogaja znotraj njih — v načinu AC
  // dva zapisa na Drive, vrstica in klici v AC, sicer isto brez deljenja, a s
  // pošto stranki in prodaji.
  var zacetek = Date.now();

  var oddaja = JSON.parse(e.postData.contents);
  // Dogodki lijaka gredo po isti poti kot oddaje in se ločijo po obliki telesa
  // (razdelek LIJAK na dnu). Pred ključavnico spodaj: pripenjanje dogodkov ima
  // svojo, kratko, in ne sme čakati na Drive in pošto oddaje.
  if (oddaja.events) return zapisiDogodke(oddaja);
  if (!oddaja.record) throw new Error('V telesu ni zapisa (record).');

  // Dve hkratni oddaji bi brez ključavnice lahko pisali v isto vrstico. Trideset
  // sekund je pod desetsekundnim rokom na strani aplikacije le navidez: rok velja
  // za odgovor, ključavnica pa se sprosti tudi, ko odjemalca ni več.
  var kljucavnica = LockService.getScriptLock();
  kljucavnica.waitLock(30000);

  // Kdo pošilja obe sporočili (glej POSTA_PREK_AC). Enkrat prebrano, ker odloča
  // o obliki datoteke priprave, o deljenju in o izidu poročila spodaj.
  var prekAC = postaPrekAC();

  var napakaPriprave = null;
  try {
    var povezava = '';
    if (NASTAVITVE.SHRANI_PRIPRAVO) {
      try {
        povezava = shraniPripravo(oddaja, prekAC);
      } catch (err) {
        // Vrstica je dragocenejša od povezave: najprej jo zapišemo, šele nato
        // napako vržemo naprej (spodaj), da aplikacija pripravo prenese stranki.
        napakaPriprave = err;
        povezava = 'NAPAKA: ' + err;
      }
    }

    // Strankin PDF na Drive — PRED vrstico, ker gre povezava v vrstico in od tam
    // v AC, in NIKOLI ne vrže (glej `shraniPorocilo`): kopija ne sme podreti
    // izvirnika, ki ga stranka dobi po e-pošti.
    var povezavaPorocila = NASTAVITVE.SHRANI_POROCILO ? shraniPorocilo(oddaja) : '';

    var vrednosti = zdruziVrednosti(oddaja, povezava, povezavaPorocila);
    var zapisana = zapisiVrstico(vrednosti);

    // ActiveCampaign — ZA vrstico in v svojem try/catch, iz istega razloga kot
    // pošta spodaj. Nikoli ne vrže: kar gre narobe, pristane kot "NAPAKA: …" v
    // stolpcu `activeCampaign`, od koder to pobere ura (`posljiZaostaleVAC`).
    // V načinu AC je to hkrati trenutek, ko se kontaktu nastavita polji s
    // povezavama — s tem se sprožita avtomatizaciji, ki pošljeta obe sporočili.
    var izidAC = NASTAVITVE.AC.POSILJAJ_TAKOJ ? acVrstico(zapisana, vrednosti, zacetek, prekAC) : null;

    // Poročilo stranki — ZA vrstico in PRED obvestilom prodaji, ki izid ponovi.
    // Nikoli ne vrže; izid gre v vrstico in v odgovor aplikaciji (spodaj), ki
    // ob neposlanem poročilu stranki ponudi prenos.
    var porociloStranki = prekAC
      ? izidPorocilaPrekAC(oddaja, vrednosti, povezavaPorocila, izidAC)
      : posljiPorociloStranki(oddaja, vrednosti);
    zapisiIzidPorocila(zapisana, porociloStranki);

    // ŠELE ZA vrstico in v svojem try/catch. Obvestilo je priročnost, vrstica je
    // zapis: padla pošta (kvota, napačen naslov) ne sme pomeniti, da aplikacija
    // dostavo razume kot neuspelo in prodajno pripravo prenese stranki.
    var lastnosti = PropertiesService.getScriptProperties();
    if (prekAC) {
      // Obvestilo prodaji pošlje avtomatizacija v AC (sprožilec je polje
      // %LM10_ODDAJA% ali %PDF_LINK_PRODAJA%). Skripta samo zabeleži, kaj ji je
      // dala — od zunaj je to edini znak, ali ima obvestilo obe povezavi.
      lastnosti.setProperty(
        'ZADNJA_POSTA',
        new Date().toISOString() +
          ' — prek AC (priprava: ' +
          (povezava ? (povezava.indexOf('NAPAKA') === 0 ? 'napaka' : 'povezava') : 'brez') +
          ', poročilo: ' +
          (povezavaPorocila && povezavaPorocila.indexOf('NAPAKA') !== 0 ? 'povezava' : 'brez') +
          ')',
      );
      lastnosti.deleteProperty('ZADNJA_NAPAKA_POSTE');
    } else {
      try {
        // Dekodiranje prilog šele tu, znotraj try/catch pošte: vrstica je zapisana
        // in je pokvarjena priloga ne sme prizadeti.
        var priloge = pripraviPriloge(oddaja);
        posljiObvestilo(vrednosti, priloge, porociloStranki);
        // S številom prilog, da doGet od zunaj pove, ali razmeščena različica
        // prilogi sploh pripenja.
        lastnosti.setProperty(
          'ZADNJA_POSTA',
          new Date().toISOString() + ' (priloge: ' + priloge.length + ')',
        );
        lastnosti.deleteProperty('ZADNJA_NAPAKA_POSTE');
      } catch (err) {
        console.warn('Obvestila ni bilo mogoče poslati: ' + err);
        // Zapisano, ker je odgovor doGet edino, kar je o tem vidno od zunaj.
        // Naslovi so zakriti: doGet je javen.
        lastnosti.setProperty(
          'ZADNJA_NAPAKA_POSTE',
          new Date().toISOString() + ' — ' + zakrijNaslove(String(err)),
        );
      }
    }
  } finally {
    kljucavnica.releaseLock();
  }

  // Vrže se ŠELE tu, ko je vrstica zapisana in pošta odposlana: aplikacija
  // pripravo tedaj prenese stranki, poročilo pa je stranka morda že dobila —
  // podvajanje brez škode.
  if (napakaPriprave) throw napakaPriprave;

  return ContentService.createTextOutput(JSON.stringify(odgovorOddaje(porociloStranki))).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/**
 * Odgovor aplikaciji: `{ ok: true }` kot doslej, z izidom pošte stranki. Ključi
 * so angleški kot ostala žica (`record`, `attachments`); bere jih
 * `parseCustomerReport` v src/lib/submitLead.ts. Stara aplikacija polje prezre.
 */
function odgovorOddaje(porociloStranki) {
  return {
    ok: true,
    customerReport: porociloStranki.poslano
      ? { sent: true }
      : { sent: false, reason: porociloStranki.razlog },
  };
}

/**
 * Vrednosti vrstice kot pari ime → vrednost.
 *
 * `sheet` je pot, po kateri pride vse iz aplikacije. Rezerva iz `record` obstaja
 * za primer, ko bi zahtevo poslal kdo drug (ali starejša različica aplikacije):
 * bolje pol vrstice kot izgubljen lead.
 */
function zdruziVrednosti(oddaja, povezavaPriprave, povezavaPorocila) {
  var vrednosti = {};
  vrednosti[PREJETO] = new Date();
  vrednosti[PRIPRAVA] = povezavaPriprave;
  // Vedno, tudi prazno: stolpec mora obstajati ob vsaki oddaji, da ura ob
  // ponovnem pošiljanju v AC povezavo najde po imenu.
  vrednosti[POROCILO_PDF] = povezavaPorocila || '';

  if (oddaja.sheet && oddaja.sheet.columns && oddaja.sheet.row) {
    for (var i = 0; i < oddaja.sheet.columns.length; i++) {
      vrednosti[String(oddaja.sheet.columns[i])] = oddaja.sheet.row[i];
    }
    return dopolniIzpeljano(vrednosti);
  }

  var zapis = oddaja.record;
  vrednosti.timestampISO = zapis.timestampISO;
  vrednosti.segment = zapis.segment;
  vrednosti.industryLabel = zapis.industryLabel;
  vrednosti.sizeClass = zapis.sizeClass;
  vrednosti.employeeCount = zapis.employeeCount;
  vrednosti.companyName = zapis.companyName;
  vrednosti.email = zapis.email;
  vrednosti.firstName = zapis.firstName;
  vrednosti.lastName = zapis.lastName;
  vrednosti.phone = zapis.phone;
  // Tudi po rezervni poti, sicer bi strojni in berljivi stolpec trdila različno.
  vrednosti.consentConsulting = zapis.consentConsulting;
  return dopolniIzpeljano(vrednosti);
}

/**
 * Stolpci, ki jih aplikacija ne pošlje, ker jih izračuna šele pogled na list.
 *
 * Kliče se na OBEH poteh `zdruziVrednosti` — funkcija ima zgodnji `return`, in
 * dopolnitev samo na eni bi pomenila prazna stolpca pri vsaki drugi oddaji.
 */
function dopolniIzpeljano(vrednosti) {
  vrednosti[KLICI_TAKOJ] = jePosvet(vrednosti.consentConsulting) ? 'DA' : '';
  vrednosti[LETNO] =
    stevilo(vrednosti.directLossEUR) +
    stevilo(vrednosti.lostMarginEUR) +
    stevilo(vrednosti.capacityEUR);

  // Prazna vrednost in ne izpuščen ključ: `zapisiVrstico` ustvari stolpec samo
  // za imena, ki so v vrednostih, izid klica v AC pa se zapiše ŠELE za vrstico —
  // brez tega stolpca ne bi bilo kam zapisati in ura ne bi imela česa brati.
  if (vrednosti[AC_STOLPEC] === undefined) vrednosti[AC_STOLPEC] = '';
  // Iz istega razloga: izid pošte stranki se zapiše šele za vrstico.
  if (vrednosti[POROCILO_STRANKI] === undefined) vrednosti[POROCILO_STRANKI] = '';

  // Klicateljevih stolpcev ne sme zapisati NIHČE razen klicatelja. Danes jih v
  // oddaji ni in prazna vrednost bi nastala sama; to je varovalo za jutri, ko bi
  // kdo v CSV_COLUMNS dodal stolpec z enakim imenom in bi vsaka oddaja tiho
  // pobrisala, kar je klicatelj vpisal.
  DELOVNI_STOLPCI.forEach(function (ime) {
    delete vrednosti[ime];
  });
  return vrednosti;
}

/**
 * Ali je obiskovalec prosil za posvet.
 *
 * Strpna do obeh oblik namenoma: iz aplikacije pride niz `'true'`
 * (`String(record.consentConsulting)` v `buildRowValues`), z lista pa logični
 * `true`, ker preglednica niz "true" ob zapisu pretvori v logično vrednost.
 */
function jePosvet(vrednost) {
  return jeResnica(vrednost);
}

/**
 * Logična vrednost iz obeh oblik, v katerih pride: niz `'true'` iz aplikacije
 * (`buildRowValues` vse pretvori v nize) in pravi `true` z lista, ker preglednica
 * niz "true" ob zapisu pretvori sama.
 */
function jeResnica(vrednost) {
  return vrednost === true || String(vrednost).trim().toLowerCase() === 'true';
}

function zapisiVrstico(vrednosti) {
  var list = pridobiList();
  var glava = preberiGlavo(list);

  // Nova imena se pripnejo na konec glave. Vrivanje na sredino bi zamaknilo vse
  // že zapisane vrstice — te se ne prepisujejo nikoli. Zato tudi ta funkcija
  // NIKOLI ne preureja: to zna samo `urediStolpce`, ki ga sproži človek.
  var nova = [];
  for (var ime in vrednosti) {
    if (glava.indexOf(ime) === -1 && nova.indexOf(ime) === -1) nova.push(ime);
  }
  // Na praznem listu je vseeno, v kakšnem vrstnem redu imena pridejo iz zahteve,
  // zato prva glava nastane kar v berljivem zaporedju — in takoj s klicateljevimi
  // stolpci vred. To gre skozi isti en zapis kot glava sama: vroča pot oddaje ne
  // sme dobiti nobenega dodatnega klica, ker je vsak od njih nov način, kako
  // dostava pade in prodajna priprava odide stranki.
  if (!glava.length) nova = razvrstiImena(nova.concat(DELOVNI_STOLPCI));
  if (nova.length) {
    zagotoviStolpce(list, glava.length + nova.length);
    list
      .getRange(1, glava.length + 1, 1, nova.length)
      .setValues([nova])
      .setFontWeight('bold');
    glava = glava.concat(nova);
    if (list.getFrozenRows() === 0) list.setFrozenRows(1);
  }

  var vrstica = glava.map(function (ime) {
    return zaCelico(vrednosti[ime]);
  });

  // Tu je nekoč stalo varovalo, ki je ob polnem listu vrinilo 50 praznih vrstic.
  // Bilo je NAROBE in je verjetno povzročilo napako, zaradi katere je bilo videti,
  // da se leadi ne vpisujejo: vrinjene vrstice podedujejo obliko vrstice nad
  // sabo, Google pa oblikovano vrstico šteje za uporabljeno. getLastRow je zato
  // ob vsaki oddaji poskočil za petdeset, naslednja oddaja pristala še niže, in
  // po nekaj desetih leadih je bilo med podatki dva tisoč praznih vrstic.
  //
  // appendRow list po potrebi razširi sam. Če tega kdaj ne bi zmogel, se napaka
  // vidi takoj (dostava pade v rezervno pot) — kar je neprimerno bolje od tihega
  // odmikanja vrstic proti dnu.
  list.appendRow(vrstica);
  var stVrstice = list.getLastRow();

  // Potrditveni polji, datumska celica in oblika ure za pravkar dodano vrstico. V try/catch,
  // ker je to kozmetika: napaka tu ne sme pomeniti, da aplikacija dostavo razume
  // kot neuspelo in prodajno pripravo prenese stranki (načelo 3 v glavi).
  try {
    opremiVrstico(list, glava, stVrstice);
  } catch (err) {
    console.warn('Vrstice ni bilo mogoče opremiti: ' + err);
  }

  // Kam je vrstica pristala — da zna klicatelj vanjo dopisati izid klica v
  // ActiveCampaign, ne da bi list bral še enkrat.
  return { list: list, glava: glava, vrstica: stVrstice };
}

/**
 * Klicateljevim celicam ene vrstice doda potrditveni polji, datumsko veljavnost
 * ter obliki ure in navadnega besedila.
 *
 * Zakaj po vrsticah in ne enkrat čez cel stolpec: oblikovanje in veljavnost,
 * nanesena do konca lista, razširita "uporabljeni obseg" — getLastRow tedaj
 * skoči na dno lista in vsaka naslednja oddaja pristane za morjem praznih
 * vrstic. Enkrat se je to že zgodilo (7 vrstic je postalo 996).
 */
function opremiVrstico(list, glava, vrstica) {
  var kje = function (ime) {
    return glava.indexOf(ime) + 1;
  };

  if (kje(POKLICANO)) {
    list
      .getRange(vrstica, kje(POKLICANO))
      .setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build())
      .setHorizontalAlignment('center');
  }
  if (kje(SESTANEK)) {
    list
      .getRange(vrstica, kje(SESTANEK))
      .setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build())
      .setHorizontalAlignment('center');
  }
  if (kje(SESTANEK_DATUM)) {
    list
      .getRange(vrstica, kje(SESTANEK_DATUM))
      .setDataValidation(
        SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(false).build(),
      )
      .setNumberFormat('d. m. yyyy');
  }
  if (kje(SESTANEK_URA)) {
    // Samo oblika, brez veljavnosti: koledarski izbirnik nad uro nima kaj iskati,
    // "9:30" pa preglednica sama prebere kot čas in ga izriše kot 09:30.
    list
      .getRange(vrstica, kje(SESTANEK_URA))
      .setNumberFormat('HH:mm')
      .setHorizontalAlignment('center');
  }
  if (kje(OPOMBE)) {
    list.getRange(vrstica, kje(OPOMBE)).setNumberFormat('@');
  }
}

/**
 * Imena, razvrščena po VRSTNI_RED; kar seznama ne pozna, gre za tem in obdrži
 * medsebojni vrstni red.
 */
function razvrstiImena(imena) {
  var rezultat = [];
  VRSTNI_RED.forEach(function (ime) {
    if (imena.indexOf(ime) !== -1 && rezultat.indexOf(ime) === -1) rezultat.push(ime);
  });
  imena.forEach(function (ime) {
    if (rezultat.indexOf(ime) === -1) rezultat.push(ime);
  });
  return rezultat;
}

/**
 * ENKRATNI POSEG, ki ga poženete v urejevalniku: preuredi stolpce že zapisanih
 * vrstic po VRSTNI_RED, skrije stolpce iz SKRIJ in list uredi za branje.
 *
 * `zapisiVrstico` tega ne počne sam in ne sme: preurejanje ob vsaki oddaji bi
 * pomenilo, da se ob vsakem leadu prepiše cel list — ena napaka ali ena prekinjena
 * izvedba in podatki so premešani. Tu je poseg zaveden, redek in ga sproži človek.
 *
 * Dela z INDEKSI in ne z imeni: če bi se v glavi kdaj znašli dve enaki imeni,
 * bi razvrščanje po imenih enega od stolpcev tiho izpustilo. Tako se vsak stolpec
 * prestavi natanko enkrat in noben podatek ne more izpasti.
 *
 * Varno je pognati večkrat — drugič ne spremeni ničesar.
 */
function urediStolpce() {
  // ISTA ključavnica kot doPost, in okoli BRANJA ter pisanja hkrati. Brez nje:
  // oddaja, ki pride med preurejanjem, se pripne po STAREM zaporedju stolpcev,
  // veliki prepis pa je ne pokrije (zajame le toliko vrstic, kolikor jih je bilo
  // ob branju). Vrstica ostane tiho zamaknjena — pod "firstName" datum, pod
  // "phone" e-naslov — in je videti popolnoma pravilna.
  var lastnosti = PropertiesService.getScriptProperties();
  var kljucavnica = LockService.getScriptLock();
  kljucavnica.waitLock(30000);
  try {
    var izid = preurediList();
    lastnosti.setProperty('ZADNJE_UREJANJE', new Date().toISOString() + ' — ' + izid);
    return izid;
  } catch (err) {
    // Zapisano zato, ker je izid ročnega zagona doslej videl samo tisti, ki je
    // bil takrat pred zaslonom. Odgovor doGet je edino, kar je o tem vidno od
    // zunaj — brez tega je vsako reševanje odvisno od prepisovanja dnevnika.
    lastnosti.setProperty(
      'ZADNJE_UREJANJE',
      new Date().toISOString() + ' — NAPAKA: ' + zakrijNaslove(String(err)),
    );
    throw err;
  } finally {
    kljucavnica.releaseLock();
  }
}

function preurediList() {
  var list = pridobiList();
  if (list.getLastRow() === 0) throw new Error('List je prazen — ni česa urejati.');

  // Najprej odvečne vrstice dol. Brez tega bi veliki prepis spodaj prežvečil ves
  // list (dva tisoč praznih vrstic namesto devetih polnih), oddaja pa bi
  // pristajala na njegovem dnu — daleč pod vidnimi podatki.
  pociistiOdvecneVrstice(list, preberiGlavo(list));

  // Glavo razširimo LOČENO in prej: ta zapis gre samo v device stolpce, zato
  // podatka ne more poškodovati. Veliki prepis spodaj s tem obdrži svoj pogoj
  // "stolpcev je enako mnogo kot prej", na katerem stoji njegova varnost.
  dodajManjkajocaImena(list);

  var podatki = list.getDataRange().getValues();
  var glava = podatki[0].map(function (celica) {
    return String(celica);
  });

  var indeksi = zeleniIndeksi(glava);

  // Trditev pred edinim zapisom. Če bi razvrščanje kdaj izpustilo stolpec, je
  // neškodljiva napaka neprimerno boljša od tihega prepisa, po katerem prvotnega
  // zaporedja iz zapisanih vrstic ni več mogoče rekonstruirati.
  if (indeksi.length !== glava.length) {
    throw new Error(
      'Preurejanje bi izgubilo stolpce (' +
        indeksi.length +
        ' od ' +
        glava.length +
        ') — nič ni bilo zapisano.',
    );
  }

  var novaGlava = indeksi.map(function (i) {
    return glava[i];
  });

  var nove = [novaGlava];
  var pretvorjenih = 0;
  for (var r = 1; r < podatki.length; r++) {
    var vrstica = indeksi.map(function (i) {
      // Skozi zaCelico tudi pri premikanju: getValues vrne "+386 1 234 5678"
      // brez uvodnega opuščaja, in če bi tak niz zapisali nazaj, bi ga
      // preglednica razumela kot formulo. Isto velja za vodilne ničle.
      return zaCelico(podatki[r][i]);
    });
    // Izpeljanke za nazaj — v pomnilniku, v že zgrajeni vrstici. Noben dodaten
    // zapis in nobena dodatna točka odpovedi; vse gre skozi tisti en setValues.
    izpolniIzpeljanke(vrstica, novaGlava);
    if (pretvoriStariIzid(vrstica, novaGlava)) pretvorjenih++;
    nove.push(vrstica);
  }

  // Veljavnost podatkov mora dol PRED zapisom, sicer prepis sploh ne steče.
  //
  // Datumska celica `sestanek datum` je nastavljena strogo (setAllowInvalid
  // false), veljavnost pa se s prerazporeditvijo NE premakne — ostane na stari
  // fizični celici. Ko prepis vanjo zapiše podatek drugega stolpca, ga Google
  // zavrne z "The data you entered violates the data validation rules" in cel
  // poseg pade. Pravila spodaj postavi urediVidez znova, po imenu stolpca.
  if (nove.length > 1) {
    list.getRange(2, 1, nove.length - 1, list.getMaxColumns()).clearDataValidations();
  }

  // Zapis je en sam: znotraj enega setValues delnega zapisa ni. Stolpcev je
  // enako mnogo kot prej, zato prepis pokrije prav vse celice.
  list.getRange(1, 1, nove.length, novaGlava.length).setValues(nove);

  // Zapis na disk PRED vsem, kar sledi. Apps Script pisanje kopiči in ga izvede
  // ob prvem branju; pri stotisoč celicah je ta trenutek predaleč — `urediVidez`
  // in `urediAnalitiko` spodaj list BEREta znova in smeta videti samo končno
  // stanje. En klic, ki stane nič, in odpade cel razred napak "list je videti,
  // kot da prepisa ni bilo".
  SpreadsheetApp.flush();

  urediVidez(list, novaGlava);

  // Analitika ŠELE ZDAJ: njene formule kažejo na črke stolpcev, zato jih je
  // mogoče sestaviti šele, ko je glava v končnem stanju.
  //
  // In v try/catch: analitika je pogled na podatke, ne podatek. Če je ni mogoče
  // sestaviti (list še nima vseh stolpcev), je urejanje leadov vseeno opravljeno
  // in tega ne sme razveljaviti — pove naj se v izpisu, ne z odpovedjo.
  var analitika;
  try {
    urediAnalitiko();
    analitika = 'Analitika osvežena.';
  } catch (err) {
    console.warn('Analitike ni bilo mogoče sestaviti: ' + err);
    analitika = 'Analitika NI sestavljena: ' + err;
  }

  return (
    'Urejeno: ' +
    novaGlava.length +
    ' stolpcev, ' +
    (nove.length - 1) +
    ' vrstic. ' +
    (pretvorjenih
      ? 'Starih izidov klica pretvorjenih v kljukico: ' + pretvorjenih + '. '
      : '') +
    analitika
  );
}

/**
 * Stari izid klica („sestanek" / „ne želi" / „drugič") v kljukico — v pomnilniku,
 * v že zgrajeni vrstici, tik pred edinim zapisom.
 *
 * Brez tega bi vse, kar je klicatelj vpisal do prehoda na potrditveno polje,
 * obležalo v stolpcu kot BESEDILO. Kljukica ga ne zavrne — `requireCheckbox`
 * pusti setAllowInvalid na privzetem `true` in tako besedilo samo označi kot
 * neveljavno —, `COUNTIF(...,TRUE)` pa ga ne šteje. Lijak, tortni graf in
 * „sestanki na poklicanega" bi zato pokazali NIČ sestankov: številka, ki je
 * videti veljavna in je narobe, kar je najdražja vrsta napake na tem listu.
 *
 * Preseljena je vsaka neprazna besedilna vrednost in ne samo tri znane: seznam
 * je bil sicer strog, a v celico je mogoče prilepiti karkoli, in kar ostane za
 * kljukico, se ne da več prebrati.
 *
 * Vsebina se ne izgubi — razlog gre v `opombe`, PRED obstoječo opombo, ker je
 * starejši od nje. Kljukica pozna samo „je" in „ni", cel stavek pa odslej itak
 * sodi tja.
 *
 * Idempotentno: po prvem zagonu v stolpcu ni več niza, torej ni več česa
 * pretvarjati.
 */
function pretvoriStariIzid(vrstica, glava) {
  var i = glava.indexOf(SESTANEK);
  if (i === -1 || typeof vrstica[i] !== 'string') return false;

  // zaCelico bi vodilne znake zaklenil z opuščajem; tu ga odstranimo, da se v
  // opombi ne pojavi.
  var besedilo = vrstica[i].replace(/^'/, '').trim();
  if (besedilo === '') return false;

  if (besedilo.toLowerCase() === SESTANEK) {
    vrstica[i] = true;
    return true;
  }

  var j = glava.indexOf(OPOMBE);
  if (j !== -1) {
    var opomba = vrstica[j] === null || vrstica[j] === undefined ? '' : String(vrstica[j]).trim();
    vrstica[j] = zaCelico(opomba ? besedilo + ' · ' + opomba : besedilo);
  }
  vrstica[i] = '';
  return true;
}

/**
 * Pobriše prazne vrstice pod podatki.
 *
 * Google šteje za "uporabljeno" tudi vrstico, ki ima samo obliko — brez vsebine.
 * Ko je oblikovanje enkrat po nesreči seglo čez ves list, je getLastRow skočil s
 * 7 na 996 in nova oddaja bi pristala pod tisoč praznimi vrsticami. Ta funkcija
 * je popravilo tiste škode in varovalo, če bi se kdaj ponovila.
 *
 * Zadnja vrstica s podatki se prebere iz PRVEGA stolpca (`prejeto`), ki je pri
 * vsakem leadu izpolnjen; getLastRow bi bil tu neuporaben, saj je prav on tisti,
 * ki laže.
 */
/**
 * KONEC PREIZKUSNEGA OBDOBJA: pobriše VSE vrstice z leadi in pusti samo glavo.
 *
 * Namenjeno trenutku, ko je preizkušanje končano in naj list od tod naprej
 * zbira samo prave obiskovalce. Glava, oblike stolpcev in širine ostanejo —
 * pobriše se vsebina, ne postavitev.
 *
 * Zadnje nezamrznjene vrstice se ne da pobrisati (Google to zavrne), zato se
 * pobrišejo vse do nje, njo pa izpraznimo do konca: brez vsebine, brez oblike
 * in brez veljavnosti. Šele s tem `getLastRow` pade nazaj na 1 in naslednja
 * oddaja pristane v vrstici 2 — kar je ves namen tega posega.
 *
 * NEPOVRATNO. Pred zagonom Datoteka → Ustvari kopijo; pravi „razveljavi" je
 * Datoteka → Zgodovina različic.
 */
function pocistiVseLeade() {
  var list = pridobiList();
  var glava = preberiGlavo(list);
  if (!glava.length) throw new Error('List "' + NASTAVITVE.IME_LISTA + '" nima glave — ni česa čistiti.');

  var vrstic = Math.max(0, list.getLastRow() - 1);

  // Ista ključavnica kot doPost: oddaja, ki pride sredi čiščenja, bi sicer
  // pristala v vrstici, ki jo ta poseg takoj za tem pobriše.
  var kljucavnica = LockService.getScriptLock();
  kljucavnica.waitLock(30000);
  try {
    if (list.getMaxRows() > 2) list.deleteRows(2, list.getMaxRows() - 2);
    var ostanek = list.getRange(2, 1, 1, list.getMaxColumns());
    ostanek.clearContent();
    ostanek.clearDataValidations();
    ostanek.clearFormat();
    SpreadsheetApp.flush();
  } finally {
    kljucavnica.releaseLock();
  }

  var izid =
    'Pobrisanih vrstic: ' + vrstic + '. Ostala je samo glava — naslednji lead pristane v vrstici 2.';
  PropertiesService.getScriptProperties().setProperty(
    'ZADNJE_CISCENJE',
    new Date().toISOString() + ' — ' + izid,
  );
  return izid;
}

/**
 * Isto za list z dogodki lijaka: pobriše vse zbrane dogodke in pusti glavo.
 * Povzetek `sestaviLijak` po tem šteje od nič — smiselno takrat, ko so v listu
 * samo še razvojni kliki in naj merjenje začne s pravim prometom.
 */
function pocistiVseDogodke() {
  var list = poisciList(NASTAVITVE.IME_LISTA_DOGODKI);
  if (!list) return 'Lista "' + NASTAVITVE.IME_LISTA_DOGODKI + '" ni — nič za počistiti.';

  var vrstic = Math.max(0, list.getLastRow() - 1);
  var kljucavnica = LockService.getScriptLock();
  kljucavnica.waitLock(30000);
  try {
    if (list.getMaxRows() > 2) list.deleteRows(2, list.getMaxRows() - 2);
    var ostanek = list.getRange(2, 1, 1, list.getMaxColumns());
    ostanek.clearContent();
    ostanek.clearFormat();
    SpreadsheetApp.flush();
  } finally {
    kljucavnica.releaseLock();
  }
  return 'Pobrisanih dogodkov: ' + vrstic + '. Lijak bo od zdaj štel od nič.';
}

/**
 * ENKRATNO POPRAVILO: stolpcu s časi prejema vrne ime `prejeto`.
 *
 * Obstaja zato, ker se je zgodilo: ime je iz glave izpadlo (prazna celica v
 * vrstici 1), s tem pa je stolpec ob preurejanju zdrsnil med neznane in vse, kar
 * se nanj sklicuje — analitika, čiščenje, štetje leadov — je odpovedalo. Podatki
 * so ostali; manjkalo je samo ime.
 *
 * Stolpec prepozna po vsebini in ne po legi: išče NEIMENOVAN stolpec, v katerem
 * so same vrednosti datum. Kadar tak ni natanko eden, se ne ugiba — raje pove,
 * kaj je našlo, in pusti odločitev človeku.
 */
function popraviGlavo() {
  var list = pridobiList();
  var glava = preberiGlavo(list);
  if (!glava.length) throw new Error('List "' + NASTAVITVE.IME_LISTA + '" nima glave.');
  if (glava.indexOf(PREJETO) !== -1) {
    return 'Glava je v redu: stolpec "' + PREJETO + '" je na mestu ' + crkaStolpca(glava, PREJETO) + '. Popravilo ni potrebno.';
  }

  var vrstic = list.getLastRow() - 1;
  if (vrstic < 1) throw new Error('List nima podatkov — stolpca s časi prejema ni mogoče prepoznati.');
  var podatki = list.getRange(2, 1, vrstic, glava.length).getValues();

  var kandidati = [];
  for (var c = 0; c < glava.length; c++) {
    if (String(glava[c]).trim() !== '') continue;
    var datumov = 0;
    var nepraznih = 0;
    for (var r = 0; r < podatki.length; r++) {
      var celica = podatki[r][c];
      if (celica === '' || celica === null) continue;
      nepraznih++;
      // Ne `instanceof Date`: ta primerja konstruktorje in laže vsakič, ko
      // vrednost pride iz drugega konteksta (v preizkusu iz `node:vm`, v Apps
      // Scriptu iz druge preglednice). Oznaka vrste je ista povsod.
      if (Object.prototype.toString.call(celica) === '[object Date]') datumov++;
    }
    if (nepraznih > 0 && datumov === nepraznih) kandidati.push(c);
  }

  if (kandidati.length !== 1) {
    throw new Error(
      'Stolpca s časi prejema ni bilo mogoče enolično prepoznati (najdenih: ' +
        kandidati.length +
        '). Poiščite stolpec z datumi in prazno glavo ter v vrstico 1 ročno vpišite "' +
        PREJETO +
        '".',
    );
  }

  var stolpec = kandidati[0] + 1;
  list.getRange(1, stolpec).setValue(PREJETO).setFontWeight('bold');
  SpreadsheetApp.flush();
  return (
    'Stolpcu ' + crkaIzIndeksa(stolpec) + ' je vrnjeno ime "' + PREJETO + '" (' + vrstic + ' vrstic s podatki). Zdaj poženite urediStolpce.'
  );
}

/**
 * Ali v celici klicatelja ni NIČESAR — širše od "prazna celica".
 *
 * Neobkljukano potrditveno polje ni prazna celica: Google vanjo zapiše `false`,
 * ki se glede na to, kako je vrednost nastala, bere kot logični `false` ali kot
 * besedilo "FALSE". Prejšnje merilo (`String(celica).trim() === ''`) je oboje
 * razumelo kot vsebino, zato je bila vsaka vrstica, ki je kdaj dobila obliko
 * potrditvenega polja, za vedno "polna" in je čiščenje ni pobrisalo NIKOLI.
 * Natanko to je uporabniku pustilo dva tisoč vrstic v listu, čeprav je
 * `urediStolpce` tekel — nove oddaje so pristajale pod njimi, kjer jih ni videl
 * nihče, in videti je bilo, kot da se leadi sploh ne vpisujejo.
 *
 * Ničla je tu iz istega razloga: izpeljanka `letno` je nekoč vanje zapisala 0.
 *
 * Merilo je namerno široko: klicatelj v nobenega od svojih petih stolpcev
 * (`poklicano`, `sestanek`, `sestanek datum`, `ura`, `opombe`) ne vpiše ne
 * "false" ne ničle — datum in ura sta števili nad nič —, `prejeto` pa je pri
 * vsakem leadu datum. Nasprotna
 * napaka — pustiti prazno vrstico — je poceni, brisanje leada pa ni, zato je
 * vse, kar ni na tem ozkem seznamu, vsebina.
 */
function jePraznoZaKlicatelja(celica) {
  if (celica === '' || celica === null || celica === undefined) return true;
  if (celica === false || celica === 0) return true;
  var besedilo = String(celica).trim().toLowerCase();
  return besedilo === '' || besedilo === 'false' || besedilo === '0';
}

function pociistiOdvecneVrstice(list, glava) {
  var vrstic = list.getMaxRows();
  if (vrstic < 2) return 0;

  var podatki = list.getRange(2, 1, vrstic - 1, list.getMaxColumns()).getValues();

  // Vrstica je odvečna, kadar NI lead (nima časa prejema) in v njej ni ničesar,
  // kar bi vpisal klicatelj. Prej je veljalo strožje merilo "vse celice prazne",
  // a ga je pokvarila ena sama ničla, ki jo je vanje zapisala izpeljava —
  // odvečne vrstice so ostale za vedno.
  //
  // BREZ STOLPCA `prejeto` SE NE ČISTI. To ni previdnost, ampak popravilo
  // napake, ki je STALA PODATKE: ko je iz glave izpadlo ime `prejeto`, je merilo
  // spodaj presojalo samo še po klicateljevih stolpcih — in vsak lead, ki še ni
  // bil poklican, je bil s tem "prazna vrstica". Zbrisalo jih je. Manjkajoče
  // sidro pomeni, da lead od praznine ni ločljiv, in tedaj je edino pravilno
  // dejanje, da se ne zbriše nič. Ime vrne `popraviGlavo`.
  var sidro = glava ? glava.indexOf(PREJETO) : -1;
  if (sidro === -1) {
    throw new Error(
      'V glavi ni stolpca "' +
        PREJETO +
        '", zato leada ni mogoče ločiti od prazne vrstice — čiščenje je ustavljeno in NIČ ni bilo pobrisano. ' +
        'Poženite popraviGlavo in nato znova urediStolpce.',
    );
  }

  var pomembni = [sidro];
  DELOVNI_STOLPCI.forEach(function (ime) {
    var i = glava.indexOf(ime);
    if (i !== -1) pomembni.push(i);
  });

  var odvecna = podatki.map(function (vrstica) {
    return pomembni.every(function (i) {
      return jePraznoZaKlicatelja(vrstica[i]);
    });
  });

  // Od spodaj navzgor in v strnjenih blokih: brisanje od zgoraj bi premaknilo
  // vse indekse pod sabo, blok pa je en klic namesto tisoč.
  // Ena nezamrznjena vrstica mora preživeti: Google zavrne poskus, da bi jih
  // pobrisali vse, z "Sorry, it is not possible to delete all non-frozen rows"
  // — in ker ta izjema prileti sredi zanke, so bili nekateri bloki takrat že
  // pobrisani, drugi pa ne. Zato proračun in ne poskus z upanjem: če pride do
  // dna, pusti zadnjo vrstico pri miru in poseg se konča urejeno.
  // `|| 0`: brez njega bi manjkajoča vrednost dala NaN, `Math.min` bi vrnil NaN
  // in čiščenje bi tiho ne pobrisalo ničesar — okvara, ki je videti kot uspeh.
  var proracun = Math.max(0, list.getMaxRows() - (list.getFrozenRows() || 0) - 1);

  var pobrisanih = 0;
  var konec = null;
  for (var i = odvecna.length - 1; i >= -1; i--) {
    var jeOdvecna = i >= 0 && odvecna[i];
    if (jeOdvecna && konec === null) konec = i;
    if (!jeOdvecna && konec !== null) {
      var koliko = Math.min(konec - i, proracun);
      if (koliko > 0) {
        list.deleteRows(i + 3, koliko);
        pobrisanih += koliko;
        proracun -= koliko;
      }
      konec = null;
    }
  }
  return pobrisanih;
}

/**
 * V glavo doda imena, ki jih aplikacija nikoli ne pošlje: izpeljanki
 * (`kliciTakoj`, `letno`) in pet klicateljevih stolpcev.
 *
 * Piše izključno v stolpce, ki hip prej niso obstajali, zato zapisanega podatka
 * ne more poškodovati. Če bi karkoli za tem padlo, ostane list z nekaj praznimi
 * stolpci na desni in ponoven zagon vse popravi.
 */
function dodajManjkajocaImena(list) {
  var glava = preberiGlavo(list);
  var manjkajoca = [KLICI_TAKOJ, LETNO].concat(DELOVNI_STOLPCI).filter(function (ime) {
    return glava.indexOf(ime) === -1;
  });
  if (!manjkajoca.length) return glava;

  zagotoviStolpce(list, glava.length + manjkajoca.length);
  list
    .getRange(1, glava.length + 1, 1, manjkajoca.length)
    .setValues([manjkajoca])
    .setFontWeight('bold');
  return glava.concat(manjkajoca);
}

/**
 * Izpeljanki za že zapisano vrstico. Piše SAMO v prazno celico — ročni popravek
 * klicatelja se ob ponovnem zagonu ne sme povoziti.
 */
function izpolniIzpeljanke(vrstica, glava) {
  var pri = function (ime) {
    var i = glava.indexOf(ime);
    return i === -1 ? '' : vrstica[i];
  };
  var nastavi = function (ime, vrednost) {
    var i = glava.indexOf(ime);
    if (i === -1) return;
    if (vrstica[i] === '' || vrstica[i] === null || vrstica[i] === undefined) {
      vrstica[i] = vrednost;
    }
  };

  // Vrstica brez časa prejema ni lead. Brez tega varovala je izpeljava v vsako
  // prazno vrstico zapisala `letno` = 0 — in s tem naredila prazne vrstice za
  // vedno "polne", tako da jih čiščenje ni več prepoznalo. Natanko to je
  // uporabniku napihnilo list na dva tisoč vrstic.
  if (String(pri(PREJETO)).trim() === '') return;

  nastavi(KLICI_TAKOJ, jePosvet(pri('consentConsulting')) ? 'DA' : '');
  nastavi(
    LETNO,
    stevilo(pri('directLossEUR')) + stevilo(pri('lostMarginEUR')) + stevilo(pri('capacityEUR')),
  );
}

/**
 * Zaporedje stolpcev kot indeksi v obstoječi glavi. Vsak indeks se pojavi
 * natanko enkrat, tudi če je ime prazno ali podvojeno — od tod izhaja jamstvo,
 * da `urediStolpce` ne more izgubiti stolpca.
 */
function zeleniIndeksi(glava) {
  var uporabljeni = {};
  var indeksi = [];

  VRSTNI_RED.forEach(function (ime) {
    var i = glava.indexOf(ime);
    if (i !== -1 && !uporabljeni[i]) {
      uporabljeni[i] = true;
      indeksi.push(i);
    }
  });
  for (var i = 0; i < glava.length; i++) {
    if (!uporabljeni[i]) {
      uporabljeni[i] = true;
      indeksi.push(i);
    }
  }
  return indeksi;
}

/** Denarni stolpci — brez oblike so to gole številke, ki jih je treba šteti. */
var DENARNI = [
  LETNO,
  'annualRevenueEUR',
  'directLossEUR',
  'lostMarginEUR',
  'capacityEUR',
  'oneTimeCapitalEUR',
  'potentialMinEUR',
  'operationalHourCostEUR',
  'adminHourCostEUR',
];

/**
 * Pojasnila na glavah, ki niso samoumevne.
 *
 * Imena stolpcev so hkrati KLJUČI, po katerih se piše vrstica, zato jih ni
 * mogoče prevesti — preimenovana glava bi vezavo podrla. Opomba pove isto, ne da
 * bi se ključa dotaknila, in preživi vsako prerazvrstitev.
 */
var POJASNILA = {
  kliciTakoj: 'DA = obiskovalec je v obrazcu prosil, da njegove številke pregledamo skupaj.',
  letno: 'Skupni letni znesek: odliv + nezaslužena marža + vrednost izgubljenega časa.',
  annualRevenueEUR: 'Letni prihodek podjetja, kot ga je navedel obiskovalec. Vir je v skritem stolpcu annualRevenueSource.',
  risks: 'Tveganja iz odgovorov stranke, s stopnjo. Iztočnica za pogovor.',
  capacityEUR: 'Vrednost časa, ki se porabi za delo, ki ga sistem lahko prevzame.',
  capacityHoursPerMonth: 'Iste ure kot capacityEUR, le v urah na mesec.',
  oneTimeCapitalEUR: 'Enkraten znesek (sprostljiv obratni kapital) — z letnimi se NE sešteva.',
  potentialMinEUR: 'Naslovljiv potencial na leto. Max je enak in je zato skrit.',
  confidence: 'Koliko izračuna je vnesel obiskovalec in koliko je privzetih vrednosti.',
  hourCostsEstimated: 'true = vsaj ena urna postavka ni vnesena, ampak izbrana ali privzeta.',
  followUpSequence: 'Ključ sekvence za CRM. Ne pove ničesar o stranki.',
  activeCampaign: 'Id kontakta v ActiveCampaignu. Prazno ali "NAPAKA:" pomeni, da tam še ni — tako vrstico pobere ura (posljiZaostaleVAC).',
  porociloPdf: 'Povezava do strankinega PDF-ja na Drivu — isti dokument, kot ga je dobila po e-pošti; gre tudi v ActiveCampaign (%PDF_LINK%). "NAPAKA:" = Drive je odpovedal, stranka ima PDF vseeno.',
  poklicano: 'Obkljukajte, ko je klic opravljen.',
  sestanek: 'Obkljukajte, ko je sestanek dogovorjen. Zakaj ga ni, pripišite v opombe.',
  'sestanek datum': 'Datum dogovorjenega sestanka. Celica sprejme samo datum — vpišite ga ali izberite v koledarju.',
  ura: 'Ura sestanka iz sosednjega stolpca. Vpišite npr. 9:30 in celica jo izriše kot 09:30.',
  opombe: 'Prosto besedilo. Oblikovano kot navadno besedilo, da datumi in formule ostanejo, kot jih vpišete.',
};

/**
 * Vidna podoba lista: skriti strojni stolpci, širine, oblike, potrditvena polja,
 * datumska veljavnost, filter.
 *
 * Vse to je treba postavljati ZNOVA ob vsakem preurejanju. `setValues` premakne
 * samo VREDNOSTI — veljavnost podatkov, oblike števil, širine in zapiski ostanejo
 * na starem indeksu stolpca. Brez tega bi po prerazvrstitvi datumska celica
 * obtičala sredi e-naslovov, potrditveno polje pa sredi zneskov.
 */
function urediVidez(list, glava) {
  var vrstic = Math.max(0, list.getLastRow() - 1);

  list.setFrozenRows(1);
  list.getRange(1, 1, 1, glava.length).setFontWeight('bold').setBackground('#f1f3f4');

  // Oblike in zapiski se s prerazporeditvijo prav tako NE premaknejo — ostanejo
  // na stari fizični celici, kar je isti vzorec kot pri veljavnosti, le da tu
  // nič ne vrže napake: list samo laže. Brez tega pristanejo ure na mesec v
  // stolpcu z obliko "#.##0 €" in se berejo kot evri, nad glavo `utmSource` pa
  // obvisi pojasnilo sosednjega stolpca. Zato oboje dol in nato znova po imenu.
  //
  // Obseg je natanko podatkovni blok, nikoli do getMaxRows(): tako je nastala
  // napaka, ob kateri je iz sedmih vrstic nastalo 996.
  if (vrstic) list.getRange(2, 1, vrstic, glava.length).clearFormat();
  list.getRange(1, 1, 1, glava.length).clearNote();

  // Veljavnosti najprej dol, nato na novo po IMENU stolpca (glej glavo).
  //
  // SAMO čez vrstice s podatki, nikoli do getMaxRows(). To je bilo prvič
  // narobe in se je grdo poznalo: oblikovanje in poravnava, nanesena čez ves
  // list, razširita "uporabljeni obseg" (isto, kar pokaže Ctrl+End), zato je
  // getLastRow skočil s 7 na 996 — naslednja oddaja bi pristala tisoč vrstic
  // niže, za morjem praznih. Nove vrstice dobijo svoje v `opremiVrstico`.
  if (vrstic) list.getRange(2, 1, vrstic, glava.length).clearDataValidations();

  var sirine = {
    activeCampaign: 110,
    prejeto: 130,
    firstName: 110,
    lastName: 120,
    companyName: 220,
    industryLabel: 200,
    employeeCount: 90,
    annualRevenueEUR: 130,
    phone: 140,
    kliciTakoj: 90,
    email: 210,
    letno: 110,
    risks: 300,
    poklicano: 90,
    sestanek: 90,
    'sestanek datum': 110,
    ura: 70,
    opombe: 320,
    prodajnaPriprava: 220,
    porociloPdf: 220,
    selectedModules: 220,
  };

  for (var i = 0; i < glava.length; i++) {
    var ime = glava[i];
    var stolpec = i + 1;

    if (POJASNILA[ime]) list.getRange(1, stolpec).setNote(POJASNILA[ime]);

    if (SKRIJ.indexOf(ime) !== -1) {
      list.hideColumns(stolpec);
      continue;
    }
    list.showColumns(stolpec);
    if (sirine[ime]) list.setColumnWidth(stolpec, sirine[ime]);

    if (ime === PREJETO && vrstic) {
      list.getRange(2, stolpec, vrstic, 1).setNumberFormat('d. m. yyyy HH:mm');
    }
    if (DENARNI.indexOf(ime) !== -1 && vrstic) {
      list.getRange(2, stolpec, vrstic, 1).setNumberFormat('#.##0 €');
    }
    if (ime === KLICI_TAKOJ && vrstic) {
      list
        .getRange(2, stolpec, vrstic, 1)
        .setFontWeight('bold')
        .setFontColor('#c5221f')
        .setHorizontalAlignment('center');
    }

    if (!vrstic) continue;

    if (ime === POKLICANO || ime === SESTANEK) {
      // requireCheckbox in NE insertCheckboxes: slednji v vsako celico razpona
      // ZAPIŠE false — s tem potisne getLastRow na konec lista (naslednja oddaja
      // pristane stotine vrstic niže) in odkljuka vse, kar je klicatelj označil.
      list
        .getRange(2, stolpec, vrstic, 1)
        .setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build())
        .setHorizontalAlignment('center');
    }
    if (ime === SESTANEK_DATUM) {
      list
        .getRange(2, stolpec, vrstic, 1)
        .setDataValidation(
          SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(false).build(),
        )
        .setNumberFormat('d. m. yyyy');
    }
    if (ime === SESTANEK_URA) {
      list
        .getRange(2, stolpec, vrstic, 1)
        .setNumberFormat('HH:mm')
        .setHorizontalAlignment('center');
    }
    if (ime === OPOMBE) {
      // Navadno besedilo, dokler je stolpec še prazen: sicer preglednica vnos
      // razlaga — "=nekaj" postane formula (in je ob naslednjem prepisu ni več),
      // "3. 9. 2026" pa datum, ki se po prepisu izriše kot serijska številka.
      list.getRange(2, stolpec, vrstic, 1).setNumberFormat('@');
    }
  }

  // Ime in priimek ostaneta vidna tudi ob drsanju do zneskov. Do telefona ne
  // zamrzujemo — sedem stolpcev bi pojedlo pol zaslona, klicateljeva zanka od
  // telefona do opomb pa je itak na enem zaslonu.
  var doPriimka = glava.indexOf('lastName');
  if (doPriimka !== -1) list.setFrozenColumns(doPriimka + 1);

  // Filter na glavi: "pokaži tiste, ki prosijo za posvet in še niso poklicani"
  // je klicateljevo prvo opravilo in brez filtra ni izvedljivo.
  var obstojeci = list.getFilter();
  if (obstojeci) obstojeci.remove();
  // Na listu, skrčenem na samo glavo, bi razpon dveh vrstic segel čez rob in
  // vrgel napako — filter je okras, ki ne sme podreti celotnega posega.
  if (list.getMaxRows() >= 2) {
    var visina = Math.min(list.getMaxRows(), Math.max(2, list.getLastRow()));
    list.getRange(1, 1, visina, glava.length).createFilter();
  }

  // Brez preloma besedila: ena oddaja naj ostane ena vrstica, sicer se list
  // razpotegne v nekaj, česar se ne da preleteti.
  list.getDataRange().setWrap(false).setVerticalAlignment('middle');
}

/**
 * List „Analitika": kartice s ključnimi številkami, štirje grafi, delovna vrsta
 * za klicanje in podatkovni del, iz katerega grafi jemljejo.
 *
 * VSE ŠTEVILKE SO ŽIVE FORMULE, ne izračun skripte, in to je bistvo.
 * Klicatelj obkljuka `poklicano` in `sestanek` ROČNO, v preglednici —
 * skripta o tem ne izve nikoli. Posnetek, izračunan ob oddaji leada, bi bil
 * zastarel od prve kljukice do naslednjega obiskovalca, in to nevidno: številke
 * bi bile videti sveže. Formula se preračuna sama, v isti sekundi.
 *
 * Iz istega razloga se `doPost` analitike NE dotakne: vroča pot oddaje ostane
 * brez dodatnih klicev (načelo 3 v glavi datoteke).
 *
 * PAST, ZARADI KATERE SE LIST SESTAVI VSAKIČ ZNOVA: formule kažejo na ČRKE
 * stolpcev, `urediStolpce` pa stolpce PREMIKA. Črke se zato razrešijo iz glave
 * lista Leadi po IMENU stolpca — isto načelo kot pri pisanju vrstic. Brez tega bi
 * COUNTIF nad "poklicano" po prvem preurejanju štel telefonske številke in vrnil
 * 0, kar je videti kot veljaven odgovor. Celica A3 to varuje še enkrat: dokler je
 * prazna, glava stoji tam, kjer jo formule pričakujejo.
 *
 * ZAKAJ PODATKOVNI DEL DESNO. Graf v preglednici ne zna računati — potrebuje vir
 * na listu, in to v SOSEDNJIH stolpcih (oznaka, število). Tabele zato obstajajo,
 * a stojijo desno od pogleda, kamor človek ne gleda.
 *
 * ZAKAJ JE DELOVNA VRSTA ČISTO SPODAJ. FILTER se razteza navzdol in koliko
 * vrstic vrne, je odvisno od podatkov; karkoli pod njim bi ob prvem večjem
 * odgovoru dobilo #REF!. Pod njo zato ni ničesar.
 */
function urediAnalitiko() {
  var leadi = pridobiList();
  var glava = preberiGlavo(leadi);
  if (!glava.length) throw new Error('List "' + NASTAVITVE.IME_LISTA + '" še nima glave.');

  // List, skrčen na eno samo vrstico (mogoče po `pociistiOdvecneVrstice`), naredi
  // sklic `A2:A` neveljaven in vsaka formula pokaže #REF!.
  if (leadi.getMaxRows() < 2) leadi.insertRowsAfter(1, 49);

  var vir = "'" + NASTAVITVE.IME_LISTA + "'!";
  /** Odprt razpon enega stolpca: od druge vrstice do konca, da nove oddaje šteje samodejno. */
  var R = function (ime) {
    var crka = crkaStolpca(glava, ime);
    return vir + crka + '2:' + crka;
  };
  /** Celoten podatkovni pravokotnik — QUERY naslavlja stolpce po črkah v njem. */
  var vse = vir + 'A2:' + crkaIzIndeksa(glava.length);

  var stevilo = R(PREJETO);
  var posvet = R(KLICI_TAKOJ);
  var klicano = R(POKLICANO);
  var dogovorjen = R(SESTANEK);
  var datumSestanka = R(SESTANEK_DATUM);
  var letno = R(LETNO);

  var skupaj = 'COUNTA(' + stevilo + ')';
  var poklicanih = 'COUNTIF(' + klicano + ',TRUE)';
  var prosijo = 'COUNTIF(' + posvet + ',"DA")';
  var caka = prosijo + '-COUNTIFS(' + posvet + ',"DA",' + klicano + ',TRUE)';
  // TRUE in ne COUNTA: odkljukano polje ni prazna celica, ampak FALSE, in COUNTA
  // bi ga štela — vsak sestanek, ki ga je kdo obkljukal in nato odkljukal, bi
  // ostal v številki za vedno.
  var sestankov = 'COUNTIF(' + dogovorjen + ',TRUE)';

  // ── Kartice: pet številk, ki jih človek prebere v dveh sekundah ────────────
  var kartice = [
    ['ŠE ZA POKLICATI', '=' + caka, '#.##0', true],
    ['PROSIJO ZA POSVET', '=' + prosijo, '#.##0', false],
    ['POKLICANI', '=' + poklicanih, '#.##0', false],
    ['LEADOV SKUPAJ', '=' + skupaj, '#.##0', false],
    ['LETNI ZNESEK', '=SUM(' + letno + ')', '#.##0 €', false],
  ];

  // ── Podatkovni del: tabele, iz katerih grafi jemljejo ─────────────────────
  var podrobno = [
    ['Najstarejši nepoklicani (dni)', '=IFERROR(INT(TODAY()-MIN(FILTER(' + stevilo + ',' + stevilo + '<>"",' + klicano + '<>TRUE))),"—")', '#.##0'],
    ['Novi zadnjih 7 dni', '=COUNTIFS(' + stevilo + ',">="&TODAY()-6)', '#.##0'],
    ['Novi zadnjih 30 dni', '=COUNTIFS(' + stevilo + ',">="&TODAY()-29)', '#.##0'],
    ['Brez telefonske številke', '=' + skupaj + '-COUNTA(' + R('phone') + ')', '#.##0'],
    // Nadomestilo za „poklicani brez vpisanega izida": odkar je `sestanek`
    // kljukica, neobkljukano polje pomeni tako „sestanka ni" kot „še nisem
    // vpisal" in tega dvojega ni mogoče razločiti. Dogovorjen sestanek brez
    // datuma pa je enako zanesljiv znak nedokončanega vnosa — in ga je mogoče
    // prešteti.
    ['Sestanki brez vpisanega datuma', '=MAX(0,' + sestankov + '-COUNTIFS(' + dogovorjen + ',TRUE,' + datumSestanka + ',"<>"))', '#.##0'],
    ['Delež poklicanih', '=IF(' + skupaj + '=0,"—",' + poklicanih + '/' + skupaj + ')', '0 %'],
    // Odstotek pri malo klicih ni metrika, ampak motnja: pri treh klicih skače
    // med 0, 33, 67 in 100 %. Pod desetimi zato pokaže n in ne deleža.
    ['Sestanki na poklicanega', '=IF(' + poklicanih + '<10,"n="&' + poklicanih + '&" — premalo za odstotek",' + sestankov + '/' + poklicanih + ')', '0 %'],
    ['Letni znesek nepoklicanih', '=SUM(' + letno + ')-SUMIF(' + klicano + ',TRUE,' + letno + ')', '#.##0 €'],
    // Mediana in največji namesto povprečja: pri nekaj leadih en velik posel
    // povsem določi povprečje in številka govori o njem, ne o lijaku.
    ['Mediana letnega zneska', '=IF(' + skupaj + '=0,"—",MEDIAN(' + letno + '))', '#.##0 €'],
    ['Največji posamezen znesek', '=IF(' + skupaj + '=0,"—",MAX(' + letno + '))', '#.##0 €'],
  ];

  var lijak = [
    ['Leadov skupaj', '=' + skupaj],
    ['Prosijo za posvet', '=' + prosijo],
    ['Poklicani', '=' + poklicanih],
    ['Sestanki', '=' + sestankov],
  ];

  // Dva deleža in ne več štirje: kljukica pozna samo dogovorjen sestanek in vse
  // ostalo. Imenovalec so POKLICANI in ne vsi leadi — sicer bi graf govoril o
  // tem, koliko klicev še ni bilo, ne o tem, kako se klici iztečejo.
  var izidi = [
    ['sestanek dogovorjen', '=' + sestankov],
    ['brez sestanka', '=MAX(0,' + poklicanih + '-' + sestankov + ')'],
  ];

  var vrsta =
    '=IFERROR(SORT(FILTER({' +
    [R(PREJETO), R('firstName'), R('lastName'), R('companyName'), R('phone'), R(LETNO)].join(',') +
    '},' + stevilo + '<>"",' + posvet + '="DA",' + klicano + '<>TRUE),1,TRUE),"Nikogar ni za poklicati.")';

  var poMesecih =
    '=IFERROR(QUERY({ARRAYFORMULA(IF(' + stevilo + '="","",TEXT(' + stevilo + ',"yyyy-mm"))),' + letno +
    '},"select Col1, count(Col1), sum(Col2) where Col1 is not null and Col1 <> \'\' ' +
    "group by Col1 order by Col1 asc label Col1 'Mesec', count(Col1) 'Leadov', sum(Col2) 'Letni znesek'\",0)," +
    '"Ni podatkov.")';

  var skupine = [
    ['PO DEJAVNOSTI', 'industryLabel'],
    ['PO VIRU OBISKA', 'utmSource'],
    ['PO ZANESLJIVOSTI VNOSA', 'confidence'],
    ['PO VELIKOSTI PODJETJA', 'sizeClass'],
  ].map(function (blok) {
    return [blok[0], skupinskaFormula(vse, crkaStolpca(glava, blok[1]), crkaStolpca(glava, LETNO))];
  });

  var kontrolna = kontrolnaFormula(vir, glava);

  // ŠELE ZDAJ čiščenje. Vse zgoraj sme vreči napako (manjkajoč stolpec), in če
  // bi list počistili prej, bi uporabniku ostal prazen — brez podatkov in brez
  // pojasnila, kaj je šlo narobe.
  var list = pridobiListPoImenu(NASTAVITVE.IME_LISTA_ANALITIKA);
  list.clear();
  // Grafov `clear` NE odstrani. Brez tega bi se ob vsakem zagonu nabral nov
  // sloj čez starega, dokler lista ne bi bilo več mogoče brati.
  list.getCharts().forEach(function (graf) {
    list.removeChart(graf);
  });
  // Podatkovni del sega do stolpca AR; nov list ima 26 stolpcev.
  zagotoviStolpce(list, PODATKI_STOLPEC + 30);

  list.getRange('A1').setValue('LM-10 — analitika leadov');
  list
    .getRange('A2')
    .setValue(
      'Vse številke so žive: preračunajo se same, tudi ko klicatelj obkljuka klic. ' +
        'Ta list se ob vsakem zagonu „urediStolpce" sestavi na novo — vanj ne pišite ročno.',
    );
  list.getRange('A3').setFormula(kontrolna);

  kartice.forEach(function (kartica, i) {
    var stolpec = 1 + i * 2;
    list.getRange(KARTICE_VRSTICA, stolpec).setValue(kartica[0]);
    list.getRange(KARTICE_VRSTICA + 1, stolpec).setFormula(kartica[1]).setNumberFormat(kartica[2]);
  });

  // Podatkovni del desno od grafov: grafi potrebujejo vir na listu, človek pa
  // pogled brez njega.
  var p = function (zamik) {
    return PODATKI_STOLPEC + zamik;
  };
  list.getRange(4, p(0)).setValue('PODATKI ZA GRAFE — ne brišite');

  list.getRange(5, p(0)).setValue('PODROBNO');
  list.getRange(6, p(0), podrobno.length, 2).setValues(
    podrobno.map(function (v) {
      return [v[0], v[1]];
    }),
  );
  podrobno.forEach(function (v, i) {
    list.getRange(6 + i, p(1)).setNumberFormat(v[2]);
  });

  list.getRange(5, p(3)).setValue('LIJAK');
  list.getRange(6, p(3), lijak.length, 2).setValues(lijak);

  list.getRange(5, p(6)).setValue('IZIDI KLICEV');
  list.getRange(6, p(6), izidi.length, 2).setValues(izidi);

  list.getRange(5, p(9)).setValue('PO MESECIH');
  list.getRange(6, p(9)).setFormula(poMesecih);

  skupine.forEach(function (blok, i) {
    var stolpec = p(13 + i * 4);
    list.getRange(5, stolpec).setValue(blok[0]);
    list.getRange(6, stolpec).setFormula(blok[1]);
  });

  list.getRange(VRSTA_VRSTICA, 1).setValue('ZA POKLICATI — najstarejši najprej');
  list
    .getRange(VRSTA_VRSTICA + 1, 1, 1, 6)
    .setValues([['Oddal', 'Ime', 'Priimek', 'Podjetje', 'Telefon', 'Letni znesek']]);
  list.getRange(VRSTA_VRSTICA + 2, 1).setFormula(vrsta);

  narisiGrafe(list, izidi.length);
  urediVidezAnalitike(list, kartice.length);
  zascitiOpozorilno(list);
  return 'Analitika sestavljena.';
}

/** Prvi stolpec podatkovnega dela (N) in vrstice, ki jih deli več funkcij. */
var PODATKI_STOLPEC = 14;
var KARTICE_VRSTICA = 5;
var GRAFI_VRSTICA = 9;
var VRSTA_VRSTICA = 44;

/**
 * Štirje grafi nad podatkovnim delom.
 *
 * Vsak graf potrebuje SOSEDNJA stolpca (oznaka, število) — od tod postavitev
 * tabel v podatkovnem delu. Razponi so namerno daljši od podatkov: QUERY vrne
 * toliko vrstic, kolikor jih je, graf pa prazne preprosto izpusti.
 */
function narisiGrafe(list, steviloIzidov) {
  var p = function (zamik) {
    return PODATKI_STOLPEC + zamik;
  };
  var grafi = [
    {
      naslov: 'Lijak: od leada do sestanka',
      vrsta: Charts.ChartType.COLUMN,
      razpon: list.getRange(6, p(3), 4, 2),
      vrstica: GRAFI_VRSTICA,
      stolpec: 1,
    },
    {
      naslov: 'Izidi klicev',
      vrsta: Charts.ChartType.PIE,
      razpon: list.getRange(6, p(6), steviloIzidov, 2),
      vrstica: GRAFI_VRSTICA,
      stolpec: 6,
    },
    {
      naslov: 'Leadi po mesecih',
      vrsta: Charts.ChartType.COLUMN,
      razpon: list.getRange(7, p(9), 24, 2),
      vrstica: GRAFI_VRSTICA + 17,
      stolpec: 1,
    },
    {
      naslov: 'Leadi po dejavnosti',
      vrsta: Charts.ChartType.BAR,
      razpon: list.getRange(7, p(13), 15, 2),
      vrstica: GRAFI_VRSTICA + 17,
      stolpec: 6,
    },
  ];

  grafi.forEach(function (graf) {
    list.insertChart(
      list
        .newChart()
        .setChartType(graf.vrsta)
        .addRange(graf.razpon)
        .setPosition(graf.vrstica, graf.stolpec, 0, 0)
        .setOption('title', graf.naslov)
        .setOption('width', 460)
        .setOption('height', 260)
        .setOption('legend', graf.vrsta === Charts.ChartType.PIE ? { position: 'right' } : { position: 'none' })
        .build(),
    );
  });
}

/** Naslovi, velike številke na karticah, širine. Nič od tega ne nosi podatka. */
function urediVidezAnalitike(list, steviloKartic) {
  list.getRange('A1').setFontSize(16).setFontWeight('bold');
  list.getRange('A2').setFontColor('#5f6368').setFontStyle('italic');
  list.getRange('A3').setFontColor('#c5221f').setFontWeight('bold');

  for (var i = 0; i < steviloKartic; i++) {
    var stolpec = 1 + i * 2;
    list
      .getRange(KARTICE_VRSTICA, stolpec, 1, 2)
      .merge()
      .setFontSize(9)
      .setFontColor('#5f6368')
      .setHorizontalAlignment('center');
    list
      .getRange(KARTICE_VRSTICA + 1, stolpec, 1, 2)
      .merge()
      .setFontSize(24)
      .setFontWeight('bold')
      .setHorizontalAlignment('center')
      // Prva kartica je naloga in ne podatek — edina, ki sme izstopati.
      .setFontColor(i === 0 ? '#c5221f' : '#202124');
  }

  list.getRange(VRSTA_VRSTICA, 1).setFontWeight('bold').setBackground('#f1f3f4');
  list.getRange(VRSTA_VRSTICA + 1, 1, 1, 6).setFontWeight('bold');

  for (var stolpec = 1; stolpec <= 10; stolpec++) {
    list.setColumnWidth(stolpec, [120, 110, 120, 200, 140, 120, 120, 120, 120, 120][stolpec - 1]);
  }
  list.setColumnWidth(PODATKI_STOLPEC, 230);

  list.setFrozenRows(3);
}

/**
 * Opozorilo ob urejanju lista — ne prepoved.
 *
 * List je sestavljen iz formul in se ob vsakem `urediStolpce` napiše na novo:
 * kar kdo vpiše vanj, se tiho izgubi. Opozorilo to pove v trenutku, ko se
 * dogaja. Prepoved bi bila premočna: uporabnik si sme kaj pripisati, le vedeti
 * mora, da ne bo obstalo.
 *
 * V try/catch, ker je zaščita razkošje: v skupni rabi ali brez pravic klic
 * odpove, analitika pa je tedaj vseeno sestavljena.
 */
function zascitiOpozorilno(list, opis) {
  try {
    list.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(function (prejsnja) {
      prejsnja.remove();
    });
    list
      .protect()
      .setDescription(opis || 'Analitika se sestavi samodejno — ročni vnosi se ob naslednjem zagonu izgubijo.')
      .setWarningOnly(true);
  } catch (err) {
    console.warn('Lista ni bilo mogoče zaščititi: ' + err);
  }
}

/**
 * Preveri, da glava lista Leadi še stoji tam, kjer jo formule pričakujejo.
 *
 * Prazno, dokler je vse prav; sicer stavek, ki pove, kaj storiti. Brez tega bi
 * premaknjen stolpec pomenil, da COUNTIF nad "poklicano" šteje telefonske
 * številke in vrne 0 — kar je videti kot veljaven odgovor.
 */
function kontrolnaFormula(vir, glava) {
  var pogoji = [PREJETO, KLICI_TAKOJ, POKLICANO, SESTANEK, SESTANEK_DATUM, OPOMBE, LETNO].map(function (ime) {
    return vir + '$' + crkaStolpca(glava, ime) + '$1="' + ime + '"';
  });
  return (
    '=IF(AND(' +
    pogoji.join(',') +
    '),"","OPOZORILO: stolpci na listu ' +
    NASTAVITVE.IME_LISTA +
    ' so se premaknili — številke spodaj so napačne. Poženite urediAnalitiko.")'
  );
}

/** QUERY s štetjem in vsoto po eni skupini; prazne skupine odpadejo. */
function skupinskaFormula(vse, stolpec, znesek) {
  return (
    '=IFERROR(QUERY(' +
    vse +
    ',"select ' +
    stolpec +
    ', count(' +
    stolpec +
    '), sum(' +
    znesek +
    ') where ' +
    stolpec +
    " is not null and " +
    stolpec +
    " <> '' group by " +
    stolpec +
    ' order by count(' +
    stolpec +
    ") desc label count(" +
    stolpec +
    ") 'Leadov', sum(" +
    znesek +
    ") 'Letni znesek'\",0),\"Ni podatkov.\")"
  );
}

/**
 * Črka stolpca za dano IME iz glave lista Leadi.
 *
 * Napaka in ne tiha prazna vrednost: `undefined` v formuli da #REF!, ki ga na
 * listu s tridesetimi formulami nihče ne opazi, dokler se kdo ne zanese na
 * številko, ki je ni.
 */
function crkaStolpca(glava, ime) {
  var i = glava.indexOf(ime);
  if (i === -1) {
    // Z vsebino glave: brez nje je sporočilo slepa ulica. Ime lahko manjka, ker
    // ga je kdo preimenoval, ker je v celici presledek ali ker se bere glava
    // napačnega lista — vsak od teh treh vzrokov terja drugačen ukrep, iz golega
    // "stolpca ni" pa se jih ne da ločiti.
    throw new Error(
      'Stolpca "' +
        ime +
        '" v glavi ni — analitike ni mogoče sestaviti. Glava ima ' +
        glava.length +
        ' stolpcev: ' +
        glava.slice(0, 8).join(', ') +
        (glava.length > 8 ? ', …' : ''),
    );
  }
  return crkaIzIndeksa(i + 1);
}

/** 1 → A, 26 → Z, 27 → AA. */
function crkaIzIndeksa(stevilka) {
  var crka = '';
  var n = stevilka;
  while (n > 0) {
    var ostanek = (n - 1) % 26;
    crka = String.fromCharCode(65 + ostanek) + crka;
    n = Math.floor((n - 1) / 26);
  }
  return crka;
}

/** A → 1, AA → 27. Obratna pot, za nastavljanje širin po črki. */
function indeksIzCrke(crka) {
  var n = 0;
  for (var i = 0; i < crka.length; i++) {
    n = n * 26 + (crka.charCodeAt(i) - 64);
  }
  return n;
}

/**
 * Nov list ima 26 stolpcev, izvoz jih ima krepko čez štirideset. Brez tega
 * zapis glave pade z "obseg presega mejo lista" — in z njim vsaka oddaja.
 */
function zagotoviStolpce(list, koliko) {
  var obstojeci = list.getMaxColumns();
  if (koliko > obstojeci) list.insertColumnsAfter(obstojeci, koliko - obstojeci);
}

function preberiGlavo(list) {
  if (list.getLastRow() === 0 || list.getLastColumn() === 0) return [];
  return list
    .getRange(1, 1, 1, list.getLastColumn())
    .getValues()[0]
    .map(function (celica) {
      return String(celica);
    });
}

/**
 * Vrednost, pripravljena za celico.
 *
 * Vse iz aplikacije pride kot niz, preglednica pa nize razlaga po svoje:
 * "+386 1 234 5678" razume kot formulo in pokaže napako, davčni "01234567" pa
 * kot število in poje vodilno ničlo. Zato dvoje:
 *
 * - v število pretvorimo SAMO tisto, kar se pretvori brez izgube (`String(Number(v))
 *   === v`) — s tem odpadejo vodilne ničle in števila, daljša od natančnosti;
 * - vse drugo, kar bi preglednica utegnila razlagati (formule, vodilni znaki,
 *   karkoli se začne s števko), zaklenemo z uvodnim opuščajem. Ta se v celici ne
 *   vidi in vsebina ostane natanko taka, kot jo je vpisal obiskovalec.
 */
function zaCelico(vrednost) {
  if (vrednost === undefined || vrednost === null) return '';
  if (typeof vrednost !== 'string') return vrednost;
  if (vrednost === '') return '';
  if (/^-?\d+(\.\d+)?$/.test(vrednost) && String(Number(vrednost)) === vrednost) {
    return Number(vrednost);
  }
  if (/^[=+\-@'\d]/.test(vrednost)) return "'" + vrednost;
  return vrednost;
}

function pridobiList() {
  return pridobiListPoImenu(NASTAVITVE.IME_LISTA);
}

function pridobiListPoImenu(ime) {
  var preglednica = pridobiPreglednico();
  var list = preglednica.getSheetByName(ime);
  if (!list) {
    list = preglednica.insertSheet(ime);
  }
  return list;
}

/**
 * Koliko vrstic je pravih leadov: tistih s časom prejema. Vse ostale so sled
 * oblikovanja in jih pobriše `urediStolpce` (glej `jePraznoZaKlicatelja`).
 * Nikoli ne vrže — doGet je diagnostika in ne sme pasti zaradi lastne meritve.
 */
function prestejLeade(list) {
  try {
    var glava = preberiGlavo(list);
    var stolpec = glava.indexOf(PREJETO) + 1;
    var vrstic = list.getLastRow() - 1;
    if (!stolpec || vrstic < 1) return 0;
    var vrednosti = list.getRange(2, stolpec, vrstic, 1).getValues();
    var n = 0;
    for (var i = 0; i < vrednosti.length; i++) {
      if (String(vrednosti[i][0]).trim() !== '') n++;
    }
    return n;
  } catch (err) {
    return 'ni bilo mogoče prešteti (' + err + ')';
  }
}

/** List po imenu ali null — za branje stanja, ki ne sme ustvariti ničesar (doGet). */
function poisciList(ime) {
  return pridobiPreglednico().getSheetByName(ime);
}

function pridobiPreglednico() {
  var preglednica = NASTAVITVE.ID_PREGLEDNICE
    ? SpreadsheetApp.openById(NASTAVITVE.ID_PREGLEDNICE)
    : SpreadsheetApp.getActive();
  if (!preglednica) {
    throw new Error('Preglednice ni: skripta ni v preglednici in ID_PREGLEDNICE ni nastavljen.');
  }
  return preglednica;
}

/** Čas prejema zadnjega dogodka (prvi stolpec zadnje vrstice) — za doGet. */
function zadnjiPrejemDogodka(list) {
  var zadnja = list.getRange(list.getLastRow(), 1).getValue();
  return zadnja instanceof Date ? zadnja.toISOString() : String(zadnja);
}

/**
 * Preizkusno sporočilo — poženite ga v urejevalniku (Zaženi), ne po webhooku.
 *
 * Obstaja zaradi pasti, ki je stala nekaj krogov: dovoljenja za pošto Google ne
 * zahteva ob razmestitvi, ampak šele ob prvem klicu MailApp. Web app tedaj pade
 * z "Nimate dovoljenja", napako pa doPost namenoma pogoltne — vrstice so se
 * pisale, pošte pa ni bilo in od zunaj ni bilo videti, zakaj.
 *
 * Zagon te funkcije iz urejevalnika sproži vprašanje za dovoljenje takrat, ko ste
 * ob računalniku, in v istem koraku dokaže, da pošta res pride.
 */
function preizkusPoste() {
  if (!NASTAVITVE.E_NASLOV_ZA_OBVESTILA) {
    throw new Error('E_NASLOV_ZA_OBVESTILA je prazen — vpišite naslov in shranite.');
  }
  MailApp.sendEmail({
    to: NASTAVITVE.E_NASLOV_ZA_OBVESTILA,
    subject: 'LM-10: preizkus obvestila',
    body:
      'Če ste to sporočilo prejeli, ima skripta dovoljenje za pošiljanje in obvestila o novih leadih bodo prihajala sem.\n\n' +
      'Preostane le še razmestitev nove različice (Deploy → Manage deployments → svinčnik → New version).',
  });
  console.log('Poslano na ' + NASTAVITVE.E_NASLOV_ZA_OBVESTILA + '. Preostala dnevna kvota: ' + MailApp.getRemainingDailyQuota());
}

/**
 * Vzorčno poročilo stranki — poženite ga v urejevalniku; gre na prvi naslov iz
 * E_NASLOV_ZA_OBVESTILA.
 *
 * Dvoje pokaže naenkrat: kako sporočilo izgleda v pravem nabiralniku (ime
 * pošiljatelja, odgovor na, besedilo, priloga) in ali ima skripta dovoljenje
 * za pošto (glej `preizkusPoste`). Priloga je vzorčen PDF z eno prazno stranjo,
 * ne pravo poročilo.
 */
function preizkusPorocilaStranki() {
  var naslov = String(NASTAVITVE.E_NASLOV_ZA_OBVESTILA || '').split(',')[0].trim();
  if (!naslov) throw new Error('E_NASLOV_ZA_OBVESTILA je prazen — vpišite naslov in shranite.');
  var vzorec =
    '%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 150]>>endobj\n' +
    'trailer<</Root 1 0 R>>\n%%EOF\n';
  var izid = posljiPorociloStranki(
    {
      attachments: [
        {
          filename: PREDPONA_POROCILA_STRANKE + '-vzorec.pdf',
          contentType: 'application/pdf',
          base64: Utilities.base64Encode(vzorec),
          audience: 'customer',
        },
      ],
    },
    { email: naslov, firstName: 'Ana', companyName: 'Vzorčno podjetje d.o.o.', consentConsulting: 'true' },
  );
  if (!izid.poslano) {
    throw new Error('Vzorec ni odšel: ' + (RAZLOGI_POROCILA_STRANKI[izid.razlog] || izid.razlog));
  }
  console.log('Vzorčno poročilo poslano na ' + naslov + '. Preostala dnevna kvota: ' + MailApp.getRemainingDailyQuota());
}

/**
 * Obvestilo o novem leadu.
 *
 * Vsebina je izbrana tako, da se je mogoče odločiti brez odpiranja preglednice:
 * kdo, iz katere panoge, kako velik, koliko ga stane in ali je PROSIL za posvet.
 * Zadnje je edino polje, ki pove namero in ne le dovoljenja, zato stoji v zadevi.
 * Pripeta sta oba PDF-ja (`priloge`, glej `pripraviPriloge`): poročilo za
 * stranko in priprava na pogovor — isti datoteki, kot ju aplikacija zgradi za
 * stranko oziroma svetovalca. Vrstica "Poročilo stranki" pove, ali je stranka
 * svoj PDF dobila po e-pošti (`porociloStranki`, glej `posljiPorociloStranki`)
 * — kadar ga ni, ji ga zna svetovalec posredovati iz te priloge.
 *
 * Dnevna kvota MailApp je 100 prejemnikov pri navadnem Google računu in 1500 pri
 * Workspacu — za lead magnet daleč dovolj, a ob množičnem testiranju jo je mogoče
 * izčrpati; tedaj obvestila utihnejo, vrstice pa se pišejo naprej.
 */
function posljiObvestilo(vrednosti, priloge, porociloStranki) {
  var prejemniki = String(NASTAVITVE.E_NASLOV_ZA_OBVESTILA || '').trim();
  if (!prejemniki) return;
  priloge = priloge || [];

  var v = function (ime) {
    return vrednosti[ime] === undefined || vrednosti[ime] === '' ? '—' : String(vrednosti[ime]);
  };
  var posvet = String(vrednosti.consentConsulting) === 'true';
  var podjetje = v('companyName');
  var letno = stevilo(vrednosti.directLossEUR) + stevilo(vrednosti.lostMarginEUR) + stevilo(vrednosti.capacityEUR);

  var vrstice = [
    (posvet ? 'PROSI ZA POSVET.' : ''),
    'Podjetje: ' + podjetje + ' (' + v('industryLabel') + ', ' + v('sizeClass') + ' zaposlenih)',
    'Kontakt: ' + v('firstName') + ' ' + v('lastName') + ', ' + v('role'),
    'E-naslov: ' + v('email'),
    'Telefon: ' + v('phone'),
    'Davčna: ' + v('taxNumber'),
    '',
    'Letni izračun: ' + Utilities.formatString('%s EUR', letno.toLocaleString('sl-SI')),
    '  odliv: ' + v('directLossEUR') + ' EUR · nezaslužena marža: ' + v('lostMarginEUR') +
      ' EUR · vrednost časa: ' + v('capacityEUR') + ' EUR',
    'Enkratni kapital: ' + v('oneTimeCapitalEUR') + ' EUR',
    'Zanesljivost vnosa: ' + v('confidence'),
    'Področja: ' + v('selectedModules'),
    'Sekvenca: ' + v('followUpSequence') + ' · vir: ' + v('utmSource'),
    '',
    // Imeni datotek ali razlog, da ju ni — brez te vrstice bi manjkajoča priloga
    // izgledala kot napaka poštnega odjemalca.
    'Priloge: ' +
      (priloge.length
        ? priloge
            .map(function (priloga) {
              return priloga.getName();
            })
            .join(', ')
        : 'brez — aplikacija jih ni poslala'),
    'Poročilo stranki: ' + opisIzidaPorocila(porociloStranki),
    'Prodajna priprava: ' + v('prodajnaPriprava'),
    'Preglednica: ' + pridobiList().getParent().getUrl(),
  ].filter(function (vrstica) {
    return vrstica !== '';
  });

  var sporocilo = {
    to: prejemniki,
    subject: (posvet ? '[POSVET] ' : '') + 'Nov lead: ' + podjetje,
    body: vrstice.join('\n'),
  };
  if (priloge.length) sporocilo.attachments = priloge;
  MailApp.sendEmail(sporocilo);
}

/**
 * Prilogi obvestila iz telesa zahteve: PDF-ja v base64, kot ju je aplikacija
 * zgradila ob oddaji (`attachments` v `src/lib/submitLead.ts`).
 *
 * Nikoli ne vrže: pokvarjen vnos se preskoči in obvestilo gre brez njega —
 * vrstica in sporočilo nista nikoli odvisna od priloge. Skupaj merita okoli
 * 100 kB; meja MailApp za sporočilo je 25 MB.
 */
function pripraviPriloge(oddaja) {
  var vnosi = oddaja && Array.isArray(oddaja.attachments) ? oddaja.attachments : [];
  var priloge = [];
  for (var i = 0; i < vnosi.length; i++) {
    var priloga = dekodirajPrilogo(vnosi[i], i);
    if (priloga) priloge.push(priloga);
  }
  return priloge;
}

/** En vnos iz `attachments` kot Blob — ali null z opozorilom, kadar je pokvarjen. */
function dekodirajPrilogo(vnos, indeks) {
  vnos = vnos || {};
  try {
    return Utilities.newBlob(
      Utilities.base64Decode(String(vnos.base64 || '')),
      String(vnos.contentType || 'application/pdf'),
      String(vnos.filename || 'priloga-' + (indeks + 1) + '.pdf'),
    );
  } catch (err) {
    console.warn('Priloga ' + (indeks + 1) + ' ni bila dekodirana: ' + err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Poročilo stranki po e-pošti
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Predpona imena strankinega poročila (`src/lib/pdf.ts`) — rezerva za starejši
 * build aplikacije, ki prilog še ne označuje z `audience`.
 */
var PREDPONA_POROCILA_STRANKE = 'datalab-analiza-skritih-stroskov';

/**
 * Razlogi, zakaj poročilo stranki ni odšlo. Ključ potuje v odgovor aplikaciji
 * (`customerReport.reason`, glej `parseCustomerReport` v src/lib/submitLead.ts),
 * besedilo v obvestilo prodaji in v stolpec vrstice.
 */
var RAZLOGI_POROCILA_STRANKI = {
  disabled: 'pošiljanje je izklopljeno (POSLJI_POROCILO_STRANKI)',
  no_address: 'v oddaji ni e-naslova',
  invalid_address: 'e-naslov ni videti veljaven',
  no_attachment: 'aplikacija ni poslala strankinega PDF-ja',
  send_failed: 'pošiljanje je vrglo napako',
  // Načina POSTA_PREK_AC. `queued` ni napaka: sporočilo je predano AC in prispe
  // v minuti ali dveh, česar odgovor ob oddaji ne more potrditi.
  queued: 'predano ActiveCampaignu — avtomatizacija pošlje povezavo do PDF-ja',
  unsubscribed: 'kontakt se je s seznama v AC odjavil sam — AC mu ne pošilja',
};

/**
 * Ali je vnos med prilogami strankino poročilo.
 *
 * Odloča oznaka `audience` iz aplikacije: 'customer' je poročilo za stranko,
 * 'sales' priprava na pogovor — ta stranki ne gre NIKOLI, tudi če bi bila
 * datoteka poimenovana kot poročilo. Brez oznake (starejši build) odloči
 * predpona imena datoteke.
 */
function jePrilogaZaStranko(vnos) {
  if (!vnos || vnos.audience === 'sales') return false;
  if (vnos.audience === 'customer') return true;
  return String(vnos.filename || '').indexOf(PREDPONA_POROCILA_STRANKE) === 0;
}

/** Strankino poročilo iz telesa zahteve kot Blob — ali null, če ga ni ali je pokvarjeno. */
function prilogaZaStranko(oddaja) {
  var vnosi = oddaja && Array.isArray(oddaja.attachments) ? oddaja.attachments : [];
  for (var i = 0; i < vnosi.length; i++) {
    if (jePrilogaZaStranko(vnosi[i])) return dekodirajPrilogo(vnosi[i], i);
  }
  return null;
}

/**
 * Priprava na pogovor iz telesa zahteve kot Blob — ali null.
 *
 * Zrcalo `prilogaZaStranko` in enako strogo: šteje SAMO oznaka `audience:
 * 'sales'`. Brez nje (starejši build) vrne null in `shraniPripravo` pade na
 * HTML — raje starejša oblika istega dokumenta kot tveganje, da bi se pod
 * pripravo shranilo strankino poročilo in bi ga prodaja dobila namesto priprave.
 */
function prilogaZaProdajo(oddaja) {
  var vnosi = oddaja && Array.isArray(oddaja.attachments) ? oddaja.attachments : [];
  for (var i = 0; i < vnosi.length; i++) {
    if (vnosi[i] && vnosi[i].audience === 'sales') return dekodirajPrilogo(vnosi[i], i);
  }
  return null;
}

/**
 * Poročilo za stranko na e-naslov iz obrazca — z eno samo prilogo.
 *
 * To je obljuba obrazca ("PDF poročilo prejmete na vpisani e-naslov"). Aplikacija
 * iz izida izve, ali jo je skripta izpolnila; kadar je ni, stranki na rezultatih
 * ponudi prenos. Zato izid ne sme biti nikoli izgubljen: funkcija nikoli ne vrže
 * in vsak izhod vrne { poslano, razlog, naslov } ter ga zapiše v lastnosti
 * skripte, da je viden v doGet.
 *
 * Vrstni red preverb: nastavitev → naslov → priloga → pošiljanje. Neveljaven
 * naslov se ujame PRED klicem MailApp: njegova izjema ("Invalid email") bi
 * sicer pristala kot splošna napaka pošiljanja in zakrila pravi vzrok.
 *
 * Priloga je natanko ena — tista z oznako 'customer' (`prilogaZaStranko`).
 * Seznam iz `pripraviPriloge` (oba PDF-ja) sem ne pride nikoli; to je edino
 * mesto v skripti, ki stranki karkoli pošlje.
 */
/**
 * Neposlano poročilo z razlogom — zapisano tudi v lastnosti, da je vidno v doGet.
 * Skupno obema načinoma (MailApp in AC), da je zapis povsod enak.
 */
function neposlanoPorocilo(razlog) {
  PropertiesService.getScriptProperties().setProperty(
    'ZADNJA_POSTA_STRANKI',
    new Date().toISOString() + ' — ni poslano (' + razlog + ')',
  );
  return { poslano: false, razlog: razlog, naslov: '' };
}

/**
 * Skupne preverbe pred poročilom: nastavitev, naslov, priloga.
 *
 * Ločene od pošiljanja, ker veljajo v OBEH načinih — MailApp jih potrebuje pred
 * `MailApp.sendEmail`, način AC pred razlagalo izida (`izidPorocilaPrekAC`).
 * Vrne `{ razlog }` ob zavrnitvi ali `{ naslov, priloga }`, ko je vse v redu.
 */
function preveriPorociloStranki(oddaja, vrednosti) {
  if (!NASTAVITVE.POSLJI_POROCILO_STRANKI) return { razlog: 'disabled' };

  var naslov = String(
    (vrednosti && vrednosti.email) || (oddaja && oddaja.record && oddaja.record.email) || '',
  ).trim();
  if (!naslov) return { razlog: 'no_address' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(naslov)) return { razlog: 'invalid_address' };

  var priloga = prilogaZaStranko(oddaja);
  if (!priloga) {
    // Navaden izid in ne opozorilo: starejši build ali PDF, ki v brskalniku ni
    // nastal. Aplikacija ob tem odgovoru ponudi prenos.
    console.log('Poročilo stranki ni poslano: v oddaji ni strankinega PDF-ja.');
    return { razlog: 'no_attachment' };
  }
  return { naslov: naslov, priloga: priloga };
}

/**
 * Izid poročila v načinu POSTA_PREK_AC — brez pošiljanja: sporočilo pošlje
 * avtomatizacija v AC, ko se kontaktu spremeni polje %PDF_LINK%.
 *
 * Nikoli ne vrže in vedno vrne isto obliko kot `posljiPorociloStranki`, ker gre
 * ta izid v isti stolpec in v isti odgovor aplikaciji. Razlogi po vrsti:
 * skupne preverbe (nastavitev, naslov, priloga), nato stanje povezave na Drivu
 * (`send_failed` — brez nje AC nima česa poslati), nato stanje kontakta
 * (`unsubscribed` — odjavljenemu AC ne pošilja), sicer `queued`.
 *
 * `queued` pokriva tudi AC, ki je ob oddaji odpovedal ali odpadel zaradi roka:
 * vrstico pobere ura, polje se tedaj nastavi in avtomatizacija sproži. Zato je
 * to obljuba "prispe v nekaj minutah" in ne potrditev — aplikacija ob njej
 * obdrži gumb za prenos.
 */
function izidPorocilaPrekAC(oddaja, vrednosti, povezavaPorocila, izidAC) {
  var preverba = preveriPorociloStranki(oddaja, vrednosti);
  if (preverba.razlog) return neposlanoPorocilo(preverba.razlog);

  var povezava = String(povezavaPorocila || '');
  if (!povezava || povezava.indexOf('NAPAKA') === 0) {
    // Brez povezave polje ostane prazno in avtomatizacija se ne sproži. Razlog
    // je zapisan že v stolpcu porociloPdf in v ZADNJA_NAPAKA_POROCILA_NA_DRIVU.
    console.warn('Poročila ni mogoče predati AC: povezave do PDF-ja ni.');
    return neposlanoPorocilo(povezava ? 'send_failed' : 'no_attachment');
  }

  if (izidAC && izidAC.poslano && izidAC.narocen === false) {
    return neposlanoPorocilo('unsubscribed');
  }

  PropertiesService.getScriptProperties().setProperty(
    'ZADNJA_POSTA_STRANKI',
    new Date().toISOString() +
      ' → prek AC, ' +
      zakrijNaslove(preverba.naslov) +
      (izidAC && izidAC.poslano ? '' : ' (AC ob oddaji ni uspel — pobere ura)'),
  );
  return { poslano: false, razlog: 'queued', naslov: preverba.naslov };
}

function posljiPorociloStranki(oddaja, vrednosti) {
  var lastnosti = PropertiesService.getScriptProperties();
  var preverba = preveriPorociloStranki(oddaja, vrednosti);
  if (preverba.razlog) return neposlanoPorocilo(preverba.razlog);
  var naslov = preverba.naslov;
  var priloga = preverba.priloga;

  try {
    var sporocilo = sestaviSporociloStranki(vrednosti);
    var posiljka = {
      to: naslov,
      subject: sporocilo.subject,
      body: sporocilo.body,
      htmlBody: sporocilo.htmlBody,
      attachments: [priloga],
      name: NASTAVITVE.IME_POSILJATELJA || 'Datalab',
    };
    if (NASTAVITVE.ODGOVORI_NA) posiljka.replyTo = NASTAVITVE.ODGOVORI_NA;
    MailApp.sendEmail(posiljka);
    lastnosti.setProperty('ZADNJA_POSTA_STRANKI', new Date().toISOString() + ' → ' + zakrijNaslove(naslov));
    lastnosti.deleteProperty('ZADNJA_NAPAKA_POSTE_STRANKI');
    return { poslano: true, razlog: '', naslov: naslov };
  } catch (err) {
    // Kvota, izpad — vrstica je zapisana, obvestilo prodaji gre naprej. Zapisano
    // v lastnosti, ker je doGet edino, kar je o tem vidno od zunaj.
    console.warn('Poročila stranki ni bilo mogoče poslati: ' + err);
    lastnosti.setProperty(
      'ZADNJA_NAPAKA_POSTE_STRANKI',
      new Date().toISOString() + ' — ' + zakrijNaslove(String(err)),
    );
    return { poslano: false, razlog: 'send_failed', naslov: '' };
  }
}

/**
 * Sporočilo stranki: zadeva, golo besedilo in HTML.
 *
 * Transakcijsko sporočilo: prinese dokument, ki ga je oseba zahtevala z oddajo
 * obrazca (pravna podlaga je obvezna privolitev v obdelavo), zato v njem NI
 * ničesar, kar bi bilo trženje — ne ponudb, ne cen, ne vabil na vsebine. Ti
 * privolitvi sta ločeni (consentOffers, consentContent) in ju spoštuje
 * ActiveCampaign, ne to sporočilo. Vrednosti iz obrazca gredo v HTML skozi
 * `ubezajHtml`: prišle so z javnega webhooka.
 */
function sestaviSporociloStranki(vrednosti) {
  var v = function (ime) {
    var vrednost = vrednosti ? vrednosti[ime] : undefined;
    return vrednost === undefined || vrednost === null ? '' : String(vrednost).trim();
  };
  var ime = v('firstName');
  var podjetje = v('companyName') || 'vaše podjetje';
  var posvet = jePosvet(v('consentConsulting'));

  var pozdrav = ime ? 'Pozdravljeni, ' + ime + ',' : 'Pozdravljeni,';
  var odstavki = [
    'v priponki je poročilo »Analiza skritih stroškov« za ' +
      podjetje +
      ', sestavljeno iz vaših odgovorov v Datalabovem kalkulatorju. Vsebuje letni znesek, ' +
      'razčlenitev po področjih, formulo pod vsako postavko in tri ukrepe za ta teden.',
  ];
  if (posvet) {
    odstavki.push('Označili ste, da želite pogovor s svetovalcem — zahtevek je pri naši prodajni ekipi.');
  }
  odstavki.push(
    'Vprašanja o številkah: ' +
      KONTAKT_PRODAJE.ime + ', ' + KONTAKT_PRODAJE.telefon + ', ' + KONTAKT_PRODAJE.email + '.',
  );
  var podpis = ['Datalab Tehnologije, d. d.', 'Hajdrihova 28c, Ljubljana'];
  var noga =
    'To sporočilo ste prejeli, ker ste ta e-naslov vpisali v kalkulator skritih stroškov in zahtevali ' +
    'poročilo. Če ga niste zahtevali vi, sporočilo izbrišite.';

  var odstavek = function (besedilo, slog) {
    return '<p style="' + slog + '">' + ubezajHtml(besedilo) + '</p>';
  };
  var navaden = 'margin:0 0 16px';
  var htmlBody =
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1f2937;max-width:600px">' +
    odstavek(pozdrav, navaden) +
    odstavki
      .map(function (besedilo) {
        return odstavek(besedilo, navaden);
      })
      .join('') +
    '<p style="margin:24px 0 16px">' + ubezajHtml(podpis[0]) + '<br>' + ubezajHtml(podpis[1]) + '</p>' +
    odstavek(noga, 'margin:0;font-size:12px;color:#6b7280') +
    '</div>';

  return {
    subject: 'Analiza skritih stroškov — ' + podjetje,
    body: [pozdrav, '', odstavki.join('\n\n'), '', podpis.join('\n'), '', noga].join('\n'),
    htmlBody: htmlBody,
  };
}

/** HTML ubežanje za vrednosti z javnega webhooka, ki gredo v htmlBody. */
function ubezajHtml(besedilo) {
  return String(besedilo)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Ena vrstica za obvestilo prodaji: kam je poročilo šlo ali zakaj ni. */
function opisIzidaPorocila(izid) {
  if (!izid) return 'neznano';
  if (izid.poslano) return 'poslano na ' + izid.naslov;
  if (izid.razlog === 'queued') return 'predano ActiveCampaignu (polje PDF_LINK) → ' + izid.naslov;
  return (
    'NI poslano (' +
    (RAZLOGI_POROCILA_STRANKI[izid.razlog] || izid.razlog) +
    ') — stranka ima na rezultatih gumb za prenos'
  );
}

/** Izid pošte stranki v stolpec `porociloStranki` pravkar zapisane vrstice. Nikoli ne vrže. */
function zapisiIzidPorocila(zapisana, izid) {
  try {
    if (!zapisana || !zapisana.glava) return;
    var stolpec = zapisana.glava.indexOf(POROCILO_STRANKI) + 1;
    if (!stolpec) return;
    var cas = Utilities.formatDate(new Date(), 'Europe/Ljubljana', 'yyyy-MM-dd HH:mm');
    var besedilo = izid.poslano
      ? 'poslano ' + cas
      : izid.razlog === 'queued'
        ? 'prek AC ' + cas
        : 'ni poslano: ' + (RAZLOGI_POROCILA_STRANKI[izid.razlog] || izid.razlog);
    zapisana.list.getRange(zapisana.vrstica, stolpec).setValue(besedilo);
  } catch (err) {
    console.warn('Izida pošte stranki ni bilo mogoče zapisati v vrstico: ' + err);
  }
}

/** Odgovor doGet je javen, sporočila o napakah pa radi navedejo naslov. */
function zakrijNaslove(besedilo) {
  return besedilo.replace(/[\w.+-]+@([\w-]+\.)+\w+/g, function (naslov) {
    return naslov.charAt(0) + '***@' + naslov.split('@')[1];
  });
}

/** Vrednosti pridejo kot nizi; prazno polje je 0 in ne NaN. */
function stevilo(vrednost) {
  var n = Number(vrednost);
  return isNaN(n) ? 0 : n;
}

/**
 * Prodajno pripravo shrani na Drive in vrne povezavo; prazen niz, kadar je v
 * oddaji ni (ne PDF-ja ne HTML).
 *
 * V načinu `prekAC` se shrani PDF (priloga z oznako 'sales') in datoteka se deli
 * s povezavo: obvestilo prodaji pride iz AC in mora se odpreti brez prijave v
 * Google. Sicer — in kadar PDF-ja v oddaji ni — se shrani HTML kot doslej,
 * nedeljen.
 *
 * Napako VRŽE naprej: priprava brez Drive ne obstaja nikjer, zato jo doPost po
 * zapisani vrstici pošlje aplikaciji, ki pripravo prenese stranki (načelo 3 v
 * glavi). Poročilo spodaj ravna drugače — glej `shraniPorocilo`.
 */
function shraniPripravo(oddaja, prekAC) {
  var pdf = prekAC ? prilogaZaProdajo(oddaja) : null;
  if (!pdf && !(oddaja && oddaja.salesReportHtml)) return '';

  var mapa = pridobiMapo(NASTAVITVE.IME_MAPE_PRIPRAV, 'ID_MAPE_PRIPRAV');
  var blob = pdf
    ? Utilities.newBlob(pdf.getBytes(), 'application/pdf', imeDatoteke('priprava', oddaja.record, '.pdf'))
    : Utilities.newBlob(oddaja.salesReportHtml, 'text/html', imeDatoteke('priprava', oddaja.record, '.html'));

  var datoteka = mapa.createFile(blob);
  if (prekAC) deliSPovezavo(datoteka);
  return datoteka.getUrl();
}

/**
 * Strankino poročilo (PDF) shrani na Drive in vrne povezavo — prazen niz, kadar
 * poročila v oddaji ni (starejši build, PDF v brskalniku ni nastal), ali
 * "NAPAKA: …", kadar Drive odpove.
 *
 * Datoteka je NATANKO tista, ki gre stranki (`prilogaZaStranko`: oznaka
 * 'customer', nikoli priprava). Povezava gre v stolpec `porociloPdf` in od tam v
 * ActiveCampaign kot polje %PDF_LINK% — v načinu POSTA_PREK_AC je to edina pot,
 * po kateri stranka poročilo dobi, sicer pa kopija za CRM ob prilogi v pošti.
 *
 * NIKOLI NE VRŽE — drugače kot `shraniPripravo`. Priprava brez Drive ne obstaja
 * nikjer in aplikacija jo mora ob napaki prenesti stranki. Poročilo je drugačno:
 * v načinu MailApp ga stranka dobi v prilogi ne glede na Drive, v načinu AC pa
 * odpoved Drive konča kot razlog `send_failed` v odgovoru in stranka dobi na
 * rezultatih gumb. V obeh primerih ostane v celici razlog, v AC gre polje prazno
 * (`samoPovezava`) in vse ostalo teče naprej.
 *
 * Svoja mapa in ne mapa priprav: poročilo je dokument ZA stranko in tudi tu ju
 * ne mešamo (načelo 4 v glavi).
 */
function shraniPorocilo(oddaja) {
  var priloga = prilogaZaStranko(oddaja);
  if (!priloga) return '';

  var lastnosti = PropertiesService.getScriptProperties();
  try {
    var mapa = pridobiMapo(NASTAVITVE.IME_MAPE_POROCIL, 'ID_MAPE_POROCIL');
    // Nov blob z imenom po vzorcu priprav (datum, podjetje): ime iz aplikacije
    // nosi segment in datum, ne podjetja, mapa pa se bere po podjetjih.
    var datoteka = mapa.createFile(
      Utilities.newBlob(priloga.getBytes(), 'application/pdf', imeDatoteke('porocilo', oddaja.record, '.pdf')),
    );
    deliSPovezavo(datoteka);
    var povezava = datoteka.getUrl();
    lastnosti.setProperty('ZADNJE_POROCILO_NA_DRIVU', new Date().toISOString());
    lastnosti.deleteProperty('ZADNJA_NAPAKA_POROCILA_NA_DRIVU');
    return povezava;
  } catch (err) {
    console.warn('Poročila ni bilo mogoče shraniti na Drive: ' + err);
    lastnosti.setProperty(
      'ZADNJA_NAPAKA_POROCILA_NA_DRIVU',
      new Date().toISOString() + ' — ' + zakrijNaslove(String(err)),
    );
    return 'NAPAKA: ' + err;
  }
}

/**
 * Datoteko deli "vsi s povezavo, samo ogled" — kadar to nastavitev dovoli.
 *
 * Brez deljenja povezava vsakomur razen računu skripte odpre "Zahtevajte
 * dostop": stranki v sporočilu iz AC in svetovalcu v obvestilu. Zato je to
 * privzeto (`POROCILO_DOSTOPNO_S_POVEZAVO`).
 *
 * Ne vrže: Workspace zna deljenje navzven prepovedati, datoteka pa je tedaj še
 * vedno shranjena in povezava uporabna vsem z dostopom do mape. Ker je to
 * okvara, ki je od zunaj videti kot "povezava iz e-pošte ne dela", gre razlog
 * poleg dnevnika še v lastnost skripte, ki jo pokaže doGet — sicer bi ga bilo
 * treba iskati v dnevniku izvedb. Pred prvim leadom to preveri
 * `preizkusDeljenja`.
 */
function deliSPovezavo(datoteka) {
  if (!NASTAVITVE.POROCILO_DOSTOPNO_S_POVEZAVO) return;
  var lastnosti = PropertiesService.getScriptProperties();
  try {
    datoteka.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    lastnosti.deleteProperty('DRIVE_NAPAKA_DELJENJA');
  } catch (err) {
    console.warn('Deljenja datoteke ' + datoteka.getName() + ' s povezavo ni bilo mogoče vklopiti: ' + err);
    lastnosti.setProperty('DRIVE_NAPAKA_DELJENJA', new Date().toISOString() + ' — ' + String(err));
  }
}

/**
 * ENKRATNI POSEG, ki ga poženete v urejevalniku (Zaženi) PRED prvim leadom v
 * načinu POSTA_PREK_AC: preveri, ali račun sme deliti datoteke "vsi s povezavo".
 *
 * Obstaja iz istega razloga kot `preizkusPoste`. Če Workspace deljenje navzven
 * prepove, se datoteke shranijo, povezavi v e-pošti iz AC pa stranki in
 * svetovalcu odpreta "Zahtevajte dostop" — okvara, ki je v skripti ne bi videli,
 * ker se vse ostalo zgodi pravilno. Ta funkcija jo pokaže takoj: izpisano
 * povezavo odprite v ZASEBNEM oknu (brez prijave v Google).
 *
 * Za sabo ne pusti ničesar: datoteko na koncu vrže v koš.
 */
function preizkusDeljenja() {
  var mapa = pridobiMapo(NASTAVITVE.IME_MAPE_POROCIL, 'ID_MAPE_POROCIL');
  var datoteka = mapa.createFile(
    Utilities.newBlob('Preizkus deljenja LM-10. To datoteko lahko izbrišete.', 'text/plain', 'lm10-preizkus-deljenja.txt'),
  );
  var napaka = '';
  try {
    deliSPovezavo(datoteka);
    napaka = PropertiesService.getScriptProperties().getProperty('DRIVE_NAPAKA_DELJENJA') || '';
    var izid = napaka
      ? 'DELJENJE NI USPELO: ' + napaka + '\nPovezave iz ActiveCampaigna bodo zahtevale dostop. ' +
        'Dovolite deljenje "vsi s povezavo" v nastavitvah Workspacea ali nastavite POSTA_PREK_AC: false.'
      : 'Deljenje deluje. Odprite v ZASEBNEM oknu (brez prijave): ' + datoteka.getUrl() +
        '\nČe se dokument odpre, bosta povezavi iz AC delovali tudi stranki in prodaji.';
    console.log(izid);
    return izid;
  } finally {
    // Šele za izpisom: povezava se v košu še odpre, mapa pa ostane čista.
    datoteka.setTrashed(true);
  }
}

/**
 * Ime datoteke na Drivu: predpona, datum oddaje in podjetje — da se mapa bere
 * brez odpiranja. Znaki, ki jih Drive ali ljudje v imenih ne marajo, postanejo
 * podčrtaj; pika ali presledek na koncu odpadeta, da za "d.o.o." ne nastane
 * dvojna pika pred končnico.
 */
function imeDatoteke(predpona, zapis, koncnica) {
  zapis = zapis || {};
  return (
    predpona +
    '-' +
    String(zapis.timestampISO || '').slice(0, 10) +
    '-' +
    String(zapis.companyName || 'neznano')
      .replace(/[^\wčšžćđČŠŽĆĐ .-]+/g, '_')
      .replace(/[ .]+$/, '') +
    koncnica
  );
}

/**
 * Mapa na Drivu po imenu. Ustvari se le prvič; id se zapomni v lastnosti
 * skripte, ker je iskanje po imenu ob vsaki oddaji nepotrebno počasno in bi ob
 * preimenovanju mape tiho ustvarilo drugo. Ena funkcija za obe mapi (priprave,
 * poročila), vsaka s svojo lastnostjo.
 */
function pridobiMapo(imeMape, imeLastnosti) {
  var lastnosti = PropertiesService.getScriptProperties();
  var id = lastnosti.getProperty(imeLastnosti);
  if (id) {
    try {
      return DriveApp.getFolderById(id);
    } catch (err) {
      // Mapa je bila izbrisana ali premaknjena v koš — spodaj nastane nova.
      lastnosti.deleteProperty(imeLastnosti);
    }
  }

  var najdene = DriveApp.getFoldersByName(imeMape);
  var mapa = najdene.hasNext() ? najdene.next() : DriveApp.createFolder(imeMape);
  lastnosti.setProperty(imeLastnosti, mapa.getId());
  return mapa;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * ActiveCampaign
 *
 * Vsak lead, ki pristane v vrstici, gre tudi v ActiveCampaign: kontakt se
 * ustvari ali posodobi po e-naslovu, doda na seznam in dobi oznake. Preglednica
 * ostane popolna evidenca (štirideset stolpcev, surov JSON, triažne ocene), v
 * CRM gre prodajno uporaben izvleček.
 *
 * ŠTIRIH REČI SE NE SPLAČA SPREMINJATI, ne da bi prej prebrali, zakaj so take:
 *
 * 1. AC JE ZA VRSTICO IN V SVOJEM try/catch. Isto načelo kot pri pošti (načelo 3
 *    v glavi datoteke): padel CRM ne sme pomeniti, da aplikacija dostavo razume
 *    kot neuspelo in prodajno pripravo prenese stranki. Vrstica je zapis, AC je
 *    posledica.
 * 2. IZID SE ZAPIŠE V STOLPEC `activeCampaign`. Prazna celica ali "NAPAKA: …"
 *    pomeni "še ni v AC" in je edino, po čemer ura (`posljiZaostaleVAC`) ve, kaj
 *    naj ponovi. Brez tega stolpca je vsak neuspeh tih in nepovraten.
 * 3. NA VROČI POTI JE ROK. Aplikacija čaka odgovor petindvajset sekund; če ga ne
 *    dobi, šteje dostavo za neuspelo in stranki ponudi prenos poročila. Zato se AC ob oddaji
 *    pokliče le, če je do tedaj poteklo manj kot `AC_ROK_MS` — sicer ga pobere
 *    ura. Lead ne sme biti izgubljen zato, ker je bil CRM počasen.
 * 4. KLJUČ NI V TEJ DATOTEKI. Datoteka je v repozitoriju; ključ API bi bil s tem
 *    v gitu. Naslov, ključ in id seznama so v lastnostih skripte, kar ima še eno
 *    dobro lastnost: preživijo lepljenje nove različice te datoteke — za razliko
 *    od E_NASLOV_ZA_OBVESTILA, ki ga je treba po vsakem prilepljanju vpisati
 *    znova.
 */

/** Imena lastnosti skripte. Prve tri vpišete vi, ostalo si zapomni skripta. */
var AC_LASTNOST = {
  NASLOV: 'AC_NASLOV',
  KLJUC: 'AC_KLJUC',
  SEZNAM: 'AC_SEZNAM',
  // Neobvezen drugi seznam — pregled leadov za prodajo. Nanj gre vsak lead z
  // istim statusom kot na prvega; obvestilo prodaji iz AC se veže nanj.
  SEZNAM_PRODAJA: 'AC_SEZNAM_PRODAJA',
  POLJA: 'AC_IDJI_POLJ',
  OZNAKE: 'AC_IDJI_OZNAK',
  ZADNJI: 'AC_ZADNJI',
  ZADNJA_NAPAKA: 'AC_ZADNJA_NAPAKA',
  NAROCILO: 'AC_NAROCILO_OBSTOJECIH',
};

/**
 * Koliko časa od začetka obdelave še dovolimo, da gremo v AC na vroči poti.
 *
 * Deset sekund je rok aplikacije za CELOTEN odgovor, v katerem sta že shranjena
 * priprava na Drive in zapisana vrstica, za AC pa prideta še dve sporočili
 * (stranki in prodaji, vsako do sekunde ali dve). Štiri sekunde in pol pustijo
 * klicem v AC (sync + seznam + oznake) dovolj prostora, hkrati pa je meja dovolj
 * nizka, da počasen CRM ne potisne odgovora čez rok. Ob prekoračitvi se ne zgodi
 * nič slabega: celica ostane prazna in vrstico pobere ura.
 */
var AC_ROK_MS = 4500;

/**
 * Isti rok v načinu POSTA_PREK_AC.
 *
 * Višji, ker se proračun desetih sekund porazdeli drugače: ZA klicem v AC ni
 * več nobene pošte (obe pošlje AC), pred njim pa sta dva zapisa na Drive z
 * deljenjem. Šest sekund pusti klicem v AC (sync + dva seznama + oznake) prostor
 * tudi, kadar je CRM počasen, in še vedno pusti nekaj sekund do roka aplikacije.
 * Ob prekoračitvi se ne izgubi nič: celica ostane prazna, vrstico pobere ura in
 * sporočili odideta minuto pozneje.
 */
var AC_ROK_PREK_AC_MS = 6000;

/**
 * Polja po meri v ActiveCampaign.
 *
 * `tag` je personalizacijska oznaka (v AC vidna kot %LM10_PANOGA%) in je ključ,
 * po katerem skripta polje najde — naslov se sme v AC preimenovati, oznaka ne.
 * `stolpec` je ime stolpca v preglednici; `pretvori` (neobvezno) vrednost iz
 * preglednice preoblikuje za CRM — prazen niz pomeni, da polje izpade.
 *
 * Polja ustvari `pripraviAC` in ne oddaja: ustvarjanje polja je poseg v tuj
 * sistem in sodi v zaveden enkraten korak, ne na pot, po kateri teče vsak lead.
 */
var AC_POLJA = [
  { tag: 'LM10_PODJETJE', naslov: 'LM-10 podjetje', vrsta: 'text', stolpec: 'companyName' },
  { tag: 'LM10_PANOGA', naslov: 'LM-10 panoga', vrsta: 'text', stolpec: 'industryLabel' },
  { tag: 'LM10_ZAPOSLENI', naslov: 'LM-10 zaposlenih', vrsta: 'text', stolpec: 'employeeCount' },
  // Velikostni razred ("10–49") ob številu zaposlenih: obvestilo prodaji ga bere
  // v isti vrstici kot panogo, tako kot ga je pisala pošta iz skripte.
  { tag: 'LM10_VELIKOST', naslov: 'LM-10 velikost (razred)', vrsta: 'text', stolpec: 'sizeClass' },
  { tag: 'LM10_PROMET', naslov: 'LM-10 letni prihodek (EUR)', vrsta: 'text', stolpec: 'annualRevenueEUR' },
  { tag: 'LM10_LETNO', naslov: 'LM-10 letni izračun (EUR)', vrsta: 'text', stolpec: LETNO },
  // Trije koši, iz katerih je sestavljen letni izračun. Brez njih obvestilo
  // prodaji pokaže samo vsoto in svetovalec ne vidi, od kod je.
  { tag: 'LM10_ODLIV', naslov: 'LM-10 odliv (EUR)', vrsta: 'text', stolpec: 'directLossEUR' },
  { tag: 'LM10_MARZA', naslov: 'LM-10 nezaslužena marža (EUR)', vrsta: 'text', stolpec: 'lostMarginEUR' },
  { tag: 'LM10_CAS', naslov: 'LM-10 vrednost časa (EUR)', vrsta: 'text', stolpec: 'capacityEUR' },
  { tag: 'LM10_KAPITAL', naslov: 'LM-10 enkratni kapital (EUR)', vrsta: 'text', stolpec: 'oneTimeCapitalEUR' },
  { tag: 'LM10_ZANESLJIVOST', naslov: 'LM-10 zanesljivost vnosa', vrsta: 'text', stolpec: 'confidence' },
  { tag: 'LM10_PODROCJA', naslov: 'LM-10 izbrana področja', vrsta: 'text', stolpec: 'selectedModules' },
  // Textarea in ne text: tveganja so cel stavek na tveganje, ločena s podpičji.
  { tag: 'LM10_TVEGANJA', naslov: 'LM-10 tveganja', vrsta: 'textarea', stolpec: 'risks' },
  { tag: 'LM10_POSVET', naslov: 'LM-10 prosi za posvet', vrsta: 'text', stolpec: KLICI_TAKOJ },
  // Povezavi do PDF-jev. Oznaki sta kratki in brez predpone LM10_, ker sta polji
  // v AC ročno ustvarjeni PREJ — `pripraviAC` ju najde po oznaki in ne ustvarja.
  // `samoPovezava`: "NAPAKA: …" je za preglednico, v CRM-ju bi bila smet, prazno
  // polje pa je tudi znak, da se avtomatizacija ne sme sprožiti.
  {
    tag: 'PDF_LINK',
    naslov: 'PDF Link',
    vrsta: 'text',
    stolpec: POROCILO_PDF,
    pretvori: samoPovezava,
    // Ob izklopljenem pošiljanju stranki polja ne pošljemo: v načinu AC bi ga
    // sprememba polja poslala kljub nastavitvi.
    izpusti: function () {
      return postaPrekAC() && !NASTAVITVE.POSLJI_POROCILO_STRANKI;
    },
  },
  { tag: 'PDF_LINK_PRODAJA', naslov: 'PDF Link - PRODAJA', vrsta: 'text', stolpec: PRIPRAVA, pretvori: samoPovezava },
  { tag: 'LM10_DAVCNA', naslov: 'LM-10 davčna številka', vrsta: 'text', stolpec: 'taxNumber' },
  // Čas zadnje oddaje. V CRM-ju je podatek, hkrati pa je to EDINO polje, ki se
  // spremeni ob VSAKI oddaji — tudi ko PDF-ja ni in povezavi ostaneta stari.
  // `sprozilec: true`: obe avtomatizaciji v AC visita na tem polju, zato ga
  // `posljiVAC` pošlje ZADNJE, v ločenem klicu za naročilom na sezname. Na
  // kontaktu, ki že obstaja in je na obeh seznamih, je sprememba polja prava
  // sprememba in ne del ustvarjanja, pogoj "je na seznamu" v avtomatizaciji pa
  // drži. V enem klicu z ustvarjanjem kontakta se sprožilec ni sprožil.
  { tag: 'LM10_ODDAJA', naslov: 'LM-10 čas zadnje oddaje', vrsta: 'text', stolpec: PREJETO, sprozilec: true },
  { tag: 'LM10_SEKVENCA', naslov: 'LM-10 sekvenca', vrsta: 'text', stolpec: 'followUpSequence' },
  { tag: 'LM10_VIR', naslov: 'LM-10 vir (utm_source)', vrsta: 'text', stolpec: 'utmSource' },
  { tag: 'LM10_VLOGA', naslov: 'LM-10 vloga', vrsta: 'text', stolpec: 'role' },
];

/**
 * Ena vrstica o stanju AC za odgovor doGet.
 *
 * Ista vloga kot pri pošti: ločiti mora "ni nastavljeno" od "nastavljeno, a
 * pripraviAC še ni tekel" od "dela". Brez tega je edini znak, da polja niso
 * pripravljena, napaka v stolpcu vsake vrstice.
 */
function acStanje() {
  var n = acNastavitve();
  if (!n) return 'IZKLOPLJEN (manjkajo lastnosti AC_NASLOV / AC_KLJUC / AC_SEZNAM)';
  var polj = Object.keys(acIdjiPolj()).length;
  return (
    'seznam ' + n.seznam +
    (n.seznamProdaja ? ' + prodaja ' + n.seznamProdaja : ' (brez seznama za prodajo — AC_SEZNAM_PRODAJA)') +
    ', polj: ' + polj + (polj ? '' : ' — POŽENITE pripraviAC')
  );
}

/**
 * Ali obe sporočili pošilja ActiveCampaign.
 *
 * Nastavitev SAMA ne zadošča: brez priklopljenega AC bi lead ostal brez vsakega
 * sporočila. Zato je pogoj tudi `acNastavitve()` — isto varovalo kot pri
 * aplikaciji, ki brez VITE_LEAD_WEBHOOK_URL pade na lokalne prenose.
 */
function postaPrekAC() {
  return Boolean(NASTAVITVE.POSTA_PREK_AC && acNastavitve());
}

/**
 * Nastavitve AC iz lastnosti skripte; null pomeni "ni priklopljeno".
 *
 * Null in ne napaka: brez nastavitev mora zbiralnik delovati natanko tako kot
 * doslej — isti razlog, iz katerega aplikacija brez VITE_LEAD_WEBHOOK_URL deluje
 * naprej in vse konča v lokalnih prenosih.
 */
function acNastavitve() {
  var lastnosti = PropertiesService.getScriptProperties();
  var naslov = String(lastnosti.getProperty(AC_LASTNOST.NASLOV) || '').trim();
  var kljuc = String(lastnosti.getProperty(AC_LASTNOST.KLJUC) || '').trim();
  var seznam = String(lastnosti.getProperty(AC_LASTNOST.SEZNAM) || '').trim();
  if (!naslov || !kljuc || !seznam) return null;

  // Konec s poševnico in morebitni /api/3 dol: naslov iz AC (Settings →
  // Developer) je zapisan kot https://ime.api-us1.com, prilepi pa se marsikaj.
  naslov = naslov.replace(/\/+$/, '').replace(/\/api\/3$/, '');
  return {
    naslov: naslov,
    kljuc: kljuc,
    seznam: seznam,
    // Neobvezen; prazen niz pomeni "samo en seznam" in vse deluje kot doslej.
    seznamProdaja: String(lastnosti.getProperty(AC_LASTNOST.SEZNAM_PRODAJA) || '').trim(),
  };
}

/** Vsi seznami, na katere gre kontakt. Prvi je seznam strank in odloča o pošti. */
function acSeznami(n) {
  return n.seznamProdaja ? [n.seznam, n.seznamProdaja] : [n.seznam];
}

/**
 * En klic na API. Vrne razčlenjen odgovor ali vrže napako z razlogom AC-ja.
 *
 * `muteHttpExceptions` je nujen: brez njega UrlFetchApp ob 4xx vrže napako, v
 * kateri je samo koda stanja — telo z razlogom ("Field perstag already exists",
 * "Contact email is not valid") se izgubi in reševanje postane ugibanje.
 */
function acZahteva(pot, metoda, telo) {
  var n = acNastavitve();
  if (!n) throw new Error('ActiveCampaign ni nastavljen (glej pripraviAC).');
  var odziv = UrlFetchApp.fetch(n.naslov + '/api/3/' + pot, acMoznosti(metoda, telo, n));
  return acRazcleni(odziv, pot);
}

/** Možnosti zahteve, ločeno zato, ker jih `fetchAll` potrebuje kot objekte. */
function acMoznosti(metoda, telo, n) {
  var moznosti = {
    method: metoda || 'get',
    headers: { 'Api-Token': n.kljuc, Accept: 'application/json' },
    contentType: 'application/json',
    muteHttpExceptions: true,
  };
  if (telo) moznosti.payload = JSON.stringify(telo);
  return moznosti;
}

function acRazcleni(odziv, pot) {
  var koda = odziv.getResponseCode();
  var besedilo = odziv.getContentText();
  if (koda >= 300) {
    throw new Error('AC ' + koda + ' na ' + pot + ': ' + besedilo.slice(0, 300));
  }
  try {
    return JSON.parse(besedilo);
  } catch (err) {
    throw new Error('AC je na ' + pot + ' vrnil neberljiv odgovor: ' + besedilo.slice(0, 200));
  }
}

/**
 * ENKRATNI POSEG, ki ga poženete v urejevalniku (Zaženi): preveri povezavo,
 * ustvari manjkajoča polja po meri in si zapomni njihove id-je.
 *
 * Obstaja iz istega razloga kot `preizkusPoste`. Dovoljenja za zunanje klice
 * Google ne zahteva ob razmestitvi, ampak šele ob prvem klicu UrlFetchApp — web
 * app tedaj pade z "Nimate dovoljenja", napako pa doPost namenoma pogoltne.
 * Vrstice bi se pisale, v AC pa ne bi prišlo nič in od zunaj ne bi bilo videti,
 * zakaj. Zagon te funkcije sproži vprašanje za dovoljenje takrat, ko ste ob
 * računalniku, in v istem koraku dokaže, da ključ in id seznama držita.
 *
 * Varno je pognati večkrat: obstoječih polj ne podvaja in ničesar ne briše.
 */
function pripraviAC() {
  var n = acNastavitve();
  if (!n) {
    throw new Error(
      'Manjkajo lastnosti skripte. Nastavitve projekta → Lastnosti skripte, dodajte: ' +
        AC_LASTNOST.NASLOV +
        ' (npr. https://ime.api-us1.com), ' +
        AC_LASTNOST.KLJUC +
        ' (Settings → Developer) in ' +
        AC_LASTNOST.SEZNAM +
        ' (id seznama iz naslova /list/…).',
    );
  }

  var imena = [acImeSeznama(n.seznam) + ' (id ' + n.seznam + ')'];
  if (n.seznamProdaja) {
    imena.push('prodaja: ' + acImeSeznama(n.seznamProdaja) + ' (id ' + n.seznamProdaja + ')');
  }

  var obstojeca = acObstojecaPolja();
  var idji = {};
  var ustvarjena = [];
  var najdena = [];
  AC_POLJA.forEach(function (polje) {
    if (obstojeca[polje.tag]) {
      idji[polje.tag] = obstojeca[polje.tag];
      najdena.push(polje.tag);
      return;
    }
    idji[polje.tag] = acUstvariPolje(polje);
    ustvarjena.push(polje.tag);
  });

  PropertiesService.getScriptProperties().setProperty(AC_LASTNOST.POLJA, JSON.stringify(idji));

  var izid =
    'Povezava deluje. Seznami: ' + imena.join(', ') + '.\n' +
    'Polja po meri: ' + Object.keys(idji).length + ' pripravljenih.\n' +
    // Najdena posebej: polji PDF_LINK sta v AC ustvarjeni ročno in ta vrstica je
    // edini dokaz, da ju je skripta prepoznala po oznaki (in ne naredila svojih).
    'Že obstajala: ' + (najdena.length ? najdena.join(', ') : '—') + '.\n' +
    'Na novo ustvarjena: ' + (ustvarjena.length ? ustvarjena.join(', ') : '—') + '.\n' +
    'Naslednji korak: razmestite novo različico (Deploy → Manage deployments → svinčnik → New version).';
  console.log(izid);
  return izid;
}

/** Ime seznama v AC ali nadomestek — samo za izpis `pripraviAC`. */
function acImeSeznama(id) {
  var odgovor = acZahteva('lists/' + id, 'get');
  return odgovor && odgovor.list ? odgovor.list.name : '(brez imena)';
}

/** Vsa polja po meri v računu, kot slovar oznaka → id. */
function acObstojecaPolja() {
  var najdena = {};
  var odmik = 0;
  while (true) {
    var odgovor = acZahteva('fields?limit=100&offset=' + odmik, 'get');
    var polja = (odgovor && odgovor.fields) || [];
    polja.forEach(function (polje) {
      if (polje.perstag) najdena[String(polje.perstag).replace(/^%|%$/g, '')] = String(polje.id);
    });
    if (polja.length < 100) return najdena;
    odmik += 100;
    // Varovalo pred neskončno zanko ob nenavadnem odgovoru: nihče nima 2000 polj.
    if (odmik > 2000) return najdena;
  }
}

/**
 * Novo polje po meri in njegova vezava na vse sezname.
 *
 * Vezava (`fieldRels` z `relid: 0`) je ločen klic in je NUJNA: polje brez nje v
 * AC obstaja, a ni pripeto na noben seznam — v kartici kontakta ga ni videti in
 * personalizacijska oznaka v e-pošti ostane prazna. Napaka je videti kot "polja
 * se ne polnijo", čeprav se vrednosti zapisujejo pravilno.
 */
function acUstvariPolje(polje) {
  var odgovor = acZahteva('fields', 'post', {
    field: {
      title: polje.naslov,
      type: polje.vrsta,
      perstag: polje.tag,
      descript: 'Samodejno iz vprašalnika LM-10.',
      visible: 1,
    },
  });
  var id = odgovor && odgovor.field ? String(odgovor.field.id) : '';
  if (!id) throw new Error('AC ni vrnil id-ja polja ' + polje.tag + '.');

  try {
    acZahteva('fieldRels', 'post', { fieldRel: { field: id, relid: 0 } });
  } catch (err) {
    // Vezava je lahko že postavljena (ob ponovnem zagonu na pol ustvarjenem
    // polju); to ni razlog, da bi priprava padla.
    console.warn('Vezave polja ' + polje.tag + ' ni bilo mogoče postaviti: ' + err);
  }
  return id;
}

/** Čas iz AC ("2026-09-08T04:28:23-05:00") v ms; neberljiv ali prazen je 0. */
function acCasMs(niz) {
  var t = Date.parse(String(niz || ''));
  return isNaN(t) ? 0 : t;
}

/**
 * Sprožilci avtomatizacije v eni vrstici: vrsta, na kaj je vezan (relid ali
 * params) in ali teče večkrat. Končna točka je v API-ju nedokumentirana, zato
 * ob napaki funkcija to pove, ne pa vrže — diagnostika mora priti do konca.
 */
function acOpisSprozilcev(idAvtomatizacije) {
  try {
    var odgovor = acZahteva('automations/' + idAvtomatizacije + '/triggers', 'get');
    var sprozilci = (odgovor && (odgovor.automationTriggers || odgovor.triggers)) || [];
    if (!sprozilci.length) return 'AC ni vrnil sprožilcev';
    return sprozilci
      .map(function (s) {
        var deli = ['vrsta ' + String(s.type || '?')];
        if (s.relid) deli.push('relid ' + s.relid);
        if (s.params) deli.push(typeof s.params === 'string' ? s.params : JSON.stringify(s.params).slice(0, 120));
        deli.push(String(s.multientry) === '1' ? 'večkrat' : 'enkrat');
        return deli.join(', ');
      })
      .join(' | ');
  } catch (err) {
    return 'AC sprožilcev ne razkrije (' + String(err).slice(0, 80) + ')';
  }
}

/** Vse avtomatizacije računa, po straneh po sto; varovalo pri dva tisoč. */
function acVseAvtomatizacije() {
  var vse = [];
  var odmik = 0;
  while (true) {
    var stran = (acZahteva('automations?limit=100&offset=' + odmik, 'get') || {}).automations || [];
    vse = vse.concat(stran);
    if (stran.length < 100 || odmik >= 2000) return vse;
    odmik += 100;
  }
}

/** Zapomnjeni id-ji polj. Prazno pomeni, da `pripraviAC` še ni tekel. */
function acIdjiPolj() {
  var shranjeno = PropertiesService.getScriptProperties().getProperty(AC_LASTNOST.POLJA);
  if (!shranjeno) return {};
  try {
    return JSON.parse(shranjeno);
  } catch (err) {
    return {};
  }
}

/**
 * DIAGNOSTIKA, ki jo poženete v urejevalniku (Zaženi): kaj o kontaktu v resnici
 * ve ActiveCampaign. Obstaja, ker AC upravlja kdo drug in vanj ni vpogleda,
 * skripta pa o svojih klicih ve le, da so vrnili "v redu".
 *
 * Brez argumenta vzame e-naslov zadnje vrstice lista. Izpiše štiri stvari, ki
 * skupaj povedo, kje se je sporočilo ustavilo:
 *  1. seznami s statusom — ali je kontakt na obeh seznamih kot naročen;
 *  2. ključna polja — ali sta povezavi in čas oddaje res zapisani v AC;
 *  3. vse avtomatizacije računa s stanjem — ali sta sploh vklopljeni;
 *  4. v katere avtomatizacije je TA kontakt vstopil — ali se je sprožilec sprožil.
 *
 * Branje: če sta 1 in 2 v redu, 4 pa prazen, je težava v AC (avtomatizacija ni
 * vklopljena ali sprožilec ne ustreza polju). Če 2 manjka, je težava v skripti.
 * Samo bere, ničesar ne spreminja.
 */
function preveriKontaktVAC(email) {
  var n = acNastavitve();
  if (!n) throw new Error('ActiveCampaign ni nastavljen (glej pripraviAC).');

  email = String(email || '').trim();
  if (!email) {
    var list = pridobiList();
    var glava = preberiGlavo(list);
    var stolpec = glava.indexOf('email') + 1;
    if (!stolpec || list.getLastRow() < 2) throw new Error('Na listu ni vrstice z e-naslovom.');
    email = String(list.getRange(list.getLastRow(), stolpec).getValue() || '').trim();
  }

  var vrstice = ['Kontakt: ' + email];
  var najdeni = acZahteva('contacts?email=' + encodeURIComponent(email), 'get');
  var kontakt = najdeni && najdeni.contacts && najdeni.contacts[0];
  if (!kontakt) {
    vrstice.push('V AC GA NI — skripta ga ni poslala ali je klic padel. Glej stolpec activeCampaign in /exec.');
    console.log(vrstice.join('\n'));
    return vrstice.join('\n');
  }
  var id = String(kontakt.id);
  vrstice.push(
    'Id v AC: ' + id + ' (ustvarjen ' + (kontakt.cdate || '?') + ', posodobljen ' + (kontakt.udate || '?') + ')',
  );

  // 1. Seznami — AC statusi: 1 naročen, 2 odjavljen, 0 nepotrjen, 3 odbit.
  var STATUSI = { '1': 'naročen', '2': 'ODJAVLJEN', '0': 'nepotrjen', '3': 'odbit' };
  var seznami = (acZahteva('contacts/' + id + '/contactLists', 'get') || {}).contactLists || [];
  vrstice.push(
    'Seznami: ' +
      (seznami.length
        ? seznami
            .map(function (s) {
              return s.list + ' (' + (STATUSI[String(s.status)] || s.status) + ')';
            })
            .join(', ')
        : 'NA NOBENEM'),
  );

  // 2. Polja — id-je prevede nazaj v oznake, da je izpis berljiv.
  var idji = acIdjiPolj();
  var oznakaPoId = {};
  Object.keys(idji).forEach(function (tag) {
    oznakaPoId[String(idji[tag])] = tag;
  });
  var vrednosti = (acZahteva('contacts/' + id + '/fieldValues', 'get') || {}).fieldValues || [];
  var nastavljena = {};
  vrednosti.forEach(function (p) {
    if (String(p.value || '').trim() !== '') {
      nastavljena[oznakaPoId[String(p.field)] || 'polje ' + p.field] = String(p.value);
    }
  });
  var kljucna = ['PDF_LINK', 'PDF_LINK_PRODAJA', 'LM10_ODDAJA', 'LM10_POSVET'];
  vrstice.push('Ključna polja:');
  kljucna.forEach(function (tag) {
    vrstice.push('  ' + tag + ' = ' + (nastavljena[tag] || 'PRAZNO'));
  });
  var drugih = Object.keys(nastavljena).filter(function (t) {
    return kljucna.indexOf(t) === -1;
  }).length;
  vrstice.push('  drugih izpolnjenih polj: ' + drugih);

  // 3. Avtomatizacije računa, VSE strani: račun jih ima lahko več sto in
  // najnovejše — naše — so na zadnji strani. Izpišejo se samo tiste z osnovno
  // oznako v imenu; dnevnik izvedb namreč dolg izpis odreže in bi ravno
  // odločilne vrstice izginile.
  var avtomatizacije = acVseAvtomatizacije();
  var imePoId = {};
  avtomatizacije.forEach(function (a) {
    imePoId[String(a.id)] = a.name;
  });

  // 4. V katere je vstopil ta kontakt — edini dokaz, da se je sprožilec sprožil.
  // Pred seznamom avtomatizacij, da je ta vrstica vidna, tudi če bi bil izpis odrezan.
  var vstopi = (acZahteva('contacts/' + id + '/contactAutomations', 'get') || {}).contactAutomations || [];
  vrstice.push(
    'Ta kontakt je vstopil v: ' +
      (vstopi.length
        ? vstopi
            .map(function (v) {
              // Datum vstopa loči "sprožilo se je danes" od "sprožilo se je ob
              // prvem obisku pred dnevi" — pri sprožilcu na naročilo na seznam
              // se ponovni obisk iste osebe ne šteje.
              return (
                '"' + (imePoId[String(v.automation)] || v.automation) + '" (vstop ' + (v.adddate || '?') +
                (String(v.status) === '1' ? ', še teče' : ', končana') + ')'
              );
            })
            .join(', ')
        : 'NOBENO — sprožilec se ni sprožil'),
  );

  // Avtomatizacije, ki nas zadevajo: z osnovno oznako v imenu ALI ustvarjene oz.
  // spremenjene v zadnjih štirinajstih dneh — skrbnik AC jih poimenuje po svoje.
  // Za vsako še sprožilec, ker je ravno tam navadno vzrok, da kontakt ne vstopi.
  var osnova = String(NASTAVITVE.AC.OSNOVNA_OZNAKA || 'LM-10').toLowerCase();
  var meja = Date.now() - 14 * 24 * 60 * 60 * 1000;
  var nase = avtomatizacije.filter(function (a) {
    var poImenu = String(a.name || '').toLowerCase().indexOf(osnova) !== -1;
    var nedavna = acCasMs(a.mdate) >= meja || acCasMs(a.cdate) >= meja;
    return poImenu || nedavna;
  });
  vrstice.push(
    'Avtomatizacije z "' + NASTAVITVE.AC.OSNOVNA_OZNAKA + '" v imenu ali spremenjene v 14 dneh:' +
      (nase.length ? '' : ' NOBENE — v AC še niso zgrajene'),
  );
  nase.forEach(function (a) {
    vrstice.push(
      '  "' +
        a.name +
        '" — ' +
        (String(a.status) === '1' ? 'aktivna' : 'NEAKTIVNA') +
        ', vstopilo kontaktov: ' +
        (a.entered || '0') +
        ', spremenjena ' +
        (a.mdate || a.cdate || '?'),
    );
    vrstice.push('     sprožilec: ' + acOpisSprozilcev(a.id));
  });
  vrstice.push('  (drugih avtomatizacij v računu: ' + (avtomatizacije.length - nase.length) + ', izpuščene)');

  var izid = vrstice.join('\n');
  console.log(izid);
  return izid;
}

/**
 * Kontakt v AC: ustvari ali posodobi, doda na sezname, pripne oznake.
 * Vrne `{ id, narocen }` — id kontakta in ali je naročen na seznam strank.
 *
 * `narocen` ni okrasje: v načinu POSTA_PREK_AC od njega zavisi, ali bo stranka
 * poročilo sploh dobila (odjavljenemu AC ne pošilja), in to pove aplikaciji, ki
 * tedaj ponudi prenos.
 *
 * `contact/sync` je namenoma izbran namesto `contacts`: ujema po e-naslovu, zato
 * drugi obisk istega človeka ne naredi dvojnika, ampak dopolni, kar je vnesel
 * tokrat.
 */
function posljiVAC(vrednosti) {
  var n = acNastavitve();
  if (!n) throw new Error('ActiveCampaign ni nastavljen.');

  var email = String(vrednosti.email || '').trim();
  if (!email) throw new Error('Zapis je brez e-naslova.');

  var idji = acIdjiPolj();
  if (!Object.keys(idji).length) {
    throw new Error('Id-ji polj niso znani — poženite pripraviAC.');
  }

  // Polja v dveh koših. Navadna gredo s kontaktom; sprožilna (`sprozilec: true`)
  // ŠELE po naročilu na sezname, v svojem klicu — samo v načinu AC, kjer na njih
  // visita avtomatizaciji. Pri novem kontaktu bi polje, nastavljeno v istem
  // klicu, ki kontakt ustvari, veljalo za del ustvarjanja in ne za spremembo,
  // kontakt pa v tistem trenutku še ne bi bil na seznamu 247 — oba pogoja
  // sprožilca bi padla in prodaja ne bi dobila obvestila za noben nov lead.
  var lociSprozilna = postaPrekAC();
  var navadna = acVrednostiPolj(vrednosti, idji, lociSprozilna ? 'navadna' : 'vsa');
  var sprozilna = lociSprozilna ? acVrednostiPolj(vrednosti, idji, 'sprozilna') : [];

  var odgovor = acZahteva('contact/sync', 'post', {
    contact: {
      email: email,
      firstName: acVrednost(vrednosti, 'firstName'),
      lastName: acVrednost(vrednosti, 'lastName'),
      phone: acVrednost(vrednosti, 'phone'),
      fieldValues: navadna,
    },
  });
  var id = odgovor && odgovor.contact ? String(odgovor.contact.id) : '';
  if (!id) throw new Error('AC ni vrnil id-ja kontakta.');

  var narocen = acNaSeznam(id, vrednosti, acSeznami(n));
  acOznaci(id, acOznake(vrednosti));

  if (sprozilna.length) {
    acZahteva('contact/sync', 'post', { contact: { email: email, fieldValues: sprozilna } });
  }
  return { id: id, narocen: narocen };
}

/**
 * Vrednosti polj po meri za en klic v AC. `kos` je 'navadna', 'sprozilna' ali
 * 'vsa'. Prazne vrednosti izpadejo: AC bi prazen niz zapisal kot spremembo in
 * sprožil avtomatizacijo brez povezave.
 */
function acVrednostiPolj(vrednosti, idji, kos) {
  var polja = [];
  AC_POLJA.forEach(function (polje) {
    var jeSprozilno = Boolean(polje.sprozilec);
    if (kos === 'navadna' && jeSprozilno) return;
    if (kos === 'sprozilna' && !jeSprozilno) return;
    var id = idji[polje.tag];
    if (!id) return;
    if (polje.izpusti && polje.izpusti()) return;
    var vrednost = acVrednost(vrednosti, polje.stolpec);
    if (polje.pretvori) vrednost = polje.pretvori(vrednost);
    if (vrednost === '') return;
    polja.push({ field: id, value: vrednost });
  });
  return polja;
}

/**
 * Kontakt na seznam — privzeto kot naročen (status 1).
 *
 * Na seznam pride VSAK, ker je seznam pregled nad tem, kdo je vprašalnik
 * izpolnil. Kdo sme dobiti oglasno sporočilo, pove oznaka `privolitev: …`
 * (glej `acOznake`), ne status: kampanje gredo na segment po oznaki in ne na
 * cel seznam — to je zahteva ZEKom-2 za neposredno trženje in skripta je sama ne
 * more uveljaviti. `SAMO_S_PRIVOLITVIJO: true` jo uveljavi s statusom (brez
 * privolitve = odjavljen), a odjavljenih v privzetem pogledu seznama ni videti.
 *
 * KDOR SE JE SAM ODJAVIL, OSTANE ODJAVLJEN. Status 1 kontakt, ki je v kampanji
 * kliknil na odjavo, tiho naroči znova — dokumentacija AC za `contactLists` na
 * to izrecno opozarja. Zato skripta pred naročilom brez sveže privolitve preveri
 * stanje na seznamih in odjavljenega pusti pri miru. Privolitev v obrazcu je nova
 * privolitev in ponovno naročilo dovoli. `vsili` preskoči preverjanje in je za
 * `narociObstojeceVAC`, ki popravlja status, ki ga je nastavila ta skripta sama.
 *
 * `seznami` je polje: prvi je seznam strank, drugi (neobvezen) pregled leadov za
 * prodajo. Status je na obeh isti — gre za isto privolitev. Preverjanje je ENO
 * za vse sezname (en klic, glej `acStanjaSeznamov`), ker je na vroči poti vsak
 * klic v AC merljiv del roka.
 *
 * Vrne, ali je kontakt naročen na PRVI seznam: od tega je odvisno, ali mu AC sme
 * poslati poročilo (`izidPorocilaPrekAC`).
 */
function acNaSeznam(idKontakta, vrednosti, seznami, vsili) {
  var privolitev =
    jeResnica(vrednosti.consentOffers) || jeResnica(vrednosti.consentContent);
  var status = NASTAVITVE.AC.SAMO_S_PRIVOLITVIJO && !privolitev ? 2 : 1;
  var stanja = status === 1 && !privolitev && !vsili ? acStanjaSeznamov(idKontakta) : {};

  var narocenNaPrvega = false;
  for (var i = 0; i < seznami.length; i++) {
    var idSeznama = String(seznami[i]);
    if (stanja[idSeznama] === '2') {
      console.log(
        'Kontakt ' + idKontakta + ' se je s seznama ' + idSeznama + ' odjavil sam; ostane odjavljen.',
      );
      continue;
    }
    acZahteva('contactLists', 'post', {
      contactList: { list: idSeznama, contact: idKontakta, status: status },
    });
    if (i === 0) narocenNaPrvega = status === 1;
  }
  return narocenNaPrvega;
}

/** Statusi kontakta po seznamih (id → status kot niz). Kar ni na seznamu, manjka. */
function acStanjaSeznamov(idKontakta) {
  var odgovor = acZahteva('contacts/' + idKontakta + '/contactLists', 'get');
  var seznami = (odgovor && odgovor.contactLists) || [];
  var stanja = {};
  seznami.forEach(function (vnos) {
    stanja[String(vnos.list)] = String(vnos.status);
  });
  return stanja;
}

/**
 * Oznake, ki jih dobi kontakt.
 *
 * Oznaka je v AC edino, na kar se da obesiti avtomatizacijo ("ko dobi oznako X,
 * začni sekvenco"), zato tu ni okrasje, ampak sprožilec. Zato so ozke in
 * predvidljive: osnovna za vse, panoga, sekvenca, posvet in tržna privolitev.
 */
function acOznake(vrednosti) {
  var osnova = String(NASTAVITVE.AC.OSNOVNA_OZNAKA || 'LM-10');
  var oznake = [osnova];

  var panoga = acVrednost(vrednosti, 'industryLabel');
  if (panoga) oznake.push(osnova + ' panoga: ' + panoga);

  var sekvenca = acVrednost(vrednosti, 'followUpSequence');
  if (sekvenca) oznake.push(osnova + ' sekvenca: ' + sekvenca);

  if (jePosvet(vrednosti.consentConsulting)) oznake.push(osnova + ' posvet');

  // Tržna privolitev kot oznaka in ne kot status na seznamu (glej
  // SAMO_S_PRIVOLITVIJO): kampanja za ponudbe gre na segment "ima oznako
  // privolitev: ponudbe", ne na cel seznam. Samo pritrdilni oznaki — nasprotna
  // ("brez privolitve") bi ob ponovnem obisku s privolitvijo ostala pripeta in
  // si s pritrdilno nasprotovala; oznak skripta ne odstranjuje.
  if (jeResnica(vrednosti.consentOffers)) oznake.push(osnova + ' privolitev: ponudbe');
  if (jeResnica(vrednosti.consentContent)) oznake.push(osnova + ' privolitev: vsebine');
  return oznake;
}

/**
 * Oznake pripne kontaktu. Manjkajoče oznake ustvari, id-je si zapomni.
 *
 * Klici gredo skozi `fetchAll` in ne enega za drugim: štiri zaporedne zahteve so
 * dobro sekundo, vzporedne pa toliko kot ena — na vroči poti, kjer aplikacija
 * čaka odgovor, je to razlika med "pride takoj" in "pobere ga ura".
 */
function acOznaci(idKontakta, imena) {
  var n = acNastavitve();
  var zahteve = [];
  imena.forEach(function (ime) {
    var idOznake = acIdOznake(ime);
    if (!idOznake) return;
    var moznosti = acMoznosti('post', { contactTag: { contact: idKontakta, tag: idOznake } }, n);
    moznosti.url = n.naslov + '/api/3/contactTags';
    zahteve.push(moznosti);
  });
  if (!zahteve.length) return;

  var odzivi = UrlFetchApp.fetchAll(zahteve);
  odzivi.forEach(function (odziv, i) {
    var koda = odziv.getResponseCode();
    // 422 pomeni "kontakt to oznako že ima" — pri ponovnem obisku istega človeka
    // je to pravilo in ne izjema, zato ne sme šteti za napako.
    if (koda >= 300 && koda !== 422) {
      console.warn('Oznake ' + imena[i] + ' ni bilo mogoče pripeti: ' + koda + ' ' + odziv.getContentText().slice(0, 200));
    }
  });
}

/** Id oznake iz predpomnilnika, sicer iz AC, sicer na novo ustvarjena. */
function acIdOznake(ime) {
  var lastnosti = PropertiesService.getScriptProperties();
  var predpomnilnik = {};
  try {
    predpomnilnik = JSON.parse(lastnosti.getProperty(AC_LASTNOST.OZNAKE) || '{}');
  } catch (err) {
    predpomnilnik = {};
  }
  if (predpomnilnik[ime]) return predpomnilnik[ime];

  var id = acPoisciOznako(ime);

  if (!id) {
    try {
      var ustvarjena = acZahteva('tags', 'post', {
        tag: { tag: ime, tagType: 'contact', description: 'Vprašalnik LM-10.' },
      });
      id = ustvarjena && ustvarjena.tag ? String(ustvarjena.tag.id) : '';
    } catch (err) {
      // AC zavrne podvojeno ime s 422. To pomeni, da oznaka OBSTAJA, iskanje pa
      // je ni vrnilo — pri več sto oznakah zaradi strani, sicer zaradi ločil v
      // imenu. Tedaj jo poiščemo po straneh; brez tega bi ostala nepripeta in
      // avtomatizacija v AC se ne bi sprožila.
      console.warn('Oznake "' + ime + '" ni bilo mogoče ustvariti: ' + err);
      id = acPoisciOznako(ime, true);
      if (!id) return '';
    }
  }
  if (!id) return '';

  predpomnilnik[ime] = id;
  lastnosti.setProperty(AC_LASTNOST.OZNAKE, JSON.stringify(predpomnilnik));
  return id;
}

/**
 * Id oznake z natanko tem imenom, ali prazen niz.
 *
 * Ujemanje je NATANČNO in ne delno, kar iskanje v AC vrne: "LM-10" bi sicer
 * pobral id oznake "LM-10 posvet" in vse leade označil narobe. `poStraneh` je
 * počasnejša pot za primer, ko iskanje oznake ne vrne, čeprav obstaja.
 */
function acPoisciOznako(ime, poStraneh) {
  var odmik = 0;
  while (true) {
    var pot = poStraneh
      ? 'tags?limit=100&offset=' + odmik
      : 'tags?limit=100&search=' + encodeURIComponent(ime);
    var odgovor = acZahteva(pot, 'get');
    var oznake = (odgovor && odgovor.tags) || [];
    for (var i = 0; i < oznake.length; i++) {
      if (String(oznake[i].tag) === ime) return String(oznake[i].id);
    }
    if (!poStraneh || oznake.length < 100) return '';
    odmik += 100;
    if (odmik > 5000) return '';
  }
}

/** Vrednost stolpca kot niz; manjkajoče je prazno in ne "undefined". */
function acVrednost(vrednosti, ime) {
  var vrednost = vrednosti[ime];
  if (vrednost === undefined || vrednost === null) return '';
  // S sekundami: čas oddaje je sprožilec avtomatizacij in dve oddaji iste osebe
  // v isti minuti morata biti dve različni vrednosti, sicer druga ne sproži nič.
  if (vrednost instanceof Date) return Utilities.formatDate(vrednost, 'Europe/Ljubljana', 'yyyy-MM-dd HH:mm:ss');
  return String(vrednost).trim();
}

/** Samo pravo povezavo; vse drugo (prazno, "NAPAKA: …") izpade. */
function samoPovezava(vrednost) {
  return /^https?:\/\//.test(vrednost) ? vrednost : '';
}

/**
 * Klic v AC z vroče poti oddaje: rok, lasten try/catch in zapis izida v celico.
 *
 * Nikoli ne vrže. Vse, kar gre tu narobe, se konča z "NAPAKA: …" v stolpcu
 * `activeCampaign` — od koder to v minuti ali dveh pobere ura.
 *
 * Vrne, kaj se je zgodilo, ker je v načinu POSTA_PREK_AC od tega odvisen izid
 * poročila stranki (`izidPorocilaPrekAC`): `null` = AC ni nastavljen,
 * `{ poslano: false, preskoceno: true }` = rok, `{ poslano: true, id, narocen }`
 * = uspeh, `{ poslano: false, napaka }` = padel klic.
 */
function acVrstico(zapisana, vrednosti, zacetek, prekAC) {
  var lastnosti = PropertiesService.getScriptProperties();
  if (!acNastavitve()) return null;

  var rok = prekAC ? AC_ROK_PREK_AC_MS : AC_ROK_MS;
  if (Date.now() - zacetek > rok) {
    // Celica ostane prazna, kar je za uro isto kot napaka: vrstico bo pobrala.
    console.warn('AC preskočen na vroči poti (rok ' + rok + ' ms); pobere ga ura.');
    return { poslano: false, preskoceno: true };
  }

  try {
    var izid = posljiVAC(vrednosti);
    acZapisiIzid(zapisana, izid.id);
    lastnosti.setProperty(AC_LASTNOST.ZADNJI, new Date().toISOString() + ' — kontakt ' + izid.id);
    lastnosti.deleteProperty(AC_LASTNOST.ZADNJA_NAPAKA);
    return { poslano: true, id: izid.id, narocen: izid.narocen };
  } catch (err) {
    console.warn('Leada ni bilo mogoče poslati v AC: ' + err);
    acZapisiIzid(zapisana, 'NAPAKA: ' + err);
    lastnosti.setProperty(
      AC_LASTNOST.ZADNJA_NAPAKA,
      new Date().toISOString() + ' — ' + zakrijNaslove(String(err)),
    );
    return { poslano: false, napaka: String(err) };
  }
}

/** Izid v stolpec `activeCampaign` pravkar zapisane vrstice. */
function acZapisiIzid(zapisana, besedilo) {
  if (!zapisana || !zapisana.glava) return;
  var stolpec = zapisana.glava.indexOf(AC_STOLPEC) + 1;
  if (!stolpec) return;
  zapisana.list.getRange(zapisana.vrstica, stolpec).setValue(String(besedilo).slice(0, 500));
}

/**
 * Vrstice, ki v AC še niso prišle — ali sploh nikoli, ali z napako.
 *
 * Dvoje opravlja hkrati: ponovi, kar je padlo ali kar je na vroči poti odpadlo
 * zaradi roka, in ob prvem zagonu pošlje vse leade, ki so se nabrali PRED
 * priklopom. Poženete jo lahko ročno; za samodejno ponavljanje glej
 * `namestiUroZaAC`.
 */
function posljiZaostaleVAC() {
  if (!acNastavitve()) {
    console.log('ActiveCampaign ni nastavljen — nič za pošiljanje.');
    return 'ni nastavljen';
  }

  // tryLock in ne waitLock: če ravno teče oddaja ali urejanje stolpcev, je bolje
  // odstopiti in počakati na naslednji zagon ure, kot držati ključavnico in
  // podaljševati odgovor, ki ga aplikacija čaka.
  var kljucavnica = LockService.getScriptLock();
  if (!kljucavnica.tryLock(10000)) {
    console.log('Zaseden zapis — poskusim ob naslednjem zagonu.');
    return 'zasedeno';
  }

  try {
    var list = pridobiList();
    var glava = preberiGlavo(list);
    var stolpecAC = glava.indexOf(AC_STOLPEC) + 1;
    var stolpecEmail = glava.indexOf('email') + 1;
    if (!stolpecAC || !stolpecEmail) return 'lista brez stolpcev activeCampaign/email';

    var vrstic = list.getLastRow() - 1;
    if (vrstic < 1) return 'ni vrstic';

    var podatki = list.getRange(2, 1, vrstic, glava.length).getValues();
    var poslano = 0;
    var padlo = 0;

    for (var i = 0; i < podatki.length; i++) {
      if (poslano + padlo >= NASTAVITVE.AC.NAJVEC_NA_ZAGON) break;

      var stanje = String(podatki[i][stolpecAC - 1] || '').trim();
      var email = String(podatki[i][stolpecEmail - 1] || '').trim();
      if (!email) continue;
      if (stanje && stanje.indexOf('NAPAKA') !== 0) continue;

      var vrednosti = {};
      for (var j = 0; j < glava.length; j++) vrednosti[glava[j]] = podatki[i][j];

      try {
        var izidVrstice = posljiVAC(vrednosti);
        list.getRange(i + 2, stolpecAC).setValue(izidVrstice.id);
        poslano++;
      } catch (err) {
        console.warn('Vrstica ' + (i + 2) + ' ni šla v AC: ' + err);
        list.getRange(i + 2, stolpecAC).setValue(('NAPAKA: ' + err).slice(0, 500));
        padlo++;
      }
    }

    var izid = 'Poslano: ' + poslano + ', padlo: ' + padlo + '.';
    PropertiesService.getScriptProperties().setProperty(
      AC_LASTNOST.ZADNJI,
      new Date().toISOString() + ' — ura: ' + izid,
    );
    console.log(izid);
    return izid;
  } finally {
    kljucavnica.releaseLock();
  }
}

/**
 * ENKRATNI POSEG po preklopu `SAMO_S_PRIVOLITVIJO` s true na false: leade, ki so
 * v AC že pristali kot odjavljeni (status 2, ki ga je nastavila prejšnja
 * različica te skripte), naroči na seznam in jim pripne oznake, ki jih tedaj še
 * ni bilo (privolitev). Vrstic s prazno celico ali NAPAKA se ne dotika — te
 * pobere ura, po novem pravilu.
 *
 * Varno večkrat: `contactLists` s statusom 1 in `contactTags` sta idempotentna.
 * Ključavnice ne drži in v list ne piše, zato oddaje medtem tečejo naprej.
 * Naročilo VSILI mimo varovala v `acNaSeznam`, kar je tu prav: stanje, ki ga
 * popravlja, je nastavila skripta in ne človek s klikom na odjavo. Če je na ta
 * seznam že šla kampanja in se je kdo odjavil sam, tega NE poganjajte, ne da bi
 * prej v AC preverili, kdo — tudi njega bi naročilo znova.
 *
 * Izid gre v lastnost skripte in na /exec (vrstica "Ponovno naročilo
 * obstoječih"), da ga ni treba iskati v dnevniku izvedb.
 */
function narociObstojeceVAC() {
  var n = acNastavitve();
  if (!n) return 'ni nastavljen';

  var list = pridobiList();
  var glava = preberiGlavo(list);
  var stolpecAC = glava.indexOf(AC_STOLPEC) + 1;
  if (!stolpecAC) return 'lista brez stolpca activeCampaign';

  var vrstic = list.getLastRow() - 1;
  if (vrstic < 1) return 'ni vrstic';

  var podatki = list.getRange(2, 1, vrstic, glava.length).getValues();
  var narocenih = 0;
  var padlo = 0;
  for (var i = 0; i < podatki.length; i++) {
    var id = String(podatki[i][stolpecAC - 1] || '').trim();
    if (!/^\d+$/.test(id)) continue;

    var vrednosti = {};
    for (var j = 0; j < glava.length; j++) vrednosti[glava[j]] = podatki[i][j];

    try {
      acNaSeznam(id, vrednosti, acSeznami(n), true);
      acOznaci(id, acOznake(vrednosti));
      narocenih++;
    } catch (err) {
      console.warn('Vrstica ' + (i + 2) + ' (kontakt ' + id + ') ni šla na seznam: ' + err);
      padlo++;
    }
  }

  var izid = 'Naročenih: ' + narocenih + ', padlo: ' + padlo + '.';
  PropertiesService.getScriptProperties().setProperty(
    AC_LASTNOST.NAROCILO,
    new Date().toISOString() + ' — ' + izid,
  );
  console.log(izid);
  return izid;
}

/**
 * Ura, ki vsako minuto pobere zaostanek. Poženite enkrat, ročno.
 *
 * Minuta in ne deset: okno med padlo oddajo in popravkom je s tem najkrajše, kar
 * Apps Script dovoli (dovoljeni intervali so 1, 5, 10, 15 in 30 minut). Cena sta
 * dve reči, ki ju je vredno poznati — dnevna kvota za sprožilce (90 minut pri
 * navadnem računu, 6 ur pri Workspacu; 1440 zagonov na dan je pri sekundi do treh
 * na zagon med 24 in 72 minutami) in gostejše potegovanje za ključavnico z oddajo.
 * Drugo je pokrito z `NAJVEC_NA_ZAGON: 5`; prvo je treba spremljati, če
 * preglednica zelo zraste — ob izčrpani kvoti utihnejo VSI sprožilci projekta,
 * tudi dnevni za lijak, in to tiho.
 *
 * Prej pobriše svoje starejše ure: dvakrat pognana funkcija bi sicer pustila dva
 * sprožilca in vsak lead bi šel v AC dvakrat.
 */
function namestiUroZaAC() {
  odstraniUroZaAC();
  ScriptApp.newTrigger('posljiZaostaleVAC').timeBased().everyMinutes(1).create();
  console.log('Ura nameščena: posljiZaostaleVAC vsako minuto.');
}

function odstraniUroZaAC() {
  var koliko = 0;
  ScriptApp.getProjectTriggers().forEach(function (sprozilec) {
    if (sprozilec.getHandlerFunction() === 'posljiZaostaleVAC') {
      ScriptApp.deleteTrigger(sprozilec);
      koliko++;
    }
  });
  if (koliko) console.log('Odstranjenih ur: ' + koliko + '.');
  return koliko;
}

// ═══════════════════════════════════════════════════════════════════════════
// LIJAK — kje obiskovalci odnehajo
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Dogodki lijaka, ki jih pošilja aplikacija (src/lib/funnel.ts), pridejo po
 * istem webhooku kot oddaje: telo nosi `events` in `visit` namesto `record`.
 * `zapisiDogodke` jih pripne na list Dogodki, `sestaviLijak` (ročno ali dnevna
 * ura, glej `namestiUroZaLijak`) pa iz njih sestavi list Lijak: koliko obiskov
 * je doseglo kateri korak, kje odnehajo, koliko časa porabijo in kaj jih
 * ustavi na obrazcu.
 *
 * ZA RAZLIKO OD LEADOV SKRIPTA TU STOLPCE POZNA — načelo 1 iz glave zanje ne
 * velja. Povzetek mora korak, segment in področje poznati tako ali tako (brez
 * imena koraka ni lijaka), oblika dogodka pa je majhna in ustaljena. Kar
 * aplikacija pošlje poleg znanih lastnosti, pristane kot JSON v stolpcu
 * `lastnosti`, da se nič ne izgubi.
 *
 * OBISK NI OBISKOVALEC. Id obiska živi samo v pomnilniku strani — brez
 * piškotka in brez shrambe, ker bi identifikator v brskalniku po ZEKom-2 terjal
 * privolitev. Osvežitev sredi vprašalnika zato naredi nov obisk, ki se začne
 * sredi toka. Povzetek take obiske ("nadaljevanja": prvi prikazani korak ni
 * uvodni) šteje posebej in jih v lijak ne meša; pravi delež dokončanih je med
 * številko brez nadaljevanj in številko z njimi.
 *
 * NAPAKA TU NE GRE V REZERVNO POT. Aplikacija odgovora na dogodke ne bere
 * (pošilja jih s `sendBeacon`), zato izjema v `zapisiDogodke` ne škodi nikomur
 * razen dnevniku izvedb — in tam je prav, da se vidi.
 */

/** Stolpci lista Dogodki — v tem vrstnem redu jih piše `zapisiDogodke` in bere `zberiObiske`. */
var DOGODKI_GLAVA = [
  'prejeto',
  'obisk',
  'zaporedje',
  'cas',
  'dogodek',
  'korak',
  'indeksKoraka',
  'korakovSkupaj',
  'podrocje',
  'segment',
  'naprava',
  'vir',
  'interni',
  'lastnosti',
];

/** Lastnosti dogodka, ki imajo svoj stolpec; ostale gredo v `lastnosti` kot JSON. */
var LASTNOSTI_S_STOLPCEM = ['step', 'stepIndex', 'stepsTotal', 'moduleId', 'segment'];

/** Največ dogodkov iz enega paketa; aplikacija jih pošlje do 50, kar je čez, je sumljivo. */
var NAJVEC_DOGODKOV_NA_PAKET = 50;
/** Najdaljši niz iz javnega vhoda, ki gre v celico. */
var NAJDALJSI_NIZ = 200;
/**
 * Čas na koraku nad to mejo se v mediano ne šteje: obiskovalec je zavihek pustil
 * odprt, ne bral pol ure. Brez meje bi en pozabljen zavihek povlekel mediano
 * navzgor bolj kot sto pravih obiskov.
 */
var NAJDALJSI_CAS_NA_KORAKU_MS = 30 * 60 * 1000;

/**
 * Koraki v vrstnem redu toka (src/types.ts, FlowStep). Kontekst, triaža in
 * stroškovna osnova obstajajo le v segmentih s konfiguracijo konteksta oziroma
 * triaže — v skupnem lijaku so zato nižji od sosedov tudi brez odpada; točen
 * lijak je v blokih po segmentih.
 */
var KORAKI_LIJAKA = [
  ['industry', 'Dejavnost (uvod)'],
  ['employeeCount', 'Zaposleni'],
  ['context', 'Nekaj o vas (kontekst)'],
  ['triage', 'Triaža področij'],
  ['costBasis', 'Stroškovna osnova'],
  ['inputs', 'Vnosi (vse strani skupaj)'],
  ['emailGate', 'Obrazec s kontaktom'],
  ['results', 'Rezultati'],
];

/**
 * Korak, s katerim se začne vsak nov obisk; obisk z drugim prvim korakom je
 * nadaljevanje po osvežitvi — razen kadar je dejavnost pred prvim prikazom
 * izbrala povezava s potjo (`<objava>/proizvodnja/`): tak obisk uvodni zaslon
 * preskoči in se začne na koraku zaposlenih, aplikacija pa pred prikazom pošlje
 * lm10_industry_selected z izvorom IZVOR_POVEZAVA (CalculatorFlow.tsx).
 */
var UVODNI_KORAK = 'industry';
var IZVOR_POVEZAVA = 'link';

/** Prvi stolpec podatkov za graf na listu Lijak (N); levo od njega je pogled za človeka. */
var LIJAK_PODATKI_STOLPEC = 14;
var LIJAK_KARTICE_VRSTICA = 4;

/**
 * Sprejme paket dogodkov (src/lib/funnel.ts, FunnelEnvelope) in ga pripne na
 * list Dogodki: ena vrstica na dogodek, obisk v vsaki.
 *
 * Kratka ključavnica in ne čakanje: dva paketa v isti sekundi bi brez nje
 * pisala v isto vrstico, čakati na oddajo leada (Drive, pošta, AC — do nekaj
 * sekund) pa se ne splača — appendRow je varen tudi brez ključavnice, le
 * počasnejši. Vsaka vrednost iz telesa gre skozi obrezovanje: naslov webhooka
 * je javen in vsebina telesa je tuj vhod.
 */
function zapisiDogodke(paket) {
  var obisk = paket.visit && typeof paket.visit === 'object' ? paket.visit : {};
  var idObiska = kratekNiz(obisk.id, 64);
  var dogodki = Array.isArray(paket.events) ? paket.events.slice(0, NAJVEC_DOGODKOV_NA_PAKET) : [];
  if (!idObiska || !dogodki.length) {
    throw new Error('Paket dogodkov je brez obiska ali brez dogodkov.');
  }

  var prejeto = new Date();
  var vrstice = dogodki.map(function (dogodek) {
    var d = dogodek && typeof dogodek === 'object' ? dogodek : {};
    var lastnosti = d.props && typeof d.props === 'object' ? d.props : {};
    var ostale = {};
    for (var ime in lastnosti) {
      if (LASTNOSTI_S_STOLPCEM.indexOf(ime) === -1) {
        ostale[kratekNiz(ime, 40)] = kratkaVrednost(lastnosti[ime]);
      }
    }
    return [
      prejeto,
      idObiska,
      celoStevilo(d.seq),
      datumIzNiza(d.t),
      kratekNiz(d.event, NAJDALJSI_NIZ),
      kratekNiz(lastnosti.step, NAJDALJSI_NIZ),
      celoStevilo(lastnosti.stepIndex),
      celoStevilo(lastnosti.stepsTotal),
      kratekNiz(lastnosti.moduleId, NAJDALJSI_NIZ),
      kratekNiz(lastnosti.segment, NAJDALJSI_NIZ),
      kratekNiz(obisk.device, 20),
      kratekNiz(obisk.utmSource, NAJDALJSI_NIZ),
      obisk.internal === true,
      Object.keys(ostale).length ? JSON.stringify(ostale).slice(0, 1000) : '',
    ];
  });

  var list = pridobiListPoImenu(NASTAVITVE.IME_LISTA_DOGODKI);
  var kljucavnica = LockService.getScriptLock();
  var zaklenjeno = kljucavnica.tryLock(5000);
  try {
    zagotoviGlavoDogodkov(list);
    if (zaklenjeno) {
      var od = list.getLastRow() + 1;
      list.getRange(od, 1, vrstice.length, DOGODKI_GLAVA.length).setValues(vrstice);
      // Oblika datuma samo na pravkar zapisanih celicah, ne čez ves stolpec:
      // oblikovanje do dna lista je enkrat že premaknilo getLastRow na dno
      // (glej pociistiOdvecneVrstice) in tega tu ne ponavljamo.
      list.getRange(od, 1, vrstice.length, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
      list.getRange(od, 4, vrstice.length, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    } else {
      vrstice.forEach(function (vrstica) {
        list.appendRow(vrstica);
      });
    }
  } finally {
    if (zaklenjeno) kljucavnica.releaseLock();
  }

  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, events: vrstice.length }),
  ).setMimeType(ContentService.MimeType.JSON);
}

/** Glava lista Dogodki, kadar je list še prazen. */
function zagotoviGlavoDogodkov(list) {
  if (list.getLastRow() > 0) return;
  zagotoviStolpce(list, DOGODKI_GLAVA.length);
  list.getRange(1, 1, 1, DOGODKI_GLAVA.length).setValues([DOGODKI_GLAVA]).setFontWeight('bold');
  list.setFrozenRows(1);
}

/** Niz iz javnega vhoda: samo niz ali število, obrezan. Vse drugo je prazno. */
function kratekNiz(vrednost, najvec) {
  if (typeof vrednost === 'number' && isFinite(vrednost)) return String(vrednost);
  if (typeof vrednost !== 'string') return '';
  return vrednost.slice(0, najvec);
}

/** Vrednost lastnosti za JSON: niz ali število, obrezano; drugo odpade. */
function kratkaVrednost(vrednost) {
  if (typeof vrednost === 'number' && isFinite(vrednost)) return vrednost;
  return kratekNiz(vrednost, NAJDALJSI_NIZ);
}

/** Celo število ali prazna celica — nikoli 0 namesto "ni podatka". */
function celoStevilo(vrednost) {
  if (vrednost === '' || vrednost === null || vrednost === undefined) return '';
  var n = typeof vrednost === 'number' ? vrednost : Number(vrednost);
  return isFinite(n) ? Math.round(n) : '';
}

/** Datum iz niza ISO ali prazna celica. */
function datumIzNiza(vrednost) {
  if (typeof vrednost !== 'string') return '';
  var d = new Date(vrednost);
  return isNaN(d.getTime()) ? '' : d;
}

/**
 * Sestavi list Lijak iz lista Dogodki. Poženite ročno (izberite funkcijo →
 * Zaženi) ali pustite dnevni uri (`namestiUroZaLijak`). Izid zadnjega zagona
 * je viden v odgovoru doGet.
 *
 * List je POSNETEK in ne žive formule kot Analitika: povzetek potrebuje obiske
 * (dogodke, zbrane po id-ju in urejene po zaporedju), česar formule ne zmorejo
 * berljivo. Kdaj je nastal, piše v vrstici 2.
 */
function sestaviLijak() {
  var lastnosti = PropertiesService.getScriptProperties();
  try {
    var izid = sestaviLijakList();
    lastnosti.setProperty('LIJAK_ZADNJI', new Date().toISOString() + ' — ' + izid);
    console.log(izid);
    return izid;
  } catch (err) {
    lastnosti.setProperty('LIJAK_ZADNJI', new Date().toISOString() + ' — NAPAKA: ' + err);
    throw err;
  }
}

function sestaviLijakList() {
  var dogodki = poisciList(NASTAVITVE.IME_LISTA_DOGODKI);
  if (!dogodki || dogodki.getLastRow() < 2) {
    throw new Error(
      'List "' +
        NASTAVITVE.IME_LISTA_DOGODKI +
        '" je prazen: aplikacija še ni poslala dogodkov (webhook ni nastavljen ali je razmeščena stara različica skripte).',
    );
  }

  var od =
    NASTAVITVE.LIJAK_OBDOBJE_DNI > 0
      ? new Date(Date.now() - NASTAVITVE.LIJAK_OBDOBJE_DNI * 86400000)
      : null;
  var vsi = zberiObiske(dogodki, od).map(opisiObisk);
  var obiski = vsi.filter(function (o) {
    return !o.interni && o.prikazov > 0;
  });
  var izpusceni = vsi.length - obiski.length;
  var zacetni = obiski.filter(function (o) {
    return !o.nadaljevanje;
  });
  var nadaljevanja = obiski.filter(function (o) {
    return o.nadaljevanje;
  });

  var zacetih = zacetni.length;
  var doObrazca = prestej(zacetni, function (o) {
    return o.dosegel.emailGate;
  });
  var oddaj = prestej(zacetni, function (o) {
    return o.oddal;
  });
  var prenosov = 0;
  obiski.forEach(function (o) {
    prenosov += o.prenosov;
  });

  // Vse tabele so sestavljene, PREDEN se list počisti (isti razlog kot v
  // urediAnalitiko): napaka zgoraj pusti prejšnji povzetek nedotaknjen.
  var kartice = [
    ['ZAČETIH OBISKOV', zacetih, '#.##0'],
    ['DO OBRAZCA', doObrazca, '#.##0'],
    ['ODDAJ', oddaj, '#.##0'],
    ['DELEŽ ODDAJ', zacetih ? oddaj / zacetih : '', '0 %'],
    ['PRENOSOV POROČILA', prenosov, '#.##0'],
  ];
  var glavaLijaka = ['Korak', 'Obiskov', 'Delež začetnih', 'Končalo tu', 'Odpad', 'Mediana časa'];
  var oblikeLijaka = [null, '#.##0', '0 %', '#.##0', '0 %', '#.##0 "s"'];
  var skupni = vrsticeLijaka(zacetni);
  var segmenti = skupine(zacetni, function (o) {
    return o.segment;
  });
  var glavaSkupin = ['', 'Začetih', 'Do obrazca', 'Oddaj', 'Delež oddaj'];
  var oblikeSkupin = [null, '#.##0', '#.##0', '#.##0', '0 %'];

  var list = pridobiListPoImenu(NASTAVITVE.IME_LISTA_LIJAK);
  list.clear();
  list.getCharts().forEach(function (graf) {
    list.removeChart(graf);
  });
  zagotoviStolpce(list, LIJAK_PODATKI_STOLPEC + 4);

  list.getRange('A1').setValue('LM-10 — lijak vprašalnika');
  list
    .getRange('A2')
    .setValue(
      'Posnetek, sestavljen ' +
        Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'd. M. yyyy HH:mm') +
        '. Obdobje: ' +
        (od ? 'zadnjih ' + NASTAVITVE.LIJAK_OBDOBJE_DNI + ' dni' : 'vsi dogodki') +
        '. Lijak šteje obiske, ki so se začeli na uvodnem koraku; nadaljevanja po osvežitvi so spodaj posebej. ' +
        'Za osvežitev poženite sestaviLijak ali namestite dnevno uro (namestiUroZaLijak).',
    );

  kartice.forEach(function (kartica, i) {
    var stolpec = 1 + i * 2;
    list.getRange(LIJAK_KARTICE_VRSTICA, stolpec).setValue(kartica[0]);
    list
      .getRange(LIJAK_KARTICE_VRSTICA + 1, stolpec)
      .setValue(kartica[1])
      .setNumberFormat(kartica[2]);
  });

  var vrstica = LIJAK_KARTICE_VRSTICA + 3;
  var vrsticaSkupnega = vrstica;
  vrstica = pisiTabelo(list, vrstica, 'LIJAK — VSI SEGMENTI', glavaLijaka, skupni, oblikeLijaka);
  list
    .getRange(vrstica - 1, 1)
    .setValue(
      '„Končalo tu" = obisk ni prišel dlje od tega koraka; pri rezultatih pomeni dokončan vprašalnik. ' +
        'Kontekst, triaža in osnova obstajajo le v nekaterih segmentih — točen lijak je po segmentih spodaj. ' +
        'Mediana časa: samo obiski, ki so šli naprej; nad 30 minutami se ne šteje.',
    )
    .setFontStyle('italic')
    .setFontColor('#5f6368');
  vrstica += 1;

  // Graf ob skupnem lijaku — podatki zanj desno, kot na listu Analitika.
  var zaGraf = KORAKI_LIJAKA.map(function (korak) {
    return [korak[1], skupni[indeksVrsticeKoraka(skupni, korak[1])][1]];
  });
  list.getRange(LIJAK_KARTICE_VRSTICA, LIJAK_PODATKI_STOLPEC).setValue('PODATKI ZA GRAF — ne brišite');
  list
    .getRange(LIJAK_KARTICE_VRSTICA + 1, LIJAK_PODATKI_STOLPEC, zaGraf.length, 2)
    .setValues(zaGraf);
  list.insertChart(
    list
      .newChart()
      .setChartType(Charts.ChartType.COLUMN)
      .addRange(list.getRange(LIJAK_KARTICE_VRSTICA + 1, LIJAK_PODATKI_STOLPEC, zaGraf.length, 2))
      .setPosition(vrsticaSkupnega, 8, 0, 0)
      .setOption('title', 'Obiskov po korakih')
      .setOption('width', 520)
      .setOption('height', 300)
      .setOption('legend', { position: 'none' })
      .build(),
  );

  Object.keys(segmenti)
    .sort(function (a, b) {
      return segmenti[b].length - segmenti[a].length;
    })
    .forEach(function (segment) {
      vrstica = pisiTabelo(
        list,
        vrstica,
        'LIJAK — ' + segment.toUpperCase() + ' (' + segmenti[segment].length + ' obiskov)',
        glavaLijaka,
        vrsticeLijaka(segmenti[segment]),
        oblikeLijaka,
      );
    });

  vrstica = pisiTabelo(
    list,
    vrstica,
    'PO SEGMENTIH',
    glavaSkupin,
    vrsticeSkupin(zacetni, function (o) {
      return o.segment;
    }),
    oblikeSkupin,
  );
  vrstica = pisiTabelo(
    list,
    vrstica,
    'PO VIRU OBISKA (utm_source)',
    glavaSkupin,
    vrsticeSkupin(zacetni, function (o) {
      return o.vir;
    }),
    oblikeSkupin,
  );
  vrstica = pisiTabelo(
    list,
    vrstica,
    'PO ZASLONU',
    glavaSkupin,
    vrsticeSkupin(zacetni, function (o) {
      return o.naprava;
    }),
    oblikeSkupin,
  );
  vrstica = pisiTabelo(
    list,
    vrstica,
    'OBRAZEC — KATERO POLJE USTAVI ODDAJO',
    ['Polje', 'Blokad', 'Obiskov'],
    vrsticeBlokad(obiski),
    [null, '#.##0', '#.##0'],
  );
  vrstica = pisiTabelo(
    list,
    vrstica,
    'DOSTAVA LEADA (webhook)',
    ['Izid', 'Obiskov'],
    vrsticeDostave(obiski),
    [null, '#.##0'],
  );
  vrstica = pisiTabelo(
    list,
    vrstica,
    'NADALJEVANJA IN IZPUŠČENI OBISKI',
    ['', 'Obiskov'],
    [
      ['Nadaljevanja po osvežitvi (prvi korak ni uvodni)', nadaljevanja.length],
      [
        '   … od tega oddaj',
        prestej(nadaljevanja, function (o) {
          return o.oddal;
        }),
      ],
      [
        'Začeli s povezavo /dejavnost (uvodni zaslon preskočen, štejejo kot začeti)',
        prestej(zacetni, function (o) {
          return o.zacelaPovezava;
        }),
      ],
      ['Izpuščeni: interni način (?debug=1) ali brez prikaza koraka', izpusceni],
    ],
    [null, '#.##0'],
  );
  vrstica = pisiTabelo(
    list,
    vrstica,
    'PO DNEVIH — zadnjih 30 dni',
    ['Dan', 'Začetih', 'Oddaj'],
    vrsticePoDnevih(zacetni, 30),
    ['yyyy-mm-dd', '#.##0', '#.##0'],
  );

  urediVidezLijaka(list, kartice.length);
  zascitiOpozorilno(list, 'Lijak se sestavi samodejno (sestaviLijak) — ročni vnosi se ob naslednjem zagonu izgubijo.');

  var pobrisanih = NASTAVITVE.DOGODKI_HRANI_DNI > 0 ? pocistiStareDogodke(dogodki) : 0;

  return (
    'Lijak sestavljen: ' +
    zacetih +
    ' začetih obiskov, ' +
    nadaljevanja.length +
    ' nadaljevanj, ' +
    izpusceni +
    ' izpuščenih, ' +
    oddaj +
    ' oddaj.' +
    (pobrisanih ? ' Pobrisanih starih dogodkov: ' + pobrisanih + '.' : '')
  );
}

/**
 * Obiski z lista Dogodki: dogodki, zbrani po id-ju in urejeni po zaporedju iz
 * aplikacije (ne po času — ura naprave ni zanesljiva, zaporedje je). Obisk
 * zunaj obdobja (po času prejema prvega dogodka) odpade.
 */
function zberiObiske(list, od) {
  var podatki = list.getDataRange().getValues();
  var glava = podatki[0].map(function (celica) {
    return String(celica);
  });
  var k = function (ime) {
    var i = glava.indexOf(ime);
    if (i === -1) throw new Error('Na listu ' + NASTAVITVE.IME_LISTA_DOGODKI + ' ni stolpca "' + ime + '".');
    return i;
  };
  var K = {
    prejeto: k('prejeto'),
    obisk: k('obisk'),
    zaporedje: k('zaporedje'),
    cas: k('cas'),
    dogodek: k('dogodek'),
    korak: k('korak'),
    indeks: k('indeksKoraka'),
    podrocje: k('podrocje'),
    segment: k('segment'),
    naprava: k('naprava'),
    vir: k('vir'),
    interni: k('interni'),
    lastnosti: k('lastnosti'),
  };

  var obiski = {};
  for (var r = 1; r < podatki.length; r++) {
    var v = podatki[r];
    var id = String(v[K.obisk] || '');
    if (!id) continue;
    var prejeto = vDatum(v[K.prejeto]);
    var o = obiski[id];
    if (!o) {
      o = obiski[id] = {
        id: id,
        zacetek: prejeto,
        segment: '',
        naprava: String(v[K.naprava] || ''),
        vir: String(v[K.vir] || ''),
        interni: v[K.interni] === true || String(v[K.interni]).toUpperCase() === 'TRUE',
        dogodki: [],
      };
    }
    if (prejeto && (!o.zacetek || prejeto < o.zacetek)) o.zacetek = prejeto;
    if (v[K.segment]) o.segment = String(v[K.segment]);
    o.dogodki.push({
      zaporedje: Number(v[K.zaporedje]) || 0,
      cas: vDatum(v[K.cas]),
      dogodek: String(v[K.dogodek] || ''),
      korak: String(v[K.korak] || ''),
      indeks: v[K.indeks] === '' || v[K.indeks] === null ? null : Number(v[K.indeks]),
      podrocje: String(v[K.podrocje] || ''),
      lastnosti: razcleniLastnosti(v[K.lastnosti]),
    });
  }

  var seznam = [];
  for (var kljuc in obiski) {
    var ob = obiski[kljuc];
    if (od && ob.zacetek && ob.zacetek < od) continue;
    ob.dogodki.sort(function (a, b) {
      return a.zaporedje - b.zaporedje;
    });
    seznam.push(ob);
  }
  return seznam;
}

/**
 * Kar povzetek potrebuje o enem obisku: katere korake je dosegel, kje je bil
 * najdlje (po indeksu koraka, ne po času — vrnitev nazaj ni odnehanje), koliko
 * časa je bil na vsakem in kaj se je zgodilo z obrazcem.
 *
 * Čas na koraku je vsota vseh prikazov tega koraka do naslednjega prikaza;
 * zadnji prikaz obiska časa nima, ker ni znano, kdaj je obiskovalec odšel.
 */
function opisiObisk(ob) {
  var prikazi = ob.dogodki.filter(function (d) {
    return d.dogodek === 'lm10_step_view' && d.korak;
  });
  // Dejavnost je pred prvim prikazom izbrala povezava s potjo: obisk se ne
  // začne na uvodnem zaslonu, a ni nadaljevanje. Izbira ZA prvim prikazom je
  // ročna (vrnitev na uvodni zaslon) in tega ne pove.
  var zacelaPovezava =
    prikazi.length > 0 &&
    ob.dogodki.some(function (d) {
      return (
        d.dogodek === 'lm10_industry_selected' &&
        d.lastnosti.source === IZVOR_POVEZAVA &&
        d.zaporedje < prikazi[0].zaporedje
      );
    });
  var o = {
    id: ob.id,
    interni: ob.interni,
    naprava: ob.naprava || '(neznano)',
    vir: ob.vir || '(brez)',
    segment: ob.segment || '(neznan)',
    zacetek: ob.zacetek,
    prikazov: prikazi.length,
    zacelaPovezava: zacelaPovezava,
    nadaljevanje: prikazi.length > 0 && prikazi[0].korak !== UVODNI_KORAK && !zacelaPovezava,
    dosegel: {},
    indeks: {},
    cas: {},
    najdlje: { indeks: -1, kljuc: '', korak: '' },
    oddal: false,
    dostavaOk: false,
    dostavaPadla: '',
    prenosov: 0,
    blokade: [],
  };

  for (var i = 0; i < prikazi.length; i++) {
    var d = prikazi[i];
    var kljuc = d.korak === 'inputs' && d.podrocje ? 'inputs/' + d.podrocje : d.korak;
    var indeks = d.indeks !== null ? d.indeks : polozajKoraka(d.korak);
    o.dosegel[d.korak] = true;
    o.dosegel[kljuc] = true;
    if (o.indeks[kljuc] === undefined || indeks < o.indeks[kljuc]) o.indeks[kljuc] = indeks;
    if (indeks > o.najdlje.indeks) o.najdlje = { indeks: indeks, kljuc: kljuc, korak: d.korak };

    var naslednji = prikazi[i + 1];
    if (naslednji && d.cas && naslednji.cas) {
      var ms = naslednji.cas.getTime() - d.cas.getTime();
      if (ms >= 0 && ms <= NAJDALJSI_CAS_NA_KORAKU_MS) {
        o.cas[d.korak] = (o.cas[d.korak] || 0) + ms;
        if (kljuc !== d.korak) o.cas[kljuc] = (o.cas[kljuc] || 0) + ms;
      }
    }
  }

  ob.dogodki.forEach(function (d) {
    if (d.dogodek === 'lm10_lead_submitted') o.oddal = true;
    else if (d.dogodek === 'lm10_delivery_ok') o.dostavaOk = true;
    else if (d.dogodek === 'lm10_delivery_failed') o.dostavaPadla = String(d.lastnosti.reason || 'neznano');
    else if (d.dogodek === 'lm10_report_download') o.prenosov++;
    else if (d.dogodek === 'lm10_form_blocked') o.blokade.push(String(d.lastnosti.field || '?'));
  });
  return o;
}

/** Vrstice lijaka: koraki v vrstnem redu toka, pod vnosi še vsaka stran posebej. */
function vrsticeLijaka(obiski) {
  var zacetih = obiski.length;
  var vrstice = [];
  KORAKI_LIJAKA.forEach(function (korak) {
    vrstice.push(vrsticaKoraka(obiski, korak[0], korak[0], korak[1], zacetih));
    if (korak[0] === 'inputs') {
      straniVnosov(obiski).forEach(function (kljuc) {
        vrstice.push(
          vrsticaKoraka(obiski, kljuc, 'inputs', '      · ' + kljuc.slice('inputs/'.length), zacetih),
        );
      });
    }
  });
  return vrstice;
}

function vrsticaKoraka(obiski, kljuc, korak, oznaka, zacetih) {
  var doseglo = 0;
  var koncalo = 0;
  var casi = [];
  obiski.forEach(function (o) {
    if (!o.dosegel[kljuc]) return;
    doseglo++;
    var koncalTu = kljuc === korak ? o.najdlje.korak === korak : o.najdlje.kljuc === kljuc;
    if (koncalTu) koncalo++;
    if (o.cas[kljuc] !== undefined) casi.push(o.cas[kljuc]);
  });
  return [
    oznaka,
    doseglo,
    zacetih ? doseglo / zacetih : '',
    koncalo,
    doseglo ? koncalo / doseglo : '',
    casi.length ? Math.round(mediana(casi) / 1000) : '',
  ];
}

/** Strani vnosov, ki jih je kdo dosegel — v vrstnem redu, v katerem se pojavijo v toku. */
function straniVnosov(obiski) {
  var indeks = {};
  obiski.forEach(function (o) {
    for (var kljuc in o.indeks) {
      if (kljuc.indexOf('inputs/') !== 0) continue;
      if (indeks[kljuc] === undefined || o.indeks[kljuc] < indeks[kljuc]) indeks[kljuc] = o.indeks[kljuc];
    }
  });
  return Object.keys(indeks).sort(function (a, b) {
    return indeks[a] - indeks[b] || (a < b ? -1 : 1);
  });
}

function indeksVrsticeKoraka(vrstice, oznaka) {
  for (var i = 0; i < vrstice.length; i++) if (vrstice[i][0] === oznaka) return i;
  throw new Error('V lijaku ni vrstice "' + oznaka + '".');
}

/** Položaj koraka v toku — rezerva za dogodke starejšega builda brez stepIndex. */
function polozajKoraka(korak) {
  for (var i = 0; i < KORAKI_LIJAKA.length; i++) if (KORAKI_LIJAKA[i][0] === korak) return i;
  return KORAKI_LIJAKA.length;
}

function skupine(obiski, kljucObiska) {
  var rezultat = {};
  obiski.forEach(function (o) {
    var kljuc = kljucObiska(o);
    (rezultat[kljuc] = rezultat[kljuc] || []).push(o);
  });
  return rezultat;
}

/** Skupina → začetih, do obrazca, oddaj, delež oddaj; največje skupine najprej. */
function vrsticeSkupin(obiski, kljucObiska) {
  var po = skupine(obiski, kljucObiska);
  return Object.keys(po)
    .sort(function (a, b) {
      return po[b].length - po[a].length || (a < b ? -1 : 1);
    })
    .map(function (kljuc) {
      var seznam = po[kljuc];
      var oddaj = prestej(seznam, function (o) {
        return o.oddal;
      });
      return [
        kljuc,
        seznam.length,
        prestej(seznam, function (o) {
          return o.dosegel.emailGate;
        }),
        oddaj,
        seznam.length ? oddaj / seznam.length : '',
      ];
    });
}

/** Polje → število blokad in število obiskov, ki jih je polje ustavilo vsaj enkrat. */
function vrsticeBlokad(obiski) {
  var blokad = {};
  var obiskov = {};
  obiski.forEach(function (o) {
    var videno = {};
    o.blokade.forEach(function (polje) {
      blokad[polje] = (blokad[polje] || 0) + 1;
      if (!videno[polje]) {
        videno[polje] = true;
        obiskov[polje] = (obiskov[polje] || 0) + 1;
      }
    });
  });
  return Object.keys(blokad)
    .sort(function (a, b) {
      return blokad[b] - blokad[a];
    })
    .map(function (polje) {
      return [polje, blokad[polje], obiskov[polje]];
    });
}

function vrsticeDostave(obiski) {
  var izidi = {};
  obiski.forEach(function (o) {
    if (!o.oddal) return;
    var izid = o.dostavaOk ? 'dostava uspela' : o.dostavaPadla ? 'padla: ' + o.dostavaPadla : 'brez izida';
    izidi[izid] = (izidi[izid] || 0) + 1;
  });
  return Object.keys(izidi)
    .sort()
    .map(function (izid) {
      return [izid, izidi[izid]];
    });
}

/** Zadnjih N dni, vsak dan svoja vrstica tudi brez obiskov — za graf brez lukenj. */
function vrsticePoDnevih(obiski, dni) {
  var poDnevih = {};
  obiski.forEach(function (o) {
    if (!o.zacetek) return;
    var dan = Utilities.formatDate(o.zacetek, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    var d = (poDnevih[dan] = poDnevih[dan] || { zacetih: 0, oddaj: 0 });
    d.zacetih++;
    if (o.oddal) d.oddaj++;
  });
  var vrstice = [];
  var danes = new Date();
  for (var i = dni - 1; i >= 0; i--) {
    var datum = new Date(danes.getFullYear(), danes.getMonth(), danes.getDate() - i);
    var oznaka = Utilities.formatDate(datum, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    var d2 = poDnevih[oznaka] || { zacetih: 0, oddaj: 0 };
    vrstice.push([datum, d2.zacetih, d2.oddaj]);
  }
  return vrstice;
}

/** Zapiše naslov, glavo in vrstice tabele od stolpca A; vrne prvo prosto vrstico pod njo. */
function pisiTabelo(list, vrstica, naslov, glava, vrstice, oblike) {
  list.getRange(vrstica, 1, 1, glava.length).setBackground('#f1f3f4');
  list.getRange(vrstica, 1).setValue(naslov).setFontWeight('bold');
  list
    .getRange(vrstica + 1, 1, 1, glava.length)
    .setValues([glava])
    .setFontWeight('bold')
    .setFontColor('#5f6368');
  if (vrstice.length) {
    list.getRange(vrstica + 2, 1, vrstice.length, glava.length).setValues(vrstice);
    oblike.forEach(function (oblika, i) {
      if (oblika) list.getRange(vrstica + 2, i + 1, vrstice.length, 1).setNumberFormat(oblika);
    });
  } else {
    list.getRange(vrstica + 2, 1).setValue('Ni podatkov.').setFontStyle('italic');
  }
  return vrstica + 2 + Math.max(vrstice.length, 1) + 1;
}

function urediVidezLijaka(list, steviloKartic) {
  list.getRange('A1').setFontSize(16).setFontWeight('bold');
  list.getRange('A2').setFontColor('#5f6368').setFontStyle('italic');
  for (var i = 0; i < steviloKartic; i++) {
    var stolpec = 1 + i * 2;
    list
      .getRange(LIJAK_KARTICE_VRSTICA, stolpec, 1, 2)
      .merge()
      .setFontSize(9)
      .setFontColor('#5f6368')
      .setHorizontalAlignment('center');
    list
      .getRange(LIJAK_KARTICE_VRSTICA + 1, stolpec, 1, 2)
      .merge()
      .setFontSize(24)
      .setFontWeight('bold')
      .setHorizontalAlignment('center');
  }
  list.setColumnWidth(1, 320);
  for (var s = 2; s <= 6; s++) list.setColumnWidth(s, 110);
  list.setColumnWidth(LIJAK_PODATKI_STOLPEC, 220);
  list.setFrozenRows(2);
}

/**
 * Pobriše surove dogodke, starejše od DOGODKI_HRANI_DNI. Vrstice so v vrstnem
 * redu prejema, zato so stare na vrhu in gre dol en strnjen blok — brez
 * prebiranja celega lista.
 */
function pocistiStareDogodke(list) {
  var meja = new Date(Date.now() - NASTAVITVE.DOGODKI_HRANI_DNI * 86400000);
  var vrstic = list.getLastRow() - 1;
  if (vrstic < 1) return 0;
  var prejeti = list.getRange(2, 1, vrstic, 1).getValues();
  var koliko = 0;
  while (koliko < vrstic && prejeti[koliko][0] instanceof Date && prejeti[koliko][0] < meja) koliko++;
  if (!koliko) return 0;

  var kljucavnica = LockService.getScriptLock();
  kljucavnica.waitLock(30000);
  try {
    list.deleteRows(2, koliko);
  } finally {
    kljucavnica.releaseLock();
  }
  return koliko;
}

function prestej(seznam, pogoj) {
  var n = 0;
  seznam.forEach(function (element) {
    if (pogoj(element)) n++;
  });
  return n;
}

function mediana(stevila) {
  var s = stevila.slice().sort(function (a, b) {
    return a - b;
  });
  var n = s.length;
  if (!n) return 0;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

/** Celica z datumom (Date) ali z nizom ISO; sicer null. */
function vDatum(vrednost) {
  if (vrednost instanceof Date) return isNaN(vrednost.getTime()) ? null : vrednost;
  if (typeof vrednost === 'string' && vrednost) {
    var d = new Date(vrednost);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function razcleniLastnosti(vrednost) {
  if (typeof vrednost !== 'string' || !vrednost) return {};
  try {
    var razclenjeno = JSON.parse(vrednost);
    return razclenjeno && typeof razclenjeno === 'object' ? razclenjeno : {};
  } catch (err) {
    return {};
  }
}

/**
 * Dnevna ura za lijak — enkrat ročno. Ob šestih zjutraj, ko zahtev ni: povzetek
 * bere ves list Dogodki in ob večjem prometu teče nekaj sekund.
 */
function namestiUroZaLijak() {
  odstraniUroZaLijak();
  ScriptApp.newTrigger('sestaviLijak').timeBased().everyDays(1).atHour(6).create();
  console.log('Ura nameščena: sestaviLijak vsak dan ob 6h.');
}

function odstraniUroZaLijak() {
  var koliko = 0;
  ScriptApp.getProjectTriggers().forEach(function (sprozilec) {
    if (sprozilec.getHandlerFunction() === 'sestaviLijak') {
      ScriptApp.deleteTrigger(sprozilec);
      koliko++;
    }
  });
  if (koliko) console.log('Odstranjenih ur: ' + koliko + '.');
  return koliko;
}
