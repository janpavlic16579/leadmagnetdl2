# Maloprodaja — pregled vprašalnika in navodilo za izvedbo

> **Kaj je to.** Popoln izid strokovnega pregleda vprašalnika za dejavnost **maloprodaja**, zapisan tako,
> da ga je mogoče izročiti razvijalcu ali modelu kot delovno navodilo. Vsebuje vseh 129 sodb s
> konkretnimi predlogi besedil, tipov, enot, privzetkov in mest v kodi.
>
> **Kako je nastal.** Šest pregledovalcev po področjih vprašalnika po postopku iz
> `NAVODILA-pregled-vprasalnika-po-dejavnosti.md`; vsaka ugotovitev je nato šla skozi skeptično
> preverbo, ki jo je poskusila ovreči ob kodi in raziskavi. Popravki preverbe so pri vsaki sodbi
> zapisani ločeno — **beri jih, preden izvedeš predlog**, ker pogosto vsebujejo pogoj, brez katerega
> predlog podre test ali ustvari novo dvojno štetje.
>
> **Datum:** 13. avgust 2026 · **commit:** `ba58fb3`

---

## 0. Preden se lotiš

**Repozitorij:** `/Users/janpavlic/Documents/Datalab/aplikacije/ROI kalkulator`
Pot `Datalab/Claude code` je **zastarela kopija** — v njej ne popravljaj ničesar.

**Vira resnice za vsebino:** `maloprodaja/Raziskava_maloprodaja_PANTHEON.md` in strukturirani registri
iz `Datalab_raziskava_maloprodaja_model.xlsx` (katalog bolečin B01–B29, KPI K01–K20, formule F01–F12,
predpostavke A01–A27, vprašanjski register Q01–Q35, Bolecina_finance, Problem_podatki).

### Trda pravila, ki jih noben predlog ne sme prekršiti

1. **Prihranek časa ni prihranek plače.** Sproščene ure se ne smejo prikazati kot denar, ki ga podjetje dobi nazaj.
2. **Prihodek ni korist** — pri dodatni prodaji je korist prispevna marža.
3. **Sprostitev kapitala je enkratni denarni učinek**, ne letni prihranek; koš `oneTimeCapital` se nikoli ne sešteva z letnimi.
4. **Tveganje se ne monetizira** brez verjetnosti in posledice; koš `risk` nima EUR.
5. **Ista ura ali evro ne smeta v dve področji.** Meja mora biti zapisana v besedilu **obeh** sosedov.
6. **Ni lažne natančnosti.** Kjer podjetja podatka nimajo, je pošten odgovor razpon ali »ne vem«.
7. **Panožni benchmark ni slovenski privzetek** (NRF shrink 1,6 %, vračila 19,3 % — samo za sanity check).

### Tehnične omejitve sheme

- Vrednosti so števila (`Record<string, number>`); `checkbox` je 0/1; `percent` je ulomek (0,03 = 3 %).
- **Vrednosti izbir so zaporedni indeksi**, ne deleži; izid se poišče v tabeli. Odstranitev sredinske možnosti premakne pomen shranjenih vrednosti.
- **Vsako polje s `help` mora imeti tudi `explainer`** (`modules/explainers.test.ts`). Konvencija: `help` = meja proti sosednjim področjem, `explainer` = izpeljava s številčnim primerom.
- `allowUnknown: true` samo za zneske, ki jih podjetje bodisi vodi bodisi ne — ne za ure in števila.
- **Pogojnega prikaza modula ali polja (`showIf`) motor NIMA.** Vsak predlog, ki ga predpostavlja, je nova zmožnost.
- `plausibility.ts` sešteva samo polja z enoto `h/mesec` in `h/leto`; zmnožek dveh polj mu uide.
- Nov modul potrebuje vnos v `content/methodology.ts` **in** `content/actions/actions.ts` — brez obeh pade `moduleEngine.test.ts`.
- Novi stolpci v `exportRecord.ts` gredo **na konec**; test preverja enako dolžino stolpcev in vrstice.
- Modul ima 5–7 polj (`maloprodaja.test.ts`); osmo polje zahteva razdelitev modula ali dvig meje.

### Kaj v tem pregledu MANJKA

**Horizontale niso pregledane.** Agent za `analitikaHz`, `financeHz`, `kadriHz`, `dokumentiHz` in
`servisHz` (25 polj + 5 triažnih pozivov, z vidika maloprodaje) je padel na prekinjeni povezavi in
ponovni zagon ni bil dokončan. Sodbe o horizontalah v tem dokumentu so samo tiste, ki so jih mimogrede
zajeli drugi pregledovalci (K-23 do K-27 za triažne pozive, V-12 za razporede izmen). Preden se
horizontal dotakneš, je zanje treba pognati ločen pregled.

---

## 1. Bilanca

| Sodba | Št. |
|---|---:|
| ohrani | 34 |
| izboljšaj | 73 |
| dodaj | 21 |
| premakni | 1 |
| odstrani | 0 |
| **skupaj** | **129** |

Preverba: **44 potrjenih** brez popravka, **85 popravljenih** v podrobnostih, **0 ovrženih** v celoti.
Po teži: 36 visokih, 54 srednjih, 39 nizkih.

Da ni nobene sodbe »odstrani«, ni spregled: vsako polje `contextOnly` v maloprodaji je bilo preverjeno
proti `salesReport.ts` in `salesPlaybook.ts` in vsa se izpišejo v prodajni pripravi.

---

## 2. Vrstni red izvedbe

Faze so urejene od najcenejšega in takoj vidnega do posegov, ki zahtevajo odločitev. Znotraj faze
izvajaj po vrsti — nekatere sodbe se izrecno sklicujejo druga na drugo.

### Faza A — Besedila — nič ne spremeni izračuna

Popravi trditve, ki jih stranka in prodajnik danes bereta, ter meje proti dvojnemu štetju. Vsako polje, ki dobi `help`, mora dobiti tudi `explainer` (to zahteva `modules/explainers.test.ts`).

| Oznaka | Teža | Kaj |
|---|---|---|
| **ZM-12** | visoka | content/methodology.ts:144-149 — besedilo "Kako smo izračunali" za področje Presežna zaloga |
| **ZM-22** | visoka | content/methodology.ts:150-155 — besedilo "Kako smo izračunali" za področje Cene, akcije in marža |
| **BP-05** | nizka | blagajnaMp / openDaysPerWeek: "Koliko dni v tednu obratujete?" |
| **ZM-02** | nizka | zalogeMp.summary — "Odpisano in poteklo blago, marža, izgubljena s prisilnimi znižanji, ter kapital, vez… |
| **BP-02** | nizka | blagajnaMp / summary: "Dnevni zaključki blagajn, inventure ter neznane razlike med sistemom in dejanskim… |
| **PS-11** | srednja | Podnaslov področja: »Odpovedana spletna naročila, dejanski strošek vračil ter ročno usklajevanje artiklo… |
| **PS-18** | srednja | pantheon iztočnice kanaliMp — 'Enotna baza artiklov in cenikov za vse prodajne kanale', 'Sprotna zaloga,… |
| **ZM-11** | srednja | zalogeMp.pantheon — tri iztočnice PANTHEON za to področje |
| **BP-20** | nizka | prevzemMp / pantheon: "Elektronski prevzem dobaviteljevega dokumenta (eSLOG)", "Terminali za prevzem in … |
| **BP-26** | srednja | diagnostikaMp / pantheon: "Sprotna zaloga in marža po artiklu ter poslovalnici", "Serije, loti in roki u… |
| **PS-05** | visoka | expressDeliveryCostEUR — »Koliko ste v zadnjih 12 mesecih plačali za ekspresne dobave in nujne prevoze, … |
| **PS-13** | visoka | returnsPerMonth — »Koliko spletnih naročil vam kupci mesečno vrnejo?« (maloprodaja.ts:741-747) |
| **PS-16** | visoka | orderProcessingHoursPerMonth — »Koliko skupnih ur mesečno porabite za ročno obdelavo spletnih naročil, p… |
| **BP-14** | visoka | prevzemMp / goodsReceiptHoursPerMonth: "Koliko skupnih ur mesečno porabite za prevzem blaga in vnos doba… |
| **BP-03** | srednja | blagajnaMp / tillCount: "Koliko blagajniških mest imate skupaj v vseh poslovalnicah?" |
| **BP-07** | srednja | blagajnaMp / stocktakeHoursPerYear: "Koliko ur na leto skupaj porabite za inventure — s pripravo, štetje… |
| **BP-15** | srednja | prevzemMp / documentMatchingHoursPerMonth: "Koliko ur mesečno porabite za usklajevanje dobavnic, računov… |
| **BP-16** | srednja | prevzemMp / transferHoursPerMonth: "Koliko ur mesečno porabite za prenose blaga med poslovalnicami in sk… |
| **ZM-04** | visoka | zalogeMp.forcedMarkdownMarginEUR — "Koliko marže ste v zadnjih 12 mesecih izgubili s prisilnimi znižanji… |
| **ZM-17** | srednja | marzeMp.unclaimedRebatesEUR — "Kolikšno vrednost dobaviteljskih rabatov, bonusov in sofinanciranja akcij… |
| **PS-12** | srednja | cancelledOrderSalesEUR — »Kolikšna je letna prodajna vrednost spletnih naročil, ki jih odpoveste ali ne … |
| **PS-14** | srednja | costPerReturnEUR — »Koliko vas v povprečju stane eno vračilo?« (maloprodaja.ts:748-758) |
| **ZM-10** | srednja | zalogeMp.compute — postavka "Strošek financiranja presežne zaloge" (releasableEUR × capitalCostRate) pro… |
| **ZM-20** | srednja | marzeMp.mainCause — MARZE_CAUSES, "Kaj je glavni vzrok?" |
| **BP-28** | srednja | Modul E / sqlServer2016: "Uporabljamo SQL Server 2016" |
| **BP-30** | visoka | Modul E / eInvoiceZierded: "Nimamo urejenega kanala za e-račune" |
| **K-06** | nizka | Uvodni podnaslov koraka 1: »… za priporočena tri vzame okoli deset minut.« (StepIndustry.tsx:57–61) |
| **K-07** | srednja | »Koliko ljudi zaposlujete?« (src/components/Calculator/StepEmployeeCount.tsx:26) |
| **K-08** | visoka | Opomba pod poljem: »Podatek na izračun ne vpliva — iz njega izpeljemo le velikostni razred podjetja, ki … |
| **K-10** | nizka | Uvod koraka 3: »Tri vprašanja, ki ne sprašujejo po številkah. Iz njih izpeljemo, koliko od izmerjenega s… |
| **K-31** | srednja | costBasisIntro: »Pet številk, ki veljajo za vsa področja …« (src/config/contexts/maloprodaja.ts:61–62) |
| **V-17** | nizka | KANDIDAT ZAVRNJEN: kraja kot ločeno vprašanje z lastnim ukrepom (B17, H12) |
| **V-18** | nizka | KANDIDAT ZAVRNJEN: izgubljena prodaja med zaprtjem trgovine zaradi inventure (B16) |
| **V-19** | nizka | KANDIDAT ZAVRNJEN: vrednost blaga, izgubljenega pri prenosih med enotami (B07) |
| **V-15** | nizka | KANDIDAT ZAVRNJEN: staranje zaloge po 90/180/365 dneh v evrih (Q26, B10) |
| **K-17** | visoka | Triaža zalogeMp: »Koliko blaga vam obleži — poteče, se poškoduje ali ga morate prodati z znižanjem?« (sr… |
| **K-18** | srednja | Triaža marzeMp: »Kako pogosto ugotovite, da je bil artikel prodan po napačni ceni ali da dogovorjen doba… |
| **K-19** | visoka | Triaža blagajnaMp: »Koliko časa in denarja poberejo dnevni zaključki blagajn ter razlike, ki jih odkrije… |
| **K-21** | srednja | Triaža prevzemMp: »Koliko ročnega dela imate s prevzemom blaga, dokumenti dobaviteljev in prenosi med en… |
| **K-22** | srednja | Triaža kanaliMp: »Kako pogosto spletna prodaja povzroči dodatno delo ali strošek — odpovedi, vračila, ro… |
| **K-24** | nizka | Triaža financeHz: »Koliko ročnega dela je v vašem računovodstvu in financah (knjiženje, usklajevanje, ob… |
| **PS-10** | nizka | Triaža kanaliMp: »Kako pogosto spletna prodaja povzroči dodatno delo ali strošek — odpovedi, vračila, ro… |
| **ZM-13** | srednja | marzeMp.triage.prompt — "Kako pogosto ugotovite, da je bil artikel prodan po napačni ceni ali da dogovor… |
| **BP-01** | visoka | blagajnaMp / triage.prompt: "Koliko časa in denarja poberejo dnevni zaključki blagajn ter razlike, ki ji… |

### Faza B — Podatki, deleži in stropi — majhen poseg, velik učinek na znesek

Same konstante in seznami možnosti. Vsaka sprememba deleža mora nositi zapisan vir in oznako KALIBRACIJA.

| Oznaka | Teža | Kaj |
|---|---|---|
| **ZM-06** | visoka | zalogeMp.reducibleShare — "Kolikšen delež zalog bi po vaši oceni lahko zmanjšali, ne da bi se police spr… |
| **ZM-09** | visoka | zalogeMp.mainCause — ZALOGE_CAUSES, "Kaj je glavni vzrok?" |
| **ZM-15** | visoka | marzeMp.wrongPriceSalesSharePercent — "Kolikšen delež prodaje steče po napačni, zastareli ali pozabljeni… |
| **ZM-16** | srednja | marzeMp.marginGapPercent — "Za koliko odstotnih točk je marža pri tej prodaji nižja od načrtovane?" |
| **PS-03** | visoka | lostSalesSharePercent — »Kolikšen delež letne prodaje po vaši oceni izgubite, ker artikla ni na zalogi?«… |
| **PS-04** | srednja | substitutionShare in SUBSTITUTION_SHARES — »Kolikšen del teh kupcev kupi drug artikel pri vas ali se vrn… |
| **PS-17** | srednja | mainCause (KANALI_CAUSES) — »Kaj je glavni vzrok?« s petimi možnostmi (maloprodaja.ts:703-709, 777) |
| **ZM-07** | srednja | zalogeMp.staleStockShare — "Kolikšen del zaloge se v zadnjih šestih mesecih ni prodal?" (contextOnly) |
| **K-13** | srednja | currentSystem: »Kako danes vodite maloprodajo?« — 5 možnosti (src/config/contexts/maloprodaja.ts:80–99) |
| **K-35** | visoka | contributionMargin: »Povprečna prispevna marža«, pasovi 12/20/30/42 %, fallback 25 % (src/config/context… |
| **BP-18** | visoka | prevzemMp / mainCause (PREVZEM_CAUSES): "Kaj je glavni vzrok?" — zlasti možnost "Dobavitelji dokumentov … |
| **V-13** | nizka | MANJKA: napačen picking kot ločen razlog vračila in vzrok (B20, K13) |

### Faza C — Izračun in motor — zahteva popravek testov

Posegi v `compute`, `potential.ts` in `plausibility.ts`. Vsak spremeni pričakovane vrednosti v testih.

| Oznaka | Teža | Kaj |
|---|---|---|
| **K-14** | visoka | currentSystem — VREDNOSTI pasov izboljšave: 0,08–0,20 / 0,15–0,30 / 0,15–0,30 / 0,25–0,40 / 0,25–0,40 (s… |
| **BP-09** | visoka | blagajnaMp / mainCause (BLAGAJNA_CAUSES): "Kaj je glavni vzrok?" — vključno z vzrokoma "Kraja kupcev ali… |
| **BP-06** | visoka | blagajnaMp / shrinkageEUR: "Kolikšna je bila po nabavni vrednosti neznana razlika (manko) ob zadnji inve… |
| **BP-04** | visoka | blagajnaMp / closingMinutesPerTillPerDay: "Koliko minut na dan porabi ena blagajna za odprtje, zaključek… |

### Faza D — Nova polja v obstoječih področjih

Vsako novo polje potrebuje `help`, `explainer`, privzetek 0 in razmislek, ali podaljša vprašalnik čez mejo 5–7 polj na modul.

| Oznaka | Teža | Kaj |
|---|---|---|
| **V-01** | visoka | MANJKA: nabavni proces — ure za pripravo in oddajo naročil dobaviteljem (polje 'purchaseOrderHoursPerMon… |
| **V-02** | visoka | MANJKA: šifrant artiklov — ure za vnos in popravke artiklov, podvojeni zapisi, manjkajoče črtne kode (po… |
| **BP-10** | visoka | (manjka v blagajnaMp) "Koliko so v zadnjih 12 mesecih skupaj znašali nepojasnjeni manjki gotovine ob zak… |
| **ZM-08** | srednja | zalogeMp — NOVO polje agedStockValueEUR: "Kolikšna je vrednost zaloge (po nabavni ceni), ki se v zadnjih… |
| **ZM-18** | srednja | marzeMp.priceMaintenanceHoursPerMonth — "Koliko skupnih ur mesečno porabite za vzdrževanje cenikov, akci… |
| **V-03** | srednja | MANJKA: izpad blagajne, povezave ali sistema — izgubljena prodaja (polje 'outageLostSalesEUR' v blagajna… |
| **BP-19** | nizka | (manjka v prevzemMp) "Koliko dobav dobaviteljev prevzamete v povprečnem mesecu?" |
| **PS-19** | nizka | NOVO polje v kanaliMp: »Koliko spletnih naročil imate na mesec?« (contextOnly, izbira razpona) |
| **V-10** | nizka | MANJKA: OTIF dobavitelja — delež pravočasnih in popolnih dobav (K08, B06) |
| **V-11** | srednja | MANJKA: znesek razlik med naročilom, dobavnico in računom (B06) |
| **V-12** | srednja | MANJKA: razporedi izmen, menjave in nadomeščanja — ure priprave (§8.10) |
| **V-14** | nizka | MANJKA: čas do aktivacije novega artikla (K17) |

### Faza E — Struktura — zahteva odločitev pred izvedbo

Novi moduli, nova kontekstna vprašanja, prodajna priprava in ICP. Vsak poseg se dotakne več datotek hkrati.

| Oznaka | Teža | Kaj |
|---|---|---|
| **K-20** | visoka | Manjka: triažno vprašanje »Inventurni manko in točnost zaloge« |
| **K-02** | visoka | INDUSTRIES, možnost 'trgovina' → oznaka »Trgovina, veleprodaja in distribucija« (src/config/industries.t… |
| **K-03** | visoka | INDUSTRIES, možnost 'maloprodaja' → oznaka »Maloprodaja« (src/config/industries.ts:33) |
| **K-04** | visoka | DRUGO_SUB_INDUSTRIES, možnost 'drugo_blago' → »Prodajamo ali distribuiramo blago« → segment 'trgovina' (… |
| **K-09** | srednja | Manjka: »Koliko poslovalnic imate?« (in ali imate lastno skladišče) — korak 2 |
| **K-11** | visoka | businessType: »Kako pretežno prodajate?« — 5 možnosti (src/config/contexts/maloprodaja.ts:64–73) |
| **K-12** | srednja | Manjka: vprašanje o lastnostih blaga (Q02) — korak 3 |
| **K-15** | visoka | role: »Kakšna je vaša vloga?« — 5 možnosti, 'drugo' s freeText (src/config/contexts/maloprodaja.ts:101–1… |
| **K-28** | srednja | triage.recommendedCount = 3 (src/config/segments.ts:179) |
| **K-29** | srednja | triage.defaultIds = ['razpolozljivostMp','zalogeMp','blagajnaMp'] (src/config/segments.ts:180) |
| **K-30** | srednja | Zaslon triaže: 11 področij, vsako s promptom, štirimi možnostmi in potrditvenim poljem, na eni strani (s… |
| **K-34** | visoka | annualRevenue: »Letni prihodek od prodaje blaga«, pasovi 0,6/1,8/5,5/15 mio, fallback 0 (src/config/cont… |
| **K-36** | srednja | capitalCostRate: »Letni strošek financiranja obratnega kapitala«, pomoč »… Množi denar, vezan v terjatva… |
| **K-37** | visoka | Skupna finančna osnova → prodajna priprava: manjkajo vrstice za prihodek, prispevno maržo in strošek kap… |
| **V-04** | srednja | MANJKA: rok 1. 1. 2028 za e-račune in delež strukturiranih e-dokumentov B2B — ne-PANTHEON trgovec tega s… |
| **V-06** | srednja | MANJKA: lastnosti blaga — pokvarljivo, sezonsko, loti/serije, visoka vrednost, tehtano (Q02) |
| **V-07** | srednja | MANJKA: poslovni model franšize, komisije in mešanega lastništva zaloge (Q03, arhetip 8) |
| **V-09** | srednja | MANJKA: obseg — število prodajnih mest in število aktivnih artiklov (SKU) (Q04, Q05) |
| **ZM-19** | srednja | marzeMp.previousPriceProof — "Ali lahko za posamezen artikel, poslovalnico in kanal dokažete najnižjo ce… |
| **BP-27** | visoka | Modul E kot celota — prikaz samo uporabnikom PANTHEON (isTechnicalRiskModuleVisible) |
| **BP-22** | visoka | diagnostikaMp / stockAccuracy: "Ali se zaloga v sistemu ujema z dejansko zalogo na polici?" |
| **BP-24** | visoka | diagnostikaMp / goodsTraceability: "Ali lahko za posamezen artikel zanesljivo ugotovite dobavitelja, ser… |

### Faza F — Šele po kalibraciji (~50 vnosov) ali sploh ne

Predlogi, ki jih pregled izrecno odsvetuje zdaj. Razlogi so v posamezni sodbi.

| Oznaka | Teža | Kaj |
|---|---|---|
| **V-05** | srednja | MANJKA: status vira podatka — izvoz / dokument / ocena / razpon / ne vem (Q34, §16.3) |
| **V-08** | nizka | ZMOŽNOST: pogojni prikaz vprašanj glede na lastnosti blaga in poslovni model (showIf) |
| **V-16** | nizka | KANDIDAT ZAVRNJEN ZA ZDAJ: sledljivost lota in hitrost odpoklica (B08, SP08, GS1) |
| **V-20** | srednja | KANDIDAT ZAVRNJEN: količinski imenovalci in COGS — transakcije, nabavna vrednost prodanega blaga, delež … |
| **V-21** | nizka | KANDIDAT ZAVRNJEN: čas do odkritja maržnega odstopanja (B26, K20) |

### Dvojno pregledane sodbe — beri v paru

Triažni pozivi so bili v obsegu dveh pregledovalcev hkrati (korak 1–5 in pripadajoči modul), zato ima
isto vprašanje dve sodbi. Predloga se večinoma dopolnjujeta; pri prvem paru si **nasprotujeta** in je
odločitev treba sprejeti zavestno.

| Par | Vprašanje | Kako razrešiti |
|---|---|---|
| **K-17** proti **ZM-01** | triažni poziv `zalogeMp` | Nasprotujeta si: K-17 zahteva izboljšavo, ZM-01 pravi »ohrani«. Sledi K-17 — njegov argument (poziv ne omenja kapitala, čeprav modul računa največjo posamično številko vprašalnika) je preverjen v izračunu, ZM-01 pa je poziv presojal samo glede na odpise in znižanja. |
| **K-18** proti **ZM-13** | triažni poziv `marzeMp` | Isti sklep, dve besedili. Vzemi ZM-13 (pokrije tudi ure vzdrževanja cenikov), K-18 uporabi kot preverbo stopenj. |
| **K-19** proti **BP-01** | triažni poziv `blagajnaMp` | Isti sklep. Vzemi BP-01 — njegova preverba izrecno zavrne ocenjevanje »po slabšem od obojega«, ki bi triažne ocene blagajne napihnilo. |
| **K-22** proti **PS-10** | triažni poziv `kanaliMp` | Isti sklep. Vzemi PS-10 — ima izpisane vse štiri stopnje, K-22 samo dve. |
| **K-16** in **PS-01** | triažni poziv `razpolozljivostMp` | Oba »ohrani«, brez nasprotja. |

### Ne spreminjaj

Te sodbe so »ohrani«: vprašanje je dobro tako, kot je. Vsaka ima v razdelku 3 zapisano, kaj varuje —
preberi, preden karkoli od tega premakneš. (Sodbe »ohrani« iz faze F niso tu: tam ne gre za obstoječa
vprašanja, ampak za predloge, ki jih pregled zavrača.)

**K-01**, **K-05**, **K-16**, **K-23**, **K-25**, **K-26**, **K-27**, **K-32**, **K-33**, **PS-01**, **PS-02**, **PS-06**, **PS-07**, **PS-08**, **PS-09**, **PS-15**, **ZM-01**, **ZM-03**, **ZM-05**, **ZM-14**, **ZM-21**, **BP-08**, **BP-11**, **BP-12**, **BP-13**, **BP-17**, **BP-21**, **BP-23**, **BP-25**, **BP-29**

---

## 3. Vse sodbe

Vsaka sodba ima: **utemeljitev** (stanje v kodi s sklici `file:line`), **predlog** (kaj narediti) in
**preverbo** (kaj je skeptični pregled v predlogu popravil ali zavrnil).


---

## K · Koraki 1–5

### K-01 · ohrani · teža nizka · preverba: potrjeno

**INDUSTRY_QUESTION: »S čim se ukvarja vaše podjetje?« (src/components/Calculator/StepIndustry.tsx:33)**

*Utemeljitev.* Preverjeno v kodi: konstanta je na StepIndustry.tsx:33, getSegmentForIndustry na industries.ts:111, industryLabel v prodajno pripravo na salesReport.ts:281 (getIndustryLabel). Vse tri sklice držijo dobesedno. Vprašanje res ne vstopa v nobeno formulo, določi pa segment in s tem 11 področij, obe urni postavki in vse formule. Zaporedje »arhetip → obseg → procesni signal« iz §26 je spoštovano. Težava je res v seznamu odgovorov, ne v vprašanju.

*Preverba.* Brez popravkov — vse tri številke vrstic in vse trditve so preverjene v kodi.

*Vir v raziskavi.* Raziskava §26, §16.1 korak 1

### K-02 · izboljsaj · teža visoka · preverba: popravljeno

**INDUSTRIES, možnost 'trgovina' → oznaka »Trgovina, veleprodaja in distribucija« (src/config/industries.ts:27)**

*Utemeljitev.* Preverjeno: oznaka je res na industries.ts:27, maloprodaja na 33, seznam v 25–44 (ne 26–43). segments.ts:129 displayName je res »Veleprodaja in distribucija«, moduleIds 130–143 res merijo komisioniranje, terjatve in odpremo. Napačna izbira je nepovratna, ker segment določi vse. POMEMBNO, kar ugotovitev spregleda: industries.test.ts:94–98 ima test »navadna dejavnost nima ločene oznake za obiskovalca«, ki za VSAKO postavko v INDUSTRIES zahteva industryChoiceLabel(industry) === industry.label. Predlog v sedanji obliki podre ta test — in ta test kodira zavestno odločitev, da ločeni oznaki nosita samo pod-dejavnosti.

*Predlog.* Trije koraki, ki morajo iti skupaj: (1) v industries.ts dodaj choiceLabel: 'Veleprodaja in distribucija — prodajamo podjetjem' pri id 'trgovina' (label ostane nespremenjen, ker gre v CRM in ga preverja industries.test.ts:50-ish prek getIndustryLabel); (2) StepIndustry.tsx:78 zamenjaj {industry.label} z {industryChoiceLabel(industry)} — funkcija je že uvožena v vrstici 7; (3) industries.test.ts:94–98 preoblikuj iz »navadna dejavnost NIMA ločene oznake« v »kjer ločena oznaka obstaja, se ne začne z 'Drugo — ' in se začne z veliko začetnico«, sicer test pade. Vrstni red v INDUSTRIES: 'maloprodaja' premakni takoj za 'proizvodnja', 'trgovina' pa takoj za njo. Preverjeno, da getIndustryForSegment (industries.ts:136) ostane pravilen: vsak segment ima v INDUSTRIES natanko en vnos, ki je pred pod-dejavnostmi.

*Preverba.* Popravljen razpon vrstic seznama (25–44, ne 26–43). Dodan manjkajoči tretji korak: predlog v izvirni obliki podre industries.test.ts:94–98, zato je treba popraviti tudi ta test. Potrjeno, da preslikava ?s= ostane pravilna.

*Vir v raziskavi.* Raziskava §2.2 (B2C in mešani B2C/B2B v obsegu), §4.1 arhetipi 1–8; Segmenti S1–S8

### K-03 · izboljsaj · teža visoka · preverba: popravljeno

**INDUSTRIES, možnost 'maloprodaja' → oznaka »Maloprodaja« (src/config/industries.ts:33)**

*Utemeljitev.* Preverjeno: oznaka na 33, kampanjska pot res deluje — getIndustryForSegment('maloprodaja') vrne 'maloprodaja', ker ALL_INDUSTRIES najprej pregleda INDUSTRIES (industries.ts:106, 136–141), test tega obhoda za vsak segment obstaja v industries.test.ts. Pod spustnim seznamom danes res ni nobenega pomožnega besedila: StepIndustry.tsx:64–81 vsebuje samo label in select, subHelp (86–89) se izriše šele ob izbiri 'Drugo'. Razlikovalnega besedila torej res ni.

*Predlog.* choiceLabel za 'maloprodaja': 'Maloprodaja — prodajamo končnim kupcem (poslovalnica, spletna trgovina)'. Pomožno vrstico dodaj kot <p> takoj za </select> znotraj istega shellStyles.formRow (StepIndustry.tsx, med vrsticama 80 in 81), z besedilom: »Če blago prodajate večinoma podjetjem in ne končnim kupcem, izberite Veleprodajo in distribucijo.« Uporabi obstoječi razred styles.subHelp iz StepIndustry.module.css, da ne nastaja nov slog. Sprememba choiceLabel zahteva isti popravek testa in isto zamenjavo v StepIndustry.tsx:78 kot prejšnja postavka — obe postavki morata iti v isti spremembi, sicer bo polovica seznama izpisala choiceLabel, polovica pa label.

*Preverba.* Dodana natančna vstavna točka za pomožno vrstico in obstoječi CSS razred; izrecno vezano na isti popravek testa kot prejšnja postavka. Potrjeno, da kampanjska pot ?s=maloprodaja res deluje pravilno.

*Vir v raziskavi.* Raziskava §2.2, §4.1; Segmenti S1, S4

### K-04 · izboljsaj · teža visoka · preverba: popravljeno

**DRUGO_SUB_INDUSTRIES, možnost 'drugo_blago' → »Prodajamo ali distribuiramo blago« → segment 'trgovina' (src/config/industries.ts:69–74)**

*Utemeljitev.* Preverjeno dobesedno: vnos je na 69–74, komentar o poslovnem modelu na 46–61 (ne 50–56), preslikava v 'trgovina' drži. Edini stavek o blagu res enako opiše maloprodajalca in veleprodajalca. Preverjeno tudi, da predlog prestane vse obstoječe teste v industries.test.ts: unikatnost id-jev (60–65), 'drugo_blago' → 'trgovina' (67–73), natanko ena možnost v 'splosno' (75–81), oznaka za CRM se začne s 'Drugo — ' in choiceLabel z veliko začetnico (83–92). Nov vnos vsem štirim ustreza.

*Predlog.* Razdeli na dve možnosti, novo pred obstoječo: { id: 'drugo_maloprodaja', label: 'Drugo — maloprodaja', choiceLabel: 'Blago prodajamo končnim kupcem (poslovalnica ali splet)', segment: 'maloprodaja' } in nespremenjeni { id: 'drugo_blago', label: 'Drugo — blago', choiceLabel: 'Blago prodajamo ali distribuiramo podjetjem', segment: 'trgovina' } (spremeni le choiceLabel obstoječega). Id 'drugo_blago' ostane pri veleprodaji, da se zapisi v CRM ne prelomijo. Seznam s tem naraste na šest možnosti — to je zgornja meja, ki jo zaslon še prenese; naslednje pod-dejavnosti brez zamenjave ne dodajaj.

*Preverba.* Popravljen sklic na komentar (industries.ts:46–61, ne 50–56). Dodana preverba proti vsem petim obstoječim testom v industries.test.ts — predlog jih prestane. Dodano opozorilo o dolžini seznama.

*Vir v raziskavi.* Raziskava §2.2, §4.1; Vprasalnik Q03

### K-05 · ohrani · teža nizka · preverba: potrjeno

**SUB_INDUSTRY_QUESTION: »Kaj je najbliže vašemu načinu dela?« (src/config/industries.ts:95) in pojasnilo pod njim (StepIndustry.tsx:86–89)**

*Utemeljitev.* Preverjeno: konstanta je na industries.ts:95, pojasnilo na StepIndustry.tsx:86–89, varovalo canProceed na StepIndustry.tsx:46 (value.industry !== DRUGO_ID). Vse drži dobesedno. Vprašanje po načinu dela namesto po panogi se ujema z §4.2, ki sekundarne klasifikacije postavi nad panožno oznako. Popraviti je treba samo eno od petih možnosti (prejšnja postavka).

*Preverba.* Brez popravkov — vsi trije sklici preverjeni dobesedno.

*Vir v raziskavi.* Raziskava §4.2, §16.1 korak 1

### K-06 · izboljsaj · teža nizka · preverba: popravljeno

**Uvodni podnaslov koraka 1: »… za priporočena tri vzame okoli deset minut.« (StepIndustry.tsx:57–61)**

*Utemeljitev.* Besedilo je res na 57–61, komentar nad njim (51–56) res govori o prejšnji dvominutni različici. DVE NETOČNOSTI ugotovitve: (1) opomba pod triažo že OBSTAJA in že šteje področja — StepTriage.tsx:102–106 izpiše »Podrobno bomo izračunali N od M področij. Priporočamo tri, izberete pa lahko poljubno mnogo …«. Manjka torej samo ocena časa, ne cela opomba. (2) »17 številčnih polj« ne drži: privzeta trojica (razpolozljivostMp 6 polj, zalogeMp 6, blagajnaMp 7) ima 19 vprašanj, od tega 12 številčnih oziroma odstotkovnih, ostalo so izbire. Ocena deset minut je zato bližje resnici, kot ugotovitev trdi.

*Predlog.* Uvodno besedilo pusti nespremenjeno. V obstoječo opombo StepTriage.tsx:105 dodaj oceno časa, izpeljano iz izbire, ne iz konstante: `Podrobno bomo izračunali ${selected.length} od ${modules.length} področij — okoli ${3 * selected.length} minut. Priporočamo ${numeral(recommendedCount)} (okoli ${3 * recommendedCount} minut) …`. Faktor 3 minute na področje zapiši kot imenovano konstanto MINUTES_PER_AREA = 3 na vrhu StepTriage.tsx s komentarjem, da je KALIBRACIJA in jo je treba preveriti po prvih ~50 vnosih. Zaslon je skupen vsem segmentom, zato mora ocena delovati tudi pri področjih z manj polji — 3 minute so zgornja meja in torej v pravo smer.

*Preverba.* Ovržena trditev, da opombe pod triažo ni — obstaja na StepTriage.tsx:102–106 in že šteje področja; manjka le čas. Popravljeno število polj (19 vprašanj, 12 številčnih, ne 17). Predlog konkretiziran na natančno vrstico in imenovano konstanto.

*Vir v raziskavi.* Raziskava §23 (najmanjši potrebni napor), §16.1 korak 5

### K-07 · izboljsaj · teža srednja · preverba: popravljeno

**»Koliko ljudi zaposlujete?« (src/components/Calculator/StepEmployeeCount.tsx:26)**

*Utemeljitev.* Preverjeno: vprašanje na StepEmployeeCount.tsx:26; assessHoursPlausibility na plausibility.ts:47–77 s HOURS_PER_EMPLOYEE_PER_MONTH = 160 (plausibility.ts:18); dimenzija 'size' z utežjo 0,2 na icp.ts:168–180. Vse drži. Pretvorba glav v polne ekvivalente je v maloprodaji res najšibkejša (izmene, študenti, agencijski delavci). POMEMBNA OMEJITEV, ki je ugotovitev ne pove: StepEmployeeCount NIMA mehanizma za pomoč pod poljem — komponenta ima samo styles.trustNote (44–47). Predlagano besedilo pomoči zato ni mogoče »dodati pod polje« brez odločitve, kam; in če ga dodamo poleg popravljene opombe iz naslednje postavke, dobi zaslon z enim samim poljem dva odstavka drobnega besedila.

*Predlog.* Ne dodajaj druge opombe. Namesto tega POJASNILO O POLNIH EKVIVALENTIH ZLIJ V ISTO opombo, ki jo popravlja naslednja postavka, tako da ima zaslon še naprej natanko en odstavek pod kartico. Predlagano skupno besedilo je zapisano pri naslednji postavki. Oznaka polja in aria-label ostaneta nespremenjena, stolpec 'employeeCount' v exportRecord.ts:152 se ne dotakne.

*Preverba.* Ugotovitev je vsebinsko potrjena, predlog pa je izvedbeno nemogoč v izvirni obliki: zaslon nima mehanizma za `help`. Predlog preusmerjen v zlitje z opombo iz naslednje postavke, da zaslon ne dobi dveh odstavkov.

*Vir v raziskavi.* Raziskava §8.10 (kadri v maloprodaji), §19.1; ICP_scoring (velikost, utež 0,20)

### K-08 · izboljsaj · teža visoka · preverba: potrjeno

**Opomba pod poljem: »Podatek na izračun ne vpliva — iz njega izpeljemo le velikostni razred podjetja, ki se izpiše v poročilu.« (StepEmployeeCount.tsx:44–47)**

*Utemeljitev.* Obe trditvi o neresničnosti sta PREVERJENI. (1) Opozorilo iz hoursPlausibilityWarning (plausibility.ts:83–92) obiskovalec res vidi: CalculatorFlow.tsx:256–260 ga izračuna in ga na 534 podá v StepInputs, ki ga izriše na StepInputs.tsx:84–89 z role="status". Podatek torej vpliva na PRIKAZ, čeprav ne na znesek. (2) V oceni ustreznosti nosi utež 0,20 (icp.ts:168–180). Manjši popravek ugotovitve pri sosednji postavki o vlogi: pri padcu na ROLE_FALLBACK se ne izgubi celotna utež, ampak njen del. Sklep ostane: opomba je v treh klikih ovrgljiva prav v orodju, ki gradi verodostojnost na jamstvu »nobene številke si ne izmislimo«.

*Predlog.* Zamenjaj besedilo na StepEmployeeCount.tsx:44–47 z enim odstavkom, ki hkrati pokrije polne ekvivalente iz prejšnje postavke: »Preračunajte na polni delovni čas — dva polovična delavca štejeta kot eden; vštejte tudi redne študente in agencijske delavce, ker njihove ure merimo v nadaljevanju. Podatek ne vstopa v noben izračun izgube: uporabimo ga za velikostni razred v poročilu in za preverbo, ali vnesene ure skupaj presegajo razumen delež vaše kapacitete — takrat vas na to opozorimo.« S tem je opozorilo iz plausibility.ts napovedano vnaprej in pozneje ne pride kot očitek.

*Preverba.* Obe trditvi preverjeni tudi po poti do zaslona (CalculatorFlow.tsx:256–260 → StepInputs.tsx:84–89). Predlagano besedilo razširjeno tako, da vsrka tudi pojasnilo o polnih ekvivalentih iz prejšnje postavke.

*Vir v raziskavi.* Raziskava §24 P0 (poštenost prikaza), §19.1

### K-09 · dodaj · teža srednja · preverba: popravljeno

**Manjka: »Koliko poslovalnic imate?« (in ali imate lastno skladišče) — korak 2**

*Utemeljitev.* Q04 je v registru res označen kot obvezen SCALE_BASE. Preverjeno, da kalkulator števila poslovalnic ne vpraša nikoli; število blagajn vpraša samo blagajnaMp (maloprodaja.ts:487) in le ob izbiri področja. Popravek štetja: vprašanj, ki govorijo o poslovalnicah, ni osem, ampak sedem (stockCheckHoursPerMonth 133, inventoryValueEUR 251, tillCount 488, transferHoursPerMonth 639, previousPriceProof 403, knowsItemMargin 857, keyPersonIndependence 871) — priceMaintenanceHoursPerMonth (391) med njimi NI, govori o »oznakah na policah«. Sklep drži: podatka o velikosti mreže nikjer ni, zato prodajnik ne more preveriti niti reda velikosti vnesenih ur, arhetipov S1/S2/S3 pa ni mogoče ločiti.

*Predlog.* V korak 2 dodaj drugo številčno polje pod obstoječe: »Koliko poslovalnic imate?«, enota »poslovalnic«, min 1, brez privzetka, pomoč združi v isti odstavek kot pri prejšnji postavki (»Prodajna mesta, kjer kupec plača; spletno trgovino štejte posebej.«). Razširi BasicInfo (src/types.ts:1–6) s storeCount: number, izpiši ga v kvalifikacijskem delu prodajne priprave (SalesReportQualification, salesReport.ts:74–94, polnjenje na 280–292) in dodaj stolpec 'storeCount' NA KONEC CSV_COLUMNS (exportRecord.ts, za 'adminHourSource') ter v buildCsvRow — test enakih dolžin obeh seznamov obstaja. ICP dimenzije ZAENKRAT NE dodajaj: icp.test.ts:56 preverja, da je vsota uteži natanko 1, zato nova dimenzija pomeni prerazporeditev vseh sedmih uteži, kar je kalibracijska odločitev in ne stranski učinek tega popravka. Do takrat je podatek za prodajnika in za sanity-check tillCount — to je manj od namena, a več od nič.

*Preverba.* Popravljeno štetje vprašanj o poslovalnicah (sedem, ne osem; priceMaintenanceHours ni med njimi). Predlog za novo ICP dimenzijo zavrnjen kot del tega popravka: icp.test.ts:56 zahteva vsoto uteži 1, zato je to ločena kalibracijska odločitev.

*Vir v raziskavi.* Vprasalnik Q04 (SCALE_BASE, obvezno); Raziskava §16.1 korak 2, §4.1 (S1/S2/S3); ICP_scoring

### K-10 · izboljsaj · teža nizka · preverba: potrjeno

**Uvod koraka 3: »Tri vprašanja, ki ne sprašujejo po številkah. Iz njih izpeljemo, koliko od izmerjenega stroška je realno mogoče nasloviti …« (src/config/contexts/maloprodaja.ts:59–60)**

*Utemeljitev.* Preverjeno: besedilo na 59–60; naslovljivi delež izpelje izključno currentSystem prek improvementBandFor (contexts/index.ts:40–46); businessType po iskanju čez src in content ne krmili ničesar razen prodajne priprave, PDF-ja in CSV (salesReport.ts:287, pdfSales.ts:131, salesReportHtml.ts:308, exportRecord.ts:173 in 247); role gre v ICP (icp.ts:237–241) in v playbook (salesPlaybook.ts:176–178). Uvod torej res obljublja za vsa tri vprašanja tisto, kar dela eno.

*Predlog.* Zamenjaj besedilo v maloprodaja.ts:59–60 z: »Tri vprašanja brez številk. Iz sedanjega sistema izpeljemo, koliko od izmerjenega stroška je realno mogoče nasloviti — trgovec, ki ima blagajno že povezano z zalogami, je lažje izboljšave večinoma že pobral. Preostali dve povesta, katera vprašanja so za vas sploh smiselna in komu naj poročilo govori.« Besedilo velja samo za maloprodajo; enakih uvodov v drugih šestih kontekstih se ne dotikaj, dokler zanje ne velja isto.

*Preverba.* Trditev preverjena z iskanjem po vsej kodi; dodan sklic na pdfSales.ts:131, ki ga ugotovitev spregleda. Dodano opozorilo, naj se popravek ne prenaša na druge segmente.

*Vir v raziskavi.* Raziskava §16.1 korak 3, §10

### K-11 · izboljsaj · teža visoka · preverba: popravljeno

**businessType: »Kako pretežno prodajate?« — 5 možnosti (src/config/contexts/maloprodaja.ts:64–73)**

*Utemeljitev.* POTRJENO z izčrpnim iskanjem: profile.businessType se pojavi samo v StepContext.tsx (47, 108–109), salesReport.ts (88, 287), pdfSales.ts:131, salesReportHtml.ts:308 in exportRecord.ts (173, 247). V ICP ga ni (icp.ts:168–317), v triaži ga ni, prikaza modulov ne spreminja. Je torej edino obvezno vprašanje (StepContext.tsx:45–51 brez njega ne pusti naprej), ki ne krmili ničesar. Potrjeno tudi, da showIf v ModuleDefinition ne obstaja (moduleTypes.ts:215–259) in da resolveActiveModules (moduleEngine.ts:245–253) filtrira izključno po triažni izbiri. Potrjena je tudi časovna izvedljivost popravka: korak 'context' je v stepOrder PRED 'triage' (CalculatorFlow.tsx:123–130), zato je businessType ob triaži že znan.

*Predlog.* Najcenejša poteza, ki odgovoru da učinek, je vezava privzete triažne trojice — glej postavko o defaultIds, kjer je zapisana v celoti; ti dve postavki sta en sam popravek in ne dva. Legendo popravi v »Kje pretežno prodajate?« (maloprodaja.ts:65) — »Kako« se bere kot način plačila. Dodajanja businessType v ICP kot nove dimenzije v tem popravku NE izvajaj: icp.test.ts:56 zahteva vsoto uteži 1, zato bi to pomenilo prerazporeditev vseh sedmih uteži. Pogojno skrivanje področij ostane izrecno izven obsega: showIf je nova zmožnost motorja (resolveActiveModules, moduleEngine.ts:245).

*Preverba.* Trditev potrjena in dopolnjena z dokazom, da je businessType ob triaži že znan (stepOrder). Predlog (b) o novi ICP dimenziji odložen zaradi icp.test.ts:56; predlog (a) združen s postavko o defaultIds, da ne nastaneta dve nasprotujoči si specifikaciji istega popravka.

*Vir v raziskavi.* Raziskava §1.1 t. 1, §4.1, §16.1 korak 1; ICP_scoring (kompleksnost kanala 0,20)

### K-12 · dodaj · teža srednja · preverba: popravljeno

**Manjka: vprašanje o lastnostih blaga (Q02) — korak 3**

*Utemeljitev.* Q02 je v registru res obvezen, §24 P1 res uvršča »podtip maloprodaje in lastnosti blaga« med ukrepe z največjim vplivom na natančnost, kalkulator pa vprašanja nima. Primera iz kode držita: ZALOGE_CAUSES ponuja »Roki uporabnosti in serije niso sproti vidni« (maloprodaja.ts:202) vsakomur, diagnostikaMp pa sprašuje za serijo in rok uporabnosti vsakogar (maloprodaja.ts:864). VENDAR: predlog v izvirni obliki ponovi natanko napako, ki jo prejšnja postavka obsoja — doda obvezno vprašanje, ki ne krmili ničesar razen prodajne priprave. Brez showIf namreč ne more skriti nerelevantnih vzrokov ali diagnostičnih vprašanj, ICP pa je zaprt zaradi vsote uteži. Zato znižujem resnost na srednjo in dodajanje pogojujem.

*Predlog.* Vprašanje dodaj SAMO skupaj z uporabo, sicer ga ne dodajaj. Izvedba: (1) v SegmentContext dodaj NEOBVEZNO polje goodsType?: ContextQuestion (contextTypes.ts:137–139) — obvezno bi zahtevalo vnos v vseh sedmih kontekstih; (2) StepContext.tsx: izriši ga s funkcijo group() (53–95) kot prvo skupino in ga dodaj v canProceed (45–51) le, kadar context.goodsType obstaja; (3) contexts.test.ts:23–30 (questionsOf) dopolni z ['goodsType', context.goodsType], sicer nova vprašanja ne dobijo obstoječih varoval (unikatni id-ji, freeText samo pri vlogi); (4) BusinessProfile (contextTypes.ts:224–249) in emptyProfileFor (292–326) dobita goodsType: string | null; (5) zapis v prodajno pripravo poleg businessTypeLabel in nov stolpec 'goodsType' NA KONEC CSV_COLUMNS. Legenda: »Katera lastnost najbolj določa vaše blago?«; možnosti 'rok' / 'sezona' / 'serija' / 'tehtano' / 'trajno' z besedili iz izvirnega predloga. Uporaba, ki jo mora popravek prinesti s seboj: pri 'trajno' in 'serija' se v ZALOGE_CAUSES ne sme prikazati vzrok o rokih uporabnosti — to je majhen filter v mainCauseField in ne showIf na ravni modula. Večizbira, kot jo predvideva Q02, ostane izven obsega (nov tip vprašanja).

*Preverba.* Resnost znižana z visoke na srednjo in dodajanje pogojeno: v izvirni obliki predlog doda drugo obvezno vprašanje, ki ne krmili ničesar — natanko očitek iz postavke o businessType. Dodane manjkajoče izvedbene točke: polje mora biti NEOBVEZNO (sicer podre šest drugih kontekstov), dopolniti je treba canProceed in questionsOf v contexts.test.ts.

*Vir v raziskavi.* Vprasalnik Q02; Raziskava §1.1 t. 1, §4.2, §24 P1; Segmenti S6/S7

### K-13 · izboljsaj · teža srednja · preverba: potrjeno

**currentSystem: »Kako danes vodite maloprodajo?« — 5 možnosti (src/config/contexts/maloprodaja.ts:80–99)**

*Utemeljitev.* Preverjeno: vprašanje in možnosti so na 80–99, komentar o ločnici na 75–79, pasovi držijo (0,08–0,20 / 0,15–0,30 / 0,15–0,30 / 0,25–0,40 / 0,25–0,40). Q10 res ločeno sprašuje po skupni bazi proti sinhronizaciji z zamikom, §4.3 res postavlja manjše mreže na prvo mesto. Mreža z ločeno bazo po lokacijah danes res nima svoje možnosti. Tip SystemOption (contextTypes.ts:36–48) zahteva pas pri vsaki možnosti, zato nove možnosti brez pasu ni mogoče dodati — predlog to spoštuje. Preverjeno tudi, da šesta možnost ne podre ICP: normalizacija improvementBandMax teče čez 0,08–0,40 (icp.ts:197).

*Predlog.* Vstavi med 'otherRetailSystem' in 'posNoStockLink': { id: 'perStoreSystem', label: 'Sistem imamo, a vsaka poslovalnica ima svojo bazo ali svojo evidenco', band: { min: 0.25, max: 0.4 } }. Oznako 'otherRetailSystem' (maloprodaja.ts:95) natančneje omeji: 'Drug maloprodajni sistem, povezan z zalogami in skupen vsem poslovalnicam'. Id-ji obstoječih možnosti ostanejo nespremenjeni (gredo v CRM, contextTypes.ts:18–21). Preveri, da vsaj ena možnost ostane isPantheon — contexts.test.ts to zahteva za vsak segment; z vstavljanjem se to ne spremeni.

*Preverba.* Dodani dve preverbi, ki ju ugotovitev ne omenja: tip zahteva pas pri vsaki možnosti (predlog ga ima) in vsaj ena možnost mora ostati isPantheon (ostane).

*Vir v raziskavi.* Vprasalnik Q10; Raziskava §10, §4.3, §8.1; Arhetipi A2/A3

### K-14 · izboljsaj · teža visoka · preverba: popravljeno

**currentSystem — VREDNOSTI pasov izboljšave: 0,08–0,20 / 0,15–0,30 / 0,15–0,30 / 0,25–0,40 / 0,25–0,40 (src/config/contexts/maloprodaja.ts:83–98)**

*Utemeljitev.* POTRJENO in preverjeno v treh točkah. (1) computePotentialRange (potential.ts:38–51) res teče čez ANNUAL_BUCKETS = ['directLoss','lostMargin','capacity'] (moduleEngine.ts:140) in množi kapaciteto z istim pasom kot trdi denar. (2) Register: F05 »realno izkoristljiva kapaciteta = vrednost avtomatizabilnega časa × delež materializacije«, F07 »naslovljiva letna korist = (neposredna izguba + MATERIALIZIRANA kapaciteta + financiranje) × naslovljivi delež × izboljšanje«, A15 = 0,2 / 0,35 / 0,5. Množitelja v kodi ni nikjer. (3) Kartica »Vrednost izgubljene kapacitete« (ResultsSummary.tsx:76–83) sama zapiše, da to ni prihranek pri plačah, kartica potenciala dve vrstici niže (98–107) pa isto kapaciteto vračuna po polni vrednosti. Vrednosti pasov same so skladne z A08/A11 (0,15/0,25/0,35) — napaka ni v njih.

*Predlog.* (1) V SegmentContext dodaj NEOBVEZNO polje capacityMaterialization?: ImprovementBand z vrednostma { min: 0.2, max: 0.5 } (A15) in ga zapiši samo v MALOPRODAJA_CONTEXT — odsotnost pomeni faktor 1, zato se drugi segmenti ne spremenijo. (2) computePotentialRange (potential.ts:38–51) dobi tretji, neobvezen parameter materialization?: ImprovementBand; v zanki: če je output.bucket === 'capacity', prištej valueEUR × addressableShare × (min oziroma max materializacije) v LOČENA seštevka za spodnjo in zgornjo mejo, sicer kot doslej. Spodnja meja rezultata se torej množi z 0,2, zgornja z 0,5. (3) Parameter prenesi skozi AggregateResultsOptions (potential.ts:252–256) in aggregateResults (258–266) ter oba klicatelja v CalculatorFlow. To NI sprememba enega podatka: gre za podpis funkcije, ki jo pokriva potential.test.ts in bucketPropagation.test.ts — pričakovane vrednosti tam je treba preračunati. (4) Opombo pod kartico potenciala (ResultsSummary.tsx:105) dopolni: »Pri sproščenem času upoštevamo, da se v denar spremeni le del — manj nadur ali zunanjega dela, ne nižja plačna masa.« Vrednosti pasov izboljšave ostanejo nespremenjene.

*Preverba.* Ugotovitev potrjena, predlog pa je bil podcenjen kot »sprememba podatkov in ene funkcije«: gre za spremembo podpisa computePotentialRange in aggregateResults ter dveh testov. Dodano, da mora biti polje neobvezno (sicer se spremeni potencial vseh sedmih segmentov) in da se materializacija uporabi ločeno na spodnji in zgornji meji.

*Vir v raziskavi.* Financne_formule F04, F05, F07; Predpostavke A08, A11, A15; Raziskava §5.2, §17.1

### K-15 · izboljsaj · teža visoka · preverba: popravljeno

**role: »Kakšna je vaša vloga?« — 5 možnosti, 'drugo' s freeText (src/config/contexts/maloprodaja.ts:101–110)**

*Utemeljitev.* Obe napaki PREVERJENI. (1) ROLE_FIT (icp.ts:89–105) ujame samo id 'direktor'/'lastnik', 'finance' in startsWith('vodja'); 'nabava' ne ustreza nobenemu in pade na ROLE_FALLBACK (107–110) z opombo »Vloge ni navedel ali je izbral 'Drugo'«, ki je za tega obiskovalca neresnična. (2) Možnosti »Lastnik« v maloprodaji res ni; playbook išče /direktor|lastnik/i po OZNAKI in ne po id-ju (salesPlaybook.ts:177–178), zato lastnik danes dobi ugovor »o tem ne odločam jaz«. Popravek ugotovitve: pri padcu na ROLE_FALLBACK se ne izgubi 0,15 uteži, ampak 0,15 × (1 − 0,35) ≈ 0,0975, torej približno 10 od 100 točk. Sklep ostane.

*Predlog.* (1) maloprodaja.ts:104: { id: 'direktor', label: 'Direktor/-ica ali lastnik/-ica' } — id ostane, zato ROLE_FIT (icp.ts:91) še naprej ujame, nova oznaka pa prestane tudi regex v salesPlaybook.ts:178. (2) V ROLE_FIT dodaj vnos PRED tistega s startsWith('vodja'): { match: (id) => id === 'nabava' || id === 'nabavaKategorije', value: 0.6, note: 'Nabava ali kategorijski vodja — pozna problem in številke, o nakupu pa praviloma ne odloča sam.' }. Vrstni red tu ni kritičen ('nabava' se z 'vodja' ne prekriva), a ohranja berljivo prioriteto. (3) Dodaj šesto možnost { id: 'vodjaSpleta', label: 'Vodja spletne prodaje' } — predpona 'vodja' pomeni, da jo obstoječi ROLE_FIT ujame brez dodatne kode, persona §6 pa jo izrecno našteva. Id-jev obstoječih možnosti ne spreminjaj (gredo v CRM prek exportRecord.ts stolpca 'role').

*Preverba.* Popravljena velikost izgube pri ROLE_FALLBACK (≈10 točk od 100, ne cela utež 0,15). Predlog o šesti vlogi konkretiziran: id 'vodjaSpleta' ga obstoječi ROLE_FIT ujame brez spremembe icp.ts.

*Vir v raziskavi.* Raziskava §6, §15.1; Persona_bolecina; Segmenti S1

### K-16 · ohrani · teža nizka · preverba: potrjeno

**Triaža razpolozljivostMp: »Kako pogosto kupec pri vas ne dobi artikla, ki bi ga kupil — ker ga ni na polici ali ni dobavljiv?« (src/config/modules/maloprodaja.ts:97–103)**

*Utemeljitev.* Preverjeno: prompt je na 97, možnosti 98–103, štiri stopnje so čista frekvenčna lestvica. Ujemanje z Q12 (»Kako pogosto prodajno zanimivega artikla ni na polici oziroma ni dobavljiv?«) je res skoraj dobesedno, vključno z opombo registra »spletne odpovedi so ločene«, ki jo v kodi drži help polja cancelledOrderSalesEUR (maloprodaja.ts:736) in razmejitev v §18. Playbook res citira oznako nazaj (salesPlaybook.ts:83–87).

*Preverba.* Brez popravkov — vse preverjeno, vključno z razmejitvijo proti kanaliMp v besedilih pomoči.

*Vir v raziskavi.* Vprasalnik Q12; Katalog_bolecin B09; KPI K06/K07; Raziskava §8.4, §18

### K-17 · izboljsaj · teža visoka · preverba: potrjeno

**Triaža zalogeMp: »Koliko blaga vam obleži — poteče, se poškoduje ali ga morate prodati z znižanjem?« (src/config/modules/maloprodaja.ts:213–219)**

*Utemeljitev.* POTRJENO. Prompt je na 213, možnosti 214–219. Modul poleg odpisov (annualWriteOffEUR) in znižanj (forcedMarkdownMarginEUR) res meri kapital: releasableEUR = inventoryValueEUR × reducibleShareOf (maloprodaja.ts:282), iz njega pa nastaneta letni strošek financiranja (297–305) in enkratni sprostljivi kapital (306–312) — praviloma največja posamična številka celotnega vprašalnika. Trgovec z železnino ali pohištvom danes pošteno izbere »Skoraj nič« in kapital ostane neizmerjen. Register F02 sprostljiv kapital res definira kot »povprečna zaloga × realno zmanjšljivi delež«, B10 in §5.3/§5.4 ga obravnavajo kot samostojen vzvod. Naslov področja »Presežna zaloga, odpisi in znižanja« (maloprodaja.ts:209) kapital že napoveduje, prompt pa ne.

*Predlog.* Nov prompt (maloprodaja.ts:213): »Koliko denarja vam leži v zalogi, ki se ne obrne — in koliko blaga obleži, poteče ali ga morate prodati z znižanjem?« Stopnje (natanko štiri, vrednosti 0–3, kot zahteva TriageQuestion, moduleTypes.ts:209–213): 0 »Zaloga se obrača, odpisov skoraj ni«; 1 »Nekaj artiklov obleži, občasno kaj znižamo«; 2 »Precej zaloge stoji; ob koncu sezone redno znižujemo«; 3 »Veliko zaloge stoji ali pa ne vemo, koliko je je«. Ker je zalogeMp v defaultIds (segments.ts:180), sprememba lestvice ne spremeni privzete izbire, spremeni pa triažno oceno — in s tem tudi vrstni red pri izenačenju v selectTopModules; to je namen.

*Preverba.* Potrjeno z izračunom v kodi (maloprodaja.ts:282, 297–312). Dodana preverba, da predlog spoštuje zahtevo po natanko štirih stopnjah z zaporednimi vrednostmi.

*Vir v raziskavi.* Vprasalnik Q13, Q26; Katalog_bolecin B10; Financne_formule F02/F03; Raziskava §5.3, §5.4, §8.5

### K-18 · izboljsaj · teža srednja · preverba: potrjeno

**Triaža marzeMp: »Kako pogosto ugotovite, da je bil artikel prodan po napačni ceni ali da dogovorjen dobaviteljski pogoj ni bil izkoriščen?« (src/config/modules/maloprodaja.ts:339–346)**

*Utemeljitev.* Preverjeno: prompt na 339–340, možnosti 341–346, stopnja 0 se res glasi »Cene in pogoji so pod nadzorom«, stopnja 3 »Stalno — obsega pa ne poznamo«. Vprašanje res meri pogostost ODKRITJA in ne dogodka; trgovec brez kontrole cen pošteno izbere 0. Tretja postavka modula, priceMaintenanceHoursPerMonth (390–399), ki se množi z administrativno uro (447), v promptu res ni omenjena — pri mreži poslovalnic je to pogosto največji del področja (Segment_bolecina S2: »Cene po lokacijah« visoko).

*Predlog.* Nov prompt (maloprodaja.ts:339–340): »Kako pogosto steče prodaja po napačni, zastareli ali pozabljeni akcijski ceni — in koliko dela je z vzdrževanjem cenikov, akcij in etiket?« Stopnje: 0 »Cene se vodijo v sistemu, napak praktično ni«; 1 »Občasna napaka, etikete uredimo sproti«; 2 »Redno — ceniki in etikete zahtevajo stalno delo«; 3 »Pogosto ali pa napake ne bi opazili«. Stopnja 3 mora izrecno dopustiti, da obiskovalec napak ne bi opazil — sedanja formulacija predpostavlja, da ve, da se dogajajo.

*Preverba.* Brez vsebinskih popravkov; vsi sklici in oba citata besedila preverjeni dobesedno.

*Vir v raziskavi.* Vprasalnik Q15; Katalog_bolecin B11, B12, B02; KPI K18, K20; Raziskava §8.6; Segment_bolecina S2/S3/S4

### K-19 · izboljsaj · teža visoka · preverba: popravljeno

**Triaža blagajnaMp: »Koliko časa in denarja poberejo dnevni zaključki blagajn ter razlike, ki jih odkrijete šele ob inventuri?« (src/config/modules/maloprodaja.ts:476–483)**

*Utemeljitev.* POTRJENO v celoti. Prompt na 476–477, možnosti 478–483. BLAGAJNA_CAUSES (462–468) je res en sam nabor, ki meša »Prevzem in odpis nista evidentirana sproti« (data) s »Kraja kupcev ali zunanjih oseb« (external), addressableShare pa se izračuna enkrat (553) in uporabi na VSEH treh izidih — dnevnih zaključkih (569), inventurnem manku (575) in izvedbi inventur (582). Kdor kot glavni vzrok navede krajo, si res zniža naslovljivost ur dnevnih zaključkov na 0,25. Raziskava §16.2 res našteje zaključke (6) in manko (7) kot ločeni področji, §18 manko vodi kot svoj koš, §8.8 pa naslovljivost veže na vzrok.

*Predlog.* Prompt omeji na blagajno: »Koliko časa poberejo dnevni zaključki blagajn, štetje izkupička in usklajevanje gotovine ter kartic?« Stopnje: 0 »Zaključek je hiter, razlik praktično ni«; 1 »Nekaj minut na blagajno, manjše razlike«; 2 »Opazno — vsak dan na vsaki blagajni«; 3 »Veliko ali pa tega ne merimo«. Polja shrinkageEUR (518–529), stocktakeHoursPerYear (531–536) in stocktakeMethod (538–549) premakni v novo področje (naslednja postavka). OB TEM obvezno prereži tudi BLAGAJNA_CAUSES (462–468): po premiku manka v blagajni nimata več kaj iskati »Kraja kupcev ali zunanjih oseb« in »Poškodbe blaga pri rokovanju ali skladiščenju« — ostanejo naj vzroki, ki dejansko podaljšujejo zaključek (napake na blagajni, neusklajena zaloga, več orodij). Brez tega reza ostane isti očitek, le v manjšem modulu. Posodobi tudi summary modula (473–474) in metodologijo (content/methodology.ts:162).

*Preverba.* Ugotovitev potrjena po vrsticah izračuna (553, 569, 575, 582). Predlogu dodan manjkajoči korak: po premiku manka je treba prerezati tudi BLAGAJNA_CAUSES, sicer ostane isti mešani nabor vzrokov, ter posodobiti summary in metodologijo.

*Vir v raziskavi.* Raziskava §16.2 (področji 6 in 7), §18, §8.7, §8.8; Bolecina_finance M06/M07; Vprasalnik Q17 in Q18

### K-20 · dodaj · teža visoka · preverba: popravljeno

**Manjka: triažno vprašanje »Inventurni manko in točnost zaloge«**

*Utemeljitev.* Q18 je v registru res samostojno triažno vprašanje (»Kako velik problem so inventurni manki in netočne zaloge?«, DIRECT_LOSS, opomba »vračila in odpisi so ločeni«), §16.2 ga vodi kot področje 7, §8.8 zahteva, da vzrok določa naslovljivost. V kodi je manko skrit za vprašanjem o dnevnih zaključkih. Benchmark NRF 1,6 % je v raziskavi res naveden (§8.8) izrecno kot OPOZORILO in ne kot privzeta vrednost — predlog ga tudi ne vnaša v izračun, kar je pravilno. Ločeno področje je edini način, da manko dobi svoj glavni vzrok.

*Predlog.* Nov modul 'inventuraMp', naslov »Inventurni manko in točnost zaloge«, prompt: »Kako velike razlike med sistemom in dejanskim stanjem odkrijete ob inventuri — in koliko dela je z njo?« Stopnje: 0 »Razlike so zanemarljive, inventura teče gladko«; 1 »Manjše razlike, inventura vzame nekaj dni«; 2 »Redne razlike; inventura zahteva zaprtje in ročni vnos«; 3 »Velike ali neznane razlike — vzroka ne poznamo«. Vzroki: 'Prevzem ali odpis nista evidentirana sproti' (data), 'Napaka pri artiklu ali enoti mere' (data), 'Napake pri delu na blagajni' (people), 'Kraja kupcev ali zunanjih oseb' (external), 'Poškodbe pri rokovanju ali skladiščenju' (physical) — kategorija 'physical' v addressableShare.ts že obstaja. Prenesi polja shrinkageEUR, stocktakeHoursPerYear in stocktakeMethod z nespremenjenimi besedili help (meja proti zalogeMp — znana proti neznani izgubi — že velja). POPOLN SEZNAM MEST, ki jih zahteva nov modul (ugotovitev našteje le tri): (1) definicija v maloprodaja.ts; (2) vpis v MALOPRODAJA_MODULES (maloprodaja.ts:904–912), sicer modul v registru ne obstaja; (3) segments.ts:159–173, vstavi za 'blagajnaMp'; (4) content/methodology.ts in (5) content/actions/actions.ts — moduleEngine.test.ts:371–372 za vsak modul zahteva oba vnosa in brez njiju test pade; (6) maloprodaja.test.ts, kjer je blagajnaMp v seznamu COSTED_MODULES (46) in ima lastne preverbe (152–181, 342–344, 380). Opozorilo: s tem naraste število triažnih področij z 11 na 12, kar poslabša imenovalec v ICP — postavka o recommendedCount mora iti v isti spremembi.

*Preverba.* Ugotovitev potrjena. Predlogu dodan popoln seznam mest: manjkala sta vpis v MALOPRODAJA_MODULES in popravek maloprodaja.test.ts; potrjeno, da moduleEngine.test.ts:371–372 res zahteva vnosa v methodology in actions. Dodana vez na postavko o ICP imenovalcu.

*Vir v raziskavi.* Vprasalnik Q18, Q31; Raziskava §8.8, §16.2, §18; Katalog_bolecin B16, B17; Bolecina_finance M07

### K-21 · izboljsaj · teža srednja · preverba: popravljeno

**Triaža prevzemMp: »Koliko ročnega dela imate s prevzemom blaga, dokumenti dobaviteljev in prenosi med enotami?« (src/config/modules/maloprodaja.ts:609–615)**

*Utemeljitev.* Preverjeno: prompt na 609, možnosti 610–615 — 0 »Večina poteka elektronsko« (način), 1 »Nekaj ur tedensko« (obseg), 2 »Vsak dan« (frekvenca), 3 »Za to je potreben skoraj cel človek« (obseg). Tri različne osi v štirih stopnjah, zato trgovec, ki prevzema elektronsko in za to porabi šest ur na teden, ne more odgovoriti pošteno. Vsa tri polja modula so v h/mesec (619–647). Prompt sam se ujema z Q16 in razmejitvijo §18.

*Predlog.* Stopnje poenoti na eno os in v ISTI ENOTI kot polja modula, torej h/mesec (izvirni predlog je uporabil h/teden, kar bi obiskovalca pripravilo na napačno enoto — prav to naj bi popravek preprečil): 0 »Manj kot 4 ure na mesec — večina teče elektronsko«; 1 »4–20 ur na mesec«; 2 »20–60 ur na mesec — skoraj vsak dan«; 3 »Več kot 60 ur na mesec — za to je potreben skoraj cel človek«. Prompt pusti nespremenjen.

*Preverba.* Predlog je bil sam s seboj v neskladju: utemeljitev zahteva isto enoto kot polja (h/mesec), lestvica pa je bila zapisana v h/teden. Lestvica prevedena v h/mesec.

*Vir v raziskavi.* Vprasalnik Q16, Q29; Katalog_bolecin B05, B06, B07; Raziskava §8.3, §18

### K-22 · izboljsaj · teža srednja · preverba: popravljeno

**Triaža kanaliMp: »Kako pogosto spletna prodaja povzroči dodatno delo ali strošek — odpovedi, vračila, ročno usklajevanje?« — stopnja 0 »Spletne prodaje nimamo ali je usklajena sproti« (src/config/modules/maloprodaja.ts:718–725)**

*Utemeljitev.* Preverjeno: prompt na 718–719, stopnja 0 na 721 se res glasi »Spletne prodaje nimamo ali je usklajena sproti«. Registrsko pravilo drži: Q19 je »Pogojno« z odgovorom »ni relevantno«, Q34 zahteva, da se »ni relevantno« ne meša z drugimi stanji, §16.3 pa izrecno pravi, da neizbrani modul ni dokaz odsotnosti stroška. Za prodajo sta stanji res različni (arhetip A1/A2 proti zrelosti 2–3 in integracijskemu pogovoru).

*Predlog.* Stopnje prepiši, število štirih ohrani (TriageQuestion, moduleTypes.ts:209–213, in StepTriage.tsx:74 ključi radie po option.value, zato podvojene vrednosti niso mogoče): 0 »Spletne prodaje nimamo«; 1 »Imamo jo — artikli, cene in zaloga se usklajujejo sproti«; 2 »Redno nastane dodatno delo: odpovedi, vračila, ročno usklajevanje«; 3 »Vsak dan — vse usklajujemo ročno«. POZOR na stranski učinek, ki ga ugotovitev ne omeni: dobro urejen omnichannel trgovec s tem dobi oceno 1 namesto 0 in lahko ob izenačenju izpodrine drugo področje v selectTopModules (moduleEngine.ts:192–210). To je sprejemljivo, ker so za maloprodajo defaultIds nastavljeni, je pa treba to zapisati v komentar nad lestvico kot kalibracijsko postavko.

*Preverba.* Dodana razlaga, zakaj štirih stopenj ni mogoče obiti (StepTriage ključi radie po vrednosti), in opozorilo na stranski učinek: urejen splet dobi oceno 1 namesto 0 in vpliva na samodejno izbiro področij.

*Vir v raziskavi.* Vprasalnik Q19, Q34; Raziskava §8.9, §10, §16.3; Katalog_bolecin B18–B21; Arhetipi A4

### K-23 · ohrani · teža nizka · preverba: potrjeno

**Triaža analitikaHz: »Koliko ročnega dela zahteva priprava poročil in ključnih številk za odločanje?« (src/config/modules/horizontal.ts:41)**

*Utemeljitev.* Preverjeno: prompt je na horizontal.ts:41. Načelo, da mora besedilo horizontale držati v vsakem segmentu in da razmejitveni napotki ne smejo imenovati sosednjih področij, je zapisano v komentarju horizontal.ts:17–23 — panožno konkretiziranje tu res ni dopustno. Prompt se ujema z Q21 in B25, štiri stopnje so odgovorljive iz glave.

*Preverba.* Brez popravkov; načelo iz komentarja horizontal.ts:17–23 preverjeno dobesedno.

*Vir v raziskavi.* Vprasalnik Q21; Katalog_bolecin B25, B26; Raziskava §8.12; Segment_bolecina S1/S3

### K-24 · izboljsaj · teža nizka · preverba: popravljeno

**Triaža financeHz: »Koliko ročnega dela je v vašem računovodstvu in financah (knjiženje, usklajevanje, obračuni)?« (src/config/modules/horizontal.ts:145)**

*Utemeljitev.* Prompt je res na horizontal.ts:145. VENDAR glavna utemeljitev ne drži. (1) Beseda »usklajevanje« se v maloprodajni TRIAŽI ne pojavi trikrat, ampak dvakrat: v financeHz (145) in v kanaliMp (718–719). Prompt prevzemMp (609) je nima — »usklajevanje« nastopi šele v oznaki polja documentMatchingHoursPerMonth (627), ki je obiskovalec v triaži ne vidi. Prompt dokumentiHz (356) je prav tako nima. (2) Področji nista »v treh zaporednih vrsticah«: med financeHz in dokumentiHz stoji kadriHz. (3) Zahteva §18 po opombi pri časovnih vprašanjih je v poljih že izpolnjena — financeHz:158 in kadriHz:268 imata help »Ure, ki ste jih že vpisali v drugem področju, tu ne ponavljajte.« Ostane le ena resnična, majhna pomanjkljivost: prompt ne pove, čigavo delo štejemo, kadar je računovodstvo zunanje. Zato resnost z srednje na nizko.

*Predlog.* Zamenjaj samo prompt (horizontal.ts:145) z: »Koliko ročnega dela ima VAŠA ekipa z računovodstvom in financami — knjiženje, usklajevanje evidenc, obračuni in poročanje? Če vodi knjige zunanji servis, štejte le čas, ki ga porabite za pripravo podatkov zanj.« Izvirni dodatek »(Prevzema blaga in dobaviteljskih dokumentov tu ne štejte.)« je treba IZPUSTITI: financeHz je horizontala, ki jo uporablja šest segmentov, in imenovanje sosednjega področja krši načelo iz horizontal.ts:17–23 — prevzema blaga proizvodnja in računovodski servis nimata. Splošno opozorilo o nepodvajanju sodi na zaslon triaže (glej postavko o zaslonu triaže) in je v poljih že prisotno.

*Preverba.* Glavna utemeljitev OVRŽENA: »usklajevanje« se v triaži pojavi dvakrat, ne trikrat, področji nista sosednji, opomba §18 pa v poljih že obstaja (horizontal.ts:158, 268). Resnost znižana na nizko. Iz predloga odstranjen dodatek o prevzemu blaga, ker krši načelo segmentne nevtralnosti horizontal (horizontal.ts:17–23).

*Vir v raziskavi.* Raziskava §18, §8.11; Vprasalnik Q22; Bolecina_finance M11

### K-25 · ohrani · teža nizka · preverba: potrjeno

**Triaža kadriHz: »Koliko dela zahtevajo evidence delovnega časa, dopusti in priprava plač?« (src/config/modules/horizontal.ts:253)**

*Utemeljitev.* Preverjeno: prompt na 253, polja na 261–296 (timesheetHoursPerMonth, payrollPrepHoursPerMonth, hrAdminHoursPerMonth, annualPayrollErrorEUR) — prompt pokriva natanko ta štiri in nič več. Polja za izmenske razporede res ni, zato prompt pravilno ne obljublja meritve, ki je ni. §8.10 res svari pred nizko zanesljivostjo izgubljenih prodaj zaradi premalo ljudi; modul jih ne meri.

*Preverba.* Sklic na polja popravljen s 262–295 na 261–296; vsebinsko brez sprememb.

*Vir v raziskavi.* Vprasalnik Q20; Raziskava §8.10; Bolecina_finance M09

### K-26 · ohrani · teža nizka · preverba: potrjeno

**Triaža dokumentiHz: »Koliko časa se izgubi s potrjevanjem, iskanjem in ročnim pošiljanjem dokumentov?« (src/config/modules/horizontal.ts:356)**

*Utemeljitev.* Preverjeno: prompt na 356. Trije glagoli res ustrezajo razmejitvi iz §18 (»iskanje ali odobritev dokumenta → dokumentacija«, »knjiženje računa → finance«, »primerjava dobavnice in računa → prevzem«), meja je torej v besedilu samem in ne le v pomoči. Za maloprodajo je področje relevantno kot pripravljenost na B2B e-račune (R04) in bolečina B23. Sklep, da se tveganje podvajanja odpravi drugje, drži — a opozarjam, da se je utemeljitev tistega »drugje« (postavka financeHz) izkazala za pretirano.

*Preverba.* Brez popravkov; dodano opozorilo, da se sklic na popravek pri financeHz nanaša na zoženo različico tiste postavke.

*Vir v raziskavi.* Raziskava §18, §8.11; Regulatorni_koledar R04; Katalog_bolecin B23, B24

### K-27 · ohrani · teža nizka · preverba: popravljeno

**Triaža servisHz: »Koliko dela vam povzročajo garancijska popravila, servis in vodenje reklamacij po predaji?« (src/config/modules/horizontal.ts:466)**

*Utemeljitev.* Preverjeno: prompt na 466, komentar o izključitvi dobropisov in vračil kupnine na 453–459 (ne 456–459). Besedna zveza »po predaji« je res meja iz §18 (garancijsko popravilo → servis, običajno spletno vračilo → spletna prodaja). Q23 je v registru pogojen; za živilskega trgovca je stopnja 0 (»Skoraj nič — primerov je malo«) pošten odgovor in ne izsiljena izbira.

*Preverba.* Popravljen sklic na komentar (horizontal.ts:453–459, ne 456–459); vsebinsko potrjeno.

*Vir v raziskavi.* Vprasalnik Q23; Raziskava §18, §8.9; Katalog_bolecin B22, B29; Segmenti S7

### K-28 · izboljsaj · teža srednja · preverba: popravljeno

**triage.recommendedCount = 3 (src/config/segments.ts:179)**

*Utemeljitev.* POTRJENO in preračunano. Vrednost je res na segments.ts:179. §16.1 korak 5 res predlaga samodejni izbor DVEH modulov s tretjim po želji. Dimenzija 'engagement' (icp.ts:271–294) računa coverage = measuredAreaCount / offeredAreaCount (281), kjer je offeredAreaCount število triažnih modulov segmenta (salesReport.ts:377). Preštel sem: maloprodaja jih ima 11, računovodski servis 7 (zajemRs, strankeRs, obracuniRs, popravkiRs, donosnostRs, analitikaHz, kadriHz). Vzoren obiskovalec, ki izmeri priporočena tri, res doseže 0,27 proti 0,43 za isto vedenje. Ob dodanem področju 'inventuraMp' (12 področij) bi padel na 0,25 — vsako dodano področje tiho zniža oceno vsem maloprodajnim leadom.

*Predlog.* Vrednost 3 ohrani. V IcpSignals (icp.ts:21–50) dodaj recommendedCount: number, napolni ga v buildIcpSignals (salesReport.ts:352–383) iz params.segment.triage?.recommendedCount ?? 0. V dimenziji 'engagement' (icp.ts:279–293) zamenjaj vrstico 281 z: const target = Math.max(recommendedCount, measuredAreaCount) || offeredAreaCount; const coverage = target > 0 ? Math.min(1, measuredAreaCount / target) : 0. Trije razlogi za to obliko: (a) segment brez triaže ima recommendedCount 0 in offeredAreaCount 0 — brez varovala bi bila coverage NaN; (b) Math.min(1, …) prepreči, da bi obiskovalec z več izmerjenimi področji od priporočenih presegel 1 in s tem clamp01 skril napako; (c) opomba na 291 (»Izmeril N od M področij«) naj še naprej izpisuje offeredAreaCount, ker prodajniku pove dejansko pokritost — ocena in opomba tu smeta govoriti različno, ker prva meri vedenje, druga stanje. icp.test.ts je treba dopolniti s primerom, ki to razmerje preveri.

*Preverba.* Ugotovitev preverjena s preštetjem področij v obeh segmentih. Formula konkretizirana: dodana varovala za segment brez triaže (deljenje z nič) in za pokritost nad 1, ter razločeno, da opomba še naprej izpisuje dejansko število ponujenih področij.

*Vir v raziskavi.* Raziskava §16.1 korak 5, §23; Financne_formule F11; ICP_scoring

### K-29 · izboljsaj · teža srednja · preverba: popravljeno

**triage.defaultIds = ['razpolozljivostMp','zalogeMp','blagajnaMp'] (src/config/segments.ts:180)**

*Utemeljitev.* Preverjeno v registru Segment_bolecina: pri S1 sta B05 (ročen prevzem) in B13 (dolgi zaključki) označena kot »visoko«, prazna polica B09 pa kot »srednje« — trditev drži dobesedno. Preverjeno v kodi: razpolozljivostMp je res edino privzeto področje z usesRevenue (maloprodaja.ts:91), prihodek pa ima namerni fallback 0 (contexts/maloprodaja.ts:133), zato kdor razpona ne izbere, iz privzetega področja dobi skoraj nič. defaultIds so res tudi razsodnik ob izenačenju (selectTopModules, moduleEngine.ts:192–210, rankOf). KLJUČNO ZA IZVEDLJIVOST, kar ugotovitev podceni: korak 'context' je v stepOrder PRED 'triage' (CalculatorFlow.tsx:123–130), zato je profile.businessType ob izračunu autoSelection (141–147) že znan in je v istem obsegu — to ni nova zmožnost, ampak dodatek enega argumenta.

*Predlog.* V segments.ts dodaj v triage neobvezno polje defaultIdsByBusinessType?: Record<string, string[]> z vrednostmi: 'enaPoslovalnica' → ['prevzemMp','blagajnaMp','zalogeMp']; 'vecPoslovalnic' in 'poslovalniceInSplet' → sedanja trojica; 'samoSplet' → ['kanaliMp','zalogeMp','prevzemMp']; 'maloInVeleprodaja' → ['zalogeMp','marzeMp','prevzemMp']. defaultIds ostane kot rezerva, kadar obiskovalec businessType ni izbral. V CalculatorFlow.tsx:140 zamenjaj const defaultIds = segment.triage?.defaultIds z izpeljavo: segment.triage?.defaultIdsByBusinessType?.[profile.businessType ?? ''] ?? segment.triage?.defaultIds, in profile.businessType dodaj med odvisnosti useMemo (146). Ta postavka in postavka o businessType sta en sam popravek. Test v moduleEngine.test.ts, ki preverja tie-break s preferred, je treba razširiti s primerom po businessType.

*Preverba.* Trditev o S1 preverjena v registru. Popravljena ocena zahtevnosti: to NI nova zmožnost toka — businessType je ob triaži že znan (stepOrder), zato gre za en dodaten argument in eno odvisnost useMemo. Predlog konkretiziran do imena polja in vrstice.

*Vir v raziskavi.* Segment_bolecina S1/S2/S4/S5; Raziskava §4.1, §4.3; Katalog_bolecin B05, B13, B09

### K-30 · izboljsaj · teža srednja · preverba: popravljeno

**Zaslon triaže: 11 področij, vsako s promptom, štirimi možnostmi in potrditvenim poljem, na eni strani (src/components/Calculator/StepTriage.tsx:64–100)**

*Utemeljitev.* Preverjeno: zanka po modulih je na 65–99, izriše samo definition.title (71) in triage.prompt (72), polje summary pa se uporabi le v prodajni pripravi (salesReport.ts:398). 11 področij × 4 možnosti = 44 radijskih gumbov in 11 potrditvenih polj (ugotovitev navaja 55 gumbov — napačno, možnosti so štiri na področje, ne pet). Zadnjih pet so res horizontale. Živo premikanje predloga do prvega klika je res namerno in dokumentirano (CalculatorFlow.tsx:490–495). Opomba pod seznamom obstaja (102–106).

*Predlog.* Trije posegi brez spremembe motorja, vsi v StepTriage.tsx, ki je SKUPEN vsem segmentom — vsaka sprememba mora zdržati tudi v proizvodnji in logistiki: (1) pod legendo področja (71) izpiši <p className={styles.summary}>{definition.summary}</p> — besedilo že obstaja pri vsakem modulu; dodaj razred v StepTriage.module.css. (2) Horizontale loči s podnaslovom: ker StepTriage prejme module kot enoten seznam, dodaj v ModuleDefinition neobvezno zastavico horizontal?: true in jo postavi na vseh pet v horizontal.ts (izpeljava iz predpone id-ja 'Hz' bi bila tiho pravilo, ki ga prva izjema podre). Pred prvo tako postavko izriši podnaslov »Področja, ki niso odvisna od panoge« in eno opombo: »Ur, ki ste jih ocenili zgoraj, tu ne štejte znova.« (3) V obstoječo opombo (105) dodaj oceno časa — glej postavko o uvodnem podnaslovu; to je ista vrstica in isti popravek. Razdelitev triaže na dva zaslona ostane izven obsega (nov korak v stepOrder, CalculatorFlow.tsx:123–130).

*Preverba.* Popravljeno število radijskih gumbov (44, ne 55) in sklic na živo premikanje (CalculatorFlow.tsx:490–495). Predlog (2) konkretiziran: ločevanje horizontal zahteva izrecno zastavico v ModuleDefinition, ne izpeljave iz id-ja; poudarjeno, da je zaslon skupen vsem segmentom.

*Vir v raziskavi.* Raziskava §16.2, §18, §23

### K-31 · izboljsaj · teža srednja · preverba: popravljeno

**costBasisIntro: »Pet številk, ki veljajo za vsa področja …« (src/config/contexts/maloprodaja.ts:61–62)**

*Utemeljitev.* Preverjeno: besedilo na 61–62. Prihodek množita samo razpolozljivostMp (91) in marzeMp (334), maržo samo razpolozljivostMp (92) in kanaliMp (713), strošek kapitala izključno zalogeMp (303); modula s terjatvami v maloprodaji ni. Korak costBasis je v stepOrder res PO triaži (CalculatorFlow.tsx:123–130), zato je izbira ob izrisu znana. Zastavici usesRevenue/usesMargin obstajata, anyAnsweredModuleUses (potential.ts:87–97) pa je zasebna funkcija tega modula. RESNA PASTI, ki je ugotovitev ne obravnava: obiskovalec lahko po rezultatih dodatno področje doda (openInputsAt v CalculatorFlow.tsx:194–197, gumb »izmeri to področje«). Če je bilo vprašanje o prihodku prej skrito, tako dodano področje tiho računa s prihodkom 0 — natanko tiha ničla, ki jo §24 P0 prepoveduje.

*Predlog.* Izvedi v dveh korakih in drugega samo z varovalom. Korak 1 (takoj, brez tveganja): popravi besedilo na 61–62, da ne trdi neresnice — »Te številke veljajo za vsa področja, ki ste jih izbrali. Polni strošek ure pomeni bruto plačo s prispevki delodajalca ter regresom, malico in prevozom — ne neto izplačila in ne režije.« Brez štetja, da se besedilo in prikaz ne moreta razili. Korak 2 (pogojni prikaz): prihodek in maržo prikaži samo, kadar ju kateri IZBRAN modul uporablja; za to izvozi anyAnsweredModuleUses iz potential.ts (87–97) ali dodaj njegovo različico brez preverbe izpolnjenosti, ker v koraku costBasis vnosov še ni. Za strošek kapitala dodaj v ModuleDefinition zastavico usesCapitalCost?: true in jo postavi na zalogeMp; registrski test, ki usesRevenue preverja proti compute.toString() (usesRevenue.test.ts), razširi še nanjo. VAROVALO, brez katerega koraka 2 ne izvajaj: ko obiskovalec z rezultatov doda področje, ki uporablja skrito predpostavko, ga mora tok najprej vrniti na korak costBasis (openInputsAt naj v tem primeru nastavi step na 'costBasis'), sicer se v izračun tiho vpiše 0.

*Preverba.* Ugotovitev potrjena po vrsticah. Predlogu dodana pot dodajanja področja z rezultatov (CalculatorFlow.tsx:194–197), ki bi ob pogojnem prikazu tiho vpisala prihodek 0; popravek razdeljen na varen tekstovni del in pogojni prikaz z obveznim varovalom.

*Vir v raziskavi.* Raziskava §16.1 korak 6, §23, §24 P0

### K-32 · ohrani · teža nizka · preverba: potrjeno

**operationalHour: »Približen polni strošek ure v poslovalnici ali skladišču« … pasovi 15/19/25/33, fallback 20 EUR/h (src/config/contexts/maloprodaja.ts:112–118, 21–26)**

*Utemeljitev.* Preverjeno v celoti: vprašanje na 112–118, SHOP_HOUR_BANDS na 21–26 s sredinami 15/19/25/33, fallback 20 leži v natanko enem pasu (17do22: 17–22). Test »povprečje panoge leži v natanko enem pasu« je res v contexts.test.ts:138 in res teče prek ratesOf, torej pokriva to postavko. Prevzem povprečja res vrne razpon prek industryAverageBand (contextTypes.ts:262–266) in costRange (range.ts:61–72). Viri v docs/urne-postavke.md preverjeni: prodajalec 17,6 EUR/h (vrstica 51), skladiščnik 20,0 (vrstica 55), SURS tabela 0711335S. Razmejitev proti administrativni uri se ujema z razporeditvijo v modulih (zaključki 567, prevzem 674, prenosi 688 in obdelava spletnih naročil 808 na operativno; ceniki 447, dokumenti 681, uskladitev kanalov 801 na administrativno).

*Preverba.* Brez popravkov; dodatno preverjeni viri v docs/urne-postavke.md in razporeditev obeh urnih postavk po vseh izračunih modulov.

*Vir v raziskavi.* Predpostavke A13; Raziskava §5.2; docs/urne-postavke.md (SURS 0711335S)

### K-33 · ohrani · teža nizka · preverba: potrjeno

**adminHour: »Približen polni strošek administrativne oziroma vodstvene ure« … pasovi 17/24/33/45, fallback 25 EUR/h (src/config/contexts/maloprodaja.ts:120–126)**

*Utemeljitev.* Preverjeno: vprašanje na 120–126, ADMIN_HOUR_BANDS v contexts/shared.ts:18–23 s sredinami 17/24/33/45, fallback 25 leži v natanko enem pasu (20do28). Pomoč našteva vloge, katerih ure ta postavka dejansko množi — priceMaintenanceHoursPerMonth (447), documentMatchingHoursPerMonth (681), catalogSyncHoursPerMonth (801). ADMIN_HOUR_EXPLAINER (shared.ts:49–53) res izrecno opozori, da administrativna ura ni nujno dražja od operativne.

*Preverba.* Brez popravkov; sklic na ADMIN_HOUR_BANDS natančneje umeščen v contexts/shared.ts:18–23.

*Vir v raziskavi.* Predpostavke A13; Raziskava §5.2, §8.6; docs/urne-postavke.md

### K-34 · izboljsaj · teža visoka · preverba: popravljeno

**annualRevenue: »Letni prihodek od prodaje blaga«, pasovi 0,6/1,8/5,5/15 mio, fallback 0 (src/config/contexts/maloprodaja.ts:128–135, 36–41)**

*Utemeljitev.* Izjema fallback = 0 je preverjeno dosledno izpeljana: ScaleQuestion.fallback (contextTypes.ts:111–118), hasIndustryAverage = question.fallback > 0 (StepCostBasis.tsx:301) skrije gumb za povprečje, isRevenueMissing (potential.ts:74–81) in prag na 235 spustita zanesljivost na 'low', razlaga v prodajni pripravi to pove (salesReport.ts:503–505). Scenarij nesmiselno majhne vrednosti je resničen: vnos je na StepCostBasis.tsx:313–336 in če brskalnik iz »2,5« naredi 2.5, je isRevenueMissing false in zanesljivost ostane visoka. VENDAR predlagana normalizacija ni izvedljiva na obstoječem polju: to je <input type="number">, pri katerem brskalnik neveljaven niz (»2.000.000«) vrne kot prazen — presledkov in pik ni mogoče odstraniti, ker do JS-a sploh ne pridejo.

*Predlog.* (1) Če hočeš normalizacijo, mora polje postati <input type="text" inputMode="decimal"> — šele takrat ima onChange dostop do surovega niza in je mogoče odstraniti presledke in pike ter vejico pretvoriti v piko. To spremeni obe poti v ScaleField (313–336) in ga razdvoji od CostField, zato je to zavestna odločitev, ne stranski učinek; če je ne želiš, izpusti (1) in izvedi samo (2). (2) Mehko opozorilo pod poljem, kadar je vneseni prihodek nad 0 in pod 50.000 EUR: »Ali ste mislili 2.000.000? Znesek vpišite brez pik in presledkov.« Nikoli blokada, po vzoru plausibilityWarning (StepInputs.tsx:84–89). Praga »10.000 EUR na zaposlenega« NE uporabljaj: StepCostBasis nima dostopa do števila zaposlenih (props na 16–24 so context, profile, onChange, stepLabel, onNext, onBack) in bi ga bilo treba dodatno prenesti skozi CalculatorFlow. (3) Prihodek, maržo in strošek kapitala zapiši v prodajno pripravo — glej zadnjo postavko. Pasovi in geometrijske sredine ostanejo.

*Preverba.* Predlog (1) je bil neizvedljiv: na <input type="number"> normalizacija ločil ni mogoča, ker brskalnik neveljaven niz vrne kot prazen — dodana zahteva po zamenjavi tipa polja ali opustitvi te točke. Predlog (2) popravljen: prag na zaposlenega ni izračunljiv, ker StepCostBasis nima podatka o zaposlenih.

*Vir v raziskavi.* Predpostavke A01; Vprasalnik Q07, Q34; Raziskava §16.3, §24 P0

### K-35 · izboljsaj · teža visoka · preverba: popravljeno

**contributionMargin: »Povprečna prispevna marža«, pasovi 12/20/30/42 %, fallback 25 % (src/config/contexts/maloprodaja.ts:137–145, 50–55)**

*Utemeljitev.* POTRJENO in preverjeno po korakih. MARGIN_BANDS (50–55): '15do25' ima max 0,25, '25do35' ima min 0,25; industryAverageScaleBand (contextTypes.ts:278–282) uporabi .find z >= min && <= max in vrne PRVEGA, torej '15do25'. scaleRange (range.ts:74–88) iz njega vzame meji 0,15–0,25, zato je vrednost, ki jo obiskovalec vidi v polju (25 %), natanko zgornji rob razpona, s katerim računamo. Test iz contexts.test.ts:138 res teče samo prek ratesOf (33–39), torej CostQuestion, in velikostnih predpostavk ne pokriva. A03 res daje 0,22/0,27/0,30 in privzetek 0,25 iz raziskave ne izhaja. DVE POMEMBNI DOPOLNILI: (a) isto napako imata splosno (fallback 0,25 pri enakih pasovih) in trgovina (fallback 0,20, pas '10do20' max 0,20 proti '20do30' min 0,20) — proizvodnja je čista; (b) predlagana sprememba DEFAULT_COST_CONTEXT in privzetka v emptyProfileFor bi spremenila segmente, ki marže sploh ne vprašajo.

*Predlog.* (1) V MALOPRODAJA_CONTEXT spremeni contributionMargin.fallback na 0.22 (konzervativni scenarij A03); 0,22 leži v natanko enem pasu (15–25 %). (2) DEFAULT_COST_CONTEXT (moduleEngine.ts:25) in privzetek »?? 0.25« v emptyProfileFor (contextTypes.ts:315–319) PUSTI PRI MIRU: to nista maloprodajni številki, ampak zasilna vrednost za segmente in teste brez konteksta, in njuna sprememba bi tiho premaknila rezultate drugod. (3) Test iz contexts.test.ts:138 razširi z ratesOf na costBasisQuestionsOf (47–53), a OBVEZNO s pogojem, ki preskoči vprašanja s fallback === 0 — annualRevenue ima fallback 0, ki ne leži v nobenem pasu (najnižji se začne pri 200.000), zato bi naivna razširitev test takoj podrla. Pogoj naj bo isti kot hasIndustryAverage v StepCostBasis.tsx:301. (4) Pričakuj, da bo razširjeni test razkril isto napako pri splosno in trgovina — to sta ločeni odločitvi in ne del tega popravka; do njiju test začasno omeji na maloprodajo ali ju popravi v isti spremembi. (5) Dodaj mehko opozorilo pri vnosu nad 60 % ali pod 5 %: »To je prispevna marža, ne pribitek na nabavno ceno — pribitek 40 % pomeni maržo okoli 29 %.«

*Preverba.* Ugotovitev potrjena po korakih izračuna. Iz predloga odstranjena sprememba DEFAULT_COST_CONTEXT in emptyProfileFor (nista maloprodajni številki). Razširitvi testa dodan obvezen pogoj za fallback === 0, sicer test takoj pade na prihodku. Dodano, da ista napaka obstaja v splosno in trgovina.

*Vir v raziskavi.* Predpostavke A03; KPI K01; Raziskava §5.1, §5.2; Vprasalnik Q07

### K-36 · izboljsaj · teža srednja · preverba: popravljeno

**capitalCostRate: »Letni strošek financiranja obratnega kapitala«, pomoč »… Množi denar, vezan v terjatvah in zalogah«, pasovi 4/6,5/10/15 %, fallback 6 % (src/config/contexts/maloprodaja.ts:151–164)**

*Utemeljitev.* Preverjeno: vprašanje na 151–164, capitalCostRate v maloprodaji množi izključno releasableEUR v zalogeMp (maloprodaja.ts:303); modula s terjatvami v segmentu ni. Fallback 6 % leži v natanko enem pasu (5do8) in je nižji od A19 (0,07/0,08/0,09) — razlika je konservativna. POPRAVEK ugotovitve: skupni CAPITAL_COST_EXPLAINER (contexts/shared.ts:68–71) se ne začne pri zalogi, ampak z besedami »Koliko vas stane, da je denar vezan v TERJATVAH in zalogah«. Sklep »ne spreminjaj ga« je vseeno pravilen, a iz drugega razloga: pojasnilo je skupno segmentom trgovina in splosno, ki terjatve dejansko merita, zato bi ga bilo mogoče popraviti samo z ločenim maloprodajnim pojasnilom — kar je nova evidenca in ne popravek.

*Predlog.* (1) Pomoč na maloprodaja.ts:153 skrajšaj na maloprodajno resnico: »Obrestna mera posojila ali limita oziroma donos, ki bi ga denar prinesel drugje. Množi denar, ki leži v zalogah.« (2) Skupnega CAPITAL_COST_EXPLAINER ne spreminjaj — je skupen s segmentoma, ki terjatve merita. (3) Pogojni prikaz vprašanja (nova zastavica usesCapitalCost) izvedi samo skupaj z varovalom iz postavke o costBasisIntro: brez njega obiskovalec, ki zalogeMp doda šele z rezultatov, dobi tiho ničlo. (4) Ob naslednji kalibraciji privzetek preveri proti A19 in v komentar na 146–150 pripiši, da 6 % ni izpeljano iz raziskave, ampak podedovano iz prejšnje konstante.

*Preverba.* Popravljena trditev o vsebini skupnega pojasnila: CAPITAL_COST_EXPLAINER se ZAČNE s terjatvami (shared.ts:68–71), ne le z zalogo. Sklep ostane isti, a z drugo utemeljitvijo. Pogojni prikaz vezan na varovalo iz postavke o costBasisIntro.

*Vir v raziskavi.* Predpostavke A19; Financne_formule F03; Raziskava §5.4; Bolecina_finance M02

### K-37 · dodaj · teža visoka · preverba: popravljeno

**Skupna finančna osnova → prodajna priprava: manjkajo vrstice za prihodek, prispevno maržo in strošek kapitala (src/lib/salesReport.ts:420–456)**

*Utemeljitev.* POTRJENO. buildHourAssumptions (420–456) zbira izvor samo za operativno, administrativno in zaračunano uro. Iskanje po salesReportHtml.ts, pdfSales.ts, pdf.ts in exportRecord.ts ne vrne nobenega zadetka za annualRevenue, contributionMargin ali capitalCostRate. V maloprodaji sta prav prihodek in marža množitelja največje postavke (F01, maloprodaja.ts:168–172), zato prodajnik na sestanku brani znesek, ne da bi vedel, ali je stranka vpisala svojo številko, izbrala razpon 3–10 mio ali prevzela našo oceno marže. Q34 zahteva vir podatka za vsak znesek, F11 tehtanje po finančnem pomenu. POPRAVEK: trditev, da »costBandLabel ima velikostno različico že v answerLabels«, NE drži — answerLabels.ts izvaža samo costBandLabel (71); različice za ScaleQuestion/ScaleAssumption ni.

*Predlog.* (1) V answerLabels.ts dodaj scaleBandLabel(question: ScaleQuestion | undefined, assumption: ScaleAssumption): string | null po vzoru costBandLabel (71–82) — brez nje predloga ni mogoče izvesti. (2) V SalesReportSoftness (salesReport.ts:169–181) dodaj scaleAssumptions: ScaleAssumptionRow[] (oznaka vprašanja, vrednost, enota, estimated, source, bandLabel) in ga polni z novo funkcijo buildScaleAssumptions po vzoru buildHourAssumptions, ki vsako od treh vprašanj doda samo, kadar ga kontekst sploh vpraša (enako varovalo kot pri chargeOutRate, 444–452). (3) Za izpis vira ponovno uporabi hourAssumptionSource (136–142) ali dodaj njeno različico, ki pri odstotkih ne izpiše »EUR/h«. (4) Izriši v isti tabeli kot urne postavke v salesReportHtml.ts in pdfSales.ts — obe imata test (salesReportHtml.test.ts, pdf.test.ts). (5) V CSV_COLUMNS dodaj NA KONEC 'annualRevenueEUR', 'annualRevenueSource', 'contributionMarginRate', 'contributionMarginSource', 'capitalCostRate' in iste vrednosti v buildCsvRow; exportRecord.test.ts preverja enako dolžino obeh seznamov, zato je treba dopolniti oboje.

*Preverba.* Ugotovitev potrjena z iskanjem po vseh štirih izrisovalcih. Ovržena predpostavka, da velikostna različica costBandLabel že obstaja — v answerLabels.ts je ni in jo je treba dodati; predlogu dodan ta korak ter opozorilo, da exportRecord.test.ts preverja enako dolžino stolpcev in vrstice.

*Vir v raziskavi.* Vprasalnik Q34; Financne_formule F01, F11; Raziskava §16.3, §19.1, §24 P0


---

## PS · razpolozljivostMp + kanaliMp

### PS-01 · ohrani · teža nizka · preverba: popravljeno

**Triaža razpolozljivostMp: »Kako pogosto kupec pri vas ne dobi artikla, ki bi ga kupil — ker ga ni na polici ali ni dobavljiv?« (src/config/modules/maloprodaja.ts:96-104)**

*Utemeljitev.* Sklici držijo: triaža je res na :96-104, selectTopModules na moduleEngine.ts:192-210, privzeta trojica ['razpolozljivostMp','zalogeMp','blagajnaMp'] na segments.ts:178-181, iztočnice za neizmerjena boleča področja na salesPlaybook.ts:83-88. Prompt je res dobeseden prevod Q12 in registrska opomba ob Q12 izrecno pravi »spletne odpovedi so ločene«, zato je izpust spleta namerna in pravilna odločitev. NAPAČNA pa je trditev o doslednosti: možnost 3, ki meša pogostost z nepoznavanjem, obstaja pri ŠTIRIH od šestih modulov (razpolozljivostMp :102, zalogeMp :218 'Veliko — obsega pa ne merimo', marzeMp :345 'Stalno — obsega pa ne poznamo', blagajnaMp :482 'Veliko ali pa tega sploh ne merimo'), NE pa pri prevzemMp (:614 'Za to je potreben skoraj cel človek') in ne pri kanaliMp (:724 'Vsak dan — usklajujemo ročno'). Argument »popravek na enem mestu bi razbil primerljivost« torej pade — vzorec je že danes neenoten. Verdikt kljub temu ostane 'ohrani': popravljanje bi bilo smiselno le kot enotna poteza čez vse štiri module, ne kot posamičen poseg v to področje, in trenutna škoda je majhna, ker triažna ocena ne vstopa v noben znesek, ampak le v izbor področij in v prodajne iztočnice.

*Predlog.* Brez spremembe v tem pregledu. Če se vzorec kdaj poenoti, naj se to zgodi hkrati na :102, :218, :345 in :482, ne posamično — sicer nastane ravno tista neprimerljivost, ki jo ugotovitev napačno pripisuje sedanjemu stanju.

*Preverba.* Trditev »isti vzorec je dosleden čez vseh šest maloprodajnih modulov (:218, :345, :482, :614, :724)« je napačna: :614 in :724 tega vzorca nimata. Verdikt ostane 'ohrani', utemeljitev pa je zamenjana (majhna škoda + potreba po enotni potezi, ne varovanje primerljivosti).

*Vir v raziskavi.* Raziskava §8.4, §16.2; xlsx Vprasalnik Q12 (opomba 'spletne odpovedi so ločene'), KPI_slovar K06

### PS-02 · ohrani · teža nizka · preverba: potrjeno

**Podnaslov področja: »Marža, ki je ne zaslužite, ker artikla ni na zalogi, ekspresne dobave in čas iskanja blaga po enotah.« (maloprodaja.ts:94-95)**

*Utemeljitev.* Vse preverjeno in drži. compute() vrne izide v vrstnem redu lostMargin (:166-174), directLoss (:175-180), capacity (:181-187) — podnaslov jih našteje v istem vrstnem redu. Ločnica med nezasluženo maržo in odtekelim denarjem je res kodificirana v BucketId (moduleTypes.ts:17-30, kjer komentar ob 'directLoss' izrecno pove »Edino to gre v hero znesek«, ob 'lostMargin' pa pojasni različno težo dokaza s sklicem na raziskavo §5.2). buildMeasuredArea res kopira summary v prodajno poročilo (salesReport.ts:398), od koder gre v PDF in HTML poročilo.

*Vir v raziskavi.* Raziskava §5.2 (štiri ekonomske košarice), §8.4; xlsx Problem_podatki M01

### PS-03 · izboljsaj · teža visoka · preverba: potrjeno

**lostSalesSharePercent — »Kolikšen delež letne prodaje po vaši oceni izgubite, ker artikla ni na zalogi?« (maloprodaja.ts:106-119)**

*Utemeljitev.* Vse tri trditve preverjene in potrjene. (1) Meja proti spletu: help na :114 govori samo o 'delež prometa, ne marže' in o 'pustite 0', spletnih odpovedi ne omenja; nasprotna smer JE zavarovana (kanaliMp help na :736: »Izgubljeno prodajo v poslovalnici šteje področje Prazne police«). Registrska opomba ob F01 zahteva »loči poslovalnico od spletne odpovedi«, Problem_podatki M01 pa »spletne odpovedi ne podvajaj« — torej je zahtevana ločitev v OBE smeri. Nevarnost je realna: razpolozljivostMp je med privzetimi tremi (segments.ts:178-181), kanaliMp ni, businessType 'samoSplet' obstaja (contexts/maloprodaja.ts:70) in oba zneska pristaneta v košu lostMargin (:166 in :784). (2) Lažna natančnost: ModuleSection.tsx:36-39 vrne 1 decimalko, ker je 0,0025×100 = 0,25 < 1; prikazana vrednost se izračuna kot Math.round(value*100*10)/10 (:77 in :84), zato drsnik na 0,25 % izpiše 0,3 % in na 0,75 % izpiše 0,8 %. Shranjena vrednost ostane točna — napačna je le številka, ki jo obiskovalec vidi, kar je še slabše, ker izgleda kot napaka kalkulatorja. Noben test ne trdi ničesar o step, zato je sprememba brez posledic za teste. (3) Explainer (:115-118) ima primer, a le v smeri odstotek → evri; poti od števila dogodkov do odstotka nima, čeprav A05 (0,006 / 0,012 / 0,02) pove, da gre za odstotek, ki ga nihče ne vodi. Strop 0,03 res leži nad potencialom 0,02.

*Predlog.* help: 'Delež prometa, ne marže — maržo izračunamo sami. Spletnih naročil, ki ste jih morali odpovedati, sem ne štejte: šteje jih področje Spletna prodaja. Če prodajate samo prek spleta, pustite 0.'
step: 0.001 (min 0 in max 0.03 ostaneta nespremenjena; pri 0,001 je displayStep 0,1 in prikaz se izide brez zaokroževanja).
explainer: 'Delež PROMETA, ne marže. Če odstotka ne poznate, ga izpeljite iz dogodkov: 3 kupci na dan × 26 dni × 25 EUR povprečnega nakupa ≈ 23.000 EUR na leto; pri prometu 2 mio EUR je to približno 1,2 %. Če ocene nimate, pustite 0 — mesec beleženja vprašanj "imate to?" da boljšo številko kot ugibanje.'
Opombi za razvijalca: (a) polje je kind 'percent' in torej mode='slider', allowUnknown pa ModuleInput upošteva samo pri mode='number' (ModuleInput.tsx:93) — 'Tega podatka ne vodimo' tu ni na voljo in tega ne poskušajmo obiti; nedotaknjen drsnik pristane med untouchedFields (salesReport.ts:310 prek isUntouchedNumeric na :482-488, ki 'percent' zajame) in postane iztočnica v prodajni pripravi. (b) Noben test ne preverja step, zato sprememba ne podre ničesar.

*Preverba.* Brez vsebinskega popravka. Dodana sta le mehanizem zaokroževanja (ModuleSection.tsx:77 in :84, ne le :36-39) in dejstvo, da noben test ne trdi ničesar o step — s tem je predlog izvedljiv brez nadaljnjih odločitev.

*Vir v raziskavi.* Raziskava §8.4 (F01 in rdeča zastavica), §18; xlsx Financne_formule F01 ('loči poslovalnico od spletne odpovedi'), Problem_podatki M01 ('spletne odpovedi ne podvajaj'), Predpostavke A05, Vprasalnik Q25

### PS-04 · izboljsaj · teža srednja · preverba: popravljeno

**substitutionShare in SUBSTITUTION_SHARES — »Kolikšen del teh kupcev kupi drug artikel pri vas ali se vrne pozneje?« (maloprodaja.ts:69, 71-87)**

*Utemeljitev.* Jedro drži. A06 v registru je res 0,55 / 0,45 / 0,35 (konservativno / realistično / potencial), SUBSTITUTION_SHARES[3] = 0,45 (:69) je torej REALISTIČNA in ne konservativna vrednost; komentar na :62-68 je sam po sebi resničen ('sredina razpona'), sporna je izbira, ne opis. Hišno pravilo za neodgovor res vleče navzdol: reducibleShareOf (shared.ts:97-99) vrne za 'Ne vem' 0,05, kar JE najnižja vrednost v REDUCIBLE_SHARES (shared.ts:59). Izračun napihnjenosti drži: (1−0,45)/(1−0,55) = 1,22. Panožnih deležev 70–80 % oziroma 20–30 % iz explainerja (:77-80) v raziskavi ni — iskanje po Raziskava_maloprodaja_PANTHEON.md ne vrne nobene take številke, register pa ima samo A06; gre torej res za besedilo, ki usmerja izbiro brez vira. Stranski učinek je preverjen: isModuleAnswered (moduleEngine.ts:227-238) vrne true ob vsaki vrednosti, ki ni privzetek, unmeasuredModules v CalculatorFlow.tsx:297-302 pa uporablja prav to funkcijo, zato področje s 0 EUR res izpade iz razdelka »Česa nismo izmerili«. NETOČNOST: ADDRESSABLE_SHARE.unknown = 0,30 (addressableShare.ts:34) NI najkonservativnejši konec — 'external' je 0,25 in 'physical' 0,15; 'unknown' je drugi najnižji med kategorijami, ki se v maloprodaji dejansko pojavijo. Trditev, da 'vsak drug neodgovor pade na najkonservativnejši konec', torej velja za reducibleShareOf, ne pa za ADDRESSABLE_SHARE. Severity znižana z visoke na srednjo: napaka udari šele, kadar je lostSalesSharePercent večji od 0 (privzetek je 0), zadene pa najmehkejši koš (lostMargin), ki je v poročilu tako ali tako prikazan ločeno od hero zneska.

*Predlog.* SUBSTITUTION_SHARES = [0.7, 0.5, 0.2, 0.55] — 'Ne vem' na konservativni konec A06.
Komentar (:62-68) popraviti v: »'Ne vem' pade na KONSERVATIVNI konec razpona iz raziskave (A06 = 0,55) — po istem pravilu kot reducibleShareOf, ki neznan indeks vrne na najnižji delež zmanjšanja. Ker višja substitucija pomeni manjšo izgubo, je smer napake pri neodgovoru vedno navzdol.«
explainer: 'Del kupcev, ki ob prazni polici vzame drug artikel ali se vrne pozneje — ta prodaja ni izgubljena. Pri osnovnem blagu z bližnjimi nadomestki je delež visok, pri modnih in specifičnih artiklih nizek. Če ne veste, izberite "Ne vem": računamo z varianto, ki izgubo prikaže najnižje.' (Izmišljena panožna odstotka 70–80 % in 20–30 % se ODSTRANITA brez nadomestila — v raziskavi ju ni.)
Zavedati se je treba, da 0,55 leži MED možnostjo 1 (0,5) in možnostjo 0 (0,7): kdor odgovori 'Približno polovica', dobi višjo izgubo kot kdor odgovori 'Ne vem'. To je namerno in skladno s pravilom »neodgovor nikoli ne sme dvigniti zneska«, a naj bo zapisano v komentarju, sicer bo videti kot napaka.
Testi: maloprodaja.test.ts:101-107 izrecno nastavi substitutionShare: 0, zato sprememba privzetka nanje ne vpliva.

*Preverba.* Popravljeni dve stvari: (1) ADDRESSABLE_SHARE.unknown = 0,30 ni najkonservativnejša vrednost v tabeli (external 0,25, physical 0,15), zato ta primerjava iz utemeljitve odpade — ostane primerjava z reducibleShareOf, ki drži. (2) Severity znižana z 'visoka' na 'srednja', ker napaka zahteva neničelni lostSalesSharePercent in zadene le koš lostMargin. Predlogu dodano opozorilo o nemonotonosti lestvice.

*Vir v raziskavi.* xlsx Predpostavke A06 (0,55 / 0,45 / 0,35), Financne_formule F01; raziskava §8.4, §16.3 ('Ne vem nikoli ni 0')

### PS-05 · izboljsaj · teža visoka · preverba: popravljeno

**expressDeliveryCostEUR — »Koliko ste v zadnjih 12 mesecih plačali za ekspresne dobave in nujne prevoze, da polica ne bi ostala prazna?« (maloprodaja.ts:121-129)**

*Utemeljitev.* Stanje v kodi drži dobesedno: polje ima kind 'number', unit 'EUR/leto', default 0 in allowUnknown: true, NIMA pa ne help ne explainer (:121-129). Znesek gre nespremenjen v koš directLoss (:175-180), torej v hero znesek (moduleTypes.ts:18). Nevarnost napačne osnove je realna in največja prav tu. NETOČNOST v utemeljitvi: register B27 se glasi »Ekspresne dobave zaradi zamude | letni strošek ekspresov« — 'letni strošek ekspresov', ne 'izrecno dodatni strošek'. Zahteva po zgolj pribitku torej ne izhaja dobesedno iz B27, ampak iz hišnega pravila, da normalno poslovanje ni strošek napake — isto pravilo je že zapisano v content/methodology.ts pri terjatve_trgovina (»Financiranje roka, ki ste ga kupcu sami odobrili, je normalno poslovanje in ne strošek napake«) in ga podpira raziskava §8.2 (»V nabavi ostanejo strošek procesa, razlike, rabati in ekspresne dobave«), ki ekspres obravnava kot dodatek nad rednim tokom. Predlog s tem ostane pravilen, utemeljitev pa mora biti drugačna. Umestitev res ne gre premikati: Bolecina_finance/Problem_podatki pripišeta ekspres modulu M03 (nabava), maloprodajni segment nabavnega področja nima (segments.ts), izpust pa bi postavko izgubil v celoti.

*Predlog.* help: 'Samo pribitek nad običajno dobavo — nujni prevoz, dodatek dobavitelja, dodatna vožnja med enotami. Vrednost blaga in redni prevoz ne štejeta (te bi plačali tudi sicer), ure prevzema pa šteje področje Prevzem.'
explainer: 'Kaj vas stane, ker ste morali blago dobiti hitreje kot običajno. Primer: 20 nujnih dobav na leto × 120 EUR pribitka ≈ 2.400 EUR. Če pribitka ne vodite ločeno, vzemite razliko med ceno nujnega in rednega prevoza. Če tega sploh ne spremljate, odkljukajte "Tega podatka ne vodimo" — nižja zanesljivost je boljša od izmišljene številke.'
Polje ima allowUnknown: true in kind 'number', zato je gumb 'Tega podatka ne vodimo' res na voljo (ModuleInput.tsx:93, :146-153) in sklic v explainerju drži. Dodajanje help zahteva tudi explainer (pravilo, ki ga varuje modules/explainers.test.ts) — predlog to izpolnjuje.

*Preverba.* Trditev »B27 meri IZRECNO dodatni strošek zaradi zamude« je preveč: B27 pravi 'letni strošek ekspresov'. Utemeljitev zamenjana s hišnim pravilom (normalno poslovanje ni strošek napake, kot že velja pri terjatve_trgovina) in §8.2. Predlog ostane, help dopolnjen s pojasnilom, ZAKAJ redni prevoz ne šteje.

*Vir v raziskavi.* xlsx Katalog_bolecin B27, Problem_podatki M03; raziskava §8.2 (»V nabavi ostanejo strošek procesa, razlike, rabati in ekspresne dobave«), §8.4

### PS-06 · ohrani · teža nizka · preverba: potrjeno

**stockCheckHoursPerMonth — »Koliko ur mesečno gre za preverjanje, ali je artikel na zalogi v drugi poslovalnici ali skladišču?« (maloprodaja.ts:130-141)**

*Utemeljitev.* Vse preverjeno. Polje ima help (:137) in explainer z izpeljavo iz dogodkov (:138-140, »3 zaposleni × 15 min na dan × 26 dni ≈ 20 ur«), merilo odgovorljivosti v 30 sekundah je torej izpolnjeno. Vrednotenje po operativni uri in ×12 na :184 drži, hoursPerMonth se sporoči na :185, enota 'h/mesec' pa polje res uvrsti v plauzibilnostno ovojnico (plausibility.ts:57-63, kjer se seštevata samo 'h/mesec' in 'h/leto'). Meja proti prevzemMp je zapisana obojestransko. Vsebinsko ustreza B09 ('Prazna polica ob zalogi drugje') in SP09 ('Dopolnjevanje police … prazna polica ob zalogi v skladišču'). Manjši popravek sklica: transferHoursPerMonth v prevzemMp je na :636-647 (help na :643), ne na :637-646.

*Preverba.* Popravljen le sklic: prevzemMp.transferHoursPerMonth je na maloprodaja.ts:636-647 (help :643), ne :637-646. Vsebina ugotovitve ostane nespremenjena.

*Vir v raziskavi.* xlsx Katalog_bolecin B09, Podprocesi SP09, Segment_bolecina S1/S2; raziskava §8.4

### PS-07 · ohrani · teža nizka · preverba: potrjeno

**replenishmentMethod (contextOnly) — »Kako danes določate, kaj in koliko naročiti?« (maloprodaja.ts:142-154)**

*Utemeljitev.* Preverjeno v celoti. Polje ima contextOnly: true (:147) in test maloprodaja.test.ts:346-350 res primerja scenarij z replenishmentMethod 0 proti 3 pri istem expressDeliveryCostEUR — dokaz, da ne premakne nobene številke. Prodajna vrednost je v kodi resnična na treh mestih: gre v tabelo odgovorov (salesReport.ts:407-413, s poljem contextOnly: true), je rezervna iztočnica, kadar je stranka izpolnila vse (salesPlaybook.ts:106-115), in ni všteta v zanesljivost (potential.ts:187 preskoči contextOnly) ne v isModuleAnswered (moduleEngine.ts:232) ne v collectFields (salesReport.ts:472). Prekrivanje s POLICE_CAUSES[0] je res nekodljivo: vzrok gre v addressableShareOf (:158), ta odgovor pa nikamor v izračun. Ustreza SP03 ('Predlog naročila … naročanje po občutku') in Q35.

*Vir v raziskavi.* xlsx Podprocesi SP03, Vprasalnik Q35; raziskava §8.2, §10

### PS-08 · ohrani · teža srednja · preverba: popravljeno

**mainCause (POLICE_CAUSES) — »Kaj je glavni vzrok?« s petimi možnostmi (maloprodaja.ts:54-60, 155)**

*Utemeljitev.* Deleži v kodi so preverjeni: ADDRESSABLE_SHARE data 0,75, planning 0,65, people 0,45, external 0,25, unknown 0,30 (addressableShare.ts:28-35), preslikava POLICE_CAUSES pa je točno takšna, kot trdi ugotovitev. A07 je v registru res 0,50 / 0,65 / 0,75, torej sta 'external' 0,25 in 'unknown' 0,30 pod konservativno mejo raziskave in smer napake je navzdol — dvigovati jih ni dovoljeno. DODATNO OPOZORILO, ki ga ugotovitev spregleda in ga je treba zapisati, da ga kdo ne 'popravi' v napačno smer: kategorija 'data' = 0,75 je POTENCIALNI (najbolj optimistični) konec A07, prevzemata pa jo dve od petih možnosti, ki sta med najpogosteje izbranima ('Stanje zalog v sistemu ni zanesljivo', 'Ne vidimo zaloge v drugih poslovalnicah'). Smer napake torej ni enotno navzdol: pri neodgovoru je konservativna, pri podatkovnem vzroku pa optimistična. Ker je to lastnost skupne tabele in ne tega področja, se v tem pregledu ne popravlja — se pa mora znajti v kalibracijskem komentarju (addressableShare.ts:11-13 že napoveduje preveritev po ~50 vnosih). Trditev o ločnici OSA/stockout (K07) je vsebinsko preohlapna: možnost 'Police ne dopolnjujemo dovolj hitro' (people) res opisuje OSA, možnost 'Ne vidimo zaloge v drugih poslovalnicah' pa je vprašanje VIDNOSTI, ne 'ni v hiši'.

*Predlog.* Brez spremembe deležev in besedil. Predlagam le eno vrstico v komentarju nad ADDRESSABLE_SHARE (addressableShare.ts:28): »Kalibracija ni simetrična: 'unknown' 0,30 leži pod konservativnim koncem A07 (0,50), 'data' 0,75 pa na potencialnem koncu. Pri neodgovoru je torej ocena konservativna, pri podatkovnem vzroku optimistična — to je prva stvar, ki jo je treba preveriti na realnih vnosih.«

*Preverba.* Verdikt 'ohrani' potrjen, utemeljitev pa dopolnjena z nasprotnim dokazom, ki ga ugotovitev ni omenila: 'data' 0,75 je potencialni in ne konservativni konec A07, zato smer napake ni enotno navzdol. Sklic na K07 zrahljan — možnost o vidnosti zaloge v drugih enotah ni ista stvar kot 'ni v hiši'. Dodan konkreten komentar za kodo.

*Vir v raziskavi.* xlsx Predpostavke A07 (0,50 / 0,65 / 0,75), Vprasalnik Q35, Katalog_bolecin B09/B27, KPI_slovar K06/K07; raziskava §8.4, §11.2

### PS-09 · ohrani · teža nizka · preverba: potrjeno

**pantheon iztočnice razpolozljivostMp — 'Samodejni predlogi naročil iz dejanske prodaje', 'Minimalne in maksimalne zaloge po poslovalnici', 'Zaloga vseh poslovalnic in skladišč na enem zaslonu' (maloprodaja.ts:190-194)**

*Utemeljitev.* Preverjeno: PM02 (Zaloga po lokacijah in prenosi) = visoka, PM05 (Nabavna/prodajna naročila) = visoka, PM12 (Demand sensing/AI forecast) = 'odvisno' in vir GAP-01. Nobena od treh alinej ne obljublja napovedovanja povpraševanja, kar je pri praznih policah najlažje spodrsniti. Poti do stranke sta res dve: Breakdown.tsx:57-62 (razčlenitev rezultata) in salesPlaybook.ts:129-139 (buildRecommendation vzame addresses iz področja z največjo postavko). Ena opomba, ki je ugotovitev nima: PM05 ima v stolpcu 'Kaj preveriti' zapisano »forecast, EDI, planiranje«, prva alineja pa obljublja 'samodejne predloge naročil iz dejanske prodaje'. To je min/max in točka ponovnega naročanja iz prodajne zgodovine (SP03) in ne forecast, zato obljuba zdrži — a je meja tanka in besedila ni pametno širiti proti 'napovedi'.

*Preverba.* Dodana opomba, da ima PM05 v stolpcu 'Kaj preveriti' zapisan tudi 'forecast' — prva alineja ostane znotraj obljube samo zato, ker govori o predlogih iz DEJANSKE prodaje (SP03), ne o napovedi. Besedila ni dovoljeno širiti proti napovedovanju.

*Vir v raziskavi.* xlsx PANTHEON_zemljevid PM02/PM05/PM12, Podprocesi SP03; raziskava §11.1, §11.2

### PS-10 · izboljsaj · teža nizka · preverba: popravljeno

**Triaža kanaliMp: »Kako pogosto spletna prodaja povzroči dodatno delo ali strošek — odpovedi, vračila, ročno usklajevanje?« z možnostjo 0 'Spletne prodaje nimamo ali je usklajena sproti' (maloprodaja.ts:717-726)**

*Utemeljitev.* Osnovna ugotovitev drži: možnost 0 (:721) res združi podjetje brez kanala in digitalno zrelo omnichannel podjetje, Q19 je v registru res 'Pogojno' z opombo »stockout v poslovalnici je ločen«, področje res ni med privzetimi tremi (segments.ts:178-181) in test maloprodaja.test.ts:261-267 res dokaže, da vsi privzetki dajo 0 EUR. showIf v ModuleDefinition res ne obstaja (grep po src/ ne vrne nobenega zadetka), resolveActiveModules (moduleEngine.ts:245-253) res pozna samo triažo. DVE NETOČNOSTI. (1) ICP: dimenzija 'Kompleksnost kanala' z utežjo 0,2 obstaja SAMO v xlsx ICP_scoring; implementirani scoreIcp (src/config/icp.ts) je nima — njegove dimenzije so Velikost podjetja, Priložnost v sedanjem sistemu, Izmerjena bolečina, Bližina odločevalcu, Nujnost zaradi rokov, Resnost vnosa in Dosegljivost, IcpSignals (icp.ts:21-50) pa businessType sploh ne prejme. Trditev o »0 do 20 točkah« torej v tej kodi ne drži; businessType pride le v qualification poročila (salesReport.ts:287) in v PDF/HTML (pdfSales.ts:131). (2) Zadnji stavek je pol napačen: področje, izbrano po pomoti in pustjeno prazno, se NE prikaže kot izmerjeno na strani z rezultati — unmeasuredModules v CalculatorFlow.tsx:297-302 uporablja isModuleAnswered in ga uvrsti med »Česa nismo izmerili«. Se pa res prikaže z 0 EUR v PRODAJNEM poročilu, ker salesReport.ts:326-329 preslika vse activeModules brez preverjanja, in ker triage[].measured (:323) uporablja activeIds.has() namesto isModuleAnswered. Ker je torej dejanska škoda omejena na prodajno poročilo, severity padem s 'srednja' na 'nizka'.

*Predlog.* Konkretno besedilo vseh štirih možnosti (prejšnji predlog je definiral samo 0 in 1, kar bi razvijalca pustilo pri ugibanju, kam z obstoječim 'Občasno'):
options: [
  { value: 0, label: 'Spletne prodaje nimamo' },
  { value: 1, label: 'Imamo splet, a je usklajen sproti — le občasno ročno delo' },
  { value: 2, label: 'Redno ročno usklajevanje, odpovedi ali vračila' },
  { value: 3, label: 'Vsak dan — usklajujemo ročno' },
]
Lestvica ostane štiristopenjska in monotona po bolečini (moduleTypes.ts:209-213 zahteva natanko štiri možnosti z vrednostmi 0–3).
NOVE ZMOŽNOSTI MOTORJA (showIf) NE uvajamo: za en sam modul ne odtehta razširitve resolveActiveModules, kanaliMp pa ni privzeto izbran in daje dokazljivo 0 EUR.
LOČENA, VEČJA UGOTOVITEV, ki presega to področje in jo velja obravnavati posebej: salesReport.ts:323 in :326-329 štejeta IZBRANO področje za izmerjeno, medtem ko ekran uporablja isModuleAnswered — prodajno poročilo zato pokaže prazna področja kot izmerjena z 0 EUR in jih hkrati izpusti iz prodajnih iztočnic.

*Preverba.* Ovržena trditev o ICP: dimenzija 'Kompleksnost kanala' v implementiranem src/config/icp.ts ne obstaja in businessType ne vstopa v IcpSignals, zato izbira možnosti 0 danes ne premakne nobene točke. Popravljena trditev o poročilu: na ekranu prazno področje ostane med »Česa nismo izmerili« (CalculatorFlow.tsx:297-302), z 0 EUR se prikaže samo v prodajnem poročilu (salesReport.ts:323, :326-329). Severity znižana na 'nizka'. Predlog za showIf umaknjen; predlog konkretiziran s štirimi dokončnimi oznakami.

*Vir v raziskavi.* xlsx Vprasalnik Q19 (Pogojno, »stockout v poslovalnici je ločen«), Segmenti S1/S4; raziskava §16.1, §16.2

### PS-11 · izboljsaj · teža srednja · preverba: potrjeno

**Podnaslov področja: »Odpovedana spletna naročila, dejanski strošek vračil ter ročno usklajevanje artiklov, cen in zalog med kanali.« (maloprodaja.ts:715-716) skupaj z metodologijo v content/methodology.ts:174-179**

*Utemeljitev.* Vse tri trditve preverjene in potrjene. (1) Podnaslov (:715-716) res našteje tri od štirih izidov — 'Ročna obdelava spletnih naročil' (:805-811) manjka, čeprav je v testnem scenariju z 40 h/mesec največja postavka področja. (2) content/methodology.ts:176 (formula za kanaliMp) se glasi »izgubljena marža odpovedanih spletnih naročil; (usklajevanje kanalov × administrativna ura + obdelava naročil × ura v poslovalnici) × 12« — stroška vračil res ni, čeprav gre v koš directLoss (:793-797) in torej v hero znesek; izpisana formula je zato manjša od vsote postavk, naštetih tik nad njo v Breakdown.tsx:41-51. (3) rationale na :178 res pravi »izgubljena prodaja na polici pa v področju Zaloge«, kar je napačno: meri jo razpolozljivostMp ('Prazne police'), zalogeMp pa meri nasprotni problem, in prav ta ločnica je razlog za šest in ne pet področij (komentar maloprodaja.ts:28-30). Pot do stranke je preverjena: MODULE_METHODOLOGY se izriše v Breakdown.tsx:64-66 in gre v salesReport.ts:416. DODATEK, ki ga ugotovitev ni opazila: ista zastarelost je tudi v sosednjem vnosu — content/methodology.ts:146 (zalogeMp) trdi »letno = odpisi in prisilna znižanja + izgubljena marža praznih polic«, čeprav zalogeMp izgubljene marže praznih polic sploh ne računa (compute na :280-314 vrne odpise, prisilna znižanja, strošek financiranja in sprostljiv kapital). Popraviti je treba oba vnosa hkrati, sicer ostane nasprotna napaka.

*Predlog.* maloprodaja.ts:715-716 summary: 'Odpovedana spletna naročila, dejanski strošek vračil ter ročno usklajevanje in obdelava naročil med kanali.'
content/methodology.ts kanaliMp.formula (:176): 'izgubljena marža odpovedanih spletnih naročil; št. vračil × neposredni strošek enega vračila × 12; (usklajevanje kanalov × administrativna ura + obdelava naročil × ura v poslovalnici) × 12'
content/methodology.ts kanaliMp.rationale (:178): '… vzdrževanje cenikov za poslovalnice ostane v področju Cene, izgubljena prodaja na polici pa v področju Prazne police — sicer bi bil isti evro štet dvakrat.'
HKRATI content/methodology.ts zalogeMp.formula (:146): 'letno = odpisi in prisilna znižanja + strošek financiranja presežne zaloge; enkratno = povprečna zaloga × ocenjen delež znižanja' (odstrani se 'izgubljena marža praznih polic', ki je zalogeMp compute() sploh ne vsebuje).

*Preverba.* Ugotovitev potrjena v celoti. Razširjena z najdbo, ki je bila spregledana: content/methodology.ts:146 (zalogeMp) vsebuje zrcalno napako — pripisuje si izgubljeno maržo praznih polic, ki je ne računa. Popravek obeh vnosov je ena poteza.

*Vir v raziskavi.* xlsx Financne_formule F06, Bolecina_finance/Problem_podatki M08; raziskava §8.9, §18

### PS-12 · izboljsaj · teža srednja · preverba: potrjeno

**cancelledOrderSalesEUR — »Kolikšna je letna prodajna vrednost spletnih naročil, ki jih odpoveste ali ne morete dobaviti?« (maloprodaja.ts:728-740)**

*Utemeljitev.* Vse preverjeno in drži. Polje res sprašuje prodajno vrednost, maržo doda kontekst (:786), allowUnknown je true (:735), help postavlja mejo proti poslovalnici (:736), explainer ima izpeljavo iz dogodkov (:737-739). Koša sta pravilna in ločena: obe nezasluženi marži (:166 in :784) gresta v lostMargin z različnima oznakama, strošek vračil (:793) pa v directLoss. Asimetrija je resnično utemeljena v registru — Katalog_bolecin B18 se glasi »Odpovedano spletno naročilo zaradi zaloge | odpovedi x prispevna marža«, torej BREZ faktorja substitucije, medtem ko ima F01 »× (1 − nadomestni/odloženi nakup)«. Razlika je torej registrska, ne improvizacija — a nikjer ni pojasnjena obiskovalcu, ki obe področji izpolnjuje zaporedoma, in prav to je vrzel, ki jo ugotovitev pravilno zapre.

*Predlog.* help: 'Vrednost naročil, ne marže — maržo izračunamo sami. Izgubljeno prodajo v poslovalnici šteje področje Prazne police. Pri spletni odpovedi nadomestnega nakupa ne odštevamo: kupec se je za nakup že odločil in naročilo je bilo sprejeto.'
Explainer ostane nespremenjen (:737-739) — pravilo help ⇒ explainer je s tem še vedno izpolnjeno.

*Vir v raziskavi.* xlsx Katalog_bolecin B18 (»odpovedi x prispevna marža«, brez substitucije), Financne_formule F01, Problem_podatki M08; raziskava §8.9, §18

### PS-13 · izboljsaj · teža visoka · preverba: popravljeno

**returnsPerMonth — »Koliko spletnih naročil vam kupci mesečno vrnejo?« (maloprodaja.ts:741-747)**

*Utemeljitev.* Jedro drži: polje (:741-747) res nima ne help ne explainer, je prvi člen F06 in ga takoj množi costPerReturnEUR (:795) v košu directLoss, torej v hero znesku. Odsotnost allowUnknown je res utemeljena z moduleTypes.ts:160-167 (»pri urah in številu blagajn je 'ne vem' izgovor, pri vrednosti zadnje inventure pa dejstvo«). Enostranskost meje proti servisHz je potrjena: horizontal.ts:494 res pravi »Štejte samo garancijske in servisne primere, ne urejanja običajnih vračil in dobropisov«, nasprotne smeri pa ni nikjer; §18 zahteva obe (»običajno spletno vračilo → spletna prodaja in vračila«, »garancijsko popravilo/reklamacija → servis«), Problem_podatki M12 pa doda »običajna vračila M08«. Benchmark je potrjen: Trzni_benchmarki M11 = 0,193, izvor NRF, ZDA, z izrecno opombo »Uporabi samo kot sanity check; ne kot slovensko privzeto vrednost«. NETOČNOST: to NI edino polje področja brez pomožnega besedila — orderProcessingHoursPerMonth (:770-776) ga prav tako nima, kar ista serija ugotovitev sama obravnava ločeno.

*Predlog.* help: 'Samo spletna vračila — običajen odstop od pogodbe. Garancijskih reklamacij in servisnih primerov sem ne štejte: te šteje področje Reklamacije in poprodajni servis. Vračil v poslovalnici tu ne merimo.'
explainer: 'Število vračil na mesec iz evidence spletne trgovine. Če vodite le delež, ga preračunajte: 400 naročil × 8 % ≈ 32 vračil na mesec. Ameriški podatek o 19 % spletnih vračil je opozorilo, da je vredno izmeriti svoje stanje, ne pa slovenska privzeta vrednost.'
allowUnknown se NE doda — število vračil je odčitek iz evidence spletne trgovine in ne knjigovodska postavka (moduleTypes.ts:160-167).

*Preverba.* Popravljena trditev »edino polje področja brez pomožnega besedila«: brez help in explainer sta DVE polji — returnsPerMonth (:741-747) in orderProcessingHoursPerMonth (:770-776). Ostalo potrjeno, predlog nespremenjen.

*Vir v raziskavi.* xlsx Financne_formule F06, KPI_slovar K12, Katalog_bolecin B21/B29, Podprocesi SP17, Problem_podatki M12 ('običajna vračila M08'), Trzni_benchmarki M11 (NRF, ZDA); raziskava §8.9, §18

### PS-14 · izboljsaj · teža srednja · preverba: potrjeno

**costPerReturnEUR — »Koliko vas v povprečju stane eno vračilo?« (maloprodaja.ts:748-758)**

*Utemeljitev.* Preverjeno: help (:754) res izloči vrnjeno kupnino, explainer (:755-757) sešteje 4 + 5 + 3 EUR, kar se ujema s F06 (»št. vračil x (delo + povratna logistika + nevrnjene pristojbine + odpis/markdown) + prevare«) in K15 (»kupnina ni samodejni strošek«). Raziskava §8.9 to imenuje »Največja napaka modela«. Luknja navznoter je resnična in ni pokrita nikjer: delo je del cene enega vračila (:754), iste ure pa sme obiskovalec vpisati še v orderProcessingHoursPerMonth (:770-776) — enkrat v directLoss (:793-797), enkrat v capacity (:805-811). Plauzibilnostna ovojnica tega res ne ujame, ker assessHoursPlausibility sešteva izključno polja z unit 'h/mesec' ali 'h/leto' (plausibility.ts:57-63), zmnožek dveh številčnih polj pa ni urno polje. F06 res pozna chargebacke in prevare, ki jih besedilo ne našteje.

*Predlog.* help: 'Delo, povratna dostava, nevrnjene provizije in znižanje vrnjenega artikla; če jih imate, tudi chargebacki. BREZ vrnjene kupnine — artikel se večinoma proda znova, zato kupnina sama po sebi ni strošek.'
Stavka o dvojnem štetju ur tu NE dodajamo: help bi narastel na pet zahtev, meja pa je učinkoviteje postavljena na drugi strani, kjer se ure dejansko vpisujejo — v help polja orderProcessingHoursPerMonth (glej naslednjo postavko), ki že vsebuje 'Ne vključujte dela z vračili (zajeto je v strošku enega vračila)'. Ena meja, enkrat zapisana na mestu vnosa, je bolj berljiva od iste meje na obeh straneh.

*Preverba.* Ugotovitev potrjena, predlog skrajšan: stavek o dvojnem štetju ur se iz tega help umakne in ostane samo v orderProcessingHoursPerMonth, kjer se ure dejansko vnašajo. Sicer bi bila ista meja zapisana dvakrat, ta help pa bi imel pet ločenih zahtev.

*Vir v raziskavi.* xlsx Financne_formule F06, KPI_slovar K15, Podprocesi SP17, Katalog_bolecin B21/B29; raziskava §8.9

### PS-15 · ohrani · teža nizka · preverba: potrjeno

**catalogSyncHoursPerMonth — »Koliko ur mesečno porabite za ročno usklajevanje artiklov, opisov, cen in zalog med kanali?« (maloprodaja.ts:759-769)**

*Utemeljitev.* Vse preverjeno. Help (:765) res postavi mejo proti marzeMp.priceMaintenanceHoursPerMonth (:390-399, ki ima zrcalno mejo proti Prevzemu na :395), test to razmejitev res varuje (maloprodaja.test.ts, primerjava 45 h v 'Vzdrževanje cenikov, akcij in oznak' proti 18 h v 'Usklajevanje artiklov, cen in zalog med kanali'). Vrednotenje po adminHourCostEUR (:801) ustreza delu s katalogom in cenami, izid gre v koš capacity in ne v denar — sproščena ura torej ne zniža plačne mase, kot zahteva raziskava. Explainer ima izpeljavo (:766-768), enota 'h/mesec' polje uvrsti v plauzibilnostno ovojnico (plausibility.ts:61).

*Vir v raziskavi.* xlsx Katalog_bolecin B02, Segment_bolecina S4, Problem_podatki M08; raziskava §5.2, §8.1, §18

### PS-16 · izboljsaj · teža visoka · preverba: potrjeno

**orderProcessingHoursPerMonth — »Koliko skupnih ur mesečno porabite za ročno obdelavo spletnih naročil, pripravo in odpremne dokumente?« (maloprodaja.ts:770-776)**

*Utemeljitev.* Preverjeno in potrjeno. Polje res nima ne help ne explainer (:770-776), čeprav v enem vprašanju združuje tri aktivnosti, register pa izpeljavo predpisuje (Katalog_bolecin B19: »Ročni prenos spletnih naročil | naročila x minute«, K16 'Ročni delež naročil', SP16 'Picking/packing'). Obe meji res manjkata: navznoter proti delu z vračili, ki je že monetizirano v costPerReturnEUR (:754), in navzven proti prevzemMp.goodsReceiptHoursPerMonth (:618-624, ki sam nima help) ter razpolozljivostMp.stockCheckHoursPerMonth (:130-141). Vrednotenje po operativni uri (:808) je pravilno, ker pripravo pošiljke opravi človek v poslovalnici ali skladišču. Da je to največje urno polje področja, potrjuje testni scenarij (40 h/mesec proti 18 h/mesec pri usklajevanju). Raziskava §18 poleg tega predpisuje, da se pri VSEH časovnih vprašanjih prikaže opomba »Ne vključujte ur, ki ste jih že vnesli pri drugem področju« — to polje je nima.

*Predlog.* help: 'Samo delo s spletnimi naročili: vnos ali prenos naročila, priprava pošiljke, odpremni dokument. Ne vključujte ur, ki ste jih vpisali drugje: dela z vračili (zajeto je v strošku enega vračila), prevzema dobav (področje Prevzem) in preverjanja zaloge po enotah (področje Prazne police).'
explainer: 'Ocenite iz obsega: število spletnih naročil na mesec × minute na naročilo ÷ 60. Primer: 300 naročil × 12 minut ≈ 60 ur na mesec. Če naročila iz spletne trgovine v sistem prepisujete ročno, štejte tudi ta prepis.'

*Preverba.* Predlog help preoblikovan tako, da se začne z zahtevano formulacijo iz §18 (»Ne vključujte ur, ki ste jih vpisali drugje«), s čimer tri meje pridejo v en berljiv stavek namesto treh naštevanj.

*Vir v raziskavi.* xlsx Katalog_bolecin B19, KPI_slovar K16, Podprocesi SP16, Problem_podatki M08; raziskava §8.9, §18 (obvezna opomba pri časovnih vprašanjih)

### PS-17 · izboljsaj · teža srednja · preverba: popravljeno

**mainCause (KANALI_CAUSES) — »Kaj je glavni vzrok?« s petimi možnostmi (maloprodaja.ts:703-709, 777)**

*Utemeljitev.* Preverjeno: 'Zaloga za splet ni sproti vidna' je res 'planning' (0,65), medtem ko je 'Ne vidimo zaloge v drugih poslovalnicah ali skladišču' (:57) 'data' (0,75); asimetrija je utemeljena s PM07 (Spletna trgovina = srednja, »konkreten konektor, OMS/WMS, lastnik integracije«) in I02 (»obvezno preveriti«). Vrzel drži: nobena od petih možnosti ne opisuje vračil, čeprav področje meri njihov strošek (:793-797) — trgovec, čigar glavna bolečina so vračila (B21, B29, S4), mora izbrati vzrok o katalogu ali zalogi, naslovljivi delež stroška vračil pa je izpeljan iz nečesa drugega. mainCauseField res sestavi eno samo polje (:777, addressableShare.ts:56-69), zato kanaliMp ostane pri 6 poljih in meja 5–7 iz maloprodaja.test.ts:304-311 ne pride v poštev; vrednosti so avtomatsko zaporedni indeksi. NAPAČNA JE PREDLAGANA KATEGORIJA: ugotovitev predlaga 'data' (0,75), kar je v neposrednem nasprotju z njenim lastnim argumentom v isti utemeljitvi — ročno obravnavana vračila zahtevajo prav tisto integracijo (I02, SP17), zaradi katere je spletna vidnost zaloge dobila 0,65 in ne 0,75, Bolecina_resitev M08 pa vračila izrecno uvršča med 'srednjo' pokritost z opozorilom »integracija ni avtomatsko osnovna licenca«. Dodatno je treba poznati strošek, ki ga ugotovitev ne omeni: šesta možnost premakne indeks 'Ne vemo' s 5 na 6, kar spremeni pomen že izvoženih vrednosti mainCause v stolpcu moduleInputsJson (exportRecord.ts:164) za to področje.

*Predlog.* KANALI_CAUSES dopolniti s šesto možnostjo pred samodejno dodanim 'Ne vemo':
{ label: 'Vračila obravnavamo ročno, brez enotnega postopka', category: 'planning' }
(kategorija 'planning' = 0,65, NE 'data' = 0,75 — iz istega razloga kot pri 'Zaloga za splet ni sproti vidna': rešitev zahteva konektor in lastnika integracije, kar je po PM07/I02/M08 srednja pokritost).
V komentar nad KANALI_CAUSES dodati: »Spletna vidnost zaloge in ročna vračila sta 'planning' in ne 'data', čeprav sta v poslovalnici enaka problema 'data': spletna stran zahteva konektor, OMS in lastnika integracije (PM07, I02, Bolecina_resitev M08 = srednja pokritost), zato je naslovljivi delež nižji. Asimetrija z razpolozljivostMp je namerna.«
Pred izvedbo preveriti: premik indeksa 'Ne vemo' s 5 na 6 spremeni pomen že shranjenih vrednosti mainCause za kanaliMp v moduleInputsJson (exportRecord.ts:146-199). Če so izvozi že v obtoku, je treba to zabeležiti ob spremembi.

*Preverba.* Predlagana kategorija popravljena z 'data' (0,75) na 'planning' (0,65): 0,75 bi bil v nasprotju z argumentom iste ugotovitve, da spletna vidnost zaloge zaradi konektorja ne sme dobiti 0,75. Dodan spregledan strošek: šesta možnost premakne indeks 'Ne vemo' s 5 na 6 in s tem pomen že izvoženih vrednosti v moduleInputsJson.

*Vir v raziskavi.* xlsx Katalog_bolecin B21/B29, PANTHEON_zemljevid PM07, Integracije I02, Podprocesi SP17, Bolecina_resitev M08 ('srednja', »integracija ni avtomatsko osnovna licenca«), Predpostavke A07; raziskava §11.1, §11.2

### PS-18 · izboljsaj · teža srednja · preverba: potrjeno

**pantheon iztočnice kanaliMp — 'Enotna baza artiklov in cenikov za vse prodajne kanale', 'Sprotna zaloga, vidna spletni trgovini', 'Samodejen prenos spletnih naročil v odpremo, račun in vračilo' (maloprodaja.ts:814-818)**

*Utemeljitev.* Najmočneje podprta ugotovitev v seriji. Raziskava §8.9 ima to zapisano skoraj dobesedno kot pravilo: Datalab pri ePoslovanju izrecno navaja partnerje za spletne tehnologije, »zato v ROI-ju spletne integracije ne smemo vključiti v osnovno licenco brez konkretne ponudbe«. Register to potrdi trikrat: PM07 (Spletna trgovina) = srednja, »konkreten konektor, OMS/WMS, lastnik integracije«; I02 = »obvezno preveriti«, s stolpcem »sistem resnice, konektor, retry«; Bolecina_resitev M08 = srednja, meja obljube »integracija ni avtomatsko osnovna licenca«. Prva alineja je PM03 (Ceniki, akcije in popusti = visoka) in res ostane nespremenjena. Poti do stranke sta preverjeni: Breakdown.tsx:57-62 in salesPlaybook.ts:129-139 (buildRecommendation vzame addresses iz področja z največjo postavko, torej pogosto prav od tod). Argument, da je to zaščita zneska in ne omilitev prodaje, drži: obljuba, ki pade na prvem tehničnem sestanku, razvrednoti tudi dokazljivi del izračuna.

*Predlog.* pantheon: [
  'Enotna baza artiklov in cenikov za vse prodajne kanale',
  'Zaloga in cene, ki jih spletna trgovina prevzame prek povezave (konektor po dogovoru)',
  'Spletno naročilo, odprema, račun in dobropis v enem toku — obseg povezave se potrdi v ponudbi',
]
Dolžina je sprejemljiva: Breakdown.tsx:57-61 alineje združi z ' · ' v en odstavek, prodajna priprava pa jih izpiše kot seznam.

*Vir v raziskavi.* xlsx PANTHEON_zemljevid PM03 (visoka) / PM07 (srednja), Integracije I02, Bolecina_resitev M08; raziskava §8.9 (izrecno pravilo), §11.1, §11.2

### PS-19 · dodaj · teža nizka · preverba: popravljeno

**NOVO polje v kanaliMp: »Koliko spletnih naročil imate na mesec?« (contextOnly, izbira razpona)**

*Utemeljitev.* Predlog prestane vse štiri preizkuse. Ne podvaja modula: nobeno polje maloprodaje ne meri obsega spletnega kanala, blagajnaMp pa je svoj imenovalec res dobil (tillCount in openDaysPerWeek, :487-516). Odgovorljiv iz glave v 30 s, ker gre za razpon — Vprasalnik Q06 je res označen kot obvezen z navodilom »izberi razpon«, §16.3 pa 'izbran razpon' šteje med veljavne statuse odgovora. Shema je spoštovana: kind 'choice' z zaporednimi indeksi (FieldChoice v moduleTypes.ts), help IN explainer, brez showIf. Shemsko je varno tudi navznoter: contextOnly polja preskočijo isModuleAnswered (moduleEngine.ts:232), assessConfidence (potential.ts:187 — torej 'Tega ne spremljamo' ne zniža zanesljivosti), collectFields (salesReport.ts:472) in assessHoursPlausibility (plausibility.ts:58). Field count 6 → 7 ostane znotraj meje iz maloprodaja.test.ts:304-311. Trditev, da kanaliMp kot edini stroškovni modul maloprodaje nima contextOnly polja, potrjuje komentar v testu (:356-357). SEVERITY ZNIŽANA na 'nizko' in prioriteta postavljena na zadnje mesto: dve od treh naštetih koristi danes nista uresničljivi — samodejno opozorilo 'vračil je več kot naročil' bi zahtevalo razširitev plausibility.ts (kar predlog sam izvzame), ICP dimenzije 'Kompleksnost kanala' pa implementirani scoreIcp sploh nima (src/config/icp.ts, IcpSignals :21-50). Ostane resnična, a skromna korist: imenovalec za pogovor v prodajni pripravi in vzporedje s preostalimi petimi področji.

*Predlog.* Predlog polja se ohrani, kot je zapisan (key 'onlineOrdersPerMonth', kind 'choice', default 4, contextOnly: true, pet možnosti z zaporednimi indeksi in unknown: true na zadnji), z dvema pogojema:
1. Izvede se ŠELE po ugotovitvah, ki premikajo zneske (returnsPerMonth, orderProcessingHoursPerMonth, expressDeliveryCostEUR, lostSalesSharePercent, pantheon kanaliMp) — po tem polju kanaliMp doseže 7 polj in prostora za nadaljnja vprašanja ni več brez dviga meje v maloprodaja.test.ts:304-311.
2. Če se izvede tudi popravek triaže kanaliMp, se morata možnosti ujemati: triažna možnost 0 'Spletne prodaje nimamo' in izbira 0 'Spletne prodaje nimamo' morata biti dobesedno enaki, sicer bosta izgledali kot dve različni vprašanji o istem.
Test: v maloprodaja.test.ts:325-363 dodati scenarij za kanaliMp (base: { returnsPerMonth: 120, costPerReturnEUR: 9, onlineOrdersPerMonth: 1 } proti twist z onlineOrdersPerMonth: 3) in odstraniti komentar na :356-357, ki pojasnjuje, zakaj kanaliMp scenarija nima.
exportRecord.ts res ne potrebuje novega stolpca (vnosi po modulih gredo v moduleInputsJson, exportRecord.ts:164). content/methodology.ts in akcijski načrt se ne spreminjata, ker sta vezana na modul in ne na polje.

*Preverba.* Verdikt 'dodaj' potrjen, severity znižana s 'srednja' na 'nizka': od treh navedenih koristi sta dve danes neuresničljivi — plauzibilnostno opozorilo zahteva razširitev plausibility.ts (predlog to sam izvzame), dimenzije 'Kompleksnost kanala' pa implementirani scoreIcp (src/config/icp.ts) nima, saj IcpSignals ne prejme ne businessType ne obsega kanala. Dodana sta pogoja izvedbe (zadnja prioriteta, uskladitev besedila s triažo) in konkreten testni scenarij.

*Vir v raziskavi.* xlsx Vprasalnik Q06 (obvezno, »izberi razpon«) in Q08, KPI_slovar K12/K16, Trzni_benchmarki M11; raziskava §9 (KPI disciplina), §16.1, §16.3 ('izbran razpon' kot status odgovora)


---

## ZM · zalogeMp + marzeMp

### ZM-01 · ohrani · teža nizka · preverba: potrjeno

**zalogeMp.triage.prompt — "Koliko blaga vam obleži — poteče, se poškoduje ali ga morate prodati z znižanjem?"**

*Utemeljitev.* Preverjeno v kodi: prompt je na maloprodaja.ts:213, možnosti 214-219, možnost 3 "Veliko — obsega pa ne merimo" je na :218. Manka res ne omenja, blagajnaMp.shrinkageEUR pa ga meri (maloprodaja.ts:518-524) — meja drži. salesPlaybook.ts:83 res filtrira `!item.measured && item.score >= 2` in iz tega sestavi prvo iztočnico, tako da visoka ocena neizmerjenega področja pride v poročilo. Ena pretiranost v prvotni utemeljitvi: vprašanje NI "natanko Q13" — Q13 (registri, vrstica 341) sprašuje po POGOSTOSTI ("Kako pogosto nastanejo odpisi..."), koda pa po OBSEGU ("Koliko blaga vam obleži"), lestvica pa meša oboje ("Skoraj nič / Občasno / Redno / Veliko"). Za triažo, ki samo rangira bolečino, je to sprejemljivo in ne opravičuje posega.

*Preverba.* Sklici na vrstice potrjeni (213-219). Popravljena trditev "pokriva natanko Q13": pokriva Q13 vsebinsko, ne pa dobesedno — Q13 je frekvenčna lestvica, koda obsegovna. Sklic na blagajnaMp popravljen z :519 na :518-524.

*Vir v raziskavi.* Q13 (registri v.341); §8.5 (v.268: potek roka, poškodbe, starajoča se zaloga, sezonski ostanek, prisilni popust, neznani manko); B10, B17

### ZM-02 · izboljsaj · teža nizka · preverba: popravljeno

**zalogeMp.summary — "Odpisano in poteklo blago, marža, izgubljena s prisilnimi znižanji, ter kapital, vezan v zalogah."**

*Utemeljitev.* Potrjeno: summary je na maloprodaja.ts:210-211 in našteje tri od štirih izidov compute() — letni strošek financiranja (maloprodaja.ts:301-305) manjka. Sklica popravljena: povzetek se izriše v ModuleSection.tsx:25-27 (ne :24 — tam je naslov modula) in v prodajno poročilo gre prek salesReport.ts:398 (ne :397). Trditev, da je ta postavka "edina brez uporabnikovega evra", drži: releasableEUR × capitalCostRate je zmnožek dveh ocen (delež znižanja in strošek kapitala).

*Predlog.* summary v maloprodaja.ts:210-211 zamenjaj z: 'Odpisano in poteklo blago, marža, izgubljena s prisilnimi znižanji, ter denar, vezan v zalogah — sprostljivi kapital in letni strošek njegovega financiranja.' Če se hkrati izvede preimenovanje postavke iz ugotovitve o košu ("Letna cena denarja, vezanega v presežni zalogi"), uskladi tudi tu isto besedno zvezo, da povzetek in razčlenitev uporabljata isti izraz.

*Preverba.* Popravljena sklica: ModuleSection.tsx:25-27 (ne :24), salesReport.ts:398 (ne :397). Predlogu dodana zahteva po uskladitvi z morebitnim preimenovanjem postavke, da ne nastaneta dve različni imeni za isto stvar.

*Vir v raziskavi.* F02 in F03 (registri v.554-555); §5.2; §17.1 (formula loči "prihranek financiranja" od "neposredne izgube")

### ZM-03 · ohrani · teža nizka · preverba: potrjeno

**zalogeMp.annualWriteOffEUR — "Kolikšna je bila v zadnjih 12 mesecih vrednost odpisov ter poteklega in poškodovanega blaga?"**

*Utemeljitev.* Vse preverjeno dobesedno. Polje maloprodaja.ts:222-234: unit 'EUR/leto', allowUnknown: true, help na :230 pošlje neznano razliko v Blagajno, explainer na :231-233. Nasprotna smer je res zapisana: blagajnaMp.shrinkageEUR help na maloprodaja.ts:524 vrača znano odpisano blago sem. compute (maloprodaja.ts:286-289) vrednosti ne množi z 12. Dvosmernost je v maloprodajnem vprašalniku res edinstvena — druge meje (kanaliMp:765 → Cene, priceMaintenance:395 → Prevzem) so enosmerne. Registri, v.556: "Odpisi/markdown | potrjen odpis ali izgubljena marža | neposredna izguba | ne mešaj z mankom" — koda to spoštuje.

*Preverba.* Brez popravkov — vsi sklici (222-234, 230, 524, 286-289) preverjeni in točni.

*Vir v raziskavi.* B10, B17; Bolecina_finance M02 (registri v.554-556); §8.5; §18

### ZM-04 · izboljsaj · teža visoka · preverba: popravljeno

**zalogeMp.forcedMarkdownMarginEUR — "Koliko marže ste v zadnjih 12 mesecih izgubili s prisilnimi znižanji — razprodajo sezone, odprodajo pred rokom?"**

*Utemeljitev.* Potrjeno: help je na maloprodaja.ts:243 in že vsebuje "Načrtovane sezonske razprodaje sem ne sodijo", NE vsebuje pa meje proti marzeMp. Nasprotni help (wrongPriceSalesSharePercent) je na :357 in prav tako ne imenuje presežne zaloge. Oba izida gresta v isti koš lostMargin (:292 in :430) — potrjeno, torej se v poročilu dvojno štetje res ne pokaže kot razhajanje vsote. Koš je vsebinsko odstop od raziskave (registri v.556 markdown uvršča med "neposredno izgubo", koda ga da v lostMargin) — a odstop je v dokazno šibkejšo smer in ga ni treba spreminjati. Primer v predlogu preverjen: 2.000.000 × 0,08 × 0,12 = 19.200 EUR.

*Predlog.* help na maloprodaja.ts:243 razširi na: 'Samo razlika do marže, ki ste jo načrtovali, ne celoten popust. Načrtovane sezonske razprodaje sem ne sodijo — te bi bile tudi z boljšim sistemom. Znižanje zaradi napake v ceniku ali pozabljene akcije prav tako ne — to meri področje Cene, akcije in marža.' explainer na :244-247 dopolni z izpeljavo prek K11: 'Če zneska ne vodite: vzemite delež letne prodaje, ki je stekel z NENAČRTOVANIM znižanjem, in ga pomnožite z razliko med redno in doseženo maržo v odstotnih točkah. Primer: 8 % od 2 mio EUR × 12 odstotnih točk ≈ 19.200 EUR.' Hkrati v marzeMp.wrongPriceSalesSharePercent (:357) dodaj obratno mejo — glej ustrezno ugotovitev. Test explainers.test.ts:29-32 zahteva explainer povsod, kjer je help; oba ostajata, zato posega v test ni.

*Preverba.* V izpeljavo iz K11 vrinjena beseda NENAČRTOVANIM: prvotni predlog je vabil, da se v znesek vključijo tudi načrtovane sezonske razprodaje, kar bi izničilo omejitev iz istega helpa in kršilo §8.5 (odšteti učinek, ki bi nastal tudi brez spremembe sistema). Dodana zahteva po obojestranski meji (popravek mora hkrati v :357), sicer meja spet ostane enosmerna.

*Vir v raziskavi.* K11 (registri v.239, v.531); §8.5 formula za markdown (raziskava v.272: odšteti učinek, ki bi nastal tudi brez sistema); Bolecina_finance M02/M04; §18

### ZM-05 · ohrani · teža nizka · preverba: potrjeno

**zalogeMp.inventoryValueEUR — "Kolikšna je povprečna vrednost zalog v vseh poslovalnicah in skladišču?"**

*Utemeljitev.* Preverjeno: polje maloprodaja.ts:249-260, unit 'EUR' (ne EUR/leto), help :256 zahteva nabavno vrednost, explainer :257-259 to ponovi in doda vir (bilanca ali povprečje mesečnih stanj). compute (:282) je ne množi z 12. Ustreza Q26/A04 tipu CAPITAL_BASE (registri v.577: "povprečna zaloga po nabavni vrednosti"). Poskus ovržbe ni uspel: edina možna pripomba je, da allowUnknown pri osnovi kapitala pomeni, da "Ne vem" da 0 EUR sprostljivega kapitala (moduleEngine.ts:109-115), a to je pravilna smer napake in ne razlog za poseg.

*Preverba.* Sklic :282 potrjen; dodan natančen razpon polja (249-260) namesto samega compute.

*Vir v raziskavi.* A04, A18; Problem_podatki M02 (registri v.577); Bolecina_finance M02 (v.554)

### ZM-06 · izboljsaj · teža visoka · preverba: popravljeno

**zalogeMp.reducibleShare — "Kolikšen delež zalog bi po vaši oceni lahko zmanjšali, ne da bi se police spraznile?" (skupno polje, shared.ts:73-94)**

*Utemeljitev.* Vse številke potrjene dobesedno: REDUCIBLE_SHARES = [0.05, 0.08, 0.15, 0.22, 0.05] na shared.ts:59, polje na :73-94, reducibleShareOf na :97-98. A18 v registrih (v.40) res daje 0.04 / 0.07 / 0.10 — torej je zgornji pas 0,22 2,2-krat nad NAJVIŠJIM scenarijem raziskave, pasova 2 in 3 pa ga oba presegata. potential.ts:38-51 res izloči oneTimeCapital iz potenciala, zato gre samoocena neposredno v prikazani znesek. Nedoslednost pravila potrjena: "Do 5 %" uporablja zgornjo mejo (0,05 namesto sredine 0,025), "6–10 %" in "11–20 %" pa sredino. Aritmetika predloga preverjena: 2 mio × 0,22 = 440.000 EUR, × 6 % = 26.400 EUR/leto.

*Predlog.* V shared.ts:59 zamenjaj tabelo z: `const REDUCIBLE_SHARES = [0.03, 0.08, 0.15, 0.20, 0.03];` — zaprti pasovi na sredino, odprti pas "Več kot 20 %" na spodnjo mejo, "Ne vem" ostane enak najnižjemu pasu (invarianta, ki jo preverjajo obstoječi testi). V komentar nad tabelo (:56-58) dodaj: sklic na A18 (0,04 / 0,07 / 0,10) in izrecno opozorilo, da pasova 2 in 3 tudi po popravku presegata najvišji scenarij modela, ker sta samoocena podjetja in ne predpostavka modela — ter da je to prva postavka za kalibracijo po ~50 vnosih. Dodaj test, ki trdi `reducibleShareOf(4) === reducibleShareOf(0)` in `reducibleShareOf(3) <= 0.20`.

*Preverba.* Dve napaki v obsegu. (1) Ni pet dejavnosti, ampak ŠEST modulov v šestih segmentih: proizvodnja.ts:275, logistika.ts:333, trgovina.ts:356, storitve.ts:501, splosno.ts:493, maloprodaja.ts:261 — sprememba je za vse. (2) V storitve.ts:541 isti delež množi unbilledWipEUR (nedokončano delo), ne zaloge blaga; A18 je maloprodajna predpostavka, zato je treba v komentar zapisati, da za storitve številka ni empirično podprta in jo je treba kalibrirati posebej. Preverjeno, da popravek ne podre testov: proizvodnja.test.ts:101/125-126, logistika.test.ts:121/142-143, trgovina.test.ts:129/154-155, storitve.test.ts:169/198-199, splosno.test.ts:163/183-184, maloprodaja.test.ts:53/86-87 preverjajo le indekse 0, 2 in 4 — indeks 2 ostaja 0,15, indeksa 0 in 4 ostaneta enaka drug drugemu, indeks 3 ni pokrit z nobenim testom (od tod zahteva po novem testu).

*Vir v raziskavi.* A18 (registri v.40); F02 (v.554: "ne šteje se kot letni prihranek"); H10; Kontrole "Sproščen kapital je ločen od letne koristi"

### ZM-07 · izboljsaj · teža srednja · preverba: popravljeno

**zalogeMp.staleStockShare — "Kolikšen del zaloge se v zadnjih šestih mesecih ni prodal?" (contextOnly)**

*Utemeljitev.* Dejstva držijo: polje maloprodaja.ts:265-277, contextOnly, v compute (:280-313) se res ne pojavi, možnost 3 "Tega ne vemo" res nima `unknown: true`. Poti v poročilo potrjeni: salesReport.ts:407-413 izpiše vse odgovore, salesPlaybook.ts:106-115 kontekstna polja uporabi šele, ko ni druge iztočnice. TRDITEV O ODSTRANITVI PA NE PREŽIVI PREVERBE. Prvič, hipotetični argument ("če bi polje izgubilo contextOnly") je nepotreben — potential.ts:192 contextOnly polja preskoči, tako da danes ne vpliva na zanesljivost v NOBENEM primeru. Drugič, obstaja pa PRAVA in danes živa napaka, ki je ugotovitev ni našla: answerLabels.ts:148-151 vrne 'privzeto' namesto '„Ne vem"', ker manjka `unknown: true` — prodajno poročilo torej izrecno priznano neznanje o staranju zaloge prikaže kot nedotaknjen privzetek. Tretjič, odstranitev je odvisna od druge ugotovitve (agedStockValueEUR), ki po lastnem priznanju zahteva spremembo motorja; če ta ne bo izvedena, bi odstranitev pustila modul brez KAKRŠNEGA KOLI signala o staranju zaloge, kar §8.5 izrecno zahteva kot eno od šestih ločenih postavk.

*Predlog.* Takoj (neodvisno od vsega ostalega): v maloprodaja.ts:275 dodaj `unknown: true` na možnost 'Tega ne vemo', da answerSource (answerLabels.ts:148-151) odgovor označi kot „Ne vem" in ne kot privzetek. Odstranitev polja izvedi SAMO v istem koraku, ko se doda merljivi agedStockValueEUR — ne prej in ne ločeno. Če se številčna različica ne izvede, polje ohrani.

*Preverba.* Verdict spremenjen iz "odstrani" v "izboljsaj": brezpogojna odstranitev bi kršila §8.5 (staranje zaloge kot obvezna ločena postavka), če nadomestno merljivo polje ni izvedeno — to pa je po lastni ugotovitvi pogojeno s spremembo motorja. Ovržen hipotetični argument o contextOnly (potential.ts:192 ga preskoči). Namesto tega dodana dejanska, danes živa napaka: manjkajoč `unknown: true` napačno označi vir odgovora v prodajnem poročilu prek answerLabels.ts:148-151.

*Vir v raziskavi.* Q26 (registri v.354); B10; §8.5 (starajoča se zaloga kot ena od šestih ločenih postavk); §16.3

### ZM-08 · dodaj · teža srednja · preverba: popravljeno

**zalogeMp — NOVO polje agedStockValueEUR: "Kolikšna je vrednost zaloge (po nabavni ceni), ki se v zadnjih 180 dneh ni prodala?"**

*Utemeljitev.* Podpora v raziskavi potrjena dobesedno: Q26 (registri v.354) "Kolikšna je vrednost zaloge brez prodaje 90/180/365 dni? | EUR | CAPITAL_BASE | izvoz zaloge | ERP"; Bolecina_resitev M02 (v.274) kot naslednji dokaz navaja "starost zaloge, odpisi, markdown"; §8.5 (v.270) med merljivim našteje "zaloga brez prodaje 90/180/365 dni". Potrjeno tudi, da modula danes to nima in da sprostljivi kapital stoji izključno na oceni (maloprodaja.ts:282). Potrjene tudi ovire, ki jih ugotovitev sama navaja: showIf v ModuleField (moduleTypes.ts:133-175) NE obstaja, moduleEngine.ts:109-115 res pretvori UNKNOWN v 0 pred compute(), test 5–7 polj je na maloprodaja.test.ts:304-311, izvoz gre prek moduleInputsJson (exportRecord.ts:164) in novega stolpca ne potrebuje. Ne podvaja obstoječega modula. Odgovorljivo iz glave NI — je pa odgovorljivo iz izvoza v nekaj minutah, zato je allowUnknown obvezen.

*Predlog.* Polje: key 'agedStockValueEUR', kind 'number', unit 'EUR', default 0, allowUnknown: true. label: 'Kolikšna je vrednost zaloge (po nabavni ceni), ki se v zadnjih 180 dneh ni prodala?' help: 'Iz izvoza zaloge s podatkom o zadnji prodaji, po nabavni vrednosti. Če ga nimate, odkljukajte "Tega podatka ne vodimo" — ocena ostane na naslednjem vprašanju.' explainer: 'Zaloga brez prodaje ni izguba, ampak denar, ki leži — zato jo štejemo med kapital in ne med stroške. Primer: od 800.000 EUR zaloge se 150.000 EUR pol leta ni prodalo.' IZVEDBA V DVEH KORAKIH. Korak 1 (brez spremembe motorja, izvedljiv takoj): polje dodaj kot contextOnly in ga NE uporabi v compute — s tem pride v prodajno poročilo (salesReport.ts:407-413) kot dokaz za sprint, sprostljivi kapital pa še naprej stoji na reducibleShare. Korak 2 (zahteva spremembo motorja): compute mora ločiti potrjeno ničlo od "ne vem", kar danes ni mogoče (moduleEngine.ts:109-115). Ko je to rešeno — z novim izbirnim parametrom compute(input, context, raw) ali z zastavico na ModuleDefinition, ki izklopi withoutUnknowns — naj agedStockValueEUR postane osnova sprostljivega kapitala, reducibleShare pa rezerva. Šele s korakom 2 odstrani staleStockShare (modul ostane pri šestih poljih, test 304-311 drži).

*Preverba.* Severity znižana z "visoka" na "srednja": v obliki, ki jo motor danes zmore, gre za kontekstno polje brez vpliva na znesek — visoka teža pripada šele koraku 2, ki je odvisen od spremembe motorja in ga ni mogoče uvrstiti med panožne popravke. Predlog razdeljen na izvedljiv korak 1 in blokiran korak 2, ker prvotni predlog ("v compute naj bo ta vrednost osnova") razvijalcu ni pustil izvedljive poti brez posega v motor. Potrjeno, da showIf ne obstaja (moduleTypes.ts:133-175) in da nov stolpec v izvozu res ni potreben (exportRecord.ts:164).

*Vir v raziskavi.* Q26 (v.354), B10, S6; Bolecina_resitev M02 (v.274); §8.5 (v.270); §19.2

### ZM-09 · izboljsaj · teža visoka · preverba: popravljeno

**zalogeMp.mainCause — ZALOGE_CAUSES, "Kaj je glavni vzrok?"**

*Utemeljitev.* Potrjeno dobesedno: ZALOGE_CAUSES na maloprodaja.ts:199-205, kategorije planning/data/data/people/external — kategorije 'physical' res ni, čeprav annualWriteOffEUR na :225 izrecno šteje "poškodovanega blaga" in blagajnaMp jo ima (:467 'Poškodbe blaga pri rokovanju ali skladiščenju', category 'physical'). ADDRESSABLE_SHARE (addressableShare.ts:28-35): physical 0,15 proti planning 0,65 in data 0,75 — trgovec z lomom danes dobi 4- do 5-kratno precenitev naslovljivosti pri VSEH treh letnih izidih (množi jih isti addressableShare, :281). Q35 (registri v.363) med veljavne vzroke izrecno šteje "fizična škoda" — podpora je dobesedna. Drugi del (komercialna odločitev) je prav tako podprt: Bolecina_resitev M02 (v.274) pravi "asortiment in popusti zahtevajo komercialno odločitev".

*Predlog.* (a) NA KONEC ZALOGE_CAUSES (maloprodaja.ts:205) dodaj: { label: 'Blago se poškoduje pri rokovanju ali skladiščenju', category: 'physical' }. Dodajanje na konec je varno: mainCauseField (addressableShare.ts:56-69) sam doda "Ne vemo" kot zadnjo možnost in default izračuna kot all.length - 1, addressableShareOf pa bere prek withUnknown — indeksi 0–4 ostanejo nespremenjeni, zato maloprodaja.test.ts:53-55 (mainCause: 1 → data) drži naprej. (b) Za komercialno odločitev NE uporabi kategorije 'external'. V addressableShare.ts:17-36 uvedi novo kategorijo `'commercial'` z ADDRESSABLE_SHARE.commercial = 0.20 in komentarjem, da gre za odločitev nabave in ne za sistem, ter dodaj možnost { label: 'Napačna izbira asortimana ali sezone — blago se ni prijelo', category: 'commercial' }. Modul ima s tem 7 možnosti + "Ne vemo"; to je en radio, ki ga obiskovalec prebere enkrat, in vprašalnika ne podaljša. (c) Popravi zastali komentar v maloprodaja.test.ts:54 ("Stanje zalog v sistemu ni zanesljivo"), ki opisuje možnost, ki v ZALOGE_CAUSES ne obstaja več.

*Preverba.* Prvotni predlog je dopuščal, da se "napačna izbira asortimana" uvrsti pod 'external' (0,25) — to je zloraba kategorije, ki je v addressableShare.ts:22 definirana kot "Dobavitelji, kupci, zunanji dejavniki", medtem ko je izbira asortimana notranja komercialna odločitev. Alternativa odstranjena: nova kategorija 'commercial' (0,20) je edina pravilna pot. Dodano preverjeno pojasnilo, zakaj dodajanje na konec ne podre testov (addressableShare.ts:56-69 računa default in "Ne vemo" dinamično). Dodana še ugotovljena stranska napaka: zastali komentar v maloprodaja.test.ts:54.

*Vir v raziskavi.* Q35 (registri v.363: "sistem/proces, dobavitelj, kraja, fizična škoda ali drug zunanji dejavnik"); Bolecina_resitev M02 (v.274); §8.5; A07/A10

### ZM-10 · izboljsaj · teža srednja · preverba: popravljeno

**zalogeMp.compute — postavka "Strošek financiranja presežne zaloge" (releasableEUR × capitalCostRate) proti košu oneTimeCapital**

*Utemeljitev.* Prvi del potrjen v celoti in naj se res ne spreminja: koša sta ločena (moduleTypes.ts:17-36), oneTimeCapital se sešteva posebej (moduleEngine.ts:69-71) in ne vstopa v potencial (potential.ts:38-51). (a) Potrjeno: postavka je v košu directLoss (maloprodaja.ts:301), ki je v moduleTypes.ts:18-19 opisan kot "trdi denar, ki odteka. Edino to gre v hero znesek", raziskava pa jo v registrih v.555 uvršča kot "letna korist" in v §17.1 v formuli našteje "prihranek financiranja" LOČENO od "neposredne izgube". (b) Potrjeno: capitalCostRate ga v assessConfidence ni — seznam `asked` (potential.ts:157-163) vsebuje samo operationalHour, adminHour, chargeOutRate, annualRevenue in contributionMargin, zastavice `usesCapitalCost` na ModuleDefinition (moduleTypes.ts:241-248 pozna le usesRevenue in usesMargin) ni. Fallback 6 % potrjen na contexts/maloprodaja.ts:161 in contextTypes.ts:321.

*Predlog.* (a) Postavko v maloprodaja.ts:302 preimenuj iz 'Strošek financiranja presežne zaloge' v 'Letna cena denarja, vezanega v presežni zalogi'. Koša NE spreminjaj — nov koš bi bil sprememba motorja, obstoječi trije letni koši pa nimajo boljšega mesta. V segments.ts dodaj maloprodaji `directLossNote`: 'Denar, ki dejansko odteka: odpisi in poteklo blago, inventurni manko, ekspresne dobave, neizkoriščeni rabati, stroški vračil in cena denarja, vezanega v zalogi.' (b) Na ModuleDefinition (moduleTypes.ts, ob usesRevenue/usesMargin) dodaj `usesCapitalCost?: true`, jo postavi na zalogeMp (in na trgovina.ts:610 ter splosno.ts:425, ki isti context.capitalCostRate prav tako množita), v potential.ts:157-163 dodaj vrstico `context?.capitalCostRate && capitalRelevant ? profile.capitalCostRate.estimated : undefined` prek istega anyAnsweredModuleUses (:87-97, tip zastavice razširi na 'usesRevenue' | 'usesMargin' | 'usesCapitalCost'). Skladnost pokrij z obstoječim vzorcem v usesRevenue.test.ts:10-23 (compute.toString().includes('context.capitalCostRate')).

*Preverba.* Severity znižana z "visoka" na "srednja": del (b) je bil precenjen. Strošek kapitala NI popolnoma nevidiv za negotovost — range.ts:104 in :116/:124 ga vključita v spodnji in zgornji kontekst, tako da izbira pasu razpon rezultata dejansko razširi. Neizpolnjena je zato samo obljuba o OZNAKI zanesljivosti (StepCostBasis.tsx:95-98, ne :96-99), ne pa celotno obravnavanje. Ovržena tudi trditev, da je maloprodaja edini segment brez directLossNote: manjka tudi trgovini (segments.ts:125-152), pet segmentov ga ima (:91, :118, :213, :242, :278), obstaja pa privzetek DEFAULT_DIRECT_LOSS_NOTE (ResultsSummary.tsx:14, uporabljen na :61), zato prazno polje ni okvara, ampak zamujena priložnost. Predlogu dodana trgovina.ts:610 in splosno.ts:425, ki bi ju zastavica sicer izpustila, in točen razpon vrstic v potential.ts.

*Vir v raziskavi.* F02, F03 (registri v.554-555); §5.2; §17.1 ("naslovljiva letna korist = (neposredna izguba + realno izkoristljiva kapaciteta + prihranek financiranja) x ..."); F11

### ZM-11 · izboljsaj · teža srednja · preverba: potrjeno

**zalogeMp.pantheon — tri iztočnice PANTHEON za to področje**

*Utemeljitev.* Potrjeno dobesedno. Iztočnice so na maloprodaja.ts:315-319. Raziskava, §8.3 (vrstica 250): GS1 opis 2D kode pri POS "je standardizacijski cilj in procesna priložnost, ne dokaz, da ga katera koli obstoječa PANTHEON konfiguracija že zagotavlja brez preveritve" — obljuba "s samodejnim opozorilom pred potekom" (:317) to prekoračuje. §25, točka 2 (vrstica 765) med vrzelmi izrecno navaja "Natančna zmožnost glede lotov, serijskih številk, FEFO in odpoklica v ciljni konfiguraciji". "Predlog odprodaje" (:318): Bolecina_resitev M02 (registri v.274) markdown uvršča med "komercialno odločitev". Poti v uporabo potrjeni: salesPlaybook.ts:129-133 vzame alineje iz področja z največjo postavko, salesReport.ts:415 jih nese v poročilo.

*Predlog.* V maloprodaja.ts:315-319 ohrani prvo alinejo nespremenjeno, drugo in tretjo zamenjaj z: 'Roki uporabnosti in serije, vidni od prevzema do prodaje (obseg FEFO in odpoklica se potrdi ob konfiguraciji)' in 'Pregled zaloge po starosti in prodaji kot podlaga za odločitev o odprodaji'. Obe formulaciji obljubljata VIDNOST podatka (kar je v obsegu PM01/PM02) in ne avtomatike odločanja.

*Preverba.* Brez vsebinskih popravkov — citat iz §8.3 preverjen dobesedno v raziskavi (v.250) in G02 potrjen kot §25, točka 2 (v.765). Dodana sklica na salesPlaybook.ts:129-133 in salesReport.ts:415, ki pokažeta, kam alineje dejansko potujejo.

*Vir v raziskavi.* §8.3 (raziskava v.250, GS1-01); §11.2 (v.404-410); §25 t.2 (v.765); Bolecina_resitev M02 (registri v.274); PM12

### ZM-12 · izboljsaj · teža visoka · preverba: popravljeno

**content/methodology.ts:144-149 — besedilo "Kako smo izračunali" za področje Presežna zaloga**

*Utemeljitev.* Potrjeno dobesedno, vključno s številkami vrstic. content/methodology.ts:145-146: formula se glasi 'letno = odpisi in prisilna znižanja + izgubljena marža praznih polic; enkratno = povprečna zaloga × ocenjen delež znižanja'. "Izgubljena marža praznih polic" je od delitve na šest področij v razpolozljivostMp (maloprodaja.ts:166-174, postavka 'Nezaslužena marža zaradi praznih polic'), letnega stroška financiranja (:301-305) pa besedilo sploh ne omeni. Poti prikaza potrjene: Breakdown.tsx:64-65 (MethodologyToggle), pdfSales.ts:292-295, salesReportHtml.ts:382-385 — vse tri berejo isti MODULE_METHODOLOGY. Napaka je torej vidna stranki in prodajniku hkrati.

*Predlog.* content/methodology.ts:145-146 formula: 'letno = odpisi ter poteklo in poškodovano blago + marža, izgubljena s prisilnimi znižanji + sprostljiv kapital × letni strošek financiranja; enkratno = sprostljiv kapital (povprečna zaloga × ocenjen delež znižanja)'. :147-148 rationale ohrani obstoječi stavek o meji proti manku ("Sem sodi samo ZNANA izguba...") in zamenjaj uvodni stavek o "dveh nasprotnih problemih" — ta po delitvi na šest področij ne drži več — ter na konec dodaj: 'Sprostljiv kapital je enkraten denarni učinek in se z letnimi zneski nikoli ne sešteva; letni strošek njegovega financiranja je ločena postavka in ne isti denar drugič.'

*Preverba.* Sklici potrjeni (144-149, Breakdown.tsx:64-65, pdfSales.ts:292-295, salesReportHtml.ts:382-385). Predlogu dodana zahteva, da se odstrani tudi uvodni stavek "Področje meri dva nasprotna problema hkrati", ki ga prvotni predlog ni omenil, čeprav je po delitvi na razpolozljivostMp + zalogeMp prav tako neresničen. Opozorilo za obseg: identičen stavek stoji tudi pri zaloge_trgovina (methodology.ts:122-123) — tam ga je treba preveriti posebej, ker veleprodajni modul morda res meri oboje.

*Vir v raziskavi.* F02, F03 (registri v.554-555); §17.1; §24 P0

### ZM-13 · izboljsaj · teža srednja · preverba: popravljeno

**marzeMp.triage.prompt — "Kako pogosto ugotovite, da je bil artikel prodan po napačni ceni ali da dogovorjen dobaviteljski pogoj ni bil izkoriščen?"**

*Utemeljitev.* Potrjeno: prompt je na maloprodaja.ts:339-340, možnosti :341-346. Tretjega izida modula (ure vzdrževanja cenikov in etiket, :442-449) res ne omenja. Potrjeno tudi, da cene NISO med privzetimi področji: segments.ts:178-181 daje defaultIds ['razpolozljivostMp', 'zalogeMp', 'blagajnaMp'] z recommendedCount: 3, komentar na :175-177 pa razlog izrecno zapiše. Trgovec, ki cene obvlada, a zanje porabi veliko ur, torej področja ne izbere in podrobnih vprašanj ne vidi. Q15 (registri v.343) sprašuje samo po napakah cen, tako da vrzel ni v neskladju z raziskavo, ampak v nepokritosti B12.

*Predlog.* Prompt na maloprodaja.ts:339-340 zamenjaj z: 'Kako pogosto se pri cenah, akcijah ali dobaviteljskih pogojih kaj zalomi — in koliko dela imate z njihovim vzdrževanjem?' Vse štiri oznake uskladi tako, da vsaka pove oboje: 0 → 'Cene in pogoji so pod nadzorom, dela z njimi je malo'; 1 → 'Občasno; cene in etikete urejamo sproti'; 2 → 'Redno; z akcijami in etiketami imamo precej dela'; 3 → 'Stalno — obsega in porabljenega časa pa ne poznamo'.

*Preverba.* Predlog konkretiziran: prvotni je dopolnil samo vmesni oznaki 1 in 2, s čimer bi lestvica mešala dve merili (0 in 3 bi merila napake, 1 in 2 pa napake plus delo) in odgovor bi postal neprimerljiv. Podane so vse štiri oznake. Prompt tudi skrajšan — prvotni je z dvema podrednima stavkoma in pomišljajem presegel dolžino, pri kateri triažno vprašanje še deluje kot hitra ocena. Sklici popravljeni: prompt je :339-340 (ne :339-341), segments.ts:178-181 potrjen.

*Vir v raziskavi.* Q15 (registri v.343); B11, B12, B04; §8.6 (raziskava v.278: "delež ročnih etiket", "ure dokazovanja prejšnje cene")

### ZM-14 · ohrani · teža nizka · preverba: potrjeno

**marzeMp.summary — "Prodaja po napačni ceni, neizkoriščeni dobaviteljski pogoji in ročno vzdrževanje cenikov ter akcij."**

*Utemeljitev.* Potrjeno: summary na maloprodaja.ts:336-337 našteje tri postavke v istem vrstnem redu kot compute (:424-451): lostMargin 'Marža, izgubljena pri prodaji po napačni ceni' (:430-431), directLoss 'Neizkoriščeni dobaviteljski rabati in bonusi' (:437-438), capacity 'Vzdrževanje cenikov, akcij in oznak' (:445-446). Nobene postavke ne izpusti in nobene funkcionalnosti ne obljublja. Poskus ovržbe: če se izvede razdelitev ur na dve polji, summary ostane pravilen, ker "ročno vzdrževanje cenikov ter akcij" pokrije oboje — sprememba torej ne bo potrebna.

*Preverba.* Brez popravkov; dodana preverba, da ugotovitev ostane veljavna tudi po morebitni razdelitvi urnega polja.

*Vir v raziskavi.* B02, B04, B11, B12; §5.2

### ZM-15 · izboljsaj · teža visoka · preverba: popravljeno

**marzeMp.wrongPriceSalesSharePercent — "Kolikšen delež prodaje steče po napačni, zastareli ali pozabljeni akcijski ceni?"**

*Utemeljitev.* Osnova je res prizadeta prodaja: compute na maloprodaja.ts:432-433 množi context.annualRevenueEUR × wrongPriceSalesSharePercent × marginGapPercent, komentar :426-429 to izrecno utemelji. Registri v.559 (Bolecina_finance M04): "prizadeta prodaja x maržno odstopanje | osnova je prizadeta prodaja, ne celotni COGS" in v.579 (Problem_podatki M04): "ne uporabi celotnega COGS" — skladno. Potrjeno tudi: max je 0.15 (:354, ne :355 — tam je step), help na :357 že vsebuje "ne celotnega prometa in ne celotne nabavne vrednosti", NE pa meje proti presežni zalogi; oba izida gresta v isti koš lostMargin (:292 in :430). Explainer na :358-360 res že da izpeljavo iz vzorca ("3 od 100 računov").

*Predlog.* (a) V maloprodaja.ts:354 max znižaj z 0.15 na 0.05. Korak PUSTI na 0.005 (:355). (b) help na :357 razširi na: 'Delež prodaje, ki je napake dejansko prizadela — ne celotnega prometa in ne celotne nabavne vrednosti. Prisilna in sezonska znižanja zaradi presežne zaloge sem ne sodijo — ta meri področje Presežna zaloga.' (c) explainer na :358-360 dopolni z virom dokaza: 'Najhitrejši dokaz je vzorec — preverite ceno pri 50 artiklih na polici proti blagajni in preštejte odstopanja.' (d) Popravek izvedi hkrati s :243 (glej ugotovitev o forcedMarkdownMarginEUR), sicer meja spet ostane enosmerna.

*Preverba.* Ovržena podrobnost predloga: znižanje koraka z 0,005 na 0,0025 bi pri maksimumu 0,05 dalo 20 postankov drsnika in četrtinke odstotne točke — to je natanko lažna natančnost, ki jo raziskava prepoveduje, in v nasprotju z lastnim razlogom za znižanje maksimuma. Korak ostane 0,005. Popravljen sklic: max je na vrstici 354, ne 355. Dodana zahteva po hkratni izvedbi z :243.

*Vir v raziskavi.* Bolecina_finance M04 (registri v.559); Problem_podatki M04 (v.579); K18; §8.6 (v.278); §18

### ZM-16 · izboljsaj · teža srednja · preverba: popravljeno

**marzeMp.marginGapPercent — "Za koliko odstotnih točk je marža pri tej prodaji nižja od načrtovane?"**

*Utemeljitev.* Dvofaktorska oblika je res oblika raziskave (registri v.559, v.579: prizadeta prodaja × odstopanje) in en sam vnos bi bil slabši. Potrjeno: polje maloprodaja.ts:362-374, max 0.2 (:367), step 0.01 (:368), explainer :371-373 pove, da gre za odstotne točke. Potrjena tudi obe luknji: ModuleSection.tsx pri kind 'percent' izpiše `unit="%"` — vendar na vrstici 88, ne :85 (:85-87 so min/max/step) — in plausibility.ts:57-63 sešteva izključno polja z unit 'h/mesec' in 'h/leto', zmnožka dveh odstotkovnih drsnikov torej res ne vidi. Aritmetika potrjena: 0,15 × 0,20 = 3 % prihodka, pri 5,5 mio EUR (contexts/maloprodaja.ts:39, sredina pasu 3–10 mio) 165.000 EUR.

*Predlog.* (a) V maloprodaja.ts:367 max znižaj z 0.2 na 0.15; step 0.01 ostane. (b) Label na :364 zamenjaj z: 'Kolikšna je razlika med načrtovano in doseženo maržo pri tej prodaji (v odstotnih točkah)?' — s tem drži tudi ob znaku "%", ki ga ModuleSection.tsx:88 pri kind 'percent' izpiše fiksno; alternativa (nova neobvezna lastnost unitLabel na ModuleField) je sprememba sheme in za ta popravek ni potrebna. (c) Mehko kontrolo verjetnosti po vzoru hoursPlausibilityWarning (plausibility.ts:83-92) obravnavaj kot NIZKO prioriteto in NOVO ZMOŽNOST: plausibility.ts:57-63 danes sešteva le posamezna urna polja in zmnožka dveh polj ne pozna.

*Preverba.* Popravljen sklic: unit="%" je na ModuleSection.tsx:88, ne :85. Prioriteta dela (c) znižana: če se hkrati izvede znižanje wrongPriceSalesSharePercent na 0,05 (druga ugotovitev), največji možni zmnožek pade s 3 % na 0,75 % letnega prihodka, torej s 165.000 na 41.250 EUR pri 5,5 mio — problem, zaradi katerega je bila kontrola predlagana, s tem večinoma izgine, nova zmožnost motorja pa ni upravičena. Dodano pojasnilo, zakaj je preubeseditev oznake pravilnejša pot od nove lastnosti sheme.

*Vir v raziskavi.* Bolecina_finance M04 (v.559); B11; K01, K18; F11; §8.6

### ZM-17 · izboljsaj · teža srednja · preverba: potrjeno

**marzeMp.unclaimedRebatesEUR — "Kolikšno vrednost dobaviteljskih rabatov, bonusov in sofinanciranja akcij letno ne uveljavite?"**

*Utemeljitev.* Potrjeno: polje maloprodaja.ts:375-388, unit 'EUR/leto', allowUnknown, compute (:436-441) ga da v directLoss brez množenja z 12; explainer :384-387 res da izpeljavo iz pogodbenega odstotka. Registri v.221 (B28) potrjujejo "Neobračunano sofinanciranje promocije | neizterjan prispevek | neposredna izguba". Vrzel potrjena: dokumentiHz.annualDocDelayEUR (horizontal.ts:394-396) izrecno navaja "zamujeni skonti" v EUR/leto, financeHz.annualPenaltyEUR (horizontal.ts:188-190) pa zamudne obresti in globe — obe horizontali sta v maloprodaji dejansko vključeni (segments.ts:167, :169), oba zneska pa gresta v directLoss. Utemeljitev, zakaj mejo nosi panožni modul, potrjena: horizontal.ts:19-23 izrecno prepove, da bi horizontala imenovala sosednja področja.

*Predlog.* help na maloprodaja.ts:383 razširi na: 'Če tega ne vodite, odkljukajte "Tega podatka ne vodimo" — nižja zanesljivost rezultata je boljša od izmišljene številke. Skonti za predčasno plačilo sem ne sodijo — te meri področje Dokumentacija in e-poslovanje.' Besedil v horizontal.ts NE spreminjaj.

*Preverba.* Brez vsebinskih popravkov. Popravljen sklic: financeHz.annualPenaltyEUR je na horizontal.ts:188-190 (ne :186-189). Dodana potrditev, da sta obe horizontali v maloprodaji res prisotni (segments.ts:167 financeHz, :169 dokumentiHz) — brez tega bi bila meja teoretična.

*Vir v raziskavi.* B04, B28 (registri v.221); Bolecina_finance M03, M11; §18; §8.2

### ZM-18 · izboljsaj · teža srednja · preverba: popravljeno

**marzeMp.priceMaintenanceHoursPerMonth — "Koliko skupnih ur mesečno porabite za vzdrževanje cenikov, akcij, etiket in oznak na policah?"**

*Utemeljitev.* Potrjeno: polje maloprodaja.ts:389-399, unit 'h/mesec', compute (:445-448) množi z adminHourCostEUR in MONTHS_PER_YEAR, komentar :443-444 pravilno utemelji kapaciteto namesto prihranka plače, plausibility.ts:61 polje šteje. Potrjeno tudi, da prevzemMp isto razliko namenoma loči (maloprodaja.ts:666-669 komentar, :672-675 operativna ura) in da je meja enosmerna: help na :395 imenuje samo Prevzem, kanaliMp:765 pa postavlja mejo proti Cenam z nasprotne strani. Kar ugotovitev NI upoštevala in kar odloči izid: contexts/maloprodaja.ts:122 v pomoč adminHour izrecno zapiše "priprava cen in akcij" — priprava cen je torej po definiciji konteksta administrativna ura in ne operativna.

*Predlog.* Razdeli v dve polji na mestu maloprodaja.ts:389-399 (modul dobi 7 polj, test maloprodaja.test.ts:304-311 to še dovoli). (1) key 'priceSetupHoursPerMonth', kind 'number', unit 'h/mesec', default 0. label: 'Koliko ur mesečno gre za pripravo in vnos cen, akcij in popustov?' help: 'Delo za računalnikom: priprava cenikov, vnos akcij in popustov, preverjanje po kanalih. Ne vključujte prevzema blaga in usklajevanja dokumentov (področje Prevzem) ne usklajevanja cen in artiklov s spletno trgovino (področje Spletna prodaja).' explainer: 'Ure vodje, nabave ali kategorijskega vodje. Primer: 1 oseba × 3 h na teden ≈ 13 ur na mesec.' V compute vrednoti s context.adminHourCostEUR. (2) key 'labelHoursPerMonth', unit 'h/mesec', default 0. label: 'Koliko ur mesečno gre za tiskanje in menjavo etiket ter urejanje oznak na policah?' help: 'Delo v poslovalnici. Rednega polnjenja polic ne štejte — samo delo z etiketami in oznakami.' explainer: 'Ure prodajalcev in vodij poslovalnic. Primer: 2 osebi × 4 h na teden ≈ 35 ur na mesec.' V compute vrednoti s context.operationalHourCostEUR, kot dve ločeni postavki po vzoru prevzemMp (:670-680). Oba polja imata help, zato oba potrebujeta explainer (explainers.test.ts:29-32). Nato uskladi še formulo v content/methodology.ts:151-152.

*Preverba.* OVRŽENA je nadomestna možnost prvotnega predloga ("ohrani eno polje, a ga vrednoti po operativni uri"): contexts/maloprodaja.ts:120-126 v pomoč adminHour izrecno našteje "priprava cen in akcij", zato bi enotno vrednotenje po operativni uri neposredno nasprotovalo definiciji skupne finančne osnove — smer napake navzdol je tu doseže na napačen način. Razdelitev na dve polji je edina skladna pot. Popravljena tudi številka: operativna ura v maloprodaji je fallback 20 EUR (contexts/maloprodaja.ts:117), ne 19 — 19 je sredina srednjega pasu SHOP_HOUR_BANDS (:23); razmerje proti admin 25 EUR je torej 1,25 in ne 1,32, precenitev pa približno četrtina in ne tretjina. Dodana zahteva po uskladitvi methodology.ts:151-152, ki je prvotni predlog ni omenil.

*Vir v raziskavi.* B12; Bolecina_finance M04, M05; A13; §18

### ZM-19 · izboljsaj · teža srednja · preverba: popravljeno

**marzeMp.previousPriceProof — "Ali lahko za posamezen artikel, poslovalnico in kanal dokažete najnižjo ceno zadnjih 30 dni?" (contextOnly, ZVPot-1)**

*Utemeljitev.* Potrjeno: polje maloprodaja.ts:400-419, contextOnly, brez zneska — tveganje se res ne monetizira. Ubeseditev res sprašuje po dokazljivosti (:402-403, explainer :408-411), kar ustreza prodajnemu vprašanju iz §8.6 (raziskava v.282). Potrjena tudi prodajna izguba: salesPlaybook.ts:106-115 kontekstna polja ponudi šele v veji `questions.length === 0`. §17 tip NOT_APPLICABLE potrjen v raziskavi (v.571: "proces ne obstaja | izključi brez pretvarjanja v nič"), privzetek pa je res 2 = "Le približno" (:405).

*Predlog.* (a) Sprožilec v salesPlaybook.buildOpeningQuestions (pred vejo :106) — vendar ga ni mogoče napisati, dokler PlaybookInput ne nosi surove vrednosti: PlaybookInput je Omit<SalesReport,...> (salesPlaybook.ts:55), vrstice odgovorov pa v salesReport.ts:407-413 nosijo samo besedilo vprašanja in odgovora. Zato najprej v tip vrstice odgovora dodaj `key: field.key` in `value: moduleValues[field.key]`, šele nato dodaj pogoj `area.moduleId === 'marzeMp' && key === 'previousPriceProof' && (value === 2 || value === 3)` z iztočnico 'Ali lahko za posamezen artikel in poslovalnico danes pokažete najnižjo ceno zadnjih 30 dni — in kdo bi to naredil ob inšpekcijskem pregledu?' in utemeljitvijo 'Odgovorili so, da tega ne morejo dokazati neposredno. To je konkreten regulatorni primer in ne funkcionalnost.' (b) Dodaj možnost { value: 4, label: 'Znižanj praktično ne izvajamo' } na maloprodaja.ts:412-418. (c) contextOnly in odsotnost zneska ohrani.

*Preverba.* Dve napaki v izvedljivosti. (1) Prvotni predlog predpostavlja, da playbook vidi vrednost previousPriceProof — ne vidi je: PlaybookInput (salesPlaybook.ts:55) dobi le izpisana besedila iz salesReport.ts:407-413, zato je treba najprej razširiti vrstico odgovora s ključem in surovo vrednostjo. Brez tega je predlog neizvedljiv oziroma bi se moral opirati na ujemanje besedila odgovora, kar je krhko. (2) Pogoj `>= 2` bi po dodani možnosti 4 ('Znižanj praktično ne izvajamo') sprožil regulatorno iztočnico prav pri lekarni, ki znižanj ne izvaja — torej mora biti `value === 2 || value === 3`. Popravljen sklic: help/explainer sta na :407-411, choices na :412-418.

*Vir v raziskavi.* R02, SPOT-02; Q28 (registri v.356); §8.6 (raziskava v.282); §17 NOT_APPLICABLE (v.571)

### ZM-20 · izboljsaj · teža srednja · preverba: popravljeno

**marzeMp.mainCause — MARZE_CAUSES, "Kaj je glavni vzrok?"**

*Utemeljitev.* Potrjeno: MARZE_CAUSES na maloprodaja.ts:324-330, en sam addressableShare (:422) množi vse tri izide (:434, :440, :449). Deleži potrjeni v addressableShare.ts:28-35 (data 0.75, external 0.25). Registri v.276 (Bolecina_resitev M04) res dajejo pokritost "visoka" za "Cene / akcije / marže", Q35 (v.363) pa "naslovljivost je odvisna od vzroka". Da je addressableShare lastnost posameznega izida in ne modula, potrjeno v moduleTypes.ts:190-201. KAR PA UGOTOVITEV SPREGLEDA: salesReport.ts:405-406 izrecno predpostavlja, da si vsi izidi področja delijo isti delež ("Vsi izidi enega področja delijo isti delež, zato zadošča prvi, ki ga ima") in vzame prvega. Če bi ure dobile 0,75, izgubljena marža pa 0,25, bi poročilo za celo področje prikazalo 0,25 — torej napačno število ob pravilnem izračunu, kar je ista vrsta napake kot pri zastarelem besedilu metodologije.

*Predlog.* IZVEDI TAKOJ (nizko tveganje): MARZE_CAUSES (maloprodaja.ts:324-330) preubesedi tako, da vsak vzrok imenuje izid, na katerega se nanaša — npr. 'Cenike in akcije vzdržujemo ročno — največ dela je pri vnosu in etiketah', 'Dobaviteljski pogoji niso zapisani na enem mestu — rabatov ne izterjamo'. Vrstni red in kategorije ohrani, da indeksi in testi držijo. IZVEDI ŠELE Z DOPOLNITVIJO POROČILA: različen addressableShare po izidu (ure kategorija 'data' 0,75, marža in rabati po izbranem vzroku) je v compute izvedljiv brez posega v motor, vendar samo skupaj s popravkom salesReport.ts:405-406 — namesto prvega deleža naj MeasuredArea vrne null, kadar se deleži izidov razlikujejo, Breakdown in PDF pa naj v tem primeru prikažeta delež pri posamezni postavki in ne pri področju. Utemeljitev zapiši v komentar ob compute in v content/methodology.ts:153-154.

*Preverba.* Ovržena trditev, da je predlog "sprememba modula in ne motorja, zato izvedljiva takoj". salesReport.ts:405-406 izrecno računa na to, da so deleži znotraj področja enaki, in bi ob različnih deležih prikazal delež prve postavke kot delež celotnega področja — prodajniku in stranki bi torej pokazal napačno naslovljivost. Predlog razdeljen na del, ki je res izvedljiv takoj (preubeseditev vzrokov), in del, ki zahteva sočasen popravek poročila. Dodan sklic na moduleTypes.ts:190-201, ki potrjuje, da je addressableShare res lastnost izida.

*Vir v raziskavi.* Q35 (registri v.363); Bolecina_resitev M04 (v.276); A07/A10; ADDRESSABLE_SHARE (addressableShare.ts:28-35)

### ZM-21 · ohrani · teža nizka · preverba: potrjeno

**marzeMp.pantheon — tri iztočnice PANTHEON za to področje**

*Utemeljitev.* Potrjeno: iztočnice na maloprodaja.ts:453-457. Vse tri ostajajo v mejah §11.2 (raziskava v.404-410): enotni cenik in akcije čez poslovalnice in kanale, zgodovina cen z dokazom najnižje cene 30 dni, nabavni pogoji in bonusi po dobavitelju. Nobena ne obljublja promotions engine, ki jo registri v.276 postavljajo kot mejo ("kompleksna promotions engine pravila preveri"). Poskus ovržbe: druga iztočnica bi lahko veljala za obljubo skladnosti z ZVPot-1 — a govori o zgodovini cen kot podatku in ne o pravni skladnosti, kar je pravilna razmejitev in se neposredno navezuje na odgovor previousPriceProof, ki ga stranka pravkar izpolni.

*Preverba.* Brez popravkov; sklic :453-457 potrjen.

*Vir v raziskavi.* PM03, PM05; PANT-01, PANT-02; R02; Bolecina_resitev M04 (registri v.276)

### ZM-22 · izboljsaj · teža visoka · preverba: potrjeno

**content/methodology.ts:150-155 — besedilo "Kako smo izračunali" za področje Cene, akcije in marža**

*Utemeljitev.* Najresnejša najdba pregleda in v celoti potrjena dobesedno. content/methodology.ts:151-152 se glasi 'letna nabavna vrednost × delež izgube zaradi napačnih cen; + neuveljavljeni rabati; ure vzdrževanja cenikov × strošek administrativne ure × 12', :153-154 pa 'vprašana je kot delež nabavne vrednosti'. Koda računa nasprotno (maloprodaja.ts:432-433: prihodek × delež prizadete prodaje × maržna vrzel) in v komentarju :426-429 izrecno pove, da je prejšnja različica s COGS znesek precenila za red velikosti. Besedilo torej stranki v Breakdown.tsx:64-65, prodajniku v pdfSales.ts:292-295 in v salesReportHtml.ts:382-385 opisuje prav napako, ki je bila odpravljena in pred katero raziskava izrecno svari (registri v.559: "osnova je prizadeta prodaja, ne celotni COGS"; v.579: "ne uporabi celotnega COGS").

*Predlog.* content/methodology.ts:151-152 formula: 'letni prihodek × delež prodaje po napačni ceni × maržna vrzel v odstotnih točkah; + neuveljavljeni dobaviteljski rabati in bonusi; ure vzdrževanja cenikov in etiket × strošek ure × 12'. :153-154 rationale: 'Osnova je samo prodaja, ki jo je napaka dejansko prizadela, in ne celotna nabavna vrednost — napačna cena ne pokvari marže na vsem prodanem blagu, ampak na tistem delu, ki je stekel po napačni ceni. Prisilna znižanja zaradi presežne zaloge sem ne sodijo, meri jih področje Presežna zaloga. Ure vzdrževanja cenikov so že plačan čas: sproščene ure ne znižajo plačne mase, zato so kapaciteta in ne denar, ki odteka.' Če se izvede razdelitev urnega polja na pripravo cen in etikete, formulo zapiši kot dve postavki z dvema urnima postavkama, po vzoru prevzemMp (methodology.ts:169-170).

*Preverba.* Vsi sklici preverjeni in točni (150-155, maloprodaja.ts:426-433, Breakdown.tsx:64-65, pdfSales.ts:292-295, salesReportHtml.ts:382-385). V predlogu formula napisana z generičnim "strošek ure", ker je ob razdelitvi urnega polja treba navesti dve urni postavki — dodan sklic na methodology.ts:169-170 kot obstoječi vzorec za tak zapis.

*Vir v raziskavi.* Bolecina_finance M04 (registri v.559); Problem_podatki M04 (v.579); §24 P0


---

## BP · blagajnaMp + prevzemMp + diagnostikaMp + modul E

### BP-01 · izboljsaj · teža visoka · preverba: popravljeno

**blagajnaMp / triage.prompt: "Koliko časa in denarja poberejo dnevni zaključki blagajn ter razlike, ki jih odkrijete šele ob inventuri?"**

*Utemeljitev.* PREVERJENO in DRŽI. Prompt na maloprodaja.ts:476-477 (možnosti 478-483) res zlije dve področji, ki ju raziskava §16.2 loči kot točki 6 ("blagajna, zaključki in plačila") in 7 ("inventurni manko in točnost zaloge"), xlsx pa kot Q17/Q18 in M06/M07. selectTopModules (moduleEngine.ts:192-210) res lahko izloči blagajnaMp, čeprav je v defaultIds (segments.ts:178-181): defaultIds je le razred prednosti ob IZENAČENIH ocenah, dve področji s strogo višjo oceno ga izrineta in koš directLoss z inventurnim mankom (maloprodaja.ts:571-576) se ne izmeri. OMEJITEV, ki je ugotovitev ne pove: privzeta izbira nedotaknjenega obrazca blagajnaMp vseeno vsebuje, zato je tveganje realno le pri obiskovalcu, ki triažo dejansko izpolni.

*Predlog.* Prompt naj vodi denar: "Koliko blaga in denarja vam izgine, ne da bi vedeli kako — in koliko časa vzamejo dnevni zaključki blagajn?" Možnosti NE po "slabšem od obojega" (tak zapis naredi oceno blagajne sistematično višjo od ocen drugih področij in poruši prav primerljivost, ki jo ugotovitev brani), ampak po SKUPNEM bremenu področja: 0 'Zaključki so hitri, razlik skoraj ni', 1 'Nekaj minut na blagajno, manjše razlike', 2 'Zaključki ali razlike so opazno breme', 3 'Oboje je veliko — ali pa tega sploh ne merimo'. Prava rešitev ostane razdelitev na dve področji (M06 zaključki in blagajniške razlike, M07 manko in točnost zaloge); poseg zajame nov modul v maloprodaja.ts, COSTED_MODULES v maloprodaja.test.ts:46, vnosa v content/methodology.ts (ob vrstici 162) in content/actions/actions.ts:196 ter defaultIds v segments.ts:178-181.

*Preverba.* Sklici na kodo držijo. Popravljena je lestvica možnosti: predlagano ocenjevanje "po slabšem od obojega" bi triažne ocene blagajne napihnilo v primerjavi z drugimi področji in s tem podvojilo napako, ki jo ugotovitev očita obstoječemu stanju. Dodana omejitev, da je blagajnaMp v privzeti izbiri in izpade šele ob dejansko izpolnjeni triaži. Dopolnjeni sklici za razdelitev (COSTED_MODULES v testu, vrstice v methodology.ts in actions.ts).

*Vir v raziskavi.* Raziskava §8.7, §8.8, §16.2 (točki 6 in 7); xlsx Vprasalnik Q17, Q18; Bolecina_finance M06, M07; Katalog_bolecin B13, B14, B17

### BP-02 · izboljsaj · teža nizka · preverba: popravljeno

**blagajnaMp / summary: "Dnevni zaključki blagajn, inventure ter neznane razlike med sistemom in dejanskim stanjem."**

*Utemeljitev.* PREVERJENO in DRŽI. Povzetek je na maloprodaja.ts:473-474 in res ne omenja blagajniških razlik, help polja shrinkageEUR (maloprodaja.ts:524) pa jih vseeno pobira v isti znesek. Povzetek se v prodajni pripravi izpiše prek buildMeasuredArea (salesReport.ts:398), zato je zapisana meja področja in ne okras.

*Predlog.* "Dnevni zaključki blagajn, inventure, nepojasnjene blagajniške razlike in inventurni manko — izguba, ki je ne znate pojasniti. Znano odpisano, poteklo in znižano blago meri področje Presežna zaloga, odpisi in znižanja." (Naslov sosednjega modula je na maloprodaja.ts:209 zapisan kot 'Presežna zaloga, odpisi in znižanja'; v povzetku naj se navede tako, kot ga obiskovalec vidi v vprašalniku.)

*Preverba.* Vsi sklici držijo. Popravljeno je le predlagano besedilo: sklic na sosednje področje mora uporabiti dejanski naslov modula ('Presežna zaloga, odpisi in znižanja', maloprodaja.ts:209), ne skrajšane oblike.

*Vir v raziskavi.* Bolecina_finance M06 ("ločeno od manka") in M07; Katalog_bolecin B14, B17; raziskava §18 (tabela dvojnega štetja)

### BP-03 · izboljsaj · teža srednja · preverba: potrjeno

**blagajnaMp / tillCount: "Koliko blagajniških mest imate skupaj v vseh poslovalnicah?"**

*Utemeljitev.* PREVERJENO in DRŽI DOBESEDNO. Polje je na maloprodaja.ts:486-492 in res nima ne help ne explainer. Je največji množitelj modula (maloprodaja.ts:558-561) in ustreza imenovalcu K14. Ker nima help, ga varovalo v explainers.test.ts:29-31 (test 'vsako polje s pomožnim besedilom ima tudi pojasnilo') res ne zajame — test filtrira WITH_HELP (vrstica 23) in polje brez help tiho ostane brez pojasnila. Napaka pri štetju rezervnih in sezonskih blagajn gre izključno navzgor.

*Predlog.* Besedilo vprašanja ostane. help: "Štejte samo blagajne, na katerih se dejansko vsak dan opravi zaključek — rezervnih in sezonskih ne." explainer: "Blagajniška mesta z dnevnim zaključkom in oddajo izkupička, v vseh poslovalnicah skupaj. Primer: 3 poslovalnice × 2 blagajni = 6; sedma, rezervna blagajna, ki jo odprete le pred prazniki, ne šteje." (Dolžina explainerja je 214 znakov — v mejah 40–600 iz explainers.test.ts:44-46.)

*Preverba.* Sklic na explainers.test.ts je 29-31 in ne 29-32 (test se konča na vrstici 31, describe blok pa se nadaljuje). Vsebinsko brez sprememb; dodano preverjanje, da predlagani explainer ustreza dolžinskemu varovalu.

*Vir v raziskavi.* KPI_slovar K14 ("minute zaključka x blagajne x dnevi"); raziskava §8.7 ("Meriti: število blagajn, transakcij, delovnih dni, minut odpiranja/zapiranja"); Vprasalnik Q04, Q30

### BP-04 · izboljsaj · teža visoka · preverba: popravljeno

**blagajnaMp / closingMinutesPerTillPerDay: "Koliko minut na dan porabi ena blagajna za odprtje, zaključek in oddajo izkupička?"**

*Utemeljitev.* PREVERJENO in DRŽI. Polje ima help in explainer z izpeljavo in primerom (maloprodaja.ts:493-503). Zmnožek blagajne × minute × odprti dnevi (maloprodaja.ts:558-561) res ustvari ure, ki jih assessHoursPlausibility ne vidi: sešteva samo enoti 'h/mesec' in 'h/leto' (plausibility.ts:57-63), test pokritosti pa filtrira po startsWith('h/') (plausibility.test.ts:73-85), zato enot 'min/dan' in 'blagajn' ne ujame ne motor ne test. Iste ure aggregateBuckets vseeno prišteje v capacityHoursPerMonth (moduleEngine.ts:65-67) — prikazana vsota ur in kontrola verjetnosti sta torej res neskladni. content/methodology.ts:164 res še vedno navaja "305 odprtih dni", čeprav koda bere odgovor 5/6/7.

*Predlog.* (a) Pod poljem izpiši izpeljano letno vrednost ("6 blagajn × 12 min × 305 dni = 366 ur na leto"); izvedba je v komponenti, ki riše polja modula (src/components/Calculator/ — ista komponenta, ki že izriše help in explainer), in zahteva dostop do vrednosti sosednjih polj istega modula. (b) assessHoursPlausibility naj poleg polj z enotama h/mesec in h/leto sešteje hoursPerMonth iz izidov koša 'capacity' za module, katerih urna polja nimajo enote h/*; vsi privzetki teh polj so 0, zato se pokritost razširi brez tveganja, da bi se štel nedotaknjen privzetek. POZOR: doc-komentar plausibility.ts:43-46 izrecno pravi, da se šteje VNESENA in ne razrešena vrednost — ob spremembi ga je treba prepisati, sicer koda in komentar trdita nasprotno; funkcija bo poleg tega potrebovala ComputeContext, ki ga danes ne prejme. (c) Popravi content/methodology.ts:164 v "× odprti dnevi po odgovoru (255/305/355)".

*Preverba.* Sklic na methodology je vrstica 164 (ne 163-164) — 305 se pojavi natanko enkrat. Sklic plausibility.ts:57-64 popravljen v 57-63, plausibility.test.ts:74-85 v 73-85. Predlog (b) dopolnjen z dvema izvedbenima posledicama, ki ju ugotovitev izpusti: prepis doc-komentarja plausibility.ts:43-46 in dejstvo, da funkcija danes ne prejme ComputeContext, brez katerega izidov ne more izračunati. Predlog (a) konkretiziran z mestom izvedbe.

*Vir v raziskavi.* KPI_slovar K14; Bolecina_finance M06 ("blagajne x delovni dnevi x minute/60 x strošek ure"); raziskava §8.7 in §21; Hipoteze H09

### BP-05 · izboljsaj · teža nizka · preverba: popravljeno

**blagajnaMp / openDaysPerWeek: "Koliko dni v tednu obratujete?"**

*Utemeljitev.* PREVERJENO in DRŽI. Polje je na maloprodaja.ts:504-516 (komentar o ±16 % na 505-506, konstante na 47-48) in je edino polje modula brez help in brez explainer poleg tillCount in stocktakeHoursPerYear. Veriga z različnimi urniki po poslovalnicah res nima navodila, kaj izbrati. content/methodology.ts:164 hkrati navaja staro konstanto 305 in izračunu nasprotuje.

*Predlog.* help: "Pri več poslovalnicah izberite prevladujoči urnik." explainer: "Iz odgovora izpeljemo odprte dneve na leto: 5 dni ≈ 255, 6 dni ≈ 305, 7 dni ≈ 355. Če del poslovalnic dela šest in del sedem dni, izberite tistega, ki velja za večino blagajn." Uskladi content/methodology.ts:164 (isti popravek kot pri closingMinutesPerTillPerDay — izvedi ga enkrat).

*Preverba.* Trditev "edino polje modula brez vsakega besedila" je NETOČNA: brez help in explainer sta tudi tillCount (486-492) in stocktakeHoursPerYear (530-536). Sklic na methodology popravljen na vrstico 164. Dodana opomba, da gre za isti popravek methodology.ts kot pri prejšnji točki, da ga razvijalec ne izvede dvakrat.

*Vir v raziskavi.* KPI_slovar K14; raziskava §8.7 (delovni dnevi kot obvezen imenovalec); §9 KPI disciplina (vedno navedi imenovalec in obdobje)

### BP-06 · izboljsaj · teža visoka · preverba: popravljeno

**blagajnaMp / shrinkageEUR: "Kolikšna je bila po nabavni vrednosti neznana razlika (manko) ob zadnji inventuri?"**

*Utemeljitev.* DELNO DRŽI. Polje je na maloprodaja.ts:517-529, enota je res 'EUR' (521), znesek gre nespremenjen v LETNI koš directLoss (571-576), sosednje polje annualWriteOffEUR pa je res vprašano "v zadnjih 12 mesecih" z enoto 'EUR/leto' (223-233) — enako unclaimedRebatesEUR (376-388). Neujemanje enote in besedila torej drži. NE DRŽI pa trditev, da letna normalizacija "stoji samo na stavku v help": ista poved je tudi v explainerju (527-528). Manjka izključno številčni primer preračuna. Drži, da help (524) v isti znesek sili tudi "nepojasnjene blagajniške razlike", kar je razlika v GOTOVINI, zmešana z nabavno vrednostjo BLAGA — Bolecina_finance M06 to izrecno loči od M07. Drži tudi, da maloprodaja poleg trgovine edina nima directLossNote (segments.ts:153-186; ostali segmenti ga imajo na 91, 118, 213, 242, 278).

*Predlog.* label: "Kolikšna je bila po nabavni vrednosti neznana razlika (manko) v zadnjih 12 mesecih?"; unit: 'EUR/leto'; help: "Samo NEZNANA razlika v blagu, po nabavni vrednosti. Znano odpisano, poteklo ali znižano blago sodi v področje Presežna zaloga, nepojasnjene razlike v gotovini pa v vprašanje o blagajniških razlikah — sicer bo ista izguba šteta dvakrat."; explainer: "Vzemite manko iz zapisnika zadnje inventure — dokument je zanesljivejši od ocene. Če inventurirate vsakih šest mesecev, ga pomnožite z 2; če vsaki dve leti, ga delite z 2. Primer: 9.000 EUR ob polletni inventuri → 18.000 EUR na leto." Ohranitev sklica na zapisnik je nujna, ker raziskava §8.8 kot pravilni vhod navaja prav zadnjo inventuro z datumom; sprememba besedila na 12 mesecev sme spremeniti obdobje, ne pa vira podatka. V segments.ts (blok maloprodaja, 153-186) dodaj directLossNote: "Denar, ki dejansko odteka: inventurni manko, blagajniške razlike, odpisi, ekspresne dobave in neizterjani rabati."

*Preverba.* Ovržen del rationale: navodilo o letni normalizaciji ni "samo v help" — je tudi v explainerju (maloprodaja.ts:527-528); manjka izključno številčni primer. Predlagani explainer dopolnjen tako, da izrecno ohrani zapisnik zadnje inventure kot vir (§8.8 in Q31 anchorata prav nanj), sicer bi sprememba besedila na "12 mesecev" trgovca odvrnila od dokumenta k ugibanju. Predlagan konkreten tekst directLossNote namesto splošne zahteve.

*Vir v raziskavi.* Raziskava §8.8 ("vrednost manjka po nabavni vrednosti pri zadnji inventuri, skupaj z datumom in vzrokom"); Vprasalnik Q31; KPI_slovar K10; Bolecina_finance M06/M07; §9 KPI disciplina

### BP-07 · izboljsaj · teža srednja · preverba: popravljeno

**blagajnaMp / stocktakeHoursPerYear: "Koliko ur na leto skupaj porabite za inventure — s pripravo, štetjem in vnosom razlik?"**

*Utemeljitev.* PREVERJENO in DRŽI. Polje je na maloprodaja.ts:530-536, enota 'h/leto' je pravilna, compute je ne množi z 12 (577-583), plausibility jo pravilno deli z 12 (plausibility.ts:62). Res nima ne help ne explainer, čeprav je izpeljava (št. inventur × ljudje × ure) bistveno zanesljivejša od skupne ocene iz glave. Meja proti prevzemMp manjka: sprotno štetje po skupinah (stocktakeMethod, možnost 0) se pogosto opravi ob prevzemu in bi bilo lahko vpisano dvakrat.

*Predlog.* help: "Vse inventure v letu skupaj, v vseh poslovalnicah — priprava, štetje, vnos in usklajevanje razlik. Ur, ki ste jih že vpisali pri prevzemu blaga, tu ne ponavljajte." explainer: "Ocenite kot: število inventur na leto × število ljudi × ure na osebo. Primer: 1 letna inventura × 6 ljudi × 10 h + 4 h vnosa razlik ≈ 64 ur. Če zaradi inventure zaprete poslovalnico, izgubljene prodaje sem ne štejte — tu merimo samo ure dela."

*Preverba.* Ovržen konec predlaganega explainerja: "to bi bilo dvojno štetje s področjem Prazne police" je NAPAČNO. razpolozljivostMp meri izgubljeno prodajo zaradi stockouta (prazne police), ne zaradi zaprtja med inventuro — te izgube ne meri nobeno področje, zato sklic na dvojno štetje ne obstaja in bi obiskovalca zavedel. Nadomeščeno z "tu merimo samo ure dela". Sklic §19.2 (točka 4) umaknjen kot nepreverljiv v tem obsegu; §18 zadostuje.

*Vir v raziskavi.* Katalog_bolecin B16 ("Inventura zahteva zaprtje in ročni vnos — ure + izgubljena prodaja"); Podprocesi SP14; raziskava §8.8 in §18 (opomba pri vseh časovnih vprašanjih)

### BP-08 · ohrani · teža nizka · preverba: potrjeno

**blagajnaMp / stocktakeMethod (contextOnly): "Kako izvajate inventuro?"**

*Utemeljitev.* PREVERJENO in DRŽI. Polje je na maloprodaja.ts:537-549, contextOnly: true (542), privzetek 2 (541). Test maloprodaja.test.ts:342-345 res varuje, da premik s 0 na 3 ne spremeni nobenega zneska. V prodajni pripravi se contextOnly odgovori pojavijo kot iztočnice, ko drugih ni (salesPlaybook.ts:106-115), vir odgovora pa je označen z answerSource (salesReport.ts:412 → answerLabels.ts:147-150), zato privzetek 2 ni predstavljen kot strankina izjava. Možnost 3 ("Redne inventure praktično ne izvajamo") je najmočnejši signal, da vpisanemu manku ni mogoče verjeti.

*Preverba.* Sklic answerLabels.ts je 147-150 in ne 148-151 (funkcija answerSource se začne na 147). Sicer brez sprememb.

*Vir v raziskavi.* PANTHEON_zemljevid PM04; Register_virov PANT-03; raziskava §8.3 in §10; Podprocesi SP14

### BP-09 · izboljsaj · teža visoka · preverba: popravljeno

**blagajnaMp / mainCause (BLAGAJNA_CAUSES): "Kaj je glavni vzrok?" — vključno z vzrokoma "Kraja kupcev ali zunanjih oseb" in "Poškodbe blaga pri rokovanju ali skladiščenju"**

*Utemeljitev.* DELNO DRŽI. Vseh pet vzrokov (maloprodaja.ts:462-468) res pojasnjuje predvsem manko, izbrani delež pa se v compute (553) pripne VSEM trem izidom (563-584) — tudi dnevnim zaključkom in izvedbi inventur. Odgovor "Kraja" (external → 0,25, addressableShare.ts:32) torej res zniža potencial dnevnih zaključkov na četrtino in sproži ugovor externalCause (salesPlaybook.ts:159-162). To je resnična napaka. NE DRŽI pa trditev, da seznam nima vzroka za blagajniške razlike: možnost 'Napake pri delu na blagajni' (people, maloprodaja.ts:465) je natanko vzrok B14. Neujemanje s §8.8 pri poškodbi (koda physical 0,15, raziskava "nizka do srednja" enako kot kraja) drži, vendar je koda konservativnejša od raziskave.

*Predlog.* (a) V compute uvedi dva deleža: addressableShareOf(BLAGAJNA_CAUSES, input.mainCause) obdrži izid 'Inventurni manko', kapacitetna izida ('Dnevni zaključki blagajn', 'Izvedba inventur') pa naj dobita isti delež, RAZEN kadar je izbrani vzrok kategorije 'external' ali 'physical' — tedaj naj padeta na ADDRESSABLE_SHARE.unknown (0,30). Fiksnih 0,75 NE uvajaj: to bi ročno delo razglasilo za najbolje naslovljivo ne glede na odgovor, kar je v nasprotju z Q35 ("naslovljivost je odvisna od vzroka"), hkrati pa bi PODRLO test maloprodaja.test.ts:313-323, ki zahteva, da imajo pri privzetem vzroku VSI izidi vseh stroškovnih modulov delež natanko ADDRESSABLE_SHARE.unknown. Predlagana varianta z 0,30 privzetega stanja ne spremeni in test prestane. (b) 'Poškodbe blaga …' PUSTI v kategoriji 'physical' (0,15). (c) Novega vzroka za blagajniške razlike NE dodajaj.

*Preverba.* Del (a) POPRAVLJEN: predlagani fiksni delež 0,75 za kapacitetna izida bi podrl test maloprodaja.test.ts:313-323 (privzeti vzrok mora dati 0,30 pri VSEH izidih) in bi hkrati dvignil izračunano korist ne glede na odgovor — to je natanko lažna natančnost, ki jo pravila prepovedujejo. Nadomeščeno z rešitvijo, ki kapacitetna izida ščiti pred kaznijo zaradi kraje ali poškodbe, ne da bi jih napihnila. Del (b) OVRŽEN: prekvalifikacija poškodbe iz 0,15 v 0,25 bi na podlagi ohlapnega raziskovalnega pasu ("nizka do srednja") zvišala znesek — koda je konservativnejša in konservativnost nikoli ne precenjuje. Del (c) OVRŽEN kot dejansko napačen: vzrok 'Napake pri delu na blagajni' (maloprodaja.ts:465, kategorija people) že pokriva blagajniške razlike.

*Vir v raziskavi.* Raziskava §8.8 (tabela vzrokov: kraja "nizka do srednja", poškodba "nizka do srednja"); Vprasalnik Q35 ("naslovljivost je odvisna od vzroka"); Katalog_bolecin B14, B17; PANTHEON_zemljevid PM11

### BP-10 · dodaj · teža visoka · preverba: popravljeno

**(manjka v blagajnaMp) "Koliko so v zadnjih 12 mesecih skupaj znašali nepojasnjeni manjki gotovine ob zaključkih blagajn?"**

*Utemeljitev.* PREVERJENO in DRŽI. Bolecina_finance res vodi "M06 | Blagajniške razlike | potrjen znesek | neposredna izguba | POS/finance | ločeno od manka", M07 pa inventurni manko posebej; Katalog_bolecin B14 je samostojna bolečina. V kodi tega polja ni nikjer, help polja shrinkageEUR (maloprodaja.ts:524) pa razlike izrecno potisne v inventurni manko — razlika v gotovini se sešteje z nabavno vrednostjo blaga in izgubi se prav podatek, ki loči napako na blagajni od kraje. blagajnaMp ima danes 7 polj, kar je zgornja meja testa maloprodaja.test.ts:304-311.

*Predlog.* key 'tillCashShortfallEUR', label "Koliko so v zadnjih 12 mesecih skupaj znašali nepojasnjeni manjki gotovine ob zaključkih blagajn?", kind 'number', unit 'EUR/leto', default 0, allowUnknown: true. help: "Samo razlike med izkupičkom in zaključkom blagajne, ki jih niste znali pojasniti. Neznano razliko v BLAGU vpišite pri inventurnem manku." explainer: "Seštejte manjke gotovine iz dnevnih zaključkov zadnjih 12 mesecev; viškov ne prištevajte in ne odštevajte — višek ni denar, ki bi odtekel, je pa enak signal slabe kontrole. Primer: 6 blagajn × pribl. 2 EUR manjka na teden × 52 ≈ 620 EUR na leto. Če razlik ne beležite, odkljukajte 'Tega podatka ne vodimo'." Izid: bucket 'directLoss', label 'Nepojasnjene blagajniške razlike', z istim naslovljivim deležem kot manko. POGOJ IZVEDBE: polje se sme dodati SAMO hkrati s popravkom help polja shrinkageEUR (glej tam) — sicer isti evro ostane v obeh vprašanjih in nastane dvojno štetje, ki ga danes ni. VRSTNI RED: če se izvede razdelitev modula na M06 in M07 (glej triage.prompt), naj to polje pristane v novem modulu blagajniških zaključkov in meje 7 polj sploh ni treba dvigati; dvig meje testa maloprodaja.test.ts:304-311 na 8 je le zasilna pot, kadar razdelitve ne bo.

*Preverba.* Vsi sklici in registrske navedbe držijo (M06 v Bolecina_finance dobesedno vsebuje "ločeno od manka"). Preverjena tudi aritmetika primera: 6 × 2 × 52 = 624 ≈ 620. Dodana dva pogoja, ki ju ugotovitev izpusti: (1) polje se ne sme dodati brez hkratnega popravka help polja shrinkageEUR, sicer se ustvari novo dvojno štetje; (2) prednost ima uvrstitev v razdeljeni modul, dvig testne meje na 8 pa je zasilna in ne prva možnost.

*Vir v raziskavi.* Katalog_bolecin B14; Bolecina_finance M06 ("Blagajniške razlike | potrjen znesek | neposredna izguba | ločeno od manka"); raziskava §8.7 ("neposredne blagajniške razlike"); Podprocesi SP12; Vprasalnik Q30

### BP-11 · ohrani · teža nizka · preverba: potrjeno

**blagajnaMp / pantheon: "Blagajna POS z davčnim potrjevanjem in samodejnim dnevnim zaključkom", "Inventura s terminali, tudi sprotna po skupinah", "Sledljivost gibanja artikla od prevzema do računa"**

*Utemeljitev.* PREVERJENO in DRŽI. Alineje so na maloprodaja.ts:586-590. Prva stoji na PANT-01 in FURS-01 (raziskava §8.7 uradno navaja samodejne zaključke, davčno potrjevanje, več blagajn in lokacij), druga na PANT-03 in PM04 ("Inventura in skener | visoka"), tretja na PM02 ("Zaloga po lokacijah in prenosi | visoka"). V prodajni pripravi se alineje prenesejo kot to, kar ponudba naslavlja (salesPlaybook.ts:129-133 → addresses), zato je bistveno, da nobena ne obljublja preprečevanja kraje — PM11 je "nizka neposredno" in zahteva fizične ukrepe. Ta meja je spoštovana.

*Preverba.* Brez sprememb; vsi sklici na kodo in registre preverjeni.

*Vir v raziskavi.* Register_virov PANT-01, PANT-03; PANTHEON_zemljevid PM01, PM02, PM04, PM11; raziskava §8.3, §8.7, §11.1

### BP-12 · ohrani · teža nizka · preverba: potrjeno

**prevzemMp / triage.prompt: "Koliko ročnega dela imate s prevzemom blaga, dokumenti dobaviteljev in prenosi med enotami?"**

*Utemeljitev.* PREVERJENO in DRŽI. Prompt in možnosti so na maloprodaja.ts:608-616. Lestvica je res lestvica enega obsega ("Večina poteka elektronsko" → "Za to je potreben skoraj cel človek") in ne meša neposredne izgube s časom, kar je natanko napaka, ki jo ima triaža blagajne. Ustreza Q16 in področju 5 iz §16.2 ("prevzem, prenosi in sledljivost").

*Preverba.* Brez sprememb.

*Vir v raziskavi.* Vprasalnik Q16; raziskava §16.2 (področje 5); Procesi P03, P04

### BP-13 · ohrani · teža nizka · preverba: potrjeno

**prevzemMp / summary: "Prevzem dobav, usklajevanje dobavnic in računov ter prenosi blaga med poslovalnicami in skladiščem."**

*Utemeljitev.* PREVERJENO in DRŽI. Povzetek je na maloprodaja.ts:606-607 in našteje natanko tri izide, ki jih compute vrne (670-692): prevzem, usklajevanje dokumentov, prenosi. Skladen je z razmejitvijo §18 ("primerjava dobavnice in računa → prevzem/nabava", "knjiženje računa → finance/računovodstvo") in z Bolecina_finance M05.

*Preverba.* Brez sprememb.

*Vir v raziskavi.* Raziskava §8.11 in §18; Bolecina_finance M05

### BP-14 · izboljsaj · teža visoka · preverba: popravljeno

**prevzemMp / goodsReceiptHoursPerMonth: "Koliko skupnih ur mesečno porabite za prevzem blaga in vnos dobaviteljskih dokumentov?"**

*Utemeljitev.* PREVERJENO in DRŽI. Polje je na maloprodaja.ts:618-624, res brez help in brez explainer, medtem ko ga sosednji polji imata (631-634, 643-646). Je največja postavka modula (671-677: ure × operativna ura × 12). Meja obstaja samo v eno smer: marzeMp:395 pravi "Ne vključujte prevzema blaga in usklajevanja dokumentov — to meri področje Prevzem", obratne meje proti etiketiranju in vnosu cen tu ni, prav tako ne proti financeHz (bookingHoursPerMonth, horizontal.ts:154-166) in dokumentiHz (approvalHoursPerMonth, horizontal.ts:365-377), ki sta v maloprodajnem segmentu obe na voljo (segments.ts:159-173).

*Predlog.* help: "Fizični prevzem in vnos dobavnice v sistem. Tiskanje etiket in vnos cen šteje področje Cene, akcije in marža, knjiženje računa področje Računovodstvo in finance, potrjevanje in iskanje dokumentov pa področje Dokumentacija in e-poslovanje — teh ur tu ne ponavljajte." explainer: "Ocenite kot: število dobav na mesec × minute na dobavo ÷ 60. Primer: 80 dobav × 25 min ≈ 33 ur na mesec. Če prevzem opravlja več ljudi hkrati, seštejte ure vseh."

*Preverba.* Sklica na horizontal.ts popravljena (bookingHoursPerMonth 154-166, approvalHoursPerMonth 365-377). V predlaganem help so imena področij zamenjana z DEJANSKIMI naslovi modulov, kot jih obiskovalec vidi: 'Cene, akcije in marža' (maloprodaja.ts:335), 'Računovodstvo in finance' (horizontal.ts:141), 'Dokumentacija in e-poslovanje' (horizontal.ts:352) — predlagani okrajšavi 'Finance' in 'Dokumentacija' v vprašalniku ne obstajata in bralec ju ne bi našel. Aritmetika primera preverjena: 80 × 25 / 60 = 33,3 h.

*Vir v raziskavi.* Raziskava §8.3 ("Meriti: dobave mesečno, postavke na dobavo, minute na postavko") in §18; Vprasalnik Q29; Katalog_bolecin B05, B23; Bolecina_finance M05, M11

### BP-15 · izboljsaj · teža srednja · preverba: popravljeno

**prevzemMp / documentMatchingHoursPerMonth: "Koliko ur mesečno porabite za usklajevanje dobavnic, računov in cen z dobavitelji?"**

*Utemeljitev.* PREVERJENO in DRŽI. Polje je na maloprodaja.ts:625-635, vrednoteno po administrativni in ne operativni uri (678-684), z izpeljavo in primerom v explainerju (632-634). Njegov help (631) varuje samo pred prvim vprašanjem istega modula. Sosednji horizontali merita zelo blizu: financeHz bookingHoursPerMonth "ročno knjiženje in priprava dokumentov ... vnos računov" (horizontal.ts:154-166) in dokumentiHz approvalHoursPerMonth "ročno potrjevanje dokumentov — računov, naročil, pogodb" (horizontal.ts:365-377). Raziskava mejo postavi trojno.

*Predlog.* help: "Ne vključujte samega prevzema iz prvega vprašanja, ne knjiženja računa in ne potrjevanja dokumentov — ta dva meri področji Računovodstvo in finance ter Dokumentacija in e-poslovanje. Tu šteje samo iskanje in reševanje razlik med naročilom, dobavnico in računom." (Explainer ostane nespremenjen; test explainers.test.ts:34-38 zahteva le, da explainer ni dobesedna kopija help — pogoj ostane izpolnjen.)

*Preverba.* Sklica na horizontal.ts popravljena (154-166 in 365-377). Imena področij v predlaganem help zamenjana z dejanskimi naslovi modulov. Dodano preverjanje, da sprememba ne poruši varovala 'pojasnilo ni prepisano pomožno besedilo'.

*Vir v raziskavi.* Raziskava §8.11 in §18 (tabela dvojnega štetja); Katalog_bolecin B06; Podprocesi SP04; Bolecina_finance M05 ("knjiženje ostane M11")

### BP-16 · izboljsaj · teža srednja · preverba: popravljeno

**prevzemMp / transferHoursPerMonth: "Koliko ur mesečno porabite za prenose blaga med poslovalnicami in skladiščem ter za usklajevanje razlik pri prenosih?"**

*Utemeljitev.* PREVERJENO in DRŽI. Polje je na maloprodaja.ts:636-647 z mejo proti prevozu (643) in primerom (644-646). Obratne meje proti razpolozljivostMp ni: tam stockCheckHoursPerMonth izrecno pove "Prenos blaga sam po sebi šteje področje Prevzem" (maloprodaja.ts:137), tu pa nič ne prepove, da bi trgovec iste klice med enotami vpisal še enkrat. Obe področji sta lahko izbrani hkrati (segments.ts:159-181, moduleEngine.ts:245-253). Plausibility ju sicer vidi (obe polji sta h/mesec), a opozori šele nad 40 % kapacitete (plausibility.ts:27).

*Predlog.* help: "Šteje samo administrativni del prenosa, ne prevoza. Klicev in iskanja, ali je artikel v drugi enoti, tu ne štejte — to meri področje Prazne police in nedobavljivi artikli."

*Preverba.* Vsi sklici preverjeni in držijo. V predlaganem help zamenjano ime področja z dejanskim naslovom modula 'Prazne police in nedobavljivi artikli' (maloprodaja.ts:93).

*Vir v raziskavi.* Raziskava §18 in §8.3; Katalog_bolecin B07; Podprocesi SP07; Bolecina_finance M05

### BP-17 · ohrani · teža nizka · preverba: potrjeno

**prevzemMp / receiptMethod (contextOnly): "Kako prevzemate blago?"**

*Utemeljitev.* PREVERJENO in DRŽI. Polje je na maloprodaja.ts:648-660, contextOnly: true (653), privzetek 2 (652); test maloprodaja.test.ts:352-355 varuje, da ne premakne zneska. Možnost 0 preslika na eSLOG (PANT-04, PM06), možnost 3 ("Prevzem naknadno, včasih šele po prodaji") je natanko SP05 in hkrati najboljša razlaga za manko, izmerjen v drugem področju. Lestvica je urejena po zrelosti in berljiva brez pojasnila.

*Preverba.* Brez sprememb.

*Vir v raziskavi.* Podprocesi SP05; PANTHEON_zemljevid PM06; Register_virov PANT-04; raziskava §8.3, §10

### BP-18 · izboljsaj · teža visoka · preverba: popravljeno

**prevzemMp / mainCause (PREVZEM_CAUSES): "Kaj je glavni vzrok?" — zlasti možnost "Dobavitelji dokumentov ne pošiljajo elektronsko"**

*Utemeljitev.* PREVERJENO in DRŽI. Možnost je na maloprodaja.ts:600 s kategorijo 'external' → 0,25 (addressableShare.ts:32), delež pa se v compute (664) pripne VSEM trem kapacitetnim izidom (670-692). Registri trdijo nasprotno: Katalog_bolecin B23 ("PDF/papirni dokumenti se prepisujejo … e-dokument / OCR") ima naslovljivost "visoka", Procesi P03 "visoka", PANTHEON_zemljevid PM06 "visoka–srednja". Posledica ni le nižji znesek: delež 0,25 samodejno sproži ugovor externalCause (salesPlaybook.ts:159-162) za bolečino, ki je med najbolj naslovljivimi — prodajnik torej dobi navodilo, naj se brani tam, kjer bi moral ponujati.

*Predlog.* Možnost preubesedi v "Dokumente dobaviteljev prepisujemo ročno (papir ali PDF)" in prekvalificiraj v 'data'. Hkrati dodaj ozko zapisan zares zunanji vzrok "Dobavitelji dobavljajo brez najave ali z odstopanji od naročila" (external), da seznam ne ostane brez zunanje možnosti. POZOR na obseg posledice: sprememba 0,25 → 0,75 potroji naslovljivi del CELOTNEGA modula (vsi trije izidi delijo isti delež), zato mora ob spremembi v maloprodaja.ts stati komentar z virom (B23/P03/PM06) in oznako KALIBRACIJA, tako kot ga imajo drugi deleži v addressableShare.ts:11-13. Test maloprodaja.test.ts:313-323 sprememba ne poruši, ker privzeti vzrok ostane 'Ne vemo' (0,30).

*Preverba.* Vse registrske navedbe preverjene in držijo dobesedno. Predlog dopolnjen z dvema pogojema: (1) izrecno opozorilo, da gre za trojitev naslovljivega deleža celotnega modula in ne le za popravek uvrstitve — sprememba mora nositi zapisan vir in oznako KALIBRACIJA; (2) preverjeno, da privzeti odgovor ostane 'Ne vemo' in test privzetega deleža ne pade.

*Vir v raziskavi.* Katalog_bolecin B23 (naslovljivost "visoka"), B05; Procesi P03 ("visoka"); PANTHEON_zemljevid PM06 ("visoka–srednja"); Vprasalnik Q35; raziskava §8.11

### BP-19 · dodaj · teža nizka · preverba: popravljeno

**(manjka v prevzemMp) "Koliko dobav dobaviteljev prevzamete v povprečnem mesecu?"**

*Utemeljitev.* DELNO DRŽI. Registrska podlaga je preverjena: Vprasalnik Q29 ("Koliko dobav, postavk in razlik med naročilom, dobavnico in računom imate mesečno? | # / min | SCALE_BASE") in Problem_podatki M05. Modul ima danes 5 polj (maloprodaja.ts:617-662), kar je spodnja meja testa maloprodaja.test.ts:304-311, zato je prostor. NIŽJA VREDNOST, KOT JO TRDI UGOTOVITEV: contextOnly polje ne vstopa v plausibility (plausibility.ts:58) in ne v oceno zanesljivosti (potential.ts:192), obiskovalec pa ga na rezultatu nikjer ne vidi — izpelje se nikjer ne izpiše. Vrednost je torej izključno za prodajnika v seznamu odgovorov prodajne priprave (salesReport.ts:407-413), medtem ko vprašalnik podaljša za vse.

*Predlog.* key 'deliveriesPerMonth', label "Koliko dobav dobaviteljev prevzamete v povprečnem mesecu?", kind 'number', unit 'dobav/mesec', default 0, contextOnly: true, brez allowUnknown. Enota ne začne s 'h/', zato pokritvenega testa plausibility.test.ts:73-85 ne prebudi. Denarne postavke za razlike med naročilom, dobavnico in računom NE dodajaj: neizterjani rabati in dobaviteljska odstopanja so že v marzeMp (unclaimedRebatesEUR, maloprodaja.ts:376-388) in bi bil isti evro štet dvakrat. Če se predlog izvede, naj se hkrati doda še izpis izpeljave ("60 h na 80 dobav = 45 minut na dobavo") v prodajno pripravo — brez tega polje ne opravi naloge, zaradi katere je predlagano.

*Preverba.* Severina znižana s srednje na nizko. Ugotovitev trdi, da število omogoča preverbo ur, a spregleda, da contextOnly polje nikjer ne sproži nobene primerjave — izpeljave ("45 minut na dobavo") ne izračuna in ne izpiše nobena koda. Predlog zato dopolnjen s pogojem, da se hkrati doda izpis izpeljave v prodajno pripravo; brez tega polje samo podaljša vprašalnik brez zamenjave. Preverjeno tudi, da nova enota ne poruši pokritvenega testa urnih enot.

*Vir v raziskavi.* Vprasalnik Q29; Problem_podatki M05 (SCALE_BASE); raziskava §8.3, §17 (tip SCALE_BASE); Katalog_bolecin B06

### BP-20 · izboljsaj · teža nizka · preverba: popravljeno

**prevzemMp / pantheon: "Elektronski prevzem dobaviteljevega dokumenta (eSLOG)", "Terminali za prevzem in kontrolo dobave", "Medskladiščni prenosi z evidenco razlik"**

*Utemeljitev.* PREVERJENO in DRŽI. Alineje so na maloprodaja.ts:694-698. Prva je pokrita: raziskava §8.9 dobesedno navaja, da Datalab pri ePoslovanju navaja eSlog za naročila, ponudbe, račune, dobropise/bremepise in vračilnice (PANT-04). Tretja stoji na PM02 ("Zaloga po lokacijah in prenosi | visoka"). Druga je SKLEP: uradno so navedeni skenerji za označevanje in inventuro (§8.3, PM04 "Inventura in skener"), prevzem s terminalom je procesna izpeljava iz tega, Raziskovalne_vrzeli pa zahtevajo preverbo pred obljubo. Ker se alineje prenesejo v prodajno pripravo kot to, kar ponudba naslavlja (salesPlaybook.ts:129-133), nobena ne sme prehiteti potrditve konfiguracije.

*Predlog.* Drugo alinejo preubesedi: "Skeniranje in mobilna inventura, uporabna tudi pri prevzemu — obseg za vašo konfiguracijo je treba potrditi." Prvo alinejo pusti nespremenjeno; njen obseg je uradno dokumentiran (naročila, ponudbe, računi, dobropisi/bremepisi, vračilnice) in ga ni treba naštevati v alineji, ki jo bere prodajnik — če se naštevanje doda, mora biti zapisano dobesedno po viru, ne po spominu.

*Preverba.* Preverjeno: seznam dokumentov eSLOG (naročila, ponudbe, računi, dobropisi/bremepisi, vračilnice) JE dokumentiran — v raziskavi §8.9, ne pa v vrstici PANT-04 registra virov, ki navaja le "eSlog, e-dokumenti, partnerji". Predlagani dodatek k prvi alineji zato umaknjen: alineja je že pravilna, naštevanje dokumentov pa bi v prodajno pripravo vneslo seznam, ki ga alineja ne potrebuje in ki bi ga bilo treba prepisati dobesedno po viru. Ostane samo popravek druge alineje.

*Vir v raziskavi.* Register_virov PANT-03, PANT-04; PANTHEON_zemljevid PM02, PM04, PM06; raziskava §8.3, §8.9, §11.2; Raziskovalne_vrzeli G02

### BP-21 · ohrani · teža nizka · preverba: potrjeno

**diagnostikaMp / summary: "Štiri vprašanja o podatkih in odpornosti procesa. Ne prispevajo k finančnemu rezultatu."**

*Utemeljitev.* PREVERJENO in DRŽI. Povzetek je na maloprodaja.ts:846 in izrecno pove, da vprašanja ne prispevajo k finančnemu rezultatu — s tem v besedilu, ki ga vidi obiskovalec, brani pravilo, da se tveganje ne monetizira. Modul res nima triaže (843-846; test maloprodaja.test.ts:298-300) in se zato prek resolveActiveModules prikaže vedno (moduleEngine.ts:245-253), na skupni zadnji strani z modulom E (splitIntoInputPages, moduleEngine.ts:265-270). Ustreza koraku 7 priporočenega toka §16.1.

*Preverba.* Brez sprememb.

*Vir v raziskavi.* Raziskava §16.1 (korak 7); §5.2 (štiri ekonomske košarice, tveganje ni med njimi); §24 P0

### BP-22 · izboljsaj · teža visoka · preverba: popravljeno

**diagnostikaMp / stockAccuracy: "Ali se zaloga v sistemu ujema z dejansko zalogo na polici?"**

*Utemeljitev.* PREVERJENO in DRŽI. Privzetki so 1/1/2/1 (maloprodaja.ts:852, 859, 866, 873). Prek riskLevelFromScore (shared.ts:47-52) to da 2/6 = 0,333 in 3/6 = 0,5 — oba nad pragom 0,3 in pod 0,6, torej DVE oceni 'medium' brez enega samega klika, z besedilom "Podatki so delni. Odstopanje praviloma opazite šele ob inventuri ali mesečnem obračunu …" (maloprodaja.ts:825-827). Ta trditev o podjetju gre pred stranko (ResultsView.tsx:123-131 → RiskCard.tsx), v prodajno pripravo (salesReport.ts:331) in v izvoz (exportRecord.ts:220, 236-237). Na oceno zanesljivosti res ne vpliva: polja kind 'choice' se v potential.ts:195-199 preskočijo pred štetjem števil, diagnostikaMp pa zaradi total === 0 (potential.ts:217) v razmerje sploh ne vstopi. Drži tudi, da bi zastavica unknown na diagnostičnem odgovoru globalno preprečila oznako 'high' (potential.ts:238 zahteva unknownAnswers === 0).

*Predlog.* Ostani ZNOTRAJ maloprodaje: v maloprodaja.ts definiraj lokalno lestvico MP_ASSURANCE_CHOICES = ASSURANCE_CHOICES + { value: 4, label: 'Tega ne vemo' }, namenoma BREZ zastavice unknown (razlog zgoraj). Privzetek vseh štirih diagnostičnih polj naj bo 4. compute (maloprodaja.ts:877-895) naj razsežnost oceni samo iz odgovorjenih vprašanj (vrednost !== 4) in naj izida ne vrne, kadar ni odgovorjeno nobeno; pri enem odgovorjenem naj riskLevelFromScore dobi maxScore 3 namesto 6, sicer se ocena umetno prepolovi. Skupne ASSURANCE_CHOICES v shared.ts:40-45 NE spreminjaj — uporablja jih šest drugih dejavnosti in poseg vanje presega to področje; če se popravek izkaže za pravilnega, naj se prenese v shared.ts kot ločena naloga z lastnim pregledom vseh sedmih diagnostik.

*Preverba.* Vsi izračuni in sklici preverjeni in držijo (sklic exportRecord.ts:235-236 popravljen na 220 in 236-237). Popravljen OBSEG posega: ugotovitev sama predlaga popravek v shared.ts, kar bi spremenilo diagnostične module vseh sedmih dejavnosti — to je zunaj pregledanega področja in bi ga bilo treba presojati za vsako dejavnost posebej. Predlog preusmerjen v lokalno lestvico v maloprodaja.ts. Dodana izvedbena podrobnost, ki jo ugotovitev izpusti: pri enem odgovorjenem vprašanju je treba maxScore znižati s 6 na 3, sicer nov privzetek sistematično znižuje oceno tveganja.

*Vir v raziskavi.* KPI_slovar K09; raziskava §7.3, §16.3 ("Ne vem nikoli ni 0"), §24 P0; Vprasalnik Q34

### BP-23 · ohrani · teža nizka · preverba: potrjeno

**diagnostikaMp / knowsItemMargin: "Ali poznate dejansko maržo po posameznem artiklu in poslovalnici?"**

*Utemeljitev.* PREVERJENO in DRŽI. Polje je na maloprodaja.ts:855-861 in ne prispeva evra (compute 877-895 vrne samo izida koša 'risk'). Ustreza K01 in glavnemu diagnostičnemu vprašanju §7.3; brez tega podatka so postavke koša lostMargin iz treh drugih področij ocena in ne meritev. Je edini most med diagnostiko in prispevno maržo iz skupne finančne osnove (contexts/maloprodaja.ts:137-146).

*Preverba.* Sklic contexts/maloprodaja.ts je 137-146 (blok contributionMargin) namesto 137-145. Vsebinsko brez sprememb; velja pa zanj isti popravek privzetka kot za stockAccuracy.

*Vir v raziskavi.* KPI_slovar K01; raziskava §5.1, §7.3, §8.12; Raziskovalne_vrzeli (definicija marže in stroška ure); Katalog_bolecin B26

### BP-24 · izboljsaj · teža visoka · preverba: popravljeno

**diagnostikaMp / goodsTraceability: "Ali lahko za posamezen artikel zanesljivo ugotovite dobavitelja, serijo in rok uporabnosti?"**

*Utemeljitev.* PREVERJENO in DRŽI. Vprašanje je na maloprodaja.ts:862-868 in v enem stavku zahteva dobavitelja, serijo IN rok uporabnosti. Raziskava §4.2 lote/serijske številke in rok uporabe uvršča med ŠEST sekundarnih lastnosti, ki naj sprožijo POGOJNA vprašanja, ne med skupna. Privzetek 2 (866) trgovcu z modo, DIY ali pohištvom sam dvigne procesno tveganje na 'medium' z besedilom o odpoklicu dobavitelja (maloprodaja.ts:832), ki zanj ne obstaja, in ta trditev pristane pred stranko (ResultsView.tsx:123-131). Motor pogojnega prikaza res nima: ModuleField (moduleTypes.ts:133-175) pozna allowUnknown in contextOnly, showIf pa ne obstaja nikjer v kodi.

*Predlog.* label: "Ali lahko za posamezen artikel zanesljivo ugotovite, od katerega dobavitelja in iz katere dobave je — in kjer to velja, tudi serijo ali rok uporabnosti?" Uporabi isto lokalno lestvico kot pri stockAccuracy (MP_ASSURANCE_CHOICES z vrednostjo 4), pri čemer naj bo za to polje oznaka možnosti 4 zapisana kot 'Serij in rokov pri našem blagu ni' — z enakim ravnanjem v compute: vrednost 4 pomeni NEODGOVORJENO, razsežnost se oceni samo iz drugega vprašanja (in maxScore 3), ne šteje pa ne kot dobra ne kot slaba ocena. Ker sta obe možnosti vrednosti 4 semantično različni ('ne vemo' proti 'ni relevantno'), naj bosta v kodi ločeni konstanti in ne ena skupna lestvica z eno oznako. Pogojni prikaz celotnega vprašanja (showIf na ModuleField + vprašanje o lastnostih blaga v koraku konteksta, Q02) je večji poseg v motor in presega popravek modula.

*Preverba.* Vsi sklici preverjeni in držijo; potrjeno, da showIf v ModuleField (moduleTypes.ts:133-175) res ne obstaja. Predlog usklajen s popravkom pri stockAccuracy: namesto ločene 'lokalne lestvice' za eno polje naj obe polji uporabita isto mehaniko sentinele 4 z ločenima oznakama, ker sta pomena različna ('Tega ne vemo' proti 'Serij in rokov pri našem blagu ni'). Dodano isto pravilo maxScore 3 pri enem odgovorjenem vprašanju.

*Vir v raziskavi.* Raziskava §4.2 (šest sekundarnih lastnosti kot pogojne veje), §8.3 (posebna veja za sledljivost), §16.1; Vprasalnik Q02; Problem_podatki (tip NOT_APPLICABLE, §17 "izključi brez pretvarjanja v nič"); Katalog_bolecin B08

### BP-25 · ohrani · teža nizka · preverba: potrjeno

**diagnostikaMp / keyPersonIndependence: "Ali poslovalnica deluje normalno tudi brez ključne osebe?"**

*Utemeljitev.* PREVERJENO in DRŽI. Polje je na maloprodaja.ts:869-875. Meri procesno odpornost — edino od štirih razsežnosti, na katero informacijski sistem sam ne odgovori — in prav zato je pošteno, da je izid opisan kot stopnja tveganja in ne kot znesek (PROCESS_RISK_NOTE, maloprodaja.ts:830-834). Za persono lastnik/CEO je to najboljša iztočnica pogovora in kaže na predpogoj PR11. Velja pa zanj isti popravek privzetka kot za stockAccuracy.

*Preverba.* Brez sprememb.

*Vir v raziskavi.* Raziskava §6 (persone in "jobs to be done"), §20.2; Predpogoji_funkcij PR11; Persona_bolecina (Lastnik/CEO)

### BP-26 · izboljsaj · teža srednja · preverba: potrjeno

**diagnostikaMp / pantheon: "Sprotna zaloga in marža po artiklu ter poslovalnici", "Serije, loti in roki uporabnosti s popolno sledljivostjo", "Dokumentiran proces namesto znanja v glavah"**

*Utemeljitev.* PREVERJENO in DRŽI. Druga alineja je na maloprodaja.ts:898 in obljublja "popolno sledljivost" natanko tam, kjer registri zahtevajo preverbo PRED obljubo: Raziskovalne_vrzeli G02 se glasi "Sledljivost | loti, serije, FEFO in odpoklic v ciljni konfiguraciji | visoko | pred obljubo funkcionalnosti | Datalab/partner", raziskava §25 (točka 2) pa isto navaja med vrzelmi. §11.2 opozarja, da je sledljivost lota učinkovita le, če se lot zajema na vseh kritičnih točkah. Alineje se prenesejo v prodajno pripravo kot to, kar ponudba naslavlja (salesPlaybook.ts:129-133).

*Predlog.* "Serije, loti in roki uporabnosti — obseg sledljivosti in FEFO je treba potrditi za vašo konfiguracijo (velja le pri blagu, ki serije ali roke sploh ima)." Prvo in tretjo alinejo pusti nespremenjeni; obe sta procesni trditvi brez tehnične obljube.

*Preverba.* Brez vsebinskih sprememb; navedba G02 preverjena dobesedno v registru.

*Vir v raziskavi.* Raziskovalne_vrzeli G02 (dobesedno); raziskava §11.2, §2.1, §25 (točka 2); Bolecina_resitev M05

### BP-27 · premakni · teža visoka · preverba: popravljeno

**Modul E kot celota — prikaz samo uporabnikom PANTHEON (isTechnicalRiskModuleVisible)**

*Utemeljitev.* DELNO DRŽI. Pogoj je na contexts/index.ts:58-62 in se uveljavi v CalculatorFlow.tsx:150-158. Smiseln je za SQL Server in Windows Server, ne pa za ZIERDED: R04 v Regulatornem koledarju obveznost B2B e-računov od 1. 1. 2028 veže na strukturirano domačo izmenjavo dokumentov ne glede na sistem, GOV-01 pa je uraden vir. Najbolj zadene prav trgovca na Excelu in papirju (contexts/maloprodaja.ts:96-97, pas 0,25–0,40), torej tistega, ki modula nikoli ne vidi. Vpliv na ICP je preverjen: brez odkljukanega roka pade urgency na 0,2 (icp.ts:253-259), pri uteži 0,1 in lestvici points = value × weight × 100 (icp.ts:349) je razpon do 8 točk od 100, meji pasov pa sta 70 in 45 (icp.ts:138-143). NE DRŽI pa trditev, da svetovalec o tem ni obveščen: opomba v icp.ts:257 se glasi "Pozor: modul z roki se podjetju brez PANTHEON-a sploh ne prikaže, zato to ni nujno podatek o podjetju" in se izpiše kot note dimenzije. Drži le, da wasTechnicalRiskModuleShown (salesReport.ts:533-541) nima nobenega klicatelja — preverjeno z iskanjem po src in content.

*Predlog.* Pogoj naj velja na ravni POSTAVKE in ne modula: ModuleEChecklistItem (legacy.ts:245-250) dobi zastavico pantheonOnly?: true za sqlServer2016 in windowsServer2016, eInvoiceZierded pa se prikaže vsem. moduleE.fields se sestavi iz filtriranega MODULE_E_ITEMS (legacy.ts:275-294), compute bere vhod po ključu in ostane nedotaknjen; ker mora filtriranje poznati profil, ga izvedi kot izbiro različice modula v CalculatorFlow.tsx:150-158. POZOR: buildIcpSignals bere deadlineDates neposredno iz MODULE_E_ITEMS (salesReport.ts:368-370) in ne iz prikazanih polj — po spremembi mora brati isti filtriran seznam, sicer bo odkljukan ZIERDED pri ne-PANTHEON podjetju sicer štel, neprikazana strežniška roka pa ostaneta trajno neodkljukana in tiho vlečeta urgency navzdol. Funkcijo wasTechnicalRiskModuleShown bodisi izpiši v prodajni pripravi bodisi odstrani — mrtva koda, ki obljublja varovalo, je slabša od njene odsotnosti.

*Preverba.* Ovržen del rationale: trditev, da "varovalo ni uporabljeno nikjer", je pretirana — opomba v icp.ts:257 svetovalca izrecno opozori, da odsotnost rokov ni podatek o podjetju. Drži samo, da je wasTechnicalRiskModuleShown mrtva koda. Predlog dopolnjen z izvedbeno pastjo, ki jo ugotovitev spregleda: buildIcpSignals (salesReport.ts:368-370) bere MODULE_E_ITEMS neposredno in ga je treba filtrirati skupaj s polji, sicer se ICP po spremembi obnaša napačno.

*Vir v raziskavi.* Raziskava §8.11 in §12 ("B2B e-računi 2028 | strukturirana izmenjava dokumentov doma B2B"); Regulatorni_koledar R04, R08; Register_virov GOV-01, MS-01

### BP-28 · izboljsaj · teža srednja · preverba: popravljeno

**Modul E / sqlServer2016: "Uporabljamo SQL Server 2016"**

*Utemeljitev.* PREVERJENO in DRŽI. Postavka je na legacy.ts:254-259 z warningDate '2026-07-14' in besedilom "potekla 14. 7. 2026". Register_virov MS-01 v opombi navaja "razširjena podpora je potekla 15. 7. 2026" — evidenci se res razhajata za en dan in ena od njiju je napačna. Drži tudi drugi del: maloprodajni vprašalnik izpolnjuje direktor, vodja trgovine, nabava ali finance (contexts/maloprodaja.ts:100-110), različice strežnika praviloma ne pozna nihče od njih, neodkljukano polje pa se v ICP bere enako kot "roka ni" (icp.ts:253-259), čeprav pomeni "ne vem". Potrditveno polje tega po zasnovi ne more izraziti (kind 'checkbox', default 0, legacy.ts:279-284).

*Predlog.* label ostane. Dodaj help: "Če tega ne veste, vprašajte svojega IT skrbnika — na izračun ne vpliva, na nujnost pa." in explainer: "Razširjena podpora za SQL Server 2016 se je iztekla julija 2026; po tem datumu ni več varnostnih popravkov, kar je pri blagajnah z osebnimi in plačilnimi podatki drugačno tveganje kot pri pisarniškem strežniku. Vir: Microsoft lifecycle (MS-01)." IZVEDBENA OPOMBA: ModuleEChecklistItem (legacy.ts:245-250) danes polj help in explainer sploh nima — tip je treba razširiti, moduleE.fields (275-284) pa ju mora prenesti na ModuleField, sicer se besedili nikjer ne izpišeta; ob tem začne veljati varovalo explainers.test.ts:29-31 (help ⇒ explainer), ki mu predlog ustreza. Datum najprej uskladi z MS-01 in ga zapiši na enem mestu; dokler razhajanje ni razrešeno, konkretnega dneva ne navajaj v besedilu, ki ga odnese stranka.

*Preverba.* Razhajanje datuma preverjeno in potrjeno dobesedno iz registra. Dodana izvedbena ovira, ki jo ugotovitev izpusti: ModuleEChecklistItem in preslikava v moduleE.fields danes ne poznata help/explainer, zato predlagani besedili brez razširitve tipa ne bi bili nikjer vidni. Iz predlaganega explainerja umaknjen konkreten datum, dokler razhajanje med kodo in MS-01 ni razrešeno — poročilo, ki ga stranka odnese, ne sme nositi datuma, ki mu naša lastna evidenca nasprotuje.

*Vir v raziskavi.* Regulatorni_koledar R08; Register_virov MS-01 ("razširjena podpora je potekla 15. 7. 2026"); raziskava §14.1; §2.1 (standard dokazovanja)

### BP-29 · ohrani · teža nizka · preverba: potrjeno

**Modul E / windowsServer2016: "Uporabljamo Windows Server 2016"**

*Utemeljitev.* PREVERJENO in DRŽI. Postavka je na legacy.ts:260-265, warningDate '2027-01-12', besedilo "Podpora za Windows Server 2016 se konča 12. 1. 2027" — skladno z R08 ("WS 2016 do januarja 2027"). Postavka je privzeto neodkljukana (kind 'checkbox', default 0, legacy.ts:279-284), zato brez klika ne ustvari nobenega tveganja — nasprotno od diagnostičnega modula, kjer privzetki oceno ustvarijo sami. Besedilo opozorila je gola izjava o roku brez ocene škode in spoštuje pravilo, da se tveganje ne monetizira.

*Preverba.* Sklic na legacy.ts je 260-265 in ne 260-264 (vnos se zaključi na vrstici 265). Sicer brez sprememb.

*Vir v raziskavi.* Regulatorni_koledar R08; raziskava §14.1; §5.2

### BP-30 · izboljsaj · teža visoka · preverba: popravljeno

**Modul E / eInvoiceZierded: "Nimamo urejenega kanala za e-račune"**

*Utemeljitev.* PREVERJENO in DRŽI. Postavka je na legacy.ts:266-272. Znesek "globa do 3.000 EUR" ni ne v raziskavi ne v registrih — iskanje po obeh virih ne najde niti ene omembe globe ali zneska 3.000 v tem kontekstu; GOV-01 potrjuje samo sprejem zakona in datum 1. 1. 2028. Trditev "kupec vam preprosto ne bo mogel plačati" je za maloprodajo prevelika: R04 obveznost veže na "strukturirano domačo izmenjavo dokumentov" med poslovnimi subjekti, opomba GOV-01 pa izrecno pravi "ne pomeni ukinitve B2C papirnih računov", večina prometa trgovca na drobno pa je B2C. Postavka je poleg tega edina zanikano formulirana v sicer pritrdilnem seznamu ("Nimamo …" proti "Uporabljamo …"), kar pri potrditvenih poljih sistematično vodi v napačno odkljukanje.

*Predlog.* label: "Račune dobaviteljem in poslovnim kupcem izmenjujemo brez e-računa (eSLOG)". warningText: "Od 1. 1. 2028 bo izmenjava e-računov med domačimi poslovnimi subjekti obvezna. Računov potrošnikom to ne zadeva — zadeva pa vaše dobavitelje in poslovne kupce." Znesek globe izpusti; brez navedenega člena in vira ga ni dovoljeno zapisati v dokument, ki ga stranka odnese. Naziv zakona navajaj samo, če je preverjen v GOV-01; register nosi naslov novice, ne uradnega naslova predpisa. Postavka naj bo vidna tudi podjetjem brez PANTHEON-a (glej sodbo o vidnosti modula E).

*Preverba.* Neobstoj vira za globo 3.000 EUR preverjen v raziskavi in v registrih — potrjeno. Iz predlaganega warningText umaknjen dobesedni naslov zakona ("Zakon o izmenjavi elektronskih računov in drugih elektronskih dokumentov"): register GOV-01 nosi naslov vladne novice, ne preverjenega uradnega naslova predpisa, in bi šlo za isto vrsto nepreverjene navedbe kot globa, ki jo ugotovitev pravilno graja.

*Vir v raziskavi.* Raziskava §8.11, §12 ("B2B e-računi 2028 | strukturirana izmenjava dokumentov doma B2B"); Regulatorni_koledar R04; Register_virov GOV-01 ("ne pomeni ukinitve B2C papirnih računov"); §2.1 standard dokazovanja


---

## V · Manjkajoča področja

### V-01 · dodaj · teža visoka · preverba: popravljeno

**MANJKA: nabavni proces — ure za pripravo in oddajo naročil dobaviteljem (polje 'purchaseOrderHoursPerMonth' v prevzemMp)**

*Utemeljitev.* Preverjeno v kodi: segments.ts:159-173 res našteva 13 idjev, od tega 11 triažnih (diagnostikaMp in E triaže nimata). Nobeno polje ne meri časa naročanja: razpolozljivostMp meri iskanje zaloge po enotah (maloprodaja.ts:130-141) in ekspresne dobave (121-129), marzeMp rabate (375-388), prevzemMp pa prevzem (618-624) in usklajevanje dokumentov PO dobavi (625-635). Raziskava §8.2 (vrst. 236 'Meriti: naročila mesečno, ure na naročilo') in vrst. 238 ('V nabavi ostanejo strošek procesa, razlike, rabati in ekspresne dobave') to izrecno umeščata. Koš capacity in adminHourCostEUR sta pravilna (contexts/maloprodaja.ts:120-126: administrativna ura izrecno pokriva nabavo in kategorijskega vodjo). Opozorilo o plausibility.ts drži: assessHoursPlausibility (47-77) sešteva samo enoti 'h/mesec' in 'h/leto' (vrst. 61-62), zmnožek dveh polj bi ji ušel.

*Predlog.* DODAJ ZDAJ v prevzemMp kot četrto urno polje pred receiptMethod (maloprodaja.ts:648). Polje: key 'purchaseOrderHoursPerMonth', kind 'number', unit 'h/mesec', default 0. Besedilo: »Koliko ur mesečno gre za pripravo in oddajo naročil dobaviteljem — od pregleda zaloge do potrditve naročila?« help: »Samo delo PRED dobavo. Prevzem blaga in usklajevanje dobavnic z računi merita prejšnji dve vprašanji.« explainer: »Ure za nabavo: pregled zaloge in prodaje, sestava naročila, klici in usklajevanje z dobaviteljem, popravki po oddaji. Ocenite kot število naročil × minute na naročilo. Primer: 120 naročil na mesec × 12 min ≈ 24 ur.« Izid: { bucket: 'capacity', label: 'Priprava in oddaja naročil dobaviteljem', valueEUR: ure × context.adminHourCostEUR × MONTHS_PER_YEAR, hoursPerMonth: ure, addressableShare }. OBVEZNE SOSEDNJE SPREMEMBE, ki jih ugotovitev izpušča: (1) title prevzemMp (maloprodaja.ts:605) → 'Nabava, prevzem blaga in dokumenti', summary (606-607) → '...naročila dobaviteljem, prevzem dobav, usklajevanje dobavnic in računov ter prenosi...', triage.prompt (609) → '...z naročanjem, prevzemom blaga, dokumenti dobaviteljev in prenosi med enotami?' — brez tega trgovec, ki ga muči prav naročanje, področja v triaži ne izbere in polja nikoli ne vidi; (2) help polja documentMatchingHoursPerMonth (maloprodaja.ts:631) dopolniti z »in ne priprave naročil iz prvega vprašanja«; (3) nova možnost v PREVZEM_CAUSES (maloprodaja.ts:595-601), dodana PRED konec seznama: { label: 'Naročila sestavljamo ročno, brez predloga iz sistema', category: 'planning' }; (4) niz formule v content/methodology.ts:168-171 dopolniti z 'naročila × strošek administrativne ure × 12'.

*Preverba.* Vsi sklici na kodo in raziskavo so točni (segments.ts:159-173 EXACT, §8.2 vrst. 236 EXACT). Popravljeno dvoje: (a) trditev, da je nabava 'edino področje brez doma', temelji na napačni aritmetiki — raziskavnih področij 6 in 7 (blagajna, manko) pokriva en sam modul blagajnaMp, področje 11 pa dva (financeHz, dokumentiHz); sklep vseeno drži, ker nabave ne meri nihče; (b) dodane manjkajoče posledice: polje je nevidno, dokler se ne razširi naslov, summary in triažni poziv prevzemMp, ker moduleEngine.ts:245-253 prikaže samo v triaži izbrana področja. Sklic na methodology popravljen s 169-171 na 168-171 (ključ prevzemMp je v vrstici 168).

*Vir v raziskavi.* §16.2 tč. 3 (vrst. 532); §8.2 (vrst. 236, 238); B03, B06; Q27; K16; Bolecina_finance M03; Procesi P02

### V-02 · dodaj · teža visoka · preverba: popravljeno

**MANJKA: šifrant artiklov — ure za vnos in popravke artiklov, podvojeni zapisi, manjkajoče črtne kode (polje 'itemDataHoursPerMonth' v marzeMp)**

*Utemeljitev.* Preverjeno: priceMaintenanceHoursPerMonth (maloprodaja.ts:389-399) meri cene, akcije in etikete; catalogSyncHoursPerMonth (759-769) usklajevanje MED kanali; dokumentiHz dokumente. Vzdrževanja šifranta ne meri nihče. Register Katalog_bolecin: 'B01 | P01 | Podvojeni ali nepopolni artikli | čas popravkov + napake | kapaciteta / neposredna izguba | master data | visoka' — naslovljivost visoka je potrjena. Raziskava §8.1 (vrst. 220-228) zahteva prav to meritev ('število novih/spreminjanih SKU na mesec; čas do aktivacije; število popravkov po objavi') in pravi, da se napake razmnožijo v POS, spletu, poročilih in računovodstvu.

*Predlog.* DODAJ ZDAJ v marzeMp (maloprodaja.ts:332-458) kot prvo urno polje pred priceMaintenanceHoursPerMonth. Naslov (335) razširiti na »Artikli, cene in marža«, summary (336-337) na »Šifrant artiklov, prodaja po napačni ceni, neizkoriščeni dobaviteljski pogoji ter ročno vzdrževanje cenikov in akcij.«, triažni poziv (339-340) dopolniti z »...ali da je bil artikel vnesen napačno oziroma podvojeno«. Polje: key 'itemDataHoursPerMonth', kind 'number', unit 'h/mesec', default 0, koš capacity × adminHourCostEUR × 12. Besedilo: »Koliko ur mesečno gre za urejanje šifranta artiklov — vnos novih, popravke, podvojene zapise, manjkajoče črtne kode in enote?« help: »Vnos in popravek CENE ni tu — meri ga naslednje vprašanje; usklajevanje s spletno trgovino meri področje Spletna prodaja.« explainer: »Delo s šifrantom, preden se artikel prodaja: vnos novega artikla, popravki po objavi, iskanje podvojenih zapisov, dopolnjevanje EAN, enote in davčne stopnje. Ocenite: koliko novih ali popravljenih artiklov na mesec × koliko minut na artikel. Primer: 150 artiklov × 6 min ≈ 15 ur.« Hkrati dopolniti help polja priceMaintenanceHoursPerMonth (395) z obratno mejo: »Vnosa in popravkov samih artiklov tu ne štejte — meri jih prejšnje vprašanje.« Nova možnost v MARZE_CAUSES (324-330), dodana na konec seznama (»Ne vemo« doda mainCauseField sam): { label: 'Šifrant artiklov ni urejen — podvojeni ali nepopolni zapisi', category: 'data' } → 0,75 po addressableShare.ts:29.

*Preverba.* Sklici na kodo točni. Popravljeno: (a) meja proti priceMaintenanceHoursPerMonth je bila enostranska — nov help je opozarjal le v eno smer, zato bi trgovec ure vnosa novega artikla lahko štel dvakrat; dodana obratna meja v obstoječi help; (b) posledica v methodology je večja, kot je navedeno: content/methodology.ts:151-152 opisuje ZASTARELO formulo ('letna nabavna vrednost × delež izgube zaradi napačnih cen'), rationale v 153-154 pa isto napako ponavlja ('vprašana kot delež nabavne vrednosti') — koda že od popravka v maloprodaja.ts:426-433 računa iz annualRevenueEUR × wrongPriceSalesSharePercent × marginGapPercent. Popraviti je torej treba oboje, ne le formule; (c) dodati je treba tudi razširitev triažnega poziva, sicer polje ostane nevidno; (d) headline v content/actions/actions.ts:181 ('nabavne cene, akcije in marža') je treba uskladiti z novim naslovom področja.

*Vir v raziskavi.* §8.1 (vrst. 220-228); §7.1 (vrst. 194); B01; K17; Procesi P01; Podprocesi SP01/SP02

### V-03 · dodaj · teža srednja · preverba: popravljeno

**MANJKA: izpad blagajne, povezave ali sistema — izgubljena prodaja (polje 'outageLostSalesEUR' v blagajnaMp)**

*Utemeljitev.* Preverjeno: blagajnaMp (maloprodaja.ts:470-591) meri zaključke, manko in inventure; izpada ne meri nobeno polje v segmentu. Register: 'B15 | P07 | POS izpad ustavi prodajo | ure izpada x izgubljena marža | marža | infrastruktura | srednja | PANT-01'. Opozorilo o zastavici je TOČNO in ključno: blagajnaMp danes nima ne usesRevenue ne usesMargin (maloprodaja.ts:470-474), usesRevenue.test.ts pa preverja skladnost compute.toString() z zastavico — brez 'usesMargin: true' test pade. Koš lostMargin je pravilen (moduleTypes.ts:20-30). Ker gre za izmerjeno preteklih 12 mesecev in ne za verjetnost prihodnjega izpada, pravilo 'tveganje se ne monetizira' ni kršeno.

*Predlog.* DODAJ, a ZA postavkama pod tč. 1 in 2. Kam: blagajnaMp, za shrinkageEUR (maloprodaja.ts:529). Polje: key 'outageLostSalesEUR', kind 'number', unit 'EUR/leto', default 0, allowUnknown: true. Izid: { bucket: 'lostMargin', label: 'Nezaslužena marža med izpadi blagajne', valueEUR: input.outageLostSalesEUR * context.contributionMarginRate, addressableShare }. OBVEZNO: blagajnaMp dobi 'usesMargin: true' (maloprodaja.ts:470-474). Besedilo: »Kolikšno prodajo ste v zadnjih 12 mesecih izgubili, ker blagajna, povezava ali sistem ni deloval?« help: »Vrednost prodaje, ne marže — maržo izračunamo sami. Prodaja, ki se je zgodila pozneje ali pri drugi blagajni, ni izgubljena.« explainer: »Ocenite kot: koliko izpadov × koliko ur × povprečen promet na uro, nato odštejte del, ki se je zgodil pozneje. Primer: 3 izpadi × 2 uri × 700 EUR ≈ 4.200 EUR, od tega polovica kupcev počaka → vpišite pribl. 2.100 EUR. Če ste med izpadom pisali račune ročno in jih pozneje vnesli, prodaja ni izgubljena — ure vnosa vpišite pri zaključkih blagajn.« Naslov (472) razširiti na »Blagajna, zaključki, izpadi in manko«, summary (473-474) in triažni poziv (476-477) ustrezno. NE dodajati vzroka 'infrastruktura' v BLAGAJNA_CAUSES — potrjeno pravilno: vsi izidi modula si delijo en addressableShare (maloprodaja.ts:553, 564-583), zato bi physical 0,15 potisnil navzdol tudi manko in zaključke.

*Preverba.* Trije popravki. (a) Severity znižana z 'visoka' na 'srednja': register Katalog_bolecin B15 nosi naslovljivost 'srednja', ne visoka, vzrok pa je 'infrastruktura' — postavka je torej šibkeje odpravljiva od B01 in P02. (b) Predlagani explainer je bil v neskladju z lastnim help: help je izključeval kupce, ki so počakali, primer izračuna (3 × 2 × 700 = 4.200 EUR) pa je štel ves promet med izpadom, torej tudi te kupce — v razpolozljivostMp isto stvar ureja substitutionShare (maloprodaja.ts:71-87, faktor 1 − substitucija). Explainer popravljen tako, da odbitek zahteva izrecno. (c) Dodane manjkajoče posledice: naslov, summary in triažni poziv blagajnaMp ne omenjajo izpada, zato polja ne bi videl nihče, ki področja ne izbere zaradi zaključkov. Opozorilo: niz formule v content/methodology.ts:162-165 je že zdaj zastarel ('305 odprtih dni', koda pa uporablja OPEN_DAYS_PER_YEAR_BY_CHOICE iz maloprodaja.ts:47) — ob tej spremembi ga popravite.

*Vir v raziskavi.* B15; SP13; §8.7 (vrst. 284-292); PM01; Predpogoji PR07; vrzel G03

### V-04 · dodaj · teža srednja · preverba: popravljeno

**MANJKA: rok 1. 1. 2028 za e-račune in delež strukturiranih e-dokumentov B2B — ne-PANTHEON trgovec tega sploh ne vidi (Q33, R04)**

*Utemeljitev.* Preverjeno in točno: postavka 'eInvoiceZierded' z warningDate '2028-01-01' je v legacy.ts:266-272; CalculatorFlow.tsx:156 filtrira modul E prek isTechnicalRiskModuleVisible (contexts/index.ts:58-62), ta pa zahteva option.isPantheon. V maloprodaji imata pasova 'posNoStockLink' (contexts/maloprodaja.ts:96) in 'excelPaper' (97) najširši pas izboljšave 0,25–0,40 in roka 2028 ne vidita nikoli. To je vsebinsko napačno: ZIERDED ni PANTHEON-ova zadeva, ampak zakonski rok za vsakogar (raziskava §8.11, vrst. 330-336). Drugi del ugotovitve (delež strukturiranih dokumentov kot novo polje) pa ne zdrži: receiptMethod (maloprodaja.ts:648-660) že ima natanko to lestvico — možnost 0 'Elektronski dokument dobavitelja neposredno v sistem' proti 2 'Ročni vnos iz papirne dobavnice'.

*Predlog.* DODAJ ZDAJ, a samo prvo polovico, in sicer NA RAVNI POSTAVKE, ne funkcije: MODULE_E_ITEMS (legacy.ts:253-273) naj dobi zastavico 'requiresPantheon?: true' na 'sqlServer2016' in 'windowsServer2016', 'eInvoiceZierded' pa ne; moduleE.fields se sestavi iz vseh postavk, filter za obiskovalca brez PANTHEON-a pa pusti samo postavke brez zastavice. isTechnicalRiskModuleVisible (contexts/index.ts:58-62) ostane nespremenjen za module, spremeni pa se pogoj v CalculatorFlow.tsx:156 tako, da modul E ni več izpuščen v celoti — sicer pade sedem obstoječih trditev v potential.test.ts:139-190. Dopolniti je treba tudi wasTechnicalRiskModuleShown (salesReport.ts:533-541), da 'ni rokov' ne pomeni več 'modula ni bilo'. DRUGO POLOVICO (novo polje 'structuredDocShare') NE DODAJAJ: namesto tega naj receiptMethod, ki danes nima ne help ne explainer, dobi explainer: »Vprašanje ni, ali dokumente dobivate po e-pošti, ampak ali prihajajo v obliki, ki se knjiži brez prepisovanja — PDF in skenirana dobavnica se prepišeta ročno. Od 1. 1. 2028 bo izmenjava e-računov med poslovnimi subjekti v Sloveniji obvezna.« Znesek se ne računa nikjer: ročne ure prepisovanja meri dokumentiHz (horizontal.ts:385-392).

*Preverba.* Sklici točni (legacy.ts:266-272 EXACT, CalculatorFlow.tsx:156 EXACT, contexts/maloprodaja.ts:96-97 EXACT). Popravljeno: (a) predlog (a) je bil pretirano ohlapen — 'sprememba pravila vidnosti contexts/index.ts:58-62' bi razveljavila sedem obstoječih trditev v potential.test.ts:139-190 in bi ne-PANTHEON obiskovalcem prikazala tudi SQL Server 2016 in Windows Server 2016, kar je prav tisti šum, ki ga komentar v contexts/index.ts:48-57 prepoveduje; zamenjano s filtrom na ravni postavke; (b) predlog (b) OVRŽEN kot podvojitev: receiptMethod (maloprodaja.ts:648-660) že meri isto lestvico s štirimi možnostmi, dodatno contextOnly polje bi prevzemMp raztegnilo na sedem polj brez novega podatka. Namesto tega je predlagan explainer na obstoječem polju, ki je edino kontekstno polje modula brez pojasnila.

*Vir v raziskavi.* Q33; R04; K19; §8.11 (vrst. 330-336); GOV-01

### V-05 · dodaj · teža srednja · preverba: popravljeno

**MANJKA: status vira podatka — izvoz / dokument / ocena / razpon / ne vem (Q34, §16.3)**

*Utemeljitev.* Preverjeno: §16.3 (vrst. 543-555) res zahteva sedem statusov, §19.1 (vrst. 621) pa faktorje 1,00 / 0,90 / 0,70 / 0,50 / 0,30 in tehtanje s finančnim pomenom. Kalkulator danes pozna natanko tri stanja (answerLabels.ts:148-151) plus allowUnknown (moduleTypes.ts:160-168). Denarno tehtanje res že obstaja (potential.ts:170, 221-223, annualEurByModule 243-250). Tudi opozorilo o motorju je TOČNO: navadno contextOnly polje bi bilo preskočeno v assessConfidence (potential.ts:192) in v isModuleAnswered (moduleEngine.ts:233), torej brez učinka.

*Predlog.* DODAJ KMALU, po področju in ne po polju. Novo vprašanje na koncu vsakega stroškovnega modula: »Od kod so številke, ki ste jih pravkar vnesli?« Možnosti: 0 »Izvoz ali poročilo iz sistema« (1,00), 1 »Dokument ali zapisnik zadnje inventure« (0,90), 2 »Naša interna ocena« (0,70), 3 »Ugibanje oziroma razpon« (0,50), 4 »Tega ne vem« (unknown: true). Privzetek 4. NOVA ZMOŽNOST MOTORJA: nova zastavica na ModuleField ('sourceDeclaration?: true'), ki jo assessConfidence obravnava izrecno — utež modula se pomnoži s faktorjem vira POVRH razmerja izpolnjenih polj, ne namesto njega: weightedFilled += weight × (filled / total) × sourceFactor (potential.ts:221-222). Polje mora biti izvzeto iz štetja total/filled (potential.ts:202) in iz plausibility (nima urne enote, zato je že varno). POZOR NA STRANSKI UČINEK, ki ga je treba zavestno sprejeti: privzeta možnost 4 nosi unknown: true, potential.ts:195-199 pa vsak unknown šteje in vrstica 238 zaradi njega prepove oznako 'visoka' — kdor vira ne izbere, torej nikoli ne dobi visoke zanesljivosti. To je pravilno, a mora biti zapisano v buildConfidenceReason (salesReport.ts:497-525), sicer razlaga ne pove, zakaj je oznaka padla. Dodati še stolpec NA KONEC CSV_COLUMNS (exportRecord.ts:146-198).

*Preverba.* Vsi sklici točni, tudi vrstici 732 in 621 na znak natančno. Popravljeno: (a) računica klikov je napačna — obiskovalec izpolni le TRI stroškovna področja (segments.ts:176-179, recommendedCount: 3, selectTopModules v moduleEngine.ts:192-210), zato gre za 3 dodatne klike in ne 6, po polju pa bi jih bilo ~15 in ne ~30; predlog je torej cenejši, kot je bil predstavljen, zato je severity znižana z 'visoka' na 'srednja' le glede nujnosti, ne pomena; (b) formula je bila napačno zapisana: 'utež pomnoži s faktorjem vira NAMESTO z razmerjem izpolnjenih polj' bi zavrgla podatek o izpolnjenosti — mora biti zmnožek obojega; (c) dodan neopažen stranski učinek privzetka z unknown: true na oznako 'visoka' (potential.ts:195-199, 238); (d) izpuščena je bila možnost 'panožni benchmark' (0,30) — to je pravilno, ker je kalkulator nikoli ne vpiše sam.

*Vir v raziskavi.* Q34; §16.3 (vrst. 543-555); §19.1 (vrst. 621); F11; §24 P0 (vrst. 732)

### V-06 · dodaj · teža srednja · preverba: popravljeno

**MANJKA: lastnosti blaga — pokvarljivo, sezonsko, loti/serije, visoka vrednost, tehtano (Q02)**

*Utemeljitev.* Preverjeno: raziskava §4.2 (vrst. 110-121) našteva ŠEST sekundarnih lastnosti (šesta je 'prodaja prek več kanalov ali držav') in pravi, da je klasifikacija pomembnejša od splošne oznake trgovina; §24 P1 (vrst. 739) jo uvršča med postavke z največjim vplivom na natančnost. Kontekstni korak res vpraša samo businessType, currentSystem in role (contexts/maloprodaja.ts:64-110). Register ICP_scoring res nosi 'Kompleksnost zaloge | 0.2' — a to je utež REGISTRA, ne kode: config/icp.ts pozna sedem razsežnosti (size 0,2; opportunity 0,2; pain 0,2; role 0,15; urgency 0,1; engagement 0,1; reachability 0,05) in razsežnosti o zalogi sploh nima.

*Predlog.* DODAJ ZDAJ kot četrto kontekstno vprašanje brez številk, z izrecno zavestjo, da samo po sebi ne spremeni nobene ocene. Novo neobvezno polje v SegmentContext (contextTypes.ts:131-166) tipa večizbira, npr. goodsTraits?: { legend: string; options: { id: string; label: string }[] }, in ustrezno polje v BusinessProfile (contextTypes.ts:224+) kot string[]. Besedilo: »Kaj velja za vaše blago? (izberite vse, kar drži)« Možnosti: pokvarljivo ali z rokom uporabnosti; sezonsko; vodeno po lotih ali serijskih številkah; visoka vrednost na kos; tehtano ali s spremenljivo mero. Šesta lastnost iz §4.2 (več kanalov) se namenoma izpusti — pokriva jo businessType. Brez privzetka, brez vstopa v katero koli formulo. OBVEZNE POSLEDICE, ki jih ugotovitev izpušča: (1) intro kontekstnega koraka (contexts/maloprodaja.ts:60) se glasi »Tri vprašanja, ki ne sprašujejo po številkah« — popraviti na štiri; (2) StepContext.tsx danes izrisuje samo radijske skupine (funkcija group), zato potrebuje novo pot za potrditvena polja; (3) canProceed (StepContext.tsx:45-51) NE sme zahtevati odgovora — 'nič od naštetega' je veljaven odgovor; (4) vrstica v qualification (salesReport.ts:280-292) in en stolpec NA KONEC CSV_COLUMNS z zlepljenimi idji. ŠELE NATO ima vrednost: brez (5) nove razsežnosti v config/icp.ts ali (6) uporabe v salesPlaybook.ts:106-115 ostane odgovor gol stolpec v izvozu.

*Preverba.* Sklica §4.2 (110-121) in §24 P1 (739) sta na vrstico natančna. Popravljeno štiri: (a) trditev 'ICP utež kompleksnost zaloge je 0,20, ocena pa danes nima vhoda' je zavajajoča — ta utež je v registru xlsx, v config/icp.ts pa te razsežnosti sploh NI, zato dodano vprašanje samo po sebi ICP ocene ne izboljša; brez dopolnitve icp.ts je učinek nič; (b) sklic contextTypes.ts:120-160 je napačen — SegmentContext je v vrsticah 131-166; (c) predlog je puščal odprto odločitev 'pet polj kind checkbox ALI novo polje v SegmentContext' — razvijalec bi moral izbrati sam; odločeno v prid SegmentContext, ker moduli po moduleEngine.ts:245-253 niso vedno prikazani; (d) dodane spregledane posledice: intro koraka izrecno obljublja tri vprašanja (contexts/maloprodaja.ts:60), StepContext.tsx pozna samo radie, canProceed pa bi novo vprašanje po nesreči naredil obveznega. Severity znižana z 'visoka' na 'srednja', ker je pred dopolnitvijo icp.ts ali playbooka učinek zgolj izvozni stolpec.

*Vir v raziskavi.* Q02; §4.2 (vrst. 110-121); §24 P1 (vrst. 739); Segment_bolecina S6/S7; ICP_scoring 'Kompleksnost zaloge'

### V-07 · dodaj · teža srednja · preverba: potrjeno

**MANJKA: poslovni model franšize, komisije in mešanega lastništva zaloge (Q03, arhetip 8)**

*Utemeljitev.* Potrjeno v celoti. businessType (contexts/maloprodaja.ts:64-73) res pozna pet oblik in arhetipa 8 ne; raziskava §4.1 vrst. 108 ga opisuje kot 'Franšiza, komisija ali hibrid B2B/B2C | zaloga ni vedno last podjetja', register Segmenti S8 enako, register Segment_bolecina pa za S8 predlaga prvo vprašanje 'Ali je lastništvo zaloge ločeno v evidenci?'. Nevarnost je resnična in preverjena: inventoryValueEUR (maloprodaja.ts:249-260) gre prek reducibleShareOf v releasableEUR (282) in naprej v koš oneTimeCapital (306-312); pomoč v vrstici 256 se glasi natanko 'Vnesite nabavno vrednost, ne prodajne.' in o lastništvu ne pove ničesar. Komisijsko blago bi tako pristalo med enkratno sprostljivim kapitalom — postavka, ki jo finančnik ovrže prva.

*Predlog.* DODAJ ZDAJ, dvoje in oboje je poceni. (1) Šesta možnost v businessType (contexts/maloprodaja.ts:72, za 'maloInVeleprodaja'): { id: 'fransizaKomisija', label: 'Franšiza, komisija ali mešano lastništvo zaloge' } — dodajanje na konec je varno, ker se businessType hrani kot id in ne kot indeks (exportRecord CSV stolpec 'businessType'). (2) Help polja inventoryValueEUR (maloprodaja.ts:256) razširiti na: »Vnesite nabavno vrednost, ne prodajne. Komisijskega blaga in blaga, ki ni vaša last, ne štejte — kapitala v njem nimate vezanega.« in isto mejo ponoviti v explainerju (257-259), sicer gumb '?' trdi drugače kot pomoč pod poljem. Znesek se s tem nikjer ne poveča, prepreči pa se najbolj napadljiva postavka poročila.

*Preverba.* Nič ovrženega: vsi sklici na kodo in raziskavo so preverjeno točni, vključno z dobesednim besedilom pomoči v maloprodaja.ts:256 in vrstico 108 raziskave. Dodano le pojasnilo, zakaj je dodajanje možnosti na konec varno (id, ne indeks — za razliko od možnosti vzroka, glej postavko o pickingu), in zahteva, da se ista meja zapiše tudi v explainer, sicer se pomoč in gumb '?' razideta.

*Vir v raziskavi.* Q03; §4.1 arhetip 8 (vrst. 108); Segmenti S8; Segment_bolecina S8

### V-08 · ohrani · teža nizka · preverba: popravljeno

**ZMOŽNOST: pogojni prikaz vprašanj glede na lastnosti blaga in poslovni model (showIf)**

*Utemeljitev.* Preverjeno: ModuleField (moduleTypes.ts:133-175) in ModuleDefinition (215-259) res nimata nobene zastavice za pogojni prikaz — showIf je nova zmožnost in ne konfiguracija. Obstoječi nadomestek deluje in je grobejši, a cenejši: obiskovalec v triaži izbere tri področja od enajstih (segments.ts:176-179, selectTopModules v moduleEngine.ts:192-210), zato že danes odgovarja na približno osemnajst vprašanj namesto na vseh. Pogojnost ima ceno tudi na izhodu: skrito vprašanje mora poročilo znati pojasniti, ker 'nismo vprašali' ni isto kot 'ni relevantno' (§16.3, vrst. 555).

*Predlog.* NE DODAJAJ ZDAJ — stanje ohrani. Zaporedje je: najprej Q02 in Q03 kot kontekst, po prvih ~50 vnosih preveriti, katere veje se sploh sprožijo, in šele nato pogojnost, in še to samo za dve veji, kjer se vprašanja res razlikujeta: (a) loti, roki in FEFO pri pokvarljivem blagu, (b) serijske številke in garancije pri visokovrednem blagu. Ko bo čas: zastavica naj visi na ModuleField ('showIf?: { key: string; equals: number }') in ne na modulu, da se ne podvaja s triažo; polje, ki se ni prikazalo, mora v salesReport.ts:407-413 dobiti izrecno oznako 'ni bilo vprašano', ne sme pa šteti med nedotaknjena polja (isUntouchedNumeric, salesReport.ts:482-488) — sicer bo salesPlaybook.ts:97-102 odpiral pogovor o vprašanju, ki ga stranka ni videla.

*Preverba.* Vsebina ugotovitve je potrjena in vsi sklici na kodo držijo (moduleTypes.ts:133-175 in 215-259 res brez pogojnosti; isUntouchedNumeric res v salesReport.ts:482-488). Popravljen je verdict: bil je 'dodaj', predlog pa se glasi 'NE DODAJAJ ZDAJ' — nasprotje. Pravilni verdict je 'ohrani'. Popravljen tudi sklic na salesPlaybook: iztočnice iz nedotaknjenih polj nastajajo v vrsticah 97-102, ne 106-115 (te obravnavajo kontekstna polja). Severity znižana s 'srednja' na 'nizka', ker gre za odločitev, da se ne stori nič.

*Vir v raziskavi.* Q02/Q03; §16.1 (vrst. 516-522); §16.3 (vrst. 555); §24 P1

### V-09 · dodaj · teža srednja · preverba: popravljeno

**MANJKA: obseg — število prodajnih mest in število aktivnih artiklov (SKU) (Q04, Q05)**

*Utemeljitev.* Preverjeno: §16.1 (vrst. 519) res postavi obseg v drugi korak toka, §24 P1 (vrst. 742) pa količinske imenovalce med prioritete. Število zaposlenih se res uporablja v plausibility.ts:47-77. tillCount res živi v blagajnaMp (maloprodaja.ts:486-492) in se vpraša samo, če je področje med tremi izbranimi v triaži. Število prodajnih mest res ni nikjer — businessType ga pozna le kvalitativno ('Ena poslovalnica' / 'Več poslovalnic', contexts/maloprodaja.ts:67-68).

*Predlog.* DODAJ ZDAJ za lokacije, SKU pa KMALU in samo skupaj z lastnostmi blaga (ista sprememba SegmentContext, StepContext in izvoza — ne dva ločena posega). Tip: izbira razpona, ne število. (1) »Koliko prodajnih mest imate?« → »1« / »2–5« / »6–15« / »Več kot 15«. (2) »Koliko aktivnih artiklov imate v prodaji?« → »Do 1.000« / »1.000–10.000« / »10.000–50.000« / »Več kot 50.000« / »Ne vem«. Nobeno ne vstopa v formulo, zato ni dvojnega štetja. Iste štiri posledice kot pri lastnostih blaga: polji v SegmentContext in BusinessProfile, izris v StepContext, dopolnitev introa (contexts/maloprodaja.ts:60) in vrstici v qualification (salesReport.ts:280-292) ter dva stolpca NA KONEC CSV_COLUMNS. Opombo o premiku tillCount v kontekst OVRZI: tillCount ni obseg, ampak vhod v formulo zaključkov (maloprodaja.ts:560-561) in razpon ga ne more nadomestiti — obe vprašanji smeta obstajati hkrati, ker merita različni stvari.

*Preverba.* Sklici na raziskavo (519, 742) so na vrstico natančni; sklic na blagajnaMp popravljen s 487-492 na 486-492. Popravljeno vsebinsko: (a) opomba 'ko bo število prodajnih mest v kontekstu, postane tillCount kandidat za premik' je zavajajoča — tillCount se v maloprodaja.ts:560-561 množi z minutami in odprtimi dnevi, razpon lokacij pa je nešteven; premik bi razbil edino postavko, ki jo je mogoče izmeriti z uro v roki; (b) predlog je razdeljen: obe vprašanji zahtevata isto spremembo SegmentContext, BusinessProfile, StepContext in izvoza, zato ju ni smiselno izvajati ločeno; (c) dodana ista spregledana posledica kot pri lastnostih blaga — intro koraka obljublja tri vprašanja brez številk.

*Vir v raziskavi.* Q04, Q05; §16.1 tč. 2 (vrst. 519); §24 P1 (vrst. 742); Segmenti S1–S3

### V-10 · dodaj · teža nizka · preverba: popravljeno

**MANJKA: OTIF dobavitelja — delež pravočasnih in popolnih dobav (K08, B06)**

*Utemeljitev.* Preverjeno: edina omemba dobavitelja je možnost vzroka 'Dobavitelji zamujajo ali dobavijo le del naročila' v POLICE_CAUSES (maloprodaja.ts:59, kategorija external → 0,25 po addressableShare.ts:32). Ta izbira res potisne naslovljivost celotnega področja na četrtino IN sproži ugovor 'externalCause' v prodajni pripravi (salesPlaybook.ts:159-162, pogoj addressableShare === 0.25), prodajnik pa nima številke, s katero bi trditev preveril. Raziskava §8.2 (vrst. 238) je izrecna: slab dobavitelj je vzrok, ne ERP prihranek — OTIF torej ne sme prinesti evrov, ker gospodarski učinek že merita lostSalesSharePercent in expressDeliveryCostEUR.

*Predlog.* DODAJ KMALU, za polje replenishmentMethod (maloprodaja.ts:154). Polje: key 'supplierOtif', kind 'choice', default 3, contextOnly: true. Besedilo: »Kolikšen del dobav pride pravočasno in v celoti?« Možnosti: 0 »Nad 95 %«, 1 »85–95 %«, 2 »Pod 85 %«, 3 »Tega ne merimo« (unknown: true). help: »Šteje se dobava, ki je prišla ob obljubljenem roku IN v celoti — delna dobava ob pravem času ne šteje.« explainer: »Vzemite zadnjih 20 dobav in preštejte, koliko jih je prišlo ob obljubljenem roku in v celoti. Če od 20 dobav 3 zamujajo ali so nepopolne, je OTIF 85 %. Številka ni ocena vaših dobaviteljev za pogajanja — pove nam, koliko praznih polic je sploh mogoče odpraviti z boljšim sistemom in koliko ne.« Zastavica unknown: true ima učinek tudi pri contextOnly polju: assessConfidence jo res preskoči (potential.ts:192) in collectFields tudi (salesReport.ts:472), a answerSource (answerLabels.ts:148-151) prek salesReport.ts:412 v poročilu izpiše '„Ne vem"' — kar je prav ta podatek, ki ga prodajnik potrebuje. Časovni razpored: kmalu in ne zdaj, ker ima razpolozljivostMp že šest polj in ker so prva prioriteta ure naročanja.

*Preverba.* Vsi sklici preverjeni in točni, vključno s sprožilcem 'externalCause' pri natanko 0,25 (salesPlaybook.ts:160). Popravljeno: (a) severity znižana s 'srednja' na 'nizka' — polje ne spremeni nobenega zneska, nobene naslovljivosti in nobene ocene zanesljivosti; njegova edina vloga je iztočnica za prodajnika, kar je manj od vsakega urnega polja v tem seznamu; (b) dodano pojasnilo, da unknown: true na contextOnly polju ni mrtva oznaka, ker jo answerSource prek salesReport.ts:412 vseeno izpiše — ugotovitev tega ni preverila in bi kdo lahko zastavico po nepotrebnem odstranil.

*Vir v raziskavi.* K08; B06; §8.2 (vrst. 236-238); Bolecina_resitev M03; Proces_KPI P02

### V-11 · dodaj · teža srednja · preverba: popravljeno

**MANJKA: znesek razlik med naročilom, dobavnico in računom (B06)**

*Utemeljitev.* Preverjeno: prevzemMp meri ČAS usklajevanja (documentMatchingHoursPerMonth, maloprodaja.ts:625-635), denarja razlik pa ne meri nihče; register Katalog_bolecin za B06 res navaja obe posledici ('kapaciteta / neposredna izguba'), §18 (vrst. 609) pa primerjavo dobavnice in računa umešča v prevzem/nabavo. Trditev, da je meja proti sosednjim postavkam 'čista', pa NE zdrži do konca: rabati so res ločeni (marzeMp, 375-388), pri manku (shrinkageEUR, 517-529, 'samo NEZNANA razlika') pa je meja odvisna od tega, po čem je bil prevzem knjižen. Kdor prevzem knjiži po RAČUNU in ne po dejanski dobavi, plačanega a neprejetega blaga ne vidi kot dokumentarne razlike — pokaže se mu šele kot nepojasnjen manko ob inventuri. Isti evro bi tedaj štel dvakrat.

*Predlog.* DODAJ KMALU, za documentMatchingHoursPerMonth (maloprodaja.ts:635). Polje: key 'invoiceDifferenceEUR', kind 'number', unit 'EUR/leto', default 0, allowUnknown: true, koš directLoss. Besedilo: »Koliko ste v zadnjih 12 mesecih plačali za blago, ki ga niste prejeli, ali po ceni, višji od naročene?« help: »Samo razlike, ki ste jih odkrili ob dokumentih in jih niste reklamirali. Če prevzem knjižite po računu in razliko odkrijete šele ob inventuri, je ta že v inventurnem manku — tu je ne ponavljajte. Dogovorjeni rabati in bonusi so v področju Cene.« explainer: »Ocenite: koliko razlik na mesec × povprečna razlika × 12. Primer: 4 razlike × 60 EUR × 12 ≈ 2.900 EUR. Če razlik ne beležite, odkljukajte 'Tega podatka ne vodimo' — mesec beleženja da boljšo številko kot ugibanje.« Zavestna posledica allowUnknown: vsak 'ne vem' zniža oznako zanesljivosti (potential.ts:206-209) in v prodajni pripravi ustvari iztočnico 'kdo v podjetju to ve?' (salesPlaybook.ts:90-95) — pri tej postavki koristneje od izsiljene številke.

*Preverba.* Sklici na kodo točni. Popravljena je osrednja trditev predloga: ugotovitev je razglasila mejo proti shrinkageEUR za 'čisto', kar ne drži — pri trgovcu, ki prevzem knjiži po računu (natanko tisti, ki mu receiptMethod ponuja možnost 3 'Prevzem naknadno, včasih šele po prodaji'), se plačano a neprejeto blago pokaže kot nepojasnjen manko in bi bilo šteto dvakrat, kar §18 vrst. 605 in 609 izrecno prepovedujeta. Help je zato dopolnjen z izključitvijo, brez katere postavke ni dovoljeno dodati. Sklic na §18 dodan (v izvirni ugotovitvi ga ni bilo).

*Vir v raziskavi.* B06; Q29; §8.2 (vrst. 234-236); §18 (vrst. 609); Podprocesi SP04

### V-12 · dodaj · teža srednja · preverba: popravljeno

**MANJKA: razporedi izmen, menjave in nadomeščanja — ure priprave (§8.10)**

*Utemeljitev.* Preverjeno: kadriHz (horizontal.ts:248-338) meri evidence ur, pripravo plač, kadrovsko administracijo in stroške napačnih obračunov — razporedov izmen ne meri. Raziskava §8.10 (vrst. 326-328) izrecno našteva pripravo razporedov, nujne menjave izmen in iskanje nadomestil, isti odstavek pa postavi mejo: 'Izgubljene prodaje zaradi premalo ljudi so običajno nizko zanesljive.' Izbira horizontale namesto maloprodajnega modula je pravilna in skladna s komentarjem v horizontal.ts:17-24 (besedilo mora držati v vsakem segmentu). Koš capacity in adminHourCostEUR (horizontal.ts:302) sta v skladu z obstoječimi postavkami modula.

*Predlog.* DODAJ KMALU v kadriHz, kot četrto urno polje za hrAdminHoursPerMonth (horizontal.ts:288). Polje: key 'shiftPlanningHoursPerMonth', kind 'number', unit 'h/mesec', default 0, koš capacity × adminHourCostEUR × 12. Besedilo: »Koliko ur mesečno gre za pripravo razporedov, menjave izmen in iskanje nadomestil ob odsotnostih?« help: »Ure, ki ste jih že vpisali v drugem področju, tu ne ponavljajte.« (isto besedilo kot horizontal.ts:268 — enotno po §18, vrst. 615). explainer: »Sestava razporeda, popravki med mesecem, klici ob bolniških, usklajevanje nadomeščanj. Ocenite: koliko enot × koliko ur na mesec. Primer: 4 poslovalnice × 3 h ≈ 12 ur.« Dopolniti tudi summary modula (horizontal.ts:251) z 'razporedi izmen'. NE DODAJAJ dvojega: (a) izgubljene prodaje zaradi prekratke zasedbe — §8.10 jo sam označi za nizko zanesljivo; (b) stroška nadur kot neposredne izgube — nadura je plačilo za opravljeno delo in ne izguba. Posledice: horizontal.test.ts in vnos kadriHz v content/methodology.ts:307.

*Preverba.* Sklic na §8.10 (vrst. 328) je na vrstico natančen, sklic na horizontal.ts:248-338 prav tako. Popravljeno: (a) 'velja za vseh šest segmentov, ki horizontalo uporabljajo' je napačno — kadriHz je v segments.ts vključen v SEDMIH segmentih (vrstice 81, 110, 138, 168, 200, 234, 266: proizvodnja, logistika, trgovina, maloprodaja, storitve, racunovodstvo, splosno), torej v vseh; sprememba besedila mora zdržati tudi v računovodstvu, kjer kadriHz meri lastne kadre in ne obračunov za stranke (komentar segments.ts:226); (b) sklic na kadriHz v segments.ts popravljen s 167 na 168; (c) dodano, da je predlagani help dobesedno enak že obstoječemu v horizontal.ts:268 — to je namerno in skladno z §18 (vrst. 615), a mora biti zapisano, sicer bo videti kot podvojitev; (d) dodana dopolnitev summary modula, sicer polje v triaži ni napovedano.

*Vir v raziskavi.* §16.2 tč. 9 (vrst. 538); §8.10 (vrst. 326-328); Bolecina_resitev M09; Problem_podatki M09

### V-13 · dodaj · teža nizka · preverba: popravljeno

**MANJKA: napačen picking kot ločen razlog vračila in vzrok (B20, K13)**

*Utemeljitev.* Preverjeno: kanaliMp meri število vračil in strošek enega (maloprodaja.ts:741-758), pomoč pri costPerReturnEUR (754) že našteva delo, povratno dostavo, provizijo in znižanje artikla — ločen evrski znesek za picking bi bil dvojno štetje, kar §18 (vrst. 606) prepoveduje. Kar res manjka, je RAZLOG: KANALI_CAUSES (maloprodaja.ts:703-709) nima možnosti za napako pri pripravi naročila, register pa B20 ('Napačen picking') označuje z naslovljivostjo 'srednja' in vzrokom 'skeniranje / postopek'. Danes tak trgovec izbere 'Prenos naročil med sistemoma je ročen' (data 0,75) ali 'Ne vemo' (0,30) in dobi oceno odpravljivosti, ki ne ustreza vzroku.

*Predlog.* DODAJ ZDAJ možnost vzroka, razlog vračila pa KMALU. (1) Nova možnost v KANALI_CAUSES (maloprodaja.ts:709, na konec seznama): { label: 'Pri pripravi naročila zajamemo napačen artikel', category: 'people' } → 0,45. Vrednosti izbir so zaporedni indeksi in 'Ne vemo' doda mainCauseField sam (addressableShare.ts:56-69, withUnknown 78-80), zato je dodajanje na konec pravilno; obstoječih možnosti se ne sme prerazporediti. (2) Pozneje contextOnly choice: key 'returnReason', »Kaj je najpogostejši razlog vračil?« → »Kupec si je premislil ali mu ni ustrezalo«, »Poslali smo napačen artikel«, »Poškodba pri prevozu«, »Razlogov ne beležimo« (unknown: true). NE DODAJAJ ločenega evrskega polja za strošek napačnega pickinga.

*Preverba.* Sklici na kodo in raziskavo (§8.9 se res začne v vrstici 310) so točni, prav tako opozorilo o zaporednih indeksih. Popravljena pa je njegova UTEMELJITEV: 'privzetki modulov se shranjujejo kot indeksi' ne drži — v projektu ni nobene trajne hrambe vnosov (localStorage se uporablja samo za temo, lib/theme.ts:23-35), stanje živi v pomnilniku ene seje. Pravi razlog, zakaj se obstoječe možnosti ne smejo prerazporediti, je dvojen: testi pripenjajo indekse neposredno (maloprodaja.test.ts, npr. 'mainCause: 1'), izvoz pa v stolpcu 'moduleInputsJson' (exportRecord.ts:146-198) hrani surove indekse, zato bi prerazporeditev tiho preinterpretirala vse pretekle vnose v CRM. Severity znižana s 'srednja' na 'nizka': gre za eno dodatno možnost izbire, ki ne doda nobenega novega zneska.

*Vir v raziskavi.* B20; K13; §18 (vrst. 606); §8.9 (vrst. 310-318); Podprocesi SP16

### V-14 · dodaj · teža nizka · preverba: popravljeno

**MANJKA: čas do aktivacije novega artikla (K17)**

*Utemeljitev.* Preverjeno: K17 je v registru Proces_KPI res edini KPI procesa P01 poleg cenovne točnosti ('P01 | K17 | čas do aktivacije SKU | operativni | master data'), raziskava §8.1 pa 'čas do aktivacije' izrecno navaja med meritvami. V kalkulatorju ni ničesar podobnega; najbližje je receiptMethod z možnostjo 'Prevzem naknadno, včasih šele po prodaji' (maloprodaja.ts:658), ki meri prevzem in ne aktivacije artikla. Vrednost vprašanja je izključno prodajna: v salesReport.ts:407-413 med odgovore področja in v salesPlaybook.ts:106-115 kot iztočnica, kadar je stranka izpolnila vse.

*Predlog.* DODAJ KMALU, in sicer v istem posegu kot uro urejanja šifranta — sama zase je postavka premajhna. Kam: marzeMp, tik za 'itemDataHoursPerMonth'. Polje: key 'skuActivationTime', kind 'choice', default 3, contextOnly: true. Besedilo: »Koliko časa mine od prejema novega artikla do trenutka, ko ga je mogoče prodati?« Možnosti: 0 »Isti dan«, 1 »En do trije dnevi«, 2 »Teden ali več«, 3 »Različno, tega ne merimo« (unknown: true). explainer: »Mišljen je celoten postopek: vnos v šifrant, črtna koda, cena, etiketa in uvrstitev na polico. Če se artikli včasih prodajajo, preden so vneseni, to izberite kot 'Različno' — takrat zaloga in marža po artiklu nista zanesljivi.« Brez help, zato je polje skladno s pravilom help⇒explainer (explainers.test.ts preverja samo obratno smer). Zneska namenoma ne prispeva: čas do aktivacije se v evre pretvori le prek izgubljene prodaje, ki jo že meri razpolozljivostMp.

*Preverba.* Vsebina in sklici na kodo so potrjeni. Popravljena je ena podrobnost sklica na register: vprašanje 'Kako hitro je artikel po prevzemu dejansko na prodajni polici?' je v listu Segment_bolecina pripeto vrstici S1 | B05 ('Ročen prevzem'), ne bolečini B01 ali procesu P01 — postavka torej v registru pripada prevzemu, čeprav jo K17 meri kot KPI master data; umestitev v marzeMp ob šifrant je vseeno pravilna, ker vprašanje meri celotno pot do prodajljivosti. Dodano tudi izrecno potrdilo, da polje brez help ne krši pravila help⇒explainer (explainers.test.ts:22-32).

*Vir v raziskavi.* K17; §8.1 (vrst. 220-228); Proces_KPI P01; Segment_bolecina S1 (B05)

### V-15 · izboljsaj · teža nizka · preverba: popravljeno

**KANDIDAT ZAVRNJEN: staranje zaloge po 90/180/365 dneh v evrih (Q26, B10)**

*Utemeljitev.* Preverjeno in potrjeno: staleStockShare (maloprodaja.ts:265-277) vpraša, kolikšen del zaloge se šest mesecev ni prodal, in je contextOnly. Novo evrsko polje bi ustvarilo drugo pot do koša oneTimeCapital, ki ga danes izračuna inventoryValueEUR × reducibleShareOf (maloprodaja.ts:282, 306-312) — vsota bi bila odvisna od tega, katero polje je obiskovalec izpolnil, kar prepoveduje pravilo o enkratnosti kapitala. Register Segment_bolecina za S6 res predlaga vprašanje 'Koliko zaloge je brez prodaje po 90/180 dneh?'.

*Predlog.* NE DODAJAJ novega polja. Namesto tega izboljšaj obstoječe vprašanje: label (maloprodaja.ts:267) → »Kolikšen del zaloge se v zadnjih 90 dneh ni prodal?«; možnosti ostanejo nespremenjene (»Skoraj nič« / »Do desetine« / »Petina ali več« / »Tega ne vemo«); dodaj explainer: »Vzemite izvoz zaloge in izločite artikle brez prodaje v zadnjih 90 dneh. 90 dni je mera, ki jo pozna vsak sistem; šest mesecev je predolgo, da bi še kaj povedalo o obračanju.« Hkrati možnost 3 »Tega ne vemo« (maloprodaja.ts:275) dopolni z 'unknown: true' — danes je edina 'ne vem' možnost v maloprodajnih modulih brez te zastavice, zaradi česar se v poročilu izpiše kot 'privzeto' namesto '„Ne vem"' (answerLabels.ts:136-151 prek salesReport.ts:412). Če bi kdaj želeli evrsko različico, mora nadomestiti reducibleShare in ne stati poleg njega.

*Preverba.* Zavrnitev evrskega polja je potrjena in pravilno utemeljena; sklic §24 P1 (vrst. 743) je na vrstico natančen. Popravljen verdict: bil je 'dodaj', vsebina pa je izboljšava obstoječega polja — pravilni verdict je 'izboljsaj'. Dodana neopažena napaka v obstoječi kodi: možnost 'Tega ne vemo' pri staleStockShare (maloprodaja.ts:275) nima zastavice unknown: true, za razliko od vseh drugih 'ne vem' možnosti v datoteki (npr. substitutionShare, maloprodaja.ts:85) — brez nje prodajno poročilo tega odgovora ne označi kot priznano neznanje. Severity znižana s 'srednja' na 'nizka' (besedilna izboljšava brez učinka na znesek).

*Vir v raziskavi.* Q26; B10; K03/K04; Bolecina_finance M02; §8.5 (vrst. 266-270); §24 P1 (vrst. 743)

### V-16 · ohrani · teža nizka · preverba: popravljeno

**KANDIDAT ZAVRNJEN ZA ZDAJ: sledljivost lota in hitrost odpoklica (B08, SP08, GS1)**

*Utemeljitev.* Preverjeno in potrjeno: diagnostikaMp goodsTraceability (maloprodaja.ts:862-868) vpraša, ali je mogoče za artikel zanesljivo ugotoviti dobavitelja, serijo in rok, izid pa gre v koš 'risk' brez evrov (maloprodaja.ts:888-893) — skladno s pravilom, da se tveganje ne monetizira. Pisarniški del reklamacije res že meri servisHz (rmaAdminHoursPerMonth, horizontal.ts:487-498), ki je v segmentu (segments.ts:170). Register B08 nosi naslovljivost 'srednja' in vir GS1-01, register Segment_bolecina pa vprašanje o odpoklicu pripisuje samo S6 in S7 od osmih arhetipov.

*Predlog.* NE DODAJAJ — stanje ohrani. Vprašanje pripada veji lastnosti blaga (loti/serije) in ga je smiselno dodati šele, ko obstajata odgovor o lastnostih blaga IN pogojni prikaz, ki ga motor danes nima. Ko bo čas, naj bo besedilo procesno in ne funkcionalno: »Če bi dobavitelj danes sporočil odpoklic serije, v kolikšnem času bi našli vse prodane in še ležeče kose?« (isti dan / nekaj dni / ne bi zanesljivo našli), tip contextOnly, brez zneska. Do tedaj naj v prodajni pripravi to vlogo opravi diagnostična ocena procesne odpornosti (PROCESS_RISK_NOTE, maloprodaja.ts:830-834).

*Preverba.* Vsebina potrjena, vsi sklici na kodo preverjeni (goodsTraceability 862-868, risk izid 888-893, PROCESS_RISK_NOTE 830-834, servisHz 487-498 — ugotovitev je navedla 488-498, popravljeno). Popravljen verdict: bil je 'dodaj', predlog pa se glasi 'NE DODAJAJ ZDAJ' — pravilni verdict je 'ohrani'. Severity znižana s 'srednja' na 'nizka'. Trditev, da ure iskanja lota 'že meri' rmaAdminHoursPerMonth, je nekoliko širša od besedila polja (to meri sprejem prijave, dokumentacijo, usklajevanje z dobaviteljem in obveščanje stranke), a prekrivanje zadošča za sklep, da ločeno urno polje ne bi bilo varno.

*Vir v raziskavi.* B08; SP08; GS1-01; §8.3 (vrst. 242-250); Segment_bolecina S6/S7; vrzel G02

### V-17 · izboljsaj · teža nizka · preverba: popravljeno

**KANDIDAT ZAVRNJEN: kraja kot ločeno vprašanje z lastnim ukrepom (B17, H12)**

*Utemeljitev.* Preverjeno: kraja je v vprašalniku kot možnost vzroka 'Kraja kupcev ali zunanjih oseb' (BLAGAJNA_CAUSES, maloprodaja.ts:466, kategorija external), kar naslovljivost celotnega področja spusti na 0,25 (addressableShare.ts:32) in hkrati sproži ugovor 'externalCause' (salesPlaybook.ts:159-162). Register B17 ('Nejasen inventurni manko') ima naslovljivost 'odvisno od vzroka' in vir NRF-02; raziskava §8.8 (vrst. 294-308) in registra H12/PM11 se ujemajo, da sistem izboljša sled in analitiko, fizičnega vzroka pa ne odpravi.

*Predlog.* NE DODAJAJ vprašanja. Delitev na notranjo in zunanjo krajo ne bi prinesla nobenega novega evra (znesek je in ostane shrinkageEUR), zvišala pa bi tveganje, da poročilo implicitno obljubi ustavitev tatvin. Kar manjka, je na izhodu: akcijski načrt za blagajnaMp (content/actions/actions.ts:196-203) naj dobi četrto alinejo: »Del manka, ki izvira iz kraje, zahteva fizične in organizacijske ukrepe — informacijski sistem ga ne odpravi, lahko pa mu sledi in pokaže, kje in kdaj nastaja.« Preveri, ali kateri test pripenja število alinej (moduleEngine.test.ts:17 uvaža ACTION_PLANS).

*Preverba.* Vsebina in vsi sklici potrjeni (actions.ts:196-203 EXACT, maloprodaja.ts:466 EXACT). Popravljen verdict: bil je 'dodaj', predlog pa je vsebinski popravek akcijskega načrta — pravilni verdict je 'izboljsaj'. Predlog konkretiziran: navedeno je točno besedilo alineje in opozorilo, naj se preveri moduleEngine.test.ts, ki uvaža ACTION_PLANS in bi lahko pripenjal število alinej (vsi obstoječi načrti jih imajo natanko tri).

*Vir v raziskavi.* B17; H12; PM11; §8.8 (vrst. 294-308); vrzel G10; NRF-02

### V-18 · izboljsaj · teža nizka · preverba: popravljeno

**KANDIDAT ZAVRNJEN: izgubljena prodaja med zaprtjem trgovine zaradi inventure (B16)**

*Utemeljitev.* Preverjeno: blagajnaMp meri ure inventur kot kapaciteto (stocktakeHoursPerYear, maloprodaja.ts:530-536), izgubljene prodaje med zaprtjem pa ne. Trditev, da polje nima ne help ne explainer, je TOČNA — je edino številsko polje modula brez obojega. Za znesek bi bila potrebna substitucijska predpostavka po vzoru maloprodaja.ts:69-87 (SUBSTITUTION_SHARES), a brez podatka, iz katerega bi jo izpeljali; to bi bila lažna natančnost.

*Predlog.* NE DODAJAJ polja za izgubljeno prodajo. Namesto tega naj stocktakeHoursPerYear (maloprodaja.ts:530-536) dobi explainer, ki isti primer zajame v obstoječo številko: »Vse ure, ki jih inventura porabi: priprava, štetje, ponovno štetje razlik in vnos — tudi tiste izven delovnega časa ali med zaprtjem, ker so plačane. Primer: 4 osebe × 10 h × 2 inventuri ≈ 80 ur na leto.« Polje ostane brez help, zato pravilo help⇒explainer (explainers.test.ts) ni prizadeto. Če bi kdaj želeli izgubljeno prodajo, jo je treba vprašati skupaj z izpadom blagajne in po isti substitucijski logiki, ne kot samostojno postavko.

*Preverba.* Vsebina in sklici potrjeni; sklic na polje popravljen s 531-536 na 530-536. Popravljen verdict: bil je 'dodaj', predlog pa je dodajanje explainerja obstoječemu polju — pravilni verdict je 'izboljsaj'. Predlagano besedilo explainerja dopolnjeno z 'ali med zaprtjem', da dejansko pokrije primer, zaradi katerega je bila postavka sploh predlagana; izvirno besedilo je govorilo le o urah izven delovnega časa. Dodano potrdilo, da polje brez help ne pade na explainers.test.ts.

*Vir v raziskavi.* B16; §8.8 (vrst. 294-308); Bolecina_resitev M07; F01

### V-19 · izboljsaj · teža nizka · preverba: popravljeno

**KANDIDAT ZAVRNJEN: vrednost blaga, izgubljenega pri prenosih med enotami (B07)**

*Utemeljitev.* Preverjeno in potrjeno: prevzemMp meri samo administrativni del prenosov (transferHoursPerMonth, maloprodaja.ts:636-647, help v 643: 'Šteje samo administrativni del prenosa, ne prevoza'), blago, ki med enotami izgine, pa se pokaže kot nepojasnjena razlika ob inventuri in je zato že v shrinkageEUR, katerega help (524) izrecno pravi 'samo NEZNANA razlika'. §18 (vrst. 605) to potrjuje: nepojasnjen inventurni manko šteje samo v manko. BLAGAJNA_CAUSES ima tudi ustrezen vzrok 'Prevzem in odpis nista evidentirana sproti' (maloprodaja.ts:463, data → 0,75).

*Predlog.* NE DODAJAJ polja. Meja je pravilno postavljena, a nosi jo besedilo samo z ene strani. Dopolni help polja transferHoursPerMonth (maloprodaja.ts:643): »Šteje samo administrativni del prenosa, ne prevoza. Blago, ki se med enotami izgubi, vpišite pri inventurnem manku — sicer bo šteto dvakrat.« in isto mejo dodaj v explainer (644-646), sicer gumb '?' pove manj kot pomoč pod poljem.

*Preverba.* Vsebina in vsi sklici potrjeni, vključno z dobesednim besedilom pomoči v maloprodaja.ts:524 in 643. Popravljen verdict: bil je 'dodaj', predlog pa je popravek obstoječega besedila — pravilni verdict je 'izboljsaj'. Dodana zahteva, da se meja zapiše tudi v explainer polja (maloprodaja.ts:644-646); ugotovitev je omenjala samo help, kar bi pustilo obe besedili v neskladju.

*Vir v raziskavi.* B07; §18 (vrst. 605); SP07; Bolecina_finance M05/M07

### V-20 · ohrani · teža srednja · preverba: popravljeno

**KANDIDAT ZAVRNJEN: količinski imenovalci in COGS — transakcije, nabavna vrednost prodanega blaga, delež prihodka na spletu (Q06, Q07, Q08)**

*Utemeljitev.* Preverjeno: komentar nad izračunom marzeMp (maloprodaja.ts:426-429) res beleži, da je prejšnja različica odstotek množila s celotnim COGS in znesek precenila za red velikosti, zato je osnova zdaj prizadeta prodaja — koda v 432-433 to potrjuje (annualRevenueEUR × wrongPriceSalesSharePercent × marginGapPercent). Prihodek in prispevna marža sta v skupni finančni osnovi (contexts/maloprodaja.ts:128-145), zato Q07 velja za pokrit. Transakcij in deleža spletne prodaje ne uporablja nobena formula, kanal pa je kvalitativno zajet v businessType.

*Predlog.* NE DODAJAJ novih polj — COGS-a v nobeni obliki ne vračaj. VENDAR: predpostavka ugotovitve, da je bila napaka že popravljena povsod, ne drži za dokumentacijo. content/methodology.ts:151-154 (ključ marzeMp) še vedno navaja formulo »letna nabavna vrednost × delež izgube zaradi napačnih cen«, rationale pa trdi, da je izguba »vprašana kot delež nabavne vrednosti« — oboje opisuje prav tisto formulo, ki je bila iz kode odstranjena. Ker se ta niz izpiše v poročilu (salesReport.ts:416, MODULE_METHODOLOGY), poročilo danes stranki opisuje drugačen izračun, kot ga je opravilo. Popraviti na: »letni prihodek × delež prodaje po napačni ceni × izpad marže v odstotnih točkah; + neuveljavljeni rabati; ure vzdrževanja cenikov × strošek administrativne ure × 12« in rationale ustrezno.

*Preverba.* Zavrnitev COGS-a je potrjena in pravilna; sklic §24 P2 (vrst. 748) je na vrstico natančen. Popravljen verdict: bil je 'dodaj', vsebina pa je 'ne spreminjaj vprašalnika' — pravilni verdict je 'ohrani'. Bistveno dodano: ugotovitev trdi, da je bila napaka s COGS 'že popravljena', kar drži za kodo, NE pa za content/methodology.ts:151-154, ki staro formulo še vedno opisuje in se prek MODULE_METHODOLOGY izpiše v poročilu stranki. To je edina resnična napaka, ki jo ta postavka odkriva, zato severity ostaja 'srednja' kljub verdictu 'ohrani'.

*Vir v raziskavi.* Q06, Q07, Q08; Bolecina_finance M04; Problem_podatki M04; §24 P2 (vrst. 748)

### V-21 · ohrani · teža nizka · preverba: popravljeno

**KANDIDAT ZAVRNJEN: čas do odkritja maržnega odstopanja (B26, K20)**

*Utemeljitev.* Preverjeno in potrjeno: diagnostikaMp knowsItemMargin (maloprodaja.ts:855-860) vpraša, ali je marža po artiklu in poslovalnici znana, izid pa je opremljen z opozorilom, da odstopanje opazijo šele ob obračunu (DATA_RISK_NOTE medium, maloprodaja.ts:825-827); horizontala analitikaHz z reportFreshness (horizontal.ts:77-89, contextOnly) meri, kako stare so ključne številke, ko jih vodstvo vidi. Monetizacija bi zahtevala protidejstveno predpostavko, koliko marže bi rešili ob zgodnejšem odkritju — to je ni mogoče dokazati in bi kršilo prepoved lažne natančnosti. Register B26 nosi naslovljivost 'srednja'.

*Predlog.* NE DODAJAJ — stanje ohrani. Pokritost je zadostna in pravilno nemonetizirana; dodatno vprašanje bi tretjič vprašalo isto stvar z drugimi besedami. Če se bo kdaj pokazalo, da prodajniki to iztočnico pogrešajo, naj se doda v prodajno pripravo kot izpeljanka iz že obstoječih odgovorov (knowsItemMargin + reportFreshness), ne kot novo vprašanje — salesPlaybook.ts:106-115 tak vzorec že pozna in kontekstna polja uporabi kot iztočnico, kadar drugih ni.

*Preverba.* Vsebina potrjena, sklici na kodo preverjeni (knowsItemMargin 855-860, DATA_RISK_NOTE 825-827, salesPlaybook 106-115). Popravljen verdict: bil je 'dodaj', predlog pa 'NE DODAJAJ' — pravilni verdict je 'ohrani'. Popravljena sklica: reportFreshness je v horizontal.ts:77-89 (ne 78-89), §8.12 se začne v vrstici 338 (ne 340). Dodan sklic na Segment_bolecina S3, kjer je B26 z verjetnostjo 'visoko' in prvim vprašanjem 'Kdaj izvedete, da je marža odstopila?' — to je najmočnejši argument za nasprotno stran, a ga izpodbije dejstvo, da odgovor ne more prispevati evra.

*Vir v raziskavi.* B26; K20; §8.12 (vrst. 338-344); Proces_KPI P12; Segment_bolecina S3

