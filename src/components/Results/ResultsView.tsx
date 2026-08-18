import { lazy, Suspense } from 'react';
import { getModules, type ModuleDefinition, type ModuleOutput } from '../../config/modules';
import type { SegmentConfig } from '../../config/segments';
import { triageScoreLabel } from '../../lib/answerLabels';
import { formatAmount, formatDecimal } from '../../lib/format';
import { useStepHeading } from '../../lib/useStepHeading';
import type { TriageScores } from '../../lib/moduleEngine';
import type { ResultTotals } from '../../lib/potential';
import type { TotalsRange } from '../../lib/range';
import { Breakdown } from './Breakdown';
import type { BreakdownChartDatum } from './BreakdownChart';
import { ResultsSummary } from './ResultsSummary';
import { RiskCard } from './RiskCard';
import buttonStyles from '../../styles/buttons.module.css';
import styles from './ResultsView.module.css';

/**
 * Recharts se naloži šele tu.
 *
 * Knjižnica z odvisnostmi vred je 341 kB od 798 kB glavnega svežnja — 43 % kode,
 * ki jo je obiskovalec prenesel ob prvem obisku, čeprav je graf šele na desetem
 * koraku in ga velik del obiskovalcev sploh ne doseže. Rezervat prostora med
 * nalaganjem prepreči, da bi vsebina pod grafom poskočila.
 */
const BreakdownChart = lazy(() =>
  import('./BreakdownChart').then((module) => ({ default: module.BreakdownChart })),
);

interface ResultsViewProps {
  segment: SegmentConfig;
  outputsByModule: Record<string, ModuleOutput[]>;
  totals: ResultTotals;
  /** Razpon, kadar finančna osnova stoji na izbranih pasovih (lib/range.ts). */
  totalsRange?: TotalsRange | null;
  accountingCapacity?: number;
  /** Moduli, ki jih obiskovalec v triaži ni izbral — ostanejo neizmerjeni. */
  unmeasuredModules: ModuleDefinition[];
  /** Triažne ocene 0–3 — pri neizmerjenih področjih pokažejo, kaj po lastni oceni boli. */
  triageScores: TriageScores;
  /** Razrešeni vnosi po modulu — razčlenitev iz njih pokaže, iz česa znesek nastane. */
  valuesByModule: Record<string, Record<string, number>>;
  stepLabel: string;
  onMeasureModule: (id: string) => void;
  onProceedToEmail: () => void;
  onBack: () => void;
}

export function ResultsView({
  segment,
  outputsByModule,
  totals,
  totalsRange,
  accountingCapacity,
  unmeasuredModules,
  triageScores,
  valuesByModule,
  stepLabel,
  onMeasureModule,
  onProceedToEmail,
  onBack,
}: ResultsViewProps) {
  const headingRef = useStepHeading();
  const isAccounting = segment.id === 'racunovodstvo';
  const modules = getModules(segment.moduleIds);

  /**
   * Skupni letni znesek — ista formula kot tekoča vsota v pasu med vnosi
   * (StepInputs.liveTotalEUR). Enkratni kapital namenoma ni zraven: sešteti
   * enkraten učinek z letnimi je prav napaka, ki jo ločeni koši preprečujejo.
   */
  const heroValueEUR = totals.directLossEUR + totals.lostMarginEUR + totals.capacityEUR;
  const heroRange = totalsRange
    ? {
        minEUR:
          totalsRange.directLoss.minEUR + totalsRange.lostMargin.minEUR + totalsRange.capacity.minEUR,
        maxEUR:
          totalsRange.directLoss.maxEUR + totalsRange.lostMargin.maxEUR + totalsRange.capacity.maxEUR,
      }
    : null;
  const heroTotal = formatAmount(heroValueEUR, {
    range: heroRange,
    lowConfidence: totals.confidence === 'low',
  });

  /**
   * Pokritost izračuna: hero številka meri samo izbrana in izpolnjena področja,
   * privzeto 3 od 9–11. Brez tega pripisa se skupni znesek bere, kot da meri vse —
   * sistematično podcenjevanje, ki ga razdelek "Česa nismo izmerili" na dnu strani
   * ne odkupi, ker do njega marsikdo ne pride.
   */
  const triageableCount = modules.filter((definition) => definition.triage).length;
  const measuredCount = triageableCount - unmeasuredModules.length;
  const painfulUnmeasured = unmeasuredModules.filter(
    (definition) => (triageScores[definition.id] ?? 0) >= 2,
  );

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
      {/*
        Vprašanje segmenta je naslov strani in ne opomba pod njo.
        Doslej je bilo drobno sivo besedilo, h1 pa je imel samo računovodski
        segment — stran, ki naj odgovori na eno vprašanje, se je torej začela
        brez tega vprašanja, hierarhija naslovov pa pri h2 kartic.
      */}
      <h1 className={styles.headline} tabIndex={-1} ref={headingRef}>
        {segment.headlineStory}
      </h1>

      {/*
        Ena številka pred štirimi.

        Med vnašanjem je obiskovalec ves čas gledal "Trenutni letni strošek
        izbranih področij", ki je rasel z vsakim odgovorom — na rezultatih pa je
        ta številka izginila in namesto nje so ga pričakale štiri enakovredne
        kartice z dolgimi pojasnili. Vsota je ista kot v pasu med vnosi
        (neposredno + marža + kapaciteta); enkratni kapital ostane zunaj, ker se
        z letnimi zneski ne sešteva.
      */}
      <p className={styles.heroTotal}>
        <span className={styles.heroLabel}>Skupaj na leto</span>
        <span className={styles.heroValue}>{heroTotal}</span>
      </p>

      {isAccounting && accountingCapacity !== undefined ? (
        <p className={styles.heroSecondary}>
          To je {formatDecimal(accountingCapacity)} dodatnih strank brez nove zaposlitve.
        </p>
      ) : null}

      {triageableCount > 0 && measuredCount < triageableCount ? (
        <p className={styles.coverageNote}>
          Izmerjeno {measuredCount} od {triageableCount} področij
          {painfulUnmeasured.length > 0
            ? ` — ${painfulNote(painfulUnmeasured.length)}`
            : '. Neizmerjena področja v zgornje zneske ne vstopajo z nobenim zneskom.'}
        </p>
      ) : null}

      <ResultsSummary totals={totals} totalsRange={totalsRange} directLossNote={segment.directLossNote} />

      {chartData.length > 0 ? (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Razčlenitev po področjih</h2>
          <Suspense fallback={<div className={styles.chartPlaceholder} aria-hidden="true" />}>
            <BreakdownChart data={chartData} />
          </Suspense>
          {/* Oba letna denarna koša v istem seznamu: postavke so poimenovane tako,
              da je razlika vidna, ločena razdelka pa bi isto področje razbila na
              dva bloka in razčlenitev bi izgubila smisel. */}
          <Breakdown
            modules={modules}
            outputsByModule={outputsByModule}
            buckets={['directLoss', 'lostMargin']}
            valuesByModule={valuesByModule}
          />
        </div>
      ) : null}

      {totals.capacityEUR > 0 ? (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Kje se izgublja kapaciteta</h2>
          <Breakdown
            modules={modules}
            outputsByModule={outputsByModule}
            buckets={['capacity']}
            valuesByModule={valuesByModule}
          />
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
                  {/* Lastna triažna ocena ob področju: pove, da 0 EUR ni "ni problema". */}
                  {(triageScores[definition.id] ?? 0) > 0 ? (
                    <span className={styles.unmeasuredScore}>
                      vaša ocena: {triageScoreLabel(definition, triageScores[definition.id] ?? 0)}
                    </span>
                  ) : null}
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

      <div className={styles.stickyFooter}>
        <div className={styles.stickyFooterInner}>
          <div className={styles.actions}>
            <button type="button" className={buttonStyles.secondaryButton} onClick={onBack}>
              Nazaj na vnos
            </button>
            <button type="button" className={buttonStyles.primaryButton} onClick={onProceedToEmail}>
              {/* Isto besedilo kot naslov naslednjega zaslona — prej je gumb obljubljal
                  "PDF poročilo", pristalo pa se je na "Razširjen rezultat". */}
              Prenesi PDF poročilo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Slovenske števne oblike z dvojino — "2 področji … nista všteti", ne "2 področja … niso všteto". */
function painfulNote(count: number): string {
  if (count === 1) return 'še 1 področje, ki ste ga označili kot pereče, ni všteto v zgornje zneske.';
  if (count === 2) return 'še 2 področji, ki ste ju označili kot pereči, nista všteti v zgornje zneske.';
  if (count === 3 || count === 4) {
    return `še ${count} področja, ki ste jih označili kot pereča, niso všteta v zgornje zneske.`;
  }
  return `še ${count} področij, ki ste jih označili kot pereča, ni vštetih v zgornje zneske.`;
}
