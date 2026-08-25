# PROIZVODNJA — celoten potek vprašalnika

> Popis trenutnega stanja, izpisan dobesedno iz kode kalkulatorja (`src/config/modules/proizvodnja.ts`, `horizontal.ts`, `contexts/proizvodnja.ts`, `segments.ts` in koraki v `src/components/Calculator/`).
> Stanje na dan 11. 8. 2026, veja `panoge-in-prodajno-porocilo`.

Ključna ločnica: **10 področij se oceni v triaži, podrobna vprašanja dobiš samo za tista, ki jih obkljukaš** (privzeto 3). Spodaj so izpisana vsa. Kdor bi obkljukal vseh 10, odgovori na **76 vprašanj**; tipična pot je **~37**.

---

## KORAK 1 — Dejavnost

> **Koliko vas stane sedanji način dela?**
> Izberite dejavnost. Za priporočena tri področja boste potrebovali okoli deset minut.

**V1.1** Spustni seznam: Proizvodnja · Trgovina, veleprodaja in distribucija · Računovodski servisi · Storitvena in projektna podjetja · Maloprodaja · Logistika in transport · Drugo

*Če »Drugo« →* **V1.2** »Kaj je najbliže vašemu načinu dela?« → **Izdelujemo ali predelujemo izdelke** (pelje v isti proizvodni vprašalnik) · Prodajamo ali distribuiramo blago · Zaračunavamo ure, projekte ali storitve · Prevažamo ali skladiščimo za druge · Nič od tega ne ustreza

> Brez števca korakov — dokler dejavnost ni znana, ni znano, koliko korakov sledi.

---

## KORAK 2 — Velikost

> **Koliko ljudi zaposlujete?**

**V2.1** `employeeCount` — številka, »zaposlenih«

> *Podatek na izračun ne vpliva — iz njega izpeljemo le velikostni razred podjetja, ki se izpiše v poročilu.*

---

## KORAK 3 — Kontekst

> **Nekaj o vaši proizvodnji**
> Tri vprašanja, ki ne sprašujejo po številkah. Iz njih izpeljemo, koliko od izmerjenega stroška je realno mogoče nasloviti — podjetje, ki že uporablja proizvodni modul, je lažje izboljšave namreč večinoma že pobralo.

**V3.1 — Kako pretežno proizvajate?**
Po naročilu · Serijsko · Na zalogo · Projektno · Kombinirano
→ *Danes ne vpliva na nič razen na oznako v prodajnem poročilu.*

**V3.2 — Kako danes vodite proizvodnjo?** ← prodajni signal (vrzel sistema); v izračun ne vstopa

| Odgovor | Vrzel sistema | PANTHEON? |
|---|---|---|
| PANTHEON MF in/ali MT | 8–20 % | da |
| PANTHEON brez proizvodnega modula | 15–30 % | da |
| Drug ERP za proizvodnjo | 15–30 % | ne |
| Kombinacija ERP-ja, Excela in papirja | 25–40 % | ne |
| Večinoma Excel, papir ali sprotni dogovor | 25–40 % | ne |

**V3.3 — Kakšna je vaša vloga?**
Direktor/-ica · Vodja proizvodnje · Finance ali računovodstvo · Nabava ali logistika · Drugo
→ *Uteži ICP dimenzijo »bližina odločevalcu« (15 %).*

---

## KORAK 4 — Triaža (10 področij)

> **Kje vas najbolj tišči?**
> Na hitro ocenite vsako področje. Podrobna vprašanja vam nato zastavimo samo za največje težave — tako vprašalnik ostane kratek, izračun pa specifičen za vaše podjetje.

Vsako področje: ena ocena 0–3 + kljukica **»Izračunaj podrobno«**.

| # | Področje | Vprašanje | 0 | 1 | 2 | 3 |
|---|---|---|---|---|---|---|
| T1 | **Plan, kapacitete in navodila** | Kako pogosto se plan spreminja ali proizvodnja čaka zaradi nejasnih prioritet, navodil ali podatkov? | Plan je stabilen | Občasno | Redno, z vplivom | Skoraj vsak dan |
| T2 | **Izmet, dodelave in kakovost** | Kako pogosto nastajajo izmet, dodelave ali reklamacije? | Redko | Mesečno | Tedensko | Pri velikem deležu nalogov |
| T3 | **Zaloge in razpoložljivost materiala** | Kako pogosto imate preveč zaloge, hkrati pa manjka pravi material? | Zaloge so pod nadzorom | Občasno | Redno | Stalno |
| T4 | **Delovni nalogi in podatki** | Koliko ročnega dela imate s pripravo nalogov, papirji in prepisovanjem? | Večina poteka digitalno | Nekaj ur tedensko | Vsak dan | Za to je potreben skoraj cel človek |
| T5 | **Roki in nujni stroški** | Kako pogosto zamujate ali rešujete naročila nujno? | Roke držimo | Nekajkrat mesečno | Tedensko | Zamude so pogoste |
| T6 | **Analitika in poročanje** | Koliko ročnega dela zahteva priprava poročil in ključnih številk za odločanje? | Poročila se sestavijo sama | Nekaj ur ob koncu meseca | Vsak teden po nekaj ur | S poročili se nekdo ukvarja skoraj vsak dan |
| T7 | **Računovodstvo in finance** | Koliko ročnega dela je v vašem računovodstvu in financah (knjiženje, usklajevanje, obračuni)? | Večina poteka samodejno | Nekaj ur ob koncu meseca | Več dni vsak mesec | Konec meseca je vsakič zamašek |
| T8 | **Kadri in plače** | Koliko dela zahtevajo evidence delovnega časa, dopusti in priprava plač? | Malo — večina poteka samodejno | Nekaj ur na mesec | Nekaj dni vsak mesec | Vsak mesec je to velik projekt |
| T9 | **Dokumentacija in e-poslovanje** | Koliko časa se izgubi s potrjevanjem, iskanjem in ročnim pošiljanjem dokumentov? | Dokumenti so urejeni in dostopni | Občasno kaj iščemo | Potrjevanje in iskanje se redno vlečeta | Dokumentacija je stalna težava |
| T10 | **Reklamacije in poprodajni servis** | Koliko dela vam povzročajo garancijska popravila, servis in vodenje reklamacij po predaji? | Skoraj nič — primerov je malo | Nekaj primerov na mesec | Vsak teden več primerov | S servisom se nekdo ukvarja vsak dan |

> *Podrobno bomo izračunali N od 10 področij. Priporočamo tri, izberete pa lahko poljubno mnogo — neizmerjena področja ostanejo prazna in nobene številke si ne izmislimo.*

**Privzeta izbira:** prva tri po vrstnem redu (Plan, Izmet, Zaloge), dokler se obiskovalec triaže ne dotakne; nato sledi najvišjim ocenam.

---

## KORAK 5 — Skupna finančna osnova

> **Skupna finančna osnova**
> Dve številki, ki veljata za vsa področja. Polni strošek pomeni bruto plačo z vsemi prispevki in režijo, ne neto izplačila.

**V5.1 — Približen polni strošek neposredne proizvodne ure**
*Operater, varilec, monter — kdor dela na delovnem nalogu.*
Vnos EUR/h · ali »Ne vem — izberi razpon«: Do 30 EUR (25) · 30–45 EUR (37) · 45–60 EUR (52) · Več kot 60 EUR (70) · prazno → 45

**V5.2 — Približen polni strošek administrativne oziroma vodstvene ure**
*Planer, vodja proizvodnje, nabava, priprava dela.*
Vnos EUR/h · ali razpon: Do 25 EUR (20) · 25–35 EUR (30) · 35–50 EUR (42) · Več kot 50 EUR (60) · prazno → 35

> *Če katere od postavk ne poznate, izberite razpon. Izračun bo tekel naprej, rezultat pa bo označen z nižjo zanesljivostjo — raje to kot navidezno natančen znesek.*

> Proizvodnja **ne** vpraša zaračunane urne postavke (to je samo pri storitvah), niti prihodka in marže (to je samo pri maloprodaji).

---

## KORAK 6 — Vaše številke

> **Vaše številke** · *Izračun prilagojen za: Proizvodnja 10–249 zaposlenih*
> Na dnu ves čas: **Trenutni letni strošek izbranih področij: X EUR**
> *Sproščene ure ne pomenijo nižje plačne mase — zaposleni ostane. Gre za čas, ki ga lahko usmerite v drugo delo.*

Vsako izbrano področje se razpre v 4–6 vprašanj. Vsako se konča z **»Kaj je glavni vzrok?«**, ki določa naslovljivi delež:

| Kategorija vzroka | Naslovljivi delež |
|---|---|
| podatki / dokumentacija | **75 %** |
| planiranje / vidnost | **65 %** |
| ljudje / odgovornosti | **45 %** |
| zunanji dejavniki | **25 %** |
| fizično / okvare | **15 %** |
| **Ne vemo** ← privzeto | **30 %** |

---

### P1 · Plan, kapacitete in navodila

*Čakanje zaradi nejasnih prioritet, spremembe plana in čas, porabljen za ponovno usklajevanje.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Kako danes planirate proizvodnjo?** — MRP oziroma ERP plan / ERP brez zanesljivega planiranja / **Excel** / Papir oziroma sprotni dogovor | izbira · *samo kontekst* | Excel |
| 2 | **Koliko skupnih človek-ur mesečno proizvodnja čaka zaradi nejasnega plana, napačnih prioritet ali manjkajočih navodil?**<br>*Ne vključujte čakanja na material ali okvar strojev — čakanje na material sodi v področje Zaloge.* | h/mesec | 0 |
| 3 | **Koliko nadur mesečno povzroča predvsem spreminjanje plana?** | h/mesec | 0 |
| 4 | **Koliko ur mesečno porabite za ponovno planiranje, usklajevanje prioritet in iskanje informacij?** | h/mesec | 0 |
| 5 | **Kaj je glavni vzrok?** — Plan in kapacitete niso ažurni (65 %) / Podatki ali navodila niso enotni oziroma so zastareli (75 %) / Stanje nalogov ni vidno sproti (65 %) / Pogoste spremembe kupcev (25 %) / Okvare strojev ali drugi tehnični razlogi (15 %) / **Ne vemo (30 %)** | izbira | Ne vemo |

```
kapaciteta  Zastoji in nadure v proizvodnji    = (V2 + V3) × proizvodna ura × 12
kapaciteta  Ponovno planiranje in usklajevanje = V4 × admin ura × 12
```
**Neposredna izguba: 0 EUR.**

---

### P2 · Izmet, dodelave in kakovost

*Material, ki konča kot izmet, ure ponovne izdelave in stroški reklamacij.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Kolikšna je letna vrednost porabljenega materiala?** | EUR/leto | 0 |
| 2 | **Kolikšen delež porabljenega materiala postane izmet, ki ga ni mogoče uporabiti ali prodati?** | drsnik 0–15 %, korak 0,5 | **3 %** ⚠ |
| 3 | **Koliko skupnih človek-ur mesečno porabite za dodelave in ponovno izdelavo?** | h/mesec | 0 |
| 4 | **Kolikšni so letni dodatni stroški reklamacij?**<br>*Vnesite samo stroške, ki še niso vključeni v izmet ali dodelave.* | EUR/leto | 0 |
| 5 | **Kaj je glavni vzrok?** — Zastarele ali napačne sestavnice oziroma normativi (75 %) / Napačna verzija dokumentacije ali navodil (75 %) / Poraba materiala ni evidentirana sproti (75 %) / Napake pri izvedbi oziroma pomanjkanje usposabljanja (45 %) / Kakovost materiala ali okvare strojev (15 %) / **Ne vemo (30 %)** | izbira | Ne vemo |

```
izguba      Izmet materiala              = V1 × V2
izguba      Reklamacije in vračila       = V4
kapaciteta  Dodelave in ponovna izdelava = V3 × proizvodna ura × 12
```

⚠ **Privzetih 3 % je edini privzetek v celotni proizvodnji, ki sam od sebe ustvari znesek** — dovolj je, da obiskovalec vpiše letni material.

---

### P3 · Zaloge in razpoložljivost materiala

*Odpisi in razvrednotenja, čakanje na manjkajoč material in kapital, vezan v zalogah.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Kolikšna je povprečna skupna vrednost zalog?**<br>*Vključite surovine, nedokončano proizvodnjo in končne izdelke.* | EUR | 0 |
| 2 | **Kolikšna je bila vrednost odpisov, razvrednotenj ali dodatnih popustov zaradi zastaranja zaloge v zadnjih 12 mesecih?** | EUR/leto | 0 |
| 3 | **Koliko skupnih človek-ur mesečno proizvodnja čaka samo zaradi manjkajočega materiala?**<br>*Zastoje zaradi nejasnega plana štejte v področju Plan, ne tukaj.* | h/mesec | 0 |
| 4 | **Kolikšen delež zalog bi po vaši oceni lahko zmanjšali brez večjega tveganja za oskrbo?** — Do 5 % / 6–10 % / 11–20 % / Več kot 20 % / **Ne vem** | izbira | Ne vem → 5 % |
| 5 | **Kako dober je vaš pregled nad dejanskimi zalogami?** — Sproten in po lokacijah / Večinoma zanesljiv / **Deloma ERP, deloma Excel** / Pogosto ugotovimo šele ob inventuri | izbira · *samo kontekst* | Deloma ERP |
| 6 | **Kaj je glavni vzrok?** — Parametri zalog in plan niso ustrezni (65 %) / Stanje zalog oziroma lokacij ni zanesljivo (75 %) / Nabava ni dovolj povezana s planom proizvodnje (65 %) / Dobavitelji so nezanesljivi (25 %) / Zalogo zavestno držimo kot varovalko (45 %) / **Ne vemo (30 %)** | izbira | Ne vemo |

```
izguba            Odpisi in razvrednotenja zalog       = V2
kapaciteta        Čakanje na manjkajoč material        = V3 × proizvodna ura × 12
enkratni kapital  Sprostljiv obratni kapital v zalogah = V1 × delež iz V4
```
Enkratni kapital je **edina postavka brez naslovljivega deleža** — ta znesek že *je* potencial.

---

### P4 · Delovni nalogi in podatki

*Priprava in zaključevanje nalogov, prepisovanje med orodji in popravljanje napačnih podatkov.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Koliko skupnih ur mesečno porabite za pripravo, tiskanje, zbiranje in zaključevanje delovnih nalogov?** | h/mesec | 0 |
| 2 | **Koliko skupnih ur mesečno porabite samo za prepisovanje podatkov med ERP-jem, Excelom in papirjem?**<br>*Ne vključujte priprave in zaključevanja nalogov iz prvega vprašanja.* | h/mesec | 0 |
| 3 | **Koliko ur mesečno porabite za popravljanje napačnih, manjkajočih ali neusklajenih podatkov?** | h/mesec | 0 |
| 4 | **Kdaj se dejanska poraba materiala in opravljeno delo evidentirata?** — Sproti na terminalu / Isti dan / **Naslednji dan** / Šele ob zaključku naloga | izbira · *samo kontekst* | Naslednji dan |
| 5 | **Kaj je glavni vzrok?** — Podatke vodimo v več različnih orodjih (75 %) / Delovni nalogi so večinoma papirni (75 %) / Podatki se ne vnašajo sproti (75 %) / Odgovornosti niso jasne (45 %) / **Ne vemo (30 %)** | izbira | Ne vemo |

```
kapaciteta  Priprava in zaključevanje nalogov = V1 × admin ura × 12
kapaciteta  Prepisovanje podatkov med orodji  = V2 × admin ura × 12
kapaciteta  Popravljanje napačnih podatkov    = V3 × admin ura × 12
```
**Neposredna izguba: 0 EUR.**

---

### P5 · Roki in nujni stroški

*Ekspresne nabave, penali, izgubljena marža in čas, porabljen za pojasnjevanje zamud kupcem.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Od koliko naročil mesečno jih povprečno odpremite z zamudo?**<br>*Podatek ne vstopa v izračun — služi za oceno obsega težave.* | naročil/mesec · *samo kontekst* | 0 |
| 2 | **Koliko ste v zadnjih 12 mesecih porabili za ekspresne nabave ali dostave?**<br>*Samo dodatni strošek nad običajno nabavo oziroma dostavo.* | EUR/leto | 0 |
| 3 | **Kolikšni so bili letni popusti, penali ali drugi neposredni stroški zaradi zamud?** | EUR/leto | 0 |
| 4 | **Kolikšno izgubljeno prispevno maržo ocenjujete zaradi odpovedanih naročil?**<br>*Ne vpisujte celotne vrednosti izgubljenega naročila.* | EUR/leto | 0 |
| 5 | **Koliko ur mesečno porabite za obveščanje kupcev in usklajevanje zaradi zamud?**<br>*Ne vključujte ponovnega planiranja proizvodnje iz področja Plan.* | h/mesec | 0 |
| 6 | **Kaj je glavni vzrok?** — Plan in stanje proizvodnje nista pravočasno vidna (65 %) / Material ali zaloge niso pravočasno na voljo (65 %) / Prenos podatkov med prodajo, nabavo in proizvodnjo je ročen (75 %) / Zunanji dobavitelji ali kupci (25 %) / Zmogljivosti oziroma stroji (15 %) / **Ne vemo (30 %)** | izbira | Ne vemo |

```
izguba      Ekspresne nabave in dostave       = V2
izguba      Penali in popusti zaradi zamud    = V3
izguba      Izgubljena prispevna marža        = V4
kapaciteta  Obveščanje in usklajevanje s kupci = V5 × admin ura × 12
```
**Največji vir neposredne izgube v proizvodnji** — tri polja, ki gredo neposredno v naslovni znesek.

---

### P6 · Analitika in poročanje *(horizontalno)*

| # | Vprašanje | Tip |
|---|---|---|
| 1 | **Koliko ur mesečno gre za ročno pripravo rednih poročil za vodstvo ali lastnike?**<br>*Ure, ki ste jih že vpisali v drugem področju, tu ne ponavljajte.* | h/mesec |
| 2 | **Koliko ur mesečno vzamejo izredne analize in vprašanja »na hitro potrebujemo številko«?** | h/mesec |
| 3 | **Koliko ur mesečno gre za zbiranje in ročno združevanje podatkov iz različnih virov v eno preglednico?** | h/mesec |
| 4 | **Kako stare so ključne številke, ko jih vodstvo vidi?** — Sprotne, iz sistema / Stare nekaj dni / **Stare nekaj tednov** / Vidimo jih šele ob obračunu | izbira · *samo kontekst* |
| 5 | **Kaj je glavni vzrok?** — Podatki so v več sistemih in preglednicah (75 %) / Poročila ročno sestavlja ena oseba (45 %) / Vsak oddelek ima svoje številke (75 %) / Zahteve po poročilih se pogosto spreminjajo (65 %) / Podatke dobimo od zunanjega računovodstva (25 %) / **Ne vemo (30 %)** | izbira |

```
kapaciteta × 3  (Ročna priprava rednih poročil / Izredne analize in iskanje številk /
                 Združevanje podatkov iz več virov)  = ure × admin ura × 12
```
**Neposredna izguba: 0 EUR.**

---

### P7 · Računovodstvo in finance *(horizontalno)*

| # | Vprašanje | Tip |
|---|---|---|
| 1 | **Koliko ur mesečno gre za ročno knjiženje in pripravo dokumentov za računovodstvo (interno ali zunanji servis)?**<br>*Ure, ki ste jih že vpisali v drugem področju, tu ne ponavljajte.* | h/mesec |
| 2 | **Koliko ur mesečno porabite za usklajevanje — banka, kartice kupcev in dobaviteljev, medsebojni IOP?**<br>*Štejte samo usklajevanje evidenc, ne opominjanja kupcev.* | h/mesec |
| 3 | **Koliko ur mesečno vzamejo davčni obračuni, DDV in poročanje državi?** | h/mesec |
| 4 | **Koliko so v zadnjih 12 mesecih znašale zamudne obresti, globe in stroški popravkov obračunov?** | EUR/leto |
| 5 | **Kaj je glavni vzrok?** — Dokumenti do knjiženja potujejo ročno (75 %) / Isti podatek vnašamo v več sistemov (75 %) / Napake odkrijemo šele pri usklajevanju (65 %) / Odvisni smo od zunanjega servisa (25 %) / Nihče nima financ v celoti za svojo nalogo (45 %) / **Ne vemo (30 %)** | izbira |

```
kapaciteta × 3  = ure × admin ura × 12
izguba          Zamudne obresti, globe in popravki = V4
```

---

### P8 · Kadri in plače *(horizontalno)*

| # | Vprašanje | Tip |
|---|---|---|
| 1 | **Koliko ur mesečno gre za zbiranje in urejanje evidenc prisotnosti in delovnih ur?**<br>*Ure, ki ste jih že vpisali v drugem področju, tu ne ponavljajte.* | h/mesec |
| 2 | **Koliko ur mesečno vzame priprava podatkov za obračun plač in popravki po obračunu?** | h/mesec |
| 3 | **Koliko ur mesečno gre za dopuste, potne naloge, potrdila in drugo kadrovsko administracijo?** | h/mesec |
| 4 | **Koliko so v zadnjih 12 mesecih stali napačni obračuni plač (poračuni, zamudne obresti, zunanja pomoč)?** | EUR/leto |
| 5 | **Kaj je glavni vzrok?** — Evidence ur se zbirajo ročno — papir ali preglednice (75 %) / Podatki za plače pridejo iz več virov (75 %) / Pravila za dodatke in nadomestila so zapletena (65 %) / Zunanji obračun plač zahteva ročno pripravo podatkov (25 %) / Kadrovska evidenca ni nikogaršnja glavna naloga (45 %) / **Ne vemo (30 %)** | izbira |

```
kapaciteta × 3  = ure × admin ura × 12
izguba          Stroški napačnih obračunov plač = V4
```

---

### P9 · Dokumentacija in e-poslovanje *(horizontalno)*

| # | Vprašanje | Tip |
|---|---|---|
| 1 | **Koliko ur mesečno gre za ročno potrjevanje dokumentov — računov, naročil, pogodb — in priganjanje podpisnikov?**<br>*Ure, ki ste jih že vpisali v drugem področju, tu ne ponavljajte.* | h/mesec |
| 2 | **Koliko ur mesečno gre za iskanje in arhiviranje dokumentov?** | h/mesec |
| 3 | **Koliko ur mesečno gre za tiskanje, skeniranje in ročno pošiljanje dokumentov, ki bi lahko potovali elektronsko?** | h/mesec |
| 4 | **Koliko so v zadnjih 12 mesecih stali izgubljeni ali prepozno potrjeni dokumenti (zamujeni skonti, zamudne obresti, ponovna izstavitev)?** | EUR/leto |
| 5 | **Kaj je glavni vzrok?** — Dokumenti so v mapah in e-pošti, ne v sistemu (75 %) / Potrjevanje poteka ročno, po e-pošti ali na papirju (65 %) / Dokumenti prihajajo papirno ali kot skeni (25 %) / Ni jasno, katera različica dokumenta je veljavna (75 %) / Le ena oseba ve, kje kaj je (45 %) / **Ne vemo (30 %)** | izbira |

```
kapaciteta × 3  = ure × admin ura × 12
izguba          Stroški izgubljenih in prepozno potrjenih dokumentov = V4
```

---

### P10 · Reklamacije in poprodajni servis *(horizontalno)*

| # | Vprašanje | Tip |
|---|---|---|
| 1 | **Koliko ur mesečno gre za garancijska popravila in servisne posege po predaji izdelka, blaga ali projekta?**<br>*Ure, ki ste jih že vpisali v drugem področju, tu ne ponavljajte.* | h/mesec |
| 2 | **Koliko ur mesečno vzame vodenje reklamacijskega postopka — sprejem in evidenca primerov, komunikacija s stranko ter uveljavljanje garancij in RMA pri dobaviteljih?**<br>*Štejte samo garancijske in servisne primere, ne urejanja običajnih vračil in dobropisov.* | h/mesec |
| 3 | **Koliko so v zadnjih 12 mesecih znašali nadomestni deli, zunanji servis in kulanca pri garancijskih popravilih?**<br>*Samo stroški, ki še niso zajeti drugje — dobropisi, vračila kupnine in poškodovano blago sem ne sodijo.* | EUR/leto |
| 4 | **Kako spremljate odprte reklamacijske in servisne primere?** — V sistemu, s statusi in roki / V skupni preglednici / **Po e-pošti in po spominu** / Evidence nimamo | izbira · *samo kontekst* |
| 5 | **Kaj je glavni vzrok?** — Primere vodimo ročno — po e-pošti in v preglednicah (75 %) / Ne vidimo zgodovine izdelka in prejšnjih posegov (75 %) / Postopek reševanja ni enoten (65 %) / Napake izvirajo pri dobaviteljih ali proizvajalcih (25 %) / Okvare zaradi obrabe in narave izdelka (15 %) / **Ne vemo (30 %)** | izbira |

```
kapaciteta  Garancijska popravila in servisni posegi   = V1 × PROIZVODNA ura × 12  ← edina horizontala z operativno uro
kapaciteta  Vodenje reklamacijskega postopka           = V2 × admin ura × 12
izguba      Nadomestni deli, zunanji servis in kulanca = V3
```

---

### D · Kratka diagnostika — **vedno prikazana, ni v triaži**

*Štiri vprašanja o podatkih in odpornosti procesa. Ne prispevajo k finančnemu rezultatu.*

Vsa štiri z isto lestvico: **Da, zanesljivo · Večinoma · Le približno · Ne**

| # | Vprašanje | Privzeto |
|---|---|---|
| 1 | **Ali sproti evidentirate dejansko porabo materiala in opravljeno delo?** | Večinoma |
| 2 | **Ali poznate dejanski strošek posameznega izdelka oziroma delovnega naloga?** | Večinoma |
| 3 | **Ali lahko zanesljivo sledite materialu od dobave do končnega izdelka?** | Le približno |
| 4 | **Ali proizvodnja deluje normalno tudi brez ključne osebe?** | Večinoma |

```
tveganje  Zanesljivost podatkov  ← (V1 + V2) / 6
tveganje  Procesna odpornost     ← (V3 + V4) / 6
```
Brez evrov namenoma: kjer podjetje nima kalkulacije ali sledljivosti, natančnega zneska ni mogoče izračunati.

---

### E · Tvegani stroški — **samo obstoječi uporabniki PANTHEON-a**

*Roki, ki vas dohitijo, tudi če danes vse deluje.* — tri kljukice:

| Kljukica | Opozorilo |
|---|---|
| **Uporabljamo SQL Server 2016** | Podpora je potekla 14. 7. 2026 — rok je že mimo. |
| **Uporabljamo Windows Server 2016** | Podpora se konča 12. 1. 2027. |
| **Nimamo urejenega kanala za e-račune** | Od 1. 1. 2028 velja ZIERDED: brez urejenega e-računa vam kupec preprosto ne bo mogel plačati — globa do 3.000 EUR je ob tem obrobna. |

⚠ Ta modul se **ne prikaže** obiskovalcem brez PANTHEON-a, njegovi roki pa vseeno določajo **10 % ICP ocene** (dimenzija »nujnost«).

---

## KORAK 7 — Rezultat

Brez vprašanj. Sestava zaslona:

1. **Naslovni znesek** = samo `directLoss` (⚠ kdor izbere Plan + Delovne naloge, vidi **0 EUR**); ob nizki zanesljivosti pred vsakim zneskom **»najmanj«**
2. **Ocenjen naslovljiv potencial** = Σ (znesek × naslovljivi delež) — en sam koeficient
3. Razčlenitev po področjih (neposredne izgube + enkratni kapital)
4. Kje se izgublja kapaciteta (ure + EUR)
5. Podatki in procesna tveganja
6. **Česa nismo izmerili** — poimensko našteta področja, ki so bila ocenjena ≥ 1, a ne izbrana

---

## E-mail gate

> **Razširjen rezultat**
> Vnesite e-naslov za PDF poročilo (primerno za posredovanje upravi) in akcijski načrt »3 ukrepi ta teden«. Osnovni izračun ostane na voljo brez tega koraka.

Ime\* · Priimek\* · Ime podjetja\* · E-naslov\* · Telefonska številka · Davčna številka (npr. SI12345679)

**Privolitve:** obdelava podatkov\* · obveščanje o ponudbah PANTHEON · PANTHEON baza znanja

---

# Kaj to pomeni v številkah

| | Vprašanj |
|---|---|
| Koraki 1–5 (fiksno) | 17 |
| Tipična pot: 3 področja + diagnostika | +19 |
| **Tipično skupaj** | **36** *(+3, če je PANTHEON stranka)* |
| Vseh 10 področij + diagnostika + E | **76** |
| E-mail gate | +9 |

**Denarni kanali danes:**

| Kanal | Kje nastane |
|---|---|
| Neposredna izguba | izmet · reklamacije · odpisi zalog · ekspres · penali · izgubljena marža · obresti in globe · napačne plače · zamujeni skonti · nadomestni deli |
| Kapaciteta | 15 različnih vrst ur, vse × polni strošek ure × 12 |
| Enkratni kapital | samo zaloga × delež znižanja |
| Tveganje | 2 diagnostični oceni + do 3 roki iz modula E |

**Kar iz raziskave manjka v celoti:** lastna cena in pokalkulacija · menjave in nastavitve · neplanirani zastoji in vzdrževanje · kooperanti · sledljivost in recall drill · nabava in dobavitelji · odprema in OTIF · presežna poraba nad normativom.

---

## Opomba k načrtu optimizacije

`annualRevenue` in `contributionMargin` **že obstajata** — v `SegmentContext`, `BusinessProfile` in `StepCostBasis` (`ScaleField`). Uporablja ju maloprodaja, proizvodnja pa ju preprosto nima nastavljenih. Ti dve od šestih polj načrtovanega koraka z imenovalci sta torej vprašanje konfiguracije, ne nove kode.
