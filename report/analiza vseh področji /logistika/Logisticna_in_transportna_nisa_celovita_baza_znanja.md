# Logistična in transportna niša: celovita baza znanja

**Različica:** 1.0  
**Stanje virov:** 07. 08. 2026  
**Primarni trg:** Slovenija  
**Sekundarni trgi:** Hrvaška, Srbija, Bosna in Hercegovina, Severna Makedonija  
**Ciljni profil:** praviloma 20-500 zaposlenih, vendar vedno segmentiran po poslovnem modelu, operativnem obsegu in digitalni kompleksnosti  
**Namen:** skupno raziskovalno jedro za ROI kalkulator, adaptivni vprašalnik, digitalno zrelost, ICP/lead scoring, prodajne playbooke, PANTHEON usmerjanje, business case in AI-agente.

---

## Kako uporabljati dokument

To ni linearni priročnik za eno vrsto podjetja. Najprej izberite arhetip, nato procese in šele nato KPI-je, finančne formule ter rešitve. Beseda »logistika« skriva bistveno različne ekonomike: prevoznik monetizira vozilo in kilometer, špediter kupljeno-prodajno maržo, 3PL operativni dogodek in prostor, distributer zalogo in raven storitve, zadnja milja pa gostoto postankov in prvi uspešni poskus.

Vsaka trditev s številko mora imeti obdobje, populacijo, definicijo in vir. Razredi dokazov so: **uradni**, **standard**, **panogni**, **večvirovni**, **expert synthesis** in **hipoteza**. Benchmark ni privzeti prihranek. Podatek o 20 % praznih km na ravni slovenskih vozil na primer ne pomeni, da je 20 % kilometrov posameznega prevoznika odpravljivih.

---

# I. Trg, segmentacija in ekonomika

## 1. Izvršni povzetek

Slovenski trg je mednarodno orientiran, podatkovno razdrobljen in pod pritiskom stroškov, kadrov, dokumentacije ter novih digitalnih obveznosti. V letu 2025 so vozila, registrirana v Sloveniji, prepeljala 97,3 milijona ton in opravila 19,508 milijarde tonskih kilometrov; 87 % transportnega dela je bilo mednarodnega, 80 % kilometrov pa naloženih. To je tržni kontekst, ne avtomatski prihranek. [SURS](https://www.stat.si/StatWeb/News/Index/14304)

Celoten razred SKD H je leta 2024 obsegal 9.843 podjetij, 56.909 zaposlenih in samozaposlenih, 8,76 milijarde EUR prihodka ter 3,122 milijarde EUR dodane vrednosti. Razred vključuje kopenski, vodni in zračni promet, skladiščenje ter pošto/kurirje, zato ni neposreden TAM za logistični ERP ali TMS/WMS. [SURS](https://www.stat.si/StatWeb/en/News/Index/14354)

SiStat kaže 731 podjetij z 10-49 zaposlenimi, 103 s 50-249 in 19 z 250+. Javni podatki zato omogočajo zgolj preverljiv okvir: ciljni segment 20-500 je večji od 103 podjetij v razredu 50-249 in manjši od vseh 853 podjetij z vsaj 10 zaposlenimi; natančen izrez zahteva AJPES/Poslovni register in dodatno klasifikacijo po poslovnem modelu. SiStat vs. končna objava se pri skupnem številu razlikujeta za 2 enoti; register virov to konfliktno točko ohrani, namesto da jo skrije.

Največji produktni potencial ni »digitalizacija logistike« na splošno, temveč pet dokazljivih verig vrednosti: (1) od naročila do izvedljivega plana, (2) od fizičnega dogodka do proaktivne izjeme, (3) od izvedbe do pravilnega računa in denarja, (4) od zaloge/operativnega dogodka do točnega obračuna in (5) od razpršenih podatkov do odločanja. PANTHEON je naravno jedro za finance, naročila, zaloge, dokumente, kadre in poročanje; napredni TMS, telematika, algoritmično usmerjanje, napredni WMS ter regulativne platforme so praviloma partnerska, integracijska ali specialistična plast.

## 2. Tržni okvir Slovenije

### 2.1 Velikost in struktura

| ID | Kazalnik | Vrednost | Enota | Obdobje | Omejitev | Vir |
| --- | --- | --- | --- | --- | --- | --- |
| BM-001 | Slovenija cestni prevoz: delež praznih km | 20 | % | 2025 | kontekst, ne odpravljiv potencial | SRC-001 |
| BM-003 | Slovenija cestni prevoz: masa | 97.3 | mio t | 2025 | vozila registrirana v Sloveniji | SRC-001 |
| BM-004 | Slovenija cestni prevoz: transportno delo | 19.5082 | mrd tkm | 2025 | vozila registrirana v Sloveniji | SRC-001 |
| BM-005 | Slovenija cestni prevoz: mednarodni delež tkm | 87 | % | 2025 | ni enako deležu prihodkov | SRC-001 |
| BM-006 | Slovenija cestni prevoz: cross-trade delež tkm | 36 | % | 2025 | operacije med tujimi državami | SRC-001 |
| BM-009 | Slovenija železniški tovor | 17.254 | mio t | 2025 | 87 % v mednarodnem prometu vključno s tranzitom | SRC-007 |
| BM-010 | Slovenija železniško transportno delo | 4295.1 | mio tkm | 2025 | -6,0 % medletno | SRC-007 |
| BM-011 | SKD H - podjetja | 9843 | # | 2024 | končna objava; SiStat velikostna tabela kaže 9.845 | SRC-003; SRC-004 |
| BM-012 | SKD H - zaposleni in samozaposleni | 56909 | # | 2024 | agregat H49-H53 | SRC-003 |
| BM-013 | SKD H - prihodek | 8760 | mio EUR | 2024 | agregat H; heterogena dejavnost | SRC-003 |
| BM-014 | SKD H - dodana vrednost | 3122 | mio EUR | 2024 | agregat H | SRC-003 |
| BM-015 | SKD H - bruto investicije | 876 | mio EUR | 2024 | agregat H; -11,2 % medletno | SRC-003 |
| BM-016 | SKD H podjetja 10-49 | 731 | # | 2024 | javni velikostni razred; ni enako cilju 20-49 | SRC-004 |
| BM-017 | SKD H podjetja 50-249 | 103 | # | 2024 | v celoti znotraj ciljnega 20-500 | SRC-004 |
| BM-018 | SKD H podjetja 250+ | 19 | # | 2024 | ni javnega izreza 250-500 | SRC-004 |

Iz objavljenih agregatov je mogoče izračunati približno 890 tisoč EUR prihodka in 317 tisoč EUR dodane vrednosti na podjetje SKD H ter 54,9 tisoč EUR dodane vrednosti na zaposlenega/samozaposlenega. Ti količniki so **analitična izpeljava**, ne benchmark za ciljno podjetje, saj mikro podjetja predstavljajo večino enot, poslovni modeli H49-H53 pa so neprimerljivi.

### 2.2 Strukturni signali

- Slovenija je izrazito mednarodni cestno-logistični trg: 87 % cestnih tkm je bilo leta 2025 mednarodnih; cross-trade je predstavljal 36 % tkm. Posledica so večje regulatorne, valutne, cestninske, dokumentarne in integracijske zahteve.
- Cestni prevoz je leta 2025 upadel glede na 2024 (tone -3 %, tkm -10,7 %, kilometri -11 %), kar povečuje pomen marže po poslu in nadzora kapacitete, ne le rasti volumna.
- Železniški prevoz je leta 2025 dosegel 17,254 milijona ton in 4,295 milijarde tkm, 87 % tovora pa je bilo v mednarodnem prometu vključno s tranzitom. [SURS](https://www.stat.si/StatWeb/en/News/Index/14438)
- Luka Koper je leta 2025 obravnavala več kot 1,27 milijona TEU in več kot 914 tisoč vozil; pristanišče je pomemben generator intermodalnih, carinskih in zalednih tokov. [Luka Koper](https://www.luka-kp.si/wp-content/uploads/2026/04/LK-LP-2025-ENG-v_FIN-res.pdf)
- Pomanjkanje voznikov in viličaristov je strukturno; digitalizacija mora zato dokazati boljšo produktivnost in manj odvisnosti od posameznika, ne le »manj papirja«. [EURES](https://eures.europa.eu/living-and-working/labour-shortages-and-surpluses-europe_en)

## 3. Segmentna taksonomija

| ID | Arhetip | Opis | Ekonomska enota | Ključna ekonomika | SKD približek | Prioriteta |
| --- | --- | --- | --- | --- | --- | --- |
| SEG-01 | Cestni prevoznik - FTL | Lastna/najeta flota; polni tovori | km, vozilo-dan, voznik-ura | strošek/km, prazni km, čekanje, POD-latenca | H49 | visok |
| SEG-02 | Cestni prevoznik - LTL/groupage | Konsolidacija več pošiljk | pošiljka, paletno mesto, terminalski dotik | polnost, pretovori, napake, mrežni strošek | H49/H52 | visok |
| SEG-03 | Špediter/forwarder | Organizira in kupuje prevoz | pošiljka, relacija, prevoznik | bruto marža, spot premija, obračunska odstopanja | H52 | visok |
| SEG-04 | 3PL skladišče | Skladišči in obdeluje tuje blago | paleta-dan, vrstica, kos, manipulacija | produktivnost, SLA, zasedenost, zajem prihodka | H52 | visok |
| SEG-05 | Fulfillment/e-commerce | Pick-pack-ship in vračila | naročilo, vrstica, paket, vračilo | cost/order, hitrost, napaka, sezonskost | H52/H53 | visok |
| SEG-06 | Distributer z lastno logistiko | Lastna zaloga in dostava | SKU, naročilo, dostava, EUR zaloge | marža, dnevi zaloge, OTIF, nujni prevozi | G46/G47 + H | visok |
| SEG-07 | Kurir/last mile | Veliko postankov in paketov | postanek, paket, pot | prvi uspešni poskus, gostota, čas/postanek | H53 | srednji |
| SEG-08 | Pomorski/intermodalni organizator | Kontejnerji in menjave načina | TEU, kontejner-dan, terminalski dogodek | demurrage/detention, ETA, dokumenti | H50/H52 | srednji |
| SEG-09 | Železniški/intermodalni operater | Vlaki, vagoni, terminali | vagon, vlak, tkm, terminalski premik | rotacija, terminalska čakanja, sledljivost | H49/H52 | srednji |
| SEG-10 | Carinski posrednik | Deklaracije in dokazila | deklaracija, postavka, popravek | čas, napake, zadržanja, globe | H52/profesionalne storitve | srednji |
| SEG-11 | Hladna veriga/farma | Temperaturno nadzorovana izvedba | pošiljka, temperaturni zapis, odstopanje | integriteta, odstopanja, dokazljivost | več SKD | visok specialni |
| SEG-12 | ADR/izredni/oversize prevoz | Posebna dovoljenja in tveganja | pošiljka, dovoljenje, spremstvo | skladnost, čakanje, incidenti | H49/H52 | specialni |

Segmentacija mora biti večizbirna in utežena z deležem prihodka ali obsega. Distributer ima lahko lastno skladišče, 3PL del in floto; vprašalnik zato ne sme podjetja prisiliti v eno samo oznako. Posebni režimi - hladna veriga, ADR, izredni prevoz, carina, vračila, cross-dock - so dodatne dimenzije, ne samostojni nadomestki ekonomskega arhetipa.

## 4. Ekonomika po poslovnih modelih

### 4.1 Prevoznik z lastno floto

Prispevek se gradi po vozilu, turi, kilometru in času. Jedro je: prihodek prevoza + dodatki - gorivo - cestnine - variabilno vzdrževanje - podizvajalci - neposredni stroški voznika. Fiksni stroški vozila in režija se dodelijo za polno profitabilnost, vendar se pri odločitvah o odpravljivem kilometru ne smejo samodejno obravnavati kot prihranek.

### 4.2 Špediter

Jedro je bruto marža med prodajno in nabavno ceno prevoza, prilagojena neobračunanim dodatkom, dobropisom, škodam in času usklajevanja. Prazni kilometri prevoznika niso neposreden strošek špediterja, razen če pogodba prenese tveganje nanj.

### 4.3 3PL/fulfillment

Jedro so obračunljivi dogodki in produktivnost: paleta-dan, prevzem, kos, vrstica, paket, VAS, vračilo in manipulacija. Vrednost tuje zaloge ni 3PL-jev obratni kapital. Koristi so večji pretok, manj operativnih ur, nižji SLA stroški ter boljši capture rate.

### 4.4 Distributer

Jedro povezuje trgovsko maržo, razpoložljivost, zalogo in dostavo. Znižanje zaloge je korist samo, če ne poslabša service levela. Sprostitev zaloge je enkratni denarni tok; letna korist je strošek kapitala in držanja sproščene zaloge.

### 4.5 Kurir/last mile

Jedro so paket, postanek, pot, gostota in prvi uspešni poskus. Prihranek ponovne dostave mora vključiti verjetnost ponovitve, dejanske dodatne kilometre/čas in odgovornost za neuspeh.

### 4.6 Multimodalno, carina in posebni režimi

Jedro so kontejner/vagon/pošiljka, terminalski dogodki, dovoljenja, dokazila in izjeme. Demurrage, detention, carinske napake, temperaturna odstopanja in ADR incidenti zahtevajo ločene module, ker imajo druge vzroke in podatke.

## 5. Persone in nakupni center

| ID | Persona | Cilji | Bolečine | Dokazi | Vloga |
| --- | --- | --- | --- | --- | --- |
| PER-01 | Lastnik/direktor | EBITDA, denarni tok, rast brez kaosa | Nezanesljivi podatki; odvisnost od ljudi | ROI, vračilna doba, tveganje uvedbe | Odobri investicijo |
| PER-02 | Finančni direktor | Marža po poslu/stranki; DSO; kontrole | Pozno fakturiranje; ročna uskladitev | Revizijska sled, scenariji, NPV | Ekonomski kupec |
| PER-03 | Vodja transporta | Izkoriščenost, OTIF, stabilen plan | Prazni km; čakanje; prekinitve | Operativni KPI, izjeme, real-time podatki | Procesni lastnik |
| PER-04 | Disponent | Več nalogov brez nadur | Prepisovanje, telefoni, portali | Enoten delovni tok; avtomatski statusi | Ključni uporabnik |
| PER-05 | Vodja skladišča | Pretok, točnost, varnost | Iskanje, napačne lokacije, konice | Mobilno delo, tasking, sledljivost | Procesni lastnik |
| PER-06 | Skladiščnik/komisionar | Jasna naslednja naloga | Papir, dvoumne lokacije, ponovitve | Enostaven mobilni vmesnik | Ključni uporabnik |
| PER-07 | Customer service | Proaktivni status in manj reklamacij | WISMO klici; ročno sledenje | Dogodki, ETA, portal, obvestila | Vplivnež |
| PER-08 | Računovodstvo/obračun | Pravilna, hitra faktura | Manjkajoč POD; doplačila; razlike | Povezava izvedba-račun; kontrole | Ključni uporabnik |
| PER-09 | IT/vodja digitalizacije | Varnost, integrabilnost, podpora | Točkovne integracije in tehnični dolg | API, lastništvo podatkov, SLA | Tehnični vratar |
| PER-10 | Voznik | Minimalna administracija, jasen plan | Podvajanje vnosa; nedelujoče aplikacije | Mobilni tok, offline, ePOD | Končni uporabnik |
| PER-11 | Skladnost/kakovost | Dokazljivost in obvladovanje incidentov | Razpršena dokazila; roki | Kontrole, audit trail, alerti | Vratar tveganj |

Uspešen business case potrebuje vsaj ekonomskega kupca, procesnega lastnika, tehničnega vratarja in lastnika podatkov. Če koristi nastanejo v transportu, strošek pa je v IT in financah, mora model pokazati oba pogleda; sicer investicija nima lastnika.

# II. Procesi, podatki, bolečine in finančni učinki

## 6. End-to-end procesna arhitektura

| ID | Proces | Lastnik | Tok | KPI | Tipične odpovedi |
| --- | --- | --- | --- | --- | --- |
| PROC-01 | Lead-to-quote | prodaja | Povpraševanje -> ponudba | čas ponudbe; win rate; marža ponudbe | zastarela cena; brez cost-to-serve |
| PROC-02 | Order capture | komerciala | Naročilo -> potrjen nalog | % avtomatskih nalogov; čas vnosa | prepisovanje; manjkajoči podatki |
| PROC-03 | Capacity planning | transport | Napoved -> plan kapacitete | pokritost; zavrnitve; spot delež | nepopoln pogled; silo planiranje |
| PROC-04 | Load and route planning | transport | Nalogi -> ture | prazni km; polnost; plan km | ročno optimiranje; pozne spremembe |
| PROC-05 | Dispatch | transport | Plan -> izvršilni nalog | nalogi/disponent; spremembe | telefon/SMS; ni verzioniranja |
| PROC-06 | Subcarrier procurement | špedicija | Potreba -> kupljen prevoz | nabavna cena; čas; spot premija | nepregledna zgodovina; ročna pogajanja |
| PROC-07 | Pickup and loading | izvedba | Prihod -> odhod z naklada | čakanje; pravočasni prevzemi | brez slot podatkov; nepripravljeno blago |
| PROC-08 | In-transit control | izvedba | Odhod -> prihod | ETA natančnost; izjeme; WISMO | status po telefonu; prepozna eskalacija |
| PROC-09 | Delivery and ePOD | izvedba | Prihod -> dokazilo | POD latenca; first-attempt; OTIF | papir; nečitljivo; zamujena vrnitev |
| PROC-10 | Freight audit | finance | Izvedba -> potrjen strošek | odstopanje; čas potrditve | ročna primerjava; manjkajoči dogodki |
| PROC-11 | Transport billing | finance | POD -> račun kupcu | POD-to-invoice; leakage; dobropisi | neobračunani dodatki; pozna faktura |
| PROC-12 | Receivables and claims | finance | Račun -> denar/regres | DSO; spori; izterjava | razpršena dokazila; počasna reklamacija |
| PROC-13 | Inbound appointment | skladišče | Najava -> rampa | čakanje; adherence | Excel sloti; neznani prihodi |
| PROC-14 | Receiving and QC | skladišče | Razklad -> potrjen prevzem | dock-to-stock; napake | papir; dvojni vnos; slepi prevzem |
| PROC-15 | Put-away | skladišče | Prevzem -> lokacija | čas; pot; lokacijska točnost | prosta izbira; slaba slotting pravila |
| PROC-16 | Replenishment | skladišče | Potreba -> dopolnjena pick lokacija | stockout pick lokacij; urgence | reaktivno; brez nalogov |
| PROC-17 | Picking | skladišče | Nalog -> zbrani artikli | vrstice/uro; napake; pot | papir; napačno zaporedje; congestion |
| PROC-18 | Packing and staging | skladišče | Zbrano -> pripravljeno za odpremo | čas; material; napake | ročne etikete; napačna konsolidacija |
| PROC-19 | Shipping | skladišče | Staging -> odhod | cut-off adherence; napačna odprema | brez scan kontrole; pozne spremembe |
| PROC-20 | Inventory control | skladišče | Dogodek -> pravilna zaloga | točnost; prilagoditve; stalež | zamujeno knjiženje; negativna zaloga |
| PROC-21 | Returns | skladišče | Vračilo -> odločitev/refund | čas vračila; recovery rate | nejasni razlogi; ločen sistem |
| PROC-22 | 3PL service billing | 3PL finance | Dogodki -> obračun storitev | capture rate; spori; čas | ročne evidence; neobračunani dogodki |
| PROC-23 | Fleet maintenance | flota | Signal -> delovno vozilo | uptime; cost/km; MTBF | reaktivno vzdrževanje; razpršeni podatki |
| PROC-24 | Fuel and toll control | flota/finance | Transakcija -> potrjen strošek | l/100km; anomalije; strošek/km | ročna uskladitev; zlorabe; brez normativov |
| PROC-25 | Driver and workforce | HR/transport | Potreba -> razpoložljiva ekipa | nadure; odsotnost; kršitve | silo HR/transport; ročni seznami |
| PROC-26 | Compliance and documents | skladnost | Obveznost -> dokazilo | kršitve; potekla dokazila; audit čas | Excel roki; različne mape |
| PROC-27 | Management reporting | vodstvo | Dogodki -> odločitev | čas poročila; data latency; reconciliation | Excel konsolidacija; različne definicije |
| PROC-28 | Master data and integration | IT | Sprememba -> usklajeni sistemi | napake vmesnikov; duplikati; SLA | brez lastništva; point-to-point integracije |

## 7. Procesni katalog z diagnostičnim prevodom

### PROC-01: Lead-to-quote

**Lastnik procesa:** prodaja. **Tok:** Povpraševanje -> ponudba. **Ključni vhodi:** povpraševanje; ceniki; kapaciteta. **Izhod:** odobrena ponudba.

- Kontrolne točke: popolnost vhodnih podatkov, časovni žig, identiteta izvajalca, status izjeme in dokazilo o zaključku.
- KPI: čas ponudbe; win rate; marža ponudbe.
- Tipične odpovedi: zastarela cena; brez cost-to-serve.
- Finančni prevod: neposredni strošek dogodka + dokazljivo porabljen čas + morebitni zamik denarnega toka. Vrednost kapacitete se poroča ločeno od cash prihranka.
- Rešitveni vzorec: standardizacija procesa -> enolični master data -> zajem dogodka ob viru -> integracija -> kontrola izjem -> analitika. Tehnologija brez lastnika procesa in definicije dogodka ne odpravi vzroka.

### PROC-02: Order capture

**Lastnik procesa:** komerciala. **Tok:** Naročilo -> potrjen nalog. **Ključni vhodi:** e-pošta; EDI; portal; dokument. **Izhod:** strukturiran nalog.

- Kontrolne točke: popolnost vhodnih podatkov, časovni žig, identiteta izvajalca, status izjeme in dokazilo o zaključku.
- KPI: % avtomatskih nalogov; čas vnosa.
- Tipične odpovedi: prepisovanje; manjkajoči podatki.
- Finančni prevod: neposredni strošek dogodka + dokazljivo porabljen čas + morebitni zamik denarnega toka. Vrednost kapacitete se poroča ločeno od cash prihranka.
- Rešitveni vzorec: standardizacija procesa -> enolični master data -> zajem dogodka ob viru -> integracija -> kontrola izjem -> analitika. Tehnologija brez lastnika procesa in definicije dogodka ne odpravi vzroka.

### PROC-03: Capacity planning

**Lastnik procesa:** transport. **Tok:** Napoved -> plan kapacitete. **Ključni vhodi:** naročila; flota; vozniki; omejitve. **Izhod:** kapacitetni plan.

- Kontrolne točke: popolnost vhodnih podatkov, časovni žig, identiteta izvajalca, status izjeme in dokazilo o zaključku.
- KPI: pokritost; zavrnitve; spot delež.
- Tipične odpovedi: nepopoln pogled; silo planiranje.
- Finančni prevod: neposredni strošek dogodka + dokazljivo porabljen čas + morebitni zamik denarnega toka. Vrednost kapacitete se poroča ločeno od cash prihranka.
- Rešitveni vzorec: standardizacija procesa -> enolični master data -> zajem dogodka ob viru -> integracija -> kontrola izjem -> analitika. Tehnologija brez lastnika procesa in definicije dogodka ne odpravi vzroka.

### PROC-04: Load and route planning

**Lastnik procesa:** transport. **Tok:** Nalogi -> ture. **Ključni vhodi:** lokacije; časovna okna; vozila. **Izhod:** izvedljiv plan tur.

- Kontrolne točke: popolnost vhodnih podatkov, časovni žig, identiteta izvajalca, status izjeme in dokazilo o zaključku.
- KPI: prazni km; polnost; plan km.
- Tipične odpovedi: ročno optimiranje; pozne spremembe.
- Finančni prevod: neposredni strošek dogodka + dokazljivo porabljen čas + morebitni zamik denarnega toka. Vrednost kapacitete se poroča ločeno od cash prihranka.
- Rešitveni vzorec: standardizacija procesa -> enolični master data -> zajem dogodka ob viru -> integracija -> kontrola izjem -> analitika. Tehnologija brez lastnika procesa in definicije dogodka ne odpravi vzroka.

### PROC-05: Dispatch

**Lastnik procesa:** transport. **Tok:** Plan -> izvršilni nalog. **Ključni vhodi:** ture; voznik; vozilo. **Izhod:** dodelitev in navodila.

- Kontrolne točke: popolnost vhodnih podatkov, časovni žig, identiteta izvajalca, status izjeme in dokazilo o zaključku.
- KPI: nalogi/disponent; spremembe.
- Tipične odpovedi: telefon/SMS; ni verzioniranja.
- Finančni prevod: neposredni strošek dogodka + dokazljivo porabljen čas + morebitni zamik denarnega toka. Vrednost kapacitete se poroča ločeno od cash prihranka.
- Rešitveni vzorec: standardizacija procesa -> enolični master data -> zajem dogodka ob viru -> integracija -> kontrola izjem -> analitika. Tehnologija brez lastnika procesa in definicije dogodka ne odpravi vzroka.

### PROC-06: Subcarrier procurement

**Lastnik procesa:** špedicija. **Tok:** Potreba -> kupljen prevoz. **Ključni vhodi:** relacija; SLA; prevozniki. **Izhod:** potrjena nabava.

- Kontrolne točke: popolnost vhodnih podatkov, časovni žig, identiteta izvajalca, status izjeme in dokazilo o zaključku.
- KPI: nabavna cena; čas; spot premija.
- Tipične odpovedi: nepregledna zgodovina; ročna pogajanja.
- Finančni prevod: neposredni strošek dogodka + dokazljivo porabljen čas + morebitni zamik denarnega toka. Vrednost kapacitete se poroča ločeno od cash prihranka.
- Rešitveni vzorec: standardizacija procesa -> enolični master data -> zajem dogodka ob viru -> integracija -> kontrola izjem -> analitika. Tehnologija brez lastnika procesa in definicije dogodka ne odpravi vzroka.

### PROC-07: Pickup and loading

**Lastnik procesa:** izvedba. **Tok:** Prihod -> odhod z naklada. **Ključni vhodi:** slot; blago; dokumenti. **Izhod:** naloženo vozilo.

- Kontrolne točke: popolnost vhodnih podatkov, časovni žig, identiteta izvajalca, status izjeme in dokazilo o zaključku.
- KPI: čakanje; pravočasni prevzemi.
- Tipične odpovedi: brez slot podatkov; nepripravljeno blago.
- Finančni prevod: neposredni strošek dogodka + dokazljivo porabljen čas + morebitni zamik denarnega toka. Vrednost kapacitete se poroča ločeno od cash prihranka.
- Rešitveni vzorec: standardizacija procesa -> enolični master data -> zajem dogodka ob viru -> integracija -> kontrola izjem -> analitika. Tehnologija brez lastnika procesa in definicije dogodka ne odpravi vzroka.

### PROC-08: In-transit control

**Lastnik procesa:** izvedba. **Tok:** Odhod -> prihod. **Ključni vhodi:** GPS; dogodki; ETA; izjeme. **Izhod:** status in ukrep.

- Kontrolne točke: popolnost vhodnih podatkov, časovni žig, identiteta izvajalca, status izjeme in dokazilo o zaključku.
- KPI: ETA natančnost; izjeme; WISMO.
- Tipične odpovedi: status po telefonu; prepozna eskalacija.
- Finančni prevod: neposredni strošek dogodka + dokazljivo porabljen čas + morebitni zamik denarnega toka. Vrednost kapacitete se poroča ločeno od cash prihranka.
- Rešitveni vzorec: standardizacija procesa -> enolični master data -> zajem dogodka ob viru -> integracija -> kontrola izjem -> analitika. Tehnologija brez lastnika procesa in definicije dogodka ne odpravi vzroka.

### PROC-09: Delivery and ePOD

**Lastnik procesa:** izvedba. **Tok:** Prihod -> dokazilo. **Ključni vhodi:** nalog; prejemnik; dokazila. **Izhod:** POD/CMR; incident.

- Kontrolne točke: popolnost vhodnih podatkov, časovni žig, identiteta izvajalca, status izjeme in dokazilo o zaključku.
- KPI: POD latenca; first-attempt; OTIF.
- Tipične odpovedi: papir; nečitljivo; zamujena vrnitev.
- Finančni prevod: neposredni strošek dogodka + dokazljivo porabljen čas + morebitni zamik denarnega toka. Vrednost kapacitete se poroča ločeno od cash prihranka.
- Rešitveni vzorec: standardizacija procesa -> enolični master data -> zajem dogodka ob viru -> integracija -> kontrola izjem -> analitika. Tehnologija brez lastnika procesa in definicije dogodka ne odpravi vzroka.

### PROC-10: Freight audit

**Lastnik procesa:** finance. **Tok:** Izvedba -> potrjen strošek. **Ključni vhodi:** pogodba; dejanski dogodki; račun. **Izhod:** odobren strošek.

- Kontrolne točke: popolnost vhodnih podatkov, časovni žig, identiteta izvajalca, status izjeme in dokazilo o zaključku.
- KPI: odstopanje; čas potrditve.
- Tipične odpovedi: ročna primerjava; manjkajoči dogodki.
- Finančni prevod: neposredni strošek dogodka + dokazljivo porabljen čas + morebitni zamik denarnega toka. Vrednost kapacitete se poroča ločeno od cash prihranka.
- Rešitveni vzorec: standardizacija procesa -> enolični master data -> zajem dogodka ob viru -> integracija -> kontrola izjem -> analitika. Tehnologija brez lastnika procesa in definicije dogodka ne odpravi vzroka.

### PROC-11: Transport billing

**Lastnik procesa:** finance. **Tok:** POD -> račun kupcu. **Ključni vhodi:** tarifa; dodatki; POD. **Izhod:** izdan pravilen račun.

- Kontrolne točke: popolnost vhodnih podatkov, časovni žig, identiteta izvajalca, status izjeme in dokazilo o zaključku.
- KPI: POD-to-invoice; leakage; dobropisi.
- Tipične odpovedi: neobračunani dodatki; pozna faktura.
- Finančni prevod: neposredni strošek dogodka + dokazljivo porabljen čas + morebitni zamik denarnega toka. Vrednost kapacitete se poroča ločeno od cash prihranka.
- Rešitveni vzorec: standardizacija procesa -> enolični master data -> zajem dogodka ob viru -> integracija -> kontrola izjem -> analitika. Tehnologija brez lastnika procesa in definicije dogodka ne odpravi vzroka.

### PROC-12: Receivables and claims

**Lastnik procesa:** finance. **Tok:** Račun -> denar/regres. **Ključni vhodi:** račun; spor; dokazila. **Izhod:** plačilo ali rešen spor.

- Kontrolne točke: popolnost vhodnih podatkov, časovni žig, identiteta izvajalca, status izjeme in dokazilo o zaključku.
- KPI: DSO; spori; izterjava.
- Tipične odpovedi: razpršena dokazila; počasna reklamacija.
- Finančni prevod: neposredni strošek dogodka + dokazljivo porabljen čas + morebitni zamik denarnega toka. Vrednost kapacitete se poroča ločeno od cash prihranka.
- Rešitveni vzorec: standardizacija procesa -> enolični master data -> zajem dogodka ob viru -> integracija -> kontrola izjem -> analitika. Tehnologija brez lastnika procesa in definicije dogodka ne odpravi vzroka.

### PROC-13: Inbound appointment

**Lastnik procesa:** skladišče. **Tok:** Najava -> rampa. **Ključni vhodi:** ASN; sloti; kapaciteta. **Izhod:** rezerviran slot.

- Kontrolne točke: popolnost vhodnih podatkov, časovni žig, identiteta izvajalca, status izjeme in dokazilo o zaključku.
- KPI: čakanje; adherence.
- Tipične odpovedi: Excel sloti; neznani prihodi.
- Finančni prevod: neposredni strošek dogodka + dokazljivo porabljen čas + morebitni zamik denarnega toka. Vrednost kapacitete se poroča ločeno od cash prihranka.
- Rešitveni vzorec: standardizacija procesa -> enolični master data -> zajem dogodka ob viru -> integracija -> kontrola izjem -> analitika. Tehnologija brez lastnika procesa in definicije dogodka ne odpravi vzroka.

### PROC-14: Receiving and QC

**Lastnik procesa:** skladišče. **Tok:** Razklad -> potrjen prevzem. **Ključni vhodi:** ASN; blago; etikete. **Izhod:** prejeto in odstopanja.

- Kontrolne točke: popolnost vhodnih podatkov, časovni žig, identiteta izvajalca, status izjeme in dokazilo o zaključku.
- KPI: dock-to-stock; napake.
- Tipične odpovedi: papir; dvojni vnos; slepi prevzem.
- Finančni prevod: neposredni strošek dogodka + dokazljivo porabljen čas + morebitni zamik denarnega toka. Vrednost kapacitete se poroča ločeno od cash prihranka.
- Rešitveni vzorec: standardizacija procesa -> enolični master data -> zajem dogodka ob viru -> integracija -> kontrola izjem -> analitika. Tehnologija brez lastnika procesa in definicije dogodka ne odpravi vzroka.

### PROC-15: Put-away

**Lastnik procesa:** skladišče. **Tok:** Prevzem -> lokacija. **Ključni vhodi:** artikel; lokacije; pravila. **Izhod:** uskladiščeno blago.

- Kontrolne točke: popolnost vhodnih podatkov, časovni žig, identiteta izvajalca, status izjeme in dokazilo o zaključku.
- KPI: čas; pot; lokacijska točnost.
- Tipične odpovedi: prosta izbira; slaba slotting pravila.
- Finančni prevod: neposredni strošek dogodka + dokazljivo porabljen čas + morebitni zamik denarnega toka. Vrednost kapacitete se poroča ločeno od cash prihranka.
- Rešitveni vzorec: standardizacija procesa -> enolični master data -> zajem dogodka ob viru -> integracija -> kontrola izjem -> analitika. Tehnologija brez lastnika procesa in definicije dogodka ne odpravi vzroka.

### PROC-16: Replenishment

**Lastnik procesa:** skladišče. **Tok:** Potreba -> dopolnjena pick lokacija. **Ključni vhodi:** min/max; nalogi; zaloga. **Izhod:** dopolnjena lokacija.

- Kontrolne točke: popolnost vhodnih podatkov, časovni žig, identiteta izvajalca, status izjeme in dokazilo o zaključku.
- KPI: stockout pick lokacij; urgence.
- Tipične odpovedi: reaktivno; brez nalogov.
- Finančni prevod: neposredni strošek dogodka + dokazljivo porabljen čas + morebitni zamik denarnega toka. Vrednost kapacitete se poroča ločeno od cash prihranka.
- Rešitveni vzorec: standardizacija procesa -> enolični master data -> zajem dogodka ob viru -> integracija -> kontrola izjem -> analitika. Tehnologija brez lastnika procesa in definicije dogodka ne odpravi vzroka.

### PROC-17: Picking

**Lastnik procesa:** skladišče. **Tok:** Nalog -> zbrani artikli. **Ključni vhodi:** valovi; lokacije; oprema. **Izhod:** zbrano naročilo.

- Kontrolne točke: popolnost vhodnih podatkov, časovni žig, identiteta izvajalca, status izjeme in dokazilo o zaključku.
- KPI: vrstice/uro; napake; pot.
- Tipične odpovedi: papir; napačno zaporedje; congestion.
- Finančni prevod: neposredni strošek dogodka + dokazljivo porabljen čas + morebitni zamik denarnega toka. Vrednost kapacitete se poroča ločeno od cash prihranka.
- Rešitveni vzorec: standardizacija procesa -> enolični master data -> zajem dogodka ob viru -> integracija -> kontrola izjem -> analitika. Tehnologija brez lastnika procesa in definicije dogodka ne odpravi vzroka.

### PROC-18: Packing and staging

**Lastnik procesa:** skladišče. **Tok:** Zbrano -> pripravljeno za odpremo. **Ključni vhodi:** artikli; embalaža; prevoznik. **Izhod:** paket/paleta in etiketa.

- Kontrolne točke: popolnost vhodnih podatkov, časovni žig, identiteta izvajalca, status izjeme in dokazilo o zaključku.
- KPI: čas; material; napake.
- Tipične odpovedi: ročne etikete; napačna konsolidacija.
- Finančni prevod: neposredni strošek dogodka + dokazljivo porabljen čas + morebitni zamik denarnega toka. Vrednost kapacitete se poroča ločeno od cash prihranka.
- Rešitveni vzorec: standardizacija procesa -> enolični master data -> zajem dogodka ob viru -> integracija -> kontrola izjem -> analitika. Tehnologija brez lastnika procesa in definicije dogodka ne odpravi vzroka.

### PROC-19: Shipping

**Lastnik procesa:** skladišče. **Tok:** Staging -> odhod. **Ključni vhodi:** ture; vrata; dokazila. **Izhod:** odpremljeno.

- Kontrolne točke: popolnost vhodnih podatkov, časovni žig, identiteta izvajalca, status izjeme in dokazilo o zaključku.
- KPI: cut-off adherence; napačna odprema.
- Tipične odpovedi: brez scan kontrole; pozne spremembe.
- Finančni prevod: neposredni strošek dogodka + dokazljivo porabljen čas + morebitni zamik denarnega toka. Vrednost kapacitete se poroča ločeno od cash prihranka.
- Rešitveni vzorec: standardizacija procesa -> enolični master data -> zajem dogodka ob viru -> integracija -> kontrola izjem -> analitika. Tehnologija brez lastnika procesa in definicije dogodka ne odpravi vzroka.

### PROC-20: Inventory control

**Lastnik procesa:** skladišče. **Tok:** Dogodek -> pravilna zaloga. **Ključni vhodi:** premiki; štetje; lot/serija. **Izhod:** usklajena zaloga.

- Kontrolne točke: popolnost vhodnih podatkov, časovni žig, identiteta izvajalca, status izjeme in dokazilo o zaključku.
- KPI: točnost; prilagoditve; stalež.
- Tipične odpovedi: zamujeno knjiženje; negativna zaloga.
- Finančni prevod: neposredni strošek dogodka + dokazljivo porabljen čas + morebitni zamik denarnega toka. Vrednost kapacitete se poroča ločeno od cash prihranka.
- Rešitveni vzorec: standardizacija procesa -> enolični master data -> zajem dogodka ob viru -> integracija -> kontrola izjem -> analitika. Tehnologija brez lastnika procesa in definicije dogodka ne odpravi vzroka.

### PROC-21: Returns

**Lastnik procesa:** skladišče. **Tok:** Vračilo -> odločitev/refund. **Ključni vhodi:** RMA; razlog; stanje. **Izhod:** ponovna zaloga/popravilo/odpis.

- Kontrolne točke: popolnost vhodnih podatkov, časovni žig, identiteta izvajalca, status izjeme in dokazilo o zaključku.
- KPI: čas vračila; recovery rate.
- Tipične odpovedi: nejasni razlogi; ločen sistem.
- Finančni prevod: neposredni strošek dogodka + dokazljivo porabljen čas + morebitni zamik denarnega toka. Vrednost kapacitete se poroča ločeno od cash prihranka.
- Rešitveni vzorec: standardizacija procesa -> enolični master data -> zajem dogodka ob viru -> integracija -> kontrola izjem -> analitika. Tehnologija brez lastnika procesa in definicije dogodka ne odpravi vzroka.

### PROC-22: 3PL service billing

**Lastnik procesa:** 3PL finance. **Tok:** Dogodki -> obračun storitev. **Ključni vhodi:** paleta-dan; dotiki; pogodba. **Izhod:** račun storitev.

- Kontrolne točke: popolnost vhodnih podatkov, časovni žig, identiteta izvajalca, status izjeme in dokazilo o zaključku.
- KPI: capture rate; spori; čas.
- Tipične odpovedi: ročne evidence; neobračunani dogodki.
- Finančni prevod: neposredni strošek dogodka + dokazljivo porabljen čas + morebitni zamik denarnega toka. Vrednost kapacitete se poroča ločeno od cash prihranka.
- Rešitveni vzorec: standardizacija procesa -> enolični master data -> zajem dogodka ob viru -> integracija -> kontrola izjem -> analitika. Tehnologija brez lastnika procesa in definicije dogodka ne odpravi vzroka.

### PROC-23: Fleet maintenance

**Lastnik procesa:** flota. **Tok:** Signal -> delovno vozilo. **Ključni vhodi:** km; okvare; servisni plan. **Izhod:** razpoložljivo vozilo.

- Kontrolne točke: popolnost vhodnih podatkov, časovni žig, identiteta izvajalca, status izjeme in dokazilo o zaključku.
- KPI: uptime; cost/km; MTBF.
- Tipične odpovedi: reaktivno vzdrževanje; razpršeni podatki.
- Finančni prevod: neposredni strošek dogodka + dokazljivo porabljen čas + morebitni zamik denarnega toka. Vrednost kapacitete se poroča ločeno od cash prihranka.
- Rešitveni vzorec: standardizacija procesa -> enolični master data -> zajem dogodka ob viru -> integracija -> kontrola izjem -> analitika. Tehnologija brez lastnika procesa in definicije dogodka ne odpravi vzroka.

### PROC-24: Fuel and toll control

**Lastnik procesa:** flota/finance. **Tok:** Transakcija -> potrjen strošek. **Ključni vhodi:** kartice; GPS; km; cestnine. **Izhod:** usklajen strošek.

- Kontrolne točke: popolnost vhodnih podatkov, časovni žig, identiteta izvajalca, status izjeme in dokazilo o zaključku.
- KPI: l/100km; anomalije; strošek/km.
- Tipične odpovedi: ročna uskladitev; zlorabe; brez normativov.
- Finančni prevod: neposredni strošek dogodka + dokazljivo porabljen čas + morebitni zamik denarnega toka. Vrednost kapacitete se poroča ločeno od cash prihranka.
- Rešitveni vzorec: standardizacija procesa -> enolični master data -> zajem dogodka ob viru -> integracija -> kontrola izjem -> analitika. Tehnologija brez lastnika procesa in definicije dogodka ne odpravi vzroka.

### PROC-25: Driver and workforce

**Lastnik procesa:** HR/transport. **Tok:** Potreba -> razpoložljiva ekipa. **Ključni vhodi:** urniki; tahograf; kompetence. **Izhod:** skladen razpored.

- Kontrolne točke: popolnost vhodnih podatkov, časovni žig, identiteta izvajalca, status izjeme in dokazilo o zaključku.
- KPI: nadure; odsotnost; kršitve.
- Tipične odpovedi: silo HR/transport; ročni seznami.
- Finančni prevod: neposredni strošek dogodka + dokazljivo porabljen čas + morebitni zamik denarnega toka. Vrednost kapacitete se poroča ločeno od cash prihranka.
- Rešitveni vzorec: standardizacija procesa -> enolični master data -> zajem dogodka ob viru -> integracija -> kontrola izjem -> analitika. Tehnologija brez lastnika procesa in definicije dogodka ne odpravi vzroka.

### PROC-26: Compliance and documents

**Lastnik procesa:** skladnost. **Tok:** Obveznost -> dokazilo. **Ključni vhodi:** ADR; carina; licence; temperature. **Izhod:** veljavno dokazilo.

- Kontrolne točke: popolnost vhodnih podatkov, časovni žig, identiteta izvajalca, status izjeme in dokazilo o zaključku.
- KPI: kršitve; potekla dokazila; audit čas.
- Tipične odpovedi: Excel roki; različne mape.
- Finančni prevod: neposredni strošek dogodka + dokazljivo porabljen čas + morebitni zamik denarnega toka. Vrednost kapacitete se poroča ločeno od cash prihranka.
- Rešitveni vzorec: standardizacija procesa -> enolični master data -> zajem dogodka ob viru -> integracija -> kontrola izjem -> analitika. Tehnologija brez lastnika procesa in definicije dogodka ne odpravi vzroka.

### PROC-27: Management reporting

**Lastnik procesa:** vodstvo. **Tok:** Dogodki -> odločitev. **Ključni vhodi:** ERP; TMS; WMS; telematika. **Izhod:** KPI in akcija.

- Kontrolne točke: popolnost vhodnih podatkov, časovni žig, identiteta izvajalca, status izjeme in dokazilo o zaključku.
- KPI: čas poročila; data latency; reconciliation.
- Tipične odpovedi: Excel konsolidacija; različne definicije.
- Finančni prevod: neposredni strošek dogodka + dokazljivo porabljen čas + morebitni zamik denarnega toka. Vrednost kapacitete se poroča ločeno od cash prihranka.
- Rešitveni vzorec: standardizacija procesa -> enolični master data -> zajem dogodka ob viru -> integracija -> kontrola izjem -> analitika. Tehnologija brez lastnika procesa in definicije dogodka ne odpravi vzroka.

### PROC-28: Master data and integration

**Lastnik procesa:** IT. **Tok:** Sprememba -> usklajeni sistemi. **Ključni vhodi:** partner; artikel; lokacija; tarife. **Izhod:** kakovostni podatki in dogodki.

- Kontrolne točke: popolnost vhodnih podatkov, časovni žig, identiteta izvajalca, status izjeme in dokazilo o zaključku.
- KPI: napake vmesnikov; duplikati; SLA.
- Tipične odpovedi: brez lastništva; point-to-point integracije.
- Finančni prevod: neposredni strošek dogodka + dokazljivo porabljen čas + morebitni zamik denarnega toka. Vrednost kapacitete se poroča ločeno od cash prihranka.
- Rešitveni vzorec: standardizacija procesa -> enolični master data -> zajem dogodka ob viru -> integracija -> kontrola izjem -> analitika. Tehnologija brez lastnika procesa in definicije dogodka ne odpravi vzroka.


## 8. Podatkovni model: entitete in dogodki

Operativna resnica nastaja kot dogodek: kdo/naprava je ob katerem času kaj naredila kateremu objektu, na kateri lokaciji in s katerim rezultatom. ERP ostaja finančna in komercialna resnica; TMS/WMS/telematika sta izvedbeni resnici; event hub ali integracijska plast mora ohraniti korelacijske ID-je, verzije, napake in ponovne obdelave. GS1 EPCIS je uporaben referenčni jezik za dogodke vidljivosti, ne pa obvezen produktni recept. [GS1 EPCIS](https://www.gs1.org/standards/epcis)

### 8.1 Jedrne entitete

| Entiteta | Minimalna polja | Tipični lastnik |
| --- | --- | --- |
| Partner | partner_id; davčna; vloge; naslovi; pogoji | MDM/ERP |
| Lokacija | location_id; geokoordinate; časovna okna; tip | MDM/TMS/WMS |
| Artikel/SKU | sku_id; GTIN; teža; volumen; lot/serija; režim | ERP/WMS |
| Naročilo | order_id; stranka; roki; vrstice; Incoterm | ERP/OMS |
| Pošiljka | shipment_id; order_id; od/do; količine; SLA | TMS |
| Tura | trip_id; vozilo; voznik; postanki; plan/actual km | TMS |
| Vozilo | vehicle_id; tip; kapacitete; emisijski razred; status | FMS/TMS |
| Voznik | driver_id; kompetence; razpoložljivost; tahograf | HR/TMS |
| Prevoznik | carrier_id; licence; tarife; zanesljivost | TMS/ERP |
| Skladišče | warehouse_id; cone; vrata; koledar | WMS/ERP |
| Lokacija zaloge | bin_id; cone; kapaciteta; pravila | WMS |
| Enota zaloge | SSCC; SKU; lot; serija; količina; status | WMS/ERP |
| Operativni dogodek | event_id; tip; objekt; čas; lokacija; vir | event hub/EPCIS |
| POD/CMR | document_id; shipment_id; podpis; čas; verzija | DMS/TMS |
| Tarifa | rate_id; veljavnost; osnova; dodatki; valute | ERP/TMS |
| Stroškovni dogodek | cost_id; objekt; kategorija; znesek; dokazilo | ERP |
| Račun | invoice_id; partner; postavke; davki; roki; status | ERP |
| Reklamacija | claim_id; vzrok; odgovornost; zneski; dokazila | CRM/ERP |
| Meritev temperature | sensor_id; shipment/SSCC; čas; vrednost; alarm | IoT/QMS |
| Integracijsko sporočilo | message_id; sistem; korelacija; status; napaka | iPaaS/log |

### 8.2 Ključni dogodki

`order.created, order.confirmed, shipment.planned, carrier.accepted, vehicle.assigned, pickup.arrived, pickup.completed, in_transit.location, exception.raised, delivery.arrived, delivery.completed, pod.received, invoice.eligible, invoice.issued, payment.received, asn.received, dock.assigned, goods.received, qc.completed, putaway.completed, inventory.adjusted, pick.started, pick.completed, pack.completed, shipment.loaded, return.received, claim.opened, claim.closed, maintenance.due, integration.failed`

Pravila kakovosti: enolični ID objekta, UTC čas + lokalni časovni pas, vir, actor/device, stanje pred/po dogodku, razlog spremembe, korelacijski ID in idempotentnost. Skeniran PDF brez strukturiranega dogodka je dokument, ne popoln podatkovni tok.

## 9. Katalog bolečin

| ID | Proces ID | Proces | Bolečina | Posledica | Kategorija | Dokaz | Razred |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PAIN-001 | PROC-01 | Lead-to-quote | Počasno oblikovanje ponudbe | izgubljena odzivnost in preveč administracije | čas/kapaciteta | intervju + podatki | expert synthesis |
| PAIN-002 | PROC-01 | Lead-to-quote | Cena brez preverjene lastne cene | negativna marža ali zavrnitev dobrega posla | marža | intervju + podatki | expert synthesis |
| PAIN-003 | PROC-02 | Order capture | Ročno prepisovanje naročil | ure, napake in pozna potrditev | čas/kakovost | intervju + podatki | expert synthesis |
| PAIN-004 | PROC-02 | Order capture | Manjkajoči podatki ob potrditvi | poznejše prekinitve in kontakti | čas/SLA | intervju + podatki | expert synthesis |
| PAIN-005 | PROC-03 | Capacity planning | Planiranje v preglednicah in telefonih | prazni km, nadure in krhek plan | strošek/kapaciteta | intervju + podatki | expert synthesis |
| PAIN-006 | PROC-03 | Capacity planning | Pozne spremembe brez sistemske sledi | dvojno delo in napačna navodila | čas/SLA | intervju + podatki | expert synthesis |
| PAIN-007 | PROC-04 | Load and route planning | Planiranje v preglednicah in telefonih | prazni km, nadure in krhek plan | strošek/kapaciteta | intervju + podatki | expert synthesis |
| PAIN-008 | PROC-04 | Load and route planning | Pozne spremembe brez sistemske sledi | dvojno delo in napačna navodila | čas/SLA | intervju + podatki | expert synthesis |
| PAIN-009 | PROC-05 | Dispatch | Planiranje v preglednicah in telefonih | prazni km, nadure in krhek plan | strošek/kapaciteta | intervju + podatki | expert synthesis |
| PAIN-010 | PROC-05 | Dispatch | Pozne spremembe brez sistemske sledi | dvojno delo in napačna navodila | čas/SLA | intervju + podatki | expert synthesis |
| PAIN-011 | PROC-06 | Subcarrier procurement | Nabava prevoznika brez zgodovinske analitike | spot premije in nižja marža | marža | intervju + podatki | expert synthesis |
| PAIN-012 | PROC-06 | Subcarrier procurement | Neskladje med prodajno in nabavno tarifo | leakage in spori | prihodek | intervju + podatki | expert synthesis |
| PAIN-013 | PROC-07 | Pickup and loading | Status se pridobiva po telefonu | čas disponenta in slab customer service | čas/SLA | intervju + podatki | expert synthesis |
| PAIN-014 | PROC-07 | Pickup and loading | POD se vrača z zamikom | pozno fakturiranje in DSO | denarni tok | intervju + podatki | expert synthesis |
| PAIN-015 | PROC-08 | In-transit control | Status se pridobiva po telefonu | čas disponenta in slab customer service | čas/SLA | intervju + podatki | expert synthesis |
| PAIN-016 | PROC-08 | In-transit control | POD se vrača z zamikom | pozno fakturiranje in DSO | denarni tok | intervju + podatki | expert synthesis |
| PAIN-017 | PROC-09 | Delivery and ePOD | Status se pridobiva po telefonu | čas disponenta in slab customer service | čas/SLA | intervju + podatki | expert synthesis |
| PAIN-018 | PROC-09 | Delivery and ePOD | POD se vrača z zamikom | pozno fakturiranje in DSO | denarni tok | intervju + podatki | expert synthesis |
| PAIN-019 | PROC-10 | Freight audit | Ročna uskladitev dogodkov, cenikov in računov | visok čas ter napake | čas/kakovost | intervju + podatki | expert synthesis |
| PAIN-020 | PROC-10 | Freight audit | Neobračunani dodatki in čakanja | neposredno uhajanje prihodka | prihodek | intervju + podatki | expert synthesis |
| PAIN-021 | PROC-11 | Transport billing | Ročna uskladitev dogodkov, cenikov in računov | visok čas ter napake | čas/kakovost | intervju + podatki | expert synthesis |
| PAIN-022 | PROC-11 | Transport billing | Neobračunani dodatki in čakanja | neposredno uhajanje prihodka | prihodek | intervju + podatki | expert synthesis |
| PAIN-023 | PROC-12 | Receivables and claims | Ročna uskladitev dogodkov, cenikov in računov | visok čas ter napake | čas/kakovost | intervju + podatki | expert synthesis |
| PAIN-024 | PROC-12 | Receivables and claims | Neobračunani dodatki in čakanja | neposredno uhajanje prihodka | prihodek | intervju + podatki | expert synthesis |
| PAIN-025 | PROC-13 | Inbound appointment | Papirni nalogi in ročni premiki | nizka produktivnost in napake | čas/kakovost | intervju + podatki | expert synthesis |
| PAIN-026 | PROC-13 | Inbound appointment | Netočna lokacija ali zaloga | iskanje, ponovitve in SLA incidenti | čas/SLA | intervju + podatki | expert synthesis |
| PAIN-027 | PROC-14 | Receiving and QC | Papirni nalogi in ročni premiki | nizka produktivnost in napake | čas/kakovost | intervju + podatki | expert synthesis |
| PAIN-028 | PROC-14 | Receiving and QC | Netočna lokacija ali zaloga | iskanje, ponovitve in SLA incidenti | čas/SLA | intervju + podatki | expert synthesis |
| PAIN-029 | PROC-15 | Put-away | Papirni nalogi in ročni premiki | nizka produktivnost in napake | čas/kakovost | intervju + podatki | expert synthesis |
| PAIN-030 | PROC-15 | Put-away | Netočna lokacija ali zaloga | iskanje, ponovitve in SLA incidenti | čas/SLA | intervju + podatki | expert synthesis |
| PAIN-031 | PROC-16 | Replenishment | Papirni nalogi in ročni premiki | nizka produktivnost in napake | čas/kakovost | intervju + podatki | expert synthesis |
| PAIN-032 | PROC-16 | Replenishment | Netočna lokacija ali zaloga | iskanje, ponovitve in SLA incidenti | čas/SLA | intervju + podatki | expert synthesis |
| PAIN-033 | PROC-17 | Picking | Papirni nalogi in ročni premiki | nizka produktivnost in napake | čas/kakovost | intervju + podatki | expert synthesis |
| PAIN-034 | PROC-17 | Picking | Netočna lokacija ali zaloga | iskanje, ponovitve in SLA incidenti | čas/SLA | intervju + podatki | expert synthesis |
| PAIN-035 | PROC-18 | Packing and staging | Papirni nalogi in ročni premiki | nizka produktivnost in napake | čas/kakovost | intervju + podatki | expert synthesis |
| PAIN-036 | PROC-18 | Packing and staging | Netočna lokacija ali zaloga | iskanje, ponovitve in SLA incidenti | čas/SLA | intervju + podatki | expert synthesis |
| PAIN-037 | PROC-19 | Shipping | Papirni nalogi in ročni premiki | nizka produktivnost in napake | čas/kakovost | intervju + podatki | expert synthesis |
| PAIN-038 | PROC-19 | Shipping | Netočna lokacija ali zaloga | iskanje, ponovitve in SLA incidenti | čas/SLA | intervju + podatki | expert synthesis |
| PAIN-039 | PROC-20 | Inventory control | Papirni nalogi in ročni premiki | nizka produktivnost in napake | čas/kakovost | intervju + podatki | expert synthesis |
| PAIN-040 | PROC-20 | Inventory control | Netočna lokacija ali zaloga | iskanje, ponovitve in SLA incidenti | čas/SLA | intervju + podatki | expert synthesis |
| PAIN-041 | PROC-21 | Returns | Papirni nalogi in ročni premiki | nizka produktivnost in napake | čas/kakovost | intervju + podatki | expert synthesis |
| PAIN-042 | PROC-21 | Returns | Netočna lokacija ali zaloga | iskanje, ponovitve in SLA incidenti | čas/SLA | intervju + podatki | expert synthesis |
| PAIN-043 | PROC-22 | 3PL service billing | Operativni dogodki niso obračunski dogodki | neobračunane storitve | prihodek | intervju + podatki | expert synthesis |
| PAIN-044 | PROC-22 | 3PL service billing | Ročni izračun paleta-dni in manipulacij | zamude in spori | čas/denarni tok | intervju + podatki | expert synthesis |
| PAIN-045 | PROC-23 | Fleet maintenance | Reaktivno vzdrževanje | izpad, nujni servis in nadomestno vozilo | strošek/kapaciteta | intervju + podatki | expert synthesis |
| PAIN-046 | PROC-23 | Fleet maintenance | Telematika ni povezana s stroški | ni lastne cene in nadzora anomalij | marža/kontrola | intervju + podatki | expert synthesis |
| PAIN-047 | PROC-24 | Fuel and toll control | Gorivo in cestnine se usklajujejo ročno | čas in zamujene anomalije | čas/strošek | intervju + podatki | expert synthesis |
| PAIN-048 | PROC-24 | Fuel and toll control | Normativi niso vezani na vozilo/relacijo | slaba lastna cena | marža | intervju + podatki | expert synthesis |
| PAIN-049 | PROC-25 | Driver and workforce | Razpoložljivost voznika ni v istem planu | neizvedljiv plan in kršitve | SLA/skladnost | intervju + podatki | expert synthesis |
| PAIN-050 | PROC-25 | Driver and workforce | Znanje je odvisno od ključne osebe | operativno tveganje in počasno uvajanje | tveganje | intervju + podatki | expert synthesis |
| PAIN-051 | PROC-26 | Compliance and documents | Roki dokazil so v preglednicah | potek, kršitev ali ustavitev | skladnost | intervju + podatki | expert synthesis |
| PAIN-052 | PROC-26 | Compliance and documents | Dokazila so razpršena | dolga revizija in spori | čas/tveganje | intervju + podatki | expert synthesis |
| PAIN-053 | PROC-27 | Management reporting | KPI imajo več definicij | spori namesto odločitev | odločanje | intervju + podatki | expert synthesis |
| PAIN-054 | PROC-27 | Management reporting | Poročilo je pozno in ročno | reaktivno vodenje | čas/odločanje | intervju + podatki | expert synthesis |
| PAIN-055 | PROC-28 | Master data and integration | Točkovne integracije brez lastništva | napake, drago vzdrževanje in tehnični dolg | TCO/tveganje | intervju + podatki | expert synthesis |
| PAIN-056 | PROC-28 | Master data and integration | Šifranti niso usklajeni | duplikati in napačna analitika | kakovost podatkov | intervju + podatki | expert synthesis |

Pain statement je veljaven šele, ko ima imenovalec, obdobje in lastnika: »8 ur tedensko« je šibko; »2,8 minute ročnega dotika × 1.240 nalogov mesečno, izmerjeno na 100-nalogovnem vzorcu« je modelirljivo.

## 10. KPI slovar

| ID | KPI | Domena | Formula | Enota | Frekvenca | Omejitev | Vir |
| --- | --- | --- | --- | --- | --- | --- | --- |
| KPI-001 | Delež praznih km | transport | prazni km / skupni km | % | mesečno | ločiti domače/mednarodno in repozicioniranje | SRC-001; SRC-005 |
| KPI-002 | Delež naloženih km | transport | naloženi km / skupni km | % | mesečno | komplement KPI-001 le ob isti definiciji | SRC-001 |
| KPI-003 | Strošek na km | transport | vsi pripisani stroški / skupni km | EUR/km | mesečno | jasno ločiti variabilni, fiksni in polni strošek | expert synthesis |
| KPI-004 | Prispevek na km | transport | (prihodek - variabilni stroški) / km | EUR/km | mesečno | ne zamenjati z EBITDA/km | expert synthesis |
| KPI-005 | Prihodek na vozilo-dan | transport | transportni prihodek / razpoložljivi vozilo-dnevi | EUR | tedensko | ločiti razpoložljivo in koledarsko | expert synthesis |
| KPI-006 | OTIF | storitev | pravočasne in popolne dostave / vse dostave | % | tedensko | časovno okno in popolnost morata biti dogovorjena | multi-source |
| KPI-007 | POD latenca | finance | čas POD - čas dostave | ure/dnevi | dnevno | median in P90 sta boljša od povprečja | expert synthesis |
| KPI-008 | POD-to-invoice | finance | čas izdaje računa - čas dostave/POD | ure/dnevi | tedensko | zabeležiti dogovorjeni sprožilec računa | expert synthesis |
| KPI-009 | DSO | finance | terjatve / kreditna prodaja × dnevi | dnevi | mesečno | uporabiti konsistentno obdobje | SRC-031 |
| KPI-010 | Freight billing leakage | finance | dokazano neobračunani upravičeni zneski / upravičeni zneski | % | mesečno | zahteva audit vzorec | expert synthesis |
| KPI-011 | Bruto marža špedicije | špedicija | (prodaja prevoza - nabava prevoza) / prodaja prevoza | % | po poslu in mesečno | upoštevati dodatke in dobropise | expert synthesis |
| KPI-012 | Spot premija | špedicija | spot cena - referenčna/pogodbena cena | EUR ali % | tedensko | primerljiva relacija, oprema in datum | SRC-033 |
| KPI-013 | Čakanje na naklad/razklad | transport | minute čakanja / postanek | min | tedensko | ločiti brezplačno, zaračunano in izterjano | expert synthesis |
| KPI-014 | Izkoriščenost nosilnosti | transport | dejanski tkm / razpoložljivi tkm | % | mesečno | alternativa volumen/paletna mesta glede na omejitev | SRC-005 |
| KPI-015 | Natančnost ETA | storitev | dostave v toleranci napovedi / napovedane dostave | % | tedensko | definirati toleranco in horizont | expert synthesis |
| KPI-016 | Prvi uspešni poskus dostave | last mile | uspešne prve dostave / prvi poskusi | % | tedensko | ločiti vzrok prejemnik/naslov/izvajalec | expert synthesis |
| KPI-017 | Postanki na vozilo-uro | last mile | zaključeni postanki / vozilo-ure na terenu | # | dnevno | segmentirati urbano/ruralno | expert synthesis |
| KPI-018 | Dock-to-stock | skladišče | čas razpoložljive zaloge - prihod na rampo | ure | dnevno | upoštevati karanteno/QC ločeno | expert synthesis |
| KPI-019 | Vrstice komisioniranja na uro | skladišče | pravilno zbrane vrstice / neposredne delovne ure | #/h | izmena | segmentirati tehnologijo in profil naročil | expert synthesis |
| KPI-020 | Natančnost komisioniranja | skladišče | pravilne vrstice / vse zbrane vrstice | % | dnevno | napaka na vrstico, ne le na naročilo | expert synthesis |
| KPI-021 | Točnost zaloge | skladišče | pravilne lokacija-SKU enote / preverjene enote | % | ciklično | zahteva določeno toleranco | SRC-029; SRC-030 |
| KPI-022 | Zasedenost skladišča | skladišče | zasedene uporabne lokacije / uporabne lokacije | % | dnevno | ne uporabljati bruto m2 kot edini imenovalec | expert synthesis |
| KPI-023 | Cost per order | fulfillment | vsi pripisani fulfillment stroški / odpremljena naročila | EUR/naročilo | mesečno | ločiti profil naročila in vračila | expert synthesis |
| KPI-024 | Cost per line | fulfillment | pripisani stroški / pravilno odpremljene vrstice | EUR/vrstico | mesečno | primerljivo le ob podobnem profilu | expert synthesis |
| KPI-025 | 3PL capture rate | 3PL | obračunani upravičeni dogodki / vsi upravičeni dogodki | % | mesečno | zahteva pogodbeni katalog in dogodke | expert synthesis |
| KPI-026 | Inventory days | distribucija | povprečna zaloga / COGS × dnevi | dnevi | mesečno | uporabiti stroškovno vrednotenje | expert synthesis |
| KPI-027 | Cash-to-cash | distribucija | DIO + DSO - DPO | dnevi | mesečno | ne seštevati sprostitve zaloge z letnim dobičkom | multi-source |
| KPI-028 | Vehicle uptime | flota | razpoložljive ure / planirane ure | % | tedensko | definirati planirano razpoložljivost | expert synthesis |
| KPI-029 | Neplanirani izpadi | flota | ure neplaniranega izpada / vozilo | h/vozilo | mesečno | ločiti nesreče in vzdrževanje | expert synthesis |
| KPI-030 | Poraba goriva | flota | litri / 100 km | l/100km | tedensko | segmentirati vozilo, tovor, relacijo, sezono | SRC-032 |
| KPI-031 | Delež digitalno zajetih dogodkov | digital | dogodki brez naknadnega ročnega vnosa / vsi ključni dogodki | % | mesečno | strukturiran dogodek, ne sken PDF | SRC-029 |
| KPI-032 | Integracijske napake | IT | neuspele/karantenske transakcije / vse transakcije | % | dnevno | meriti tudi čas do razrešitve | expert synthesis |
| KPI-033 | Čas priprave poročila | vodstvo | ure od konca obdobja do potrjenega poročila | h/dni | mesečno | ločiti refresh od reconciliacije | expert synthesis |
| KPI-034 | Stopnja reklamacij | kakovost | upravičene reklamacije / pošiljke | % | mesečno | po vzroku in odgovornosti | expert synthesis |
| KPI-035 | Neto strošek škod | kakovost | škode - povračila - regres | EUR | mesečno | ne dvojno šteti procesnih ur | expert synthesis |
| KPI-036 | CO2e na tkm | trajnost | well-to-wheel CO2e / tkm | gCO2e/tkm | mesečno | meje in metodologija po ISO 14083 | SRC-027 |

## 11. Register benchmarkov

| ID | Kazalnik | Vrednost | Enota | Obdobje | Pravilna uporaba | Razred | Vir |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BM-001 | Slovenija cestni prevoz: delež praznih km | 20 | % | 2025 | kontekst, ne odpravljiv potencial | uradni | SRC-001 |
| BM-002 | EU cestni prevoz: delež praznih km | 21.6 | % | 2024 | vsa potovanja; domače 25,8 %, mednarodno 12,6 % | uradni | SRC-005 |
| BM-003 | Slovenija cestni prevoz: masa | 97.3 | mio t | 2025 | vozila registrirana v Sloveniji | uradni | SRC-001 |
| BM-004 | Slovenija cestni prevoz: transportno delo | 19.5082 | mrd tkm | 2025 | vozila registrirana v Sloveniji | uradni | SRC-001 |
| BM-005 | Slovenija cestni prevoz: mednarodni delež tkm | 87 | % | 2025 | ni enako deležu prihodkov | uradni | SRC-001 |
| BM-006 | Slovenija cestni prevoz: cross-trade delež tkm | 36 | % | 2025 | operacije med tujimi državami | uradni | SRC-001 |
| BM-007 | EU povprečen tovor na naloženo vozilo | 14.3 | t | 2024 | ne predstavlja kapacitete ali cilja za posamezno podjetje | uradni | SRC-005 |
| BM-008 | Slovenija povprečen domači tovor | 5.8 | t | 2024 | strukturno odvisno od blaga/relacije; ni prihranek | uradni | SRC-005 |
| BM-009 | Slovenija železniški tovor | 17.254 | mio t | 2025 | 87 % v mednarodnem prometu vključno s tranzitom | uradni | SRC-007 |
| BM-010 | Slovenija železniško transportno delo | 4295.1 | mio tkm | 2025 | -6,0 % medletno | uradni | SRC-007 |
| BM-011 | SKD H - podjetja | 9843 | # | 2024 | končna objava; SiStat velikostna tabela kaže 9.845 | uradni | SRC-003; SRC-004 |
| BM-012 | SKD H - zaposleni in samozaposleni | 56909 | # | 2024 | agregat H49-H53 | uradni | SRC-003 |
| BM-013 | SKD H - prihodek | 8760 | mio EUR | 2024 | agregat H; heterogena dejavnost | uradni | SRC-003 |
| BM-014 | SKD H - dodana vrednost | 3122 | mio EUR | 2024 | agregat H | uradni | SRC-003 |
| BM-015 | SKD H - bruto investicije | 876 | mio EUR | 2024 | agregat H; -11,2 % medletno | uradni | SRC-003 |
| BM-016 | SKD H podjetja 10-49 | 731 | # | 2024 | javni velikostni razred; ni enako cilju 20-49 | uradni | SRC-004 |
| BM-017 | SKD H podjetja 50-249 | 103 | # | 2024 | v celoti znotraj ciljnega 20-500 | uradni | SRC-004 |
| BM-018 | SKD H podjetja 250+ | 19 | # | 2024 | ni javnega izreza 250-500 | uradni | SRC-004 |
| BM-019 | Slovenski transport/skladiščenje: kupljen cloud ERP | 23 | % | 2024 | delež podjetij dejavnosti | uradni | SRC-009 |
| BM-020 | Slovenski transport/skladiščenje: uporaba AI | 9 | % | 2024 | AI za logistiko le 2 % vseh podjetij | uradni | SRC-009 |
| BM-021 | EU transport/skladiščenje: uporaba AI | 11.15 | % | 2025 | delež podjetij z 10+ zaposlenimi | uradni | SRC-010 |
| BM-022 | EU transport/skladiščenje: advanced/intermediate cloud | 41 | % | 2025 | digitalna zrelost; ne učinkovitost procesa | uradni | SRC-011 |
| BM-023 | Evropa: ocenjena vrzel voznikov | 502000 | # | 2025 | IRU poročilo; panogna ocena | panogni | SRC-013 |
| BM-024 | Transport kot delež incidentov ENISA | 7.5 | % | 2025 | opazovani incidenti; ne verjetnost za podjetje | uradni | SRC-024 |
| BM-025 | Podjetja z izzivi poznih plačil | 52 | % | 2024 | evropska podjetja v opazovanju | uradni | SRC-031 |

Benchmarki se uporabljajo za sanity check, segmentacijo in oblikovanje vprašanja. Ne uporabljajo se kot avtomatska ciljna vrednost ali odstotek prihranka. Če je podjetje boljše od agregata, to ni dokaz optimalnosti; če je slabše, razlika ni v celoti odpravljiva.

## 12. Finančni register in pravila dvojnega štetja

| ID | Naziv | Formula | Izhod | Vhodi | Opozorilo |
| --- | --- | --- | --- | --- | --- |
| F-001 | Letni strošek ročnega dela | količina × min/enoto / 60 × polni strošek ure | EUR/leto | min/enoto; količina; EUR/h | ločiti sprostljivo kapaciteto in dejanski cash saving |
| F-002 | Strošek praznih km | prazni km × relevantni variabilni strošek/km | EUR/leto | km; EUR/km | ne uporabiti polnega stroška, če fiksni stroški ostanejo |
| F-003 | Odpravljiv strošek praznih km | F-002 × tehnični potencial × pokritost × sprejetje × realizacija | EUR/leto | pet faktorjev | prazni km niso v celoti odpravljivi |
| F-004 | Strošek čakanja | ure × (neto strošek voznika/h + relevantni vozilo-strošek/h) - zaračunano in izterjano | EUR/leto | h; EUR/h; EUR | ločiti oportunitetni in neposredni strošek |
| F-005 | Billing leakage | upravičeni neobračunani dodatki + napačne tarife - pozneje izterjano | EUR/leto | EUR | zahteva audit vzorec |
| F-006 | POD zamik - obratni kapital | letni kreditni prihodek × zmanjšanje dni / 365 | EUR sprostitve | EUR/leto; dnevi | ni letni dobiček |
| F-007 | Letni finančni učinek sprostitve terjatev | F-006 × mejni strošek kapitala | EUR/leto | EUR; % | ne prišteti celotne sprostitve k letni koristi |
| F-008 | Sprostitev zaloge | povprečna zaloga × realno zmanjšanje % | EUR sprostitve | EUR; % | samo lastnik zaloge |
| F-009 | Letni carrying-cost prihranek | F-008 × stopnja financiranja in držanja | EUR/leto | EUR; % | stopnja mora imeti dokumentirane komponente |
| F-010 | Neto strošek škode | bruto škoda + procesni stroški - zavarovanje - regres - dobropisi dobaviteljev | EUR/leto | EUR | procesne ure naj ne bodo vključene še v F-001 |
| F-011 | 3PL revenue capture | upravičeni dogodki × tarifa - že obračunano | EUR/leto | dogodki; EUR/dogodek | omejiti na pogodbeno upravičene dogodke |
| F-012 | Povečanje pretoka | dodatne pravilne enote × prispevek/enoto | EUR/leto | enote; EUR/enoto | uporabiti le ob dokazljivem povpraševanju/kapacitetni omejitvi |
| F-013 | Prihranek nujnih prevozov | (premija nad standardom) × zmanjšano število | EUR/leto | EUR; # | ne celoten strošek nujnega prevoza |
| F-014 | Prihranek spot nabave | primerljive nabave × dokazano zmanjšanje premije | EUR/leto | #; EUR | kontrolirati trg, relacijo in opremo |
| F-015 | Časovna korist | sproščene ure × realizacijski faktor × strošek/h | EUR/leto | h; %; EUR/h | realizacija 0 %, če ni spremembe kapacitete/stroška |
| F-016 | Bruto letna korist | vsota medsebojno izključujočih realiziranih koristi | EUR/leto | koristi | uporabiti register dvojnega štetja |
| F-017 | Letni neto učinek | bruto korist - tekoči TCO - dodatni operativni stroški | EUR/leto | EUR | ne vključiti začetnega CAPEX v vsako leto |
| F-018 | Začetna investicija | licence + implementacija + integracije + oprema + migracija + usposabljanje + notranje ure | EUR | EUR | vključiti kontingenčni dodatek |
| F-019 | Payback | začetna investicija / stabilizirani letni neto učinek × 12 | mesecev | EUR; EUR/leto | za fazni ramp-up uporabiti kumulativni cash flow |
| F-020 | Enostavni ROI 3 leta | (3-letne koristi - 3-letni TCO) / 3-letni TCO | % | EUR | ločiti od NPV |
| F-021 | NPV | vsota neto denarnih tokov_t / (1+r)^t | EUR | cash flow; diskontna mera | vključi leto 0 |
| F-022 | IRR | diskontna mera, pri kateri je NPV=0 | % | cash flow | poročati le ob smiselni spremembi predznaka |
| F-023 | Benefit realization | trenutna izguba × tehnični potencial × pokritost × sprejetje × realizacija | EUR/leto | EUR; 4 × % | osnovni mehanizem konservativne ocene |
| F-024 | P10/P50/P90 scenarij | isti model z nizkimi/srednjimi/visokimi vhodnimi faktorji | EUR | razponi | ne prikazovati P90 kot obljubo |
| F-025 | Ocena kakovosti podatka | vir × aktualnost × sledljivost × vzorec | 0-100 | ocene | kvalitativni score, ne statistična gotovost |

### 12.1 Kontrole dvojnega štetja

| ID | Korist A | Korist B | Pravilo |
| --- | --- | --- | --- |
| DC-01 | Ročne ure reklamacij | Neto strošek škode | Izberi: procesne ure v F-001 ali znotraj F-010, nikoli oboje |
| DC-02 | Strošek praznih km | Dodatni prihodek iz nove kapacitete | Osnovni scenarij uporabi strošek ali prispevek; oba le ob dokazano različnih km |
| DC-03 | Sprostitev zaloge | Letni carrying-cost prihranek | Prvo je enkratni cash-flow, drugo letna korist |
| DC-04 | Sprostitev terjatev | Znižanje DSO - letna korist | Kapital je enkratni učinek; letni učinek je strošek kapitala |
| DC-05 | Čas disponenta | Več obdelanih nalogov | Ure vrednoti kot strošek ali kot prispevek dodatnega volumna |
| DC-06 | Strošek nujnega prevoza | Spot premija | Prihranek je premija nad standardom, ne celoten prevoz |
| DC-07 | Neobračunan dodatek | Bruto marža izboljšave | Isti prihodek naj bo v enem benefit line-u |
| DC-08 | Točnost zaloge | Zmanjšanje inventurnih razlik | Ne seštevaj ocenjene vrednosti iste izgube iz dveh metod |
| DC-09 | Nadure | Sproščene redne ure | Uporabi dejansko zmanjšane nadure pred teoretično vrednostjo vseh ur |
| DC-10 | Manj reklamacij | Višji customer-service NPS/prihodek | Trdi benefit in rast prihodka loči v scenarije |
| DC-11 | Nižji TCO aplikacij | Manj internih IT ur | Če so interne ure že v TCO, jih ne dodajaj posebej |
| DC-12 | CO2e zmanjšanje | Prihranek goriva | Okoljski kazalnik naj ne postane dodaten EUR benefit brez ločene cene ogljika |

### 12.2 Klasifikacija koristi

1. **Cash cost-out:** zmanjšani računi, nadure, podizvajalci, premije, škode ali FTE; najmočnejši dokaz.
2. **Revenue capture/margin protection:** že upravičen, a neobračunan prihodek ali preprečen popust; potreben pogodbeni dokaz.
3. **Capacity release:** ure ali prostor, ki omogočijo več obsega ali odložijo investicijo; brez realizacije ni cash saving.
4. **Working-capital release:** enkratna sprostitev zaloge/terjatev; letna korist je le strošek kapitala/držanja.
5. **Risk avoidance:** scenarijska pričakovana vrednost; ne vključiti v konservativni osnovni rezultat brez frekvence in verjetnosti.
6. **Intangible:** sledljivost, izkušnja, odločanje; poročati ločeno, dokler ni monetizacije.

# III. Digitalizacija, rešitve in nakupno vedenje

## 13. Digitalna zrelost 0-5

Ocenjuje se dvanajst dimenzij: procesna standardizacija, master data, zajem ob viru, integracije, real-time dogodki, izjeme/workflow, analitika, finančna sled, mobilnost, varnost, podatkovno upravljanje in spremembe/kompetence.

| Raven | Opis | Dokaz |
| --- | --- | --- |
| 0 | Proces ni definiran; uspeh je odvisen od posameznika | ni lastnika, ni imenovalca |
| 1 | Papir/Excel/e-pošta; naknadni vnos | ročni vzorec in lokalne datoteke |
| 2 | Posamezne aplikacije; omejene povezave | osnovni sistemski izvoz |
| 3 | Integriran transakcijski tok; kontrolirane izjeme | korelacijski ID in audit trail |
| 4 | Dogodkovno vodena optimizacija in napovedi | real-time SLA, alerti, feedback loop |
| 5 | Adaptivno, avtomatizirano in stalno izboljševanje | zaprta zanka ukrep-rezultat-učenje |

V Sloveniji je leta 2024 v transportu/skladiščenju 23 % podjetij kupovalo cloud ERP, 9 % jih je uporabljalo AI, le 2 % vseh podjetij dejavnosti pa AI za logistiko. To so signali relativno zgodnje zrelosti, ne diagnoza konkretnega podjetja. [SURS](https://www.stat.si/StatWeb/en/News/Index/14340)

## 14. Tehnološki ekosistem in referenčne arhitekture

### 14.1 Plasti

- **ERP/finance:** partnerji, naročila, zaloge, računovodstvo, računi, davki, sredstva, HR.
- **TMS:** pošiljke, tarife, tendering, planiranje, dispatch, status, freight audit.
- **WMS/WES:** lokacije, tasking, waves, picking, replenishment, avtomatizacija.
- **Telematika/FMS:** GPS, vozilo, gorivo, tahograf, diagnostika, maintenance.
- **DMS/e-document:** pogodbe, POD/CMR, dokazila, e-računi, arhiv.
- **Integration/event hub:** API/EDI, mapiranje, korelacija, retry, nadzor kakovosti.
- **BI/AI:** semantični KPI model, napovedi, optimizacija in pomoč uporabniku.

### 14.2 Arhitekturno načelo

PANTHEON naj bo finančno-komercialno jedro tam, kjer ustreza; specialistični sistem naj vodi proces, za katerega je namenjen; integracija pa naj prenaša minimalne, dobro definirane objekte in dogodke. Dvojno vzdrževanje istih šifrantov brez lastnika je dražje od same licence.

## 15. PANTHEON fit in meje

| ID | Zmožnost | Kategorija | Interpretacija | Vir |
| --- | --- | --- | --- | --- |
| CAP-001 | Glavna knjiga, terjatve, obveznosti | neposredno | ERP jedro in lokalna skladnost | SRC-035 |
| CAP-002 | Prodajna in nabavna naročila | neposredno | integriran komercialni tok | SRC-035 |
| CAP-003 | Izdaja računov in dobropisov | neposredno | povezati z dokazano izvedbo | SRC-035 |
| CAP-004 | Zaloge in več skladišč | neposredno | stanje, prenosi, dokumenti | SRC-035; SRC-036 |
| CAP-005 | Serije, loti in serijske številke | neposredno | sledljivost na ERP ravni | SRC-035; SRC-036 |
| CAP-006 | Inventura | neposredno/granula | namenska granula; preveriti verzijo in obseg | SRC-038 |
| CAP-007 | DMS in dokumenti | neposredno | pogodbe, POD, dokazila; workflow preveriti | SRC-035 |
| CAP-008 | Osnovni BI in poročanje | neposredno | upravljavski pogled iz ERP podatkov | SRC-035 |
| CAP-009 | Plače, kadri, odsotnosti | neposredno | HR administracija; operativni roster zahteva povezavo | SRC-035 |
| CAP-010 | Osnovna sredstva in vozila kot sredstva | neposredno | računovodska evidenca; ni FMS | SRC-035 |
| CAP-011 | Mobilno skladiščno skeniranje | partner/granula | PanScan/PanStore ali druga rešitev; potrditi funkcionalni obseg | SRC-044 |
| CAP-012 | 3PL obračun dogodkov | partner/integracija | dogodki iz WMS/TMS v ERP tarife | expert synthesis |
| CAP-013 | EDI/API povezave | Connector/integracija | avtomatske zunanje povezave zahtevajo ustrezno licenco | SRC-037 |
| CAP-014 | Telematika in GPS sledenje | integracija | specialistični FMS/telematski vir | expert synthesis |
| CAP-015 | ePOD/voznikova aplikacija | partner/integracija | mobilna izvedba in prenos POD v DMS/ERP | expert synthesis |
| CAP-016 | TMS planiranje tur | specialist | ni javnega dokaza o nativnem celovitem TMS | SRC-035; SRC-044 |
| CAP-017 | Optimizacija poti | specialist | algoritemsko planiranje izven ERP jedra | SRC-041 |
| CAP-018 | Carrier tendering/procurement | specialist | nabava prevoznikov in tenderji izven javno opisanega jedra | SRC-041 |
| CAP-019 | Freight audit | integracija/specialist | primerjava pogodbe, dogodkov in računov | expert synthesis |
| CAP-020 | Napredni WMS tasking/waves/slotting | specialist/integracija | ERP skladišče ni enako naprednemu WMS | SRC-040 |
| CAP-021 | Yard/dock management | specialist | sloti, vrata in dvorišče | SRC-040 |
| CAP-022 | Robotika/AMR/MHE orchestration | specialist/integracija | izvedbena plast WES/WCS | expert synthesis |
| CAP-023 | eFTI certificirana platforma | specialist | certificiranje in zakonska vloga nista ERP funkcija | SRC-014; SRC-015 |
| CAP-024 | eCMR omrežje | specialist/integracija | strukturiran eCMR in izmenjava z deležniki | SRC-018 |
| CAP-025 | Napredno ETA napovedovanje | specialist | zahteva telematiko, promet in model | expert synthesis |
| CAP-026 | ISO 14083 emisijski izračun | integracija/specialist | metoda in podatki; možno poročanje v BI | SRC-027 |
| CAP-027 | Kibernetski SOC/SIEM | specialist | organizacijska in varnostna platforma | SRC-023; SRC-024 |

Kategorije so zavezujoče za prodajno komunikacijo: **neposredno**, **partner/granula**, **Connector/integracija**, **procesna sprememba** ali **specialist**. Napredno optimiranje poti, polni TMS, telematika, carrier tendering, napredni WMS tasking, eFTI-certificirana platforma in eCMR omrežje se brez aktualnega uradnega dokaza ne smejo predstavljati kot nativni PANTHEON.

Priloženi Datalab kontekst navaja licence LX, LT, SE, ME, MF, MT, RT, RE, AC, GE ter področja Web in Connector. Cene v prilogi so iz 1. 7. 2022, zato se v ROI modelu ne uporabljajo kot aktualen TCO; pridobiti je treba veljavno ponudbo, verzijo, uporabnike, sočasnost, podatkovno bazo, partnerja, SLA in strošek nadgradenj.

## 16. Primerjalni okvir konkurence

Konkurenca se primerja po ravni, ne z enim seznamom funkcij:

| Raven | Primeri | Glavno vprašanje |
| --- | --- | --- |
| ERP za MSP | PANTHEON, Business Central, SAP Business One, SAOP | lokalna skladnost, finance, zaloge, partnerji, TCO |
| Enterprise suite | Dynamics 365 SCM, SAP S/4 + EWM/TM | globina, globalni model, kompleksnost in TCO |
| Specialist TMS/WMS | regionalni/globalni ponudniki | operativna globina, algoritmi, mobilnost, avtomatizacija |
| Telematika/FMS | OEM in neodvisni ponudniki | podatki vozila, tahograf, gorivo, SLA integracije |
| Dokumenti/eCMR/eFTI | certificirane in panožne platforme | pravna veljavnost, omrežje, interoperabilnost |

Microsoftovi uradni opisi WMS in TMS so uporabna referenca za razlikovanje naprednih funkcij od osnovnega ERP skladišča, ne dokaz primernosti za vsak SME. [WMS](https://learn.microsoft.com/en-us/dynamics365/supply-chain/warehousing/warehouse-management-overview) [TMS](https://learn.microsoft.com/en-us/dynamics365/supply-chain/transportation/transportation-management-overview)

## 17. Nakupno vedenje in discovery

Tipični sprožilci so rast ali nova lokacija, izguba ključne osebe, večje reklamacije, zamenjava strežniške/ERP platforme, integracija kupca, nov 3PL pogodbeni model, zahteva po emisijah, eFTI/e-računi ali akvizicija. Ugovori so: strah pred prekinitvijo, dvom v podatke, nejasen integracijski TCO, utrujenost po preteklem projektu, pomanjkanje notranje ekipe in dvom, ali se bodo uporabniki prilagodili.

Prodajna metoda naj zato zahteva: baseline, procesnega lastnika, podatkovni vzorec, prihodnje stanje, mapping zmožnosti, TCO, plan spremembe, lastnika koristi in 30/60/90-dnevne meritve.

## 18. VOC knjižnica - hipoteze

| ID | Persona | Hipotetična izjava | Tema | Status |
| --- | --- | --- | --- | --- |
| VOC-001 | direktor | Ne vem, kje dejansko zaslužimo in kje samo vozimo. | marža po poslu/stranki | hipoteza - preveriti v intervjujih |
| VOC-002 | disponent | Če mene ni, nihče nima celotne slike. | odvisnost od ključne osebe | hipoteza - preveriti |
| VOC-003 | finance | Račun čaka, ker še ni CMR-ja. | POD-to-invoice | hipoteza - preveriti |
| VOC-004 | vodja skladišča | Zaloga v sistemu in na lokaciji nista vedno ista zgodba. | točnost zaloge | hipoteza - preveriti |
| VOC-005 | customer service | Status iščemo pri vozniku in nato kličemo stranko nazaj. | vidljivost dogodkov | hipoteza - preveriti |
| VOC-006 | špediter | Maržo izgubimo v dodatkih, ki jih ne prenesemo naprej. | billing leakage | hipoteza - preveriti |
| VOC-007 | IT | Vsaka nova povezava je nov projekt in nova točka okvare. | integracijski dolg | hipoteza - preveriti |
| VOC-008 | voznik | Iste podatke vpisujem v papir, telefon in aplikacijo. | podvojeni zajem | hipoteza - preveriti |
| VOC-009 | 3PL finance | Vemo, kaj smo naredili, ne pa vedno, ali smo vse zaračunali. | 3PL capture rate | hipoteza - preveriti |
| VOC-010 | kakovost | Dokazila so, samo hitro jih ne najdemo. | audit trail | hipoteza - preveriti |
| VOC-011 | last mile | Druga dostava nam poje ekonomiko prve. | first-attempt delivery | hipoteza - preveriti |
| VOC-012 | direktor | Nočem še enega sistema brez jasnega učinka. | ROI in arhitektura | hipoteza - preveriti |

Te povedi niso resnični citati strank. So raziskovalne hipoteze za intervjuje, oglase in vprašalnik; pred zunanjo uporabo jih je treba potrditi in po potrebi nadomestiti z dovoljenimi, anonimiziranimi izjavami.

## 19. Regulativni register

| ID | Obveznost | Območje | Rok/stanje | Kaj pomeni | Podatkovni vpliv | Vir |
| --- | --- | --- | --- | --- | --- | --- |
| REG-01 | eFTI | EU | 9. 7. 2027 polna uporaba | Organi morajo sprejeti podatke prek certificiranih platform; operator digitalni kanal uporablja prostovoljno | strukturirani regulativni podatki; platforma; audit | SRC-014; SRC-015 |
| REG-02 | eCMR protokol | UNECE/pogodbenice | veljavno; Slovenija sodeluje | Elektronski CMR; ni isto kot eFTI | eCMR ponudnik, identiteta, celovitost, izmenjava | SRC-018 |
| REG-03 | Pametni tahograf v2 | EU | 19. 8. 2025 mednarodne operacije; LCV od 1. 7. 2026 | Evidenca in oprema glede na vozilo/operacijo | tahograf; vozilo; voznik; hramba | SRC-016 |
| REG-04 | Časi vožnje in počitka | EU | stalno | 9 h/dan, 10 h dvakrat tedensko; 56 h/teden; 90 h/2 tedna; odmor 45 min po 4,5 h | plan mora poznati pravila in dejanske podatke | SRC-017 |
| REG-05 | ICS2 Release 3 | EU carina | 1. 9. 2025 | Varnostni podatki za vse načine, vključno cesta/železnica | carinski podatki, ENS, statusi in izjeme | SRC-019 |
| REG-06 | ADR 2025 | UNECE/EU | 1. 1. 2025 | Klasifikacija, embalaža, dokumenti, oprema in kompetence | dangerous-goods master data in dokazila | SRC-020 |
| REG-07 | Sledljivost hrane | EU | stalno | Korak nazaj/naprej skozi proizvodnjo, predelavo in distribucijo | GTIN/lot/SSCC, dogodki, partnerji | SRC-021; SRC-030 |
| REG-08 | GDP farmacija | EU | stalno | Kakovost distribucije in dokazovanje pogojev | temperature, kalibracije, odstopanja, CAPA | SRC-022 |
| REG-09 | NIS2 | EU + nacionalni prenos | veljavno; obseg po subjektu | Transport in pošta/kurirji sta zajeta sektorja, vendar ne avtomatično vsak SME | asset register, incidenti, dobavitelji, kontinuiteta | SRC-023 |
| REG-10 | ETS2 | EU | polno delovanje 2028 | Regulirani so upstream dobavitelji goriv; prevozniki občutijo cenovni signal | scenarij goriva, CO2e in pogodbeni dodatki | SRC-025 |
| REG-11 | CSRD po Omnibusu | EU | 2026 zožen obseg | Zakonski obseg je ožji; veliki kupci lahko pogodbeno zahtevajo emisijske podatke | podatki ISO 14083 in izvor | SRC-026; SRC-027 |
| REG-12 | AFIR | EU | fazni cilji | Omrežje polnilne/vodikove infrastrukture za TEN-T in urbana vozlišča | lokacije, energija, plan dosega | SRC-028 |
| REG-13 | Obvezni domači B2B e-računi RS | Slovenija | 1. 1. 2028 | Izmenjava e-računov za poslovne subjekte pri domačih transakcijah | strukturirani računi, procesne kontrole, arhiv | SRC-034 |

Pomembni ločnici: eFTI ni eCMR; NIS2 ne zajame samodejno vsakega prevozniškega MSP; ETS2 primarno regulira dobavitelje goriv; zožen CSRD ne odpravi pogodbenih zahtev velikih kupcev po emisijskih podatkih.

## 20. Kibernetska varnost in kontinuiteta

Transport je bil v ENISA Threat Landscape 2025 drugi najbolj izpostavljen sektor z 7,5 % opazovanih incidentov; phishing je predstavljal 60 % začetnega dostopa, ransomware pa je ostal najvplivnejša grožnja. [ENISA](https://www.enisa.europa.eu/news/etl-2025-eu-consistently-targeted-by-diverse-yet-convergent-threat-groups) Operativni načrt mora zajeti identitete/MFA, segmentacijo, varnostne kopije in obnovo, dobavitelje/API ključe, offline postopke, incident response ter vaje. V ROI se to poroča predvsem kot obvladovanje tveganja, ne kot zagotovljen letni prihranek.

## 21. Trajnost in razogljičenje

ISO 14083 daje skupno metodologijo za GHG transportnih verig. Podatkovni minimum je energent/energija, količina, razdalja, masa ali druga enota dela, vozilo/način, prazni in naloženi deli, geografske meje ter emisijski faktor z virom. [ISO](https://www.iso.org/standard/78864.html) Gorivni prihranek in CO2e zmanjšanje sta pogosto isti fizični učinek; finančno korist goriva in okoljski KPI je treba ločiti, da se korist ne šteje dvakrat.

## 22. Trendi 2026-2030

1. Strukturirani dokumenti in dogodki: eFTI 2027, domači B2B e-računi 2028, eCMR in API-ekosistemi.
2. Razširjena vidljivost: ETA, exception management, customer self-service in EPCIS-podobni dogodki.
3. Avtomatizacija skladišč: mobilno skeniranje, tasking, slotting, AMR/robotika, vendar samo ob kakovostnem master data.
4. AI kot plast odločanja: ekstrakcija naročil, napoved zamud, priporočila, anomaly detection; human-in-the-loop pri denarju, varnosti in skladnosti.
5. Pomanjkanje kadrov: produktivnost, standardizacija in hitrejše uvajanje ljudi.
6. Emisijski podatki: ISO 14083, pogodbeni podatki kupcev, scenariji ETS2 in elektrifikacija.
7. Platformna konsolidacija: manj nepovezanih aplikacij, več jasnih system-of-record meja in nadzora integracij.

# IV. Pretvorba raziskave v sisteme

## 23. Hitra diagnostika 5-7 minut

| ID | Globina | Domena | Vprašanje | Tip | Pogoj | Namen | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Q-001 | quick | segment | Kateri poslovni modeli predstavljajo vsaj 10 % prihodkov ali operativnega obsega? | multi-select | vsi | določi veje | obvezno |
| Q-002 | quick | obseg | Koliko zaposlenih, vozil, skladišč, pošiljk/naročil in računov imate v zadnjih 12 mesecih? | numeric-group | vsi | normalizacija | obvezno |
| Q-003 | quick | sistemi | Katere sisteme dejansko uporabljate: ERP, TMS, WMS, telematika, DMS, BI, portali? | multi-select | vsi | zrelost in integracije | obvezno |
| Q-004 | quick | bolečina | Katera tri področja povzročajo največ stroška, zamude ali tveganja? | rank | vsi | prioritizacija | obvezno |
| Q-005 | quick | podatki | Za katere izbrane probleme imate 12-mesečni podatek ali vzorec? | multi-select | vsi | confidence | obvezno |
| Q-006 | quick | finance | Kolikšen je približen letni neposredni strošek izbranih problemov brez vrednosti teoretičnih ur? | currency | vsi | conservative baseline | opcijsko |
| Q-007 | quick | odločitev | Ali obstaja rok, sponzor in okvirni proračun za spremembo v 12 mesecih? | choice | vsi | ICP | obvezno |

Hiter rezultat je razpon stroška sedanjega stanja in prioriteta procesov, ne ROI. Uporabnik dobi tri najmočnejše hipoteze, manjkajoče podatke in naslednji korak.

## 24. Podrobni audit 15-25 minut

Audit se razveja le v aktivne procese. Vpraša po količini × času/napaki/denarju, viru, obdobju, lastniku in načinu realizacije. Celoten strojno berljiv katalog je v XLSX; spodaj je vzorec.

| ID | Globina | Domena | Vprašanje | Tip | Pogoj | Namen | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Q-008 | audit | prodaja | Kolikšen je 12-mesečni obseg za proces »Lead-to-quote« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-01 | normalizacija | pogojno |
| Q-009 | audit | prodaja | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Lead-to-quote« in iz katerega vira to veste? | numeric+source | PROC-01 | baseline + confidence | pogojno |
| Q-010 | audit | komerciala | Kolikšen je 12-mesečni obseg za proces »Order capture« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-02 | normalizacija | pogojno |
| Q-011 | audit | komerciala | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Order capture« in iz katerega vira to veste? | numeric+source | PROC-02 | baseline + confidence | pogojno |
| Q-012 | audit | transport | Kolikšen je 12-mesečni obseg za proces »Capacity planning« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-03 | normalizacija | pogojno |
| Q-013 | audit | transport | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Capacity planning« in iz katerega vira to veste? | numeric+source | PROC-03 | baseline + confidence | pogojno |
| Q-014 | audit | transport | Kolikšen je 12-mesečni obseg za proces »Load and route planning« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-04 | normalizacija | pogojno |
| Q-015 | audit | transport | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Load and route planning« in iz katerega vira to veste? | numeric+source | PROC-04 | baseline + confidence | pogojno |
| Q-016 | audit | transport | Kolikšen je 12-mesečni obseg za proces »Dispatch« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-05 | normalizacija | pogojno |
| Q-017 | audit | transport | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Dispatch« in iz katerega vira to veste? | numeric+source | PROC-05 | baseline + confidence | pogojno |
| Q-018 | audit | špedicija | Kolikšen je 12-mesečni obseg za proces »Subcarrier procurement« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-06 | normalizacija | pogojno |
| Q-019 | audit | špedicija | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Subcarrier procurement« in iz katerega vira to veste? | numeric+source | PROC-06 | baseline + confidence | pogojno |
| Q-020 | audit | izvedba | Kolikšen je 12-mesečni obseg za proces »Pickup and loading« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-07 | normalizacija | pogojno |
| Q-021 | audit | izvedba | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Pickup and loading« in iz katerega vira to veste? | numeric+source | PROC-07 | baseline + confidence | pogojno |
| Q-022 | audit | izvedba | Kolikšen je 12-mesečni obseg za proces »In-transit control« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-08 | normalizacija | pogojno |
| Q-023 | audit | izvedba | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »In-transit control« in iz katerega vira to veste? | numeric+source | PROC-08 | baseline + confidence | pogojno |
| Q-024 | audit | izvedba | Kolikšen je 12-mesečni obseg za proces »Delivery and ePOD« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-09 | normalizacija | pogojno |
| Q-025 | audit | izvedba | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Delivery and ePOD« in iz katerega vira to veste? | numeric+source | PROC-09 | baseline + confidence | pogojno |
| Q-026 | audit | finance | Kolikšen je 12-mesečni obseg za proces »Freight audit« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-10 | normalizacija | pogojno |
| Q-027 | audit | finance | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Freight audit« in iz katerega vira to veste? | numeric+source | PROC-10 | baseline + confidence | pogojno |

## 25. Pravila razvejanja

| ID | Pogoj | Akcija | Kontrola |
| --- | --- | --- | --- |
| BR-01 | Q-001 vsebuje SEG-01 ali SEG-02 | prikaži transport/flota/tahograf veje | ne prikazuj praznih km špediterju brez flote |
| BR-02 | Q-001 vsebuje SEG-03 | prikaži carrier procurement, maržo in freight audit | naročena cena in prodajna cena sta obvezni |
| BR-03 | Q-001 vsebuje SEG-04 ali SEG-05 | prikaži 13-22 | ločiti tujo in lastno zalogo |
| BR-04 | Q-001 vsebuje SEG-06 | prikaži zalogo, OTIF, cash-to-cash | sprostitev zaloge le za lastno zalogo |
| BR-05 | Q-001 vsebuje SEG-07 | prikaži postanke, first-attempt, COD, vračila | gostota in urbano/ruralno obvezna |
| BR-06 | Q-001 vsebuje SEG-08/09/10 | prikaži terminal, demurrage/detention, carino/ICS2 | multimodalni dodatki |
| BR-07 | Q-001 vsebuje SEG-11 | prikaži temperature, odstopanja, GDP/food traceability | zahtevaj lastništvo senzorjev in kalibracijo |
| BR-08 | Q-001 vsebuje SEG-12 | prikaži ADR/dovoljenja/spremstvo | dokazila in kompetence |
| BR-09 | Q-003 ne vsebuje ERP | najprej jedro ERP/finance/master data | ne predlagaj kompleksne analitike brez transakcijskega jedra |
| BR-10 | Q-003 vsebuje PANTHEON | oceni direktno/partner/integracija/specialist | ne pripisuj nativnega TMS/WMS brez potrditve |
| BR-11 | Q-005 = brez podatkov | rezultat označi P90 negotovost; predlagaj 4-tedenski baseline | ne prikazuj ozkega razpona |
| BR-12 | korist = ure | vprašaj način realizacije | 0 % cash realization brez zmanjšanja nadur/FTE/outsourcinga |
| BR-13 | korist = obratni kapital | ločeno poročaj cash release in letni cost-of-capital | ne prištevaj obeh kot letni benefit |
| BR-14 | vsaj dve koristi delita isti vzrok/podatke | sproži DC kontrolni pregled | lastnik koristi potrdi primarni benefit |
| BR-15 | payback < 3 mesece ali benefit > baseline izgube | blokiraj objavo in zahtevaj revizijo | outlier check |

## 26. ICP in lead scoring

| ID | Kriterij | Teža | Ocenjevanje | Vir |
| --- | --- | --- | --- | --- |
| ICP-01 | 20-500 zaposlenih oziroma operativna kompleksnost | 10 | 0=izven; 5=delno; 10=cilj | firmografija |
| ICP-02 | Več poslovnih enot/skladišč/držav | 8 | 0=enostavno; 8=več enot | firmografija/intervju |
| ICP-03 | Transakcijski volumen | 10 | 0=nizek; 10=visok glede na segment | operativni podatki |
| ICP-04 | Ročni dotiki in Excel odvisnost | 10 | 0=digitalno; 10=visoko ročno | diagnostika |
| ICP-05 | Finančno merljiva bolečina | 12 | 0=hipoteza; 12=podprta z 12-mesečnimi podatki | diagnostika/audit |
| ICP-06 | PANTHEON nameščen ali jasen ERP gap | 8 | 0=brez relevantnosti; 8=visoka relevantnost | technographics |
| ICP-07 | Integracijska pripravljenost | 7 | 0=blokirano; 7=API/lastnik/podatki | IT discovery |
| ICP-08 | Dogodek/rok (eFTI, e-računi, rast, menjava sistema) | 8 | 0=ni; 8=<12 mesecev | signal |
| ICP-09 | Ekonomski kupec in procesni lastnik sodelujeta | 10 | 0=ne; 10=da | prodajni proces |
| ICP-10 | Kapaciteta za uvedbo in spremembo | 7 | 0=ni; 7=ekipa + sponzor | discovery |
| ICP-11 | Dokazljivost in dostop do podatkov | 10 | 0=brez; 10=izvoz/vir/definicije | data audit |

Skupni rezultat je 0-100. Predlagana interpretacija: 80-100 SQL z obveznim podatkovnim auditom; 60-79 MQL/discovery; 40-59 nurture z vsebinskim playbookom; <40 izobraževalni tok. Dve hard-gate pravili sta ločeni od točk: brez ekonomskega kupca ali brez poti do podatkov se kompleksni ROI business case ne izdela.

## 27. ROI motor

Osnovna enačba je:

`realizirana korist = trenutna izguba × tehnični potencial × pokritost rešitve × sprejetje × realizacija`

Vsak faktor ima vir in razpon. P10 uporablja konservativni baseline in nizke faktorje; P50 najverjetnejše; P90 je optimističen scenarij, ki se ne predstavlja kot obljuba. TCO vključuje licenco, implementacijo, integracije, opremo, migracijo, usposabljanje, notranje ure, podporo, infrastrukturo in kontingenco. Cash flow modelira leto 0 ter najmanj 36 mesecev z ramp-upom koristi.

### 27.1 Minimalne kontrolne enačbe

- realizirana korist ne sme preseči naslovljive baseline izgube;
- seštevek razporeditev stroška ne sme presegati 100 %;
- cash realization ur je 0 %, dokler ni določen mehanizem: nadure, outsourcing, FTE ali odložena zaposlitev;
- benefit iz kapitala je ločen od P&L koristi;
- payback <3 mesece, benefit >5 % prihodka ali >100 % baseline izgube sproži ročni review;
- dinamični stroški, kot je gorivo, se osvežujejo iz aktualnega vira ali podjetniškega P&L, ne iz statičnega benchmarka.

## 28. Implementacijski playbook in AI agenti

### 28.1 Faze

1. **Diagnostika:** segment, procesi, baseline, podatki in sponzor.
2. **Blueprint:** future state, system-of-record, integracije, kontrolne točke, KPI in odgovornosti.
3. **Pilot:** ena enota/tok, 4-8 tednov baseline, omejen obseg, dnevni issue log.
4. **Stabilizacija:** adoption, kakovost podatkov, finančna reconciliacija in varnost.
5. **Širitev:** dodatne enote/moduli šele po potrjenem učinku.
6. **Benefit realization:** mesečni owner review 3-12 mesecev po go-live.

### 28.2 Vloge AI-agentov

- raziskovalni agent klasificira podjetje in zbira javne signale z datumom/virom;
- diagnostični agent izbira vprašanja po branching pravilih;
- data-quality agent preverja imenovalce, obdobja, dvojnike in outlierje;
- ROI agent uporablja samo potrjene formule, scenarije in double-counting register;
- solution agent predlaga neposredno PANTHEON, partnerja, integracijo, procesno spremembo ali specialista;
- compliance agent spremlja roke, vendar zahteva pravno/človeško potrditev;
- content agent uporablja le dovoljene dokaze in VOC hipoteze jasno označi.

Agenti ne smejo samostojno obljubljati prihranka, pravne skladnosti ali nativne funkcije izdelka. Vsak izhod mora nositi evidence class, datum in reviewerja.

---

# Strukturirane priloge

## A. Podatkovni slovar

| ID | Entiteta | Polje/dogodek | Lastnik | Vir | Frekvenca | Pravilo |
| --- | --- | --- | --- | --- | --- | --- |
| DATA-001 | Partner | partner_id | MDM/ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-002 | Partner | davčna | MDM/ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-003 | Partner | vloge | MDM/ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-004 | Partner | naslovi | MDM/ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-005 | Partner | pogoji | MDM/ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-006 | Lokacija | location_id | MDM/TMS/WMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-007 | Lokacija | geokoordinate | MDM/TMS/WMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-008 | Lokacija | časovna okna | MDM/TMS/WMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-009 | Lokacija | tip | MDM/TMS/WMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-010 | Artikel/SKU | sku_id | ERP/WMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-011 | Artikel/SKU | GTIN | ERP/WMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-012 | Artikel/SKU | teža | ERP/WMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-013 | Artikel/SKU | volumen | ERP/WMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-014 | Artikel/SKU | lot/serija | ERP/WMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-015 | Artikel/SKU | režim | ERP/WMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-016 | Naročilo | order_id | ERP/OMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-017 | Naročilo | stranka | ERP/OMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-018 | Naročilo | roki | ERP/OMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-019 | Naročilo | vrstice | ERP/OMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-020 | Naročilo | Incoterm | ERP/OMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-021 | Pošiljka | shipment_id | TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-022 | Pošiljka | order_id | TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-023 | Pošiljka | od/do | TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-024 | Pošiljka | količine | TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-025 | Pošiljka | SLA | TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-026 | Tura | trip_id | TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-027 | Tura | vozilo | TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-028 | Tura | voznik | TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-029 | Tura | postanki | TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-030 | Tura | plan/actual km | TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-031 | Vozilo | vehicle_id | FMS/TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-032 | Vozilo | tip | FMS/TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-033 | Vozilo | kapacitete | FMS/TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-034 | Vozilo | emisijski razred | FMS/TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-035 | Vozilo | status | FMS/TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-036 | Voznik | driver_id | HR/TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-037 | Voznik | kompetence | HR/TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-038 | Voznik | razpoložljivost | HR/TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-039 | Voznik | tahograf | HR/TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-040 | Prevoznik | carrier_id | TMS/ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-041 | Prevoznik | licence | TMS/ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-042 | Prevoznik | tarife | TMS/ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-043 | Prevoznik | zanesljivost | TMS/ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-044 | Skladišče | warehouse_id | WMS/ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-045 | Skladišče | cone | WMS/ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-046 | Skladišče | vrata | WMS/ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-047 | Skladišče | koledar | WMS/ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-048 | Lokacija zaloge | bin_id | WMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-049 | Lokacija zaloge | cone | WMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-050 | Lokacija zaloge | kapaciteta | WMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-051 | Lokacija zaloge | pravila | WMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-052 | Enota zaloge | SSCC | WMS/ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-053 | Enota zaloge | SKU | WMS/ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-054 | Enota zaloge | lot | WMS/ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-055 | Enota zaloge | serija | WMS/ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-056 | Enota zaloge | količina | WMS/ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-057 | Enota zaloge | status | WMS/ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-058 | Operativni dogodek | event_id | event hub/EPCIS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-059 | Operativni dogodek | tip | event hub/EPCIS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-060 | Operativni dogodek | objekt | event hub/EPCIS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-061 | Operativni dogodek | čas | event hub/EPCIS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-062 | Operativni dogodek | lokacija | event hub/EPCIS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-063 | Operativni dogodek | vir | event hub/EPCIS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-064 | POD/CMR | document_id | DMS/TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-065 | POD/CMR | shipment_id | DMS/TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-066 | POD/CMR | podpis | DMS/TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-067 | POD/CMR | čas | DMS/TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-068 | POD/CMR | verzija | DMS/TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-069 | Tarifa | rate_id | ERP/TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-070 | Tarifa | veljavnost | ERP/TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-071 | Tarifa | osnova | ERP/TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-072 | Tarifa | dodatki | ERP/TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-073 | Tarifa | valute | ERP/TMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-074 | Stroškovni dogodek | cost_id | ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-075 | Stroškovni dogodek | objekt | ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-076 | Stroškovni dogodek | kategorija | ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-077 | Stroškovni dogodek | znesek | ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-078 | Stroškovni dogodek | dokazilo | ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-079 | Račun | invoice_id | ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-080 | Račun | partner | ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-081 | Račun | postavke | ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-082 | Račun | davki | ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-083 | Račun | roki | ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-084 | Račun | status | ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-085 | Reklamacija | claim_id | CRM/ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-086 | Reklamacija | vzrok | CRM/ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-087 | Reklamacija | odgovornost | CRM/ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-088 | Reklamacija | zneski | CRM/ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-089 | Reklamacija | dokazila | CRM/ERP | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-090 | Meritev temperature | sensor_id | IoT/QMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-091 | Meritev temperature | shipment/SSCC | IoT/QMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-092 | Meritev temperature | čas | IoT/QMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-093 | Meritev temperature | vrednost | IoT/QMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-094 | Meritev temperature | alarm | IoT/QMS | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-095 | Integracijsko sporočilo | message_id | iPaaS/log | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-096 | Integracijsko sporočilo | sistem | iPaaS/log | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-097 | Integracijsko sporočilo | korelacija | iPaaS/log | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-098 | Integracijsko sporočilo | status | iPaaS/log | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-099 | Integracijsko sporočilo | napaka | iPaaS/log | sistemski ali potrjen uporabniški vnos | ob dogodku/spremembi | obvezno za procesne KPI-je |
| DATA-100 | Dogodek | order.created | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-101 | Dogodek | order.confirmed | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-102 | Dogodek | shipment.planned | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-103 | Dogodek | carrier.accepted | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-104 | Dogodek | vehicle.assigned | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-105 | Dogodek | pickup.arrived | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-106 | Dogodek | pickup.completed | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-107 | Dogodek | in_transit.location | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-108 | Dogodek | exception.raised | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-109 | Dogodek | delivery.arrived | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-110 | Dogodek | delivery.completed | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-111 | Dogodek | pod.received | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-112 | Dogodek | invoice.eligible | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-113 | Dogodek | invoice.issued | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-114 | Dogodek | payment.received | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-115 | Dogodek | asn.received | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-116 | Dogodek | dock.assigned | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-117 | Dogodek | goods.received | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-118 | Dogodek | qc.completed | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-119 | Dogodek | putaway.completed | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-120 | Dogodek | inventory.adjusted | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-121 | Dogodek | pick.started | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-122 | Dogodek | pick.completed | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-123 | Dogodek | pack.completed | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-124 | Dogodek | shipment.loaded | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-125 | Dogodek | return.received | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-126 | Dogodek | claim.opened | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-127 | Dogodek | claim.closed | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-128 | Dogodek | maintenance.due | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |
| DATA-129 | Dogodek | integration.failed | procesni sistem/event hub | samodejno, z actor/source ID | real-time | čas, objekt in korelacijski ID obvezni |

## B. Celotna banka vprašanj

| ID | Globina | Domena | Vprašanje | Tip | Pogoj | Namen | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Q-001 | quick | segment | Kateri poslovni modeli predstavljajo vsaj 10 % prihodkov ali operativnega obsega? | multi-select | vsi | določi veje | obvezno |
| Q-002 | quick | obseg | Koliko zaposlenih, vozil, skladišč, pošiljk/naročil in računov imate v zadnjih 12 mesecih? | numeric-group | vsi | normalizacija | obvezno |
| Q-003 | quick | sistemi | Katere sisteme dejansko uporabljate: ERP, TMS, WMS, telematika, DMS, BI, portali? | multi-select | vsi | zrelost in integracije | obvezno |
| Q-004 | quick | bolečina | Katera tri področja povzročajo največ stroška, zamude ali tveganja? | rank | vsi | prioritizacija | obvezno |
| Q-005 | quick | podatki | Za katere izbrane probleme imate 12-mesečni podatek ali vzorec? | multi-select | vsi | confidence | obvezno |
| Q-006 | quick | finance | Kolikšen je približen letni neposredni strošek izbranih problemov brez vrednosti teoretičnih ur? | currency | vsi | conservative baseline | opcijsko |
| Q-007 | quick | odločitev | Ali obstaja rok, sponzor in okvirni proračun za spremembo v 12 mesecih? | choice | vsi | ICP | obvezno |
| Q-008 | audit | prodaja | Kolikšen je 12-mesečni obseg za proces »Lead-to-quote« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-01 | normalizacija | pogojno |
| Q-009 | audit | prodaja | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Lead-to-quote« in iz katerega vira to veste? | numeric+source | PROC-01 | baseline + confidence | pogojno |
| Q-010 | audit | komerciala | Kolikšen je 12-mesečni obseg za proces »Order capture« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-02 | normalizacija | pogojno |
| Q-011 | audit | komerciala | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Order capture« in iz katerega vira to veste? | numeric+source | PROC-02 | baseline + confidence | pogojno |
| Q-012 | audit | transport | Kolikšen je 12-mesečni obseg za proces »Capacity planning« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-03 | normalizacija | pogojno |
| Q-013 | audit | transport | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Capacity planning« in iz katerega vira to veste? | numeric+source | PROC-03 | baseline + confidence | pogojno |
| Q-014 | audit | transport | Kolikšen je 12-mesečni obseg za proces »Load and route planning« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-04 | normalizacija | pogojno |
| Q-015 | audit | transport | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Load and route planning« in iz katerega vira to veste? | numeric+source | PROC-04 | baseline + confidence | pogojno |
| Q-016 | audit | transport | Kolikšen je 12-mesečni obseg za proces »Dispatch« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-05 | normalizacija | pogojno |
| Q-017 | audit | transport | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Dispatch« in iz katerega vira to veste? | numeric+source | PROC-05 | baseline + confidence | pogojno |
| Q-018 | audit | špedicija | Kolikšen je 12-mesečni obseg za proces »Subcarrier procurement« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-06 | normalizacija | pogojno |
| Q-019 | audit | špedicija | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Subcarrier procurement« in iz katerega vira to veste? | numeric+source | PROC-06 | baseline + confidence | pogojno |
| Q-020 | audit | izvedba | Kolikšen je 12-mesečni obseg za proces »Pickup and loading« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-07 | normalizacija | pogojno |
| Q-021 | audit | izvedba | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Pickup and loading« in iz katerega vira to veste? | numeric+source | PROC-07 | baseline + confidence | pogojno |
| Q-022 | audit | izvedba | Kolikšen je 12-mesečni obseg za proces »In-transit control« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-08 | normalizacija | pogojno |
| Q-023 | audit | izvedba | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »In-transit control« in iz katerega vira to veste? | numeric+source | PROC-08 | baseline + confidence | pogojno |
| Q-024 | audit | izvedba | Kolikšen je 12-mesečni obseg za proces »Delivery and ePOD« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-09 | normalizacija | pogojno |
| Q-025 | audit | izvedba | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Delivery and ePOD« in iz katerega vira to veste? | numeric+source | PROC-09 | baseline + confidence | pogojno |
| Q-026 | audit | finance | Kolikšen je 12-mesečni obseg za proces »Freight audit« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-10 | normalizacija | pogojno |
| Q-027 | audit | finance | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Freight audit« in iz katerega vira to veste? | numeric+source | PROC-10 | baseline + confidence | pogojno |
| Q-028 | audit | finance | Kolikšen je 12-mesečni obseg za proces »Transport billing« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-11 | normalizacija | pogojno |
| Q-029 | audit | finance | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Transport billing« in iz katerega vira to veste? | numeric+source | PROC-11 | baseline + confidence | pogojno |
| Q-030 | audit | finance | Kolikšen je 12-mesečni obseg za proces »Receivables and claims« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-12 | normalizacija | pogojno |
| Q-031 | audit | finance | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Receivables and claims« in iz katerega vira to veste? | numeric+source | PROC-12 | baseline + confidence | pogojno |
| Q-032 | audit | skladišče | Kolikšen je 12-mesečni obseg za proces »Inbound appointment« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-13 | normalizacija | pogojno |
| Q-033 | audit | skladišče | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Inbound appointment« in iz katerega vira to veste? | numeric+source | PROC-13 | baseline + confidence | pogojno |
| Q-034 | audit | skladišče | Kolikšen je 12-mesečni obseg za proces »Receiving and QC« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-14 | normalizacija | pogojno |
| Q-035 | audit | skladišče | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Receiving and QC« in iz katerega vira to veste? | numeric+source | PROC-14 | baseline + confidence | pogojno |
| Q-036 | audit | skladišče | Kolikšen je 12-mesečni obseg za proces »Put-away« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-15 | normalizacija | pogojno |
| Q-037 | audit | skladišče | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Put-away« in iz katerega vira to veste? | numeric+source | PROC-15 | baseline + confidence | pogojno |
| Q-038 | audit | skladišče | Kolikšen je 12-mesečni obseg za proces »Replenishment« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-16 | normalizacija | pogojno |
| Q-039 | audit | skladišče | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Replenishment« in iz katerega vira to veste? | numeric+source | PROC-16 | baseline + confidence | pogojno |
| Q-040 | audit | skladišče | Kolikšen je 12-mesečni obseg za proces »Picking« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-17 | normalizacija | pogojno |
| Q-041 | audit | skladišče | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Picking« in iz katerega vira to veste? | numeric+source | PROC-17 | baseline + confidence | pogojno |
| Q-042 | audit | skladišče | Kolikšen je 12-mesečni obseg za proces »Packing and staging« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-18 | normalizacija | pogojno |
| Q-043 | audit | skladišče | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Packing and staging« in iz katerega vira to veste? | numeric+source | PROC-18 | baseline + confidence | pogojno |
| Q-044 | audit | skladišče | Kolikšen je 12-mesečni obseg za proces »Shipping« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-19 | normalizacija | pogojno |
| Q-045 | audit | skladišče | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Shipping« in iz katerega vira to veste? | numeric+source | PROC-19 | baseline + confidence | pogojno |
| Q-046 | audit | skladišče | Kolikšen je 12-mesečni obseg za proces »Inventory control« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-20 | normalizacija | pogojno |
| Q-047 | audit | skladišče | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Inventory control« in iz katerega vira to veste? | numeric+source | PROC-20 | baseline + confidence | pogojno |
| Q-048 | audit | skladišče | Kolikšen je 12-mesečni obseg za proces »Returns« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-21 | normalizacija | pogojno |
| Q-049 | audit | skladišče | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Returns« in iz katerega vira to veste? | numeric+source | PROC-21 | baseline + confidence | pogojno |
| Q-050 | audit | 3PL finance | Kolikšen je 12-mesečni obseg za proces »3PL service billing« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-22 | normalizacija | pogojno |
| Q-051 | audit | 3PL finance | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »3PL service billing« in iz katerega vira to veste? | numeric+source | PROC-22 | baseline + confidence | pogojno |
| Q-052 | audit | flota | Kolikšen je 12-mesečni obseg za proces »Fleet maintenance« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-23 | normalizacija | pogojno |
| Q-053 | audit | flota | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Fleet maintenance« in iz katerega vira to veste? | numeric+source | PROC-23 | baseline + confidence | pogojno |
| Q-054 | audit | flota/finance | Kolikšen je 12-mesečni obseg za proces »Fuel and toll control« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-24 | normalizacija | pogojno |
| Q-055 | audit | flota/finance | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Fuel and toll control« in iz katerega vira to veste? | numeric+source | PROC-24 | baseline + confidence | pogojno |
| Q-056 | audit | HR/transport | Kolikšen je 12-mesečni obseg za proces »Driver and workforce« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-25 | normalizacija | pogojno |
| Q-057 | audit | HR/transport | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Driver and workforce« in iz katerega vira to veste? | numeric+source | PROC-25 | baseline + confidence | pogojno |
| Q-058 | audit | skladnost | Kolikšen je 12-mesečni obseg za proces »Compliance and documents« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-26 | normalizacija | pogojno |
| Q-059 | audit | skladnost | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Compliance and documents« in iz katerega vira to veste? | numeric+source | PROC-26 | baseline + confidence | pogojno |
| Q-060 | audit | vodstvo | Kolikšen je 12-mesečni obseg za proces »Management reporting« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-27 | normalizacija | pogojno |
| Q-061 | audit | vodstvo | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Management reporting« in iz katerega vira to veste? | numeric+source | PROC-27 | baseline + confidence | pogojno |
| Q-062 | audit | IT | Kolikšen je 12-mesečni obseg za proces »Master data and integration« in kateri imenovalec ga najbolje pojasni? | numeric+unit | PROC-28 | normalizacija | pogojno |
| Q-063 | audit | IT | Koliko časa, napak, zamud ali neobračunanih zneskov nastane v procesu »Master data and integration« in iz katerega vira to veste? | numeric+source | PROC-28 | baseline + confidence | pogojno |
| Q-064 | solution | ROI | Kateri stroški uvedbe so potrjeni: licence, storitve, integracije, oprema, migracija, usposabljanje, interne ure? | currency-group | vsi | TCO | obvezno za ROI |
| Q-065 | solution | ROI | Kakšen je pričakovani ramp-up koristi v mesecih 1-36? | percentage-series | vsi | cash flow | obvezno za NPV |
| Q-066 | solution | ROI | Katera korist bo realizirana kot nižji cash cost, katera kot kapaciteta in katera kot enkratni kapital? | classification | vsi | preprečevanje dvojnega štetja | obvezno |

## C. Raziskovalne vrzeli

| ID | Vrzel | Predlagani vir/metoda | Prioriteta | Razlog |
| --- | --- | --- | --- | --- |
| GAP-01 | Natančen TAM 20-500 zaposlenih po arhetipu | AJPES/Poslovni register + SKD + spletno bogatenje | visoka | Javni SURS razredi so 10-49, 50-249, 250+ |
| GAP-02 | Podjetniški strošek/km po tipu vozila/relaciji | anonimizirani fleet P&L vzorec | visoka | Javni tržni podatki niso strošek posameznega podjetja |
| GAP-03 | POD-to-invoice in billing leakage | ERP/TMS audit 20-30 podjetij | visoka | Ni zanesljivega javnega benchmarka za ciljni trg |
| GAP-04 | WMS produktivnost po profilu naročila | WMS event logs + delovne ure | visoka | Vrstice/h brez profila niso primerljive |
| GAP-05 | 3PL capture rate | pogodbe + dogodki + računi | visoka | Komercialno občutljivo in specifično |
| GAP-06 | PANTHEON funkcionalni obseg po verziji/licenci | uradna aktualna licenčna matrika + demo test | visoka | Interni kontekst vsebuje tudi cene iz 2022 |
| GAP-07 | Dejanski učinki PANTHEON logističnih referenc | strukturirani case interviews | visoka | Javne reference ne podpirajo kvantitativnih rezultatov |
| GAP-08 | VOC po personah in državah | 30-50 intervjujev, kodiranje izjav | srednja | Sedanji VOC je hipoteza, ne citat |
| GAP-09 | Digitalna zrelost SI/HR/RS/BA/MK | primerljiv survey ali enrichment | srednja | Uradni podatki niso vedno enako granularni |
| GAP-10 | Willingness-to-pay in nakupni proces | win/loss + conjoint/price interviews | srednja | Ne sklepati iz ROI potenciala |

## D. Register virov

| ID | Izdajatelj | Naslov | Datum | Razred | Uporaba |
| --- | --- | --- | --- | --- | --- |
| SRC-001 | SURS | Cestni blagovni prevoz, 2025 | 2026-05-14 | uradni | [povezava](https://www.stat.si/StatWeb/News/Index/14304) |
| SRC-002 | SURS | Cestni blagovni prevoz, 2024 | 2025-05-15 | uradni | [povezava](https://www.stat.si/StatWeb/news/Index/13587) |
| SRC-003 | SURS | Uspešnost podjetij po dejavnostih, 2024 - končni podatki | 2026-05-26 | uradni | [povezava](https://www.stat.si/StatWeb/en/News/Index/14354) |
| SRC-004 | SURS SiStat | Podjetja po dejavnosti in velikosti, 2024 | 2026 | uradni | [povezava](https://pxweb.stat.si/SiStat/en/Home/DownloadPxMatrix?pxMatrixName=1418801S) |
| SRC-005 | Eurostat | Road freight transport by journey characteristics | 2026 | uradni | [povezava](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Road_freight_transport_by_journey_characteristics) |
| SRC-006 | Eurostat | Freight transport statistics - modal split | 2026 | uradni | [povezava](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Freight_transport_statistics_-_modal_split) |
| SRC-007 | SURS | Železniški prevoz, 2025 | 2026-07-09 | uradni | [povezava](https://www.stat.si/StatWeb/en/News/Index/14438) |
| SRC-008 | Luka Koper | Annual report 2025 | 2026 | uradni | [povezava](https://www.luka-kp.si/wp-content/uploads/2026/04/LK-LP-2025-ENG-v_FIN-res.pdf) |
| SRC-009 | SURS | World ICT Day 2026 | 2026-05-15 | uradni | [povezava](https://www.stat.si/StatWeb/en/News/Index/14340) |
| SRC-010 | Eurostat | Use of AI in enterprises, 2025 | 2026 | uradni | [povezava](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Use_of_artificial_intelligence_in_enterprises) |
| SRC-011 | Eurostat | Towards Digital Decade targets | 2026 | uradni | [povezava](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Towards_Digital_Decade_targets_for_Europe) |
| SRC-012 | EURES | Labour shortages and surpluses in Europe | 2025 | uradni | [povezava](https://eures.europa.eu/living-and-working/labour-shortages-and-surpluses-europe_en) |
| SRC-013 | IRU | Global truck driver shortage report | 2026 | panogni | [povezava](https://www.iru.org/news-resources/newsroom/operators-deeply-concerned-worsening-driver-shortage-new-iru-report) |
| SRC-014 | Evropska komisija | eFTI Regulation | 2026 | uradni | [povezava](https://transport.ec.europa.eu/transport-themes/logistics-and-multimodal-transport/efti-regulation_en) |
| SRC-015 | Evropska komisija | eFTI implementation timeline | 2025-01-09 | uradni | [povezava](https://transport.ec.europa.eu/news-events/news/towards-paperless-freight-transport-eu-takes-step-forward-efti-regulation-implementation-2025-01-09_en) |
| SRC-016 | Evropska komisija | Tachograph | 2026 | uradni | [povezava](https://transport.ec.europa.eu/transport-modes/road/tachograph_en) |
| SRC-017 | Evropska komisija | Driving time and rest periods | 2026 | uradni | [povezava](https://transport.ec.europa.eu/transport-modes/road/social-provisions/driving-time-and-rest-periods_en) |
| SRC-018 | UNECE | eCMR business requirements | 2023 | uradni | [povezava](https://unece.org/sites/default/files/2023-09/BRS%20eCMR_v1.0_0.pdf) |
| SRC-019 | Evropska komisija | ICS2 Release 3 | 2025-08-29 | uradni | [povezava](https://taxation-customs.ec.europa.eu/news/transition-ics2-release-3-complete-limited-temporary-derogations-some-member-states-2025-08-29_en) |
| SRC-020 | UNECE | ADR 2025 files | 2025 | uradni | [povezava](https://unece.org/adr-2025-files) |
| SRC-021 | Evropska komisija | General Food Law - traceability | 2026 | uradni | [povezava](https://food.ec.europa.eu/horizontal-topics/general-food-law/food-law-general-requirements_en) |
| SRC-022 | EMA | Good distribution practice | 2026 | uradni | [povezava](https://www.ema.europa.eu/en/human-regulatory-overview/post-authorisation/compliance-post-authorisation/good-distribution-practice) |
| SRC-023 | Evropska komisija | NIS2 FAQ | 2026 | uradni | [povezava](https://digital-strategy.ec.europa.eu/en/faqs/directive-measures-high-common-level-cybersecurity-across-union-nis2-directive-faqs) |
| SRC-024 | ENISA | Threat Landscape 2025 | 2025 | uradni | [povezava](https://www.enisa.europa.eu/news/etl-2025-eu-consistently-targeted-by-diverse-yet-convergent-threat-groups) |
| SRC-025 | Evropska komisija | ETS2 | 2026 | uradni | [povezava](https://climate.ec.europa.eu/areas-action/carbon-markets/ets2-buildings-road-transport-and-additional-sectors_en) |
| SRC-026 | Svet EU | Omnibus - CSRD/CSDDD simplification | 2026-02-24 | uradni | [povezava](https://www.consilium.europa.eu/en/press/press-releases/2026/02/24/council-signs-off-simplification-of-sustainability-reporting-and-due-diligence-requirements-to-boost-eu-competitiveness/) |
| SRC-027 | ISO | ISO 14083:2023 | 2023 | standard | [povezava](https://www.iso.org/standard/78864.html) |
| SRC-028 | Evropska komisija | AFIR | 2026 | uradni | [povezava](https://transport.ec.europa.eu/transport-themes/clean-transport/alternative-fuels-sustainable-mobility-europe/alternative-fuels-infrastructure_en) |
| SRC-029 | GS1 | EPCIS and CBV | 2026 | standard | [povezava](https://www.gs1.org/standards/epcis) |
| SRC-030 | GS1 | Global Traceability Standard | 2026 | standard | [povezava](https://www.gs1.org/standards/gs1-global-traceability-standard/current-standard) |
| SRC-031 | EU Payment Observatory | Annual report summary 2025 | 2025 | uradni | [povezava](https://single-market-economy.ec.europa.eu/document/download/8aabc383-52ce-49a9-a197-b4c49dc79a64_en?filename=Summary+2025.pdf) |
| SRC-032 | Evropska komisija | Weekly Oil Bulletin | 2026 | uradni | [povezava](https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en) |
| SRC-033 | IRU | European road freight rates Q4 2025 | 2026 | panogni | [povezava](https://www.iru.org/news-resources/newsroom/european-road-freight-rates-q4-2025-contract-rates-spot-rates-steady) |
| SRC-034 | Ministrstvo za finance RS | Zakon o izmenjavi e-računov | 2025-10-23 | uradni | [povezava](https://www.gov.si/novice/2025-10-23-drzavni-zbor-sprejel-zakon-o-izmenjavi-elektronskih-racunov-in-drugih-elektronskih-dokumentov/) |
| SRC-035 | Datalab | PANTHEON Enterprise | 2026 | ponudnik | [povezava](https://www.datalab.eu/pantheon/enterprise/) |
| SRC-036 | Datalab | PANTHEON - zaloge in integracije | 2026 | ponudnik | [povezava](https://www.datalab.eu/?amp%3Bp=71205&post_type=pantheon) |
| SRC-037 | Datalab | PANTHEON Connector FAQ | 2026 | ponudnik | [povezava](https://www.datalab.eu/support/faq/?cat-id=101&faq-id=9262) |
| SRC-038 | Datalab | Inventura skladišč | 2026 | ponudnik | [povezava](https://www.datalab.si/pantheon-granule/granula-inventura-skladisc/) |
| SRC-039 | Datalab | Europacific reference story | 2026 | ponudnik | [povezava](https://www.datalab.eu/stories/europacific-logistika-d-o-o/) |
| SRC-040 | Microsoft | Dynamics 365 Warehouse Management | 2026 | ponudnik | [povezava](https://learn.microsoft.com/en-us/dynamics365/supply-chain/warehousing/warehouse-management-overview) |
| SRC-041 | Microsoft | Dynamics 365 Transportation Management | 2026 | ponudnik | [povezava](https://learn.microsoft.com/en-us/dynamics365/supply-chain/transportation/transportation-management-overview) |
| SRC-042 | SAP | SAP Business One logistics learning | 2026 | ponudnik | [povezava](https://learning.sap.com/courses/managing-logistics-in-sap-business-one) |
| SRC-043 | Microsoft | Dynamics 365 Business Central | 2026 | ponudnik | [povezava](https://www.microsoft.com/en-us/dynamics-365/products/business-central) |
| SRC-044 | Datalab kontekst | Priložena interna raziskovalna osnova | 2026-08-07 | interni | lokalna priloga: Datalab_kontekst.md |

## E. Metodološke omejitve

- Javni agregati opisujejo populacijo, ne posameznega podjetja; ne uporabljajo se kot obljuba učinka.
- Podatki različnih let so označeni in se ne mešajo v eno časovno vrsto brez metodološkega pregleda.
- Viri ponudnikov potrjujejo opisane funkcije, ne neodvisno izmerjenih poslovnih rezultatov.
- PANTHEON reference Europacific potrjuje obstoj uporabe, ne podpira pa javno preverljive kvantifikacije učinka.
- Cene licenc iz priloženega konteksta so iz 2022 in so zastarele za aktualni TCO.
- VOC stavki so hipoteze, dokler niso potrjeni v intervjujih.
- Sekundarni trgi potrebujejo ločeno pravno, cenovno in produktno lokalizacijo; slovenski podatki se ne preslikajo samodejno.
- Dokument je poslovno-raziskovalna osnova, ne pravno, davčno, varnostno ali investicijsko jamstvo.

---

**Konec dokumenta.** Operativne matrike, formule in kontrolni model so v spremljajočem XLSX. PDF je oblikovana različica istega vsebinskega jedra.
