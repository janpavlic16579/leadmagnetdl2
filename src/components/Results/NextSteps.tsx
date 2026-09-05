import { SALES_CONTACT } from '../../config/salesContact';
import buttonStyles from '../../styles/buttons.module.css';
import styles from './NextSteps.module.css';

interface NextStepsProps {
  /** Obiskovalec je na obrazcu obkljukal poziv za svetovanje. */
  consultingRequested: boolean;
  /**
   * Prenos priprave za svetovalca. Prikaže se, kadar priprava pripada stranki —
   * brez webhooka, ob neuspeli dostavi ali v internem načinu (?debug=1); glej
   * tabelo v lib/deliverLead.ts. Ob delujočem webhooku ostane skrit.
   */
  onDownloadSalesPdf?: () => void | Promise<void>;
  /** Loči interni pregled od stranke: isti gumb, drugo besedilo nad njim. */
  internalMode?: boolean;
  followUpSequenceDebug?: string;
}

/**
 * Kaj sledi rezultatom.
 *
 * Doslej je to vsebino nosil zahvalni zaslon za obrazcem. Obrazec zdaj stoji
 * PRED rezultati in zahvalnega zaslona ni več — rezultati so zadnji zaslon toka,
 * zato je to edino mesto, kjer obiskovalec izve, kam naprej: kontakt prodaje za
 * tiste, ki na klic nočejo čakati, in (začasno) priprava za svetovalca, dokler
 * do njega nima druge poti.
 */
export function NextSteps({
  consultingRequested,
  onDownloadSalesPdf,
  internalMode = false,
  followUpSequenceDebug,
}: NextStepsProps) {
  return (
    <section className={styles.wrap}>
      {onDownloadSalesPdf ? (
        <div className={styles.block}>
          <p className={styles.note}>
            {internalMode
              ? '[interno] Priprava za svetovalca — ob delujočem webhooku se stranki ne prikaže.'
              : /* Namen je izrecno posredovanje: brez tega bi obiskovalec dobil datoteko,
                   za katero ne ve, čemu služi in kaj naj z njo. */
                'Poleg poročila smo pripravili še povzetek za svetovalca — vaši odgovori na enem mestu. Če nam ga posredujete pred sestankom, vas ne bo spraševal po številkah, ki ste jih pravkar vnesli.'}
          </p>
          <div className={styles.actions}>
            <button type="button" className={buttonStyles.secondaryButton} onClick={onDownloadSalesPdf}>
              Priprava v PDF
            </button>
          </div>
        </div>
      ) : null}

      {/*
        Brez tega kljukica z obrazca izgine brez sledu in obiskovalec ne ve, ali je
        zahtevek sploh štel. Namenoma BREZ obljube klica ali roka: dokler webhook ni
        nastavljen, zahtevek do Datalaba ne pride sam (glej lib/deliverLead.ts).
      */}
      {consultingRequested ? (
        <p className={styles.note}>
          Označili ste, da želite svetovanje — zahtevek je zabeležen med vašimi odgovori.
        </p>
      ) : null}

      {/*
        Ista kartica kot poziv na obrazcu: ista ponudba, zato isti videz. Prikaže
        se VSEM, tudi tistemu, ki je zahtevek že oddal — morda ga ne želi čakati.
      */}
      <div className={styles.contactCard}>
        <h2 className={styles.contactTitle}>Želite se pogovoriti takoj?</h2>
        <p className={styles.contactLead}>
          Pokličite ali pišite našim prodajnim svetovalcem — brez čakanja na klic.
        </p>
        <p className={styles.contactName}>{SALES_CONTACT.label}</p>
        <a className={styles.contactLink} href={SALES_CONTACT.phoneHref}>
          {SALES_CONTACT.phone}
        </a>
        <a className={styles.contactLink} href={`mailto:${SALES_CONTACT.email}`}>
          {SALES_CONTACT.email}
        </a>
      </div>

      {import.meta.env.DEV && followUpSequenceDebug ? (
        <p className={styles.debug}>[dev] follow-up sekvenca: {followUpSequenceDebug}</p>
      ) : null}
    </section>
  );
}
