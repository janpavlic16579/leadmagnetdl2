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
    return vrednosti;
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
  return vrednosti;
}

function zapisiVrstico(vrednosti) {
  var list = pridobiList();
  var glava = preberiGlavo(list);

  // Nova imena se pripnejo na konec glave. Vrivanje na sredino bi zamaknilo vse
  // že zapisane vrstice — te se ne prepisujejo nikoli.
  var nova = [];
  for (var ime in vrednosti) {
    if (glava.indexOf(ime) === -1 && nova.indexOf(ime) === -1) nova.push(ime);
  }
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
  list.appendRow(vrstica);
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
  var preglednica = NASTAVITVE.ID_PREGLEDNICE
    ? SpreadsheetApp.openById(NASTAVITVE.ID_PREGLEDNICE)
    : SpreadsheetApp.getActive();
  if (!preglednica) {
    throw new Error('Preglednice ni: skripta ni v preglednici in ID_PREGLEDNICE ni nastavljen.');
  }

  var list = preglednica.getSheetByName(NASTAVITVE.IME_LISTA);
  if (!list) {
    list = preglednica.insertSheet(NASTAVITVE.IME_LISTA);
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
