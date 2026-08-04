import type { ModuleCResult } from '../../lib/calculations';
import { formatEUR } from '../../lib/format';
import styles from './ModuleC.module.css';

interface ModuleCProps {
  result: ModuleCResult;
}

export function ModuleC({ result }: ModuleCProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <p className={styles.cardLabel}>Sproščen obratni kapital (enkratno)</p>
        <p className={styles.cardValue}>{formatEUR(result.releasedCapitalEUR)}</p>
      </div>
      <div className={styles.card}>
        <p className={styles.cardLabel}>Letni prihranek na stroških kapitala</p>
        <p className={styles.cardValue}>{formatEUR(result.annualEUR)}</p>
      </div>
      <p className={styles.note}>
        Ti dve številki se med seboj ne seštevata: sproščeni kapital je enkraten dogodek, letni prihranek pa
        ponavljajoč se strošek, ki ga tudi štejemo v skupno letno izgubo.
      </p>
    </div>
  );
}
