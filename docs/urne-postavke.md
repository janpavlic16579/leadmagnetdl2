# Urne postavke: od kod so številke

Ta dokument je vir za razpone urnih postavk v koraku **Skupna finančna osnova**
(`src/config/contexts/`). Obstaja zato, ker je kalkulator prej ponujal postavke, ki jih ni
bilo mogoče preveriti pri nikomer: utemeljitve v kodi so bile izključno relativne
("voznikova ura ni operaterjeva"), absolutnega sidra pa ni bilo nikjer. Postavke množijo
ure v vseh modulskih formulah, zato se napaka v njih prenese v vsak prikazan znesek.

Poizvedbe so bile opravljene **18. avgusta 2026**. Vse številke veljajo za Slovenijo.

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

Prejšnja ocena 4.000 EUR je bila prenizka iz dveh razlogov. Regres je vezan na minimalno
plačo, ta pa je 1. januarja 2026 poskočila s 1.277,72 na **1.481,88 EUR** (+15,97 %) — kar
je največji enkraten dvig doslej in bistveno več od 6,9-odstotne rasti povprečne plače.
Prevoz je bil ocenjen na 900 EUR/leto, kar je pod neobdavčenim minimumom 140 EUR/mesec.

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
podatkov. Za primerjavo: nacionalni računi kažejo ~1.580 opravljenih ur na zaposlenega, a
to povprečje vključuje delo s krajšim delovnim časom, zato za polni delovni čas ni uporabno.

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

SURS, strukturna statistika plač (SiStat tabela `0711335S`, SKP-08, leto 2022). Zadnje
razpoložljivo leto je še vedno 2022: naslednji val raziskave popisuje 2026 in bo objavljen
okoli 2028, zato bo preračun iz razmerij še nekaj let edina pot.

Iz tabele se vzame **razmerje poklica do povprečja vseh zaposlenih**, ne njegova absolutna
vrednost — razmerja se med leti premikajo počasi, ravni pa hitro. Plače 2022 so preračunane
na 2026 s faktorjem rasti povprečne plače **1,3252** (2.023,92 EUR v 2022 → 2.682 EUR maja
2026), nato po formuli zgoraj v strošek ure.

Poleg povprečja je naveden tudi **mediana**: povprečje poklicne skupine vlečejo navzgor
redki visoki izplačevalci, za ciljno podjetje z 10–249 zaposlenimi pa je mediana bližje
resnici. Realen razpon dejavnosti leži med obema stolpcema.

| Poklic (SKP-08) | EUR/h iz povprečja | EUR/h iz mediane |
|---|---|---|
| 8332 Voznik težkega tovornjaka | **19,5** | 17,9 |
| 5223 Prodajalec | **19,5** | 17,8 |
| 82 Sestavljavci strojev in izdelkov | **19,8** | 18,9 |
| 7212 Varilec | **21,4** | 20,6 |
| 933 Preprosta transportna in skladiščna dela | **21,4** | 19,8 |
| 9333 Delavec za preprosta prekladalna dela | **21,9** | 20,2 |
| 5230 Blagajnik | **22,0** | 19,9 |
| 8 Upravljavci strojev, operaterji | **22,0** | 20,4 |
| 4321 Skladiščnik, uradnik za nabavo in prodajo | **22,1** | 20,6 |
| 4110 Uradnik za splošno pisarniško poslovanje | **22,8** | 20,5 |
| 7222 Orodjar | **23,2** | 22,4 |
| 7223 Strugar | **23,7** | 22,9 |
| 81 Upravljavci strojev in naprav | **23,8** | 22,6 |
| 7233 Mehanik, serviser industrijskih strojev | **25,2** | 23,8 |
| 4311 Uradnik v računovodstvu | **25,7** | 23,5 |
| 7412 Elektromehanik | **25,9** | 25,0 |
| 3313 Knjigovodja | **26,2** | 23,8 |
| — povprečje vseh zaposlenih | **26,8** | 22,9 |
| 4322 Uradnik za izračune količin v proizvodnji | **27,5** | 25,2 |
| 4323 Prometni odpravnik, referent za transport | **27,9** | 27,5 |
| 3115 Tehnik za strojništvo | **28,4** | 26,4 |
| 3323 Nabavni referent | **28,6** | 26,4 |
| 3331 Špediter | **29,4** | 26,8 |
| 3122 Nadzornik v predelovalnih dejavnostih | **29,8** | 27,8 |
| 3322 Komercialni zastopnik za prodajo | **30,0** | 26,2 |
| 2141 Inženir, tehnolog v industriji in proizvodnji | **33,2** | 30,7 |
| 2514 Programer računalniških aplikacij | **34,7** | 32,1 |
| 2411 Strokovnjak za računovodstvo in revizijo | **34,8** | 31,9 |
| 2147 Strokovnjak za logistiko in tehnologijo prometa | **35,6** | 32,3 |
| 2144 Inženir strojništva | **36,5** | 33,4 |
| 1324 Menedžer za nabavo, logistiko, skladiščenje | **38,9** | 31,3 |
| 1420 Menedžer v trgovini | **39,1** | 29,0 |
| 1321 Menedžer za proizvodnjo | **40,7** | 33,4 |

### Plače po dejavnostih — kontrola

SURS (SiStat tabela `0701029S`), **maj 2026**, že po novi klasifikaciji **SKD 2025**. Črke
sektorjev se od SKD 2008 razlikujejo: strokovne dejavnosti so zdaj `N` (prej `M`),
informatika je izločena v `K`.

| Dejavnost (SKD 2025) | Bruto/mes | EUR/h | Rast l/l |
|---|---|---|---|
| H49.41 Cestni tovorni prevoz | 1.925 | **18,7** | +7,7 % |
| H52.10 Skladiščenje | 2.030 | **19,6** | +10,0 % |
| G47 Trgovina na drobno | 2.198 | **21,0** | +7,3 % |
| C25 Proizvodnja kovinskih izdelkov | 2.359 | **22,3** | +4,4 % |
| H Prevoz in skladiščenje | 2.358 | **22,3** | +7,0 % |
| N69.20 Računovodske in revizijske dejavnosti | 2.532 | **23,7** | +7,7 % |
| H52.25 Logistične storitve | 2.579 | **24,1** | +2,9 % |
| C Predelovalne dejavnosti | 2.598 | **24,3** | +5,5 % |
| G46 Trgovina na debelo | 2.790 | **25,9** | +5,8 % |
| C28 Proizvodnja strojev in naprav | 2.771 | **25,7** | +5,1 % |
| N70 Podjetniško in poslovno svetovanje | 2.800 | **26,0** | +5,0 % |
| N71.12 Inženirska dejavnost in svetovanje | 2.965 | **27,3** | +5,6 % |
| K62 Računalniško programiranje in svetovanje | 3.713 | **33,5** | +4,8 % |
| — vse dejavnosti skupaj | 2.682 | **25,0** | +6,9 % |

To so povprečja **celotne panoge, vključno z vodstvom**, zato so nad postavko posameznega
operativnega poklica. Uporabna so kot zgornja meja verjetnosti, ne kot sidro.

**Cestni tovorni prevoz je izjema, ki je iz plače ni videti.** Panožno povprečje 1.925 EUR
je nižje od izpeljanega voznika (19,5 EUR/h), ker mednarodni prevozniki velik del prejemka
izplačajo kot dnevnice, ki v bruto plačo ne štejejo. Dejanski denarni strošek voznikove ure
je bistveno višji od plačilne liste — zato je zgornji pas v logistiki upravičeno visok.

### Eurostat — kontrola, ki je nismo uporabili kot sidro

Eurostat `lc_lci_lev`, strošek dela na opravljeno uro, Slovenija 2025:

| | EUR/h |
|---|---|
| Poslovno gospodarstvo (B–N) | 30,0 |
| Predelovalne dejavnosti | 29,8 |
| Trgovina | 28,8 |
| Promet in skladiščenje | 26,2 |
| Strokovne, znanstvene in tehnične dejavnosti | 36,2 |
| Informacijske in komunikacijske dejavnosti | 38,3 |
| Gradbeništvo | 25,4 |
| Celotno gospodarstvo (B–S brez O) | 29,7 |

Ekstrapolirano na 2026 (rast 2024→2025 je bila 7,5 %) to pomeni okoli 31–32 EUR/h za
povprečje gospodarstva, torej približno **27 % nad** izpeljavo iz plač (25,0 EUR/h).
Razlike z javno dostopnimi podatki ni mogoče v celoti pojasniti; najverjetnejša dela sta,
da Eurostatova raziskava zajema podjetja z 10 ali več zaposlenimi in da je njen delitelj
opravljenih ur nižji od 1.700, ki jih predpostavimo tu.

Vzeli smo nižje sidro zavestno: kalkulator, ki pretirava, izgubi skeptičnega direktorja pri
prvi številki, kalkulator, ki je zadržan, pa ne. Kdor želi zgornjo oceno, jo v vprašalniku
lahko vpiše — postavka je vnosno polje, razponi so le predlog.

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

**Sidro ni nujno prvi našteti poklic.** Logistika in veleprodaja sta bili do avgusta 2026
usidrani na voznika (19 EUR/h), čeprav vprašanje našteva "voznik, skladiščnik, komisionar"
oziroma pri veleprodaji voznika sploh ne omeni. Dva od treh naštetih poklicev sta dražja od
voznika, zato sredina pripada skladiščniku (22 EUR/h). Isto velja za administrativno uro:
vprašanje našteva planerja, vodjo proizvodnje in nabavo (28,6–40,7 EUR/h), sidro pa je bilo
pisarniški uradnik (22,8) — zato se je privzetek premaknil s 25 na 27 EUR/h.

---

## Kje se te številke pojavijo obiskovalcu

`fallbackEUR` v `src/config/contexts/` ni le tiha rezerva — je **povprečje panoge**, ki ga
obiskovalec vidi in lahko prevzame z enim klikom ("Ne vem — vzemi povprečje panoge (23 EUR/h)").
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

| Vprašanje | Privzetek | Pasovi |
|---|---|---|
| Proizvodnja, operativna ura | 23 | do 20 · 20–26 · 26–34 · nad 34 |
| Logistika, operativna ura | 22 | do 19 · 19–25 · 25–33 · nad 33 |
| Veleprodaja, operativna ura | 22 | do 19 · 19–25 · 25–33 · nad 33 |
| Maloprodaja, operativna ura | 21 | do 19 · 19–24 · 24–31 · nad 31 |
| Storitve, izvedbena ura | 32 | do 24 · 24–31 · 31–42 · nad 42 |
| Računovodstvo, operativna ura | 26 | do 22 · 22–28 · 28–36 · nad 36 |
| Splošno, operativna ura | 23 | do 20 · 20–26 · 26–35 · nad 35 |
| Administrativna ura (skupna) | 27 | do 22 · 22–29 · 29–38 · nad 38 |
| Računovodstvo, vodstvena ura | 34 | isti nabor kot administrativna |
| Storitve, zaračunana postavka | 55 | do 42 · 42–60 · 60–85 · nad 85 |

---

## Kdaj to preveriti znova

Razmerja med poklici se premikajo počasi, ravni plač pa ne. Sprožilci za nov preračun:

- **povprečna bruto plača zraste za več kot ~10 %** od 2.682 EUR (maj 2026);
- **minimalna plača se spremeni** — januarja 2026 je zrasla za 15,97 % pri 6,9-odstotni
  rasti povprečne plače, kar je premaknilo regres in spodnjo mejo vseh pasov, medtem ko bi
  prvo pravilo mirovalo. To pravilo obstaja zato, ker prvo tega ni ujelo;
- **spremeni se stopnja prispevkov delodajalca** ali neobdavčeni znesek malice oziroma
  prevoza;
- **SURS objavi novejšo strukturno statistiko plač po poklicih** od leta 2022 (pričakovano
  okoli 2028 za referenčno leto 2026).

### Viri

- SURS SiStat, tabela `0711335S` — povprečne mesečne plače po skupinah poklicev (SKP-08),
  bruto, povprečje in mediana, 2022
- SURS SiStat, tabela `0701029S` — povprečne mesečne plače pri pravnih osebah po dejavnostih
  (SKD 2025), do maja 2026
- SURS SiStat, tabela `0701035S` — povprečno število plačanih ur po dejavnostih (SKD 2025)
- Eurostat, `lc_lci_lev` — strošek dela na opravljeno uro po dejavnostih NACE Rev. 2
- Eurostat, `nama_10_a10_e` — opravljene ure in zaposleni, Slovenija
- Uradni list RS št. 6/2026 — znesek minimalne plače za leto 2026 (1.481,88 EUR)
- ZDOsk-1 in ZZZS — prispevek za obvezno zavarovanje za dolgotrajno oskrbo (1 % + 1 %,
  od 1. 7. 2025)
- Uredba o davčni obravnavi povračil stroškov — malica 7,96 EUR/dan, prevoz 0,21 EUR/km
  oziroma najmanj 140 EUR/mesec
- IZS — Priporočene vrednosti urnih postavk pooblaščenih in nadzornih inženirjev za 2026
- GZS, Združenje za informatiko in telekomunikacije — referenčni cenik storitev IKT
- Kolektivna pogodba dejavnosti trgovine Slovenije — najnižje osnovne plače po tarifnih
  razredih
- NIJZ — bolniška odsotnost: 5,7 % izgubljenih koledarskih dni, ~21 dni na zaposlenega
