import { useEffect, useState } from 'react';
import { DELIVERY_PHASES, progressPercent, type DeliveryPhase } from './deliveryProgress';

/** Dovolj gosto, da se številka bere kot tekoča; redkeje, kot se izriše okvir. */
const TICK_MS = 80;

/**
 * Odstotek in napis za fazo dostave, ki teče (lib/deliveryProgress.ts).
 *
 * Tiktaka s setInterval in ne z requestAnimationFrame: rAF v skritem zavihku
 * obstane, oddaja pa teče naprej — ob vrnitvi bi vrstica kazala stanje izpred
 * pol minute. Med sinhrono gradnjo PDF-ja tiki izostanejo (glavna nit je
 * zasedena); gibanje tedaj nosi lesk na vrstici (DeliveryProgress.module.css).
 *
 * Odstotek nikoli ne pade: faze so urejene, ob morebitnem preskoku nazaj pa
 * vrstica obstane, namesto da bi se vrnila — vrnitev bere kot napaka.
 */
export function useDeliveryProgress(phase: DeliveryPhase): { percent: number; label: string } {
  const [percent, setPercent] = useState(() => progressPercent(phase, 0));

  useEffect(() => {
    const startedAt = performance.now();
    const tick = () => {
      const next = progressPercent(phase, performance.now() - startedAt);
      setPercent((shown) => Math.max(shown, next));
    };
    tick();
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, [phase]);

  return { percent, label: DELIVERY_PHASES[phase].label };
}
