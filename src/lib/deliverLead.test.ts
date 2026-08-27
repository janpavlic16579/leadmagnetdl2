import { describe, expect, it } from 'vitest';
import { deliverLead, loadDeliveryModules, type DeliverLeadInput, type DeliverLeadModules } from './deliverLead';
import type { DownloadFile } from './download';
import type { LeadExportRecord } from './exportRecord';
import { computeModules, findHighestModule, resolveInputs } from './moduleEngine';
import { aggregateResults, assessConfidence, buildComputeContext } from './potential';
import { getModules } from '../config/modules';
import { SEGMENTS } from '../config/segments';
import { emptyProfileFor, getSegmentContext } from '../config/contexts';

/**
 * Pravilo, ki ga varuje ta test: KAM GRE PRODAJNA PRIPRAVA.
 *
 * Ob DELUJOČEM webhooku ne sme k stranki — dokument nosi oceno ustreznosti,
 * priporočilo licenc in pričakovane ugovore, torej je napisan O stranki in ne
 * ZANJO. Dokler webhook ni nastavljen, je prenos pri stranki edina pot, po kateri
 * svetovalec pripravo dobi, zato tedaj MORA nastati.
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
    highestModule: findHighestModule(outputs, segment.moduleIds),
    coverage: { measuredCount: 0, offeredCount: 10, unmeasured: [] },
    followUpSequence: 'low-loss-newsletter',
  };
}

/** Prestrežene poti navzven: prenosi, stanje in webhook. */
function harness(overrides: Partial<DeliverLeadModules>, real: DeliverLeadModules) {
  const downloaded: DownloadFile[] = [];
  /** Prenosi po svežnjih: ravni seznam ne pove, ali sta datoteki šli iz ENE geste. */
  const batches: DownloadFile[][] = [];
  /** Vrstni red poti navzven — lovi, ali webhook stoji pred prenosoma. */
  const order: ('download' | 'webhook')[] = [];
  const posted: { record: LeadExportRecord; salesReportHtml: string }[] = [];
  let salesReportSet = false;
  let submitted = false;

  const merged: DeliverLeadModules = {
    ...real,
    leadWebhookUrl: () => null,
    submitLead: async (submission) => {
      posted.push(submission);
      return true;
    },
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
    downloadFile: (file: DownloadFile) => {
      order.push('download');
      downloaded.push(file);
      batches.push([file]);
    },
    downloadSequentially: async (files: DownloadFile[]) => {
      order.push('download');
      downloaded.push(...files);
      batches.push(files);
    },
    onCustomerFile: () => {},
    onSalesReport: () => {
      salesReportSet = true;
    },
    onSubmitted: () => {
      submitted = true;
    },
  };

  return {
    modules,
    hooks,
    downloaded,
    batches,
    order,
    posted,
    state: () => ({ salesReportSet, submitted }),
  };
}

const isSalesFile = (file: DownloadFile) => file.filename.includes('priprava-na-pogovor');

describe('Dostava po oddaji', () => {
  it('brez webhooka: priprava se prenese stranki, da jo posreduje svetovalcu', async () => {
    const real = await loadDeliveryModules();
    const h = harness({}, real);

    await deliverLead(scenario(), h.modules, h.hooks);

    // Strankino poročilo je prvo — je edino, ki mora priti vedno.
    expect(h.downloaded[0]?.filename).toContain('analiza-skritih-stroskov');
    expect(h.downloaded.filter(isSalesFile)).toHaveLength(1);
    // Gumba za ponovni prenos na zahvalnem zaslonu visita na tem stanju.
    expect(h.state().salesReportSet).toBe(true);
    expect(h.state().submitted).toBe(true);
  });

  it('z webhookom: priprava gre na strežnik in NE k stranki', async () => {
    const real = await loadDeliveryModules();
    const h = harness({ leadWebhookUrl: () => 'https://example.test/webhook' }, real);

    await deliverLead(scenario(), h.modules, h.hooks);

    expect(h.posted).toHaveLength(1);
    expect(h.posted[0]?.salesReportHtml).toContain('<!doctype html>');
    expect(h.posted[0]?.record.email).toBe('test@example.com');
    // Jedro pravila: uspešna dostava pomeni, da stranka priprave ne vidi.
    expect(h.downloaded.some(isSalesFile)).toBe(false);
    expect(h.state().salesReportSet).toBe(false);
  });

  it('neuspela dostava: priprava pade nazaj na prenos, da se lead ne izgubi', async () => {
    const real = await loadDeliveryModules();
    const h = harness(
      {
        leadWebhookUrl: () => 'https://example.test/webhook',
        submitLead: async () => false,
      },
      real,
    );

    await deliverLead(scenario(), h.modules, h.hooks);

    expect(h.downloaded.filter(isSalesFile)).toHaveLength(1);
  });

  it('interni način: priprava se prenese in ponudi za ponovni prenos', async () => {
    const real = await loadDeliveryModules();
    const h = harness({}, real);

    await deliverLead({ ...scenario(), internalMode: true }, h.modules, h.hooks);

    const salesFiles = h.downloaded.filter(isSalesFile);
    expect(salesFiles.map((file) => file.filename.split('.').pop())).toEqual(['pdf']);
    expect(h.state().salesReportSet).toBe(true);
  });

  /**
   * Doslej je strankino poročilo odšlo takoj, priprava pa šele za webhookom in
   * gradnjo PDF-ja. Med prenosoma je minilo do deset sekund, brskalnik pa v tem
   * času geste ne prizna več in drugi prenos tiho zavrže. Ta dva testa sta edina,
   * ki to regresijo ujameta — ravni seznam prenosov je ne pokaže.
   */
  it('obe poročili gresta iz ene geste, strankino prvo', async () => {
    const real = await loadDeliveryModules();
    const h = harness({}, real);

    await deliverLead(scenario(), h.modules, h.hooks);

    expect(h.batches).toHaveLength(1);
    expect(h.batches[0]).toHaveLength(2);
    expect(h.batches[0][0].filename).toContain('analiza-skritih-stroskov');
    expect(h.batches[0][1].filename).toContain('priprava-na-pogovor');
  });

  it('webhook ne stoji pred prenosoma', async () => {
    const real = await loadDeliveryModules();
    const h = harness(
      { leadWebhookUrl: () => 'https://example.test/webhook', submitLead: async () => false },
      real,
    );

    await deliverLead(scenario(), h.modules, h.hooks);

    // Prvi stik z zunanjim svetom mora biti prenos, ne osemsekundni rok webhooka.
    expect(h.order[0]).toBe('download');
    expect(h.order).toContain('webhook');
  });

  it('napaka v prodajnem delu ne odnese strankinega poročila', async () => {
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

    expect(h.downloaded).toHaveLength(1);
    expect(h.downloaded[0]?.filename).toContain('analiza-skritih-stroskov');
    expect(h.downloaded.some(isSalesFile)).toBe(false);
    expect(h.posted).toHaveLength(0);
    expect(h.state().submitted).toBe(true);
  });
});
