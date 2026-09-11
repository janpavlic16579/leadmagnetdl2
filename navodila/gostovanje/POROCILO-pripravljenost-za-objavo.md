# Pripravljenost aplikacije za objavo na www.datalab.si/kalkulator/

Pregled opravljen 11. 9. 2026 na `main`, commit `520c774` (delovno drevo čisto, `main` = `origin/main`,
CI in objava zelena, brez odprtih PR-jev). Vprašanje, na katero odgovarja: *»ali je aplikacija
pripravljena za objavo?«* — ob selitvi z GitHub Pages na `www.datalab.si/kalkulator/` (Apache, statične
datoteke, objava iz GitHub Actions). Predhodnik
[POROCILO-selitev-na-lastni-streznik.md](POROCILO-selitev-na-lastni-streznik.md) (7. 9.) je odgovoril,
kaj se ob selitvi podre; ta pregled odgovarja, kaj mora biti urejeno, preden stran vidijo stranke.

Viri: koda ob commitu; obe živi objavi (GitHub Pages, Vercel); diagnostika razmeščenega Apps Scripta
(`GET …/exec`); odgovori naročnika o ActiveCampaignu (11. 9.). **Ni bilo preverjeno iz prve roke:**
vpogled v ActiveCampaign (naročnik nima prijave; velja njegova izjava, da obe avtomatizaciji delujeta),
prava oddaja z objavljene strani in klikanje po aplikaciji v brskalniku.

Skupaj: **4 blokade** v kodi, **7 operativnih korakov** (od tega 3 odločitve), **7 priporočil** za čas
po objavi.

## Povzetek v treh stavkih

**Tehnično je aplikacija pripravljena na selitev.** Poti se prilagodijo podmapi brez posega v kodo,
trdo zapisanih naslovov ni, razvojnih sledi in testnih nizov ni, razmeščena skripta je aktualna,
ActiveCampaign je priklopljen z obema avtomatizacijama.

**Pred objavo je treba popraviti štiri stvari v kodi**, vsaka je majhna: predogledna kartica še
obljublja »brez vnosa e-naslova«, obvezna privolitev se sklicuje na pravilnik brez povezave, aplikacija
nima meje napak (prazna stran po uspešni oddaji, če objava pade sredi seje) in `?debug=1` vsakomur odpre
interni dokument o stranki.

**Najdražje tveganje po objavi ni tehnično, ampak vsebinsko:** ob vsaki neuspeli dostavi — tudi ob
prekoračenem roku — gre stranki v prenos prodajna priprava, napisana o njej. To je pravilo iz časa, ko
webhooka še ni bilo, torej odločitev in ne hrošč; sprejeti jo je vredno pred objavo (B5). **Rešeno 11. 9. 2026, glej B5.**

## A. Blokade — popraviti v kodi pred objavo

### A1. Predogledna kartica obljublja »brez vnosa e-naslova«

[index.html:33](../../index.html) — `og:description`: *»Razčlenjen izračun letnih skritih stroškov vašega
poslovanja — brez vnosa e-naslova.«* Tok od 3. 9. ima obrazec s kontaktom **pred** rezultati
([CalculatorFlow.tsx:388](../../src/components/Calculator/CalculatorFlow.tsx)), e-naslov je obvezen
([EmailGate.tsx:127](../../src/components/Results/EmailGate.tsx)). Uvodni zaslon je bil takrat popravljen
(»… pred rezultatom vas prosimo za kontakt«, [copyTypes.ts:223](../../src/config/copy/copyTypes.ts)),
komentar nad njim umik obljube celo dokumentira ([copyTypes.ts:218-220](../../src/config/copy/copyTypes.ts));
meta oznaka je ostala. Kartica se pokaže ob vsaki deljeni povezavi — LinkedIn kampanja je natanko ta primer.

*Popravek:* ena vrstica; zraven zastarel komentar [copyTypes.ts:60](../../src/config/copy/copyTypes.ts)
(»brez e-naslova«). Predlog: *»Razčlenjen izračun letnih skritih stroškov vašega poslovanja — v desetih
minutah, s PDF poročilom za upravo.«* Ugotovitev B7 pregleda 3. 9.

### A2. Obvezna privolitev brez povezave na pravilnik

[EmailGate.tsx:19](../../src/components/Results/EmailGate.tsx) — `PRIVACY_POLICY_URL = ''`. Besedilo obvezne
privolitve (»… za namene, podrobno opisane v pravilniku o zasebnosti, ki vključujejo spremljanje mojih
aktivnosti …«, [EmailGate.tsx:381-392](../../src/components/Results/EmailGate.tsx)) se zato izriše brez
povezave ([:384-390](../../src/components/Results/EmailGate.tsx)); nikjer drugje v aplikaciji povezave na
pravilnik ali na datalab.si ni. README ([README.md:863-865](../../README.md)) naslov še čaka od marketinga.

Naslov obstaja: **`https://www.datalab.si/politika-zasebnosti/`** (HTTP 200, povezana iz noge datalab.si,
preverjeno 11. 9.). Je absoluten, kot koda zahteva.

*Popravek:* ena konstanta. Pred tem naj marketing (ali pooblaščena oseba za varstvo podatkov) potrdi, da
ta pravilnik opisuje prav to, kar privolitev našteva — spremljanje aktivnosti, personalizirane ponudbe,
obe družbi (Datalab SI d.o.o., Datalab d.d.). Zastarel komentar
[EmailGate.tsx:16-17](../../src/components/Results/EmailGate.tsx) (»podpot /leadmagnetdl/«) popraviti zraven.

### A3. Brez meje napak: objava sredi seje pobeli zaslon po uspešni oddaji

Aplikacija nima nobene meje napak — v `src/` ni `ErrorBoundary`, `componentDidCatch` ali
`getDerivedStateFromError`; [main.tsx:6-10](../../src/main.tsx) je gol `createRoot`. Graf na rezultatih je
`lazy()` samo v `Suspense` ([ResultsView.tsx:35-37](../../src/components/Results/ResultsView.tsx),
[:254-264](../../src/components/Results/ResultsView.tsx)), ki lovi čakanje, ne napak. Poslušalca
`vite:preloadError` ni.

Kosi kode se nalagajo pozno: jsPDF ob prihodu na obrazec
([CalculatorFlow.tsx:698-703](../../src/components/Calculator/CalculatorFlow.tsx)), štirje kosi dostave ob
kliku »Pokaži rezultate« ([:770](../../src/components/Calculator/CalculatorFlow.tsx),
[deliverLead.ts:195-204](../../src/lib/deliverLead.ts) — brez `.catch`), graf ob prikazu rezultatov.
Obiskovalec izpolnjuje okoli deset minut; vsaka objava vmes zamenja zgoščena imena datotek, in kjer
strežnik stare `assets/` izbriše (GitHub Pages danes; nov strežnik, če nalaganje briše), obiskovalec sredi
seje dobi:

- ob oddaji: »Oddaja ni uspela. Poskusite znova — vneseni podatki ostanejo …«
  ([EmailGate.tsx:519-521](../../src/components/Results/EmailGate.tsx)) — a brskalnik si padli uvoz
  zapomni, zato ponovni klik ne pomaga; pomaga samo osvežitev, ki je besedilo ne omenja;
- po uspešni oddaji: padel kos grafa → React odklopi celo drevo → **prazna stran**, ko je lead že v
  preglednici in je stranka dala kontakt.

Ugotovitvi A6 in A7 pregleda 7. 9., še odprti.

*Popravek (troje):* (1) meja napak okoli `<App>` v `main.tsx` z enim stavkom in gumbom za osvežitev —
napredek preživi v `sessionStorage` ([progressStorage.ts](../../src/lib/progressStorage.ts)), oddaja tudi;
(2) `window.addEventListener('vite:preloadError', () => location.reload())` — dogodek, ki ga Vite sproži
ob padlem nalaganju kosa; (3) strategija objave, ki stare `assets/` obdrži nekaj dni (B1). Točki 1 in 2
sta nekaj deset vrstic.

### A4. `?debug=1` vsakomur odpre interni dokument o stranki

[App.tsx:29-31](../../src/App.tsx) — `internalMode: params.get('debug') === '1'`, brez žetona in brez
razlike med razvojem in objavo. Učinek: prodajna priprava se ponudi stranki v prenos
([deliverLead.ts:295](../../src/lib/deliverLead.ts) → gumb »Priprava v PDF«,
[NextSteps.tsx:46-55](../../src/components/Results/NextSteps.tsx)), rezultati dobijo oznake »[interno]«
([ResultsView.tsx:370,381](../../src/components/Results/ResultsView.tsx)). Priprava je po lastnem opisu kode
»napisana O stranki (ocena ustreznosti, priporočilo licenc, pričakovani ugovori) in ne ZANJO«
([deliverLead.ts:60-61](../../src/lib/deliverLead.ts)). Niz `debug` je v javnem svežnju, torej ga najde vsak,
ki pogleda kodo strani — ali pa ga preprosto poskusi. Ugotovitev B6 pregleda 3. 9.

*Popravek:* interni način vezati na neuganljivo vrednost iz gradnje (npr. `?debug=<VITE_INTERNAL_TOKEN>`)
ali ga v produkcijski gradnji izklopiti (`import.meta.env.DEV`). Isti pogoj je podvojen v
[funnel.ts:175-177](../../src/lib/funnel.ts) (obisk se označi kot interni) — spremeniti oba in posodobiti
test »interni način vklopi samo natanko debug=1« v `funnel.test.ts`.

## B. Operativni koraki pred objavo (brez kode)

### B1. Nova objava: spremenljivke, korak nalaganja, `.htaccess`

Danes objavljata `deploy.yml` (Pages, `VITE_BASE_PATH=/leadmagnetdl2/`,
[deploy.yml:35-49](../../.github/workflows/deploy.yml)) in Vercel (koren). Za datalab.si:

| Kaj | Vrednost / kje |
|---|---|
| `VITE_BASE_PATH` | `/kalkulator/` — [vite.config.ts:135-143](../../vite.config.ts) doda poševnici sam |
| `VITE_PUBLIC_URL` | `https://www.datalab.si/kalkulator/` — brez njega ni `canonical`, `og:url`, `og:image` ([vite.config.ts:17-51](../../vite.config.ts)); danes kaže na `janpavlic16579.github.io/leadmagnetdl2` |
| `VITE_LEAD_WEBHOOK_URL` | ista repozitorijska spremenljivka kot za Pages |
| Karta | zgraditi PRED `npm run build` (kot [deploy.yml:31-34](../../.github/workflows/deploy.yml)); `public/karta/` ni v gitu |
| Nalaganje | nov korak ali opravilo v `deploy.yml` (SFTP/SSH, zasebni ključ v GitHub Secrets); **najprej `assets/`, nato HTML**; starih `assets/` ob objavi ne brisati (A3) — počistiti po nekaj dneh |
| `.htaccess` v podmapi | `DirectoryIndex index.html`; `Cache-Control` za `assets/` `public, max-age=31536000, immutable`, za `*.html` `no-cache`; **brez** preusmeritve neznanih poti na `index.html` |
| Nikoli v koren | `dist/` vsebuje `robots.txt` (v podmapi brez učinka, [public/robots.txt](../../public/robots.txt)), favicon-e in `og-image.png` — nalaganje mora vedno ciljati podmapo, sicer prepiše datoteke spletišča |

Izmerjeno na `www.datalab.si` 11. 9.: Apache, WordPress, W3 Total Cache 2.9.2; JS dobi
`max-age=31536000` in gzip s tipom `application/x-javascript` (veljaven tudi za module), HTML naslovnice
`max-age=1782`, glave CSP ni. Podmapa te nastavitve podeduje — za HTML jih mora lasten `.htaccess`
povoziti, sicer obiskovalec po objavi dobi star `index.html` s sklici na datoteke, ki jih ni več
(B3 pregleda 7. 9.).

### B2. Karta vprašalnika: objaviti z `noindex`

`public/karta/index.html` (973 kB) je interaktivna karta celotnega vprašalnika — vsa vprašanja,
odgovori, točkovanje. Objavi se na `<objava>/karta/`, iz aplikacije nanjo ni povezave, po
[tools/karta-vprasalnika/README.md:87](../../tools/karta-vprasalnika/README.md) je »javno berljiva
vsakomur, ki pozna naslov«. `robots.txt` v podmapi iskalnikov ne veže. Odločitev 11. 9.: **objaviti, a z
`noindex`** — v predlogo glave v
[build-diagram.mjs:474-475](../../tools/karta-vprasalnika/build-diagram.mjs) dodati
`<meta name="robots" content="noindex">`. Mimogrede:
[tools/karta-vprasalnika/README.md:71](../../tools/karta-vprasalnika/README.md) navaja naslov
`…github.io/leadmagnetdl/karta/` (brez dvojke), ki ne obstaja.

### B3. Čiščenje preglednice in ActiveCampaigna, ura lijaka

**Selitev 11. 9. 2026:** zbiralnik teče na Datalabovem skupnem Google računu s prazno preglednico, ura
lijaka je nameščena; stari list, mape na Drivu in testni kontakti v AC gredo v čiščenje ob ugašanju
starega računa (potek: `tools/google-sheet/README.md`, »Selitev na drug Google račun«). Spodnje besedilo
je stanje pred selitvijo.

Diagnostika `/exec` 11. 9.: `Vrstic v listu (getMaxRows): 2 … Od tega pravih leadov: 1` — to je
naročnikova testna oddaja z 10. 9. (`j***@lexora.si`). Izbrisati kot **vrstico** (desni klik → Izbriši
vrstico), ne s tipko Delete: prazna, a oblikovana vrstica ostane za Google »uporabljena« in leadi
pristanejo pod njo (E7 pregleda 7. 9.). Testni kontakti na seznamih 245 in 247 se izbrišejo ročno v AC —
brisanje vrstice tam ne odstrani ničesar. `Lijak: 2026-09-05 …`, dogodki pa prihajajo do 10. 9. →
`namestiUroZaLijak` ni nameščena; pognati enkrat v urejevalniku
([tools/google-sheet/README.md:420](../../tools/google-sheet/README.md)). List `Dogodki` ima 892 vrstic
razvojnega prometa: ob objavi si zapisati datum ali list izprazniti, sicer lijak kampanje meša testne
obiske s pravimi (`LIJAK_OBDOBJE_DNI` ostane 0).

### B4. Po objavi: povezave, obe stari objavi, repozitorij

- **Kampanjske povezave** na nov naslov:
  [linkedin-gradbenistvo-heyreach.md:230](../../navodila/kampanje/linkedin-gradbenistvo-heyreach.md) in
  [:238-241](../../navodila/kampanje/linkedin-gradbenistvo-heyreach.md) (danes: »naj kampanja kaže na
  Pages«); primeri v [README.md:104-106](../../README.md).
- **GitHub Pages:** ugasniti ali `VITE_PUBLIC_URL` nastaviti na datalab.si — tedaj je Pages ogledalo, ki
  iskalniku pove, da je pravi naslov datalab.si. Danes njen `canonical` kaže na github.io.
- **Vercel:** načrt Hobby je po Vercelovih pravilih nekomercialen; obdržati kvečjemu kot predogled PR-jev
  brez webhooka (tako je nastavljen zdaj — brez `canonical`, brez naslova Apps Scripta v svežnju,
  preverjeno 11. 9.) ali projekt izbrisati.
- **Repozitorij je javen** (pogoj brezplačnega Pages): skupaj s kodo so javni `navodila/` (prodajne
  priprave, LinkedIn sekvenca), `docs/`, `report/` (41 datotek) in `content/sales/` (ugovori, licence,
  ustreznost). Ko Pages ni več potreben, repozitorij prestaviti na zasebnega.

### B5. Odločitev: prodajna priprava k stranki ob neuspeli dostavi

**Rešeno 11. 9. 2026** (veja `rok-dostave-in-priprava`): rok `REQUEST_TIMEOUT_MS` 10 s → 25 s (s prilogama
≈ 28,5 s) in ob neuspeli dostavi samo strankin PDF — priprava se ponudi le brez webhooka in v internem
načinu. Povod: po selitvi skripte na Datalabov Google račun je vsaka testna oddaja končala kot
`lm10_delivery_failed` (`rejected`) po 13,5 s, čeprav je skripta delo končala (vrstica, PDF-ja, kontakt,
e-pošta); izmerjeni Googlov del brez dela skripte je 3–7 s, izjemoma 25 s. Spodnje besedilo je stanje
pred popravkom.

Tabela v [deliverLead.ts:51-55](../../src/lib/deliverLead.ts): brez webhooka → priprava stranki; z
webhookom in uspelo dostavo → samo na strežnik; **z webhookom in neuspelo dostavo → priprava stranki**
([:391-399](../../src/lib/deliverLead.ts) ob zavrnitvi, [:401-408](../../src/lib/deliverLead.ts) ob izjemi
— sem spada tudi prekoračen rok, [submitLead.ts:209,216-219](../../src/lib/submitLead.ts)). Prva vrstica
je po lastnem komentarju začasna; tretja jo podeduje.

Rok je 10 s plus prenos telesa, s prilogama ≈ 13,5 s ([submitLead.ts:132-139](../../src/lib/submitLead.ts)).
Skripta v načinu AC pred odgovorom naredi: čakanje na ključavnico do 30 s
([Koda.gs:519-520](../../tools/google-sheet/Koda.gs)), vrstico, dva zapisa na Drive z deljenjem in klice
v AC do 6 s ([Koda.gs:2766](../../tools/google-sheet/Koda.gs)). Dve sočasni oddaji ali počasen Google in
rok pade — stranka tedaj vidi »Poročila na e-naslov nismo mogli poslati«
([ResultsView.tsx:390-393](../../src/components/Results/ResultsView.tsx)) in gumb »Priprava v PDF« z
napisom »povzetek za svetovalca — vaši odgovori na enem mestu«
([NextSteps.tsx:50-55](../../src/components/Results/NextSteps.tsx)), dokument pa vsebuje oceno ustreznosti,
ugovore z odgovori in priporočilo licenc. Lead je medtem praviloma vseeno v preglednici (skripta konča,
potem ko je aplikacija obupala) in poročilo pride po e-pošti.

*Priporočilo:* ob `delivery_failed` ponuditi samo strankin PDF in telefon; pripravo samo brez webhooka
in v internem načinu. Sprememba: [deliverLead.ts:394](../../src/lib/deliverLead.ts) in
[:406](../../src/lib/deliverLead.ts) ter test »neuspela dostava: priprava se ponudi stranki, da se lead
ne izgubi« v `deliverLead.test.ts`. Pred odločitvijo: pogostost `lm10_delivery_failed` v listu `Dogodki`
pove, kako pogosto se to danes zgodi.

### B6. Odločitev: poved o zasebnosti proti merjenju lijaka

Edina obljuba o podatkih, ki jo obiskovalec prebere, je na uvodnem zaslonu
([StepIndustry.tsx:161](../../src/components/Calculator/StepIndustry.tsx), besedilo
[copyTypes.ts:278-279](../../src/config/copy/copyTypes.ts)): *»Ves izračun poteka v vašem brskalniku. Nič
od vnesenih podatkov ne zapusti brskalnika, dokler se sami ne odločite oddati obrazca za PDF poročilo.«*

Dejansko od prvega izrisa na isti webhook odhajajo dogodki lijaka
([analytics.ts:100-113](../../src/lib/analytics.ts)): naključni id obiska (samo v pomnilniku strani,
[funnel.ts:15-20](../../src/lib/funnel.ts)), razred zaslona, `utm_source`, dosežen korak, izbrana dejavnost
in segment, število izbranih področij, **vir** vsake postavke finančne osnove (vneseno / povprečje /
razpon) — ne vrednosti in ne kontakt ([funnel.ts:168-179](../../src/lib/funnel.ts)). Obljuba torej drži za
vtipkane številke; izbrana dejavnost pa je tudi vnos. Privolitev, ki »spremljanje aktivnosti« izrecno
pokriva, se pridobi šele na obrazcu ([EmailGate.tsx:381-392](../../src/components/Results/EmailGate.tsx)).
Utemeljitev, da beacon brez shranjenega identifikatorja po ZEKom-2 privolitve ne terja, je v komentarju
[funnel.ts:15-20](../../src/lib/funnel.ts) — stališče kode, ne pravni nasvet. Piškotkov ni; `localStorage`
nosi samo temo, `sessionStorage` napredek.

*Priporočilo:* en dodaten stavek ob obstoječem: *»Beležimo le, do katerega koraka pridete — brez vnosov
in brez piškotkov.«* Odprto od 7. 9.

### B7. Kontrolni seznam po objavi

1. `/kalkulator/`, `/kalkulator/proizvodnja/`, `/kalkulator/karta/` se odprejo; v konzoli ni 404 in ne
   sporočil o MIME. `/kalkulator/proizvodnja` brez poševnice → 301 na poševnico.
2. `curl -I` na `assets/index-*.js` → JavaScript in `max-age=31536000, immutable`; na `index.html` →
   `no-cache`.
3. Izvorna koda strani: `canonical` in `og:url` = `https://www.datalab.si/kalkulator/`, `og:image` se
   odpre, `og:description` brez »brez vnosa« (A1), privolitev s povezavo (A2). Kartico preveriti z
   LinkedInovim Post Inspectorjem, ne z objavo.
4. Ena prava oddaja **brez** `?debug=1`: rezultati kažejo »Poročilo pošiljamo na …« in gumb za prenos
   (način AC — potrditve ob oddaji ni), **brez** gumba »Priprava v PDF«. Če se ta pokaže, dostava ni uspela.
5. `/exec`: nova vrstica, svež čas pri »Zadnje poročilo stranki«, »Poročilo na Drivu«, »Dogodki lijaka«;
   »Zadnji v AC« s `kontakt <id>` (vroča pot) ali `ura:` v naslednji minuti.
6. E-pošta prispe stranki (vpisani naslov) in prodaji — edini dokaz od konca do konca, da obe
   avtomatizaciji v AC delujeta z nove objave.
7. Testno vrstico izbrisati kot vrstico, testni kontakt v AC ročno (na obeh seznamih).

## C. Priporočila kmalu po objavi (ne blokirajo)

### C1. Sprejemnik brez varoval pred zlorabo

`ZETON: ''` ([Koda.gs:97](../../tools/google-sheet/Koda.gs)) — preverjanje v
[Koda.gs:496-498](../../tools/google-sheet/Koda.gs) se preskoči; naslov webhooka je v javnem svežnju
(potrjeno v objavi na Pages). Telo gre v `JSON.parse` brez omejitve velikosti
([:509](../../tools/google-sheet/Koda.gs)), omejevanja hitrosti in dedupliciranja ni. `zdruziVrednosti`
prepiše **poljubna** imena stolpcev iz telesa ([:647-651](../../tools/google-sheet/Koda.gs)),
`zapisiVrstico` neznana imena pripne v glavo ([:727-730](../../tools/google-sheet/Koda.gs)) — en sovražen
POST lahko listu `Leadi` doda poljubno število stolpcev. Vsaka oddaja stane dva zapisa na Drive, klice v
AC in delo ure; kvota sprožilcev je 90 minut na dan ([Koda.gs:3690](../../tools/google-sheet/Koda.gs)) —
robotski val jo izčrpa in pravi leadi obstanejo. Žeton robote ustavi, človeka ne (komentar
[:93-95](../../tools/google-sheet/Koda.gs)); vrstni red vklopa je v razdelku D pregleda 7. 9. Poleg
žetona: omejitev velikosti telesa, imena stolpcev omejiti na znana, preprost števec na minuto v
`CacheService`.

### C2. Objava ne čaka na teste

[deploy.yml](../../.github/workflows/deploy.yml) ob potisku na `main` požene samo `npm ci`, karto in
`npm run build` (typecheck je v gradnji); `ci.yml` (lint, typecheck, `npm test`, `preizkus.mjs`) teče
vzporedno in objave ne zadržuje — rdeč CI objave ne ustavi. Za novo objavo to velja enako. Popravek:
teste v opravilo objave ali odvisnost prek `workflow_run`.

### C3. Odprti hrošči toka iz pregleda 3. 9.

A3 (menjava dejavnosti se zapiše ob vsaki spremembi,
[StepIndustry.tsx:108,142](../../src/components/Calculator/StepIndustry.tsx); brisanje odgovorov samo v
`onNext`, [CalculatorFlow.tsx:862-875](../../src/components/Calculator/CalculatorFlow.tsx); brskalnikov
Nazaj tega ne razveljavi) in **A4** (`submitted`, `lead`, `salesReport`, `customerReport` preživijo menjavo
segmenta; [:522](../../src/components/Calculator/CalculatorFlow.tsx) obrazec preskoči → druga oddaja ne
odide, prodaja ima lead stare dejavnosti) sta še odprta, prav tako C3, C4, C6 in C7. A4 ima prodajno ceno,
zato prvi.

### C4. Neobravnavane napake pri prenosih

Predhodno nalaganje `void import()` brez `.catch`
([CalculatorFlow.tsx:700-701](../../src/components/Calculator/CalculatorFlow.tsx)) in gumb »Priprava v
PDF« ([:1044-1054](../../src/components/Calculator/CalculatorFlow.tsx), klic neposredno iz
[NextSteps.tsx:53](../../src/components/Results/NextSteps.tsx)) — padel uvoz ali generator vrže brez
sporočila. Strankin prenos sporočilo ima (»Priprava PDF-ja ni uspela …«,
[ResultsView.tsx:354-361](../../src/components/Results/ResultsView.tsx)).

### C5. Dokumentacija, ki bo po selitvi lagala

README »Objava« ([README.md:46-69](../../README.md)) pozna samo Pages in Vercel; primeri naslovov
[README.md:104-106](../../README.md); [README.md:863-865](../../README.md) (pravilnik);
[.env.example:15-22](../../.env.example) (`/leadmagnetdl/`);
[EmailGate.tsx:16-17](../../src/components/Results/EmailGate.tsx);
[tools/karta-vprasalnika/README.md:71](../../tools/karta-vprasalnika/README.md); kampanjski dokument (B4);
odprto vprašanje 3 (»domena«) v [README.md:1096](../../README.md) je s selitvijo odgovorjeno.

### C6. Noga s podatki družbe

Stran nima noge: `App.tsx` izriše glavo in `<main>`, edina identifikacija podjetja je v besedilu
privolitve (Datalab SI d.o.o., Datalab d.d.). Izjava o omejitvi (»samostojna ocena za interno rabo, ne
plačan strokovni pregled«, [pdfKit.ts:362-363](../../src/lib/pdfKit.ts)) je samo v PDF-jih, na zaslonu je
ni. Kratka noga s podjetjem, povezavo na pravilnik in izjavo bi zaprla oboje.

### C7. Drobno

- »ZAČASNO« logotipi: storitve in inženiring nosita PANTHEON Enterprise
  ([pantheonLogos.ts:64-74](../../src/config/pantheonLogos.ts)) — vidno v glavi in v obeh PDF-jih.
- ICP ocena (`icpTotal`, `icpBand`) ni v izvoznem zapisu — kampanja jo pričakuje za merjenje kakovosti
  leadov ([linkedin-gradbenistvo-heyreach.md:222-223](../../navodila/kampanje/linkedin-gradbenistvo-heyreach.md)).
- Odprti točki iz README ([README.md:1093-1098](../../README.md)): interna potrditev naslovljivih deležev in
  strokovna potrditev besedil »3 ukrepov« — vsebinski, ne tehnični.

## D. Kar je v redu ali zavestno sprejeto

- **Poti.** Edina raba `import.meta.env.BASE_URL` je [App.tsx:23](../../src/App.tsx) in je pravilna;
  vstopne strani dejavnosti nastanejo ob gradnji ([vite.config.ts:105-121](../../vite.config.ts)); pisave
  prek relativnih `url()`, logotipi kot uvoženi SVG-ji ([pantheonLogos.ts](../../src/config/pantheonLogos.ts));
  `public/` iz kode ni sklican (favicon-e v `index.html` prepiše Vite). `public/logo-datalab.png` je
  osirotel — ne moti.
- **Brez razvojnih sledi.** Nobenega `console.log`, `debugger`, TODO/FIXME, `lorem`, `example.com` v
  `src/` in `content/`; devet `console.warn` samo ob napakah dostave; vrstica `[dev]` je za
  `import.meta.env.DEV`.
- **Dostopnost in mobilno.** `lang="sl"`, viewport, `<label>`/`<legend>` povsod, `aria-invalid` in
  `aria-describedby` na napakah, brez pozitivnih `tabIndex`, brez fiksnih pikselskih širin, tipni cilji
  44 px.
- **Razmeščena skripta je aktualna.** `/exec` 11. 9. izpisuje vseh 20 diagnostičnih vrstic iz `doGet`,
  vključno s »Poročilo na Drivu«, »Ponovno naročilo obstoječih« in »Dogodki lijaka«.
- **ActiveCampaign.** `seznam 245 + prodaja 247, polj: 21`; po izjavi naročnika obe avtomatizaciji delujeta,
  seznama ostaneta. Vroča pot ob oddaji pade na uro (»AC ob oddaji ni uspel — pobere ura«,
  [Koda.gs:2371](../../tools/google-sheet/Koda.gs); rok 6 s, [:2766](../../tools/google-sheet/Koda.gs));
  aplikacija tedaj pokaže »Poročilo pošiljamo … Prispe v nekaj minutah« in obdrži gumb
  ([deliverLead.ts:433-437](../../src/lib/deliverLead.ts)) — skladno, ura teče
  (`Zadnji v AC: 2026-09-11 … — ura`). MailApp je izklopljen namenoma (`Obvestila: IZKLOPLJENA`), obvestilo
  prodaji je avtomatizacija na seznamu 247.
- **Prodajna vsebina je v javnem svežnju.** `content/sales/*` (ugovori, licence, ustreznost) pristane v
  kosu `salesReport-*.js`, ker se priprava sestavlja v brskalniku — kdor išče, jo prebere. Arhitekturno
  dejstvo, ne hrošč; zabeleženo, ne spreminja se.
- **Meta.** `og-image.png` 1200×630 obstaja; `canonical`, `og:url` in `og:image` nastanejo iz
  `VITE_PUBLIC_URL` (B1). `<noscript>` ni — brez JS je stran prazna; za ta lead magnet sprejemljivo.
- **CSP.** `www.datalab.si` danes ne pošilja `Content-Security-Policy`; če jo kdo doda, veljajo zahteve iz
  B1 pregleda 7. 9. (`connect-src` za `script.google.com` in `script.googleusercontent.com`, `img-src data:`).

## E. Stanje ugotovitev prejšnjih pregledov

| Pregled | Ugotovitev | Stanje 11. 9. |
|---|---|---|
| 3. 9. | A1 priprava pade → lead izgubljen | popravljeno 3. 9. |
| 3. 9. | A2 uspeh samo iz HTTP statusa | popravljeno ([submitLead.ts:232-254](../../src/lib/submitLead.ts)) |
| 3. 9. | A3 menjava dejavnosti prek Nazaj | odprto → C3 |
| 3. 9. | A4 `submitted` preživi menjavo segmenta | odprto → C3 |
| 3. 9. | B6 `?debug=1` | odprto → **A4** |
| 3. 9. | B7 `og:description` | odprto → **A1** |
| 3. 9. | B8 pot objave proti dokumentaciji | `base` iz okolja rešeno 10. 9.; zastareli sklici → C5 |
| 3. 9. | C1 rok webhooka | delno: 10 s + prenos; delo skripte je zraslo → B5; **11. 9.: 25 s, B5 rešen** |
| 3. 9. | C3, C4, C6, C7 | odprto → C3 |
| 3. 9. | B1–B5, B9, B10, C2, C5, C8–C13 | v tem pregledu niso bile ponovno preverjene |
| 7. 9. | A1 trdo zapisana pot | rešeno 10. 9. (PR #34, `VITE_BASE_PATH`) |
| 7. 9. | A2, A3 MIME in privzeti dokument | → B1 (`.htaccess`) |
| 7. 9. | A4 Node 22, A5 gradbeno okolje | brezpredmetno: gradi GitHub Actions |
| 7. 9. | A6, A7 padel kos, brez meje napak | odprto → **A3** |
| 7. 9. | B1 CSP | datalab.si CSP nima; zahteve veljajo, če jo dodajo |
| 7. 9. | B2–B4 spremenljivke, predpomnjenje, karta | → B1 |
| 7. 9. | B5 iframe | sporočeno vzdrževalcu 11. 9. |
| 7. 9. | C (kar se ne podre) | nespremenjeno |
| 7. 9. | D vrstni red skripta/aplikacija | velja samo ob vklopu žetona (C1) |
| 7. 9. | E kontrolni seznam | posodobljen → B7 |
| 7. 9. | F trije popravki | `base` rešen; meja napak in besedilo napake → A3 |
