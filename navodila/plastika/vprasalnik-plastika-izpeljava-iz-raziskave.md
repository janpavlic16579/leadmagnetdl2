# PREDELAVA PLASTIKE — vprašalnik in njegova izpeljava iz raziskave

> Dejavnost `plastika` (SKD C22.2: brizganje, ekstruzija, pihanje, termoformiranje), dodana 7. 9. 2026 po
> raziskavi `Datalab_raziskava_PLASTIKA_model.xlsx` (`Documents/Datalab/research/files`). Vir vprašanj so listi
> Katalog_bolecin, Vprasalnik, Kalkulator, Predpostavke, Procesi, Podprocesi, Bolecina_resitev, PANTHEON_zemljevid
> in Regulatorni_koledar. Koda: `src/config/modules/plastika.ts`, `contexts/plastika.ts`, `copy/plastika.ts`,
> vnos v `segments.ts`, `industries.ts`, `pantheonLogos.ts`, `content/{methodology,actions,sales}`.

Ključna ločnica ostaja ista kot pri ostalih dejavnostih: **9 področij se oceni v triaži, podrobna vprašanja
dobi obiskovalec samo za tista, ki jih obkljuka** (privzeto prva tri). Kdor bi obkljukal vseh devet, odgovori
na 63 vprašanj; tipična pot je okoli 32.

---

## 1. Zakaj svoj segment in ne splošna proizvodnja

Predelovalec plastike je proizvajalec, a splošni proizvodni vprašalnik ga vpraša po čakanju na plan, izmetu
materiala in papirnih delovnih nalogih. Njegova enota ni delovni nalog, ampak **serija na stroju** (raziskava,
list Predpostavke: »enota modela je proizvodna serija na stroju«). Štiri pojme, okoli katerih se vrti panoga —
izkoriščenost strojev, menjava orodja, poraba granulata proti normi in uredba PPWR — proizvodni vprašalnik
sploh ne vpraša. Osrednja teza raziskave (list Naslovnica): **odgovor »izkoriščenosti ne merimo« je sam po sebi
prodajni argument**, PPWR pa od 12. 8. 2026 zahteva dokumentacijo o sestavi embalaže.

Posebnost segmenta, ki jo mora poznati vsak, ki ureja formule: **operativna ura je strojna ura z operaterjem**
(stroj, operater, energija, amortizacija). Menjave, zastoji in čakanje na granulat so čas, ko stroj ne izdeluje;
ura operaterja sama bi ta strošek podcenila za polovico ali več. Človek-ure (javljanje, planiranje, odpoklici)
gredo po administrativni uri. Polja s strojnimi urami nosijo enoto `strojnih h/mesec`, ki je izrecno izvzeta iz
plauzibilnostne ovojnice zaposlenih (`src/lib/plausibility.ts`, `plausibility.test.ts`).

Opozorilo raziskave pred kampanjo: bazen je **najmanjši med petimi panogami** (34 podjetij, 9 v segmentu A z
mediano 77 zaposlenih in 9,7 mio EUR prihodkov). Hipoteza H03: devet podjetij upravičuje ročni, osebni pristop
namesto sekvence. Kampanjska povezava je `<objava>/plastika/`, prednastavitev `?s=plastika`.

---

## 2. Katalog bolečin → področja

Raziskava našteje 25 bolečin z oceno prednost = frekvenca + učinek + fit. Področja so zgrajena okoli najvišje
ocenjenih; spodaj, katera bolečina je kje in katera je namenoma izpuščena.

| Bolečina (ID, prednost) | Kje v vprašalniku | Kako se meri |
|---|---|---|
| B01 Izkoriščenost strojev se ne meri (15) | `stroji_plastika` (kontekst) + triaža | način merjenja kot prodajni signal; vrednosti v % namenoma ne vprašamo |
| B02 Menjava orodja ni ločena od izdelave (14) | `stroji_plastika` | menjav/teden × minute → strojne ure × strojna ura, meja 0,3 |
| B15 Ročno vnašanje proizvodnih podatkov (13), B16 ure brez naloga (12) | `stroji_plastika` | ure javljanja in prepisa × administrativna ura (Predpostavke A01–A03) |
| B03 Poraba granulata proti normi (15) | `granulat_plastika` (kontekst) | »ali primerjate z normo« — odstopanja ne vprašamo, kdor ne primerja, ga ne pozna |
| B04 Izmet zbirno, brez vzroka (14) | `granulat_plastika` | vrednost granulata × delež izmeta → neposredna izguba, meja 0,5; vzrok (data) |
| B05 Regranulat se ne vodi (12) | `granulat_plastika` (kontekst) | prodajni signal; zneska iz dvojnega štetja ni mogoče pošteno izpeljati |
| B19 Reklamacije brez serije (12), B12 sledljivost delna (12) | `granulat_plastika` + diagnostika | letni stroški reklamacij; sledljivost kot tveganje |
| B23 Planiranje na tabli (13) | `planiranje_plastika` | ure planiranja × administrativna ura + kontekst »kako planirate« |
| B10 Odpoklici v Excelu (13), B24 naročila po e-pošti (12) | `planiranje_plastika` | ure prepisa odpoklicev + kontekst kanala; doplačila zaradi zamud |
| B06 Orodje se ne šteje v ciklih (13) | `orodja_plastika` (kontekst + vzrok) | »kako spremljate cikle«; vzrok (data) |
| B07 Vzdrževanje reaktivno (12) | `orodja_plastika` | strojne ure zastojev × strojna ura + nenačrtovana popravila, meja 0,2 |
| B11 Energija po stroju ni znana (12) | `orodja_plastika` (kontekst) | prodajni signal (H10); meritev je podštevec, ne PANTHEON — brez zneska |
| B09 Zaloga granulata po tipih ni pregledna (13) | `zaloge_plastika` | odpisi in inventurne razlike; čakanje strojev na material; vezan kapital |
| B20 Nabava brez pregleda nad cenami (11) | `zaloge_plastika` (vzrok) | vzrok (external); rabatov ne merimo, ni vzvoda v produktu |
| B08 Kalkulacija brez dejanskega cikla (13) | diagnostika | »ali poznate strošek kosa iz izmerjenega cikla« — tveganje, brez zneska |
| B13 PPWR dokumentacija (13), B14 delež reciklata (12) | diagnostika (par PPWR) + kljukica trg EU | sledljivost do šarže in sestava po izdelku kot tveganje; kljukica je signal |
| B21 Znanje pri enem tehnologu (12), B28 arhiv tehnološke dokumentacije | diagnostika | procesna odpornost, brez zneska |
| B17 Sušenje nedokumentirano (10) | `granulat_plastika` (v besedilu vzroka) | del izmeta; ločenega zneska ni |
| B18 Ročna poročila (12) | `analitikaHz` | horizontala |
| B22 Nepovezani programi (11) | kontekst (sedanji sistem) | prodajni signal, ne znesek |
| B25 E-račun 2028 (13) | modul `E` | obstoječe opozorilo ZIERDED, samo uporabnikom PANTHEON |

Vrstni red področij je hkrati prioriteta ob izenačenju v triaži in sledi prednosti iz kataloga: stroji, granulat,
planiranje, orodja, zaloge.

### Pokritost lista Kalkulator (sedem vprašanj za lead magnet)

| # | Vprašanje iz raziskave | V vprašalniku |
|---|---|---|
| 1 | Koliko strojev imate? | `stroji_plastika.machineCount` (kontekst) |
| 2 | Letna vrednost porabljenega granulata | `granulat_plastika.annualGranulateSpendEUR` |
| 3 | Izkoriščenost strojev (% ali »ne merimo«) | `stroji_plastika.utilizationTracking` — samo način merjenja, glej §4 |
| 4 | Menjave orodij na teden in trajanje | `stroji_plastika.toolChangesPerWeek`, `avgToolChangeMinutes` |
| 5 | Delež izmeta | `granulat_plastika.scrapSharePercent` |
| 6 | Poraba na kos proti normi (da/ne) | `granulat_plastika.consumptionVsNorm` |
| 7 | Embalaža na trg EU (da/ne) | `diagnostika_plastika.packagingOnEuMarket` (kljukica) |

---

## 3. Potek po korakih

### Uvodni zaslon

> **Koliko vas letno stane sedanji način dela v predelavi plastike?**
> Menjave orodij, izmet granulata, okvare sredi serije in odpoklici v Excelu nimajo svoje vrstice v izkazu. Plačate jih skozi maržo, opazite pa šele ob letnem rezultatu.

Spustni seznam: … · Živilstvo (hrana in pijača) · **Predelava plastike** · … (za živilstvom, pod proizvodnjo).

### Korak 1 — Zaposleni

Skupno vprašanje (`SHARED_COPY`), v izračun ne vstopa.

### Korak 2 — Kontekst (`contexts/plastika.ts`)

- **Kaj pretežno izdelujete?** Tehnične dele po naročilu kupcev · Embalažo ali izdelke za trg EU · Lastne
  izdelke za trg · Orodja in serijsko predelavo hkrati · Kombinirano (raziskava, segmenta S5 in S6).
- **Kako danes vodite proizvodnjo?** PANTHEON MF in/ali MT · PANTHEON brez proizvodnega modula · Drug ERP ali MES
  · ERP za finance, proizvodnja v Excelu in na obratovalnih listih · Večinoma Excel, tabla in papir. Vrzeli
  sedanjega sistema so enake kot v proizvodnji; id-ji enaki, ključi v `pantheonFit.ts` so `plastika:<sistem>`.
- **Kakšna je vaša vloga?** Direktor · Vodja proizvodnje · Tehnolog ali vodja vzdrževanja · Vodja kakovosti ali
  skladnosti · Finance · Drugo (lasten vpis). Id-ja tehnologa in kakovosti se začneta z `vodja`, da ju ocena ICP
  ujame kot vodjo področja.

### Korak 3 — Triaža (9 področij)

Pet panožnih (stroji, granulat, planiranje, orodja, zaloge) in štiri horizontale (analitika, finance, kadri,
dokumenti). `servisHz` je izpuščen: reklamacije meri `granulat_plastika`, predelovalec servisa po predaji nima.
Privzeto obkljukana prva tri.

### Korak 4 — Skupna finančna osnova

Tri številke: **strojna ura z operaterjem** (pasovi do 25 / 25–35 / 35–50 / nad 50 EUR, povprečje panoge 30 EUR
iz Predpostavk A04; lasten explainer z izpeljavo operater + elektrika + amortizacija), administrativna ura (skupni
pasovi, 26 EUR) in letni prihodek (samo za velikost podjetja v prodajni pripravi — pomožno besedilo to pove).
Marže ni: noben modul je ne uporablja.

### Korak 5 — Vnosi po izbranih področjih

**Stroji** (6 polj): število strojev (kontekst) · način merjenja izkoriščenosti (kontekst) · menjav/teden ·
minut na menjavo (help: od zadnjega dobrega kosa do prvega dobrega; okvara sredi serije → Orodja) · ure ročnega
javljanja (help: evidence za plačo → Kadri, poročila → Analitika, odpoklici → Planiranje) · glavni vzrok.
Izida: *Menjave orodij (strojne ure)* — kapaciteta po strojni uri, meja 0,3; *Ročno javljanje in prepisovanje
proizvodnih podatkov* — kapaciteta po administrativni uri.

**Granulat** (6 polj): letna vrednost granulata, barvil in aditivov (ne vem) · delež izmeta (help: regranulat, ki
se vrne v proces, ne šteje; odpisi zaloge → Zaloge) · primerjava porabe z normo (kontekst) · vodenje regranulata
(kontekst) · letni stroški reklamacij zaradi kakovosti (ne vem; help: doplačila zaradi rokov → Planiranje) ·
glavni vzrok. Izida: *Izmet in odpadni material* (meja 0,5), *Reklamacije kupcev zaradi kakovosti*.

**Planiranje** (6 polj): način planiranja (kontekst) · kanal odpoklicev (kontekst) · ure planiranja (help:
javljanje proizvodnje → Stroji) · ure prepisa odpoklicev (help: potrjevanje računov → Dokumentacija) · ekspresni
prevozi, penali in popusti zaradi zamud (ne vem; help: reklamacije zaradi kakovosti → Granulat, nadure sem ne
sodijo) · glavni vzrok. Izidi: dve kapaciteti po administrativni uri, ena neposredna izguba.

**Orodja** (6 polj): okvar na mesec (kontekst) · strojne ure nenačrtovanih zastojev (help: menjave → Stroji,
čakanje na material → Zaloge) · letni stroški nenačrtovanih popravil (ne vem) · spremljanje ciklov (kontekst) ·
merjenje energije po stroju (kontekst) · glavni vzrok. Izida: *Nenačrtovani zastoji strojev (strojne ure)* in
*Nenačrtovana popravila in nadomestni deli*, oba z mejo 0,2.

**Zaloge** (6 polj): povprečna vrednost zalog · odpisi zaloge in inventurne razlike (ne vem; help: izmet →
Granulat) · strojne ure čakanja na material (help: okvare → Orodja, menjave → Stroji) · delež zaloge, ki bi ga
lahko zmanjšali · pregled nad zalogo po tipih, barvah in šaržah (kontekst) · glavni vzrok. Izidi: neposredna
izguba, kapaciteta po strojni uri, enkraten sprostljiv kapital.

### Zadnja stran — diagnostika in modul E

Šest vprašanj z lestvico »Da, zanesljivo … Nismo preverili« v treh parih → tri ocene tveganja brez evrov:
*Zanesljivost podatkov* (sprotno evidentiranje po nalogu; strošek kosa iz izmerjenega cikla), *Sledljivost in
dokazovanje sestave (PPWR)* (serija ↔ šarža granulata, stroj, orodje; sestava in delež reciklata po izdelku),
*Procesna odpornost* (proizvodnja brez tehnologa; nastavitve in tehnološki listi zapisani in verzionirani). Plus
kljukica *Dajemo embalažo ali embalirane izdelke na trg EU* — prodajni signal, ker pogojnega prikaza motor ne
pozna. Modul E se pokaže samo uporabnikom PANTHEON.

---

## 4. Kaj je namenoma drugače kot v splošni proizvodnji in kaj je izpuščeno

- **Strojna ura namesto ure operaterja** (glej §1). Posledica v CRM izvozu: stolpec `operationalHourCostEUR` pri tej
  dejavnosti pomeni strojno uro (komentar v `src/lib/exportRecord.ts`).
- **Izkoriščenost strojev v odstotkih se ne vprašamo.** Kdor ne meri, bi vpisal 0 ali oceno, in oboje bi izgledalo kot
  podatek; način merjenja je po hipotezi H01 močnejši kvalifikacijski filter kot številka.
- **Energija ostane brez zneska.** Meritev po stroju je podštevec, PANTHEON je ne dostavi (fit 3 v katalogu);
  vprašanje ostane kot signal (H10), znesek bi bil obljuba, ki je produkt ne izpolni.
- **PPWR je tveganje in signal, ne evri.** Raziskava (Predpostavke A18–A19) tveganje modelira kot pričakovano izgubo ×
  znižanje; brez verjetnosti in posledice za konkretno podjetje bi bila to izmišljena številka (NAVODILA §5.4).
- **Regranulat samo kot kontekst.** Bolečina B05 je »dvojno štetje ali izguba vrednosti« — zneska iz tega ni mogoče
  pošteno izpeljati.
- **Marža ni vprašana.** Noben modul je ne uporablja; vprašanje brez učinka bi vprašalnik samo podaljšalo (NAVODILA §7).
- **Diagnostika ima tri pare namesto dveh**, ker je PPWR osrednja regulatorna tema panoge in zahteva sledljivost do
  šarže granulata — natanko to, česar podjetja brez sistema nimajo.
- **Nadure zaradi zamud niso v neposredni izgubi**: v proizvodnji so nadure kapaciteta; tu jih ne vprašamo posebej, da
  se ista ura ne šteje v dveh koših.

---

## 5. Kaj PANTHEON naslavlja in česa ne obljubljamo

Iz lista PANTHEON_zemljevid: proizvodnja in delovni nalogi, kosovnice in normativi (poraba granulata na kos),
serijske številke in šarže, več skladišč in lokacij, obračun serije. Odprta vprašanja iz istega lista, ki jih
prodajna priprava izrecno ne obljublja (`content/sales/licences.ts`): **zajem signala s strojev je treba rešiti
posebej**, obravnava regranulata v recepturi in vključitev energije v strošek kosa. Alineje »PANTHEON naslavlja«
zato govorijo o terminalih MT, ločeni operaciji menjave, javljanju izmeta z vzrokom, šaržah granulata in števcih
ciklov — ne o krmilnikih in podštevcih.

---

## 6. Izvor številk in odprte kalibracije

| Številka | Vrednost | Vir | Status |
|---|---|---|---|
| Strojna ura z operaterjem, pasovi | 17–25 / 25–35 / 35–50 / 50–70 EUR, povprečje 30 | Predpostavke A04 (26/30/35), plača operaterja SURS 18–22 EUR (`docs/urne-postavke.md`) + energija + amortizacija | KALIBRACIJA po prvih ~50 vnosih |
| Administrativna ura | skupni pasovi, 26 EUR | `contexts/shared.ts` | skupno |
| Meja naslovljivosti — menjave | 0,3 | sistem naslovi število menjav (zaporedje) in pripravo, ne montaže; raziskava čas menjave šele meri (vrzel G11) | KALIBRACIJA, time study |
| Meja naslovljivosti — izmet | 0,5 | Predpostavke A16–A17 (realizacija 40–80 %); isti razlog kot v proizvodnji | sidrano |
| Meja naslovljivosti — zastoji in popravila | 0,2 | `docs/naslovljivost-raziskava-2026-08.md` (CMMS −10…−20 %) | sidrano |
| Prag visoke izgube | 20.000 EUR | podjetja večja od povprečne proizvodnje (mediana 77 zaposlenih, 9,7 mio EUR) | KALIBRACIJA |
| Deleži sprostljive zaloge | skupni (`REDUCIBLE_SHARES`) | Aberdeen prek `modules/shared.ts` | skupno |
| Prihodkovni pasovi | kot proizvodnja | mediana segmenta A 9,7 mio EUR v pasu 5–15 | skupno |

Raziskovalne vrzeli, ki jih bo zaprla šele empirija (list Raziskovalne_vrzeli): G08 delež podjetij, ki meri
izkoriščenost (n ≥ 25), G09 izvedljivost zajema signala s strojev po proizvajalcih, G11 dejanski čas menjave
orodja (5 podjetij, 20 menjav), G10 pripravljenost na PPWR. Ko bodo na voljo, je treba popraviti meje 0,3 in
povprečje strojne ure — na enem mestu, v `modules/plastika.ts` in `contexts/plastika.ts`.
