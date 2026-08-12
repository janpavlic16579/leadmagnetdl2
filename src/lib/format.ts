// useGrouping: 'always' — sl-SI privzeto ne loči štirimestnih števil, kar da neskladen prikaz
// ("6000 EUR" poleg "60.000 EUR") v isti razčlenitvi.
const INTEGER_FORMAT = new Intl.NumberFormat('sl-SI', { maximumFractionDigits: 0, useGrouping: 'always' });

export function formatEUR(value: number): string {
  return `${INTEGER_FORMAT.format(Math.round(value))} EUR`;
}

export function formatNumber(value: number): string {
  return INTEGER_FORMAT.format(Math.round(value));
}

export function formatHours(value: number): string {
  return `${INTEGER_FORMAT.format(Math.round(value))} h`;
}

export function formatPercent(fraction: number): string {
  return new Intl.NumberFormat('sl-SI', { maximumFractionDigits: 1 }).format(fraction * 100) + ' %';
}

/**
 * "X – Y EUR" oziroma ena vrednost, kadar razpona ni. Meji se najprej zaokrožita:
 * 12.400,4 in 12.400,6 sta po zaokrožitvi ista številka in izpis "12.400 EUR –
 * 12.400 EUR" bi izgledal kot napaka.
 */
export function formatEURRange(minEUR: number, maxEUR: number): string {
  if (Math.round(minEUR) === Math.round(maxEUR)) return formatEUR(minEUR);
  return `${formatEUR(minEUR)} – ${formatEUR(maxEUR)}`;
}
