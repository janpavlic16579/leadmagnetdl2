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

Sporočilo ima **pripeta oba PDF-ja** — poročilo za stranko in pripravo na
pogovor, isti datoteki, kot ju aplikacija zgradi za stranko oziroma svetovalca.
Aplikacija ju pošlje v telesu zahteve kot base64 (`attachments`,
`src/lib/submitLead.ts`), skripta ju dekodira (`pripraviPriloge`) in pripne;
vrstica »Priloge:« v sporočilu našteje imeni datotek ali pove, da ju aplikacija
ni poslala (starejši build, PDF v brskalniku ni nastal). Pokvarjena priloga se
preskoči — vrstica in sporočilo nista nikoli odvisna od nje. Skupaj merita okoli
100 kB; meja MailApp za sporočilo je 25 MB. Prilogi zahtevata **novo različico**
skripte in aktualen build aplikacije; stara skripta polje prezre, nova brez
njega dela naprej.

**Dovoljenje za pošto morate izsiliti sami.** Google ga ne zahteva ob
razmestitvi in ne ob zagonu poljubne funkcije, ampak šele ob prvem klicu
`MailApp`. Web app tedaj pade z „Nimate dovoljenja", napako pa `doPost`
namenoma pogoltne — vrstice se pišejo, pošte ni in vzroka od zunaj ni videti.
Zato: v urejevalniku izberite funkcijo **`preizkusPoste`** in kliknite *Zaženi*.
Tedaj se pojavi vprašanje za dovoljenje (*Napredno → Pojdi na projekt → Dovoli*),
v nabiralnik pa pride preizkusno sporočilo. Šele nato razmestite novo različico.

**Izid zadnjega zagona `urediStolpce`** je prav tako viden na naslovu `/exec`:
kdaj je tekel, koliko stolpcev in vrstic je uredil oziroma s katero napako je
padel, ter koliko vrstic in stolpcev ima list. Ročni zagon je namreč videl samo
tisti, ki je bil takrat pred zaslonom.

**Ko pošte ni, ne brskajte po dnevniku** — odprite naslov `/exec` v brskalniku.
`doGet` izpiše, ali so obvestila vklopljena, kdaj je nazadnje odšla pošta (s
številom prilog — `(priloge: 2)` pove, da razmeščena različica prilogi pripenja)
in kaj je bila zadnja napaka (naslovi so v izpisu zakriti, ker je odgovor javen).
Te tri vrstice ločijo „naslov ni nastavljen" od „razmeščena je stara različica"
od „pošiljanje je vrglo napako".

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

`urediStolpce` ob vsakem zagonu tudi **pobriše vse prazne vrstice** — tako tiste
pod podatki kot praznino med njimi.
Google namreč za „uporabljeno" šteje tudi vrstico, ki ima samo obliko in nobene
vsebine — in če oblikovanje enkrat seže čez ves list, `getLastRow` skoči na dno,
naslednja oddaja pa pristane pod stotinami praznih vrstic. Zato oblike in
spustni seznami segajo natanko čez vrstice s podatki; novim vrsticam jih ob
zapisu doda `opremiVrstico`.

**Če se zdi, da se leadi ne vpisujejo več**, najprej odprite naslov `/exec` v
brskalniku in poglejte število vrstic. Če je bistveno večje od števila leadov, se
vpisujejo — le da pristajajo pod praznino, ki jo je nekaj ustvarilo (ročno
dodane vrstice, oblikovanje čez ves list). Zagon `urediStolpce` praznino pobriše
in naslednji lead spet pristane tik pod prejšnjim. Prazna je samo vrstica, v
kateri ni prav ničesar — vrstica z zgolj klicateljevo opombo ostane.

`urediStolpce` in `doPost` si delita isto skriptno ključavnico, zato oddaja med
preurejanjem počaka (do 30 s) in ne more pristati v listu po starem zaporedju
stolpcev — taka vrstica bi bila tiho zamaknjena in videti povsem pravilna.

Pred postavitvijo videza se **odstranijo oblike števil, zapiski in pravila
veljavnosti** — vse troje se s prerazporeditvijo ne premakne in bi obviselo nad
napačnim stolpcem. Pri veljavnosti to vrže napako, pri oblikah in zapiskih pa
nič: ure na mesec bi se v podedovani obliki brale kot evri, nad glavo pa bi
viselo pojasnilo sosednjega stolpca. `urediVidez` vse troje takoj za tem postavi
znova, po imenu stolpca.

Pred prepisom se **odstranijo pravila veljavnosti** (spustni seznam, potrditveno
polje). Nujno: seznam v stolpcu `sestanek` je strog, veljavnost pa se s
prerazporeditvijo ne premakne — ostane na stari fizični celici, in ko prepis vanjo
zapiše podatek drugega stolpca, ga Google zavrne in cel poseg pade. `urediVidez`
pravila takoj za tem postavi znova, po imenu stolpca.

Česar prepis **ne** ohrani: formule in datumov, ki bi ju kdo natipkal v celico.
`opombe` so pred tem zaščitene z obliko „navadno besedilo"; drugod v list ne
pišite ročno.

## List „Analitika"

Nastane in se sestavi sam ob vsakem zagonu `urediStolpce`; posebej ga je mogoče
osvežiti s funkcijo **`urediAnalitiko`**.

| Kje | Kaj |
|---|---|
| vrstici 5–6 | **Kartice**: še za poklicati (rdeča — edina, ki je naloga in ne podatek), prosijo za posvet, poklicani, leadov skupaj, letni znesek |
| pod njimi | **Štirje grafi**: lijak od leada do sestanka, izidi klicev, leadi po mesecih, leadi po dejavnosti |
| vrstica 44 | **Za poklicati** — samodejen seznam tistih, ki prosijo za posvet in še niso poklicani, najstarejši najprej |
| stolpec N naprej | **Podatki za grafe**: podrobne številke, lijak, izidi, po mesecih, po dejavnosti, viru, zanesljivosti in velikosti |

Podatkovni del stoji desno zato, ker graf v preglednici ne zna računati —
potrebuje vir na listu, in to v sosednjih stolpcih (oznaka, število). Tabele
torej morajo obstajati, le da človek vanje ne gleda. Delovna vrsta je čisto
spodaj, ker se `FILTER` razteza navzdol in bi karkoli pod njim ob prvem večjem
odgovoru dobilo `#REF!`.

**Vse številke so žive formule, ne posnetek.** To ni podrobnost izvedbe:
klicatelj obkljuka `poklicano` in izbere `sestanek` ročno, skripta o tem ne izve
nikoli, in izračun ob oddaji leada bi bil zastarel od prve kljukice naprej — pri
čemer bi bile številke videti sveže. Tako pa se preračunajo v isti sekundi.

**V list ne pišite ročno.** Ob vsakem zagonu `urediStolpce` se sestavi na novo in
dopisano se izgubi; list zato ob urejanju opozori (opozorilo, ne prepoved).

Če kakšnega stolpca v `Leadi` ni, se analitika ne sestavi in `urediStolpce` to
pove v izpisu — urejanje leadov se zaradi tega **ne** razveljavi.

### Kaj ta list namenoma ne pove

- **Kdaj je bil lead poklican.** Potrditveno polje ne hrani časa, zato „povprečen
  čas od oddaje do klica" ni izračunljiv — ne s formulo ne s skripto. Za to bi
  bila potrebna sprožilec ob urejanju in nov stolpec z datumom.
- **Koliko obiskovalcev je odpadlo pred obrazcem.** V preglednico pridejo samo
  oddaje s privolitvijo; lijak obiskovalec → lead merijo dogodki v
  `src/lib/analytics.ts`, ne ta list. Kdor bi ga sestavil iz teh številk, bi meril
  samo tiste, ki so vprašalnik prehodili do konca.
- **Odstotkov pri malo klicih.** „Sestanki na poklicanega" pod desetimi klici
  pokaže `n=3 — premalo za odstotek`. Namerno: pri treh klicih odstotek skače med
  0, 33, 67 in 100 in se v ponedeljek prepolovi. „Delež poklicanih" te zapore
  nima, ker ni ocena o trgu, ampak napredek lastnega dela.
- Namesto povprečja letnega zneska sta tu **mediana in največji posamezen znesek**:
  pri nekaj leadih en velik posel povsem določi povprečje in številka govori o
  njem, ne o lijaku.

Celica **A3** je kontrolna: dokler je prazna, formule kažejo na prave stolpce. Če
se v njej pojavi opozorilo, so se stolpci na `Leadi` premaknili — poženite
`urediAnalitiko`. Če je na `Leadi` vklopljen filter, se številke z vidnimi
vrsticami ne bodo ujemale: `COUNTIF` filtrov ne upošteva.

### Ko skripto spremenite

Google poganja **razmeščeno različico**, ne tiste v urejevalniku. Po vsaki
spremembi: *Razmesti → Upravljaj razmestitve → svinčnik → Različica: Nova
različica → Razmesti*. Naslov ostane isti. Brez tega koraka teče stara koda in
videti je, kot da sprememba ni imela učinka.

## ActiveCampaign

Vsak lead, ki pristane v vrstici, gre lahko tudi v ActiveCampaign: kontakt se
ustvari ali posodobi po e-naslovu, doda na izbrani seznam in dobi oznake.
Preglednica ostane popolna evidenca, v CRM gre prodajno uporaben izvleček.
Dokler nastavitev ni, se ne zgodi nič — zbiralnik dela natanko kot doslej.

### Namestitev (~20 minut, enkrat)

1. **Seznam v AC.** Odprite ga in iz naslova prepišite `listid` — številka za
   `?listid=` je id, ki ga potrebujete.
2. **Ključ API.** V AC *Settings → Developer*. Tam sta dva podatka: **URL**
   (oblike `https://ime.api-us1.com`) in **Key**. To NI naslov, na katerem se
   prijavljate (`…activehosted.com`).
3. **Lastnosti skripte.** V urejevalniku *Nastavitve projekta* (zobnik) →
   *Lastnosti skripte* → *Dodaj lastnost*, trikrat:

   | Lastnost | Vrednost |
   |---|---|
   | `AC_NASLOV` | URL iz *Developer*, npr. `https://ime.api-us1.com` |
   | `AC_KLJUC` | Key iz *Developer* |
   | `AC_SEZNAM` | id seznama iz 1. koraka |

   Ključ **ne sodi v `Koda.gs`** — datoteka je v repozitoriju. Stranski dobiček
   lastnosti skripte je, da preživijo vsako naslednje lepljenje kode; naslova za
   obvestila je treba po vsakem prilepljanju vpisati znova, teh treh ne.
4. **Prilepite novo različico `Koda.gs`** in shranite.
5. **Poženite `pripraviAC`** (izberite funkcijo v urejevalniku → *Zaženi*).
   Google bo prvič zahteval dovoljenje za klice na zunanje naslove. Funkcija
   preveri ključ, izpiše ime seznama in v AC ustvari manjkajoča polja po meri.
   Varno jo je pognati večkrat.
6. **Poženite `posljiZaostaleVAC`** — pošlje leade, ki so se v preglednici
   nabrali pred priklopom (do 30 na zagon; poženite večkrat, dokler izpis ne
   pokaže `Poslano: 0`).
7. **Poženite `namestiUroZaAC`** — vsakih deset minut pobere, kar ni prišlo skozi
   takoj. Zažene se enkrat; ponovni zagon starih ur ne podvoji.
8. **Razmestite novo različico** (*Razmesti → Upravljaj razmestitve → svinčnik →
   Nova različica*). Brez tega ob oddajah teče stara koda.
9. **Preverite** — odprite naslov `/exec` v brskalniku. Vrstica `ActiveCampaign:`
   pove id seznama in število pripravljenih polj, `Zadnji v AC:` pa čas zadnjega
   uspeha.

### Kaj pride v ActiveCampaign

Standardna polja: e-naslov, ime, priimek, telefon. Poleg njih štirinajst polj po
meri z oznakami `%LM10_…%` (podjetje, panoga, zaposleni, prihodek, letni izračun,
enkratni kapital, zanesljivost, področja, tveganja, posvet, povezava do prodajne
priprave, sekvenca, vir, vloga) — uporabna so v personalizaciji e-pošte.

Oznake so tisto, na kar se v AC obesi avtomatizacija:

| Oznaka | Kdaj |
|---|---|
| `LM-10` | vsak lead |
| `LM-10 panoga: …` | po dejavnosti iz vprašalnika |
| `LM-10 sekvenca: …` | po izbrani follow-up sekvenci |
| `LM-10 posvet` | obiskovalec je prosil za pregled številk |

Predpono `LM-10` spremenite v `NASTAVITVE.AC.OSNOVNA_OZNAKA`.

V CRM **ne gredo** surov JSON vnosov, triažne ocene in podrobnosti izračuna. Te
ostanejo v preglednici; CRM ni prostor zanje.

### Privolitve

Na seznam pride vsak, ki odda obrazec — to je namen seznama. Naročen (status
*active*) pa je le tisti, ki je v obrazcu privolil v ponudbe ali vsebine; ostali
pridejo na seznam kot *unsubscribed*. Razlika ni kozmetična: kampanja, poslana na
seznam, gre samo na naročene, zato nekdo, ki je hotel le svoj izračun, iz tega
seznama ne more dobiti oglasnega sporočila. To je zahteva ZEKom-2 za neposredno
trženje.

`NASTAVITVE.AC.SAMO_S_PRIVOLITVIJO: false` varovalo izklopi in naroči vse. Preden
ga izklopite, mora biti pravna podlaga zapisana drugje — skripta o njej ne ve nič.

### Stolpec `activeCampaign`

Vsaka vrstica ima stolpec z id-jem kontakta v AC. Prazen ali `NAPAKA: …` pomeni
„še ni tam" in je edino, po čemer ura ve, kaj naj ponovi. Zato ga ne brišite in
ne preimenujte; če ga izpraznite, bo lead ob naslednjem zagonu ure poslan znova
(kar ne naredi dvojnika — `contact/sync` ujame po e-naslovu).

Da stolpec pristane na svojem mestu med že zapisanimi vrsticami, enkrat poženite
`urediStolpce`.

### Zakaj se pošilja dvakrat

Ob oddaji gre kontakt v AC takoj, a le, če je do tedaj poteklo manj kot 4,5
sekunde. Aplikacija namreč čaka odgovor osem sekund in ob prekoračitvi razume
dostavo kot neuspelo ter prodajno pripravo prenese stranki. Počasen CRM tega ne
sme povzročiti, zato ob zamudi klic odpade in vrstico čez nekaj minut pobere ura.
Iz istega razloga napaka v AC nikoli ne pade ven: pristane v stolpcu in gre v
ponovni poskus.

`NASTAVITVE.AC.POSILJAJ_TAKOJ: false` vročo pot izklopi in vse prepusti uri —
lead je tedaj v CRM-ju v nekaj minutah namesto takoj.

## Kaj se zgodi ob napaki

Aplikacija razume neuspešno dostavo kot „prodajna priprava ni prišla do nas" in
jo tedaj prenese stranki (rezervna pot, opisana v `src/lib/deliverLead.ts`).
Skripta zato napake **ne pogoltne**: če vrstice ni mogoče zapisati, jo vrže
naprej in aplikacija pade v rezervno pot. Če odpove samo shranjevanje priprave na
Drive, se vrstica vseeno zapiše (lead je dragocenejši), v stolpcu
`prodajnaPriprava` pa ostane besedilo napake.

Klic v ActiveCampaign je za zapisom vrstice in v svojem `try/catch`: padel CRM
ne sme pomeniti, da aplikacija dostavo razume kot neuspelo. Napaka pristane v
stolpcu `activeCampaign` in gre v ponovni poskus.

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
