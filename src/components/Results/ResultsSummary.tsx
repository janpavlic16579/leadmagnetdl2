import type { ResolvedSegmentCopy } from '../../config/copy';
import {
  formatAmount,
  formatEUR,
  formatEURRange,
  formatHours,
  MIN_FIGURE_EUR,
} from '../../lib/format';
import type { ResultTotals } from '../../lib/potential';
import { displayRange, type EURRange, type TotalsRange } from '../../lib/range';
import styles from './ResultsSummary.module.css';

interface ResultsSummaryProps {
  totals: ResultTotals;
  /** Razpon, kadar finančna osnova stoji na izbranih pasovih (lib/range.ts). */
  totalsRange?: TotalsRange | null;
  /**
   * Naslovi in opombe kartic te dejavnosti (config/copy). Doslej je komponenta
   * dobila samo opombo pri neposrednih stroških, vse ostalo pa je imela zapisano
   * pri sebi — in isto besedilo je v drugačni različici živelo še v pdf.ts.
   */
  figures: ResolvedSegmentCopy['figures'];
}

/**
 * Štiri ločene številke namesto ene velike.
 *
 * Ena skupna vsota je zavajala: mešala je denar, ki odteka, s časom, ki se izgublja,
 * in z enkratnim kapitalom, ki ni ne eno ne drugo. Direktor, ki naj na tej podlagi
 * odloča, mora videti štiri različne vrste zneska ločeno.
 *
 * Kartica se izriše samo, kadar ima vrednost — segmenti brez potenciala tako
 * ostanejo pri treh ali manj, brez praznih ničel.
 *
 * Zanesljivost je odslej svoja komponenta (ConfidenceMeter): značka brez
 * lestvice je bila ocena brez merila, tu pa je stala nad karticami kot njihov
 * nadnaslov, čeprav govori o celotnem izračunu in ne o teh petih zneskih.
 */
export function ResultsSummary({ totals, totalsRange, figures }: ResultsSummaryProps) {
  const confidence = totals.confidence;
  const amount = (value: number, range?: EURRange) =>
    formatAmount(value, { range: displayRange(range), lowConfidence: confidence === 'low' });

  return (
    <>
      <div className={styles.grid}>
        <Figure
          title={figures.directLoss.title}
          value={amount(totals.directLossEUR, totalsRange?.directLoss)}
          note={figures.directLoss.note}
        />

        {/*
          Ločeno od neposrednih stroškov namenoma: to ni denar, ki je odtekel, ampak
          denar, ki ni prišel. Trditev stoji na predpostavki o kupčevem vedenju, zato
          mora prenesti ugovor "tega nakupa morda sploh ne bi bilo", ne da bi s seboj
          odnesla tudi dokazljivi del zneska.
        */}
        {totals.lostMarginEUR >= MIN_FIGURE_EUR ? (
          <Figure
            title={figures.lostMargin.title}
            value={amount(totals.lostMarginEUR, totalsRange?.lostMargin)}
            // Besedilo je namerno panožno nevtralno: koš 'lostMargin' zdaj polni šest
            // dejavnosti, ne le maloprodaja. Prejšnji primeri ("prazna polica") so bili
            // trgovinski in so v proizvodnji, storitvah in računovodstvu zveneli tuje.
            note={figures.lostMargin.note}
          />
        ) : null}

        {totals.capacityEUR > 0 ? (
          <Figure
            title={figures.capacity.title}
            value={amount(totals.capacityEUR, totalsRange?.capacity)}
            // Ure so izračun in ne besedilo, zato jih doda izrisovalec: opomba v
            // registru se začne za njimi in ostane panožno prepisljiva.
            note={`${formatHours(totals.capacityHoursPerMonth)}/mesec. ${figures.capacity.note}`}
          />
        ) : null}

        {totals.oneTimeCapitalEUR >= MIN_FIGURE_EUR ? (
          <Figure
            title={figures.oneTimeCapital.title}
            value={
              displayRange(totalsRange?.oneTimeCapital)
                ? formatEURRange(totalsRange!.oneTimeCapital.minEUR, totalsRange!.oneTimeCapital.maxEUR)
                : formatEUR(totals.oneTimeCapitalEUR)
            }
            note={figures.oneTimeCapital.note}
          />
        ) : null}

        {totals.addressablePotentialEUR !== undefined ? (
          <Figure
            title={figures.potential.title}
            value={
              displayRange(totalsRange?.potential)
                ? formatEURRange(totalsRange!.potential!.minEUR, totalsRange!.potential!.maxEUR)
                : formatEUR(totals.addressablePotentialEUR)
            }
            note={figures.potential.note}
            wide
          />
        ) : null}
      </div>
    </>
  );
}

function Figure({
  title,
  value,
  note,
  wide,
}: {
  title: string;
  value: string;
  note: string;
  /** Kartica čez celo širino mreže — potencial, da ne visi osirotel v prazni celici. */
  wide?: boolean;
}) {
  return (
    <div className={wide ? `${styles.figure} ${styles.figureWide}` : styles.figure}>
      <h2 className={styles.figureTitle}>{title}</h2>
      <p className={styles.figureValue}>{value}</p>
      <p className={styles.figureNote}>{note}</p>
    </div>
  );
}
