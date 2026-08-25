import { useId, useRef, useState } from 'react';
import { isFilled, isValidEmail, normalizeTaxNumber, phoneState, taxNumberState } from '../../lib/validation';
import { useStepHeading } from '../../lib/useStepHeading';
import type { LeadConsents, LeadContact } from '../../types';
import type { ResolvedSegmentCopy } from '../../config/copy';
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

/**
 * Prodajni kontakt za tiste, ki na klic nočejo čakati.
 *
 * Telefon je zapisan dvakrat: mednarodno za `tel:` (brskalnik na telefonu predpone
 * ne ugane) in domače za oči.
 */
const SALES_CONTACT = {
  label: 'Datalab prodaja',
  phone: '01 252 89 50',
  phoneHref: 'tel:+38612528950',
  email: 'prodaja@datalab.si',
} as const;

interface EmailGateProps {
  /**
   * Naslov, podnaslov in poziv k svetovanju izbrane dejavnosti.
   *
   * Doslej je bil to edini zaslon toka, ki o obiskovalčevi dejavnosti ni vedel
   * ničesar — in hkrati zaslon, na katerem se odloči, ali bo lead sploh nastal.
   */
  copy: ResolvedSegmentCopy['emailGate'];
  submitted: boolean;
  followUpSequenceDebug?: string;
  /** Privolitve potujejo naprej: poročilo jih hrani kot dokazilo, ne kot okras. */
  onSubmit: (params: {
    contact: LeadContact;
    consents: LeadConsents;
  }) => void | Promise<void>;
  /**
   * Ponovni prenos strankinega poročila.
   *
   * Samodejni prenos bloba ni zanesljiv: iOS Safari ga pogosto odpre v zavihku ali
   * zavrne, brskalniki pa blokirajo prenos brez sveže geste. Brez tega gumba je
   * zahvalni zaslon trdil, da je datoteka v mapi za prenose, in ni ponudil izhoda.
   */
  onDownloadCustomerPdf?: () => void | Promise<void>;
  /**
   * Ponovni prenos priprave za svetovalca.
   *
   * Prikaže se, kadar priprava pristane na napravi — torej v internem načinu
   * (?debug=1) ali dokler webhook ni nastavljen in je posredovanje po stranki
   * edina pot do svetovalca. Ob delujočem webhooku ostane skrita.
   */
  onDownloadSalesPdf?: () => void | Promise<void>;
  /** Loči interni pregled od stranke: ista gumba, drugo besedilo nad njima. */
  internalMode?: boolean;
  /** Vrnitev na rezultate — zahvalni zaslon sicer nima nobene poti naprej ne nazaj. */
  onBackToResults?: () => void;
  onBack: () => void;
}

export function EmailGate({
  copy,
  submitted,
  internalMode = false,
  followUpSequenceDebug,
  onSubmit,
  onDownloadCustomerPdf,
  onDownloadSalesPdf,
  onBackToResults,
  onBack,
}: EmailGateProps) {
  // Zahvala zamenja obrazec znotraj iste inštance, zato je `submitted` ključ:
  // brez njega bi fokus ostal na gumbu, ki je pravkar izginil.
  const headingRef = useStepHeading(submitted);
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
  /** Poziv k dejanju, ne privolitev v drobnem tisku — zato svoj blok pod obrazcem. */
  const [consentConsulting, setConsentConsulting] = useState(false);
  /** Namig se pokaže šele, ko obiskovalec polje zapusti — sicer utripa že pri drugi števki. */
  const [touched, setTouched] = useState<{ phone?: boolean; taxNumber?: boolean }>({});
  /**
   * Napake se pokažejo šele po prvem poskusu oddaje.
   *
   * Rdeč obrazec, preden je uporabnik karkoli vpisal, je grajanje za dejanje, ki
   * se še ni zgodilo. Po prvem poskusu pa napake sledijo vsakemu tipkanju sproti,
   * ker takrat uporabnik popravlja in mora videti, kdaj je popravljeno.
   */
  const [showErrors, setShowErrors] = useState(false);
  /** Generiranje PDF-jev traja; brez tega dvoklik ustvari dva kompleta datotek. */
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const companyNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);

  const phoneInvalid = touched.phone && phoneState(phone) === 'invalid';
  const taxNumberInvalid = touched.taxNumber && taxNumberState(taxNumber) === 'invalid';

  /**
   * Kaj manjka za oddajo — v vrstnem redu polj na zaslonu.
   *
   * Prej je isto vlogo opravljal `canSubmit`, ki je gumb samo ONEMOGOČIL. Kdor je
   * imel tipkarsko napako v e-naslovu ali nepotrjeno privolitev, je videl siv
   * gumb in ugibal, katero od šestih polj ga ustavlja; onemogočen gumb tudi ne
   * pove ničesar bralniku zaslona. Zdaj gumb ostane živ, ob kliku pa pove.
   *
   * Telefon in davčna med njimi nista: sta označena kot neobvezna, zato ju
   * obrazec ne sme zadrževati. Dvom o njiju potuje v poročilo za svetovalca.
   */
  const errors = {
    firstName: isFilled(firstName) ? null : 'Vpišite ime.',
    lastName: isFilled(lastName) ? null : 'Vpišite priimek.',
    companyName: isFilled(companyName) ? null : 'Vpišite ime podjetja.',
    email: isValidEmail(email) ? null : 'Vpišite veljaven e-naslov (npr. ime@podjetje.si).',
    consentProcessing: consentProcessing
      ? null
      : 'Brez te privolitve vam poročila ne smemo poslati.',
  };
  const firstInvalid = (
    [
      [errors.firstName, firstNameRef],
      [errors.lastName, lastNameRef],
      [errors.companyName, companyNameRef],
      [errors.email, emailRef],
      [errors.consentProcessing, consentRef],
    ] as const
  ).find(([error]) => error !== null);

  async function handleSubmit(event: React.FormEvent) {
    // Brez tega privzeta oddaja ponovno naloži SPA in uniči vse module, triažne
    // ocene in odgovore, ki jih je obiskovalec vnašal pet minut. Zaledja ni.
    event.preventDefault();
    // setBusy je asinhron: dva Enterja v istem tiku bi sicer ustvarila dva kompleta.
    if (busy) return;

    if (firstInvalid) {
      setShowErrors(true);
      // Fokus na prvo pomanjkljivo polje: sporočilo pod poljem na dolgem obrazcu
      // lahko ostane zunaj zaslona, kazalec v polju pa pove, kje smo obtičali.
      firstInvalid[1].current?.focus();
      return;
    }

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
        consents: { consentProcessing, consentOffers, consentContent, consentConsulting },
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
          <h1 className={styles.thanksTitle} tabIndex={-1} ref={headingRef}>
            Hvala!
          </h1>
          <p className={styles.subtitle}>
            {/* "Se je preneslo" je trditev, ki je ne moremo preveriti — brskalnik prenos
                pogosto odpre v zavihku ali ga zavrne. Gumb spodaj je zato del stavka. */}
            Poročilo je pripravljeno in bi se moralo prenesti samodejno. Če ga v mapi za prenose ni,
            ga dobite tu:
          </p>
          <div className={styles.actions}>
            {onDownloadCustomerPdf ? (
              <button type="button" className={buttonStyles.primaryButton} onClick={onDownloadCustomerPdf}>
                Prenesi poročilo
              </button>
            ) : null}
            {onBackToResults ? (
              <button type="button" className={buttonStyles.secondaryButton} onClick={onBackToResults}>
                Nazaj na rezultate
              </button>
            ) : null}
          </div>
          {onDownloadSalesPdf ? (
            <>
              <p className={styles.subtitle}>
                {internalMode
                  ? '[interno] Priprava za svetovalca — ob nastavljenem webhooku se ne prikaže in ne prenese.'
                  : /* Namen je izrecno posredovanje: brez tega bi obiskovalec dobil datoteko,
                       za katero ne ve, čemu služi in kaj naj z njo. */
                    'Poleg njega smo pripravili še povzetek za svetovalca — vaši odgovori na enem mestu. Če nam ga posredujete pred sestankom, vas ne bo spraševal po številkah, ki ste jih pravkar vnesli.'}
              </p>
              <div className={styles.actions}>
                <button type="button" className={buttonStyles.secondaryButton} onClick={onDownloadSalesPdf}>
                  Priprava v PDF
                </button>
              </div>
            </>
          ) : null}
          {/*
            Brez tega kljukica na zahvali izgine brez sledu in obiskovalec ne ve, ali je
            zahtevek sploh štel. Namenoma BREZ obljube klica ali roka: dokler webhook ni
            nastavljen, zahtevek do Datalaba ne pride sam (glej lib/deliverLead.ts).
          */}
          {consentConsulting ? (
            <p className={styles.subtitle}>
              Označili ste, da želite svetovanje — zahtevek je zabeležen med vašimi odgovori.
            </p>
          ) : null}
          {/*
            Ista kartica kot poziv na obrazcu: ista ponudba, zato isti videz. Prikaže
            se VSEM, tudi tistemu, ki je zahtevek že oddal — morda ga ne želi čakati.
          */}
          <div className={`${styles.consulting} ${styles.contactCard}`}>
            <h2 className={styles.consultingTitle}>Želite se pogovoriti takoj?</h2>
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
            <p className={styles.consentText}>[dev] follow-up sekvenca: {followUpSequenceDebug}</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title} tabIndex={-1} ref={headingRef}>
        {copy.title}
      </h1>
      {/*
        Podnaslov našteje, kaj dokument vsebuje. Prejšnja različica je končala s
        stavkom, da je izračun na voljo tudi brez tega koraka — resnica, ki jo je
        pošteno povedati, a ne kot zadnjo misel tik pred šestimi polji. Zdaj to
        pove opomba o zasebnosti pod obrazcem, sporočilo tu pa je vrednost.
      */}
      <p className={styles.subtitle}>{copy.subtitle}</p>
      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.card}>
          <div className={styles.nameRow}>
            <div className={styles.formRow}>
              <label className={styles.formLabel} htmlFor={`${fieldId}-firstName`}>
                Ime <span className={styles.required}>*</span>
              </label>
              <input
                id={`${fieldId}-firstName`}
                ref={firstNameRef}
                className={styles.input}
                type="text"
                autoComplete="given-name"
                required
                aria-invalid={showErrors && errors.firstName ? true : undefined}
                aria-describedby={showErrors && errors.firstName ? `${fieldId}-firstName-error` : undefined}
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
              {showErrors && errors.firstName ? (
                <p id={`${fieldId}-firstName-error`} className={styles.error}>
                  {errors.firstName}
                </p>
              ) : null}
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel} htmlFor={`${fieldId}-lastName`}>
                Priimek <span className={styles.required}>*</span>
              </label>
              <input
                id={`${fieldId}-lastName`}
                ref={lastNameRef}
                className={styles.input}
                type="text"
                autoComplete="family-name"
                required
                aria-invalid={showErrors && errors.lastName ? true : undefined}
                aria-describedby={showErrors && errors.lastName ? `${fieldId}-lastName-error` : undefined}
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
              {showErrors && errors.lastName ? (
                <p id={`${fieldId}-lastName-error`} className={styles.error}>
                  {errors.lastName}
                </p>
              ) : null}
            </div>
          </div>

          <div className={styles.formRow}>
            <label className={styles.formLabel} htmlFor={`${fieldId}-companyName`}>
              Ime podjetja <span className={styles.required}>*</span>
            </label>
            <input
              id={`${fieldId}-companyName`}
              ref={companyNameRef}
              className={styles.input}
              type="text"
              autoComplete="organization"
              required
              aria-invalid={showErrors && errors.companyName ? true : undefined}
              aria-describedby={showErrors && errors.companyName ? `${fieldId}-companyName-error` : undefined}
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
            />
            {showErrors && errors.companyName ? (
              <p id={`${fieldId}-companyName-error`} className={styles.error}>
                {errors.companyName}
              </p>
            ) : null}
          </div>

          <div className={styles.formRow}>
            <label className={styles.formLabel} htmlFor={`${fieldId}-email`}>
              E-naslov <span className={styles.required}>*</span>
            </label>
            <input
              id={`${fieldId}-email`}
              ref={emailRef}
              className={styles.input}
              type="email"
              autoComplete="email"
              required
              aria-invalid={showErrors && errors.email ? true : undefined}
              aria-describedby={showErrors && errors.email ? `${fieldId}-email-error` : undefined}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            {showErrors && errors.email ? (
              <p id={`${fieldId}-email-error`} className={styles.error}>
                {errors.email}
              </p>
            ) : null}
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
              placeholder="npr. 12345679"
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
                ref={consentRef}
                required
                aria-invalid={showErrors && errors.consentProcessing ? true : undefined}
                aria-describedby={
                  showErrors && errors.consentProcessing ? `${fieldId}-consent-error` : undefined
                }
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
            {showErrors && errors.consentProcessing ? (
              <p id={`${fieldId}-consent-error`} className={styles.error}>
                {errors.consentProcessing}
              </p>
            ) : null}

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

        {/*
          Poziv k dejanju stopi IZ obrazčeve kartice ven: po petih poljih in treh privolitvah
          je obarvano ozadje z znamčno obrobo edino, kar še pritegne pogled. Ostane pa znotraj
          <form>, sicer kljukica ni del oddaje.

          Naslov je <h2> in ne <legend>: legenda prekine obrobo okvirja, obroba pa je tu ves
          smisel. Besedilo ob kljukici je samostojno razumljivo ("Da, želim …"), zato naslov
          ni njena edina razlaga — pojasnilo je nanjo pripeto z aria-describedby.
        */}
        <div className={styles.consulting}>
          <h2 className={styles.consultingTitle}>{copy.consultingTitle}</h2>
          <label className={styles.consultingRow}>
            <input
              type="checkbox"
              aria-describedby={`${fieldId}-consulting-note`}
              checked={consentConsulting}
              onChange={(event) => setConsentConsulting(event.target.checked)}
            />
            <span className={styles.consultingLabel}>
              Da, želim brezplačen posvet — kontaktirajte me.
            </span>
          </label>
          <p id={`${fieldId}-consulting-note`} className={styles.consultingNote}>
            {copy.consultingNote}
          </p>
          {/* Vabilo in ne pogoj: telefon in davčna oddaje nikoli ne ustavita. */}
          {consentConsulting && !isFilled(phone) ? (
            <p className={styles.consultingHint}>
              Pustite tudi telefonsko številko — svetovalec vas doseže hitreje.
            </p>
          ) : null}
        </div>

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
          {/* Ni več `disabled`: gumb, ki molči, je bil edini znak, da nekaj manjka. */}
          <button type="submit" className={buttonStyles.primaryButton} disabled={busy}>
            {busy ? 'Pripravljam …' : 'Prenesi poročilo'}
          </button>
        </div>
      </form>
    </div>
  );
}
