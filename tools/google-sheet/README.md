# Beleženje oddaj v Google Sheet

Vsaka oddaja obrazca doda eno vrstico v preglednico. Pot je ista, kot jo je
aplikacija imela že prej — `VITE_LEAD_WEBHOOK_URL` (`src/lib/submitLead.ts`) —
manjkal je le sprejemnik. Tu je: [`Koda.gs`](Koda.gs), Google Apps Script v
preglednici sami. Brez strežnika, brez zunanje storitve, brez stroška.

**Kaj se zabeleži.** Ista glava kot pri ročnem izvozu CSV
(`CSV_COLUMNS` v `src/lib/exportRecord.ts`): čas, dejavnost, segment, velikostni
razred, kontakt, privolitve, vsi koši zneskov, izbrana področja, triažne ocene,
zanesljivost, urni postavki z izvorom, `utm_source` in follow-up sekvenca. Skripta
doda še `prejeto` (čas prejema) in `prodajnaPriprava` (povezava do dokumenta na
Drive). Ob vsaki oddaji lahko pošlje tudi obvestilo na e-pošto (spodaj).

**Kdo v preglednico NE pride.** Kdor vprašalnik zapusti pred obrazcem — brez
e-naslova in brez privolitve zapisa ni (`buildLeadExportRecord` tedaj vrne `null`).
Za odpadanje po korakih so dogodki v `window.dataLayer` (`src/lib/analytics.ts`),
ne ta preglednica.

## Namestitev (~10 minut, enkrat)

1. **Ustvarite preglednico** — npr. „LM-10 – oddaje vprašalnika". Lista ni treba
   pripraviti: skripta list `Leadi` in glavo ustvari sama ob prvi oddaji.
2. **Razširitve → Apps Script.** V urejevalniku izbrišite vsebino datoteke
   `Code.gs` in prilepite celotno vsebino [`Koda.gs`](Koda.gs). Shranite.
3. **Razmesti → Nova razmestitev** (*Deploy → New deployment*):
   - vrsta: **Spletna aplikacija** (*Web app*),
   - *Execute as*: **Jaz** (`Me`) — skripta piše v preglednico z vašim dostopom,
   - *Who has access*: **Kdorkoli** (`Anyone`).
   Prvič bo zahtevala dovoljenja (preglednica + Drive). Google svojo neverificirano
   skripto označi z opozorilom — pot je *Napredno → Pojdi na projekt (nevarno)*;
   gre za vašo lastno kodo v vašem računu.
4. **Kopirajte naslov razmestitve** (`https://script.google.com/macros/s/…/exec`)
   in ga odprite v brskalniku. Odgovoriti mora: `LM-10 zbiralnik deluje. List: Leadi…`.
5. **Nastavite naslov v objavi.** GitHub → *Settings → Secrets and variables →
   Actions → Variables* → `VITE_LEAD_WEBHOOK_URL` = ta naslov. Objava ga prebere
   ob gradnji (`.github/workflows/deploy.yml`), zato je treba po nastavitvi
   **znova pognati deploy** — sam od sebe se v že objavljen sveženj ne prikrade.
6. **Lokalno** (neobvezno): isti naslov v `.env`, po vzorcu `.env.example`.

## Obvestilo na e-pošto ob vsaki oddaji

V `Koda.gs` na vrhu izpolnite `E_NASLOV_ZA_OBVESTILA` (več naslovov ločite z
vejico); prazno pomeni brez obvestil. Nato spremembo **razmestite kot novo
različico** (spodaj) — ob tem bo Google zahteval dodatno dovoljenje za pošiljanje
pošte v vašem imenu.

Sporočilo je sestavljeno tako, da se je mogoče odločiti brez odpiranja
preglednice: podjetje, panoga, velikost, kontakt, letni znesek po treh koših,
zanesljivost vnosa, izbrana področja in povezavi do prodajne priprave ter
preglednice. Če je obiskovalec **prosil za posvet**, se to znajde v zadevi
(`[POSVET] Nov lead: …`) — to je edino polje obrazca, ki pove namero in ne le
dovoljenja.

**Dovoljenje za pošto morate izsiliti sami.** Google ga ne zahteva ob
razmestitvi in ne ob zagonu poljubne funkcije, ampak šele ob prvem klicu
`MailApp`. Web app tedaj pade z „Nimate dovoljenja", napako pa `doPost`
namenoma pogoltne — vrstice se pišejo, pošte ni in vzroka od zunaj ni videti.
Zato: v urejevalniku izberite funkcijo **`preizkusPoste`** in kliknite *Zaženi*.
Tedaj se pojavi vprašanje za dovoljenje (*Napredno → Pojdi na projekt → Dovoli*),
v nabiralnik pa pride preizkusno sporočilo. Šele nato razmestite novo različico.

**Ko pošte ni, ne brskajte po dnevniku** — odprite naslov `/exec` v brskalniku.
`doGet` izpiše, ali so obvestila vklopljena, kdaj je nazadnje odšla pošta in kaj
je bila zadnja napaka (naslovi so v izpisu zakriti, ker je odgovor javen). Te tri
vrstice ločijo „naslov ni nastavljen" od „razmeščena je stara različica" od
„pošiljanje je vrglo napako".

Pošta gre **za** zapisom vrstice in v svojem `try/catch`: izčrpana kvota ali
napačen naslov ne smeta pomeniti, da aplikacija dostavo razume kot neuspelo in
prodajno pripravo prenese stranki. Dnevna kvota je 100 prejemnikov pri navadnem
Google računu in 1500 pri Workspacu.

**Naslov se ob lepljenju nove različice povozi.** Datoteka v repozitoriju ima
`E_NASLOV_ZA_OBVESTILA: ''`, zato ga je treba po vsakem prilepljanju vpisati
znova. `preizkusPoste` na to opozori z jasno napako namesto tihega neuspeha.

Vgrajena obvestila preglednice (*Orodja → Nastavitve obvestil*) tu **ne
delujejo** — sprožijo se ob človeškem urejanju, ne ob vpisu iz skripte.

### Ko skripto spremenite

Google poganja **razmeščeno različico**, ne tiste v urejevalniku. Po vsaki
spremembi: *Razmesti → Upravljaj razmestitve → svinčnik → Različica: Nova
različica → Razmesti*. Naslov ostane isti. Brez tega koraka teče stara koda in
videti je, kot da sprememba ni imela učinka.

## Kaj se zgodi ob napaki

Aplikacija razume neuspešno dostavo kot „prodajna priprava ni prišla do nas" in
jo tedaj prenese stranki (rezervna pot, opisana v `src/lib/deliverLead.ts`).
Skripta zato napake **ne pogoltne**: če vrstice ni mogoče zapisati, jo vrže
naprej in aplikacija pade v rezervno pot. Če odpove samo shranjevanje priprave na
Drive, se vrstica vseeno zapiše (lead je dragocenejši), v stolpcu
`prodajnaPriprava` pa ostane besedilo napake.

Dnevnik zagonov je v urejevalniku pod *Izvedbe* (*Executions*) — tam je vidna
vsaka zahteva in razlog vsake napake.

## Kar je vredno vedeti vnaprej

- **Naslov webhooka je javen.** Predpona `VITE_` pomeni, da je v svežnju
  aplikacije in ga lahko prebere vsak obiskovalec. Žeton (`NASTAVITVE.ZETON`,
  naslovu se pripne `?zeton=…`) ustavi naključne robote, ne pa nekoga, ki pogleda
  izvorno kodo. Preglednica ni mesto za nič, česar ne smete izgubiti — je zapis
  leadov, ne matična evidenca.
- **Osebni podatki.** Vrstica vsebuje ime, e-naslov, telefon in davčno številko.
  Preglednico delite le s tistimi, ki jo potrebujejo, in brisanje na zahtevo
  posameznika pomeni brisanje vrstice **in** datoteke priprave na Drive.
- **Stolpci se dodajajo na konec.** Skripta piše po imenih iz glave, zato nov
  stolpec v `CSV_COLUMNS` sam pripne novo ime; stare vrstice ostanejo poravnane.
  Ročno prerazporejanje ali preimenovanje stolpcev to podre.
- **Omejitve Apps Scripta.** Brezplačni račun zmore ~20.000 klicev URL-ja na dan
  in 90 minut izvajanja — za lead magnet neskončno daleč.
