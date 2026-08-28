import { SHARED_COPY, type ResolvedSegmentCopy } from '../../config/copy';
import { formatEUR, formatPercent } from '../../lib/format';
import type { HeroBuckets } from '../../lib/heroTotals';
import { compositionSegments, type CompositionKey } from '../../lib/reportVisuals';
import styles from './CompositionBar.module.css';

interface CompositionBarProps {
  totals: HeroBuckets;
  /** Naslovi kartic te dejavnosti — legenda mora imenovati iste postavke. */
  figures: ResolvedSegmentCopy['figures'];
}

/**
 * Barve so iste kot v grafu razčlenitve (--color-chart-*, styles/tokens.css):
 * ista vrsta denarja mora biti na obeh slikah iste barve, sicer sta sliki dve
 * ločeni trditvi namesto ene, gledane od blizu in od daleč.
 */
const SEGMENT_COLOR: Record<CompositionKey, string> = {
  directLoss: 'var(--color-chart-loss)',
  lostMargin: 'var(--color-chart-margin)',
  capacity: 'var(--color-chart-capacity)',
};

/**
 * Naslovna vsota kot ena naložena vrstica.
 *
 * Opomba pod zneskom je doslej z besedami naštela tri vrste denarja in bralec
 * jih je moral sešteti v glavi. Vrstica isto pove s širinami: vidi se, kateri
 * koš nosi večino, in da so koši trije — kar je hkrati odgovor na prvi ugovor
 * ("od kod ta številka").
 */
export function CompositionBar({ totals, figures }: CompositionBarProps) {
  const segments = compositionSegments(totals);
  if (segments.length === 0) return null;

  const title: Record<CompositionKey, string> = {
    directLoss: figures.directLoss.title,
    lostMargin: figures.lostMargin.title,
    capacity: figures.capacity.title,
  };

  return (
    <div>
      {/* Slika ponavlja številke, ki so v legendi pod njo — bralniku zaslona
          povemo, kje jih dobi v berljivi obliki, namesto branja praznih elementov. */}
      <div className={styles.bar} role="img" aria-label={SHARED_COPY.compositionChartAlt}>
        {segments.map((segment) => (
          <span
            key={segment.key}
            className={styles.segment}
            style={{ width: `${segment.share * 100}%`, background: SEGMENT_COLOR[segment.key] }}
          />
        ))}
      </div>

      <ul className={styles.legend}>
        {segments.map((segment) => (
          <li key={segment.key} className={styles.legendItem}>
            <span className={styles.swatch} style={{ background: SEGMENT_COLOR[segment.key] }} />
            <span className={styles.legendLabel}>{title[segment.key]}</span>
            <span className={styles.legendValue}>
              {formatEUR(segment.valueEUR)}
              <span className={styles.legendShare}>{formatPercent(segment.share)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
