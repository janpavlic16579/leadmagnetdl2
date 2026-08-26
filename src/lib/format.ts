// useGrouping: 'always' — sl-SI privzeto ne loči štirimestnih števil, kar da neskladen prikaz
// ("6000 EUR" poleg "60.000 EUR") v isti razčlenitvi.
const INTEGER_FORMAT = new Intl.NumberFormat('sl-SI', { maximumFractionDigits: 0, useGrouping: 'always' });

export function formatEUR(value: number): string {
  return `${INTEGER_FORMAT.format(Math.round(value))} EUR`;
}

export function formatNumber(value: number): string {
  return INTEGER_FORMAT.format(Math.round(value));
}

/**
 * Ena decimalka po slovensko. `toFixed(1)` je dal "2.5", v isti aplikaciji, kjer
 * je pika ločilo tisočic ("12.400 EUR") — "2.5 strank" je bilo zato mogoče brati
 * kot pet in dvajset.
 */
export function formatDecimal(value: number): string {
  return new Intl.NumberFormat('sl-SI', { maximumFractionDigits: 1 }).format(value);
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

/**
 * Pod tem zneskom postavka ne dobi svoje kartice.
 *
 * "Sprostljiv obratni kapital: 1 EUR" ali "Nezaslužena letna marža: najmanj 45
 * EUR" pod polnim naslovom in tremi vrsticami pojasnila ne izgleda kot majhna
 * številka, ampak kot pokvarjen izračun — in vse druge zneske na strani potegne
 * s seboj v dvom. Postavka iz vsote ne izpade, le svojega poudarka ne dobi;
 * v razčlenitvi spodaj ostane vidna.
 *
 * Stoji tu in ne v ResultsSummary, ker isto pravilo velja tudi za kartice v
 * strankinem PDF: dokler je bil prag zapisan samo v komponenti, je PDF risal
 * kartice že nad 0 EUR in je isti izračun na zaslonu in v dokumentu pokazal
 * različno število kartic.
 */
export const MIN_FIGURE_EUR = 100;

/**
 * Znesek, kot ga vidi obiskovalec: razpon, "najmanj X" ali gola številka.
 *
 * Pravilo je eno samo, prikazovala pa so ga štiri mesta vsako po svoje (zaslon,
 * strankin PDF, prodajni PDF, prodajni HTML) — in vsako je bilo treba ob vsaki
 * spremembi najti. Vrstni red ni poljuben:
 *
 * 1. RAZPON ima prednost pred vsem: negotovost že pove sam, "najmanj" pred njim
 *    bi jo podvojil ("najmanj 12.000 – 19.000 EUR" ne pomeni nič).
 * 2. "NAJMANJ" pri nizki zanesljivosti: navidezno natančen znesek je slabši od
 *    poštene spodnje meje, ker vabi k ugovoru "od kod natanko ta številka".
 * 3. Sicer gola številka.
 *
 * Ničla je izjema: "najmanj 0 EUR" je prazna izjava, ki izpade kot napaka
 * izračuna. Kadar ni izmerjeno nič, to tudi pišemo.
 */
export function formatAmount(
  valueEUR: number,
  options: { range?: { minEUR: number; maxEUR: number } | null; lowConfidence?: boolean } = {},
): string {
  const { range, lowConfidence } = options;
  if (range && Math.round(range.minEUR) !== Math.round(range.maxEUR)) {
    return formatEURRange(range.minEUR, range.maxEUR);
  }
  if (Math.round(valueEUR) === 0) return 'ni izmerjeno';
  return lowConfidence ? `najmanj ${formatEUR(valueEUR)}` : formatEUR(valueEUR);
}

/**
 * YYYY-MM-DD po LOKALNEM času.
 *
 * `toISOString().slice(0, 10)` vrne datum v UTC — med polnočjo in drugo uro po
 * srednjeevropskem poletnem času je to VČERAJŠNJI dan. Strankino poročilo je
 * datum sestavljalo lokalno, prodajna priprava pa iz ISO zapisa, zato sta se
 * datoteki istega izračuna razlikovali za en dan in nista več izgledali kot par.
 */
export function isoDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
