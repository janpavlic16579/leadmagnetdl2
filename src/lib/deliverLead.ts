import { track } from './analytics';
import type { SegmentContext, BusinessProfile } from '../config/contexts';
import type { ModuleDefinition, ModuleOutput } from '../config/modules/moduleTypes';
import type { SegmentConfig } from '../config/segments';
import type { FollowUpSequence } from './followUp';
import type { TriageScores } from './moduleEngine';
import type { ResultTotals } from './potential';
import type { TotalsRange } from './range';
import type { SalesReport } from './salesReport';
import type { LeadConsents, LeadContact } from '../types';
import type { DownloadFile } from './download';
import type { GeneratePdfParams } from './pdf';
import type { LeadAttachment } from './submitLead';

/**
 * Dostava po oddaji obrazca: sestavi prodajno pripravo, jo spravi tja, kamor
 * sodi, in zapre kalibracijsko zanko.
 *
 * Živela je kot 130 vrstic v CalculatorFlow.tsx in je bila zato NEPREVERLJIVA:
 * vitest teče brez jsdom, komponente ni mogoče izrisati, pravilo "prodajna
 * priprava nikoli k stranki" pa je držalo samo toliko, kolikor ga je vsak bralec
 * kode znal prebrati. Prav to pravilo je najdražje, če se prelomi — dokument
 * govori O stranki in ne ZANJO.
 *
 * Tu je zato čista funkcija s tremi stiki z zunanjim svetom (webhook, shramba
 * stanja, sled). Vsi so vbrizgljivi, zato jih test lahko prestreže.
 *
 * OB ODDAJI SE NA NAPRAVO NE PRENESE NIČ. Obrazec stoji PRED rezultati:
 * obiskovalec številk še ni videl in datoteka brez pogleda je datoteka brez
 * konteksta. Strankino poročilo se zato prenese ob kliku na rezultatih — iz
 * takratnega stanja, da PDF ustreza zaslonu tudi po popravku vnosov. Vsak klik
 * je sveža gesta, zato odpade vprašanje, koliko prenosov brskalnik dovoli iz ene
 * (prej: dva prenosa in webhook iz iste geste, drugi prenos je na iOS tiho
 * odpadal).
 *
 * OBA PDF-JA PA NASTANETA ŽE TU — kot prilogi e-obvestila prodaji
 * (buildAttachments). Nastaneta v pomnilniku in odideta po žici; sta posnetek ob
 * oddaji, enako kot vrstica v preglednici, gumb na rezultatih pa gradi iz
 * trenutnega stanja. jsPDF se zato naloži tudi tu — kos je predhodno naložen na
 * obrazcu (CalculatorFlow); kadar se ne naloži ali PDF ne nastane, gre oddaja
 * naprej brez priloge: lead je vreden več od priloge.
 *
 * KAM GRE PRIPRAVA — eno pravilo, ki se preklopi samo:
 *
 * | Webhook | Dostava uspela | Kam gre priprava                        |
 * |---------|----------------|-----------------------------------------|
 * | ne      | —              | ponudi se STRANKI (gumb na rezultatih)  |
 * | da      | da             | samo na strežnik                        |
 * | da      | ne             | ponudi se STRANKI (rezerva, isti gumb)  |
 *
 * Prva vrstica je začasna: dokler `VITE_LEAD_WEBHOOK_URL` ni nastavljen, je
 * prenos pri stranki edina pot, po kateri svetovalec pripravo sploh dobi —
 * stranka mu jo posreduje. Ko naslov nastavite, se gumb umakne sam, brez posega
 * v kodo. Cena te začasnosti: dokument je napisan O stranki (ocena ustreznosti,
 * priporočilo licenc, pričakovani ugovori) in ne ZANJO.
 *
 * PRIPRAVA JE POMOŽNA, ZAPIS NI. Kadar `buildSalesReport` vrže izjemo, gre
 * oddaja na webhook vseeno: izvozni zapis, vrstica za preglednico in strankin
 * PDF od priprave niso odvisni, priprava (HTML in njen PDF) pa tedaj odpade.
 * Dokler je bila dostava pogojena z uspešno pripravo, je napaka v prodajnem
 * delu — ki je najbolj razvejan kos kode — lead tiho pokopala: webhook se ni
 * poklical, dogodek neuspeha se ni sprožil, obiskovalec pa je pristal na
 * rezultatih, kot da je oddal. Sprejemnik (Koda.gs) prazno pripravo preskoči.
 */

export interface DeliverLeadInput {
  contact: LeadContact;
  consents: LeadConsents;
  utmSource: string | null;
  /**
   * Interni način (?debug=1). Priprava se ponudi stranki tudi ob delujočem
   * webhooku — za razvoj in pregled vsebine.
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
  /**
   * Parametri strankinega poročila za prilogo obvestila — sestavljeni na istem
   * mestu kot za gumb na rezultatih (CalculatorFlow.customerPdfParams), da
   * prodaja dobi isti dokument, kot ga vidi stranka.
   */
  customerPdf: GeneratePdfParams;
}

export interface DeliverLeadHooks {
  /**
   * Priprava, kadar mora do svetovalca PREK stranke (tabela v glavi). Rezultati
   * jo ponudijo kot gumb "Priprava v PDF" — nikoli se ne prenese sama.
   */
  onSalesReport: (report: SalesReport) => void;
  /**
   * Oddaja je opravljena — od tu naprej se obiskovalcu smejo pokazati rezultati.
   * Pokliče se ŠELE, ko je o pripravi odločeno: gumb, ki bi se pod obiskovalcem
   * pojavil osem sekund po rezultatih, je zaslon, ki se premika.
   */
  onSubmitted: () => void;
}

/** Moduli, ki jih dostava potrebuje. Ločeni zato, da jih test poda brez omrežja. */
export interface DeliverLeadModules {
  buildSalesReport: typeof import('./salesReport').buildSalesReport;
  buildSalesReportHtml: typeof import('./salesReportHtml').buildSalesReportHtml;
  buildLeadExportRecord: typeof import('./exportRecord').buildLeadExportRecord;
  leadWebhookUrl: typeof import('./submitLead').leadWebhookUrl;
  submitLead: typeof import('./submitLead').submitLead;
  attachmentFromFile: typeof import('./submitLead').attachmentFromFile;
  /** Null = kos jsPDF se ni naložil; dostava gre naprej brez prilog. */
  buildResultsPdfFile: typeof import('./pdf').buildResultsPdfFile | null;
  buildSalesPdfFile: typeof import('./pdfSales').buildSalesPdfFile | null;
}

/**
 * Naloži module dostave — z jsPDF vred, ker obvestilo nosi oba PDF-ja. Kos je
 * predhodno naložen na obrazcu; če se vseeno ne naloži, generatorja ostaneta
 * null in oddaja gre naprej brez prilog. Zavrnjen uvoz bi sicer iz
 * handleEmailSubmit padel kot "Oddaja ni uspela" in lead bi propadel zaradi
 * priloge.
 */
export async function loadDeliveryModules(): Promise<DeliverLeadModules> {
  const [salesReport, salesReportHtml, exportRecord, submitLead, pdf, pdfSales] =
    await Promise.all([
      import('./salesReport'),
      import('./salesReportHtml'),
      import('./exportRecord'),
      import('./submitLead'),
      import('./pdf').catch(() => null),
      import('./pdfSales').catch(() => null),
    ]);

  return {
    buildSalesReport: salesReport.buildSalesReport,
    buildSalesReportHtml: salesReportHtml.buildSalesReportHtml,
    buildLeadExportRecord: exportRecord.buildLeadExportRecord,
    leadWebhookUrl: submitLead.leadWebhookUrl,
    submitLead: submitLead.submitLead,
    attachmentFromFile: submitLead.attachmentFromFile,
    buildResultsPdfFile: pdf?.buildResultsPdfFile ?? null,
    buildSalesPdfFile: pdfSales?.buildSalesPdfFile ?? null,
  };
}

/**
 * Zgornja meja skupne velikosti prilog (base64). Izmerjeno v brskalniku merita
 * skupaj ≈ 130 kB (dokumenta 42 in 57 kB, base64 je tretjino večji). Meja je
 * torej desetkratna rezerva; nad njo je dokument nepričakovano velik in prilogi
 * odpadeta, da ne odneseta leada (rok in pomnilnik na telefonu).
 */
const MAX_ATTACHMENTS_BYTES = 1_500_000;

/**
 * Oba PDF-ja za prilogi obvestila: najprej poročilo za stranko, nato priprava.
 * Nikoli ne vrže: padec enega generatorja ne odnese drugega, padec obeh ne
 * odnese oddaje. Zaporedno, da sta v pomnilniku naenkrat največ en dokument in
 * njegov base64. Brez priprave (ni nastala) gre samo strankino poročilo.
 */
async function buildAttachments(
  input: DeliverLeadInput,
  report: SalesReport | null,
  modules: DeliverLeadModules,
): Promise<LeadAttachment[]> {
  const buildResults = modules.buildResultsPdfFile;
  const buildSales = modules.buildSalesPdfFile;
  if (!buildResults || !buildSales) {
    console.warn('Obvestilo bo brez prilog: jsPDF se ni naložil.');
    return [];
  }

  const generators: [string, () => Promise<DownloadFile>][] = [
    ['poročilo za stranko', () => buildResults(input.customerPdf)],
    ...(report ? [['priprava na pogovor', () => buildSales(report)] as [string, () => Promise<DownloadFile>]] : []),
  ];
  const attachments: LeadAttachment[] = [];
  for (const [label, build] of generators) {
    try {
      attachments.push(await modules.attachmentFromFile(await build()));
    } catch (error) {
      console.warn(`Priloga "${label}" ni nastala:`, error);
    }
  }

  const total = attachments.reduce((sum, attachment) => sum + attachment.base64.length, 0);
  if (total > MAX_ATTACHMENTS_BYTES) {
    console.warn(`Obvestilo bo brez prilog: ${total} B presega mejo ${MAX_ATTACHMENTS_BYTES} B.`);
    return [];
  }
  return attachments;
}

export async function deliverLead(
  input: DeliverLeadInput,
  modules: DeliverLeadModules,
  hooks: DeliverLeadHooks,
  now: () => Date = () => new Date(),
): Promise<void> {
  /**
   * Konverzija se zabeleži na začetku in ne na koncu: konec ima več poti in
   * dogodek na eni od njih bi manjkal — v produkciji brez webhooka bi bila to
   * prav tista pot, torej vse oddaje.
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
  /**
   * Ali priprava pripada stranki (tabela v glavi): brez webhooka vedno, v
   * internem načinu poleg strežnika, ob neuspeli dostavi kot rezerva.
   */
  let forCustomer = !webhookUrl || input.internalMode;
  /**
   * En sam časovni žig za pripravo IN zapis. Zapis ga je doslej bral iz priprave
   * (`report.meta.generatedAtISO`) in je bil zato od nje odvisen — prav ta vez je
   * ob padcu priprave odnesla tudi dostavo zapisa.
   */
  const generatedAtISO = now().toISOString();
  let report: SalesReport | null = null;

  try {
    report = modules.buildSalesReport({
      generatedAtISO,
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
      // Isti podatek, kot ga dobi strankino poročilo: priprava mora vedeti, katere
      // številke ima stranka pred sabo, sicer je svetovalec presenečen nad podatkom
      // iz lastne hiše.
      accountingCapacity: input.accountingCapacity,
      coverage: input.coverage,
    });
  } catch (error) {
    // Prodajni del je pomožen in sme odpasti: zapis za prodajo in strankin PDF
    // gresta na webhook brez njega (glej glavo), obiskovalec dobi rezultate.
    // Glasno, ker je sicer edini znak prazen stolpec s pripravo v preglednici.
    console.warn('Prodajna priprava ni nastala; oddaja gre naprej brez nje:', error);
  }

  // Ali je lead sploh prišel do prodaje. lm10_lead_submitted zgoraj se namerno
  // sproži pred dostavo; brez tega para bi se konverzije štele tudi takrat, ko
  // do prodaje niso prišle — v produkciji brez webhooka torej VSE.
  if (!webhookUrl) {
    track('lm10_delivery_failed', { reason: 'no_webhook' });
  }

  if (webhookUrl) {
    try {
      const record = modules.buildLeadExportRecord({
        timestampISO: generatedAtISO,
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
      // Prilogi šele, ko je zapis tu: brez privolitve oddaje ni in PDF-ja bi
      // nastala zaman. Brez webhooka se ta veja sploh ne izvede.
      const attachments = record ? await buildAttachments(input, report, modules) : [];
      const delivered = record
        ? await modules.submitLead(
            { record, salesReportHtml: salesReportHtmlOf(report, modules), attachments },
            webhookUrl,
          )
        : false;

      if (delivered) {
        // Število prilog in prisotnost priprave sta lastnosti dogodka in ne nov
        // dogodek: od zunaj se vidi, ali obvestila prihajajo s PDF-jema in s
        // pripravo ali brez njih.
        track('lm10_delivery_ok', {
          channel: 'webhook',
          attachments: attachments.length,
          salesReport: report ? 'da' : 'ne',
        });
      } else {
        track('lm10_delivery_failed', { reason: record ? 'rejected' : 'no_record' });
        // Rezerva: brez uspele dostave svetovalec do priprave nima nobene poti.
        forCustomer = true;
      }
    } catch {
      // Izjema JE neuspela dostava — pravilo iz glave velja enako kot za zavrnitev.
      // Prej je ta veja rezervo preskočila, ker bi drugi prenos iz ugasle geste
      // tako ali tako odpadel; gumb na rezultatih te omejitve nima.
      track('lm10_delivery_failed', { reason: 'error' });
      forCustomer = true;
    }
  }

  // Najprej priprava, ŠELE NATO oddaja: rezultati se izrišejo z gumbom ali brez
  // njega, ne pa z gumbom, ki se pojavi naknadno.
  if (report && forCustomer) hooks.onSalesReport(report);
  hooks.onSubmitted();
}

/**
 * HTML priprave za telo zahteve — ali prazen niz, kadar priprave ni oziroma
 * izris pade. Prazen niz in ne izpuščeno polje: sprejemnik (Koda.gs,
 * `SHRANI_PRIPRAVO && oddaja.salesReportHtml`) ga preskoči, oblika telesa pa
 * ostane ista. Izris je ovit posebej, ker bi izjema v njem sicer padla v isti
 * `catch` kot omrežna napaka in dostavo razglasila za neuspelo, čeprav zapis
 * še ni odšel.
 */
function salesReportHtmlOf(report: SalesReport | null, modules: DeliverLeadModules): string {
  if (!report) return '';
  try {
    return modules.buildSalesReportHtml(report);
  } catch (error) {
    console.warn('HTML priprave ni nastal; oddaja gre naprej brez njega:', error);
    return '';
  }
}
