# Preverba naslovljivih deležev proti literaturi, avgust 2026

Zapisnik prve preverbe **naslovljivih deležev** (`ADDRESSABLE_SHARE`). Od avgusta 2026 so
to **edini koeficient nad izmerjenim zneskom** — odkar je bil odpravljen dvojni diskont s
»pasom izboljšave« (`88bca93`), gre napaka v njih naravnost v številko, ki jo obiskovalec
vidi. Do te preverbe je datoteka priznavala: »deleži so začetne ocene iz specifikacije,
ne empirija«.

Poizvedbe: **25. avgusta 2026**. Izhodiščno stanje kode: `88bca93`. Ugotovitve tega
zapisnika so **uveljavljene v kodi isti dan** — kaj natanko in kaj je bilo zavrnjeno,
pove razdelek 7.

Preverba je dvodelna. Prvi del vpraša, ali je **šest številk** realnih. Drugi del vpraša,
ali je **način, kako se do njih pride**, realen — in tam so ugotovitve večje od samih
številk.

---

## 0. Povzetek

**Dve od petih vrednosti sta bili previsoki, ena prenizka, dve pravilni. Največja napaka
pa ni bila v nobeni od petih — bila je v šesti, privzeti.**

| Kategorija | Prej | Predlog zapisnika | **Uveljavljeno** | Sodba |
|---|---|---|---|---|
| `data` — podatki, dokumentacija, ročni prenosi | 0,75 | 0,65 | **0,75** | zgornji rob pasu; ohranjen kot zavestna izbira |
| `planning` — planiranje, zaloge, vidnost | 0,65 | 0,50 | **0,65** | nad zgornjim robom; ohranjen do razcepa kategorije |
| `people` — znanje, disciplina, kadri | 0,45 | 0,45 | **0,45** | zgornji rob, a slovenski kontekst ga brani |
| `external` — dobavitelji, kupci | 0,25 | 0,30 | **0,30** ✔ | bil rahlo prenizek |
| `physical` — okvare, material | 0,15 | 0,15 | **0,15** ✔ | edini umerjen brez popravka |
| `unknown` — »Ne vemo« | 0,30 | 0,45 | **0,45** ✔ | bil prenizek za 48 % |

Poleg številk so uveljavljene **vse štiri strukturne ugotovitve** iz razdelka 5: zgornja
meja postavke za izmet in prazne kilometre, peta možnost v dveh modulih brez nizke izbire,
odprava ostanka dvojnega diskonta pri zalogah in odprava privzeto izbranega odgovora.

### Tri stvari, ki jih je preverba pokazala

1. **Privzetek »Ne vemo« je bil najbolj obremenjena in najslabše utemeljena številka.**
   Vprašanje o glavnem vzroku ni bilo obvezno, privzeta izbira pa je bila zadnja možnost —
   »Ne vemo«. Obiskovalec, ki je izpolnil številke in preskočil radie, je dobil 0,30. Če bi
   odgovoril, bi ob dejanski porazdelitvi 203 ponujenih možnosti dobil **povprečno 0,58,
   mediano 0,65**. 0,30 je ležal pri **24. percentilu** — pod kategorijo `people`. Kdor ni
   odgovoril, torej ni dobil previdne ocene, ampak **skoraj polovico** tega, kar bi dobil ob
   enem kliku. To ni bila konservativnost, ampak tiha kazen za neizpolnjeno neobvezno polje
   (razdelek 4.6).

2. **Podpora za 0,75 obstaja — a je to podatek o najboljših, uporabljen kot povprečje.**
   Ardent Partners 2025 meri strošek obdelave računa: povprečje 9,40 USD, najboljši
   2,78 USD — razlika 70 %. Billentis navaja 60–80 % pri prehodu s papirja na e-račun.
   Toda isti Ardent meri tudi delež res brezdotičnih računov: povprečje **32,6 %**,
   najboljši **49,2 %**. Tudi vodilni se torej še vedno dotaknejo polovice računov.
   Hackett Group za celotno finančno funkcijo meri **45 %** nižji strošek pri »Digital
   World Class« proti vrstnikom. McKinsey ocenjuje *tehnično* mejo avtomatizacije obdelave
   podatkov na **69 %** in zajema podatkov na **64 %** — to je strop, ne dosežek.
   0,75 leži nad obema McKinseyjevima številkama (razdelek 4.1).

3. **`planning` = 0,65 je edini delež, ki ga literatura ne podpira v nobenem branju.**
   Aberdeen za najboljše proizvajalce meri **22 %** znižanja zalog. Študije MRP/varnostnih
   zalog dajejo **10–19 %**. Raziskave napovedovanja s strojnim učenjem: varnostna zaloga
   −19,4 %, izpadi zaloge −28,6 %, obrat +24,7 %. V maloprodaji točno knjižno stanje zalog
   izpade **razpolovi** (8,9 % → 4,1 %), z disciplino naročanja in polic je dosegljivih
   **−40 %**. Nobena od teh meritev ne doseže 0,50, kaj šele 0,65 (razdelek 4.2).

### Kar preverba ni našla

Nobenega vira, ki bi neposredno meril »naslovljiv delež po vzroku«. Ta konstrukt je
lasten. Najbližje mu pride Forresterjeva metodologija TEI, ki vsak posamezen prihranek
navzdol popravi za **10–20 %** in ga pripiše z lastnim faktorjem — torej isti prijem, le
da na ravni postavke in ne kategorije. Vse spodnje številke so zato **prevedene** iz
meritev učinka, ne prepisane. Kako je vsaka prevedena, pove razdelek 4.

---

## 1. Kaj korak naredi

Vsak modul vpraša isto vprašanje — »Kaj je glavni vzrok?« — s petimi možnostmi in
»Ne vemo«. Izbira določi eno število, ki množi **vse letne postavke tega modula**:

```
naslovljiv potencial = Σ (letni znesek postavke × min(naslovljiv delež, zgornja meja postavke))
```

- preslikava vzrok → delež: [`addressableShare.ts:47`](../src/config/modules/addressableShare.ts:47)
- seštevek in zgornja meja postavke: [`potential.ts:46`](../src/lib/potential.ts:46)
- privzetek polja: [`addressableShare.ts:160`](../src/config/modules/addressableShare.ts:160)
- enkratni kapital je izvzet — ta znesek **je** potencial, ne sedanji strošek

Delež je vprašan v **41 modulih** čez osem dejavnosti. Obiskovalcu se odstotek nikoli ne
pokaže; vidi samo evre. Odstotek se izpiše le v prodajnem PDF za svetovalca
([`pdfSales.ts:312`](../src/lib/pdfSales.ts:312)). Vsa teža verodostojnosti je torej na
sami številki — obiskovalec je ne more presoditi, ker je ne vidi.

---

## 2. Kako je vprašanje zastavljeno

Preden se sprašujemo o vrednostih, je treba pogledati, **katere vrednosti so sploh
dosegljive**. 41 seznamov je ob preverbi ponujalo skupaj 203 možnosti (brez »Ne vemo«):

| Kategorija | Možnosti | Delež ponudbe | Delež | Kumulativa |
|---|---:|---:|---:|---|
| `data` | 88 | 43,3 % | 0,75 | 56,7 → 100 % |
| `planning` | 52 | 25,6 % | 0,65 | 31,0 → 56,7 % |
| `external` | 37 | 18,2 % | 0,25 | 5,4 → 23,6 % |
| `people` | 15 | 7,4 % | 0,45 | 23,6 → 31,0 % |
| `physical` | 11 | 5,4 % | 0,15 | 0 → 5,4 % |

**Dve tretjini ponujenih odgovorov vodita v 0,65 ali 0,75.** To ni nujno napaka —
če so vzroki v slovenskih MSP res pretežno podatkovni, ponudba pošteno odslikava svet.
Je pa dejstvo, ki ga je treba poznati pri branju rezultatov: pričakovana vrednost
naključno izbranega odgovora je 0,58, ne 0,50.

Posledice, ki iz tega sledijo:

- **Razpon znotraj enega modula je do petkraten** (0,15 proti 0,75). En klik na radiu
  spremeni prikazani znesek za faktor 5.
- **Dva modula nista ponujala nizke možnosti.** `NALOGI` (proizvodnja) in `ADMINISTRACIJA`
  (storitve) sta imela štiri možnosti, vse `data` ali `planning`; **najnižji dosegljivi delež
  je bil 0,65**. Podjetje, katerega delovni nalogi zastajajo zaradi strojev ali ljudi, tega
  ni moglo povedati. Odpravljeno — glej 5.3.
- Pričakovana vrednost po dejavnosti je izenačena: od 0,546 (logistika) do 0,602
  (horizontale). Nobena dejavnost ni sistematično v prednosti — to je dobro.

---

## 3. Viri

| Vir | Kaj meri | Zakaj je uporabljen |
|---|---|---|
| Ardent Partners, *AP Metrics That Matter 2025* (n = 212) | strošek in brezdotičnost obdelave računa | neodvisen (ne prodaja programske opreme), loči povprečje od najboljših |
| Billentis (Koch) | prihranek e-računa proti papirju | evropski, dolga časovna vrsta |
| Hackett Group 2025 | strošek finančne funkcije, Digital World Class proti vrstnikom | meri **celotno funkcijo**, ne ene naloge |
| McKinsey Global Institute, *A Future That Works* (2017) | tehnični potencial avtomatizacije po vrsti dela | edini vir, ki neposredno ustreza logiki »po vzroku« |
| Aberdeen, ERP benchmark | znižanje zalog pri najboljših proizvajalcih | proizvodnja, ERP kot poseg |
| Corsten & Gruen; ECR Retail Loss | vzroki izpadov zaloge in **dosegljivo** znižanje | edina meritev razčlenitve vzrokov na terenu |
| Panorama Consulting, *2026 ERP Report* | uresničenost pričakovanih koristi ERP | popravek za razliko med možnim in doseženim |
| Deming (94/6), Juran (85/15) | delež težav, ki pripada sistemu in ne človeku | podlaga za ozko branje kategorije `people` |
| SURS, *Digitalno podjetništvo 2025* | ERP in ovire pri digitalizaciji v Sloveniji | domači kontekst, popravek za `people` |
| Forrester TEI | metodologija popravka koristi navzdol | edina primerljiva metodologija |

**Opozorilo o pristranosti.** Del gradiva o DSO, CMMS in avtomatizaciji računovodstva
izvira od ponudnikov programske opreme in navaja učinke pri strankah, ki so posel
sklenile. Take številke so v spodnjih pasovih uporabljene kot **zgornja meja**, nikoli kot
sredina.

---

## 4. Po posameznih kategorijah

### 4.1 `data` — 0,75, predlog 0,65 ni bil sprejet

Kategorija pokriva 88 od 203 možnosti: podatki v več sistemih, ročni prepisi, papirne
listine, ročno sestavljena poročila, nesledljivo blago.

| Meritev | Vrednost | Kaj je to |
|---|---|---|
| Ardent 2025 — strošek računa, povprečje → najboljši | 9,40 → 2,78 USD (**−70 %**) | celotna dosegljiva razlika |
| Ardent 2025 — strošek računa, ročno → najboljši | 12,88 → 2,78 USD (**−78 %**) | zgornja meja |
| Billentis — e-račun proti papirju | **−60 do −80 %** | ena naloga, evropsko |
| Hackett 2025 — finančna funkcija | **−45 %** | celotna funkcija |
| McKinsey — obdelava podatkov | **69 %** | *tehnična* meja |
| McKinsey — zajem podatkov | **64 %** | *tehnična* meja |
| Ardent 2025 — delež brezdotičnih računov | povpr. 32,6 % · najboljši 49,2 % | kaj je dejansko doseženo |

**Prevod.** Modul ne meri stroška na račun, ampak strošek problema. Če je vzrok
podatkovni, je vprašanje: koliko tega stroška odpade ob urejenem sistemu? Najbolj
neposreden odgovor je Ardentova razlika povprečje → najboljši: **0,70**. Toda ta razlika
predpostavlja, da podjetje pride do najboljših — kar je po definiciji zgornji decil.
Hackettovih **0,45** velja za celotno funkcijo in je bližje temu, kar dobi povprečno
srednje veliko podjetje. McKinseyjevih **0,64–0,69** je tehnični strop, ki ga v praksi
nihče ne doseže v celoti.

Pas je torej **0,45–0,78**, s težiščem okoli 0,60–0,70. **0,75 leži pri zgornjem robu in
nad obema McKinseyjevima številkama.** Ni absurd — je pa najboljši možni izid, prikazan
kot pričakovani.

**Odločeno: 0,75 ostane.** Argument za ohranitev je, da so možnosti v tej kategoriji
izrazito ozko podatkovne (»Isti podatek vnašamo v več sistemov«, »Listine so večinoma
papirne«) — prav naloge, za katere Billentis meri 60–80 %. Vrednost je s to preverbo
prenehala biti privzeta ocena in postala **zavestna izbira z zapisanim virom**
([`addressableShare.ts:47`](../src/config/modules/addressableShare.ts:47)). Ob prvem
izpodbijanju je to prva vrednost, ki se umakne — na 0,65.

### 4.2 `planning` — 0,65, predlog 0,50 ni bil sprejet

52 možnosti: parametri zalog, plan in kapacitete, vidnost statusov, nesistematično
opominjanje, nepostavljen proces.

| Meritev | Vrednost | Vir |
|---|---|---|
| Znižanje zalog, najboljši proizvajalci z ERP | **−22 %** | Aberdeen |
| Znižanje stroška držanja zalog, MRP/varnostne zaloge | **−10 do −19 %** | študije primerov |
| Varnostna zaloga ob napovedovanju s strojnim učenjem | **−19,4 %** | recenzirana raziskava |
| Izpadi zaloge ob istem | **−28,6 %** | isti vir |
| Napaka napovedi (MAPE) | **−31,2 %** | isti vir |
| Izpadi zaloge ob točnem knjižnem stanju | 8,9 % → **4,1 %** (−54 %) | Corsten & Gruen |
| Dosegljivo znižanje izpadov z disciplino naročanja in polic | **−40 %** | Corsten & Gruen |

**Prevod.** Kategorija je vsebinsko dvodelna in prav to je težava:

- **Zaloge in napovedovanje.** Vse meritve ležijo v pasu 0,10–0,30. 0,65 je dva- do
  trikrat previsok.
- **Vidnost, statusi, nepostavljen proces** (»Odgovornosti niso jasne«, »Stanje nalogov ni
  vidno sproti«, »Opominjanje ni sistematično«). Tu je učinek bližje podatkovnemu: če
  proces ni postavljen, ga sistem res postavi.

Ker isti koeficient pokriva oboje, bi moral biti nekje vmes. Utežen po dejanski ponudbi
možnosti — približno polovica je zalogovno-napovednih — pade sredina na **0,45–0,52**.

**Odločeno: 0,65 ostane do razcepa kategorije.** Prava rešitev ni izbira med 0,50 in 0,65,
ampak razcep na `planning-process` (0,60) in `planning-inventory` (0,30) — glej 7.2. Do
takrat je vrednost izbira, ne meritev, in je kot taka označena v kodi.

### 4.3 `people` — 0,45, potrjeno s pridržkom

Le 15 možnosti, in datoteka kategorijo namenoma bere ozko: `people` velja samo, kadar bi
težava ostala **tudi ob dobro postavljenem sistemu**.

Deming je delež težav, ki pripadajo sistemu in ne človeku, ocenil na **94 %** (prej
85 %); Juran na **85 %**. Ta ocena **podpira ozko branje kategorije** — in hkrati vleče
koeficient navzdol: če je človek res redek pravi vzrok, potem je ostanek po urejenem
sistemu majhen. Literatura o poka-yoke pravi isto z druge strani: preoblikovanje procesa
daje trajnejše učinke kot usposabljanje, ker napake naredi nemogoče namesto neverjetne.

**Nasprotni argument je domač in močan.** SURS 2025: ERP uporablja **35 %** slovenskih
podjetij (28 % malih, 67 % srednjih, 97 % velikih), **76 %** podjetij z 10+ zaposlenimi je
pri digitalni preobrazbi naletelo na težave, in najpogostejša — **41 %** — je pomanjkanje
ustreznega kadra ali znanja. V slovenskem MSP je kader dejansko omejitev, ne izgovor.
Sistem, ki delo vodi po korakih in preverja vnos, del te vrzeli res zapolni.

**Sodba: 0,45 je pri zgornjem robu, a obranljiv.** Ni prioriteta. Če se seznam preostalih
deležev znižuje, naj gre `people` na 0,40, da razmerje proti `data` ostane.

### 4.4 `external` — 0,25 → **0,30 ✔ uveljavljeno**

37 možnosti: zamude dobaviteljev, spremembe kupcev, plačilna disciplina, zunanji servisi.

| Meritev | Vrednost | Opomba |
|---|---|---|
| Znižanje DSO, visoka avtomatizacija terjatev | **−41 %** | anketa 500 finančnih vodij |
| Znižanje DSO, nizka avtomatizacija | **−29 %** | isti vir |
| Znižanje DSO, ponudniki | −20 do −40 % | pristransko, zgornja meja |
| Delež izpadov zaloge iz dobavne verige | ~25–30 % vzrokov | Corsten & Gruen |

**Prevod.** Logika kategorije je pravilna: dobavitelja ne popravimo, lahko pa se pred njim
zavarujemo — z varnostno zalogo, alternativnim virom, zgodnejšo vidnostjo, sistematičnim
opominjanjem. Meritve DSO kažejo, da je ta zaščita vredna **0,20–0,41**, kar 0,25 zajema
pri spodnjem robu. Pri terjatvah je »zunanji« vzrok — kupec plača pozno — ravno tisti, ki
ga sistematično opominjanje najbolj premakne.

Corsten & Gruen merijo, da dobavna veriga povzroči le ~28 % izpadov zaloge: »zunanji«
problem je večinoma notranji. **Oba zapisnika se pri tej vrednosti ujemata**, zato je
sprememba na 0,30 najtrdnejša v tej preverbi.

### 4.5 `physical` — 0,15, potrjeno brez popravka

Le 11 možnosti: okvare strojev, kakovost materiala, poškodbe pri prevozu, prostor.

| Meritev | Vrednost | Poseg |
|---|---|---|
| Znižanje nenačrtovanih zastojev, CMMS + avtonomno vzdrževanje, 6 mesecev | **−10 do −20 %** | informacijski sistem |
| Znižanje nenačrtovanih zastojev, načrtovano vzdrževanje | **−5 do −10 %** | modul |
| Znižanje okvar, celovit TPM, 2 leti | −70 % in več | program, **ne** sistem |

**Prevod.** Razlikovati je treba med posegom. TPM je dvoletni program preoblikovanja
vzdrževanja; ERP ni to. Za sistemski poseg brez programa je pas **0,10–0,20**.

**0,15 leži natanko na sredini. Edini delež, ki je umerjen brez popravka.**

Dodatna opora: izmet materiala je v proizvodnji povprečno 3–8 %, dobra praksa ≤ 2,5 % —
razlika, ki je odpravljiva, je torej okoli polovice, a jo dosežejo šele skupaj s
tehnološkimi ukrepi, ne z evidenco. Za del, ki ga premakne sam sistem, je 0,15 realen.
Ista številka je postala podlaga za zgornjo mejo postavke izmeta (5.2).

### 4.6 `unknown` — 0,30 → **0,45 ✔ uveljavljeno**

**To je bila najpomembnejša številka v datoteki, ker je bila privzetek.**

Vprašanje o vzroku ni bilo obvezno; privzeta izbira je bila zadnja možnost, »Ne vemo«.
Modul se v rezultat všteje, brž ko so izpolnjena številska polja — radio ni pogoj.
Najpogostejši potek obiska lead magneta je bil torej: vpiše številke, preskoči radie,
dobi 0,30.

Kaj bi dobil, če bi odgovoril, po dejanski porazdelitvi 203 možnosti:

| Statistika odgovora | Vrednost |
|---|---|
| Povprečje | **0,579** |
| Mediana | **0,65** |
| 25. percentil | **0,45** |
| Prejšnji privzetek 0,30 je ležal pri | **~24. percentilu** |

0,30 je bil **48 % pod pričakovano vrednostjo odgovora** in je ležal pod kategorijo
`people`. Obiskovalec, ki ni nič povedal, je bil obravnavan slabše, kot če bi rekel
»krivi so ljudje«.

**Zakaj to ni bila konservativnost.** Konservativnost je previdna ocena znanega. Šlo je
za kazen za neizpolnjeno polje, ki ni bilo označeno kot obvezno, in obiskovalec je ni
videl: odstotka mu ne pokažemo, torej ni mogel vedeti, da bi en klik podvojil znesek.

**Zakaj je bila to sorodna napaka avgustovskemu popravku.** `88bca93` je odpravil dvojni
diskont, ker sta naslovljiv delež in pas izboljšave merila isto stvar. Tu je struktura
podobna, čeprav ne enaka: »Ne vemo« zniža znesek prek koeficienta **in** prepreči najvišjo
oznako zanesljivosti ([`potential.ts:200`](../src/lib/potential.ts:200)). Odločitev
projekta je, da je »zanesljivost oznaka in nikoli drug odbitek od zneska« — kar je
pravilno. Potem pa mora koeficient nositi **prior**, ne kazni. Kazen že nosi oznaka.

**Uveljavljeno: 0,45** — 25. percentil dejanske porazdelitve. Tri četrtine odgovorov bi
dale več, torej previdnost ostane, izgine pa dvakratna vrzel. Oznaka zanesljivosti se ni
spremenila.

Hkrati je odpravljen tudi vzrok: privzetek polja ni več »Ne vemo«, ampak sentinela
`MAIN_CAUSE_UNANSWERED` izven seznama možnosti
([`addressableShare.ts:142`](../src/config/modules/addressableShare.ts:142)), zato
vprašanje ne pričaka obiskovalca z že izbranim odgovorom. `unknown` je odslej rezultat
zavestne izbire »Ne vemo«, ne posledica preskoka.

---

## 5. Štiri strukturne ugotovitve

Te so pomembnejše od posameznih odstotkov, ker jih sprememba številk ne odpravi.
**Vse štiri so uveljavljene.**

### 5.1 En vzrok na modul, čeprav so vzroki sestavljeni — *odprto*

Vprašanje sili v **en** glavni vzrok, delež pa se uporabi na **celotnem** modulu.
Corsten & Gruen so za izpade zaloge v maloprodaji izmerili, da se vzroki delijo — naročanje
in napovedovanje ~34–47 %, polnjenje polic ~25 %, dobavna veriga ~25–30 %. Podjetje,
katerega izpadi so na pol napovedni in na pol dobaviteljski, mora izbrati eno; razlika med
izbirama je 0,65 proti 0,30.

Rešitve po ceni:

- **poceni:** ohrani en vzrok, a ga preimenuj v »Kaj je *najpogostejši* vzrok?« in
  koeficiente rahlo stisni proti sredini — enovzročni model sistematično precenjuje robove
- **srednje:** dovoli dva vzroka, delež je povprečje (utež 0,6 / 0,4)
- **drago:** delitev odstotkov med vzroke

### 5.2 Delež se je uporabil enotno na neenotnih postavkah — ✔ odpravljeno

`compute()` vrne tri do štiri postavke z zelo različno naravo, vse pa so dobile isti delež.
Najbolj vidno v proizvodnji, modul `MATERIAL`:

| Postavka | Delež ob vzroku »zastarele sestavnice« | Ali je to realno |
|---|---|---|
| Izmet materiala | 0,75 | **ne** — izmet ima tehnološko dno (razrez, zagon, izplen); povprečje panoge 3–8 %, dobra praksa ≤ 2,5 % |
| Reklamacije | 0,75 | verjetno da |
| Dodelave (ure) | 0,75 | da — to je ročno delo iz napačnega podatka |

Ista težava pri logistiki: prazni kilometri imajo geografsko dno, ure razporejanja ga
nimajo. Metodologija je to celo povedala — »Da bi bil vsak prazen kilometer odpravljiv,
izračun ne trdi« — a koda tega ni izvajala.

**Uveljavljeno:** postavka lahko nosi neobvezno zgornjo mejo `addressableCap`, izračun pa
uporabi `min(delež, meja)` ([`potential.ts:56`](../src/lib/potential.ts:56)). Mejo 0,5 sta
dobila izmet materiala
([`proizvodnja.ts:218`](../src/config/modules/proizvodnja.ts:218)) in prazni kilometri
([`logistika.ts:149`](../src/config/modules/logistika.ts:149)). Postavka brez meje se
obnaša natanko kot prej.

### 5.3 Dva modula brez nizke možnosti — ✔ odpravljeno

`NALOGI` (proizvodnja) in `ADMINISTRACIJA` (storitve) sta imela štiri možnosti, vse `data`
ali `planning` — **najnižje dosegljivo 0,65**, pričakovana vrednost 0,725, najvišja v
celotnem naboru.

**Uveljavljeno:** oba modula sta dobila peto možnost s kategorijo `people` —
»Usposobljenost oziroma menjava ljudi« pri nalogih in »Ključni ljudje niso na voljo, ko so
potrebni« pri administraciji.

### 5.4 Ostanek dvojnega diskonta pri zalogah — ✔ odpravljeno

V zalogovnih modulih obiskovalec sam oceni, koliko zaloge bi trajno lahko bilo manj
(`reducibleShare`). Iz tega sta nastali dve postavki, ki sta isto oceno obravnavali
različno:

| Postavka | Formula | Prej | Zdaj |
|---|---|---|---|
| Sprostljiv kapital (enkratno) | `zaloga × reducibleShare` | brez deleža | brez deleža |
| Strošek financiranja (letno) | `zaloga × reducibleShare × capitalCostRate` | **× naslovljiv delež** | brez deleža |

Isti `reducibleShare` je bil v eni vrstici razumljen kot že-naslovljiv, v drugi pa se je
množil še z 0,30–0,75. Letni strošek financiranja **istega** kapitala je bil zmanjšan
drugič — natanko vzorec, ki ga je odpravil `88bca93`, le da je ostal na tej vrstici.
Odpravljeno pri [`maloprodaja.ts:339`](../src/config/modules/maloprodaja.ts:339) in v
istovrstnih modulih.

---

## 6. Kje se ta analiza razhaja z drugo preverbo

V `docs/` vzporedno obstaja
[`erp-koristi-benchmarki-2026-08.md`](erp-koristi-benchmarki-2026-08.md), ki iste
koeficiente preverja z deloma istimi viri in za tri od njih predlaga **nasprotno smer**.
Dokumenta se ne smeta brati drug ob drugem brez te razlage.

| Koeficient | Prej | erp-koristi | ta zapisnik | Uveljavljeno |
|---|---|---|---|---|
| `data` | 0,75 | **0,80** ↑ | **0,65** ↓ | 0,75 — nobeden |
| `planning` | 0,65 | **0,70** ↑ | **0,50** ↓ | 0,65 — nobeden |
| `people` | 0,45 | **0,50** ↑ | 0,45 = | 0,45 |
| `external` | 0,25 | **0,30** ↑ | **0,30** ↑ | **0,30** — oba |
| `physical` | 0,15 | 0,15 = | 0,15 = | 0,15 — oba |
| `unknown` | 0,30 | **0,45–0,50** ↑ | **0,45** ↑ | **0,45** — oba |

Ujemanje pri `external`, `physical` in `unknown` je pomembno: **dve neodvisni preverbi z
različnima naboroma virov prideta do iste številke.** Prav ti trije predlogi so bili
uveljavljeni brez pridržka.

### Zakaj se razhajata pri ostalih treh

Razlog ni v virih, ampak v dveh prevodih, ki nista enakovredna.

**Prvi razlog: delež vzroka ni delež odpravljivosti.** Vzporedni dokument piše, da »72 %
vzrokov izpadov zaloge na ravni naročanja in polic neposredno podpira naslovljiva deleža
`planning` (0,65–0,70)«. To sta dve različni količini. 72 % pove, *kolikšen del problema
izvira* iz tega vzroka. Naslovljiv delež sprašuje nekaj drugega: *koliko problema izgine*,
ko je vzrok odpravljen.

Odgovor je v isti študiji, dve vrstici nižje. Corsten & Gruen merita tudi **dosegljivo**
znižanje: z disciplino naročanja in polic **−40 %**, ob točnem knjižnem stanju zalog
**8,9 % → 4,1 %**, kar je −54 %. Njun lastni primarni vir torej da za ta poseg
**0,40–0,54** — kar podpira 0,50 in ne 0,70. Isto velja za Aberdeenovih +17,2 %
skladnosti s planom.

**Drugi razlog: ena naloga proti celi funkciji.** Pri `data` se vzporedni dokument opira
na Billentis (60–80 %) in Politecnico di Milano (−88 % časa obdelave strukturiranega
e-računa) ter sklene, da 0,80 leži *znotraj* izmerjenega. To za **obdelavo računa** drži.
Moduli kalkulatorja pa merijo cela problemska področja — »Analitika in poročanje« vsebuje
izredne analize in združevanje podatkov, ne le prenašanja listin. Za to raven sta pravi
primerjalnik Hackettovih −45 % za celotno funkcijo in McKinseyjevih 64–69 % kot tehnični
strop.

Obe branji sta legitimni. Nista pa hkrati resnični za **isti en koeficient** — in prav to
je najbolj uporabna ugotovitev tega razdelka. Predlog 0,80 je bil zavrnjen, ker bi ležal
nad vsemi izmerjenimi dosežki in nad tehničnim stropom hkrati; predlog 0,65 ni bil
sprejet, ker so možnosti v kategoriji ozko podatkovne. Spor razreši šele razcep kategorij.

### Kje je vzporedni dokument močnejši

- **Primarni Aberdeenov 2007 nabor** (anketa 1.680 podjetij): znižanje administrativnih
  stroškov 9,3–21,4 %, operativnih 11,0–18,1 %, zalog 13,4–25,0 %. Ta zapisnik je
  Aberdeena uporabil le prek sekundarnega povzetka.
- **Panorama 2026 z navedbo strani** za deleže realiziranih koristi.
- **Corsten & Gruen kot neposredno prebran primarni vir**, vključno z odzivom kupca ob
  prazni polici in neto izgubo ~4 % prometa.

Ena opozorilna opomba velja v obe smeri. Aberdeenovih »−13,3 % administrativnih stroškov«
**ne** pomeni, da je naslovljiv delež 0,13: to je znižanje *celotnega* administrativnega
stroška, medtem ko moduli merijo strošek *enega problema*. Odprava 75 % ročne priprave
poročil je lahko hkrati le 13 % celotne administracije. Aberdeen torej 0,75 ne ovrže — in
ta zapisnik se nanj za to tudi ne sklicuje.

Meritve, ki **merijo isto osnovo** kot naši moduli — sam problem in ne funkcijo — so le
tri: Ardentov strošek na račun, Corsten & Gruenov delež izpadov in meritve zastojev pri
vzdrževanju. Prav te tri nosijo največjo težo v razdelku 4.

---

## 7. Kaj je uveljavljeno in kaj ostaja odprto

### 7.1 Uveljavljeno isti dan

| Sprememba | Kje |
|---|---|
| `external` 0,25 → **0,30** | [`addressableShare.ts:47`](../src/config/modules/addressableShare.ts:47) |
| `unknown` 0,30 → **0,45** | isto |
| `data`, `planning`, `people`, `physical` ostanejo — a z **zapisanim virom** namesto »začetne ocene« | isto |
| Privzetek polja ni več »Ne vemo«, ampak sentinela izven seznama | [`addressableShare.ts:142`](../src/config/modules/addressableShare.ts:142) |
| Zgornja meja postavke `addressableCap` + `min(delež, meja)` | [`potential.ts:56`](../src/lib/potential.ts:56) |
| Meja 0,5 za izmet materiala in prazne kilometre | [`proizvodnja.ts:218`](../src/config/modules/proizvodnja.ts:218), [`logistika.ts:149`](../src/config/modules/logistika.ts:149) |
| Peta možnost (`people`) v modulih `NALOGI` in `ADMINISTRACIJA` | proizvodnja.ts, storitve.ts |
| Odprava dvojnega diskonta pri strošku financiranja zaloge | [`maloprodaja.ts:339`](../src/config/modules/maloprodaja.ts:339) in istovrstni moduli |

### 7.2 Ostaja odprto — razcep `planning`

`planning-process` = 0,60 (vidnost, odgovornosti, opominjanje, nepostavljen proces) in
`planning-inventory` = 0,30 (parametri zalog, naročanje, varovalna zaloga). Preslikava
obstoječih 52 možnosti je nekajurno delo. **To je edina sprememba, ki razreši spor iz
razdelka 6** — izbira ene same vrednosti med 0,50 in 0,70 ga ne more.

Isto velja, v manjši meri, za `data`: ločitev prenašanja listin (0,75) od analitike in
usklajevanja (0,55) bi odpravila potrebo po kompromisu.

### 7.3 Ostaja odprto — en vzrok na modul

Glej 5.1. Dokler je vzrok en sam, enovzročni model sistematično precenjuje robove.

### 7.4 Povej, da je številka ustaljena in ne prvoletna

Nobena od meritev v razdelku 4 ni prvoletna. Panorama 2026 poroča, da je odprava silosov
narasla s 55,2 % na 77,4 % šele z zamikom — »zapoznela korist prejšnjih vlaganj«.
Akademske raziskave ERP kažejo finančni učinek šele po približno dveh letih rabe.
Prodajno poročilo in metodologija naj to povesta z eno vrstico: **znesek je letni
ustaljeni potencial, ne prihranek prvega leta.**

---

## 8. Česa ta preverba ni razrešila

1. **Kolikšen delež obiskovalcev vzrok sploh izbere.** Odkar privzetek ni več »Ne vemo«,
   je to merljivo naravnost — v izvozni zapis že gre `mainCause`. **Prvih ~50 vnosov
   nadomesti vsako oceno v razdelku 4.6.**
2. **Ali so vzroki v slovenskih MSP res 43 % podatkovni**, kot predpostavlja ponudba
   možnosti. To pove ista meritev: porazdelitev dejanskih izbir proti porazdelitvi ponudbe.
3. **Ali sta `data` in `planning` pri zgornjem robu obranljiva pred stranko.** Odgovor
   pride s prve preverbe pri stranki, ki je uvedbo zaključila, ne iz literature.
4. **Kalibracija `reducibleShare` za storitve.** Isti nabor tam množi nezaračunano delo
   (WIP) in ne zaloge blaga; maloprodajna predpostavka tam ne velja.
5. **Nobena od meritev ni slovenska.** Ardent in Hackett sta severnoameriška, Billentis
   evropski, Aberdeen globalen. Domača je le SURS-ova slika razširjenosti ERP. Prava
   kalibracija bo prišla iz Datalabovih lastnih uvedb, ne iz literature.

**Kdaj preveriti znova.** Panorama izda nov letni ERP Report vsako pomlad, Ardent svoj
nabor mer vsako poletje. Prednost pred obojim ima lastna empirija.

---

## 9. Povezave do virov

- Ardent Partners 2025, ključne mere AP: <https://www.apexanalytix.com/resources/blog/ardent-partners-key-ap-metrics-2025/>
- Ardent 2025, povzetek meritev: <https://parseur.com/blog/ai-invoice-processing-benchmarks>
- Billentis, poslovni primer e-računa: <https://billentis.com/assets/reports/e-invoicing-businesscase.pdf>
- Hackett Group 2025, Digital World Class Finance: <https://www.thehackettgroup.com/the-hackett-group-digital-world-class-finance-teams-operate-at-45-lower-cost-and-deliver-faster-smarter-insights/>
- McKinsey Global Institute, *A Future That Works*: <https://www.mckinsey.com/featured-insights/digital-disruption/harnessing-automation-for-a-future-that-works>
- Aberdeen, ERP v srednjem trgu: <https://www.sage.com/na/~/media/Company/ERP/White%20Papers/wp-2008-ERP-Aberdeen-Report>
- Panorama Consulting, *2026 ERP Report*: <https://www.panorama-consulting.com/erp-benefits-realization/>
- Corsten & Gruen, izpadi zaloge: <https://www.researchgate.net/publication/36385147>
- ECR Retail Loss, učinek urejenih evidenc: <https://ecrloss.com/research-paper/improving-inventory-records/>
- Deming Institute, 94/6: <https://deming.org/quotes/i-should-estimate-that-in-my-experience-most-troubles-and-most-possibilities-for-improvement-add-up-to-the-proportions-something-like-this94-belongs-to-the-system-responsibility-of-management6-sp-3/>
- SURS, *Digitalno podjetništvo 2025*: <https://www.stat.si/StatWeb/News/Index/14010>
- Forrester TEI, metodologija: <https://www.forrester.com/policies/tei>
- Znižanje DSO ob avtomatizaciji terjatev: <https://www.stuut.ai/blog/5-proven-strategies-to-reduce-dso-and-accelerate-cash-collection>
- TPM/CMMS in nenačrtovani zastoji: <https://oxmaint.com/article/total-productive-maintenance-tpm-implementation-framework>
- Izmet v proizvodnji, povprečje in dobra praksa: <https://www.gosmarter.ai/hubs/scrap-waste-yield-optimisation/>
