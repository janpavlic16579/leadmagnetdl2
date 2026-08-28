import type { ModuleOutput, RiskLevel } from '../../config/modules';
import { deadlineChipText, riskDeadline } from '../../lib/deadlines';
import styles from './RiskCard.module.css';

interface RiskCardProps {
  risks: ModuleOutput[];
  /**
   * Današnji dan — parameter in ne `new Date()` v telesu, da je izračun roka
   * odvisen od podatka in ne od trenutka izrisa (glej lib/deadlines.ts).
   */
  now: Date;
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
export function RiskCard({ risks, now }: RiskCardProps) {
  if (risks.length === 0) return null;

  return (
    <div className={styles.wrap}>
      {risks.map((risk) => {
        // Rok ima samo modul E; ostala tveganja ga nimajo in žetona ne dobijo.
        const deadline = riskDeadline(risk, now);

        return (
          <div key={`${risk.moduleId}-${risk.label}`} className={styles.risk}>
            <div className={styles.head}>
              <span className={styles.label}>{risk.label}</span>
              <span className={styles.badges}>
                {/* Datum stoji ob tveganju in ne le sredi stavka v opombi: rok,
                    zapisan v prozi, se bere kot podatek, rok kot žeton pa kot ura,
                    ki teče — kar tehnični rok tudi je. */}
                {deadline ? (
                  <span
                    className={
                      deadline.expired ? `${styles.deadline} ${styles.deadlineExpired}` : styles.deadline
                    }
                  >
                    {deadlineChipText(deadline)}
                  </span>
                ) : null}
                {risk.riskLevel ? (
                  <span className={`${styles.badge} ${styles[risk.riskLevel]}`}>
                    {LEVEL_LABEL[risk.riskLevel]} tveganje
                  </span>
                ) : null}
              </span>
            </div>
            {risk.note ? <p className={styles.note}>{risk.note}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
