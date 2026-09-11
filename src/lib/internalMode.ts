/**
 * Interni način: prodajna priprava se ponudi v prenos, rezultati nosijo oznako
 * "[interno]", obisk se v lijaku šteje kot interni. Namenjen pregledu vsebine
 * na objavljeni strani, ne obiskovalcem.
 *
 * Vklopi ga `?debug=<žeton>`, kjer je žeton VITE_INTERNAL_TOKEN iz gradnje;
 * brez žetona v gradnji je način izklopljen. Nekoč je zadoščal `?debug=1`, kar
 * je pomenilo, da je interni dokument O stranki (ocena ustreznosti, ugovori,
 * priporočilo licenc) dosegljiv vsakomur, ki poskusi. Žeton je zaradi predpone
 * VITE_ v javnem svežnju, torej ni skrivnost — je pa neuganljiv, kar tu
 * zadošča: varuje pred poskusom, ne pred branjem kode strani.
 *
 * En sam vir za oba klicatelja (App.tsx in lib/funnel.ts): dva zapisa istega
 * pogoja sta se že razšla in obisk bi bil lahko interni v lijaku, ne pa v
 * aplikaciji — ali obratno.
 */
export function isInternalMode(search: string, token: unknown = import.meta.env.VITE_INTERNAL_TOKEN): boolean {
  if (typeof token !== 'string') return false;
  const expected = token.trim();
  if (expected === '') return false;
  return new URLSearchParams(search).get('debug') === expected;
}
