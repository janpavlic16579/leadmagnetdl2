import type { ModuleDefinition } from '../../config/modules';
import type { SegmentConfig } from '../../config/segments';
import { formatEUR } from '../../lib/format';
import type { ModuleInputsState } from '../../types';
import { ModuleSection } from './ModuleSection';
import buttonStyles from '../../styles/buttons.module.css';
import shellStyles from './StepShell.module.css';
import styles from './StepInputs.module.css';

interface StepInputsProps {
  segment: SegmentConfig;
  /** Že razrešeni moduli: izbrani v triaži plus tisti, ki se prikažejo vedno. */
  modules: ModuleDefinition[];
  /** Vrednosti po modulu, dopolnjene s privzetimi (glej resolveInputs). */
  values: Record<string, Record<string, number>>;
  onChange: (value: ModuleInputsState) => void;
  raw: ModuleInputsState;
  liveTotalEUR: number;
  stepLabel: string;
  onNext: () => void;
  onBack: () => void;
  onChangeSegment: () => void;
}

export function StepInputs({
  segment,
  modules,
  values,
  onChange,
  raw,
  liveTotalEUR,
  stepLabel,
  onNext,
  onBack,
  onChangeSegment,
}: StepInputsProps) {
  const handleFieldChange = (moduleId: string, key: string, value: number) => {
    onChange({ ...raw, [moduleId]: { ...values[moduleId], [key]: value } });
  };

  return (
    <div className={shellStyles.wrap}>
      <p className={shellStyles.stepLabel}>{stepLabel}</p>
      <h1 className={shellStyles.title}>Vaše številke</h1>

      <div className={styles.profileBanner}>
        <span>
          Izračun prilagojen za: <span className={styles.profileName}>{segment.displayName}</span>
        </span>
        {/* Pove, kam gumb pelje: vprašalnik določa dejavnost, zato se popravlja tam. */}
        <button type="button" className={styles.profileChange} onClick={onChangeSegment}>
          spremeni dejavnost
        </button>
      </div>

      <div className={shellStyles.card}>
        {modules.map((definition) => (
          <ModuleSection
            key={definition.id}
            definition={definition}
            values={values[definition.id] ?? {}}
            onChange={(key, value) => handleFieldChange(definition.id, key, value)}
          />
        ))}
        <p className={styles.moduleFootnote}>
          Sproščene ure ne pomenijo nižje plačne mase — zaposleni ostane. Gre za čas, ki ga lahko usmerite v
          drugo delo.
        </p>
      </div>

      {/*
        Vsota neposrednih izgub IN kapacitete: področji Plan in Delovni nalogi ne
        prispevata nobene neposredne izgube, zato bi obiskovalec, ki izbere prav
        ti dve, ves čas vnašanja gledal 0 EUR.
      */}
      <div className={styles.pinnedTotal}>
        <span className={styles.pinnedLabel}>Trenutni letni strošek izbranih področij</span>
        <span className={styles.pinnedValue}>{formatEUR(liveTotalEUR)}</span>
      </div>

      <div className={shellStyles.actions}>
        <button type="button" className={buttonStyles.secondaryButton} onClick={onBack}>
          Nazaj
        </button>
        <button type="button" className={buttonStyles.primaryButton} onClick={onNext}>
          Poglej rezultat
        </button>
      </div>
    </div>
  );
}
