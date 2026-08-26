import type { ModuleDefinition } from '../../config/modules';
import { segmentLabelWithSize, type ResolvedSegmentCopy } from '../../config/copy';
import { formatEUR } from '../../lib/format';
import type { ModuleInputsState } from '../../types';
import { ModuleSection } from './ModuleSection';
import { useStepHeading } from '../../lib/useStepHeading';
import buttonStyles from '../../styles/buttons.module.css';
import shellStyles from './StepShell.module.css';
import styles from './StepInputs.module.css';

interface StepInputsProps {
  /**
   * Besedilo dejavnosti. Doslej je korak dobil cel SegmentConfig, prebral pa iz
   * njega samo displayName — konfiguracijo vprašalnika zaradi ene oznake.
   */
  copy: ResolvedSegmentCopy;
  /** Vneseno število zaposlenih (Korak 2) — pas pripne dejanski velikostni razred. */
  employeeCount: number;
  /** Moduli TE strani — eno področje, na zadnji strani diagnostika in tvegani stroški. */
  modules: ModuleDefinition[];
  /** Naslov strani: ime področja, na zadnji strani spoj imen njenih modulov. */
  pageTitle: string;
  /** Vrednosti po modulu, dopolnjene s privzetimi (glej resolveInputs). */
  values: Record<string, Record<string, number>>;
  onChange: (value: ModuleInputsState) => void;
  raw: ModuleInputsState;
  liveTotalEUR: number;
  /** Mehko opozorilo o verjetnosti vnesenih ur — nikoli ne blokira (lib/plausibility). */
  plausibilityWarning?: string | null;
  /**
   * Področja te strani, kjer je znesek vnesen, glavni vzrok pa ne izbran.
   * Prav tako mehko: vzrok odloči o naslovljivem deležu, zato je vreden klika —
   * a obiskovalca, ki ga noče izbrati, ne ustavimo (lib/moduleEngine).
   */
  missingCauseWarning?: string | null;
  stepLabel: string;
  /** Zadnja stran vnosov — od tod naprej gre na rezultate in ne na novo področje. */
  isLastPage: boolean;
  onNext: () => void;
  onBack: () => void;
  onChangeSegment: () => void;
}

export function StepInputs({
  copy,
  employeeCount,
  modules,
  pageTitle,
  values,
  onChange,
  raw,
  liveTotalEUR,
  plausibilityWarning,
  missingCauseWarning,
  stepLabel,
  isLastPage,
  onNext,
  onBack,
  onChangeSegment,
}: StepInputsProps) {
  // Vsako področje je svoja stran z novim naslovom — fokus mora za njim.
  const headingRef = useStepHeading(pageTitle);

  /**
   * Zadnja stran nosi diagnostiko in tvegane stroške — področja BREZ evrov.
   *
   * Opomba o plačni masi in tekoča vsota sta na njej govorili o nečem, česar na
   * strani ni: obiskovalec je odgovarjal na štiri vprašanja o sledljivosti,
   * spodaj pa gledal znesek, ki se ni premaknil, in pojasnilo o urah, ki jih ni
   * vnašal. Vsota ostane le tam, kjer se ob vnosu res spreminja.
   */
  const hasMonetaryFields = modules.some((definition) =>
    definition.fields.some((field) => field.kind !== 'choice' && field.kind !== 'checkbox'),
  );

  const handleFieldChange = (moduleId: string, key: string, value: number) => {
    onChange({ ...raw, [moduleId]: { ...values[moduleId], [key]: value } });
  };

  return (
    <div className={shellStyles.wrap}>
      <p className={shellStyles.stepLabel}>{stepLabel}</p>
      <h1 className={shellStyles.title} tabIndex={-1} ref={headingRef}>
        {pageTitle}
      </h1>

      <div className={styles.profileBanner}>
        <span>
          Izračun prilagojen za:{' '}
          <span className={styles.profileName}>
            {segmentLabelWithSize(copy.displayName, employeeCount)}
          </span>
        </span>
        {/* Pove, kam gumb pelje: vprašalnik določa dejavnost, zato se popravlja tam. */}
        <button type="button" className={styles.profileChange} onClick={onChangeSegment}>
          spremeni dejavnost
        </button>
      </div>

      <div className={shellStyles.card}>
        {modules.map((definition) => (
          <ModuleSection
            key={definition.id}
            definition={definition}
            values={values[definition.id] ?? {}}
            onChange={(key, value) => handleFieldChange(definition.id, key, value)}
            // Ime področja že nosi h1 zgoraj; na enomodulni strani bi lasten naslov
            // modula tik pod njim samo podvojil isto besedilo. Na strani z dvema
            // modula (zadnja) h1 združuje obe imeni, zato tu ostaneta ločena.
            hideTitle={modules.length === 1}
          />
        ))}
        {hasMonetaryFields ? (
          <p className={styles.moduleFootnote}>{copy.inputs.hoursFootnote}</p>
        ) : null}
      </div>

      {plausibilityWarning ? (
        // Mehko opozorilo, ne napaka: vnos je lahko resničen, zato gumb Naprej
        // ostane omogočen. role="status", da ga bralnik zaslona prebere ob pojavu.
        <p className={styles.plausibilityWarning} role="status">
          {plausibilityWarning}
        </p>
      ) : null}

      {missingCauseWarning ? (
        <p className={styles.plausibilityWarning} role="status">
          {missingCauseWarning}
        </p>
      ) : null}

      {/*
        Tekoča vsota in navigacija sta v istem prilepljenem pasu: kot dva ločena
        sticky elementa na bottom: 0 bi se prekrivala, tako pa sta oba ves čas v
        dosegu — vsota nad gumboma, ker se med vnašanjem bere, ne klika.
      */}
      <div className={shellStyles.stickyFooter}>
        <div className={shellStyles.stickyFooterInner}>
          {/*
            Vsota neposrednih izgub IN kapacitete: področji Plan in Delovni nalogi ne
            prispevata nobene neposredne izgube, zato bi obiskovalec, ki izbere prav
            ti dve, ves čas vnašanja gledal 0 EUR.
          */}
          {hasMonetaryFields ? (
            <div className={styles.pinnedTotal}>
              <span className={styles.pinnedLabel}>{copy.inputs.runningTotalLabel}</span>
              <span className={styles.pinnedValue}>{formatEUR(liveTotalEUR)}</span>
            </div>
          ) : null}

          <div className={shellStyles.actions}>
            <button type="button" className={buttonStyles.secondaryButton} onClick={onBack}>
              Nazaj
            </button>
            <button type="button" className={buttonStyles.primaryButton} onClick={onNext}>
              {isLastPage ? copy.inputs.lastPageCta : 'Naprej'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
