import { useId } from 'react';
import type {
  BusinessProfile,
  CostAssumption,
  CostQuestion,
  SegmentContext,
} from '../../config/contexts';
import buttonStyles from '../../styles/buttons.module.css';
import shellStyles from './StepShell.module.css';
import styles from './StepCostBasis.module.css';

interface StepCostBasisProps {
  /** Oznaki in razponi obeh ur — voznikova ura ni operaterjeva. */
  context: SegmentContext;
  profile: BusinessProfile;
  onChange: (profile: BusinessProfile) => void;
  stepLabel: string;
  onNext: () => void;
  onBack: () => void;
}

/**
 * Skupna finančna osnova, vprašana enkrat pred podrobnimi področji.
 *
 * Doslej je vsak modul spraševal za strošek ure posebej — isti podatek trikrat,
 * z možnostjo treh različnih odgovorov. Strošek ure je lastnost podjetja, ne
 * področja.
 *
 * Kdor postavke ne pozna, izbere razpon. Vrednost tedaj ni 0, ampak sredina
 * razpona, rezultat pa dobi nižjo oznako zanesljivosti — ničla bi tiho izničila
 * celotno področje in izgledala kot veljaven izračun.
 */
export function StepCostBasis({
  context,
  profile,
  onChange,
  stepLabel,
  onNext,
  onBack,
}: StepCostBasisProps) {
  return (
    <div className={shellStyles.wrap}>
      <p className={shellStyles.stepLabel}>{stepLabel}</p>
      <h1 className={shellStyles.title}>Skupna finančna osnova</h1>
      <p className={styles.intro}>{context.costBasisIntro}</p>

      <div className={shellStyles.card}>
        <CostField
          question={context.operationalHour}
          value={profile.operationalHour}
          onChange={(operationalHour) => onChange({ ...profile, operationalHour })}
        />
        <CostField
          question={context.adminHour}
          value={profile.adminHour}
          onChange={(adminHour) => onChange({ ...profile, adminHour })}
        />
        {/* Samo dejavnost, ki prodaja ure, pozna zaračunano postavko. */}
        {context.chargeOutRate && (
          <CostField
            question={context.chargeOutRate}
            value={profile.chargeOutRate}
            onChange={(chargeOutRate) => onChange({ ...profile, chargeOutRate })}
          />
        )}
      </div>

      <p className={styles.note}>
        Če katere od postavk ne poznate, izberite razpon. Izračun bo tekel naprej, rezultat pa bo označen z
        nižjo zanesljivostjo — raje to kot navidezno natančen znesek.
      </p>

      <div className={shellStyles.actions}>
        <button type="button" className={buttonStyles.secondaryButton} onClick={onBack}>
          Nazaj
        </button>
        <button type="button" className={buttonStyles.primaryButton} onClick={onNext}>
          Naprej na številke
        </button>
      </div>
    </div>
  );
}

interface CostFieldProps {
  question: CostQuestion;
  value: CostAssumption;
  onChange: (value: CostAssumption) => void;
}

function CostField({ question, value, onChange }: CostFieldProps) {
  const groupId = useId();
  // Sredine pasov so različne, zato izbrani pas prepoznamo po vrednosti.
  const selectedBand = value.estimated
    ? question.bands.find((band) => band.midpointEUR === value.valueEUR)
    : undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={`${groupId}-input`}>
        {question.label}
      </label>
      <p className={styles.help}>{question.help}</p>

      <div className={styles.inputRow}>
        <input
          id={`${groupId}-input`}
          className={styles.input}
          type="number"
          min={0}
          inputMode="numeric"
          placeholder={`npr. ${question.fallbackEUR}`}
          // Ocenjena vrednost se namenoma ne izpiše kot vnos — ni uporabnikov podatek.
          value={value.estimated || !value.valueEUR ? '' : value.valueEUR}
          onChange={(event) =>
            onChange(
              event.target.value === ''
                ? { valueEUR: question.fallbackEUR, estimated: true }
                : { valueEUR: Number(event.target.value), estimated: false },
            )
          }
        />
        <span className={styles.unit}>EUR/h</span>
      </div>

      <fieldset className={styles.bands}>
        <legend className={styles.bandsLegend}>Ne vem — izberi razpon</legend>
        <div className={styles.bandOptions}>
          {question.bands.map((band) => (
            <label
              key={band.id}
              className={`${styles.band} ${selectedBand?.id === band.id ? styles.bandActive : ''}`}
            >
              <input
                type="radio"
                name={groupId}
                checked={selectedBand?.id === band.id}
                onChange={() => onChange({ valueEUR: band.midpointEUR, estimated: true })}
              />
              <span>{band.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
