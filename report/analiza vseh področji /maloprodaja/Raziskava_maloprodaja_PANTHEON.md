# Maloprodaja: celovita raziskovalna baza za PANTHEON, ROI-kalkulator in prodajni sistem

**Datum:** 7. avgust 2026  
**Namen:** referenčni dokument za gradnjo maloprodajnega ROI-kalkulatorja, diagnostičnega vprašalnika, personaliziranih poročil, prodajnih pogovorov in implementacijskega načrta PANTHEON-a.  
**Trg:** Slovenija kot primarni trg; mednarodni benchmarki so izrecno označeni in niso privzete vrednosti za slovenska podjetja.

> **Kako brati dokument.** `[Uradni vir]` pomeni zakonodajo, statistiko ali ponudnikovo uradno dokumentacijo. `[Benchmark]` je zunanji vzorec, uporaben za preverjanje reda velikosti, nikoli kot samodejna ocena podjetja. `[Sinteza]` je analitični sklep iz več virov in procesne logike. `[Hipoteza]` je prodajna oziroma raziskovalna domneva, ki jo je treba potrditi s podatki posamezne stranke.

---

## 1. Izvršni povzetek

Maloprodaja ni ena niša, temveč skupek različnih operativnih modelov. Samostojna specializirana trgovina, trgovska veriga, spletni trgovec, uvoznik z lastno blagovno znamko in živilski trgovec lahko vsi ustvarjajo račun na blagajni, vendar imajo povsem drugačno ekonomiko, tveganja in potrebne podatke. Zato enoten seznam »vseh funkcionalnosti ERP-ja« ni dober prodajni niti raziskovalni okvir.

**Glavna ugotovitev.** Največja poslovna vrednost PANTHEON-a v maloprodaji nastaja, kadar poveže enoten zapis artikla, cene, zaloge, transakcije in dokumenta čez poslovalnice ter med prodajo, skladiščem, nabavo in računovodstvom. Uradna stran PANTHEON Retail navaja povezavo prodaje, zaloge in računovodstva, delo z več lokacijami in blagajnami, samodejno usklajevanje zalog, cenike/promocije, uporabniške sledi ter poročanje po artiklu, poslovalnici in blagajniku. [Uradni vir: Datalab, [PANTHEON Retail](https://www.datalab.eu/pantheon/retail-advanced-pos/)]

To ni avtomatično dokaz finančnega prihranka. Prihranek nastane šele, ko se za konkreten problem izmeri:

- obseg transakcij, artiklov, zaloge ali dela;
- stopnja napake oziroma izgube;
- ekonomska posledica napake;
- glavni vzrok in delež, ki ga je mogoče nasloviti s sistemom;
- strošek spremembe procesa, licenc, integracij, podatkov in uvedbe.

### 1.1 Kaj je najpomembnejše za projekt

1. **Prvi razcep vprašalnika mora biti poslovni model in lastnost blaga, ne velikost podjetja.** Roki uporabe, loti, serijske številke, sezonskost, obseg lokacij, spletni kanal in lastništvo zaloge odločajo, kateri problemi so sploh relevantni.
2. **ROI-kalkulator naj meri štiri ločene rezultate:** neposredni letni strošek, sproščeno kapaciteto, enkrat sprostljiv obratni kapital ter maržo oziroma preprečeno izgubo. Teh kategorij se ne sešteva brez oznake in časovne razsežnosti.
3. **PANTHEON naj se ne prikazuje kot samostojna rešitev za vsak problem.** Spletna trgovina, kurirske storitve, napredni WMS, napovedovanje povpraševanja, preprečevanje kraje in CRM lahko zahtevajo partnerja, integracijo ali organizacijski ukrep.
4. **Poudarek v prodaji naj bo na preverljivem trenutnem stanju.** »Koliko vas stane sedanji način dela?« je boljši začetek kot »Ali bi radi digitalizirali?«, vendar zahteva dokazljive vhodne podatke in zaščito pred dvojnim štetjem.
5. **Regulatorni pritiski so konkretni prodajni sprožilci.** Pri znižanjih je relevantna najnižja cena zadnjih 30 dni; spletna prodaja prinaša pravila o informacijah, dobavi in 14-dnevnem odstopu; za domače B2B poslovanje bo od 1. januarja 2028 obvezna izmenjava e-računov. [Uradni viri: [SPOT – cene](https://spot.gov.si/sl/dejavnosti-in-poklici/dejavnosti/trgovina-na-drobno-v-nespecializiranih-prodajalnah-pretezno-z-zivili), [SPOT – spletna prodaja](https://spot.gov.si/sl/teme/spletna-prodaja), [GOV.SI – e-računi](https://www.gov.si/novice/2025-10-23-drzavni-zbor-sprejel-zakon-o-izmenjavi-elektronskih-racunov-in-drugih-elektronskih-dokumentov/)]

---

## 2. Namen, meja in metodologija raziskave

Ta dokument ni katalog funkcionalnosti in ni implementacijska specifikacija. Njegov cilj je ustvariti **odločevalsko uporabno bazo znanja**, iz katere se lahko zgradi:

- kratek javni lead magnet z diagnozo dveh glavnih težav;
- daljši prodajni audit z dokazi in izvozom podatkov;
- kalkulator stroška sedanjega stanja, TCO in ROI;
- priporočilo PANTHEON konfiguracije, partnerjev in faz uvedbe;
- sales playbook po segmentih ter sistem za kvalifikacijo leadov.

### 2.1 Standard dokazovanja

| Vrsta trditve | Dovoljena uporaba v rezultatu | Kaj ni dovoljeno |
|---|---|---|
| Uradni vir | regulatorna zahteva, produktna zmožnost, uradna statistika | iz tega sklepati na prihranek brez podatkov stranke |
| Benchmark | sanity check in vprašanje za nadaljnje preverjanje | uporabiti kot privzeto izgubo slovenskega trgovca |
| Interni podatek podjetja | finančni izračun in ROI | slepo sprejeti, če se podvaja z drugim vhodom |
| Strokovna ocena | nizki/srednji/visoki scenarij | predstaviti kot dejstvo ali garancijo |
| Hipoteza | personalizacija pogovora in prioriteta raziskave | prikazati kot dokazano bolečino |

### 2.2 Natančna definicija maloprodaje v tem projektu

V obsegu so B2C in mešani B2C/B2B trgovci, ki prodajajo fizično blago prek poslovalnice, spletne trgovine, mobilnega prodajnega mesta ali kombinacije kanalov. Vključeni so uvozniki in imetniki lastne blagovne znamke, če sami upravljajo zalogo, cenike ali končno prodajo.

Izven osnovnega obsega so bencinski servisi, lekarne, igralništvo, čisti marketplace modeli brez lastne zaloge ter gostinstvo. Zanje se lahko uporabi del istega jedra, vendar imajo dodatne regulatorne, plačilne oziroma recepturne procese. Avtodeli, DIY, pohištvo, elektronika, kozmetika, moda in živila so v obsegu, a s pogojnimi vejami vprašalnika.

---

## 3. Slovenski trg in poslovni kontekst

Po končnih podatkih SURS je prodaja blaga v slovenski maloprodaji v letu 2025 znašala **18,25 mrd EUR**, kar je bilo 11,9 % več kot leta 2024. Največja blagovna skupina znotraj neprehranskih izdelkov so bili medicinski, farmacevtski in kozmetični izdelki (1,68 mrd EUR); živila in pijače so dosegli 5,00 mrd EUR. SURS hkrati opozarja, da so podatki objavljeni po novi SKD 2025, zato se serije in segmenti ne primerjajo nepremišljeno s starejšimi klasifikacijami. [Uradni vir: [SURS – trgovina 2025](https://www.stat.si/StatWeb/en/News/Index/14479)]

| Skupina v maloprodaji | Prihodki 2025 | Kaj to pomeni za research |
|---|---:|---|
| Skupaj | 18,25 mrd EUR | velik trg, vendar zelo heterogen |
| Živila in pijače | 5,00 mrd EUR | roki, pogost promet, številne cene in dobave |
| Motorna vozila in deli | 2,73 mrd EUR | veliko naročil, identifikacija in servisna sled |
| Energenti in goriva | 2,53 mrd EUR | ločena vertikala in regulatorika; ni jedrni ICP |
| Medicina, farmacija, kozmetika | 1,68 mrd EUR | sledljivost, loti, varnost, velik SKU nabor |
| Oblačila in obutev | 1,00 mrd EUR | atributi, sezonskost, markdowni in vračila |
| Električne naprave | 0,78 mrd EUR | serijske številke, garancije in RMA |

### 3.1 Kanali in digitalno okolje

Splet ni ločena »digitalna verzija« prodaje, temveč dodatna logistična, cenovna in servisna obljuba. Eurostat poroča, da je v EU leta 2025 78 % internetnih uporabnikov kupilo blago ali storitev na spletu; zato pri vsaki relevantni trgovini predpostavimo, da potrošnik primerja ponudbo čez kanale, tudi če trgovec ne prodaja neposredno prek lastne spletne trgovine. [Uradni vir: [Eurostat – e-commerce posameznikov](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=E-commerce_statistics_for_individuals)]

**Sinteza:** pri slovenskem MSP ni ključna dilema »fizično ali spletno«, temveč ali obstaja en resničen zapis za artikel, zalogo, ceno, naročilo in vračilo. Brez tega omnichannel pomeni ročna usklajevanja, odpovedi naročil, napačne obljube dobave in slabo izkušnjo za zaposlenega ter kupca.

### 3.2 Makro signal ni poslovni primer

Rast prometa ne dokazuje, da je posamezen trgovec produktivnejši ali bolj donosen. Na promet vplivajo cene, gorivo, sestava izdelkov, odpiranje novih poslovalnic, turizem in povpraševanje. SURS mesečno ločeno spremlja vrednostni in količinski promet; npr. v prvi polovici 2026 je skupni obseg maloprodajnega prometa medletno zrasel za 1,9 %, pri živilih pa se je zmanjšal za 0,9 %. [Uradni vir: [SURS – junij 2026](https://www.stat.si/StatWeb/en/News/Index/14496)]

V kalkulatorju zato makro podatkov ne uporabljamo kot množitelja prihranka. Uporabni so samo za:

- kontekst v prodajnem poročilu;
- razlago, zakaj so marža, zaloga in produktivnost pomembnejše od gole rasti prihodkov;
- segmentacijo in prioritetno izbiro ciljnih podniš.

---

## 4. Segmentacija: osem arhetipov, ne en »retail« ICP

### 4.1 Primarni arhetipi

| Arhetip | Prepoznavni znaki | Najdražje napake | Primarni procesni fokus |
|---|---|---|---|
| 1. Ena specializirana trgovina | 1 lokacija, omejena ekipa, lastnik vodi operacije | ročno delo, slaba vidnost zaloge, zaključki | POS, zaloga, nabava, osnovno poročanje |
| 2. Manjša mreža | 2–10 lokacij, centralna nabava ali skladišče | prenosi, cene, različne zaloge po lokacijah | enotna baza, ceniki, transferji, inventure |
| 3. Večlokacijska veriga | veliko blagajn/SKU, centralne funkcije | podatkovna disciplina, rollout, lokalne izjeme | master data, pravice, integracije, BI |
| 4. Omnichannel trgovec | fizična prodaja + splet + prevzem/vračilo med kanali | oversell, neusklajene cene, fulfilment, vračila | sinhronizacija, red naročila, integracija spletne trgovine |
| 5. Uvoznik/zasebna znamka | nabava v tujini, carine, lastna cena in zaloga | dobavni roki, dokumenti, valutni stroški, forecast | nabava, artikli, serije/loti, finance |
| 6. Hitroobrnljivo ali pokvarljivo blago | roki, loti, veliko dobav in odpisa | potek roka, odpoklic, FEFO, odpis | sledljivost, skeniranje, cene za odprodajo |
| 7. Reg. ali visoko vredno blago | serijske številke, garancija, dokazila | reklamacije, kraja, izterjava do dobavitelja | serializacija, servis, dokumenti, uporabniške sledi |
| 8. Franšiza, komisija ali hibrid B2B/B2C | zaloga ni vedno last podjetja; posebni obračuni | mešanje lastništva, rabati, poročanje | ločeno lastništvo, obračuni, ceniki in dokumenti |

### 4.2 Sekundarne klasifikacije, ki sprožijo pogojna vprašanja

Vsak arhetip dodatno označimo s šestimi lastnostmi:

- **pokvarljivost/rok uporabe**;
- **sezonskost**;
- **lot oziroma serijska številka**;
- **visoka individualna vrednost**;
- **spremenljiva mera ali tehtanje**;
- **prodaja prek več kanalov ali držav**.

Ta metoda je pomembnejša od splošne oznake »trgovina«. Trgovina z elektroniko in trgovina z živili imata lahko enak promet, vendar prva potrebuje dokazljivost serijske številke in garancije, druga pa pravočasno rotacijo lotov, odpise in higienično sledljivost.

### 4.3 Priporočena prioritetna segmenta za lead magnet

**Prva prioriteta: manjše in srednje specializirane mreže ter omnichannel trgovci.** Ti običajno že čutijo strošek ločenih orodij, imajo dovolj transakcij za merljiv učinek in niso tako kompleksni, da bi v prvi fazi zahtevali poln enterprise WMS/OMS program.

**Druga prioriteta: uvoznik z lastno blagovno znamko ali B2B/B2C hibrid.** Tu se hitreje pokaže vrednost enotnega podatkovnega modela med nabavo, zalogo, cenami, računi, maržo in kanali.

**Pazljivo:** živila in izrazito regulirane vertikale imajo lahko velik potencial, vendar zahtevajo posebno preverjanje sledenja lotom, rokov, tehtnic, lokalnih procesov in integracij. Ne obljubljamo zmožnosti, ki niso potrjene na konkretnem obsegu.

---

## 5. Ekonomika maloprodaje: kaj v resnici ustvarja ali uničuje vrednost

### 5.1 Osnovna enačba

Za prodajno odločitev je pomembnejša prispevna marža kot promet. Poenostavljeno:

**bruto marža = neto prodaja - nabavna vrednost prodanega blaga**

**prispevna marža = neto prodaja - nabavna vrednost - neposredno spremenljivi stroški kanala**

Med neposredno spremenljive stroške kanala lahko sodijo provizija tržnice, kartična pristojbina, paketiranje, subvencionirana dostava, obdelava vračila in dodatni picking. V vsakem podjetju se definicija razlikuje, zato mora kalkulator zahtevati definicijo uporabljenega maržnega podatka.

### 5.2 Štiri ekonomske košarice

| Košarica | Primer | Časovni učinek | Kako se prikaže |
|---|---|---|---|
| Neposredna letna izguba | odpis, neizterjan rabat, napačno zaračunana cena | ponavljajoč | EUR/leto |
| Izgubljena ali napačna marža | stockout, popust, napaka pri ceni | ponavljajoč | prispevna marža/leto |
| Sproščena kapaciteta | ročni zaključki, iskanje artikla, ročni vnos naročila | potencialno ponavljajoč | ure + vrednost kapacitete |
| Obratni kapital | zmanjšljiva presežna zaloga | enkraten denarni učinek; financiranje je letno | EUR kapitala in EUR/leto |

**Pravilo:** denarna korist ni enaka vsoti vseh ur krat strošek ure. Sproščena ura postane denarni prihranek samo, če zmanjša nadure, zunanje delo, dodatno zaposlitev ali omogoči dokazljivo več prodaje brez dodatne ekipe.

### 5.3 Ključni odnosi med zalogo, maržo in denarjem

- Visoka zaloga lahko izboljša razpoložljivost, a poveča kapital, tveganje zastaranja, odpisov in prisilnih popustov.
- Nizka zaloga lahko izboljša denarni tok, a poveča stockoute, ekspresne nabave in izgubljeno maržo.
- Visok promet ni nujno dober, če je dosežen s popusti, ki uničujejo maržo.
- Inventurni manko, odpisi, spletna vračila in prenizka prodajna cena imajo drugačen ekonomski imenovalec; njihovo seštevanje brez modela vodi v napačen ROI.

### 5.4 Delovni kapital: pravilna formula

**sprostljiv kapital = povprečna zaloga po nabavni vrednosti x realno zmanjšljivi delež**

**letni strošek kapitala = sprostljiv kapital x uteženi strošek financiranja oziroma interni prag**

Sprostljivih 40.000 EUR zaloge ni letni prihranek v višini 40.000 EUR. To je enkratni denarni učinek; letna korist je na primer prihranek financiranja, skladiščenja, odpisa in markdownov, če so izmerjeni ločeno.

---

## 6. Personae, odločevalci in njihovi »jobs to be done«

| Oseba | Kaj želi doseči | Kaj jo frustrira | Dokaz, ki ga potrebuje |
|---|---|---|---|
| Lastnik/CEO | rast brez kaosa in presenečenj | »imamo promet, pa ne vem, kje je dobiček« | ROI, payback, tveganje uvedbe, odgovorna oseba |
| Direktor maloprodaje | pravilna izvedba v vseh poslovalnicah | lokalne izjeme, različne cene, počasna poročila | podatki po lokaciji in artikel, jasen rollout |
| Vodja nabave | prava količina ob pravem času | ročni predlogi, nejasna dobava, slab rabat | status naročil, dobavni rok, cena in prodaja |
| Vodja skladišča | točna in dostopna zaloga | iskanje, neznani prenosi, inventure | skeniranje, odgovornost, razlike po vzroku |
| Vodja spletne prodaje | obljubljena zaloga in hitra obdelava | oversell, ročen prenos, vračila brez sledi | integracijski diagram, SLA, status naročila |
| Finance/računovodstvo | pravilni dokumenti in zaprt mesec | ročno prepisovanje, neusklajenost POS/knjig | povezava dokumenta, davkov, plačil in kontiranja |
| IT ali zunanji partner | stabilen in podprt ekosistem | nejasen API, nestandardne prilagoditve | scope, lastnik integracije, testni plan, SLA |
| Vodja poslovalnice/blagajnik | hitra prodaja brez izpadov | počasne blagajne, napačne cene, nezaupanje | enostaven ekran, pravice, offline scenarij, podpora |

**Prodajna posledica.** Prvi pogovor se ne sme končati pri CEO-jevem občutku. Za verodostojen business case je treba vsaj z enim procesnim lastnikom preveriti dejanski tok podatkov in vsaj s financami dogovoriti definicije marže, stroška dela in obratnega kapitala.

---

## 7. Vrednostna veriga in podatkovni tok

### 7.1 Jedrni tok

**asortiment in master data → dobavitelj/nabava → naročilo → prevzem → zaloga po lokaciji → alokacija/dopolnjevanje → cenik in promocija → POS ali spletno naročilo → izpolnitev → vračilo/reklamacija → dokument, plačilo in knjigovodstvo → analiza in naslednja odločitev**

Če se katera koli puščica izvaja z ročnim prepisom, e-pošto, XLS datoteko ali paketnim uvozom brez kontrole, nastaja vsaj eno od štirih tveganj: zamuda, napaka, nejasno lastništvo ali nezmožnost analize vzroka.

### 7.2 Minimalni skupni podatkovni model

| Objekt | Neodtujljivi podatki | Tipični lastnik | Če manjka |
|---|---|---|---|
| Artikel/SKU | šifra, EAN/GTIN, enota, davčna stopnja, kategorija | master data/nabava | napačna cena, zaloga ali poročilo |
| Varianta | barva, velikost, model, serija, rok, teža | kategorija/skladišče | napačen picking ali nerealna razpoložljivost |
| Cenik | kanal, lokacija, veljavnost, promocijsko pravilo | trgovina/marketing | napačna cena na polici ali POS |
| Zaloga | količina, lokacija, status, lastništvo, rezervacija | skladišče/retail | oversell, manko, prenos brez sledi |
| Naročilo | vir, kupec, postavke, obljuba, status, plačilo | prodaja/splet | ročna obdelava in odpoved |
| Prevzem | dobavitelj, dokument, dejanska količina/cena | nabava/skladišče | razlika naročilo–dobavnica–račun |
| Vračilo/reklamacija | razlog, stanje artikla, serija, strošek, odločitev | servis/splet/POS | vračilo postane neviden strošek |

### 7.3 Glavno diagnostično vprašanje

> Ali lahko za izbrani artikel v manj kot petih minutah pokažete njegovo trenutno zalogo po lokacijah, zadnjo nabavno ceno, veljavno ceno po kanalu, zadnjo prodajo, odprta naročila, serijo/rok, če obstaja, in razlog zadnjega popravka zaloge?

Odgovor ni samo test programske opreme. Testira master data, discipline procesov, integracije in odgovornost.

---

## 8. Operativni procesi: podroben zemljevid bolečin, podatkov in vzvodov

### 8.1 Asortiment, šifranti in podatki artiklov

**Proces.** Ustvarjanje artikla, variante, EAN/GTIN, enote mere, davka, kategorije, dobavitelja, nabavne cene, prodajnega cenika, slike/opisa in sledljivostnih atributov.

**Tipične bolečine.** Podvojeni artikli, različne enote mere, ročno ustvarjanje cenika, manjkajoče variante, nejasni nadomestni artikli in neoznačeno lastništvo komisijske zaloge. Napake se nato razmnožijo v POS, spletu, poročilih in računovodstvu.

**Meriti.** Število novih/spreminjanih SKU na mesec; čas do aktivacije; število popravkov po objavi; delež artiklov brez EAN, dobavitelja, kategorije ali pravilne enote; število podvojenih artiklov; število ročnih sprememb cen.

**PANTHEON/ekosistem.** Uradno so v maloprodaji podprti pregled artiklov, iskanje po imenu/kodi/skupini ter upravljanje cenikov in ponudb. To je dobro jedro, vendar governance šifrantov, e-commerce vsebina in PIM niso samodejno rešeni samo z ERP-jem. [Uradni vir: [PANTHEON Retail](https://www.datalab.eu/pantheon/retail-advanced-pos/)]

### 8.2 Nabava, dobavitelji in pogoji

**Proces.** Plan potreb, predlog naročila, odobritev, oddaja, potrditev dobave, prevzem, uskladitev računa, rabati/boni in dobaviteljske reklamacije.

**Vzroki izgub.** Naročanje po občutku, nepoznan rok dobave, nabavna cena brez kontrole, izgubljeni rabati, presežna minimalna zaloga, ekspresne dobave in razlike med naročilom, dobavnico ter računom.

**Meriti.** Naročila mesečno, ure na naročilo, delež ročnih naročil, OTIF dobavitelja (pravočasno in popolno), razlike po prevzemu, ekspresne dobave, neizterjani rabati, vrednost reklamacij in čas reševanja.

**Varnost pred dvojnim štetjem.** Slab dobavitelj je vzrok. Izgubljena prodaja zaradi prazne police se šteje v modulu razpoložljivosti; ne ponovno v nabavi. V nabavi ostanejo strošek procesa, razlike, rabati in ekspresne dobave.

**PANTHEON/ekosistem.** Datalab navaja spremljanje nabavnih stroškov, dobaviteljev, približnih dobavnih rokov, statusov zaloge in naročil; pri spletnih trgovcih izrecno navaja povezavo s partnerskimi B2B/B2C rešitvami. [Uradni vir: [Sales and Purchase Orders](https://www.datalab.eu/functionalities/sales-and-purchase-orders/)]

### 8.3 Prevzem, skladišče, prenosi in sledljivost

**Proces.** Fizični prevzem, kontrola količine/kakovosti, označevanje, usklajevanje dokumenta, skladiščenje, prenos v poslovalnico, rezervacija in odpis.

**Meriti.** Dobave mesečno, postavke na dobavo, minute na postavko, delež črtno kodiranega prevzema, razlike dobava–dokument, prenosi med lokacijami, ročni popravki, čas iskanja artikla/serije/lota in izgubljeno blago pri prenosu.

**Posebna veja za sledljivost.** Pri lotih, rokih in serijskih številkah se ne sprašuje le »ali jih vodite«. Vprašanje je: ali se atribut ob prevzemu zanesljivo prenese do prodaje, vračila, odpisa in po potrebi odpoklica?

GS1 opisuje, da lahko 2D koda pri POS prepreči prodajo artikla po izteku roka, omogoči samodejni markdown pred potekom in ciljno iskanje lota/serije ob odpoklicu. To je standardizacijski cilj in procesna priložnost, ne dokaz, da ga katera koli obstoječa PANTHEON konfiguracija že zagotavlja brez preveritve. [Uradni standard: [GS1 2D at Retail POS](https://ref.gs1.org/guidelines/2d-in-retail/)]

**PANTHEON/ekosistem.** PANTHEON Retail uradno navaja skenerje za označevanje in inventuro. Warehouse Inventory Granule omogoča skeniranje s telefonom, pogled na knjigovodsko stanje in neposreden prikaz inventurnega dokumenta skupaj z viški/manjki v računovodstvu. [Uradna vira: [Retail](https://www.datalab.eu/pantheon/retail-advanced-pos/), [Warehouse Inventory Granule](https://www.datalab.eu/pantheon-granule/warehouse-inventory-granule/)]

### 8.4 Razpoložljivost artiklov in dopolnjevanje

**Ne mešaj dveh nasprotnih problemov:** prazna polica oziroma nedobavljiv artikel in presežna/stara zaloga sta ekonomično različna pojava.

**Formula izgubljene marže zaradi stockouta:**

**izgubljena marža = izgubljena prodaja x prispevna marža x (1 - delež nadomestnega ali odloženega nakupa)**

**Meriti.** Pogostost stockouta na ključnih SKU, število primerov, ali je artikel v skladišču, substitucijo, poznejši nakup, lead time, stopnjo servisne ravni, ekspresna naročila in ure iskanja artiklov.

**Rdeča zastavica.** Če podjetje ne ve, kolikokrat kupcu reče »nimamo«, naj kalkulator ne izmisli odstotka prihodka. Najprej naj pokaže nizko zanesljivost in predlaga 30-dnevni vzorec top artiklov oziroma označevanje izgubljenega povpraševanja na POS.

### 8.5 Presežna zaloga, staranje, odpisi in markdowni

Razdeliti je treba vsaj šest postavk: potek roka, poškodbe, starajoča se zaloga, sezonski ostanek, prisilni popust in neznani manko. Vsaka zahteva drug procesni odziv.

**Meriti.** Povprečna zaloga po nabavni vrednosti; zaloga brez prodaje 90/180/365 dni; sezonski ostanki; vrednost odpisa; povprečni popust glede na planirano polno maržo; strošek financiranja; lokacija in dobavitelj izvora.

**Formula za markdown.** Ne štejemo celotnega popusta kot izgubo. Merimo razliko med dejansko ustvarjeno in realno dosegljivo prispevno maržo, zmanjšano za učinek, ki bi nastal tudi brez spremembe sistema (npr. objektivno konec sezone).

### 8.6 Cene, akcije in promocije

**Proces.** Cenik po artiklu, skupini, lokaciji in kanalu; začetek/konec akcije; kupon; bundle; popust; etiketa; spletna cena; dokaz prejšnje cene.

**Meriti.** Število sprememb cen mesečno; delež ročnih etiket; transakcije s korekcijo cene; prodaja po prenizki ceni; neuspešno aktivirane akcije; predolgo veljavni popusti; razlike polica–POS–splet; ure dokazovanja prejšnje cene.

Po pravilih ZVPot-1 mora podjetje pri objavi znižanja praviloma navesti najnižjo ceno, uporabljeno v zadnjih 30 dneh; zakon pozna posebnosti za blago na trgu manj kot 30 dni, zaporedna znižanja ter hitro pokvarljivo blago oziroma blago tik pred potekom roka. [Uradni vir: [ZVPot-1 in razlaga SPOT](https://spot.gov.si/sl/dejavnosti-in-poklici/dejavnosti/trgovina-na-drobno-v-specializiranih-prodajalnah-s-sportno-opremo)]

**Prodajno vprašanje:** »Ali lahko za vsak kanal in poslovalnico pokažete, katera je bila najnižja cena artikla v zadnjih 30 dneh, kdo jo je spremenil in kdaj je akcija veljala?«

### 8.7 POS, blagajniški zaključki in plačila

**Proces.** Prijava uporabnika, prodaja, popust/storno, plačilo, vračilo, zaključek izmene, uskladitev gotovine/kartic/bonov, dnevni zaključek in prenos v finance.

**Meriti.** Število blagajn, transakcij, delovnih dni, minut odpiranja/zapiranja, neposredne blagajniške razlike, stornacije, ročni popusti, ure izpada, čas reševanja napačnega računa in postavke ročnega usklajevanja.

FURS navaja, da so pri gotovinskem poslovanju blagajne prek spleta povezane s centralnim informacijskim sistemom finančne uprave, ki podatke o računih potrjuje in hrani v postopku izdaje v realnem času. Davčna blagajna zato ni samo »printer«, ampak del kontroliranega procesa poslovnega prostora, naprave, številčenja in izdajanja dokumentov. [Uradni vir: [FURS – davčne blagajne](https://www.fu.gov.si/nadzor/podrocja/davcne_blagajne_in_vezane_knjige_racunov_vkr/)]

**PANTHEON/ekosistem.** Uradno so navedeni več uporabnikov, različni načini plačila, popusti/obroki, samodejni zaključki, POS terminali, tehtnice, tiskalniki, več blagajn/lokacij in možnost dostopa brez internetne povezave. Offline scenarij je treba preveriti za konkretno arhitekturo, ne le povzeti marketinške trditve. [Uradni vir: [PANTHEON Retail](https://www.datalab.eu/pantheon/retail-advanced-pos/)]

### 8.8 Inventura, manko in točnost zaloge

**Pravilni osnovni vhod:** vrednost manjka po nabavni vrednosti pri zadnji inventuri, skupaj z datumom in vzrokom. Odstotek prometa je le približek z nižjo zanesljivostjo.

**Vzroki in naslovljivost.** Nepravočasen prevzem, napačen prenos, napačna blagajniška operacija ali šifrant so pogosto dobro naslovljivi s procesom in sistemom. Kraja, poškodba in dobaviteljska kakovost niso samodejno »ERP prihranek«; sistem lahko izboljša sled, kontrolo in analitiko, vendar ne odpravi fizičnega vzroka.

| Glavni vzrok | Naslovljivost z ERP/POS | Dodatni ukrep |
|---|---|---|
| prevzem, prenos, odpis evidentiran prepozno | visoka | SOP in skeniranje |
| napaka pri artiklu/enoti mere | srednja do visoka | master-data governance |
| nepravilna POS operacija | srednja do visoka | pravice, usposabljanje, nadzor |
| kraja | nizka do srednja | fizična varnost, analitika, politika |
| poškodba in slaba kakovost dobave | nizka do srednja | dobaviteljski QA in reklamacije |

Benchmark NRF za ameriški trg je za poslovno leto 2022 navedel povprečni shrink 1,6 % prodaje. Uporaben je izključno kot opozorilo, da je potrebno izmeriti lastno stanje; ni primeren za vnos kot slovenski privzeti odstotek. [Benchmark: [NRF National Retail Security Survey 2023](https://nrf.com/research/national-retail-security-survey-2023)]

### 8.9 Spletna prodaja, fulfilment in vračila

**Proces.** Naročilo → preverjanje plačila/zaloge → rezervacija → picking → packing → dobava → obveščanje → vračilo/dobropis → pregled stanja → ponovna prodaja/odpis → uskladitev stroškov in provizij.

**Največja napaka modela:** vračilo kupnine ni samodejno celoten strošek vračila, ker je artikel lahko ponovno prodan. Pravilnejša formula je:

**strošek vračil = št. vračil x (delo + povratna logistika + nevrnjene pristojbine + povprečen odpis/markdown) + chargebacki in prevare**

**Meriti.** Naročila, odpovedi zaradi zaloge, hitrost obdelave, minute ročnega prenosa, napake pickinga, stopnja vračil po razlogu, strošek povratne dostave, ponovno prodajni delež, chargebacki, kazni tržnic in delo na katalogu/cenah.

SPOT navaja, da ima potrošnik pri pogodbi na daljavo praviloma pravico do odstopa v 14 dneh od dobave, podjetje pa mora vrniti plačilo najkasneje v 14 dneh od obvestila o odstopu; veljajo določene izjeme, denimo za hitro pokvarljivo ali po meri izdelano blago. [Uradni vir: [SPOT – spletna prodaja](https://spot.gov.si/sl/teme/spletna-prodaja)]

NRF ocenjuje, da bo v ZDA leta 2025 vrnjenih 19,3 % spletne prodaje. Razlika med panogami, državami in politikami vračil je velika, zato je to samo visok nivo benchmarka za vprašanje, ne formula za Slovenijo. [Benchmark: [NRF Returns Landscape 2025](https://nrf.com/media-center/press-releases/consumers-expected-to-return-nearly-850-billion-in-merchandise-in-2025)]

**PANTHEON/ekosistem.** Datalab pri ePoslovanju navaja eSlog za naročila, ponudbe, račune, dobropise/bremepise in vračilnice, povezovanje s portali in e-trgovinami ter izmenjavo z drugimi ERP-ji prek VOD. Izrecno navaja tudi partnerje za spletne tehnologije; zato v ROI-ju spletne integracije ne smemo vključiti v osnovno licenco brez konkretne ponudbe. [Uradni vir: [PANTHEON eBusiness](https://www.datalab.eu/functionalities/ebusiness/)]

### 8.10 Kadri, izmene in evidence

Meriti je treba pripravo razporedov, zbiranje in popravljanje evidenc, odobritve odsotnosti, pripravo dodatkov, nujne menjave izmen, nadure in stroške zunanjega/študentskega dela zaradi slabe napovedi. Izgubljene prodaje zaradi premalo ljudi so običajno nizko zanesljive, ker nanje vplivajo obisk, prodajna sposobnost, zaloga in razporeditev prostora.

### 8.11 Dokumenti, finance in računovodstvo

Procesne meje morajo biti jasne: primerjava naročila, dobavnice in računa spada v nabavo/prevzem; knjiženje, DDV in usklajevanje v finance; potrjevanje, arhiviranje in iskanje v dokumentacijo.

Od 1. januarja 2028 bo za storitve, opravljene v Sloveniji, obvezna izmenjava e-računov med poslovnimi subjekti, vpisanimi v PRS, ter fizičnimi osebami z dejavnostjo. To ne pomeni ukinitve papirnih računov za potrošnike ali tuja podjetja. [Uradni vir: [GOV.SI – zakon o e-računih](https://www.gov.si/novice/2025-10-23-drzavni-zbor-sprejel-zakon-o-izmenjavi-elektronskih-racunov-in-drugih-elektronskih-dokumentov/)]

**Meriti.** Delež strukturiranih e-dokumentov, PDF/papirnih dokumentov, ročnih vnosov, iskanj dokumentov, napak kontiranja, zamujenih skontov, podvojenih plačil ter čas mesečnega zaključka.

### 8.12 Analitika in upravljanje

Analitika ni samo izdelava dashboarda. Namen je skrajšati čas med odstopanjem in pravilnim ukrepom. Meritve naj zajamejo število preglednic, čas usklajevanja številk, delež poročil z enotno definicijo marže/zaloge, čas do odkritja odstopanja ter število ročnih ad hoc poročil.

Ne smemo ponovno monetizirati časa, že zajetega v nabavi, POS, zalogi ali financah.

---

## 9. KPI slovar: kaj se meri in čemu služi

| KPI | Formula/definicija | Odločitev, ki jo podpira | Tipičen vir |
|---|---|---|---|
| Prispevna marža | neto prodaja - COGS - neposredni stroški kanala | cena, promocija, kanal | ERP + plačilni/spletni podatki |
| GMROI | bruto marža / povprečna zaloga po nabavni vrednosti | donos zaloge | ERP |
| Obrat zaloge | COGS / povprečna zaloga | kapital in staranje | ERP/računovodstvo |
| Dnevi zaloge | povp. zaloga / COGS x 365 | replenishment | ERP |
| Sell-through | prodane enote / razpoložljive enote v obdobju | asortiment/markdown | ERP/POS |
| Stockout rate | nedobavljivi ključni primeri / zahtevani primeri | razpoložljivost | POS/splet/vzorec |
| OSA | artikli dejansko na polici / planirani artikli | trgovinska izvedba | store audit |
| OTIF dobavitelja | pravočasne in popolne dobave / vse dobave | nabava | naročila/prevzemi |
| Točnost zaloge | 1 - absolutna razlika knjiga/fizično / fizično stanje | zaupanje v zalogo | inventura |
| Shrink | manko po nabavni vrednosti / ustrezna osnova | kontrola izgube | inventura/finance |
| Markdown rate | znižana prodaja / prodaja ali maržni vpliv | sezona in cena | POS/ceniki |
| Return rate | vrnjena naročila/enote / prodana naročila/enote | spletna ekonomika | OMS/e-commerce/POS |
| Pick accuracy | pravilno izpolnjene postavke / vse postavke | fulfilment | WMS/OMS/vračila |
| Closing time | minute zaključka x blagajne x dnevi | produktivnost POS | POS/observacija |

**KPI disciplina.** V poročilu vedno navedemo imenovalec, časovno obdobje, kanal in vir. »Manko 10.000 EUR« brez obdobja, nabavne/prodajne vrednosti in vzroka ni dovolj za odločitev.

---

## 10. Digitalna zrelost: model za segmentacijo, ne ocena osebne vrednosti

| Stopnja | Opis stanja | Prepoznaven signal | Priporočena prva poteza |
|---|---|---|---|
| 0 – fragmentirano | Excel, ločena blagajna, ročno stanje zaloge | različne številke pri istih ljudeh | popis tokov in minimalna enotna baza |
| 1 – transakcijsko | POS/ERP obstaja, vendar ročni prenosi in popravki | zalogi ne zaupajo | najprej temeljni tok artikel–prevzem–prodaja |
| 2 – povezano | večina dokumentov teče, standardni reporti | težave pri izjemah in več kanalih | pravice, kontrolne točke, integracije |
| 3 – upravljano | KPI, odgovorni lastniki, ciklične inventure | lahko pokažejo vzrok odstopanja | optimizacija asortimenta in replenishmenta |
| 4 – optimizirano | napredne napovedi, avtomatizacija, eksperimentiranje | odločanje je hitro in dokazljivo | specializirane nadgradnje, ne samo ERP |

**Prodajna raba.** Stopnja 0–1 ni vedno idealen kandidat za kompleksno omnichannel rešitev; najprej potrebuje minimalni kontroliran proces. Stopnja 2–3 pa je pogosto dober kandidat za PANTHEON konfiguracijo, integracijo in jasen ROI.

---

## 11. Tehnologija in PANTHEON: natančen zemljevid naslovljivosti

### 11.1 Kaj je javno potrjeno

PANTHEON Retail (RE) je po uradni strani namenjen POS, nabavnim/prodajnim naročilom, e-poslovanju, izdaji/prejemu računov, inventuri in skladišču. RT je dodatna POS licenca, ki se uporablja v kombinaciji z RE/SE/ME/MF, kadar se POS terminale povezuje z večjim informacijskim sistemom. [Uradni vir: [PANTHEON Retail](https://www.datalab.eu/pantheon/retail-advanced-pos/)]

| Poslovna potreba | Jedro PANTHEON-a | Potrebno preverjanje / možen partner |
|---|---|---|
| POS, računi, zaključki, plačila | visoka pokritost | model naprav, FURS, offline, terminali |
| Zaloga po lokacijah in prenosi | visoka pokritost | fizični tok, barkode, odgovornosti |
| Ceniki, akcije, popusti | visoka pokritost | kompleksna promocijska pravila, kanali |
| Inventura/skener | visoka pokritost | mobilna oprema, serije/loti, rollout |
| Nabavna/prodajna naročila | visoka pokritost | napovedovanje, dobaviteljski EDI, planiranje |
| Dokumenti in e-računi | visoka do srednja | format partnerjev, OCR natančnost, approval |
| Spletna trgovina | srednja | konkreten konektor, lastnik integracije, OMS/WMS |
| Dostava in kurirji | srednja | partner, SLA, etikete in povratna logistika |
| Napredni WMS/slotting/wave picking | omejena do srednja | specialistični WMS in obseg skladišča |
| CRM/loyalty/personalizacija | omejena | partner ali ločena rešitev |
| Preprečevanje kraje | nizka neposredno | fizična varnost, analitika, politika |
| Demand sensing/AI forecast | odvisno od scope | podatki, model, partner, governance |

### 11.2 Pomembne meje prodajne obljube

- ERP ne odpravi slabe disciplino prevzemov, če nihče ne izvaja novega postopka.
- Povezana spletna trgovina ni isto kot optimiziran OMS, WMS in returns platforma.
- Sledljivost lota je učinkovita samo, če se lot zajema na vseh kritičnih točkah.
- Integracija s terminalom, tehtnico, tiskalnikom, tržnico ali kurirjem potrebuje konkretno tehnično in komercialno preveritev.
- Varnost in kraja zahtevata poleg sistema fizične ukrepe, pravila in preiskovanje vzrokov.

### 11.3 Integracijska arhitektura za pogovor s stranko

**PANTHEON kot sistem evidence** naj bo za trgovsko jedro: artikel, poslovni partner, dokument, zaloga, cena, računovodstvo in poročanje. Okoli njega se lahko povezujejo POS naprave, spletna trgovina/marketplace, kurirji, plačila, skenerji, DMS/OCR, HR, CRM, BI in po potrebi WMS.

Pred podpisom definiramo za vsako povezavo:

1. sistem resnice za vsak podatkovni objekt;
2. smer, frekvenco in mehanizem prenosa;
3. kdo obravnava napako prenosa;
4. kako se prepreči podvajanje naročila ali zaloge;
5. testne primere: odpoved, delna dobava, vračilo, promocija, izpad povezave;
6. strošek licence, razvoja, vzdrževanja in sprememb.

---

## 12. Regulativa in zunanji pritiski: samo tam, kjer ustvarijo operativni primer

| Tema | Operativna posledica | Relevantni proces | Prodajni signal |
|---|---|---|---|
| Davčno potrjevanje računov | sledljiv POS, poslovni prostor, naprava, številčenje | POS/finance | več blagajn ali ločene lokacije |
| Znižanja cen | dokaz zgodovine cen in pravilna oznaka | cenik/promocija | pogosto znižanje, splet + fizični kanal |
| Spletna prodaja | informacije, dobava, vračila in odstop | OMS/fulfilment/servis | višji delež e-prodaje ali marketplace |
| B2B e-računi 2028 | strukturirana izmenjava dokumentov doma B2B | nabava/finance/DMS | veliko dobaviteljev ali B2B kupcev |
| GPSR | varnost izdelka, sledljivost, ukrepanje pri nevarnem izdelku | master data/serije/odpoklic | uvoznik, zasebna znamka, tehnično blago |
| PPWR | podatki o embalaži in odgovornost v dobavni verigi | nabava/artikli/dokumenti | uvoznik/zasebna znamka; ni generičen ERP ROI |

General Product Safety Regulation zajema tudi izdelke, prodane prek spleta, ter krepi pravila za sledljivost in nadzor nevarnih potrošniških izdelkov. [Uradni vir: [European Commission – GPSR](https://trade.ec.europa.eu/access-to-markets/en/news/eus-general-product-safety-regulation-gpsr-new-era-consumer-protection)]

Uredba EU o embalaži in odpadni embalaži (PPWR) je začela veljati februarja 2025 in se praviloma uporablja od 12. avgusta 2026. V researchu je to signal za uvoznike in lastne blagovne znamke, ne razlog za splošno obljubo, da ERP sam rešuje celotno skladnost. [Uradni vir: [European Commission – PPWR](https://environment.ec.europa.eu/topics/waste-and-recycling/packaging-waste_en)]

---

## 13. Konkurenčna krajina in izbira rešitve

### 13.1 Kategorije konkurence

| Kategorija | Primeri | Kdaj so močni | PANTHEON prodajna pozicija |
|---|---|---|---|
| Lokalni ERP/računovodstvo | Saop/Minimax/Vasco, Birokrat, e-racuni.com | mikro podjetja, enostavni procesi, lokalna skladnost | širše povezovanje maloprodaje, zalog in financ |
| Globalni ERP | Business Central, SAP Business One, Odoo | kompleksne skupine, mednarodni standardi, ekosistem | lokalizacija, cena/funkcionalnost in regionalna podpora |
| POS-specialist | vertikalne blagajne, hospitality POS | zelo hiter front-office ali vertikalne potrebe | vrednost enotnega back-office in financ |
| e-commerce/OMS | Shopify, WooCommerce, marketplace orodja | digitalni katalog, checkout in marketing | PANTHEON kot evidence/finance; integracija, ne zamenjava |
| WMS/TMS/BI/CRM specialist | različni partnerji | globoko optimiranje posamezne domene | PANTHEON kot jedro, partner za specializacijo |

### 13.2 Poštena kvalifikacija

PANTHEON ni nujno najboljša izbira, če kupec potrebuje zgolj preprosto samostojno blagajno brez povezave s skladiščem in financami, ali pa če je problem izrazito specialističen (npr. velik avtomatiziran distribucijski center) in integracijska arhitektura ni določena. Takšna iskrenost poveča verjetnost, da prodajni pogovor ostane v segmentu, kjer PANTHEON dejansko ustvarja vrednost.

---

## 14. Nakupno vedenje, sprožilci in ovire

### 14.1 Sprožilci za nakup

- odpiranje druge oziroma tretje poslovalnice;
- nova spletna trgovina ali prehod v omnichannel;
- inventura, pri kateri razlike presenetijo vodstvo;
- nezanesljive zaloge in odpovedi naročil;
- sprememba računovodstva, ERP-ja ali zunanjega partnerja;
- večje število SKU, cenikov in akcij;
- regulatorna zahteva (e-računi, cene, sledljivost);
- zamenjava zastarele blagajne ali prekinitev podpore infrastrukturi;
- združitev podjetij oziroma centralizacija nabave.

### 14.2 Najpogostejši ugovori in kako jih raziskati

| Ugovor | Pravilni odziv | Dokaz |
|---|---|---|
| »Sistem že imamo.« | Ne prodajamo zamenjave; najprej najdemo merljivo vrzel. | tok procesa, čas, razlike, podatki |
| »Ljudje se ne bodo navadili.« | Vključimo uporabnike, pilote, super-userje in rollout po lokacijah. | plan uvajanja, trening, podpora |
| »Integracija bo predraga.« | Razbijemo na obvezno/priporočeno/kasneje in pokažemo TCO. | integracijski backlog in ponudba |
| »Ne vemo številk.« | Ne pretvarjamo nevednosti v 0; naredimo dokazni sprint. | 30-dnevni vzorec, izvoz, inventura |
| »Nočemo ustaviti prodaje.« | Načrt migracije in fallback; pilot najprej. | cutover plan, testni scenariji |

---

## 15. ICP in lead-scoring za Datalab/PANTHEON

### 15.1 Kvalifikacijski model (0–100)

| Dimenzija | Točke | Signal visoke vrednosti |
|---|---:|---|
| Kompleksnost kanala | 0–20 | poslovalnice + splet ali B2B/B2C hibrid |
| Kompleksnost zaloge | 0–20 | veliko SKU, lokacij, lotov/serij, prenosi |
| Merljiv problem | 0–20 | znane razlike, ročne ure, odpovedi, zastaranje |
| Spremembni sprožilec | 0–15 | nova lokacija, migracija, e-računi, rast |
| Pripravljenost podatkov | 0–10 | lahko da izvoz POS/zaloge/nabave |
| Fit PANTHEON-a | 0–10 | POS + zaloga + finance + dokumenti |
| Dostop do odločevalca | 0–5 | lastnik/COO/finance in procesni lastnik |

**70+**: audit in poslovni primer. **45–69**: diagnostični lead magnet in discovery. **pod 45**: negovanje, izobraževanje ali druga rešitev.

### 15.2 Negativni signali

- želi samo najcenejšo blagajno brez procesa zaloge/financ;
- pričakuje, da bo ERP odpravil fizično krajo brez drugih ukrepov;
- nima lastnika podatkov ali pripravljenosti na standardizacijo;
- zahteva obsežno integracijo, vendar brez proračuna in tehničnega lastnika;
- nima relevantnega obsega procesa in ni jasnega razvojnega dogodka.

---

## 16. Pretvorba researcha v lead magnet in vprašalnik

### 16.1 Priporočen tok

1. **Podtip maloprodaje**: blago, kanali, lastnosti sledljivosti, poslovni model.
2. **Obseg**: poslovalnice, blagajne, skladišča, SKU, transakcije/naročila, prihodki, COGS, marža.
3. **Sistemsko okolje**: POS–zaloga, skupna baza, spletna integracija, naprave, računovodstvo.
4. **Triaža 12 področij**: uporabnik oceni pogostost oziroma vpliv.
5. **Samodejni izbor dveh glavnih modulov**; tretjega lahko doda.
6. **Finančne osnove in podrobna vprašanja** z virom podatka.
7. **Kratka diagnostika pripravljenosti**: podatki, integracije, procesni lastnik.
8. **Rezultat**: izmerjeni strošek izbranih področij, kapaciteta, kapital, naslovljivost, zanesljivost in naslednji podatki za preverbo.
9. **Šele nato**: konfiguracija, TCO, ROI, payback in implementacijska faza.

### 16.2 Dvanajst področij triaže

1. razpoložljivost artiklov in prazne police;
2. presežne zaloge, odpisi in markdowni;
3. nabava in dobaviteljski pogoji;
4. cene, akcije in marže;
5. prevzem, prenosi in sledljivost;
6. blagajna, zaključki in plačila;
7. inventurni manko in točnost zaloge;
8. spletna prodaja, fulfilment in vračila;
9. kadri, razporedi in evidence;
10. analitika in poročanje;
11. dokumenti, finance in e-poslovanje;
12. reklamacije, garancije in servis.

### 16.3 Pravila odgovorov

Vsak številčni odgovor ima status:

- **izvoz/sistem** (najvišja zanesljivost);
- **dokument ali zadnja inventura**;
- **interna približna ocena**;
- **izbran razpon**;
- **ne vem**;
- **nič** (dejansko potrjeno nič);
- **ni relevantno**.

`Ne vem` nikoli ni `0`. Neizbrani modul ni dokaz, da tam ni stroška.

---

## 17. Podatkovni model za kalkulator

| Tip podatka | Primer | Kaj se z njim dela |
|---|---|---|
| `SCALE_BASE` | promet, COGS, št. naročil, transakcije | osnova za stopnjo/izračun |
| `LOSS_RATE` | delež napak cen, stockout, vračil | pomnoži z ustrezno osnovo |
| `DIRECT_LOSS` | odpis, kazen, neizterjan rabat | ločen letni strošek |
| `TIME_VOLUME` | ure ročnega dela | kapaciteta, ne samodejni prihranek |
| `CAPITAL_BASE` | povprečna zaloga | osnova kapitala |
| `CAPITAL_RATE` | realno zmanjšljivi delež | vodi v kapital, ne v strošek |
| `ROOT_CAUSE` | kraja, proces, dobavitelj, sistem | določi naslovljivi delež |
| `CONTEXT` | lokacije, kanali, integracija | izbira modulov in rešitev |
| `NOT_APPLICABLE` | proces ne obstaja | izključi brez pretvarjanja v nič |

### 17.1 Ključne formule

**vrednost avtomatizabilne kapacitete = ure x polni strošek ure x avtomatizabilni delež**

**realno izkoristljiva vrednost = vrednost avtomatizabilne kapacitete x delež materializacije**

**naslovljiva letna korist = (neposredna izguba + realno izkoristljiva kapaciteta + prihranek financiranja) x naslovljivi delež x realistično izboljšanje**

**učinek prvega leta = faktor ramp-upa x naslovljiva letna korist - letni TCO - enkratni strošek uvedbe**

**3-letni ROI = (koristi v treh letih - TCO v treh letih) / TCO v treh letih**

### 17.2 TCO, ki ga ne smemo izpustiti

- licence in dodatni uporabniki/blagajne;
- cloud/gostovanje, podpora in nadgradnje;
- naprave: terminali, skenerji, tiskalniki, tehtnice;
- konektorji, razvoj in vzdrževanje integracij;
- migracija šifrantov, zalog, odprtih dokumentov in zgodovine;
- konfiguracija, testiranje, pilot in cutover;
- izobraževanje, interno projektno delo in začasno dvojno delo;
- organizacijske spremembe in obvladovanje izjem.

---

## 18. Zaščita pred dvojnim štetjem

| Dogodek | Šteje se samo v |
|---|---|
| odpovedano spletno naročilo zaradi napačne zaloge | spletna prodaja |
| izgubljen nakup v poslovalnici zaradi stockouta | razpoložljivost |
| potrjeni odpisi/poteklo blago | presežna zaloga in odpisi |
| nepojasnjen inventurni manko | manko |
| običajno spletno vračilo | spletna prodaja in vračila |
| garancijsko popravilo/reklamacija | servis |
| primerjava dobavnice in računa | prevzem/nabava |
| knjiženje računa | finance/računovodstvo |
| iskanje ali odobritev dokumenta | dokumentacija |
| čas izdelave poročila, že naveden drugje | ne ponovi v analitiki |

Pri vseh časovnih vprašanjih se prikaže opomba: **»Ne vključujte ur, ki ste jih že vnesli pri drugem področju.«**

---

## 19. Ocena zanesljivosti in dokazni sprint

### 19.1 Zanesljivost rezultata

Predlagani faktorji: izvoz iz sistema 1,00; dokument ali inventura 0,90; interna ocena 0,70; razpon 0,50; panožni benchmark 0,30. Skupno zanesljivost izračunamo tehtano s finančnim pomenom postavke, ne s številom odgovorov.

**zanesljivost = vsota(strošek_i x zanesljivost_i) / vsota(strošek_i)**

### 19.2 30-dnevni dokazni sprint

Če je potencial velik, a podatki slabi, naj prodajni proces ne sili v lažen ROI. Predlagaj kratek dokazni sprint:

1. izvoz top SKU, zaloge, prodaje, cen in odprtih naročil;
2. vzorec stockoutov in odpovedanih spletnih naročil;
3. pregled zadnje inventure po vzrokih;
4. meritev zaključkov blagajn ter ročnega dela 5–10 delovnih dni;
5. vzorec vračil in reklamacij;
6. popis integracij, lastnikov in ročnih prenosov.

Izhod ni še ponudba. Izhod je dokazna osnova, iz katere postaneta konfiguracija in ROI verodostojna.

---

## 20. Implementacijski model in tveganja uvedbe

### 20.1 Priporočen vrstni red

| Faza | Namen | Pogoj za prehod |
|---|---|---|
| 0. Discovery | proces, podatki, scope, odgovornosti | potrjen seznam kritičnih scenarijev |
| 1. Temelj | šifranti, lokacije, pravice, dokumenti | očiščeni minimalni podatki |
| 2. Pilot | ena lokacija/kanal ali omejen proces | testne transakcije in usposobljeni super-userji |
| 3. Rollout | POS, zaloga, cena, finance in integracije | dnevna kontrola razlik, fallback |
| 4. Stabilizacija | odprava izjem in merjenje KPI | 30–60 dni stabilnih podatkov |
| 5. Optimizacija | replenishment, BI, dodatni kanali | potrjene izhodiščne vrednosti |

### 20.2 Največja tveganja

- podatkovna migracija brez lastnika šifrantov;
- prepozna odločitev o sistemu resnice za e-commerce;
- ceniki in promocije brez testnih primerov;
- podcenjeni periferni sistemi in naprave;
- preveč prilagoditev pred prvim delujočim standardnim procesom;
- nejasna podpora v prvem tednu po cutoverju;
- KPI, ki nimajo pred-uvedbenega baselinea.

**Mitigacija:** register odločitev, RACI, testni katalog izjem, pilot, podvojeno usklajevanje za omejen čas in vsakodnevni komercialno-operativni war room po zagonu.

---

## 21. Prodajni playbook po signalih

| Signal na leadu | Hipoteza bolečine | Prvo vprašanje | Naslednji dokaz |
|---|---|---|---|
| več poslovalnic | cene/zalogе niso enotne | »Kako hitro vidite zalogo istega artikla po vseh lokacijah?« | screenshot/izvoz zalog in prenosov |
| spletna + fizična prodaja | oversell in ročna uskladitev | »Kaj se zgodi, ko zadnji kos prodajo v poslovalnici?« | 10 primerov odpovedi/razlik |
| moda/obutev | sezonski markdown in variante | »Kje nastaja največja razlika med planirano in dejansko maržo?« | staranje in prodaja po variantah |
| elektronika | serije, garancije, RMA | »Ali najdete originalni račun in serijo brez ročnega iskanja?« | vzorec reklamacij |
| živila/kozmetika | roki, loti in odpisi | »Kako izločite lot pred potekom ali odpoklicem?« | zadnji odpis/odpokrlic |
| uvoznik | nabavne cene in dobavni roki | »Koliko naročil se spremeni po oddaji in kako to vpliva na zalogo?« | naročila, prejmi, razlike |
| veliko ročnih zaključkov | draga administracija in slaba kontrola | »Koliko minut dnevno porabi vsaka blagajna za zaključek?« | časovna meritev in razlike |

---

## 22. Primeri business-case receptov

### Recept A: manjša trgovska mreža z nezanesljivo zalogo

**Simptomi:** 4 poslovalnice, centralno skladišče, prenosi po e-pošti, občasne inventure, zaposleni veliko kličejo med lokacijami.

**Kaj meriti:** razliko knjiga–fizično, ure preverjanja zaloge, prenosne napake, stockoute na top SKU, ekspresne prenose ter zalogo brez prodaje.

**Naslovljivi del:** enotna zaloga po lokaciji, dokumentirani prenosi, skeniranje/inventura, poročila. Kraje in slabe dobave se ločijo.

**Verjetna konfiguracija:** RE kot maloprodajno jedro, RT za POS terminale po potrebi, mobilna inventura, finance/dokumenti in definirana naprava/omrežje. To je hipoteza za scope, ne ponudba.

### Recept B: omnichannel moda z vračili in markdowni

**Simptomi:** spletna trgovina in dve lokaciji, ročni prenosi cen, sezonski popusti, vračila se obravnavajo v e-pošti.

**Kaj meriti:** delež prodaje po znižanju, stopnja vračil po kategoriji/velikosti, ponovna prodajnost vračil, odpovedi zaradi zaloge, čas vzdrževanja cen, razlika med kanali.

**Naslovljivi del:** enotni ceniki in zaloge ter dokumentiran tok vračila. Napredna optimizacija velikosti in marketinška konverzija sta dodatni domeni.

### Recept C: uvoznik elektronike z garancijami

**Simptomi:** serijske številke delno v Excelu, originalne račune iščejo ročno, dobaviteljski zahtevki niso sledljivi.

**Kaj meriti:** reklamacije mesečno, čas primera, delež primerov brez računa/serije, vrednost neizterjanih zahtevkov, nadomestne naprave in zunanji servis.

**Naslovljivi del:** povezava prodaje, serijske številke, dokumenta in servisnega toka. Slaba kakovost izdelka ostaja dobaviteljsko tveganje.

---

## 23. Kaj se mora kalibrirati po prvih 50 kakovostnih vnosih

- katere triažne bolečine vodijo v resnično visok poslovni primer;
- kateri odgovori so pretežki in se najpogosteje končajo z »ne vem«;
- razponi po arhetipu in velikosti, ne enotni razpon za vse;
- naslovljivi deleži po glavnem vzroku;
- razmerje med prijavljenim časom in dejanskim časovnim vzorcem;
- pogostost dvojnega štetja;
- koliko leadov res preide iz lead magneta v audit, ponudbo in implementacijo;
- napovedna natančnost rezultata glede na podatke po uvedbi.

Kalibracija je obvezna zato, ker najboljši model ni tisti z največ vprašanji, temveč tisti, ki izboljša oceno in prodajni pogovor pri najmanjšem potrebnem naporu uporabnika.

---

## 24. Prednostni načrt izvedbe

### P0 – pred objavo lead magneta

- ločiti promet, COGS, izgubo, kapaciteto in kapital;
- odstraniti pravilo »če ne veste, vnesite 0«;
- uvesti pokritost rezultata in zanesljivost;
- zaščititi formule pred dvojnim štetjem;
- pri vsakem rezultatu povedati, ali gre za strošek, maržo, kapaciteto ali denarni tok;
- natančno opredeliti PANTHEON ter integracijske predpostavke.

### P1 – največji vpliv na natančnost

- podtip maloprodaje in lastnosti blaga;
- ločitev stockouta od presežne zaloge;
- ločitev POS, manka, vračil in servisnih reklamacij;
- količinski imenovalci: transakcije, naročila, dobave, vračila, blagajne, SKU;
- ekonomika spletnih vračil in staranje zaloge;
- vzroki ter naslovljivost posamezne izgube.

### P2 – poslovni primer

- konfigurator licenc, uporabnikov, blagajn, naprav in integracij;
- začetna naložba, letni TCO, ramp-up in 3-letni scenariji;
- možnost dokaznega sprinta, kadar podatki niso dovolj dobri;
- implementacijski plan in register tveganj ob poročilu.

### P3 – prodajni sistem

- ICP scoring in automatska personalizacija iz industrijskega signala;
- playbook po arhetipu;
- CRM polja za ugotovljeno bolečino, dokaz, zanesljivost in naslednji podatek;
- ponovna kalibracija na podlagi dejanskih implementacij.

---

## 25. Raziskovalne vrzeli in predpostavke, ki jih je treba preveriti pred ponudbo

1. Aktualni lokalni cenik PANTHEON-a, paketi in pogoji partnerja.
2. Natančna zmožnost glede lotov, serijskih številk, FEFO in odpoklica v ciljni konfiguraciji.
3. Obseg offline delovanja in davčnega potrjevanja pri izpadu povezave.
4. Konkretni konektor za e-commerce, kurirja, POS terminal, tehtnico, marketplace in plačila.
5. Lastnik in SLA vsake integracije ter strošek spremembe po zagonu.
6. Dejanska definicija marže in stroška ure podjetja.
7. Razlogi manka, odpisov, vračil in cenovnih odstopanj; ne le njihova skupna vrednost.
8. Kakovost šifrantov, zgodovine cen, začetnega stanja zalog in dokumentov.
9. Zahteve panoge: živila, zdravila, alkohol/tobak, kemikalije, garancije, embalaža, čezmejna prodaja.

---

## 26. Zaključek

Najboljši maloprodajni ROI-kalkulator ne prodaja seznama modulov. Razkrije, kje se v konkretni trgovini izgubljajo marža, denar, čas in zaupanje v podatke; pokaže, kateri del je dokazljiv in naslovljiv; ter pošteno loči ERP jedro od integracij, fizičnih ukrepov in organizacijske spremembe.

Pravilna logika je:

**arhetip in kontekst → obseg → procesni signal → dokaz trenutnega stanja → ekonomski učinek → glavni vzrok → naslovljivi delež → konfiguracija in TCO → ROI ter faza uvedbe.**

Tako lead magnet postane začetek resnega prodajnega razgovora, ne pa prenapihnjena ocena vseh možnih izgub v podjetju.

---

## 27. Register ključnih virov

1. [SURS – Retail trade and wholesale, commission trade, 2025](https://www.stat.si/StatWeb/en/News/Index/14479) – uradna struktura in promet slovenske trgovine.
2. [SURS – Turnover in retail trade, June 2026](https://www.stat.si/StatWeb/en/News/Index/14496) – mesečni/medletni količinski kontekst.
3. [Datalab – PANTHEON Retail Advanced POS](https://www.datalab.eu/pantheon/retail-advanced-pos/) – uradne produktne navedbe za POS in maloprodajo.
4. [Datalab – Sales and Purchase Orders](https://www.datalab.eu/functionalities/sales-and-purchase-orders/) – nabavna/prodajna naročila in partnerska e-commerce povezava.
5. [Datalab – eBusiness](https://www.datalab.eu/functionalities/ebusiness/) – eSlog, izmenjava dokumentov in integracije.
6. [Datalab – Warehouse Inventory Granule](https://www.datalab.eu/pantheon-granule/warehouse-inventory-granule/) – mobilno skeniranje in inventura.
7. [GS1 – 2D Barcodes at Retail POS](https://ref.gs1.org/guidelines/2d-in-retail/) – roki, loti, odpoklic, markdown in podatkovna sledljivost.
8. [FURS – davčne blagajne](https://www.fu.gov.si/nadzor/podrocja/davcne_blagajne_in_vezane_knjige_racunov_vkr/) – fiskalizacija gotovinskih računov.
9. [SPOT – spletna prodaja](https://spot.gov.si/sl/teme/spletna-prodaja) – obveznosti spletnega trgovca, informacije in odstop od pogodbe.
10. [SPOT – označevanje znižanih cen](https://spot.gov.si/sl/dejavnosti-in-poklici/dejavnosti/trgovina-na-drobno-v-specializiranih-prodajalnah-s-sportno-opremo) – 30-dnevna prejšnja cena in izjeme.
11. [GOV.SI – Zakon o izmenjavi elektronskih računov](https://www.gov.si/novice/2025-10-23-drzavni-zbor-sprejel-zakon-o-izmenjavi-elektronskih-racunov-in-drugih-elektronskih-dokumentov/) – domači B2B e-računi od 2028.
12. [European Commission – e-commerce statistics for individuals](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=E-commerce_statistics_for_individuals) – e-commerce kontekst EU.
13. [European Commission – GPSR](https://trade.ec.europa.eu/access-to-markets/en/news/eus-general-product-safety-regulation-gpsr-new-era-consumer-protection) – varnost potrošniških izdelkov in spletni kanal.
14. [European Commission – Packaging and Packaging Waste](https://environment.ec.europa.eu/topics/waste-and-recycling/packaging-waste_en) – PPWR časovnica.
15. [NRF – Retail Returns Landscape 2025](https://nrf.com/media-center/press-releases/consumers-expected-to-return-nearly-850-billion-in-merchandise-in-2025) – ameriški benchmark spletnih vračil.
16. [NRF – National Retail Security Survey 2023](https://nrf.com/research/national-retail-security-survey-2023) – ameriški benchmark shrinka.
17. **Datalab_kontekst.md, interni referenčni dokument projekta, 3. avgust 2026** – širši kontekst Datalaba, PANTHEON izdaj, ekosistema in konkurence. Podatke, ki vplivajo na ponudbo, je treba pred uporabo ponovno preveriti pri Datalabu/partnerju.

> **Omejitev virov.** Produktne navedbe Datalaba dokazujejo, kaj ponudnik javno navaja; niso neodvisen dokaz uspešnosti implementacije. Benchmarki NRF izhajajo iz ZDA in se ne prenašajo v slovenski ROI brez podatkov podjetja. Regulatorne povzetke je pred konkretno pravno odločitvijo treba preveriti v veljavnem predpisu oziroma pri strokovnjaku.
