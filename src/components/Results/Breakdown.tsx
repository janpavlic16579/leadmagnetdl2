import { MODULE_METHODOLOGY } from '../../../content/methodology';
import type { ModuleAResult, ModuleBResult, ModuleDResult } from '../../lib/calculations';
import { formatEUR, formatHours } from '../../lib/format';
import { MethodologyToggle } from './MethodologyToggle';
import styles from './Breakdown.module.css';

interface BreakdownProps {
  isAccounting: boolean;
  accountingCapacity?: number;
  A?: ModuleAResult;
  B?: ModuleBResult;
  D?: ModuleDResult;
}

export function Breakdown({ isAccounting, accountingCapacity, A, B, D }: BreakdownProps) {
  return (
    <div>
      {A ? (
        <div className={styles.row}>
          <div className={styles.rowHead}>
            <span className={styles.rowLabel}>Ročno delo</span>
            <span className={styles.rowValue}>
              {isAccounting && accountingCapacity !== undefined
                ? `+${accountingCapacity.toFixed(1)} strank`
                : formatEUR(A.annualEUR)}
            </span>
          </div>
          <p className={styles.rowSecondary}>
            {isAccounting
              ? `${formatHours(A.hoursFreedPerMonth)}/mesec sproščenega časa · ${formatEUR(A.annualEUR)}/leto sekundarno`
              : `${formatHours(A.hoursFreedPerMonth)}/mesec sproščenega časa (ne pomeni nižje plačne mase)`}
          </p>
          <MethodologyToggle formula={MODULE_METHODOLOGY.A.formula} rationale={MODULE_METHODOLOGY.A.rationale} />
        </div>
      ) : null}

      {B ? (
        <div className={styles.row}>
          <div className={styles.rowHead}>
            <span className={styles.rowLabel}>Napake</span>
            <span className={styles.rowValue}>{formatEUR(B.annualEUR)}</span>
          </div>
          <MethodologyToggle formula={MODULE_METHODOLOGY.B.formula} rationale={MODULE_METHODOLOGY.B.rationale} />
        </div>
      ) : null}

      {D ? (
        <div className={styles.row}>
          <div className={styles.rowHead}>
            <span className={styles.rowLabel}>Počasen denarni tok</span>
            <span className={styles.rowValue}>{formatEUR(D.annualEUR)}</span>
          </div>
          <MethodologyToggle formula={MODULE_METHODOLOGY.D.formula} rationale={MODULE_METHODOLOGY.D.rationale} />
        </div>
      ) : null}
    </div>
  );
}
