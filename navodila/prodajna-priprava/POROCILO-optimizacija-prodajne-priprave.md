# Optimizacija prodajne priprave: prodajnik vidi vse, kar je stranka povedala — in vse, kar stranka gleda

Namen: **dvigniti interni dokument »Priprava na pogovor« na raven, kjer je prodajnik na
sestanek vrhunsko pripravljen** — vsak podatek, ki ga je stranka vnesla v vprašalnik, je
viden in razjasnjen; vsaka številka, ki jo stranka gleda v svojem poročilu, je prodajniku
znana vnaprej; prvih 60 sekund branja da vse, kar potrebuje za klic. Stanje kode: avgust
2026, veja `main`.

Ključna ugotovitev pregleda: dokument je zasnovan pravilno (sodba → dejstva → ukrep →
utemeljitev; štiri ločene kategorije mehkosti; stolpec vira pri vsakem odgovoru), a
**izgublja tri vrste signala** — namero (prošnja za posvet), avtomatiko (follow-up
sekvenca) in finančne predpostavke (prihodek, marža, kapital) — in **prodajniku ne pokaže
številk, ki jih stranka bere v svojem PDF-ju** (razpon, »najmanj«, tri leta, cena
delovnega dne, tabela povračila). Na dveh mestih dokument celo **trdi nekaj drugega kot
strankino poročilo** (stolpec »Izmerjeno«, gola točka namesto razpona) — to sta napaki, ki
se pokažeta šele na sestanku, torej v najdražjem trenutku.

Vse trditve v tem dokumentu so preverjene proti živi kodi na `main` (ne proti stari kopiji
`/Users/janpavlic/Documents/Datalab/Claude code` — znana past iz navodil za preglede).

---

## 1. Povzetek za vodstvo

Prodajni dokument nastane kot en podatkovni objekt (`src/lib/salesReport.ts`) in se izriše
dvakrat: HTML gre v webhook (CRM), PDF se prenese. Podatkovni objekt že danes **vsebuje**
skoraj vse, kar prodajnik potrebuje — izgube nastanejo v izrisu: polja obstajajo, a se ne
izpišejo. Zato je večina popravkov poceni.

| Prioriteta | Kaj | Zakaj | Trud |
|---|---|---|---|
| **P0 — izguba signala** | prošnja za posvet; follow-up sekvenca; prihodek/marža/kapital z virom; popravek stolpca »Izmerjeno«; enaka oznaka zanesljivosti v obeh izrisih; hero v strankini obliki | prodajnik danes kliče topel lead kot mrzlega, brani številko, ki je stranka ni videla, in trdi »izmerjeno«, kjer strankino poročilo pravi »ni izmerjeno« | dnevi — polja so že v objektu |
| **P1 — priprava na sestanek** | razdelek 1 kot priprava na klic (4 vrstice); izpeljanke in tabela povračila; berljiv tehnični rok z datumom; sortirana triaža z zneski; opozorila NAD številko; accountingCapacity | 60-sekundna orientacija postane resnična: kdo, koliko, kje boli, kaj vprašati — brez listanja | ~teden, z refaktorjem skupnih formul |
| **P2 — poliranje** | ime datoteke; »prodajni signal« → nevtralno; brez poti do kode; krajšanje razdelka 5; hierarhija naslovov | dokument v celoti prestane test »stranka ga odpre na svoji napravi« | ure |

**Pogoj za vse novo:** dokument ne sme postati daljši. Vsak nov blok na vrhu je plačan s
premikom ali krajšanjem obstoječega (poglavje 5.9).

---

## 2. Kako dokument danes deluje

- **En vir, dva izrisa.** `buildSalesReport` (`src/lib/salesReport.ts:286`) je čista
  funkcija — čas dobi kot `generatedAtISO` parameter, podatke iz `deliverLead`
  (`src/lib/deliverLead.ts:184-203`). Izrisovalca sta `src/lib/salesReportHtml.ts` (HTML v
  webhook payload) in `src/lib/pdfSales.ts` (PDF prenos); dogovor je vrstica-za-vrstico
  enakost (komentar `src/lib/pdfSales.ts:120-121`).
- **Pet razdelkov**, uveljavljenih s testom (`src/lib/salesReportHtml.test.ts:125-139`):
  1. Ocena — kvalifikacija stranke, 2. Osnovni podatki, 3. Rezultati vprašalnika
  (3a Njihove info, 3b Njihovi največji painpointi), 4. Priporočilo licenc,
  5. Kvalifikacija — podrobnejša razlaga. Logika: sodba → dejstva → ukrep → utemeljitev.
- **Rezervna pot.** Dokler `VITE_LEAD_WEBHOOK_URL` ni nastavljen, se prodajni PDF prenese
  na **strankino** napravo (`src/lib/deliverLead.ts:208-219`). Zato velja pravilo »fit, ne
  sodba« (`src/lib/salesReport.ts:51-54`): vsak stavek mora prestati branje stranke.
- **Strankino poročilo** (`src/lib/pdf.ts`) je ločen dokument brez prodajnih vsebin; obe
  datoteki nastaneta iz istih `totals`, a se izrisujeta vsaka po svoje — in prav tu
  nastanejo razhajanja iz poglavja 3.

---

## 3. Potrjene vrzeli

### 3.1 P0 — izguba signala

**A. Prošnja za posvet je nevidna.** `consentConsulting` je edino polje obrazca, ki izraža
NAMERO in ne dovoljenja — stranka je izrecno kliknila »Da, želim brezplačen posvet —
kontaktirajte me.« (`src/components/Results/EmailGate.tsx:500`, komentar tipa
`src/types.ts:42-47`). Polje pripotuje v objekt (`...params.consents`,
`src/lib/salesReport.ts:300`) in v CSV za CRM (`src/lib/exportRecord.ts:41`), a ga **noben
izrisovalec ne izpiše**: oba izpišeta samo tri privolitve
(`src/lib/salesReportHtml.ts:304-306`, `src/lib/pdfSales.ts:136-138`). Prodajnik torej
kliče topel lead kot mrzlega — in izgubi najmočnejši možni uvod (»sami ste zaprosili za
posvet«).

**B. Follow-up sekvenca je nevidna.** `followUpSequence`
(`src/lib/salesReport.ts:96`; štirje ključi v `src/lib/followUp.ts:3-7`) pove, katera
avtomatika bo tekla vzporedno s klicem. Izrisana ni nikjer — prodajnik ne ve, kaj je
stranki že odšlo po e-pošti, in tvega, da ponovi ali si nasprotuje. Slovenskih oznak za
ključe v repozitoriju še ni.

**C. Finančne predpostavke so izgubljene.** `buildHourAssumptions`
(`src/lib/salesReport.ts:448-484`) sestavi tabelo SAMO za urne postavke. `annualRevenue`,
`contributionMargin` in `capitalCostRate` — vsaka z dragocenim virom
`entered / band / industryAverage / none` — niso prikazane nikjer. Stranka, ki razkrije
letni prihodek ali maržo, je povedala največ, kar vprašalnik sploh vpraša; prodajnik brani
koš »nezaslužena marža«, ne da bi vedel, ali stoji na 8 % ali 35 %.

**D. Stolpec »Izmerjeno« laže.** `measured: activeIds.has(definition.id)`
(`src/lib/salesReport.ts:351`) pomeni »IZBRAL«, ne »IZPOLNIL«. Področje, ki ga je stranka
v triaži izbrala in pustila prazno, dobi »Izmerjeno: da« — strankino poročilo pa isto
področje prek `isModuleAnswered` (`src/lib/moduleEngine.ts:217`) šteje med neizmerjena.
Prodajnik na sestanku reče »to smo izmerili, znesek je 0«, stranka bere »za to področje
nimamo vaših številk«.

**E. Oznaka zanesljivosti se med izrisoma razhaja.** PDF izpiše
`CONFIDENCE_LABEL[s.confidence]. razlog` (`src/lib/pdfSales.ts:200`), HTML izpiše samo
razlog (`src/lib/salesReportHtml.ts:147`). Prodajnik na telefonu ne izve, ali je ocena
visoka ali nizka — in dokumenta ne izgledata več kot par.

**F. Hero v napačni obliki; izpeljank ni.** Vrstica »Izmerjena letna bolečina« izpiše golo
točko `formatEUR(deal.measuredLossEUR)` (`src/lib/salesReportHtml.ts:84`,
`src/lib/pdfSales.ts` enako). Ta vsota JE strankin hero
(`directLoss + lostMargin + capacity`, `src/lib/pdf.ts:342-355`), a stranka ga vidi prek
`amountLabelOf`/`formatAmount` (`src/lib/pdf.ts:380`, pravila v
`src/lib/format.ts:72-82`): **razpon premaga vse; »najmanj« pri nizki zanesljivosti; 0 →
»ni izmerjeno«**. Prodajnik torej pove »34.452 EUR«, stranka ima pred sabo
»29.232 – 39.672 EUR« ali »najmanj 34.452 EUR« — prvi ugovor je »pri meni piše drugače«.
Poleg tega prodajnik sploh ne vidi izpeljank, ki jih stranka bere: ×3 leta (z razponom in
»najmanj«, `src/lib/pdf.ts:418-425`), cena delovnega dne in meseca odlašanja (goli točki,
`src/lib/pdf.ts:446-447`) ter tabele povračila 30/60/120k, prikazane samo pri
naslovljivem potencialu ≥ 10.000 EUR (`src/lib/pdf.ts:168-171`,
`MIN_POTENTIAL_FOR_PAYBACK_EUR` v `src/lib/horizon.ts`). Stranka pride na sestanek s
stavkom »to nas stane 1.400 EUR na delovni dan« — prodajnik te številke nima.

**G. accountingCapacity manjka že v vhodu.** »+N strank brez nove zaposlitve« je pri
računovodskih servisih strankina naslovna številka (rumeni pas,
`src/lib/pdf.ts:319-329`). `BuildSalesReportParams` (`src/lib/salesReport.ts:261-284`)
tega polja **nima** in `deliverLead` ga ne poda, čeprav ga ima
(`src/lib/deliverLead.ts:74`). Prodajnik pri tem segmentu ne pozna največje številke,
ki jo bo stranka citirala.

### 3.2 P1 — priprava na sestanek

- **Tehnični rok ni berljiv kot datum na vrhu.** `warningDate` (`src/config/modules/moduleE.ts:25,31,37`
  — SQL Server 2016: 2026-07-14 **že potekel**; Windows Server 2016: 2027-01-12; ZIERDED:
  2028-01-01) napaja samo ICP dimenzijo nujnosti (`src/config/icp.ts:254-269`). Kartica
  tveganja izpiše statični `warningText`; »rok je že potekel« je najmočnejši argument
  nujnosti in mora biti med prvimi tremi prebranimi vrsticami, ne v šestem razdelku.
- **Tri stanja Modula E so nerazločljiva.** Prodajnik ne loči (a) »modula ni videla«
  (ni uporabnik PANTHEON), (b) »videla, ni odkljukala nič« (odgovor!), (c) »odkljukala«.
  Funkcija `wasTechnicalRiskModuleShown` (`src/lib/salesReport.ts:575-583`) za to
  razlikovanje že obstaja, a je **mrtva koda** — nima nobenega klicatelja.
- **Triaža ni prioritizacijska tabela.** Vrstni red je vrstni red konfiguracije
  (`src/lib/salesReport.ts:341-352`, brez sortiranja); stolpca z letnim zneskom ni —
  vrstica »ocena 3/3« ne pove, ali gre za 2.000 ali 80.000 EUR.
- **`highestModuleTitle` ni izrisan** (obstaja, `src/lib/salesReport.ts:361-363`) —
  »kje je največ denarja« si mora prodajnik sestaviti sam iz blokov področij.
- **`modulesMissingMainCause` ni viden** (`src/lib/moduleEngine.ts:248`): področje z
  denarjem brez izbranega vzroka pomeni tihi koeficient 0,45 namesto morebitnih 0,75
  (`src/config/modules/addressableShare.ts`) — potencial je lahko za 40 % prenizek, in
  vprašanje »kaj je glavni vzrok?« je najcenejši dvig številke na sestanku.
- **Pokritost je pokopana.** Stranka bere »Izmerjeno X od Y področij« na vidnem mestu
  (`src/lib/pdf.ts:405-415`); prodajnik jo najde le v opombi ICP dimenzije v zadnjem
  razdelku (`src/config/icp.ts:290-293`).
- **`addressableCap` ni odražen.** Pri izmetu materiala in praznih kilometrih velja
  kapica 0,5 (`src/config/modules/proizvodnja.ts:218`, `src/config/modules/logistika.ts:149`),
  prikazan pa je surovi delež (npr. 75 %) — kdor na sestanku množi, dobi drugačno
  številko od kartice potenciala.
- **oneTimeCapital pod glavo »Letni znesek«.** Tabela postavk področja izpiše tudi
  enkratni kapital pod isto glavo (`src/lib/salesReportHtml.ts:342-350`) — seštevek
  stolpca se ne ujema z vrstico »Skupaj«.
- **Opozorila so pod številko.** `plausibilityWarning` (vnesene ure presegajo kapaciteto —
  znesek je verjetno precenjen) in razlog zanesljivosti stojita v 3a POD karticami
  (`src/lib/salesReportHtml.ts:147-152`). Prodajnik mora vedeti, česa NE sme izgovoriti,
  preden izgovori znesek.

### 3.3 P2 — ubeseditve, ki ne prestanejo testa »stranka odpre datoteko«

- Ime datoteke `datalab-prodajna-priprava-<podjetje>-<datum>.pdf`
  (`src/lib/pdfSales.ts:72`) — stranka ga prebere v mapi Prenosi, še preden karkoli odpre;
  glava dokumenta je pri tem previdno »Priprava na pogovor«. → `datalab-priprava-na-pogovor-…`.
- »Vrzel sedanjega sistema **(prodajni signal)**« v Osnovnih podatkih → »Možnost
  izboljšave sedanjega sistema«, pojasnilo »v izračun zneskov ne vstopa« ostane.
- Opomba razdelka 5 navaja pot `src/config/icp.ts` — pot do izvorne kode v dokumentu, ki
  ga lahko drži stranka, izbrisati; nadomesti »Merila so začetna ocena in se še umerjajo.«

---

## 4. Predlogi — ciljna zgradba

Pet `<h2>` ostane nespremenjenih (naslovi in vrstni red, test se ne spremeni). Vse novo so
bloki znotraj razdelkov; vsaka nova izpeljava se izračuna **enkrat, v builderju** —
izrisovalca samo izpisujeta (vzorec `AnswerRow.source`, `src/lib/salesReport.ts:221-229`).

### 4.1 Razdelek 1 — »Ocena — kvalifikacija stranke« postane priprava na klic

Branje od zgoraj navzdol, štiri logične vrstice (poleg obstoječe ICP kartice):

1. **Kdo + kako do njega + ali je prosil za posvet.** Kadar `consentConsulting`:
   poudarjen pas, ki **dobesedno citira strankino kljukico**:
   > Stranka je ob oddaji označila: »Da, želim brezplačen posvet — kontaktirajte me.«
   > (26. 8. 2026, 14:12). Telefon: 041 123 456.
   Če telefona ni: »Telefona ni pustila — dosegljiva po e-pošti: {email}.« Brez obljube
   roka klica, brez stopenj nujnosti, brez besede »lead«. (Glej odprto odločitev 4.8.)
2. **Številka, ki jo je stranka videla.** Obstoječo vrstico »Izmerjena letna bolečina«
   popraviti tako, da kliče **isti `formatAmount` z istim razponom in isto zastavico
   `lowConfidence`** kot `src/lib/pdf.ts:380` — niz mora biti znakovno enak strankinemu.
   Pod njo ena kompaktna vrstica izpeljank, ki jih stranka res vidi:
   > V treh letih: 87.696 – 119.016 EUR · vsak delovni dan: 137 EUR · vsak mesec odlašanja: 2.871 EUR
   Pozor na asimetrijo, ki jo je pregled potrdil: **×3 leta dobi razpon in »najmanj«**
   (`src/lib/pdf.ts:419-425`), **dan in mesec sta goli točki** iz `heroValueEUR`
   (`src/lib/pdf.ts:446-447`) — ogledalo tega ne sme »poenotiti«, sicer pokaže številko,
   ki je stranka ni videla. Ista vrata: pri hero = 0 vrstice ni (kot `src/lib/pdf.ts:418`).
3. **Kje boli.** Dve vrstici, PREMAKNJENI (ne dodani): »Največ denarja:
   {highestModuleTitle} — {znesek} letno« in »Najbolj boleče brez številke: {področje} —
   ocena {n}/3, v poročilu za to ni nobenega zneska«. Druga vrstica je dvig obstoječe
   `painfulNote` iz 3b (`src/lib/salesReportHtml.ts:189-194`), ki se tam izbriše —
   merilo sprejema: skupna dolžina dokumenta se ne poveča.
4. **Prvo vprašanje.** Dobesedno `playbook.openingQuestions[0].question` — playbook ga že
   razvršča od najmočvnejšega (`src/lib/salesPlaybook.ts:81-133`).

Dodatno v ključno tabelo razdelka 1:
- **Vrstica tehničnega roka** (samo kadar je kaj odkljukano): »Tehnični rok: POTEKEL
  14. 7. 2026 (pred 43 dnevi) — SQL Server 2016« oziroma »12. 1. 2027 (čez 139 dni) —
  Windows Server 2016«; pri več rokih najzgodnejši + »… in še {n} — glej tveganja«.
- **Če `plausibilityWarning` ni null → vrstica NAD številko**: »Preden izgovorite znesek:
  vnesene ure so ~{N} % kapacitete podjetja — znesek je verjetno precenjen.«
- **Vrstica »Predvideno nadaljevanje«** (follow-up, glej 4.2).

### 4.2 Follow-up sekvenca — »Predvideno nadaljevanje«

Oznake opisujejo **naše dejanje**, nikoli sodbe o stranki (datoteka lahko pristane pri
njej). Predlagana preslikava (nova konstanta ob tipu v `src/lib/followUp.ts`):

| ključ | oznaka |
|---|---|
| `high-loss-with-risk` | Klic svetovalca, prednostno zaradi tehničnega roka |
| `high-loss-no-risk` | Klic svetovalca |
| `low-loss-newsletter` | E-vsebine in vabila na dogodke |
| `accounting-lm07-bridge` | Ponudba za računovodske servise |

Brez surovih ključev v izpisu. `Record<FollowUpSequence, string>` prisili totalnost —
nov ključ brez oznake pade na typechecku. (Strožja alternativa v 4.8.)

### 4.3 Razdelek 2 — Osnovni podatki

- **4. vrstica privolitev**: »Prošnja za posvet — ‚kontaktirajte me'« → Da/Ne (vedno,
  revizijska popolnost — pas iz 4.1 se prikaže samo pri Da).
- Vrstica »Predvideno nadaljevanje« ob »Vir obiska« (ali v razdelku 1 — obe mesti sta
  zagovorljivi, izbrati eno in ju uskladiti v obeh izrisih).
- P2 preimenovanje: »Možnost izboljšave sedanjega sistema« (3.3).

### 4.4 Razdelek 3a — finančna osnova in red

- **Tabela »Finančna osnova, kot jo je navedla stranka«**: obstoječa tabela urnih postavk
  se razširi s tremi vrsticami — letni prihodek, prispevna marža (kot odstotek, kot ga je
  videla stranka), strošek kapitala (SAMO kadar ga je dejavnost vprašala — isti pogoj kot
  `chargeOutRate`, `src/lib/salesReport.ts:472`). Vir prek nove `scaleAssumptionSource`
  ob obstoječi `hourAssumptionSource` (`src/lib/salesReport.ts:139-145`): »vneseno« /
  »izbran razpon X« / »povprečje panoge (X)« / »ni odgovora — privzetek dejavnosti«.
  Pri prihodku s source `none` dopisati posledico: »terjatve in DSO v izračunu na 0«.
- **Oznaka zanesljivosti v HTML** poravnati s PDF (skupna oznaka, en vir).
- **Pokritost kot vrstica**: »Izmerjeno {X} od {Y} področij — neizmerjena v zneske ne
  vstopajo« (isti stavek, kot ga bere stranka).
- **oneTimeCapital**: pri postavkah koša `oneTimeCapital` pripis »(enkratno, se ne
  sešteva)« — seštevek tabele se mora ujemati z vrstico Skupaj.
- **`addressableCap`**: kadar je kapica dejansko uporabljena, pripis pri deležu:
  »naslovljiv delež 75 %, pri postavki ‚{postavka}' omejen na 50 %«.
- **Področja brez glavnega vzroka**: poudarjena opomba »{Področje} ima {znesek} letno,
  a brez izbranega vzroka — velja previdni delež 45 %. Vprašanje po vzroku je najcenejši
  dvig potenciala.«

### 4.5 Razdelek 3b — painpointi

- **Triažna tabela sortirana in z zneski.** Sortiranje ENKRAT v builderju: ocena padajoče;
  pri isti oceni neizpolnjena pred izpolnjenimi (neizmerjena bolečina = najboljše
  vprašanje); neocenjena (null) na dno; zadnje merilo vrstni red segmenta (stabilnost).
  Nov stolpec »Letni znesek«: `annualEUR: number | null` na TriageRow (**null, ne 0** —
  isti razlog kot pri `score`, `src/lib/salesReport.ts:200-207`).
- **Popravek D iz 3.1**: tri stanja namesto dveh — izmerjeno / izbrano-prazno /
  ni-izbrano (prek `isModuleAnswered`, ki je v datoteki že uvožen). »Izbrano-prazno« je
  samostojen prodajni signal: stranka je področje prepoznala kot svoje, a ni imela številk.
- **Modul E podblok** (samo kadar je bil modul prikazan): tabela treh vrstic z Da/Ne —
  neodkljukano je odgovor (»že migrirali«), ne molk. Kadar prikazan in nič odkljukano:
  »Roke smo ji pokazali, odkljukala ni nobenega — po njeni izjavi tehnični roki zanjo ne
  veljajo.« (`wasTechnicalRiskModuleShown` v qualification — funkcija obstaja, mrtva.)
- `painfulNote` se po dvigu v razdelek 1 tu izbriše (4.1, točka 3).

### 4.6 Razdelek 4 — licenca + tabela povračila

Tabela povračila sodi SEM (kjer je cenovno sidro pogovora), ne v 3a: pod priporočeno
licenco, z **istimi vrati kot strankin PDF** (`paybackRows()` — nova funkcija v
`horizon.ts`, vrne `null` pod pragom ali pri `undefined` potencialu; pogoj se nikoli ne
prepisuje). Kadar `null`, izrecna vrstica: »Tabela povračila stranki NI bila prikazana
(potencial pod 10.000 EUR)« — prodajnik mora vedeti tudi, česa stranka ni videla.

### 4.7 Razdelek 5 — krajšanje

- Ponovljeni stavek skupne ocene izbrisati (ostane samo tabela dimenzij).
- Tabelo dimenzij v HTML zaviti v `<details>` (vzorec »Vsi odgovori«); v PDF razdelek
  premakniti na konec kot prilogo.
- V PDF premakniti tudi »Vsi odgovori« po področjih in metodologijo v prilogo za
  razdelkom 5 — prvi dve strani PDF-ja morata biti sestanek, ne arhiv. (HTML to varovalko
  že ima prek `<details>`; PDF je nima.)
- Popraviti hierarhijo: ugovori so danes `<h3>` pod `<h4>` (»Kaj boste slišali«) —
  poravnati na h4 ali izpis brez lastnega naslova.

### 4.8 Odprti odločitvi (dokumentirani z obema možnostma)

**Pas za posvet v rezervnem načinu.** Kritika je opozorila: brez webhooka prošnja za
posvet **sploh ne prispe do Datalaba** (`src/lib/deliverLead.ts:224-226` zabeleži
`no_webhook`; `EmailGate.tsx` namenoma ne obljublja klica). Dokument s pasom »prosi za
posvet« v strankinih rokah je nagovor prodajniku, ki ga ne bo nihče prebral.
*Priporočilo:* pas obdržati (dobesedni citat, brez obljub — je dejstvo, ne sodba), a
**korenski problem rešiti prioritetno: nastaviti `VITE_LEAD_WEBHOOK_URL`** — to je že
prva točka »Odprtih vprašanj pred objavo« v README. Rezervna pot je dokumentirano začasna;
optimizacija prodajnega dokumenta brez delujoče dostave je optimizacija dokumenta, ki ga
prodajnik ne dobi.
*Strožja alternativa:* do postavitve webhooka samo 4. vrstica privolitev (dejstvena,
Da/Ne), brez pasu.

**Follow-up vrstica.** Druga kritika predlaga, naj se sekvenca sploh ne izrisuje (tudi
akcijska oznaka »E-vsebine in vabila« posredno pove, da klica ne bo); ICP pas s svojo
opombo isto triažo že pove v pregledani ubeseditvi.
*Priporočilo:* izrisovati z akcijskimi oznakami iz 4.2 — opisujejo naš naslednji korak,
ne vrednosti stranke, in prodajnik brez te vrstice ne ve, kaj CRM počne vzporedno.
*Strožja alternativa:* ključ ostane samo v CSV/CRM zapisu.

---

## 5. Predlagana tehnična pot (za izvedbeni PR, povzetek)

1. **Skupni modul za hero.** Vsota `directLoss + lostMargin + capacity` je danes zapisana
   petkrat (`ResultsView.tsx:83`, `pdf.ts:342-343`, `salesReport.ts:392`,
   `salesPlaybook.ts:193` in `:211`), sestava razpona dvakrat. Ekstrahirati v **nevtralen**
   modul (nov `src/lib/heroTotals.ts` ali razširjen `horizon.ts` — precedens: čist, brez
   I/O, uvažata ga oba svetova). NE v `salesReport.ts`: `pdf.test.ts:21-25` izrecno
   prepoveduje, da bi `pdf.ts` uvažal prodajne module. Enako `paybackRows()` v
   `horizon.ts` (vrata kot funkcija, ne prepisan pogoj).
2. **View-model v builderju.** Vse nove izpeljave (`deadlines[]` z že ubesedenim nizom —
   vzorec `confidenceReason`; glava razdelka 1; sortirana triaža z `annualEUR` in
   `answered`; oznaka sekvence; vrstice finančne osnove) nastanejo v `buildSalesReport`;
   izrisovalca ne računata ničesar, tudi časa ne. `buildIcpSignals` naj bere isti
   `deadlines[]` — en izračun rokov, ne tretji zapis.
3. **Štirje novi parametri builderja**, ki jih `deliverLead` že ima pri roki: segment id
   (za segmentna besedila hero vrstice), `coverage`, `confidenceReasonPdf`,
   `accountingCapacity` (`src/lib/deliverLead.ts:58-86`).
4. **PDF paginacija.** Proračun 1. strani: razdelek 1 je danes ~85-97 mm od ~237 mm
   uporabnih — novi bloki imajo ~25-35 mm (pas ~12, glava ~18, rok ~6): morajo biti
   kratki. Razdelek 2 razbiti na dva šiva (kontakt / podjetje), da prelom pade na šiv in
   ne sredi privolitev; varovalo `drawSubTitle` dvigniti na ~28 mm (podnaslov ne sme
   ostati sam na dnu strani).
5. **Testi.** Pet-h2 test je krhek (regex `<h2>([^<]+)</h2>` — atribut ali gnezdena
   oznaka v h2 ga tiho pokvari); posodobiti sočasno s spremembo, na odporen vzorec.
   Trije nujni novi testi: (1) **enakost izrisovalcev** — vrstice iz view-modela nastopijo
   v obeh izrisih, PDF nima nobene oznake kot dobesedni niz; (2) **varnost rezervne
   poti** — v izpisu ni surovih ključev sekvenc, ni poti do kode, ni internih fraz;
   (3) **determinizem builderja** — dva `generatedAtISO` → dva različna izpisa roka.
   Prazna forma: dimni test trdi, da niz »0 EUR« ne nastopi v vrstici izpeljank (ista
   vrata kot strankin PDF). Mimogrede: `pdf.test.ts:27-35` ima `indexOf('}')` hrošč
   (ustavi se na prvem notranjem zaklepaju) — popraviti ob isti priložnosti.
6. **Delitev.** PR1 = P0 signali (brez strukturnih sprememb, hitro): 4. privolitev + pas,
   oznake sekvenc, finančna osnova, popravek »Izmerjeno«, poravnava oznake zanesljivosti,
   hero prek `formatAmount`. PR2 = številke + struktura: skupni modul, izpeljanke,
   povračilo, roki, glava, sortiranje, krajšanje, priloga v PDF. Meja med njima: »ali
   sprememba zahteva posodobitev pet-h2 testa oziroma README sheme«.
7. **Dokumentacija ob PR2:** README razdelek »Priprava na pogovor« (shema petih razdelkov
   z novimi podbloki) in komentarja »PET RAZDELKOV« v obeh izrisovalcih.

---

## 6. Rdeče črte: česa ne delati

1. **Nobenih cen PANTHEON** — repo jih namenoma ne vsebuje; tabela povračila uporablja
   nevtralne stopnje 30/60/120k.
2. **Ogledalo nikoli ne pokaže številke, ki je stranka ni videla** — ista vrata, isti
   formatter, ista asimetrija izpeljank; pri prazni formi nič (ne »0 EUR vsak delovni dan«).
3. **Ne združevati štirih kategorij mehkosti** (»Ne vem« / molk / nedotaknjeno /
   verjetnost) v en indeks — vsaka vodi v drugo vprašanje na sestanku
   (`src/lib/salesReport.ts:176-186`).
4. **Brez obljub rokov klica** v pasu za posvet — UI jih namenoma ne daje.
5. **Brez grafov v prodajni pripravi** — namerno nadomeščeni s tabelami odgovorov.
6. **Brez tretje ICP kartice / razdelka 0** — dvakrat je namerno (sodba + utemeljitev).
7. **Nobena nova vrstica ne sme podreti pravila »fit, ne sodba«** — vsak stavek prestane
   branje stranke (rezervna pot!).
8. **Dokument ne sme postati daljši** — vsak dodatek na vrhu je plačan s premikom ali
   krajšanjem (4.1 točka 3, 4.7).

---

## 7. Zgled: razdelek 1 pred in po

Fiktivna stranka: proizvodnja, 38 zaposlenih, direktor, prosila za posvet, telefon pušten,
SQL Server 2016 odkljukan, hero 34.452 EUR (razpon 29.232 – 39.672), največ denarja v
zalogah (14.800 EUR), planiranje ocenjeno 3/3 a neizmerjeno, potencial 21.300 EUR.

**Danes** (5 podatkov, nobenega ni mogoče izgovoriti na sestanku):

> 62 / 100 · pas B · Ustrezen profil, vreden pogovora.
> Velikost posla: srednji posel (10–49 zaposlenih)
> Izmerjena letna bolečina: 34.452 EUR
> Nujnost: visoka — Rok je že potekel (pred 43 dnevi).
> Priporočena licenca: Proizvodni modul MF

**Po optimizaciji** (priprava na klic, od zgoraj navzdol):

> **Stranka je ob oddaji označila: »Da, želim brezplačen posvet — kontaktirajte me.«**
> (26. 8. 2026, 14:12). Telefon: 041 123 456.
>
> 62 / 100 · pas B · Ustrezen profil, vreden pogovora.
> Kontakt: Ana Novak, direktorica · Predvideno nadaljevanje: klic svetovalca, prednostno zaradi tehničnega roka
> Stranka je videla: **29.232 – 39.672 EUR letno** · v treh letih 87.696 – 119.016 EUR · vsak delovni dan 137 EUR · vsak mesec odlašanja 2.871 EUR
> Tehnični rok: **POTEKEL 14. 7. 2026** (pred 43 dnevi) — SQL Server 2016
> Največ denarja: Zaloge in obračanje materiala — 14.800 EUR letno
> Najbolj boleče brez številke: Plan, kapacitete in navodila — ocena 3/3, v poročilu za to ni nobenega zneska
> Prvo vprašanje: »Plan se vam pogosto podira, a tega niste izmerili — koliko ur na teden gre za ponovno planiranje?«
> Velikost posla: srednji posel · Priporočena licenca: Proizvodni modul MF

Prodajnik po 60 sekundah ve: koga kliče in da je klic zahtevan, katere številke ima
stranka pred sabo (v njeni obliki), kje je denar, kje je bolečina brez številke, s čim
začeti in zakaj mudi.

---

## 8. Vrstni red uvedbe

| Korak | Vsebina | Odvisnosti |
|---|---|---|
| 0 | Nastaviti `VITE_LEAD_WEBHOOK_URL` (odprta odločitev 4.8 — korenski pogoj, da dokument sploh pride k prodajniku) | CRM odločitev (README, odprta vprašanja) |
| 1 (PR1) | P0 signali: posvet (pas + 4. vrstica), sekvenca z oznakami, finančna osnova, popravek »Izmerjeno«, oznaka zanesljivosti, hero prek `formatAmount` | nič strukturnega |
| 2 (PR2) | skupni modul hero/payback, izpeljanke + povračilo, roki z datumi, glava razdelka 1, sortirana triaža, krajšanje 5, priloga v PDF, P2 ubeseditve | korak 1; posodobitev pet-h2 testa + README |
| 3 | kalibracija ubeseditev po prvih ~50 vnosih (skupaj z obstoječim opozorilom v `submitLead.ts:6-13`) | produkcija |

Merilo uspeha: prodajnik pred sestankom potrebuje samo prvo stran; nobena številka, ki jo
stranka izgovori iz svojega poročila, ga ne preseneti; noben podatek, ki ga je stranka
vnesla, ni izgubljen.
