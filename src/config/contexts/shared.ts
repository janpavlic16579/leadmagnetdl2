import type { CostBand } from './contextTypes';

/**
 * Gradniki, ki jih deli več dejavnosti.
 *
 * Doslej je administrativne razpone izvažal kontekst proizvodnje, logistika in
 * maloprodaja pa sta ju uvažali iz njega. Ob četrti dejavnosti to ni več vzdržno:
 * dejavnost bi bila odvisna od sosednje, brisanje proizvodnje pa bi podrlo vse
 * ostale. Skupno naj bo skupno, ne last prve dejavnosti, ki ga je potrebovala.
 */

/** Vodstveno in pisarniško delo se med dejavnostmi razlikuje bistveno manj kot operativno. */
export const ADMIN_HOUR_BANDS: CostBand[] = [
  { id: 'do25', label: 'Do 25 EUR', midpointEUR: 20, minEUR: 15, maxEUR: 25 },
  { id: '25do35', label: '25–35 EUR', midpointEUR: 30, minEUR: 25, maxEUR: 35 },
  { id: '35do50', label: '35–50 EUR', midpointEUR: 42, minEUR: 35, maxEUR: 50 },
  { id: 'nad50', label: 'Več kot 50 EUR', midpointEUR: 60, minEUR: 50, maxEUR: 70 },
];
