# Pregled vprašalnika: STORITVE IN PROJEKTI

> **Namen.** Delovno navodilo za AI, ki bo izvedel popravke storitvenega vprašalnika v ROI
> kalkulatorju. Vsaka ugotovitev ima sodbo, težo, sklic `datoteka:vrstica` in konkreten predlog.
>
> **Repozitorij:** `/Users/janpavlic/Documents/Datalab/aplikacije/ROI kalkulator`
> ⚠️ Pot `/Users/janpavlic/Documents/Datalab/Claude code` je **zastarela kopija**. Med pripravo
> tega pregleda je bil del analize narejen na njej in ga je bilo treba zavreči — dve ugotovitvi
> sta bili ovrženi, ker sta bili v pravem drevesu že rešeni.
>
> **Raziskava:** `reports/GPT baza znanja/storitve/Storitvene_dejavnosti_deep_research.md` (951 vrstic)
> **Stanje kode:** 13. avgust 2026, `storitve.ts` nedotaknjen v delovnem drevesu.

---

## 0. Obseg in omejitve tega dokumenta

**Kaj je notri.** Ugotovitve, ki sem jih preveril neposredno v kodi pravega repozitorija, vsaka
s sklicem na vrstico, in vrzeli proti katalogu bolečin DC-01…DC-10 iz raziskave.

**Česa ni.** Načrtovani pregled z dvanajstimi agenti (šest pregledovalcev + šest skeptičnih
preverb po `NAVODILA-pregled-vprasalnika-po-dejavnosti.md`) **ni bil izveden** — prvi zagon je
padel na omejitvi seje brez enega samega rezultata, drugi je bil ustavljen. Zato tu **ni**:

- sodbe za vsako posamezno vprašanje (navodila zahtevajo tudi »ohrani« z utemeljitvijo);
- sistematičnega pregleda vseh petih horizontal z vidika storitev;
- neodvisne skeptične preverbe vsake trditve.

Ta dokument je torej **osnutek pregleda, ne dokončan pregled**. Ugotovitve so preverjene, niso
pa izčrpne. Preden se karkoli od tega izvede, velja pognati polni pregled po navodilih.

---

## 1. Preverjeno stanje segmenta

### 1.1 Sestava

| Del | Vsebina |
|---|---|
| Panožni moduli | `projekti_storitve` · `obracun_storitve` · `obseg_storitve` · `administracija_storitve` · `terjatve_storitve` |
| Horizontale | vseh pet: `analitikaHz` · `financeHz` · `kadriHz` · `dokumentiHz` · `servisHz` |
| Vedno | `diagnostika_storitve` · `E` (E samo strankam PANTHEON) |
| Triaža | `recommendedCount: 3`, privzeto `obracun_storitve`, `obseg_storitve`, `terjatve_storitve` |

Obiskovalec oceni **deset** področij v triaži, izmeri pa privzeto tri.

### 1.2 Korak 5 vpraša pet stvari

`contexts/storitve.ts`: strošek izvedbene ure (:87), strošek administrativne ure (:94),
zaračunana urna postavka (:101), **letni prihodki** (:108–120) in **prispevna marža** (:122–134).

### 1.3 Uporaba novejših zmožnosti sheme — storitve zaostajajo

| Zmožnost | maloprodaja | trgovina | splosno | **storitve** |
|---|---:|---:|---:|---:|
| `usesRevenue` / `usesMargin` | 4 | 1 | 1 | **0** |
| `allowUnknown` | 7 | 0 | 0 | **0** |
| `explainer` | — | — | — | 10 od 21 polj |

Maloprodaja je bila predelana po novi shemi, storitve niso. To je izvor več ugotovitev spodaj.

Polja **brez** `explainer` (in brez `help`): `overtimeHoursPerMonth`, `replanningHoursPerMonth`,
`timesheetHoursPerMonth`, `creditNoteCostEUR`, `projectAdminHoursPerMonth`, `dataFixHoursPerMonth`,
`penaltyCostEUR`.

---

## 2. Ugotovitve po teži

### U1 · `lostMarginEUR` je v napačnem košu — **premakni**, visoka

`storitve.ts:471–481` vpraša »izgubljeno prispevno maržo zaradi odpovedanih ali izgubljenih
projektov«, `storitve.ts:523–527` pa jo da v koš `directLoss`.

Koš `lostMargin` obstaja prav za to (`moduleTypes.ts:20–30`): komentar tam pravi, da je odpis
denar, ki je odtekel in ga je mogoče pokazati na kontu, izgubljena marža pa denar, ki ni nikoli
prišel, in stoji na predpostavki o vedenju kupca. Ker sta zdaj v istem košu, prvi ugovor
(»tega projekta morda tako ne bi dobili«) podre tudi dokazljivi del naslovnega zneska.

**Popravek:** `bucket: 'lostMargin'`. Ena vrstica.

**Pozor:** raziskava §11.4 pravi, da običajen prodajni izpad **ni** procesna izguba. Preveri,
ali polje sploh ostane — če ostane, mora biti vezano na zamudo kot vzrok (kar naslov modula
implicira), ne na izgubljene posle nasploh.

### U2 · Nezaračunana ura se vrednoti po polni ceni brez prispevne marže — **izboljsaj**, visoka

`storitve.ts:204–207`: `unbilledHoursPerMonth × chargeOutRateEUR × 12` → `directLoss`.

Raziskava §11.4 to izrecno prepoveduje: *»Pri dodatni povrnjeni uri se v ROI ne uporabi
avtomatsko polna prodajna cena. Če je delo že opravljeno in je neposredni strošek že nastal, je
inkrementalni učinek lahko visok; če mora podjetje dodatno zaposliti ali najeti izvajalca, je
relevantna samo prispevna marža.«*

Prispevno maržo korak 5 **že vpraša** (`contexts/storitve.ts:122–134`) in je na voljo v
`ComputeContext.contributionMarginRate`. Modul je ne uporablja in nima zastavice `usesMargin`.

**Popravek:** dodaj `usesMargin: true` na modul in v `compute()` uporabi maržo. Odloči se
zavestno med dvema branjema §11.4 in odločitev zapiši v komentar:
- **konservativno:** `ure × chargeOutRateEUR × contributionMarginRate × 12`
- **pogojno:** polna cena samo, kadar je delo že opravljeno in strošek že nastal (kar pri
  nezaračunanih urah drži) — tedaj ostane, kot je, a komentar mora to utemeljiti s sklicem na §11.4

Trenutno stanje je **neutemeljeno** v obe smeri: komentar na `storitve.ts:201–203` argumentira
polno ceno, a §11.4 ne omeni.

### U3 · Prihodek in marža sta vprašana, noben modul ju ne uporabi — **izboljsaj**, visoka

`grep usesRevenue|usesMargin src/config/modules/storitve.ts` → **nič**.

Posledica: obiskovalec odgovori na dve vprašanji v koraku 5, ki ne premakneta nobene številke.
Po `potential.ts` odgovor brez zastavice ne vstopa niti v oceno zanesljivosti — vprašanje je
torej čisti strošek za obiskovalca.

**Popravek:** hkrati z U2 in U5. Če se izkaže, da ju noben storitveni modul ne potrebuje, je
poštena poteza obratna — vprašanji iz koraka 5 za ta segment umakniti.

### U4 · `unbilledWipEUR` zliva WIP in terjatve v eno polje — **izboljsaj**, visoka

`storitve.ts:493–500`: »povprečna vrednost opravljenega, a še ne plačanega dela (nedokončano
delo **in** zapadle terjatve)«.

Raziskava §11.2 daje dve različni formuli, §11.4 pa izrecno pravi: *»WIP in terjatve sta ločeni
stanji.«* Gre za različna vzroka (počasen obračun proti počasnemu plačilu), različna lastnika
in različna ukrepa. Zliti v eno polje pomeni, da poročilo ne more povedati, kateri od obeh je
težava — kar je edino, kar iz tega zneska sledi ukrep.

Poleg tega storitve **ne obračunajo letnega stroška financiranja**: `RECEIVABLES_CAPITAL_COST`
iz `shared.ts` uporabljata `trgovina.ts` in `splosno.ts` (`dailyRevenue × dni × stopnja`),
storitve pa ne. Ker korak 5 zdaj vpraša letne prihodke, je ta izračun mogoč.

**Predlagana nova sestava modula** (`terjatve_storitve`, preimenovan v »Od izvedbe do denarja«):

| Polje | kind | enota | Izid |
|---|---|---|---|
| `billingLagDays` — koliko dni od zaključka dela ali potrjenega mejnika do izdaje računa | number | dni | `oneTimeCapital`: dnevni prihodek × dnevi × obranljiv delež skrajšanja |
| `overdueDaysAverage` — prekoračitev **nad** dogovorjenim rokom | number | dni | `directLoss`: dnevni prihodek × dnevi × `RECEIVABLES_CAPITAL_COST` |
| `penaltyCostEUR` — ostane, dodaj `allowUnknown` | number | EUR/leto | `directLoss` |
| `clientCommsHoursPerMonth` — ostane | number | h/mesec | `capacity` |
| `mainCause` | choice | — | naslovljivi delež |

Modul dobi `usesRevenue: true`. Odpadeta `unbilledWipEUR` in `reducibleShare` — nadomesti ju
`billingLagDays`, ki je konkretnejše vprašanje in ga podjetje pozna. Odpade tudi `lostMarginEUR`
(glej U1).

Help za `overdueDaysAverage` povzemi po precedensu `splosno.ts`: *financiranje dogovorjenega
roka je normalno poslovanje in ni strošek napake.*

### U5 · `fixedPriceSharePercent` je izklopljen, čeprav določa naravo izgube — **izboljsaj**, visoka

`storitve.ts:257–269`: `contextOnly: true`, `default: 0.5`, help pravi *»Podatek ne vstopa v
izračun«*.

Raziskava §6.2 in §6.3 prav v tem deležu vidita mejo med dvema vrstama izgube. Pri delu po
porabi bi bila presežena ura **zaračunljiva** — če ni zaračunana, je izgubljen prihodek. Pri
fiksni ceni ni bila nikoli zaračunljiva — je porabljena kapaciteta. `storitve.ts:309–315` pa
vse presežene ure vrednoti enotno po strošku.

**Popravek:** naj vstopi v izračun. Ura se **razdeli**, ne podvoji, zato pravilo »ena ura, en
koš« ostane:

```
directLoss: ure × (1 − fixedPriceShare) × chargeOutRateEUR × 12
capacity:   ure × fixedPriceShare × operationalHourCostEUR × 12
```

**Dve oviri, ki ju izvajalec mora nasloviti:**
1. `default: 0.5` bi ob vpisu ur sam ustvaril znesek brez uporabnikove potrditve. Ob vklopu v
   izračun mora privzetek postati konservativen (1,0 = vse fiksno = vse kapaciteta) ali polje
   dobiti `allowUnknown`.
2. Test `storitve.test.ts` (`'samo nezaračunane ure se vrednotijo po zaračunani postavki'`)
   trdi, da dvig zaračunane postavke premakne natanko eno postavko. Pravilo se spremeni v
   »nezaračunane ure **in** delež preseženih ur, ki bi bile pri delu po porabi zaračunljive«.
   Test popravi **namerno, z zapisanim razlogom** — ne relaksiraj ga tiho.

### U6 · Podvojen ključ `timesheetHoursPerMonth` v dveh področjih — **izboljsaj**, visoka

- `storitve.ts:166–173` — »naknadna rekonstrukcija, zbiranje in **potrjevanje evidence dela**«
- `horizontal.ts:263` — »zbiranje in urejanje **evidenc prisotnosti in delovnih ur**«

Ista beseda, isti ključ, oba v segmentu storitve, oba `capacity` po administrativni uri.
Obiskovalec, ki izbere obe področji, isto uro skoraj zagotovo vpiše dvakrat.

Raziskava §20.1 ločnico ponuja: **zakonska evidenca prisotnosti** (delodajalčeva obveznost) ni
isto kot **projektna časovnica** (podlaga za obračun). Nobeno od obeh besedil te ločnice ne
postavi.

**Popravek:**
- `obracun_storitve` → besedilo omeji na *evidenco ur po projektih in nalogah, ki je podlaga za
  račun*; dodaj `help`, ki izloči evidenco prisotnosti, in `explainer`.
- `kadriHz` → besedilo omeji na *prisotnost, dopuste in podlago za plačo*. Ker je horizontala v
  več segmentih, njeno besedilo **ne sme imenovati** sosednjega področja — meja mora biti
  izražena vsebinsko (»za plačo, ne za račun naročniku«).
- Ključa preimenuj, da razlika ni le v besedilu.

### U7 · Nobeno EUR polje nima `allowUnknown` — **izboljsaj**, srednja

Prizadeta polja: `creditNoteCostEUR` (:174), `writeOffEUR` (:292), `penaltyCostEUR` (:464),
`lostMarginEUR` (:471), `unbilledWipEUR` (:493).

Brez zastavice neznanje tiho postane potrjena ničla — obiskovalec, ki dobropisov ne vodi
ločeno, in tisti, ki jih nima, dasta isti odgovor. Prodajnik pri tem izgubi iztočnico iz
`unknownAnswers`. Maloprodaja ima `allowUnknown` na sedmih poljih; vzorec je torej postavljen.

### U8 · `servisHz` je v segmentu brez utemeljitve in z zavajajočim besedilom — **izboljsaj**, srednja

`segments.ts` ima za storitve komentar samo o `dokumentiHz`; za `servisHz` utemeljitve ni,
čeprav navodila (§ »Izpuščene horizontale so povsod utemeljene«) to pričakujejo.

Vsebinsko: `servisHz` meri servis *»po predaji izdelka, blaga ali projekta«* — torej poprodajni
rep. Za arhetipa ARC-08 (terenski servis) in ARC-07 (managed services) je servis **glavna
dejavnost**, ne rep. Tveganje: serviser svoje osnovne, zaračunljive ure vpiše v `servisHz` kot
kapaciteto, s čimer jih odšteje od `obracun_storitve` in znesek premakne v napačen koš.

**Popravek:** ali dopiši utemeljitev in zaostri besedilo (»samo delo, ki ga ne zaračunate
naročniku«), ali horizontalo iz segmenta izpusti in servis pokrij z novim področjem (glej §3).

### U9 · »Zamudne obresti« naštete v dveh horizontalah — **izboljsaj**, srednja

`horizontal.ts:188` (`financeHz.annualPenaltyEUR`) in `:394` (`dokumentiHz.annualDocDelayEUR`)
oba naštevajo zamudne obresti kot primer. Velja v vsakem segmentu, ki ima obe — storitve imajo.

**Popravek:** eno od besedil naj obresti izpusti, ali pa naj vsako izrecno omeji na svoj vzrok
(davčni obračun proti prepozno potrjenemu dokumentu).

### U10 · Modul E in ZIERDED sta vidna samo strankam PANTHEON — **izboljsaj**, srednja

`contexts/index.ts:58` (`isTechnicalRiskModuleVisible`) skrije modul E vsem, ki niso uporabniki
PANTHEON. Med tremi postavkami sta dve res PANTHEON-specifični (SQL Server, Windows Server),
tretja pa **ni**: obvezni e-računi od 1. 1. 2028 (ZIERDED, raziskava §20.1) veljajo za vsa
podjetja, vpisana v Poslovni register.

Posledica v `icp.ts`: dimenzija »Nujnost zaradi rokov« bere izključno odkljukane roke in
podjetju brez modula E dodeli 0,2 od 1,0. Pri uteži 0,10 to pomeni do 8 točk od 100, ki jih
ne-PANTHEON lead izgubi zaradi nečesa, česar mu nismo pokazali. Opomba v `icp.ts` na to sicer
opozarja, a ocene ne popravi.

**Popravek:** ZIERDED postavko prikaži vsem; SQL/Windows ostaneta pogojna. Ali pa `icp.ts`
nauči, da modul E ni bil prikazan, in dimenzijo v tem primeru izloči iz seštevka.

### U11 · Diagnostika ustvari oceni tveganja brez enega samega klika — **izboljsaj**, srednja

`storitve.ts:578–606`: privzetki 1, 1, 2, 1. Skozi `riskLevelFromScore` da to »srednje«
tveganje obiskovalcu, ki se koraka ni dotaknil — sodba o podjetju brez podatka o podjetju.

**Popravek:** dodaj možnost brez sodbe (npr. »Ne vem« kot privzetek), ki vrne stopnjo »ni
ocenjeno«, ali oceni ne izpiši, dokler se obiskovalec ne dotakne nobenega od štirih polj.

### U12 · `businessType` ne krmili ničesar — **izboljsaj**, visoka teža / velik strošek

`contexts/storitve.ts:40–49`: pet možnosti (fiksna cena, po porabi, vzdrževanje, po urah,
kombinirano). Odgovor gre v prodajno poročilo in CRM, v izračun, triažo ali izbiro modulov pa
ne vstopa nikjer.

Raziskava na modelu poslovanja gradi celotno segmentacijo (§3.1 sedem ekonomskih modelov, §5
dvanajst arhetipov, §5.1: mešano podjetje potrebuje več podmodelov). Svetovalna hiša in
terenski servis danes dobita identičen vprašalnik.

**⚠️ Zahteva zmožnost, ki je motor NIMA.** `ModuleDefinition` nima `showIf`; pogojni prikaz
modula glede na profil je nova zmožnost motorja. Precedens obstaja
(`isTechnicalRiskModuleVisible` filtrira modul E po `profile.currentSystem` v
`CalculatorFlow.tsx`), a je ozko namenski.

**Najcenejši del, ki ga je mogoče narediti brez nove zmožnosti:** naj `businessType` določi
`defaultIds` triaže. Terenskemu serviserju se privzeto obkljukajo druga tri področja kot
svetovalcu. `selectTopModules` že sprejme `preferred` — potrebna je samo preslikava model → ID-ji.

### U13 · Seznam sedanjih sistemov združuje PSA in projektno orodje — **izboljsaj**, srednja

`contexts/storitve.ts:66`: »Drug ERP ali projektno orodje«, pas 0,15–0,30. Raziskava §14 PSA,
ERP, projektno orodje in time tracking obravnava kot ločene zrelosti; §16.1 pa kot dejanski
status quo navaja *računovodski program + Excel + e-pošta + projektno orodje + ločen CRM +
ročne časovnice*. Podjetje na pravem PSA in podjetje na Jiri ob Excelu dobita isti pas.

**Popravek:** razdeli na »projektno orodje, povezano s financami in obračunom« (ožji pas) in
»projektno orodje ločeno od financ — ure se prepisujejo« (širši pas).

**Omejitev:** `icp.ts:197` normalizira `improvementBandMax` čez razpon **0,08–0,40** kot edini
medsegmentni primerjalnik. Novi pasovi morajo ostati znotraj te ovojnice, sicer storitveni leadi
sistematično dobijo višjo oceno »Priložnost« kot druge dejavnosti.

### U14 · Manjka vloga vodje izvedbe — **izboljsaj**, nizka

`contexts/storitve.ts:76–85` nima COO oziroma vodje izvedbe, ki ga raziskava §7 navaja kot
sponzorja nakupa. `icp.ts` ujema po `id.startsWith('vodja')`, zato dodajanje `vodjaIzvedbe`
ne zahteva sprememb v oceni.

### U15 · Vzrok »Potrjevanje poteka ročno« je kategorije `planning` — **izboljsaj**, nizka

`horizontal.ts:344`: kategorija `planning` (65 %), čeprav je ročni prenos dokumentov drugod
uvrščen kot `data` (75 %). Preveri notranje precedense v `addressableShare.ts` in poenoti.

### U16 · Triaža zahteva deset ocen pred prvo številko — **izboljsaj**, srednja

Obiskovalec oceni deset področij, preden vnese en sam podatek. To je najdražji korak
vprašalnika in mesto največjega osipa. Vsako novo področje ga podaljša.

**Popravek:** razmisli, ali naj `businessType` (U12) področja tudi **odvzame**, ne le doda —
čistemu svetovanju sta `servisHz` in morda `kadriHz` malo verjetni.

---

## 3. Pokritost kataloga bolečin DC-01…DC-10

| ID | Skupina | Pokritost | Kje |
|---|---|---|---|
| DC-01 | Capacity | **da** | `administracija_storitve` + `analitikaHz` |
| DC-02 | Utilization | **delno** | `projekti_storitve.idleHoursPerMonth` meri čakanje, **ne** benča (človek brez projekta) |
| DC-03 | Scope | **da** | `obseg_storitve` |
| DC-04 | Quality | **da** | `obseg_storitve.reworkHoursPerMonth` |
| DC-05 | Billing | **da** | `obracun_storitve` |
| DC-06 | Working capital | **delno** | `terjatve_storitve`, a WIP in terjatve zliti (U4) |
| DC-07 | **Field** | **ne** | — |
| DC-08 | **Contracts** | **ne** | — |
| DC-09 | **External spend** | **ne** | nadure delno v `projekti_storitve`; podizvajalcev ni |
| DC-10 | Risk | **da** | `diagnostika_storitve` + modul E |

---

## 4. Manjkajoča področja

### 4.1 Dodaj zdaj

**A. Terenski servis in posegi na lokaciji** (DC-07, ARC-08, §6.7)

Raziskava §1.2 to uvršča kot **prioriteto št. 1** za Datalab: Granula Servis na terenu je javno
potrjena funkcionalnost in najbolj neposreden produktni fit v celotni niši. Vprašalnik o tem
nima nobenega vprašanja.

| Polje | kind | enota | Izid |
|---|---|---|---|
| `repeatVisitsPerMonth` — ponovni obiski zaradi manjkajočega dela, napačnega tehnika ali nepopolne informacije | number | št./mesec | z naslednjim → `directLoss` |
| `costPerVisitEUR` — povprečen strošek enega izhoda (čas tehnika, vozilo, pot) | number | EUR | |
| `travelHoursPerMonth` — ure poti, ki bi jih odpravilo boljše razporejanje | number | h/mesec | `capacity` po izvedbeni uri |
| `uncapturedMaterialEUR` — material in deli, porabljeni na nalogih, a nikoli popisani | number | EUR/leto, `allowUnknown` | `directLoss` |
| `jobClosingMethod` — papirni nalog / telefon in naknadni vnos / mobilna aplikacija | choice | — | `contextOnly` |
| `mainCause` | choice | — | naslovljivi delež |

Benchmarka FTFR 71,9 % in »14 % nepotrebnih izhodov« (§10.3) **ne smeta** v formulo — raziskava
ju označuje kot diagnostično vprašanje, ne kot privzeto predpostavko. Sodita v `explainer`.

**Nujno:** ob tem področju mora `servisHz` iz segmenta ven (U8), sicer se ure tehnika štejejo
dvakrat. `plausibility.ts` tega ne ujame, ker sešteva samo polja z enoto `h/mesec` in `h/leto` —
zmnožek `repeatVisitsPerMonth × costPerVisitEUR` ji uide.

**B. Pogodbe, pavšali in ponavljajoči prihodki** (DC-08, ARC-07, §6.5–6.6)

| Polje | kind | enota | Izid |
|---|---|---|---|
| `overServicingHoursPerMonth` — ure nad vključenim obsegom pavšala, ki se ne zaračunajo | number | h/mesec | `directLoss` po zaračunani postavki |
| `missedIndexationEUR` — zamujena indeksacija, pozabljena podaljšanja, nezaračunane pogodbe | number | EUR/leto, `allowUnknown` | `directLoss` |
| `slaPenaltyEUR` — SLA penali in pogodbeni dobropisi | number | EUR/leto, `allowUnknown` | `directLoss` |
| `recurringBillingHoursPerMonth` — ročna priprava periodičnih računov | number | h/mesec | `capacity` |
| `contractScopeDocumented` — ali je vključeni obseg zapisan merljivo | choice | — | `contextOnly` |
| `mainCause` | choice | — | naslovljivi delež |

**Meja proti `obseg_storitve`** mora biti zapisana v `help` **obeh**: tu presežek na ponavljajoči
pogodbi, tam presežek na projektu.

### 4.2 Dodaj kmalu

**C. Podizvajalci in zunanji stroški** (DC-09, PROC-13). Eno polje zadostuje:
»Kolikšna je bila letna vrednost podizvajalskih stroškov, ki niso bili povezani s projektom ali
prefakturirani naročniku?« → `directLoss`, `allowUnknown`. Za ARC-04, ARC-06 in ARC-09 osrednja
izguba. Umesti v `projekti_storitve` (ima pet polj, meja je šest) ali v `obseg_storitve` po
umiku `fixedPriceSharePercent`.

**D. Natančnost ocen** (PROC-02, KPI `estimate accuracy`). »Za koliko odstotkov projekti v
povprečju presežejo prvotno oceno ur?« Naj bo **`contextOnly`** — ure presežka že merita
`overrunHoursPerMonth` in `reworkHoursPerMonth`, zato bi vstop v formulo isto uro štel dvakrat.
Hkrati dodaj vzrok `{ label: 'Ocena ur je bila prenizka', category: 'data' }` v `OBSEG_CAUSES`.

### 4.3 NE dodajaj zdaj

**E. Urni strop iz §11.4 — že rešeno.** `plausibility.ts` iz števila zaposlenih izpelje mehko
mejo: `HOURS_PER_EMPLOYEE_PER_MONTH = 160`, `PLAUSIBLE_CAPACITY_SHARE = 0,4`, opozorilo brez
blokade, deljeno med vprašalnikom in prodajno pripravo. Predlog »dodajmo kontrolo razpoložljivih
ur« bi podvojil obstoječo zmožnost. Edini smiseln popravek je razširitev na zmnožke dveh polj
(glej A).

**F. Izkoriščenost in bench kot samostojno področje** (DC-02, benchmark 68,9 %). Mikavno, a
raziskava §11.4 prepoveduje pretvorbo sproščenih ur v prihodek brez dokazane omejitve kapacitete
**in** povpraševanja. Brez tega dokaza bi področje proizvedlo največjo in najmanj obranljivo
številko v celotnem izračunu. Bench raje pokrij z enim poljem v `projekti_storitve` in ga vodi v
`capacity`, ne v `directLoss`.

**G. Benchmark proti vrstnikom v strankinem poročilu.** `segments.ts` ga izrecno odlaga v FAZO 2
kot pravno neopredeljenega. Izpeljano izkoriščenost in realizirano postavko je smiselno pokazati
**samo v prodajnem poročilu za svetovalca**, z navedbo vira, leta in vzorca ter opozorilom, da je
vzorec pretežno severnoameriški.

**H. Trda omejitev rezultata z deležem prihodkov.** Prihodek je zdaj v `ComputeContext`, zato je
tehnično izvedljiva — a raziskava nobenega praga ne daje, `range.ts` pa rezultat že izraža kot
scenarijski pas namesto ene točke. Dodatna trda omejitev z izmišljenim pragom bi bila lažna
natančnost. Najprej U2–U4, nato meri, ali se sploh pojavljajo neverjetni zneski.

---

## 5. Kaj je bil ta pregled prisiljen ovreči

| Ugotovitev iz zgodnejše analize | Zakaj je padla |
|---|---|
| »Dodaj letne prihodke in prispevno maržo v korak 5« | Že vgrajena: `contexts/storitve.ts:108–134`, `ComputeContext.annualRevenueEUR` in `contributionMarginRate` |
| »Dodaj kontrolo razpoložljivih ur iz §11.4« | Že vgrajena: `plausibility.ts`, 160 h/zaposlenega, prag 40 % |
| »Rezultat je ena številka, dodaj scenarije« | Že vgrajeno: `range.ts` računa nizek in visok scenarij iz `min`/`max` razponov |

Vzorec je enoten: **koda je bila boljša od spomina**, ker je bila analiza narejena na zastareli
kopiji. Vsak nadaljnji pregledovalec naj najprej preveri stanje in šele nato predlaga.

---

## 6. Trda pravila, ki jih noben popravek ne sme kršiti

1. Prihranek časa ni prihranek plače — sproščene ure niso denar, ki ga podjetje dobi nazaj.
2. Prihodek ni korist — pri dodatni prodaji je korist prispevna marža.
3. Sprostitev kapitala je enkratna; `oneTimeCapital` se nikoli ne sešteva z letnimi zneski.
4. Tveganje se ne monetizira; koš `risk` nima EUR.
5. Ista ura ali evro ne smeta v dve področji.
6. Ni lažne natančnosti — jamstvo aplikacije je »nobene številke si nismo izmislili«.
7. **Posebnost storitev:** ura gre **ali** med nezaračunane (`directLoss`, po zaračunani
   postavki) **ali** med interne in presežene (`capacity`, po strošku ure). Nikoli oboje.
   Edina dovoljena izjema je **delitev** ure po deležu (U5), ne podvojitev.

**Shema:** vrednosti so števila · `percent` je ulomek · vrednosti izbir so **zaporedni indeksi**
· `compute()` vrne dejanski sedanji strošek · vsako polje s `help` mora imeti `explainer`
(`explainers.test.ts`) · moduli imajo 5–6 polj z `mainCauseField` na koncu · **`showIf` ne
obstaja** · novi stolpci v `exportRecord.ts` gredo na konec · nov modul zahteva vnos v
`content/methodology.ts` in `content/actions/actions.ts`.

---

## 7. Predlagan vrstni red izvedbe

| Korak | Kaj | Strošek | Učinek |
|---|---|---|---|
| 1 | **U1** — `lostMarginEUR` v koš `lostMargin` | ena vrstica | znesek se brani pred ugovorom |
| 2 | **U7** — `allowUnknown` na pet EUR polj | pet vrstic | konec tihih ničel |
| 3 | **U9, U15, U14** — podvojene obresti, kategorija vzroka, vloga | drobno | kakovost podatkov |
| 4 | **U6** — razmejitev `timesheetHoursPerMonth` | besedila + ključa | odpravi najverjetnejše dvojno štetje |
| 5 | **U2, U3** — prispevna marža v `obracun_storitve` | formula + test | uskladi z §11.4 |
| 6 | **U4** — razdelitev WIP in terjatev | predelan modul | dva ukrepa namesto ene meglene številke |
| 7 | **U5** — delež fiksnih cen v izračun | formula + test + privzetek | pravilna narava izgube |
| 8 | **U10, U11, U13, U16** — ZIERDED, diagnostika, sistemi, triaža | srednje | verodostojnost in ICP |
| 9 | **4.1 A + B** — terenski servis in pogodbe | dva nova modula + vsebina | pokrijeta DC-07 in DC-08 |
| 10 | **U12** — poslovni model kot krmilnik | nova zmožnost motorja | odloči šele po 9 |

Koraki 1–4 so poceni in takoj vidni. Koraki 5–7 spremenijo številko in zahtevajo namerne
popravke testov. Koraka 9–10 sta nova gradnja.

---

## 8. Kaj je treba še pregledati

Ta dokument **ni** nadomestilo za polni pregled po
`NAVODILA-pregled-vprasalnika-po-dejavnosti.md`. Manjka:

- sodba za vsako posamezno vprašanje, tudi za dobra (»ohrani« z utemeljitvijo) — brez tega ni
  merila, česa se ne sme spreminjati;
- sistematičen pregled vseh petih horizontal z vidika storitev (~30 sodb); tu so pokrite tri
  točke od petih modulov;
- skeptična preverba vsake trditve z neodvisnim bralcem — pri proizvodnji je od 115 sodb
  popravila 94 in ovrgla 3;
- pregled besedil `content/methodology.ts` in `content/actions/actions.ts` glede na predlagane
  spremembe formul;
- pregled `salesReport.ts` in `salesPlaybook.ts`: kam gredo `contextOnly` odgovori tega segmenta
  in ali kateri od njih nima ne prodajne ne diagnostične vrednosti.

Polni pregled zaženi po §8 navodil, a s **ciljanim branjem**: prvi poskus je padel, ker je vseh
šest agentov dobilo ukaz prebrati istih osem datotek in celotno 951-vrstično raziskavo.
