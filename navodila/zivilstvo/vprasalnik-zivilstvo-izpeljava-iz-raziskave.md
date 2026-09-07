# ŽIVILSTVO — vprašalnik in njegova izpeljava iz raziskave

> Dejavnost `zivilstvo` (SKD C10 živila, C11 pijače), dodana 7. 9. 2026 po raziskavi
> `Datalab_raziskava_ZIVILSKA_INDUSTRIJA_model.xlsx` (research/files). Vir vprašanj so listi
> Katalog_bolecin, Vprasalnik, Kalkulator, Procesi, Podprocesi, Bolecina_resitev in PANTHEON_zemljevid.
> Koda: `src/config/modules/zivilstvo.ts`, `contexts/zivilstvo.ts`, `copy/zivilstvo.ts`, vnos v
> `segments.ts`, `industries.ts`, `pantheonLogos.ts`, `content/{methodology,actions,sales}`.

Ključna ločnica ostaja ista kot pri ostalih dejavnostih: **9 področij se oceni v triaži, podrobna vprašanja
dobi obiskovalec samo za tista, ki jih obkljuka** (privzeto prva tri). Kdor bi obkljukal vseh devet, odgovori
na 57 vprašanj; tipična pot je okoli 30.

---

## 1. Zakaj svoj segment in ne splošna proizvodnja

Mesar, mlekar in pek so proizvajalci, a splošni proizvodni vprašalnik jih vpraša po izmetu, delovnih nalogih
in čakanju na plan. Raziskava (osrednja teza, list Naslovnica) pravi: **vstopna točka je sledljivost in
odpoklic, ne prihranek administracije.** Tri pojme, okoli katerih se vrti panoga — donos šarže, rok
uporabnosti, sledljivost — proizvodni vprašalnik sploh ne vpraša. Zato lasten segment z lastnimi petimi
področji, lastnim kontekstom in lastnim nagovorom; horizontale (analitika, finance, kadri, dokumenti) so
skupne, `servisHz` je izpuščen (živilo garancijskega servisa nima, reklamacije meri panožni modul).

Opozorilo raziskave pred kampanjo, ki ga vprašalnik ne more rešiti: **obstoječi seznam za panogo ni
uporaben** (od 73 vrstic 60 izločenih, v segmentu A ostane 7 podjetij). Pred kampanjo je treba zgraditi nov
seznam po SKD C10 in C11 z mejo 20 zaposlenih (vrzel G08). Kampanjska povezava za novo dejavnost je
`<objava>/zivilstvo/`, prednastavitev `?s=zivilstvo`.

---

## 2. Katalog bolečin → področja

Raziskava našteje 25 bolečin z oceno prednost = frekvenca + učinek + fit. Področja so zgrajena okoli
najvišje ocenjenih; spodaj, katera bolečina je kje in katera je namenoma izpuščena.

| Bolečina (ID, prednost) | Kje v vprašalniku | Kako se meri |
|---|---|---|
| B02 Razlika teoretični/dejanski donos (15) | `donos_zivilstvo` | vrednost surovin × delež odstopanja → neposredna izguba, meja 0,6 |
| B07 Kalo se ne meri po fazah (13) | `donos_zivilstvo` | isti znesek; faze so vzrok, ne ločena postavka |
| B14 Receptura v več verzijah (13) | `donos_zivilstvo` | glavni vzrok (data) + kontekstno vprašanje »kje so recepture« |
| B09 Kalkulacija brez donosa (13) | `donos_zivilstvo` + diagnostika | glavni vzrok (planning); diagnostično vprašanje o lastni ceni |
| B03 Odpisi zaradi roka (14) | `roki_zivilstvo` | letni odpisi → neposredna izguba |
| B08 Zaloge s kratkim rokom niso vidne (14) | `roki_zivilstvo` | glavni vzrok (data) + kontekstno vprašanje FEFO |
| B13 Inventurne razlike (12) | `roki_zivilstvo` | letni manko → neposredna izguba, ločeno od odpisov |
| B21 Planiranje glede na rok surovin (13) | `roki_zivilstvo` (vzrok) + `narocila_zivilstvo` (ure) | vzrok pri odpisih; ure planiranja pri naročilih |
| B01 Sledljivost ob odpoklicu ročna (13) | `sledljivost_zivilstvo` + triaža + diagnostika | ure sestavljanja sledljivosti; strošek odpoklica z mejo 0,5 |
| B12 Reklamacije brez šarže (12) | `sledljivost_zivilstvo` | ure reševanja + dobropisi in uničenje |
| B04 HACCP na papirju (13) | `kakovost_zivilstvo` | ure evidenc po proizvodni uri, meja 0,5 (zapis ostane obvezen) |
| B05 Priprava na presojo (12) | `kakovost_zivilstvo` | ure na leto po administrativni uri |
| B06 Deklaracije in alergeni ročno (13) | `kakovost_zivilstvo` | ure posodabljanja + stroški napačnih etiket |
| B10 Temperaturni zapisi ločeni (11), B23 laboratorij (10) | `kakovost_zivilstvo` (v besedilu) | del HACCP ur; ločenega zneska ni, PANTHEON tega ne zajema |
| B15 Naročila po e-pošti in telefonu (12) | `narocila_zivilstvo` | ure vnosa + kontekstno vprašanje o kanalu |
| B20 Nabava brez pregleda (11) | `narocila_zivilstvo` (delno) | ekspresne nabave; rabatov ne merimo (ni vzvoda v produktu) |
| B17 Znanje pri eni osebi (12) | diagnostika + vzrok (people) | procesna odpornost, brez zneska |
| B18 Ročna poročila za vodstvo in trgovce (12) | `analitikaHz` | horizontala |
| B22 Nepovezani programi (11), B24 ure brez šarže (11) | kontekst (sedanji sistem), `kadriHz` | prodajni signal, ne znesek |
| B25 E-račun 2028 (13) | modul `E` | obstoječe opozorilo ZIERDED, samo uporabnikom PANTHEON |
| B19 PPWR embalažna dokumentacija (12) | **ni merjeno** | tveganje skladnosti brez zanesljivega zneska; PANTHEON ga ne naslavlja; ostane tema za prodajni pogovor |
| B11 Javna naročila (10) | **ni merjeno** | ozek krog podjetij, ure bi se štele z dokumentiHz |
| B16 Odprema in hladna veriga (11) | **ni merjeno** | temperaturni zapisi vozil so zunanji sistem |

Vrstni red področij je hkrati prioriteta ob izenačenju v triaži in sledi prednosti iz kataloga: donos, roki,
sledljivost, kakovost, naročila.

---

## 3. Potek po korakih

### Uvodni zaslon

> **Koliko vas letno stanejo kalo, potekli roki in ročna sledljivost?**
> Razlika med recepturo in dejanskim donosom, odpisi zaradi roka, HACCP mape in odpoklic, ki ga sestavljate iz papirjev — nič od tega nima svoje vrstice v izkazu. Plačate skozi maržo.

Spustni seznam: … · **Živilstvo (hrana in pijača)** · … (takoj za Proizvodnjo).

### Korak 1 — Zaposleni

Skupno vprašanje (`SHARED_COPY`), v izračun ne vstopa.

### Korak 2 — Kontekst (`contexts/zivilstvo.ts`)

> **Nekaj o vaši živilski proizvodnji**

**Kaj pretežno proizvajate?** Mesni izdelki · Mlečni izdelki · Pekarski in slaščičarski izdelki · Pijače ·
Predelava sadja, zelenjave in drugih surovin · Več skupin izdelkov
→ Skupina izdelkov namesto načina proizvodnje: raziskava (segment S5 »Specialist«) ugotavlja, da imajo vertikale
posebna pravila in funkcionalne vrzeli; prodajniku pove, o čem bo tekel pogovor.

**Kako danes vodite proizvodnjo in sledljivost šarž?** ← prodajni signal (vrzel sistema), v izračun ne vstopa

| Odgovor | Vrzel | PANTHEON? | Ključ za `pantheonFit.ts` |
|---|---|---|---|
| PANTHEON s proizvodnim modulom in šaržami | 8–20 % | da | `zivilstvo:pantheonMfSarze` |
| PANTHEON brez proizvodnega modula | 15–30 % | da | `zivilstvo:pantheonNoMf` |
| Drug ERP ali namenski program za živilsko proizvodnjo | 15–30 % | ne | `zivilstvo:otherErp` |
| Kombinacija ERP-ja, Excela in papirnih evidenc | 25–40 % | ne | `zivilstvo:erpExcelPaper` |
| Večinoma Excel, papir in HACCP mape | 25–40 % | ne | `zivilstvo:excelPaper` |

**Kakšna je vaša vloga?** Direktor/-ica · Vodja proizvodnje · **Vodja kakovosti ali tehnolog** · Finance ali
računovodstvo · Nabava ali skladišče · Drugo (lasten vpis)
→ Vodja kakovosti je lastna vloga zaradi hipoteze H02 (boljši prvi stik kot direktor). V oceni ICP se ujame po
predponi `vodja` (0,60).

### Korak 3 — Triaža (9 področij)

> **Kje v živilski proizvodnji vas najbolj tišči?**

| # | Področje | Triažno vprašanje |
|---|---|---|
| 1 | Donos, kalo in recepture | Kako pogosto je dejanski izhod šarže občutno manjši od tistega po recepturi? |
| 2 | Roki uporabnosti, zaloge in odpisi | Kako pogosto odpisujete surovine ali izdelke zaradi poteka roka uporabnosti? |
| 3 | Sledljivost šarž, reklamacije in odpoklic | Kako hitro bi ob reklamaciji ali odpoklicu ugotovili, katere surovine so šle v šaržo in kateri kupci so jo prejeli? |
| 4 | HACCP evidence, deklaracije in presoje | Koliko ročnega dela zahtevajo HACCP evidence, priprava na presoje in deklaracije? |
| 5 | Naročila kupcev, planiranje in nujne dobave | Kako pogosto naročila kupcev in plan proizvodnje usklajujete ročno ali rešujete nujno? |
| 6–9 | Analitika · Finance · Kadri · Dokumentacija | horizontale, skupne vsem dejavnostim |

Privzeto obkljukana prva tri. Triažno vprašanje pri sledljivosti je prepis vprašanja Q02 iz raziskave
(»Kako dolgo bi trajalo, da ob odpoklicu ugotovite, kateri kupci so prejeli določeno šaržo?«) — po
hipotezi H01 najmočnejši prodajni sprožilec v panogi.

### Korak 4 — Skupna finančna osnova

Tri številke: **polni strošek proizvodne ure** (operater, mesar, pek, pakirec; pasovi do 17 / 17–19 / 19–23 /
nad 23 EUR, povprečje 18), **administrativne ure** (tehnolog, vodja kakovosti, planer; skupni pasovi, 26) in
**letni prihodek** (do 2 / 2–5 / 5–15 / nad 15 mio EUR). Marže ni: noben živilski modul je ne uporablja.

Urna postavka je **posredno sidro** (SURS oddelkov C10/C11 ne izkazuje ločeno; proizvodni pasovi zamaknjeni za
en pas navzdol) — KALIBRACIJA po prvih ~50 vnosih.

### Korak 5 — Vnosi po izbranih področjih

**1. Donos, kalo in recepture** (`donos_zivilstvo`)
- Letna vrednost porabljenih surovin in embalaže (EUR/leto, »ne vem«) — raziskava A15
- Delež surovine, izgubljen kot razlika med teoretičnim in dejanskim donosom (%, 0–20) — raziskava A16, Kalkulator Q3
- Ure ročnega beleženja porabe in izhoda šarž s prepisom (h/mesec)
- Ure ponovne predelave, prebiranja, prepakiranja (h/mesec)
- Kje so recepture in kdo jih spreminja (kontekst) — Q13
- Glavni vzrok: recepture niso ažurne · poraba se ne beleži sproti · kalkulacija brez donosa · napake pri tehtanju/menjave ljudi · nihanje surovine/oprema

**2. Roki uporabnosti, zaloge in odpisi** (`roki_zivilstvo`)
- Povprečna vrednost zalog surovin, embalaže in izdelkov (EUR)
- Odpisi in razprodaje pod ceno zaradi roka v 12 mesecih (EUR/leto, »ne vem«) — Q03
- Inventurne razlike v skladiščih in hladilnicah (EUR/leto, »ne vem«) — Q16
- Delež zalog, ki bi ga lahko trajno zmanjšali (skupni pasovi)
- Kako izdajate zalogo glede na rok — FEFO (kontekst) — Q15
- Glavni vzrok: kratki roki niso vidni · naročanje ni vezano na plan · izdaja ne po FEFO · nihanje naročil verig · varovalka

**3. Sledljivost šarž, reklamacije in odpoklic** (`sledljivost_zivilstvo`)
- Ure ročnega sestavljanja sledljivosti (h/mesec)
- Ure reševanja reklamacij in iskanja vzroka (h/mesec)
- Neposredni stroški reklamacij: dobropisi, vračila, uničenje (EUR/leto, »ne vem«)
- Stroški odpoklicev ali umikov v 12 mesecih (EUR/leto, »ne vem«) — Q04; brez dogodka 0
- Kako pogosto izvedete vajo odpoklica (kontekst) — Q12, podproces P21.1
- Glavni vzrok: šarža dobavitelja se ne zabeleži · šarža ni na dobavnici · ločene evidence · reklamacije brez postopka · dobavitelji

**4. HACCP evidence, deklaracije in presoje** (`kakovost_zivilstvo`)
- Ure ročnih HACCP in temperaturnih evidenc s prepisom (h/mesec) — Q09, Kalkulator Q5
- Ure priprave na presoje in inšpekcije (h/leto) — Q10
- Ure posodabljanja deklaracij in alergenov (h/mesec) — Q14
- Stroški napačnih deklaracij in etiket (EUR/leto, »ne vem«)
- Kje vodite HACCP evidence (kontekst)
- Glavni vzrok: evidence na papirju · recepture, deklaracije in šifranti nepovezani · dokazila niso na enem mestu · zahteve trgovcev · premalo ljudi/znanje pri eni osebi

**5. Naročila kupcev, planiranje in nujne dobave** (`narocila_zivilstvo`)
- Ure ročnega vnosa naročil iz e-pošte, telefona in portalov verig (h/mesec) — Q20
- Ure planiranja proizvodnje in naročanja surovin (h/mesec) — Q18
- Doplačila za ekspresne nabave in nujne dostave (EUR/leto, »ne vem«)
- Penali, odbitki in dobropisi trgovcem zaradi nedobave (EUR/leto, »ne vem«)
- Kako prihajajo naročila (kontekst)
- Glavni vzrok: naročila prepisujemo · plan ni povezan z naročili in zalogami · roki in kapacitete niso vidni · verige spreminjajo naročila · okvare opreme

### Zadnja stran — diagnostika in modul E

Štiri vprašanja brez zneska (lestvica Da, zanesljivo / Večinoma / Le približno / Ne / Nismo preverili):

1. Ali sproti evidentirate porabo surovin in izhod vsake šarže? — Q06/Q07
2. Ali poznate dejanski strošek in donos posameznega izdelka? — Q08
3. Ali lahko v eni uri za katero koli šaržo ugotovite dobavitelje surovin in kupce, ki so jo prejeli? — H01, KPI K01 (cilj pod 1 h)
4. Ali proizvodnja in kakovost delujeta normalno tudi brez tehnologa ali vodje kakovosti? — Q05

Par 1–2 → zanesljivost podatkov, par 3–4 → procesna odpornost. Modul E (SQL Server, Windows Server, ZIERDED)
kot pri vseh dejavnostih samo uporabnikom PANTHEON.

---

## 4. Kaj je namenoma drugače kot v splošni proizvodnji

| Proizvodnja | Živilstvo | Zakaj |
|---|---|---|
| izmet materiala (meja 0,5) | odstopanje donosa in kalo (meja 0,6) | receptura že upošteva tehnološki kalo; meri se samo odstopanje nad njim (A16/A17) |
| odpisi zaradi zastaranja | odpisi zaradi roka + inventurne razlike ločeno | dva različna odliva z različnima vzrokoma (B03, B13) |
| reklamacije v modulu material | reklamacije + odpoklic v lastnem področju, odpoklic z mejo 0,5 | sledljivost odpoklic omeji, ne prepreči (A19: 10–45 %) |
| ni HACCP, deklaracij, presoj | lastno področje, HACCP ure z mejo 0,5 | zapis ostane obvezen tudi elektronsko (852/2004); elektronske evidence so zunanji sistem |
| plan/kapacitete + roki in penali | naročila verig + planiranje + penali za nedobavo v enem področju | trgovske verige nedobavo zaračunajo; vnos naročil je po raziskavi B15 |
| vpraša maržo | marže ne vpraša | noben modul je ne uporablja |
| servisHz vključen | servisHz izpuščen | živilo nima garancijskega servisa; reklamacije meri panožni modul |

---

## 5. Kaj PANTHEON naslavlja in česa ne obljubljamo

Iz lista PANTHEON_zemljevid: serijske številke in šarže (A), proizvodnja in recepture (A), roki uporabnosti in
FEFO (A, »podpora FEFO je treba potrditi«), več skladišč in hladilnic (A), eRačun, BI. Odprta vprašanja iz
raziskave, ki jih mora potrditi svetovalec: obravnava variabilnega donosa, hitrost poizvedbe sledljivosti,
FEFO.

**Ne obljubljamo**: elektronskih HACCP evidenc, samodejnega zajema temperatur, laboratorijskega sistema, PPWR
dokumentacije. Vse to je v raziskavi označeno kot zunanji sistem ali odprto vprašanje; v kodi je to vidno kot
meja naslovljivosti pri HACCP urah, kot opomba v `content/sales/licences.ts` in kot odsotnost teh postavk v
alinejah »PANTHEON naslavlja«.

---

## 6. Odprte kalibracije

- Urna postavka proizvodne ure: posredno sidro, preveriti po ~50 vnosih (`contexts/zivilstvo.ts`).
- Meje naslovljivosti 0,6 (kalo), 0,5 (odpoklic), 0,5 (HACCP): izpeljane iz razponov raziskave (A16/A17, A19),
  ne iz slovenske empirije — vrzeli G02 in G09 iz raziskave (time study in test izsleditve pri pilotih).
- Prag visoke izgube 15.000 EUR: prevzet od proizvodnje.
- Delež zalog za sprostitev: skupni pasovi (Aberdeen), brez živilske kalibracije.
- Hipoteze H01 (sledljivost kot sprožilec), H02 (vodja kakovosti kot prvi stik) in H08 (vaja odpoklica na
  sestanku) vprašalnik podpira, ne potrjuje — potrdi jih kampanja.
