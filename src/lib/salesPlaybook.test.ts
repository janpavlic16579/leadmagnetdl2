import { describe, it, expect } from 'vitest';
import { buildSalesPlaybook, type PlaybookInput } from './salesPlaybook';
import { scoreIcp, type IcpSignals } from '../config/icp';
import { ADDRESSABLE_SHARE } from '../config/modules/addressableShare';

/**
 * Playbook je uporaben natanko toliko, kolikor je SPROŽEN. Splošen seznam vprašanj
 * in ugovorov bi bil za prodajnika enak nič — vsakič bi moral sam ugotoviti, kaj
 * od tega velja. Testi zato varujejo sprožilce, ne besedil.
 */

const NOW = '2026-08-06T09:00:00.000Z';

const SIGNALS: IcpSignals = {
  employeeCount: 30,
  systemGapMax: 0.4,
  isPantheonCustomer: false,
  roleId: 'direktor',
  measuredLossEUR: 100_000,
  highLossThresholdEUR: 20_000,
  deadlineDates: [],
  confidence: 'medium',
  measuredAreaCount: 3,
  offeredAreaCount: 5,
  hasPhone: true,
  hasTaxNumber: false,
  consentOffers: true,
  generatedAtISO: NOW,
};

const BASE: PlaybookInput = {
  meta: {
    generatedAtISO: NOW,
    firstName: 'Janez',
    lastName: 'Novak',
    companyName: 'Testko d.o.o.',
    email: 'janez@testko.si',
    phone: '',
    taxNumber: '',
    consentProcessing: true,
    consentOffers: false,
    consentContent: false,
    consentConsulting: false,
    utmSource: null,
    taxNumberLooksValid: true,
  },
  clientView: {
    heroText: '109.440 EUR',
    derivativesText: null,
    payback: null,
    paybackNote: 'Tabele povračila stranka ni videla.',
    coverageText: null,
    accountingCapacityText: null,
  },
  qualification: {
    industryLabel: 'Trgovina, veleprodaja in distribucija',
    segmentName: 'Veleprodaja in distribucija',
    sizeClass: '10–49',
    employeeCount: 30,
    roleLabel: 'Direktor/-ica',
    roleOther: null,
    businessTypeLabel: 'Veleprodaja poslovnim kupcem',
    currentSystemLabel: 'Večinoma Excel, papir ali sprotni dogovor',
    isPantheonCustomer: false,
    systemGap: { min: 0.25, max: 0.4 },
    followUpSequence: 'high-loss-no-risk',
    deadlines: [],
    technicalRiskModuleShown: false,
  },
  summary: {
    directLossEUR: 45_000,
    lostMarginEUR: 0,
    rangeEUR: null,
    capacityEUR: 55_000,
    capacityHoursPerMonth: 200,
    oneTimeCapitalEUR: 0,
    confidence: 'medium',
    confidenceReason: 'Del vrednosti izhaja iz razponov.',
  },
  softness: { assumptions: [], unknownAnswers: [], unansweredChoices: [], untouchedFields: [], plausibilityWarning: null },
  triage: [],
  measured: [],
  risks: [],
  actionPlan: null,
  highestModuleTitle: null,
};

const play = (overrides: Partial<PlaybookInput> = {}, signals: Partial<IcpSignals> = {}) =>
  buildSalesPlaybook(
    { ...BASE, ...overrides },
    'trgovina',
    'excelPaper',
    scoreIcp({ ...SIGNALS, ...signals }),
  );

describe('Iztočnice za pogovor', () => {
  it('boleče, a neizmerjeno področje je PRVO — zanj v poročilu ni nobenega zneska', () => {
    const playbook = play({
      triage: [
        { moduleId: 'a', title: 'Zaloge', score: 1, scoreLabel: 'Občasno', selected: true, answered: true, annualEUR: 0 },
        { moduleId: 'b', title: 'Terjatve', score: 3, scoreLabel: 'Zamude so pravilo', selected: false, answered: false, annualEUR: null },
      ],
      softness: {
        assumptions: [],
        unknownAnswers: [{ moduleTitle: 'Zaloge', question: 'Kaj je glavni vzrok?' }],
        unansweredChoices: [],
        untouchedFields: [],
        plausibilityWarning: null,
      },
    });

    expect(playbook.openingQuestions[0].question).toContain('Terjatve');
    expect(playbook.openingQuestions[0].question).toContain('Zamude so pravilo');
  });

  it('izmerjeno področje z visoko oceno med iztočnice ne pride', () => {
    const playbook = play({
      triage: [
        { moduleId: 'a', title: 'Zaloge', score: 3, scoreLabel: 'Stalno', selected: true, answered: true, annualEUR: 0 },
      ],
    });
    expect(playbook.openingQuestions).toHaveLength(0);
  });

  it('stranka, ki je odgovorila na vse, dobi iztočnico o načinu dela in ne izmišljene številke', () => {
    const playbook = play({
      measured: [
        {
          moduleId: 'skladisce_trgovina',
          title: 'Skladišče',
          summary: '',
          totalEUR: 10_000,
          mainCauseLabel: null,
          addressableShare: 0.75,
          answers: [
            {
              question: 'Kako danes komisionirate?',
              answer: 'Po spominu in vprašanju sodelavca',
              contextOnly: true,
              answered: false,
              source: 'privzeto',
            },
          ],
          outputs: [],
          pantheon: [],
          cappedOutputs: [],
          methodology: null,
        },
      ],
    });

    expect(playbook.openingQuestions).toHaveLength(1);
    expect(playbook.openingQuestions[0].question).toContain('Po spominu');
  });

  it('seznam je omejen — več kot šest vprašanj sestanka ne odpre', () => {
    const many = Array.from({ length: 12 }, (_, index) => ({
      moduleTitle: `Področje ${index}`,
      question: `Vprašanje ${index}`,
    }));
    const playbook = play({
      softness: { assumptions: [], unknownAnswers: many, unansweredChoices: [], untouchedFields: many, plausibilityWarning: null },
    });
    expect(playbook.openingQuestions.length).toBeLessThanOrEqual(6);
  });
});

describe('Ugovori se sprožijo iz podatkov', () => {
  const ids = (playbook: ReturnType<typeof play>) => playbook.objections.map((item) => item.id);

  it('"to že imamo" samo pri obstoječem uporabniku PANTHEON', () => {
    expect(ids(play())).not.toContain('alreadyHavePantheon');
    expect(
      ids(play({ qualification: { ...BASE.qualification, isPantheonCustomer: true } })),
    ).toContain('alreadyHavePantheon');
  });

  it('"številka je pretirana" samo pri nizki zanesljivosti', () => {
    expect(ids(play())).not.toContain('inflatedNumber');
    expect(ids(play({ summary: { ...BASE.summary, confidence: 'low' } }))).toContain(
      'inflatedNumber',
    );
  });

  it('"to ni odvisno od nas" samo ob zunanjem glavnem vzroku', () => {
    const external = play({
      measured: [
        {
          moduleId: 'x',
          title: 'Odprema',
          summary: '',
          totalEUR: 1,
          mainCauseLabel: 'Prevozniki',
          // Simbolično: fixture s trdo 0,25 je ob kalibraciji deleža ostal zelen,
          // medtem ko je ugovor v prodajni pripravi tiho nehal delovati.
          addressableShare: ADDRESSABLE_SHARE.external,
          answers: [],
          outputs: [],
          pantheon: [],
          cappedOutputs: [],
          methodology: null,
        },
      ],
    });
    expect(ids(external)).toContain('externalCause');
    expect(ids(play())).not.toContain('externalCause');
  });

  it('"o tem ne odločam jaz" samo, kadar ni direktor ali lastnik', () => {
    expect(ids(play())).not.toContain('notMyDecision');
    expect(
      ids(play({ qualification: { ...BASE.qualification, roleLabel: 'Vodja skladišča' } })),
    ).toContain('notMyDecision');
  });

  it('vsak sprožen ugovor ima odgovor, ne le naslov', () => {
    for (const objection of play({ summary: { ...BASE.summary, confidence: 'low' } }).objections) {
      expect(objection.answer.length, objection.id).toBeGreaterThan(40);
      expect(objection.trigger.length, objection.id).toBeGreaterThan(10);
    }
  });
});

describe('Kaj ponuditi', () => {
  it('priporočilo se ujema s sedanjim sistemom', () => {
    expect(play().recommendedPantheon.headline).toContain('Celovita postavitev');

    const upgrade = buildSalesPlaybook(BASE, 'trgovina', 'pantheonNoWms', scoreIcp(SIGNALS));
    expect(upgrade.recommendedPantheon.headline).toContain('nadgradnja');
  });

  it('neznan sistem ne pusti praznega razdelka', () => {
    const unknown = buildSalesPlaybook(BASE, 'trgovina', null, scoreIcp(SIGNALS));
    expect(unknown.recommendedPantheon.headline).toBeTruthy();
    expect(unknown.recommendedPantheon.why).toContain('prvo vprašanje');
  });

  it('alineje prihajajo iz področja z največjo postavko', () => {
    const playbook = play({
      measured: [
        {
          moduleId: 'majhno',
          title: 'Majhno',
          summary: '',
          totalEUR: 1_000,
          mainCauseLabel: null,
          addressableShare: null,
          answers: [],
          outputs: [],
          pantheon: ['Napačna alineja'],
          cappedOutputs: [],
          methodology: null,
        },
        {
          moduleId: 'veliko',
          title: 'Veliko',
          summary: '',
          totalEUR: 90_000,
          mainCauseLabel: null,
          addressableShare: null,
          answers: [],
          outputs: [],
          pantheon: ['Prava alineja'],
          cappedOutputs: [],
          methodology: null,
        },
      ],
    });
    expect(playbook.recommendedPantheon.addresses).toEqual(['Prava alineja']);
  });
});

describe('Velikost posla in nujnost', () => {
  it('potekel rok da visoko nujnost', () => {
    expect(play({}, { deadlineDates: ['2026-07-14'] }).dealSizing.urgency).toBe('visoka');
    expect(play({}, { deadlineDates: [] }).dealSizing.urgency).toBe('nizka');
  });

  it('razlog nujnosti govori o roku in ne ponavlja zneska', () => {
    /**
     * Znesek stoji v razdelku 1 dve vrstici više, in sicer v obliki, ki jo bere
     * stranka (razpon oziroma "najmanj X" — glej SalesReportClientView). Gola točka v
     * tej vrstici je izgledala kot druga številka o isti stvari. Da je znesek spodnja
     * meja, odslej pove sam zapis zneska in razlaga zanesljivosti.
     */
    const playbook = play({ summary: { ...BASE.summary, confidence: 'low' } });
    expect(playbook.dealSizing.urgencyReason).not.toContain('EUR');
    expect(playbook.dealSizing.measuredLossEUR).toBeGreaterThan(0);
  });

  it('velikost posla izhaja iz števila zaposlenih', () => {
    expect(play().dealSizing.sizeLabel).toBe('srednji posel');
    expect(
      play({ qualification: { ...BASE.qualification, employeeCount: 200 } }).dealSizing.sizeLabel,
    ).toBe('večji posel');
  });
});
