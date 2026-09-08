/**
 * Preizkus skripte Koda.gs brez Googla.
 *
 * Koda.gs teče v Apps Scriptu in tam testov ni: vsaka sprememba se je doslej
 * preverila tako, da se je prilepila, razmestila in poslala oddaja. Ta datoteka
 * skripto naloži v Node (`node:vm`) z globali, ki jih Apps Script sicer da sam
 * — SpreadsheetApp s preglednico v pomnilniku, LockService, PropertiesService,
 * ContentService, Utilities, Session, ScriptApp, Charts — in skoznjo požene obe
 * poti webhooka ter sestavljanje lijaka.
 *
 * Pognati:  node tools/google-sheet/preizkus.mjs
 * Brez odvisnosti: node:test, node:assert, node:vm. Isti ukaz teče v CI.
 *
 * Kaj preverja:
 *  1. doPost z `record` + `sheet.columns/row` zapiše vrstico na list Leadi po
 *     IMENIH stolpcev, glavo v vrstnem redu VRSTNI_RED, z izpeljanima stolpcema
 *     kliciTakoj in letno ter s praznimi stolpci za klicatelja.
 *  2. doPost z `events` + `visit` (FunnelEnvelope iz src/lib/funnel.ts) pripne
 *     vrstice na list Dogodki: znane lastnosti v svoje stolpce, ostale kot JSON.
 *  3. sestaviLijak iz šestih značilnih obiskov sestavi list Lijak s pravimi
 *     števili: obiskov po korakih, „končalo tu", mediana časa, blokade po polju,
 *     nadaljevanje po osvežitvi in interni obisk posebej.
 *  4. Paket brez id-ja obiska (pa tudi brez dogodkov ali telo brez zapisa) vrže
 *     napako in ne pusti sledi.
 *  5. Poročilo stranki po e-pošti (posljiPorociloStranki): s prilogama gre
 *     stranki natanko eno sporočilo s samo njenim PDF-jem, priprava nikoli —
 *     tudi z napačnim imenom; brez naslova, brez priloge, ob izklopu in ob padli
 *     pošti odgovor pove razlog, vrstica in obvestilo prodaji pa ostaneta.
 *  6. ActiveCampaign (posljiVAC, acNaSeznam, narociObstojeceVAC, ura) s
 *     ponarejenim UrlFetchApp, ki zahteve zapisuje: kontakt gre na seznam kot
 *     naročen, privolitev postane oznaka, kdor se je sam odjavil, brez sveže
 *     privolitve ostane odjavljen, enkratni poseg naroči že poslane kontakte.
 *  7. Strankin PDF na Drivu (shraniPorocilo): datoteka gre v svojo mapo, deljena
 *     s povezavo, priprava v svojo brez deljenja; povezava je v stolpcu
 *     porociloPdf in v polju LM10_POROCILO v AC. Ob odpovedi Drive ostane v
 *     celici NAPAKA, polje v AC izpade, vrstica in pošta stranki tečeta naprej.
 *
 * Kaj ponaredek NAMENOMA ne posnema: razlage vrednosti v pravi preglednici. Niz
 * "'+386 …" ostane z uvodnim opuščajem, "true" ostane niz — kaj bi preglednica
 * iz tega naredila, ni predmet preizkusa; predmet je, kaj skripta zapiše. Prav
 * tako ne posnema Googlove navade, da vrstico z golo obliko šteje za uporabljeno:
 * getLastRow tu gleda samo vsebino. To je past, ki jo skripta obide sama, in
 * preizkus meri njeno logiko, ne pasti. Stolpci čez rob lista pa vržejo napako
 * tako kot pri Googlu — brez tega bi `zagotoviStolpce` lahko tiho izginil.
 *
 * DriveApp je ponarejen (`ustvariDrive`): mape po imenu in id-ju, datoteke z
 * imenom, tipom, bajti in deljenjem, vse vidno v `drive.datoteke`. UrlFetchApp
 * je prazen, dokler ga preizkus AC ne nadomesti (`ponarediAC`) — brez lastnosti
 * AC_* skripta AC preskoči. MailApp je ponarejen: sporočila se zbirajo v
 * `posta`, da test vidi naslovnika, prilogi in besedilo.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const POT_SKRIPTE = new URL('./Koda.gs', import.meta.url);

// ═══════════════════════════════════════════════════════════════════════════
// Ponarejena preglednica
// ═══════════════════════════════════════════════════════════════════════════

const kljucCelice = (vrstica, stolpec) => `${vrstica}:${stolpec}`;
const izKljuca = (kljuc) => kljuc.split(':').map(Number);

/** "A1" → [vrstica, stolpec, vrstic, stolpcev]; podprt je tudi "A1:B2". */
function izA1(zapis) {
  const m = /^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/.exec(zapis);
  if (!m) throw new Error(`Nepodprt zapis obsega: ${zapis}`);
  const stolpec = (crke) => [...crke].reduce((n, crka) => n * 26 + crka.charCodeAt(0) - 64, 0);
  const v1 = Number(m[2]);
  const s1 = stolpec(m[1]);
  const v2 = m[4] ? Number(m[4]) : v1;
  const s2 = m[3] ? stolpec(m[3]) : s1;
  return [v1, s1, v2 - v1 + 1, s2 - s1 + 1];
}

function ustvariList(ime, preglednica) {
  /** Vsebina: "vrstica:stolpec" → vrednost. Prazne celice v njej ni. */
  const vsebina = new Map();
  /** Oblike, opombe in veljavnost — LOČENO od vsebine, da getLastRow nanje ne gleda. */
  const oblike = new Map();
  const grafi = [];
  const zascite = [];
  let filter = null;
  let maxVrstic = 1000;
  let maxStolpcev = 26;
  let zamrznjenihVrstic = 0;

  /** Zadnja vrstica (os 0) ali stolpec (os 1) z vsebino. */
  const zadnja = (os) => {
    let najvec = 0;
    for (const kljuc of vsebina.keys()) najvec = Math.max(najvec, izKljuca(kljuc)[os]);
    return najvec;
  };

  /** Premakne (ali pobriše) celice ob vrivanju in brisanju vrstic/stolpcev. */
  const preslikaj = (kam) => {
    for (const shramba of [vsebina, oblike]) {
      const nova = new Map();
      for (const [kljuc, vrednost] of shramba) {
        const cilj = kam(...izKljuca(kljuc));
        if (cilj) nova.set(kljucCelice(...cilj), vrednost);
      }
      shramba.clear();
      for (const [kljuc, vrednost] of nova) shramba.set(kljuc, vrednost);
    }
  };

  function obseg(vrstica, stolpec, stVrstic, stStolpcev) {
    if (!(vrstica >= 1 && stolpec >= 1 && stVrstic >= 1 && stStolpcev >= 1)) {
      throw new Error(
        `Neveljaven obseg na listu "${ime}": (${vrstica}, ${stolpec}, ${stVrstic}, ${stStolpcev}).`,
      );
    }
    // Vrstice čez rob list doda sam (kot appendRow), stolpcev ne — to je napaka,
    // zaradi katere v skripti obstaja zagotoviStolpce.
    if (stolpec + stStolpcev - 1 > maxStolpcev) {
      throw new Error(
        `Obseg sega čez rob lista "${ime}": stolpec ${stolpec + stStolpcev - 1}, list jih ima ${maxStolpcev}.`,
      );
    }

    const vsakaCelica = (kaj) => {
      for (let r = 0; r < stVrstic; r++) {
        for (let c = 0; c < stStolpcev; c++) kaj(vrstica + r, stolpec + c);
      }
    };
    const zapisi = (r, c, vrednost) => {
      const v = vrednost === null || vrednost === undefined ? '' : vrednost;
      if (v === '') vsebina.delete(kljucCelice(r, c));
      else vsebina.set(kljucCelice(r, c), v);
      maxVrstic = Math.max(maxVrstic, r);
    };
    const oblika = (polje, vrednost) => {
      vsakaCelica((r, c) => {
        const kljuc = kljucCelice(r, c);
        if (!oblike.has(kljuc)) oblike.set(kljuc, {});
        oblike.get(kljuc)[polje] = vrednost;
      });
      return o;
    };

    const o = {
      getRow: () => vrstica,
      getColumn: () => stolpec,
      getNumRows: () => stVrstic,
      getNumColumns: () => stStolpcev,
      getValues() {
        const vrstice = [];
        for (let r = 0; r < stVrstic; r++) {
          const v = [];
          for (let c = 0; c < stStolpcev; c++) {
            const kljuc = kljucCelice(vrstica + r, stolpec + c);
            v.push(vsebina.has(kljuc) ? vsebina.get(kljuc) : '');
          }
          vrstice.push(v);
        }
        return vrstice;
      },
      getValue: () => o.getValues()[0][0],
      setValues(vrednosti) {
        if (!Array.isArray(vrednosti) || vrednosti.length !== stVrstic) {
          throw new Error(
            `setValues na listu "${ime}": obseg ima ${stVrstic} vrstic, podanih je ${
              Array.isArray(vrednosti) ? vrednosti.length : 'nekaj, kar ni polje'
            }.`,
          );
        }
        vrednosti.forEach((v, i) => {
          if (!Array.isArray(v) || v.length !== stStolpcev) {
            throw new Error(
              `setValues na listu "${ime}": obseg ima ${stStolpcev} stolpcev, vrstica ${i + 1} jih ima ${
                Array.isArray(v) ? v.length : 'nekaj, kar ni polje'
              }.`,
            );
          }
        });
        vrednosti.forEach((v, r) => v.forEach((celica, c) => zapisi(vrstica + r, stolpec + c, celica)));
        return o;
      },
      setValue(vrednost) {
        vsakaCelica((r, c) => zapisi(r, c, vrednost));
        return o;
      },
      setFormula: (formula) => o.setValue(formula),
      setNumberFormat: (v) => oblika('numberFormat', v),
      setFontWeight: (v) => oblika('fontWeight', v),
      setFontColor: (v) => oblika('fontColor', v),
      setFontStyle: (v) => oblika('fontStyle', v),
      setFontSize: (v) => oblika('fontSize', v),
      setBackground: (v) => oblika('background', v),
      setHorizontalAlignment: (v) => oblika('horizontalAlignment', v),
      setVerticalAlignment: (v) => oblika('verticalAlignment', v),
      setWrap: (v) => oblika('wrap', v),
      setNote: (v) => oblika('note', v),
      clearNote: () => oblika('note', null),
      setDataValidation: (v) => oblika('dataValidation', v),
      clearDataValidations: () => oblika('dataValidation', null),
      clearFormat() {
        vsakaCelica((r, c) => oblike.delete(kljucCelice(r, c)));
        return o;
      },
      merge: () => o,
      createFilter() {
        filter = {
          remove() {
            filter = null;
          },
        };
        return filter;
      },
    };
    return o;
  }

  const list = {
    getName: () => ime,
    getParent: () => preglednica,
    getLastRow: () => zadnja(0),
    getLastColumn: () => zadnja(1),
    getMaxRows: () => maxVrstic,
    getMaxColumns: () => maxStolpcev,
    getFrozenRows: () => zamrznjenihVrstic,
    setFrozenRows(n) {
      zamrznjenihVrstic = n;
      return list;
    },
    setFrozenColumns: () => list,
    getRange(...args) {
      if (typeof args[0] === 'string') return obseg(...izA1(args[0]));
      const [vrstica, stolpec, stVrstic = 1, stStolpcev = 1] = args;
      return obseg(vrstica, stolpec, stVrstic, stStolpcev);
    },
    getDataRange: () => obseg(1, 1, Math.max(1, zadnja(0)), Math.max(1, zadnja(1))),
    appendRow(vrednosti) {
      obseg(zadnja(0) + 1, 1, 1, vrednosti.length).setValues([vrednosti]);
      return list;
    },
    insertColumnsAfter(za, koliko) {
      preslikaj((r, c) => [r, c > za ? c + koliko : c]);
      maxStolpcev += koliko;
      return list;
    },
    insertRowsAfter(za, koliko) {
      preslikaj((r, c) => [r > za ? r + koliko : r, c]);
      maxVrstic += koliko;
      return list;
    },
    deleteRows(od, koliko) {
      preslikaj((r, c) => (r >= od && r < od + koliko ? null : [r >= od + koliko ? r - koliko : r, c]));
      maxVrstic -= koliko;
      return list;
    },
    clear() {
      vsebina.clear();
      oblike.clear();
      return list;
    },
    hideColumns: () => list,
    showColumns: () => list,
    setColumnWidth: () => list,
    getFilter: () => filter,
    getCharts: () => grafi.slice(),
    insertChart(graf) {
      grafi.push(graf);
    },
    removeChart(graf) {
      const i = grafi.indexOf(graf);
      if (i !== -1) grafi.splice(i, 1);
    },
    newChart() {
      const graf = { vrsta: null, obsegi: [], polozaj: null, moznosti: {} };
      const graditelj = {
        setChartType(v) {
          graf.vrsta = v;
          return graditelj;
        },
        addRange(o) {
          graf.obsegi.push(o);
          return graditelj;
        },
        setPosition(vrstica, stolpec, x, y) {
          graf.polozaj = { vrstica, stolpec, x, y };
          return graditelj;
        },
        setOption(ime, v) {
          graf.moznosti[ime] = v;
          return graditelj;
        },
        build: () => graf,
      };
      return graditelj;
    },
    getProtections: () => zascite.slice(),
    protect() {
      const zascita = {
        opis: '',
        samoOpozorilo: false,
        setDescription(opis) {
          zascita.opis = opis;
          return zascita;
        },
        setWarningOnly(da) {
          zascita.samoOpozorilo = da;
          return zascita;
        },
        remove() {
          const i = zascite.indexOf(zascita);
          if (i !== -1) zascite.splice(i, 1);
        },
      };
      zascite.push(zascita);
      return zascita;
    },
    /** Samo za preizkus (ni del Googlovega API-ja): oblika ene celice. */
    oblikaCelice: (vrstica, stolpec) => oblike.get(kljucCelice(vrstica, stolpec)) ?? {},
  };
  return list;
}

function ustvariPreglednico() {
  const listi = new Map();
  const preglednica = {
    getName: () => 'LM-10 preizkus',
    getUrl: () => 'https://docs.google.com/spreadsheets/d/preizkus',
    getSheetByName: (ime) => listi.get(ime) ?? null,
    getSheets: () => [...listi.values()],
    insertSheet(ime) {
      const list = ustvariList(ime, preglednica);
      listi.set(ime, list);
      return list;
    },
  };
  return preglednica;
}

/** Utilities.formatDate: vzorci SimpleDateFormat, kolikor jih skripta uporablja. */
function formatDate(datum, casovniPas, vzorec) {
  const deli = {};
  const oblikovalnik = new Intl.DateTimeFormat('en-US', {
    timeZone: casovniPas,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  for (const del of oblikovalnik.formatToParts(datum)) deli[del.type] = del.value;
  const zamenjave = {
    yyyy: deli.year,
    MM: deli.month,
    dd: deli.day,
    HH: deli.hour,
    mm: deli.minute,
    ss: deli.second,
    M: String(Number(deli.month)),
    d: String(Number(deli.day)),
    H: String(Number(deli.hour)),
  };
  return vzorec.replace(/yyyy|MM|dd|HH|mm|ss|M|d|H/g, (znak) => zamenjave[znak]);
}

/**
 * Drive, kolikor ga skripta potrebuje: mape po imenu in id-ju, datoteke z
 * imenom, tipom, bajti in deljenjem. Vse ostane v `datoteke` in `mape`, da test
 * vidi, KAM je kaj šlo in ali je deljeno.
 */
function ustvariDrive() {
  const mape = new Map();
  const datoteke = [];
  let stevec = 0;
  const DriveApp = {
    Access: { ANYONE_WITH_LINK: 'ANYONE_WITH_LINK', PRIVATE: 'PRIVATE' },
    Permission: { VIEW: 'VIEW', EDIT: 'EDIT' },
    createFolder(ime) {
      const id = `mapa-${++stevec}`;
      const mapa = {
        getId: () => id,
        getName: () => ime,
        createFile(blob) {
          const datoteka = {
            id: `datoteka-${++stevec}`,
            mapa: ime,
            ime: blob.getName(),
            tip: blob.getContentType(),
            bajti: blob.getBytes(),
            deljenje: null,
          };
          datoteka.url = `https://drive.google.com/file/d/${datoteka.id}/view`;
          datoteke.push(datoteka);
          const rocaj = {
            getId: () => datoteka.id,
            getName: () => datoteka.ime,
            getUrl: () => datoteka.url,
            setSharing(dostop, dovoljenje) {
              datoteka.deljenje = `${dostop}/${dovoljenje}`;
              return rocaj;
            },
          };
          return rocaj;
        },
      };
      mape.set(id, mapa);
      return mapa;
    },
    getFolderById(id) {
      const mapa = mape.get(id);
      if (!mapa) throw new Error(`Mape ${id} ni.`);
      return mapa;
    },
    getFoldersByName(ime) {
      const najdene = [...mape.values()].filter((mapa) => mapa.getName() === ime);
      let i = 0;
      return { hasNext: () => i < najdene.length, next: () => najdene[i++] };
    },
  };
  return { DriveApp, mape, datoteke };
}

/** Globali Apps Scripta, kolikor jih skripta na preizkušenih poteh potrebuje. */
function ustvariGoogle() {
  const preglednica = ustvariPreglednico();
  const drive = ustvariDrive();
  const lastnosti = new Map();
  const dnevnik = { log: [], warn: [] };
  /** Vsa sporočila, ki bi jih skripta poslala — stranki in prodaji, po vrsti. */
  const posta = [];
  const kljucavnica = { waitLock() {}, tryLock: () => true, releaseLock() {}, hasLock: () => true };
  const skriptneLastnosti = {
    getProperty: (ime) => (lastnosti.has(ime) ? lastnosti.get(ime) : null),
    setProperty(ime, vrednost) {
      lastnosti.set(ime, String(vrednost));
      return skriptneLastnosti;
    },
    deleteProperty(ime) {
      lastnosti.delete(ime);
      return skriptneLastnosti;
    },
  };

  const globali = {
    SpreadsheetApp: {
      getActive: () => preglednica,
      openById: () => preglednica,
      ProtectionType: { SHEET: 'SHEET', RANGE: 'RANGE' },
      newDataValidation() {
        const pravilo = { vrsta: '', seznam: null, dovoliNeveljavno: true };
        const graditelj = {
          requireCheckbox() {
            pravilo.vrsta = 'checkbox';
            return graditelj;
          },
          requireValueInList(seznam) {
            pravilo.vrsta = 'list';
            pravilo.seznam = seznam.slice();
            return graditelj;
          },
          setAllowInvalid(dovoli) {
            pravilo.dovoliNeveljavno = dovoli;
            return graditelj;
          },
          build: () => pravilo,
        };
        return graditelj;
      },
    },
    LockService: { getScriptLock: () => kljucavnica },
    PropertiesService: { getScriptProperties: () => skriptneLastnosti },
    ContentService: {
      MimeType: { JSON: 'application/json', TEXT: 'text/plain' },
      createTextOutput(besedilo) {
        const izhod = {
          setMimeType: () => izhod,
          getContent: () => besedilo,
        };
        return izhod;
      },
    },
    Utilities: {
      formatDate,
      formatString: (vzorec, ...argumenti) => vzorec.replace(/%s/g, () => String(argumenti.shift())),
      base64Encode: (podatki) => Buffer.from(podatki).toString('base64'),
      base64Decode: (niz) => Array.from(Buffer.from(String(niz), 'base64')),
      // Blob, kolikor ga pošta potrebuje: ime, tip, bajti.
      newBlob(bajti, tip, ime) {
        return { getName: () => ime, getContentType: () => tip, getBytes: () => bajti };
      },
    },
    // Isti časovni pas, kot ga ima Date v tem procesu — tako je tudi v Apps
    // Scriptu, kjer je lokalni čas skripte njen časovni pas.
    Session: { getScriptTimeZone: () => Intl.DateTimeFormat().resolvedOptions().timeZone },
    ScriptApp: {
      getProjectTriggers: () => [],
      deleteTrigger() {},
      newTrigger() {
        throw new Error('Ur v preizkusu ni.');
      },
    },
    Charts: { ChartType: { COLUMN: 'COLUMN', BAR: 'BAR', PIE: 'PIE', LINE: 'LINE' } },
    MailApp: {
      sendEmail(sporocilo) {
        posta.push(sporocilo);
      },
      getRemainingDailyQuota: () => 100,
    },
    DriveApp: drive.DriveApp,
    UrlFetchApp: {},
    console: {
      log: (...a) => dnevnik.log.push(a.join(' ')),
      warn: (...a) => dnevnik.warn.push(a.join(' ')),
      error: (...a) => dnevnik.warn.push(a.join(' ')),
    },
    // Isti Date kot v preizkusu: kontekst vm bi imel svojega in datumi, ki jih
    // skripta zapiše, ne bi prestali `instanceof Date` na tej strani.
    Date,
  };
  return { globali, preglednica, lastnosti, dnevnik, posta, drive };
}

/** Naloži Koda.gs v svež kontekst; funkcije skripte so lastnosti vrnjenega objekta. */
function naloziSkripto() {
  const google = ustvariGoogle();
  const kontekst = vm.createContext(google.globali);
  vm.runInContext(readFileSync(POT_SKRIPTE, 'utf8'), kontekst, { filename: 'Koda.gs' });
  return { skripta: kontekst, ...google };
}

// ═══════════════════════════════════════════════════════════════════════════
// Pomočniki preizkusa
// ═══════════════════════════════════════════════════════════════════════════

/** POST, kot ga sestavi brskalnik: telo kot niz, brez parametrov v naslovu. */
function post(skripta, telo) {
  const odgovor = skripta.doPost({
    parameter: {},
    postData: { type: 'text/plain', contents: JSON.stringify(telo) },
  });
  return JSON.parse(odgovor.getContent());
}

const vrstice = (list) => list.getDataRange().getValues();

/** Vrstica lista kot slovar ime stolpca (iz 1. vrstice) → vrednost. */
function poImenih(list, vrstica) {
  const vse = vrstice(list);
  const slovar = {};
  vse[0].forEach((ime, i) => {
    slovar[ime] = vse[vrstica - 1][i];
  });
  return slovar;
}

/**
 * Tabela na listu Lijak po naslovu v stolpcu A (glej pisiTabelo v skripti):
 * preveri glavo in vrne podatkovne vrstice — dokler ima druga celica vrednost,
 * ker vsaka podatkovna vrstica tam nosi število, opomba pod tabelo pa ne.
 */
function tabela(list, naslov, glava) {
  const vse = vrstice(list);
  const zacetek = vse.findIndex((v) => v[0] === naslov);
  assert.notEqual(zacetek, -1, `Na listu "${list.getName()}" ni tabele "${naslov}".`);
  assert.deepEqual(vse[zacetek + 1].slice(0, glava.length), glava, `Glava tabele "${naslov}"`);
  const podatki = [];
  for (let r = zacetek + 2; r < vse.length && vse[r][1] !== ''; r++) {
    podatki.push(vse[r].slice(0, glava.length));
  }
  return podatki;
}

const jeDatum = (vrednost) => vrednost instanceof Date && !Number.isNaN(vrednost.getTime());

/**
 * Polje iz skripte kot polje tega procesa. Kontekst vm ima svoj Array.prototype
 * in strogi deepEqual polji z različnima prototipoma zavrne tudi ob isti vsebini.
 */
const izSkripte = (polje) => Array.from(polje);

// ─── Oddaja leada, kot jo pošlje src/lib/submitLead.ts ─────────────────────

/**
 * Glava izvoza (CSV_COLUMNS v src/lib/exportRecord.ts) — prepisana, ker je
 * datoteka TypeScript in je Node brez orodij ne uvozi. Točna množica ni
 * pomembna: skripta stolpcev NE pozna (načelo 1 v glavi Koda.gs) in vsako ime
 * zapiše po imenu; pomembno je le, da so tu vsa iz VRSTNI_RED.
 */
const STOLPCI_IZVOZA = [
  'timestampISO', 'segment', 'industry', 'industryLabel', 'sizeClass', 'employeeCount',
  'companyName', 'email', 'gdprConsent', 'directLossEUR', 'capacityEUR', 'capacityHoursPerMonth',
  'oneTimeCapitalEUR', 'riskCount', 'risks', 'selectedModules', 'triageScores', 'moduleInputsJson',
  'followUpSequence', 'utmSource', 'potentialMinEUR', 'potentialMaxEUR', 'confidence', 'businessType',
  'currentSystem', 'role', 'operationalHourCostEUR', 'adminHourCostEUR', 'hourCostsEstimated',
  'firstName', 'lastName', 'phone', 'taxNumber', 'consentOffers', 'consentContent', 'lostMarginEUR',
  'roleOther', 'operationalHourSource', 'adminHourSource', 'consentConsulting', 'annualRevenueEUR',
  'annualRevenueSource',
];

/** Vrednosti vrstice so vse NIZI — tako jih pretvori buildRowValues v aplikaciji. */
const LEAD = {
  timestampISO: '2026-09-05T08:12:00.000Z',
  segment: 'proizvodnja',
  industry: 'proizvodnja-kovine',
  industryLabel: 'Proizvodnja — kovine',
  sizeClass: '20-49',
  employeeCount: '45',
  companyName: 'Kovinar d.o.o.',
  email: 'ana@kovinar.si',
  gdprConsent: 'true',
  directLossEUR: '12000',
  capacityEUR: '5000',
  capacityHoursPerMonth: '40',
  oneTimeCapitalEUR: '30000',
  riskCount: '2',
  risks: 'Zaloge: visoko; Načrtovanje: srednje',
  selectedModules: 'zaloge, nacrtovanje',
  triageScores: '{"zaloge":3,"nacrtovanje":2}',
  moduleInputsJson: '{"zaloge":{"vrednostZalog":120000}}',
  followUpSequence: 'proizvodnja-visoko',
  utmSource: 'linkedin',
  potentialMinEUR: '15000',
  potentialMaxEUR: '15000',
  confidence: 'high',
  businessType: 'd.o.o.',
  currentSystem: 'excel',
  role: 'direktor',
  operationalHourCostEUR: '28',
  adminHourCostEUR: '22',
  hourCostsEstimated: 'false',
  firstName: 'Ana',
  lastName: 'Novak',
  phone: '+386 41 123 456',
  taxNumber: '01234567',
  consentOffers: 'true',
  consentContent: 'false',
  lostMarginEUR: '8000',
  roleOther: '',
  operationalHourSource: 'entered',
  adminHourSource: 'average',
  consentConsulting: 'true',
  annualRevenueEUR: '2500000',
  annualRevenueSource: 'entered',
};

/**
 * Prilogi, kot ju sestavi `buildAttachments` v src/lib/deliverLead.ts: najprej
 * strankino poročilo, nato priprava — vsaka s svojo oznako občinstva.
 */
const PDF = (besedilo) => Buffer.from(`%PDF-1.4 ${besedilo}`).toString('base64');
function prilogi() {
  return [
    {
      filename: 'datalab-analiza-skritih-stroskov-kovinar-doo-2026-09-05.pdf',
      contentType: 'application/pdf',
      base64: PDF('poročilo za stranko'),
      audience: 'customer',
    },
    {
      filename: 'datalab-priprava-na-pogovor-kovinar-doo-2026-09-05.pdf',
      contentType: 'application/pdf',
      base64: PDF('priprava na pogovor'),
      audience: 'sales',
    },
  ];
}

/**
 * Telo oddaje: `record` za rezervno pot in `sheet` z glavo ter vrstico;
 * `dodatki` (npr. `attachments`) gredo zraven nespremenjeni.
 */
function oddaja(lead, dodatki = {}) {
  return {
    ...dodatki,
    record: {
      timestampISO: lead.timestampISO,
      segment: lead.segment,
      industryLabel: lead.industryLabel,
      sizeClass: lead.sizeClass,
      employeeCount: lead.employeeCount,
      companyName: lead.companyName,
      email: lead.email,
      firstName: lead.firstName,
      lastName: lead.lastName,
      phone: lead.phone,
      consentConsulting: lead.consentConsulting,
    },
    sheet: { columns: STOLPCI_IZVOZA, row: STOLPCI_IZVOZA.map((ime) => lead[ime]) },
  };
}

// ─── Dogodki lijaka, kot jih pošlje src/lib/funnel.ts (FunnelEnvelope) ─────

const ZACETEK_OBISKA = Date.UTC(2026, 8, 5, 8, 0, 0);
/** "Korak N od M" na zaslonu: industry 1 … results 9 pri dveh straneh vnosov. */
const KORAKOV = 9;

const obisk = (id, { device = 'desktop', utmSource = '', internal = false } = {}) => ({
  id,
  startedAt: new Date(ZACETEK_OBISKA).toISOString(),
  device,
  utmSource,
  internal,
});

/** `lm10_step_view`, kot ga pošlje CalculatorFlow (trackStepView). */
const prikaz = (korak, indeks, segment, podrocje) => [
  'lm10_step_view',
  {
    step: korak,
    segment,
    stepIndex: indeks,
    stepsTotal: KORAKOV,
    ...(podrocje ? { moduleId: podrocje } : {}),
  },
];

/**
 * Dogodki enega obiska ([sekunde od začetka, dogodek, lastnosti]) kot paketi po
 * žici: `seq` teče čez ves obisk, `t` je čas na napravi; `naPaket` obisk razdeli
 * na več paketov, kot to dela vrsta v brskalniku.
 */
function paketi(kdo, dogodki, naPaket = dogodki.length) {
  const zica = dogodki.map(([sekunde, event, props], i) => ({
    seq: i + 1,
    t: new Date(ZACETEK_OBISKA + sekunde * 1000).toISOString(),
    event,
    props: props ?? {},
  }));
  const rezultat = [];
  for (let i = 0; i < zica.length; i += naPaket) {
    rezultat.push({ visit: kdo, events: zica.slice(i, i + naPaket) });
  }
  return rezultat;
}

/**
 * Sedem značilnih obiskov; v vrstnem redu, v katerem gredo paketi na webhook.
 * Segment `proizvodnja` ima korake industry(1) → employeeCount(2) → context(3) →
 * triage(4) → costBasis(5) → inputs/zaloge(6) → inputs/nacrtovanje(7) →
 * emailGate(8) → results(9).
 */
function obiskiZaLijak() {
  const P = 'proizvodnja';
  const L = 'logistika';

  // Poln tok. Med drugo stranjo vnosov in obrazcem 40 minut (pozabljen zavihek) —
  // ta čas v mediano ne sme. Blokada na e-naslovu, nato oddaja, dostava, prenos.
  // V DVEH paketih, poslanih V NAPAČNEM VRSTNEM REDU: obisk se sestavi po `seq`.
  const poln = paketi(
    obisk('obisk-poln', { utmSource: 'linkedin' }),
    [
      [0, ...prikaz('industry', 1, P)],
      [0, 'lm10_industry_selected', { industry: 'proizvodnja-kovine', segment: P }],
      [10, ...prikaz('employeeCount', 2, P)],
      [20, ...prikaz('context', 3, P)],
      [35, ...prikaz('triage', 4, P)],
      [60, 'lm10_triage_done', { segment: P, selectedAreas: 2 }],
      [60, ...prikaz('costBasis', 5, P)],
      [80, 'lm10_cost_basis_done', { operational: 'entered', admin: 'average' }],
      [80, ...prikaz('inputs', 6, P, 'zaloge')],
      [110, ...prikaz('inputs', 7, P, 'nacrtovanje')],
      [2510, 'lm10_email_gate_view', { segment: P }],
      [2510, ...prikaz('emailGate', 8, P)],
      [2520, 'lm10_form_blocked', { field: 'email' }],
      [2530, 'lm10_lead_submitted', { segment: P, consulting: 'da' }],
      [2540, 'lm10_delivery_ok', {}],
      [2540, ...prikaz('results', 9, P)],
      [2540, 'lm10_results_view', { segment: P, confidence: 'high', measuredAreas: 2, offeredAreas: 5 }],
      [2600, 'lm10_report_download', { segment: P }],
    ],
    9,
  );

  // Odnehanje na triaži.
  const triaza = paketi(obisk('obisk-triaza', { device: 'mobile' }), [
    [0, ...prikaz('industry', 1, P)],
    [0, 'lm10_industry_selected', { industry: 'proizvodnja-kovine', segment: P }],
    [20, ...prikaz('employeeCount', 2, P)],
    [40, ...prikaz('context', 3, P)],
    [60, ...prikaz('triage', 4, P)],
  ]);

  // Odnehanje na prvi strani vnosov, drug segment.
  const vnosi = paketi(obisk('obisk-vnosi', { utmSource: 'linkedin' }), [
    [0, ...prikaz('industry', 1, L)],
    [0, 'lm10_industry_selected', { industry: 'logistika-transport', segment: L }],
    [30, ...prikaz('employeeCount', 2, L)],
    [50, ...prikaz('context', 3, L)],
    [70, ...prikaz('triage', 4, L)],
    [100, 'lm10_triage_done', { segment: L, selectedAreas: 1 }],
    [100, ...prikaz('costBasis', 5, L)],
    [120, 'lm10_cost_basis_done', { operational: 'average', admin: 'average' }],
    [120, ...prikaz('inputs', 6, L, 'vozni-park')],
  ]);

  // Obisk s kampanjske povezave /proizvodnja/: uvodnega zaslona ni, dejavnost
  // pošlje aplikacija pred prvim prikazom z izvorom 'link'. Je nov obisk, ne
  // nadaljevanje, čeprav se prav tako ne začne na uvodnem koraku. Odneha na kontekstu.
  const povezava = paketi(obisk('obisk-povezava', { utmSource: 'linkedin' }), [
    [0, 'lm10_industry_selected', { industry: 'proizvodnja', segment: P, source: 'link' }],
    [0, ...prikaz('employeeCount', 2, P)],
    [15, ...prikaz('context', 3, P)],
  ]);

  // Nadaljevanje po osvežitvi: prvi prikazani korak ni uvodni. Odda, dostava pade.
  const nadaljevanje = paketi(obisk('obisk-nadaljevanje', { device: 'mobile', utmSource: 'google' }), [
    [0, ...prikaz('inputs', 6, P, 'zaloge')],
    [30, ...prikaz('inputs', 7, P, 'nacrtovanje')],
    [60, 'lm10_email_gate_view', { segment: P }],
    [60, ...prikaz('emailGate', 8, P)],
    [90, 'lm10_lead_submitted', { segment: P, consulting: 'ne' }],
    [91, 'lm10_delivery_failed', { reason: 'rejected' }],
    [91, ...prikaz('results', 9, P)],
    [91, 'lm10_results_view', { segment: P, confidence: 'medium', measuredAreas: 2, offeredAreas: 5 }],
    [120, 'lm10_report_download', { segment: P }],
  ]);

  // Interni obisk (?debug=1): poln tok z oddajo, blokado in prenosom — nič od
  // tega ne sme v povzetek.
  const interni = paketi(obisk('obisk-interni', { internal: true }), [
    [0, ...prikaz('industry', 1, P)],
    [5, ...prikaz('employeeCount', 2, P)],
    [10, ...prikaz('context', 3, P)],
    [15, ...prikaz('triage', 4, P)],
    [20, ...prikaz('costBasis', 5, P)],
    [25, ...prikaz('inputs', 6, P, 'zaloge')],
    [30, ...prikaz('emailGate', 8, P)],
    [31, 'lm10_form_blocked', { field: 'taxNumber' }],
    [35, 'lm10_lead_submitted', { segment: P, consulting: 'ne' }],
    [36, 'lm10_delivery_ok', {}],
    [36, ...prikaz('results', 9, P)],
    [40, 'lm10_report_download', { segment: P }],
  ]);

  // Blokada obrazca: dvakrat e-naslov, enkrat telefon, potem odneha.
  const blokada = paketi(obisk('obisk-blokada', { device: 'mobile', utmSource: 'google' }), [
    [0, ...prikaz('industry', 1, P)],
    [0, 'lm10_industry_selected', { industry: 'proizvodnja-kovine', segment: P }],
    [40, ...prikaz('employeeCount', 2, P)],
    [60, ...prikaz('context', 3, P)],
    [80, ...prikaz('triage', 4, P)],
    [100, 'lm10_triage_done', { segment: P, selectedAreas: 2 }],
    [100, ...prikaz('costBasis', 5, P)],
    [120, 'lm10_cost_basis_done', { operational: 'entered', admin: 'entered' }],
    [120, ...prikaz('inputs', 6, P, 'zaloge')],
    [140, ...prikaz('inputs', 7, P, 'nacrtovanje')],
    [160, 'lm10_email_gate_view', { segment: P }],
    [160, ...prikaz('emailGate', 8, P)],
    [170, 'lm10_form_blocked', { field: 'email' }],
    [180, 'lm10_form_blocked', { field: 'email' }],
    [190, 'lm10_form_blocked', { field: 'phone' }],
  ]);

  return [poln[1], poln[0], ...triaza, ...vnosi, ...povezava, ...nadaljevanje, ...interni, ...blokada];
}

// ═══════════════════════════════════════════════════════════════════════════
// Preizkusi
// ═══════════════════════════════════════════════════════════════════════════

test('ponaredek: setValues preveri obliko obsega, oblike ne premaknejo getLastRow', () => {
  const { preglednica, globali } = ustvariGoogle();
  const list = preglednica.insertSheet('Poskus');

  assert.throws(() => list.getRange(1, 1, 2, 2).setValues([[1, 2]]), /obseg ima 2 vrstic, podanih je 1/);
  assert.throws(() => list.getRange(1, 1, 1, 2).setValues([[1, 2, 3]]), /obseg ima 2 stolpcev, vrstica 1 jih ima 3/);
  assert.equal(list.getLastRow(), 0, 'padel setValues ne sme zapisati ničesar');

  list.getRange(1, 1, 2, 2).setValues([
    ['a', 'b'],
    ['c', 'd'],
  ]);
  list.getRange(50, 1).setNumberFormat('@').setFontWeight('bold');
  list.getRange(60, 2).setDataValidation(globali.SpreadsheetApp.newDataValidation().requireCheckbox().build());
  list.getRange(2, 1, 70, 2).setBackground('#fff');
  assert.equal(list.getLastRow(), 2, 'oblika brez vsebine ne šteje');
  assert.equal(list.getLastColumn(), 2);

  list.appendRow(['e', 'f']);
  assert.equal(list.getLastRow(), 3, 'appendRow pristane tik pod vsebino, ne pod oblikami');

  assert.throws(() => list.getRange(1, 27), /čez rob lista/);
  list.insertColumnsAfter(26, 4);
  assert.equal(list.getRange(1, 30).getValue(), '');
});

test('doPost z record + sheet zapiše lead na list Leadi z izpeljanima stolpcema', () => {
  const { skripta, preglednica, dnevnik } = naloziSkripto();

  // Brez prilog stranki ni kaj poslati: odgovor to pove, aplikacija ponudi prenos.
  assert.deepEqual(post(skripta, oddaja(LEAD)), {
    ok: true,
    customerReport: { sent: false, reason: 'no_attachment' },
  });

  const leadi = preglednica.getSheetByName('Leadi');
  assert.ok(leadi, 'list Leadi nastane sam');
  assert.equal(leadi.getLastRow(), 2);
  assert.equal(leadi.getFrozenRows(), 1);

  // Glava: najprej VRSTNI_RED (vsa imena so v oddaji ali jih doda skripta), nato
  // preostala imena v vrstnem redu iz aplikacije. Nobeno ime dvakrat.
  const glava = vrstice(leadi)[0];
  const vrstniRed = izSkripte(skripta.VRSTNI_RED);
  assert.deepEqual(glava.slice(0, vrstniRed.length), vrstniRed);
  assert.deepEqual(glava.slice(vrstniRed.length), [
    'timestampISO', 'segment', 'industry', 'sizeClass', 'gdprConsent', 'riskCount', 'triageScores',
    'moduleInputsJson', 'potentialMaxEUR', 'hourCostsEstimated', 'operationalHourSource',
    'adminHourSource', 'consentConsulting', 'annualRevenueSource',
  ]);
  assert.equal(new Set(glava).size, glava.length, 'v glavi ni podvojenih imen');
  assert.ok(leadi.getMaxColumns() >= glava.length, 'list je razširjen na širino glave');

  // Vrstica se piše po imenih; vrednosti gredo skozi zaCelico.
  const v = poImenih(leadi, 2);
  assert.ok(jeDatum(v.prejeto), 'prejeto je čas prejema');
  assert.equal(v.prodajnaPriprava, '', 'brez salesReportHtml ni povezave');
  assert.equal(v.firstName, 'Ana');
  assert.equal(v.companyName, 'Kovinar d.o.o.');
  assert.equal(v.email, 'ana@kovinar.si');
  assert.equal(v.employeeCount, 45, 'čisto število postane število');
  assert.equal(v.annualRevenueEUR, 2500000);
  assert.equal(v.phone, "'+386 41 123 456", 'vodilni + bi bil formula — zaklenjen z opuščajem');
  assert.equal(v.taxNumber, "'01234567", 'vodilna ničla se ohrani');
  assert.equal(v.sizeClass, "'20-49", 'začne se s števko, ni pa število');
  assert.equal(v.timestampISO, "'2026-09-05T08:12:00.000Z");
  assert.equal(v.moduleInputsJson, '{"zaloge":{"vrednostZalog":120000}}');
  assert.equal(v.consentConsulting, 'true', 'niz ostane niz — pretvorba je stvar preglednice');
  assert.equal(v.roleOther, '');

  // Izpeljanki in stolpci, ki jih aplikacija ne pošlje.
  assert.equal(v.kliciTakoj, 'DA');
  assert.equal(v.letno, 12000 + 8000 + 5000, 'odliv + nezaslužena marža + vrednost časa');
  assert.equal(v.activeCampaign, '', 'prazna celica, da ima ura kam pisati');
  assert.equal(v.porociloStranki, 'ni poslano: aplikacija ni poslala strankinega PDF-ja');
  assert.equal(v.poklicano, '');
  assert.equal(v.sestanek, '');
  assert.equal(v.opombe, '');
  assert.equal(
    leadi.oblikaCelice(2, glava.indexOf('poklicano') + 1).dataValidation?.vrsta,
    'checkbox',
    'opremiVrstico doda potrditveno polje',
  );
  assert.deepEqual(
    izSkripte(leadi.oblikaCelice(2, glava.indexOf('sestanek') + 1).dataValidation?.seznam ?? []),
    izSkripte(skripta.SESTANEK_MOZNOSTI),
  );

  // Drugi lead: brez posveta in brez zneskov; pristane pod prvim, glava ostane.
  const drugi = {
    ...LEAD,
    firstName: 'Bor',
    email: 'bor@primer.si',
    phone: '',
    consentConsulting: 'false',
    directLossEUR: '',
    lostMarginEUR: '',
    capacityEUR: '',
  };
  assert.deepEqual(post(skripta, oddaja(drugi)), {
    ok: true,
    customerReport: { sent: false, reason: 'no_attachment' },
  });
  assert.equal(leadi.getLastRow(), 3);
  assert.deepEqual(vrstice(leadi)[0], glava, 'druga oddaja glave ne spremeni');
  const v2 = poImenih(leadi, 3);
  assert.equal(v2.firstName, 'Bor');
  assert.equal(v2.phone, '');
  assert.equal(v2.kliciTakoj, '');
  assert.equal(v2.letno, 0, 'prazna polja so 0 in ne NaN');

  assert.deepEqual(dnevnik.warn, [], 'nobena stranska pot (oprema vrstice, pošta, AC) ni opozorila');
});

test('doPost s prilogama pošlje strankino poročilo na e-naslov iz oddaje — samo njen PDF, priprava nikoli', () => {
  const { skripta, preglednica, lastnosti, dnevnik, posta } = naloziSkripto();
  skripta.NASTAVITVE.E_NASLOV_ZA_OBVESTILA = 'prodaja@primer.si';

  const odgovor = post(
    skripta,
    oddaja({ ...LEAD, companyName: 'Kovinar <b>d.o.o.</b>' }, { attachments: prilogi() }),
  );
  assert.deepEqual(odgovor, { ok: true, customerReport: { sent: true } });

  // Najprej stranka, nato prodaja: obvestilo prodaji izid stranke že pozna.
  assert.equal(posta.length, 2);
  const [stranki, prodaji] = posta;

  assert.equal(stranki.to, 'ana@kovinar.si');
  assert.equal(stranki.name, 'Datalab');
  assert.equal(stranki.replyTo, 'prodaja@datalab.si');
  assert.equal(stranki.subject, 'Analiza skritih stroškov — Kovinar <b>d.o.o.</b>');
  assert.equal(stranki.attachments.length, 1, 'stranka dobi natanko eno prilogo');
  assert.match(stranki.attachments[0].getName(), /^datalab-analiza-skritih-stroskov/);
  assert.equal(stranki.attachments[0].getContentType(), 'application/pdf');
  assert.equal(Buffer.from(stranki.attachments[0].getBytes()).toString(), '%PDF-1.4 poročilo za stranko');
  assert.ok(!JSON.stringify(stranki).includes('priprava'), 'priprave stranka ne sme videti nikjer');
  assert.match(stranki.body, /^Pozdravljeni, Ana,/);
  assert.match(stranki.body, /Označili ste, da želite pogovor s svetovalcem/);
  assert.match(stranki.body, /01 252 89 50/);
  assert.ok(!stranki.htmlBody.includes('<b>d.o.o.</b>'), 'vrednosti z webhooka so v HTML ubežane');
  assert.ok(stranki.htmlBody.includes('Kovinar &lt;b&gt;d.o.o.&lt;/b&gt;'));

  assert.equal(prodaji.to, 'prodaja@primer.si');
  assert.equal(prodaji.attachments.length, 2, 'prodaja dobi oba PDF-ja');
  assert.match(prodaji.body, /Poročilo stranki: poslano na ana@kovinar\.si/);

  // Sled: vrstica, lastnosti (zakrit naslov, ker je doGet javen), brez opozoril.
  const v = poImenih(preglednica.getSheetByName('Leadi'), 2);
  assert.match(String(v.porociloStranki), /^poslano \d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  assert.match(lastnosti.get('ZADNJA_POSTA_STRANKI'), /→ a\*\*\*@kovinar\.si$/);
  assert.equal(lastnosti.has('ZADNJA_NAPAKA_POSTE_STRANKI'), false);
  assert.match(skripta.doGet().getContent(), /Zadnje poročilo stranki: .*a\*\*\*@kovinar\.si/);
  assert.deepEqual(dnevnik.warn, []);
});

test('stara aplikacija brez oznake občinstva: strankino poročilo se prepozna po imenu datoteke', () => {
  const { skripta, posta } = naloziSkripto();
  const brezOznake = prilogi().map(({ audience: _audience, ...vnos }) => vnos);

  assert.deepEqual(post(skripta, oddaja(LEAD, { attachments: brezOznake })), {
    ok: true,
    customerReport: { sent: true },
  });
  assert.equal(posta.length, 1, 'brez naslova prodaje gre samo pošta stranki');
  assert.equal(posta[0].to, 'ana@kovinar.si');
  assert.deepEqual(
    izSkripte(posta[0].attachments).map((priloga) => priloga.getName()),
    ['datalab-analiza-skritih-stroskov-kovinar-doo-2026-09-05.pdf'],
  );
});

test('oznaka občinstva prevlada nad imenom: priprava se stranki ne pošlje, tudi če je poimenovana kot poročilo', () => {
  const { skripta, posta } = naloziSkripto();
  const [, priprava] = prilogi();
  const zamaskirana = { ...priprava, filename: 'datalab-analiza-skritih-stroskov-kovinar.pdf' };

  assert.deepEqual(post(skripta, oddaja(LEAD, { attachments: [zamaskirana] })), {
    ok: true,
    customerReport: { sent: false, reason: 'no_attachment' },
  });
  assert.equal(posta.length, 0);
});

test('brez e-naslova ali z neveljavnim: poročilo ne gre, vrstica in obvestilo prodaji ostaneta', () => {
  const { skripta, preglednica, posta } = naloziSkripto();
  skripta.NASTAVITVE.E_NASLOV_ZA_OBVESTILA = 'prodaja@primer.si';

  assert.deepEqual(post(skripta, oddaja({ ...LEAD, email: '' }, { attachments: prilogi() })), {
    ok: true,
    customerReport: { sent: false, reason: 'no_address' },
  });
  assert.deepEqual(post(skripta, oddaja({ ...LEAD, email: 'ana@' }, { attachments: prilogi() })), {
    ok: true,
    customerReport: { sent: false, reason: 'invalid_address' },
  });

  const leadi = preglednica.getSheetByName('Leadi');
  assert.equal(leadi.getLastRow(), 3, 'obe vrstici sta zapisani');
  assert.equal(poImenih(leadi, 2).porociloStranki, 'ni poslano: v oddaji ni e-naslova');
  assert.equal(poImenih(leadi, 3).porociloStranki, 'ni poslano: e-naslov ni videti veljaven');
  assert.equal(posta.length, 2, 'samo obvestili prodaji');
  assert.ok(posta.every((sporocilo) => sporocilo.to === 'prodaja@primer.si'));
  assert.match(posta[0].body, /Poročilo stranki: NI poslano \(v oddaji ni e-naslova\)/);
});

test('padla pošta stranki ne ustavi ne vrstice ne obvestila prodaji', () => {
  const { skripta, preglednica, lastnosti, dnevnik, posta } = naloziSkripto();
  skripta.NASTAVITVE.E_NASLOV_ZA_OBVESTILA = 'prodaja@primer.si';
  const pravi = skripta.MailApp.sendEmail;
  let prvi = true;
  skripta.MailApp.sendEmail = (sporocilo) => {
    if (prvi) {
      prvi = false;
      throw new Error('Service invoked too many times for one day: email');
    }
    pravi(sporocilo);
  };

  assert.deepEqual(post(skripta, oddaja(LEAD, { attachments: prilogi() })), {
    ok: true,
    customerReport: { sent: false, reason: 'send_failed' },
  });
  const leadi = preglednica.getSheetByName('Leadi');
  assert.equal(leadi.getLastRow(), 2);
  assert.equal(poImenih(leadi, 2).porociloStranki, 'ni poslano: pošiljanje je vrglo napako');
  assert.equal(posta.length, 1, 'obvestilo prodaji je šlo kljub temu');
  assert.match(posta[0].body, /Poročilo stranki: NI poslano \(pošiljanje je vrglo napako\)/);
  assert.match(lastnosti.get('ZADNJA_NAPAKA_POSTE_STRANKI'), /too many times/);
  assert.equal(dnevnik.warn.length, 1);
  assert.match(dnevnik.warn[0], /Poročila stranki ni bilo mogoče poslati/);
});

test('POSLJI_POROCILO_STRANKI: false — stranki nič, odgovor pove razlog', () => {
  const { skripta, posta } = naloziSkripto();
  skripta.NASTAVITVE.POSLJI_POROCILO_STRANKI = false;

  assert.deepEqual(post(skripta, oddaja(LEAD, { attachments: prilogi() })), {
    ok: true,
    customerReport: { sent: false, reason: 'disabled' },
  });
  assert.equal(posta.length, 0);
});

test('preizkusPorocilaStranki pošlje vzorec na prvi naslov prodaje in zahteva vpisan naslov', () => {
  const { skripta, posta } = naloziSkripto();
  assert.throws(() => skripta.preizkusPorocilaStranki(), /E_NASLOV_ZA_OBVESTILA je prazen/);

  skripta.NASTAVITVE.E_NASLOV_ZA_OBVESTILA = 'prodaja@primer.si, jan@primer.si';
  skripta.preizkusPorocilaStranki();
  assert.equal(posta.length, 1);
  assert.equal(posta[0].to, 'prodaja@primer.si');
  assert.equal(posta[0].attachments.length, 1);
  assert.match(Buffer.from(posta[0].attachments[0].getBytes()).toString(), /^%PDF-1\.1/);
});

test('doPost z events + visit pripne dogodke na list Dogodki', () => {
  const { skripta, preglednica, dnevnik } = naloziSkripto();
  const P = 'proizvodnja';
  const kdo = obisk('obisk-1', { utmSource: 'linkedin' });

  const [prvi, drugi] = paketi(
    kdo,
    [
      [0, ...prikaz('industry', 1, P)],
      [0, 'lm10_industry_selected', { industry: 'proizvodnja-kovine', segment: P }],
      [12, ...prikaz('employeeCount', 2, P)],
      [40, ...prikaz('inputs', 6, P, 'zaloge')],
      [55, 'lm10_form_blocked', { field: 'email', attempt: 2 }],
    ],
    3,
  );

  assert.deepEqual(post(skripta, prvi), { ok: true, events: 3 });

  const dogodki = preglednica.getSheetByName('Dogodki');
  assert.ok(dogodki, 'list Dogodki nastane sam');
  assert.equal(dogodki.getFrozenRows(), 1);
  const vse = vrstice(dogodki);
  assert.deepEqual(vse[0], izSkripte(skripta.DOGODKI_GLAVA));
  assert.equal(vse.length, 4);

  const cas = (sekunde) => new Date(ZACETEK_OBISKA + sekunde * 1000).toISOString();
  const brezPrejema = (vrstica) => {
    assert.ok(jeDatum(vrstica[0]), 'prejeto je čas prejema');
    return vrstica.slice(1).map((celica) => (celica instanceof Date ? celica.toISOString() : celica));
  };
  // obisk, zaporedje, cas, dogodek, korak, indeksKoraka, korakovSkupaj, podrocje,
  // segment, naprava, vir, interni, lastnosti
  assert.deepEqual(brezPrejema(vse[1]), [
    'obisk-1', 1, cas(0), 'lm10_step_view', 'industry', 1, 9, '', P, 'desktop', 'linkedin', false, '',
  ]);
  assert.deepEqual(brezPrejema(vse[2]), [
    'obisk-1', 2, cas(0), 'lm10_industry_selected', '', '', '', '', P, 'desktop', 'linkedin', false,
    '{"industry":"proizvodnja-kovine"}',
  ]);
  assert.deepEqual(brezPrejema(vse[3]), [
    'obisk-1', 3, cas(12), 'lm10_step_view', 'employeeCount', 2, 9, '', P, 'desktop', 'linkedin', false, '',
  ]);

  // Drugi paket istega obiska pristane pod prvim; področje vnosov v svoj stolpec,
  // neznane lastnosti v JSON.
  assert.deepEqual(post(skripta, drugi), { ok: true, events: 2 });
  assert.equal(dogodki.getLastRow(), 6);
  const [, , , , stran, blokada] = vrstice(dogodki);
  assert.deepEqual(brezPrejema(stran), [
    'obisk-1', 4, cas(40), 'lm10_step_view', 'inputs', 6, 9, 'zaloge', P, 'desktop', 'linkedin', false, '',
  ]);
  assert.deepEqual(brezPrejema(blokada), [
    'obisk-1', 5, cas(55), 'lm10_form_blocked', '', '', '', '', '', 'desktop', 'linkedin', false,
    '{"field":"email","attempt":2}',
  ]);

  assert.equal(preglednica.getSheetByName('Leadi'), null, 'dogodki se lista Leadi ne dotaknejo');
  assert.deepEqual(dnevnik.warn, []);
});

test('sestaviLijak iz sedmih obiskov sestavi list Lijak s pravimi števili', () => {
  const { skripta, preglednica, lastnosti, dnevnik } = naloziSkripto();

  obiskiZaLijak().forEach((paket) => post(skripta, paket));
  const dogodki = preglednica.getSheetByName('Dogodki');
  const vrsticDogodkov = dogodki.getLastRow();

  const izid = skripta.sestaviLijak();
  assert.equal(izid, 'Lijak sestavljen: 5 začetih obiskov, 1 nadaljevanj, 1 izpuščenih, 1 oddaj.');
  assert.ok(lastnosti.get('LIJAK_ZADNJI').endsWith(' — ' + izid), 'izid je viden v doGet');
  assert.equal(dogodki.getLastRow(), vrsticDogodkov, 'brez DOGODKI_HRANI_DNI se dogodki ne brišejo');

  const lijak = preglednica.getSheetByName('Lijak');
  assert.ok(lijak, 'list Lijak nastane sam');
  assert.match(lijak.getRange('A2').getValue(), /Obdobje: vsi dogodki/);

  // Kartice: začetih so obiski z uvodnega koraka in obisk s povezave (brez
  // nadaljevanja in internega); prenosov štejeta poln obisk in nadaljevanje, interni ne.
  assert.deepEqual(lijak.getRange(4, 1, 2, 10).getValues(), [
    ['ZAČETIH OBISKOV', '', 'DO OBRAZCA', '', 'ODDAJ', '', 'DELEŽ ODDAJ', '', 'PRENOSOV POROČILA', ''],
    [5, '', 2, '', 1, '', 0.2, '', 2, ''],
  ]);

  // Lijak čez vse segmente: obiskov, delež začetnih, končalo tu, odpad, mediana
  // časa v sekundah. Mediana šteje samo obiske, ki so šli naprej; 40 minut med
  // vnosi in obrazcem pri polnem obisku je izpuščenih. Uvodni zaslon je pod
  // sto odstotki: obisk s povezave ga ni videl, začetih pa šteje.
  const glavaLijaka = ['Korak', 'Obiskov', 'Delež začetnih', 'Končalo tu', 'Odpad', 'Mediana časa'];
  assert.deepEqual(tabela(lijak, 'LIJAK — VSI SEGMENTI', glavaLijaka), [
    ['Dejavnost (uvod)', 4, 0.8, 0, 0, 25],
    ['Zaposleni', 5, 1, 0, 0, 20],
    ['Nekaj o vas (kontekst)', 5, 1, 1, 0.2, 20],
    ['Triaža področij', 4, 0.8, 1, 0.25, 25],
    ['Stroškovna osnova', 3, 0.6, 0, 0, 20],
    ['Vnosi (vse strani skupaj)', 3, 0.6, 1, 1 / 3, 35],
    ['      · vozni-park', 1, 0.2, 1, 1, ''],
    ['      · zaloge', 2, 0.4, 0, 0, 25],
    ['      · nacrtovanje', 2, 0.4, 0, 0, 20],
    ['Obrazec s kontaktom', 2, 0.4, 1, 0.5, 30],
    ['Rezultati', 1, 0.2, 1, 1, ''],
  ]);

  // Podatki za graf desno: korak in obiskov, v vrstnem redu toka.
  assert.equal(lijak.getRange(4, 14).getValue(), 'PODATKI ZA GRAF — ne brišite');
  assert.deepEqual(lijak.getRange(5, 14, 8, 2).getValues(), [
    ['Dejavnost (uvod)', 4],
    ['Zaposleni', 5],
    ['Nekaj o vas (kontekst)', 5],
    ['Triaža področij', 4],
    ['Stroškovna osnova', 3],
    ['Vnosi (vse strani skupaj)', 3],
    ['Obrazec s kontaktom', 2],
    ['Rezultati', 1],
  ]);
  assert.equal(lijak.getCharts().length, 1);

  // Po segmentih: največji najprej; logistika ima en sam obisk, ki obtiči na vnosih.
  const proizvodnja = tabela(lijak, 'LIJAK — PROIZVODNJA (4 obiskov)', glavaLijaka);
  assert.deepEqual(proizvodnja.find((v) => v[0] === 'Triaža področij').slice(1, 4), [3, 0.75, 1]);
  assert.deepEqual(proizvodnja.find((v) => v[0] === 'Rezultati'), ['Rezultati', 1, 0.25, 1, 1, '']);
  const logistika = tabela(lijak, 'LIJAK — LOGISTIKA (1 obiskov)', glavaLijaka);
  assert.deepEqual(logistika.find((v) => v[0] === 'Vnosi (vse strani skupaj)'), [
    'Vnosi (vse strani skupaj)', 1, 1, 1, 1, '',
  ]);
  assert.ok(
    vrstice(lijak).findIndex((v) => v[0].startsWith?.('LIJAK — PROIZVODNJA')) <
      vrstice(lijak).findIndex((v) => v[0].startsWith?.('LIJAK — LOGISTIKA')),
    'večji segment je pred manjšim',
  );

  const glavaSkupin = ['', 'Začetih', 'Do obrazca', 'Oddaj', 'Delež oddaj'];
  assert.deepEqual(tabela(lijak, 'PO SEGMENTIH', glavaSkupin), [
    ['proizvodnja', 4, 2, 1, 0.25],
    ['logistika', 1, 0, 0, 0],
  ]);
  assert.deepEqual(tabela(lijak, 'PO VIRU OBISKA (utm_source)', glavaSkupin), [
    ['linkedin', 3, 1, 1, 1 / 3],
    ['(brez)', 1, 0, 0, 0],
    ['google', 1, 1, 0, 0],
  ]);
  assert.deepEqual(tabela(lijak, 'PO ZASLONU', glavaSkupin), [
    ['desktop', 3, 1, 1, 1 / 3],
    ['mobile', 2, 1, 0, 0],
  ]);

  // Blokade po polju: kolikokrat in koliko obiskov. Interni obisk (taxNumber) ne šteje.
  assert.deepEqual(tabela(lijak, 'OBRAZEC — KATERO POLJE USTAVI ODDAJO', ['Polje', 'Blokad', 'Obiskov']), [
    ['email', 3, 2],
    ['phone', 1, 1],
  ]);

  // Dostava: poln obisk uspel, nadaljevanje padlo; interni ne šteje.
  assert.deepEqual(tabela(lijak, 'DOSTAVA LEADA (webhook)', ['Izid', 'Obiskov']), [
    ['dostava uspela', 1],
    ['padla: rejected', 1],
  ]);

  // Nadaljevanja posebej, obisk s povezave med začetimi, interni izpuščen.
  assert.deepEqual(tabela(lijak, 'NADALJEVANJA IN IZPUŠČENI OBISKI', ['', 'Obiskov']), [
    ['Nadaljevanja po osvežitvi (prvi korak ni uvodni)', 1],
    ['   … od tega oddaj', 1],
    ['Začeli s povezavo /dejavnost (uvodni zaslon preskočen, štejejo kot začeti)', 1],
    ['Izpuščeni: interni način (?debug=1) ali brez prikaza koraka', 1],
  ]);

  // Po dnevih: 30 vrstic z datumom; vsi obiski so prejeti danes, zato je vsota
  // začetih 5 in oddaj 1 (katera vrstica je „danes", je odvisno od ure zagona).
  const poDnevih = tabela(lijak, 'PO DNEVIH — zadnjih 30 dni', ['Dan', 'Začetih', 'Oddaj']);
  assert.equal(poDnevih.length, 30);
  assert.ok(poDnevih.every((v) => jeDatum(v[0])));
  assert.equal(poDnevih.reduce((n, v) => n + v[1], 0), 5);
  assert.equal(poDnevih.reduce((n, v) => n + v[2], 0), 1);

  // Ponovni zagon list sestavi na novo: en graf in ena zaščita, ne dva sloja.
  assert.equal(skripta.sestaviLijak(), izid);
  assert.equal(lijak.getCharts().length, 1);
  assert.equal(lijak.getProtections('SHEET').length, 1);

  assert.deepEqual(dnevnik.warn, []);
});

test('paket brez id-ja obiska vrže napako in ne pusti sledi', () => {
  const { skripta, preglednica } = naloziSkripto();
  const dogodki = [{ seq: 1, t: new Date(ZACETEK_OBISKA).toISOString(), event: 'lm10_step_view', props: {} }];

  assert.throws(
    () => post(skripta, { visit: { ...obisk('brez-id'), id: '' }, events: dogodki }),
    /Paket dogodkov je brez obiska ali brez dogodkov/,
  );
  assert.throws(
    () => post(skripta, { visit: { startedAt: '2026-09-05T08:00:00.000Z', device: 'desktop' }, events: dogodki }),
    /brez obiska ali brez dogodkov/,
  );
  assert.throws(() => post(skripta, { visit: obisk('prazen'), events: [] }), /brez obiska ali brez dogodkov/);
  assert.equal(preglednica.getSheetByName('Dogodki'), null, 'zavrnjen paket lista ne ustvari');

  // Telo brez `record` in brez `events` je še vedno napaka za oddaje.
  assert.throws(() => post(skripta, { sheet: { columns: ['a'], row: ['b'] } }), /V telesu ni zapisa \(record\)/);
  assert.equal(preglednica.getSheetByName('Leadi'), null);

  // Brez dogodkov tudi lijaka ni — z napako, ki pove, kaj manjka.
  assert.throws(() => skripta.sestaviLijak(), /"Dogodki" je prazen/);
});

// ═══════════════════════════════════════════════════════════════════════════
// ActiveCampaign
// ═══════════════════════════════════════════════════════════════════════════

const AC_NASLOV = 'https://primer.api-us1.com';

/**
 * ActiveCampaign kot ponarejen UrlFetchApp: vsako zahtevo zapiše v vrnjeno polje
 * in odgovori najmanj, kar skripta potrebuje. `stanjeNaSeznamu` je status, ki ga
 * AC vrne o kontaktu na seznamu 245 (null = kontakta na seznamu še ni). Kontakt
 * ima vedno id 77, oznake id "oznaka:<ime>", da so v zahtevah berljive.
 */
function ponarediAC(skripta, lastnosti, { stanjeNaSeznamu = null } = {}) {
  // S poševnico na koncu, kot jo ljudje prilepijo — skripta jo mora odrezati.
  lastnosti.set('AC_NASLOV', `${AC_NASLOV}/`);
  lastnosti.set('AC_KLJUC', 'kljuc');
  lastnosti.set('AC_SEZNAM', '245');
  lastnosti.set('AC_IDJI_POLJ', JSON.stringify({ LM10_PODJETJE: '1', LM10_PANOGA: '2', LM10_POROCILO: '3' }));

  const zahteve = [];
  const odgovor = (koda, telo) => ({
    getResponseCode: () => koda,
    getContentText: () => JSON.stringify(telo),
  });
  const odgovori = (url, moznosti) => {
    const predpona = `${AC_NASLOV}/api/3/`;
    const pot = url.startsWith(predpona) ? url.slice(predpona.length) : url;
    const telo = moznosti.payload ? JSON.parse(moznosti.payload) : null;
    zahteve.push({ url, pot, metoda: moznosti.method, zeton: moznosti.headers['Api-Token'], telo });
    if (pot === 'contact/sync') return odgovor(201, { contact: { id: '77' } });
    if (pot === 'contacts/77/contactLists') {
      return odgovor(200, {
        contactLists: stanjeNaSeznamu === null ? [] : [{ list: '245', status: stanjeNaSeznamu }],
      });
    }
    if (pot === 'contactLists') return odgovor(201, { contactList: telo.contactList });
    if (pot === 'contactTags') return odgovor(201, { contactTag: telo.contactTag });
    if (pot.startsWith('tags?')) {
      const ime = decodeURIComponent(pot.split('search=')[1]);
      return odgovor(200, { tags: [{ id: `oznaka:${ime}`, tag: ime }] });
    }
    throw new Error(`Ponaredek AC ne pozna poti ${pot}`);
  };
  skripta.UrlFetchApp = {
    fetch: odgovori,
    fetchAll: (seznam) => Array.from(seznam, (m) => odgovori(m.url, m)),
  };
  return zahteve;
}

/** Imena oznak, ki jih je skripta pripela — iz zahtev contactTags, po vrsti. */
const pripeteOznake = (zahteve) =>
  zahteve.filter((z) => z.pot === 'contactTags').map((z) => z.telo.contactTag.tag.replace(/^oznaka:/, ''));
/** Naročila na seznam (telo contactList), po vrsti. */
const naSeznam = (zahteve) => zahteve.filter((z) => z.pot === 'contactLists').map((z) => z.telo.contactList);
/** Kolikokrat je skripta pred naročilom preverila stanje kontakta na seznamu. */
const preverjanjaStanja = (zahteve) => zahteve.filter((z) => z.pot === 'contacts/77/contactLists').length;

const OZNAKE_OSNOVNE = ['LM-10', 'LM-10 panoga: Proizvodnja — kovine', 'LM-10 sekvenca: proizvodnja-visoko'];

test('AC z vroče poti: kontakt sinhroniziran, naročen na seznam, privolitev kot oznaka, id v celici', () => {
  const { skripta, preglednica, lastnosti, dnevnik } = naloziSkripto();
  const zahteve = ponarediAC(skripta, lastnosti);

  post(skripta, oddaja(LEAD));

  const leadi = preglednica.getSheetByName('Leadi');
  assert.equal(poImenih(leadi, 2).activeCampaign, '77', 'id kontakta v celici — ura je ne bo ponavljala');
  assert.match(lastnosti.get('AC_ZADNJI'), / — kontakt 77$/);
  assert.equal(lastnosti.get('AC_ZADNJA_NAPAKA'), undefined);
  assert.ok(
    zahteve.every((z) => z.url.startsWith(`${AC_NASLOV}/api/3/`) && z.zeton === 'kljuc'),
    'naslov brez podvojene poševnice, ključ v glavi vsake zahteve',
  );

  const sync = zahteve.find((z) => z.pot === 'contact/sync');
  assert.equal(sync.metoda, 'post');
  assert.deepEqual(sync.telo.contact, {
    email: 'ana@kovinar.si',
    firstName: 'Ana',
    lastName: 'Novak',
    phone: '+386 41 123 456',
    fieldValues: [
      { field: '1', value: 'Kovinar d.o.o.' },
      { field: '2', value: 'Proizvodnja — kovine' },
    ],
  });

  assert.deepEqual(naSeznam(zahteve), [{ list: '245', contact: '77', status: 1 }], 'naročen, ne odjavljen');
  assert.equal(preverjanjaStanja(zahteve), 0, 's privolitvijo stanja na seznamu ni treba preverjati');
  assert.deepEqual(pripeteOznake(zahteve), [...OZNAKE_OSNOVNE, 'LM-10 posvet', 'LM-10 privolitev: ponudbe']);
  assert.deepEqual(dnevnik.warn, []);
});

test('AC brez tržne privolitve: nov kontakt je vseeno naročen, privolitvenih oznak ni', () => {
  const { skripta, lastnosti, dnevnik } = naloziSkripto();
  const zahteve = ponarediAC(skripta, lastnosti);

  const brez = { ...LEAD, consentOffers: 'false', consentContent: 'false', consentConsulting: 'false' };
  assert.equal(skripta.posljiVAC(brez), '77');
  assert.equal(preverjanjaStanja(zahteve), 1, 'brez privolitve se pred naročilom preveri stanje na seznamu');
  assert.deepEqual(naSeznam(zahteve), [{ list: '245', contact: '77', status: 1 }]);
  assert.deepEqual(pripeteOznake(zahteve), OZNAKE_OSNOVNE);
  assert.deepEqual(dnevnik.warn, []);
});

test('AC: kdor se je sam odjavil, brez sveže privolitve ostane odjavljen — s privolitvijo je naročen znova', () => {
  const { skripta, lastnosti, dnevnik } = naloziSkripto();
  const zahteve = ponarediAC(skripta, lastnosti, { stanjeNaSeznamu: '2' });

  assert.equal(
    skripta.posljiVAC({ ...LEAD, consentOffers: 'false', consentContent: 'false' }),
    '77',
    'id se vrne — vrstica ni napaka in ura je ne ponavlja',
  );
  assert.deepEqual(naSeznam(zahteve), [], 'naročila ni');
  assert.deepEqual(pripeteOznake(zahteve), [...OZNAKE_OSNOVNE, 'LM-10 posvet'], 'oznake gredo vseeno');
  assert.ok(dnevnik.log.some((v) => v.includes('odjavil sam')));

  zahteve.length = 0;
  assert.equal(skripta.posljiVAC({ ...LEAD, consentOffers: 'false', consentContent: 'true' }), '77');
  assert.equal(preverjanjaStanja(zahteve), 0, 'privolitev v obrazcu je nova privolitev');
  assert.deepEqual(naSeznam(zahteve), [{ list: '245', contact: '77', status: 1 }]);
  assert.ok(pripeteOznake(zahteve).includes('LM-10 privolitev: vsebine'));
  assert.deepEqual(dnevnik.warn, []);
});

test('AC s SAMO_S_PRIVOLITVIJO: true — brez privolitve status 2, stanja ne preverja', () => {
  const { skripta, lastnosti } = naloziSkripto();
  const zahteve = ponarediAC(skripta, lastnosti);
  skripta.NASTAVITVE.AC.SAMO_S_PRIVOLITVIJO = true;

  skripta.posljiVAC({ ...LEAD, consentOffers: 'false', consentContent: 'false' });
  assert.deepEqual(naSeznam(zahteve), [{ list: '245', contact: '77', status: 2 }]);
  assert.equal(preverjanjaStanja(zahteve), 0);
});

test('narociObstojeceVAC naroči kontakte z id-jem v celici; prazne in NAPAKA pusti uri', () => {
  const { skripta, preglednica, lastnosti, dnevnik } = naloziSkripto();
  const zahteve = ponarediAC(skripta, lastnosti, { stanjeNaSeznamu: '2' });

  // Trije leadi, vsak dobi id; drugemu celico izpraznimo, tretjemu vpišemo napako.
  post(skripta, oddaja({ ...LEAD, consentOffers: 'false', consentContent: 'false' }));
  post(skripta, oddaja({ ...LEAD, email: 'bor@primer.si', firstName: 'Bor' }));
  post(skripta, oddaja({ ...LEAD, email: 'cvetka@primer.si', firstName: 'Cvetka' }));
  const leadi = preglednica.getSheetByName('Leadi');
  const stolpecAC = vrstice(leadi)[0].indexOf('activeCampaign') + 1;
  leadi.getRange(3, stolpecAC).setValue('');
  leadi.getRange(4, stolpecAC).setValue('NAPAKA: nekaj');
  zahteve.length = 0;

  assert.equal(skripta.narociObstojeceVAC(), 'Naročenih: 1, padlo: 0.');
  assert.match(lastnosti.get('AC_NAROCILO_OBSTOJECIH'), / — Naročenih: 1, padlo: 0\.$/, 'izid je viden na /exec');
  assert.equal(preverjanjaStanja(zahteve), 0, 'naročilo je vsiljeno — stanja ne preverja');
  assert.deepEqual(naSeznam(zahteve), [{ list: '245', contact: '77', status: 1 }]);
  assert.deepEqual(pripeteOznake(zahteve), [...OZNAKE_OSNOVNE, 'LM-10 posvet']);
  assert.equal(zahteve.some((z) => z.pot === 'contact/sync'), false, 'kontakta ne sinhronizira znova');

  // Ura pobere, kar je enkratni poseg pustil pri miru.
  zahteve.length = 0;
  assert.equal(skripta.posljiZaostaleVAC(), 'Poslano: 2, padlo: 0.');
  assert.equal(zahteve.filter((z) => z.pot === 'contact/sync').length, 2);
  assert.equal(poImenih(leadi, 3).activeCampaign, '77');
  assert.equal(poImenih(leadi, 4).activeCampaign, '77');
  assert.match(lastnosti.get('AC_ZADNJI'), / — ura: Poslano: 2, padlo: 0\.$/);
  assert.deepEqual(dnevnik.warn, []);
});

// ═══════════════════════════════════════════════════════════════════════════
// Strankin PDF na Drivu in povezava v ActiveCampaign
// ═══════════════════════════════════════════════════════════════════════════

/** Vrednost polja z danim id-jem v vsakem contact/sync po vrsti; null, kadar polja ni. */
const poljeVAC = (zahteve, id) =>
  zahteve
    .filter((z) => z.pot === 'contact/sync')
    .map((z) => z.telo.contact.fieldValues.find((polje) => polje.field === id) ?? null);

test('doPost s prilogama shrani strankin PDF na Drive: povezava v stolpcu porociloPdf in v polju LM10_POROCILO', () => {
  const { skripta, preglednica, lastnosti, dnevnik, drive } = naloziSkripto();
  const zahteve = ponarediAC(skripta, lastnosti);

  const odgovor = post(skripta, oddaja(LEAD, { attachments: prilogi(), salesReportHtml: '<h1>Priprava</h1>' }));
  assert.deepEqual(odgovor, { ok: true, customerReport: { sent: true } });

  // Dve datoteki v dveh mapah: priprava v svoji brez deljenja, poročilo v svoji, deljeno s povezavo.
  assert.deepEqual(
    drive.datoteke.map((d) => [d.mapa, d.ime, d.tip, d.deljenje]),
    [
      ['LM-10 prodajne priprave', 'priprava-2026-09-05-Kovinar d.o.o.html', 'text/html', null],
      ['LM-10 poročila strankam', 'porocilo-2026-09-05-Kovinar d.o.o.pdf', 'application/pdf', 'ANYONE_WITH_LINK/VIEW'],
    ],
  );
  const [priprava, porocilo] = drive.datoteke;
  assert.equal(Buffer.from(porocilo.bajti).toString(), '%PDF-1.4 poročilo za stranko', 'na Drive gre strankin PDF, ne priprava');

  const v = poImenih(preglednica.getSheetByName('Leadi'), 2);
  assert.equal(v.prodajnaPriprava, priprava.url);
  assert.equal(v.porociloPdf, porocilo.url);
  assert.deepEqual(poljeVAC(zahteve, '3'), [{ field: '3', value: porocilo.url }], 'povezava je v AC');

  assert.match(lastnosti.get('ZADNJE_POROCILO_NA_DRIVU'), /^\d{4}-/);
  assert.equal(lastnosti.has('ZADNJA_NAPAKA_POROCILA_NA_DRIVU'), false);
  assert.match(skripta.doGet().getContent(), /Poročilo na Drivu: \d{4}-/);
  assert.deepEqual(dnevnik.warn, []);

  // Druga oddaja brez prilog: mapi ostaneta isti (id iz lastnosti), celica prazna, polja v AC ni.
  post(skripta, oddaja({ ...LEAD, email: 'bor@primer.si' }));
  assert.equal(drive.mape.size, 2, 'mapi se ne podvajata');
  assert.equal(poImenih(preglednica.getSheetByName('Leadi'), 3).porociloPdf, '');
  assert.deepEqual(poljeVAC(zahteve, '3'), [{ field: '3', value: porocilo.url }, null]);
});

test('Drive odpove: vrstica, pošta stranki in AC gredo naprej — v celici NAPAKA, polje v AC izpade', () => {
  const { skripta, preglednica, lastnosti, dnevnik, posta } = naloziSkripto();
  const zahteve = ponarediAC(skripta, lastnosti);
  const odpoved = () => {
    throw new Error('Drive ne odgovarja');
  };
  skripta.DriveApp = { ...skripta.DriveApp, getFoldersByName: odpoved, getFolderById: odpoved, createFolder: odpoved };

  assert.deepEqual(post(skripta, oddaja(LEAD, { attachments: prilogi() })), { ok: true, customerReport: { sent: true } });
  assert.equal(posta.length, 1, 'stranka dobi poročilo po e-pošti kljub Drivu');
  assert.equal(posta[0].to, 'ana@kovinar.si');

  const v = poImenih(preglednica.getSheetByName('Leadi'), 2);
  assert.match(String(v.porociloPdf), /^NAPAKA: Error: Drive ne odgovarja/);
  assert.equal(v.activeCampaign, '77', 'kontakt je v AC');
  assert.deepEqual(poljeVAC(zahteve, '3'), [null], '"NAPAKA" v CRM ne gre');
  assert.match(lastnosti.get('ZADNJA_NAPAKA_POROCILA_NA_DRIVU'), /Drive ne odgovarja/);
  assert.match(skripta.doGet().getContent(), /Zadnja napaka poročila na Drivu: .*Drive ne odgovarja/);
  assert.deepEqual(dnevnik.warn, ['Poročila ni bilo mogoče shraniti na Drive: Error: Drive ne odgovarja']);
});

test('SHRANI_POROCILO: false — nič na Drive, celica prazna, stranka poročilo vseeno dobi', () => {
  const { skripta, preglednica, drive, posta } = naloziSkripto();
  skripta.NASTAVITVE.SHRANI_POROCILO = false;

  assert.deepEqual(post(skripta, oddaja(LEAD, { attachments: prilogi() })), { ok: true, customerReport: { sent: true } });
  assert.equal(drive.datoteke.length, 0);
  assert.equal(poImenih(preglednica.getSheetByName('Leadi'), 2).porociloPdf, '');
  assert.equal(posta.length, 1);
  assert.match(skripta.doGet().getContent(), /Poročilo na Drivu: IZKLOPLJENO/);
});
