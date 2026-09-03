import type { SegmentId } from './segmentTypes';

import accountingUrl from '../assets/pantheon-logos/accounting.svg';
import accountingDarkUrl from '../assets/pantheon-logos/accounting-dark.svg';
import enterpriseUrl from '../assets/pantheon-logos/enterprise.svg';
import enterpriseDarkUrl from '../assets/pantheon-logos/enterprise-dark.svg';
import manufactureUrl from '../assets/pantheon-logos/manufacture.svg';
import manufactureDarkUrl from '../assets/pantheon-logos/manufacture-dark.svg';
import retailUrl from '../assets/pantheon-logos/retail.svg';
import retailDarkUrl from '../assets/pantheon-logos/retail-dark.svg';

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
 *
 * Datoteke stojijo v src/assets/ in ne v public/, ker jih poleg zaslona bere
 * tudi prodajna priprava v HTML — ta jih potrebuje kot IZVORNO BESEDILO in ne
 * kot naslov (glej pantheonLogoSources.ts), kar zahteva `?raw` uvoz. Ob prehodu
 * je odpadel ročni obhod z `import.meta.env.BASE_URL`: bundlanim sredstvom Vite
 * bazo prepiše sam, tako kot potem v index.html.
 */
export interface PantheonLogo {
  src: string;
  srcDark: string;
  alt: string;
}

/**
 * Znamke, ki jih Datalab za PANTHEON dejansko loči. Segmentov je več kot znamk,
 * zato je preslikava izpostavljena posebej: naslovi za zaslon (spodaj) in izvorna
 * besedila za poročila (pantheonLogoSources.ts) morajo za isti segment vrniti
 * ISTI logotip, ločeni tabeli pa bi se prej ali slej razšli.
 */
export type PantheonBrand = 'enterprise' | 'retail' | 'manufacture' | 'accounting';

export const PANTHEON_BRAND: Record<SegmentId, PantheonBrand> = {
  proizvodnja: 'manufacture',
  // Ločenega logotipa za logistiko ni, ker Datalab zanjo nima ločene licence:
  // pokrivata jo SE in ME, torej ista znamka kot splošni poslovni paket. Namesto
  // izmišljenega ali napačno pripisanega (Retail) uporabimo Enterprise. Če
  // marketing pripravi svojega, se zamenja samo ta vnos.
  logistika: 'enterprise',
  // Veleprodaja in maloprodaja si delita Retail: Datalab ju ne loči na ravni
  // licence, vprašalnika pa sta različna. Deljenje logotipa je ustaljeno — enako
  // si Enterprise delita logistika in splošni segment.
  trgovina: 'retail',
  maloprodaja: 'retail',
  // ZAČASNO: za storitvena in projektna podjetja ni svojega znamčnega logotipa,
  // zato stoji tu Enterprise. Ob prejemu pravega sredstva zamenjaj oboje in dodaj
  // temno različico (#231F20 -> #ECE8E5), enako kot pri ostalih.
  storitve: 'enterprise',
  racunovodstvo: 'accounting',
  splosno: 'enterprise',
};

const BY_BRAND: Record<PantheonBrand, PantheonLogo> = {
  enterprise: { src: enterpriseUrl, srcDark: enterpriseDarkUrl, alt: 'PANTHEON Enterprise' },
  retail: { src: retailUrl, srcDark: retailDarkUrl, alt: 'PANTHEON Retail' },
  manufacture: { src: manufactureUrl, srcDark: manufactureDarkUrl, alt: 'PANTHEON Manufacture' },
  accounting: { src: accountingUrl, srcDark: accountingDarkUrl, alt: 'PANTHEON Accounting' },
};

export const PANTHEON_LOGOS: Record<SegmentId, PantheonLogo> = {
  proizvodnja: BY_BRAND[PANTHEON_BRAND.proizvodnja],
  logistika: BY_BRAND[PANTHEON_BRAND.logistika],
  trgovina: BY_BRAND[PANTHEON_BRAND.trgovina],
  maloprodaja: BY_BRAND[PANTHEON_BRAND.maloprodaja],
  storitve: BY_BRAND[PANTHEON_BRAND.storitve],
  racunovodstvo: BY_BRAND[PANTHEON_BRAND.racunovodstvo],
  splosno: BY_BRAND[PANTHEON_BRAND.splosno],
};
