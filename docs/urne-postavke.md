# Urne postavke: od kod so številke

Ta dokument je vir za razpone urnih postavk v koraku **Skupna finančna osnova**
(`src/config/contexts/`). Obstaja zato, ker je kalkulator prej ponujal postavke, ki jih ni
bilo mogoče preveriti pri nikomer: utemeljitve v kodi so bile izključno relativne
("voznikova ura ni operaterjeva"), absolutnega sidra pa ni bilo nikjer. Postavke množijo
ure v vseh modulskih formulah, zato se napaka v njih prenese v vsak prikazan znesek.

Poizvedbe so bile opravljene **12. avgusta 2026**. Vse številke veljajo za Slovenijo.

---

## Kaj postavka pomeni

**Polni strošek ure = strošek dela, brez režije.**

Prej je vprašanje zahtevalo "bruto plačo z vsemi prispevki in režijo". Režija je izpadla iz
dveh razlogov. Prvi je poštenost trditve: kalkulator meri, kaj podjetje prihrani, ko se ura
sprosti — sproščena ura prihrani plačo, ne pa najemnine, amortizacije in vodenja, ki tečejo
naprej. Drugi je preverljivost: strošek dela je javno objavljen podatek, "delo plus režija"
pa ni podatek nikogar.

```
strošek ure = (bruto mesečna plača × 12 × 1,161 + 4.000 EUR) / 1.700 ur
```

| Člen | Vrednost | Opomba |
|---|---|---|
| Prispevki delodajalca | 16,10 % bruto plače | zakonsko določena stopnja |
| Regres, malica, prevoz | ~4.000 EUR/leto | regres ~1.400 + malica 7,96 EUR × ~210 dni + prevoz ~900 |
| Produktivne ure | 1.700/leto | 2.088 plačanih ur minus dopust, prazniki in bolniške |

Delitelj je namenoma **opravljena** in ne plačana ura: podjetje plača 2.088 ur, dobi jih
okoli 1.700, strošek pa nosi celotni. Delitev s plačanimi urami bi postavko podcenila za
približno petino.

---

## Sidra

### Plače po poklicih — glavni vir

SURS, strukturna statistika plač (SiStat tabela `0711335S`, SKP-08, leto 2022, povprečna
bruto plača). Iz nje se vzame **razmerje poklica do povprečja vseh zaposlenih**, ne njegova
absolutna vrednost — razmerja se med leti premikajo počasi, ravni pa hitro. Razmerje se nato
pomnoži s povprečno bruto plačo za maj 2026 (**2.682 EUR**, SURS).

| Poklic (SKP-08) | Razmerje | Bruto/mes 2026 | **EUR/h** |
|---|---|---|---|
| 8332 Voznik težkega tovornjaka | 0,694 | 1.861 | **17,6** |
| 5223 Prodajalec | 0,695 | 1.864 | **17,6** |
| 83 Vozniki (skupaj) | 0,768 | 2.060 | **19,2** |
| 933 Preprosta transportna in skladiščna dela | 0,773 | 2.073 | **19,3** |
| 8 Upravljavci strojev, operaterji | 0,797 | 2.138 | **19,9** |
| 4321 Skladiščnik, uradnik za nabavo in prodajo | 0,802 | 2.151 | **20,0** |
| 4110 Uradnik za splošno pisarniško poslovanje | 0,832 | 2.231 | **20,6** |
| 4311 Uradnik v računovodstvu | 0,951 | 2.551 | **23,3** |
| 3313 Knjigovodja | 0,974 | 2.612 | **23,8** |
| — povprečje vseh zaposlenih | 1,000 | 2.682 | **24,3** |
| 3323 Nabavni referent | 1,072 | 2.875 | **25,9** |
| 3335 Tehnik za logistiko in tehnologijo prometa | 1,083 | 2.905 | **26,2** |
| 3322 Komercialni zastopnik za prodajo | 1,132 | 3.036 | **27,2** |
| 2141 Inženir, tehnolog v industriji in proizvodnji | 1,265 | 3.393 | **30,2** |
| 2411 Strokovnjak za računovodstvo in revizijo | 1,331 | 3.570 | **31,6** |
| 1321 Menedžer za proizvodnjo v predelovalnih dejavnostih | 1,576 | 4.227 | **37,0** |

### Plače po dejavnostih — kontrola

SURS (SiStat tabela `0701019S`, SKD 2008), povprečje dvanajstih mesecev leta 2025, preračunano
na 2026 s faktorjem 1,031:

| Dejavnost | Bruto/mes 2025 | **EUR/h 2026** |
|---|---|---|
| C Predelovalne dejavnosti | 2.517 | **23,6** |
| G Trgovina | 2.403 | **22,7** |
| H Promet in skladiščenje | 2.283 | **21,6** |
| M Strokovne, znanstvene in tehnične dejavnosti | 2.942 | **27,2** |
| F Gradbeništvo | 2.097 | — |
| J Informacijske in komunikacijske dejavnosti | 3.403 | **31,1** |

To so povprečja **celotne panoge, vključno z vodstvom**, zato so nad postavko posameznega
operativnega poklica. Ujemanje z izpeljavo po poklicih je dobro.

### Eurostat — kontrola, ki je nismo uporabili kot sidro

Eurostat `lc_lci_lev`, strošek dela na opravljeno uro, Slovenija 2025:

| | EUR/h |
|---|---|
| Poslovno gospodarstvo (B–N) | 30,0 |
| Predelovalne dejavnosti | 29,8 |
| Trgovina | 28,8 |
| Promet in skladiščenje | 26,2 |
| Strokovne, znanstvene in tehnične dejavnosti | 36,2 |
| Celotno gospodarstvo | 29,7 |

Eurostat je približno **20–25 % nad izpeljavo iz plač**. Razlika se z javno dostopnimi podatki
ne da v celoti pojasniti (Eurostatov delitelj opravljenih ur je nižji od 1.700, ki jih
predpostavimo tu). Vzeli smo nižje sidro zavestno: kalkulator, ki pretirava, izgubi
skeptičnega direktorja pri prvi številki, kalkulator, ki je zadržan, pa ne. Kdor želi zgornjo
oceno, jo v vprašalniku lahko vpiše — postavka je vnosno polje, razponi so le predlog.

### Zaračunana postavka — drugo sidro

`storitve.chargeOutRate` ni strošek, ampak cena, zato zanjo plače ne povedo nič. Sidra so
objavljeni ceniki:

| Vir | EUR/h |
|---|---|
| IZS, priporočena osnovna vrednost storitve 2025 (licencirano projektiranje) | 70 (±15 %) |
| GZS ZING, zahtevno svetovanje | 67 (47 za člane) |
| Računovodsko svetovanje, manj zahtevno → zelo zahtevno | 81–110 → 180 |
| Samostojni razvijalec (s. p.) | 25–45 |

Sredina trga za splošno storitveno podjetje je zato **45–70 EUR/h**.

---

## Zakaj se razponi med dejavnostmi razlikujejo

Ker se razlikujejo poklici, ki jih vprašanje opisuje. Kjer je razlika samo v besedah in ne v
poklicih, je nabor namenoma isti — logistika in veleprodaja obe merita skladiščnika in
komisionarja, zato imata enak nabor.

Trije nabori odstopajo od gole izpeljave, vsak s svojim razlogom:

- **Maloprodaja** ima spodnji pas nad izpeljavo iz plače: poslovalnica dela ob sobotah,
  praznikih in v izmenah, dodatki pa to uro sistematično dvignejo.
- **Logistika** ima zgornji pas višje, kot bi sledilo iz plače voznika: mednarodni prevoz z
  dnevnicami uro dvigne bistveno nad plačilno listo.
- **Storitve** imajo najširši nabor v kalkulatorju, ker segment pokriva najširši razpon
  poklicev — monter in serviser na eni strani, senior svetovalec na drugi. Posledica je
  zavestna: rezultat se pri izbranem pasu pogosteje prikaže kot razpon in ne kot ena številka.

---

## Kje se te številke pojavijo obiskovalcu

`fallbackEUR` v `src/config/contexts/` ni le tiha rezerva — je **povprečje panoge**, ki ga
obiskovalec vidi in lahko prevzame z enim klikom ("Ne vem — vzemi povprečje panoge (22 EUR/h)").
Zato ni več interna konstanta: je trditev, ki jo mora podpirati tabela zgoraj.

Prevzeto povprečje se **ne obravnava kot vnos**. Izračun teče z mejama pasu, v katerem povprečje
leži (`industryAverageBand`), rezultat se prikaže kot razpon, zanesljivost pa pade enako kot ob
izbranem razponu — številka je naša ocena in ne meritev tega podjetja. V prodajni pripravi in v
izvozu za CRM je zapisana kot svoj vir (`industryAverage`), da prodajnik ne bere ocene kot
strankin podatek.

Dve posledici za kalibracijo:

- **Povprečje mora ležati v natanko enem pasu.** Brez pasu bi gumb tiho vrnil točko, na meji
  dveh pasov pa bi bil rezultat odvisen od vrstnega reda v konfiguraciji. Drži test v
  `src/config/contexts/contexts.test.ts`.
- **Ujemanje s sredino pasu ni več prepovedano.** Prejšnja zahteva ("privzetek se ne sme ujemati
  z nobeno sredino") je varovala rekonstrukcijo izbranega pasu po vrednosti; odkar
  `CostAssumption.source` izvor zapiše, te rekonstrukcije ni nikjer in omejitve ni več.

---

## Kdaj to preveriti znova

Razmerja med poklici se premikajo počasi, ravni plač pa ne. Postavke je smiselno preračunati,
kadar povprečna bruto plača zraste za več kot ~10 % od 2.682 EUR (maj 2026), ali ko SURS
objavi novejšo strukturno statistiko plač po poklicih od leta 2022. Ob tem velja preveriti
tudi stopnjo prispevkov delodajalca in neobdavčeni znesek malice.

### Viri

- SURS SiStat, tabela `0711335S` — povprečne mesečne plače po skupinah poklicev (SKP-08)
- SURS SiStat, tabela `0701019S` — povprečne mesečne bruto plače po dejavnostih (SKD 2008)
- SURS, povprečna mesečna plača, maj 2026
- Eurostat, `lc_lci_lev` — Labour cost levels by NACE Rev. 2 activity
- IZS — priporočene vrednosti urnih postavk 2025
- GZS, Združenje za inženiring (ZING) — priporočljive cene storitev
