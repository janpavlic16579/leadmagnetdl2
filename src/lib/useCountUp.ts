import { useEffect, useState } from 'react';
import {
  countUpProgress,
  easeOutCubic,
  heroAmountAtProgress,
  HERO_COUNT_UP_MS,
  type HeroAmountInputs,
} from './animation';
import { useMediaQuery } from './useMediaQuery';

/**
 * Naslovni znesek, ki se izpiše z odštevanjem navzgor.
 *
 * Hook je namenoma tanek — vsa računska logika je v lib/animation.ts, ker vitest
 * teče v okolju 'node' brez jsdom in hookov ne more izvajati. Tu ostane samo
 * vezava na rAF.
 *
 * Animacija je okrasje in nikoli pogoj za vsebino: ob zmanjšanem gibanju ali
 * brez requestAnimationFrame se končni niz izpiše takoj. Zato tudi začetno
 * stanje ni prazen niz — kdor animacije ne dobi, mora videti znesek, ne praznine.
 */
export function useCountUp(inputs: HeroAmountInputs, durationMs: number = HERO_COUNT_UP_MS): string {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const finalLabel = heroAmountAtProgress(1, inputs);
  const [label, setLabel] = useState(finalLabel);

  // Vrednosti in ne predmeta: `inputs` je ob vsakem izrisu nov objekt in bi
  // animacijo pognal znova ob vsaki spremembi teme ali velikosti okna.
  const { valueEUR, lowConfidence } = inputs;
  const minEUR = inputs.range?.minEUR;
  const maxEUR = inputs.range?.maxEUR;

  useEffect(() => {
    const target: HeroAmountInputs = {
      valueEUR,
      lowConfidence,
      range: minEUR !== undefined && maxEUR !== undefined ? { minEUR, maxEUR } : null,
    };
    const settled = heroAmountAtProgress(1, target);

    const isHidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';

    if (reducedMotion || typeof requestAnimationFrame !== 'function' || isHidden()) {
      setLabel(settled);
      return;
    }

    let frame = 0;
    let start: number | null = null;

    const step = (timestamp: number) => {
      start ??= timestamp;
      const progress = countUpProgress(timestamp - start, durationMs);
      setLabel(heroAmountAtProgress(easeOutCubic(progress), target));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    /**
     * Varovalo: končna vrednost se izpiše tudi, če okvirji nehajo prihajati.
     *
     * requestAnimationFrame se v skritem zavihku ne izvaja, brskalniki pa ga
     * ustavijo tudi pri izrisu zunaj zaslona in ob varčevanju z energijo.
     * Animacija tedaj obtiči na okvirju, do katerega je prišla, in naslovni
     * znesek ostane pri delnem seštevku — obiskovalec bi videl številko, ki je
     * lahko za red velikosti prenizka, in jo imel za rezultat izračuna. Pri
     * poročilu, katerega celotna vsebina je ta ena številka, je to najhujši
     * možni izid okrasja, zato ura teče neodvisno od okvirjev.
     */
    const guard = setTimeout(() => {
      cancelAnimationFrame(frame);
      setLabel(settled);
    }, durationMs + 150);

    const settleIfHidden = () => {
      if (isHidden()) setLabel(settled);
    };

    document.addEventListener('visibilitychange', settleIfHidden);
    frame = requestAnimationFrame(step);

    return () => {
      document.removeEventListener('visibilitychange', settleIfHidden);
      clearTimeout(guard);
      cancelAnimationFrame(frame);
    };
  }, [valueEUR, lowConfidence, minEUR, maxEUR, durationMs, reducedMotion]);

  // Končni niz je hkrati vrednost, ki jo bralnik zaslona prebere (glej HeroBand):
  // animiran izpis je zanj skrit, ker bi vsak okvir sprožil novo objavo.
  return reducedMotion ? finalLabel : label;
}
