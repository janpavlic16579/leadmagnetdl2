import { SHARED_COPY } from '../../config/copy';
import type { ConfidenceLevel } from '../../lib/potential';
import { confidenceMeterSegments } from '../../lib/reportVisuals';
import styles from './ConfidenceMeter.module.css';

interface ConfidenceMeterProps {
  level: ConfidenceLevel;
  /**
   * Izračunan razlog nizke zanesljivosti (lib/confidenceReason.ts). Splošno
   * besedilo iz registra pravi "večina ključnih podatkov manjka" — kar je
   * napačno pri obiskovalcu, ki je vnesel vsa polja in le urni postavki prevzel
   * kot panožno oceno; ta je najpogostejša pot do nizke ocene.
   */
  reason?: string | null;
}

/**
 * Zanesljivost kot merilnik in ne le kot beseda.
 *
 * Značka je povedala stopnjo, ne pa tudi, ali je nad njo še kaj: "Srednja
 * zanesljivost" brez lestvice je ocena brez merila. Trije segmenti povedo tudi,
 * koliko manjka — in to je hkrati edino vabilo v poročilu, da obiskovalec vnose
 * dopolni, namesto da bi oceno zavrnil.
 */
export function ConfidenceMeter({ level, reason }: ConfidenceMeterProps) {
  const { filled, total } = confidenceMeterSegments(level);
  const label = SHARED_COPY.confidenceLabel[level];
  const note = level === 'low' && reason ? reason : SHARED_COPY.confidenceNote[level];

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        {/* Merilnik ponovi tisto, kar oznaka ob njem pove z besedo — bralniku
            zaslona zato ostane skrit, sicer bi slišal tri prazne elemente. */}
        <span className={styles.meter} aria-hidden="true">
          {Array.from({ length: total }, (_, index) => (
            <span
              key={index}
              className={index < filled ? `${styles.segment} ${styles.segmentFilled}` : styles.segment}
            />
          ))}
        </span>
        <span className={`${styles.label} ${styles[level]}`}>{label}</span>
      </div>
      <p className={styles.note}>{note}</p>
    </div>
  );
}
