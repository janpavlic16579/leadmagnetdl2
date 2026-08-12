/**
 * Tipi registra modulov.
 *
 * Doslej so bili moduli trdo zakodirani kot A–E v ~12 datotekah, segmenti pa so se
 * razlikovali le po besedilu vprašanj. Ker morajo biti stroškovni moduli specifični
 * za dejavnost (proizvodnja meri druge stvari kot računovodstvo), so moduli zdaj
 * podatki: vsak modul sam pove, kaj vpraša, kako računa in v kateri koš gre izid.
 *
 * Dodajanje nove dejavnosti = ena nova datoteka z definicijami + vpis v register.
 */

/**
 * Koši rezultatov. Ločeni koši strukturno preprečijo napako, ki jo je stara koda
 * lovila ročno: enkratno sproščen kapital ne sme nikoli pristati v letni izgubi.
 * En ModuleOutput ima natanko en bucket, zato ista številka ne more v dva koša.
 */
export type BucketId =
  /** Neposredne letne izgube — trdi denar, ki odteka. Edino to gre v hero znesek. */
  | 'directLoss'
  /**
   * Marža, ki je podjetje ni zaslužilo, čeprav bi jo lahko: prazna polica,
   * odpovedano naročilo, prodaja po napačni ceni.
   *
   * Ločeno od directLoss namenoma. Odpis je denar, ki je odtekel in ga je mogoče
   * pokazati na kontu; izgubljena marža je denar, ki ni nikoli prišel, in stoji na
   * predpostavki, kaj bi kupec storil. Trditvi imata različno težo dokaza, zato ju
   * mora poročilo prikazati ločeno — sicer prvi ugovor ("tega nakupa ne bi bilo")
   * podre tudi tisti del zneska, ki je dokazljiv (raziskava maloprodaje §5.2).
   */
  | 'lostMargin'
  /** Vrednost sproščene delovne in proizvodne kapacitete — ni prihranek pri plačah. */
  | 'capacity'
  /** Enkratno sprostljiv kapital (zaloge) — nikoli se ne sešteva z letnimi zneski. */
  | 'oneTimeCapital'
  /** Kvalitativna ocena tveganja — brez EUR, ker bi bil znesek navidezno natančen. */
  | 'risk';

/**
 * Odgovor "ne vem" pri številčnem polju.
 *
 * Ni 0 in ni prazno polje. Raziskava maloprodaje to zahteva izrecno (§16.3, §24):
 * neznan podatek se ne sme sešteti kot potrjena ničla, sicer vsak neodgovor tiho
 * zniža skupni znesek, rezultat pa izpade natančnejši, kot v resnici je.
 *
 * Negativna sentinela in ne union tip: nobeno polje ne sprejema negativnih zneskov,
 * vnos pa ostane Record<string, number> — sicer bi moral vsak modul, motor, izvoz
 * in test poznati dvojni tip vrednosti.
 *
 * Do compute() sentinela nikoli ne pride: motor jo pretvori v 0 (glej moduleEngine).
 * Modulu torej ni treba ničesar preverjati, pozabiti pa je tudi ne more.
 */
export const UNKNOWN_ANSWER = -1;

export function isUnknownAnswer(value: number | undefined): boolean {
  return value === UNKNOWN_ANSWER;
}

/**
 * 'percent' polja so ulomek povsod — v default, min, max, step in v compute().
 * Samo widget jih pomnoži s 100 za prikaz. Doslej je bila ta pretvorba raztresena
 * po JSX-u v StepInputs in je bila vir tihe neskladnosti.
 * 'checkbox' hranimo kot 0/1, da ostane vnos enotno Record<string, number>.
 */
export type FieldKind = 'number' | 'slider' | 'percent' | 'choice' | 'checkbox';

export interface FieldChoice {
  /**
   * Vrednost, s katero modul računa (npr. ocena 0–3).
   *
   * POZOR: ModuleInput ključi radie po tej vrednosti in preverja `value === choice.value`.
   * Kadar več možnosti vodi do istega izida (npr. dva vzroka z istim naslovljivim
   * deležem), morajo biti vrednosti ZAPOREDNI INDEKSI, izid pa se poišče v tabeli —
   * sicer bi bila označena dva radia hkrati, React pa bi javil podvojen ključ.
   */
  value: number;
  label: string;
  /**
   * "Ne vem" — vrednost je konservativna privzeta ocena, ne uporabnikov podatek.
   * Znižuje oznako zanesljivosti rezultata.
   */
  unknown?: true;
}

/**
 * Skupni stroškovni predpostavki. Vprašani sta enkrat (korak pred moduli), ker je
 * strošek ure lastnost podjetja, ne posameznega stroškovnega področja — doslej ga
 * je vsak modul spraševal znova.
 *
 * "Operativna" in ne "proizvodna" ura: isti pojem je v proizvodnji ura operaterja,
 * v logistiki pa ura voznika ali skladiščnika. Ime, vezano na eno dejavnost, bi v
 * drugi zavajalo prav tam, kjer se odloča o velikosti zneska.
 */
export interface ComputeContext {
  operationalHourCostEUR: number;
  adminHourCostEUR: number;
  /**
   * Letni prihodek in prispevna marža — osnova za vsak odstotkovni izračun.
   *
   * V kontekstu in ne v modulu, ker sta lastnost podjetja: doslej je prihodek živel
   * v enem stroškovnem področju, nabavna vrednost pa v drugem. Kdor teh dveh področij
   * v triaži ni izbral (izbere jih tri od enajstih), je ostal brez vsake osnove —
   * odstotkovni izračuni so tiho padli na nič, marže pa ni vprašal nihče.
   *
   * Prihodek sme biti 0: prometa si ne izmišljamo. Pravilo "nikoli 0" velja za urne
   * postavke, ki množijo uporabnikove ure; tu je razmerje obrnjeno — vrednost množi
   * uporabnikov odstotek, zato bi izmišljen prihodek ustvaril izmišljen znesek.
   */
  annualRevenueEUR: number;
  /** Delež (0–1). Nikoli 0 — brez marže bi bila vsaka izgubljena prodaja vredna nič. */
  contributionMarginRate: number;
  /**
   * Povprečna ZARAČUNANA urna postavka — cena, ne strošek. Po njej se vrednoti
   * opravljeno, a nezaračunano delo: tam gre za izgubljen prihodek in ne za
   * vrednost porabljenega časa.
   *
   * Obvezna, čeprav jo vpraša samo storitvena dejavnost. Neobvezno polje bi
   * pomenilo `context.chargeOutRateEUR ?? 75` v vsakem modulu in eno mesto, kjer
   * se to pozabi — `undefined × ure × 12` je NaN, ki se izriše kot veljaven znesek.
   */
  chargeOutRateEUR: number;
  /**
   * Letni strošek financiranja (obresti oziroma oportunitetni donos) kot delež
   * (0–1). Množi denar, vezan v terjatvah in zalogah.
   *
   * Doslej fiksno 6 % (shared.ts) — legacy modul je isti koncept spraševal s
   * privzetkom 10 %, torej 67-odstotno neskladje za isto številko. Zdaj je del
   * skupne finančne osnove: vpraša ga dejavnost, katere moduli ga uporabljajo,
   * drugod obvelja privzetek 6 %. Nikoli 0 — denar ni nikjer zastonj.
   */
  capitalCostRate: number;
}

export interface ModuleField {
  key: string;
  /** Vprašanje v slovenščini, kot ga vidi obiskovalec. */
  label: string;
  kind: FieldKind;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  /**
   * Vedno v računski enoti. Odstotki se hranijo kot ulomek (0.05), prikažejo pa
   * kot 5 — pretvorbo dela ModuleSection, ne posamezni JSX kot doslej.
   */
  default: number;
  /** Obvezno za kind === 'choice'. */
  choices?: FieldChoice[];
  /** Pojasnilo pod poljem, npr. opozorilo, česa naj uporabnik ne šteje. */
  help?: string;
  /**
   * Daljše pojasnilo za gumb "?" ob polju: kaj vprašanje pomeni po domače,
   * konkreten primer in kako do ocene, kadar podatka nihče ne vodi.
   *
   * Neobvezno, ker ga polje brez `help` ne potrebuje — vprašanja tipa "koliko ur
   * mesečno" so razumljiva sama po sebi. Da ga nobeno polje s `help` ne izgubi,
   * skrbi test (modules/explainers.test.ts); tip tega ne more izraziti.
   */
  explainer?: string;
  /**
   * Polje sme dobiti odgovor "ne vem" (glej UNKNOWN_ANSWER). Smiselno pri zneskih,
   * ki jih podjetje bodisi vodi bodisi ne — odpis, manko, neizterjani rabati.
   *
   * Ni privzeto za vsa polja: pri urah in številu blagajn je "ne vem" izgovor, pri
   * vrednosti zadnje inventure pa dejstvo. Ponujena možnost "ne vem" tam, kjer je
   * odgovor mogoče oceniti, zniža kakovost vnosa namesto da bi jo zvišala.
   */
  allowUnknown?: true;
  /**
   * Polje se vpraša zaradi konteksta in NE vstopa v formulo. Ocena zanesljivosti
   * ga zato ne šteje med manjkajoče podatke. Doslej je bilo to zapisano samo v
   * besedilu help in ga koda ni mogla razlikovati.
   */
  contextOnly?: true;
}

export type RiskLevel = 'low' | 'medium' | 'high';

/** Kar vrne compute(); moduleId doda motor, da ga modulu ni treba ponavljati. */
export interface ModuleOutputDraft {
  bucket: BucketId;
  label: string;
  /** Odsoten pri bucket === 'risk'. */
  valueEUR?: number;
  /** Sproščene ure, kjer so smiselne (koš 'capacity'). */
  hoursPerMonth?: number;
  riskLevel?: RiskLevel;
  /** Npr. "marža pod tveganjem: 3–6 % prihodkov" — namerno pas, ne točen znesek. */
  note?: string;
  /**
   * Delež te postavke, ki ga je z boljšimi procesi sploh mogoče nasloviti (0–1),
   * izpeljan iz modulovega odgovora o glavnem vzroku.
   *
   * compute() vrne DEJANSKI sedanji strošek; realistični potencial izračuna motor
   * iz tega deleža in pasu izboljšave, ki je lastnost podjetja (sedanji sistem).
   * Modul torej ne more več sam vračunati "deleža izboljšave" v znesek in s tem
   * zabrisati razlike med tem, kar podjetje izgublja, in tem, kar lahko pridobi.
   *
   * Odsoten = postavka v potencial ne vstopa.
   */
  addressableShare?: number;
}

export interface ModuleOutput extends ModuleOutputDraft {
  /** Modul, iz katerega izid prihaja — za razčlenitev, graf in akcijski načrt. */
  moduleId: string;
}

export interface TriageQuestion {
  prompt: string;
  /** Vedno štiri možnosti; višja ocena pomeni večjo bolečino. */
  options: { value: 0 | 1 | 2 | 3; label: string }[];
}

export interface ModuleDefinition {
  /** Hkrati ključ v registru in ključ za methodology/actions v content/. */
  id: string;
  title: string;
  summary: string;
  /**
   * Diagnostični modul in E nista v triaži — sta kratka in se prikažeta vedno.
   * Modul brez triaže se torej nikoli ne izloči.
   */
  triage?: TriageQuestion;
  fields: ModuleField[];
  /**
   * Drugi parameter je neobvezen s stališča modula: TypeScript dovoli, da funkcija
   * z manj parametri zadosti tipu z več, zato moduli, ki skupnih predpostavk ne
   * potrebujejo, ostanejo `(input) => …`. Ob vklopljenem noUnusedParameters je to
   * celo edina oblika, ki se prevede, če konteksta ne uporabijo.
   */
  compute: (input: Record<string, number>, context: ComputeContext) => ModuleOutputDraft[];
  /** Funkcionalnosti PANTHEON, ki naslavljajo ta modul — prikaz na rezultatih in v PDF. */
  pantheon?: string[];
  /**
   * compute() množi context.annualRevenueEUR. Prihodek brez odgovora je namenoma 0
   * (glej ScaleQuestion.fallback) in tedaj te postavke tiho izpadejo — zastavica
   * omogoči, da ocena zanesljivosti pade na "nizko" in da razlaga pove, zakaj.
   * Skladnost z dejansko formulo varuje registrski test (compute.toString()).
   */
  usesRevenue?: true;
  /**
   * compute() množi context.contributionMarginRate. Marža ima neničeln privzetek,
   * zato manjkajoč odgovor ne izniči postavk — zastavica pove le, ali naj ocenjena
   * marža sploh šteje pri oceni zanesljivosti (dejavnosti, kjer je ne uporablja
   * noben izbran modul, zaradi nje ne smejo izgubiti oznake "visoka").
   */
  usesMargin?: true;
  /**
   * Tipičen letni razpon izgube tega področja za podjetje ciljne velikosti.
   *
   * REZERVIRANO za kalibracijo: polje se danes NE izpolnjuje in NE prikazuje —
   * okvirna številka brez empirije bi kršila jamstvo "nobene številke si ne
   * izmislimo". Ko bo zbranih dovolj vnosov (glej lib/exportRecord.ts), se sem
   * vpišejo izmerjeni razponi in prikaz neizmerjenih področij jih lahko pokaže
   * kot označen pas ("neizmerjeno, tipično X–Y EUR").
   */
  typicalAnnualLossBand?: { minEUR: number; maxEUR: number };
}

/** Privzete vrednosti modula kot zapis, primeren za compute(). */
export function moduleDefaults(definition: ModuleDefinition): Record<string, number> {
  const defaults: Record<string, number> = {};
  for (const field of definition.fields) {
    defaults[field.key] = field.default;
  }
  return defaults;
}
