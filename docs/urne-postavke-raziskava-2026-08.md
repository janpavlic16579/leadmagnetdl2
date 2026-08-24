# Preverba urnih postavk proti trgu, avgust 2026

Zapisnik druge preverbe urnih postavk. Prva
([`urne-postavke-raziskava-2026.md`](urne-postavke-raziskava-2026.md), 18. 8. 2026) je
postavke izpeljala iz plač SURS za leto 2022. Ta preverba jih usidra na **izmerjene**
podatke in doda pregled zadnjih treh let po vsaki dejavnosti, ki jo kalkulator ponuja.

Poizvedbe: **24. avgusta 2026**. Kaj velja zdaj, pove referenca
[`urne-postavke.md`](urne-postavke.md); ta dokument pove, kaj smo primerjali in zakaj se
je postavka premaknila.

---

## 0. Povzetek

**Postavke so bile previsoke za 4–13 %.** Vse operativne so znižane, ena (vodstvena ura
v računovodstvu) je bila previsoka najmanj, zaračunana postavka ostane nespremenjena.

| Vprašanje | Prej | Zdaj | Sprememba |
|---|---|---|---|
| Proizvodnja, operativna ura | 23 | **21** | −8,7 % |
| Logistika, operativna ura | 22 | **20** | −9,1 % |
| Veleprodaja, operativna ura | 22 | **20** | −9,1 % |
| Maloprodaja, operativna ura | 21 | **19** | −9,5 % |
| Storitve, izvedbena ura | 32 | **29** | −9,4 % |
| Računovodstvo, operativna ura | 26 | **25** | −3,8 % |
| Splošno, operativna ura | 23 | **20** | −13,0 % |
| Administrativna ura (skupna) | 27 | **26** | −3,7 % |
| Računovodstvo, vodstvena ura | 34 | **33** | −2,9 % |
| Storitve, zaračunana postavka | 55 | **55** | — |

Vzroka sta bila dva in oba sta bila v prejšnji izpeljavi, ne v formuli:

1. **Ekstrapolacija iz leta 2022 je prestrelila za 5–10 %.** Prejšnji zapisnik je
   domneval, da novejših plač po poklicih ni in jih ne bo do okoli 2028. SURS je 16.
   aprila 2026 objavil strukturno statistiko plač za **oktober 2025**; tabela
   `0711360S` pokriva oktober 2023, 2024 in 2025. Ekstrapolacija je bila torej
   nepotrebna — in netočna, ker so se razmerja med poklici v treh letih premaknila bolj,
   kot je predpostavljal enotni faktor 1,3252.
2. **Sidra so bila vzeta iz povprečja vseh sektorjev.** Javni sektor dvigne povprečje za
   8,4 % (2.519 proti 2.324 EUR v zasebnem, oktober 2025). Ciljno podjetje kalkulatorja
   je zasebno MSP.

Primer, ki oboje pokaže naenkrat: prejšnja izpeljava je prodajalca postavila na 19,5
EUR/h, kar ustreza bruto plači **2.018 EUR**. Dejanska plača prodajalca v zasebnem
sektorju je bila oktobra 2025 **1.731 EUR** (mediana 1.626).

### Nasprotna napaka, ki je to deloma prekrivala

Preverba je odkrila tudi napako v drugo smer. Formula `(bruto × 1,171 + 4.787) / 1.700`
**podceni izmerjeni strošek dela za 12,4 %**. Nacionalni računi za 2025 dajo 27,05 EUR
na opravljeno uro (D.1 37.194 mio EUR / 1.375.222 tisoč ur), formula pri isti plači pa
23,78 EUR. Oba člena sta prenizka: dodatki so v resnici okoli 5.960 EUR (formula 4.787)
in opravljenih ur je okoli 1.571 (formula 1.700).

Napaki nasprotnih predznakov sta se doslej deloma izničevali — a **neenakomerno po
segmentih**, ker sta pavšalni dodatek in delitelj relativno težja pri nizko plačanih
poklicih. Zato je bilo popačeno predvsem razmerje med dejavnostmi, ne le raven.

### Kako je izpeljan privzetek

Vsak segment ima **košarico poklicev SKP-08**, ki ustreza poklicem, naštetim v polju
`help` pri vprašanju — ne enega izbranega poklica. Za vsak poklic se vzame plača
zasebnega sektorja za oktober 2025 (povprečje in mediana), prevrednoti na avgust 2026 s
panožnim faktorjem rasti in pretvori v EUR/h po dveh neodvisnih poteh:

- **Pot A — formula aplikacije:** `(bruto × 12 × 1,171 + 4.787) / 1.700`
- **Pot B — izmerjeni strošek dela:** 28,2 EUR/h za poslovno gospodarstvo 2026
  (nacionalni računi, prevrednoteno), skaliran z razmerjem plače poklica do povprečja

Privzetek je **sredina obeh**. Pot A sama bi prihranke sistematično podcenila za dobro
desetino; pot B sama predpostavlja, da strošek raste sorazmerno s plačo, kar pri nizko
plačanih ne drži povsem, ker so dodatki pavšalni. Sredina je manj napačna od obeh.

**Meje pasov so kvartili dejanske porazdelitve** plač v košarici (Q1, mediana, Q3),
pretvorjeni v EUR/h — ne izbrane na roko. Dno vseh nizov je 15 EUR.

### Skok minimalne plače

Januarja 2026 je minimalna plača zrasla s 1.277,72 na **1.481,88 EUR** (+15,97 %) ob
5,9-odstotni rasti povprečne plače. Oktobra 2025 je bil **spodnji kvartil skoraj vsakega
operativnega poklica pod to mejo**:

| Poklic | 10. percentil | 1. kvartil | Mediana | v razmerju do min. plače 2026 |
|---|---|---|---|---|
| Prodajalec | 1.150 | 1.425 | 1.626 | Q1 = 96 % |
| Blagajnik | 1.064 | 1.432 | 1.646 | Q1 = 97 % |
| Delavec za polnjenje polic | 1.296 | 1.392 | 1.525 | Q1 = 94 % |
| Voznik težkega tovornjaka | 1.290 | 1.415 | 1.651 | Q1 = 96 % |
| Sestavljavec strojev | 1.168 | 1.444 | 1.664 | Q1 = 97 % |
| Varilec | 1.284 | 1.437 | 1.820 | Q1 = 97 % |
| Uradnik za pisarniško poslovanje | 1.022 | 1.440 | 1.844 | Q1 = 97 % |
| Skladiščnik | 1.378 | 1.583 | 1.864 | Q1 = 107 % |

V teh poklicih je najmanj četrtina zaposlenih dobila dvig, večji od panožnega povprečja.
Enotni panožni faktor bi jih podcenil, zato je učinek pri maloprodaji, logistiki,
veleprodaji, splošnem segmentu in administrativni uri vračunan posebej. Pri vsakem
segmentu spodaj je zapisano, koliko znaša.

**Delavec na minimalni plači stane 15,06 EUR/h** polnega stroška — zato se noben pas ne
začne pod 15 EUR.

---

## 1. Pregled zadnjih treh let po dejavnostih

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

Stolpec **EUR/h** je sredina obeh poti, izračunana iz plače junija 2026. To so
povprečja **cele panoge z vodstvom**, zato so nad postavko posameznega operativnega
poklica — uporabna so kot zgornja meja verjetnosti, ne kot sidro.

---

## 2. Po posameznih dejavnostih

### Proizvodnja

`src/config/contexts/proizvodnja.ts` — *operativna (proizvodna) ura*  
Privzetek **23 → 21 EUR/h** (-8,7 %) · pasovi `do 17 · 17–20 · 20–25 · nad 25`

| Poklic (SKP-08) | okt. 2023 | okt. 2024 | okt. 2025 | rast 2 leti | mediana 2025 | pot A | pot B |
|---|---|---|---|---|---|---|---|
| 82 Sestavljavci strojev in izdelkov | 1.544 | 1.659 | 1.743 | +12,9 % | 1.664 | 17,8 | 19,3 |
| 8211 Sestavljavec mehanskih strojev | — | — | 1.974 | — | 1.804 | 19,8 | 21,8 |
| 7212 Varilec | 1.596 | 1.863 | 1.968 | +23,3 % | 1.820 | 19,7 | 21,8 |
| 8 Upravljavci strojev, operaterji | 1.731 | 1.882 | 1.981 | +14,5 % | 1.844 | 19,8 | 21,9 |
| 81 Upravljavci strojev in naprav | 1.911 | 2.071 | 2.152 | +12,6 % | 2.078 | 21,3 | 23,8 |
| 7223 Strugar | 1.947 | 2.095 | 2.209 | +13,4 % | 2.118 | 21,8 | 24,4 |
| 7222 Orodjar | — | — | — | — | 2.080 | — | — |
| 7412 Elektromehanik | 2.055 | 2.310 | 2.422 | +17,9 % | 2.244 | 23,6 | 26,8 |
| **Košarica — sredina povprečja in mediane** | | | | | | **20,1** | **22,2** |

Sredina obeh poti je **21,1 EUR/h** → privzetek **21**.

| Panožna kontrola (SKD 2025) | 2023 | 2024 | 2025 | jun. 2026 | rast 3 leta |
|---|---|---|---|---|---|
| C PREDELOVALNE DEJAVNOSTI | 2.230 | 2.381 | 2.467 | 2.552 | +14,4 % |
| C25 Proizvodnja kovinskih izdelkov, razen strojev in | 2.037 | 2.196 | 2.273 | 2.346 | +15,2 % |
| C28 Proizvodnja strojev in naprav, d. n. | 2.413 | 2.549 | 2.642 | 2.732 | +13,2 % |

### Logistika in transport

`src/config/contexts/logistika.ts` — *operativna ura*  
Privzetek **22 → 20 EUR/h** (-9,1 %) · pasovi `do 17 · 17–19 · 19–23 · nad 23`

| Poklic (SKP-08) | okt. 2023 | okt. 2024 | okt. 2025 | rast 2 leti | mediana 2025 | pot A | pot B |
|---|---|---|---|---|---|---|---|
| 8332 Voznik težkega tovornjaka | 1.619 | 1.763 | 1.869 | +15,4 % | 1.651 | 19,0 | 20,9 |
| 4321 Skladiščnik, uradnik za nabavo in prodajo | 1.776 | 1.917 | 1.976 | +11,3 % | 1.864 | 20,0 | 22,1 |
| 933 Preprosta transportna in skladiščna dela | 1.653 | 1.760 | 1.872 | +13,3 % | 1.753 | 19,1 | 20,9 |
| 9333 Delavec za prekladalna dela | 1.664 | 1.761 | 1.876 | +12,7 % | 1.741 | 19,1 | 21,0 |
| **Košarica — sredina povprečja in mediane** | | | | | | **18,6** | **20,4** |

Sredina obeh poti je **19,5 EUR/h** → privzetek **20**. V ceno je vštet učinek skoka minimalne plače (+10 EUR na mesečno plačo).

| Panožna kontrola (SKD 2025) | 2023 | 2024 | 2025 | jun. 2026 | rast 3 leta |
|---|---|---|---|---|---|
| H PREVOZ IN SKLADIŠČENJE | 1.999 | 2.151 | 2.240 | 2.303 | +15,2 % |
| H49.41 Cestni tovorni prevoz | 1.592 | 1.711 | 1.802 | 1.873 | +17,7 % |
| H52.10 Skladiščenje | 1.707 | 1.813 | 1.840 | 1.941 | +13,7 % |
| H52.25 Logistične storitve | 2.251 | 2.395 | 2.478 | 2.563 | +13,9 % |

### Trgovina, veleprodaja in distribucija

`src/config/contexts/trgovina.ts` — *ura v skladišču*  
Privzetek **22 → 20 EUR/h** (-9,1 %) · pasovi `do 17 · 17–19 · 19–23 · nad 23`

| Poklic (SKP-08) | okt. 2023 | okt. 2024 | okt. 2025 | rast 2 leti | mediana 2025 | pot A | pot B |
|---|---|---|---|---|---|---|---|
| 4321 Skladiščnik, uradnik za nabavo in prodajo | 1.776 | 1.917 | 1.976 | +11,3 % | 1.864 | 19,8 | 21,9 |
| 933 Preprosta transportna in skladiščna dela | 1.653 | 1.760 | 1.872 | +13,3 % | 1.753 | 18,9 | 20,8 |
| 9333 Delavec za prekladalna dela | 1.664 | 1.761 | 1.876 | +12,7 % | 1.741 | 19,0 | 20,8 |
| **Košarica — sredina povprečja in mediane** | | | | | | **18,7** | **20,5** |

Sredina obeh poti je **19,6 EUR/h** → privzetek **20**. V ceno je vštet učinek skoka minimalne plače (+10 EUR na mesečno plačo).

| Panožna kontrola (SKD 2025) | 2023 | 2024 | 2025 | jun. 2026 | rast 3 leta |
|---|---|---|---|---|---|
| G TRGOVINA | 2.114 | 2.241 | 2.320 | 2.403 | +13,6 % |
| G46 Trgovina na debelo | 2.473 | 2.598 | 2.692 | 2.777 | +12,3 % |

### Maloprodaja

`src/config/contexts/maloprodaja.ts` — *ura v poslovalnici*  
Privzetek **21 → 19 EUR/h** (-9,5 %) · pasovi `do 17 · 17–20 · 20–24 · nad 24`

| Poklic (SKP-08) | okt. 2023 | okt. 2024 | okt. 2025 | rast 2 leti | mediana 2025 | pot A | pot B |
|---|---|---|---|---|---|---|---|
| 5223 Prodajalec | 1.576 | 1.702 | 1.731 | +9,8 % | 1.626 | 17,9 | 19,4 |
| 5230 Blagajnik | — | — | 1.754 | — | 1.646 | 18,1 | 19,7 |
| 4321 Skladiščnik, uradnik za nabavo in prodajo | 1.776 | 1.917 | 1.976 | +11,3 % | 1.864 | 20,0 | 22,1 |
| 9334 Delavec za polnjenje polic | — | — | — | — | 1.525 | — | — |
| **Košarica — sredina povprečja in mediane** | | | | | | **17,9** | **19,5** |

Sredina obeh poti je **18,7 EUR/h** → privzetek **19**. V ceno je vštet učinek skoka minimalne plače (+27 EUR na mesečno plačo).

| Panožna kontrola (SKD 2025) | 2023 | 2024 | 2025 | jun. 2026 | rast 3 leta |
|---|---|---|---|---|---|
| G TRGOVINA | 2.114 | 2.241 | 2.320 | 2.403 | +13,6 % |
| G47 Trgovina na drobno | 1.876 | 2.004 | 2.065 | 2.146 | +14,4 % |

### Storitvena in projektna podjetja

`src/config/contexts/storitve.ts` — *izvedbena ura*  
Privzetek **32 → 29 EUR/h** (-9,4 %) · pasovi `do 22 · 22–28 · 28–35 · nad 35`

| Poklic (SKP-08) | okt. 2023 | okt. 2024 | okt. 2025 | rast 2 leti | mediana 2025 | pot A | pot B |
|---|---|---|---|---|---|---|---|
| 2141 Inženir, tehnolog v proizvodnji | 2.869 | 3.102 | 3.244 | +13,1 % | 3.081 | 30,6 | 35,8 |
| 2144 Inženir strojništva | 3.164 | 3.355 | 3.504 | +10,7 % | 3.188 | 32,8 | 38,7 |
| 3115 Tehnik za strojništvo | 2.354 | 2.513 | 2.685 | +14,1 % | 2.492 | 25,8 | 29,7 |
| 2514 Programer aplikacij | 3.005 | 3.236 | 3.383 | +12,6 % | 3.125 | 31,8 | 37,4 |
| 2166 Grafični in multimedijski oblikovalec | 2.105 | 2.225 | 2.307 | +9,6 % | 2.097 | 22,6 | 25,5 |
| 2149 Strokovnjak tehnično-tehnoloških strok | 2.797 | 2.949 | 3.119 | +11,5 % | 2.880 | 29,5 | 34,4 |
| 7233 Mehanik, serviser strojev | 2.106 | 2.265 | 2.404 | +14,1 % | 2.256 | 23,4 | 26,5 |
| **Košarica — sredina povprečja in mediane** | | | | | | **27,1** | **31,4** |

Sredina obeh poti je **29,3 EUR/h** → privzetek **29**.

| Panožna kontrola (SKD 2025) | 2023 | 2024 | 2025 | jun. 2026 | rast 3 leta |
|---|---|---|---|---|---|
| N STROKOVNE, ZNANSTVENE IN TEHNIČNE DEJAVNOSTI | 2.584 | 2.732 | 2.833 | 2.918 | +13,0 % |
| N70 Dejavnost uprav podjetij, podjetniško in poslovn | 2.575 | 2.711 | 2.744 | 2.807 | +9,0 % |
| N71.12 Inženirska dejavnost in s tem povezano svetov | 2.589 | 2.762 | 2.869 | 2.977 | +15,0 % |
| K62 Računalniško programiranje, svetovanje in druge  | 3.316 | 3.511 | 3.634 | 3.711 | +11,9 % |

### Računovodski servisi

`src/config/contexts/racunovodstvo.ts` — *računovodska ura*  
Privzetek **26 → 25 EUR/h** (-3,8 %) · pasovi `do 19 · 19–24 · 24–30 · nad 30`

| Poklic (SKP-08) | okt. 2023 | okt. 2024 | okt. 2025 | rast 2 leti | mediana 2025 | pot A | pot B |
|---|---|---|---|---|---|---|---|
| 3313 Knjigovodja | 2.138 | 2.280 | 2.428 | +13,6 % | 2.232 | 24,0 | 27,4 |
| 4311 Uradnik v računovodstvu | 2.180 | 2.305 | 2.402 | +10,2 % | 2.214 | 23,8 | 27,1 |
| **Košarica — sredina povprečja in mediane** | | | | | | **23,1** | **26,1** |

Sredina obeh poti je **24,6 EUR/h** → privzetek **25**.

| Panožna kontrola (SKD 2025) | 2023 | 2024 | 2025 | jun. 2026 | rast 3 leta |
|---|---|---|---|---|---|
| N69.20 Računovodske, knjigovodske in revizijske deja | 2.152 | 2.289 | 2.414 | 2.520 | +17,1 % |

### Splošno (neznana dejavnost)

`src/config/contexts/splosno.ts` — *neposredna ura*  
Privzetek **23 → 20 EUR/h** (-13,0 %) · pasovi `do 17 · 17–19 · 19–23 · nad 23`

| Poklic (SKP-08) | okt. 2023 | okt. 2024 | okt. 2025 | rast 2 leti | mediana 2025 | pot A | pot B |
|---|---|---|---|---|---|---|---|
| 8 Upravljavci strojev, operaterji | 1.731 | 1.882 | 1.981 | +14,5 % | 1.844 | 20,1 | 22,3 |
| 82 Sestavljavci strojev in izdelkov | 1.544 | 1.659 | 1.743 | +12,9 % | 1.664 | 18,0 | 19,6 |
| 4321 Skladiščnik, uradnik za nabavo in prodajo | 1.776 | 1.917 | 1.976 | +11,3 % | 1.864 | 20,1 | 22,2 |
| 7233 Mehanik, serviser strojev | 2.106 | 2.265 | 2.404 | +14,1 % | 2.256 | 23,8 | 27,0 |
| 5223 Prodajalec | 1.576 | 1.702 | 1.731 | +9,8 % | 1.626 | 17,9 | 19,5 |
| 933 Preprosta transportna in skladiščna dela | 1.653 | 1.760 | 1.872 | +13,3 % | 1.753 | 19,2 | 21,1 |
| **Košarica — sredina povprečja in mediane** | | | | | | **19,3** | **21,3** |

Sredina obeh poti je **20,3 EUR/h** → privzetek **20**. V ceno je vštet učinek skoka minimalne plače (+14 EUR na mesečno plačo).

| Panožna kontrola (SKD 2025) | 2023 | 2024 | 2025 | jun. 2026 | rast 3 leta |
|---|---|---|---|---|---|
| Vse dejavnosti skupaj | 2.255 | 2.395 | 2.536 | 2.626 | +16,5 % |

### Administrativna ura — skupna vsem sedmim

`src/config/contexts/shared.ts` — *administrativna oziroma vodstvena ura*  
Privzetek **27 → 26 EUR/h** (-3,7 %) · pasovi `do 20 · 20–25 · 25–31 · nad 31`

| Poklic (SKP-08) | okt. 2023 | okt. 2024 | okt. 2025 | rast 2 leti | mediana 2025 | pot A | pot B |
|---|---|---|---|---|---|---|---|
| 4110 Uradnik za splošno pisarniško poslovanje | 1.725 | 1.859 | 1.962 | +13,7 % | 1.844 | 19,9 | 22,0 |
| 3323 Nabavni referent | 2.373 | 2.533 | 2.672 | +12,6 % | 2.444 | 26,0 | 29,9 |
| 3322 Komercialni zastopnik za prodajo | 2.458 | 2.607 | 2.736 | +11,3 % | 2.394 | 26,6 | 30,7 |
| 4323 Prometni odpravnik, referent za transport | 2.059 | 2.217 | 2.333 | +13,3 % | 2.117 | 23,1 | 26,2 |
| 3331 Špediter | 2.428 | 2.541 | 2.675 | +10,2 % | 2.506 | 26,1 | 30,0 |
| 4322 Uradnik za izračune količin | 2.298 | 2.438 | 2.658 | +15,7 % | 2.512 | 25,9 | 29,8 |
| 3122 Nadzornik v predelovalnih dejavnostih | 2.546 | 2.738 | 2.843 | +11,7 % | 2.624 | 27,5 | 31,9 |
| **Košarica — sredina povprečja in mediane** | | | | | | **24,1** | **27,5** |

Sredina obeh poti je **25,8 EUR/h** → privzetek **26**. V ceno je vštet učinek skoka minimalne plače (+7 EUR na mesečno plačo).

| Panožna kontrola (SKD 2025) | 2023 | 2024 | 2025 | jun. 2026 | rast 3 leta |
|---|---|---|---|---|---|
| Vse dejavnosti skupaj | 2.255 | 2.395 | 2.536 | 2.626 | +16,5 % |

### Računovodstvo — vodstvena ura

`src/config/contexts/racunovodstvo.ts` — *vodstvena oziroma strokovna ura*  
Privzetek **34 → 33 EUR/h** (-2,9 %) · pasovi `isti nabor kot administrativna`

| Poklic (SKP-08) | okt. 2023 | okt. 2024 | okt. 2025 | rast 2 leti | mediana 2025 | pot A | pot B |
|---|---|---|---|---|---|---|---|
| 2411 Strokovnjak za računovodstvo in revizijo | 2.955 | 3.118 | 3.296 | +11,5 % | 2.932 | 31,6 | 37,1 |
| **Košarica — sredina povprečja in mediane** | | | | | | **30,0** | **35,1** |

Sredina obeh poti je **32,6 EUR/h** → privzetek **33**.

| Panožna kontrola (SKD 2025) | 2023 | 2024 | 2025 | jun. 2026 | rast 3 leta |
|---|---|---|---|---|---|
| N69.20 Računovodske, knjigovodske in revizijske deja | 2.152 | 2.289 | 2.414 | 2.520 | +17,1 % |

---

## 3. Kar smo preverili in se ni spremenilo

| Člen | Stanje | Vir |
|---|---|---|
| Prispevki delodajalca 17,10 % | **drži** (16,10 % + 1 % ZDOsk-1 od 1. 7. 2025) | ZDOsk-1, FURS |
| Minimalna plača 1.481,88 EUR | **drži** | Uradni list RS 2026-01-0175 |
| Malica 7,96 EUR/dan | **drži** | Uredba o davčni obravnavi povračil stroškov |
| Prevoz 0,21 EUR/km oz. najmanj 140 EUR/mesec | **drži** | ista uredba |
| Regres ni že v bruto plači SURS | **drži** — ni dvojnega štetja | SURS `0701029S`, meritev 7 |
| Zaračunana postavka 55 EUR | **drži** | IZS 2026, GZS IKT, tržni ceniki |

**Regres in dvojno štetje.** Preverili smo, ali SURS regres že všteva v bruto plačo — v
tem primeru bi ga formula štela dvakrat. Ne všteva ga: izredna izplačila, ki v bruto
plačo štejejo (13. plača, nagrade), znašajo v Sloveniji le okoli **283 EUR na
zaposlenega letno** (vsota julij 2025 – junij 2026), regres pa je najmanj 1.482 EUR.
Junijski dvig plače (2.682 → 2.751 EUR) torej ni regres.

**Velikost podjetja ni razlog za popust.** Preverili smo domnevo, da MSP plačajo manj na
uro od povprečja. Eurostatova raziskava o stroških dela (`lc_ncost_r2`, velikostni
razredi, 2020) je ne potrdi: podjetja z 10–49 zaposlenimi plačajo 96 % povprečnega
stroška na opravljeno uro, podjetja s 50–249 zaposlenimi pa 104 %. Cenejša so le mikro
podjetja pod 10 zaposlenih (84 %), ki niso ciljna skupina. Posebnega popusta za MSP zato
ni v izpeljavi.

**Zaračunana postavka ostane 55 EUR.** Sidra so preverjena in držijo:

| Vir | Razpon |
|---|---|
| IZS 2026, temeljna vrednost storitve | 72,52 EUR/h (razredi 50,76–152,29, priporočeno odstopanje ±15 %) |
| GZS, referenčni cenik IKT | 32 EUR (pomožna dela) → 58 (programer I) → 79 (analitik) → 143 (ekspert) |
| Računovodske storitve, tržne cene 2026 | knjiženje 50–88 EUR/h, svetovanje 81–190 |
| Razvoj programske opreme, objavljeni ceniki | programiranje 76 EUR/h + DDV, analitik 109 |

Sredina trga za splošno storitveno podjetje ostaja 50–72 EUR/h. Ker je to **cena in ne
strošek**, bi znižanje umetno zmanjšalo prikazani prihodek iz sproščenih ur — ravno
nasprotno od namena te preverbe. 55 EUR ostane zadržana sredina.

---

## 4. Kaj je bilo spremenjeno v kodi

| Datoteka | Sprememba |
|---|---|
| `src/config/contexts/proizvodnja.ts` | pasovi + privzetka 23 → 21 in 27 → 26 |
| `src/config/contexts/logistika.ts` | pasovi + privzetka 22 → 20 in 27 → 26 |
| `src/config/contexts/trgovina.ts` | pasovi + privzetka 22 → 20 in 27 → 26 |
| `src/config/contexts/maloprodaja.ts` | pasovi + privzetka 21 → 19 in 27 → 26 |
| `src/config/contexts/storitve.ts` | pasovi + privzetka 32 → 29 in 27 → 26; zaračunana ostane 55 |
| `src/config/contexts/racunovodstvo.ts` | pasovi + privzetka 26 → 25 in 34 → 33 |
| `src/config/contexts/splosno.ts` | pasovi + privzetka 23 → 20 in 27 → 26 |
| `src/config/contexts/shared.ts` | `ADMIN_HOUR_BANDS` na nov nabor |
| `src/config/modules/moduleTypes.ts` | `DEFAULT_COST_CONTEXT` 22/25/55 → **20/26/55** |

`DEFAULT_COST_CONTEXT` je bil ob prejšnji kalibraciji spregledan in je od avgusta 2026
nosil predkalibracijske vrednosti, ki se z dokumentacijo niso ujemale. Zdaj je usklajen
s segmentom `splosno`, ker se uporabi prav takrat, ko dejavnosti ne poznamo.

Komentarji nad vsakim naborom pasov navajajo nova sidra. Prejšnja preverba je opozorila
na primer, ko je komentar navajal drugo številko kot koda — zato so komentarji
posodobljeni v isti spremembi kot vrednosti, ne kasneje.

### Kaj varujejo testi

`src/config/contexts/contexts.test.ts` preverja invariante, ne vrednosti:

- privzetek leži v **natanko enem** pasu (sicer bi `industryAverageBand` vrnil točko ali
  bil odvisen od vrstnega reda v konfiguraciji);
- sredine pasov so znotraj vprašanja različne (sicer bi `StepCostBasis` označil dva
  radia hkrati);
- nobena postavka ni 0;
- zaračunano postavko vpraša samo segment `storitve`.

Vseh devet novih privzetkov leži **strogo znotraj** enega pasu, ne na meji: meja bi
ustrezala dvema pasovoma hkrati, ker `industryAverageBand` primerja vključujoče
(`>= minEUR && <= maxEUR`).

---

## 5. Kako preverbo ponoviti

Vse poizvedbe so brez ključa. PxWeb zahteva `POST` z JSON telesom.

**SURS — plače po poklicih, zasebni sektor, z mediano:**

```
POST https://pxweb.stat.si/SiStatData/api/v1/sl/Data/0711360S.px
{"query":[
  {"code":"MESEC","selection":{"filter":"item","values":["2023M10","2024M10","2025M10"]}},
  {"code":"SEKTOR","selection":{"filter":"item","values":["2"]}},
  {"code":"SKUPINA POKLICEV","selection":{"filter":"item","values":["TOT","5223","8332","4321"]}},
  {"code":"PLAČA","selection":{"filter":"item","values":["1"]}},
  {"code":"MERITVE","selection":{"filter":"item","values":["1","2","3","5"]}}],
 "response":{"format":"json-stat2"}}
```

`SEKTOR`: `TOT` skupaj, `1` javni, `2` zasebni. `MERITVE`: `1` povprečje, `2` mediana,
`3` spodnji kvartil, `4` zgornji kvartil, `5` 10. percentil, `6` 90., `7` 99., `8`
standardni odklon. `GET` na isti naslov vrne metapodatke z vsemi 608 poklici.

**SURS — plače po dejavnostih (faktorji prevrednotenja):**

```
POST https://pxweb.stat.si/SiStatData/api/v1/sl/Data/0701029S.px
{"query":[
  {"code":"SKD DEJAVNOST","selection":{"filter":"item","values":["TOT","C","G46","G47","H49.41","N69.20"]}},
  {"code":"MESEC","selection":{"filter":"item","values":["2025M06","2026M06"]}},
  {"code":"PLAČE","selection":{"filter":"item","values":["1"]}},
  {"code":"MERITVE","selection":{"filter":"item","values":["4"]}}],
 "response":{"format":"json-stat2"}}
```

`MERITVE`: `1` plača za mesec, `4` drseče 12-mesečno povprečje (najbolj stabilno), `5`
plača na plačano uro, `7` izredna izplačila, `10` indeks glede na isti mesec lani.

**Eurostat — izmerjeni strošek dela (pot B):**

```
GET https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nama_10_a10?format=JSON&geo=SI&unit=CP_MEUR&na_item=D1&nace_r2=TOTAL
GET https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nama_10_a10_e?format=JSON&geo=SI&unit=THS_HW&na_item=SAL_DC&nace_r2=TOTAL
```

Strošek na opravljeno uro = `D1 × 10⁶ / (ure × 10³)`. Za `D11` (plače brez prispevkov)
zamenjajte `na_item`; razlika med `D11` na zaposlenega in bruto plačo SURS da dejanske
dodatke.

**Eurostat — kontrole:** `lc_lci_lev` (raven po dejavnostih), `lc_ncost_r2` (velikostni
razredi, `unit=P_SAL_H`, `lcstruct=D01`).

---

## Viri

- SURS SiStat `0711360S` — plače po skupinah poklicev (SKP-08) v javnem in zasebnem
  sektorju, oktober 2023 / 2024 / 2025
- SURS SiStat `0701029S` — plače pri pravnih osebah po dejavnostih (SKD 2025), do junija 2026
- SURS, Strukturna statistika plač, oktober 2025 (objava 16. 4. 2026) in oktober 2024
  (objava 23. 6. 2025)
- Eurostat `nama_10_a10`, `nama_10_a10_e` — sredstva za zaposlene in opravljene ure
- Eurostat `lc_lci_lev`, `lc_ncost_r2` — raven in struktura stroška dela
- Uradni list RS 2026-01-0175 — minimalna plača 2026
- ZDOsk-1 — prispevek za dolgotrajno oskrbo (1 % + 1 %, od 1. 7. 2025)
- Uredba o davčni obravnavi povračil stroškov — malica in prevoz
- IZS — priporočene vrednosti urnih postavk za 2026
- GZS, Združenje za informatiko in telekomunikacije — referenčni cenik IKT
