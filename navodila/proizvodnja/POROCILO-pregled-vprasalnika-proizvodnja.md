# Poročilo: pregled proizvodnega vprašalnika ROI kalkulatorja

> **Namen dokumenta.** Izvedbena navodila za AI ali razvijalca. Vsebuje **vseh 112 potrjenih sodb**
> o vprašalniku za dejavnost proizvodnja — kaj ohraniti, kaj popraviti, kaj premakniti in kaj dodati —
> vsako s konkretnim predlogom besedila, tipa, privzetka in formule.
>
> **Kako je nastalo.** Šest vzporednih pregledovalcev po področjih vprašalnika, nato skeptična preverba
> vsake ugotovitve ob živi kodi in raziskavi niše. Od 115 sodb so bile **3 ovržene** (razdelek 9),
> 94 popravljenih v podrobnostih, 18 potrjenih brez pripomb.
>
> **Datum:** 12. avgust 2026 · **Metoda:** `GPT baza znanja/NAVODILA-pregled-vprasalnika-po-dejavnosti.md`

---

## 0. Preden začneš izvajati

**Repozitorij:** `/Users/janpavlic/Documents/Datalab/aplikacije/ROI kalkulator`

> ⚠️ Ne `Datalab/Claude code` — to je zastarela kopija. Sklici na vrstice v tem poročilu veljajo za
> pravi repozitorij, stanje 12. 8. 2026. Pred vsako spremembo preveri, da se vrstica ujema.

### Trda pravila — predlog, ki jih krši, je napačen

1. **Prihranek časa ni prihranek plače**, dokler ni opredeljena monetizacija.
2. **Prihodek ni korist** — pri dodatni prodaji je korist prispevna marža.
3. **Sprostitev zaloge ali terjatev je enkratni denarni učinek**, ne letni prihranek.
4. **Tveganje se ne monetizira** brez verjetnosti in posledice — koš `risk` nima EUR.
5. **Ista ura ali evro ne smeta v dve področji.**
6. **Ni lažne natančnosti** — jamstvo aplikacije se glasi »nobene številke si nismo izmislili«.

### Tehnične omejitve sheme

| Omejitev | Posledica za izvedbo |
|---|---|
| Vnos je `Record<string, number>` | `checkbox` = 0/1, `percent` = ulomek (0,03 = 3 %) |
| Vrednosti izbir so **zaporedni indeksi** | odstranitev sredinske možnosti premakne pomen shranjenih vrednosti |
| Vsako polje s `help` mora imeti `explainer` | zahteva `explainers.test.ts`; `help` = meja, `explainer` = izpeljava s primerom |
| Pogojnega prikaza modula (`showIf`) motor **nima** | vsak predlog »pokaži samo podjetjem z X« je nova zmožnost motorja |
| `plausibility.ts` sešteva polja z enoto `h/mesec` in `h/leto` | zmnožek dveh polj mu uide — potrebna izrecna razširitev |
| Nov modul potrebuje vnos v `content/methodology.ts` in `content/actions/actions.ts` | brez slednjega ne more biti »največja postavka« |
| Novi stolpci v `exportRecord.ts` gredo **na konec** | nikoli vmes |

### Koši rezultatov

| Koš | Pomen | Kje se prikaže |
|---|---|---|
| `directLoss` | trdi denar, ki odteka | naslovna kartica »Neposredni letni stroški« |
| `lostMargin` | denar, ki ni prišel | ločena kartica »Nezaslužena letna marža« |
| `capacity` | vrednost sproščenega časa | kartica »Vrednost izgubljene kapacitete« |
| `oneTimeCapital` | enkratna sprostitev | nikoli se ne sešteva z letnimi |
| `risk` | brez EUR, namerno | kartice tveganj |

### Naslovljivi deleži po kategoriji vzroka

`data` 75 % · `planning` 65 % · `people` 45 % · `external` 25 % · `physical` 15 % · `unknown` 30 % (privzeto)

---

## 1. Bilanca

| Sodba | Št. |
|---|---:|
| **OHRANI** | 42 |
| **IZBOLJŠAJ** | 45 |
| **DODAJ** | 24 |
| **PREMAKNI** | 4 |
| **Skupaj izvedljivih** | **112** |

*(Poleg tega 3 ovržene sodbe — razdelek 9, ne izvajaj jih.)*

**Po teži:** 25 visoka · 44 srednja · 46 nizka

**Po preverbi:** 18 potrjeno · 94 popravljeno · 3 **ovrženo** (razdelek 9 — ne izvajaj)

> Nobeno obstoječe vprašanje ni dobilo sodbe »odstrani«. Vprašalnik nima balasta — ima luknje in nekaj napačnih mest.

---

## 2. Kazalo področij

| Oznaka | Področje | Sodb |
|---|---|---:|
| `K-**` | Koraki 1–5 — dejavnost, velikost, kontekst, triaža, finančna osnova | 27 |
| `P-**` | P1 Plan, kapacitete in navodila + P4 Delovni nalogi in podatki | 13 |
| `M-**` | P2 Izmet, dodelave in kakovost + P3 Zaloge in razpoložljivost materiala | 13 |
| `Z-**` | P5 Roki in nujni stroški + Kratka diagnostika + Modul E (tehnični roki) | 17 |
| `H-**` | Horizontale P6–P10 z vidika proizvajalca | 32 |
| `V-**` | Manjkajoča področja — paketi vprašanj | 10 |

---

## 3. Koraki 1–5 — dejavnost, velikost, kontekst, triaža, finančna osnova

*11× ohrani · 10× izboljšaj · 1× premakni · 5× dodaj*

| ID | Sodba | Teža | Vprašanje |
|---|---|---|---|
| `K-01` | OHRANI | 🔴 | V1.1 — S čim se ukvarja vaše podjetje? (izbira dejavnosti) |
| `K-02` | OHRANI | 🟠 | V1.2 — Kaj je najbliže vašemu načinu dela? (podizbira pri »Drugo«) |
| `K-03` | IZBOLJŠAJ | 🟠 | V2.1 — Koliko ljudi zaposlujete? (employeeCount) |
| `K-04` | DODAJ | 🟠 | directProductionEmployees — Koliko od njih dela neposredno v proizvodnji? (NOVO, korak 2) |
| `K-05` | IZBOLJŠAJ | 🔴 | V3.1 — Kako pretežno proizvajate? (businessType) |
| `K-06` | OHRANI | 🔴 | V3.2 — Kako danes vodite proizvodnjo? (currentSystem) |
| `K-07` | IZBOLJŠAJ | 🟠 | V3.3 — Kakšna je vaša vloga? (role) |
| `K-08` | IZBOLJŠAJ | 🔴 | KORAK 4 — nabor 10 triažnih področij (pokritost proti §19.2) |
| `K-09` | DODAJ | 🔴 | NOVO triažno področje + modul: Menjave, zastoji in vzdrževanje |
| `K-10` | DODAJ | 🟠 | NOVO kontekstno vprašanje: delež kooperantov (korak 3) |
| `K-11` | IZBOLJŠAJ | 🟠 | KORAK 4 — privzeta izbira področij (prva tri po vrstnem redu) |
| `K-12` | OHRANI | 🟠 | T1 — Kako pogosto se plan spreminja ali proizvodnja čaka zaradi nejasnih prioritet, navo… |
| `K-13` | IZBOLJŠAJ | ⚪ | T2 — Kako pogosto nastajajo izmet, dodelave ali reklamacije? |
| `K-14` | OHRANI | 🟠 | T3 — Kako pogosto imate preveč zaloge, hkrati pa manjka pravi material? |
| `K-15` | OHRANI | 🟠 | T4 — Koliko ročnega dela imate s pripravo nalogov, papirji in prepisovanjem? |
| `K-16` | IZBOLJŠAJ | ⚪ | T5 — Kako pogosto zamujate ali rešujete naročila nujno? |
| `K-17` | OHRANI | ⚪ | T6 — Koliko ročnega dela zahteva priprava poročil in ključnih številk za odločanje? |
| `K-18` | OHRANI | ⚪ | T7 — Koliko ročnega dela je v vašem računovodstvu in financah (knjiženje, usklajevanje, … |
| `K-19` | OHRANI | ⚪ | T8 — Koliko dela zahtevajo evidence delovnega časa, dopusti in priprava plač? |
| `K-20` | OHRANI | ⚪ | T9 — Koliko časa se izgubi s potrjevanjem, iskanjem in ročnim pošiljanjem dokumentov? |
| `K-21` | OHRANI | ⚪ | T10 — Koliko dela vam povzročajo garancijska popravila, servis in vodenje reklamacij po … |
| `K-22` | IZBOLJŠAJ | ⚪ | V5.2 — Približen polni strošek administrativne oziroma vodstvene ure (razponi + privzetek) |
| `K-23` | IZBOLJŠAJ | 🟠 | V5.3 — Letni prihodki od prodaje (annualRevenue v koraku 5) |
| `K-24` | IZBOLJŠAJ | 🟠 | V5.4 — Povprečna prispevna marža (contributionMargin v koraku 5) |
| `K-25` | PREMAKNI | 🟠 | annualMaterialSpendEUR — Kolikšna je letna vrednost porabljenega materiala? (danes v P2) |
| `K-26` | DODAJ | ⚪ | NOVO kontekstno vprašanje: število delovnih nalogov oziroma naročil na mesec |
| `K-27` | DODAJ | ⚪ | NOVO kontekstno vprašanje: število izmen (korak 3) |

### `K-01` · OHRANI · 🔴 visoka

**V1.1 — S čim se ukvarja vaše podjetje? (izbira dejavnosti)**

**Ugotovitev.** Edini vir preslikave v segment (src/config/industries.ts:25-44), brez števca korakov na prvem zaslonu in z realno obljubo trajanja (StepIndustry.tsx:57-61) — obljuba, ki drži, je pogoj verodostojnosti celotnega izračuna. Odgovor odloči celoten nadaljnji vprašalnik, torej posredno vsak znesek. Raziskava §4.2 potrjuje, da panožne pod-segmentacije (kovina, živila, plastika …) za samopostrežni vprašalnik ni treba spraševati — razlike lovi proizvodni model v V3.1, ne panoga.

*Sklic na raziskavo: proizvodnja.md §4.1–4.2*

### `K-02` · OHRANI · 🟠 srednja

**V1.2 — Kaj je najbliže vašemu načinu dela? (podizbira pri »Drugo«)**

**Ugotovitev.** Vprašanje po poslovnem modelu namesto panoge je pravilna zasnova: gradbinec ali agencija se ne najdeta v seznamu panog, model pa jima ustreza (industries.ts:46-61, komentar). Možnost »Izdelujemo ali predelujemo izdelke« pravilno pelje v isti proizvodni vprašalnik (drugo_izdelki → proizvodnja, industries.ts:63-68), CRM oznaka »Drugo — izdelki« pa prodajniku ohrani signal, da se obiskovalec ni prepoznal v panogi. Varovalo »Nič od tega ne ustreza« → splošni vprašalnik ne predpostavlja ničesar, kar je skladno s pravili §2.3 proti lažni natančnosti.

*Sklic na raziskavo: proizvodnja.md §4.1; §2.3*

### `K-03` · IZBOLJŠAJ · 🟠 srednja

**V2.1 — Koliko ljudi zaposlujete? (employeeCount)**

**Ugotovitev.** Vprašanje je pravo, a opomba pod poljem laže: »Podatek na izračun ne vpliva« (StepEmployeeCount.tsx:44-47) — v resnici napaja plavzibilnostno ovojnico (plausibility.ts:47-77: vsota vnesenih ur proti kapaciteti zaposlenih × 160 h) in ICP dimenzijo velikosti z utežjo 20 % (icp.ts:168-180). Enako zastarel je celo komentar v kodi (StepEmployeeCount.tsx:14-19). Zastarelo besedilo spodkopava zaupanje: obiskovalec, ki misli, da podatek ni pomemben, ga vnese površno, s tem pa razvrednoti opozorilo o dvojnem štetju ur, ki je ena redkih kontrol §12.6. Raziskava §19.1 Q-02 poleg skupnega števila zahteva še neposredno proizvodne zaposlene, izmene in lokacije (glej ločen predlog).

**Kaj narediti.** Novo besedilo opombe: »Podatek ne vstopa v nobeno formulo. Uporabimo ga za velikostni razred v poročilu in za preverjanje verjetnosti vnesenih ur — če vpisane ure presežejo razumen delež skupne kapacitete, vas na to opozorimo.« Tip in enota ostaneta (število, »zaposlenih«), brez privzetka (obvezno > 0), kot zdaj. Posodobi tudi zastareli komentar nad komponento.

*Sklic na raziskavo: proizvodnja.md §19.1 Q-02; §12.6*

### `K-04` · DODAJ · 🟠 srednja

**directProductionEmployees — Koliko od njih dela neposredno v proizvodnji? (NOVO, korak 2)**

**Ugotovitev.** Raziskava §19.1 Q-02 in jedrni ICP (§3.4: »vsaj 10 neposredno proizvodnih zaposlenih«) zahtevata ta imenovalec, ki ga vprašalnik nikjer ne zajame. Plavzibilnostna ovojnica danes primerja proizvodne čakalne ure s kapaciteto VSEH zaposlenih (plausibility.ts:67) — podjetje s 60 zaposlenimi in 12 operaterji lahko vnese 900 ur čakanja/mesec, ne da bi se sprožilo opozorilo, čeprav je to 47 % kapacitete proizvodne ekipe (900 < 60 × 160 × 0,4 = 3.840). Direktor odgovor pozna iz glave v 10 sekundah (kriterij b).

**Kaj narediti.** Besedilo: »Koliko od njih dela neposredno v proizvodnji?« · tip: število · enota: »zaposlenih« · privzetek: prazno (neobvezno; brez odgovora velja sedanje vedenje) · help: »Operaterji, varilci, monterji — kdor dela na delovnih nalogih. Podatek uporabimo samo za preverjanje verjetnosti vnesenih ur.« · formula: ne vstopa v EUR; polja z enoto h/mesec na proizvodni uri (waitingHoursPerMonth, reworkHoursPerMonth, materialWaitingHoursPerMonth) se v plausibility.ts primerjajo proti directProductionEmployees × 160 × 0,4 — ker ovojnica danes sešteva vsa urna polja skupaj, je treba primerjavo razdeliti (npr. po seznamu proizvodnih ključev ali novi zastavici polja) · koš: brez (kontrolni podatek). ICP dimenzija velikosti lahko dodatno preveri prag ≥ 10.

*Sklic na raziskavo: proizvodnja.md §19.1 Q-02; §3.4*

### `K-05` · IZBOLJŠAJ · 🔴 visoka

**V3.1 — Kako pretežno proizvajate? (businessType)**

**Ugotovitev.** Odgovor ne krmili ničesar razen oznake v prodajnem poročilu (salesReport.ts:287, salesReportHtml.ts:308, pdfSales.ts:131, exportRecord.ts), čeprav raziskava §4.1 CELOTNO segmentacijo gradi na proizvodnem modelu: MTS boli zaloga in zastaranje, MTO/ETO roki in spremembe, šaržno sledljivost in izmet. Sedanjih 5 možnosti (contexts/proizvodnja.ts:29-38) nima ETO (strojegradnja, §5.4) niti šaržno/procesne ločnice, »Kombinirano« pa je izhod, ki vrne nič informacije. Ker je to edino vprašanje, ki bi lahko poceni personaliziralo triažo, je neizkoriščenost draga.

**Kaj narediti.** Možnosti (id-ji stabilni za CRM): poNarocilu »Po naročilu — izdelek po naročilu kupca (MTO)« · eto »Razvijemo in izdelamo po naročilu — konstrukcija je del posla (ETO)« · serijsko »Serijsko ali šaržno — ponovljive serije« · naZalogo »Na zalogo — po lastni napovedi« · projektno »Projektno — enkratni kompleksni posli« · kombinirano »Kombinirano — nobeden ne prevladuje« (zadnja, ne privzeta). Tip: radio, brez privzetka (obvezno, kot zdaj). UPORABA: triage.defaultIds je statičen seznam v SegmentConfig, zato krmiljenje po modelu zahteva razširitev sheme, npr. triage.defaultIdsByBusinessType?: Record<string, string[]> (kontekst — korak 3 — je izbran pred triažo, podatek je torej na voljo): naZalogo/serijsko → [material, zaloge, planiranje]; poNarocilu/eto/projektno → [planiranje, zamude, nalogi]; kombinirano in manjkajoč odgovor → statični privzetek [material, zaloge, zamude] (glej ločeni item o privzeti izbiri). Prodajno poročilo dobi ostrejšo oznako (MTO proti MTS je za prodajnika PANTHEON MF ključna informacija).

*Sklic na raziskavo: proizvodnja.md §4.1; §5.1–5.5; §10 PLN-03/MAT-02*

> ℹ️ *Preverba je ugotovitev popravila:* Popravljeni sklici: možnosti so na contexts/proizvodnja.ts:29-38 (ne 18-27), oznaka v salesReport.ts:287 (ne 269) in salesReportHtml.ts:308 (ne 307). Dodana ugotovitev, da je defaultIds statičen — predlog konkretiziran z razširitvijo sheme defaultIdsByBusinessType. Fallback za »kombinirano« usklajen z ločenim itemom o privzeti izbiri (material, zaloge, zamude namesto »sedanja prva tri«).

### `K-06` · OHRANI · 🔴 visoka

**V3.2 — Kako danes vodite proizvodnjo? (currentSystem)**

**Ugotovitev.** Edino vprašanje, ki določa pas izboljšave (contexts/proizvodnja.ts:40-49), in edini medsegmentni normalizator za ICP (icp.ts:195-208). Pet stopenj se lepo preslika v model digitalne zrelosti §13 (stopnje 0–2 so natanko »Excel/papir«, »ERP + proizvodnja zunaj«, »povezan tok«), pas 8–20 % za obstoječe uporabnike MF/MT pa pošteno prizna, da so lahke izboljšave že pobrane. Ločitev »PANTHEON brez proizvodnega modula« zadene jedrni ICP signal §3.4 (»PANTHEON že uporablja za računovodstvo, ne pa za proizvodnjo«). Pasovi so označeni kot kalibracijski — to je pravilno vodena negotovost po §12.5.

*Sklic na raziskavo: proizvodnja.md §13; §3.4; §12.5*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina drži v celoti; popravljen samo sklic — currentSystem je na contexts/proizvodnja.ts:40-49, ne 29-38.

### `K-07` · IZBOLJŠAJ · 🟠 srednja

**V3.3 — Kakšna je vaša vloga? (role)**

**Ugotovitev.** Uteži ICP dimenzijo »bližina odločevalcu« (15 %, icp.ts:234-242), a ICP veja za 'lastnik' (icp.ts:91) je za proizvodnjo mrtva koda — kontekst možnosti »Lastnik« sploh ne ponuja (contexts/proizvodnja.ts:51-60), lastnik-direktor v MSP pa je najpogostejši sponzor (§7, §17.1). Manjka tudi planer, ki ga raziskava §7 označi za »močnega uporabnika/vplivneža« in je pri MTO podjetjih pogosto prav tisti, ki tak kalkulator izpolni; danes pade v »Drugo« → ICP 0,35, kar sistematično podceni dobre leade. Ugovor »notMyDecision« v playbooku (salesPlaybook.ts:177-178) se prek regexa /direktor|lastnik/ nad OZNAKO vloge pravilno izogne le direktorju.

**Kaj narediti.** Preimenuj prvo možnost v »Direktor/-ica ali lastnik/-ica« (id 'direktor' ostane zaradi CRM in ICP; ICP opomba že pravi »direktor oziroma lastnik«, regex v playbooku pa preimenovano oznako še vedno pravilno izloči). Dodaj možnost planer »Planiranje ali priprava dela« in v icp.ts ROLE_FIT vnos PRED splošno vejo startsWith('vodja'): match id === 'planer' → value 0,55, note »Planer — močan uporabnik in vplivnež, o nakupu ne odloča sam.« Ostale možnosti (Vodja proizvodnje, Finance, Nabava, Drugo) nespremenjene.

*Sklic na raziskavo: proizvodnja.md §7; §17.1*

> ℹ️ *Preverba je ugotovitev popravila:* Popravljena sklica: role je na contexts/proizvodnja.ts:51-60 (ne 40-49), ICP dimenzija na icp.ts:234-242. Preverjeno in dodano: regex bere roleLabel (oznako, ne id), zato preimenovanje ne podre ugovora; vnos za planer mora v ROLE_FIT stati pred vejo za predpono 'vodja' (id 'planer' je sicer varen, a vrstni red je eksplicitno omenjen zaradi vzdrževanja).

### `K-08` · IZBOLJŠAJ · 🔴 visoka

**KORAK 4 — nabor 10 triažnih področij (pokritost proti §19.2)**

**Ugotovitev.** Raziskava §19.2 našteva 17 področij s 4 dimenzijami (68 ocen) — to je za spletno samopostrežbo neznosno; 10 področij × 1 lestvica je blizu zgornje meje znosnosti, zato je redukcija načeloma pravilna. Preslikava pa pušča luknje: posredno so pokrite kosovnice (vzrok v P2, proizvodnja.ts:128), nabava/dobavitelji (vzrok v P3, proizvodnja.ts:225), lastna cena in sledljivost (diagnostika, proizvodnja.ts:569-627); POPOLNOMA nepokrite pa so menjave in nastavitve (SET-01/02), neplanirani zastoji in vzdrževanje (MNT-01) ter kooperanti (SUB-01) — okvare so danes celo izrecno izключene iz čakalnih ur P1 (help na proizvodnja.ts:75), torej se ne merijo nikjer. Popis sam navaja isti manko (vprasalnik-proizvodnja-trenutno-stanje.md, razdelek »Kar iz raziskave manjka v celoti«, ~vrstica 395).

**Kaj narediti.** Dodaj ENO panožno triažno področje »Menjave, zastoji in vzdrževanje« (glej ločen »dodaj« s celotno specifikacijo) — 11 področij je še znosnih, ker triaža ostane ena ocena + kljukica. Kooperante pokrij s kontekstnim vprašanjem v koraku 3 (ločen »dodaj«), ne z 12. področjem. Odprema/OTIF ostane znotraj T5 (roki), lastna cena in sledljivost ostaneta v diagnostiki — brez EUR, skladno s §2.3.

*Sklic na raziskavo: proizvodnja.md §19.2; §10 SET-01/02, MNT-01, SUB-01*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina drži (manko menjav, zastojev in kooperantov potrjen v kodi in popisu; §19.2 res 17 × 4 = 68 ocen). Popravljeni sklici na vrstice: vzrok kosovnic proizvodnja.ts:128 (ne 123), vzrok nabave :225 (ne 216), diagnostika :569-627 (ne 547-556). Dodan močnejši argument: help P1 (proizvodnja.ts:75) okvare izrecno izloči, zato ure okvar danes ne meri nobeno področje.

### `K-09` · DODAJ · 🔴 visoka

**NOVO triažno področje + modul: Menjave, zastoji in vzdrževanje**

**Ugotovitev.** SET-01/02 in MNT-01/03 (§10) so za serijsko in šaržno proizvodnjo osrednji kapacitetni kanal, ki ga vprašalnik nikjer ne izmeri — okvare so danes samo vzrok s 15 % naslovljivostjo v P1/P2/P5 (kategorija physical, addressableShare.ts), pri čakalnih urah P1 pa so izrecno izключene, kar pomeni, da podjetje s to glavno bolečino dobi skoraj prazen rezultat. Vprašanje prek dogodkov × trajanje (kriterij b) je odgovorljivo iz glave, formula pade v obstoječa koša brez novih konceptov, kategorije vzrokov (planning 65 %, people 45 %, physical 15 %, ne vemo 30 %) natanko ustrezajo ADDRESSABLE_SHARE. Meje proti P1 (čakanje zaradi plana) in P3 (čakanje na material) so izrecne, zagonski izmet ostane v P2 — s tem so kontrole §12.6 (zastoj ≠ izgubljena prodaja, OEE se ne sešteva) spoštovane, definicija menjave pa sledi §11 (setup time = od zadnje dobre enote A do prve dobre enote B).

**Kaj narediti.** TRIAŽA: »Kako pogosto vam plan podrejo menjave, nastavitve ali nepričakovane okvare strojev?« — 0 »Skoraj nikoli« · 1 »Nekajkrat na mesec« · 2 »Tedensko« · 3 »Skoraj vsak dan«. POLJA: (1) »Koliko menjav oziroma nastavitev imate v tipičnem mesecu?« število, menjav/mesec, privzeto 0; (2) »Koliko v povprečju traja ena menjava, vključno s čakanjem na orodja in prvo dobro enoto?« število, min, privzeto 0, help »Od zadnje dobre enote prejšnje serije do prve dobre enote nove (§11 setup time).«; (3) »Koliko ur mesečno stroji stojijo zaradi nepričakovanih okvar?« h/mesec, privzeto 0, help »Čakanje zaradi nejasnega plana štejte v področju Plan, čakanje na material v Zalogah. Zagonski izmet sodi v področje Izmet.«; (4) »Koliko so v zadnjih 12 mesecih stali nujni servisi in ekspresna dobava rezervnih delov?« EUR/leto, privzeto 0, help »Samo dodatek nad rednim vzdrževanjem.«; (5) glavni vzrok (mainCauseField): »Menjave niso planirane v pametnem zaporedju« (planning) / »Orodja in navodila niso pripravljeni vnaprej« (planning) / »Ni standardnega postopka menjave« (people) / »Vzdrževanje je reaktivno — okvare presenetijo« (physical) / »Ne vemo« (unknown, samodejno). FORMULE: kapaciteta »Menjave in nastavitve« = V1 × V2/60 × operationalHourCostEUR × 12; kapaciteta »Neplanirani zastoji strojev« = V3 × operationalHourCostEUR × 12; izguba »Nujni servisi in ekspresni deli« = V4. KOŠA: capacity + directLoss. Modul dodaj v SEGMENTS.proizvodnja.moduleIds pred horizontale.

*Sklic na raziskavo: proizvodnja.md §10 SET-01/02, MNT-01/03; §9.8–9.9; §11 setup time; §12.6*

### `K-10` · DODAJ · 🟠 srednja

**NOVO kontekstno vprašanje: delež kooperantov (korak 3)**

**Ugotovitev.** Kooperanti so ena od 15 dimenzij kompleksnosti (§4.3, točka 7), jedrni ICP signal (§3.4: »pomemben delež kooperantov«) in samostojna bolečina SUB-01 (»ne vemo, kaj je pri kooperantu«), vprašalnik pa jih ne omeni nikjer. Kot kontekstno vprašanje ima prodajno vrednost brez računske: PANTHEON kooperantske DN uradno podpira (§9.13) — neposreden prodajni kavelj. Mehanizem: StepContext danes izriše natanko tri vprašanja (StepContext.tsx:108-129), SegmentContext (contextTypes.ts:131-171) pa dodatnega vprašanja ne predvideva — potrebna je razširitev (npr. neobvezno polje extraQuestions: ContextQuestion[]). Odgovor gre v qualification prodajnega poročila (salesReport.ts:280-292) in exportRecord, po vzoru businessType — NE prek salesPlaybook.ts:104-115, ker ta zanka bere modulska contextOnly polja (report.measured), ne kontekstnih vprašanj koraka 3.

**Kaj narediti.** Besedilo: »Kolikšen del vaše proizvodnje gre skozi zunanje kooperante?« · tip: radio (ContextQuestion v razširjenem SegmentContext.extraQuestions) · možnosti (stabilni id-ji): nic »Nič« / do10 »Do 10 %« / do30 »10–30 %« / nad30 »Več kot 30 %« · privzetek: brez (neobvezno — canProceed se nanj ne veže) · help: »Površinska obdelava, razrez, montaža ali druge operacije, ki jih za vas opravijo drugi.« · formula: ne vstopa v izračun · koš: brez; oznaka izbrane možnosti se zapiše v qualification prodajnega poročila in v exportRecord.

*Sklic na raziskavo: proizvodnja.md §4.3; §3.4; §10 SUB-01; §9.13*

> ℹ️ *Preverba je ugotovitev popravila:* Ohranjen »dodaj«, popravljen mehanizem: sklic StepContext.tsx:71-79 → 108-129, contextTypes.ts:113-153 → 131-171; ključno pa — salesPlaybook.ts:104-115 uporablja contextOnly polja MODULOV, ne kontekstnih vprašanj koraka 3, zato novo vprašanje playbook iztočnic samodejno ne polni; pravilna pot je qualification + exportRecord (kot businessType). Oznaka »contextOnly« iz predloga umaknjena (to je pojem modulskih polj) in dodani stabilni id-ji možnosti.

### `K-11` · IZBOLJŠAJ · 🟠 srednja

**KORAK 4 — privzeta izbira področij (prva tri po vrstnem redu)**

**Ugotovitev.** Privzetek Plan + Izmet + Zaloge (segments.ts:88-90, triage brez defaultIds → prva tri po moduleIds) vključi P1, ki prispeva 0 EUR neposredne izgube (oba izhoda sta capacity), izpusti pa P5 (Roki), ki polni tri postavke naravnost v naslovno kartico. Naslovna kartica »Neposredni letni stroški« (ResultsSummary.tsx:57-62) se izriše VEDNO, tudi z 0 EUR — kapaciteta je prikazana ločeno in pogojno — zato privzeta pot sistematično podceni hero številko, kombinacija Plan + Nalogi pa na njej pokaže 0 EUR. Katalog §10 finančne kanale zamud (penali, ekspres, marža) pripisuje prav rokom (PLN-03, PUR-01), vzročno drevo zamud pa je osrednja diagnostična os raziskave.

**Kaj narediti.** V segments.ts za proizvodnjo nastavi triage: { recommendedCount: 3, defaultIds: ['material', 'zaloge', 'zamude'] } — tri področja, ki edina polnijo naslovno kartico (P1 in P4 vračata samo capacity). Plan ostane prvi v prikaznem vrstnem redu in v tie-breaku (moduleIds se ne spreminja). Ko bo V3.1 krmilil privzeto izbiro po proizvodnem modelu (glej V3.1), ta statični privzetek postane fallback za »kombinirano« in za manjkajoč odgovor.

*Sklic na raziskavo: proizvodnja.md §10 PLN-03, PUR-01; vzročno drevo za zamude (§10)*

> ℹ️ *Preverba je ugotovitev popravila:* Jedro potrjeno (P1 in P4 res prispevata samo capacity; segments.ts:90 res nima defaultIds). Precizirana trditev o »naslovnem znesku«: rezultat prikaže štiri ločene kartice, a directLoss je prva in edina brezpogojna — »0 EUR« se torej res pokaže. Usklajen fallback za »kombinirano« z itemom V3.1.

### `K-12` · OHRANI · 🟠 srednja

**T1 — Kako pogosto se plan spreminja ali proizvodnja čaka zaradi nejasnih prioritet, navodil ali podatkov?**

**Ugotovitev.** Neposredno zadene PLN-01 (»plan se spreminja večkrat dnevno«) in PLN-02 (»vse je prioriteta«) — bolečini, ki ju §17.2 posredno pokriva prek sprožilcev »rast in prerasel Excel« ter »izguba ključnega planerja«, §7 pa prek tipične izjave planerja (»Plan je pravilen samo do prve spremembe«). Lestvica 0–3 je frekvenčna in konsistentna, stopnja 2 »Redno, z vplivom« pa v eno besedo pametno vgradi dimenzijo vpliva iz §19.2, ne da bi zahtevala ločeno oceno. Meja proti zalogam (čakanje na material) je pravilno prestavljena v help podrobnega polja (proizvodnja.ts:75), kjer jo obiskovalec vidi ob vnosu.

*Sklic na raziskavo: proizvodnja.md §10 PLN-01/PLN-02; §7; §19.2*

> ℹ️ *Preverba je ugotovitev popravila:* Umaknjena pretirana trditev, da sta PLN-01/02 »po §17.2 najpogostejša sprožilca nakupa« — §17.2 nestabilnega plana ne navaja neposredno med sprožilci; utemeljitev preusmerjena na §10 in §7 (izjava planerja). Verdikt ohrani nespremenjen.

### `K-13` · IZBOLJŠAJ · ⚪ nizka

**T2 — Kako pogosto nastajajo izmet, dodelave ali reklamacije?**

**Ugotovitev.** Vsebinsko pravo področje (QLT-01/02), a lestvica je nekonsistentna (proizvodnja.ts:141-146): stopnje 0–2 so frekvence (Redko/Mesečno/Tedensko), stopnja 3 pa delež (»Pri velikem deležu nalogov«) — serijec z drobnim, a stalnim izmetom se znajde na 2, čeprav je njegov scrap % nizek, MTO delavnica s 30 % dodelav pa mora preskočiti merilo. Podjetja, ki izmet sploh vodijo, ga poznajo kot % izmeta (§11 scrap rate) — triaža naj ostane občutek, a z enotnim sidrom.

**Kaj narediti.** Stopnje: 0 »Redko ali zanemarljivo« · 1 »Nekajkrat na mesec« · 2 »Tedensko« · 3 »Dnevno oziroma pri velikem deležu nalogov«. Besedilo vprašanja nespremenjeno; tip in mehanika nespremenjena.

*Sklic na raziskavo: proizvodnja.md §10 QLT-01/QLT-02; §11 scrap rate/FPY*

### `K-14` · OHRANI · 🟠 srednja

**T3 — Kako pogosto imate preveč zaloge, hkrati pa manjka pravi material?**

**Ugotovitev.** Skoraj dobesedno MAT-02 (»visoka zaloga in pomanjkanja hkrati«) — dvojni simptom je najboljši možni filter, ker ga ne more potrditi podjetje, ki ima le veliko zalogo iz upravičenih razlogov (varovalka je legitimen vzrok, kar P3 pozna kot kategorijo people 45 % — »Zalogo zavestno držimo kot varovalko«, proizvodnja.ts:227). Ekonomiko podpira §6.4 (zaloga kot blažilnik in strošek hkrati). Lestvica frekvence je čista in stopnjevana.

*Sklic na raziskavo: proizvodnja.md §10 MAT-02; §6.4*

### `K-15` · OHRANI · 🟠 srednja

**T4 — Koliko ročnega dela imate s pripravo nalogov, papirji in prepisovanjem?**

**Ugotovitev.** Pokriva EXE-01 (naknadno poročanje) in EXE-04 (prepisovanje med sistemi) ter DAT-01 — po §13 je to natanko ločnica med zrelostma 1–2, kjer živi ciljni kupec. Stopnje so količinsko zasidrane (»Nekaj ur tedensko« → »skoraj cel človek«, proizvodnja.ts:343-348), kar je odgovorljivo iz glave in se lepo prevede v podrobna urna vprašanja. Stopnja 3 »Za to je potreben skoraj cel človek« je konkretna in nezavajajoča.

*Sklic na raziskavo: proizvodnja.md §10 EXE-01/EXE-04, DAT-01; §13*

### `K-16` · IZBOLJŠAJ · ⚪ nizka

**T5 — Kako pogosto zamujate ali rešujete naročila nujno?**

**Ugotovitev.** Področje je pravo (PLN-03, PUR-01; OTIF je KPI, ki ga zahtevajo veliki kupci — §3.2), a vrstni red stopenj je dvoumen (proizvodnja.ts:445-450): 2 je »Tedensko«, 3 pa »Zamude so pogoste« — tedensko JE pogosto, zato obiskovalec z dnevnimi zamudami ne ve, ali sodi na 2 ali 3, meja med njima pa odloča o vrstnem redu priporočil. Lestvica mora naraščati brez prekrivanja.

**Kaj narediti.** Stopnje: 0 »Roke držimo« · 1 »Nekajkrat mesečno« · 2 »Tedensko« · 3 »Skoraj vsak dan oziroma pri večini naročil«. Brez posega v P5: explainer polja lateOrdersPerMonth že vsebuje navodilo »Če vodite dobavno točnost, vzemite delež zamud × število naročil« — kvečjemu ga dopolni z imenom KPI: »… (1 − OTIF) × število naročil«.

*Sklic na raziskavo: proizvodnja.md §10 PLN-03, PUR-01; §11 OTIF; §9.15*

> ℹ️ *Preverba je ugotovitev popravila:* Triažni del potrjen. Umaknjen predlog dodatnega helpa »vpišite kar delež zamujenih dobav« — polje sprašuje po ŠTEVILU naročil, ne deležu, in obstoječi explainer (proizvodnja.ts:461-463) OTIF-logiko že pokriva; predlog skrčen na neobvezno omembo imena KPI v obstoječem explainerju.

### `K-17` · OHRANI · ⚪ nizka

**T6 — Koliko ročnega dela zahteva priprava poročil in ključnih številk za odločanje?**

**Ugotovitev.** Horizontala pokrije DAT-01/DAT-03 (vsak oddelek svoj Excel, KPI brez enotne definicije) — po §7 je »ne vem, kaj se v resnici dogaja« vodilna frustracija direktorja, torej prav persone, ki vprašalnik najpogosteje izpolni. Stopnje so količinske in enosmerne (horizontal.ts:42-47). Meja proti panožnim uram je rešena s help »Ure, ki ste jih že vpisali v drugem področju, tu ne ponavljajte« (horizontal.ts:56), kar je edini možni mehanizem, ker koda dvojnega štetja ne more preprečiti (načelo v proizvodnja.ts:22-24).

*Sklic na raziskavo: proizvodnja.md §10 DAT-01/DAT-03; §7*

### `K-18` · OHRANI · ⚪ nizka

**T7 — Koliko ročnega dela je v vašem računovodstvu in financah (knjiženje, usklajevanje, obračuni)?**

**Ugotovitev.** Pokriva FIN-01/FIN-02 in del CMP-01; za PANTHEON, ki je v mnogih ciljnih podjetjih že računovodski sistem (§3.4), je to naravno širitveno področje. Stopnji 2 »Več dni vsak mesec« in 3 »Konec meseca je vsakič zamašek« (horizontal.ts:146-151) sta razločljivi — 3 opisuje procesno blokado, ne le količine — in oprijemljivi za direktorja ali finance (kriterij b). Vprašanje v oklepaju samo našteje, kaj šteti, kar zmanjša razpršenost interpretacij.

*Sklic na raziskavo: proizvodnja.md §10 FIN-01/FIN-02; §9.18*

### `K-19` · OHRANI · ⚪ nizka

**T8 — Koliko dela zahtevajo evidence delovnega časa, dopusti in priprava plač?**

**Ugotovitev.** V proizvodnji z izmenami in dodatki je obračun plač nadpovprečno boleč (HR-02; »Pravila za dodatke in nadomestila so zapletena« je med kadriHz vzroki — horizontal.ts:243), evidenca delovnega časa pa je zakonska obveznost, zato vodstvo obseg dela pozna iz glave (kriterij b). Lestvica ur → dni → »velik projekt« je konsistentna. Registracija delovnega časa, povezana z obračunom, je uradna funkcionalnost PANTHEON (horizontal.ts:334), torej ima področje neposredno prodajno nadaljevanje.

*Sklic na raziskavo: proizvodnja.md §10 HR-01/HR-02*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina drži; popravljena sklica na vrstice: vzrok o dodatkih je horizontal.ts:243 (ne 231), registracija delovnega časa horizontal.ts:334 (ne 318).

### `K-20` · OHRANI · ⚪ nizka

**T9 — Koliko časa se izgubi s potrjevanjem, iskanjem in ročnim pošiljanjem dokumentov?**

**Ugotovitev.** Pokriva CMP-01 (ročno zbiranje audit dokazil) in dokumentne dele DAT-01; ZIERDED od 1. 1. 2028 (modul E) daje področju zunanji rok, torej prodajno nujnost. Stopnje so opisno čiste in brez prekrivanja (horizontal.ts:356-362). Meja proti P4 (delovni nalogi so tudi »papirji«) je razumno rešena: T9 govori o potrjevanju/iskanju/pošiljanju poslovnih dokumentov, P4 o proizvodnih nalogih — besedili se ne prekrivata.

*Sklic na raziskavo: proizvodnja.md §10 CMP-01, DAT-01; §21*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina drži; popravljen sklic na vrstice — triažne stopnje so na horizontal.ts:356-362 (ne 341-346).

### `K-21` · OHRANI · ⚪ nizka

**T10 — Koliko dela vam povzročajo garancijska popravila, servis in vodenje reklamacij po predaji?**

**Ugotovitev.** Pokriva QLT-03 (ponavljajoče se reklamacije brez zaprte CAPA zanke) in razmejitev proti T2 je izrecna in pravilna: T2 meri napake PRED predajo, T10 PO njej, help v podrobnem modulu pa dobropise in vračila izrecno izključi (horizontal.ts:494, 506) — natanko kontrola »reklamacija in servis istega primera« iz §12.6. Uporaba proizvodne ure za servisne posege (horizontal.ts:535) je dosledna z logiko dodelav.

*Sklic na raziskavo: proizvodnja.md §10 QLT-03; §12.6*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina drži; popravljeni sklici na vrstice: izключitvi dobropisov sta na horizontal.ts:494 in 506 (ne 471, 480), operativna ura za servis na :535 (ne 506).

### `K-22` · IZBOLJŠAJ · ⚪ nizka

**V5.2 — Približen polni strošek administrativne oziroma vodstvene ure (razponi + privzetek)**

**Ugotovitev.** Številčne trditve ugotovitve so proti kodi napačne: pasovi so »Do 20« (17) / »20–28« (24) / »28–38« (33) / »Več kot 38« (45) (contexts/shared.ts:18-23), privzetek ob praznem vnosu je 25 EUR/h (contexts/proizvodnja.ts:75), ne 35 — privzetek je torej že konservativen in pod predlaganimi 30. Edino, kar iz ugotovitve preživi, je manjkajoče razmejitveno navodilo: adminHour help navaja vodjo proizvodnje, operationalHour pa »kdor dela na delovnem nalogu« — oseba, ki dela oboje, potrebuje pravilo, po kateri postavki šteti katere ure, sicer razmejitev med urnima tipoma polj ni jasna.

**Kaj narediti.** Samo dopolnitev help besedila pri adminHour: »Planer, vodja proizvodnje, nabava, priprava dela. Isto osebo štejte po vrsti ure, ki jo takrat opravlja — ure na delovnem nalogu sodijo v proizvodno postavko.« Pasovi in fallbackEUR 25 ostanejo nespremenjeni.

*Sklic na raziskavo: proizvodnja.md §12.2; §7 (persone in vloge)*

> ℹ️ *Preverba je ugotovitev popravila:* Jedro ovrženo: fallback je 25 EUR/h (ne 35) in spodnji pas »Do 20« s sredino 17 (ne »Do 25« s sredino 20) — sprememba privzetka ni potrebna. Ohranjen le predlog razmejitvenega navodila v help; severity znižana s srednje na nizko.

### `K-23` · IZBOLJŠAJ · 🟠 srednja

**V5.3 — Letni prihodki od prodaje (annualRevenue v koraku 5)**

**Ugotovitev.** Vprašanje je v koraku 5 (contexts/proizvodnja.ts:82-94; popis je tu zastarel, ko trdi, da proizvodnja prihodka ne vpraša), a NOBEN proizvodni modul nima usesRevenue (zastavico nosijo le maloprodaja, trgovina in splošno) — odgovor ne vstopa v nobeno formulo niti v oceno zanesljivosti (potential.ts:155-163 prihodek šteje le, če ga kak izpolnjen modul množi). Obiskovalec torej razkrije občutljiv podatek brez učinka na svoj rezultat — čisto trenje na najbolj občutljivem mestu. Podatek je sicer pravilen imenovalec (§19.1 Q-06) z veliko prodajno vrednostjo, zato ga ne kaže odstraniti, temveč zaposliti.

**Kaj narediti.** Zaposli odgovor kot plavzibilnostno sidro: (1) če je (directLoss + capacity) > 15 % prihodkov, prikaži enako mehko opozorilo kot pri urah (razširitev plausibility.ts; preskoči, kadar je annualRevenue.value 0); (2) v prodajno poročilo dodaj razmerja »izguba / prihodek« in »material / prihodek« (§11: usage variance, inventory turns potrebujeta prav ta imenovalca). Besedilo, pasovi in fallback 0 (»prihodka si ne izmišljamo«) ostanejo nespremenjeni — fallback 0 je skladen s §2.3.

*Sklic na raziskavo: proizvodnja.md §19.1 Q-06; §11; §2.3*

> ℹ️ *Preverba je ugotovitev popravila:* Jedro potrjeno (grep potrdi: usesRevenue nima noben proizvodni modul). Popravljena sklica: annualRevenue je na contexts/proizvodnja.ts:82-94 (ne 69-80), logika relevantnosti prihodka na potential.ts:155-163 (ne 147-155). V predlog dodano varovalo, da se sidro ne računa ob fallbacku 0.

### `K-24` · IZBOLJŠAJ · 🟠 srednja

**V5.4 — Povprečna prispevna marža (contributionMargin v koraku 5)**

**Ugotovitev.** Enako kot pri prihodku: vprašana (contexts/proizvodnja.ts:96-109), a brez porabnika — noben proizvodni modul nima usesMargin, P5 izgubljeno maržo vpraša kar v EUR (zamude.lostMarginEUR, proizvodnja.ts:484-494), kar je po §2.3 (»korist je prispevna marža, ne prihodek«) sicer korekten, a za direktorja težko ocenljiv znesek — explainer mu celo naroči, naj množenje z maržo opravi sam. Raziskava §6.3 in §12.2 monetizacijo izgubljene prodaje predpisujeta kot enote × prispevna marža — z maržo iz koraka 5 bi P5 lahko vprašal lažje vprašanje (kriterij b).

**Kaj narediti.** Poveži maržo s P5: vprašanje o izgubljeni marži zamenjaj z »Koliko naročil ste v zadnjih 12 mesecih izgubili oziroma so bila odpovedana zaradi zamud?« (število/leto) + »Povprečna vrednost takega naročila?« (EUR) in računaj izgubljena marža = št. × vrednost × contributionMarginRate; na modul zamude dodaj usesMargin: true (koš directLoss, kot zdaj). Pomoč: »Ne vpisujte celotne vrednosti naročila — upoštevali bomo samo maržo.« Fallback marže 0,25 je po contextTypes zavestno ne-ničeln, estimated pa zanesljivost pravilno zniža. Do te spremembe naj vprašanje o marži v koraku 5 nosi oznako, da je podlaga za poročilo, ne za izračun.

*Sklic na raziskavo: proizvodnja.md §6.3; §12.2; §2.3*

> ℹ️ *Preverba je ugotovitev popravila:* Jedro potrjeno (usesMargin nima noben proizvodni modul). Popravljena sklica: contributionMargin na contexts/proizvodnja.ts:96-109 (ne 82-94), lostMarginEUR na proizvodnja.ts:484-494 (ne 456-463). Dodan zapis, da obstoječi explainer množenje z maržo že zahteva od uporabnika — kar predlog prenese v formulo — in pojasnilo o fallbacku 0,25 ter zastavici usesMargin.

### `K-25` · PREMAKNI · 🟠 srednja

**annualMaterialSpendEUR — Kolikšna je letna vrednost porabljenega materiala? (danes v P2)**

**Ugotovitev.** Letni materialni stroški so po §19.1 Q-06 lastnost podjetja (imenovalec), ne področja — ista logika, s katero je bila urna postavka izvzeta iz modulov (komentar proizvodnja.ts:26-28). Danes je vprašanje ujeto v P2 (proizvodnja.ts:149-155): kdor Izmeta v triaži ne izbere, tega imenovalca sploh ne pove, čeprav bi ga potrebovali za razmerja v poročilu in za prihodnja področja (MAT-03 presežna poraba nad normativom, ki po popisu manjka v celoti). Povrhu privzetek 3 % izmeta (scrapSharePercent, proizvodnja.ts:157-164) vneseno vrednost materiala pomnoži v znesek, ne da bi uporabnik delež izmeta potrdil — v koraku 5 z razponi in izrecno izbiro bi bil ta privzetek pod uporabnikovim nadzorom.

**Kaj narediti.** Premakni v korak 5 kot ScaleQuestion: »Letna vrednost porabljenega materiala« · pasovi »Do 0,5 mio« (300k) / »0,5–2 mio« (1,1 mio) / »2–8 mio« (4 mio) / »Več kot 8 mio« (15 mio) · fallback 0 (materiala si ne izmišljamo — enako pravilo kot pri prihodku) · help »Surovine in komponente, porabljene v proizvodnji, brez trgovskega blaga.« Izvedba: nov neobvezen vnos v SegmentContext (npr. annualMaterialSpend?: ScaleQuestion), novo polje annualMaterialSpendEUR v ComputeContext (buildComputeContext, potential.ts:54-63) in zastavica usesMaterialSpend v ModuleDefinition za oceno zanesljivosti — po vzoru usesRevenue. P2 formula izmeta bere vrednost iz konteksta; ob fallbacku 0 postavka izmeta pošteno izpade, namesto da 3 % privzetek ustvari znesek brez potrditve.

*Sklic na raziskavo: proizvodnja.md §19.1 Q-06; §10 MAT-03; §2.3*

> ℹ️ *Preverba je ugotovitev popravila:* Jedro potrjeno. Popravljen sklic (polje je na proizvodnja.ts:149-155, ne 145-150) in precizirana trditev »samo od sebe ustvari znesek«: znesek nastane šele ob vnosu materiala, ker je privzetek polja 0 — problem je nepotrjeni 3 % delež, ne polje samo. V predlog dodana konkretna mesta izvedbe (SegmentContext, ComputeContext, zastavica po vzoru usesRevenue).

### `K-26` · DODAJ · ⚪ nizka

**NOVO kontekstno vprašanje: število delovnih nalogov oziroma naročil na mesec**

**Ugotovitev.** Imenovalec iz §19.1 Q-03 (št. naročil/DN) manjka v celotnem vprašalniku, P5 pa zaradi tega sprašuje dvoumno »Od koliko naročil mesečno jih povprečno odpremite z zamudo?« (proizvodnja.ts:453-464, contextOnly) — brez celotnega števila naročil obseg zamud ni interpretabilen (5 zamud od 20 ali od 600?). Dinamični vzorec §19.3 se začne prav s »količino dogodkov«. Kot pasovna izbira je odgovor iz glave v 10 sekundah in da prodajnemu poročilu merilo velikosti operacije.

**Kaj narediti.** Najpreprostejša izvedba brez spremembe sheme: contextOnly izbirno polje v P5, tik pred lateOrdersPerMonth — key 'monthlyOrdersBand', kind 'choice', contextOnly: true, choices (value 0–3): »Do 20« / »20–100« / »100–500« / »Več kot 500«, privzetek brez pomena za izračun; prodajno poročilo iz njega skupaj z lateOrdersPerMonth izpelje delež zamujenih naročil (oboje pride v measured.answers). Slabost: vidno le, kadar je izbrano področje Roki — če naj bo merilo velikosti operacije za vse, je alternativa kontekstno vprašanje v koraku 3 z razširitvijo SegmentContext (glej item o kooperantih).

*Sklic na raziskavo: proizvodnja.md §19.1 Q-03; §19.3*

> ℹ️ *Preverba je ugotovitev popravila:* Popravljen sklic (lateOrdersPerMonth je na proizvodnja.ts:453-464, ne 433-439) in mehanizem: prvotni predlog »radio (contextOnly) v koraku 3« meša modulski pojem contextOnly s kontekstnimi vprašanji, ki jih SegmentContext ne podpira brez razširitve. Predlog konkretiziran v shemi skladno različico (contextOnly choice v P5) z izrecno navedeno alternativo in njeno ceno.

### `K-27` · DODAJ · ⚪ nizka

**NOVO kontekstno vprašanje: število izmen (korak 3)**

**Ugotovitev.** Izmene so imenovalec iz §19.1 Q-02, dimenzija kompleksnosti §4.3 (točka 2) in izrecen jedrni ICP signal (§3.4: »več kot eno izmeno«), a jih vprašalnik nikjer ne zajame. Za prodajnika je večizmensko podjetje močnejši kandidat za MT terminale (sprotno poročanje ponoči brez pisarne), za ICP pa poceni signal resnosti operacije. Odgovor je trivialen (kriterij b) in ne vstopa v izračun, torej brez tveganja za dvojno štetje.

**Kaj narediti.** Besedilo: »V koliko izmenah dela proizvodnja?« · tip: radio, kot dodatno kontekstno vprašanje koraka 3 (ista razširitev SegmentContext.extraQuestions kot pri kooperantih) · možnosti (stabilni id-ji): ena »Eni« / dve »Dveh« / triNeprekinjeno »Treh oziroma neprekinjeno« · privzetek: brez (neobvezno) · formula: ne vstopa v izračun; oznaka se zapiše v qualification prodajnega poročila in exportRecord. Uporaba v ICP zahteva razširitev IcpSignals in novo/dopolnjeno dimenzijo — to je ločena odločitev o utežeh, zato v prvem koraku samo zapis v poročilo.

*Sklic na raziskavo: proizvodnja.md §19.1 Q-02; §4.3; §3.4*

> ℹ️ *Preverba je ugotovitev popravila:* Ohranjen »dodaj«; popravljen mehanizem — vprašanje potrebuje isto razširitev SegmentContext kot kooperanti (StepContext izriše natanko tri vprašanja), zapis gre v qualification/exportRecord, ne v modulska polja; »ICP signal« omiljen v dvostopenjski predlog, ker IcpSignals izmen danes ne pozna in bi sprememba uteži zahtevala ločeno kalibracijsko odločitev.

---

## 4. P1 Plan, kapacitete in navodila + P4 Delovni nalogi in podatki

*2× ohrani · 8× izboljšaj · 3× dodaj*

| ID | Sodba | Teža | Vprašanje |
|---|---|---|---|
| `P-01` | IZBOLJŠAJ | 🟠 | planningMethod — "Kako danes planirate proizvodnjo?" |
| `P-02` | IZBOLJŠAJ | 🟠 | waitingHoursPerMonth — "Koliko skupnih človek-ur mesečno proizvodnja čaka zaradi nejasne… |
| `P-03` | IZBOLJŠAJ | 🔴 | overtimeHoursPerMonth — "Koliko nadur mesečno povzroča predvsem spreminjanje plana?" |
| `P-04` | IZBOLJŠAJ | 🟠 | replanningHoursPerMonth — "Koliko ur mesečno porabite za ponovno planiranje, usklajevanj… |
| `P-05` | IZBOLJŠAJ | 🔴 | mainCause (planiranje) — "Kaj je glavni vzrok?" + nabor PLANIRANJE_CAUSES |
| `P-06` | DODAJ | 🔴 | DODAJ (planiranje): breakdownHoursPerMonth — "Koliko skupnih človek-ur mesečno proizvodn… |
| `P-07` | DODAJ | 🟠 | DODAJ (planiranje): planChangesPerWeek — "Kolikokrat v tipičnem tednu se že potrjen plan… |
| `P-08` | IZBOLJŠAJ | 🟠 | orderAdminHoursPerMonth — "Koliko skupnih ur mesečno porabite za pripravo, tiskanje, zbi… |
| `P-09` | OHRANI | ⚪ | retypingHoursPerMonth — "Koliko skupnih ur mesečno porabite samo za prepisovanje podatko… |
| `P-10` | IZBOLJŠAJ | 🟠 | dataFixHoursPerMonth — "Koliko ur mesečno porabite za popravljanje napačnih, manjkajočih… |
| `P-11` | IZBOLJŠAJ | 🟠 | reportingTiming — "Kdaj se dejanska poraba materiala in opravljeno delo evidentirata?" |
| `P-12` | OHRANI | ⚪ | mainCause (nalogi) — "Kaj je glavni vzrok?" + nabor NALOGI_CAUSES |
| `P-13` | DODAJ | 🟠 | DODAJ (nalogi): workOrdersPerMonth — "Koliko delovnih nalogov povprečno odprete na mesec?" |

### `P-01` · IZBOLJŠAJ · 🟠 srednja

**planningMethod — "Kako danes planirate proizvodnjo?"**

**Ugotovitev.** Vprašanje je contextOnly (proizvodnja.ts:55–67) in ima prodajno vrednost (salesReport.ts:407–410 ga izpiše med odgovori; salesPlaybook.ts:105–116 ga uporabi kot REZERVNO iztočnico, kadar ni nobene odprte številke), a se za obiskovalca močno prekriva s kontekstnim currentSystem "Kako danes vodite proizvodnjo?" (contexts/proizvodnja.ts:40–49): "Excel" in "papir" se pojavita v obeh. Možnost "ERP brez zanesljivega planiranja" sicer stopnjo 2 modela zrelosti (§13) delno že zajame, a meša orodje in proces. Raziskava §9.4 ponuja ostrejšo lestvico zrelosti terminiranja (ročni seznam → grobo kapacitetno → končno terminiranje/APS): vprašanje naj meri, KAKO nastaja terminski plan, currentSystem pa orodje — prekrivanje izgine, diagnostična vrednost (PLN-01/PLN-04) ostane.

**Kaj narediti.** Novo besedilo: "Kako določate vrstni red in roke delovnih nalogov?" · tip: choice, contextOnly · možnosti (vrednosti 0–3): "S planom v sistemu, ki upošteva kapacitete (MRP/APS)" / "V sistemu, a vrstni red določamo ročno — kapacitete niso zanesljive" / "V Excelu ali na planski tabli" / "Sproti, po dogovoru in prioritetah" · privzeto: 2 · help: "Sistem za vodenje proizvodnje ste izbrali že prej; tu nas zanima, kako dejansko nastaja terminski plan — to dvoje se pogosto razlikuje." POZOR: zaradi testa explainers.test.ts mora polje ob dodanem help dobiti tudi explainer (npr. kratka razlaga razlike med orodjem in procesom terminiranja).

*Sklic na raziskavo: §9.4 (stopnje zrelosti terminiranja), §13 (stopnja 2), PLN-01, PLN-04*

> ℹ️ *Preverba je ugotovitev popravila:* Popravljeni sklici: polje je na proizvodnja.ts:55–67 (ne 54–66), currentSystem na contexts/proizvodnja.ts:40–49 (29–38 je businessType), izpis odgovorov na salesReport.ts:407–410 (ne 389–395). Ublažena trditev o iztočnici: salesPlaybook contextOnly odgovore uporabi le kot rezervo, ko drugih iztočnic ni. Dodana opomba, da možnost "ERP brez zanesljivega planiranja" stopnjo 2 delno že pokriva, in zahteva po explainerju ob novem helpu.

### `P-02` · IZBOLJŠAJ · 🟠 srednja

**waitingHoursPerMonth — "Koliko skupnih človek-ur mesečno proizvodnja čaka zaradi nejasnega plana, napačnih prioritet ali manjkajočih navodil?"**

**Ugotovitev.** Prvotna premisa, da izpeljava po §12.2/§19.3 manjka, NE drži: explainer (proizvodnja.ts:76–79) izpeljavo že vsebuje ("koliko ljudi × koliko minut na izmeno × število delovnih dni. Primer: 5 ljudi × 20 min × 21 dni ≈ 35 ur"). Ostane pa realna luknja pri meji: help (proizvodnja.ts:75) izključuje okvare strojev, a okvare nimajo doma v nobenem modulu (popis, vrstica 395: "neplanirani zastoji in vzdrževanje" v celoti manjkajo) — obiskovalec z okvarno bolečino ure bodisi izpusti bodisi jih proti navodilu vpiše sem. Meja do Zalog (material) je zgledna in skladna s §12.6 ("čakanje na material pri planiranju in nabavi").

**Kaj narediti.** Besedilo, enoto in explainer ohrani (izpeljava tam že je — ne podvajaj je v help, konvencija datoteke je: help = meja, explainer = izpeljava s primerom). Ob sprejetju dodanega vprašanja breakdownHoursPerMonth help popravi v: "Čakanje na manjkajoč material sodi v Zaloge, čakanje zaradi okvar strojev pa v spodnje vprašanje o okvarah." Mini-izračun treh polj v UI ostane kot neobvezna nadgradnja, ni pogoj.

*Sklic na raziskavo: §12.2 (Ročno delo, Zastoj), §19.3, §12.6, PLN-01, MAT-01*

> ℹ️ *Preverba je ugotovitev popravila:* Ovržen del rationale o manjkajoči izpeljavi — explainer na proizvodnja.ts:76–79 jo že vsebuje, zato predlog ne sme širiti helpa z izpeljavo (podvajanje, ki ga test explainers.test.ts sicer dovoli, konvencija datoteke pa ne). Severity znižana z visoka na srednja: preostane samo enovrstična popravka meje, vezana na sprejetje breakdownHoursPerMonth. Sklic help popravljen na vrstico 75.

### `P-03` · IZBOLJŠAJ · 🔴 visoka

**overtimeHoursPerMonth — "Koliko nadur mesečno povzroča predvsem spreminjanje plana?"**

**Ugotovitev.** Nadure gredo danes samo v koš capacity (proizvodnja.ts:81–87 polje, 97–108 compute), kar je za osnovno uro pravilno, za nadurni DODATEK pa ne: dodatek (v Sloveniji po kolektivnih pogodbah praviloma 30 % in več) je izplačan denar povrh plače, torej pravi izogibni strošek. KPI slovar §11 ("Nadure — loči osnovno uro in dodatek") in kontrola §12.6 ("polna urna postavka nadure in nato še nadurni dodatek") ločitev izrecno zahtevata — in predlog ju spoštuje: capacity uporablja REDNO urno postavko (osnova), directLoss samo 30-odstotni dodatek; skupaj 130 % = dejanski strošek nadurne ure, nič ni dvakrat. HR-02 nadure uvršča v kanal "neposredni strošek". Past 0 EUR drži za kartico "Neposredni letni stroški": naslovni znesek je samo directLoss (popis, vrstica 356; ResultsSummary.tsx:58–62 kartico prikaže vedno, tudi z 0), pri kombinaciji Plan + Nalogi je danes 0 EUR — kapaciteta je sicer prikazana, a ločeno in z opombo, da ni prihranek plač.

**Kaj narediti.** Besedilo vprašanja ohrani; v compute dodaj tretji izhod: { bucket: 'directLoss', label: 'Nadurni dodatek zaradi sprememb plana', valueEUR: overtimeHoursPerMonth × operationalHourCostEUR × 0.30 × MONTHS_PER_YEAR, addressableShare } — konstanto 0.30 zapiši v config/modules/shared.ts s komentarjem KALIBRACIJA (vzorec: RECEIVABLES_CAPITAL_COST, shared.ts:24–27). Dodaj help: "Štejte nadure, ki jih izplačate ali koristite. Dodatek za izplačane nadure je denar, ki dejansko odteče — prikažemo ga kot neposredno izgubo, osnovno uro pa kot vezano kapaciteto." in OBVEZNO tudi explainer (explainers.test.ts: vsako polje s help mora imeti explainer), npr. z izpeljavo: nadurne ure × urna postavka × 0,30.

*Sklic na raziskavo: §12.6 (kontrola nadur), §11 (KPI Nadure), HR-02, §6.2, §12.2 (Ročno delo — monetizacija "manj nadur")*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebinsko potrjeno (preverjeno: §12.6 kontrola ni kršena, ker capacity uporablja redno postavko, ne polne nadurne). Popravljeni sklici: polje proizvodnja.ts:81–87, compute 97–116 (ne 94–103); trditev o 0 EUR natančneje: velja za kartico "Neposredni letni stroški" (ResultsSummary.tsx:58–62, popis vrstica 356), kartica kapacitete pa se ob Plan+Nalogi vseeno prikaže. Dodana zahteva po explainerju ob novem helpu in sklic na konvencijo KALIBRACIJA v shared.ts.

### `P-04` · IZBOLJŠAJ · 🟠 srednja

**replanningHoursPerMonth — "Koliko ur mesečno porabite za ponovno planiranje, usklajevanje prioritet in iskanje informacij?"**

**Ugotovitev.** Polje (proizvodnja.ts:88–94) nima help besedila — NI pa edino tako v modulu: tudi overtimeHoursPerMonth (81–87) je brez njega (kar rešuje ločena ugotovitev). Manjkajoča meja je realna luknja za dvojno štetje, ker polje meji na tri sosede: "iskanje informacij" na dataFixHoursPerMonth v Nalogih (370–376), "usklajevanje" na obveščanje kupcev v Rokih (496–506 — tamkajšnji help na vrstici 501 res kaže nazaj sem, obratne meje pa ni) in na horizontalno Analitiko (horizontal.ts:56). Načelo 2 v glavi datoteke (proizvodnja.ts:22–24) in §12.6 zahtevata, da meje živijo v helpih. Pot prek pogostosti izboljša odgovorljivost (PLN-01: "št. sprememb plana").

**Kaj narediti.** Dodaj help: "Štejte ure planerja in vodij. Popravljanje napačnih podatkov sodi v Delovne naloge, obveščanje kupcev o zamudah pa v Roki." in explainer (obvezno zaradi explainers.test.ts) z izpeljavo: "Ocenite prek pogostosti: kolikokrat na teden plan prenavljate × koliko časa vzame ena prenovitev. Primer: 3-krat na teden × 2 h ≈ 26 ur na mesec." Besedilo, tip, enota in privzetek 0 ostanejo.

*Sklic na raziskavo: PLN-01, §12.6, §19.3, §20 (VoC: "Kolikokrat tedensko plan prepišete?")*

> ℹ️ *Preverba je ugotovitev popravila:* Ovržena trditev "edino številčno polje modula brez help besedila" — tudi overtimeHoursPerMonth ga nima. Popravljen sklic polja na 88–94 (83–89 kaže na overtime). Predlog razdeljen po konvenciji datoteke: meja v help, izpeljava s primerom v explainer; dodana zahteva po explainerju zaradi testa.

### `P-05` · IZBOLJŠAJ · 🔴 visoka

**mainCause (planiranje) — "Kaj je glavni vzrok?" + nabor PLANIRANJE_CAUSES**

**Ugotovitev.** Nabor (proizvodnja.ts:32–38) dobro sledi vzročnemu drevesu za zamude (§10); naslovljivi deleži (addressableShare.ts:28–35: planning 0,65, data 0,75, external 0,25, unknown 0,3) so konservativni. Nekonsistentna je možnost "Okvare strojev ali drugi tehnični razlogi" (physical, 0,15): help pri urah čakanja (proizvodnja.ts:75) obiskovalcu naroča, naj okvar NE vpisuje — kdor help uboga, te možnosti nikoli ne potrebuje; kdor jo izbere, je vpisal ure proti navodilu, in ker je vzrok en za ves modul, na 15 % padeta tudi ponovno planiranje in nadure, ki z okvarami nimajo zveze. Enojni vzrok namesto treh z deleži (§19.3, točka 4) je zavestna poenostavitev, ki jo je smiselno obdržati.

**Kaj narediti.** Ob sprejetju breakdownHoursPerMonth možnost "Okvare strojev ali drugi tehnični razlogi" iz nabora ODSTRANI — okvarne ure dobijo fiksni 0,15 delež na svoji postavki, glavni vzrok ostane o planu, podatkih in kupcih. Opomba za izvedbo: vrednosti mainCause so zaporedni indeksi (addressableShare.ts:56–69), odstranitev sredinske možnosti premakne pomen shranjenih vrednosti — privzetek "Ne vemo" ostane zadnji, neveljaven indeks varno pade na 'unknown' (addressableShare.ts:72–76). Če dodano vprašanje ne bo sprejeto, namesto tega popravi help pri urah čakanja, da okvarno čakanje izrecno sodi tja — sedanje protislovje (help ure prepoveduje, vzrok jih predpostavlja) je najslabša od obeh možnosti.

*Sklic na raziskavo: §10 (vzročno drevo za zamude), §12.6, §19.3 (trije vzroki z deleži), MNT-01*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebinsko potrjeno. Popravljeni sklici: nabor na proizvodnja.ts:32–38 (ne 31–37), help na vrstici 75 (ne 74), deleži na addressableShare.ts:28–35 potrjeni. Dodana izvedbena opomba o premiku indeksov ob odstranitvi možnosti in o varnem padcu na 'unknown'.

### `P-06` · DODAJ · 🔴 visoka

**DODAJ (planiranje): breakdownHoursPerMonth — "Koliko skupnih človek-ur mesečno proizvodnja stoji zaradi okvar strojev?"**

**Ugotovitev.** Neplanirani zastoji zaradi okvar so bolečina MNT-01 (dokaz: downtime, MTBF) in v vprašalniku nimajo NOBENEGA doma — popis (vrstica 395) jih našteva med v celoti manjkajočimi, help v Planu (proizvodnja.ts:75) pa jih izrecno izključi. Predlog ne podvaja nobenega modula (preverjeno čez vseh šest). Fiksni naslovljivi delež 0,15 (physical) drži obljubo, da ERP fizičnih vzrokov ne odpravi (MNT-01: I+P+F), znesek pa je izmerjen in prodajno uporaben (MNT-02: I+P). Formula sledi §12.2 (Zastoj = ure × strošek ure) in ne krši §6.3 (nobene trditve o dodatnem throughputu ali marži). Per-postavka delež je tehnično podprt: ModuleOutputDraft.addressableShare, moduleTypes.ts:~190–201.

**Kaj narediti.** Besedilo: "Koliko skupnih človek-ur mesečno proizvodnja stoji zaradi okvar strojev?" · tip: number · enota: h/mesec · privzeto: 0 · help: "Redne menjave, nastavitve in planirano vzdrževanje sem ne sodijo." · explainer (OBVEZEN zaradi explainers.test.ts): "Samo čakanje ljudi ob nepredvidenih okvarah. Ocenite: št. okvar na mesec × koliko ljudi stoji × koliko časa. Primer: 3 okvare × 4 ljudje × 2 h ≈ 24 ur na mesec." · formula: koš capacity, "Zastoji zaradi okvar strojev" = ure × operationalHourCostEUR × MONTHS_PER_YEAR, s FIKSNIM addressableShare 0.15 (konstanta ADDRESSABLE_SHARE.physical iz addressableShare.ts, ne iz mainCause). Hkrati popravi help pri waitingHoursPerMonth (glej tamkajšnjo ugotovitev).

*Sklic na raziskavo: MNT-01, MNT-02, §9.9, §12.2 (Zastoj), §6.3, addressableShare.ts (physical 0.15)*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebinsko potrjeno (manjkajoči dom okvar, nepodvajanje, shema, fiksni delež). Popravljeno: sklic moduleTypes.ts na ~190–201 (addressableShare je na vrstici 201, ne 171–193); izpeljava s primerom premaknjena iz help v explainer po konvenciji datoteke; dodana zahteva po explainerju zaradi testa in napotek, naj delež pride iz obstoječe konstante ADDRESSABLE_SHARE.physical.

### `P-07` · DODAJ · 🟠 srednja

**DODAJ (planiranje): planChangesPerWeek — "Kolikokrat v tipičnem tednu se že potrjen plan spremeni?"**

**Ugotovitev.** Modulu manjka imenovalec — število dogodkov, ki je po §19.3 PRVO vprašanje vsakega področja in po PLN-01 trdi dokaz ("št. sprememb, adherence"). Številka sidra urne ocene in da prodajniku natanko vprašanje, ki ga §20 priporoča kot odpiralec ("Kolikokrat tedensko plan prepišete in zakaj?"). Vprašanje je odgovorljivo iz glave, ne podvaja nobene formule (contextOnly, brez compute). Vzorec number + contextOnly + help + explainer že obstaja: lateOrdersPerMonth, proizvodnja.ts:453–464. contextOnly polnjenje prodajnega poročila potrjeno (salesReport.ts:407–410); contextOnly polja so pravilno izvzeta iz plavzibilnostne vsote ur (plausibility.ts) in iz ocene zanesljivosti (potential.ts:192).

**Kaj narediti.** Besedilo: "Kolikokrat v tipičnem tednu se že potrjen plan spremeni?" · tip: number · enota: sprememb/teden · privzeto: 0 · contextOnly: true · help: "Podatek ne vstopa v izračun — služi kot preverba ur zgoraj in kot izhodišče za pogovor." · explainer (obvezen zaradi explainers.test.ts): "Ocena na pamet zadošča: štejte primere, ko se potrjen vrstni red ali rok naloga spremeni po izdaji. Če vodite spremembe plana, vzemite povprečje zadnjih mesecev." · formula: brez · koš: brez. Pozicija: takoj za planningMethod, pred urami čakanja.

*Sklic na raziskavo: PLN-01, §19.3 (količina dogodkov), §20 (VoC), §24.5*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebinsko potrjeno. Popravljena sklica: lateOrdersPerMonth je na proizvodnja.ts:453–464 (ne 432–440), izpis contextOnly odgovorov na salesReport.ts:407–410 (ne 389–395). Help razdeljen na help + obvezni explainer zaradi explainers.test.ts.

### `P-08` · IZBOLJŠAJ · 🟠 srednja

**orderAdminHoursPerMonth — "Koliko skupnih ur mesečno porabite za pripravo, tiskanje, zbiranje in zaključevanje delovnih nalogov?"**

**Ugotovitev.** Vprašanje meri pravo bolečino (EXE-01, DN kot kontrolni objekt §9.6) in pravilno uporablja admin uro (polje proizvodnja.ts:351–357, compute postavka 399–405), a je v obliki "skupne ure mesečno" težko odgovorljivo iz glave in brez vsakršnega help/explainer besedila. Raziskava §12.2 predpisuje lažjo pot: primeri × minute / 60 — vodja število DN in minute na nalog pozna bolje kot skupno vsoto. Skupaj z dodanim vprašanjem workOrdersPerMonth dobi obiskovalec izpeljavo, kalkulator pa preverbo.

**Kaj narediti.** Besedilo ohrani; dodaj explainer z izpeljavo: "Ocenite prek števila nalogov: št. DN na mesec × minute na nalog (priprava + zaključevanje) / 60. Primer: 120 DN × 15 min ≈ 30 h/mesec." Ker test explainers.test.ts zahteva explainer le ob obstoju help, sta možni dve skladni poti: (a) samo explainer brez help — dovoljeno in najcenejše, ali (b) help z mejo "Prepisovanje podatkov med orodji sodi v naslednje vprašanje." plus explainer. Priporočena pot (b), ker recipročna meja do retypingHoursPerMonth (ta ima mejo zapisano le v svojem helpu, vrstica 364) doslej obstaja samo v eni smeri. Tip, enota in privzetek ostanejo.

*Sklic na raziskavo: §12.2 (Ročno delo), §19.3, §9.6, EXE-01*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebinsko potrjeno. Popravljena sklica: polje je na proizvodnja.ts:351–357, compute postavka na 399–405 (ne 378–384). Izpeljava s primerom premaknjena iz help v explainer po konvenciji datoteke; predlog konkretiziran z dvema skladnima potema in priporočilom recipročne meje do retypingHoursPerMonth.

### `P-09` · OHRANI · ⚪ nizka

**retypingHoursPerMonth — "Koliko skupnih ur mesečno porabite samo za prepisovanje podatkov med ERP-jem, Excelom in papirjem?"**

**Ugotovitev.** Vprašanje natančno meri EXE-04/DAT-01 ("operaterji prepisujejo podatke — vnosi/dokument — delo, napake") in vstopa v izračun z admin uro (compute postavka proizvodnja.ts:406–412). Meja do sosednjega polja je vzorno zapisana v helpu (proizvodnja.ts:364: "Ne vključujte priprave in zaključevanja nalogov iz prvega vprašanja"), horizontalna Analitika pa nosi recipročni help (horizontal.ts:56: "Ure, ki ste jih že vpisali v drugem področju, tu ne ponavljajte."), tako da je §12.6 zadoščeno z obeh strani. Beseda "samo" v besedilu dodatno oži zajem — zgled, kako naj bodo urna vprašanja postavljena.

*Sklic na raziskavo: EXE-04, DAT-01, §12.6, IT-01*

> ℹ️ *Preverba je ugotovitev popravila:* Verdikt "ohrani" potrjen v celoti; popravljena le sklica: help je na proizvodnja.ts:364 (ne 347), recipročni help na horizontal.ts:56 (dobesedno preverjen).

### `P-10` · IZBOLJŠAJ · 🟠 srednja

**dataFixHoursPerMonth — "Koliko ur mesečno porabite za popravljanje napačnih, manjkajočih ali neusklajenih podatkov?"**

**Ugotovitev.** Postavka je realna (BOM-01, INV-01, DAT-01: "reconciliations — admin, napake") in vstopa v izračun (polje proizvodnja.ts:370–376, compute postavka 413–419), a je brez help besedila — NI pa edino tako polje modula, tudi orderAdminHoursPerMonth ga nima (kar rešuje ločena ugotovitev). Meji na dve sosedi: "iskanje informacij" v Planu (replanningHoursPerMonth, 88–94) in ure dodelav zaradi napačnih sestavnic, ki sodijo v Izmet (reworkHoursPerMonth, 165–171). Brez zapisane meje lahko ista ura pade v dve področji — kršitev načela 2 datoteke (proizvodnja.ts:22–24) in §12.6.

**Kaj narediti.** Dodaj help: "Iskanje informacij za plan ste že šteli v področju Plan; ure dodelav zaradi napačnih podatkov sodijo v Izmet in dodelave." in explainer (obvezen zaradi explainers.test.ts): "Popravki podatkov na nalogih, zalogah in šifrantih — napačne količine, manjkajoče šifre, neusklajena stanja. Ocenite: koliko popravkov na teden × koliko minut na popravek." Besedilo, tip, enota in privzetek ostanejo.

*Sklic na raziskavo: §12.6, BOM-01, INV-01, DAT-01*

> ℹ️ *Preverba je ugotovitev popravila:* Ovržena trditev "edino polje modula brez helpa" (tudi orderAdminHoursPerMonth in reportingTiming sta brez njega). Popravljeni sklici: polje 370–376, compute postavka 413–419 (ne 392–398), rework polje 165–171 (ne 161–166). Predlog razdeljen na help (meja) + obvezni explainer (izpeljava).

### `P-11` · IZBOLJŠAJ · 🟠 srednja

**reportingTiming — "Kdaj se dejanska poraba materiala in opravljeno delo evidentirata?"**

**Ugotovitev.** Odlično dejstveno vprašanje (EXE-01 "latency vnosa", §9.7) s pravo lestvico in prodajno vrednostjo kot contextOnly (proizvodnja.ts:377–389; salesReport.ts:407–410; PANTHEON MT je neposreden odgovor nanj). Težava je podvajanje: vedno prikazana diagnostika sprašuje zelo sorodno dejstvo na lestvici zaupanja (realtimeRecording: "Ali sproti evidentirate dejansko porabo materiala in opravljeno delo?", proizvodnja.ts:574–580, ASSURANCE_CHOICES 0–3) — obiskovalec, ki izbere Naloge, odgovarja dvakrat, odgovora pa si lahko v prodajnem poročilu nasprotujeta (npr. "Sproti na terminalu" + "Le približno").

**Kaj narediti.** Vprašanje ohrani v tej (dejstveni) obliki. Za odpravo podvajanja sta poti dve, a NISTA enako dragi: (a) izpeljava realtimeRecording iz reportingTiming (preslikava 0→0 … 3→3 je vrednostno združljiva, obe lestvici sta 0–3) zahteva mehanizem pogojnega prikaza polja glede na aktivne module, ki ga motor danes NIMA (moduleTypes.ts/moduleEngine.ts nimata nobenega visibleWhen/condition) — to je nova zmožnost motorja; (b) cenejša takojšnja pot: diagnostično besedilo zaostri v vprašanje o zanesljivosti, ne času: "Ali vpisani porabi in uram verjamete dovolj, da na njih računate lastno ceno?" — vprašanji se s tem razideta (kdaj vpisujete vs. ali številkam verjamete), protislovje izgine, spremeni se ena vrstica. Priporočena pot (b); pot (a) le, če se mehanizem pogojnih polj uvaja tudi za druge potrebe.

*Sklic na raziskavo: EXE-01, §9.7, §13 (stopnja 2→3), §19.1 (vpr. 10)*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebinsko potrjeno podvajanje, a ublaženo: vprašanji nista dobesedno isti (dejstvo o času vs. ocena zanesljivosti), prekrivata pa se dovolj za protislovne odgovore. Popravljen sklic diagnostike na proizvodnja.ts:574–580 (ne 539–545). Ključna dopolnitev: pot izpeljave zahteva mehanizem pogojnih polj, ki v motorju ne obstaja — zato priporočilo obrnjeno v prid preformulaciji diagnostičnega vprašanja.

### `P-12` · OHRANI · ⚪ nizka

**mainCause (nalogi) — "Kaj je glavni vzrok?" + nabor NALOGI_CAUSES**

**Ugotovitev.** Štirje vzroki (proizvodnja.ts:330–335) pokrivajo realen prostor ročnega dela z nalogi: tri podatkovne različice (0,75) razlikujejo orodja, papir in zamik vnosa — ločene bolečine DAT-01, EXE-01 in EXE-04 z naslovljivostjo E — plus ljudje (0,45) in privzeti "Ne vemo" (0,3). Zunanji in fizični vzrok bi bila tu mašilo: administracija nalogov skoraj nikoli ni posledica dobaviteljev ali okvar, prevlada 75-odstotnega deleža je za čisto administrativno delo zagovorljiva. Zaporedni indeksi in varen padec na 'unknown' sta pravilno izvedena (mainCauseField addressableShare.ts:56–69, addressableShareOf 72–76).

*Sklic na raziskavo: DAT-01, EXE-01, EXE-04, §10 (naslovljivost E)*

> ℹ️ *Preverba je ugotovitev popravila:* Verdikt "ohrani" potrjen v celoti; popravljena sklica: nabor je na proizvodnja.ts:330–335 (ne 313–318), izvedba na addressableShare.ts:56–76 potrjena.

### `P-13` · DODAJ · 🟠 srednja

**DODAJ (nalogi): workOrdersPerMonth — "Koliko delovnih nalogov povprečno odprete na mesec?"**

**Ugotovitev.** Modul sprašuje tri vsote ur brez imenovalca, jedrno vprašanje raziskave §19.1/3 pa število DN izrecno zahteva; §19.3 postavlja količino dogodkov na prvo mesto področja. Število DN vodja pozna iz glave; omogoči izpeljavo ur (glej orderAdminHoursPerMonth) in preverbo ur/DN. Ne podvaja nobenega obstoječega polja (preverjeno). Shema drži: vzorec number + contextOnly + help + explainer obstaja (lateOrdersPerMonth, proizvodnja.ts:453–464), contextOnly polni prodajno poročilo (salesReport.ts:407–410) in je pravilno izvzet iz plavzibilnostne vsote ur ter ocene zanesljivosti.

**Kaj narediti.** Besedilo: "Koliko delovnih nalogov povprečno odprete na mesec?" · tip: number · enota: DN/mesec · privzeto: 0 · contextOnly: true · help: "Podatek ne vstopa v izračun — služi kot preverba ur zgoraj in za oceno obsega." · explainer (obvezen zaradi explainers.test.ts): "Približek zadošča: ure zgoraj, deljene s številom nalogov, morajo dati smiselne minute na nalog. Primer: 30 h in 120 DN ≈ 15 min na nalog." · formula: brez · koš: brez · pozicija: prvo vprašanje modula. LOČEN, NEOBVEZEN drugi korak: opozorilo, kadar orderAdminHoursPerMonth / workOrdersPerMonth preseže ~1 h — to NI razširitev obstoječe funkcije assessHoursPlausibility (ta meri agregatno vsoto ur proti kapaciteti iz števila zaposlenih), ampak nova vrsta razmerne kontrole z lastno funkcijo in prikazom; jedrni predlog stoji tudi brez nje.

*Sklic na raziskavo: §19.1 (vpr. 3), §19.3 (količina dogodkov), §24.1, §12.2*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebinsko potrjeno. Popravljeno: sklic vzorca na proizvodnja.ts:453–464; help razdeljen na help + obvezni explainer; razmerna kontrola ure/DN eksplicitno označena kot NOVA vrsta preverbe (obstoječi assessHoursPlausibility v plausibility.ts meri le vsoto ur proti kapaciteti) in izločena v neobvezen drugi korak, da jedrni predlog ne visi na novi mehaniki.

---

## 5. P2 Izmet, dodelave in kakovost + P3 Zaloge in razpoložljivost materiala

*3× ohrani · 6× izboljšaj · 1× premakni · 3× dodaj*

| ID | Sodba | Teža | Vprašanje |
|---|---|---|---|
| `M-01` | PREMAKNI | 🔴 | annualMaterialSpendEUR — Kolikšna je letna vrednost porabljenega materiala? |
| `M-02` | IZBOLJŠAJ | 🔴 | scrapSharePercent — Kolikšen delež porabljenega materiala postane izmet, ki ga ni mogoče… |
| `M-03` | IZBOLJŠAJ | 🟠 | reworkHoursPerMonth — Koliko skupnih človek-ur mesečno porabite za dodelave in ponovno i… |
| `M-04` | IZBOLJŠAJ | 🔴 | annualClaimsCostEUR — Kolikšni so letni dodatni stroški reklamacij? |
| `M-05` | IZBOLJŠAJ | 🟠 | mainCause (modul material, nabor MATERIAL_CAUSES) — Kaj je glavni vzrok? |
| `M-06` | IZBOLJŠAJ | ⚪ | inventoryValueEUR — Kolikšna je povprečna skupna vrednost zalog? |
| `M-07` | IZBOLJŠAJ | 🟠 | annualWriteOffEUR — Kolikšna je bila vrednost odpisov, razvrednotenj ali dodatnih popust… |
| `M-08` | OHRANI | ⚪ | reducibleShare — Kolikšen delež zalog bi po vaši oceni lahko zmanjšali brez večjega tveg… |
| `M-09` | OHRANI | ⚪ | stockVisibility — Kako dober je vaš pregled nad dejanskimi zalogami? |
| `M-10` | OHRANI | ⚪ | mainCause (modul zaloge, nabor ZALOGE_CAUSES) — Kaj je glavni vzrok? |
| `M-11` | DODAJ | 🔴 | DODAJ (modul material): excessUsagePercent — presežna poraba materiala nad normativom (M… |
| `M-12` | DODAJ | 🟠 | DODAJ (modul zaloge, brez novega vprašanja): letni strošek financiranja presežne zaloge … |
| `M-13` | DODAJ | 🟠 | DODAJ (modul zaloge): annualInventoryDiffEUR — inventurna razlika kot lažje odgovorljiv … |

### `M-01` · PREMAKNI · 🔴 visoka

**annualMaterialSpendEUR — Kolikšna je letna vrednost porabljenega materiala?**

**Ugotovitev.** Polje je čisti imenovalec: samo ne meri nobene bolečine, le skalira scrapSharePercent (proizvodnja.ts:149–155, edina raba v compute na :193). Kot lastnost podjetja sodi v korak 5 (skupna finančna osnova), kjer po prenovi že živita annualRevenue in contributionMargin (contexts/proizvodnja.ts:82–109; costBasisIntro v vrsticah 26–27 govori o 'štirih številkah'). Raziskava ga uvršča med osnovne imenovalce (Priloga A: 'materialni stroški in kooperanti') in ga v jedrnih 22 vpraša skupaj s prihodki in maržo (§19.1, v6). V koraku 5 postane na voljo tudi predlagani presežni porabi MAT-03 (isti imenovalec) in kontrolam verjetnosti; danes ga dobi samo obiskovalec, ki v triaži izbere Izmet.

**Kaj narediti.** Prestavi v korak 5 kot ScaleQuestion z razponi po vzoru annualRevenue (npr. 'Do 500.000 EUR' / '0,5–2 mio' / '2–6 mio' / 'Več kot 6 mio EUR', geometrijske sredine), fallback 0, enota EUR/leto, help: 'Nabavna vrednost porabljenega materiala in kooperantskih storitev v zadnjih 12 mesecih, brez DDV. Če razpona ne izberete, izmeta ne bomo ocenili — številke si ne izmišljamo.' Izvedba po obstoječem vzorcu prihodka: (1) contextTypes.ts — SegmentContext dobi neobvezno annualMaterialSpend?: ScaleQuestion in BusinessProfile ustrezno vrednost; (2) moduleTypes.ts — ComputeContext dobi obvezno annualMaterialSpendEUR (obvezna polja so obstoječi vzorec, glej chargeOutRateEUR); (3) potential.ts buildComputeContext ga preslika; (4) moduleTypes.ts — nova zastavica usesMaterialSpend po vzoru usesRevenue, da ocena zanesljivosti in razlaga povesta, zakaj je izmet ob manjkajočem razponu izpadel; (5) costBasisIntro popravi iz 'Štiri številke' v 'Pet številk'; (6) iz modula material polje odstrani in v compute uporabi context.annualMaterialSpendEUR.

*Sklic na raziskavo: proizvodnja.md §19.1 (v6), Priloga A (Osnovni imenovalci)*

> ℹ️ *Preverba je ugotovitev popravila:* Popravljeni sklici: raba imenovalca je proizvodnja.ts:193 (ne :184), kontekst contexts/proizvodnja.ts:82–109 (ne 69–94), costBasisIntro je v vrsticah 26–27 (ne 15). Predlog konkretiziran: dodan celoten seznam potrebnih posegov (SegmentContext, ComputeContext, buildComputeContext, zastavica usesMaterialSpend po vzoru usesRevenue, popravek costBasisIntro na 'pet številk') — brez zastavice bi izmet ob manjkajočem razponu tiho izpadel brez razlage, kar bi ponovilo napako, ki jo je prenova prihodka ravno odpravila. Vsebina ugotovitve drži.

### `M-02` · IZBOLJŠAJ · 🔴 visoka

**scrapSharePercent — Kolikšen delež porabljenega materiala postane izmet, ki ga ni mogoče uporabiti ali prodati?**

**Ugotovitev.** Privzetek 0,03 je edini neničelni številski privzetek v celotni proizvodnji, ki sam od sebe ustvari znesek: dovolj je vnesti letni material in 'Izmet materiala' = material × 3 % steče v naslovni directLoss (proizvodnja.ts:156–164 in 190–195), ne da bi se obiskovalec drsnika dotaknil — v nasprotju s pravili proti lažni natančnosti (§2.3) in lastnim jamstvom 'nobene številke si ne izmislimo'. Prodajno poročilo polje sicer ujame med untouchedFields (salesReport.ts:310, 482–488) in assessConfidence nedotaknjeni privzetek šteje konservativno (potential.ts:210–214), a stranka na zaslonu rezultata konkretnega opozorila ob znesku ne vidi. Max 15 % je hkrati prenizek za procesne industrije: živila (yield), plastika in papir z zagonskim izmetom (§4.2; SET-02, QLT-01) 15 % realno presežejo. Vprašanje samo je pravilno zastavljeno prek KPI-ja '% izmeta' (scrap rate), ki ga podjetja poznajo.

**Kaj narediti.** Novo besedilo (nespremenjeno jedro): 'Kolikšen delež nabavne vrednosti porabljenega materiala konča kot izmet, ki ga ni mogoče uporabiti ali prodati?'; tip percent (drsnik), min 0, max 0,30, step 0,005, privzeto 0 (ne več 0,03); help: 'Vključite tudi zagonski izmet ob menjavah. Ne štejte tehnološko neizogibnega odreza, ki je že v normativu. Če izmeta ne merite, pustite 0 — raje nič kot ugib; tipične vrednosti so 1–5 %, v procesnih panogah tudi več.' Oznaka 'tipično 3 %' sme ostati ob drsniku kot orientacija (v help ali explainer), ne kot prednastavljeni znesek.

*Sklic na raziskavo: §2.3, §4.2, §10 SET-02/QLT-01, §11 (scrap rate, yield — imenovalec mora biti enoten)*

> ℹ️ *Preverba je ugotovitev popravila:* Popravljeni sklici: polje proizvodnja.ts:156–164, compute :190–195 (ne 151–159 in 184); untouchedFields salesReport.ts:310 in 482–488 (ne 292 in 461–467). Dodano: assessConfidence (potential.ts:210–214) nedotaknjen privzetek že šteje konservativno pri zanesljivosti, kar ugotovitve ne ovrže — znesek v hero directLoss vseeno nastane brez uporabnikovega vnosa. Preverjeno tudi, da je 0,03 res edini samodejno denar-tvorni privzetek v proizvodnji (vsi ostali številski privzetki so 0). Jedro ugotovitve potrjeno.

### `M-03` · IZBOLJŠAJ · 🟠 srednja

**reworkHoursPerMonth — Koliko skupnih človek-ur mesečno porabite za dodelave in ponovno izdelavo?**

**Ugotovitev.** Formula in koš sta pravilna (capacity × operativna ura, proizvodnja.ts:202–210; skladno s §12.2 'strošek dodelave = ure dela'), a polje je edino v modulu brez help in explainer (proizvodnja.ts:166–171), čeprav skupnih človek-ur dodelav nihče ne vodi — §19.3 in §12.2 predpisujeta lažjo pot: število primerov × čas na primer. Poleg tega besedilo ne razmeji dveh sosednjih polj: garancijskih popravil PO predaji, ki jih z isto operativno uro meri servisHz (horizontal.ts:476–486, compute s context.operationalHourCostEUR), in izmeta (dodelana enota ni izmet, izgubljeni material pri dodelavi pa je) — brez tega ista ura ali evro lahko pade dvakrat (§12.6 'dodelava v kakovosti in dodatne ure v proizvodnji').

**Kaj narediti.** Obdrži tip h/mesec. Po konvenciji kodne baze razdeli na kratek help in daljši explainer: help: 'Štejte samo popravila PRED predajo kupcu — garancijska popravila po predaji sodijo v področje Reklamacije in poprodajni servis. Material, izgubljen pri dodelavi, zajemite v deležu izmeta zgoraj.'; explainer: 'Pomagajte si: število dodelav na teden × povprečno trajanje × število ljudi. Primer: 6 dodelav × 1,5 h × 1 oseba ≈ 39 ur na mesec.'

*Sklic na raziskavo: §19.3, §12.2 (dodelava), §10 QLT-02, §12.6*

> ℹ️ *Preverba je ugotovitev popravila:* Popravljeni sklici: compute proizvodnja.ts:202–210 (ne 196–201), servisHz horizontal.ts:476–486 (ne 456–462, 504–508); potrjeno, da servisHz serviceWorkHoursPerMonth res množi isto operativno uro. Predlog konkretiziran po konvenciji kodne baze: meje sodijo v help (vedno viden), računska bližnjica s primerom v explainer (gumb '?'), ker vsa sosednja polja modula sledijo temu vzorcu — ena mešana vrstica help bi odstopala od preostalih polj.

### `M-04` · IZBOLJŠAJ · 🔴 visoka

**annualClaimsCostEUR — Kolikšni so letni dodatni stroški reklamacij?**

**Ugotovitev.** Meja proti servisHz.annualServiceCostEUR (horizontal.ts:500–510: 'nadomestni deli, zunanji servis in kulanca pri garancijskih popravilih') za proizvajalca ni jasna: za isti reklamacijski primer sta to pogosto ista postavka, explainer pri materialu (proizvodnja.ts:179–182) pa celo našteva 'nadomestna dobava, odškodnine', kar se prekriva s servisnim poljem. Help pri materialu (proizvodnja.ts:178) razmeji le proti izmetu in dodelavam; servisni help izključuje 'dobropise, vračila kupnine in poškodovano blago' in s tem implicitno kaže sem, a besedilo pri materialu tega ne pove. Modula 'material' (privzeto izbran — je med prvimi tremi po vrstnem redu, segments.ts:73–86) in 'servisHz' sta lahko izbrana hkrati, zato lahko isti evro pade v obe polji — natanko kontrola §12.6 'reklamacija in servis istega primera'. Manjka tudi allowUnknown, čeprav je to šolski primer zneska, ki ga podjetje bodisi vodi bodisi ne (moduleTypes.ts:160–168).

**Kaj narediti.** Novo besedilo: 'Kolikšni so bili v zadnjih 12 mesecih neposredni stroški reklamacij kupcev — dobropisi, vračila in prevozi zavrnjenega blaga?'; tip number, enota EUR/leto, privzeto 0, allowUnknown: true; help: 'Vnesite samo stroške, ki še niso vključeni v izmet ali dodelave. Garancijskih popravil, nadomestnih delov in kulance PO predaji ne štejte — ti sodijo v področje Reklamacije in poprodajni servis.' Uskladi tudi explainer: iz naštevanja umakni 'nadomestna dobava, odškodnine' (prekrivanje s servisHz) in obdrži računski primer '12 reklamacij × 400 EUR ≈ 4.800 EUR na leto.'

*Sklic na raziskavo: §12.6 (reklamacija in servis istega primera), §10 QLT-03*

> ℹ️ *Preverba je ugotovitev popravila:* Popravljeni sklici: servisHz polje horizontal.ts:500–510 (ne 474–481), help proizvodnja.ts:178 (ne 173), allowUnknown dokumentacija moduleTypes.ts:160–168 (ne 150–158). Oznaki T2/T10 nadomeščeni z dejanskima id-jema modulov ('material', 'servisHz') in preverjeno v segments.ts:73–86, da sta oba v proizvodnem segmentu, material pa med privzeto izbranimi tremi. Dodan popravek explainerja, ki ga izvirna ugotovitev ni opazila: prav explainer ('nadomestna dobava, odškodnine') danes aktivno usmerja v podvajanje s servisnim poljem, zato sprememba samo helpa ne bi zadoščala.

### `M-05` · IZBOLJŠAJ · 🟠 srednja

**mainCause (modul material, nabor MATERIAL_CAUSES) — Kaj je glavni vzrok?**

**Ugotovitev.** Nabor (proizvodnja.ts:127–133) dobro preslika BOM-01 (zastarele sestavnice → data 75 %), napačno verzijo dokumentacije, EXE-02 (poraba ni evidentirana sproti) in ljudi/stroje; privzeti 'Ne vemo' s 30 % (addressableShare.ts:28–35) je pošteno konservativen. Manjka pa najpogostejši vzrok izmeta v serijski in procesni proizvodnji: zagonski izmet ob menjavah in nastavitvah (SET-02; §9.8 med meritvami izrecno našteva 'izmet zagona'). Plastičar ali živilec ga danes stlači v 'Kakovost materiala ali okvare strojev' ali 'Napake pri izvedbi', kar zamegli diagnozo in prodajno poročilo (mainCauseLabel konča v MeasuredArea, salesReport.ts:404).

**Kaj narediti.** V MATERIAL_CAUSES dodaj { label: 'Zagonski izmet ob menjavah in nastavitvah', category: 'physical' } — zadošča pripis na konec seznama, mainCauseField() možnost 'Ne vemo' doda in indekse preštevilči samodejno (addressableShare.ts:56–69). SET-02 je po raziskavi naslovljiv predvsem procesno in fizično (P+I+F), zato je 15-odstotni naslovljivi delež kategorije physical pošten in potenciala ne napihuje.

*Sklic na raziskavo: §10 SET-02, BOM-01, EXE-02; §9.8 (menjave)*

> ℹ️ *Preverba je ugotovitev popravila:* Popravljena sklica: nabor proizvodnja.ts:127–133 (ne 122–128), mainCauseLabel v salesReport.ts:404 (ne 386). Dodana izvedbena opomba, da mainCauseField() indekse in 'Ne vemo' ureja sam, zato je poseg ena vrstica. Preverjeno v §9.8: 'izmet zagona' je izrecno med meritvami, kategorija physical (15 %) pa ustreza naslovljivosti P+I+F iz kataloga. Vsebina potrjena.

### `M-06` · IZBOLJŠAJ · ⚪ nizka

**inventoryValueEUR — Kolikšna je povprečna skupna vrednost zalog?**

**Ugotovitev.** Trditev, da polje ne pove, po kateri vrednosti naj bo zaloga ovrednotena, drži samo za vedno vidni help (proizvodnja.ts:250: 'Vključite surovine, nedokončano proizvodnjo in končne izdelke.') — explainer za gumbom '?' (proizvodnja.ts:251–254) nabavno vrednost in povprečje čez leto že izrecno navaja ('povprečje nekaj mesečnih stanj, po nabavni vrednosti'). Razlika proti trgovini (trgovina.ts:331: 'Vnesite nabavno vrednost blaga na zalogi, ne prodajne' kar v help) je torej v vidnosti, ne v odsotnosti informacije. Ker polje množi edino oneTimeCapital postavko (proizvodnja.ts:312–318), je vrednotenje po napačni (prodajni) osnovi vseeno tveganje za tistega, ki gumba '?' ne odpre; §12.2 za sprostitev zaloge predpisuje nabavno/proizvodno vrednost.

**Kaj narediti.** Samo help dopolni po vzoru trgovine: 'Vključite surovine, nedokončano proizvodnjo in končne izdelke po nabavni oziroma proizvodni lastni ceni, ne prodajni.' Explainer pusti nespremenjen — povprečje čez leto in vir (bilanca) že pokriva.

*Sklic na raziskavo: §12.2 (sprostitev zaloge), §6.4, §19.1 (v7)*

> ℹ️ *Preverba je ugotovitev popravila:* Bistven popravek: izvirna ugotovitev je spregledala, da explainer (proizvodnja.ts:251–254) nabavno vrednost IN povprečje čez leto že navaja — trditev 'help ne pove, po kateri vrednosti' velja le za kratki help. Zato znižana resnost z 'srednja' na 'nizka' in predlog skrčen na eno dopolnilo helpa; drugi stavek izvirnega predloga ('povprečje čez leto, ne stanja tik po veliki dobavi') je podvajal obstoječi explainer in je umaknjen. Popravljeni sklici: help :250, compute :312–318 (ne 241 in 296–301).

### `M-07` · IZBOLJŠAJ · 🟠 srednja

**annualWriteOffEUR — Kolikšna je bila vrednost odpisov, razvrednotenj ali dodatnih popustov zaradi zastaranja zaloge v zadnjih 12 mesecih?**

**Ugotovitev.** Vprašanje je pravo (INV-02 aged stock) in formula poštena — znesek gre v directLoss brez množenja (proizvodnja.ts:299–304). Manjka pa allowUnknown, čeprav je odpis natanko primer zneska, 'ki ga podjetje bodisi vodi bodisi ne' (moduleTypes.ts:160–168) — maloprodajna vzporednica ga ima (maloprodaja.ts:223–229, annualWriteOffEUR z allowUnknown: true). Brez njega neznanje tiho postane potrjena ničla, kar je napaka, ki jo UNKNOWN_ANSWER izrecno preprečuje (moduleTypes.ts:38–52), 'Ne vem' pa bi prodajniku dal iztočnico (salesPlaybook.ts:90–95).

**Kaj narediti.** Dodaj allowUnknown: true. Ob uvedbi vprašanja o inventurni razliki (glej predlog spodaj) dopolni help: 'Inventurnih mankov ne štejte sem — vprašamo jih posebej.'

*Sklic na raziskavo: §10 INV-02; moduleTypes.ts:41 (sklic na maloprodajno raziskavo §16.3/§24)*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina v celoti potrjena (polje proizvodnja.ts:256–262 res nima allowUnknown, maloprodajna vzporednica ga ima, playbook iztočnico iz 'Ne vem' res gradi na salesPlaybook.ts:90–95). Popravljeni le sklici na vrstice: compute :299–304, moduleTypes allowUnknown :160–168 (ne 150–158), UNKNOWN_ANSWER :38–52 (ne 40–52), maloprodaja.ts:223–229.

### `M-08` · OHRANI · ⚪ nizka

**reducibleShare — Kolikšen delež zalog bi po vaši oceni lahko zmanjšali brez večjega tveganja za oskrbo?**

**Ugotovitev.** Varuje ločnico §2.3 'sprostitev zaloge je enkratni denarni učinek, ne letni prihranek': rezultat gre izključno v oneTimeCapital brez naslovljivega deleža, ker znesek že JE potencial (proizvodnja.ts:312–318, z izrecnim komentarjem proti dvojnemu štetju). 'Ne vem' pade na najkonservativnejših 5 % (shared.ts:59 in 86–92), je označen kot unknown, zniža zanesljivost in prodajniku da iztočnico 'kdo v podjetju to ve?' (salesPlaybook.ts:90–95) — to je pošteno: ne nič (kar bi zanikalo vsak potencial) in ne sredina (kar bi ugibalo). Formulacija 'brez večjega tveganja za oskrbo' prepreči naivno maksimiranje, kar ustreza §6.4 (zaloga je tudi blažilnik).

*Sklic na raziskavo: §2.3, §6.4, §12.2*

> ℹ️ *Preverba je ugotovitev popravila:* Vse trditve potrjene (REDUCIBLE_SHARES[4] = 0.05 = indeks 'Ne vem'; oneTimeCapital brez addressableShare; playbook iztočnica). Popravljeni le sklici: proizvodnja.ts:312–318 (ne 296–301), shared.ts:59 in 86–92 (ne 81–83).

### `M-09` · OHRANI · ⚪ nizka

**stockVisibility — Kako dober je vaš pregled nad dejanskimi zalogami?**

**Ugotovitev.** Polje je contextOnly (proizvodnja.ts:279–291) in v formulo ne vstopa, a ima jasno diagnostično in prodajno vrednost: odgovor konča v prodajnem poročilu kot AnswerRow (salesReport.ts:407–413, s contextOnly zastavico) in je rezervna iztočnica playbooka, kadar drugih ni (salesPlaybook.ts:104–115). Odgovor 'Pogosto ugotovimo šele ob inventuri' je neposreden signal bolečine INV-01 in argument za PANTHEON alinejo 'Skladišča, lokacije, serije in loti'. Odgovorljivo v petih sekundah, nič ne podvaja — verdikta 'odstrani' ni, kontrola za contextOnly polja je s tem izpolnjena.

*Sklic na raziskavo: §10 INV-01, §9.14*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena — polje res polni prodajno poročilo in playbook, kot zahteva kontrola za contextOnly polja. Popravljena sklica: polje proizvodnja.ts:279–291 (ne 262–274), AnswerRow salesReport.ts:407–413 (ne 389–395); sklic salesPlaybook.ts:104–115 je bil točen.

### `M-10` · OHRANI · ⚪ nizka

**mainCause (modul zaloge, nabor ZALOGE_CAUSES) — Kaj je glavni vzrok?**

**Ugotovitev.** Pet vzrokov (proizvodnja.ts:222–228) pokrije glavne poti iz kataloga bolečin: MAT-02 (parametri in plan → planning 65 %), INV-01 (stanje zalog/lokacij → data 75 %), nepovezanost nabave s planom (PUR-01/PLN → planning 65 %), nezanesljive dobavitelje (PUR-02 → external 25 %) in zavestno varovalko (people 45 %). Kategorizacija varovalke kot people/45 % je zagovorljiva sredina — gre za politiko, ki jo sistem z boljšo napovedjo omili, ne odpravi. Privzeti 'Ne vemo' 30 % drži potencial konservativen (addressableShare.ts:28–35).

*Sklic na raziskavo: §10 MAT-02, INV-01, PUR-01, PUR-02*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina in vse preslikave kategorij preverjene in potrjene v kodi. Popravljen le sklic: nabor je proizvodnja.ts:222–228 (ne 213–219); addressableShare.ts:28–35 je bil točen.

### `M-11` · DODAJ · 🔴 visoka

**DODAJ (modul material): excessUsagePercent — presežna poraba materiala nad normativom (MAT-03)**

**Ugotovitev.** Izmet zajame le material, ki konča kot neuporaben; presežna poraba nad normativom (razrez, prelivi, netočne kosovnice, napačne enote, neevidentirane izdaje) je po MAT-03 ločen denarni kanal z lastnim KPI usage variance (§11), ki ga modul danes ne meri — popis stanja ga izrecno našteva med manjkajočim (vprasalnik-proizvodnja-trenutno-stanje.md:395: 'presežna poraba nad normativom' pod 'Kar iz raziskave manjka v celoti'). V kovinski in procesni proizvodnji je pogosto večji od izmeta. Nujna je kontrola §12.6 'izmet in materialno odstopanje iste količine': help mora izključiti že vpisani izmet; ker deli imenovalec z izmetom, je to dodaten argument za selitev annualMaterialSpendEUR v korak 5.

**Kaj narediti.** Polje excessUsagePercent: 'Za koliko odstotkov dejanska poraba materiala presega normative (kosovnice)?'; tip percent (drsnik), min 0, max 0,15, step 0,005, privzeto 0, allowUnknown ni potreben (drsnik na 0 = ne merimo); help: 'Presežek NAD normativom, ki NI izmet iz prejšnjega vprašanja — razrez, prelivi, netočne kosovnice, neevidentirane izdaje. Če odstopanja ne merite, pustite 0.'; formula: directLoss 'Presežna poraba nad normativom' = annualMaterialSpendEUR × excessUsagePercent, z addressableShare modula; koš directLoss.

*Sklic na raziskavo: §10 MAT-03, §11 (usage variance), §12.6*

### `M-12` · DODAJ · 🟠 srednja

**DODAJ (modul zaloge, brez novega vprašanja): letni strošek financiranja presežne zaloge (§6.4)**

**Ugotovitev.** Modul meri enkratno sprostitev, odpise in čakanje, ne pa letne cene, ki jo podjetje plačuje, dokler presežna zaloga leži — §6.4 jo izrecno definira (povprečna zaloga × stopnja držanja). Maloprodaja isti koncept že računa ('Strošek financiranja presežne zaloge', maloprodaja.ts:296–305, z addressableShare in komentarjem, zakaj ni podvojen s sprostitvijo), proizvodnja s praktično identičnim modulom pa ne, čeprav shared.ts:37 konstanto INVENTORY_CAPITAL_COST (0,06) vzdržuje prav zanjo. Podvajanja z odpisi ni, če stopnja vsebuje SAMO strošek kapitala, ne zastaranja — rezerva §6.4 'odpisov ne prištevamo dvakrat, če so že vključeni v stopnjo' in zadnja alineja §12.6; podvajanja s sprostitvijo ni, ker je kapital enkraten, financiranje pa letno (isti argument kot v komentarju maloprodaja.ts:297–300).

**Kaj narediti.** V compute() zalog dodaj postavko: bucket directLoss, label 'Strošek financiranja presežne zaloge', valueEUR = inventoryValueEUR × reducibleShareOf(input.reducibleShare) × context.capitalCostRate, z addressableShare — po vzoru maloprodaja.ts:296–305. Samo presežni (sprostljivi) del, ne celotna zaloga: potrebna zaloga ni izguba. Opcijsko v korak 5 proizvodnje dodaj vprašanje capitalCostRate (po vzoru contexts/trgovina.ts:144, tip contextTypes.ts:170); brez odgovora obvelja privzetek 0,06 (moduleEngine DEFAULT_COST_CONTEXT).

*Sklic na raziskavo: §6.4, §12.6 (odpis zastarele zaloge in ista postavka v stopnji držanja)*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena — maloprodajni precedens obstaja natanko v predlagani obliki, vključno z addressableShare in obrambo pred dvojnim štetjem v komentarju. Popravljeni sklici: maloprodajna postavka je maloprodaja.ts:296–305 (label na :302, ne :279; komentar :297–300, ne :275–278), capitalCostRate v contexts/trgovina.ts:144 (ne :127), tip v contextTypes.ts:170. Dodan sklic na DEFAULT_COST_CONTEXT za privzetek 0,06.

### `M-13` · DODAJ · 🟠 srednja

**DODAJ (modul zaloge): annualInventoryDiffEUR — inventurna razlika kot lažje odgovorljiv KPI (INV-01)**

**Ugotovitev.** Ur čakanja na material podjetje ne vodi, vrednost zadnje inventurne razlike pa poznata direktor in računovodja — je lažje odgovorljiv KPI (inventory accuracy, §11; §9.14 med meritvami našteva inventurne razlike) in trd dokaz iste bolečine INV-01 (sistemska in fizična zaloga se razlikujeta → zastoji in odpisi); jedrnih 22 jo izrecno vpraša (§19.1 v16). Logistika popisne razlike že šteje kot directLoss, a združene z odpisi v enem polju (logistika.ts:326–333, izid 'Popisne razlike in odpisi' :355–361). Vprašanje ur čakanja ne nadomešča, ampak triangulira — merita različna kanala (izgubljeno delo proti izgubljenemu materialu); potrebna je le jasna meja proti odpisom zaradi zastaranja, sicer ista izguba pade dvakrat.

**Kaj narediti.** Polje annualInventoryDiffEUR: 'Kolikšna je bila neto vrednost inventurnih mankov v zadnjih 12 mesecih?'; tip number, enota EUR/leto, privzeto 0, allowUnknown: true; help: 'Neto manko ob rednih in izrednih popisih. Odpisov zaradi zastaranja iz prejšnjega vprašanja ne štejte še enkrat.'; formula: directLoss 'Inventurne razlike' = annualInventoryDiffEUR, z addressableShare modula; koš directLoss. Skupaj s tem izvedi recipročni help pri annualWriteOffEUR (glej item o odpisih), da meja velja v obe smeri.

*Sklic na raziskavo: §10 INV-01, §11 (inventory accuracy), §19.1 (v16), §9.14*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena, z eno precizacijo: logistika popisnih razlik ne šteje kot ločeno polje, ampak združene z odpisi v enem polju annualWriteOffEUR (logistika.ts:326–333, directLoss 'Popisne razlike in odpisi' :355–361) — precedens torej potrjuje directLoss obravnavo, ne pa ločenega polja. Ločeno polje v proizvodnji je kljub temu upravičeno: INV-01 (manko) in INV-02 (zastaranje) imata različna vzroka in različni PANTHEON rešitvi, obstoječi proizvodni annualWriteOffEUR pa sprašuje izključno po zastaranju, zato bi manko brez novega polja izpadel. Sklic 'logistika.ts:300, 329' popravljen; dodana izrecna vez na recipročni help iz itema o odpisih.

---

## 6. P5 Roki in nujni stroški + Kratka diagnostika + Modul E (tehnični roki)

*3× ohrani · 10× izboljšaj · 2× premakni · 2× dodaj*

| ID | Sodba | Teža | Vprašanje |
|---|---|---|---|
| `Z-01` | OHRANI | ⚪ | Triaža: "Kako pogosto zamujate ali rešujete naročila nujno?" |
| `Z-02` | IZBOLJŠAJ | 🟠 | Od koliko naročil mesečno jih povprečno odpremite z zamudo? (lateOrdersPerMonth) |
| `Z-03` | DODAJ | 🟠 | DODAJ: ordersPerMonth — "Koliko naročil povprečno odpremite na mesec?" |
| `Z-04` | IZBOLJŠAJ | 🟠 | Koliko ste v zadnjih 12 mesecih porabili za ekspresne nabave ali dostave? (expediteCostE… |
| `Z-05` | OHRANI | ⚪ | Kolikšni so bili letni popusti, penali ali drugi neposredni stroški zaradi zamud? (penal… |
| `Z-06` | PREMAKNI | 🔴 | Kolikšno izgubljeno prispevno maržo ocenjujete zaradi odpovedanih naročil? (lostMarginEUR) |
| `Z-07` | IZBOLJŠAJ | 🔴 | Kaj je glavni vzrok? — možnost "Zmogljivosti oziroma stroji" (ZAMUDE_CAUSES) |
| `Z-08` | IZBOLJŠAJ | 🔴 | diagnostika.compute — privzetki 1/1/2/1 ustvarijo oceni tveganja brez enega klika |
| `Z-09` | IZBOLJŠAJ | 🟠 | Ali sproti evidentirate dejansko porabo materiala in opravljeno delo? (realtimeRecording) |
| `Z-10` | IZBOLJŠAJ | ⚪ | Ali poznate dejanski strošek posameznega izdelka oziroma delovnega naloga? (knowsUnitCost) |
| `Z-11` | IZBOLJŠAJ | 🟠 | Ali lahko zanesljivo sledite materialu od dobave do končnega izdelka? (materialTraceabil… |
| `Z-12` | OHRANI | ⚪ | Ali proizvodnja deluje normalno tudi brez ključne osebe? (keyPersonIndependence) |
| `Z-13` | IZBOLJŠAJ | 🟠 | Uporabljamo SQL Server 2016 (modul E, sqlServer2016) |
| `Z-14` | IZBOLJŠAJ | 🟠 | Uporabljamo Windows Server 2016 (modul E, windowsServer2016) |
| `Z-15` | PREMAKNI | 🔴 | Nimamo urejenega kanala za e-račune (modul E, eInvoiceZierded) |
| `Z-16` | IZBOLJŠAJ | 🔴 | icp.ts "Nujnost zaradi rokov" (10 %) ob PANTHEON-pogojeni vidnosti modula E |
| `Z-17` | DODAJ | 🟠 | DODAJ: businessTrigger — "Se pri vas trenutno dogaja kaj od naštetega?" |

### `Z-01` · OHRANI · ⚪ nizka

**Triaža: "Kako pogosto zamujate ali rešujete naročila nujno?"**

**Ugotovitev.** Meri frekvenco simptoma s štirimi kvalitativnimi stopnjami brez številke, kar je pravi format za triažo (proizvodnja.ts:443–451) in odloča le, ali se področje razpre — zneska ne ustvarja. Skladno s §19.2, kjer je frekvenca prva triažna dimenzija, in z vzročnim drevesom §10, ki zamudo obravnava kot rezultat, ne vzrok. Odgovorljivo iz glave v nekaj sekundah.

*Sklic na raziskavo: §19.2; §10 (vzročno drevo za zamude)*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena; popravljen napačen sklic: triaža je na proizvodnja.ts:443–451, ne 422–430.

### `Z-02` · IZBOLJŠAJ · 🟠 srednja

**Od koliko naročil mesečno jih povprečno odpremite z zamudo? (lateOrdersPerMonth)**

**Ugotovitev.** Polje je contextOnly brez imenovalca (proizvodnja.ts:453–464): "5 zamujenih naročil" pri 20 naročilih je katastrofa, pri 500 odlična izvedba — prodajno poročilo (measured.answers, salesReport.ts:407–413) in playbook s podatkom brez imenovalca ne moreta interpretirati obsega. Besedilo "Od koliko naročil ..." je poleg tega dvodelno vprašanje (imenovalec + števec) z enim samim vnosnim poljem; obstoječi explainer (proizvodnja.ts:461–463) že omenja "delež zamud × število naročil", a deleža ni od kod izračunati. Raziskava Q-12 sprašuje po zamujenih naročilih, Q-11 in §11 pa priporočata OTIF kot KPI, ki ga podjetje morda že pozna.

**Kaj narediti.** Novo besedilo: "Koliko naročil mesečno povprečno odpremite z zamudo?" — tip number, enota "naročil/mesec", privzeto 0, contextOnly. Help: "Če spremljate OTIF, vpišite približno število iz njega. Podatek ne vstopa v izračun — skupaj s številom vseh naročil pokaže, kolikšen delež naročil zamuja." Poročilo naj iz para (glej DODAJ ordersPerMonth) izpiše izračunani delež zamud kot diagnostično oznako v buildMeasuredArea.

*Sklic na raziskavo: §19.1 Q-11 in Q-12; §11 (OTIF)*

> ℹ️ *Preverba je ugotovitev popravila:* Jedro potrjeno; popravljena sklica: polje je na proizvodnja.ts:453–464 (ne 432–440), odgovori za prodajno poročilo nastanejo v buildMeasuredArea na salesReport.ts:407–413 (ne 175–191). Dodana opomba, da obstoječi explainer delež zamud že omenja, a je brez imenovalca neizračunljiv.

### `Z-03` · DODAJ · 🟠 srednja

**DODAJ: ordersPerMonth — "Koliko naročil povprečno odpremite na mesec?"**

**Ugotovitev.** Direktor število odpremljenih naročil pozna iz glave; brez imenovalca je lateOrdersPerMonth neuporaben. Preverjeno: polje z imenovalcem ne obstaja nikjer — ne v modulih proizvodnje ne v kontekstu (contexts/proizvodnja.ts sprašuje le pasove prihodka in marže), zato ni podvajanja. Delež zamud (≈ 1 − OTIF) je najboljša iztočnica za prodajnika in prihodnja osnova za kalibracijo typicalAnnualLossBand (moduleTypes.ts:249–258). OTIF sodi v področje zamud in NE v diagnostiko — diagnostika se prikaže tudi obiskovalcem, ki področja rokov niso izbrali, zato bi vprašanje tam podrlo mejo modulov. Shema polj je spoštovana: number, contextOnly, vrednost je število.

**Kaj narediti.** Besedilo: "Koliko naročil povprečno odpremite na mesec?" — tip number, enota "naročil/mesec", privzeto 0, contextOnly (brez formule, brez koša — v izračun ne vstopa, zato ne more ustvariti zneska). Help: "Vsa odpremljena prodajna naročila, ne le zamujena. Skupaj z zgornjim odgovorom pove, kolikšen delež naročil zamuja — številka, ki jo kupci merijo kot OTIF."

*Sklic na raziskavo: §19.1 Q-3 in Q-11; §11 (OTIF); §19.3 (točka 1: količina dogodkov)*

> ℹ️ *Preverba je ugotovitev popravila:* Predlog potrjen (ni podvajanja, shema drži, odgovorljivo iz glave); popravljen sklic typicalAnnualLossBand: moduleTypes.ts:249–258, ne 241–249.

### `Z-04` · IZBOLJŠAJ · 🟠 srednja

**Koliko ste v zadnjih 12 mesecih porabili za ekspresne nabave ali dostave? (expediteCostEUR)**

**Ugotovitev.** Vprašanje je vsebinsko pravo (PUR-01: expedite rate; §12.2 šteje samo premijo nad običajno ceno, kar help in explainer na proizvodnja.ts:466–476 že zahtevata). Meja proti sosednjim področjem pa je ohlapna: nujna nabava zaradi manjkajočega materiala (MAT-01) je vzročno področje Zaloge, prihodnje področje Nabava (PUR-01) pa bo merilo iste evre — §12.6 izrecno prepoveduje dvojno štetje "čakanja na material pri planiranju in nabavi". Preverjeno: danes se isti evro še ne podvoji, ker zaloge merijo samo ure čakanja (materialWaitingHoursPerMonth, proizvodnja.ts:265–274), ob dodani nabavi pa se bo brez ostrejšega help.

**Kaj narediti.** Besedilo, tip (number), enota (EUR/leto) in privzetek (0) nespremenjeni. Nov help: "Samo dodatni strošek nad običajno nabavo oziroma dostavo — premije dobaviteljem, ekspresni ali letalski prevozi, dražji nadomestni dobavitelj. Vpišite celoten letni znesek samo tukaj, ne glede na vzrok nujnosti; ure, ko proizvodnja čaka na material, sodijo v področje Zaloge, ne sem."

*Sklic na raziskavo: §10 PUR-01 in MAT-01; §12.2 (ekspresni prevoz); §12.6 (kontrole proti podvajanju)*

### `Z-05` · OHRANI · ⚪ nizka

**Kolikšni so bili letni popusti, penali ali drugi neposredni stroški zaradi zamud? (penaltyCostEUR)**

**Ugotovitev.** Trdi, knjigovodsko dokazljiv denar (PLN-03: finančni kanal "penali, marža") — natanko vrsta postavke, ki sme v hero koš directLoss (moduleTypes.ts:17–19). Besedilo z "zaradi zamud" loči postavko od stroškov reklamacij, ki jih v tem vprašalniku že meri področje Izmet, dodelave in kakovost (annualClaimsCostEUR, proizvodnja.ts:172–183) — meja proti podvajanju po §12.6 torej obstaja. Privzetek 0 brez vnosa ne ustvari zneska; EUR/leto je prava enota, ker penali nastajajo neenakomerno.

*Sklic na raziskavo: §10 PLN-03; §12.2; §12.6*

> ℹ️ *Preverba je ugotovitev popravila:* Verdikt ohrani potrjen; popravljena utemeljitev razmejitve: sklica "P2" in "P10" v proizvodnem vprašalniku ne obstajata — dejanska meja je proti polju annualClaimsCostEUR v modulu material (proizvodnja.ts:172–183).

### `Z-06` · PREMAKNI · 🔴 visoka

**Kolikšno izgubljeno prispevno maržo ocenjujete zaradi odpovedanih naročil? (lostMarginEUR)**

**Ugotovitev.** Polje je vsebinsko pravilno (korist odpovedanega naročila je prispevna marža, ne prihodek — §2.3), a compute() jo dá v koš directLoss (proizvodnja.ts:525–530), dokumentiran kot "trdi denar, ki odteka". Koš lostMargin obstaja natanko za ta primer (moduleTypes.ts:20–30) in ResultsSummary ima zanj kartico "Nezaslužena letna marža" (components/Results/ResultsSummary.tsx:70–76) — selitev je pravilna. Poceni je: lostMargin je v ANNUAL_BUCKETS (moduleEngine.ts:140), zato potencial (potential.ts:38–51), vsota področja (salesReport.ts:399–403), ICP bolečina (salesReport.ts:363–364) in playbook (salesPlaybook.ts:170–171, 188–189) ostanejo številčno enaki; zmanjša se le hero znesek, in sicer za del, ki ga skeptičen direktor tako ali tako najprej napade. Potrjeno: lostMargin koš danes uporablja SAMO maloprodaja — modul roki (logistika.ts:590–594) in modul terjatve_storitve (storitve.ts:524–528) imata isto napako in ju je treba popraviti hkrati.

**Kaj narediti.** V compute() postavko "Izgubljena prispevna marža" preseliti iz bucket 'directLoss' v 'lostMargin' (besedilo, tip, enota, privzetek nespremenjeni). Hkrati zaostriti help po §6.3 in §19.3 (točka 6): "Ne vpisujte celotne vrednosti naročila, ampak maržo. Štejte samo naročila, ki so bila zaradi zamud res odpovedana ali oddana drugam in jih pozneje niste nadoknadili." Isti popravek uvesti v modulu roki (logistika.ts:590–594) in terjatve_storitve (storitve.ts:524–528).

*Sklic na raziskavo: §2.3; §6.3 (pogoji za izgubljeno prodajo); §12.2 (zastoj: ne seštevati obeh); §12.6*

> ℹ️ *Preverba je ugotovitev popravila:* Verdikt in vsa vsebinska sklepanja potrjena (vključno s trditvijo, da lostMargin uporablja samo maloprodaja). Popravljeni sklici: compute proizvodnja.ts:525–530 (ne 490–495), ResultsSummary.tsx:70–76 s polno potjo components/Results/, ANNUAL_BUCKETS moduleEngine.ts:140, vsota področja salesReport.ts:399–403, logistika.ts:590–594 (ne 545), storitve.ts:524–528 (ne ~494).

### `Z-07` · IZBOLJŠAJ · 🔴 visoka

**Kaj je glavni vzrok? — možnost "Zmogljivosti oziroma stroji" (ZAMUDE_CAUSES)**

**Ugotovitev.** Možnost (proizvodnja.ts:436, kategorija physical → 15 % po addressableShare.ts:28–35) zlije dva vzroka z bistveno različno naslovljivostjo: okvara stroja je fizični vzrok in 15 % je prav; nevidnost ozkega grla v planu in obljube rokov brez preverjanja kapacitet pa so plansko vprašanje (PLN-03: "prodaja brez CTP", naslovljivost E+I+P; vzročno drevo §10 kapaciteto in plan izrecno loči). MTO podjetje, ki pošteno izbere to možnost — pri MTO so zamude in prioritete tipična bolečina (§4.1) — dobi 15 % namesto ~65 % in potencial pade za faktor 4. Pridržek: dejansko fizično pomanjkanje zmogljivosti mora ostati pri 15 %, ker §18.1 podjetju, ki pričakuje rešitev fizičnega ozkega grla brez procesne spremembe, pripiše -15 točk.

**Kaj narediti.** Razdeliti v dve možnosti: "Ozko grlo oziroma zasedenost ni pravočasno vidna v planu, roki se obljubljajo brez preverjanja kapacitet" — category 'planning' (65 %); "Okvare strojev ali dejansko premalo fizičnih zmogljivosti" — category 'physical' (15 %). Vrednosti izbir ostanejo zaporedni indeksi (addressableShare.ts:49–68), privzetek ostane "Ne vemo". Planska možnost mora ostati razločna od obstoječe prve možnosti "Plan in stanje proizvodnje nista pravočasno vidna" (splošna vidnost plana) — nova cilja specifično na kapacitete in obljube rokov.

*Sklic na raziskavo: §10 (vzročno drevo: kapaciteta ≠ plan; PLN-03); §4.1 (MTO); §18.1 (negativne točke)*

> ℹ️ *Preverba je ugotovitev popravila:* Diagnoza potrjena, predlog popravljen: prvotna planska možnost "Kapacitet je premalo oziroma ozko grlo ni vidno v planu" bi dejansko fizično pomanjkanje kapacitet napačno uvrstila med 65 % naslovljivo, kar §18.1 izrecno kaznuje. Fizično pomanjkanje zmogljivosti zdaj izrecno ostane v fizični možnosti; dodana zahteva po razmejitvi od obstoječe prve (planning) možnosti.

### `Z-08` · IZBOLJŠAJ · 🔴 visoka

**diagnostika.compute — privzetki 1/1/2/1 ustvarijo oceni tveganja brez enega klika**

**Ugotovitev.** Privzetki 1/1/2/1 dajo (1+1)/6 = 0,33 in (2+1)/6 = 0,5, po riskLevelFromScore (shared.ts:47–52) torej "srednje" + "srednje" tveganje. Modul nima triaže in se vedno izračuna (resolveActiveModules, moduleEngine.ts:245–253), diagnostika vedno vrne dva risk izida, zato RiskCard (components/Results/ResultsView.tsx:123–130) obiskovalcu, ki se koraka ni dotaknil, prikaže dve trditvi o podjetju, ki ju ni izrekel — v nasprotju z jamstvom "nobene številke si ne izmislimo" in duhom §2.3. Napaka je nevidna tudi prodajniku: isUntouchedNumeric izloči choice polja (salesReport.ts:482–488), zato nedotaknjena diagnostika ne pade med untouchedFields in ne sproži iztočnice. Preverjeno: isModuleAnswered za popolnoma privzet modul že pravilno vrne false (moduleEngine.ts:227–238).

**Kaj narediti.** Izida tveganja oddati samo, kadar je isModuleAnswered za diagnostiko true — sprememba sodi v motor oziroma CalculatorFlow, ker compute() sam ne ve, ali je modul izpolnjen; sicer na rezultatih izpisati "Diagnostike niste izpolnili" po vzoru razdelka "Česa nismo izmerili" in v playbook dodati iztočnico "Štiri diagnostična vprašanja so ostala neodgovorjena — preverite jih na sestanku." Privzetkov NE prestavljati na 0 — to bi tiho trdilo "vse zanesljivo" in napako obrnilo v drugo smer.

*Sklic na raziskavo: §2.3 (tveganje se ne ocenjuje brez podlage); §12.5 (vir podatka ob vsakem vhodu)*

> ℹ️ *Preverba je ugotovitev popravila:* Izračun in diagnoza potrjena (0,33 > 0,3 → medium + medium). Popravljeni sklici: resolveActiveModules moduleEngine.ts:245–253 (ne 242–250), filtriranje polj salesReport.ts:463–488 (ne 460–467), RiskCard ResultsView.tsx:123–130. V predlog dodano, kam sprememba tehnično sodi (motor/flow, ne compute).

### `Z-09` · IZBOLJŠAJ · 🟠 srednja

**Ali sproti evidentirate dejansko porabo materiala in opravljeno delo? (realtimeRecording)**

**Ugotovitev.** Vsebinsko jedro podatkovnega tveganja (EXE-01 "poročanje je naknadno", EXE-02) in pravilno brez EUR. A skoraj dobesedno se prekriva z nalogi.reportingTiming "Kdaj se dejanska poraba materiala in opravljeno delo evidentirata?" (proizvodnja.ts:378–389): kdor izbere področje Delovni nalogi, odgovarja dvakrat in odgovora se lahko razideta — poročilo potem vsebuje dve resnici o istem dejstvu.

**Kaj narediti.** Ena resnica: kadar je izbrano področje nalogi IN je obiskovalec reportingTiming dejansko odgovoril (vrednost ni ostala na privzetku — reportingTiming je contextOnly s privzetkom 2, ki ni izjava obiskovalca), naj se diagnostično vprašanje predizpolni iz njega (preslikava: sproti na terminalu→0, isti dan→1, naslednji dan→2, ob zaključku naloga→3) oziroma skrije, ocena tveganja pa izračuna iz reportingTiming. Kadar nalogi niso izbrani ali reportingTiming ni odgovorjen, diagnostično vprašanje ostane. Besedilo, lestvica in privzetek sicer nespremenjeni.

*Sklic na raziskavo: §10 EXE-01 in EXE-02; §9.7*

> ℹ️ *Preverba je ugotovitev popravila:* Prekrivanje potrjeno; popravljen sklic (reportingTiming je na proizvodnja.ts:378–389, ne 356–368) in predlog dopolnjen z varovalko: predizpolnitev sme uporabiti samo dejansko odgovorjeno vrednost, sicer bi privzetek 2 ("Naslednji dan") postal navidezni odgovor obiskovalca.

### `Z-10` · IZBOLJŠAJ · ⚪ nizka

**Ali poznate dejanski strošek posameznega izdelka oziroma delovnega naloga? (knowsUnitCost)**

**Ugotovitev.** Meri CST-01 (lastna cena ni znana po naročilu) in poganja DATA_RISK_NOTE (proizvodnja.ts:549–554) — prodajno najmočnejše diagnostično vprašanje. Lestvica Da/Večinoma/Le približno/Ne (polje na proizvodnja.ts:582–587) pa povabi k optimizmu; §20 priporoča časovno kotvo ("Kdaj po zaključku naročila poznate dejansko maržo?"), ki je preverljiva in težje polepšana, Q-18 pa sprašuje, kako hitro je rezultat pokalkulacije znan.

**Kaj narediti.** Novo besedilo: "Kdaj po zaključku delovnega naloga poznate njegov dejanski strošek?" — choice, privzeto 1, izbire: "Sproti oziroma takoj ob zaključku" (0) / "V nekaj dneh" (1) / "Šele ob mesečnem obračunu" (2) / "Ne izračunamo ga" (3). Ostane brez EUR v košu risk, ista utež v riskLevelFromScore (vsota dveh polj, max 6).

*Sklic na raziskavo: §10 CST-01; §9.17; §19.1 Q-18; §20*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena (§20 dobesedno vsebuje priporočeno časovno vprašanje); popravljena sklica: DATA_RISK_NOTE je na proizvodnja.ts:549–554 (ne 514–519), polje na 582–587.

### `Z-11` · IZBOLJŠAJ · 🟠 srednja

**Ali lahko zanesljivo sledite materialu od dobave do končnega izdelka? (materialTraceability)**

**Ugotovitev.** Da/ne lestvica meri samozavest, ne sposobnosti. Raziskava ima za to izmerljiv KPI recall drill time (§11), Q-17 izrecno sprašuje po trajanju sledljivostne vaje, TRC-01 pa kot dokaz navaja prav ta čas — časovno vprašanje je odgovorljivo v 30 sekundah in ostro loči sistemsko sledljivost od ročnega sestavljanja genealogije. Ostane kvalitativno (koš risk, brez EUR), zato ne krši načela modula; PROCESS_RISK_NOTE (proizvodnja.ts:556–560) ostane smiselna brez sprememb.

**Kaj narediti.** Novo besedilo: "Če bi morali za en vhodni lot ugotoviti, v katere izdelke in h katerim kupcem je šel — koliko časa bi potrebovali?" — choice, privzeto 2, izbire: "Nekaj minut, iz sistema" (0) / "Nekaj ur" (1) / "Dan ali dva ročnega dela" (2) / "Tega ne bi mogli zanesljivo ugotoviti" (3). Koš risk, brez EUR.

*Sklic na raziskavo: §19.1 Q-17; §11 (recall drill time); §10 TRC-01; §9.11*

### `Z-12` · OHRANI · ⚪ nizka

**Ali proizvodnja deluje normalno tudi brez ključne osebe? (keyPersonIndependence)**

**Ugotovitev.** Meri PLN-04 (planer je nenadomestljiv) in tveganje znanja v glavah, ki ga §22.1 (40 % slovenskih podjetij težko najde ustrezna znanja) potrjuje kot naraščajoče. Pravilno brez EUR (§2.3: tveganje se ne monetizira brez verjetnosti in posledice), odgovorljivo iz glave, brez prekrivanja z drugimi področji; skupaj s sledljivostjo tvori oceno "Procesna odpornost" (proizvodnja.ts:614–619).

*Sklic na raziskavo: §10 PLN-04; §22.1; §2.3*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena; popravljen sklic: postavka "Procesna odpornost" je v compute na proizvodnja.ts:614–619, ne 570.

### `Z-13` · IZBOLJŠAJ · 🟠 srednja

**Uporabljamo SQL Server 2016 (modul E, sqlServer2016)**

**Ugotovitev.** Opozorilo pravilno pove, da je rok mimo (14. 7. 2026; legacy.ts:254–259), ICP pa pretekli rok šteje 1,0 (icp.ts:261–263). Dve luknji: podjetje na SQL 2014 ali starejšem — še bolj izpostavljeno — ne more pošteno odkljukati ničesar, ker kljukica imenuje točno "2016"; in direktor različice SQL praviloma ne pozna iz glave, polje pa je brez help, čeprav je odgovor brez IT neugotovljiv.

**Kaj narediti.** Novo besedilo: "Uporabljamo SQL Server 2016 ali starejši" — checkbox, privzeto 0, warningDate nespremenjen. Help: "Različico pozna vaš vzdrževalec PANTHEON ali IT. Podpora za SQL Server 2016 je potekla julija 2026; starejše različice so brez varnostnih popravkov še dlje."

*Sklic na raziskavo: §14 (tehnološki ekosistem); §21 (NIS2: upravljanje tveganj dobavne verige)*

> ℹ️ *Preverba je ugotovitev popravila:* Jedro potrjeno; ovržena stranska trditev "edino polje v vprašalniku brez vsakega help" — help manjka tudi drugim poljem (npr. penaltyCostEUR, dataFixHoursPerMonth). Utemeljitev preoblikovana: help je tu potreben zato, ker odgovor brez IT ni ugotovljiv, ne zaradi domnevne edinstvenosti.

### `Z-14` · IZBOLJŠAJ · 🟠 srednja

**Uporabljamo Windows Server 2016 (modul E, windowsServer2016)**

**Ugotovitev.** Ista logika kot pri SQL kljukici: rok 12. 1. 2027 je pravilen in ga ICP nujnost že bere (icp.ts:264–266), a formulacija "2016" izpusti podjetja na 2012 R2 in starejših, ki so dejansko bolj ogrožena, help pa manjka za vprašanje, na katero direktor brez IT ne zna odgovoriti.

**Kaj narediti.** Novo besedilo: "Uporabljamo Windows Server 2016 ali starejši" — checkbox, privzeto 0, warningDate nespremenjen. Help: "Preverite z IT oziroma vzdrževalcem. Podpora za Windows Server 2016 se konča 12. 1. 2027; starejše različice so podpore že izgubile."

*Sklic na raziskavo: §14; §21 (NIS2)*

### `Z-15` · PREMAKNI · 🔴 visoka

**Nimamo urejenega kanala za e-račune (modul E, eInvoiceZierded)**

**Ugotovitev.** ZIERDED velja za vsa slovenska podjetja, ne le za uporabnike PANTHEON — kljukica pa živi v modulu E, ki se ne-PANTHEON obiskovalcem sploh ne prikaže (isTechnicalRiskModuleVisible, contexts/index.ts:58–62). S tem je najmočnejši regulatorni nakupni sprožilec (§17.2 točka 12: obvezne digitalne izmenjave dokumentov; §18.1: "sprožilec in nujnost" 15 točk) skrit natanko segmentu "nova licenca", ki bi ga moral videti; posledično ti obiskovalci v ICP nujnosti ne morejo preseči 0,2 (icp.ts:253–258).

**Kaj narediti.** Kljukico preseliti iz PANTHEON-pogojenega modula E v vsem viden regulatorni blok (npr. samostojno vprašanje ob diagnostiki): besedilo "Nimamo urejenega kanala za e-račune (ZIERDED, obvezno od 1. 1. 2028)" — checkbox, privzeto 0, koš risk, riskLevel high, warningText in warningDate (2028-01-01) nespremenjena. Ob selitvi prilagoditi tudi vir za deadlineDates v buildIcpSignals (salesReport.ts:368–370), ki datume danes bere izključno iz params.values.E — sicer selitev ICP nujnost tiho odklopi.

*Sklic na raziskavo: §17.2 (nakupni sprožilci, točka 12); §18.1; §21 (regulativa in podatkovne posledice)*

> ℹ️ *Preverba je ugotovitev popravila:* Verdikt in diagnoza potrjena (vidnost in ICP omejitev preverjena v kodi). Predlog dopolnjen s konkretnim tehničnim pogojem: deadlineDates se gradijo iz params.values.E (salesReport.ts:368–370), zato mora selitev kljukice posodobiti tudi to branje.

### `Z-16` · IZBOLJŠAJ · 🔴 visoka

**icp.ts "Nujnost zaradi rokov" (10 %) ob PANTHEON-pogojeni vidnosti modula E**

**Ugotovitev.** Dimenzija nujnost se napaja izključno iz rokov modula E; podjetju, ki mu modul ni bil prikazan, vrne 0,2 z opombo, da to "ni nujno podatek o podjetju" (icp.ts:253–258) — a točke vseeno odšteje: ne-PANTHEON lead strukturno izgubi do 8 od 100 točk (utež 0,1 × razlika 0,8) brez zveze z lastnostmi podjetja. Funkcija wasTechnicalRiskModuleShown že obstaja (salesReport.ts:533–541), a je ICP ne uporablja. Raziskava §18.1 nujnost gradi iz poslovnih sprožilcev (rast, audit, nova stranka, menjava ERP), ne le tehničnih rokov.

**Kaj narediti.** V IcpSignals dodati moduleEShown: boolean (napolniti iz wasTechnicalRiskModuleShown); kadar je false in rokov ni, naj rate vrne nevtralno 0,5 z opombo "Modul z roki temu podjetju ni bil prikazan — nujnost preverite iz poslovnih sprožilcev." Po selitvi ZIERDED kljukice med vse obiskovalce (prejšnji predlog) postane ta veja redka; dimenzijo dolgoročno dopolniti s sprožilcnim vprašanjem (glej DODAJ businessTrigger).

*Sklic na raziskavo: §18.1 (sprožilec in nujnost, 15 točk); §17.2*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina in izračun (do 8 točk) potrjena; popravljen sklic: wasTechnicalRiskModuleShown je na salesReport.ts:533–541, ne 512–520.

### `Z-17` · DODAJ · 🟠 srednja

**DODAJ: businessTrigger — "Se pri vas trenutno dogaja kaj od naštetega?"**

**Ugotovitev.** Raziskava nujnost definira prek poslovnih sprožilcev (§17.2: rast, nova linija, nova velika stranka, audit, menjava ERP, izguba ključnega planerja; §18.2 zunanji signali), današnja ICP nujnost pa pozna samo tri tehnične roke — za ne-PANTHEON in celo za večino PANTHEON strank je slepa. Preverjeno: podobno vprašanje ne obstaja nikjer (kontekst sprašuje le tip proizvodnje, sistem in vlogo). Eno kontekstno vprašanje brez številk pokrije 15-točkovno dimenzijo "sprožilec in nujnost" iz §18.1; contextOnly zagotavlja, da ne more ustvariti zneska, playbook pa kontekstna polja že bere kot iztočnice (salesPlaybook.ts:104–115). Shema: choice z zaporednimi vrednostmi je skladna z Record<string, number>.

**Kaj narediti.** Besedilo: "Se pri vas trenutno dogaja kaj od naštetega?" — tip choice, contextOnly, izbire: "Hitra rast, nova hala ali linija" (0) / "Nova velika stranka, audit ali certifikat" (1) / "Menjava oziroma opuščanje obstoječega sistema" (2) / "Odhod ključne osebe (planer, vodja proizvodnje)" (3) / "Nič od naštetega" (4, privzeto). Brez formule in koša. ICP nujnost naj vrednost dvigne SAMO ob dejansko izbranih možnostih 0–3; nedotaknjeni privzetek 4 ne sme šteti kot izjava "nobenega sprožilca ni", ampak kot neodgovorjeno (nevtralno), kar poročilo že loči prek answered/source (salesReport.ts:407–413). Umestitev: korak konteksta ("Nekaj o vaši proizvodnji") ali vedno vidna diagnostična stran — NE "ob modulu E", ki ne-PANTHEON obiskovalcem ni prikazan.

*Sklic na raziskavo: §17.2; §18.1; §18.2*

> ℹ️ *Preverba je ugotovitev popravila:* Predlog potrjen (ni podvajanja, shema drži), a popravljen na dveh mestih: umestitev "ob modulu E, viden vsem" je protislovna, ker modul E ni viden vsem — nadomeščena s korakom konteksta ali diagnostiko; in privzeta izbira "Nič od naštetega" ne sme v ICP šteti kot potrjena odsotnost sprožilca, sicer bi privzetek tiho trdil nekaj, česar obiskovalec ni izrekel (ista logika kot pri diagnostičnih privzetkih, §2.3).

---

## 7. Horizontale P6–P10 z vidika proizvajalca

*21× ohrani · 10× izboljšaj · 1× dodaj*

| ID | Sodba | Teža | Vprašanje |
|---|---|---|---|
| `H-01` | OHRANI | ⚪ | TRIAŽA analitikaHz: Koliko ročnega dela zahteva priprava poročil in ključnih številk za … |
| `H-02` | OHRANI | ⚪ | reportPrepHoursPerMonth: Koliko ur mesečno gre za ročno pripravo rednih poročil za vodst… |
| `H-03` | IZBOLJŠAJ | 🟠 | adHocAnalysisHoursPerMonth: Koliko ur mesečno vzamejo izredne analize in vprašanja "na h… |
| `H-04` | IZBOLJŠAJ | 🔴 | dataMergeHoursPerMonth: Koliko ur mesečno gre za zbiranje in ročno združevanje podatkov … |
| `H-05` | OHRANI | ⚪ | reportFreshness: Kako stare so ključne številke, ko jih vodstvo vidi? |
| `H-06` | OHRANI | ⚪ | mainCause (analitikaHz): Kaj je glavni vzrok? |
| `H-07` | IZBOLJŠAJ | ⚪ | TRIAŽA financeHz: Koliko ročnega dela je v vašem računovodstvu in financah (knjiženje, u… |
| `H-08` | OHRANI | ⚪ | bookingHoursPerMonth: Koliko ur mesečno gre za ročno knjiženje in pripravo dokumentov za… |
| `H-09` | OHRANI | ⚪ | reconciliationHoursPerMonth: Koliko ur mesečno porabite za usklajevanje — banka, kartice… |
| `H-10` | OHRANI | ⚪ | closingHoursPerMonth: Koliko ur mesečno vzamejo davčni obračuni, DDV in poročanje državi? |
| `H-11` | IZBOLJŠAJ | 🟠 | annualPenaltyEUR: Koliko so v zadnjih 12 mesecih znašale zamudne obresti, globe in stroš… |
| `H-12` | OHRANI | ⚪ | mainCause (financeHz): Kaj je glavni vzrok? |
| `H-13` | IZBOLJŠAJ | 🟠 | TRIAŽA kadriHz: Koliko dela zahtevajo evidence delovnega časa, dopusti in priprava plač? |
| `H-14` | IZBOLJŠAJ | 🔴 | timesheetHoursPerMonth: Koliko ur mesečno gre za zbiranje in urejanje evidenc prisotnost… |
| `H-15` | OHRANI | ⚪ | payrollPrepHoursPerMonth: Koliko ur mesečno vzame priprava podatkov za obračun plač in p… |
| `H-16` | OHRANI | ⚪ | hrAdminHoursPerMonth: Koliko ur mesečno gre za dopuste, potne naloge, potrdila in drugo … |
| `H-17` | IZBOLJŠAJ | 🟠 | annualPayrollErrorEUR: Koliko so v zadnjih 12 mesecih stali napačni obračuni plač (porač… |
| `H-18` | OHRANI | ⚪ | mainCause (kadriHz): Kaj je glavni vzrok? |
| `H-19` | OHRANI | ⚪ | TRIAŽA dokumentiHz: Koliko časa se izgubi s potrjevanjem, iskanjem in ročnim pošiljanjem… |
| `H-20` | OHRANI | ⚪ | approvalHoursPerMonth: Koliko ur mesečno gre za ročno potrjevanje dokumentov — računov, … |
| `H-21` | OHRANI | ⚪ | searchArchiveHoursPerMonth: Koliko ur mesečno gre za iskanje in arhiviranje dokumentov? |
| `H-22` | OHRANI | ⚪ | manualExchangeHoursPerMonth: Koliko ur mesečno gre za tiskanje, skeniranje in ročno poši… |
| `H-23` | IZBOLJŠAJ | 🟠 | annualDocDelayEUR: Koliko so v zadnjih 12 mesecih stali izgubljeni ali prepozno potrjeni… |
| `H-24` | IZBOLJŠAJ | ⚪ | mainCause (dokumentiHz): Kaj je glavni vzrok? |
| `H-25` | OHRANI | ⚪ | TRIAŽA servisHz: Koliko dela vam povzročajo garancijska popravila, servis in vodenje rek… |
| `H-26` | OHRANI | ⚪ | serviceWorkHoursPerMonth: Koliko ur mesečno gre za garancijska popravila in servisne pos… |
| `H-27` | OHRANI | ⚪ | rmaAdminHoursPerMonth: Koliko ur mesečno vzame vodenje reklamacijskega postopka — spreje… |
| `H-28` | IZBOLJŠAJ | 🔴 | annualServiceCostEUR: Koliko so v zadnjih 12 mesecih znašali nadomestni deli, zunanji se… |
| `H-29` | OHRANI | ⚪ | caseTracking: Kako spremljate odprte reklamacijske in servisne primere? |
| `H-30` | OHRANI | ⚪ | mainCause (servisHz): Kaj je glavni vzrok? |
| `H-31` | DODAJ | 🔴 | DODAJ (dokumentiHz): vprašanje o pripravljenosti na e-račune (ZIERDED) |
| `H-32` | OHRANI | 🟠 | NABOR HORIZONTAL v triaži proizvodnje (10 področij, priporočena 3) |

### `H-01` · OHRANI · ⚪ nizka

**TRIAŽA analitikaHz: Koliko ročnega dela zahteva priprava poročil in ključnih številk za odločanje?**

**Ugotovitev.** Lestvica (horizontal.ts:41-47) stopnjuje frekvenco in obseg od 'sestavijo sama' do 'skoraj vsak dan' in je za proizvajalca 10–249 dobro umerjena — direktor jo oceni v 10 sekundah. Bolečino potrjujeta DAT-01 (vsak oddelek svoj Excel) in DAT-03 (KPI brez enotne definicije); triažni pristop ustreza raziskavi §19.2. Ocena vstopa v izbor področij in v prodajne iztočnice za neizmerjena področja (salesPlaybook.ts:83-88).

*Sklic na raziskavo: proizvodnja.md §10 DAT-01, DAT-03; §19.2*

### `H-02` · OHRANI · ⚪ nizka

**reportPrepHoursPerMonth: Koliko ur mesečno gre za ročno pripravo rednih poročil za vodstvo ali lastnike?**

**Ugotovitev.** Vstopa v izračun (capacity × admin ura, horizontal.ts:98-105), nosi varovalni help 'Ure, ki ste jih že vpisali v drugem področju, tu ne ponavljajte' (horizontal.ts:56) in je odgovorljivo — redna poročila so ponavljajoč se ritual z znanim trajanjem; explainer poleg tega ponuja vzorec količina × čas (horizontal.ts:57-60). Privzetek 0 ne ustvari zneska brez potrditve. Skladno z DAT-01 in vzorcem §19.3.

*Sklic na raziskavo: proizvodnja.md §10 DAT-01; §19.3; §12.2 ročno delo*

> ℹ️ *Preverba je ugotovitev popravila:* Popravljen sklic na izračun: capacity postavka je horizontal.ts:98-105, ne 94-99 (vrstica 94 je le urna postavka). Vsebina potrjena.

### `H-03` · IZBOLJŠAJ · 🟠 srednja

**adHocAnalysisHoursPerMonth: Koliko ur mesečno vzamejo izredne analize in vprašanja "na hitro potrebujemo številko"?**

**Ugotovitev.** Polje nima nobenega razmejitvenega helpa (horizontal.ts:62-68), varovalo iz prvega polja pa se nanj ne prenaša. Pri proizvajalcu se sorodne ure merijo še v P1 replanningHoursPerMonth, ki izrecno vključuje 'iskanje informacij' (proizvodnja.ts:88-94) — del planerjevega 'na hitro potrebujem številko' je lahko vpisan v obe področji, kar krši načelo kontrol proti podvajanju §12.6. Odgovorljivost je poleg tega slaba: izredne dogodke se težko sešteje iz glave. Prekrivanje je ožje, kot bi kazalo na prvi pogled — 'izredna analiza za vodstvo' in 'iskanje informacij pri ponovnem planiranju' se besedilno razlikujeta, tveganje pa se materializira le, če obiskovalec v triaži izbere obe področji — zato srednja, ne visoka resnost.

**Kaj narediti.** Besedilo ohrani, dodaj help: "Štejte samo analize za odločanje vodstva. Iskanja informacij za tekoče operativno delo in usklajevanje, ki ste ga vpisali v drugem področju, tu ne ponavljajte. Ocenite prek: število izrednih zahtev na mesec × tipičen čas na zahtevo." Tip: number, enota h/mesec, privzeto 0.

*Sklic na raziskavo: proizvodnja.md §12.6; §19.3 (količina × čas na dogodek); §10 DAT-03*

> ℹ️ *Preverba je ugotovitev popravila:* Popravljena sklica (polje je horizontal.ts:62-68, ne 58-64; replanningHoursPerMonth je proizvodnja.ts:88-94, ne 83-89) in znižana resnost z visoka na srednja: besedilno prekrivanje je ožje od trditve in nastopi le ob so-izbiri obeh področij. Predlog helpa ohranjen — ne imenuje sosednjih modulov, zato drži v vseh segmentih.

### `H-04` · IZBOLJŠAJ · 🔴 visoka

**dataMergeHoursPerMonth: Koliko ur mesečno gre za zbiranje in ročno združevanje podatkov iz različnih virov v eno preglednico?**

**Ugotovitev.** Pri proizvajalcu tečeta tik ob tem polju še nalogi.retypingHoursPerMonth (prepisovanje med ERP, Excelom in papirjem, proizvodnja.ts:358-369) in nalogi.dataFixHoursPerMonth (popravljanje podatkov, proizvodnja.ts:370-375) — trojno tveganje istih ur, help pa na tem polju manjka (horizontal.ts:69-76). Generično 'ur ne ponavljajte' stoji le na prvem polju modula (horizontal.ts:56) in ne zadošča, ker obiskovalec meje med 'prepisovanjem' in 'združevanjem' sam ne potegne — izvoz iz ERP v Excel za poročilo je besedilno oboje. §12.6 tako podvajanje izrecno prepoveduje.

**Kaj narediti.** Besedilo ohrani, dodaj help: "Samo združevanje za poročila in analize. Prepisovanje in popravljanje podatkov pri vsakdanjem operativnem delu sodi v področje, kjer nastaja — teh ur tu ne ponavljajte." Tip: number, enota h/mesec, privzeto 0. (Besedilo ne imenuje sosednjih modulov, zato drži v vseh segmentih.)

*Sklic na raziskavo: proizvodnja.md §12.6; §10 DAT-01, EXE-04*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena, popravljeni le sklici: polje je horizontal.ts:69-76 (ne 65-72), retypingHoursPerMonth proizvodnja.ts:358-369 (ne 341-348), dataFixHoursPerMonth proizvodnja.ts:370-375 (ne 349-355).

### `H-05` · OHRANI · ⚪ nizka

**reportFreshness: Kako stare so ključne številke, ko jih vodstvo vidi?**

**Ugotovitev.** ContextOnly polje (horizontal.ts:77-89) z jasno prodajno vrednostjo: FIN-02 ('stroški so vidni prepozno') je klasičen nakupni sprožilec, odgovor pa polni prodajno poročilo in rezervne iztočnice (salesPlaybook.ts:104-115). Lestvica je KPI-jevska (latenca podatkov, §11 close/calc time) namesto abstraktne ocene. Privzetek 2 ('stare nekaj tednov') ne ustvari zneska; poročilo prek isAnswered loči nedotaknjen odgovor (salesReport.ts:411).

*Sklic na raziskavo: proizvodnja.md §10 FIN-02, DAT-03; §11 (close/calc time)*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena, popravljen sklic: isAnswered se uporabi v salesReport.ts:411, ne 393.

### `H-06` · OHRANI · ⚪ nizka

**mainCause (analitikaHz): Kaj je glavni vzrok?**

**Ugotovitev.** Vzroki pokrivajo DAT-01 (več sistemov), DAT-03 (vsak oddelek svoje številke) in odvisnost od zunanjega računovodstva; kategorije data/people/planning/external so smiselno dodeljene (horizontal.ts:28-34). Privzetek 'Ne vemo' s konservativnimi 30 % ne napihne potenciala (addressableShare.ts:28-35) in zniža zanesljivost — skladno s pravili §2.3.

*Sklic na raziskavo: proizvodnja.md §2.3; §10 DAT-01, DAT-03*

### `H-07` · IZBOLJŠAJ · ⚪ nizka

**TRIAŽA financeHz: Koliko ročnega dela je v vašem računovodstvu in financah (knjiženje, usklajevanje, obračuni)?**

**Ugotovitev.** Med stopnjo 1 ('nekaj ur ob koncu meseca') in 2 ('več dni vsak mesec') zeva luknja — proizvajalec z enim dnem mesečno nima svoje stopnje in bo izbral naključno (horizontal.ts:146-151). Stopnja 3 je poleg tega kvalitativna ('zamašek'), 2 pa količinska, zato lestvica ni strogo monotona. Kalibracija triažnih pragov je po §19.2 ključna, ker ocena tekmuje s panožnimi področji za tri mesta (segments.ts:88-90).

**Kaj narediti.** Možnosti: 0 "Večina poteka samodejno" · 1 "Nekaj ur ob koncu meseca" · 2 "En do dva dni vsak mesec" · 3 "Več dni vsak mesec — konec meseca je zamašek".

*Sklic na raziskavo: proizvodnja.md §19.2; §10 FIN-01, FIN-02*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena, popravljen sklic: triažne možnosti so horizontal.ts:146-151, ne 142-147.

### `H-08` · OHRANI · ⚪ nizka

**bookingHoursPerMonth: Koliko ur mesečno gre za ročno knjiženje in pripravo dokumentov za računovodstvo (interno ali zunanji servis)?**

**Ugotovitev.** Vstopa v capacity (horizontal.ts:202-208), varovalni help proti podvajanju je prisoten (horizontal.ts:161), explainer ponuja vzorec ljudje × ure (horizontal.ts:162-165), oklepaj 'interno ali zunanji servis' pa pokrije oba modela, ki ju MSP proizvajalec pozna. Odgovorljivo: to delo opravlja ena do dve osebi z znanim ritmom. Skladno z bolečino FIN-02 in formulo ročnega dela §12.2.

*Sklic na raziskavo: proizvodnja.md §9.18; §12.2 ročno delo; §10 FIN-02*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena, popravljena sklica: capacity izid je horizontal.ts:202-208 (ne 190-196), help je na vrstici 161 (ne 157).

### `H-09` · OHRANI · ⚪ nizka

**reconciliationHoursPerMonth: Koliko ur mesečno porabite za usklajevanje — banka, kartice kupcev in dobaviteljev, medsebojni IOP?**

**Ugotovitev.** Zgledna razmejitev: help 'Štejte samo usklajevanje evidenc, ne opominjanja kupcev' (horizontal.ts:174) potegne mejo do terjatvenih modulov drugih segmentov, ne da bi jih imenoval — točno po tretjem načelu horizontal (horizontal.ts:17-23). Konkretni primeri v besedilu (banka, kartice, IOP) in explainer z vzorcem naredijo vprašanje odgovorljivo v 30 sekundah. Ustreza DAT-01 (reconciliations kot dokaz).

*Sklic na raziskavo: proizvodnja.md §10 DAT-01; §9.18*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena, popravljen sklic: help je horizontal.ts:174, ne 166.

### `H-10` · OHRANI · ⚪ nizka

**closingHoursPerMonth: Koliko ur mesečno vzamejo davčni obračuni, DDV in poročanje državi?**

**Ugotovitev.** Jasno omejena kategorija brez prekrivanja s katerimkoli proizvodnim modulom; ure so periodične in znane (DDV ritem). Vstopa v capacity (horizontal.ts:216-222). Morebitna prihodnja nadgradnja bi bila contextOnly KPI 'koliko dni po koncu meseca poznate rezultat' (FIN-02, close time), a ne na račun tega polja.

*Sklic na raziskavo: proizvodnja.md §10 FIN-02; §11 (close/calc time)*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena, popravljen sklic: capacity izid je horizontal.ts:216-222, ne 204-210.

### `H-11` · IZBOLJŠAJ · 🟠 srednja

**annualPenaltyEUR: Koliko so v zadnjih 12 mesecih znašale zamudne obresti, globe in stroški popravkov obračunov?**

**Ugotovitev.** Edina directLoss postavka modula (polje horizontal.ts:187-194, izid 223-228), a 'zamudne obresti' se dobesedno pojavijo še v dokumentiHz.annualDocDelayEUR (horizontal.ts:396) — proizvajalec, ki izbere obe horizontali, lahko isti evro vpiše dvakrat, kar §12.6 po analogiji ('en vzrok ne sme biti monetiziran v dveh modulih') prepoveduje. Polje tudi nima allowUnknown, čeprav je to znesek, ki ga podjetje bodisi vodi bodisi ne (moduleTypes.ts:160-168) — prisilna 0 se šteje kot potrjena ničla, kar krši §12.5 (vir podatka: neznano).

**Kaj narediti.** Besedilo ohrani, dodaj help: "Samo zneski, ki izvirajo iz obračunov in knjiženja. Zneskov, ki ste jih že vpisali v drugem področju, tu ne ponavljajte." ter allowUnknown: true. Tip: number, enota EUR/leto, privzeto 0.

*Sklic na raziskavo: proizvodnja.md §12.6; §12.5 (vir podatka: neznano); §10 FIN-01*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena, popravljeni sklici: polje je horizontal.ts:187-194 in directLoss izid 223-228 (ne 211-216); 'zamudne obresti' v annualDocDelayEUR so na vrstici 396 (ne 376); dokumentacija allowUnknown je moduleTypes.ts:160-168 (ne 150-159). allowUnknown poleg tega prodajniku prinese iztočnico prek unknownAnswers (salesPlaybook.ts:90-95).

### `H-12` · OHRANI · ⚪ nizka

**mainCause (financeHz): Kaj je glavni vzrok?**

**Ugotovitev.** Pet vzrokov pokrije ročni tok dokumentov, dvojne vnose, pozno odkrivanje napak, zunanji servis in razpršeno odgovornost (horizontal.ts:131-137) — vse prepoznavne FIN/DAT bolečine. Kategorije so smiselne, privzetek 'Ne vemo' konservativen (30 %). Naslovljivi delež je edini vzvod, s katerim finance vstopijo v realistični potencial, zato je vprašanje računsko nujno.

*Sklic na raziskavo: proizvodnja.md §10 FIN-01, FIN-02, DAT-01; §2.3*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena, popravljen sklic: FINANCE_CAUSES so horizontal.ts:131-137, ne 127-133.

### `H-13` · IZBOLJŠAJ · 🟠 srednja

**TRIAŽA kadriHz: Koliko dela zahtevajo evidence delovnega časa, dopusti in priprava plač?**

**Ugotovitev.** Za proizvajalca s 100+ zaposlenimi v izmenah je priprava plač (dodatki, nadure, nadomestila) tako rekoč vedno 'nekaj dni vsak mesec' — lestvica (horizontal.ts:252-259) se nasiti pri 2–3 in kadriHz lahko z višjo oceno izpodrine panožna področja (izmet, zaloge) iz treh priporočenih mest, čeprav je denarna teža tam večja. Tie-break sicer favorizira panožna področja (segments.ts:71-73), a le ob izenačenju — strogo višja ocena kadriHz zmaga. Triaža mora ločevati po odklonu od normale (ročnost, popravki), ne po absolutni količini, ki raste z velikostjo podjetja.

**Kaj narediti.** Možnosti: 0 "Malo — večina poteka samodejno" · 1 "Rutina — nekaj ur na mesec" · 2 "Zamudno — ročno zbiranje in popravki vsak mesec" · 3 "Vsak mesec velik projekt s popravki po obračunu". Stopnji 2 in 3 vežeta oceno na ročnost in popravke namesto na dneve, ki so odvisni od velikosti.

*Sklic na raziskavo: proizvodnja.md §19.2; §10 HR-02*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena, popravljen sklic (lestvica je horizontal.ts:252-259, ne 242-247) in dopolnjena utemeljitev: strukturni tie-break (segments.ts:71-73) izrinjanje blaži le ob izenačenju, zato tveganje ostane; §10 HR-02 (nadure) je le posreden dokaz, nosilni argument je §19.2.

### `H-14` · IZBOLJŠAJ · 🔴 visoka

**timesheetHoursPerMonth: Koliko ur mesečno gre za zbiranje in urejanje evidenc prisotnosti in delovnih ur?**

**Ugotovitev.** Besedna zveza 'in delovnih ur' (horizontal.ts:264) pri proizvajalcu zajame tudi vpisovanje opravljenega dela NA delovni nalog — to pa je proizvodna tema (MT terminal), ki jo že merijo nalogi.orderAdminHoursPerMonth ('zbiranje in zaključevanje nalogov', proizvodnja.ts:351-357) in bolečini EXE-01/EXE-04. Generični help (horizontal.ts:268) meje ne potegne, ker obiskovalec obojega ne loči. Ista ura tako pade v dve področji, kar krši načelo 2 iz proizvodnja.ts:22-24 in §12.6.

**Kaj narediti.** Novo besedilo: "Koliko ur mesečno gre za zbiranje in urejanje evidenc prisotnosti — prihodi, odhodi in odsotnosti?" Help: "Samo evidenca prisotnosti za obračun plač. Evidentiranje opravljenega dela na nalogih, projektih oziroma za stranke je operativna tema — te ure vpišite tam, tu jih ne ponavljajte. Urejanje dopustov in drugo kadrovsko administracijo štejte pri vprašanju o kadrovski administraciji." Tip: number, enota h/mesec, privzeto 0.

*Sklic na raziskavo: proizvodnja.md §12.6; §10 EXE-01, EXE-04; §9.7*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena, popravljeni sklici (label horizontal.ts:264, help 268, orderAdmin proizvodnja.ts:351-357, načelo proizvodnja.ts:22-24) in popravljen predlog: prvotno novo besedilo z 'dopusti, bolniške' bi uvedlo NOVO prekrivanje s hrAdminHoursPerMonth ('dopuste, potne naloge…', horizontal.ts:282-288) — dopusti so zdaj izrecno preusmerjeni v kadrovsko administracijo znotraj istega modula, kar je dovoljeno (načelo horizontal prepoveduje le imenovanje sosednjih PODROČIJ).

### `H-15` · OHRANI · ⚪ nizka

**payrollPrepHoursPerMonth: Koliko ur mesečno vzame priprava podatkov za obračun plač in popravki po obračunu?**

**Ugotovitev.** Jasno omejeno na pripravo in popravke obračuna; s popravljenim timesheet poljem (prejšnja postavka) meja do proizvodnih evidenc drži. Odgovorljivo — obračun dela znana oseba v znanem ritmu. Vstopa v capacity (horizontal.ts:311-317); privzetek 0 ne ustvari zneska.

*Sklic na raziskavo: proizvodnja.md §12.2 ročno delo; §10 HR-02*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena, popravljen sklic: capacity izid je horizontal.ts:311-317, ne 296-301.

### `H-16` · OHRANI · ⚪ nizka

**hrAdminHoursPerMonth: Koliko ur mesečno gre za dopuste, potne naloge, potrdila in drugo kadrovsko administracijo?**

**Ugotovitev.** Kadrovska administracija se pri proizvajalcu ne prekriva z nobenim panožnim modulom, konkretni primeri v besedilu naredijo oceno izvedljivo. Vstopa v capacity (horizontal.ts:318-324). Vzorec 'naštej primere, vprašaj skupne ure' je pragmatičen kompromis med §19.3 (dogodki × čas) in dolžino vprašalnika.

*Sklic na raziskavo: proizvodnja.md §19.3; §12.2 ročno delo*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena, popravljen sklic: capacity izid je horizontal.ts:318-324, ne 302-307.

### `H-17` · IZBOLJŠAJ · 🟠 srednja

**annualPayrollErrorEUR: Koliko so v zadnjih 12 mesecih stali napačni obračuni plač (poračuni, zamudne obresti, zunanja pomoč)?**

**Ugotovitev.** Legitimna directLoss postavka (polje horizontal.ts:289-296, izid 325-330) brez prekrivanja z drugimi področji, a brez allowUnknown: podjetje teh stroškov pogosto ne vodi ločeno in po moduleTypes.ts:160-168 je to natanko primer, kjer je 'ne vem' dejstvo in ne izgovor. Prisilna 0 zdaj tiho pomeni 'stroškov ni', prodajnik pa izgubi iztočnico iz unknownAnswers (salesPlaybook.ts:90-95). Skladno s §12.5 (pri vsakem vhodu zabeležimo vir, tudi 'neznano').

**Kaj narediti.** Besedilo, tip (number), enota (EUR/leto) in privzetek (0) ohrani; dodaj allowUnknown: true.

*Sklic na raziskavo: proizvodnja.md §12.5 (vir podatka: neznano); §2.3*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena, popravljeni sklici: polje je horizontal.ts:289-296 in izid 325-330 (ne 309-314); dokumentacija allowUnknown je moduleTypes.ts:160-168 (ne 150-159). Sklic salesPlaybook.ts:90-95 drži.

### `H-18` · OHRANI · ⚪ nizka

**mainCause (kadriHz): Kaj je glavni vzrok?**

**Ugotovitev.** Vzroki (horizontal.ts:240-246) razlikujejo ročne evidence, razpršene vire podatkov, zapletena pravila, zunanji obračun in nikogaršnjo odgovornost — kategorije data/data/planning/external/people so pravilno dodeljene in dajo smiselno različne naslovljive deleže. Privzetek 'Ne vemo' je konservativen (30 %).

*Sklic na raziskavo: proizvodnja.md §2.3; §10 HR-01, HR-02*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena, popravljen sklic: KADRI_CAUSES so horizontal.ts:240-246, ne 228-234.

### `H-19` · OHRANI · ⚪ nizka

**TRIAŽA dokumentiHz: Koliko časa se izgubi s potrjevanjem, iskanjem in ročnim pošiljanjem dokumentov?**

**Ugotovitev.** Kvalitativna lestvica (horizontal.ts:357-362) stopnjuje od 'urejeni in dostopni' do 'stalna težava' in ne zahteva številk — primerno za triažo. Bolečina je za proizvajalca dokazana (CMP-01: ročno zbiranje audit dokazil; SHP-01: odprema čaka dokumentacijo), regulativa (§21: ISO 9001 dokumentirane informacije, sledljivost) in ZIERDED rok 1. 1. 2028 (legacy.ts:266-272) pa področju težo samo dvigujeta.

*Sklic na raziskavo: proizvodnja.md §10 CMP-01, SHP-01; §21; legacy.ts:266-272 (ZIERDED)*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena, popravljena sklica: lestvica je horizontal.ts:357-362 (ne 341-346); ZIERDED v proizvodnja.md §21 NI omenjen (§21 pokriva ISO/NIS2/ESPR) — vir za ZIERDED je legacy.ts:266-272, zato je researchRef razdeljen.

### `H-20` · OHRANI · ⚪ nizka

**approvalHoursPerMonth: Koliko ur mesečno gre za ročno potrjevanje dokumentov — računov, naročil, pogodb — in priganjanje podpisnikov?**

**Ugotovitev.** Nosi varovalni help proti ponavljanju ur (horizontal.ts:372), konkretni primeri dokumentov in explainer z vzorcem dokumenti × minute pomagajo pri oceni, vstopa v capacity (horizontal.ts:408-414). Pri proizvajalcu ni panožnega modula, ki bi meril isto — likvidacija računov ni v P1–P5. Skladno s CMP-01.

*Sklic na raziskavo: proizvodnja.md §10 CMP-01; §12.2 ročno delo*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena, popravljena sklica: help je horizontal.ts:372 (ne 356), capacity izid 408-414 (ne 388-393).

### `H-21` · OHRANI · ⚪ nizka

**searchArchiveHoursPerMonth: Koliko ur mesečno gre za iskanje in arhiviranje dokumentov?**

**Ugotovitev.** Kratko, enoznačno in brez prekrivanja: iskanje dokumentov ni iskanje materiala (MAT-04) ne iskanje informacij za plan (P1) — besedilo 'dokumentov' mejo potegne samo. Vstopa v capacity (horizontal.ts:415-421). Dokaz 'audit prep hours' iz CMP-01 je natanko ta postavka.

*Sklic na raziskavo: proizvodnja.md §10 CMP-01, MAT-04*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena, popravljen sklic: capacity izid je horizontal.ts:415-421, ne 395-400.

### `H-22` · OHRANI · ⚪ nizka

**manualExchangeHoursPerMonth: Koliko ur mesečno gre za tiskanje, skeniranje in ročno pošiljanje dokumentov, ki bi lahko potovali elektronsko?**

**Ugotovitev.** Pogoj 'ki bi lahko potovali elektronsko' meri natanko naslovljivi del in je hkrati naravna iztočnica za prodajni pogovor o e-izmenjavi in ZIERDED. Vstopa v capacity (horizontal.ts:422-428); PANTHEON alineja o e-izmenjavi skladno z ZIERDED (horizontal.ts:439) se nanjo neposredno veže.

*Sklic na raziskavo: proizvodnja.md §10 EXE-04; legacy.ts:266-272 (ZIERDED)*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena, popravljeni sklici: capacity izid je horizontal.ts:422-428 (ne 402-407), PANTHEON alineja 439 (ne 419); §21 iz researchRef umaknjen, ker ZIERDED v proizvodnja.md ni — nadomeščen s sklicem na legacy.ts.

### `H-23` · IZBOLJŠAJ · 🟠 srednja

**annualDocDelayEUR: Koliko so v zadnjih 12 mesecih stali izgubljeni ali prepozno potrjeni dokumenti (zamujeni skonti, zamudne obresti, ponovna izstavitev)?**

**Ugotovitev.** Zrcalna težava financeHz.annualPenaltyEUR: 'zamudne obresti' so naštete v obeh (horizontal.ts:396 in 190) in proizvajalec z obema horizontalama isti evro zlahka vpiše dvakrat — §12.6 tako podvajanje po načelu 'en vzrok ne sme biti monetiziran v dveh modulih' prepoveduje. Manjka tudi allowUnknown, čeprav je to znesek, ki ga podjetje redko vodi ločeno (moduleTypes.ts:160-168).

**Kaj narediti.** Besedilo ohrani, dodaj help: "Samo zneski, ki izvirajo iz dokumentov, obtičanih v potrjevanju ali izgubljenih. Zneskov, ki ste jih že vpisali v drugem področju, tu ne ponavljajte." ter allowUnknown: true. Tip: number, enota EUR/leto, privzeto 0.

*Sklic na raziskavo: proizvodnja.md §12.6; §12.5; §10 CMP-01*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena, popravljeni sklici: 'zamudne obresti' sta horizontal.ts:396 (dokumentiHz) in 190 (financeHz), ne 376 in 178; dokumentacija allowUnknown je moduleTypes.ts:160-168.

### `H-24` · IZBOLJŠAJ · ⚪ nizka

**mainCause (dokumentiHz): Kaj je glavni vzrok?**

**Ugotovitev.** Vzrok 'Potrjevanje poteka ročno, po e-pošti ali na papirju' je kategoriziran kot planning s 65 % (horizontal.ts:344), a je po naravi ročni prenos dokumentov — kategorija data ('podatki, dokumentacija, ročni prenosi', addressableShare.ts:16-17) s 75 %, ki jo DMS naslovi neposredno (CMP-01: naslovljivost E+I+P). Nekonsistentnost potrjuje sam register: vsebinsko enak vzrok 'Dokumenti do knjiženja potujejo ročno' je v financeHz kategoriziran kot data (horizontal.ts:132), 'Primere vodimo ročno — po e-pošti' v servisHz prav tako (horizontal.ts:447). Kategorija planning ('planiranje, zaloge, vidnost nalogov') s potrjevanjem nima zveze.

**Kaj narediti.** Kategorijo vzroka "Potrjevanje poteka ročno, po e-pošti ali na papirju" spremeni iz 'planning' v 'data' (75 %). Besedilo, vrstni red in privzetek 'Ne vemo' ostanejo.

*Sklic na raziskavo: proizvodnja.md §10 CMP-01 (naslovljivost E+I+P); addressableShare.ts:16-17*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena in okrepljena z dvema notranjima precedensoma (financeHz:132, servisHz:447, oba data); popravljen sklic: vzrok je horizontal.ts:344, ne 328.

### `H-25` · OHRANI · ⚪ nizka

**TRIAŽA servisHz: Koliko dela vam povzročajo garancijska popravila, servis in vodenje reklamacij po predaji?**

**Ugotovitev.** Lestvica šteje primere ('nekaj na mesec', 'vsak teden več', horizontal.ts:467-472) — natanko vzorec 'količina dogodkov' iz §19.3 in najlaže odgovorljiva oblika. Razmejitev 'po predaji' stoji že v triažnem vprašanju (horizontal.ts:466), tako da proizvajalec izmet in interne reklamacije intuitivno pusti v P2. QLT-03 (ponavljajoče se reklamacije) področje upravičuje.

*Sklic na raziskavo: proizvodnja.md §19.3; §10 QLT-03*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena, popravljen sklic: triažni prompt je horizontal.ts:466, možnosti 467-472 (ne 446).

### `H-26` · OHRANI · ⚪ nizka

**serviceWorkHoursPerMonth: Koliko ur mesečno gre za garancijska popravila in servisne posege po predaji izdelka, blaga ali projekta?**

**Ugotovitev.** Meja 'po predaji izdelka' je v samem besedilu vprašanja in loči od dodelav v P2 (reworkHoursPerMonth meri delo PRED predajo); varovalni help proti ponavljanju ur je prisoten (horizontal.ts:482). Uporaba proizvodne ure namesto administrativne (horizontal.ts:535, s komentarjem o precedensu) je pravilna — servisni poseg opravi operater, po istem precedensu kot dodelave. Skladno s kontrolo 'reklamacija in servis istega primera' §12.6.

*Sklic na raziskavo: proizvodnja.md §12.6; §10 QLT-02, QLT-03*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena, popravljena sklica: help je horizontal.ts:482 (ne 462), operationalHourCostEUR na vrstici 535 (ne 506).

### `H-27` · OHRANI · ⚪ nizka

**rmaAdminHoursPerMonth: Koliko ur mesečno vzame vodenje reklamacijskega postopka — sprejem in evidenca primerov, komunikacija s stranko ter uveljavljanje garancij in RMA pri dobaviteljih?**

**Ugotovitev.** Help 'Štejte samo garancijske in servisne primere, ne urejanja običajnih vračil in dobropisov' (horizontal.ts:494) potegne mejo do panožnih evrov, ne da bi imenoval sosednja področja — po tretjem načelu horizontal (horizontal.ts:17-23). Administrativna ura je pravilna izbira, ker postopek vodi pisarna. Ne prekriva se s P5 customerCommsHoursPerMonth (komunikacija zaradi ZAMUD, ne reklamacij; proizvodnja.ts:496-506).

*Sklic na raziskavo: proizvodnja.md §12.6; §10 QLT-03*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena, popravljen sklic: help je horizontal.ts:494, ne 471.

### `H-28` · IZBOLJŠAJ · 🔴 visoka

**annualServiceCostEUR: Koliko so v zadnjih 12 mesecih znašali nadomestni deli, zunanji servis in kulanca pri garancijskih popravilih?**

**Ugotovitev.** Ključna razmejitvena luknja: proizvajalec z reklamacijami kupcev vidi 'reklamacije' v P2 (material.annualClaimsCostEUR, proizvodnja.ts:172-183, help na vrstici 178 omejuje le proti izmetu in dodelavam) IN 'garancijska popravila' tu — nadomestno dobavo/odškodnino istega primera lahko vpiše v obe polji. Help 'stroški, ki še niso zajeti drugje' (horizontal.ts:506) izključi le dobropise, vračila in poškodovano blago, ne pove pa, da so reklamacijski stroški lahko že vpisani v drugem področju; §12.6 navaja 'reklamacija in servis istega primera' kot izrecno kontrolo. Manjka tudi allowUnknown za znesek, ki ga podjetje pogosto ne vodi ločeno.

**Kaj narediti.** Novo besedilo: "Koliko so v zadnjih 12 mesecih znašali nadomestni deli, zunanji servis in kulanca pri garancijskih primerih po predaji?" Help: "Samo primeri po predaji izdelka. Stroškov reklamacij, ki ste jih vpisali v drugem področju, ter dobropisov in vračil kupnine tu ne štejte." Dodaj allowUnknown: true. Tip: number, enota EUR/leto, privzeto 0. Hkrati v P2 (material.annualClaimsCostEUR, proizvodnja.ts:178) help dopolni: "Vnesite samo stroške, ki še niso vključeni v izmet ali dodelave, in ne garancijskih primerov po predaji."

*Sklic na raziskavo: proizvodnja.md §12.6 (reklamacija in servis istega primera); §10 QLT-03*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena, popravljeni sklici: material.annualClaimsCostEUR je proizvodnja.ts:172-183 s helpom na 178 (ne 167-174), servisHz help je horizontal.ts:506 (ne 480). Dopolnitev P2 helpa je dovoljena, ker je proizvodnja.ts panožna datoteka — načelo o neimenovanju sosednjih področij velja le za horizontal.ts.

### `H-29` · OHRANI · ⚪ nizka

**caseTracking: Kako spremljate odprte reklamacijske in servisne primere?**

**Ugotovitev.** ContextOnly polje (horizontal.ts:511-523) z visoko diagnostično in prodajno vrednostjo: odgovor 'po e-pošti in po spominu' je neposreden argument za servisne naloge (PANTHEON alineja, horizontal.ts:554-558) in polni rezervne iztočnice playbooka (salesPlaybook.ts:104-115). Lestvica je zrelostna (§13) in odgovorljiva v sekundah; ne vstopa v izračun, zato privzetek ne ustvari zneska.

*Sklic na raziskavo: proizvodnja.md §10 QLT-03; §13 (zrelostne stopnje)*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena, popravljen sklic: PANTHEON alineje so horizontal.ts:554-558, ne 526-528.

### `H-30` · OHRANI · ⚪ nizka

**mainCause (servisHz): Kaj je glavni vzrok?**

**Ugotovitev.** Edina horizontala s kategorijo physical ('Okvare zaradi obrabe in narave izdelka', 15 %, horizontal.ts:451) — pravilno, ker del garancijskih primerov res ni procesno naslovljiv; skeptičen direktor prav to najprej napade (addressableShare.ts:6-9). 'Ne vidimo zgodovine izdelka' je TRC-01 (ročna genealogija) in podpira PANTHEON zgodbo o sledljivosti.

*Sklic na raziskavo: proizvodnja.md §10 TRC-01, QLT-03; §2.3*

### `H-31` · DODAJ · 🔴 visoka

**DODAJ (dokumentiHz): vprašanje o pripravljenosti na e-račune (ZIERDED)**

**Ugotovitev.** ZIERDED od 1. 1. 2028 zavezuje vsa podjetja, a je danes vprašanje o e-računih le kljukica v modulu E, ki se prikaže SAMO obstoječim PANTHEON strankam — potrjeno v kodi: CalculatorFlow.tsx filtrira modul E prek isTechnicalRiskModuleVisible, testi potrjujejo false za otherErp/excelPaper/null (potential.test.ts:139-145), ICP dimenzija 'nujnost' (utež 0,10, icp.ts:244-269) pa v opombi sama prizna 'modul z roki se podjetju brez PANTHEON-a sploh ne prikaže' (icp.ts:257). Ne-PANTHEON proizvajalec — glavna akvizicijska tarča — signala nikoli ne odda. Neposredne directLoss vrednosti mu pošteno ni mogoče pripisati (do 2028 ni tekočega odliva; §2.3: tveganja ne monetiziramo brez verjetnosti in posledice), zato kontekst + ICP signal, ne EUR. Shema polja je skladna (choice, contextOnly, vrednosti so števila).

**Kaj narediti.** V dokumentiHz dodaj polje eInvoiceReadiness: "Kako danes pošiljate in prejemate račune?" Tip: choice, contextOnly. Možnosti: 0 "E-računi neposredno iz sistema, prek povezanega kanala" · 1 "Delno e-računi, delno PDF po e-pošti" · 2 "Večinoma PDF po e-pošti" · 3 "Pretežno papir". Privzeto: 1. Brez EUR in brez koša (contextOnly); besedilo drži v vseh segmentih. ICP vezava konkretno: v icp.ts naj urgency rate poleg deadlineDates dobi vhod eInvoiceNotReady (odgovor ≥ 2 in polje odgovorjeno po isAnswered); kadar deadlineDates ni, a je eInvoiceNotReady, naj se vrednoti rok 2028-01-01 po obstoječi logiki daysUntil. Za obstoječe PANTHEON stranke, ki vidijo tudi modul E, se vprašanje delno podvaja s kljukico 'Nimamo urejenega kanala za e-račune' — sprejemljivo, ker choice meri stopnjo in ne binarnega tveganja; alternativno naj se kljukica E predizpolni iz odgovora ≥ 2.

*Sklic na raziskavo: proizvodnja.md §2.3; legacy.ts:266-272; icp.ts:244-269; vprasalnik-proizvodnja-trenutno-stanje.md:346*

> ℹ️ *Preverba je ugotovitev popravila:* Jedro potrjeno v kodi (gating modula E, 10 % utež nujnosti). Popravki: (1) researchRef §21 umaknjen — ZIERDED v proizvodnja.md sploh ni omenjen, §21 pokriva ISO/NIS2/ESPR; nadomeščen s sklici na kodo in vprasalnik-proizvodnja-trenutno-stanje.md:346 (točno ime datoteke). (2) Dodana omejitev: signal nastane le, če obiskovalec dokumentiHz v triaži izbere, zato luknja ni v celoti zaprta. (3) Dodano opozorilo na delno podvajanje z modulom E pri PANTHEON strankah in konkretizirana ICP vezava (eInvoiceNotReady → rok 2028-01-01), da je predlog izvedljiv brez dodatnih odločitev.

### `H-32` · OHRANI · 🟠 srednja

**NABOR HORIZONTAL v triaži proizvodnje (10 področij, priporočena 3)**

**Ugotovitev.** Vseh pet horizontal je za proizvajalca upravičenih: vsaka meri denar, ki ga P1–P5 ne merijo, izpustitve v drugih segmentih pa so bile vse prekrivne narave (logistika brez dokumentiHz/servisHz — segments.ts:98-101, računovodstvo brez financeHz/dokumentiHz/servisHz — segments.ts:223-226, splošno brez analitikaHz/servisHz — segments.ts:255-258), medtem ko v proizvodnji polnega prekrivnega modula ni. Redčenje triaže je omejeno strukturno: privzeta izbira so prva tri panožna področja (segments.ts:88-90), vrstni red pa ob izenačenju favorizira panožno bolečino (segments.ts:71-73). Preostalo tveganje izrinjanja (nasičena kadriHz lestvica, robna prekrivanja analitika↔nalogi/plan in servis↔material) rešujejo besedilni popravki iz te revizije, ne odstranitev modulov — raziskava §19.2 s 17 področji širino triaže izrecno podpira.

*Sklic na raziskavo: proizvodnja.md §19.2; segments.ts:71-90*

---

## 8. Manjkajoča področja — paketi vprašanj

*10× dodaj*

| ID | Sodba | Teža | Vprašanje |
|---|---|---|---|
| `V-01` | DODAJ | 🔴 | PAKET 1 — Lastna cena in pokalkulacija (novo triažno področje 'lastnaCena'; CST-01/02/03) |
| `V-02` | DODAJ | ⚪ | PAKET 2 — Menjave in nastavitve (SET-01/02) — pogojno za serijsko/na zalogo; NE PRIPOROČ… |
| `V-03` | DODAJ | 🔴 | PAKET 3 — Neplanirani zastoji in vzdrževanje (novo triažno področje 'zastoji'; MNT-01/02… |
| `V-04` | DODAJ | 🟠 | PAKET 4 — Kooperanti (SUB-01/02) — pogojni modul; NE PRIPOROČAM ZDAJ |
| `V-05` | DODAJ | 🟠 | PAKET 5 — Sledljivost in dokazovanje (TRC-01/02, CMP-01) — recall drill kot KPI; kot sam… |
| `V-06` | DODAJ | 🟠 | PAKET 6 — Nabava in dobavitelji (PUR-01/02/03) — samo kapacitetni modul z ostro mejo pro… |
| `V-07` | DODAJ | 🟠 | PAKET 7 — Odprema in OTIF (SHP-01, SAL-01) — razširitev P5, ne novo področje |
| `V-08` | DODAJ | 🔴 | PAKET 8 — Imenovalci Q-02–Q-07: neposredni zaposleni, izmene, naročila/DN (prihodki in m… |
| `V-09` | DODAJ | 🔴 | PAKET 9 — Monetizacija kapacitete (Q-20) in ozko grlo (§6.3) — dve kontekstni vprašanji |
| `V-10` | DODAJ | 🟠 | PAKET 10 — Vir podatka (Q-22) — eno globalno vprašanje namesto podvajanja vprašalnika |

### `V-01` · DODAJ · 🔴 visoka

**PAKET 1 — Lastna cena in pokalkulacija (novo triažno področje 'lastnaCena'; CST-01/02/03)**

**Ugotovitev.** Največja vsebinska vrzel: erozija marže na DOBLJENIH naročilih ni nikjer merjena — P5 meri le maržo odpovedanih naročil (src/config/modules/proizvodnja.ts:484–494), diagnostika pa 'knowsUnitCost' zajame samo kvalitativno (proizvodnja.ts:582–587). Raziskava jo uvršča med jedrne bolečine (CST-01 'lastna cena ni znana po naročilu', CST-02 'normativi niso posodobljeni' — finančni kanal marža in ponudbena marža, naslovljivost E+P; proizvodnja.md vrstice 595–597) in tipična izjava financ v §7 je 'Ko dobim pravo lastno ceno, je naročilo že zaključeno'. Infrastruktura že obstaja: prihodek in marža sta v skupni finančni osnovi (src/config/contexts/proizvodnja.ts:82–109), koš lostMargin in zastavica usesRevenue tudi (moduleTypes.ts:30 in 241) — vzorec formule prihodek × delež × maržne točke je preverjen v maloprodaji (maloprodaja.ts:433). Odgovorljivost je dobra: direktor delež 'naročil pod maržo' oceni iz glave (§19.3 korak 3 — delež problematičnih dogodkov).

**Kaj narediti.** TRIAŽA: nova vrstica takoj za T5 (zamude) in pred horizontalami — panožni moduli so v segments.ts namenoma pred horizontalnimi; triaža s tem dobi 11 vrstic. Vprašanje: 'Kako hitro in zanesljivo poznate dejansko lastno ceno in maržo posameznega naročila?' — 0: Sproti, ob zaključku naloga · 1: V nekaj dneh po zaključku · 2: Šele ob mesečnem ali letnem obračunu · 3: Dejanske lastne cene ne poznamo. POLJA: (1) costingTiming, choice, contextOnly, privzeto 2: 'Kdaj po zaključku naročila poznate dejansko maržo?' — Sproti iz sistema / V nekaj dneh / Ob mesečnem obračunu / Nikoli, računamo samo predkalkulacijo (prodajni jezik iz §20). (2) underMarginOrdersSharePercent, percent (drsnik 0–50 %, korak 1), privzeto 0: 'Pri kolikšnem deležu naročil se izkaže, da je dejanska marža nižja od načrtovane?' — help: 'Odpovedana naročila sem ne sodijo — ta ste vpisali v Roki in nujni stroški.' (3) marginGapPercent, percent (drsnik 0–15 %, korak 0,5), privzeto 0: 'Za koliko odstotnih točk je marža teh naročil tipično nižja?' — help: 'Primer: načrtovanih 30 %, dejanskih 24 % → vpišite 6. Če je vzrok izmet ali dodelave, ki ste jih že vpisali v Izmet, tega dela NE štejte še enkrat — tu zajemite podcenjene normative, zastarele cene in nepokrito režijo.' (4) postCalcHoursPerMonth, number, h/mesec, privzeto 0: 'Koliko ur mesečno porabite za ročne pokalkulacije in ugotavljanje, kje je marža ušla?' — help: 'Ure splošnih poročil ste vpisali v Analitika in poročanje.' (5) mainCause: Normativi in sestavnice ne odražajo dejanske porabe (data 75 %) / Dejanska poraba in ure se ne evidentirajo po nalogu (data 75 %) / Režija se razporeja pavšalno in prekrije sliko (planning 65 %) / Cene materiala rastejo hitreje, kot se osvežijo ceniki (external 25 %) / Ne vemo (30 %). FORMULA: lostMargin 'Erozija marže na dobljenih naročilih' = context.annualRevenueEUR × underMarginOrdersShare × marginGap (usesRevenue: true; oba privzetka 0 — brez uporabnikovega vnosa ni zneska; brez odgovora o prihodku postavka izpade in zanesljivost pade, kar motor že zna); capacity 'Ročne pokalkulacije' = postCalcHoursPerMonth × adminHourCostEUR × 12. PRIKAZ: vsem. PRIORITETA: hitri tok zdaj — prvi paket, ki naj se doda.

*Sklic na raziskavo: proizvodnja.md §9.17, §10 CST-01/CST-02/CST-03, §7 (izjava financ), §20; §12.6 (meja proti izmetu iz P2 in proti P5 zapisana v help)*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena, popravljeni napačni sklici: pot projekta je aplikacije/ROI kalkulator (ne 'Claude code'); P5 lostMargin je proizvodnja.ts:484–494 (ne 457–463); knowsUnitCost 582–587 (ne 547–552); kontekst prihodek+marža contexts/proizvodnja.ts:82–109 (ne 69–94); vzorec formule maloprodaja.ts:433 (ne 393); usesRevenue moduleTypes.ts:241 (ne 232). Izjava iz §7 je pripisana personi 'Finance' v tipičnih izjavah kupcev, ne izrecno 'CFO'. Pojasnjena umestitev triažne vrstice (za T5, pred horizontalami — triaža ima danes 10 vrstic: 5 panožnih + 5 horizontalnih).

### `V-02` · DODAJ · ⚪ nizka

**PAKET 2 — Menjave in nastavitve (SET-01/02) — pogojno za serijsko/na zalogo; NE PRIPOROČAM ZDAJ**

**Ugotovitev.** Paket je vsebinsko upravičen (SET-01 'menjave trajajo nepredvidljivo', SET-02 'zagonski izmet'), a je eden od treh, ki jih zdaj NE bi dodal. Trije razlogi: (1) jedro menjav je fizično-procesna disciplina — §9.8 dobesedno: 'ERP hrani standarde in plan; izboljšanje SMED je fizično-procesna disciplina', naslovljivost SET-01 je P+F+I — kalkulator za ERP bi meril strošek, ki ga PANTHEON večinoma ne odpravi, in prodajnik zneska na sestanku ne bi ubranil. (2) Relevanten je le za serijsko/na zalogo, mehanizma pogojnega prikaza po businessType pa ni — businessType je danes samo oznaka v poročilu (salesReport.ts:287, qualification.businessTypeLabel), ModuleDefinition nima showIf (moduleTypes.ts:215–259). (3) Zagonski izmet se prekriva z drsnikom izmeta v P2 (proizvodnja.ts:156–164, privzeto 3 %) in odštevanja obiskovalec ne bo naredil (§12.6 'izmet in materialno odstopanje iste količine').

**Kaj narediti.** ČE se kdaj doda (globinski tok, po uvedbi showIf): TRIAŽA (prikaz le businessType ∈ {serijsko, naZalogo, kombinirano}): 'Koliko časa izgubite ob menjavah serij in nastavitvah strojev?' — 0: Menjave so standardizirane in kratke · 1: Občasno se zavlečejo · 2: Vsak teden izgubimo ure · 3: Menjave so vsakodnevno ozko grlo. POLJA: (1) setupsPerMonth, number, 'menjav/mesec', privzeto 0. (2) avgSetupHours, number, 'h', privzeto 0: 'Koliko ur v povprečju traja ena menjava — od zadnjega dobrega kosa stare do prvega dobrega kosa nove serije?' (definicija iz §9.8/§11). (3) setupWaitingSharePercent, percent 0–100, privzeto 0: 'Kolikšen del tega časa je čakanje na orodje, dokumentacijo ali parametre?' — help: 'Samo čakanje, ki bi ga boljša priprava odpravila — fizičnega časa menjave sistem ne skrajša. Čakanje zaradi nejasnega plana ste vpisali v Plan.' (4) startupScrapEUR, number, EUR/leto, privzeto 0, allowUnknown: 'Koliko materiala letno konča kot zagonski izmet ob menjavah?' — help: 'Ta izmet izvzemite iz deleža izmeta v področju Izmet, sicer bo štet dvakrat.' (5) mainCause: Parametri in navodila niso na enem mestu (data 75 %) / Menjave niso planirane v pametnem zaporedju (planning 65 %) / Priprava se začne šele ob ustavitvi stroja (people 45 %) / Orodja so obrabljena ali jih ni dovolj (physical 15 %) / Ne vemo (30 %). FORMULA: capacity = setupsPerMonth × avgSetupHours × setupWaitingShare × operationalHourCostEUR × 12 (samo čakalni del!); directLoss = startupScrapEUR. VMESNA REŠITEV ZDAJ: eno contextOnly choice vprašanje v P1 (planiranje): 'Ali plan upošteva zaporedje izdelkov, ki zmanjša menjave?' — Da / Deloma / Ne — hrani signal za prodajno poročilo (measured.answers) brez tveganja napihnjenega zneska.

*Sklic na raziskavo: proizvodnja.md §9.8 (sistemska meja, dobesedni citat preverjen), §10 SET-01/SET-02 (naslovljivost P+F+I potrjena), §11, §12.6*

> ℹ️ *Preverba je ugotovitev popravila:* Vsi trije razlogi za odlog preverjeni in držijo (citat §9.8 je dobeseden; showIf v ModuleDefinition res ne obstaja; drsnik izmeta res privzeto 3 %). Popravljeni sklici vrstic: businessType kot oznaka salesReport.ts:287 (ne 269); ModuleDefinition moduleTypes.ts:215–259 (ne 206–250); drsnik izmeta proizvodnja.ts:156–164 (ne 152–159). Definicija setup časa je v §9.8 (podatki/meritve), ne v §11 KPI slovarju — sklic dopolnjen.

### `V-03` · DODAJ · 🔴 visoka

**PAKET 3 — Neplanirani zastoji in vzdrževanje (novo triažno področje 'zastoji'; MNT-01/02/03)**

**Ugotovitev.** Ure okvar danes ne padejo NIKAMOR: P1 jih izrecno izloči ('Ne vključujte čakanja na material ali okvar strojev' — proizvodnja.ts:75), P5 jih prizna le kot vzrok ('Zmogljivosti oziroma stroji', proizvodnja.ts:436), modula, ki bi jih zajel, pa ni — izmerjena izguba je sistematično podcenjena. Kategorija physical s 15 % naslovljivosti že obstaja (addressableShare.ts:33), a nima modula, na katerega bi se pripela; vzroki okvar pa so pogosto planski/podatkovni (reaktivno vzdrževanje, neizvedena preventiva — MNT-01/02), torej delno ERP-naslovljivi. Vprašanje je zasnovano po vzorcu 'št. dogodkov × tipično trajanje' (§19.3 koraka 1–2), vključno s korakom 6 'kaj je bilo nadoknadeno', ki je varovalka proti dvojnemu štetju zastoja in izgubljene prodaje (§12.2 Zastoj: 'Ne seštevamo obeh, če opisujeta isti izgubljeni izhod'; §12.6; §6.3 pogoj 4).

**Kaj narediti.** TRIAŽA (za T3 Zaloge): 'Kako pogosto neplanirane okvare strojev ustavijo proizvodnjo?' — 0: Redko, okvare so izjema · 1: Nekajkrat na leto · 2: Vsak mesec · 3: Vsak teden ali pogosteje. POLJA: (1) breakdownsPerMonth, number, 'okvar/mesec', privzeto 0: 'Koliko zastojev zaradi okvar, daljših od pol ure, imate v povprečju na mesec?' (2) avgBreakdownHours, number, 'h', privzeto 0: 'Koliko ur v povprečju stoji prizadeto delovno mesto ob eni okvari?' — help: 'Od ustavitve do ponovnega zagona, vključno s čakanjem na serviserja. Čakanje na material sodi v Zaloge, čakanje na navodila v Plan.' POZOR ZA IZVEDBO: plauzibilnostna ovojnica (lib/plausibility.ts) sešteva samo polja z enoto h/mesec in h/leto — zmnožek breakdownsPerMonth × avgBreakdownHours ji uide; skupne ure zastojev je treba v preverbo dodati posebej (razširitev assessHoursPlausibility ali izpeljano polje), sicer je to edino urno področje brez varovalke. (3) recoveredShare, choice, contextOnly, privzeto zadnja možnost 'Ne vem' (unknown): 'Koliko izpadle proizvodnje zaradi okvar praviloma nadoknadite z nadurami ali dodatno izmeno?' — Skoraj vse / Približno polovico / Manjši del / Nič / Ne vem (§19.3 korak 6; prepreči prihodnje seštevanje zastoja in izgubljene prodaje istega dogodka, §12.6). (4) unplannedMaintenanceCostEUR, number, EUR/leto, privzeto 0, allowUnknown: 'Koliko so v zadnjih 12 mesecih znašali zunanji servisi in nadomestni deli za NEPREDVIDENA popravila?' — help: 'Redno preventivno vzdrževanje je običajen strošek in sem ne sodi.' (5) pmPractice, choice, contextOnly, privzeto 2: 'Kako vodite preventivno vzdrževanje?' — Plan v sistemu in se izvaja / Plan v Excelu ali koledarju / Preventiva obstaja, a se umika proizvodnji / Vzdržujemo ob okvarah (MNT-02, PM compliance §9.9). (6) mainCause: Vzdrževanje je pretežno reaktivno, preventiva se ne izvede (planning 65 %) / Okvare in vzroki se ne beležijo, zato se ponavljajo (data 75 %) / Rezervni deli niso na zalogi, ko so potrebni (planning 65 %) / Oprema je stara oziroma iztrošena (physical 15 %) / Zunanji serviserji se odzivajo počasi (external 25 %) / Ne vemo (30 %). FORMULA: capacity 'Zastoji zaradi okvar' = breakdownsPerMonth × avgBreakdownHours × operationalHourCostEUR × 12 (§12.2 Zastoj = ure × izogibni strošek ure); directLoss 'Nepredvidena popravila in deli' = unplannedMaintenanceCostEUR. Izgubljene marže NE računamo — pogojev §6.3 kalkulator ne more preveriti; recoveredShare služi prodajnemu poročilu. PRIKAZ: vsem. PRIORITETA: hitri tok zdaj.

*Sklic na raziskavo: proizvodnja.md §9.9, §10 MNT-01/02/03 (vrstice 578–580), §19.3 (korak 6), §12.2 (Zastoj), §12.6, §6.3*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina in vse ključne trditve potrjene (izločitev okvar v P1, physical 15 %, vzorec §19.3). Popravljena sklica vrstic: P1 help proizvodnja.ts:75 (ne 74), P5 vzrok proizvodnja.ts:436 (ne 415). Dodano izvedbeno opozorilo: predlagana kombinacija count × avg (enota 'h' na dogodek) uide obstoječi plauzibilnostni ovojnici, ki sešteva le h/mesec in h/leto polja — brez razširitve bi bilo to edino urno področje brez varovalke pred pretiravanjem. PM compliance je naveden v §9.9 (meritve vzdrževanja), ne v §11 — sklic popravljen.

### `V-04` · DODAJ · 🟠 srednja

**PAKET 4 — Kooperanti (SUB-01/02) — pogojni modul; NE PRIPOROČAM ZDAJ**

**Ugotovitev.** Drugi od treh paketov, ki jih zdaj NE bi dodal, čeprav je za kovinskopredelovalni in tekstilni segment realna bolečina (§4.2, arhetip §5.7, SUB-01 'ne vemo, kaj je pri kooperantu'). Razlogi za odlog: (1) mehanizma pogojnega prikaza ni — businessType je samo oznaka v poročilu (salesReport.ts:287), nova triažna vrstica za vse pa bi obremenila večino obiskovalcev z območjem, ki ga nimajo; (2) denarne posledice kooperantskih zamud (ekspres, penali, izgubljena marža) že v celoti zajame P5 (proizvodnja.ts:466–494: expediteCostEUR, penaltyCostEUR, lostMarginEUR) — nov modul bi smel meriti samo URE usklajevanja, kar je ozek dodatek; (3) vzrok 'Zunanji dobavitelji ali kupci' v P5 (proizvodnja.ts:435) signal o kooperantih delno že ulovi. PANTHEON kooperantske DN podpira (§9.13: 'PANTHEON uradno navaja upravljanje DN kooperantov in povezavo z njihovimi prejetimi računi'), zato je paket smiseln v drugem valu.

**Kaj narediti.** ČE se doda (globinski tok, po uvedbi showIf po businessType ali po vstopnem vprašanju 'Ali del operacij oddajate kooperantom?'): TRIAŽA: 'Koliko preglavic imate s kooperanti — statusi, roki, dokumenti?' — 0: Kooperantov nimamo ali tečejo brez težav · 1: Občasno · 2: Redno preganjamo in usklajujemo · 3: Kooperanti so stalno ozko grlo. POLJA: (1) subcontractShare, choice, contextOnly: 'Kolikšen delež vrednosti proizvodnje opravijo kooperanti?' — Do 10 % / 10–30 % / Nad 30 % / Nič. (2) subcontractCoordHoursPerMonth, number, h/mesec, privzeto 0: 'Koliko ur mesečno porabite za usklajevanje s kooperanti — statusi, roki, dokumenti, prevozi?' — help: 'Obveščanje KUPCEV o zamudah ste vpisali v Roki in nujni stroški.' (3) subcontractLatePerMonth, number, 'zamud/mesec', privzeto 0, contextOnly: 'Kolikokrat na mesec kooperant zamudi dogovorjeni rok?' (4) subcontractExtraCostEUR, number, EUR/leto, privzeto 0, allowUnknown: 'Koliko so v 12 mesecih znašali dodatni stroški zaradi kooperantskih napak — dodelave po vrnitvi, dodatni prevozi?' — help: 'Ekspresne dostave in penali, ki ste jih vpisali v Roki in nujni stroški, sem NE sodijo.' (5) invoiceMatch, choice, contextOnly: 'Ali se račun kooperanta samodejno ujame z naročeno operacijo in količino?' — Da / Ročno preverjamo / Ne preverjamo (SUB-02). (6) mainCause: Nimamo vpogleda v stanje pri kooperantu (data 75 %) / Naročila in dokumenti potujejo ročno, po e-pošti (data 75 %) / Roki kooperantov niso del proizvodnega plana (planning 65 %) / Kooperanti so preobremenjeni ali nezanesljivi (external 25 %) / Ne vemo (30 %). FORMULA: capacity = subcontractCoordHoursPerMonth × adminHourCostEUR × 12; directLoss = subcontractExtraCostEUR. VMESNA REŠITEV ZDAJ: nič — signal delno lovi P5.

*Sklic na raziskavo: proizvodnja.md §9.13, §10 SUB-01/SUB-02 (vrstici 590–591), §4.2, §5.7; §12.6 (meja proti P5 v help)*

> ℹ️ *Preverba je ugotovitev popravila:* Vsi trije razlogi za odlog preverjeni in držijo (P5 res zajame vse tri denarne kanale kooperantskih zamud; §9.13 in §5.7 potrjujeta ujemanje MF). Popravljena sklica: P5 denarne postavke proizvodnja.ts:466–494 (ne 442–463), vzrok external proizvodnja.ts:435 (ne 414), businessType salesReport.ts:287 (ne 269). Oznako '12. triažna vrstica' sem odstranil — triaža ima danes 10 vrstic, številka nove je odvisna od sprejetih paketov.

### `V-05` · DODAJ · 🟠 srednja

**PAKET 5 — Sledljivost in dokazovanje (TRC-01/02, CMP-01) — recall drill kot KPI; kot samostojen EUR-modul NE PRIPOROČAM**

**Ugotovitev.** Tretji paket, ki ga kot samostojno stroškovno področje NE bi dodal: tveganje odpoklica se ne sme monetizirati brez verjetnosti in posledice (§2.3), diagnostika pa sledljivost kvalitativno že pokriva (materialTraceability, proizvodnja.ts:588–594; PROCESS_RISK_NOTE o odpoklicu 556–560). Napačno bi bilo izumljati EUR — prav to je vzorec 'navidezne natančnosti', ki ga modul diagnostike izrecno zavrača (komentar proizvodnja.ts:562–568). Kar pa MANJKA in je poceni: recall drill kot merljiv KPI pripravljenosti (§11 'Recall drill time'; TRC-01 'genealogija se sestavlja ročno') in edina pošteno merljiva denarna postavka — ure ročne priprave dokazil za audite (CMP-01, dokaz 'audit prep hours'). Obe vprašanji sta odgovorljivi iz glave; v prodajno poročilo prideta prek measured.answers in koša risk (recallDrillTime vstopa v oceno tveganja, torej NI contextOnly), kontekstna polja pa playbook uporabi kot iztočnice, kadar drugih ni (salesPlaybook.ts:104–115).

**Kaj narediti.** DODAJ V OBSTOJEČO DIAGNOSTIKO (brez nove triažne vrstice): (1) recallDrillTime, choice, privzeto 2: 'Če bi kupec danes javil sporno serijo — kako hitro bi sestavili popoln seznam prizadetih izdelkov in kupcev?' — V nekaj urah, iz sistema (0) / V enem dnevu (1) / V nekaj dneh, ročno iz tabel (2) / Tega ne bi mogli zanesljivo narediti (3). Vstopi v obstoječi izračun 'Procesna odpornost': riskLevelFromScore(materialTraceability + keyPersonIndependence + recallDrillTime, 9) — danes je (…, 6) na proizvodnja.ts:605. (2) auditPrepHoursPerYear, number, h/leto, privzeto 0, allowUnknown: 'Koliko ur letno porabite za ročno zbiranje dokazil za presoje, certifikate in kupčeve audite?' — help: 'Iskanje običajnih dokumentov ste vpisali v Dokumentacija in e-poslovanje — sem sodijo samo presoje in auditi.' FORMULA: capacity 'Ročna priprava dokazil' = auditPrepHoursPerYear × adminHourCostEUR (h/leto enoto plauzibilnost že deli z 12; CMP-01). IZVEDBENA POSLEDICA, ki jo mora razvijalec narediti hkrati: diagnostika ima danes trdo jamstvo 'ne prispeva nobenega evra' (summary proizvodnja.ts:572, doktrinarni komentar 562–568, verjetno tudi test proizvodnja.test.ts) — ob dodani kapacitetni postavki je treba posodobiti summary, komentar in test; načelo 'modul brez triaže ne more biti največja postavka' ostane, ker highestModule izhaja iz triažnih modulov. Tveganje odpoklica ostane koš risk BREZ zneska — PROCESS_RISK_NOTE naj ob visoki oceni doda: 'Ob resni reklamaciji obsega umika ne morete omejiti — strošek raste z vsako uro iskanja.' PRIKAZ: vsem (diagnostika se prikaže vedno); panožne zaostritve (živila, avto) niso mogoče, ker vprašalnik panoge znotraj proizvodnje ne pozna (industries.ts:26 — ena sama vrstica za vso proizvodnjo). PRIORITETA: ti dve polji hitri tok (poceni); samostojen modul — ne.

*Sklic na raziskavo: proizvodnja.md §9.11, §10 TRC-01/TRC-02/CMP-01 (vrstice 585–586, 610), §11 (Recall drill time, vrstica 670), §2.3 (tveganje brez monetizacije), §21 (HACCP/IATF)*

> ℹ️ *Preverba je ugotovitev popravila:* Jedro potrjeno. Trije popravki: (1) sklici vrstic — materialTraceability 588–594, PROCESS_RISK_NOTE 556–560, komentar proti navidezni natančnosti 562–568, izračun odpornosti 605 (ne 553–558/521–525/527–533/570); formula 'ure / 12 × admin ura × 12' poenostavljena v ure × admin ura. (2) Rationale je trdil, da obe polji polnita poročilo kot contextOnly — recallDrillTime NI contextOnly (vstopa v risk score), popravljeno. (3) Dodana manjkajoča izvedbena posledica: diagnostika ima danes eksplicitno jamstvo 'ne prispeva nobenega evra' v summary, komentarju in testu — predlog ga krši, zato mora sprememba zajeti tudi ta tri mesta, sicer se besedilo in koda razideta.

### `V-06` · DODAJ · 🟠 srednja

**PAKET 6 — Nabava in dobavitelji (PUR-01/02/03) — samo kapacitetni modul z ostro mejo proti zamude.expediteCostEUR**

**Ugotovitev.** Nabavna služba je edina persona iz §7, katere ročno delo ni nikjer merjeno: P5 zajame EVRE ekspresnih nabav (expediteCostEUR, proizvodnja.ts:466–476), P3 zajame URE čakanja PROIZVODNJE na material (materialWaitingHoursPerMonth, proizvodnja.ts:264–274) — ure NABAVE (priganjanje, ročne potrditve, ročna naročila) ne padejo nikamor. Modul mora zato ostati izključno kapacitetni: vsak EUR nabave je že v P5 ali v P3 (oneTimeCapital presežnih zalog), kar je natanko kontrola §12.6 'čakanje na material pri planiranju in nabavi'. Vprašanje o merjenju zanesljivosti dobaviteljev je KPI-vprašanje (supplier OTIF — §9.12 meritve in §7 persona nabave) in za prodajnika močan signal zrelosti (§3.4 ICP: nabava ni povezana s planom).

**Kaj narediti.** TRIAŽA: nova vrstica za panožnimi moduli (vrstni red glede na sprejete pakete 1 in 3): 'Koliko gašenja požarov ima vaša nabava — nujna naročila, priganjanje dobaviteljev, ročne potrditve?' — 0: Nabava teče po planu · 1: Občasno · 2: Vsak teden · 3: Nabava večinoma gasi požare. POLJA: (1) purchasingAdminHoursPerMonth, number, h/mesec, privzeto 0: 'Koliko ur mesečno porabite za ročno pripravo in vnos nabavnih naročil, ki bi jih sistem lahko predlagal iz plana?' — help: 'Prepisovanje med orodji ste vpisali v Delovni nalogi — sem sodi samo priprava naročil.' (2) expeditingHoursPerMonth, number, h/mesec, privzeto 0: 'Koliko ur mesečno gre za priganjanje dobaviteljev, preverjanje potrditev in usklajevanje rokov?' — help: 'Dodatne STROŠKE ekspresnih dobav ste že vpisali v Roki in nujni stroški — tu štejte samo ure.' (3) supplierOtifKnown, choice, contextOnly, privzeto 3: 'Ali merite zanesljivost dobaviteljev — delež pravočasnih in popolnih dobav?' — Da, sistematično / Delno, za ključne / Po občutku / Ne merimo (supplier OTIF; help: 'Potrjeni datum se ne sme tiho spreminjati'). (4) confirmationsPractice, choice, contextOnly: 'Kolikšen delež naročil dobavitelji pisno potrdijo z rokom?' — Večino / Približno polovico / Manjšino / Potrditev ne zahtevamo (PUR-02, §9.12 'delež potrjenih naročil'). (5) mainCause: Potrebe niso izračunane iz plana — naročamo ročno in prepozno (planning 65 %) / Potrditve in roki so v e-pošti, ne v sistemu (data 75 %) / Dobavitelji so nezanesljivi (external 25 %) / Nabava je kadrovsko podhranjena (people 45 %) / Ne vemo (30 %). FORMULA: dve capacity postavki = obe urni polji × adminHourCostEUR × 12; BREZ directLoss in BREZ oneTimeCapital (presežna zaloga zaradi MOQ je že v P3 — vprašanj o njej sem NE dodajati, §12.6). PRIKAZ: vsem. PRIORITETA: globinski tok pozneje (drugi val, za paketoma 1 in 3) — vrzel je ožja, ker evri že obstajajo drugje.

*Sklic na raziskavo: proizvodnja.md §9.12 (meritve: supplier OTIF, expedite rate, delež potrjenih naročil), §10 PUR-01/02/03 (vrstice 587–589), §12.6 ('čakanje na material pri planiranju in nabavi'), §7 (persona nabava), §3.4*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina, meje proti P5/P3 in kapacitetna omejitev potrjene ter skladne s §12.6. Popravljeni sklici vrstic: expediteCostEUR proizvodnja.ts:466–476 (ne 442–448), materialWaitingHoursPerMonth 264–274 (ne 252–258). Supplier OTIF je dokumentiran v §9.12 in §7 (tabela person), v §11 KPI slovarju ga izrecno ni — sklic popravljen. Oznaka '12. vrstica' zamenjana z relativno umestitvijo, ker je številka odvisna od tega, kateri paketi so sprejeti prej.

### `V-07` · DODAJ · 🟠 srednja

**PAKET 7 — Odprema in OTIF (SHP-01, SAL-01) — razširitev P5, ne novo področje**

**Ugotovitev.** OTIF je KPI, ki ga slovenskim proizvajalcem postavljajo evropski kupci (§3.2) in je za direktorja eden redkih kazalnikov, ki jih pozna iz glave — vprašalnik pa ga sploh ne vpraša; P5 sprašuje le absolutno število zamujenih naročil brez imenovalca (lateOrdersPerMonth, contextOnly, proizvodnja.ts:453–464). Ure odpreme, ki čaka na ročno dokumentacijo (SHP-01 'odprema čaka dokumentacijo'), in način, kako prodaja obljubi rok (SAL-01, PLN-03 'prodaja brez CTP'), niso nikjer. Vsi trije dodatki sodijo v P5 kot razširitev — nova triažna vrstica bi umetno ločila vzrok (obljuba roka) od posledice (zamuda), meja proti obstoječim poljem P5 pa je čista: obstoječa polja merijo POSLEDICE zamud, nova merijo IZVOR in ODPREMO.

**Kaj narediti.** DODAJ V P5 (zamude): (1) otifLevel, choice, contextOnly, privzeto 3: 'Ali merite OTIF — delež pravočasnih in popolnih dobav — in kolikšen je?' — Da, nad 95 % / Da, 85–95 % / Da, pod 85 % / Ne merimo. help: 'Šteje prvotno potrjeni datum kupcu, ne naknadno premaknjeni' (§9.15 — enotna definicija je pogoj, da številka kaj pomeni). (2) shipmentDocsHoursPerMonth, number, h/mesec, privzeto 0: 'Koliko ur mesečno odprema izgubi z ročno pripravo dobavnic, deklaracij, certifikatov in izvoznih dokumentov?' — help: 'Obveščanje kupcev o zamudah ste vpisali zgoraj; potrjevanje računov in ročno pošiljanje dokumentov sodita v Dokumentacija in e-poslovanje — sem sodi samo priprava dokumentov ob odpremi.' → formula: capacity 'Ročna dokumentacija ob odpremi' = shipmentDocsHoursPerMonth × adminHourCostEUR × 12 (SHP-01). (3) promiseMethod, choice, contextOnly: 'Kako prodaja določi obljubljeni rok dobave?' — Iz plana in razpoložljivosti v sistemu / Po posvetu s proizvodnjo / Iz izkušnje / Rok postavi kupec, mi pa poskušamo (SAL-01; ob odgovoru 3–4 dobi prodajnik iztočnico 'prodaja obljublja brez CTP' — PLN-03). Skupaj s paketom 8 (ordersPerMonth) postane lateOrdersPerMonth končno izračunljiv KOT DELEŽ za prodajno poročilo in navzkrižno preverbo z izbranim otifLevel (plausibility). PRIKAZ: vsem, ki izberejo P5. PRIORITETA: hitri tok za otifLevel in promiseMethod (KPI in kvalifikacija), shipmentDocsHours lahko počaka na globinski tok.

*Sklic na raziskavo: proizvodnja.md §9.15 (enotna definicija OTIF), §10 SHP-01/SAL-01/PLN-03 (vrstice 563, 598–599), §11 (OTIF), §3.2, §19.1 Q-11/Q-12*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena (lateOrdersPerMonth res contextOnly brez imenovalca; OTIF nikjer vprašan; §9.15 potrjuje pogoj enotne definicije). Popravljen sklic: lateOrdersPerMonth proizvodnja.ts:453–464 (ne 433–440). V help besedila shipmentDocsHours dodana še meja proti ročnemu pošiljanju dokumentov iz horizontalnega modula Dokumentacija in e-poslovanje (dokumentiHz) — brez nje bi se iste ure lahko štele dvakrat (§12.6).

### `V-08` · DODAJ · 🔴 visoka

**PAKET 8 — Imenovalci Q-02–Q-07: neposredni zaposleni, izmene, naročila/DN (prihodki in marža sta medtem ŽE dodana)**

**Ugotovitev.** Popis (vprasalnik-proizvodnja-trenutno-stanje.md, ~vrstica 101: 'Proizvodnja ne vpraša … prihodka in marže') je zastarel: prihodki in prispevna marža sta v skupni finančni osnovi ŽE vprašana (contexts/proizvodnja.ts:82–109, prikaz components/Calculator/StepCostBasis.tsx) — a jih noben proizvodni modul ne uporablja (v proizvodnja.ts ni nobenega usesRevenue/annualRevenueEUR), kar reši paket 1. Od imenovalcev Q-02–Q-07 zares manjkajo: neposredni proizvodni zaposleni, izmene in število naročil/DN. Neposredni zaposleni so ključni za verjetnostno ovojnico — plausibility.ts:18–27 danes množi VSE zaposlene s 160 h, zato je 40-odstotni prag pri podjetju s polovico režije preohlapen in proizvodna urna polja slabo lovi; hkrati je 'vsaj 10 neposredno proizvodnih' ICP-kriterij (§3.4). Letnih materialnih stroškov naj NE selimo v skupno osnovo s pasovi: kdor P2 izbere in privzetega 3-odstotnega drsnika izmeta (proizvodnja.ts:156–164) ne premakne, bi z ocenjeno pasovno osnovo dobil znesek brez enega samega lastnega vnosa — danes znesek nastane šele, ko uporabnik sam vpiše porabo materiala.

**Kaj narediti.** KORAK VELIKOSTI (components/Calculator/StepEmployeeCount.tsx) — dodaj pod employeeCount: (1) directEmployeeCount, number, 'zaposlenih', privzeto 0: 'Koliko od tega jih dela neposredno v proizvodnji — na delovnih nalogih?' — help: 'Operaterji, varilci, monterji; brez režije, prodaje in pisarne.' Uporaba: (a) plausibility loči polja, vrednotena s proizvodno uro, od administrativnih — ovojnica za proizvodna postane directEmployeeCount × 160 h (zahteva razširitev assessHoursPlausibility, da polja razvrsti po urni postavki, s katero jih compute množi); (b) ICP točka 'vsaj 10 neposredno proizvodnih'. (2) shiftCount, choice, privzeto 0: 'V koliko izmenah dela proizvodnja?' — Ena / Dve / Tri oziroma neprekinjeno / Odvisno od sezone (§4.3 dimenzija 2 'število izmen'; večizmensko podjetje ima 2–3× večjo urno kapaciteto — brez tega plausibility večizmenskim krivično očita pretiravanje; ovojnica naj se množi s faktorjem izmen). KORAK FINANČNE OSNOVE ali vrh P5: (3) ordersPerMonth, number, 'naročil/mesec', privzeto 0, contextOnly: 'Koliko naročil oziroma delovnih nalogov povprečno zaključite na mesec?' — help: 'Groba ocena zadošča.' Uporaba: imenovalec za lateOrdersPerMonth (delež zamud v prodajnem poročilu), navzkrižna preverba z otifLevel iz paketa 7, kalibracijski zapis (lib/exportRecord.ts). Vsa tri vprašanja so odgovorljiva iz glave v 10 sekundah (§19.1 Q-02/Q-03). FORMULA: nobene — imenovalci ne smejo sami ustvarjati zneskov; njihova vloga je verodostojnost (plausibility, ICP, poročilo). PRIKAZ: vsem. PRIORITETA: hitri tok zdaj — directEmployeeCount je najcenejši dvig verodostojnosti celotnega izračuna.

*Sklic na raziskavo: proizvodnja.md §19.1 Q-02/Q-03/Q-06/Q-07, §3.4 (ICP: 'vsaj 10 neposredno proizvodnih zaposlenih'), §4.3 (dimenzija 2); koda: lib/plausibility.ts:18–27, config/contexts/proizvodnja.ts:82–109*

> ℹ️ *Preverba je ugotovitev popravila:* Jedro potrjeno (popis res zastarel; prihodek/marža v kontekstu; noben proizvodni modul ju ne uporablja; plausibility res množi vse zaposlene s 160 h). Trije popravki: (1) trditev, da bi pasovna materialna osnova 'ustvarila znesek tudi tistim, ki P2 ne izberejo', je napačna — moduli, ki niso izbrani, se ne računajo; past velja za tiste, ki P2 IZBEREJO in privzetega 3 % drsnika ne premaknejo. (2) 'ne ujame ničesar' omiljeno v 'prag je preohlapen' — ovojnica obstaja, je le prevelika. (3) Sklici: kontekst 82–109 (ne 69–94), popis vrstica ~101 (ne 99), korak velikosti je StepEmployeeCount.tsx (StepCostBasis.tsx je finančna osnova); dodana izvedbena zahteva, da mora plausibility polja razvrstiti po urni postavki, sicer directEmployeeCount nima kam vstopiti.

### `V-09` · DODAJ · 🔴 visoka

**PAKET 9 — Monetizacija kapacitete (Q-20) in ozko grlo (§6.3) — dve kontekstni vprašanji**

**Ugotovitev.** Kapaciteta je pri tipični poti (Plan + Izmet + Zaloge) daleč največji koš, rezultat pa o njej pove le, da sproščene ure ne pomenijo nižje plačne mase — brez odgovora na direktorjevo naslednje vprašanje: 'in kaj imam od tega?'. Raziskava zahteva, da se prihranek časa ne monetizira, dokler monetizacija ni opredeljena (§2.3), in našteje pet pogojev, kdaj sproščena ura postane marža (§6.3) — kalkulator teh pogojev ne more preveriti, LAHKO pa jih vpraša. Odgovora sta čisti contextOnly: ne spreminjata zneska, polnita pa prodajno poročilo (measured.answers vedno; salesPlaybook.ts:104–115 ju uporabi kot iztočnice, kadar drugih ni) in omogočita, da rezultat kapaciteto vsaj INTERPRETIRA (ob 'odklanjamo naročila' je sproščena ura vredna prispevno maržo — trditev za sestanek, ne za izračun).

**Kaj narediti.** DODAJ V DIAGNOSTIKO (ne 'ali na konec koraka 6' — diagnostika je konkretno mesto: prikaže se vedno, contextOnly polja ne štejejo med manjkajoče podatke in samodejno pridejo v measured.answers prodajnega poročila): (1) capacityConstrained, choice, contextOnly, privzeto 3: 'Ali zaradi zasedenosti proizvodnje kdaj odklonite ali zamaknete naročila?' — Redno, povpraševanje presega kapaciteto (0) / Občasno, ob konicah (1) / Redko (2) / Ne, povpraševanja je prej premalo (3). help: 'Vprašanje ne vpliva na izračun — pove, koliko je sproščena ura dejansko vredna.' (§6.3 pogoja 1–2: proces omejuje IN povpraševanje obstaja). (2) freedCapacityUse, choice, contextOnly, privzeto 4: 'Kaj bi najverjetneje naredili s sproščenimi urami?' — Sprejeli več naročil / Zmanjšali nadure / Zmanjšali delo zunanjih izvajalcev oziroma kooperantov / Prerazporedili na izboljšave in urejanje podatkov / Ne vemo (Q-20; §12.2 Ročno delo: 'manj nadur, manj zunanjih izvajalcev, preprečena zaposlitev ali več throughputa' — nadure in zunanji izvajalci sta trdi monetizaciji, dodatna naročila zahtevajo še pogoje §6.3). UČINEK: (a) rezultat ob kapacitetnem košu izpiše interpretativno vrstico ('Ker naročila redno odklanjate, so te ure vredne vsaj toliko, verjetno pa prispevno maržo dodatnih naročil'); (b) prodajno poročilo dobi odgovor na discovery vprašanje 'Kaj bi se zgodilo s sproščeno kapaciteto?' (§24.5); (c) v prihodnji iteraciji je capacityConstrained=Redno + freedCapacityUse=Več naročil edini par, ki sme odkleniti pretvorbo kapacitete v lostMargin. FORMULA: zdaj nobene — namerno (§12.2: 'Če čas ostane rezerva, poročamo ure, ne evrov'). PRIKAZ: vsem. PRIORITETA: hitri tok zdaj (dve vprašanji, velik dvig verodostojnosti največjega koša).

*Sklic na raziskavo: proizvodnja.md §6.3 (pet pogojev), §2.3, §12.2 (Ročno delo — monetizacija), §19.1 Q-20 ('Kaj bi podjetje naredilo s sproščeno kapaciteto?'), §24.5*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina v celoti potrjena (§6.3 pogoji, Q-20 in §24.5 dobesedno preverjeni; §12.2 celo eksplicitno podpira 'poročamo ure, ne evrov'). Dva popravka: (1) odstranjena alternativa 'na konec koraka 6 ALI v diagnostiko' — razvijalcu se odločitev ne sme prepustiti; konkretizirano na diagnostiko z utemeljitvijo. (2) Preciziran mehanizem playbooka: contextOnly odgovori postanejo iztočnice šele, ko drugih vprašanj ni (fallback na salesPlaybook.ts:106–115), v measured.answers pa pridejo vedno — prvotna formulacija je obljubljala več, kot koda naredi.

### `V-10` · DODAJ · 🟠 srednja

**PAKET 10 — Vir podatka (Q-22) — eno globalno vprašanje namesto podvajanja vprašalnika**

**Ugotovitev.** Raziskava zahteva, da se pri vsakem vhodu zabeleži vir (§12.5: 'ERP poročilo, glavna knjiga, meritev, strokovna ocena, grob razpon ali neznano'; §19.1 Q-22; §19.3 korak 7) — dobesedna izvedba (vir ob vsakem od ~37 polj) bi vprašalnik podvojila in ubila konverzijo, zato je edina izvedljiva pot EN globalni odgovor. Sistem del te informacije že ima: pasovni izbori nosijo izvor in zastavico estimated (contextTypes.ts:176–215, AssumptionSource/CostAssumption), 'Ne vem' odgovori znižujejo zanesljivost — manjka pa vir NUMERIČNIH vnosov (ali je 12.000 EUR odpisov iz glavne knjige ali iz spomina), ki je za prodajnika razlika med številko, ki jo brani, in številko, ki jo preverja. Odgovor gre naravnost v summary.confidence (assessConfidence, lib/potential.ts:132) in v prodajno poročilo (P10/P50 okvir §12.5).

**Kaj narediti.** DODAJ V DIAGNOSTIKO (ob paketu 9, skupaj tri kratka zaključna vprašanja): dataSource, choice, contextOnly, privzeto 2: 'Od kod pretežno izvirajo številke, ki ste jih vnesli?' — Iz ERP-ja oziroma poročil (0) / Iz računovodskih izkazov (1) / Ocena na podlagi izkušenj (2) / Večinoma grobe ocene (3). help: 'Odgovor ne spremeni izračuna — pove le, kako trdna je podlaga. Tudi groba ocena je boljša od neizmerjene težave.' UČINEK: (1) assessConfidence (lib/potential.ts:132) dobi tretji vhod poleg estimated predpostavk in 'Ne vem' odgovorov — vrednosti 2–3 znižata oznako za eno stopnjo, rezultat pa dobi predpono 'najmanj'; ker je polje contextOnly, ga je treba v assessConfidence prebrati izrecno (contextOnly polja so tam sicer namenoma izvzeta). (2) Prodajno poročilo doda vrstico 'Vir številk: ocena iz izkušenj — na sestanku preverite odpise in reklamacije v glavni knjigi', kar prodajnika usmeri v validacijski workshop (§24.2). (3) Izvozni zapis (lib/exportRecord.ts) loči meritve od ocen za kalibracijo naslovljivih deležev in pragov (KALIBRACIJA komentarja v addressableShare.ts:11–12 in modules/shared.ts:24 brez tega ne bosta vedela, katerim vnosom verjeti). ČESAR NE PREDLAGAM: vira po posameznem polju ali modulu — cena v dolžini vprašalnika presega korist, dokler ne obstaja globinski tok (§24.2 napredni audit je pravo mesto za per-postavko vire). PRIKAZ: vsem. PRIORITETA: hitri tok zdaj.

*Sklic na raziskavo: proizvodnja.md §12.5, §19.1 Q-22, §19.3 (korak 7), §24.2; koda: config/contexts/contextTypes.ts:176–215, lib/potential.ts:132, lib/exportRecord.ts*

> ℹ️ *Preverba je ugotovitev popravila:* Vsebina potrjena (§12.5 vire zahteva dobesedno; AssumptionSource v kodi res pokriva samo skupne predpostavke, ne modulskih numeričnih vnosov). Popravki: sklic contextTypes.ts:176–215 (ne 160–163 — tam so definicije chargeOutRate/capitalCostRate); KALIBRACIJA komentarja sta v addressableShare.ts:11–12 in modules/shared.ts:24 (ne contexts/shared.ts); konkretizirano mesto vgradnje (assessConfidence v potential.ts:132) in dodano izvedbeno opozorilo, da assessConfidence contextOnly polja namenoma preskakuje, zato mora dataSource prebrati izrecno.

---

## 9. NE izvajaj — ovržene ugotovitve

Te tri sodbe je preverba ovrgla. Zapisane so zato, da jih kdo ne predlaga znova.

### ❌ V5.1 — Približen polni strošek neposredne proizvodne ure (razponi + privzetek)

**Zakaj je ovrženo.** Ovrženo: ugotovitev cilja na staro oziroma neobstoječe stanje. Vse tri številčne trditve (spodnji pas »Do 30« s sredino 25; fallback 45 EUR/h; 2–3× precenitev) so proti dejanski kodi napačne — obstoječi pasovi in fallback 22 EUR/h so že skladni s slovenskimi stroški dela in z raziskavo, predlagana sprememba pa bi postavke zvišala, ne znižala. Verdikt spremenjen v ohrani, severity znižana.

*Prvotna trditev (napačna): Trditev opisuje stanje, ki v kodi ne obstaja: pasovi so »Do 18« (sredina 16) / »18–25« (21) / »25–33« (29) / »Več kot 33« (38) s fallbackEUR 22 (contexts/proizvodnja.ts:15-20, 67), sidrani na docs/urne-postavke.md (operater 19,9 EUR/h, panožno povprečje predelovalnih dejavnosti 23,6 — komentar v datoteki). Pasu »Do 30« s sredino 25 ni, privzetka 45 EUR/h ni ne v contexts/proizvodnja.ts ne v StepCo*

### ❌ materialWaitingHoursPerMonth — Koliko skupnih človek-ur mesečno proizvodnja čaka samo zaradi manjkajočega materiala?

**Zakaj je ovrženo.** Ovrženo: predlagana izboljšava že obstaja v kodi. Predlog 'help razširi: število zastojev × trajanje × ljudje' skoraj dobesedno ponovi obstoječi explainer (proizvodnja.ts:271–273: 'koliko takih zastojev na mesec × koliko ljudi stoji × koliko ur'), predlagani stavek o Planu pa dobesedno obstaja kot help (:270: 'Zastoje zaradi nejasnega plana štejte v področju Plan, ne tukaj.'). Verdikt spremenjen iz 'izboljsaj' v 'ohrani' — razvijalec ne bi imel česa spremeniti.

*Prvotna trditev (napačna): Razmejitev proti Planu je vzorno izpeljana v obe smeri (help proizvodnja.ts:270 in v planiranju :75) in ustreza kontroli §12.6 'čakanje na material pri planiranju in nabavi'; koš capacity (ne izgubljena marža) je skladen s pravilom o ozkem grlu §6.3. Očitana slabost — da skupnih človek-ur čakanja nihče ne vodi in da §19.3 predpisuje količino dogodkov × čas na dogodek — je v kodi ŽE rešena: explain*

### ❌ Koliko ur mesečno porabite za obveščanje kupcev in usklajevanje zaradi zamud? (customerCommsHoursPerMonth)

**Zakaj je ovrženo.** Ovrženo: predlagana opora za oceno že obstaja v explainerju polja (proizvodnja.ts:502–505), ki ga ugotovitev ni upoštevala; predlog bi vsebino podvojil in vnesel neskladen številčni primer. Napačen je bil tudi sklic help (dejansko proizvodnja.ts:501, ne 470).

*Prvotna trditev (napačna): Ugotovitev trdi, da polju manjka opora za oceno po vzorcu §19.3 (količina × čas na dogodek). To ne drži: polje že ima explainer za gumb "?" (proizvodnja.ts:502–505), ki predpisuje natanko ta vzorec — "Ocenite: koliko zamud na mesec × koliko ur na primer. Primer: 8 zamud × 1,5 h ≈ 12 ur." Meja proti Planu je v help (proizvodnja.ts:501). Predlagani dodatek (15–30 minut na naročilo) bi obstoječi prim*

**Vzorec vseh treh:** koda je bila boljša od spomina — predlagane izboljšave so že obstajale
(explainerji z izpeljavami, usklajeni razponi urnih postavk). Pred vsako spremembo preveri dejansko stanje.

---

## 10. Predlagan vrstni red izvedbe

### Korak 1 — poceni in takoj vidno

Spremembe v eni ali nekaj vrsticah, brez novih zmožnosti motorja:

- premik izgubljene marže v koš `lostMargin` (`Z-06`) — velja tudi za logistiko in storitve
- `scrapSharePercent` privzeto 0, razpon do 30 % (`M-02`)
- nadurni dodatek kot `directLoss` v Planu (`P-03`)
- privzeta triažna izbira `['material','zaloge','zamude']` (`K-11`)
- popravki triažnih lestvic (`K-13`, `K-16`, `H-07`, `H-13`)
- meje v `help` besedilih proti dvojnemu štetju (`M-04`, `M-03`, `P-04`, `P-10`, `H-03`, `H-04`, `H-14`, `H-23`, `H-28`)
- `allowUnknown` na EUR poljih (`M-07`, `H-11`, `H-17`, `H-23`, `H-28`)
- vzrok »Potrjevanje ročno« iz `planning` v `data` (`H-24`)
- popravek zavajajoče opombe pri številu zaposlenih (`K-03`)

### Korak 2 — diagnostika

- pogojno oddajanje ocen tveganja (`Z-08`)
- časovna kotva namesto samoocene pri lastni ceni (`Z-10`)
- recall-drill oblika pri sledljivosti (`Z-11`)
- razdvojitev diagnostike od `reportingTiming` (`Z-09` + `P-11`)
- monetizacija kapacitete in ozko grlo (`V-09`)
- vir podatka — eno globalno vprašanje (`V-10`)

### Korak 3 — kontekst in ICP

- ETO možnost in krmiljenje triaže po proizvodnem modelu (`K-05`)
- planer in lastnik med vlogami (`K-07`)
- kooperanti, izmene, poslovni sprožilec (`K-10`, `K-27`, `Z-17`)
- selitev ZIERDED kljukice med vsem vidna vprašanja (`Z-15`) + `moduleEShown` v ICP (`Z-16`)
- »2016 **ali starejši**« pri obeh strežniških kljukicah (`Z-13`, `Z-14`)

### Korak 4 — nova področja

- neplanirani zastoji in okvare (`V-03`) — ure okvar danes ne padejo nikamor
- lastna cena in pokalkulacija (`V-01`) — največja vsebinska vrzel
- imenovalci: neposredni zaposleni, izmene, št. naročil (`V-08`, `K-04`, `K-26`, `Z-03`, `P-07`, `P-13`)

### Korak 5 — pozneje ali globinski tok

- odprema in OTIF kot razširitev P5 (`V-07`)
- nabava kot kapacitetni modul (`V-06`)
- menjave (`V-02`), kooperantski modul (`V-04`), sledljivost kot EUR-modul (`V-05`) — **teh treh se zdaj ne lotevaj**, razlogi so pri posameznem paketu
