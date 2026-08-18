# Raziskava urnih postavk 2026: kaj smo našli in kaj smo popravili

Zapisnik preverbe urnih postavk proti slovenskemu trgu, opravljene **18. avgusta 2026**.
Nastal je ob kalibraciji, ki je popravila privzetke in pasove v `src/config/contexts/`.

Ta dokument in [`urne-postavke.md`](urne-postavke.md) se dopolnjujeta in nista isto:

- **`urne-postavke.md` je referenca** — kaj postavka pomeni, katera sidra veljajo zdaj in
  kdaj jih je treba preveriti znova. To je datoteka, ki jo berete, **preden spremenite
  postavko**.
- **Ta dokument je zapisnik** — kaj smo primerjali, kaj se ni ujemalo in zakaj. Berete ga,
  kadar želite vedeti, **od kod je prišla sprememba** ali kako ponoviti preverbo.

Vse številke veljajo za Slovenijo. Postavke so polni strošek dela brez režije, v EUR na
produktivno uro.

---

## 1. Kaj je preverba pokazala

Metoda, zapisana v `urne-postavke.md`, se je izkazala za pravilno. Razhajanja so bila v
vhodnih parametrih, ki so se od zadnje kalibracije spremenili, in v treh segmentih, kjer
sidro ni ustrezalo poklicem, ki jih vprašanje našteva.

| Ugotovitev | Kje | Velikost |
|---|---|---|
| Prispevki delodajalca zastareli | povsod | 16,10 % → **17,10 %** |
| Regres, malica in prevoz podcenjeni | povsod | 4.000 € → **4.787 €** (+19,7 %) |
| Sidro ne ustreza vprašanju | logistika, veleprodaja | 19 € → **22 €** (+16 %) |
| Sidro ne ustreza vprašanju | administrativna ura (skupna) | 25 € → **27 €** (+12 %) |
| Spodnje meje pod zakonskim minimumom | šest naborov | 12–14 €/h < **15,07 €/h** |
| Delitelj produktivnih ur | — | 1.700 **potrjeno** (preračun da 1.692) |
| Definicija postavke | — | **potrjena** (strošek dela brez režije) |
| Ročne korekcije po dejavnostih | maloprodaja, logistika, storitve | **vse tri potrjene** |

---

## 2. Preverba členov formule

```
strošek ure = (bruto mesečna plača × 12 × 1,171 + 4.787 EUR) / 1.700 ur
```

| Člen | Prej | Zdaj | Vir in razlaga |
|---|---|---|---|
| Prispevki delodajalca | 16,10 % | **17,10 %** | PIZ 8,85 + ZZ 6,56 + PD 0,53 + zaposlovanje 0,06 + starševsko 0,10 = 16,10 %, **plus 1,00 % za dolgotrajno oskrbo od 1. 7. 2025** (ZDOsk-1) |
| Regres | ~1.400 € | **1.482 €** | zakonski minimum je enak minimalni plači |
| Malica | ~1.670 € | **1.695 €** | 7,96 €/dan neobdavčeno × ~213 opravljenih dni — nespremenjeno |
| Prevoz | ~900 € | **1.610 €** | uredba priznava 0,21 €/km, **najmanj 140 €/mesec**; 900 €/leto je pod tem minimumom |
| Dodatki skupaj | 4.000 € | **4.787 €** | |
| Produktivne ure | 1.700 | **1.700** | preračun spodaj da 1.692 |

### Zakaj sta bila oba parametra zastarela

Prispevek za dolgotrajno oskrbo je začel veljati **1. julija 2025** in ga zadnja kalibracija
(12. avgusta 2026) ni zajela. Stopnja ni bila samo v formuli — pojasnilo pod vprašanjem jo
je obiskovalcu tudi *pokazalo*. Napačna stopnja prispevkov v besedilu, ki ga bere
računovodja, stane več zaupanja kot dva evra razlike v rezultatu.

Regres je vezan na minimalno plačo, ta pa je 1. januarja 2026 poskočila s 1.277,72 na
**1.481,88 EUR** — **+15,97 %**, največji enkraten dvig doslej, ob 6,9-odstotni rasti
povprečne plače. Prav to neujemanje je razlog za nov sprožilec za preračun (razdelek 8).

### Delitelj: 1.700 ur

| Korak | Ure |
|---|---|
| Fond plačanih ur (261 dni × 8) | 2.088 |
| − prazniki na delovni dan (7 dni v 2026) | 2.032 |
| − letni dopust (26 dni, povprečje zasebnega sektorja) | 1.832 |
| − bolniška (5,7 % izgubljenih dni ≈ 15 delovnih dni) | 1.712 |
| − izobraževanje in izredni dopust (~1,5 dneva) | **1.700** |

Nacionalni računi kažejo ~1.580 opravljenih ur na zaposlenega, a to povprečje vključuje delo
s krajšim delovnim časom in za polni delovni čas ni uporabno.

### Učinek popravkov

Pri bruto plači 2.100 €/mesec se postavka premakne z **19,56** na **20,17 €/h**, torej za
3,1 %. Popravka sta majhna, a sistematična — veljata za vsako postavko v vsaki dejavnosti.

---

## 3. Zakonska spodnja meja: 15,07 €/h

```
(1.481,88 × 12 × 1,171 + 4.787) / 1.700 = 15,07 EUR/h
```

Delavec na minimalni plači stane toliko. Pred kalibracijo je šest naborov imelo spodnjo mejo
pri **12–14 €/h** — vrednosti, ki jih v Sloveniji 2026 ne more imeti nihče, zaposlen za polni
delovni čas. Zdaj se noben pas ne začne pod 15 €.

**Kolektivne pogodbe kot sidro niso uporabne.** Najnižje osnovne plače po njih so večinoma
pod zakonsko minimalno plačo: kolektivna pogodba dejavnosti trgovine (velja do 31. 10. 2026)
določa I. tarifni razred pri 930,30 €, IV. pri 1.092,42 in VII. pri 1.605,40 €. Pri minimalni
plači 1.481,88 € to pomeni, da v spodnjih razredih dejansko plačo določa minimalna plača in
ne tarifna priloga.

---

## 4. Sidra po poklicih

SURS, strukturna statistika plač (SiStat `0711335S`, SKP-08, **2022** — zadnje razpoložljivo
leto; naslednji val popisuje 2026 in bo objavljen okoli 2028). Plače so preračunane na 2026 s
faktorjem rasti povprečne plače **1,3252** (2.023,92 € v 2022 → 2.682 € maja 2026), nato po
formuli v strošek ure.

Naveden je tudi stolpec iz **mediane**: povprečje poklicne skupine vlečejo navzgor redki
visoki izplačevalci, za ciljno podjetje z 10–249 zaposlenimi pa je mediana bližje resnici.
Realen razpon dejavnosti leži med obema stolpcema.

| Poklic (SKP-08) | €/h iz povprečja | €/h iz mediane | Uporabljeno v |
|---|---|---|---|
| 8332 Voznik težkega tovornjaka | 19,5 | 17,9 | logistika |
| 5223 Prodajalec | 19,5 | 17,8 | maloprodaja |
| 82 Sestavljavci strojev in izdelkov | 19,8 | 18,9 | proizvodnja |
| 7212 Varilec | 21,4 | 20,6 | proizvodnja |
| 933 Preprosta transportna in skladiščna dela | 21,4 | 19,8 | logistika, veleprodaja |
| 9333 Delavec za preprosta prekladalna dela | 21,9 | 20,2 | logistika, veleprodaja |
| 5230 Blagajnik | 22,0 | 19,9 | maloprodaja |
| **8 Upravljavci strojev, operaterji** | **22,0** | 20,4 | **proizvodnja — glavno sidro** |
| **4321 Skladiščnik, uradnik za nabavo in prodajo** | **22,1** | 20,6 | **logistika in veleprodaja — glavno sidro** |
| 4110 Uradnik za splošno pisarniško poslovanje | 22,8 | 20,5 | administrativna ura — spodnji rob |
| 7222 Orodjar | 23,2 | 22,4 | proizvodnja |
| 7223 Strugar | 23,7 | 22,9 | proizvodnja |
| 81 Upravljavci strojev in naprav | 23,8 | 22,6 | proizvodnja |
| 7233 Mehanik, serviser industrijskih strojev | 25,2 | 23,8 | storitve |
| **4311 Uradnik v računovodstvu** | **25,7** | 23,5 | **računovodstvo — glavno sidro** |
| 7412 Elektromehanik | 25,9 | 25,0 | storitve |
| **3313 Knjigovodja** | **26,2** | 23,8 | **računovodstvo — glavno sidro** |
| — povprečje vseh zaposlenih | 26,8 | 22,9 | splošno |
| 4322 Uradnik za izračune količin v proizvodnji | 27,5 | 25,2 | administrativna ura |
| 4323 Prometni odpravnik, referent za transport | 27,9 | 27,5 | administrativna ura (logistika) |
| 3115 Tehnik za strojništvo | 28,4 | 26,4 | storitve |
| 3323 Nabavni referent | 28,6 | 26,4 | administrativna ura |
| 3331 Špediter | 29,4 | 26,8 | administrativna ura (logistika) |
| 3122 Nadzornik v predelovalnih dejavnostih | 29,8 | 27,8 | administrativna ura (proizvodnja) |
| 3322 Komercialni zastopnik za prodajo | 30,0 | 26,2 | administrativna ura (trgovina) |
| 2141 Inženir, tehnolog v industriji | 33,2 | 30,7 | storitve |
| 2514 Programer računalniških aplikacij | 34,7 | 32,1 | storitve |
| 2411 Strokovnjak za računovodstvo in revizijo | 34,8 | 31,9 | računovodstvo — vodstvena ura |
| 2147 Strokovnjak za logistiko in tehnologijo prometa | 35,6 | 32,3 | storitve, logistika |
| 2144 Inženir strojništva | 36,5 | 33,4 | storitve — zgornji rob |
| 1324 Menedžer za nabavo, logistiko, skladiščenje | 38,9 | 31,3 | administrativna ura — zgornji rob |
| 1420 Menedžer v trgovini | 39,1 | 29,0 | administrativna ura — zgornji rob |
| 1321 Menedžer za proizvodnjo | 40,7 | 33,4 | administrativna ura — zgornji rob |

---

## 5. Kontrola po dejavnostih

Drugi, popolnoma neodvisen preračun: SURS SiStat `0701029S`, **maj 2026**, že po novi
klasifikaciji **SKD 2025**. Črke sektorjev se od SKD 2008 razlikujejo — strokovne dejavnosti
so zdaj `N` (prej `M`), informatika je izločena v `K`.

| Dejavnost (SKD 2025) | Bruto/mes | €/h | Rast l/l | Ustreza segmentu |
|---|---|---|---|---|
| H49.41 Cestni tovorni prevoz | 1.925 | 18,7 | +7,7 % | logistika |
| H52.10 Skladiščenje | 2.030 | 19,6 | +10,0 % | logistika |
| G47 Trgovina na drobno | 2.198 | 21,0 | +7,3 % | maloprodaja |
| C25 Proizvodnja kovinskih izdelkov | 2.359 | 22,3 | +4,4 % | proizvodnja |
| H Prevoz in skladiščenje | 2.358 | 22,3 | +7,0 % | logistika |
| N69.20 Računovodske in revizijske dejavnosti | 2.532 | 23,7 | +7,7 % | računovodstvo |
| H52.25 Logistične storitve | 2.579 | 24,1 | +2,9 % | logistika |
| C Predelovalne dejavnosti | 2.598 | 24,3 | +5,5 % | proizvodnja |
| C28 Proizvodnja strojev in naprav | 2.771 | 25,7 | +5,1 % | proizvodnja |
| G46 Trgovina na debelo | 2.790 | 25,9 | +5,8 % | veleprodaja |
| N70 Podjetniško in poslovno svetovanje | 2.800 | 26,0 | +5,0 % | storitve |
| N71.12 Inženirska dejavnost in svetovanje | 2.965 | 27,3 | +5,6 % | storitve |
| K62 Računalniško programiranje in svetovanje | 3.713 | 33,5 | +4,8 % | storitve |
| — vse dejavnosti skupaj | 2.682 | 25,0 | +6,9 % | splošno |

Panožno povprečje je vedno **višje** od postavke posameznega operativnega poklica, ker
vključuje vodstvo, prodajo in režijo. Uporabno je kot zgornja meja verjetnosti, ne kot sidro.

### Cestni tovorni prevoz je izjema, ki je iz plače ni videti

Panožno povprečje 1.925 € je **nižje** od izpeljanega voznika (19,5 €/h). Razlog: mednarodni
prevozniki velik del prejemka izplačajo kot dnevnice, ki v bruto plačo ne štejejo. Dejanski
denarni strošek voznikove ure je zato bistveno višji od plačilne liste — kar potrjuje, da je
zgornji pas v logistiki upravičeno visok.

### Eurostat kot zgornja meja

Eurostat `lc_lci_lev`, strošek dela na opravljeno uro, Slovenija **2025**:

| | €/h |
|---|---|
| Poslovno gospodarstvo (B–N) | 30,0 |
| Predelovalne dejavnosti | 29,8 |
| Trgovina | 28,8 |
| Promet in skladiščenje | 26,2 |
| Strokovne, znanstvene in tehnične dejavnosti | 36,2 |
| Informacijske in komunikacijske dejavnosti | 38,3 |
| Gradbeništvo | 25,4 |
| Celotno gospodarstvo (B–S brez O) | 29,7 |

Ekstrapolirano na 2026 (rast 2024→2025 je bila 7,5 %) to pomeni okoli **31–32 €/h** za
povprečje gospodarstva, torej približno **27 % nad** izpeljavo iz plač (25,0 €/h).

Razlike z javno dostopnimi podatki **ni mogoče v celoti pojasniti**. Najverjetnejša dela sta,
da Eurostatova raziskava zajema podjetja z 10 ali več zaposlenimi (ta plačujejo več) in da je
njen delitelj opravljenih ur nižji od 1.700, ki jih predpostavimo tu.

Odločitev, da ostane nižje sidro, je zavestna in nespremenjena: kalkulator, ki pretirava,
izgubi skeptičnega direktorja pri prvi številki. Eurostat ostaja zgornja meja razpona, ne
privzetek.

---

## 6. Primerjava po segmentih

Za vsak segment: kaj je aplikacija ponujala, kaj kaže trg in za koliko se je razlikovalo.

| Segment | Privzetek prej | Sredina trga | Realen razpon | Odstopanje |
|---|---|---|---|---|
| Proizvodnja | 22 € | 23 € | 21–26 | +5 % |
| **Logistika** | **19 €** | **22 €** | 20–25 | **+16 %** |
| **Veleprodaja** | **19 €** | **22 €** | 20–25 | **+16 %** |
| Maloprodaja | 20 € | 21 € | 19–24 | +5 % |
| Storitve | 30 € | 32 € | 26–38 | +7 % |
| Računovodstvo | 24 € | 26 € | 24–29 | +8 % |
| Splošno | 22 € | 23 € | 21–26 | +5 % |
| **Administrativna ura** | **25 €** | **28 €** | 23–40 | **+12 %** |

### Proizvodnja — najbolje umerjen segment

Sidra: operater 22,0 · varilec 21,4 · orodjar 23,2 · strugar 23,7 · panoga C25 22,3, C 24,3.
Privzetek je bil znotraj 5 % realne sredine; popraviti je bilo treba le spodnjo mejo prvega
pasu (13 €) in privzetek premakniti za velikost popravljenih parametrov.

### Logistika in veleprodaja — največje odstopanje

Sidro je bil **voznik** (19,5 €/h), vprašanje pa našteva »voznik, skladiščnik, komisionar« —
skladiščnik stane 22,1 in prekladalna dela 21,9. **Dva od treh naštetih poklicev sta dražja
od tistega, ki je določal privzetek.** Pri veleprodaji je napaka bolj očitna: vprašanje se
glasi »skladiščnik, komisionar, viličarist« in voznika sploh ne omeni, privzetek pa je bil
vseeno voznikov.

Nauk, ki je zdaj zapisan v `urne-postavke.md`: **sidro ni nujno prvi našteti poklic.**

### Maloprodaja

Sidra: prodajalec 19,5 · blagajnik 22,0 · panoga G47 21,0. Odločitev, da je pas višji od gole
izpeljave iz plače prodajalca (delo ob sobotah, praznikih in v izmenah z dodatki), je
potrjena.

### Storitve

Sidra: mehanik-serviser 25,2 · tehnik strojništva 28,4 · inženir-tehnolog 33,2 · programer
34,7 · inženir strojništva 36,5 · panoga N71.12 27,3, K62 33,5. Zavestno najširši nabor v
kalkulatorju je upravičen — razpon poklicev v segmentu je res tolikšen.

Popravljen je bil le zgornji pas: 45–68 € je za *strošek* dela previsoko, ker 68 €/h ustreza
bruto plači 8.100 €/mesec. To ni izvedbena ura, ampak partner.

### Računovodstvo

Sidra: uradnik v računovodstvu 25,7 · knjigovodja 26,2 · panoga N69.20 23,7. Vodstvena ura je
usidrana na strokovnjaka za računovodstvo in revizijo, ki je 2026 pri **34,8 €/h** — privzetek
30 € je bil za ~15 % prenizek.

### Administrativna ura — napaka, ki se je prenašala povsod

Sidra: pisarniški uradnik 22,8 · nabavni referent 28,6 · špediter 29,4 · nadzornik proizvodnje
29,8 · komercialist 30,0 · vodja logistike 38,9 · vodja trgovine 39,1 · vodja proizvodnje 40,7.

Vprašanje našteva »planer, vodja proizvodnje, nabava« — torej pretežno poklice nad 28 €.
Privzetek 25 € je ustrezal pisarniškemu uradniku, ne temu naboru. Ker je administrativna ura
**skupna vsem sedmim dejavnostim**, se je napaka prenašala v vsako.

---

## 7. Zaračunana postavka

`storitve.chargeOutRate` ni strošek, ampak cena, zato zanjo plače ne povedo nič. Sidra so
objavljeni ceniki — vsi so bili od zadnje kalibracije posodobljeni.

**IZS, priporočene vrednosti urnih postavk 2026** (TVS 72,52 €/h, priporočeno odstopanje do
±15 %):

| Storitveni razred | KSR | 2026 | 2025 |
|---|---|---|---|
| S1 delo po navodilih | 0,7 | 50,76 | 49,00 |
| S2 nezahteven objekt | 0,85 | 61,64 | 59,50 |
| S3 zahteven objekt (TVS) | 1,0 | **72,52** | 70,00 |
| S4 zelo zahtevne naloge | 1,4 | 101,53 | 98,00 |
| S5 izjemno zahtevne naloge, izvedenstvo | 2,1 | 152,29 | 147,00 |

**GZS, Združenje za informatiko in telekomunikacije — referenčni cenik IKT:**

| Raven | Primer poklica | €/h |
|---|---|---|
| 1 Pomožna dela | pisarniško administrativno delo | 32 |
| 2 Preprosta dela | serviser | 42 |
| 3 Zahtevna dela | administrator, programer I | 58 |
| 4 Visoko zahtevna dela | programer II, analitik, sistemski inženir I | 79 |
| 5 Strokovna dela | inženir, informacijski arhitekt, DBA | 95 |
| 6 Visoko strokovna dela | svetovalec, programer III | 114 |
| 7 Ekspertna dela | ekspert, svetovanje | 143 |

**Računovodske storitve, tržne cene:** knjiženje 50–63 €/h (nezavezanec za DDV), 63–75
(zavezanec), 75–88 (zelo zahtevno); svetovanje 81–110 do 160–190 €/h.

**Razvoj programske opreme:** povprečen programer 50 €/h, front-end 50–70, samostojni
razvijalec (s. p.) 25–45.

Sredina trga za splošno storitveno podjetje je **50–72 €/h**. Privzetek 55 €/h je ostal
nespremenjen; popravljen je bil le najnižji pas (25 → 30 €), ker pod 32 € — pomožna dela po
ceniku GZS — ni nobene objavljene postavke.

---

## 8. Kaj je bilo spremenjeno

Operativna ura:

| Segment | Privzetek | Pasovi prej | Pasovi zdaj |
|---|---|---|---|
| Proizvodnja | 22 → **23** | 13–18 · 18–25 · 25–33 · 33–46 | 15–20 · 20–26 · 26–34 · 34–46 |
| Logistika | 19 → **22** | 12–17 · 17–23 · 23–31 · 31–43 | 15–19 · 19–25 · 25–33 · 33–45 |
| Veleprodaja | 19 → **22** | 12–17 · 17–23 · 23–31 · 31–43 | 15–19 · 19–25 · 25–33 · 33–45 |
| Maloprodaja | 20 → **21** | 12–17 · 17–22 · 22–29 · 29–40 | 15–19 · 19–24 · 24–31 · 31–42 |
| Storitve | 30 → **32** | 16–24 · 24–33 · 33–45 · 45–68 | 17–24 · 24–31 · 31–42 · 42–60 |
| Računovodstvo | 24 → **26** | 14–20 · 20–27 · 27–35 · 35–48 | 16–22 · 22–28 · 28–36 · 36–48 |
| Splošno | 22 → **23** | 12–18 · 18–25 · 25–35 · 35–50 | 15–20 · 20–26 · 26–35 · 35–48 |

Ostalo:

| Vprašanje | Privzetek | Pasovi prej | Pasovi zdaj |
|---|---|---|---|
| Administrativna ura (skupna) | 25 → **27** | 14–20 · 20–28 · 28–38 · 38–55 | 16–22 · 22–29 · 29–38 · 38–55 |
| Računovodstvo, vodstvena ura | 30 → **34** | isti nabor kot administrativna | isti nabor |
| Storitve, zaračunana postavka | 55 (nespremenjeno) | 25–40 · 40–60 · 60–85 · 85–130 | 30–42 · 42–60 · 60–85 · 85–130 |

Poleg številk:

- `HOURLY_COST_EXPLAINER` v `src/config/contexts/shared.ts` — stopnja prispevkov 16,1 % →
  17,1 %. To je besedilo, ki ga obiskovalec prebere ob kliku na »?«.
- **Nov sprožilec za preračun** v `urne-postavke.md`: sprememba minimalne plače ali stopnje
  prispevkov. Dosedanje pravilo (rast povprečne plače nad ~10 %) letošnjega dviga minimalne
  plače za 15,97 % ne bi ujelo, ker je povprečna plača zrasla le za 6,9 % — premaknila pa sta
  se regres in spodnja meja vseh pasov.

Kar je ostalo **nedotaknjeno**: definicija postavke, delitelj 1.700 ur, odločitev za nižje
sidro namesto Eurostatovega in vse tri ročne korekcije po dejavnostih (višji spodnji pas v
maloprodaji, višji zgornji v logistiki, najširši nabor v storitvah).

---

## 9. Kako ponoviti preverbo

Podatki so dostopni prek javnih API-jev, brez ključa.

SURS PxWeb (metapodatki z `GET`, podatki s `POST` in telesom poizvedbe):

```
https://pxweb.stat.si/SiStatData/api/v1/sl/Data/0711335S.px   # plače po poklicih (SKP-08)
https://pxweb.stat.si/SiStatData/api/v1/sl/Data/0701029S.px   # plače po dejavnostih (SKD 2025)
https://pxweb.stat.si/SiStatData/api/v1/sl/Data/0701035S.px   # plačane ure po dejavnostih
```

Eurostat (`GET`, JSON-stat):

```
https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/lc_lci_lev?format=JSON&geo=SI
https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nama_10_a10_e?format=JSON&geo=SI
```

Postopek: iz `0711335S` vzemi razmerje poklica do povprečja vseh zaposlenih (leto 2022),
pomnoži z aktualno povprečno bruto plačo, nato po formuli iz razdelka 2 v strošek ure.
Rezultat preveri proti `0701029S` (panožno povprečje mora biti nad operativnim poklicem) in
proti Eurostatu (zgornja meja).

---

## Viri

- SURS SiStat `0711335S` — povprečne mesečne plače po skupinah poklicev (SKP-08), bruto,
  povprečje in mediana, 2022
- SURS SiStat `0701029S` — povprečne mesečne plače pri pravnih osebah po dejavnostih
  (SKD 2025), do maja 2026
- SURS SiStat `0701035S` — povprečno število plačanih ur po dejavnostih (SKD 2025)
- Eurostat `lc_lci_lev` — strošek dela na opravljeno uro po dejavnostih NACE Rev. 2
- Eurostat `nama_10_a10_e` — opravljene ure in zaposleni, Slovenija
- Uradni list RS št. 6/2026 — znesek minimalne plače za leto 2026 (1.481,88 EUR)
- ZDOsk-1 in ZZZS — prispevek za obvezno zavarovanje za dolgotrajno oskrbo (1 % + 1 %,
  od 1. 7. 2025)
- Uredba o davčni obravnavi povračil stroškov — malica 7,96 EUR/dan, prevoz 0,21 EUR/km
  oziroma najmanj 140 EUR/mesec
- IZS — Priporočene vrednosti urnih postavk pooblaščenih in nadzornih inženirjev za 2026
- GZS, Združenje za informatiko in telekomunikacije — referenčni cenik storitev IKT
- Kolektivna pogodba dejavnosti trgovine Slovenije — najnižje osnovne plače po tarifnih
  razredih, velja do 31. 10. 2026
- NIJZ — bolniška odsotnost: 5,7 % izgubljenih koledarskih dni, ~21 dni na zaposlenega
