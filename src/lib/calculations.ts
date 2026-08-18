// Vse formule so čiste funkcije (brez I/O) — glej validacijske primere v calculations.test.ts.

export interface ModuleAInput {
  documentsPerMonth: number;
  minutesPerDocument: number;
  hourlyLaborCostEUR: number;
}
export interface ModuleAResult {
  annualEUR: number;
  hoursFreedPerMonth: number;
}
export function calculateModuleA(input: ModuleAInput): ModuleAResult {
  const hoursFreedPerMonth = (input.documentsPerMonth * input.minutesPerDocument) / 60;
  const annualEUR = hoursFreedPerMonth * input.hourlyLaborCostEUR * 12;
  return { annualEUR, hoursFreedPerMonth };
}

export interface ModuleBInput {
  transactionsPerMonth: number;
  errorRatePercent: number; // ulomek, npr. 0.015 = 1.5 %
  costPerErrorEUR: number;
}
export interface ModuleBResult {
  annualEUR: number;
}
export function calculateModuleB(input: ModuleBInput): ModuleBResult {
  const annualEUR = input.transactionsPerMonth * input.errorRatePercent * input.costPerErrorEUR * 12;
  return { annualEUR };
}

export interface ModuleCInput {
  inventoryValueEUR: number;
  achievableReductionPercent: number;
  capitalCostPercent: number;
}
export interface ModuleCResult {
  /** Enkraten sproščen obratni kapital — NIKOLI se ne sešteva v letno izgubo. */
  releasedCapitalEUR: number;
  /** Letni prihranek na strošku kapitala/skladiščenja — edino to gre v skupno letno izgubo. */
  annualEUR: number;
}
export function calculateModuleC(input: ModuleCInput): ModuleCResult {
  const releasedCapitalEUR = input.inventoryValueEUR * input.achievableReductionPercent;
  const annualEUR = releasedCapitalEUR * input.capitalCostPercent;
  return { releasedCapitalEUR, annualEUR };
}

export interface ModuleDInput {
  annualRevenueEUR: number;
  currentDSODays: number;
  targetReductionDays: number;
  opportunityCostPercent: number;
}
export interface ModuleDResult {
  annualEUR: number;
}
export function calculateModuleD(input: ModuleDInput): ModuleDResult {
  const annualEUR = (input.annualRevenueEUR / 365) * input.targetReductionDays * input.opportunityCostPercent;
  return { annualEUR };
}

/** Posebnost segmenta "računovodstvo": ure preračunane v kapaciteto za nove stranke. */
export function calculateAccountingCapacity(
  hoursFreedPerMonth: number,
  avgHoursPerClientPerMonth: number,
): number {
  return hoursFreedPerMonth / avgHoursPerClientPerMonth;
}

export interface TotalLossInput {
  A?: ModuleAResult;
  B?: ModuleBResult;
  C?: ModuleCResult;
  D?: ModuleDResult;
}
export function calculateTotalAnnualLoss(input: TotalLossInput): number {
  return (
    (input.A?.annualEUR ?? 0) +
    (input.B?.annualEUR ?? 0) +
    (input.C?.annualEUR ?? 0) +
    (input.D?.annualEUR ?? 0)
  );
}
