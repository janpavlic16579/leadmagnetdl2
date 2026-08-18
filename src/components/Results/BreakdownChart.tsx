import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatEUR, formatNumber } from '../../lib/format';
import { useMediaQuery } from '../../lib/useMediaQuery';
import styles from './BreakdownChart.module.css';

export interface BreakdownChartDatum {
  /** Naslov modula — ena skupina stolpcev na modul, ne na posamezno postavko. */
  name: string;
  directLossEUR: number;
  lostMarginEUR: number;
  capacityEUR: number;
}

interface BreakdownChartProps {
  data: BreakdownChartDatum[];
}

/**
 * Serije imajo lastne tokene (glej --color-chart-* v styles/tokens.css).
 *
 * Semantični tokeni so bili napačno orodje: --color-primary in
 * --color-warning-border sta v svetli temi skoraj ista barva, --color-primary in
 * --color-primary-text pa sta v temni doslovno ista — graf je torej v vsaki temi
 * pokazal dve barvi namesto treh, legenda pa je trdila, da so tri.
 */
const DIRECT_LOSS_COLOR = 'var(--color-chart-loss)';
const LOST_MARGIN_COLOR = 'var(--color-chart-margin)';
const CAPACITY_COLOR = 'var(--color-chart-capacity)';

/**
 * Pod to širino gredo stolpci v vodoravno postavitev.
 *
 * Imena področij so dolga ("Zaloge in razpoložljivost materiala"), na osi X pod
 * 520 px pa ostane vsakemu ≈50–70 px. Recharts oznak ne prelamlja in jih z
 * `interval={0}` izpiše vse — na telefonu so se zato prekrivale v nečitljivo
 * kašo. Vodoravni stolpci dajo imenu celo vrstico.
 */
const NARROW_QUERY = '(max-width: 520px)';

/** Višina ene vrstice v vodoravni postavitvi — ime + stolpci + zrak. */
const ROW_HEIGHT = 64;

export function BreakdownChart({ data }: BreakdownChartProps) {
  const isNarrow = useMediaQuery(NARROW_QUERY);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  if (data.length === 0) return null;

  const hasCapacity = data.some((datum) => datum.capacityEUR > 0);
  const hasLostMargin = data.some((datum) => datum.lostMarginEUR > 0);

  const axisTick = { fontSize: 11, fill: 'var(--color-text-muted)' };
  const truncate = (value: string) => (value.length > 22 ? `${value.slice(0, 21)}…` : value);
  const height = isNarrow ? Math.max(200, data.length * ROW_HEIGHT) : 260;

  return (
    <div>
      {/* Legendo rišemo sami, ker mora barvo brati iz tokenov teme — Recharts
          Legend v tej različici ne sprejme lastnega payloada. */}
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.swatch} style={{ background: DIRECT_LOSS_COLOR }} />
          Neposredna izguba
        </span>
        {hasLostMargin ? (
          <span className={styles.legendItem}>
            <span className={styles.swatch} style={{ background: LOST_MARGIN_COLOR }} />
            Nezaslužena marža
          </span>
        ) : null}
        {hasCapacity ? (
          <span className={styles.legendItem}>
            <span className={styles.swatch} style={{ background: CAPACITY_COLOR }} />
            Sproščena kapaciteta
          </span>
        ) : null}
      </div>
      {/* Graf je povzetek istih številk, ki so v seznamu pod njim; bralniku
          zaslona zato povemo, kje jih dobi v berljivi obliki, namesto da bi
          poskušali prebrati SVG. */}
      <div
        style={{ width: '100%', height }}
        role="img"
        aria-label="Razčlenitev po področjih v obliki grafa. Iste številke so v seznamu pod grafom."
      >
        <ResponsiveContainer>
          {/* Stolpca sta namenoma vzporedna, ne naložena: neposredna izguba in
              sproščena kapaciteta se ne seštevata, naložen stolpec pa bi prav to
              nakazoval. */}
          <BarChart
            data={data}
            layout={isNarrow ? 'vertical' : 'horizontal'}
            margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
            barGap={2}
          >
            {/* Recharts privzeto riše osi in namig v fiksni temni barvi, ki v temnem
                načinu izgine — zato so vezani na tokene teme. */}
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            {isNarrow ? (
              <>
                <XAxis
                  type="number"
                  tick={axisTick}
                  stroke="var(--color-border)"
                  tickFormatter={(value) => formatNumber(Number(value))}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={axisTick}
                  stroke="var(--color-border)"
                  width={132}
                  interval={0}
                  tickFormatter={truncate}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey="name"
                  tick={axisTick}
                  stroke="var(--color-border)"
                  interval={0}
                  height={52}
                  tickFormatter={truncate}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                  stroke="var(--color-border)"
                  width={64}
                  tickFormatter={(value) => formatNumber(Number(value))}
                />
              </>
            )}
            <Tooltip
              formatter={(value) => formatEUR(Number(value))}
              cursor={{ fill: 'var(--color-accent)' }}
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text)',
              }}
              labelStyle={{ color: 'var(--color-text)' }}
              itemStyle={{ color: 'var(--color-text)' }}
            />
            <Bar
              dataKey="directLossEUR"
              name="Neposredna izguba"
              fill={DIRECT_LOSS_COLOR}
              radius={[2, 2, 0, 0]}
              isAnimationActive={!reducedMotion}
            />
            {hasLostMargin ? (
              <Bar
                dataKey="lostMarginEUR"
                name="Nezaslužena marža"
                fill={LOST_MARGIN_COLOR}
                radius={[2, 2, 0, 0]}
                isAnimationActive={!reducedMotion}
              />
            ) : null}
            {hasCapacity ? (
              <Bar
                dataKey="capacityEUR"
                name="Sproščena kapaciteta"
                fill={CAPACITY_COLOR}
                radius={[2, 2, 0, 0]}
                isAnimationActive={!reducedMotion}
              />
            ) : null}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
