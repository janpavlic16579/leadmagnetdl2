import { useId } from 'react';
import { UNKNOWN_ANSWER } from '../../config/modules';
import { HelpTip } from './HelpTip';
import { NumberField } from './NumberField';
import helpStyles from './HelpTip.module.css';
import styles from './ModuleInput.module.css';

interface SliderFieldProps {
  mode: 'slider';
  label: string;
  helpText?: string;
  explainer?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}

interface NumberModeProps {
  mode: 'number';
  label: string;
  helpText?: string;
  explainer?: string;
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
  explainer?: string;
  value: number;
  choices: { value: number; label: string }[];
  /**
   * Opomba pod skupino, kadar ni izbran noben odgovor. Odsotna = privzeto
   * besedilo o zadržanem deležu (velja za glavni vzrok); `null` = brez opombe —
   * kontekstna vprašanja v izračun ne vstopajo in opomba o deležu bi lagala.
   */
  unansweredNote?: string | null;
  onChange: (value: number) => void;
}

interface CheckboxFieldProps {
  mode: 'checkbox';
  label: string;
  helpText?: string;
  explainer?: string;
  value: number;
  onChange: (value: number) => void;
}

type ModuleInputProps = SliderFieldProps | NumberModeProps | ChoiceFieldProps | CheckboxFieldProps;

export function ModuleInput(props: ModuleInputProps) {
  const { label, helpText, explainer, value, onChange } = props;
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
    /**
     * Vrednost, ki ne ustreza nobeni možnosti, pomeni "ni izbrano" — tedaj ni
     * označen noben radio. Izpeljano iz vrednosti in ne iz nove zastavice, ker je
     * to splošno pravilo in ne posebnost vprašanja o glavnem vzroku.
     */
    const hasSelection = props.choices.some((choice) => choice.value === value);
    const unansweredNote =
      props.unansweredNote === undefined
        ? 'Brez odgovora računamo z najbolj zadržanim deležem — vaš dejanski znesek je najverjetneje višji.'
        : props.unansweredNote;

    return (
      <fieldset
        className={styles.field}
        aria-describedby={hasSelection || !unansweredNote ? undefined : `${groupId}-unanswered`}
      >
        {/* Legenda je hkrati ovoj vprašanja: `<legend>` mora ostati prvi otrok
            `<fieldset>`, zato je ni dovoljeno oviti v .questionRow. */}
        <legend className={`${styles.label} ${helpStyles.questionRow}`}>
          {label}
          <HelpTip label={label} help={helpText} explainer={explainer} />
        </legend>
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
        {/* Mehko in ne blokada: nadaljevanje ostane mogoče, a tiha privzeta
            vrednost, ki bi odločila o naslovljivem deležu, ne obstaja več. */}
        {hasSelection || !unansweredNote ? null : (
          <p id={`${groupId}-unanswered`} className={styles.unanswered}>
            {unansweredNote}
          </p>
        )}
      </fieldset>
    );
  }

  const { unit } = props;
  const allowUnknown = props.mode === 'number' && props.allowUnknown === true;
  const isUnknown = allowUnknown && value === UNKNOWN_ANSWER;

  /**
   * Meje se uveljavijo ob vnosu, ne le kot HTML atributa: atributa ustavita
   * puščici, ne pa tipkanja — vtipkana -50 ali vrednost čez mejo drsnika je doslej
   * vstopila v izračun. Prosto številsko polje ima spodnjo mejo 0 (negativnih ur
   * ali evrov ni), navzgor pa ostane odprto.
   */
  const bounds =
    props.mode === 'slider' ? { min: props.min, max: props.max } : { min: 0, max: undefined };

  return (
    <div className={styles.field}>
      <div className={helpStyles.questionRow}>
        <label className={styles.label} htmlFor={`${groupId}-number`}>
          {label}
        </label>
        <HelpTip label={label} help={helpText} explainer={explainer} />
      </div>
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
          <NumberField
            id={`${groupId}-number`}
            className={styles.number}
            // Prazno polje namesto dobesedne ničle: sicer mora uporabnik najprej
            // pobrisati "0", preden začne tipkati, kar da vmesne vrednosti kot "056".
            // Pri "ne vem" je prazno tudi vsebinsko pravilno — vrednosti ni.
            value={Number.isFinite(value) && value > 0 ? value : null}
            placeholder={isUnknown ? '—' : '0'}
            disabled={isUnknown}
            min={bounds.min}
            max={bounds.max}
            onChange={(next) => onChange(next ?? 0)}
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
