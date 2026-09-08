# Beleženje oddaj v Google Sheet

Vsaka oddaja obrazca doda eno vrstico v preglednico. Pot je ista, kot jo je
aplikacija imela že prej — `VITE_LEAD_WEBHOOK_URL` (`src/lib/submitLead.ts`) —
manjkal je le sprejemnik. Tu je: [`Koda.gs`](Koda.gs), Google Apps Script v
preglednici sami. Brez strežnika, brez zunanje storitve, brez stroška.

**Kaj se zabeleži.** Ista glava kot pri ročnem izvozu CSV
(`CSV_COLUMNS` v `src/lib/exportRecord.ts`): čas, dejavnost, segment, velikostni
razred, kontakt, privolitve, vsi koši zneskov, izbrana področja, triažne ocene,
zanesljivost, urni postavki z izvorom, `utm_source` in follow-up sekvenca. Skripta
doda še `prejeto` (čas prejema), `prodajnaPriprava` (povezava do priprave na
Drive) in `porociloPdf` (povezava do strankinega PDF-ja na Drive — ta gre tudi v
ActiveCampaign, glej [Povezava do strankinega PDF-ja](#povezava-do-strankinega-pdf-ja)).
Ob vsaki oddaji lahko pošlje tudi obvestilo na e-pošto (spodaj).

**Kdo v list `Leadi` NE pride.** Kdor vprašalnik zapusti pred obrazcem — brez
e-naslova in brez privolitve zapisa ni (`buildLeadExportRecord` tedaj vrne `null`).
Odpadanje po korakih merijo dogodki lijaka, ki pridejo po istem webhooku na list
`Dogodki`; povzetek je na listu `Lijak` (glej
[Lijak — kje obiskovalci odnehajo](#lijak--kje-obiskovalci-odnehajo)).

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

> **Privzeto to obvestilo pošlje ActiveCampaign, ne skripta.** Ob nastavljenem
> AC in `POSTA_PREK_AC: true` skripta ne pošlje ničesar — obvestilo prodaji in
> poročilo stranki odpravita avtomatizaciji v AC, s povezavama do PDF-jev na
> Drivu. Glej [Pošta prek ActiveCampaigna](#pošta-prek-activecampaigna).
> Spodnje velja za način MailApp (`POSTA_PREK_AC: false` ali AC ni priklopljen)
> in ostaja rezervna pot, ki jo je vredno poznati.

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

## Poročilo stranki po e-pošti

> **Privzeto to sporočilo pošlje ActiveCampaign, ne skripta**, in namesto
> priloge nosi povezavo do PDF-ja na Drivu — glej
> [Pošta prek ActiveCampaigna](#pošta-prek-activecampaigna). Spodnje velja za
> način MailApp; besedilo sporočila in pravilo »priprava nikoli stranki« sta v
> obeh načinih ista.

Ob vsaki oddaji skripta pošlje **stranki** — na e-naslov iz obrazca — sporočilo
s pripetim poročilom za stranko (`posljiPorociloStranki`). To je obljuba
obrazca (»PDF poročilo prejmete na vpisani e-naslov«); aplikacija na
rezultatih tedaj pokaže obvestilo namesto gumba za prenos. Pripeta je **samo
priloga z oznako `audience: 'customer'`**; priprava na pogovor (`'sales'`)
stranki ne gre nikoli, tudi če bi bila datoteka napačno poimenovana. Starejši
build aplikacije oznake ne pošilja — tedaj odloči predpona imena datoteke
(`datalab-analiza-skritih-stroskov`).

Nastavitve na vrhu `Koda.gs` (preživijo lepljenje, ker so v repozitoriju):
`POSLJI_POROCILO_STRANKI` (privzeto `true`; `false` = stranka poročilo prenese
sama), `IME_POSILJATELJA` (»Datalab«) in `ODGOVORI_NA` (`prodaja@datalab.si`,
isti kot v `src/config/salesContact.ts`). Besedilo sporočila je v
`sestaviSporociloStranki`: pozdrav z imenom, en odstavek o poročilu, potrditev
prošnje za posvet (če je bila obkljukana), kontakt prodaje in noga, ki pove,
zakaj je sporočilo prišlo. **Brez trženja** — brez ponudb, cen in vabil na
vsebine: to je transakcijsko sporočilo na podlagi obvezne privolitve v
obdelavo; privolitvi v ponudbe in vsebine sta ločeni in ju spoštuje
ActiveCampaign, ne ta pošta.

**Pošiljatelj je račun, ki je skripto razmestil.** `MailApp` zna nastaviti
prikazano ime in naslov za odgovor, ne pa naslova pošiljatelja — zato skripta
sodi na Datalabov Workspace račun, ne na zasebnega. Tja pride tudi **odbita
pošta** (napačno vpisan naslov, ki je videti veljaven); na `ODGOVORI_NA` gredo
le strankini odgovori. Kvota MailApp zdaj šteje **dva prejemnika na lead**
(stranka in prodaja): 1500 na dan pri Workspacu.

**Izid je viden na treh mestih.** V odgovoru aplikaciji (`customerReport:
{ sent, reason }` — razlogi `disabled`, `no_address`, `invalid_address`,
`no_attachment`, `send_failed`, v načinu AC še `queued` in `unsubscribed`), v
stolpcu `porociloStranki` vrstice (»poslano 2026-09-07 10:12«, »prek AC
2026-09-07 10:12« ali »ni poslano: …«) in v obvestilu prodaji (vrstica
»Poročilo stranki: poslano na …« ali »NI poslano (razlog)« — tedaj ga zna
svetovalec posredovati iz priloge). Na naslovu `/exec` (`doGet`) so še vrstice
»Poročilo stranki po e-pošti«, »Zadnje poročilo stranki« in »Zadnja napaka
poročila stranki« (naslovi zakriti). Pošta stranki gre **za** vrstico in v
svojem `try/catch`: padla pošta ne vrže napake, vrstica in obvestilo prodaji
ostaneta, aplikacija pa ob `sent: false` ponudi prenos.

**Kopija na Drivu.** Isti PDF, ki gre stranki, skripta shrani še v mapo
`LM-10 poročila strankam` (`shraniPorocilo`), povezavo zapiše v stolpec
`porociloPdf` in jo pošlje v ActiveCampaign kot polje `%LM10_POROCILO%` — glej
[Povezava do strankinega PDF-ja](#povezava-do-strankinega-pdf-ja).

**Preizkus iz urejevalnika:** funkcija **`preizkusPorocilaStranki`** pošlje
vzorčno sporočilo z vzorčnim PDF-jem na prvi naslov iz `E_NASLOV_ZA_OBVESTILA`
— pokaže, kako sporočilo izgleda v pravem nabiralniku, in izsili dovoljenje za
pošto, če ga še ni (glej `preizkusPoste`).

**Vrstni red razmestitve:** najprej **nova različica skripte**, šele nato
objava aplikacije. Obe vmesni stanji delujeta — nova skripta s staro aplikacijo
poročilo pošlje (po predponi imena) in aplikacija še kaže gumb; stara skripta z
novo aplikacijo v odgovoru nima `customerReport` in aplikacija ponudi gumb kot
doslej — a nova aplikacija že na obrazcu obljublja poročilo po e-pošti, česar
stara skripta ne drži. V obratnem vrstnem redu obljube ni: stara aplikacija
pošte ne omenja, stranka pa jo dobi kot dodatek.

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
- **Koliko obiskovalcev je odpadlo pred obrazcem.** V list `Leadi` pridejo samo
  oddaje s privolitvijo; lijak obiskovalec → lead je na listu `Lijak` (spodaj).
  Kdor bi ga sestavil iz številk tega lista, bi meril samo tiste, ki so
  vprašalnik prehodili do konca.
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

**Pred lepljenjem poženite preizkus.** Skripto naloži v Node s preglednico v
pomnilniku namesto Googla in skoznjo požene obe poti webhooka ter sestavljanje
lijaka:

```bash
node tools/google-sheet/preizkus.mjs
```

Brez odvisnosti (`node:vm`, `node:test`, `node:assert`); isti ukaz teče v CI
(`.github/workflows/ci.yml`) ob vsakem PR. Preverja, da oddaja z `record` in
`sheet` konča kot vrstica na `Leadi` s stolpcema `kliciTakoj` in `letno` in z
glavo po `VRSTNI_RED`; da paket z `events` in `visit` konča na `Dogodki`; da
`sestaviLijak` iz šestih značilnih obiskov (poln tok, odnehanje na triaži in na
strani vnosov, nadaljevanje po osvežitvi, interni obisk, blokada obrazca)
sestavi `Lijak` s pravimi števili — obiskov po korakih, „končalo tu", mediana
časa, blokade po polju, nadaljevanja posebej; in da paket brez id-ja obiska
vrže napako; da poročilo stranki po e-pošti gre na naslov iz oddaje s samo
njenim PDF-jem (nikoli s pripravo), ob manjkajočem naslovu, prilogi ali padli
pošti pa odgovor pove razlog, vrstica in obvestilo prodaji pa ostaneta; da
kontakt gre v ActiveCampaign naročen, s privolitvijo kot oznako, in da kdor se
je sam odjavil, ostane odjavljen; da strankin PDF pristane na Drivu v svoji
mapi, deljen s povezavo, povezava pa v stolpcu `porociloPdf` in v polju v AC —
ob odpovedi Drive pa vrstica, pošta stranki in AC tečejo naprej; in da v načinu
`POSTA_PREK_AC` skripta ne pošlje ničesar, oba PDF-ja pristaneta na Drivu
deljena s povezavo, kontakt na obeh seznamih, odgovor pa je `queued` — oziroma
`no_attachment`, `unsubscribed` ali `disabled`, kadar je tako.
Ponarejena preglednica ob `setValues` preveri obliko obsega in `getLastRow`
računa iz vsebine, ne iz oblik; `MailApp` je ponarejen in sporočila zbira, da
test vidi naslovnika, prilogi in besedilo; `DriveApp` (mape, datoteke, deljenje)
in `UrlFetchApp` (zahteve v AC) prav tako. Česar ne pokrije: to, kako prava
preglednica razlaga zapisane nize (uvodni opuščaj, pretvorba `"true"`) —
ponaredek hrani natanko to, kar skripta zapiše.

## Lijak — kje obiskovalci odnehajo

Aplikacija pošlje po istem webhooku tudi **dogodke lijaka** (`src/lib/funnel.ts`):
prikaz vsakega koraka (in vsake strani vnosov), izbrana dejavnost, zaključena
triaža in osnova, prihod na obrazec, blokada validacije, oddaja, izid dostave,
prenos poročila. Telo nosi `events` in `visit` namesto `record`; `doPost` ju loči
po obliki. `zapisiDogodke` dogodke pripne na list **`Dogodki`** (ena vrstica na
dogodek), `sestaviLijak` pa iz njih sestavi list **`Lijak`**.

Kdor vprašalnik zapusti pred obrazcem, je torej viden tu — kot obisk brez
e-naslova, brez imena, brez vnesenih zneskov. Dogodek nosi korak, segment,
področje vnosov, razred zaslona (`mobile`/`desktop`), `utm_source` in razrede
(zanesljivost, število področij, polje, ki je ustavilo oddajo). Nič drugega.

### Namestitev (~5 minut, enkrat)

1. **Prilepite novo različico `Koda.gs`** in jo **razmestite kot novo različico**
   (*Razmesti → Upravljaj razmestitve → svinčnik → Nova različica*). Stara
   razmeščena različica dogodke zavrača z napako `V telesu ni zapisa (record)` —
   aplikacija tega ne vidi (odgovora ne bere), vidi pa se v *Izvedbah* in po tem,
   da list `Dogodki` ne nastane.
2. **Preverite na naslovu `/exec`**: vrstica `Dogodki lijaka:` pove število
   vrstic in čas zadnjega prejema. Dokler je 0, dogodki ne prihajajo — bodisi
   teče stara različica, bodisi aplikacija nima nastavljenega webhooka.
3. **Poženite `sestaviLijak`** (izberite funkcijo → *Zaženi*), ko je na listu
   `Dogodki` nekaj obiskov. Nastane list `Lijak`.
4. **Poženite `namestiUroZaLijak`** — povzetek se od tedaj sestavi vsak dan ob
   šestih zjutraj. Ponovni zagon starih ur ne podvoji.

Aplikacije ni treba spreminjati: dogodki gredo na `VITE_LEAD_WEBHOOK_URL`, ki je
že nastavljen. Brez njega se ne pošlje nič.

### Kaj je na listu `Lijak`

| Kje | Kaj |
|---|---|
| vrstici 4–5 | **Kartice**: začetih obiskov, do obrazca, oddaj, delež oddaj, prenosov poročila |
| `LIJAK — VSI SEGMENTI` | Korak za korakom: koliko obiskov ga je doseglo, delež od začetnih, koliko jih **tu končalo** (ni šlo dlje), odpad v odstotkih, **mediana časa** na koraku; pod vnosi še vsaka stran (področje) posebej. Desno graf. |
| `LIJAK — <SEGMENT>` | Isti lijak za vsak segment posebej — edini točen, ker koraki kontekst, triaža in osnova obstajajo le v segmentih s konfiguracijo |
| `PO SEGMENTIH`, `PO VIRU OBISKA`, `PO ZASLONU` | Začetih, do obrazca, oddaj, delež oddaj po skupinah |
| `OBRAZEC — KATERO POLJE USTAVI ODDAJO` | Blokade validacije po polju: kolikokrat in koliko obiskov |
| `DOSTAVA LEADA` | Uspele in padle dostave po razlogu (`no_webhook`, `rejected`, `error`) |
| `NADALJEVANJA IN IZPUŠČENI OBISKI` | Obiski po osvežitvi, oddaje med njimi, obiski prek poti `/dejavnost/`, interni obiski (`?debug=1`) |
| `PO DNEVIH` | Zadnjih 30 dni: začetih in oddaj — vir za graf trenda |

**Kako brati.** *Obisk* je ena naložena stran, ne obiskovalec: id obiska živi samo
v pomnilniku strani (brez piškotka, brez `sessionStorage` — identifikator v
brskalniku bi po ZEKom-2 terjal privolitev). Osvežitev sredi vprašalnika zato
naredi nov obisk, ki se začne sredi toka; take obiske („nadaljevanja": prvi
prikazani korak ni uvodni) lijak **ne** šteje, pove pa, koliko jih je in koliko
jih je oddalo. Pravi delež dokončanih je med številko brez nadaljevanj in
številko z njimi. Gib „Nazaj" na telefonu strani ne osveži (zgodovina je v
aplikaciji), zato je nadaljevanj malo. Obisk prek kampanjske poti
(`<objava>/proizvodnja/`) se prav tako ne začne na uvodnem koraku, a ni
nadaljevanje: aplikacija pred prvim prikazom pošlje `lm10_industry_selected`
z `source: link` in lijak ga šteje kot začetega.

*Končalo tu* pomeni, da obisk ni prišel **dlje** od tega koraka — vrnitev nazaj
ni odnehanje, šteje najdlje doseženi korak. Pri rezultatih pomeni dokončan
vprašalnik. *Mediana časa* šteje samo obiske, ki so s koraka šli naprej (zadnji
korak obiska časa nima: ni znano, kdaj je obiskovalec odšel), in izpusti čase
nad 30 minutami (pozabljen zavihek). Mediana in ne povprečje, ker en pozabljen
zavihek povprečje pokvari bolj kot sto pravih obiskov.

**List je posnetek**, ne žive formule kot `Analitika`: povzetek potrebuje
obiske (dogodke, zbrane po id-ju in urejene po zaporedju), česar formule ne
zmorejo berljivo. Kdaj je nastal, piše v vrstici 2; izid zadnjega zagona je na
naslovu `/exec` (`Lijak:`). V list ne pišite ročno — ob naslednjem zagonu se
sestavi na novo (list ob urejanju opozori).

### Nastavitve

| Nastavitev | Privzeto | Kaj naredi |
|---|---|---|
| `LIJAK_OBDOBJE_DNI` | `0` (vsi dogodki) | Koliko dni nazaj šteje povzetek. Pri majhnem prometu pustite 0 — pri dvajsetih obiskih na teden je tedenski odstotek šum. Ožje obdobje ima smisel, ko se vprašalnik spremeni in primerjate prej in potem. |
| `DOGODKI_HRANI_DNI` | `0` (nikoli) | Po koliko dneh dnevna ura pobriše surove dogodke. Obisk pusti okoli deset vrstic; pri sto obiskih na dan je to milijon celic na leto (meja preglednice je deset milijonov). |

### Kar je vredno vedeti

- **Napaka tu ne gre v rezervno pot.** Aplikacija odgovora na dogodke ne bere
  (pošilja jih s `sendBeacon`, da preživijo zaprtje zavihka), zato izjema v
  `zapisiDogodke` ne škodi nikomur razen dnevniku *Izvedb* — in tam je prav, da
  se vidi.
- **Dogodki ne čakajo na oddajo.** Pripenjanje ima kratko ključavnico (5 s);
  če je zasedena (oddaja leada z Drive in pošto), gre vrstica za vrstico prek
  `appendRow`, ki je varen tudi brez nje.
- **Kvota.** Obisk pošlje okrog deset paketov. Brezplačni račun zmore ~20.000
  klicev na dan — okoli 2.000 obiskov na dan, preden bi bilo treba pakete
  redčiti.
- **Stolpci lista `Dogodki` so določeni v skripti** (`DOGODKI_GLAVA`), drugače
  kot pri `Leadi`: povzetek jih mora poznati tako ali tako. Kar aplikacija pošlje
  poleg znanih lastnosti, pristane kot JSON v stolpcu `lastnosti`. Ne
  preimenujte jih in ne pišite vanj ročno.
- **Interni obiski** (`?debug=1`) se zapišejo z `interni = TRUE` in jih povzetek
  izpusti — razvojni kliki ne pokvarijo odstotkov.

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
   | `AC_SEZNAM` | id seznama strank iz 1. koraka |
   | `AC_SEZNAM_PRODAJA` | neobvezno: id drugega seznama, pregleda leadov za prodajo |

   Ključ **ne sodi v `Koda.gs`** — datoteka je v repozitoriju. Stranski dobiček
   lastnosti skripte je, da preživijo vsako naslednje lepljenje kode; naslova za
   obvestila je treba po vsakem prilepljanju vpisati znova, teh treh ne.
4. **Prilepite novo različico `Koda.gs`** in shranite.
5. **Poženite `pripraviAC`** (izberite funkcijo v urejevalniku → *Zaženi*).
   Google bo prvič zahteval dovoljenje za klice na zunanje naslove. Funkcija
   preveri ključ, izpiše imena seznamov in v AC ustvari manjkajoča polja po meri.
   Izpis loči **že obstoječa** polja od **na novo ustvarjenih** — polji `PDF_LINK`
   in `PDF_LINK_PRODAJA` sta v AC ustvarjeni ročno in morata biti med prvimi;
   če se pojavita med ustvarjenimi, se oznaki ne ujemata. Varno večkrat.
6. **Poženite `posljiZaostaleVAC`** — pošlje leade, ki so se v preglednici
   nabrali pred priklopom (do 5 na zagon; poženite večkrat, dokler izpis ne
   pokaže `Poslano: 0`).
7. **Poženite `namestiUroZaAC`** — vsako minuto pobere, kar ni prišlo skozi
   takoj. Zažene se enkrat; ponovni zagon starih ur ne podvoji.
8. **Razmestite novo različico** (*Razmesti → Upravljaj razmestitve → svinčnik →
   Nova različica*). Brez tega ob oddajah teče stara koda.
9. **Preverite** — odprite naslov `/exec` v brskalniku. Vrstica `ActiveCampaign:`
   pove id seznama in število pripravljenih polj, `Zadnji v AC:` pa čas zadnjega
   uspeha.

### Kaj pride v ActiveCampaign

Standardna polja: e-naslov, ime, priimek, telefon. Poleg njih sedemnajst polj po
meri, uporabnih v personalizaciji e-pošte:

| Polje | Vsebina |
|---|---|
| `%PDF_LINK%` | povezava do strankinega poročila (PDF na Drivu) |
| `%PDF_LINK_PRODAJA%` | povezava do priprave na pogovor |
| `%LM10_ODDAJA%` | čas zadnje oddaje — edino polje, ki se spremeni ob VSAKI oddaji |
| `%LM10_DAVCNA%` | davčna številka |
| `%LM10_PODJETJE%`, `%LM10_PANOGA%`, `%LM10_ZAPOSLENI%`, `%LM10_PROMET%` | podjetje in velikost |
| `%LM10_LETNO%`, `%LM10_KAPITAL%`, `%LM10_ZANESLJIVOST%` | izračun |
| `%LM10_PODROCJA%`, `%LM10_TVEGANJA%`, `%LM10_POSVET%` | kaj je izbral in ali prosi za posvet |
| `%LM10_SEKVENCA%`, `%LM10_VIR%`, `%LM10_VLOGA%` | za segmentacijo |

Polji `PDF_LINK` in `PDF_LINK_PRODAJA` **ustvarite v AC ročno** (Settings →
Fields), preden poženete `pripraviAC` — skripta ju najde po personalizacijski
oznaki. Ostala ustvari sama. Starejši polji `LM10_POROCILO` in `LM10_PRIPRAVA`
skripta ne polni več; v AC ostaneta prazni in ju smete izbrisati.

Oznake so tisto, na kar se v AC obesi avtomatizacija:

| Oznaka | Kdaj |
|---|---|
| `LM-10` | vsak lead |
| `LM-10 panoga: …` | po dejavnosti iz vprašalnika |
| `LM-10 sekvenca: …` | po izbrani follow-up sekvenci |
| `LM-10 posvet` | obiskovalec je prosil za pregled številk |
| `LM-10 privolitev: ponudbe` | v obrazcu je privolil v ponudbe PANTHEON |
| `LM-10 privolitev: vsebine` | v obrazcu je privolil v vsebine in dogodke |

Predpono `LM-10` spremenite v `NASTAVITVE.AC.OSNOVNA_OZNAKA`.

V CRM **ne gredo** surov JSON vnosov, triažne ocene in podrobnosti izračuna. Te
ostanejo v preglednici; CRM ni prostor zanje.

### Pošta prek ActiveCampaigna

Privzeto (`POSTA_PREK_AC: true` in priklopljen AC) **obe sporočili pošlje
ActiveCampaign**: poročilo stranki in obvestilo prodaji. Skripta ju ne pošlje —
naredi tri stvari in utihne:

1. oba PDF-ja shrani na Drive (`LM-10 poročila strankam`, `LM-10 prodajne
   priprave`) in ju deli **»vsi s povezavo, ogled«**;
2. povezavi zapiše v stolpca `porociloPdf` in `prodajnaPriprava`;
3. ju skupaj z ostalimi polji pošlje kontaktu v AC (`%PDF_LINK%`,
   `%PDF_LINK_PRODAJA%`, `%LM10_ODDAJA%`).

Sprememba polja je **sprožilec**: avtomatizaciji v AC se ob njej zbudita in
pošljeta sporočili. Pošiljatelj je s tem Datalabov račun v AC in ne račun, ki je
skripto razmestil.

**Zakaj povezave in ne priloge:** AC datotek v sporočila ne zna pripeti. Zato sta
obe datoteki deljeni s povezavo — brez tega bi povezava stranki in svetovalcu
odprla »Zahtevajte dostop«. Povezava nosi naključen id in ni uganljiva, a
priprava je dokument **o** stranki: obvestil prodaji ne posredujte naprej.
Preden gre prvi lead, poženite **`preizkusDeljenja`** (v urejevalniku) in
izpisano povezavo odprite v zasebnem oknu — če Workspace deljenje navzven
prepove, se datoteke shranijo, povezave pa ne delujejo.

**Dve avtomatizaciji, ne ena.** Sprožilca sta različna in eno sporočilo ne sme
čakati na drugo:

| Avtomatizacija | Sprožilec | Dejanje |
|---|---|---|
| poročilo stranki | *Field changes* → `PDF Link`, runs multiple times | *Wait 1 minute*, nato *Send email* s povezavo `%PDF_LINK%` |
| obvestilo prodaji | *Field changes* → `LM-10 čas zadnje oddaje`, multiple times, pogoj »je na seznamu prodaje« | *Send notification* na prodajni naslov z obema povezavama |

Čakanje ene minute pri prvi je namerno: kontakt pride na seznam šele s klicem,
ki polje nastavi. Sprožilec druge je **čas oddaje** in ne povezava do priprave:
če priprave ni (PDF ni nastal, HTML ni prišel), se povezava ne spremeni in
prodaja obvestila ne bi dobila — čas oddaje se spremeni vedno. Vsebino sporočila
stranki povzemite po `sestaviSporociloStranki`, obvestilo prodaji po
`posljiObvestilo` (obe funkciji ostaneta v skripti kot vzorec in kot rezervna
pot).

**Brez podvajanja.** Ista povezava ob ponovni sinhronizaciji polja ne spremeni,
zato ura (`posljiZaostaleVAC`) sporočila ne sproži drugič. Ob ponovnem obisku
istega človeka pa nastaneta novi datoteki, polji se spremenita in sporočili
odideta znova — kar je prav, ker gre za nov izračun.

**Rok na vroči poti je 6 sekund** (`AC_ROK_PREK_AC_MS`, v načinu MailApp 4,5).
Ob prekoračitvi klic v AC odpade, odgovor aplikaciji je vseeno `queued` in
vrstico v minuti pobere ura — sporočili tedaj odideta z zamikom.

**Kaj vidi stranka.** Odgovor aplikaciji je `customerReport: { sent: false,
reason: 'queued' }`, kar na rezultatih pomeni »Poročilo pošiljamo na … Prispe v
nekaj minutah« **in** gumb za prenos. Gumb ostane namenoma: potrditve ob oddaji
ni, druga oddaja pa je onemogočena. Ob `unsubscribed` (kontakt se je v AC sam
odjavil) sporočila ne bo — stranka ima gumb, svetovalec pa PDF v kartici
kontakta.

**Vklop na obstoječi namestitvi:**

1. V AC ustvarite polji **PDF Link** in **PDF Link - PRODAJA** (Settings →
   Fields, tip Text) in seznam za prodajo, če ga še ni.
2. Prilepite novo različico `Koda.gs`, vpišite `E_NASLOV_ZA_OBVESTILA` in v
   lastnosti skripte dodajte `AC_SEZNAM_PRODAJA`.
3. Poženite **`preizkusDeljenja`**, nato **`pripraviAC`** (najde vaši polji,
   ustvari `LM10_DAVCNA` in `LM10_ODDAJA`).
4. Poženite **`posljiZaostaleVAC`**, dokler ne pokaže `Poslano: 0` — zaostanek
   izpraznite, **preden** vklopite avtomatizaciji, sicer bodo obvestila odšla za
   stare leade. Nato **`narociObstojeceVAC`**, da so obstoječi kontakti tudi na
   seznamu prodaje.
5. Sestavite obe avtomatizaciji (tabela zgoraj) in ju vklopite.
6. **Razmestite novo različico** in preverite na `/exec`: vrstici `Pošta: prek
   ActiveCampaigna` in `ActiveCampaign: seznam … + prodaja …`.

Nazaj na MailApp: `POSTA_PREK_AC: false` in nova različica razmestitve;
avtomatizaciji v AC tedaj izklopite, sicer bosta sporočili odšli dvakrat.

### Privolitve

Na seznam pride vsak, ki odda obrazec, in to kot *naročen* (status *active*) —
seznam je pregled nad tem, kdo je vprašalnik izpolnil. Tržna privolitev iz
obrazca gre zraven kot oznaki `LM-10 privolitev: ponudbe` in `LM-10 privolitev:
vsebine`. Kampanj zato **ne pošiljajte na cel seznam**, ampak na segment po
oznaki: nekdo, ki je hotel le svoj izračun, oznake nima in oglasnega sporočila
ne sme dobiti (ZEKom-2, neposredno trženje). Skripta tega sama ne more
uveljaviti — uveljavi se v AC, pri vsaki kampanji.

Kdor se je s seznama sam odjavil (klik na odjavo v kampanji), ostane odjavljen,
tudi če vprašalnik izpolni znova brez privolitve: skripta pred naročilom preveri
stanje na seznamu. Če ob ponovnem obisku privoli, je to nova privolitev in
kontakt je naročen znova.

`NASTAVITVE.AC.SAMO_S_PRIVOLITVIJO: true` uveljavi privolitev s statusom:
naročen je le, kdor je privolil, ostali pridejo na seznam kot *unsubscribed*.
Pozor: privzeti pogled seznama v AC odjavljenih ne kaže — leadi so tam, videti
pa jih ni, dokler filtra po statusu ne nastavite na *Any*.

**Po preklopu s `true` na `false`** enkrat poženite `narociObstojeceVAC`: leade,
ki so v AC že pristali kot odjavljeni, naroči in jim pripne oznaki privolitve.
Ne poganjajte ga, če se je kdo s seznama že odjavil sam — naročilo vsili mimo
varovala. Izid je na `/exec` v vrstici `Ponovno naročilo obstoječih`.

### Stolpec `activeCampaign`

Vsaka vrstica ima stolpec z id-jem kontakta v AC. Prazen ali `NAPAKA: …` pomeni
„še ni tam" in je edino, po čemer ura ve, kaj naj ponovi. Zato ga ne brišite in
ne preimenujte; če ga izpraznite, bo lead ob naslednjem zagonu ure poslan znova
(kar ne naredi dvojnika — `contact/sync` ujame po e-naslovu).

Da stolpec pristane na svojem mestu med že zapisanimi vrsticami, enkrat poženite
`urediStolpce`.

### Zakaj se pošilja dvakrat

Ob oddaji gre kontakt v AC takoj, a le, če je do tedaj poteklo manj kot 4,5
sekunde. Aplikacija namreč čaka odgovor deset sekund in ob prekoračitvi razume
dostavo kot neuspelo ter prodajno pripravo prenese stranki. Počasen CRM tega ne
sme povzročiti, zato ob zamudi klic odpade in vrstico v minuti ali dveh pobere ura.
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
`prodajnaPriprava` pa ostane besedilo napake. Če odpove shranjevanje strankinega
PDF-ja na Drive, napaka ne pride niti do aplikacije: v stolpcu `porociloPdf`
ostane `NAPAKA: …`, stranka pa ima PDF iz pošte.

Klic v ActiveCampaign je za zapisom vrstice in v svojem `try/catch`: padel CRM
ne sme pomeniti, da aplikacija dostavo razume kot neuspelo. Napaka pristane v
stolpcu `activeCampaign` in gre v ponovni poskus.

Enako pošta stranki: padla pošta (kvota, izpad) ne vrže napake — vrstica je
zapisana, obvestilo prodaji odide, v odgovoru je `customerReport: { sent: false,
reason: 'send_failed' }` in aplikacija stranki ponudi prenos. Napaka je v
stolpcu `porociloStranki` in na `/exec`. Ponovnega pošiljanja ni: stranka ima
gumb, svetovalec pa PDF v prilogi obvestila.

**V načinu AC** je razporeditev drugačna, ker skripta ne pošilja:

| Kaj odpove | Kaj se zgodi |
|---|---|
| Drive pri strankinem PDF-ju | `porociloPdf` dobi `NAPAKA: …`, polje `%PDF_LINK%` izpade, odgovor je `send_failed` in stranka ima gumb |
| Drive pri pripravi | napaka gre ven (kot doslej): aplikacija pripravo prenese stranki, vrstica je zapisana |
| klic v AC ali prekoračen rok | odgovor je `queued`, celica `activeCampaign` ostane prazna ali `NAPAKA`, vrstico v minuti pobere ura in avtomatizaciji se sprožita tedaj |
| kontakt je v AC odjavljen | odgovor je `unsubscribed`, stranka ima gumb; svetovalec PDF odpre iz kartice kontakta |
| deljenje na Drivu prepovedano | datoteki nastaneta, povezavi iz AC pa zahtevata dostop — vrstica »Zadnja napaka deljenja na Drivu« na `/exec`; preverite s `preizkusDeljenja` |

Nobena od teh poti ne pošlje ničesar dvakrat: sporočilo sproži **sprememba
polja**, in ista povezava ob ponovni sinhronizaciji polja ne spremeni.

Aplikacija bere **telo** odgovora, ne le statusa: Apps Script napako skripte
(žeton, prazno telo, nezapisana vrstica) vrne kot HTML s statusom 200, kar je
prej štelo kot uspešna dostava. Zdaj je uspeh samo JSON z `ok: true`.

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
  posameznika pomeni brisanje vrstice **in** datotek na Drive: priprave v
  `LM-10 prodajne priprave` in poročila v `LM-10 poročila strankam` (v načinu AC
  sta deljeni s povezavo obe; z brisanjem povezava ugasne) **in** kontakta v
  ActiveCampaignu, kjer je na obeh seznamih.
- **Stolpci se dodajajo na konec.** Skripta piše po imenih iz glave, zato nov
  stolpec v `CSV_COLUMNS` sam pripne novo ime; stare vrstice ostanejo poravnane.
  Ročno prerazporejanje ali preimenovanje stolpcev to podre.
- **Omejitve Apps Scripta.** Brezplačni račun zmore ~20.000 klicev URL-ja na dan
  in 90 minut izvajanja — za lead magnet neskončno daleč.
