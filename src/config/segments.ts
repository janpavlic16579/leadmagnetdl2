import type { SegmentId } from './segmentTypes';

export type { SegmentId };

/**
 * Segment določa samo, KATERI moduli se prikažejo in v kakšnem vrstnem redu.
 *
 * Kaj modul vpraša in kako računa, je v config/modules/; kako dejavnost
 * nagovorimo, je v config/copy/. Segment ne pozna ne enega ne drugega — zato je
 * dodajanje dejavnosti tu ena vrstica z moduleIds in nič drugega.
 *
 * Marketinška besedila (ime dejavnosti, naslov rezultata, primeri postavk pod
 * neposrednimi stroški) so tu nekoč stala. Bila so v nasprotju s tem odstavkom
 * in so vodila v podvajanje: isti naslov je obstajal še enkrat v pdf.ts.
 */
export interface SegmentConfig {
  id: SegmentId;
  /** Id-ji iz config/modules/. Vrstni red je hkrati prioriteta za triažo. */
  moduleIds: string[];
  /**
   * Če je nastavljena, se pred vnosom prikaže korak triaže: obiskovalec vsak modul
   * hitro oceni, podrobna vprašanja pa dobi za tista, ki jih obkljuka.
   * Brez tega se prikažejo vsi moduli, kot je bilo doslej.
   */
  triage?: {
    /**
     * Koliko področij je privzeto označenih in koliko jih priporočamo.
     *
     * NE omejuje: obkljukati je mogoče vseh pet. Prej se je isto število uporabljalo
     * kot trda meja (detailCount + 1) — polje se je ob njej onemogočilo brez pojasnila,
     * obiskovalec pa ni izvedel, da mora najprej odkljukati drugo področje.
     */
    recommendedCount: number;
    /**
     * Področja, ki stranke te dejavnosti najbolj mučijo — privzeto obkljukana in
     * hkrati prednost ob izenačenih ocenah.
     *
     * Ločeno od moduleIds namenoma: tisti vrstni red določa prikaz v razčlenitvi,
     * grafu in PDF-ju ter razrešuje izenačenje pri "največji postavki". Ko je pomenil
     * še privzeto izbiro, je ni bilo mogoče popraviti brez premika vrstnega reda
     * rezultatov. Brez vnosa velja prejšnje vedenje: prva po moduleIds.
     *
     * KALIBRACIJA: začetne ocene, ne empirija — preveriti po prvih ~50 vnosih.
     */
    defaultIds?: string[];
  };
  /*
   * Koraka "nekaj o vas" in "skupna finančna osnova" tu nista zastavici: vklopi
   * ju vnos dejavnosti v config/contexts/. Zastavica brez konfiguracije bi
   * prikazala prazen korak, konfiguracija brez zastavice pa bi ostala neuporabljena.
   */
  /** Samo za segment 'racunovodstvo': povprečne ure na stranko/mesec za kapacitetni preračun. */
  accountingCapacity?: {
    avgHoursPerClientPerMonth: number;
  };
  /**
   * Začetna ocena za follow-up kalibracijo (spec pogl. 6) — po prvih 50 vnosih
   * je treba prag preveriti na realnih podatkih.
   */
  highLossThresholdEUR?: number;
}

export const SEGMENTS: Record<SegmentId, SegmentConfig> = {
  proizvodnja: {
    id: 'proizvodnja',
    // Denarni tok (modul D) je za proizvodnjo prestavljen med splošne module.
    // Horizontale za panožnimi: prikaz, triažni tie-break in "največja postavka"
    // ob izenačenju favorizirajo panožno bolečino (velja za vse segmente).
    moduleIds: [
      'planiranje',
      'material',
      'zaloge',
      'nalogi',
      'zamude',
      'analitikaHz',
      'financeHz',
      'kadriHz',
      'dokumentiHz',
      'servisHz',
      'diagnostika',
      'E',
    ],
    // Privzeta tri = prva tri po vrstnem redu, zato defaultIds ni potreben:
    // izmet in zaloge nosita največ evrov, plan pa ima vsak proizvajalec.
    triage: { recommendedCount: 3 },
    highLossThresholdEUR: 15000,
  },
  logistika: {
    id: 'logistika',
    // Brez dokumentiHz: prevozna dokumentacija (modul 'dokumentacija') meri iste
    // ure — vprašanje bi se bralo skoraj enako in ure bi se štele dvakrat.
    // Brez servisHz: modul 'napake' že meri ure reševanja reklamacij in stroške
    // napačnih dostav, prevoznik pa garancijskega servisa praviloma nima.
    moduleIds: [
      'odprema',
      'napake',
      'skladisce',
      'dokumentacija',
      'roki',
      'analitikaHz',
      'financeHz',
      'kadriHz',
      'diagnostika_logistika',
      'E',
    ],
    // Skladišča nima vsak prevoznik, stojnine in nujni prevozi pa so univerzalni —
    // zato namesto tretjega po vrstnem redu (skladisce) privzeto merimo roke.
    triage: { recommendedCount: 3, defaultIds: ['odprema', 'napake', 'roki'] },
    // Logistika ima nižjo maržo na prihodek kot proizvodnja, absolutne izgube pa
    // so pri isti velikosti podjetja višje (gorivo, podnajemi, penali) — zato prag
    // ni enak proizvodnji. KALIBRACIJA: začetna ocena, preveriti po prvih ~50 vnosih.
    highLossThresholdEUR: 20000,
  },
  trgovina: {
    id: 'trgovina',
    moduleIds: [
      'narocila_trgovina',
      'skladisce_trgovina',
      'zaloge_trgovina',
      'odprema_trgovina',
      'terjatve_trgovina',
      'analitikaHz',
      'financeHz',
      'kadriHz',
      'dokumentiHz',
      'servisHz',
      'diagnostika_trgovina',
      'E',
    ],
    // Vezan kapital v zalogah in terjatvah plus izgubljena marža na cenah je
    // klasična trojica veleprodaje; komisioniranje je bolečina ožjega kroga.
    triage: {
      recommendedCount: 3,
      defaultIds: ['zaloge_trgovina', 'narocila_trgovina', 'terjatve_trgovina'],
    },
    highLossThresholdEUR: 20000,
  },
  maloprodaja: {
    id: 'maloprodaja',
    // Šest panožnih področij namesto petih: prazna polica in presežna zaloga sta
    // nasprotna problema z nasprotnima vzrokoma, zato ju en modul ni mogel meriti
    // hkrati (glej config/modules/maloprodaja.ts).
    moduleIds: [
      'razpolozljivostMp',
      'zalogeMp',
      'marzeMp',
      'blagajnaMp',
      'prevzemMp',
      'kanaliMp',
      'analitikaHz',
      'financeHz',
      'kadriHz',
      'dokumentiHz',
      'servisHz',
      'diagnostikaMp',
      'E',
    ],
    // Police, zaloga in blagajna: trojica, ki jo ima vsak trgovec ne glede na
    // panogo. Cene in splet sta bolečini ožjega kroga, prevzem pa je odvisen od
    // števila dobav — zato niso privzeti, čeprav sta cene po vrstnem redu tretje.
    triage: {
      recommendedCount: 3,
      defaultIds: ['razpolozljivostMp', 'zalogeMp', 'blagajnaMp'],
    },
    // Maloprodajalec je pri isti velikosti podjetja manjši od veleprodajalca —
    // izguba se nabira po centih na artikel, ne po pošiljkah. KALIBRACIJA: začetna
    // ocena, preveriti po prvih ~50 vnosih.
    highLossThresholdEUR: 15000,
  },
  storitve: {
    id: 'storitve',
    moduleIds: [
      'projekti_storitve',
      'obracun_storitve',
      'obseg_storitve',
      'administracija_storitve',
      'terjatve_storitve',
      // dokumentiHz meri potrjevanje in e-izmenjavo, administracija_storitve pa
      // projektno administracijo — razmejitev drži, zato sta oba vključena.
      'analitikaHz',
      'financeHz',
      'kadriHz',
      'dokumentiHz',
      'servisHz',
      'diagnostika_storitve',
      'E',
    ],
    // Nezaračunano delo je vodilna bolečina segmenta, obseg in plačila pa sta
    // nadaljevanji iste — zato obračun pred planiranjem zasedenosti.
    triage: {
      recommendedCount: 3,
      defaultIds: ['obracun_storitve', 'obseg_storitve', 'terjatve_storitve'],
    },
    // Storitveno podjetje nima materiala ne zaloge; izguba je skoraj v celoti v
    // urah, zato je prag bliže proizvodnji kot logistiki. KALIBRACIJA: začetna
    // ocena, preveriti po prvih ~50 vnosih.
    highLossThresholdEUR: 15000,
  },
  racunovodstvo: {
    id: 'racunovodstvo',
    // Brez financeHz (knjiženje in obračuni SO njihov produkt — merijo ga zajemRs,
    // obracuniRs, popravkiRs), brez dokumentiHz (zajem listin meri zajemRs) in
    // brez servisHz (popravki po lastni napaki so v popravkiRs, servisa ni).
    // kadriHz meri njihove LASTNE kadre in plače, ne obračunov za stranke.
    moduleIds: [
      'zajemRs',
      'strankeRs',
      'obracuniRs',
      'popravkiRs',
      'donosnostRs',
      'analitikaHz',
      'kadriHz',
      'diagnostikaRs',
      'E',
    ],
    // Ročni vnos, lovljenje listin in konice ob rokih so dnevna bolečina servisa —
    // prva tri po vrstnem redu, zato defaultIds ni potreben.
    triage: { recommendedCount: 3 },
    // Rezerva, kadar področje Neobračunano delo ni med izbranimi v triaži — takrat
    // vprašanja o urah na stranko ni. Sicer velja obiskovalčev odgovor.
    accountingCapacity: { avgHoursPerClientPerMonth: 8 },
    // Servis je pri isti velikosti podjetja manjši od proizvodnega: izguba je
    // skoraj v celoti v urah, neposredni denarni odliv pa je nizek. KALIBRACIJA:
    // začetna ocena, preveriti po prvih ~50 vnosih.
    highLossThresholdEUR: 10000,
  },
  splosno: {
    id: 'splosno',
    // Brez analitikaHz: podatkiSp že meri ure ročne priprave poročil
    // (reportingHoursPerMonth) — iste ure bi se štele dvakrat.
    // Brez servisHz: napakeSp že meri ure ponovnega dela in stroške reklamacij,
    // segment pa je namenoma brez predpostavke, da podjetje sploh kaj servisira.
    moduleIds: [
      'podatkiSp',
      'usklajevanjeSp',
      'napakeSp',
      'denarSp',
      'zalogeSp',
      'financeHz',
      'kadriHz',
      'dokumentiHz',
      'diagnostikaSp',
      'E',
    ],
    // Ročno delo s podatki in usklajevanje sta edini področji, ki ju ima res vsako
    // podjetje — zaloge in terjatve marsikatero od teh podjetij nima. Zato sta
    // privzeti onidve in ne prvi tri po vrstnem redu.
    triage: { recommendedCount: 3, defaultIds: ['podatkiSp', 'usklajevanjeSp', 'napakeSp'] },
    highLossThresholdEUR: 15000,
  },
};

export const SEGMENT_ORDER: SegmentId[] = [
  'proizvodnja',
  'logistika',
  'trgovina',
  'maloprodaja',
  'storitve',
  'racunovodstvo',
  'splosno',
];

export function getSegmentFromUrlParam(param: string | null): SegmentConfig | null {
  if (!param) return null;
  const match = SEGMENT_ORDER.find((id) => id === param);
  return match ? SEGMENTS[match] : null;
}

// FAZA 2 (namerno izven obsega te gradnje):
// - benchmark proti vrstnikom (pravno neopredeljeno, spec §5b)
// - prava CRM/e-mail API integracija (glej lib/exportRecord.ts za ročni izvoz)
// - HR/RS/BA lokalizacija (arhitektura pušča prostor prek besedilnih polj v modulih,
//   a locale switcher ni zgrajen zdaj)
