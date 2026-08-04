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
  placeholder?: string;
  onChange: (value: number) => void;
}

type ModuleInputProps = SliderFieldProps | NumberFieldProps;

export function ModuleInput(props: ModuleInputProps) {
  const { label, helpText, value, unit, onChange } = props;

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
            value={Number.isFinite(value) ? value : 0}
            min={props.mode === 'slider' ? props.min : 0}
            max={props.mode === 'slider' ? props.max : undefined}
            step={props.mode === 'slider' ? props.step : 'any'}
            placeholder={props.mode === 'number' ? props.placeholder : undefined}
            onChange={(event) => onChange(event.target.value === '' ? 0 : Number(event.target.value))}
            aria-label={`${label} (vrednost)`}
          />
          {unit ? <span className={styles.unit}>{unit}</span> : null}
        </div>
      </div>
    </div>
  );
}
