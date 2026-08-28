import { MODULE_E_ITEMS } from '../config/modules/moduleE';
import { isoDate } from './format';

/**
 * Tehnični in regulatorni roki, kot jih sme videti stranka.
 *
 * Modul E doslej ni imel datuma nikjer razen v prozi opozorila ("Podpora … se
 * konča 12. 1. 2027"). Rok, ki je zapisan sredi stavka, se bere kot podatek;
 * rok, ki stoji kot žeton ob tveganju, se bere kot ura, ki teče — in prav to
 * tudi je.
 *
 * Datoteka namenoma NE uvaža config/icp.ts, čeprav ima ta `daysUntil`:
 * (1) pdf.ts ne sme uvažati ničesar s prodajne poti (varuje pdf.test.ts), tudi
 * posredno ne, in (2) štetje dni je prodajni pripomoček — svetovalcu pove, kako
 * nujen je klic. Stranki povemo datum in ali je mimo; odštevanje dni bi bilo
 * pritiskanje, ki mu poročilo z lastno metodološko zadržanostjo nasprotuje.
 */

export interface RiskDeadline {
  dateISO: string;
  /** Datum po slovensko, npr. "14. 7. 2026". */
  dateLabel: string;
  /** Rok je mimo — velja od prvega dne PO datumu, dan roka sam še šteje. */
  expired: boolean;
}

/**
 * "2026-07-14" → "14. 7. 2026".
 *
 * Sestavljeno iz delov niza in ne prek `new Date(...)`: konstruktor bi ISO zapis
 * razumel kot polnoč UTC in v našem časovnem pasu je to lahko prejšnji dan —
 * ista past, ki jo pri današnjem datumu lovi isoDate().
 */
export function slovenianDateLabel(dateISO: string): string {
  const [year, month, day] = dateISO.split('-');
  if (!year || !month || !day) return dateISO;
  return `${Number(day)}. ${Number(month)}. ${year}`;
}

/**
 * Rok, ki pripada tveganju — ali `null`, kadar ga tveganje nima.
 *
 * Ujemanje po oznaki in ne po ključu, ker izhod modula ključa ne nosi:
 * moduleE.compute() zapiše `label: item.label` in ključ ostane v definiciji
 * polja. Krhkost tega ujemanja varuje test, ki za VSAK MODULE_E_ITEMS preveri,
 * da se skozi to funkcijo razreši.
 *
 * `now` je parameter in ne `new Date()` v telesu: brez tega bi bil test o
 * poteklem roku odvisen od dneva, ko teče.
 */
export function riskDeadline(risk: { moduleId?: string; label: string }, now: Date): RiskDeadline | null {
  if (risk.moduleId !== 'E') return null;

  const item = MODULE_E_ITEMS.find((candidate) => candidate.label === risk.label);
  if (!item) return null;

  return {
    dateISO: item.warningDate,
    dateLabel: slovenianDateLabel(item.warningDate),
    // Primerjava nizov YYYY-MM-DD je leksikografsko enaka primerjavi datumov,
    // brez pasti časovnih pasov in poletnega časa.
    expired: item.warningDate < isoDate(now),
  };
}

/**
 * Besedilo žetona ob tveganju.
 *
 * Pretekli rok dobi svojo besedo: "do 14. 7. 2026" pri datumu, ki je mimo, bi
 * bralca pustil, da sam ugotovi, kaj to pomeni — pri roku, ki je že potekel, pa
 * je prav to edino, kar šteje.
 */
export function deadlineChipText(deadline: RiskDeadline): string {
  return deadline.expired ? `poteklo ${deadline.dateLabel}` : `rok ${deadline.dateLabel}`;
}
