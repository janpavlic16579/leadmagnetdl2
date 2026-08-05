import type {
  BusinessProfile,
  ContextOption,
  ContextQuestion,
  SegmentContext,
} from '../../config/contexts';
import buttonStyles from '../../styles/buttons.module.css';
import shellStyles from './StepShell.module.css';
import styles from './StepContext.module.css';

interface StepContextProps {
  /** Besedila in možnosti dejavnosti — korak sam ne pozna nobene panoge. */
  context: SegmentContext;
  profile: BusinessProfile;
  onChange: (profile: BusinessProfile) => void;
  stepLabel: string;
  onNext: () => void;
  onBack: () => void;
}

/**
 * Kontekst podjetja. Nobeden od teh odgovorov ne vstopa v formulo posameznega
 * področja — sedanji sistem določa, kolikšen del izmerjenega stroška je realno
 * mogoče nasloviti, in ali so tehnična opozorila za tega obiskovalca smiselna.
 *
 * Vprašanja prihajajo iz konfiguracije dejavnosti (config/contexts/), ker so v
 * proizvodnji in logistiki ista po vlogi, a ne po besedah: "Kako pretežno
 * proizvajate?" prevozniku ne pomeni ničesar. Dvojnik tega zaslona na dejavnost
 * bi isti popravek postavitve zahteval na dveh mestih.
 *
 * Dejavnosti ne sprašujemo znova: izbrana je bila v prvem koraku.
 */
export function StepContext({ context, profile, onChange, stepLabel, onNext, onBack }: StepContextProps) {
  const canProceed =
    profile.businessType !== null && profile.currentSystem !== null && profile.role !== null;

  function group(
    question: ContextQuestion<ContextOption>,
    selected: string | null,
    onSelect: (id: string) => void,
  ) {
    return (
      <fieldset className={styles.block}>
        <legend className={styles.blockTitle}>{question.legend}</legend>
        <div className={styles.options}>
          {question.options.map((option) => (
            <label
              key={option.id}
              className={`${styles.option} ${selected === option.id ? styles.optionActive : ''}`}
            >
              <input
                type="radio"
                name={`context-${question.legend}`}
                checked={selected === option.id}
                onChange={() => onSelect(option.id)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  return (
    <div className={shellStyles.wrap}>
      <p className={shellStyles.stepLabel}>{stepLabel}</p>
      <h1 className={shellStyles.title}>{context.title}</h1>
      <p className={styles.intro}>{context.intro}</p>

      <div className={shellStyles.card}>
        {group(context.businessType, profile.businessType, (businessType) =>
          onChange({ ...profile, businessType }),
        )}
        {group(context.currentSystem, profile.currentSystem, (currentSystem) =>
          onChange({ ...profile, currentSystem }),
        )}
        {group(context.role, profile.role, (role) => onChange({ ...profile, role }))}
      </div>

      <div className={shellStyles.actions}>
        <button type="button" className={buttonStyles.secondaryButton} onClick={onBack}>
          Nazaj
        </button>
        <button
          type="button"
          className={buttonStyles.primaryButton}
          onClick={onNext}
          disabled={!canProceed}
        >
          Naprej
        </button>
      </div>
    </div>
  );
}
