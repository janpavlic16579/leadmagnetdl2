import { formatEUR, formatHours } from '../../lib/format';
import type { ConfidenceLevel, ResultTotals } from '../../lib/potential';
import styles from './ResultsSummary.module.css';

interface ResultsSummaryProps {
  totals: ResultTotals;
  /** Primeri postavk te dejavnosti; brez njih ostane nevtralno besedilo. */
  directLossNote?: string;
}

const DEFAULT_DIRECT_LOSS_NOTE = 'Denar, ki dejansko odteka, ne izgubljen čas.';

const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  high: 'Visoka zanesljivost',
  medium: 'Srednja zanesljivost',
  low: 'Nizka zanesljivost',
};

const CONFIDENCE_NOTE: Record<ConfidenceLevel, string> = {
  high: 'Vnesli ste konkretne ure, stroške in glavni vzrok. Številke stojijo na vaših podatkih.',
  medium: 'Del vrednosti je iz izbranih razponov ali privzetih ocen. Rezultat je pravega velikostnega reda.',
  low: 'Večina ključnih podatkov manjka, zato so zneski označeni kot "najmanj" — dejanski so praviloma višji, ne nižji.',
};

/**
 * Štiri ločene številke namesto ene velike.
 *
 * Ena skupna vsota je zavajala: mešala je denar, ki odteka, s časom, ki se izgublja,
 * in z enkratnim kapitalom, ki ni ne eno ne drugo. Direktor, ki naj na tej podlagi
 * odloča, mora videti štiri različne vrste zneska ločeno.
 *
 * Kartica se izriše samo, kadar ima vrednost — segmenti brez potenciala tako
 * ostanejo pri treh ali manj, brez praznih ničel.
 */
export function ResultsSummary({ totals, directLossNote }: ResultsSummaryProps) {
  const confidence = totals.confidence;
  // Pri nizki zanesljivosti je navidezno natančen znesek slabši od poštenega "najmanj".
  const amount = (value: number) => (confidence === 'low' ? `najmanj ${formatEUR(value)}` : formatEUR(value));

  return (
    <>
      {confidence ? (
        <div className={styles.confidenceRow}>
          <span className={`${styles.badge} ${styles[confidence]}`}>{CONFIDENCE_LABEL[confidence]}</span>
          <span className={styles.confidenceNote}>{CONFIDENCE_NOTE[confidence]}</span>
        </div>
      ) : null}

      <div className={styles.grid}>
        <Figure
          title="Neposredni letni stroški"
          value={amount(totals.directLossEUR)}
          note={directLossNote ?? DEFAULT_DIRECT_LOSS_NOTE}
        />

        {totals.capacityEUR > 0 ? (
          <Figure
            title="Vrednost izgubljene kapacitete"
            value={amount(totals.capacityEUR)}
            note={`${formatHours(totals.capacityHoursPerMonth)}/mesec. To ni prihranek pri plačah — zaposleni ostane, njegov čas pa se lahko usmeri v delo, ki prinaša vrednost.`}
          />
        ) : null}

        {totals.oneTimeCapitalEUR > 0 ? (
          <Figure
            title="Sprostljiv obratni kapital"
            value={formatEUR(totals.oneTimeCapitalEUR)}
            note="Enkraten učinek, ne letni prihranek — zato se z zneski zgoraj ne sešteva."
          />
        ) : null}

        {totals.potential ? (
          <Figure
            title="Realistični potencial izboljšave"
            value={`${formatEUR(totals.potential.minEUR)} – ${formatEUR(totals.potential.maxEUR)}`}
            note="Letno. Izpeljano iz glavnih vzrokov, ki ste jih navedli, in sistemov, ki jih danes uporabljate. Ni obljuba prihranka, ampak konservativen poslovni potencial, ki ga je mogoče preveriti na uvodnem sestanku."
          />
        ) : null}
      </div>
    </>
  );
}

function Figure({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <div className={styles.figure}>
      <h2 className={styles.figureTitle}>{title}</h2>
      <p className={styles.figureValue}>{value}</p>
      <p className={styles.figureNote}>{note}</p>
    </div>
  );
}
