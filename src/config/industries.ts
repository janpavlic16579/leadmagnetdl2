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
  { id: 'kovinarstvo', label: 'Kovinska predelava', segment: 'proizvodnja' },
  { id: 'zivilstvo', label: 'Živilska proizvodnja', segment: 'proizvodnja' },
  { id: 'lesarstvo', label: 'Lesna in pohištvena industrija', segment: 'proizvodnja' },
  { id: 'veleprodaja', label: 'Veleprodaja / distribucija', segment: 'trgovina' },
  { id: 'logistika', label: 'Logistika / transport', segment: 'trgovina' },
  { id: 'maloprodaja', label: 'Maloprodaja', segment: 'trgovina' },
  { id: 'racunovodstvo', label: 'Računovodski servis', segment: 'racunovodstvo' },
  { id: 'gradbenistvo', label: 'Gradbeništvo', segment: 'splosno' },
  { id: 'storitve', label: 'Storitve', segment: 'splosno' },
  { id: 'it', label: 'IT / programska oprema', segment: 'splosno' },
  { id: 'drugo', label: 'Drugo', segment: 'splosno' },
];

/** Varovalo: neznana ali prazna dejavnost pade v splošni pogled, nikoli v napako. */
export const FALLBACK_SEGMENT: SegmentId = 'splosno';

export function getSegmentForIndustry(industryId: string): SegmentId {
  return INDUSTRIES.find((industry) => industry.id === industryId)?.segment ?? FALLBACK_SEGMENT;
}

export function getIndustryLabel(industryId: string): string {
  return INDUSTRIES.find((industry) => industry.id === industryId)?.label ?? '';
}
