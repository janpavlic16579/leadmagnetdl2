import { useEffect, useId, useRef, useState } from 'react';
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
 * Spremljajoče besedilo vprašanja: kratka razlaga in gumb "?" s pojasnilom.
 *
 * Kratka razlaga pove, KAJ vprašamo; pojasnilo v oknu pove, kako do številke
 * priti — s primerom in mejo področja. Obiskovalec, ki pojma ne pozna, sicer
 * vpiše napačno vrednost ali obupa, na koraku Skupna finančna osnova pa ena
 * napačna številka popači vse nadaljnje izračune.
 *
 * RAZKRITJE in ne več zgolj tooltip na hover. Prejšnja različica je vidnost
 * prepustila izključno CSS-u (:hover / :focus-within) in s tem tri stvari:
 *
 * - okna ni bilo mogoče zapreti s tipko Escape (WCAG 1.4.13);
 * - med gumbom in oknom je bila 4 px vrzel, zato je okno ob poskusu, da bi se
 *   miška premaknila vanj (izbor besedila, kopiranje), izginilo — isti kriterij
 *   zahteva, da je vsebina dosegljiva z miško;
 * - na dotik je delovalo samo zato, ker brskalnik gumbu ob tapu da fokus, in
 *   ostalo odprto, dokler ni obiskovalec kliknil kam drugam.
 *
 * Hover ostane kot bližnjica na namizju (CSS), klik pa doda pot, ki jo je mogoče
 * tudi zapreti. Vrzel zapolni prosojna zgornja obroba v CSS.
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
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!anchorRef.current?.contains(event.target as Node)) setOpen(false);
    };
    // Zapre tudi ob kliku v drugo pojasnilo — dve odprti okni hkrati bi se prekrili.
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <span className={styles.wrapper}>
      {explainer ? (
        // Tesen ovoj velikosti gumba: sidro za okno mora biti to, ne .wrapper
        // (ta poleg gumba nosi tudi .help spodaj) — sicer se okno pozicionira
        // glede na skupno višino obeh in pristane predaleč pod gumbom.
        <span
          className={styles.anchor}
          ref={anchorRef}
          onKeyDown={(event) => {
            if (event.key !== 'Escape' || !open) return;
            // stopPropagation: Escape sme zapreti okno, ne pa česa nad njim.
            event.stopPropagation();
            setOpen(false);
          }}
        >
          <button
            type="button"
            className={styles.button}
            aria-expanded={open}
            aria-controls={panelId}
            aria-describedby={panelId}
            aria-label={`Pojasnilo: ${label}`}
            onClick={() => setOpen((isOpen) => !isOpen)}
          >
            ?
          </button>
          <span id={panelId} role="tooltip" className={styles.panel} data-open={open || undefined}>
            {explainer}
          </span>
        </span>
      ) : null}
      {help ? <span className={styles.help}>{help}</span> : null}
    </span>
  );
}
