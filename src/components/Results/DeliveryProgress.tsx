import { formatPercent } from '../../lib/format';
import type { DeliveryPhase } from '../../lib/deliveryProgress';
import { useDeliveryProgress } from '../../lib/useDeliveryProgress';
import styles from './DeliveryProgress.module.css';

interface DeliveryProgressProps {
  /** Faza, ki teče — starš jo javlja iz deliverLead (CalculatorFlow). */
  phase: DeliveryPhase;
}

/**
 * Napredovalna vrstica z odstotki namesto gumbov, dokler oddaja teče.
 *
 * Isti zapis kot vrstica sestave na rezultatih (CompositionBar.module.css):
 * 14 px, --color-accent kot podlaga, znamčna rumena kot polnilo. Obiskovalec
 * na naslednjem zaslonu sreča isto obliko z drugim pomenom, ne nove.
 *
 * Tiktakanje živi TU in ne v obrazcu: vsakih 80 ms se izriše samo vrstica,
 * ne šest polj in štiri kljukice nad njo.
 *
 * role="progressbar" nosi odstotek in fazo (aria-valuetext); napis faze je
 * poleg tega vljudna živa regija, ker se zamenja le petkrat. Odstotek, ki se
 * spreminja vsakih 80 ms, v živo regijo ne sodi — bralnik bi ga bral brez konca.
 */
export function DeliveryProgress({ phase }: DeliveryProgressProps) {
  const { percent, label } = useDeliveryProgress(phase);
  const shown = formatPercent(percent / 100);

  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        <span className={styles.title}>Pripravljam vaše poročilo</span>
        <span className={styles.percent}>{shown}</span>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-label="Priprava poročila"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${shown}, ${label}`}
      >
        <div className={styles.fill} style={{ width: `${percent}%` }}>
          <span className={styles.sheen} aria-hidden="true" />
        </div>
      </div>
      <p className={styles.phase} role="status" aria-live="polite">
        {label}
      </p>
    </div>
  );
}
