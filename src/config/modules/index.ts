import { LEGACY_MODULES } from './legacy';
import { PROIZVODNJA_MODULES } from './proizvodnja';
import type { ModuleDefinition } from './moduleTypes';

/**
 * Register vseh modulov.
 *
 * Dodajanje nove dejavnosti: nova datoteka z definicijami, uvoz sem in vpis
 * moduleIds v ustrezen segment (config/segments.ts). Nič drugega.
 */
const ALL_MODULES: ModuleDefinition[] = [...LEGACY_MODULES, ...PROIZVODNJA_MODULES];

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
