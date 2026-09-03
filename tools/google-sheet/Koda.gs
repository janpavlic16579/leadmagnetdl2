/**
 * LM-10 — beleženje oddaj vprašalnika v Google Sheet.
 *
 * Sprejme POST, ki ga pošlje `src/lib/submitLead.ts`, in doda eno vrstico na
 * list. Navodila za namestitev so v `tools/google-sheet/README.md`; brez njih
 * ta datoteka nima učinka — v repozitoriju je zato, da koda skripte ni samo v
 * brskalniku enega računa.
 *
 * TREH REČI SE NE SPLAČA SPREMINJATI, ne da bi prej prebrali, zakaj so take:
 *
 * 1. STOLPCEV SKRIPTA NE POZNA. Glava in vrstica prideta v telesu zahteve
 *    (`sheet.columns`, `sheet.row`), sestavi ju `src/lib/exportRecord.ts`, kjer
 *    ju pokriva test. Če bi jih sestavljala skripta, bi bila preslikava
 *    podvojena — nov stolpec v aplikaciji bi tiho zamaknil vse podatke v
 *    preglednici, dokler ne bi kdo posodobil še te datoteke.
 * 2. VRSTICA SE PIŠE PO IMENIH STOLPCEV in ne po zaporedju. Nov stolpec se zato
 *    pripne na konec glave, obstoječe vrstice pa ostanejo poravnane.
 * 3. NAPAKA SE VRŽE NAPREJ. Apps Script pri `ContentService` vedno odgovori 200,
 *    zato aplikacija tiho napako razume kot uspešno dostavo — in prodajne
 *    priprave tedaj NE prenese stranki. Vsaka pot, ki ne konča z zapisano
 *    vrstico, mora zato pustiti napako ven (glej `doPost`).
 */

var NASTAVITVE = {
  /** List, na katerega se piše. Nastane sam, če ga ni. */
  IME_LISTA: 'Leadi',

  /** List s pregledom številk. Nastane in se sestavi ob `urediStolpce`. */
  IME_LISTA_ANALITIKA: 'Analitika',

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
   * Komu gre obvestilo ob vsaki oddaji. Prazno = brez obvestil.
   * Več naslovov ločite z vejico: 'prodaja@datalab.si, jan@datalab.si'.
   */
  E_NASLOV_ZA_OBVESTILA: '',

  /** Prazno = skripta teče v preglednici (Razširitve → Apps Script). */
  ID_PREGLEDNICE: '',
};

/** Stolpca, ki ju doda skripta; pred stolpci iz aplikacije, ker se bereta prva. */
var PREJETO = 'prejeto';
var PRIPRAVA = 'prodajnaPriprava';

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
 */
var POKLICANO = 'poklicano';
var SESTANEK = 'sestanek';
var OPOMBE = 'opombe';
var DELOVNI_STOLPCI = [POKLICANO, SESTANEK, OPOMBE];

/** Edine tri vrednosti, ki jih spustni seznam v stolpcu `sestanek` dovoli. */
var SESTANEK_MOZNOSTI = ['sestanek', 'ne želi', 'drugič'];

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

  // Stanje obvestil je tu zato, ker se je enkrat že zgodilo: vrstice so se
  // pisale, pošte pa ni bilo, in vzroka ni bilo mogoče videti od zunaj — napaka
  // pošte je namreč namerno pogoltnjena (glej doPost). Te tri vrstice ločijo
  // "naslov ni nastavljen" od "razmeščena je stara različica" od "pošiljanje
  // je vrglo napako", brez brskanja po dnevniku izvedb.
  var vrstice = [
    'LM-10 zbiralnik deluje. List: ' + list.getName() + ', vrstic: ' + Math.max(0, list.getLastRow() - 1) + '.',
    'Obvestila: ' + (NASTAVITVE.E_NASLOV_ZA_OBVESTILA ? 'nastavljena' : 'IZKLOPLJENA (prazen E_NASLOV_ZA_OBVESTILA)'),
    'Zadnja poslana pošta: ' + (lastnosti.getProperty('ZADNJA_POSTA') || 'še nobena'),
    'Zadnja napaka pošte: ' + (lastnosti.getProperty('ZADNJA_NAPAKA_POSTE') || 'brez'),
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

  var oddaja = JSON.parse(e.postData.contents);
  if (!oddaja.record) throw new Error('V telesu ni zapisa (record).');

  // Dve hkratni oddaji bi brez ključavnice lahko pisali v isto vrstico. Trideset
  // sekund je pod osemsekundnim rokom na strani aplikacije le navidez: rok velja
  // za odgovor, ključavnica pa se sprosti tudi, ko odjemalca ni več.
  var kljucavnica = LockService.getScriptLock();
  kljucavnica.waitLock(30000);

  var napakaPriprave = null;
  try {
    var povezava = '';
    if (NASTAVITVE.SHRANI_PRIPRAVO && oddaja.salesReportHtml) {
      try {
        povezava = shraniPripravo(oddaja);
      } catch (err) {
        // Vrstica je dragocenejša od povezave: najprej jo zapišemo, šele nato
        // napako vržemo naprej (spodaj), da aplikacija pripravo prenese stranki.
        napakaPriprave = err;
        povezava = 'NAPAKA: ' + err;
      }
    }

    var vrednosti = zdruziVrednosti(oddaja, povezava);
    zapisiVrstico(vrednosti);

    // ŠELE ZA vrstico in v svojem try/catch. Obvestilo je priročnost, vrstica je
    // zapis: padla pošta (kvota, napačen naslov) ne sme pomeniti, da aplikacija
    // dostavo razume kot neuspelo in prodajno pripravo prenese stranki.
    var lastnosti = PropertiesService.getScriptProperties();
    try {
      posljiObvestilo(vrednosti);
      lastnosti.setProperty('ZADNJA_POSTA', new Date().toISOString());
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
  } finally {
    kljucavnica.releaseLock();
  }

  if (napakaPriprave) throw napakaPriprave;

  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/**
 * Vrednosti vrstice kot pari ime → vrednost.
 *
 * `sheet` je pot, po kateri pride vse iz aplikacije. Rezerva iz `record` obstaja
 * za primer, ko bi zahtevo poslal kdo drug (ali starejša različica aplikacije):
 * bolje pol vrstice kot izgubljen lead.
 */
function zdruziVrednosti(oddaja, povezavaPriprave) {
  var vrednosti = {};
  vrednosti[PREJETO] = new Date();
  vrednosti[PRIPRAVA] = povezavaPriprave;

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

  // Potrditveno polje in spustni seznam za pravkar dodano vrstico. V try/catch,
  // ker je to kozmetika: napaka tu ne sme pomeniti, da aplikacija dostavo razume
  // kot neuspelo in prodajno pripravo prenese stranki (načelo 3 v glavi).
  try {
    opremiVrstico(list, glava, list.getLastRow());
  } catch (err) {
    console.warn('Vrstice ni bilo mogoče opremiti: ' + err);
  }
}

/**
 * Klicateljevim celicam ene vrstice doda potrditveno polje, spustni seznam in
 * obliko navadnega besedila.
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
    list.getRange(vrstica, kje(SESTANEK)).setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInList(SESTANEK_MOZNOSTI, true)
        .setAllowInvalid(false)
        .build(),
    );
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
  var kljucavnica = LockService.getScriptLock();
  kljucavnica.waitLock(30000);
  try {
    return preurediList();
  } finally {
    kljucavnica.releaseLock();
  }
}

function preurediList() {
  var list = pridobiList();
  if (list.getLastRow() === 0) throw new Error('List je prazen — ni česa urejati.');

  // Najprej odvečne prazne vrstice dol. Brez tega bi veliki prepis spodaj
  // prežvečil ves list (996 praznih vrstic namesto sedmih polnih), oddaja pa bi
  // pristajala na njegovem dnu.
  pociistiOdvecneVrstice(list);

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
    nove.push(vrstica);
  }

  // Veljavnost podatkov mora dol PRED zapisom, sicer prepis sploh ne steče.
  //
  // Spustni seznam v stolpcu `sestanek` je nastavljen strogo (setAllowInvalid
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
    analitika
  );
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
function pociistiOdvecneVrstice(list) {
  var vrstic = list.getMaxRows();
  if (vrstic < 2) return 0;

  // CELOTNA vrstica in ne le prvi stolpec. Prvi stolpec pove, ali je to lead;
  // prazna vrstica pa je samo tista, v kateri ni prav ničesar — tudi ne
  // klicateljeve opombe brez vsega drugega.
  var podatki = list.getRange(2, 1, vrstic - 1, list.getMaxColumns()).getValues();
  var prazna = podatki.map(function (vrstica) {
    return vrstica.every(function (celica) {
      return celica === '' || celica === null;
    });
  });

  // Od spodaj navzgor in v strnjenih blokih: brisanje od zgoraj bi premaknilo
  // vse indekse pod sabo, blok pa je en klic namesto tisoč.
  var pobrisanih = 0;
  var konec = null;
  for (var i = prazna.length - 1; i >= -1; i--) {
    var jePrazna = i >= 0 && prazna[i];
    if (jePrazna && konec === null) konec = i;
    if (!jePrazna && konec !== null) {
      var prvaVrstica = i + 3;
      var koliko = konec - i;
      list.deleteRows(prvaVrstica, koliko);
      pobrisanih += koliko;
      konec = null;
    }
  }
  return pobrisanih;
}

/**
 * V glavo doda imena, ki jih aplikacija nikoli ne pošlje: izpeljanki
 * (`kliciTakoj`, `letno`) in tri klicateljeve stolpce.
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
  poklicano: 'Obkljukajte, ko je klic opravljen.',
  sestanek: 'Izid klica: sestanek / ne želi / drugič.',
  opombe: 'Prosto besedilo. Oblikovano kot navadno besedilo, da datumi in formule ostanejo, kot jih vpišete.',
};

/**
 * Vidna podoba lista: skriti strojni stolpci, širine, oblike, potrditvena polja,
 * spustni seznam, filter.
 *
 * Vse to je treba postavljati ZNOVA ob vsakem preurejanju. `setValues` premakne
 * samo VREDNOSTI — veljavnost podatkov, oblike števil, širine in zapiski ostanejo
 * na starem indeksu stolpca. Brez tega bi po prerazvrstitvi spustni seznam
 * obtičal sredi e-naslovov, potrditveno polje pa sredi zneskov.
 */
function urediVidez(list, glava) {
  var vrstic = Math.max(0, list.getLastRow() - 1);

  list.setFrozenRows(1);
  list.getRange(1, 1, 1, glava.length).setFontWeight('bold').setBackground('#f1f3f4');

  // Veljavnosti najprej dol, nato na novo po IMENU stolpca (glej glavo).
  //
  // SAMO čez vrstice s podatki, nikoli do getMaxRows(). To je bilo prvič
  // narobe in se je grdo poznalo: oblikovanje in poravnava, nanesena čez ves
  // list, razširita "uporabljeni obseg" (isto, kar pokaže Ctrl+End), zato je
  // getLastRow skočil s 7 na 996 — naslednja oddaja bi pristala tisoč vrstic
  // niže, za morjem praznih. Nove vrstice dobijo svoje v `opremiVrstico`.
  if (vrstic) list.getRange(2, 1, vrstic, glava.length).clearDataValidations();

  var sirine = {
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
    sestanek: 120,
    opombe: 320,
    prodajnaPriprava: 220,
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

    if (ime === POKLICANO) {
      // requireCheckbox in NE insertCheckboxes: slednji v vsako celico razpona
      // ZAPIŠE false — s tem potisne getLastRow na konec lista (naslednja oddaja
      // pristane stotine vrstic niže) in odkljuka vse, kar je klicatelj označil.
      list
        .getRange(2, stolpec, vrstic, 1)
        .setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build())
        .setHorizontalAlignment('center');
    }
    if (ime === SESTANEK) {
      list.getRange(2, stolpec, vrstic, 1).setDataValidation(
        SpreadsheetApp.newDataValidation()
          .requireValueInList(SESTANEK_MOZNOSTI, true)
          .setAllowInvalid(false)
          .build(),
      );
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
  list.getRange(1, 1, Math.max(2, list.getLastRow()), glava.length).createFilter();

  // Brez preloma besedila: ena oddaja naj ostane ena vrstica, sicer se list
  // razpotegne v nekaj, česar se ne da preleteti.
  list.getDataRange().setWrap(false).setVerticalAlignment('middle');
}

/**
 * List „Analitika": kartice s ključnimi številkami, štirje grafi, delovna vrsta
 * za klicanje in podatkovni del, iz katerega grafi jemljejo.
 *
 * VSE ŠTEVILKE SO ŽIVE FORMULE, ne izračun skripte, in to je bistvo.
 * Klicatelj obkljuka `poklicano` in izbere `sestanek` ROČNO, v preglednici —
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
  var izid = R(SESTANEK);
  var letno = R(LETNO);

  var skupaj = 'COUNTA(' + stevilo + ')';
  var poklicanih = 'COUNTIF(' + klicano + ',TRUE)';
  var prosijo = 'COUNTIF(' + posvet + ',"DA")';
  var caka = prosijo + '-COUNTIFS(' + posvet + ',"DA",' + klicano + ',TRUE)';
  var sestankov = 'COUNTIF(' + izid + ',"' + SESTANEK_MOZNOSTI[0] + '")';

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
    ['Poklicani brez vpisanega izida', '=MAX(0,' + poklicanih + '-COUNTA(' + izid + '))', '#.##0'],
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

  var izidi = SESTANEK_MOZNOSTI.map(function (moznost) {
    return [moznost, '=COUNTIF(' + izid + ',"' + moznost + '")'];
  });
  izidi.push(['brez vpisanega izida', '=MAX(0,' + poklicanih + '-COUNTA(' + izid + '))']);

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
function zascitiOpozorilno(list) {
  try {
    list.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(function (prejsnja) {
      prejsnja.remove();
    });
    list
      .protect()
      .setDescription('Analitika se sestavi samodejno — ročni vnosi se ob naslednjem zagonu izgubijo.')
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
  var pogoji = [PREJETO, KLICI_TAKOJ, POKLICANO, SESTANEK, OPOMBE, LETNO].map(function (ime) {
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
    throw new Error('Stolpca "' + ime + '" v glavi ni — analitike ni mogoče sestaviti.');
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
  var preglednica = NASTAVITVE.ID_PREGLEDNICE
    ? SpreadsheetApp.openById(NASTAVITVE.ID_PREGLEDNICE)
    : SpreadsheetApp.getActive();
  if (!preglednica) {
    throw new Error('Preglednice ni: skripta ni v preglednici in ID_PREGLEDNICE ni nastavljen.');
  }

  var list = preglednica.getSheetByName(ime);
  if (!list) {
    list = preglednica.insertSheet(ime);
  }
  return list;
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
 * Obvestilo o novem leadu.
 *
 * Vsebina je izbrana tako, da se je mogoče odločiti brez odpiranja preglednice:
 * kdo, iz katere panoge, kako velik, koliko ga stane in ali je PROSIL za posvet.
 * Zadnje je edino polje, ki pove namero in ne le dovoljenja, zato stoji v zadevi.
 *
 * Dnevna kvota MailApp je 100 prejemnikov pri navadnem Google računu in 1500 pri
 * Workspacu — za lead magnet daleč dovolj, a ob množičnem testiranju jo je mogoče
 * izčrpati; tedaj obvestila utihnejo, vrstice pa se pišejo naprej.
 */
function posljiObvestilo(vrednosti) {
  var prejemniki = String(NASTAVITVE.E_NASLOV_ZA_OBVESTILA || '').trim();
  if (!prejemniki) return;

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
    'Prodajna priprava: ' + v('prodajnaPriprava'),
    'Preglednica: ' + pridobiList().getParent().getUrl(),
  ].filter(function (vrstica) {
    return vrstica !== '';
  });

  MailApp.sendEmail({
    to: prejemniki,
    subject: (posvet ? '[POSVET] ' : '') + 'Nov lead: ' + podjetje,
    body: vrstice.join('\n'),
  });
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
 * Prodajno pripravo shrani kot HTML na Drive in vrne povezavo.
 *
 * Mapa se poišče po imenu in ustvari le prvič; njen id se zapomni med zagoni,
 * ker je iskanje po imenu ob vsaki oddaji nepotrebno počasno in bi ob
 * preimenovanju mape tiho ustvarilo drugo.
 */
function shraniPripravo(oddaja) {
  var mapa = pridobiMapo();
  var zapis = oddaja.record;
  var ime =
    'priprava-' +
    String(zapis.timestampISO || '').slice(0, 10) +
    '-' +
    String(zapis.companyName || 'neznano')
      .replace(/[^\wčšžćđČŠŽĆĐ .-]+/g, '_')
      .replace(/[ .]+$/, '') +
    '.html';

  var datoteka = mapa.createFile(
    Utilities.newBlob(oddaja.salesReportHtml, 'text/html', ime),
  );
  return datoteka.getUrl();
}

function pridobiMapo() {
  var lastnosti = PropertiesService.getScriptProperties();
  var id = lastnosti.getProperty('ID_MAPE_PRIPRAV');
  if (id) {
    try {
      return DriveApp.getFolderById(id);
    } catch (err) {
      // Mapa je bila izbrisana ali premaknjena v koš — spodaj nastane nova.
      lastnosti.deleteProperty('ID_MAPE_PRIPRAV');
    }
  }

  var najdene = DriveApp.getFoldersByName(NASTAVITVE.IME_MAPE_PRIPRAV);
  var mapa = najdene.hasNext() ? najdene.next() : DriveApp.createFolder(NASTAVITVE.IME_MAPE_PRIPRAV);
  lastnosti.setProperty('ID_MAPE_PRIPRAV', mapa.getId());
  return mapa;
}
