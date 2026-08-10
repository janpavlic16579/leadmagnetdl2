import type { SegmentId } from './segmentTypes';

export type { SegmentId };

/**
 * Segment določa samo, KATERI moduli se prikažejo in v kakšnem vrstnem redu.
 * Kaj modul vpraša in kako računa, je zdaj v config/modules/ — segment tega
 * ne pozna več. Zato tu ni več moduleLabels/defaults: dodajanje dejavnosti
 * ne pomeni več urejanja te datoteke razen ene vrstice z moduleIds.
 */
export interface SegmentConfig {
  id: SegmentId;
  displayName: string;
  /** Id-ji iz config/modules/. Vrstni red je hkrati prioriteta za triažo. */
  moduleIds: string[];
  headlineStory: string;
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
  /**
   * Primeri pod zneskom neposrednih letnih stroškov. Naštejejo se postavke, ki jih
   * TA dejavnost dejansko meri — proizvodni "izmet" prevozniku ne pove ničesar in
   * vzbudi dvom o celotnem izračunu. Brez vnosa se izpiše nevtralno besedilo.
   */
  directLossNote?: string;
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
    displayName: 'Proizvodnja 10–249 zaposlenih',
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
    headlineStory: 'Koliko vas stane sedanji način dela v proizvodnji?',
    // Privzeta tri = prva tri po vrstnem redu, zato defaultIds ni potreben:
    // izmet in zaloge nosita največ evrov, plan pa ima vsak proizvajalec.
    triage: { recommendedCount: 3 },
    directLossNote:
      'Denar, ki dejansko odteka: izmet, odpisi, ekspresne nabave, penali, reklamacije.',
    highLossThresholdEUR: 15000,
  },
  logistika: {
    id: 'logistika',
    displayName: 'Logistika in transport 10–249 zaposlenih',
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
    headlineStory: 'Koliko vas stane sedanji način dela v logistiki?',
    // Skladišča nima vsak prevoznik, stojnine in nujni prevozi pa so univerzalni —
    // zato namesto tretjega po vrstnem redu (skladisce) privzeto merimo roke.
    triage: { recommendedCount: 3, defaultIds: ['odprema', 'napake', 'roki'] },
    directLossNote:
      'Denar, ki dejansko odteka: prazni kilometri, poškodovano blago, nujni podnajemi, penali in stojnine.',
    // Logistika ima nižjo maržo na prihodek kot proizvodnja, absolutne izgube pa
    // so pri isti velikosti podjetja višje (gorivo, podnajemi, penali) — zato prag
    // ni enak proizvodnji. KALIBRACIJA: začetna ocena, preveriti po prvih ~50 vnosih.
    highLossThresholdEUR: 20000,
  },
  trgovina: {
    id: 'trgovina',
    // Logistika ima od tu naprej svoj segment, zato je iz imena umaknjena —
    // sicer bi ista dejavnost obstajala na dveh mestih z različnimi vprašanji.
    displayName: 'Veleprodaja in distribucija',
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
    headlineStory: 'Koliko vas stane sedanji način dela v veleprodaji in skladišču?',
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
    displayName: 'Maloprodaja',
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
    headlineStory: 'Koliko vas stane sedanji način dela v trgovini?',
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
    displayName: 'Storitve in projekti 10–249 zaposlenih',
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
    headlineStory: 'Koliko vas stane delo, ki ni zaračunano?',
    // Naslovna zgodba segmenta je prav nezaračunano delo, obseg in plačila pa sta
    // nadaljevanji iste bolečine — zato obračun pred planiranjem zasedenosti.
    triage: {
      recommendedCount: 3,
      defaultIds: ['obracun_storitve', 'obseg_storitve', 'terjatve_storitve'],
    },
    directLossNote:
      'Denar, ki dejansko odteka: nezaračunane ure, dobropisi, odpisi ob obračunu, kazni in izgubljena marža.',
    // Storitveno podjetje nima materiala ne zaloge; izguba je skoraj v celoti v
    // urah, zato je prag bliže proizvodnji kot logistiki. KALIBRACIJA: začetna
    // ocena, preveriti po prvih ~50 vnosih.
    highLossThresholdEUR: 15000,
  },
  racunovodstvo: {
    id: 'racunovodstvo',
    displayName: 'Računovodski servis',
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
    headlineStory: 'Koliko novih strank bi lahko sprejeli z isto ekipo?',
    // Ročni vnos, lovljenje listin in konice ob rokih so dnevna bolečina servisa —
    // prva tri po vrstnem redu, zato defaultIds ni potreben.
    triage: { recommendedCount: 3 },
    directLossNote:
      'Denar, ki dejansko odteka: zunanja pomoč v konicah, globe in obresti, samoprijave, dobropisi in stranke pod lastno ceno.',
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
    displayName: 'Direktor / CFO — splošno',
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
    // Prejšnji naslov ("Koliko vas stane počasen denar?") je opisoval en sam modul.
    // Segment zdaj meri pet področij, denar je le eno od njih.
    headlineStory: 'Koliko vas stane sedanji način dela?',
    // Ročno delo s podatki in usklajevanje sta edini področji, ki ju ima res vsako
    // podjetje — zaloge in terjatve marsikatero od teh podjetij nima. Zato sta
    // privzeti onidve in ne prvi tri po vrstnem redu.
    triage: { recommendedCount: 3, defaultIds: ['podatkiSp', 'usklajevanjeSp', 'napakeSp'] },
    directLossNote:
      'Denar, ki dejansko odteka: reklamacije in dobropisi, izgubljena marža, zamude pri plačilih, odpisane terjatve in odpisi zalog.',
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
