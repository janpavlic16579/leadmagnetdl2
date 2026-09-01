import type { BusinessProfile } from '../config/contexts';
import { getIndustryLabel } from '../config/industries';
import type { ModuleOutput } from '../config/modules/moduleTypes';
import type { SegmentId } from '../config/segmentTypes';
import { getSizeClass } from '../config/sizeClasses';
import { triggerDownload } from './download';
import type { FollowUpSequence } from './followUp';
import type { TriageScores } from './moduleEngine';
import type { ConfidenceLevel, ResultTotals } from './potential';
import type { LeadConsents, LeadContact } from '../types';

// Ni CRM API — ta modul nadomešča pravo integracijo z ročnim izvozom (spec pogl. 8, MVP tabela).
// Zapis sestavi buildLeadExportRecord; dostavo opravi bodisi webhook (lib/submitLead.ts),
// bodisi ročni prenos CSV/JSON prek downloadAsCsv/downloadAsJson.

export interface LeadExportRecord {
  timestampISO: string;
  segment: SegmentId;
  /** id dejavnosti in njena oznaka — prodajnik dobi "Maloprodaja", ne le "trgovina". */
  industry: string;
  industryLabel: string;
  sizeClass: string;
  employeeCount: number;
  companyName: string;
  email: string;
  /** Literalni true in ne boolean: zapis brez obvezne privolitve ne sme obstajati. */
  gdprConsent: true;
  /**
   * Kontakt iz obrazca. Brez teh polj bi modul dejavno zavajal: obrazec zbere šest
   * kontaktnih podatkov, kdor ga ožiči, pa bi tri tiho izgubil.
   */
  firstName: string;
  lastName: string;
  /** Neobvezna, zato prazen niz. */
  phone: string;
  /** Neobvezna in normalizirana (brez presledkov in predpone SI). */
  taxNumber: string;
  consentOffers: boolean;
  consentContent: boolean;
  /** Prošnja za posvet — edino polje obrazca, ki pove NAMERO in ne le dovoljenja. */
  consentConsulting: boolean;
  /** Moduli, ki so bili dejansko izračunani. */
  selectedModules: string[];
  /** Ocene VSEH modulov iz triaže — "stalno prestavljamo naloge" je signal tudi brez evrov. */
  triageScores: TriageScores;
  moduleInputs: Record<string, Record<string, number>>;
  outputs: ModuleOutput[];
  totals: {
    directLossEUR: number;
    /** Nezaslužena marža — ločen letni koš (korak 0 prenove). */
    lostMarginEUR: number;
    capacityEUR: number;
    capacityHoursPerMonth: number;
    oneTimeCapitalEUR: number;
    /**
     * Naslovljiv potencial. Odsoten pri segmentih brez konteksta, ki ga ne računajo.
     *
     * Imeni stolpcev ostajata min/max, ker je shema CRM zamrznjena. Odkar odpravljivost
     * ocenimo enkrat (naslovljiv delež glavnega vzroka), sta enaki vrednosti — razlikujeta
     * se le, kadar razpon prinesejo izbrani pasovi skupnih predpostavk (urna postavka,
     * prihodek, marža).
     */
    potentialMinEUR?: number;
    potentialMaxEUR?: number;
  };
  /** Koliko od izračuna je podatek in koliko privzeta vrednost — za presojo leada. */
  confidence?: ConfidenceLevel;
  /** Kontekst podjetja; samo segmenti, ki ga vprašajo. */
  profile?: BusinessProfile;
  followUpSequence: FollowUpSequence;
  utmSource: string | null;
}

export interface BuildLeadExportRecordParams {
  timestampISO: string;
  contact: LeadContact;
  consents: LeadConsents;
  industry: string;
  segment: SegmentId;
  employeeCount: number;
  /** Odsoten pri segmentu brez konteksta — zapis tedaj kontekstnih stolpcev nima. */
  profile: BusinessProfile | undefined;
  selectedModules: string[];
  triageScores: TriageScores;
  moduleInputs: Record<string, Record<string, number>>;
  outputs: ModuleOutput[];
  totals: ResultTotals;
  followUpSequence: FollowUpSequence;
  utmSource: string | null;
}

/**
 * Sestavi izvozni zapis iz istih podatkov, kot jih ima CalculatorFlow ob oddaji.
 *
 * Vrne null brez obvezne privolitve: tip zahteva `gdprConsent: true` in zapis brez
 * nje ne sme obstajati — klicatelj tedaj ne sme poslati ničesar. (Oddaja obrazca
 * privolitev sicer zahteva, a naj varovalo stoji tam, kjer zapis nastane.)
 */
export function buildLeadExportRecord(params: BuildLeadExportRecordParams): LeadExportRecord | null {
  if (!params.consents.consentProcessing) return null;

  return {
    timestampISO: params.timestampISO,
    segment: params.segment,
    industry: params.industry,
    industryLabel: getIndustryLabel(params.industry) || params.industry,
    sizeClass: getSizeClass(params.employeeCount),
    employeeCount: params.employeeCount,
    companyName: params.contact.companyName,
    email: params.contact.email,
    gdprConsent: true,
    firstName: params.contact.firstName,
    lastName: params.contact.lastName,
    phone: params.contact.phone,
    // Normaliziran že v obrazcu (glej types.LeadContact).
    taxNumber: params.contact.taxNumber,
    consentOffers: params.consents.consentOffers,
    consentContent: params.consents.consentContent,
    consentConsulting: params.consents.consentConsulting,
    selectedModules: params.selectedModules,
    triageScores: params.triageScores,
    moduleInputs: params.moduleInputs,
    outputs: params.outputs,
    totals: {
      directLossEUR: params.totals.directLossEUR,
      lostMarginEUR: params.totals.lostMarginEUR,
      capacityEUR: params.totals.capacityEUR,
      capacityHoursPerMonth: params.totals.capacityHoursPerMonth,
      oneTimeCapitalEUR: params.totals.oneTimeCapitalEUR,
      // Ista vrednost v obeh stolpcih: odpravljivost je ocenjena enkrat (glej tip zgoraj).
      potentialMinEUR: params.totals.addressablePotentialEUR,
      potentialMaxEUR: params.totals.addressablePotentialEUR,
    },
    confidence: params.totals.confidence,
    profile: params.profile,
    followUpSequence: params.followUpSequence,
    utmSource: params.utmSource,
  };
}

export function downloadAsJson(record: LeadExportRecord): void {
  const filename = `datalab-lead-${record.segment}-${record.timestampISO.slice(0, 10)}.json`;
  triggerDownload(filename, JSON.stringify(record, null, 2), 'application/json');
}

/**
 * Glava CSV je NAMENOMA fiksna in enaka za vse segmente.
 *
 * Moduli se zdaj razlikujejo po dejavnosti, zato bi dinamični stolpci pomenili
 * drugačno glavo za vsak segment — kar podre vsako CRM preslikavo. Stabilni
 * stolpci nosijo tisto, po čemer prodaja filtrira; celoten vnos po modulih gre
 * v en JSON stolpec, kjer ostane na voljo za analizo.
 *
 * Novi stolpci se dodajajo NA KONEC. Vsaka obstoječa preslikava je pozicijska,
 * zato bi vrivanje na sredino tiho premaknilo vse za njim.
 */
export const CSV_COLUMNS = [
  'timestampISO',
  'segment',
  'industry',
  'industryLabel',
  'sizeClass',
  'employeeCount',
  'companyName',
  'email',
  'gdprConsent',
  'directLossEUR',
  'capacityEUR',
  'capacityHoursPerMonth',
  'oneTimeCapitalEUR',
  'riskCount',
  'risks',
  'selectedModules',
  'triageScores',
  'moduleInputsJson',
  'followUpSequence',
  'utmSource',
  'potentialMinEUR',
  'potentialMaxEUR',
  'confidence',
  // Stolpci so odgovori na kontekstna vprašanja dejavnosti: "businessType" je v
  // proizvodnji način proizvodnje, v logistiki pa vrsta storitve. Poimenovanje po
  // eni dejavnosti bi v CRM-ju trdilo nekaj, česar lead ni odgovoril.
  'businessType',
  'currentSystem',
  'role',
  'operationalHourCostEUR',
  'adminHourCostEUR',
  'hourCostsEstimated',
  // Kontakt je dodan NA KONEC, čeprav vsebinsko sodi k companyName: vrivanje na
  // sredino bi tiho premaknilo vsako obstoječo pozicijsko preslikavo v CRM-ju.
  'firstName',
  'lastName',
  'phone',
  'taxNumber',
  'consentOffers',
  'consentContent',
  // Nezaslužena marža (korak 0 prenove) — na koncu, ker so preslikave pozicijske.
  'lostMarginEUR',
  // Vloga, vpisana ob možnosti "Drugo". Ločen stolpec in ne zlito v 'role': tam je
  // id, po katerem CRM filtrira, tu prosto besedilo obiskovalca.
  'roleOther',
  // Izvor obeh urnih postavk. 'hourCostsEstimated' zgoraj je ena sama logična ALI
  // vrednost čez obe in ne pove, KATERI od štirih poti je številka prišla — odkar
  // je mogoče prevzeti povprečje panoge, je razlika bistvena: "prevzel našo oceno"
  // ni isto kot "izbral razpon". Stolpca sta ločena, ker se postavki lahko
  // razlikujeta (vnesena operativna, prevzeta administrativna).
  'operationalHourSource',
  'adminHourSource',
  // Prošnja za posvet z zadnjega koraka obrazca. NE ob consentOffers/consentContent,
  // čeprav tja vsebinsko sodi: preslikave v CRM so pozicijske in vrivanje na sredino
  // bi tiho premaknilo vsak stolpec za njim.
  'consentConsulting',
] as const;

/** Prazna celica namesto "0" — segment brez te vrednosti je ni izračunal, ni je izmeril kot nič. */
function optionalRounded(value: number | undefined): string {
  return value === undefined ? '' : String(Math.round(value));
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Vrednosti vrstice, NEUBEŽANE — v istem zaporedju kot CSV_COLUMNS.
 *
 * Ločeno od `buildCsvRow` zato, ker ubežanje pripada CSV in ne podatku:
 * webhook (Google Sheet) je dobival `"Trgovina, veleprodaja in distribucija"`
 * z narekovaji vred, ker ima oznaka vejico. Celica preglednice narekovajev ne
 * potrebuje in jih je prikazala kot del besedila.
 *
 * Vrstica je izluščena iz prenosa tudi zato, da lahko test trdi enako dolžino kot
 * CSV_COLUMNS. Dodajanje samo v eno od obeh polj tiho zamakne vse za njim —
 * natanko napaka, pred katero svari opomba nad seznamom stolpcev.
 */
export function buildRowValues(record: LeadExportRecord): string[] {
  const risks = record.outputs.filter((output) => output.bucket === 'risk');

  return [
    record.timestampISO,
    record.segment,
    record.industry,
    record.industryLabel,
    record.sizeClass,
    String(record.employeeCount),
    record.companyName,
    record.email,
    String(record.gdprConsent),
    String(Math.round(record.totals.directLossEUR)),
    String(Math.round(record.totals.capacityEUR)),
    String(Math.round(record.totals.capacityHoursPerMonth)),
    String(Math.round(record.totals.oneTimeCapitalEUR)),
    String(risks.length),
    risks.map((risk) => `${risk.label} (${risk.riskLevel ?? 'n/a'})`).join('; '),
    record.selectedModules.join(';'),
    Object.entries(record.triageScores)
      .map(([id, score]) => `${id}=${score}`)
      .join(';'),
    JSON.stringify(record.moduleInputs),
    record.followUpSequence,
    record.utmSource ?? '',
    optionalRounded(record.totals.potentialMinEUR),
    optionalRounded(record.totals.potentialMaxEUR),
    record.confidence ?? '',
    record.profile?.businessType ?? '',
    record.profile?.currentSystem ?? '',
    record.profile?.role ?? '',
    optionalRounded(record.profile?.operationalHour.valueEUR),
    optionalRounded(record.profile?.adminHour.valueEUR),
    // Prodaja mora vedeti, ali sta urni postavki podatek ali le izbran razpon.
    record.profile ? String(record.profile.operationalHour.estimated || record.profile.adminHour.estimated) : '',
    record.firstName,
    record.lastName,
    record.phone,
    record.taxNumber,
    String(record.consentOffers),
    String(record.consentContent),
    String(Math.round(record.totals.lostMarginEUR)),
    record.profile?.roleOther ?? '',
    record.profile?.operationalHour.source ?? '',
    record.profile?.adminHour.source ?? '',
    String(record.consentConsulting),
  ];
}

/** Ista vrstica, pripravljena za CSV: vejice, narekovaji in prelomi ubežani. */
export function buildCsvRow(record: LeadExportRecord): string[] {
  return buildRowValues(record).map(csvEscape);
}

export function downloadAsCsv(record: LeadExportRecord): void {
  const csv = `${CSV_COLUMNS.join(',')}\n${buildCsvRow(record).join(',')}`;
  const filename = `datalab-lead-${record.segment}-${record.timestampISO.slice(0, 10)}.csv`;
  triggerDownload(filename, csv, 'text/csv');
}
