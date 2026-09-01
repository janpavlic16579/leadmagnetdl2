import type { CostBand } from './contextTypes';

/**
 * Gradniki, ki jih deli več dejavnosti.
 *
 * Doslej je administrativne razpone izvažal kontekst proizvodnje, logistika in
 * maloprodaja pa sta ju uvažali iz njega. Ob četrti dejavnosti to ni več vzdržno:
 * dejavnost bi bila odvisna od sosednje, brisanje proizvodnje pa bi podrlo vse
 * ostale. Skupno naj bo skupno, ne last prve dejavnosti, ki ga je potrebovala.
 */

/**
 * Vodstveno in pisarniško delo se med dejavnostmi razlikuje bistveno manj kot operativno.
 *
 * Sidro 2026 (SURS, zasebni sektor, oktober 2025, prevrednoteno): pisarniški uradnik
 * 20,9 EUR/h → prometni odpravnik 24,6 → nabavni referent 27,9 → špediter 28,0 →
 * komercialist 28,6 → nadzornik v proizvodnji 29,6. Spodnja meja 15 EUR ni okrogla
 * številka, ampak zakonska: pod polnim stroškom ure na minimalni plači (15,06 EUR/h)
 * ne more biti nihče. Izpeljava in viri: docs/urne-postavke.md.
 */
export const ADMIN_HOUR_BANDS: CostBand[] = [
  { id: 'do20', label: 'Do 20 EUR', midpointEUR: 18, minEUR: 15, maxEUR: 20 },
  { id: '20do25', label: '20–25 EUR', midpointEUR: 22, minEUR: 20, maxEUR: 25 },
  { id: '25do31', label: '25–31 EUR', midpointEUR: 28, minEUR: 25, maxEUR: 31 },
  { id: 'nad31', label: 'Več kot 31 EUR', midpointEUR: 36, minEUR: 31, maxEUR: 41 },
];

/*
 * Pojasnila za gumb "?" pri pojmih, ki so čez dejavnosti ENAKI.
 *
 * Kdo je "operativna ura", pove polje `help` pri vsaki dejavnosti posebej
 * (operater, voznik, prodajalec); KAKO se postavka izračuna, pa je povsod isto.
 * Sedem prepisov istega pojasnila bi se prej ali slej razšlo — in razhajanje pri
 * postavki, ki množi vse ostalo, je najdražja vrsta neskladja v tem orodju.
 */

/**
 * Polni strošek ure — pojem, ki ga obiskovalci najpogosteje zamenjajo z neto plačo.
 *
 * Režije NE vključuje, čeprav jo je prej. Razlog ni natančnost, ampak poštenost trditve:
 * sproščena ura prihrani plačo, ne najemnine in ne vodenja — ta stroška tečeta naprej.
 * Stranski učinek je, da je postavka odslej preverljiva pri SURS in Eurostatu, prej pa
 * ni bila pri nikomer (docs/urne-postavke.md).
 */
export const HOURLY_COST_EXPLAINER =
  'Bruto plača + prispevki delodajalca + regres, malica in prevoz, deljeno s približno 140 opravljenimi ' +
  'urami na mesec — brez režije, ta teče naprej tudi brez te ure. Primer: bruto 2.100 EUR → okoli 20 EUR ' +
  'na uro.';

/** Administrativna ura: isti izračun, druga vrsta dela — in pogosta zamenjava obeh. */
export const ADMIN_HOUR_EXPLAINER =
  'Isti izračun kot pri prejšnji postavki, le za pisarniško in vodstveno delo. Ni nujno dražja — ' +
  'pomembno je le, da postavk ne zamenjate, ker vsaka vrednoti svojo vrsto dela.';

/** Letni prihodek — številka iz zaključnega računa, ne promet na računu. */
export const ANNUAL_REVENUE_EXPLAINER =
  'Čisti prihodki od prodaje iz zadnjega zaključenega leta, brez DDV — ne promet z DDV in ne prilivi na ' +
  'račun. Brez tega podatka postavk, ki se računajo kot odstotek prometa, ne ocenimo.';

/** Prispevna marža — najpogosteje zamenjana s pribitkom na nabavno ceno. */
export const CONTRIBUTION_MARGIN_EXPLAINER =
  'Kar od 100 EUR prodaje ostane po neposrednih stroških prav te prodaje — ne pribitek na nabavno ceno in ' +
  'ne dobiček po vseh stroških. Primer: prodaja 100 EUR, neposredni stroški 75 EUR → 25 %.';

/** Strošek financiranja — vprašan povsod, kjer moduli množijo denar v terjatvah ali zalogah. */
export const CAPITAL_COST_EXPLAINER =
  'Koliko vas stane, da je denar vezan v terjatvah in zalogah namesto na računu: obrestna mera vašega ' +
  'posojila ali donos, ki bi ga denar prinesel drugje. Primer: pri 8 % vas 100.000 EUR zaloge stane 8.000 ' +
  'EUR na leto.';
