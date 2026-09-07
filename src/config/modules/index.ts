import { HORIZONTAL_MODULES } from './horizontal';
import { INZENIRING_MODULES } from './inzeniring';
import { KOVINARSTVO_MODULES } from './kovinarstvo';
import { LOGISTIKA_MODULES } from './logistika';
import { MALOPRODAJA_MODULES } from './maloprodaja';
import { moduleE } from './moduleE';
import { PLASTIKA_MODULES } from './plastika';
import { PROIZVODNJA_MODULES } from './proizvodnja';
import { RACUNOVODSTVO_MODULES } from './racunovodstvo';
import { SPLOSNO_MODULES } from './splosno';
import { STORITVE_MODULES } from './storitve';
import { GRADBENISTVO_MODULES } from './gradbenistvo';
import { TRGOVINA_MODULES } from './trgovina';
import { ZIVILSTVO_MODULES } from './zivilstvo';
import type { ModuleDefinition } from './moduleTypes';

/**
 * Register vseh modulov.
 *
 * Dodajanje nove dejavnosti: nova datoteka z definicijami, uvoz sem in vpis
 * moduleIds v ustrezen segment (config/segments.ts). Nič drugega.
 *
 * Id-ji morajo biti unikatni čez VSE dejavnosti: register je ena preslikava, zato
 * bi podvojen id tiho povozil prejšnji modul in kalkulator bi vprašal napačna
 * vprašanja. Enakost velikosti registra in seznama varuje test v moduleEngine.test.ts.
 */
export const ALL_MODULES: ModuleDefinition[] = [
  moduleE,
  ...PROIZVODNJA_MODULES,
  ...ZIVILSTVO_MODULES,
  ...KOVINARSTVO_MODULES,
  ...PLASTIKA_MODULES,
  ...LOGISTIKA_MODULES,
  ...TRGOVINA_MODULES,
  ...MALOPRODAJA_MODULES,
  ...STORITVE_MODULES,
  ...GRADBENISTVO_MODULES,
  ...INZENIRING_MODULES,
  ...RACUNOVODSTVO_MODULES,
  ...SPLOSNO_MODULES,
  ...HORIZONTAL_MODULES,
];

export const MODULE_REGISTRY: Record<string, ModuleDefinition> = Object.fromEntries(
  ALL_MODULES.map((definition) => [definition.id, definition]),
);

/**
 * Definicije za dane id-je, v podanem vrstnem redu. Neznan id se tiho preskoči —
 * napačna konfiguracija segmenta ne sme podreti kalkulatorja obiskovalcu.
 */
export function getModules(ids: string[]): ModuleDefinition[] {
  return ids.map((id) => MODULE_REGISTRY[id]).filter((definition) => definition !== undefined);
}

export type { ModuleDefinition };
export * from './moduleTypes';
