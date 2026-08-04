import { describe, it, expect } from 'vitest';
import { selectFollowUpSequence } from './followUp';

describe('selectFollowUpSequence', () => {
  it('visoka izguba + E-tveganje -> high-loss-with-risk', () => {
    const seq = selectFollowUpSequence({
      segment: 'proizvodnja',
      directLossEUR: 20000,
      hasModuleERisk: true,
      highLossThresholdEUR: 15000,
    });
    expect(seq).toBe('high-loss-with-risk');
  });

  it('visoka izguba brez E-tveganja -> high-loss-no-risk', () => {
    const seq = selectFollowUpSequence({
      segment: 'proizvodnja',
      directLossEUR: 20000,
      hasModuleERisk: false,
      highLossThresholdEUR: 15000,
    });
    expect(seq).toBe('high-loss-no-risk');
  });

  it('nizka izguba -> low-loss-newsletter', () => {
    const seq = selectFollowUpSequence({
      segment: 'proizvodnja',
      directLossEUR: 5000,
      hasModuleERisk: true,
      highLossThresholdEUR: 15000,
    });
    expect(seq).toBe('low-loss-newsletter');
  });

  it('računovodstvo vedno -> accounting-lm07-bridge, ne glede na višino', () => {
    const seq = selectFollowUpSequence({
      segment: 'racunovodstvo',
      directLossEUR: 0,
      hasModuleERisk: false,
    });
    expect(seq).toBe('accounting-lm07-bridge');
  });
});
