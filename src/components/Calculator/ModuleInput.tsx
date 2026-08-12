import { useId } from 'react';
import { UNKNOWN_ANSWER } from '../../config/modules';
import styles from './ModuleInput.module.css';

interface SliderFieldProps {
  mode: 'slider';
  label: string;
  helpText?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}

interface NumberFieldProps {
  mode: 'number';
  label: string;
  helpText?: string;
  value: number;
  unit?: string;
  /** Prikaže stikalo "Ne vem". Vrednost je tedaj UNKNOWN_ANSWER in ne 0. */
  allowUnknown?: boolean;
  onChange: (value: number) => void;
}

interface ChoiceFieldProps {
  mode: 'choice';
  label: string;
  helpText?: string;
  value: number;
  choices: { value: number; label: string }[];
  onChange: (value: number) => void;
}

interface CheckboxFieldProps {
  mode: 'checkbox';
  label: string;
  helpText?: string;
  value: number;
  onChange: (value: number) => void;
}

type ModuleInputProps = SliderFieldProps | NumberFieldProps | ChoiceFieldProps | CheckboxFieldProps;

export function ModuleInput(props: ModuleInputProps) {
  const { label, helpText, value, onChange } = props;
  const groupId = useId();

  if (props.mode === 'checkbox') {
    return (
      <label className={styles.checkbox}>
        <input type="checkbox" checked={value === 1} onChange={(event) => onChange(event.target.checked ? 1 : 0)} />
        <span>{label}</span>
      </label>
    );
  }

  if (props.mode === 'choice') {
    return (
      <fieldset className={styles.field}>
        <legend className={styles.label}>{label}</legend>
        {helpText ? <p className={styles.helpText}>{helpText}</p> : null}
        <div className={styles.choices}>
          {props.choices.map((choice) => (
            <label key={choice.value} className={styles.choice}>
              <input
                type="radio"
                name={groupId}
                checked={value === choice.value}
                onChange={() => onChange(choice.value)}
              />
              <span>{choice.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  const { unit } = props;
  const allowUnknown = props.mode === 'number' && props.allowUnknown === true;
  const isUnknown = allowUnknown && value === UNKNOWN_ANSWER;

  /**
   * min/max se uveljavita ob vnosu, ne le kot HTML atributa: atributa ustavita
   * puščici, ne pa tipkanja — vtipkana -50 ali vrednost čez mejo drsnika je doslej
   * vstopila v izračun. Prosto številsko polje ima spodnjo mejo 0 (negativnih ur
   * ali evrov ni), navzgor pa ostane odprto.
   */
  const clamp = (raw: number): number => {
    if (!Number.isFinite(raw)) return 0;
    if (props.mode === 'slider') return Math.min(props.max, Math.max(props.min, raw));
    return Math.max(0, raw);
  };

  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {helpText ? <p className={styles.helpText}>{helpText}</p> : null}
      <div className={styles.row}>
        {props.mode === 'slider' ? (
          <input
            className={styles.slider}
            type="range"
            min={props.min}
            max={props.max}
            step={props.step}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            aria-label={label}
          />
        ) : null}
        <div className={styles.numberWrap}>
          <input
            className={styles.number}
            type="number"
            // Prazno polje namesto dobesedne ničle: sicer mora uporabnik najprej
            // pobrisati "0", preden začne tipkati, kar da vmesne vrednosti kot "056".
            // Pri "ne vem" je prazno tudi vsebinsko pravilno — vrednosti ni.
            value={Number.isFinite(value) && value > 0 ? value : ''}
            placeholder={isUnknown ? '—' : '0'}
            disabled={isUnknown}
            min={props.mode === 'slider' ? props.min : 0}
            max={props.mode === 'slider' ? props.max : undefined}
            step={props.mode === 'slider' ? props.step : 'any'}
            onChange={(event) => onChange(event.target.value === '' ? 0 : clamp(Number(event.target.value)))}
            aria-label={`${label} (vrednost)`}
          />
          {unit ? <span className={styles.unit}>{unit}</span> : null}
        </div>
      </div>
      {allowUnknown ? (
        <label className={styles.unknown}>
          <input
            type="checkbox"
            checked={isUnknown}
            onChange={(event) => onChange(event.target.checked ? UNKNOWN_ANSWER : 0)}
          />
          <span>Tega podatka ne vodimo</span>
        </label>
      ) : null}
    </div>
  );
}
