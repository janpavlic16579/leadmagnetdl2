/**
 * Preverjanje vnosov iz obrazca za prevzem poročila.
 *
 * Ločeno od komponente, ker vitest teče v okolju 'node' brez jsdom — pravilo,
 * zapisano v JSX, ni testljivo. Modul je čist in brez uvozov.
 *
 * Neobvezno polje ima TRI stanja, ne dve: ni podano / podano in videti veljavno /
 * podano in ne videti veljavno. Prvo in tretje sta različni stvari — če ju
 * združimo, prazno polje blokira oddajo obrazca, ki ga sploh ne zahteva.
 */

export type OptionalFieldState = 'empty' | 'valid' | 'invalid';

/**
 * Namenoma ohlapen — prenesen znak za znak iz prejšnje različice obrazca.
 *
 * Preverjanja po e-pošti ni (aplikacija nima zaledja), zato strožji vzorec ne
 * prepreči napačnega naslova, zavrne pa veljavne robne primere. "Lead s tipkarsko
 * napako" je boljši izid kot "izgubljen lead".
 */
export function isValidEmail(value: string): boolean {
  return /\S+@\S+\.\S+/.test(value);
}

/** Obvezno besedilno polje. Imen NE omejujemo z vzorcem — glej normalizeName. */
export function isFilled(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Imena se ne preverjajo po obliki.
 *
 * Slovenska in exYU imena nosijo vezaje, opuščaje, presledke in šumnike; vsak
 * vzorec za "črke" prej ali slej zavrne resnično osebo. Nič nižje po toku od
 * oblike imena ni odvisno, zato je edina zahteva, da polje ni prazno.
 */
export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/** Telefon brez ločil, kot jih ljudje pišejo. */
export function phoneState(value: string): OptionalFieldState {
  if (!value.trim()) return 'empty';
  const digits = value.replace(/[\s\-/().]/g, '');
  return /^\+?\d{6,15}$/.test(digits) ? 'valid' : 'invalid';
}

/**
 * Davčna brez presledkov in brez predpone "SI".
 *
 * Normalizacija se sme klicati samo OB ODDAJI, ne ob vsakem pritisku tipke:
 * prepis vrednosti med tipkanjem premakne kazalec na konec polja.
 */
export function normalizeTaxNumber(value: string): string {
  return value.toUpperCase().replace(/\s/g, '').replace(/^SI/, '');
}

/**
 * Slovenska davčna številka: osem števk, prva ni 0, zadnja je kontrolna.
 *
 * Uteži 8..2 čez prvih sedem števk, kontrolna = 11 - (vsota mod 11); 10 se
 * preslika v 0, 11 pomeni neveljavno številko. Kontrolna vsota ujame zamenjani
 * števki, česar preverjanje dolžine ne zmore — in je osem vrstic čiste kode.
 */
export function isValidTaxNumber(normalized: string): boolean {
  if (!/^[1-9]\d{7}$/.test(normalized)) return false;

  let sum = 0;
  for (let index = 0; index < 7; index += 1) {
    sum += Number(normalized[index]) * (8 - index);
  }

  const remainder = 11 - (sum % 11);
  const control = remainder === 10 ? 0 : remainder;
  return control !== 11 && control === Number(normalized[7]);
}

export function taxNumberState(value: string): OptionalFieldState {
  if (!value.trim()) return 'empty';
  return isValidTaxNumber(normalizeTaxNumber(value)) ? 'valid' : 'invalid';
}
