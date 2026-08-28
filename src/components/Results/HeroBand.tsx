import { SHARED_COPY, segmentLabelWithSize, type ResolvedSegmentCopy } from '../../config/copy';
import { formatAmount, formatDecimal, formatEUR } from '../../lib/format';
import { multiYearEUR, perMonthEUR, perWorkingDayEUR } from '../../lib/horizon';
import type { ConfidenceLevel } from '../../lib/potential';
import type { EURRange } from '../../lib/range';
import { useCountUp } from '../../lib/useCountUp';
import { useStepHeading } from '../../lib/useStepHeading';
import styles from './HeroBand.module.css';

interface HeroBandProps {
  copy: ResolvedSegmentCopy;
  employeeCount: number;
  stepLabel: string;
  heroValueEUR: number;
  heroRange: EURRange | null;
  confidence?: ConfidenceLevel;
  /** Računovodstvo: "+X strank brez nove zaposlitve" — edina panožna izpeljanka. */
  accountingCapacity?: number;
}

/**
 * Naslovni pas rezultata.
 *
 * Vrh strani je bil dotlej zaporedje odstavkov na beli podlagi: nadnaslov,
 * naslov, znesek, opomba, večletni blok. Vse to je bila ista raven — bralec, ki
 * je stran odprl, ni imel mesta, kamor bi najprej pogledal, čeprav ima poročilo
 * en sam odgovor. Temna ploskev ta odgovor omeji in ga hkrati poveže z glavo
 * strankinega PDF, ki je temna že od nekdaj (pdfKit.ts, PALETTE.brandDark).
 *
 * Tri leče pod zneskom so isti letni znesek v treh obdobjih. Dnevni ekvivalent
 * je bil doslej zakopan v opombo pod večletnim pogledom, čeprav je edina
 * številka na strani, ki jo bralec preveri na pamet — in prav zato tista, ki
 * letnemu znesku podeli verodostojnost.
 */
export function HeroBand({
  copy,
  employeeCount,
  stepLabel,
  heroValueEUR,
  heroRange,
  confidence,
  accountingCapacity,
}: HeroBandProps) {
  const headingRef = useStepHeading();
  const lowConfidence = confidence === 'low';

  const heroInputs = { valueEUR: heroValueEUR, range: heroRange, lowConfidence };
  const animatedTotal = useCountUp(heroInputs);
  const finalTotal = formatAmount(heroValueEUR, heroInputs);

  const multiYearRange = heroRange
    ? { minEUR: multiYearEUR(heroRange.minEUR), maxEUR: multiYearEUR(heroRange.maxEUR) }
    : null;

  return (
    <div className={styles.band}>
      <p className={styles.stepLabel}>
        {stepLabel} · {segmentLabelWithSize(copy.displayName, employeeCount)}
      </p>

      {/* Vprašanje segmenta je naslov strani in ne opomba pod njo — stran, ki naj
          odgovori na eno vprašanje, se mora s tem vprašanjem začeti. */}
      <h1 className={styles.headline} tabIndex={-1} ref={headingRef}>
        {copy.results.headline}
      </h1>

      <p className={styles.label}>{copy.results.heroLabel}</p>
      {/*
        Animiran izpis je za bralnik zaslona skrit: vsak okvir bi sprožil novo
        objavo in namesto zneska bi uporabnik slišal štetje. Ob njem stoji končna
        vrednost, ki jo bralnik prebere enkrat.
      */}
      <p className={styles.value}>
        <span aria-hidden="true">{animatedTotal}</span>
        <span className={styles.srOnly}>{finalTotal}</span>
      </p>

      {confidence ? (
        <p className={`${styles.badge} ${styles[confidence]}`}>{SHARED_COPY.confidenceLabel[confidence]}</p>
      ) : null}

      <p className={styles.note}>{copy.results.heroNote}</p>

      {heroValueEUR > 0 ? (
        <ul className={styles.lenses}>
          <Lens label={SHARED_COPY.lensDayLabel} value={formatEUR(perWorkingDayEUR(heroValueEUR))} />
          <Lens label={SHARED_COPY.lensMonthLabel} value={formatEUR(perMonthEUR(heroValueEUR))} />
          <Lens
            label={SHARED_COPY.horizonLabel}
            value={formatAmount(multiYearEUR(heroValueEUR), { range: multiYearRange, lowConfidence })}
            emphasis
          />
        </ul>
      ) : null}

      {accountingCapacity !== undefined && copy.results.capacitySecondary ? (
        <p className={styles.secondary}>
          {copy.results.capacitySecondary.replace('{count}', formatDecimal(accountingCapacity))}
        </p>
      ) : null}
    </div>
  );
}

/** Leča: isti znesek v drugem obdobju. Trojni je poudarjen, ker je sidro odločitve. */
function Lens({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <li className={emphasis ? `${styles.lens} ${styles.lensEmphasis}` : styles.lens}>
      <span className={styles.lensLabel}>{label}</span>
      <span className={styles.lensValue}>{value}</span>
    </li>
  );
}
