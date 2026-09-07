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
  zivilstvo: {
    id: 'zivilstvo',
    // Brez servisHz: živilo nima garancijskega servisa po predaji, reklamacije
    // kupcev in odpoklic pa meri panožni modul sledljivost_zivilstvo — horizontala
    // bi iste ure in dobropise štela dvakrat. Ostale štiri horizontale ostanejo:
    // poročila za trgovce (analitikaHz), knjiženje (financeHz), evidence ur
    // (kadriHz) in potrjevanje dokumentov (dokumentiHz) živilski moduli ne merijo.
    moduleIds: [
      'donos_zivilstvo',
      'roki_zivilstvo',
      'sledljivost_zivilstvo',
      'kakovost_zivilstvo',
      'narocila_zivilstvo',
      'analitikaHz',
      'financeHz',
      'kadriHz',
      'dokumentiHz',
      'diagnostika_zivilstvo',
      'E',
    ],
    // Privzeta tri = prva tri po vrstnem redu: odstopanje donosa, odpisi zaradi
    // roka in sledljivost ob odpoklicu so tri najvišje ocenjene bolečine v
    // katalogu raziskave (B02, B03, B01), zato defaultIds ni potreben.
    triage: { recommendedCount: 3 },
    // Enak prag kot proizvodnja: materialni vzvod (kalo in odpisi) je pri isti
    // velikosti podjetja primerljiv z izmetom, mediana prihodkov v ciljnem
    // segmentu pa celo višja. KALIBRACIJA: začetna ocena, preveriti po prvih
    // ~50 vnosih.
    highLossThresholdEUR: 15000,
  },
  plastika: {
    id: 'plastika',
    // Brez servisHz: predelovalec plastike garancijskega servisa po predaji
    // nima, reklamacije kupcev pa meri panožni modul granulat_plastika —
    // horizontala bi iste dobropise štela dvakrat. Ostale štiri horizontale
    // ostanejo: poročil (analitikaHz), knjiženja (financeHz), evidenc ur
    // (kadriHz) in potrjevanja dokumentov (dokumentiHz) plastičarski moduli ne
    // merijo; prepis odpoklicev je proti dokumentiHz razmejen v besedilu help.
    moduleIds: [
      'stroji_plastika',
      'granulat_plastika',
      'planiranje_plastika',
      'orodja_plastika',
      'zaloge_plastika',
      'analitikaHz',
      'financeHz',
      'kadriHz',
      'dokumentiHz',
      'diagnostika_plastika',
      'E',
    ],
    // Privzeta tri = prva tri po vrstnem redu: izkoriščenost strojev in menjave,
    // granulat in izmet ter planiranje in odpoklici so najvišje ocenjene bolečine
    // v katalogu raziskave (B01/B02, B03/B04, B23/B10), zato defaultIds ni potreben.
    triage: { recommendedCount: 3 },
    // Višji prag kot proizvodnja: podjetja na seznamu panoge so večja (mediana 77
    // zaposlenih in 9,7 mio EUR prihodkov), materialni vzvod pa je letna vrednost
    // granulata v milijonih. KALIBRACIJA: začetna ocena, preveriti po prvih ~50
    // vnosih.
    highLossThresholdEUR: 20000,
  },
  kovinarstvo: {
    id: 'kovinarstvo',
    // Brez servisHz: podizvajalec v kovinarstvu garancijskega servisa in RMA
    // praviloma nima; reklamacije kupcev (ure 8D, iskanje šarže, dobropisi) meri
    // panožni modul sledljivost_kovinarstvo — horizontala bi iste ure in evre
    // štela dvakrat. Vrzel: strojegradnja z garancijskimi popravili po predaji
    // ostane neizmerjena (navodila/kovinarstvo/). Ostale štiri horizontale ostanejo:
    // poročila (analitikaHz), knjiženje (financeHz), evidence ur za plače (kadriHz)
    // in potrjevanje dokumentov (dokumentiHz) kovinarski moduli ne merijo.
    moduleIds: [
      'nalog_kovinarstvo',
      'material_kovinarstvo',
      'zaloge_kovinarstvo',
      'sledljivost_kovinarstvo',
      'kooperacija_kovinarstvo',
      'plan_kovinarstvo',
      'analitikaHz',
      'financeHz',
      'kadriHz',
      'dokumentiHz',
      'diagnostika_kovinarstvo',
      'E',
    ],
    // Privzeta tri = prva tri po vrstnem redu: strošek naloga (B01), odstopanje
    // porabe (B03) in zaloge (B09) ima vsak kovinar; kooperacija in certifikati sta
    // bolečini ožjega kroga — zato defaultIds ni potreben.
    triage: { recommendedCount: 3 },
    // Enak prag kot proizvodnja: materialni vzvod (odstopanje od normativa) je pri
    // isti velikosti podjetja primerljiv z izmetom, mediana prihodkov v ciljnem
    // segmentu je 6,3 mio EUR. KALIBRACIJA: začetna ocena, preveriti po prvih ~50 vnosih.
    highLossThresholdEUR: 15000,
  },
  logistika: {
    id: 'logistika',
    // Brez dokumentiHz: prevozna dokumentacija (modul 'dokumentacija') meri iste
    // ure — vprašanje bi se bralo skoraj enako in ure bi se štele dvakrat.
    // Brez servisHz: modul 'napake' že meri ure reševanja reklamacij in stroške
    // napačnih dostav, prevoznik pa garancijskega servisa praviloma nima.
    // Brez kadriHz: modul 'vozniki' meri iste ure — horizontala v vprašanju
    // hrAdminHoursPerMonth izrecno našteva potne naloge, ki so pri prevozniku
    // največji del kadrovske administracije.
    moduleIds: [
      'obracun_logistika',
      'vozniki',
      'terjatve_logistika',
      'dokumentacija',
      'napake',
      'skladisce',
      'analitikaHz',
      'financeHz',
      'diagnostika_logistika',
      'E',
    ],
    // Prva tri po vrstnem redu so hkrati edina, ki jih ima VSAK naslovnik te
    // dejavnosti: prevoznik z vozili, špediter brez njih in skladiščnik tujega
    // blaga vsi obračunavajo, vsi imajo plačilne roke, vsi vodijo ljudi.
    // Skladišče privzeto ni, ker ga špediter nima.
    triage: { recommendedCount: 3, defaultIds: ['obracun_logistika', 'vozniki', 'terjatve_logistika'] },
    // Znižano z 20.000 avgusta 2026: prag je bil postavljen, ko sta področji merili
    // gorivo praznih voženj, nujne podnajeme in penale — postavke, ki so odšle iz
    // izračuna, ker jih PANTHEON ne naslavlja. Kar ostane (nezaračunani dodatki,
    // vezan denar, administracija), je pri isti velikosti podjetja manjše, zato je
    // prag zdaj enak proizvodnji in storitvam.
    // KALIBRACIJA: začetna ocena, preveriti po prvih ~50 vnosih.
    highLossThresholdEUR: 15000,
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
  inzeniring: {
    id: 'inzeniring',
    // Prva panožna dejavnost pod storitvami: inženiring in izvedba na ključ. Skozi
    // knjige prevaljajo opremo in podizvajalce, zato bolečina ni nezaračunana ura,
    // ampak marža projekta, faza brez računa in oprema, ki ni vezana na projekt
    // (raziskava panoge, Datalab_raziskava_INZENIRING_model.xlsx; izpeljava v
    // navodila/inzeniring/). Vprašalnik: config/modules/inzeniring.ts.
    //
    // Brez dokumentiHz: dokumentacija_inzeniring meri iskanje in sestavljanje
    // projektnih dokumentov (načrti, meritve, CE, razpisi) — ista logika kot pri
    // logistiki. servisHz ostane: meri garancijske ure in dele PO predaji (strošek),
    // obracun_inzeniring pa samo neobračunane posege (prihodek) — različna koša,
    // brez preseka. Ure, razporejene na projekt, meri marza_inzeniring; prisotnost
    // in podlago za plačo kadriHz — razmejitev je v besedilih help.
    moduleIds: [
      'marza_inzeniring',
      'aneksi_inzeniring',
      'oprema_inzeniring',
      'obracun_inzeniring',
      'dokumentacija_inzeniring',
      'analitikaHz',
      'financeHz',
      'kadriHz',
      'servisHz',
      'diagnostika_inzeniring',
      'E',
    ],
    // Privzeta tri = prva tri po vrstnem redu: ure brez projekta (B01), aneksi (B02)
    // in oprema med projekti (B03) so tri najvišje ocenjene bolečine v katalogu
    // raziskave in hkrati teza "marža, aneksi, oprema", zato defaultIds ni potreben.
    triage: { recommendedCount: 3 },
    // Med storitvami (15.000) in trgovino (20.000): izguba ni samo v urah, ampak
    // tudi v opremi in v denarju, vezanem v fazah brez računa — 7 mio EUR letnih
    // projektov × 20 dni zamika × 8,5 % je samo po sebi ~33.000. KALIBRACIJA:
    // začetna ocena, preveriti po prvih ~50 vnosih.
    highLossThresholdEUR: 20000,
  },
  gradbenistvo: {
    id: 'gradbenistvo',
    // Vseh pet horizontal, kot pri storitvah — meje so v besedilih help panožnih
    // modulov: kadriHz meri evidenco prisotnosti za plačo, gradbisce_gradbenistvo
    // pripis ur projektu; dokumentiHz meri potrjevanje računov za material,
    // podizvajalci_gradbenistvo situacije podizvajalcev; servisHz meri odpravo
    // pomanjkljivosti po primopredaji, ki je noben panožni modul ne meri.
    moduleIds: [
      'marza_gradbenistvo',
      'situacije_gradbenistvo',
      'gradbisce_gradbenistvo',
      'podizvajalci_gradbenistvo',
      'placila_gradbenistvo',
      'analitikaHz',
      'financeHz',
      'kadriHz',
      'dokumentiHz',
      'servisHz',
      'diagnostika_gradbenistvo',
      'E',
    ],
    // Maržo projekta, situacije in gradbišče ima VSAK izvajalec; podizvajalcev
    // specialist (instalater, fasader) nima — sam je podizvajalec drugim. Prva tri
    // so hkrati tri najvišje ocenjene bolečine kataloga raziskave (B01, B02, B03/B04).
    triage: {
      recommendedCount: 3,
      defaultIds: ['marza_gradbenistvo', 'situacije_gradbenistvo', 'gradbisce_gradbenistvo'],
    },
    // Kot pri veleprodaji: material in denar na večmilijonski letni vrednosti del
    // dajeta pri isti velikosti podjetja večje zneske kot ure storitvenega podjetja.
    // KALIBRACIJA: začetna ocena, preveriti po prvih ~50 vnosih.
    highLossThresholdEUR: 20000,
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
  'zivilstvo',
  'kovinarstvo',
  'plastika',
  'logistika',
  'trgovina',
  'maloprodaja',
  'storitve',
  'gradbenistvo',
  'inzeniring',
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
