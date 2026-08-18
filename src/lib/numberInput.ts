/**
 * Branje števil, kot jih vpiše slovenski uporabnik.
 *
 * `<input type="number">` se je izkazal za past: decimalno ločilo prevzame po
 * jeziku BRSKALNIKA in ne strani. V Chromu z angleškim vmesnikom — v slovenskih
 * podjetjih pogost — tipka "," ni sprejeta, zato "22,5" pristane kot **225**.
 * Brez opozorila, ker je 225 veljavno število; urna postavka se s tem podeseteri
 * in z njo vsak znesek v poročilu. Na iOS pa `inputMode="numeric"` prikaže
 * številčnico brez ločila, tako da decimalke sploh ni mogoče vpisati.
 *
 * Rešitev je besedilno polje z lastnim razčlenjevalnikom: vejica in pika sta
 * enakovredni, presledki (ročno vpisane tisočice) pa se zavržejo.
 */

/** Presledki, ki jih ljudje vpisujejo kot ločilo tisočic — vključno z nedeljivim. */
const SPACES = /[\s  ]/g;

/**
 * Niz → število. `null` pomeni "ni (še) veljavne številke": prazno polje, sam
 * minus, sama vejica ali karkoli, česar ni mogoče prebrati. Klicatelj tedaj ve,
 * da vrednosti ni — in ne dobi 0, ki bi se od vpisane ničle ne razlikovala.
 */
export function parseNumberInput(raw: string): number | null {
  const normalized = raw.replace(SPACES, '').replace(',', '.');
  if (normalized === '') return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/**
 * Število → niz za polje, v slovenskem zapisu.
 *
 * Nasprotna smer od parseNumberInput in nujna zaradi nje: kdor vpiše "22,5",
 * mora ob izhodu iz polja videti "22,5" in ne "22.5". Brez tega bi polje
 * uporabnika popravljalo v tuj zapis vsakič, ko bi ga zapustil.
 */
export function formatNumberInput(value: number | null): string {
  return value === null ? '' : String(value).replace('.', ',');
}

export interface ClampOptions {
  min?: number;
  max?: number;
  /** Zaokroži na celo število — za polja, kjer pol zaposlenega nima pomena. */
  integer?: boolean;
}

/**
 * Vrednost v dovoljenih mejah.
 *
 * Atributa `min`/`max` na polju ustavita samo puščici, ne tipkanja: vtipkani −20
 * EUR/h je doslej prišel v izračun in dal "−9.600 EUR" izgubljene kapacitete,
 * `1e400` pa Infinity in z njim "∞ EUR" oziroma "NaN EUR" v rezultatih.
 */
export function clampNumber(value: number, { min = 0, max, integer }: ClampOptions = {}): number {
  if (!Number.isFinite(value)) return min;
  let clamped = Math.max(min, value);
  if (max !== undefined) clamped = Math.min(max, clamped);
  return integer ? Math.round(clamped) : clamped;
}
