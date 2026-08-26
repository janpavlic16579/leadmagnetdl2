# Veleprodaja in distribucija: celovita raziskovalna podlaga

**Za razvoj diagnostičnih sistemov, ROI-kalkulatorja in prodajnega poslovnega primera za Datalab**  
**Raziskovalni presečni datum:** 7. avgust 2026  
**Različica:** 1.0

> Ta dokument ni končni vprašalnik in ni prodajna obljuba. Je referenčni model panoge: pojasnjuje, kako veleprodajna in distribucijska podjetja ustvarjajo vrednost, kje nastajajo izgube, katere podatke je mogoče zanesljivo izmeriti, kako jih pretvoriti v finančni učinek ter kako preprečiti podvajanje in lažno natančnost.

# Izvršni povzetek

Veleprodaja je posel majhnih odstotkov na velikih tokovih blaga in denarja. Prihodek je lahko visok, toda ekonomski rezultat je odvisen od razmeroma drobnih razlik v nabavni ceni, rabatih, prispevni marži, obračanju zalog, popolnosti naročila, produktivnosti skladišča, stroških dostave in plačilni disciplini kupcev. Zato vprašalnik, ki meri samo ure ročnega dela, zgreši najpomembnejši del ekonomike distributerja.

Slovenska trgovina na debelo je leta 2024 ustvarila približno 19,7 milijarde EUR prihodka od prodaje, 1,2 % več kot leto prej. Neživilsko blago je predstavljalo največji del, približno 11,1 milijarde EUR. Podatek potrjuje gospodarsko težo segmenta, vendar ne opisuje njegove notranje raznolikosti. Distributer živil, uvoznik tehničnega blaga, farmacevtski veletrgovec in prodajalec rezervnih delov imajo vsi enako oznako »veleprodaja«, vendar povsem različne operativne in regulatorne zahteve. Vir: [SURS - Trgovina na drobno in na debelo, posredništvo, 2024](https://www.stat.si/StatWeb/News/Index/13757).

Raziskava vodi do desetih osrednjih sklepov:

1. **Proces mora biti modeliran od načrtovanja do denarja.** Najprimernejša hrbtenica je razširjena logika SCOR: Orchestrate, Plan, Order, Source, Fulfill in Return, dopolnjena s financami, podatki in kadri. [ASCM - SCOR Digital Standard](https://www.ascm.org/corporate-solutions/standards-tools/scor-ds/)
2. **Pet vrst učinka mora ostati ločenih.** Neposredni letni stroški, izgubljena kapaciteta, izgubljena prispevna marža, sprostljiv obratni kapital in tveganja niso ista stvar in jih ni dovoljeno sešteti v eno senzacionalno številko.
3. **Nabava je enakovredna prodaji.** Nabavna cena, dobaviteljski rabati, minimalne količine, dobavni roki, uvoz, landed cost in kakovost dobaviteljev pogosto ustvarijo večji učinek kot hitrejši vnos prodajnega naročila.
4. **Zaloga je osrednji finančni mehanizem.** Meriti je treba dneve zaloge, obrate, starost, nekurantnost, odpise, fill rate, stockoute in variabilnost dobavnih rokov. Absolutna vrednost zaloge sama po sebi ne pove, ali je zaloga previsoka.
5. **Popolno naročilo je boljši skupni KPI kot posamezne napake.** APQC ga sestavlja iz pravilnega sprejema naročila, pravočasne in popolne dobave, brez poškodb ter pravilne dokumentacije. [APQC - Perfect order performance](https://www.apqc.org/resources/benchmarking/open-standards-benchmarking/measures/perfect-order-performance)
6. **Čas postane denarni prihranek samo ob mehanizmu realizacije.** Osemsto sproščenih ur ni avtomatično osemsto ur manj plač. Denarni učinek nastane, če se zmanjšajo nadure ali zunanji stroški, prepreči nova zaposlitev ali se z isto ekipo ustvari dodatna prispevna marža.
7. **Prodajna vrednost vračila ali dobropisa ni izguba.** Izguba je dodatna logistika, obdelava, razvrednotenje, nepovratni stroški in izgubljena marža po upoštevanju ponovne prodaje ter povračil dobavitelja ali prevoznika.
8. **ERP ni binarna spremenljivka.** Leta 2025 je ERP uporabljalo 46,45 % podjetij v EU, vendar prisotnost sistema ne dokazuje integriranosti, kakovosti podatkov ali dejanske uporabe. [Eurostat - E-business integration](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=E-business_integration)
9. **Rezultat mora biti razpon s sledljivostjo.** Vsaka postavka potrebuje izvor podatka, stopnjo gotovosti, pokritost procesov in ločeno obvladljivost vzroka.
10. **Pravi ROI potrebuje strošek rešitve in čas realizacije.** Brez implementacije, integracij, opreme, internega dela, naročnin in krivulje uporabe je mogoče govoriti le o potencialu izboljšave, ne o ROI.

Predlagana končna arhitektura kalkulatorja ima tri plasti:

| Plast | Namen | Tip rezultata |
|---|---|---|
| Diagnostika | določi poslovni model, kompleksnost, zrelost in glavne bolečine | prioritetna področja in hipoteze |
| Meritev | iz transakcij, časa, napak, marže in kapitala izračuna trenutno izgubo | dokazani stroški, kapaciteta, marža, kapital |
| Poslovni primer | upošteva naslovljivost, rešitev, uporabo, stroške in čas uvedbe | konservativni, verjetni in polni ROI |

# 1. Namen, obseg in raziskovalna metoda

## 1.1 Namen dokumenta

Dokument je pripravljen kot ponovljiva podlaga za:

- prenovo vprašalnika »Koliko vas stane sedanji način dela?«;
- razvoj računskega jedra in podatkovnega modela;
- oblikovanje segmentiranih prodajnih pogovorov;
- preslikavo bolečin na PANTHEON in partnerske rešitve;
- oblikovanje poročila za potencialnega kupca;
- poznejšo kalibracijo na dejanskih podatkih implementacij.

Ni namenjen določitvi univerzalnih prihrankov. Veleprodajni benchmark brez primerljivega poslovnega modela, asortimenta, ravni storitve in geografije je lahko bolj zavajajoč kot koristen.

## 1.2 Vključeni procesi

Obseg je širši od fizičnega skladišča. Vključuje:

- strategijo ponudbe, kanale, kupce in cenovno politiko;
- napovedovanje povpraševanja in planiranje zalog;
- nabavo, dobavitelje, uvoz in prevzem;
- skladiščenje, notranje premike, komisioniranje in pakiranje;
- odpremo, transport, dostavo in dokazilo o dostavi;
- vračila, reklamacije, RMA, garancije in servis;
- fakturiranje, terjatve, kreditne limite in izterjavo;
- maržo, cost-to-serve, poročanje in poslovno odločanje;
- dokumente, EDI, e-račune, integracije, podatke in varnost;
- kadre, delovni čas in uvedbo rešitve.

## 1.3 Viri in hierarhija dokazov

Uporabljena je naslednja hierarhija:

| Razred | Vrsta vira | Uporaba |
|---|---|---|
| 1 | zakonodaja, uradni statistični in regulatorni viri | roki, obveznosti, definicije, velikost trga |
| 2 | standardi in referenčni modeli: APQC, ASCM/SCOR, GS1, IFRS | procesi, KPI-ji, sledljivost in računovodska logika |
| 3 | recenzirana akademska literatura | vzročne povezave in operativne zakonitosti |
| 4 | uradne strani Datalaba in partnerskih rešitev | preverjena funkcionalna preslikava |
| 5 | notranji projektni dokumenti | kontekst cilja, omejitve in trenutna zasnova |

Trditve prodajalcev o prihrankih niso uporabljene kot dokaz univerzalnega učinka. Funkcionalnost je lahko potrjena, njen finančni učinek pa mora biti izračunan iz podatkov konkretnega podjetja.

## 1.4 Omejitve

- Slovenski javni podatki dobro opisujejo prihodke panoge, manj pa njeno operativno učinkovitost.
- APQC-jevi javni benchmarki so pogosto agregirani čez več panog. Njihova mediana ni avtomatični cilj posameznega podjetja.
- Podatki o dejanskih učinkih PANTHEON implementacij niso bili na voljo v standardizirani obliki.
- Del regulative velja samo za določene izdelke ali velikost podjetja; zato je vključena kot dinamično razvejanje.
- Poročilo predstavlja stanje na presečni datum in ne nadomešča pravnega, davčnega ali varnostnega svetovanja.

# 2. Kaj je veleprodaja in zakaj je ni mogoče obravnavati kot enotno nišo

## 2.1 Ekonomska funkcija distributerja

Distributer ne ustvarja vrednosti samo s preprodajo. Med proizvajalcem in kupcem zmanjšuje pet vrst trenja:

- **časovno trenje:** drži zalogo bližje kupcu;
- **količinsko trenje:** velike dobave razdeli na manjša naročila;
- **asortimentsko trenje:** združi izdelke več dobaviteljev;
- **informacijsko trenje:** prevaja tehnične podatke, cene, razpoložljivost in pogoje;
- **finančno trenje:** proizvajalcu plača prej, kupcu pa pogosto odobri odloženo plačilo.

Zato mora ROI model meriti tudi kakovost storitve in kapital, ne le administrativni čas. Preagresivno znižanje zaloge lahko zmanjša stroške, a poslabša fill rate in izgubi kupce. Cenejši prevoz lahko zniža strošek na pošiljko, a poveča zamude, poškodbe in reklamacije.

## 2.2 Glavni poslovni modeli

| Poslovni model | Primarni vir vrednosti | Tipična tveganja | Ključna razvejanja |
|---|---|---|---|
| klasični B2B veletrgovec | širina ponudbe, lokalna zaloga, komercialni odnos | veliko cenikov, kreditno tveganje, počasne zaloge | pogodbeni ceniki, rabati, DSO |
| ekskluzivni distributer znamke | dostop do znamke, razvoj trga, servis partnerjev | odvisnost od dobavitelja, letni bonusi, cilji | sell-in/sell-out, bonusi, marketing skladi |
| uvoznik | globalni sourcing in lokalna dostopnost | valuta, carina, dolgi roki, landed cost | Incoterms, carina, transport, tečaj |
| hitri FMCG distributer | frekvenca, razpoložljivost, gostota dostave | rok uporabe, hladna veriga, nizka marža | lot, FEFO, dnevne rute, vračljiva embalaža |
| tehnični distributer | strokovno svetovanje in razpoložljivost dolgega repa SKU | počasna zaloga, nadomestni artikli, projektno povpraševanje | specifikacije, serije, kompatibilnost |
| rezervni deli in servis | hitrost odziva, fitment, poprodaja | zelo širok asortiment, kritični stockouti | serial, garancija, servisno skladišče |
| spletna/B2B platformska veleprodaja | samopostrežno naročanje in integracija | kakovost podatkov, sinhronizacija zaloge | API, EDI, portal, real-time zaloga |
| dropship/cross-dock | nizek kapital in hiter pretok | odvisnost od dobavitelja, razdeljene pošiljke | razpoložljivost dobavitelja, orkestracija |
| 3PL-podprta distribucija | komercialni model brez lastnega skladišča | slabša vidnost in spori o SLA | integracija 3PL, lastništvo napake |

Vprašanje »Kaj pretežno prodajate?« mora zato ločiti poslovni model, vrsto blaga in način izpolnitve. To so tri različne dimenzije.

## 2.3 Segmentacija po lastnostih blaga

| Lastnost | Operativna posledica | Potrebni podatki |
|---|---|---|
| rok uporabe | FEFO, odpisi, kratki roki, odpoklici | lot, datum izteka, preostali rok ob odpremi |
| serijska številka | garancija, sledljivost posamezne enote | serial ob prevzemu, premiku, prodaji in vračilu |
| nevarno blago | omejitve skladiščenja in prevoza | UN številka, razred, dokumentacija, usposobljenost |
| hladna veriga | temperaturna integriteta in posebna dostava | temperatura, odkloni, čas izven režima |
| veliko/težko blago | prostor, viličarji, dostavna ekonomika | volumen, masa, lokacija, način manipulacije |
| visoka vrednost | kraje, zavarovanje, serializacija | vrednost, skrbništvo, pravice, revizijska sled |
| modno/sezonsko | kratek prodajni cikel, markdown | sezona, krivulja prodaje, starost, residualna vrednost |
| regulirano blago | dokazljiva sledljivost in poročanje | regulatorni identifikatorji in dokumenti |
| konfigurabilni izdelki | več napak pri ponudbi in naročilu | atributi, kompatibilnost, konfiguracijska pravila |

## 2.4 Velikost ni edina kompleksnost

Število zaposlenih je slab samostojen približek. Dve podjetji z 20 zaposlenimi se lahko močno razlikujeta: eno obdeluje 300 velikih naročil, drugo 30.000 drobnih vrstic. Kompleksnost je bolje oceniti z vektorjem:

- aktivni SKU-ji in delež dolgega repa;
- aktivni kupci in naslovi dostave;
- prodajne in nabavne vrstice na mesec;
- število cenikov, valut, skladišč in pravnih oseb;
- delež uvoza in povprečen dobavni rok;
- delež lotov, serialov in rokov uporabe;
- frekvenca dostave in lastna/tuja logistika;
- sezonskost in razmerje med vrhom ter povprečjem;
- delež ročnih, portalnih, EDI in API transakcij.

# 3. End-to-end procesni model

## 3.1 Referenčna procesna hrbtenica

SCOR Digital Standard oskrbovalno verigo organizira v procese Orchestrate, Plan, Order, Source, Transform, Fulfill in Return. Za distributerja je »Transform« navadno omejen na prepakiranje, kitting, označevanje ali lahko dodelavo; težišče je v Order, Source, Fulfill in Return. [ASCM - SCOR Quick Reference Guide](https://www.ascm.org/globalassets/ascm_website_assets/docs/scor/scor-ds-digital-guide_final.pdf)

| Raven | Proces | Začetni dogodek | Končni dogodek | Lastnik |
|---|---|---|---|---|
| 0 | plan-to-cash | napoved potreb | prejet denar in zaključena izjema | vodstvo |
| 1 | plan | zgodovina, tržni signal | potrjen plan prodaje, nabave in zaloge | planiranje/nabava |
| 1 | order-to-cash | povpraševanje ali naročilo | plačan račun | prodaja/finance |
| 1 | procure-to-pay | potreba po nabavi | plačan dobavitelj | nabava/finance |
| 1 | inbound-to-stock | prihod dobave | razpoložljiva in pravilno evidentirana zaloga | skladišče |
| 1 | pick-to-ship | sproščeno naročilo | predana pošiljka | skladišče/logistika |
| 1 | ship-to-deliver | prevzem prevoznika | dokazano pravilna dostava | logistika |
| 1 | return-to-resolution | zahteva za vračilo | finančno in fizično zaprt primer | reklamacije/servis |

## 3.2 Procesna meja preprečuje dvojno štetje

Vsak dogodek ima eno primarno finančno posledico in lahko več vzrokov. Zamuda dobavitelja lahko povzroči stockout, ekspresni prevoz in izgubljeno prodajo. V modelu:

- kakovost dobavitelja ostane KPI v nabavi;
- dodatni ekspresni prevoz je neposredni strošek nabave ali logistike;
- dokončno izgubljena prispevna marža je posledica v zalogah/prodaji;
- isti znesek se ne sme še enkrat všteti kot »strošek zamude dobavitelja«.

Praktično pravilo: **vzrok pojasni, posledica se monetizira samo enkrat**.

## 3.3 Tok podatkov je enako pomemben kot tok blaga

Minimalna digitalna sled tipičnega naročila:

1. kupec in dostavna lokacija;
2. pogodbeni cenik, rabat in kreditni limit;
3. prodajno naročilo in rezervacija zaloge;
4. nalog za komisioniranje;
5. potrjeni artikel, količina, lot/serial in embalaža;
6. odpremni dokument, SSCC in prevoznik;
7. dokazilo o dostavi;
8. račun in zapadlost;
9. plačilo, dobropis ali reklamacija.

GS1 EDI standardi podpirajo sporočila od naročila in dobave do plačila. Elektronska dobavnica DESADV lahko kupca pripravi na prevzem, RECADV pa vrne dejansko stanje prejete pošiljke. [GS1 Slovenija - Elektronsko poslovanje](https://www.gs1si.org/standardi/izmenjava-podatkov/gs1-edi), [GS1 Slovenija - Elektronska dobavnica](https://www.gs1si.org/panoge/logistika-transport/elektronska-dobavnica)

# 4. Ekonomika veleprodajnega podjetja

## 4.1 Prihodek ni korist in promet ni marža

Za ROI je ključen **prispevek**, ne prodajna vrednost. Če avtomatizacija omogoči 100.000 EUR dodatne prodaje pri 20 % prispevni marži, ekonomski prispevek pred dodatnimi fiksnimi stroški ni 100.000 EUR, temveč približno 20.000 EUR.

$$
Dodatna prispevna marža = dodatna realizirana prodaja × prispevna marža
$$

Prispevna marža mora biti opredeljena dosledno. Za osnovni model:

$$
Prispevna marža = prihodki - nabavna vrednost prodanega blaga - variabilna prodajna in dostavna poraba
$$

Bruto marža iz računovodstva je lahko uporabna, vendar pogosto ne vključuje transporta, plačilnih provizij, vračil, bonusov in drugih stroškov, ki se razlikujejo po kupcu ali naročilu.

## 4.2 Cost-to-serve

Enaka bruto marža po kupcu ne pomeni enake donosnosti. Kupec z mnogimi majhnimi naročili, posebnimi nalepkami, razdeljenimi dobavami, dolgimi plačilnimi roki in pogostimi vračili je dražji za oskrbo.

$$
Neto prispevek kupca = bruto marža - rabati in bonusi - stroški naročil - skladiščna obdelava - dostava - vračila - kreditni strošek
$$

Kalkulator ne potrebuje popolnega activity-based costinga, mora pa zaznati, ali podjetje sploh pozna:

- maržo po artiklu, kupcu in naročilu;
- strošek dostave in komisioniranja;
- delež naročil pod minimalno maržo;
- kupce z nesorazmernim številom majhnih pošiljk;
- neto učinek letnih rabatov in bonusov.

## 4.3 Obratni kapital

Za distributerja je denarni cikel pogosto pomembnejši od računovodskega dobička v posameznem mesecu.

$$
CCC = DIO + DSO - DPO
$$

Kjer je:

- DIO: dnevi zaloge;
- DSO: dnevi terjatev;
- DPO: dnevi obveznosti do dobaviteljev.

Znižanje DIO ali DSO sprosti denar enkrat. Letna ponavljajoča korist je predvsem nižji strošek financiranja in nižje tveganje, ne celotna sproščena glavnica vsako leto.

## 4.4 Pet ločenih vrst ekonomskega učinka

| Vrsta | Primer | Prikaz | Ali se ponavlja? |
|---|---|---|---|
| neposredni strošek | odpis, penal, dodatni prevoz, nadure | EUR/leto | da |
| kapaciteta | ročni vnos, iskanje, usklajevanje | ure/leto in FTE | operativno da, denarno pogojno |
| izgubljena marža | dokončno izgubljen stockout ali cenovna napaka | EUR prispevne marže/leto | da |
| obratni kapital | presežna zaloga ali terjatve | enkratni EUR | ne |
| tveganje | odpoklic, napačna sledljivost, izpad sistema | izpostavljenost/scenarij | verjetnostno |

## 4.5 Zakaj ena »velika številka« ni dovoljena

Če se 200.000 EUR sprostitve zaloge prišteje 50.000 EUR letnega prihranka in rezultat predstavi kot 250.000 EUR letnega učinka, je model napačen. Pravilno poročilo pokaže:

- 50.000 EUR ponavljajočega letnega potenciala;
- 200.000 EUR enkratne sprostitve kapitala;
- letni strošek financiranja te zaloge, npr. 200.000 EUR × dejanska financirna stopnja;
- investicijo in čas realizacije.

# 5. Podrobna raziskava procesov in meritev

## 5.1 Prodaja, povpraševanja, ponudbe, naročila, ceniki in rabati

### Kako proces deluje

Naročila lahko pridejo po e-pošti, PDF-ju, telefonu, EDI-ju, B2B portalu, spletni trgovini ali prek prodajnega zastopnika. Operativni tok zajema prepoznavo kupca, preverjanje cene in popusta, kreditnega limita, zaloge, obljubljenega datuma, vnosa dostavne lokacije, rezervacije ter potrditve.

### Tipične izgube

- prepisovanje vrstic iz PDF-ja ali e-pošte;
- podvojen vnos med spletno trgovino, Excelom in ERP-jem;
- napačna enota mere, artikel, naslov ali datum;
- zastarel cenik ali manjkajoč pogodbeni rabat;
- ročno odobravanje posebnih cen;
- sprejeto naročilo brez zaloge ali mimo kreditnega limita;
- prepozno potrjeno naročilo in nerealna obljuba kupcu;
- brez sledi o razlogu za izgubljeno ponudbo.

### Merljivi imenovalci

| Meritev | Priporočen imenovalec |
|---|---|
| produktivnost vnosa | naročilne vrstice na uro |
| stopnja ročnega vnosa | ročno vnesene vrstice / vse vrstice |
| napake v naročilih | popravljene vrstice / vse vrstice |
| cenovne izjeme | ročno odobrene vrstice / vse vrstice |
| čas potrditve | od prejema do potrditve naročila |
| digitalni delež | EDI + API + portalne vrstice / vse vrstice |

### Finančni model

$$
Strošek ročnega vnosa = mesečne vrstice × ročni delež × minute na vrstico ÷ 60 × strošek ure × 12
$$

$$
Izguba cenovnih napak = dogodki/leto × povprečna dejansko izgubljena prispevna marža na dogodek
$$

Pri cenovnih napakah je treba ločiti prepozno zaznano prenizko ceno od napake, ki je bila popravljena pred računom. Slednja ustvarja čas in morda zamudo, ne nujno izgubljene marže.

### Vprašanja z največjo informacijsko vrednostjo

- Koliko naročilnih vrstic prejmete na mesec in po katerih kanalih?
- Kolikšen delež vrstic se v ERP vnese brez ročnega prepisovanja?
- Koliko časa traja obdelava tipičnega naročila in koliko ima vrstic?
- Koliko cenikov, rabatnih shem in posebnih pogodb vzdržujete?
- Koliko cenovnih popravkov nastane po potrditvi ali računu?
- Ali sistem ob vnosu preveri ceno, zalogo, kreditni limit in dobavni datum?
- Koliko ur mesečno porabite za odobritev izjem?

### Preslikava na rešitve

PANTHEON podpira prodajna naročila, cenike, zaloge in povezovanje procesov. Granula B2B naročanje poslovnim partnerjem omogoča vpogled v ponudbo, zalogo in cene ter oddajo naročila. PanStore in API sta relevantna za spletne kanale, eIzmenjava/EDI pa za strukturirana naročila. [Datalab - Granula B2B naročanje](https://www.datalab.si/pantheon-granule/b2b-narocanje/), [Datalab - Program za veleprodajo](https://www.datalab.si/poslovni-program-za-veleprodajo/)

## 5.2 Nabava, dobavitelji, uvoz in landed cost

### Zakaj je področje kritično

Nabava vpliva na nabavno ceno, zalogo, razpoložljivost in denarni tok. Pri distributerju je lahko že majhen odstotek izboljšanja efektivne nabavne cene pomembnejši od velikih administrativnih prihrankov. Vendar pogajalskega potenciala ni dovoljeno avtomatično pripisati ERP-ju.

### Tipične izgube

- ročna priprava nabavnih predlogov;
- naročanje po občutku brez upoštevanja dejanske porabe in odprtih naročil;
- prepozna ali prevelika naročila zaradi minimalnih količin in paketov;
- zamude, nepopolne dobave in spremembe potrjenih datumov;
- ekspresne nabave, dražji prevoz in cenovne premije;
- neizkoriščeni količinski rabati, skonti in letni bonusi;
- napake v dobaviteljevih cenah ali računih;
- pomanjkljiv landed cost;
- neobvladana valutna izpostavljenost;
- napake v carinski, poreklovni ali Intrastat dokumentaciji.

### Landed cost

Pri uvozu je nabavna cena širša od dobaviteljeve fakture. FURS pojasnjuje, da carinska vrednost praviloma vključuje transakcijsko vrednost in stroške do meje Unije, med drugim prevoz, embaliranje, zavarovanje in določene licenčnine. [FURS - Carinska vrednost blaga](https://www.fu.gov.si/carina/podrocja/carinska_vrednost_blaga/)

$$
Landed cost = neto cena blaga + transport + zavarovanje + carina + posredovanje + manipulacija + drugi nepovratni stroški
$$

Povračljivi DDV ni strošek blaga, lahko pa začasno vpliva na denarni tok. Napačno razporejen skupni transport med artikle izkrivi maržo in odločitve o cenah.

### KPI-ji dobavitelja

| KPI | Formula ali definicija |
|---|---|
| supplier on-time delivery | pravočasne dobave / vse dobave |
| supplier OTIF | pravočasne in popolne dobave / vse dobave |
| lead-time adherence | dobave znotraj dogovorjenega odklona / vse dobave |
| incoming defect rate | napačne ali poškodovane vrstice / vse prejete vrstice |
| purchase price variance | dejanska cena - standardna/pogodbena cena |
| expedited purchase rate | nujna naročila / vsa nabavna naročila |
| PO automation | elektronsko ustvarjena/odobrena naročila / vsa naročila |

APQC supplier on-time delivery opredeljuje kot delež dobaviteljskih naročil, dostavljenih pravočasno po dogovoru. [APQC - Percentage of supplier on-time delivery](https://www.apqc.org/what-we-do/benchmarking/open-standards-benchmarking/measures/percentage-supplier-time-delivery)

### Finančni model

$$
Izogibljiv strošek nujnih nabav = dogodki × (dodatni prevoz + cenovna premija + dodatna obdelava)
$$

$$
Izgubljeni skonti = upravičena nabavna vrednost × neizkoriščeni delež × stopnja skonta
$$

### Razvejitve

- Uvoz iz tretjih držav odpre carino, poreklo, valuto, Incoterms in landed cost.
- Uvoz CBAM blaga od 1. januarja 2026 odpira posebne obveznosti za zadevne uvoznike. [Evropska komisija - CBAM definitive regime](https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/cbam-definitive-regime_en)
- Ekskluzivna distribucija odpre letne bonuse, marketinške sklade in prodajne cilje.
- Dolgi dobavni roki odprejo napovedovanje, varnostno zalogo in zanesljivost potrditve.

### Preslikava na rešitve

PANTHEON Enterprise povezuje nabavna naročila, dobavitelje, dobavnice, zaloge in finance. Javna predstavitev navaja podporo planiranju potreb, serijam, lotom, prevzemom in inventuram. Pri uvozu je treba konfiguracijo in dejanski obseg funkcij preveriti v discoveryju; funkcionalna možnost ni dokaz pravilne uporabe. [Datalab - PANTHEON Enterprise](https://www.datalab.si/pantheon/enterprise/)

## 5.3 Prevzem, kontrola in dock-to-stock

### Proces

Od najave dobave do razpoložljive zaloge: termin prihoda, razklad, identifikacija, primerjava z naročilom/dobavnico, količinska in kakovostna kontrola, zajem lota/seriala/roka, določitev lokacije, knjiženje in fizični premik.

### Tipične izgube

- dobava brez predhodne najave ali elektronske dobavnice;
- čakanje vozila, ljudi ali prostora;
- ročni vnos dobavnice;
- neznana ali napačna skladiščna lokacija;
- manjkajoč lot, serial ali rok uporabe;
- blago je fizično prisotno, vendar še ni prodajno razpoložljivo;
- razlika med dobavo, prevzemom in računom se odkrije prepozno;
- reklamacija dobavitelju nima dokazov.

### KPI-ji

| KPI | Začetek | Konec |
|---|---|---|
| dock-to-stock | prihod/razklad dobave | zaloga je pravilno knjižena in razpoložljiva |
| receiving accuracy | prejete pravilne vrstice | vse prejete vrstice |
| put-away accuracy | pravilno odložene enote | vse odložene enote |
| ASN coverage | dobave z uporabno predhodno najavo | vse dobave |
| supplier discrepancy closure | odprtje razlike | finančno in fizično zaprtje |

Dock-to-stock je standardni logistični cikel v APQC/SCOR merjenju. V kalkulatorju je posebej pomemben, ker lahko dolga administrativna zamuda ustvari navidezni stockout, čeprav je blago že na dvorišču.

### Finančni model

$$
Strošek prevzema = dobave × povprečne delovne ure na dobavo × strošek ure
$$

Izboljšava časa ni v celoti prihranek. Monetizira se delež, ki zmanjša nadure, zunanjo manipulacijo, čakanje prevoznika ali omogoči več pretoka brez nove ekipe.

## 5.4 Skladiščenje, lokacije in dopolnjevanje

### Ključna logika

ERP evidenca količine brez zanesljive lokacije ne zadošča za učinkovit picking. Sistem mora vedeti, kaj je na zalogi, v kakšnem statusu, na kateri lokaciji, v katerem lotu/serialu in ali je rezervirano, blokirano ali razpoložljivo.

### Tipične izgube

- iskanje blaga in prazni premiki;
- dvojne ali neveljavne lokacije;
- blago zunaj sistema ali na začasnih mestih;
- zamenjava lotov in nepravilna rotacija FIFO/FEFO;
- slabo slotting razporejanje hitrih artiklov;
- prepozno dopolnjevanje pick-face lokacij;
- slaba izkoriščenost prostora ali nevarna prenatrpanost;
- zastarela rezervacija blokira uporabno zalogo.

### Meritve

- ure iskanja in hoje;
- premiki na naročilno vrstico;
- natančnost lokacij;
- delež pickov iz rezervne lokacije;
- replenishment stockout;
- izkoriščenost lokacij po tipu, ne le skupni odstotek;
- delež blokirane ali neidentificirane zaloge;
- število ročnih popravkov stanja in lokacije.

## 5.5 Komisioniranje, pakiranje in odprema

Komisioniranje je v literaturi praviloma najbolj delovno intenziven in drag skladiščni proces. Pregled De Kosterja, Le-Duca in Roodbergena ga ocenjuje do približno 55 % skladiščnih operativnih stroškov, pri čemer je pot pogosto največji del časa. Številke niso benchmark za vsako skladišče, utemeljujejo pa ločeno merjenje poti, iskanja, pobiranja in priprave. [Erasmus University - Design and control of warehouse order picking](https://repub.eur.nl/pub/11877/)

### Tipične izgube

- papirni seznami in ročno potrjevanje;
- neoptimalna pot in večkratno vračanje v isti hodnik;
- iskanje, prazna lokacija in nadomestni artikel;
- napačen artikel, količina, lot ali serial;
- ponovno komisioniranje in dodatna kontrola;
- čakanje na pakiranje, dokumente ali prevoznika;
- neustrezna embalaža in poškodbe;
- razdeljene pošiljke zaradi manjkajoče vrstice;
- konice, nadure in začasno osebje brez standardiziranega dela.

### KPI-ji

| KPI | Formula |
|---|---|
| lines per labor hour | potrjene vrstice / neposredne ure pickinga |
| pick accuracy | pravilne vrstice / vse pobrane vrstice |
| pick-to-ship time | od sprostitve naloga do predaje prevozniku |
| first-pass completion | naročila brez ponovnega dela / vsa naročila |
| split-shipment rate | naročila v več pošiljkah / vsa naročila |
| packing material per shipment | strošek embalaže / pošiljke |
| avoidable overtime | nadure zaradi napak, slabe priprave ali sistema |

### Finančni model

$$
Letni strošek pickinga = vrstice/leto ÷ vrstice na uro × polni strošek skladiščne ure
$$

$$
Izogibljiv strošek napak = napačne pošiljke × (ponovni picking + embalaža + transport + obdelava + razvrednotenje)
$$

Pri nadurah se upošteva dejanski dodatni strošek nadure, ne še enkrat celotna polna urna postavka, če je osnovna plača že fiksni strošek.

### Preslikava na rešitve

PANTHEON podpira skladišča, serije, lote, prevzeme, rezervacije in inventure; PanScan poveže čitalec črtne ali QR kode s skladiščnimi procesi. Granula Inventura skladišč omogoča mobilno skeniranje in neposreden nastanek dokumentov viška oziroma manjka. [Datalab - Tržnica rešitev](https://www.datalab.si/dodatne-resitve/), [Datalab - Inventura skladišč](https://www.datalab.si/pantheon-granule/granula-inventura-skladisc/)

## 5.6 Planiranje zalog, razpoložljivost in nekurantnost

### Ravnotežje

Cilj ni minimalna zaloga, ampak minimalen skupni strošek ob dogovorjeni ravni storitve. Preveč zaloge veže kapital, prostor in tveganje zastaranja; premalo zaloge povzroča izpad prodaje, ekspresno nabavo in slabšo storitev.

### Osnovni KPI-ji

$$
DIO = povprečna zaloga ÷ (letni COGS ÷ 365)
$$

APQC enako opredeljuje total inventory days of supply in javno prikazuje mediano 45,6 dneva v širokem večpanožnem vzorcu. Ta vrednost je orientacija, ne cilj za posamezen segment. [APQC - Total inventory days of supply](https://www.apqc.org/resources/benchmarking/open-standards-benchmarking/measures/inventory-days-supply)

$$
Obrati zaloge = letni COGS ÷ povprečna zaloga
$$

$$
Line fill rate = takoj v celoti izpolnjene naročilne vrstice ÷ vse naročilne vrstice
$$

### Starostna struktura

Minimalne skupine:

- brez prodaje 0-90 dni;
- 91-180 dni;
- 181-365 dni;
- več kot 365 dni;
- kratki preostali rok uporabe;
- blokirano, poškodovano ali vračano blago.

Časovne skupine morajo biti prilagodljive panogi. Artikel z eno prodajo na leto je lahko normalen rezervni del, tedensko hitro prodajan artikel pa problem že po 30 dneh.

### Vrednotenje in odpisi

IAS 2 zahteva merjenje zalog po nižji od nabavne vrednosti in čiste iztržljive vrednosti; slednja je ocenjena prodajna cena, zmanjšana za stroške dokončanja in prodaje. To podpira ločeno merjenje razvrednotenja, ne le fizičnega odpisa. [IFRS Foundation - IAS 2 Inventories](https://www.ifrs.org/issued-standards/list-of-standards/ias-2-inventories/)

### Stockout ni avtomatično izgubljena prodaja

Razlikovati je treba:

- takojšnjo nadomestitev z drugim artiklom;
- backorder in poznejšo dobavo;
- delno dobavo;
- dokončno izgubljeno vrstico;
- izgubo celotnega naročila ali kupca.

$$
Izgubljena marža stockouta = nedobavljene vrstice × povprečna vrednost vrstice × dokončno izgubljeni delež × prispevna marža
$$

### Napovedovanje in bullwhip

Majhne spremembe končnega povpraševanja se lahko zaradi naročanja v paketih, promocij, dolgih rokov in slabega deljenja informacij povečujejo navzgor po verigi. Zato vprašalnik meri:

- ali napoved obstaja in na kateri ravni;
- frekvenco posodobitve;
- razliko med prodajo, naročili in promocijami;
- variabilnost dobavnega roka;
- minimalne količine in dobaviteljske pakete;
- uporabo varnostne zaloge;
- napako napovedi po skupinah SKU.

### Sprostljiv kapital in letna korist

$$
Sprostljiva zaloga = max(trenutna povprečna zaloga - ciljna zaloga, 0)
$$

Če cilj ni znan, se uporabi konservativen interval naslovljivega deleža po ABC/XYZ in starosti, nikoli en sam generični odstotek.

$$
Letna financirna korist = sprostljiva zaloga × dejanska mejna financirna stopnja
$$

Na presečni datum je bil €STR 2,185 %, povprečne nove manjše kratkoročne podjetniške bančne izpostavljenosti v evroobmočju pa so bile višje. Kalkulator mora uporabiti dejanski strošek podjetja, ne tržne referenčne mere. [ECB - €STR](https://www.ecb.europa.eu/stats/financial_markets_and_interest_rates/euro-short-term_rate/html/index.en.html), [ECB - Bank interest rates June 2026](https://www.ecb.europa.eu/press/stats/mfi/html/ecb.mir260731~208a979498.en.html)

## 5.7 Transport, dostava in popolno naročilo

### Proces in tveganja

Od konsolidacije pošiljke do dokazila o dostavi: izbor prevoznika, nalepka, dokumenti, naklad, linijski ali paketni prevoz, dostavni termin, neuspel poskus, poškodba, POD in obračun prevoza.

### Perfect order

APQC perfect order obravnava kot sestavljen kazalnik pravilnega naročila, pravočasne in popolne dobave, brez poškodb ter s pravilno dokumentacijo. Sestavljeni kazalnik je strožji od povprečja posameznih odstotkov: naročilo je popolno samo, če izpolni vse kriterije.

$$
Perfect order rate = popolna naročila po vseh kriterijih ÷ vsa naročila
$$

### KPI-ji

- on-time ship in on-time delivery;
- OTIF po kupcu in prevozniku;
- popolnost dokumentacije;
- poškodbe in napačni naslovi na 1.000 pošiljk;
- neuspele in ponovljene dostave;
- ekspresne pošiljke in razlog;
- transportni strošek na pošiljko, kilogram, paleto in EUR prodaje;
- zaračunan delež transporta;
- emisije ali poraba po poti, kjer je relevantno;
- čas od odpreme do knjiženega POD.

### Finančni model

$$
Izogibljiv transport = dodatne ali ponovljene pošiljke × povprečni dodatni strošek
$$

$$
Neto strošek dostave = prevoz + embalaža + manipulacija + doplačila - zaračunan transport kupcu
$$

PanDistro povezuje PANTHEON s ponudniki, kot so Pošta Slovenije, GLS, DPD in Express One, ter omogoča tiskanje nalepk brez ločene prijave v portal prevoznika. Pri preslikavi je treba preveriti dejanskega prevoznika, količino pošiljk in obstoječo integracijo. [Datalab - partner EPAKET in PanDistro](https://www.datalab.si/partnerji/epaket-d-o-o/)

## 5.8 Vračila, reklamacije, RMA, garancije in servis

### Obvezna razmejitev

| Vrsta | Primarni vzrok | Tipični finančni učinek |
|---|---|---|
| komercialno vračilo | dogovor s kupcem, presežek, napačna izbira kupca | obdelava, transport, razvrednotenje |
| odpremna napaka | napačen artikel/količina/naslov | ponovni picking, transport, čas, marža |
| transportna poškodba | embalaža ali prevoz | zamenjava, zahtevek prevozniku, razvrednotenje |
| garancija | napaka izdelka v garanciji | servis, del, zamenjava, povračilo dobavitelja |
| RMA dobavitelju | dobaviteljeva napaka | vezan kapital, prevoz, administracija |
| servis | plačljiva ali pogodbena storitev | čas, material, odziv, first-time-fix |

### Pravilno vrednotenje vračila

$$
Neto izguba vračila = dodatni transport + obdelava + nepovratni stroški + izguba vrednosti + izgubljena marža - povračila dobavitelja/prevoznika
$$

Prodajni dobropis je finančni dokument, ne merilo izgube. Če se blago v celoti vrne na zalogo in ponovno proda, je glavni učinek logistika, čas in morebitna časovna vrednost denarja.

### KPI-ji

- return rate po razlogu, kupcu, artiklu in dobavitelju;
- čas do prvega odziva in čas do zaprtja;
- delež vračil, vrnjenih v prodajo;
- recovery rate od dobaviteljev in prevoznikov;
- warranty cost po seriji/dobavitelju;
- first-time-fix in ponovni servisni obiski;
- odprti RMA kapital in starost.

PANTHEON ima servisne in reklamacijskie funkcionalnosti, Granula Servis na terenu pa povezuje naloge, materiale, čas, lokacije, dokumente in račun. [Datalab - Granula Servis na terenu](https://www.datalab.si/pantheon-granule/granula-servis-na-terenu/)

## 5.9 Fakturiranje, terjatve, kreditno tveganje in izterjava

### Proces

Pravilna in pravočasna faktura je del izpolnitve naročila. Napaka v ceni, davku, referenci, dostavnici ali naročilnici kupca lahko odloži sprejem računa in poveča DSO.

### KPI-ji

| KPI | Formula |
|---|---|
| DSO | povprečne poslovne terjatve ÷ kreditna prodaja × 365 |
| overdue share | zapadle terjatve ÷ vse odprte terjatve |
| bad debt rate | odpisane terjatve ÷ kreditna prodaja |
| invoice first-pass acceptance | računi brez zavrnitve / vsi računi |
| billing lag | dobava/opravljena storitev do izdaje računa |
| collection productivity | obravnavani primeri ali znesek na uro |

### Sprostitev terjatev

$$
Presežne terjatve = kreditna prodaja ÷ 365 × max(dejanski DSO - dosegljivi DSO, 0)
$$

$$
Letni strošek presežnih terjatev = presežne terjatve × financirna stopnja
$$

Dosegljivi DSO ni nujno pogodbeni rok. Del zamude je lahko strukturno vezan na kupce, spor ali javni sektor. Model mora ločiti:

- pogodbeni rok;
- tehnično zamudo zaradi poznega ali napačnega računa;
- vedenjsko zamudo kupca;
- sporne terjatve;
- neizterljive terjatve.

### Pravni kontekst

Direktiva 2011/7/EU ureja zamude pri komercialnih transakcijah, splošno omejuje B2B pogodbene roke na 60 dni, razen če je daljši rok izrecno dogovorjen in ni očitno nepošten, ter predvideva najmanj 40 EUR pavšala za stroške izterjave, ko nastane pravica do zamudnih obresti. [EUR-Lex - Direktiva 2011/7/EU](https://eur-lex.europa.eu/eli/dir/2011/7)

Predpisana slovenska zamudna obrestna mera je regulativna posledica zamude, ne ustrezen nadomestek za dejanski strošek financiranja v ROI modelu. [Banka Slovenije - Temeljna in zamudna obrestna mera](https://www.bsi.si/sl/statistika/obrestne-mere/temeljna-in-zamudna-obrestna-mera)

## 5.10 Računovodstvo, dokumenti in e-poslovanje

### Tipične izgube

- ročni zajem računov in postavk;
- neusklajenost naročilo-prevzem-račun;
- potrjevanje po e-pošti brez roka in lastnika;
- iskanje pogodb, dobavnic in dokazil;
- ročni prenos bančnih izpiskov in odprtih postavk;
- zamujene knjižbe, zaključki in DDV kontrole;
- PDF dokumenti, ki izgledajo digitalno, a niso strukturirani;
- več verzij dokumenta in nejasna revizijska sled.

### Merljivi imenovalci

- prejeti in izdani računi na mesec;
- delež strukturiranih e-računov;
- delež računov s samodejnim zajemom glave in postavk;
- čas od prejema do knjiženja in plačila;
- delež tri-way-match izjem;
- dokumenti za odobritev in povprečen cikel;
- ure iskanja in ponovnega pošiljanja;
- delež bančnih in IOP uskladitev brez ročnega posega.

### E-računi 2028

Od 1. januarja 2028 bo za storitve, opravljene v Sloveniji, obvezna izmenjava strukturiranih e-računov med poslovnimi subjekti, vpisanimi v slovenski poslovni register. PDF sam po sebi ni strukturiran e-račun. [GOV.SI - sprejet Zakon o izmenjavi elektronskih računov](https://www.gov.si/novice/2025-10-23-drzavni-zbor-sprejel-zakon-o-izmenjavi-elektronskih-racunov-in-drugih-elektronskih-dokumentov/)

PANTHEON DMS združuje dokumentno hrambo, eProcese, eIzmenjavo/eRačune ter OCR/AI pripravo knjižb. Prisotnost modula še ne dokazuje avtomatiziranega toka; meriti je treba delež dokumentov, ki dejansko teče brez ponovnega vnosa. [Datalab - PANTHEON DMS](https://www.datalab.si/eposlovanje/pantheon-dms/)

## 5.11 Analitika, marža in upravljanje

### Problem »poročila imamo«

Poročilo, ki nastane 15 dni po koncu meseca ali zahteva ročno združevanje Excela, ne podpira sprotne odločitve o ceni, zalogi ali kreditu. Meriti je treba:

- čas priprave in frekvenco;
- starost podatkov ob odločitvi;
- število ročnih virov in popravkov;
- razlike med poročili oddelkov;
- razpoložljivost marže po kupcu, artiklu in naročilu;
- razpoložljivost zaloge, fill rate, DSO in OTIF;
- dejansko uporabo poročila pri odločitvah.

Eurostat je za 2025 izmeril uporabo BI pri 16,28 % podjetij v EU, precej manj kot ERP (46,45 %). To podpira ločeno merjenje analitične zrelosti. [Eurostat - Digital economy and society statistics, enterprises](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Digital_economy_and_society_statistics_-_enterprises)

Granula Nadzorne plošče omogoča mobilni pregled prodaje, terjatev in drugih kazalnikov; partnerski rešitvi APOLON in Lotus BI sta relevantni pri zahtevnejši analitiki. Učinek je odvisen od kakovosti podatkov, definicij KPI in upravljavskega ritma. [Datalab - Granula Nadzorne plošče](https://www.datalab.si/pantheon-granule/granula-nadzorne-plosce/)

## 5.12 Kadri, delovni čas in sprememba načina dela

### Merljivi procesi

- evidenca delovnega časa, odsotnosti in dopustov;
- razporejanje izmen in sezonskega dela;
- usposabljanje za skladišče, kakovost in varnost;
- obračun nadur in dodatkov;
- čas uvajanja novega skladiščnika;
- fluktuacija in agencijsko delo;
- digitalna navodila in standardni postopki.

### Pomembna ločitev

Sezonske nadure niso nujno procesna izguba. Vprašati je treba, kolikšen delež je posledica normalnega vrha in kolikšen napak, čakanja, slabega planiranja ali podvojenega dela.

$$
Izogibljiv strošek nadur = izogibljive nadure × dejanski dodatek oziroma mejni strošek nadure
$$

Granula Kadri podpira evidenco časa, odsotnosti, dopustov in dostop zaposlenih do kadrovskih podatkov. [Datalab - Granula Kadri](https://www.datalab.si/pantheon-granule/granula-kadri/)

# 6. Horizontalni temelji: podatki, integracije, standardi in varnost

## 6.1 Kakovost matičnih podatkov

Slaba avtomatizacija je pogosto simptom slabih podatkov. Kritični objekti:

| Objekt | Minimalni kontrolni podatki |
|---|---|
| artikel | enota mere, pakiranje, masa/volumen, dobavitelj, DDV, GTIN, status |
| kupec | pravna oseba, naslov dostave, cenik, plačilni rok, kreditni limit |
| dobavitelj | dobavni rok, valuta, MOQ, paket, Incoterms, plačilni pogoji |
| skladišče/lokacija | tip, kapaciteta, režim, status, dovoljen artikel |
| cenik | veljavnost, valuta, pogodba, rabat, hierarhija in odobritev |
| sledljivost | lot, serial, rok, SSCC, izvor in cilj premika |

Diagnostika naj meri podvojene šifre, manjkajoče atribute, ročne popravke in lastništvo podatkov. ERP implementacija brez čiščenja teh objektov pogosto samo pospeši širjenje napak.

## 6.2 GS1 in sledljivost

GS1 Global Traceability Standard razlikuje sledljivost na ravni serije/lota in posamezne serializirane enote. Logistična enota se lahko identificira z edinstvenim SSCC. [GS1 - Global Traceability Standard](https://www.gs1.org/standards/gs1-global-traceability-standard/current-standard), [GS1 - Logistic Label Guideline](https://www.gs1.org/standards/gs1-logistic-label-guideline/current-standard)

Vprašalnik mora ugotoviti:

- ali se lot/serial zajame ob vsakem kritičnem dogodku;
- ali je možen sledljiv odpoklic od dobavitelja do vseh kupcev;
- ali se podatki skenirajo ali tipkajo;
- ali se logistične enote označujejo dosledno;
- koliko časa traja simulacija odpoklica;
- ali se vračilo poveže z izvirno prodajo in serialom.

## 6.3 Integracijska zrelost

| Stopnja | Značilnost | Tipičen simptom |
|---|---|---|
| 0 | papir/telefon/Excel | podatki obstajajo samo pri posamezniku |
| 1 | več digitalnih orodij brez povezave | kopiranje in več resnic |
| 2 | ERP je sistem evidence | veliko ročnih robnih procesov |
| 3 | ključni kanali in skladišče so povezani | izjeme ostajajo ročne, podatki večinoma enotni |
| 4 | EDI/API in dogodkovni tok | skoraj brez ponovnega vnosa, merljivi SLA |
| 5 | optimizacija in napovedovanje | avtomatski predlogi z nadzorom kakovosti |

Leta 2025 je 52,74 % podjetij v EU uporabljalo plačljive oblačne storitve; uporaba je bila precej višja pri velikih kot malih podjetjih. Podatek je koristen kot kontekst, ne kot dokaz, da je cloud sam po sebi učinkovitejši. [Eurostat - Cloud computing in enterprises](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Cloud_computing_-_statistics_on_the_use_by_enterprises)

## 6.4 Informacijska varnost in neprekinjeno poslovanje

ERP, WMS in integracije so operativno kritični. Izpad lahko ustavi prevzem, picking, odpremo in fakturiranje. ZInfV-1 je v Sloveniji začel veljati 19. junija 2025 in prenaša NIS 2; obveznosti veljajo za zavezance po zakonskih merilih, varnostna diagnostika pa je smiselna širše. [GOV.SI - začetek veljavnosti ZInfV-1](https://www.gov.si/novice/2025-06-19-zacetek-veljavnosti-novega-zakona-o-informacijski-varnosti-zinfv-1/)

Minimalna vprašanja:

- koliko ur poslovanje lahko zdrži brez ERP/WMS;
- ali obstaja preizkušen backup in obnovitveni cilj;
- kako se upravljajo uporabniki, vloge in odhodi zaposlenih;
- ali so terminali, integracije in API-ji nadzorovani;
- ali obstaja offline ali krizni postopek za odpremo;
- kdo spremlja napake integracij in neuspele prenose.

# 7. Panožna in regulatorna razvejanja

## 7.1 Živila, pijača in krma

Uredba (ES) 178/2002 zahteva sledljivost hrane, krme in sestavin skozi verigo; izvedbena pravila uporabljajo načelo »en korak nazaj, en korak naprej«. [EUR-Lex - Uredba 178/2002](https://eur-lex.europa.eu/eli/reg/2002/178/oj/eng)

Dinamična vprašanja:

- lot in rok uporabe pri prevzemu in odpremi;
- FEFO in minimalni preostali rok za kupca;
- temperaturni režim in odkloni;
- odpoklic in čas do seznama vseh kupcev;
- vračljiva embalaža, kavcije in saldo;
- odpisi po razlogu ter prodaja s popustom pred iztekom.

## 7.2 Zdravila in medicinski pripomočki

Farmacevtska distribucija vključuje GDP, varnostne elemente in preverjanje serializiranih pakiranj. EMA navaja, da morajo veletrgovci glede na izvor zdravilo na določenih točkah skenirati in preveriti avtentičnost. [EMA - Falsified medicines overview](https://www.ema.europa.eu/en/human-regulatory-overview/public-health-threats/falsified-medicines-overview)

MDR/IVDR uvajata UDI za sledljivost medicinskih pripomočkov; od 28. maja 2026 je uporaba določenih modulov EUDAMED obvezna. [Evropska komisija - UDI/Device registration](https://health.ec.europa.eu/medical-devices/eudamed/udidevice-registration_en)

Kalkulator na tem področju ne monetizira skladnosti s pavšalnim odstotkom. Prikaže izpostavljenost, čas procesov, napake in stroške konkretnih incidentov.

## 7.3 Kemikalije in nevarno blago

ADR 2025 ureja mednarodni cestni prevoz nevarnega blaga. [UNECE - ADR 2025](https://unece.org/adr-2025-files)

Razvejanja:

- nevarnostni razred, združljivost lokacij in količinske omejitve;
- varnostni listi in verzije;
- usposobljenost in dokumentacija prevoza;
- posebna embalaža in etikete;
- incidenti, zavrnjene pošiljke in izredni prevozi.

## 7.4 Embalaža in PPWR

Uredba (EU) 2025/40 o embalaži in odpadni embalaži se uporablja od 12. avgusta 2026, posamezne določbe pa imajo lastne roke. [EUR-Lex - Packaging and packaging waste from 2026](https://eur-lex.europa.eu/EN/legal-content/summary/packaging-and-packaging-waste-from-2026.html)

Za distributerje so relevantni podatki o vrsti in masi embalaže, ponovni uporabi, vračljivi transportni embalaži in poročanju. Kalkulator naj vpraša po tem samo, kadar podjetje daje embalirano blago na trg ali upravlja vračljivo embalažo.

## 7.5 Uvozniki CBAM in EUDR blaga

CBAM je od 1. januarja 2026 v definitivnem režimu za zadevno blago in uvoznike. EUDR ima po spremembah in aktualnih pojasnilih roke, ki so odvisni od vrste in velikosti subjekta. Ta področja zahtevajo ločeno preverjanje konkretnega blaga, carinskih oznak in statusa subjekta; splošni vprašalnik lahko samo odpre regulatorno vejo, ne da pravnega zaključka.

# 8. Knjižnica KPI-jev in formul

## 8.1 Prodaja in naročila

| KPI | Formula | Potrebni podatki | Glavno opozorilo |
|---|---|---|---|
| digital order rate | digitalne vrstice / vse vrstice | kanal na vrstici | e-pošta s PDF ni strukturiran tok |
| order entry time | ure vnosa / naročila ali vrstice | čas in obseg | loči prvi vnos od podvojenega |
| order error rate | popravljene vrstice / vse vrstice | razlog popravka | popravek pred potrditvijo ni nujno izguba |
| quote conversion | dobljene ponudbe / zaključene ponudbe | status in razlog | ne monetiziraj brez vzroka |
| price override rate | ročne spremembe cen / vrstice | cena in uporabnik | override je lahko upravičen |

## 8.2 Nabava

| KPI | Formula | Potrebni podatki | Glavno opozorilo |
|---|---|---|---|
| supplier OTD | pravočasne dobave / vse dobave | zahtevani in dejanski datum | definicija tolerance mora biti enaka |
| supplier OTIF | pravočasne in popolne / vse | datum in količina | delna dobava ni popolna |
| purchase price variance | dejanska - referenčna cena | standard/pogodba in račun | valuta in rabati |
| urgent PO rate | nujna PO / vse PO | razlog naročila | sezonska nuja ni nujno napaka |
| lost discount | upravičeni neizkoriščeni skonti | pogoji in plačilo | upoštevaj strošek zgodnejšega denarja |

## 8.3 Zaloga in skladišče

| KPI | Formula | Potrebni podatki | Glavno opozorilo |
|---|---|---|---|
| DIO | povprečna zaloga / (COGS/365) | zaloga in COGS | vrednosti morajo biti na isti osnovi |
| inventory turns | COGS / povprečna zaloga | mesečna povprečja | konec leta je lahko nereprezentativen |
| stock accuracy | pravilne lokacije/SKU / preverjene | ciklični popis | količinska in lokacijska natančnost ločeno |
| aged stock share | stara zaloga / vsa zaloga | zadnja prodaja in vrednost | prag prilagodi segmentu |
| pick productivity | vrstice / delovne ure | potrjene vrstice in neposredni čas | kompleksnost vrstic se razlikuje |
| pick accuracy | pravilne vrstice / vse | kontrola in reklamacije | zajemi tudi napake odkrite pred odpremo |

## 8.4 Storitev in logistika

| KPI | Formula | Potrebni podatki | Glavno opozorilo |
|---|---|---|---|
| line fill rate | takoj izpolnjene vrstice / vse | zahtevana in dobavljena količina | backorder ni takojšnja izpolnitev |
| OTIF | pravočasne in popolne dobave / vse | zahtevan datum in količina | loči ship in delivery |
| perfect order | naročila brez katerekoli napake / vsa | čas, količina, poškodba, dokument | ne uporabljaj povprečja komponent |
| transport per order | neto transport / naročila | računi prevoznika in zaračunano kupcu | loči paket, paleto in lastno dostavo |
| return rate | vrnjene enote ali vrednost / prodaja | razlog in vrednost | več imenovalcev za različne namene |

## 8.5 Finance

| KPI | Formula | Potrebni podatki | Glavno opozorilo |
|---|---|---|---|
| DSO | povprečne terjatve / kreditna prodaja × 365 | kreditna prodaja | celotni prihodek lahko preceni imenovalec |
| DPO | povprečne obveznosti / kreditna nabava × 365 | kreditna nabava | dosledna osnova |
| CCC | DIO + DSO - DPO | trije dnevi | ni neposredni strošek |
| bad debt rate | odpisi / kreditna prodaja | odpisi | loči DDV in povračila |
| gross margin | (prihodek - COGS) / prihodek | prihodek, COGS | ni enako prispevni marži |
| net contribution | marža - cost-to-serve | stroški po aktivnosti | ne uporabljaj navidezne natančnosti brez podatkov |

# 9. Finančna arhitektura računskega jedra

## 9.1 Osnovni objekt: merjena izguba

Vsaka postavka mora imeti:

- enolični `loss_id`;
- proces in podproces;
- vrsto učinka;
- količino, frekvenco, enoto in ceno;
- obdobje ter normalizacijo na leto;
- izvor podatka in zanesljivost;
- glavni vzrok;
- delež, ki ga rešitev pokriva;
- mehanizem realizacije;
- povezave na druge postavke za preprečevanje podvajanja.

## 9.2 Izračun sedanje izpostavljenosti

$$
Izmerjena letna izguba = letna količina dogodkov × povprečni neto strošek dogodka
$$

Za čas:

$$
Vrednost kapacitete = mesečne ure × 12 × polni strošek ustrezne vloge
$$

Za intervalne vnose se celoten interval prenaša skozi model:

$$
[L, H] × pozitivna konstanta k = [L×k, H×k]
$$

Ni dovoljeno skrito uporabiti sredine in uporabniku prikazati navidezno natančen znesek.

## 9.3 Naslovljivost

$$
Realistična korist = izmerjena izguba × obvladljivost vzroka × pokritost rešitve × pričakovana uporaba
$$

Vsak faktor je interval in mora biti razložljiv:

| Faktor | Vprašanje |
|---|---|
| obvladljivost | koliko posledice je sploh pod nadzorom podjetja? |
| pokritost rešitve | ali predlagana konfiguracija naslavlja ta korak? |
| uporaba | kolikšen delež ljudi in transakcij bo dejansko delal po novem? |

Začetni razredi so lahko konservativni intervali, vendar jih je treba po prvih implementacijah kalibrirati z dejanskimi podatki. Navidezno znanstveni fiksni odstotki brez empirične osnove niso dovoljeni.

## 9.4 Kapaciteta in realizacija

| Mehanizem | Denarni učinek | Dokaz |
|---|---|---|
| manj nadur | dejanski izognjeni dodatki/stroški | obračun pred in po |
| manj zunanjih storitev | zmanjšan račun dobavitelja | pogodba in računi |
| preprečena zaposlitev | časovno odložena potreba × strošek | potrjen plan zaposlovanja in rast obsega |
| več prodaje z isto ekipo | dodatna realizirana prispevna marža | kapaciteta + povpraševanje + realizacija |
| prerazporeditev | vrednost novega dela | dokazljiv rezultat, ne samo namen |

## 9.5 Stroški uvedbe

| Skupina | Primeri |
|---|---|
| enkratni zunanji | analiza, konfiguracija, migracija, integracije, razvoj, izobraževanje |
| enkratni interni | procesni lastniki, čiščenje podatkov, testiranje, superuporabniki |
| oprema | terminali, čitalci, tiskalniki, Wi-Fi, strežnik |
| tekoči | licence, gostovanje, podpora, vzdrževanje integracij |
| prehodni | dvojno delo, padec produktivnosti, inventura, začasna pomoč |
| tveganjska rezerva | obseg neznank in kompleksnost integracij |

## 9.6 Časovna krivulja koristi

Prvo leto se ne sme računati kot dvanajst mesecev polne koristi. Model potrebuje:

- mesece do zagona;
- fazno uvajanje po skladiščih ali procesih;
- ramp-up uporabe;
- sezonskost;
- stabilizacijo in odpravo napak.

Primer najverjetnejše krivulje po zagonu: 30 %, 50 %, 70 %, 85 % in nato 90 % stabilnega potenciala. To ni univerzalni default, ampak oblika, ki jo uporabnik ali svetovalec prilagodi.

## 9.7 ROI, payback in NPV

$$
Payback v mesecih = začetna investicija ÷ (mesečna realizirana korist - mesečni tekoči strošek)
$$

$$
ROI_3L = (koristi v 3 letih - stroški v 3 letih) ÷ stroški v 3 letih
$$

$$
NPV = -I0 + vsota od t=1 do n [(B_t - C_t) ÷ (1+r)^t]
$$

Sprostitev kapitala vstopi v denarni tok v obdobju realizacije, ne kot ponavljajoča letna korist.

## 9.8 Scenariji

| Scenarij | Vhodi |
|---|---|
| konservativni | spodnja izguba, nizka obvladljivost, počasna uporaba, višji stroški |
| najverjetnejši | najbolj podprta ocena, realna uporaba in plan uvedbe |
| polni potencial | zgornja izguba in dobra izvedba; jasno označeno kot potencial |

# 10. Zanesljivost, pokritost in negotovost

## 10.1 Izvor podatka

| Razred | Izvor | Teža za zanesljivost |
|---|---|---:|
| A | ERP, glavna knjiga, WMS, račun ali časovni zapis | 1,00 |
| B | izračun iz količine in izmerjenega časa na vzorcu | 0,80 |
| C | odgovorna ocena ali interval uporabnika | 0,50 |
| D | splošna predpostavka | 0,25 |

Teže niso diskont koristi. So komunikacijski signal o kakovosti dokazov. Koristi in negotovost se računajo z intervali, zanesljivost pa se prikaže ločeno.

## 10.2 Dve oceni, ne ena

- **Zanesljivost podatkov:** koliko rezultata temelji na dejanskih evidencah.
- **Pokritost podjetja:** kolikšen delež relevantnih procesov je bil sploh izmerjen.

Če uporabnik podrobno obdela tri od dvanajstih področij, je lahko zanesljivost teh treh visoka, pokritost podjetja pa nizka. Pravilna oznaka rezultata:

> Izmerjeni strošek izbranih področij - konservativna spodnja meja, ne celotni strošek sedanjega načina dela.

## 10.3 Občutljivost

Rezultat naj pokaže tri najvplivnejše predpostavke. Če 70 % koristi izhaja iz ocenjenega znižanja zaloge, mora uporabnik to videti in dobiti navodilo, katere podatke naj preveri.

# 11. Priporočena arhitektura vprašalnika

## 11.1 Načelo progresivnega razkrivanja

Globina naj sledi informacijski vrednosti. Uporabnik naj najprej opredeli model in obseg, nato hitro oceni vsa področja, podrobno pa izmeri najpomembnejša. Kalkulator mora omogočiti razširitev na celoten poslovni primer.

## 11.2 Predlagani koraki

| Korak | Vsebina | Namen |
|---|---|---|
| 1 | dejavnost, poslovni model, vrsta blaga | pravilno razvejanje |
| 2 | velikost, SKU, naročila, skladišča, uvoz | normalizacija in validacije |
| 3 | kanali, dostava, sledljivost, sezonskost | profil kompleksnosti |
| 4 | hitra triaža 12 področij | izbor najpomembnejših |
| 5 | skupna finančna osnova | enotni imenovalci in urne postavke |
| 6 | podrobna meritev izbranih področij | dokazljive izgube |
| 7 | vzroki, zrelost in naslovljivost | realistični potencial |
| 8 | obseg rešitve in uvedbe | investicija in čas |
| 9 | rezultat in podatkovni načrt | poslovni primer in naslednji korak |

## 11.3 Dvanajst triažnih področij

1. prodajna naročila, ponudbe, ceniki in rabati;
2. nabava, dobavitelji in uvoz;
3. prevzem in skladiščenje;
4. komisioniranje, pakiranje in inventure;
5. planiranje zalog, nekurantnost in izpad prodaje;
6. odprema, transport in kakovost dostave;
7. vračila, reklamacije, RMA in servis;
8. terjatve, kreditni limiti in izterjava;
9. marža, cost-to-serve in analitika;
10. računovodstvo in finance;
11. dokumentacija, EDI in e-poslovanje;
12. kadri, delovni čas in procesna disciplina.

Sledljivost, podatki, integracije in varnost so horizontalna diagnostika. Pri reguliranem blagu postanejo polna področja.

## 11.4 Triaža brez pristranskosti

Sistem izbere področja z največjo sestavljeno prioriteto:

$$
Prioriteta = intenzivnost bolečine × izpostavljenost obsega × strateška pomembnost × kakovost podatkovnega signala
$$

Uporabnik lahko izbor spremeni. Nobena področja ne smejo biti fiksno predizbrana samo zato, ker so tipična za panogo.

## 11.5 Dva načina vnosa

Pri vsaki težko ocenljivi izgubi:

1. **Poznam skupni letni znesek.**
2. **Pomagajte mi ga izračunati.**

Drugi način uporablja obseg, stopnjo dogodkov in neto strošek dogodka. Sistem pokaže izpeljavo in uporabniku dovoli popravek.

## 11.6 Skupna finančna osnova

Minimalni vhodi:

- letni prihodki in kreditna prodaja;
- COGS oziroma nabavna vrednost prodanega blaga;
- povprečna zaloga in terjatve;
- bruto in po možnosti prispevna marža;
- dejanska financirna stopnja;
- polni strošek skladiščne, administrativne, komercialne in vodstvene ure;
- zaposleni po oddelkih in produktivne ure;
- število naročilnih vrstic, dobav in pošiljk.

## 11.7 Kratek osnovni in razširjeni način

| Način | Trajanje | Rezultat |
|---|---:|---|
| hitri diagnostični | 8-12 minut | spodnja meja 2-3 področij, brez pravega ROI |
| razširjeni poslovni primer | 25-45 minut | več področij, investicija, scenariji in ROI |
| validiran svetovalni | podatkovni izvoz + delavnica | preverjeni baseline, roadmap in merilni plan |

# 12. Vprašanja z visoko informacijsko vrednostjo

## 12.1 Profil podjetja

- Kateri poslovni model najbolje opisuje podjetje?
- Katere skupine blaga ustvarijo največ prihodka in marže?
- Koliko aktivnih SKU-jev je bilo prodanih v zadnjih 12 mesecih?
- Koliko kupcev, dostavnih naslovov in dobaviteljev je aktivnih?
- Koliko prodajnih/nabavnih vrstic in pošiljk nastane mesečno?
- Koliko skladišč, con in lokacij uporabljate?
- Kolikšen delež blaga uvažate izven EU in v drugih valutah?
- Kakšna je sezonskost in razmerje vrh/povprečje?

## 12.2 Tehnologija in uporaba

- Kateri sistemi hranijo glavno resnico za artikel, ceno, zalogo in kupca?
- Kolikšen delež naročil, dobavnic in računov je strukturiran?
- Kje se isti podatek prepiše več kot enkrat?
- Ali skladišče potrjuje lokacijo, artikel, količino in lot/serial s skeniranjem?
- Katere integracije zahtevajo dnevno ročno kontrolo?
- Koliko neuspelih prenosov ali sinhronizacij nastane mesečno?
- Kateri procesi so funkcionalno na voljo, vendar jih ekipa ne uporablja?

## 12.3 Finančna realizacija

- Ali sproščen čas zmanjša nadure, zunanji strošek ali potrebo po zaposlitvi?
- Ali obstaja dovolj povpraševanja za dodatno prodajo z isto ekipo?
- Katera zaloga je dejansko naslovljiva brez poslabšanja ravni storitve?
- Kolikšen del zamude plačil je posledica procesov podjetja?
- Kateri stroški uvedbe in notranje ure bodo potrebni?
- Kdaj bo proces v stabilni uporabi?

# 13. Validacije in preprečevanje dvojnega štetja

## 13.1 Matematične validacije

- ročni deleži in stopnje napak med 0 in 100 %;
- napačne vrstice ne presegajo vseh vrstic;
- izgubljena marža ne presega dosegljive celotne prispevne marže;
- odpisi in starostna zaloga so sorazmerni z zalogo in COGS;
- terjatve, vračila in dobropisi ne presegajo relevantne prodaje;
- ure oddelka ne presegajo realne kapacitete zaposlenih;
- DSO, DIO in DPO uporabljajo skladne letne tokove in povprečna stanja;
- investicijski stroški niso negativni, življenjska doba in diskont pa sta smiselna.

Neobičajen vnos naj sproži opozorilo in potrditev, ne nujno blokade.

## 13.2 Pravila podvajanja

| Dogodek | Primarno mesto monetizacije | Ne podvajaj v |
|---|---|---|
| napačna cena na računu | izgubljena marža ali čas popravka | dobropisi in reklamacije še enkrat |
| stockout zaradi dobavitelja | izgubljena marža v zalogi | nabava kot drugi znesek |
| napačna pošiljka | logistika/vračilo | skladiščna napaka kot polni isti strošek |
| nadura zaradi ponovnega dela | dejanski strošek nadure | polna urna kapaciteta iste ure |
| vrnjeno in ponovno prodano blago | neto obdelava/razvrednotenje | celotna prodajna vrednost dobropisa |
| sprostitev zaloge | enkratni kapital | letni prihranek v isti višini |
| odpisi terjatev | neposredni strošek | DSO financirni strošek iste glavnice po odpisu |

## 13.3 Identifikatorji dogodkov

Za razvoj je priporočljivo, da povezane postavke delijo `event_family_id`. Tako model ve, da so čas popravka, dodatni prevoz in dobropis deli iste napačne pošiljke, vendar različne neto posledice.

# 14. Preslikava bolečin na ekosistem Datalaba

## 14.1 Načelo preslikave

Uporabnik ne izbira licence. Najprej se ugotovi proces, vzrok, obseg in zahtevana zmožnost. Šele nato se v ozadju sestavi možna konfiguracija ter preveri pri prodajnem ali implementacijskem strokovnjaku.

| Izmerjena potreba | Možna zmožnost/rešitev | Dokaz, ki ga je treba pridobiti |
|---|---|---|
| strukturirano B2B naročanje | Granula B2B, EDI, API | delež kupcev in vrstic, pripravljenih za kanal |
| spletna naročila brez prepisa | PanStore/API | platforma, kompleksnost cen in zalog |
| skladiščne lokacije in skeniranje | PANTHEON skladišče, PanScan | lokacijski model, naprave, Wi-Fi, proces |
| hitrejša inventura | Granula Inventura skladišč | trenutne ure, frekvenca, število SKU/lokacij |
| serije, loti in roki | PANTHEON sledljivost | stopnja zajema in regulatorne zahteve |
| nalepke in prevozniki | PanDistro ali druga integracija | prevozniki, pošiljke, doplačila in izjeme |
| dokumenti, OCR in odobritve | DMS, eKnjižbe, eProcesi | dokumenti/mesec, ročni delež, cikel |
| e-računi in e-dokumenti | eIzmenjava/eRačun | partnerji, formati in 2028 pripravljenost |
| terjatve in opomini | saldakonti, eSporočanje, nadzorne plošče | DSO, opomini, razlogi zamud |
| marža in upravljanje | Nadzorne plošče, APOLON, Lotus BI | definicija marže, podatkovna kakovost |
| servis in terensko delo | Servis, Granula Servis na terenu | nalogi, tehniki, materiali, first-time-fix |
| kadri in čas | Kadri, Granula Kadri | zaposleni, evidence, odobritve, obračun |

## 14.2 Česa se ne sme obljubiti avtomatično

- da bo ERP sam znižal zalogo;
- da bo vsaka sproščena ura denarni prihranek;
- da bo uvedba odpravila dobaviteljske zamude ali plačilno nedisciplino;
- da bo integracija možna brez preverjanja API-ja in lastništva sistemov;
- da je določena funkcionalnost vključena v vsako licenco;
- da je regulatorna skladnost zagotovljena samo z nakupom modula.

## 14.3 Implementacijski discovery

Pred ponudbo je treba potrditi:

- pravne osebe, uporabnike in vloge;
- skladišča, lokacije, artikle, lote in seriale;
- kanale in integracije;
- migracijo odprtih dokumentov in zgodovine;
- naprave, etikete in omrežje;
- poročila, odobritve in pravice;
- regulatorne posebnosti;
- obseg izobraževanja in podpore;
- pilot, cutover, inventuro in stabilizacijo.

# 15. Predlagani rezultat za uporabnika

## 15.1 Kartice rezultata

1. dokazani neposredni letni stroški;
2. vrednost izgubljene kapacitete in delež FTE;
3. dokazljiva izgubljena prispevna marža;
4. potencialna sprostitev zaloge;
5. potencialna sprostitev terjatev;
6. letni strošek financiranja presežnega kapitala;
7. konservativni letni potencial izboljšave;
8. ocenjeni enkratni in tekoči stroški uvedbe;
9. čas do zagona in krivulja uporabe;
10. payback, triletni ROI in NPV po scenarijih;
11. zanesljivost in pokritost;
12. tri največje izmerjene izgube in njihovi vzroki;
13. področja, ki niso bila izmerjena;
14. seznam podatkov za validacijo;
15. možna funkcionalna preslikava brez avtomatične obljube.

## 15.2 Normalizirani kazalniki

Poleg EUR je treba pokazati:

- strošek kot delež prihodkov in bruto/prispevne marže;
- ure kot delež enega FTE;
- DIO, DSO in CCC;
- napake na 1.000 vrstic ali pošiljk;
- strošek na naročilo, vrstico in pošiljko;
- perfect order, fill rate in OTIF;
- zalogo po starostnih skupinah.

## 15.3 Priporočeni jezik

Uporabljaj:

- »izmerjena spodnja meja«;
- »potencial izboljšave ob navedenih predpostavkah«;
- »enkratna sprostitev kapitala«;
- »vrednost kapacitete, ne avtomatični prihranek plač«;
- »scenarij, ki ga je treba potrditi z izvozom podatkov«.

Ne uporabljaj:

- »zagotovljen prihranek«;
- »vaše podjetje izgublja natančno X«, kadar prevladujejo ocene;
- »ERP bo odpravil X«;
- »celotni strošek podjetja«, kadar je pokritih le nekaj področij.

# 16. Kalibracija in merjenje dejanskega učinka

## 16.1 Pred prvimi rezultati

- test razumevanja vprašanj z direktorjem, komercialistom, nabavnikom, skladiščnikom in financami;
- primerjava odgovorov različnih vlog iz istega podjetja;
- preverjanje, ali uporabniki zlahka ločijo naročila, vrstice, pošiljke in dogodke;
- preverjanje intervalov in opozoril na ekstremne vrednosti;
- ročni ponovni izračun vseh formul na sintetičnih primerih.

## 16.2 Po prvih 50 primerih

Pri podvzorcu pridobi:

- odgovor uporabnika;
- izvoz ERP/računovodskih podatkov;
- potrjeni baseline;
- konfiguracijo in stroške uvedbe;
- meritve 3, 6 in 12 mesecev po zagonu;
- dejansko realiziran mehanizem koristi.

Ne kalibriraj samo na pogostost odgovorov. Pogost odgovor je lahko sistematično pristranska ocena.

## 16.3 Merilni načrt pred in po

| KPI | Baseline | Stabilizacija | 3 mesece | 6 mesecev | 12 mesecev |
|---|---|---|---|---|---|
| ročni delež naročil | da | da | da | da | da |
| vrstice/uro | da | da | da | da | da |
| pick accuracy | da | da | da | da | da |
| OTIF/perfect order | da | da | da | da | da |
| DIO in aged stock | da | - | da | da | da |
| DSO in overdue | da | - | da | da | da |
| nadure in zunanji stroški | da | da | da | da | da |
| stopnja uporabe novega procesa | - | da | da | da | da |

## 16.4 Vzročnost

Sprememba KPI po uvedbi ni nujno učinek sistema. V istem času se lahko spremenijo prodaja, asortiment, dobavitelji, sezona ali ekipa. Zato poročilo zabeleži:

- primerljivo obdobje prejšnjega leta;
- obseg transakcij in kompleksnost;
- druge sočasne spremembe;
- razliko med pilotno in kontrolno lokacijo, kjer je izvedljivo;
- datum dejanske, ne formalne uporabe.

# 17. Prednostni izvedbeni načrt

## Faza 1 - metodološko pravilno jedro

1. Uvedi pet vrst ekonomskega učinka.
2. Dodaj nabavo, dobavitelje, uvoz in landed cost.
3. Razdeli skladišče na prevzem, lokacije ter picking/inventure.
4. Uvedi perfect order, fill rate, DIO, DSO in prispevno maržo.
5. Popravi vračila, dobropise, nadure in sprostitev kapitala.
6. Uvedi izvor podatka, intervale, pokritost in zanesljivost.
7. Dodaj pravila podvajanja in avtomatske validacije.

## Faza 2 - dinamični vprašalnik

1. Segmentiraj poslovni model, blago, izpolnitev in regulatoriko.
2. Izbiraj podrobna področja iz triaže in izpostavljenosti.
3. Dodaj način »pomagajte mi izračunati«.
4. Uvedi kratki in razširjeni način.
5. Dodaj seznam neizmerjenih področij in podatkovni načrt.

## Faza 3 - pravi poslovni primer

1. Modeliraj obseg rešitve, integracije, migracijo, opremo in interno delo.
2. Dodaj ramp-up in časovni denarni tok.
3. Izračunaj payback, triletni ROI in NPV v treh scenarijih.
4. Uvedi odobritev predpostavk s strani svetovalca.

## Faza 4 - empirična kalibracija

1. Poveži baseline in post-implementation meritve.
2. Kalibriraj naslovljive intervale po segmentu in tipu vzroka.
3. Loči učinek funkcionalnosti od kakovosti implementacije in uporabe.
4. Objavi benchmarke samo za dovolj primerljive in dovolj velike vzorce.

# 18. Sklep

Najboljši veleprodajni ROI-kalkulator ne bo tisti z največ vprašanji, temveč tisti, ki pravilno modelira poslovno ekonomiko in ob vsakem znesku pokaže njegovo poreklo. Veleprodaja potrebuje ravnotežje med maržo, storitvijo in kapitalom. Zato mora biti vprašalnik dovolj širok, da ne spregleda nabave, zaloge, transporta in terjatev, ter dovolj discipliniran, da ne sešteva prihodkov, ur, glavnice in tveganj v eno številko.

Če se predlagani model dosledno izvede, rezultat ne bo samo lead magnet. Lahko postane strukturiran discovery, podatkovni načrt, kvalifikacija priložnosti in osnova za merljiv poslovni primer digitalizacije z rešitvami Datalaba.

# 19. Izbrani viri

## Uradna statistika in digitalizacija

- [SURS - Trgovina na drobno in na debelo, posredništvo, 2024](https://www.stat.si/StatWeb/News/Index/13757)
- [Eurostat - Businesses in distributive trade sector](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Businesses_in_distributive_trade_sector)
- [Eurostat - E-business integration](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=E-business_integration)
- [Eurostat - E-commerce statistics](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=E-commerce_statistics)
- [Eurostat - Cloud computing in enterprises](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Cloud_computing_-_statistics_on_the_use_by_enterprises)
- [Eurostat - Digital economy and society statistics, enterprises](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Digital_economy_and_society_statistics_-_enterprises)

## Procesi, KPI-ji in standardi

- [ASCM - SCOR Digital Standard](https://www.ascm.org/corporate-solutions/standards-tools/scor-ds/)
- [ASCM - SCOR Quick Reference Guide](https://www.ascm.org/globalassets/ascm_website_assets/docs/scor/scor-ds-digital-guide_final.pdf)
- [APQC - Perfect order performance](https://www.apqc.org/resources/benchmarking/open-standards-benchmarking/measures/perfect-order-performance)
- [APQC - Total inventory days of supply](https://www.apqc.org/resources/benchmarking/open-standards-benchmarking/measures/inventory-days-supply)
- [APQC - Supplier on-time delivery](https://www.apqc.org/what-we-do/benchmarking/open-standards-benchmarking/measures/percentage-supplier-time-delivery)
- [APQC - Open Standards Benchmarking Glossary](https://www.apqc.org/sites/default/files/files/Glossary_5-13.pdf)
- [GS1 - Global Traceability Standard](https://www.gs1.org/standards/gs1-global-traceability-standard/current-standard)
- [GS1 - Logistic Label Guideline](https://www.gs1.org/standards/gs1-logistic-label-guideline/current-standard)
- [GS1 Slovenija - EDI](https://www.gs1si.org/standardi/izmenjava-podatkov/gs1-edi)
- [GS1 Slovenija - Elektronska dobavnica](https://www.gs1si.org/panoge/logistika-transport/elektronska-dobavnica)
- [De Koster, Le-Duc in Roodbergen - Design and control of warehouse order picking](https://repub.eur.nl/pub/11877/)
- [IFRS Foundation - IAS 2 Inventories](https://www.ifrs.org/issued-standards/list-of-standards/ias-2-inventories/)

## Regulatorni in finančni viri

- [GOV.SI - Zakon o izmenjavi elektronskih računov](https://www.gov.si/novice/2025-10-23-drzavni-zbor-sprejel-zakon-o-izmenjavi-elektronskih-racunov-in-drugih-elektronskih-dokumentov/)
- [EUR-Lex - Direktiva 2011/7/EU o zamudah pri plačilih](https://eur-lex.europa.eu/eli/dir/2011/7)
- [Banka Slovenije - Temeljna in zamudna obrestna mera](https://www.bsi.si/sl/statistika/obrestne-mere/temeljna-in-zamudna-obrestna-mera)
- [ECB - Euro short-term rate](https://www.ecb.europa.eu/stats/financial_markets_and_interest_rates/euro-short-term_rate/html/index.en.html)
- [FURS - Carinska vrednost blaga](https://www.fu.gov.si/carina/podrocja/carinska_vrednost_blaga/)
- [Evropska komisija - CBAM definitive regime](https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/cbam-definitive-regime_en)
- [GOV.SI - ZInfV-1](https://www.gov.si/novice/2025-06-19-zacetek-veljavnosti-novega-zakona-o-informacijski-varnosti-zinfv-1/)
- [EUR-Lex - Packaging and packaging waste from 2026](https://eur-lex.europa.eu/EN/legal-content/summary/packaging-and-packaging-waste-from-2026.html)
- [EUR-Lex - Uredba 178/2002 o splošni živilski zakonodaji](https://eur-lex.europa.eu/eli/reg/2002/178/oj/eng)
- [EMA - Falsified medicines overview](https://www.ema.europa.eu/en/human-regulatory-overview/public-health-threats/falsified-medicines-overview)
- [Evropska komisija - UDI/Device registration](https://health.ec.europa.eu/medical-devices/eudamed/udidevice-registration_en)
- [UNECE - ADR 2025](https://unece.org/adr-2025-files)

## Datalab in PANTHEON

- [Datalab - PANTHEON Enterprise](https://www.datalab.si/pantheon/enterprise/)
- [Datalab - Poslovni program za veleprodajo](https://www.datalab.si/poslovni-program-za-veleprodajo/)
- [Datalab - Tržnica dodatnih rešitev](https://www.datalab.si/dodatne-resitve/)
- [Datalab - PANTHEON DMS](https://www.datalab.si/eposlovanje/pantheon-dms/)
- [Datalab - Granula B2B naročanje](https://www.datalab.si/pantheon-granule/b2b-narocanje/)
- [Datalab - Granula Inventura skladišč](https://www.datalab.si/pantheon-granule/granula-inventura-skladisc/)
- [Datalab - Granula Servis na terenu](https://www.datalab.si/pantheon-granule/granula-servis-na-terenu/)
- [Datalab - Granula Nadzorne plošče](https://www.datalab.si/pantheon-granule/granula-nadzorne-plosce/)
- [Datalab - partner EPAKET: PanScan, PanStore in PanDistro](https://www.datalab.si/partnerji/epaket-d-o-o/)

# Dodatek A: podatkovni slovar za implementacijo

| Polje | Tip | Enota | Obdobje | Obvezno | Izvor |
|---|---|---|---|---|---|
| revenue_total | decimal | EUR | 12 mesecev | da | izkaz/ERP |
| credit_sales | decimal | EUR | 12 mesecev | za DSO | ERP |
| cogs | decimal | EUR | 12 mesecev | za DIO | glavna knjiga |
| avg_inventory | decimal | EUR nabavne vrednosti | 12-mesečno povprečje | za zalogo | mesečna stanja |
| avg_receivables | decimal | EUR | 12-mesečno povprečje | za DSO | saldakonti |
| contribution_margin | decimal | % | 12 mesecev | priporočeno | kontroling |
| financing_rate | decimal | % letno | aktualno | za kapital | pogodba/finance |
| sales_order_lines | integer | vrstice/mesec | tipični mesec | da | ERP |
| purchase_order_lines | integer | vrstice/mesec | tipični mesec | za nabavo | ERP |
| shipments | integer | pošiljke/mesec | tipični mesec | za logistiko | ERP/TMS |
| sku_active | integer | SKU | 12 mesecev | da | ERP |
| warehouse_fte | decimal | FTE | aktualno | validacija | HR |
| labor_cost_warehouse | decimal | EUR/uro | aktualno | za čas | finance/HR |
| data_source_class | enum | A-D | vsak vnos | da | uporabnik/sistem |

# Dodatek B: primer registracije ene izgube

| Element | Primer |
|---|---|
| loss_id | WH-PICK-ERROR-001 |
| proces | komisioniranje |
| dogodek | napačen artikel odpremljen kupcu |
| letni obseg | 96 dogodkov |
| neto strošek dogodka | 74-118 EUR |
| neposredna izguba | 7.104-11.328 EUR/leto |
| dodatni čas | 2,1 ure/dogodek |
| vzrok | papirni picking + podobna embalaža |
| obvladljivost | srednja-visoka |
| pokritost | skeniranje artikla in lokacije |
| mehanizem realizacije | manj dodatnega transporta in nadur |
| podvajanje | povezano z dobropisom in vračilom istega dogodka |
| zanesljivost | B, izvoz reklamacij + vzorec časa |

# Dodatek C: kontrolni seznam pred objavo kalkulatorja

- [ ] Vsi zneski so označeni kot letni, enkratni ali tveganjski.
- [ ] Prihodki, dobropisi in glavnica se ne obravnavajo avtomatično kot strošek.
- [ ] Čas ima ločen mehanizem denarne realizacije.
- [ ] Zaloga in terjatve se prikazujejo kot sprostljiv kapital, ne letni prihranek.
- [ ] Prispevna marža se uporablja pri izgubljeni prodaji.
- [ ] Vračila upoštevajo ponovno prodajo in povračila.
- [ ] Nadure uporabljajo dejanski dodatni strošek.
- [ ] Vsak vnos ima izvor in interval, kjer je potreben.
- [ ] Pokritost in zanesljivost sta ločeni.
- [ ] Triaža izbira področja dinamično.
- [ ] Uporabnik vidi neizmerjena področja.
- [ ] ROI vsebuje investicijo, tekoče stroške, ramp-up in čas.
- [ ] Vse regulatorne veje so pogojne, ne univerzalne.
- [ ] Funkcionalna preslikava je preverljiva in ne obljublja učinka brez dokazov.
- [ ] Vsi ekstremni vnosi sprožijo opozorilo in potrditev.

# Dodatek D: podrobna specifikacija vprašanj po modulih

Naslednja banka ni namenjena prikazu vseh vprašanj vsakemu obiskovalcu. Je vsebinski register, iz katerega dinamični vprašalnik izbere relevantne postavke glede na poslovni model, triažo in predhodne odgovore.

## D.1 Prodajna naročila, ponudbe, cene in rabati

| Vprašanje oziroma podatek | Tip | Namen v modelu |
|---|---|---|
| Koliko prodajnih naročil in vrstic prejmete v tipičnem mesecu? | število | imenovalec obsega |
| Kakšen delež vrstic pride po telefonu, e-pošti, PDF, EDI, portalu, API in spletni trgovini? | porazdelitev % | digitalni in ročni delež |
| Koliko minut neposrednega dela zahteva tipično naročilo po kanalu? | minute/kanal | strošek vnosa |
| Koliko vrstic je mogoče uvoziti brez ročne korekcije? | % | dejanska avtomatizacija |
| Koliko naročil se po prvem vnosu spremeni? | % | spremembe in ponovno delo |
| Koliko ur mesečno gre za prepis istih podatkov med sistemi? | ure | podvojena kapaciteta |
| Koliko aktivnih cenikov in rabatnih shem vzdržujete? | število | kompleksnost cen |
| Koliko cenovnih izjem zahteva ročno odobritev? | dogodki/mesec | čas odobritev |
| Koliko cenovnih napak je odkritih pred potrditvijo, po potrditvi in po računu? | 3 števila | ločitev časa od izgube |
| Kakšna je povprečna neto izguba marže pri prepozno odkriti napaki? | EUR/dogodek ali izpeljava | neposredna izguba |
| Ali sistem preverja pogodbeno ceno, kreditni limit, zalogo in dobavni datum? | več izbir | procesna zrelost |
| Koliko ponudb ostane brez jasnega statusa ali razloga izgube? | % | kakovost pipeline podatkov |

## D.2 Nabava, dobavitelji in uvoz

| Vprašanje oziroma podatek | Tip | Namen v modelu |
|---|---|---|
| Koliko nabavnih naročil in vrstic pripravite mesečno? | število | obseg nabave |
| Kolikšen delež predloga nastane avtomatsko in koliko ročno? | % | potencial avtomatizacije |
| Koliko ur gre za pregled potreb, usklajevanje in odobritve? | ure/mesec | kapaciteta |
| Kolikšen delež dobav prispe na prvotno potrjeni datum? | % | OTD |
| Kolikšen delež dobav je hkrati pravočasen in popoln? | % | supplier OTIF |
| Koliko dobav ima količinsko, cenovno, kakovostno ali dokumentno razliko? | dogodki po razlogu | stroški izjem |
| Koliko nujnih nabav nastane in zakaj? | dogodki + razlog | naslovljivost |
| Kolikšna sta dodatni prevoz in cenovna premija nujne nabave? | EUR/dogodek | neposredni strošek |
| Koliko skontov, bonusov ali rabatov ni bilo izkoriščenih? | EUR/leto | neposredna izguba |
| Kolikšen delež nabave je v tuji valuti ali izven EU? | % | valutna in uvozna veja |
| Ali landed cost vključuje prevoz, carino, zavarovanje in manipulacijo po artiklu? | da/delno/ne | kakovost marže |
| Koliko časa se odprta reklamacija dobavitelju ne zapre? | dnevi + odprti EUR | vezan kapital in čas |

## D.3 Prevzem in skladiščenje

| Vprašanje oziroma podatek | Tip | Namen v modelu |
|---|---|---|
| Koliko dobav in prevzemnih vrstic prejmete mesečno? | število | obseg prevzema |
| Kolikšen delež dobav ima uporabno predhodno najavo/ASN? | % | pripravljenost prevzema |
| Koliko časa traja od prihoda do prodajno razpoložljive zaloge? | ure | dock-to-stock |
| Koliko minut neposrednega dela zahteva dobava ali vrstica? | minute | strošek procesa |
| Kolikšen delež prevzemov zahteva ročni popravek? | % | ponovno delo |
| Ali se artikel, količina, lot/serial in lokacija zajamejo s skeniranjem? | več izbir | kakovost zajema |
| Koliko ur blago čaka pred knjiženjem ali odlaganjem? | ure/mesec | čakalni čas in navidezna nedostopnost |
| Kako pogosto je blago odloženo na napačno ali začasno lokacijo? | dogodki | lokacijska natančnost |
| Koliko dobaviteljskih razlik ostaja odprtih več kot 30 dni? | število/EUR | izjeme in kapital |
| Koliko ur vozila ali zunanji izvajalci čakajo zaradi procesa? | ure × tarifa | neposredni strošek |

## D.4 Lokacije, komisioniranje, pakiranje in inventure

| Vprašanje oziroma podatek | Tip | Namen v modelu |
|---|---|---|
| Koliko naročilnih vrstic komisionirate mesečno? | število | obseg pickinga |
| Koliko neposrednih ur porabi ekipa za picking in pakiranje? | ure | produktivnost |
| Kolikšen del časa je hoja, iskanje, pobiranje, kontrola in čakanje? | porazdelitev | vzrok izgub |
| Kolikšen delež pickinga poteka s papirja ali brez sprotne potrditve? | % | digitalna zrelost |
| Koliko napačnih vrstic je odkritih pred odpremo in po dostavi? | dogodki/1.000 | kakovost in strošek |
| Koliko naročil je treba ponovno komisionirati? | % | ponovno delo |
| Koliko naročil se razdeli zaradi manjkajoče zaloge? | % | dodatni transport |
| Kako pogosto dopolnitev pick-face lokacije ustavi picking? | dogodki/mesec | replenishment stockout |
| Kako pogosto izvajate popolno in ciklično inventuro? | frekvenca | procesna zrelost |
| Koliko ljudi, ur in prekinitev zahteva posamezna inventura? | količine | kapaciteta in izpad |
| Kolikšna je vrednost inventurnih manjkov, viškov in odpisov? | EUR/leto | neposredni učinek |
| Koliko izogibljivih nadur je povezano z napakami, čakanjem ali slabim planom? | ure/mesec | strošek nadur |

## D.5 Planiranje zalog in razpoložljivost

| Vprašanje oziroma podatek | Tip | Namen v modelu |
|---|---|---|
| Kakšna sta letni COGS in 12-mesečna povprečna zaloga? | EUR | DIO in obrati |
| Kolikšna je zaloga brez prodaje 90, 180 in 365 dni? | EUR po skupini | nekurantnost |
| Kolikšna je zaloga s kratkim preostalim rokom ali blokiranim statusom? | EUR | razvrednotenje |
| Kolikšni so odpisi in prodaja pod nabavno vrednostjo? | EUR/leto | neposredna izguba |
| Koliko vrstic ni mogoče takoj v celoti dobaviti? | % ali število | fill rate |
| Kolikšen delež je kasneje dobavljen, nadomeščen ali dokončno izgubljen? | porazdelitev % | izgubljena marža |
| Kakšna sta povprečna vrednost prizadete vrstice in prispevna marža? | EUR in % | finančni učinek |
| Na kateri ravni in kako pogosto nastaja napoved? | izbira | zrelost planiranja |
| Ali merite napako napovedi, bias in raven storitve? | da/delno/ne | kakovost planiranja |
| Kako določate minimalno, maksimalno in varnostno zalogo? | izbira | vzrok presežkov |
| Kakšna sta povprečen dobavni rok in njegova variabilnost? | dnevi | varnostna zaloga |
| Kateri SKU imajo strateško zalogo kljub redki prodaji? | opis/delež | zaščita pred napačnim rezanjem |

## D.6 Odprema, transport in dostava

| Vprašanje oziroma podatek | Tip | Namen v modelu |
|---|---|---|
| Koliko paketnih, paletnih in lastnih dostav opravite mesečno? | število po tipu | segmentacija stroškov |
| Kolikšen delež je pravočasno odpremljen in pravočasno dostavljen? | 2 odstotka | ship proti delivery |
| Kolikšen delež naročil je OTIF in perfect order? | % | celotna storitev |
| Koliko časa gre za nalepke, prevoznice, dokumente in portal prevoznika? | ure/mesec | kapaciteta |
| Koliko ekspresnih, ponovljenih in neuspelih dostav nastane? | dogodki po razlogu | neposredni strošek |
| Kolikšni so prevoz, gorivni dodatki, cestnine in druga doplačila? | EUR/leto | baseline logistike |
| Koliko transporta je zaračunanega kupcem? | EUR/% | neto cost-to-serve |
| Koliko penalov ali odbitkov je povezanih z dostavo? | EUR/leto | neposredna izguba |
| Kolikšen delež pošiljk ima napako v naslovu ali dokumentaciji? | % | kakovost podatkov |
| Ali je strošek dostave viden po kupcu, naročilu in liniji? | da/delno/ne | cost-to-serve |
| Koliko časa traja do prejema in knjiženja POD? | dnevi | fakturiranje in spori |

## D.7 Vračila, reklamacije, RMA in servis

| Vprašanje oziroma podatek | Tip | Namen v modelu |
|---|---|---|
| Koliko primerov nastane po vrsti in razlogu? | dogodki/mesec | obseg in vzrok |
| Koliko časa neposrednega dela zahteva primer? | minute/ure | kapaciteta |
| Kolikšna sta dodatni vhodni in izhodni transport? | EUR/primer | neposredni strošek |
| Kolikšen delež blaga se vrne v redno prodajo, outlet, dobavitelju ali odpis? | porazdelitev | neto izguba |
| Kakšna je povprečna izguba vrednosti pri ponovni prodaji? | EUR ali % | razvrednotenje |
| Koliko stroškov povrne dobavitelj ali prevoznik? | EUR/% | recovery |
| Koliko dni traja do fizičnega in finančnega zaprtja? | dnevi | cikel in kapital |
| Kolikšna je vrednost odprtih RMA in garancijskih zalog? | EUR | vezan kapital |
| Koliko servisnih obiskov je ponovljenih? | % | first-time-fix |
| Ali je primer povezan z izvirnim naročilom, lotom/serialom in dobaviteljem? | da/delno/ne | sledljivost |

## D.8 Terjatve, krediti in izterjava

| Vprašanje oziroma podatek | Tip | Namen v modelu |
|---|---|---|
| Kolikšna je letna prodaja na odloženo plačilo? | EUR | imenovalec DSO |
| Kakšni so povprečni pogodbeni rok, dejanski DSO in cilj? | dnevi | kapital |
| Kolikšna je povprečna vrednost odprtih in zapadlih terjatev? | EUR | izpostavljenost |
| Kakšna je starostna struktura zapadlih terjatev? | EUR po bucketih | tveganje |
| Koliko računov je izdanih z zamudo ali zavrnjenih? | dogodki/% | procesni del DSO |
| Kakšni so najpogostejši razlogi zavrnitve? | razlog + delež | naslovljivost |
| Koliko opominov in IOP pripravite ter koliko časa porabite? | količina + ure | kapaciteta |
| Kolikšni so odpisi in zunanji stroški izterjave? | EUR/leto | neposredni strošek |
| Ali se boniteta in kreditni limit preverita pred naročilom? | da/delno/ne | preventivna kontrola |
| Kolikšna je dejanska mejna financirna stopnja? | % | strošek kapitala |

## D.9 Marža, cost-to-serve in analitika

| Vprašanje oziroma podatek | Tip | Namen v modelu |
|---|---|---|
| Ali poznate bruto in prispevno maržo po artiklu, kupcu in naročilu? | matrika da/delno/ne | analitična zrelost |
| Ali marža upošteva bonuse, transport, vračila in obdelavo? | več izbir | kakovost definicije |
| Koliko naročil je pod ciljno minimalno maržo? | %/EUR | izpostavljenost |
| Koliko kupcev ustvarja negativni neto prispevek? | število/% | cost-to-serve |
| Koliko ur mesečno gre za pripravo poročil in usklajevanje razlik? | ure | kapaciteta |
| Koliko virov in Excel datotek se združuje? | število | kompleksnost |
| Kako stari so podatki ob cenovni, nabavni in kreditni odločitvi? | dnevi/ure | odzivnost |
| Kateri KPI imajo formalnega lastnika, cilj in redni pregled? | matrika | upravljavska disciplina |
| Ali lahko vodstvo sledi DIO, DSO, fill rate, OTIF in aged stock? | da/delno/ne | pokritost |

## D.10 Računovodstvo in finance

| Vprašanje oziroma podatek | Tip | Namen v modelu |
|---|---|---|
| Koliko prejetih in izdanih računov obdelate mesečno? | število | obseg |
| Kolikšen delež je strukturiran, OCR-zajet in ročno vnesen? | porazdelitev | avtomatizacija |
| Koliko minut neposrednega dela zahteva račun po tipu? | minute | strošek obdelave |
| Kolikšen delež se ujema z naročilom in prevzemom brez izjeme? | % | first-pass match |
| Koliko časa traja od prejema do knjiženja in odobritve? | dnevi | cikel |
| Koliko ur zahtevajo bančne, kartične in IOP uskladitve? | ure/mesec | kapaciteta |
| Koliko dni po koncu obdobja je zaključek pripravljen? | dnevi | hitrost poročanja |
| Koliko popravkov nastane po zaključku? | dogodki | kakovost |

## D.11 Dokumentacija, EDI in e-poslovanje

| Vprašanje oziroma podatek | Tip | Namen v modelu |
|---|---|---|
| Koliko dokumentov mesečno zahteva iskanje, razvrščanje ali odobritev? | število | obseg |
| Koliko časa gre za iskanje in ponovno pošiljanje? | ure/mesec | kapaciteta |
| Kolikšen delež dokumentov ima enotno digitalno lokacijo in revizijsko sled? | % | zrelost |
| Koliko dokumentov se izmenjuje kot EDI/XML in koliko kot PDF? | porazdelitev | strukturiranost |
| Koliko odobritev preseže dogovorjeni rok? | % | cikel |
| Ali naročilo, dobavnica, prevzem in račun uporabljajo povezane reference? | da/delno/ne | avtomatsko ujemanje |
| Koliko EDI/API prenosov odpove in kdo jih spremlja? | dogodki + ure | integracijski strošek |
| Ali je podjetje pripravljeno na B2B e-račune 2028? | stopnja | regulatorna veja |

## D.12 Kadri, čas in sprememba

| Vprašanje oziroma podatek | Tip | Namen v modelu |
|---|---|---|
| Koliko zaposlenih/FTE dela v prodaji, nabavi, skladišču, logistiki, financah in administraciji? | FTE po oddelku | validacija kapacitete |
| Koliko rednih in nadurnih ur nastane po oddelku? | ure/mesec | baseline |
| Kolikšen delež nadur je sezonski, rastni ali procesno izogibljiv? | porazdelitev | naslovljivost |
| Koliko časa zahtevajo evidence, dopusti, razporedi in plače? | ure/mesec | kapaciteta |
| Koliko časa traja uvajanje novega sodelavca do samostojnosti? | dnevi/ure mentorja | standardizacija |
| Kolikšna je fluktuacija in uporaba agencijskega dela? | % in EUR | neposredni strošek |
| Katere vloge bodo uporabljale novo rešitev in koliko pogosto? | uporabniki/role | licence in adoption |
| Koliko internih ur bo potrebnih za podatke, testiranje in izobraževanje? | ure po vlogi | investicija |

# Dodatek E: korenski vzroki in naslovljivost

## E.1 Taksonomija vzrokov

| Koda | Vzrok | Primer | Običajna obvladljivost |
|---|---|---|---|
| DATA | manjkajoči ali napačni podatki | napačna masa, naslov, cenik | srednja-visoka |
| INTEG | nepovezani sistemi | spletna trgovina in ERP | visoka, če API obstaja |
| MANUAL | ročni/papirni korak | tipkanje naročil, papirni picking | visoka |
| RULE | nejasno poslovno pravilo | kdo odobri popust | srednja-visoka |
| PROCESS | nestandardiziran proces | vsak skladiščnik dela drugače | srednja |
| LAYOUT | fizična razporeditev | hitri SKU daleč od odpreme | nizka-srednja za ERP sam |
| CAPACITY | premalo zmogljivosti | premalo ljudi ali ramp | nizka brez dodatne investicije |
| SUPPLIER | dobaviteljska zanesljivost | zamuda ali nepopolna dobava | nizka-srednja |
| CARRIER | prevoznik in zunanja mreža | zamuda zadnje milje | nizka-srednja |
| CUSTOMER | vedenje ali zahteva kupca | pozno plačilo, posebne oznake | nizka-srednja |
| MARKET | povpraševanje, cena, konkurenca | nenaden padec prodaje | zelo nizka |
| REG | regulatorna zahteva | serializacija, poročanje | ni odpravljiva; mogoče je znižati strošek skladnosti |

## E.2 Kombinacija vzrokov

Večina dogodkov ima več vzrokov. Na primer napačna pošiljka lahko nastane zaradi podobne embalaže (LAYOUT/DATA), papirnega pickinga (MANUAL) in odsotne kontrole (PROCESS). Vprašalnik naj zahteva glavni vzrok in največ dva prispevajoča vzroka. Monetizirana posledica ostane ena, rešitev pa je lahko kombinirana.

## E.3 Dokaz naslovljivosti

Preden model uporabi visok naslovljiv delež, naj preveri:

- ali obstaja funkcionalnost za konkretni korak;
- ali so vhodni podatki dovolj kakovostni;
- ali je proces v obsegu uvedbe;
- ali bo uporabnik moral in zmogel delati po novem;
- ali zunanji partner sprejema zahtevani format;
- ali fizična omejitev ostaja nespremenjena;
- ali je finančni mehanizem realizacije potrjen.

# Dodatek F: logika priporočil v poročilu

## F.1 Prioritizacija ukrepov

Vsak ukrep naj se oceni po štirih oseh:

| Os | Nizko | Srednje | Visoko |
|---|---|---|---|
| finančni učinek | majhen delež marže/kapitala | opazen | materialno vpliva na rezultat |
| dokazljivost | splošna ocena | izpeljava iz obsega | ERP/računi/časovni zapis |
| izvedljivost | zunanja odvisnost ali velika sprememba | kombinirana sprememba | jasen proces in funkcionalnost |
| čas do koristi | več kot 18 mesecev | 6-18 mesecev | manj kot 6 mesecev |

Prva prioriteta niso nujno največje bruto izgube, temveč dobro dokazane, visoko naslovljive izgube s hitrim mehanizmom realizacije.

## F.2 Vrste priporočil

- **hitri popravek procesa:** pravilo, odgovornost, čiščenje podatkov ali nastavitev;
- **aktivacija neuporabljene zmožnosti:** funkcija že obstaja, manjka uporaba;
- **integracija:** odprava ponovnega vnosa med sistemi;
- **mobilno izvajanje:** skeniranje, inventura, servis ali odobritev na mestu dogodka;
- **analitični nadzor:** KPI, opozorilo in redni upravljavski ritem;
- **večji projekt:** WMS, reorganizacija skladišča ali zahtevna migracija;
- **dodatna meritev:** izguba je verjetna, vendar še ni dokazljiva.

## F.3 Priporočilo za zbiranje podatkov

Kadar vhod ni dovolj zanesljiv, poročilo poda natančno nalogo:

| Neznanka | Podatkovna naloga |
|---|---|
| ročni čas naročila | en teden beležite začetek/konec na 30 reprezentativnih naročilih |
| stockout izguba | označite razlog nedobave in končni status vsake prizadete vrstice |
| pick napake | združite interne kontrole in reklamacije z enotno kodo razloga |
| nekurantnost | izvozite vrednost po datumu zadnje prodaje in strateškem statusu |
| DSO vzrok | razvrstite zapadle račune na procesno napako, spor in vedenjsko zamudo |
| cost-to-serve | vzorčite čas, pošiljke, vračila in plačilni rok za top 20 kupcev |
| implementacijski obseg | popišite uporabnike, sisteme, dokumente, naprave in migracijo |
