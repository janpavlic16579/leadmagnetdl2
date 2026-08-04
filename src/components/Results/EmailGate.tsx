import { useState } from 'react';
import buttonStyles from '../../styles/buttons.module.css';
import styles from './EmailGate.module.css';

interface EmailGateProps {
  submitted: boolean;
  followUpSequenceDebug?: string;
  onSubmit: (params: { companyName: string; email: string }) => void | Promise<void>;
  onBack: () => void;
}

export function EmailGate({ submitted, followUpSequenceDebug, onSubmit, onBack }: EmailGateProps) {
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);

  const canSubmit = companyName.trim().length > 0 && /\S+@\S+\.\S+/.test(email) && gdprConsent;

  if (submitted) {
    return (
      <div className={styles.wrap}>
        <div className={styles.thanks}>
          <h1 className={styles.thanksTitle}>Hvala!</h1>
          <p className={styles.subtitle}>
            PDF poročilo in CSV/JSON zapis sta se prenesla v vaš prenosni mapi brskalnika.
          </p>
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
      <div className={styles.actions}>
        <button type="button" className={buttonStyles.secondaryButton} onClick={onBack}>
          Nazaj
        </button>
        <button
          type="button"
          className={buttonStyles.primaryButton}
          disabled={!canSubmit}
          onClick={() => onSubmit({ companyName, email })}
        >
          Prenesi PDF
        </button>
      </div>
    </div>
  );
}
