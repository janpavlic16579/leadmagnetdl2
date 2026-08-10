/**
 * Tipi konteksta dejavnosti.
 *
 * Doslej je bil kontekst zapisan kot `manufacturingContext.ts` — nizovne unije za
 * proizvodnjo in tabela pasov izboljšave, ki jo je bilo treba ročno držati v skladu
 * s seznamom možnosti. Ker mora vsaka dejavnost vprašati svoje (proizvodnja za način
 * proizvodnje, maloprodaja za obliko prodaje), je kontekst zdaj — enako kot moduli —
 * PODATEK: en objekt na segment pove, kaj vpraša, kateri sistem da kakšen pas
 * izboljšave in kako se imenujeta urni postavki.
 *
 * Pas izboljšave visi neposredno na možnosti sistema, ne v ločeni tabeli. Zaradi tega
 * ni več mogoče dodati sistema brez pasu — prej je bila to dvojna evidenca, ki se je
 * lahko tiho razšla.
 *
 * Enumov ni, ker je v tsconfig vklopljen erasableSyntaxOnly.
 */

export interface ContextOption {
  /** Zapiše se v izvozni zapis za CRM, zato naj ostane stabilen. */
  id: string;
  label: string;
}

/** Delež naslovljivega stroška, ki ga je realno mogoče odpraviti — vedno pas, ne točka. */
export interface ImprovementBand {
  min: number;
  max: number;
}

export interface SystemOption extends ContextOption {
  /**
   * KALIBRACIJA: začetne ocene, ne empirija. Podjetje, ki že uporablja ustrezen
   * modul PANTHEON, je najlažje izboljšave večinoma že pobralo, zato je njegov pas
   * najnižji. Po prvih ~50 vnosih je pasove treba preveriti na realnih podatkih.
   */
  band: ImprovementBand;
  /**
   * Obstoječi uporabnik PANTHEON. Tehnična opozorila (SQL Server, Windows Server,
   * ZIERDED) so smiselna samo tem — drugim niso prihranek, ampak šum.
   */
  isPantheon?: true;
}

export interface ContextQuestion<T extends ContextOption = ContextOption> {
  legend: string;
  options: T[];
}

export interface CostBand {
  id: string;
  label: string;
  /** Sredina razpona — nikoli 0, da manjkajoč podatek ne izniči formule. */
  midpointEUR: number;
}

export interface CostQuestion {
  label: string;
  help: string;
  bands: CostBand[];
  /** Vrednost, na katero pade prazen vnos — nikoli 0. */
  fallbackEUR: number;
}

/**
 * Velikostna predpostavka, ki ni urna postavka: letni prihodek in prispevna marža.
 *
 * Ločen tip in ne CostQuestion z drugačno enoto: marža je delež in ne evro, zato bi
 * `valueEUR: 0.25` bralca zavedlo prav pri številki, ki množi vse ostale. Sredina
 * pasu je tudi tu vrednost, ki obvelja, kadar obiskovalec točnega podatka nima.
 */
export interface ScaleBand {
  id: string;
  label: string;
  /** Sredina razpona; pri deležih ulomek (0,235), ne odstotek. */
  midpoint: number;
}

export interface ScaleQuestion {
  label: string;
  help: string;
  bands: ScaleBand[];
  /**
   * Vrednost ob praznem vnosu.
   *
   * Pri prihodku je 0 pravilna in edina poštena: prihodek množi uporabnikov odstotek,
   * zato bi izmišljena vrednost ustvarila izmišljen znesek. Pri marži je 0 prepovedana —
   * vsaka izgubljena prodaja bi bila vredna nič.
   */
  fallback: number;
  unit: string;
  /** Vrednost je ulomek, prikaže pa se kot odstotek. */
  asPercent?: true;
}

/**
 * Kontekst ene dejavnosti: tri vprašanja brez številk in dve urni postavki.
 *
 * Nobeden od teh odgovorov ne vstopa v formulo posameznega modula. Določajo dvoje:
 * kako velik del izmerjenega stroška je realno mogoče nasloviti (pas izboljšave) in
 * ali so tehnična opozorila za tega obiskovalca sploh smiselna.
 */
export interface SegmentContext {
  /** Naslov koraka konteksta, npr. "Nekaj o vaši proizvodnji". */
  title: string;
  intro: string;
  /** Uvod koraka s skupno finančno osnovo — enoti se med dejavnostmi razlikujeta. */
  costBasisIntro: string;
  businessType: ContextQuestion;
  currentSystem: ContextQuestion<SystemOption>;
  role: ContextQuestion;
  /**
   * Ura tistih, ki delajo neposredno na blagu oziroma izdelku: v proizvodnji
   * operater, v maloprodaji prodajalec ali skladiščnik.
   */
  operationalHour: CostQuestion;
  adminHour: CostQuestion;
  /**
   * Letni prihodek in prispevna marža — skupna osnova za odstotkovne izračune.
   *
   * Vprašata ju dejavnosti, kjer se izguba meri kot delež prometa (maloprodaja).
   * Doslej je prihodek živel v enem stroškovnem področju in nabavna vrednost v
   * drugem: kdor teh dveh področij v triaži ni izbral, je ostal brez osnove, marže
   * pa ni vprašal nihče — čeprav sta obe številki lastnost podjetja in ne področja.
   */
  annualRevenue?: ScaleQuestion;
  contributionMargin?: ScaleQuestion;
  /**
   * Povprečna ZARAČUNANA urna postavka — koliko podjetje za uro dela zaračuna
   * naročniku. Vpraša jo samo dejavnost, ki prodaja ure (storitve in projekti).
   *
   * Ni strošek, ampak cena: opravljena, a nezaračunana ura je izgubljen prihodek
   * in ne vrednost porabljenega časa, zato se vrednoti po tej postavki in ne po
   * strošku ure. Proizvodnja in logistika je ne vprašata — tam se ure ne prodajajo.
   */
  chargeOutRate?: CostQuestion;
}

/**
 * Vrednost skupne predpostavke in podatek, ali jo je uporabnik vnesel ali le izbral
 * razpon. Zastavica je nujna: "ne vem" ni isto kot 0 in mora znižati zanesljivost
 * rezultata, hraniti pa je v Record<string, number> ni mogoče.
 */
export interface CostAssumption {
  valueEUR: number;
  estimated: boolean;
}

/** Isto za velikostne predpostavke; `value` je EUR ali delež, odvisno od vprašanja. */
export interface ScaleAssumption {
  value: number;
  estimated: boolean;
}

/**
 * Odgovori obiskovalca na kontekstna vprašanja. Id-ji so nizi, ker jih določi
 * konfiguracija dejavnosti — pomen posameznega id-ja je zapisan v njej.
 */
export interface BusinessProfile {
  businessType: string | null;
  currentSystem: string | null;
  role: string | null;
  operationalHour: CostAssumption;
  adminHour: CostAssumption;
  /**
   * Prisotna tudi pri dejavnostih, ki je ne vprašajo. Neobvezno polje bi pomenilo,
   * da modul piše `?? nekaj` in ga nekje pozabi — `undefined × ure × 12` je NaN,
   * ki se v rezultatih izriše kot veljaven izračun.
   */
  chargeOutRate: CostAssumption;
  /**
   * Prisotna tudi pri dejavnostih, ki ju ne vprašata — iz istega razloga kot
   * chargeOutRate: neobvezno polje bi pomenilo `?? nekaj` v vsakem modulu.
   */
  annualRevenue: ScaleAssumption;
  contributionMargin: ScaleAssumption;
}

/** Brez odgovora vzamemo srednji pas — nikoli najugodnejšega. */
export const FALLBACK_IMPROVEMENT_BAND: ImprovementBand = { min: 0.15, max: 0.3 };

/**
 * Prazen profil za dano dejavnost: neizbrano, urni postavki označeni kot ocenjeni.
 * Segment brez konteksta profila ne uporablja (njegovi moduli imajo lastna polja
 * za strošek ure), zato sta vrednosti tam le nevtralno varovalo — nikoli 0.
 */
export function emptyProfileFor(context: SegmentContext | undefined): BusinessProfile {
  return {
    businessType: null,
    currentSystem: null,
    role: null,
    operationalHour: { valueEUR: context?.operationalHour.fallbackEUR ?? 45, estimated: true },
    adminHour: { valueEUR: context?.adminHour.fallbackEUR ?? 35, estimated: true },
    chargeOutRate: { valueEUR: context?.chargeOutRate?.fallbackEUR ?? 75, estimated: true },
    // Prihodek brez odgovora ostane 0: odstotkovna polja tedaj ne dajo nobenega
    // evra. To je namen — izmišljen promet bi ustvaril izmišljeno izgubo.
    annualRevenue: { value: context?.annualRevenue?.fallback ?? 0, estimated: true },
    contributionMargin: { value: context?.contributionMargin?.fallback ?? 0.25, estimated: true },
  };
}
