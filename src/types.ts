export interface BasicInfo {
  /** id iz config/industries.ts — določa segment, če ta ni pripet prek ?s=. */
  industry: string;
  /** Velikostni razred se iz tega izpelje (config/sizeClasses.ts), ne vnaša posebej. */
  employeeCount: number;
}

/**
 * Uporabnikovi vnosi po modulu: { moduleId: { fieldKey: value } }.
 * Vsebuje samo tisto, kar je uporabnik dejansko spremenil — privzete vrednosti
 * dopolni resolveInputs, da modul nikoli ne dobi delnega vnosa.
 */
export type ModuleInputsState = Record<string, Record<string, number>>;

/**
 * Kontaktni podatki iz obrazca za prevzem poročila.
 *
 * Neobvezna polja so prazen niz in ne null: ujemajo se s sosednjimi in z izpisom
 * `|| '—'` v obeh izrisovalcih. Prazen niz je hkrati to, kar polje obrazca res
 * vrne — nedotaknjeno polje nima "odsotne" vrednosti, ki bi jo bilo treba pretvoriti.
 */
export interface LeadContact {
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  /** Neobvezno. Shranjen tako, kot ga je obiskovalec vpisal — svojo obliko pričakuje videti. */
  phone: string;
  /** Neobvezno. Shranjen NORMALIZIRAN: brez presledkov in brez predpone "SI". */
  taxNumber: string;
}

/**
 * Privolitve, ločene po namenu. Ena sama zastavica bi na revizijsko vprašanje
 * "ali je privolil v trženje?" ne mogla odgovoriti.
 */
export interface LeadConsents {
  /** OBVEZNA — brez nje obrazca ni mogoče oddati. */
  consentProcessing: boolean;
  consentOffers: boolean;
  consentContent: boolean;
}

export type FlowStep =
  | 'industry'
  /** Število zaposlenih — svoj korak, ker na izračun ne vpliva in ni del izbire dejavnosti. */
  | 'employeeCount'
  /** Kontekst dejavnosti — samo segmenti z vnosom v config/contexts/. */
  | 'context'
  | 'triage'
  /** Skupni urni postavki — samo segmenti z vnosom v config/contexts/. */
  | 'costBasis'
  | 'inputs'
  | 'results'
  /** Edini korak zunaj stepOrder — zato tudi edini brez oznake "Korak N od M". */
  | 'emailGate';
