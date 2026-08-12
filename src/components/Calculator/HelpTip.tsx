import { useId } from 'react';
import styles from './HelpTip.module.css';

interface HelpTipProps {
  /** Vprašanje, na katero se pojasnilo nanaša — bralnik zaslona sicer prebere le "?". */
  label: string;
  /** Kratka razlaga pod vprašanjem; ostane vidna in se ne skriva v oknu. */
  help?: string;
  /** Daljše pojasnilo v plavajočem oknu ob gumbu "?". Brez njega gumba ni. */
  explainer?: string;
}

/**
 * Spremljajoče besedilo vprašanja: kratka razlaga in gumb "?" s plavajočim
 * oknom pojasnila na hover/fokus.
 *
 * Kratka razlaga pove, KAJ vprašamo; pojasnilo v oknu pove, kako do številke
 * priti — s primerom in mejo področja. Obiskovalec, ki pojma ne pozna, sicer
 * vpiše napačno vrednost ali obupa, na koraku Skupna finančna osnova pa ena
 * napačna številka popači vse nadaljnje izračune.
 *
 * Tooltip in ne razkritje: vidnost okna krmili izključno CSS (:hover in
 * :focus-within na .anchor), zato tu ni useState in ni klika. Na dotik večina
 * brskalnikov gumbu ob tapu da fokus, kar isti :focus-within sproži tudi na
 * mobilnem — brez dodatne JS poti.
 *
 * ARIA temu ustrezno: `aria-describedby` + `role="tooltip"`, ne
 * `aria-expanded`/`aria-controls` (ta sta za razkritja/akordione, glej prejšnjo
 * različico te komponente).
 *
 * Ni `<details>/<summary>` kot MethodologyToggle: sprožilec mora biti drobna
 * ikona ob naslovu vprašanja, `<summary>` pa v `<legend>` (polja kind 'choice')
 * ne sme stati.
 *
 * Razlaga in pojasnilo sta `<span>` in ne `<p>`: izrišeta se tudi znotraj
 * `<legend>`, kjer je dovoljena samo phrasing vsebina — `<p>` bi bil tam
 * neveljaven. Blokovni izris jima da CSS.
 */
export function HelpTip({ label, help, explainer }: HelpTipProps) {
  const panelId = useId();

  return (
    <span className={styles.wrapper}>
      {explainer ? (
        // Tesen ovoj velikosti gumba: sidro za okno mora biti to, ne .wrapper
        // (ta poleg gumba nosi tudi .help spodaj) — sicer se okno pozicionira
        // glede na skupno višino obeh in pristane predaleč pod gumbom.
        <span className={styles.anchor}>
          <button type="button" className={styles.button} aria-describedby={panelId} aria-label={`Pojasnilo: ${label}`}>
            ?
          </button>
          <span id={panelId} role="tooltip" className={styles.panel}>
            {explainer}
          </span>
        </span>
      ) : null}
      {help ? <span className={styles.help}>{help}</span> : null}
    </span>
  );
}
