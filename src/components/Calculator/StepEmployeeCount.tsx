import type { BasicInfo } from '../../types';
import buttonStyles from '../../styles/buttons.module.css';
import styles from './StepShell.module.css';
import ownStyles from './StepEmployeeCount.module.css';

interface StepEmployeeCountProps {
  value: BasicInfo;
  onChange: (value: BasicInfo) => void;
  stepLabel: string;
  onNext: () => void;
  onBack: () => void;
}

/**
 * Število zaposlenih ima svoj korak, ker z dejavnostjo nima ničesar skupnega:
 * dejavnost določi celoten nadaljnji vprašalnik.
 *
 * V nobeno formulo res ne vstopi, ni pa neuporabljen — trditev "na izračun ne
 * vpliva" je bila zavajajoča v obe smeri. Iz njega se izpelje velikostni razred
 * v poročilu (config/sizeClasses.ts), predvsem pa ovojnica verjetnosti
 * (lib/plausibility.ts): vnesene ure se primerjajo s kapaciteto ekipe in
 * izračun opozori, kadar jih je preveč. Nosi tudi del ICP ocene in oceno
 * velikosti posla v prodajni pripravi (config/icp.ts).
 */
export function StepEmployeeCount({ value, onChange, stepLabel, onNext, onBack }: StepEmployeeCountProps) {
  const canProceed = value.employeeCount > 0;

  return (
    <div className={styles.wrap}>
      <p className={styles.stepLabel}>{stepLabel}</p>
      <h1 className={styles.title}>Koliko ljudi zaposlujete?</h1>

      <div className={styles.card}>
        <div className={ownStyles.inputRow}>
          <input
            id="employeeCount"
            className={`${styles.input} ${ownStyles.numberInput}`}
            type="number"
            min={1}
            inputMode="numeric"
            aria-label="Število zaposlenih"
            value={value.employeeCount || ''}
            onChange={(event) => onChange({ ...value, employeeCount: Number(event.target.value) || 0 })}
          />
          <span className={ownStyles.unit}>zaposlenih</span>
        </div>
      </div>

      <p className={styles.trustNote}>
        Podatek ne vstopa v noben znesek — iz njega izpeljemo velikostni razred podjetja in preverimo,
        ali so vnesene ure skladne z velikostjo vaše ekipe.
      </p>

      <div className={styles.stickyFooter}>
        <div className={styles.stickyFooterInner}>
          <div className={styles.actions}>
            <button type="button" className={buttonStyles.secondaryButton} onClick={onBack}>
              Nazaj
            </button>
            <button type="button" className={buttonStyles.primaryButton} disabled={!canProceed} onClick={onNext}>
              Naprej
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
