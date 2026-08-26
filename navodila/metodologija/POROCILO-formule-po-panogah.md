# Formule po panogah: popoln register vseh izračunov v aplikaciji

**Namen:** popisati vsako formulo, ki v aplikaciji proizvede številko — od vnosa v vprašalniku do zneska na zaslonu, v strankinem PDF-ju in v prodajni pripravi. Register je urejen po panogah in po področjih, znotraj vsakega področja pa po postavkah in koših. Stanje: delovno drevo **25. avgusta 2026**, veja `main`, zadnji commit `88bca93` (»Zlij odpravo dvojnega diskonta naslovljivosti v main«), z necommitanimi spremembami v **62 sledenih datotekah** — navedene vrstice veljajo za to stanje, ne za commit.

**Kratko vodilo za branje.** Kdor išče eno samo formulo za svojo panogo, gre naravnost v poglavje 4. Kdor hoče razumeti, zakaj je znesek tak, kot je, potrebuje poglavji 1 in 2 — tam sta cevovod in edini množitelj nad zneskom. Kdor preverja, ali je številka na zaslonu prava vsota, gre v poglavje 8. Kdor išče, česa aplikacija namenoma ne počne, gre v poglavje 10.

**Razmerje do sorodnega poročila.** [POROCILO-client-report-formule.md](POROCILO-client-report-formule.md) razlaga pot do **strankinega poročila** — v stavkih za direktorja, s preverjenimi zgledi. To poročilo je **inženirski register**: nosi ključe vnosnih polj, vrstice `compute()` blokov, kontekstne privzetke po panogah ter formule motorja, prodajne priprave, prikaza in neaktivne legacy poti. Vsebinsko se prekrivata samo panožni tabeli.

> **Opozorilo o sorodnem poročilu.** `POROCILO-client-report-formule.md:279` navaja sprostljive deleže »nad 20 % → 0,22 · Ne vem → 0,05« s sklicem na `shared.ts:120`. Po kalibraciji avgusta 2026 velja `shared.ts:125` — `[0,05; 0,08; 0,15; 0,25; 0,10]`, torej **0,25** in **0,10**. To poročilo navaja veljavne vrednosti; starega nismo spreminjali.

---

## 0. Povzetek in izrazje

Aplikacija pozna **sedem panog**, vsaka ima **5–6 lastnih področij** plus izbor petih horizontalnih, diagnostiko in modul tveganih rokov. Registriranih je **49 področij**: 36 panožnih, 5 horizontalnih, 7 diagnostičnih in modul E. Znesek proizvede **41 od njih** — diagnostika in modul E vrneta oceno tveganja brez evrov. Simbolni opisi za obiskovalca stojijo v `content/methodology.ts` (52 vnosov: 48 aktivnih področij — modul E ga ne potrebuje — in 4 neaktivni legacy iz poglavja 9).

| Izraz | Pomen v tej kodi | Kje je definiran |
|---|---|---|
| **Panoga** (segment) | Dejavnost, ki jo obiskovalec izbere; določa samo, katera področja se prikažejo in v kakšnem vrstnem redu | `src/config/segmentTypes.ts:1-8`, `src/config/segments.ts:63-251` |
| **Področje** (modul) | Eno stroškovno področje z lastnimi vprašanji in lastno funkcijo `compute()` | `src/config/modules/*.ts`, tip `moduleTypes.ts:250-294` |
| **Postavka** | Ena vrstica izida znotraj področja; vsaka pripada natanko enemu košu | tip `ModuleOutputDraft`, `moduleTypes.ts:201-237` |
| **Koš** (bucket) | Kategorija izida, ki določa, kam se znesek sešteje in ali sme v letno vsoto | `moduleTypes.ts:17-36` |
| **Naslovljivi delež** | Edini koeficient, ki izmerjeni strošek zmanjša na to, kar je z informacijskim sistemom rešljivo | `src/config/modules/addressableShare.ts:47-107` |

Pet košev in njihova usoda:

| Koš | Oznaka | Pomen | V letni vsoti? |
|---|:---:|---|:---:|
| `directLoss` | 💶 | Neposredna letna izguba — denar, ki je odtekel | ✓ |
| `lostMargin` | 📉 | Marža, ki ni bila zaslužena | ✓ |
| `capacity` | ⏱ | Vrednost sproščene delovne kapacitete (ni prihranek pri plačah) | ✓ |
| `oneTimeCapital` | 🔒 | Enkratno sprostljiv kapital | ✗ nikoli |
| `risk` | ⚠ | Kvalitativna ocena brez zneska | ✗ ni zneska |

Kaj to poročilo pokriva: cevovod izračuna (1), skupne konstante (2), sestavo panog (3), vse panožne formule (4), horizontalna področja (5), diagnostiko in roke (6), ocenjevalne in prodajne formule (7), prikaz in kompozicijo končnih zneskov (8), neaktivne legacy formule (9) ter izrecen popis tega, česar izračun ne počne (10).

---

## 1. Skupni cevovod: kako vsak znesek nastane

```
BusinessProfile (odgovori o dejavnosti in finančni osnovi)
   └─→ buildComputeContext()                       potential.ts:66-75
        └─→ ComputeContext { operationalHourCostEUR, adminHourCostEUR,
                             chargeOutRateEUR, annualRevenueEUR,
                             contributionMarginRate, capitalCostRate }
              ↓
resolveInputs()   moduleEngine.ts:108-118   manjkajoč vnos → privzetek polja
withoutUnknowns() moduleEngine.ts:99-105    sentinel »Ne vem« (−1) → 0
              ↓
definition.compute(input, context)          src/config/modules/*.ts
              ↓  ModuleOutputDraft[]
aggregateBuckets()  moduleEngine.ts:37-69   seštevek po petih koših
              ↓
aggregateResults()  potential.ts:280-288    + naslovljivi potencial + zanesljivost
              ↓
hero znesek · večletni pogled · doba povračila · ocena ICP · izbira follow-upa
```

**Nosilno načelo: `compute()` vrne dejanski sedanji strošek, ne prihranka.** Nad izmerjenim zneskom stoji en sam množitelj — naslovljivi delež, ki ga določi odgovor na vprašanje »Kaj je glavni vzrok?« v istem področju.

### 1.1 Naslovljivi delež (edini množitelj)

```
naslovljiv_delež = ADDRESSABLE_SHARE[kategorija glavnega vzroka]      addressableShare.ts:167-171
potencial        = Σ (valueEUR × min(naslovljiv_delež, addressableCap))   potential.ts:46-63
```

| Kategorija vzroka | Delež | Vir |
|---|---:|---|
| `data` — podatki, normativi, dokumentacija | **0,75** | `addressableShare.ts:65` |
| `planning` — planiranje, zaloge, vidnost | **0,65** | `addressableShare.ts:76` |
| `people` — znanje, disciplina, kader | **0,45** | `addressableShare.ts:78` |
| `external` — dobavitelji, kupci | **0,30** | `addressableShare.ts:85` |
| `physical` — okvare, kakovost materiala | **0,15** | `addressableShare.ts:91` |
| `unknown` — brez odgovora / »Ne vemo« | **0,45** | `addressableShare.ts:106` |

Podrobnosti mehanike: vrednosti polja so **zaporedni indeksi**, ne deleži (`mainCauseField`, `addressableShare.ts:151-164`); privzetek `MAIN_CAUSE_UNANSWERED = 99` je pozitivna sentinela, ki namerno ni med izbirami, da noben radijski gumb ni vnaprej označen (`:139`); možnost »Ne vemo« se doda samodejno (`withUnknown`, `:173-175`).

**Zgornja meja naslovljivosti** (`addressableCap`) obstaja na dveh postavkah, kjer fizika ali geografija postavi dno:

| Postavka | Meja | Vir |
|---|---:|---|
| Izmet materiala (proizvodnja) | 0,50 | `proizvodnja.ts:217` |
| Prazni kilometri (logistika) | 0,50 | `logistika.ts:148` |

**Postavke brez naslovljivega deleža v potencial ne vstopajo.** To velja za ves koš 🔒 (znesek je že sam po sebi potencial) in za strošek financiranja presežne zaloge v maloprodaji, kjer je odpravljivost že ocenila stranka (`maloprodaja.ts:331-336`).

**Pas izboljšave (`SystemGap`) ni množitelj.** Do avgusta 2026 je isti problem zmanjšal dvakrat — od 10.000 EUR izgube je pokazal 1.875 EUR namesto 7.500 EUR (`potential.ts:36-41`). Danes je izključno prodajni signal za oceno ICP in prodajno pripravo (`contexts/contextTypes.ts:32-44`, `addressableShare.ts:12-16`).

---

## 2. Skupne konstante in privzetki

### 2.1 Rezervni stroškovni kontekst

Uporabi se, kadar dejavnosti ne poznamo ali vprašanje za panogo ni zastavljeno (`DEFAULT_COST_CONTEXT`, `moduleTypes.ts:314-333`):

| Parameter | Vrednost | Opomba |
|---|---:|---|
| `operationalHourCostEUR` | 20 EUR | Operativna ura je **nižja** od administrativne |
| `adminHourCostEUR` | 26 EUR | |
| `chargeOutRateEUR` | 55 EUR | Zaračunana postavka; dejansko vprašana samo pri storitvah |
| `annualRevenueEUR` | **0** | Namerno: prihodka si ne izmišljamo, ker ga uporabnikov odstotek množi |
| `contributionMarginRate` | 0,25 | |
| `capitalCostRate` | 0,085 | WACC 8,5 % (KPMG 2025); do avgusta 2026 je bilo 6 % |

Isto vrednost stroška kapitala nosijo še `RECEIVABLES_CAPITAL_COST` (`shared.ts:37`) in rezerve v treh kontekstih (trgovina, maloprodaja, splošno) — **vse se premikajo skupaj**.

### 2.2 Skupne konstante področij (`src/config/modules/shared.ts`)

| Konstanta | Vrednost | Vir |
|---|---|---|
| `MONTHS_PER_YEAR` | 12 | `shared.ts:13` |
| `REDUCIBLE_SHARES` | `[0,05; 0,08; 0,15; 0,25; 0,10]` za izbire »do 5 % / 6–10 % / 11–20 % / nad 20 % / Ne vem« | `shared.ts:125` |
| Privzetek polja sprostljivega deleža | indeks **4** (»Ne vem« → 0,10) | `shared.ts:149` |
| `ASSURANCE_UNANSWERED` | 4 (»Nismo preverili«) | `shared.ts:51` |
| `UNKNOWN_ANSWER` | −1 (sentinel »Ne vem« pri številskih poljih) | `moduleTypes.ts:52` |

**Stopnja tveganja iz diagnostičnih odgovorov:**

```
riskLevelFromScore(ocena, maks):   razmerje ≤ 0,30 → nizko · ≤ 0,60 → srednje · sicer visoko   shared.ts:74-79
assuranceRiskLevel(odgovori):      neodgovorjena (=4) se izločijo, maksimum se skrči
                                   na 3 × število odgovorjenih; brez odgovora → brez sodbe      shared.ts:93-99
```

### 2.3 Lokalne konstante maloprodaje (`src/config/modules/maloprodaja.ts`)

| Konstanta | Vrednost | Vir |
|---|---|---|
| `OPEN_DAYS_PER_YEAR_BY_CHOICE` | `[255, 305, 355]` za 5 / 6 / 7 dni na teden | `maloprodaja.ts:49` |
| `DEFAULT_OPEN_DAYS_PER_YEAR` | 305 | `maloprodaja.ts:50` |
| `SUBSTITUTION_SHARES` | `[0,70; 0,50; 0,20; 0,50]` — delež kupcev, ki vzame nadomestek | `maloprodaja.ts:76` |
| `STOCKOUT_DEMAND_SHARES` | `[0,015; 0,035; 0,075; 0,08; 0]` — delež povpraševanja ob prazni polici | `maloprodaja.ts:92` |

### 2.4 Zaščita vnosa

```
clampNumber(vrednost, {min = 0, max, integer}):     numberInput.ts:55-60
   neveljavno (NaN/Infinity) → min
   omeji navzdol na min, navzgor na max
   integer → zaokroži
```

Privzeti `min = 0` prepreči negativne vnose; pred njim je vtipkanih −20 EUR/h dalo −9.600 EUR.

**Privzetki vseh množiteljev so 0** — `scrapSharePercent`, `errorSharePercent`, `manualSharePercent`, `wrongPriceSalesSharePercent`, `marginGapPercent` — da nedotaknjen obrazec vrne 0 EUR in ne izmišljenega zneska (obrazloženo pri `proizvodnja.ts:167-172`).

---

## 3. Pregled panog: katero področje meri katera panoga

### 3.1 Panožna področja, privzeta triaža in prag visoke izgube

| Panoga | Lastna področja | Privzeto obkljukana | Prag visoke izgube |
|---|---|---|---:|
| **Proizvodnja** | `planiranje`, `material`, `zaloge`, `nalogi`, `zamude` | prva tri po vrstnem redu | 15.000 EUR |
| **Logistika** | `odprema`, `napake`, `skladisce`, `dokumentacija`, `roki` | odprema, napake, roki | 20.000 EUR |
| **Veleprodaja** | `narocila_trgovina`, `skladisce_trgovina`, `zaloge_trgovina`, `odprema_trgovina`, `terjatve_trgovina` | zaloge, naročila, terjatve | 20.000 EUR |
| **Maloprodaja** | `razpolozljivostMp`, `zalogeMp`, `marzeMp`, `blagajnaMp`, `prevzemMp`, `kanaliMp` | police, zaloga, blagajna | 15.000 EUR |
| **Storitve** | `projekti_storitve`, `obracun_storitve`, `obseg_storitve`, `administracija_storitve`, `terjatve_storitve` | obračun, obseg, terjatve | 15.000 EUR |
| **Računovodski servis** | `zajemRs`, `strankeRs`, `obracuniRs`, `popravkiRs`, `donosnostRs` | prva tri po vrstnem redu | 10.000 EUR |
| **Splošno** | `podatkiSp`, `usklajevanjeSp`, `napakeSp`, `denarSp`, `zalogeSp` | podatki, usklajevanje, napake | 15.000 EUR |

Vir: `segments.ts:63-251`. Vse panoge priporočajo tri področja (`recommendedCount: 3`), kar pa ni trda meja — obkljukati je mogoče vsa. Prag visoke izgube vstopa v oceno ICP in v izbiro follow-up sekvence (poglavje 7).

### 3.2 Matrika panoga × horizontalno področje

| Panoga | Analitika | Finance | Kadri | Dokumenti | Servis |
|---|:---:|:---:|:---:|:---:|:---:|
| Proizvodnja | ✓ | ✓ | ✓ | ✓ | ✓ |
| Logistika | ✓ | ✓ | ✓ | — ¹ | — ² |
| Veleprodaja | ✓ | ✓ | ✓ | ✓ | ✓ |
| Maloprodaja | ✓ | ✓ | ✓ | ✓ | ✓ |
| Storitve | ✓ | ✓ | ✓ | ✓ ³ | ✓ |
| Računovodski servis | ✓ | — ⁴ | ✓ ⁵ | — ⁴ | — ⁴ |
| Splošno | — ⁶ | ✓ | ✓ | ✓ | — ⁷ |

Razlogi za izključitev (komentarji v `segments.ts:90-232`) — vsi so obramba pred dvojnim štetjem istih ur:

1. Prevozna dokumentacija (`dokumentacija`) meri iste ure.
2. `napake` že meri ure reševanja reklamacij; prevoznik garancijskega servisa praviloma nima.
3. Razmejitev drži: `dokumentiHz` meri potrjevanje in e-izmenjavo, `administracija_storitve` pa projektno administracijo.
4. Knjiženje, obračuni in zajem listin **so** produkt servisa — merijo jih `zajemRs`, `obracuniRs`, `popravkiRs`.
5. `kadriHz` meri njihove **lastne** kadre in plače, ne obračunov za stranke.
6. `podatkiSp` že meri ure ročne priprave poročil.
7. `napakeSp` že meri ponovno delo in reklamacije; segment je namenoma brez predpostavke, da podjetje sploh kaj servisira.

Vsaka panoga ima poleg tega še svojo **diagnostiko** (poglavje 6) in **modul E** o tveganih rokih (poglavje 6.1).

---

## 4. Formule po panogah

### Konvencije v tabelah

- **Koši:** 💶 neposredna izguba · 📉 nezaslužena marža · ⏱ kapaciteta · 🔒 enkratni kapital · ⚠ tveganje.
- **Urne postavke:** »oper« = operativna ura, »admin« = administrativna ura, »zaračunana« = postavka, po kateri se delo zaračuna stranki. Vrednosti so v mini-tabeli privzetkov nad vsako panogo.
- **»× 12«** pretvori mesečni vnos v letnega. Kjer ga ni, je vnos že letni — to je posebej označeno.
- **Vzrok** (»Kaj je glavni vzrok?«) v vsakem področju določi naslovljivi delež **vseh** njegovih postavk (poglavje 1.1).
- **Sprostljiv delež** zaloge izbere stranka: do 5 % → 0,05 · 6–10 % → 0,08 · 11–20 % → 0,15 · nad 20 % → 0,25 · Ne vem → 0,10.
- Diagnostika (⚠) je pri vseh panogah enaka mehanika in je iz panožnih tabel izpuščena — glej poglavje 6.
- Sklici so sidrani dvojno: ime področja in razpon vrstic funkcije `compute()`.

---

### 4.1 Proizvodnja (`src/config/modules/proizvodnja.ts`)

**Kontekstni privzetki** (`src/config/contexts/proizvodnja.ts`):

| Parameter | Pasovi (sredina) | Rezerva |
|---|---|---:|
| Operativna ura | do 17 (16) · 17–20 (18) · 20–25 (22) · nad 25 (29) | 21 EUR |
| Administrativna ura | do 20 (18) · 20–25 (22) · 25–31 (28) · nad 31 (36) | 26 EUR |
| Letni prihodek | do 2 mio (1,2 mio) · 2–5 mio (3,2 mio) · 5–15 mio (8,5 mio) · nad 15 mio (25 mio) | 0 |
| Prispevna marža | do 18 % (0,13) · 18–28 % (0,23) · 28–38 % (0,33) · nad 38 % (0,44) | 0,26 |
| Strošek kapitala | ni vprašan | 0,085 |

| Področje (modul · vrstice) | Postavka (polje) | Koš | Formula |
|---|---|:---:|---|
| **Plan, kapacitete in navodila** — `planiranje` · `:99-119` | Zastoji in nadure (`waitingHoursPerMonth`, `overtimeHoursPerMonth`) | ⏱ | (ure čakanja + nadure) × oper × 12 |
| | Ponovno planiranje (`replanningHoursPerMonth`) | ⏱ | ure × admin × 12 |
| **Izmet, dodelave in kakovost** — `material` · `:203-235` | Izmet materiala (`annualMaterialSpendEUR`, `scrapSharePercent`) | 💶 | letna poraba materiala × delež izmeta · **meja naslovljivosti 0,50** |
| | Reklamacije in vračila (`annualClaimsCostEUR`) | 💶 | vpisan letni znesek |
| | Dodelave (`reworkHoursPerMonth`) | ⏱ | ure × oper × 12 |
| **Zaloge in razpoložljivost** — `zaloge` · `:318-344` | Odpisi in razvrednotenja (`annualWriteOffEUR`) | 💶 | vpisan letni znesek |
| | Čakanje na material (`materialWaitingHoursPerMonth`) | ⏱ | ure × oper × 12 |
| | Sprostljiv obratni kapital (`inventoryValueEUR`, `reducibleShare`) | 🔒 | povprečna zaloga × sprostljiv delež |
| **Delovni nalogi in podatki** — `nalogi` · `:422-451` | Priprava nalogov (`orderAdminHoursPerMonth`) | ⏱ | ure × admin × 12 |
| | Prepisovanje med orodji (`retypingHoursPerMonth`) | ⏱ | ure × admin × 12 |
| | Popravljanje podatkov (`dataFixHoursPerMonth`) | ⏱ | ure × admin × 12 |
| **Roki in nujni stroški** — `zamude` · `:544-579` | Ekspresne nabave (`expediteCostEUR`) | 💶 | vpisan letni znesek |
| | Penali in popusti (`penaltyCostEUR`) | 💶 | vpisan letni znesek |
| | Izgubljena marža (`lostMarginEUR`) | 📉 | vpisan letni znesek (samo marža, ne cel posel) |
| | Obveščanje kupcev (`customerCommsHoursPerMonth`) | ⏱ | ure × admin × 12 |

Meje polj: `scrapSharePercent` 0–30 % s korakom 0,5 % (`:159-180`).

---

### 4.2 Logistika (`src/config/modules/logistika.ts`)

**Kontekstni privzetki** (`src/config/contexts/logistika.ts`):

| Parameter | Pasovi (sredina) | Rezerva |
|---|---|---:|
| Operativna ura | do 17 (16) · 17–19 (18) · 19–23 (21) · nad 23 (26) | 20 EUR |
| Administrativna ura | skupni pasovi | 26 EUR |
| Letni prihodek | do 1 mio (600k) · 1–3 mio (1,8 mio) · 3–10 mio (5,5 mio) · nad 10 mio (15 mio) | 0 |
| Prispevna marža | do 15 % (0,12) · 15–30 % (0,22) · 30–45 % (0,37) · nad 45 % (0,52) | 0,26 |
| Strošek kapitala | ni vprašan | 0,085 |

| Področje (modul · vrstice) | Postavka (polje) | Koš | Formula |
|---|---|:---:|---|
| **Planiranje prevozov** — `odprema` · `:131-165` | Prazni kilometri (`emptyKmPerMonth`, `costPerKmEUR`) | 💶 | prazni km × strošek km × 12 · **meja naslovljivosti 0,50** |
| | Čakanje vozil (`waitingHoursPerMonth`) | ⏱ | ure × oper × 12 |
| | Razporejanje voženj (`dispatchHoursPerMonth`) | ⏱ | ure × admin × 12 |
| **Napačne dostave in poškodbe** — `napake` · `:266-292` | Napačne dostave (`shipmentsPerMonth`, `errorSharePercent`, `costPerErrorEUR`) | 💶 | pošiljke × delež napak × strošek napake × 12 |
| | Poškodovano blago (`annualDamageCostEUR`) | 💶 | vpisan letni znesek |
| | Reševanje reklamacij (`claimHoursPerMonth`) | ⏱ | ure × admin × 12 |
| **Skladiščne operacije** — `skladisce` · `:375-400` | Popisne razlike in odpisi (`annualWriteOffEUR`) | 💶 | vpisan letni znesek |
| | Iskanje in prekladanje (`searchHoursPerMonth`) | ⏱ | ure × oper × 12 |
| | Sprostljiv kapital (`inventoryValueEUR`, `reducibleShare`) | 🔒 | povprečna zaloga × sprostljiv delež |
| **Prevozna dokumentacija** — `dokumentacija` · `:475-504` | Priprava listin (`documentHoursPerMonth`) | ⏱ | ure × admin × 12 |
| | Prepisovanje (`retypingHoursPerMonth`) | ⏱ | ure × admin × 12 |
| | Popravljanje (`dataFixHoursPerMonth`) | ⏱ | ure × admin × 12 |
| **Zamude in stojnine** — `roki` · `:599-631` | Nujni podnajemi (`expediteCostEUR`) | 💶 | vpisan letni znesek |
| | Penali in stojnine (`penaltyCostEUR`) | 💶 | vpisan letni znesek |
| | Izgubljena marža (`lostMarginEUR`) | 📉 | vpisan letni znesek |
| | Obveščanje strank (`customerCommsHoursPerMonth`) | ⏱ | ure × admin × 12 |

Meje polj: `costPerKmEUR` 0,20–1,60 EUR, privzeto **0,75 EUR/km** (`:93-107`); `errorSharePercent` 0–10 % (`:206-225`); `costPerErrorEUR` 5–300 EUR, privzeto **40 EUR** (`:226-239`).

---

### 4.3 Veleprodaja (`src/config/modules/trgovina.ts`)

**Kontekstni privzetki** (`src/config/contexts/trgovina.ts`):

| Parameter | Pasovi (sredina) | Rezerva |
|---|---|---:|
| Operativna ura | do 17 (16) · 17–19 (18) · 19–23 (21) · nad 23 (26) | 20 EUR |
| Administrativna ura | skupni pasovi | 26 EUR |
| Letni prihodek | do 2 mio (1,2 mio) · 2–5 mio (3,2 mio) · 5–15 mio (8,5 mio) · nad 15 mio (25 mio) | 0 |
| Prispevna marža | do 12 % (0,09) · 12–18 % (0,15) · 18–26 % (0,22) · nad 26 % (0,32) | 0,21 |
| **Strošek kapitala** | do 5 % (0,04) · 5–8 % (0,065) · 8–12 % (0,10) · nad 12 % (0,15) | 0,085 |

| Področje (modul · vrstice) | Postavka (polje) | Koš | Formula |
|---|---|:---:|---|
| **Naročila, ponudbe in cene** — `narocila_trgovina` · `:134-173` | Ročni vnos naročil (`orderEntryHoursPerMonth`) | ⏱ | ure × admin × 12 |
| | Prepisovanje naročil (`retypingHoursPerMonth`) | ⏱ | ure × admin × 12 |
| | Urejanje cenikov (`priceFixHoursPerMonth`) | ⏱ | ure × admin × 12 |
| | Izgubljena marža na cenah (`annualPricingMarginLossEUR`) | 📉 | vpisan letni znesek |
| **Skladišče in komisioniranje** — `skladisce_trgovina` · `:269-300` | Iskanje blaga in nadure (`searchingHoursPerMonth`, `warehouseOvertimeHoursPerMonth`) | ⏱ | (ure iskanja + nadure) × oper × 12 |
| | Ročno urejanje prevzemov (`receivingHoursPerMonth`) | ⏱ | ure × oper × 12 |
| | Inventure in preštevanja (`stockCountHoursPerYear`) | ⏱ | ure **na leto** × oper — **brez × 12** |
| **Zaloge in nekurantnost** — `zaloge_trgovina` · `:385-412` | Odpisi in nekurantna zaloga (`annualWriteOffEUR`) | 💶 | vpisan letni znesek |
| | Marža ob manjkajočem blagu (`annualStockoutMarginLossEUR`) | 📉 | vpisan letni znesek |
| | Sprostljiv kapital (`inventoryValueEUR`, `reducibleShare`) | 🔒 | povprečna zaloga × sprostljiv delež |
| **Odprema in vračila** — `odprema_trgovina` · `:509-541` | Ponovne dostave (`annualRedeliveryCostEUR`) | 💶 | vpisan letni znesek |
| | Dobropisi (`annualCreditNoteEUR`) | 💶 | vpisan letni znesek |
| | Vrnjeno blago (`annualReturnedGoodsLossEUR`) | 💶 | vpisan letni znesek |
| | Reševanje reklamacij (`claimHandlingHoursPerMonth`) | ⏱ | ure × admin × 12 |
| **Plačilni roki in terjatve** — `terjatve_trgovina` · `:621-646` | Strošek zamud (`overdueDaysAverage`) | 💶 | (letni prihodek ÷ 365) × dni zamude **nad rokom** × strošek kapitala |
| | Opominjanje (`dunningHoursPerMonth`) | ⏱ | ure × admin × 12 |
| | Odpisane terjatve (`annualBadDebtEUR`) | 💶 | vpisan letni znesek |

Pri terjatvah se šteje **samo prekoračitev nad dogovorjenim rokom**, ne celoten DSO — celotnega bi finančnik zavrnil. Polje `currentDSODays` je zato zgolj kontekstno in v formulo ne vstopa (`:574-586`).

---

### 4.4 Maloprodaja (`src/config/modules/maloprodaja.ts`)

**Kontekstni privzetki** (`src/config/contexts/maloprodaja.ts`):

| Parameter | Pasovi (sredina) | Rezerva |
|---|---|---:|
| Ura v poslovalnici | do 17 (16) · 17–20 (18) · 20–24 (22) · nad 24 (27) | 19 EUR |
| Administrativna ura | skupni pasovi | 26 EUR |
| Letni prihodek | do 1 mio (600k) · 1–3 mio (1,8 mio) · 3–10 mio (5,5 mio) · nad 10 mio (15 mio) | 0 |
| **Prispevna marža** | do 15 % (0,12) · 15–25 % (0,20) · 25–35 % (0,30) · nad 35 % (0,42) | 0,31 |
| **Strošek kapitala** | do 5 % (0,04) · 5–8 % (0,065) · 8–12 % (0,10) · nad 12 % (0,15) | 0,085 |

Maloprodaja je edina panoga s **šestimi** lastnimi področji: prazna polica in presežna zaloga sta nasprotna problema z nasprotnima vzrokoma, zato ju en modul ni mogel meriti hkrati.

| Področje (modul · vrstice) | Postavka (polje) | Koš | Formula |
|---|---|:---:|---|
| **Prazne police** — `razpolozljivostMp` · `:185-219` | Nezaslužena marža (`stockoutDemandShare`, `substitutionShare`) | 📉 | letni prihodek × delež povpraševanja × prispevna marža × (1 − delež nadomeščenih nakupov) |
| | Ekspresne dobave (`expressDeliveryCostEUR`) | 💶 | vpisan letni znesek |
| | Iskanje zaloge (`stockCheckHoursPerMonth`) | ⏱ | ure × ura v poslovalnici × 12 |
| **Presežna zaloga** — `zalogeMp` · `:310-348` | Odpisi in poteklo blago (`annualWriteOffEUR`) | 💶 | vpisan letni znesek |
| | Marža izgubljena s prisilnimi znižanji (`forcedMarkdownMarginEUR`) | 📉 | vpisan letni znesek |
| | Strošek financiranja presežne zaloge (`inventoryValueEUR`, `reducibleShare`) | 💶 | (zaloga × sprostljiv delež) × strošek kapitala — **brez naslovljivega deleža** |
| | Sprostljiv obratni kapital | 🔒 | zaloga × sprostljiv delež |
| **Cene, akcije in marža** — `marzeMp` · `:458-489` | Marža ob napačni ceni (`wrongPriceSalesSharePercent`, `marginGapPercent`) | 📉 | letni prihodek × delež prodaje po napačni ceni × razlika v marži |
| | Neizkoriščeni rabati (`unclaimedRebatesEUR`) | 💶 | vpisan letni znesek |
| | Vzdrževanje cenikov (`priceMaintenanceHoursPerMonth`) | ⏱ | ure × admin × 12 |
| **Blagajna in inventure** — `blagajnaMp` · `:591-624` | Dnevni zaključki blagajn (`tillCount`, `closingMinutesPerTillPerDay`, `openDaysPerWeek`) | ⏱ | (blagajne × minute zaključka × odprti dnevi na leto) ÷ 60 × ura v poslovalnici |
| | Inventurni manko (`shrinkageEUR`) | 💶 | vpisan letni znesek |
| | Izvedba inventur (`stocktakeHoursPerYear`) | ⏱ | ure **na leto** × ura v poslovalnici — **brez × 12** |
| **Prevzem blaga in prenosi** — `prevzemMp` · `:702-731` | Prevzem blaga (`goodsReceiptHoursPerMonth`) | ⏱ | ure × ura v poslovalnici × 12 |
| | Usklajevanje dokumentov (`documentMatchingHoursPerMonth`) | ⏱ | ure × admin × 12 |
| | Prenosi med poslovalnicami (`transferHoursPerMonth`) | ⏱ | ure × ura v poslovalnici × 12 |
| **Spletna prodaja in vračila** — `kanaliMp` · `:819-852` | Marža odpovedanih naročil (`cancelledOrderSalesEUR`) | 📉 | vrednost odpovedanih naročil × prispevna marža |
| | Neposredni stroški vračil (`returnsPerMonth`, `costPerReturnEUR`) | 💶 | vračila × strošek vračila × 12 |
| | Usklajevanje med kanali (`catalogSyncHoursPerMonth`) | ⏱ | ure × admin × 12 |
| | Obdelava spletnih naročil (`orderProcessingHoursPerMonth`) | ⏱ | ure × ura v poslovalnici × 12 |

**Substitucija se odšteje samo enkrat.** `STOCKOUT_DEMAND_SHARES` meri bruto povpraševanje, `(1 − substitucija)` je edini odbitek — prej je bila odšteta dvakrat (`maloprodaja.ts:78-92`). Odprti dnevi: 5 dni → 255, 6 dni → 305, 7 dni → 355. Meje polj: `wrongPriceSalesSharePercent` 0–15 %, `marginGapPercent` 0–20 %.

---

### 4.5 Storitve (`src/config/modules/storitve.ts`)

**Kontekstni privzetki** (`src/config/contexts/storitve.ts`):

| Parameter | Pasovi (sredina) | Rezerva |
|---|---|---:|
| Izvedbena ura | do 22 (18) · 22–28 (25) · 28–35 (32) · nad 35 (40) | 29 EUR |
| Administrativna ura | skupni pasovi | 26 EUR |
| **Zaračunana postavka** | do 42 (36) · 42–60 (50) · 60–85 (72) · nad 85 (105) | 55 EUR |
| Letni prihodek | do 0,5 mio (300k) · 0,5–2 mio (1,1 mio) · 2–5 mio (3,2 mio) · nad 5 mio (8 mio) | 0 |
| Prispevna marža | do 30 % (0,25) · 30–50 % (0,40) · 50–70 % (0,60) · nad 70 % (0,78) | 0,40 |

**Načelo panoge:** ura gre **ali** med nezaračunane (💶, vrednotena po *zaračunani* postavki) **ali** med interne (⏱, vrednotena po *strošku* ure) — nikoli oboje (`storitve.ts:27-36`). Storitve so edina panoga, kjer je postavka vprašana in kjer se ena postavka vrednoti po ceni, ne po strošku.

| Področje (modul · vrstice) | Postavka (polje) | Koš | Formula |
|---|---|:---:|---|
| **Plan, prioritete, zasedenost** — `projekti_storitve` · `:105-125` | Zastoji in nadure (`idleHoursPerMonth`, `overtimeHoursPerMonth`) | ⏱ | (prazne ure + nadure) × izvedbena × 12 |
| | Prerazporejanje (`replanningHoursPerMonth`) | ⏱ | ure × admin × 12 |
| **Evidenca dela in zaračunavanje** — `obracun_storitve` · `:212-241` | Opravljene, a nezaračunane ure (`unbilledHoursPerMonth`) | 💶 | ure × **zaračunana postavka** × 12 |
| | Dobropisi in popravki računov (`creditNoteCostEUR`) | 💶 | vpisan letni znesek |
| | Naknadna evidenca (`projectTimesheetHoursPerMonth`) | ⏱ | ure × admin × 12 |
| **Obseg, spremembe, dodelave** — `obseg_storitve` · `:322-347` | Delo nad dogovorjenim obsegom (`overrunHoursPerMonth`) | ⏱ | ure × izvedbena × 12 |
| | Popravki po pripombah (`reworkHoursPerMonth`) | ⏱ | ure × izvedbena × 12 |
| | Odpisi ob obračunu (`writeOffEUR`) | 💶 | vpisan letni znesek |
| **Projektna administracija** — `administracija_storitve` · `:426-455` | Ponudbe in poročila (`projectAdminHoursPerMonth`) | ⏱ | ure × admin × 12 |
| | Prepisovanje (`retypingHoursPerMonth`) | ⏱ | ure × admin × 12 |
| | Popravljanje (`dataFixHoursPerMonth`) | ⏱ | ure × admin × 12 |
| **Roki, plačila, vezan denar** — `terjatve_storitve` · `:538-572` | Kazni in popusti (`penaltyCostEUR`) | 💶 | vpisan letni znesek |
| | Izgubljena prispevna marža (`lostMarginEUR`) | 📉 | vpisan letni znesek |
| | Obveščanje naročnikov (`clientCommsHoursPerMonth`) | ⏱ | ure × admin × 12 |
| | Sprostljiv kapital v nezaračunanem delu (`unbilledWipEUR`, `reducibleShare`) | 🔒 | nezaračunano delo × sprostljiv delež |

Ključ `projectTimesheetHoursPerMonth` je namerno drugačen od `timesheetHoursPerMonth` v `kadriHz`, da se isti čas ne šteje dvakrat (`storitve.ts:169-174`). Pri sprostljivem deležu velja opozorilo iz kode: isti nabor tu množi **nezaračunano delo**, ne zaloge blaga — maloprodajna kalibracija tam ne velja (`shared.ts:121-123`).

---

### 4.6 Računovodski servis (`src/config/modules/racunovodstvo.ts`)

**Kontekstni privzetki** (`src/config/contexts/racunovodstvo.ts`):

| Parameter | Pasovi (sredina) | Rezerva |
|---|---|---:|
| Računovodska ura | do 19 (17) · 19–24 (22) · 24–30 (27) · nad 30 (35) | 25 EUR |
| Administrativna/vodstvena ura | skupni pasovi | **33 EUR** |
| Letni prihodek | do 0,3 mio (200k) · 0,3–1 mio (600k) · 1–3 mio (1,8 mio) · nad 3 mio (5 mio) | 0 |
| Prispevna marža | do 30 % (0,25) · 30–45 % (0,38) · 45–60 % (0,52) · nad 60 % (0,68) | 0,48 |

Panoga **nima koša 🔒** — servis nima zalog (`racunovodstvo.ts:30-32`).

| Področje (modul · vrstice) | Postavka (polje) | Koš | Formula |
|---|---|:---:|---|
| **Zajem in vnos listin** — `zajemRs` · `:138-169` | Ročni vnos listin (`documentsPerMonth`, `manualSharePercent`, `minutesPerManualDocument`) | ⏱ | (listine × delež ročnih × minute na listino ÷ 60) × računovodska × 12 |
| | Prepisovanje med programi (`retypingHoursPerMonth`) | ⏱ | ure × računovodska × 12 |
| | Skeniranje in arhiviranje (`filingHoursPerMonth`) | ⏱ | ure × računovodska × 12 |
| **Listine strank in komunikacija** — `strankeRs` · `:248-270` | Lovljenje listin (`chasingHoursPerMonth`) | ⏱ | ure × računovodska × 12 |
| | Odgovarjanje na vprašanja (`inquiryHoursPerMonth`) | ⏱ | ure × vodstvena × 12 |
| **Obračuni, roki, konice** — `obracuniRs` · `:367-401` | Nadure ob obračunih (`overtimeHoursPerMonth`) | ⏱ | ure × računovodska × 12 |
| | Ročna priprava obračunov (`closingPrepHoursPerMonth`) | ⏱ | ure × računovodska × 12 |
| | Zunanja pomoč v konicah (`externalHelpCostEUR`) | 💶 | vpisan letni znesek |
| | Globe in obresti (`latePenaltyCostEUR`) | 💶 | vpisan letni znesek |
| **Napake in popravki** — `popravkiRs` · `:476-509` | Popravljanje knjižb (`correctionHoursPerMonth`) | ⏱ | ure × računovodska × 12 |
| | Dodatne kontrole pred oddajo (`reviewHoursPerMonth`) | ⏱ | ure × vodstvena × 12 |
| | Samoprijave in doplačila (`selfReportCostEUR`) | 💶 | vpisan letni znesek |
| | Dobropisi in odpisi (`creditNoteCostEUR`) | 💶 | vpisan letni znesek |
| **Neobračunano delo in donosnost** — `donosnostRs` · `:603-630` | Neobračunano opravljeno delo (`unbilledHoursPerMonth`) | ⏱ | ure × računovodska × 12 |
| | Stranke pod lastno ceno (`belowCostClients`, `belowCostDeficitEUR`) | 📉 | število strank × mesečni primanjkljaj × 12 |

Meje polj: `minutesPerManualDocument` 0,5–15 minut, privzeto **3 minute** (`:101-115`).

**Kapacitetni preračun panoge** (izven `compute()`, `calculations.ts:63-68`):

```
»+X strank brez nove zaposlitve« = sproščene ure na mesec ÷ ure na stranko na mesec
```

Delitelj je odgovor stranke (`hoursPerClientPerMonth`), sicer rezerva **8 ur** (`segments.ts:221`). Operator `||` namesto `??` preprečuje deljenje z nič in izpis »+∞ strank« (`CalculatorFlow.tsx:455-461`).

---

### 4.7 Splošno (`src/config/modules/splosno.ts`)

**Kontekstni privzetki** (`src/config/contexts/splosno.ts`):

| Parameter | Pasovi (sredina) | Rezerva |
|---|---|---:|
| Operativna ura | do 17 (16) · 17–19 (18) · 19–23 (21) · nad 23 (26) | 20 EUR |
| Administrativna ura | skupni pasovi | 26 EUR |
| Letni prihodek | do 1 mio (600k) · 1–3 mio (1,8 mio) · 3–10 mio (5,5 mio) · nad 10 mio (15 mio) | 0 |
| Prispevna marža | do 15 % (0,12) · 15–25 % (0,20) · 25–35 % (0,30) · nad 35 % (0,42) | 0,28 |
| **Strošek kapitala** | do 5 % (0,04) · 5–8 % (0,065) · 8–12 % (0,10) · nad 12 % (0,15) | 0,085 |

| Področje (modul · vrstice) | Postavka (polje) | Koš | Formula |
|---|---|:---:|---|
| **Ročno delo s podatki** — `podatkiSp` · `:107-136` | Vnašanje in prepisovanje (`entryHoursPerMonth`) | ⏱ | ure × admin × 12 |
| | Popravljanje podatkov (`dataFixHoursPerMonth`) | ⏱ | ure × admin × 12 |
| | Ročna priprava poročil (`reportingHoursPerMonth`) | ⏱ | ure × admin × 12 |
| **Usklajevanje in iskanje** — `usklajevanjeSp` · `:212-239` | Zastoji (`waitingHoursPerMonth`) | ⏱ | ure × oper × 12 |
| | Iskanje informacij (`searchHoursPerMonth`) | ⏱ | ure × admin × 12 |
| | Statusna vprašanja (`statusHoursPerMonth`) | ⏱ | ure × admin × 12 |
| **Napake in ponovno delo** — `napakeSp` · `:322-353` | Popravljanje in ponavljanje (`reworkHoursPerMonth`) | ⏱ | ure × oper × 12 |
| | Reklamacije in dobropisi (`annualClaimCostEUR`) | 💶 | vpisan letni znesek |
| | Izgubljena prispevna marža (`annualLostMarginEUR`) | 📉 | vpisan letni znesek |
| **Plačilni roki in terjatve** — `denarSp` · `:429-454` | Strošek zamud (`overdueDaysAverage`) | 💶 | (letni prihodek ÷ 365) × dni zamude × strošek kapitala |
| | Odpisane terjatve (`annualBadDebtEUR`) | 💶 | vpisan letni znesek |
| | Opominjanje (`dunningHoursPerMonth`) | ⏱ | ure × admin × 12 |
| **Zaloge in vezan kapital** — `zalogeSp` · `:526-544` | Odpisi in razvrednotenja (`annualWriteOffEUR`) | 💶 | vpisan letni znesek |
| | Sprostljiv kapital (`inventoryValueEUR`, `reducibleShare`) | 🔒 | povprečna zaloga × sprostljiv delež |

Segment ima namerno **ožje pasove izboljšave** kot ostali (0,08–0,18 · 0,12–0,25 · 0,20–0,35), ker o podjetju vemo najmanj (`contexts/splosno.ts:42-83`).

---

## 5. Horizontalna področja (enkrat za vse panoge)

Pet področij iz `src/config/modules/horizontal.ts` je identično v vsaki panogi, ki jih vključuje (matrika v poglavju 3.2). **Vse ure se vrednotijo po administrativni postavki**, z eno izjemo pri servisu.

| Področje (modul · vrstice) | Postavka (polje) | Koš | Formula |
|---|---|:---:|---|
| **Analitika in poročanje** — `analitikaHz` · `:99-128` | Redna poročila (`reportPrepHoursPerMonth`) | ⏱ | ure × admin × 12 |
| | Izredne analize (`adHocAnalysisHoursPerMonth`) | ⏱ | ure × admin × 12 |
| | Združevanje podatkov (`dataMergeHoursPerMonth`) | ⏱ | ure × admin × 12 |
| **Računovodstvo in finance** — `financeHz` · `:215-248` | Ročno knjiženje (`bookingHoursPerMonth`) | ⏱ | ure × admin × 12 |
| | Usklajevanje (`reconciliationHoursPerMonth`) | ⏱ | ure × admin × 12 |
| | Obračuni državi (`closingHoursPerMonth`) | ⏱ | ure × admin × 12 |
| | Zamudne obresti in globe (`annualPenaltyEUR`) | 💶 | vpisan letni znesek |
| **Kadri in plače** — `kadriHz` · `:324-357` | Evidence prisotnosti (`timesheetHoursPerMonth`) | ⏱ | ure × admin × 12 |
| | Priprava plač (`payrollPrepHoursPerMonth`) | ⏱ | ure × admin × 12 |
| | Kadrovska administracija (`hrAdminHoursPerMonth`) | ⏱ | ure × admin × 12 |
| | Napačni obračuni plač (`annualPayrollErrorEUR`) | 💶 | vpisan letni znesek |
| **Dokumentacija in e-poslovanje** — `dokumentiHz` · `:443-476` | Potrjevanje dokumentov (`approvalHoursPerMonth`) | ⏱ | ure × admin × 12 |
| | Iskanje in arhiviranje (`searchArchiveHoursPerMonth`) | ⏱ | ure × admin × 12 |
| | Tiskanje in pošiljanje (`manualExchangeHoursPerMonth`) | ⏱ | ure × admin × 12 |
| | Prepozni dokumenti (`annualDocDelayEUR`) | 💶 | vpisan letni znesek |
| **Reklamacije in poprodajni servis** — `servisHz` · `:567-594` | Garancijska popravila (`serviceWorkHoursPerMonth`) | ⏱ | ure × **oper** × 12 |
| | Vodenje reklamacij (`rmaAdminHoursPerMonth`) | ⏱ | ure × admin × 12 |
| | Nadomestni deli in servis (`annualServiceCostEUR`) | 💶 | vpisan letni znesek |

---

## 6. Diagnostika in tveganja (brez zneskov)

Vsaka panoga ima eno diagnostično področje z **enako mehaniko in panožnimi vprašanji**. Štiri vprašanja se ocenijo po lestvici `0 Da, zanesljivo · 1 Večinoma · 2 Le približno · 3 Ne · 4 Nismo preverili` in se združijo v dve oceni tveganja:

```
podatkovno tveganje = assuranceRiskLevel(prvo, drugo vprašanje)
procesno tveganje   = assuranceRiskLevel(tretje, četrto vprašanje)
```

Neodgovorjena vprašanja se izločijo, maksimum se skrči na `3 × število odgovorjenih`; če ni odgovorjeno nič, sodbe ni. Pragova: razmerje ≤ 0,30 → nizko, ≤ 0,60 → srednje, sicer visoko (`shared.ts:74-99`).

| Panoga | Področje (vrstice) | Podatkovni par | Procesni par |
|---|---|---|---|
| Proizvodnja | `diagnostika` · `:643-663` | sprotno evidentiranje + poznavanje lastne cene | sledljivost materiala + neodvisnost od ključne osebe |
| Logistika | `diagnostika_logistika` · `:696-716` | sprotno evidentiranje + poznavanje stroška vožnje | sledljivost pošiljk + neodvisnost od ključne osebe |
| Veleprodaja | `diagnostika_trgovina` · `:711-731` | točnost zaloge + poznavanje marže artikla | sledljivost pošiljk + neodvisnost od ključne osebe |
| Maloprodaja | `diagnostikaMp` · `:917-937` | točnost zaloge + poznavanje marže artikla | sledljivost blaga + neodvisnost od ključne osebe |
| Storitve | `diagnostika_storitve` · `:636-656` | sprotno evidentiranje + poznavanje marže projekta | dokumentiran obseg + neodvisnost od ključne osebe |
| Računovodski servis | `diagnostikaRs` · `:694-714` | ure na stranko + donosnost strank | revizijska sled + neodvisnost od ključne osebe |
| Splošno | `diagnostikaSp` · `:608-628` | poznavanje lastne cene + en vir resnice | revizijska sled + neodvisnost od ključne osebe |

**Zakaj brez zneska:** kjer ni sledljivosti, ni zneska. Diagnostika meri, koliko je mogoče verjeti ostalim številkam, in bi z lastnim zneskom to sporočilo izničila.

### 6.1 Modul E — tvegani stroški (`src/config/modules/moduleE.ts:21-62`)

Tri odkljukljive postavke, brez izračuna; vsaka odkljukana vrne tveganje visoke stopnje. Modul je enak za vse panoge in se prikaže samo, kadar je izbran sistem PANTHEON (`contexts/index.ts:58-62`).

| Postavka | Rok | Posledica |
|---|---|---|
| SQL Server 2016 | **14. 7. 2026** | Podpora je potekla — rok je že mimo |
| Windows Server 2016 | **12. 1. 2027** | Podpora se konča |
| Nimamo kanala za e-račune | **1. 1. 2028** | ZIERDED: kupec ne bo mogel plačati; globa do 3.000 EUR |

Datumi vstopajo v oceno nujnosti pri ICP (poglavje 7.3).

---

## 7. Ocenjevalne in prodajne formule

### 7.1 Zanesljivost izračuna (`src/lib/potential.ts:144-258`)

Ocena je **denarno tehtana**: področje, ki nosi več evrov, bolj vpliva na oznako.

```
za vsako področje:   delež izpolnjenosti = izpolnjena številska polja ÷ vsa številska polja
utež področja      = vsota njegovih letnih evrov                            potential.ts:261-268
skupni delež       = Σ (utež × delež izpolnjenosti) ÷ Σ utež                potential.ts:244-249

Pragovi (po vrsti):
   manjka prihodek, ki ga neko izpolnjeno področje potrebuje  → nizka        potential.ts:253
   skupni delež ≤ 0,5  ali so vse predpostavke le ocenjene    → nizka        potential.ts:255
   nič ocenjenega, nič »ne vem« in skupni delež ≥ 0,8         → visoka       potential.ts:256
   sicer                                                       → srednja      potential.ts:257
```

Nizka zanesljivost spremeni tudi prikaz: znesek dobi predpono »najmanj« (poglavje 8.4).

### 7.2 Verjetnost vnesenih ur (`src/lib/plausibility.ts`)

```
razpoložljive ure = število zaposlenih × 160 h/mesec              plausibility.ts:18
delež kapacitete  = vnesene ure ÷ razpoložljive ure               plausibility.ts:68
opozorilo, če     delež > 0,40                                    plausibility.ts:27, :75
```

Ure z enoto »h/leto« se pred seštevkom delijo z 12 (`:62`).

### 7.3 Ocena ustreznosti stranke — ICP (`src/config/icp.ts`)

```
točke dimenzije = clamp01(vrednost) × utež × 100                  icp.ts:350
skupna ocena    = zaokroženo Σ točk                               icp.ts:355
pas             = ≥ 70 → A · ≥ 45 → B · sicer C                   icp.ts:139-152
```

| Dimenzija | Utež | Kako se izračuna |
|---|---:|---|
| Velikost podjetja | 0,20 | tabela ustreznosti: ≤ 9 zaposlenih → 0,35 · 10–249 → 1,00 · nad 249 → 0,60 |
| Priložnost | 0,20 | `(zgornji pas izboljšave − 0,08) ÷ (0,40 − 0,08)` |
| Bolečina | 0,20 | `izmerjena izguba ÷ (prag visoke izgube × 2)`; brez praga → 0,50 |
| Vloga sogovornika | 0,15 | direktor ali lastnik 1,00 · finance 0,80 · vodja 0,60 · sicer 0,35 |
| Nujnost | 0,10 | rok potekel → 1,00 · v enem letu → 0,80 · brez rokov → 0,20 · sicer 0,50 |
| Angažiranost | 0,10 | `zanesljivost × 0,6 + pokritost × 0,4`, kjer je zanesljivost visoka 1,00 / srednja 0,60 / nizka 0,25 |
| Dosegljivost | 0,05 | delež izpolnjenega med telefonom, davčno številko in privolitvijo |

Uteži se seštejejo v **1,00**, kar varuje test (`icp.ts:61`). Prag visoke izgube je panožen (poglavje 3.1).

### 7.4 Prodajna priprava (`src/lib/salesPlaybook.ts:165-232`)

| Ugovor, ki se predvidi | Sprožilec |
|---|---|
| »Številka je napihnjena« | zanesljivost = nizka |
| »Nimamo podatkov« | vsaj 3 neodgovorjena ali nedotaknjena polja |
| »Vzrok je zunanji« | neko področje ima naslovljivi delež 0,30 |
| »Že imamo PANTHEON« | izbran sistem je PANTHEON |
| »Nekaterih področij nismo merili« | neizmerjeno področje z oceno triaže ≥ 2 |
| »Nimamo časa za uvedbo« | izmerjena bolečina > 0 in zgornji pas izboljšave ≥ 0,25 |
| »Nisem jaz odločevalec« | vloga ni direktor ali lastnik |
| »Smo že poskusili« | zgornji pas izboljšave ≤ 0,20 |

Iztočnice za pogovor izbere neizmerjeno področje z oceno triaže ≥ 2; največ šest vprašanj (`:48`).

### 7.5 Izbira nadaljnjega stika (`src/lib/followUp.ts:26-39`)

```
letna izguba za ta namen = 💶 + 📉        (kapaciteta in kapital NE štejeta)   CalculatorFlow.tsx:466

panoga je računovodski servis                      → »accounting-lm07-bridge«
izguba nad panožnim pragom in prisotno tveganje E  → »high-loss-with-risk«
izguba nad panožnim pragom brez tveganja E         → »high-loss-no-risk«
sicer                                              → »low-loss-newsletter«
```

Kapaciteta je namerno izpuščena: sproščene ure niso denar na računu in ne opravičujejo najbolj vsiljive sekvence (`followUp.ts:12-17`).

---

## 8. Prikaz in kompozicija rezultata

### 8.1 Glavni znesek (hero)

```
hero = 💶 neposredne izgube + 📉 nezaslužena marža + ⏱ kapaciteta            ResultsView.tsx:83
spodnja/zgornja meja = ista vsota, izračunana iz spodnjih/zgornjih predpostavk  ResultsView.tsx:84-91
```

🔒 enkratni kapital v vsoto **nikoli** ne vstopa.

> **Znana podvojitev.** Ista formula stoji na dveh mestih — `ResultsView.tsx:83` in `CalculatorFlow.tsx:698` (tekoča vsota med vnosi) — brez skupne funkcije v `src/lib/`. Tretja, drugačna vsota brez kapacitete živi v `CalculatorFlow.tsx:466` za izbiro follow-upa; ta je namerna (poglavje 7.5). Ob spremembi definicije je treba popraviti obe prvi mesti hkrati.

### 8.2 Razpon namesto točke (`src/lib/range.ts`)

Razpon nastane **samo** iz razpršenosti skupnih predpostavk (urne postavke, prihodek, marža, strošek kapitala), ne iz negotovosti o odpravljivosti — ta je ocenjena enkrat.

```
če imajo vse predpostavke ostro vrednost  → razpona ni, prikaže se točka       range.ts:111
sicer: dva konteksta (vse spodnje meje, vse zgornje meje) → dva izračuna       range.ts:113-130
razpon se skrije, če se zaokroženi meji ujemata                               range.ts:171-175
```

### 8.3 Večletni pogled in doba povračila (`src/lib/horizon.ts`)

| Izračun | Formula | Konstanta |
|---|---|---|
| Trileten pogled | letni znesek × 3 | `HORIZON_YEARS = 3` (`:22`) |
| Cena delovnega dne | letni znesek ÷ 252 | `WORKING_DAYS_PER_YEAR = 252` (`:30`) |
| Cena meseca odlašanja | letni znesek ÷ 12 | `MONTHS_PER_YEAR = 12` (`:32`) |
| Doba povračila | (investicija ÷ letni potencial) × 12 | `:82-86` |

Tabela povračila se prikaže samo pri potencialu **nad 10.000 EUR** (`:51`) in primerja tri nevtralne stopnje investicije: **30.000 / 60.000 / 120.000 EUR** (`:42`). To izrecno **niso cene PANTHEON** — v repozitoriju ni nobene cene. Doba povračila vrne »ni podatka« namesto neskončnosti, kadar potencial ni pozitiven.

### 8.4 Zaokroževanje in oblika zneska (`src/lib/format.ts`)

```
formatAmount(znesek):                                                          format.ts:72-82
   1. razpon (če se zaokroženi meji razlikujeta)      → »12.400 – 19.800 EUR«
   2. zaokroženo na 0                                 → »ni izmerjeno«
   3. nizka zanesljivost                              → »najmanj 12.400 EUR«
   4. sicer                                           → »12.400 EUR«
```

Vsi zneski so zaokroženi na cele evre v slovenskem zapisu. Postavka dobi svojo kartico šele nad **`MIN_FIGURE_EUR = 100`** (`:54`) — prag stoji tu, ker je prej vsako prikazovalo drugače in je isti izračun na zaslonu in v PDF-ju pokazal različno število kartic.

### 8.5 Drugi prikazni pragovi

| Prag | Vrednost | Vir |
|---|---|---|
| Neizmerjeno področje velja za pereče | ocena triaže ≥ 2 | `ResultsView.tsx:106` |
| Kartica kapacitete | > 0 EUR | `ResultsSummary.tsx:84` |
| Kartici marže in kapitala | ≥ 100 EUR | `ResultsSummary.tsx:73, :94` |
| Os grafa (zaokrožitev navzgor) | koraki 1 / 2 / 2,5 / 5 / 10 × velikostni red | `pdf.ts:129-135` |

---

## 9. Neaktivne in legacy formule

Te formule **niso v živi poti** — obstajajo samo zaradi migracijskega testa in v aplikaciji ne proizvedejo nobene številke.

| Formula | Izraz | Vir |
|---|---|---|
| Modul A (dokumenti) | (listine × minute ÷ 60) × urna postavka × 12 | `calculations.ts:12-16` |
| Modul B (napake) | transakcije × delež napak × strošek napake × 12 | `calculations.ts:26-29` |
| Modul C (zaloge) | (zaloga × delež znižanja) × strošek kapitala | `calculations.ts:42-46` |
| Modul D (terjatve) | (prihodek ÷ 365) × dni × oportunitetni strošek | `calculations.ts:57-60` |
| Skupna izguba | A + B + C + D | `calculations.ts:76-83` |

Njihovi privzetki so v `src/config/modules/legacyTrgovina.ts` (urna postavka 25 EUR, delež napak 1,5 %, znižanje zaloge 4 %, strošek kapitala 10 %, dnevi 5, oportunitetni strošek 6 %).

**Izjema:** `calculateAccountingCapacity` (`calculations.ts:63-68`) v isti datoteki **je** v živi poti — uporablja jo računovodski servis (poglavje 4.6).

---

## 10. Česa v izračunu ni

| Česa ni | Zakaj |
|---|---|
| **Diskontiranja, NPV, IRR** | Trileten pogled je gola multiplikacija `letni × 3` — brez rasti, inflacije in diskontne stopnje. Vsaka od teh predpostavk bi terjala svojo obrambo; izpustitev je celo konservativna, saj kapacitetne postavke rastejo s plačami (`horizon.ts:56-60`) |
| **Pasu izboljšave kot množitelja** | Do avgusta 2026 je isti problem zmanjšal dvakrat; danes je le prodajni signal (`potential.ts:36-41`) |
| **Prihranka pri plačah** | ⏱ meri vrednost sproščenega časa: zaposleni ostane, njegov čas se preusmeri |
| **Seštevanja enkratnega kapitala z letnimi zneski** | 🔒 stoji ločeno v vsakem prikazu, grafu in vsoti |
| **Celotnega DSO** | Šteje se samo prekoračitev nad dogovorjenim rokom — celotnega bi finančnik zavrnil |
| **Cen PANTHEON** | Stopnje v tabeli povračila so nevtralne primerjave, ne ponudba (`horizon.ts:36-42`) |
| **Fizičnega ponovnega komisioniranja** | Namerno se ne šteje nikjer — podštevanje je boljše od dvojnega štetja (`trgovina.ts:32-37`) |
| **Prihodka kot privzetka** | Rezerva je 0, ker bi vsak drug privzetek ustvaril znesek, ki ga ni vnesel nihče |

**Zaščite pred dvojnim štetjem** so vgrajene na osmih mestih: enkratni kapital izven letne vsote; koš 🔒 brez naslovljivega deleža; strošek financiranja presežne zaloge brez deleža; substitucija odšteta enkrat; odstranjen pas izboljšave; preimenovani podvojeni ključi polj (`projectTimesheetHoursPerMonth`, `closingPrepHoursPerMonth`); horizontale izpuščene tam, kjer bi se prekrivale (poglavje 3.2); kontekstna polja, ki v formulo ne vstopajo.

---

## 11. Kje kaj preveriti v kodi

| Vprašanje | Datoteka |
|---|---|
| Katera področja ima panoga, kaj je privzeto obkljukano | `src/config/segments.ts` |
| Kaj področje vpraša in kako računa | `src/config/modules/<panoga>.ts`, funkcija `compute()` |
| Naslovljivi deleži in njihova utemeljitev | `src/config/modules/addressableShare.ts` |
| Sprostljivi deleži, ocene tveganja | `src/config/modules/shared.ts` |
| Urne postavke, prihodkovni pasovi, marže po panogah | `src/config/contexts/<panoga>.ts` |
| Rezervne vrednosti, kadar dejavnost ni znana | `src/config/modules/moduleTypes.ts` (`DEFAULT_COST_CONTEXT`) |
| Seštevanje po koših, triaža, največja postavka | `src/lib/moduleEngine.ts` |
| Naslovljivi potencial in zanesljivost | `src/lib/potential.ts` |
| Razpon, večletni pogled, doba povračila | `src/lib/range.ts`, `src/lib/horizon.ts` |
| Zaokroževanje in oblika zneskov | `src/lib/format.ts` |
| Ocena ustreznosti stranke | `src/config/icp.ts` |
| Sestava hero zneska in prikaznih pragov | `src/components/Results/ResultsView.tsx` |
| Besedni opisi formul za obiskovalca | `content/methodology.ts` (52 vnosov) |

### Omejitve

- **Vrstice veljajo za stanje z začetka poročila** (`main` @ `88bca93`, necommitane spremembe v 62 datotekah). Ker delovno drevo ni čisto, se bodo ob naslednjem commitu verjetno zamaknile — zato je vsak sklic sidran tudi z imenom področja ali konstante. Pri preverjanju najprej poišči identifikator, šele nato vrstico.
- **Poročilo ne presoja pravilnosti kalibracij.** Popisuje, kaj koda počne, ne, ali so deleži pravilno umerjeni; utemeljitve vrednosti so v komentarjih izvorne kode in v `docs/`.
- **Ob spremembi katere koli formule je treba posodobiti to poročilo in [POROCILO-client-report-formule.md](POROCILO-client-report-formule.md).** Slednje je danes ponekod zastarelo (glej opozorilo v uvodu).
- **Preverjeni zgledi z dejanskimi številkami** so v sorodnem poročilu, razdelek 9; to poročilo jih namerno ne podvaja.
