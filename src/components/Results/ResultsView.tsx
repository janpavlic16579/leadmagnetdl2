import { MODULE_METHODOLOGY } from '../../../content/methodology';
import type { SegmentConfig } from '../../config/segments';
import type { ModuleAResult, ModuleBResult, ModuleCResult, ModuleDResult, ModuleEChecked } from '../../lib/calculations';
import { formatEUR } from '../../lib/format';
import { Breakdown } from './Breakdown';
import { BreakdownChart, type BreakdownChartDatum } from './BreakdownChart';
import { ModuleC } from './ModuleC';
import { ModuleEWarnings } from './ModuleEWarnings';
import { MethodologyToggle } from './MethodologyToggle';
import buttonStyles from '../../styles/buttons.module.css';
import styles from './ResultsView.module.css';

interface ResultsViewProps {
  segment: SegmentConfig;
  results: {
    A?: ModuleAResult;
    B?: ModuleBResult;
    C?: ModuleCResult;
    D?: ModuleDResult;
  };
  totalAnnualLossEUR: number;
  moduleEChecked: ModuleEChecked;
  accountingCapacity?: number;
  onProceedToEmail: () => void;
  onBack: () => void;
}

export function ResultsView({
  segment,
  results,
  totalAnnualLossEUR,
  moduleEChecked,
  accountingCapacity,
  onProceedToEmail,
  onBack,
}: ResultsViewProps) {
  const isAccounting = segment.id === 'racunovodstvo';

  const chartData: BreakdownChartDatum[] = [];
  if (results.A) chartData.push({ name: 'Ročno delo', annualEUR: results.A.annualEUR });
  if (results.B) chartData.push({ name: 'Napake', annualEUR: results.B.annualEUR });
  if (results.C) chartData.push({ name: 'Zaloge (letno)', annualEUR: results.C.annualEUR });
  if (results.D) chartData.push({ name: 'Denarni tok', annualEUR: results.D.annualEUR });

  return (
    <div className={styles.wrap}>
      <p className={styles.stepLabel}>Korak 3 od 3 · {segment.displayName}</p>
      <p className={styles.headline}>{segment.headlineStory}</p>
      <h1 className={styles.totalValue}>
        {isAccounting && accountingCapacity !== undefined
          ? `+${accountingCapacity.toFixed(1)} strank brez nove zaposlitve`
          : formatEUR(totalAnnualLossEUR)}
      </h1>

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Razčlenitev po modulih</h2>
        <BreakdownChart data={chartData} />
        <Breakdown isAccounting={isAccounting} accountingCapacity={accountingCapacity} A={results.A} B={results.B} D={results.D} />
      </div>

      {results.C ? (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Vezan kapital v zalogah</h2>
          <ModuleC result={results.C} />
          <MethodologyToggle formula={MODULE_METHODOLOGY.C.formula} rationale={MODULE_METHODOLOGY.C.rationale} />
        </div>
      ) : null}

      <ModuleEWarnings checked={moduleEChecked} />

      {!isAccounting && (
        <p className={styles.headline} style={{ marginTop: 'var(--space-3)' }}>
          Skupna letna izguba ne vključuje enkratnega sproščenega kapitala iz modula C — ta je prikazan ločeno
          zgoraj.
        </p>
      )}

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
