# Primerjava vprašalnika za logistiko in transport — prej in zdaj

> **Namen dokumenta.** Popoln izpis vseh vprašanj vprašalnika za dejavnost `logistika`
> pred prenovo in po njej, postavljen drug ob drugega, da je primerjavo mogoče narediti
> brez branja kode.
>
> **Zakaj je do prenove prišlo.** Dve od petih panožnih področij sta merili prazne
> kilometre, izkoriščenost voznega parka in razporejanje voženj. To je delo transportnega
> sistema (TMS), ki ga Datalab ne ponuja — niti kot licenco niti kot vertikalo. Vprašalnik
> je torej meril strošek, ki ga PANTHEON ne more znižati, hkrati pa ni vprašal tam, kjer
> PANTHEON za prevoznika res je močan: potni nalogi z dnevnicami, obračun in izdaja
> računov, saldakonti in opomini.
>
> **Datum:** 31. avgust 2026 · **Koda:** `src/config/modules/logistika.ts`,
> `src/config/contexts/logistika.ts`, `src/config/segments.ts`, `src/config/copy/logistika.ts`

---

## 1. Pregled na eni strani

| | Prej | Zdaj |
|---|---|---|
| Panožnih področij | 5 | 6 |
| Horizontal | 3 (`analitikaHz`, `financeHz`, `kadriHz`) | 2 (`analitikaHz`, `financeHz`) |
| Triažnih vprašanj | 8 | 8 |
| Vprašanj na skupni finančni osnovi | 4 | 5 |
| Vseh vprašanj, če obkljukaš vsa področja | 68 | 70 |
| Vseh vprašanj po priporočeni poti (3 področja) | 42 | 42 |
| Prag visoke izgube (`highLossThresholdEUR`) | 20.000 EUR | 15.000 EUR |

### Kaj se je zgodilo s področji

| Prej | Zdaj | Opomba |
|---|---|---|
| `odprema` — Planiranje prevozov in izkoriščenost | **odstranjeno** | meri TMS |
| `roki` — Zamude, stojnine in nujni prevozi | **odstranjeno** | meri TMS; ure obveščanja preseljene v `dokumentacija` |
| `kadriHz` — Kadri in plače *(horizontala)* | **odstranjeno iz segmenta** | nadomesti panožni `vozniki` |
| — | `obracun_logistika` — Obračun prevozov in nezaračunane storitve | **novo** |
| — | `vozniki` — Vozniki, potni nalogi in dnevnice | **novo** |
| — | `terjatve_logistika` — Plačilni roki in terjatve | **novo** |
| `dokumentacija` — Prevozna dokumentacija in podatki | `dokumentacija` — Prevozna dokumentacija, podatki in statusi | +1 vprašanje |
| `napake` — Napačne dostave, poškodbe in reklamacije | isto | vprašanja nespremenjena |
| `skladisce` — Skladiščne operacije in zaloga | isto | vprašanja nespremenjena |
| `analitikaHz`, `financeHz` | isto | nespremenjeno |
| `diagnostika_logistika` | isto ime | 3 od 4 vprašanj preoblikovana |
| `E` — Tvegani stroški | isto | nespremenjeno |

### Privzeto obkljukana področja v triaži

| Prej | Zdaj |
|---|---|
| Planiranje prevozov in izkoriščenost | Obračun prevozov in nezaračunane storitve |
| Napačne dostave, poškodbe in reklamacije | Vozniki, potni nalogi in dnevnice |
| Zamude, stojnine in nujni prevozi | Plačilni roki in terjatve |

Novi trije so edini, ki jih ima **vsak** naslovnik dejavnosti: prevoznik z lastnimi vozili,
špediter brez njih in skladiščnik tujega blaga vsi obračunavajo, vsi imajo plačilne roke,
vsi vodijo ljudi.

---

## 2. Koraki, ki se niso spremenili

### Korak 1 — Dejavnost
**S čim se ukvarja vaše podjetje?** → *Logistika in transport*
(alternativa: „Drugo" → *Kaj je najbliže vašemu načinu dela?* → „Prevažamo ali skladiščimo za druge")

### Korak 2 — Velikost
**Koliko ljudi zaposlujete?** *(število, „zaposlenih")*

### Korak 3 — Nekaj o vaši logistiki
Vsa tri vprašanja so nespremenjena.

| # | Vprašanje | Možnosti |
|---|---|---|
| 1 | Kaj pretežno izvajate? | Prevozi z lastnim voznim parkom · Prevozi s pogodbenimi prevozniki · Skladiščenje in distribucija · Špedicija in organizacija prevozov · Kombinirano |
| 2 | Kako danes vodite logistiko? | PANTHEON in namenski skladiščni oziroma transportni sistem · PANTHEON brez namenskega logističnega sistema · Drug ERP ali namenski logistični sistem · Kombinacija ERP-ja, Excela in papirja · Večinoma Excel, papir ali telefon |
| 3 | Kakšna je vaša vloga? | Direktor/-ica · Vodja logistike ali disponent · Finance ali računovodstvo · Nabava ali skladišče · Drugo *(prosti vpis)* |

> Možnost „PANTHEON in namenski skladiščni oziroma transportni sistem" **ostaja** — opisuje
> **tuj** sistem, ki ga stranka že ima, in je edino mesto v vprašalniku, kjer smemo TMS omeniti.

### Modul E — Tvegani stroški *(samo obstoječim uporabnikom PANTHEON)*
Nespremenjeno: Uporabljamo SQL Server 2016 · Uporabljamo Windows Server 2016 · Nimamo urejenega kanala za e-račune

### Obrazec za PDF poročilo
Nespremenjen: Ime\*, Priimek\*, Ime podjetja\*, E-naslov\*, Telefonska številka, Davčna številka + 3 privolitve

---

## 3. Skupna finančna osnova — 4 vprašanja → 5

| # | Prej | Zdaj |
|---|---|---|
| 1 | **Približen polni strošek operativne ure**<br>*Voznik, skladiščnik, komisionar — kdor pošiljko dejansko premakne.* | **Približen polni strošek operativne ure**<br>*Skladiščnik, komisionar, voznik — kdor blago dejansko premakne.* |
| 2 | Približen polni strošek administrativne oziroma vodstvene ure | *(nespremenjeno)* |
| 3 | Letni prihodki od prodaje storitev | *(nespremenjeno)* |
| 4 | Povprečna prispevna marža | *(nespremenjeno)* |
| 5 | — | **Letni strošek financiranja obratnega kapitala** — *novo* |

**Zakaj je zamenjan vrstni red poklicev pri operativni uri.** Operativno uro odslej bere samo
še modul `skladisce` (iskanje in prekladanje blaga). Dokler je bil na prvem mestu voznik, je
prevoznik postavko umeril po njem, ta pa je nato vrednotila delo v skladišču.

**Zakaj novo peto vprašanje.** Strošek financiranja množita dve novi postavki — denar, vezan
v prepozno izdanih računih (`obracun_logistika`), in strošek zamud pri plačilih
(`terjatve_logistika`). Brez vprašanja bi obveljal privzetek 8,5 % in obiskovalec številke,
ki množi oba zneska, ne bi mogel popraviti.

Pasovi novega vprašanja: Do 5 % · 5–8 % · 8–12 % · Več kot 12 % *(privzetek 8,5 %)*

---

## 4. Triaža — ista dolžina, druga področja

| # | Prej | Zdaj |
|---|---|---|
| 1 | **Planiranje prevozov in izkoriščenost**<br>Kako pogosto se razpored prevozov podre — prazne vožnje, čakanje, ponovno razporejanje?<br>*Razpored drži / Občasno / Redno, z vplivom / Skoraj vsak dan* | **Obračun prevozov in nezaračunane storitve**<br>Kako pogosto opravljeno storitev zaračunate pozneje, kot bi lahko, ali je sploh ne zaračunate?<br>*Zaračunamo sproti in v celoti / Občasno kaj uide / Redno, opazno / To je stalna težava* |
| 2 | **Napačne dostave, poškodbe in reklamacije**<br>Kako pogosto pride do napačne dostave, poškodbe ali reklamacije? | **Vozniki, potni nalogi in dnevnice**<br>Koliko dela zahtevajo potni nalogi, dnevnice in evidence delovnega časa voznikov?<br>*Večina poteka samodejno / Nekaj ur na mesec / Nekaj dni vsak mesec / Vsak mesec je to velik projekt* |
| 3 | **Skladiščne operacije in zaloga**<br>Kako pogosto v skladišču iščete blago, ki bi moralo biti na svojem mestu? | **Plačilni roki in terjatve**<br>Kako pogosto naročniki plačajo po dogovorjenem roku?<br>*Roke večinoma držijo / Nekaj zamud mesečno / Redno zamujajo / Zamude so pravilo* |
| 4 | **Prevozna dokumentacija in podatki**<br>Koliko ročnega dela imate z listinami, dokazili o dostavi in prepisovanjem? | **Prevozna dokumentacija, podatki in statusi**<br>*(vprašanje in lestvica nespremenjena)* |
| 5 | **Zamude, stojnine in nujni prevozi**<br>Kako pogosto zamujate z dostavo ali morate prevoz reševati nujno?<br>*Roke držimo / Nekajkrat mesečno / Tedensko / Zamude so pogoste* | **Napačne dostave, poškodbe in reklamacije**<br>*(vprašanje in lestvica nespremenjena)* |
| 6 | **Analitika in poročanje** | **Skladiščne operacije in zaloga**<br>*(vprašanje in lestvica nespremenjena)* |
| 7 | **Računovodstvo in finance** | **Analitika in poročanje** *(nespremenjeno)* |
| 8 | **Kadri in plače**<br>Koliko dela zahtevajo evidence delovnega časa, dopusti in priprava plač? | **Računovodstvo in finance** *(nespremenjeno)* |

---

## 5. Podrobna vprašanja — po področjih

Legenda: **[K]** = kontekstno vprašanje, ki v izračun ne vstopa · **[NV]** = na voljo je „Tega podatka ne vodimo"

### 5.1 ODSTRANJENO — `odprema`, „Planiranje prevozov in izkoriščenost"

| # | Vprašanje | Enota | Zakaj je odšlo |
|---|---|---|---|
| 1 | Kako danes razporejate prevoze? **[K]** | izbira | PANTHEON razporejanja ne opravlja |
| 2 | Koliko kilometrov mesečno vozila prevozijo prazna ali z manj kot polovično izkoriščenostjo? | km/mesec | prazne kilometre zniža optimizacija poti — TMS |
| 3 | Kolikšen je vaš povprečen variabilen strošek kilometra (gorivo, cestnine, obraba, gume)? | EUR/km *(drsnik 0,20–1,60)* | množilo je postavko iz vrstice 2 |
| 4 | Koliko skupnih ur mesečno vozniki in vozila čakajo na nakladu, razkladu ali zaradi nejasnega razporeda? | h/mesec | čakanja na rampi ERP ne odpravi |
| 5 | Koliko ur mesečno porabite za razporejanje, prerazporejanje in iskanje informacij o vožnjah? | h/mesec | razporejanje je TMS |
| 6 | Kaj je glavni vzrok? → *Razpored voženj ni ažuren · Naročila prihajajo prepozno ali nepopolna · Podatki o pošiljkah so raztreseni po orodjih · Stranke pogosto spreminjajo termine in količine · Okvare vozil ali pomanjkanje voznikov · Ne vemo* | izbira | |

### 5.2 ODSTRANJENO — `roki`, „Zamude, stojnine in nujni prevozi"

| # | Vprašanje | Enota | Kam je šlo |
|---|---|---|---|
| 1 | Koliko dostav mesečno opravite z zamudo? **[K]** | dostav/mesec | odstranjeno |
| 2 | Koliko ste v zadnjih 12 mesecih porabili za nujne podnajeme prevoznikov ali ekspresne prevoze? **[NV]** | EUR/leto | odstranjeno — pravočasnost prevoza je TMS |
| 3 | Kolikšni so bili letni penali, stojnine in popusti zaradi zamud? **[NV]** | EUR/leto | **ohranjeno kot [K]** v `obracun_logistika`, brez evrov |
| 4 | Kolikšno izgubljeno prispevno maržo ocenjujete zaradi odpovedanih ali izgubljenih poslov? **[NV]** | EUR/leto | odstranjeno |
| 5 | Koliko ur mesečno porabite za obveščanje strank in usklajevanje zaradi zamud? | h/mesec | **preseljeno v `dokumentacija`**, preoblikovano |
| 6 | Kaj je glavni vzrok? → *Razpored in status pošiljk nista pravočasno vidna · Naročila oziroma podatki pridejo prepozno · Prenos podatkov med prodajo, skladiščem in prevozom je ročen · Stranke, podizvajalci ali carina · Vozila, vozniki ali zastoji na cesti · Ne vemo* | izbira | |

### 5.3 ODSTRANJENO IZ SEGMENTA — `kadriHz`, „Kadri in plače" *(horizontala ostaja pri drugih dejavnostih)*

| # | Vprašanje | Enota | Kam je šlo |
|---|---|---|---|
| 1 | Koliko ur mesečno gre za zbiranje in urejanje evidenc prisotnosti in delovnih ur vaših zaposlenih? | h/mesec | `vozniki`, vprašanje 2 |
| 2 | Koliko ur mesečno vzame priprava podatkov za obračun plač in popravki po obračunu? | h/mesec | `vozniki`, vprašanje 3 *(isto besedilo)* |
| 3 | Koliko ur mesečno gre za dopuste, potne naloge, potrdila in drugo kadrovsko administracijo? | h/mesec | `vozniki`, vprašanje 1 — potni nalogi dobijo svoje vprašanje |
| 4 | Koliko so v zadnjih 12 mesecih stali napačni obračuni plač (poračuni, zamudne obresti, zunanja pomoč)? **[NV]** | EUR/leto | `vozniki`, vprašanje 4 |
| 5 | Kaj je glavni vzrok? | izbira | `vozniki`, z drugimi možnostmi |

> **Zakaj je bilo treba horizontalo umakniti.** Njeno tretje vprašanje izrecno našteva „potne
> naloge". Pri prevozniku je to največja postavka kadrovske administracije, zato bi jo panožno
> in horizontalno področje merili obe — ure bi se štele dvakrat. Isti vzorec kot pri izključitvi
> `dokumentiHz` iz logistike in `financeHz` iz računovodskega servisa.

### 5.4 NOVO — `obracun_logistika`, „Obračun prevozov in nezaračunane storitve"

| # | Vprašanje | Enota | Koš |
|---|---|---|---|
| 1 | Kolikšno vrednost opravljenih dodatkov v letu dni ne zaračunate — čakanje, dodatne postaje, ležarine, doplačila? **[NV]**<br>*Samo delo, ki ste ga opravili in bi ga smeli zaračunati, pa ga niste. Stojnine, ki jih plačate vi, vpišite spodaj.* | EUR/leto | neposredna izguba |
| 2 | Koliko dni po opravljeni dostavi v povprečju izdate račun?<br>*Če račun izdate isti ali naslednji dan, vpišite 0. Zamude naročnikov pri plačilu merimo v področju Plačilni roki.* | dni | neposredna izguba *(strošek kapitala)* |
| 3 | Kolikšna je bila v zadnjih 12 mesecih vrednost napačno zaračunanih prevozov — napačna cena, pozabljen rabat, izdani dobropisi? **[NV]**<br>*Samo napake v ceni. Dobropisi zaradi napačne ali poškodovane pošiljke sodijo v področje Napačne dostave.* | EUR/leto | neposredna izguba |
| 4 | Koliko ur mesečno porabite za pripravo obračuna prevozov — zbiranje dokazil, preverjanje cen, izstavljanje računov?<br>*Knjiženje prejetih računov sodi v področje Računovodstvo in finance, ne sem.* | h/mesec | kapaciteta |
| 5 | Kolikšni so bili letni penali in stojnine, ki ste jih plačali vi? **[K]**<br>*Podatek ne vstopa v izračun — služi za oceno obsega težave.* | EUR/leto | — |
| 6 | Kaj je glavni vzrok? → *Dokazila o dostavi pridejo z zamikom · Dodatki in čakanja se nikjer sproti ne evidentirajo · Ceniki in pogodbeni pogoji niso na enem mestu · Obračun je odvisen od ene osebe · Naročniki spornih postavk ne priznajo · Ne vemo* | izbira | |

**Formula:** nezaračunani dodatki + (letni prihodek ÷ 365 × dni do izdaje računa × strošek
financiranja) + napačno zaračunani prevozi; ure obračuna × strošek administrativne ure × 12

**PANTHEON naslavlja:** cenik s pogodbenimi cenami, rabati in doplačili po naročniku ·
dokazilo o dostavi vezano na dokument, račun brez ponovnega vnosa · kalkulacije lastne cene
po dokumentu in stranki

### 5.5 NOVO — `vozniki`, „Vozniki, potni nalogi in dnevnice"

| # | Vprašanje | Enota | Koš |
|---|---|---|---|
| 1 | Koliko ur mesečno porabite za izdajo, obračun in popravke potnih nalogov ter dnevnic?<br>*Šteje pisarniško delo, ne čas voznika na poti.* | h/mesec | kapaciteta |
| 2 | Koliko ur mesečno gre za zbiranje in urejanje evidenc delovnega časa, odsotnosti in dopustov voznikov?<br>*Evidenca za plačo. Analize tahografa in nadzora voznih časov sem ne štejte.* | h/mesec | kapaciteta |
| 3 | Koliko ur mesečno vzame priprava podatkov za obračun plač in popravki po obračunu? | h/mesec | kapaciteta |
| 4 | Koliko so v zadnjih 12 mesecih stali napačni obračuni dnevnic in plač (poračuni, zamudne obresti, zunanja pomoč)? **[NV]** | EUR/leto | neposredna izguba |
| 5 | Koliko voznikov zaposlujete? **[K]**<br>*Podatek ne vstopa v izračun — pove, kako velik je obseg potnih nalogov.* | voznikov | — |
| 6 | Kaj je glavni vzrok? → *Potni nalogi se izpolnjujejo na papirju ali v preglednicah · Podatki za obračun pridejo iz več virov · Pravila za dnevnice in dodatke so zapletena · Zunanji obračun plač zahteva ročno pripravo podatkov · Vozniki dokumentacijo oddajo z zamudo · Ne vemo* | izbira | |

**Formula:** (potni nalogi in dnevnice + evidence delovnega časa + priprava plač) × strošek
administrativne ure × 12; + letni stroški napačnih obračunov

**PANTHEON naslavlja:** samodejni izračun domačih in tujih dnevnic z znižanjem za obroke ·
kilometrine in potni stroški s foto-zajemom računov na terenu · obračun po stroškovnih mestih
in izplačilo prek plače, brez prepisovanja

### 5.6 NOVO — `terjatve_logistika`, „Plačilni roki in terjatve"

| # | Vprašanje | Enota | Koš |
|---|---|---|---|
| 1 | Kolikšen je povprečen dejanski plačilni rok vaših naročnikov (DSO)? **[K]** | dni | — |
| 2 | Za koliko dni povprečno naročniki prekoračijo dogovorjeni plačilni rok?<br>*Samo prekoračitev NAD dogovorjenim rokom. Financiranje dogovorjenega roka je normalno poslovanje in ni strošek napake.* | dni | neposredna izguba |
| 3 | Koliko ur mesečno porabite za opominjanje, usklajevanje odprtih postavk in izterjavo?<br>*Ne vključujte priprave obračuna in izstavljanja računov — te ure meri področje Obračun prevozov.* | h/mesec | kapaciteta |
| 4 | Kolikšna je bila v zadnjih 12 mesecih vrednost odpisanih ali neizterljivih terjatev? **[NV]** | EUR/leto | neposredna izguba |
| 5 | Kaj je glavni vzrok? → *Računi gredo ven z zamikom · Odprtih postavk ne vidimo sproti · Ena sporna postavka zadrži celoten račun · Opominjanje ni nikogaršnja glavna naloga · Naročniki plačujejo po svojem ritmu · Ne vemo* | izbira | |

**Formula:** letni prihodek ÷ 365 × dni prekoračitve roka × strošek financiranja; ure
opominjanja × strošek administrativne ure × 12; + odpisane terjatve

**PANTHEON naslavlja:** samodejni opomini in lestvica opominjanja po zapadlosti · odprte
postavke in limit naročnika vidni že ob vnosu naročila · izdaja e-računov skladno z ZIERDED

> **Meja med 5.4 in 5.6 je časovna.** `obracun_logistika` meri dneve **pred** izdajo računa,
> `terjatve_logistika` dneve **po** zapadlosti. Napotek pod obema vprašanjema to izrecno pove,
> zato se isti dan ne more šteti dvakrat.

### 5.7 SPREMENJENO — `dokumentacija`

Naslov: „Prevozna dokumentacija **in podatki**" → „Prevozna dokumentacija, podatki **in statusi**"

| # | Prej | Zdaj |
|---|---|---|
| 1 | Koliko ur mesečno porabite za pripravo, tiskanje in zbiranje prevoznih listin (CMR, dobavnice, dokazila o dostavi)? | *nespremenjeno* |
| 2 | Koliko ur mesečno porabite samo za prepisovanje podatkov med ERP-jem, Excelom, portali strank in papirjem? | *nespremenjeno* |
| 3 | Koliko ur mesečno porabite za popravljanje napačnih ali manjkajočih podatkov (naslovi, teže, cene prevoza)? | *nespremenjeno* |
| 4 | — | **Koliko ur mesečno porabite za odgovarjanje na vprašanja, kje je pošiljka, in za obveščanje o zamudah?**<br>*Reševanje reklamacij zaradi napačnih ali poškodovanih pošiljk sodi v področje Napačne dostave.* |
| 5 | Kdaj dokazilo o dostavi (POD) pride v vaš sistem? **[K]** | *nespremenjeno* |
| 6 | Kaj je glavni vzrok? *(iste možnosti)* | *nespremenjeno* |

Novo vprašanje je naslednik ukinjenega `roki` → *„Koliko ur mesečno porabite za obveščanje
strank in usklajevanje zaradi zamud?"* Razlika je namerna: zamude same so stvar prevoza,
poizvedba „kje je pošiljka" pa nastane, ker naročnik statusa ne vidi sam — in prav to je
dokumentna težava, ki jo ERP naslovi.

**Alineje PANTHEON:** tretja je zamenjana — *„Enoten vir podatkov namesto Excela ob ERP-ju"*
→ *„Statusi dokumentov in zgodovina po naročniku, vidni sproti"*. Druga je natančnejša:
*„E-računi in elektronska izmenjava dokumentov"* → *„… (eSlog)"*.

### 5.8 NESPREMENJENO — `napake`, „Napačne dostave, poškodbe in reklamacije"

| # | Vprašanje | Enota |
|---|---|---|
| 1 | Koliko pošiljk oziroma dostav mesečno opravite? | pošiljk/mesec |
| 2 | Kolikšen delež pošiljk je napačnih, nepopolnih ali poškodovanih tako, da terja popravek? | % *(0–10 %)* |
| 3 | Kolikšen je povprečen neposreden strošek ene take napake? | EUR *(drsnik 5–300)* |
| 4 | Kolikšna je bila letna vrednost poškodovanega, izgubljenega ali ukradenega blaga, ki ste jo krili sami? **[NV]** | EUR/leto |
| 5 | Koliko ur mesečno porabite za reševanje reklamacij in iskanje izgubljenih pošiljk? | h/mesec |
| 6 | Kaj je glavni vzrok? → *Podatki o pošiljki so nepopolni ali napačni · Naročilo se ročno prepisuje med orodji · Blago ni zanesljivo označeno oziroma ni sledljivo · Napake pri komisioniranju oziroma pomanjkanje usposabljanja · Poškodbe pri prevozu, embalaža ali oprema · Ne vemo* | izbira |

**Spremenjena sta dva napotka**, ker se sklicujeta na ukinjeni področji:
- vprašanje 2: *„Zamude brez napake v vsebini sodijo v področje Roki."* → *„Zamuda brez napake v vsebini sem ne sodi."*
- vprašanje 5: *„Obveščanje strank o zamudah sodi v področje Zamude, ne sem."* → *„… sodi v področje Prevozna dokumentacija, ne sem."*

**Spremenjena je ena alineja PANTHEON:** *„Zgodovina dokumentov po stranki in artiklu"* →
*„Reklamacije od kupcev in do dobaviteljev v enem postopku, z zgodovino dokumentov"*.

### 5.9 NESPREMENJENO — `skladisce`, „Skladiščne operacije in zaloga"

| # | Vprašanje | Enota |
|---|---|---|
| 1 | Koliko skupnih ur mesečno v skladišču porabite za iskanje blaga, prekladanje in ponovno urejanje lokacij? | h/mesec |
| 2 | Kolikšna je povprečna vrednost zaloge, ki je v vaši lasti? | EUR |
| 3 | Kolikšna je bila v zadnjih 12 mesecih vrednost popisnih razlik, odpisov in zastarane zaloge? **[NV]** | EUR/leto |
| 4 | Kolikšen delež zaloge bi po vaši oceni lahko znižali brez večjega tveganja za oskrbo? → *Do 5 % · 6–10 % · 11–20 % · Več kot 20 % · Ne vem* | izbira |
| 5 | Kako dober je vaš pregled nad zalogo po lokacijah? **[K]** → *Sproten in po lokacijah · Večinoma zanesljiv · Deloma ERP, deloma Excel · Pogosto ugotovimo šele ob inventuri* | izbira |
| 6 | Kaj je glavni vzrok? → *Lokacije blaga niso vodene oziroma niso ažurne · Prevzemi in izdaje se ne evidentirajo sproti · Parametri zaloge in naročanje niso usklajeni · Dobavitelji dostavljajo nepredvidljivo · Premalo prostora oziroma neustrezna oprema · Ne vemo* | izbira |

**Spremenjen je en napotek:** vprašanje 1, *„Čakanje vozil na rampi štejte v področju
Planiranje prevozov, ne tukaj."* → *„Iskanje listin in dokazil sodi v področje Prevozna
dokumentacija, ne sem."*

**Spremenjeni sta dve alineji PANTHEON:**

| Prej | Zdaj |
|---|---|
| Skladišča, lokacije, serije in loti | Skladišča, lokacije, serije in loti — tudi komisijsko skladišče za tuje blago |
| Sproten pregled nad zalogo po skladiščih | Inventura s čitalci črtnih kod in sproten pregled zaloge po skladiščih |
| Minimalne zaloge in točke naročanja | *(nespremenjeno)* |

### 5.10 NESPREMENJENO — `analitikaHz` in `financeHz`

Obe horizontali sta nespremenjeni; po pet vprašanj vsaka.

**Analitika in poročanje:** ročna priprava rednih poročil · izredne analize · združevanje
podatkov iz več virov · kako stare so ključne številke **[K]** · glavni vzrok

**Računovodstvo in finance:** ročno knjiženje in priprava dokumentov · usklajevanje (banka,
kartice, IOP) · davčni obračuni, DDV in poročanje državi · zamudne obresti, globe in popravki
**[NV]** · glavni vzrok

---

## 6. Kratka diagnostika — 3 od 4 vprašanj preoblikovana

Lestvica pri vseh štirih ostaja: *Da, zanesljivo / Večinoma / Le približno / Ne / Nismo preverili*

| # | Prej | Zdaj | Zakaj |
|---|---|---|---|
| 1 | Ali se opravljene vožnje, **kilometri** in ure evidentirajo sproti? | Ali se opravljene vožnje, **dodatki** in ure evidentirajo sproti? | dodatki so tisto, kar se izgubi pri obračunu; kilometrov ne merimo več |
| 2 | Ali poznate dejansko lastno ceno posamezne vožnje oziroma pošiljke? | *(nespremenjeno)* | kalkulacija lastne cene po dokumentu je v PANTHEON |
| 3 | Ali lahko kadar koli zanesljivo poveste, **kje je posamezna pošiljka**? | Ali za vsako opravljeno storitev takoj najdete **dokazilo o dostavi in pripadajoči dokument**? | „kje je pošiljka" je telematika; sledljivost dokumenta je ERP |
| 4 | Ali **razporejanje prevozov** deluje normalno tudi brez ključne osebe? | Ali **obračun prevozov in plač** deluje normalno tudi brez ključne osebe? | razporejanje je TMS; obračun je ERP |

Ključ tretjega polja je zaradi tega preimenovan iz `shipmentTraceability` v `documentTraceability`.

**Spremenjena so tudi besedila ocen tveganja** — „Procesna odpornost" ne govori več o sledljivosti
pošiljke in razporejanju, ampak o sledljivosti dokazil in odpornosti obračuna.

**Spremenjena je ena alineja PANTHEON:** *„Serije in loti s popolno sledljivostjo"* →
*„Dokumentni arhiv z dokazili, vezanimi na knjižbo"*.

---

## 7. Besedila dejavnosti

| Polje | Prej | Zdaj |
|---|---|---|
| `heroTitle` | Koliko vas letno stanejo **prazni kilometri in stojnine**? | Koliko vas letno stanejo **nezaračunani dodatki in pozni računi**? |
| `heroSubtitle` | Slabo izkoriščene vožnje, napačne dostave, poškodovano blago in nujni podnajemi se razpršijo med gorivo, delo in penale. Nobena od teh postavk nima svoje vrstice. | Čakanja, ki jih pozabite zaračunati, računi, ki čakajo na dokazilo, potni nalogi in dnevnice ter denar, ki predolgo stoji pri naročniku. Nobena od teh postavk nima svoje vrstice. |
| `triage.intro` | … od **planiranja prevozov in napačnih dostav do skladišča in stojnin** … izračun pa vezan na **vaš vozni park in vaše stranke**. | … od **obračuna prevozov in potnih nalogov do dokumentacije, reklamacij in skladišča** … izračun pa vezan na **vaše naročnike in vašo ekipo**. |
| `costBasis.intro` | **Štiri številke**, ki veljajo za vsa področja … **Prihodek in maržo** vprašamo enkrat … | **Pet številk**, ki veljajo za vsa področja … **Prihodek, maržo in strošek financiranja** vprašamo enkrat … |
| `figures.directLoss.note` | Denar, ki dejansko odteka: **prazni kilometri, poškodovano blago, nujni podnajemi, penali in stojnine**. | Denar, ki dejansko odteka: **nezaračunani dodatki, napačno zaračunani prevozi, odpisane terjatve in poračuni dnevnic**. |
| `emailGate.subtitle` | … ukrepi, ki jih je **v prevozu in skladišču** mogoče začeti ta teden. | … ukrepi, ki jih je **v obračunu, dokumentaciji in skladišču** mogoče začeti ta teden. |
| `context.title`, `context.intro`, `results.headline`, `emailGate.title`, `pdf.documentTitle` | | *nespremenjeno* |

---

## 8. Ukrepi v akcijskem načrtu

| Področje | Prej | Zdaj |
|---|---|---|
| `odprema` | Največji strošek: prazne vožnje in čakanje | *odstranjeno* |
| `roki` | Največji strošek: zamude in nujni prevozi | *odstranjeno* |
| `obracun_logistika` | — | Največji strošek: obračun in nezaračunane storitve |
| `vozniki` | — | Največji strošek: potni nalogi in dnevnice |
| `terjatve_logistika` | — | Največji strošek: plačilni roki in terjatve |
| `dokumentacija` | Največji strošek: dokumentacija in podatki | Največji strošek: dokumentacija, podatki in statusi — tretji ukrep zamenjan s štetjem poizvedb „kje je pošiljka" |
| `napake`, `skladisce` | | *nespremenjeno* |

Ukrepi ostajajo **procesni in ne produktni** — nobeden ne omenja PANTHEON, licence ali nakupa.
To je bilo pri `odprema` tudi znamenje težave: bil je edini modul v datoteki, kjer za ukrepom
(„poiščite povratni tovor", „razpored zaključite ob fiksni uri") ni stal noben produkt.

---

## 9. Popravek trditve o licencah

Koda je na štirih mestih trdila, da logistiko pokrivata „SE in ME **(modula LT in LT3)**".

**LT in LT3 nista modula.** Sta samostojni izdaji skupine Small Business in po ceniku ležita
**pod** SE, ne v njem:

| Izdaja | Skupina | Nakup (brez DDV) | Najem/mes |
|---|---|---|---|
| LT (1 uporabnik) | Small Business | 603,79 EUR | 22,90 EUR |
| LT3 (3 uporabniki) | Small Business | 1.208,79 EUR | 45,00 EUR |
| SE (1 uporabnik) | Enterprise | 1.813,79 EUR | 57,00 EUR |
| ME (1 uporabnik) | Enterprise | 2.055,79 EUR | 65,00 EUR |

Trditev je bila torej hkrati napačna in cenovno zavajajoča. Popravljena je v
`content/sales/licences.ts`, `src/config/industries.ts`, `src/config/modules/logistika.ts` in
`README.md`. Nova formulacija:

> „Datalab za logistiko nima ne ločene licence ne vertikale — pokrivata jo Enterprise izdaji
> SE in ME. Namenskega skladiščnega (WMS) ali transportnega (TMS) sistema PANTHEON ne ponuja,
> zato tega ne obljubljajte."

---

## 10. Kaj se s prenovo izgubi

Pošteno je zapisati tudi to:

1. **Izgubimo največje absolutne zneske.** Prazni kilometri pri prevozniku s 30 vozili so
   največja posamična postavka v vprašalniku. Odšla je, ker je ne moremo znižati — ne zato,
   ker ne bi bila resnična.
2. **Izgubimo besednjak, ki ga panoga takoj prepozna.** „Prazni kilometri in stojnine" je
   naslov, ki prevozniku pove, da razumemo njegov posel. „Nezaračunani dodatki in pozni računi"
   je natančnejši, a manj domač.
3. **Nekaj signala za kvalifikacijo.** Obseg voznega parka in čakanja na rampah sta bila
   uporabna za oceno velikosti. Delno je nadomeščeno s kontekstnimi vprašanji (število
   voznikov, penali in stojnine, dejanski DSO), ki se še vedno vprašajo in zapišejo v izvoz
   za CRM — samo v evre ne vstopajo.

Nasprotna stran: vsak evro, ki ga poročilo zdaj pokaže, ima za sabo funkcionalnost, ki jo
Datalab lahko pokaže na demu.
