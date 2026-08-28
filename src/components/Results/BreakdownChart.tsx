import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatEUR, formatNumber, formatPercent } from '../../lib/format';
import { breakdownChartHeightPx, type BreakdownRow } from '../../lib/reportVisuals';
import { useMediaQuery } from '../../lib/useMediaQuery';
import styles from './BreakdownChart.module.css';

export type { BreakdownDatum as BreakdownChartDatum } from '../../lib/reportVisuals';

interface BreakdownChartProps {
  /** Vrstice, urejene po velikosti — glej breakdownRows v lib/reportVisuals. */
  data: BreakdownRow[];
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
 * Pod to širino se skrči prostor za imena področij.
 *
 * Imena so dolga ("Zaloge in razpoložljivost materiala") in na telefonu bi jim
 * polna širina osi vzela večino zaslona, tako da bi od stolpcev ostal ogrizek.
 */
const NARROW_QUERY = '(max-width: 520px)';

export function BreakdownChart({ data }: BreakdownChartProps) {
  const isNarrow = useMediaQuery(NARROW_QUERY);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  if (data.length === 0) return null;

  const hasCapacity = data.some((datum) => datum.capacityEUR > 0);
  const hasLostMargin = data.some((datum) => datum.lostMarginEUR > 0);
  const top = data[0];

  // Koši v vrstnem redu sklada; odsotni izpadejo, da prazna serija ne zasede
  // mesta v legendi in ne prevzame oznake deleža na koncu stolpca.
  const buckets = [
    { key: 'directLossEUR', name: 'Neposredna izguba', color: DIRECT_LOSS_COLOR, present: true },
    { key: 'lostMarginEUR', name: 'Nezaslužena marža', color: LOST_MARGIN_COLOR, present: hasLostMargin },
    { key: 'capacityEUR', name: 'Sproščena kapaciteta', color: CAPACITY_COLOR, present: hasCapacity },
  ].filter((bucket) => bucket.present);

  const axisTick = { fontSize: 11, fill: 'var(--color-text-muted)' };
  const nameWidth = isNarrow ? 118 : 190;
  const truncate = (value: string) => {
    const limit = isNarrow ? 18 : 30;
    return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
  };
  const height = breakdownChartHeightPx(data.length);

  return (
    <div>
      {/* Katero področje je največje, pove stavek in ne le dolžina stolpca:
          prvo vprašanje ob razčlenitvi je "kje izgubljam največ", odgovor nanj
          pa ne sme terjati primerjanja dolžin. */}
      <p className={styles.caption}>
        Največ stane <strong>{top.name}</strong> — {formatEUR(top.totalEUR)}, kar je{' '}
        {formatPercent(top.share)} izmerjenega zneska.
      </p>

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
        aria-label="Razčlenitev po področjih v obliki grafa, urejena po velikosti. Iste številke so v seznamu pod grafom."
      >
        <ResponsiveContainer>
          {/*
            Stolpci so NALOŽENI in vodoravni.

            Doslej so bili vzporedni z utemeljitvijo, da se koši ne seštevajo — kar
            je držalo, dokler je naslovna številka bila samo neposredna izguba.
            Odkar hero nosi vsoto vseh treh (lib/heroTotals.ts), je naložen stolpec
            natanko to, kar velika številka trdi: iz česa je sestavljena. Ločenost
            košev nosi barva in ne razmik.

            Vodoravno v obeh širinah: imena področij so dolga, na osi X pa jih
            Recharts ne prelomi — na 520 px so se prekrivala v nečitljivo kašo,
            na širokem zaslonu pa so terjala nagib. Vodoravna vrstica da imenu
            celo vrstico in hkrati omogoči razvrstitev po velikosti od zgoraj
            navzdol, ki je za branje naravna.
          */}
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: isNarrow ? 8 : 56, left: 8, bottom: 8 }}
          >
            {/* Recharts privzeto riše osi in namig v fiksni temni barvi, ki v temnem
                načinu izgine — zato so vezani na tokene teme. */}
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
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
              width={nameWidth}
              interval={0}
              tickFormatter={truncate}
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
            {/*
              Delež stoji ob koncu zadnjega naloženega stolpca in ga zato nosi
              zadnja PRISOTNA serija — katera to je, se med segmenti razlikuje.
              Nevidna serija kot nosilec oznake ni prišla v poštev: Recharts ji
              mora dati `dataKey`, izračunan ključ pa podre razporeditev sklada
              in stolpci se izrišejo kot tanke črtice.
              Na ozkem zaslonu oznake ni, ker zanjo ni prostora.
            */}
            {buckets.map((bucket, index) => (
              <Bar
                key={bucket.key}
                dataKey={bucket.key}
                name={bucket.name}
                stackId="skupaj"
                fill={bucket.color}
                isAnimationActive={!reducedMotion}
              >
                {!isNarrow && index === buckets.length - 1 ? (
                  <LabelList
                    dataKey="share"
                    position="right"
                    offset={8}
                    formatter={(value: unknown) => formatPercent(Number(value))}
                    style={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                  />
                ) : null}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
