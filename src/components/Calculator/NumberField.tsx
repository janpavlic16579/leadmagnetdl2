import { useEffect, useRef, useState } from 'react';
import { clampNumber, formatNumberInput, parseNumberInput, type ClampOptions } from '../../lib/numberInput';

interface NumberFieldProps extends ClampOptions {
  /** Vrednost v stanju; `null` pomeni "ni vnosa" in polje ostane prazno. */
  value: number | null;
  /**
   * Sporoči vrednost, kot jo je mogoče prebrati. `null` = polje je prazno ali
   * vnos še ni dokončan; klicatelj se sam odloči, kaj to pomeni (privzetek,
   * "ni podatka"), namesto da bi dobil ničlo in je ne mogel ločiti od vpisane.
   */
  onChange: (value: number | null) => void;
  id?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
  /**
   * Celoštevilska polja (zaposleni, število naročil) dobijo številčnico brez
   * ločila; vsa druga `decimal`, ker so urne postavke in odstotki decimalni.
   */
  inputMode?: 'numeric' | 'decimal';
  /**
   * Enter kot "Naprej" — samo za korake z enim samim poljem. Kdor vpiše število
   * in pritisne Enter, pričakuje, da gre naprej; doslej se ni zgodilo nič, ker
   * koraki niso obrazci. Na koraku z več polji tega namenoma ne ponujamo.
   */
  onEnter?: () => void;
}

/**
 * Številsko polje, ki bere slovenski zapis.
 *
 * Je `type="text"` in ne `type="number"` — razlog je v lib/numberInput.ts:
 * `type="number"` decimalno ločilo prevzame po jeziku brskalnika, zato "22,5" v
 * angleškem Chromu tiho postane 225. Ceno tega (izgubljeni puščici gor/dol)
 * pretehta to, da vsak vpisani znesek pomeni tisto, kar je uporabnik mislil.
 *
 * Polje hrani SUROV niz. Brez tega kazalec med tipkanjem skače, "0," se izgubi,
 * preden pride druga števka, in vrednosti pod 1 ni mogoče vpisati.
 */
export function NumberField({
  value,
  onChange,
  min = 0,
  max,
  integer,
  inputMode = 'decimal',
  onEnter,
  ...inputProps
}: NumberFieldProps) {
  const [raw, setRaw] = useState(() => formatNumberInput(value));
  /**
   * Zadnja vrednost, ki smo jo oddali sami.
   *
   * Brez nje prikaz med tipkanjem skače: omejitev vrednost popravi (pri "12,7" v
   * celoštevilskem polju na 13), popravek se vrne kot nov `value` in učinek
   * spodaj bi ga zapisal nazaj v polje, še preden je uporabnik nehal tipkati.
   * Zaokroženo vrednost zato pokažemo šele ob izhodu iz polja.
   */
  const lastEmitted = useRef<number | null>(value);

  useEffect(() => {
    // Samo TUJA sprememba: gumb "vzemi povprečje panoge", izbran razpon,
    // odkljukan "ne vem". Lastnega odmeva ne prepisujemo.
    if (value === lastEmitted.current) return;
    lastEmitted.current = value;
    setRaw(formatNumberInput(value));
  }, [value]);

  const emit = (next: string) => {
    const parsed = parseNumberInput(next);
    const clamped = parsed === null ? null : clampNumber(parsed, { min, max, integer });
    lastEmitted.current = clamped;
    onChange(clamped);
  };

  return (
    <input
      {...inputProps}
      type="text"
      inputMode={inputMode}
      value={raw}
      onChange={(event) => {
        setRaw(event.target.value);
        emit(event.target.value);
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' || !onEnter) return;
        event.preventDefault();
        // Normaliziraj prikaz, kot bi ob izhodu iz polja — obiskovalec sicer
        // odide s koraka in se vrne k vrednosti, ki je ne prepozna.
        const parsed = parseNumberInput(raw);
        setRaw(parsed === null ? '' : formatNumberInput(clampNumber(parsed, { min, max, integer })));
        onEnter();
      }}
      onBlur={() => {
        // Šele tu prikaz uskladimo s tem, kar je res v stanju: "-5" se je zapisal
        // kot 0, "1,5" v celoštevilskem polju kot 2, in dokler bi v polju ostal
        // prvotni niz, bi obiskovalec videl nekaj tretjega.
        const parsed = parseNumberInput(raw);
        setRaw(parsed === null ? '' : formatNumberInput(clampNumber(parsed, { min, max, integer })));
      }}
    />
  );
}
