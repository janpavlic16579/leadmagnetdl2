import { MODULE_METHODOLOGY } from '../../../content/methodology';
import { MAIN_CAUSE_KEY } from '../../config/modules/addressableShare';
import type { BucketId, ModuleDefinition, ModuleOutput } from '../../config/modules';
import { fieldAnswerText, isAnswered } from '../../lib/answerLabels';
import { formatEUR, formatHours } from '../../lib/format';
import { MethodologyToggle, type MethodologyAnswer } from './MethodologyToggle';
import styles from './Breakdown.module.css';

/**
 * Polja, ki jih je obiskovalec res izpolnil — nedotaknjeni privzetki odpadejo.
 *
 * Vzrok ("Kaj je glavni vzrok?") tudi: v znesek ne vstopa, ampak določa naslovljiv
 * delež pri potencialu, zato bi ga bralec med množitelji zneska iskal zaman.
 */
function answeredFields(
  definition: ModuleDefinition,
  values: Record<string, number> | undefined,
): MethodologyAnswer[] {
  if (!values) return [];
  return definition.fields
    .filter((field) => field.key !== MAIN_CAUSE_KEY && isAnswered(field, values[field.key]))
    .map((field) => ({
      label: field.label,
      value: fieldAnswerText(field, values[field.key]),
    }));
}

interface BreakdownProps {
  /** Moduli v prikaznem vrstnem redu — samo tisti, ki imajo denarni izid. */
  modules: ModuleDefinition[];
  outputsByModule: Record<string, ModuleOutput[]>;
  /** Kateri koši se izpišejo v tej razčlenitvi. */
  buckets: BucketId[];
  /** Razrešeni vnosi po modulu — v izračunu pokažejo, iz česa znesek nastane. */
  valuesByModule?: Record<string, Record<string, number>>;
}

export function Breakdown({ modules, outputsByModule, buckets, valuesByModule }: BreakdownProps) {
  const rows = modules
    .map((definition) => ({
      definition,
      outputs: (outputsByModule[definition.id] ?? []).filter(
        (output) => buckets.includes(output.bucket) && (output.valueEUR ?? 0) > 0,
      ),
    }))
    .filter((row) => row.outputs.length > 0);

  if (rows.length === 0) return null;

  return (
    <div>
      {rows.map(({ definition, outputs }) => {
        const total = outputs.reduce((sum, output) => sum + (output.valueEUR ?? 0), 0);
        const hours = outputs.reduce((sum, output) => sum + (output.hoursPerMonth ?? 0), 0);
        const methodology = MODULE_METHODOLOGY[definition.id];
        const answers = answeredFields(definition, valuesByModule?.[definition.id]);

        return (
          <div key={definition.id} className={styles.row}>
            <div className={styles.rowHead}>
              <span className={styles.rowLabel}>{definition.title}</span>
              <span className={styles.rowValue}>{formatEUR(total)}</span>
            </div>

            {/* Podpostavke izpišemo le, kadar jih je več — sicer je to podvajanje naslova. */}
            {outputs.length > 1 ? (
              <ul className={styles.subList}>
                {outputs.map((output) => (
                  <li key={output.label}>
                    <span>{output.label}</span>
                    <span>{formatEUR(output.valueEUR ?? 0)}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {hours > 0 ? (
              <p className={styles.rowSecondary}>{formatHours(hours)}/mesec sproščenega časa</p>
            ) : null}

            {definition.pantheon ? (
              <p className={styles.pantheon}>
                <span className={styles.pantheonLabel}>PANTHEON naslavlja:</span>{' '}
                {definition.pantheon.join(' · ')}
              </p>
            ) : null}

            {methodology ? (
              <MethodologyToggle
                formula={methodology.formula}
                rationale={methodology.rationale}
                answers={answers}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
