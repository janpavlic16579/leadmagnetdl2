import { describe, expect, it, vi } from 'vitest';
import { deliverLead, loadDeliveryModules, type DeliverLeadInput, type DeliverLeadModules } from './deliverLead';
import type { DownloadFile } from './download';
import type { LeadSubmission } from './submitLead';
import { computeModules, findHighestModule, resolveInputs } from './moduleEngine';
import { aggregateResults, assessConfidence, buildComputeContext } from './potential';
import { getModules } from '../config/modules';
import { SEGMENTS } from '../config/segments';
import { emptyProfileFor, getSegmentContext } from '../config/contexts';

/**
 * Pravilo, ki ga varuje ta test: KAM GRE PRODAJNA PRIPRAVA.
 *
 * Ob DELUJOČEM webhooku se stranki ne sme ponuditi — dokument nosi oceno
 * ustreznosti, priporočilo licenc in pričakovane ugovore, torej je napisan O
 * stranki in ne ZANJO. Dokler webhook ni nastavljen (ali dostava ne uspe), je
 * pot prek stranke edina, po kateri svetovalec pripravo dobi, zato se tedaj
 * MORA ponuditi — a samo kot gumb na rezultatih, nikoli kot samodejni prenos.
 *
 * Ta razlika je prav tisto, kar se ob urejanju dostave najlažje pomotoma obrne;
 * dokler je koda živela v komponenti, je ni preverjal noben test (vitest teče
 * brez jsdom).
 */

function scenario(): DeliverLeadInput {
  const segment = SEGMENTS.proizvodnja;
  const context = getSegmentContext('proizvodnja');
  const profile = emptyProfileFor(context);
  const modules = getModules(segment.moduleIds);
  const values: Record<string, Record<string, number>> = {};
  for (const definition of modules) values[definition.id] = resolveInputs(definition, undefined);

  const outputs = computeModules(modules, values, buildComputeContext(profile));
  const totals = aggregateResults(outputs, {
    includePotential: context !== undefined,
    confidence: context
      ? assessConfidence({ profile, context, modules, values, outputs })
      : undefined,
  });

  const highestModule = findHighestModule(outputs, segment.moduleIds);
  const coverage = { measuredCount: 0, offeredCount: 10, unmeasured: [] };

  return {
    contact: {
      firstName: 'Test',
      lastName: 'Testni',
      companyName: 'Testno podjetje d.o.o.',
      email: 'test@example.com',
      phone: '',
      taxNumber: '',
    },
    consents: { consentProcessing: true, consentOffers: false, consentContent: false, consentConsulting: false },
    utmSource: null,
    internalMode: false,
    segment,
    context,
    profile,
    industry: 'proizvodnja',
    employeeCount: 45,
    segmentModules: modules,
    activeModules: modules,
    values,
    triageScores: {},
    outputs,
    totals,
    totalsRange: null,
    highestModule,
    coverage,
    followUpSequence: 'low-loss-newsletter',
    customerPdf: {
      segment,
      companyName: 'Testno podjetje d.o.o.',
      employeeCount: 45,
      outputs,
      totals,
      totalsRange: null,
      coverage,
      highestModule,
      confidenceReason: null,
    },
  };
}

/** Poceni generator namesto jsPDF: testi dostave ne merijo izrisa (to je pdfSmoke). */
function fakePdf(filename: string): () => Promise<DownloadFile> {
  return async () => ({ filename, blob: new Blob(['%PDF-1.4 testni dokument']) });
}

/** Prestrežene poti navzven: webhook in stanje. */
function harness(overrides: Partial<DeliverLeadModules>, real: DeliverLeadModules) {
  /** Vrstni red poti navzven — lovi, ali se rezultati odklenejo pred odločitvijo o pripravi. */
  const order: ('webhook' | 'salesReport' | 'submitted')[] = [];
  const posted: LeadSubmission[] = [];
  let salesReportSet = false;
  let submitted = false;

  const merged: DeliverLeadModules = {
    ...real,
    leadWebhookUrl: () => null,
    submitLead: async (submission) => {
      posted.push(submission);
      return true;
    },
    buildResultsPdfFile: fakePdf('porocilo.pdf'),
    buildSalesPdfFile: fakePdf('priprava.pdf'),
    ...overrides,
  };

  // Sled se ovije OKOLI morebitne zamenjave: test, ki podtakne svoj submitLead,
  // sicer tiho izgubi zapis o webhooku in trditev o vrstnem redu ne pove ničesar.
  const modules: DeliverLeadModules = {
    ...merged,
    submitLead: async (submission, url) => {
      order.push('webhook');
      return merged.submitLead(submission, url);
    },
  };

  const hooks = {
    onSalesReport: () => {
      order.push('salesReport');
      salesReportSet = true;
    },
    onSubmitted: () => {
      order.push('submitted');
      submitted = true;
    },
  };

  return {
    modules,
    hooks,
    order,
    posted,
    state: () => ({ salesReportSet, submitted }),
  };
}

describe('Dostava po oddaji', () => {
  it('brez webhooka: priprava se ponudi stranki, da jo posreduje svetovalcu', async () => {
    const real = await loadDeliveryModules();
    const h = harness({}, real);

    await deliverLead(scenario(), h.modules, h.hooks);

    // Gumb "Priprava v PDF" na rezultatih visi na tem stanju.
    expect(h.state().salesReportSet).toBe(true);
    expect(h.posted).toHaveLength(0);
    expect(h.state().submitted).toBe(true);
  });

  it('z webhookom: priprava gre na strežnik in se stranki NE ponudi', async () => {
    const real = await loadDeliveryModules();
    const h = harness({ leadWebhookUrl: () => 'https://example.test/webhook' }, real);

    await deliverLead(scenario(), h.modules, h.hooks);

    expect(h.posted).toHaveLength(1);
    expect(h.posted[0]?.salesReportHtml).toContain('<!doctype html>');
    expect(h.posted[0]?.record.email).toBe('test@example.com');
    // Jedro pravila: uspešna dostava pomeni, da stranka priprave ne vidi.
    expect(h.state().salesReportSet).toBe(false);
    expect(h.state().submitted).toBe(true);
  });

  it('neuspela dostava: priprava se ponudi stranki, da se lead ne izgubi', async () => {
    const real = await loadDeliveryModules();
    const h = harness(
      {
        leadWebhookUrl: () => 'https://example.test/webhook',
        submitLead: async () => false,
      },
      real,
    );

    await deliverLead(scenario(), h.modules, h.hooks);

    expect(h.state().salesReportSet).toBe(true);
    expect(h.state().submitted).toBe(true);
  });

  it('napaka med dostavo šteje kot neuspela dostava', async () => {
    // Prej je izjema rezervo preskočila, ker bi drugi prenos iz ugasle geste
    // tako ali tako odpadel. Gumb na rezultatih te omejitve nima.
    const real = await loadDeliveryModules();
    const h = harness(
      {
        leadWebhookUrl: () => 'https://example.test/webhook',
        submitLead: async () => {
          throw new Error('omrežje');
        },
      },
      real,
    );

    await deliverLead(scenario(), h.modules, h.hooks);

    expect(h.state().salesReportSet).toBe(true);
    expect(h.state().submitted).toBe(true);
  });

  it('interni način: priprava gre na strežnik IN se ponudi', async () => {
    const real = await loadDeliveryModules();
    const h = harness({ leadWebhookUrl: () => 'https://example.test/webhook' }, real);

    await deliverLead({ ...scenario(), internalMode: true }, h.modules, h.hooks);

    expect(h.posted).toHaveLength(1);
    expect(h.state().salesReportSet).toBe(true);
  });

  /**
   * Priprava je pomožna, zapis ni. Dokler je bila dostava pogojena z uspešno
   * pripravo, je izjema v prodajnem delu lead tiho pokopala: webhook se ni
   * poklical, obiskovalec pa je pristal na rezultatih, kot da je oddal — in prav
   * to je ta test takrat zapisoval kot pričakovano (`posted` dolžine 0).
   */
  it('napaka v prodajnem delu ne ustavi oddaje: zapis in strankin PDF gresta na webhook brez priprave', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const real = await loadDeliveryModules();
    const h = harness(
      {
        leadWebhookUrl: () => 'https://example.test/webhook',
        buildSalesReport: () => {
          throw new Error('sesulo se je');
        },
      },
      real,
    );

    await deliverLead(scenario(), h.modules, h.hooks);

    expect(h.posted).toHaveLength(1);
    expect(h.posted[0]?.record.email).toBe('test@example.com');
    // Časovni žig zapisa ne sme biti odvisen od priprave.
    expect(h.posted[0]?.record.timestampISO).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    // Prazen niz in ne izpuščeno polje — sprejemnik ga preskoči.
    expect(h.posted[0]?.salesReportHtml).toBe('');
    expect(h.posted[0]?.attachments?.map((attachment) => attachment.filename)).toEqual(['porocilo.pdf']);
    // Priprave ni, zato je tudi stranki ni mogoče ponuditi; oddaja je opravljena.
    expect(h.state().salesReportSet).toBe(false);
    expect(h.state().submitted).toBe(true);
    // Dostava je uspela — rezervna pot se ne sme sprožiti.
    expect(h.order).toEqual(['webhook', 'submitted']);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('padel izris HTML priprave ne ustavi oddaje: zapis odide, HTML je prazen', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const real = await loadDeliveryModules();
    const h = harness(
      {
        leadWebhookUrl: () => 'https://example.test/webhook',
        buildSalesReportHtml: () => {
          throw new Error('izris');
        },
      },
      real,
    );

    await deliverLead(scenario(), h.modules, h.hooks);

    expect(h.posted).toHaveLength(1);
    expect(h.posted[0]?.salesReportHtml).toBe('');
    // Priprava kot podatek obstaja, zato gre njen PDF v prilogo.
    expect(h.posted[0]?.attachments?.map((attachment) => attachment.filename)).toEqual(['porocilo.pdf', 'priprava.pdf']);
    expect(h.state().salesReportSet).toBe(false);
    expect(h.state().submitted).toBe(true);
    warn.mockRestore();
  });

  it('brez webhooka in brez priprave se oddaja zaključi brez gumba', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const real = await loadDeliveryModules();
    const h = harness(
      {
        buildSalesReport: () => {
          throw new Error('sesulo se je');
        },
      },
      real,
    );

    await deliverLead(scenario(), h.modules, h.hooks);

    expect(h.posted).toHaveLength(0);
    expect(h.state().salesReportSet).toBe(false);
    expect(h.state().submitted).toBe(true);
    warn.mockRestore();
  });

  /**
   * Rezultati se izrišejo z gumbom za pripravo ali brez njega — ne pa z gumbom,
   * ki se pod obiskovalcem pojavi osem sekund pozneje, ko webhook obupa.
   */
  it('rezultati se odklenejo šele, ko je o pripravi odločeno', async () => {
    const real = await loadDeliveryModules();
    const h = harness(
      { leadWebhookUrl: () => 'https://example.test/webhook', submitLead: async () => false },
      real,
    );

    await deliverLead(scenario(), h.modules, h.hooks);

    expect(h.order.at(-1)).toBe('submitted');
    expect(h.order.indexOf('webhook')).toBeLessThan(h.order.indexOf('salesReport'));
  });

  /**
   * Obvestilo prodaji nosi oba PDF-ja. Vrstni red je del oblike: sprejemnik
   * (Koda.gs) imen ne razlaga, prodajalec pa v pošti najprej vidi strankin pogled.
   */
  it('z webhookom gresta v oddajo oba PDF-ja: najprej strankin, nato priprava', async () => {
    const real = await loadDeliveryModules();
    const h = harness({ leadWebhookUrl: () => 'https://example.test/webhook' }, real);

    await deliverLead(scenario(), h.modules, h.hooks);

    const attachments = h.posted[0]?.attachments ?? [];
    expect(attachments.map((attachment) => attachment.filename)).toEqual(['porocilo.pdf', 'priprava.pdf']);
    expect(attachments.every((attachment) => attachment.contentType === 'application/pdf')).toBe(true);
    expect(atob(attachments[0]?.base64 ?? '')).toMatch(/^%PDF-/);
  });

  /** Dokaz celotne verige s PRAVIMA generatorjema — ne s podtaknjenima. */
  it('prava generatorja dasta pravi PDF-datoteki z imenoma iz aplikacije', async () => {
    const real = await loadDeliveryModules();
    const h = harness(
      {
        leadWebhookUrl: () => 'https://example.test/webhook',
        buildResultsPdfFile: real.buildResultsPdfFile,
        buildSalesPdfFile: real.buildSalesPdfFile,
      },
      real,
    );

    await deliverLead(scenario(), h.modules, h.hooks);

    const attachments = h.posted[0]?.attachments ?? [];
    expect(attachments).toHaveLength(2);
    expect(attachments[0]?.filename).toMatch(/^datalab-analiza-skritih-stroskov-.*\.pdf$/);
    expect(attachments[1]?.filename).toMatch(/^datalab-priprava-na-pogovor-.*\.pdf$/);
    for (const attachment of attachments) {
      expect(atob(attachment.base64).slice(0, 5)).toBe('%PDF-');
      expect(attachment.base64.length).toBeGreaterThan(1000);
    }
  });

  it('padel generator ne ustavi dostave — oddaja gre brez te priloge', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const real = await loadDeliveryModules();
    const h = harness(
      {
        leadWebhookUrl: () => 'https://example.test/webhook',
        buildResultsPdfFile: async () => {
          throw new Error('jsPDF');
        },
      },
      real,
    );

    await deliverLead(scenario(), h.modules, h.hooks);

    expect(h.posted).toHaveLength(1);
    expect(h.posted[0]?.attachments?.map((attachment) => attachment.filename)).toEqual(['priprava.pdf']);
    // Dostava je uspela: priprava ostane na strežniku, stranki se ne ponudi.
    expect(h.state().salesReportSet).toBe(false);
    expect(h.state().submitted).toBe(true);
    warn.mockRestore();
  });

  /**
   * Zavrnjen uvoz jsPDF bi iz handleEmailSubmit padel kot "Oddaja ni uspela" in
   * lead bi propadel zaradi priloge; zato generatorja smeta biti null.
   */
  it('brez naloženega jsPDF gre oddaja naprej brez prilog', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const real = await loadDeliveryModules();
    const h = harness(
      {
        leadWebhookUrl: () => 'https://example.test/webhook',
        buildResultsPdfFile: null,
        buildSalesPdfFile: null,
      },
      real,
    );

    await deliverLead(scenario(), h.modules, h.hooks);

    expect(h.posted).toHaveLength(1);
    expect(h.posted[0]?.attachments).toEqual([]);
    expect(h.state().salesReportSet).toBe(false);
    expect(h.state().submitted).toBe(true);
    warn.mockRestore();
  });

  it('brez webhooka se PDF-ja ne gradita', async () => {
    const real = await loadDeliveryModules();
    let built = 0;
    const counting = async (): Promise<DownloadFile> => {
      built += 1;
      return { filename: 'x.pdf', blob: new Blob(['%PDF-']) };
    };
    const h = harness({ buildResultsPdfFile: counting, buildSalesPdfFile: counting }, real);

    await deliverLead(scenario(), h.modules, h.hooks);

    expect(built).toBe(0);
    expect(h.posted).toHaveLength(0);
  });
});
