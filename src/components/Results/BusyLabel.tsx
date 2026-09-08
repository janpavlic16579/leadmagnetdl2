import buttonStyles from '../../styles/buttons.module.css';

/**
 * Napis gumba, ki dela. Ena konstanta iz istega razloga kot SUBMIT_LABEL v
 * EmailGate: obrazec (oddaja) in rezultati (prenos PDF-ja) ga nosita oba.
 */
const BUSY_LABEL = 'Pripravljam …';

/**
 * Vsebina gumba, ki dela: vrteči se krogec in »Pripravljam …«.
 *
 * Skupna obrazcu in rezultatom — oba gumba nosita isti razred in isti napis,
 * dva zapisa bi se ob prepisu razšla. Krogec je aria-hidden: bralnik zaslona
 * sliši napis, obroč brez besedila bi bil šum. Zakaj se vrti tudi med gradnjo
 * PDF-ja in kaj se zgodi ob zmanjšanem gibanju — styles/buttons.module.css.
 * Da se sploh izriše, preden gradnja zasede glavno nit — lib/nextPaint.ts.
 */
export function BusyLabel() {
  return (
    <>
      <span className={buttonStyles.spinner} aria-hidden="true" />
      {BUSY_LABEL}
    </>
  );
}
