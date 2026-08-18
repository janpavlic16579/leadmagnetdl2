import { useId } from 'react';
import type {
  BusinessProfile,
  ContextOption,
  ContextQuestion,
  SegmentContext,
} from '../../config/contexts';
import { useStepHeading } from '../../lib/useStepHeading';
import buttonStyles from '../../styles/buttons.module.css';
import shellStyles from './StepShell.module.css';
import styles from './StepContext.module.css';

/** Izbrana možnost vprašanja; brez odgovora ali ob neznanem id-ju undefined. */
function selectedOption(
  question: ContextQuestion<ContextOption>,
  selected: string | null,
): ContextOption | undefined {
  if (selected === null) return undefined;
  return question.options.find((option) => option.id === selected);
}

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
  const headingRef = useStepHeading();
  const fieldId = useId();
  const roleNeedsOwnText = selectedOption(context.role, profile.role)?.freeText === true;
  const canProceed =
    profile.businessType !== null &&
    profile.currentSystem !== null &&
    profile.role !== null &&
    // "Drugo" brez vpisa pove enako malo kot neodgovorjeno vprašanje.
    (!roleNeedsOwnText || profile.roleOther.trim() !== '');

  function group(
    question: ContextQuestion<ContextOption>,
    selected: string | null,
    onSelect: (id: string) => void,
    /** Vpisno polje pod možnostmi; izriše se le, kadar izbrana možnost to zahteva. */
    freeText?: { label: string; placeholder: string; value: string; onChange: (next: string) => void },
  ) {
    const showFreeText = freeText !== undefined && selectedOption(question, selected)?.freeText === true;

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
        {showFreeText && (
          <div className={styles.freeText}>
            <label className={styles.freeTextLabel} htmlFor={`${fieldId}-free`}>
              {freeText.label}
            </label>
            <input
              id={`${fieldId}-free`}
              className={styles.freeTextInput}
              type="text"
              maxLength={80}
              placeholder={freeText.placeholder}
              value={freeText.value}
              onChange={(event) => freeText.onChange(event.target.value)}
            />
          </div>
        )}
      </fieldset>
    );
  }

  return (
    <div className={shellStyles.wrap}>
      <p className={shellStyles.stepLabel}>{stepLabel}</p>
      <h1 className={shellStyles.title} tabIndex={-1} ref={headingRef}>
        {context.title}
      </h1>
      <p className={styles.intro}>{context.intro}</p>

      <div className={shellStyles.card}>
        {group(context.businessType, profile.businessType, (businessType) =>
          onChange({ ...profile, businessType }),
        )}
        {group(context.currentSystem, profile.currentSystem, (currentSystem) =>
          onChange({ ...profile, currentSystem }),
        )}
        {group(
          context.role,
          profile.role,
          (role) => {
            // Vpis pripada samo vlogi, ob kateri je nastal — sicer bi ga v izvoz
            // odnesel obiskovalec, ki si je premislil in izbral našteto vlogo.
            const keep = selectedOption(context.role, role)?.freeText === true;
            onChange({ ...profile, role, roleOther: keep ? profile.roleOther : '' });
          },
          {
            label: 'Vpišite svojo funkcijo',
            placeholder: 'npr. vodja IT',
            value: profile.roleOther,
            onChange: (roleOther) => onChange({ ...profile, roleOther }),
          },
        )}
      </div>

      <div className={shellStyles.stickyFooter}>
        <div className={shellStyles.stickyFooterInner}>
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
      </div>
    </div>
  );
}
