# Pregled celotne aplikacije — hrošči in robni primeri

Datum: 3. 9. 2026 · Veja: `prenova-prodajne-priprave` (z neuveljavljenimi spremembami v delovnem drevesu)

Obseg: celoten tok (dejavnost → zaposleni → kontekst → triaža → finančna osnova → vnosi → obrazec → rezultati), motor izračuna, vsi moduli in konteksti, ocena zanesljivosti, razpon, PDF-ja, prodajna priprava (HTML + PDF), dostava leada, Apps Script zbiralnik, shramba napredka, zgodovina brskalnika, analitika.

Preverjeno: `tsc -b` brez napak, `oxlint` brez opozoril, 689 od 690 testov uspešnih (en padec je časovna omejitev ob vzporednem nalaganju jsPDF; v izolaciji uspe). Sume iz branja sem potrdil z začasnim testom, ki je bil nato odstranjen. **V aplikacijo ni bilo poseženo** — samo to poročilo.

Razvrstitev: **A** = lahko izgubi lead ali prodaji pošlje napačne podatke · **B** = obiskovalec vidi napačen ali zavajajoč rezultat · **C** = robni primer, kozmetika, dokumentacija.

---

## A — izguba leada ali napačni podatki pri prodaji

### A1. Če prodajna priprava pade, se lead tiho izgubi — POPRAVLJENO 3. 9. 2026

> Popravek (delovno drevo, `src/lib/deliverLead.ts`): časovni žig nastane enkrat, zapis in prilogi ne vise več na pripravi; ob izjemi v `buildSalesReport` ali v izrisu HTML gre oddaja na webhook z zapisom in strankinim PDF-jem, `salesReportHtml` je prazen niz (sprejemnik ga preskoči), dogodek `lm10_delivery_ok` nosi `salesReport: da/ne`, napaka gre v `console.warn`. Test `deliverLead.test.ts` je prej to vedenje zapisoval kot pričakovano — zdaj zahteva nasprotno.

`src/lib/deliverLead.ts:232-261` ujame izjemo iz `buildSalesReport` in nadaljuje, a dostava je pogojena z `webhookUrl && report` (`:270`). Ob napaki v pripravi se torej webhook sploh ne pokliče, `lm10_delivery_failed` se ne sproži, rezervni gumb se ne prikaže, obiskovalec pa pristane na rezultatih, kot da je oddal. Komentar v `catch` trdi nasprotno („oddaja je vseeno opravljena"). Izvozni zapis (`buildLeadExportRecord`) od priprave ni odvisen razen časovnega žiga.

Kdaj se to zgodi: vsaka izjema v `salesReport.ts` / `salesPlaybook.ts` / `icp.ts` — na primer obnovljena seja s profilom brez novega obveznega polja (glej C6: `profile.roleOther.trim()` v `salesReport.ts:562`).

### A2. Uspeh dostave se sklepa samo iz HTTP statusa, telo se ne bere

`src/lib/submitLead.ts:141` preveri `response.ok`, odgovora `{ ok: true }` (`tools/google-sheet/Koda.gs:346`) pa ne razčleni. Zbiralnik gradi na načelu, da vržena izjema pomeni neuspelo dostavo (`Koda.gs:19-21`, `:271-284`, `:344`). Apps Script pa ob neujeti izjemi v `doPost` praviloma vrne **HTTP 200 s HTML stranjo z napako**. Če to drži, aplikacija ob napačnem žetonu, praznem telesu ali neuspelem shranjevanju priprave šteje dostavo za uspešno: priprava ne gre ne stranki ne na Drive.

Preveri: pošlji oddajo z napačnim `?zeton=` in poglej, ali je `response.ok` `true`. Če je, je varovalo samo v branju telesa.

### A3. Menjava dejavnosti se uveljavi takoj, potrdi jo šele „Naprej" — brskalnikov „Nazaj" jo obide

`src/components/Calculator/StepIndustry.tsx:108` in `CalculatorFlow.tsx:748` zapišeta izbrano dejavnost v stanje ob vsaki spremembi spustnega seznama; brisanje odgovorov in potrditev segmenta (`committedSegmentId`) se zgodita šele ob „Naprej" (`CalculatorFlow.tsx:750-759`).

Pot: z vnosov „spremeni dejavnost" (`:895`, potisne vnos v zgodovino) → zamenjaj dejavnost → brskalnikov „Nazaj" ali gib swipe back. Rezultat je mešano stanje: nov segment (moduli, kontekst, logotip, koraki) z odgovori, triažnimi ocenami in **profilom starega** (urne postavke druge panoge, `currentSystem` z id-jem, ki ga nov kontekst ne pozna → modul E skrit, `systemGapFor` na rezervo). `saveProgress` to shrani, po osvežitvi je stanje trajno. Do rezultatov in oddaje pride s podatki dveh dejavnosti hkrati.

### A4. Po oddaji `submitted`, `lead` in `salesReport` preživijo menjavo segmenta

`CalculatorFlow.tsx:750-759` ob menjavi segmenta pobriše odgovore, ne pa `submitted`, `lead` in `salesReport`. Kdor po oddaji zamenja dejavnost in izpolni nov vprašalnik, pride po `goNext` (`:432`) naravnost na rezultate brez nove oddaje:

- prodaja ima v listu in v obvestilu lead **stare** dejavnosti;
- gumb „Priprava v PDF" (kadar je prikazan) prenese pripravo stare dejavnosti (`:937`, posnetek ob oddaji);
- strankin PDF nosi novo dejavnost.

Milejša oblika istega: popravek številk po oddaji („Nazaj na vnos") → strankin PDF je iz trenutnega stanja (namenoma), vrstica v listu, priprava na Drive in e-obvestilo pa ostanejo stari. Nikjer ni sledi, da se je izračun po oddaji spremenil; svetovalec pride na sestanek z drugimi številkami, kot jih ima stranka.

---

## B — napačen ali zavajajoč rezultat za obiskovalca

### B1. Pika kot ločilo tisočic

`src/lib/numberInput.ts:24` zamenja samo vejico. Potrjeno:

| Vnos | Prebere se kot |
|---|---|
| `2.000.000` | `null` → prihodek 0, polje se ob izhodu izprazni |
| `1.500` | `1,5` |
| `2 000 000` | `2000000` |

Pri prihodku to pomeni: vse odstotkovne postavke so 0, zanesljivost pade na „nizko" z razlogom „prihodka niste vnesli", opombe „Polje je prazno" pa pri prihodku ni (`StepCostBasis.tsx:398`, ker prihodek nima povprečja). Placeholder namiguje presledke, slovenski uporabnik tipka pike.

### B2. Vnaprej označen „Ne vem" šteje kot izrecen odgovor obiskovalca

`src/config/modules/shared.ts:154` (`reducibleShare`, privzetek 4 = „Ne vem", `unknown: true`), `maloprodaja.ts:99` (`substitutionShare`) in `:133` (`stockoutDemandShare`). Radio je označen že ob prvem izrisu, obiskovalec ga ni kliknil, a:

- `src/lib/potential.ts:213` ga šteje v `unknownAnswers` → modul z zalogami (šest dejavnosti) in `razpolozljivostMp` **nikoli ne dosežeta „visoke" zanesljivosti**, tudi če je vse ostalo vneseno;
- `src/lib/confidenceReason.ts:63` izpiše „enkrat ste odgovorili z „Ne vem"" — potrjeno tudi za modul, ki ga obiskovalec sploh ni odprl;
- `src/lib/salesPlaybook.ts:99-104` sestavi iztočnico „Odgovorili so „Ne vem"" in `:174-181` prispeva k ugovoru `noData`.

Pri diagnostiki (`ASSURANCE_CHOICES`, `shared.ts:54-68`) je isti problem zavestno preprečen; pri teh treh poljih ni.

### B3. Razlog nizke zanesljivosti našteva polja modulov, ki jih obiskovalec ni izpolnil

`src/lib/confidenceReason.ts:58-69` gre čez vse aktivne module, `assessConfidence` (`potential.ts:198`) pa neizpolnjene namenoma preskoči. Potrjeno: tri izbrana področja, eno izpolnjeno → „7 številskih polj je ostalo praznih in štejejo kot 0; dve izbirni vprašanji ste pustili brez odgovora; enkrat ste odgovorili z „Ne vem"". Ista področja so hkrati našteta v „Česa nismo izmerili". Isto v prodajni pripravi (`salesReport.ts:589-591`, `:1001-1027`).

### B4. Manjkajoč prihodek zniža oceno na ravni modula, ne postavke

`src/lib/potential.ts:86-93` in `:253`. Logistično podjetje, ki račun izda isti dan (`invoiceLagDays` = 0, kot veleva `help`), vse ostalo vnese, prihodka pa ne: zanesljivost „nizka", zneski „najmanj", razlog „prihodka niste vnesli, zato postavke, vezane nanj, štejejo 0" — čeprav je ta postavka 0 zaradi vnosa in ne zaradi prihodka. Potrjeno. Enako pri terjatvah z 0 dnevi prekoračitve in pri `marzeMp` z 0 deležem napačnih cen.

### B5. Področje s samo izbranim vzrokom ali pobrisanim drsnikom velja za „izmerjeno"

`src/lib/moduleEngine.ts:222-234`: `value !== field.default` velja tudi za izbirna polja. Klik na „Kaj je glavni vzrok?" brez ene številke → modul „izmerjen" z 0 EUR: izpade iz „Česa nismo izmerili", pokritost ga šteje, v pripravi je „izmerjeno — 0 EUR". Potrjeno.

Enako brisanje drsnika: `ModuleInput.tsx:166` ob praznem polju odda 0, tudi pod `min` (`napake.costPerErrorEUR` min 5, `zajemRs.minutesPerManualDocument` min 0,5) → shranjena 0, drsnik kaže `min`, modul „izmerjen", postavka 0.

### B6. Interni način `?debug=1` je dosegljiv vsakomur

`src/App.tsx:21`. Kdor doda parameter, ob delujočem webhooku dobi gumb za interno pripravo (ICP pas, „nizka ustreznost", ugovori). README trdi, da ga obiskovalec „po nesreči ne vklopi" — ovire ni nobene.

### B7. `og:description` še obljublja „brez vnosa e-naslova"

`index.html:33`. Obrazec je od 3. 9. pred rezultati; `meta description` in `landingOffer` sta popravljena, predogledna kartica na LinkedInu in v e-pošti pa obljublja nasprotno.

### B8. Osnovna pot `/leadmagnetdl2/` proti dokumentaciji `/leadmagnetdl/`

`vite.config.ts:89` proti `README.md:40,567`, `.env.example:12`, `EmailGate.tsx:15`. Če je repozitorijska spremenljivka `VITE_PUBLIC_URL` nastavljena po vzorcu, `canonical`, `og:url` in `og:image` kažejo na pot, kjer aplikacije ni. Preveri `vars` v GitHubu.

### B9. Ogledalo strankinega poročila v pripravi ne kaže istega zapisa

`src/lib/salesReport.ts:882` uporablja `toFixed(1)` → „+3.4 strank", stranka vidi „3,4" (`pdf.ts:374-378` to izrecno popravlja, `HeroBand.tsx:99` prav tako). Razdelek „Kaj stranka gleda v svojem poročilu" torej pokaže obliko, ki je stranka ni videla.

### B10. Zaslon in PDF se razhajata pri kartici neposrednih stroškov

`ResultsSummary.tsx:47-51` kartico vedno izriše (tudi „ni izmerjeno" ali „45 EUR"), `pdf.ts:597` jo skrije pod `MIN_FIGURE_EUR`. Komentar v `format.ts:47-52` prav tako razhajanje razglaša za napako, ki je bila odpravljena.

---

## C — robni primeri, kozmetika, dokumentacija

### C1. Rok webhooka proti dejanskemu delu skripte

Aplikacija čaka do ≈ 12,6 s s prilogama (`submitLead.ts:88-95`), skripta pa pred odgovorom opravi: hladni zagon, Drive, vrstico, AC (do 4,5 s, `Koda.gs:1645`), **pošto z dvema prilogama** (`:322-323`) in ob sočasni oddaji čaka ključavnico do 30 s (`:289`). Ob prekoračitvi aplikacija šteje dostavo za neuspelo in pripravo ponudi stranki — čeprav sta vrstica in obvestilo že tam. Interni dokument gre stranki brez potrebe.

### C2. `daysUntil` reže datum iz UTC, ostali deli iz lokalnega časa

`src/config/icp.ts:176` in `salesReport.ts:786` režeta `generatedAtISO` (UTC iz `toISOString()`). Med polnočjo in 2. uro po poletnem času je „danes" včerajšnji dan → dnevi do roka ±1, „poteče danes" na napačen dan. `deadlines.ts:62` za strankin PDF uporablja lokalni datum, zato se dokumenta ob polnoči na dan roka o istem roku lahko razhajata.

### C3. Obrazec se ob „Nazaj" izprazni

`EmailGate.tsx:68-79` drži polja v lokalnem stanju. Kdor gre popravit številko in se vrne, vpiše vseh šest polj znova.

### C4. „Nazaj" po „Izračunaj še to" pelje nazaj na rezultate

`CalculatorFlow.tsx:918-925` potisne stran področja v zgodovino; če je to prva stran vnosov, „Nazaj" (`:889` → `history.back()`) pristane na rezultatih in ne na finančni osnovi. Skladno z zgodovino, neskladno z linearnim čarovnikom.

### C5. Tipkanje „0" polje takoj izprazni

`NumberField.tsx:64-70` prepiše niz ob tuji spremembi; `ModuleInput.tsx:161`, `StepCostBasis.tsx:212,353` in `StepEmployeeCount.tsx:68` vrednost 0 preslikajo v `null`. Vtipkana „0" izgine; „0,5" je mogoče vpisati samo zato, ker sama vejica vrne `null`. Kozmetika, a zmede.

### C6. `readProgress` ne preverja oblike polj — nova obvezna polja brez dviga `SCHEMA_VERSION` podrejo obnovljeno sejo

`progressStorage.ts:79-107` preverja le različico in ovojnico. Novo obvezno polje profila (kot sta bila `roleOther`, `capitalCostRate`) ob objavi brez dviga različice pomeni, da obnovljena seja pade (`profile.roleOther.trim()` v `salesReport.ts:562` → izjema → **A1**, lead tiho izgubljen). Velja samo za zavihke, odprte čez objavo.

### C7. `lm10_results_view` se ob osvežitvi rezultatov šteje znova

`CalculatorFlow.tsx:621-632`: `resultsSeen` je `ref`, ne del shrambe.

### C8. Kontekstna polja se izpišejo kot vhod formule

`Breakdown.tsx:21` izloči samo `mainCause`; polja `contextOnly` (npr. „Koliko naročil mesečno odpremite z zamudo?") pristanejo pod „Vaše številke za to področje" pod „Prikaži izračun", čeprav v formulo ne vstopajo.

### C9. Prodajna priprava pravi „izbran razpon" za vse ocenjene postavke

`salesReport.ts:1005-1010`: tudi za `none` (ni odgovoril) in `industryAverage`. Strankin tekst (`confidenceReason.ts:99-111`) to loči, prodajni ne.

### C10. „+0 strank brez nove zaposlitve"

`HeroBand.tsx:97-101` in `pdf.ts:368-383`: pri računovodskem servisu brez kapacitetnih ur (samo denarni odliv) se izpiše „To je 0 dodatnih strank" oziroma rumeni pas „+0 strank".

### C11. `preurediList` prepiše samo širino glave

`Koda.gs:595-646`: če se desno od glave kdaj znajde celica brez naslova, jo `getDataRange` prebere, prepis pa je ne pokrije — ostane na stari poziciji in po prerazporeditvi laže.

### C12. Časovno občutljiv test

`deliverLead.test.ts:141` „brez webhooka" nalaga pravi jsPDF s pisavami; ob vzporednem zagonu vseh 48 datotek preseže 5 s, v izolaciji traja pod sekundo. Ni logična napaka.

### C13. Dokumentacijska neskladja

- `segments.ts:253-256` in README trdita, da sta pri `splosno` privzeti dve področji; `defaultIds` in `recommendedCount` jih dasta tri (`:256`). Izid je isti kot „prva tri po vrstnem redu", komentar pa laže.
- `validation.ts:37` `normalizeName` ni nikjer uporabljen; obrazec presledke samo obreže (`EmailGate.tsx:176-178`).

---

## Kaj sem preveril in ni sporno

- Aritmetika košev, naslovljivega deleža in kapice (`potential.ts`), razpon (`range.ts`), sredine in pasovi vseh kontekstov (vsak `fallback` leži v natanko enem pasu).
- Zgodovina brskalnika: potiski, zamenjave in `popstate` na vseh prehodih, vključno z obnovljeno sejo in preusmeritvijo oddanega obrazca.
- Zastavice `usesRevenue`/`usesMargin` proti dejanskim formulam; `capitalCostRate` je vprašan natanko v dejavnostih, ki ga množijo.
- Ubežanje HTML v prodajni pripravi (vseh šest strankinih nizov gre skozi `esc`), zaščita celic pred formulami v listu (`zaCelico`).
- Kontrolna vsota davčne, telefon, e-naslov; dvojna oddaja; `keepalive` meja; velikost prilog.
- Enota `h/leto` pri inventurah (brez ×12, ure nazaj /12).
