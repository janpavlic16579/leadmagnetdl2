import { MODULE_E_ITEMS, type SegmentConfig } from '../../config/segments';
import type { ModuleEChecked } from '../../lib/calculations';
import { formatEUR } from '../../lib/format';
import type { ModuleInputsState } from '../../types';
import { ModuleInput } from './ModuleInput';
import buttonStyles from '../../styles/buttons.module.css';
import shellStyles from './StepShell.module.css';
import styles from './StepInputs.module.css';

interface StepInputsProps {
  segment: SegmentConfig;
  value: ModuleInputsState;
  onChange: (value: ModuleInputsState) => void;
  liveTotalEUR: number;
  onNext: () => void;
  onBack: () => void;
  onChangeSegment: () => void;
}

const EMPTY_E_CHECKED: ModuleEChecked = {
  sqlServer2016: false,
  windowsServer2016: false,
  eInvoiceZierded: false,
};

export function StepInputs({
  segment,
  value,
  onChange,
  liveTotalEUR,
  onNext,
  onBack,
  onChangeSegment,
}: StepInputsProps) {
  const modules = segment.modulesEnabled;

  return (
    <div className={shellStyles.wrap}>
      <p className={shellStyles.stepLabel}>Korak 2 od 3</p>
      <h1 className={shellStyles.title}>Vaše številke</h1>

      <div className={styles.profileBanner}>
        <span>
          Izračun prilagojen za: <span className={styles.profileName}>{segment.displayName}</span>
        </span>
        <button type="button" className={styles.profileChange} onClick={onChangeSegment}>
          spremeni
        </button>
      </div>

      <div className={shellStyles.card}>
        {modules.includes('A') && segment.moduleLabels.A && segment.defaults.A ? (
          <section className={styles.moduleSection}>
            <h2 className={styles.moduleHeading}>Ročno delo</h2>
            <ModuleInput
              mode="number"
              label={segment.moduleLabels.A.documentsQuestion}
              value={value.A?.documentsPerMonth ?? segment.defaults.A.documentsPerMonth}
              unit="dokumentov/mesec"
              onChange={(documentsPerMonth) =>
                onChange({
                  ...value,
                  A: { ...segment.defaults.A!, ...value.A, documentsPerMonth },
                })
              }
            />
            <ModuleInput
              mode="slider"
              label={segment.moduleLabels.A.minutesQuestion}
              value={value.A?.minutesPerDocument ?? segment.defaults.A.minutesPerDocument}
              min={0.5}
              max={15}
              step={0.5}
              unit="min"
              onChange={(minutesPerDocument) =>
                onChange({
                  ...value,
                  A: { ...segment.defaults.A!, ...value.A, minutesPerDocument },
                })
              }
            />
            <ModuleInput
              mode="slider"
              label={segment.moduleLabels.A.hourlyCostQuestion}
              value={value.A?.hourlyLaborCostEUR ?? segment.defaults.A.hourlyLaborCostEUR}
              min={18}
              max={35}
              step={1}
              unit="EUR/h"
              onChange={(hourlyLaborCostEUR) =>
                onChange({
                  ...value,
                  A: { ...segment.defaults.A!, ...value.A, hourlyLaborCostEUR },
                })
              }
            />
            <p className={shellStyles.formLabel} style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
              Sproščene ure ne pomenijo nižje plačne mase — zaposleni ostane. Gre za čas, ki ga lahko usmerite v
              drugo delo.
            </p>
          </section>
        ) : null}

        {modules.includes('B') && segment.moduleLabels.B && segment.defaults.B ? (
          <section className={styles.moduleSection}>
            <h2 className={styles.moduleHeading}>Napake</h2>
            <ModuleInput
              mode="number"
              label={segment.moduleLabels.B.transactionsQuestion}
              value={value.B?.transactionsPerMonth ?? segment.defaults.B.transactionsPerMonth}
              unit="transakcij/mesec"
              onChange={(transactionsPerMonth) =>
                onChange({
                  ...value,
                  B: { ...segment.defaults.B!, ...value.B, transactionsPerMonth },
                })
              }
            />
            <ModuleInput
              mode="slider"
              label={segment.moduleLabels.B.errorRateQuestion}
              value={Math.round((value.B?.errorRatePercent ?? segment.defaults.B.errorRatePercent) * 1000) / 10}
              min={0}
              max={10}
              step={0.1}
              unit="%"
              onChange={(percent) =>
                onChange({
                  ...value,
                  B: { ...segment.defaults.B!, ...value.B, errorRatePercent: percent / 100 },
                })
              }
            />
            <ModuleInput
              mode="slider"
              label={segment.moduleLabels.B.costPerErrorQuestion}
              value={value.B?.costPerErrorEUR ?? segment.defaults.B.costPerErrorEUR}
              min={5}
              max={200}
              step={5}
              unit="EUR"
              onChange={(costPerErrorEUR) =>
                onChange({
                  ...value,
                  B: { ...segment.defaults.B!, ...value.B, costPerErrorEUR },
                })
              }
            />
          </section>
        ) : null}

        {modules.includes('C') && segment.moduleLabels.C && segment.defaults.C ? (
          <section className={styles.moduleSection}>
            <h2 className={styles.moduleHeading}>Vezan kapital v zalogah</h2>
            <ModuleInput
              mode="number"
              label={segment.moduleLabels.C.inventoryQuestion}
              value={value.C?.inventoryValueEUR ?? segment.defaults.C.inventoryValueEUR}
              unit="EUR"
              onChange={(inventoryValueEUR) =>
                onChange({
                  ...value,
                  C: { ...segment.defaults.C!, ...value.C, inventoryValueEUR },
                })
              }
            />
            <ModuleInput
              mode="slider"
              label={segment.moduleLabels.C.reductionQuestion}
              value={Math.round((value.C?.achievableReductionPercent ?? segment.defaults.C.achievableReductionPercent) * 100)}
              min={3}
              max={15}
              step={1}
              unit="%"
              onChange={(percent) =>
                onChange({
                  ...value,
                  C: { ...segment.defaults.C!, ...value.C, achievableReductionPercent: percent / 100 },
                })
              }
            />
            <ModuleInput
              mode="slider"
              label={segment.moduleLabels.C.capitalCostQuestion}
              value={Math.round((value.C?.capitalCostPercent ?? segment.defaults.C.capitalCostPercent) * 100)}
              min={5}
              max={20}
              step={1}
              unit="%"
              onChange={(percent) =>
                onChange({
                  ...value,
                  C: { ...segment.defaults.C!, ...value.C, capitalCostPercent: percent / 100 },
                })
              }
            />
          </section>
        ) : null}

        {modules.includes('D') && segment.moduleLabels.D && segment.defaults.D ? (
          <section className={styles.moduleSection}>
            <h2 className={styles.moduleHeading}>Počasen denarni tok</h2>
            <ModuleInput
              mode="number"
              label={segment.moduleLabels.D.revenueQuestion}
              value={value.D?.annualRevenueEUR ?? segment.defaults.D.annualRevenueEUR}
              unit="EUR/leto"
              onChange={(annualRevenueEUR) =>
                onChange({
                  ...value,
                  D: { ...segment.defaults.D!, ...value.D, annualRevenueEUR },
                })
              }
            />
            <ModuleInput
              mode="number"
              label={segment.moduleLabels.D.dsoQuestion}
              value={value.D?.currentDSODays ?? segment.defaults.D.currentDSODays}
              unit="dni"
              onChange={(currentDSODays) =>
                onChange({
                  ...value,
                  D: { ...segment.defaults.D!, ...value.D, currentDSODays },
                })
              }
            />
            <ModuleInput
              mode="slider"
              label={segment.moduleLabels.D.targetReductionQuestion}
              value={value.D?.targetReductionDays ?? segment.defaults.D.targetReductionDays}
              min={1}
              max={30}
              step={1}
              unit="dni"
              onChange={(targetReductionDays) =>
                onChange({
                  ...value,
                  D: { ...segment.defaults.D!, ...value.D, targetReductionDays },
                })
              }
            />
            <ModuleInput
              mode="slider"
              label={segment.moduleLabels.D.opportunityCostQuestion}
              value={Math.round((value.D?.opportunityCostPercent ?? segment.defaults.D.opportunityCostPercent) * 100)}
              min={2}
              max={12}
              step={1}
              unit="%"
              onChange={(percent) =>
                onChange({
                  ...value,
                  D: { ...segment.defaults.D!, ...value.D, opportunityCostPercent: percent / 100 },
                })
              }
            />
          </section>
        ) : null}

        {modules.includes('E') ? (
          <section className={styles.moduleSection}>
            <h2 className={styles.moduleHeading}>Tvegani stroški</h2>
            {MODULE_E_ITEMS.map((item) => (
              <label key={item.id} className={styles.checklistItem}>
                <input
                  type="checkbox"
                  checked={value.E?.[item.id] ?? EMPTY_E_CHECKED[item.id]}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      E: { ...EMPTY_E_CHECKED, ...value.E, [item.id]: event.target.checked },
                    })
                  }
                />
                <span>{item.label}</span>
              </label>
            ))}
          </section>
        ) : null}
      </div>

      <div className={styles.pinnedTotal}>
        <span className={styles.pinnedLabel}>Trenutna ocena letne izgube</span>
        <span className={styles.pinnedValue}>{formatEUR(liveTotalEUR)}</span>
      </div>

      <div className={shellStyles.actions}>
        <button type="button" className={buttonStyles.secondaryButton} onClick={onBack}>
          Nazaj
        </button>
        <button type="button" className={buttonStyles.primaryButton} onClick={onNext}>
          Poglej rezultat
        </button>
      </div>
    </div>
  );
}
