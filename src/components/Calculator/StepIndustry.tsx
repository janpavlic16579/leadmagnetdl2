import {
  DRUGO_ID,
  DRUGO_SUB_INDUSTRIES,
  INDUSTRIES,
  SUB_INDUSTRY_QUESTION,
  findSubIndustry,
  industryChoiceLabel,
} from '../../config/industries';
import type { BasicInfo } from '../../types';
import buttonStyles from '../../styles/buttons.module.css';
import shellStyles from './StepShell.module.css';
import styles from './StepIndustry.module.css';

interface StepIndustryProps {
  value: BasicInfo;
  onChange: (value: BasicInfo) => void;
  onNext: () => void;
}

/**
 * Uvodni korak, enak za vse obiskovalce — iz dejavnosti se izpelje segment in s
 * tem celoten nadaljnji vprašalnik. Zato je oznaka fiksna in ne prihaja iz
 * segmentne konfiguracije: segmenta ob tem vprašanju še ne poznamo.
 *
 * Ta zaslon namenoma nima oznake koraka: je prvi vtis, ne del števca.
 *
 * "Drugo" ni sam po sebi izbira, ampak vrata do podvprašanja o poslovnem modelu.
 * Razlog je merljiv: gradbinec in agencija sta storitveno-projektni podjetji, a
 * v seznamu ne najdeta svoje PANOGE in zato izbereta "Drugo" — s tem pa zgubita
 * panožno prilagojen vprašalnik, ki bi jima ustrezal. Seznama panog ni mogoče
 * dopolniti do popolnosti, poslovnih modelov pa je malo.
 */
const INDUSTRY_QUESTION = 'S čim se ukvarja vaše podjetje?';

export function StepIndustry({ value, onChange, onNext }: StepIndustryProps) {
  /**
   * Ko je izbrana pod-dejavnost, hrani basicInfo njen id (npr. 'drugo_storitve'),
   * spustni seznam pa mora še naprej kazati "Drugo" — sicer bi izbira izginila,
   * ker id pod-dejavnosti med možnostmi seznama ne obstaja.
   */
  const selectedSubIndustry = findSubIndustry(value.industry);
  const selectValue = selectedSubIndustry ? DRUGO_ID : value.industry;
  const showSubQuestion = selectValue === DRUGO_ID;

  // Sam 'drugo' ni odgovor: brez podizbire ne vemo, kateri vprašalnik pokazati.
  const canProceed = value.industry.length > 0 && value.industry !== DRUGO_ID;

  return (
    <div className={shellStyles.wrap}>
      <h1 className={shellStyles.introTitle}>Koliko vas stane sedanji način dela?</h1>
      {/*
       * Ocena trajanja mora držati. Prej je pisalo "v dveh minutah": že sam korak
       * triaže traja dlje, obiskovalec pa takrat še ni pri nobeni številki. Obljuba,
       * ki se podre na koraku 6, stane več kot poštena — takrat je vloženih že
       * osem minut in opustitev je najdražja možna.
       */}
      <p className={shellStyles.introSubtitle}>
        Odgovorite na nekaj vprašanj o svojem poslovanju in dobite razčlenjen izračun letnih skritih
        stroškov — brez vnosa e-naslova. Sami izberete, katera področja vas najbolj tiščijo; za
        priporočena tri vzame okoli deset minut.
      </p>

      <div className={shellStyles.card}>
        <div className={shellStyles.formRow}>
          <label className={shellStyles.formLabel} htmlFor="industry">
            {INDUSTRY_QUESTION}
          </label>
          <select
            id="industry"
            className={shellStyles.select}
            value={selectValue}
            onChange={(event) => onChange({ ...value, industry: event.target.value })}
          >
            <option value="">Izberite …</option>
            {/* industryChoiceLabel in ne industry.label: `choiceLabel` je bil doslej
                izrisan samo pri pod-dejavnostih, v glavnem seznamu pa se ni uporabil
                nikjer — daljša, razločevalna oznaka ("Trgovina … prodajamo podjetjem")
                torej ni imela nobenega učinka. `label` ostane oznaka za CRM. */}
            {INDUSTRIES.map((industry) => (
              <option key={industry.id} value={industry.id}>
                {industryChoiceLabel(industry)}
              </option>
            ))}
          </select>
        </div>

        {showSubQuestion ? (
          <fieldset className={styles.subQuestion}>
            <legend className={styles.subLegend}>{SUB_INDUSTRY_QUESTION}</legend>
            <p className={styles.subHelp}>
              Panoge morda ni na seznamu, način dela pa je skoraj vedno eden od spodnjih — po njem
              izberemo vprašanja, ki merijo vaše stroške in ne tujih.
            </p>
            <div className={styles.subOptions}>
              {DRUGO_SUB_INDUSTRIES.map((option) => (
                <label
                  key={option.id}
                  className={`${styles.subOption} ${
                    value.industry === option.id ? styles.subOptionActive : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="sub-industry"
                    checked={value.industry === option.id}
                    onChange={() => onChange({ ...value, industry: option.id })}
                  />
                  <span>{industryChoiceLabel(option)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}
      </div>

      <p className={shellStyles.trustNote}>
        Ves izračun poteka v vašem brskalniku. Nič od vnesenih podatkov ne zapusti brskalnika, dokler se sami ne
        odločite oddati obrazca za PDF poročilo.
      </p>

      <div className={shellStyles.stickyFooter}>
        <div className={shellStyles.stickyFooterInner}>
          <div className={`${shellStyles.actions} ${shellStyles.actionsEnd}`}>
            <button type="button" className={buttonStyles.primaryButton} disabled={!canProceed} onClick={onNext}>
              Naprej
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
