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
  /** Vrednost sproščene delovne in proizvodne kapacitete — ni prihranek pri plačah. */
  | 'capacity'
  /** Enkratno sprostljiv kapital (zaloge) — nikoli se ne sešteva z letnimi zneski. */
  | 'oneTimeCapital'
  /** Kvalitativna ocena tveganja — brez EUR, ker bi bil znesek navidezno natančen. */
  | 'risk';

/**
 * 'percent' polja so ulomek povsod — v default, min, max, step in v compute().
 * Samo widget jih pomnoži s 100 za prikaz. Doslej je bila ta pretvorba raztresena
 * po JSX-u v StepInputs in je bila vir tihe neskladnosti.
 * 'checkbox' hranimo kot 0/1, da ostane vnos enotno Record<string, number>.
 */
export type FieldKind = 'number' | 'slider' | 'percent' | 'choice' | 'checkbox';

export interface FieldChoice {
  /** Vrednost, s katero modul računa (npr. delež izboljšave ali ocena 0–3). */
  value: number;
  label: string;
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
   * Diagnostični moduli (marža, sledljivost) in E niso v triaži — so kratki in se
   * prikažejo vedno. Modul brez triaže se torej nikoli ne izloči.
   */
  triage?: TriageQuestion;
  fields: ModuleField[];
  compute: (input: Record<string, number>) => ModuleOutputDraft[];
  /** Funkcionalnosti PANTHEON, ki naslavljajo ta modul — prikaz na rezultatih in v PDF. */
  pantheon?: string[];
}

/** Privzete vrednosti modula kot zapis, primeren za compute(). */
export function moduleDefaults(definition: ModuleDefinition): Record<string, number> {
  const defaults: Record<string, number> = {};
  for (const field of definition.fields) {
    defaults[field.key] = field.default;
  }
  return defaults;
}
