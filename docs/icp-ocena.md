# ICP ocena stranke — podroben pregled in najbolj relevantne metrike

> Poročilo dokumentira obstoječi model ocene ustreznosti stranke (ICP — *Ideal Customer Profile*),
> implementiran v `src/config/icp.ts`, oceni relevantnost posameznih metrik in našteje vrzeli
> ter priporočila za kalibracijo. Stanje: avgust 2026.

---

## 1. Povzetek

ICP ocena odgovarja na eno prodajno vprašanje: **"Kako blizu idealne stranke je podjetje, ki je pravkar oddalo vprašalnik — in ali si zasluži prednostni klic?"**

- Ocena je število **0–100**, izračunano kot vsota **7 uteženih dimenzij**.
- Prevede se v **pas A / B / C**, ki neposredno določa prioriteto obravnave.
- Pojavi se izključno v **prodajni pripravi** (prodajni PDF `pdfSales.ts` in prodajni HTML
  `salesReportHtml.ts`) — na vrhu kot kartica z oceno in na dnu kot podrobna tabela dimenzij.
  Stranka v svojem PDF-ju ocene ne vidi, a ker se datoteke prenesejo na strankino napravo,
  mora vsak stavek zdržati, da ga prebere tisti, o katerem govori.
- Ocena je **ustreznost, ne sodba**: "pod ciljnim razredom", nikoli "premajhen".

Vse uteži in pragovi so **začetne ocene, ne empirija** — datoteka je zasnovana tako, da je
uravnavanje sprememba ene vrstice v tabeli, ne poseg v logiko.

---

## 2. Kako se ocena izračuna

```
skupna ocena = Σ ( vrednost_dimenzije[0–1] × utež × 100 )      → 0–100 točk
```

1. Vsaka od 7 dimenzij dobi objekt `IcpSignals` (vsi signali, zbrani iz vprašalnika)
   in vrne **vrednost 0–1** ter **obvezno besedilno utemeljitev**.
2. Vrednost se pomnoži z utežjo dimenzije (uteži se seštejejo v natanko 1,0 — varuje test
   v `src/config/icp.test.ts`) in s 100 → prispevek v točkah.
3. Vsota prispevkov, zaokrožena na celo število, je končna ocena.

### Pasovi (`ICP_BANDS`)

| Pas | Prag | Pomen za prodajo |
|-----|------|------------------|
| **A** | ≥ 70 | Visoka ustreznost — obravnavaj prednostno. |
| **B** | ≥ 45 | Srednja ustreznost — vredno klica, a ne pred pasom A. |
| **C** | < 45 | Nizka ustreznost po zdajšnjih merilih — preveri, preden vlagaš čas. |

Meji se ne prekrivata in skupaj pokrijeta celoten razpon 0–100 (monotonost varuje test).

---

## 3. Podroben pregled dimenzij

Pregledna tabela; podrobnosti za vsako dimenzijo sledijo.

| # | Dimenzija | Utež | Ključni vhodni signali | Razpon prispevka |
|---|-----------|------|------------------------|------------------|
| 1 | Velikost podjetja | **0,20** | `employeeCount` | 0–20 točk |
| 2 | Priložnost v sedanjem sistemu | **0,20** | `improvementBandMax`, `isPantheonCustomer` | 0–20 točk |
| 3 | Izmerjena bolečina | **0,20** | `measuredLossEUR`, `highLossThresholdEUR` | 0–20 točk |
| 4 | Bližina odločevalcu | **0,15** | `roleId` | 0–15 točk |
| 5 | Nujnost zaradi rokov | **0,10** | `deadlineDates`, `generatedAtISO` | 0–10 točk |
| 6 | Resnost vnosa | **0,10** | `confidence`, `measuredAreaCount`, `offeredAreaCount` | 0–10 točk |
| 7 | Dosegljivost | **0,05** | `hasPhone`, `hasTaxNumber`, `consentOffers` | 0–5 točk |

### 3.1 Velikost podjetja (utež 0,20)

Ciljni razred je izpeljan iz imen segmentov ("Proizvodnja 10–249 zaposlenih") — edini že
zapisani podatek o ciljni velikosti. Mikro podjetja in velike hiše niso izključena, le nižje
ovrednotena.

| Zaposlenih | Vrednost | Utemeljitev |
|------------|----------|-------------|
| ni vneseno (0) | 0,35 | Števila zaposlenih ni vnesel. |
| ≤ 9 | 0,35 | Pod ciljnim razredom (mikro podjetje). |
| 10–49 | 1,00 | V ciljnem razredu. |
| 50–249 | 1,00 | V ciljnem razredu, zgornja polovica. |
| ≥ 250 | 0,60 | Nad ciljnim razredom — daljši cikel odločanja. |

Isti signal napaja tudi **velikost posla** (`dealSizeLabel`: majhen / srednji / večji /
velik posel, daljši cikel), ki je ločena oznaka in ne vpliva na oceno.

### 3.2 Priložnost v sedanjem sistemu (utež 0,20)

Meri **velikost vrzeli, ne vrste stranke**. Vhod je zgornja meja pasu izboljšave sedanjega
sistema (`improvementBandMax`, 0,08–0,40) — edini medsegmentni normalizator: 0,40 pomeni
Excel in papir, 0,08 PANTHEON z ustreznim modulom. Pas se linearno preslika na 0–1.

- ≥ 0,30 → "Velika vrzel — večino vodijo zunaj sistema."
- 0,20–0,29 → "Srednja vrzel — sistem imajo, a ne za vse."
- < 0,20 → "Majhna vrzel — ustrezen modul že uporabljajo."

Status uporabnika PANTHEON je izpisan kot **ločeno dejstvo** (nova licenca vs. nadgradnja),
ne kot pribitek ali odbitek — poslovna odločitev, kateri lead je vrednejši, še ni sprejeta,
zato dimenzija ostaja namerno nevtralna. Ob odločitvi se spremeni samo ta funkcija.

### 3.3 Izmerjena bolečina (utež 0,20)

Letna izmerjena bolečina (`measuredLossEUR` = neposredne izgube + vrednost izgubljene
kapacitete) proti **segmentnemu pragu visoke izgube** (`highLossThresholdEUR` iz
`src/config/segments.ts` — edini prag, ki je že umerjen po dejavnosti).

```
vrednost = min(1, izguba / (2 × segmentni prag))
```

Dvakratnik praga velja za polno oceno: prag sam pomeni "visoka izguba", vse nad dvakratnikom
ne pove več kot to. Utemeljitev vedno navede znesek in razmerje do praga. Če segment praga
nima, je ocena nevtralna (0,5) in utemeljitev to pove.

### 3.4 Bližina odločevalcu (utež 0,15)

Vloge so segmentno unikatne (vodjaProizvodnje, vodjaSkladisca …), zato se ujemajo po predponi —
dodajanje nove vloge v kontekst ne podre ocene.

| Vloga | Vrednost | Utemeljitev |
|-------|----------|-------------|
| direktor / lastnik | 1,00 | Odloča sam. |
| finance | 0,80 | Pozna številke in je običajno v odločitvi zraven. |
| vodja* | 0,60 | Pozna problem, o nakupu pa praviloma ne odloča sam. |
| ni podatka / "Drugo" | 0,35 | Kdo odloča, ni znano. |

### 3.5 Nujnost zaradi rokov (utež 0,10)

Edina dimenzija z **zunanjim, od stranke neodvisnim rokom** — tehnični roki (`warningDate`)
iz modula E, ki se prikaže samo obstoječim uporabnikom PANTHEON.

| Stanje | Vrednost |
|--------|----------|
| rok že potekel | 1,00 |
| rok v ≤ 365 dneh | 0,80 |
| rok čez > 365 dni | 0,50 |
| ni odkljukanega roka | 0,20 |

Utemeljitev pri "ni roka" izrecno opozarja: modul z roki se podjetju brez PANTHEON-a sploh ne
prikaže, zato nizka vrednost **ni nujno podatek o podjetju** (glej vrzel 6.2).

### 3.6 Resnost vnosa (utež 0,10)

Kdor je izpolnil vsa področja in vnesel svoje številke, je pokazal namero; kdor je kliknil
skozi s privzetki, je isti obrazec oddal z drugo temperaturo.

```
vrednost = 0,6 × zanesljivost + 0,4 × pokritost
```

- **Zanesljivost** (`confidence`): visoka → 1,0; srednja → 0,6; nizka → 0,25.
- **Pokritost**: izmerjena področja / ponujena področja segmenta.

Utemeljitev: "Izmeril X od Y področij, vnesel je konkretne številke / del vrednosti je iz
razponov / večina ključnih podatkov manjka."

### 3.7 Dosegljivost (utež 0,05)

Trije neobvezni podatki, vsak šteje tretjino: **telefon** (pristal na pogovor), **davčna
številka** (podjetje se pred klicem preveri v registru), **privolitev za ponudbe**.
Utemeljitev našteje, kaj je pustil ("Pustil: telefon, davčna." / "Pustil je samo e-naslov.").

---

## 4. Najbolj relevantne metrike — razvrstitev

### Jedrna trojica (60 % ocene) — "ali je to prava stranka"

1. **Izmerjena bolečina (0,20)** — najmočnejši signal v celem modelu, ker je edini
   **kvantificiran v evrih in normaliziran po segmentu**. Podjetje, ki je z lastnimi
   številkami izmerilo izgubo nad panožnim pragom, je samo dokazalo problem, ki ga
   PANTHEON rešuje. V B2B ERP prodaji je izmerjena bolečina najboljši napovednik zaprtja
   posla — brez nje ni razloga za menjavo sistema.
2. **Priložnost v sedanjem sistemu (0,20)** — meri, **koliko je sploh mogoče izboljšati**.
   Velika vrzel (Excel in papir) pomeni velik naslovljivi prihranek; majhna vrzel pomeni,
   da rešitev že imajo. Skupaj z bolečino tvori par "kako hudo boli × koliko se da rešiti".
3. **Velikost podjetja (0,20)** — določa, ali je posel v ciljnem razredu 10–249 zaposlenih,
   kjer sta produkt in prodajni proces uigrana. Posredno napoveduje velikost posla in
   dolžino cikla; sama zase pa ne pove nič o potrebi — zato je enakovredna, ne nadrejena
   bolečini in priložnosti.

### Podporne metrike (25 %) — "ali se posel da speljati zdaj"

4. **Bližina odločevalcu (0,15)** — najboljši lead z izmerjeno bolečino zastane, če
   izpolnjevalec ne odloča o nakupu. Direktor/lastnik na drugi strani telefona je bistvena
   razlika v dolžini cikla.
5. **Nujnost zaradi rokov (0,10)** — zunanji roki so edini časovni pritisk, ki ga prodaja
   ne more ustvariti sama. Utež je nizka, ker je signal dostopen le obstoječim strankam
   PANTHEON (glej 6.2).

### Higienske metrike (15 %) — "ali je vnos verodostojen in stranka dosegljiva"

6. **Resnost vnosa (0,10)** — ne meri ustreznosti podjetja, ampak **verodostojnost ostalih
   šestih dimenzij** in temperaturo leada. Nizka resnost pomeni: številke v oceni bolečine
   so privzetki, ne podatki.
7. **Dosegljivost (0,05)** — najnižja utež upravičeno: telefon in privolitev povesta, kako
   lahko bo do prvega kontakta, ne pa, ali je stranka prava. Ne sme prevladati — sicer bi
   "pustil telefon" premagal "izmeril 40.000 EUR izgube".

**Ključno razmerje:** trojica *bolečina + priložnost + velikost* odloči, **ali klicati**;
*odločevalec + nujnost* odločita, **kako hitro**; *resnost + dosegljivost* povesta, **koliko
verjeti številkam in kako začeti**.

---

## 5. Pravila zasnove, ki morajo preživeti vsako kalibracijo

1. **Vsaka dimenzija vrne utemeljitev, ne le število.** Ocena brez razlage se ne da
   umerjati — čez tri mesece nihče ne ve, zakaj je stranka dobila 62. Test v
   `src/config/icp.test.ts` zahteva neprazno utemeljitev za vsako dimenzijo.
2. **Ocena je ustreznost, ne sodba o podjetju.** "Pod ciljnim razredom", ne "premajhen".
   Poročilo se prenese na strankino napravo; vsak stavek mora zdržati, da ga prebere tisti,
   o katerem govori.
3. **Uravnavanje je sprememba podatkov, ne logike.** Uteži, pragovi, pasovi in razredi
   velikosti so tabele; izračun je ena sama vsota. Testi varujejo invariante: vsota uteži
   = 1, unikatni ključi, monotonost pasov.

---

## 6. Vrzeli in priporočila

### 6.1 Kalibracija po prvih ~50 vnosih

Vse uteži, pragovi in pasovi so začetne ocene. Priporočen postopek:

- Za vsak oddan vprašalnik hraniti končno oceno **in razčlenitev po dimenzijah** (utemeljitve
  so že v poročilu — treba jih je le zbirati na kupu, glej 6.3).
- Po ~50 vnosih primerjati pas (A/B/C) z dejanskim prodajnim izidom (odzval se / sestanek /
  ponudba) in uravnati najprej **pragova pasov** (70/45), šele nato uteži.
- Preveriti porazdelitev ocen: če 80 % leadov pade v isti pas, pasovi ne razvrščajo in jih
  je treba premakniti.

### 6.2 Pristranskost nujnosti

Modul E (tehnični roki) se prikaže **samo obstoječim uporabnikom PANTHEON**, zato nove
stranke pri nujnosti sistemsko dobijo 0,20 — ne zato, ker rokov nimajo, ampak ker jih nihče
ni vprašal. Koda to že pošteno opomni v utemeljitvi. Dolgoročno: bodisi najti vir nujnosti,
ki velja za vse (npr. zakonske spremembe po panogi), bodisi dimenzijo pri ne-PANTHEON
strankah normalizirati, da 10 točk ne razlikuje strank po tem, kateri obrazec so videle.

### 6.3 ICP ocena ne pride v CRM izvoz

Izvozni zapis (`buildLeadExportRecord` v `src/lib/exportRecord.ts`, dostava prek webhooka v
`src/lib/submitLead.ts` ali ročnega CSV/JSON prenosa) zajame kontakt, triažo, vnose in
vsote — **ne pa ICP ocene**: ne skupnih točk, ne pasu, ne razčlenitve po dimenzijah. Ocena
tako obstaja le v prodajnem PDF/HTML na napravi obiskovalca in se **ne da agregirati**, kar
blokira kalibracijo iz 6.1. Najkoristnejši naslednji korak ICP sklopa: v `LeadExportRecord`
dodati `icpTotal`, `icpBand` in točke po dimenzijah (novi CSV stolpci se po pravilu datoteke
dodajajo na konec).

### 6.4 Manjkajoči signali za razmislek (ob kalibraciji, ne prej)

- **Panožna ustreznost** kot samostojna dimenzija: vse panoge trenutno štejejo enako;
  če se izkaže, da se posli zapirajo pretežno v 2–3 segmentih, si panoga zasluži utež.
- **Proračun in časovnica nakupa** (klasična BANT signala): vprašalnik ju ne zajema —
  zavestna izbira (trenje obrazca), a ob kalibraciji vredna ponovnega premisleka.
- **Nova licenca vs. nadgradnja**: dimenzija priložnosti je namerno nevtralna, dokler
  poslovna odločitev ni sprejeta. Ko bo, se spremeni samo `rate()` te dimenzije.

---

## 7. Viri

| Datoteka | Vsebina |
|----------|---------|
| `src/config/icp.ts` | Celoten model: signali, dimenzije, uteži, pasovi, izračun. Edina točka uravnavanja. |
| `src/config/icp.test.ts` | Invariante: vsota uteži = 1, unikatni ključi, obvezne utemeljitve, monotonost pasov. |
| `src/config/segments.ts` | Segmentni prag visoke izgube (`highLossThresholdEUR`). |
| `src/lib/salesReport.ts` | `buildIcpSignals()` — sestavljanje signalov iz oddanega vprašalnika. |
| `src/lib/salesPlaybook.ts` | Uporaba ocene v prodajnem priročniku (velikost posla, nujnost). |
| `src/lib/pdfSales.ts`, `src/lib/salesReportHtml.ts` | Prikaz ocene v prodajnem PDF in HTML. |
