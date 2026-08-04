import type { SegmentId } from './segmentTypes';

/**
 * Logotipi PANTHEON po segmentih.
 *
 * Napis v logotipu je v znamčni temni #231F20 in bi na temnem ozadju izginil,
 * zunanji CSS pa datotek, vključenih prek <img src>, ne more prebarvati. Zato
 * obstajajo ločene temne različice (*-dark.svg), pri katerih je zamenjan samo
 * napis — barvni krog in bel znak v njem ostaneta nedotaknjena.
 *
 * Datoteke *-dark.svg so izpeljanke: ob posodobitvi znamčnih logotipov jih je
 * treba ponovno generirati (#231F20 -> #ECE8E5), ne urejati ročno.
 */
export interface PantheonLogo {
  src: string;
  srcDark: string;
  alt: string;
}

const base = import.meta.env.BASE_URL;

export const PANTHEON_LOGOS: Record<SegmentId, PantheonLogo> = {
  proizvodnja: {
    src: `${base}pantheon-logos/manufacture.svg`,
    srcDark: `${base}pantheon-logos/manufacture-dark.svg`,
    alt: 'PANTHEON Manufacture',
  },
  trgovina: {
    src: `${base}pantheon-logos/retail.svg`,
    srcDark: `${base}pantheon-logos/retail-dark.svg`,
    alt: 'PANTHEON Retail',
  },
  racunovodstvo: {
    src: `${base}pantheon-logos/accounting.svg`,
    srcDark: `${base}pantheon-logos/accounting-dark.svg`,
    alt: 'PANTHEON Accounting',
  },
  splosno: {
    src: `${base}pantheon-logos/enterprise.svg`,
    srcDark: `${base}pantheon-logos/enterprise-dark.svg`,
    alt: 'PANTHEON Enterprise',
  },
};
