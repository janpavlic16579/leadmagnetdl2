import type { ModuleDefinition, ModuleField } from '../../config/modules';
import { ModuleInput } from './ModuleInput';
import styles from './StepInputs.module.css';

interface ModuleSectionProps {
  definition: ModuleDefinition;
  /** Že razrešene vrednosti (privzete, prekrite z uporabnikovimi) — nikoli delne. */
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
}

/**
 * Izriše en modul iz registra.
 *
 * Tu živi edina pretvorba odstotkov: polja kind 'percent' se povsod hranijo in
 * računajo kot ulomek (0,015), widget pa prikaže 1,5. Doslej je bila ta pretvorba
 * raztresena po JSX-u za vsak modul posebej, z različno natančnostjo zaokroževanja.
 */
export function ModuleSection({ definition, values, onChange }: ModuleSectionProps) {
  return (
    <section className={styles.moduleSection}>
      <h2 className={styles.moduleHeading}>{definition.title}</h2>
      <p className={styles.moduleSummary}>{definition.summary}</p>
      {definition.fields.map((field) => (
        <Field key={field.key} field={field} value={values[field.key]} onChange={onChange} />
      ))}
    </section>
  );
}

/** Koliko decimalk prikazati pri odstotkih — izpeljano iz koraka, ne uganjeno. */
function percentDecimals(step: number | undefined): number {
  const displayStep = (step ?? 0.01) * 100;
  return displayStep < 1 ? 1 : 0;
}

function Field({
  field,
  value,
  onChange,
}: {
  field: ModuleField;
  value: number;
  onChange: (key: string, value: number) => void;
}) {
  switch (field.kind) {
    case 'checkbox':
      return (
        <ModuleInput
          mode="checkbox"
          label={field.label}
          helpText={field.help}
          value={value}
          onChange={(next) => onChange(field.key, next)}
        />
      );

    case 'choice':
      return (
        <ModuleInput
          mode="choice"
          label={field.label}
          helpText={field.help}
          value={value}
          choices={field.choices ?? []}
          onChange={(next) => onChange(field.key, next)}
        />
      );

    case 'percent': {
      const factor = 10 ** percentDecimals(field.step);
      return (
        <ModuleInput
          mode="slider"
          label={field.label}
          helpText={field.help}
          value={Math.round(value * 100 * factor) / factor}
          min={(field.min ?? 0) * 100}
          max={(field.max ?? 1) * 100}
          step={(field.step ?? 0.01) * 100}
          unit="%"
          onChange={(percent) => onChange(field.key, percent / 100)}
        />
      );
    }

    case 'slider':
      return (
        <ModuleInput
          mode="slider"
          label={field.label}
          helpText={field.help}
          value={value}
          min={field.min ?? 0}
          max={field.max ?? 100}
          step={field.step ?? 1}
          unit={field.unit}
          onChange={(next) => onChange(field.key, next)}
        />
      );

    case 'number':
      return (
        <ModuleInput
          mode="number"
          label={field.label}
          helpText={field.help}
          value={value}
          unit={field.unit}
          allowUnknown={field.allowUnknown}
          onChange={(next) => onChange(field.key, next)}
        />
      );
  }
}
