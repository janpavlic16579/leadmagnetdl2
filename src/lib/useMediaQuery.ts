import { useEffect, useState } from 'react';

/**
 * Poizvedba o mediju v Reactu — za odločitve, ki jih CSS ne more sprejeti.
 *
 * Uporablja se tam, kjer od širine zaslona ali sistemske nastavitve ni odvisen
 * le videz, ampak SESTAVA komponente: postavitev grafa (navpični stolpci na
 * telefonu, ker se vodoravne oznake prekrivajo) in izklop animacij ob
 * `prefers-reduced-motion`, ki ga Recharts ne bere sam.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    try {
      return window.matchMedia(query).matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let media: MediaQueryList;
    try {
      media = window.matchMedia(query);
    } catch {
      return;
    }
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);

  return matches;
}
