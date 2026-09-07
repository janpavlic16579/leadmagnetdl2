import { ADMIN_HOUR_BANDS, ADMIN_HOUR_EXPLAINER } from './shared';
import type { CostBand, SegmentContext } from './contextTypes';

/**
 * Operativna ura je pri predelavi plastike STROJNA ura z operaterjem, ne ura
 * človeka. Vse strojne postavke tega segmenta (menjave orodij, nenačrtovani
 * zastoji, čakanje na granulat) so čas, ko stroj ne izdeluje — in stroj stane
 * energijo, amortizacijo in vzdrževanje tudi takrat, ko stoji. Ura operaterja
 * sama bi ta strošek podcenila za polovico ali več.
 *
 * Sidro: raziskava panoge (Predpostavke A04) računa s polnim stroškom
 * produktivne ure 26/30/35 EUR (konzervativno/realistično/potencial); vprašanje
 * Q28 zahteva, da strojna ura vključi energijo in amortizacijo. Pasovi pokrivajo
 * razpon od malih strojev (do 100 t zapiralne sile, operater na dveh strojih)
 * do velikih (nad 500 t, en operater na stroj): plača operaterja 18–22 EUR/h
 * (SURS, docs/urne-postavke.md) + energija 3–15 EUR/h + amortizacija in
 * vzdrževanje 4–25 EUR/h. Sredine so geometrijske, kot pri drugih dejavnostih.
 *
 * KALIBRACIJA: sidro je iz raziskave in tržnih strojnih ur, ne iz uradne
 * statistike; preveriti po prvih ~50 vnosih.
 */
const MACHINE_HOUR_BANDS: CostBand[] = [
  { id: 'do25', label: 'Do 25 EUR', midpointEUR: 21, minEUR: 17, maxEUR: 25 },
  { id: '25do35', label: '25–35 EUR', midpointEUR: 29, minEUR: 25, maxEUR: 35 },
  { id: '35do50', label: '35–50 EUR', midpointEUR: 42, minEUR: 35, maxEUR: 50 },
  { id: 'nad50', label: 'Več kot 50 EUR', midpointEUR: 60, minEUR: 50, maxEUR: 70 },
];

/**
 * Pojasnilo za gumb "?" pri strojni uri — lastno, ne HOURLY_COST_EXPLAINER iz
 * shared.ts, ki opisuje plačo: tu se sešteva stroj in človek.
 */
const MACHINE_HOUR_EXPLAINER =
  'Strošek ene ure obratovanja stroja z operaterjem: plača operaterja s prispevki (če eden streže več ' +
  'strojev, sorazmeren del) + elektrika + amortizacija in vzdrževanje stroja, deljeno z urami obratovanja. ' +
  'Primer: operater 20 EUR + 40 kW × 0,15 EUR/kWh ≈ 6 EUR + amortizacija in vzdrževanje 6 EUR ≈ 32 EUR na ' +
  'uro. Če imate kalkulacijo strojne ure, vzemite njo.';

/** Prihodek: brez pasu, ki bi bil "povprečje", ker v izračun ne vstopa (glej spodaj). */
const REVENUE_EXPLAINER =
  'Čisti prihodki od prodaje iz zadnjega zaključenega leta, brez DDV — ne promet z DDV in ne prilivi na ' +
  'račun. Mediana v ciljnem segmentu panoge je 9,7 mio EUR (raziskava, list Naslovnica); po tem podatku ' +
  'prodajnik oceni velikost posla, v zneske izračuna ne vstopa.';

/**
 * Kontekst predelovalca plastike.
 *
 * Prvo vprašanje sprašuje po vrsti izdelkov in ne po načinu proizvodnje kot v
 * splošni proizvodnji: proizvajalec embalaže za trg EU je od avgusta 2026
 * neposredni zavezanec uredbe PPWR, orodjarna s predelavo vodi projektno in
 * serijsko logiko hkrati (raziskava, segmenta S5 in S6, hipotezi H07 in H11).
 * Prodajniku pove, o čem bo tekel pogovor, preden odpre poročilo.
 *
 * Marže ta dejavnost NE vpraša: noben njen modul je ne uporablja (izguba se
 * meri kot delež porabljenega granulata in kot strojne ure, ne kot delež
 * prometa), vprašanje brez učinka na rezultat pa bi vprašalnik samo podaljšalo.
 * Prihodek se vpraša, ker ga bere prodajna priprava (kvalifikacija) in ker
 * raziskava ICP meri po prihodku na zaposlenega; pomožno besedilo pošteno pove,
 * da v izračun ne vstopa.
 */
export const PLASTIKA_CONTEXT: SegmentContext = {
  businessType: {
    legend: 'Kaj pretežno izdelujete?',
    options: [
      { id: 'tehnicniDeli', label: 'Tehnične dele po naročilu kupcev' },
      { id: 'embalaza', label: 'Embalažo ali izdelke za trg EU' },
      { id: 'lastniIzdelki', label: 'Lastne izdelke za trg' },
      { id: 'orodjarna', label: 'Orodja in serijsko predelavo hkrati' },
      { id: 'kombinirano', label: 'Kombinirano' },
    ],
  },

  currentSystem: {
    legend: 'Kako danes vodite proizvodnjo?',
    // Id-ji so enaki kot v proizvodnji, ker pomenijo isto; ključi v
    // content/sales/pantheonFit.ts so segment:sistem, zato trka ni.
    options: [
      { id: 'pantheonMfMt', label: 'PANTHEON MF in/ali MT', gap: { min: 0.08, max: 0.2 }, isPantheon: true },
      { id: 'pantheonNoMf', label: 'PANTHEON brez proizvodnega modula', gap: { min: 0.15, max: 0.3 }, isPantheon: true },
      { id: 'otherErp', label: 'Drug ERP ali MES za proizvodnjo', gap: { min: 0.15, max: 0.3 } },
      {
        id: 'erpExcelPaper',
        label: 'ERP za finance, proizvodnja v Excelu in na obratovalnih listih',
        gap: { min: 0.25, max: 0.4 },
      },
      { id: 'excelPaper', label: 'Večinoma Excel, tabla in papir', gap: { min: 0.25, max: 0.4 } },
    ],
  },

  role: {
    legend: 'Kakšna je vaša vloga?',
    options: [
      { id: 'direktor', label: 'Direktor/-ica' },
      { id: 'vodjaProizvodnje', label: 'Vodja proizvodnje' },
      // Raziskava (H06) domneva, da je vodja proizvodnje boljši prvi stik kot
      // direktor; tehnolog in kakovost sta lastnika podatkov o porabi, ciklih in
      // sledljivosti. Id-ja se začneta z 'vodja', da ju ocena ICP (config/icp.ts)
      // ujame po predponi kot vodjo področja in ne kot "vloge ni navedel".
      { id: 'vodjaTehnologije', label: 'Tehnolog ali vodja vzdrževanja' },
      { id: 'vodjaKakovosti', label: 'Vodja kakovosti ali skladnosti' },
      { id: 'finance', label: 'Finance ali računovodstvo' },
      { id: 'drugo', label: 'Drugo', freeText: true },
    ],
  },

  operationalHour: {
    label: 'Približen polni strošek strojne ure z operaterjem',
    help: 'Stroj z operaterjem: plača operaterja, energija, amortizacija in vzdrževanje na uro obratovanja.',
    explainer: MACHINE_HOUR_EXPLAINER,
    bands: MACHINE_HOUR_BANDS,
    // Realistični scenarij raziskave (A04). Leži v natanko enem pasu (25–35) in
    // ni sredina nobenega — contexts.test.ts.
    fallbackEUR: 30,
  },

  adminHour: {
    label: 'Približen polni strošek administrativne oziroma vodstvene ure',
    help: 'Planer, vodja proizvodnje, tehnolog, nabava, priprava dela.',
    explainer: ADMIN_HOUR_EXPLAINER,
    bands: ADMIN_HOUR_BANDS,
    fallbackEUR: 26,
  },

  /**
   * Razponi pokrivajo ciljni razred 10–249 zaposlenih. Mediana prihodkov v
   * segmentu A (20+ zaposlenih) obstoječega seznama je 9,7 mio EUR, prihodek na
   * zaposlenega 134.000 EUR — najnižji med petimi raziskanimi panogami, ker je
   * dejavnost delovno in strojno intenzivna (raziskava, list Naslovnica).
   * Sredine so geometrijske. KALIBRACIJA: preveriti po prvih ~50 vnosih.
   */
  annualRevenue: {
    label: 'Letni prihodki od prodaje',
    help: 'Neto, brez DDV. V izračun zneskov ne vstopa — pove velikost podjetja za poročilo in primerjavo s panogo.',
    explainer: REVENUE_EXPLAINER,
    bands: [
      { id: 'do2mio', label: 'Do 2 mio EUR', midpoint: 1_200_000, min: 400_000, max: 2_000_000 },
      { id: '2do5mio', label: '2–5 mio EUR', midpoint: 3_200_000, min: 2_000_000, max: 5_000_000 },
      { id: '5do15mio', label: '5–15 mio EUR', midpoint: 8_500_000, min: 5_000_000, max: 15_000_000 },
      { id: 'nad15mio', label: 'Več kot 15 mio EUR', midpoint: 25_000_000, min: 15_000_000, max: 35_000_000 },
    ],
    fallback: 0,
    unit: 'EUR/leto',
  },
};
