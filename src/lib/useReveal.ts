import { useEffect, useRef, useState } from 'react';
import { isBelowViewport } from './animation';
import { useMediaQuery } from './useMediaQuery';

/**
 * Koliko časa razdelek sme ostati skrit, preden se razkrije sam.
 *
 * Varovalo za primer, ko opazovalec po prvem klicu utihne — brskalniki ga
 * ustavijo pri izrisu zunaj zaslona in ob varčevanju z energijo. Brez tega bi
 * razdelek ostal prazen za vedno. Štiri sekunde so daljše od običajnega
 * razkritja ob drsenju in krajše od časa, v katerem bi bralec do razdelka prišel.
 */
const REVEAL_GUARD_MS = 4_000;

/**
 * Mehko razkritje razdelka ob prihodu v vidno polje.
 *
 * Privzeto stanje je VIDNO in ne skrito. Obratna izbira je običajna napaka teh
 * hookov: element dobi opacity 0 in čaka na IntersectionObserver, kar pomeni, da
 * brez JavaScripta, brez opazovalca ali ob zmanjšanem gibanju vsebina ostane
 * nevidna za vedno. Globalno stikalo v tokens.css tu ne pomaga — skrajša samo
 * prehod, skritja pa ne prepreči.
 *
 * Zato se razdelek skrije šele, ko opazovalec s SVOJIM PRVIM KLICEM dokaže, da
 * deluje, in samo, kadar razdelek tedaj leži pod pregibom. Skrivanje vsebine, ki
 * je bralec ne vidi, je nevidno; skrivanje na slepo pa je prazna stran.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [revealed, setRevealed] = useState(true);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (reducedMotion || typeof IntersectionObserver !== 'function') return;
    // Razdelek, ki je ob nalaganju že v vidnem polju, se ne skriva: skritje in
    // takojšen prikaz bi bila pred očmi bralca utripnitev, ne razkriv.
    if (!isBelowViewport(element.getBoundingClientRect().top, window.innerHeight)) return;

    /**
     * Razkritje je ENOSMERNO: kar je bilo enkrat prikazano, se ne skrije nazaj.
     *
     * Brez tega je opazovalec ob vsakem drsenju znova javil "ni v vidnem polju"
     * in razdelek, ki ga je varovalo že razkrilo, spet ugasnil — stran je torej
     * imela razdelke, ki so utripali med prazno in polno.
     */
    let settled = false;
    const reveal = () => {
      settled = true;
      setRevealed(true);
      clearTimeout(guard);
      observer.disconnect();
    };

    const guard = setTimeout(reveal, REVEAL_GUARD_MS);

    const observer = new IntersectionObserver(
      (entries) => {
        if (settled) return;
        if (entries.some((entry) => entry.isIntersecting)) {
          reveal();
          return;
        }
        setRevealed(false);
      },
      // Razkrije se malenkost pred robom, da je razdelek ob prihodu že viden in
      // se ne "prižge" šele, ko ga bralec gleda.
      { rootMargin: '0px 0px -10% 0px' },
    );

    observer.observe(element);

    return () => {
      clearTimeout(guard);
      observer.disconnect();
    };
  }, [reducedMotion]);

  return { ref, revealed };
}
