# KOVINARSTVO — vprašalnik in njegova izpeljava iz raziskave

> Dejavnost `kovinarstvo` (kovinskopredelovalna in strojna industrija, SKD C25 kovinski izdelki in C28
> stroji in naprave), dodana 7. 9. 2026 po raziskavi `Datalab_raziskava_KOVINSKA_INDUSTRIJA_model.xlsx`
> (research/files). Vir vprašanj so listi Katalog_bolecin, Vprasalnik, Kalkulator, Procesi, Podprocesi,
> Bolecina_resitev, Predpogoji_funkcij, KPI_slovar, Segmenti, Arhetipi in PANTHEON_zemljevid.
> Koda: `src/config/modules/kovinarstvo.ts`, `contexts/kovinarstvo.ts`, `copy/kovinarstvo.ts`, vnos v
> `segments.ts`, `industries.ts`, `pantheonLogos.ts`, `content/{methodology,actions,sales}`.

Ključna ločnica ostaja ista kot pri ostalih dejavnostih: **10 področij se oceni v triaži, podrobna vprašanja
dobi obiskovalec samo za tista, ki jih obkljuka** (privzeto prva tri). Kdor bi obkljukal vseh deset, odgovori
na 63 vprašanj; tipična pot je okoli 30.

---

## 1. Zakaj svoj segment in ne splošna proizvodnja

Kovinar je praviloma podizvajalec izvozne verige brez cenovne moči (74 % prihodkov panoge na tujih trgih,
list Trzni_benchmarki). Raziskava (osrednja teza, list Naslovnica) pravi: **če cene ne more dvigniti, mu
ostane samo notranja učinkovitost — prodajni argument ni prihranek administracije, ampak dejanski strošek
delovnega naloga.** Delovna hipoteza raziskave je, da dejanski strošek naloga pozna manj kot 30 % podjetij
(vrzel G08).

Splošni proizvodni vprašalnik ne vpraša po petih stvareh, ki panogo določajo: odstopanju porabe od normativa,
kooperaciji (zunanje operacije), certifikatih 3.1 in šaržah, nalogih, prodanih pod lastno ceno, in nemerjenih
nastavitvenih časih. Zato lasten segment s šestimi področji, lastnim kontekstom in lastnim nagovorom;
horizontale (analitika, finance, kadri, dokumenti) so skupne, `servisHz` je izpuščen (podizvajalec garancijskega
servisa praviloma nima, reklamacije kupcev meri panožni modul Sledljivost).

Kampanjska povezava za novo dejavnost je `<objava>/kovinarstvo/`, prednastavitev `?s=kovinarstvo`. Seznam za
panogo je največji med raziskanimi (174 podjetij, segment A 38 podjetij z mediano 39 zaposlenih in 6,3 mio EUR
prihodkov).

---

## 2. Katalog bolečin → področja

Raziskava našteje 25 bolečin z oceno prednost = frekvenca + učinek + fit. Področja so zgrajena okoli najvišje
ocenjenih; spodaj, katera bolečina je kje in katera je namenoma izpuščena.

| Bolečina (ID, prednost) | Kje v vprašalniku | Kako se meri |
|---|---|---|
| B01 Dejanski strošek naloga ni znan (15) | `nalog_kovinarstvo` (triaža) + diagnostika | triažno vprašanje Q02; strošek naloga sam ni postavka — posledice so v drugih poljih |
| B12 Kalkulacija ponudbe po občutku (13) | `nalog_kovinarstvo` | letna razlika cena–kalkulirana lastna cena → **nezaslužena marža** (`lostMargin`) |
| B08 Ročno vnašanje podatkov o proizvodnji (14) | `nalog_kovinarstvo` | ure evidentiranja × administrativna ura × 12 (A01 × A03: 250 nalogov × 14 min) |
| B02 Nastavitveni časi se ne merijo (14) | `nalog_kovinarstvo` | kontekstno vprašanje + glavni vzrok (data); brez zneska, ker je nastavitev legitimen čas |
| B15 Ure delavcev niso vezane na operacijo (12) | `nalog_kovinarstvo` | glavni vzrok (data) |
| B03 Razlika normativ–dejanska poraba (15) | `material_kovinarstvo` | vrednost materiala × delež odstopanja → neposredna izguba, **meja 0,5** (A16/A17) |
| B06 Ponovna izdelava na napačnem nalogu (13) | `material_kovinarstvo` | ure ponovne izdelave in sortiranja × proizvodna ura × 12 |
| B07 Ostružki niso v knjigah (11) | `material_kovinarstvo` | kontekstno vprašanje; prihodek od odpadka ni strošek, zato brez zneska |
| B16 Kosovnice v več verzijah (13) | `material_kovinarstvo` + `plan_kovinarstvo` (vzrok) + diagnostika | vzrok pri porabi in čakanju; diagnostično vprašanje o veljavni verziji |
| B09 Zaloga v sistemu ≠ dejanska (14) | `zaloge_kovinarstvo` | inventurne razlike in odpisi → neposredna izguba; zastoji × proizvodna ura; sprostljiv kapital |
| B13 Zamude dobaviteljev niso vidne (12) | `zaloge_kovinarstvo` | doplačila za nujne nabave → neposredna izguba; vzrok (external) |
| B05 Sledljivost šarže ročna (14) | `sledljivost_kovinarstvo` | ure obravnave reklamacij × administrativna ura; kontekstno vprašanje Q06 »čas do šarže« |
| B11 Certifikati 3.1 se iščejo ročno (12) | `sledljivost_kovinarstvo` | ure iskanja in priprave dokumentacije × administrativna ura × 12 |
| B14 Reklamacije in 8D ločeno (11) | `sledljivost_kovinarstvo` | ure 8D + neposredni stroški reklamacij (dobropisi, sortiranje pri kupcu) |
| B20 Zahteve avtomobilskih kupcev (12) | kontekst (sistemski dobavitelj) + diagnostika | prodajni signal; diagnostično vprašanje o presoji brez priprave |
| B04 Material v kooperaciji izgine (13) | `kooperacija_kovinarstvo` | administracija × administrativna ura; čakanje × proizvodna ura; izgube ob vračilu |
| B10 Planiranje v Excelu ali na tabli (13) | `plan_kovinarstvo` | kontekstno vprašanje + čakanje in nadure × proizvodna ura; penali |
| B24 Naročila po e-pošti (12), B25 e-račun 2028 (13) | `dokumentiHz`, modul `E` | horizontala; obstoječe opozorilo ZIERDED, samo uporabnikom PANTHEON |
| B18 Ročna poročila za vodstvo (12) | `analitikaHz` | horizontala |
| B19 Znanje pri enem tehnologu (12) | diagnostika + vzrok (people) | procesna odpornost, brez zneska (vprašanje Q05 »kaj se ustavi, ko tehnologa ni«) |
| B21 Nepovezani programi (11) | kontekst (sedanji sistem) + vzroki | prodajni signal, ne znesek |
| B17 Vzdrževanje reaktivno (11) | **ni merjeno** | fizični vzrok (naslovljivost 0,15), PANTHEON ga ne naslavlja |
| B22 Energija po stroju (10), B23 CBAM (9) | **ni merjeno** | nizek fit; zunanji sistemi in poročanje, ki ju produkt ne pokriva |
| — Garancijski servis po predaji (strojegradnja) | **ni merjeno** | `servisHz` je izključen zaradi preseka z reklamacijami; vrzel za strojegradnjo je zavestna |

ROI-scenariji raziskave (A01–A21, NPV, licenčni stroški A11–A14) niso preneseni: aplikacija računa sedanji
strošek in naslovljiv potencial, cen pa ne navaja (`content/sales/pantheonFit.ts`).

Vrstni red področij je hkrati prioriteta ob izenačenju v triaži in sledi prednosti iz kataloga: nalog,
material, zaloge, sledljivost, kooperacija, plan.

---

## 3. Potek po korakih

### Uvodni zaslon

> **Koliko vas letno stane, da ne poznate dejanskega stroška naloga?**
> Odstopanje porabe od normativa, nemerjene nastavitve, material v kooperaciji in iskanje šarž nimajo svoje vrstice v izkazu. Cene kupcu ne dvignete — ostane vam notranja učinkovitost.

Spustni seznam: Proizvodnja · Živilstvo (hrana in pijača) · **Kovinarstvo** · …

### Korak 1 — Zaposleni

Skupno vprašanje (`SHARED_COPY`), v izračun ne vstopa.

### Korak 2 — Kontekst (`contexts/kovinarstvo.ts`)

> **Nekaj o vaši kovinarski proizvodnji**

**Kako pretežno delate?** Posamični kosi in male serije po naročilu · Ponavljajoče se serije za stalne kupce ·
Strojegradnja, orodjarstvo ali projektna proizvodnja · Sistemski dobavitelj z zahtevami kupcev po dokumentaciji ·
Kombinirano
→ Način dela in ne skupina izdelkov: raziskava (lista Segmenti S1–S5 in Arhetipi) loči delavnico, serijskega
podizvajalca, strojegradnjo in sistemskega dobavitelja — stroji so isti, bolečine in prodajni pogovor ne.

**Kako danes vodite proizvodnjo?** ← prodajni signal (vrzel sistema), v izračun ne vstopa

| Odgovor | Vrzel | PANTHEON? | Ključ za `pantheonFit.ts` |
|---|---|---|---|
| PANTHEON MF in/ali MT | 8–20 % | da | `kovinarstvo:pantheonMfMt` |
| PANTHEON brez proizvodnega modula | 15–30 % | da | `kovinarstvo:pantheonNoMf` |
| Drug ERP za proizvodnjo | 15–30 % | ne | `kovinarstvo:otherErp` |
| Kombinacija ERP-ja, Excela, CAD/CAM programov in papirja | 25–40 % | ne | `kovinarstvo:erpExcelPaper` |
| Večinoma Excel, papir ali sprotni dogovor | 25–40 % | ne | `kovinarstvo:excelPaper` |

**Kakšna je vaša vloga?** Direktor/-ica · Vodja proizvodnje · **Tehnolog ali vodja tehnologije** · Finance ali
računovodstvo · Nabava ali skladišče · Drugo (lasten vpis)
→ Tehnolog je persona raziskave (Q10–Q12: kosovnice, normativi, kalkulacija). Id `vodjaTehnologije` se v oceni
ICP ujame po predponi `vodja` (0,60) brez spremembe `icp.ts`.

### Korak 3 — Triaža (10 področij)

> **Kje v kovinarstvu vas najbolj tišči?**

| # | Področje | Triažno vprašanje |
|---|---|---|
| 1 | Delovni nalog in dejanski strošek | Ali po zaključku naloga veste, koliko vas je dejansko stal — material, delo in stroj? |
| 2 | Poraba materiala, izmet in ponovna izdelava | Kako pogosto dejanska poraba materiala odstopa od normativa ali nastajata izmet in ponovna izdelava? |
| 3 | Zaloge materiala in zastoji | Kako pogosto se stroj ustavi, ker materiala ni, čeprav bi po sistemu moral biti? |
| 4 | Sledljivost šarž, certifikati in reklamacije | Kako pogosto iščete certifikate, šarže ali zapisnike za kupca, reklamacijo ali presojo? |
| 5 | Kooperacija in zunanje operacije | Kako pogosto pri kooperaciji nastanejo razlike v količinah, zamude ali izgubljen material? |
| 6 | Plan, kapacitete in roki | Kako pogosto se plan spreminja, proizvodnja čaka na prioriteto ali risbo ali zamujate z dobavo? |
| 7–10 | Analitika · Finance · Kadri · Dokumentacija | horizontale, skupne vsem dejavnostim |

Privzeto obkljukana prva tri. Triažno vprašanje pri delovnem nalogu je prepis vprašanja Q02 iz raziskave
(»Ali po zaključku naloga veste, koliko vas je dejansko stal?«) — po hipotezi H02 najmočnejši kvalifikacijski
filter v panogi.

### Korak 4 — Skupna finančna osnova

Tri številke: polni strošek neposredne proizvodne ure (pasovi 16 / 18 / 22 / 29 EUR, povprečje panoge 22 —
SURS: varilec 20,7, operater 20,9, orodjar 21,8, strugar 23,1; C25 po tabeli junij 2026 23,6), polni strošek
administrativne ure (povprečje 26) in letni prihodek (pasovi do 2 / 2–5 / 5–15 / nad 15 mio EUR; mediana
segmenta A 6,3 mio). **Marže ne vprašamo** — noben modul je ne uporablja, enako kot pri živilstvu.

### Korak 5 — Vprašanja po področjih (`modules/kovinarstvo.ts`)

**Delovni nalog in dejanski strošek** (5 polj): število nalogov na mesec (kontekst, A01) · ure ročnega
evidentiranja in prepisovanja podatkov o proizvodnji (h/mesec → kapaciteta po administrativni uri) · za koliko so
bile potrjene cene nižje od polne lastne cene (EUR/leto, »ne vem« → nezaslužena marža) · kako merite nastavitveni
čas (kontekst, B02) · glavni vzrok.
Meje: evidenca prisotnosti za plače → Kadri in plače; presežna poraba in ure → Material, Zaloge, Plan.

**Poraba materiala, izmet in ponovna izdelava** (5 polj): letna vrednost materiala (EUR/leto, »ne vem«) · za
koliko odstotkov izdano presega normativ (0–20 %, privzeto 0 → neposredna izguba, meja 0,5) · ure ponovne izdelave,
dodelav in sortiranja (h/mesec → kapaciteta po proizvodni uri) · kaj se zgodi z ostružki (kontekst, B07) · glavni
vzrok.
Meje: manko ob inventuri → Zaloge; reklamacije s kupci → Sledljivost.

**Zaloge materiala in zastoji** (6 polj): povprečna vrednost zalog (EUR) · inventurne razlike in odpisi
(EUR/leto, »ne vem«) · ure zastojev zaradi materiala (h/mesec → kapaciteta po proizvodni uri) · doplačila za nujne
nabave (EUR/leto, »ne vem«) · sprostljiv delež zaloge (izbira) · glavni vzrok.
Meje: presežna poraba → Material; razlike ob vračilu iz kooperacije → Kooperacija; prevozi h kupcu → Plan.

**Sledljivost šarž, certifikati in reklamacije** (5 polj): ure iskanja certifikatov 3.1 in priprave dokumentacije
(h/mesec) · ure obravnave reklamacij — šarža, 8D, kupec (h/mesec) · neposredni stroški reklamacij zaradi kakovosti
(EUR/leto, »ne vem«) · kako dolgo traja najti šaržo (kontekst, Q06) · glavni vzrok.
Meje: potrjevanje računov in arhiv → Dokumentacija in e-poslovanje; sortiranje in ponovna izdelava → Material;
prevozi zaradi zamud → Plan.

**Kooperacija in zunanje operacije** (5 polj): delež nalogov s kooperacijo (kontekst, Q05, izbira) · ure oddaj in
usklajevanja vračil (h/mesec → administrativna ura) · ure čakanja na vračilo (h/mesec → proizvodna ura) · izgube ob
vračilu in neuveljavljene reklamacije (EUR/leto, »ne vem«) · glavni vzrok.
Meje: prepisovanje proizvodnje → Delovni nalog; čakanje na nabavo → Zaloge; manko ob inventuri → Zaloge.

**Plan, kapacitete in roki** (6 polj): kako planirate zasedenost strojev (kontekst, B10) · ure čakanja na plan,
risbo ali verzijo (h/mesec) · nadure zaradi sprememb plana (h/mesec) — skupaj kapaciteta po proizvodni uri ·
penali, popusti in prevozi zaradi zamud (EUR/leto, »ne vem«) · delež dobav v roku (kontekst, K10) · glavni vzrok.
Meje: material → Zaloge; kooperant → Kooperacija; nujne nabave → Zaloge; kakovost → Sledljivost.

### Korak 6 — Kratka diagnostika (vedno, brez evrov)

Zanesljivost podatkov: sprotno javljanje operacij (P13) · ena veljavna verzija kosovnic (B16).
Procesna odpornost: presoja kupca brez večtedenske priprave (B20) · proizvodnja brez tehnologa (B19, Q05).
Strošek naloga in čas do šarže sta namenoma v triaži oziroma v področju Sledljivost — diagnostika ne sprašuje
dvakrat.

---

## 4. Koši in meje naslovljivosti

| Postavka | Koš | Zakaj |
|---|---|---|
| Prodaja pod lastno ceno | `lostMargin` | prodaja po napačni ceni; stoji na predpostavki, da bi kupec pravo ceno plačal — ni denar, ki bi ga bilo mogoče pokazati na kontu |
| Presežna poraba nad normativom | `directLoss`, **meja 0,5** | raziskava A16/A17: znižanje odstopanja 0,5–3 % vrednosti materiala ob realizaciji 0,4 / 0,6 / 0,8; izplen razreza ostane, prihodek od ostružkov ni odštet |
| Inventurne razlike, nujne nabave, izgube v kooperaciji, reklamacije, penali | `directLoss` | knjižen odliv |
| Vse ure | `capacity` | že plačan čas, ne prihranek plače |
| Sprostljiv kapital v zalogah | `oneTimeCapital` | enkraten učinek, brez naslovljivega deleža |

---

## 5. Kaj preveriti pred kampanjo

- Hipoteza H03 (test izsleditve šarže na živo poveča nakupno namero bolj kot demonstracija): kontekstno
  vprašanje »kako dolgo traja najti šaržo« gre v prodajno pripravo — prodajnik naj na sestanku predlaga test.
- Hipoteza H07 (vodja proizvodnje je boljši prvi stik nad 50 zaposlenih): vloga se zapiše v izvozni zapis.
- KALIBRACIJA po prvih ~50 vnosih: prag visoke izgube 15.000 EUR, rezerva proizvodne ure 22 EUR, meja
  naslovljivosti 0,5 pri porabi materiala, privzeta triaža (nalog, material, zaloge).
