# Preverba prispevnih marž proti trgu, avgust 2026

Zapisnik prve preverbe **prispevnih marž** po dejavnostih. Postavlja jih na izmerjene
podatke za zadnja tri leta, tako kot je
[`urne-postavke-raziskava-2026-08.md`](urne-postavke-raziskava-2026-08.md) postavil urne
postavke. Do zdaj marže niso bile umerjene na noben zunanji vir: vrednosti so bile
zapisane ob uvedbi polja (`3969f7f`) in se od takrat niso premaknile — obe kalibracijski
spremembi 2026 (`68c5e34`, `bb04776`) sta se dotaknili samo urnih postavk.

Poizvedbe: **25. avgusta 2026**. Stanje kode ob pisanju: `fb0bf17`.

---

## 0. Povzetek

**Šest od sedmih privzetkov je bilo prenizkih, en je bil pravilen.** Največji odmiki so
pri storitvenih dejavnostih: računovodstvo je bilo podcenjeno za 18 odstotnih točk,
storitve in logistika pa vsaka za 10.

| Dejavnost | Prej | Zdaj | Sprememba | Kaj je merjeno |
|---|---|---|---|---|
| Maloprodaja | 25 % | **31 %** | +6 o. t. | bruto marža na blago, 3 leta |
| Veleprodaja | 20 % | **21 %** | +1 o. t. | bruto marža na blago, 3 leta |
| Proizvodnja | 25 % | **26 %** | +1 o. t. | potrjeno, ostane |
| Storitve | 30 % | **40 %** | +10 o. t. | izpeljano iz cene in stroška ure |
| Logistika | 25 % | **35 %** | +10 o. t. | stroškovni model GZS + SURS |
| Računovodstvo | 30 % | **48 %** | +18 o. t. | prihodek in strošek na zaposlenega |
| Splošno | 25 % | **28 %** | +3 o. t. | sredina panog |

Vsi novi privzetki ležijo v **natanko enem obstoječem pasu**. Sprememba je zato ena
vrstica na datoteko in hkrati odpravi tiho napako, opisano v razdelku 5.

### Tri stvari, ki jih je preverba pokazala

1. **Številka premakne evre samo v maloprodaji.** `contributionMarginRate` množi izračun
   natanko na dveh mestih ([`modules/maloprodaja.ts:173`](../src/config/modules/maloprodaja.ts:173)
   in [`:788`](../src/config/modules/maloprodaja.ts:788)). V drugih šestih dejavnostih je
   »Izgubljena prispevna marža« znesek, ki ga obiskovalec vpiše sam (`input.lostMarginEUR`),
   marža iz konteksta pa gre samo v prodajno poročilo. Popravek maloprodaje torej spremeni
   rezultat, ostalih šest popravkov pa **verodostojnost vprašalnika** — kar pri lead
   magnetu ni manj pomembno, ker prav ta številka pokaže, ali panogo poznamo.

2. **Zapisani vir za maloprodajo ne drži.** Komentar nad `MARGIN_BANDS`
   ([`maloprodaja.ts:50`](../src/config/contexts/maloprodaja.ts:50)) navaja scenarije
   raziskave 22 / 27 / 30 %, privzetek 25 % pa iz njih ne izhaja — to je bilo ugotovljeno
   že v [pregledu maloprodaje](../navodila/maloprodaja/vprasalnik-maloprodaja-pregled.md:651).
   Izmerjena bruto marža slovenske maloprodaje je **višja od vseh treh scenarijev**, zato
   predlog iz tistega pregleda (znižanje na 0,22) s to preverbo odpade.

3. **»Bruto marža« v slovenskem poslovnem tisku ne pomeni tega, kar mislimo.** GZS z njo
   označuje *delež dodane vrednosti v kosmatem donosu* (23,2 % za 2023), Eurostat in SURS
   pa *bruto maržo na blago za nadaljnjo prodajo*. V maloprodaji je prva mera 13,8 % in
   druga 34,3 % — razlika ni odtenek, ampak dva in pol krat. Pri vsakem viru spodaj je
   zato izrecno zapisano, katera mera je uporabljena.

---

## 1. Kaj merimo

Vprašanje v aplikaciji ni bruto marža in ni pribitek. Pomen se po dejavnostih razlikuje,
ker ga določa besedilo polja `help`:

| Dejavnost | Kaj se odšteje od prodajne cene | Datoteka |
|---|---|---|
| Maloprodaja | nabavna vrednost + provizije, kartice, dostava | [`maloprodaja.ts:135`](../src/config/contexts/maloprodaja.ts:135) |
| Veleprodaja | nabavna vrednost + prevoz, provizije | [`trgovina.ts:120`](../src/config/contexts/trgovina.ts:120) |
| Proizvodnja | material + neposredni stroški izdelave | [`proizvodnja.ts:93`](../src/config/contexts/proizvodnja.ts:93) |
| Storitve | plače na projektu, podizvajalci, licence | [`storitve.ts:155`](../src/config/contexts/storitve.ts:155) |
| Logistika | gorivo, podizvajalci, cestnine | [`logistika.ts:119`](../src/config/contexts/logistika.ts:119) |
| Računovodstvo | plače na strankah, licence, zunanji sodelavci | [`racunovodstvo.ts:129`](../src/config/contexts/racunovodstvo.ts:129) |
| Splošno | material, blago ali izvedba | [`splosno.ts:130`](../src/config/contexts/splosno.ts:130) |

Za trgovini je to **neposredno merljivo**: statistika objavlja nabavno vrednost prodanega
blaga. Za ostalih pet ni javne statistike, ki bi ločila spremenljive stroške od stalnih,
zato je vsaka ocena spodaj izpeljana iz dveh neodvisnih poti in je pri vsaki zapisano,
katera predpostavka jo nosi.

**Merjeni okvir za nemerljive dejavnosti.** Iz SURS izhajata dve meji, ki ju ni treba
oceniti, ker sta izračunani:

- **zgornja meja** = delež dodane vrednosti v prihodku (`DV %`) — toliko ostane, če je
  spremenljiv vsak nakup blaga in storitev, delo pa nič;
- **spodnja meja** = bruto poslovni presežek (`BPP %`) — toliko ostane, če je spremenljivo
  vse, tudi celotno delo.

Prispevna marža leži med njima; kje natanko, določa delež dela, ki je res neposreden.

---

## 2. Viri

| Vir | Kaj da | Leta |
|---|---|---|
| Eurostat SBS `sbs_ovw_act`, `sbs_sc_ovw` (geo = SI) | nabava blaga za nadaljnjo prodajo → **bruto marža na blago** po SKD do 3 mest | 2021–2023 |
| SURS SiStat `1450404S`, `1450632S` | prihodek, dodana vrednost, BPP, nakupi, stroški dela, zaposleni — tudi **po velikostnih razredih** | 2022–2024 |
| AJPES, Informacija o poslovanju gospodarskih družb | struktura stroškov blaga, materiala in storitev na ravni celotnega gospodarstva | 2023–2025 |
| GZS, *Stroškovna analiza in model lastne cene cestnega tovornega prometa* | struktura cene po km za 12 t, 20 t in 39 t | — |
| TZS, *Analiza slovenske trgovine v letu 2024* | EBIT 4,02 %, EBITDA 6,03 %, profitna marža 2,70 % za trgovino | 2024 |
| Bloomberg Adria, regijska analiza živilske maloprodaje | bruto marža živilske maloprodaje 26,2 % (Spar Slovenija potrdil) | 2022 |

Dve omejitvi je treba imeti pred očmi. Eurostatov kazalnik nabave blaga za nadaljnjo
prodajo je zadnjič objavljen za **2023** (za 2024 je objavljen samo promet), zato so
marže trgovine merjene za 2021–2023, vse ostalo pa za 2022–2024. In: nabava ni enaka
nabavni vrednosti prodanega blaga, ker ne upošteva spremembe zalog — v enem letu to
zaniha, v triletnem povprečju pa se izniči.

---

## 3. Pregled zadnjih treh let

### 3.1 Bruto marža na blago — samo trgovini

| SKD | Dejavnost | 2021 | 2022 | 2023 | promet 2023 (mio EUR) |
|---|---|---|---|---|---|
| G47 | **Trgovina na drobno — vse** | 27,5 % | 20,9 % | 25,8 % | 19.128 |
| G47.1 | v nespecializiranih prodajalnah (pretežno živila) | 30,5 % | 29,1 % | 30,1 % | 5.961 |
| G47.2 | v specializiranih prodajalnah z živili | 39,2 % | 37,8 % | 37,5 % | 209 |
| G47.3 | z motornimi gorivi | 11,3 % | 5,2 % | 9,5 % | 6.775 |
| G47.4 | z napravami IKT | 26,9 % | 27,3 % | 28,2 % | 221 |
| G47.5 | z drugo gospodinjsko opremo | 37,1 % | 35,4 % | 36,4 % | 1.293 |
| G47.6 | z izdelki za kulturo in razvedrilo | 37,5 % | 36,9 % | 36,7 % | 587 |
| G47.7 | v drugih specializiranih prodajalnah | 32,7 % | 30,5 % | 32,6 % | 2.755 |
| G47.8 | na stojnicah in tržnicah | 61,9 % | 67,1 % | 63,5 % | 15 |
| G47.9 | zunaj prodajaln (splet, katalog) | 55,4 % | 54,3 % | 58,2 % | 1.313 |
| **G47 brez goriv** | | **34,9 %** | **33,2 %** | **34,7 %** | 12.353 |
| G46 | **Trgovina na debelo — vse** | 27,0 % | 23,8 % | 25,4 % | 21.971 |
| G46.1 | posredništvo (prihodek je provizija) | 39,3 % | 34,8 % | 36,0 % | 3.931 |
| G46.2 | s kmetijskimi surovinami | 20,8 % | 17,9 % | 18,7 % | 300 |
| G46.3 | z živili, pijačami, tobakom | 21,7 % | 17,8 % | 19,1 % | 2.643 |
| G46.4 | z izdelki široke porabe | 25,8 % | 25,3 % | 25,6 % | 4.560 |
| G46.5 | z opremo IKT | 16,9 % | 17,0 % | 17,3 % | 883 |
| G46.6 | z drugimi stroji in napravami | 31,9 % | 28,6 % | 29,6 % | 1.287 |
| G46.7 | druga specializirana | 21,4 % | 15,9 % | 18,9 % | 5.729 |
| G46.9 | nespecializirana | 28,9 % | 31,1 % | 31,1 % | 2.638 |
| **G46 brez posredništva** | | **24,3 %** | **21,4 %** | **23,1 %** | 18.040 |

Dve popravki agregata sta obvezni, sicer je številka napačna za 5 do 9 odstotnih točk:

- **Goriva (G47.3)** so tretjina prometa maloprodaje in imajo marže 5–11 %, ker je marža
  na gorivo v Sloveniji regulirana. Trgovec, ki ga vprašalnik nagovarja, ni bencinski
  servis.
- **Posredništvo (G46.1)** knjiži kot prihodek provizijo in ne vrednosti blaga, zato je
  njegova »marža« 35–39 % računska in ne primerljiva. Prav to napihuje agregat G46.

### 3.2 Dodana vrednost, delo in presežek — vse dejavnosti

Podjetja z **10–249 zaposlenimi in samozaposlenimi**, torej ciljni razred kalkulatorja
(glej komentar v [`proizvodnja.ts:76`](../src/config/contexts/proizvodnja.ts:76)).
Vse v odstotkih čistega prihodka od prodaje.

| Dejavnost | | 2022 | 2023 | 2024 | povpr. |
|---|---|---|---|---|---|
| C Predelovalne | DV | 31,9 | 31,1 | 32,6 | **31,9** |
| | delo | 19,4 | 21,6 | 22,6 | 21,2 |
| | BPP | 12,5 | 9,5 | 10,0 | 10,7 |
| C25 Kovinski izdelki | DV | 36,2 | 36,2 | 37,4 | **36,6** |
| | delo | 23,3 | 25,7 | 26,8 | 25,3 |
| G47 Maloprodaja | DV | 13,2 | 14,0 | 14,1 | **13,8** |
| | delo | 7,8 | 9,0 | 9,5 | 8,8 |
| G46 Veleprodaja | DV | 13,1 | 12,3 | 13,6 | **13,0** |
| | delo | 6,6 | 7,3 | 7,7 | 7,2 |
| H49.4 Cestni tovorni promet¹ | DV | 27,7 | 29,5 | 29,2 | **28,8** |
| | delo | 14,9 | 16,3 | 17,2 | 16,1 |
| | nakupi | 72,5 | 70,7 | 71,0 | 71,4 |
| H52 Skladiščenje in špedicija | DV | 17,9 | 21,8 | 19,8 | **19,8** |
| | nakupi | 81,9 | 77,3 | 80,0 | 79,7 |
| M69 Pravne in računovodske | DV | 64,8 | 64,1 | 63,3 | **64,1** |
| | delo | 47,2 | 47,4 | 44,1 | 46,2 |
| | BPP | 17,6 | 16,7 | 19,3 | 17,9 |
| M71 Projektiranje, inženiring | DV | 32,0 | 27,1 | 30,7 | **29,9** |
| | delo | 22,1 | 20,2 | 20,9 | 21,1 |
| J62 Programiranje, svetovanje | DV | 42,5 | 49,8 | 50,5 | **47,6** |
| | delo | 28,3 | 40,5 | 38,4 | 35,7 |
| Vse dejavnosti | DV | 21,0 | 23,3 | 25,2 | **23,2** |
| | delo | 13,3 | 14,5 | 16,6 | 14,8 |

¹ Za oddelek H49.4 velikostni razred ni objavljen ločeno, zato so navedene vrednosti za
vsa podjetja. Pri nadrejenem oddelku H49 je razlika med razredom 10–249 in vsemi podjetji
2,3 odstotne točke dodane vrednosti (30,3 proti 32,6 % v letu 2024).

### 3.3 Prihodek in strošek dela na zaposlenega, 2024

Ta tabela je ključ za storitvene dejavnosti, ker pove, koliko od zaračunanega pojé
tisti, ki delo opravi.

| Dejavnost | prihodek/zaposl. | strošek dela/zaposl. | delo v prihodku |
|---|---|---|---|
| M69.2 Računovodske dejavnosti | 93.235 € | 34.206 € | 36,7 % |
| M71 Projektiranje, inženiring | 210.123 € | 41.926 € | 20,0 % |
| J62 Programiranje | 169.454 € | 53.461 € | 31,5 % |
| M70 Poslovno svetovanje | 206.121 € | 38.864 € | 18,9 % |
| H49.4 Cestni tovorni promet | 159.722 € | 27.550 € | 17,2 % |
| C25 Kovinski izdelki | 135.780 € | 34.946 € | 25,7 % |
| G47 Maloprodaja | 328.210 € | 31.176 € | 9,5 % |
| G46 Veleprodaja | 567.545 € | 40.787 € | 7,2 % |

---

## 4. Po posameznih dejavnostih

### Maloprodaja — 25 % → **31 %**

[`src/config/contexts/maloprodaja.ts:135`](../src/config/contexts/maloprodaja.ts:135) ·
pasovi `do 15 · 15–25 · 25–35 · nad 35` ostanejo

Edina dejavnost, kjer številka premakne evre, in edina, kjer je merjena neposredno.

| Pot | Izračun | Rezultat |
|---|---|---|
| A — vsa maloprodaja brez goriv | povprečje 2021–2023 | 34,3 % |
| B — samo prodajalne (brez goriv in brez prodaje zunaj prodajaln) | 2023 | 31,9 % |
| Preverba — živilska maloprodaja | Bloomberg Adria 2022, Spar potrdil | 26,2 % |

Pot B je pravilnejša od poti A za to vprašanje: razred G47.9 (prodaja zunaj prodajaln)
kaže 54–58 %, ker del spletnih prodajalcev knjiži prihodek kot provizijo, in bi
5-odstotni delež prometa dvignil povprečje za skoraj 3 odstotne točke.

Od bruto marže je treba odšteti še to, kar polje izrecno navaja — provizije, kartice,
dostavo. Bančna provizija je 0,5–1,2 % prometa, dostava in provizije tržnic pa zadenejo
samo spletni del. Za trgovca s prodajalnami to odnese približno **1 odstotno točko**.

**31,9 − 1 ≈ 31 %.** Vrednost leži v pasu `25do35`, kar da razpon 25–35 % s sredino 30 %
— točno na izmerjenem povprečju.

Kar številka pomeni po tipih trgovca: živilec 26–30 %, tehnika in IKT 28 %, gospodinjska
oprema in izdelki za razvedrilo 36–37 %, druge specializirane prodajalne 33 %. Razpon,
ki ga obiskovalec dobi ob prevzemu povprečja, ta razmik pokrije.

### Veleprodaja — 20 % → **21 %**

[`src/config/contexts/trgovina.ts:120`](../src/config/contexts/trgovina.ts:120) ·
pasovi `do 10 · 10–20 · 20–30 · nad 30` ostanejo

Bruto marža trgovine na debelo brez posredništva: 24,3 / 21,4 / 23,1 %, povprečje
**22,9 %**. Odbitek za neposredne stroške, ki jih polje navaja (prevoz do kupca,
provizije), je pri veleprodaji večji kot pri maloprodaji — okoli 2 odstotni točki, ker
prevoz nosi prodajalec.

**22,9 − 2 ≈ 21 %.** Dosedanjih 20 % je bilo torej skoraj pravilnih; edini razlog za
spremembo je, da 0,20 leži **na stiku dveh pasov** (glej razdelek 5).

Razmik po blagovnih skupinah je velik in ga je vredno poznati pri prodajnem pogovoru:
IKT oprema 17 %, živila 19 %, druga specializirana 19 %, izdelki široke porabe 26 %,
stroji in naprave 30 %, nespecializirana veleprodaja 31 %.

### Proizvodnja — 25 % → **26 %** (potrjeno)

[`src/config/contexts/proizvodnja.ts:93`](../src/config/contexts/proizvodnja.ts:93) ·
pasovi `do 20 · 20–35 · 35–50 · nad 50` ostanejo

Edina dejavnost, kjer je bila dosedanja vrednost pravilna.

Merjeni okvir za MSP 10–249: **BPP 10,7 % ≤ marža ≤ DV 31,9 %**. Znotraj njega:

- nakupi blaga in storitev 69,9 % prihodka; po razmerju AJPES za celotno gospodarstvo
  (nabavna vrednost 49,1 %, material 24,5 %, storitve 26,4 % — v predelovalnih je delež
  storitev nižji) je material z energijo približno 56 %, storitve 14 %;
- od storitev je približno polovica neposredna (kooperacija, prevoz, orodja), polovica
  stalna (najem, vzdrževanje, IT, zavarovanja);
- neposredno delo je približno 63 % stroška dela, torej 13,4 % prihodka.

**100 − 56 − 5 − 13,4 ≈ 26 %.** Po oddelkih: kovinski izdelki 28 %, stroji 25 %, guma in
plastika 25 %, pohištvo 25 %, les 19 %, živila 20 %.

Pasova `35–50` in `nad 50` sta po tej meritvi za predelovalno dejavnost visoka — noben
oddelek se jima ne približa. Ostaneta, ker obstajajo nišni proizvajalci z lastno blagovno
znamko, in ker bi bila sprememba pasov večji poseg od spremembe privzetka.

### Storitve — 30 % → **40 %**

[`src/config/contexts/storitve.ts:155`](../src/config/contexts/storitve.ts:155) ·
pasovi `do 30 · 30–50 · 50–70 · nad 70` ostanejo

| Pot | Izračun | Rezultat |
|---|---|---|
| A — iz aplikacijinih lastnih postavk | izvedbena ura 29 € / zaračunana ura 55 € = 52,7 % neposredno delo; licence in podizvajalci 8 % | **39,3 %** |
| B — SURS M71 projektiranje | delo 20,0 %, od tega 80 % neposredno; podizvajalci približno 35 % prihodka | 49 % |
| B — SURS J62 programiranje | delo 31,5 %, od tega 80 % neposredno; licence in zunanji 15 % | 60 % |
| B — SURS M70 svetovanje | delo 18,9 %, od tega 80 % neposredno; zunanji 35 % | 50 % |

Pot A je najmočnejša, ker uporablja **številki, ki ju je aplikacija sama že umerila**
([`storitve.ts:116`](../src/config/contexts/storitve.ts:116) in
[`:137`](../src/config/contexts/storitve.ts:137)) in ker je razmerje med ceno in stroškom
ure natanko tisto, kar polje sprašuje. Pot B da višje vrednosti, ker statistika ne loči
podizvajalcev od stalnih storitev in ker so v M71 in M70 podjetja z veliko preprodanega
dela.

**Vzeta je pot A, zaokrožena navzgor na 40 %**, kar leži v pasu `30do50` in da razpon
30–50 % — spodnja meja pokrije projektante s podizvajalci, zgornja svetovalce po urah.

Dosedanjih 30 % je pomenilo, da izvedbena ura pojé 70 % zaračunane — pri postavkah
aplikacije (29 in 55 €) bi to pomenilo zaračunano uro 42 € namesto 55 €. Vrednost torej
ni bila le nizka, bila je **v nasprotju s postavkama v istem koraku vprašalnika**.

### Logistika — 25 % → **35 %**

[`src/config/contexts/logistika.ts:119`](../src/config/contexts/logistika.ts:119) ·
pasovi `do 15 · 15–30 · 30–45 · nad 45` ostanejo

Polje odšteva **gorivo, podizvajalce in cestnine** — ne pa voznika. GZS-jev stroškovni
model za vlačilec s polpriklopnikom 39 t da strukturo cene:

| Postavka | delež cene | v polju? |
|---|---|---|
| Gorivo | 24,75 % | **da** |
| Cestnine | 15,75 % | **da** |
| Delo voznika | 22,10 % | ne |
| Amortizacija | 11,58 % | ne |
| Splošni stroški | 9,46 % | ne |
| Financiranje in dobiček | 8,86 % | ne |
| Vzdrževanje | 4,77 % | ne |
| Zavarovanje in registracija | 2,73 % | ne |

Gorivo in cestnine sta torej **40,5 % cene**. Prevoznik z lastnim voznim parkom in brez
podizvajalcev ima po definiciji polja maržo 59,5 %.

Koliko panoga v resnici oddaja naprej, pove SURS: nakupi blaga in storitev so v cestnem
tovornem prometu 71,4 % prihodka, medtem ko bi lastni vozni park pojasnil približno
56 % — razlika okoli 15 odstotnih točk je podizvajalski prevoz. Povprečen prevoznik ima
zato **100 − 0,85 × 40,5 − 15 ≈ 51 %**.

Špediter je nasprotni pol: v skladiščenju in spremljajočih dejavnostih so pri MSP nakupi
79,7 % prihodka, ker je prevoz skoraj v celoti kupljen. Marža je 15–20 %, pri čistem
organizatorju prevozov 10–12 %.

Ponderirano po prometu (cestni tovorni promet 4.096 mio, skladiščenje in špedicija
3.221 mio EUR v letu 2024) da to **37 %**; ker `businessType` v tej dejavnosti ponuja tudi
»Prevozi s pogodbenimi prevozniki« in »Špedicija«, ki maržo vlečeta navzdol, je vzeto
**35 %**. Vrednost leži v pasu `30do45`.

> **Ločena ugotovitev, ki ni del te preverbe.** Besedilo polja ne omenja voznika ne
> skladiščnika, čeprav sta v tej panogi glavni neposredni strošek. Podjetje, ki izbere
> »Skladiščenje in distribucija«, po črki besedila ne odšteje nič in bi moralo odgovoriti
> 80 %. Vredno je bodisi dopolniti `help`, bodisi vprašanje razvejati po `businessType`.

### Računovodstvo — 30 % → **48 %**

[`src/config/contexts/racunovodstvo.ts:129`](../src/config/contexts/racunovodstvo.ts:129) ·
pasovi `do 30 · 30–50 · 50–70 · nad 70` ostanejo

Največji odmik. Polje odšteva plače na strankah, licence in zunanje sodelavce.

| Pot | Izračun | Rezultat |
|---|---|---|
| A — iz aplikacijine lastne postavke | računovodska ura 25 € × 1.700 h = 42.500 € na zaposlenega; prihodek na zaposlenega 93.235 € → neposredno delo 45,6 %; licence 5 % | **49,4 %** |
| B — SURS, samo plačano delo | delo 36,7 % prihodka, od tega 85 % neposredno; licence 5 % | 63,8 % |
| B′ — SURS, z vračunanim delom lastnikov | 8.040 delovnih oseb proti 5.327 zaposlenim; delo pripisano vsem → 55,4 % prihodka, od tega 85 % neposredno | 47,9 % |

Poti A in B′ se ujameta pri približno 48 %. Pot B je previsoka, ker statistika pri 2.713
samozaposlenih računovodjih njihovega dela ne knjiži med stroške dela, ampak ostane v
poslovnem presežku — v računovodskem servisu pa lastnik dela na strankah.

**Vzetih je 48 %**, kar leži v pasu `30do50` in da razpon 30–50 %. Odbitek za licence in
zunanje sodelavce je namenoma na zgornjem robu (5 %), ker programska oprema, portali in
izobraževanje v tej panogi niso zanemarljivi.

Če se pasovi kdaj prenovijo, je za to panogo naravnejša delitev `do 30 · 30–45 · 45–60 ·
nad 60` s privzetkom 50 % — izmerjeni razmik med servisi je namreč ožji, kot ga opisuje
pas 30–50.

### Splošno — 25 % → **28 %**

[`src/config/contexts/splosno.ts:130`](../src/config/contexts/splosno.ts:130) ·
pasovi `do 15 · 15–25 · 25–35 · nad 35` ostanejo

Segment nima svoje statistike, ker ni panoga — je zbiralnik za podjetja, ki se v triaži
niso prepoznala. Dodana vrednost celotnega gospodarstva (MSP 10–249: 23,2 %) ni prava
mera, ker jo navzdol vleče trgovina, katere lastni segment že obstaja.

`businessType` ponuja »Pretežno izdelki / blago / storitve / kombinirano«. Sredina šestih
umerjenih panog, uteženih z verjetnostjo, da tako podjetje pade v splošni segment, je
**28 %**: nad proizvodnjo (26 %) in veleprodajo (21 %), pod storitvami (40 %). Vrednost
leži v pasu `25do35`.

---

## 5. Kaj popraviti v kodi

### 5.1 Sedem vrstic

| Datoteka | Vrstica | Prej | Zdaj |
|---|---|---|---|
| [`contexts/maloprodaja.ts`](../src/config/contexts/maloprodaja.ts:140) | 140 | `fallback: 0.25` | `fallback: 0.31` |
| [`contexts/trgovina.ts`](../src/config/contexts/trgovina.ts:132) | 132 | `fallback: 0.2` | `fallback: 0.21` |
| [`contexts/proizvodnja.ts`](../src/config/contexts/proizvodnja.ts:103) | 103 | `fallback: 0.25` | `fallback: 0.26` |
| [`contexts/storitve.ts`](../src/config/contexts/storitve.ts:167) | 167 | `fallback: 0.3` | `fallback: 0.4` |
| [`contexts/logistika.ts`](../src/config/contexts/logistika.ts:129) | 129 | `fallback: 0.25` | `fallback: 0.35` |
| [`contexts/racunovodstvo.ts`](../src/config/contexts/racunovodstvo.ts:141) | 141 | `fallback: 0.3` | `fallback: 0.48` |
| [`contexts/splosno.ts`](../src/config/contexts/splosno.ts:140) | 140 | `fallback: 0.25` | `fallback: 0.28` |

Skupaj s tem je treba **popraviti komentar** nad `MARGIN_BANDS` v
[`maloprodaja.ts:47–53`](../src/config/contexts/maloprodaja.ts:47), ki se še vedno sklicuje
na scenarije raziskave, in dopisati sklic na ta dokument — enako, kot ga imajo urne
postavke.

**Ne spreminjati**: `DEFAULT_COST_CONTEXT.contributionMarginRate = 0.25`
([`moduleTypes.ts:292`](../src/config/modules/moduleTypes.ts:292)) in privzetek `?? 0.25`
v `emptyProfileFor` ([`contextTypes.ts:318`](../src/config/contexts/contextTypes.ts:318)).
To nista panožni številki, ampak zasilni vrednosti za segmente in teste brez konteksta;
njuna sprememba bi tiho premaknila rezultate drugod.

### 5.2 Tiha napaka, ki jo popravek odpravi

Pri **petih od sedmih** dejavnosti privzetek leži **na stiku dveh pasov**.
`industryAverageScaleBand` ([`contextTypes.ts:279`](../src/config/contexts/contextTypes.ts:279))
uporabi `find` in vrne prvega, `scaleRange` ([`range.ts:75`](../src/lib/range.ts:75)) pa iz
njega vzame meji. Posledica: obiskovalec v polju vidi 25 %, računamo pa z 15–25 % —
prikazana številka je **zgornji rob razpona**, s katerim teče izračun.

| Dejavnost | privzetek prej | leži v | razpon, s katerim se je računalo | po popravku |
|---|---|---|---|---|
| Maloprodaja | 0,25 | `15do25` **in** `25do35` | 15–25 % | 25–35 % |
| Veleprodaja | 0,20 | `10do20` **in** `20do30` | 10–20 % | 20–30 % |
| Storitve | 0,30 | `do30` **in** `30do50` | 20–30 % | 30–50 % |
| Računovodstvo | 0,30 | `do30` **in** `30do50` | 20–30 % | 30–50 % |
| Splošno | 0,25 | `15do25` **in** `25do35` | 15–25 % | 25–35 % |
| Proizvodnja | 0,25 | samo `20do35` | 20–35 % | 20–35 % |
| Logistika | 0,25 | samo `15do30` | 15–30 % | 30–45 % |

Vseh sedem novih vrednosti leži v natanko enem pasu. Preverjeno postavko za postavko
proti pasovom v kodi.

### 5.3 Test, ki tega ni ujel

Test »povprečje panoge leži v natanko enem pasu«
([`contexts.test.ts:138`](../src/config/contexts/contexts.test.ts:138)) teče samo prek
`ratesOf`, torej po urnih postavkah. Velikostnih predpostavk (marža, strošek financiranja)
ne pokriva.

Razširiti ga je treba na `costBasisQuestionsOf`, **s pogojem, ki preskoči vprašanja s
`fallback === 0`** — letni prihodek ima `fallback: 0`, ki ne leži v nobenem pasu, in bi
naivna razširitev test takoj podrla. Pogoj naj bo isti kot `hasIndustryAverage` v
[`StepCostBasis.tsx:311`](../src/components/Calculator/StepCostBasis.tsx:311).

### 5.4 Kaj se premakne v rezultatih

Samo maloprodaja. Obe postavki, ki množita maržo, sta v košu `lostMargin`, ki je v
poročilu prikazan **ločeno** od naslovnega zneska, ne v `directLoss`:

- [`modules/maloprodaja.ts:173`](../src/config/modules/maloprodaja.ts:173) — izgubljena
  prodaja zaradi praznih polic;
- [`:788`](../src/config/modules/maloprodaja.ts:788) — odpovedana spletna naročila.

Sprememba z 0,25 na 0,31 poveča ti dve postavki za 24 %. Ker gre prevzem povprečja hkrati
iz razpona 15–25 % v razpon 25–35 %, se **spodnja meja prikazanega razpona dvigne z 0,15
na 0,25** — to je večji premik od premika privzetka in ga je vredno preveriti na testnem
scenariju, preden gre v produkcijo.

---

## 6. Česa ta preverba ni razrešila

1. **Ločnice med spremenljivim in stalnim ni v javni statistiki.** SURS in Eurostat
   objavljata »nabavo blaga in storitev skupaj«; razčlenitev na material in storitve
   obstaja samo na ravni celotnega gospodarstva (AJPES). Deleža neposrednega dela
   (63 % v proizvodnji, 80–85 % v storitvah) sta **predpostavki, ne meritvi**. Vplivata
   na proizvodnjo, storitve in računovodstvo; na obe trgovini ne.

2. **Marže trgovine so merjene do 2023.** Kazalnik nabave blaga za nadaljnjo prodajo za
   2024 še ni objavljen. Ko bo (predvidoma pomlad 2027), je maloprodajo vredno preveriti
   znova — promet maloprodaje je v 2023 in 2024 padal, marža pa v takih letih navadno
   raste.

3. **Sprememba zalog ni izločena.** Bruto marža je izračunana kot promet minus nabava
   blaga, brez popravka za zaloge. V posameznem letu to zaniha za približno odstotno
   točko, v triletnem povprečju se izniči — vendar ne povsem, če je panoga v treh letih
   sistematično gradila ali praznila zaloge.

4. **Logistika je dvovrhna, ne razpršena.** Prevoznik in špediter nista dva konca istega
   razpona, ampak dva različna posla s pribl. 50 % in pribl. 12 % maržo. Enotno povprečje
   je zato pri tej panogi manj pomenljivo kot pri ostalih; pravi popravek ni druga
   številka, ampak vprašanje, razvejano po `businessType`.

5. **Splošni segment nima vira.** 28 % je sredina umerjenih panog in ne meritev. Je pa
   prva vrednost v tem polju, ki sploh ima izpeljavo.

---

## 7. Povezave do virov

- Eurostat, *Enterprises by detailed NACE Rev. 2 activity* (`sbs_ovw_act`) —
  <https://ec.europa.eu/eurostat/databrowser/view/sbs_ovw_act>
- Eurostat, *Enterprise statistics by size class and NACE Rev. 2 activity* (`sbs_sc_ovw`) —
  <https://ec.europa.eu/eurostat/databrowser/view/sbs_sc_ovw>
- SURS SiStat, *Poslovanje podjetij po dejavnosti (SKD 2008), Slovenija, letno* (`1450404S`) —
  <https://pxweb.stat.si/SiStatData/pxweb/sl/Data/-/1450404S.px>
- SURS SiStat, *Poslovanje podjetij po dejavnosti in velikosti* (`1450632S`) —
  <https://pxweb.stat.si/SiStatData/pxweb/sl/Data/-/1450632S.px>
- SURS, *Metodološko pojasnilo: strukturna statistika podjetij* —
  <https://www.stat.si/StatWeb/File/DocSysFile/8275>
- AJPES, *Informacija o poslovanju gospodarskih družb v RS v letu 2025* —
  <https://www.ajpes.si/Doc/LP/Informacije/Informacija_LP_GD_zadruge_2025.pdf>
  (leti 2024 in 2023 na istem mestu z zamenjano letnico)
- GZS, *Stroškovna analiza in model lastne cene cestnega tovornega prometa* —
  <https://www.gzs.si/Portals/Panoga-Zdruzenje-Promet/Prirocnik%20za%20splet.pdf>
- TZS, *Analiza poslovanja slovenske trgovine v letu 2024* —
  <https://www.tzslo.si/uploads/analiza_poslovanja_slovenske_trgovine_2024_1.pdf>
- Bloomberg Adria, *Regijska analiza živilske maloprodaje* —
  <https://si.bloombergadria.com/analiza/regionalno/40872/regijska-analiza-zivilske-maloprodaje/news>
- GZS Glas gospodarstva, *Boljše poslovanje gospodarskih družb v letu 2023* (opredelitev
  »bruto marže« kot deleža dodane vrednosti v kosmatem donosu) —
  <https://glasgospodarstva.gzs.si/boljse-poslovanje-gospodarskih-druzb-v-letu-2023-odraz-nizjih-vhodnih-stroskov/>
