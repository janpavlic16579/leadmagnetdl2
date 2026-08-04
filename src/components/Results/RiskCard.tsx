import type { ModuleOutput, RiskLevel } from '../../config/modules';
import styles from './RiskCard.module.css';

interface RiskCardProps {
  risks: ModuleOutput[];
}

const LEVEL_LABEL: Record<RiskLevel, string> = {
  low: 'Nizko',
  medium: 'Srednje',
  high: 'Visoko',
};

/**
 * Marža in procesna tveganja. Namenoma brez zneskov v evrih: kjer podjetje nima
 * kalkulacije ali sledljivosti, natančnega zneska ni mogoče izračunati — prav to
 * je težava, in navidezno natančna številka bi jo prikrila.
 */
export function RiskCard({ risks }: RiskCardProps) {
  if (risks.length === 0) return null;

  return (
    <div className={styles.wrap}>
      {risks.map((risk) => (
        <div key={`${risk.moduleId}-${risk.label}`} className={styles.risk}>
          <div className={styles.head}>
            <span className={styles.label}>{risk.label}</span>
            {risk.riskLevel ? (
              <span className={`${styles.badge} ${styles[risk.riskLevel]}`}>
                {LEVEL_LABEL[risk.riskLevel]} tveganje
              </span>
            ) : null}
          </div>
          {risk.note ? <p className={styles.note}>{risk.note}</p> : null}
        </div>
      ))}
    </div>
  );
}
