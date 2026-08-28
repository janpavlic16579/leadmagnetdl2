import { SHARED_COPY } from '../../config/copy';
import { formatAmount, formatEUR } from '../../lib/format';
import { multiYearEUR, perMonthEUR, perWorkingDayEUR, yearsLabel } from '../../lib/horizon';
import type { EURRange } from '../../lib/range';
import { projectionSeries } from '../../lib/reportVisuals';
import styles from './ProjectionBars.module.css';

interface ProjectionBarsProps {
  annualEUR: number;
  heroRange: EURRange | null;
  lowConfidence: boolean;
}

/**
 * Kumulativa po letih.
 *
 * Trojni znesek stoji tudi med lečami v naslovnem pasu, in to namenoma: tam je
 * SIDRO (ena številka, s katero se odločitev primerja), tu pa POT do njega.
 * Naraščajoči stolpci povedo tisto, česar ena številka ne more — da znesek ne
 * čaka na odločitev, ampak med njo nastaja.
 *
 * Vrednosti gredo skozi lib/reportVisuals in lib/horizon; komponenta ne računa,
 * ker vitest brez jsdom logike v JSX ne more preizkusiti.
 */
export function ProjectionBars({ annualEUR, heroRange, lowConfidence }: ProjectionBarsProps) {
  const points = projectionSeries(annualEUR);
  if (points.length === 0) return null;

  return (
    <div>
      <ul className={styles.list} role="img" aria-label={SHARED_COPY.projectionChartAlt}>
        {points.map((point) => {
          const range = heroRange
            ? {
                minEUR: multiYearEUR(heroRange.minEUR, point.year),
                maxEUR: multiYearEUR(heroRange.maxEUR, point.year),
              }
            : null;

          return (
            <li key={point.year} className={styles.row}>
              <span className={styles.year}>{yearsLabel(point.year)}</span>
              <span className={styles.track}>
                <span
                  className={point.fraction === 1 ? `${styles.fill} ${styles.fillFinal}` : styles.fill}
                  style={{ width: `${point.fraction * 100}%` }}
                />
              </span>
              <span className={styles.value}>
                {formatAmount(point.cumulativeEUR, { range, lowConfidence })}
              </span>
            </li>
          );
        })}
      </ul>

      <p className={styles.note}>
        {SHARED_COPY.horizonNote}{' '}
        {SHARED_COPY.delayNote
          .replace('{daily}', formatEUR(perWorkingDayEUR(annualEUR)))
          .replace('{monthly}', formatEUR(perMonthEUR(annualEUR)))}
      </p>
    </div>
  );
}
