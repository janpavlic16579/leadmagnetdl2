import { INDUSTRIES } from '../../config/industries';
import type { BasicInfo } from '../../types';
import buttonStyles from '../../styles/buttons.module.css';
import styles from './StepShell.module.css';

interface StepBasicInfoProps {
  value: BasicInfo;
  onChange: (value: BasicInfo) => void;
  onNext: () => void;
}

/**
 * Uvodni korak je enak za vse obiskovalce — segment se izpelje šele iz odgovora
 * o dejavnosti. Zato sta oznaki fiksni in ne prihajata iz segmentne konfiguracije.
 *
 * Velikostnega razreda ne sprašujemo: izpeljemo ga iz števila zaposlenih
 * (glej config/sizeClasses.ts), da uporabnik istega podatka ne vnaša dvakrat.
 */
const INDUSTRY_QUESTION = 'S čim se ukvarja vaše podjetje?';
const EMPLOYEE_COUNT_QUESTION = 'Koliko ljudi zaposlujete?';

export function StepBasicInfo({ value, onChange, onNext }: StepBasicInfoProps) {
  const canProceed = value.industry.length > 0 && value.employeeCount > 0;

  return (
    <div className={styles.wrap}>
      <h1 className={styles.introTitle}>Koliko vas stane sedanji način dela?</h1>
      <p className={styles.introSubtitle}>
        Odgovorite na nekaj vprašanj o svojem poslovanju in v dveh minutah dobite razčlenjen izračun letnih
        skritih stroškov — brez vnosa e-naslova.
      </p>

      <div className={styles.card}>
        <div className={styles.formRow}>
          <label className={styles.formLabel} htmlFor="industry">
            {INDUSTRY_QUESTION}
          </label>
          <select
            id="industry"
            className={styles.select}
            value={value.industry}
            onChange={(event) => onChange({ ...value, industry: event.target.value })}
          >
            <option value="">Izberite …</option>
            {INDUSTRIES.map((industry) => (
              <option key={industry.id} value={industry.id}>
                {industry.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formRow}>
          <label className={styles.formLabel} htmlFor="employeeCount">
            {EMPLOYEE_COUNT_QUESTION}
          </label>
          <input
            id="employeeCount"
            className={styles.input}
            type="number"
            min={1}
            value={value.employeeCount || ''}
            onChange={(event) => onChange({ ...value, employeeCount: Number(event.target.value) || 0 })}
          />
        </div>
      </div>

      <p className={styles.trustNote}>
        Ves izračun poteka v vašem brskalniku. Nič od vnesenih podatkov ne zapusti brskalnika, dokler se sami ne
        odločite oddati obrazca za PDF poročilo.
      </p>

      <div className={`${styles.actions} ${styles.actionsEnd}`}>
        <button type="button" className={buttonStyles.primaryButton} disabled={!canProceed} onClick={onNext}>
          Naprej
        </button>
      </div>
    </div>
  );
}
