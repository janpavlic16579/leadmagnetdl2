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
 * Sidro 2026: pisarniški uradnik 22,8 EUR/h → nabavni referent 28,6 → špediter 29,4 →
 * komercialist 30,0 → vodja proizvodnje 40,7. Spodnja meja 16 EUR ni okrogla številka,
 * ampak zakonska: pod polnim stroškom ure na minimalni plači (15,07 EUR/h) ne more biti
 * nihče. Izpeljava in viri: docs/urne-postavke.md.
 */
export const ADMIN_HOUR_BANDS: CostBand[] = [
  { id: 'do22', label: 'Do 22 EUR', midpointEUR: 19, minEUR: 16, maxEUR: 22 },
  { id: '22do29', label: '22–29 EUR', midpointEUR: 25, minEUR: 22, maxEUR: 29 },
  { id: '29do38', label: '29–38 EUR', midpointEUR: 33, minEUR: 29, maxEUR: 38 },
  { id: 'nad38', label: 'Več kot 38 EUR', midpointEUR: 45, minEUR: 38, maxEUR: 55 },
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
  'Ni neto izplačilo in ne le bruto plača, ni pa tudi režija (prostor, oprema, vodenje) — ta teče naprej, ' +
  'tudi ko uro sprostite. Bruto plači prištejte prispevke delodajalca (17,1 %) ter regres, malico in prevoz, ' +
  'nato delite s približno 140 opravljenimi urami na mesec — leto ima okoli 1.700 produktivnih ur, ne 2.088 ' +
  'plačanih. Primer: bruto 2.100 EUR → približno 20 EUR na uro. Če postavke ne poznate, izberite razpon spodaj.';

/** Administrativna ura: isti izračun, druga vrsta dela — in pogosta zamenjava obeh. */
export const ADMIN_HOUR_EXPLAINER =
  'Isti izračun kot pri prejšnji postavki, le za pisarniško in vodstveno delo: bruto plača + prispevki ' +
  'delodajalca + regres, malica in prevoz, deljeno s približno 140 opravljenimi urami na mesec. Ta ura ni ' +
  'nujno dražja od operativne — pomembno je le, da ju ne zamenjate, ker vsaka vrednoti svojo vrsto dela. ' +
  'Če je ne poznate, izberite razpon.';

/** Letni prihodek — številka iz zaključnega računa, ne promet na računu. */
export const ANNUAL_REVENUE_EXPLAINER =
  'Vzemite čiste prihodke od prodaje iz zadnjega zaključenega leta (izkaz poslovnega izida), brez DDV. ' +
  'Ni to promet z DDV in ni vsota prilivov na bančnem računu. Kadar razpona ne izberete, ostanejo postavke, ' +
  'ki se računajo kot odstotek prometa, neocenjene — prihodka si ne izmišljamo.';

/** Prispevna marža — najpogosteje zamenjana s pribitkom na nabavno ceno. */
export const CONTRIBUTION_MARGIN_EXPLAINER =
  'Ni pribitek na nabavno ceno in ni dobiček po vseh stroških. Od 100 EUR prodaje odštejte neposredne ' +
  'stroške prav te prodaje (našteti so zgoraj) — kar ostane, je prispevna marža. Primer: prodaja 100 EUR, ' +
  'neposredni stroški 75 EUR → marža 25 %. Če je ne veste, izberite razpon spodaj.';

/** Strošek financiranja — vprašan povsod, kjer moduli množijo denar v terjatvah ali zalogah. */
export const CAPITAL_COST_EXPLAINER =
  'Koliko vas stane, da je denar vezan v terjatvah in zalogah namesto na računu. Če imate posojilo ali ' +
  'limit, vpišite njegovo obrestno mero; sicer tisto, kar bi denar prinesel drugje. Primer: 8 % pomeni, ' +
  'da 100.000 EUR, vezanih v zalogi, stane 8.000 EUR na leto. Če niste prepričani, izberite razpon.';
