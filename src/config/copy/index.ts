import type { SegmentId } from '../segmentTypes';
import { getSizeClass } from '../sizeClasses';
import { LOGISTIKA_COPY } from './logistika';
import { MALOPRODAJA_COPY } from './maloprodaja';
import { PROIZVODNJA_COPY } from './proizvodnja';
import { RACUNOVODSTVO_COPY } from './racunovodstvo';
import { SPLOSNO_COPY } from './splosno';
import { STORITVE_COPY } from './storitve';
import { TRGOVINA_COPY } from './trgovina';
import { NEUTRAL_COPY, type ResolvedSegmentCopy, type SegmentCopy } from './copyTypes';

/**
 * Register marketinških besedil po dejavnosti.
 *
 * Eno mesto na dejavnost: marketing tu prepiše nagovor, ne da bi se dotaknil
 * enega samega vprašanja ali formule. Vprašanja so v config/modules/ in v
 * vprašalnih poljih config/contexts/ - ta delitev je edini razlog, da je ta
 * register mogoče urejati brez pregleda razvijalca.
 *
 * Zapis je poln (Record, ne Partial): dejavnost brez besedila bi se izrisala z
 * nevtralnim naslovom in tega ne bi opazil nihče, dokler ne bi bil objavljen.
 */
export const SEGMENT_COPY: Record<SegmentId, SegmentCopy> = {
  proizvodnja: PROIZVODNJA_COPY,
  logistika: LOGISTIKA_COPY,
  trgovina: TRGOVINA_COPY,
  maloprodaja: MALOPRODAJA_COPY,
  storitve: STORITVE_COPY,
  racunovodstvo: RACUNOVODSTVO_COPY,
  splosno: SPLOSNO_COPY,
};

/**
 * Besedilo dejavnosti, razrešeno proti nevtralnemu.
 *
 * Razreševanje je tu in ne v izrisovalcih namenoma: sedem komponent z lastnim
 * "?? privzeto besedilo" bi pomenilo sedem mest, kjer se privzetek lahko razide.
 * Združevanje je plitvo po skupinah - polje, ki ga dejavnost prepiše, prepiše
 * samo sebe, sosednja pa ostanejo nevtralna.
 */
export function getSegmentCopy(id: SegmentId): ResolvedSegmentCopy {
  const copy = SEGMENT_COPY[id] ?? SPLOSNO_COPY;
  return {
    id: copy.id,
    displayName: copy.displayName,
    landing: { ...NEUTRAL_COPY.landing, ...copy.landing },
    context: { ...NEUTRAL_COPY.context, ...copy.context },
    triage: { ...NEUTRAL_COPY.triage, ...copy.triage },
    costBasis: { ...NEUTRAL_COPY.costBasis, ...copy.costBasis },
    inputs: { ...NEUTRAL_COPY.inputs, ...copy.inputs },
    results: { ...NEUTRAL_COPY.results, ...copy.results },
    figures: {
      directLoss: { ...NEUTRAL_COPY.figures.directLoss, ...copy.figures.directLoss },
      lostMargin: { ...NEUTRAL_COPY.figures.lostMargin, ...copy.figures.lostMargin },
      capacity: { ...NEUTRAL_COPY.figures.capacity, ...copy.figures.capacity },
      oneTimeCapital: { ...NEUTRAL_COPY.figures.oneTimeCapital, ...copy.figures.oneTimeCapital },
      potential: { ...NEUTRAL_COPY.figures.potential, ...copy.figures.potential },
    },
    emailGate: { ...NEUTRAL_COPY.emailGate, ...copy.emailGate },
    pdf: { ...NEUTRAL_COPY.pdf, ...copy.pdf },
  };
}

/**
 * Oznaka segmenta z DEJANSKIM velikostnim razredom: "Proizvodnja · 250+ zaposlenih".
 *
 * displayName je čisto ime panoge; razred se pripne tu, iz vnesenega števila.
 * En helper za vsa tri mesta izrisa (pas nad vnosi, nadnaslov rezultatov, glava
 * strankinega PDF-ja): razpon je bil prej trdo zapisan v treh displayName in se
 * na vnos ni odzival, tri ročna sestavljanja pa bi se razšla pri prvem prepisu.
 *
 * Prodajna priprava helperja NE uporablja: qualification vodi sizeClass kot
 * ločeno vrstico tik pod imenom vprašalnika (pdfSales, salesReportHtml).
 *
 * Pri employeeCount <= 0 vrne samo ime — razred bi bil trditev brez podatka.
 */
export function segmentLabelWithSize(displayName: string, employeeCount: number): string {
  if (employeeCount <= 0) return displayName;
  return `${displayName} · ${getSizeClass(employeeCount)} zaposlenih`;
}

export * from './copyTypes';
