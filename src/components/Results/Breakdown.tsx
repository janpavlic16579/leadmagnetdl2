import { MODULE_METHODOLOGY } from '../../../content/methodology';
import type { BucketId, ModuleDefinition, ModuleOutput } from '../../config/modules';
import { formatEUR, formatHours } from '../../lib/format';
import { MethodologyToggle } from './MethodologyToggle';
import styles from './Breakdown.module.css';

interface BreakdownProps {
  /** Moduli v prikaznem vrstnem redu — samo tisti, ki imajo denarni izid. */
  modules: ModuleDefinition[];
  outputsByModule: Record<string, ModuleOutput[]>;
  /** Kateri koši se izpišejo v tej razčlenitvi. */
  buckets: BucketId[];
}

export function Breakdown({ modules, outputsByModule, buckets }: BreakdownProps) {
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
              <MethodologyToggle formula={methodology.formula} rationale={methodology.rationale} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
