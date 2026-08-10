import { useId, useState } from 'react';
import { isFilled, isValidEmail, normalizeTaxNumber, phoneState, taxNumberState } from '../../lib/validation';
import type { LeadConsents, LeadContact } from '../../types';
import buttonStyles from '../../styles/buttons.module.css';
import styles from './EmailGate.module.css';

/**
 * Pravilnik o zasebnosti, na katerega se sklicuje obvezna privolitev.
 *
 * Prazen niz = URL še ni znan; povezava se tedaj ne izriše, stavek pa ostane cel.
 * Ko ga marketing pošlje, mora biti ABSOLUTEN — aplikacija teče na podpoti
 * /leadmagnetdl/, zato bi se relativna povezava razrešila znotraj nje.
 */
const PRIVACY_POLICY_URL = '';

interface EmailGateProps {
  submitted: boolean;
  followUpSequenceDebug?: string;
  /** Privolitve potujejo naprej: poročilo jih hrani kot dokazilo, ne kot okras. */
  onSubmit: (params: {
    contact: LeadContact;
    consents: LeadConsents;
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
  const fieldId = useId();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  /** Telefon in davčna se hranita SUROVA — normalizacija med tipkanjem premakne kazalec. */
  const [phone, setPhone] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [consentProcessing, setConsentProcessing] = useState(false);
  const [consentOffers, setConsentOffers] = useState(false);
  const [consentContent, setConsentContent] = useState(false);
  /** Namig se pokaže šele, ko obiskovalec polje zapusti — sicer utripa že pri drugi števki. */
  const [touched, setTouched] = useState<{ phone?: boolean; taxNumber?: boolean }>({});
  /** Generiranje PDF-jev traja; brez tega dvoklik ustvari dva kompleta datotek. */
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const phoneInvalid = touched.phone && phoneState(phone) === 'invalid';
  const taxNumberInvalid = touched.taxNumber && taxNumberState(taxNumber) === 'invalid';

  /**
   * Telefon in davčna oddaje NE blokirata. Sta označena kot neobvezna, zato bi bil
   * mrtev gumb za obiskovalca napaka — in nevidna, ker onemogočen gumb ne pove,
   * katero polje ga ustavlja. Dvom namesto tega potuje v poročilo za svetovalca.
   */
  const canSubmit =
    isFilled(firstName) &&
    isFilled(lastName) &&
    isFilled(companyName) &&
    isValidEmail(email) &&
    consentProcessing;

  async function handleSubmit(event: React.FormEvent) {
    // Brez tega privzeta oddaja ponovno naloži SPA in uniči vse module, triažne
    // ocene in odgovore, ki jih je obiskovalec vnašal pet minut. Zaledja ni.
    event.preventDefault();
    // setBusy je asinhron: dva Enterja v istem tiku bi sicer ustvarila dva kompleta.
    if (busy || !canSubmit) return;

    setBusy(true);
    setFailed(false);
    try {
      await onSubmit({
        contact: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          companyName: companyName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          // Normalizacija natanko enkrat, ob oddaji.
          taxNumber: normalizeTaxNumber(taxNumber),
        },
        consents: { consentProcessing, consentOffers, consentContent },
      });
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
      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.card}>
          <div className={styles.nameRow}>
            <div className={styles.formRow}>
              <label className={styles.formLabel} htmlFor={`${fieldId}-firstName`}>
                Ime <span className={styles.required}>*</span>
              </label>
              <input
                id={`${fieldId}-firstName`}
                className={styles.input}
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel} htmlFor={`${fieldId}-lastName`}>
                Priimek <span className={styles.required}>*</span>
              </label>
              <input
                id={`${fieldId}-lastName`}
                className={styles.input}
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <label className={styles.formLabel} htmlFor={`${fieldId}-companyName`}>
              Ime podjetja <span className={styles.required}>*</span>
            </label>
            <input
              id={`${fieldId}-companyName`}
              className={styles.input}
              type="text"
              autoComplete="organization"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
            />
          </div>

          <div className={styles.formRow}>
            <label className={styles.formLabel} htmlFor={`${fieldId}-email`}>
              E-naslov <span className={styles.required}>*</span>
            </label>
            <input
              id={`${fieldId}-email`}
              className={styles.input}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className={styles.formRow}>
            <label className={styles.formLabel} htmlFor={`${fieldId}-phone`}>
              Telefonska številka <span className={styles.optional}>(neobvezno)</span>
            </label>
            <input
              id={`${fieldId}-phone`}
              className={styles.input}
              type="tel"
              autoComplete="tel"
              value={phone}
              aria-invalid={phoneInvalid || undefined}
              aria-describedby={phoneInvalid ? `${fieldId}-phone-hint` : undefined}
              onChange={(event) => setPhone(event.target.value)}
              onBlur={() => setTouched((state) => ({ ...state, phone: true }))}
            />
            {phoneInvalid ? (
              <p id={`${fieldId}-phone-hint`} className={styles.hint}>
                Videti je, da številka ni popolna. Oddaje to ne ustavi.
              </p>
            ) : null}
          </div>

          <div className={styles.formRow}>
            <label className={styles.formLabel} htmlFor={`${fieldId}-taxNumber`}>
              Davčna številka <span className={styles.optional}>(neobvezno)</span>
            </label>
            {/* type="text" in ne "number": slednji odreže predpono SI in doda vrtavko. */}
            <input
              id={`${fieldId}-taxNumber`}
              className={styles.input}
              type="text"
              inputMode="numeric"
              placeholder="npr. SI12345679"
              value={taxNumber}
              aria-invalid={taxNumberInvalid || undefined}
              aria-describedby={taxNumberInvalid ? `${fieldId}-tax-hint` : undefined}
              onChange={(event) => setTaxNumber(event.target.value)}
              onBlur={() => setTouched((state) => ({ ...state, taxNumber: true }))}
            />
            {taxNumberInvalid ? (
              <p id={`${fieldId}-tax-hint`} className={styles.hint}>
                Videti je, da davčna ni veljavna (osem števk). Oddaje to ne ustavi.
              </p>
            ) : null}
          </div>

          <fieldset className={styles.consentGroup}>
            <legend className={styles.consentLegend}>Privolitve</legend>

            <label className={styles.consentRow}>
              <input
                type="checkbox"
                checked={consentProcessing}
                onChange={(event) => setConsentProcessing(event.target.checked)}
              />
              <span className={styles.consentText}>
                Dovoljujem, da Datalab SI d.o.o. in Datalab d.d. moje osebne podatke do preklica hranita in
                obdelujeta za namene, podrobno opisane{' '}
                {PRIVACY_POLICY_URL ? (
                  <a href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer">
                    tukaj
                  </a>
                ) : (
                  'v pravilniku o zasebnosti'
                )}
                , ki vključujejo spremljanje mojih aktivnosti na spletni strani ter mojih zanimanj z namenom
                oblikovanja personaliziranih vsebin in ponudb. <span className={styles.required}>*</span>
              </span>
            </label>

            {/* Neobvezni privolitvi sta ločeni: razlika ne sme biti samo v zvezdici. */}
            <div className={styles.consentOptional}>
              <label className={styles.consentRow}>
                <input
                  type="checkbox"
                  checked={consentOffers}
                  onChange={(event) => setConsentOffers(event.target.checked)}
                />
                <span className={styles.consentText}>
                  Dovoljujem, da me obveščate o prilagojenih ponudbah glede programa PANTHEON.
                </span>
              </label>

              <label className={styles.consentRow}>
                <input
                  type="checkbox"
                  checked={consentContent}
                  onChange={(event) => setConsentContent(event.target.checked)}
                />
                <span className={styles.consentText}>
                  Dovoljujem, da se moje osebne podatke uporabi za namene obveščanja o podjetniških vsebinah in
                  dogodkih — PANTHEON baza znanja.
                </span>
              </label>
            </div>
          </fieldset>
        </div>

        {/* Ob onemogočenem gumbu je to edini način, da obiskovalec ugotovi, kaj manjka. */}
        <p className={styles.requiredNote}>
          <span className={styles.required}>*</span> obvezno polje
        </p>

        {failed ? (
          <p className={styles.consentText} role="alert">
            Priprave datotek ni bilo mogoče dokončati. Poskusite znova — vneseni podatki ostanejo.
          </p>
        ) : null}

        <div className={styles.actions}>
          {/* Ostane "button": privzeti gumb obrazca bi ob Enterju navigiral nazaj. */}
          <button type="button" className={buttonStyles.secondaryButton} onClick={onBack} disabled={busy}>
            Nazaj
          </button>
          <button type="submit" className={buttonStyles.primaryButton} disabled={!canSubmit || busy}>
            {busy ? 'Pripravljam …' : 'Prenesi poročilo'}
          </button>
        </div>
      </form>
    </div>
  );
}
