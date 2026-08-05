import { useState } from 'react';
import buttonStyles from '../../styles/buttons.module.css';
import styles from './EmailGate.module.css';

interface EmailGateProps {
  submitted: boolean;
  followUpSequenceDebug?: string;
  /** Privolitev potuje naprej: izvozni zapis jo hrani kot dokazilo, ne kot okras. */
  onSubmit: (params: {
    companyName: string;
    email: string;
    gdprConsent: boolean;
  }) => void | Promise<void>;
  /**
   * Ponovni prenos priprave za svetovalca.
   *
   * Brskalniki blokirajo več zaporednih prenosov iz enega klika, zato se samodejni
   * prenos ne sme šteti za zanesljivega. Vsak gumb tu je svoja uporabnikova gesta,
   * ki je ne blokira nič — in hkrati zavestna odločitev, da datoteko posreduje naprej.
   */
  onDownloadSalesPdf?: () => void | Promise<void>;
  onDownloadSalesHtml?: () => void | Promise<void>;
  onBack: () => void;
}

export function EmailGate({
  submitted,
  followUpSequenceDebug,
  onSubmit,
  onDownloadSalesPdf,
  onDownloadSalesHtml,
  onBack,
}: EmailGateProps) {
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  /** Generiranje PDF-jev traja; brez tega dvoklik ustvari dva kompleta datotek. */
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const canSubmit = companyName.trim().length > 0 && /\S+@\S+\.\S+/.test(email) && gdprConsent;

  async function handleSubmit() {
    setBusy(true);
    setFailed(false);
    try {
      await onSubmit({ companyName, email, gdprConsent });
    } catch {
      // Prej je napaka pustila obiskovalca na obrazcu brez pojasnila: zahvalni
      // zaslon se ni prikazal, gumb pa je izgledal, kot da ni bil pritisnjen.
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <div className={styles.wrap}>
        <div className={styles.thanks}>
          <h1 className={styles.thanksTitle}>Hvala!</h1>
          <p className={styles.subtitle}>
            Vaše poročilo se je preneslo v mapo za prenose.
          </p>
          {onDownloadSalesPdf || onDownloadSalesHtml ? (
            <>
              <p className={styles.subtitle}>
                Poleg njega smo pripravili še povzetek za svetovalca — vaši odgovori na enem mestu.
                Če nam ga posredujete pred sestankom, vas ne bo spraševal po številkah, ki ste jih
                pravkar vnesli. Če ga brskalnik ni prenesel skupaj s poročilom, ga dobite tu:
              </p>
              <div className={styles.actions}>
                {onDownloadSalesPdf ? (
                  <button type="button" className={buttonStyles.secondaryButton} onClick={onDownloadSalesPdf}>
                    Povzetek v PDF
                  </button>
                ) : null}
                {onDownloadSalesHtml ? (
                  <button type="button" className={buttonStyles.secondaryButton} onClick={onDownloadSalesHtml}>
                    Povzetek v HTML
                  </button>
                ) : null}
              </div>
            </>
          ) : null}
          {import.meta.env.DEV && followUpSequenceDebug ? (
            <p className={styles.consentText}>[dev] follow-up sekvenca: {followUpSequenceDebug}</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Razširjen rezultat</h1>
      <p className={styles.subtitle}>
        Vnesite e-naslov za PDF poročilo (primerno za posredovanje upravi) in akcijski načrt "3 ukrepi ta teden".
        Osnovni izračun ostane na voljo brez tega koraka.
      </p>
      <div className={styles.card}>
        <div className={styles.formRow}>
          <label className={styles.formLabel} htmlFor="companyName">
            Ime podjetja
          </label>
          <input
            id="companyName"
            className={styles.input}
            type="text"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
          />
        </div>
        <div className={styles.formRow}>
          <label className={styles.formLabel} htmlFor="email">
            E-naslov
          </label>
          <input
            id="email"
            className={styles.input}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <label className={styles.consentRow}>
          <input type="checkbox" checked={gdprConsent} onChange={(event) => setGdprConsent(event.target.checked)} />
          <span className={styles.consentText}>
            Strinjam se, da Datalab uporabi zgoraj navedene podatke za pripravo in pošiljanje tega poročila ter
            sorodnih vsebin (GDPR privolitev). Privolitev lahko kadar koli prekličem.
          </span>
        </label>
      </div>
      {failed ? (
        <p className={styles.consentText} role="alert">
          Priprave datotek ni bilo mogoče dokončati. Poskusite znova — vneseni podatki ostanejo.
        </p>
      ) : null}
      <div className={styles.actions}>
        <button type="button" className={buttonStyles.secondaryButton} onClick={onBack} disabled={busy}>
          Nazaj
        </button>
        <button
          type="button"
          className={buttonStyles.primaryButton}
          disabled={!canSubmit || busy}
          onClick={handleSubmit}
        >
          {busy ? 'Pripravljam …' : 'Prenesi poročilo'}
        </button>
      </div>
    </div>
  );
}
