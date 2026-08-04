import type { SegmentId } from './segmentTypes';

/**
 * Dejavnosti, med katerimi obiskovalec izbira v Koraku 1, in preslikava v segment.
 *
 * To je edino mesto, kjer se ureja seznam — marketing lahko doda dejavnost brez
 * poseganja v logiko. Dejavnosti, ki nimajo svojega segmenta, se preslikajo v
 * 'splosno' (splošni pogled za direktorja/CFO).
 *
 * Vrstni red določa vrstni red v spustnem seznamu; 'drugo' naj ostane zadnja.
 */
export interface IndustryOption {
  id: string;
  label: string;
  segment: SegmentId;
}

export const INDUSTRIES: IndustryOption[] = [
  { id: 'proizvodnja', label: 'Proizvodnja', segment: 'proizvodnja' },
  { id: 'trgovina', label: 'Trgovina, veleprodaja in distribucija', segment: 'trgovina' },
  { id: 'racunovodstvo', label: 'Računovodski servisi', segment: 'racunovodstvo' },
  { id: 'storitve', label: 'Storitvena in projektna podjetja', segment: 'splosno' },
  { id: 'maloprodaja', label: 'Maloprodaja', segment: 'trgovina' },
  // PANTHEON nima posebne logistične licence — licenci SE in ME (moduli LT, LT3)
  // pokrivata finance, naročila, dokumentacijo, stroške in obračunavanje, zato gre v segment 'trgovina'.
  { id: 'logistika', label: 'Logistika in transport', segment: 'trgovina' },
];

/** Varovalo: neznana ali prazna dejavnost pade v splošni pogled, nikoli v napako. */
export const FALLBACK_SEGMENT: SegmentId = 'splosno';

export function getSegmentForIndustry(industryId: string): SegmentId {
  return INDUSTRIES.find((industry) => industry.id === industryId)?.segment ?? FALLBACK_SEGMENT;
}

export function getIndustryLabel(industryId: string): string {
  return INDUSTRIES.find((industry) => industry.id === industryId)?.label ?? '';
}
