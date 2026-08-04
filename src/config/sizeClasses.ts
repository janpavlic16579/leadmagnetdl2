/**
 * Velikostni razredi za CRM zapis.
 *
 * Uporabnika ne sprašujemo za razred — vprašamo ga samo za število zaposlenih,
 * razred pa izpeljemo. Obratno ne gre: iz razreda točnega števila ni mogoče
 * rekonstruirati, zato je vhod vedno številka.
 */
export interface SizeClassBucket {
  label: string;
  min: number;
  max: number | null;
}

export const SIZE_CLASSES: SizeClassBucket[] = [
  { label: '1–9', min: 0, max: 9 },
  { label: '10–49', min: 10, max: 49 },
  { label: '50–249', min: 50, max: 249 },
  { label: '250+', min: 250, max: null },
];

export function getSizeClass(employeeCount: number): string {
  const bucket = SIZE_CLASSES.find(
    (candidate) => employeeCount >= candidate.min && (candidate.max === null || employeeCount <= candidate.max),
  );
  // Varovalo za 0 ali negativno vrednost — UI tega ne dovoli, a funkcija ostane totalna.
  return bucket?.label ?? SIZE_CLASSES[0].label;
}
