import { SEGMENT_ORDER, SEGMENTS, type SegmentId } from '../../config/segments';
import buttonStyles from '../../styles/buttons.module.css';
import styles from './SegmentLanding.module.css';

interface SegmentLandingProps {
  /** Trenutno aktiven profil — označen, da uporabnik vidi, od kod odstopa. */
  activeSegmentId: SegmentId;
  onSelect: (segmentId: SegmentId) => void;
  onBack: () => void;
}

/**
 * Izbirnik profila izračuna. Ni več vstopna stran — segment se privzeto izpelje
 * iz dejavnosti v Koraku 1. Ta zaslon je izhod v sili, ko preslikava zgreši.
 */
export function SegmentLanding({ activeSegmentId, onSelect, onBack }: SegmentLandingProps) {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Izberite profil izračuna</h1>
      <p className={styles.subtitle}>
        Profil določa, katere postavke vam kalkulator prikaže. Privzetega smo izbrali glede na vašo dejavnost —
        če vam bolje ustreza drug, ga izberite tukaj.
      </p>
      <div className={styles.grid}>
        {SEGMENT_ORDER.map((id) => {
          const segment = SEGMENTS[id];
          const isActive = id === activeSegmentId;
          return (
            <button
              key={id}
              type="button"
              className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
              aria-current={isActive ? 'true' : undefined}
              onClick={() => onSelect(id)}
            >
              <span className={styles.cardName}>
                {segment.displayName}
                {isActive ? ' · trenutno izbran' : ''}
              </span>
              <p className={styles.cardStory}>{segment.headlineStory}</p>
            </button>
          );
        })}
      </div>
      <div className={styles.actions}>
        <button type="button" className={buttonStyles.secondaryButton} onClick={onBack}>
          Nazaj
        </button>
      </div>
    </div>
  );
}
