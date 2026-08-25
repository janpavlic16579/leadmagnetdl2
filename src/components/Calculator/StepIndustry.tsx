import { useState } from 'react';
import {
  DRUGO_ID,
  DRUGO_SUB_INDUSTRIES,
  INDUSTRIES,
  SUB_INDUSTRY_QUESTION,
  findSubIndustry,
  getSegmentForIndustry,
  industryChoiceLabel,
  isCompleteIndustryChoice,
} from '../../config/industries';
import { SHARED_COPY, type ResolvedSegmentCopy } from '../../config/copy';
import type { BasicInfo } from '../../types';
import { useStepHeading } from '../../lib/useStepHeading';
import buttonStyles from '../../styles/buttons.module.css';
import shellStyles from './StepShell.module.css';
import styles from './StepIndustry.module.css';

interface StepIndustryProps {
  value: BasicInfo;
  /**
   * Nagovor uvodnega zaslona. Korak ga ne izpelje sam: segmenta ob tem vprašanju
   * še ne pozna in ga tudi ne sme — dokler ni izbrana dejavnost, je nevtralni
   * nagovor edini pošten. Izbiro opravi CalculatorFlow.
   */
  hero: ResolvedSegmentCopy['landing'];
  /**
   * Ali obstajajo odgovori, ki bi jih menjava vprašalnika zavrgla. Krmili
   * opozorilo; brisanje samo opravi klicatelj, in sicer šele ob "Naprej".
   */
  answersAtRisk?: boolean;
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

export function StepIndustry({ value, hero, answersAtRisk = false, onChange, onNext }: StepIndustryProps) {
  /**
   * Segment, s katerim je korak začel — z njim se primerja trenutna izbira, da
   * opozorilo pove resnico: 'trgovina' in 'drugo_blago' vodita v isti vprašalnik,
   * zato menjava med njima ničesar ne izgubi in opozorila ne sme sprožiti.
   */
  const [initialSegmentId] = useState(() => getSegmentForIndustry(value.industry));
  /**
   * Ko je izbrana pod-dejavnost, hrani basicInfo njen id (npr. 'drugo_storitve'),
   * spustni seznam pa mora še naprej kazati "Drugo" — sicer bi izbira izginila,
   * ker id pod-dejavnosti med možnostmi seznama ne obstaja.
   */
  const selectedSubIndustry = findSubIndustry(value.industry);
  const selectValue = selectedSubIndustry ? DRUGO_ID : value.industry;
  const showSubQuestion = selectValue === DRUGO_ID;

  // Sam 'drugo' ni odgovor: brez podizbire ne vemo, kateri vprašalnik pokazati.
  // Isti predikat krmili nagovor zgoraj — gumb in naslov se prižgeta hkrati.
  const headingRef = useStepHeading();
  const canProceed = isCompleteIndustryChoice(value.industry);
  const willDiscardAnswers =
    answersAtRisk && canProceed && getSegmentForIndustry(value.industry) !== initialSegmentId;

  return (
    <div className={shellStyles.wrap}>
      {/*
        Rezervirana višina: spustni seznam stoji POD nagovorom, nagovor pa se ob
        izbiri dejavnosti zamenja. Brez min-block-size bi daljši podnaslov seznam
        premaknil izpod kazalca prav v trenutku, ko obiskovalec izbira. Dolžine
        varuje config/copy/copy.test.ts — CSS rezervira, test skrbi, da je dovolj.
      */}
      <div className={styles.hero}>
        <h1 className={shellStyles.introTitle} tabIndex={-1} ref={headingRef}>
          {hero.heroTitle}
        </h1>
        <p className={styles.heroPain}>{hero.heroSubtitle}</p>
        {/*
         * Ocena trajanja mora držati. Prej je pisalo "v dveh minutah": že sam korak
         * triaže traja dlje, obiskovalec pa takrat še ni pri nobeni številki. Obljuba,
         * ki se podre na koraku 6, stane več kot poštena — takrat je vloženih že
         * osem minut in opustitev je najdražja možna.
         *
         * Ločeno od panožnega podnaslova, ker je ponudba za vse ista: sedem
         * prepisov bi se ob prvi spremembi roka razšlo.
         */}
        <p className={shellStyles.introSubtitle}>{SHARED_COPY.landingOffer}</p>
      </div>

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

      {willDiscardAnswers ? (
        // role="status": opozorilo se pojavi šele ob spremembi izbire, zato ga mora
        // bralnik zaslona prebrati, ne da bi mu obiskovalec šel iskat.
        <p className={styles.discardWarning} role="status">
          Ta dejavnost ima svoj vprašalnik, zato bodo vaši dosedanji odgovori ob koraku naprej
          izbrisani. Če se premislite, izberite prejšnjo dejavnost — do tedaj ni izgubljeno nič.
        </p>
      ) : null}

      <p className={shellStyles.trustNote}>{SHARED_COPY.privacyNote}</p>

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
