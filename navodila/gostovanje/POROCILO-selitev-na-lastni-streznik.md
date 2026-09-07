# Selitev kalkulatorja na lasten strežnik — kaj se podre in kaj ne

Pregled opravljen 2026-09-07 na veji `prenova-prodajne-priprave`. Vprašanje, na
katerega odgovarja: *„ko bom aplikacijo hostal, dal na strežnik — a to kaj podere
sistem?"* Predpostavka pregleda: aplikacija se preseli z GitHub Pages drugam
(lastna domena, nginx, IIS, Netlify, Vercel), **Apps Script in ActiveCampaign
ostaneta nespremenjena**.

Pregledanih 111 ugotovitev iz osmih neodvisnih pregledov kode. Od tega 16 blokad,
50 tihih okvar, 16 kozmetičnih in 29 mest, kjer bi človek okvaro pričakoval, pa
je ni.

## Povzetek v treh stavkih

**Zbiralnik se ne podre.** Pot od obrazca prek Apps Scripta v Google Sheet in
ActiveCampaign je popolnoma neodvisna od tega, kje stran gostuje.

**Podre se lahko stran sama**, in sicer skoraj vedno kot bela stran — ker so poti
do datotek vezane na eno samo podmapo.

**Najdražje napake so tihe.** Vprašalnik deluje, obiskovalec vidi rezultate, v
preglednico pa ne pride nič. Nihče tega ne opazi, dokler kdo ne vpraša, zakaj ni
leadov.

## A. Blokade — stran se sploh ne odpre

### A1. Pot objave je trdo zapisana

`base: '/leadmagnetdl2/'` ([vite.config.ts:89](../../vite.config.ts)) Vite ob
gradnji vpeče kot **absolutno** predpono v vsak sklic v `index.html`: vstopni
skript, CSS, ikone, prednaložene pisave. Zgrajena stran zato zahteva, da stoji
natanko na tej podpoti — ne v korenu domene, ne na `/kalkulator/`, niti ne na
`/leadmagnetdl/` brez dvojke.

*Simptom:* popolnoma bela stran. V konzoli vrsta 404, ali pa strežnikova
404-stran, ki jo brskalnik zavrne kot modul („Expected a JavaScript module
script but the server responded with a MIME type of text/html").

*Rešitev:* pred gradnjo nastavi `base` na dejansko pot, z vodilno **in** zaključno
poševnico — `'/'` za koren domene, `'/kalkulator/'` za podmapo. Ker se pot zdaj
lahko določi šele ob objavi, jo je smiselno brati iz okolja
(`base: process.env.VITE_BASE_PATH ?? '/leadmagnetdl2/'`) in jo nastavljati enako
kot `VITE_LEAD_WEBHOOK_URL`. Različica `base: './'` deluje na katerikoli poti, a
le, če strežnik naslov brez zaključne poševnice preusmeri na tistega z njo.

### A2. MIME tipi

Vstopna točka je `<script type="module">`, pisave so `.woff2`. Brskalnik modul
zavrne, če Content-Type ni JavaScript — in to brez 404, samo s sporočilom v
konzoli. Dve pogosti pasti: nginx v ročno napisanem `server {}` brez
`include mime.types;` postreže vseh 21 datotek `.js` kot `application/octet-stream`;
IIS privzeto sploh ne pozna `.woff2` in `.mjs` ter vrne 404.

*Rešitev:* `.js`/`.mjs` → `text/javascript`, `.woff2` → `font/woff2`,
`.svg` → `image/svg+xml`, `.json` → `application/json`. Preizkus po objavi:
`curl -I .../assets/index-*.js` mora vrniti javascript, ne octet-stream.

### A3. Privzeti dokument

Kampanjske povezave kažejo na koren, ne na `/index.html`. GitHub Pages to naredi
sam; nginx samo ob direktivi `index index.html;`, sicer vrne 403. Isto velja
ločeno za podmapo `/karta/`.

### A4. Gradnja terja Node 22

[`.nvmrc`](../../.nvmrc) zahteva 22, ker so odvisnosti Vite 8, TypeScript 6 in
Vitest 4. Korporativni build agent pogosto stoji na 18 ali 20. Ta odpove glasno —
objave preprosto ne bo.

### A5. Naslov webhooka je vpečen v sveženj

`VITE_LEAD_WEBHOOK_URL` ([src/lib/webhookUrl.ts:14](../../src/lib/webhookUrl.ts))
Vite ob gradnji zamenja z literalom. Konfiguracije ob zagonu ni nobene — ne
`config.json`, ne globalna spremenljivka, ne parameter naslova.

Posledica za predajo: skrbnik, ki dobi samo zapakiran `dist`, naslova ne more
zamenjati z nobeno nastavitvijo strežnika. **S stranjo mora potovati gradbeno
okolje**, ne le `dist`: repozitorij, Node 22 in obe spremenljivki v novem
cevovodu. Vsaka sprememba naslova ali žetona pomeni novo gradnjo, ne nastavitve
strežnika.

### A6. Padec enega kosa svežnja ustavi oddajo

`loadDeliveryModules` ([src/lib/deliverLead.ts:142](../../src/lib/deliverLead.ts))
naloži šest kosov z enim `Promise.all`. Varovana z `.catch()` sta samo oba za
PDF; štirje obvezni — `salesReport`, `salesReportHtml`, `exportRecord`,
`submitLead` — nista. Ti kosi se prenesejo šele ob kliku **Oddaj**, torej po
desetih minutah izpolnjevanja in tik pred edino konverzijo.

*Simptom:* rdeča ploskev „Oddaja ni uspela", rezultatov obiskovalec nikoli ne
vidi. V preglednici ni vrstice, v ActiveCampaignu nič, med dogodki lijaka pa ni
niti `lm10_lead_submitted` niti `lm10_delivery_failed` — izgleda natanko kot
navadna opustitev na sedmem koraku.

Zaslon napake povrhu naroči „Poskusite znova", kar ne more delovati: brskalnik si
neuspešen dinamični uvoz zapomni in ponovni klik ne sproži nobene omrežne
zahteve. Pomaga samo osvežitev strani, ki napredek ohrani
([src/lib/progressStorage.ts](../../src/lib/progressStorage.ts)), a besedilo tega
ne pove.

### A7. Graf na rezultatih nima mreže pod seboj

`BreakdownChart` je `lazy()` in ovit samo v `Suspense`
([src/components/Results/ResultsView.tsx:32](../../src/components/Results/ResultsView.tsx)).
Suspense ujame čakanje, ne napake, meje napak (`ErrorBoundary`) pa v aplikaciji
ni nikjer — preverjeno z iskanjem po vsem `src/`. Če manjka ta kos, React vrže
med izrisom in odklopi celotno korenino.

*Simptom:* bela stran namesto rezultatov, in to **šele po uspešni oddaji** — ko
je lead že v preglednici in je obiskovalec dal kontakt.

## B. Tihe okvare — vprašalnik dela, leadov ni

### B1. Content-Security-Policy

Korporativni strežnik (nginx, IIS, WordPress na `www.datalab.si`) pogosto doda
CSP. `connect-src 'self'` ali `default-src 'self'` blokira POST na Google.

*Simptom:* obiskovalec normalno vidi rezultate in ne opazi ničesar. V preglednico
ne pride nobena vrstica, obvestila prodaji utihnejo, lijak se izprazni.

*Rešitev:* v `connect-src` obe domeni — `https://script.google.com` in
`https://script.googleusercontent.com` (druga je cilj preusmeritve), v `img-src`
pa `data:`, sicer iz glave PDF izgine logotip.

### B2. Manjkajoči spremenljivki okolja

Brez `VITE_LEAD_WEBHOOK_URL` aplikacija ne javi ničesar — tiho pade v rezervno
pot in prodajno pripravo, dokument napisan **o** stranki, prenese stranki sami.
Brez `VITE_PUBLIC_URL` odpadejo `canonical`, `og:url` in `og:image`; deljena
povezava je brez predogledne kartice.

### B3. Predpomnjenje in atomarnost objave

GitHub Pages pošlje vsemu `Cache-Control: max-age=600`. Privzeti nginx ne pošlje
ničesar in brskalnik uporabi hevristično svežino. Obiskovalec, ki je stran videl
pred objavo, tedaj dobi star `index.html`, ki zahteva datoteke z zgoščenkami, ki
jih na strežniku ni več — kar pripelje naravnost v A6 in A7.

*Rešitev:* dve ločeni pravili. Vse pod `/assets/`:
`public, max-age=31536000, immutable` (varno, ker so imena zgoščena). `index.html`
in `karta/index.html`: `no-cache`. Pravilo veži na **pot** `/assets/`, ne na
končnico — sicer zamrzneš `og-image.png` v korenu, ki se ob spremembi kampanje
menja.

### B4. Karta vprašalnika nastane samo v CI

`public/karta/index.html` ni v gitu; sestavita ga dva ukaza, ki tečeta v
[deploy.yml:32-34](../../.github/workflows/deploy.yml) **pred** `npm run build`.
Nov cevovod, ki požene samo `npm run build`, objavi `dist` brez karte.

### B5. Vgradnja v iframe

Če aplikacije ne postavijo kot samostojno stran, ampak jo vgradijo v obstoječo
prek `iframe`, se podre več stvari hkrati: `window.scrollTo` podrsa okvir namesto
nadrejene strani, `sessionStorage` s tujega izvora lahko odpade in z njim ves
napredek. Aplikacijo objavi kot samostojno stran na svojem naslovu.

## C. Kar se NE podre

- **Apps Script.** `doPost` preverja samo neobvezen žeton iz naslova in prisotnost
  telesa ([Koda.gs:313](../../tools/google-sheet/Koda.gs)). Glav zahteve mu Google
  sploh ne poda, zato `Origin` ali `Referer` niti ne more preveriti. Nova domena
  ne terja nobene spremembe skripte in nobene nove razmestitve.
- **CORS.** Oddaja gre kot „enostavna" zahteva s `text/plain`, dogodki lijaka prek
  `sendBeacon` z istim tipom. Predhodne zahteve `OPTIONS`, na katero Apps Script
  ne zna odgovoriti, ni.
- **ActiveCampaign.** Ključ je v lastnostih skripte, torej v Googlovem oblaku.
  Selitev aplikacije ga ne premakne in priklopa ni treba ponavljati.
- **SPA fallback.** Aplikacija nima usmerjevalnika; `history.pushState` se kliče
  brez tretjega argumenta, zato se naslov nikoli ne spremeni in strežnik globoke
  poti nikoli ne vidi. Pravila `try_files $uri /index.html` **ne** nastavljaj.
- **HTTPS.** Blokada mešane vsebine velja v nasprotno smer, zato bi pot do
  webhooka delovala tudi s `http`. Vseeno postavi HTTPS: oznaka „Ni varno" tik ob
  polju za e-naslov je na lead magnetu draga.

## D. Vrstni red korakov — dve uskladitvi terjata nasprotno zaporedje

To je najbolj zahrbtna past pregleda, ker jo „ena velika razmestitev" zanesljivo
ubere narobe.

**Lijak** zahteva, da je skripta prva: nova aplikacija ob stari razmeščeni skripti
pomeni, da dogodki odpadejo — stara koda nima veje `if (oddaja.events)`
([Koda.gs:328](../../tools/google-sheet/Koda.gs)) in pade na „V telesu ni zapisa".

**Žeton** zahteva, da je aplikacija prva: nova skripta z žetonom ob stari
aplikaciji brez njega pomeni, da je zavrnjeno **vse**. Preverjanje žetona stoji na
vrstici 313, torej **pred** razvejitvijo na dogodke — pade oboje, leadi in lijak.

Vrstni red brez okna izgube:

1. Prilepi novo `Koda.gs` z `ZETON: ''` in razmesti **novo različico obstoječe
   razmestitve**. Stare aplikacije to ne prizadene.
2. Zgradi in objavi aplikacijo na novem strežniku — z `?zeton=T` že v naslovu, če
   ga nameravaš vklopiti.
3. Šele zdaj vpiši `ZETON: T` v skripto in razmesti še eno novo različico.

Med tem nikoli ne uporabi *Razmesti → Nova razmestitev*: ta skuje **nov naslov**
`/exec`, aplikacija pa naslova ne more slediti brez ponovne gradnje. Vedno
*Upravljaj razmestitve → svinčnik → Nova različica*.

## E. Kontrolni seznam po objavi

1. Stran se odpre in ni bela. V konzoli ni 404 in ni sporočil o MIME.
2. `curl -I .../assets/index-*.js` vrne javascript.
3. Ena testna oddaja **brez** `?debug=1`. Če se na rezultatih pojavi gumb
   „Priprava v PDF", dostava **ni** uspela — ta gumb pomeni natanko to
   ([deliverLead.ts:237](../../src/lib/deliverLead.ts)).
4. `/exec` v brskalniku: nova vrstica, sveža „Zadnja poslana pošta" s pripisom
   `(priloge: 2)`, sveži „Dogodki lijaka" in „Zadnji v AC".
5. Kontakt v ActiveCampaignu obstaja, z oznakami in polji.
6. Odpri `/karta/` s poševnico in brez nje.
7. Testno vrstico **izbriši kot vrstico** (desni klik → Izbriši vrstico), ne
   počisti z Delete: prazna, a oblikovana vrstica ostane za Google „uporabljena"
   in leadi začnejo pristajati pod njo. Testni kontakt v ActiveCampaignu izbriši
   ročno — brisanje vrstice v preglednici tam ne odstrani ničesar.

## F. Kar bi bilo vredno popraviti v kodi, neodvisno od selitve

Trije popravki bi odstranili najdražje tihe okvare. Nobeden ni pogoj za selitev.

- **Meja napak okoli korenine** (`ErrorBoundary` v
  [main.tsx](../../src/main.tsx)) — danes en manjkajoč kos pobeli cel zaslon po
  uspešni oddaji (A7).
- **`base` iz okolja** namesto trdo zapisanega (A1) — s tem postane objava na
  poljubno pot nastavitev in ne poseg v kodo.
- **Besedilo napake ob padli oddaji** naj vodi v osvežitev in ne v „Poskusite
  znova", ki po padlem uvozu ne more uspeti (A6).
