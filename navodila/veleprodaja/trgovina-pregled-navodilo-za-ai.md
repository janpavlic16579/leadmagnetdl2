# Navodilo za AI: prenova vprašalnika za segment "Trgovina" (Veleprodaja in distribucija)

**Repozitorij:** `/Users/janpavlic/Documents/Datalab/aplikacije/ROI kalkulator` — NE `Datalab/Claude code` (zastarela kopija).
**Vir:** strokovni pregled po `NAVODILA-pregled-vprasalnika-po-dejavnosti.md`, 6 pregledovalcev + 6 skeptičnih preverb (12 agentov), 117 sodb.
**Raziskovalna podlaga:** `GPT baza znanja/veleprodaja/Deep_research_veleprodaja_distribucija.md`.
**Namen tega dokumenta:** samostojno, izvedljivo navodilo za razvijalca ali AI, ki bo spremembe implementiral. Vsaka postavka ima natančen sklic na datoteko/vrstico, sodbo, utemeljitev in — kjer je verdikt drugačen od "ohrani" — konkreten predlog besedila/kode.

## Kako brati to poročilo

- **Verdikt**: `ohrani` (dobro, pusti pri miru) · `izboljsaj` (obdrži polje, popravi besedilo/kod/bucket) · `odstrani` (odstrani, ne prinaša vrednosti) · `premakni` (premakni v drug koš/modul/korak) · `dodaj` (manjkajoče vprašanje ali celo področje).
- **Teža**: `visoka` (vpliva na prikazan EUR znesek ali na verodostojnost celotnega izračuna) · `srednja` (kakovost podatkov) · `nizka` (kozmetika).
- **Preverba**: vsaka ugotovitev je šla skozi ločen skeptičen krog, ki je poskušal vsako trditev ovreči z branjem kode. `potrjeno` = drži dobesedno. `popravljeno` = jedro drži, a je preverba popravila napačen sklic, dopolnila dokaz ali popravila predlagano besedilo (npr. ker je kršilo arhitekturno pravilo). `ovrzeno` = trditev ni držala; taka postavka je spremenjena v "ohrani" in razložena v razdelku 7.
- Kjer preverba ni spremenila ničesar vsebinskega, je opomba izpuščena.

---

## 1. Bilanca

Skupaj **117 sodb** čez šest obsegov (koraki 1–5 · narocila+odprema · skladišče+zaloge · terjatve+diagnostika+modul E · pet horizontal · manjkajoča področja).

| Verdikt | Število |
|---|---:|
| ohrani | 59 |
| izboljsaj | 42 |
| dodaj | 12 |
| premakni | 3 |
| odstrani | 1 |

| Status skeptične preverbe | Število |
|---|---:|
| potrjeno | 93 |
| popravljeno | 23 |
| ovrzeno | 1 |

Po teži: **27 visoka**, 26 srednja, 64 nizka.

Samo **1 postavka je bila ovržena** (glej razdelek 7) — preostalih 22 popravkov preverbe so bile dopolnitve dokazov, popravki napačnih vrstičnih sklicev ali (pri štirih predlogih v horizontalah) popravki besedila, ki je kršilo arhitekturno pravilo 'brez imenovanja sosednjih področij'.

---
## 2. Deset ugotovitev z največjo težo

Urejeno po vplivu na prikazan znesek ali na verodostojnost izračuna. Vsaka referenca `[obseg-št]` vodi v podroben zapis v razdelkih 3–6.

### #1 — Regulatorno opozorilo ZIERDED (e-računi 2028) je skrito prav podjetjem, ki bi ga najbolj potrebovala `[modul-e-16]`
`config/modules/legacy.ts` (MODULE_E_ITEMS) + `config/contexts/index.ts` (`isTechnicalRiskModuleVisible`). Modul E (SQL Server 2016 / Windows Server 2016 / ZIERDED) se prikaže **samo** obstoječim uporabnikom PANTHEON s skladiščnim modulom. 3 od 5 možnosti pri "Kako danes vodite prodajo in skladišče?" (drug ERP, Excel+ERP, Excel/papir) in prazen odgovor modul v celoti skrijejo. SQL/Windows opozorili sta upravičeno gated (govorita o infrastrukturi PANTHEON namestitve) — ZIERDED pa je zakonska obveznost za **vsa** podjetja, vpisana v slovenski register, ne glede na ERP. Podjetja na Excelu/papirju — tista, ki so dejansko najdlje od skladnosti — o roku 1. 1. 2028 nikoli ne izvedo. Posredno slabi tudi lastno prodajno alinejo terjatve_trgovina ("Izdaja e-računov skladno z ZIERDED") in ICP oceno nujnosti (`icp.ts` urgency dimenzija bere izključno iz modula E, torej je za te obiskovalce sistematično prenizka — `[modul-e-17]`). **Popravljeno pri preverbi**, dobesedno potrjeno na vseh navedenih mestih; verifikator jo je označil kot najbolj utemeljeno in najvišje prioritetno postavko celotnega pregleda.

### #2 — Cel del posla (nabava, dobavitelji, uvoz) se ne meri `[vrzeli-1]`
`config/modules/trgovina.ts` (TRGOVINA_MODULES) nima modula za nabavo. Grep po `nabav` v celotnem modulu vrne izključno besedo "nabavna vrednost" kot enoto pri zalogi — nobenega samostojnega vprašanja o nujnih naročilih, izgubljenih skontih/bonusih ali landed costu. Raziskava (sklep #3 izvršnega povzetka) to imenuje eksplicitno: *"Nabava je enakovredna prodaji ... pogosto ustvari večji učinek kot hitrejši vnos prodajnega naročila."* Segment trgovina meri izključno prodajno-skladiščno-plačilno stran; distributerji in uvozniki (dva od devetih poslovnih modelov, ki jih raziskava imenuje) so danes sistematično podcenjeni. Priložen je poln predlog polj v razdelku 6.

### #3 — Obe postavki "izgubljena marža" v trgovini so v napačnem košu `[modul-ab-6]` `[modul-cd-13]`
`narocila_trgovina.annualPricingMarginLossEUR` in `zaloge_trgovina.annualStockoutMarginLossEUR` sta obe v bucketu `directLoss`, čeprav aplikacija ima namenski koš `lostMargin` prav za to (`moduleTypes.ts`: *"prodaja po napačni ceni"* je dobesedno naveden zgled za `lostMargin`). `ResultsSummary.tsx` prikaže kartico "Nezaslužena letna marža" **samo če** `lostMarginEUR > 0` — ker sta obe trgovinski postavki napačno uvrščeni, ta kartica za **cel segment Veleprodaja in distribucija nikoli ne nastopi**, hero znesek "Neposredni letni stroški" pa je napihnjen z denarjem, ki nosi šibkejši dokaz (predpostavka o vedenju kupca, ne knjižena izguba). Neodvisno potrjeno s primerjavo `maloprodaja.ts`, kjer je strukturno identična postavka pravilno v `lostMargin`. Popravek je **ena vrstica na postavko** (`bucket: 'directLoss'` → `bucket: 'lostMargin'`), a zahteva uskladitev treh testov v `trgovina.test.ts`.

### #4 — Prispevna marža je vprašana v koraku 5, a je noben modul segmenta ne uporabi `[koraki-21]`
`context.contributionMarginRate` obstaja, ima svoj korak z vprašanjem in razponi (6–40 %) — a grep po `contributionMarginRate` v `trgovina.ts` in `horizontal.ts` vrne 0 zadetkov v `compute()`. Nobeden od desetih modulov, ki jih segment trgovina vključi, te vrednosti ne množi. To je neposredno povezano z #3: minimalni popravek (sprememba bucketa) tega ne reši, a polna preobrazba `annualStockoutMarginLossEUR` v izpeljano polje (izgubljene vrstice × povprečna vrednost × `contributionMarginRate`) bi obiskovalcu vprašanje končno dala pravi namen.

### #5 — Diagnostika pripiše "srednje tveganje" obiskovalcu, ki ni kliknil ničesar, in to je nevidno celotnemu sistemu ocene zanesljivosti `[modul-e-8]` `[modul-e-9]` `[modul-e-10]` `[modul-e-11]` `[modul-e-12]`
`diagnostika_trgovina` privzetki (1,1,2,1) dajo `riskLevelFromScore` izid "medium" na **obeh** dimenzijah (Zanesljivost podatkov, Procesna odpornost) — brez enega samega potrjenega odgovora. Modul nima triaže, torej se prikaže **100 % obiskovalcev**. Dodatno, neodvisno preverjeno: `isUntouchedNumeric` v `salesReport.ts` eksplicitno preskoči `choice` polja, zato se ta privzeta ocena ne pojavi niti v `untouchedFields` niti v `unknownAnswers` — napaka je nevidna v **celotnem** poročilu o zanesljivosti, ne le v enem izpisu. Isti vzorec defaultov (1/1/2/1) se dobesedno ponavlja v vseh sedmih segmentih (proizvodnja, logistika, maloprodaja, storitve, splošno, računovodstvo) — gre za sistemsko, ne le trgovinsko napako.

### #6 — Pet EUR/leto polj brez `allowUnknown` sili obiskovalca, da namesto "ne vem" vpiše potrjeno ničlo `[modul-cd-12]` `[horiz-10]` `[horiz-15]` `[horiz-20]` `[horiz-24]`
`zaloge_trgovina.annualWriteOffEUR`, `financeHz.annualPenaltyEUR`, `kadriHz.annualPayrollErrorEUR`, `dokumentiHz.annualDocDelayEUR`, `servisHz.annualServiceCostEUR` — vsa merijo denar, ki ga podjetje bodisi vodi bodisi ne (`moduleTypes.ts` sam navaja "odpis, manko, neizterjani rabati" kot zgled za `allowUnknown`). Brez zastavice podjetje, ki tega stroška ne spremlja ločeno, tiho zniža svoj lastni rezultat na 0 namesto da bi priznalo negotovost — natanko to, čemur je `UNKNOWN_ANSWER` mehanizem namenjen. Primerjalno: `maloprodaja.ts` ima to zastavico na skoraj identičnih poljih.

### #7 — Prvo vprašanje o zaposlenih obljublja nekaj, kar ni res `[koraki-2]`
`StepEmployeeCount.tsx`: "Podatek na izračun ne vpliva." Dejansko `plausibility.ts` (`assessHoursPlausibility`) število zaposlenih uporabi za mehko mejo (40 % kapacitete), ki sproži opozorilo ob nerazumno visoki vsoti vnesenih ur — klicano iz `CalculatorFlow.tsx` in `salesReport.ts`. Gre za dobesedno napačno trditev na mestu, kjer aplikacija obljublja poštenost do obiskovalca.

### #8 — "Kaj pretežno prodajate?" ne krmili ničesar `[koraki-3]`
`businessType` (5 možnosti: veleprodaja/distribucija/uvoz/spletna/kombinirano) je **obvezno** polje (`canProceed` ga zahteva), a izčrpen grep pokaže, da se uporabi izključno za prikaz oznake in CRM-izvoz — nič v `potential.ts`, `icp.ts` ali `salesPlaybook.ts`. Obiskovalec izpolni prvo pomembno vprašanje o svojem poslovnem modelu, ne da bi to na karkoli vplivalo.

### #9 — Strošek financiranja obratnega kapitala (`capitalCostRate`) vstopa v izračun, a je neviden oceni zanesljivosti in prodajni pripravi `[koraki-22]`
`terjatve_trgovina.compute()` dejansko množi `context.capitalCostRate` (potrjeno na vrstici v kodi), a `lib/potential.ts` (`assessConfidence`) petih skupnih predpostavk pozna le štiri — `capitalCostRate` manjka iz seznama `asked`. Enako manjka v `salesReport.ts` (`buildHourAssumptions`). Peta številka torej vpliva na prikazan EUR znesek, ne pa na značko zanesljivosti, ki naj bi ta znesek pojasnjevala.

### #10 — Ni vprašanja o mehanizmu realizacije prihranjenega časa `[vrzeli-2]`
Trdo pravilo "prihranek časa ni prihranek plače" (raziskava pogl. 4.4, 9.4) obstaja v kodi samo kot statično opozorilo (`moduleTypes.ts` komentar, `ResultsSummary.tsx` besedilo) — nikjer ne obstaja vprašanje, ki bi preverilo, KAJ se z osemsto sproščenimi urami dejansko zgodi. Sistemska vrzel, ki presega trgovino (velja za vseh sedem segmentov), a je znotraj tega pregleda pravilno prijavljena.

**Tik pod črto** (severity visoka, a ožjega dosega): `[modul-e-2]` DSO/prekoračitev roka se ne izpelje avtomatsko, čeprav orodje uporabnika v `explainer` besedilu sámo napoti na ročno odštevanje; `[horiz-21]` `dokumentiHz` vzrok "Potrjevanje poteka ročno" je kategoriziran kot `planning` (65 % naslovljivosti), čeprav gre po definiciji kategorije za `data` (75 %) — beseda "ročni prenosi" je dobesedno v definiciji `data`.

---
## 3. Koraki 1–5 — vprašanje po vprašanju

Vse, kar obiskovalec vidi PRED podrobnimi stroškovnimi vprašanji: izbira dejavnosti, velikost, kontekst (3 vprašanja), vsa triažna vprašanja desetih področij, skupna finančna osnova (5 številk).

**Korak 1 — izbira 'Trgovina, veleprodaja in distribucija' (industries.ts:27) → preslikava v segment 'trgovina'**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Preverjeno dobesedno: industries.ts:27 res preslika v segment 'trgovina'; drugo_blago (industries.ts:69-74, dejansko id 'drugo_blago' na vrstici 68-73, odstopanje za 1 vrstico) je varovalna pot; getSegmentForIndustry (industries.ts:111-113, dejansko 112-114, prav tako minimalen zamik) pade na 'splosno' za neznan id. segments.ts:129 displayName 'Veleprodaja in distribucija' brez oznake velikostnega razreda je potrjeno drži (primerjaj proizvodnja 'Proizvodnja 10–249 zaposlenih' na vrstici 69, logistika na vrstici 97). Vse trditve so točne, gre le za kozmetiko brez vpliva na izračun.
- *Vir:* Raziskava pogl. 2.2 'Glavni poslovni modeli' in izvršni povzetek (19,7 mrd EUR prihodka panoge G) potrjujeta veleprodajo kot samostojen, dovolj širok segment.

**Korak 2 — StepEmployeeCount.tsx: 'Koliko ljudi zaposlujete?' + trust note 'Podatek na izračun ne vpliva…' (StepEmployeeCount.tsx:44-47)**
- Verdikt: **IZBOLJSAJ** · Teža: visoka · Preverba: potrjeno
- Popolnoma potrjeno dobesedno. StepEmployeeCount.tsx:44-47 vsebuje natanko citirano besedilo. plausibility.ts:47-77 (assessHoursPlausibility) obstaja z natančno navedenima konstantama HOURS_PER_EMPLOYEE_PER_MONTH=160 (vrstica 18) in PLAUSIBLE_CAPACITY_SHARE=0,4 (vrstica 27). CalculatorFlow.tsx:258-259 in salesReport.ts:311-312 obe kličeta assessHoursPlausibility/hoursPlausibilityWarning — potrjeno z grep, ne le opisano. Trditev 'na izračun ne vpliva' je torej dobesedno neresnična natanko tam, kjer aplikacija obljublja poštenost do obiskovalca.
- **Predlog za izvedbo:** Zamenjaj besedilo v StepEmployeeCount.tsx:45-46 z npr.: 'Številke v izračunu ta podatek ne množi neposredno — uporabimo ga za velikostni razred v poročilu in za mehko preverbo, ali so vnesene ure sploh verjetne glede na velikost vaše ekipe; če je vsota nenavadno visoka, vas opozorimo.'
- *Vir:* Raziskava Dodatek C ('Vsi ekstremni vnosi sprožijo opozorilo in potrditev') in Dodatek A (warehouse_fte kot validacijsko polje).

**Korak 3 — TRGOVINA_CONTEXT.businessType 'Kaj pretežno prodajate?' (contexts/trgovina.ts:46-55)**
- Verdikt: **IZBOLJSAJ** · Teža: visoka · Preverba: potrjeno
- Potrjeno dobesedno na vseh točkah. contexts/trgovina.ts:46-55 vsebuje natanko pet navedenih možnosti. StepContext.tsx:47 (canProceed pogoj 'profile.businessType !== null') dejansko naredi polje obvezno. Izčrpen grep 'businessType' po src/ in content/ pokaže izključno: prikaz oznake (salesReport.ts:287, salesReportHtml.ts:308, pdfSales.ts:131) in CRM-izvoz (exportRecord.ts:170-173,247) — NIČ v lib/potential.ts, lib/icp.ts, lib/salesPlaybook.ts ali content/. Polje je torej dokazano 'mrtev podatek' za sam izračun. Dodatno preverjeno: v celotnem motorju (moduleTypes.ts) ni polja 'showIf' (grep vrne 0 zadetkov) — trditev 'motor NIMA pogojnega prikaza modula' je točna.
- *Popravek preverbe:* Brez vsebinskega popravka. Manjša natančnost: findSubIndustry/DRUGO_SUB_INDUSTRIES niso relevantne za to postavko, a citirana vrstična sklicevanja za businessType, canProceed in odsotnost showIf so vsa dobesedno točna.
- **Predlog za izvedbo:** Motor res nima showIf. Izvedljivo brez razširitve motorja: vežite businessType v salesPlaybook.ts prek content/sales/pantheonFit.ts po vzorcu obstoječega ključa 'segment:currentSystem' (dodajte variante po '${segmentId}:${businessType}'). Dokler to ni narejeno, razmislite o sprostitvi canProceed za to polje.
- *Vir:* Raziskava pogl. 2.2 'Glavni poslovni modeli' (9 modelov) in pogl. 12.1.

**Korak 3 — TRGOVINA_CONTEXT.currentSystem 'Kako danes vodite prodajo in skladišče?' (contexts/trgovina.ts:57-76)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Potrjeno dobesedno: trgovina.ts:57-76 vsebuje natanko pet možnosti z navedenimi pasovi (pantheonWms 0,08-0,2; pantheonNoWms 0,15-0,3; ujema se dobesedno). contexts/index.ts:40 (improvementBandFor) in :58 (isTechnicalRiskModuleVisible) dejansko obstajata na navedenih vrsticah (preverjeno z grep). Polje torej resnično krmili pas realistične koristi in prikaz modula E.
- *Vir:* Raziskava pogl. 5.4 'Skladiščenje, lokacije in dopolnjevanje' in pogl. 6.3 'Integracijska zrelost'.

**Korak 3 — TRGOVINA_CONTEXT.role 'Kakšna je vaša vloga?' (contexts/trgovina.ts:78-87)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Potrjeno dobesedno. contexts/trgovina.ts:78-87 ima natanko pet vlog. icp.ts ROLE_FIT (dejansko okoli vrstice 89-101, blizu navedenih 89-105) natančno ujema vrednosti direktor/lastnik=1, finance=0,8, vodja*=0,6 — preverjeno z branjem. salesPlaybook.ts:177-178 (blizu navedenih 176-178) resnično sproži 'notMyDecision', ko vloga ni direktor/lastnik. salesReport.ts:285 (blizu navedenih 285-286) izpiše roleLabel. Polje ni mrtvo, za razliko od businessType — razlika med postavkama je torej upravičena in točna.
- *Vir:* Skladno z raziskovalnim načelom 'izvor podatka in zanesljivost' (pogl. 9.1).

**Korak 4 — triaža narocila_trgovina: 'Koliko ročnega dela imate z vnosom naročil, izdelavo ponudb in usklajevanjem cen?' + 4 opcije (trgovina.ts:59-67)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Prompt dobesedno potrjen na vrstici 60 (blizu navedenih 59-67, modul se dejansko začne na vrstici 54). Vsebinska trditev drži: modul je na 2. mestu v defaultIds.
- *Popravek preverbe:* Brez vsebinskega popravka; vrstična številka je približna (modul se prične 5 vrstic prej), a to je nepomembno odstopanje.
- *Vir:* Raziskava Dodatek D.1; pogl. 5.1.

**Korak 4 — triaža skladisce_trgovina: 'Kako pogosto se v skladišču izgublja čas z iskanjem blaga, popravljanjem lokacij ali usklajevanjem stanj?' + 4 opcije (trgovina.ts:188-197)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Prompt dobesedno potrjen (skladiscTrgovina, vrstica 183-195). Trditev o 5 poljih na modul in testu 'vsak modul ima 5-6 polj' potrjena dobesedno v trgovina.test.ts (test na vrstici 275-280, blizu navedenih 276-281). Komentar segments.ts:146 'komisioniranje je bolečina ožjega kroga' potrjen dobesedno. Skepsa do te trditve na podlagi raziskave (De Koster idr., do 55 % stroškov) je metodološko utemeljena.
- *Vir:* Raziskava pogl. 5.3-5.5; pogl. 11.3 št. 3-4.

**Korak 4 — triaža zaloge_trgovina: 'Kako pogosto imate hkrati preveč zaloge in premalo tistega, kar kupec res naroči?' + 4 opcije (trgovina.ts:315-323)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Prompt dobesedno potrjen (zalogeTrgovina, vrstica 310-322). Modul je na 1. mestu v defaultIds, potrjeno v segments.ts.
- *Vir:* Raziskava sklep #4 izvršnega povzetka; pogl. 5.6.

**Korak 4 — triaža odprema_trgovina: 'Kako pogosto pošiljka odide narobe — napačen artikel, količina ali naslov?' + 4 opcije (trgovina.ts:422-430)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Prompt dobesedno potrjen (odpremaTrgovina, vrstica 417-429). Ni v defaultIds, potrjeno v segments.ts.
- *Vir:* Raziskava Dodatek D.6, D.7; pogl. 5.7-5.8.

**Korak 4 — triaža terjatve_trgovina: 'Kako pogosto kupci plačajo po dogovorjenem roku?' + 4 opcije (trgovina.ts:546-554)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Prompt dobesedno potrjen (terjatveTrgovina, vrstica 541-553). Modul je na 3. mestu v defaultIds, usesRevenue:true potrjeno na vrstici 543, in dejansko množi context.capitalCostRate na vrstici 610 (dailyRevenue * overdueDaysAverage * capitalCostRate) — trditev o CCC/obratnem kapitalu je natančno podprta s kodo.
- *Vir:* Raziskava pogl. 4.3 'Obratni kapital'; pogl. 5.9.

**Korak 4 — triaža analitikaHz (skupna z drugimi segmenti, vključena v trgovina.moduleIds; horizontal.ts:36-48)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- analitikaHz dejansko definiran na vrstici 36 (natančno ujemanje). Vključitev v segments.ts trgovina.moduleIds potrjena.
- *Vir:* Raziskava pogl. 11.3 št. 9; pogl. 5.11.

**Korak 4 — triaža financeHz (vključena v trgovina.moduleIds; horizontal.ts:139-152)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- financeHz definiran natančno na vrstici 139. reconciliationHoursPerMonth polje je na vrstici 168 (blizu navedene 174, minimalen zamik), help besedilo 'Štejte samo usklajevanje evidenc, ne opominjanja kupcev' dobesedno potrjeno — meja proti terjatve_trgovina.dunningHoursPerMonth (potrjeno na vrstici 583/616 v trgovina.ts) je resnično eksplicitna in preprečuje dvojno štetje.
- *Vir:* Raziskava Dodatek D.10; pogl. 5.10.

**Korak 4 — triaža kadriHz (vključena v trgovina.moduleIds; horizontal.ts:248-260)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- kadriHz definiran natančno na vrstici 248 — ujema se dobesedno z navedbo.
- *Vir:* Raziskava Dodatek D.12; pogl. 11.3 št. 12; pogl. 5.12.

**Korak 4 — triaža dokumentiHz (vključena v trgovina.moduleIds; horizontal.ts:355-363)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- dokumentiHz dejansko definiran na vrstici 350 (blizu navedene 355, minimalen zamik). Primerjava z logistiko potrjena dobesedno: segments.ts:97-101 eksplicitno izključi dokumentiHz iz logistike zaradi prekrivanja z modulom 'dokumentacija' ('prevozna dokumentacija ... meri iste ure'), medtem ko trgovina takega lastnega dokumentnega modula nima in dokumentiHz zato vključi brez konflikta.
- *Popravek preverbe:* Brez vsebinskega popravka; vrstična številka modula je 350, ne 355.
- *Vir:* Raziskava Dodatek D.11; pogl. 5.10 'E-računi 2028'.

**Korak 4 — triaža servisHz (vključena v trgovina.moduleIds; horizontal.ts:460-473)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- servisHz definiran natančno na vrstici 460 — popolno ujemanje. Izključitveni komentar na vrsticah 455-459 ('Dobropisi, vračila kupnine in poškodovano blago so izrecno izključeni — te evre že merijo panožna področja') dobesedno potrjen, in trgovina dejansko ima annualCreditNoteEUR (vrstica 455/504) in annualReturnedGoodsLossEUR (vrstica 466/510) v odprema_trgovina — meja je resnična in preprečuje dvojno štetje.
- *Vir:* Raziskava Dodatek D.7; pogl. 5.8.

**Korak 4 — segments.ts trgovina.triage: recommendedCount:3, defaultIds:['zaloge_trgovina','narocila_trgovina','terjatve_trgovina'] (segments.ts:147-150)**
- Verdikt: **IZBOLJSAJ** · Teža: srednja · Preverba: potrjeno
- Potrjeno dobesedno na vrsticah 145-150 (blizu navedenih 147-150): recommendedCount:3 in defaultIds v natanko navedenem vrstnem redu, s komentarjem 'Vezan kapital v zalogah in terjatvah plus izgubljena marža na cenah je klasična trojica veleprodaje; komisioniranje je bolečina ožjega kroga.' Ker ločena postavka 'dodaj nabava_trgovina' dokazuje resnično vsebinsko vrzel (nabava je eno od 12 raziskovalnih triažnih področij in ga trenutno v izbiri sploh ni), je trenutna trojica logično nepopolna primerjava — ne more biti 'najboljša trojica', če eden od kandidatov manjka iz nabora.
- **Predlog za izvedbo:** Ko nastane modul 'nabava_trgovina', ponovno preveri defaultIds/recommendedCount. Do takrat ostane trenutna trojica najboljša razpoložljiva izbira med obstoječimi petimi moduli.
- *Vir:* Raziskava sklep #3 izvršnega povzetka 'Nabava je enakovredna prodaji'; pogl. 11.3 (št. 2 nabava).

**Korak 4 — manjkajoč triažljiv modul za nabavo/dobavitelje/uvoz v TRGOVINA_MODULES (trgovina.ts:721-729)**
- Verdikt: **DODAJ** · Teža: visoka · Preverba: potrjeno
- Popolnoma potrjeno. TRGOVINA_MODULES je definiran natanko na vrsticah 721-729 (popolno ujemanje) in vsebuje izključno narocilaTrgovina, skladisceTrgovina, zalogeTrgovina, odpremaTrgovina, terjatveTrgovina, diagnostikaTrgovina — brez modula za nabavo. Grep 'nabav' po trgovina.ts vrne le posredne omembe (vzrok 'Nabava in prodaja nista usklajeni' v ZALOGE_CAUSES na vrstici 305, in 'nabavna vrednost' kot osnova za vrednotenje zaloge) — nobena od njih ni triažljiv modul, ki bi meril nabavne procese, zamude dobaviteljev ali izgubljene skonte. Vrzel je resnična in ne podvaja obstoječih polj: zaloge_trgovina meri simptome (stockout, nekurantnost), ne vzrokov na nabavni strani. Formula je odgovorljiva iz glave v 30 sekundah (h/mesec administracije, EUR/leto za ekspresne nabave in izgubljene skonte) in ne krši sheme (števila, brez showIf — potrjeno odsotnost showIf v celotnem motorju).
- *Popravek preverbe:* Brez vsebinskega popravka — vrstična številka TRGOVINA_MODULES (721-729) je popolnoma natančna, kar je izjemno redko in kaže na skrbno preverjeno ugotovitev.
- **Predlog za izvedbo:** Dodaj nov triažljiv modul 'nabava_trgovina' ('Nabava in dobavitelji') v TRGOVINA_MODULES, mesto takoj za narocila_trgovina. 5-6 polj po vzorcu obstoječih modulov (triage.prompt + 4 opcije; purchaseOrderHoursPerMonth h/mesec bucket 'capacity'; expeditedPurchaseCostEUR EUR/leto bucket 'directLoss' z allowUnknown; missedDiscountsEUR EUR/leto bucket 'directLoss' z allowUnknown, help jasno loči 'samo neizkoriščen popust, ne vrednost naročila'; supplierIssueHoursPerMonth h/mesec bucket 'capacity'; mainCauseField z vzroki iz Dodatka E.1). Dodaj vnos v content/methodology.ts (potrjeno, da obstajajo ključi po vzorcu narocila_trgovina na vrstici 107 in zaloge_trgovina na vrstici 119) in content/actions/actions.ts. Po dodatku ponovno preveri defaultIds/recommendedCount (ločena povezana postavka).
- *Vir:* Raziskava sklep #3 izvršnega povzetka; pogl. 5.2; pogl. 11.3 št. 2; Dodatek D.2; Dodatek E.1 (SUPPLIER).

**Korak 5 — operationalHour (WHOLESALE_HOUR_BANDS, fallbackEUR:19) (contexts/trgovina.ts:12-26,89-95)**
- Verdikt: **IZBOLJSAJ** · Teža: srednja · Preverba: popravljeno
- Osnovno dejstvo je potrjeno dobesedno: trgovina.ts:17 res pravi 'Sidro: skladiščnik in komisionar 20,0 EUR/h', koda pa uporablja fallbackEUR:19 (vrstica 94). urne-postavke.md:55 res potrjuje 20,0 EUR/h za poklic 4321 'Skladiščnik, uradnik za nabavo in prodajo'. VENDAR je pripovedni del napačen: dokument urne-postavke.md:122-123 EKSPLICITNO pravi 'logistika in veleprodaja obe merita skladiščnika in komisionarja, zato imata enak nabor' — to pomeni, da je identičen nabor pasov (in posredno fallbackEUR=19) med trgovino in logistiko NAMERNA odločitev projekta, ne nepazljivo podedovana logistična številka. Prava napaka ni 'trgovina je podedovala logistiko', ampak preprosto to, da se STEVILKA v komentarju trgovina.ts (20,0) ne ujema s STEVILKO v kodi (19) — ne glede na vzrok je to neposredna kršitev pravila iz urne-postavke.md:139-141 ('fallbackEUR ... je trditev, ki jo mora podpirati tabela zgoraj').
- *Popravek preverbe:* Osnovna opažena neskladnost (komentar 20,0 vs. koda 19) je resnična in ostaja veljaven razlog za 'izboljsaj', a razlaga vzroka je bila napačna: docs/urne-postavke.md:122-123 eksplicitno pravi, da si trgovina in logistika DELITA isti nabor namerno ('isti poklici, ista kalibracija'), zato trditev o nenamernem 'podedovanju logistične številke brez prilagoditve' ni podprta — gre zgolj za manjše številčno neskladje med internim komentarjem in kodo, ne za sistemsko napako pri prenosu segmenta.
- **Predlog za izvedbo:** Popravi neskladje med komentarjem in kodo v trgovina.ts:12-19: bodisi (a) uskladi fallbackEUR na 20 (če je namen bil natanko slediti anchorju 4321), bodisi (b) če je 19 zavesten konservativen zaokrožek (glede na to, da help besedilo omenja tudi viličarista, ki nima lastnega SURS-sidra, in glede na filozofijo dokumenta 'Vzeli smo nižje sidro zavestno'), popravi komentar tako, da eksplicitno navaja 19 in ne 20,0, ter pojasni zaokrožitev. NE trdi, da gre za nenamerno podedovano logistično številko — dokument to eksplicitno zanika.
- *Vir:* Interni vir docs/urne-postavke.md (SURS SiStat 0711335S), zlasti vrstice 55, 122-123 in 139-141.

**Korak 5 — adminHour (ADMIN_HOUR_BANDS, fallbackEUR:25) (contexts/trgovina.ts:97-103)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Potrjeno dobesedno: skupna konstanta v contexts/shared.ts:18, fallbackEUR:25 v trgovina.ts:102 (blizu navedenih 97-103). ADMIN_HOUR_EXPLAINER obstaja (shared.ts:49).
- *Vir:* docs/urne-postavke.md (SURS SiStat 0711335S).

**Korak 5 — annualRevenue (4 razponi 0,4-35 mio EUR, fallback 0) (contexts/trgovina.ts:109-121)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Potrjeno dobesedno: annualRevenue definiran natančno na vrsticah 109-121 (popolno ujemanje), fallback:0, štirje razponi ujemajo se dobesedno. usesRevenue:true na terjatveTrgovina potrjen na vrstici 543. Manjša opomba je preverjena: grep 'annualRevenue' po salesReportHtml.ts in pdfSales.ts vrne 0 zadetkov — res se ne izpiše kot samostojna vrstica v prodajnem poročilu.
- *Vir:* Raziskava pogl. 11.6; Dodatek A (revenue_total).

**Korak 5 — contributionMargin (4 razponi 6-40 %, fallback 0,20) (contexts/trgovina.ts:123-138)**
- Verdikt: **IZBOLJSAJ** · Teža: visoka · Preverba: potrjeno
- Popolnoma potrjeno in celo okrepljeno z dodatnimi dokazi. contributionMargin definiran natančno na vrsticah 123-138 (popolno ujemanje). Grep 'contributionMarginRate' po trgovina.ts res vrne 0 zadetkov v compute() — noben trgovinski modul je ne množi, usesMargin ni nastavljen. Ključna postavka annualStockoutMarginLossEUR (zaloge_trgovina, polje na vrstici 344-353, compute na vrstici 388) je res gol EUR/leto vnos v bucket 'directLoss', čeprav njen LASTNI label pravi 'Kolikšno prispevno maržo ste ... izgubili' — konceptualno je to marža, ne trden odtekel denar. DODATEN DOKAZ, ki ga izvirna ugotovitev ni navedla: ResultsSummary.tsx eksplicitno in namerno loči directLoss ('Neposredni letni stroški' = 'denar, ki dejansko odteka') od lostMargin ('Nezaslužena letna marža' = denar, ki 'ni prišel', 'stoji na predpostavki o kupčevem vedenju', prikazana LOČENO prav zato, da ugovor 'tega nakupa morda ne bi bilo' ne podre dokazljivega dela zneska). Ker gre pri stockoutu za natanko tak pogojni scenarij (kupec bi kupil, če bi bilo blago na zalogi), sodi ta znesek v 'lostMargin', ne v 'directLoss' — trenutna uvrstitev napihuje 'trdi' del hero zneska z zneskom, ki po lastni filozofiji aplikacije nosi šibkejši dokaz. Primerjava z maloprodaja.ts potrjena dobesedno: lostSalesSharePercent (maloprodaja.ts:107) je izračunan kot annualRevenueEUR × delež × contributionMarginRate × (1-substitucija), bucket 'lostMargin' (potrjeno na vrstici ~160), usesMargin:true nastavljen (vrstica 92).
- *Popravek preverbe:* Ugotovitev je bila potrjena in OKREPLJENA z dodatnim dokazom (ResultsSummary.tsx eksplicitna ločitev 'denar, ki dejansko odteka' proti 'denar, ki ni prišel'), ki naredi bucket-napako še bolj nedvoumno, kot je izvirna ugotovitev predlagala. Predlog je poenostavljen: minimalni popravek je sprememba bucketa, ne nujno prestrukturiranje polja.
- **Predlog za izvedbo:** Prednostni, minimalni popravek: v zaloge_trgovina samo zamenjaj bucket iz 'directLoss' v 'lostMargin' za izhod 'Izgubljena marža zaradi manjkajočega blaga' (trgovina.ts, vrstica ~388) — polje in besedilo lahko ostaneta nespremenjena, ker uporabnik že vnaša maržo neposredno (ne surovo vrednost naročila), zato preoblikovanje v lostOrderLinesPerYear × avgLineValueEUR × contributionMarginRate ni nujno, čeprav bi bilo bolj skladno z maloprodajnim vzorcem in bi omogočilo usesMargin:true. Če razvijalec izbere polno preoblikovanje: lostOrderLinesPerYear (number, vrstic/leto, default 0, allowUnknown:true) in avgLineValueEUR (number, EUR/vrstica, default 0), compute: valueEUR = lostOrderLinesPerYear × avgLineValueEUR × context.contributionMarginRate, bucket 'lostMargin', usesMargin:true na zalogeTrgovina.
- *Vir:* Raziskava pogl. 5.6 'Stockout ni avtomatično izgubljena prodaja'; Dodatek D.5. Dodatno: interna filozofija bucketov v moduleTypes.ts:18-27 in ResultsSummary.tsx (ločitev directLoss/lostMargin).

**Korak 5 — capitalCostRate (4 razponi 3-18 %, fallback 0,06) (contexts/trgovina.ts:144-157)**
- Verdikt: **IZBOLJSAJ** · Teža: visoka · Preverba: popravljeno
- Popolnoma potrjeno, z izjemno natančnimi vrstičnimi sklici. capitalCostRate definiran natančno na vrsticah 144-157 (popolno ujemanje). terjatveTrgovina (trgovina.ts:610) resnično množi context.capitalCostRate v bucket 'directLoss'. lib/potential.ts:157-163 (natančno ujemanje vrstic) — polje 'asked' vsebuje točno pet elementov: operationalHour, adminHour, chargeOutRate, annualRevenue (pogojno), contributionMargin (pogojno) — capitalCostRate DEJANSKO manjka. moduleTypes.ts ima usesRevenue (vrstica 241) in usesMargin (vrstica 248), a NI usesCapitalCost — grep potrjuje odsotnost. salesReport.ts buildHourAssumptions (natančno vrstica 420) in buildConfidenceReason (natančno vrstica 497) prav tako ne vsebujeta capitalCostRate — grep po celotni datoteki vrne 0 zadetkov. usesRevenue.test.ts (natančno vrstici 11-16 in 18-23, popolno ujemanje) potrjuje obstoj registrskega testa, ki bi analogno tretjo trditev za capitalCostRate lahko preverjal.
- *Popravek preverbe:* Vsebina ugotovitve je v celoti potrjena z zelo natančnimi vrstičnimi sklici. Manjši popravek predloga: capitalCostRate naj se v salesReport.ts NE vstavi neposredno v buildHourAssumptions (ta funkcija je po imenu in obstoječi vsebini specifično za urne postavke — operationalHour, adminHour, chargeOutRate), ampak naj dobi lastno, ločeno mesto v poročilu, da ne zamegli pomena obstoječe funkcije.
- **Predlog za izvedbo:** Dodaj usesCapitalCost?: true v ModuleDefinition (moduleTypes.ts, po vzorcu usesMargin na vrstici 248), nastavi na terjatveTrgovina. V lib/potential.ts:157-163 dodaj v 'asked' polje: capitalCostRelevant izpeljan enako kot marginRelevant, nato context?.capitalCostRate && capitalCostRelevant ? profile.capitalCostRate.estimated : undefined. Razširi usesRevenue.test.ts s tretjim testom po vzorcu prvih dveh. V lib/salesReport.ts capitalCostRate NE spada neposredno v buildHourAssumptions (ta je po imenu in namenu specifično za URNE postavke) — dodaj ločeno vrstico/sekcijo v poročilo (npr. nova buildOtherAssumptions ali razširjen tip vrstice), da prodajnik vidi vir obrestne mere.
- *Vir:* Raziskava pogl. 9.3 'Naslovljivost' in pogl. 10.1-10.2; pogl. 5.9 'Sprostitev terjatev'.

---
## 4. Panožni moduli, diagnostika in modul E — polje po polje

### 4.1 narocila_trgovina — Naročila, ponudbe in cene

**narocila_trgovina · triage.prompt (trgovina.ts:60-66)**
- Verdikt: **IZBOLJSAJ** · Teža: srednja · Preverba: popravljeno
- Vrstice in besedilo držijo dobesedno. Trditev je vsebinsko potrjena in celo okrepljena: triažna ocena tega modula NI zgolj kozmetična prioriteta, ampak neposredno vhodni podatek v selectTopModules() (lib/moduleEngine.ts:192-209), ki avtomatsko izbere privzetih recommendedCount=3 modulov za segment trgovina (segments.ts:147-150: recommendedCount:3, defaultIds vključuje narocila_trgovina le kot IZENAČEVALNI kriterij, ne kot zaščito). Če ima narocila_trgovina nizko triažno oceno (0) relativno na druge module/horizontale, izpade iz privzeto obkljukanih treh, uporabnik pa modula morda nikoli ne odpre (StepTriage.tsx dovoljuje ročni popravek, a to zahteva, da uporabnik sam prepozna skrito bolečino, ki je triaža ne omeni). Ena netočnost v izvirni ugotovitvi: prompt ŽE vsebuje besedo 'usklajevanjem cen' (trgovina.ts:60), torej ne meri IZKLJUČNO obsega ročnega dela brez sledu cen — vendar je to omenjeno kot delovna obremenitev (koliko časa gre za usklajevanje), ne kot pogostost napak/izgube marže, zato osrednja točka ugotovitve (triaža ne loči 'ur za cene' od 'izgube zaradi napačnih cen') drži.
- *Popravek preverbe:* Rationale dopolnjen s preverjenim mehanizmom (selectTopModules + segments.ts:147-150 defaultIds so le tie-break, ne garancija vključitve) in popravljena netočnost, da prompt 'usklajevanje cen' že omenja (a le kot delovni obseg, ne kot pogostost napak). Verdikt in predlagano besedilo ostajata.
- **Predlog za izvedbo:** Prilagodi besedilo štirih stopenj, da zajamejo obe dimenziji: 0 'Naročila so digitalna, cene se redko zmotijo'; 1 'Nekaj ur tedensko ročnega vnosa ali občasna napačna cena'; 2 'Vsak dan ročno delo ali redne napake pri cenah in rabatih'; 3 'Skoraj cel človek na ročnem delu, napake pri cenah so pogoste'. Dopolni tudi utemeljitev s konkretnim mehanizmom tveganja: nizka ocena tu lahko modul dejansko izloči iz privzeto predlaganih treh (segments.ts:147-150), ne le 'zniža prioriteto ob ročnem popravku'.
- *Vir:* Poglavje 5.1 (Vprašanja z največjo informacijsko vrednostjo, Finančni model); Dodatek D.1

**narocila_trgovina.orderChannel (trgovina.ts:70-81)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Preverjeno dobesedno: polje je contextOnly (trgovina.ts:74), v compute() (130-165) se input.orderChannel nikjer ne uporabi, test 'polja s contextOnly ne premaknejo nobene številke' (trgovina.test.ts:295-331, konkretno scenarij na 302-305) to potrjuje. salesReport.ts buildMeasuredArea (407-413) polje res zapiše v measured.answers z contextOnly:true, salesPlaybook.ts buildOpeningQuestions (104-115) ga res uporabi kot rezervno iztočnico, a ŠELE ko so vsi drugi seznami vprašanj prazni (if questions.length === 0). Štiri izbire so smiselno ločene.
- *Vir:* Poglavje 5.1; Dodatek D.1

**narocila_trgovina.orderEntryHoursPerMonth (trgovina.ts:83-93)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Vrstice, besedilo, meja proti skladišču ('Ne vključujte komisioniranja...'), enota h/mesec in množenje z MONTHS_PER_YEAR (trgovina.ts:140) so dobesedno potrjeni. skladisceTrgovina (183-298) resnično nima polja za vnos naročil. Urna postavka adminHourCostEUR potrjena testom (trgovina.test.ts:67-70). Primer v explainerju (2×2 h ≈ 84 h/mesec) je aritmetično pravilen (2 osebi × 2h × 21 dni = 84).
- *Vir:* Poglavje 5.1 (Merljivi imenovalci: produktivnost vnosa); Dodatek D.1

**narocila_trgovina.retypingHoursPerMonth (trgovina.ts:95-106)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Vrstice in besedilo dobesedno potrjeni. Meja proti prejšnjemu polju je eksplicitna, množenje v compute() (147) pravilno, urna postavka administrativna.
- *Vir:* Dodatek D.1

**narocila_trgovina.priceFixHoursPerMonth (trgovina.ts:108-114)**
- Verdikt: **IZBOLJSAJ** · Teža: srednja · Preverba: potrjeno
- Potrjeno dobesedno: polje res nima help niti explainer. explainers.test.ts (17-51) formalno zahteva explainer SAMO če help obstaja ('vsako polje s pomožnim besedilom ima tudi pojasnilo', 29-32) — polje brez help torej ne krši nobenega testa, a vsebinsko res združuje dve dejavnosti (vzdrževanje cenikov + popravljanje že ujetih napak), medtem ko annualPricingMarginLossEUR meri PREPOZNO ujete napake (izgubljena marža). Meja med poljema danes v besedilu ni pojasnjena.
- **Predlog za izvedbo:** Dodaj help: 'Čas za urejanje cenikov IN za popravljanje cen, ki ste jih ujeli PREDEN je nastala izguba — to polje meri ČAS, naslednje polje meri dejansko izgubljeno maržo pri napakah, ujetih prepozno.' Explainer npr.: 'Primer: urejanje rabatnih lestvic 5 h/mesec + popravljanje 8 pravočasno ujetih napačnih cen × 1 h ≈ 13 ur na mesec.'
- *Vir:* Poglavje 5.1 (Tipične izgube, Finančni model); Dodatek D.1

**narocila_trgovina.annualPricingMarginLossEUR — koš v compute() (trgovina.ts:116-127, 158-163)**
- Verdikt: **PREMAKNI** · Teža: visoka · Preverba: popravljeno
- Dobesedno potrjeno in DODATNO okrepljeno z novimi dokazi. moduleTypes.ts:20-23 res definira lostMargin z zgledom 'prodaja po napačni ceni' (in tudi 'odpovedano naročilo' — vzporedno z zalogeTrgovina.annualStockoutMarginLossEUR, ki ima IDENTIČNO napako: trgovina.ts:386-390, bucket 'directLoss', prav tako v nasprotju z lastnim zgledom v moduleTypes.ts). content/methodology.ts:107-111 opisuje postavko dobesedno kot 'letno izgubljena marža'. directLoss je res edini koš v hero znesku — preverjeno neposredno v kodi: src/lib/pdf.ts:287 kliče heroAmount(params.totals.directLossEUR, ...); ResultsSummary.tsx:70-76 res prikaže kartico 'Nezaslužena letna marža' SAMO če totals.lostMarginEUR > 0. Ker sta oba trgovinska 'lostMargin' primerka danes napačno v directLoss, kartica za CEL segment 'Veleprodaja in distribucija' res nikoli ne nastopi. Dodatno preverjeno: annualPricingMarginLossEUR nima allowUnknown, medtem ko diagnostikaTrgovina.knowsItemMargin in DATA_RISK_NOTE.high (trgovina.ts:641: 'Dejanske zaloge in marže po artiklu ne poznate...') to negotovost izrecno priznavata. Popravek: test trgovina.test.ts:333-360 ('vsako področje meri svoj korak poti blaga', konkretno vrstica 355: expect(...directLoss...).toHaveLength(1)) je DODATNO mesto, ki bi ob spremembi bucketa padlo — izvirna ugotovitev je omenila samo vrstico 78.
- *Popravek preverbe:* Ugotovitev v celoti potrjena in okrepljena z dodatnimi dokazi (pdf.ts:287, ResultsSummary.tsx:70-76, moduleTypes.ts:20-23, zalogeTrgovina.annualStockoutMarginLossEUR ima identično napako). Proposal razširjen: poleg trgovina.test.ts:78 je treba popraviti tudi trgovina.test.ts:174 in :355, ki ju izvirna ugotovitev ni omenila, pa bi ob popravku bucketa oba padla.
- **Predlog za izvedbo:** 1) Spremeni bucket iz 'directLoss' v 'lostMargin' (trgovina.ts:159). 2) Uskladi VSE tri regresijske teste: trgovina.test.ts:78 (expect bucket 'lostMargin'), trgovina.test.ts:174 (seštevek treh directLoss postavk pade iz 45.000 na 20.000, ker gre ena postavka iz igre) in trgovina.test.ts:355 (dolžina filtra directLoss za narocilaTrgovina pade iz 1 na 0) ter methodology.ts. 3) Dodaj allowUnknown: true, po zgledu maloprodaja.ts:122-129/223-233/236-248. 4) V help dodaj navodilo za sestavljen dogodek (pošiljka in cena narobe hkrati).
- *Vir:* Poglavje 13.2 (pravila podvajanja); poglavje 4.4; poglavje 10.1

**narocila_trgovina.mainCause / NAROCILA_CAUSES (trgovina.ts:46-52, 128)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Dobesedno potrjeno: addressableShare.ts:15-34 res definira data=0.75, people=0.45, external=0.25, unknown=0.3 (privzeto, zadnja izbira). Pet vzrokov je pravilno razporejenih (trije 'data', en 'people', en 'external').
- *Vir:* Dodatek E.1 (taksonomija vzrokov)

**narocila_trgovina.pantheon (trgovina.ts:166-170)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Potrjeno: trije predlogi neposredno naslavljajo tri izmerjene postavke modula, salesPlaybook.ts buildRecommendation (122-140) res uporabi pantheon polje modula z največjim totalEUR (sort na b.totalEUR - a.totalEUR, vrstica 131).
- *Vir:* Poglavje 5.1 (Preslikava na rešitve)

**narocila_trgovina · dodaj: obseg naročil (npr. orderLinesPerMonth)**
- Verdikt: **DODAJ** · Teža: nizka · Preverba: potrjeno
- Potrjeno: narocila_trgovina ima natanko 6 polj (orderChannel, orderEntryHoursPerMonth, retypingHoursPerMonth, priceFixHoursPerMonth, annualPricingMarginLossEUR, mainCause) — natanko na zgornji meji, ki jo trgovina.test.ts:276-281 ('vsak modul ima 5–6 polj') dejansko preverja. Preverjeno tudi proti vseh pet horizontal segmenta (analitikaHz, financeHz, kadriHz, dokumentiHz, servisHz — vse v horizontal.ts) in ostalim štirim panožnim modulom trgovine (skladisce, zaloge, odprema, terjatve): nobeden ne meri obsega naročil/vrstic, torej predlog ne podvaja obstoječega polja. Vprašanje je odgovorljivo iz glave.
- *Popravek preverbe:* Preverjeno proti vseh pet horizontal in vseh štirih preostalih panožnih modulov trgovine — ni podvajanja. Natančna meja polj (276-281, ne 276-280) popravljena.
- **Predlog za izvedbo:** Modul je že na zgornji meji 6 polj. Predlog: dodaj contextOnly polje 'orderLinesPerMonth' (kind: number, unit: 'vrstic/mesec', default: 0) s help 'Skupno število vrstic v prejetih naročilih na mesec — v izračun ne vstopa, služi za oceno obsega.' Če je treba ohraniti mejo 6 polj, razmisli o zamenjavi manj informativnega polja (npr. orderChannel, ki ima šibkejšo prodajno vlogo od predlaganega) ali o dokumentirani širitvi testne meje v trgovina.test.ts:276-281.
- *Vir:* Poglavje 5.1 (Vprašanja z največjo informacijsko vrednostjo, Merljivi imenovalci); Dodatek D.1

### 4.2 odprema_trgovina — Odprema, vračila in reklamacije

**odprema_trgovina · triage.prompt (trgovina.ts:423-429)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Dobesedno potrjeno. Prompt in štiri stopnje merijo pogostost napake pri odpremi, kar sorazmerno napoveduje vse štiri postavke modula. Za razliko od narocila_trgovina tu ni skrite druge dimenzije.
- *Vir:* Poglavje 5.7 (Perfect order); Dodatek D.6

**odprema_trgovina.shipmentsPerMonth (trgovina.ts:432-441)**
- Verdikt: **IZBOLJSAJ** · Teža: srednja · Preverba: potrjeno
- Dobesedno potrjeno: contextOnly, ne vstopa v compute() (trgovina.test.ts:316-320 twist scenarij), a salesReport.ts (407-413) ga zapiše v measured.answers in salesPlaybook.ts (104-115) ga uporabi kot rezervno iztočnico šele, ko ni drugih odprtih vprašanj — torej ni 'mrtvo' polje. Motor danes res nima normirane KPI-metrike (EUR/1000 pošiljk); ModuleOutputDraft (moduleTypes.ts:180-202) pozna samo bucket+valueEUR+note, note pa se v UI izriše prek RiskCard.tsx samo za bucket 'risk' (ResultsView.tsx:130 → totals.risks, ki jih exportRecord.ts:219 filtrira na bucket==='risk').
- **Predlog za izvedbo:** Kratkoročno: natančneje pojasni namen v help. Srednjeročno: razširi lib/moduleEngine.ts in lib/salesReport.ts z normirano metriko (letni directLoss odprema_trgovina / (shipmentsPerMonth × 12) × 1000).
- *Vir:* Poglavje 5.7 (KPI-ji: transportni strošek na pošiljko, poškodbe na 1.000 pošiljk); Dodatek D.6

**odprema_trgovina.annualRedeliveryCostEUR (trgovina.ts:442-453)**
- Verdikt: **IZBOLJSAJ** · Teža: srednja · Preverba: potrjeno
- Dobesedno potrjeno: help že zahteva neto znesek ('Samo dodatni prevozni in manipulativni strošek nad običajno dostavo'). Polje res nima allowUnknown. Precedens expressDeliveryCostEUR v maloprodaja.ts (preverjeno: key na vrstici 122, allowUnknown: true na vrstici 128) potrjen dobesedno.
- **Predlog za izvedbo:** Dodaj allowUnknown: true.
- *Vir:* Poglavje 5.7 (Finančni model: Neto strošek dostave); poglavje 10.1

**odprema_trgovina.annualCreditNoteEUR (trgovina.ts:454-464)**
- Verdikt: **IZBOLJSAJ** · Teža: visoka · Preverba: popravljeno
- Prve tri točke potrjene dobesedno: (1) meja proti narocila_trgovina drži, a nima navodila za sestavljen dogodek; (2) manjka allowUnknown (annualWriteOffEUR v maloprodaja.ts:223-233 res ima allowUnknown na vrstici 229); (3) polje res sprašuje po BRUTO vrednosti dobropisov, ne po neto izgubi, kar je neskladno s sosednjim annualReturnedGoodsLossEUR. POMEMBEN MANJKAJOČ PREVERJENI VIDIK: izvirna ugotovitev NI preverila proti servisHz (Reklamacije in poprodajni servis, horizontal.ts:460-559), ki je DEJANSKO vključen v segment trgovina (segments.ts:140). servisHz.annualServiceCostEUR (horizontal.ts:500-509) ima help 'Samo stroški, ki še niso zajeti drugje — dobropisi, vračila kupnine in poškodovano blago sem ne sodijo' — to je recipročna meja, ki v odprema_trgovina.annualCreditNoteEUR NI omenjena (enosmerna, enak vzorec kot pri zalogeTrgovina spodaj). Prava napaka pri sestavljenem dogodku torej ni samo naročila↔odprema, ampak tudi odprema↔servisHz (garancijski primeri).
- *Popravek preverbe:* Dodana manjkajoča primerjava proti servisHz (horizontalni modul, ki JE del segmenta trgovina, segments.ts:140) — izvirna ugotovitev je preverila samo mejo proti narocila_trgovina in je zato spregledala tretjo stran istega problema (garancijski dobropisi/kulanca v servisHz.annualServiceCostEUR).
- **Predlog za izvedbo:** 1) V help dodaj neto-navodilo po zgledu maloprodaja.ts:243. 2) Dodaj navodilo za sestavljen dogodek s poljem Naročila. 3) Dodaj allowUnknown: true. 4) NOVO: dodaj tudi navodilo, da garancijska popravila, kulanca in nadomestni deli sodijo v področje 'Reklamacije in poprodajni servis' (servisHz), ne sem — zapre mejo, ki jo servisHz.annualServiceCostEUR (horizontal.ts:506) danes navaja samo enosmerno.
- *Vir:* Poglavje 5.8 (Obvezna razmejitev, Pravilno vrednotenje vračila); poglavje 13.2

**odprema_trgovina.annualReturnedGoodsLossEUR (trgovina.ts:465-476)**
- Verdikt: **IZBOLJSAJ** · Teža: srednja · Preverba: potrjeno
- Dobesedno potrjeno: polje je pravilno zasnovano kot neto izguba, meja proti Zaloge obstaja a ni recipročna (zalogeTrgovina.annualWriteOffEUR, trgovina.ts:337-343, nima help/explainer, preverjeno v datoteki). Manjka allowUnknown.
- **Predlog za izvedbo:** 1) Dodaj allowUnknown: true. 2) Ker je zalogeTrgovina.annualWriteOffEUR izven mojega obsega, priporočam ločen poseg vanjo z recipročnim navodilom.
- *Vir:* Poglavje 5.8 (Pravilno vrednotenje vračila); poglavje 13.2

**odprema_trgovina.claimHandlingHoursPerMonth (trgovina.ts:477-488)**
- Verdikt: **IZBOLJSAJ** · Teža: srednja · Preverba: popravljeno
- Meja proti Skladišče in proti terjatveTrgovina.dunningHoursPerMonth (trgovina.ts:583-591, enosmerna izključitev 'reševanje reklamacij in dobropisov... sodijo v področje Odprema' potrjena dobesedno na vrstici 588) je pravilno opisana. RESNA VRZEL V IZVIRNI UGOTOVITVI: sploh ni preverila najbolj sorodnega modula — servisHz ('Reklamacije in poprodajni servis'), ki JE del segmenta trgovina (segments.ts:140) in ima praktično identičen naslov. servisHz.rmaAdminHoursPerMonth (horizontal.ts:487-498) ima že zapisano mejo: help 'Štejte samo garancijske in servisne primere, ne urejanja običajnih vračil in dobropisov' (horizontal.ts:494) — to POMENI, da 'običajno' reševanje vračil/dobropisov (torej to, kar meri claimHandlingHoursPerMonth) je že implicitno namenjeno biti izven servisHz, a claimHandlingHoursPerMonth tega SPLOH ne omeni in bi zlahka vase potegnil tudi garancijske/RMA ure, ki jih uporabnik ne loči od 'usklajevanja s kupci'.
- *Popravek preverbe:* Izvirna ugotovitev je preverila samo mejo proti terjatveTrgovina in POPOLNOMA izpustila veliko bolj sorodni horizontalni modul servisHz (Reklamacije in poprodajni servis), ki je dejansko del segmenta trgovina (segments.ts:140) in ima že zapisano enosmerno mejo (horizontal.ts:494). To je materialna vrzel po merilu naloge #4 (preveri proti vsem petim horizontalam) — proposal razširjen z drugim stavkom.
- **Predlog za izvedbo:** V help dodaj DVA stavka: 1) 'Ne vključujte ur opominjanja za zapadle račune, tudi če je vzrok zamude sporna pošiljka — te ure sodijo v področje Plačilni roki in terjatve.' 2) 'Garancijske popravke in RMA postopke pri dobavitelju ne štejte sem — sodijo v področje Reklamacije in poprodajni servis.'
- *Vir:* Poglavje 5.8 (KPI-ji: čas do prvega odziva in čas do zaprtja); poglavje 13.2

**odprema_trgovina.mainCause / ODPREMA_CAUSES (trgovina.ts:409-415, 489)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Dobesedno potrjeno: pet vzrokov (trije 'data', en 'people', en 'external') se ujema z addressableShare.ts kategorijami, test trgovina.test.ts:183-187 to potrjuje (zunanji vzrok → ADDRESSABLE_SHARE.external).
- *Vir:* Dodatek E.1

**odprema_trgovina.pantheon (trgovina.ts:524-528)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Dobesedno potrjeno: trije predlogi neposredno naslavljajo DATA-vzroke modula.
- *Vir:* Poglavje 5.7; poglavje 5.8

### 4.3 skladisce_trgovina — Skladišče in komisioniranje

**skladisce_trgovina — triage: 'Kako pogosto se v skladišču izgublja čas z iskanjem blaga, popravljanjem lokacij ali usklajevanjem stanj?'**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Preverjeno dobesedno v trgovina.ts:189-197 (prompt je na 189-190, options 191-196). Besedilo se ujema natanko. Štiristopenjska lestvica pokriva iskanje, lokacije in usklajevanje stanj; komisioniranje samo po sebi ni vključeno, kar se sklada s header komentarjem datoteke (trgovina.ts:30-35), ki komisioniranje eksplicitno izloči iz vseh področij, da se izogne dvojnemu štetju z odpremo.
- *Popravek preverbe:* Trditev drži dobesedno. Brez popravka.
- **Predlog za izvedbo:** Brez sprememb.
- *Vir:* pogl. 5.4 Skladiščenje, lokacije in dopolnjevanje (citata nisem mogel preveriti proti izvirniku raziskave — v repozitoriju ni datoteke z besedilom raziskave)

**pickingMethod (contextOnly, skladisce_trgovina)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Preverjeno v trgovina.ts:200-211 — polje in vse štiri izbire (terminali/natisnjen seznam/delno ERP-delno Excel/spomin) se ujemajo dobesedno. Preverjeno tudi generično: salesReport.ts:407-413 vsebuje splošni `.map()` čez VSA polja modula (ne samo pickingMethod po imenu) — vsako polje, tudi contextOnly, konča v measured.answers. salesPlaybook.ts:104-115 dejansko vsebuje rezervni mehanizem 'Kontekstna polja niso številke, a povedo, KAKO podjetje dela... Uporabna so takrat, ko drugih ni', ki se sproži samo, ko so vsa druga vprašanja (softness.painfulUnmeasured, unknownAnswers, untouchedFields) prazna. Razlikovanje od stockAccuracy/stockVisibility (fizični način komisioniranja proti natančnosti stanja zaloge) drži.
- *Popravek preverbe:* Trditev in linijski sklici (salesReport.ts:407-413, salesPlaybook.ts:104-115) so točni, čeprav gre za generično kodo (map čez vsa polja), ne za posebno obravnavo pickingMethod po imenu — to je vsebinsko še vedno pravilna podlaga za 'ohrani'.
- **Predlog za izvedbo:** Brez sprememb.
- *Vir:* Dodatek D.4 (nepreverljivo proti izvirniku)

**searchingHoursPerMonth**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- trgovina.ts:212-224 potrjeno dobesedno. Meja proti ponovnemu komisioniranju je v help (219: '...Ponovno komisioniranje napačne pošiljke se namenoma ne šteje nikjer — raje podcenimo, kot da bi isto uro šteli dvakrat.') in usklajena s header komentarjem (30-35). Explainer (220-223) ponuja štej-dogodke-krat-čas napotek. Uporablja context.operationalHourCostEUR (trgovina.ts:263) — pravilna urna osnova.
- **Predlog za izvedbo:** Brez sprememb.
- *Vir:* pogl. 5.4 (nepreverljivo proti izvirniku)

**receivingHoursPerMonth**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- trgovina.ts:226-236 potrjeno dobesedno, help 231, explainer 232-235. Razmejitev proti annualWriteOffEUR (zaloge_trgovina) je vsebinsko smiselna: eno meri ČAS popravljanja prevzema, drugo VREDNOST kasnejšega odpisa — različna narava.
- **Predlog za izvedbo:** Brez sprememb.
- *Vir:* Dodatek D.3 (nepreverljivo proti izvirniku)

**stockCountHoursPerYear**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- trgovina.ts:238-247 in compute() 285-291 (natančno: valueEUR na 287, hoursPerMonth na 288) potrjeno dobesedno. Dodatno preverjeno proti src/lib/plausibility.ts:61-62, ki neodvisno deli h/leto polja z 12 pri seštevanju mesečne kapacitete zaposlenih — isto načelo (deljenje letnih ur z 12 za primerljivost) je torej dosledno uporabljeno na dveh neodvisnih mestih v kodi, kar dodatno potrjuje, da gre za namerno, ne naključno pravilno rešitev.
- *Popravek preverbe:* Trditev okrepljena z neodvisnim navzkrižnim virom (plausibility.ts:61-62), ki isto konvencijo (h/leto ÷ 12) uporablja ločeno od tega modula.
- **Predlog za izvedbo:** Brez sprememb.
- *Vir:* Dodatek D.4 (nepreverljivo proti izvirniku)

**warehouseOvertimeHoursPerMonth**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- trgovina.ts:249-258 potrjeno dobesedno. Stik s SKLADISCE_CAUSES vzrokom 'Konice naročil in sezona' vpliva le na addressableShare (delež), ne na sam EUR znesek postavke — ni dvojnega štetja denarja, kot pravilno ugotavlja izvirna trditev.
- **Predlog za izvedbo:** Brez sprememb.
- *Vir:* Dodatek D.4 (nepreverljivo proti izvirniku)

**mainCause (skladisce_trgovina, SKLADISCE_CAUSES)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- trgovina.ts:175-181 (SKLADISCE_CAUSES) in :259 (mainCauseField klic) potrjeno dobesedno. addressableShare.ts:28-34 potrjuje delež 'data'=0.75. Opažena nejasnost pri kategorizaciji 'Prevzemi se ne knjižijo sproti' kot 'data' je razumna (gre za podatkovno disciplino, ne o fizičnem procesu) in znotraj priznane kalibracijske negotovosti (addressableShare.ts:11-12: 'začetne ocene iz specifikacije, ne empirija').
- **Predlog za izvedbo:** Brez sprememb — opažanje je preveč mehko za konkreten popravek.
- *Vir:* Dodatek E.1 (nepreverljivo proti izvirniku)

**skladisceTrgovina.compute()**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- trgovina.ts:261-292 potrjeno dobesedno: vse tri postavke v bucket 'capacity', context.operationalHourCostEUR kot osnova. Formula v content/methodology.ts:113-118 (natančno formula na vrstici 115: '(iskanje blaga + nadure) × strošek skladiščne ure × 12; ročno urejanje prevzemov × strošek skladiščne ure × 12; inventure (h/leto) × strošek skladiščne ure') se ujema z dejansko kodo compute() brez neskladja.
- *Popravek preverbe:* Sklic na content/methodology.ts preverjen in točen (formula na vrstici 115, ne natanko 113-118, a gre za isti objektni vnos).
- **Predlog za izvedbo:** Brez sprememb.
- *Vir:* —

**skladisceTrgovina.pantheon**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- trgovina.ts:293-297 potrjeno dobesedno. Prekrivanje z zaloge_trgovina.pantheon obravnavano ločeno (glej postavko o zalogeTrgovina.pantheon[2] spodaj) — tam potrjeno in konkretiziran popravek.
- **Predlog za izvedbo:** Brez sprememb na tem mestu (glej ločen predlog za zaloge_trgovina.pantheon[2]).
- *Vir:* pogl. 5.4-5.5 (nepreverljivo proti izvirniku)

**zalogeTrgovina.pantheon[2]: 'Skladišča, lokacije, serije in roki uporabnosti' — prekrivanje z skladisceTrgovina.pantheon[0]**
- Verdikt: **IZBOLJSAJ** · Teža: nizka · Preverba: potrjeno
- trgovina.ts:403 potrjeno dobesedno ('Skladišča, lokacije, serije in roki uporabnosti') in trgovina.ts:294 potrjeno dobesedno ('Vodenje skladiščnih mest in lokacij') — beseda 'lokacije' se res podvaja. Preverjeno tudi, da to nikoli ne pripelje do podvojenega prikaza v enem poročilu: salesPlaybook.ts:131-132 potrjuje, da buildRecommendation izbere pantheon alineje SAMO iz področja z NAJVEČJO postavko (`[...report.measured].sort((a,b)=>b.totalEUR-a.totalEUR)[0]`) — torej je prekrivanje res le kozmetično, ne funkcionalno.
- *Popravek preverbe:* Trditev in konkreten predlog besedila potrjena, dodatno okrepljena z dokazom (salesPlaybook.ts:131-132), da je učinek res le kozmetičen (izbira 'največja postavka' prepreči podvojen prikaz).
- **Predlog za izvedbo:** Preoblikovati v 'Serije, lotna sledljivost in roki uporabnosti po artiklu' — brez besede 'lokacije' — da alineja jasno pripada zalogi (rok/serija), ne skladišču (lokacija).
- *Vir:* pogl. 5.4, 5.6 (nepreverljivo proti izvirniku)

### 4.4 zaloge_trgovina — Zaloge, nekurantnost in izpad prodaje

**zaloge_trgovina — triage: 'Kako pogosto imate hkrati preveč zaloge in premalo tistega, kar kupec res naroči?'**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- trgovina.ts:315-323 potrjeno dobesedno. Dvostranski problem je pravilno ujet v eno vprašanje, skladno s header komentarjem modula (313: 'dva nasprotna problema hkrati').
- **Predlog za izvedbo:** Brez sprememb.
- *Vir:* pogl. 5.6 (nepreverljivo proti izvirniku)

**inventoryValueEUR**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- trgovina.ts:326-335 potrjeno: polje nima allowUnknown. Primerjava z maloprodaja.ts:250-259 potrjena dobesedno — tam je allowUnknown: true na vrstici 255. Prag konteksta trgovina.ts (contexts/trgovina.ts:114: 'min: 400_000') potrjen dobesedno. Razlaga (veleprodaja nad 400.000 EUR prihodka ima praviloma redno knjigovodstvo) je verjetna, a ostaja nepotrjena domneva avtorja kode — v komentarjih polja ni izrecne obrazložitve, zakaj allowUnknown manjka ravno tu.
- *Popravek preverbe:* Vsi linijski in vsebinski sklici držijo. Verdict ostaja 'ohrani', ker gre pri odsotnosti allowUnknown kvečjemu za vprašanje, ne za dokazano napako.
- **Predlog za izvedbo:** Ni nujen popravek kode. Priporočilo: v PR/reviewu pri lastniku modula eksplicitno potrditi, ali je odsotnost allowUnknown namerna odločitev (velja) ali spregled pri kopiranju vzorca iz proizvodnja.ts/maloprodaja.ts.
- *Vir:* pogl. 5.6 'Vrednotenje in odpisi' (IAS 2) — nepreverljivo proti izvirniku raziskave, a interno konsistentno

**annualWriteOffEUR**
- Verdikt: **IZBOLJSAJ** · Teža: visoka · Preverba: potrjeno
- trgovina.ts:337-343 potrjeno dobesedno: polje NIMA ne help, ne explainer, ne allowUnknown — natanko trije elementi manjkajo, kot trdi ugotovitev (preverjeno z branjem celotnega bloka polja, ne le grep). To je edino stroškovno polje v obeh pregledanih modulih (skladisce_trgovina, zaloge_trgovina) brez help besedila, kar krši lastno pravilo datoteke (trgovina.ts:22-24: 'Meje so zapisane v besedilih help, ne le v komentarjih — obiskovalec je edini, ki jih lahko upošteva pri vnosu.'). Enosmerna povezava je potrjena: odprema_trgovina.annualReturnedGoodsLossEUR (trgovina.ts:472, help besedilo dobesedno preverjeno) kaže SEM ('Ležeča zaloga brez vračila sodi v področje Zaloge'), a annualWriteOffEUR tega ne potrdi nazaj. Primerjava z maloprodaja.ts:223-234 potrjena dobesedno: identično poimenovano polje tam ima help, explainer IN allowUnknown: true.
- *Popravek preverbe:* Trditev v celoti drži, vključno z vsemi linijskimi sklici. Brez popravka vsebine ugotovitve.
- **Predlog za izvedbo:** Dodati help: 'Po nabavni vrednosti. Brez vrednosti VRNJENEGA blaga, ki ni bilo prodano po polni ceni — ta sodi v področje Odprema. Če odpisov ne vodite ločeno, izberite "Ne vem".' Dodati explainer: 'Odpisi, razprodaje pod nabavno ceno in razvrednotenja zaradi nekurantnosti — brez vrednosti, ki jo že štejete pri vrnjenem blagu v Odpremi. Primer: 8.000 EUR odpisanega poteklega blaga + 4.000 EUR razprodanega pod ceno ≈ 12.000 EUR na leto.' Dodati allowUnknown: true (kind ostane number, tip polja se ne spreminja).
- *Vir:* pogl. 5.6 'Vrednotenje in odpisi'; Dodatek D.5 (nepreverljivo proti izvirniku); primerjava maloprodaja.ts:223-234 (preverjeno dobesedno)

**annualStockoutMarginLossEUR — zalogeTrgovina.compute() bucket 'directLoss' bi moral biti 'lostMargin'**
- Verdikt: **PREMAKNI** · Teža: visoka · Preverba: potrjeno
- Potrjeno in OKREPLJENO z dodatnim virom. trgovina.ts:385-390 potrjeno dobesedno: postavka 'Izgubljena marža zaradi manjkajočega blaga' je v bucket 'directLoss'. moduleTypes.ts:20-29 potrjeno dobesedno: 'lostMargin' = 'Marža, ki je podjetje ni zaslužilo, čeprav bi jo lahko: prazna polica, odpovedano naročilo, prodaja po napačni ceni... Trditvi imata različno težo dokaza...prvi ugovor...podre tudi tisti del zneska, ki je dokazljiv.' Ime in help polja ('Samo marža, ki je niste zaslužili', trgovina.ts:350-355) so skoraj dobesedni parafrazi definicije koša 'lostMargin', ne 'directLoss'. NOV, neodvisen dokaz: maloprodaja.ts:161-174 ima STRUKTURNO IDENTIČEN primer — 'Nezaslužena marža zaradi praznih polic' (isti pojav: stockout/prazna polica) je tam PRAVILNO v bucket 'lostMargin' (vrstica 166), z eksplicitnim komentarjem 'Formula raziskave (F01)'. To je torej dokazljivo nedosledna raba med dvema panožnima moduloma za isti tip postavke, ne le teoretična nejasnost. ResultsSummary.tsx:70-76 potrjeno: bucket 'lostMargin' se izriše ločeno kot 'Nezaslužena letna marža' z opombo 'Ni odtekel denar, zato je prikazana ločeno' — natančno besedilo, ki bi moralo veljati za to postavko, a danes ne velja, ker je narobe uvrščena v hero znesek 'Neposredni letni stroški' (ResultsSummary.tsx:58-62, DEFAULT_DIRECT_LOSS_NOTE na vrstici 14: 'Denar, ki dejansko odteka, ne izgubljen čas.').
- *Popravek preverbe:* Ugotovitev je bila že pravilna; dodan je nov, neodvisen navzkrižni dokaz (maloprodaja.ts:161-174), ki isto vrsto postavke pravilno uvršča v 'lostMargin' in s tem dokazuje, da gre za nedoslednost med moduli, ne le za teoretično interpretacijo definicije koša.
- **Predlog za izvedbo:** Spremeniti trgovina.ts:386 iz bucket: 'directLoss' v bucket: 'lostMargin'. Vprašanje, help in explainer ostanejo nespremenjeni. Dodatno priporočilo za ločen (izven-obsežni) popravek: enak vzorec napake obstaja pri annualPricingMarginLossEUR v narocila_trgovina (trgovina.ts:159-163) — help besedilo modula ('prodaja po napačni ceni') je dobesedno našteto v definiciji 'lostMargin' (moduleTypes.ts:22), a postavka je prav tako v 'directLoss'. To ni v uradnem obsegu tega pregleda (skladisce_trgovina + zaloge_trgovina), zato ga navajam kot ločeno opozorilo za reviewerja modula narocila_trgovina, ne kot del tega popravka.
- *Vir:* moduleTypes.ts:20-29 (preverjeno dobesedno); ResultsSummary.tsx:14,58-76 (preverjeno dobesedno); maloprodaja.ts:161-174 (nov, neodvisen navzkrižni dokaz, preverjeno dobesedno); pogl. 5.6 (nepreverljivo proti izvirniku raziskave)

**reducibleShare (reducibleShareField) — 'Ne vem' pade na isti delež kot 'Do 5 %' (0,05), namesto na 0**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: ovrzeno
- OVRŽENA TRDITEV — preverjeno proti kodi z eksplicitno protidokazano izjavo v komentarjih. shared.ts:59 potrjuje REDUCIBLE_SHARES = [0.05, 0.08, 0.15, 0.22, 0.05], a shared.ts:55-57 vsebuje NEPOSREDEN komentar, ki to razloži kot NAMERNO odločitev: '"Ne vem" pade na isti konservativni delež kot "Do 5 %"' — 0,05 je NAJNIŽJA (najbolj konservativna) vrednost v celotnem razponu (0,05–0,22), ne poljubna vrednost. Ključna napaka izvirne ugotovitve: trdi, da 'izbirno polje te zaščite nima' v primerjavi z UNKNOWN_ANSWER mehanizmom za številčna polja — to je NAPAČNO. moduleTypes.ts:78-79 (FieldChoice.unknown) izrecno pravi: '"Ne vem" — vrednost je konservativna privzeta ocena, ne uporabnikov podatek. ZNIŽUJE OZNAKO ZANESLJIVOSTI REZULTATA.' To ni prazna obljuba: potential.ts:172,197,207,238 dejansko šteje unknownAnswers pri VSAKEM izbirnem polju z unknown:true (torej tudi pri reducibleShare) in ta števec neposredno prepreči najvišjo oznako 'Visoka zanesljivost' (potential.ts:238: `if (noneEstimated && unknownAnswers === 0 && ...) return 'high'`) — z izbiro/privzetkom 'Ne vem' rezultat pade na kvečjemu 'Srednja zanesljivost' (ResultsSummary.tsx:22-26: 'Del vrednosti je iz izbranih razponov ali privzetih ocen'), kar je viden badge na vrhu poročila. Poleg tega salesPlaybook.ts:90-95 generira prodajno vprašanje prav za vsak 'Ne vem' odgovor ('kdo v podjetju to ve? ... izračun je zato vzel najkonservativnejšo vrednost'). Signal torej OBSTAJA — na ravni celotnega poročila, ne na ravni posamezne kartice. Predlagani popravek (spremeniti na 0) bi dejansko KRŠIL raziskovalno pravilo, ki ga izvirna ugotovitev sama citira ('teže niso diskont koristi, so komunikacijski signal') — sprememba na 0 bi 'Ne vem' spremenila v trditev 'ni sprostljivega kapitala', kar je oblika lažne natančnosti v nasprotni smeri (privzeto ničlo namesto priznane negotovosti), medtem ko trenutna rešitev negotovost prenese v ločen, dokumentiran kanal zanesljivosti.
- *Popravek preverbe:* Prvotna ugotovitev (severity 'visoka', verdict 'izboljsaj', predlog spremembe REDUCIBLE_SHARES[4] na 0) je OVRŽENA: v kodi obstaja dokumentiran, delujoč mehanizem, ki 'Ne vem' izbiro šteje in znižuje oznako zanesljivosti rezultata (potential.ts, moduleTypes.ts:78-79, salesPlaybook.ts:90-95) — natanko tista zaščita, za katero je izvirna ugotovitev trdila, da je ni. Verdict spremenjen v 'ohrani' za jedro logike; severity znižana na 'nizka'; ostane le majhen, ločen predlog za doslednejši prikaz (najmanj-predpona) na kartici 'Sprostljiv obratni kapital'.
- **Predlog za izvedbo:** Ni potreben popravek REDUCIBLE_SHARES ali reducibleShareOf(). NAJDENA JE ena manjša, resnično obstoječa nedoslednost, precej nižje teže: kartica 'Sprostljiv obratni kapital' v ResultsSummary.tsx:86-96 pri izrisu NE uporablja funkcije amount() (ki pri confidence==='low' doda predpono 'najmanj ...'), ampak neposredno formatEUR(totals.oneTimeCapitalEUR) — v nasprotju s kartico 'Neposredni letni stroški', ki predpono dobi. To je manjša UI nedoslednost, ne napaka v izračunu ali metodološka kršitev. Predlog: v ResultsSummary.tsx pri kartici 'Sprostljiv obratni kapital' uporabiti isto amount()-logiko kot pri ostalih kartic, da tudi ta znesek pri nizki zanesljivosti dobi predpono 'najmanj'.
- *Vir:* shared.ts:55-57 in moduleTypes.ts:78-79 (izrecen, dokumentiran design rationale — preverjeno dobesedno); potential.ts:172-238 (preverjeno dobesedno, mehanizem deluje); pogl. 10.1-10.2 (nepreverljivo proti izvirniku, a citirano pravilo dejansko podpira OBSTOJEČO kodo, ne predlagani popravek)

**stockVisibility (zaloge_trgovina, contextOnly) — podvaja stockAccuracy (diagnostika_trgovina)**
- Verdikt: **ODSTRANI** · Teža: srednja · Preverba: potrjeno
- Potrjeno dobesedno. trgovina.ts:361-372 (stockVisibility, 4 izbire) in trgovina.ts:664-669 (diagnostika_trgovina.stockAccuracy, izbire iz ASSURANCE_CHOICES) res merita zelo podobno vsebino (pregled/zanesljivost stanja zaloge). Preverjeno tudi, da stockAccuracy DEJANSKO vstopa v izračun: trgovina.ts:693 (`riskLevelFromScore(input.stockAccuracy + input.knowsItemMargin, 6)`), medtem ko je stockVisibility contextOnly in računsko inertno — edina vrednost je rezervna prodajna iztočnica v buildOpeningQuestions (salesPlaybook.ts:104-115, preverjeno), ki se sproži le, ko drugih iztočnic ni. To vlogo za zaloge_trgovina delno prevzemata že mainCause (ZALOGE_CAUSES vsebuje 'Stanje zalog v sistemu ni zanesljivo', trgovina.ts:304, potrjeno dobesedno) in stockAccuracy sam.
- *Popravek preverbe:* Trditev in vsi linijski sklici držijo dobesedno. Brez popravka vsebine.
- **Predlog za izvedbo:** Odstraniti polje 'stockVisibility' iz zaloge_trgovina (trgovina.ts:361-372). Če je kontekst o mešanici sistemov (ERP/Excel) specifično za zalogo potreben za prodajno iztočnico, naj se preseli v diagnostika_trgovina kot dodatna izbira ob stockAccuracy.
- *Vir:* Dodatek D.5, D.9 (nepreverljivo proti izvirniku, a notranja logika drži)

**mainCause (zaloge_trgovina, ZALOGE_CAUSES) — vzrok 'Zalogo zavestno držimo kot varovalko' kategoriziran kot 'people' namesto 'planning'**
- Verdikt: **IZBOLJSAJ** · Teža: srednja · Preverba: popravljeno
- Potrjeno dobesedno in OKREPLJENO. trgovina.ts:307 potrjeno: `{ label: 'Zalogo zavestno držimo kot varovalko', category: 'people' }`. addressableShare.ts:20-21 potrjuje opis kategorije 'people' = 'Odgovornosti, usposabljanje, delovna disciplina' — zavestna varnostna zaloga ni posledica pomanjkljive discipline. Še pomembneje: addressableShare.ts:18-19 opisuje 'planning' = 'Planiranje, zaloge, vidnost nalogov' — beseda 'ZALOGE' je DOBESEDNO del definicije kategorije 'planning', kar izvirna ugotovitev ni izpostavila, a dodatno in močneje utemeljuje njen predlog. Sprememba severity iz 'nizka' v 'srednja': addressableShare.ts:29-31 potrjuje, da gre za razliko med 0,45 (people) in 0,65 (planning) — 44-odstotna relativna razlika v naslovljivem deležu, ki neposredno vpliva na prikazan 'Realistični potencial izboljšave' za vsako stranko, ki izbere ta vzrok kot glavni. To ni kozmetična razlika.
- *Popravek preverbe:* Trditev in predlog potrjena. Severity zvišana iz 'nizka' v 'srednja', ker gre za merljivo (44 %) razliko v addressableShare, ki neposredno vpliva na prikazan potencial pri tej izbiri — ne le za kozmetično kategorizacijo. Dodan močnejši dokaz: beseda 'zaloge' je dobesedno v definiciji kategorije 'planning'.
- **Predlog za izvedbo:** V trgovina.ts:307 spremeniti category: 'people' v category: 'planning'.
- *Vir:* pogl. 5.6 'Napovedovanje in bullwhip' (nepreverljivo proti izvirniku); addressableShare.ts:15-34 (preverjeno dobesedno, interno najmočnejši argument)

**zalogeTrgovina.compute() — 'Odpisi in nekurantna zaloga' (directLoss) in izključitev oneTimeCapital iz addressableShare**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- trgovina.ts:378-397 potrjeno dobesedno. 'Odpisi in nekurantna zaloga' pravilno v 'directLoss' (dejansko knjižena izguba, ne predpostavka o vedenju kupca — ustreza moduleTypes.ts:24-27). 'Sprostljiv obratni kapital' pravilno BREZ addressableShare polja (komentar 392-393). Dodatno preverjeno: potential.ts uvozi ANNUAL_BUCKETS iz moduleEngine.ts:140 = ['directLoss', 'lostMargin', 'capacity'] — 'oneTimeCapital' res ni vključen, kar potrjuje, da computePotentialRange te postavke ne šteje dvakrat.
- *Popravek preverbe:* Trditev okrepljena z dobesednim navedkom moduleEngine.ts:140 (ANNUAL_BUCKETS definicija).
- **Predlog za izvedbo:** Brez sprememb.
- *Vir:* —

**[dodaj] Primerjava DIO / obrati zaloge s panožnim povprečjem — informativna dopolnitev k reducibleShareField (ne nova obvezna postavka)**
- Verdikt: **DODAJ** · Teža: nizka · Preverba: potrjeno
- Preverjeno, da predlog ne podvaja obstoječega modula: grep po celotnem imeniku config/modules in config/contexts po 'DIO', 'obrat zalog', 'inventory turn', 'dnevi zalog' ni vrnil nobenega zadetka razen nepovezanih komentarjev o sredini pasu — noben od petih panožnih modulov niti pet horizontal segmenta trgovina danes ne računa ali prikazuje DIO/obrata zaloge. Compute signature res sprejema samo (input) => (trgovina.ts:375), context ni na voljo znotraj zalogeTrgovina.compute(), kot trdi predlog. ModuleDefinition.usesRevenue in usesMargin obstajata v shemi (moduleTypes.ts:241,248), zato je predlagan mehanizem (razširitev compute na (input, context) in dodatek usesRevenue/usesMargin) sheme skladen. Predlog ne dodaja novega VPRAŠANJA uporabniku (le informativni prikaz iz že zbranih podatkov), zato merilo 'odgovorljivo v 30 sekundah' ni neposredno relevantno.
- *Popravek preverbe:* Predlog potrjen kot ne-podvajajoč (preverjeno z grep po celotni kodni bazi modulov in kontekstov). Opozorilo: konkretna referenčna številka '45,6 dni (APQC)' iz izvirne ugotovitve je zunanji podatek, ki ga v repozitoriju ni mogoče preveriti — pred implementacijo naj razvijalec preveri vir te številke neposredno pri raziskovalnem dokumentu, ne privzame je za točno.
- **Predlog za izvedbo:** Razširiti compute: (input, context) => {...} in ob obstoječi izbiri reducibleShare prikazati dodatno informativno vrstico 'Vaš DIO: pribl. X dni, panožna mediana pribl. 46 dni' kot podporo (obiskovalec svojo oceno še vedno izbere sam, brez showIf logike). Zahteva usesRevenue: true, usesMargin: true v ModuleDefinition ter nov vnos v content/methodology.ts. Dolgoročni, ne nujen predlog.
- *Vir:* pogl. 5.6, Dodatek D.5, pogl. 8.3 (nepreverljivo proti izvirniku); DIO vrednost 45,6 dni (APQC) v repozitoriju ni preverljiva

### 4.5 terjatve_trgovina — Plačilni roki in terjatve

**terjatveTrgovina.triage.prompt: 'Kako pogosto kupci plačajo po dogovorjenem roku?' (trgovina.ts:547-555)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Štiristopenjska lestvica 0-3 je skladna z vzorcem ostalih modulov, ne vstopa v compute() in služi le izboru/prednosti v triaži ter privzeti izbiri v segments.ts:147-150 (terjatve_trgovina je ena od treh privzeto obkljukanih postavk). Vprašanje je odgovorljivo v nekaj sekundah in ne podvaja nobenega drugega polja.
- *Popravek preverbe:* Preverjeno dobesedno v kodi: trgovina.ts:548-555 vsebuje natanko ta prompt s štirimi opcijami (0-3). segments.ts:147-150 potrjuje, da je 'terjatve_trgovina' del defaultIds: ['zaloge_trgovina', 'narocila_trgovina', 'terjatve_trgovina']. Ni napačnih sklicev, popravek ni potreben.
- *Vir:* Dodatek D.8 — terjatve so navedene kot eno od visoko informativnih področij za veleprodajo.

**currentDSODays ('Kolikšen je povprečen dejanski plačilni rok kupcev (DSO)?', trgovina.ts:557-568, contextOnly) skupaj z overdueDaysAverage ('Za koliko dni povprečno kupci prekoračijo dogovorjeni plačilni rok?', trgovina.ts:571-581, vstopa v compute())**
- Verdikt: **IZBOLJSAJ** · Teža: visoka · Preverba: popravljeno
- compute() (trgovina.ts:604,610) uporablja dailyRevenue × overdueDaysAverage × capitalCostRate, kar je STRUKTURNO skladno s formulo raziskave 'Presežne terjatve = kreditna prodaja/365 × max(dejanski DSO − dosegljivi DSO, 0)' (pogl. 5.9) — matematika je pravilna. Težava je v ARHITEKTURI VNOSA: currentDSODays je contextOnly in v izračun nikoli ne vstopi (potrjeno s testom trgovina.test.ts:203-209,323-325 'currentDSODays je 60 in je contextOnly'), njegov lastni help pa obljublja 'primerjavo z dogovorjenim rokom' (trgovina.ts:564), čeprav dogovorjeni rok NIKJER v modulu ni vprašan — obljuba je torej neizpolnljiva. Hkrati explainer overdueDaysAverage (trgovina.ts:579-580) obiskovalca eksplicitno napoti: 'Če poznate DSO, od njega odštejte povprečen dogovorjen rok' — orodje torej ŽE PRIČAKUJE to odštevanje, a ga prepusti obiskovalcu v glavi, brez podpore in brez navzkrižne kontrole. Napaka pri tem koraku (npr. vnos celotnega DSO namesto le prekoračitve) neposredno popači hero znesek directLossEUR.
- *Popravek preverbe:* Jedro ugotovitve je DOBESEDNO potrjeno: trgovina.ts:557-568 (currentDSODays, contextOnly:true, help pravi 'služi za primerjavo z dogovorjenim rokom'), trgovina.ts:571-581 (overdueDaysAverage, explainer pravi 'Če poznate DSO, od njega odštejte povprečen dogovorjen rok'), compute() na trgovina.ts:604-611 res uporablja samo overdueDaysAverage. Grep po 'dogovorjen' v modules/trgovina.ts pokaže, da 'dogovorjeni rok' ni NIKJER vprašan kot lastno polje — potrjeno. Test trgovina.test.ts:194-208 in :320-326 obstajata in dobesedno vsebujeta navedeno besedilo. DVE DOPOLNITVI, ki ju izvirna ugotovitev izpusti: (1) IDENTIČEN vzorec (currentDSODays contextOnly + overdueDaysAverage neposreden vnos, brez agreedPaymentTermDays polja) obstaja tudi v config/modules/splosno.ts (vrstice ~379-405, dobesedno isto besedilo explainerja) IN v legacy.ts moduleD (vrstica 207, drugačna formula prek targetReductionDays). Popravek torej ni osamljen primer trgovine — če se izvede, ga je smiselno usklajeno izvesti vsaj še v splosno.ts, sicer nastane ravno neskladje, pred katerim svari komentar v shared.ts ('dve številki bi se ob prvi kalibraciji razšli'). (2) Če se predlog izvede, je treba PRENOVITI obstoječa testa: trgovina.test.ts:194-208 (komentar 'currentDSODays je 60 in je contextOnly' postane neresničen, ker bo currentDSODays vstopil v formulo) in twist-scenarij na :320-326 (trenutno eksplicitno preverja, da currentDSODays NE spremeni izida — po popravku bi moral). Brez te opombe bi razvijalec popravek izvedel, testi pa bi rdeče javili navidezno nepovezan neuspeh. Formula in številke polj (ostane 5) so pravilno preverjene.
- **Predlog za izvedbo:** Odstrani ločen neposreden vnos overdueDaysAverage in ga v compute() IZPELJI: dodaj novo polje `agreedPaymentTermDays` — label 'Kolikšen je povprečen dogovorjeni plačilni rok, ki ga odobrite kupcem?', kind: 'number', unit: 'dni', default: 30, help: 'Rok, zapisan na računu ali v pogodbi — ne dejanski čas plačila. Če imate več rokov, vpišite prevladujočega.', explainer: 'Standarden plačilni rok, ki ga podjetje vnaprej določi kupcu — najpogosteje 30, 60 ali 90 dni; najdete ga v splošnih pogojih prodaje.' Polju currentDSODays odstrani contextOnly (postane resničen vnos v formulo) in dodaj allowUnknown: true (help: 'Če DSO ne poznate natančno, izberite Ne vem — v izračun vstopi kot 0 dni prekoračitve, ne kot ugibana številka'). compute(): `const overdueDaysAverage = Math.max(input.currentDSODays - input.agreedPaymentTermDays, 0)`. Skupno število polj modula ostane 5 (znotraj omejitve 5-6, varovane testom trgovina.test.ts:276-280).
- *Vir:* Poglavje 4.3 (CCC formula), poglavje 5.9 'Sprostitev terjatev' (Presežne terjatve/Letni strošek presežnih terjatev), Dodatek D.8 vrstica 'Kakšni so povprečni pogodbeni rok, dejanski DSO in cilj?'

**dunningHoursPerMonth ('Koliko ur mesečno porabite za opominjanje, usklajevanje odprtih postavk in izterjavo?', trgovina.ts:582-592)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Bucket 'capacity' in pravilno letno seštevanje (× MONTHS_PER_YEAR, trgovina.ts:616) sta skladna s pravilom 'prihranek časa ni prihranek plače'. Help eksplicitno izključi ure reševanja reklamacij (Odprema) — meja proti sosednjemu področju drži v obe smeri, saj odpremaTrgovina.claimHandlingHoursPerMonth (trgovina.ts:478-488) prav tako opisuje SVOJ obseg brez sklica na terjatve. Direkten vnos ur (namesto 'število opominov × minute na opomin') je tu ustreznejši, ker izterjava ni sestavljena iz enakomernih diskretnih dogodkov (klici, spremljanje več odprtih postavk hkrati) — explainer že ponuja metodo 'ljudje × ure na teden × 4,3', kar je za to aktivnost naravnejše kot štetje dogodkov.
- *Popravek preverbe:* Vse vrstice in besedila dobesedno preverjena: trgovina.ts:582-592 (dunningHoursPerMonth, bucket capacity na :614-619), trgovina.ts:478-488 (claimHandlingHoursPerMonth v odpremaTrgovina, ločen obseg). Meja med moduloma je res zapisana simetrično v obeh help besedilih. Popravek ni potreben.
- *Vir:* Dodatek D.8 — 'Koliko opominov in IOP pripravite ter koliko časa porabite? | količina + ure | kapaciteta'.

**annualBadDebtEUR ('Kolikšna je bila v zadnjih 12 mesecih vrednost odpisanih ali neizterljivih terjatev?', trgovina.ts:593-599)**
- Verdikt: **IZBOLJSAJ** · Teža: srednja · Preverba: popravljeno
- Polje nima ne help ne explainer (dopustno po pravilu, saj brez help explainer ni obvezen) in nima allowUnknown, čeprav gre po naravi natanko za tip zneska, ki ga moduleTypes.ts:161-167 opisuje kot kandidata za 'ne vem' ('odpis, manko, neizterjani rabati'). V maloprodaja.ts ima skoraj identično polje annualWriteOffEUR (odpisi) allowUnknown: true (maloprodaja.ts:223-229) — trgovina.ts pri nobenem od svojih EUR/leto polj te zastavice nima, kar je nedoslednost znotraj iste aplikacije. Manjka tudi meja proti sosednjemu polju overdueDaysAverage: brez pojasnila lahko obiskovalec zapadlo, a še pričakovano terjatev pomotoma šteje enkrat kot 'prekoračitev' in drugič kot 'odpis'.
- *Popravek preverbe:* Jedro drži: trgovina.ts:593-599 (annualBadDebtEUR) res nima help/explainer/allowUnknown, moduleTypes.ts:161-167 res eksplicitno navaja 'odpis, manko, neizterjani rabati' kot primer za allowUnknown, maloprodaja.ts:223-229 res ima allowUnknown:true na annualWriteOffEUR. ŠTEVILSKA NAPAKA: trditev 'pri NOBENEM od svojih šestih EUR/leto polj' je napačna — grep po "unit: 'EUR/leto'" v trgovina.ts vrne SEDEM zadetkov (annualPricingMarginLossEUR:120, annualWriteOffEUR:341, annualStockoutMarginLossEUR:348, annualRedeliveryCostEUR:447, annualCreditNoteEUR:458, annualReturnedGoodsLossEUR:470, annualBadDebtEUR:597), ne šest; osmo denarno polje (inventoryValueEUR:329) ima unit 'EUR' (stanje, ne letni tok) in je pravilno izvzeto iz te primerjave. Sklep ostaja pravilen (nobeno od teh sedmih res nima allowUnknown), le število v rationale popravi na 'sedmih'.
- **Predlog za izvedbo:** Dodaj allowUnknown: true. Dodaj help: 'Samo dokončno odpisane ali sodno/izvensodno potrjene neizterljive terjatve — zapadle, a še pričakovane postavke so že zajete v prekoračitvi plačilnega roka zgoraj.' Dodaj explainer: 'Terjatev, za katero ste izgubili upanje na plačilo (stečaj kupca, neuspešna izterjava, knjigovodski odpis). Ne vključujte terjatev, ki so le zapadle in jih še pričakujete.'
- *Vir:* Dodatek D.8 — 'Kolikšni so odpisi in zunanji stroški izterjave? | EUR/leto | neposredni strošek'; poglavje 8.5 KPI 'bad debt rate'.

**mainCause (TERJATVE_CAUSES, trgovina.ts:533-539,600)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Pet vzrokov je smiselno razporejenih po kategorijah naslovljivosti (planning/data/planning/external) in dobro pokrivajo taksonomijo raziskave — 'opominjanje ni sistematično' in 'bonitete se ne preverjajo' ustrezata RULE/PROCESS-tipu vzrokov, 'plačilna disciplina na trgu' pa CUSTOMER/MARKET-tipu z ustrezno nizkim naslovljivim deležem (0,25). Standardni shared mehanizem (addressableShare.ts) je pravilno uporabljen, brez podvajanja indeksov.
- *Popravek preverbe:* Kategorije in deleži so dobesedno preverjeni v addressableShare.ts: CauseCategory je 'data'|'planning'|'people'|'external'|'physical'|'unknown' z deleži {data:0.75, planning:0.65, people:0.45, external:0.25, physical:0.15, unknown:0.3}. TERJATVE_CAUSES (trgovina.ts:533-539) ima kategorije planning/data/data/planning/external — 'plačilna disciplina na trgu' je res 'external' (0,25), kot navaja rationale. POJASNILO (ne napaka): oznake 'RULE/PROCESS' in 'CUSTOMER/MARKET' v rationale/researchRef so imena iz zunanje raziskovalne taksonomije (Dodatek E.1) in NISO dobesedni identifikatorji v kodi — koda uporablja 'planning'/'external', ne 'RULE'/'MARKET'. Za razvijalca, ki bere to poročilo brez raziskovalnega dokumenta, velja pojasniti, da gre za konceptualno ujemanje, ne za citat iz kode. Mehanizem addressableShareOf je uporabljen standardno, brez podvajanja indeksov — potrjeno.
- *Vir:* Dodatek E.1 — taksonomija vzrokov RULE, PROCESS, CUSTOMER, MARKET.

**terjatveTrgovina.compute() — bucket 'directLoss' za 'Strošek zamud pri plačilih' (trgovina.ts:607-611)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Gre za oportunitetni/finančni strošek kapitala, ne za dobesedno gotovino, ki fizično odteče — vprašanje je bilo, ali to res sodi v directLoss ('trdi denar, ki odteka', moduleTypes.ts:18-19) ali bliže lostMargin (šibkejši dokaz). Odločitev je bila zavestna in testirana: methodology.ts:131-136 eksplicitno pojasni razliko med celotnim DSO in samo prekoračitvijo, isti vzorec (letni strošek kapitala kot directLoss) uporablja tudi legacy moduleC/D, primerjalni test pa to skladnost varuje (moduleEngine.test.ts LEGACY_TRGOVINA). Sprejemljivo, ker gre za PONAVLJAJOČ se strošek (vsako leto nastane nov krog prekoračitev), za razliko od zaloge, kjer je sprostitev kapitala enkratna — to razliko modul pravilno upošteva (terjatve nimajo oneTimeCapital postavke, ker gre za tekoč proces, ne za enkratno stanje).
- *Popravek preverbe:* content/methodology.ts:131-136 dobesedno vsebuje navedeno besedilo ('Šteje se samo prekoračitev NAD dogovorjenim rokom... če bi šteli celoten DSO, bi bil znesek videti večji, a bi ga vsak finančnik takoj zavrnil'). Bucket 'directLoss' je res uporabljen v legacy.ts moduleC (zaloge, vrstica ~185) in moduleD (denarni tok, vrstica ~230) za letni strošek kapitala — DODATNA NATANČNOST: legacy moduleD uporablja DRUGAČNO formulo od terjatve_trgovina (currentDSODays × targetReductionDays × opportunityCostPercent, ne overdueDaysAverage), zato gre za skladnost v IZBIRI KOŠA (directLoss za letni kapitalski strošek), ne za identično formulo — rationale to ne trdi eksplicitno, a bi lahko bilo bolj natančno. Sklep (bucket directLoss je pravilna izbira) ostaja potrjen.
- *Vir:* Poglavje 4.4 (pet vrst ekonomskega učinka) in 4.5 (letni strošek financiranja kot ločena, a legitimna letna postavka).

**terjatveTrgovina.pantheon (3 alineje, trgovina.ts:628-632)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Tri konkretne funkcionalnosti (samodejni opomini, vidnost odprtih postavk ob naročilu, ZIERDED e-računi) neposredno naslavljajo tri postavke modula. Zanimiva navzkrižna povezava: tretja alineja prodajno prodaja ZIERDED-skladnost prav podjetjem, ki bi to najbolj potrebovala — a glej ločen zapis o Modulu E spodaj, kjer je razkritje ZIERDED tveganja tem istim (ne-PANTHEON) obiskovalcem strukturno skrito, kar ta prodajni argument oslabi.
- *Popravek preverbe:* trgovina.ts:628-632 vsebuje natanko te tri alineje, tretja se dobesedno glasi 'Izdaja e-računov skladno z ZIERDED, brez ročnega pošiljanja'. Navzkrižna povezava z gating problemom Modula E je pravilno prepoznana in podprta z neodvisno preverjenim dokazom (glej postavko o eInvoiceZierded spodaj).
- *Vir:* Poglavje 14 (preslikava bolečin na ekosistem Datalaba).

### 4.6 diagnostika_trgovina — Kratka diagnostika (vedno prikazana)

**diagnostikaTrgovina.stockAccuracy ('Ali se stanje zalog v sistemu ujema z dejanskim stanjem v skladišču?', trgovina.ts:663-669, default: 1)**
- Verdikt: **IZBOLJSAJ** · Teža: visoka · Preverba: potrjeno
- Skupaj s knowsItemMargin (default 1) da privzeto vsoto 2/6=0,33, kar riskLevelFromScore (shared.ts:47-52, prag 0,3/0,6) razvrsti kot 'medium' — obiskovalec, ki na tem koraku ni kliknil ničesar, dobi oceno 'Zanesljivost podatkov: srednje tveganje' brez enega samega potrjenega odgovora. To neposredno krši pravilo 'ni lažne natančnosti': orodje pripiše trditev o KONKRETNEM podjetju, ki je nihče ni potrdil. Kvalitativna oblika vprašanja (namesto številčnega KPI 'stock accuracy %') je sicer namerno in pravilno ohranjena — modul eksplicitno noče lažne natančnosti EUR zneska (trgovina.ts:650-657 komentar).
- *Popravek preverbe:* Dobesedno preverjeno: trgovina.ts:663-669, default:1, choices: ASSURANCE_CHOICES. shared.ts:47-52 potrjuje prag ratio<=0.3→low, <=0.6→medium (torej 2/6=0,33 res pade na 'medium'). DODATNA OTEŽUJOČA OKOLIŠČINA, ki jo original ne omeni: preverjeno v salesReport.ts:482-488, da funkcija isUntouchedNumeric EKSPLICITNO izključi 'choice' polja ('if (field.kind === choice ... return false'), zato se ta napačen privzetek NIKOLI ne pojavi niti v softness.untouchedFields niti (ker ASSURANCE_CHOICES nima nobene možnosti z unknown:true) v softness.unknownAnswers — napaka je torej popolnoma nevidna v CELOTNEM sistemu ocene zanesljivosti poročila, ne le v riskLevel izpisu. To dvigne utemeljenost ocene 'visoka' še dodatno.
- **Predlog za izvedbo:** Spremeni default na 0 ('Da, zanesljivo'), da neodgovorjen korak pokaže NAJBOLJŠO možno oceno namesto izmišljene srednje — glej skupni predlog pri diagnostikaTrgovina.compute() spodaj za popolnejšo (dolgoročno) rešitev s peto možnostjo 'Ne vem'.
- *Vir:* Poglavje 10.1-10.2 (razred zanesljivosti C/D za oceno brez dokazov) in Dodatek C — kontrolni seznam ('vsak vnos ima izvor... kjer je potreben').

**diagnostikaTrgovina.knowsItemMargin ('Ali poznate dejansko maržo po artiklu in po kupcu, z rabati in stroški dostave vred?', trgovina.ts:670-676, default: 1)**
- Verdikt: **IZBOLJSAJ** · Teža: visoka · Preverba: potrjeno
- Isti mehanizem in ista posledica kot pri stockAccuracy — privzetek 1 (ne 0) prispeva k lažni oceni 'medium' za dimenzijo 'Zanesljivost podatkov', ne da bi obiskovalec kar koli potrdil. Vsebinsko je vprašanje dobro naslovljeno (bruto/prispevna marža, rabati, stroški dostave vred — skladno z D.9 'Ali marža upošteva bonuse, transport, vračila in obdelavo?').
- *Popravek preverbe:* trgovina.ts:670-676 dobesedno potrjuje default:1, choices: ASSURANCE_CHOICES. Isti mehanizem in ista dodatna nevidnost prek isUntouchedNumeric velja tudi tu (glej opombo pri stockAccuracy).
- **Predlog za izvedbo:** Spremeni default na 0, glej skupni predlog pri compute() spodaj.
- *Vir:* Dodatek D.9 — 'Ali poznate bruto in prispevno maržo po artiklu, kupcu in naročilu?'

**diagnostikaTrgovina.shipmentTraceability ('Ali lahko za posamezno pošiljko zanesljivo ugotovite, kdo, kdaj in kaj je komisioniral?', trgovina.ts:677-683, default: 2)**
- Verdikt: **IZBOLJSAJ** · Teža: visoka · Preverba: potrjeno
- Skupaj s keyPersonIndependence (default 1) da privzeto vsoto 3/6=0,5, kar riskLevelFromScore razvrsti kot 'medium' za dimenzijo 'Procesna odpornost' — enak problem kot pri prvi dimenziji. Default 2 (od 4 stopenj 'Le približno') je pri tem polju še posebej agresiven, saj samo eno polje z visoko vrednostjo že potisne skupno oceno v medium ne glede na drugo polje.
- *Popravek preverbe:* trgovina.ts:677-683 dobesedno potrjuje default:2, choices: ASSURANCE_CHOICES (0=Da zanesljivo,1=Večinoma,2=Le približno,3=Ne). Matematika 3/6=0,5≤0,6→medium je pravilna.
- **Predlog za izvedbo:** Spremeni default na 0, glej skupni predlog pri compute() spodaj.
- *Vir:* Dodatek D.7 — 'Ali je primer povezan z izvirnim naročilom, lotom/serialom in dobaviteljem? | da/delno/ne | sledljivost'.

**diagnostikaTrgovina.keyPersonIndependence ('Ali skladišče in prodaja delujeta normalno tudi brez ključne osebe?', trgovina.ts:684-690, default: 1)**
- Verdikt: **IZBOLJSAJ** · Teža: visoka · Preverba: potrjeno
- Isti mehanizem kot zgoraj — prispeva k privzeti oceni 'medium' za 'Procesna odpornost' brez potrjenega odgovora obiskovalca.
- *Popravek preverbe:* trgovina.ts:684-690 dobesedno potrjuje default:1, choices: ASSURANCE_CHOICES. Popravek ni potreben.
- **Predlog za izvedbo:** Spremeni default na 0, glej skupni predlog pri compute() spodaj.
- *Vir:* Poglavje 5.12 (kadri) — odvisnost od ključne osebe kot procesno tveganje.

**diagnostikaTrgovina.compute() — riskLevelFromScore(stockAccuracy+knowsItemMargin,6) in riskLevelFromScore(shipmentTraceability+keyPersonIndependence,6) (trgovina.ts:692-698)**
- Verdikt: **IZBOLJSAJ** · Teža: visoka · Preverba: popravljeno
- Preverjeno z izračunom: privzetki (1,1,2,1) dajo dataLevel=riskLevelFromScore(2,6)=2/6=0,33 → 'medium' IN processLevel=riskLevelFromScore(3,6)=3/6=0,5 → 'medium'. Obiskovalec, ki na koraku diagnostike ne klikne ničesar, torej na OBEH dimenzijah dobi 'srednje tveganje' — natanko napaka, ki je po navedbah naročnika že potrjena pri drugih segmentih (isti vzorec defaultov 1/1/2/1 se dobesedno ponavlja v proizvodnja.ts, logistika.ts, maloprodaja.ts, storitve.ts, splosno.ts, racunovodstvo.ts — preverjeno z grep). Ker je diagnostika edini modul brez triaže (torej se VEDNO prikaže vsem, trgovina.ts:658-661), je izpostavljenost tej napaki 100-odstotna med vsemi obiskovalci trgovinskega segmenta.
- *Popravek preverbe:* Izračun in pragovi so dobesedno potrjeni (shared.ts:47-52: 0,3/0,6; trgovina.ts:692-698). RiskLevel je res izčrpno naštet kot Record<RiskLevel,...> v RiskCard.tsx, pdfKit.ts (RISK_LEVEL_LABEL, RISK_LEVEL_COLORS) in v trgovina.ts (DATA_RISK_NOTE, PROCESS_RISK_NOTE) — poseg v tip bi res zahteval spremembo na vseh teh mestih, dolgoročni predlog je torej realistično ocenjen glede obsega. VAŽNA POMANJKLJIVOST KRATKOROČNEGA PREDLOGA, ki jo je treba dodati: privzetek 0 na vseh štirih poljih NE odpravi problema lažne natančnosti, temveč samo OBRNE PRISTRANSKOST — namesto neupravičene ocene 'medium' bo neodgovorjen korak pokazal enako neupravičeno oceno 'low' ('Zanesljivost podatkov: nizko tveganje', 'Sledljivost je urejena...'). To je manj škodljivo za prodajni pogovor (ne alarmira po nepotrebnem), a še vedno krši 'ni lažne natančnosti', ker trdi nekaj o konkretnem podjetju, česar nihče ni potrdil. Priporočam kratkoročni popravek eksplicitno označiti kot ZAČASNO OMILITEV škode (manj napačnih alarmov), ne kot dokončno rešitev — dokončna rešitev je le dolgoročna arhitektura 'Ne vem'. DODATNA POTRDITEV obsega problema: isUntouchedNumeric (salesReport.ts) eksplicitno preskoči 'choice' polja, zato se noben od teh štirih privzetkov ne pojavi niti v softness.untouchedFields niti v unknownAnswers — signal je danes povsem neviden uporabniku poročila, kar dodatno utemeljuje 'visoka' resnost. Ponovitev vzorca defaultov 1/1/2/1 v ostalih šestih segmentnih datotekah ni bila posebej preverjena vrstico-za-vrstico v tem pregledu (izven ožjega obsega trgovine), a struktura riskLevelFromScore in ASSURANCE_CHOICES je skupna (shared.ts), zato je trditev o ponovitvi verjetna in vredna ločenega preverjanja v pregledu drugih segmentov.
- **Predlog za izvedbo:** KRATKOROČNO (samo config trgovina.ts, brez posega v skupne tipe): spremeni vse štiri privzetke na 0 — to je najboljša možna ocena, ki jo lahko orodje pokaže brez podatka, in ne predpostavlja slabega stanja. S tem neodgovorjen korak pokaže 'nizko' na obeh dimenzijah namesto izmišljene 'srednje'. DOLGOROČNO (usklajeno med segmenti, poseg v shared.ts in moduleTypes.ts): dodaj peto možnost 'Ne vem' (unknown: true) k izbiram, razširi RiskLevel z, denimo, dodatnim stanjem (npr. prikaz 'ni dovolj odgovorov za oceno' namesto low/medium/high, ko je dimenzija sestavljena iz samih 'ne vem' odgovorov), in compute() naj takrat NE vrne bucket:'risk' zapisa ali vrne poseben note brez riskLevel oznake. Ta druga pot je bolj skladna s pravilom 'kjer podjetje podatka nima, je pošten odgovor razpon ali ne vem, ne izmišljena številka', a zahteva usklajeno spremembo v vseh sedmih segmentih ter v RiskCard.tsx in pdfKit.ts (kjer je RiskLevel izčrpno našteta unija) — presega samostojen popravek trgovina.ts, zato priporočam najprej kratkoročni popravek.
- *Vir:* Poglavje 10.2 ('Dve oceni, ne ena' — zanesljivost mora odražati dejanske dokaze) in Dodatek C — 'Uporabnik vidi neizmerjena področja'.

**diagnostikaTrgovina.pantheon (3 alineje, trgovina.ts:714-718)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Vsebinsko ustrezne tri funkcionalnosti. V praksi se ta seznam v salesPlaybook.buildRecommendation (salesPlaybook.ts:131-132) uporabi le, če je diagnostika_trgovina modul z največjim totalEUR med 'measured' področji — ker diagnostika nima EUR postavk (samo bucket 'risk', ANNUAL_BUCKETS jih ne šteje) in je zadnja po vrstnem redu med moduli, to se v praksi ne more zgoditi (izgubi vsak remis proti prej naštetim stroškovnim modulom). Seznam je torej neškodljiv, čeprav trenutno praktično neuporabljen.
- *Popravek preverbe:* Vse tehnične trditve preverjene: moduleEngine.ts:140 ANNUAL_BUCKETS = ['directLoss','lostMargin','capacity'] (bucket 'risk' ni vključen), salesPlaybook.ts sortira report.measured po totalEUR padajoče in vzame prvega — ker je diagnostika_trgovina v TRGOVINA_MODULES (trgovina.ts:722-729) zadnja pred sortiranjem in ima totalEUR=0, res izgubi vsak remis. Popravek ni potreben.
- *Vir:* n/a — strukturna opazka, ne vsebinska.

### 4.7 Modul E — tehnološka in regulatorna tveganja (legacy.ts)

**MODULE_E_ITEMS.sqlServer2016 ('Uporabljamo SQL Server 2016', legacy.ts:255-259)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Besedilo je dejstveno točno glede na trenutni datum (17. 8. 2026): rok podpore (14. 7. 2026) je dejansko že mimo, kar 'warningText' pravilno navaja v pretekliku. Gating na obstoječe uporabnike PANTHEON (isTechnicalRiskModuleVisible) je tu smiseln, ker je sporočilo dejansko o infrastrukturi, na kateri teče STRANKINA namestitev PANTHEON — neobstoječemu uporabniku PANTHEON to ni prihranek, ampak šum, natanko kot pojasnjuje komentar v contexts/index.ts:49-56.
- *Popravek preverbe:* legacy.ts:254-259 dobesedno potrjuje warningDate '2026-07-14' in besedilo 'Podpora za SQL Server 2016 je potekla 14. 7. 2026 — rok je že mimo.' Glede na system-reminder datum 2026-08-17 je trditev 'rok je že mimo' pravilna. contexts/index.ts:48-56 dobesedno vsebuje navedeno utemeljitev za PANTHEON-gating. Popravek ni potreben.
- *Vir:* n/a — tehnično opozorilo brez neposredne povezave z veleprodajno raziskavo.

**MODULE_E_ITEMS.windowsServer2016 ('Uporabljamo Windows Server 2016', legacy.ts:260-264)**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Enaka logika kot pri sqlServer2016: rok (12. 1. 2027) je še ~5 mesecev v prihodnosti, besedilo je v pravilnem času ('se konča'), gating na PANTHEON uporabnike je defenziben iz istega razloga.
- *Popravek preverbe:* legacy.ts:260-264 dobesedno potrjuje warningDate '2027-01-12' in besedilo 'Podpora za Windows Server 2016 se konča 12. 1. 2027.' Glede na datum 2026-08-17 je sedanjik/prihodnjik ('se konča') pravilen (rok je čez ~5 mesecev). Popravek ni potreben.
- *Vir:* n/a.

**MODULE_E_ITEMS.eInvoiceZierded ('Nimamo urejenega kanala za e-račune', legacy.ts:266-272) skupaj z gating logiko isTechnicalRiskModuleVisible('trgovina', ...) (contexts/index.ts:58-62, contexts/trgovina.ts:57-76, CalculatorFlow.tsx:150-158)**
- Verdikt: **PREMAKNI** · Teža: visoka · Preverba: potrjeno
- Potrjeno z branjem kode: contexts/trgovina.ts:60-75 ima 5 možnosti za 'Kako danes vodite prodajo in skladišče?', od katerih SAMO pantheonWms (isPantheon:true) in pantheonNoWms (isPantheon:true) prestanejo gate; otherErp, erpExcelPaper in excelPaper (3 od 5 možnosti, brez isPantheon zastavice) IN privzeti null (nihče ni odgovoril) modul 'E' v celoti skrijejo (potrjeno tudi v lib/potential.test.ts:156-159). To pomeni, da natanko tista podjetja, ki so po definiciji dlje od skladnosti (Excel/papir, brez strukturiranega e-računa), NIKOLI ne vidijo opozorila o ZIERDED roku 1. 1. 2028 — čeprav ZIERDED po Zakonu o izmenjavi elektronskih računov velja za VSA podjetja, vpisana v slovenski poslovni register, ne glede na njihov ERP. Raziskava to eksplicitno podpira kot univerzalno vprašanje (Dodatek D.11: 'Ali je podjetje pripravljeno na B2B e-račune 2028? | stopnja | regulatorna veja' — brez pogoja na ERP znamko). Sama sodba je notranje protislovna: terjatveTrgovina.pantheon (trgovina.ts:631) prodajno navaja ZIERDED-skladnost kot argument prav tem strankam, ki opozorila nikoli ne vidijo. Dodatek C sicer pravi 'Vse regulatorne veje so pogojne, ne univerzalne' — a ta pogoj se nanaša na PANOŽNO/pravno upravičenost (npr. CBAM samo za uvoznike), ne na znamko ERP-ja; za segment 'trgovina' (B2B, registriran v Sloveniji) je pogoj ZIERDED-a trivialno izpolnjen za 100 % obiskovalcev, zato je pravi 'pogoj' dejansko 'vedno prikaži', trenutni PANTHEON-pogoj pa je pogojevanje na nepovezani spremenljivki.
- *Popravek preverbe:* Popolnoma dobesedno potrjeno na vseh navedenih mestih. contexts/trgovina.ts:57-76: pet možnosti currentSystem, samo 'pantheonWms' in 'pantheonNoWms' imajo isPantheon:true; 'otherErp', 'erpExcelPaper', 'excelPaper' ga nimajo. contexts/index.ts:58-62 (isTechnicalRiskModuleVisible) vrne false za vse ne-PANTHEON sisteme IN za systemId=null. Komentar tik nad funkcijo (contexts/index.ts:48-56) DOBESEDNO enači SQL Server, Windows Server IN ZIERDED kot 'tehnična opozorila... smiselna obstoječim uporabnikom PANTHEON', kar je neposreden dokaz, da je bila odločitev zavestna, a ne razlikuje regulatorne (univerzalne) narave ZIERDED od infrastrukturne (PANTHEON-specifične) narave prvih dveh. CalculatorFlow.tsx:151-158 potrjuje isti gate v UI plasti. lib/potential.test.ts (test 'v veleprodaji in maloprodaji velja isto pravilo', okoli vrstice 154-159) eksplicitno testira in PRIČAKUJE, da isTechnicalRiskModuleVisible('trgovina','excelPaper')===false in (...,null)===false — torej je vedenje namerno in testno zavarovano, ne slučajna napaka. Predlagana rešitev (nov always-on modul brez triage) je arhitekturno izvedljiva brez posega v motor: diagnostika_trgovina in trenutni 'E' že dokazujeta, da modul brez triage lastnosti deluje (moduleTypes.ts:220-224 komentar). Zahteva za vnos v content/methodology.ts je potrjena s testom moduleEngine.test.ts:371 (MODULE_METHODOLOGY[definition.id] mora biti definiran za vsak modul), zahteva NEpotrebnosti vnosa v actions.ts je potrjena, ker niti trenutni 'E' niti diagnostika_trgovina nimata vnosa v content/actions/actions.ts, kar dokazuje, da bucket-'risk'-only moduli ne potrebujejo actions vnosa. Ugotovitev je torej v celoti potrjena in tehnično natančna — najbolj utemeljena in najvišje prioritetna postavka v celotnem pregledu.
- **Predlog za izvedbo:** Razdeli MODULE_E_ITEMS na dva sklopa. (1) Modul 'E' obdrži samo sqlServer2016 in windowsServer2016 z nespremenjenim PANTHEON-gatingom (to ostaja smiselno, glej zgoraj). (2) Ustvari nov modul BREZ triage (torej vedno prikazan — enak mehanizem, kot ga motor že uporablja za diagnostiko in obstoječi E, torej NI potreben poseg v showIf/pogojni prikaz motorja), npr. id 'zierded_trgovina', ki vsebuje samo eInvoiceZierded, in ga dodaj v TRGOVINA_MODULES ter segments.ts moduleIds za trgovino (po naravi zadeve enako za vse ostale segmente — usklajeno s pregledi drugih segmentov). Nov modul potrebuje vnos v content/methodology.ts (formula: 'ocena tveganja iz enega odgovora — brez zneska'; rationale po vzoru diagnostika_trgovina, trgovina.ts:137-141) — content/actions/actions.ts vnos ni potreben, ker bucket 'risk' nima valueEUR in torej structurally ne more postati 'največja postavka' (findHighestModule, moduleEngine.ts:152-169, šteje samo ANNUAL_BUCKETS).
- *Vir:* Poglavje 5.10 'E-računi 2028', Dodatek D.11 ('Ali je podjetje pripravljeno na B2B e-račune 2028?'), Dodatek C (regulatorne veje naj bodo pogojne na dejansko izpostavljenost, ne na nepovezano spremenljivko).

**buildIcpSignals().deadlineDates v lib/salesReport.ts:366-370 — bere izključno MODULE_E_ITEMS.filter(...values.E?.[item.key])**
- Verdikt: **IZBOLJSAJ** · Teža: visoka · Preverba: potrjeno
- Potrjeno: config/icp.ts:244-269 dimenzija 'urgency' (utež 0,1) je edina dimenzija z zunanjim rokom in temelji IZKLJUČNO na deadlineDates iz values.E. Za obiskovalca, ki modula E sploh ne vidi (glej zgornji zapis), je values.E vedno na privzetkih (vse 0), zato deadlineDates=[] in urgency vedno pade na value:0,2 z opombo, ki to že (pošteno) priznava: 'modul z roki se podjetju brez PANTHEON-a sploh ne prikaže, zato to ni nujno podatek o podjetju' (icp.ts:257). Gre torej za ŽE DOKUMENTIRANO, a NEODPRAVLJENO omejitev — ICP ocena sistematično podceni nujnost prav pri segmentu podjetij (Excel/papir), ki je realno najbolj izpostavljen in bi ga bilo smiselno prednostno obravnavati.
- *Popravek preverbe:* Dobesedno potrjeno: icp.ts vrstica 247 weight:0.1, vrstice 253-258 vsebujejo navedeni citat 'Ni odkljukanega tehničnega roka. Pozor: modul z roki se podjetju brez PANTHEON-a sploh ne prikaže, zato to ni nujno podatek o podjetju.' identično. salesReport.ts:368-370 dobesedno bere samo 'params.values.E?.[item.key]'. Logična veriga (brez PANTHEON → E skrit → values.E ostane na privzetkih 0 → deadlineDates=[] → urgency vedno 0,2) je pravilno izpeljana in preverjena. Popravek ni potreben, predlog je smiseln in odvisen od predhodne postavke (razdelitev modula E).
- **Predlog za izvedbo:** Po izvedbi razdelitve modula E (glej prejšnji zapis) razširi deadlineDates, da bere tudi vrednosti novega vedno-prikazanega modula (npr. values['zierded_trgovina']), ne le values.E. Po tej spremembi posodobi tudi opombo pri value:0,2 v icp.ts:255-258, ker trditev 'modul z roki se ne prikaže' po popravku ne bo več držala za ZIERDED postavko (še vedno bo držala za sqlServer2016/windowsServer2016, zato naj opomba to razlikuje).
- *Vir:* Poglavje 5.10 'E-računi 2028'; interna dokumentacija icp.ts:253-258 (self-priznana omejitev).

**moduleE (legacy.ts:275-294) — manjkajoče polje `pantheon` v primerjavi z ostalimi moduli**
- Verdikt: **OHRANI** · Teža: nizka · Preverba: potrjeno
- Modul E nima `pantheon` seznama, kar bi bilo lahko videti kot vrzel, a je neškodljivo: buildSalesReport (salesReport.ts:326-329) modul 'E' eksplicitno IZKLJUČI iz 'measured' ('Modul E ni področje, ampak seznam rokov'), zato njegov `pantheon` array v buildRecommendation (salesPlaybook.ts:131-132) nikoli ne bi bil dosegljiv, tudi če bi obstajal.
- *Popravek preverbe:* legacy.ts:275-294 (moduleE) dobesedno nima polja pantheon. salesReport.ts:326-329 dobesedno vsebuje komentar 'Modul E ni področje, ampak seznam rokov' in filter '.filter((definition) => definition.id !== E)'. Sklep je pravilen in preverjen. Popravek ni potreben.
- *Vir:* n/a — strukturna potrditev, ne vsebinska najdba.

---
## 5. Horizontale z vidika segmenta trgovina

`analitikaHz`, `financeHz`, `kadriHz`, `dokumentiHz`, `servisHz` (config/modules/horizontal.ts). Trgovina je edini segment, ki vključi vseh pet — preverjeno kot upravičeno (razdelek 5.4 spodaj). Ker so horizontale deljene med do šestimi segmenti hkrati, velja posebno arhitekturno pravilo: **besedilo help/explainer ne sme imenovati sosednjega področja po naslovu**, ker to področje v drugem segmentu morda ne obstaja. Skeptična preverba je to pravilo uveljavila nad štirimi izvirnimi predlogi in jih ustrezno preoblikovala (glej `[horiz-31]`).

### 5.1 Ohranjena polja (brez sprememb)

- **analitikaHz.reportPrepHoursPerMonth** — Preverjeno dobesedno: horizontal.
- **analitikaHz.reportFreshness** — Preverjeno: horizontal.
- **analitikaHz.mainCause / ANALITIKA_CAUSES** — Preverjeno: horizontal.
- **financeHz.bookingHoursPerMonth** — Preverjeno: horizontal.
- **financeHz.mainCause / FINANCE_CAUSES** — Preverjeno: horizontal.
- **kadriHz.mainCause / KADRI_CAUSES** — Preverjeno: horizontal.
- **dokumentiHz.approvalHoursPerMonth** — Preverjeno: horizontal.
- **servisHz.caseTracking** — Preverjeno: horizontal.
- **servisHz.mainCause / SERVIS_CAUSES** — Preverjeno: horizontal.
- **[Sistemsko] Vkljucitev vseh petih horizontal v trgovino** — Preverjeno v celoti proti segments.
- **[Sistemsko] Kos lostMargin proti directLoss v petih horizontalah** — Preverjenih vseh osem denarnih izidov compute() - kos 'lostMargin' se v horizontalah dejansko sploh ne uporablja, vse denarne postavke so pravilno 'directLoss'.
- **[Sistemsko] usesRevenue/usesMargin zastavici v petih horizontalah** — Preverjeno: nobena od petih compute() funkcij ne referencira annualRevenueEUR ali contributionMarginRate.
- **[Sistemsko] Enote in MONTHS_PER_YEAR v petih horizontalah** — Preverjeno: vsa h/mesec polja se pravilno mnozijo z MONTHS_PER_YEAR, vsa EUR/leto polja vstopajo brez dodatnega mnozenja.

### 5.2 analitikaHz — Analitika in poročanje

**analitikaHz.adHocAnalysisHoursPerMonth**
- Verdikt: **IZBOLJSAJ** · Teža: srednja · Preverba: potrjeno
- Preverjeno: horizontal.ts:62-68 res nima help/explainer, sosednje polje na 51-61 ju ima. Trditev drži dobesedno.
- **Predlog za izvedbo:** Kot predlagano: help 'Ure, ki ste jih ze vpisali pod rednimi porocili, tu ne ponavljajte.' + explainer s primerom (8x45min=6h). Besedilo omenja samo polje znotraj istega modula (redna porocila), ne sosednjega podrocja drugega modula, zato ne krsi pravila iz horizontal.ts:19-23. Ostane brez sprememb.
- *Vir:* par.5.11

**analitikaHz.dataMergeHoursPerMonth**
- Verdikt: **IZBOLJSAJ** · Teža: visoka · Preverba: popravljeno
- Prekrivanje z narocila_trgovina.retypingHoursPerMonth (trgovina.ts:95-106) je realno in dobro utemeljeno. Toda predlagano besedilo help ('...to je ze v podrocju Narocila') krsi izrecno arhitekturno pravilo iz horizontal.ts:17-23: 'razmejitveni napotki ne imenujejo sosednjih podrocij, ta so v vsakem segmentu druga'. Preverjeno v kodi: analitikaHz je en sam deljen objekt (MODULE_REGISTRY v index.ts:32-34), uporabljen v proizvodnja, trgovina, maloprodaja, storitve, splosno. Proizvodnja nima modula Narocila (moduleIds: planiranje, material, zaloge, nalogi, zamude) - isto besedilo bi bilo tam zavajajoce.
- *Popravek preverbe:* Osnovna diagnoza (tveganje dvojnega stetja) drzi, a predlagano besedilo krsi dokumentirano pravilo o neimenovanju sosednjih podrocij. Popravljeno besedilo help zgoraj.
- **Predlog za izvedbo:** Help (popravljeno, brez imenovanja modula): 'Ne stejte prvega vnosa podatkov ali prepisovanja med operativnimi sistemi (npr. narocila, zaloga, proizvodni nalogi) - to sodi v ustrezno panozno podrocje vprasalnika, ce ga imate. Tu stejte samo zdruzevanje podatkov ZA POROCILA vodstvu.' Explainer ostane kot predlagano: 'Rocno kopiranje in lepljenje podatkov iz vec sistemov v eno skupno preglednico za analizo ali porocilo - ne prvi vnos narocila. Primer: 3 viri x 2 h na mesec = 6 ur.'
- *Vir:* par.13.2 Pravila podvajanja; horizontal.ts:17-23

**[dodaj] analitikaHz - kpiVisibility**
- Verdikt: **DODAJ** · Teža: nizka · Preverba: popravljeno
- Preverjeno: analitikaHz ima danes 5 polj (horizontal.ts:49-91), test dovoli 5-6 (horizontal.test.ts:179-183), prostor za dodatek obstaja. Polje je contextOnly, zato ga ni treba braniti pred pravilom neimenovanja sosednjih podrocij (brez help/explainer). Zmerno se prekriva z reportFreshness (starost vs. konsolidacija podatkov), a razlicni osi. Potrjeno tudi, da contextOnly polja realno hranijo iztocnico v salesPlaybook.ts:104-115 in salesReport.ts:410/472.
- *Popravek preverbe:* Vsebinsko potrjeno, dopolnjeno le s konkretnimi zaporednimi vrednostmi choice (0-3), ki v izvirnem predlogu niso bile eksplicitno navedene.
- **Predlog za izvedbo:** Dodaj contextOnly choice polje 'kpiVisibility': label 'Ali vodstvo redno spremlja kljucne kazalnike (zaloga, terjatve, marza po kupcu) na enem mestu?', kind: 'choice', default: 2, contextOnly: true, choices: [{value:0, label:'Da, sprotno in na enem mestu'}, {value:1, label:'Delno, a razprseno po orodjih'}, {value:2, label:'Le ob mesecnem zakljucku'}, {value:3, label:'Ne, vsak si podatke isce sam'}]. Eksplicitne zaporedne vrednosti 0-3, brez help/explainer.
- *Vir:* Dodatek D.9 (nepreverljivo iz repozitorija - dokument ni del kode)

### 5.3 financeHz — Računovodstvo in finance

**financeHz.reconciliationHoursPerMonth**
- Verdikt: **IZBOLJSAJ** · Teža: visoka · Preverba: popravljeno
- Preverjeno dobesedno: horizontal.ts:168-179 (label vkljucuje 'kartice kupcev... medsebojni IOP', help na 174 izkljuci le opominjanje), terjatve_trgovina.dunningHoursPerMonth (trgovina.ts:583-592) meri 'opominjanje, usklajevanje odprtih postavk in izterjavo'. Diagnoza drzi. Toda predlagano help besedilo imenuje 'podrocje terjatev/placilnih rokov' - krsi pravilo neimenovanja, ker financeHz je deljen tudi s proizvodnjo/racunovodstvom/splosno, ki nimajo modula terjatev.
- *Popravek preverbe:* Diagnoza prekrivanja je pravilna in resna, a predlagano besedilo krsi pravilo o neimenovanju sosednjih podrocij, ker financeHz nastopa tudi v segmentih brez modula terjatev. Popravljeno besedilo help/explainer zgoraj.
- **Predlog za izvedbo:** Label (kot predlagano): 'Koliko ur mesecno porabite za usklajevanje - banka, kartice dobaviteljev in notranje evidence (zaloga proti knjigovodstvu)?' Help (popravljeno): 'Usklajevanja odprtih postavk s kupci in opominjanja tu ne stejte - ce jih morda merite drugje v vprasalniku, jih raje izpustite, kot da bi jih steli dvakrat.' Explainer: 'Ure, ko primerjate dve evidenci, ki se ne ujemata: banka proti odprtim postavkam, saldakonti proti dobaviteljem, zaloga proti knjigovodstvu. Kartic kupcev tu praviloma ne stejte. Primer: 2 osebi x 3 h ob koncu meseca + 4 h med mesecem = 10 ur.'
- *Vir:* par.13.2; Dodatek D.8, D.10; horizontal.ts:17-23

**financeHz.closingHoursPerMonth**
- Verdikt: **IZBOLJSAJ** · Teža: nizka · Preverba: potrjeno
- Preverjeno: horizontal.ts:180-186, res brez help/explainer, edinstvena vsebina. Predlagani explainer je generican, ne imenuje nobenega sosednjega modula.
- **Predlog za izvedbo:** Dodaj explainer: 'Priprava in oddaja DDV obracuna, INTRASTAT (ce ga oddajate) in drugih obveznih obracunov. Primer: 1 oseba x 2 dni na mesec x 8 h = 16 ur.'
- *Vir:* par.5.10

**financeHz.annualPenaltyEUR**
- Verdikt: **IZBOLJSAJ** · Teža: visoka · Preverba: popravljeno
- Preverjeno: horizontal.ts:187-194, brez allowUnknown/help/explainer - moduleTypes.ts:160-168 potrjuje namen allowUnknown za zneske, ki jih podjetje bodisi vodi bodisi ne. Deli frazo 'zamudne obresti' z dokumentiHz.annualDocDelayEUR. Paritev financeHz+dokumentiHz je danes v vseh segmentih dosledna (preverjeno segments.ts), a ni zavarovana s testom.
- *Popravek preverbe:* allowUnknown-priporocilo v celoti drzi. Help besedilo popravljeno, da ne imenuje modula po naslovu - sklicevanje je danes varno, a ni testno zavarovano.
- **Predlog za izvedbo:** Dodaj allowUnknown: true. Help (popravljeno, brez imenovanja modula): 'Samo obresti in globe davcnemu uradu zaradi napak ali zamud pri obracunih (DDV, place, prispevki) ter stroski popravnih obracunov (samoprijave). Zamudne obresti do dobaviteljev zaradi prepozno potrjenih ali izgubljenih dokumentov tu ne stejte, ce jih morda merite drugje.' Explainer: 'Zamudne obresti in globe, placane davcnemu uradu zaradi prepozne ali napacne oddaje obracuna, ter stroski popravnih obracunov. Primer: 3 popravni obracuni x 500 EUR + zamudne obresti 1500 EUR = 3000 EUR na leto. Ce tega loceno ne spremljate, izberite Tega podatka ne vodimo.'
- *Vir:* par.10.1-10.2; Dodatek C; horizontal.ts:17-23

### 5.4 kadriHz — Kadri in plače

**kadriHz.timesheetHoursPerMonth**
- Verdikt: **IZBOLJSAJ** · Teža: srednja · Preverba: popravljeno
- Preverjeno: horizontal.ts:262-273, ima generican help+explainer, a brez trgovinsko-specificnega sidra. Prav zato predlagano besedilo ne sme dobiti trgovinskega sidra: kadriHz je deljen med proizvodnja, trgovina, maloprodaja, storitve, racunovodstvo, splosno - primeri 'komisioniranje' in 'vodja skladisca' bi bili nesmiselni v proizvodnji ali racunovodskem servisu, kar krsi pravilo iz horizontal.ts:17-23.
- *Popravek preverbe:* Osnovna tezava (generienost brez sidra) je resnicna, a predlagana resitev vnasa trgovinsko-specificne primere v besedilo, deljeno cez vse segmente s kadriHz. Popravljeno besedilo ostaja generic.
- **Predlog za izvedbo:** Label (kot predlagano, generic): 'Koliko ur mesecno administrativno gre za zbiranje in urejanje evidenc prisotnosti (prihod/odhod, izmene, dopusti) - ne za samo operativno delo?' Help (popravljeno): 'Tu ne stejte ur samega operativnega dela dejavnosti (proizvodnja, prodaja, skladiscenje, storitve ipd.) - le administrativni cas zbiranja in popravljanja evidence prisotnosti zanje.' Explainer (popravljeno, brez trgovinsko-specificnega primera): 'Primer: vodja izmene ali oddelka vsak konec meseca 5 h prepisuje ure iz papirnih list v sistem za obracun plac - to stejte, ne pa ur samega operativnega dela.'
- *Vir:* Dodatek D.12; par.5.12; horizontal.ts:17-23

**kadriHz.payrollPrepHoursPerMonth**
- Verdikt: **IZBOLJSAJ** · Teža: nizka · Preverba: potrjeno
- Preverjeno: horizontal.ts:274-280, res brez help/explainer. Predlagani explainer je generic, brez imenovanja modulov.
- **Predlog za izvedbo:** Dodaj explainer: 'Priprava podatkov za obracun (dodatki, nadomestila, odsotnosti) in popravki po izplacilu. Primer: 1 oseba x 1 dan na mesec x 8 h = 8 ur.'
- *Vir:* Dodatek D.12

**kadriHz.hrAdminHoursPerMonth**
- Verdikt: **IZBOLJSAJ** · Teža: nizka · Preverba: potrjeno
- Preverjeno: horizontal.ts:282-288, res brez help/explainer, edinstvena vsebina.
- **Predlog za izvedbo:** Dodaj explainer: 'Dopusti, potni nalogi, potrdila o zaposlitvi in podobna kadrovska administracija. Primer: 10 zahtevkov na mesec x 20 min = 3 ure.'
- *Vir:* par.5.12

**kadriHz.annualPayrollErrorEUR**
- Verdikt: **IZBOLJSAJ** · Teža: visoka · Preverba: potrjeno
- Preverjeno: horizontal.ts:289-296, res brez allowUnknown/help/explainer. Sklic na 'zgornji dve vprasanji' se nanasa na polji znotraj istega modula, ne krsi pravila neimenovanja.
- **Predlog za izvedbo:** Dodaj allowUnknown: true. Help: 'Samo neposredni denarni strosek - poracuni, zamudne obresti, placilo zunanje pomoci pri popravku. Ur, ki ste jih za popravke porabili sami, tu ne stejte - te so v zgornjih dveh vprasanjih.' Explainer: 'Denar, ki gre poleg ur: doplacila zaposlenim zaradi napake, zamudne obresti, honorar zunanjega servisa za popravek obracuna. Primer: 4 popravki x 300 EUR = 1200 EUR na leto. Ce loceno ne spremljate, izberite Tega podatka ne vodimo.'
- *Vir:* par.10.1-10.2; Dodatek C

### 5.5 dokumentiHz — Dokumentacija in e-poslovanje

**dokumentiHz.searchArchiveHoursPerMonth**
- Verdikt: **IZBOLJSAJ** · Teža: nizka · Preverba: potrjeno
- Preverjeno: horizontal.ts:379-385, res brez help/explainer. Predlog je generic.
- **Predlog za izvedbo:** Dodaj explainer: 'Iskanje pogodb, dobavnic, dokazil in arhiviranje po zakljucku posla. Primer: 15 iskanj na mesec x 20 min = 5 ur.'
- *Vir:* par.5.10

**dokumentiHz.manualExchangeHoursPerMonth**
- Verdikt: **IZBOLJSAJ** · Teža: nizka · Preverba: potrjeno
- Preverjeno: horizontal.ts:386-392, res brez help/explainer. Predlog je generic.
- **Predlog za izvedbo:** Dodaj explainer: 'Tiskanje, skeniranje in fizicno ali e-postno posiljanje dokumentov, ki bi lahko sli po EDI/e-racunu. Primer: 40 dokumentov x 8 min = 5 ur.'
- *Vir:* par.5.10 E-racuni 2028; Dodatek D.11

**dokumentiHz.annualDocDelayEUR**
- Verdikt: **IZBOLJSAJ** · Teža: visoka · Preverba: popravljeno
- Preverjeno: horizontal.ts:393-400, deli frazo 'zamudne obresti' z financeHz.annualPenaltyEUR - enak razlog kot pri financeHz.annualPenaltyEUR: paritev je danes dosledna, a nezavarovana s testom, zato brez imenovanja modula po naslovu.
- *Popravek preverbe:* Diagnoza in allowUnknown-priporocilo drzita. Help besedilo popravljeno, da ne imenuje modula po naslovu, iz istega razloga kot pri financeHz.annualPenaltyEUR.
- **Predlog za izvedbo:** Dodaj allowUnknown: true. Help (popravljeno): 'Samo stroski zaradi zamujenega ali izgubljenega dokumenta - zamujen skonto, zamudne obresti dobavitelju zaradi prepozno potrjenega/placanega racuna, ponovna izstavitev. Obresti in globe zaradi napak pri davcnih obracunih tu ne stejte, ce jih morda merite drugje.' Explainer: 'Stroski, ki nastanejo, ker je dokument izgubljen ali prepozno potrjen: zamujen skonto, zamudne obresti dobavitelju in ponovna izstavitev. Primer: 10 zamujenih skontov x 150 EUR + 5 ponovnih izstavitev x 40 EUR = 1700 EUR na leto.'
- *Vir:* par.13.2; par.10.1-10.2; Dodatek D.11, D.10; horizontal.ts:17-23

**dokumentiHz.mainCause / DOKUMENTI_CAUSES: 'Potrjevanje poteka rocno, po e-posti ali na papirju' -> category planning**
- Verdikt: **IZBOLJSAJ** · Teža: visoka · Preverba: popravljeno
- Preverjeno dobesedno: horizontal.ts:344, kategorija je res 'planning'. addressableShare.ts:18-19 opredeli planning kot 'planiranje, zaloge, vidnost nalogov' - nic od tega ne opisuje rocnega kanala potrjevanja. addressableShare.ts:16 opredeli data kot 'podatki, normativi, dokumentacija, rocni prenosi'. Notranji precedens v isti datoteki: financeHz 'Dokumenti do knjizenja potujejo rocno' -> data (132) in dokumentiHz 'Dokumenti so v mapah in e-posti, ne v sistemu' -> data (343). Test horizontal.test.ts:120-126,137-141 trenutno eksplicitno preverja mainCause:1 -> ADDRESSABLE_SHARE.planning, torej sprememba zahteva tudi posodobitev testa.
- *Popravek preverbe:* Vsebinsko potrjeno kot v izvirniku, dopolnjeno z ugotovitvijo, da je treba ob spremembi kategorije uskladiti tudi horizontal.test.ts:125,140, ki danes eksplicitno testira trenutno kategorizacijo 'planning'.
- **Predlog za izvedbo:** Spremeni category vzroka 'Potrjevanje poteka rocno, po e-posti ali na papirju' iz 'planning' v 'data' (horizontal.ts:344). Hkrati popravi komentar in pricakovanje v horizontal.test.ts:125 in vrstico 140 (expect ADDRESSABLE_SHARE.planning -> .data).
- *Vir:* addressableShare.ts:16-19,29-30; Dodatek E.1

### 5.6 servisHz — Reklamacije in poprodajni servis

**servisHz.serviceWorkHoursPerMonth**
- Verdikt: **IZBOLJSAJ** · Teža: srednja · Preverba: potrjeno
- Preverjeno: compute() na horizontal.ts:535 res uporabi context.operationalHourCostEUR. contexts/trgovina.ts vrstica 91 res pravi 'Skladiscnik, komisionar, viličarist - kdor blago dejansko premakne.' Trditev drzi dobesedno.
- **Predlog za izvedbo:** Dopolni explainer z opombo: 'Ce imate lastne servisne tehnike z drugacno urno postavko kot skladisce, je prikazan znesek lahko spodnja meja - dejanski strosek je verjetno visji.' Sprememba compute() presega obseg tega pregleda.
- *Vir:* par.5.8; Dodatek D.7

**servisHz.rmaAdminHoursPerMonth**
- Verdikt: **IZBOLJSAJ** · Teža: srednja · Preverba: popravljeno
- Preverjeno: horizontal.ts:487-497, help (494) izkljuci le 'urejanje obicajnih vracil in dobropisov', kar ustreza odprema_trgovina.claimHandlingHoursPerMonth. Diagnoza drzi. Toda predlagano help besedilo servisHz imenuje 'Odprema' - krsi pravilo neimenovanja: servisHz je deljen tudi s proizvodnja in storitve (test horizontal.test.ts:271-273 potrjuje izkljucitev le iz logistika/racunovodstvo/splosno), noben od teh dveh segmentov nima modula 'Odprema'.
- *Popravek preverbe:* Diagnoza drzi, a help besedilo za deljeni modul servisHz ne sme imenovati 'Odprema' po naslovu, ker se servisHz uporablja tudi v proizvodnja in storitve, kjer takega modula ni. Popravek za odprema_trgovina ostane kot v izvirniku.
- **Predlog za izvedbo:** Help za servisHz.rmaAdminHoursPerMonth (popravljeno): 'Prvi sprejem reklamacije in ugotavljanje vzroka stejte tam, kjer ste primer prvic sprejeli, ce to merite drugje v vprasalniku - tu stejte samo nadaljnje ure, ko je ze jasno, da gre za garancijsko/servisno napako izdelka.' Soodvisni predlog za odprema_trgovina.claimHandlingHoursPerMonth (segmentno-specificen modul trgovine, sme imenovati servisHz po naslovu): dopolni s stavkom 'Ce se med resevanjem izkaze, da gre za garancijsko napako izdelka, nadaljnje ure stejte v podrocju Reklamacije in poprodajni servis.'
- *Vir:* par.5.8 Obvezna razmejitev; par.13.3; horizontal.ts:17-23

**servisHz.annualServiceCostEUR**
- Verdikt: **IZBOLJSAJ** · Teža: visoka · Preverba: potrjeno
- Preverjeno: horizontal.ts:499-510, help/explainer ze obstajata z jasno mejo do vracil/dobropisov. Manjka le allowUnknown.
- **Predlog za izvedbo:** Dodaj allowUnknown: true. Obstojeci help/explainer ostaneta nespremenjena.
- *Vir:* par.10.1-10.2; Dodatek C

### 5.7 Sistemske ugotovitve (veljajo za vseh pet horizontal)

**[NOVA UGOTOVITEV] Vec predlaganih popravkov krsi arhitekturno pravilo 'brez imenovanja sosednjih podrocij' iz horizontal.ts:17-23**
- Verdikt: **IZBOLJSAJ** · Teža: visoka · Preverba: popravljeno
- Datoteka horizontal.ts v uvodnem komentarju (17-23) eksplicitno doloca tretje arhitekturno nacelo, znacilno samo za horizontale: besedilo mora drzati v vsakem segmentu, zato razmejitveni napotki ne imenujejo sosednjih podrocij. Preverjeno v kodi (index.ts:21-34), da je vsaka horizontala en sam deljen objekt v MODULE_REGISTRY, uporabljen brez kloniranja v vec segmentih z razlicnimi panoznimi moduli. Prvotni pregled je to pravilo spregledal pri stirih predlogih: analitikaHz.dataMergeHoursPerMonth, kadriHz.timesheetHoursPerMonth, financeHz.reconciliationHoursPerMonth in servisHz.rmaAdminHoursPerMonth - vsak je imenoval modul, ki v nekem drugem segmentu z isto horizontalo ne obstaja. Dva dodatna predloga (financeHz.annualPenaltyEUR, dokumentiHz.annualDocDelayEUR) imenujeta drug drugega po naslovu - danes varno, a netestirano.
- *Popravek preverbe:* Ta ugotovitev ni bila del izvirnega pregleda - dodana je bila med skepticno verifikacijo, ker izvirni predlogi pri stirih poljih krsijo dokumentirano arhitekturno pravilo tega modula. Popravki so vneseni pri posameznih postavkah zgoraj.
- **Predlog za izvedbo:** Popravljeno besedilo je vneseno pri vsaki od zadevnih postavk zgoraj (glej correction). Splosno pravilo za razvijalca: pri urejanju besedila katerekoli od petih horizontal preveri proti seznamu vseh segmentov, ki jo vkljucujejo, in besedilo testiraj v najbolj razlicnem segmentu, ne le v trgovini. Priporocljivo je dodati test, ki preveri, da help/explainer besedila horizontal.ts ne vsebujejo naslovov panoznih modulov iz noben[ega] segmenta, kjer horizontala nastopa brez tega para.
- *Vir:* horizontal.ts:17-23 (kodno dokumentirano arhitekturno pravilo); index.ts:21-34; segments.ts

---
## 6. Manjkajoča področja

### 6.1 Dodaj zdaj

**MANJKA: cel modul 'Nabava, dobavitelji in uvoz' (predlagan id: nabava_trgovina) — v config/segments.ts:130-143 (moduleIds segmenta trgovina) ga ni, v config/modules/trgovina.ts ni niti enega vprašanja o nabavni strani posla (grep 'nabav' vrne samo besedo 'nabavna vrednost' kot pojasnilo enote pri zalogi, vrstice 331/333/339, in eno postavko med vzroki v ZALOGE_CAUSES, vrstica 305 — nikjer samostojnega vprašanja ali zneska).**
- Verdikt: **DODAJ** · Teža: visoka · Preverba: popravljeno
- Segment trgovina meri izključno prodajno-skladiščno-plačilno stran (naročila kupcev, skladišče, zaloge kot posledica, odprema, terjatve), nabavne strani pa ne meri nihče — niti panožni moduli niti horizontale (financeHz meri knjiženje in kazni, ne nabavne odločitve). Raziskava to imenuje najresnejšo vrzel: sklep #3 (vrstica 19) pravi dobesedno 'Nabava je enakovredna prodaji... pogosto ustvari večji učinek kot hitrejši vnos prodajnega naročila', poglavje 5.2 (vrstice 315-377) opiše nujne nabave, neizkoriščene skonte/bonuse in landed cost kot ločeno finančno področje, Dodatek D.2 (vrstice 1489-1505) je cela banka 12 vprašanj, Dodatek E.1 ima lasten vzrok SUPPLIER (vrstica 1667). Brez tega modula podjetje, ki denar dejansko izgublja pri nakupu (draga nujna naročila, zamujeni skonti, neviden landed cost pri uvozu), v izračunu ne dobi niti enega evra na to temo — kalkulator torej sistematično podceni distributerje in uvoznike, ki jih raziskava (2.2, poslovni modeli) izrecno imenuje kot ključne segmente ('uvoznik', 'ekskluzivni distributer znamke').
- *Popravek preverbe:* Jedro ugotovitve je preverjeno dobesedno: grep 'nabav' po trgovina.ts vrne SAMO vrstice 305 (vzrok), 331/333/339 (pojasnilo 'nabavna vrednost' pri zalogi) in 401 (pantheon-postavka) — nikjer lastnega vprašanja ali zneska; segments.ts:130-143 potrjuje, da nabave med 12 moduli trgovine ni. contexts/trgovina.ts:99 ('adminHour help: Komercialist, vodja prodaje, NABAVA, finance, reklamacije') potrjuje, da je context.adminHourCostEUR pravilna stopnja za nov modul. contexts/trgovina.ts:51 ('Uvoz in veleprodaja') potrjuje uvoz kot priznan poslovni model, landed cost pa ni izmerjen nikjer (grep 'landed|carina' je prazen razen tega enega poslovnega modela). Sorodni vzorci (nujna nabava, neizkoriščeni skonti) že obstajajo v proizvodnja.ts ('Ekspresne nabave in dostave') in maloprodaja.ts ('Neizkoriščeni dobaviteljski rabati in bonusi'), a v DRUGIH, medsebojno izključujočih se segmentih — znotraj trgovine torej ni podvajanja.

Popravki, potrebni za izvedljivost:
(1) Taksonomija CauseCategory ima DEJANSKO pet kategorij (data/planning/people/external/physical + unknown), ne štiri (addressableShare.ts:15-26) — trditev je nepopolna, čeprav sklep drži (noben predlagan vzrok ne potrebuje 'physical').
(2) annualUrgentPurchaseCostEUR in annualMissedDiscountsEUR imata help, a NIMATA explainer — to krši trd test explainers.test.ts ('vsako polje s pomožnim besedilom ima tudi pojasnilo'). Dodaj npr. za annualMissedDiscountsEUR: 'Primer: dogovorjen letni bonus 2 % na 400.000 EUR letne nabave = 8.000 EUR; če ste uveljavili tri četrtine, vpišite 2.000 EUR.' Ker sta polji allowUnknown:true, naj help po edini obstoječi konvenciji za to (maloprodaja.ts:383 — trgovina.ts danes NIMA nobenega allowUnknown polja) vsebuje stavek 'Če tega ne vodite, odkljukajte "Tega podatka ne vodimo" — nižja zanesljivost rezultata je boljša od izmišljene številke.'
(3) landedCostVisibility kot NE-diagnostično polje, ki samo (brez para) prek riskLevelFromScore(vrednost, 3) vrne bucket:'risk', je PRECEDENČNO: v celotnem registru 'risk' danes proizvaja izključno sedem diagnostika_*/diagnostikaMp/Rs/Sp modulov, vedno prek DVEH sparjenih polj. Funkcija je generična in bi delovala tudi na enem polju, a gre za prvo odstopanje od sicer dosledne arhitekture — v PR-ju je to treba izrecno utemeljiti kot zavesten precedens (upravičen, ker landed cost tematsko sodi v nov modul, ne v splošno diagnostiko).
(4) Manjka izrecna omemba, da je treba nabavaTrgovina dodati tudi v 'export const TRGOVINA_MODULES' (trgovina.ts:722-729) — brez tega vpisa modula index.ts (register) nikoli ne najde.
(5) actions.ts vnos naj ima headline 'Največji strošek: nabava, dobavitelji in uvoz', skladno z obstoječim vzorcem (narocila_trgovina, odprema_trgovina).
Z vsemi popravki predlog ostane 'dodaj' — vrzel je resnična in dobro utemeljena.
- **Predlog za izvedbo:** Dodaj nov modul po vzorcu obstoječih petih (isti CauseOption/mainCauseField/addressableShareOf vzorec kot v narocila_trgovina). Predlog polj (6, po vzorcu 'triage + contextOnly choice + 2 h/mesec ali EUR/leto + 1 tveganjsko choice + mainCause'):

- id: 'nabava_trgovina', title: 'Nabava, dobavitelji in uvoz', summary: 'Ročna priprava naročil dobaviteljem, nujna naročila nad rednim rokom in izgubljeni količinski rabati ali skonti.'
- triage.prompt: 'Koliko negotovosti in ročnega dela imate pri naročanju pri dobaviteljih?' — 4 opcije od 'Nabava teče po jasnem planu, nujnih naročil skoraj ni' do 'Nabava je stalna gasilska akcija'.
- field 'purchaseOrderChannel' (choice, contextOnly, default 2): 'Kako danes pripravljate nabavne predloge in naročila dobaviteljem?' — opcije: samodejno iz min. zalog/prodaje / v ERP-ju ročno / v Excelu mimo ERP-ja / po občutku, telefon-email.
- field 'purchasingHoursPerMonth' (number, h/mesec, default 0): 'Koliko ur mesečno porabite za pripravo nabavnih predlogov, usklajevanje z dobavitelji in oddajo naročil?' help: 'Ne vključujte prevzema blaga in preverjanja dobav — te ure sodijo v področje Skladišče.' explainer z izračunom (npr. 1 nabavnik × 1,5 h ≈ 32 ur/mesec).
- field 'annualUrgentPurchaseCostEUR' (number, EUR/leto, default 0, allowUnknown: true): 'Koliko vas je v zadnjih 12 mesecih dodatno stalo nujno naročanje pri dobaviteljih — hitrejši prevoz, višja cena, manjše serije?' help: 'Samo doplačilo nad rednim naročilom, ne vrednost blaga. Ponovne dostave KUPCEM zaradi napak pri odpremi sodijo v področje Odprema.' + explainer z računskim primerom (glej popravek).
- field 'annualMissedDiscountsEUR' (number, EUR/leto, default 0, allowUnknown: true): 'Kolikšno vrednost količinskih rabatov, skontov ali letnih bonusov ste v zadnjih 12 mesecih izgubili, ker naročila niso dosegla praga ali plačilo ni bilo pravočasno?' help: 'Samo dejansko izgubljen popust, ne vrednost naročila.' + explainer z računskim primerom (glej popravek).
- field 'landedCostVisibility' (choice, NI contextOnly ker hrani v compute() → bucket 'risk', default 2): 'Ali pri uvoženem blagu poznate polni strošek (nabava + prevoz + zavarovanje + carina + manipulacija) po artiklu?' — 4 opcije od 'Da, po artiklu' do 'Ne, gledamo samo fakturno ceno'; nizka vidnost → riskLevel 'high'.
- mainCauseField z vzroki: 'Naročamo po občutku, brez pregleda nad odprtimi naročili in prodajo' (planning), 'Cene, MOQ, roki in rabati dobaviteljev niso na enem mestu' (data), 'Odgovornosti pri odobravanju naročil in izjem niso jasne' (people), 'Dobavitelji so nezanesljivi ali imajo dolge in spremenljive roke' (external).

compute(): rate = context.adminHourCostEUR; izidi: capacity('Priprava nabavnih predlogov in oddaja naročil'), directLoss('Doplačila za nujna naročila'), directLoss('Izgubljeni skonti in bonusi'), risk('Vidnost landed cost pri uvozu').

pantheon (3): 'Nabavni predlogi po minimalni zalogi, prodaji in odprtih naročilih', 'Dobaviteljski ceniki, MOQ, roki in rabatne lestvice na enem mestu', 'Landed cost po artiklu — nabava, prevoz, carina in manipulacija v eni kalkulaciji'.

Umestitev v segments.ts: takoj za 'narocila_trgovina' in pred 'skladisce_trgovina'. Potrebna spremljajoča vnosa: content/methodology.ts in content/actions/actions.ts (glej popravek za natančne dodatke).
- *Vir:* Sklep #3 (vrstica 19); pogl. 2.2 poslovni modeli 'uvoznik'/'ekskluzivni distributer' (104-114); pogl. 5.2 Nabava, dobavitelji, uvoz in landed cost (315-377); Dodatek D.2 (1489-1505); Dodatek E.1 vzrok SUPPLIER (1667); Dodatek F.3 primer podatkovne naloge za nujne nabave.

**MANJKA: en lahek pogojni (contextOnly) vnos, ki bi za regulirano ali hitro pokvarljivo blago odprl opozorilo brez zneska (npr. nov field v diagnostika_trgovina ali TRGOVINA_CONTEXT: 'Prodajate blago s kratkim rokom uporabe, serijskimi številkami/loti ali nevarnimi snovmi?')**
- Verdikt: **DODAJ** · Teža: srednja · Preverba: popravljeno
- Raziskava poglavje 7 in 2.3 kažeta, da regulatorna narava blaga spremeni tveganje podjetja, tega pa segment trgovina danes ne zazna nikjer. Ker motor nima showIf, polnega vejanja ni mogoče graditi, a en sam contextOnly zastavičen odgovor je poceni, ne obljublja izračuna in prodajniku da iztočnico.
- *Popravek preverbe:* Potrjeno: v celotnem src/config ni takega vprašanja (grep prazen), in showIf v shemi res ne obstaja — moduleTypes.ts (celoten vmesnik ModuleField/ModuleDefinition, vrstice 133-232) nima takega polja, zato je omejitev na en contextOnly odgovor pravilno utemeljena. Predlog je skladen z obstoječim vzorcem contextOnly polj (orderChannel, pickingMethod, stockVisibility — vsi brez help/explainer).

En konkreten manjkajoč del: ModuleField.default je OBVEZEN (moduleTypes.ts:146, ni opcijsko), predlog pa privzete vrednosti ne navede. Privzeti naj bo 0 ('Ne, nič od tega') — v nasprotju z obstoječimi contextOnly polji, kjer je privzetek pogosto 2 (srednje stanje na lestvici RESNOSTI dela), so opcije tega polja kategorije brez naravnega vrstnega reda po resnosti, zato je 0 kot 'najpogostejše/tipično stanje splošnega veleprodajalca' ustreznejši privzetek.
- **Predlog za izvedbo:** Dodaj eno choice polje, contextOnly: true, brez vpliva na compute(): label 'Prodajate blago s kratkim rokom uporabe, serijskimi številkami/loti ali nevarnimi snovmi?' z opcijami 'Ne, nič od tega' / 'Da, kratek rok uporabe' / 'Da, serijske številke ali loti' / 'Da, nevarne snovi ali posebni pogoji hrambe'. Odgovor se ne monetizira in ne vstopa v noben koš; služi kot podatek za prodajno pripravo (salesReport.ts) in signal, da poročilo regulatorno vejo samo odpre.
- *Vir:* Pogl. 2.3 Segmentacija po lastnostih blaga (118-130); pogl. 7.1-7.5 (808-849), zlasti 7.5 (847-849).

### 6.2 Dodaj kmalu (sistemsko, presega en segment ali zahteva usklajen poseg)

**MANJKA: vprašanje o mehanizmu realizacije prihranjenega časa (predlagano polje 'capacityRealizationMechanism', najbolj naravno v diagnostika_trgovina ali TRGOVINA_CONTEXT) — v config/modules/trgovina.ts in v celotnem registru (grep 'mehanizem\|realizacij\|nadur\|prerazpored' čez src/config/modules/*.ts) ni niti enega vprašanja, KAJ se zgodi s sproščenimi urami; obstaja samo statično opozorilo v UI (npr. ResultsSummary.tsx:82, pdf.ts:161) 'To ni prihranek pri plačah', nikoli pa vprašanje uporabniku.**
- Verdikt: **DODAJ** · Teža: visoka · Preverba: popravljeno
- Trdo pravilo 'prihranek časa ni prihranek plače' je v kodi zapisano samo kot komentar in prikazno besedilo (moduleTypes.ts:31 'Vrednost sproščene delovne in proizvodne kapacitete — ni prihranek pri plačah'), ne pa kot vprašanje, ki bi preverilo, ali podjetje sploh ima pot od ur do denarja. Raziskava to zahteva eksplicitno: pogl. 4.4 (240-248) in 9.4 (958-966) naštejeta pet mehanizmov realizacije, Dodatek C (1454) ima to kot ločeno postavko kontrolnega seznama pred objavo kalkulatorja. Gre za sistemsko vrzel, ki NI omejena na trgovino, a naloga izrecno zahteva, da jo preverim in prijavim znotraj obsega trgovine.
- *Popravek preverbe:* Odsotnost vprašanja je preverjena dobesedno: grep 'mehanizem' po celotnem repozitoriju je prazen; moduleTypes.ts:31, ResultsSummary.tsx:82 in pdf.ts:161 vsebujejo natanko navedeno statično besedilo brez ustreznega vprašanja.

Bistven popravek predlagane lokacije: diagnostika_trgovina JE napačna privzeta izbira. V CELOTNI aplikaciji je vseh sedem diagnostičnih modulov (trgovina, logistika, proizvodnja, maloprodaja, storitve, računovodstvo, splošno) zgrajenih po IDENTIČNEM, strogo ponovljenem vzorcu: natanko štiri polja, natanko dva sparjena tveganjska izida (riskLevelFromScore(A+B,6) za podatke, (C+D,6) za proces), in dobesedno isto besedilo 'Štiri vprašanja o podatkih in odpornosti procesa' v summary VSEH sedmih modulov ter 'ocena tveganja iz štirih odgovorov — brez zneska' v VSEH sedmih vnosih content/methodology.ts (preverjeno z grep, po ena vrstica na modul). Dodajanje petega polja samo v trgovini bi to soglasje prekinilo za en segment od sedmih — arhitekturno tveganje je večje, kot ugotovitev prizna.

Konkretiziran popravljen predlog, če se rešuje zdaj in samo za trgovino: dodaj polje kot PETO polje v diagnostika_trgovina IN eksplicitno popravi (a) summary 'Štiri vprašanja...' → 'Pet vprašanj...' (trgovina.ts:661), (b) docstring (trgovina.ts:650-657), (c) content/methodology.ts vnos za diagnostika_trgovina (137-141) → '...iz petih odgovorov', (d) compute() naj doda TRETJI, NESPARJEN risk izid prek riskLevelFromScore(input.capacityRealizationMechanism, 3) — edino mesto v kodi, kjer bi risk izid izšel iz enega polja namesto iz dveh; to je treba v PR-ju izrecno utemeljiti kot zavestno izjemo.

Alternativa brez kršitve vzorca: umestitev v TRGOVINA_CONTEXT — a te postavke ne generirajo ModuleOutput/bucket:'risk' (namenjene band-midpointom, ICP in pantheon fit), zato vprašanje ne bi moglo v rezultatih prikazati opozorila 'ta prihranek je teoretičen', kar je bil glavni namen predloga.

Ker gre po lastnem priznanju ugotovitve za sistemsko vrzel v vseh osmih dejavnostih, priporočam, da se to eksplicitno prijavi kot ločen, presegajoč predlog (enotna mehanika na ravni ComputeContext/motorja za vse dejavnosti hkrati) — kar presega obseg pregleda enega segmenta — namesto enostranskega posega samo v diagnostika_trgovina.
- **Predlog za izvedbo:** Dodaj eno choice polje (NI contextOnly): key 'capacityRealizationMechanism', label 'Če bi ure, ki jih boste s spodnjimi področji prihranili, dejansko sprostili — kaj bi se z njimi zgodilo?', 4 opcije: 'Manj nadur ali manj zunanjih storitev', 'Ista ekipa bi opravila ali prodala več, brez nove zaposlitve', 'Odložili bi naslednjo zaposlitev', 'Verjetno nič konkretnega — obseg dela bi ostal enak'. compute() doda risk izid 'Realizacija prihranjenega časa' (glej popravek za natančno umestitev).
- *Vir:* Pogl. 4.4 Pet ločenih vrst ekonomskega učinka (240-248); pogl. 9.4 Kapaciteta in realizacija (958-966); Dodatek C, postavka 'Čas ima ločen mehanizem denarne realizacije' (1454).

**Diagnostika_trgovina: štiri samoocenjevalna vprašanja Da/Večinoma/Le približno/Ne (stockAccuracy, knowsItemMargin, shipmentTraceability, keyPersonIndependence — config/modules/trgovina.ts:664-690) — načelo, ne konkreten predlog besedila polj**
- Verdikt: **IZBOLJSAJ** · Teža: srednja · Preverba: popravljeno
- Vsa štiri vprašanja v diagnostika_trgovina uporabljajo ASSURANCE_CHOICES (shared.ts:40-45) — subjektivno samooceno brez imenovalca. Raziskava (pogl. 8, Knjižnica KPI-jev, 851-903) in merilo (f) iz navodil predlagata, da se samoocena, kjer je mogoče, nadomesti ali dopolni s preverljivim KPI z jasnim imenovalcem. Prednost: odgovor je preverljiv v ERP-ju in dvigne zanesljivost poročila (pogl. 10.1) ter izboljša prodajno iztočnico v salesPlaybook.ts.
- *Popravek preverbe:* Natančna primerjava potrjena: ASSURANCE_CHOICES je definiran v shared.ts:40-45 dobesedno ('Da, zanesljivo' / 'Večinoma' / 'Le približno' / 'Ne'), diagnostika_trgovina.ts:664-690 dejansko uporabi ta nabor za vsa štiri polja natanko na navedenih vrsticah. Predlog pa po navodilih (točka 5) zahteva konkretnost za VSA prizadeta polja, ne le za eno (knowsItemMargin) — preostala dva merljiva polja konkretiziram:
- stockAccuracy → 'Pri zadnjem preverjanju (inventura ali vzorčno preštevanje) — za kolikšen delež preštetih artiklov se je stanje v sistemu ujemalo z dejanskim?' s štirimi razponi (npr. Nad 98 % / 90–98 % / 75–90 % / Pod 75 %).
- shipmentTraceability → 'Za kolikšen delež pošiljk v zadnjem mesecu lahko iz sistema razberete, kdo, kdaj in kaj je komisioniral?' z istimi štirimi razponi.
- knowsItemMargin → besedilo iz izvirnega predloga je ustrezno konkretno.
- keyPersonIndependence pravilno ostane kvalitativen (odvisnost od osebe nima naravnega imenovalca).
Vsa nova polja ostanejo choice s štirimi zaporednimi indeksi (0-3), brez help/explainer (skladno z obstoječim vzorcem ASSURANCE_CHOICES polj, ki jih tudi nimajo) in brez posega v compute() — riskLevelFromScore ostane nespremenjen, ker še vedno prejme vrednost 0-3.
- **Predlog za izvedbo:** Kjer je za polje diagnostika_trgovina mogoče formulirati vprašanje z merljivim imenovalcem v 30 sekundah iz glave, naj se Da/Večinoma/Le približno/Ne nadomesti s takim vprašanjem; kjer imenovalca ni (keyPersonIndependence), naj samoocena ostane. Primer za knowsItemMargin: 'Za kolikšen delež prodajnih vrstic v zadnjem mesecu poznate dejansko maržo (po odbitku rabatov in stroškov dostave)?' kot choice s štirimi razponi.
- *Vir:* Pogl. 8 Knjižnica KPI-jev in formul (851-903); merilo (f) navodil pregleda.

### 6.3 Ohranjeno brez sprememb

**ROLE_FIT preslikava v config/icp.ts:101 (id.startsWith('vodja')) za trgovinski vlogi 'vodjaProdaje' in 'vodjaSkladisca' (config/contexts/trgovina.ts:82-83)**
- Verdikt: **OHRANI** · Teža: srednja · Preverba: potrjeno
- Preverjeno neposredno v kodi: contexts/trgovina.ts:82-83 definira vlogi z id 'vodjaProdaje' in 'vodjaSkladisca', obe se dejansko začneta z nizom 'vodja', zato ju icp.ts:101 (candidate.match z id.startsWith('vodja')) pravilno ujame in obema dodeli utež 0,6. Nobena od njiju se ne ujame prej z ostrejšim pravilom za 'direktor'/'lastnik' (icp.ts:91) ali 'finance' (icp.ts:96), vrstni red v ROLE_FIT arrayu pa je pravilen (specifična pravila pred splošnim startsWith). Neskladja ni.
- *Popravek preverbe:* Preverjeno vrstico za vrstico: icp.ts:91 (direktor/lastnik), :96 (finance), :101 (startsWith('vodja')); contexts/trgovina.ts:82 'vodjaProdaje', :83 'vodjaSkladisca'. Ujemanje in vrstni red pravil sta natanko taka, kot ugotovitev trdi. Ni potreben popravek.
- *Vir:* Ni relevantno za raziskavo — gre za notranjo skladnost kode (config/icp.ts in config/contexts/trgovina.ts).

### 6.4 NE dodajaj zdaj

Ta skupina je po navodilih obvezna — pregled, ki predlaga vse, ni pregled.

**NE DODAJAJ ZDAJ: polne panožne regulatorne veje za živila/FEFO, zdravila/GDP, kemikalije/ADR in embalažo/PPWR kot samostojni moduli ali polja z zneski**
- Verdikt: **DODAJ** · Teža: nizka · Preverba: potrjeno
- Raziskava (7.1-7.4) opiše bogat nabor regulatornih zahtev, a vsaka zahteva pravno in produktno specifično presojo, ki je samopostrežni vprašalnik ne more dati brez tveganja napačnega zaključka. Motor nima showIf — vsak tak modul bi se prikazal VSEM podjetjem segmenta trgovina.
- *Popravek preverbe:* Potrjeno: moduleTypes.ts ne vsebuje polja 'showIf' niti na ModuleField niti na ModuleDefinition (preverjen celoten vmesnik, vrstice 133-232) — trditev 'motor nima showIf' drži dobesedno. Sklep se pravilno sklada z ločeno predlagano postavko (kontekstni zastavičen odgovor namesto polnega modula).
- **Predlog za izvedbo:** NE DODAJAJ ZDAJ: štiri polne panožne veje zahtevajo pogojni prikaz (showIf), ki ga motor danes nima. Namesto polnega modula predlagam samo lahek contextOnly zastavičen odgovor (glej ločeno postavko 'dodaj' zgoraj), poln modul pa naj počaka na razširitev motorja s showIf.
- *Vir:* Pogl. 7.1-7.4 (808-845) in 7.5 (847-849).

**NE DODAJAJ ZDAJ: CBAM/EUDR obveznosti za uvoznike kot polno področje z zneskom**
- Verdikt: **DODAJ** · Teža: nizka · Preverba: potrjeno
- Raziskava (7.5) izrecno pravi, da CBAM in EUDR zahtevata ločeno preverjanje konkretnega blaga, carinskih oznak in statusa subjekta. Za to ni mogoče izpeljati smiselnega EUR zneska brez tveganja lažne natančnosti.
- *Popravek preverbe:* Potrjeno: grep 'CBAM|EUDR' čez src/ in content/ je popolnoma prazen — ničesar takega danes v kodi ni. Argumentacija (pravna specifičnost, ozek ciljni krog, tveganje lažne pravne gotovosti) je skladna s trdim pravilom 'ni lažne natančnosti'.
- **Predlog za izvedbo:** NE DODAJAJ ZDAJ: CBAM in EUDR zadevata ozek krog uvoznikov specifičnega blaga. Če Datalab kdaj cilja specifično te uvoznike, naj bo to ločen, ozko targetiran vstopni vprašalnik in ne polje v splošnem segmentu trgovina.
- *Vir:* Pogl. 7.5, CBAM/EUDR (847-849).

**NE DODAJAJ ZDAJ: kvantitativno merjenje cost-to-serve / deleža kupcev z negativnim neto prispevkom (Dodatek D.9)**
- Verdikt: **DODAJ** · Teža: nizka · Preverba: potrjeno
- Dodatek D.9 predlaga vprašanje, ki zahteva activity-based costing — podatek, ki ga MSP v praksi nima pripravljen. Področje je že kvalitativno zajeto: diagnostika_trgovina.knowsItemMargin sprašuje, ali podjetje maržo po artiklu in kupcu sploh pozna.
- *Popravek preverbe:* Potrjeno dobesedno: diagnostika_trgovina.knowsItemMargin (trgovina.ts:671-676) dejansko obstaja z besedilom 'Ali poznate dejansko maržo po artiklu in po kupcu, z rabati in stroški dostave vred?' — natanko to, kar ugotovitev navaja kot 'že zajeto' predhodno vprašanje. Utemeljitev drži.
- **Predlog za izvedbo:** NE DODAJAJ ZDAJ: polna cost-to-serve analitika presega samopostrežni obseg. Diagnostično vprašanje 'knowsItemMargin' že zajema prvi korak; poglobljena analitika sodi v svetovalni/validiran način dela.
- *Vir:* Pogl. 4.2 Cost-to-serve (208-222); Dodatek D.9 (1601-1613), vrstica 1608.

**NE DODAJAJ ZDAJ: kvantitativno merjenje napake napovedi povpraševanja / bullwhip efekta (Dodatek D.5)**
- Verdikt: **DODAJ** · Teža: nizka · Preverba: potrjeno
- Raziskava predlaga vprašanja o napaki napovedi, biasu in variabilnosti dobavnega roka — merljivo le podjetjem s formalnim planiranjem povpraševanja, kar je za ciljno velikost redkost. Področje je že kvalitativno zajeto prek ZALOGE_CAUSES.
- *Popravek preverbe:* Potrjeno dobesedno: ZALOGE_CAUSES na trgovina.ts:303 in :305 se ujemata z navedenim besedilom ('Naročamo po občutku, ne po obratu zaloge' in 'Nabava in prodaja nista usklajeni'). Sklep se smiselno navezuje tudi na predlagani nov vzrok v nabava_trgovina (glej postavko 1 zgoraj).
- **Predlog za izvedbo:** NE DODAJAJ ZDAJ: kvantitativno merjenje napake napovedi zahteva zgodovinske podatke, ki jih MSP praviloma nima pripravljene. Obstoječi kvalitativni vzrok ('Naročamo po občutku, ne po obratu zaloge') to področje že zajame na ravni, primerni za hitri diagnostični kalkulator.
- *Vir:* Pogl. 5.6 Napovedovanje in bullwhip (541-551); Dodatek D.5 (1538-1553).

**NE DODAJAJ ZDAJ: panožni benchmark (primerjava s povprečjem panoge veleprodaje) kot rezultatska postavka**
- Verdikt: **DODAJ** · Teža: nizka · Preverba: potrjeno
- Raziskava (1.1) opozarja, da je veleprodajni benchmark brez primerljivega poslovnega modela lahko bolj zavajajoč kot koristen. Repozitorij sam to že priznava kot zavestno odloženo: config/segments.ts:300-301 eksplicitno navaja FAZA 2.
- *Popravek preverbe:* Potrjeno dobesedno: segments.ts:300-301 vsebuje natanko naveden komentar 'FAZA 2 (namerno izven obsega te gradnje): - benchmark proti vrstnikom (pravno neopredeljeno, spec §5b)'. Odločitev je torej že eksplicitno dokumentirana v kodi, ne le v raziskavi. Ni potreben popravek.
- **Predlog za izvedbo:** NE DODAJAJ ZDAJ: benchmark je že eksplicitno naveden kot Faza 2 v config/segments.ts:300-301, kar je skladno z opozorilom raziskave. Ne predlagam spremembe te odločitve.
- *Vir:* Pogl. 1.1 (vrstica 49); config/segments.ts:300-301 (obstoječa opomba v kodi).

---
## 7. Kaj je pregled ovrgel

**1 od 117 postavk je bila ovržena.**

**`reducibleShareField` — "Ne vem" naj bi padel na isti (neničelni) delež kot "Do 5 %".** Izvirni pregled je trdil, da to krši princip UNKNOWN_ANSWER (da neznano ne sme tiho postati denar), ker izbira "Ne vem" pri deležu sprostljive zaloge (`zaloge_trgovina.reducibleShare`) vseeno izračuna nenišelen sprostljiv kapital namesto 0.

Skeptična preverba je našla, da v kodi obstaja izrecen, dokumentiran razlog: `shared.ts` komentar pravi, da je 0,05 **namerno** izbran kot najnižja (najbolj konservativna) vrednost v celotnem razponu, ne poljubna številka. Pomembneje: `moduleTypes.ts` (`FieldChoice.unknown`) izrecno navaja, da "Ne vem" *"znižuje oznako zanesljivosti rezultata"* — in `potential.ts` to dejansko izvede: vsak `unknown:true` odgovor šteje v `unknownAnswers`, kar neposredno prepreči oznako "Visoka zanesljivost" (pade na kvečjemu "Srednja"). `salesPlaybook.ts` iz vsakega takega odgovora dodatno generira prodajno vprašanje. Signal torej obstaja — na ravni celotnega poročila (badge zanesljivosti), ne na ravni ene kartice, kot je pričakoval izvirni pregled.

**Vzorec napake:** izvirni pregledovalec je preveril samo eno funkcijo (`reducibleShareOf`) izolirano, ne pa mehanizma za oceno zanesljivosti, ki jo "Ne vem" odgovori hranijo. Predlagan popravek (sprememba deleža na 0) bi dejansko **kršil** raziskovalno pravilo, ki ga je pregledovalec sam citiral ("teže niso diskont koristi, so komunikacijski signal") — 0 bi "Ne vem" spremenil v trditev "ni sprostljivega kapitala", kar je lažna natančnost v nasprotni smeri. Verdikt je spremenjen v `ohrani`; ostala je le drobna, ločena kozmetična pripomba (kartica "Sprostljiv obratni kapital" naj pri nizki zanesljivosti dobi isto predpono "najmanj ..." kot ostale kartice).

Poleg tega je preverba pri štirih predlogih v horizontalah (`[horiz-3]`, `[horiz-8]`, `[horiz-12]`, `[horiz-23]`) popravila predlagano besedilo, ne osnovne diagnoze — izvirni predlogi so pravilno našli prekrivanje, a so v popravljenem help besedilu poimenovali sosednji panožni modul po naslovu (npr. "sodi v področje Odprema"), kar krši dokumentirano arhitekturno pravilo, da horizontale (deljene med do šestimi segmenti) ne smejo imenovati področja, ki v drugem segmentu morda ne obstaja.

---

## 8. Priporočen vrstni red izvedbe

### Faza 0 — eno-vrstični popravki (minuta na postavko, brez arhitekturnega tveganja)
1. `narocila_trgovina.annualPricingMarginLossEUR` in `zaloge_trgovina.annualStockoutMarginLossEUR`: `bucket: 'directLoss'` → `bucket: 'lostMargin'` (`[modul-ab-6]`, `[modul-cd-13]`). Uskladi tri prizadete teste v `trgovina.test.ts`.
2. `zaloge_trgovina.mainCause` vzrok "Zalogo zavestno držimo kot varovalko": `category: 'people'` → `category: 'planning'` (`[modul-cd-16]`).
3. `dokumentiHz` vzrok "Potrjevanje poteka ročno...": `category: 'planning'` → `category: 'data'`, uskladi `horizontal.test.ts` (`[horiz-21]`).
4. Dodaj `allowUnknown: true` na pet EUR/leto polj: `zaloge_trgovina.annualWriteOffEUR`, `financeHz.annualPenaltyEUR`, `kadriHz.annualPayrollErrorEUR`, `dokumentiHz.annualDocDelayEUR`, `servisHz.annualServiceCostEUR` (`[modul-cd-12]`, `[horiz-10]`, `[horiz-15]`, `[horiz-20]`, `[horiz-24]`); enako na `odprema_trgovina.annualRedeliveryCostEUR` in `terjatve_trgovina.annualBadDebtEUR` (`[modul-ab-12]`, `[modul-e-4]`).
5. Popravi besedilo `StepEmployeeCount.tsx` trust-note, da ne trdi "na izračun ne vpliva" (`[koraki-2]`).
6. Popravi zamenljivi `pantheon[2]` niz v `zalogeTrgovina` ("Skladišča, lokacije..." → "Serije, lotna sledljivost..."), da ne podvaja `skladisceTrgovina.pantheon[0]` (`[modul-cd-18]`).

### Faza 1 — polja z manjkajočimi help/explainer/mejami (pol dneva)
7. Dodaj help+explainer na: `narocila_trgovina.priceFixHoursPerMonth`, `zaloge_trgovina.annualWriteOffEUR`, `financeHz.closingHoursPerMonth`, `dokumentiHz.searchArchiveHoursPerMonth`, `dokumentiHz.manualExchangeHoursPerMonth`, `kadriHz.payrollPrepHoursPerMonth`, `kadriHz.hrAdminHoursPerMonth` (glej natančna besedila v razdelkih 4–5) — **pri vsakem popravku upoštevaj arhitekturno pravilo "brez imenovanja sosednjih področij"** za horizontale.
8. Dodaj eksplicitno mejo za sestavljene dogodke (pošiljka IN cena narobe hkrati) v `narocila_trgovina.annualPricingMarginLossEUR` in `odprema_trgovina.annualCreditNoteEUR` (`[modul-ab-6]`, `[modul-ab-13]`); zapri tretjo stran istega problema proti `servisHz` (garancijski primeri) v `odprema_trgovina.annualCreditNoteEUR` in `claimHandlingHoursPerMonth` (`[modul-ab-13]`, `[modul-ab-15]`).
9. Odstrani `zaloge_trgovina.stockVisibility` (podvaja `diagnostika_trgovina.stockAccuracy`) (`[modul-cd-15]`).
10. Popravi privzetke `diagnostika_trgovina` (kratkoročno: vse štiri na 0, glej opozorilo o obratni pristranskosti v `[modul-e-12]`).

### Faza 2 — arhitekturni popravki znotraj trgovine (dan do dva)
11. Razdeli Modul E: obdrži `sqlServer2016`/`windowsServer2016` s PANTHEON-gatingom, `eInvoiceZierded` prestavi v nov, vedno prikazan modul brez triaže (`[modul-e-16]`) — nato razširi `icp.ts` urgency dimenzijo, da bere tudi iz novega modula (`[modul-e-17]`).
12. Preoblikuj `terjatve_trgovina`: dodaj `agreedPaymentTermDays`, naredi `currentDSODays` resničen vnos z `allowUnknown`, izpelji `overdueDaysAverage` v `compute()` (`[modul-e-2]`) — usklajeno preveri isti vzorec v `splosno.ts`.
13. Dodaj `usesCapitalCost` zastavico v `moduleTypes.ts`, poveži jo v `potential.ts` (`assessConfidence`) in `salesReport.ts` (`[koraki-22]`).
14. Poveži `businessType` v `salesPlaybook.ts` (npr. prek `content/sales/pantheonFit.ts`) ali sprosti `canProceed` zanj (`[koraki-3]`).

### Faza 3 — nova vsebina (teden+)
15. Dodaj modul `nabava_trgovina` (`[vrzeli-1]`) — poln predlog polj v razdelku 6.1; vpiši v `content/methodology.ts` in `content/actions/actions.ts`; po dodatku ponovno preveri `defaultIds`/`recommendedCount` triaže (`[koraki-16]`, `[koraki-17]`).
16. Preoblikuj `annualStockoutMarginLossEUR` v izpeljano polje (izgubljene vrstice × povprečna vrednost × `contributionMarginRate`), doda `usesMargin: true` (`[koraki-21]`).
17. Dodaj lahek contextOnly indikator regulirane/pokvarljive narave blaga (`[vrzeli-5]`).

### Presega en segment — prijavi, ne izvajaj samostojno znotraj trgovine
18. Vprašanje o mehanizmu realizacije prihranjenega časa (`[vrzeli-2]`) — zahteva usklajeno odločitev za vseh sedem segmentov (nov tip risk izida ali razširitev sheme), ne enostranski poseg v `diagnostika_trgovina`.
19. Enak vzorec napačnega bucketa (`directLoss` namesto `lostMargin`) je bil pri tem pregledu mimogrede najden tudi v drugih segmentih (glej precedens `logistika.ts`, `storitve.ts` v izhodiščnih navodilih) — vreden ločenega, celovitega prečesavanja registra.
20. Diagnostični privzetki (1/1/2/1 vzorec) so identični v vseh sedmih segmentih — dolgoročna rešitev (peta izbira "Ne vem" na diagnostičnih poljih, glej `[modul-e-12]`) zahteva poseg v `shared.ts`/`moduleTypes.ts` in je vredna ločenega kroga.
