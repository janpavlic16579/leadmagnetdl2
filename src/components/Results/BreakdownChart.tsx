import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatEUR, formatNumber } from '../../lib/format';
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

const DIRECT_LOSS_COLOR = 'var(--color-primary)';
const CAPACITY_COLOR = 'var(--color-primary-text)';
const LOST_MARGIN_COLOR = 'var(--color-warning-border)';

export function BreakdownChart({ data }: BreakdownChartProps) {
  if (data.length === 0) return null;

  const hasCapacity = data.some((datum) => datum.capacityEUR > 0);
  const hasLostMargin = data.some((datum) => datum.lostMarginEUR > 0);

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
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          {/* Stolpca sta namenoma vzporedna, ne naložena: neposredna izguba in
              sproščena kapaciteta se ne seštevata, naložen stolpec pa bi prav to
              nakazoval. */}
          <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }} barGap={2}>
            {/* Recharts privzeto riše osi in namig v fiksni temni barvi, ki v temnem
                načinu izgine — zato so vezani na tokene teme. */}
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
              stroke="var(--color-border)"
              interval={0}
              height={52}
              tickFormatter={(value: string) => (value.length > 22 ? `${value.slice(0, 21)}…` : value)}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
              stroke="var(--color-border)"
              width={64}
              tickFormatter={(value) => formatNumber(Number(value))}
            />
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
            {/* Stolpci so velike ploskve, zato lahko uporabijo svetlo znamčno rumeno;
                temna varianta --color-primary-text je rezervirana za besedilo, ki
                potrebuje kontrast na beli podlagi — tu loči drugi koš. */}
            <Bar
              dataKey="directLossEUR"
              name="Neposredna izguba"
              fill={DIRECT_LOSS_COLOR}
              radius={[2, 2, 0, 0]}
            />
            {hasLostMargin ? (
              <Bar
                dataKey="lostMarginEUR"
                name="Nezaslužena marža"
                fill={LOST_MARGIN_COLOR}
                radius={[2, 2, 0, 0]}
              />
            ) : null}
            {hasCapacity ? (
              <Bar
                dataKey="capacityEUR"
                name="Sproščena kapaciteta"
                fill={CAPACITY_COLOR}
                radius={[2, 2, 0, 0]}
              />
            ) : null}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
