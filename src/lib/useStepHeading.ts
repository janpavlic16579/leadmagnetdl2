import { useEffect, useRef } from 'react';

/**
 * Fokus na naslov koraka ob vstopu nanj.
 *
 * Vsak korak je svoja stran, brskalnik pa ob zamenjavi vsebine fokus izgubi:
 * gumb "Naprej", ki ga je obiskovalec pravkar pritisnil, se odklopi in fokus
 * pade na <body>. Uporabnik tipkovnice mora zato po vsakem koraku znova tabati
 * skozi glavo do vsebine, uporabnik bralnika zaslona pa po kliku sliši tišino —
 * nič ne pove, da je pred njim nov korak z novim naslovom.
 *
 * Naslov in ne prvo polje: bralnik tako prebere, KJE smo, preden vpraša, kaj naj
 * vnesemo. `tabIndex={-1}` naredi naslov programsko fokusabilen, ne da bi vstopil
 * v zaporedje tabulatorja; obris skrije `:focus:not(:focus-visible)` v index.css.
 *
 * Uporaba:
 *   const headingRef = useStepHeading();
 *   <h1 tabIndex={-1} ref={headingRef}>…</h1>
 *
 * `key` je za komponente, ki znotraj ene inštance zamenjajo zaslon (EmailGate:
 * obrazec → zahvala) ali naslov (StepInputs: ena stran na področje). Brez njega
 * bi se učinek izvedel samo ob priklopu in novi naslov ne bi dobil fokusa.
 */
export function useStepHeading<T extends HTMLElement = HTMLHeadingElement>(key?: unknown) {
  const ref = useRef<T>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [key]);

  return ref;
}
