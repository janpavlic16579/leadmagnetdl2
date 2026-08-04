import type { ModuleDefinition } from '../../config/modules';
import type { TriageScores } from '../../lib/moduleEngine';
import buttonStyles from '../../styles/buttons.module.css';
import shellStyles from './StepShell.module.css';
import styles from './StepTriage.module.css';

interface StepTriageProps {
  /** Samo moduli s triažo — diagnostični se prikažejo vedno in se tu ne ocenjujejo. */
  modules: ModuleDefinition[];
  scores: TriageScores;
  onScoresChange: (scores: TriageScores) => void;
  /** Samodejni predlog, ki ga sme uporabnik popraviti. */
  selected: string[];
  onSelectedChange: (selected: string[]) => void;
  maxSelected: number;
  stepLabel: string;
  onNext: () => void;
  onBack: () => void;
}

export function StepTriage({
  modules,
  scores,
  onScoresChange,
  selected,
  onSelectedChange,
  maxSelected,
  stepLabel,
  onNext,
  onBack,
}: StepTriageProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onSelectedChange(selected.filter((selectedId) => selectedId !== id));
      return;
    }
    if (selected.length >= maxSelected) return;
    // Ohrani prioritetni vrstni red, da je vprašalnik predvidljiv.
    onSelectedChange(modules.filter((m) => m.id === id || selected.includes(m.id)).map((m) => m.id));
  };

  const atLimit = selected.length >= maxSelected;

  return (
    <div className={shellStyles.wrap}>
      <p className={shellStyles.stepLabel}>{stepLabel}</p>
      <h1 className={shellStyles.title}>Kje vas najbolj tišči?</h1>
      <p className={styles.intro}>
        Na hitro ocenite vsako področje. Podrobna vprašanja vam nato zastavimo samo za največje težave — tako
        vprašalnik ostane kratek, izračun pa specifičen za vašo proizvodnjo.
      </p>

      <div className={shellStyles.card}>
        {modules.map((definition) => {
          const score = scores[definition.id] ?? 0;
          const isSelected = selected.includes(definition.id);

          return (
            <fieldset key={definition.id} className={styles.moduleBlock}>
              <legend className={styles.moduleTitle}>{definition.title}</legend>
              <p className={styles.prompt}>{definition.triage!.prompt}</p>
              <div className={styles.options}>
                {definition.triage!.options.map((option) => (
                  <label
                    key={option.value}
                    className={`${styles.option} ${score === option.value ? styles.optionActive : ''}`}
                  >
                    <input
                      type="radio"
                      name={`triage-${definition.id}`}
                      checked={score === option.value}
                      onChange={() => onScoresChange({ ...scores, [definition.id]: option.value })}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              <label className={styles.includeRow}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={!isSelected && atLimit}
                  onChange={() => toggle(definition.id)}
                />
                <span>Izračunaj podrobno</span>
              </label>
            </fieldset>
          );
        })}
      </div>

      <p className={styles.note}>
        {selected.length === 0
          ? 'Izberite vsaj eno področje za podroben izračun.'
          : `Podrobno bomo izračunali ${selected.length} od ${maxSelected} možnih področij. Ostala ostanejo neizmerjena — nobene številke si ne izmislimo.`}
      </p>

      <div className={shellStyles.actions}>
        <button type="button" className={buttonStyles.secondaryButton} onClick={onBack}>
          Nazaj
        </button>
        <button
          type="button"
          className={buttonStyles.primaryButton}
          onClick={onNext}
          disabled={selected.length === 0}
        >
          Naprej na številke
        </button>
      </div>
    </div>
  );
}
