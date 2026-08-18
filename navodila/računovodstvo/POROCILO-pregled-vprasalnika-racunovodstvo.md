# Pregled vprašalnika: RAČUNOVODSKI SERVIS — izvedbeno navodilo

> **Kaj je to.** Rezultat strokovnega pregleda segmenta `racunovodstvo` v ROI kalkulatorju po postopku
> iz `NAVODILA-pregled-vprasalnika-po-dejavnosti.md`. 119 sodb, vsaka s sklicem na kodo in konkretnim
> predlogom. Dokument je namenjen izvajalcu (človeku ali AI), ki bo popravke uvedel.
>
> **Kako uporabiti.** Preberi razdelka 0 in 1 (omejitve, ki jih predlog ne sme kršiti), nato izvajaj
> po vrstnem redu iz razdelka 11. Pred vsakim posegom preveri sklic na vrstico — številke veljajo za
> commit `ba58fb3` in se ob prvem popravku premaknejo.
>
> **Pokritost.** Koraki 1–5, pet panožnih modulov, diagnostika, tehnični modul E, obe horizontali in
> sistematičen pregled 25 bolečin ter 28 procesov iz raziskave.
>
> **Nastanek.** Dva vala po trije pregledovalci + tri skeptične preverbe (12 agentov, 1,37 mio žetonov).
> Preverba je popravila 87 od 119 sodb; kaj je popravila in zakaj, je v razdelku 9 — ta razdelek preberi
> **preden** predlagaš karkoli novega, ker našteva pristope, ki so bili preizkušeni in so napačni.

---

## 0. Dejstva, ki ne smejo biti uganjena

**Repozitorij:** `/Users/janpavlic/Documents/Datalab/aplikacije/ROI kalkulator`
⚠️ **Ne** `/Users/janpavlic/Documents/Datalab/Claude code` — zastarela kopija.

**Raziskava:** `/Users/janpavlic/Documents/Datalab/reports/GPT baza znanja/računovodstvo/Datalab_globinska_raziskava_racunovodski_servisi.md`
(`.pdf` je isto besedilo — ne beri ga; `.xlsx` ima strukturirane registre: bolečine, KPI, ROI model, ICP.)

**Preverjanje po vsakem paketu:**

```bash
npm run test
```

**Sestava segmenta** (`src/config/segments.ts:220–251`): panožni `zajemRs · strankeRs · obracuniRs ·
popravkiRs · donosnostRs`, horizontali `analitikaHz · kadriHz`, vedno prikazana `diagnostikaRs · E`.
Triažnih področij je sedem, `recommendedCount: 3`. Segment nima koša `oneTimeCapital`, nima nobenega
`allowUnknown`, `usesRevenue`, `usesMargin` ali `typicalAnnualLossBand`.

**Naslovna številka segmenta:** `+X strank brez nove zaposlitve` — `ResultsView.tsx:86–88`, izračun
`CalculatorFlow.tsx:272–279` → `calculations.ts:71–77` (sproščene ure ÷ `hoursPerClientPerMonth`,
rezerva 8 h iz `segments.ts:244–246`).

---

## 1. Omejitve, ki jih predlog ne sme kršiti

**Trda pravila (iz raziskave):**
1. Prihranek časa ni prihranek plače, dokler ni opredeljena monetizacija.
2. Prihodek ni korist — pri dodatni prodaji je korist prispevna marža.
3. Sprostitev kapitala je enkratni učinek; koš `oneTimeCapital` se nikoli ne sešteva z letnimi.
4. Tveganje se ne monetizira; koš `risk` nima EUR — namerno.
5. Ista ura ali evro ne smeta v dve področji.
6. Ni lažne natančnosti. Jamstvo aplikacije: »nobene številke si nismo izmislili.«
7. Panožni benchmark ni cilj podjetja.

**Shema in tehnične omejitve motorja:**
- Vrednosti so števila (`checkbox` 0/1, `percent` je ulomek; prikaz ×100 dela widget).
- Vrednosti izbir so **zaporedni indeksi**, ne deleži. Odstranitev sredinske možnosti premakne pomen
  že shranjenih vrednosti.
- `compute()` vrne **dejanski sedanji strošek**. Naslovljivi delež (`mainCause`) in pas izboljšave
  (sedanji sistem) uveljavi motor — modul ne sme sam vračunati »deleža izboljšave«.
- **Vsako polje s `help` mora imeti tudi `explainer`** (`explainers.test.ts:29–32`), dolžina 40–600
  znakov (`:47`). Konvencija: `help` = meja proti sosednjim področjem, `explainer` = izpeljava s primerom.
- `allowUnknown: true` je za zneske, ki jih podjetje bodisi vodi bodisi ne; deluje samo pri
  `kind: 'number'` (`ModuleInput.tsx:93`). Brez njega neznanje tiho postane potrjena ničla.
- **Pogojnega prikaza modula (`showIf`) motor NIMA** (`ModuleDefinition`, `moduleTypes.ts:215–232`).
- `plausibility.ts` sešteva samo polja z enoto `h/mesec` in `h/leto` (`:61–62`); **zmnožek dveh polj mu uide**.
- Panožni modul ima 5–6 polj (`racunovodstvo.test.ts:230–235`). `diagnostikaRs` te omejitve nima
  (`COSTED_MODULES`, `racunovodstvo.test.ts:47`).
- Nov modul zahteva vnos v `content/methodology.ts` **in** `content/actions/actions.ts` — sicer pade
  `moduleEngine.test.ts:366–374`.
- Glava CSV je **fiksna za vse segmente**; modulski vnosi gredo v en sam stolpec `moduleInputsJson`
  (`exportRecord.ts:135–199`). Preimenovanje ključa polja zato ne zahteva spremembe izvoza; nov stolpec
  na ravni segmenta gre na **konec**.
- Skupne datoteke so v rabi več dejavnosti — sprememba tam vpliva nanje: `ASSURANCE_CHOICES`
  (`shared.ts:40–45`, 4 dejavnosti), `ANALITIKA_CAUSES`/`KADRI_CAUSES` (`horizontal.ts`, 6 oz. 7 segmentov).

---

## 2. Bilanca

| Sodba | Val 1 | Val 2 | Skupaj |
|---|---:|---:|---:|
| ohrani | 3 | 15 | **18** |
| izboljšaj | 42 | 30 | **72** |
| dodaj | 5 | 19 | **24** |
| premakni | 3 | 0 | **3** |
| odstrani | 0 | 2 | **2** |
| **Skupaj** | **53** | **66** | **119** |

Preverba: **potrjeno 32 · popravljeno 87 · ovrženo 0.**

Od 18 sodb »ohrani« jih je **11 uvrstitev v skupino »NE dodajaj zdaj«** (razdelek 8) — pravih pohval
obstoječim vprašanjem je sedem. Nič formalno ovrženih ne pomeni mile preverbe: 87 popravkov vključuje
tri predloge, ki bi podrli teste, in štiri, ki bi pokvarili druge segmente (razdelek 9).

---

## 3. Deset ugotovitev z največjo težo

### 3.1 Privzetek 0,6 pri deležu ročnih listin ustvari 41.472 EUR brez potrditve
`manualSharePercent` (`racunovodstvo.ts:72–80`, privzetek `0.6` na `:79`) je edino polje z denarnim
učinkom brez `help` in `explainer`. Vpis samega števila listin (4.800) da 4.800 × 0,6 × 3/60 = 144 h/mesec;
pri 24 EUR (`contexts/racunovodstvo.ts:104`) to znese **41.472 EUR/leto**. `potential.ts:214` nedotaknjenega
privzetka ne šteje med izpolnjena polja, `range.ts:93–127` zajame samo kontekstne predpostavke — razpon
te lažne natančnosti **ne pokrije**.
**Naredi:** `default: 0` + `help` »Delež listin, ki jih nekdo dejansko odtipka ali postavko za postavko
prekontrolira. E-računi in uvoženi bančni izpiski, ki gredo skozi brez posega, sem ne sodijo.« +
`explainer` »Vzemite en teden: koliko listin je šlo v knjiženje brez posega in koliko jih je nekdo vnašal
ročno. Primer: od 1.200 tedenskih listin je 700 e-računov in izpiskov, 500 ročnih → približno 40 %.«

### 3.2 Naslovna številka je vsota surovih ur — in ima decimalko
`aggregateBuckets` (`moduleEngine.ts:65–68`) sešteje `output.hoursPerMonth` **brez** `addressableShare`
in brez pasu izboljšave; `ResultsView.tsx:87` izpiše `+18,0 strank`. Evrski zneski tik pod tem so že
razpon. Naslov torej predpostavlja 100-odstotno sprostitev.
**Naredi:** (1) v `BucketTotals` (`moduleEngine.ts:35–45`) dodaj `addressableCapacityHoursPerMonth`,
polni ga kot `(output.hoursPerMonth ?? 0) * (output.addressableShare ?? 1)`; (2) uveljavi pas izboljšave
po istem vzorcu kot pri EUR (`potential.ts`); (3) `CalculatorFlow.tsx:272–279` kliči
`calculateAccountingCapacity` dvakrat (min, max); (4) `ResultsView.tsx:86–87` in `pdf.ts:257–264` izpišeta
**celo število kot razpon**: »+4 do +9 strank brez nove zaposlitve« + pojasnilo »Izračunano iz naslovljivih
ur po vašem glavnem vzroku, ne iz vseh vnesenih ur.«; (5) posodobi `calculations.test.ts:84` in `moduleEngine.test.ts`.

### 3.3 Ovojnica verjetnosti ne vidi največje urne postavke segmenta
`plausibility.ts:54–64` sešteva izključno vnesena polja z enoto `h/mesec`/`h/leto`. Ročni vnos listin je
zmnožek treh polj. Pri treh zaposlenih (480 h, `:18` in `:27`): vnesenih 111 h = 23 % (brez opozorila),
z izpeljanimi 144 h = **53 %** — opozorilo bi se moralo sprožiti.
**Naredi:** za področja, katerih `compute()` vrne kateri koli izid s `hoursPerMonth`, uporabi vsoto teh ur;
za ostala ostane današnje seštevanje po enotah (**brez dvojnega štetja** — ure iz izidov ALI iz enot, ne
oboje). Ohrani izločanje `contextOnly` (`:58`) in »Ne vem« (`:60`). Posodobi `plausibility.test.ts:74–82`,
ki danes trdi, da sta enoti pokrili vsa urna polja.

### 3.4 Imenovalca `clientCount` ni nikjer, čeprav ga trije explainerji predpostavljajo
Grep po `src` ne najde ključa. `documentsPerMonth` naroča »strank × listin na stranko« (`:68–70`),
`hoursPerClientPerMonth` »ure delite s številom strank« (`:553–555`), `belowCostClients` (`:520–526`)
pa brez imenovalca ni interpretabilen. Oba pregledovalca sta neodvisno predlagala isto polje.
**Naredi:** glej razdelek 10 — umestitev je edina odprta odločitev.

### 3.5 Plače so lahko štete dvakrat, po dražji uri
`kadriHz.payrollPrepHoursPerMonth` (`horizontal.ts:274–280`) nima ne `help` ne `explainer`; `obracuniRs`
plače imenuje **dvakrat** — v labelu (`racunovodstvo.ts:284`) in v explainerju (`:298`) — in ju vrednoti po
operativni uri (`:338`), `kadriHz` pa po vodstveni (`horizontal.ts:301`). Scenarij 80 h × 30 EUR × 12 =
**28.800 EUR/leto** podvojenega zneska, proti segmentnemu pragu visoke izgube 10.000 EUR (`segments.ts:250`).
**Naredi:** takoj v skupnem modulu label z »**VAŠIH** zaposlenih«; v panožnem `kadriRs` (razdelek 7) `help`
»Obračun plač, ki ga opravljate za stranke, meri področje obračunov — tu ga ne ponavljajte.« in
vrednotenje po `context.operationalHourCostEUR`.

### 3.6 `reportPrepHoursPerMonth` obstaja pod istim ključem v dveh področjih istega segmenta
`obracuniRs` (`racunovodstvo.ts:290–300`, operativna ura) in `analitikaHz` (`horizontal.ts:51–61`,
vodstvena). Tehnične kolizije ni — vrednosti se hranijo po `values[definition.id]` — pomenska je popolna:
ista ura, 25 % razlike v postavki. `content/methodology.ts:299` obenem obljublja, da se ista ura nikoli
ne šteje dvakrat.
**Naredi:** zaostri obe besedili (razdelek 5 in 7); v panožni različici preimenuj v
`ownReportPrepHoursPerMonth`. **Ne** uporabi imena `filingPrepHoursPerMonth` — »filing« v tem modulu
že pomeni arhiviranje.

### 3.7 Vseh sedem triažnih lestvic je ob prvem izrisu na najmilejšem odgovoru
`triageScores` se začne kot prazen objekt (`CalculatorFlow.tsx:75`), `StepTriage.tsx:66` izpelje
`scores[definition.id] ?? 0`, radio pa je označen pri `checked={score === option.value}` (`:79`). Ker ima
vsako področje možnost z vrednostjo 0, **neodgovor ni ločen od izjave »tu ni bolečine«**. Koda to ločnico
drugod že dela (`CalculatorFlow.tsx:348–351`).
**Naredi:** izpusti `?? 0` na `:66`; pri `undefined` ni označen noben radio. `scores` ostane
`Record<string, number>`, kjer odsotnost ključa pomeni »ni odgovora«. **Ne** premikaj vrednosti možnosti
na 1–4 in **ne** spreminjaj tipa v `number | null` — to bi razveljavilo že zbrane ocene in zahtevalo
popravke v `triageScoreLabel`, `salesReport.ts:317–318` in `CalculatorFlow.tsx:348–351`.

### 3.8 Prihodek in prispevna marža sta vprašana in nikjer uporabljena
Zastavici `usesRevenue`/`usesMargin` nosijo samo `trgovina.ts:543`, `maloprodaja.ts:91`/`:334`/`:713` in
`splosno.ts:363`. Odgovor v tem segmentu ne premakne nobenega evra in po `potential.ts:155–160` ne vpliva
niti na zanesljivost. `help` pri prihodku obljublja, da »postavk, vezanih na prihodek, ne bomo ocenili« —
takih postavk sploh ni. Dodatno: pasova prispevne marže se stikata pri 0,3, privzetek je 0,3 (`:145`),
`industryAverageScaleBand` (`contextTypes.ts:277–281`) vrne **prvega** ustreznega, torej `do30`.
**Naredi:** izbriši oba iz `RACUNOVODSTVO_CONTEXT` (`:119–131` in `:133–148`) in popravi `costBasisIntro`
(`:50`) — obljublja »štiri številke«. Ne glede na odločitev dodaj test v `contexts.test.ts`, ki za vsak
`ScaleQuestion` s `fallback > 0` preveri, da ga vsebuje natanko en pas.

### 3.9 Diagnostika izdela dve oceni tveganja, preden obiskovalec karkoli klikne
Privzetki (1, 1, 2, 1 — `:629`, `:636`, `:643`, `:650`) dajo 2/6 = 0,333 → `medium` in 3/6 = 0,5 → `medium`
(`shared.ts:47–52`). `RiskCard` ju izriše kot dejstvo brez pridržka, gresta v prodajno pripravo
(`salesReport.ts:230`, `:331`). Komentar nad modulom (`:613–619`) obljublja nasprotno. Olajševalno:
v tabeli odgovorov prodajne priprave je vrednost že označena kot »privzeto« (`answerLabels.ts:148–151`).
**Naredi:** **lokalna** lestvica v `racunovodstvo.ts` (ne spreminjaj `ASSURANCE_CHOICES`) s peto možnostjo
`{ value: 4, label: 'Nismo preverili', unknown: true }` kot privzetkom vseh polj. V `compute()` vrednost 4
ne vstopa v vsoto; `maxScore = 3 × število odgovorjenih polj v paru`; če v paru ni odgovorjeno nič, vrni
izid **brez** `riskLevel` (neobvezen je — `moduleTypes.ts:187`; `RiskCard` odsotnost že prenese) in z
ločeno konstanto `DATA_RISK_NOTE_UNANSWERED` / `PROCESS_RISK_NOTE_UNANSWERED` (ključa v
`Record<RiskLevel, string>` ni mogoče dodati — `RiskLevel` je zaprta unija treh vrednosti).

### 3.10 Rok 2028 vidi samo tisti, ki ga najmanj potrebuje — in prodajnik za to ne izve
`isTechnicalRiskModuleVisible` (`contexts/index.ts:48–62`) skrije **cel** modul E vsem, ki niso na
PANTHEON-u. ICP jim pri nujnosti dodeli 0,2 (utež 0,10) z opombo, ki sama priznava, da to ni podatek o
podjetju. `wasTechnicalRiskModuleShown` (`salesReport.ts:533`) obstaja prav za to opozorilo, a je **mrtva
koda** — grep ne najde klicatelja.
**Naredi:** na `ModuleEChecklistItem` (`legacy.ts:245–250`) dodaj `pantheonOnly?: true` (nastavljen na obeh
Microsoftovih postavkah), `moduleE.fields` (`:279–284`) filtriraj po njej, `isTechnicalRiskModuleVisible`
pa preoblikuj tako, da modul E prikaže vsem, ne-PANTHEON servisu pa samo vprašanje o e-računih. Nato
popravi opombo v `icp.ts` (veja brez datumov) in **prikliči** `wasTechnicalRiskModuleShown` v prodajni pripravi.

---

## 4. Koraki 1–5, vprašanje po vprašanju

| Vprašanje | Sodba | Kaj narediti |
|---|---|---|
| K1 »S čim se ukvarja vaše podjetje?« (`industries.ts:28`) | izboljšaj (sre) | `choiceLabel` v glavnem seznamu **sploh ne deluje** — `StepIndustry.tsx:77` izpiše `industry.label`, `industryChoiceLabel` se uporabi le pri pod-dejavnostih (`:104`). Zamenjaj z `industryChoiceLabel(industry)` (funkcija je že uvožena, `:7`). Dodaj `choiceLabel` »Vodimo knjige, obračune in plače za druge (računovodski servis, knjigovodski biro, davčno svetovanje)«, pri `storitve` (`:29`) »Prodajamo ure in projekte (agencija, IT, inženiring, gradbeništvo)«, pri `drugo_storitve` (`:76–79`) dodaj »(ne vodimo knjig za druge)«. `label` za CRM se **ne** spreminja. |
| K2 »Koliko ljudi zaposlujete?« (`StepEmployeeCount.tsx:26`) | **izboljšaj (vis)** | Trditev »Podatek na izračun ne vpliva« (`:44–47`) je zastarela: podatek nosi ovojnico verjetnosti (`plausibility.ts:18`, `:27`, `:67`, `:75`), 20 % ICP (`icp.ts:168–180`), velikost posla (`:130–135`) in velikostni razred (`sizeClasses.ts:21`). Novo besedilo: »Podatek ne vstopa v noben znesek — iz njega izpeljemo velikostni razred in preverimo, ali so vnesene ure skladne z velikostjo ekipe.« Naslov na FTE: »Koliko ljudi dela v servisu, preračunano na polni delovni čas?«, `help` »Polovična zaposlitev šteje 0,5. Štejte tudi lastnika, če dela na strankah, in redne zunanje sodelavce.«, na vnosu `step={0.5}` `min={0.5}`. |
| K2 (dodatno) »Koliko strank redno vodite?« | **dodaj (vis)** | Glej 3.4 in razdelek 10. |
| K2 (ločeno) `SIZE_FIT` za ta segment | izboljšaj (vis) | `icp.ts:75–80` postavi 1–9 zaposlenih na 0,35 = izguba 13 od 100 točk. Tipičen servis ima 1,51 FTE (4.077,5 FTE / 2.705 izvajalcev z izkazi, raziskava §3.1). Predlog: v `IcpSignals` dodaj `segment: SegmentId`, za `racunovodstvo` uporabi 1–4 → 0,8 · 5–15 → 1,0 · 16–50 → 1,0 · nad 50 → 0,6, z opombo »Pri servisu je merilo obsega število strank, ne zaposlenih.« Uteži ostanejo, zato test o vsoti uteži ne pade. |
| K3 »Kakšna je pretežna struktura vaših strank?« (`contexts/racunovodstvo.ts:52–61`) | izboljšaj (sre) | `businessType` je **mrtev podatek**: ne krmili ne triaže ne modulov, nastopa le kot oznaka (`salesReportHtml.ts:308`, `pdfSales.ts:131`, `salesReport.ts:287`, `exportRecord.ts:173`/`:247`), med sprožilci playbooka ga ni. Možnosti tudi niso na isti osi. Omeji na velikost strank: `mikro` »Pretežno s.p. in mikro podjetja (do 10 zaposlenih)« · `malaSrednja` »Pretežno mala in srednja (10 in več)« · `mesano` »Mešano — obojih približno enako«; `panozno` in `svetovanje` prenesi med prodajne iztočnice. |
| K3 »Kako danes vodite servis?« (`:63–86`) | **izboljšaj (vis)** | Dve možnosti imata identičen pas 0,15–0,30 (`:75`, `:78`), zato izbira med njima ne spremeni ničesar. Prerazporedi po **načinu vstopa listin**: `pantheonZajem` 0,08–0,20 · `pantheonRocno` 0,15–0,28 · nov `drugProgramZajem` »Drug računovodski program s samodejnim zajemom listin« 0,12–0,25 · `drugProgram` »…, listine vnašamo ročno« 0,20–0,33 · `programExcel` 0,25–0,40. **Ohrani obstoječe `id`-je** — gredo v izvoz. |
| K3 »Kakšna je vaša vloga?« (`:88–97`) | izboljšaj (sre) | Manjka vloga, ki v servisu pogosto izpolnjuje obrazce (referent za plače, skrbnik strank). `:91` → »Lastnik/-ica ali direktor/-ica servisa (tudi če sami vodite knjige)«. V `ROLE_FIT` (`icp.ts:89–105`) dodaj `davcni` → 0,7 »strokovna avtoriteta, o nakupu pogosto soodloča«. |
| K4 zajemRs triaža | izboljšaj (niz) | Spremeni samo možnost 0 (`racunovodstvo.ts:54`): → »Skoraj nič — listine pridejo strukturirane in se knjižijo same«. Preostalo pusti; prepis vseh možnosti bi bil kozmetičen. |
| K4 strankeRs triaža | izboljšaj (sre) | Možnosti (`:173–178`) merijo vedenje strank, ne časa: 0 »Skoraj nič — listine pridejo pravočasno« · 1 »Nekaj ur na mesec« · 2 »Nekaj ur na teden« · 3 »Vsak mesec več dni lovljenja«. Naslov ostane. |
| K4 obracuniRs triaža | izboljšaj (sre) | Naslov (`:272`) → »Koliko dodatnega dela nastane ob rokih (DDV, plače, zaključki)?«; možnosti (`:274–277`) → 0 »Roke držimo brez konic« · 1 »Nekaj nadur na mesec« · 2 »Nekaj dni nadur vsak mesec« · 3 »Teden ali več vsak mesec, redno tudi vikendi«. |
| K4 popravkiRs triaža | izboljšaj (sre) | Naslov (`:393`) → »Koliko dela nastane s popravljanjem knjižb, obračunov in že oddanih obrazcev?«; možnosti (`:395–398`) → 0 »Skoraj nikoli« · 1 »Nekaj ur na mesec« · 2 »Nekaj ur na teden« · 3 »Vsak dan nekdo popravlja«. Privzeto trojko uskladi prek `defaultIds`, **ne** s prerazporeditvijo `moduleIds`. |
| K4 donosnostRs triaža | **izboljšaj (vis)** | Zadnja možnost je sodba o ceniku, ne obseg. Lestvica (`:500–505`) → 0 »Zaračunamo skoraj vse« · 1 »Nekaj ur na mesec ostane nezaračunanih« · 2 »Nekaj ur na teden« · 3 »Redno več dni na mesec«. Sodbo o ceniku prestavi v `diagnostikaRs` kot **`contextOnly`** polje »Ali pavšal pokriva dejanski obseg dela?« — brez `contextOnly` bi trčila ob fiksno parno logiko `compute` (`:652–655`). |
| K4 analitikaHz triaža | izboljšaj (sre) | `horizontal.ts:41` → »Koliko ročnega dela zahteva priprava poročil in ključnih številk, po katerih vodite **SVOJE** podjetje?« Nevtralno v vseh šestih segmentih → varno v skupnem modulu. Summary (`:39`) ločeno. |
| K4 kadriHz triaža | izboljšaj (sre) | `horizontal.ts:253` → »Koliko dela zahtevajo evidence, dopusti in plače za vašo **lastno** ekipo?«; summary (`:251`) → »… za lastno ekipo.« Nevtralno v vseh sedmih segmentih. Tretjega mesta za zamejitev ni — `ModuleSection.tsx:25–27` izpiše `summary` kot edini uvodni odstavek. |
| K4 (skupno) privzeto stanje lestvic | **izboljšaj (vis)** | Glej 3.7. |
| K5 »Polni strošek računovodske ure« | **ohrani** | Edini nabor, ki je bil že prej pravilno umerjen (sidro: knjigovodja 23,8 EUR/h; `docs/urne-postavke.md`). |
| K5 »Polni strošek vodstvene ure« | izboljšaj (sre) | `help` (`:109`) opisuje **namen**, moral bi opisovati **nosilca** — sicer se v `kadriHz` pripiše uram, ki te odgovornosti ne nosijo. Dodaj: »Če ste servis enega ali dveh ljudi in podpisujete sami, vpišite isto postavko kot zgoraj — ista ura ne sme imeti dveh cen.« |
| K5 »Letni prihodki servisa« (`:119–131`) | **odstrani (vis)** | Glej 3.8. |
| K5 »Povprečna prispevna marža« (`:133–148`) | **odstrani (vis)** | Glej 3.8. |
| K5 (dodatno) monetizacija sproščenih ur | dodaj (niz) → **ne zdaj** | **Ne dodajaj** postavke, ki bi kapaciteto monetizirala s prihodkom. Namesto tega opremi `capacityEUR` na rezultatih z opombo »Vrednoteno po vašem strošku ure — to je sproščena kapaciteta, ne prihranek pri plačah in ne dodatni prihodek.« Monetizacijski faktor iz raziskave §9.1 zajemi kvalitativno prek `capacityUse` (razdelek 8). |

---

## 5. Panožni moduli

### 5.1 `zajemRs` — Zajem in vnos listin (`racunovodstvo.ts:47–155`)

| Polje | Sodba | Kaj narediti |
|---|---|---|
| `documentsPerMonth` `:62–71` | izboljšaj (sre) | `help` (`:67`) dopolni: »… Bančne postavke štejte zraven, a upoštevajte, da so pri naslednjem vprašanju običajno v avtomatskem delu.« `explainer` (`:68–70`) dopolni s kontrolo velikostnega reda: »… približno število strank × 60–120 listin.« |
| `manualSharePercent` `:72–80` | **izboljšaj (vis)** | Glej 3.1. Če se kdo odloči za izbirni razpon (`kind: 'choice'`, vzorec `shared.ts:73–95`), mora možnost »Ne vem« dati delež **0**, ne 0,3 — sicer nedotaknjeno polje spet ustvari ~20.700 EUR. Ob prehodu na `choice` polje izpade iz števca numeričnih polj (`potential.ts:202`) in iz `isUntouchedNumeric` (`salesReport.ts:482–488`). |
| `minutesPerManualDocument` `:81–95` | izboljšaj (sre) | Meja proti arhiviranju manjka pri obeh sosedih. `help` (`:90`) → »Od trenutka, ko listino odprete, do knjižene postavke. Skeniranje, razvrščanje in arhiviranje merimo posebej v naslednjem vprašanju; iskanje manjkajočih listin meri področje Listine strank.« `explainer` (`:91–94`) dopolni z »— brez skeniranja in odlaganja v arhiv«. **Privzetka ni mogoče dati na 0** — drsnik ima `min: 0.5` (`:85`). |
| `retypingHoursPerMonth` `:96–108` | **izboljšaj (vis)** | Obstoječemu `explainer` (`:104–107`) **pripni** (ne nadomesti): »Sem sodi tudi prepisovanje iz programa ali preglednice stranke v vaš program.« S tem odpade potreba po ločenem polju za nepovezane programe strank (B21). Ločeno: `help` mora izključiti plače, ki jih meri `kadriHz`/`kadriRs`. |
| `filingHoursPerMonth` `:109–115` | izboljšaj (sre) | Brez obeh besedil. `help` »Samo delo z listino kot papirjem ali datoteko — skeniranje, preimenovanje, razvrščanje v mape, fizični arhiv. Minute na listino iz zgornjega vprašanja tega ne vključujejo.« + obvezen `explainer`. |
| `mainCause` (`ZAJEM_CAUSES` `:39–45`) | izboljšaj (sre) | Prvi dve možnosti sta isti vzrok, povedan dvakrat. Skrči na štiri + »Ne vemo«: »Listine prihajajo v papirju ali kot slike, brez e-računov in samodejnih izpiskov« (data) · »Podatke vodimo v več ločenih programih« (data) · »Stranke nimajo enotnega kanala za oddajo listin« (planning) · »Delo ni standardizirano« (people). |

### 5.2 `strankeRs` — Listine strank in komunikacija (`:167–255`)

| Polje | Sodba | Kaj narediti |
|---|---|---|
| `chasingHoursPerMonth` `:182–187` | **izboljšaj (vis)** | Brez `help` in `explainer`, čeprav ima denarni učinek. `help` »Samo lovljenje listin: opomniki, klici, čakanje na manjkajoče. Vnos in knjiženje listin meri področje Zajem listin, neobračunano svetovanje pa področje Neobračunano delo.« `explainer` — **preseli besedilo, ki danes stoji pri `inquiryHoursPerMonth`**, in ga dopolni: »… Ocenite prek dogodkov: koliko strank je treba mesečno loviti × kolikokrat × koliko minut. Primer: 15 strank od 60 × 2 posredovanji × 15 min ≈ 8 ur. Vrednotimo jih po strošku računovodske ure, ki ste ga vpisali v skupni finančni osnovi.« (Ne navajaj »npr. 24 EUR« — to je rezerva, ne uporabnikov vnos.) |
| `inquiryHoursPerMonth` `:188–199` | **izboljšaj (vis)** | `explainer` (`:196–198`) opisuje **napačno polje** (lovljenje listin). Nadomesti: »Vprašanja, na katera bi stranka odgovor našla sama, če bi imela vpogled: saldo, odprte postavke, rok plačila, kje je dokument. Ocenite: koliko takih vprašanj na teden × povprečne minute. Primer: 20 × 10 min ≈ 14 ur na mesec. Ker odgovarja izkušen računovodja, te ure vrednotimo po vodstveni uri.« `help` (`:195`) razširi v obe smeri. |
| `lateClientsSharePercent` `:201–211` | izboljšaj (sre) | Zamenjaj s K01, ostane `contextOnly`: »Kolikšen delež listin prejmete do dogovorjenega roka (cut-off)?«, `kind: 'choice'`, privzetek 4, možnosti 0 »90 % ali več« · 1 »75–90 %« · 2 »50–75 %« · 3 »Manj kot 50 %« · 4 »Ne vem« (`unknown: true`). |
| `deliveryMethod` `:212–224` | **ohrani** | Meri način vstopa, ki ga ne meri nič drugega, in polni prodajno poročilo. |
| `mainCause` (`STRANKE_CAUSES` `:159–165`) | izboljšaj (sre) | Razširi `mainCauseField` z neobveznim drugim parametrom `{ help?, explainer? }` po vzoru `reducibleShareField` (`shared.ts:73–85`) — podpis ostane združljiv z vsemi osmimi dejavnostmi. |

### 5.3 `obracuniRs` — Obračuni, roki in konice (`:267–376`)

| Polje | Sodba | Kaj narediti |
|---|---|---|
| triaža | **ohrani** (prompt) / izboljšaj (možnosti) | Glej razdelek 4. |
| `overtimeHoursPerMonth` `:282–288` | izboljšaj (sre) | `help` »Samo ure zunaj rednega delovnega časa. Če ste te ure že vpisali pri ročni pripravi obračunov v naslednjem vprašanju, jih tu ne ponavljajte.« + `explainer` z izpeljavo »koliko ljudi × koliko ur v konici × kolikokrat na mesec«. Ob dodajanju polja za sezono letnih zaključkov (razdelek 8) label zoži na **mesečni** ritem. |
| `reportPrepHoursPerMonth` `:289–300` | **izboljšaj (vis)** | Glej 3.6. `help` (`:296`) → »Samo obračuni in poročila za stranke in državo. Vnos listin in prepis med programi merita vprašanji v področju Zajem, poročila za vaše vodstvo pa področje Analitika in poročanje.« Hkrati zaostri nasprotno stran (`horizontal.ts:56`). Novo ime ključa: `closingPrepHoursPerMonth`. Posodobi `racunovodstvo.test.ts:111`. |
| `externalHelpCostEUR` `:301–308` | **izboljšaj (vis)** | `allowUnknown: true` + `help` »Samo pomoč, ki jo najamete zaradi konic ali odsotnosti. Delo, ki ga trajno opravlja zunanji izvajalec (npr. plače vseh strank), sem ne sodi.« + `explainer` s primerom »2 študenta × 3 mesece × 900 EUR ≈ 5.400 EUR«. |
| `latePenaltyCostEUR` `:309–320` | izboljšaj (sre) | `allowUnknown: true`; `explainer` (`:317–319`) dopolni z izhodom »… če glob ni bilo, vpišite 0; če zneska ne poznate, izberite Ne vem.« |
| `closingProcess` `:321–333` | izboljšaj (niz) | Zamenjaj s preverljivim K07: `daysToMonthlyClose` »Koliko delovnih dni po koncu meseca imate zaključene obračune za vse stranke?«, `contextOnly`, privzetek 4 = »Ne merimo«. |
| `mainCause` (`OBRACUNI_CAUSES` `:259–265`) | izboljšaj (sre) | Možnosti nista vzajemno izključujoči; preoblikuj v pet: ročno sestavljanje (data) · podatki v več programih (data) · neenakomerna razporeditev (planning) · stranke oddajo prepozno (external) · premalo ljudi (people). |
| (dodatno) `overtimePayout` | dodaj (niz) | `contextOnly` izbira »Kako poravnate nadure?« — 0 »Izplačamo z dodatkom« · 1 »Nadomestimo s prostim časom« · 2 »Kombinirano« · 3 »Nadur nimamo«. Pove, ali je nadura strošek ali kapaciteta. |

### 5.4 `popravkiRs` — Napake in popravki (`:388–482`)

| Polje | Sodba | Kaj narediti |
|---|---|---|
| `correctionHoursPerMonth` `:402–409` | **izboljšaj (vis)** | Brez obeh besedil. `help` »Samo popravki po tem, ko je bila listina že knjižena. Vnos in prepis listin meri področje Zajem, mesečni zaključek področje Obračuni.« `explainer` »Ur ni treba šteti. Vzemite število popravkov na mesec × povprečen čas enega: 40 popravkov × 20 min ≈ 13 h. Šteje tudi čas iskanja napake.« **Zrcalna stavka**: v `zajemRs.minutesPerManualDocument.help` (`:90`) in `obracuniRs.reportPrepHoursPerMonth.help` (`:296`). |
| `reviewHoursPerMonth` `:410–420` | **izboljšaj (vis)** | Meja proti popravljanju manjka. `help` (`:416`) razširi: »Ure, ko napako že popravljate, štejte v prvo vprašanje — ne v obe. Ročnih kontrol in uskladitev ob mesečnem zaključku sem ne štejte — te meri področje Obračuni.« `explainer` (`:417–419`) **dopolni** z delitvijo (primer že ima — ne piši novega). |
| `selfReportCostEUR` `:421–432` | **izboljšaj (vis)** | `allowUnknown: true`; `explainer` dopolni z izhodom »… ali izberite 'Ne vem' — ocene si ne izmišljamo.« Njegov `help` (`:428`) je edina **dvosmerno** zapisana meja v segmentu (par z `:316`) — uporabi ga kot vzorec za ostale. |
| `creditNoteCostEUR` `:433–440` | **izboljšaj (vis)** | `allowUnknown: true`; label zoži na lastno napako: »… vrednost izdanih dobropisov in odpisanih računov zaradi **naše** napake — za delo, ki je bilo že opravljeno?« `help` »Delo, ki ga sploh niste zaračunali, meri področje Neobračunano delo.« Zrcalni stavek **pripni** obstoječemu `donosnostRs.unbilledHoursPerMonth.help` (`:515`) — ne nadomesti ga, ker nosi edino varovalo pravila »prihodek ni korist«. |
| `mainCause` (`POPRAVKI_CAUSES` `:380–386`) | izboljšaj (sre) | Možnost o strankah razdeli: »Stranke oddajajo neurejeno, kanala nismo predpisali« → `data` (0,75) in »Stranke pošiljajo napačne podatke, ki jih ne moremo predvideti« → `external` (0,25). |
| (dodatno) `correctedFilingsPerMonth` | dodaj (sre) | `contextOnly` število popravljenih/ponovljenih obračunov na mesec — služi kot preverba ur in kot prodajna iztočnica (K09). |

### 5.5 `donosnostRs` — Neobračunano delo in donosnost strank (`:494–596`)

| Polje | Sodba | Kaj narediti |
|---|---|---|
| `unbilledHoursPerMonth` `:508–519` | **izboljšaj (vis)** | Vrednotenje po `operationalHourCostEUR` (`:577`) je **pravilno in ga je treba ohraniti** — varujeta ga `racunovodstvo.test.ts:166–172` in `:277–286`. Prekriva pa se z `inquiryHoursPerMonth`. Predlagana delitev na »urejanje nereda« in »svetovanje« je izvedljiva **šele po** premiku enega polja ven (modul ima 6 polj, test zahteva 5–6). |
| `belowCostClients` `:520–526` | **izboljšaj (vis)** | Brez obeh besedil, je pa množitelj zneska. `allowUnknown: true` (polje ni `contextOnly`, zato »Ne vem« res zniža zanesljivost — `potential.ts:203–208`). Label → »Koliko strank vas po vaši oceni stane več, kot plačajo?« |
| `belowCostDeficitEUR` `:527–537` | **izboljšaj (vis)** | `allowUnknown: true`. Mejo zapiši **enosmerno**, da je odgovorljiva: primanjkljaj se računa iz **vseh** ur te stranke, polje o neobračunanem delu pa te stranke izpusti. Isti stavek v `help` obeh polj. |
| izid »Stranke pod lastno ceno« `:581–588` | **premakni (vis)** | `bucket: 'directLoss'` → **`'lostMargin'`** + `note` »predpostavlja dvig cene ali odhod stranke«. Znesek stoji na oceni stroška po stranki, ki je servis po lastni diagnostiki (`:632–638`) pogosto ne pozna. **Obvezno uskladi tudi:** `segments.ts:242–243` (`directLossNote` znesek izrecno našteva) · `content/methodology.ts:247–252` (rationale utemeljuje `directLoss`) · `racunovodstvo.test.ts:178–182` · **maloprodajno besedilo kartice nezaslužene marže** (»prazna polica, napačna cena«) na treh mestih: `ResultsSummary.tsx:74`, `pdfSales.ts:168`, `salesReportHtml.ts:126`. Posledica: figura »Neposredni letni stroški« (`ResultsSummary.tsx:58–62`) se zniža. |
| `hoursPerClientPerMonth` `:538–556` | **premakni (vis)** | Delitelj naslovne številke v modulu, ki ga obiskovalec ob priporočeni triaži pogosto ne dobi. Premakni v `diagnostikaRs` (brez triaže, brez omejitve polj), takoj za `knowsHoursPerClient`, ohrani `contextOnly: true`, prevezi `CalculatorFlow.tsx:276` z `resolvedValues.donosnostRs` na `resolvedValues.diagnostikaRs`. Posodobi summary modula (`:623`), komentar (`:613–619`) in `content/methodology.ts:253–257` (»ocena tveganja iz štirih odgovorov«). Ob `clientCount` ponudi izpeljan privzetek v potrditev. |
| `declinedClientsPerYear` `:557–567` | izboljšaj (sre) | Premakni skupaj s prejšnjim; uporabi ga v izpisu ob naslovu (»zavrnili ste N strank«). |
| `mainCause` (`DONOSNOST_CAUSES` `:486–492`) | izboljšaj (sre) | `:491` → »Cene ne moremo dvigniti zaradi konkurence«, kategorija `external` — kar program res naslovi, je merjenje, ne odločitev. |
| (dodatno) `scopeAgreement` | dodaj (sre) | `contextOnly` izbira »Ali je pri strankah zapisano, kaj je vključeno v pavšal in kaj se doplača?« (B12). |

---

## 6. Diagnostika in modul E

| Element | Sodba | Kaj narediti |
|---|---|---|
| `diagnostikaRs` kot celota | **izboljšaj (vis)** | Glej 3.9. |
| `knowsHoursPerClient` `:625–631` | **izboljšaj (vis)** | Nič v kodi ne poveže tega odgovora z deliteljem naslovne številke. Dodaj `explainer` »Mišljena je evidenca, ne občutek: če bi stranka jutri vprašala, koliko ur smo ji ta mesec porabili, ali odgovor obstaja v programu?« Ob odgovoru »Le približno« / »Ne« / »Nismo preverili« (ali kadar področje Neobračunano delo ni bilo izbrano) prikaži »+X strank« izključno kot razpon z oznako »ocenjeno, ker porabljene ure po stranki niso evidentirane«; isti stavek v prodajno pripravo kot pričakovan ugovor. |
| `knowsClientProfitability` `:632–638` | izboljšaj (sre) | Preusmeri na izid: »Ali za posamezno stranko poznate razliko med tem, kar plača, in tem, kar vas stane — brez ročnega štetja ob koncu leta?« |
| `auditTrail` `:639–645` | izboljšaj (sre) | Preoblikuj v preverljiv dogodek: »Ali lahko ob reklamaciji stranke ali inšpekciji v nekaj minutah pokažete, kdo je sporno knjižbo vnesel, kdo jo je potrdil in na podlagi katere listine?« |
| `keyPersonIndependence` `:646–652` | izboljšaj (sre) | »Če bi ena oseba nenapovedano izostala en mesec, koliko strank bi ostalo brez pravočasnega obračuna?« Ker se možnosti razlikujejo od `ASSURANCE_CHOICES`, polje dobi **lasten** `choices` niz. |
| `DATA_RISK_NOTE` `:600–605` | **izboljšaj (vis)** | Besedilo `medium` je trditev o poslu bralca, sliši pa ga vsak, ki koraka ni odprl. Omili: »Podatki so delni. Katera stranka je nedonosna, se pokaže z zamikom — praviloma šele ob letnem pregledu, ko je cena za tekoče leto že dogovorjena.« `low` in `high` **ohrani dobesedno** — `high` je najmočnejši stavek področja. |
| `PROCESS_RISK_NOTE` `:607–611` | izboljšaj (sre) | Dodaj ločeno konstanto za stanje brez odgovora. `high` razširi z odprtimi nalogami **šele ko** obstaja vprašanje o njih. |
| (dodatno) vidnost nalog + enotnost postopka | **dodaj (vis)** | B04 in B05 (prioriteta 13) v celotnem segmentu ne meri nihče. `taskVisibility` »Ali kadar koli vidite, katere naloge po strankah so odprte in katere so že po roku?« + `processStandardisation` »Ali dva računovodji isto stranko obdelata po istem, zapisanem postopku?« Tvorita tretji par »Ponovljivost procesa«. **Obvezno** popravi `content/methodology.ts:253–257` (»iz štirih odgovorov«). |
| Modul E — SQL/Windows Server | izboljšaj (sre) / ohrani (niz) | `ModuleEChecklistItem` (`legacy.ts:245–250`) razširi z `help`/`explainer` in ju preslikaj v `fields` (`:279–284`) — `ModuleSection` za `checkbox` oboje že podpira. `help` »Če ne veste, vpraša skrbnik IT — v PANTHEON-u piše v Pomoč > O programu.« |
| Modul E — ZIERDED | izboljšaj (sre) | Namesto obrata kljukice postavko spremeni v `kind: 'choice'`: »Ali imate urejen kanal za prejem in izdajo e-računov?« — 0 »Da, za prejem in izdajo« · 1 »Delno — samo za izdajo« · 2 »Ne« · 3 »Ne vem« (`unknown: true`, privzetek). Opozorilo in vpis v `deadlineDates` nastaneta pri 1 in 2, **ne** pri 3. |
| Modul E — vidnost | **premakni (vis)** | Glej 3.10. |
| Modul E — besedila rokov | izboljšaj (niz) | V `MODULE_E_ITEMS` hrani nevtralni del besedila, slovnični čas izpelji ob izrisu iz `warningDate`. Za to je treba `daysUntil` (`icp.ts:164`) izvoziti ali preseliti — zdaj je zasebna. Naslov »Tvegani stroški« → »Roki, ki vas dohitijo«. |

---

## 7. Horizontali

**Sodba: obe ostaneta, a potrebujeta panožno različico.** Vsak popravek besedila, ki imenuje stranke,
je v skupnem modulu nemogoč — `analitikaHz` uporablja šest segmentov (`segments.ts:79, 108, 136, 166,
198, 233`), `kadriHz` sedem (`:81, 110, 138, 168, 200, 234, 266`).

**Varno takoj v skupnem modulu** (nevtralno za vse segmente):
- `kadriHz` prompt (`:253`) in summary (`:251`) z »lastno ekipo«; labeli `timesheet`, `payrollPrep`,
  `hrAdmin` z »**VAŠIH** zaposlenih«.
- Iz `kadriHz.annualPayrollErrorEUR` (`:289–296`) črtaj »zunanja pomoč« — v tem segmentu jo že meri
  `obracuniRs.externalHelpCostEUR`. Dodaj `allowUnknown: true`. **Polja ne odstranjuj** — brez njega bi
  `kadriRs` ostal brez vsakega vnosa v `directLoss`.
- `analitikaHz` prompt (`:41`) z »po katerih vodite **SVOJE** podjetje«.

**Zahteva `analitikaRs` in `kadriRs`** (nova datoteka `src/config/modules/racunovodstvoHz.ts`, uvoz v
`modules/index.ts`, zamenjava id-jev v `segments.ts:233–234`):
- Vsi `help`-i, ki imenujejo stranke.
- Preimenovanje `reportPrepHoursPerMonth` → `ownReportPrepHoursPerMonth`.
- `mainCause`: »Podatke dobimo od zunanjega računovodstva« (`horizontal.ts:33`) in »Zunanji obračun plač«
  (`:244`) sta za servis absurdna, za ostalih pet oz. šest segmentov pa pravilna in **edina `external`
  varovalka pred precenitvijo** — zato ju spremeni samo v panožni različici. Zapiši kot odločitev, da
  nova nabora nimata kategorije `external`, sicer je to tiho zvišanje naslovljivega deleža.
- **Vrednotenje** (`kadriHz.compute`, `horizontal.ts:301`): `timesheet` in `payrollPrep` po
  `operationalHourCostEUR`, `hrAdmin` po `adminHourCostEUR`. Precedens za ločeno vrednotenje znotraj
  enega modula obstaja (`servisHz`, `popravkiRs`). Sočasno popravi `content/methodology.ts:307–312`,
  ki danes za vse tri postavke navaja administrativno uro.
- `pantheon` alineje prilagodi (»artikli« in »oddelki« servisu ne pomenijo nič).
- Popraviti je treba `horizontal.test.ts:260–264` (»vsak segment ponudi vsaj dve horizontali«).
- Vnosa v `content/methodology.ts` in `content/actions/actions.ts` sta **obvezna** za nova id-ja.

**Izpuščene horizontale — vse tri utemeljitve držijo** (`segments.ts:223–226`): `financeHz` (knjiženje in
obračuni so njihov produkt), `dokumentiHz` (zajem listin meri `zajemRs`), `servisHz` (lastne napake meri
`popravkiRs`). Z eno posledico: skupaj s `financeHz` je iz segmenta izpadlo **usklajevanje banke**, ki ga
ne meri nihče — glej razdelek 8.

**Ločen popravek:** `content/methodology.ts:299` trdi, da se ura, vpisana v drugem področju, tu ne
ponavlja. Motor med moduli ne primerja vnosov; edina varovalka je ovojnica s pragom 40 %. Prepiši v
preverljivo obliko: »Vsako področje vpraša po svojem delu procesa in vsako vprašanje pove, kaj vanj ne
sodi. Kadar vnesene ure presežejo 40 % skupne mesečne kapacitete vaše ekipe, izračun na to izrecno
opozori.« Isti popravek pri `dokumentiHz` (`:313–318`).

---

## 8. Manjkajoča področja

### Dodaj zdaj (6)

| Predlog | Kam | Meja, proti kateri je preverjen |
|---|---|---|
| `clientCount` »Koliko strank danes vodite?« | glej razdelek 10 | Ne podvaja ničesar; je imenovalec za `belowCostClients` in `hoursPerClientPerMonth`. |
| `eInvoiceCapability` »Ali lahko za stranke že danes prevzamete in oddate strukturiran e-račun (eSlog, UBL), ne le PDF?« | `diagnostikaRs`, za `auditTrail` | Proti modulu E — tam je isto vprašanje, a ga ne-PANTHEON servis ne vidi. |
| `bankMatchingHoursPerMonth` »usklajevanje bančnih izpiskov ter zapiranje odprtih postavk kupcev in dobaviteljev« (B10, prioriteta 12) | **sporno**: `zajemRs` (zajem) ali `obracuniRs` (mesečni zaključek, proces 20) — glej razdelek 10 | Proti `retypingHoursPerMonth` (prepis med programi ≠ ujemanje postavk) in `correctionHoursPerMonth` (popravek napake ≠ redno zapiranje). |
| Ure sezone letnih zaključkov | `obracuniRs` | **Pogoj:** hkrati zoži obstoječi `overtimeHoursPerMonth` (`:283–284`) na mesečni ritem, sicer podvajanje. |
| `scopeAgreement` (B12) | `donosnostRs` | `contextOnly`; ne prinaša evrov, pojasni pa `belowCostClients`. |
| `monthClosedByDay` (K07) | `obracuniRs`, namesto `closingProcess` | Zamenjava, ne dodatek. |

### Dodaj kmalu (8)

`capacityUse` »Kaj bi naredili s časom, ki bi se sprostil?« (`diagnostikaRs`, `contextOnly` — monetizacijski
faktor iz §9.1, brez katerega naslov ni preverljiv) · `onboardingHoursPerClient` »Koliko ur v povprečju
porabite za prevzem ene nove stranke (začetna stanja, konfiguracija, pooblastila)?« (naslov obljublja nove
stranke, njihovega prevzema pa ne meri nihče) · `ocrFixHoursPerMonth` (popravljanje samodejno zajetih
listin) · `payrollRerunsPerMonth` (B15) · `intakeChannelCount` (B02) · uvajanje novih sodelavcev (B13,
v `kadriRs`) · `amlDocumentation` (B25) · `lostClientsPerYear` (samo če `donosnostRs` ostane pod osmimi polji).

### NE dodajaj zdaj (11) — z razlogi

| Kandidat | Zakaj ne |
|---|---|
| Potencialni prihodek od svetovanja (B19) | Krši **dve** trdi pravili hkrati in bi iste ure preštel drugič — koš `capacity` jih že vsebuje. Če se pojavi pritisk, naj se pove v prodajni pripravi **brez zneska**. |
| Letni strošek IT (B22) | Sedanji izdatek ni izguba in ne sodi v noben od petih košev; je imenovalec ROI, torej prodajni podatek za sestanek. |
| Delež strukturiranih vhodov (K02) | Skoraj komplementaren `manualSharePercent` v istem modulu; motor skladnosti ne preverja. Tudi **ne** izpeljuj kot `1 − manualSharePercent`. |
| Podvojeni dokumenti (B16) | Števila ne vodi noben servis → ni odgovorljivo iz glave; ure so v evrih že prijavljene. |
| Nepovezani programi strank (B21) | `retypingHoursPerMonth` meri prav te ure — dovolj je stavek v obstoječem explainerju. |
| Pooblastila in dostopi (B24) | Enkratno delo ob prevzemu (proces 4), v mesečnem merilu šum; sodi v `onboardingHoursPerClient`. |
| Poročila za stranke (proces 22) | Iste ure že merita dve polji; rešitev je zaostritev meje, ne tretje polje. |
| Izjeme na 100 listin (K06) | Raziskava ga sama uvršča med **predpilotne meritve iz sistema** (§8.2), ne med vprašanja za lastnika. Sodi med ukrepe v `actions.ts:288–294`. |
| Neplačane terjatve servisa | Zahtevalo bi koš `oneTimeCapital`, ki je iz segmenta izpuščen z zapisano utemeljitvijo (`racunovodstvo.ts:24–26`). |
| Pravila elektronske hrambe (proces 27) | Ne doda ne ur ne evrov; obiskovalec brez pravnega pregleda ne more oceniti. Sodi med ukrepe (`actions.ts:264–271`). |
| Šesto stroškovno področje / nov modul | Sedem triažnih področij ob priporočenih treh je že meja; novo sme vstopiti le ob **odstranitvi** obstoječega. |

---

## 9. Kaj je preverba popravila — ne poskušaj znova

Formalno ovrženih sodb je nič, popravljenih 87. Vzorci, ki jih mora izvajalec poznati:

**Predlogi, ki bi podrli teste.** Delitev `unbilledHoursPerMonth` na dve polji podre `racunovodstvo.test.ts:230–235`
(5–6 polj), dokler eno polje ne odide ven. Dodajanje `help` brez `explainer` podre `explainers.test.ts`.
Umik obeh horizontal iz segmenta podre `horizontal.test.ts:260–264`.

**Predlogi, ki bi pokvarili druge segmente.** Sprememba `ANALITIKA_CAUSES`, `KADRI_CAUSES` in
`ASSURANCE_CHOICES` v skupnih datotekah — vse tri so v rabi pri štirih do sedmih dejavnostih.

**Predlogi, ki bi kršili trda pravila.** Varianta z izbirnim razponom za `manualSharePercent`, kjer bi
»Ne vem« pomenil 0,3 — ustvaril bi ~20.700 EUR brez potrditve. In omejitev naslovne številke z
`(FTE × 160 − stranke × ure) / ure`, ki bi pri polno zasedenem servisu vedno vrnila 0 in izničila naslov.

**Napačne trditve o kodi, ki so bile ovržene ob preverjanju:**
- `minutesPerManualDocument` privzetka **ni** mogoče dati na 0 — drsnik ima `min: 0.5`.
- `recommendedCount` **ni kvota**, ampak predizbira; obiskovalec lahko izbere vseh sedem področij.
- Novi ključi polj **ne** gredo v `exportRecord` kot stolpci — modulski vnosi gredo v `moduleInputsJson`.
- Razlika med urnima postavkama **ni** 30–60 %; pasova izbere obiskovalec, razlika je le med rezervama (+25 %).
- Ure se **ne** delijo z 8; 8 je le rezerva, delitelj je obiskovalčev odgovor.
- Ime `filingPrepHoursPerMonth` je zasedeno po pomenu — »filing« v tem modulu pomeni arhiviranje.

**Dve poti sta bili ovrženi kot zapisani** (predlog je preživel v drugi obliki):
1. Pokazati modul E ne-PANTHEON servisom — `fields` se generirajo iz **vseh** `MODULE_E_ITEMS` naenkrat
   (`legacy.ts:279–284`), zato bi servis dobil še obe strežniški opozorili, torej natanko šum, ki ga
   komentar `contexts/index.ts:48–56` prepoveduje. Potrebna je vidnost **na ravni postavke**.
2. Premakniti `hoursPerClientPerMonth` ali `clientCount` v skupno finančno osnovo — `SegmentContext`
   nima tipa za navadno številčno vprašanje (pozna le `ContextQuestion`, `CostQuestion`, `ScaleQuestion`,
   vsakega s pasovi in fallbackom). To ni premik, ampak nova shema.

**Napaka v branju raziskave:** 4.077,5 FTE se nanaša na 2.705 izvajalcev z izkazi, ne na vseh 4.397
subjektov — 1,51 FTE na servis, ne 0,93.

---

## 10. Odprte odločitve

**1. Kam z `clientCount`.** Val 1: `diagnostikaRs` kot prvo polje (`contextOnly`, modul je vedno prikazan
in nima omejitve števila polj) — poceni, brez sprememb sheme. Val 2: korak 2 skupaj s FTE (`BasicInfo`,
`types.ts:1–6`, + nov stolpec **na konec** `CSV_COLUMNS`) — dražje, a postavi obseg servisa tja, kamor
po vsebini sodi, in je na voljo že pred triažo. **Priporočilo:** korak 2, ker je imenovalec potreben
tudi takrat, ko diagnostika še ni izpolnjena.

**2. Kam z bančnim usklajevanjem.** `zajemRs` (zajem in obdelava listin) proti `obracuniRs` (mesečni
zaključek, proces 20, in modul že uporablja operativno uro). **Priporočilo:** `obracuniRs` — usklajevanje
je del zaključka, ne zajema, in `zajemRs` ima že šest polj.

**3. Ali `SIZE_FIT` v ICP postane segmentno občutljiv.** Poseg v skupno datoteko za en segment; ceneje
je pustiti in zapisati opombo, dražje pa je pravilneje.

---

## 11. Vrstni red izvedbe

| # | Paket | Datoteke | Testi za posodobitev |
|---|---|---|---|
| 1 | `manualSharePercent` na 0 + obe besedili; `allowUnknown` na petih EUR poljih; zamenjava napačnega explainerja pri `inquiry`/`chasing`; manjkajoča besedila pri `correction`, `filing`, `overtime`, `belowCostClients`, `creditNote` | `racunovodstvo.ts` | `explainers.test.ts` |
| 2 | Triaža brez `?? 0`; popravek trditve v `StepEmployeeCount` | `StepTriage.tsx:66`, `StepEmployeeCount.tsx:44–47` | — |
| 3 | Izbris `annualRevenue` in `contributionMargin` + popravek `costBasisIntro` + nov test o prekrivanju pasov | `contexts/racunovodstvo.ts` | `contexts.test.ts` |
| 4 | Naslovna številka: naslovljive ure, pas, razpon, celo število; `plausibility` na izpeljane ure | `moduleEngine.ts`, `potential.ts`, `calculations.ts`, `CalculatorFlow.tsx`, `ResultsView.tsx`, `pdf.ts`, `plausibility.ts` | `calculations.test.ts:84`, `moduleEngine.test.ts`, `plausibility.test.ts:74–82` |
| 5 | `clientCount` (po odločitvi 10.1) + premik `hoursPerClientPerMonth` in `declinedClientsPerYear` v `diagnostikaRs` | `types.ts`, `racunovodstvo.ts`, `CalculatorFlow.tsx:276`, `exportRecord.ts`, `content/methodology.ts:253–257` | `racunovodstvo.test.ts:230–235`, `exportRecord.test.ts` |
| 6 | `lostMargin` za »Stranke pod lastno ceno« + pet mest uskladitve | `racunovodstvo.ts:584`, `segments.ts:242–243`, `content/methodology.ts:247–252`, `ResultsSummary.tsx:74`, `pdfSales.ts:168`, `salesReportHtml.ts:126` | `racunovodstvo.test.ts:178–182` |
| 7 | Meje dvojnega štetja: `reportPrepHours` v obeh področjih, plače v `obracuniRs` proti `kadriHz`, zrcalni stavki pri popravkih, popravek metodologije | `racunovodstvo.ts`, `horizontal.ts:56`, `content/methodology.ts:299` in `:313–318` | `racunovodstvo.test.ts:111` |
| 8 | `analitikaRs` in `kadriRs` kot panožni različici + vnosa v `methodology.ts` in `actions.ts` | nova `racunovodstvoHz.ts`, `modules/index.ts`, `segments.ts:233–234` | `horizontal.test.ts:260–264`, `moduleEngine.test.ts:366–374` |
| 9 | Nova polja »dodaj zdaj«: banka, e-račun 2028, sezona zaključkov, obseg pavšala, dan zaključka | `racunovodstvo.ts` | `racunovodstvo.test.ts` (število polj) |
| 10 | Vidnost ZIERDED po postavkah + oživitev `wasTechnicalRiskModuleShown` + popravek opombe v ICP | `legacy.ts:245–284`, `contexts/index.ts:48–62`, `salesReport.ts:533`, `icp.ts` | `potential.test.ts:134+` |

---

## 12. Viri

- **Vseh 119 sodb dobesedno**, z utemeljitvijo, predlogom, sklicem na raziskavo in popravkom skeptične
  preverbe: `PRILOGA-vse-ugotovitve-racunovodstvo.md` (ista mapa). To poročilo je sinteza, priloga je vir.
  Kadar se razhajata, velja priloga — razen tam, kjer to poročilo izrecno pove, da je bil predlog ovržen,
  združen ali prestavljen (razdelka 9 in 10).
- Postopek pregleda: `GPT baza znanja/NAVODILA-pregled-vprasalnika-po-dejavnosti.md`.
- Raziskava niše: `GPT baza znanja/računovodstvo/Datalab_globinska_raziskava_racunovodski_servisi.md`
  (§3.1 trg, §6.1 28 procesov, §7.1 katalog B01–B25, §8.1 KPI K01–K18, §9 finančni model, §15 ZIERDED).
