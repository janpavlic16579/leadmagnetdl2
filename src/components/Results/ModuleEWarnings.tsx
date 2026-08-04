import { MODULE_E_ITEMS } from '../../config/segments';
import type { ModuleEChecked } from '../../lib/calculations';
import styles from './ModuleEWarnings.module.css';

interface ModuleEWarningsProps {
  checked: ModuleEChecked;
}

export function ModuleEWarnings({ checked }: ModuleEWarningsProps) {
  const active = MODULE_E_ITEMS.filter((item) => checked[item.id]);
  if (active.length === 0) return null;

  return (
    <div className={styles.wrap}>
      {active.map((item) => (
        <div key={item.id} className={styles.warning}>
          {item.warningText}
        </div>
      ))}
    </div>
  );
}
