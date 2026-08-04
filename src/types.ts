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

export type FlowStep = 'basicInfo' | 'triage' | 'inputs' | 'results' | 'emailGate' | 'changeSegment';
