# Priloga: vse ugotovitve pregleda — RAČUNOVODSKI SERVIS

> Dobesedni izvoz vseh 119 sodb obeh valov pregleda, z utemeljitvijo, predlogom, sklicem na raziskavo
> in popravkom skeptične preverbe. Sintetizirano in razvrščeno po prioriteti je v
> `POROCILO-pregled-vprasalnika-racunovodstvo.md` — ta priloga je vir, ne navodilo.
>
> Sklici na vrstice veljajo za commit `ba58fb3` repozitorija
> `/Users/janpavlic/Documents/Datalab/aplikacije/ROI kalkulator`.
>
> Legenda statusa: **potrjeno** = preverba je ugotovitev preverila ob kodi in je ni spreminjala ·
> **popravljeno ob preverbi** = vsebina drži, popravljeni so sklici, predlog ali obseg (popravek je
> naveden na koncu vsake postavke) · **OVRŽENO** = ugotovitev ne drži (v tem pregledu jih ni).


---

# Val 1 — panožni moduli, diagnostika, modul E

## Področje: racunovodstvo — zajemRs (racunovodstvo.ts:47–155) in obracuniRs (racunovodstvo.ts:267–376) — skeptični pregled ugotovitev

### 1. zajemRs triaža: "Koliko dela pri vas še vedno pomeni ročni vnos in prepisovanje listin?"

**Sodba:** IZBOLJŠAJ · **Resnost:** nizka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno: triaža je na racunovodstvo.ts:51–59, možnosti so 0 'Večina se zajame samodejno', 1 'Nekaj ur tedensko', 2 'Vsak dan po več ur', 3 'To je glavnina dela ekipe' — mešanica absolutne (1, 2) in relativne (3) lestvice DRŽI. Drži tudi, da se triažne ocene zapišejo v izvoz (exportRecord.ts:43 in :163, ključ triageScores). Ne drži pa, da je posledica zgolj kalibracijska: triažni odgovori določajo tudi priporočena področja (moduleEngine.ts:193–209), zato sprememba lestvice premakne, katera področja se obiskovalcu ponudijo — zneska res ne premakne (nikjer se triageScore ne množi z EUR). Zato znižujem resnost s srednje na nizko: gre za kozmetiko primerljivosti, ne za napako v denarju.

**Predlog.** Poenoti lestvico na delež dela ekipe, vrednosti ostanejo 0–3 (TriageQuestion): 0 'Skoraj vse se zajame samodejno' · 1 'Manj kot desetina dela ekipe' · 2 'Približno četrtina dela ekipe' · 3 'Glavnina dela ekipe'. Besedilo vprašanja (:52) ostane. Ker se pri istem servisu odgovor lahko premakne za eno stopnjo, preveri, da se ob spremembi ne podre pričakovanje v moduleEngine.test.ts glede priporočenih treh področij (segments.ts:241, recommendedCount 3).

**Sklic na raziskavo:** B03 (14), B04 (13); K03 aktivne minute/dokument

**Popravek preverbe.** Rationale popravljen: triaža ne vpliva samo na kalibracijski izvoz, ampak tudi na izbor priporočenih področij (moduleEngine.ts:193–209); resnost znižana na nizko.


### 2. documentsPerMonth — "Koliko listin skupno mesečno obdelate za vse stranke?"

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno dobesedno: polje je na :62–71, privzetek 0 (:66), help na :67 res našteva 'bančne postavke' med tem, kar se knjiži, explainer na :68–70 res ponuja izpeljavo 'strank × listin na stranko' s primerom 60 × 80 ≈ 4.800. Drži tudi, da enota 'listin/mesec' polja ne uvrsti v preverbo kapacitete (plausibility.ts:61–62 sešteva le 'h/mesec' in 'h/leto'). Drži, da se številka takoj množi s privzetim 0,6 (:79) in gre v postavko 'Ročni vnos listin' (:121–124).

**Predlog.** Help (:67) razširi v: 'Prejeti in izdani računi, bančne postavke, potni nalogi, pogodbe — vse, kar se knjiži. Bančne postavke štejte zraven, a upoštevajte, da so pri naslednjem vprašanju običajno v avtomatskem delu.' Explainer (:68–70) dopolni s kontrolo velikostnega reda: '… Kontrola velikostnega reda: približno število strank × 60–120 listin. Primer: 60 strank × 80 listin ≈ 4.800 listin na mesec.' Izpis izpeljanih ur v živo NE uvajaj tu — to je ena sama sprememba UI, izvedena pri postavki o zmnožku (glej ugotovitev o compute 'Ročni vnos listin'), sicer bi isto besedilo nastalo dvakrat.

**Sklic na raziskavo:** B03 (14), B02 (14); K02 delež strukturiranih vhodov, K03

**Popravek preverbe.** Iz predloga umaknjen tretji del (živi izpis ure/zaposleni), ker podvaja predlog pri postavki o zmnožku; ostalo potrjeno dobesedno.


### 3. manualSharePercent — "Kolikšen delež teh listin je treba vnesti ali prepisati ročno?"

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno in potrjeno: polje na :72–80 nima ne help ne explainer, kind 'percent', default 0,6 (:79). Aritmetika drži: 4.800 × 0,6 × 3/60 = 144 h/mesec; pri fallbackEUR 24 za računovodsko uro (contexts/racunovodstvo.ts:99–105) je 144 × 24 × 12 = 41.472 EUR ≈ 41,5 tisoč EUR/leto. Drži tudi potential.ts:214 (`value > 0 && value !== field.default`) — nedotaknjen privzetek se ne šteje med izpolnjena polja, znesek pa se vseeno prikaže. Drži moduleTypes.ts:160–168 o tem, da 'ne vem' pri deležih ni primeren. Dodatno preverjeno: razponski prikaz (range.ts:93–127) zajame SAMO kontekstne predpostavke (urne postavke, prihodek), privzetkov polj ne — zato razpon te lažne natančnosti ne pokrije.

**Predlog.** Najbolj varna in najmanjša sprememba: `default: 0` (:79) + obvezni par besedil (explainers.test.ts zahteva explainer povsod, kjer je help). help: 'Delež listin, ki jih nekdo dejansko odtipka ali postavko za postavko prekontrolira. E-računi in uvoženi bančni izpiski, ki gredo skozi brez posega, sem ne sodijo.' explainer: 'Vzemite en teden: koliko listin je šlo v knjiženje brez posega in koliko jih je nekdo vnašal ročno. Primer: od 1.200 tedenskih listin je 700 e-računov in izpiskov (avtomatsko), 500 ročnih → delež je približno 40 %.' Če se vseeno odločiš za izbirni razpon (kind 'choice', zaporedni indeksi, tabela deležev po vzoru shared.ts:59 REDUCIBLE_SHARES in shared.ts:97 reducibleShareOf), mora možnost 'Ne vem' dati delež 0 in ne 0,3 — sicer nedotaknjeno polje spet ustvari ~20.700 EUR, ki jih ni potrdil nihče, in popravek reši samo polovico napake. Ob prehodu na 'choice' upoštevaj tudi, da polje izpade iz potential.ts:202 (števec numeričnih polj) in iz salesReport.ts:482–488 (isUntouchedNumeric preskoči 'choice'), zato ga prodajno poročilo ne bo več označilo kot nedotaknjeno.

**Sklic na raziskavo:** K02 delež strukturiranih vhodov (zeleno ≥80 %), K05; B03 (14)

**Popravek preverbe.** Predlog popravljen: varianta 'choice' s privzetkom 'Ne vem' = 0,3 krši isto pravilo, ki ga ugotovitev navaja (znesek brez potrditve) — 'Ne vem' mora dati 0; primarna rešitev je default 0 + help/explainer. Dodano opozorilo na posledice za potential.ts in salesReport.ts.


### 4. minutesPerManualDocument — "Koliko minut v povprečju vzame ena ročno vnesena listina?"

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno: polje na :81–95, kind 'slider', min 0.5, max 15, default 3 (:85–89); help (:90) se res glasi 'Od prejema do knjižene listine. Iskanje manjkajočih listin sem ne sodi — to meri področje Listine strank.'; explainer (:91–94) res našteva 'odpiranje, branje, vnos, kontiranje' in primer 3 oz. 6 minut. Prekrivanje s filingHoursPerMonth (:109–115, skeniranje in razvrščanje) drži: 'od prejema' pri papirni listini vsebuje tudi nesenje k skenerju, meja pa ni zapisana ne tu ne tam. Ne drži pa alternativa iz predloga: privzetka ni mogoče postaviti na 0, ker ima drsnik min 0,5 — 0 bi bila vrednost izven obsega in bi jo widget takoj popravil navzgor. Resnost znižujem na srednjo: sam privzetek 3 minute brez vnesenih listin ne ustvari nobenega zneska (documentsPerMonth ima privzetek 0), zato je edina realna napaka prekrivanje mej.

**Predlog.** help (:90) spremeni v: 'Od trenutka, ko listino odprete, do knjižene postavke. Skeniranje, razvrščanje in arhiviranje merimo posebej v naslednjem vprašanju; iskanje manjkajočih listin meri področje Listine strank.' explainer (:91–94) dopolni: '… odpiranje, branje, vnos, kontiranje — brez skeniranja in odlaganja v arhiv. Izmerite na desetih listinah in vzemite povprečje. Primer: 3 minute pri skeniranem računu, 6 pri papirnem.' Privzetka 3 min ne spreminjaj (drsnik ima min 0,5); tveganje neželenega zneska odpravi popravek pri manualSharePercent (default 0).

**Sklic na raziskavo:** K03 aktivne minute/dokument; B03 (14), B16 (11)

**Popravek preverbe.** Ovržen del predloga 'sicer ga postavi na 0' — drsnik ima min 0,5 (:85), zato je 0 neveljavna vrednost. Resnost znižana z visoke na srednjo, ker polje samo po sebi brez documentsPerMonth ne generira zneska.


### 5. retypingHoursPerMonth — "Koliko ur mesečno porabite samo za prepisovanje istih podatkov med programi (plače, glavna knjiga, poročila, portali)?"

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** potrjeno

**Utemeljitev.** Preverjeno dobesedno in potrjeno: polje na :96–108, enota 'h/mesec', default 0, koš capacity (:126–131); help (:103) se glasi 'Ne vključujte vnosa listin iz zgornjih vprašanj.'; explainer (:104–107) ima primer '2 osebi × 3 h na teden ≈ 26 ur na mesec'. Sosednji reportPrepHoursPerMonth (:289–300) v labelu res omenja 'priprava obračunov in poročil', v explainerju (:298) 'priprava podatkov za oddajo', v helpu (:296) pa samo 'Ne vključujte vnosa listin iz področja Zajem' — meje za prepis v portale ob oddaji ni v NOBENI smeri. Znesek dvojnega štetja: 20 h/mesec × 24 EUR × 12 = 5.760 EUR/leto, torej trditev ~5.800 EUR drži.

**Predlog.** help (:103) spremeni v: 'Ne vključujte vnosa listin iz zgornjih vprašanj in ne ur za obračune in oddaje — te meri področje Obračuni, roki in konice.' explainer (:104–107) dopolni: '… Vnos listin je že v zgornjih vprašanjih, prepis v obračunske obrazce in portale ob oddaji pa v področju Obračuni. Sem sodi prepis, ki ni vezan na rok: iz kadrovske v plače, iz Excela v glavno knjigo, iz e-pošte v evidenco. Primer: 2 osebi × 3 h na teden ≈ 26 ur na mesec.' Vzajemno besedilo obvezno dodaj tudi pri reportPrepHoursPerMonth (glej ločeno postavko) — enostransko zapisana meja je po opombi v datoteki (:13–15) enaka nezapisani.

**Sklic na raziskavo:** B03 (14), B21 (10), B11 (12); K03


### 6. filingHoursPerMonth — "Koliko ur mesečno porabite za skeniranje, razvrščanje in arhiviranje listin?"

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** potrjeno

**Utemeljitev.** Preverjeno: polje na :109–115 res nima ne help ne explainer, enota 'h/mesec', default 0, koš capacity (:139–144). Drži tudi sklic na načelo v glavi datoteke (:13–15: 'Ista ura ali evro se ne sme pojaviti v dveh področjih. Meje so zapisane v besedilih help …'). Drži, da imata obe sosednji polji (minutesPerManualDocument, retypingHoursPerMonth) explainer, to pa ne. Izpeljava 1 oseba × 4 h/teden × 4,3 ≈ 17 ur je pravilna.

**Predlog.** Dodaj help: 'Samo delo z listino kot papirjem ali datoteko — skeniranje, preimenovanje, razvrščanje v mape, fizični arhiv. Minute na listino iz zgornjega vprašanja tega ne vključujejo.' In (obvezno, ker explainers.test.ts zahteva explainer ob vsakem help) explainer: 'Šteje se čas, ki ne prinese knjižbe: nesenje k skenerju, skeniranje, poimenovanje datotek, vlaganje v registrator, letno urejanje arhiva. Ocenite: koliko ur na teden × 4,3. Primer: 1 oseba × 4 h na teden ≈ 17 ur na mesec.'

**Sklic na raziskavo:** B16 podvojeni dokumenti (11), B03 (14); K03


### 7. zajemRs mainCause — "Kaj je glavni vzrok?" (ZAJEM_CAUSES, racunovodstvo.ts:39–45)

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno: ZAJEM_CAUSES so na :39–45 in se glasijo 'Listine prihajajo v papirni ali slikovni obliki' (data), 'Nimamo samodejnega zajema e-računov in bančnih izpiskov' (data), 'Podatke vodimo v več ločenih programih' (data), 'Stranke oddajajo listine neurejeno' (external), 'Delo ni standardizirano oziroma enakomerno razporejeno' (people). Deleži v addressableShare.ts:28–35 (data 0,75, planning 0,65, people 0,45, external 0,25, unknown 0,3) in zaporedni indeksi (addressableShare.ts:49–60) so potrjeni; 0,25→0,75 je res trikratnik. Potrjeno tudi, da je 'Ne vemo' zadnja in privzeta (addressableShare.ts:46–47). NE potrdim pa predlagane prekvalifikacije kanala oddaje v 'data' 0,75: to je poteza, ki znesek potroji na podlagi trditve, da servis kanal obvladuje — v resnici je odvisna od tega, ali stranke kanal sprejmejo, kar je natanko mejni primer. Predlog v tej obliki pomika denar navzgor brez dokaza; hkrati se prekriva s STRANKE_CAUSES ('Stranke nimajo enotnega načina oddaje listin', :150+), kar mejo med področjema zamegli.

**Predlog.** Skrči na štiri vzroke + 'Ne vemo': 'Listine prihajajo v papirju ali kot slike, brez e-računov in samodejnih izpiskov' (data 0,75 — združi današnja prva dva, ki sta isti vzrok povedan dvakrat) · 'Podatke vodimo v več ločenih programih' (data 0,75) · 'Stranke nimajo enotnega kanala za oddajo listin' (planning 0,65 — kanal postavi servis, sprejem pa je odvisen od strank; 0,75 bi bila neupravičena) · 'Stranke oddajajo listine prepozno' (external 0,25) · 'Delo ni standardizirano med zaposlenimi' (people 0,45). Vrednosti ostanejo zaporedni indeksi, 'Ne vemo' zadnja in privzeta. Ločnico 'format in kanal = naslovljivo, rok = zunanje' zapiši dobesedno enako tudi v OBRACUNI_CAUSES. Ker gre za spremembo naslovljivega deleža, jo označi kot kalibracijsko (opomba v addressableShare.ts:11–12).

**Sklic na raziskavo:** B01 (14), B02 (14), B23 (10); §9.1 funkcionalni fit

**Popravek preverbe.** Predlagana kategorija za 'enoten kanal oddaje' popravljena iz data 0,75 v planning 0,65 — 0,75 bi znesek potrojila na podlagi nedokazane trditve, da servis kanal v celoti obvladuje. Resnost znižana z visoke na srednjo (gre za kalibracijo deležev, ne za napako v formuli).


### 8. DODAJ v zajemRs: "Koliko strank redno vodite?" (contextOnly)

**Sodba:** DODAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Delno drži. Res je, da števila vseh strank nikjer ne shranimo — grep najde le belowCostClients (:521) in declinedClientsPerYear (:558). Ugotovitev pa spregleda, da donosnostRs ŽE ima kontekstno polje hoursPerClientPerMonth (:546–556, contextOnly, default 8), katerega explainer obiskovalca izrecno vodi 'skupne mesečne ure vseh zaposlenih delite s številom strank' — imenovalec naslovne številke torej obstaja, manjka le baza za relativni prikaz. Potrjeno je, da naslovno številko izpisuje ResultsView.tsx:86–87 ('+{accountingCapacity.toFixed(1)} strank brez nove zaposlitve') iz CalculatorFlow.tsx:272–279, in da contextOnly polja res izpadejo iz plausibility.ts:58 in potential.ts:192 ter se pojavijo v prodajni pripravi (salesReport.ts:410, salesPlaybook.ts:104–115). Šibka točka predloga: polje v zajemRs se vpraša SAMO, če obiskovalec to področje izbere v triaži — naslovna številka pa se izpiše vedno, zato bi relativni prikaz pri polovici obiskovalcev odpadel.

**Predlog.** Polje dodaj, a ne v zajemRs: uvrsti ga med segmentna kontekstna vprašanja računovodstva (config/contexts/racunovodstvo.ts, ob operationalHour/adminHour), da je na voljo ne glede na izbrana področja — enako kot employeeCount (types.ts:5). Besedilo: 'Koliko strank redno vodite?', enota 'strank', privzetek 0 (0 = ni podatka, brez izpisa), help: 'Podatek ne vstopa v izračun — z njim preverimo velikostni red listin in koliko rasti pomeni sproščen čas.', explainer: 'Štejte stranke z rednim mesečnim obračunom; enkratne storitve izpustite. Primer: 60 strank × 80 listin ≈ 4.800 listin na mesec.' Če se kljub temu odločiš za polje v modulu, ga postavi v donosnostRs tik pred hoursPerClientPerMonth (:546), kjer je vsebinsko doma, in ga označi contextOnly: true. Relativni izpis '+X strank (pribl. Y % vaše današnje baze)' prikaži samo, kadar je vrednost > 0.

**Sklic na raziskavo:** K18 sprejetje strank, K12 prihodek/FTE (87.689 EUR), K11; B08 (12)

**Popravek preverbe.** Rationale dopolnjen z obstoječim poljem donosnostRs.hoursPerClientPerMonth (:546–556), ki ga ugotovitev ni upoštevala. Umestitev premaknjena iz zajemRs v segmentni kontekst (oz. donosnostRs), ker se modulska polja vprašajo le ob izbiri področja, naslovna številka pa se izpiše vedno. Resnost znižana na srednjo.


### 9. zajemRs compute → postavka "Ročni vnos listin" kot zmnožek documentsPerMonth × manualSharePercent × minutesPerManualDocument (racunovodstvo.ts:121–124)

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno in potrjeno v celoti: plausibility.ts:54–64 sešteva izključno vnesena polja z enoto 'h/mesec' oz. 'h/leto', izpeljanih ur torej ne vidi; HOURS_PER_EMPLOYEE_PER_MONTH = 160 (plausibility.ts:18) in PLAUSIBLE_CAPACITY_SHARE = 0,4 (:27), zato pri treh zaposlenih (480 h) 111 vnesenih ur pomeni 23 % (brez opozorila), z izpeljanimi 144 pa 53 % (opozorilo bi se moralo sprožiti). Potrjeno tudi potential.ts:191–215 (tri polja štejejo enakovredno) in multiplikativno kopičenje napake. Delno pa ne drži tretji del predloga: prodajno poročilo nedotaknjena številska polja ŽE zbira (salesReport.ts:310 in :500, isUntouchedNumeric :482–488) in jih salesPlaybook.ts:97–102 spremeni v vprašanja za sestanek — manjka le oznaka ob sami postavki 'Ročni vnos listin'.

**Predlog.** (1) plausibility.ts: k vnesenim uram prištej tudi izpeljane, brez dvojnega štetja — za vsako področje, katerega compute() vrne kateri koli izid s hoursPerMonth (moduleTypes.ts:186, moduleEngine.ts:65–67), uporabi vsoto teh ur; za področja brez takih izidov ostane današnje seštevanje po enotah. Ohrani izločanje contextOnly (:58) in 'Ne vem' (:60) ter posodobi plausibility.test.ts:74–82, ki danes trdi, da so vsa urna polja pokrita z enotama. (2) Pod tretjim poljem zajemRs izpiši izpeljano vrednost v živo: 'Iz vaših odgovorov: 144 h/mesec ≈ 0,9 zaposlenega (160 h)' — obiskovalec zmnožek potrdi ali popravi, preden vidi EUR. (3) V salesReport.ts postavko 'Ročni vnos listin' poveži z že obstoječim seznamom untouchedFields, da je ob njej zapisano, katera množitelja sta ostala na privzetku — nov mehanizem ni potreben.

**Sklic na raziskavo:** §9.1 finančni model (bruto ure = dokumenti × ročni delež × minute/60), §4.4

**Popravek preverbe.** Tretji del predloga popravljen: zaznavanje nedotaknjenih polj v prodajnem poročilu že obstaja (salesReport.ts:310, :482–488, salesPlaybook.ts:97–102), zato gre le za povezavo z obstoječim seznamom. Prvi del konkretiziran tako, da ne pride do dvojnega štetja (ure iz izidov ALI iz enot, ne oboje) in z opozorilom na plausibility.test.ts:74–82.


### 10. Naslovna številka "+X strank brez nove zaposlitve" iz surovih ur obeh modulov

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Jedro drži: aggregateBuckets (moduleEngine.ts:65–68) sešteje output.hoursPerMonth brez naslovljivega deleža, CalculatorFlow.tsx:272–279 pa te surove ure predaja naprej — ure iz zajemRs (:129, :136, :143) in obracuniRs (:345, :352) vstopijo pri 100 %, mimo deleža 0,25–0,75 in mimo pasu izboljšave, ki ju isti moduli za EUR upoštevajo. NE drži pa, da se delijo z 8: delitelj je obiskovalčev donosnostRs.hoursPerClientPerMonth (:546–556), 8 je zgolj rezerva iz segments.ts:246, kadar področje Neobračunano delo ni izbrano (calculations.ts:72–77 delitelja ne določa). Dodatna napaka, ki je ugotovitev ne omenja: ResultsView.tsx:87 izpiše .toFixed(1), torej '+18,0 strank' — decimalka je sama po sebi lažna natančnost, enako v pdf.ts:257–264.

**Predlog.** (1) V BucketTotals (moduleEngine.ts:35–45) dodaj addressableCapacityHoursPerMonth in ga polni kot `(output.hoursPerMonth ?? 0) * (output.addressableShare ?? 1)` (moduleEngine.ts:65–68). (2) Nanj uveljavi pas izboljšave po istem vzorcu kot pri EUR (potential.ts), da nastane par min/max ur. (3) CalculatorFlow.tsx:272–279 naj kliče calculateAccountingCapacity dvakrat (min in max) z istim deliteljem kot danes. (4) ResultsView.tsx:86–87 in pdf.ts:257–264 izpišeta CELO število kot razpon: '+4 do +9 strank brez nove zaposlitve', pod njim pojasnilo 'Izračunano iz naslovljivih ur po vašem glavnem vzroku, ne iz vseh vnesenih ur.' (5) Posodobi calculations.test.ts:84 in moduleEngine.test.ts.

**Sklic na raziskavo:** §9.1 (naslovljive ure = bruto × rešljiv delež × fit × sprejetje), §4.4

**Popravek preverbe.** Popravljen napačen sklic: ure se ne delijo z 8, ampak z donosnostRs.hoursPerClientPerMonth (racunovodstvo.ts:546–556), 8 je le rezerva iz segments.ts:246. Dodana neopažena napaka: .toFixed(1) v ResultsView.tsx:87 in pdf.ts:257–264. Predlog razširjen s seznamom datotek in testov.


### 11. obracuniRs triaža: "Kako pogosto se obračuni in oddaje rešujejo v zadnjem trenutku?"

**Sodba:** OHRANI · **Resnost:** nizka · **Status:** potrjeno

**Utemeljitev.** Preverjeno dobesedno na :271–279: možnosti so 'Roke držimo brez konic' · 'Nekajkrat letno' · 'Vsak mesec ob DDV in plačah' · 'Skoraj vedno'. Lestvica je dosledno frekvenčna, neodvisna od velikosti servisa in odgovorljiva iz glave; dogodka DDV in plače pozna vsak servis. Trditev ugotovitve drži v celoti, vključno s primerjavo z zajemRs triažo.

**Sklic na raziskavo:** B15 (11), B01 (14); K07 dnevi do mesečnega zaključka


### 12. overtimeHoursPerMonth — "Koliko nadur mesečno v povprečju nastane zaradi konic ob obračunih in rokih (DDV, plače, zaključni računi)?"

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno: polje na :281–288 res nima ne help ne explainer, enota 'h/mesec', default 0; postavka je v košu capacity (:341–349). Znesek dvojnega štetja s sosednjim reportPrepHoursPerMonth: 25 h × 24 EUR × 12 = 7.200 EUR/leto — drži. NE drži pa očitek, da modul o naravi nadure molči: komentar nad postavko (:341–344) izrecno pove 'Nadura je izplačana, a v koš capacity: tudi urejen servis dela enak obseg dela, le brez konice. Prihranek ni odpuščanje, ampak razporeditev.' Ugotovitev torej opisuje kot manjkajoče nekaj, kar v kodi obstaja — ostane le manjkajoča meja v besedilih polja. Zadnji del predloga (obravnava v naslovni številki) je ista sprememba kot pri postavki o naslovni številki in se tu ne izvaja posebej.

**Predlog.** Dodaj help: 'Samo ure zunaj rednega delovnega časa. Če ste te ure že vpisali pri ročni pripravi obračunov v naslednjem vprašanju, jih tu ne ponavljajte.' In explainer: 'Ure, ki jih ekipa ob roku naredi zvečer, ob koncu tedna ali čez dopust. Ocenite: koliko ljudi × koliko ur v konici × kolikokrat na mesec. Primer: 3 osebe × 4 h × 2 konici ≈ 24 ur na mesec. Redno delo znotraj delovnika sodi v naslednje vprašanje.' Vzajemno mejo zapiši še pri reportPrepHoursPerMonth. Obravnave v naslovni številki tu ne spreminjaj — to pokriva ločena postavka o naslovni številki.

**Sklic na raziskavo:** B15 (11), B14 (11), B19 (11); §4.4 (prihranjene ure niso denar)

**Popravek preverbe.** Rationale popravljen: utemeljitev, zakaj je nadura v košu capacity in ne izplačilo, v kodi ŽE obstaja (komentar racunovodstvo.ts:341–344), zato 'vsebinsko globlja težava' ni odprta. Iz predloga umaknjen del o naslovni številki (podvaja ločeno postavko); resnost znižana na srednjo.


### 13. reportPrepHoursPerMonth — "Koliko ur mesečno porabite za ročno pripravo obračunov in poročil …?"

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno in potrjeno: polje na :289–300 s help (:296) in explainer (:297–299); analitikaHz ima polje z ISTIM ključem reportPrepHoursPerMonth (horizontal.ts:51–61), prav tako enota 'h/mesec' in koš capacity, ovrednoteno po adminHourCostEUR (horizontal.ts:94) proti operationalHourCostEUR tukaj (:338). Potrjeno tudi, da je analitikaHz res del segmenta racunovodstvo (segments.ts:233), da je sosedovo besedilo splošno ('Ure, ki ste jih že vpisali v drugem področju, tu ne ponavljajte', horizontal.ts:56) in da tukajšnji help omenja le Zajem. Tehnične kolizije res ni (vrednosti so po ID modula). Manjka tudi meja proti retypingHoursPerMonth.

**Predlog.** help (:296) spremeni v: 'Samo obračuni in poročila za stranke in državo. Vnos listin in prepis med programi merita vprašanji v področju Zajem, poročila za vaše vodstvo in lastnike pa področje Analitika in poročanje.' explainer (:297–299) dopolni: '… priprava podatkov za oddajo. Poročila, ki jih delate zase (donosnost strank, zasedenost ekipe), sodijo v Analitika in poročanje. Primer: 2 osebi × 8 h ob koncu meseca ≈ 16 ur.' Hkrati zaostri tudi horizontal.ts:56 v: 'Poročila za vodstvo in lastnike. Obračuni in poročila za stranke in državo so v področju Obračuni, roki in konice.' Ključ preimenuj, a NE v 'filingPrepHoursPerMonth': 'filing' v tem modulu že pomeni arhiviranje (zajemRs.filingHoursPerMonth, :110) in dve pomeni iste besede bi ustvarili novo zmedo — uporabi 'closingPrepHoursPerMonth'. Posodobi racunovodstvo.test.ts:111 (drugih sklicev na ta ključ v racunovodstvu ni; horizontal.test.ts:50, :215–216, :228 se nanaša na analitikaHz in ostane).

**Sklic na raziskavo:** B11 (12), B05 (13); K07 dnevi do mesečnega zaključka

**Popravek preverbe.** Predlagano novo ime ključa popravljeno iz 'filingPrepHoursPerMonth' v 'closingPrepHoursPerMonth' — 'filing' je v istem segmentu že zasedeno z arhiviranjem (racunovodstvo.ts:110). Dodana zahteva po zaostritvi nasprotne strani (horizontal.ts:56) in natančen seznam testov.


### 14. externalHelpCostEUR — "Koliko ste v zadnjih 12 mesecih porabili za zunanjo pomoč, študentsko delo ali podizvajalce v konicah?"

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** potrjeno

**Utemeljitev.** Preverjeno in potrjeno: polje na :301–308 nima ne help ne explainer, enota 'EUR/leto', default 0; postavka gre v koš directLoss (:355–360) in se v compute res NE množi z MONTHS_PER_YEAR. allowUnknown ni nastavljen, primer iz moduleTypes.ts:160–168 ('zneski, ki jih podjetje bodisi vodi bodisi ne') pa se prilega natanko temu polju; brez njega se 'ne vem' tiho sešteje kot potrjena ničla (moduleTypes.ts:38–51). Nevarnost, da servis vpiše trajno zunanje izvajanje plač, je realna — edina omejitev je danes besedna zveza 'v konicah' v vprašanju.

**Predlog.** Dodaj allowUnknown: true, help: 'Samo pomoč, ki jo najamete zaradi konic ali odsotnosti. Delo, ki ga trajno opravlja zunanji izvajalec (npr. plače vseh strank), sem ne sodi — to je vaša nabavna odločitev in ne posledica konice.' In explainer: 'Seštejte račune študentskega servisa, honorarce in podizvajalce zadnjih 12 mesecev, ki ste jih vključili zaradi roka ali odsotnosti. Če take pomoči nimate, vpišite 0; če zneska nimate pri roki, izberite Ne vem. Primer: 2 študenta × 3 mesece × 900 EUR ≈ 5.400 EUR.'

**Sklic na raziskavo:** B14 (11), B13 (11); K12 prihodek/FTE, K13 stroški dela/FTE (40.700 EUR)


### 15. latePenaltyCostEUR — "Kolikšni so bili v zadnjih 12 mesecih stroški glob in zamudnih obresti zaradi prepozno oddanih obračunov?"

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** potrjeno

**Utemeljitev.** Preverjeno dobesedno: help (:316) se glasi 'Samo posledice ZAMUDE. Doplačila zaradi napačne vsebine meri področje Napake in popravki.', nasprotna stran (popravkiRs.selfReportCostEUR, :428) pa 'Globe zaradi prepozne oddaje meri področje Obračuni, ne to.' — meja je res zapisana v obeh smereh in jo je treba ohraniti. Potrjena sta tudi oba očitka: explainer (:317–319) v isto polje uvršča 'doplačila za nujno urejanje', kar je isti denar kot externalHelpCostEUR dve polji višje (:301–308), in navodilo 'če jih ni bilo, vpišite 0' zliva odsotnost z nevednostjo (moduleTypes.ts:38–51).

**Predlog.** Dodaj allowUnknown: true. Explainer (:317–319) popravi v: 'Samo posledice ZAMUDE pri oddaji: globe FURS, zamudne obresti, stroški naknadnih obračunov. Plačila zunanji pomoči, da ste rok ujeli, so že v prejšnjem vprašanju. Seštejte zadnjih 12 mesecev; če glob ni bilo, vpišite 0, če zneska ne poznate, izberite Ne vem.' Help (:316) pusti nespremenjen — usklajen je s popravkiRs (:428) in bi ga sprememba razdvojila.

**Sklic na raziskavo:** B05 (13), B20 (11); K08 naloge po roku (<2 %), K09


### 16. closingProcess — "Kako pripravljate mesečne obračune?" (contextOnly, 4 možnosti)

**Sodba:** IZBOLJŠAJ · **Resnost:** nizka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno: polje na :321–333, kind 'choice', default 2, contextOnly: true; v prodajni pripravi res nastopa šele kot rezervno vprašanje, ko drugih iztočnic ni (salesPlaybook.ts:104–115), v poročilu pa kot kontekstna vrstica (salesReport.ts:407–413). Prekrivanje z vzrokom 'Obračuni in poročila se sestavljajo ročno' (:261) drži. Ugotovitev pravilno upošteva, da polje polni prodajno poročilo, in ga zato ne odstranjuje, ampak zamenjuje — to je skladno s pravilom za contextOnly polja. Nižam resnost na nizko: gre za zamenjavo enega kontekstnega vprašanja z boljšim, brez vpliva na kateri koli znesek (potrjeno z racunovodstvo.test.ts:260–264, kjer sprememba closingProcess ne sme premakniti izida).

**Predlog.** Zamenjaj polje z lestvico K07: key 'daysToMonthlyClose', label 'Koliko delovnih dni po koncu meseca imate zaključene obračune za vse stranke?', kind 'choice', contextOnly: true, default = 4 ('Ne merimo'), možnosti 0 'Do 5 dni' · 1 '6–10 dni' · 2 '11–15 dni' · 3 'Več kot 15 dni' · 4 'Ne merimo'. Namerno izbira in ne število: privzetek 0 pri številu dni bi pomenil najboljši možni rezultat. help: 'Podatek ne vstopa v izračun — pokaže, koliko rezerve imate do roka.' explainer: 'Šteje zadnja stranka, ne prva: dan, ko so vsi obračuni oddani. Primer: če DDV oddajate 18. v mesecu in zadnje stranke zaključite 16., je to približno 11 delovnih dni.' Zastavice unknown: true NE dodajaj — pri contextOnly polju je brez učinka, ker potential.ts:192 tako polje preskoči, še preden pride do štetja neznanih odgovorov (:195–199). Obvezno posodobi racunovodstvo.test.ts:261–263, ki danes uporablja closingProcess kot dokaz, da kontekstna polja ne premikajo izida.

**Sklic na raziskavo:** K07 dnevi do mesečnega zaključka (§8.1); B05 (13), B12 (11)

**Popravek preverbe.** Iz predloga umaknjen 'unknown: true' — pri contextOnly polju je mrtva črka (potential.ts:192 polje preskoči pred vejo za 'choice'). Dodana obvezna posodobitev racunovodstvo.test.ts:261–263. Resnost znižana na nizko.


### 17. obracuniRs mainCause — "Kaj je glavni vzrok?" (OBRACUNI_CAUSES, racunovodstvo.ts:259–265)

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno dobesedno: OBRACUNI_CAUSES so 'Podatki niso pripravljeni pravočasno' (planning), 'Obračuni in poročila se sestavljajo ročno' (data), 'Delo ni enakomerno razporejeno čez mesec' (planning), 'Stranke oddajo listine prepozno' (external), 'Premalo ljudi za obseg dela' (people). Razmerje 0,65 : 0,25 = 2,6× med prvo in četrto možnostjo drži (addressableShare.ts:28–35). Prekrivanje prve in tretje možnosti (obe planning, isti delež) je res nenevarno, prekrivanje prve in četrte pa je resnično: pri servisu je 'podatki niso pripravljeni' skoraj vedno posledica strank, torej isti dogodek z dveh zornih kotov.

**Predlog.** Preoblikuj v pet vzajemno izključujočih možnosti + 'Ne vemo': 'Obračuni in poročila se sestavljajo ročno' (data 0,75) · 'Podatki so v več programih in jih je treba združiti' (data 0,75) · 'Delo ni enakomerno razporejeno čez mesec' (planning 0,65) · 'Stranke oddajo listine prepozno' (external 0,25) · 'Premalo ljudi za obseg dela' (people 0,45); možnost 'Podatki niso pripravljeni pravočasno' odstrani. Vrednosti ostanejo zaporedni indeksi, 'Ne vemo' zadnja in privzeta. POZOR na test: racunovodstvo.test.ts:109–131 uporablja mainCause: 0 s komentarjem '→ planning' in preverja `addressableShare === ADDRESSABLE_SHARE.planning` (:130); po prerazvrstitvi postane indeks 0 kategorija data, zato je treba test popraviti (bodisi mainCause: 2, bodisi pričakovanje ADDRESSABLE_SHARE.data). Ločnico 'format in kanal = naslovljivo, rok = zunanje' uporabi enako kot v ZAJEM_CAUSES.

**Sklic na raziskavo:** B01 (14), B04 (13); §9.1 rešljiv delež

**Popravek preverbe.** Predlogu dodana nujna posodobitev racunovodstvo.test.ts:109–131, ki jo ugotovitev spregleda: test se opira na mainCause: 0 = planning in bi po prerazvrstitvi padel.


### 18. DODAJ v obracuniRs: "Kako poravnate nadure?" (contextOnly)

**Sodba:** DODAJ · **Resnost:** nizka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Delno drži. Res je, da polja o načinu poravnave nadur ni in da bi prodajniku pomagalo. Ne drži pa, da 'mi ne moremo trditi ne enega ne drugega': modul svojo odločitev že utemelji v kodi (komentar :341–344 — nadura ostane v košu capacity, ker urejen servis opravi enak obseg dela brez konice), izračun pa se ob odgovoru sploh ne spremeni, kar priznava tudi sam predlagani explainer. Vrednost polja je torej izključno prodajna, ne metodološka — zato resnost s srednje na nizko. Shema je spoštovana: contextOnly, zaporedni indeksi, brez showIf, vprašanje je odgovorljivo iz glave v nekaj sekundah in ne podvaja nobenega obstoječega polja.

**Predlog.** Novo polje takoj za overtimeHoursPerMonth: key 'overtimePayout', label 'Kako poravnate nadure?', kind 'choice', contextOnly: true, default 2, možnosti 0 'Izplačamo z dodatkom' · 1 'Nadomestimo s prostim časom' · 2 'Kombinirano' · 3 'Nadur nimamo'. help: 'Podatek ne vstopa v izračun — pove, ali so nadure za vas strošek ali prerazporejen čas.' explainer: 'Če nadure izplačate, je del konice trdi denar; če jih nadomestite s prostim časom, se pokaže kot manjša razpoložljiva kapaciteta. Izračun je v obeh primerih enak — čas vrednotimo po vašem strošku ure in ne obljubljamo prihranka pri plačah.' Uvedi ga v paru z zamenjavo closingProcess (prejšnja postavka), da število vprašanj v obracuniRs naraste kvečjemu za eno (danes 6 s poljem glavnega vzroka). Vrednost izpiši v prodajni pripravi ob postavki nadur (salesReport.ts:407–413 kontekstna vrstica že obstaja, dodatna koda ni potrebna).

**Sklic na raziskavo:** §4.4 (prihranjene ure ≠ denar); B15 (11), B14 (11)

**Popravek preverbe.** Rationale popravljen: metodološka odločitev o nadurah je v kodi že zapisana in utemeljena (racunovodstvo.ts:341–344), zato polje ni pogoj za pravilnost izračuna, ampak zgolj prodajni kontekst — resnost znižana na nizko in dodan pogoj, da se uvede v paru z zamenjavo closingProcess, da se dolžina vprašalnika ne poveča.


## Področje: racunovodstvo — strankeRs (src/config/modules/racunovodstvo.ts:157–255) in donosnostRs (src/config/modules/racunovodstvo.ts:484–596), po skeptičnem preverjanju v kodi

### 19. strankeRs triaža: „Koliko časa porabite za lovljenje listin in odgovarjanje strankam?" (racunovodstvo.ts:171–179)

**Sodba:** IZBOLJŠAJ · **Resnost:** nizka · **Status:** potrjeno

**Utemeljitev.** Preverjeno dobesedno in drži. Poziv na :172 imenuje dve stvari, vse štiri možnosti (:174–177) pa opisujejo samo oddajo listin. Ocena triaže res pride v poročilo kot par bolečina : izmerjeno (salesReport.ts:316–324, polji score/scoreLabel in measured) in v prodajna vprašanja za neizmerjena boleča področja (salesPlaybook.ts:83–88, prag score >= 2). Servis, ki listine dobiva urejeno, a mu stranke ves dan pišejo o saldih, izbere 0 in polje inquiryHoursPerMonth (:189) v triažo ne pride. Posledica je res mehka, ker izbor področij obiskovalec lahko povozi ročno.

**Predlog.** Ohrani poziv, dopolni možnosti tako, da pokrijejo obe merjeni postavki: 0 „Stranke oddajajo pravočasno in urejeno, vprašanj je malo"; 1 „Občasno je treba opomniti ali kaj pojasniti"; 2 „Vsak mesec veliko usklajevanja in ponavljajočih se vprašanj"; 3 „Lovljenje listin in odgovarjanje strankam sta stalnica". Vrednosti 0–3 ostanejo, tip TriageQuestion (moduleTypes.ts:209–213) zahteva natanko štiri možnosti — to je izpolnjeno.

**Sklic na raziskavo:** B01 (14), B02 (14), B06 (13), B17 (11) · §7.1

**Popravek preverbe.** Brez popravka. Vsi sklici (racunovodstvo.ts:171–179, salesReport.ts:316–324, salesPlaybook.ts:83–88) so preverjeni in točni.


### 20. chasingHoursPerMonth — „Koliko ur mesečno porabite za opominjanje strank in lovljenje manjkajočih listin?" (racunovodstvo.ts:182–187)

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno in drži v celoti. Polje :182–187 nima ne help ne explainer (edino tako polje z denarnim učinkom v obeh modulih), množi se z operationalHourCostEUR × 12 (:235, fallback 24 EUR v contexts/racunovodstvo.ts:104) in gre s hoursPerMonth (:236) surovo v capacityHoursPerMonth (moduleEngine.ts:65–67), torej v delitelja naslova „+X strank". Meja proti sosedu je res zapisana samo z druge strani (zajemRs, :90, pri polju minutesPerManualDocument), nazaj proti zajemRs in donosnostRs pa nič. Izpeljava „dogodki × minute" res manjka tu in stoji pomotoma pri naslednjem polju (:196–198). Test explainers.test.ts zahteva: kjer je help, mora biti explainer, dolžina 41–600 znakov, explainer ne sme biti kopija helpa — predlog to izpolnjuje.

**Predlog.** Ključ, kind, unit in default 0 ostanejo. help: „Samo lovljenje listin: opomniki, klici, čakanje na manjkajoče. Vnos in knjiženje listin meri področje Zajem listin, neobračunano svetovanje pa področje Neobračunano delo." explainer (preseli besedilo, ki je danes pri inquiryHoursPerMonth, in ga dopolni): „Ure za lovljenje manjkajočih listin: klici, e-pošta, opomniki. Ocenite prek dogodkov — koliko strank je treba mesečno loviti × kolikokrat × koliko minut. Primer: 15 strank od 60 × 2 posredovanji × 15 min ≈ 8 ur na mesec. Vrednotimo jih po strošku računovodske ure, ki ste ga vpisali v skupni finančni osnovi, ne po ceni, ki jo zaračunate stranki."

**Sklic na raziskavo:** B06 (13), B01 (14) · K10 (ure opominjanja/mesec) · §7.1, §8.1

**Popravek preverbe.** Iz explainerja sem izbrisal navedbo „(npr. 24 EUR)" in jo nadomestil s sklicem na postavko, ki jo je obiskovalec vpisal v skupni finančni osnovi: 24 EUR je zgolj fallback (contexts/racunovodstvo.ts:104) in bi si nasprotoval z uporabnikovim lastnim vnosom. Sicer ugotovitev potrjena brez sprememb.


### 21. inquiryHoursPerMonth — „Koliko ur mesečno porabite za odgovarjanje na ponavljajoča se vprašanja strank …?" (racunovodstvo.ts:189–199)

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno dobesedno: explainer na :196–198 se glasi „Ure za lovljenje manjkajočih listin in pojasnil: klici, e-pošta, opomniki strankam. Primer: pri 15 strankah od 60 je treba mesečno posredovati × 30 min ≈ 8 ur" — to je definicija chasingHoursPerMonth (:183), ne odgovarjanja na vprašanja o stanju. Polje je vrednoteno po adminHourCostEUR (:244; fallback 30 EUR, contexts/racunovodstvo.ts:115), torej podvojena ura pride v znesek po višji postavki. help na :195 („Svetovanje sem ne sodi — neobračunano svetovanje meri področje Neobračunano delo") je pravilen in naj ostane. plausibility.ts to res ujame le posredno: sešteva vsa polja z enoto h/mesec in h/leto (plausibility.ts:61–62) in opozori šele nad 40 % kapacitete (PLAUSIBLE_CAPACITY_SHARE = 0.4, plausibility.ts:27).

**Predlog.** Zamenjaj explainer, da opisuje TO polje: „Vprašanja, na katera bi stranka odgovor našla sama, če bi imela vpogled: saldo, odprte postavke, rok plačila, kje je dokument. Ocenite prek dogodkov — koliko takih vprašanj na teden × povprečne minute. Primer: 20 vprašanj na teden × 10 min ≈ 3,3 h na teden ≈ 14 ur na mesec. Ker na vsebinsko vprašanje odgovori izkušen računovodja, te ure vrednotimo po vodstveni oziroma strokovni uri iz skupne finančne osnove." help razširi v obe smeri: „Samo odgovori o stanju in statusih. Lovljenje manjkajočih listin meri prejšnje vprašanje, neobračunano svetovanje pa področje Neobračunano delo."

**Sklic na raziskavo:** B17 (11), B23 (10), B19 (11) · K16 (odzivni čas) · §7.1, §8.1

**Popravek preverbe.** Dodal sem točen prag plausibility (0,4 = plausibility.ts:27) in iz explainerja izbrisal „(npr. 30 EUR)" — 30 EUR je fallback (contexts/racunovodstvo.ts:115), ne vnesena vrednost. Vsebina ugotovitve je sicer potrjena: explainer res opisuje napačno polje.


### 22. lateClientsSharePercent — „Kolikšen delež strank redno odda listine prepozno?" (racunovodstvo.ts:200–211)

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Grep čez src potrjuje: polje nastopa samo v modulu (:201) in v testu (racunovodstvo.test.ts:257–258) — nikjer drugje. V poročilo pride kot generična vrstica odgovora z virom (salesReport.ts:407–413), v prodajno pripravo pa šele, kadar ni nobenega drugega odprtega vprašanja (salesPlaybook.ts:106–114). Polje že IMA help (:209) in explainer (:210) — ugotovitev tega ne trdi drugače in je v tem točna. Vsebinsko drži: vprašanje je po strankah, panožni KPI K01 pa meri delež listin do cut-offa.

**Predlog.** Zamenjaj s K01, ohrani contextOnly: true. label „Kolikšen delež listin prejmete do dogovorjenega roka (cut-off)?"; kind 'choice'; default 4; choices 0 „90 % ali več", 1 „75–90 %", 2 „50–75 %", 3 „Manj kot 50 %", 4 „Ne vem" (unknown: true, vzorec shared.ts:73–95). help „Podatek ne vstopa v izračun — pove, kje je meja med 'opominjamo' in 'delamo v konici'." explainer „Gre za listine, ne za stranke: koliko od vseh listin za pretekli mesec ste imeli do dneva, do katerega jih po dogovoru pričakujete. V panogi velja 90 % in več za urejeno stanje. Primer: od 600 listin jih je do 10. v mesecu prišlo 420 → 70 %." Popravi test racunovodstvo.test.ts:257–258, ki polje uporablja kot percent (0 / 0,9) — nadomesti z indeksoma izbire (npr. 0 in 3).

**Sklic na raziskavo:** B01 (14) · K01 (dokumenti do cut-offa) · §7.1, §8.1

**Popravek preverbe.** Dve napaki v rationale. (1) Sklic za izpis vira „privzeto" ni answerLabels.ts:131–133 (to je isAnswered), ampak answerSource, answerLabels.ts:148–151. (2) Utemeljitev „unknown: true … da neodgovor pošteno zniža zanesljivost" je NAPAČNA in sem jo iz predloga izpustil: polja s contextOnly so pri oceni zanesljivosti izrecno preskočena (potential.ts:192) in ne pridejo niti med softness.unknownAnswers (salesReport.ts:472). „Ne vem" tu torej ničesar ne zniža — možnost naj ostane zaradi poštenosti odgovora in ker se izpiše kot vir „Ne vem" (answerLabels.ts:149), ne zaradi zanesljivosti. Število polj strankeRs ostane 5 (test racunovodstvo.test.ts:230–235 zahteva 5–6).


### 23. deliveryMethod — „Kako stranke danes oddajajo listine?" (racunovodstvo.ts:212–224)

**Sodba:** OHRANI · **Resnost:** nizka · **Status:** potrjeno

**Utemeljitev.** Potrjeno. contextOnly na :217 je pravilen — polje v compute() (:227–248) ne nastopa, kar varuje test racunovodstvo.test.ts:249–275. Privzetek 2 je druga najslabša možnost, a se izpiše z virom „privzeto" (answerLabels.ts:148–151) in nobenega zneska ne premakne. Protislovje z izbiro „PANTHEON s samodejnim zajemom listin in izmenjavo dokumentov" (contexts/racunovodstvo.ts:66–71) v kodi res nikjer ni preverjeno — a to je iztočnica za prodajnika, ne razlog za spremembo polja.

**Sklic na raziskavo:** B02 (14), B16 (11), B23 (10) · K02 (delež strukturiranih vhodov) · §7.1

**Popravek preverbe.** Popravljen le en sklic: salesReport.ts:470–474 je funkcija collectFields za razdelek „mehkih" polj; da contextOnly polje ne šteje med izpolnjena, določata potential.ts:192 (ocena zanesljivosti) in moduleEngine.ts:233 (isModuleAnswered). Sklep in verdikt ostaneta nespremenjena.


### 24. mainCause (strankeRs) — „Kaj je glavni vzrok?" s STRANKE_CAUSES (racunovodstvo.ts:159–165, polje na :225)

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Potrjeno. Izbira določa addressableShare obeh izidov (:228, uporabljeno na :237 in :246), razpon 'data' 0,75 proti 'external' 0,25 je trikraten (addressableShare.ts:28–35). Možnosti 1 (:160, data) in 4 (:163, external) res opisujeta isto stanje z dveh strani. mainCauseField (addressableShare.ts:56–69) help/explainer res ne sprejema, čeprav ju ModuleField podpira (moduleTypes.ts:149–159). Privzetek je zadnja možnost „Ne vemo" → unknown 0,3 (addressableShare.ts:46–47, 62), torej konservativen — to varuje tudi test racunovodstvo.test.ts:237–247.

**Predlog.** Razširi mainCauseField z neobveznim drugim parametrom { help?, explainer? } po vzoru reducibleShareField (shared.ts:73–85) — podpis ostane združljiv z vsemi osmimi dejavnostmi, ki ga kličejo. V strankeRs napolni: help „Izberite vzrok, ki je najbližje resnici — od tega je odvisno, koliko izmerjenega stroška štejemo za odpravljivega."; explainer „Vzrok pri nas (ni dogovorjenega načina in roka, obveznosti niso sledene) je z boljšim procesom večinoma odpravljiv; vzrok pri stranki je le deloma. Ista številka ur zato pomeni različno velik potencial." Izostri par: :160 → „Nimamo dogovorjenega enotnega načina in roka oddaje"; :163 → „Rok in način sta dogovorjena, a se stranke tega ne držijo". Kategoriji ('data', 'external') ostaneta nespremenjeni, zato se noben izračun ne premakne.

**Sklic na raziskavo:** B01 (14), B02 (14), B20 (11) · §7.1, §9.1 (rešljiv delež)

**Popravek preverbe.** Dodal sem dve izvedbeni omejitvi, ki ju ugotovitev ne omenja: (1) mainCauseField je skupen vsem dejavnostim, zato mora biti nov parameter neobvezen in besedila podana pri klicu, ne v funkciji; (2) preoblikovanje oznak ne sme spremeniti polja `category`, sicer se tiho premakne addressableShare. Test explainers.test.ts velja tudi tu: help brez explainerja pade.


### 25. donosnostRs triaža: „Koliko dela opravite, a ga ne zaračunate?" (racunovodstvo.ts:498–506)

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Potrjeno. Poziv (:499) imenuje samo neobračunano delo, čeprav modul meri tudi stranke pod lastno ceno (:520–537, izid na :581–588). Četrta možnost „Cenik že dolgo ne pokriva dejanskega obsega" (:504) res ni višja stopnja iste lestvice, ampak diagnoza, ki je dobesedno že med vzroki istega modula (:489 „Cenik ne sledi dejanskemu obsegu dela") — moduleTypes.ts:211 pa zahteva ordinalno lestvico („višja ocena pomeni večjo bolečino"). Posledica je mehka, ker je izbor področij ročno povozljiv, drži pa, da triaža priporoča tri področja (segments.ts:241, `triage: { recommendedCount: 3 }`) in da je donosnostRs peto po vrstnem redu v segments.ts:227–237.

**Predlog.** prompt: „Koliko dela opravite, a ga ne zaračunate — in koliko strank vas stane več, kot plačajo?" options: 0 „Zaračunamo skoraj vse, izgubarjev nimamo"; 1 „Nekaj dodatnega dela ostane nezaračunanega"; 2 „Precej dela ostane nezaračunanega, nekaj strank je na meji"; 3 „Veliko dela je nezaračunanega, nekaj strank nas stane več, kot plačajo". Razlog „cenik ne sledi obsegu" ostane samo med vzroki (:489).

**Sklic na raziskavo:** B12 (11), B08 (12), B19 (11) · §7.1

**Popravek preverbe.** Popravljena sklica: privzeti izbor treh področij izhaja iz segments.ts:241 (recommendedCount) ob vrstnem redu moduleIds na segments.ts:227–237, ne iz „segments.ts:227–236". Če se sprejme premik koša (postavka 11), v možnosti 3 ne trdimo ničesar o košu — formulacija zdrži v obeh primerih.


### 26. unbilledHoursPerMonth — „Koliko ur mesečno opravite dela, ki ga stranki ne zaračunate (dodatna vprašanja, izredna poročila, svetovanje, popravki po njeni krivdi)?" (racunovodstvo.ts:508–519)

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Vrednotenje je res pravilno in ga je treba ohraniti: ure gredo po operationalHourCostEUR (:577), kar varuje test racunovodstvo.test.ts:166–172 in ločeni test :277–286 („nobeno področje ne uporabi zaračunane postavke"). Prekrivanje z inquiryHoursPerMonth (:189–191) je potrjeno — help na :515 govori samo o vrednotenju, ne o meji. Vsebinski očitek drži: ure gredo v hoursPerMonth (:578) → surovo v capacityHoursPerMonth (moduleEngine.ts:65–67) → v naslov, ki torej trdi, da bo tudi svetovanje izginilo.

**Predlog.** Zaradi omejitve 5–6 polj (test racunovodstvo.test.ts:230–235) izvedi v tem zaporedju. (a) Iz donosnostRs premakni hoursPerClientPerMonth in ga postavi v diagnostikaRs (postavka 12) — donosnostRs pade na 5 polj. (b) unbilledHoursPerMonth razdeli v dve: key 'unbilledFixupHoursPerMonth', label „Koliko ur mesečno porabite za dodatno delo zaradi nereda pri stranki, ki ga ne zaračunate (urejanje njenih vhodov, izredna poročila, ponovni obračuni)?", h/mesec, default 0, help „Ne štejte ur, ki jih merijo druga področja: iskanje manjkajočih listin in odgovarjanje na vprašanja o stanju (Listine strank) ter popravljanje napačnih knjižb (Napake in popravki).", explainer s primerom „12 strank × 2 h na mesec ≈ 24 ur" → koš capacity S hoursPerMonth; in key 'unbilledAdvisoryHoursPerMonth', label „Koliko ur mesečno porabite za svetovanje strankam, ki ga ne zaračunate?", help „Teh ur ne štejemo v naslov '+X strank' — svetovanja ne želite odpraviti, ampak zaračunati.", explainer „Primer: 10 h na mesec × 24 EUR = 240 EUR mesečno, ki jih danes podarite." → koš capacity BREZ hoursPerMonth. Uskladi content/methodology.ts:247–252 (formula donosnostRs) in racunovodstvo.test.ts:158–176. Če delitev ni izvedljiva, je najmanjši popravek: iz oznake izbriši „dodatna vprašanja" in dodaj zgornji help.

**Sklic na raziskavo:** B19 (11), B12 (11), B07 (13) · K17 (monetizacija kapacitete) · §4.4, §7.1, §9.1

**Popravek preverbe.** Dve popravki. (1) Ugotovitev spregleda, da donosnostRs že IMA 6 polj, test racunovodstvo.test.ts:230–235 pa zahteva 5–6 — delitev v dve polji brez predhodnega premika hoursPerClientPerMonth test podre. Predlog sem zato zaporedno vezal na postavko 12. (2) Trditev, da so „popravki po njeni krivdi" isto kot popravkiRs.correctionHoursPerMonth (:403–405), je pretirana: popravkiRs je v svojem povzetku (:391) in v segments.ts:225 omejen na LASTNO napako servisa. Tveganje dvojnega štetja ostaja realno (oznaka na :405 lastne napake ne zahteva), zato mejo v help ohranim — a kot razmejitev, ne kot dokaz podvajanja. Iz oznake sem izbrisal „popravki po njeni krivdi" kot izrecno naštevanje in ga preselil v razmejitveni help.


### 27. belowCostClients — „Koliko strank je po vaši oceni pod lastno ceno?" (racunovodstvo.ts:520–526)

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** potrjeno

**Utemeljitev.** Potrjeno v celoti. Polje (:521–526) nima ne help ne explainer, je pa eden od dveh množiteljev postavke (:586: strank × EUR × 12). plausibility.ts zmnožka res ne vidi — sešteva izključno polja z enoto 'h/mesec' in 'h/leto' (plausibility.ts:61–62). Grep čez src potrjuje, da imenovalca ni: nobenega ključa clientCount ni nikjer. Diagnostika v istem segmentu res vpraša „Ali veste, katere stranke so za vas donosne in katere ne?" (racunovodstvo.ts:632–638) — kdor tam prizna neznanje, tu vseeno vpiše številko, ki ustvari desettisočaka.

**Predlog.** label: „Koliko strank vas po vaši oceni stane več, kot plačajo?" Dodaj allowUnknown: true (moduleTypes.ts:160–168; polje ni contextOnly, zato „Ne vem" tu res zniža zanesljivost — potential.ts:203–208). help: „Ocena zadostuje. Če donosnosti po stranki ne merite, izberite 'Ne vem' — številke si ne izmišljamo." explainer: „Stranke, pri katerih mesečni pavšal ne pokrije vašega stroška dela zanje. Primer: od 60 strank jih je 6 takih, torej ena od desetih. Če tega ne veste, pomislite na stranke, ki se najpogosteje javljajo in imajo največ izjem." Imenovalec doda novo polje clientCount (postavka 15).

**Sklic na raziskavo:** B08 (12), B12 (11) · K11 (prispevna marža stranke) · §7.1, §8.1

**Popravek preverbe.** Popravljen sklic na diagnostično vprašanje: knowsClientProfitability je na racunovodstvo.ts:632–638, ne 633–638. Dodal sem potrditev, da allowUnknown tu res deluje na zanesljivost (za razliko od contextOnly polj, glej postavko 4): „Ne vem" se šteje v unknownAnswers pri potential.ts:206–208. Predlog je izvedljiv brez spremembe števila polj.


### 28. belowCostDeficitEUR — „Kolikšen je povprečen mesečni primanjkljaj pri taki stranki?" (racunovodstvo.ts:527–537)

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Potrjeno. Explainer na :534–536 res definira primanjkljaj kot „kar plača, minus vaše ure × strošek ure", torej znesek že vsebuje ure, opravljene za to stranko; če jih je obiskovalec vpisal še v unbilledHoursPerMonth (:509), gre ista ura enkrat v koš capacity po operativni uri (:577) in še enkrat kot del primanjkljaja (:586). Meja ni zapisana pri nobenem od obeh polj, plausibility.ts je ne more ujeti, ker znesek ni v urni enoti (plausibility.ts:61–62). Znesek sam je legitimen tudi po pravilu „prihodek ni korist": ure so že plačane, dvig cene do pokritja stroška prinese razliko brez dodatnega stroška — primanjkljaj je zato približek prispevne marže, ne bruto prihodka.

**Predlog.** Dodaj allowUnknown: true. Mejo zapiši ENOSMERNO, da je odgovorljiva: primanjkljaj se računa iz VSEH ur za to stranko, polje o neobračunanem delu pa teh ur ne šteje. help pri belowCostDeficitEUR: „Razlika med tem, kar stranka plača, in tem, kar vas dejansko stane — v izračun vzemite vse ure, ki jih za to stranko porabite." explainer dopolni: „Primer: plača 150 EUR, porabite 12 ur × 26 EUR = 312 EUR → primanjkljaj 162 EUR. 'Neobračunano delo' meri ure, ki jih boljši proces sprosti; ta znesek meri ceno, ki stroška ne pokrije — isti uri ne smeta biti šteti obakrat." Simetrični stavek v help pri neobračunanem delu: „Ur pri strankah, ki ste jih navedli kot stranke pod lastno ceno, tu ne štejte — te so že zajete v njihovem primanjkljaju."

**Sklic na raziskavo:** B08 (12), B12 (11) · K11 · §7.1, §9.1

**Popravek preverbe.** Konkretiziral sem mejo. Izvirni predlog je obiskovalcu naložil odštevanje („vpišite samo razliko, ki po njih še ostane"), kar je težko izvedljivo in dvoumno. Mejo sem zato obrnil v eno smer, ki je iz glave odgovorljiva: primanjkljaj vključuje vse ure te stranke, polje o neobračunanem delu pa te stranke izpusti. Isti stavek mora iti v help obeh polj (uskladi s postavko 8).


### 29. belowCostClients × belowCostDeficitEUR → izid „Stranke pod lastno ceno", koš directLoss (racunovodstvo.ts:581–588)

**Sodba:** PREMAKNI · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Vsebinsko potrjeno. moduleTypes.ts:20–30 opredeljuje lostMargin dobesedno kot maržo, ki je podjetje ni zaslužilo, čeprav bi jo lahko, in med primeri navaja „prodaja po napačni ceni"; directLoss je opredeljen kot trdi denar, ki odteka in ga je mogoče pokazati na kontu (moduleTypes.ts:17–19, 24–28). Ta znesek stoji na oceni stroška po stranki, ki je servis po lastni diagnostiki pogosto ne pozna (:632–638), in na predpostavki, da bi stranka višjo ceno sprejela. Ločnica obstaja prav zato, da prvi ugovor ne podre dokazljivega dela zneska.

**Predlog.** V compute() (:584) spremeni bucket iz 'directLoss' v 'lostMargin' in dodaj note „predpostavlja dvig cene ali odhod stranke". Uskladi obvezno tudi: (a) segments.ts:242–243 — directLossNote danes izrecno našteva „stranke pod lastno ceno", to je treba prestaviti; (b) content/methodology.ts:247–252, kjer rationale za donosnostRs izrecno utemeljuje directLoss („denar, ki vsak mesec res odteče"); (c) racunovodstvo.test.ts:178–182, ki bucket preverja; (d) besedilo kartice nezaslužene marže, ki je danes maloprodajno („prazna polica, napačna cena") na treh mestih — ResultsSummary.tsx:74, pdfSales.ts:168, salesReportHtml.ts:126 — sicer računovodski servis ob svojem znesku bere o polici. Če ekipa znesek pusti v directLoss, mora poročilo ob njem izpisati, da temelji na oceni stroška po stranki, ne na knjižbi.

**Sklic na raziskavo:** B08 (12), B12 (11) · §9.1 (ločeno dokazno breme), maloprodaja §5.2

**Popravek preverbe.** Napačen sklic in napačna trditev o posledici. „salesReport.ts:283" je vrstica sizeClass; skupni seštevek treh košev je v salesReport.ts:364 in salesPlaybook.ts:171/189, prag za follow-up pa v CalculatorFlow.tsx:283. Predvsem pa: premik ne pusti vseh številk pri miru — figura „Neposredni letni stroški" (ResultsSummary.tsx:58–62) se ZNIŽA za ta znesek, prikaže pa se v figuri „Nezaslužena letna marža" (ResultsSummary.tsx:70–76). Nespremenjena ostaneta le skupna vsota in prag follow-upa. Dodal sem tri prezrte uskladitve: methodology.ts:247–252 ter maloprodajno besedilo kartice marže na ResultsSummary.tsx:74, pdfSales.ts:168 in salesReportHtml.ts:126.


### 30. hoursPerClientPerMonth — „Koliko ur mesečno v povprečju porabite za eno stranko?" (racunovodstvo.ts:538–556, contextOnly, default 8)

**Sodba:** PREMAKNI · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Potrjeno in celo hujše, kot je zapisano. Delitelj naslova je res to polje (CalculatorFlow.tsx:272–279), rezerva 8 h pa segments.ts:246. Naslov se izpiše kot `+{accountingCapacity.toFixed(1)} strank brez nove zaposlitve` (ResultsView.tsx:87) — ena decimalka na številki, ki je nihče ni potrdil, je natanko lažna natančnost. Števec je surova vsota capacityHoursPerMonth brez naslovljivega deleža in pasu izboljšave (moduleEngine.ts:65–67, calculations.ts:72–77), torej naslov predpostavlja 100-odstotno sprostitev. Explainer (:553–555) naroči deljenje s številom strank, tega števila pa kalkulator nikjer ne zajame (grep: ključa clientCount v src ni).

**Predlog.** Ciljna lokacija je diagnostikaRs (racunovodstvo.ts:620–653): modul je brez triaže in se prikaže vedno (moduleTypes.ts:220–224, potrjeno s testom racunovodstvo.test.ts:224–226), polja pa so navadni ModuleField in zanj ne velja omejitev 5–6 polj (COSTED_MODULES, racunovodstvo.test.ts:47). Polje postavi takoj za knowsHoursPerClient (:626–631), ohrani contextOnly: true, in prevezi CalculatorFlow.tsx:276 z `resolvedValues.donosnostRs` na `resolvedValues.diagnostikaRs`. Ob premiku posodobi naslov in povzetek modula („Štiri vprašanja …", :617 in :623) ter content/methodology.ts:253–257 („ocena tveganja iz štirih odgovorov"). Skupaj z novim clientCount ponudi izpeljan privzetek v potrditev: „Iz vaših podatkov: 5 zaposlenih × 160 h × 0,7 / 200 strank ≈ 5,6 h na stranko — popravite, če veste bolje." Ob naslovu izpiši delitelja („pri 8 h na stranko na mesec") in naslov prikaži kot razpon (npr. „+2 do +3 stranke"), izračunan iz števca, pomnoženega z naslovljivim deležem in spodnjo mejo pasu izboljšave — ne z eno decimalko.

**Sklic na raziskavo:** B08 (12), B14 (11) · K12/K17/K18 · §4.4, §9.1

**Popravek preverbe.** Prva ponujena lokacija ni izvedljiva, kot je zapisana: SegmentContext (contexts/contextTypes.ts) nima tipa za navadno številčno vprašanje — pozna le ContextQuestion, CostQuestion in ScaleQuestion, vsak s pasovi in fallbackom. Postavitev v skupno finančno osnovo bi zahtevala nov tip vprašanja, novo polje v BusinessProfile, izris v StepCostBasis in vpis v izvoz — to ni premik, ampak nova shema. Zato sem kot ciljno lokacijo določil diagnostikaRs in naštel vse, kar je ob tem treba uskladiti. Dodal sem tudi, da bi zahteva „ocena zanesljivosti naj pade, kadar je delitelj rezerva" terjala spremembo v potential.ts:192, kjer so contextOnly polja izrecno preskočena — sicer se ne zgodi nič.


### 31. declinedClientsPerYear — „Koliko strank ste v zadnjih 12 mesecih zavrnili, ker niste imeli kapacitete?" (racunovodstvo.ts:557–567, contextOnly)

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Potrjeno. Grep čez src: polje nastopa samo v modulu (:558) in v testu (racunovodstvo.test.ts:267–268); v prodajno pripravo pride le kot zadnja rezerva, kadar ni nobenega drugega odprtega vprašanja (salesPlaybook.ts:106–115). Vsebinsko je res edina povpraševalna preverba obljube naslova (segments.ts:238: „Koliko novih strank bi lahko sprejeli z isto ekipo?"): brez kupca sproščene ure po §9.1 ne postanejo denar. Polje že ima help (:564) in explainer (:565–566), zato ugotovitev ne trdi, da manjkata — trdi, da je izid neuporabljen, kar drži.

**Predlog.** Ohrani polje in ga premakni v diagnostikaRs skupaj s hoursPerClientPerMonth (glej postavko 12), da je vprašanje vedno prikazano — donosnostRs s tem sprosti dve mesti za delitev neobračunanega dela in za clientCount. Uporabi ga v izpisu ob naslovu (ResultsView.tsx:86–87): pri vrednosti > 0 „+2 do +3 stranke brez nove zaposlitve; v zadnjih 12 mesecih ste jih zavrnili 12."; pri 0 „Sproščene ure postanejo denar šele, ko jih nekdo kupi — zavrnjenih strank ni bilo, zato kapaciteto usmerite v plačljivo svetovanje obstoječim strankam." explainer dopolni s stavkom: „Štejejo tudi tiste, ki ste jim ponudili poznejši začetek ali višjo ceno, da niso prišle."

**Sklic na raziskavo:** B19 (11), B14 (11) · K18 (sprejetje strank), K17 · §9.1

**Popravek preverbe.** Konkretiziral sem lokacijo (diagnostikaRs, isti premik kot postavka 12) in mesto izpisa (ResultsView.tsx:86–87 ter ustrezna polja v salesReport). Besedilo ob naslovu sem uskladil z razponom iz postavke 12, da si predloga ne nasprotujeta („+3,4 stranke" bi vrnilo lažno natančnost, ki jo postavka 12 odpravlja). Popravljen sklic: salesPlaybook.ts:106–115.


### 32. mainCause (donosnostRs) — „Kaj je glavni vzrok?" z DONOSNOST_CAUSES (racunovodstvo.ts:486–492, polje na :568)

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Potrjeno. Izbira določa addressableShare obeh izidov (:571, uporabljeno na :579 in :587), razpon je 0,25–0,75 (addressableShare.ts:28–35). „Težko se odločimo za dvig cene" (:491) je res uvrščeno med 'people' → 0,45, kar programski opremi pripiše skoraj polovico komercialne odločitve, ki je noben program ne sprejme namesto lastnika. Možnosti :489 (planning 0,65) in :490 (external 0,25) res opisujeta isto stanje z dveh strani — 2,6-kratna razlika je stvar formulacije. Deleži so izrecno začetne ocene pred kalibracijo (addressableShare.ts:11–12), zato gre za popravek kalibracije, ne za napako v kodi.

**Predlog.** Uporabi isti razširjeni mainCauseField s help/explainer kot pri strankeRs (postavka 6). Možnost :491 preoblikuj v „Cene ne moremo dvigniti zaradi konkurence" in ji določi category: 'external' (0,25) — kar program res naslovi, je merjenje (evidenca ur po stranki), ne odločitev. Par izostri: :489 → „V pogodbi obseg storitev ni zapisan" (planning), :490 → „Obseg je zapisan, a ga stranke redno presegajo" (external). Vrstni red možnosti ohrani, ker so vrednosti zaporedni indeksi (addressableShare.ts:52–54, 62–67), spremembo pa zapiši kot kalibracijsko opombo ob ADDRESSABLE_SHARE (addressableShare.ts:11–12).

**Sklic na raziskavo:** B12 (11), B08 (12), B19 (11) · §7.1, §9.1 (rešljiv delež, funkcionalni fit)

**Popravek preverbe.** Od dveh ponujenih različic sem izbral eno: zgolj prekvalifikacija obstoječe oznake „Težko se odločimo za dvig cene" v 'external' bi bila pomensko napačna (odločitev je notranja, ne zunanja), zato je treba oznako preoblikovati skupaj s kategorijo. Dodal sem opozorilo, da vrstnega reda možnosti ni dovoljeno premešati: vrednosti so zaporedni indeksi in shranjeni odgovori bi se preslikali na drug vzrok.


### 33. MANJKA: „Koliko strank redno vodite?" (novo polje clientCount)

**Sodba:** DODAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Potrjeno z grepom: ključa clientCount v src ni nikjer. Trije obstoječi explainerji ga vseeno predpostavljajo — zajemRs.documentsPerMonth naroči „število strank × povprečno listin na stranko" (:68–70), hoursPerClientPerMonth „skupne mesečne ure vseh zaposlenih delite s številom strank" (:553–555), belowCostClients (:521–526) pa brez imenovalca ni interpretabilen. Vprašanje je iz glave odgovorljivo v nekaj sekundah, ne podvaja nobenega obstoječega polja in omogoči tri kontrole hkrati: delež strank pod lastno ceno, križno preverbo delitelja naslova in plauzibilnost obsega listin.

**Predlog.** Dodaj v diagnostikaRs (racunovodstvo.ts:620–653) kot prvo polje — modul je brez triaže in se prikaže vedno, zanj ne velja omejitev 5–6 polj. key 'clientCount', label „Koliko strank redno vodite?", kind 'number', unit 'strank', default 0, contextOnly: true, help „Podatek ne vstopa v izračun stroška — je imenovalec za delež strank pod lastno ceno in za povprečne ure na stranko.", explainer „Stranke z mesečno obveznostjo, ne enkratne storitve. Primer: 60 strank, od tega 6 pod lastno ceno = 10 %." (explainer je obvezen, ker je prisoten help — explainers.test.ts; dolžina je znotraj 41–600 znakov.) V poročilu ga uporabi za izpis deleža ob belowCostClients in za izpeljan privzetek ur na stranko (postavka 12).

**Sklic na raziskavo:** B08 (12), B12 (11) · K11, K12 (prihodek/FTE) · §8.1, §9.1

**Popravek preverbe.** Popravljena lokacija. Dodajanje kot prvo polje donosnostRs bi ta modul pripeljalo na 7 polj in podrlo test racunovodstvo.test.ts:230–235 (5–6 polj), obenem pa bi bilo vprašanje vidno le, kadar področje pride v triažo — ravno takrat, ko je imenovalec najbolj potreben, ga pogosto ne bi bilo. Druga ponujena lokacija (skupna finančna osnova) tudi tu ni izvedljiva brez nove sheme: contexts/contextTypes.ts pozna le izbirna vprašanja, urne postavke s pasovi in velikostne pasove, ne pa navadnega števila. Ciljna lokacija je zato diagnostikaRs, skupaj s hoursPerClientPerMonth in declinedClientsPerYear; ob tem je treba popraviti naslov in povzetek modula („Štiri vprašanja …", :617 in :623) ter content/methodology.ts:253–257.


## Področje: popravkiRs + diagnostikaRs + tehnični modul E (segment: računovodski servis)

### 34. popravkiRs triaža: 'Kako pogosto je treba popravljati knjižbe, obračune ali že oddane obrazce?'

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno dobesedno. racunovodstvo.ts:392-400 vsebuje natanko navedeno besedilo in možnosti Redko/Mesečno/Tedensko/Stalno. Triažni odgovor res ne vstopa v noben compute() — triage je ločena lastnost ModuleDefinition (moduleTypes.ts:224), compute pa dobi samo vrednosti polj. segments.ts:240 potrjuje triage: { recommendedCount: 3 }. Očitek o združevanju treh razredov dogodkov drži.

**Predlog.** Prompt zoži na en razred dogodka: 'Kako pogosto morate knjižbo ali obračun popraviti, potem ko je bil že zaključen?' Možnosti (štiri, vrednosti 0-3, kot zahteva TriageQuestion): 0 'Skoraj nikoli — manj kot 1 popravek na 100 listin', 1 'Nekajkrat na mesec ALI vsaj ena samoprijava letno', 2 'Vsak teden pri več strankah', 3 'Stalno — popravki so del rednega dela'.

**Sklic na raziskavo:** B07 (13); KPI K06, K09

**Popravek preverbe.** Sklici in besedila držijo, popravljen pa je predlog. Reviewer trdi, da stavek v summary reši izpad redkega, a dragega dogodka iz triaže — ne reši ga: summary se izpiše šele, ko je področje izbrano, izbira pa je odvisna izključno od triažne ocene. Zato mora sidro za samoprijavo stati v LABELU možnosti 1 (kot zgoraj), da servis z dvema samoprijavama letno dobi vsaj oceno 1 in ne 0. Dodatno: mehanizem za neizmerjena boleča področja v kodi že obstaja (ResultsView.tsx, coverageNote + painfulUnmeasured), zato ga ni treba izumljati — stavek v summary je odveč.


### 35. correctionHoursPerMonth — 'Koliko ur mesečno porabite za iskanje in popravljanje napačnih knjižb ter usklajevanje kontov, ki se ne izidejo?'

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** potrjeno

**Utemeljitev.** Preverjeno dobesedno in v celoti potrjeno. racunovodstvo.ts:402-409: polje res nima ne help ne explainer, edino med štirimi zneskovnimi polji področja. compute na vrstici 450 ga množi z operationalHourCostEUR × MONTHS_PER_YEAR. zajemRs.minutesPerManualDocument.help (vrstica 90) se glasi 'Od prejema do knjižene listine. Iskanje manjkajočih listin sem ne sodi — to meri področje Listine strank.' — popravkov ne omenja. obracuniRs.reportPrepHoursPerMonth.help (vrstica 296) se glasi 'Ne vključujte vnosa listin iz področja Zajem.' — popravkov prav tako ne omenja. plausibility.ts:58 preskoči contextOnly, vrstica 61 sešteje vse 'h/mesec', prag PLAUSIBLE_CAPACITY_SHARE = 0,4 (plausibility.ts:27).

**Predlog.** help: 'Samo popravki po tem, ko je bila listina že knjižena. Vnos in prepis listin meri področje Zajem, mesečni zaključek področje Obračuni.' explainer: 'Ur ni treba šteti. Vzemite število popravkov na mesec × povprečen čas enega: 40 popravkov × 20 min ≈ 13 h na mesec. Šteje tudi čas iskanja napake, ne le vnos popravka.' Zrcalna stavka: v zajemRs.minutesPerManualDocument.help dodaj 'Naknadni popravki že knjižene listine sodijo v področje Napake in popravki.'; v obracuniRs.reportPrepHoursPerMonth.help dodaj 'Popravljanje napačnih knjižb meri področje Napake in popravki.'

**Sklic na raziskavo:** B07 (13), B10, B03; KPI K03, K06

**Popravek preverbe.** Sklic na obracuniRs.reportPrepHoursPerMonth je 289-300 (help na 296), ne 290-296 — vsebinsko brez posledic. Oba soseda že imata explainer, zato dodajanje stavka v help ne sproži testa explainers.test.ts ('vsako polje s pomožnim besedilom ima tudi pojasnilo'). Predlagani explainer je dolg 168 znakov — znotraj meje 40-600 iz istega testa. Predlog je izvedljiv brez dodatnih odločitev.


### 36. reviewHoursPerMonth — 'Koliko ur mesečno porabi vodja za dodatne kontrole pred oddajo, ker podatkom ni mogoče povsem zaupati?'

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Sklici držijo: contexts/racunovodstvo.ts:107-116 vpraša 'Približen polni strošek vodstvene oziroma strokovne ure' s help 'Vodja računovodstva, davčni svetovalec, pregled in podpis pred oddajo' (vrstica 109); racunovodstvo.ts:459 množi z adminHourCostEUR, komentar 455-456 razlog zapiše. help na 416 res omejuje samo proti 'rednemu strokovnemu pregledu in podpisu' in ne proti correctionHoursPerMonth. Napačna pa je trditev o razmerju postavk: obiskovalec oba pasova izbere neodvisno (OPERATIONAL_HOUR_BANDS sredine 17/23/31/40, ADMIN_HOUR_BANDS 17/24/33/45), razlikujeta se le rezervi — 30 proti 24 EUR, torej +25 %, ne 30-60 %. Prav tako je napačno, da explainer nima primera: explainer na 417-419 že vsebuje 'Primer: vodja 3 h na teden ≈ 13 ur na mesec.'

**Predlog.** help razširi: 'Samo kontrole zaradi negotovosti v podatke, ne rednega strokovnega pregleda in podpisa. Ure, ko napako že popravljate, štejte v prvo vprašanje — ne v obe. Ročnih kontrol in uskladitev ob mesečnem zaključku sem ne štejte — te meri področje Obračuni.' explainer obstoječemu primeru DODAJ delitev: '... Če od teh 13 ur vodja 1 h na teden dejansko popravlja, tu vpišite 9 h, preostale 4 h pa v prvo vprašanje.' Pojasnilo vodstvene ure v contexts/racunovodstvo.ts:109 uskladi tako, da opisuje NOSILCA in ne namena: 'Kdor pregleda in podpiše: vodja računovodstva, davčni svetovalec.'

**Sklic na raziskavo:** B20 (11), B07 (13); KPI K07

**Popravek preverbe.** Trije popravki. (1) Trditev '30-60 % višja' ne izhaja iz kode — v kodi je razlika samo med rezervama (30 proti 24 EUR = +25 %), pasova pa izbere obiskovalec. (2) Explainer primera že ima, zato ga je treba razširiti, ne pisati na novo — sicer nastane podvojen stavek. (3) Reviewer je spregledal TRETJE prekrivanje, ki je hujše od navedenih: obracuniRs.reportPrepHoursPerMonth (racunovodstvo.ts:292) v svojem labelu izrecno navaja 'ročne kontrole in uskladitve pred oddajo', kar je isto dejstvo kot 'dodatne kontrole pred oddajo' tu — ista ura gre enkrat po operationalHourCostEUR (vrstica 353) in enkrat po adminHourCostEUR (vrstica 459). Zato je v help zgoraj dodan tretji mejni stavek.


### 37. selfReportCostEUR — 'Kolikšni so bili v zadnjih 12 mesecih stroški samoprijav, doplačil in zamudnih obresti zaradi napačne vsebine, ki jih je krila vaša hiša?'

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** potrjeno

**Utemeljitev.** Preverjeno v celoti. racunovodstvo.ts:421-432: enota 'EUR/leto', compute na 466 vrednosti res NE množi z 12. help na 428: 'Globe zaradi prepozne oddaje meri področje Obračuni, ne to.'; obracuniRs.latePenaltyCostEUR.help na 316: 'Samo posledice ZAMUDE. Doplačila zaradi napačne vsebine meri področje Napake in popravki.' — dvosmerna meja potrjena in res edina taka v segmentu. allowUnknown res manjka; moduleTypes.ts:160-168 opisuje natanko ta primer. Polje je kind 'number', zato je allowUnknown tehnično izvedljiv (ModuleInput.tsx:93 ga podpira samo pri 'number').

**Predlog.** Dodaj allowUnknown: true. explainer razširi z izhodom: '... Če zneska nimate zbranega, seštejte posamezne primere iz zadnjih 12 mesecev (vsaka samoprijava, doplačan davek, obresti) ali izberite "Ne vem" — ocene si ne izmišljamo.' help pusti nespremenjen.

**Sklic na raziskavo:** B07 (13), B25 (10); KPI K09

**Popravek preverbe.** Brez vsebinskih popravkov. Dopolnilo za izvedbo: allowUnknown v tem segmentu doslej ne uporablja nobeno polje (uporablja ga samo maloprodaja.ts), zato gre za nov precedens — smiselno je isto potezo narediti hkrati pri creditNoteCostEUR, sicer bo ena od dveh sosednjih EUR postavk ponujala 'Ne vem', druga pa ne, kar je za obiskovalca nedosledno.


### 38. creditNoteCostEUR — 'Kolikšna je bila v zadnjih 12 mesecih vrednost dobropisov, popustov ali odpisanih storitev zaradi lastne napake?'

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno. racunovodstvo.ts:433-440: brez help, brez explainer, brez allowUnknown. donosnostRs.unbilledHoursPerMonth (racunovodstvo.ts:508-519) meri neobračunane ure × strošek ure; njegov help (vrstica 515) govori samo o načinu vrednotenja ('po vašem strošku ure, ne po ceniku'), meje proti odpisanemu delu ne postavlja. Prekrivanje je zato realno, a ožje, kot trdi ugotovitev: label unbilledHoursPerMonth izrecno navaja 'popravki po NJENI krivdi' (stranke), tu pa gre za lastno napako — meja obstaja implicitno, ni pa zapisana.

**Predlog.** Label zoži: 'Kolikšna je bila v zadnjih 12 mesecih vrednost izdanih dobropisov in odpisanih računov zaradi NAŠE napake — za delo, ki je bilo že opravljeno?' help: 'Delo, ki ga sploh niste zaračunali, meri področje Neobračunano delo — sicer se ista storitev šteje dvakrat. Vnaprej dogovorjeni popusti sem ne sodijo.' explainer: 'Šteje znesek, ki ste ga stranki odpisali, ker je bila napaka naša: dobropis, znižan račun, brezplačen popravek obračuna. Vpišite zaračunani odpisani znesek; v izračunu velja kot neposredna izguba, ker so ure zanj že plačane. Primer: 3 dobropisi po 250 EUR = 750 EUR na leto.' Dodaj allowUnknown: true. Zrcalni stavek PRIPNI obstoječemu donosnostRs.unbilledHoursPerMonth.help (ne nadomesti ga): '... Delo, ki ste ga zaračunali in nato odpisali zaradi lastne napake, meri področje Napake in popravki.'

**Sklic na raziskavo:** B07 (13), B12 (11); KPI K11

**Popravek preverbe.** Dva popravka. (1) Zrcalni stavek je treba PRIPETI: obstoječi help unbilledHoursPerMonth nosi stavek o vrednotenju po strošku in ne po ceniku, ki je edini varovalec pravila 'prihodek ni korist' pri tem polju — zamenjava bi ga izbrisala. (2) Reviewerjeva formulacija explainerja ('izguba je celoten odpisani znesek in ne le marža') je trditev, ki je s pravilom 'prihodek ni korist' v napetosti: zaračunani znesek vsebuje tudi maržo, ki ni nikoli prišla, za kar ima kalkulator ločen koš 'lostMargin' (moduleTypes.ts, komentar ob BucketId). Explainer zato ne sme razglašati ekonomske resnice, ampak samo povedati, kaj vpisati in kako se to obravnava — kot je popravljeno zgoraj. Če se hoče biti dosleden, je pravi popravek razdelitev postavke (strošek ur → directLoss, marža → lostMargin); to je kalibracijska odločitev, ki presega to polje, in jo je treba zapisati v content/methodology.ts pod popravkiRs.


### 39. mainCause (popravkiRs) — 'Kaj je glavni vzrok?' s petimi možnostmi + 'Ne vemo'

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Sklici držijo: racunovodstvo.ts:380-386 (POPRAVKI_CAUSES) in addressableShare.ts:28-35 (data 0,75, external 0,25, unknown 0,30). Privzetek je res 'Ne vemo' (addressableShare.ts:62: default = all.length - 1) in daje konservativnih 0,30. 'Vhodne listine so nepopolne ali nejasne' je res external (vrstica 383), ista formulacija v zajemRs ('Stranke oddajajo listine neurejeno', vrstica 43) pa prav tako external. Napačen je opis učinka: addressableShare zneska področja NE zniža na četrtino — compute() vrne dejanski sedanji strošek in ta se v poročilu izpiše v celoti (salesReport.ts, buildMeasuredArea sešteje valueEUR). Delež vpliva samo na realistični potencial (glej komentar racunovodstvo.ts:10-12).

**Predlog.** Možnost razdeli na dve in ju uvrsti različno: 'Stranke oddajajo neurejeno, kanala oddaje nismo predpisali' → category 'data' (0,75) in 'Stranke pošiljajo napačne podatke, ki jih ne moremo predvideti' → category 'external' (0,25). POPRAVKI_CAUSES s tem dobi šest možnosti + 'Ne vemo'; vrednosti ostanejo zaporedni indeksi, ki jih tvori mainCauseField, zato posega v shemo ni. Odločitev zapiši v komentar nad POPRAVKI_CAUSES in navedi, zakaj zajemRs:43 ostaja external.

**Sklic na raziskavo:** B07 (13), B01 (14), B02 (14), B23 (10)

**Popravek preverbe.** Popravljen je opis posledice (delež ne znižuje izmerjenega zneska, ampak naslovljivi potencial — 'ure IN oba EUR zneska na četrtino' ne drži) in izbrana je razdelitev na dve možnosti namesto preproste prekvalifikacije. Razlog: preprosta prekvalifikacija bi v tem področju kategorijo 'external' izpraznila, s čimer bi izračun izgubil edino možnost, da servis pošteno pove, da vzroka ne obvladuje — to bi delovalo v smeri višjega potenciala, torej v smeri prodajalca, kar je natanko tisto, čemur se naslovljivi delež izogiba.


### 40. [manjka v popravkiRs] Število popravljenih oziroma ponovljenih obračunov na mesec

**Sodba:** DODAJ · **Resnost:** srednja · **Status:** potrjeno

**Utemeljitev.** Poskus ovržbe ni uspel. Polje res ne obstaja — popravkiRs ima štiri zneskovna polja in mainCause, nobenega števca. contextOnly polje res ne vstopi v plausibility.ts:58 in se res izpiše v prodajni pripravi: salesReportHtml.ts:365-369 izpiše vse odgovore področja, contextOnly pa označi z '(kontekst)'. Precedens v istem segmentu obstaja (donosnostRs.declinedClientsPerYear, racunovodstvo.ts:557-567 — enak vzorec: contextOnly, help 'Podatek ne vstopa v izračun', explainer).

**Predlog.** Novo polje v popravkiRs pred mainCauseField: key 'correctedFilingsPerMonth', label 'Koliko že zaključenih obračunov ali oddanih obrazcev na mesec je treba ponoviti ali popraviti?', kind 'number', unit 'popravkov/mesec', default 0, contextOnly: true, help 'Podatek ne vstopa v izračun — pokaže obseg težave in služi kot preverba zgornjih ur.', explainer 'Šteje vsak ponovljen obračun plač, popravek DDV-O in vsaka samoprijava. Primer: 2 popravka plač + 1 popravek DDV = 3 na mesec.'

**Sklic na raziskavo:** KPI K09, K06; B15 (11), B07 (13)

**Popravek preverbe.** Predlog je shemsko ustrezen (števila, brez showIf, help ima explainer, explainer 141 znakov je znotraj meje 40-600) in odgovorljiv iz glave. Dve izvedbeni opombi, ki ju ugotovitev ne omenja: (1) popravkiRs s tem doseže 6 polj, kar je zgornja meja testa racunovodstvo.test.ts:230-235 ('vsak modul ima 5-6 polj') — po tem posegu v to področje ni več mogoče dodati ničesar; (2) test 'polja s contextOnly ne premaknejo nobene številke' (racunovodstvo.test.ts:249+) ima seznam scenarijev po modulih — zanj je treba dodati vnos za popravkiRs, sicer novo polje ni pokrito.


### 41. diagnostikaRs kot celota — privzetki (1, 1, 2, 1) in kaj vrne riskLevelFromScore, če se obiskovalec koraka ne dotakne

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** potrjeno

**Utemeljitev.** Aritmetika in sklici preverjeni in točni. Privzetki: racunovodstvo.ts:629 (1), 636 (1), 643 (2), 650 (1). shared.ts:47-52: ratio <= 0,3 → low, <= 0,6 → medium. Podatki 2/6 = 0,333 → 'medium' (prag zgrešen za eno samo stopnjo), proces 3/6 = 0,5 → 'medium'. Oceni res potujeta v prodajno pripravo (salesReport.ts:230 tip, 331 prenos) in se v vmesniku izrišeta kot dejstvo: RiskCard.tsx izpiše značko 'Srednje tveganje' in note brez vsakega pridržka. Komentar 613-619 res obljublja nasprotno. riskLevel je na ModuleOutputDraft res neobvezen (moduleTypes.ts:187), RiskCard pa odsotnost že prenese ('risk.riskLevel ? ... : null').

**Predlog.** Uvedi lokalno lestvico v racunovodstvo.ts (ASSURANCE_CHOICES iz shared.ts se NE sme spreminjati — uporabljajo jo tudi proizvodnja, logistika in trgovina) s peto možnostjo { value: 4, label: 'Nismo preverili', unknown: true } kot privzetkom vseh štirih polj. V compute() vrednost 4 ne vstopa v vsoto; maxScore = 3 × število odgovorjenih polj v paru; če v paru ni odgovorjeno nobeno polje, vrni izid brez riskLevel in z opombo 'Ni odgovora — ocene tveganja nismo naredili.' Minimalna različica: privzetke poenoti na 1 in v poročilu oceno iz nedotaknjenih privzetkov označi kot 'privzetek, ni potrjeno'.

**Sklic na raziskavo:** §4.4; B25, B09

**Popravek preverbe.** Dve dopolnili. (1) Delno olajševalna okoliščina, ki je ugotovitev ne omenja: v tabeli odgovorov prodajne priprave je nedotaknjena vrednost že označena kot 'privzeto' (answerLabels.ts:148-151, answerSource). Napaka je torej ozko v RiskCard/note, ki te oznake ne nosi — kar predlog pravilno naslovi. (2) Izvedbeni pogoj: compute mora eksplicitno prestreči primer 'noben odgovor v paru', sicer riskLevelFromScore(0, 0) vrne NaN/0 in tiho pade v 'low' — to bi bila natanko obratna, prav tako neizrečena trditev. Test racunovodstvo.test.ts:196-201 pričakuje dva izida iz privzetkov; izid brez riskLevel ga še vedno prestane (šteje se dolžina, ne raven), a njegovo ime je treba popraviti.


### 42. knowsHoursPerClient — 'Ali veste, koliko ur mesečno porabite za posamezno stranko?'

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** potrjeno

**Utemeljitev.** Potrjeno in celo podcenjeno. racunovodstvo.ts:625-631; donosnostRs.hoursPerClientPerMonth (racunovodstvo.ts:538-556) ima privzetek 8 h in je contextOnly. CalculatorFlow.tsx:265-280 to številko res uporabi kot delitelj za naslovno številko, ResultsView.tsx:87 pa jo izpiše kot '+X,X strank brez nove zaposlitve' — točkovna vrednost z eno decimalko, medtem ko so evrski zneski tik pod njo že prikazani kot razpon (totalsRange). Nič v kodi obeh odgovorov ne povezuje.

**Predlog.** Besedilo ohrani, dodaj explainer: 'Mišljena je evidenca, ne občutek: če bi stranka jutri vprašala, koliko ur smo ji ta mesec porabili, ali odgovor obstaja v programu?' Kadar je odgovor 'Le približno', 'Ne' ali 'Nismo preverili' (ali kadar področje Neobračunano delo sploh ni bilo izbrano), '+X strank' prikaži izključno kot razpon z oznako 'ocenjeno, ker porabljene ure po stranki niso evidentirane'; isti stavek gre v prodajno pripravo kot pričakovan ugovor.

**Sklic na raziskavo:** B08 (12); KPI K03, K12

**Popravek preverbe.** Ugotovitev je premalo stroga v eni točki: CalculatorFlow.tsx:275-277 uporabi izraz 'resolvedValues.donosnostRs?.hoursPerClientPerMonth || segment.accountingCapacity.avgHoursPerClientPerMonth', rezerva pa je prav tako 8 (segments.ts:246). Kadar področje Neobračunano delo v triaži ni izbrano — kar je pri treh priporočenih od šestih pogosto — vprašanja o urah na stranko obiskovalec sploh ne vidi, naslovna številka pa vseeno nastane iz 8 ur. Pogoj za razpon mora zato zajeti tudi ta primer, ne le odgovor v diagnostiki. Dodajanje explainerja k polju brez help je dovoljeno (explainers.test.ts zahteva le obratno smer).


### 43. knowsClientProfitability — 'Ali veste, katere stranke so za vas donosne in katere ne?'

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Sklici držijo: racunovodstvo.ts:632-638, donosnostRs.belowCostClients na 520-526, DONOSNOST_CAUSES[0] na 487 ('Ne vemo, koliko časa porabimo za posamezno stranko'). Trditev o trojnem zajemu iste teme je v osnovi točna, a ena stopnja pretirana: belowCostClients sprašuje 'Koliko strank je PO VAŠI OCENI pod lastno ceno' — ocena je izrecno dovoljena, zato polje ne zahteva poznavanja donosnosti, ampak občutek zanjo. Prekrivanje je torej z vprašanjem 'Ali veste ...' resnično, a gre za mehko podvojitev, ne za isti podatek.

**Predlog.** Vprašanje preusmeri na izid, ki ga servis res nima: 'Ali za posamezno stranko poznate razliko med tem, kar plača, in tem, kar vas stane — brez ročnega štetja ob koncu leta?' kind 'choice', lestvica ista kot pri ostalih diagnostičnih poljih (z 'Nismo preverili' iz postavke o privzetkih). Ob odgovoru 'Le približno' / 'Ne' / 'Nismo preverili' se postavka 'Stranke pod lastno ceno' v poročilu prikaže kot razpon z razlogom.

**Sklic na raziskavo:** B08 (12); KPI K11; B04 (13), B05 (13)

**Popravek preverbe.** Popravljena je jakost trditve o podvojitvi (belowCostClients izrecno dopušča oceno, zato ne zahteva istega znanja) in predlagano vprašanje je skrajšano ter opremljeno s tipom in lestvico, da je izvedljivo brez nadaljnjih odločitev. Sklep 'izboljsaj' ostane: vprašanje res meri isto os kot knowsHoursPerClient in tako porabi dve od štirih diagnostičnih mest za eno temo.


### 44. auditTrail — 'Ali lahko za vsak vnos zanesljivo ugotovite, kdo ga je naredil in kdaj?'

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** potrjeno

**Utemeljitev.** Preverjeno: racunovodstvo.ts:639-645, privzetek 2 ('Le približno') je res najstrožji od štirih in v paru s keyPersonIndependence (1) proizvede 3/6 = 0,5 → 'medium'. Trditev, da praktično vsak servis odgovori 'Da, zanesljivo', je domenska in je koda ne more ne potrditi ne ovreči, je pa skladna s tem, da PANTHEON seznam istega modula (racunovodstvo.ts:675) revizijsko sled navaja kot funkcionalnost, ki jo program prinese — kar pomeni, da vprašanje meri obstoj lastnosti, ne bolečine.

**Predlog.** Preoblikuj v preverljiv dogodek: 'Ali lahko ob reklamaciji stranke ali inšpekciji v nekaj minutah pokažete, kdo je sporno knjižbo vnesel, kdo jo je potrdil in na podlagi katere listine?' Lestvica ostane 0-3, privzetek 'Nismo preverili' iz postavke o privzetkih.

**Sklic na raziskavo:** B25 (10), B24 (10), B20 (11)

**Popravek preverbe.** Sklici in aritmetika držijo. Drugi del predloga (ločeno vprašanje o pooblastilih in dostopih) ni izvedljiv brez odločitve, ki je ugotovitev ne sprejme: diagnostikaRs ima natanko štiri polja, njegov summary (racunovodstvo.ts:623) in content/methodology.ts:253-257 pa oba izrecno govorita o ŠTIRIH odgovorih. Peto vprašanje zato ni 'če se najde mesto', ampak zahteva sočasno spremembo summary, komentarja 613-619 in vnosa v methodology — in tekmuje z dvema vprašanjema iz naslednje postavke. Priporočilo: pooblastila (B24) pustiti izven diagnostike, dokler nista rešena B04 in B05.


### 45. keyPersonIndependence — 'Ali servis deluje normalno tudi brez ključne osebe?'

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** potrjeno

**Utemeljitev.** Preverjeno: racunovodstvo.ts:646-652, privzetek 1. PROCESS_RISK_NOTE.high (racunovodstvo.ts:610) se res glasi '... Odsotnost ene osebe lahko ustavi obračune za več strank.' — jezik izida je res konkretnejši od jezika vprašanja. Očitek o nedefiniranem 'normalno' in o vgrajeni pristranskosti proti 'Večinoma' je utemeljen.

**Predlog.** Preoblikuj v dogodek s posledico: 'Če bi ena oseba nenapovedano izostala en mesec, koliko strank bi ostalo brez pravočasnega obračuna?' Ker se besedila možnosti razlikujejo od ASSURANCE_CHOICES, polje dobi LASTEN choices niz (ASSURANCE_CHOICES v shared.ts:40 je v skupni rabi štirih dejavnosti in se ne sme spremeniti): 0 'Nobena, delo prevzame kdor koli', 1 'Nekaj, z zamikom', 2 'Precej, potrebovali bi zunanjo pomoč', 3 'Obračuni bi se ustavili', 4 'Nismo preverili' (unknown: true, privzetek). Vrednosti 0-3 ostanejo iste, zato se ocena ne premakne.

**Sklic na raziskavo:** B09 (12), B14 (11), B13 (11); KPI K15

**Popravek preverbe.** Vsebinsko potrjeno; predlog je konkretiziran z izvedbeno podrobnostjo, ki je ugotovitev izpušča — polje trenutno uporablja skupni ASSURANCE_CHOICES (racunovodstvo.ts:651), zato novih besedil ni mogoče vpisati brez lastnega niza možnosti, sicer bi se spremenile tudi diagnostike proizvodnje, logistike in trgovine.


### 46. DATA_RISK_NOTE (besedila ocene tveganja za zanesljivost podatkov, low/medium/high)

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** potrjeno

**Utemeljitev.** Besedila preverjena dobesedno na racunovodstvo.ts:600-605. 'medium' se res glasi '... Da je stranka nedonosna, praviloma ugotovite šele ob koncu leta, ko pogodbe ni več mogoče popraviti.' — to je trditev o poslu bralca, ne o njegovem odgovoru, in jo res sliši vsak, ki koraka ni odprl (privzetki dajo 'medium', glej postavko o privzetkih). Četrtega besedila ni: konstanta je tipizirana kot Record<RiskLevel, string>, RiskLevel pa ima natanko tri vrednosti (moduleTypes.ts:178).

**Predlog.** Besedilo 'medium' omili na to, kar odgovor res implicira: 'Podatki so delni. Katera stranka je nedonosna, se pokaže z zamikom — praviloma šele ob letnem pregledu, ko je cena za tekoče leto že dogovorjena.' Besedili 'low' in 'high' ohrani dobesedno. Za stanje brez odgovora dodaj LOČENO konstanto (ne ključ v Record<RiskLevel, string>, ker tip tega ne dopusti), npr. DATA_RISK_NOTE_UNANSWERED = 'Na ta vprašanja niste odgovorili — ocene nismo naredili. Če porabljenih ur po stranki ne merite, tudi razpon "+X strank" v tem poročilu stoji na privzeti oceni 8 ur na stranko.', ki se uporabi ob izidu brez riskLevel.

**Sklic na raziskavo:** B08 (12); KPI K11; §4.4

**Popravek preverbe.** Vsebinsko brez pripomb; popravljena je le izvedba — 'dodaj ključ' ni mogoč, ker je konstanta Record<RiskLevel, string> in RiskLevel je zaprta unija treh vrednosti. Potrebna je ločena konstanta. Prav tako drži presoja, da je besedilo 'high' najmočnejši stavek področja in ga ni treba spreminjati: pove, česa ni mogoče izračunati, in ne izmisli zneska.


### 47. PROCESS_RISK_NOTE (besedila ocene tveganja za procesno odpornost, low/medium/high)

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** potrjeno

**Utemeljitev.** Preverjeno: racunovodstvo.ts:607-611. Koš 'risk' res nima zneska — moduleTypes.ts (komentar ob BucketId, vrstici 35-36: 'Kvalitativna ocena tveganja — brez EUR, ker bi bil znesek navidezno natančen'), compute diagnostike (654-672) valueEUR res ne vrne in test racunovodstvo.test.ts:196-203 to varuje. Pravilo 'tveganje se ne monetizira' je spoštovano. Obe navedeni vrzeli (manjkajoče stanje brez odgovora, tišina o B04/B05) sta resnični.

**Predlog.** Za stanje brez odgovora dodaj ločeno konstanto PROCESS_RISK_NOTE_UNANSWERED = 'Na vprašanja o procesu niste odgovorili — ocene nismo naredili.' Šele KO obstaja vprašanje o odprtih nalogah (naslednja postavka), razširi 'high' z '... Odprte naloge in izjeme niso nikjer vidne, zato se zamuda opazi šele, ko se oglasi stranka ali FURS.' in 'medium' z '... Kateri rok je danes v nevarnosti, se vidi šele ob pregledu po strankah.'

**Sklic na raziskavo:** B25 (10), B14 (11), B04 (13), B05 (13); KPI K08

**Popravek preverbe.** Ista izvedbena omejitev kot pri DATA_RISK_NOTE: nov ključ v Record<RiskLevel, string> ni mogoč, potrebna je ločena konstanta. Vrstni red je v predlogu izrecno zavezan: razširitev besedil 'high' in 'medium' o odprtih nalogah sme priti šele skupaj z vprašanjem, ki jih meri — sicer izid trdi nekaj, česar ni nihče vprašal, kar je natanko napaka, ki jo ta sklop ugotovitev odpravlja.


### 48. [manjka v diagnostikaRs] Vprašanji o vidnosti odprtih nalog in o enotnosti postopka

**Sodba:** DODAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Poskus ovržbe ni uspel. Preverjeno: diagnostikaRs ima natanko štiri polja (racunovodstvo.ts:624-653), dve merita B08, eno B25, eno B09. Modul res nima triaže (racunovodstvo.ts:620-623, potrjeno s testom racunovodstvo.test.ts:225 in s komentarjem moduleTypes.ts:220-224 'Modul brez triaže se torej nikoli ne izloči'), zato je edino mesto z zagotovljenim odgovorom. Grep po B04/B05 tematiki (enotnost postopka, odprte naloge po roku) v celotnem segmentu ne najde ničesar — ne v petih stroškovnih področjih ne v kontekstu.

**Predlog.** Dodaj dve polji z isto lestvico 0-3 (+ 'Nismo preverili'): (a) key 'taskVisibility', 'Ali kadar koli vidite, katere naloge po strankah so odprte in katere so že po roku?'; (b) key 'processStandardisation', 'Ali dva računovodji isto stranko obdelata po istem, zapisanem postopku?'. Tvorita tretji par 'Ponovljivost procesa' z riskLevelFromScore(score, 6). Če mora modul ostati pri štirih vprašanjih, (a) prevzame mesto knowsClientProfitability in se pridruži procesnemu paru z maxScore 9.

**Sklic na raziskavo:** B04 (13), B05 (13), B20 (11); KPI K07, K08

**Popravek preverbe.** Vsebinsko potrjeno, seznam posledic pa je nepopoln. Poleg summary (racunovodstvo.ts:623) in komentarja (613-619) je treba OBVEZNO popraviti tudi content/methodology.ts:253-257, kjer formula za diagnostikaRs izrecno pravi 'ocena tveganja iz štirih odgovorov — brez zneska'; ugotovitev to pogojuje s spremembo imena osi, kar ni pravilno — besedilo je napačno že ob samem povečanju števila vprašanj. Dodatno: varianta s tretjim parom podre test racunovodstvo.test.ts:197-198, ki pričakuje natanko dva izida (toHaveLength(2)), in doda tretjo kartico v RiskCard — oboje je treba načrtovati vnaprej. Varianta z zamenjavo knowsClientProfitability je zato cenejša in je skladna s postavko o tem vprašanju.


### 49. Modul E, kljukica 'Uporabljamo SQL Server 2016'

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno: legacy.ts:254-259, warningDate '2026-07-14', besedilo 'Podpora za SQL Server 2016 je potekla 14. 7. 2026 — rok je že mimo.' Ob današnjem 13. 8. 2026 je trditev resnična, icp.ts (veja soonest < 0) vrne vrednost 1,0. Nujnost je res edina dimenzija z zunanjim rokom (utež 0,10). Neodkljukano polje compute res odfiltrira (legacy.ts:286: filter na input[item.key] === 1). Kljukica res ne pozna stanja 'ne vem': allowUnknown je v ModuleInput.tsx:93 vezan izključno na kind 'number'. Vloge so v contexts/racunovodstvo.ts:88-97 (lastnik, vodja računovodstva, računovodja, davčni svetovalec) — nobena ni IT.

**Predlog.** ModuleEChecklistItem (legacy.ts:245-250) razširi z neobveznima poljema help in explainer ter ju v moduleE.fields (legacy.ts:279-284) preslikaj na polje — ModuleSection.tsx za kind 'checkbox' oboje že podpira. Za obe Microsoftovi postavki help: 'Če ne veste, vpraša skrbnik IT — v PANTHEON-u piše v Pomoč > O programu.' explainer: 'Po koncu podpore varnostnih popravkov ni več. Za računovodski servis to ni le tehnično vprašanje: baza s podatki strank brez varnostnih popravkov je tveganje po GDPR in za revizijsko sled.'

**Sklic na raziskavo:** B22 (10), B25 (10), B24 (10)

**Popravek preverbe.** Rationale drži v celoti; nemogoč je zadnji stavek predloga. 'V prodajni pripravi neodkljukane postavke izpiši kot ni odgovora' ni popravek besedila, ampak nova funkcionalnost: modul E je iz seznama področij v prodajni pripravi izrecno izločen (salesReport.ts:327-328, filter definition.id !== 'E'), zato njegova polja v tabeli odgovorov sploh ne nastopajo — niti kot 'ni tveganja' niti kot karkoli drugega. Izvedljiva različica: v prodajno pripravo dodaj ločen odstavek o modulu E, ki uporabi obstoječo, a nikjer neuporabljeno funkcijo wasTechnicalRiskModuleShown (salesReport.ts:533) in izpiše, katere postavke so bile prikazane in katere niso bile odkljukane. Dodatno: explainers.test.ts zahteva explainer povsod, kjer je help, zato morata biti obe besedili dodani hkrati.


### 50. Modul E, kljukica 'Uporabljamo Windows Server 2016'

**Sodba:** OHRANI · **Resnost:** nizka · **Status:** potrjeno

**Utemeljitev.** Preverjeno v celoti: legacy.ts:260-265, warningDate '2027-01-12', besedilo 'Podpora za Windows Server 2016 se konča 12. 1. 2027.' Od 13. 8. 2026 je to 152 dni, kar pade v vejo soonest <= 365 z vrednostjo 0,8 — izračun ugotovitve je točen. Izid gre v koš 'risk' brez valueEUR (legacy.ts:288-291), kar spoštuje pravilo, da se tveganje ne monetizira. Modul res nima triaže, zato ne tekmuje za mesto med tremi izmerjenimi področji.

**Sklic na raziskavo:** B22 (10)

**Popravek preverbe.** Sodba 'ohrani' velja za VSEBINO postavke (besedilo, datum, koš, odsotnost evra). Ni pa postavka brez pomanjkljivosti: manjkajoča help/explainer in nemožnost odgovora 'ne vem' jo zadevata enako kot postavko o SQL Serverju — kar ugotovitev sama pravilno pripiše tja ('velja za obe Microsoftovi postavki'). Obe sodbi sta zato skladni in se ne izključujeta; pri izvedbi je treba popravek iz prejšnje postavke uporabiti tudi tu.


### 51. Modul E, kljukica 'Nimamo urejenega kanala za e-račune' (ZIERDED)

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno: legacy.ts:266-272. Polariteta drži — to je res edina zanikana trditev med tremi (legacy.ts:256, 262, 268). Opozorilo res govori le o izdani strani ('brez urejenega e-računa vam kupec preprosto ne bo mogel plačati'). Komentar legacy.ts:252 res pravi, da je modul enak za vse segmente. Napačna pa je navedena številka: warningDate je '2028-01-01', kar je od danes več kot 365 dni, zato ta postavka sama nujnosti ne dvigne na 0,8, ampak na 0,5 (veja 'Najbližji rok čez X dni — čas še je'). Razpon je torej 0,2 → 0,5, ne 0,2 → 0,8.

**Predlog.** Namesto obrata kljukice postavko spremeni v kind 'choice': 'Ali imate urejen kanal za prejem in izdajo e-računov?' z možnostmi 0 'Da, za prejem in izdajo', 1 'Delno — samo za izdajo', 2 'Ne', 3 'Ne vem' (unknown: true, privzetek). Opozorilo in vpis v deadlineDates nastaneta pri vrednostih 1 in 2, ne pri 3. Na ModuleEChecklistItem dodaj neobvezno warningTextBySegment; za računovodstvo: 'Od 1. 1. 2028 velja ZIERDED. Za servis to ni en račun, ampak vsi računi vseh strank: kar danes prihaja po e-pošti in v papirju, mora priti po kanalu, ki ga je treba za vsako stranko posebej pripraviti — globa do 3.000 EUR je ob tem obrobna.'

**Sklic na raziskavo:** B21 (10), B23 (10), B02 (14), B01 (14)

**Popravek preverbe.** Dva popravka. (1) Številka: prestavitev je 0,2 → 0,5, ne 0,2 → 0,8 (rok 1. 1. 2028 je čez več kot 365 dni, icp.ts vrne 0,5). (2) Predlagani obrat polaritete kljukice je treba ZAVRNITI: pri obrnjenem pogoju bi opozorilo nastalo pri privzeti vrednosti 0, torej bi vsak obiskovalec, ki se polja ne dotakne, tiho dobil trditev, da kanala nima — to je ista napaka, ki jo ta pregled graja pri privzetkih diagnostike, le v drugo smer. Prehod na 'choice' z izrecnim 'Ne vem' odpravi tako polariteto kot odsotnost stanja 'ne vem' in ne ustvari nobene neizrečene trditve. Filter za deadlineDates v salesReport.ts:367-369 ('=== 1') je treba ob tem prilagoditi novim vrednostim.


### 52. Vidnost ZIERDED kljukice: modul E se prikaže samo strankam PANTHEON (isTechnicalRiskModuleVisible) in posledice za dimenzijo urgency

**Sodba:** PREMAKNI · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno in v bistvenem potrjeno. contexts/index.ts:48-62 res skrije CEL modul E vsakomur, čigar sedanji sistem ni PANTHEON. icp.ts (veja deadlineDates.length === 0) res vrne 0,2 z opombo, ki sama priznava, da 'to ni nujno podatek o podjetju'. Utež nujnosti je 0,10. salesReport.ts:367-369 datume bere izključno iz MODULE_E_ITEMS in params.values.E. Trditev, da motor nima pogojnega prikaza posameznega polja, drži — ModuleDefinition (moduleTypes.ts:215-232) pozna le triage, fields in compute, showIf ne obstaja.

**Predlog.** Izberi cenejšo od dveh predlaganih poti: na ModuleEChecklistItem dodaj pantheonOnly?: true (nastavljen na obeh Microsoftovih postavkah), moduleE.fields filtriraj po njej, isTechnicalRiskModuleVisible pa preoblikuj tako, da modul E prikaže VSEM, ne-PANTHEON servisu pa samo z vprašanjem o e-računih. Opombo v icp.ts (veja brez datumov) nato popravi, ker ne bo več resnična. Selitev v skupni kontekstni korak pusti kot rezervo.

**Sklic na raziskavo:** B21 (10), B23 (10), B22 (10); KPI K18

**Popravek preverbe.** Dva popravka. (1) Ugotovitev je preveč prizanesljiva do wasTechnicalRiskModuleShown: funkcija posledice ne 'priznava', ampak je mrtva koda — definirana je v salesReport.ts:533, grep po src in content pa ne najde nobenega klicatelja. Prodajnik torej danes ne dobi niti opombe. (2) Predlog je preusmerjen na alternativo, ker je selitev vprašanja v kontekstni korak dražja, kot ugotovitev navaja: SegmentContext ima zaprto obliko (businessType, currentSystem, role, operationalHour, adminHour, annualRevenue, contributionMargin) in poljubnega vprašanja ne sprejme — potrebna bi bila razširitev tipa, koraka in vseh sedmih kontekstov. Zastavica pantheonOnly ostane znotraj obstoječih tipov in reši isti problem.


### 53. Modul E kot celota — naslov 'Tvegani stroški', ročno pisana besedila rokov, odsotnost stanja 'ne vem'

**Sodba:** IZBOLJŠAJ · **Resnost:** nizka · **Status:** potrjeno

**Utemeljitev.** Preverjeno: legacy.ts:275-294. Trije izidi so v košu 'risk' brez valueEUR, modul nima triaže in se prikaže vedno (kadar je sploh viden). Neskladje slovničnega časa je dobesedno potrjeno: legacy.ts:258 'je potekla 14. 7. 2026 — rok je že mimo' proti legacy.ts:264 'se konča 12. 1. 2027'. Naslov 'Tvegani stroški' je na legacy.ts:277, summary 'Roki, ki vas dohitijo, tudi če danes vse deluje.' na 278 — naslov res obljublja evre, ki jih modul namenoma ne proizvede.

**Predlog.** V MODULE_E_ITEMS hrani samo nevtralni del besedila ('Podpora za SQL Server 2016 se konča 14. 7. 2026'), slovnični čas pa izpelji ob izrisu iz warningDate. Za to je treba funkcijo daysUntil (icp.ts:164) izvoziti ali preseliti v skupno knjižnico — trenutno je zasebna. Naslov preimenuj v 'Tveganja z rokom' ali 'Roki, ki vas dohitijo'; niz 'Tvegani stroški' se pojavi samo na legacy.ts:277, zato je preimenovanje varno (v content/methodology.ts in content/actions/actions.ts modul 'E' vnosa nima). Polj, košev in izračuna ne spreminjaj.

**Sklic na raziskavo:** §4.4; B22 (10)

**Popravek preverbe.** Sklici in besedila držijo. Dodani sta dve izvedbeni podrobnosti, ki ju ugotovitev izpušča: daysUntil je zasebna funkcija v icp.ts in je pred ponovno uporabo ni mogoče preprosto poklicati; preimenovanje naslova pa nima nobenega drugega odjemalca, ker je id modula ('E') ločen od naslova in ga methodology/actions ne uporabljata.


---

# Val 2 — koraki 1–5, horizontali, vrzeli

## Področje: Koraki 1–5 vprašalnika (dejavnost, zaposleni, kontekst, triaža, skupna finančna osnova) — segment racunovodstvo

### 54. Korak 1: "S čim se ukvarja vaše podjetje?" — možnost 'Računovodski servisi' (src/config/industries.ts:28)

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno: 'racunovodstvo' je res v industries.ts:28, 'storitve' v :29, 'drugo_storitve' s choiceLabel "Zaračunavamo ure, projekte ali storitve" v :76-79, getSegmentForIndustry v :111-113. Ključna trditev drži: choiceLabel se v glavnem seznamu NE izriše — StepIndustry.tsx izpiše {industry.label} v vrstici 77 (map je 75-79, vrstica 74 je "Izberite …"), industryChoiceLabel se uporabi samo pri pod-dejavnostih (StepIndustry.tsx:104). Napačna izbira res določi celoten nadaljnji vprašalnik. Severity znižam z visoke na srednjo: "Računovodski servisi" je uveljavljen izraz in knjigovodski biro se v njem prepozna; hipoteza, da servis z davčnim svetovanjem izbere 'storitve', je verjetna, a nepodprta — dokazana je le pot prek 'Drugo → Zaračunavamo ure, projekte ali storitve'.

**Predlog.** 1) V industries.ts:28 dodaj choiceLabel: 'Vodimo knjige, obračune in plače za druge (računovodski servis, knjigovodski biro, davčno svetovanje)'; label 'Računovodski servisi' ostane za CRM. 2) V :29 dodaj choiceLabel: 'Prodajamo ure in projekte (agencija, IT, inženiring, gradbeništvo)'. 3) V StepIndustry.tsx:77 zamenjaj {industry.label} z {industryChoiceLabel(industry)} — funkcija je že uvožena (vrstica 7), sprememba je enovrstična in choiceLabel s tem sploh začne delovati v glavnem seznamu. 4) V DRUGO_SUB_INDUSTRIES pri 'drugo_storitve' (:78) razširi choiceLabel na 'Zaračunavamo ure, projekte ali storitve (ne vodimo knjig za druge)'. Oznake za CRM (label) se ne spreminjajo, zato pozicijskih preslikav v izvozu to ne premakne.

**Sklic na raziskavo:** §3.1 (4.397 aktivnih subjektov SKD 69.200); §6.1 kvalifikacija

**Popravek preverbe.** Popravljen sklic: izpis oznake je StepIndustry.tsx:75-79, sama oznaka v vrstici 77 (ne 74-76). Severity znižana z 'visoka' na 'srednja' — pot prek 'Drugo' je dokazana, neposredna zamenjava 'Računovodski servisi' ↔ 'Storitvena podjetja' pa je hipoteza. Predlogu dodan konkreten popravek pod-dejavnosti 'drugo_storitve' in opozorilo, da se label (CRM) ne sme spreminjati.


### 55. Korak 2: "Koliko ljudi zaposlujete?" (src/components/Calculator/StepEmployeeCount.tsx:26)

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Vsa štiri vstopna mesta preverjena in potrjena: plausibility.ts (HOURS_PER_EMPLOYEE_PER_MONTH = 160 v :18, PLAUSIBLE_CAPACITY_SHARE = 0,4 v :27, uporaba v :67 in :75), icp.ts:168-180 (dimenzija 'size', utež 0,2), icp.ts:130-135 (dealSizeLabel) in sizeClasses.ts:21 (getSizeClass). Trditev pod poljem "Podatek na izračun ne vpliva" (StepEmployeeCount.tsx:44-47) je zato res zastarela — ista številka sproži opozorilo o neverjetnosti in nosi 20 % ICP. SIZE_FIT (icp.ts:75-80) res postavi 1–9 zaposlenih na 0,35, kar je 0,65 × 0,2 = 13 od 100 točk. Polje je type=number, min=1, brez decimalk (StepEmployeeCount.tsx:30-39), zato štirje polovični zaposleni vpišejo 4 in dobijo 640 h kapacitete.

**Predlog.** 1) StepEmployeeCount.tsx:44-47 → 'Podatek ne vstopa v noben znesek — iz njega izpeljemo velikostni razred in preverimo, ali so vnesene ure skladne z velikostjo ekipe.' 2) Naslov (:26) → 'Koliko ljudi dela v servisu, preračunano na polni delovni čas?'; pod poljem help 'Polovična zaposlitev šteje 0,5. Štejte tudi lastnika, če dela na strankah, in redne zunanje sodelavce.'; na inputu dodaj step={0.5} in min={0.5} (getSizeClass in dealSizeLabel z decimalko delujeta brez sprememb, plausibility prav tako). 3) SIZE_FIT naj postane segmentno občutljiv: v IcpSignals (icp.ts:21-50) dodaj polje segment: SegmentId, za 'racunovodstvo' uporabi 1–4 → 0,8 · 5–15 → 1,0 · 16–50 → 1,0 · nad 50 → 0,6, z opombo 'Pri servisu je merilo obsega število strank, ne zaposlenih.' Uteži ostanejo nespremenjene, zato test o vsoti uteži 1 ne pade.

**Sklic na raziskavo:** §3.1 (4.077,5 FTE pri 2.705 izvajalcih z izkazi ≈ 1,5 FTE; segmenti S1 1 oseba/20–80 strank, S2 2–4 FTE/40–150, S3 5–15 FTE/100–350, S4 16–50 FTE/250–1.000 — vrstice 95–98 raziskave)

**Popravek preverbe.** Popravljen izračun v rationale: 4.077,5 FTE se v raziskavi nanaša na 2.705 izvajalcev, ki so oddali izkaze, ne na vseh 4.397 subjektov. 4.077,5 / 4.397 = 0,93 FTE, ne 1,5. Pravilna izpeljava je 4.077,5 / 2.705 = 1,51 FTE — sklep (tipičen servis pade v razred 1–9 in izgubi 13 točk) ostane. ResearchRef popravljen: oznak K12/K13 raziskava ne uporablja, podatki so v §3.1 in tabeli §8.1. Predlogu dodani manjkajoče izvedbene podrobnosti (min/step na inputu, tip polja segment v IcpSignals).


### 56. Korak 2 (dodatno): manjka "Koliko strank redno vodite?"

**Sodba:** DODAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Potrjeno v celoti. Naslovna številka je ResultsView.tsx:86-88 (+{accountingCapacity.toFixed(1)} strank brez nove zaposlitve), izračun CalculatorFlow.tsx:272-278 → calculations.ts:71-77 (hoursFreedPerMonth / avgHoursPerClientPerMonth). Grep za clientCount/steviloStrank po vsem src ne najde ničesar — polja res ni nikjer, tudi ne v BasicInfo (types.ts:1-6). Delitelj hoursPerClientPerMonth obstaja le v donosnostRs (modules/racunovodstvo.ts:546, contextOnly, default 8), rezerva pa v segments.ts:246. Potrjena je tudi zgornja meja: moduleEngine.ts:66-68 sešteje capacityHoursPerMonth kot surove output.hoursPerMonth, brez addressableShare in brez pasu izboljšave — naslov torej stoji na BRUTO urah. Dodatno najdeno: toFixed(1) v ResultsView.tsx:87 izpiše '+3,7 stranke' — lažna natančnost pri številu strank.

**Predlog.** DODAJ ZDAJ (majhen poseg): 1) V BasicInfo (types.ts:1-6) dodaj clientCount: number. 2) Korak 2 vpraša dve številki na isti strani: 'Koliko ljudi dela v servisu (FTE)?' in 'Koliko strank redno vodite?', help pri drugi: 'Redne mesečne stranke, ne enkratni posli in ne enkratne izdelave zaključnih računov.' 3) Nov stolpec 'clientCount' NA KONEC CSV_COLUMNS (exportRecord.ts:146-197 — datoteka sama zahteva dodajanje na konec zaradi pozicijskih preslikav). DODAJ KMALU: 4) Naslovno številko izpiši kot celo število in relativno: '+X strank (≈ Y % vaše baze) brez nove zaposlitve' — Math.round namesto toFixed(1) v ResultsView.tsx:87. 5) plausibility.ts razširi z okvirno preverbo: če clientCount × hoursPerClientPerMonth > FTE × 160, je nekonsistenten že sam okvir, ne šele vnesene ure.

**Sklic na raziskavo:** §3.1 (S1 20–80, S2 40–150, S3 100–350, S4 250–1.000 strank); §4.4 (kapaciteta kot poslovni rezultat: bruto prihranek ur ≠ denarna realizacija); §9.2 (sprejetje pri strankah 45–80 %)

**Popravek preverbe.** Odstranjena napačna omejitev iz predloga: 'X ne sme preseči (FTE × 160 − stranke × ure na stranko) / ure na stranko' je vsebinsko napačna — sproščene ure nastanejo ZNOTRAJ obstoječe obremenitve, zato bi pri polno zasedenem servisu ta formula vedno vrnila 0 in izničila celotno naslovno številko. Pravilna meja je že sama formula (sproščene ure / ure na stranko); smiselna dodatna varovalka je le konsistenčna preverba clientCount × hoursPerClientPerMonth ≤ FTE × 160, ki je v predlogu ohranjena. Dodana najdba, ki je pregledovalec ni navedel: toFixed(1) v ResultsView.tsx:87 je lažna natančnost. Predlog razdeljen na 'dodaj zdaj' (polje + CSV) in 'dodaj kmalu' (naslovna številka + plausibility).


### 57. Korak 3: "Kakšna je pretežna struktura vaših strank?" (src/config/contexts/racunovodstvo.ts:53-61)

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Potrjeno: businessType ne vstopa v nobeno formulo (StepContext.tsx:31-40 to izrecno pove), pojavi se le kot oznaka 'Pretežno dela' v salesReportHtml.ts:308 in pdfSales.ts:131, kot polje qualification.businessTypeLabel v salesReport.ts:287 in kot stolpec 'businessType' v izvozu (exportRecord.ts:173, vrednost :247). V salesPlaybook.ts ga med sprožilci res ni. Potrjeno je tudi, da pet možnosti ni na isti osi: 'mikro'/'malaSrednja'/'mesano' merijo velikost strank, 'panozno' specializacijo, 'svetovanje' lastno ponudbo, radio pa dovoli enega (StepContext.tsx:64-78). Polje NI mrtvo — polni prodajno poročilo in izvoz — zato 'odstrani' ne bi bilo pravilno; 'izboljsaj' je prava sodba.

**Predlog.** Omeji na eno os (velikost strank): 'mikro' → 'Pretežno s.p. in mikro podjetja (do 10 zaposlenih)' · 'malaSrednja' → 'Pretežno mala in srednja podjetja (10 in več)' · 'mesano' → 'Mešano — obojih približno enako'. Možnosti 'panozno' in 'svetovanje' odstrani iz businessType in ju prenesi med prodajne oznake ob oddaji obrazca (dve neodvisni kljukici, ki gresta v salesReport.qualification in v nova stolpca na koncu CSV_COLUMNS) — sta ponudba, ne struktura strank. Id-ji 'mikro'/'malaSrednja'/'mesano' se ohranijo, da zgodovina stolpca 'businessType' v CRM ostane berljiva.

**Sklic na raziskavo:** §7.1 vrstica 23 'različna digitalna zrelost strank' (prednost 10); §3.1 segmentacija S1–S4

**Popravek preverbe.** Iz predloga odstranjena alternativa 'Koliko strank vam listine odda v strukturirani obliki (e-računi, bančni izpiski, povezava s programom)?' — to podvaja obstoječe polje deliveryMethod v strankeRs (modules/racunovodstvo.ts:213-224, contextOnly, štiri možnosti: portal/samodejna izmenjava · e-pošta v dogovorjeni obliki · e-pošta vsak po svoje · osebno/papir), ki natanko to že meri. Če je treba pripravljenost na ZIERDED 2028 izpostaviti, se to naredi z izpisom deliveryMethod v prodajni pripravi, ne z novim vprašanjem. Dodano opozorilo o ohranitvi id-jev zaradi zgodovine CRM-stolpca.


### 58. Korak 3: "Kako danes vodite servis?" (src/config/contexts/racunovodstvo.ts:63-86)

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Potrjeno dobesedno. Pasovi: 'pantheonZajem' 0,08–0,20 (:69), 'pantheonRocno' 0,15–0,30 (:75), 'drugProgram' 0,15–0,30 (:78), 'programExcel' 0,25–0,40 (:82), 'rocno' 0,25–0,40 (:84) — pet možnosti, trije različni pasovi, dve izbiri brez učinka. Učinek pasu je potrjen na treh mestih: improvementBandFor (contexts/index.ts:39-46) množi naslovljivi znesek, icp.ts:182-209 (dimenzija 'opportunity', utež 0,2, preslikava (band−0,08)/0,32) in isTechnicalRiskModuleVisible (contexts/index.ts:56-62) za vidnost modula E. Predlagana lestvica po zajemu listin je skladna z varovali v contexts.test.ts: min>0, min<max, max<1 (test 'pas izboljšave je smiseln in ne obljublja preveč'), FALLBACK_IMPROVEMENT_BAND.max = 0,30 < najširši 0,40 (test 'nadomestni pas ni ugodnejši'), vsaj ena možnost isPantheon in unikatni id-ji.

**Predlog.** Lestvica po načinu VSTOPA listin, pet možnosti in pet različnih pasov: 'pantheonZajem' 'PANTHEON s samodejnim zajemom listin in izmenjavo dokumentov s strankami' 0,08–0,20 (isPantheon: true) · 'pantheonRocno' 'PANTHEON, listine vnašamo ročno' 0,15–0,28 (isPantheon: true) · 'drugProgramZajem' 'Drug računovodski program s samodejnim zajemom listin' 0,12–0,25 · 'drugProgram' 'Drug računovodski program, listine vnašamo ročno' 0,20–0,33 · 'programExcel' 'Program, ob njem Excel in papir; s strankami si dokumente izmenjujemo po e-pošti' 0,25–0,40. Id-ja 'pantheonZajem', 'pantheonRocno', 'drugProgram' in 'programExcel' se ohranita, nov je le 'drugProgramZajem', odpade 'rocno' — tako ostane stolpec 'currentSystem' v CRM primerljiv nazaj. Preveri, da ostanejo vsi pasovi znotraj 0,08–0,40, ker icp.ts:197 na ta razpon normalizira dimenzijo 'priložnost'.

**Sklic na raziskavo:** §7.1 vrstice 1–3 (pozni/manjkajoči dokumenti, dokumenti po e-pošti in papirju, ročni prepis podatkov — vse prednost 14); §15.1 e-računi 2028

**Popravek preverbe.** Sklic na pasove natančneje: racunovodstvo.ts:63-86, posamezni pasovi v vrsticah 69, 75, 78, 82, 84 (ne 72-85). V predlogu ohranjeni obstoječi id-ji namesto novih ('drugProgramRocno' → 'drugProgram', 'programExcelPapir' → 'programExcel'), ker gre id v izvozni stolpec 'currentSystem' in bi preimenovanje prekinilo zgodovino v CRM. Dodana zahteva, da vsi pasovi ostanejo v razponu 0,08–0,40 zaradi normalizacije v icp.ts:197. Preverjeno in potrjeno, da predlog ne podre nobenega od štirih testov v contexts.test.ts.


### 59. Korak 3: "Kakšna je vaša vloga?" (src/config/contexts/racunovodstvo.ts:88-97)

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** potrjeno

**Utemeljitev.** Potrjeno dobesedno. ROLE_FIT (icp.ts:89-105) pozna 'direktor'/'lastnik' (1,0), 'finance' (0,8) in predpono 'vodja' (0,6) — 'vodjaRacunovodstva' se ujame, 'racunovodja' in 'davcni' pa padeta na ROLE_FALLBACK (icp.ts:107-110) z besedilom "Vloge ni navedel ali je izbral "Drugo" — kdo odloča, ni znano.", kar je za človeka, ki je vlogo jasno navedel, neresnična poved v prodajni pripravi. Utež dimenzije je 0,15 (icp.ts:233-242), zato je razlika do lastnika 0,65 × 0,15 ≈ 10 od 100 točk. Peta možnost s freeText je res varovana s testom 'vsaka dejavnost ponudi vlogo z lastnim vpisom, drugod vpisa ni', obvezen vpis pa s StepContext.tsx:45-51.

**Predlog.** 1) racunovodstvo.ts:91 → 'Lastnik/-ica ali direktor/-ica servisa (tudi če sami vodite knjige)'. 2) V ROLE_FIT (icp.ts:89-105) dodaj pred padec na privzetek: { match: (id) => id === 'davcni', value: 0.7, note: 'Davčni svetovalec — strokovna avtoriteta, o nakupu pogosto soodloča.' } in { match: (id) => id === 'racunovodja', value: 0.45, note: 'Izvajalec: proces pozna najbolje, o nakupu praviloma ne odloča sam.' }. 3) ROLE_FALLBACK iz konstante spremeni v funkcijo roleFallback(roleId): pri roleId === null ostane sedanje besedilo, sicer 'Navedene vloge merila ne poznajo — kdo odloča, ni znano.' Popravek zahteva spremembo icp.ts:237-241, ker se danes vrača ista konstanta v obeh vejah.

**Sklic na raziskavo:** §5 tabela oseb (lastnik/direktor, vodja računovodstva, operativni računovodja, obračunovalec plač — vsak s svojim ciljem in ugovorom); §3.1 (S1 solo izvajalec)

**Popravek preverbe.** Sklici popravljeni le za vrstico: dimenzija 'role' je icp.ts:233-242 (ne 234-243), ROLE_FIT icp.ts:89-105. Vsebinsko brez popravkov. Opozorilo za izvedbo: dvig 'davcni' na 0,7 ne spremeni ugovora 'notMyDecision' — salesPlaybook.ts:177-178 se odloča po regexu /direktor|lastnik/i nad roleLabel, zato bo davčni svetovalec še naprej sprožil ta ugovor; če to ni želeno, je treba popraviti tudi to vrstico, sicer ICP in ugovor trdita nasprotno.


### 60. Korak 4, zajemRs: "Koliko dela pri vas še vedno pomeni ročni vnos in prepisovanje listin?" (src/config/modules/racunovodstvo.ts:51-59)

**Sodba:** IZBOLJŠAJ · **Resnost:** nizka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Delno ovrženo. Dejanske možnosti so: 0 'Večina se zajame samodejno', 1 'Nekaj ur tedensko', 2 'Vsak dan po več ur', 3 'To je glavnina dela ekipe'. Možnosti 1–3 torej ŽE merijo obseg in so že skoraj identične predlaganim — edina, ki meša merilo, je možnost 0, ki opisuje način dela. Trditev, da je način dela podvojen s korakom 3, drži (contexts/racunovodstvo.ts:63-86), a se podvojitev nanaša samo na to eno možnost. Ostane torej popravek ene vrstice, ne prenova lestvice; zato severity z 'srednja' na 'nizka'. Potrjeno pa je, da ocena krmili selectTopModules (moduleEngine.ts:192-210) in se prepiše v prodajno pripravo (salesReport.ts:312-320).

**Predlog.** Spremeni samo možnost 0 (modules/racunovodstvo.ts:54): 'Večina se zajame samodejno' → 'Skoraj nič — listine pridejo strukturirane in se knjižijo same'. Možnosti 1–3 in naslov ostanejo nespremenjeni; prepis v 'Nekaj ur na teden' / 'Vsak dan po nekaj ur' bi bil kozmetičen in bi po nepotrebnem razveljavil primerljivost že zbranih ocen.

**Sklic na raziskavo:** §7.1 vrstica 3 'ročni prepis podatkov iz računov' (14) in vrstica 2 'dokumenti po e-pošti, papirju, mapah in sporočilih' (14)

**Popravek preverbe.** Predlog skrčen z vseh štirih možnosti na eno: obstoječe možnosti 1–3 ('Nekaj ur tedensko', 'Vsak dan po več ur', 'To je glavnina dela ekipe') že merijo obseg in se od predlaganih ločijo le po besednem redu. Severity znižana z 'srednja' na 'nizka'. Popravljen sklic na prodajno pripravo: salesReport.ts:312-320 (ne 316-324). Pregledovalčevi navedki možnosti niso dobesedni ('Nekaj ur na teden' proti dejanskemu 'Nekaj ur tedensko').


### 61. Korak 4, strankeRs: "Koliko časa porabite za lovljenje listin in odgovarjanje strankam?" (src/config/modules/racunovodstvo.ts:171-179)

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** potrjeno

**Utemeljitev.** Potrjeno. Dejanske možnosti: 0 'Stranke oddajajo pravočasno in urejeno', 1 'Občasno je treba opomniti', 2 'Vsak mesec veliko usklajevanja', 3 'Lovljenje listin je stalnica' — naslov sprašuje po času, možnosti 0 in 1 pa merita vedenje strank, 2 in 3 sta ohlapno mešani. Potrjeno je tudi, da selectTopModules (moduleEngine.ts:203-206) ocene med področji primerja kot navadna števila in ob izenačenju odloči vrstni red prikaza, zato neenaka mera odloča, katero področje bo sploh izmerjeno. Potrjeno, da polje za vedenje strank že obstaja: lateClientsSharePercent (modules/racunovodstvo.ts:201-209, contextOnly, help 'Podatek ne vstopa v izračun — služi za oceno obsega težave').

**Predlog.** Zamenjaj možnosti (modules/racunovodstvo.ts:173-178): 0 'Skoraj nič — listine pridejo pravočasno' · 1 'Nekaj ur na mesec' · 2 'Nekaj ur na teden' · 3 'Vsak mesec več dni lovljenja'. Naslov ostane nespremenjen, ker pravilno sprašuje po času. Vedenje strank ostane, kjer je — v contextOnly polju lateClientsSharePercent in v deliveryMethod (:213-224).

**Sklic na raziskavo:** §7.1 vrstica 1 'pozni in manjkajoči dokumenti' (14) in vrstica 6 'ročno opominjanje strank' (13)

**Popravek preverbe.** Brez vsebinskih popravkov. Dopolnjeno: možnosti 2 in 3 nista čisto merilo vedenja ('Vsak mesec veliko usklajevanja' že nakazuje obseg), zato je neskladje omejeno na možnosti 0 in 1 — predlog to kljub temu pravilno reši za vse štiri. Sklic na primerjavo ocen natančneje: moduleEngine.ts:203-206.


### 62. Korak 4, obracuniRs: "Kako pogosto se obračuni in oddaje rešujejo v zadnjem trenutku?" (src/config/modules/racunovodstvo.ts:271-279)

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Potrjeno, da lestvica meri frekvenco: 0 'Roke držimo brez konic', 1 'Nekajkrat letno', 2 'Vsak mesec ob DDV in plačah', 3 'Skoraj vedno' — možnost 2 je za vsak servis normalno stanje in bo skoraj vedno izbrana. Potrjeno tudi, da modul pod tem vprašanjem meri obseg: overtimeHoursPerMonth (:283) in reportPrepHoursPerMonth (:290), oboje v h/mesec. Potrjeno, da vrstni red v segments.ts:227-237 postavi 'obracuniRs' pred 'popravkiRs' in da katalog bolečin daje popravkom (13) prednost pred konicami ob rokih (11). OVRŽENA pa je trditev, da je to edino od sedmih vprašanj s frekvenčno lestvico — popravkiRs (:392-400) meri frekvenco enako, kar pregledovalec v naslednji ugotovitvi tudi sam ugotovi.

**Predlog.** Naslov (modules/racunovodstvo.ts:272) → 'Koliko dodatnega dela nastane ob rokih (DDV, plače, zaključki)?' Možnosti (:274-277): 0 'Roke držimo brez konic' · 1 'Nekaj nadur na mesec' · 2 'Nekaj dni nadur vsak mesec' · 3 'Teden ali več vsak mesec, redno tudi vikendi'. Sprememba ne posega v polja modula in ne v compute.

**Sklic na raziskavo:** §7.1 vrstica 15 'zadnje spremembe pri plačah' (11); §8.1 KPI 'Dnevi do mesečnega zaključka' in 'Naloge po roku'

**Popravek preverbe.** Ovržena trditev 'Edino od sedmih vprašanj, ki meri FREKVENCO dogodka' — popravkiRs ima enako frekvenčno lestvico ('Redko / Mesečno / Tedensko / Stalno', modules/racunovodstvo.ts:393-398). Pravilno je: dve od sedmih lestvic merita frekvenco. Sklic na vrstni red popravljen na segments.ts:227-237 (potrjen) in na dejansko trojico v katalogu. Ostalo potrjeno.


### 63. Korak 4, popravkiRs: "Kako pogosto je treba popravljati knjižbe, obračune ali že oddane obrazce?" (src/config/modules/racunovodstvo.ts:392-400)

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** potrjeno

**Utemeljitev.** Potrjeno dobesedno: možnosti so 'Redko' (0), 'Mesečno' (1), 'Tedensko' (2), 'Stalno' (3), polji modula pa sta correctionHoursPerMonth (:403) in reviewHoursPerMonth (:411), obe v urah — enota vprašanja in enota odgovora se res ne ujemata. Potrjeno, da je 'popravkiRs' četrti v moduleIds (segments.ts:227-237) in da segment nima defaultIds (segments.ts:241 ima le recommendedCount: 3), zato ob nedotaknjeni triaži pade ven. Potrjeno tudi, da polje defaultIds v shemi obstaja (segments.ts:42) in ga trije drugi segmenti že uporabljajo (:117, :148-149, :179-180).

**Predlog.** 1) Naslov (:393) → 'Koliko dela nastane s popravljanjem knjižb, obračunov in že oddanih obrazcev?' Možnosti (:395-398): 0 'Skoraj nikoli' · 1 'Nekaj ur na mesec' · 2 'Nekaj ur na teden' · 3 'Vsak dan nekdo popravlja'. 2) Privzeto trojko uskladi prek defaultIds in NE s prerazporeditvijo moduleIds: segments.ts:241 → triage: { recommendedCount: 3, defaultIds: ['zajemRs', 'strankeRs', 'popravkiRs'] }. Prerazporeditev moduleIds bi hkrati spremenila vrstni red prikaza, razvrstitev v PDF-ju in razreševanje 'največje postavke' (moduleEngine.ts:184-186 to izrecno prepoveduje kot razlog za premik).

**Sklic na raziskavo:** §7.1 vrstica 7 'preveč popravkov zaradi slabih vhodov' (13) in vrstica 5 'nepregledne izjeme in odprte naloge' (13) proti vrstici 15 (11)

**Popravek preverbe.** Brez vsebinskih popravkov; vse navedene vrstice preverjene in točne. Predlog konkretiziran: od dveh ponujenih poti ('prestavi popravkiRs pred obracuniRs' ALI 'nastavi defaultIds') je izvedljiva samo druga — komentar v moduleEngine.ts:184-186 izrecno pove, da vrstni red prikaza razrešuje tudi 'največjo postavko' in vrstni red v PDF-ju in ga ni dovoljeno premikati zaradi privzete izbire. Dodano, da je polje defaultIds v shemi že na voljo (segments.ts:42).


### 64. Korak 4, donosnostRs: "Koliko dela opravite, a ga ne zaračunate?" (src/config/modules/racunovodstvo.ts:498-506)

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Potrjeno dobesedno: možnosti 0 'Zaračunamo skoraj vse', 1 'Nekaj dodatnega dela', 2 'Precej dela ostane nezaračunanega', 3 'Cenik že dolgo ne pokriva dejanskega obsega' — zadnja je sodba o ceniku in ne obseg. Potrjena je tudi bistveno hujša posledica: hoursPerClientPerMonth (:546, contextOnly, default 8) je delitelj naslovne številke (CalculatorFlow.tsx:272-278: resolvedValues.donosnostRs?.hoursPerClientPerMonth || segment.accountingCapacity.avgHoursPerClientPerMonth), rezerva 8 h pa je v segments.ts:244-246. Če področje v triaži ne pade med izbrana, vprašanja ni in naslov stoji na naši predpostavki — komentar v segments.ts:244-245 to sam prizna.

**Predlog.** 1) Lestvica po obsegu (:500-505): 0 'Zaračunamo skoraj vse' · 1 'Nekaj ur na mesec ostane nezaračunanih' · 2 'Nekaj ur na teden' · 3 'Redno več dni na mesec'. 2) Sodbo o ceniku prestavi v diagnostikaRs kot PETO polje s contextOnly: true (kind: 'choice', 'Ali pavšal pokriva dejanski obseg dela?' — Da, zanesljivo / Večinoma / Le približno / Ne). ContextOnly je nujno: compute diagnostikaRs (:652-655) sestavi natanko dva rezultata iz fiksnih parov (knowsHoursPerClient + knowsClientProfitability, auditTrail + keyPersonIndependence, oba prek riskLevelFromScore(x, 6)); peto polje brez contextOnly bi zahtevalo prenovo obeh ocen tveganja. 3) Vprašanje hoursPerClientPerMonth prikaži ne glede na triažo — skupaj s številom strank v koraku 2, po isti poti kot clientCount; rezerva v segments.ts:246 ostane samo za nazaj združljivost.

**Sklic na raziskavo:** §7.1 vrstica 8 'težko merjenje donosnosti stranke' (12) in vrstica 12 'nejasen obseg v mesečnem pavšalu' (11); §4.3 'nerevidiran obseg storitev in izredne naloge v pavšalu'

**Popravek preverbe.** Predlog konkretiziran tam, kjer bi sicer zahteval dodatno odločitev: novo polje v diagnostikaRs mora biti contextOnly: true, sicer trči ob fiksno parno logiko compute (modules/racunovodstvo.ts:652-655, riskLevelFromScore(vsota, 6)) in bi tiho spremenilo obe oceni tveganja. Dodano tudi, da ostane rezerva v segments.ts:246 — brisati je ni dovoljeno, ker CalculatorFlow.tsx:275-277 nanjo pade tudi pri vpisani ničli. Trdo pravilo 'tveganje se ne monetizira' je spoštovano: novo polje ostane brez zneska.


### 65. Korak 4, analitikaHz: "Koliko ročnega dela zahteva priprava poročil in ključnih številk za odločanje?" (src/config/modules/horizontal.ts:40-48)

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Delno ovrženo. Drži, da obstajata dve polji z ISTIM ključem reportPrepHoursPerMonth in isto enoto h/mesec — analitikaHz (horizontal.ts:51) in obracuniRs (modules/racunovodstvo.ts:290) — in da plausibility.ts sešteje vse ure ne glede na izvor ter opozori šele nad 40 % kapacitete (plausibility.ts:54-75). Drži tudi, da je besedilo za servis dvoumno. NE DRŽI pa, da se obe polji 'v evre pretvorita z isto formulo': analitikaHz uporablja context.adminHourCostEUR (horizontal.ts:94, privzeto 30 EUR), obracuniRs pa context.operationalHourCostEUR (modules/racunovodstvo.ts:338, privzeto 24 EUR). Ista ura torej ne dobi le dveh mest, ampak tudi dve ceni — kar je ločena napaka. NE DRŽI tudi, da razmejitve ni: horizontal.ts:56 že nosi help 'Ure, ki ste jih že vpisali v drugem področju, tu ne ponavljajte.' z explainerjem v :57-60. Manjka torej SEGMENTNO nedvoumno besedilo, ne pa opozorilo nasploh.

**Predlog.** Modul je horizontalen in shema nima mehanizma za segmentno besedilo (ModuleDefinition.triage.prompt je navaden niz, moduleTypes.ts:210), zato brez novega mehanizma popravek ne sme biti segmenten. Popravi skupno besedilo tako, da je nedvoumno v vseh segmentih: 1) horizontal.ts:41 → 'Koliko ročnega dela zahtevajo poročila o vašem lastnem poslovanju — donosnost strank oziroma kupcev, obremenitev ekipe, pregled odprtih nalog?' 2) horizontal.ts:52 (label) → dodaj '… za vaše vodstvo ali lastnike (ne poročil, ki jih pripravljate za stranke)'. 3) horizontal.ts:56 (help) → 'Poročila, ki jih pripravljate za stranke, sem ne sodijo — te ure meri področje Obračuni, roki in konice. Ur, ki ste jih vpisali drugje, ne ponavljajte.' 4) Isto razmejitev dopiši v help polja reportPrepHoursPerMonth v obracuniRs (modules/racunovodstvo.ts:294, danes 'Ne vključujte vnosa listin iz področja Zajem.'). 5) Ločeno odloči, katera ura velja: dve polji z istim imenom, ki se vrednotita s 30 in 24 EUR, sta neskladje samo po sebi.

**Sklic na raziskavo:** §7.1 vrstica 11 'ročni Exceli za poročanje' (12) in vrstica 8 (12); §6 (poročanje stranki kot del produkta)

**Popravek preverbe.** Ovržena trditev 'obe pa se v evre pretvorita z isto formulo (horizontal.ts:102, racunovodstvo.ts:353)' — formuli se razlikujeta po postavki: horizontal.ts:94 nastavi rate = context.adminHourCostEUR, modules/racunovodstvo.ts:338 pa rate = context.operationalHourCostEUR. Ovržena tudi trditev, da razmejitve v help polja ni: horizontal.ts:56 jo že ima, skupaj z explainerjem. Predlog spremenjen iz segmentnega v skupnega, ker shema segmentnega besedila modula ne pozna (moduleTypes.ts:210) — segmentna različica bi zahtevala nov mehanizem ali klon modula, kar presega obseg te ugotovitve. Severity znižana z 'visoka' na 'srednja'; dodana nova, resnejša najdba (ista ura, dve ceni).


### 66. Korak 4, kadriHz: "Koliko dela zahtevajo evidence delovnega časa, dopusti in priprava plač?" (src/config/modules/horizontal.ts:248-260)

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Potrjeno, da je namen zapisan samo v komentarju konfiguracije — segments.ts:226 'kadriHz meri njihove LASTNE kadre in plače, ne obračunov za stranke' — in da obiskovalec te povedi ne vidi. Potrjeno, da timesheetHoursPerMonth že ima generični help (horizontal.ts:268), payrollPrepHoursPerMonth (:275-281) in hrAdminHoursPerMonth (:282-288) pa nimata NE helpa NE explainerja. Potrjeno, da so vsa polja v h/mesec in se torej podvojene ure prištejejo tudi v plausibility.ts:57-64. Dejanske možnosti lestvice so 0 'Malo — večina poteka samodejno', 1 'Nekaj ur na mesec', 2 'Nekaj dni vsak mesec', 3 'Vsak mesec je to velik projekt' — te že merijo obseg, zato je predlagana poenotitev lestvice odveč; problem je izključno dvoumnost predmeta merjenja.

**Predlog.** 1) horizontal.ts:253 → 'Koliko dela zahtevajo evidence, dopusti in plače za vašo lastno ekipo?' (skupno besedilo, ker segmentnega mehanizma ni). 2) horizontal.ts:268 (help timesheetHoursPerMonth) → dopolni z '… Če za stranke obračunavate plače, teh ur sem ne štejte.' 3) payrollPrepHoursPerMonth (:275) in hrAdminHoursPerMonth (:282) dobita help z isto razmejitvijo IN pripadajoča explainerja — pravilo help ⇒ explainer sicer ni izpolnjeno; explainer naj vsebuje primer, kot ga imajo sosednja polja. 4) Lestvica ostane nespremenjena.

**Sklic na raziskavo:** §7.1 vrstica 15 'zadnje spremembe pri plačah' (11); §5 (obračunovalec plač kot ločena persona)

**Popravek preverbe.** Iz predloga odstranjena poenotitev lestvice — obstoječe možnosti (horizontal.ts:255-258) že merijo obseg in se od predlaganih razlikujejo le v besedah. Odstranjen tudi zadnji stavek 'Pri servisih do 3 FTE razmisli o odstranitvi področja iz segmenta': pogojna sestava moduleIds glede na število zaposlenih je showIf-logika, ki je shema ne pozna, in bi naredila privzeto triažo ter razvrstitev nedeterministični. Dodano opozorilo, da dva od treh predlaganih helpov zahtevata tudi nov explainer (pravilo help ⇒ explainer). Predlog spremenjen iz segmentnega v skupnega iz istega razloga kot pri analitikaHz. Severity znižana z 'visoka' na 'srednja'.


### 67. Korak 4 (skupno): privzeto stanje vseh sedmih lestvic in privzeta izbira prvih treh področij

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Potrjeno dobesedno in je najbolj zanesljiva ugotovitev tega sklopa. triageScores se res začne kot prazen objekt (CalculatorFlow.tsx:75), StepTriage.tsx:66 izpelje const score = scores[definition.id] ?? 0, radio pa je označen pri checked={score === option.value} (:79) — ker ima vsako od sedmih področij možnost z vrednostjo 0, je ob prvem izrisu povsod obkljukan najmilejši odgovor in neodgovor se ne loči od izjave 'tu ni bolečine'. Potrjeno, da koda ločnico drugod ŽE dela: CalculatorFlow.tsx:348-351 pri neizmerjenih področjih obravnava 0 kot 'ni ocene' (scoreLabel: null). Potrjeno, da selectTopModules ob izenačenju razvrsti po vrstnem redu prikaza (moduleEngine.ts:203-206) in ob nedotaknjeni triaži izbere prve tri iz segments.ts:227-237. Potrjeno, da defaultIds v shemi obstaja (segments.ts:42).

**Predlog.** 1) NAJCENEJŠI POPRAVEK, brez posega v vrednosti: v StepTriage.tsx zamenjaj const score = scores[definition.id] ?? 0 (:66) s const score = scores[definition.id] in checked={score === option.value} (:79) — pri neodgovorjenem področju je score undefined in noben radio ni označen; scores ostane Record<string, number>, kjer odsotnost ključa pomeni 'ni odgovora'. Preveri, da isSelected (:67) in obstoječi ?? 0 na porabniških mestih (CalculatorFlow.tsx:348-351, salesReport.ts:317-318) že prenesejo manjkajoč ključ — prenesejo. 2) Gumb 'Naprej na številke' naj pri neocenjenih področjih izpiše, da ta ne bodo izmerjena; obvezne ocene ne uvajaj, ker bi podaljšala korak, ki je že najdaljši. 3) segments.ts:241 → triage: { recommendedCount: 3, defaultIds: ['zajemRs', 'strankeRs', 'popravkiRs'] }. 4) Poenotenje vseh sedmih lestvic obravnavaj kot ločeno nalogo (glej posamezne ugotovitve) — trije od sedmih so že v meri obsega, popravka potrebujeta strankeRs in obracuniRs, popravkiRs pa v celoti.

**Sklic na raziskavo:** §7.1 prioritetna matrika: vrstice 1–3 (14) pred 5 in 7 (13) pred 15 (11)

**Popravek preverbe.** Predlog 1 konkretiziran in pocenjen: premik vrednosti možnosti na 1–4 ali sprememba tipa v number | null nista potrebna in bi razveljavila že zbrane ocene ter zahtevala popravke v triageScoreLabel, salesReport.ts:317-318 in CalculatorFlow.tsx:348-351. Zadostuje odstranitev privzetka ?? 0 v StepTriage.tsx:66 — dve vrstici, isti tip podatka. Predlog 3 zožen na defaultIds (prerazporeditev moduleIds je odsvetovana iz istega razloga kot pri popravkiRs). Predlog 4 razmejen kot ločena naloga, ker je pri štirih od sedmih lestvic sprememba kozmetična.


### 68. Korak 5: operationalHour "Približen polni strošek računovodske ure" (src/config/contexts/racunovodstvo.ts:99-105)

**Sodba:** OHRANI · **Resnost:** nizka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Umerjenost potrjena, izpeljava pa popravljena. Iz raziskave: 163,2 mio EUR stroškov dela na 4.077,5 FTE = pribl. 40.000 EUR na FTE. Pojasnilo HOURLY_COST_EXPLAINER (shared.ts:41-46) uporablja pribl. 1.700 produktivnih ur na leto, kar da 23,5 EUR/h — privzetek 24 (racunovodstvo.ts:104) in sredina pasu 20–27 EUR (:21) sta torej pravilna. Potrjeno, da privzetek leži v natanko enem pasu, kar varuje test 'povprečje panoge leži v natanko enem pasu' (contexts.test.ts), ki prek ratesOf pokriva urne postavke, in da gumb 'vzemi povprečje panoge' zato vrne razpon in ne točke (range.ts:74-87). Potrjeno, da pojasnilo izrecno izloči režijo ('sproščena ura prihrani plačo, ne najemnine in ne vodenja') in s tem drži trdo pravilo. Sidra v komentarju (:15-17) so v kodi res zapisana.

**Sklic na raziskavo:** §3.1 (163,2 mio EUR stroškov dela / 4.077,5 FTE ≈ 40.000 EUR na FTE); §8.1 (prihodek/FTE 87.689 EUR kot ločen benchmark)

**Popravek preverbe.** Popravljena številka: raziskava nikjer ne navaja '40.700 EUR na FTE' in oznake K13 ne uporablja — iskanje po dokumentu vrne le podatke iz §3.1 (163,2 mio EUR stroškov dela, 4.077,5 FTE), iz katerih sledi pribl. 40.000 EUR na FTE. Sklep se s tem ne spremeni: 40.000 / 1.700 = 23,5 EUR/h, kar še vedno pade v pas 20–27 EUR in podpira privzetek 24. Popravljen tudi sklic na pojasnilo: shared.ts:41-46. Sodba 'ohrani' potrjena.


### 69. Korak 5: adminHour "Približen polni strošek vodstvene oziroma strokovne ure" (src/config/contexts/racunovodstvo.ts:107-116)

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Potrjeno: privzetek 30 (racunovodstvo.ts:115) leži v natanko enem pasu 28–38 EUR (shared.ts:21), sidro 'računovodski strokovnjak 31,6' je v komentarju :112-114. Potrjena je tudi jedrna težava: reviewHoursPerMonth (modules/racunovodstvo.ts:411) se vrednoti z adminHourCostEUR (:459), correctionHoursPerMonth (:403) pa z operationalHourCostEUR (:450) — pri solo servisu je to ista oseba in ista ura dobi dve ceni glede na to, v katero polje jo obiskovalec vpiše. Pojasnilo ADMIN_HOUR_EXPLAINER (shared.ts:48-52) res opozori le, naj postavk ne zamenja ('Ta ura ni nujno dražja od operativne — pomembno je le, da ju ne zamenjate'), ne pove pa, kaj naj stori solo servis.

**Predlog.** 1) Help (racunovodstvo.ts:109) → 'Vodja računovodstva, davčni svetovalec, pregled in podpis pred oddajo. Če ste servis enega ali dveh ljudi in podpisujete sami, vpišite isto postavko kot zgoraj — ista ura ne sme imeti dveh cen.' 2) V StepCostBasis ob polju adminHour dodaj tiho bližnjico 'Enako kot računovodska ura', ki zapiše { valueEUR: profile.operationalHour.valueEUR, estimated: profile.operationalHour.estimated, source: 'entered' } — vrednost 'entered' v uniji AssumptionSource obstaja (contextTypes.ts:200, 207). Bližnjica naj se pokaže pri employeeCount <= 2; ker StepCostBasis danes employeeCount ne dobi (props v StepCostBasis.tsx:16-24), ga je treba dodati kot prop in podati iz CalculatorFlow.

**Sklic na raziskavo:** §3.1 (S1 solo izvajalec, S2 2–4 FTE — skupaj velika večina trga); §5 (lastnik/direktor in vodja računovodstva sta pri majhnem servisu ista oseba)

**Popravek preverbe.** Predlog konkretiziran do izvedljivosti: navedena je natančna oblika zapisa CostAssumption (vključno z estimated, ki ga pregledovalec ni omenil, sicer bi bližnjica tiho zvišala oceno zanesljivosti) in ugotovljeno, da StepCostBasis števila zaposlenih danes sploh ne prejme — potrebna je razširitev props (StepCostBasis.tsx:16-24). Potrjeno, da je source 'entered' veljavna vrednost (contextTypes.ts:200, 207). Sklic na pojasnilo popravljen na shared.ts:48-52.


### 70. Korak 5: annualRevenue "Letni prihodki servisa" (src/config/contexts/racunovodstvo.ts:119-131)

**Sodba:** ODSTRANI · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Potrjeno v celoti. Grep po vseh modulih: zastavico usesRevenue nosijo samo trgovina.ts:543, maloprodaja.ts:91 in :334 ter splosno.ts:363; noben modul segmenta racunovodstvo ne uporablja context.annualRevenueEUR. Skladnost zastavice s formulo varuje usesRevenue.test.ts. Potrjeno, da odgovor ne vpliva niti na zanesljivost — potential.ts:155-159 predpostavko uteži šele prek anyAnsweredModuleUses('usesRevenue', …). Potrjeno, da ga ni med stolpci izvoza (CSV_COLUMNS, exportRecord.ts:146-197 pozna le operationalHourCostEUR in adminHourCostEUR) in da ga prodajna priprava ne izpiše. Pojasnilo v :121 res obljublja posledico, ki je v tem segmentu ni.

**Predlog.** Izbriši annualRevenue iz RACUNOVODSTVO_CONTEXT (racunovodstvo.ts:118-131) in popravi costBasisIntro (:50): stavek 'Prihodek in maržo vprašamo enkrat — sta lastnost servisa, ne posameznega področja.' odpade, uvodni 'Štiri številke, ki veljajo za vsa področja.' pa mora postati 'Dve številki, ki veljata za vsa področja.' — sicer korak obljubi štiri vprašanja in pokaže dve. Preveri contexts.test.ts: costBasisQuestionsOf annualRevenue obravnava kot neobvezen, zato brisanje ne podre nobenega testa. Če bi postavka kljub temu ostala, sme imeti samo nemonetizirano diagnostično vlogo (prihodek/FTE proti 87.689 EUR kot vrstica v prodajni pripravi, z izrecno opombo, da je panožno povprečje primerjava in ne cilj), pasovi pa morajo biti popravljeni: do 200.000 (sredina 120.000) · 200.000–500.000 (330.000) · 500.000–1,5 mio (850.000) · nad 1,5 mio (3 mio).

**Sklic na raziskavo:** §3.1 (379,5 mio EUR prihodkov pri 2.705 izvajalcih z izkazi ≈ 140.000 EUR na izvajalca); §8.1 (prihodek/FTE 87.689 EUR)

**Popravek preverbe.** Popravljena aritmetika v alternativnem predlogu pasov: 379,5 mio EUR se v raziskavi nanaša na 2.705 izvajalcev, ki so oddali izkaze, ne na vseh 4.397 subjektov. Povprečje torej ni 86.000, ampak pribl. 140.000 EUR, zato so bili predlagani pasovi (do 150.000 / 150.000–400.000 / …) prenizki; nadomeščeni s pasovi okoli pravilnega povprečja. Predlogu dodan manjkajoči popravek: costBasisIntro (racunovodstvo.ts:50) se začne s 'Štiri številke' in ga je treba ob brisanju obeh postavk spremeniti v 'Dve številki', sicer korak obljubi več, kot pokaže. Sodba 'odstrani' potrjena.


### 71. Korak 5: contributionMargin "Povprečna prispevna marža" (src/config/contexts/racunovodstvo.ts:133-148)

**Sodba:** ODSTRANI · **Resnost:** visoka · **Status:** potrjeno

**Utemeljitev.** Potrjeno v celoti in celo podkrepljeno. Zastavico usesMargin nosita samo maloprodaja.ts:92 in :713, zato odgovor v tem segmentu ne spremeni nobenega evra in po potential.ts:156-160 ne vpliva na zanesljivost. Potrjena je tudi tiha napaka: pasova 'do30' (min 0,2, max 0,3) in '30do50' (min 0,3, max 0,5) se stikata pri 0,3, privzetek pa je 0,3 (:145); industryAverageScaleBand (contextTypes.ts:277-281) uporablja find s pogojem fallback >= band.min && fallback <= band.max in vrne PRVEGA, torej 'do30' — gumb 'vzemi povprečje panoge' bi pognal izračun z 20–30 %. Gumb se za to polje res ponudi: hasIndustryAverage = question.fallback > 0 (StepCostBasis.tsx:301). Test 'povprečje panoge leži v natanko enem pasu' res teče samo prek ratesOf (contexts.test.ts:33-40) in ScaleQuestion ne pokriva.

**Predlog.** 1) Izbriši contributionMargin iz RACUNOVODSTVO_CONTEXT (racunovodstvo.ts:133-148); costBasisIntro popravi skupaj s prejšnjo ugotovitvijo. 2) NE GLEDE na odločitev razširi test iz contexts.test.ts z ScaleQuestion: nov primer, ki prek costBasisQuestionsOf (contexts.test.ts:47-53) za vsak ScaleQuestion s fallback > 0 preveri, da ga vsebuje natanko en pas — sicer je izbira odvisna od vrstnega reda v konfiguraciji. To varovalo velja za vse segmente, ne le za računovodstvo. 3) Če bi postavka kljub temu ostala: privzetek 0,5, pasovi 'Do 35 %' (0,28; 0,2–0,35) · '35–50 %' (0,42; 0,35–0,5) · '50–65 %' (0,57; 0,5–0,65) · 'Več kot 65 %' (0,72; 0,65–0,85), help pa mora izrecno povedati, ali se lastnikova plača šteje med neposredne stroške.

**Sklic na raziskavo:** §3.1 (EBITDA marža 15,0 %; 163,2 mio EUR stroškov dela proti 379,5 mio EUR prihodkov ≈ 43 % prihodka odpade na delo)

**Popravek preverbe.** Vsebinsko potrjeno, sklici popravljeni: industryAverageScaleBand je contextTypes.ts:277-281 (ne 278-282). Dopolnitev, ki jo pregledovalec spregleda: komentar v racunovodstvo.ts:143-144, ki privzetek 0,3 opravičuje s tem, da bi 0,25 'označil radio že ob prvem izrisu', je ZASTAREL — ScaleField izbrani pas prepozna po value.source ('band'/'industryAverage', StepCostBasis.tsx:291-292), ne več po ujemanju sredine. Edini razlog za 0,3 je torej odpadel, ostane pa škoda prekrivajočega se pasu. ResearchRef popravljen: raziskava ne navaja 'dodane vrednosti 54.131 EUR/FTE' in ne uporablja oznak K12–K14; razmerje stroškov dela proti prihodkom je izpeljano iz §3.1.


### 72. Korak 5 (dodatno): manjka postavka, ki sproščene ure prevede v denar novih strank

**Sodba:** DODAJ · **Resnost:** nizka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Diagnoza drži, predlagana rešitev pa krši trdo pravilo. Drži, da segment sproščene ure vrednoti po strošku (moduleEngine.ts:64-68) in jih hkrati izraža v strankah (ResultsView.tsx:86-88), denarne koristi teh strank pa nikjer ne pokaže. NE drži pa, da je rešitev 'pavšal × 12 × monetizacijski faktor': mesečni pavšal je PRIHODEK, in prihodek ni korist. Raziskava sama v §9.1 definira denarno korist kot naslovljive ure × strošek ure × monetizacijski faktor — torej stroškovno, natanko tako, kot kalkulator že računa capacityEUR. Predlagana formula bi isto kapaciteto ovrednotila drugič in po višji, prihodkovni meri. Tudi alternativa prek chargeOutRate je slabša: 'zaračunana ura' bi v segmentu, ki nima nobenega polja z zaračunanimi urami, uvedla postavko brez porabnika in bi trčila ob pojasnilo pri unbilledHoursPerMonth (modules/racunovodstvo.ts:195), ki izrecno pove, da se vrednoti po strošku ure in ne po ceniku.

**Predlog.** NE DODAJAJ ZDAJ nobene postavke, ki bi kapaciteto monetizirala s prihodkom. Namesto tega: 1) Obdrži obstoječe stroškovno vrednotenje capacityEUR in ga na rezultatih izrecno opremi z opombo 'Vrednoteno po vašem strošku ure — to je sproščena kapaciteta, ne prihranek pri plačah in ne dodatni prihodek.' 2) DODAJ KMALU, in samo kot contextOnly za prodajno pripravo: 'Povprečen mesečni pavšal na stranko' (EUR/mesec, privzetek 200, pasovi do 120 · 120–250 · 250–500 · nad 500, help pove, da gre za redni mesečni znesek brez enkratnih storitev). V prodajni pripravi se izpiše kot ločena vrstica '+X strank ≈ Y EUR letnega pavšala' z izrecno opombo, da je to prihodek in ne korist ter da ga je treba pred pogovorom o ROI zmanjšati za neposredne stroške izvedbe. V noben znesek izračuna ne vstopa. 3) Trditve testa 'zaračunano postavko vpraša samo dejavnost, ki prodaja ure' (contexts.test.ts, pričakovanje ['storitve']) ni treba spreminjati.

**Sklic na raziskavo:** §9.1 (denarna korist = naslovljive ure × strošek ure × monetizacijski faktor); §9.2 (monetizacijski faktor kapacitete 20/35/55 %); §9.3 ('ne šteje vseh prihranjenih ur kot denar'); §4.4 (bruto prihranek ur ≠ ekonomska vrednost kapacitete ≠ denarna realizacija)

**Popravek preverbe.** Predlog popravljen zaradi kršitve trdega pravila 'prihodek ni korist': formula 'pavšal × 12 × monetizacijski faktor 20–55 %' monetizira prihodek, medtem ko raziskava v §9.1 monetizacijski faktor izrecno pripenja na ure × STROŠEK ure — kar kalkulator že dela. Predlog bi torej isto kapaciteto ovrednotil dvakrat in po napačni meri. Nova postavka je zato prekvalificirana v contextOnly polje za prodajno pripravo brez vstopa v izračun, prikaz kapacitete v evrih pa ostane stroškoven. Ovržena tudi alternativa prek chargeOutRate (trči ob help pri unbilledHoursPerMonth, modules/racunovodstvo.ts:195) in s tem odpade predlagana sprememba testa. Uvrstitev: 'NE dodajaj zdaj' za monetizirano različico, 'dodaj kmalu' za contextOnly. Severity znižana s 'srednja' na 'nizka'.


## Področje: Horizontali analitikaHz in kadriHz v segmentu racunovodstvo + presoja izpuščenih horizontal (financeHz, dokumentiHz, servisHz) — skeptični pregled

### 73. analitikaHz.triage.prompt — »Koliko ročnega dela zahteva priprava poročil in ključnih številk za odločanje?«

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno: prompt je res na horizontal.ts:41, možnosti 42–47, summary na horizontal.ts:39, pravilo o neimenovanju sosednjih področij na horizontal.ts:19–23. Segment racunovodstvo ima sedem triažnih področij (zajemRs, strankeRs, obracuniRs, popravkiRs, donosnostRs, analitikaHz, kadriHz; diagnostikaRs in E triaže nimata) in recommendedCount 3 (segments.ts:241). POPRAVEK dejstva: recommendedCount NI omejitev, ampak PREDIZBIRA najvišjih treh (CalculatorFlow.tsx:139–146, selectTopModules); StepTriage.tsx:105 obiskovalcu izrecno pove, da lahko izbere poljubno mnogo. Tveganje zato ni 'izrine panožno področje', ampak 'privzeto predizbere napačno področje in ga odpre z napačnim pričakovanjem' — kar je pri privzetkih še vedno večina vnosov. Drugi POPRAVEK: na triažnem zaslonu je viden SAMO naslov modula in prompt (StepTriage.tsx:71–72); summary se pokaže šele na koraku vnosa (ModuleSection.tsx:25–27). Sprememba summaryja torej triažne napake ne odpravi — nosi jo izključno prompt. Servis, ki strankam mesečno pošilja izkaze (proces 22), bo brez zamejitve v promptu ocenil 3 zaradi dela ZA STRANKE.

**Predlog.** Prompt (horizontal.ts:41): »Koliko ročnega dela zahteva priprava poročil in ključnih številk, po katerih vodite SVOJE podjetje?« Možnosti (42–47) nespremenjene. Ta sprememba je nevtralna v vseh šestih segmentih, ki analitikaHz uporabljajo (segments.ts:79, 108, 136, 166, 198, 233), zato jo je varno narediti v skupnem modulu TAKOJ, ne šele v panožni različici. Ločeno in kot druga sprememba: summary (horizontal.ts:39) v »Ročna priprava poročil za vodenje lastnega podjetja, izredne analize in združevanje podatkov iz več virov.« — ta zamejitev deluje na koraku vnosa, ne v triaži.

**Sklic na raziskavo:** §6.1 proces 22 (poročanje stranki); §7.1 vrstica 11 (ročni Exceli za poročanje, teža 12); §7.1 vrstica 8 (donosnost stranke, 12)

**Popravek preverbe.** Dve dejstveni napaki popravljeni: (1) recommendedCount 3 je predizbira, ne kvota — obiskovalec lahko izbere vseh sedem področij (StepTriage.tsx:105, CalculatorFlow.tsx:139–146), zato formulacija »odloča, katera tri od sedmih področij servis sploh izpolni« ne drži dobesedno; (2) summary v triaži NI viden (StepTriage.tsx:71–72 izpiše samo title in prompt), zato predlog »isto zamejitev dodajte v summary« triažne napake ne reši — reši jo samo prompt. Verdict in severity ostaneta.


### 74. analitikaHz.reportPrepHoursPerMonth — »Koliko ur mesečno gre za ročno pripravo rednih poročil za vodstvo ali lastnike?«

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Vse tehnične trditve preverjene in držijo: vrednosti se hranijo po modulu (plausibility.ts:56 in salesReport.ts:392 oba berejo values[definition.id]), zato tehničnega trka istoimenskega ključa ni in oba zapisa vstopita v izračun. obracuniRs.reportPrepHoursPerMonth (racunovodstvo.ts:290–300) vrednoti operativna ura (racunovodstvo.ts:338), analitikaHz pa vodstvena (horizontal.ts:94); fallbacka sta 24 EUR (contexts/racunovodstvo.ts:104) in 30 EUR (contexts/racunovodstvo.ts:115) — ista ura je v napačnem področju 25 % dražja. Generični help na horizontal.ts:56 sosednjega področja res ne imenuje. Ovojnica prekrivanja res ne ujame: prag je 40 % kapacitete (plausibility.ts:27, izračun 67–75), pri 4 zaposlenih 256 h/mesec, podvojenih 20–40 h ostane pod njim.

**Predlog.** Label: »Koliko ur mesečno gre za ročno pripravo poročil o VAŠEM poslovanju — zasedenost ekipe, opravljene ure, donosnost strank, prihodki?« help: »Poročila, ki jih pripravljate za stranke ali za oddajo državi, sem ne sodijo.« explainer: »Poročila, po katerih vodite podjetje, ne poročila za naročnike. Ocenite: koliko takih poročil na mesec × koliko ur na poročilo. Primer: 2 poročili × 2 h ≈ 4 ure na mesec.« Ker help imenuje stranke in oddajo državi, sodi izključno v panožno različico analitikaRs (v skupnem analitikaHz bi bil v proizvodnji nesmiseln). Tam ključ preimenujte v ownReportPrepHoursPerMonth. exportRecord.ts NE spreminjajte.

**Sklic na raziskavo:** §7.1 vrstica 11 (ročni Exceli za poročanje, 12), vrstica 8 (neznana donosnost stranke, 12); §8.1 prispevna marža stranke; §9.1

**Popravek preverbe.** Popravljena dva sklica in en izvedbeni napotek: fallback operativne ure je na contexts/racunovodstvo.ts:104 (ne 105); prag ovojnice je konstanta na plausibility.ts:27 (ne :26). Predlog »novi stolpci na konec exportRecord.ts« ODPADE — glava CSV je namenoma fiksna in enaka za vse segmente, vsi modulski vnosi gredo v en sam stolpec moduleInputsJson (exportRecord.ts:135–199, moduleInputs kot Record<string, Record<string, number>> na :44). Preimenovanje ključa zato ne zahteva nobenega novega stolpca in nobene CRM preslikave ne premakne. Dodano: ker help imenuje sosednje področje, je sprememba izvedljiva šele v analitikaRs.


### 75. analitikaHz.adHocAnalysisHoursPerMonth — »Koliko ur mesečno vzamejo izredne analize in vprašanja 'na hitro potrebujemo številko'?«

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno in drži: polje res nima ne help ne explainerja (horizontal.ts:62–68). strankeRs.inquiryHoursPerMonth (racunovodstvo.ts:188–199) meri »ponavljajoča se vprašanja strank (saldo, stanje, kdaj zapade, kje je dokument)« in se vrednoti po adminHourCostEUR (racunovodstvo.ts:244) — torej po ISTI postavki kot analitikaHz (horizontal.ts:94). Dvojno štetje je zato res popolnoma neopazno. Tretja pot je donosnostRs.unbilledHoursPerMonth (racunovodstvo.ts:508–519), ki pa je vsaj delno že zamejena: strankeRs ima na racunovodstvo.ts:195 help »Svetovanje sem ne sodi — neobračunano svetovanje meri področje Neobračunano delo«. Meja, ki manjka, je torej ena sama: med vprašanji STRANK in analizami za LASTNE odločitve, in prav te ni nikjer.

**Predlog.** Label: »Koliko ur mesečno vzamejo izredne analize za lastne odločitve — koliko nas stane posamezna stranka, ali zmoremo novo, ali se cenik še izide?« help: »Odgovarjanje na vprašanja strank in neobračunano svetovanje sem ne sodita.« explainer: »Ure, ko za lastno odločitev sestavljate številko, ki je iz programa ni. Ocenite: koliko takih vprašanj na mesec × koliko ur na vprašanje. Primer: 3 × 1,5 h ≈ 5 ur.« Izvedljivo v analitikaRs (help imenuje stranke). Dodajanje helpa brez explainerja bi padlo na testu explainers.test.ts:29–32.

**Sklic na raziskavo:** §7.1 vrstica 19 (premalo časa za svetovanje, 11), vrstica 8 (12); §8.1 odzivni čas

**Popravek preverbe.** Popravljeni sklici (strankeRs.inquiryHoursPerMonth je 188–199, ne 189–199; donosnostRs.unbilledHoursPerMonth je 508–519, ne 509–520) in ena pretiravanje: tretja pot prek donosnostRs ni povsem nezavarovana — strankeRs.inquiry že ima help, ki svetovanje odriva v donosnostRs (racunovodstvo.ts:195). Ostane ena res nezamejena meja (stranka proti lastni odločitvi), kar verdicta in severity ne spremeni. Dodan izvedbeni pogoj: help brez explainerja pade na testu.


### 76. analitikaHz.dataMergeHoursPerMonth — »Koliko ur mesečno gre za zbiranje in ročno združevanje podatkov iz različnih virov v eno preglednico?«

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno in drži: polje nima ne help ne explainerja (horizontal.ts:69–76). zajemRs.retypingHoursPerMonth (racunovodstvo.ts:96–108) je »prepisovanje istih podatkov med programi«, izid »Prepisovanje podatkov med programi« (racunovodstvo.ts:136) po operativni uri (racunovodstvo.ts:120, 24 EUR), analitikaHz pa isto delo po vodstveni (horizontal.ts:94, 30 EUR). Trditev metodologije, da se ista ura nikoli ne šteje dvakrat, je na content/methodology.ts:299 — dobesedno tam, kot navaja ugotovitev. V servisu je najbolj naraven prevod »različnih virov« res programska raznolikost strank (§7.1 vrstica 21).

**Predlog.** Label: »Koliko ur mesečno gre za sestavljanje ene preglednice iz več lastnih virov — program, evidenca ur, cenik, izdani računi?« help: »Prepisovanje podatkov iz programov strank sem ne sodi.« explainer: »Ure, ko lastne podatke ročno spravljate skupaj, ker jih program ne poveže. Ocenite: koliko takih preglednic na mesec × koliko ur na preglednico. Primer: 1 × 3 h ≈ 3 ure.« Izvedljivo v analitikaRs.

**Sklic na raziskavo:** §7.1 vrstica 21 (nepovezani programi strank, 10), vrstica 3 (ročni prepis računov, 14); §8.1 delež strukturiranih vhodov

**Popravek preverbe.** Popravljeni trije sklici: polje je horizontal.ts:69–76 (ne 70–76); zajemRs.retypingHoursPerMonth je racunovodstvo.ts:96–108 (ne 97–108); zajemRs.filingHoursPerMonth, ki ga ugotovitev navaja drugje kot 110–118, je v resnici 109–115. Vsebina in verdict potrjena, dodan pogoj panožne različice (help imenuje stranke).


### 77. analitikaHz.reportFreshness (contextOnly) — »Kako stare so ključne številke, ko jih vodstvo vidi?«

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno: polje je contextOnly s privzetkom 2 (horizontal.ts:77–89), test horizontal.test.ts:214–218 res dokaže, da ne premakne nobene številke, in plausibility.ts:58 contextOnly polja izrecno preskoči. POPRAVEK vrednosti polja: contextOnly odgovori se v prodajno poročilo izpišejo VEDNO, kot del seznama odgovorov področja (salesReport.ts:407–413, contextOnly kot zastavica); salesPlaybook.ts:104–115 jih uporabi le za generiranje odprtih vprašanj, kadar drugih iztočnic ni. Prodajna vrednost polja je torej večja, kot trdi ugotovitev — kar predlog za boljše besedilo samo krepi. Vsebinski očitek drži: ključna številka servisa ni izkaz, ampak zasedenost in donosnost stranke (segments.ts:238), diagnostikaRs.knowsClientProfitability (racunovodstvo.ts:632–638) pa že meri POZNAVANJE, zato mora to polje prispevati časovno razdaljo.

**Predlog.** Label: »Koliko časa po koncu meseca imate zaključeno sliko lastnega poslovanja — opravljene ure, zasedenost, donosnost strank?« Možnosti z zaporednimi indeksi: 0 »Sproti, iz programa«, 1 »V nekaj dneh«, 2 »Šele ob obračunu za pretekli mesec«, 3 »Šele ob letnem zaključku«. Ostane contextOnly, privzetek 2 (obstaja med možnostmi — pogoj testa moduleEngine.test.ts:383–391). Brez helpa; če bi ga dodali, je explainer obvezen. Izvedljivo v analitikaRs.

**Sklic na raziskavo:** §8.1 dnevi do mesečnega zaključka; §8.1 prispevna marža stranke; §7.1 vrstica 8 (12)

**Popravek preverbe.** Popravljena trditev »Prodajno vrednost ima šele kot rezerva ... torej redko«: contextOnly odgovori gredo v prodajno poročilo vedno (salesReport.ts:407–413); salesPlaybook.ts:104–115 je le pot do odprtih vprašanj. Popravljena tudi sklica: polje je horizontal.ts:77–89, diagnostikaRs.knowsClientProfitability je racunovodstvo.ts:632–638 (label na :634). Dodan pogoj sheme (privzetek mora biti med možnostmi).


### 78. analitikaHz.mainCause — »Kaj je glavni vzrok?« (ANALITIKA_CAUSES, horizontal.ts:28–34)

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno in drži: izbrani vzrok množi celoten znesek področja (horizontal.ts:93 → potential.ts:43–44 množi vsak izid z addressableShare), deleži so 0,15–0,75 (addressableShare.ts:28–35), privzetek je zadnja možnost »Ne vemo« s 0,30 (addressableShare.ts:47, 62, 34). Peta možnost »Podatke dobimo od zunanjega računovodstva« (horizontal.ts:33) je za računovodski servis res nesmiselna. A POZOR: za preostalih pet segmentov, ki analitikaHz uporabljajo, je to smiselna in namerna možnost — financeHz ima vzporednico »Odvisni smo od zunanjega servisa« (horizontal.ts:135). Sprememba v skupnem modulu bi torej petim segmentom škodila; izvedljiva je samo v analitikaRs.

**Predlog.** V panožni analitikaRs peto možnost zamenjajte z »Ur in donosnosti po stranki ne evidentiramo« (kategorija 'data'), tretjo preberite kot »Vsaka ekipa ali vodja ima svoje številke«, ostale tri ohranite. Skupnega ANALITIKA_CAUSES v horizontal.ts NE spreminjajte. Ob tem zavestno sprejmite kalibracijsko posledico: nabor s tremi 'data' vzroki (0,75) sistematično dvigne povprečni naslovljivi delež področja v tem segmentu — to je v komentarju panožne datoteke treba zapisati kot odločitev, ne pustiti kot stranski učinek (addressableShare.ts:11–13 kalibracijo tako ali tako označuje kot začetno oceno).

**Sklic na raziskavo:** §7.1 vrstica 8 (12), vrstica 9 (znanje v glavi posameznika, 12); §9.1 naslovljive ure

**Popravek preverbe.** Predlog je bil zapisan kot sprememba skupnega modula; to bi pokvarilo pet drugih segmentov, kjer je »zunanje računovodstvo« pravi in namerni vzrok (vzporednica financeHz na horizontal.ts:135). Uvrščeno izključno v analitikaRs. Dodano opozorilo na kalibracijsko posledico treh 'data' vzrokov (dvig povprečnega naslovljivega deleža), ki je predlog ni omenjal. Sklici sicer točni (privzetek »Ne vemo« izhaja iz addressableShare.ts:62 default = all.length − 1).


### 79. analitikaHz.pantheon — tri alineje (horizontal.ts:122–126)

**Sodba:** IZBOLJŠAJ · **Resnost:** nizka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno: salesPlaybook.ts:129–132 res vzame alineje iz področja z NAJVEČJO postavko in jih ponudi kot priporočilo. Poleg tega gre pantheon vsakega merjenega področja tudi v prodajno poročilo (salesReport.ts:415), kar učinek napačne alineje še razširi. Vsebina drži: servis nima »oddelkov« (horizontal.ts:124) ne »artiklov« (horizontal.ts:125).

**Predlog.** V panožni analitikaRs: »Nadzorna plošča nad zasedenostjo ekipe in stanjem zaključka po stranki«, »Ura, evidentirana ob delu, ne rekonstruirana ob koncu meseca«, »Donosnost po stranki in po referentu neposredno iz sistema, brez Excela«. Skupnega analitikaHz ne spreminjajte — »oddelki« in »artikli« držijo v proizvodnji, trgovini in maloprodaji. Alineje morajo ostati znotraj objavljenega slovenskega cenika PANTHEON (načelo iz racunovodstvo.ts, komentar modulov).

**Sklic na raziskavo:** §7.1 vrstica 8 (12), vrstica 12 (nejasen obseg pavšala, 11); §8.1 prispevna marža stranke

**Popravek preverbe.** Sklic razširjen (blok je horizontal.ts:122–126) in dopolnjen učinek: alineje ne gredo samo v priporočilo prodajne priprave (salesPlaybook.ts:129–132), ampak tudi v izpis vsakega merjenega področja v poročilu (salesReport.ts:415). Vsebinsko potrjeno, uvrščeno v analitikaRs.


### 80. kadriHz.triage.prompt — »Koliko dela zahtevajo evidence delovnega časa, dopusti in priprava plač?«

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno in drži: komentar segments.ts:226 res pravi »kadriHz meri njihove LASTNE kadre in plače, ne obračunov za stranke«, v besedilih modula (horizontal.ts:248–259) pa te zamejitve ni. Prompt je na horizontal.ts:253, summary na :251. Za servis je priprava plač produkt (proces 19), zato bo brez zamejitve v promptu ocena visoka iz napačnega razloga in modul pride med predizbrane tri (segments.ts:241).

**Predlog.** Prompt (horizontal.ts:253): »Koliko dela zahtevajo evidence delovnega časa, dopusti in plače VAŠIH zaposlenih?« To je nevtralno v vseh sedmih segmentih, ki kadriHz uporabljajo (segments.ts:81, 110, 138, 168, 200, 234, 266), zato ga spremenite v SKUPNEM modulu takoj. Summary (horizontal.ts:251): »Evidence delovnega časa, priprava obračuna plač in kadrovska administracija za lastno ekipo.« — prav tako nevtralno in izvedljivo takoj.

**Sklic na raziskavo:** §6.1 proces 19 (plače in kadri); §7.1 vrstica 15 (zadnje spremembe pri plačah, 11); §3.1 ~1,5 FTE na subjekt

**Popravek preverbe.** Popravljen zadnji stavek predloga: »Enako zamejitev ponovite v uvodnem stavku koraka« ni izvedljivo, ker uvodni stavek koraka JE summary — ModuleSection.tsx:25–27 izpiše definition.summary kot edini uvodni odstavek področja. Tretjega mesta ni. Dodano: prompt in summary sta v tej obliki nevtralna za vseh sedem segmentov (ne šest), zato ju ni treba čakati na panožno različico.


### 81. kadriHz.timesheetHoursPerMonth — »Koliko ur mesečno gre za zbiranje in urejanje evidenc prisotnosti in delovnih ur?«

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno: polje je horizontal.ts:262–273, help na :268 je generični, explainer na :269–272 s primerom »2 osebi × 5 h ≈ 10 ur«, vrednotenje po adminHourCostEUR (horizontal.ts:301). Trojna dvoumnost drži: (a) lastna prisotnost, (b) prisotnost, zbrana OD STRANK za obračun plač — obracuniRs.overtimeHoursPerMonth in reportPrepHoursPerMonth plače izrecno naštevata (racunovodstvo.ts:284, 298) in ju vrednoti operativna ura (racunovodstvo.ts:338), (c) evidentiranje lastnih ur po stranki — donosnostRs.hoursPerClientPerMonth (racunovodstvo.ts:546, contextOnly) in diagnostikaRs.knowsHoursPerClient (racunovodstvo.ts:625–631).

**Predlog.** Label: »Koliko ur mesečno gre za zbiranje in urejanje evidenc prisotnosti VAŠIH zaposlenih?« — nevtralno v vseh segmentih, izvedljivo v skupnem kadriHz takoj. help: »Prisotnost, ki jo za obračun plač zbirate od strank, sem ne sodi.« in explainer: »Samo lastne evidence: prepisovanje listov, lovljenje manjkajočih vnosov pred obračunom. Ocenite: koliko ur ob koncu meseca × koliko oseb to dela. Primer: 1 oseba × 2 h ≈ 2 uri.« — oboje SAMO v kadriRs, ker help govori o strankah in ker bi zmanjšani primer (1 oseba × 2 h) v proizvodnem podjetju s 120 zaposlenimi sugeriral prenizko številko.

**Sklic na raziskavo:** §7.1 vrstica 8 (12), vrstica 15 (11); §8.1 prihodek/FTE 87.689 EUR; §3.1

**Popravek preverbe.** Predlog je bil zapisan kot ena sprememba; razdeljen na del, ki gre v skupni modul (label z »VAŠIH zaposlenih«), in del, ki gre izključno v kadriRs (help o strankah in zmanjšani primer). Zmanjšanje primera v skupnem modulu bi škodilo velikim segmentom — ugotovitev tega ni upoštevala. Sklic diagnostikaRs.knowsHoursPerClient popravljen na racunovodstvo.ts:625–631 (label na :627).


### 82. kadriHz.payrollPrepHoursPerMonth — »Koliko ur mesečno vzame priprava podatkov za obračun plač in popravki po obračunu?«

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Najbolj tvegano polje v obsegu — preverjeno in potrjeno v celoti. Polje res nima ne help ne explainerja (horizontal.ts:274–280). obracuniRs plače imenuje dvakrat: label »konice ob obračunih in rokih (DDV, plače, zaključni računi)« (racunovodstvo.ts:284) in explainer »DDV, plače, medletna poročila« (racunovodstvo.ts:298), oboje po operativni uri (racunovodstvo.ts:338), tu pa po vodstveni (horizontal.ts:301). Račun drži: 80 h × 30 EUR × 12 = 28.800 EUR/leto bruto podvajanja, več od praga visoke izgube segmenta 10.000 EUR (segments.ts:250) — pri čemer se v naslovljivi znesek prenese še pomnoženo z addressableShare in pasom izboljšave (potential.ts:43–44), bruto postavka pa se v poročilu vseeno izpiše kot kapaciteta področja.

**Predlog.** Label: »Koliko ur mesečno vzame priprava in popravki obračuna plač za VAŠE zaposlene?« (nevtralno, izvedljivo v skupnem kadriHz). V kadriRs dodajte help: »Obračun plač, ki ga opravljate za stranke, meri področje obračunov — tu ga ne ponavljajte.« in explainer: »Samo lastne plače: zbiranje podatkov, popravki po obračunu, poračuni. Pri servisu z nekaj zaposlenimi je to običajno 1–4 ure na mesec.« ter postavko vrednotite po context.operationalHourCostEUR. Če se odločite za nadomestno vprašanje iz §7.1 vrstice 15, ga NE zastavljajte kot število obračunov: število brez ur ni mogoče monetizirati, zato bi moralo biti bodisi contextOnly (brez evrov) bodisi zastavljeno kot »Koliko ur mesečno vzamejo ponovljeni obračuni plač zaradi sprememb, sporočenih po roku?« z enoto h/mesec.

**Sklic na raziskavo:** §6.1 proces 19; §7.1 vrstica 15 (11), vrstica 7 (popravki zaradi slabih vhodov, 13); §8.1 izjeme/100 dokumentov

**Popravek preverbe.** Vsebina in številke potrjene brez pridržkov. Konkretiziran je alternativni predlog: »Koliko obračunov plač na mesec je treba ponoviti?« kot zastavljen ni izvedljiv — polje s štetjem obračunov nima poti do evra, compute() pa mora vrniti bodisi znesek bodisi nič; zato ali contextOnly ali preformulacija v ure. Dodano tudi, da bruto postavka v poročilo pride pomnožena z naslovljivim deležem (potential.ts:43–44), kar velikosti napake ne odpravi, jo pa pravilno umesti.


### 83. kadriHz.hrAdminHoursPerMonth — »Koliko ur mesečno gre za dopuste, potne naloge, potrdila in drugo kadrovsko administracijo?«

**Sodba:** IZBOLJŠAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno: polje je horizontal.ts:281–288, brez help in explainerja. Servis kadrovsko administracijo (prijave, odjave, potrdila) pogosto opravlja tudi za stranke in besedilo tega ne izključuje; tako delo po vsebini pripada donosnostRs.unbilledHoursPerMonth (racunovodstvo.ts:508–519), ki izrecno našteva »dodatna vprašanja, izredna poročila, svetovanje«. Ocena velikosti za lastno ekipo S1–S3 (§3.1: 2–4 oziroma 5–15 FTE) je verjetna.

**Predlog.** Label: »Koliko ur mesečno gre za dopuste, potne naloge, potrdila in drugo kadrovsko administracijo VAŠE ekipe?« (nevtralno, skupni modul). V kadriRs help: »Kadrovsko administracijo, ki jo opravljate za stranke, sem ne štejte.« in explainer: »Samo lastna ekipa. Ocenite: koliko opravil na mesec × koliko minut na opravilo. Primer: 10 opravil × 15 min ≈ 2,5 ure.« Vrednotenje po adminHourCostEUR ohranite tudi v kadriRs — ta postavka res pade na vodstvo (contexts/racunovodstvo.ts:107–116).

**Sklic na raziskavo:** §7.1 vrstica 24 (pooblastila in dostopi, 10), vrstica 19 (11); §3.1 arhetipi S1–S3

**Popravek preverbe.** Sklic popravljen (polje je horizontal.ts:281–288, ne 282–288). Predlog razdeljen na nevtralni del (label) za skupni modul in servisni del (help/explainer) za kadriRs; sicer vsebinsko potrjen, vključno z ohranitvijo adminHourCostEUR.


### 84. kadriHz.annualPayrollErrorEUR — »Koliko so v zadnjih 12 mesecih stali napačni obračuni plač (poračuni, zamudne obresti, zunanja pomoč)?«

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno: polje je horizontal.ts:289–296, izid v koš directLoss (horizontal.ts:325–330), directLoss pa je edini koš, ki gre v naslovni znesek trdega denarja (moduleTypes.ts:18–19). Trije primeri v oklepaju so v tem segmentu res že vprašani: »zunanja pomoč« = obracuniRs.externalHelpCostEUR (racunovodstvo.ts:301–308), »poračuni in zamudne obresti« pa popravkiRs.selfReportCostEUR (racunovodstvo.ts:421–432) in creditNoteCostEUR (:433–440). Polje res nima ne help, ne explainerja, ne allowUnknown, čeprav je allowUnknown namenjen prav zneskom, ki jih podjetje bodisi vodi bodisi ne (moduleTypes.ts:160–168).

**Predlog.** V SKUPNEM kadriHz naredite dvoje, ker je oboje nevtralno za vse segmente: (1) iz labela črtajte »zunanja pomoč« → »Koliko so v zadnjih 12 mesecih stali napačni obračuni plač (poračuni, zamudne obresti)?«; (2) dodajte allowUnknown: true. V kadriRs dodatno: label z »VAŠIH zaposlenih«, help »Stroški napak pri obračunih za stranke sem ne sodijo — te meri področje napak in popravkov.« in explainer »Seštejte zadnjih 12 mesecev; če jih ni bilo, vpišite 0.« (54 znakov, nad spodnjo mejo 40 iz explainers.test.ts:47). Polja NE odstranjujte: brez njega bi kadriRs ostal brez vsakega directLoss vnosa, prazna vrednost pa se s privzetkom 0 in allowUnknown obnaša pravilno.

**Sklic na raziskavo:** §7.1 vrstica 15 (11), vrstica 7 (13); §9.1 (denarna korist ni prihodek); trdo pravilo »ista ura ali evro ne smeta v dve področji«

**Popravek preverbe.** Popravljen sklic: komentar »Edino to gre v hero znesek« je pri directLoss na moduleTypes.ts:18–19 (ne 20–21; 20–21 je lostMargin). Predlog razdeljen: črtanje »zunanje pomoči« in allowUnknown sta varna v skupnem modulu, help, ki imenuje sosednje področje, pa krši pravilo horizontal.ts:19–23 in sodi le v kadriRs. Zavrnjena je zaključna možnost »polje raje odstranite«: kadriRs bi ostal brez directLoss postavke, allowUnknown pa neodgovor tako ali tako loči od potrjene ničle (moduleTypes.ts:38–43).


### 85. kadriHz.mainCause — »Kaj je glavni vzrok?« (KADRI_CAUSES, horizontal.ts:240–246)

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno: vzrok množi celoten znesek področja (horizontal.ts:300 → potential.ts:43–44), četrta možnost »Zunanji obračun plač zahteva ročno pripravo podatkov« (horizontal.ts:244) je kategorije external = 0,25 (addressableShare.ts:32), privzetek je »Ne vemo« = 0,30 (addressableShare.ts:47, 62). Za servis je četrta možnost res absurdna ali — še slabše — potrdi napačno branje modula. Predlagani nabor je shemsko pravilen: pet možnosti, mainCauseField sam doda »Ne vemo« in zaporedne indekse (addressableShare.ts:56–69).

**Predlog.** V panožni kadriRs: 1) »Evidence ur se zbirajo ročno — papir ali preglednice« (data), 2) »Podatki o dopustih in dodatkih so raztreseni« (data), 3) »Kadrovska evidenca ni nikogaršnja glavna naloga« (people), 4) »Lastne plače naredimo med delom za stranke, v zadnjem hipu« (planning), 5) »Pravila za dodatke in nadomestila so zapletena« (planning). Skupnega KADRI_CAUSES ne spreminjajte — možnost o zunanjem obračunu plač je za preostalih šest segmentov pravilna in je edina 'external' varovalka pred precenitvijo. V kadriRs zapišite v komentar, da nabor namenoma nima 'external' vzroka (servis plače dela sam), sicer bo videti kot spregled.

**Sklic na raziskavo:** §7.1 vrstica 15 (11), vrstica 9 (12), vrstica 20 (nejasna kontrolna odgovornost, 11); §9.1 naslovljive ure = bruto × rešljiv delež × fit

**Popravek preverbe.** Vsebina potrjena; dodana dva pogoja, ki ju predlog ni imel: (1) izrecno naj se spremeni SAMO kadriRs, ker je »zunanji obračun plač« za drugih šest segmentov pravi vzrok; (2) nov nabor ostane brez kategorije 'external', kar je treba zapisati kot odločitev — sicer je videti kot izpuščena možnost, obenem pa pomeni, da najnižji naslovljivi delež (0,25) v tem področju ni več dosegljiv.


### 86. kadriHz.compute — vse tri urne postavke se vrednotijo po adminHourCostEUR (horizontal.ts:301)

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno v celoti: contexts/racunovodstvo.ts:107–116 adminHour definira kot »Vodja računovodstva, davčni svetovalec, pregled in podpis pred oddajo« s fallbackom 30 EUR in izrecnim komentarjem, da ta ura ni zamenljiva z operativno; operationalHour (:99–105, fallback 24 EUR na :104) je »Računovodja, referent, knjigovodja«. Zbiranje evidenc prisotnosti in priprava plač te odgovornosti ne nosita. Precedens za ločeno vrednotenje znotraj enega modula obstaja tako v horizontali (servisHz: horizontal.ts:535 operativna, :542 vodstvena) kot v panožnih modulih (popravkiRs: racunovodstvo.ts:450 proti :459).

**Predlog.** V kadriRs: timesheetHoursPerMonth in payrollPrepHoursPerMonth po context.operationalHourCostEUR, hrAdminHoursPerMonth po context.adminHourCostEUR; annualPayrollErrorEUR ostane directLoss brez postavke. Sočasno popravite content/methodology.ts (vnos za kadriHz je na :307–312), ki danes navaja »× strošek administrativne ure × 12« za vse tri postavke — nov vnos za kadriRs mora ločiti obe postavki, sicer bo prodajno poročilo navajalo množitelj, ki ga koda ne uporablja. Vnos v methodology in v content/actions/actions.ts (kadriHz je na :364–371) je za nov id obvezen — brez njega pade moduleEngine.test.ts:366–374.

**Sklic na raziskavo:** §9.1 finančni model; §8.1 prihodek/FTE; trdo pravilo »ni lažne natančnosti«

**Popravek preverbe.** Vsebina in vsi sklici potrjeni (fallback 24 je na :104, ne :105). Dodana dva izvedbena pogoja, ki ju predlog ni navedel: obstoječi precedens ločenih postavk znotraj enega modula (servisHz, popravkiRs), in obveznost vnosa v MODULE_METHODOLOGY ter ACTION_PLANS za nov id, ki jo uveljavlja test moduleEngine.test.ts:366–374.


### 87. kadriHz.pantheon — tri alineje (horizontal.ts:333–337)

**Sodba:** IZBOLJŠAJ · **Resnost:** nizka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno: alineja »Obračun plač po slovenski zakonodaji, brez zunanjih preglednic« je na horizontal.ts:335 in je res neponudljiva servisu, ki plače obračunava profesionalno. Alineje gredo v priporočilo prodajne priprave iz področja z največjo postavko (salesPlaybook.ts:129–132) in v izpis področja v poročilu (salesReport.ts:415).

**Predlog.** V kadriRs morajo alineje ostati znotraj obsega modula, ki po popravkih meri LASTNE kadre: »Registracija delovnega časa lastne ekipe, povezana z obračunom«, »Evidenca lastnih ur po stranki, povezana z obračunom storitve in ceno«, »Dopusti, potni nalogi in kadrovske evidence na enem mestu«. Alineji o uvozu prisotnosti STRANK in o obračunu plač ZA STRANKE ne sodita sem — prva pripada zajemRs, druga obracuniRs, ki jo v obliki »Obračun plač s pripadajočimi obrazci« že ima (racunovodstvo.ts:373).

**Sklic na raziskavo:** §7.1 vrstica 15 (11), vrstica 3 (14); §8.1 avtomatsko knjiženje ≥70 %

**Popravek preverbe.** Predlagane alineje sem zavrnil kot notranje protislovne: ugotovitve 8–13 kadriRs zamejijo na LASTNE zaposlene, predlagane alineje (»Uvoz prisotnosti strank«, »Obračun plač za stranke«) pa opisujejo delo za stranke — prav to, česar modul po popravku ne meri več. Prodajna priprava bi tako spet ponujala rešitev za bolečino, ki je v tem področju ni izmerila. Nadomeščeno z alinejami v obsegu modula; alineja o obračunu plač za stranke je že v obracuniRs (racunovodstvo.ts:373). Sklic razširjen na horizontal.ts:333–337.


### 88. Izpust financeHz iz segmenta racunovodstvo (segments.ts:223–224: »knjiženje in obračuni SO njihov produkt«)

**Sodba:** OHRANI · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno ob dejanskih besedilih in drži: financeHz.bookingHoursPerMonth izrecno pravi »za računovodstvo (interno ali zunanji servis)« (horizontal.ts:157), med vzroki je »Odvisni smo od zunanjega servisa« (horizontal.ts:135) — modul je pisan z gledišča kupca računovodstva. V servisu bi bookingHoursPerMonth podvojil zajemRs, closingHoursPerMonth obracuniRs, annualPenaltyEUR pa obracuniRs.latePenaltyCostEUR (racunovodstvo.ts:309–320), in to po vodstveni uri (horizontal.ts:199) namesto po operativni (racunovodstvo.ts:338). Edina postavka, ki jo izpust res odnese, je reconciliationHoursPerMonth (horizontal.ts:167–179) — glej ločeno ugotovitev »dodaj«.

**Predlog.** —

**Sklic na raziskavo:** §7.1 vrstica 10 (neusklajeni saldakonti in banka, 12); §6.1 procesa 14 in 15; §7.2

**Popravek preverbe.** Verdict potrjen, popravljen sklic na test: invarianto varuje horizontal.test.ts:265 (expect(SEGMENTS.racunovodstvo.moduleIds).not.toContain('financeHz')), ne :271 — :271 je trditev o logistiki in servisHz. Sklic na reconciliationHoursPerMonth je horizontal.ts:167–179.


### 89. Izpust dokumentiHz iz segmenta racunovodstvo (segments.ts:224: »zajem listin meri zajemRs«)

**Sodba:** OHRANI · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno in drži za vsa štiri polja: searchArchiveHoursPerMonth (horizontal.ts:378–384) in manualExchangeHoursPerMonth (:385–392) sta skoraj dobesedno zajemRs.filingHoursPerMonth »skeniranje, razvrščanje in arhiviranje listin« (racunovodstvo.ts:109–115), approvalHoursPerMonth (horizontal.ts:365–377) se v servisu prelije v strankeRs.chasingHoursPerMonth (racunovodstvo.ts:181–187), annualDocDelayEUR pa meri zamujene skonte kupca (horizontal.ts:393–400), česar servis nima. Drži tudi posledica: rok 1. 1. 2028 nosi dokumentiHz le v alineji (horizontal.ts:439), edino pravo vprašanje o njem je eInvoiceZierded v modulu E (legacy.ts:266–272), ta pa je viden samo uporabnikom PANTHEON (contexts/index.ts:58–62), torej ne servisu na »Drugem računovodskem programu« ali »Kombinaciji programa, Excela in papirja« (contexts/racunovodstvo.ts:78–84).

**Predlog.** —

**Sklic na raziskavo:** §15 ZIERDED (obvezni strukturirani e-računi od 1. 1. 2028, [S06][S07]); §7.1 vrstica 2 (14), vrstica 3 (14), vrstica 23 (10)

**Popravek preverbe.** Verdict potrjen brez pridržkov. Popravljeni sklici: zajemRs.filingHoursPerMonth je racunovodstvo.ts:109–115 (ne 110–118), strankeRs.chasingHoursPerMonth :181–187, eInvoiceZierded legacy.ts:266–272. Ena besedna napaka v izvirniku (»ZIERDED« zapisan kot »ZIERDED: rok ... nosi le alineja« z okvarjeno besedo) ne vpliva na vsebino.


### 90. Izpust servisHz iz segmenta racunovodstvo (segments.ts:224–225: »popravki po lastni napaki so v popravkiRs, servisa ni«)

**Sodba:** OHRANI · **Resnost:** nizka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno: komentar horizontal.ts:454–459 modul izrecno zamejuje na servis in garancije PO PREDAJI izdelka ali projekta, polja pa so :475–498 in :499–510. Ekvivalent za servis je popravkiRs v celoti (correctionHoursPerMonth, reviewHoursPerMonth, selfReportCostEUR, creditNoteCostEUR — racunovodstvo.ts:401–440), ki pokriva tudi kulanco (»dobropisi, popusti ali odpisane storitve zaradi lastne napake«, :434–440).

**Predlog.** —

**Sklic na raziskavo:** §7.1 vrstica 7 (13), vrstica 20 (11); §8.1 izjeme/100 dokumentov

**Popravek preverbe.** Verdict potrjen. Popravljen sklic na test: izpust servisHz iz segmenta racunovodstvo varuje horizontal.test.ts:272 (komentar na :269–270), ne :274–277. Polja servisHz so :475–510.


### 91. DODAJ: pripravljenost na ZIERDED za servise, ki niso uporabniki PANTHEON

**Sodba:** DODAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Vrzel je resnična: modul E je viden samo, če je izbrani sedanji sistem označen isPantheon (contexts/index.ts:58–62), servis na »Drugem računovodskem programu«, »Kombinaciji programa, Excela in papirja« ali »Večinoma ročno« (contexts/racunovodstvo.ts:78–85) torej o roku 1. 1. 2028 ne dobi nobenega vprašanja. Tveganje se po trdem pravilu ne monetizira; modul E to že spoštuje (izidi so bucket 'risk' z riskLevel in note, brez EUR — legacy.ts:285–293).

**Predlog.** Uvrstitev: NE dodajaj zdaj v obliki (a), DODAJ KMALU v obliki (b). Pot (a) odpade, kot je zapisana: moduleE nima vidnosti po postavkah — fields se generirajo iz vseh MODULE_E_ITEMS naenkrat (legacy.ts:279–284), zato bi izjema za segment racunovodstvo servisu brez PANTHEON-a hkrati pokazala še »Uporabljamo SQL Server 2016« in »Uporabljamo Windows Server 2016« (legacy.ts:254–265) — točno tisti šum, ki ga komentar contexts/index.ts:48–56 prepoveduje. Če se za to pot vseeno odločite, potrebuje vidnost na ravni postavke, ne modula. Pot (b) je izvedljiva, a NE kot novo polje o »deležu strank«, ker se prekriva s strankeRs.deliveryMethod (racunovodstvo.ts:212–224), katerega možnost 0 je že »Prek portala ali samodejne izmenjave«. Konkretno: v strankeRs takoj za deliveryMethod dodajte polje key 'structuredInvoiceShare', kind 'choice', contextOnly: true, default 2, možnosti z zaporednimi indeksi 0 »Večina — strukturirani e-računi«, 1 »Približno polovica«, 2 »Manjšina«, 3 »Nobena — PDF, skeni, papir«, label »Kolikšen delež strank vam listine pošilja kot strukturiran e-račun (PDF ne šteje)?«, help »Strukturiran e-račun je strojno berljiv zapis (eSlog, PEPPOL); PDF po e-pošti to ni.« + obvezni explainer »Groba ocena zadostuje. Od 1. 1. 2028 je taka izmenjava med domačimi podjetji obvezna, zato je delež hkrati merilo pripravljenosti.« Ker je polje contextOnly, ne prispeva ne evra ne tveganja — v prodajno poročilo pride kot odgovor področja (salesReport.ts:407–413).

**Sklic na raziskavo:** §15 ZIERDED [S06][S07]; §8.1 delež strukturiranih vhodov (zeleno ≥80 %); §7.1 vrstica 2 (14), vrstica 23 (10)

**Popravek preverbe.** Pot (a) ovržena kot zapisana: modul E svoja tri opozorila generira iz enega seznama (legacy.ts:279–284), zato segmentne izjeme ni mogoče omejiti na e-račun — servis bi dobil še obe strežniški opozorili, kar je ravno tisto, čemur se pravilo contexts/index.ts:48–56 izogiba. Pot (b) potrjena, a konkretizirana in razmejena od obstoječega strankeRs.deliveryMethod (racunovodstvo.ts:212–224), s katerim se je predlog delno podvajal; dodani ključ, tip, privzetek, help in obvezni explainer (help brez explainerja pade na explainers.test.ts:29–32). Dodana uvrstitev: NE zdaj za (a), kmalu za (b). Popravljena tudi trditev, da mora izid v koš 'risk' — contextOnly polje ne proizvede nobenega izida; koš 'risk' velja le za pot (a).


### 92. DODAJ: usklajevanje banke in saldakontov — postavka, ki jo je odnesel izpust financeHz

**Sodba:** DODAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Vrzel potrjena z branjem vseh petih panožnih modulov: zajemRs bančne postavke omenja le kot vrsto listine v helpu (racunovodstvo.ts:67), popravkiRs.correctionHoursPerMonth meri »usklajevanje kontov, ki se NE izidejo« (racunovodstvo.ts:402–409), torej izjemo, ne rednega mesečnega usklajevanja vsake stranke. Edino polje, ki je to res merilo, je financeHz.reconciliationHoursPerMonth (horizontal.ts:167–179), ki z upravičenim izpustom horizontale odpade. Uvoz financeHz zaradi treh podvojenih polj ne pride v poštev (glej ugotovitev o izpustu).

**Predlog.** Uvrstitev: DODAJ KMALU (en modul, eno polje, en izid, en popravek metodologije). Konkretno: v obracuniRs (ne v zajemRs — gre za mesečni zaključek, proces 20, in modul že uporablja operativno uro na racunovodstvo.ts:338) takoj za reportPrepHoursPerMonth dodajte polje key 'reconciliationHoursPerMonth', kind 'number', unit 'h/mesec', default 0, label »Koliko ur mesečno gre za usklajevanje bančnih izpiskov in odprtih postavk po vseh strankah?«, help »Popravljanje napačnih knjižb sem ne sodi — to meri področje Napake in popravki.«, explainer »Redno mesečno usklajevanje pri vseh strankah, ne iskanje napak. Ocenite: koliko strank × koliko minut na stranko na mesec. Primer: 60 strank × 10 min ≈ 10 ur.« Izid: bucket 'capacity', label »Usklajevanje banke in odprtih postavk«, valueEUR = ure × context.operationalHourCostEUR × 12, hoursPerMonth, addressableShare. Sočasno dopolnite popravkiRs.correctionHoursPerMonth z zrcalno mejo (»redno mesečno usklajevanje meri področje Obračuni«) — brez tega je meja enosmerna — in dopolnite formulo v content/methodology.ts (vnos obracuniRs, :235–240).

**Sklic na raziskavo:** §7.1 vrstica 10 (12); §6.1 procesa 14 (bančno usklajevanje) in 15 (terjatve in obveznosti); §8.1 avtomatsko knjiženje ≥70 %

**Popravek preverbe.** Vrzel potrjena, predlog pa je bil premalo določen za izvedbo (»eno polje v zajemRs ali obracuniRs«). Konkretiziran: modul obracuniRs z utemeljitvijo (proces 20, modul že vrednoti po operativni uri), ključ, tip, enota, privzetek, koš, formula, mesto vstavitve. Dodana dva pogoja, ki ju predlog ni imel: zrcalna meja v popravkiRs.correctionHoursPerMonth (sicer pravilo »ista ura ne v dve področji« ostane enosmerno) in obvezna uskladitev formule v content/methodology.ts:235–240. Dodana uvrstitev: dodaj kmalu.


### 93. DODAJ: panožni različici analitikaRs in kadriRs namesto neposredne uporabe analitikaHz in kadriHz

**Sodba:** DODAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Diagnoza drži: modul je en niz na en id, analitikaHz uporablja šest segmentov (segments.ts:79, 108, 136, 166, 198, 233), kadriHz sedem (:81, 110, 138, 168, 200, 234, 266), zato vsaka servisna formulacija škodi ostalim. Precedens za panožno različico istega modula obstaja (legacy.ts:298–324, makeModuleA/B/C/D z ločenimi id-ji). Brez tega ostaneta odprta dva neodpravljiva problema: pomenski trk ključa reportPrepHoursPerMonth z obracuniRs in vodstvena urna postavka na urah, ki po vsebini pripadajo obracuniRs.

**Predlog.** Uvrstitev: DODAJ KMALU (ne zdaj v isti gradnji z besedilnimi popravki — ti so izvedljivi takoj in ločeno). Izvedba: nova datoteka src/config/modules/racunovodstvoHz.ts z analitikaRs in kadriRs, uvoz v src/config/modules/index.ts:22–32 (register), zamenjava id-jev v segments.ts:233–234, preimenovanje reportPrepHoursPerMonth → ownReportPrepHoursPerMonth v analitikaRs, vnosa v content/methodology.ts in content/actions/actions.ts (oba obvezna po moduleEngine.test.ts:366–374). Popraviti je treba SAMO horizontal.test.ts:260–264 (»vsak segment ponudi vsaj dve horizontali«): segment racunovodstvo bi ostal z ničlo. Preden pade prva vrstica kode, zapišite v komentar datoteke, katera polja so namenoma podvojena z obliko skupne horizontale in katera ne — sicer bo naslednji pregled panožno različico razumel kot razhod, ne kot odločitev. Do takrat v skupnih modulih naredite le nevtralne popravke (prompta obeh triaž, summary kadriHz, label-e z »vaših zaposlenih«, črtanje »zunanje pomoči«, allowUnknown).

**Sklic na raziskavo:** §7.1 (vrstice 15, 11, 8); §9.1; trdo pravilo »ista ura ali evro ne smeta v dve področji«

**Popravek preverbe.** Dva izvedbena napotka popravljena. (1) »Nove stolpce na konec exportRecord.ts« ODPADE: glava CSV je namenoma fiksna za vse segmente, modulski vnosi gredo v en sam stolpec moduleInputsJson (exportRecord.ts:135–199), zato preimenovanje ključa ne zahteva nobenega stolpca in ne premakne nobene pozicijske CRM preslikave. (2) »Popravek horizontal.test.ts:262–278« je preširok: test o razvrstitvi horizontal (:240–258) po zamenjavi NE pade — segmente brez horizontale preskoči (:243 continue). Pade samo trditev o vsaj dveh horizontalah (:260–264); trditvi :265–266 (brez financeHz, brez dokumentiHz) ostaneta resnični. Dodana uvrstitev (dodaj kmalu) in zaporedje: nevtralni popravki takoj, panožni razcep za njimi.


### 94. content/methodology.ts:295–300 (analitikaHz) — trditev »Ure, vpisane v drugem področju, se tu ne ponavljajo — ista ura se nikoli ne šteje dvakrat.«

**Sodba:** IZBOLJŠAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Trditev je dobesedno na content/methodology.ts:299 in gre v prodajno poročilo kot metodologija področja (salesReport.ts:416). Preverjeno: motor med moduli res ne primerja vnosov (vsak modul ima svoj values[definition.id] — plausibility.ts:56), edina varovalka je ovojnica s pragom 40 % kapacitete (plausibility.ts:27, 67–75), kar pri 4 zaposlenih pomeni 256 h/mesec. Prekrivanje ključa reportPrepHoursPerMonth med analitikaHz (horizontal.ts:51–52) in obracuniRs (racunovodstvo.ts:290–292) je torej v tem segmentu res nezavarovano.

**Predlog.** Prepišite rationale v preverljivo obliko: »Vsako področje vpraša po svojem delu procesa in vsako vprašanje pove, kaj vanj ne sodi. Kadar vnesene ure presežejo 40 % skupne mesečne kapacitete vaše ekipe, izračun na to izrecno opozori.« Prag 40 % zapišite s številko, ker ga koda dejansko uporablja (plausibility.ts:27) in ker je opozorilo, ki ga obiskovalec vidi, že tako formulirano (»Preverite, da se iste ure ne štejejo v dveh področjih« — plausibility.ts:83–91); brez številke bi bila nova trditev enako nepreverljiva kot stara. Isti popravek naredite pri vnosu dokumentiHz (content/methodology.ts:313–318), kjer je ista obljuba (»Ure, vpisane v drugem področju, se tu ne ponavljajo«) dobesedno ponovljena. Nato v panožnih različicah res uveljavite ločnico (nov ključ + help, ki sme imenovati sosednje področje), sicer ostane popravek besedni.

**Sklic na raziskavo:** §9.1; trdi pravili »ista ura ali evro ne smeta v dve področji« in »ni lažne natančnosti«

**Popravek preverbe.** Trditev in vsi sklici potrjeni; predlagano nadomestno besedilo pa je bilo v drugem stavku ohlapno (»Kjer se vnesene ure približajo kapaciteti ekipe«), kar bi bila druga nepreverljiva obljuba — koda opozori šele nad 40 % kapacitete, ne ob 'približevanju'. Vstavljen dejanski prag iz plausibility.ts:27. Dodano: identično obljubo nosi tudi vnos dokumentiHz (methodology.ts:317), ki ga ugotovitev ni zajela, in besedilo obstoječega opozorila (plausibility.ts:83–91), s katerim mora biti nova formulacija skladna.


## Področje: Manjkajoča področja — vprašalnik za računovodski servis (obseg: kaj dodati, kaj namenoma ne)

### 95. [dodaj zdaj] Koliko strank danes vodite?

**Sodba:** DODAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno in drži: polja clientCount v src/ ni (grep brez zadetka), naslovna številka '+X strank brez nove zaposlitve' je v src/components/Results/ResultsView.tsx:87, izračun v src/components/Calculator/CalculatorFlow.tsx:272-279, donosnostRs.belowCostClients je na src/config/modules/racunovodstvo.ts:521, diagnostikaRs pa je res edini modul brez triaže (racunovodstvo.ts:620, brez ključa triage) in je zato po src/lib/moduleEngine.ts resolveActiveModules vedno aktiven. Vprašanje ne prispeva ne ure ne evra, zato dvojno štetje strukturno ni mogoče.

**Predlog.** KAM: diagnostikaRs (racunovodstvo.ts:620), kot PRVO polje pred knowsHoursPerClient (:626). POLJE: key 'clientCount', label 'Koliko strank danes vodite?', kind 'number', unit 'strank', default 0, contextOnly: true. HELP: 'Podatek ne vstopa v izračun. Iz njega izpeljemo, koliko odstotkov rasti pomeni sproščen čas.' EXPLAINER (obvezen, ker je help — src/config/modules/explainers.test.ts zahteva 40–600 znakov in različno besedilo): 'Aktivne stranke, za katere redno knjižite ali obračunavate plače — enkratnih storitev ne štejte. Če se število čez leto spreminja, vpišite povprečje. Primer: 46.' KOŠ: brez; compute() diagnostikeRs (:654) ostane nedotaknjen. NADALJNJE: summary na :623 popravi iz 'Štiri vprašanja o podatkih in odpornosti procesa' v 'Pet vprašanj …' in enako komentar na :614; v ResultsView.tsx:87 naslov izpiši kot '+3,4 stranke (≈ 7 % vaših 46)' samo, kadar je clientCount > 0. MEJA: proti belowCostClients (:521 — podmnožica) in basicInfo.employeeCount (ljudje, ne stranke).

**Sklic na raziskavo:** §3.3 segmentacija S1–S4 (20–80 / 40–150 / 100–350 / 250–1.000 strank); §3.1 velikost trga (4.397 subjektov, 4.077,5 FTE); §8.1 KPI 10 prispevna marža stranke, KPI 11 prihodek/FTE

**Popravek preverbe.** Vsi sklici na kodo preverjeni in točni. Popravki: (a) segmentacija po številu strank je v §3.3, ne §3.1 — v §3.1 so le velikost trga in FTE; (b) oznaki 'K11 prispevna marža' in 'K12 prihodek/FTE' ne obstajata — v §8.1 je tabela dvanajstih KPI-jev, kjer je prispevna marža deseta in prihodek/FTE enajsta (celotna oštevilčenja K03–K18 v teh ugotovitvah so zamaknjena, K13–K18 pa v raziskavi sploh ni); (c) 'nov stolpec na konec src/lib/exportRecord.ts' NI potreben — buildCsvRow (exportRecord.ts:218-264) izvozi JSON.stringify(record.moduleInputs), zato novo polje samodejno pride v CSV; ločen stolpec je neobvezen in bi zahteval hkratno dopolnitev CSV_COLUMNS (:146) in buildCsvRow, sicer pade test enake dolžine; (d) summary diagnostikeRs je na :623, popraviti je treba tudi komentar na :614.


### 96. [dodaj zdaj] Ali lahko za stranke že danes prevzamete in oddate strukturiran e-račun (eSlog, UBL), ne le PDF?

**Sodba:** DODAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno in drži v celoti: eInvoiceZierded je res na src/config/modules/legacy.ts:267, isTechnicalRiskModuleVisible (src/config/contexts/index.ts:58-62) vrne true samo za možnost z isPantheon, filter je v CalculatorFlow.tsx:154-157, kontekst servisa (src/config/contexts/racunovodstvo.ts) pa ima tri ne-PANTHEON možnosti (drugProgram, programExcel, rocno). Servis na drugem programu edinega zavezujočega roka torej ne vidi. ASSURANCE_CHOICES so točno na shared.ts:40-45.

**Predlog.** KAM: diagnostikaRs (racunovodstvo.ts:620), za auditTrail (:640). POLJE: key 'eInvoiceCapability', label 'Ali lahko za stranke že danes prevzamete in oddate strukturiran e-račun (eSlog, UBL), ne le PDF?', kind 'choice', choices ASSURANCE_CHOICES (shared.ts:40-45), default 1. HELP: 'PDF, poslan po e-pošti, ni strukturiran e-račun.' EXPLAINER: 'Strukturiran e-račun je datoteka, ki jo program prebere brez prepisovanja (eSlog, UBL). Od 1. 1. 2028 bo izmenjava med podjetji obvezna v tej obliki: vaša stranka bo potrebovala kanal, vi pa program, ki tak račun prevzame in odda.' KOŠ: risk, kot TRETJI izhod v compute() (racunovodstvo.ts:654-671), z lastno konstanto ZIERDED_NOTE in riskLevelFromScore(input.eInvoiceCapability, 3). BESEDILA: low 'Kanal za strukturirane e-račune je urejen; do 1. 1. 2028 posega ni.'; medium 'Del strank je pokrit, preostale bo treba prevesti — preverite, koliko jih danes pošilja le PDF.'; high 'Brez kanala vam stranka po 1. 1. 2028 ne bo mogla poslati računa, ki bi ga lahko knjižili.' MEJA: proti E.eInvoiceZierded (legacy.ts:267 — LASTNI izdajni kanal, viden samo uporabnikom PANTHEON); oba sta brez EUR, zato podvojitve denarja ni.

**Sklic na raziskavo:** §15.1 ZIERDED (obvezna domača B2B izmenjava strukturiranih e-računov od 1. 1. 2028, PDF ni dovolj, [S06][S07]); §7.1 bolečina 23 različna digitalna zrelost strank (10); §8.1 KPI 2 strukturirani vhodi

**Popravek preverbe.** Sklici na kodo so točni (legacy.ts:267 ✓, contexts/index.ts:58-62 ✓, CalculatorFlow.tsx:154-157 ✓, shared.ts:40-45 ✓); popravljena sta le sklic na compute() diagnostikeRs (654-671, ne 653-668) in razlaga privzetka: default 1 NE pomeni 'trditev brez odgovora' — riskLevelFromScore(1, 3) = 0,33 in vrne 'medium', torej vprašalnik ob privzetku vseeno izpiše srednje tveganje. Ker je tako pri vseh obstoječih diagnostičnih poljih, privzetek 1 ohranim, a besedilo za 'medium' mora biti zato oblikovano pogojno ('Del strank je pokrit … preverite'), ne kot ugotovitev. Drugi popravek: tveganje mora biti SVOJ izhod z lastnim besedilom, ne del obstoječih dveh — sicer se spremeni pomen že objavljene postavke 'Procesna odpornost'. Bolečina B02 v researchRef ne sodi sem (gre za vhodne kanale), zamenjana z bolečino 23.


### 97. [dodaj zdaj] Koliko ur skupaj opravi ekipa nad rednim delovnikom v sezoni letnih zaključkov (januar–marec)?

**Sodba:** DODAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Drži, da obracuniRs.overtimeHoursPerMonth (racunovodstvo.ts:282) meri mesečne nadure in jih compute množi z MONTHS_PER_YEAR (:346), ter da src/lib/plausibility.ts:62 enoto 'h/leto' pravilno deli z 12. Ugotovitev pa je SPREGLEDALA odločilno podrobnost: obstoječi label na :283-284 se glasi '… zaradi konic ob obračunih in rokih (DDV, plače, zaključni računi)' — sezono zaključkov torej izrecno vabi v mesečno polje. Brez posega v to besedilo bi novo polje iste ure preštelo drugič in kršilo trdo pravilo 'ista ura ne v dve področji'.

**Predlog.** POGOJ: hkrati s poljem PREPIŠI obstoječi label na racunovodstvo.ts:283-284 v 'Koliko nadur mesečno v povprečju nastane zaradi mesečnih konic (DDV, plače, medletna poročila)?' ter mu dodaj help 'Samo mesečni ritem. Ure sezone letnih zaključkov vpišite v naslednje vprašanje.' in (ker help zahteva explainer) explainer 'Nadure, ki nastanejo vsak mesec ob rokih za DDV in plače. Ocenite: koliko oseb × koliko dodatnih ur ob koncu meseca. Primer: 3 osebe × 4 h = 12 ur na mesec.' NOVO POLJE: kam obracuniRs (racunovodstvo.ts:267), takoj za overtimeHoursPerMonth; key 'yearEndOvertimeHoursPerYear', label 'Koliko ur skupaj opravi ekipa nad rednim delovnikom v sezoni letnih zaključkov (januar–marec)?', kind 'number', unit 'h/leto', default 0. HELP: 'Samo sezona zaključkov, AJPES in davčnih obračunov — rednih mesečnih nadur iz prejšnjega vprašanja tu ne ponavljajte.' EXPLAINER: 'Ocenite iz števila ljudi in tednov: koliko oseb × koliko dodatnih ur na teden × koliko tednov sezone. Primer: 4 osebe × 8 h × 8 tednov = 256 ur.' FORMULA: { bucket: 'capacity', label: 'Sezona letnih zaključkov', valueEUR: input.yearEndOvertimeHoursPerYear * context.operationalHourCostEUR, hoursPerMonth: input.yearEndOvertimeHoursPerYear / MONTHS_PER_YEAR, addressableShare } — brez množenja z 12. VSEBINA: dopolni formulo v content/methodology.ts (vnos obracuniRs, vrstice 234-238) z '+ ure sezone zaključkov × strošek računovodske ure'.

**Sklic na raziskavo:** §6.1 koraka 24 (letni zaključek) in 25 (AJPES); §6.3 sezonskost (trije sloji obremenitve, uvajanje izven zaključnega obdobja); §8.1 KPI 6 dnevi do mesečnega zaključka

**Popravek preverbe.** Trije popravki. (1) Sklic 'obstoječi OBRACUNI_CAUSES (racunovodstvo.ts:482-488)' je napačen — OBRACUNI_CAUSES so na 259-265; na 486-492 so DONOSNOST_CAUSES. (2) Predlagana dodatna možnost vzroka 'Zaključki se sestavljajo ročno iz več virov' PODVAJA obstoječo 'Obračuni in poročila se sestavljajo ročno' (:261, kategorija data, isti delež 0,75) — ne dodajaj je. (3) Bistveno: brez prepisa obstoječega labela na :283-284, ki izrecno omenja 'zaključni računi', novo polje ustvari dvojno štetje; predlog je zato pogojen s tem prepisom in z dodanim parom help+explainer (explainers.test.ts zahteva explainer ob vsakem help). methodology.ts:235 je znotraj vnosa obracuniRs (234-238) — sklic je v redu.


### 98. [dodaj zdaj] Koliko ur mesečno gre za usklajevanje bančnih izpiskov ter zapiranje odprtih postavk kupcev in dobaviteljev?

**Sodba:** DODAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Drži: segments.ts:223-226 res utemeljuje izpust financeHz, katerega reconciliationHoursPerMonth (src/config/modules/horizontal.ts:168) bi to delo sicer meril; zajemRs meri vnos listine (:62-116), obracuniRs zaključek in poročila (:290), popravkiRs pa popravke (:403). Koraka 14 in 15 sta res neizmerjena. Opozorilo, da je treba ob uvedbi zožiti popravkiRs.correctionHoursPerMonth, je utemeljeno: njegov obstoječi label (:404-405) se glasi '… ter usklajevanje kontov, ki se ne izidejo' in bi se z novim poljem prekrival.

**Predlog.** KAM: zajemRs (racunovodstvo.ts:47), za filingHoursPerMonth (:110). POLJE: key 'bankMatchingHoursPerMonth', label 'Koliko ur mesečno gre za usklajevanje bančnih izpiskov ter zapiranje odprtih postavk kupcev in dobaviteljev?', kind 'number', unit 'h/mesec', default 0. HELP: 'Redno zapiranje plačil in odprtih postavk. Vnos same bančne postavke je zajet v vprašanjih o listinah zgoraj, popravljanje napačnih knjižb pa meri področje Napake in popravki.' EXPLAINER: 'Ocenite: koliko strank ima bančni promet × koliko minut vzame en izpisek × koliko izpiskov na mesec, deljeno s 60. Primer: 30 strank × 10 min × 4 izpiski = 20 ur.' FORMULA: { bucket: 'capacity', label: 'Usklajevanje banke in odprtih postavk', valueEUR: input.bankMatchingHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR, hoursPerMonth: input.bankMatchingHoursPerMonth, addressableShare }. OBVEZEN SOPOSEG (konkretno besedilo): popravkiRs.correctionHoursPerMonth (:404-405) prepiši v 'Koliko ur mesečno porabite za iskanje in popravljanje napačnih knjižb?', izhodno oznako na :448 v 'Popravljanje napačnih knjižb', dodaj help 'Redno zapiranje banke in odprtih postavk meri področje Zajem — tu samo popravki napak.' in explainer 'Ure, ko je knjižba že narejena, pa je napačna: iskanje razlike, storno, ponovno knjiženje. Primer: 2 osebi × 5 h na mesec = 10 ur.' VSEBINA: dopolni formulo vnosa zajemRs v content/methodology.ts:223. GLAVNI VZROK: uporabi obstoječe ZAJEM_CAUSES (:39-45) brez dodajanja.

**Sklic na raziskavo:** §7.1 bolečina 10 neusklajeni saldakonti in banka (prednost 12, frekvenca 4); §6.1 koraka 14 (bančno usklajevanje) in 15 (terjatve in obveznosti); §6.2 vrstica Banka, KPI '% samodejno ujemanih postavk'

**Popravek preverbe.** Sklici na kodo preverjeni in točni (segments.ts:223-226 ✓, zajemRs :62/:82/:110 ✓, popravkiRs :403 ✓, methodology.ts:223 = vnos zajemRs ✓). Popravki: (a) 'B10 … (frekvenca 12)' je napačno branje matrike §7.1 — 12 je skupna PREDNOST, frekvenca te bolečine je 4; (b) predlagani novi vzrok 'Plačila se ne poberejo samodejno iz izpiska' NE dodajaj: tri ugotovitve hkrati (ta, ocrFixHours in B16) predlagajo dodajanje po ene možnosti v isti petčlanski seznam ZAJEM_CAUSES (:39-45), kar bi ga razširilo na osem in razredčilo obstoječe deleže — dovoljena je največ ena dopolnitev za vse tri skupaj, obstoječa 'Nimamo samodejnega zajema e-računov in bančnih izpiskov' (:41) pa ta primer že pokriva; (c) soposeg v popravkiRs je iz opombe povzdignjen v pogoj in dobil dobesedno besedilo, vključno z obveznim explainerjem ob novem helpu.


### 99. [dodaj zdaj] Ali je pri strankah zapisano, kaj je vključeno v pavšal in kaj se doplača?

**Sodba:** DODAJ · **Resnost:** srednja · **Status:** potrjeno

**Utemeljitev.** Preverjeno in drži v celoti: donosnostRs meri posledico (unbilledHoursPerMonth :509, belowCostClients :521, belowCostDeficitEUR :528), DONOSNOST_CAUSES (:486-492) že vsebujejo 'Cenik ne sledi dejanskemu obsegu dela' (planning), ukrep 'Za dodatno delo se dogovorite vnaprej …' je res v content/actions/actions.ts:301 znotraj vnosa donosnostRs (296-302), vprašalnik pa obstoja dogovora nikjer ne preveri. Polje je contextOnly, zato ne more podvojiti ne ure ne evra; contextOnly odgovori se v prodajno pripravo res prenesejo (src/lib/salesPlaybook.ts:108).

**Predlog.** KAM: donosnostRs (racunovodstvo.ts:494), za belowCostDeficitEUR (:528). POLJE: key 'scopeAgreement', label 'Ali je pri strankah zapisano, kaj je vključeno v pavšal in kaj se doplača?', kind 'choice', default 2, contextOnly: true. MOŽNOSTI (zaporedni indeksi): 0 'Da, pri vseh', 1 'Pri večini', 2 'Le pri nekaterih', 3 'Nikjer — dogovarjamo sproti'. HELP: 'Podatek ne vstopa v izračun — pokaže, ali je neobračunano delo posledica dogovora ali njegove odsotnosti.' EXPLAINER: 'Mišljen je zapis v pogodbi ali ponudbi, ki ga je mogoče pokazati stranki. Primer: do 60 listin na mesec, nad tem 1,20 EUR na listino; letno poročilo vključeno, medletne analize po ceniku.' KOŠ: brez. MEJA: proti unbilledHoursPerMonth (:509 — ure ostanejo tam) in diagnostikaRs.knowsHoursPerClient (:626 — merjenje lastnega časa, ne dogovor s stranko).

**Sklic na raziskavo:** §7.1 bolečina 12 nejasen obseg v mesečnem pavšalu (prednost 11); §6.1 korak 2 (ponudba in pogodba); §8.1 KPI 10 prispevna marža stranke

**Popravek preverbe.** Ugotovitev potrjena brez vsebinskih popravkov; točen je celo sklic na actions.ts:296-301. Drobni popravki sklicev: DONOSNOST_CAUSES so na 486-492 (ne 487-493), oznaka 'K11' za prispevno maržo je v §8.1 deseti KPI. Opozorilo za izvedbo: donosnostRs ima danes pet polj in mainCause; te ugotovitve mu skupaj predlagajo štiri nova (scopeAgreement, capacityUse, onboardingHoursPerClient, lostClientsPerYear), kar bi na eni strani dalo deset vprašanj — to polje ima med njimi prednost, lostClientsPerYear pa naj odpade (glej tam).


### 100. [dodaj zdaj] Do katerega dne v naslednjem mesecu imate zaprtih vsaj 90 % strank?

**Sodba:** DODAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Drži: obracuniRs.closingProcess (racunovodstvo.ts:322) sprašuje KAKO se obračuni pripravljajo (samodejno / iz programa s kontrolami / program in Excel / pretežno ročno), ne KDAJ so končani, in nobeno polje ne meri dneva zaprtja. Polje je contextOnly, brez ur in evrov, zato dvojno štetje ni mogoče, contextOnly odgovori pa gredo v prodajno pripravo (salesPlaybook.ts:108) in v CSV prek moduleInputs (exportRecord.ts:218-264).

**Predlog.** KAM: obracuniRs (racunovodstvo.ts:267), za closingProcess (:322). POLJE: key 'monthClosedByDay', label 'Do katerega dne v naslednjem mesecu imate zaprtih vsaj 90 % strank?', kind 'choice', default 2, contextOnly: true. MOŽNOSTI (zaporedni indeksi): 0 'Do 10. v mesecu', 1 'Do 15.', 2 'Do 20.', 3 'Šele ob roku za DDV ali pozneje'. HELP: 'Podatek ne vstopa v izračun — je merilo, ob katerem boste čez leto videli, ali se je kaj spremenilo.' EXPLAINER: 'Mišljen je mesec, ki je knjižen in usklajen, ne le oddan DDV. Če se stranke močno razlikujejo, ocenite dan, do katerega je urejenih približno devet od desetih.' KOŠ: brez. MEJA: proti overtimeHoursPerMonth (:282 — ure konice) in closingProcess (:322 — način priprave).

**Sklic na raziskavo:** §8.1 KPI 6 dnevi do mesečnega zaključka in KPI 1 dokumenti do cut-offa; §6.1 korak 20 (mesečni cut-off); §6.2 vrstica Mesečni zaključek

**Popravek preverbe.** Vsebinsko potrjeno; sklici na kodo točni. Popravek raziskovalnega sklica: 'K07 dnevi do zaključka' ne obstaja — v tabeli §8.1 je 'Dnevi do mesečnega zaključka' šesti KPI, sedmi so 'Naloge po roku'. Opozorilo za izvedbo: obracuniRs bi s tem in z yearEndOvertimeHoursPerYear zrasel s petih polj + mainCause na sedem + mainCause; ker projekt od zadnjega commita prikazuje eno področje na stran, je to zgornja meja — dodatnih polj v ta modul ne uvrščaj.


### 101. [dodaj kmalu] Kaj bi naredili s časom, ki bi se sprostil?

**Sodba:** DODAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno in drži: src/lib/moduleEngine.ts:64-67 sešteje capacityEUR po polnem strošku ure, computePotentialRange (src/lib/potential.ts:37-50) pa nanj uporabi le addressableShare in pas izboljšave — monetizacijskega faktorja v kodi res ni. Sproščena ura je zato v rezultatu predstavljena, kot da se v celoti pretvori v denar. Faktor množi izključno NAVZDOL, zato nobenega pravila ne krši; nasprotno, brez njega je kršeno pravilo 'prihranek časa ni prihranek plače'.

**Predlog.** KAM (popravljeno): diagnostikaRs (racunovodstvo.ts:620), NE donosnostRs — diagnostikaRs je edini vedno prikazan modul, s čimer rezervni faktor sploh ni potreben. POLJE: key 'capacityUse', label 'Kaj bi naredili s časom, ki bi se sprostil?', kind 'choice', default 3, contextOnly: true. MOŽNOSTI in faktorji: 0 'Sprejeli nove stranke — povpraševanje imamo' → 0,55; 1 'Razširili svetovanje obstoječim strankam' → 0,45; 2 'Zmanjšali nadure in preobremenjenost ekipe' → 0,20; 3 'Ne vemo' (unknown: true, po vzorcu reducibleShareField v shared.ts:74-95) → 0,20. HELP: 'Od tega je odvisno, koliko sproščenega časa se sploh lahko spremeni v denar — manj nadur je olajšanje, ni pa prihodek.' EXPLAINER: 'Sproščena ura ni samodejno denar. Če jo oddate novi stranki, se pretvori skoraj v celoti; če z njo razbremenite ekipo, ostane vrednost v vzdržnosti dela in ne v izkazu.' MOTOR: funkcija monetisationFactorFor(values) v src/lib/potential.ts, uporabljena SAMO na prispevku koša capacity znotraj computePotentialRange (:37-50); rezervni faktor 0,20 le, če polja ni. OBVEZNI SOPOSEG: naslovna številka v ResultsView.tsx:87 se računa iz capacityHoursPerMonth (CalculatorFlow.tsx:272-279) in bi ostala nespremenjena — pri izbiri 2 ('zmanjšali nadure') naslova '+X strank' ne prikazuj, ampak izpiši '≈ X ur na mesec manj nadur', sicer si zaslon sam nasprotuje.

**Sklic na raziskavo:** §9.2 ilustrativni scenariji (monetizacijski faktor kapacitete 20 % / 35 % / 55 %, sprejetje pri strankah 45–80 %); §9.3 pravilo 'ne šteje vseh prihranjenih ur kot denar'; §4.4 kapaciteta kot poslovni rezultat

**Popravek preverbe.** Diagnoza potrjena (moduleEngine.ts:64-67 in potential.ts:37-50 res nimata monetizacijskega faktorja), predlog pa popravljen v treh točkah. (1) Raziskovalni sklic: razpon 20–55 % in sprejetje strank 0,45–0,80 sta v tabeli §9.2, ne v §9.1 — v §9.1 je le formula. (2) Umestitev v donosnostRs terja rezervni faktor 0,20, kadar področja ni v triaži, kar pomeni, da izbira v triaži sama zniža rezultat za 2,75-kratnik; v diagnostikiRs, ki je vedno prikazana (potrjeno prek resolveActiveModules v moduleEngine.ts), te tihe odvisnosti ni. (3) Možnost 'Ne vemo' mora nositi unknown: true, sicer je v prodajni pripravi neločljiva od dejanske izbire. Dodan je manjkajoči soposeg: faktor zniža EVRE, ne pa UR, iz katerih se računa naslov '+X strank' — brez uskladitve bi rezultat trdil dvoje hkrati.


### 102. [dodaj kmalu] Koliko ur v povprečju porabite za prevzem ene nove stranke (začetna stanja, konfiguracija, pooblastila)?

**Sodba:** DODAJ · **Resnost:** visoka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Drži, da naslovna številka deli sproščene ure z hoursPerClientPerMonth (CalculatorFlow.tsx:272-279, polje na racunovodstvo.ts:546) in enkratnega stroška prevzema ne pozna, ter da enota 'h/stranko' ne poruši ovojnice verjetnosti — src/lib/plausibility.test.ts:77 jo izrecno izvzema. Predlagana sprememba motorja pa je napačna: odštevanje enkratnih ur prevzema od MESEČNEGA toka sproščenih ur meša enkratno in ponavljajoče se, kar je ista napaka, ki jo prepoveduje pravilo 'sprostitev kapitala je enkratna', poleg tega je krožno (število novih strank je šele rezultat te delitve).

**Predlog.** KAM: donosnostRs (racunovodstvo.ts:494), tik za hoursPerClientPerMonth (:546). POLJE: key 'onboardingHoursPerClient', label 'Koliko ur v povprečju porabite za prevzem ene nove stranke (začetna stanja, konfiguracija, pooblastila)?', kind 'number', unit 'h/stranko', default 0, contextOnly: true. HELP: 'Enkratno delo ob prevzemu, ne mesečnega vodenja — to sprašujemo posebej v prejšnjem vprašanju.' EXPLAINER: 'Od podpisa pogodbe do prvega rednega obračuna: prenos začetnih stanj, nastavitev kontnega načrta in šifrantov, pooblastila na eDavkih in AJPES, uskladitev z dosedanjim računovodjem. Primer: 12 ur.' KOŠ: brez. MOTOR (popravljeno): naslova NE spreminjaj. Namesto odštevanja izpiši ob njem enkratni zalet, ki ga je mogoče izračunati brez krožnosti: mesecev zaleta = onboardingHoursPerClient / hoursPerClientPerMonth (npr. 12 h / 8 h = 1,5 meseca), z besedilom 'Prvih pribl. 1,5 meseca sproščenega časa gre v prevzem teh strank.' Isti stavek v prodajno pripravo (src/lib/salesReport.ts). MEJA: proti hoursPerClientPerMonth (:546 — mesečno vodenje) in zajemRs.filingHoursPerMonth (:110 — redno arhiviranje, ne migracija).

**Sklic na raziskavo:** §7.1 bolečini 18 migracija in kakovost začetnih stanj (11) in 24 upravljanje pooblastil in dostopov (10); §6.1 koraki 4–6 (pooblastila, prevzem začetnih stanj, konfiguracija); §8.1 KPI 12 čas do produktivnosti; §6.3 (prenos sredi leta pribl. mesec, konec leta do štiri mesece, [S03])

**Popravek preverbe.** Polje potrjeno, predlagana sprememba motorja ovržena in nadomeščena. Odštevanje 'onboardingHoursPerClient × število novih strank' od sproščenih ur pred delitvijo je enotna napaka (enkratne ure proti mesečnemu toku) in je krožno, ker je število novih strank šele izid te delitve. Nadomestni izračun brez obeh napak: mesecev zaleta = onboardingHoursPerClient / hoursPerClientPerMonth — prikaže se ob naslovu kot zalet, ne kot popravek zneska, s čimer polje ostane contextOnly in ne premakne nobenega evra. Popravek raziskovalnega sklica: 'K15 čas do produktivnosti' je v §8.1 dvanajsti in zadnji KPI (K13–K18 ne obstajajo). Potrjeno pa je, da enota 'h/stranko' ne krši sheme — plausibility.test.ts:77 jo izvzema poimensko.


### 103. [dodaj kmalu] Koliko ur mesečno gre za popravljanje samodejno zajetih listin (napačno prebran znesek, napačen konto, podvojen zapis)?

**Sodba:** DODAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Preverjeno in drži: zajemRs vrednoti izključno ročni delež (manualSharePercent :73, privzeto 0,6; formula na :121-122), pas 0,08–0,20 za možnost 'PANTHEON s samodejnim zajemom listin' res obstaja (src/config/contexts/racunovodstvo.ts:67-72), zato servis, ki zajem že ima, izpade skoraj brez izmerjene izgube. Utemeljitev, zakaj URE in ne zmnožek treh polj, je pravilna: src/lib/plausibility.ts:59-62 sešteje samo polja z enoto 'h/mesec' in 'h/leto', zmnožek pa bi ovojnici ušel in ustvaril znesek brez preverjanja.

**Predlog.** KAM: zajemRs (racunovodstvo.ts:47), za minutesPerManualDocument (:82). POLJE: key 'ocrFixHoursPerMonth', label 'Koliko ur mesečno gre za popravljanje samodejno zajetih listin (napačno prebran znesek, napačen konto, podvojen zapis)?', kind 'number', unit 'h/mesec', default 0. HELP: 'Samo popravki PRED knjiženjem. Popravke že knjiženih listin meri področje Napake in popravki.' EXPLAINER: 'Ocenite: koliko samodejno zajetih listin na mesec × delež, ki jih je treba popraviti × minute na popravek, deljeno s 60. Primer: 600 listin × 20 % × 2 min = 4 ure.' FORMULA: { bucket: 'capacity', label: 'Popravki samodejnega zajema', valueEUR: input.ocrFixHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR, hoursPerMonth: input.ocrFixHoursPerMonth, addressableShare }. GLAVNI VZROK: uporabi obstoječe ZAJEM_CAUSES (:39-45) brez dodajanja. VSEBINA: dopolni formulo vnosa zajemRs v content/methodology.ts:223. MEJA: proti manualSharePercent (:73 — ročno vnesene listine niso te) in popravkiRs.correctionHoursPerMonth (:403 — po knjiženju).

**Sklic na raziskavo:** §8.1 KPI 4 avtomatsko knjiženje brez popravka in KPI 5 izjeme na 100 dokumentov; §6.1 koraka 9–10 (OCR/strukturiranje, validacija); §6.2 vrstica OCR in validacija (napačna polja, podvojeni dokumenti); §7.1 bolečini 7 (13) in 16 (11)

**Popravek preverbe.** Vsebina in vsi sklici na kodo potrjeni (manualSharePercent :73 s privzetkom 0,6 ✓, pas 0,08–0,20 v contexts/racunovodstvo.ts:67-72 ✓, plausibility.ts:59-62 ✓). Popravka: (a) predlagane dodatne možnosti vzroka 'Zajem prebere listine, a jih je treba preverjati' NE dodajaj — je ena od treh hkratnih predlaganih razširitev istega petčlanskega seznama ZAJEM_CAUSES (skupaj z bančnim usklajevanjem in podvojenimi listinami), kar bi seznam podvojilo in razredčilo obstoječe deleže; (b) oznake KPI so zamaknjene: 'avtomatsko knjiženje brez popravka' je v §8.1 četrti, 'izjeme na 100 dokumentov' peti KPI. Zaporedje polj: novo polje sodi za minutesPerManualDocument in pred retypingHoursPerMonth, da ročni in samodejni tok stojita drug ob drugem.


### 104. [dodaj kmalu] Ali imate za vsako stranko dokumentirano AML-identifikacijo in letni pregled?

**Sodba:** DODAJ · **Resnost:** nizka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Drži, da diagnostikaRs.auditTrail (racunovodstvo.ts:640) meri sledljivost vnosov in da identifikacije stranke ter letnega pregleda ne meri nič. Drži tudi, da bi merjenje ur AML trčilo ob donosnostRs.unbilledHoursPerMonth (:509), zato je kvalitativna oblika edina čista. Argument o obsegu pa je zdaj močnejši, kot ga je ugotovitev zapisala: diagnostikaRs po ostalih predlogih iz tega pregleda dobi clientCount, eInvoiceCapability in capacityUse, torej sedem vprašanj — to polje je osmo in prvo, ki mora odpasti.

**Predlog.** NE dodajaj v tem krogu. Če se pozneje doda: KAM diagnostikaRs (racunovodstvo.ts:620), key 'amlDocumentation', label 'Ali imate za vsako stranko dokumentirano AML-identifikacijo in letni pregled?', kind 'choice', choices ASSURANCE_CHOICES (shared.ts:40-45), default 1. HELP: 'Mišljena je dokumentacija, ki jo je mogoče pokazati nadzorniku, ne spomin na to, da ste stranko videli.' EXPLAINER: 'Identifikacija stranke in dejanskega lastnika, ocena tveganja in redni pregled podatkov. Če je dokumentacija v mapah po strankah in je ni mogoče pregledati na enem mestu, izberite Le približno.' KOŠ: risk, in sicer kot SVOJ izhod z lastnim besedilom (AML_RISK_NOTE) in riskLevelFromScore(input.amlDocumentation, 3) — NE kot tretji člen obstoječega processLevel. MEJA: brez EUR in ur; proti auditTrail (:640 — sledljivost vnosov) in unbilledHoursPerMonth (:509 — ure ostanejo tam).

**Sklic na raziskavo:** §10.2 AML in varstvo podatkov; §7.1 bolečina 25 AML, GDPR in revizijska sled (10); §6.1 korak 3 (AML identifikacija)

**Popravek preverbe.** Vsebina potrjena, izvedba in prioriteta popravljeni. (1) Sklic 'PROCESS_RISK_NOTE (racunovodstvo.ts:610-616)' je napačen — konstanta je na 607-611. (2) Predlagana vključitev v obstoječi processLevel prek riskLevelFromScore(auditTrail + keyPersonIndependence + amlDocumentation, 9) je zavrnjena: postavka 'Procesna odpornost' je že objavljena in njeno besedilo govori o revizijski sledi in odvisnosti od posameznika — vmešana skladnost bi tiho spremenila pomen že prikazanega tveganja in zabrisala, kaj je pravzaprav rdeče. AML mora imeti svoj izhod ali pa ga ni. (3) Severina znižana s 'srednja' na 'nizka' in uvrstitev iz 'kmalu' v 'ne v tem krogu': diagnostikaRs po drugih potrjenih predlogih tega pregleda naraste na sedem vprašanj, njen lastni opis (:623) pa obljublja kratko diagnostiko. Sklic '§6.1 korak 3' je točen, 'K08' ne obstaja v obliki, kot je navedena.


### 105. [dodaj kmalu] Koliko ur je v zadnjih 12 mesecih šlo za uvajanje novih sodelavcev (mentorstvo, dvojno delo, pregledovanje za novincem)?

**Sodba:** DODAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Drži: bolečini 13 in 14 sta danes izmerjeni le kvalitativno prek diagnostikaRs.keyPersonIndependence (racunovodstvo.ts:647), kadriHz.hrAdminHoursPerMonth (src/config/modules/horizontal.ts:282) pa res našteva dopuste, potne naloge in potrdila, ne uvajanja. Mentorske ure so že plačane in se z boljšim procesom ne izbrišejo iz plačne mase, zato je koš capacity pravilen, vrednotenje po adminHourCostEUR pa utemeljeno (mentor je praviloma vodja). Enota 'h/leto' je prava izbira: plausibility.ts:62 jo deli z 12.

**Predlog.** KAM: kadriHz (src/config/modules/horizontal.ts:248), za hrAdminHoursPerMonth (:282). POLJE: key 'onboardingTrainingHoursPerYear', label 'Koliko ur je v zadnjih 12 mesecih šlo za uvajanje novih sodelavcev (mentorstvo, dvojno delo, pregledovanje za novincem)?', kind 'number', unit 'h/leto', default 0. HELP: 'Samo dodatno delo zaradi uvajanja. Rednega strokovnega izobraževanja in seminarjev ne štejte; kontrol zaradi nezaupanja v podatke tudi ne — te meri področje Napake in popravki.' EXPLAINER: 'Ocenite: koliko novincev × koliko tednov uvajanja × koliko ur na teden je ob njih porabil mentor. Primer: 2 novinca × 8 tednov × 4 ure = 64 ur.' FORMULA: { bucket: 'capacity', label: 'Uvajanje novih sodelavcev', valueEUR: input.onboardingTrainingHoursPerYear * context.adminHourCostEUR, hoursPerMonth: input.onboardingTrainingHoursPerYear / MONTHS_PER_YEAR, addressableShare }. GLAVNI VZROK: uporabi obstoječe KADRI_CAUSES (horizontal.ts:240-246) brez dodajanja. SOPOSEG: dopolni formulo vnosa kadriHz v content/methodology.ts:307 in v popravkiRs.reviewHoursPerMonth (racunovodstvo.ts:415) dopiši mejo 'Ur uvajanja novincev sem ne štejte.' MEJA: proti kadriHz.hrAdminHoursPerMonth (:282) in popravkiRs.reviewHoursPerMonth (:411).

**Sklic na raziskavo:** §7.1 bolečini 13 počasno uvajanje novih sodelavcev (11) in 14 težavno nadomeščanje odsotnosti (11), bolečina 9 znanje je v glavi posameznika (12); §8.1 KPI 12 čas do produktivnosti novega člana; §6.1 korak 6

**Popravek preverbe.** Vsebina potrjena; sklici na kodo popravljeni in dopolnjeni. (1) kadriHz se izvozi na horizontal.ts:248, ne 249; payrollPrepHoursPerMonth je res :275 in hrAdminHoursPerMonth :282. (2) Predlagana nova možnost vzroka 'Postopki niso zapisani, znanje je v glavah' se ZAVRNE: KADRI_CAUSES so horizontalni in jih uporablja šest segmentov, dodana možnost premakne porazdelitev naslovljivega deleža povsod, obstoječa 'Kadrovska evidenca ni nikogaršnja glavna naloga' (people) pa isti primer že pokriva. (3) Ugotovitev je izpustila, da ima kadriHz vnos tudi v content/methodology.ts:307 — formulo je treba dopolniti tam, sicer metodologija ne ustreza izračunu. (4) Napovedana meja proti reviewHoursPerMonth mora biti dobesedno v OBEH besedilih; besedilo za oba je zgoraj. Popravek sklica: 'K15' je v §8.1 dvanajsti KPI.


### 106. [dodaj kmalu] Koliko obračunov plač mesečno morate ponoviti zaradi sprememb, ki jih stranka sporoči po roku?

**Sodba:** DODAJ · **Resnost:** srednja · **Status:** potrjeno

**Utemeljitev.** Preverjeno in drži v celoti, tudi najbolj tvegana trditev: kadriHz.payrollPrepHoursPerMonth (src/config/modules/horizontal.ts:275) se glasi 'Koliko ur mesečno vzame priprava podatkov za obračun plač in popravki po obračunu?' — besede 'lastne' res ni, zato bo servis to polje v tem segmentu verjetno izpolnil z urami za stranke, obracuniRs.reportPrepHoursPerMonth (racunovodstvo.ts:290) pa iste ure že meri. Števec brez evrov je zato edina varna oblika: enota 'obračunov/mesec' se ne začne s 'h/', zato ne vstopa niti v ovojnico verjetnosti (plausibility.ts:59-62).

**Predlog.** KAM: obracuniRs (racunovodstvo.ts:267), za reportPrepHoursPerMonth (:290). POLJE: key 'payrollRerunsPerMonth', label 'Koliko obračunov plač mesečno morate ponoviti zaradi sprememb, ki jih stranka sporoči po roku?', kind 'number', unit 'obračunov/mesec', default 0, contextOnly: true. HELP: 'Podatek ne vstopa v izračun — pokaže, koliko dela nastane po tem, ko je obračun že narejen. Ur ne vpisujte, te so v prejšnjem vprašanju.' EXPLAINER: 'Šteje vsak ponoven obračun ali popravek že oddanega REK-a zaradi podatka, ki je prišel po dogovorjenem roku: naknadna bolniška, dopust, izplačilo, sprememba pogodbe. Primer: 5 na mesec.' KOŠ: brez. PRIPOROČENI SOPOSEG (ločen, verdikt izboljsaj): kadriHz.payrollPrepHoursPerMonth (horizontal.ts:275) naj dobi help 'Vaše lastne plače, ne obračunov za stranke.' in pripadajoč explainer — brez tega ostane dvoumnost, ki jo ta ugotovitev opisuje. MEJA: proti reportPrepHoursPerMonth (:290), popravkiRs.correctionHoursPerMonth (:403) in kadriHz.payrollPrepHoursPerMonth (:275).

**Sklic na raziskavo:** §7.1 bolečina 15 zadnje spremembe pri plačah (11); §6.1 korak 19 (plače in kadri); §6.2 vrstica Plače (pozni podatki in spremembe, KPI popravki/100 zaposlenih); §8.1 KPI 7 naloge po roku

**Popravek preverbe.** Ugotovitev potrjena; vsi trije sklici na kodo preverjeni in točni, tudi opažanje o manjkajoči besedi 'lastne' v horizontal.ts:275. Dopolnitve: (a) v help dodan izrecen stavek, naj se ur ne vpisuje — sicer bo kdo v števec vpisal ure; (b) izboljšava kadriHz je izrecno ločena kot samostojen poseg, da ne ostane le v obrazložitvi; (c) popravek raziskovalnega sklica: 'K08 naloge po roku' je v §8.1 sedmi KPI, osmi so 'popravki DDV/100 strank'.


### 107. [dodaj kmalu] Po koliko različnih poteh vam stranke pošiljajo listine in vprašanja?

**Sodba:** DODAJ · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Drži: strankeRs.deliveryMethod (racunovodstvo.ts:213) je ena sama izbira o prevladujočem načinu (portal / e-pošta dogovorjeno / e-pošta vsak po svoje / osebno ali papir) in ne pove, koliko vzporednih poti je treba pred avtomatizacijo združiti. Števec ne prispeva ur ne evrov (contextOnly), enota 'poti' ne vstopa v ovojnico verjetnosti. Trditev o obsegu modula pa ne drži: strankeRs ima danes štiri polja in mainCause, ne sedem.

**Predlog.** KAM: strankeRs (racunovodstvo.ts:167), tik pred deliveryMethod (:213). POLJE: key 'intakeChannelCount', label 'Po koliko različnih poteh vam stranke pošiljajo listine in vprašanja (e-pošta, portal, papir, ključek, sporočila, osebno)?', kind 'number', unit 'poti', default 0, contextOnly: true. HELP: 'Podatek ne vstopa v izračun — pokaže, koliko poti je treba združiti, preden se zajem sploh lahko avtomatizira.' EXPLAINER: 'Preštejte poti, ki jih dejansko uporabljate, ne tistih, ki ste jih dogovorili: e-pošta na skupni naslov, e-pošta osebnemu referentu, portal, papir v mapi, sporočila na telefon, USB-ključek. Primer: 4.' KOŠ: brez. MEJA: proti deliveryMethod (:213 — prevladujoč NAČIN, tu ŠTEVILO poti) ter chasingHoursPerMonth in inquiryHoursPerMonth (:182, :189 — vse ure ostanejo tam).

**Sklic na raziskavo:** §7.1 bolečini 2 dokumenti po e-pošti, papirju, mapah in sporočilih (frekvenca 5, prednost 14) in 17 razpršena komunikacija s stranko (frekvenca 4, prednost 11); §7.2 vzročna veriga (več vhodnih kanalov → pozni dokumenti → opomniki → napake); §6.1 korak 7

**Popravek preverbe.** Vsebina potrjena, dve trditvi popravljeni. (1) 'strankeRs bi dobil tretje contextOnly polje od sedmih' ne drži: modul ima danes štiri vsebinska polja (:182, :189, :201, :213) in mainCause, od tega dve contextOnly — po dodatku bo tretje contextOnly od šestih. (2) 'B02 (14) in B17 (11) sta v najvišjem razredu frekvence' velja le za prvo: v matriki §7.1 je frekvenca bolečine 2 res 5, frekvenca bolečine 17 pa 4; številki 14 in 11 sta skupni prednosti, ne frekvenci. Pripomba ugotovitve, da bi bilo namesto tega morda bolje predelati deliveryMethod, je smiselna, a novi števec in obstoječa izbira merita različni stvari (koliko poti proti temu, katera prevladuje) in se ne izključujeta.


### 108. [dodaj kmalu] Koliko strank ste v zadnjih 12 mesecih izgubili (odpoved, prehod k drugemu servisu)?

**Sodba:** DODAJ · **Resnost:** nizka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Drži, da donosnostRs.declinedClientsPerYear (racunovodstvo.ts:558) meri le zavrnjene stranke in da odhoda ne meri nič, korak 28 pa je v vprašalniku prazen. Polje je contextOnly in ne krši nobenega trdega pravila. Pridobitek je majhen, obseg pa ni: donosnostRs bi po ostalih predlogih tega pregleda (scopeAgreement, onboardingHoursPerClient) že imel sedem polj z mainCause vred, to bi bilo osmo — na eni strani obrazca preveč.

**Predlog.** UVRSTITEV popravljena iz 'kmalu' v 'zadnje, in samo če donosnostRs ostane pod osmimi polji'. Če se doda: KAM donosnostRs (racunovodstvo.ts:494), tik za declinedClientsPerYear (:558). POLJE: key 'lostClientsPerYear', label 'Koliko strank ste v zadnjih 12 mesecih izgubili (odpoved, prehod k drugemu servisu)?', kind 'number', unit 'strank/leto', default 0, contextOnly: true. HELP: 'Podatek ne vstopa v izračun. Prenehanja poslovanja ali stečaja stranke ne štejte — zanima nas odhod, na katerega bi lahko vplivali.' EXPLAINER: 'Stranke, ki so odpovedale pogodbo in odšle drugam. Če se je delež strank le zmanjšal, štejte samo tiste, ki so odšle v celoti. Primer: 3.' KOŠ: brez — nikoli denarne vrednosti (glej postavko o monetizaciji odhodov). MEJA: proti declinedClientsPerYear (:558 — nikoli sprejete) in belowCostClients (:521 — aktivne pod lastno ceno).

**Sklic na raziskavo:** §6.1 korak 28 (offboarding oziroma prenos); §6.3 in [S03] (prenos ob menjavi izvajalca traja mesec do štiri mesece); §16.1 dogodki, ki sprožijo nakup

**Popravek preverbe.** Vsebinsko potrjeno, prioriteta znižana. Sklica :558 in :521 sta točna. Popravki: (a) uvrstitev iz 'dodaj kmalu' v 'zadnje in pogojno' — donosnostRs je edini modul, ki mu ta pregled predlaga tri druga polja, in bi z njimi presegel obseg ene strani; (b) 'vprašalnik je za servis že pri približno 35 poljih' je ocena brez podlage: pet panožnih modulov, analitikaHz, kadriHz in diagnostikaRs skupaj štejejo okoli 40 polj, obiskovalec pa jih ob priporočenih treh triažnih izbirah (segments.ts:241) vidi bistveno manj — argument o obsegu zato drži na ravni ENEGA modula, ne celotnega vprašalnika; (c) explainer dopolnjen, da je daljši od 40 znakov, kot zahteva explainers.test.ts; (d) sklica 'K18 sprejetje strank' in 'B23' sta neustrezna in nadomeščena.


### 109. [NE dodajaj zdaj] Koliko bi lahko zaslužili s svetovanjem, če bi imeli čas? (B19)

**Sodba:** OHRANI · **Resnost:** visoka · **Status:** potrjeno

**Utemeljitev.** Potrjeno. Hipotetični prihodek iz svetovanja krši dve trdi pravili hkrati ('prihodek ni korist' in 'korist je prispevna marža'), obenem pa bi iste ure preštel drugič: koš capacity jih že vsebuje (src/lib/moduleEngine.ts:64-67), tokrat kot vrednost sproščenega časa. Raziskava sama v §9.3 izrecno prepoveduje šteti vse prihranjene ure kot denar. Prava obravnava bolečine 19 je monetizacijski faktor iz §9.2, ne nova denarna postavka.

**Predlog.** Ne dodajaj. Če se pojavi pritisk po prikazu potenciala svetovanja, naj se pove v prodajni pripravi kot besedilo BREZ zneska (src/lib/salesPlaybook.ts, ki contextOnly odgovore že bere na :108), izpeljano iz donosnostRs.declinedClientsPerYear (racunovodstvo.ts:558) in totals.capacityHoursPerMonth — nikoli kot postavka v naslovnem znesku. MEJA: proti celotnemu košu capacity (moduleEngine.ts:64-67).

**Sklic na raziskavo:** §9.3 pravila dobrega poslovnega primera ('ne šteje vseh prihranjenih ur kot denar'); §9.2 monetizacijski faktor kapacitete; §7.1 bolečina 19 premalo časa za svetovanje (11)

**Popravek preverbe.** Potrjeno brez vsebinskih popravkov; koš capacity se res sešteva na moduleEngine.ts:64-67 in salesPlaybook.ts obstaja ter bere contextOnly odgovore (:108). Popravek sklica: monetizacijski faktor je v tabeli §9.2, prepoved štetja vseh ur kot denarja pa v §9.1 ni — je v §9.3.


### 110. [NE dodajaj zdaj] Koliko letno plačujete za programe, vzdrževanje in gostovanje? (B22, TCO)

**Sodba:** OHRANI · **Resnost:** srednja · **Status:** potrjeno

**Utemeljitev.** Potrjeno. Sedanji strošek IT ni izguba in v nobenega od petih košev ne sodi (src/config/modules/moduleTypes.ts:17-36 — directLoss, lostMargin, capacity, oneTimeCapital, risk); edina vloga bi mu bila imenovalec ROI, torej prodajni in ne diagnostični podatek. Ugovor na ceno je res že obdelan drugje (content/sales/objections.ts, src/lib/salesPlaybook.ts obstajata). Sredi vprašalnika, ki obljublja izmerjeno izgubo, bi vprašanje o obstoječih izdatkih delovalo kot priprava na ponudbo.

**Predlog.** Ne dodajaj v vprašalnik. Če bo podatek potreben za primerjavo naložbe, naj ga prodajnik vpraša na sestanku; mesto zanj je med vprašanji za odpiranje v prodajni pripravi (src/lib/salesReport.ts). MEJA: ločitev košev v moduleTypes.ts:17-36 strukturno preprečuje, da bi se sedanji izdatek kdaj prištel k prihranku — prav to je razlog, da polja ni.

**Sklic na raziskavo:** §7.1 bolečina 22 stroški podpore in dodatkov niso predvidljivi (10); §9.1 formula vrednosti (strošek mora vključiti licence, implementacijo, migracijo, usposabljanje, podporo, integracije); trdo pravilo 'prihodek ni korist'

**Popravek preverbe.** Potrjeno; sklic moduleTypes.ts:17-36 je natančen (BucketId s petimi koši), obe datoteki prodajne poti obstajata (content/sales/objections.ts, src/lib/salesReport.ts). Dodano opozorilo iz raziskave: §9.1 zahteva, da se v strošek naložbe štejejo tudi migracija, usposabljanje in padec produktivnosti v prehodu — če se TCO kdaj pojavi, mora priti v prodajni dokument z vsemi temi postavkami, ne kot ena sama letna številka.


### 111. [NE dodajaj zdaj] Kolikšen delež listin prejmete v strukturirani e-obliki? (K02, B23)

**Sodba:** OHRANI · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Potrjeno, da polja ne kaže dodajati: zajemRs.manualSharePercent (src/config/modules/racunovodstvo.ts:73, privzeto 0,6) in delež strukturiranih vhodov sta v očeh obiskovalca skoraj komplementarna odstotka v istem modulu, motor pa preverjanja skladnosti nima — neskladen par (60 % ročnih in 60 % strukturiranih) ne bi sprožil ničesar. Regulativni del bolečine pokrije diagnostično vprašanje o zmožnosti za strukturiran e-račun, ki je odgovorljivo brez odstotka.

**Predlog.** Ne dodajaj kot samostojno polje in tudi NE izpeljuj kot 1 − manualSharePercent. Izvoz naj ostane pri surovem manualSharePercent (v CSV pride prek moduleInputs, src/lib/exportRecord.ts:218-264). MEJA: proti manualSharePercent (:73). OPOMBA za pozneje: če se doda ocrFixHoursPerMonth, postane tok trodelen (ročno vneseno / samodejno zajeto in popravljeno / strukturirano prevzeto) in takrat je vprašanje o strukturiranem deležu treba presoditi znova — takrat ne bo več komplement.

**Sklic na raziskavo:** §8.1 KPI 2 strukturirani vhodi (zeleno >=80 %, rdeče <50 %); §7.1 bolečina 23 različna digitalna zrelost strank (10); §15.1 e-računi 2028

**Popravek preverbe.** Sklep 'ne dodajaj' potrjen, predlog pa popravljen: izpeljava K02 kot 1 − manualSharePercent in njeno označevanje v exportRecord.ts je LAŽNA NATANČNOST in krši trdo pravilo. Deleža nista komplementarna — listina, ki pride kot PDF in jo prebere OCR, ni ne ročno vnesena ne strukturirana, zato bi izpeljani odstotek prodajniku pripisoval meritev, ki je nihče ni opravil (raziskava §8.1 K02 zahteva 'e-računi + portal + API / vsi'). Izvozi se surovo polje in nič drugega. Dodana je tudi povezava z ocrFixHoursPerMonth, ki utemeljitev čez čas spremeni.


### 112. [NE dodajaj zdaj] Koliko podvojenih dokumentov mesečno odkrijete? (B16)

**Sodba:** OHRANI · **Resnost:** nizka · **Status:** popravljeno ob preverbi

**Utemeljitev.** Potrjeno. Števila podvojenih listin ne vodi noben servis, zato vprašanje ni odgovorljivo iz glave v 30 sekundah, ocena pa bi bila izmišljena osnova za znesek. Ure so v evrih že prijavljene: vnos v zajemRs (racunovodstvo.ts:62-96) in odkrivanje ter popravek v popravkiRs.correctionHoursPerMonth (:403).

**Predlog.** Ne dodajaj polja. Tudi predlagane nove možnosti vzroka 'Iste listine prejmemo po več poteh' NE dodajaj samodejno: seznam ZAJEM_CAUSES (:39-45) ima pet možnosti, ta pregled pa mu na treh mestih hkrati predlaga razširitev. Če se doda ena sama, naj bo to prav ta (kategorija 'data', delež 0,75 po src/config/modules/addressableShare.ts:29), obe drugi predlagani pa odpadeta — sicer se naslovljivi delež razblini med osem možnosti in ista sprememba spremeni rezultat vsem obstoječim vnosom.

**Sklic na raziskavo:** §7.1 bolečina 16 podvojeni dokumenti (11); §6.2 vrstica OCR in validacija (podvojeni dokumenti, kontrole duplikatov); merilo odgovorljivosti v 30 sekundah

**Popravek preverbe.** Sklep potrjen; sklici točni in delež 'data' = 0,75 je preverjen v addressableShare.ts:29. Popravek: formulacija 'v ZAJEM_CAUSES že obstaja prostor za možnost …' zamolči, da gre za četrto tako predlagano razširitev istega seznama v tem pregledu (še pri bančnem usklajevanju in pri popravkih samodejnega zajema). Ker vsaka dodana možnost prerazporedi naslovljivi delež pri VSEH obstoječih vnosih zajemRs, je dopustna največ ena — in ta je med njimi najboljša kandidatka, ker pokriva bolečino, ki drugače ostane povsem neimenovana.


### 113. [NE dodajaj zdaj] Koliko ur mesečno izgubite, ker programi strank niso povezani z vašim? (B21)

**Sodba:** OHRANI · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Potrjeno. zajemRs.retypingHoursPerMonth (src/config/modules/racunovodstvo.ts:97) meri prav te ure — label izrecno govori o 'prepisovanju istih podatkov med programi (plače, glavna knjiga, poročila, portali)', izhodna postavka se glasi 'Prepisovanje podatkov med programi' (:135-141), ZAJEM_CAUSES pa vsebujejo 'Podatke vodimo v več ločenih programih' (:42). Novo polje bi bilo isto vprašanje z drugimi besedami in bi znesek podvojilo pri vsakem, ki obeh besedil ne prebere pozorno.

**Predlog.** Ne dodajaj. Razliko med vašimi in strankinimi programi reši z dopolnitvijo OBSTOJEČEGA explainerja pri retypingHoursPerMonth (racunovodstvo.ts:103-107) — polje explainer že ima, zato ga ne dodajaj, ampak mu pripni stavek: 'Sem sodi tudi prepisovanje iz programa ali preglednice stranke v vaš program — nepovezanost s stranko je isti prepis, ne novo področje.' Skupna dolžina ostane pod 600 znaki, kot zahteva src/config/modules/explainers.test.ts:48. MEJA: proti retypingHoursPerMonth (:97) — popolno prekrivanje ur.

**Sklic na raziskavo:** §7.1 bolečina 21 nepovezani programi strank (10); §6.1 koraki 7–9 (vhodni kanali, zajem, OCR/strukturiranje); §12.2 integracijske prioritete

**Popravek preverbe.** Sklep in vsi sklici potrjeni (:97 ✓, izhodna oznaka pri :135-141 ✓, vzrok na :42 ✓). Popravek izvedbe: predlog 'reši jo z besedilom explainer pri retypingHoursPerMonth' bi bralec razumel kot dodajanje explainerja, ki pa na tem polju že obstaja (:103-107) — poseg je torej DOPOLNITEV obstoječega besedila, z dobesednim stavkom zgoraj in z upoštevanjem zgornje meje 600 znakov iz explainers.test.ts.


### 114. [NE dodajaj zdaj] Koliko časa vzamejo pooblastila in dostopi (eDavki, AJPES, banka)? (B24)

**Sodba:** OHRANI · **Resnost:** nizka · **Status:** potrjeno

**Utemeljitev.** Potrjeno. Gre za enkratno delo ob prevzemu stranke (§6.1, korak 4), ki je v mesečnem merilu šum; ločeno polje bi vprašalnik podaljšalo za znesek, ki v naslovni številki ne bi bil viden, in bi hkrati odprlo mejo proti prevzemu stranke. Vsebinsko sodi v ure prevzema, kjer ga predlog onboardingHoursPerClient že poimensko našteva.

**Predlog.** Ne dodajaj ločeno — pooblastila ostanejo našteta v labelu in explainerju polja donosnostRs.onboardingHoursPerClient, kot je predlagano pri tisti postavki. MEJA: proti onboardingHoursPerClient (isti korak vrednostne verige) in proti zajemRs.filingHoursPerMonth (racunovodstvo.ts:110 — arhiviranje ni urejanje dostopov; to polje danes nima ne help ne explainer besedila, zato meje ne varuje nič, a ker novega polja ni, tudi prekrivanja ni).

**Sklic na raziskavo:** §7.1 bolečina 24 upravljanje pooblastil in dostopov (10); §6.1 korak 4 (pooblastila); §6.3 in [S03] (ob menjavi izvajalca je potreben dogovor o presečnem datumu, dokumentaciji in pooblastilih)

**Popravek preverbe.** Potrjeno brez vsebinskih popravkov; sklic zajemRs.filingHoursPerMonth (:110) je točen. Dodano dejstvo iz kode: to polje nima ne help ne explainer besedila, kar pomeni, da bi ga bilo treba ob morebitnem poznejšem dodajanju polja o dostopih opremiti z mejo — dokler polja ni, poseg ni potreben.


### 115. [NE dodajaj zdaj] Koliko ur mesečno gre za pripravo poročil za stranke? (korak 22)

**Sodba:** OHRANI · **Resnost:** visoka · **Status:** potrjeno

**Utemeljitev.** Potrjeno v celoti. Iste ure merita dve polji v istem segmentu: obracuniRs.reportPrepHoursPerMonth (src/config/modules/racunovodstvo.ts:290, 'ročna priprava obračunov in poročil') in analitikaHz.reportPrepHoursPerMonth (src/config/modules/horizontal.ts:51, 'redna poročila za vodstvo ali lastnike') — ključ je res isti v obeh modulih (kar samo po sebi ni napaka, ker so vrednosti ločene po id modula, je pa opozorilo). Tretje polje bi mejo dokončno razgradilo, saj je pri servisu 'vodstvo' lahko vodstvo stranke.

**Predlog.** Ne dodajaj. Namesto tega zaostri obstoječo mejo (samostojen poseg, verdikt izboljsaj): v analitikaHz naj bo v tem segmentu izrecno govor o poročilih za VAŠE vodstvo, v obracuniRs pa o poročilih STRANKAM. Dokler tega ni, mejo varuje edino help na horizontal.ts:56 ('Ure, ki ste jih že vpisali v drugem področju, tu ne ponavljajte.'), ki tega segmenta ne omenja. MEJA: proti obema poljema (:290 in horizontal.ts:51).

**Sklic na raziskavo:** §7.1 bolečina 11 ročni Exceli za poročanje (12); §6.1 korak 22 (poročanje stranki); §6.2 vrstica Poročanje (KPI čas do poročila, delež avtomatiziranih)

**Popravek preverbe.** Potrjeno; obe polji in enakost ključev preverjeni. Drobni popravek: help, ki mejo varuje, je na horizontal.ts:56, ne :57. Dodano pojasnilo, da enak ključ v dveh modulih ni tehnična napaka (vrednosti so v moduleInputs ločene po id modula) — tveganje je izključno v razumevanju obiskovalca, kar sklep te ugotovitve še krepi.


### 116. [NE dodajaj zdaj] Koliko izjem na 100 listin nastane pri obdelavi? (K06)

**Sodba:** OHRANI · **Resnost:** nizka · **Status:** potrjeno

**Utemeljitev.** Potrjeno. Kazalnik je merljiv šele iz sistema po uvedbi — raziskava ga sama uvršča med predpilotne meritve, ki se zbirajo štiri tedne pred uvedbo (§8.2), ne med vprašanja, na katera lastnik odgovori iz glave. Posledice izjem so v evrih že zajete: popravkiRs.correctionHoursPerMonth (src/config/modules/racunovodstvo.ts:403) in reviewHoursPerMonth (:411).

**Predlog.** Ne dodajaj v vprašalnik. Uvrsti kazalnik med meritve PO uvedbi; mesto zanj je v content/actions/actions.ts:288-294 (ukrepi za popravkiRs), kjer ukrep 'Mesec dni beležite vzrok vsakega popravka …' (:291) že stoji in ga je dovolj dopolniti s štetjem izjem na 100 listin. MEJA: proti correctionHoursPerMonth (:403) — ure izjem so tam.

**Sklic na raziskavo:** §8.1 KPI 5 izjeme na 100 dokumentov (padajoč trimesečni trend); §8.2 merilni načrt pred pilotom (delež izjem se beleži štiri tedne pred uvedbo); §7.1 bolečina 5 nepregledne izjeme in odprte naloge (13)

**Popravek preverbe.** Potrjeno; sklici :403, :411 in actions.ts:288-294 so točni, ukrep o beleženju vzroka popravka je res na :291. Popravka raziskovalnih oznak: 'izjeme na 100 dokumentov' je v §8.1 peti KPI (ne K06), argument o merljivosti šele po uvedbi pa ima izrecno oporo v §8.2, ki jo ugotovitev ni navedla in ki je močnejša od sklicevanja na merilo odgovorljivosti.


### 117. [NE dodajaj zdaj] Koliko denarja imate vezanega v neplačanih računih strankam (koš oneTimeCapital, strošek financiranja)?

**Sodba:** OHRANI · **Resnost:** srednja · **Status:** potrjeno

**Utemeljitev.** Potrjeno, in sicer dobesedno: utemeljitev izpusta koša oneTimeCapital je zapisana na src/config/modules/racunovodstvo.ts:24-26 ('Servis ne drži zaloge in si zato ne more sprostiti obratnega kapitala — vsiljena postavka bi bila prazna številka, ki bi delovala kot prihranek'). Kontekst servisa (src/config/contexts/racunovodstvo.ts) res nima vprašanja o strošku kapitala, zato bi vsak tak izračun tekel na privzetih 6 % iz src/config/modules/shared.ts:27 — znesek brez potrditve. Med 25 bolečinami raziskave neplačanih terjatev servisa res ni.

**Predlog.** Ne dodajaj. Če se bo terjatveni modul kdaj zahteval, mora pred njim v kontekst servisa priti vprašanje o strošku kapitala in ločen prikaz enkratnega učinka — brez tega bi postavka kršila trdo pravilo 'sprostitev kapitala je enkratna'. MEJA: proti donosnostRs.belowCostDeficitEUR (racunovodstvo.ts:528 — mesečni primanjkljaj, torej letni odliv); vezan denar v terjatvah je enkraten in se z njim ne sme seštevati, kar strukturno ločuje že BucketId (moduleTypes.ts:17-36).

**Sklic na raziskavo:** §7.1 (med 25 bolečinami ni nobene o neplačanih terjatvah servisa); trdo pravilo 'sprostitev kapitala je enkratna'; src/config/modules/racunovodstvo.ts:24-26

**Popravek preverbe.** Potrjeno brez popravkov — edina ugotovitev v tem sklopu, kjer se ujemajo prav vse številke vrstic: racunovodstvo.ts:24-26 je natanko odstavek o izpuščenem košu, shared.ts:27 je natanko RECEIVABLES_CAPITAL_COST = 0.06, kontekst servisa vprašanja o strošku kapitala nima (privzetek pride iz emptyProfileFor), belowCostDeficitEUR je na :528. Sklic na §7.1 potrjen s pregledom celotne matrike 25 bolečin.


### 118. [NE dodajaj zdaj] Ali imate urejena notranja pravila elektronske hrambe? (korak 27)

**Sodba:** OHRANI · **Resnost:** nizka · **Status:** potrjeno

**Utemeljitev.** Potrjeno. Ure arhiviranja meri zajemRs.filingHoursPerMonth (src/config/modules/racunovodstvo.ts:110), sledljivost pa diagnostikaRs.auditTrail (:640); manjka le formalna skladnost, ki je obiskovalec brez pravnega pregleda ne more oceniti in ki se ne monetizira. Argument o obsegu je celo močnejši, kot je zapisan: diagnostikaRs po drugih potrjenih predlogih tega pregleda raste na sedem vprašanj, njen summary (:623) pa obljublja kratko diagnostiko.

**Predlog.** Ne dodajaj. Temo pokrij med ukrepi v content/actions/actions.ts (vnos zajemRs, vrstice 264-271), kamor sodi kot četrti ukrep o pravilih hrambe. MEJA: proti filingHoursPerMonth (:110 — ure arhiviranja) in auditTrail (:640 — sledljivost); novo polje ne bi dodalo ne ur ne evrov, dodalo pa bi utrujenost vprašalnika.

**Sklic na raziskavo:** §7.1 bolečina 25 AML, GDPR in revizijska sled (10); §10.2 AML in varstvo podatkov; §6.1 korak 27 (arhiv in hramba)

**Popravek preverbe.** Potrjeno; sklic content/actions/actions.ts:264-271 je natančen (vnos zajemRs s tremi ukrepi), prav tako :110, :640 in summary na :623. Opomba: vnos zajemRs v actions.ts ima danes tri ukrepe kot vsi drugi vnosi — dodan četrti bi bil edini tak, zato je vredno presoditi zamenjavo namesto dodajanja.


### 119. [NE dodajaj zdaj] Novo (šesto) stroškovno področje oziroma nov modul za računovodski servis

**Sodba:** OHRANI · **Resnost:** srednja · **Status:** popravljeno ob preverbi

**Utemeljitev.** Potrjeno. Segment ima v src/config/segments.ts:227-237 devet modulov, od katerih sta diagnostikaRs in E brez triaže — triažnih področij je torej res sedem ob priporočenih treh izbirah (:241). Novo področje bi to razmerje poslabšalo. Drži tudi, da so vsi predlogi tega pregleda POLJA v obstoječih modulih in da nobeno ne zahteva novega vnosa v content/methodology.ts ali content/actions/actions.ts.

**Predlog.** Ne dodajaj modula. Če bi se kdaj pokazala potreba po področju 'Prevzem in prenehanje stranke' (koraki 1–6 in 28), naj vstopi šele ob hkratni odstranitvi enega obstoječega področja in z lastnim vnosom v content/methodology.ts (formula in utemeljitev) ter tremi ukrepi v content/actions/actions.ts. MEJA: proti donosnostRs (racunovodstvo.ts:494) — prevzem in donosnost stranke sta isti pogovor in bi si delila ure prevzema.

**Sklic na raziskavo:** §6.1 (28 korakov vrednostne verige); §7.1 (25 bolečin, najvišja prednost 14); src/config/segments.ts:227-241

**Popravek preverbe.** Sklep potrjen, dve trditvi popravljeni. (1) '§6.1 … prioriteta maks 15 bolečin' ne drži: §6.1 našteva 28 korakov, matrika bolečin je §7.1 in ima 25 vrstic z najvišjo prednostjo 14, ne 15. (2) 'nobeden ne zahteva novega vnosa v content/methodology.ts … le dopolnitev obstoječih formul' velja, a seznam dopolnitev je nepopoln — poleg methodology.ts:223 (zajemRs) in vnosa obracuniRs (234-238) je treba ob polju o uvajanju sodelavcev dopolniti še vnos kadriHz na methodology.ts:307, ki ga ugotovitev ni omenila.


---

Skupaj 119 sodb.
