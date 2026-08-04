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
