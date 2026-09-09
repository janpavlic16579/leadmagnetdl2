/**
 * Faze dostave po oddaji obrazca — za napredovalno vrstico na obrazcu.
 *
 * Faze so RESNIČNE: deliverLead jih javi, ko se začnejo (lib/deliverLead.ts,
 * onProgress), 'modules' pa CalculatorFlow pred nalaganjem kode. Odstotek
 * ZNOTRAJ faze je ocena: vrstica se med fazo približuje njeni zgornji meji in
 * je ne doseže, dokler naslednja faza ne nastopi. Tako se vedno premika — tudi
 * med klicem na sprejemnik, ki traja od pol sekunde do trinajst — nikoli pa ne
 * pokaže 100 %, preden je res konec.
 *
 * Napisi so za STRANKO: druga priloga je priprava za svetovalca (pdfSales), a
 * napis tega ne pove — dokument govori o stranki in ne zanjo (deliverLead.ts).
 */
export type DeliveryPhase = 'modules' | 'report' | 'pdf_customer' | 'pdf_sales' | 'send' | 'done';

export interface DeliveryPhaseSpec {
  /** Odstotek ob začetku faze. */
  from: number;
  /** Zgornja meja, ki se ji vrstica približuje, dokler faza traja; doseže jo šele naslednja faza. */
  to: number;
  /** Časovna konstanta približevanja: po tauMs je prehojenih ≈ 63 % razpona faze. */
  tauMs: number;
  label: string;
}

/**
 * Razponi po izmerjenem trajanju: PDF-ja sta najdaljši kos, ki ga obiskovalec
 * ne more prekiniti, zato nosita največ odstotkov; pošiljanje je najbolj
 * negotovo, zato ima najdaljšo konstanto — vrstica se tam premika počasi, a se.
 */
export const DELIVERY_PHASES: Record<DeliveryPhase, DeliveryPhaseSpec> = {
  modules: { from: 0, to: 10, tauMs: 300, label: 'Pripravljam podatke …' },
  report: { from: 10, to: 18, tauMs: 200, label: 'Sestavljam poročilo …' },
  pdf_customer: { from: 18, to: 48, tauMs: 600, label: 'Izdelujem PDF poročilo …' },
  pdf_sales: { from: 48, to: 70, tauMs: 600, label: 'Dokončujem dokumente …' },
  send: { from: 70, to: 96, tauMs: 3000, label: 'Pošiljam poročilo …' },
  done: { from: 100, to: 100, tauMs: 1, label: 'Pripravljeno.' },
};

/** Vrstni red faz — test preverja, da se nobena ne začne pod koncem prejšnje. */
export const DELIVERY_PHASE_ORDER: DeliveryPhase[] = [
  'modules',
  'report',
  'pdf_customer',
  'pdf_sales',
  'send',
  'done',
];

/**
 * Odstotek za fazo po `msInPhase` milisekundah od njenega začetka.
 *
 * Eksponentno približevanje: hitro na začetku, nato vse počasneje — vrstica
 * nikoli ne obstane, a tudi nikoli ne prehiti resnice. Zgornje meje ne doseže
 * niti po minuti (varovalo pod `to`), 'done' je edina faza, ki vrne 100.
 */
export function progressPercent(phase: DeliveryPhase, msInPhase: number): number {
  const { from, to, tauMs } = DELIVERY_PHASES[phase];
  if (to <= from) return from;
  const eased = 1 - Math.exp(-Math.max(0, msInPhase) / tauMs);
  return Math.min(to - 1, Math.floor(from + (to - from) * eased));
}
