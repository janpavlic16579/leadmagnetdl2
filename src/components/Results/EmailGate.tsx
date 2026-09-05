import { useId, useRef, useState } from 'react';
import { track } from '../../lib/analytics';
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
 * Napis gumba za oddajo. Ena konstanta, ker ga navaja tudi povzetek zadržkov
 * ("Nato znova kliknite …") — dva zapisa bi se ob prepisu razšla.
 *
 * "Pokaži rezultate" in ne "Prenesi poročilo": ob oddaji se ne prenese nič,
 * poročilo prenese gumb na rezultatih (zakaj — lib/deliverLead.ts).
 */
const SUBMIT_LABEL = 'Pokaži rezultate';

/**
 * Prodajni kontakt za tiste, ki na klic nočejo čakati — skupni zapis, isti kot
 * na zadnji strani strankinega PDF-ja (config/salesContact.ts).
 */
import { SALES_CONTACT } from '../../config/salesContact';

interface EmailGateProps {
  /**
   * Naslov, podnaslov in poziv k svetovanju izbrane dejavnosti.
   *
   * Doslej je bil to edini zaslon toka, ki o obiskovalčevi dejavnosti ni vedel
   * ničesar — in hkrati zaslon, na katerem se odloči, ali bo lead sploh nastal.
   */
  copy: ResolvedSegmentCopy['emailGate'];
  /** Obrazec je oštevilčen korak med vnosi in rezultati — kot vsi drugi nosi "Korak N od M". */
  stepLabel: string;
  /**
   * Privolitve potujejo naprej: poročilo jih hrani kot dokazilo, ne kot okras.
   * Ko se obljuba razreši, starš zamenja zaslon z rezultati — obrazec sam zahvale
   * ne kaže in ničesar ne prenaša (lib/deliverLead.ts pove, zakaj).
   */
  onSubmit: (params: {
    contact: LeadContact;
    consents: LeadConsents;
  }) => void | Promise<void>;
  /** Nazaj na zadnjo stran vnosov. */
  onBack: () => void;
}

/**
 * Obrazec PRED rezultati.
 *
 * Nekoč je stal za njimi in nosil še zahvalni zaslon s prenosi; zdaj je čisti
 * vmesni korak: kontakt in privolitve, ob oddaji pa lead odide k Datalabu in
 * obiskovalec pristane na rezultatih. Kar je sledilo zahvali (kontakt prodaje,
 * priprava za svetovalca), živi v Results/NextSteps.tsx.
 */
export function EmailGate({ copy, stepLabel, onSubmit, onBack }: EmailGateProps) {
  const headingRef = useStepHeading();
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
  /** Oddaja čaka na webhook; brez tega dvoklik odda isti lead dvakrat. */
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
      : // "Brez TE privolitve" je delovalo samo pod kljukico. V povzetku nad gumbom
        // kazalni zaimek nima na kaj kazati, zato poved privolitev poimenuje.
        'Brez privolitve za obdelavo podatkov vam rezultata in poročila ne smemo pripraviti.',
  };
  /**
   * Ista tabela nosi dvoje: kam skoči fokus (prva vrstica z napako) in kaj našteje
   * povzetek nad gumbom (vse vrstice z napako).
   *
   * Dva ločena seznama bi se ob prvem dodanem polju razšla — in razšla bi se prav
   * v najbolj zavajajočo smer: fokus bi skočil v eno polje, povzetek pa bi govoril
   * o drugem.
   */
  const requiredFields = [
    ['firstName', errors.firstName, firstNameRef],
    ['lastName', errors.lastName, lastNameRef],
    ['companyName', errors.companyName, companyNameRef],
    ['email', errors.email, emailRef],
    ['consentProcessing', errors.consentProcessing, consentRef],
  ] as const;
  // Ostane .find() in ne blocking[0]: brez noUncheckedIndexedAccess bi se indeks
  // tipiziral kot ne-opcijski in tiho oslabil stražo `if (firstInvalid)` spodaj.
  const firstInvalid = requiredFields.find(([, error]) => error !== null);
  /** Vse, kar ustavlja oddajo — v vrstnem redu polj na zaslonu. */
  const blocking = requiredFields.filter(([, error]) => error !== null);
  /** Povzetek se pokaže po istem pravilu kot napake pod polji (glej showErrors). */
  const showBlockedSummary = showErrors && blocking.length > 0;
  const alertId = `${fieldId}-submit-alert`;

  async function handleSubmit(event: React.FormEvent) {
    // Brez tega privzeta oddaja ponovno naloži SPA in uniči vse module, triažne
    // ocene in odgovore, ki jih je obiskovalec vnašal pet minut. Zaledja ni.
    event.preventDefault();
    // setBusy je asinhron: dva Enterja v istem tiku bi sicer ustvarila dva kompleta.
    if (busy) return;

    if (firstInvalid) {
      setShowErrors(true);
      // Nov zadržan poskus prekrije staro napako priprave: dve rdeči ploskvi z
      // različnima razlogoma hkrati sta ugibanje, ne pojasnilo.
      setFailed(false);
      // Katero polje ustavi največ ljudi — ime polja in nič vsebine.
      track('lm10_form_blocked', { field: firstInvalid[0] });
      // Fokus ostane na PRVEM pomanjkljivem polju in ne skoči na povzetek nad
      // gumbom: povzetek stoji na dnu obrazca, popravlja pa se gor. Fokus na dnu
      // bi pomenil, da se obiskovalec do polja prebija s shift-tabom nazaj skozi
      // kartico svetovanja in tri privolitve. Povzetek pove, fokus pelje.
      firstInvalid[2].current?.focus();
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
      // Prej je napaka pustila obiskovalca na obrazcu brez pojasnila: rezultati
      // se niso prikazali, gumb pa je izgledal, kot da ni bil pritisnjen.
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.stepLabel}>{stepLabel}</p>
      <h1 className={styles.title} tabIndex={-1} ref={headingRef}>
        {copy.title}
      </h1>
      {/*
        Podnaslov pove, kaj sledi oddaji: izračun na zaslonu in PDF poročilo.
        Obrazec stoji PRED rezultatom, zato stavka "izračun je na voljo tudi brez
        tega koraka" ni več nikjer — ne tu ne na uvodu (SHARED_COPY.landingOffer);
        obljuba, ki je ne držimo, je slabša od poštene prošnje za kontakt.
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
              className={`${styles.input} ${styles.softInvalid}`}
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
              className={`${styles.input} ${styles.softInvalid}`}
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

        {/*
          Zakaj TU in ne na vrhu obrazca: ob kliku sta pogled in kazalec na gumbu.
          Sporočilo na vrhu je na telefonu pet zaslonov stran, na visokem namizju pa
          nad pregibom — obiskovalec ga ne vidi in sklepa, da gumb ne dela. Prav to
          je bila pritožba. Blok hkrati potisne gumb navzdol; premik pod kazalcem je
          sam po sebi znak, da se je nekaj zgodilo.

          Naštejemo VSE, kar manjka, in ne le prvega: prikaz po enem bi ponovil
          natanko tisto, zaradi česar je bil onemogočen gumb odstranjen — za vsako
          naslednjo oviro bi bilo treba znova klikniti.

          role="status" in ne role="alert": fokus se v isti sapi premakne v polje in
          bralnik zaslona takrat prebere njegovo ime in napako. Vsiljivo območje bi to
          napoved prekinilo ali bi bilo prekinjeno; vljudno se uvrsti za njo. Isti
          prijem kot pri zadržanem koraku v StepEmployeeCount.tsx.

          Napake POD polji namenoma nimajo vloge: pet hkratnih obvestil je šum, ne
          pomoč. Bralnik jih dobi prek aria-describedby, ko pride do polja.

          Veji sta izključujoči in imata RAZLIČEN key: brez njega bi React isto
          vozlišče uporabil znova in mu le zamenjal vlogo in vsebino — živo območje,
          ki se ne premontira, se pogosto ne oglasi.
        */}
        {showBlockedSummary ? (
          <div key="blocked" id={alertId} className={styles.blocked} role="status">
            <p className={styles.blockedTitle}>Rezultatov še ne moremo pokazati.</p>
            {/* Brez števila manjkajočih: slovenska dvojina bi terjala tri različice. */}
            <p className={styles.blockedNote}>Rezultat in poročilo odklenemo takoj, ko dopolnite naslednje:</p>
            <ul className={styles.blockedList}>
              {/*
                Besedila so ISTA kot pod polji in ne skrajšana različica: dve
                formulaciji istega pravila bi obiskovalec bral kot dve zahtevi.
              */}
              {blocking.map(([field, error]) => (
                <li key={field}>{error}</li>
              ))}
            </ul>
            <p className={styles.blockedNote}>Nato znova kliknite »{SUBMIT_LABEL}«.</p>
          </div>
        ) : failed ? (
          /*
            Prej je isto sporočilo nosil .consentText — sivo, drobno, najtišje besedilo
            na strani, čeprav je edino, ki pove, da oddaja res ni uspela. Zdaj ista
            ploskev kot zadržana oddaja, ker je za obiskovalca isti trenutek: kliknil
            je in rezultatov ni. Odpove lahko le nalaganje kode za dostavo — napake
            webhooka in prodajnega dela deliverLead pogoltne sam. Telefon je izhod v
            sili — brez njega ta pot nikamor ne pelje, saj zaledja ni.

            role="alert" ostane: nič ne premika fokusa, zato se napoved nima s čim
            zaleteti, napaka pa je nepričakovana in ne posledica obiskovalčevega dejanja.
          */
          <div key="failed" id={alertId} className={styles.blocked} role="alert">
            <p className={styles.blockedTitle}>Oddaja ni uspela.</p>
            <p className={styles.blockedNote}>
              Poskusite znova — vneseni podatki ostanejo. Če se ponovi, nas pokličite na{' '}
              <a className={styles.blockedLink} href={SALES_CONTACT.phoneHref}>
                {SALES_CONTACT.phone}
              </a>
              .
            </p>
          </div>
        ) : null}

        <div className={styles.actions}>
          {/* Ostane "button": privzeti gumb obrazca bi ob Enterju navigiral nazaj. */}
          <button type="button" className={buttonStyles.secondaryButton} onClick={onBack} disabled={busy}>
            Nazaj
          </button>
          {/*
            Ni več `disabled`: gumb, ki molči, je bil edini znak, da nekaj manjka.
            aria-describedby poskrbi, da tudi tisti, ki se na gumb VRNE s tabulatorjem,
            sliši razlog — sicer bi mu bralnik prebral samo ime gumba, torej isto kot
            pred klikom, in gumb bi bil "pokvarjen" tudi zanj.
          */}
          <button
            type="submit"
            className={buttonStyles.primaryButton}
            disabled={busy}
            aria-describedby={showBlockedSummary || failed ? alertId : undefined}
          >
            {busy ? 'Pripravljam …' : SUBMIT_LABEL}
          </button>
        </div>
      </form>
    </div>
  );
}
