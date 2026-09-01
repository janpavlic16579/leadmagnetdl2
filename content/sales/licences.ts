import type { SegmentId } from '../../src/config/segmentTypes';

/**
 * Licenca PANTHEON, ki pripada dejavnosti.
 *
 * Preslikava ni izmišljena: prepisana je iz `src/config/pantheonLogos.ts`, ki je
 * edini kraj v tem repozitoriju, kjer je zapisano, katera znamka pripada kateremu
 * segmentu. Če se tam kaj premakne, se mora premakniti tudi tu — zato je to
 * DVOJNA EVIDENCA in jo varuje test, ki obe preslikavi primerja.
 *
 * `note` ni okras. Pri dveh segmentih je edino, kar poročilo loči od obljube, ki je
 * Datalab ne more izpolniti:
 *
 * - LOGISTIKA nima svoje licence in ne vertikale. Vertikale so samo Farming, Vet in
 *   Public Service; logistiko pokrivata Enterprise izdaji SE in ME, namenskega WMS
 *   ali TMS pa PANTHEON nima. Priporočilo, ki bi zamolčalo to, bi prodajalo produkt,
 *   ki ne obstaja.
 *
 *   POPRAVEK, avgust 2026: ta zapisnik je do zdaj trdil, da logistiko pokrivata "SE
 *   in ME (modula LT in LT3)". LT in LT3 NISTA modula — sta samostojni izdaji skupine
 *   Small Business (LT za enega uporabnika, LT3 mrežna za tri) in po ceniku ležita
 *   POD SE, ne v njem. Trditev je bila torej hkrati napačna in cenovno zavajajoča;
 *   ponovljena je bila na petih mestih in je odstranjena povsod.
 * - STORITVE nimajo svoje znamke. `pantheonLogos.ts` nosi ob njih oznako ZAČASNO —
 *   Enterprise je zasilna izbira do odločitve marketinga, ne uradna umestitev.
 *
 * Cen tu ni in ne sme biti: izjava o omejitvi v nogi obeh dokumentov pravi, da
 * izračun ne obljublja funkcionalnosti izven objavljenega cenika. Točen obseg
 * potrdi svetovalec (glej PANTHEON_FIT_CONFIRM v pantheonFit.ts).
 */

export interface LicenceFit {
  /** Ime, kot ga nosi znamka — brez izmišljenih različic in brez cen. */
  name: string;
  /** Kar mora prodajnik vedeti, preden to izgovori pred stranko. Prazno = ni zadržkov. */
  note: string;
}

export const SEGMENT_LICENCE: Record<SegmentId, LicenceFit> = {
  proizvodnja: {
    name: 'PANTHEON Manufacture',
    note: '',
  },
  trgovina: {
    name: 'PANTHEON Retail',
    note: 'Veleprodaja in maloprodaja si delita isto znamko; razlika je v modulih, ne v licenci.',
  },
  maloprodaja: {
    name: 'PANTHEON Retail',
    note: 'Veleprodaja in maloprodaja si delita isto znamko; razlika je v modulih, ne v licenci.',
  },
  logistika: {
    name: 'PANTHEON SE ali ME',
    note: 'Datalab za logistiko nima ne ločene licence ne vertikale — pokrivata jo Enterprise izdaji SE in ME. Namenskega skladiščnega (WMS) ali transportnega (TMS) sistema PANTHEON ne ponuja, zato tega ne obljubljajte.',
  },
  storitve: {
    name: 'PANTHEON Enterprise',
    note: 'Storitvena dejavnost še nima svoje znamke — Enterprise je začasna umestitev. Pred ponudbo preverite pri marketingu.',
  },
  racunovodstvo: {
    name: 'PANTHEON Accounting',
    note: '',
  },
  splosno: {
    name: 'PANTHEON Enterprise',
    note: 'Dejavnosti stranka ni opredelila, zato je to splošna umestitev. Prvo vprašanje na sestanku je, s čim se podjetje dejansko ukvarja.',
  },
};

export function getSegmentLicence(segmentId: SegmentId): LicenceFit {
  return SEGMENT_LICENCE[segmentId];
}
