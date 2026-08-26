import { describe, expect, it } from 'vitest';
import {
  confidenceReasonPdf,
  confidenceReasonScreen,
  type ConfidenceSignals,
} from './confidenceReason';

/**
 * Ubeseditev razloga zanesljivosti za zaslon in strankin PDF.
 *
 * Signale samé šteje collectConfidenceSignals; da se štetje ujema s prodajno
 * pripravo, varuje salesReport.test.ts (buildConfidenceReason bere iste
 * signale). Tu se preverja tisto, česar tam ni: slovenske oblike ob števniku
 * in da razlaga NE trdi več "podatki manjkajo", kadar so ocene le urne postavke.
 */

const NONE: ConfidenceSignals = {
  revenueMissing: false,
  estimatedRates: 0,
  askedRates: 2,
  unknownChoices: 0,
  unansweredChoices: 0,
  untouchedNumeric: 0,
};

describe('confidenceReasonScreen', () => {
  it('brez signalov vrne null — oznako tedaj pojasni splošno besedilo', () => {
    expect(confidenceReasonScreen(NONE)).toBeNull();
  });

  it('obe oceni urni postavki poimenuje kot panožno oceno, ne kot manjkajoč podatek', () => {
    const reason = confidenceReasonScreen({ ...NONE, estimatedRates: 2 });
    expect(reason).toContain('obe urni postavki sta panožni oceni');
    expect(reason).toContain('ne vaš podatek');
    expect(reason).not.toContain('manjka');
  });

  it('eno od dveh postavk izpiše v ednini in kot delno oceno', () => {
    expect(confidenceReasonScreen({ ...NONE, estimatedRates: 1 })).toContain(
      'ena od urnih postavk je panožna ocena',
    );
  });

  it('tri od treh postavk (storitve) zajame z "vse"', () => {
    expect(confidenceReasonScreen({ ...NONE, askedRates: 3, estimatedRates: 3 })).toContain(
      'vse urne postavke so panožne ocene',
    );
  });

  it('dvojina za dve prazni polji, množina za pet', () => {
    expect(confidenceReasonScreen({ ...NONE, untouchedNumeric: 2 })).toContain(
      'dve številski polji sta ostali prazni in štejeta kot 0',
    );
    expect(confidenceReasonScreen({ ...NONE, untouchedNumeric: 5 })).toContain(
      '5 številskih polj je ostalo praznih in štejejo kot 0',
    );
  });

  it('razloge zloži v en stavek z okvirjem "najmanj"', () => {
    const reason = confidenceReasonScreen({
      ...NONE,
      revenueMissing: true,
      estimatedRates: 2,
      unknownChoices: 1,
    });
    expect(reason).toMatch(/^Zneski so označeni kot "najmanj"\. Razlog: /);
    expect(reason).toContain('prihodka niste vnesli');
    expect(reason).toContain('enkrat ste odgovorili z "Ne vem"');
    expect(reason).toContain('Dejanski so praviloma višji, ne nižji.');
  });
});

describe('confidenceReasonPdf', () => {
  it('govori brezosebno — dokument bere nekdo, ki obrazca ni izpolnil', () => {
    const reason = confidenceReasonPdf({
      ...NONE,
      revenueMissing: true,
      estimatedRates: 2,
      unknownChoices: 2,
      unansweredChoices: 1,
    });
    expect(reason).toMatch(/^Zneski so spodnja meja\. Razlog: /);
    expect(reason).toContain('ne izmerjen podatek');
    expect(reason).toContain('dvakrat je izbran odgovor "Ne vem"');
    expect(reason).toContain('eno izbirno vprašanje je brez odgovora');
    expect(reason).not.toContain(' ste ');
    expect(reason).not.toContain('vaš');
  });

  it('brez signalov vrne null', () => {
    expect(confidenceReasonPdf(NONE)).toBeNull();
  });
});
