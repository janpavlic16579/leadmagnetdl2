import { SHARED_COPY } from '../../config/copy';
import type { ConfidenceLevel } from '../../lib/potential';
import styles from './ConfidenceNote.module.css';

interface ConfidenceNoteProps {
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
 * Kakovost vhodnih podatkov kot poved, ne kot ocena.
 *
 * Značka ("Nizka zanesljivost") in merilnik treh segmentov sta bila odstranjena:
 * stranki sta na naslovnem znesku brala kot ocena NAŠEGA izračuna, čeprav sta
 * merila njene vnose. Poved ostane, ker je edina od obojega, ki pove tudi smer
 * napake — zneski so spodnja meja, dejanski so praviloma višji. Ocena sama živi
 * naprej v prodajni pripravi, kjer je namenjena prodajniku in ne stranki.
 */
export function ConfidenceNote({ level, reason }: ConfidenceNoteProps) {
  const note = level === 'low' && reason ? reason : SHARED_COPY.confidenceNote[level];

  return <p className={styles.note}>{note}</p>;
}
