import type { SegmentId } from '../config/segmentTypes';

export type FollowUpSequence =
  | 'high-loss-with-risk'
  | 'high-loss-no-risk'
  | 'low-loss-newsletter'
  | 'accounting-lm07-bridge';

/**
 * Kaj se s stranko zgodi po oddaji, povedano kot NAŠE dejanje.
 *
 * Ključi so interna triaža ("low-loss-newsletter" pomeni, da je izmerjena izguba pod
 * pragom), dokument pa se v rezervnem načinu prenese na napravo stranke — dobesedni
 * prevod bi ji torej sporočil, kam smo jo uvrstili. Oznaka zato opisuje korak, ki ga
 * naredimo mi, in ne lastnosti podjetja.
 *
 * `Record` čez celotno unijo je namerna: nov ključ brez oznake ne prevede.
 */
export const FOLLOW_UP_SEQUENCE_LABEL: Record<FollowUpSequence, string> = {
  'high-loss-with-risk': 'Klic svetovalca, prednostno zaradi tehničnega roka',
  'high-loss-no-risk': 'Klic svetovalca',
  'low-loss-newsletter': 'E-vsebine in vabila na dogodke',
  'accounting-lm07-bridge': 'Ponudba za računovodske servise',
};

export function followUpSequenceLabel(sequence: FollowUpSequence): string {
  return FOLLOW_UP_SEQUENCE_LABEL[sequence];
}

export interface SelectFollowUpParams {
  segment: SegmentId;
  /**
   * Letna izmerjena izguba: neposredni stroški + nezaslužena marža. Sproščena
   * kapaciteta in enkratni kapital ne štejeta — kapaciteta ni denar, ki odteka,
   * kapital pa je enkraten. Marža šteje, ker je prag "visoke izgube" merilo letne
   * bolečine, pri maloprodaji pa je prav marža njena največja postavka.
   */
  annualLossEUR: number;
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
    params.highLossThresholdEUR !== undefined && params.annualLossEUR > params.highLossThresholdEUR;

  if (isHighLoss) {
    return params.hasModuleERisk ? 'high-loss-with-risk' : 'high-loss-no-risk';
  }
  return 'low-loss-newsletter';
}
