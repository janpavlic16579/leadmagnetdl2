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
 * dejavnost določi celoten nadaljnji vprašalnik, ta podatek pa v nobeno formulo
 * ne vstopi — iz njega se izpelje samo velikostni razred v poročilu
 * (config/sizeClasses.ts), da uporabnik istega podatka ne vnaša dvakrat.
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
        Podatek na izračun ne vpliva — iz njega izpeljemo le velikostni razred podjetja, ki se izpiše v
        poročilu.
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
