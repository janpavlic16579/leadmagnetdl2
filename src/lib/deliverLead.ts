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
 * | Webhook | Dostava uspela | Kam gre priprava            |
 * |---------|----------------|-----------------------------|
 * | ne      | —              | prenese se STRANKI          |
 * | da      | da             | samo na strežnik            |
 * | da      | ne             | prenese se STRANKI (rezerva)|
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
  buildSalesHtmlFile: typeof import('./salesReportHtml').buildSalesHtmlFile;
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
    buildSalesHtmlFile: salesReportHtml.buildSalesHtmlFile,
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
    outputs: input.outputs,
    totals: input.totals,
    totalsRange: input.totalsRange,
    coverage: input.coverage,
    highestModule: input.highestModule,
    accountingCapacity: input.accountingCapacity,
  });

  /**
   * Prenese se TAKOJ, pred prodajnim delom in webhookom. Prej je čakalo na oba:
   * viseč webhook ali napaka v prodajni pripravi sta zadržala edino datoteko, ki
   * mora priti. Prenos je tako tudi bliže obiskovalčevemu kliku, kar šteje pri
   * brskalnikih, ki prenos brez sveže geste zavrnejo.
   */
  hooks.onCustomerFile(customerFile);
  hooks.downloadFile(customerFile);

  /**
   * Konverzija se zabeleži tu in ne na koncu: konec ima dve poti in dogodek na
   * eni od njiju bi manjkal — v produkciji brez webhooka bi bila to prav tista
   * pot, torej vse oddaje.
   */
  track('lm10_lead_submitted', {
    segment: input.segment.id,
    confidence: input.totals.confidence ?? 'unknown',
    measuredAreas: input.coverage.measuredCount,
  });

  const webhookUrl = modules.leadWebhookUrl();
  const salesFiles: DownloadFile[] = [];
  /** Uspeh dostave na strežnik je edino, kar odloči, ali gre priprava tudi stranki. */
  let deliveredToWebhook = false;
  try {
    const report = modules.buildSalesReport({
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

    if (webhookUrl) {
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
      if (record) {
        deliveredToWebhook = await modules.submitLead(
          { record, salesReportHtml: modules.buildSalesReportHtml(report) },
          webhookUrl,
        );
      }
    }

    if (input.internalMode || !deliveredToWebhook) {
      // Gumba za ponovni prenos na zahvalnem zaslonu visita na tem stanju, zato se
      // postavi natanko takrat, kadar priprava tudi sicer pristane na napravi.
      hooks.onSalesReport(report);
      salesFiles.push(await modules.buildSalesPdfFile(report), modules.buildSalesHtmlFile(report));
    }
  } catch {
    // Strankina datoteka je že prenesena; prodajni del je pomožen in sme odpasti.
  }

  // Zaporedno in z razmikom: več prenosov v isti niti je za brskalnik en dogodek,
  // ki ga po prvi datoteki zavrne. Strankino poročilo je že šlo skozi.
  if (salesFiles.length > 0) await hooks.downloadSequentially(salesFiles);

  hooks.onSubmitted();
}
