# Poročilo: globoka UX-raziskava kalkulatorja LM-10 (25. 8. 2026)

> **Namen.** Druga, poglobljena raziskava uporabniške izkušnje. Prvi pregled
> ([POROCILO-ux-pregled-nove-strukture.md](POROCILO-ux-pregled-nove-strukture.md), 24. 8., commit `68c5e34`)
> ostaja referenca za polni seznam takratnih ugotovitev — ta dokument ga **ne ponavlja**, ampak:
> (1) preveri, kaj je od takrat popravljeno, (2) živo potrdi ali ovrže sporne trditve,
> (3) doda nove ugotovitve, ki jih prvi pregled ni videl.
>
> **Kako je nastalo.** (1) Sprehod skozi celoten tok v brskalniku na **trenutnem delovnem drevesu**
> (commit `88bca93` + neuveljavljene spremembe, vključno z novim `horizon.ts`): proizvodnja, namizje
> 1280 px, telefon 390 px, svetla in temna tema, do oddanega obrazca. (2) **Vizualni pregled obeh
> dejansko generiranih PDF-jev** — česar prvi pregled ni naredil (tam le po kodi). (3) Trije vzporedni
> kodni pregledi: vprašalniški tok, rezultat + oddaja, vsebine + vizualni sistem (s preštetimi
> številkami in izračunanimi kontrasti). (4) Živi testi spornih vedenj (zgodovina brskalnika, obnova
> seje, oznaka zanesljivosti).
>
> **Testni scenarij za številke v tem dokumentu:** proizvodnja, 45 zaposlenih, po naročilu,
> Kombinacija ERP/Excel/papir, direktor; triaža 3/2/1/3/1 + horizontale 2/1/1/1/0; neposredna ura =
> povprečje panoge (21), administrativna = razpon 25–31, prihodek 3,5 mio, marža 28 %; vsa modulska
> polja izpolnjena. Rezultat: hero 104.300–119.060 EUR, potencial 69.225–80.295 EUR.

---

## 0. Povzetek — kaj je novega po vplivu

| # | Ugotovitev | Kje | Vpliv |
|---|---|---|---|
| 1 | **Oznaka »Nizka zanesljivost« laže o vzroku.** Obiskovalec, ki je vnesel *vsa* modulska polja, a obe urni postavki prevzel kot povprečje/razpon, dobi »Večina ključnih podatkov manjka« — na zaslonu in v PDF-ju za upravo. Vzrok `allEstimated` in vzrok `filledRatio ≤ 0,5` delita isto (za prvega napačno) besedilo, čeprav prodajna priprava točen razlog že izračuna (»2 urni postavki so izbran razpon in ne podatek«). | `potential.ts:255`, `copyTypes.ts:244,250`, rešitev v `salesReport.ts:537-562` | zaupanje |
| 2 | **Obljuba obrazca ni izpolnjena.** Podnaslov obrazca obljublja »s formulo pod vsako postavko« — strankin PDF (vizualno preverjen, 3 strani) nima nobene formule, nobene vrstice »PANTHEON naslavlja« in **nobenega kontakta ali naslednjega koraka**; konča se z razpredelnico ukrepov in pravnim pridržkom. Formule so zastonj na zaslonu in v interni pripravi — ni jih pa v edinem dokumentu, za katerega obiskovalec plača z e-naslovom. | `copy/proizvodnja.ts:45-46` proti `pdf.ts` (brez `MODULE_METHODOLOGY`), `pdfKit.ts:331-355` | konverzija, verodostojnost |
| 3 | **Zaslon pravi »najmanj 44.000 EUR«, PDF isto kartico izpiše »44.000 EUR«.** `pdf.ts:420` ne podaja `lowConfidence` — dokument za upravo trdi natančneje kot zaslon. (Hero je usklajen; kartice ne.) | `ResultsSummary.tsx:37-38` proti `pdf.ts:419-420` | zaupanje |
| 4 | **Živo potrjeno: interni »Nazaj« + brskalnikov »Nazaj« = naprej.** Po petih internih »Nazaj« (rezultat → triaža) brskalnikov »Nazaj« vrne *naprej* na finančno osnovo. Na telefonu je to gib »swipe back«. Včerajšnji P0-2 ni uveljavljen. | `CalculatorFlow.tsx:206-234,332` | mobilna navigacija |
| 5 | **Prazno polje na finančni osnovi tiho postane panožno povprečje.** Kdor polje preskoči, misli, da šteje 0 — izračun pa teče s `fallbackEUR`, brez vsake označbe ob polju. To je jedro obljube »nobene številke si ne izmislimo«. | `StepCostBasis.tsx:196,212,218-220` | zaupanje |
| 6 | **27 kontekstnih izbir pričaka obiskovalca z vnaprej izbranim neugodnim odgovorom** (»Excel«, »Po e-pošti in po spominu«, »Naslednji dan« …). Podatek gre v CRM in prodajno pripravo kot »privzeto«, direktor z urejenim sistemom pa na petih mestih najde trditev, da dela s papirjem. Diagnostika je hkrati vnaprej odgovorjena (»Nismo preverili«) — rezultat pa nato trdi »na ta vprašanja niste odgovorili«. | `proizvodnja.ts:58-68` idr. (`default: 2`), `shared.ts:51-72` | resnost vnosa, prodajni signal |
| 7 | **Izmerjena dolžina: 43–47 odgovorov in ~1.250 besed branja na priporočeni poti** (6–8 min samo branja; realno 13–15 min proti obljubi »okoli deset minut«). Števec »od N« se med triažo spreminja v živo z vsako kljukico. Triaža na 390 px: 3.469 px = 4,1 zaslona drsenja. | `segments.ts`, `CalculatorFlow.tsx:313-324` | osip |
| 8 | **Nečitljivosti, ki jih prvi pregled ni izmeril:** onemogočen primarni gumb na uvodnem zaslonu 2,34:1 (prvi element, ki ga obiskovalec vidi); spustni seznam — edina akcija uvodnega zaslona — zaradi `min-block-size: 32rem` pod pregibom na iPhone SE; obrobe vseh kontrolnikov 1,21–1,46:1 (zahteva 3:1). | `tokens.css:34-37`, `StepIndustry.module.css:1-30`, `buttons.module.css:17-25` | dostopnost, prvi vtis |
| 9 | **`og:image` ne obstaja** — ne v `dist/`, ne kot datoteka (predviden je 512-px favicon, ne 1200×630 kartica; `twitter:card=summary`). Lead magnet, ki se deli po LinkedInu in e-pošti, se deli kot gola povezava. | `index.html:27-35`, `vite.config.ts:14-29` | doseg |
| 10 | **Mikro-hrošči vnosa:** odstotno polje med tipkanjem prepiše »1,5« v »2« in požre decimalko; s.p. z 0 zaposlenimi obtiči brez sporočila; vsak pritisk tipke sinhrono piše v `sessionStorage`; dotik enega polja materializira vse privzetke modula kot »uporabnikove«. | `ModuleSection.tsx:36-39,76-92`, `StepEmployeeCount.tsx:30,68`, `CalculatorFlow.tsx:190-196`, `StepInputs.tsx:73-75` | občutek kakovosti |

---

## 1. Kaj je od 24. 8. POPRAVLJENO (potrjeno na delovnem drevesu)

Da se ne popravlja že popravljenega — vse spodnje je preverjeno živo oziroma v generiranem PDF-ju:

- **Hero v PDF ≡ hero na zaslonu** (vizualno potrjeno: obakrat 104.300–119.060 EUR, ista oznaka »Skupaj na leto«, isti pripis o sestavi). Včerajšnji P0-1 je rešen. `pdf.ts:310-323`
- **Dvojni diskont odpravljen → potencial je spet prodajno uporaben.** Potencial 69.225–80.295 EUR proti hero 104.300 EUR (≈ 66 %) — ne več desetina. Kartica ima novo, pošteno opombo. `potential.ts`, `addressableShare.ts`
- **»Kaj je glavni vzrok?« ni več prednastavljen na »Ne vemo«** in ima novo pojasnilo posledice (»Brez odgovora računamo z najbolj zadržanim deležem …«). Vzroki so zdaj konkretnejši (6 možnosti). `ModuleInput.tsx:99-106`, `addressableShare.ts`
- **Korak 3 pove, da odgovor ne vstopa v izračun** (po odpravi pasu izboljšave je to res) — včerajšnja pripomba o nerazloženem najvplivnejšem vprašanju je s tem brezpredmetna v starem smislu; ostaja pa vprašanje privzetkov (točka 6 povzetka).
- **Naslov rezultata je trditev** (»Toliko vas stane sedanji način dela v proizvodnji«), ne več vprašanje. (`document.title` zavihka ostaja vprašanje.)
- **Nova bloka na rezultatu**: »V treh letih« s ceno odlašanja (435 EUR/delovni dan) in »Česa ta znesek ne vsebuje« z zaključkom »dejanski strošek je višji, ne nižji« — oba tudi v PDF-ju. `horizon.ts`, `ResultsView.tsx:170-229`
- **Nova vrstica pokritosti**: »Izmerjeno 3 od 10 področij — še 1 področje, ki ste ga označili kot pereče, ni všteto« (s pravilno dvojino). `horizon.ts:95-115`
- **Tabela »Pri kateri investiciji se to povrne«** v PDF-ju (30/60/120 k → meseci) — močan nov argument (glej pa 3.2/B o tem, da je samo v PDF-ju).
- **Prodajna priprava** ima stolpec »vir« (vneseno/privzeto/izbran razpon) pri vsakem odgovoru in točen razlog zanesljivosti — potrjeno v generiranem dokumentu (7 strani, ICP 80/100 pas A za testni scenarij).
- **»Tega podatka ne vodimo«** kljukice pri EUR poljih modulov (novo od včeraj) — dobra rešitev, a glej 3.1/A8 o štirih različnih formulacijah »ne vem«.

## 2. Kaj od 24. 8. OSTAJA odprto (živo preverjeno)

Brez ponavljanja podrobnosti — sklici na prejšnje poročilo:

| Včerajšnja | Stanje danes | Dokaz |
|---|---|---|
| P0-2 brskalnikov »Nazaj« po internem pelje naprej | **odprto — živo potrjeno** (triaža → osnova) | test v brskalniku |
| P0-3 `hasAnswers` ne šteje profila/triaže/osnove | odprto | `CalculatorFlow.tsx:226,243-249` |
| P0-4 `VITE_PUBLIC_URL` v deploy + `viewport-fit` | odprto | `deploy.yml`, `index.html:8` |
| P0-5 povezava na pravilnik o zasebnosti | odprto (`PRIVACY_POLICY_URL = ''`) | `EmailGate.tsx:16,432-445` |
| P0-6 dogodka uspeh/neuspeh dostave | odprto | `deliverLead.ts:162-169` |
| P0-7 kontrast obrob, `:focus-visible` na `input`, `aria-live` na vsoti | odprto | `tokens.css:4,86`, `index.css:161-167`, `StepInputs.tsx:125` |
| Obrazec: nenapovedan korak brez števca, brez zneska, 4 obvezna polja | odprto | `EmailGate.tsx` |
| Tiha obnova seje brez »začni znova«; `?s=` konflikt tiho ignoriran | odprto — obnova živo potrjena (osvežitev → rezultat, brez obvestila) | `CalculatorFlow.tsx:76-117` |
| »spremeni dejavnost« vrže na začetek brez vrnitve; »Izračunaj še to« ne vrne na rezultat | odprto | `CalculatorFlow.tsx:691-694` |
| Diagnostika tik pred rezultatom; tekoča vsota tam izgine | odprto — živo potrjeno | `StepInputs.tsx:136` |
| Razpon brez izpisane sredine; prihodek brez ločil tisočic; placeholder odrezan (polje 120 px) | odprto — živo potrjeno (»3500000« ostane golo) | `StepCostBasis.tsx:192-208`, `StepCostBasis.module.css:28` |
| Triaža predolga; kljukice se prestavljajo brez pojasnila | odprto — 3.469 px na 390 px | `StepTriage.tsx` |
| Graf: odrezane oznake, Y-os brez enote, isto področje dvakrat | odprto — živo potrjeno (»Plan, kapacitete in n…«) | `BreakdownChart.tsx:53,105` |
| Sekundarni CTA enakovreden primarnemu; ni poti do svetovalca na rezultatu | odprto (kontaktna kartica obstaja šele na zahvali) | `ResultsView.tsx` |
| PDF-knjižnica (195 kB) se prednaloži takoj ob rezultatu | odprto | `CalculatorFlow.tsx:454` |
| Prodajna priprava se brez webhooka prenese stranki | odprto — živo potrjeno (gumb »Priprava v PDF« na zahvali) | `deliverLead.ts:196-204` |

---

## 3. Nove ugotovitve

### 3.1 A — Zaupanje in verodostojnost (najdražje)

**A1 · Oznaka zanesljivosti pripiše napačen vzrok.** `computeConfidence` vrne `low` iz dveh
nepovezanih razlogov: `filledRatio ≤ 0,5` **ali** `allEstimated` (obe urni postavki oceni;
`potential.ts:179,255`). Besedilo je eno samo: »Večina ključnih podatkov manjka« (`copyTypes.ts:244`
za zaslon, `:250` za PDF). V testnem scenariju z *vsemi* vnesenimi polji je to izmerljivo napačna
trditev — in stoji na vrhu dokumenta, ki ga obiskovalec nese finančniku. Prodajna priprava točen
razlog že sestavi (`buildConfidenceReason`, `salesReport.ts:537-562`: »2 urni postavki so izbran
razpon in ne podatek«). *Predlog:* isti izračunani razlog izpisati na zaslonu in v PDF-ju namesto
pavšalnega stavka; »manjka« rezervirati za dejansko prazna polja. Trud: S.

**A2 · »najmanj« se izgubi na poti v PDF.** Kartice v PDF ne podajo `lowConfidence`
(`pdf.ts:419-420`), zaslon pa ga (`ResultsSummary.tsx:37-38`). Ista številka: zaslon »najmanj
44.000 EUR«, PDF »44.000 EUR«. Ob A1 to pomeni, da PDF hkrati trdi »podatki manjkajo« in izpisuje
natančnejše zneske kot zaslon. *Predlog:* en parameter. Trud: S.

**A3 · PDF ne izpolni obljube obrazca in nima izhoda.** Vizualno potrjeno na generiranem dokumentu:
ni formul (`MODULE_METHODOLOGY` v `pdf.ts` ni uvožen), ni vrstic »PANTHEON naslavlja«
(`Breakdown.tsx:81-86` obstaja samo na zaslonu), ni kontakta/URL/naslednjega koraka (noga:
`pdfKit.ts:331-355`; `SALES_CONTACT` živi samo v `EmailGate.tsx:24-29`). Podnaslov obrazca pa
obljublja »razčlenjen po področjih — s formulo pod vsako postavko« (`copy/proizvodnja.ts:45-46`).
*Predlog:* (1) formula kot podvrstica v tabeli razčlenitve, (2) blok »Naslednji korak« s kontaktom
na koncu, (3) »PANTHEON naslavlja« kot opomba pod tabelo. Trud: M. To je hkrati najcenejši način,
da e-poštna vrata sploh kaj »prodajo«.

**A4 · Prazna finančna osnova tiho računa s povprečjem.** Pri `source === 'none'` polje ostane
prazno s placeholderjem, izračun pa uporabi `fallbackEUR` (`StepCostBasis.tsx:196,212,218-220`).
Obiskovalec, ki je polje *zavestno preskočil*, dobi zneske iz številke, ki je ni nikoli videl ali
potrdil. *Predlog:* ob prehodu naprej prazna polja vidno označiti »prazno → računamo s povprečjem
panoge 26 EUR/h« ali privzetek ob prehodu formalizirati kot izbiro (isti zapis vira kot pri gumbu
»Vzemi povprečje«). Trud: S–M.

**A5 · Vnaprej izbrani neugodni odgovori.** 27 `contextOnly` izbir ima `default: 2` — tretjo
možnost, praviloma »Excel/papir/po spominu« (`proizvodnja.ts:58-68,304-315,408-419`,
`horizontal.ts:85-96,553-564`). V izvoz in prodajno pripravo gredo kot podatek z virom »privzeto«.
Vzorec za rešitev že obstaja: `MAIN_CAUSE_UNANSWERED = 99` (`addressableShare.ts:121-139`) —
privzetek izven seznama, noben radio označen. Trud: S–M.

**A6 · Diagnostika: vnaprej odgovorjena, nato razglašena za neodgovorjeno.** Polja imajo
`default: ASSURANCE_UNANSWERED = 4`, kar *je* vidna možnost »Nismo preverili« (`shared.ts:51-72`) —
radio je torej označen. Rezultat za nedotaknjeni par vprašanj izpiše »na ta vprašanja niste
odgovorili« (živo potrjeno). Dvoje ne more biti hkrati res. *Predlog:* privzetek izven seznama
(kot A5) ali besedilo rezultata »ste pustili pri ‚Nismo preverili‘«. Trud: S.

**A7 · Napačno obrnjeno vprašanje.** »**Od koliko** naročil mesečno jih povprečno odpremite z
zamudo?« sprašuje po imenovalcu, polje pričakuje števec (`proizvodnja.ts:485`, enota
`naročil/mesec`). *Predlog:* »Koliko naročil mesečno odpremite z zamudo?« Trud: S.

**A8 · Štiri formulacije za »ne vem« in ograda, ki citira neobstoječo.** »Tega podatka ne vodimo«
(kljukica), »Ne vem« (delež zaloge), »Ne vemo« (vzrok), »Nismo preverili« (diagnostika), »Ne
veste?« (osnova). Ograda na rezultatu pravi »Vsega, kar ste označili z ‚Ne vem‘« — kontrolnika s
tem imenom obiskovalec večinoma ni videl (`copyTypes.ts:283` proti `ModuleInput.tsx:170`).
*Predlog:* poenotiti na 1. os. množine; v ogradi citirati dobesedno besedilo kontrolnika. Trud: S.

### 3.2 B — Dolžina in obljuba trajanja (izmerjeno)

- **205 vprašalnih polj** v modulih vseh segmentov; na priporočeni poti **43 (proizvodnja) do 47
  (maloprodaja) odgovorov**, v najslabšem primeru 61–88. Strani vnosov: do 12.
- **~1.250 besed** vidnega besedila na priporočeni poti (brez odpiranja »?«); povprečno pojasnilo
  »?« ima 29 besed, najdaljše 47. Samo branje: 6–8 min; realno izpolnjevanje: **13–15 min** proti
  obljubi »okoli deset minut« (`copyTypes.ts:209`). Obljubo bodisi podpreti s krajšanjem, bodisi
  popraviti v »10–15 min«.
- **34 polj je `contextOnly`** (ne premaknejo zneska); v modulu »Roki« je tako celo **prvo**
  vprašanje (`proizvodnja.ts:483-494`). Premakniti na konec modula ali združiti v neobvezen sklop.
- **Števec se spreminja med izpolnjevanjem**: vsaka kljukica v triaži v živo spremeni »od 10« v
  »od 11« brez pojasnila (`CalculatorFlow.tsx:313-324`); prvi vidni števec je »Korak 2 od 10«
  (korak 1 ga namenoma nima — začeti pri »1 od 9« ali napovedati na uvodu).
- **Samo 29 % številskih polj (41/140) ima »ne vem«** — vsa urna polja zahtevajo ugibanje ali
  prazno (= 0). Pri urah bi pasovni gumbi (»do 5 h · 5–20 h · 20–50 h«) sledili že uveljavljenemu
  vzorcu s finančne osnove (`moduleTypes.ts:160-174`).
- **Dvostopenjski model** (hitri izračun ~15 odgovorov → poglobitev po prvem rezultatu) ostaja
  največja posamična priložnost lijaka; delna infrastruktura zanj (tekoča vsota, »Izračunaj še
  to«, shranjevanje) že obstaja.

### 3.3 C — Navigacija in stanje

- **C1 · Back-bug** — glej povzetek/4; popravek po včerajšnjem receptu (interni »Nazaj« →
  `history.back()`, korak izključno iz `popstate`).
- **C2 · 0 zaposlenih ustavi s.p. brez besede**: polje sprejme 0 (`min={0}`), `canProceed`
  zahteva `> 0`, sporočila ni (`StepEmployeeCount.tsx:30,45-53,68`).
- **C3 · Po oddaji je stanje enkratno**: `clearProgress()` ob `submitted` + osvežitev na zahvali =
  vse izgubljeno, korak 1 (`CalculatorFlow.tsx:190-196`). Shraniti z zastavico `submitted` in
  obnoviti na zahvalo.
- **C4 · Odstotna polja se prepisujejo med tipkanjem**: zaokrožitev na prikaz teče v vsakem izrisu,
  »1,5« → »2« s skokom kazalca (`ModuleSection.tsx:36-39,76-92`, `NumberField.tsx:64-70`;
  prizadeta polja marž v maloprodaji/storitvah/računovodstvu). Zaokrožiti šele ob `blur`.
- **C5 · Vsaka tipka sinhrono piše v `sessionStorage`** (`CalculatorFlow.tsx:190-196`) — debounce.
- **C6 · Dotik enega polja materializira vse privzetke modula** kot uporabnikove vrednosti
  (`StepInputs.tsx:73-75` širi razrešene `values` namesto surovih) — v nasprotju z dokumentacijo
  `types.ts:8-13` in vir prihodnjih napak ob spremembi privzetkov.
- **C7 · Zastarel `inputsModuleId` tiho vrže na prvo stran vnosov** (`CalculatorFlow.tsx:303-306`).
- **C8 · Radijske skupine imenovane po prevodu legende** (`StepContext.tsx:78`) — trk ob enakem
  besedilu; `useId` je že v datoteki.

### 3.4 D — Vizualno in dostopnost (izmerjeno)

| Kaj | Izmerjeno | Zahteva | Kje |
|---|---|---|---|
| onemogočen primarni gumb, svetla tema (edini gumb uvodnega zaslona) | **2,34:1** | 3:1 | `tokens.css:34-37` + `buttons.module.css:17-25`; temna tema je pravilna (3,15:1) |
| obrobe kontrolnikov (polja, kartice, sekundarni gumb) | 1,21–1,46:1 | 3:1 | `tokens.css:4,86` |
| serije grafa med sabo: svetla loss↔margin 2,37:1, margin↔capacity 1,70:1; temna loss↔margin **1,39:1** | pod 3:1 | 3:1 | `tokens.css:30-32,102-104` |
| `:focus-visible` za `input`; `.subOption`, `.includeRow`, `.unknown` brez `:focus-within` | ni pravila | 2.4.7 | `index.css:161-167`, `StepIndustry.module.css:74-96` |
| drsnik + številsko polje = dve enako označeni kontroli (bralnik bere trikrat) | — | 4.1.2 | `ModuleInput.tsx:126-161` |
| oznaka koraka pred `<h1>` — bralnik zaslona številke koraka nikoli ne sliši | — | — | `StepInputs.tsx:79-82` idr. |
| `aria-label` grafa obljublja »iste številke v seznamu pod grafom«, kapacitete tam ni | — | — | `BreakdownChart.tsx:81-85` |

Ter postavitev:

- **D1 · Uvodni zaslon skrije edino akcijo**: `min-block-size: 32rem` rezervacije potisne spustni
  seznam na ~y=500 px — na iPhone SE pod pregib (`StepIndustry.module.css:1-30`).
- **D2 · Kartica potenciala je osirotela** v `repeat(auto-fit, minmax(15rem,1fr))` mreži: pri treh
  karticah desna celica zeva prazna, najpomembnejša prodajna številka pa stoji spodaj levo
  (`ResultsSummary.module.css:42-44`, živo, glej posnetek toka). Potencial povleči na polno širino
  ali na drugo mesto.
- **D3 · Mobilni prelomi zneskov**: »312.900 EUR – 357.180 / EUR« z osamljenim EUR
  (`ResultsView.module.css` `.horizonValue`; enako hero). `white-space: nowrap` na enoti ali
  `clamp()` za velikost.
- **D4 · Brez `line-height` za odstavke** (privzeti ~1,3 pri Titillium; odstavki 150–250 znakov) —
  `body { line-height: 1.55 }` (`tokens.css:128-134`).
- **D5 · Tipografska lestvica brez mobilnega preloma**: naslov 36 px tudi na 320 px → 4–5 vrstic
  (`tokens.css:51-56`) — `clamp()`.
- **D6 · Senca lepljive noge trdo zapisana** (`rgba(16,24,40,0.08)`) — v temni temi nevidna
  (`StepShell.module.css:89`, `ResultsView.module.css:173`).
- **D7 · Prazno stanje rezultata**: pri vseh 0 ostane velik »0 EUR«/»ni izmerjeno« + poln CTA
  »Prenesi PDF poročilo« (`ResultsView.tsx:148-151,307-320`) — zamenjati z usmeritvijo na prvo
  neizmerjeno področje.
- **D8 · Temna tema je sicer celovita in kontrastno boljša od svetle** (izmerjeno; nobeno besedilo
  pod AA) — pohvala, ostaja pa točka grafa zgoraj.

### 3.5 E — Deljenje, meta, zmogljivost

- **E1 · `og:image` ni** — niti datoteke: predviden je `favicon.png` 512×512, `twitter:card` je
  `summary`; v `dist/index.html` ni ne `og:image` ne `canonical` (`VITE_PUBLIC_URL` ni nastavljen v
  `deploy.yml`). *Predlog:* statična 1200×630 kartica + `summary_large_image` + CI naj gradnjo brez
  `VITE_PUBLIC_URL` zavrne. Trud: S.
- **E2 · Generiranje PDF blokira glavno nit** ob kliku (jsPDF + 109 kB pisav + dva dokumenta,
  sinhrono; `deliverLead.ts:112-131`, `pdfKit.ts:52-59`) — brez `aria-busy`/napredka; gumb le
  zamenja besedilo. Predlog: prednaložiti ob prikazu obrazca + status z `aria-live`.
- **E3 · Rezervirana višina grafa** (260 px) se ne ujema z dejansko formulo višine v ozki
  postavitvi → poskok vsebine (`ResultsView.module.css:252-254` proti `BreakdownChart.tsx:41,54`).
- **E4 · Fontovska poizvedba**: preveriti, ali sta latin in latin-ext oba potrebna za šumnike
  (č/š/ž so v latin-ext) — morda ena zahteva manj v kritični poti (`fonts.css`, `vite.config.ts`).

### 3.6 F — Analitika (za umerjanje vsega zgornjega)

Poleg včerajšnjih (na strani vnosov ni `moduleId`, ni trajanja, ni opustitve) še:
- `lm10_form_blocked` s prvim neveljavnim poljem (kje obtiči oddaja),
- `lm10_delivery_ok/failed` (koliko »leadov« sploh pride do prodaje),
- vir finančne osnove (vneseno/povprečje/razpon/prazno→fallback) — najboljši napovednik kakovosti
  leada in edini način za umerjanje A4.

---

## 4. Prioritete — če je časa za en dan, teden, mesec

**En dan (S, samo zaupanje) — ✅ IZVEDENO 25. 8. 2026 popoldne** (596 testov zelenih; podrobnosti v git diff):
1. ✅ A1 razlog zanesljivosti — nov `src/lib/confidenceReason.ts` (skupni signali za zaslon, strankin PDF in prodajno pripravo; vi-oblika za zaslon, brezosebna za PDF)
2. ✅ A2 `lowConfidence` v kartice PDF (`pdf.ts`, zrcalno zaslonu: koša + kapaciteta z "najmanj", kapital in potencial brez)
3. ✅ A7 vprašanje o zamudah → »Koliko naročil mesečno odpremite z zamudo?«
4. ✅ E1 `public/og-image.png` (1200×630, znamčna kartica), vtičnik vstavi og:image + mere in nadgradi twitter:card, `deploy.yml` podaja `VITE_PUBLIC_URL`, gradnja brez njega glasno opozori
5. ✅ C2 sporočilo pri 0 zaposlenih — gumb ni več onemogočen; ob kliku sporočilo (`SHARED_COPY.employeeCountMissing`) + fokus v polje
6. ✅ Kontrast — nov `--color-border-strong` (3,33:1 / 3,19:1) na poljih, spustnem seznamu, sekundarnem gumbu in gumbu »?«; onemogočen primarni gumb #5b6773 na #e7e9ec (4,75:1); `:focus-visible` tudi na `input`/`textarea`

**En teden (M, konverzija) — ✅ IZVEDENO 25. 8. 2026 zvečer** (598 testov zelenih; vse spodnje živo preverjeno v brskalniku in v generiranem PDF-ju):
7. ✅ A3 strankin PDF: nov razdelek »Kako smo računali« (formula + utemeljitev + »PANTHEON naslavlja« enkrat na področje) in zaključni »Naslednji korak« s kontaktom (skupni `src/config/salesContact.ts`, isti zapis kot na zahvali). Mimogrede odpravljen hrošč grafa: pri enem samem izmerjenem področju je stolpec postal ploskev čez pol strani — širina je zdaj omejena in stolpci centrirani.
8. ✅ C1 zgodovina: interni »Nazaj« gre skozi `history.back()` (z `lm10Idx` globino in rezervno potjo za svež zavihek); živo potrjeno — brskalnikov »Nazaj« po internem zdaj pelje nazaj, ne naprej
9. ✅ A4 osnova: ob praznem polju »v izračunu velja povprečje panoge (X) kot ocena«, ob izbranem razponu »Računamo s sredino izbranega razpona — X« (prihodek namenoma izvzet — privzetka nima)
10. ✅ A5 privzetki 25 kontekstnih izbir izven seznama (skupna sentinela `UNANSWERED_CHOICE` v moduleTypes; stražna testa razširjena); v prodajno pripravo zdaj potujejo kot »ni odgovora« in ne kot podatek. A6 diagnostika: besedilo rezultata popravljeno v »ostali pri ‚Nismo preverili‘« (prednastavljena izbira ostaja — dokumentirana odločitev, da nedotaknjena diagnostika ne znižuje zanesljivosti)
11. ✅ B števec od »Korak 1 od 9« (uvodni zaslon se ne šteje), vrstica napredka (`role="progressbar"`) nad vsemi oštevilčenimi koraki, triažna opomba napove posledico kljukice (»ena stran vprašanj, približno minuta«)
12. ✅ D1 uvodni zaslon: pri višini ≤ 700 px rezervacija hero odpade (spustni seznam nad pregibom); D2 kartica potenciala čez celo širino mreže (razlaga vzrokov ob njej ostaja za pozneje)
13. ✅ F analitika: `lm10_cost_basis_done` (viri postavk), `lm10_form_blocked` (prvo neveljavno polje), `lm10_delivery_ok`/`lm10_delivery_failed` (webhook oz. `no_webhook`) — slednji živo potrjen ob oddaji

**En mesec (L, strateško) — razpisano v razdelku 5:**
14. Dvostopenjski vprašalnik (hitri izračun → poglobitev po prvem rezultatu)
15. Pot do pogovora na rezultatu in zahvala z »kaj sledi«
16. Lažji obrazec: dve obvezni polji, znesek nad obrazcem, oštevilčen zadnji korak
17. Triaža: dvofazna ali zložene horizontale; pasovni gumbi za urna polja

---

## 5. Paket 3 — razpis

> **Zakaj svoj razdelek.** Paketa 1 in 2 sta bila popravka: vsaka točka je imela en pravilen izid
> in ga je bilo mogoče izvesti brez posvetovanja. Paket 3 ni tak. Vsaka od štirih točk **spremeni
> tok ali obljubo**, zato ima poleg tehničnega dela tudi odločitev, ki ni razvijalčeva. Ta razdelek
> je namenjen prav tem odločitvam — koda je pri vseh štirih lažji del.
>
> Vrstni red spodaj je priporočen vrstni red izvedbe, ne pomembnosti.

### 5.1 Merilna doba pred posegom (predpogoj, 0 dela)

Paket 2 je vgradil `lm10_cost_basis_done`, `lm10_form_blocked` in `lm10_delivery_ok/failed`
(`src/lib/analytics.ts`). Pred vsemi štirimi točkami spodaj naj teče **dva do tri tedne prometa**,
sicer se bo o njih spet odločalo po občutku — natanko to, kar je ta pregled hotel odpraviti.

Kar bo takrat znano in danes ni: na katerem področju vnosov ljudje odnehajo, katero polje obrazca
ustavlja največ oddaj (5.4 je s tem lahko odveč ali pa nujen), kolikšen delež prevzame povprečje
panoge namesto lastne številke (5.2 stoji ali pade s to številko) in koliko »leadov« sploh pride do
prodaje.

**Odločitev:** kdo pogleda te številke in kdaj. Brez lastnika se to ne zgodi.

### 5.2 Dvostopenjski vprašalnik (14)

**Zakaj.** Izmerjeno na priporočeni poti (tri področja): **43 odgovorov v proizvodnji, 47 v
maloprodaji**, do 88 pri vseh področjih, in približno **1.250 besed** vidnega besedila brez
odpiranja pojasnil. Samo branje je 6–8 minut, realno izpolnjevanje 13–15 — proti obljubi »okoli
deset minut« (`copyTypes.ts`, `landingOffer`). Obljuba se torej podre nekje sredi triaže ali vnosov,
tam pa je opustitev najdražja, ker je obiskovalec že vložil čas.

**Predlog.** Dve globini istega vprašalnika:

- **hitri izračun** — kontekst (3) + finančna osnova (2–5) + **po dve vprašanji na področje** ≈ 15
  odgovorov do prvega rezultata;
- **poglobitev** — obstoječi nabor, ponujen *na rezultatu* (»Natančnejši izračun za to področje«),
  ko obiskovalec svojo številko že vidi in ima razlog, da vloži še pet minut.

**Kaj se dotakne.** `ModuleField` dobi zastavico (npr. `quick: true`); vseh osem datotek v
`src/config/modules/` označi po dve polji na modul; `splitIntoInputPages` in `StepInputs` filtrirata
nabor; `ResultsView` dobi vstop v poglobitev; `CalculatorFlow` hrani način.

**Dve posledici, ki ju je treba rešiti hkrati z izvedbo — sicer bo hitri izračun izgledal pokvarjen:**

1. **Oznaka zanesljivosti se sesuje sama od sebe.** `assessConfidence` (`src/lib/potential.ts`) šteje
   razmerje izpolnjenih med *vsemi* nekontekstnimi polji aktivnih modulov. Hitri izračun z dvema
   poljema od petih da razmerje 0,4 → `filledRatio ≤ 0,5` → **»Nizka zanesljivost« pri vsakem
   obiskovalcu**, čeprav je odgovoril na vse, kar smo ga vprašali. Razmerje se mora meriti proti
   **vprašanim** poljem, ne proti vsem obstoječim.
2. **Izbira dveh polj na modul je domenska, ne razvojna.** Merilo naj bo: katero polje nosi največ
   evrov in katero podjetje pozna brez iskanja po sistemu. Napačna izbira tiho podceni celotno
   področje in tega ne bo videl nihče.

**Odločitev pred kodo:** ali sploh gremo v dve globini (alternativa je preprosto krajšanje — glej
spodaj); in kdo določi par vprašanj za vsakega od ~40 modulov.

**Cenejša alternativa, če odgovor na prvo ni jasen.** Trije posegi, ki naslovijo isto bolečino brez
strukturne spremembe: `contextOnly` polja (**34 jih je**) premakniti na konec modula ali v neobvezen
sklop, ker prvo vprašanje področja »Roki« danes ne premakne zneska; skrajšati pojasnila (povprečno
29 besed, najdaljše 47); in dodati vidno pot »dovolj mi je, pokaži rezultat« s strani vnosov.

### 5.3 Pot do pogovora (15)

**Zakaj.** Na rezultatu — kjer je zanimanje najvišje — ni nobene poti do človeka; kontaktna kartica
se pokaže šele na zahvalnem zaslonu, torej po oddaji obrazca. Zahvalni zaslon je hkrati slepa ulica:
ob obkljukanem pozivu za svetovanje pove le, da je »zahtevek zabeležen med vašimi odgovori«, brez
roka in brez imena.

**Predlog.** Kartica »Preverite te številke s svetovalcem« pod potencialom na rezultatu (isti
`SALES_CONTACT` iz `src/config/salesContact.ts`, ki ga od paketa 2 nosi tudi zadnja stran PDF-ja) in
na zahvali tri vrstice »kaj sledi«: kdo se oglasi, v kakšnem roku, kaj bo prinesel.

**Kaj se dotakne.** `ResultsView.tsx`, `EmailGate.tsx` (zahvalni del), `copyTypes.ts`.

**Odločitev pred kodo — in edini pravi zaviralec:** ponudba »15-minutni pregled s svetovalcem« je
odprto vprašanje že v README (»kdo izvaja in kakšna je kapaciteta«). Rok v besedilu (»pokličemo v
dveh delovnih dneh«) je obljuba, ki jo mora nekdo pokriti; brez nje je kartica lahko le kontakt, ne
obljuba. **Dokler webhook (`VITE_LEAD_WEBHOOK_URL`) ni nastavljen, noben zahtevek za svetovanje ne
pride do prodaje** — kar potrjuje tudi dogodek `lm10_delivery_failed: no_webhook`, ki se danes
sproži ob vsaki oddaji.

**Trud.** Zaslon je delo nekaj ur; odločitev je tisto, kar traja.

### 5.4 Lažji obrazec (16)

**Zakaj.** Obvezna so štiri polja (ime, priimek, podjetje, e-naslov) in prva privolitev, čeprav za
dostavo poročila ni potrebno nobeno: PDF se sestavi v brskalniku in prenese lokalno. Ime podjetja
gre v glavo dokumenta in v ime datoteke, e-naslov pa je edino, kar prodaji sploh omogoča stik.

**Predlog.** Obvezni **podjetje in e-naslov**; ime, priimek, telefon in davčna v zložljiv sklop
»Dodatno (neobvezno)« ali navezani na kljukico »Želim posvet«. Nad obrazec kompaktna vrstica z
zneskom (»Vaš izračun: 104.300–119.060 EUR na leto«), ker rezultat ob prehodu na obrazec izgine z
zaslona prav v trenutku, ko za podatke prosimo. Zadnji korak naj dobi oznako — po popravku števca v
paketu 2 je to **»Korak 9 od 9«** (in ne »11 od 11«, kot je pisalo v prvotni različici tega poročila).

**Kaj se dotakne.** `EmailGate.tsx`, `validation.ts`, `CalculatorFlow.tsx` (`stepOrder`).

**Kaj preveriti pred spremembo — trije odjemalci imena in priimka:**

- `contactPerson()` (`src/lib/salesReport.ts`) sestavi »ime priimek«; ob praznih poljih vrne prazen
  niz in prodajna priprava dobi prazno vrstico — potrebuje nadomestilo (npr. e-naslov).
- `LeadExportRecord` (`src/lib/exportRecord.ts`) ima `firstName`/`lastName` na **fiksnih pozicijah**
  glave CSV; polji smeta ostati prazni, stolpca pa se ne smeta odstraniti.
- ICP ocene to ne prizadene: dimenzija »Dosegljivost« (`src/config/icp.ts`) šteje telefon, davčno in
  privolitev za ponudbe — imena ne uporablja.

**Odločitev pred kodo:** ali prodaja sprejme lead brez imena osebe. In pravna: **obvezna privolitev
se sklicuje na pravilnik o zasebnosti, ki ga ni** (`PRIVACY_POLICY_URL = ''`, `EmailGate.tsx:17`) —
to je hkrati največja ovira na obrazcu in odprto skladnostno vprašanje. Absoluten URL je predpogoj
za objavo, ne del tega paketa.

**Zaporedje:** to točko izvesti **po** merilni dobi (5.1). `lm10_form_blocked` bo povedal, katero
polje dejansko ustavlja oddaje — mogoče ni nobeno od tistih, ki jih odstranjujemo.

### 5.5 Triaža in urna polja (17)

**Zakaj.** Triaža je najdaljši en sam zaslon v aplikaciji: izmerjeno **3.469 px na 390 px** — 4,1
zaslona drsenja — in do 55 kontrolnikov v maloprodaji (11 področij × 4 ocene + kljukica). Hkrati ima
le **41 od 146** številskih polj (28 %) kakršenkoli izhod (»Tega podatka ne vodimo«); urna polja ga
nimajo, zato ima obiskovalec, ki ur ne vodi, na voljo le ugibanje ali prazno polje, ki šteje kot 0.

**Predlog A (cenejši, priporočen prvi korak).** Horizontalna področja privzeto zložena pod
»Pokaži še splošna področja (5)«. So v vsakem segmentu za panožnimi in imajo najmanjšo verjetnost
izbire — zaslon se s tem skrajša za približno tretjino brez spremembe logike.

**Predlog B (dražji).** Dvofazna triaža: najprej »Označite področja, ki vas najbolj tiščijo«
(kartice), nato ocena 0–3 samo za izbrana — tri ocene namesto desetih.

**Predlog C (samostojen, neodvisen od A/B).** Pasovni gumbi za urna polja po vzorcu finančne osnove:
»do 5 h · 5–20 h · 20–50 h · več«. Pas je boljši podatek od prazne ničle in od izgovora.

**Past pri C, ki jo je treba rešiti hkrati:** izbran pas vpiše sredino pasu kot navadno vrednost.
`assessConfidence` šteje vsako vrednost, ki ni enaka privzetku, med **izpolnjene** — izbran pas bi
torej zanesljivost dvignil enako kot vtipkana številka. Modulsko polje mora nositi vir odgovora
(kot ga nosi `CostAssumption.source` na finančni osnovi), sicer bo ocena zanesljivosti odslej lagala
navzgor — kar je natanko nasprotje tega, kar je popravil paket 1.

**Kaj se dotakne.** A: `StepTriage.tsx` + `.module.css`. B: povrhu `CalculatorFlow` in
`selectTopModules`. C: `ModuleField` (definicija pasov), `ModuleInput.tsx`, `potential.ts`,
`answerLabels.ts`, prodajna priprava.

**Odločitev pred kodo:** A ali B (A je mogoče izvesti takoj, B potrebuje osnutek zaslona); pri C
kdo določi pasove za vsako urno polje — pasovi so vsebinska ocena, ne tehnična vrednost.

### 5.6 Rep — ugotovitve, ki jih ne pobere noben paket

Vse spodnje je posamično zapisano v razdelku 3, a ni bilo v nobenem paketu. Zbrano tu, da se ob
paketu 3 ne izgubi. Vrstni red je po razmerju med učinkom in trudom.

| # | Kaj | Kje | Trud |
|---|---|---|---|
| R1 | Razlaga ob potencialu: kateri glavni vzroki so ga določili, z gumbom »popravi vzrok« (kartica je od paketa 2 čez celo širino, razlage pa še nima) | `ResultsSummary.tsx`, `addressableShare.ts` | M |
| R2 | Odstotna polja se med tipkanjem prepišejo: »1,5« postane »2«, kazalec skoči na konec (zaokroževanje ob vsakem izrisu namesto ob `blur`) | `ModuleSection.tsx:36-39,76-92`, `NumberField.tsx:64-70` | S |
| R3 | Graf: enota na osi (»EUR/leto«), polna imena področij namesto reza na 21 znakov, kontrast serij pod 3:1 (temna tema loss↔margin 1,39:1) | `BreakdownChart.tsx`, `tokens.css:30-32,102-104` | S–M |
| R4 | Prazno stanje rezultata: pri vseh ničlah ostane velik »0 EUR« in poln CTA za prenos poročila o ničemer | `ResultsView.tsx` | S |
| R5 | Oznaki »Srednja« in »Nizka« zanesljivost sta vizualno skoraj enaki (razlika le v debelini pisave) — najpogostejši izid izgleda kot opozorilo | `ResultsSummary.module.css:25-34` | S |
| R6 | Podvojena metodologija na zaslonu: modul, ki polni oba koša, dobi isti »Prikaži izračun« dvakrat (v PDF je to od paketa 2 rešeno) | `ResultsView.tsx`, `Breakdown.tsx` | S |
| R7 | Namigi neobveznih polj so v barvi napake, čeprav besedilo pravi »Oddaje to ne ustavi« | `EmailGate.module.css:63-67` | S |
| R8 | Štiri formulacije za »ne vem« (»Tega podatka ne vodimo« / »Ne vem« / »Ne vemo« / »Nismo preverili«); ograda na rezultatu citira oznako, ki je obiskovalec ni videl | `copyTypes.ts:283`, `ModuleInput.tsx`, `shared.ts` | S |
| R9 | Mobilno: prelom zneskov z osamljenim »EUR« v svoji vrstici; `body` brez `line-height`; naslovi 36 px tudi na 320 px | `ResultsView.module.css`, `tokens.css:51-56,128-134` | S |
| R10 | Po oddaji je stanje enkratno: `clearProgress()` + osvežitev na zahvali = vse izgubljeno, korak 1 | `CalculatorFlow.tsx:190-196` | S |
| R11 | Vsak pritisk tipke sinhrono zapiše celotno stanje v `sessionStorage`; dotik enega polja materializira vse privzetke modula kot »uporabnikove« | `CalculatorFlow.tsx`, `StepInputs.tsx:73-75` | S |
| R12 | Generiranje PDF blokira glavno nit ob kliku (jsPDF + 109 kB pisav + dva dokumenta), brez `aria-busy` in brez napredka | `deliverLead.ts:112-131`, `EmailGate.tsx` | S–M |
| R13 | Dostopnost: drsnik in številsko polje sta dve enako poimenovani kontroli; oznaka koraka stoji pred `<h1>`, zato je bralnik zaslona ne prebere; `aria-label` grafa obljublja seznam, ki kapacitete ne vsebuje | `ModuleInput.tsx:126-161`, koraki, `BreakdownChart.tsx:81-85` | S |
| R14 | Brez webhooka se prodajna priprava — dokument, napisan **o** stranki — prenese stranki | `deliverLead.ts:196-204` | odločitev |

### 5.7 Odločitve, ki jih paket 3 potrebuje pred kodo

Zbrano na enem mestu, ker je to edino, kar zares zavira:

1. **Dve globini vprašalnika ali samo krajšanje?** (5.2) — in če dve globini, kdo določi par vprašanj na modul.
2. **Kdo izvaja »15-minutni pregled« in v kakšnem roku?** (5.3) — brez tega je kartica lahko le kontakt.
3. **Ali prodaja sprejme lead brez imena osebe?** (5.4)
4. **URL pravilnika o zasebnosti** (5.4) — predpogoj za objavo, ne le za ta paket.
5. **Triaža: A (zložene horizontale) ali B (dvofazna)?** (5.5)
6. **Kdo določi urne pasove** za predlog C (5.5).
7. **Ali sme prodajna priprava k stranki, dokler webhooka ni?** (R14)
8. **Kdaj se nastavi `VITE_LEAD_WEBHOOK_URL`** — od tega je odvisna točka 5.3 in polovica vrednosti celotnega lijaka.

---

## 6. Kaj deluje in naj ostane (novo od zadnjič)

Poleg vsega, kar je pohvalilo že prejšnje poročilo (tekoča vsota, »Ne veste?« na osnovi, poštene
ograde, HelpTip, obrazec z fokusom na napako):

- **Hero + »V treh letih« + »Česa ta znesek ne vsebuje«** je zdaj najmočnejše zaporedje na strani —
  meritev, izpeljanka in meje na enem mestu, brez samohvale.
- **Tabela povračila v PDF** (30/60/120 k) — pravi argument za upravo; manjka le še na zaslonu ali
  vsaj v obljubi obrazca.
- **Stolpec »vir« v prodajni pripravi** in izračunan razlog zanesljivosti — natanko ta mehanizem je
  treba le še obrniti proti obiskovalcu (A1).
- **Vzrok brez privzetka + pojasnilo posledice** — vzorec, ki ga A5/A6 predlagata razširiti.
- **Opisne triažne ocene** (»Plan je stabilen« → »Skoraj vsak dan«) namesto abstraktnih 0–3.
- **Temna tema brez enega samega AA-padca besedila** in `theme-color` usklajen z žetoni.
- **`?debug=1`, follow-up sekvenca v dev vrstici, ICP z utemeljitvami** — interna orodja, ki jih
  prodaja dejansko potrebuje.

## 7. Omejitve

- Živi sprehod: proizvodnja (drugi segmenti po kodi; prejšnje poročilo enako — **računovodstvo in
  maloprodaja še nikoli nista bila vizualno prehojena**, maloprodaja ima najdaljšo triažo).
- Zaslonski zajemi v skritem oknu so mestoma nezanesljivi (animacija grafa v ozadju zamrzne — to je
  artefakt orodja, ne aplikacije).
- Testi z realnimi uporabniki ostajajo neopravljeni; protokol iz prejšnjega poročila (razdelek 6)
  še velja, dopolniti ga velja z vprašanjem ob A1: »Kaj vam pove oznaka ‚Nizka zanesljivost‘?«
- Sklici na vrstice veljajo za delovno drevo na dan 25. 8. 2026 (commit `88bca93` + neuveljavljene
  spremembe); pred izvedbo preveri ujemanje.
