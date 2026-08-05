import type { SegmentId } from '../segmentTypes';
import { LOGISTIKA_CONTEXT } from './logistika';
import { MALOPRODAJA_CONTEXT } from './maloprodaja';
import { PROIZVODNJA_CONTEXT } from './proizvodnja';
import { RACUNOVODSTVO_CONTEXT } from './racunovodstvo';
import { SPLOSNO_CONTEXT } from './splosno';
import { STORITVE_CONTEXT } from './storitve';
import { TRGOVINA_CONTEXT } from './trgovina';
import {
  FALLBACK_IMPROVEMENT_BAND,
  type ImprovementBand,
  type SegmentContext,
} from './contextTypes';

/**
 * Register kontekstov dejavnosti.
 *
 * Prisotnost vnosa je hkrati stikalo: segment s kontekstom dobi korak "nekaj o vas"
 * in korak s skupno finančno osnovo, iz njega izpeljan pas izboljšave in oznako
 * zanesljivosti. Segment brez njega ostane pri prejšnjem, krajšem toku.
 *
 * Doslej sta to krmilili zastavici hasContextStep in hasCostBasisStep v segments.ts.
 * Bili sta dvojna evidenca: zastavica brez konfiguracije bi prikazala prazen korak.
 */
export const SEGMENT_CONTEXTS: Partial<Record<SegmentId, SegmentContext>> = {
  proizvodnja: PROIZVODNJA_CONTEXT,
  logistika: LOGISTIKA_CONTEXT,
  trgovina: TRGOVINA_CONTEXT,
  maloprodaja: MALOPRODAJA_CONTEXT,
  storitve: STORITVE_CONTEXT,
  racunovodstvo: RACUNOVODSTVO_CONTEXT,
  splosno: SPLOSNO_CONTEXT,
};

export function getSegmentContext(id: SegmentId): SegmentContext | undefined {
  return SEGMENT_CONTEXTS[id];
}

/** Pas izboljšave izbranega sistema; brez odgovora srednji pas, nikoli najugodnejši. */
export function improvementBandFor(
  context: SegmentContext | undefined,
  systemId: string | null,
): ImprovementBand {
  const option = context?.currentSystem.options.find((candidate) => candidate.id === systemId);
  return option?.band ?? FALLBACK_IMPROVEMENT_BAND;
}

/**
 * Tehnična opozorila (SQL Server 2016, Windows Server 2016, ZIERDED) so smiselna
 * obstoječim uporabnikom PANTHEON — tem povedo, da jim poteka podpora. Podjetju,
 * ki PANTHEON-a nima, niso prihranek, ampak šum, ki odvrne pozornost od
 * stroškovnega dela izračuna.
 *
 * Pogoj velja za vsak segment, ki za sedanji sistem sploh vpraša. Segmenti brez
 * konteksta opozorila prikazujejo naprej kot doslej — druge podlage za odločitev
 * pri njih ni.
 */
export function isTechnicalRiskModuleVisible(segmentId: SegmentId, systemId: string | null): boolean {
  const context = getSegmentContext(segmentId);
  if (!context) return true;
  return context.currentSystem.options.some((option) => option.id === systemId && option.isPantheon);
}

export * from './contextTypes';
