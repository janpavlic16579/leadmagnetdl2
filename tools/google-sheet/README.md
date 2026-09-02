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

## Vrstni red stolpcev na listu

Zaporedje določa `VRSTNI_RED` v `Koda.gs` in sledi klicateljevi zanki — **kdaj,
kdo, kje dela, kako velik je, kako ga dosežem, o čem govoriti, kaj se je iz tega
izcimilo** — šele nato številke:

```
prejeto · firstName · lastName · companyName · industryLabel · employeeCount
phone · kliciTakoj · email · letno · risks
poklicano · sestanek · opombe
… nato zneski, področja, privolitve, kontekst, urne postavke
```

To ni isto kot `CSV_COLUMNS` v aplikaciji in ne sme biti: tam je zaporedje
zamrznjeno, ker so preslikave v CRM pozicijske. Tu tega tveganja ni, ker se
vrstica piše po **imenih** stolpcev — zato je vrstni red na listu prosto
premakljiv, ne da bi se aplikacije sploh dotaknili.

`SKRIJ` skrije (ne izbriše) stolpce, ki so bodisi strojni dvojniki nečesa
berljivega (`industry` proti `industryLabel`, `timestampISO` proti `prejeto`),
bodisi za vsak lead enaki (`gdprConsent`), bodisi surov JSON za analizo
(`moduleInputsJson`, `triageScores`). Med njimi je tudi `sizeClass`: velikost se
bere iz števila zaposlenih, razred pa isto podvaja. Skrit stolpec se kadarkoli
vrne z desnim klikom med sosednjima stolpcema.

### Izpeljana stolpca in stolpci za klicatelja

Štirih stolpcev aplikacija ne pošlje — nastanejo tu:

| Stolpec | Kaj je |
|---|---|
| `kliciTakoj` | `DA`, kadar je obiskovalec prosil za posvet. Isto pove `consentConsulting`, le strojno; ta ostane skrit za filtre. |
| `letno` | Odliv + nezaslužena marža + vrednost časa. Ista številka kot v e-obvestilu; doslej je klicatelj moral seštevati tri stolpce. |
| `poklicano` | Potrditveno polje. Prazno = klic še ni opravljen. |
| `sestanek` | Spustni seznam: `sestanek`, `ne želi`, `drugič`. |
| `opombe` | Prosto besedilo, oblikovano kot navadno besedilo, da vpisani datum ali `=` ostaneta, kar sta. |

Zadnji trije so **klicateljevi** in jih oddaja ne more povoziti: vrstica se piše
po imenih stolpcev, teh imen pa v oddaji ni. Nova oddaja jih v svoji vrstici
pusti prazne in se že vpisanih vrstic sploh ne dotakne.

**IMEN NE PREIMENUJTE.** Vezava je po imenu; preimenovan stolpec skripta razume
kot tuj in ob naslednji oddaji nastane nov, prazen zraven. Če je glava
nerazumljiva, se z miško ustavite nad njo — pojasnila so pripeta kot opombe.

**Za že zapisane vrstice** je treba enkrat pognati funkcijo **`urediStolpce`**
(v urejevalniku izberite ime funkcije in kliknite *Zaženi*). Preuredi obstoječe
stolpce, skrije naštete, zamrzne glavo, nastavi širine in datumsko obliko. Varno
jo je pognati večkrat — drugič ne spremeni ničesar. Nove oddaje po tem posegu
same padejo v prave stolpce, ker se pišejo po imenih.

**Vrstni red je pomemben: najprej razmestite novo različico, šele nato poženite
`urediStolpce`.** `urediStolpce` teče iz kode v urejevalniku, `doPost` pa iz
razmeščene — v obratnem vrstnem redu bi list dobil nove stolpce, webhook pa bi
jih še naprej puščal prazne.

Pred prvim zagonom naredite *Datoteka → Ustvari kopijo*. Pravi „razveljavi" za
skriptni zapis je sicer *Datoteka → Zgodovina različic*, a kopija je cenejša od
ugotavljanja, katera različica je bila prava.

Preurejanja **ne** počne `doPost`, in to je namerno: prepisovanje celega lista ob
vsaki oddaji bi pomenilo, da ena prekinjena izvedba premeša vse leade. Poseg je
zato reden, zaveden in ročen.

`urediStolpce` ob vsakem zagonu tudi **pobriše prazne vrstice pod podatki**.
Google namreč za „uporabljeno" šteje tudi vrstico, ki ima samo obliko in nobene
vsebine — in če oblikovanje enkrat seže čez ves list, `getLastRow` skoči na dno,
naslednja oddaja pa pristane pod stotinami praznih vrstic. Zato oblike in
spustni seznami segajo natanko čez vrstice s podatki; novim vrsticam jih ob
zapisu doda `opremiVrstico`.

`urediStolpce` in `doPost` si delita isto skriptno ključavnico, zato oddaja med
preurejanjem počaka (do 30 s) in ne more pristati v listu po starem zaporedju
stolpcev — taka vrstica bi bila tiho zamaknjena in videti povsem pravilna.

Česar prepis **ne** ohrani: formule in datumov, ki bi ju kdo natipkal v celico.
`opombe` so pred tem zaščitene z obliko „navadno besedilo"; drugod v list ne
pišite ročno.

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
