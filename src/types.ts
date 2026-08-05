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
