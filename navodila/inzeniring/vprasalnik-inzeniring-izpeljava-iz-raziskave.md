# Vprašalnik za inženiring — izpeljava iz raziskave panoge

Vir: `~/Documents/Datalab/research/files/Datalab_raziskava_INZENIRING_model.xlsx` (presek 7. 9. 2026,
"Inženiring in izvedba na ključ"). Koda: `src/config/modules/inzeniring.ts`, `src/config/contexts/inzeniring.ts`,
`src/config/copy/inzeniring.ts`, vnos v `src/config/segments.ts`. Ta dokument pove, kateri list raziskave je
odločil o kateri izbiri, da je vsako vprašanje sledljivo do vira in da se ob naslednji različici raziskave ve,
kaj preveriti.

## 1. Osrednja teza in kaj iz nje sledi

List `Naslovnica`: 61 podjetij na seznamu, segment A (20+ zaposlenih) 9 podjetij z mediano 26 zaposlenih in
6,7 mio EUR prihodkov; **279.000 EUR prihodkov na zaposlenega**, enkrat več kot pri kovinarjih. "To niso
projektantski biroji, ampak podjetja, ki skozi svoje knjige prevaljajo veliko opreme in podizvajalcev. Sporočilo
zato ne sme govoriti o urah projektantov, ampak o marži projekta na ključ, o fazah in o opremi, vezani na projekt."

Iz tega sledijo tri odločitve, ki inženiring ločijo od segmenta `storitve`:

1. **Brez zaračunane urne postavke.** Storitve so edina dejavnost, ki uro vrednoti po ceni. Inženiring ne prodaja
   ur, ampak projekte; nezaračunano delo je zato vprašano v evrih po ponudbeni vrednosti (dodatna dela brez aneksa,
   neobračunani servisni posegi) in gre v koš `directLoss`, vse interne ure pa v koš `capacity` po strošku ure.
   Test v `inzeniring.test.ts` drži, da sprememba `chargeOutRateEUR` ne premakne nobenega izida.
2. **Letna vrednost projektov namesto prihodka od storitev.** Vprašanje izrecno vključuje opremo in podizvajalce,
   ki gredo skozi račune, ker je to osnova, ki jo podjetje do situacije predfinancira.
3. **Marže ne vprašamo.** Noben modul je ne bere; vprašanje brez učinka na rezultat bi vprašalnik samo podaljšalo
   (isto načelo kot pri živilstvu). Prodajnik maržo po projektu odpre na sestanku (list `Vprasalnik`, Q26).

## 2. Bolečina → modul → polje → koš

List `Katalog_bolecin` (prednost = frekvenca + učinek + fit) in list `Kalkulator` (sedem vprašanj za lead magnet).
Vrstni red modulov je vrstni red prednosti; prva tri so privzeto označena v triaži.

| Bolečina (prednost) | Modul | Polje | Koš × postavka |
|---|---|---|---|
| B01 Ure inženirjev niso pripisane projektu (15) | `marza_inzeniring` | `timesheetReconstructionHoursPerMonth`; diagnostika `hoursPerProject` | capacity × administrativna |
| B07 Kalkulacija se ne primerja z realizacijo (13) | `marza_inzeniring` | `overrunHoursPerMonth`; `postCalcPractice` (contextOnly) | capacity × inženirska |
| B08 Nedokončana proizvodnja ročno (12), B23 plače brez projekta (10) | `marza_inzeniring` | `marginTrackingHoursPerMonth`; `daysToKnownMargin` (contextOnly, K02) | capacity × administrativna |
| B02 Spremembe obsega pred aneksom (14) | `aneksi_inzeniring` | `unbilledChangeWorkEUR`; `changeDocumentationHoursPerMonth`; `changeApprovalTiming` (contextOnly); diagnostika `changeApprovedBefore` | directLoss (EUR po ponudbi); capacity × administrativna |
| B14 Ponudbe iz starih datotek (12) | `aneksi_inzeniring` | `quoteHoursPerMonth` | capacity × administrativna |
| B03 Oprema projekta A na projektu B (14) | `oprema_inzeniring` | `orphanEquipmentStockEUR` × `reducibleShare`; diagnostika `equipmentPerProject` | oneTimeCapital |
| B05 Dobavni roki brez terminskega plana (13) | `oprema_inzeniring` | `urgentDeliveryCostEUR`; `siteWaitingHoursPerMonth` | directLoss; capacity × inženirska |
| B10 Podizvajalci brez enotne evidence (12), B19 nabava mimo pogodb (11) | `oprema_inzeniring` | `procurementCoordinationHoursPerMonth` | capacity × administrativna |
| B04 Zaključek faze in račun nista povezana (14) | `obracun_inzeniring` | `phaseInvoiceLagDays` → `prihodek / 365 × dni × strošek financiranja`; `billingTrigger` (contextOnly) | directLoss |
| B12 Trenutek opravljene storitve za DDV (12) | `obracun_inzeniring` | v pojasnilu polja `phaseInvoiceLagDays` in v alineji PANTHEON | — |
| B13 Zadržki in garancije brez opomnikov (12) | `obracun_inzeniring` | `retentionOverdueEUR` | oneTimeCapital, 100 % |
| B20 Vzdrževalne pogodbe se ne obračunavajo (11) | `obracun_inzeniring` | `unbilledServiceEUR`; `phaseBillingHoursPerMonth` | directLoss; capacity × administrativna |
| B09 Dokumentacija razpršena (13) | `dokumentacija_inzeniring` | `docSearchHoursPerMonth`; `docStorage` (contextOnly) | capacity × inženirska |
| B15 Reference za razpise (11) | `dokumentacija_inzeniring` | `tenderDocHoursPerMonth` | capacity × administrativna |
| B16 Meritve in CE dokumentacija ločeno (11) | `dokumentacija_inzeniring` | `handoverDocHoursPerMonth` | capacity × inženirska |
| B24 Teren brez dostopa do podatkov (11) | `dokumentacija_inzeniring` | `fieldCallsHoursPerMonth` | capacity × inženirska |
| B17 Znanje pri enem inženirju (12) | diagnostika | `keyPersonIndependence` | tveganje, brez EUR |

Vprašanje 3 z lista `Kalkulator` ("Ali veste, koliko ur je posamezen inženir porabil za posamezen projekt?",
hipoteza H02: najmočnejši kvalifikacijski filter) je prvo vprašanje diagnostike in ne evrsko polje: kjer podjetje
tega ne ve, natančnega zneska ni mogoče izračunati — in prav to je ugotovitev.

## 3. Kaj namenoma ni izmerjeno

- **B06 garancijski stroški po prevzemu in B11 rezervni deli** — meri jih horizontala `servisHz` (garancijske ure
  po inženirski uri, deli in zunanji servis v evrih). Panožni modul meri samo prihodek, ki ni bil zaračunan;
  strošek in prihodek nista isti evro. Načrtovana zaloga rezervnih delov ostane neizmerjena (podštevanje je
  boljše od dvojnega štetja z `orphanEquipmentStockEUR`).
- **B18 poročila za naročnika in banko** — `analitikaHz`; `marginTrackingHoursPerMonth` meri samo stanje
  posameznega projekta (razmejitev v `help`).
- **B21 nepovezani programi, B22 terminski plan brez stroškov** — kontekstna vprašanja (`currentSystem`,
  `postCalcPractice`), ne evri: posledice merijo druga polja.
- **B25 e-račun 2028** — modul `E` (samo obstoječim uporabnikom PANTHEON) in horizontala `financeHz`.
- **`dokumentiHz` je izključena**: potrjevanje, iskanje in pošiljanje dokumentov v inženiringu JE projektna
  dokumentacija, ki jo meri `dokumentacija_inzeniring` — ista logika kot pri logistiki. `servisHz`, `analitikaHz`,
  `financeHz` in `kadriHz` ostanejo; razmejitev do `kadriHz` (prisotnost in podlaga za plačo proti razporejanju ur
  na projekt) je v `help` polja `timesheetReconstructionHoursPerMonth`.

## 4. Kontekst

- **Poslovni model** (list `Segmenti`, S1–S6): projektiranje brez izvedbe (S1, S2), energetika na ključ (S3),
  industrija na ključ (S4), inženiring s servisom (S5), skupina družb (S6). Prodajniku pove, ali gre pogovor o urah
  (biro) ali o opremi in fazah.
- **Sedanji sistem** (list `Arhetipi`): PANTHEON s projekti / brez projektov / drug ERP / računovodski program +
  projektni Excel (arhetip A2 "delni digitalizator") / Excel in papir (A1). Vrzeli 0,08–0,40 so znotraj ovojnice
  ocene ICP.
- **Vloga**: hipoteza H07 (tehnični direktor je pogosto močnejši prvi stik) dobi lastno vlogo `vodjaTehnike`; v
  oceni ICP se ujame po predponi `vodja`.
- **Inženirska ura 30 EUR/h**: košarica SKP-08 2141, 2144, 2149, 3115, 3122, 7233 (sredina po hišni metodi
  29,4); pasovi isti kot pri storitvah; izpeljava v `docs/urne-postavke.md`. List `Predpostavke` (A04: 32 / 38 / 45) vključuje režijo, ki je kalkulator namenoma ne
  šteje, zato je privzetek nižji.
- **Letna vrednost projektov**: pasovi do 2 · 2–5 · 5–12 · nad 12 mio EUR okrog mediane segmenta A (6,7 mio);
  privzetek 0, ker si prometa ne izmišljamo — brez odgovora je denar v fazah brez računa 0 EUR.
- **Strošek financiranja 8,5 %**: isti pasovi kot trgovina in logistika.
- **Prag visoke izgube 20.000 EUR** (ocena ICP): med storitvami (15.000) in trgovino (20.000), ker izguba ni samo v
  urah — 7 mio EUR × 20 dni × 8,5 % je samo po sebi ~33.000. KALIBRACIJA po prvih ~50 vnosih.

## 5. Hipoteze raziskave, ki jih vprašalnik lahko preveri

| Hipoteza | Kje jo vprašalnik ujame |
|---|---|
| H02 vprašanje o urah po projektu je najmočnejši filter | diagnostika `hoursPerProject`; triaža `marza_inzeniring` |
| H03 aneksi so večji vir izgube marže kot prekoračitve ur | `unbilledChangeWorkEUR` proti `overrunHoursPerMonth` × inženirska ura |
| H05 servisni ponavljajoči prihodek je neizkoriščen | `unbilledServiceEUR`; poslovni model `servis` |
| H07 tehnični direktor kot prvi stik | vloga `vodjaTehnike` v izvozu |
| H11 podjetja z več kot 5 hkratnimi projekti imajo najvišji ROI | letna vrednost projektov v izvozu (število projektov se ne vpraša) |
| G09 delež projektov z aneksom (raziskovalna vrzel) | `changeApprovalTiming`; `unbilledChangeWorkEUR` |

## 6. Kaj preveriti ob naslednji različici raziskave

- Ali list `Katalog_bolecin` še postavlja B01–B05 na vrh; če se vrstni red spremeni, se spremeni vrstni red
  modulov in s tem privzete tri v triaži.
- Ali prihodek na zaposlenega še upravičuje osnovo "celotna vrednost projektov" pri zamiku računa.
- Ali `PANTHEON_zemljevid` še označuje projektno stroškovno mesto, evidenco ur po projektu, zalogo po projektu in
  ponavljajoče fakturiranje kot javno potrjene (A) — alineje "PANTHEON naslavlja" stojijo na tem.
