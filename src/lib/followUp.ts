import type { SegmentId } from '../config/segmentTypes';

export type FollowUpSequence =
  | 'high-loss-with-risk'
  | 'high-loss-no-risk'
  | 'low-loss-newsletter'
  | 'accounting-lm07-bridge';

export interface SelectFollowUpParams {
  segment: SegmentId;
  totalAnnualLossEUR: number;
  hasModuleERisk: boolean;
  highLossThresholdEUR?: number;
  /** Samo za računovodstvo: prag je v urah/mesec sproščenega časa, ne v EUR. */
  highLossThresholdHoursPerMonth?: number;
  hoursFreedPerMonth?: number;
}

/**
 * Pragovi za "visoko izgubo" so začetne ocene (glej config/segments.ts) —
 * po prvih 50 vnosih jih je treba kalibrirati na realnih podatkih (spec pogl. 6).
 */
export function selectFollowUpSequence(params: SelectFollowUpParams): FollowUpSequence {
  if (params.segment === 'racunovodstvo') {
    // Računovodski servis vedno dobi most k paketu LM-07, ne glede na višino izgube.
    return 'accounting-lm07-bridge';
  }

  const isHighLoss =
    params.highLossThresholdEUR !== undefined && params.totalAnnualLossEUR > params.highLossThresholdEUR;

  if (isHighLoss) {
    return params.hasModuleERisk ? 'high-loss-with-risk' : 'high-loss-no-risk';
  }
  return 'low-loss-newsletter';
}
