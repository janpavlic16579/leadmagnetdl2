# Poročilo: UX-pregled nove strukture kalkulatorja LM-10

> **Namen dokumenta.** Neodvisen pregled aplikacije z vidika obiskovalca (direktor ali vodja SMB podjetja,
> ki pride iz oglasa in ima 5–10 minut) in z vidika konverzije v lead. Vsebuje ugotovitve s sklici
> `datoteka:vrstica`, prioritizirane predloge izboljšav ter seznam tega, kar deluje in naj ostane.
>
> **Kako je nastalo.** (1) Sprehod skozi celoten tok v brskalniku — segment proizvodnja, namizje 1280 px in
> telefon 390 px, od Koraka 1 do zahvalnega zaslona, z izpolnjenim obrazcem. (2) Trije vzporedni pregledi kode
> po temah: vprašalniški tok, rezultat in konverzija, dostopnost/mobilno/zmogljivost. (3) Skeptična preverba
> najpomembnejših trditev neposredno ob kodi — vse, kar je v razdelku 0, je preverjeno.
>
> **Stanje kode:** veja `urne-postavke-2026`, commit `68c5e34`, 18. avgust 2026.
> **Repozitorij:** `/Users/janpavlic/Documents/Datalab/aplikacije/ROI calc 2`
>
> Ta dokument **ne ponavlja** README-ja in ne ocenjuje vsebine vprašanj po panogah (za to so poročila v
> `navodila/<panoga>/`). Ocenjuje pot, ki jo obiskovalec prehodi, in to, kar na njej vidi, razume in izgubi.

---

## 0. Povzetek — deset ugotovitev po vplivu

| # | Ugotovitev | Kje | Vpliv |
|---|---|---|---|
| 1 | **Zaslon in PDF povesta različno glavno številko.** Zaslon: „Skupaj na leto 79.800–94.464 EUR“ (`directLoss + lostMargin + capacity`). PDF: največja pisava nosi naslov „NEPOSREDNI LETNI STROŠKI“ in vrednost `directLossEUR` — v istem primeru „najmanj 18.000 EUR“. Dokument, ki gre k upravi, s prvo številko zanika zaslon. | `ResultsView.tsx:71,142-145` ↔ `pdf.ts:271-285` | zaupanje |
| 2 | **Sporočilna past hero ↔ potencial.** Hero pravi ~80–94 tisoč, „Realistični potencial izboljšave“ pa 5.985–11.336 EUR — manj kot desetina, in je zadnja kartica. Razlike zaslon ne pojasni. Vzrok je v tem, da „Kaj je glavni vzrok?“ privzeto stoji na „Ne vemo“ (naslovljiv delež 0,30) in da obiskovalec nikjer ne izve, da prav to vprašanje določa velikost potenciala. | `ResultsSummary.tsx:107-116`, `addressableShare.ts`, `ModuleSection.tsx` | verodostojnost, prodajni kavelj |
| 3 | **„Korak 10 od 10“ ni konec.** Rezultat nosi oznako zadnjega koraka, sledi pa obrazec s štirimi obveznimi polji in tremi privolitvami, ki nima števca. Gumb, ki tja pelje, obljublja „Prenesi PDF poročilo“. | `CalculatorFlow.tsx:297-307,686-729`, `ResultsView.tsx:244-248` | osip na koncu |
| 4 | **Nikjer ni poti do pogovora.** „15-min pregled s svetovalcem“ (odprto vprašanje README-ja) na rezultatu in zahvali ne obstaja; zahvalni zaslon je slepa ulica (prenesi / nazaj / dva interna dokumenta). | `ResultsView.tsx:238-250`, `EmailGate.tsx:173-200` | konverzija v sestanek |
| 5 | **Ponudba za e-naslov je šibka in obrazec jo sam oslabi.** Zastonj je vse (hero, kartice, graf, formule, tveganja); PDF doda samo „3 ukrepi ta teden“ za en modul, izgubi pa formule in vrstice „PANTHEON naslavlja“. Obrazec sam pove: „Izračun na prejšnjem zaslonu ostane na voljo tudi brez tega koraka.“ Obvezna privolitev vključuje profiliranje in se sklicuje na pravilnik **brez povezave** (`PRIVACY_POLICY_URL = ''`). | `EmailGate.tsx:15,229,387-399`, `pdf.ts:586-611`, `actions.ts:395-398` | konverzija v lead, skladnost |
| 6 | **Dolžina in breme.** ≈45–52 interakcij in do 14 številk do rezultata; triaža ima 40 radijskih tarč + 10 kljukic (na telefonu 4 zaslone drsenja); korak 3 nima nobenega pojasnila, čeprav odgovor določi pas izboljšave (8–20 % proti 25–40 %); štiri diagnostična vprašanja stojijo tik pred rezultatom. | `StepTriage.tsx`, `StepContext.tsx`, `contexts/proizvodnja.ts:42-49` | osip sredi toka |
| 7 | **Navigacija dela proti obiskovalcu v štirih primerih.** (a) Brskalnikov „Nazaj“ po internem „Nazaj“ pelje *naprej* (interni gumb kliče `setStep`, učinek pa `pushState`). (b) Obnova seje je nema, brez „začni znova“ — kampanjski `?s=` jo namenoma ne povozi. (c) Sprememba dejavnosti izbriše kontekst, triažo in osnovo brez opozorila, ker `hasAnswers` gleda samo `moduleInputs`. (d) „Izračunaj še to“ z rezultata po vnosu ne vrne na rezultat, ampak vodi po preostalih straneh. | `CalculatorFlow.tsx:189-217,226,539-549,640-676` | izguba dela, zmeda |
| 8 | **Dostopnost — tri merljive vrzeli.** Obroba vnosnih polj `#dfe3e8` na beli ima 1,29:1 (zahteva 3:1) — polje vizualno „ne obstaja“; rumeni stolpec grafa 1,87:1; `input` nima `:focus-visible` pravila (imajo ga gumbi, `select`, `summary`, `a`); tekoča vsota med vnosi nima `aria-live`. | `tokens.css:4,30`, `index.css:161-165`, `StepInputs.tsx:125-127` | WCAG 2.1 AA |
| 9 | **Objava: deljenje brez slike in mrtvi varnostni rob.** `deploy.yml` ne nastavi `VITE_PUBLIC_URL`, zato produkcija nima `canonical`, `og:url` in `og:image` (potrjeno v `dist/index.html`). `index.html` nima `viewport-fit=cover`, zato je `env(safe-area-inset-bottom)` v lepljivih pasovih vedno 0. PDF-knjižnica (195 kB gz) se prednaloži takoj ob prikazu rezultata. | `deploy.yml:37-42`, `vite.config.ts:14-25`, `index.html:8`, `CalculatorFlow.tsx:454` | doseg, mobilno |
| 10 | **Analitika ne vidi, kje ljudje odnehajo.** `lm10_step_view` pošlje en dogodek za vse 3–4 strani vnosov; ni časa na koraku, ni dogodka ob opustitvi, ni razmerja vneseno/povprečje/razpon na finančni osnovi; `lm10_lead_submitted` se sproži pred poskusom dostave (namenoma), a ločenega dogodka za uspeh/neuspeh dostave ni. | `CalculatorFlow.tsx:239-241`, `deliverLead.ts:159-167`, `analytics.ts:22-36` | umerjanje lijaka |

Vse ostalo v dokumentu je razčlenitev teh desetih točk plus manjše ugotovitve, ki se jih splača pobrati mimogrede.

---

## 1. Nova struktura — zemljevid poti (proizvodnja, privzete tri področja)

README opisuje sedem korakov; obiskovalec jih vidi **deset**, ker se vnosi razbijejo na eno stran na področje plus stran diagnostike (`CalculatorFlow.tsx:297`, `moduleEngine.ts:252-257`). Če v triaži obkljuka vseh deset področij, jih vidi sedemnajst.

| Zaslon | Oznaka | Vsebina | Interakcij | Opažanje ob sprehodu |
|---|---|---|---|---|
| 1 | *(brez oznake)* | spustni seznam dejavnosti; pri „Drugo“ podvprašanje | 1–3 | logotip v glavi se ob izbiri zamenja v PANTHEON Manufacture — lep, a neopazen signal; števca koraka ni |
| 2 | Korak 2 od 10 | število zaposlenih | 2 | cel zaslon za eno številko, ki „ne vstopa v noben znesek“ |
| 3 | Korak 3 od 10 | 3 vprašanja × 5 možnosti (način proizvodnje, sistem, vloga) | 4 | brez pojasnil (`?`), gumb siv, dokler niso vsa tri; nič ne pove, katero manjka |
| 4 | Korak 4 od 10 | triaža: 10 področij × 4 ocene + kljukica „Izračunaj podrobno“ | 11+ | kljukice sledijo ocenam v živo (dobro), a nihče ne pove, da; opomba „3 od 10 področij“ šele na dnu |
| 5 | Korak 5 od 10 | finančna osnova: 2 urni postavki, prihodek, marža; „Ne veste? povprečje / razpon“ | 5–9 | najbolje izpeljan vnosni zaslon; polje za prihodek preozko za lasten placeholder („npr. 2 000 0…“); brez ločil tisočic po vnosu |
| 6–8 | Korak 6–8 od 10 | eno področje na stran: 3–6 polj + „glavni vzrok“; tekoča vsota v pasu | ≈19 | tekoča vsota (20.832 → 53.232 EUR) je najmočnejši motivator v toku; placeholder „0“ ne da merila; ni oznake „področje 2 od 3“ |
| 9 | Korak 9 od 10 | diagnostika: 4 vprašanja × 5 radiov, „ne prispevajo k finančnemu rezultatu“ | 5–8 | tik pred izplačilom; tekoča vsota tu izgine iz pasu |
| 10 | Korak 10 od 10 | rezultat: hero razpon, 4 kartice, graf, 2 razčlenitvi, tveganja, „česa nismo izmerili“ | branje | dolg zaslon brez povzetka; primarni CTA „Prenesi PDF poročilo“ |
| — | *(brez oznake)* | obrazec: 6 polj, 3 privolitve | 9 | ožji stolpec in nelepljivi gumbi — drug vizualni jezik kot vsi koraki prej |
| — | — | zahvala: prenesi / nazaj / priprava PDF / priprava HTML | — | brez naslednjega koraka; na 390 px se gumbi lomijo v dve vrstici |

Skupaj **≈45–52 interakcij do rezultata, ≈55–60 do oddaje**, od tega do 14 natipkanih številk. Obljuba na prvem zaslonu je „okoli deset minut“ (`StepIndustry.tsx:79`) — za obiskovalca iz oglasa je to dvakratnik tega, kar je pripravljen dati, ne da bi videl eno samo številko.

---

## 2. Ugotovitve po korakih

Vsaka ugotovitev: kaj obiskovalec vidi → zakaj je to trenje → predlog.

### 2.1 Vstop (Korak 1–2)

- **Najpomembnejša izbira je skrita v spustnem seznamu.** Sedem dejavnosti + „Drugo“ v `<select>` — obiskovalec ne vidi možnosti, dokler ne klikne, in ne more primerjati. Kartice s sedmimi imeni (in ikono ali enim stavkom „za koga“) bi izbiro naredile v enem pogledu, na telefonu pa bi tudi odpravile sistemski izbirnik. `StepIndustry.tsx:100-140`
- **Prvi zaslon ne kaže, kaj sledi.** Ni števca (namenoma, `StepIndustry.tsx:33`), ni „10 zaslonov · ~14 številk · rezultat brez e-naslova“. Prvi števec, ki ga obiskovalec vidi, je „Korak 2 od 10“ — vtis, da je nekaj zamudil.
- **Sivi „Naprej“ brez razloga.** Na Korakih 1–4 je gumb onemogočen brez besedila ob njem (`StepIndustry.tsx:152`, `StepEmployeeCount.tsx:69`, `StepContext.tsx:146`, `StepTriage.tsx:129`). Najbolj boli pri „Drugo“: dejavnost je izbrana, gumb siv, podvprašanje pod njim pa je lahko spregledano. Vzorec „gumb ostane živ, ob kliku pove, kaj manjka“ ekipa že uporablja v `EmailGate.tsx:100-103`.
- **Korak 2 je cel zaslon za eno številko**, ki „ne vstopa v noben znesek“ (`StepEmployeeCount.tsx:59-60`). Predlog: združiti z dejavnostjo v en zaslon „O podjetju“ (dejavnost + zaposleni) — en zaslon manj, brez izgube podatka.

### 2.2 Kontekst (Korak 3)

- **Odgovor „Kako danes vodite proizvodnjo?“ določi pas izboljšave** — Excel/papir 25–40 %, PANTHEON MF 8–20 % (`contexts/proizvodnja.ts:42-49`) — torej približno polovico končne številke. Zaslon nima nobenega pojasnila; `HelpTip` se tu sploh ne uporablja (`StepContext.tsx` ne uvaža `HelpTip`). Uvod sicer pove „iz njih izpeljemo, koliko … je realno mogoče nasloviti“, a ne pove, *katero* vprašanje in *kako*.
- **Tri obvezna vprašanja, brez označbe, katero manjka.** Gumb oživi šele, ko so vsa tri odgovorjena; obiskovalec, ki je preskočil „vlogo“ pod pregibom, vidi le siv gumb.
- Predlog: eno vrstico pod vprašanjem o sistemu („To vprašanje določi, kolikšen delež stroška štejemo za naslovljiv“) in `HelpTip` z razponi; ob kliku na siv gumb pomik na prvo neodgovorjeno vprašanje.

### 2.3 Triaža (Korak 4)

- **Deset področij × štiri ocene = 40 tarč**, na 390 px štirje zasloni drsenja (izmerjeno: 3.381 px). Za obiskovalca iz oglasa je to prvi trenutek, ko pomisli, da bo dolgo.
- **Kljukice sledijo ocenam, dokler jih ne dotakneš** (`CalculatorFlow.tsx:272,589-595`) — pametno, a nerazloženo: obiskovalec vidi, da kljukice skačejo, potem pa nenadoma nehajo. Ena vrstica ob prvi kljukici („Predlog sledi vašim ocenam; lahko ga popravite“) reši oboje.
- **Ocena je lahko brez učinka.** Kdor oceni vse z 0 („nič me ne boli“) ali vse s 3, dobi isti izbor: prva tri po vrstnem redu registra (`moduleEngine.ts:190-196`). Nič ne pove, da deset ocen v tem primeru ni spremenilo ničesar; pri samih ničlah bi bilo pošteno vprašati „ste prepričani, da bi radi merili prav ta tri?“.
- **„Priporočamo tri“ piše šele na dnu**, po vseh desetih (`StepTriage.tsx:116`), in na istem zaslonu trčita dve deseti: „KORAK 4 OD 10“ in „3 od 10 področij“.
- **Opis področja se vidi šele po odločitvi**: `definition.summary` se izriše na strani vnosov (`ModuleSection.tsx:25`), v triaži pa sta le naslov in vprašanje.
- Predlogi: (a) števec „Izbrano 3 od 10 · priporočamo 3“ **lepljiv na vrhu**, ne opomba na dnu; (b) po treh ocenah 3 pokazati mikro-povratno informacijo („to področje bo v podrobnem izračunu“); (c) na telefonu ocene kot vodoravni segmentni gumb (4 v vrsti) — polovica višine; (d) razmisliti o **dvostopenjski triaži**: najprej „Označite do tri področja, ki vas najbolj tiščijo“ (kartice), šele nato ocena 0–3 samo za izbrana — 3 ocene namesto 10.

### 2.4 Finančna osnova (Korak 5)

Najbolje izpeljan vnosni zaslon: „Ne veste?“ z **povprečjem panoge** in **razponom** rešuje glavni razlog opustitve (nepoznana številka), viri postavk so dokumentirani (`docs/urne-postavke.md`). Vseeno:

- **Vnesena številka se ne oblikuje.** Prihodek „3500000“ ostane brez ločil tisočic po izhodu iz polja — na zaslonu, kjer se odloča o milijonih, je to napaka branja (in placeholder „npr. 2 000 0…“ je odrezan, ker je polje s `width: 7.5rem` preozko za lastno vsebino, `StepCostBasis.module.css:28`).
- **Izbrani razpon ne pokaže, s čim se računa.** Ob izbiri pasu ostane številsko polje prazno (`StepCostBasis.tsx:192,208`), sredina pasu (npr. 22 EUR/h) se ne izpiše nikjer — obiskovalec ne ve, katera številka je šla v izračun.
- **„Naprej na številke“ ni nikoli onemogočen** (`StepCostBasis.tsx:112`), preskočen prihodek pa tiho izloči vse odstotkovne postavke (`contextTypes.ts:316-317`). Zaslon nima nobenega „to polje je prazno — brez njega ne bomo izračunali X“.
- **Strošek kapitala (6 %, `modules/shared.ts:27`) se za proizvodnjo ne vpraša** in ne prikaže, a vstopa v vezani kapital — nevidna predpostavka.
- **Isti gumb dvakrat zapored** („Naprej na številke“ na triaži in na osnovi) daje vtis vrtenja v krogu.

### 2.5 Vnosi (Korak 6–8) in diagnostika (Korak 9)

- **Tekoča vsota v lepljivem pasu je najmočnejši element toka** — številka raste ob vsakem vnosu (20.832 → 53.232 EUR). Ni pa je na diagnostiki (Korak 9) in nima `aria-live` (`StepInputs.tsx:125-127`).
- **Placeholder „0“ ne da merila.** Na osnovi je placeholder „npr. 23“, tu „0“ (`NumberField`), zato obiskovalec ne ve, ali je 40 h/mesec veliko ali malo. Predlog: „npr. 20–60“ iz `plausibility` mej ali iz privzetka, dosledno z osnovo.
- **Ni oznake „področje 2 od 3“** — naslov je ime področja, oznaka pa le „Korak 7 od 10“; seznam treh izbranih področij se po triaži ne vidi nikjer več.
- **„Kaj je glavni vzrok?“ trikrat**, vsakič privzeto „Ne vemo“ — bere se kot ponavljanje, hkrati pa je (glej 0/2) najvplivnejše vprašanje za potencial. Nujno je vsaj eno pojasnilo: „Odgovor določi, kolikšen del tega stroška štejemo za naslovljiv (npr. podatki 75 %, okvare strojev 15 %).“
- **Diagnostika stoji tik pred rezultatom** — štiri vprašanja, ki „ne prispevajo k finančnemu rezultatu“, brez gumba „Preskoči“, na trenutku najvišje nestrpnosti. Predlog: premakniti *za* rezultat kot „Izboljšajte oceno tveganj (1 min)“ ali jo skrčiti na en zaslon s štirimi vodoravnimi izbirniki in vidnim „Preskoči“.
- **Mikro-UX številskih polj** (`NumberField.tsx:64-77`, `ModuleInput.tsx:134`, `numberInput.ts:55-60`): vodilna ničla izgine („0,5“ je mogoče vpisati le kot „,5“); zaokroževanje odstotkov prepiše polje med tipkanjem (`ModuleSection.tsx:84`, `StepCostBasis.tsx:300`); `clampNumber` ob blurju tiho spremeni „45“ v „30“ brez sporočila. Vse troje so drobne, a povečujejo občutek, da polje „dela po svoje“.
- **Opozorilo o verjetnosti ur** (`StepInputs.tsx:104-110`) stoji tik nad 160 px visokim lepljivim pasom — na telefonu je na najbolj natrpani strani pogosto pod pregibom.

### 2.6 Rezultat (Korak 10)

- **Vrstni red kartic dela proti sporočilu.** Največja številka na strani je vsota treh različnih vrst denarja (odtekli denar + neprejeta marža + vrednost časa) pod eno oznako „Skupaj na leto“, brez razčlenitve v isti vrstici; „Realistični potencial“ — edina številka, s katero prodaja lahko dela — je zadnja, na telefonu peta v stolpcu, in do desetkrat manjša. `ResultsSummary.tsx:41-44` v komentarju sam ugotavlja, da je „ena skupna vsota zavajala“. Predlog: pod hero ena vrstica „od tega X denar, ki odteka · Y vrednost časa“, in kartico potenciala povleči na drugo mesto z razlago „zakaj tako malo: ker ste pri vzroku izbrali ‚Ne vemo‘ — [popravi]“.
- **„Zakaj razpon?“ ni razložen** nikjer ob hero; logika je v `format.ts:60-68`, edina razlaga je zadnji stavek opombe kartice potenciala. Robni primer: pri vsoti 0 hero pravi „Skupaj na leto: ni izmerjeno“, lepljivi CTA pa še vedno vabi k oddaji.
- **Oznaki „Srednja“ in „Nizka“ zanesljivost sta vizualno skoraj enaki** (`ResultsSummary.module.css:25-34`, razlika le v `font-weight`) — najpogostejši izid izgleda kot opozorilo o napaki.
- **„Sprostljiv obratni kapital“ je edina kartica brez sledi**: ni v grafu (`ResultsView.tsx:110-113`), ni v razčlenitvi (`:176,188`), ni v PDF tabelah.
- **Trije izrazi za isto stvar na eni strani**: legenda „Neposredna izguba / Nezaslužena marža / Sproščena kapaciteta“ proti karticam „Neposredni letni stroški / Nezaslužena letna marža / Vrednost izgubljene kapacitete“.
- **Graf**: imena področij odrezana na 21 znakov („Plan, kapacitete in n…“, `BreakdownChart.tsx:53,112`), Y-os brez enote, točne vrednosti samo v tooltipu (na dotik in s tipkovnico težko dosegljive), `aria-label` brez številk. Isto področje se pojavi dvakrat (enkrat pri neposrednih stroških, enkrat pri kapaciteti) z različnima zneskoma — brez povezovalne razlage.
- **Metodologija je najmočnejši dokaz in privzeto zaprta** — „Prikaži izračun“ pod vsakim področjem (`MethodologyToggle.tsx:24-48`) pokaže formulo *in* vnesene številke; nihče ne ve, da je tam. Vir urnih postavk (SURS) na zaslonu ni omenjen.
- **Tveganja** (`RiskCard`) so poštena in dobro utemeljena, a brez ukrepa in brez „PANTHEON naslavlja“, ki ga denarne postavke imajo.
- **Ni „kaj če“**: urne postavke in prihodek — največja vzvoda — sta dosegljiva le z „Nazaj na vnos“ čez pet zaslonov. Ni tiskanja (`@media print` ne obstaja), ni deljenja, ni povezave za nadaljevanje na drugi napravi.
- **„3 ukrepi ta teden“ na zaslonu ne obstajajo** — obiskovalec ne vidi vzorca tega, kar naj bi „kupil“ z e-naslovom.
- **Sekundarni gumb je enako težak kot primarni** v lepljivem pasu; „Izračunaj še to“ (×7) tekmuje tik nad njim brez podatka, koliko časa vzame.

### 2.7 Obrazec in zahvala

- **Nenapovedan enajsti korak** brez števca in v drugačnem vizualnem jeziku (ožji stolpec, nelepljivi gumbi). Gumb „Prenesi PDF poročilo“ obljublja datoteko, dostavi obrazec.
- **9 interakcij** za dokument, katerega vsebina je bila pravkar zastonj; davčna številka (čeprav neobvezna) bere kot predpogodbeni obrazec.
- **Obvezna privolitev** vključuje „spremljanje mojih aktivnosti na spletni strani … oblikovanja personaliziranih vsebin in ponudb“ in se sklicuje na pravilnik brez povezave (`EmailGate.tsx:15,387-399`). To je hkrati CRO in skladnostna težava — obvezna privolitev v dokument, ki ga ni mogoče prebrati.
- **Nobene protiuteži zaupanja**: obljuba „podatki ne zapustijo brskalnika“ je le na Koraku 1 (`StepIndustry.tsx:145`) in se prav tu ne ponovi; ni „en e-mail, brez spama“, ni socialnega dokaza.
- **Gumb obljublja prenos, ne pošiljanja** — e-naslov se zbere, poročilo pa se nikamor ne pošlje; zahvala tega ne pojasni.
- **Če webhook pade**: obiskovalec dobi tri prenose (poročilo + prodajna priprava PDF + HTML), brskalnikovo vprašanje „Prenesti več datotek?“ in prošnjo, naj dokument o sebi posreduje svetovalcu (`deliverLead.ts:220-225`, `EmailGate.tsx:198`). README to označuje kot začasno stanje — vredno je vedeti, da je to danes *privzeto* stanje, dokler `VITE_LEAD_WEBHOOK_URL` ni nastavljen.
- **Zahvala je slepa ulica**: ni „kaj sledi“ (kdo, kdaj), ni termina, ni deljenja. Na 390 px se „Prenesi poročilo“ lomi v dve vrstici.

### 2.8 PDF za stranko

- Glej 0/1: hero v PDF nosi drugo številko kot zaslon.
- Pri oznaki zanesljivosti PDF pod hero **zamenja** panožno opombo z metodološko (`pdf.ts:288-292`) — pri „low“ se dokument za upravo začne s stavkom, da večina podatkov manjka.
- V PDF **ni nobenega kontakta, imena svetovalca, povezave ali naslednjega koraka**; noga nosi le disclaimer (`pdfKit.ts:354-355`). Dokument, ki „kroži po upravi“, nima poti nazaj k Datalabu.
- PDF izgubi formule (`MODULE_METHODOLOGY` v `pdf.ts` ni) in vrstice „PANTHEON naslavlja“ — torej prav tisto, kar zaslon ponuja zastonj.

---

## 3. Prečne teme

### 3.1 Navigacija, zgodovina, obnova

- **Brskalnikov „Nazaj“ po internem „Nazaj“ pelje naprej.** Interni gumb kliče `setStep` (`CalculatorFlow.tsx:315`), učinek na `:189-204` pa ob *vsaki* spremembi koraka doda vnos (`pushState`); po enem kliku „Nazaj“ v aplikaciji je zgodovina `[1,2,3,2]` in brskalnikov back vrne na 3. Gib „swipe back“ na telefonu torej obiskovalca vrne naprej. Popravek: interni „Nazaj“ naj kliče `history.back()`, korak pa naj se nastavi iz `popstate`.
- **Obnova seje je nema.** `readProgress` obnovi korak brez obvestila (`:74`), v UI ni „začni znova“; kampanjski `?s=` obnovo namenoma ne povozi (`:89`). Kdor v istem zavihku klikne drug oglas, pristane na „Korak 7 od 10“ tujega vprašalnika. Predlog: pas „Nadaljujete prejšnji izračun (proizvodnja, pred 12 min) · Začni znova“.
- **Opozorilo pred izgubo dela ima luknjo.** `hasAnswers = Object.keys(moduleInputs).length > 0` (`:226`) — kdor je opravil kontekst, triažo in osnovo (5 zaslonov), a še ni vpisal številke, ob spremembi dejavnosti ali zaprtju zavihka ne dobi opozorila; `:546-549` mu profil, ocene in izbor izbrišejo. Predlog: v pogoj vključiti profil in triažo.
- **„spremeni dejavnost“ so enosmerna vrata**: po potrditvi gre tok spet čez kontekst, triažo, osnovo in vse strani vnosov — brez poti „nazaj tja, kjer sem bil“ (`StepInputs.tsx:78`, `CalculatorFlow.tsx:652`).
- **„Izračunaj še to“ ne vrne na rezultat**: odpre stran področja (`:669-676`), „Naprej“ pa nato pelje po preostalih straneh (`:640-643`).
- **Enter** napreduje samo na Koraku 2 (`StepEmployeeCount.tsx:52`); drugod ne naredi nič.

### 3.2 Dostopnost (WCAG 2.1 AA)

Osnova je nadpovprečna: tokeni, `:focus-visible` na gumbih, `role="status"`, fokus na `h1` ob menjavi koraka (`useStepHeading.ts:24-31`), radii v `<label>` znotraj `<fieldset>`/`<legend>`, `HelpTip` na dotik (44 px, Escape, `hover: none`), `prefers-reduced-motion` globalno in v grafu, temna tema popolna. Vrzeli:

| Kaj | Izmerjeno | Zahteva | Kje |
|---|---|---|---|
| obroba polj `#dfe3e8` na `#ffffff` | 1,29:1 | 3:1 (1.4.11) | `tokens.css:4`, `StepShell.module.css:67`, `EmailGate.module.css:109` |
| obroba temna `#383233` na `#221e1f` | 1,31:1 | 3:1 | `tokens.css:85-86` |
| rumeni stolpec `#faaf17` na beli, 12 px legenda | 1,87:1 | 3:1 | `tokens.css:30`, `BreakdownChart.module.css:16` |
| serije grafa med sabo (svetla loss↔margin 2,4:1; temna loss↔margin 1,4:1) | pod 3:1 | 3:1 | `tokens.css:101` (komentar trdi drugače) |
| `:focus-visible` na `input` | ni pravila | 2.4.7 | `index.css:161-165` |
| `.subOption` brez `:focus-within` | — | 2.4.7 | `StepIndustry.module.css:33-43` |
| tekoča vsota brez `aria-live` | — | 4.1.3 | `StepInputs.tsx:125` |
| `input[type=range]` brez `aria-valuetext` („15“ namesto „15 %“) | — | 4.1.2 | `ModuleInput.tsx:116-125` |
| napake obrazca brez povzetka v live regiji | — | 3.3.1 | `EmailGate.tsx:251-402` |

### 3.3 Mobilno (360–430 px)

- Dotične tarče povsod ≥ 44 px, `inputMode` pravilen, pisava polj 16 px (brez iOS zooma) — dobro.
- `viewport-fit=cover` manjka (`index.html:8`) → `env(safe-area-inset-bottom)` je vedno 0; ob vklopu bo treba `padding-bottom` v `.wrap` (`StepShell.module.css:9`, fiksnih 160 px) računati z `calc(160px + env(...))`, sicer zadnja vsebina zleze pod pas.
- Hero razpon na 390 px se lomi „79.800 EUR – 94.464 / EUR“; gumbi zahvale se lomijo v dve vrstici.
- Triaža 4 zasloni drsenja; uvodni odstavki na Korakih 3–5 zavzamejo prvi zaslon pred prvim poljem.
- Graf pod 520 px se preklopi v vodoravno (dobro), Y-os širine 132 px pusti stolpcem ≈190 px.

### 3.4 Zmogljivost

- Prvi obisk ≈150 kB gz (JS 125 + CSS 5 + 2 pisavi 19) — solidno; Recharts (103 kB gz) in jsPDF (195 kB gz) sta pravilno ločena in lena.
- `CalculatorFlow.tsx:454` **prednaloži PDF-knjižnico takoj ob rezultatu** — 195 kB gz na mobilnih podatkih, tudi kdor poročila ne prenese. Predlog: `requestIdleCallback` ali ob fokusu/hoveru na CTA.
- `.chartPlaceholder { height: 260px }` (`ResultsView.module.css:162`) proti dejanski `max(200, n×64)` → premik postavitve pri 5 področjih.
- Reza 600/700 pisave nista prednaložena (`vite.config.ts:53-55`) — naslovi in hero številka poskočijo.

### 3.5 SEO in deljenje

- **`VITE_PUBLIC_URL` v `deploy.yml` ni nastavljen** → produkcija brez `canonical`, `og:url`, `og:image` (potrjeno v `dist/index.html`); s `twitter:card=summary` se povezava na LinkedInu deli brez slike. Popravek je ena vrstica v `deploy.yml`.
- `robots.txt` dovoli vse, `public/karta/index.html` (interna karta vprašalnika) se objavlja — če to ni namen, `Disallow: /leadmagnetdl/karta/`.
- Naslov rezultatnega zaslona je vprašanje („Koliko vas stane …?“), ne trditev — na strani, ki naj bi *odgovorila*.

### 3.6 Analitika lijaka

Sedem dogodkov (`analytics.ts:22-36`) pokrije hrbtenico, ne pa vprašanj, ki jih bo marketing prvi zastavil:

- `lm10_step_view` je odvisen le od `step` (`CalculatorFlow.tsx:239-241`) → strani vnosov (največji del) oddajo en dogodek; ne vidi se, na katerem področju ljudje odnehajo.
- Ni `duration`/časa na koraku, ni dogodka ob opustitvi (`visibilitychange`/`beforeunload` z zadnjim korakom), ni dogodka za „Nazaj“ (popravki ≠ napredovanje).
- Ni dogodka za finančno osnovo (vneseno / povprečje / razpon / preskočeno) — najboljši znani napovednik kakovosti leada.
- `lm10_triage_done` pošlje le število izbranih; same ocene (kje boli) ostanejo v brskalniku.
- Ni signala za klik na onemogočen „Naprej“ (kje ljudje obtičijo).
- `lm10_lead_submitted` se sproži pred dostavo (namenoma, `deliverLead.ts:159-167`), ločenih dogodkov `delivery_ok`/`delivery_failed` ni → konverzije se štejejo tudi, kadar do prodaje niso prišle.

---

## 4. Predlogi izboljšav — prioritizirano

Vpliv: ● visok · ◐ srednji · ○ nizek. Trud: S (ure) · M (dan–dva) · L (teden+).

### P0 — popravki, ki škodijo zaupanju ali podatkom

| # | Predlog | Vpliv | Trud | Kje |
|---|---|---|---|---|
| P0-1 | Poenoti hero: PDF naj nosi isto številko in isto oznako kot zaslon („Skupaj na leto“ z razčlenitvijo v podnaslovu) ali pa naj zaslon jasno loči „denar, ki odteka“ od „vrednosti časa“ — a **ista** logika na obeh | ● | S | `pdf.ts:271-292`, `ResultsView.tsx:142-151` |
| P0-2 | Interni „Nazaj“ → `history.back()`; korak se nastavi izključno iz `popstate` | ● | S | `CalculatorFlow.tsx:189-217,315` |
| P0-3 | `hasAnswers` naj vključi profil, triažo in osnovo; opozorilo pred spremembo dejavnosti in `beforeunload` s tem dobita vsebino | ● | S | `CalculatorFlow.tsx:226,539` |
| P0-4 | `VITE_PUBLIC_URL` v `deploy.yml`; `viewport-fit=cover` + `calc()` v `.wrap` | ◐ | S | `deploy.yml:37-42`, `index.html:8`, `StepShell.module.css:9` |
| P0-5 | Povezava do pravilnika o zasebnosti (`PRIVACY_POLICY_URL`) pred objavo; besedilo obvezne privolitve skrčiti na obdelavo za pripravo poročila, profiliranje premakniti v neobvezno | ● | S (+ pravna potrditev) | `EmailGate.tsx:15,387-399` |
| P0-6 | Ločena dogodka za uspeh/neuspeh dostave; ob neuspehu vidno stanje „poročilo je pri vas, kopije nismo mogli poslati — [pošlji znova]“ namesto treh prenosov | ● | S | `deliverLead.ts:159-228`, `EmailGate.tsx:440-444` |
| P0-7 | Kontrast: obroba polj vsaj `#b8c0c9` (≥3:1), rumeni stolpec z obrobo ali temnejši odtenek, `:focus-visible` tudi na `input`, `aria-live="polite"` na tekoči vsoti | ◐ | S | `tokens.css:4,30`, `index.css:161`, `StepInputs.tsx:125` |

### P1 — konverzija in razumevanje

| # | Predlog | Vpliv | Trud | Kje |
|---|---|---|---|---|
| P1-1 | **Pot do pogovora**: na rezultatu pod potencialom in na zahvali kartica „15-min pregled s svetovalcem“ (termin ali „pokličemo vas v 2 delovnih dneh“); ista kartica kot zadnja stran PDF-ja s kontaktom | ● | M | `ResultsView.tsx`, `EmailGate.tsx:173-200`, `pdf.ts` |
| P1-2 | **Napovedati obrazec**: rezultat = „Korak 10 od 11“, obrazec „Korak 11 od 11“ v istem vizualnem jeziku (lepljivi gumbi); CTA na rezultatu „Naprej na PDF poročilo“ | ● | S | `CalculatorFlow.tsx:297-307,686-729` |
| P1-3 | **Pokazati, kaj je za e-naslovom**: prvi od „3 ukrepov“ na zaslonu, druga dva zamegljena; obrazec našteje vsebino PDF (hero, graf, formule, akcijski načrt, „PANTHEON naslavlja“) — in PDF naj to res vsebuje | ● | M | `ResultsView.tsx`, `pdf.ts`, `actions.ts` |
| P1-4 | **Potencial na drugo mesto** z vrstico „zakaj tako malo“ in gumbom „popravi vzrok“, ki odpre inline izbirnik vzroka za vsako področje (brez vračanja skozi tok) | ● | M | `ResultsSummary.tsx:64-116`, `CalculatorFlow.tsx` |
| P1-5 | **Pojasnilo pri vzroku in sistemu**: en stavek + `HelpTip` na Koraku 3 in pri „Kaj je glavni vzrok?“ z deleži (podatki 75 % … okvare 15 %) | ● | S | `StepContext.tsx`, `ModuleSection.tsx`, `addressableShare.ts` |
| P1-6 | **Vrstica napredka** v glavi (tanka, pod logotipom), števec že na Koraku 1, na straneh vnosov še „področje 2 od 3“ s tremi imeni | ◐ | S | `Header.tsx`, `StepIndustry.tsx:33`, `StepInputs.tsx` |
| P1-7 | **Triaža lažja**: lepljiv števec „izbrano 3 od 10“ na vrhu, mikro-povratna informacija ob oceni 3, na telefonu ocene v eni vrsti; premisliti dvostopenjsko triažo (najprej do tri kartice, nato ocena) | ● | M | `StepTriage.tsx`, `StepTriage.module.css` |
| P1-8 | **Diagnostika za rezultat** kot „Izboljšajte oceno tveganj (1 min)“ ali z vidnim „Preskoči“; tekoča vsota naj ostane v pasu | ◐ | S–M | `CalculatorFlow.tsx`, `StepInputs.tsx:136` |
| P1-9 | **Zaupanje ob številki**: pod hero „Zakaj razpon?“ (zložljivo), vir urnih postavk (SURS, povezava), „Prikaži izračun“ pri največjem področju privzeto odprt, primerjava „podobna podjetja vaše velikosti“ iz `industryAverageBand` | ◐ | M | `ResultsView.tsx`, `range.ts:67-70` |
| P1-10 | **Obrazec lažji**: telefon in davčna v „Dodatno (neobvezno)“ zložljivo; ponoviti „podatki ne zapustijo brskalnika, dokler ne kliknete“; „en e-mail, brez sekvence“ če drži | ◐ | S | `EmailGate.tsx:230-370` |
| P1-11 | **Analitika**: `lm10_step_view` z `inputsModuleId`, dogodek `lm10_step_leave` s trajanjem, `lm10_cost_basis_done` z viri (vneseno/povprečje/razpon/prazno), triažne ocene po področjih (razredi, ne osebno) | ● | S | `analytics.ts`, `CalculatorFlow.tsx` |

### P2 — poliranje

| # | Predlog | Vpliv | Trud |
|---|---|---|---|
| P2-1 | Dejavnost kot kartice namesto `<select>`; Korak 1 + 2 združiti | ◐ | M |
| P2-2 | Oblikovanje številk ob blur (3 500 000), širše polje za prihodek, dosleden placeholder „npr. …“ tudi v modulih | ◐ | S |
| P2-3 | Ob izbranem razponu izpisati sredino („računamo z 22 EUR/h“); prazno obvezno polje na osnovi označiti | ◐ | S |
| P2-4 | Vodilna ničla / zaokroževanje / tihi clamp v `NumberField` — sporočilo „največ 30 %“ ob obrezovanju | ○ | S |
| P2-5 | Enotno poimenovanje treh košev v legendi in karticah; enota na Y-osi; polna imena področij (tooltip ali dvovrstične oznake) | ◐ | S |
| P2-6 | „Srednja“ in „Nizka“ zanesljivost vizualno ločiti (barva/ikona), enako „srednje/visoko“ tveganje | ○ | S |
| P2-7 | „Izračunaj še to“ → po vnosu nazaj na rezultat; „spremeni dejavnost“ → nazaj tja, kjer je bil, če se segment ni spremenil | ◐ | M |
| P2-8 | Ob obnovi seje pas „nadaljujete · začni znova“; `?s=` z drugim segmentom naj vsaj vpraša | ◐ | S |
| P2-9 | `@media print` za rezultat; „Kopiraj povezavo“ z zakodiranim stanjem v `#hash` (podatki ostanejo lokalni, deljenje je obiskovalčeva odločitev) — reši tudi „en zavihek, ena seja“ | ◐ | M |
| P2-10 | Lazy PDF na `requestIdleCallback`; prednaložiti reza 600/700; `chartPlaceholder` z isto formulo višine | ○ | S |
| P2-11 | Zahvala: „kaj sledi“ v treh vrsticah, gumbi brez lomljenja na 390 px (vrstica `[dev] follow-up sekvenca` je že pravilno omejena na `import.meta.env.DEV`, `EmailGate.tsx:214`) | ○ | S |
| P2-12 | Zanka za umerjanje: na rezultatu „Se vam zdi ocena realna? prenizka / približno / previsoka“ — najcenejši vir za kalibracijo po ~50 vnosih iz README-ja | ◐ | S |

---

## 5. Kaj deluje in naj ostane

Da popravki ne podrejo tega, kar je dobro:

- **Tekoča vsota v lepljivem pasu** med vnosi — edini trenutek v toku, ko obiskovalec vidi, da se trud izplačuje.
- **„Ne veste? — povprečje panoge / razpon“** na finančni osnovi z označenim virom in dokumentiranimi postavkami — to je najbolje rešen problem celotnega vprašalnika (nepoznana številka ≠ opustitev).
- **Kljukice v triaži sledijo ocenam** in zamrznejo ob prvem ročnem dotiku — pravilno vedenje, potrebuje le en stavek razlage.
- **Poštenost**: „Česa nismo izmerili“, „nobene številke si nismo izmislili“, tveganje brez evrov, oznaka zanesljivosti, „najmanj X“ pri nizki zanesljivosti, „PANTHEON naslavlja“ ob vsakem področju.
- **`HelpTip`**: dotik, 44 px, Escape, `hover: none`, na ozkih zaslonih čez celo širino.
- **Ohranjanje toka**: `sessionStorage`, zgodovina na korak, `beforeunload` z vsebino (ko bo pogoj popravljen).
- **Obrazec**: pravi `<form>`, napačen telefon/davčna ne blokirata, tri ločene privolitve, fokus na prvo napako.
- **Tehnika**: tokeni + popolna temna tema, `useStepHeading`, lena Recharts/jsPDF, `prefers-reduced-motion`, radii v `<label>` znotraj `<fieldset>`.

---

## 6. Kaj preveriti z uporabniki

Ta pregled je strokovni; naslednja stopnja so ljudje. Pet hitrih testov (po 20 min, 5 direktorjev ali vodij, po možnosti iz različnih panog):

1. **Prvi vtis (5 s):** pokaži Korak 1 — „Kaj boste dobili in koliko časa bo vzelo?“ Meri: ali omenijo rezultat brez e-naslova in „deset minut“.
2. **Triaža na telefonu:** meri čas in število ocen; vprašaj, ali vedo, kaj bo z ocenami; opazuj, ali opazijo kljukice.
3. **Finančna osnova:** ali brez pomoči najdejo „povprečje panoge“; kaj mislijo, da pomeni „polni strošek ure“.
4. **Rezultat — 30 s branja, nato pokrij zaslon:** „Katero številko bi povedali finančniku?“ in „Koliko od tega bi lahko rešili?“ Meri: ali povedo hero ali potencial; ali razumejo razliko kapaciteta ≠ plače.
5. **Obrazec:** „Kaj mislite, da dobite za e-naslov?“ pred klikom; nato ali privolitev preberejo in kaj jih moti.

Metrike lijaka, ki naj bodo na nadzorni plošči od prvega dne (po P1-11): osip po **strani vnosov** (ne po koraku), mediana časa do rezultata, delež „povprečje panoge“ proti vnesenemu na osnovi, delež `lead_submitted` z uspešno dostavo, delež rezultatov z „Ne vemo“ pri vseh vzrokih.

---

## 7. Omejitve tega pregleda

- Sprehod v brskalniku je bil opravljen za **proizvodnjo**; drugi segmenti so pregledani samo v kodi.
- **PDF in prodajna priprava** sta pregledana po kodi (`pdf.ts`, `pdfSales.ts`), ne vizualno.
- **Temna tema** je pregledana po tokenih, ne vizualno na vsakem zaslonu.
- Ni bilo **realnih uporabnikov** — vse sodbe so strokovne in jih razdelek 6 predlaga preveriti.
- Sklici na vrstice veljajo za commit `68c5e34`; pred izvedbo preveri, da se vrstica ujema.
