import styles from './MethodologyToggle.module.css';

export interface MethodologyAnswer {
  label: string;
  value: string;
}

interface MethodologyToggleProps {
  formula: string;
  rationale: string;
  /**
   * Številke, ki jih je obiskovalec za to področje res vnesel.
   *
   * Formula je simbolna ("ure × postavka × 12") in sama po sebi ne dokaže ničesar
   * o TEM znesku — bralec je moral verjeti, da so bile vanjo vstavljene njegove
   * vrednosti. Ker je celotna obljuba orodja "nobene številke si ne izmislimo",
   * je bila prav ta povezava najbolj vredna prikaza.
   */
  answers?: MethodologyAnswer[];
}

export function MethodologyToggle({ formula, rationale, answers = [] }: MethodologyToggleProps) {
  return (
    <details className={styles.details}>
      {/* Besedilo se ob odprtju zamenja — "Prikaži izračun" nad odprtim izračunom
          je napačen napotek in edini gumb na strani, ki ne pove svojega stanja. */}
      <summary className={styles.summary}>
        <span className={styles.summaryClosed}>Prikaži izračun</span>
        <span className={styles.summaryOpen}>Skrij izračun</span>
      </summary>
      <div className={styles.body}>
        <code className={styles.formula}>{formula}</code>
        {answers.length > 0 ? (
          <>
            <p className={styles.answersTitle}>Vaše številke za to področje:</p>
            <ul className={styles.answers}>
              {answers.map((answer) => (
                <li key={answer.label}>
                  <span>{answer.label}</span>
                  <span className={styles.answerValue}>{answer.value}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        <p>{rationale}</p>
      </div>
    </details>
  );
}
