import { isUnknownAnswer, type ModuleDefinition } from '../config/modules/moduleTypes';

/**
 * Plauzibilnostna ovojnica iz števila zaposlenih.
 *
 * Število zaposlenih je bilo doslej zajeto in zavrženo ("Podatek na izračun ne
 * vpliva") — nič ni preprečilo, da 12-člansko podjetje vnese 900 ur čakanja na
 * mesec, kar je 5,6 zaposlenega. Tu se iz števila zaposlenih izpelje mehka meja:
 * vsota vnesenih "izgubljenih" ur, ki preseže razumen delež skupne kapacitete,
 * sproži opozorilo — nikoli blokade, ker je podatek lahko resničen (agencijski
 * delavci, študenti), izračun pa mora ostati obiskovalčev in ne naš.
 *
 * Čista funkcija brez UI, da jo delita vprašalnik in prodajna priprava — prodajnik
 * mora isti sum videti v svojem dokumentu, sicer številko na sestanku brani naslepo.
 */

/** Polna mesečna kapaciteta enega zaposlenega: 40 h/teden × ~4,3 tedna, zaokroženo. */
export const HOURS_PER_EMPLOYEE_PER_MONTH = 160;

/**
 * Nad tem deležem skupne kapacitete vnesene ure niso več verjetne.
 *
 * KALIBRACIJA: 40 % je začetna ocena, ne empirija. Podjetje, ki bi na neproduktivno
 * delo res izgubljalo skoraj polovico vseh ur, ne bi več poslovalo — a prag mora
 * ostati dovolj visok, da poštenega vnosa ne obtožuje. Preveriti po prvih ~50 vnosih.
 */
export const PLAUSIBLE_CAPACITY_SHARE = 0.4;

export interface HoursPlausibility {
  enteredHoursPerMonth: number;
  availableHoursPerMonth: number;
  employeeCount: number;
  /** enteredHoursPerMonth / availableHoursPerMonth. */
  capacityShare: number;
  exceedsPlausible: boolean;
}

/**
 * Sešteje vse vnesene ure na mesec čez aktivna področja in jih primerja s
 * kapaciteto. Vrne null, kadar primerjava ni mogoča (ni podatka o zaposlenih)
 * ali ni potrebna (nobene vnesene ure) — klicatelju ostane samo prikaz.
 *
 * Šteje se VNESENA vrednost, ne razrešena: polja contextOnly ne vstopajo v
 * formulo, "Ne vem" pa ni ura. Enoti h/mesec in h/leto pokrivata vsa urna polja
 * registra (glej test, ki to preverja).
 */
export function assessHoursPlausibility(
  modules: ModuleDefinition[],
  values: Record<string, Record<string, number>>,
  employeeCount: number,
): HoursPlausibility | null {
  if (!Number.isFinite(employeeCount) || employeeCount <= 0) return null;

  let enteredHoursPerMonth = 0;
  for (const definition of modules) {
    const moduleValues = values[definition.id] ?? {};
    for (const field of definition.fields) {
      if (field.contextOnly) continue;
      const value = moduleValues[field.key];
      if (!Number.isFinite(value) || isUnknownAnswer(value)) continue;
      if (field.unit === 'h/mesec') enteredHoursPerMonth += value;
      else if (field.unit === 'h/leto') enteredHoursPerMonth += value / 12;
    }
  }
  if (enteredHoursPerMonth <= 0) return null;

  const availableHoursPerMonth = employeeCount * HOURS_PER_EMPLOYEE_PER_MONTH;
  const capacityShare = enteredHoursPerMonth / availableHoursPerMonth;

  return {
    enteredHoursPerMonth,
    availableHoursPerMonth,
    employeeCount,
    capacityShare,
    exceedsPlausible: capacityShare > PLAUSIBLE_CAPACITY_SHARE,
  };
}

/**
 * Besedilo opozorila — eno mesto za vprašalnik in prodajno pripravo, da se
 * formulaciji ne razideta. Null, kadar opozorila ni.
 */
export function hoursPlausibilityWarning(check: HoursPlausibility | null): string | null {
  if (!check || !check.exceedsPlausible) return null;
  const percent = Math.round(check.capacityShare * 100);
  return (
    `Vnesene ure (${Math.round(check.enteredHoursPerMonth)} h/mesec) so ${percent} % ` +
    `skupne mesečne kapacitete ${check.employeeCount} zaposlenih ` +
    `(pribl. ${Math.round(check.availableHoursPerMonth)} h). Preverite, da se iste ure ` +
    `ne štejejo v dveh področjih — rezultat je sicer precenjen.`
  );
}
