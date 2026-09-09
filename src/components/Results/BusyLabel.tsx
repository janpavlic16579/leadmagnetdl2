import buttonStyles from '../../styles/buttons.module.css';

/**
 * Vsebina gumba, ki dela: vrteči se krogec in »Pripravljam …«.
 *
 * Gumb za prenos PDF-ja na rezultatih. Obrazec ima namesto tega napredovalno
 * vrstico z odstotki (DeliveryProgress): oddaja ima faze, prenos pa je en sam
 * dokument in vrstica bi tam ugibala. Krogec je aria-hidden: bralnik zaslona
 * sliši napis, obroč brez besedila bi bil šum. Zakaj se vrti tudi med gradnjo
 * PDF-ja in kaj se zgodi ob zmanjšanem gibanju — styles/buttons.module.css.
 * Da se sploh izriše, preden gradnja zasede glavno nit — lib/nextPaint.ts.
 */
export function BusyLabel() {
  return (
    <>
      <span className={buttonStyles.spinner} aria-hidden="true" />
      Pripravljam …
    </>
  );
}
