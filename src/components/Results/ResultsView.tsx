import { lazy, Suspense, useState, type ReactNode } from 'react';
import { getModules, type ModuleDefinition, type ModuleOutput } from '../../config/modules';
import type { SegmentConfig } from '../../config/segments';
import { SHARED_COPY, type ResolvedSegmentCopy } from '../../config/copy';
import { triageScoreLabel } from '../../lib/answerLabels';
import { heroValueEUR as heroTotalEUR, heroRangeEUR as heroTotalRange } from '../../lib/heroTotals';
import { breakdownChartHeightPx, breakdownRows, coverageSegments } from '../../lib/reportVisuals';
import { useReveal } from '../../lib/useReveal';
import type { TriageScores } from '../../lib/moduleEngine';
import type { ResultTotals } from '../../lib/potential';
import type { TotalsRange } from '../../lib/range';
import { Breakdown } from './Breakdown';
import { CompositionBar } from './CompositionBar';
import { ConfidenceNote } from './ConfidenceNote';
import { HeroBand } from './HeroBand';
import { ProjectionBars } from './ProjectionBars';
import { ResultsSummary } from './ResultsSummary';
import { RiskCard } from './RiskCard';
import { NextSteps } from './NextSteps';
import { SALES_CONTACT } from '../../config/salesContact';
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
  /** Nabor in vrstni red področij; besedila so v copy. */
  segment: SegmentConfig;
  /** Naslovi, opombe in besedila kartic izbrane dejavnosti. */
  copy: ResolvedSegmentCopy;
  /** Vneseno število zaposlenih (Korak 2) — nadnaslov pripne dejanski velikostni razred. */
  employeeCount: number;
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
  /** Izračunan razlog nizke zanesljivosti — glej ConfidenceNote. */
  confidenceReason?: string | null;
  onMeasureModule: (id: string) => void;
  /**
   * Prenos strankinega poročila. Zgradi se ob kliku iz TRENUTNEGA stanja in ne
   * iz datoteke, shranjene ob oddaji: obiskovalec sme po oddaji nazaj v vnose
   * in PDF mora ustrezati zaslonu, s katerega ga prenaša.
   */
  onDownloadPdf: () => Promise<void>;
  /** Kaj sledi rezultatom (NextSteps) — vsebina nekdanjega zahvalnega zaslona. */
  consultingRequested: boolean;
  onDownloadSalesPdf?: () => void | Promise<void>;
  internalMode?: boolean;
  followUpSequenceDebug?: string;
  onBack: () => void;
}

export function ResultsView({
  segment,
  copy,
  employeeCount,
  outputsByModule,
  totals,
  totalsRange,
  accountingCapacity,
  unmeasuredModules,
  triageScores,
  valuesByModule,
  stepLabel,
  confidenceReason,
  onMeasureModule,
  onDownloadPdf,
  consultingRequested,
  onDownloadSalesPdf,
  internalMode,
  followUpSequenceDebug,
  onBack,
}: ResultsViewProps) {
  /**
   * Gradnja PDF-ja traja; brez straže dvoklik ustvari dve datoteki. Napaka se
   * pokaže tik ob gumbu in ne nikjer: odpoved priprave bi sicer obiskovalca
   * pustila pred gumbom, ki izgleda, kot da ni bil pritisnjen.
   */
  const [downloading, setDownloading] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);
  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    setDownloadFailed(false);
    try {
      await onDownloadPdf();
    } catch {
      setDownloadFailed(true);
    } finally {
      setDownloading(false);
    }
  };

  const isAccounting = segment.id === 'racunovodstvo';
  const modules = getModules(segment.moduleIds);

  /**
   * Skupni letni znesek — ista formula kot tekoča vsota v pasu med vnosi
   * (StepInputs.liveTotalEUR). Enkratni kapital namenoma ni zraven: sešteti
   * enkraten učinek z letnimi je prav napaka, ki jo ločeni koši preprečujejo.
   */
  const heroValueEUR = heroTotalEUR(totals);
  const heroRange = heroTotalRange(totalsRange) ?? null;
  const lowConfidence = totals.confidence === 'low';

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

  // Ena vrstica na modul, ne na posamezno postavko — sicer je oznak osem in so
  // dolge. Enkratni kapital v graf namenoma ne pride: mešanje enkratnega zneska
  // med letne je prav napaka, ki jo ločeni koši preprečujejo. Razvrstitev po
  // velikosti opravi breakdownRows, ki je ista za zaslon in PDF.
  const chartData = breakdownRows(
    modules
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
      .filter((datum) => datum.directLossEUR > 0 || datum.lostMarginEUR > 0 || datum.capacityEUR > 0),
  );

  return (
    <div className={styles.wrap}>
      <HeroBand
        copy={copy}
        employeeCount={employeeCount}
        stepLabel={stepLabel}
        heroValueEUR={heroValueEUR}
        heroRange={heroRange}
        confidence={totals.confidence}
        accountingCapacity={isAccounting ? accountingCapacity : undefined}
      />

      {/*
        Ograde takoj pod zneskom in ne na dnu strani.

        Vsaka od njih je obstajala že prej — v opombi kapacitete, pod grafom, v
        razdelku o neizmerjenem — torej tam, kjer jih bralec sreča šele, ko si je
        o številki že ustvaril mnenje. Skupaj povedo eno stvar: izračun meri
        manj, kot podjetje izgublja. To je razlika med konservativno oceno in
        podcenjeno, in edini razlog, da je znesek mogoče braniti navzgor.
      */}
      {triageableCount > 0 && measuredCount < triageableCount ? (
        <div className={styles.coverage}>
          <p className={styles.coverageLabel}>{SHARED_COPY.coverageTitle}</p>
          <CoverageBar measuredCount={measuredCount} triageableCount={triageableCount} />
          <p className={styles.coverageNote}>
            Izmerjeno {measuredCount} od {triageableCount} področij
            {painfulUnmeasured.length > 0
              ? ` — ${painfulNote(painfulUnmeasured.length)}`
              : '. Neizmerjena področja v zgornje zneske ne vstopajo z nobenim zneskom.'}
          </p>
        </div>
      ) : null}

      {heroValueEUR > 0 ? (
        <div className={styles.notIncluded}>
          <p className={styles.notIncludedTitle}>{SHARED_COPY.notIncludedTitle}</p>
          <ul className={styles.notIncludedList}>
            {SHARED_COPY.notIncluded.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className={styles.notIncludedClosing}>{SHARED_COPY.notIncludedClosing}</p>
        </div>
      ) : null}

      {/* Sestava vsote in zanesljivost ocene: kaj je v znesku in kako trdno stoji. */}
      {heroValueEUR > 0 ? (
        <Reveal className={styles.card}>
          <h2 className={styles.sectionTitle}>{SHARED_COPY.compositionTitle}</h2>
          <p className={styles.cardNote}>{SHARED_COPY.compositionNote}</p>
          <div className={styles.cardBody}>
            <CompositionBar totals={totals} figures={copy.figures} />
          </div>
          {totals.confidence ? (
            <ConfidenceNote level={totals.confidence} reason={confidenceReason} />
          ) : null}
        </Reveal>
      ) : null}

      <ResultsSummary totals={totals} totalsRange={totalsRange} figures={copy.figures} />

      {chartData.length > 0 ? (
        <Reveal className={styles.card}>
          <h2 className={styles.sectionTitle}>{copy.results.breakdownTitle}</h2>
          {/* Rezervat je enake višine kot graf sam (breakdownChartHeightPx) —
              fiksnih 260 px je na ozkem zaslonu pomenilo, da vsebina pod grafom
              ob njegovem prihodu poskoči, kar naj bi rezervat prav preprečil. */}
          <Suspense
            fallback={
              <div
                className={styles.chartPlaceholder}
                style={{ height: breakdownChartHeightPx(chartData.length) }}
                aria-hidden="true"
              />
            }
          >
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
        </Reveal>
      ) : null}

      {totals.capacityEUR > 0 ? (
        <Reveal className={styles.card}>
          <h2 className={styles.sectionTitle}>{copy.results.capacityTitle}</h2>
          <Breakdown
            modules={modules}
            outputsByModule={outputsByModule}
            buckets={['capacity']}
            valuesByModule={valuesByModule}
          />
        </Reveal>
      ) : null}

      {heroValueEUR > 0 ? (
        <Reveal className={styles.card}>
          <h2 className={styles.sectionTitle}>{SHARED_COPY.projectionTitle}</h2>
          <ProjectionBars annualEUR={heroValueEUR} heroRange={heroRange} lowConfidence={lowConfidence} />
        </Reveal>
      ) : null}

      {totals.risks.length > 0 ? (
        <Reveal className={styles.card}>
          <h2 className={styles.sectionTitle}>{copy.results.risksTitle}</h2>
          <p className={styles.cardNote}>
            Ta ocena namenoma nima zneska. Kjer ni kalkulacije ali sledljivosti, natančnega zneska ni mogoče
            izračunati — navidezno natančna številka bi prav to težavo skrila.
          </p>
          <div className={styles.cardBody}>
            <RiskCard risks={totals.risks} now={new Date()} />
          </div>
        </Reveal>
      ) : null}

      {unmeasuredModules.length > 0 ? (
        <Reveal className={styles.card}>
          <h2 className={styles.sectionTitle}>{copy.results.unmeasuredTitle}</h2>
          <p className={styles.cardNote}>
            Za ta področja nimamo vaših številk — bodisi jih niste izbrali, bodisi ste jih pustili prazna.
            V zgornji izračun zato ne vstopajo z nobenim zneskom. Nobene številke si nismo izmislili.
          </p>
          <ul className={styles.unmeasuredList}>
            {unmeasuredModules.map((definition) => {
              const score = triageScores[definition.id] ?? 0;

              return (
                <li key={definition.id}>
                  <div>
                    <span className={styles.unmeasuredTitle}>{definition.title}</span>
                    {/* Lastna triažna ocena ob področju: pove, da 0 EUR ni "ni problema". */}
                    {score > 0 ? (
                      <PainDots score={score} label={triageScoreLabel(definition, score)} />
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
              );
            })}
          </ul>
        </Reveal>
      ) : null}

      <NextSteps
        consultingRequested={consultingRequested}
        onDownloadSalesPdf={onDownloadSalesPdf}
        internalMode={internalMode}
        followUpSequenceDebug={followUpSequenceDebug}
      />

      <div className={styles.stickyFooter}>
        <div className={styles.stickyFooterInner}>
          {downloadFailed ? (
            <p role="alert" className={styles.footerError}>
              Priprava PDF-ja ni uspela. Poskusite znova ali nas pokličite na{' '}
              <a className={styles.footerErrorLink} href={SALES_CONTACT.phoneHref}>
                {SALES_CONTACT.phone}
              </a>
              .
            </p>
          ) : null}
          <div className={styles.actions}>
            <button type="button" className={buttonStyles.secondaryButton} onClick={onBack}>
              Nazaj na vnos
            </button>
            {/*
              Prenos neposredno, brez vmesnega zaslona: obrazec je za obiskovalcem.
              Vsak klik je sveža gesta, zato prenos ne odpade kot nekoč samodejni.
            */}
            <button
              type="button"
              className={buttonStyles.primaryButton}
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? 'Pripravljam …' : SHARED_COPY.resultsPrimaryCta}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Razdelek, ki se ob prihodu v vidno polje mehko razkrije.
 *
 * Ovojnica in ne razred na vsaki kartici, ker vsak razdelek potrebuje svoj
 * opazovalec. Privzeto stanje je vidno — glej lib/useReveal.ts za razlog.
 */
function Reveal({ className, children }: { className: string; children: ReactNode }) {
  const { ref, revealed } = useReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      className={revealed ? `${className} ${styles.revealed}` : `${className} ${styles.revealPending}`}
    >
      {children}
    </section>
  );
}

/**
 * Pokritost izračuna kot vrstica segmentov.
 *
 * Stavek "Izmerjeno 3 od 11 področij" je resničen, a ga bralec prebere kot
 * opombo. Enajst kvadratkov, od katerih so trije polni, pove isto kot slika in
 * postavi naslovni znesek tja, kamor spada: to je spodnja meja, ne meritev celote.
 */
function CoverageBar({ measuredCount, triageableCount }: { measuredCount: number; triageableCount: number }) {
  const segments = coverageSegments(measuredCount, triageableCount);
  if (segments.length === 0) return null;

  return (
    <div className={styles.coverageBar} role="img" aria-label={SHARED_COPY.coverageChartAlt}>
      {segments.map((segment) => (
        <span
          key={segment.index}
          className={
            segment.measured
              ? `${styles.coverageSegment} ${styles.coverageMeasured}`
              : styles.coverageSegment
          }
        />
      ))}
    </div>
  );
}

/**
 * Lastna ocena bolečine 0–3 ob neizmerjenem področju.
 *
 * Pike in ne besedilo: seznam neizmerjenih področij ima do osem vrstic in
 * besedna ocena v vsaki ("vaša ocena: nas resno ovira") je stena besedila, v
 * kateri se izgubi prav tisto, kar naj razdelek pokaže — katero od teh področij
 * po lastni presoji najbolj boli. Bralnik zaslona dobi isto oceno z besedo.
 */
function PainDots({ score, label }: { score: number; label: string | null }) {
  // Področje brez triažnih možnosti oznake nima; pike takrat povedo samo stopnjo.
  const text = label ? `vaša ocena: ${label}` : `vaša ocena: ${score} od 3`;

  return (
    <span className={styles.painDots} title={text}>
      <span className={styles.srOnly}>{text}</span>
      {[1, 2, 3].map((step) => (
        <span
          key={step}
          aria-hidden="true"
          className={step <= score ? `${styles.dot} ${styles.dotFilled}` : styles.dot}
        />
      ))}
    </span>
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
