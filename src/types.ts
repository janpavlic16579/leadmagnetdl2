import type { ModuleAInput, ModuleBInput, ModuleCInput, ModuleDInput, ModuleEChecked } from './lib/calculations';

export interface BasicInfo {
  /** id iz config/industries.ts — določa segment, če ta ni pripet prek ?s=. */
  industry: string;
  /** Velikostni razred se iz tega izpelje (config/sizeClasses.ts), ne vnaša posebej. */
  employeeCount: number;
}

export interface ModuleInputsState {
  A?: ModuleAInput;
  B?: ModuleBInput;
  C?: ModuleCInput;
  D?: ModuleDInput;
  E?: ModuleEChecked;
}

export type FlowStep = 'basicInfo' | 'inputs' | 'results' | 'emailGate' | 'changeSegment';
