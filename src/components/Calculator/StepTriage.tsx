import type { ModuleDefinition } from '../../config/modules';
import type { TriageScores } from '../../lib/moduleEngine';
import type { ResolvedSegmentCopy } from '../../config/copy';
import { useStepHeading } from '../../lib/useStepHeading';
import buttonStyles from '../../styles/buttons.module.css';
import shellStyles from './StepShell.module.css';
import styles from './StepTriage.module.css';

interface StepTriageProps {
  /**
   * Naslov in uvod izbrane dejavnosti. Pozivi področij ostanejo v definicijah
   * modulov — to so vprašanja in korak jih le izriše.
   */
  copy: ResolvedSegmentCopy['triage'];
  /** Samo moduli s triažo — diagnostični se prikažejo vedno in se tu ne ocenjujejo. */
  modules: ModuleDefinition[];
  scores: TriageScores;
  onScoresChange: (scores: TriageScores) => void;
  /** Samodejni predlog, ki ga sme uporabnik popraviti. */
  selected: string[];
  onSelectedChange: (selected: string[]) => void;
  /**
   * Koliko področij priporočamo — NE omejuje. Obkljukati je mogoče vsa; prej se je
   * polje ob meji onemogočilo, obiskovalec pa ni izvedel, zakaj je sivo.
   */
  recommendedCount: number;
  stepLabel: string;
  onNext: () => void;
  onBack: () => void;
}

/**
 * "Priporočamo tri" se bere bolje kot "Priporočamo 3". Nad pet se vrne števka —
 * toliko področij nima nobena dejavnost in izmišljati si sklanjatve na zalogo ni
 * smiselno.
 */
const NUMERALS = ['nič', 'eno', 'dve', 'tri', 'štiri', 'pet'];
const numeral = (count: number) => NUMERALS[count] ?? String(count);

export function StepTriage({
  copy,
  modules,
  scores,
  onScoresChange,
  selected,
  onSelectedChange,
  recommendedCount,
  stepLabel,
  onNext,
  onBack,
}: StepTriageProps) {
  const headingRef = useStepHeading();

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onSelectedChange(selected.filter((selectedId) => selectedId !== id));
      return;
    }
    // Ohrani vrstni red prikaza, da je vprašalnik predvidljiv.
    onSelectedChange(modules.filter((m) => m.id === id || selected.includes(m.id)).map((m) => m.id));
  };

  return (
    <div className={shellStyles.wrap}>
      <p className={shellStyles.stepLabel}>{stepLabel}</p>
      <h1 className={shellStyles.title} tabIndex={-1} ref={headingRef}>
        {copy.title}
      </h1>
      {/* Ime dejavnosti je zdaj v naslovu: doslej je bilo namenoma izpuščeno, ker
          je isti zaslon služil vsem, uvod pa je zato govoril o "vašem podjetju"
          tudi tam, kjer smo že vedeli, da gre za proizvodnjo ali servis. */}
      <p className={styles.intro}>{copy.intro}</p>

      <div className={shellStyles.card}>
        {modules.map((definition) => {
          // Brez `?? 0`: vsako področje ima možnost z vrednostjo 0 ("Plan je stabilen",
          // "Redko"), zato je privzeti 0 pomenil, da je bil ob prvem izrisu VSAK od
          // desetih radiov označen na najmilejšem odgovoru. Neodgovor je bil s tem
          // neločljiv od izjave "tu ni bolečine" — in ta razlika je edino, kar loči
          // področje, ki ga podjetje ni ocenilo, od področja, ki ga ne boli.
          // `undefined` pomeni "ni odgovora"; noben radio tedaj ni označen.
          const score: number | undefined = scores[definition.id];
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
          : `Podrobno bomo izračunali ${selected.length} od ${modules.length} področij. Priporočamo ${numeral(recommendedCount)}, izberete pa lahko poljubno mnogo — neizmerjena področja ostanejo prazna in nobene številke si ne izmislimo.`}
      </p>

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
              disabled={selected.length === 0}
            >
              Naprej na številke
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
