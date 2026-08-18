import { useId, useState } from 'react';
import type {
  BusinessProfile,
  CostAssumption,
  CostQuestion,
  ScaleAssumption,
  ScaleQuestion,
  SegmentContext,
} from '../../config/contexts';
import { useStepHeading } from '../../lib/useStepHeading';
import buttonStyles from '../../styles/buttons.module.css';
import { HelpTip } from './HelpTip';
import { NumberField } from './NumberField';
import helpStyles from './HelpTip.module.css';
import shellStyles from './StepShell.module.css';
import styles from './StepCostBasis.module.css';

interface StepCostBasisProps {
  /** Oznaki in razponi obeh ur — voznikova ura ni operaterjeva. */
  context: SegmentContext;
  profile: BusinessProfile;
  onChange: (profile: BusinessProfile) => void;
  stepLabel: string;
  onNext: () => void;
  onBack: () => void;
}

/**
 * Skupna finančna osnova, vprašana enkrat pred podrobnimi področji.
 *
 * Doslej je vsak modul spraševal za strošek ure posebej — isti podatek trikrat,
 * z možnostjo treh različnih odgovorov. Strošek ure je lastnost podjetja, ne
 * področja.
 *
 * Kdor postavke ne pozna, izbere razpon. Vrednost tedaj ni 0, ampak sredina
 * razpona, rezultat pa dobi nižjo oznako zanesljivosti — ničla bi tiho izničila
 * celotno področje in izgledala kot veljaven izračun.
 */
export function StepCostBasis({
  context,
  profile,
  onChange,
  stepLabel,
  onNext,
  onBack,
}: StepCostBasisProps) {
  const headingRef = useStepHeading();

  return (
    <div className={shellStyles.wrap}>
      <p className={shellStyles.stepLabel}>{stepLabel}</p>
      <h1 className={shellStyles.title} tabIndex={-1} ref={headingRef}>
        Skupna finančna osnova
      </h1>
      <p className={styles.intro}>{context.costBasisIntro}</p>

      <div className={shellStyles.card}>
        <CostField
          question={context.operationalHour}
          value={profile.operationalHour}
          onChange={(operationalHour) => onChange({ ...profile, operationalHour })}
        />
        <CostField
          question={context.adminHour}
          value={profile.adminHour}
          onChange={(adminHour) => onChange({ ...profile, adminHour })}
        />
        {/* Samo dejavnost, ki prodaja ure, pozna zaračunano postavko. */}
        {context.chargeOutRate && (
          <CostField
            question={context.chargeOutRate}
            value={profile.chargeOutRate}
            onChange={(chargeOutRate) => onChange({ ...profile, chargeOutRate })}
          />
        )}
        {/* Prihodek in marža: osnova za vsak odstotek v nadaljevanju vprašalnika. */}
        {context.annualRevenue && (
          <ScaleField
            question={context.annualRevenue}
            value={profile.annualRevenue}
            onChange={(annualRevenue) => onChange({ ...profile, annualRevenue })}
          />
        )}
        {context.contributionMargin && (
          <ScaleField
            question={context.contributionMargin}
            value={profile.contributionMargin}
            onChange={(contributionMargin) => onChange({ ...profile, contributionMargin })}
          />
        )}
        {/* Samo dejavnosti, katerih moduli množijo denar v terjatvah ali zalogah. */}
        {context.capitalCostRate && (
          <ScaleField
            question={context.capitalCostRate}
            value={profile.capitalCostRate}
            onChange={(capitalCostRate) => onChange({ ...profile, capitalCostRate })}
          />
        )}
      </div>

      <p className={styles.note}>
        Če katere od postavk ne poznate, prevzemite povprečje panoge ali izberite razpon. Izračun bo tekel
        naprej, rezultat pa bo označen z nižjo zanesljivostjo — raje to kot navidezno natančen znesek.
      </p>

      <div className={shellStyles.stickyFooter}>
        <div className={shellStyles.stickyFooterInner}>
          <div className={shellStyles.actions}>
            <button type="button" className={buttonStyles.secondaryButton} onClick={onBack}>
              Nazaj
            </button>
            <button type="button" className={buttonStyles.primaryButton} onClick={onNext}>
              Naprej na številke
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FallbackRowProps {
  /**
   * Prevzem povprečja panoge. Odsoten, kadar povprečja ne ponudimo — prihodek ima
   * privzetek 0, ker si prometa ne izmišljamo.
   */
  average?: { label: string; taken: boolean; onToggle: () => void };
  bandsOpen: boolean;
  onToggleBands: () => void;
  bandsId: string;
}

/**
 * Ena tiha vrstica z izhodoma v sili pod vnosnim poljem.
 *
 * Doslej sta bila to dva bloka, oba naslovljena "Ne vem —": gumb s črtkanim
 * okvirjem in skupina štirih radijskih gumbov. Vsako vprašanje je zato ponujalo
 * tri vzporedne načine odgovora hkrati, obiskovalec pa je moral izbrati NAČIN,
 * preden je sploh odgovoril. Zdaj je privzeto vidno samo vnosno polje; kdor
 * številke nima, tu najde oba izhoda, razponi pa se razgrnejo šele na klik.
 */
function FallbackRow({ average, bandsOpen, onToggleBands, bandsId }: FallbackRowProps) {
  return (
    <p className={styles.fallbackRow}>
      {/* Predpona enkrat, ne pri vsakem izhodu posebej. */}
      {average?.taken ? null : <span className={styles.fallbackLead}>Ne veste?</span>}
      {average ? (
        <button
          type="button"
          className={`${styles.fallbackButton} ${average.taken ? styles.fallbackButtonActive : ''}`}
          aria-pressed={average.taken}
          onClick={average.onToggle}
        >
          {average.label}
        </button>
      ) : null}
      {average ? (
        <span className={styles.fallbackSeparator} aria-hidden="true">
          ·
        </span>
      ) : null}
      <button
        type="button"
        className={styles.fallbackButton}
        aria-expanded={bandsOpen}
        aria-controls={bandsId}
        onClick={onToggleBands}
      >
        {bandsOpen ? 'Skrij razpone' : 'Izberi razpon'}
      </button>
    </p>
  );
}

interface CostFieldProps {
  question: CostQuestion;
  value: CostAssumption;
  onChange: (value: CostAssumption) => void;
}

function CostField({ question, value, onChange }: CostFieldProps) {
  const groupId = useId();
  const fromAverage = value.source === 'industryAverage';
  /** Odprto ostane, kadar je razpon že izbran — sicer bi se ob vrnitvi skril odgovor. */
  const [bandsOpen, setBandsOpen] = useState(value.source === 'band');
  /**
   * Povprečje panoge se izpiše v polje, čeprav ni uporabnikov podatek — prav to je
   * namen gumba: številka mora biti vidna tam, kjer jo obiskovalec pričakuje, in
   * popravljiva. Da je naša in ne njegova, pove opomba pod poljem; brez nje bi bila
   * v polju videti kot vnos.
   */
  const shown = value.source === 'entered' || fromAverage ? value.valueEUR : '';

  return (
    <div className={styles.field}>
      <div className={helpStyles.questionRow}>
        <label className={styles.label} htmlFor={`${groupId}-input`}>
          {question.label}
        </label>
        <HelpTip label={question.label} help={question.help} explainer={question.explainer} />
      </div>

      <div className={styles.inputRow}>
        <NumberField
          id={`${groupId}-input`}
          className={styles.input}
          placeholder={`npr. ${question.fallbackEUR}`}
          value={shown === '' || shown === 0 ? null : shown}
          onChange={(valueEUR) =>
            onChange(
              // Ničla je enakovredna praznemu polju: postavka 0 EUR/h bi vsa
              // področja z urami izničila, izračun pa bi tako številko štel med
              // vnesene in rezultat označil z višjo zanesljivostjo, kot si zasluži.
              valueEUR === null || valueEUR === 0
                ? { valueEUR: question.fallbackEUR, estimated: true, source: 'none' }
                : { valueEUR, estimated: false, source: 'entered' },
            )
          }
        />
        <span className={styles.unit}>EUR/h</span>
      </div>

      <FallbackRow
        average={{
          label: fromAverage
            ? `Povprečje panoge — ${question.fallbackEUR} EUR/h`
            : `Vzemi povprečje panoge (${question.fallbackEUR} EUR/h)`,
          taken: fromAverage,
          onToggle: () =>
            onChange(
              fromAverage
                ? { valueEUR: question.fallbackEUR, estimated: true, source: 'none' }
                : { valueEUR: question.fallbackEUR, estimated: true, source: 'industryAverage' },
            ),
        }}
        bandsOpen={bandsOpen}
        onToggleBands={() => setBandsOpen((open) => !open)}
        bandsId={`${groupId}-bands`}
      />

      {fromAverage && (
        <p className={styles.averageNote}>
          Naša ocena za to dejavnost, ne vaš podatek. Izračun bo tekel z razponom te ocene;
          popravite jo, če veste bolje.
        </p>
      )}

      {bandsOpen && (
        <fieldset id={`${groupId}-bands`} className={styles.bands}>
          {/* Skrita, ne odstranjena: predpona je zdaj v vrstici izhodov, skupina
              radijskih gumbov pa mora za bralnik zaslona ohraniti ime. */}
          <legend className={styles.srOnly}>Izberi razpon</legend>
          <div className={styles.bandOptions}>
            {question.bands.map((band) => (
              <label
                key={band.id}
                className={`${styles.band} ${
                  value.source === 'band' && value.bandId === band.id ? styles.bandActive : ''
                }`}
              >
                <input
                  type="radio"
                  name={groupId}
                  checked={value.source === 'band' && value.bandId === band.id}
                  onChange={() =>
                    onChange({
                      valueEUR: band.midpointEUR,
                      estimated: true,
                      source: 'band',
                      bandId: band.id,
                    })
                  }
                />
                <span>{band.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}

interface ScaleFieldProps {
  question: ScaleQuestion;
  value: ScaleAssumption;
  onChange: (value: ScaleAssumption) => void;
}

/**
 * Prihodek in marža. Ista razporeditev kot pri urni postavki (natančen vnos zgoraj,
 * razponi spodaj), a s pretvorbo za deleže: marža se hrani kot ulomek in prikaže kot
 * odstotek — enako pravilo kot pri poljih kind 'percent' v modulih.
 */
function ScaleField({ question, value, onChange }: ScaleFieldProps) {
  const groupId = useId();
  const fromAverage = value.source === 'industryAverage';
  const [bandsOpen, setBandsOpen] = useState(value.source === 'band');

  const toDisplay = (raw: number) => (question.asPercent ? Math.round(raw * 1000) / 10 : raw);
  const fromDisplay = (shown: number) => (question.asPercent ? shown / 100 : shown);

  /**
   * Povprečje panoge ponudimo samo, kadar ga sploh imamo. Prihodek ima privzetek
   * 0 namenoma — prometa si ne izmišljamo — zato tam ostane le razpon.
   */
  const hasIndustryAverage = question.fallback > 0;

  return (
    <div className={styles.field}>
      <div className={helpStyles.questionRow}>
        <label className={styles.label} htmlFor={`${groupId}-input`}>
          {question.label}
        </label>
        <HelpTip label={question.label} help={question.help} explainer={question.explainer} />
      </div>

      <div className={styles.inputRow}>
        <NumberField
          id={`${groupId}-input`}
          className={styles.input}
          placeholder={question.asPercent ? 'npr. 25' : 'npr. 2 000 000'}
          // Odstotek ne more čez 100; prihodek zgornje meje nima, ker je vsaka
          // izmišljena meja lahko nekomu prenizka.
          max={question.asPercent ? 100 : undefined}
          // Prevzeto povprečje se izpiše v polje (kot pri urni postavki), da je
          // številka vidna tam, kjer jo obiskovalec pričakuje, in popravljiva.
          value={
            (value.source === 'entered' || fromAverage) && value.value ? toDisplay(value.value) : null
          }
          onChange={(shown) =>
            onChange(
              shown === null || shown === 0
                ? { value: question.fallback, estimated: true, source: 'none' }
                : { value: fromDisplay(shown), estimated: false, source: 'entered' },
            )
          }
        />
        <span className={styles.unit}>{question.unit}</span>
      </div>

      <FallbackRow
        average={
          hasIndustryAverage
            ? {
                label: fromAverage
                  ? `Povprečje panoge — ${toDisplay(question.fallback)} ${question.unit}`
                  : `Vzemi povprečje panoge (${toDisplay(question.fallback)} ${question.unit})`,
                taken: fromAverage,
                onToggle: () =>
                  onChange(
                    fromAverage
                      ? { value: question.fallback, estimated: true, source: 'none' }
                      : { value: question.fallback, estimated: true, source: 'industryAverage' },
                  ),
              }
            : undefined
        }
        bandsOpen={bandsOpen}
        onToggleBands={() => setBandsOpen((open) => !open)}
        bandsId={`${groupId}-bands`}
      />

      {fromAverage && (
        <p className={styles.averageNote}>
          Naša ocena za to dejavnost, ne vaš podatek. Izračun bo tekel z razponom te ocene;
          popravite jo, če veste bolje.
        </p>
      )}

      {bandsOpen && (
        <fieldset id={`${groupId}-bands`} className={styles.bands}>
          <legend className={styles.srOnly}>Izberi razpon</legend>
          <div className={styles.bandOptions}>
            {question.bands.map((band) => (
              <label
                key={band.id}
                className={`${styles.band} ${
                  value.source === 'band' && value.bandId === band.id ? styles.bandActive : ''
                }`}
              >
                <input
                  type="radio"
                  name={groupId}
                  checked={value.source === 'band' && value.bandId === band.id}
                  onChange={() =>
                    onChange({
                      value: band.midpoint,
                      estimated: true,
                      source: 'band',
                      bandId: band.id,
                    })
                  }
                />
                <span>{band.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}
