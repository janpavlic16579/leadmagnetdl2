# Proizvodna niša: celovita baza znanja za razvoj poslovnih sistemov

**Primarni trg:** Slovenija  
**Regionalni kontekst:** Hrvaška, Srbija, Bosna in Hercegovina, Severna Makedonija ter drugi trgi Datalaba  
**Primarni ciljni segment:** proizvodna podjetja z 20-500 zaposlenimi  
**Datum raziskave:** 7. avgust 2026  
**Raziskovalni namen:** osrednja baza znanja za ROI kalkulatorje, diagnostične vprašalnike, ICP in lead scoring, prodajni discovery, priporočilne sisteme, personaliziran outbound, poslovne primere in AI agente.

---

## Kako uporabljati dokument

To ni splošen opis industrije in ni prodajna brošura za ERP. Dokument povezuje šest ravni, ki jih je treba pri gradnji sistemov obravnavati ločeno:

1. **Kontekst podjetja:** segment, proizvodni model, velikost, kompleksnost in reguliranost.
2. **Proces:** dejanski tok materiala, informacij, odločitev in denarja.
3. **Bolečina:** simptom, neposredni vzrok, temeljni vzrok in prizadeta vloga.
4. **Meritev:** KPI, imenovalec, obdobje, vir podatka in zanesljivost.
5. **Finančni učinek:** neposredni strošek, kapaciteta, prispevna marža, obratni kapital ali tveganje.
6. **Rešitev:** procesna sprememba, ERP, MES/APS/WMS/QMS/CMMS, integracija, avtomatizacija ali fizična naložba.

Najpomembnejše pravilo je: **poslovne koristi se ne smejo avtomatično pripisati ERP-ju**. Sistem ustvari vrednost samo, če je problem informacijsko naslovljiv, če so podatki dovolj kakovostni, če je rešitev uvedena v ustreznem obsegu in če jo uporabniki dejansko uporabljajo.

---

# 1. Izvršni povzetek

Slovenska proizvodnja je velika, izvozno usmerjena in heterogena. Po začasnih podatkih SURS je leta 2024 v predelovalnih dejavnostih delovalo **21.471 podjetij**, ki so zaposlovala oziroma samozaposlovala **221.953 oseb**, ustvarila **42,8 milijarde EUR neto prihodkov** in **12,5 milijarde EUR dodane vrednosti**. Proizvodnja je ustvarila približno tretjino neto prihodkov celotnega opazovanega poslovnega gospodarstva. Hkrati so se leta 2025 proizvodnja, izvoz in zaposlenost ohladili; v prvih enajstih mesecih 2025 je bil obseg proizvodnje 1,1 % nižji medletno, največji upad pa je bil v avtomobilski in kovinski industriji. ([SURS, 2025](https://www.stat.si/StatWeb/pr/news/Index/13704); [UMAR, 2026](https://www.umar.gov.si/en/publications/slovenian-economic-mirror/publication/slovenian-economic-mirror-1-2026))

Za Datalab je posebej zanimiv srednji del trga: podjetja, ki so že prevelika za računovodski program in Excel, vendar pogosto še nimajo popolnoma integriranega ERP-MES-APS-WMS okolja. Njihova tipična težava ni odsotnost programske opreme, temveč razkorak med formalno prisotnostjo sistema in dejansko uporabo: kosovnice se vzdržujejo drugje, proizvodnja poroča z zamikom, zaloge niso zaupanja vredne, plan obstaja v Excelu, lastna cena pa se izračuna pozno ali samo približno.

Največje poslovne priložnosti se praviloma pojavijo na šestih presekih:

| Presek | Tipičen simptom | Primarni finančni kanal |
|---|---|---|
| Planiranje × podatki | plan se dnevno spreminja, roki niso verodostojni | nadure, ekspresni prevozi, izgubljena marža |
| Material × zaloge | materiala ni ob pravem času, zaloga pa je visoka | zastoji, vezan kapital, odpisi |
| Izvedba × poročanje | delo in poraba se vnašata naknadno | administracija, netočne zaloge in pokalkulacije |
| Kakovost × sledljivost | vzrok napake ali serija se iščeta ročno | izmet, dodelave, reklamacije, obseg odpoklica |
| Stroški × komerciala | ponudbe temeljijo na starih normativih | erozija marže, napačne prodajne odločitve |
| Vzdrževanje × plan | okvare niso vključene v realen plan | neplanirani zastoji, servisni stroški, zamude |

PANTHEON Manufacture MF dokazljivo pokriva večnivojske kosovnice, tehnološke postopke, proizvodne plane in razporejanje, delovne naloge, porabo in prejem, kooperante, serijske številke, analize proizvodnje ter stroške po delovnem nalogu. MT oziroma spletni terminal pokriva operativno poročanje materiala, dela in izdelkov v proizvodni celici. API in konektorske licence omogočajo povezovanje zunanjih rešitev. To pomeni dobro ujemanje pri podjetjih, kjer je jedro težave v nepovezanih poslovnih podatkih, ročnem toku dokumentov in šibki disciplini planiranja. ([PANTHEON Manufacture](https://www.datalab.eu/pantheon/manufacture/); [PANTHEON MT](https://www.datalab.eu/pantheon/manufacture/managing-manufacturing-units/); [licenčna pravila](https://www.datalab.eu/pantheon-license-prices/))

PANTHEON sam po sebi ni univerzalni nadomestek za:

- realnočasovni MES z neposrednim zajemom signalov strojev;
- napredni APS z omejitvami in optimizacijskim reševanjem kompleksnih urnikov;
- specializiran QMS/LIMS za regulirano kakovost;
- CMMS/EAM za napredno vzdrževanje in zanesljivost sredstev;
- PLM/PDM za inženirsko upravljanje konfiguracij in sprememb;
- specializiran WMS za kompleksno radijsko vodeno skladišče;
- odpravo fizičnih ozkih grl, okvar, pomanjkanja ljudi ali slabe organizacije.

Zato mora vsak prihodnji sistem uporabljati matriko **problem -> zahtevana zmožnost -> procesna sprememba -> PANTHEON -> partner/integracija -> fizična naložba**.

---

# 2. Metodologija, obseg in zanesljivost

## 2.1 Raziskovalni okvir

Raziskava kombinira:

- uradne statistike SURS, Eurostata, UMAR, Evropske komisije, OECD in EIB;
- mednarodne standarde in referenčne okvire ISA-95/IEC 62264, ISO 22400, ISO 9001, ISO 55001 in ISO 50001;
- uradno dokumentacijo Datalaba, PANTHEON UserSite in javne študije primerov;
- uradno dokumentacijo konkurenčnih rešitev;
- analitično sintezo proizvodnih procesov, vzrokov izgub in finančnih formul.

ISA-95 je uporabljen za ločevanje poslovnega planiranja in logistike (raven 4), upravljanja proizvodnih operacij oziroma MES (raven 3), nadzora procesov (raven 2), senzorjev in aktuatorjev (raven 1) ter fizičnega procesa (raven 0). Standard je pomemben zato, ker preprečuje nerealno pričakovanje, da mora en ERP pokriti vse ravni. ([ISA-95](https://www.isa.org/standards-and-publications/isa-standards/isa-95-standard))

ISO 22400 je uporabljen kot referenca za strukturiranje proizvodnih KPI-jev: formula, elementi, časovno vedenje, enota, uporabniška skupina in proizvodna metodologija. ([ISO 22400-1](https://www.iso.org/standard/56847.html); [ISO 22400-2](https://www.iso.org/standard/54497.html))

## 2.2 Oznake dokazov

| Oznaka | Pomen | Dovoljena uporaba |
|---|---|---|
| **A - uradno potrjeno** | uradna statistika, zakon, standard ali dokumentacija proizvajalca | dejstvo in izračun |
| **B - več virov** | konsistentno potrjeno iz več kakovostnih virov | dejstvo z navedbo omejitve |
| **C - panožni vzorec** | splošno priznana praksa, vendar ne univerzalna | diagnostika in hipoteza |
| **D - analitična hipoteza** | logična sinteza, ki jo je treba potrditi v podjetju | discovery, nikoli kot dokaz |
| **E - nepotrjeno** | marketinška trditev ali manjkajoč primarni dokaz | samo kot odprta raziskovalna točka |

## 2.3 Pravila proti lažni natančnosti

- Panožni benchmark ni cilj podjetja brez primerljivega proizvodnega modela.
- Prihranek časa zaposlenih ni enak prihranku plače, dokler ni opredeljena monetizacija.
- Prihodek ni korist; pri dodatni prodaji je korist praviloma prispevna marža.
- Sprostitev zaloge ali terjatev je enkratni denarni učinek, ne letni prihranek.
- OEE je diagnostični kazalnik, ne dodatna denarna postavka.
- Tveganje se ne monetizira brez verjetnosti in posledice, podprte z zgodovino ali utemeljenim scenarijem.
- Marketinške študije primerov dokazujejo izvedljivost, ne nujno vzročnosti ali tipičnega učinka.

## 2.4 Časovni in geografski obseg

Statistični prerez uporablja predvsem podatke 2024-2026. Primarni trg je Slovenija. Regionalni trgi služijo kot kontekst lokalizacije, širjenja in primerljivosti, vendar se statistični podatki med državami ne seštevajo brez enotne metodologije.

---

# 3. Velikost, struktura in dinamika trga

## 3.1 Slovenija

| Kazalnik, predelovalne dejavnosti C | 2024 | Medletna sprememba | Vir |
|---|---:|---:|---|
| Aktivna podjetja | 21.471 | +1,0 % | SURS, začasno |
| Zaposleni in samozaposleni | 221.953 | -1,3 % | SURS, začasno |
| Neto prihodki | 42,823 mrd EUR | +3,2 % | SURS, začasno |
| Dodana vrednost | 12,455 mrd EUR | +6,4 % | SURS, začasno |
| Nabave blaga in storitev | 30,729 mrd EUR | +2,2 % | SURS, začasno |

Vir: [SURS - poslovanje podjetij po dejavnostih 2024](https://www.stat.si/StatWeb/pr/news/Index/13704). Podatki ne pomenijo, da je vseh 21.471 podjetij realen ERP-prospekt. V številu prevladujejo mikro podjetja, zato je treba naslovljivi trg filtrirati po zaposlenih, prihodkih, številu proizvodnih virov, kompleksnosti izdelkov in dejanskem načinu planiranja.

Za leto 2025 je pomemben hladnejši kontekst: proizvodnja je bila v prvih enajstih mesecih 1,1 % nižja medletno; avtomobilska in druga transportna oprema približno 9 % nižje, kovinska industrija približno 5 % nižje. Zaposlenost v proizvodnji je bila novembra 2025 1,8 % nižja medletno. To ne zmanjša potrebe po digitalizaciji, vendar spremeni prodajni argument: večji poudarek je na stroških, odpornosti, obratnem kapitalu in preglednosti, manj na nekritičnem širjenju kapacitete. ([UMAR, januar 2026](https://www.umar.gov.si/en/publications/slovenian-economic-mirror/publication/slovenian-economic-mirror-1-2026))

## 3.2 Evropski kontekst

V EU je leta 2023 približno 2,2 milijona proizvodnih podjetij zaposlovalo 30,2 milijona ljudi in ustvarilo 2,5 bilijona EUR dodane vrednosti. Proizvodnja je predstavljala 18,5 % zaposlenosti in 23,1 % dodane vrednosti poslovnega gospodarstva; bruto operativna stopnja je bila 10,4 %. Največji sektorji po dodani vrednosti so bili stroji in oprema, hrana ter motorna vozila. ([Eurostat, manufacturing sector 2023](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Businesses_in_the_manufacturing_sector))

Slovenija je močno vpeta v evropske dobavne verige. Zato so pomembnejši od domače konjunkture:

- naročila iz Nemčije, Italije, Avstrije, Hrvaške in Francije;
- zahteve velikih kupcev glede OTIF, kakovosti, PPAP, sledljivosti in izmenjave podatkov;
- stroškovni pritiski na energijo, materiale in delo;
- volatilnost terminov dobaviteljev;
- prehod na digitalne produktne potne liste in podatke o trajnosti;
- zmožnost dokazovanja porekla, serije, spremembe in skladnosti.

## 3.3 Digitalna zrelost kot tržna vrzel

Evropska komisija je v poročilu za Slovenijo 2025 ocenila, da je digitalna infrastruktura dobro razvita, uporaba digitalnih tehnologij v MSP pa ostaja razmeroma nizka; priporočilo je neprekinjena podpora MSP pri uvajanju. ([Digital Decade Slovenia 2025](https://digital-strategy.ec.europa.eu/en/factpages/slovenia-2025-digital-decade-country-report))

Meritve različnih institucij niso neposredno primerljive. EIB je v anketi 2024 poročal, da je štiri petine slovenskih podjetij sprejelo vsaj eno napredno digitalno tehnologijo, vendar ta široka definicija ne pomeni integriranega ERP-MES okolja. Evropski indeks digitalne intenzivnosti uporablja košarico tehnologij in prav tako ne meri kakovosti podatkov ali dejanske uporabe posameznega procesa. ([EIB, 2025](https://www.eib.org/en/press/all/2025-078-slovenian-businesses-among-eu-s-climate-action-leaders-eib-investment-survey-shows); [Eurostat, digitalisation 2025](https://ec.europa.eu/eurostat/web/interactive-publications/digitalisation-2025))

**Praktični sklep:** lead scoring ne sme uporabljati samo binarnega polja »ima ERP«. Meriti mora uporabo po procesu: ali se v sistemu vzdržujejo kosovnice, planirajo kapacitete, izdajajo delovni nalogi, poročajo poraba in delo, upravljajo serije, izvajajo pokalkulacije in sprejemajo odločitve.

## 3.4 Naslovljivi trg za Datalab

### Jedrni ICP

Podjetje je praviloma visoko relevantno, ko ima več naslednjih značilnosti:

- 20-500 zaposlenih in vsaj 10 neposredno proizvodnih zaposlenih;
- lastne kosovnice ali recepture, delovne naloge in skladišče materiala;
- več kot eno izmeno, lokacijo, proizvodno celico ali pomemben delež kooperantov;
- velik nabor SKU-jev, večnivojske strukture ali pogosto spreminjanje izdelkov;
- ročno oziroma naknadno poročanje iz proizvodnje;
- planiranje v Excelu kljub obstoječemu ERP-ju;
- slabo zaupanje v zaloge, normative ali lastno ceno;
- zahteve po serijski/lot sledljivosti;
- rast, nova lokacija, večja stranka ali certifikacijski pritisk;
- PANTHEON že uporablja za računovodstvo, ne pa za proizvodnjo.

### Podjetja z nižjim ujemanjem

- zelo majhna obrtna proizvodnja brez ponovljivih podatkovnih struktur;
- podjetja, kjer je glavni problem fizična kapaciteta in informacijski tok deluje dobro;
- izjemno kompleksna procesna ali regulirana proizvodnja, ki zahteva validiran MES/LIMS/QMS;
- globalna skupina s korporativno obveznim SAP/Oracle/Microsoft standardom;
- podjetje brez lastnika procesa, uvedbene ekipe ali pripravljenosti urediti matične podatke.

---

# 4. Segmentacija proizvodne niše

## 4.1 Proizvodni modeli

| Model | Logika | Glavni podatki | Tipične bolečine | Informacijske prioritete |
|---|---|---|---|---|
| MTS - na zalogo | proizvodnja na napoved | napoved, min/max, varnostna zaloga | presežki, zastaranje, pomanjkanje pravih SKU | napoved, MRP, zaloge, S&OP |
| ATO - sestavljanje po naročilu | moduli na zalogi, končna konfiguracija po naročilu | konfiguracije, moduli, ATP | manjkajoč modul, napačna konfiguracija | konfigurator, razpoložljivost, končna sledljivost |
| MTO - po naročilu | nalog po potrjenem naročilu | prodajno naročilo, BOM, rok | zamude, prioritete, dolgi pretočni časi | povezava naročilo-DN, kapacitete, material |
| ETO - projektiranje po naročilu | inženiring je del dobave | verzije, spremembe, projekt, mejnik | pozne spremembe, nepopolna dokumentacija | PLM/PDM, projektno vodenje, konfiguracija |
| Serijska/šaržna | ponovljive serije | receptura, lot, yield, rok uporabe | mešanje serij, odstopanja, čiščenje | lot sledljivost, kakovost, recepture |
| Kontinuirana/procesna | neprekinjen tok | procesni parametri, recepture, energija | yield, odstopanja, ustavitve | SCADA/MES, historian, LIMS, ERP integracija |
| Projektna | enkratni kompleksni izdelki | WBS, projekt, ure, material, kooperanti | stroški projekta, spremembe, roki | projektna kontrola, nabava, stroški |

## 4.2 Segmenti po dejavnosti

| Segment | Poslovna posebnost | Kritični procesi | Glavne zahteve za sistem |
|---|---|---|---|
| Kovinskopredelovalna | veliko MTO, operacije, kooperanti | terminiranje, material, orodja, dodelave | tehnološki postopki, kapacitete, kooperanti, pokalkulacija |
| Strojegradnja | ETO/MTO, globoke kosovnice | konstrukcija, spremembe, projektna nabava | verzije BOM, projekt, PLM/PDM povezava |
| Avtomobilski dobavitelji | visoke količine, zahtevna kakovost | EDI, plan kupca, sledljivost, PPAP | serije, kakovost, dokumenti, stabilno poročanje |
| Živila in pijače | šarže, roki uporabe, yield | recepture, alergeni, čiščenje, odpoklic | lot sledljivost, FEFO, recepture, kakovost |
| Farmacija/medicina | validirani procesi, podatkovna integriteta | batch record, odstopanja, sprostitev | validacija, audit trail, QMS/LIMS/MES integracija |
| Plastika in guma | orodja, cikli, serije | nastavitve, izmet, materialne mešanice | zajem ciklov, orodja, sledljivost, OEE |
| Les in pohištvo | konfiguracije, razrez, veliki materiali | optimizacija razreza, naročila, montaža | konfigurator, CAD/CAM povezava, material |
| Elektronika | mnogo komponent, revizije, serijske št. | nabava, obsolescence, testiranje | sledljivost komponent, revizije, testni podatki |
| Kemija | recepture, nevarne snovi, šarže | formulacije, kakovost, skladnost | recepture, loti, LIMS, SDS/dokumentacija |
| Papir in embalaža | hitre linije, formati, odpad | plan kampanj, menjave, yield | zaporedje serij, OEE, odpad, energija |
| Tekstil | barve, velikosti, faze, kooperanti | variantne kosovnice, kakovost, faze | variante, črtne kode, shop-floor integracija |
| Gradbeni materiali | procesna/serijska, energijsko intenzivna | energija, recepture, zaloge v razsutem stanju | tehtnice, procesni podatki, energija, loti |

## 4.3 Dimenzije kompleksnosti

Za scoring je uporabnejši večdimenzionalni profil kot oznaka panoge. Vsako dimenzijo ocenimo 0-4:

1. število proizvodnih lokacij;
2. število izmen;
3. število aktivnih končnih izdelkov in polizdelkov;
4. globina in variantnost kosovnic;
5. število operacij in alternativnih resursov;
6. volatilnost povpraševanja in sprememb kupcev;
7. delež kooperantov;
8. zahtevnost sledljivosti;
9. reguliranost in zahtevnost dokazovanja;
10. pogostost in trajanje menjav;
11. avtomatiziranost opreme;
12. število sistemov in integracij;
13. kakovost matičnih podatkov;
14. zrelost planiranja;
15. disciplino sprotnega poročanja.

Visoka poslovna kompleksnost ob nizki digitalni zrelosti je močan signal potrebe, vendar tudi signal visokega uvedbenega tveganja.

---

# 5. Arhetipi proizvodnih podjetij

## 5.1 Manjši kovinski proizvajalec po naročilu

- **Profil:** 30-80 zaposlenih, ena lokacija, 1-2 izmeni, laserski razrez/CNC/varjenje, MTO.
- **Sistemi:** računovodski ERP, Excel plan, papirni delovni listi.
- **Bolečine:** ročno prerazporejanje, manjkajoč material, neviden WIP, pozna evidenca ur, nepoznana marža naročila.
- **Sprožilec:** rast naročil, nova stranka z zahtevami po sledljivosti ali izguba ključnega planerja.
- **Ujemanje:** MF + terminal + skladišče; za strojne signale partner/MES.

## 5.2 Avtomobilski dobavitelj

- **Profil:** 80-400 zaposlenih, več izmen, serijska proizvodnja, visoka avtomatizacija.
- **Bolečine:** spremembe odpoklicev, kakovostna dokumentacija, mešana sledljivost, mikro zastoji, dobaviteljski OTIF.
- **Sprožilec:** nov OEM program, audit, reklamacija ali nova sledljivostna zahteva.
- **Ujemanje:** ERP za poslovno jedro; praviloma potrebni MES/QMS/EDI in integracija.

## 5.3 Živilski proizvajalec

- **Profil:** 40-250 zaposlenih, serije, roki uporabe, sezonskost.
- **Bolečine:** FEFO, donos recepture, čiščenje, alergeni, širok odpoklic zaradi šibke notranje sledljivosti.
- **Sprožilec:** rast trgovskih verig, audit ali incident kakovosti.
- **Ujemanje:** MF za serije, materiale, DN in stroške; specializirani QMS/LIMS ali tehtnice po potrebi.

## 5.4 Proizvajalec strojev ETO

- **Profil:** 50-300 zaposlenih, projektiranje in izdelava unikatnih strojev.
- **Bolečine:** zamrznitev specifikacije, spremembe konstrukcije, dolgi nabavni roki, projektna marža, neusklajen ERP/PLM.
- **Sprožilec:** več vzporednih projektov ali rast poprodajnega servisa.
- **Ujemanje:** MF + projektni/stroškovni proces; ključna PLM/PDM in CAD integracija.

## 5.5 Serijski proizvajalec plastike

- **Profil:** 50-200 zaposlenih, brizgalke, orodja, 3 izmene.
- **Bolečine:** izmet, čas menjav, okvare orodij, napačne nastavitve, materialni yield.
- **Sprožilec:** pritisk na ceno ali nove zahteve kupca.
- **Ujemanje:** MF za naloge in material; OEE/MES/CMMS za realnočasovne izgube in orodja.

## 5.6 Lesno/pohištveno podjetje

- **Profil:** 30-150 zaposlenih, variantna ali projektna proizvodnja.
- **Bolečine:** konfiguracije, optimizacija razreza, poškodbe, ročno prenašanje iz CAD-a, montažne zamude.
- **Ujemanje:** ERP za naročila, nabavo, skladišče in stroške; CAD/CAM ali konfigurator ostane specializiran.

## 5.7 Podjetje z veliko kooperanti

- **Profil:** lastna montaža in kontrola, kritične faze zunaj podjetja.
- **Bolečine:** nejasno, kje je material, zamude kooperantov, napačni stroški dodelave, večkratni prevozi.
- **Ujemanje:** MF podpira delovne naloge kooperantov; potrebna jasna logistična in kakovostna disciplina.

## 5.8 Večlokacijsko podjetje

- **Profil:** dve ali več lokacij, centralna nabava/finance, lokalna proizvodnja.
- **Bolečine:** različne šifre in prakse, medlokacijski prenosi, konsolidacija, neprimerljivi KPI-ji.
- **Ujemanje:** enotni matični podatki in poslovno jedro; lokalna izvedba lahko zahteva več terminalov ali MES.

## 5.9 Hitro rastoče podjetje, ki je preraslo Excel

- **Profil:** prihodki in število zaposlenih hitro rastejo, procesi temeljijo na nekaj ključnih ljudeh.
- **Bolečine:** različice datotek, odvisnost od planerja, pozni računi, inventurne razlike.
- **Sprožilec:** nova lokacija, investicija ali profesionalizacija vodstva.
- **Tveganje:** prenesti kaos v ERP brez standardizacije.

## 5.10 Obstoječi uporabnik PANTHEON-a brez proizvodnega jedra

- **Profil:** PANTHEON za finance, prodajo in skladišče; proizvodnja v Excelu/papirju.
- **Prednost:** manj migracije partnerjev, artiklov, financ in zalog.
- **Bolečina:** dvojni vnosi in prekinjena sled naročilo-plan-DN-poraba-pokalkulacija.
- **Ujemanje:** najmočnejši cross-sell MF/MT, če so matični podatki urejeni in obstaja lastnik procesa.

---

# 6. Ekonomika proizvodnega podjetja

## 6.1 Kako nastaja rezultat

Poenostavljena ekonomika:

\[
Prihodki - variabilni\ stroški = prispevna\ marža
\]

\[
Prispevna\ marža - fiksni\ proizvodni\ in\ poslovni\ stroški = poslovni\ izid
\]

Ključ je, da sprememba proizvodnje vpliva na več plasti hkrati:

- material in kooperantske storitve;
- neposredno delo in dodatki;
- strojni čas, energijo in potrošni material;
- izmet, dodelavo in reklamacije;
- zalogo materiala, WIP in končnih izdelkov;
- dobavni rok, prodajo in pogodbene kazni;
- amortizacijo in prihodnje investicije;
- administracijo planiranja, skladišča, kakovosti in financ.

## 6.2 Pet različnih vrst vrednosti

| Vrsta | Primer | Denarna obravnava |
|---|---|---|
| Neposredni strošek | izmet materiala, ekspresni prevoz | letni prihranek, če je dokazljivo zmanjšljiv |
| Sproščena kapaciteta | manj čakanja, manj administracije | ure/FTE; denar samo po izbrani monetizaciji |
| Dodatna marža | več prodanih enot skozi ozko grlo | dodatne enote × prispevna marža |
| Obratni kapital | nižja zaloga ali WIP | enkratna sprostitev denarja |
| Tveganje | odpoklic, audit, ključna oseba | ločena ocena ali scenarij, ne samodejni prihranek |

## 6.3 Ozko grlo

Ura, prihranjena na procesu, ki ni ozko grlo, praviloma ne poveča throughputa sistema. Lahko zmanjša nadure, čakanje ali administracijo, ne pa nujno poveča prodaje. Pri dodatni proizvodnji morajo veljati vsi pogoji:

1. proces je dejansko omejujoč;
2. obstaja nezadovoljeno povpraševanje ali realna prodajna možnost;
3. ostali viri lahko podprejo dodatni tok;
4. zamujena proizvodnja se ni kasneje nadoknadila brez dodatnega stroška;
5. korist se vrednoti s prispevno maržo, ne s prihodkom.

## 6.4 Zaloga in denarni cikel

Zaloga je hkrati blažilnik in strošek. Premajhna zaloga povzroča zaustavitve in zamude; prevelika skriva slabe podatke, dolge serije, negotove dobave in neustrezen plan.

\[
Sprostitev\ zaloge = sedanja\ povprečna\ zaloga - ciljna\ povprečna\ zaloga
\]

\[
Letni\ strošek\ držanja = povprečna\ zaloga \times stopnja\ držanja
\]

Stopnja držanja mora biti sestavljena iz dejanskega stroška kapitala, prostora, zavarovanja, ravnanja, poškodb, zastaranja in odpisov. Odpisov ne prištevamo dvakrat, če so že vključeni v stopnjo.

---

# 7. Organizacija in persone

| Persona | Glavni cilj | Ključni KPI | Tipične frustracije | Vloga pri nakupu |
|---|---|---|---|---|
| Lastnik/direktor | rast, denar, zanesljivost | EBITDA, denarni tok, OTIF | »ne vem, kaj se v resnici dogaja« | sponzor/odločevalec |
| CFO/finance | kontrola stroškov in kapitala | marža, zaloge, DSO, odstopanja | pozne pokalkulacije, neusklajeni podatki | ekonomski kupec |
| Direktor proizvodnje | stabilen izhod in roki | plan, throughput, OEE, izmet | dnevno gašenje požarov | poslovni lastnik |
| Planer | izvedljiv plan | schedule adherence, zamude | Excel, spremembe, nevidne kapacitete | močan uporabnik/vplivnež |
| Tehnolog | pravilne strukture in normative | čas cikla, odstopanje normativa | zastarele kosovnice, ročne spremembe | lastnik matičnih podatkov |
| Vodja izmene | varna izvedba plana | izhod izmene, zastoji, kakovost | nejasne prioritete, papir | posvojitev na terenu |
| Operater | jasna navodila, čim manj administracije | kakovost, količina, čas | dvojni vnos, slaba navodila | lahko pospeši ali blokira uporabo |
| Nabava | pravočasno in stroškovno ustrezno | supplier OTIF, PPV | nujna naročila, slabe potrebe | procesni vplivnež |
| Skladišče | točna zaloga in hiter pretok | točnost, pick time, inventurne razlike | napačne lokacije, manjkajoče oznake | lastnik izvedbe materiala |
| Kakovost | skladnost in hiter vzrok | FPY, COPQ, reklamacije | podatki po e-pošti, šibka sledljivost | veto v reguliranem okolju |
| Vzdrževanje | razpoložljiva oprema | MTBF, MTTR, PM compliance | okvare niso del plana | specialistični vplivnež |
| Prodaja | zanesljiva obljuba kupcu | OTIF, marža, win rate | nezanesljiv datum in cena | sprožilec |
| IT | varna in vzdržna arhitektura | incidenti, integracije, TCO | senčni Excel, tehnični dolg | tehnični kupec/veto |

### Tipične izjave kupcev

- Direktor: »Imamo dovolj prometa, a denarja je vedno premalo.«
- Planer: »Plan je pravilen samo do prve spremembe.«
- Proizvodnja: »V sistemu piše eno, na hali je drugo.«
- Skladišče: »Material imamo, samo ne vemo točno kje ali za kateri nalog je.«
- Kakovost: »Za reklamacijo sestavljamo zgodbo iz petih tabel.«
- Finance: »Ko dobim pravo lastno ceno, je naročilo že zaključeno.«
- IT: »Vsak oddelek ima svojo resnico in svoj Excel.«

---

# 8. Vrednostna veriga od povpraševanja do denarja

| Faza | Ključni vhod | Ključni izhod | Glavno kontrolno vprašanje |
|---|---|---|---|
| Povpraševanje/ponudba | zahteva kupca, specifikacija | ponudba, cena, rok | ali je rok in marža izvedljiva? |
| Prodajno naročilo | potrjena ponudba | čista zahteva | ali so podatki popolni in zamrznjeni? |
| Napoved/S&OP | zgodovina, pipeline, kapacitete | usklajen agregatni plan | ali prodaja, proizvodnja in finance uporabljajo isti scenarij? |
| MPS/MRP | povpraševanje, zaloga, BOM, roki | proizvodna in nabavna priporočila | ali so matični podatki zaupanja vredni? |
| Nabava | potrebe, dobavitelji | potrjena dobava | ali datum dobave podpira plan? |
| Prevzem/kontrola | dobava, naročilo | razpoložljiv material | ali je količina, kakovost in lot pravilen? |
| Skladiščenje | označen material | lokacijska zaloga | ali sistemsko stanje odraža fizično? |
| Planiranje/terminiranje | DN, kapacitete, omejitve | izvedljiv urnik | ali je plan realen glede na material, ljudi, stroje in vzdrževanje? |
| Priprava/kitting | DN, material | komplet za delo | ali je vse pripravljeno pred začetkom? |
| Izvedba | navodila, material, resurs | izdelek, poraba, čas | ali se dejansko stanje poroča sproti? |
| Kakovost | kontrolni plan, meritve | sprostitev/neskladnost | ali lahko hitro dokažemo skladnost in vzrok? |
| Končno skladišče | sproščen izdelek | razpoložljiva zaloga | ali so status, serija in količina pravilni? |
| Odprema | naročilo, transport | dokaz dobave | ali je dobava popolna in pravočasna? |
| Fakturiranje | odprema/pogodba | račun | koliko dni po odpremi nastane račun? |
| Reklamacije/servis | zahtevek, serija | korektivni ukrep | ali napako zapremo v procesni povratni zanki? |
| Pokalkulacija | dejanska poraba, delo, režija | odstopanje in marža | ali se ugotovitev uporabi za naslednjo ponudbo in normativ? |

---

# 9. Podroben katalog procesov

## 9.1 Prodaja, ponudbe in obljubljeni rok

**Namen:** pretvoriti zahtevo kupca v dobičkonosno, izvedljivo in podatkovno popolno naročilo.

**Kritični podatki:** artikel/konfiguracija, količina, datum, kakovost, dokumentacija, Incoterms, valuta, materialne in operacijske ocene, kapaciteta, kooperanti.

**Bolečine:** ročno kalkuliranje, neupoštevane spremembe cen materiala, prodaja obljubi datum brez ATP/CTP, nejasna revizija specifikacije, manjkajoča orodja ali certifikati.

**Meritve:** čas priprave ponudbe, delež ponudb z ročnim preračunom, odstopanje predkalkulacije od pokalkulacije, delež sprememb po potrditvi, marža po naročilu.

**Sistemska meja:** ERP dobro poveže cene, normative, zaloge in naročila; konfigurator, CAD/PLM ali napredni CTP je lahko ločen.

## 9.2 S&OP, napovedovanje in glavni plan

**Namen:** uskladiti povpraševanje, ponudbo, zaloge, finančne cilje in tveganja na agregatni ravni.

**Bolečine:** prodajna napoved je želja, proizvodnja uporablja drugo številko, ni scenarijev, ni lastnika odločitve, napovedna napaka se ne meri.

**Meritve:** forecast bias, WAPE/MAPE (z ustrezno previdnostjo pri ničlah), service level, dnevi zaloge, planirana proti razpoložljivi kapaciteti.

**Sistemska meja:** ERP zagotavlja transakcijsko osnovo; zrel S&OP je upravljavski proces, ne funkcija gumba.

## 9.3 MRP in materialne potrebe

MRP izračuna nabavne in proizvodne potrebe iz povpraševanja, zaloge, odprtih dobav, kosovnic, rokov in pravil velikosti naročil. SAP ga opisuje kot jedro skoraj vseh integriranih proizvodnih sistemov. ([SAP - MRP](https://www.sap.com/resources/what-is-material-resource-planning-mrp))

**Predpogoji:** pravilne kosovnice, dobavni roki, stanje zalog, politike naročanja, scrap/yield, odprti nalogi in zamrznjena območja.

**Tipični neuspeh:** podjetje obtoži MRP, čeprav so vhodni podatki netočni. Zato je prvi KPI MRP-ja kakovost vhodov, ne število predlogov.

## 9.4 Planiranje in terminiranje

**Namen:** zaporedje in čas nalog uskladiti z materialom, delavci, stroji, orodji, menjavami, kakovostjo in vzdrževanjem.

**Stopnje zrelosti:** ročni seznam -> časovno faziranje -> grobo planiranje kapacitet -> končno terminiranje -> optimizacijski APS -> zaprta zanka z izvedbo.

**Bolečine:** neskončne kapacitete, skriti setupi, alternativni resursi niso v podatkih, okvare in odsotnosti niso vključene, prioritet je preveč.

**PANTHEON:** uradna stran navaja srednjeročno operativno planiranje, kratkoročno razporejanje, dnevni plan, različne tipe proizvodnje ter upoštevanje BOM in tehnoloških operacij. Kompleksnost realnih omejitev je treba preveriti v demonstraciji s podatki podjetja. ([PANTHEON Manufacture](https://www.datalab.eu/pantheon/manufacture/))

## 9.5 Kosovnice, recepture in tehnološki postopki

**Namen:** formalizirati, kaj, koliko, kako, kje in v kakšnem zaporedju se izdeluje.

**Kritične kontrole:** revizija, datum veljavnosti, odobritev, alternative, yield/scrap, enote mere, fantomski sklopi, kooperantske operacije, orodje, navodila.

**Bolečine:** več resnic v CAD/Excel/ERP, sprememba ni prenesena na odprte naloge, napačna enota, normativni čas se nikoli ne posodobi.

**Finančni učinek:** presežna poraba, napačna nabava, izmet, napačna lastna cena, zamude in ponovna izdelava.

## 9.6 Delovni nalogi

DN je kontrolni objekt, ki poveže povpraševanje, specifikacijo, material, operacije, dejansko porabo, delo, kakovost, prejem izdelka in strošek.

**Kontrole:** izvor naloga, status, količina, verzija, prioriteta, materialna rezervacija, zaključek vseh operacij, presežna poraba, nezaključeni WIP.

**PANTHEON:** DN se lahko ustvarja iz prodajnih naročil ali planov; uporablja BOM, podpira interne izdaje/prejeme in kooperante. ([PANTHEON Manufacture](https://www.datalab.eu/pantheon/manufacture/))

## 9.7 Zajem podatkov iz proizvodnje

**Namen:** čim bolj sproti in z najmanjšim bremenom zabeležiti začetek/konec, količino, izmet, razlog zastoja, material, operaterja, stroj in kakovost.

**Načini:** papir, naknadni vnos, terminal, črtna/QR koda, RFID, strojni signal, MES ali kombinacija.

**Kritično:** avtomatizacija slabega dogodkovnega modela samo hitreje proizvaja slabe podatke. Najprej definiramo dogodke, status in odgovornost.

**PANTHEON MT/WT:** namenjen elektronski dokumentaciji na celici; uradno podpira izdajo materiala, porabo na DN, poročanje opravljenega dela, delo po zaposlenem in prejem izdelkov. ([PANTHEON MT](https://www.datalab.eu/pantheon/manufacture/managing-manufacturing-units/))

## 9.8 Menjave serij in nastavitve

**Namen:** prehod med izdelki z najmanj izgubljenega časa, materiala in tveganja kakovosti.

**Podatki:** notranji/zunanji setup, čiščenje, orodje, zaporedje izdelkov, prva dobra enota, razlog zamude.

**Meritve:** mediani in P90 čas menjave, odstopanje po izdelku/stroju/ekipi, delež menjav s čakanjem, izmet zagona.

**Sistemska meja:** ERP hrani standarde in plan; izboljšanje SMED je fizično-procesna disciplina.

## 9.9 Vzdrževanje

**Namen:** obvladovati razpoložljivost, tveganje, strošek in življenjski cikel opreme. ISO 55001 zahteva sistematično vzpostavitev, vzdrževanje in izboljševanje sistema upravljanja sredstev. ([ISO 55001](https://www.iso.org/standard/55089.html))

**Procesi:** prijava okvare, korektivno delo, preventivni plan, rezervni deli, kalibracije, vzrok okvare, backlog, prediktivni signal.

**Meritve:** MTBF, MTTR, planirano/neplanirano delo, PM compliance, maintenance cost per asset, ponovljene okvare.

**Sistemska meja:** osnovno planiranje je lahko v ERP; napreden CMMS/EAM, condition monitoring in predictive maintenance zahtevajo specializacijo.

## 9.10 Kakovost

**Procesi:** vhodna kontrola, kontrolni plan, procesne meritve, končna kontrola, neskladnost, karantena, dodelava, CAPA/8D, reklamacije in dobaviteljska kakovost.

**Meritve:** FPY, scrap, rework, PPM, complaint rate, COPQ, čas zapiranja CAPA, supplier defects.

ASQ definira FPY kot delež enot, ki proces zaključijo skladno brez popravil ali dodelave. ([ASQ glossary](https://asq.org/quality-resources/quality-glossary))

## 9.11 Sledljivost

**Namen:** povezati dobavitelja, vhodni lot, notranje transformacije, opremo/operaterja, rezultate kakovosti, končni lot/serijsko številko in kupca.

**Stopnje:** zunanja »korak nazaj/naprej« -> notranja lot sled -> genealogija komponent -> enotna serijska sled -> parametri procesa.

V živilstvu je sledljivost temeljni element varnosti in omogoča hitro omejitev ter umik prizadetega proizvoda. ([Evropska komisija](https://food.ec.europa.eu/horizontal-topics/general-food-law/food-law-general-requirements_en))

## 9.12 Nabava in dobavitelji

**Procesi:** sourcing, pogodbe, naročilo, potrditev, expediting, prevzem, kakovost, ocenjevanje dobavitelja in reklamacija.

**Bolečine:** roki niso vzdrževani, potrditve so v e-pošti, nujna naročila, MOQ povzroča presežek, kvaliteta dobavitelja ni povezana s stroškom.

**Meritve:** supplier OTIF, lead time variability, PPV, defect rate, expedite rate, delež potrjenih naročil.

## 9.13 Kooperanti

Kooperantska operacija mora ohraniti lastništvo materiala, lokacijo, količino, rok, kakovost, strošek in povezavo z DN. Posebej merimo transport, čakanje in ponovne obdelave. PANTHEON uradno navaja upravljanje DN kooperantov in povezavo z njihovimi prejetimi računi.

## 9.14 Zaloge, WIP in interna logistika

**Ključne kontrole:** lokacija, status kakovosti, lot/serija, rezervacija, enota mere, lastništvo, starost, negativna zaloga, slepi prevzem.

**Meritve:** točnost zaloge, dnevi zaloge, obrati, starost, WIP age, material availability, pick accuracy, inventurne razlike.

## 9.15 Odprema in OTIF

OTIF mora imeti enotno definicijo: kaj je »on time«, ali se meri zahtevani ali potrjeni datum, kakšna je toleranca in ali je »in full« na vrstici ali naročilu. Brez tega oddelki optimizirajo različne številke.

## 9.16 Energija, odpad in trajnost

ISO 50001 daje okvir za sistematično izboljševanje energetske učinkovitosti, uporabe in porabe. ([ISO 50001](https://www.iso.org/iso-50001-energy-management.html))

**Meritve:** kWh na dobro enoto, energija po stroju/seriji, konična moč, odpad na enoto, delež reciklaže, CO2e po izdelku.

**Sistemska meja:** ERP nosi količine in stroške; merilniki/SCADA/EMS nosijo granularno porabo.

## 9.17 Lastna cena in pokalkulacija

**Predkalkulacija:** standardni material + standardne operacije + kooperanti + režija.  
**Pokalkulacija:** dejanska poraba + dejanski čas + dejanska dodelava/izmet + razumna alokacija stroškov.

Razlika mora sprožiti ukrep: popravek normativa, cene, procesa, dobavitelja ali prodajne politike. PANTHEON UserSite dokumentira analizo stroškov po DN in primerjavo dejanske proizvodnje s predkalkulacijo. ([PANTHEON cost analysis](https://usersite.datalab.eu/PantheonUserManual/tabid/316/topic/cost-analysis-manufacturing-mf-i/htmlid/1009191/language/en-US/Default.aspx))

## 9.18 Finance in terjatve

Poleg knjiženja je za proizvodnjo pomemben zamik med odpremo in računom, zadržana plačila zaradi dokumentacije, reklamacije, pogodbene retencije in DSO. Digitalni tok mora zaključiti »order-to-cash«, ne samo proizvodnjo.

---

# 10. Katalog bolečin

Spodnji katalog je normaliziran za neposredno uporabo v vprašalniku ali AI sistemu. **Naslovljivost:** E = ERP neposredno; I = integracija/specializiran sistem; P = procesna sprememba; F = fizični ukrep. Večina problemov zahteva kombinacijo.

| ID | Simptom | Verjetni temeljni vzroki | Dokaz/KPI | Finančni kanal | Naslovljivost |
|---|---|---|---|---|---|
| PLN-01 | plan se spreminja večkrat dnevno | slabi roki, netočna zaloga, nerealne kapacitete | št. sprememb, adherence | admin, nadure, zamude | E+P |
| PLN-02 | vse je prioriteta | ni pravil zamrznitve in eskalacije | delež nujnih DN | menjave, izgubljen čas | P+E |
| PLN-03 | roki kupcu niso zanesljivi | prodaja brez CTP, plan ločen | OTIF, date changes | penali, marža | E+I+P |
| PLN-04 | planer je nenadomestljiv | znanje ni formalizirano | ročni koraki, backup | tveganje, zastoji | E+P |
| MAT-01 | material manjka ob začetku | netočna zaloga/BOM/rok | stoppage by material | zastoj, ekspres | E+P |
| MAT-02 | visoka zaloga in pomanjkanja hkrati | napačen mix, MOQ, slaba napoved | DOS, stockouts | kapital, zastoj | E+P |
| MAT-03 | presežna poraba materiala | normativ, scrap, kraja, enote | usage variance | neposredni strošek | E+I+P |
| MAT-04 | material se išče | lokacije/označevanje nedisciplinirano | search time | delo, zastoj | E+I+P |
| BOM-01 | kosovnice niso aktualne | več lastnikov, brez revizij | ECO backlog, odstopanja | scrap, zamuda | E+I+P |
| BOM-02 | napačne enote mere | ročni prenosi, konverzije | korekcije | material, zaloga | E+P |
| BOM-03 | sprememba ne pride na odprte DN | šibek ECO proces | št. prizadetih DN | rework, scrap | I+P+E |
| EXE-01 | poročanje je naknadno | papir, slab UX, kultura | latency vnosa | admin, slabi podatki | E+I+P |
| EXE-02 | poraba se knjiži pavšalno | ni zajema po DN/lotu | variance, backflush | stroški, sledljivost | E+P |
| EXE-03 | WIP ni viden | manjkajoči statusi | WIP age/accuracy | kapital, rok | E+I+P |
| EXE-04 | operaterji prepisujejo podatke | nepovezani sistemi | vnosi/dokument | delo, napake | I+E |
| SET-01 | menjave trajajo nepredvidljivo | priprava po ustavitvi, orodja | median/P90 setup | kapaciteta | P+F+I |
| SET-02 | veliko zagonskega izmeta | nestandardne nastavitve | startup scrap | material, čas | P+I+F |
| MNT-01 | okvare presenetijo plan | reaktivno vzdrževanje | downtime, MTBF | zastoj, servis | I+P+F |
| MNT-02 | preventiva se ne izvede | plan ni integriran, backlog | PM compliance | tveganje, okvare | I+P |
| MNT-03 | rezervnih delov ni | brez kritičnosti/min-max | stockout parts | MTTR, ekspres | E+I+P |
| QLT-01 | visok izmet | proces, material, nastavitve | scrap %, yield | material, kapaciteta | I+P+F |
| QLT-02 | veliko dodelav | slaba prva kakovost | FPY, rework hours | delo, rok | I+P+F |
| QLT-03 | reklamacije se ponavljajo | CAPA ni zaprta v proces | repeat complaints | servis, izguba kupca | I+P |
| QLT-04 | meritve niso vezane na lot/DN | ločen QMS/Excel | trace completion | tveganje, admin | I+E |
| TRC-01 | genealogija izdelka se sestavlja ročno | nepovezani loti | recall drill time | admin, obseg umika | E+I+P |
| TRC-02 | serije se mešajo | označevanje/lokacije | mixed-lot incidents | tveganje, scrap | E+I+P |
| PUR-01 | preveč nujnih nabav | slab MRP, pozne spremembe | expedite rate | premija, transport | E+P |
| PUR-02 | dobavitelji zamujajo brez opozorila | ni potrditev/expeditinga | supplier OTIF | zastoj, zamuda | E+P |
| PUR-03 | kakovost dobavitelja ni v odločitvi | cena je edino merilo | total supplier cost | COPQ | E+I+P |
| SUB-01 | ne vemo, kaj je pri kooperantu | ni statusa/lokacije | overdue WIP | rok, kapital | E+P |
| SUB-02 | račun kooperanta ni vezan na operacijo | slaba povezava dokumentov | unmatched invoice | strošek, admin | E+P |
| INV-01 | sistemska in fizična zaloga se razlikujeta | zamiki, enote, lokacije | inventory accuracy | zastoj, odpis | E+I+P |
| INV-02 | zastarela zaloga raste | slaba napoved/ECO | aged stock | kapital, odpis | E+P |
| INV-03 | negativna zaloga je normalna | pozno knjiženje | negative stock events | napačna cena/MRP | E+P |
| CST-01 | lastna cena ni znana po naročilu | ni dejanske porabe/ur | calc latency | marža | E+P |
| CST-02 | normativi niso posodobljeni | pokalkulacija ne hrani učenja | variance trend | ponudbena marža | E+P |
| CST-03 | režija prekrije ekonomiko ozkega grla | neustrezen stroškovni model | margin vs throughput | slabe odločitve | P+BI |
| SAL-01 | prodaja obljubi nerealen rok | ni skupnih pravil/podatkov | promise changes | OTIF, ugled | E+P+I |
| SHP-01 | odprema čaka dokumentacijo | ročni certifikati/pakiranje | dock waiting | transport, rok | E+I+P |
| FIN-01 | račun se izda pozno | odprema in račun nista povezana | days ship-to-invoice | DSO, denar | E+P |
| FIN-02 | stroški so vidni prepozno | obdobno knjiženje, brez DN | close/calc time | slabe odločitve | E+P |
| DAT-01 | vsak oddelek ima svoj Excel | ni lastnika podatka | reconciliations | admin, napake | E+P |
| DAT-02 | iste šifre pomenijo različne stvari | brez upravljanja master data | duplicates | MRP, poročila | E+P |
| DAT-03 | KPI-ji nimajo enotne definicije | lokalne metrike | reconciling KPI | admin, napačne odločitve | P+BI |
| IT-01 | ERP je otok | brez integracijske arhitekture | ročni prenosi | delo, zamik | I+E |
| IT-02 | integracije nimajo nadzora | point-to-point brez logov | failed messages | napake, zastoj | I+P |
| HR-01 | premalo usposobljenih ljudi | skill matrix ni povezana s planom | coverage by skill | kapaciteta, kakovost | E+P |
| HR-02 | veliko nadur | nestabilen plan/ozko grlo | overtime hours | neposredni strošek | E+P+F |
| ENR-01 | energija na enoto ni znana | meritev le na računu | kWh/good unit | strošek, ESG | I+P |
| CMP-01 | audit dokazila se zbirajo ročno | dokumenti in transakcije ločeni | audit prep hours | admin, tveganje | E+I+P |

### Vzročno drevo za zamude

Zamuda je rezultat, ne vzrok. Vprašalnik mora razdeliti vsaj:

- material: dobavitelj, MRP, netočna zaloga, kakovost prevzema;
- kapaciteta: stroj, ljudje, orodje, kooperant;
- plan: nerealni časi, spremembe prioritet, setup;
- inženiring: pozna dokumentacija, sprememba BOM;
- izvedba: zastoj, izmet, dodelava, slabo poročanje;
- komerciala: neizvedljiv obljubljen rok;
- odprema: dokumentacija, pakiranje, transport.

Vsakemu vzroku se dodeli delež in naslovljivost. Vsota deležev mora biti 100 %; en vzrok ne sme biti monetiziran v dveh modulih.

---

# 11. KPI slovar

| KPI | Formula | Namen | Ključna past |
|---|---|---|---|
| OEE | razpoložljivost × zmogljivost × kakovost | skupni diagnostični pogled na opremo | ne seštevaj z osnovnimi izgubami |
| Razpoložljivost | čas delovanja / planiran proizvodni čas | izgube zastojev | jasna pravila planiranega časa |
| Zmogljivost OEE | idealni cikel × skupne enote / čas delovanja | počasni cikli/mikro zastoji | idealni cikel mora biti realen in stabilen |
| Kakovost OEE | dobre enote / vse enote | izmet/dodelava | dodelava ni vedno dobra prva enota |
| Schedule adherence | pravočasno izvedeni planirani nalogi / planirani nalogi | stabilnost izvedbe | zamrznjeno obdobje in toleranca |
| Plan attainment | dejanska dobra količina / planirana količina | količinsko doseganje | lahko prikrije zamujene SKU-je |
| Throughput | dobre enote ali prispevna marža / čas | tok sistema | izberi ustrezno enoto |
| Cycle time | čas na enoto ali cikel | zmogljivost procesa | loči strojni in pretočni čas |
| Lead time | konec - začetek od naročila do dobave | odzivnost | veliko čakanja ni procesni čas |
| Takt time | razpoložljiv čas / povpraševane enote | ritem povpraševanja | ni isto kot dejanski cikel |
| Setup time | prva dobra B - zadnja dobra A | menjava | definiraj prvo dobro enoto |
| MTBF | čas delovanja / št. okvar | zanesljivost | definicija okvare |
| MTTR | skupni čas popravil / št. popravil | popravljivost | loči čakanje na del/tehnika |
| PM compliance | pravočasno izvedena preventiva / planirana preventiva | disciplina vzdrževanja | sama izvedba ne pomeni kakovosti |
| FPY | dobre brez dodelave / vhodne enote | prva kakovost | ne vključuj popravljenih kot prvi prehod |
| Scrap rate | izmet / skupni vhod ali izhod | materialna izguba | imenovalec mora biti enoten |
| Rework rate | dodelane enote ali ure / skupno | skrita tovarna | količina in ure merita drugo |
| Yield | dober izhod / materialni vhod | procesna učinkovitost | v procesni proizvodnji upoštevaj fizikalne izgube |
| COPQ | notranje + zunanje napake | celotni strošek slabe kakovosti | izgubljen ugled naj bo ločen scenarij |
| OTIF | pravočasne in popolne dobave / vse dobave | storitev kupcu | zahtevani vs potrjeni datum |
| Perfect order | brez napake v času, količini, dokumentih in škodi | celovita dobava | stroga definicija zniža rezultat |
| Inventory accuracy | pravilne postavke / preverjene postavke | zaupanje v zalogo | meri po lokaciji/lotu, ne le vrednosti |
| Inventory turns | letni COGS / povprečna zaloga | učinkovitost kapitala | sezonskost in povprečje |
| Days inventory | povprečna zaloga / COGS × 365 | dnevi vezave | loči material, WIP, FG |
| WIP age | danes - datum vstopa v WIP | zastoji toka | manjkajoč status kvari meritev |
| Material availability | DN z vsemi kritičnimi materiali / DN za začetek | pripravljenost | rezervacija ni fizična razpoložljivost |
| Supplier OTIF | pravočasne/popolne dobave dobavitelja / vse | dobaviteljska izvedba | potrjeni datum se ne sme tiho spreminjati |
| Forecast bias | vsota(napoved-dejansko) / vsota dejansko | sistematična pristranskost | agregacija prikrije SKU-je |
| WAPE | vsota absolutnih napak / vsota dejansko | napovedna napaka | manj primeren za prekinitvene artikle |
| Produktivnost dela | dobre enote ali dodana vrednost / ure | uporaba dela | mix izdelkov vpliva na rezultat |
| Nadure | nadurne ure / razpoložljive redne ure | obremenitev/strošek | loči osnovno uro in dodatek |
| Usage variance | dejanska - standardna poraba za dejanski izhod | materialni nadzor | najprej preveri standard |
| Labor variance | dejanske - standardne ure | operacijski nadzor | vključuje mix in poročanje |
| Cost variance | dejanska - predvidena lastna cena | kontrola marže | metoda alokacije režije |
| Contribution margin | prihodki - variabilni stroški | vrednotenje dodatne prodaje | ne zamenjuj z bruto maržo |
| DSO | terjatve / prodaja na kredit × dnevi | denarni cikel | sezonskost, DDV, zapadle postavke |
| Ship-to-invoice | datum računa - datum odpreme | administrativni zamik | pogodbeni mejniki |
| Energy intensity | kWh / dobra enota | energijska učinkovitost | produktni mix in vreme |
| Recall drill time | čas do popolne genealogije in seznama kupcev | pripravljenost sledljivosti | redno testiranje, ne samo incident |

## 11.1 Benchmark politika

Dokument zavestno ne podaja univerzalnih ciljev tipa »OEE 85 %« za vse. Tak cilj brez primerjave procesa, planiranih izključitev, mixa, starosti opreme in metodologije pogosto ustvari napačno gotovost. Hierarhija benchmarka:

1. lastna časovna baza istega procesa;
2. primerljiva linija/stroj v istem podjetju;
3. primerljiv izdelek in tehnologija v skupini;
4. panožni kvartili z enako definicijo;
5. splošni zunanji benchmark samo kot orientacija.

---

# 12. Finančni model izgub, koristi in ROI

## 12.1 Osnovna formula realizirane koristi

\[
Korist_{d,t}=Osnovna\ izguba_d \times Naslovljivi\ delež_d \times Dosegljivo\ zmanjšanje_d \times Obseg\ uvedbe \times Sprejetje \times Rampa_t
\]

Zanesljivost podatka ne sme umetno zmanjšati koristi. Negotovost se izrazi z razponom vhodov in izhoda.

## 12.2 Formule po področjih

### Ročno delo

\[
Ure = primeri\ na\ obdobje \times minute\ na\ primer / 60
\]

Monetizacija: manj nadur, manj zunanjih izvajalcev, preprečena zaposlitev ali več throughputa. Če čas ostane rezerva, poročamo ure, ne evrov.

### Zastoj

\[
Strošek\ zastoja = ure \times izogibni\ strošek\ ure
\]

ali, če je ozko grlo in obstaja prodaja:

\[
Izgubljena\ marža = izgubljene\ dobre\ enote \times prispevna\ marža\ na\ enoto
\]

Ne seštevamo obeh, če opisujeta isti izgubljeni izhod.

### Izmet

\[
Strošek\ izmeta = količina\ izmeta \times že\ vloženi\ izogibni\ stroški - reševalna\ vrednost
\]

### Dodelava

\[
Strošek\ dodelave = ure\ dela + strojne\ ure + dodatni\ material + logistika
\]

### Ekspresni prevoz

\[
Prihranek = št.\ izrednih\ pošiljk \times (strošek\ izredne - običajne\ pošiljke) \times zmanjšanje
\]

### Sprostitev terjatev

\[
Sprostitev\ denarja = letna\ prodaja\ na\ kredit / 365 \times zmanjšanje\ DSO
\]

### Sprostitev zaloge

\[
Sprostitev\ denarja = znižanje\ povprečne\ količine \times nabavna/proizvodna\ vrednost
\]

## 12.3 Stroški uvedbe - TCO

Vključiti je treba:

- licence/naročnine;
- implementacijsko svetovanje;
- analizo in preoblikovanje procesov;
- migracijo in čiščenje podatkov;
- integracije in prilagoditve;
- terminale, čitalce, tiskalnike, omrežje in strežnike;
- notranje ure ključnih uporabnikov;
- izobraževanje in podporo ob zagonu;
- vzdrževanje, nadgradnje in podporo;
- začasni padec produktivnosti;
- rezervo za spremembo obsega.

## 12.4 NPV in ROI

\[
NPV=\sum_{t=0}^{T}\frac{Koristi_t-Stroški_t}{(1+r)^t}
\]

\[
ROI=\frac{PV(Koristi)-PV(Stroški)}{PV(Stroški)}
\]

Poročamo: triletni NPV, ROI, razmerje korist/strošek, navadno in diskontirano vračilno dobo ter letne denarne tokove. NIST priporoča standardne investicijske metode, občutljivost in pri več negotovih spremenljivkah Monte Carlo analizo. ([NIST AMS 200-5](https://nvlpubs.nist.gov/nistpubs/ams/NIST.AMS.200-5.pdf); [NIST EDGeS](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.1214.pdf))

## 12.5 Scenariji in zanesljivost

- **P10 konservativni:** višji stroški, počasnejša rampa, nižje zmanjšanje.
- **P50 realistični:** najverjetnejši potrjeni scenarij.
- **P90 ugodni:** izvedljiv zgornji rezultat, ne marketinški maksimum.

Pri vsakem vhodu zabeležimo vir: ERP poročilo, glavna knjiga, meritev, strokovna ocena, grob razpon ali neznano. Skupna zanesljivost je utežena po denarni pomembnosti.

## 12.6 Kontrole proti podvajanju

- zastoj in izgubljena prodaja istega dogodka;
- izmet in materialno odstopanje iste količine;
- dodelava v kakovosti in dodatne ure v proizvodnji;
- reklamacija in servis istega primera;
- čakanje na material pri planiranju in nabavi;
- polna urna postavka nadure in nato še nadurni dodatek;
- OEE ter ločeno vse njegove izgube;
- sprostitev kapitala kot letna korist;
- odpis zastarele zaloge in ista postavka v stopnji držanja.

---

# 13. Model digitalne zrelosti 0-5

| Stopnja | Procesi in podatki | Tipični sistemi | Ključni naslednji korak |
|---|---|---|---|
| 0 | ustno, papir, brez sledljivosti odločitev | osnovno računovodstvo | standardizacija in osnovni registri |
| 1 | Excel po oddelkih, naknadni vnosi | računovodski ERP + datoteke | enotni matični podatki in DN |
| 2 | ERP obstaja, proizvodnja delno zunaj | ERP, papirni DN | sprotni zajem in integracija osnovnega toka |
| 3 | povezani naročilo-BOM-DN-zaloga-strošek | ERP + terminali | kakovost podatkov, kapacitete, KPI upravljanje |
| 4 | zaprta zanka plan-izvedba, specializirani sistemi | ERP+MES/APS/WMS/QMS/BI | napredna analitika in prediktivni modeli |
| 5 | adaptivno odločanje z nadzorom človeka | integrirana arhitektura, digital thread | optimizacija portfelja in avtonomija z varovali |

Zrelost ocenimo ločeno za 12 domen: prodaja/napoved, master data, planiranje, nabava, skladišče, izvedba, kakovost, sledljivost, vzdrževanje, stroški/finance, integracije in upravljanje sprememb.

### Anti-vzorec: tehnološko napredno, procesno nezrelo

Podjetje ima senzorje in nadzorne plošče, vendar ne zaupa kosovnicam, ne zapira DN in ne uporablja enotnih razlogov zastojev. To ni stopnja 4. Napredna tehnologija brez transakcijske discipline poveča količino podatkov, ne nujno kakovosti odločitev.

---

# 14. Tehnološki ekosistem

| Sistem | Primarna vloga | Kaj mora biti vir resnice |
|---|---|---|
| ERP/MRP | poslovno planiranje, naročila, material, finance | partnerji, artikli, poslovni dokumenti, vrednosti |
| APS | omejitveno planiranje in optimizacija | urnik in scenariji |
| MES/MOM | upravljanje in dokaz izvedbe | dogodki proizvodnje, WIP, izvedba operacij |
| SCADA/Historian | nadzor procesa in časovne serije | procesne vrednosti in alarmi |
| PLC/IoT | zaznavanje in krmiljenje | strojni signal |
| WMS | usmerjanje skladiščnega dela | lokacija, naloga, izvedba premika |
| QMS | kakovost, neskladnosti, CAPA, dokumenti | kakovostni zapis in status |
| LIMS | laboratorijski vzorci in rezultati | laboratorijski podatek |
| CMMS/EAM | vzdrževanje in sredstva | delovni nalog vzdrževanja, zgodovina sredstva |
| PLM/PDM | inženirski izdelek, revizije, spremembe | odobrena produktna definicija |
| CRM/CPQ | priložnost, konfiguracija, ponudba | komercialna interakcija/konfiguracija |
| BI/lakehouse | analitika čez domene | semantični model, ne izvor transakcije |
| DMS | dokument in odobritev | veljavna dokumentacija |
| EDI/API/iPaaS | izmenjava in orkestracija | integracijski dogodek in sled napake |

## 14.1 Referenčna arhitektura za manjše podjetje

ERP MF je jedro. Terminal/črtne kode pokrivajo proizvodnjo in skladišče. DMS hrani navodila in certifikate. BI poroča iz enotnega vira. Strojni podatki se vključijo samo tam, kjer dokazano rešujejo vredno izgubo.

## 14.2 Srednje kompleksno podjetje

ERP ostane poslovni vir; APS izdela omejitveni plan; MES vodi izvedbo; WMS materialni tok; QMS kakovost; CMMS vzdrževanje. Integracijska plast potrebuje lastništvo sporočil, monitoring in obravnavo napak.

## 14.3 Regulirana proizvodnja

Poleg funkcionalnosti so potrebni validacija, vloge, audit trail, elektronski podpisi, podatkovna integriteta, kontrola sprememb, backup, kontinuiteta in dokazovanje namena uporabe. EU GMP Annex 11 zahteva validacijo aplikacije, kvalifikacijo infrastrukture in na tveganju temelječ življenjski cikel računalniškega sistema. ([EU GMP Annex 11](https://health.ec.europa.eu/system/files/2016-11/annex11_01-2011_en_0.pdf))

---

# 15. PANTHEON MF, MT/WT in ekosistem

## 15.1 Dokazljivo jedro

| Zmožnost | Javna podpora | Ocena ujemanja | Kaj preveriti v pilotu |
|---|---|---|---|
| Večnivojske BOM in alternative | da | visoko | revizije, veljavnost, variante |
| Tehnološki postopki/operacije | da | visoko | setup/run, alternativni resursi |
| Planiranje in razporejanje | da | srednje-visoko | omejitve, hitrost, replaniranje |
| Dnevni plan | da | visoko za osnovni use case | spremembe, dispatch na terminal |
| DN iz naročil/planov | da | visoko | večnivojski DN, statusi |
| Materialne izdaje/prejemi | da | visoko | backflush, loti, odstopanja |
| Kooperanti | da | visoko | logistika, lastništvo, račun |
| Serijske/lot številke | da | visoko | genealogija, atributi, recall drill |
| Delo po zaposlenem/operaciji | MT/WT | visoko | ergonomija, offline, popravki |
| Pokalkulacija DN | da | visoko | režija, actual vs standard |
| BI pregledi proizvodnje | da/partner | srednje | definicije KPI, granularnost |
| API/integracije | da | srednje-visoko | dokumentiran obseg, monitoring, licence |

## 15.2 Funkcionalne meje, ki zahtevajo dokaz

Javna dokumentacija sama ne dokazuje:

- kakovosti algoritma končnega terminiranja pri mnogo omejitvah;
- realnočasovne dvosmerne integracije s stroji brez partnerja;
- polnega QMS z CAPA, SPC, MSA in PPAP;
- naprednega CMMS/EAM;
- validirane uporabe v GMP brez projektne validacije;
- inženirskega upravljanja revizij primerljivega s PLM;
- naprednega WMS z valovi, slottingom in avtomatsko opremo;
- optimizacije razreza, receptur ali laboratorija za vsako nišo.

Zato se prodajna obljuba oblikuje šele po demonstraciji na reprezentativnih podatkih in scenarijih podjetja.

## 15.3 Partnerji in integracije

Tržnica vključuje rešitve za BI, OEE, črtne kode/skladišče, dostavo, e-trgovino in druge specializacije. ([Datalab tržnica](https://www.datalab.si/dodatne-resitve/)) Primer tekstilnega podjetja kaže PANTHEON MF kot jedro, povezano z Arahne, RealTime, CRM in Shop Floor sistemom - koristen dokaz arhitekturnega vzorca, ne dokaz univerzalnega ROI. ([Datalab, tekstilna proizvodnja](https://www.datalab.si/blog/kako-je-pantheon-postal-nova-nit-tekstilne-proizvodnje/))

## 15.4 Matrika problem -> rešitev

| Problem | Potrebna zmožnost | PANTHEON | Partner/integracija | Proces/fizično |
|---|---|---|---|---|
| netočne kosovnice | governance BOM, odobritev | jedro podatkov | PLM pri ETO | lastnik in ECO proces |
| ročni DN | generiranje in status | MF | - | standard dela |
| naknadno poročanje | terminal/črtna koda | MT/WT | MES pri kompleksnosti | disciplina in ergonomija |
| strojni zastoji | dogodki/oprema | poslovni kontekst | OEE/MES/IoT | vzroki in ukrepi |
| neizvedljiv plan | omejitve in replan | osnovno/srednje | APS | pravila prioritet |
| širok odpoklic | lot genealogija | serije in dokumenti | QMS/MES pri globini | označevanje/test |
| neznana marža | actual cost | MF/finance | BI | zapiranje DN in normativi |
| reaktivne okvare | vzdrževalni nalogi | preveriti obseg | CMMS/EAM | preventivni program |

---

# 16. Konkurenčna krajina

| Rešitev | Tipični fit | Proizvodne prednosti | Glavni kompromis proti PANTHEON-u |
|---|---|---|---|
| Saop Proizvodnja (nekdanji MIT) | slovenska srednja/večja proizvodnja | lokalno znanje, proizvodna specializacija | zahteva podrobno primerjavo po use case in partnerju |
| Microsoft Business Central Premium | mednarodni MSP, Microsoft okolje | BOM, routings, work/machine centers, capacity, MRP, ekosistem | višji partnerski/projektni TCO, lokalizacija prek ekosistema |
| SAP Business One | mednarodni MSP | BOM, viri, DN, MRP, zaloge in finance | implementacijska kompleksnost in partner |
| Odoo | modularna, prilagodljiva podjetja | MRP, work orders, PLM, quality, maintenance v eni platformi | kakovost lokalizacije, partnerja in governance prilagoditev |
| Infor CloudSuite Industrial | kompleksnejša industrijska podjetja | globoka proizvodna/planerska usmeritev | višji obseg in TCO |
| Samostojni MES/APS/WMS/QMS | specifična operativna vrzel | globina posamezne domene | ne nadomesti poslovnega jedra in financ |

Microsoft dokumentira proizvodne naloge, BOM, routinge, strojne in delovne centre ter planiranje v Business Centralu; proizvodnja je del Premium licence. ([Microsoft](https://learn.microsoft.com/en-us/dynamics365/business-central/production-about-production-orders); [licenčni vodič](https://www.microsoft.com/content/dam/microsoft/final/en-us/microsoft-brand/documents/Dynamics-365-Licensing-Guide-APRIL-2025.pdf)) SAP Business One dokumentira BOM, vire, DN, materialne transakcije, stroške in MRP. ([SAP Learning](https://learning.sap.com/courses/managing-logistics-in-sap-business-one/running-the-production-process-in-sap-business-one)) Odoo javno navaja delovne naloge ter povezane aplikacije za PLM, kakovost in vzdrževanje. ([Odoo Manufacturing](https://www.odoo.com/app/manufacturing-features))

**Pravilen način primerjave:** ne uporabljamo generičnega seznama funkcij, temveč 10-20 reprezentativnih scenarijev z dejanskimi podatki, npr. sprememba BOM po lansiranju DN, manjkajoči lot pri porabi, kooperantska operacija, delna izdelava, povrat materiala, replan zaradi okvare in pokalkulacija z dodelavo.

---

# 17. Nakupno vedenje in uvedba

## 17.1 Nakupna skupina

- **Sprožilec:** direktor proizvodnje, CFO, IT ali lastnik.
- **Poslovni lastnik:** vodja proizvodnje/operacij.
- **Ekonomski kupec:** direktor/CFO.
- **Tehnični kupec:** IT ali zunanji partner.
- **Ključni uporabniki:** planer, tehnolog, skladišče, kakovost, finance.
- **Potencialni veto:** kakovost/regulativa, IT-varnost, skupina/matično podjetje, operaterji skozi neuporabo.

## 17.2 Nakupni sprožilci

1. rast in prerasel Excel;
2. nov obrat, linija ali lokacija;
3. nova velika stranka;
4. zahteva po sledljivosti/EDI/certifikatu;
5. audit ali večja reklamacija;
6. izguba ključnega planerja;
7. inventurne razlike ali odpis;
8. neuspešen dobavni rok in penali;
9. zamenjava zastarelega ERP-ja;
10. konsolidacija skupine;
11. potreba po realni lastni ceni;
12. obvezne digitalne izmenjave dokumentov.

## 17.3 Najpogostejši ugovori

| Ugovor | Kaj se skriva zadaj | Dober dokaz |
|---|---|---|
| »Naš proces je preveč poseben.« | strah pred izgubo prednosti ali prilagoditvijo | fit-gap na resničnem scenariju |
| »ERP že imamo.« | formalna prisotnost, nizka procesna uporaba | usage maturity po procesu |
| »Podatkov nimamo.« | strah pred izpostavitvijo kaosa | fazni plan master data |
| »Ljudje tega ne bodo uporabljali.« | pretekla slaba uvedba/UX | pilot na celici + meritve adoption |
| »Projekt bo predolg.« | nejasen obseg | faze, exit kriteriji, MVP tok |
| »ROI je marketinški.« | pretekle napihnjene obljube | preverljivi baseline, razponi, lastnik koristi |
| »Ne želimo ustaviti proizvodnje.« | operativno tveganje | cutover, dvojno preverjanje, fallback |

## 17.4 Dejavniki uspešne uvedbe

- imenovan izvršni sponzor in poslovni lastnik;
- merljiv baseline pred spremembo;
- jasen scope in ne-funkcionalne zahteve;
- urejeni lastniki artiklov, BOM, resursov, kupcev in dobaviteljev;
- pilot na reprezentativnem, ne najlažjem procesu;
- vključitev operaterjev v oblikovanje terminala;
- migracijske kontrole količine, vrednosti in genealogije;
- integracijski monitoring in lastnik napak;
- izobraževanje po vlogi in scenariju;
- stabilizacijsko obdobje z dnevnim upravljanjem;
- merjenje sprejetja: delež DN, porabe, dela in kakovosti, poročan sproti;
- pregled realiziranih koristi 30/60/90/180 dni.

---

# 18. ICP in lead scoring

## 18.1 Predlagani model 100 točk

| Dimenzija | Teža | Primer meril |
|---|---:|---|
| Procesna kompleksnost | 20 | BOM, operacije, serije, kooperanti, izmene |
| Bolečina in finančni učinek | 20 | zamude, izmet, nadure, zaloga, pokalkulacija |
| Digitalna vrzel | 15 | Excel/papir, naknadni vnosi, nepovezani sistemi |
| Sprožilec in nujnost | 15 | rast, audit, nova stranka, investicija, menjava ERP |
| Fit PANTHEON MF/MT | 15 | naročilo-DN-material-strošek, lokalna zakonodaja |
| Izvedljivost spremembe | 10 | sponzor, lastnik procesa, podatki, ekipa |
| Komercialna vrednost | 5 | uporabniki, lokacije, partnerji, dodatne rešitve |

### Negativne točke

- -20: korporativno obvezen drug ERP;
- -15: ni poslovnega lastnika;
- -15: pričakuje rešitev fizičnega ozkega grla brez procesne spremembe;
- -10: projekt je samo »zbiranje ponudb« brez potrjenega problema;
- -10: regulirana zahteva presega dokazljivo sposobnost rešitve in partnerja.

## 18.2 Zunanji signali za enrichment

- zaposlovanje planerja, tehnologa, ERP/MES/WMS specialista;
- nova proizvodna hala ali linija;
- certifikat ali nova regulirana stranka;
- objavljen razpis za digitalizacijo;
- rast zaposlenih/prihodkov ali prevzem;
- več lokacij in izvozni trgi;
- javna omemba ročnega dela, sledljivosti ali digitalne transformacije;
- obstoječi PANTHEON na zaposlitvenih oglasih;
- uvedba robotov/strojev brez omembe poslovne integracije;
- težave dobavnih rokov ali večja reklamacija v javnih virih.

---

# 19. Diagnostični vprašalnik

## 19.1 Jedrnih 22 vprašanj

1. Kaj proizvajate in kateri model prevladuje: MTS, ATO, MTO, ETO ali procesna/serijska proizvodnja?
2. Koliko je zaposlenih, neposredno proizvodnih zaposlenih, izmen, lokacij in ključnih strojev/celic?
3. Koliko prodajnih naročil, DN in dobav ste imeli v zadnjih 12 zaključenih mesecih?
4. Koliko aktivnih končnih izdelkov, polizdelkov in materialov imate?
5. Kakšna je tipična globina BOM in kako pogosto se spreminja?
6. Kolikšni so letni prihodki, materialni stroški in prispevna marža?
7. Kolikšna je povprečna zaloga materiala, WIP in končnih izdelkov?
8. Kateri sistemi podpirajo prodajo, plan, proizvodnjo, skladišče, kakovost, vzdrževanje in finance?
9. Katere od teh procesov dejansko izvajate v ERP-ju in katere v Excelu/papirju?
10. Kako sproti se poročajo material, delo, izmet, zastoj in prejem izdelka?
11. Kolikšen je OTIF in kako je definiran?
12. Koliko naročil je zamujenih in kateri trije vzroki predstavljajo največji delež?
13. Koliko ur planiranih in neplaniranih zastojev je bilo po vzroku?
14. Kolikšni so izmet, dodelave in reklamacije v količini, urah in evrih?
15. Koliko nadur, ekspresnih nabav/prevozov in penalov je povezanih z nestabilnostjo?
16. Kolikšna je točnost zaloge in koliko je odpisane/zastarele zaloge?
17. Kako dolgo traja sledljivostna vaja od vhodnega lota do kupcev in obratno?
18. Kolikšno je odstopanje predkalkulacije od pokalkulacije in kako hitro je rezultat znan?
19. Kako se planirajo vzdrževanje, menjave, orodja, odsotnosti in kooperanti?
20. Kaj bi podjetje naredilo s sproščeno kapaciteto?
21. Kakšen je predvideni obseg uvedbe, čas, uporabniki, integracije in notranje ure?
22. Za vsak ključni podatek: ali izhaja iz poročila, glavne knjige, meritve, ocene, razpona ali je neznan?

## 19.2 Triaža 17 področij

Za vsako področje ocenimo **frekvenco (0-4), vpliv (0-4), dokazljivost (0-3) in naslovljivost (0-3)**:

planiranje; material; kosovnice; DN in poročanje; menjave; stroji/zastoji; vzdrževanje; kakovost; sledljivost; nabava/dobavitelji; kooperanti; zaloge/WIP; skladišče; odprema/OTIF; lastna cena; finance/terjatve; podatki/integracije.

Samodejno izberemo tri največje priložnosti, vendar omogočimo strokovni override z razlogom.

## 19.3 Dinamična vprašanja področja

Vsak modul uporablja isti vzorec:

1. količina dogodkov;
2. čas ali strošek na dogodek;
3. delež problematičnih dogodkov;
4. tri vzroke in deleže;
5. neposredne finančne posledice;
6. kaj je bilo pozneje nadoknadeno;
7. vir in razpon podatka;
8. kaj bi se zgodilo po izboljšavi.

---

# 20. Voice of customer in sporočanje

| Kupec reče | Strokovna diagnoza | Boljši prodajni jezik |
|---|---|---|
| »Plan nam ne drži.« | nizka schedule adherence zaradi podatkov/omejitev | »Kolikokrat tedensko plan prepišete in zakaj?« |
| »Zalog imamo preveč.« | napačen mix, varnostne zaloge, slaba napoved | »Koliko kapitala je v artiklih brez porabe 90/180 dni?« |
| »Ne vemo, kje smo z naročilom.« | WIP in status DN nista sprotna | »Ali prodaja vidi realen status brez klica v halo?« |
| »Marža nam uhaja.« | actual cost in normativi zamujajo | »Kdaj po zaključku naročila poznate dejansko maržo?« |
| »Preveč je papirja.« | dvojni vnos in šibka dogodkovna sled | »Kolikokrat se isti podatek prepiše in kje nastane zamik?« |
| »Rabimo boljši ERP.« | nejasen cilj | »Katero poslovno odločitev danes sprejemate prepozno ali brez podatka?« |

Sporočanje naj se začne pri simptomu, ki ga kupec prepozna, in šele nato preide na sistem. Izraz »digitalna transformacija« je preširok; »iz naročila samodejno ustvariti DN, rezervirati material in isti dan videti dejansko porabo« je konkreten.

---

# 21. Regulativa, standardi in podatkovne posledice

| Okvir | Relevantni segmenti | Podatkovna/procesna posledica |
|---|---|---|
| ISO 9001 | skoraj vsi B2B proizvajalci | procesni pristop, dokumentirane informacije, neskladnosti, izboljševanje |
| IATF 16949 | avtomobilska veriga | kakovost dobaviteljev, sledljivost, spremembe, produktna varnost |
| ISO 13485 | medicinski pripomočki | sledljivost, validacija, tveganje in zapisi |
| EU GMP Annex 11 | farmacija | validacija, vloge, audit trail, integriteta, kontinuiteta |
| HACCP/GFL | živila | loti, en korak nazaj/naprej, umiki/odpoklici |
| ISO 14001 | okoljski vplivi | vidiki, cilji, evidence, izboljševanje |
| ISO 45001 | varnost in zdravje | usposobljenost, incidenti, tveganja |
| ISO 50001 | energijsko intenzivni | baseline, EnPI, merjenje in ukrepi |
| ISO 55001 | kapitalsko intenzivni | življenjski cikel in upravljanje sredstev |
| NIS2 | določeni kritični/pomembni subjekti | risk management, incidenti, dobavna veriga, kontinuiteta |
| ESPR/DPP | postopno širok nabor izdelkov | digitalni produktni potni list, podatki o komponentah in trajnosti |

Uredba EU 2024/1781 uvaja okvir digitalnega produktnega potnega lista za proizvode, komponente in materiale. To povečuje vrednost urejenih produktnih podatkov in povezave med PLM, ERP, proizvodnjo in dobavno verigo. ([EUR-Lex povzetek](https://eur-lex.europa.eu/EN/legal-content/summary/ecodesign-requirements-for-sustainable-products.html)) ENISA pri NIS2 poudarja na tveganju temelječe upravljanje kibernetske varnosti in dobavne verige. ([ENISA](https://www.enisa.europa.eu/topics/cybersecurity-of-critical-sectors))

---

# 22. Trendi 2026-2030

## 22.1 Pomanjkanje znanj in produktivnost

OECD opozarja na primanjkljaj digitalnih in poslovno-procesnih znanj; v letu 2022 je 40 % slovenskih podjetij poročalo o težavah pri iskanju ustreznih znanj. To povečuje potrebo po standardiziranih delovnih tokovih in zmanjšanju odvisnosti od posameznikov. ([OECD, pregled industrijske strategije](https://www.oecd.org/content/dam/oecd/en/publications/reports/2025/05/a-review-of-slovenia-s-industrial-strategy_5ff94e92/f10e4ef9-en.pdf))

## 22.2 AI

Najbližji uporabni primeri niso popolnoma avtonomne tovarne, ampak:

- razvrščanje in ekstrakcija dokumentov;
- napoved tveganja zamude ali pomanjkanja;
- priporočilo prioritet z razlago;
- zaznava odstopanja porabe, cikla ali kakovosti;
- iskanje po tehnični dokumentaciji;
- pomoč pri analizi vzrokov;
- napovedno vzdrževanje pri dovolj bogatih signalih.

AI ne popravi manjkajočega lastništva podatkov, nedefiniranih dogodkov ali neprimerljivih KPI-jev. EU je leta 2024 beležila uporabo AI v 13 % podjetij, leta 2025 pa 20 %, vendar je uporaba izrazito odvisna od velikosti in dejavnosti. ([Eurostat](https://ec.europa.eu/eurostat/web/interactive-publications/digitalisation-2025); [Digital Decade targets](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Towards_Digital_Decade_targets_for_Europe))

## 22.3 Digital thread in DPP

Povezava zahteve kupca, produktne revizije, BOM, lota, procesnega zapisa, kakovosti, dobave in poprodaje postaja strateška. DPP bo dodatno zahteval strukturirane podatke o materialu, trajnosti in skladnosti.

## 22.4 Cloud in sestavljive arhitekture

ERP se premika v oblak, operativne aplikacije pa ostajajo hibridne zaradi latence, strojev in kontinuitete. Ključ ni »cloud ali on-prem«, temveč jasen model odgovornosti, offline/continuity načrt, integracijski monitoring in izvozljivost podatkov.

## 22.5 Energija in odpornost

Merjenje energije po dobri enoti, kampanji ali stroju omogoča povezavo stroška, kapacitete in trajnosti. Odpornost dobavne verige zahteva vidnost kritičnih materialov, alternativ, rokov in posledic, ne samo višje varnostne zaloge.

---

# 23. Študije primerov in njihova pravilna interpretacija

## 23.1 Tekstilna proizvodnja

Datalabov javni primer opisuje nadgradnjo na PANTHEON MF ter integracijo štirih specializiranih sistemov: Arahne za tehnične podatke, RealTime za kakovost, CRM in Shop Floor. Delovne postaje uporabljajo računalnike/tablice in črtne kode, proizvodni nalog pa se ustvari iz naročila. Primer potrjuje **hibridni arhitekturni vzorec**, kjer ERP ni edini sistem. Ne vsebuje dovolj preverljivih podatkov za tipični finančni ROI. ([vir](https://www.datalab.si/blog/kako-je-pantheon-postal-nova-nit-tekstilne-proizvodnje/))

## 23.2 Impedanca

Javni opis iz leta 2026 izpostavlja povezavo nabave, skladišča in proizvodnje z ERP PANTHEON in rešitvami SmartBit. Uporaben je za dokaz integracijskega vzorca in procesnega toka; za poslovni primer je treba pridobiti baseline, čas uvedbe, stroške in merljive rezultate. ([vir](https://www.datalab.si/blog/enoten-digitalni-tok-od-nabave-do-proizvodnje-impedanca/))

## 23.3 Kako zapisati prihodnji primer

Vsak primer mora vsebovati:

1. segment, model, velikost, lokacije in izmene;
2. začetni proces in sistemsko arhitekturo;
3. baseline za 12 mesecev;
4. problem in vzročno drevo;
5. obseg rešitve in česa ni reševala;
6. stroške, notranje ure in čas uvedbe;
7. adoption po procesu;
8. rezultate z definicijo KPI;
9. kontrafaktual: kaj bi se zgodilo brez projekta;
10. omejitve in prenosljivost na druga podjetja.

---

# 24. Pretvorba raziskave v nadaljnje sisteme

## 24.1 Hitri ROI kalkulator

Vhod: 18-22 osnovnih vprašanj + triaža. Izhod: tri priložnosti, osnovna izguba, razpon koristi, ure/kapital/tveganje in CTA za validacijski workshop.

## 24.2 Napredni ROI audit

Vhod: izvozi iz ERP/glavne knjige, 12-mesečna zgodovina, meritve in intervjuji. Izhod: NPV, P10/P50/P90, sensitivity, podatkovne vrzeli, roadmap in lastniki koristi.

## 24.3 Priporočilni sistem

Pravila:

```text
segment + proizvodni model + kompleksnost + bolečina + naslovljivost
-> zahtevana zmožnost
-> procesni predpogoj
-> PANTHEON MF/MT/WT ali druga licenca
-> partner/integracija
-> dokazni scenarij za demo
```

## 24.4 AI agent za analizo podjetja

Agent potrebuje strukturirane entitete: podjetje, lokacija, proces, persona, sistem, bolečina, vzrok, KPI, finančni kanal, rešitev, dokaz, vir in zanesljivost. Vsaka trditev mora imeti datum in izvor; agent mora ločiti opazovanje, izračun in priporočilo.

## 24.5 Prodajni discovery

Discovery se začne z dogodkom in vplivom, ne s funkcijo:

- Kaj se je nazadnje zgodilo?
- Kolikokrat v 12 mesecih?
- Kako ste izmerili čas/strošek?
- Kateri trije vzroki?
- Kaj sistem danes ve in kdaj?
- Kdo sprejme odločitev in s katerim podatkom?
- Kaj bi se zgodilo s sproščeno kapaciteto?
- Kako bomo dokazali izboljšanje po 90 dneh?

---

# 25. Prednostni roadmap za Datalab

## 0-30 dni: podatkovna osnova

- standardizirati taksonomijo procesov, bolečin, KPI in finančnih kanalov;
- zbrati 10-20 potrjenih implementacijskih scenarijev MF/MT;
- potrditi licenčno in funkcionalno matriko z Datalab produktno ekipo;
- določiti definicije OTIF, izmeta, dodelave, zastoja in pokalkulacije;
- vzpostaviti register benchmarkov in prepoved neoznačenih marketinških številk.

## 31-90 dni: lead magnet in discovery

- zgraditi kratko triažo 17 področij;
- razviti tri dinamične poti za največje bolečine;
- uvesti scoring kakovosti podatkov;
- ustvariti demo scenarije po arhetipu;
- povezati rezultat z ustrezno licenco in partnerjem brez prekomernega pripisovanja.

## 91-180 dni: ROI in kalibracija

- zajeti dejanske pred/po meritve na implementacijah;
- ločiti potencial, realizirano korist in pripisljivost;
- kalibrirati dosegljiva zmanjšanja po segmentu in zrelosti;
- uvesti P10/P50/P90 in sensitivity;
- zgraditi poročilo za direktorja in tehnično prilogo za procesnega lastnika.

## 6-12 mesecev: operativni sistem znanja

- povezati CRM, enrichment, vprašalnik, ROI, demo in ponudbo;
- samodejno ustvarjati hipoteze, vendar zahtevati dokaz pred monetizacijo;
- vzpostaviti program realizacije koristi po uvedbi;
- uporabiti rezultate za produktni roadmap in partner enablement.

---

# Priloga A: Kontrolni seznam podatkov za ROI audit

## Osnovni imenovalci

- prihodki in prispevna marža;
- materialni stroški in kooperanti;
- neposredni in posredni zaposleni;
- redne, nadurne in razpoložljive ure;
- število naročil, DN, dobav, SKU-jev in lokacij;
- planirani proizvodni čas in ključne kapacitete;
- povprečna zaloga materiala, WIP in končnih izdelkov.

## Izgube

- zastoji po vzroku in stroju;
- izmet po materialu/izdelku/vzroku;
- dodelave v urah, materialu in stroju;
- reklamacije, vračila, garancije in penali;
- ekspresni prevozi in nujne nabave;
- nadure in zunanji izvajalci;
- odpisi ter zastarela zaloga;
- zamik odprema-račun in DSO.

## Kakovost podatkov

- čas nastanka in čas vnosa;
- popolnost ključnih polj;
- odstotek ročnih korekcij;
- število podvojenih šifer;
- uskladitev fizične in sistemske zaloge;
- delež DN, zaključenih v skladu s procesom.

---

# Priloga B: Demo scenariji za preverjanje fit-a

1. Prodajno naročilo ustvari večnivojske DN in materialne potrebe.
2. Material enega lota se porabi na več DN; iz končne serije vrnemo genealogijo nazaj.
3. Dobavitelj zamudi kritični material; plan pokaže prizadeta naročila.
4. Stroj odpove; nalogi se prerazporedijo na alternativo.
5. Po lansiranju se spremeni BOM; sistem jasno obravnava odprte naloge.
6. Kooperantska operacija izda material, spremlja lokacijo, vrne količino in poveže račun.
7. Operater na terminalu poroča začetek, dobro količino, izmet in razlog.
8. Delna količina se sprejme, preostanek ostane v WIP.
9. Material se vrne z DN in zaloga ostane pravilna.
10. Pokalkulacija primerja standardno in dejansko porabo, ure in kooperanta.
11. Reklamacija po seriji identificira vse prizadete materiale, DN in kupce.
12. Dashboard pokaže KPI z jasno definicijo in drill-downom do transakcije.

---

# Priloga C: Register ključnih virov

## Trg in ekonomija

- [SURS - poslovanje podjetij po dejavnostih 2024](https://www.stat.si/StatWeb/pr/news/Index/13704)
- [UMAR - Slovenian Economic Mirror 1/2026](https://www.umar.gov.si/en/publications/slovenian-economic-mirror/publication/slovenian-economic-mirror-1-2026)
- [Eurostat - Businesses in the manufacturing sector](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Businesses_in_the_manufacturing_sector)
- [OECD - Review of Slovenia's industrial strategy](https://www.oecd.org/content/dam/oecd/en/publications/reports/2025/05/a-review-of-slovenia-s-industrial-strategy_5ff94e92/f10e4ef9-en.pdf)
- [EIB Investment Survey 2025](https://www.eib.org/en/publications/20250216-econ-eibis-2025-eu)

## Digitalizacija

- [Slovenia 2025 Digital Decade Country Report](https://digital-strategy.ec.europa.eu/en/factpages/slovenia-2025-digital-decade-country-report)
- [Eurostat Digitalisation in Europe 2025](https://ec.europa.eu/eurostat/web/interactive-publications/digitalisation-2025)
- [NIST Smart Manufacturing standards landscape](https://nvlpubs.nist.gov/nistpubs/ir/2016/nist.ir.8107.pdf)

## Procesi, standardi in KPI

- [ISA-95](https://www.isa.org/standards-and-publications/isa-standards/isa-95-standard)
- [ISO 22400-1](https://www.iso.org/standard/56847.html)
- [ISO 22400-2](https://www.iso.org/standard/54497.html)
- [ISO 9000 family](https://www.iso.org/standards/popular/iso-9000-family)
- [ISO 55001](https://www.iso.org/standard/55089.html)
- [ISO 50001](https://www.iso.org/iso-50001-energy-management.html)
- [Lean Enterprise Institute - value-stream metrics](https://www.lean.org/lexicon-terms/value-stream-mapping/)

## Investicijska analiza

- [NIST AMS 200-5 - Investment Analysis Methods](https://nvlpubs.nist.gov/nistpubs/ams/NIST.AMS.200-5.pdf)
- [NIST SP 1214 - EDGeS and Monte Carlo](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.1214.pdf)

## Regulativa in skladnost

- [EU food traceability](https://food.ec.europa.eu/horizontal-topics/general-food-law/food-law-general-requirements_en)
- [EU GMP Annex 11](https://health.ec.europa.eu/system/files/2016-11/annex11_01-2011_en_0.pdf)
- [ESPR and Digital Product Passport](https://eur-lex.europa.eu/EN/legal-content/summary/ecodesign-requirements-for-sustainable-products.html)
- [ENISA - cybersecurity of critical sectors/NIS2](https://www.enisa.europa.eu/topics/cybersecurity-of-critical-sectors)
- [IATF Global Oversight](https://www.iatfglobaloversight.org/)

## PANTHEON

- [PANTHEON Manufacture](https://www.datalab.eu/pantheon/manufacture/)
- [PANTHEON MT](https://www.datalab.eu/pantheon/manufacture/managing-manufacturing-units/)
- [PANTHEON license rules](https://www.datalab.eu/pantheon-license-prices/)
- [PANTHEON additional solutions](https://www.datalab.si/dodatne-resitve/)
- [PANTHEON API](https://www.datalab.si/blog/pantheon-api-kaj-je-in-cemu-je-namenjen/)
- [PANTHEON UserSite](https://usersite.datalab.eu/Default.aspx)
- Priloženi dokument: `Datalab_kontekst.md`, verzija 1.0, 3. avgust 2026.

---

# Priloga D: Odprte raziskovalne vrzeli

1. Uradno število slovenskih proizvodnih podjetij po velikostnih razredih 20-49, 50-249 in 250-499 za zadnje leto.
2. Neodvisna ocena nameščene baze ERP/MES/APS/WMS po velikosti in segmentu v Sloveniji.
3. Potrjena funkcionalna matrika PANTHEON MF/MT/WT po licenci in verziji.
4. Dokazljive meje terminiranja: omejitve, alternativni resursi, setup matrike in optimizacija.
5. Tehnični obseg API-ja, dogodkov, avtentikacije, omejitev in monitoringa.
6. Validacijska primernost za regulirane panoge po namenu uporabe.
7. Dejanski implementacijski TCO po arhetipu in številu uporabnikov.
8. Pred/po KPI-ji vsaj 20 proizvodnih implementacij z enotnimi definicijami.
9. Adoption metrike MF/MT po 30, 90 in 180 dneh.
10. Deleži vzrokov za zamude, izmet in zaloge po segmentu.
11. Tipični nakupni cikli, win/loss razlogi in vpliv partnerja.
12. Neodvisna primerjava PANTHEON, Saop Proizvodnja, Business Central, SAP B1 in Odoo na istih scenarijih.

---

# Končno priporočilo

Največja vrednost te baze ni v dolžini seznama funkcij, temveč v normalizirani povezavi med **arhetipom podjetja, procesom, bolečino, dokazom, finančnim kanalom in naslovljivo rešitvijo**. Pri vseh nadaljnjih sistemih je treba ohraniti tri ločnice:

1. potencialna izguba ni enaka realizirani koristi;
2. realizirana korist ni nujno pripisljiva ERP-ju;
3. tehnična namestitev ni enaka sprejetju in poslovnemu rezultatu.

Če se te ločnice ohranijo, lahko raziskava služi kot trdna osnova za lead magnet, ki je dovolj preprost za obiskovalca, in hkrati kot strokovni poslovni primer, ki ga lahko preverijo direktor proizvodnje, CFO, tehnolog in implementacijski partner.
