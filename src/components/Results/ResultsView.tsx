import { getModules, type ModuleDefinition, type ModuleOutput } from '../../config/modules';
import type { SegmentConfig } from '../../config/segments';
import type { BucketTotals } from '../../lib/moduleEngine';
import { formatEUR, formatHours } from '../../lib/format';
import { Breakdown } from './Breakdown';
import { BreakdownChart, type BreakdownChartDatum } from './BreakdownChart';
import { RiskCard } from './RiskCard';
import buttonStyles from '../../styles/buttons.module.css';
import styles from './ResultsView.module.css';

interface ResultsViewProps {
  segment: SegmentConfig;
  outputsByModule: Record<string, ModuleOutput[]>;
  totals: BucketTotals;
  accountingCapacity?: number;
  /** Moduli, ki jih obiskovalec v triaži ni izbral — ostanejo neizmerjeni. */
  unmeasuredModules: ModuleDefinition[];
  stepLabel: string;
  onMeasureModule: (id: string) => void;
  onProceedToEmail: () => void;
  onBack: () => void;
}

export function ResultsView({
  segment,
  outputsByModule,
  totals,
  accountingCapacity,
  unmeasuredModules,
  stepLabel,
  onMeasureModule,
  onProceedToEmail,
  onBack,
}: ResultsViewProps) {
  const isAccounting = segment.id === 'racunovodstvo';
  const modules = getModules(segment.moduleIds);

  // Ena skupina stolpcev na modul, ne na posamezno postavko — sicer je osi X
  // osem dolgih oznak. Enkratni kapital v graf namenoma ne pride: mešanje
  // enkratnega zneska med letne je prav napaka, ki jo ločeni koši preprečujejo.
  const chartData: BreakdownChartDatum[] = modules
    .map((definition) => {
      const moduleOutputs = outputsByModule[definition.id] ?? [];
      const sumBucket = (bucket: string) =>
        moduleOutputs
          .filter((output) => output.bucket === bucket)
          .reduce((sum, output) => sum + (output.valueEUR ?? 0), 0);

      return {
        name: definition.title,
        directLossEUR: sumBucket('directLoss'),
        capacityEUR: sumBucket('capacity'),
      };
    })
    .filter((datum) => datum.directLossEUR > 0 || datum.capacityEUR > 0);

  return (
    <div className={styles.wrap}>
      <p className={styles.stepLabel}>
        {stepLabel} · {segment.displayName}
      </p>
      <p className={styles.headline}>{segment.headlineStory}</p>
      <h1 className={styles.totalValue}>
        {isAccounting && accountingCapacity !== undefined
          ? `+${accountingCapacity.toFixed(1)} strank brez nove zaposlitve`
          : formatEUR(totals.directLossEUR)}
      </h1>
      {!isAccounting ? (
        <p className={styles.headlineNote}>
          Neposredne letne izgube — samo denar, ki dejansko odteka. Sproščena kapaciteta in kapital v zalogah
          sta prikazana ločeno spodaj.
        </p>
      ) : null}

      {chartData.length > 0 ? (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Razčlenitev po modulih</h2>
          <BreakdownChart data={chartData} />
          <Breakdown modules={modules} outputsByModule={outputsByModule} buckets={['directLoss']} />
        </div>
      ) : null}

      {totals.capacityEUR > 0 ? (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Vrednost sproščene kapacitete</h2>
          <p className={styles.bigValue}>{formatEUR(totals.capacityEUR)}</p>
          <p className={styles.cardNote}>
            {formatHours(totals.capacityHoursPerMonth)}/mesec sproščenega časa. To ni prihranek pri plačah —
            zaposleni ostane, njegov čas pa se lahko usmeri v delo, ki prinaša vrednost.
          </p>
          <Breakdown modules={modules} outputsByModule={outputsByModule} buckets={['capacity']} />
        </div>
      ) : null}

      {totals.oneTimeCapitalEUR > 0 ? (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Enkratno sprostljiv kapital v zalogah</h2>
          <p className={styles.bigValue}>{formatEUR(totals.oneTimeCapitalEUR)}</p>
          <p className={styles.cardNote}>
            Enkraten dogodek, ne letni prihranek — zato se s številkami zgoraj ne sešteva. Letni strošek tega
            kapitala je že vštet med neposredne izgube.
          </p>
        </div>
      ) : null}

      {totals.risks.length > 0 ? (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Marža in procesna tveganja</h2>
          <RiskCard risks={totals.risks} />
        </div>
      ) : null}

      {unmeasuredModules.length > 0 ? (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Česa nismo izmerili</h2>
          <p className={styles.cardNote}>
            Ta področja ste v triaži ocenili kot manj boleča, zato zanje nismo zastavili podrobnih vprašanj.
            Nobene številke si nismo izmislili.
          </p>
          <ul className={styles.unmeasuredList}>
            {unmeasuredModules.map((definition) => (
              <li key={definition.id}>
                <div>
                  <span className={styles.unmeasuredTitle}>{definition.title}</span>
                  <p className={styles.unmeasuredSummary}>{definition.summary}</p>
                </div>
                <button
                  type="button"
                  className={buttonStyles.secondaryButton}
                  onClick={() => onMeasureModule(definition.id)}
                >
                  Izračunaj še to
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={styles.actions}>
        <button type="button" className={buttonStyles.secondaryButton} onClick={onBack}>
          Nazaj na vnos
        </button>
        <button type="button" className={buttonStyles.primaryButton} onClick={onProceedToEmail}>
          Dobite PDF poročilo in akcijski načrt
        </button>
      </div>
    </div>
  );
}
