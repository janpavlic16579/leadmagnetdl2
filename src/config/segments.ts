import type { SegmentId } from './segmentTypes';

export type { SegmentId };

/**
 * Segment določa samo, KATERI moduli se prikažejo in v kakšnem vrstnem redu.
 * Kaj modul vpraša in kako računa, je zdaj v config/modules/ — segment tega
 * ne pozna več. Zato tu ni več moduleLabels/defaults: dodajanje dejavnosti
 * ne pomeni več urejanja te datoteke razen ene vrstice z moduleIds.
 */
export interface SegmentConfig {
  id: SegmentId;
  displayName: string;
  /** Id-ji iz config/modules/. Vrstni red je hkrati prioriteta za triažo. */
  moduleIds: string[];
  headlineStory: string;
  /**
   * Če je nastavljena, se pred vnosom prikaže korak triaže: obiskovalec vsak modul
   * hitro oceni, podrobna vprašanja pa dobi le za detailCount najbolj bolečih.
   * Brez tega se prikažejo vsi moduli, kot je bilo doslej.
   */
  triage?: { detailCount: number };
  /** Samo za segment 'racunovodstvo': povprečne ure na stranko/mesec za kapacitetni preračun. */
  accountingCapacity?: {
    avgHoursPerClientPerMonth: number;
  };
  /**
   * Začetna ocena za follow-up kalibracijo (spec pogl. 6) — po prvih 50 vnosih
   * je treba prag preveriti na realnih podatkih. Ni v EUR za računovodstvo (glej spodaj).
   */
  highLossThresholdEUR?: number;
  highLossThresholdHoursPerMonth?: number;
}

export const SEGMENTS: Record<SegmentId, SegmentConfig> = {
  proizvodnja: {
    id: 'proizvodnja',
    displayName: 'Proizvodnja 10–249 zaposlenih',
    // Denarni tok (modul D) je za proizvodnjo prestavljen med splošne module.
    moduleIds: ['planiranje', 'material', 'zaloge', 'nalogi', 'zamude', 'marza', 'sledljivost', 'E'],
    headlineStory: 'Koliko vas stane, ko proizvodnja čaka?',
    triage: { detailCount: 3 },
    highLossThresholdEUR: 15000,
  },
  trgovina: {
    id: 'trgovina',
    displayName: 'Veleprodaja / logistika',
    moduleIds: ['A_trgovina', 'B_trgovina', 'C_trgovina', 'D_trgovina', 'E'],
    headlineStory: 'Koliko vas stane vsaka napačna pošiljka?',
    highLossThresholdEUR: 20000,
  },
  racunovodstvo: {
    id: 'racunovodstvo',
    displayName: 'Računovodski servis',
    moduleIds: ['A_racunovodstvo', 'E'],
    headlineStory: 'Koliko novih strank bi lahko sprejeli z isto ekipo?',
    accountingCapacity: { avgHoursPerClientPerMonth: 8 },
    highLossThresholdHoursPerMonth: 100,
  },
  splosno: {
    id: 'splosno',
    displayName: 'Direktor / CFO — splošno',
    moduleIds: ['A_splosno', 'C_splosno', 'D_splosno', 'E'],
    headlineStory: 'Koliko vas stane počasen denar?',
    highLossThresholdEUR: 15000,
  },
};

export const SEGMENT_ORDER: SegmentId[] = ['proizvodnja', 'trgovina', 'racunovodstvo', 'splosno'];

export function getSegmentFromUrlParam(param: string | null): SegmentConfig | null {
  if (!param) return null;
  const match = SEGMENT_ORDER.find((id) => id === param);
  return match ? SEGMENTS[match] : null;
}

// FAZA 2 (namerno izven obsega te gradnje):
// - benchmark proti vrstnikom (pravno neopredeljeno, spec §5b)
// - prava CRM/e-mail API integracija (glej lib/exportRecord.ts za ročni izvoz)
// - HR/RS/BA lokalizacija (arhitektura pušča prostor prek besedilnih polj v modulih,
//   a locale switcher ni zgrajen zdaj)
