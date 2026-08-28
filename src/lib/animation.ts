import { formatAmount, formatEUR } from './format';

/**
 * Računski del animacij na rezultatu.
 *
 * Hooka useCountUp in useReveal sta namenoma tanka — vitest teče v okolju 'node'
 * brez jsdom in komponent ne more izvajati. Kar je tu, je torej vse, kar je
 * mogoče preizkusiti: izbira veje izpisa, vmesne vrednosti in odločitev, ali je
 * element sploh pod pregibom.
 */

/** Trajanje odštevanja naslovnega zneska. Dovolj, da se opazi, prekratko, da bi čakal. */
export const HERO_COUNT_UP_MS = 800;

/** Mehko zaustavljanje: hitro steče, umirjeno pristane na končni številki. */
export function easeOutCubic(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - clamped, 3);
}

/** Delež pretečenega časa, omejen na 0–1. Ničelno trajanje je takojšen konec. */
export function countUpProgress(elapsedMs: number, durationMs: number): number {
  if (!(durationMs > 0)) return 1;
  return Math.min(1, Math.max(0, elapsedMs / durationMs));
}

export interface HeroAmountInputs {
  valueEUR: number;
  range?: { minEUR: number; maxEUR: number } | null;
  lowConfidence?: boolean;
}

/**
 * Katero obliko izpisa znesek ima — določeno iz KONČNE vrednosti, enkrat.
 *
 * formatAmount izbira med razponom, "ni izmerjeno" in golo številko glede na
 * vrednost, ki jo dobi (format.ts). Med odštevanjem se vrednost spreminja, zato
 * bi izbira ob vsakem okvirju pomenila, da izpis pri majhnih deležih pade v "ni
 * izmerjeno" in šele nato v številko — animacija bi torej trdila, da ni
 * izmerjeno nič, in si to sproti premislila. Veja se izbere po končni vrednosti
 * in vse do konca ostane ista.
 */
type HeroAmountBranch = 'range' | 'unmeasured' | 'amount';

function heroAmountBranch({ valueEUR, range }: HeroAmountInputs): HeroAmountBranch {
  if (range && Math.round(range.minEUR) !== Math.round(range.maxEUR)) return 'range';
  if (Math.round(valueEUR) === 0) return 'unmeasured';
  return 'amount';
}

/**
 * Naslovni znesek pri danem deležu animacije.
 *
 * Pri deležu 1 mora biti niz ZNAK ZA ZNAK enak formatAmount(...) — to je edina
 * zahteva, ki animaciji preprečuje, da bi spremenila prikazano vrednost, in jo
 * varuje test. Razpon se zato tudi vmes izpisuje kot razpon, tudi kadar sta
 * zaokroženi meji v tistem trenutku enaki: formatEURRange bi ju strnil v eno
 * številko in izpis bi med animacijo poskakoval med eno in dvema vrednostma.
 */
export function heroAmountAtProgress(progress: number, inputs: HeroAmountInputs): string {
  const { valueEUR, range, lowConfidence } = inputs;
  const eased = Math.min(1, Math.max(0, progress));
  const branch = heroAmountBranch(inputs);

  if (branch === 'unmeasured') {
    return formatAmount(valueEUR, { range, lowConfidence });
  }

  if (branch === 'range' && range) {
    return `${formatEUR(range.minEUR * eased)} – ${formatEUR(range.maxEUR * eased)}`;
  }

  const partial = formatEUR(valueEUR * eased);
  return lowConfidence ? `najmanj ${partial}` : partial;
}

/**
 * Ali element ob nalaganju leži pod pregibom.
 *
 * Razkriv sme skriti samo tisto, česar obiskovalec še ni videl. Element, ki je
 * ob prihodu na stran že v vidnem polju, bi se ob skritju in ponovnem prikazu
 * pred očmi zabliskal — to ni razkriv, ampak utripanje vsebine.
 */
export function isBelowViewport(topPx: number, viewportHeightPx: number): boolean {
  return topPx > viewportHeightPx * 0.9;
}
