# Naslovljivi deleži: zakaj prav te številke

**Utemeljitev koeficientov v kalkulatorju izgub · Datalab · avgust 2026**

Kalkulator izmeri celoten strošek problema, nato ga pomnoži z enim samim koeficientom —
**naslovljivim deležem** — ki pove, kolikšen del tega stroška je z boljšimi procesi sploh
dosegljiv. Ta dokument pojasni, od kod je vsaka od šestih vrednosti in zakaj prav ta, ne
sosednja.

Napisan je tako, da lahko vsako številko preverite sami: ob vsaki je vir in letnica, in ob
vsaki je zapisano, kaj bi jo ovrglo.

---

## 1. Kaj naslovljivi delež je

Vsak izračun izgube ima dva dela. Prvi je **meritev**: koliko ta problem stane danes.
Drugi je **ocena**: koliko od tega je mogoče odpraviti.

Meritev pride od vas — ure, količine, zneski. Ocena pride od nas, in prav ta je tu
utemeljena.

Delamo jo **enkrat samo**. Kalkulator ne veriži popravkov (»×0,8 za tveganje uvedbe, ×0,9
za prehodno obdobje, ×0,85 za …«), ker se ob treh ali štirih takih zaporednih množenjih
rezultat prepolovi, ne da bi kdorkoli znal povedati, katero od njih je za to krivo. En
koeficient je mogoče zagovarjati; veriga koeficientov ni.

Delimo jo po **glavnem vzroku**, ker se odpravljivost po vzroku močno razlikuje. Če ista
ura dela izgine zato, ker podatek prepisujete med dvema sistemoma, je to nekaj drugega,
kot če izgine zato, ker se je pokvaril stroj. Kalkulator zato vpraša, kaj je glavni vzrok,
in uporabi vrednost za tisto kategorijo.

Ena postavka koeficienta **ne** dobi: sprostljivi kapital v zalogah. Tam ste namreč sami
ocenili, koliko zaloge bi trajno lahko bilo manj — ta znesek je torej že potencial, ne
sedanji strošek, in dodatno množenje bi ga znižalo dvakrat.

---

## 2. Pet pravil, po katerih je vsaka številka izbrana

Pravila so bila postavljena **pred** številkami. To je pomembno: brez njih se za vsako
vrednost najde nekaj, kar jo podpira, in dokument postane zbirka izgovorov namesto
izpeljave.

| | Pravilo | Zakaj | Kaj je z njim izpadlo |
|---|---|---|---|
| **P1** | **Ujemanje osnove.** Imenovalec meritve mora biti isti problem, ki ga merimo mi — ne cela funkcija in ne celoten strošek podjetja. | »Za 13 % nižji administrativni strošek« in »za 75 % manj ročne priprave poročil« sta lahko ista stvar, izražena z različnim imenovalcem. | Hackettovih **−45 %**: meri strošek celotne finančne funkcije, ne posamezne naloge. |
| **P2** | **Ujemanje posega.** Meritev mora meriti to, kar stranka dobi — informacijski sistem — in ne večletnega programa preoblikovanja. | Vsak poseg ima svoj domet. Sistem uredi podatek in postopek; kulture in tehnologije ne zamenja. | Celovit TPM z **−70 %** okvar: to je dveletni program preoblikovanja vzdrževanja. |
| **P3** | **Ujemanje populacije.** Velja izid povprečnega podjetja, ne najboljšega decila. | Obiskovalec kalkulatorja je naključno podjetje, ne prvak panoge. | Ardentovih **−78 %** (od ročnega postopka do najboljših v panogi). |
| **P4** | **Neodvisnost vira.** Meritve, ki jih plača ponudnik programske opreme, veljajo samo kot **zgornja meja**, nikoli kot sredina. | Merijo stranke, ki so posel sklenile in uvedbo dokončale — to ni povprečje trga. | Znižanja plačilnih rokov nad **−30 %**. |
| **P5** | **Smer napake.** Ob širokem pasu vzemi vrednost pod sredino, ne nad njo. | Previsoka ocena se pokaže čez leto dni, ko je zaupanje že vloženo. Prenizka pomeni manjšo številko, ki pa zdrži. | Zaokroževanje navzgor. |

Vsako od izpadlih dokazov bi katero od naših številk **zvišalo**. Navedeni so zato, da
vidite, da so bili tudi zavrnjeni, ne le zbrani.

---

## 3. Izpeljava po kategorijah

### 3.1 Vzrok je v podatkih → 0,65

*Podatki v več sistemih, ročni prepisi med orodji, papirne listine, ročno sestavljena
poročila, nesledljivo blago.* Najpogostejša kategorija — 43 % vseh vzrokov, ki jih
kalkulator ponudi.

Tri sidra prestanejo pravilo P1:

| Meritev | Vrednost | Vir |
|---|---|---|
| Strošek obdelave enega prejetega računa, povprečje → najboljši | 9,40 → 2,78 USD (**−70 %**) | Ardent Partners, 2025 (anketa 212 finančnih strokovnjakov) |
| Prihranek postopka ob prehodu s papirja na e-račun | **−60 do −80 %** | Billentis (Koch), evropska serija poročil |
| Tehnična meja avtomatizacije obdelave podatkov | **69 %** | McKinsey Global Institute, 2017 |
| Tehnična meja avtomatizacije zajema podatkov | **64 %** | isti vir |

McKinseyjeva številka ni meritev dosežka, ampak **strop**: koliko dela te vrste je z
dokazano tehnologijo sploh mogoče avtomatizirati. Naš koeficient trdi natanko to, zato
strop velja tudi zanj. Vrednost nad 0,69 bi trdila nekaj, česar nobena razpoložljiva
tehnologija ne zmore.

Preizkus je zato preprost in ga lahko ponovite sami:

| Vrednost | Ardent (≤ 0,70) | Billentis (0,60–0,80) | McKinsey (≤ 0,69) | Skupaj |
|---|---|---|---|---|
| **0,65** | ustreza | ustreza | ustreza | **3 od 3** |
| 0,70 | ustreza | ustreza | ustreza | 3 od 3 |
| 0,75 | **ne** | ustreza | **ne** | 1 od 3 |

Med 0,65 in 0,70 odloči pravilo P5: vzemi pod sredino. **0,65.**

**Kaj bi to ovrglo:** novejša neodvisna meritev tehnične meje avtomatizacije, ki bi dala
več kot 70 %. McKinseyjeva ocena je iz leta 2017 in orodja so od takrat napredovala — to
je najšibkejša točka te izpeljave in prva, ki jo je treba osvežiti.

### 3.2 Vzrok je v planiranju → 0,50

*Parametri zalog, plan in kapacitete, vidnost statusov, nesistematično opominjanje,
nepostavljen proces.* 26 % ponujenih vzrokov.

To je edina kategorija, ki je **vsebinsko sestavljena**, in zato edina, kjer ena sama
meritev ne zadošča. Vseh 52 vzrokov, ki jih kalkulator uvršča sem, smo razvrstili po tem,
kaj se pravzaprav meri, kadar je izbran:

| Razred | Koliko vzrokov | Kaj meri | Sidro | Vir |
|---|---|---|---|---|
| **Zalogovni** | 11 (21 %) | višina zaloge, varovalna zaloga | **0,20** | Aberdeen −22 % pri najboljših; strojno napovedovanje −19,4 % varnostne zaloge; MRP −10 do −19 % stroška držanja |
| **Izpadni** | 3 (6 %) | prazne police, izgubljena prodaja | **0,47** | Corsten & Gruen: −40 % dosegljivo z disciplino naročanja; ob točnem knjižnem stanju zalog 8,9 % → 4,1 % |
| **Procesni** | 38 (73 %) | vidnost, odgovornosti, opominjanje, razporejanje | **0,60** | brez lastnega sidra — omejen navzgor s kategorijo podatkov |

Uteženo po dejanskem številu vzrokov: **0,508 → 0,50.**

Tretji razred je edina predpostavka v celotnem dokumentu brez lastnega vira, zato jo
preverimo z občutljivostjo:

| Če je procesni razred | Rezultat | Če je zalogovno sidro | Rezultat |
|---|---|---|---|
| 0,50 | 0,45 | 0,15 | 0,50 |
| 0,55 | 0,45 | 0,20 | **0,50** |
| **0,60** | **0,50** | 0,25 | 0,50 |
| 0,65 | 0,55 | 0,30 | 0,55 |

Na zalogovno sidro rezultat torej **ni** občutljiv — vsaka vrednost med 0,15 in 0,25 da
0,50. Na procesno predpostavko **je**: pas 0,55–0,65 da 0,45 do 0,55. Poštena izjava je
zato, da je ta koeficient **0,50 ± 0,05**, in da je od šestih najmanj trden.

**Kaj bi to ovrglo:** meritev, ki bi ločeno izmerila učinek pri procesnih vzrokih. Take
danes ni — zato je razcep te kategorije na dvoje (proces posebej, zaloge posebej) prva
izboljšava, ki jo priporočamo sami sebi.

### 3.3 Vzrok je v ljudeh → 0,40

*Pomanjkanje usposabljanja, disciplina, premalo ljudi, odsotnosti.* 7 % ponujenih vzrokov
— namenoma ozka kategorija.

**To je edini koeficient brez neposrednega sidra, in prav je, da to izveste.** Meritve
»koliko problema izgine, kadar je vzrok v ljudeh, po uvedbi sistema« ne poznamo.

Kategorija je ozka namerno. Kadar ljudje grešijo, ker prepisujejo podatke med sistemi ali
jih držijo v glavi, vzrok **ni** človek — je podatek, in takšna težava ob urejenem sistemu
izgine. Sem sodi le tisto, kar bi ostalo tudi ob dobro postavljenem sistemu.

Utemeljitev je zato vrstilna, ne merska. Vrednost mora ležati:

- **pod** planiranjem (0,50), ker je vrzel v znanju za programsko opremo težja od vrzeli v
  procesu — proces sistem postavi, znanja ne prinese;
- **nad** zunanjimi vzroki (0,30), ker svoje ljudi obvladujemo, tujega dobavitelja pa ne.

Sredina tega intervala je **0,40**.

Dve neodvisni opori kažeta, da je interval postavljen pravilno. Deming je delež težav, ki
pripadajo sistemu in ne posamezniku, ocenil na **94 %**, Juran na **85 %** — kar podpira
ozko definicijo in hkrati pomeni, da je ostanek po urejenem sistemu majhen. V nasprotno
smer kaže domači podatek: po SURS 2025 je med podjetji z 10 in več zaposlenimi, ki so pri
digitalni preobrazbi naletela na težave, **41 %** kot glavno oviro navedlo pomanjkanje
ustreznega kadra ali znanja. V slovenskem malem in srednjem podjetju je kader dejanska
omejitev, ne izgovor.

**Kaj bi to ovrglo:** karkoli, kar bi to sploh izmerilo. Ta številka je presoja in ostane
presoja, dokler ne bo podatka iz lastnih uvedb.

### 3.4 Vzrok je zunaj podjetja → 0,30

*Zamude dobaviteljev, spremembe naročil, plačilna disciplina kupcev, zunanji servisi.*
18 % ponujenih vzrokov.

Logika kategorije: dobavitelja ali kupca ne popravimo, **lahko pa se pred njim
zavarujemo** — z varovalno zalogo, alternativnim virom, zgodnejšo vidnostjo, sistematičnim
opominjanjem.

Dve neodvisni poti, ki se ujameta:

| Meritev | Vrednost | Vir |
|---|---|---|
| Znižanje plačilnega roka pri **nizki** stopnji avtomatizacije terjatev | **−29 %** | anketa 500 finančnih vodij |
| Znižanje pri visoki stopnji avtomatizacije | −41 % | isti vir |
| Delež izpadov zaloge, ki nastane v dobavni verigi | ~28 % vzrokov | Corsten & Gruen |

Pravilo P2 izbere **nizko** stopnjo: opominjanje, ki ga dobi stranka, je vgrajeno v
poslovni sistem, ne specialistična rešitev za terjatve. To da 0,29.

Druga pot pove isto z druge strani: če dobavna veriga povzroči približno 28 % izpadov,
je preostalih 72 % notranjih — in tudi tistih 28 % je mogoče vsaj deloma ublažiti. **0,30.**

Pravilo P4 velja: prvi vir je vendorski, zato je uporabljena **nižja** od obeh njegovih
številk.

**Kaj bi to ovrglo:** neodvisna meritev plačilnih rokov brez sodelovanja ponudnika. Danes
je takih malo.

### 3.5 Vzrok je fizičen → 0,15

*Okvare strojev, kakovost vhodnega materiala, poškodbe pri prevozu, premalo prostora.*
5 % ponujenih vzrokov — najmanjša kategorija.

| Meritev | Vrednost | Kakšen poseg to zahteva |
|---|---|---|
| Znižanje nenačrtovanih zastojev ob vzdrževalnem sistemu in avtonomnem vzdrževanju, pol leta | **−10 do −20 %** | informacijski sistem |
| Znižanje ob načrtovanem vzdrževanju | −5 do −10 % | modul |
| Znižanje okvar ob celovitem TPM, dve leti | −70 % in več | **dveletni program**, ne sistem |

Pravilo P2 izloči tretjo vrstico. Ostane pas 0,10–0,20; sredina je **0,15**.

Navzkrižna kontrola z drugega konca: izmet materiala je v proizvodnji povprečno 3–8 %,
dobra praksa pod 2,5 %. Odpravljiva je torej približno polovica — a to dosežejo skupaj s
tehnološkimi ukrepi, ne z evidenco. Delež, ki ga premakne sam sistem, je bistveno manjši
in s 0,15 skladen.

**Kaj bi to ovrglo:** meritev, ki bi ločila učinek evidence od učinka tehnološkega ukrepa.

### 3.6 Vzroka ne poznate → 0,40

Ta vrednost ni meritev učinka. Je **izhodiščna ocena ob odsotnosti informacije**, in
izpeljana je drugače od vseh prejšnjih.

Kadar vzroka ne izberete, vemo le, kateri vzroki so sploh mogoči. Kalkulator jih ponuja
203; njihova porazdelitev po kategorijah je znana, torej je znana tudi porazdelitev
vrednosti, ki bi jih odgovor dal:

| Statistika | Vrednost |
|---|---|
| Povprečje vseh možnih odgovorov | 0,502 |
| Mediana | 0,50 |
| **25. percentil** | **0,40** |

Vzamemo **25. percentil**. Zakaj ne povprečja: ker bi neodgovarjanje postalo enakovredno
odgovoru, in ker ob odsotnosti podatka ni razloga za srednjo oceno. Zakaj ne nižje: ker
bi neodgovarjanje postalo kazen — pri 10. percentilu bi bila številka nižja od tega, kar
da katerikoli razumen odgovor.

Pri 25. percentilu tri četrtine možnih odgovorov ležijo **nad** privzetkom. Neodgovarjanje
torej nikoli ni nagrajeno, kazen zanj pa je omejena in izrečena.

**Iz tega sledi vzdrževalno pravilo:** privzetek ni samostojna številka. Ob vsaki
spremembi kateregakoli od petih deležev ga je treba preračunati, ker se z njimi premakne
tudi porazdelitev.

---

## 4. Preizkusi celotnega nabora

Šest številk ni šest ločenih ugibanj. Kot celota morajo prestati štiri preizkuse:

**1 · Vrstni red.** Podatki > planiranje > ljudje > zunanji > fizični. Ta vrstni red ne
izhaja iz meritev, ampak iz vprašanja, koliko posamezne vrste vzroka programska oprema
sploh obvladuje. Nabor, ki tega ne izpolni, je napačen ne glede na to, kako dobro je
sidrana vsaka posamezna vrednost.

`0,65 > 0,50 > 0,40 > 0,30 > 0,15` — izpolnjeno, z razmiki 0,15 / 0,10 / 0,10 / 0,15.

**2 · Mreža 0,05.** Nobena vrednost ni natančnejša, kot so dokazi. Izpeljave dajo 0,508 in
0,398; zapisani sta kot 0,50 in 0,40. Številka na dve decimalki bi trdila natančnost, ki
je nimamo.

**3 · Privzetek je 25. percentil lastnega nabora.** Notranja skladnost: privzetek ni
izbran ločeno, ampak izračunan iz preostalih petih.

**4 · Uteženo povprečje.** Po dejanski pogostosti ponujenih vzrokov znaša celoten nabor
**0,502**. To je številka, ki jo je smiselno primerjati z drugimi nabori — razlika pri eni
kategoriji namreč pove malo, dokler ne veste, kako pogosta je.

---

## 5. Dve branji istih dokazov

Kalkulator danes uporablja **višje** vrednosti od izpeljanih. To ni spregled in ni skrito:

| Kategorija | Izpeljano | V kalkulatorju | Razlika |
|---|---|---|---|
| Podatki | 0,65 | **0,75** | +0,10 |
| Planiranje | 0,50 | **0,65** | +0,15 |
| Ljudje | 0,40 | **0,45** | +0,05 |
| Zunanji | 0,30 | **0,30** | — |
| Fizični | 0,15 | **0,15** | — |
| Ni odgovora | 0,40 | **0,45** | +0,05 |
| **Uteženo povprečje** | **0,502** | **0,588** | **+17 %** |

Pri dveh kategorijah od petih se vrednosti **ujemata**, in prav ti dve sta najbolje sidrani.
Razlika ni v dokazih. Je v odgovoru na eno vprašanje: **kaj koeficient obljublja?**

| Branje | Kaj pomeni | Podatki | Planiranje | Tveganje |
|---|---|---|---|---|
| **Dosegljivi vrh** | kar dobi podjetje, ki uvedbo pelje vzorno | 0,75 | 0,65 | čez leto dni se pokaže, da je bila številka previsoka |
| **Pričakovana vrednost** | kar dobi povprečna stranka | 0,65 | 0,50 | številka je manjša, a zdrži preverbo |

Za obe branji obstaja podpora. Billentisov pas 60–80 % dopušča 0,75 za ozko podatkovne
naloge — prepisovanje istega podatka med sistemi, papirne listine — in prav te kategorija
tudi našteva. Nasprotni argument je, da naši moduli merijo **cela problemska področja**,
ne le prenašanja listin: »analitika in poročanje« vsebuje tudi izredne analize in
združevanje podatkov, kjer je učinek manjši.

**Kalkulator uporablja prvo branje.** Povemo to izrecno, ker je to podatek, ki ga
potrebujete pri presoji rezultata, in ker je izrečena pristranost bolj uporabna od skrite.
Pri obeh kategorijah, kjer se branji razhajata, je nižja vrednost tista, ki jo bomo
uporabili prvo, če se pokaže, da je višja preveč.

---

## 6. Kaj to pomeni za vašo številko

Pri **100.000 EUR** izmerjenega letnega stroška:

| Glavni vzrok | Kalkulator pokaže | Po izpeljanih vrednostih | Razlika |
|---|---|---|---|
| Podatki | 75.000 € | 65.000 € | −10.000 € |
| Planiranje | 65.000 € | 50.000 € | −15.000 € |
| Ljudje | 45.000 € | 40.000 € | −5.000 € |
| Zunanji | 30.000 € | 30.000 € | — |
| Fizični | 15.000 € | 15.000 € | — |
| Ni odgovora | 45.000 € | 40.000 € | −5.000 € |

Če želite konservativnejšo številko, je pravilo preprosto: pri podatkovnem vzroku odštejte
približno sedmino, pri planiranju slabo četrtino. Pri zunanjem in fizičnem vzroku razlike
ni — ti dve sta sidrani enako v obeh branjih.

**Še ena stvar, ki jo je pošteno povedati.** Nobena od zgornjih meritev ni prvoletna.
Raziskave uvedb poslovnih sistemov kažejo, da se finančni učinek pokaže po približno dveh
letih rabe, del koristi pa še pozneje. Prikazani znesek je **letni ustaljeni potencial**,
ne prihranek prvega leta.

---

## 7. Kaj bi nas prepričalo, da se motimo

| Kategorija | Kaj bi jo ovrglo |
|---|---|
| Podatki 0,65 | novejša neodvisna meritev tehnične meje avtomatizacije nad 70 % — ocena je iz 2017 |
| Planiranje 0,50 | ločena meritev učinka pri procesnih vzrokih; danes je ni |
| Ljudje 0,40 | karkoli, kar bi to sploh izmerilo — vrednost je presoja |
| Zunanji 0,30 | neodvisna meritev plačilnih rokov brez sodelovanja ponudnika |
| Fizični 0,15 | meritev, ki bi ločila učinek evidence od tehnološkega ukrepa |
| Privzetek 0,40 | vsaka sprememba katerekoli od petih vrednosti — preračun je obvezen |

**Največja omejitev je ena in je poštena: nobena meritev v tem dokumentu ni slovenska.**
Ardent je severnoameriški, Billentis evropski, Aberdeen in McKinsey globalna, Corsten &
Gruen mednarodna. Domač je le podatek o razširjenosti poslovnih sistemov in ovirah pri
digitalizaciji (SURS 2025).

Prve lastne izmerjene uvedbe bodo vse zgornje ocene povozile — in prav je tako. Do takrat
so to najboljše, kar je bilo mogoče preveriti, in vsaka od njih je tu zapisana z virom,
letnico in pogojem, pod katerim pade.

---

### Viri

Ardent Partners, *Accounts Payable Metrics That Matter*, 2025 · Billentis (B. Koch),
*The e-invoicing journey* · The Hackett Group, *Digital World Class Finance*, 2025 ·
McKinsey Global Institute, *A Future That Works*, 2017 · Aberdeen Group, ERP benchmark ·
D. Corsten & T. Gruen, raziskava izpadov zaloge v maloprodaji · ECR Retail Loss ·
Panorama Consulting, *ERP Report*, 2026 · W. E. Deming; J. M. Juran · SURS, *Digitalno
podjetništvo*, 2025 · Forrester, metodologija *Total Economic Impact*.
