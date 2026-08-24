# Urne postavke: od kod so številke

Ta dokument je vir za razpone urnih postavk v koraku **Skupna finančna osnova**
(`src/config/contexts/`). Obstaja zato, ker je kalkulator prej ponujal postavke, ki jih ni
bilo mogoče preveriti pri nikomer: utemeljitve v kodi so bile izključno relativne
("voznikova ura ni operaterjeva"), absolutnega sidra pa ni bilo nikjer. Postavke množijo
ure v vseh modulskih formulah, zato se napaka v njih prenese v vsak prikazan znesek.

Poizvedbe so bile opravljene **24. avgusta 2026**. Vse številke veljajo za Slovenijo.

Ta dokument pove, **kaj velja zdaj**. Kaj smo primerjali, kaj se ni ujemalo in zakaj se je
postavka premaknila, pove zapisnik preverbe:
[`urne-postavke-raziskava-2026-08.md`](urne-postavke-raziskava-2026-08.md). Tam so tudi
klici API-jev, s katerimi preverbo ponovite, in pregled zadnjih treh let po dejavnostih.
Prvi zapisnik iz avgusta 2026 ([`urne-postavke-raziskava-2026.md`](urne-postavke-raziskava-2026.md))
ostaja kot zapis prejšnjega stanja.

---

## Kaj postavka pomeni

**Polni strošek ure = strošek dela, brez režije.**

Prej je vprašanje zahtevalo "bruto plačo z vsemi prispevki in režijo". Režija je izpadla iz
dveh razlogov. Prvi je poštenost trditve: kalkulator meri, kaj podjetje prihrani, ko se ura
sprosti — sproščena ura prihrani plačo, ne pa najemnine, amortizacije in vodenja, ki tečejo
naprej. Drugi je preverljivost: strošek dela je javno objavljen podatek, "delo plus režija"
pa ni podatek nikogar.

```
strošek ure = (bruto mesečna plača × 12 × 1,171 + 4.787 EUR) / 1.700 ur
```

| Člen | Vrednost | Opomba |
|---|---|---|
| Prispevki delodajalca | 17,10 % bruto plače | glej razčlenitev spodaj |
| Regres, malica, prevoz | ~4.787 EUR/leto | glej razčlenitev spodaj |
| Produktivne ure | 1.700/leto | 2.088 plačanih ur minus dopust, prazniki in bolniške |

### Prispevki delodajalca: 17,10 %

| Prispevek | Stopnja |
|---|---|
| Pokojninsko in invalidsko zavarovanje | 8,85 % |
| Zdravstveno zavarovanje | 6,56 % |
| Poškodbe pri delu in poklicne bolezni | 0,53 % |
| Starševsko varstvo | 0,10 % |
| Zaposlovanje | 0,06 % |
| **Vmesna vsota** | **16,10 %** |
| Obvezno zavarovanje za dolgotrajno oskrbo (ZDOsk-1) | 1,00 % |
| **Skupaj** | **17,10 %** |

Prispevek za dolgotrajno oskrbo velja **od 1. julija 2025**: 1 % plača zavarovanec in 1 %
delodajalec. Do avgusta 2026 je kalkulator računal s staro stopnjo 16,10 % in jo je v
pojasnilu pod vprašanjem tudi *pokazal* obiskovalcu — kar je dražje od dveh evrov razlike v
rezultatu, ker računovodja ob napačni stopnji upravičeno preneha zaupati vsemu ostalemu.

### Regres, malica, prevoz: 4.787 EUR

| Postavka | Letno | Podlaga |
|---|---|---|
| Regres za letni dopust | 1.482 EUR | zakonski minimum je enak minimalni plači (1.481,88 EUR) |
| Malica | 1.695 EUR | 7,96 EUR/dan neobdavčeno × ~213 dejansko opravljenih dni |
| Prevoz na delo | 1.610 EUR | neobdavčeno 0,21 EUR/km oziroma **najmanj 140 EUR/mesec** |
| **Skupaj** | **4.787 EUR** | |

Regres se v bruto plačo SURS **ne** všteva, zato prištevanje ni dvojno štetje: izredna
izplačila, ki v bruto plačo štejejo (13. plača, nagrade), znašajo v Sloveniji le okoli
283 EUR na zaposlenega letno (SURS `0701029S`, meritev 7, julij 2025 – junij 2026).

Prejšnja ocena 4.000 EUR je bila prenizka iz dveh razlogov. Regres je vezan na minimalno
plačo, ta pa je 1. januarja 2026 poskočila s 1.277,72 na **1.481,88 EUR** (+15,97 %) — kar
je največji enkraten dvig doslej in bistveno več od 5,9-odstotne rasti povprečne plače.
Prevoz je bil ocenjen na 900 EUR/leto, kar je pod neobdavčenim minimumom 140 EUR/mesec.

Tudi 4.787 EUR je še vedno spodnja ocena: vsi trije členi so vzeti po **zakonskih
minimumih oziroma zgornjih neobdavčenih mejah**, nacionalni računi pa za povprečnega
zaposlenega kažejo približno **5.960 EUR** dodatkov nad ozko bruto plačo. Razlika je
zavestna in je razlog, da privzetki niso izpeljani samo iz te formule.

### Zakaj 1.700 ur in ne 2.088

Delitelj je namenoma **opravljena** in ne plačana ura: podjetje plača 2.088 ur, dobi jih
okoli 1.700, strošek pa nosi celotni. Delitev s plačanimi urami bi postavko podcenila za
približno petino.

| Korak | Ure |
|---|---|
| Fond plačanih ur (261 dni × 8) | 2.088 |
| − prazniki na delovni dan (7 dni v 2026) | 2.032 |
| − letni dopust (26 dni, povprečje zasebnega sektorja) | 1.832 |
| − bolniška (5,7 % izgubljenih dni ≈ 15 delovnih dni) | 1.712 |
| − izobraževanje in izredni dopust (~1,5 dneva) | **1.700** |

Preračun se izide na 1.692; 1.700 ostane kot okrogla vrednost znotraj natančnosti vhodnih
podatkov.

**Ta delitelj je verjetno za nekaj odstotkov previsok.** Nacionalni računi kažejo 1.571
opravljenih ur na zaposlenega (2025). Del razlike gre res na račun dela s krajšim delovnim
časom — a v razmerju *strošek na uro* se krajši delovni čas večinoma izniči, ker skrajša
tako števec kot imenovalec. Popravljeno za približno 9-odstotni delež zaposlenih s krajšim
delovnim časom znaša polni delovni čas okoli 1.640 ur, ne 1.700. Zato se privzetki ne
opirajo samo na to formulo — glej [Izmerjeni strošek dela](#izmerjeni-strošek-dela--druga-pot-do-iste-številke).

### Spodnja meja, ki je ni mogoče podkoračiti

Delavec na minimalni plači stane **15,07 EUR/h** polnega stroška:

```
(1.481,88 × 12 × 1,171 + 4.787) / 1.700 = 15,07 EUR/h
```

Noben pas v kalkulatorju se zato ne začne pod 15 EUR. Pred to kalibracijo je šest naborov
imelo spodnjo mejo pri 12–14 EUR — vrednosti, ki jih v Sloveniji 2026 ne more imeti nihče,
zaposlen za polni delovni čas.

---

## Sidra

### Plače po poklicih — glavni vir

SURS, strukturna statistika plač, SiStat tabela **`0711360S`** — plače po skupinah
poklicev SKP-08, **ločeno za zasebni in javni sektor**, z referenčnimi meseci
**oktober 2023, 2024 in 2025**. Zadnja objava je bila 16. aprila 2026.

Do avgusta 2026 je ta dokument trdil, da je zadnje razpoložljivo leto 2022 in da bo
preračun iz razmerij še nekaj let edina pot. To ne drži več: strukturna statistika
plač po poklicih izhaja odslej **letno**, aprila za prejšnji oktober. Ekstrapolacija
plač 2022 s faktorjem rasti povprečne plače je zato odpadla — z njo pa tudi napaka,
ki jo je vnašala (prestrelila je za 5–10 %, ker so se razmerja med poklici v treh
letih premaknila bolj, kot je bilo predpostavljeno).

Vzet je **zasebni sektor**, ne skupno povprečje. Razlika ni majhna: oktobra 2025 je
bilo skupno povprečje 2.519 EUR, zasebno pa 2.324 EUR — javni sektor dvigne povprečje
za 8,4 %. Ciljno podjetje kalkulatorja je zasebno MSP, zato je javni sektor v sidru
motnja in ne del slike.

Plače oktobra 2025 so prevrednotene na **avgust 2026** s panožnim faktorjem rasti iz
mesečne statistike plač (tabela `0701029S`, drseče 12-mesečno povprečje, junij 2026 /
junij 2025): predelovalne dejavnosti +3,8 %, trgovina +3,8 %, prevoz in skladiščenje
+3,4 % do +5,5 %, računovodske dejavnosti +5,7 %, skupno +4,9 %.

Poleg povprečja je navedena tudi **mediana**: povprečje poklicne skupine vlečejo navzgor
redki visoki izplačevalci, za ciljno podjetje z 10–249 zaposlenimi pa je mediana bližje
resnici. Realen razpon dejavnosti leži med obema stolpcema, privzetek pa med njima.

Stolpec **EUR/h** ni gola izpeljava iz plače: je sredina dveh poti — formule zgoraj in
izmerjenega stroška dela iz nacionalnih računov (razdelek za tem). Zakaj ne le formula,
pojasni prav ta razdelek.

| Poklic (SKP-08) | okt. 2023 | okt. 2024 | okt. 2025 | mediana 2025 | **EUR/h** | EUR/h iz mediane |
|---|---|---|---|---|---|---|
| 9334 Delavec za polnjenje polic | — | — | — | 1.525 | — | 16,4 |
| 5223 Prodajalec | 1.576 | 1.702 | 1.731 | 1.626 | **18,4** | 17,4 |
| 82 Sestavljavci strojev in izdelkov | 1.544 | 1.659 | 1.743 | 1.664 | **18,5** | 17,7 |
| 5230 Blagajnik | — | — | 1.754 | 1.646 | **18,6** | 17,6 |
| 8332 Voznik težkega tovornjaka | 1.619 | 1.763 | 1.869 | 1.651 | **19,9** | 17,7 |
| 933 Preprosta transportna in skladiščna dela | 1.653 | 1.760 | 1.872 | 1.753 | **19,9** | 18,7 |
| 9333 Delavec za preprosta prekladalna dela | 1.664 | 1.761 | 1.876 | 1.741 | **20,0** | 18,6 |
| 7212 Varilec | 1.596 | 1.863 | 1.968 | 1.820 | **20,7** | 19,3 |
| 4321 Skladiščnik, uradnik za nabavo in prodajo | 1.776 | 1.917 | 1.976 | 1.864 | **20,8** | 19,7 |
| 8211 Sestavljavec mehanskih strojev | — | — | 1.974 | 1.804 | **20,8** | 19,1 |
| 8 Upravljavci strojev, operaterji | 1.731 | 1.882 | 1.981 | 1.844 | **20,9** | 19,5 |
| 4110 Uradnik za splošno pisarniško poslovanje | 1.725 | 1.859 | 1.962 | 1.844 | **20,9** | 19,7 |
| 7222 Orodjar | — | — | — | 2.080 | — | 21,8 |
| 81 Upravljavci strojev in naprav | 1.911 | 2.071 | 2.152 | 2.078 | **22,5** | 21,8 |
| 7223 Strugar | 1.947 | 2.095 | 2.209 | 2.118 | **23,1** | 22,2 |
| 2166 Grafični in multimedijski oblikovalec | 2.105 | 2.225 | 2.307 | 2.097 | **24,0** | 22,0 |
| — **povprečje vseh zaposlenih v zasebnem sektorju** | 2.045 | 2.208 | 2.324 | 1.966 | **24,5** | 20,9 |
| 4323 Prometni odpravnik, referent za transport | 2.059 | 2.217 | 2.333 | 2.117 | **24,6** | 22,4 |
| 7233 Mehanik, serviser industrijskih strojev | 2.106 | 2.265 | 2.404 | 2.256 | **25,0** | 23,5 |
| 7412 Elektromehanik | 2.055 | 2.310 | 2.422 | 2.244 | **25,2** | 23,4 |
| 4311 Uradnik v računovodstvu | 2.180 | 2.305 | 2.402 | 2.214 | **25,4** | 23,6 |
| 3313 Knjigovodja | 2.138 | 2.280 | 2.428 | 2.232 | **25,7** | 23,7 |
| 3115 Tehnik za strojništvo | 2.354 | 2.513 | 2.685 | 2.492 | **27,7** | 25,8 |
| 4322 Uradnik za izračune količin v proizvodnji | 2.298 | 2.438 | 2.658 | 2.512 | **27,8** | 26,3 |
| 3323 Nabavni referent | 2.373 | 2.533 | 2.672 | 2.444 | **27,9** | 25,7 |
| 3331 Špediter | 2.428 | 2.541 | 2.675 | 2.506 | **28,0** | 26,3 |
| 3322 Komercialni zastopnik za prodajo | 2.458 | 2.607 | 2.736 | 2.394 | **28,6** | 25,2 |
| 3122 Nadzornik v predelovalnih dejavnostih | 2.546 | 2.738 | 2.843 | 2.624 | **29,6** | 27,4 |
| 2149 Strokovnjak tehnično-tehnoloških strok | 2.797 | 2.949 | 3.119 | 2.880 | **32,0** | 29,6 |
| 2141 Inženir, tehnolog v industriji in proizvodnji | 2.869 | 3.102 | 3.244 | 3.081 | **33,2** | 31,6 |
| 2411 Strokovnjak za računovodstvo in revizijo | 2.955 | 3.118 | 3.296 | 2.932 | **34,4** | 30,7 |
| 2514 Programer računalniških aplikacij | 3.005 | 3.236 | 3.383 | 3.125 | **34,6** | 32,0 |
| 2144 Inženir strojništva | 3.164 | 3.355 | 3.504 | 3.188 | **35,8** | 32,7 |
| 1420 Menedžer v trgovini | — | — | 3.575 | 2.718 | **36,9** | 28,4 |
| 1324 Menedžer za nabavo, logistiko, skladiščenje | 3.347 | 3.597 | 3.706 | 3.118 | **38,2** | 32,4 |
| 1321 Menedžer za proizvodnjo | 3.522 | 3.652 | 3.824 | 3.212 | **39,4** | 33,3 |

**Skok minimalne plače je pomemben in ga povprečje skrije.** Januarja 2026 je minimalna
plača zrasla s 1.277,72 na 1.481,88 EUR (+15,97 %). Oktobra 2025 je bil **spodnji
kvartil skoraj vsakega operativnega poklica pod to mejo** — prodajalec 1.425 EUR,
voznik 1.415, sestavljavec 1.444, varilec 1.437, pisarniški uradnik 1.440. V teh
poklicih je torej najmanj četrtina zaposlenih dobila dvig, večji od panožnega
povprečja; pri prodajalcu, blagajniku in polnjenju polic je učinek vračunan posebej
in ne prek panožnega faktorja.

### Plače po dejavnostih — kontrola

SURS (SiStat tabela `0701029S`), drseče 12-mesečno povprečje, zadnji podatek **junij
2026**, po klasifikaciji **SKD 2025**. Črke sektorjev se od SKD 2008 razlikujejo:
strokovne dejavnosti so zdaj `N` (prej `M`), informatika je izločena v `K`.

| Dejavnost (SKD 2025) | 2023 | 2024 | 2025 | jun. 2026 | rast 3 leta | EUR/h |
|---|---|---|---|---|---|---|
| — vse dejavnosti skupaj | 2.255 | 2.395 | 2.536 | 2.626 | +16,5 % | **26,3** |
| C PREDELOVALNE DEJAVNOSTI | 2.230 | 2.381 | 2.467 | 2.552 | +14,4 % | **25,5** |
| C25 Proizvodnja kovinskih izdelkov, razen strojev in nap | 2.037 | 2.196 | 2.273 | 2.346 | +15,2 % | **23,6** |
| C28 Proizvodnja strojev in naprav, d. n. | 2.413 | 2.549 | 2.642 | 2.732 | +13,2 % | **27,3** |
| G TRGOVINA | 2.114 | 2.241 | 2.320 | 2.403 | +13,6 % | **24,1** |
| G46 Trgovina na debelo | 2.473 | 2.598 | 2.692 | 2.777 | +12,3 % | **27,7** |
| G47 Trgovina na drobno | 1.876 | 2.004 | 2.065 | 2.146 | +14,4 % | **21,7** |
| H PREVOZ IN SKLADIŠČENJE | 1.999 | 2.151 | 2.240 | 2.303 | +15,2 % | **23,2** |
| H49.41 Cestni tovorni prevoz | 1.592 | 1.711 | 1.802 | 1.873 | +17,7 % | **19,1** |
| H52.10 Skladiščenje | 1.707 | 1.813 | 1.840 | 1.941 | +13,7 % | **19,8** |
| H52.25 Logistične storitve | 2.251 | 2.395 | 2.478 | 2.563 | +13,9 % | **25,7** |
| N STROKOVNE, ZNANSTVENE IN TEHNIČNE DEJAVNOSTI | 2.584 | 2.732 | 2.833 | 2.918 | +13,0 % | **29,0** |
| N69.20 Računovodske, knjigovodske in revizijske dejavnos | 2.152 | 2.289 | 2.414 | 2.520 | +17,1 % | **25,3** |
| N70 Dejavnost uprav podjetij, podjetniško in poslovno sv | 2.575 | 2.711 | 2.744 | 2.807 | +9,0 % | **28,0** |
| N71.12 Inženirska dejavnost in s tem povezano svetovanje | 2.589 | 2.762 | 2.869 | 2.977 | +15,0 % | **29,6** |
| K62 Računalniško programiranje, svetovanje in druge s te | 3.316 | 3.511 | 3.634 | 3.711 | +11,9 % | **36,5** |

To so povprečja **celotne panoge, vključno z vodstvom**, zato so nad postavko posameznega
operativnega poklica. Uporabna so kot zgornja meja verjetnosti, ne kot sidro.

**Cestni tovorni prevoz je izjema, ki je iz plače ni videti.** Panožno povprečje 1.873 EUR
(junij 2026) je nižje od izpeljanega voznika (19,4 EUR/h), ker mednarodni prevozniki velik
del prejemka izplačajo kot dnevnice, ki v bruto plačo ne štejejo. Dejanski denarni strošek
voznikove ure je bistveno višji od plačilne liste — zato je zgornji pas v logistiki
upravičeno visok.

### Izmerjeni strošek dela — druga pot do iste številke

Formula zgoraj sešteje strošek iz plače navzgor. Obstaja pa tudi meritev, ki isto
številko pove naravnost: nacionalni računi delijo **sredstva za zaposlene (D.1)** z
**dejansko opravljenimi urami**. Za Slovenijo (Eurostat `nama_10_a10`, `nama_10_a10_e`):

| Leto | D.1 (mio EUR) | Opravljene ure (mio) | Zaposleni (tis.) | **EUR na opravljeno uro** | ur/zaposlenega |
|---|---|---|---|---|---|
| 2022 | 29.526 | 1.367 | 872,9 | **21,59** | 1.567 |
| 2023 | 32.696 | 1.372 | 881,9 | **23,82** | 1.556 |
| 2024 | 34.740 | 1.395 | 882,2 | **24,90** | 1.581 |
| 2025 | 37.194 | 1.375 | 875,3 | **27,05** | 1.571 |

Meritev je zanesljiva: za leto 2020 da 19,95 EUR/h, raziskava o stroških dela
(Eurostat `lc_ncost_r2`) pa za isto leto 19,96 EUR/h. Ujemanje na dve decimalki ni
naključje — obe merita isto stvar.

**Formula je proti tej meritvi za 12,4 % prenizka.** Pri povprečni plači 2.536 EUR
(2025) da 23,78 EUR/h, meritev pa 27,05. Razlika je v dveh členih in oba sta v formuli
podcenjena:

| Člen | Formula | Meritev | Razlika |
|---|---|---|---|
| Dodatki nad bruto plačo | 4.787 EUR | ~5.960 EUR | formula −20 % |
| Opravljene ure | 1.700 | ~1.571 | formula +8 % |
| Skupaj strošek/leto | 40.423 EUR | 42.493 EUR | formula −4,9 % |

Dodatek 5.960 EUR je razlika med **D.11 (plače in nadomestila)** na zaposlenega
(36.392 EUR v 2025) in ozko definirano bruto plačo SURS (30.432 EUR). Vsebuje regres,
malico in prevoz — torej iste postavke kot formula, le da so v formuli vzete po
zakonskih minimumih, v resnici pa so višje.

Zato **privzetki niso izpeljani samo iz formule, ampak kot sredina obeh poti**:

- **Pot A — formula:** `(bruto × 12 × 1,171 + 4.787) / 1.700`.
- **Pot B — izmerjeni strošek:** 28,2 EUR/h za poslovno gospodarstvo 2026, skaliran z
  razmerjem plače poklica do povprečja.

Pot A sama bi vse prihranke sistematično podcenila za dobro desetino, pot B sama pa
prenaša predpostavko, da strošek raste sorazmerno s plačo — kar pri nizko plačanih ne
drži povsem, ker so dodatki pavšalni in zato relativno težji. Sredina obeh je manj
napačna od vsake posebej.

**Velikost podjetja ni razlog za popust.** Eurostatova raziskava o stroških dela
(`lc_ncost_r2`, velikostni razredi) kaže, da podjetja z 10–49 zaposlenimi plačajo
96 % povprečnega stroška na uro in podjetja s 50–249 zaposlenimi 104 % — torej
praktično povprečje. Cenejša so le mikro podjetja pod 10 zaposlenih (84 %), ki pa
niso ciljna skupina.

Za primerjavo, Eurostat `lc_lci_lev` (raven stroška dela po dejavnostih, 2025):
poslovno gospodarstvo 30,0 EUR/h, predelovalne dejavnosti 29,8, trgovina 28,8, promet
in skladiščenje 26,2, strokovne dejavnosti 36,2, informacijske 38,3. Ta serija je za
neraziskovalna leta ocenjena z indeksom in od nacionalnih računov odstopa za nekaj
odstotkov navzgor; uporabljena je kot zgornja meja verjetnosti, ne kot sidro.

### Kolektivne pogodbe — zakaj niso uporabne kot sidro

Najnižje osnovne plače po kolektivnih pogodbah so večinoma **pod** zakonsko minimalno
plačo. Kolektivna pogodba dejavnosti trgovine (velja do 31. 10. 2026) določa I. tarifni
razred pri 930,30 EUR, IV. pri 1.092,42 in VII. pri 1.605,40 EUR — pri minimalni plači
1.481,88 EUR to pomeni, da dejansko plačo v spodnjih razredih določa minimalna plača in ne
kolektivna pogodba. Kot spodnja meja je zato uporabna minimalna plača, ne tarifna priloga.

### Zaračunana postavka — drugo sidro

`storitve.chargeOutRate` ni strošek, ampak cena, zato zanjo plače ne povedo nič. Sidra so
objavljeni ceniki.

**IZS, priporočene vrednosti urnih postavk za 2026** (temeljna vrednost storitve 72,52
EUR/h, priporočeno odstopanje do ±15 %):

| Storitveni razred | KSR | 2026 | 2025 |
|---|---|---|---|
| S1 delo po navodilih | 0,7 | 50,76 | 49,00 |
| S2 nezahteven objekt | 0,85 | 61,64 | 59,50 |
| S3 zahteven objekt (TVS) | 1,0 | **72,52** | 70,00 |
| S4 zelo zahtevne naloge | 1,4 | 101,53 | 98,00 |
| S5 izjemno zahtevne naloge, izvedenstvo | 2,1 | 152,29 | 147,00 |

**GZS, Združenje za informatiko in telekomunikacije — referenčni cenik IKT:** pomožna dela
32 EUR/h, serviser 42, administrator in programer I 58, analitik in sistemski inženir 79,
informacijski arhitekt 95, svetovalec in programer III 114, ekspert 143.

**Računovodske storitve, tržne cene:** knjiženje 50–63 EUR/h (nezavezanec za DDV), 63–75
(zavezanec), 75–88 (zelo zahtevno); svetovanje 81–110 do 160–190 EUR/h.

**Razvoj programske opreme:** povprečen programer 50 EUR/h, front-end 50–70, samostojni
razvijalec (s. p.) 25–45.

Sredina trga za splošno storitveno podjetje je zato **50–72 EUR/h**. Najnižji pas se začne
pri 30 EUR: pod 32 EUR (pomožna dela po ceniku GZS) ni nobene objavljene postavke.

---

## Zakaj se razponi med dejavnostmi razlikujejo

Ker se razlikujejo poklici, ki jih vprašanje opisuje. Kjer je razlika samo v besedah in ne v
poklicih, je nabor namenoma isti — logistika in veleprodaja obe merita skladiščnika in
komisionarja, zato imata enak nabor.

Trije nabori odstopajo od gole izpeljave, vsak s svojim razlogom:

- **Maloprodaja** ima spodnji pas nad izpeljavo iz plače prodajalca: poslovalnica dela ob
  sobotah, praznikih in v izmenah, dodatki pa to uro sistematično dvignejo.
- **Logistika** ima zgornji pas višje, kot bi sledilo iz plače voznika: mednarodni prevoz z
  dnevnicami uro dvigne bistveno nad plačilno listo.
- **Storitve** imajo najširši nabor v kalkulatorju, ker segment pokriva najširši razpon
  poklicev — mehanik in serviser na eni strani, inženir strojništva in programer na drugi.
  Posledica je zavestna: rezultat se pri izbranem pasu pogosteje prikaže kot razpon in ne
  kot ena številka.

**Sidro ni nujno prvi našteti poklic.** Logistika in veleprodaja nista usidrani na
voznika, čeprav ga vprašanje našteva prvega: po plači je na dnu naštetih poklicev
(19,4 EUR/h proti skladiščnikovim 20,3), zato sredina pripada skladiščniku. Isto velja
za administrativno uro: vprašanje našteva planerja, vodjo proizvodnje in nabavo
(27,0–37,7 EUR/h), pisarniški uradnik (20,4) pa je spodnji rob in ne sredina.

**Postavka ni košarica enega poklica, ampak vseh naštetih.** Vsak privzetek je izpeljan
iz povprečja in mediane celotne košarice poklicev, ki jih vprašanje omenja v polju
`help` — ne iz enega izbranega. Katera košarica pripada kateremu segmentu, je zapisano
v zapisniku preverbe.

---

## Kje se te številke pojavijo obiskovalcu

`fallbackEUR` v `src/config/contexts/` ni le tiha rezerva — je **povprečje panoge**, ki ga
obiskovalec vidi in lahko prevzame z enim klikom ("Ne vem — vzemi povprečje panoge (21 EUR/h)").
Zato ni interna konstanta: je trditev, ki jo mora podpirati tabela zgoraj.

Prevzeto povprečje se **ne obravnava kot vnos**. Izračun teče z mejama pasu, v katerem povprečje
leži (`industryAverageBand`), rezultat se prikaže kot razpon, zanesljivost pa pade enako kot ob
izbranem razponu — številka je naša ocena in ne meritev tega podjetja. V prodajni pripravi in v
izvozu za CRM je zapisana kot svoj vir (`industryAverage`), da prodajnik ne bere ocene kot
strankin podatek.

Dve posledici za kalibracijo:

- **Povprečje mora ležati v natanko enem pasu.** Brez pasu bi gumb tiho vrnil točko, na meji
  dveh pasov pa bi bil rezultat odvisen od vrstnega reda v konfiguraciji. Drži test v
  `src/config/contexts/contexts.test.ts`.
- **Ujemanje s sredino pasu ni prepovedano.** Prejšnja zahteva ("privzetek se ne sme ujemati
  z nobeno sredino") je varovala rekonstrukcijo izbranega pasu po vrednosti; odkar
  `CostAssumption.source` izvor zapiše, te rekonstrukcije ni nikjer. Sredine so kljub temu
  izbrane tako, da se s privzetkom ne ujemajo — cene to nič ne stane.

### Trenutne vrednosti

| Vprašanje | Privzetek | Pasovi | Prej |
|---|---|---|---|
| Proizvodnja, operativna ura | 21 | do 17 · 17–20 · 20–25 · nad 25 | 23 |
| Logistika, operativna ura | 20 | do 17 · 17–19 · 19–23 · nad 23 | 22 |
| Veleprodaja, operativna ura | 20 | do 17 · 17–19 · 19–23 · nad 23 | 22 |
| Maloprodaja, operativna ura | 19 | do 17 · 17–20 · 20–24 · nad 24 | 21 |
| Storitve, izvedbena ura | 29 | do 22 · 22–28 · 28–35 · nad 35 | 32 |
| Računovodstvo, operativna ura | 25 | do 19 · 19–24 · 24–30 · nad 30 | 26 |
| Splošno, operativna ura | 20 | do 17 · 17–19 · 19–23 · nad 23 | 23 |
| Administrativna ura (skupna) | 26 | do 20 · 20–25 · 25–31 · nad 31 | 27 |
| Računovodstvo, vodstvena ura | 33 | isti nabor kot administrativna | 34 |
| Storitve, zaračunana postavka | 55 | do 42 · 42–60 · 60–85 · nad 85 | 55 |

Iste vrednosti nosi tudi `DEFAULT_COST_CONTEXT` v `src/config/modules/moduleTypes.ts`
(20 / 26 / 55) — zasilna rezerva za module brez konteksta, usklajena s segmentom
`splosno`, ker se uporabi prav takrat, ko dejavnosti ne poznamo.

**Meje pasov niso izbrane na roko.** So kvartili dejanske porazdelitve plač v košarici
poklicev, ki jo vprašanje opisuje: spodnja meja drugega pasu je prvi kvartil, srednja
mediana, zgornja tretji kvartil. Dno vseh nizov je 15 EUR, ker delavec na minimalni
plači 2026 stane 15,06 EUR/h.

---

## Kdaj to preveriti znova

Razmerja med poklici se premikajo počasi, ravni plač pa ne. Sprožilci za nov preračun:

- **SURS objavi novo strukturno statistiko plač po poklicih.** Odslej izhaja **letno,
  aprila za prejšnji oktober** (tabela `0711360S`). To je zdaj prvi in najmočnejši
  sprožilec — do avgusta 2026 je bil zadnji, ker se je zmotno domnevalo, da bo naslednja
  objava šele okoli 2028;
- **povprečna bruto plača zraste za več kot ~10 %** od 2.626 EUR (drseče 12-mesečno
  povprečje, junij 2026);
- **minimalna plača se spremeni** — januarja 2026 je zrasla za 15,97 % pri 5,9-odstotni
  rasti povprečne plače, kar je premaknilo regres in spodnjo mejo vseh pasov, medtem ko bi
  prvo pravilo mirovalo. To pravilo obstaja zato, ker prvo tega ni ujelo;
- **spremeni se stopnja prispevkov delodajalca** ali neobdavčeni znesek malice oziroma
  prevoza;
- **nacionalni računi popravijo strošek dela na opravljeno uro** za več kot ~5 % od
  27,05 EUR (2025) — s tem se premakne pot B in z njo sredina.

### Viri

- SURS SiStat, tabela `0711360S` — povprečne mesečne plače po skupinah poklicev (SKP-08)
  v **javnem in zasebnem sektorju**, bruto, povprečje, mediana, kvartili in percentili,
  oktober 2023 / 2024 / 2025 — **glavno sidro**
- SURS SiStat, tabela `0701029S` — povprečne mesečne plače pri pravnih osebah po
  dejavnostih (SKD 2025), mesečno **do junija 2026**, vključno z drsečim 12-mesečnim
  povprečjem in plačo na plačano uro
- SURS, Strukturna statistika plač, oktober 2025 (objava 16. 4. 2026) — povprečje
  2.519,20 EUR, mediana 2.139,31 EUR, zasebni sektor 2.323,98 EUR
- Eurostat, `nama_10_a10` in `nama_10_a10_e` — sredstva za zaposlene (D.1, D.11) in
  opravljene ure, Slovenija — **izmerjeni strošek dela 27,05 EUR/h (2025)**
- Eurostat, `lc_lci_lev` — raven stroška dela na opravljeno uro po dejavnostih NACE Rev. 2
- Eurostat, `lc_ncost_r2` — strošek dela po velikostnih razredih podjetij
- Uradni list RS št. 6/2026 — znesek minimalne plače za leto 2026 (1.481,88 EUR)
- ZDOsk-1 in ZZZS — prispevek za obvezno zavarovanje za dolgotrajno oskrbo (1 % + 1 %,
  od 1. 7. 2025)
- Uredba o davčni obravnavi povračil stroškov — malica 7,96 EUR/dan, prevoz 0,21 EUR/km
  oziroma najmanj 140 EUR/mesec
- IZS — Priporočene vrednosti urnih postavk pooblaščenih in nadzornih inženirjev za 2026
  (temeljna vrednost storitve 72,52 EUR/h)
- GZS, Združenje za informatiko in telekomunikacije — referenčni cenik storitev IKT
- Kolektivna pogodba dejavnosti trgovine Slovenije — najnižje osnovne plače po tarifnih
  razredih
- NIJZ — bolniška odsotnost: 5,7 % izgubljenih koledarskih dni, ~21 dni na zaposlenega
