import { getModules, type ModuleDefinition, type ModuleOutput } from '../../config/modules';
import type { SegmentConfig } from '../../config/segments';
import type { ResultTotals } from '../../lib/potential';
import { Breakdown } from './Breakdown';
import { BreakdownChart, type BreakdownChartDatum } from './BreakdownChart';
import { ResultsSummary } from './ResultsSummary';
import { RiskCard } from './RiskCard';
import buttonStyles from '../../styles/buttons.module.css';
import styles from './ResultsView.module.css';

interface ResultsViewProps {
  segment: SegmentConfig;
  outputsByModule: Record<string, ModuleOutput[]>;
  totals: ResultTotals;
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
        lostMarginEUR: sumBucket('lostMargin'),
        capacityEUR: sumBucket('capacity'),
      };
    })
    .filter((datum) => datum.directLossEUR > 0 || datum.lostMarginEUR > 0 || datum.capacityEUR > 0);

  return (
    <div className={styles.wrap}>
      <p className={styles.stepLabel}>
        {stepLabel} · {segment.displayName}
      </p>
      <p className={styles.headline}>{segment.headlineStory}</p>

      {isAccounting && accountingCapacity !== undefined ? (
        <h1 className={styles.totalValue}>+{accountingCapacity.toFixed(1)} strank brez nove zaposlitve</h1>
      ) : null}

      <ResultsSummary totals={totals} directLossNote={segment.directLossNote} />

      {chartData.length > 0 ? (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Razčlenitev po področjih</h2>
          <BreakdownChart data={chartData} />
          {/* Oba letna denarna koša v istem seznamu: postavke so poimenovane tako,
              da je razlika vidna, ločena razdelka pa bi isto področje razbila na
              dva bloka in razčlenitev bi izgubila smisel. */}
          <Breakdown
            modules={modules}
            outputsByModule={outputsByModule}
            buckets={['directLoss', 'lostMargin']}
          />
        </div>
      ) : null}

      {totals.capacityEUR > 0 ? (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Kje se izgublja kapaciteta</h2>
          <Breakdown modules={modules} outputsByModule={outputsByModule} buckets={['capacity']} />
        </div>
      ) : null}

      {totals.risks.length > 0 ? (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Podatki in procesna tveganja</h2>
          <p className={styles.cardNote}>
            Ta ocena namenoma nima zneska. Kjer ni kalkulacije ali sledljivosti, natančnega zneska ni mogoče
            izračunati — navidezno natančna številka bi prav to težavo skrila.
          </p>
          <RiskCard risks={totals.risks} />
        </div>
      ) : null}

      {unmeasuredModules.length > 0 ? (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Česa nismo izmerili</h2>
          <p className={styles.cardNote}>
            Za ta področja nimamo vaših številk — bodisi jih niste izbrali, bodisi ste jih pustili prazna.
            V zgornji izračun zato ne vstopajo z nobenim zneskom. Nobene številke si nismo izmislili.
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
