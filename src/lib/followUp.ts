import type { SegmentId } from '../config/segmentTypes';

export type FollowUpSequence =
  | 'high-loss-with-risk'
  | 'high-loss-no-risk'
  | 'low-loss-newsletter'
  | 'accounting-lm07-bridge';

export interface SelectFollowUpParams {
  segment: SegmentId;
  /** Samo neposredne letne izgube — sproščena kapaciteta in enkratni kapital ne štejeta. */
  directLossEUR: number;
  hasModuleERisk: boolean;
  highLossThresholdEUR?: number;
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
    params.highLossThresholdEUR !== undefined && params.directLossEUR > params.highLossThresholdEUR;

  if (isHighLoss) {
    return params.hasModuleERisk ? 'high-loss-with-risk' : 'high-loss-no-risk';
  }
  return 'low-loss-newsletter';
}
