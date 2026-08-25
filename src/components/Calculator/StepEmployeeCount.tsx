import type { BasicInfo } from '../../types';
import { SHARED_COPY } from '../../config/copy';
import { useStepHeading } from '../../lib/useStepHeading';
import { NumberField } from './NumberField';
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
  const headingRef = useStepHeading();
  const canProceed = value.employeeCount > 0;

  return (
    <div className={styles.wrap}>
      <p className={styles.stepLabel}>{stepLabel}</p>
      {/* Vprašanje, ne nagovor — zato skupno vsem dejavnostim (config/copy). */}
      <h1 className={styles.title} tabIndex={-1} ref={headingRef}>
        {SHARED_COPY.employeeCountTitle}
      </h1>

      <div className={styles.card}>
        <div className={ownStyles.inputRow}>
          <NumberField
            id="employeeCount"
            className={`${styles.input} ${ownStyles.numberInput}`}
            // Zaposleni so cela števila in jih ni več kot nekaj deset tisoč: brez
            // zgornje meje je "1e400" dal Infinity, velikostni razred pa "250+".
            min={0}
            max={100_000}
            integer
            inputMode="numeric"
            aria-label="Število zaposlenih"
            value={value.employeeCount || null}
            onChange={(employeeCount) => onChange({ ...value, employeeCount: employeeCount ?? 0 })}
            onEnter={canProceed ? onNext : undefined}
          />
          <span className={ownStyles.unit}>zaposlenih</span>
        </div>
      </div>

      <p className={styles.trustNote}>{SHARED_COPY.employeeCountNote}</p>

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
