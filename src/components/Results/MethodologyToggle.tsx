import styles from './MethodologyToggle.module.css';

interface MethodologyToggleProps {
  formula: string;
  rationale: string;
}

export function MethodologyToggle({ formula, rationale }: MethodologyToggleProps) {
  return (
    <details className={styles.details}>
      <summary className={styles.summary}>Prikaži izračun</summary>
      <div className={styles.body}>
        <code className={styles.formula}>{formula}</code>
        <p>{rationale}</p>
      </div>
    </details>
  );
}
