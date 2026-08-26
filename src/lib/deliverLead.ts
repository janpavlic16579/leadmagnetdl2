import { track } from './analytics';
import type { DownloadFile } from './download';
import type { SegmentContext, BusinessProfile } from '../config/contexts';
import type { ModuleDefinition, ModuleOutput } from '../config/modules/moduleTypes';
import type { SegmentConfig } from '../config/segments';
import type { FollowUpSequence } from './followUp';
import type { TriageScores } from './moduleEngine';
import type { ResultTotals } from './potential';
import type { TotalsRange } from './range';
import type { SalesReport } from './salesReport';
import type { LeadConsents, LeadContact } from '../types';

/**
 * Dostava po oddaji obrazca: sestavi dokumente, jih spravi tja, kamor sodijo, in
 * zapre kalibracijsko zanko.
 *
 * Živela je kot 130 vrstic v CalculatorFlow.tsx in je bila zato NEPREVERLJIVA:
 * vitest teče brez jsdom, komponente ni mogoče izrisati, pravilo "prodajna
 * priprava nikoli k stranki" pa je držalo samo toliko, kolikor ga je vsak bralec
 * kode znal prebrati. Prav to pravilo je najdražje, če se prelomi — dokument
 * govori O stranki in ne ZANJO.
 *
 * Tu je zato čista funkcija s štirimi stiki z zunanjim svetom (prenos datoteke,
 * shramba stanja, sled). Vsi so vbrizgljivi, zato jih test lahko prestreže.
 *
 * KAM GRE PRIPRAVA — eno pravilo, ki se preklopi samo:
 *
 * | Webhook | Dostava uspela | Kam gre priprava            | Kdaj                  |
 * |---------|----------------|-----------------------------|-----------------------|
 * | ne      | —              | prenese se STRANKI          | skupaj s poročilom    |
 * | da      | da             | samo na strežnik            | —                     |
 * | da      | ne             | prenese se STRANKI (rezerva)| po webhooku           |
 *
 * KDAJ je enako pomembno kot KAM. Brskalnik iz ene uporabnikove geste zanesljivo
 * dovoli en prenos, naslednje pa presoja po tem, kako sveža je gesta. Doslej je
 * strankino poročilo odšlo takoj, priprava pa šele za sestavljanjem poročila,
 * ČAKANJEM NA WEBHOOK (rok 8 s) in gradnjo PDF-ja — do tedaj je gesta ugasnila in
 * drugi prenos je tiho odpadel. Zato se priprava zgradi PRED prenosom, oba gresta
 * skozi en downloadSequentially, webhook pa se umakne ZA njiju.
 *
 * Prva vrstica je začasna: dokler `VITE_LEAD_WEBHOOK_URL` ni nastavljen, je prenos
 * pri stranki edina pot, po kateri svetovalec pripravo sploh dobi — stranka mu jo
 * posreduje. Ko naslov nastavite, se prenos ugasne sam, brez posega v kodo.
 * Cena te začasnosti: dokument je napisan O stranki (ocena ustreznosti,
 * priporočilo licenc, pričakovani ugovori) in ne ZANJO.
 */

export interface DeliverLeadInput {
  contact: LeadContact;
  consents: LeadConsents;
  utmSource: string | null;
  /**
   * Interni način (?debug=1). Edina pot, po kateri prodajna priprava pristane na
   * napravi. Brez njega gre lahko samo na webhook.
   */
  internalMode: boolean;

  segment: SegmentConfig;
  context: SegmentContext | undefined;
  profile: BusinessProfile;
  industry: string;
  employeeCount: number;

  segmentModules: ModuleDefinition[];
  activeModules: ModuleDefinition[];
  values: Record<string, Record<string, number>>;
  triageScores: TriageScores;

  outputs: ModuleOutput[];
  totals: ResultTotals;
  totalsRange: TotalsRange | null;
  /** Id področja z največjim letnim zneskom (moduleEngine.findHighestModule). */
  highestModule: string | null;
  accountingCapacity?: number;
  /**
   * Izračunan razlog nizke zanesljivosti za strankin PDF (brezosebna oblika,
   * lib/confidenceReason.ts) — namesto splošnega "podatki manjkajo".
   */
  confidenceReasonPdf?: string | null;
  /** Pokritost, kot jo vidi obiskovalec — hero znesek meri samo izbrana področja. */
  coverage: {
    measuredCount: number;
    offeredCount: number;
    unmeasured: { title: string; scoreLabel: string | null }[];
  };
  followUpSequence: FollowUpSequence;
}

export interface DeliverLeadHooks {
  /** Prenos ene datoteke — v brskalniku sidro z blobom, v testu zabeležka. */
  downloadFile: (file: DownloadFile) => void;
  /** Zaporedni prenos z razmikom; brskalnik več prenosov iz ene geste zavrne. */
  downloadSequentially: (files: DownloadFile[]) => Promise<void>;
  /** Strankino poročilo za ponovni prenos na zahvalnem zaslonu. */
  onCustomerFile: (file: DownloadFile) => void;
  /** Prodajna priprava — postavi se SAMO v internem načinu. */
  onSalesReport: (report: SalesReport) => void;
  /** Trenutek, ko je izračun pri stranki in je oddaja opravljena. */
  onSubmitted: () => void;
}

/** Moduli, ki jih dostava potrebuje. Ločeni zato, da jih test poda brez uvoza jsPDF. */
export interface DeliverLeadModules {
  buildResultsPdfFile: typeof import('./pdf').buildResultsPdfFile;
  buildSalesReport: typeof import('./salesReport').buildSalesReport;
  buildSalesPdfFile: typeof import('./pdfSales').buildSalesPdfFile;
  buildSalesReportHtml: typeof import('./salesReportHtml').buildSalesReportHtml;
  buildLeadExportRecord: typeof import('./exportRecord').buildLeadExportRecord;
  leadWebhookUrl: typeof import('./submitLead').leadWebhookUrl;
  submitLead: typeof import('./submitLead').submitLead;
}

/**
 * Naloži težke module. jsPDF je velik in potreben šele ob oddaji, zato se uvozi
 * tu in ne ob prvem prikazu strani.
 */
export async function loadDeliveryModules(): Promise<DeliverLeadModules> {
  const [pdf, salesReport, pdfSales, salesReportHtml, exportRecord, submitLead] = await Promise.all([
    import('./pdf'),
    import('./salesReport'),
    import('./pdfSales'),
    import('./salesReportHtml'),
    import('./exportRecord'),
    import('./submitLead'),
  ]);

  return {
    buildResultsPdfFile: pdf.buildResultsPdfFile,
    buildSalesReport: salesReport.buildSalesReport,
    buildSalesPdfFile: pdfSales.buildSalesPdfFile,
    buildSalesReportHtml: salesReportHtml.buildSalesReportHtml,
    buildLeadExportRecord: exportRecord.buildLeadExportRecord,
    leadWebhookUrl: submitLead.leadWebhookUrl,
    submitLead: submitLead.submitLead,
  };
}

export async function deliverLead(
  input: DeliverLeadInput,
  modules: DeliverLeadModules,
  hooks: DeliverLeadHooks,
  now: () => Date = () => new Date(),
): Promise<void> {
  // Strankino poročilo se sestavi PRVO: je edina datoteka, ki mora priti vedno,
  // in napaka v prodajnem delu je ne sme odnesti s seboj.
  const customerFile = await modules.buildResultsPdfFile({
    segment: input.segment,
    // Samo ime podjetja: poročilo gre upravi stranke, ki ve, kdo ga je izpolnil,
    // in se posreduje interno — osebni podatki v njem so odveč.
    companyName: input.contact.companyName,
    employeeCount: input.employeeCount,
    outputs: input.outputs,
    totals: input.totals,
    totalsRange: input.totalsRange,
    coverage: input.coverage,
    highestModule: input.highestModule,
    accountingCapacity: input.accountingCapacity,
    confidenceReason: input.confidenceReasonPdf,
  });

  // Gumb za ponovni prenos na zahvalnem zaslonu visi na tem stanju.
  hooks.onCustomerFile(customerFile);

  /**
   * Konverzija se zabeleži tu in ne na koncu: konec ima dve poti in dogodek na
   * eni od njiju bi manjkal — v produkciji brez webhooka bi bila to prav tista
   * pot, torej vse oddaje.
   */
  track('lm10_lead_submitted', {
    segment: input.segment.id,
    confidence: input.totals.confidence ?? 'unknown',
    measuredAreas: input.coverage.measuredCount,
    // Ali se poziv za svetovanje sploh obkljuka. Razred in ne osebni podatek —
    // brez tega o novem pozivu na zadnjem koraku ni znano nič.
    consulting: input.consents.consentConsulting ? 'da' : 'ne',
  });

  const webhookUrl = modules.leadWebhookUrl();
  let report: SalesReport | null = null;
  /** Priprava, kadar pripada napravi. `null` pomeni "gre samo na strežnik". */
  let salesFile: DownloadFile | null = null;

  try {
    report = modules.buildSalesReport({
      generatedAtISO: now().toISOString(),
      contact: input.contact,
      consents: input.consents,
      utmSource: input.utmSource,
      industry: input.industry,
      employeeCount: input.employeeCount,
      segment: input.segment,
      context: input.context,
      profile: input.profile,
      segmentModules: input.segmentModules,
      activeModules: input.activeModules,
      values: input.values,
      triageScores: input.triageScores,
      outputs: input.outputs,
      totals: input.totals,
      totalsRange: input.totalsRange,
      highestModule: input.highestModule,
      followUpSequence: input.followUpSequence,
    });

    // Brez webhooka o dostavi ni kaj čakati — priprava tako ali tako pripada
    // stranki. Zato se zgradi ZDAJ in odide skupaj s poročilom, dokler gesta
    // še velja. V internem načinu velja isto, le da gre poleg tega na strežnik.
    if (!webhookUrl || input.internalMode) {
      salesFile = await modules.buildSalesPdfFile(report);
      hooks.onSalesReport(report);
    }
  } catch {
    // Prodajni del je pomožen in sme odpasti; strankino poročilo gre vseeno.
  }

  // OBA prenosa iz ene geste, drug za drugim. Vrstni red je pomemben: prvi prenos
  // je edini, ki ga brskalnik dovoli brez vprašanja, zato mora biti prvo tista
  // datoteka, ki je nujna — strankino poročilo.
  await hooks.downloadSequentially(salesFile ? [customerFile, salesFile] : [customerFile]);

  // Ali je lead sploh prišel do prodaje. lm10_lead_submitted zgoraj se namerno
  // sproži pred dostavo; brez tega para bi se konverzije štele tudi takrat, ko
  // do prodaje niso prišle — v produkciji brez webhooka torej VSE.
  if (!webhookUrl) {
    track('lm10_delivery_failed', { reason: 'no_webhook' });
  }

  // Webhook ŠELE ZDAJ: prej je njegov rok stal med obema prenosoma (glej glavo).
  // Za obiskovalca se ne spremeni nič — datoteki ima že obe.
  if (webhookUrl && report) {
    try {
      const record = modules.buildLeadExportRecord({
        timestampISO: report.meta.generatedAtISO,
        contact: input.contact,
        consents: input.consents,
        industry: input.industry,
        segment: input.segment.id,
        employeeCount: input.employeeCount,
        profile: input.profile,
        selectedModules: input.activeModules.map((definition) => definition.id),
        triageScores: input.triageScores,
        moduleInputs: input.values,
        outputs: input.outputs,
        totals: input.totals,
        followUpSequence: input.followUpSequence,
        utmSource: input.utmSource,
      });
      const delivered = record
        ? await modules.submitLead(
            { record, salesReportHtml: modules.buildSalesReportHtml(report) },
            webhookUrl,
          )
        : false;

      if (delivered) {
        track('lm10_delivery_ok', { channel: 'webhook' });
      } else {
        track('lm10_delivery_failed', { reason: record ? 'rejected' : 'no_record' });
      }

      // Rezerva: brez uspele dostave svetovalec do priprave nima nobene poti.
      // `!salesFile` izloči interni način, kjer je datoteka že prenesena.
      if (!delivered && !salesFile) {
        hooks.onSalesReport(report);
        hooks.downloadFile(await modules.buildSalesPdfFile(report));
      }
    } catch {
      // Kot zgoraj: strankino poročilo je že preneseno in prodajni del sme odpasti.
      track('lm10_delivery_failed', { reason: 'error' });
    }
  }

  hooks.onSubmitted();
}
