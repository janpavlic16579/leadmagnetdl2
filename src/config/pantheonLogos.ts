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

/**
 * Aplikacija ne teče nujno v korenu domene (vite.config.ts `base`), poti iz kode
 * pa Vite — drugače kot tiste v index.html — ne prepiše. Zato jih sestavimo sami.
 */
const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const PANTHEON_LOGOS: Record<SegmentId, PantheonLogo> = {
  proizvodnja: {
    src: asset('pantheon-logos/manufacture.svg'),
    srcDark: asset('pantheon-logos/manufacture-dark.svg'),
    alt: 'PANTHEON Manufacture',
  },
  // Ločenega logotipa za logistiko ni, ker Datalab zanjo nima ločene licence:
  // pokrivata jo SE in ME, torej ista znamka kot splošni poslovni paket. Namesto
  // izmišljenega ali napačno pripisanega (Retail) uporabimo Enterprise. Če
  // marketing pripravi svojega, se zamenja samo ta vnos.
  logistika: {
    src: asset('pantheon-logos/enterprise.svg'),
    srcDark: asset('pantheon-logos/enterprise-dark.svg'),
    alt: 'PANTHEON Enterprise',
  },
  // Veleprodaja in maloprodaja si delita Retail: Datalab ju ne loči na ravni
  // licence, vprašalnika pa sta različna. Deljenje logotipa je ustaljeno — enako
  // si Enterprise delita logistika in splošni segment.
  trgovina: {
    src: asset('pantheon-logos/retail.svg'),
    srcDark: asset('pantheon-logos/retail-dark.svg'),
    alt: 'PANTHEON Retail',
  },
  maloprodaja: {
    src: asset('pantheon-logos/retail.svg'),
    srcDark: asset('pantheon-logos/retail-dark.svg'),
    alt: 'PANTHEON Retail',
  },
  // ZAČASNO: za storitvena in projektna podjetja ni svojega znamčnega logotipa,
  // zato stoji tu Enterprise. Ob prejemu pravega sredstva zamenjaj oboje in dodaj
  // temno različico (#231F20 -> #ECE8E5), enako kot pri ostalih.
  storitve: {
    src: asset('pantheon-logos/enterprise.svg'),
    srcDark: asset('pantheon-logos/enterprise-dark.svg'),
    alt: 'PANTHEON Enterprise',
  },
  racunovodstvo: {
    src: asset('pantheon-logos/accounting.svg'),
    srcDark: asset('pantheon-logos/accounting-dark.svg'),
    alt: 'PANTHEON Accounting',
  },
  splosno: {
    src: asset('pantheon-logos/enterprise.svg'),
    srcDark: asset('pantheon-logos/enterprise-dark.svg'),
    alt: 'PANTHEON Enterprise',
  },
};
