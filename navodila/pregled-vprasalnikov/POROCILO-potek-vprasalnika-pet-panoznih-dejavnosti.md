# Potek vprašalnika za pet panožnih dejavnosti — kovinarstvo, predelava plastike, inženiring, gradbeništvo, živilstvo

> Popis trenutnega stanja, izpisan dobesedno iz kode kalkulatorja: `src/config/modules/<dejavnost>.ts` (vprašanja in formule), `src/config/contexts/<dejavnost>.ts` (kontekst in finančna osnova), `src/config/copy/<dejavnost>.ts` (nagovor), `src/config/segments.ts` (nabor in vrstni red področij), `src/config/modules/horizontal.ts` (skupna področja), `src/config/modules/moduleE.ts` in koraki v `src/components/Calculator/`, `src/components/Results/EmailGate.tsx`, `src/components/Results/ResultsView.tsx`.
> Stanje na dan 7. 9. 2026, veja `prenova-prodajne-priprave`, zadnji commit `99a9ddf` (»Dodaj pet panožnih dejavnosti in kampanjske povezave s potjo /dejavnost/«).
>
> Vsaka dejavnost ima svoj samostojen razdelek (1–5), ki ga je mogoče brati brez ostalih. Kar je dobesedno enako v vseh petih — štiri oziroma pet horizontalnih področij, modul E, obrazec s kontaktom in zaslon z rezultatom — je izpisano enkrat, v prilogah A–D; v razdelkih je nanje samo sklic.

---

## Kako brati ta dokument

**Ključna ločnica je v vseh petih dejavnostih ista:** v triaži se na hitro oceni 9 ali 10 področij, podrobna vprašanja pa dobi obiskovalec samo za tista, ki jih obkljuka (privzeto prva tri po vrstnem redu). Vsako izbrano področje je ena stran vprašanj; kratka diagnostika in tvegani stroški (modul E) sta vedno na zadnji strani in se ne ocenjujeta.

**Oznake v tabelah z vprašanji:**

| Oznaka | Pomen |
|---|---|
| h/mesec, EUR/leto, EUR, dni, % | številčno polje; privzeto 0, spodnja meja 0, navzgor odprto (drsnik z odstotki ima zgornjo mejo) |
| **»Ne vem«** | ob polju je kljukica **»Tega podatka ne vodimo«** (`allowUnknown`). Vrednost je tedaj sentinela −1, v formulo vstopi kot 0, polje ne šteje kot izpolnjeno in znesek se označi z nižjo zanesljivostjo — ne kot potrjena ničla (`moduleTypes.ts:52`). |
| izbira · *samo kontekst* | radijski gumbi, ki v formulo **ne** vstopajo (`contextOnly`). Ob prvem izrisu ni označen noben (privzetek 99, `moduleTypes.ts:73`); odgovor potuje v CRM in prodajno pripravo. |
| *kurziva pod vprašanjem* | besedilo `help`, vidno pod vprašanjem |
| **?** | pojasnilo za gumbom »?« (`explainer`) — odpre se na klik ali lebdenje (`HelpTip.tsx`) |
| Kaj je glavni vzrok? | zadnje vprašanje vsakega stroškovnega področja; **edini koeficient**, ki zmanjša izmerjeni znesek (`addressableShare.ts:11`). Brez odgovora se pod skupino izpiše: *»Brez odgovora računamo z najbolj zadržanim deležem — vaš dejanski znesek je najverjetneje višji.«* |

**Naslovljivi deleži po kategoriji vzroka** (`addressableShare.ts:47`, umerjeno avgusta 2026):

| Kategorija | Delež | V tabelah zapisano kot |
|---|---|---|
| podatki, normativi, dokumentacija, ročni prenosi | **75 %** | (75 %) |
| planiranje, vidnost, nepostavljen proces | **65 %** | (65 %) |
| ljudje: znanje, disciplina, kadrovska kapaciteta | **45 %** | (45 %) |
| zunanji dejavniki: dobavitelji, kupci | **30 %** | (30 %) |
| fizično: okvare, kakovost vhodnega materiala | **15 %** | (15 %) |
| **Ne vemo** (zadnja možnost) in **neodgovorjeno** | **45 %** | (45 %) |

Pri nekaterih postavkah velja še **zgornja meja naslovljivosti** (`addressableCap`), ki je neodvisna od vzroka — tam, kjer ima strošek tehnološko, biološko ali regulatorno dno (izmet, menjava orodja, okvare, kalo, odpoklic, HACCP zapis). Ob postavki je zapisana kot »meja 0,5«.

**Štirje koši rezultata** (`moduleTypes.ts:17`): *neposredna izguba* (denar, ki je odtekel), *nezaslužena marža* (prodaja pod ceno, marža, ki je ni bilo), *kapaciteta* (ure × polni strošek ure × 12 — ni prihranek plače) in *enkratni kapital* (zaloge, zadržki, oprema — se nikoli ne sešteva z letnimi zneski). *Tveganje* je brez evrov. Naslovni znesek na rezultatih in tekoča vsota med vnosi sta vsota prvih treh; enkratni kapital je prikazan ločeno (`ResultsView.tsx:133`).

**Formule** so zapisane tako, kot jih izvede `compute()`: V2 pomeni drugo vprašanje v tabeli tistega področja, »proizvodna ura« oziroma »admin ura« pa postavko iz koraka Skupna finančna osnova.

---

## Skupno ogrodje: koraki in številčenje

Zaporedje korakov je za vseh pet dejavnosti enako, ker imajo vse kontekst in triažo (`CalculatorFlow.tsx:356`):

| Zaslon | Oznaka »Korak N od M« | Vsebina |
|---|---|---|
| Uvodni zaslon | brez števca (prvi vtis, `CalculatorFlow.tsx:402`) | naslov dejavnosti, izbira dejavnosti |
| Zaposleni | Korak 1 | število zaposlenih |
| Kontekst | Korak 2 | tri vprašanja brez številk |
| Triaža | Korak 3 | ocena 9–10 področij + kljukice |
| Skupna finančna osnova | Korak 4 | 3 ali 4 številke, ki veljajo povsod |
| Vaše številke | Korak 5 … 5+n−1 | **ena stran na izbrano področje** (n = število kljukic) |
| Diagnostika + Tvegani stroški | Korak 5+n | zadnja stran vnosov, vedno |
| Obrazec s kontaktom | Korak 6+n | odklene rezultat in PDF |
| Rezultat | Korak 7+n | brez vprašanj |

Pri priporočenih **treh** področjih je torej **10 korakov**: 1 zaposleni · 2 kontekst · 3 triaža · 4 osnova · 5–7 tri področja · 8 diagnostika in E · 9 obrazec · 10 rezultat. Vsaka dodatna kljukica v triaži doda en korak; triaža to izpiše.

**Vstop v tok:** poleg izbire na uvodnem zaslonu ima vsaka od petih dejavnosti kampanjsko povezavo s potjo `<objava>/<dejavnost>/` (npr. `/kovinarstvo/`), ki dejavnost izbere in začne na Koraku 1 — uvodni zaslon ostane dosegljiv z »Nazaj« (`industries.ts:208`, `CalculatorFlow.tsx:112`). Parameter `?s=<dejavnost>` dejavnost samo prednastavi, uvodni zaslon pa ostane.

**Skupna varovala med vnosi** (enaka povsod):

- *Opomba pod vsako stranjo z zneski:* »Sproščene ure ne pomenijo nižje plačne mase — zaposleni ostane. Gre za čas, ki ga lahko usmerite v drugo delo.«
- *Tekoča vsota* v prilepljenem pasu: »Trenutni letni strošek izbranih področij: X EUR« (neposredna izguba + nezaslužena marža + kapaciteta).
- *Pas nad vnosi:* »Izračun prilagojen za: <Dejavnost> · <razred> zaposlenih« z gumbom »spremeni dejavnost« (razredi 1–9, 10–49, 50–249, 250+).
- *Opozorilo o verjetnosti ur* (`plausibility.ts:88`), kadar vsota vnesenih ur preseže 40 % kapacitete ekipe (160 h × zaposlenih): »Vnesene ure (X h/mesec) so Y % skupne mesečne kapacitete Z zaposlenih (pribl. W h). Preverite, da se iste ure ne štejejo v dveh področjih — rezultat je sicer precenjen.« Ne blokira.
- *Opozorilo o vzroku* (`CalculatorFlow.tsx:605`): »Pri področju <ime> še niste izbrali glavnega vzroka. Od njega je odvisno, kolikšen del zneska štejemo za odpravljiv — brez odgovora vzamemo najbolj zadržano oceno.« Samo za področja te strani z vnesenim zneskom; ne blokira.
- Gumb na zadnji strani vnosov: **»Zaključi vnos«** (ne »Poglej rezultat« — pelje na obrazec).

**Oznaka zanesljivosti** (`potential.ts:144`): *nizka*, kadar manjka prihodek, ki ga izbrano področje množi, ali je izpolnjenih največ polovica številčnih polj, ali so vse postavke finančne osnove ocenjene; *visoka*, kadar ni nobene ocenjene postavke, nobenega »Ne vem« in je izpolnjenih vsaj 80 % polj; sicer *srednja*. Ob nizki zanesljivosti se pred zneski izpiše »najmanj«, ob izbranem razponu v osnovi pa se znesek prikaže kot razpon (`format.ts:57`).

---

# 1 · KOVINARSTVO

Segment `kovinarstvo` (SKD C25 kovinski izdelki, C28 stroji in naprave). Šest panožnih področij + štiri horizontale + diagnostika + E (`segments.ts:149`). Brez horizontale *Reklamacije in poprodajni servis*: podizvajalec garancijskega servisa praviloma nima, reklamacije kupcev meri panožno področje Sledljivost. Prag »visoke izgube« za izbiro follow-up sekvence: 15.000 EUR.

Izpeljava iz raziskave: `navodila/kovinarstvo/vprasalnik-kovinarstvo-izpeljava-iz-raziskave.md`.

## Uvodni zaslon

> **Koliko vas letno stane, da ne poznate dejanskega stroška naloga?**
> Odstopanje porabe od normativa, nemerjene nastavitve, material v kooperaciji in iskanje šarž nimajo svoje vrstice v izkazu. Cene kupcu ne dvignete — ostane vam notranja učinkovitost.
>
> *Dobite razčlenjen letni znesek po področjih — z vašimi številkami in formulo pod vsako postavko, na zaslonu in v PDF poročilu za upravo. Za priporočena tri področja vzame okoli deset minut; pred rezultatom vas prosimo za kontakt.*

**S čim se ukvarja vaše podjetje?** — spustni seznam: Proizvodnja · Živilstvo (hrana in pijača) · **Kovinarstvo** · Predelava plastike · Trgovina, veleprodaja in distribucija · Računovodski servisi · Storitvena in projektna podjetja · Gradbeništvo · Inženiring · Maloprodaja · Logistika in transport · Drugo

Naslov in podnaslov se zamenjata takoj, ko je dejavnost izbrana (pred tem nevtralni »Koliko vas stane sedanji način dela?«). Pod seznamom trditev o zasebnosti: *»Ves izračun poteka v vašem brskalniku. Nič od vnesenih podatkov ne zapusti brskalnika, dokler se sami ne odločite oddati obrazca za PDF poročilo.«* Gumb **Naprej** je onemogočen, dokler dejavnost ni izbrana. Kampanjska povezava `<objava>/kovinarstvo/` ta zaslon preskoči.

## Korak 1 od 10 — Zaposleni

> **Koliko ljudi zaposlujete?**

**V1.1** `employeeCount` — celo število, »zaposlenih«, največ 100.000.

> *Podatek ne vstopa v noben znesek — iz njega izpeljemo velikostni razred podjetja in preverimo, ali so vnesene ure skladne z velikostjo vaše ekipe.*

Ob kliku brez vnosa: *»Vpišite število zaposlenih — vsaj 1. Če ste samostojni podjetnik brez zaposlenih, štejte sebe.«*

## Korak 2 od 10 — Kontekst

> **Nekaj o vaši kovinarski proizvodnji**
> Tri vprašanja brez številk: kako pretežno delate, kako danes vodite proizvodnjo in kdo ste v podjetju. Delavnica s posamičnimi kosi in serijski dobavitelj avtomobilske verige imata iste stroje, a drugačne bolečine — iz odgovorov izvemo, o čem se je smiselno pogovoriti. V izračun zneskov ta odgovor ne vstopa.

**V2.1 — Kako pretežno delate?**
Posamični kosi in male serije po naročilu · Ponavljajoče se serije za stalne kupce · Strojegradnja, orodjarstvo ali projektna proizvodnja · Sistemski dobavitelj z zahtevami kupcev po dokumentaciji · Kombinirano
→ *Samo oznaka v prodajni pripravi (segmenti S1–S5 raziskave).*

**V2.2 — Kako danes vodite proizvodnjo?** ← prodajni signal (vrzel sistema); v izračun ne vstopa

| Odgovor | Vrzel sistema | PANTHEON? |
|---|---|---|
| PANTHEON MF in/ali MT | 8–20 % | da |
| PANTHEON brez proizvodnega modula | 15–30 % | da |
| Drug ERP za proizvodnjo | 15–30 % | ne |
| Kombinacija ERP-ja, Excela, CAD/CAM programov in papirja | 25–40 % | ne |
| Večinoma Excel, papir ali sprotni dogovor | 25–40 % | ne |

Odgovor »da« v stolpcu PANTHEON odloči, ali se na zadnji strani vnosov prikaže modul E.

**V2.3 — Kakšna je vaša vloga?**
Direktor/-ica · Vodja proizvodnje · Tehnolog ali vodja tehnologije · Finance ali računovodstvo · Nabava ali skladišče · Drugo (odpre polje »Vpišite svojo funkcijo«, npr. vodja IT)
→ *Utež ICP »bližina odločevalcu«: direktor 1,00 · finance 0,80 · vloge s predpono »vodja« 0,60 · drugo ali brez odgovora 0,35 (`icp.ts:90`).*

Gumb **Naprej** je onemogočen, dokler niso odgovorjena vsa tri vprašanja (pri »Drugo« tudi vpis).

## Korak 3 od 10 — Triaža (10 področij)

> **Kje v kovinarstvu vas najbolj tišči?**
> Na hitro ocenite vsako področje — od stroška delovnega naloga in porabe materiala do zalog, certifikatov, kooperacije in rokov. Podrobna vprašanja zastavimo samo za največje težave, zato vprašalnik ostane kratek, izračun pa vezan na vaše naloge in ne na povprečje panoge.
>
> *Kljukice "Izračunaj podrobno" sledijo vašim ocenam — najvišje ocenjena področja se označijo sama, izbiro pa lahko kadarkoli popravite.*

Vsako področje: ena ocena 0–3 (ob prvem izrisu ni označen noben odgovor) + kljukica **»Izračunaj podrobno«**.

| # | Področje | Vprašanje | 0 | 1 | 2 | 3 |
|---|---|---|---|---|---|---|
| T1 | **Delovni nalog in dejanski strošek** | Ali po zaključku naloga veste, koliko vas je dejansko stal — material, delo in stroj? | Da, iz sistema ob zaključku | Približno, po kalkulaciji | Šele ob mesečnem ali letnem obračunu | Ne vemo |
| T2 | **Poraba materiala, izmet in ponovna izdelava** | Kako pogosto dejanska poraba materiala odstopa od normativa ali nastajata izmet in ponovna izdelava? | Redko, odstopanja spremljamo | Mesečno | Tedensko | Pri velikem deležu nalogov ali odstopanja ne merimo |
| T3 | **Zaloge materiala in zastoji** | Kako pogosto se stroj ustavi, ker materiala ni, čeprav bi po sistemu moral biti? | Zaloge so pod nadzorom | Nekajkrat na leto | Vsak mesec | Vsak teden |
| T4 | **Sledljivost šarž, certifikati in reklamacije** | Kako pogosto iščete certifikate, šarže ali zapisnike za kupca, reklamacijo ali presojo? | Redko — vse je na enem mestu | Nekajkrat na mesec | Tedensko | Skoraj vsak dan, iskanje traja ure |
| T5 | **Kooperacija in zunanje operacije** | Kako pogosto pri kooperaciji nastanejo razlike v količinah, zamude ali izgubljen material? | Kooperacije nimamo ali poteka brez težav | Občasno | Mesečno | Pri večini oddaj |
| T6 | **Plan, kapacitete in roki** | Kako pogosto se plan spreminja, proizvodnja čaka na prioriteto ali risbo ali zamujate z dobavo? | Plan je stabilen, roke držimo | Občasno | Tedensko | Skoraj vsak dan |
| T7 | **Analitika in poročanje** | Koliko ročnega dela zahteva priprava poročil in ključnih številk za odločanje? | Poročila se sestavijo sama | Nekaj ur ob koncu meseca | Vsak teden po nekaj ur | S poročili se nekdo ukvarja skoraj vsak dan |
| T8 | **Računovodstvo in finance** | Koliko ročnega dela je v vašem računovodstvu in financah (knjiženje, usklajevanje, obračuni)? | Večina poteka samodejno | Nekaj ur ob koncu meseca | Več dni vsak mesec | Konec meseca je vsakič zamašek |
| T9 | **Kadri in plače** | Koliko dela zahtevajo evidence delovnega časa, dopusti in priprava plač? | Malo — večina poteka samodejno | Nekaj ur na mesec | Nekaj dni vsak mesec | Vsak mesec je to velik projekt |
| T10 | **Dokumentacija in e-poslovanje** | Koliko časa se izgubi s potrjevanjem, iskanjem in ročnim pošiljanjem dokumentov? | Dokumenti so urejeni in dostopni | Občasno kaj iščemo | Potrjevanje in iskanje se redno vlečeta | Dokumentacija je stalna težava |

> *Podrobno bomo izračunali N od 10 področij — vsako izbrano področje je ena stran vprašanj (približno minuta). Priporočamo tri, izberete pa lahko poljubno mnogo; neizmerjena področja ostanejo prazna in nobene številke si ne izmislimo.*

**Privzeta izbira:** prva tri po vrstnem redu (Delovni nalog, Material, Zaloge), dokler se obiskovalec kljukic ne dotakne; nato tri najvišje ocenjena področja, ob izenačenju prednost po vrstnem redu (`moduleEngine.ts:182`). Po prvem ročnem dotiku kljukic se izpiše *»Izbiro področij ste prilagodili ročno, zato ocenam ne sledi več.«* z gumbom »Vrni samodejni predlog«. Gumb **Naprej na številke** je onemogočen brez vsaj ene kljukice.

## Korak 4 od 10 — Skupna finančna osnova

> **Skupna finančna osnova**
> Tri številke, ki veljajo za vsa področja: dve urni postavki in prihodek. Polni strošek ure pomeni bruto plačo s prispevki delodajalca ter regresom, malico in prevozom — ne neto izplačila in ne režije. Prihodek je lastnost podjetja, ne posameznega področja, zato ga vprašamo enkrat.

Vsaka postavka ima vnosno polje (ogrado »npr. <povprečje>«), pod njim vrstico **»Ne veste? Vzemi povprečje panoge (X EUR/h) · Izberi razpon«** in gumb »?«. Prazno polje pomeni povprečje panoge kot oceno in to se ob polju izpiše.

**V4.1 — Približen polni strošek neposredne proizvodne ure**
*Strugar, varilec, CNC-operater, orodjar — kdor dela na delovnem nalogu.*
**?** Bruto plača + prispevki delodajalca + regres, malica in prevoz, deljeno s približno 140 opravljenimi urami na mesec — brez režije, ta teče naprej tudi brez te ure. Primer: bruto 2.100 EUR → okoli 20 EUR na uro.
Vnos EUR/h · povprečje panoge **22** · razponi: Do 17 EUR (16) · 17–20 EUR (18) · 20–25 EUR (22) · Več kot 25 EUR (29)

**V4.2 — Približen polni strošek administrativne oziroma vodstvene ure**
*Tehnolog, planer, vodja proizvodnje, priprava dela, nabava.*
**?** Isti izračun kot pri prejšnji postavki, le za pisarniško in vodstveno delo. Ni nujno dražja — pomembno je le, da postavk ne zamenjate, ker vsaka vrednoti svojo vrsto dela.
Vnos EUR/h · povprečje panoge **26** · razponi: Do 20 EUR (18) · 20–25 EUR (22) · 25–31 EUR (28) · Več kot 31 EUR (36)

**V4.3 — Letni prihodki od prodaje**
*Neto, brez DDV. Če razpona ne izberete, postavk, vezanih na prihodek, ne bomo ocenili — prihodka si ne izmišljamo.*
**?** Čisti prihodki od prodaje iz zadnjega zaključenega leta, brez DDV — ne promet z DDV in ne prilivi na račun. Brez tega podatka postavk, ki se računajo kot odstotek prometa, ne ocenimo.
Vnos EUR/leto · **brez povprečja** (privzeto 0) · razponi: Do 2 mio EUR (1,2 mio) · 2–5 mio EUR (3,2 mio) · 5–15 mio EUR (8,5 mio) · Več kot 15 mio EUR (25 mio)
→ *V kovinarstvu prihodka ne množi noben modul — bere ga samo prodajna priprava (kvalifikacija). Zato manjkajoč prihodek tu ne zniža zanesljivosti.*

> *Če katere od postavk ne poznate, prevzemite povprečje panoge ali izberite razpon. Izračun bo tekel naprej, rezultat pa bo označen z nižjo zanesljivostjo — raje to kot navidezno natančen znesek.*

Kovinarstvo **ne** vpraša prispevne marže, zaračunane urne postavke ne stroška financiranja.

## Koraki 5–7 od 10 — Vaše številke (ena stran na področje)

Vsaka stran: **Korak N od 10** · naslov = ime področja · pas »Izračun prilagojen za: Kovinarstvo · 10–49 zaposlenih« · povzetek področja v kurzivi · vprašanja · opomba o sproščenih urah · tekoča vsota · Nazaj / Naprej.

### K1 · Delovni nalog in dejanski strošek

*Ročno evidentiranje proizvodnje, nemerjeni nastavitveni časi in nalogi, ki so bili prodani pod polno lastno ceno.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Koliko delovnih nalogov odprete na mesec?**<br>*Podatek ne vstopa v izračun — pove obseg in olajša oceno ur v naslednjem vprašanju.*<br>**?** Odprti delovni nalogi, tudi interni in za polizdelke — ne naročila kupcev, ker eno naročilo pogosto razpade na več nalogov. Podatek je v sistemu ali v mapi nalogov za zadnji mesec. | nalogov/mesec · *samo kontekst* | 0 |
| 2 | **Koliko skupnih ur mesečno porabite za ročno evidentiranje in prepisovanje podatkov o proizvodnji — izdelani kosi, čas in izmet s spremnih listov v sistem ali Excel?**<br>*Evidenco prisotnosti za plače merimo v področju Kadri in plače; kalkulacij, ponudb in poročil za vodstvo tu ne štejte.*<br>**?** Vsak nalog se vsaj enkrat prepiše: s spremnega lista v Excel ali sistem, ob zaključku še kosi in izmet. Ocena: 250 nalogov × 14 min ≈ 58 ur na mesec. | h/mesec | 0 |
| 3 | **Za koliko so bile v zadnjih 12 mesecih potrjene cene nižje od polne lastne cene po kalkulaciji?**<br>*Samo razlika med ceno in kalkulirano lastno ceno ob ponudbi — presežno porabo materiala in ure merimo v področjih Material, Zaloge in Plan. Če razlike ne spremljate, izberite "Ne vem": prav to je podatek.*<br>**?** Nalogi, pri katerih je bila cena kupcu potrjena pod polno lastno ceno (material, delo, stroj in nastavitev). Primer: 8 nalogov na leto, vsak v povprečju 1.500 EUR pod lastno ceno ≈ 12.000 EUR. | EUR/leto · »Ne vem« | 0 |
| 4 | **Kako merite nastavitveni čas stroja — menjavo orodja in prvi kos?** — Ločena operacija v sistemu / Ocenjen v normativu / Vštet v čas izdelave / Ga ne merimo | izbira · *samo kontekst* | ni izbrano |
| 5 | **Kaj je glavni vzrok?** — Podatki o proizvodnji se vnašajo naknadno, s papirja (75 %) / Ure delavcev in stroja niso vezane na nalog ali operacijo (75 %) / Normativi in kalkulacije niso osveženi (75 %) / Nastavitve in male serije v kalkulaciji niso ločeno ovrednotene (75 %) / Usposobljenost oziroma menjava ljudi (45 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
kapaciteta         Ročno evidentiranje proizvodnje = V2 × admin ura × 12
nezaslužena marža  Prodaja pod lastno ceno         = V3
```
**Neposredna izguba: 0 EUR** — prodaja pod lastno ceno gre v koš *nezaslužena marža* (stoji na predpostavki, da bi kupec pravo ceno plačal, `kovinarstvo.ts:147`).
PANTHEON naslavlja: obračun delovnega naloga po materialu, delu in stroju · proizvodni terminali MT za sprotno javljanje operacij · ločena operacija nastavitve v tehnološkem postopku.

### K2 · Poraba materiala, izmet in ponovna izdelava

*Razlika med normativom in dejansko porabo, izmet in ostanki pločevine ter ure ponovne izdelave in sortiranja.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Kolikšna je letna vrednost porabljenega materiala — jeklo, aluminij, polizdelki?**<br>*Nabavna vrednost materiala, ki gre v izdelke — brez orodij, olj, plinov in energije.*<br>**?** Postavka "stroški materiala" iz izkaza poslovnega izida ali vsota nabav za proizvodnjo v zadnjem letu. V tej panogi je material praviloma največja posamezna postavka stroškov. | EUR/leto · »Ne vem« | 0 |
| 2 | **Za koliko odstotkov material, izdan na naloge, presega normativ iz kosovnic?**<br>*Izdano na nalog proti normativu — vključno z ostanki pločevine in izmetom. Manko, ugotovljen ob inventuri, sodi v področje Zaloge; ure ponovne izdelave merimo v naslednjem vprašanju.*<br>**?** Primerjava izdanega materiala z normativom po kosovnicah za zadnji mesec ali za 10 največjih nalogov. Primer: izdanih 105 t pri normativu 100 t je 5 %. Delež vrednosti, ne kosov. | drsnik 0–20 %, korak 0,5 | **0 %** |
| 3 | **Koliko skupnih človek-ur mesečno porabite za ponovno izdelavo, dodelave in sortiranje neskladnih kosov?**<br>*Ure obravnave reklamacij s kupci — iskanje šarže in poročila 8D — sodijo v področje Sledljivost.*<br>**?** Ure operaterjev in kontrole za popravilo, ponovno izdelavo ali prebiranje kosov, ki niso šli skozi prvič — tudi sortiranje pri kupcu. Ocena: 6 primerov × 2 delavca × 4 h ≈ 48 ur na mesec. | h/mesec | 0 |
| 4 | **Kaj se zgodi z ostružki in ostanki pločevine?** — Tehtamo in prodajamo, prihodek je knjižen po vrsti odpadka / Prodajamo, a evidence po nalogu ali vrsti ni / Odvaža jih zbiralec, prihodek je zanemarljiv / Ne spremljamo | izbira · *samo kontekst* | ni izbrano |
| 5 | **Kaj je glavni vzrok?** — Normativi v kosovnicah niso osveženi (75 %) / Izdelava po napačni verziji kosovnice ali risbe (75 %) / Poraba se ne evidentira na nalog (75 %) / Napake pri nastavitvi ali izvedbi, premalo usposabljanja (45 %) / Kakovost vhodnega materiala ali orodja (15 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
izguba      Presežna poraba materiala nad normativom = V1 × V2      ← meja naslovljivosti 0,5
kapaciteta  Ponovna izdelava, dodelave in sortiranje = V3 × proizvodna ura × 12
```
Privzeti delež je 0 % (ne panožno povprečje): znesek nastane šele, ko obiskovalec sam trdi, da odstopanje obstaja (`kovinarstvo.ts:211`).
PANTHEON naslavlja: kosovnice in tehnološki postopki z normativi in verzijami · izdaja materiala na delovni nalog s primerjavo z normativom · evidenca neskladnosti in stroška ponovne izdelave po nalogu.

### K3 · Zaloge materiala in zastoji

*Inventurne razlike in odpisi, zastoji zaradi manjkajočega materiala, nujne nabave in kapital, vezan v zalogi.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Kolikšna je povprečna skupna vrednost zalog materiala, polizdelkov in nedokončane proizvodnje?**<br>*Vključite surovine, polizdelke, nedokončano proizvodnjo in gotove izdelke.*<br>**?** Povprečno stanje med letom po nabavni vrednosti — ne stanje na današnji dan in ne letna poraba. Vzemite postavko iz bilance ali povprečje nekaj mesečnih stanj. | EUR | 0 |
| 2 | **Kolikšne so bile v zadnjih 12 mesecih inventurne razlike, odpisi in razvrednotenja zaloge?**<br>*Samo neto manko in odpis ob inventuri — presežna poraba na nalogu sodi v področje Material, razlike, ugotovljene ob vračilu iz kooperacije, pa v področje Kooperacija.*<br>**?** Iz inventurnega zapisnika: vrednost manjka plus material, odpisan brez uporabe. Primer: 0,8 % manjka pri 1,2 mio EUR zaloge ≈ 9.600 EUR na leto. | EUR/leto · »Ne vem« | 0 |
| 3 | **Koliko skupnih človek-ur mesečno proizvodnja stoji samo zaradi manjkajočega materiala?**<br>*Čakanje na plan ali risbo štejte v področju Plan, čakanje na vračilo iz kooperacije pa v področju Kooperacija.*<br>**?** Samo zastoji, ko delo stoji, ker materiala ni ali ni pravega. Ocena: 3 zastoji × 3 ljudje × 2 h ≈ 18 ur na mesec. | h/mesec | 0 |
| 4 | **Koliko ste v zadnjih 12 mesecih doplačali za nujne nabave materiala in ekspresne dostave?**<br>*Samo doplačilo nad redno ceno. Dodatni prevozi h kupcu zaradi zamud sodijo v področje Plan.*<br>**?** Razlika med nujno in redno izvedbo, ne celotna nabava. Primer: hitra dobava pločevine 1.400 EUR namesto 900 EUR → vpišite 500 EUR. | EUR/leto · »Ne vem« | 0 |
| 5 | **Kolikšen delež zalog bi lahko trajno zmanjšali, ne da bi zmanjkalo materiala?** — Do 5 % (5 %) / 6–10 % (8 %) / 11–20 % (15 %) / Več kot 20 % (25 %) / **Ne vem** (10 %)<br>**?** Ne koliko zaloge imate, ampak koliko bi je lahko trajno bilo manj, ne da bi kdaj zmanjkalo — tiste, ki leži zaradi previdnosti ali slabega pregleda. Groba ocena zadostuje. | izbira | Ne vem → 10 % |
| 6 | **Kaj je glavni vzrok?** — Stanje zalog v sistemu ni zanesljivo (75 %) / Material se izdaja brez naloga ali naknadno (75 %) / Nabava ni povezana s planom nalogov (65 %) / Dobavitelji zamujajo ali dobavijo brez certifikata (30 %) / Zalogo zavestno držimo kot varovalko (65 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
izguba            Inventurne razlike in odpisi           = V2
kapaciteta        Zastoji zaradi manjkajočega materiala  = V3 × proizvodna ura × 12
izguba            Nujne nabave in ekspresne dostave      = V4
enkratni kapital  Sprostljiv obratni kapital v zalogah   = V1 × delež iz V5   (brez naslovljivega deleža — ta znesek že JE potencial)
```
PANTHEON naslavlja: skladišča, lokacije in šarže materiala · izdaja materiala na delovni nalog · MRP: potrebe po materialu iz nalogov s točkami naročanja.

### K4 · Sledljivost šarž, certifikati in reklamacije

*Iskanje certifikatov 3.1 in šarž, priprava dokumentacije za kupce in presoje ter neposredni stroški reklamacij.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Koliko ur mesečno porabite za iskanje in prilaganje materialnih certifikatov (3.1), merilnih zapisnikov in dokumentacije ob dobavi ali presoji?**<br>*Potrjevanje računov in splošno iskanje po arhivu sodi v področje Dokumentacija in e-poslovanje.*<br>**?** Certifikat k vsaki dobavi, ki ga zahteva kupec, in dokazila pred presojo. Ocena: 40 dobav × 20 min iskanja + priprava na eno presojo 16 h ≈ 30 ur na mesec. | h/mesec | 0 |
| 2 | **Koliko ur mesečno porabite za obravnavo reklamacij kupcev — iskanje izvorne šarže, poročila 8D in komunikacijo s kupcem?**<br>*Ure sortiranja in ponovne izdelave neskladnih kosov sodijo v področje Material.*<br>**?** Pisarniški del reklamacije: ugotoviti, iz katere šarže je bil kos, napisati poročilo in uskladiti ukrepe s kupcem. Ocena: 3 reklamacije × (6 h iskanja šarže + 4 h poročilo 8D) ≈ 30 ur na mesec. | h/mesec | 0 |
| 3 | **Kolikšni so bili v zadnjih 12 mesecih neposredni stroški reklamacij — dobropisi, sortiranje pri kupcu, prevozi in odpoklici zaradi kakovosti?**<br>*Brez vrednosti ponovno izdelanih kosov — ta je v področju Material. Prevozi in popusti zaradi zamud sodijo v področje Plan.*<br>**?** Denar, ki je odtekel zaradi neskladne dobave: dobropis, zunanje sortiranje, nujni prevoz nadomestne dobave. Primer: 12 reklamacij × 900 EUR ≈ 10.800 EUR na leto. | EUR/leto · »Ne vem« | 0 |
| 4 | **Kako dolgo traja, da pri reklamaciji najdete, iz katere šarže materiala je bil kos?** — Manj kot uro, iz sistema / Nekaj ur / Dan ali več / Šarže praviloma ne najdemo | izbira · *samo kontekst* | ni izbrano |
| 5 | **Kaj je glavni vzrok?** — Certifikati so v mapah in e-pošti, ne vezani na šaržo (75 %) / Šarža se ob prevzemu ali izdaji ne zabeleži (75 %) / Zapisniki meritev so na papirju (75 %) / Zahteve kupcev po dokumentaciji so se povečale (30 %) / Premalo ljudi v kontroli kakovosti (45 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
kapaciteta  Iskanje certifikatov in priprava dokumentacije = V1 × admin ura × 12
kapaciteta  Obravnava reklamacij in iskanje šarž           = V2 × admin ura × 12
izguba      Neposredni stroški reklamacij                  = V3
```
PANTHEON naslavlja: serijske številke in šarže od prevzema do dobavnice · certifikat, vezan na šaržo in priložen dobavnici samodejno · evidenca reklamacij in neskladnosti z vzrokom in stroškom.

### K5 · Kooperacija in zunanje operacije

*Material, oddan v cinkanje, kaljenje ali obdelavo pri kooperantu: evidenca oddaj, usklajevanje vračil, izgube in čakanje.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Kolikšen delež nalogov gre skozi vsaj eno zunanjo operacijo — cinkanje, kaljenje, obdelavo pri kooperantu?** — Kooperacije nimamo / Do 10 % nalogov / 10–30 % nalogov / Več kot 30 % nalogov | izbira · *samo kontekst* | ni izbrano |
| 2 | **Koliko ur mesečno porabite za oddaje v kooperacijo, spremljanje rokov in usklajevanje vrnjenih količin?**<br>*Splošno prepisovanje podatkov o proizvodnji sodi v področje Delovni nalog.*<br>**?** Priprava izdajnice in spremnega lista, klici kooperantu, štetje ob vračilu in usklajevanje računa. Ocena: 40 oddaj × 30 min + usklajevanje 10 h ≈ 30 ur na mesec. | h/mesec | 0 |
| 3 | **Koliko skupnih človek-ur mesečno proizvodnja čaka na vračilo kosov iz kooperacije?**<br>*Čakanje na material iz nabave sodi v področje Zaloge.*<br>**?** Samo zastoji, ko naslednja operacija stoji, ker se kosi od kooperanta niso vrnili v roku. Ocena: 2 zamudi × 2 ljudje × 4 h ≈ 16 ur na mesec. | h/mesec | 0 |
| 4 | **Kolikšne izgube so v zadnjih 12 mesecih nastale zaradi razlik v količinah ob vračilu in neuveljavljenih reklamacij pri kooperantih?**<br>*Manko, ugotovljen šele ob inventuri, sodi v področje Zaloge.*<br>**?** Kosi, ki so odšli h kooperantu in se niso vrnili ali so se vrnili neuporabni, brez povračila. Primer: 3 primeri × 20 manjkajočih kosov × 40 EUR ≈ 2.400 EUR na leto. | EUR/leto · »Ne vem« | 0 |
| 5 | **Kaj je glavni vzrok?** — Oddaje in vračila se vodijo ročno ali po e-pošti (75 %) / Material, oddan kooperantu, izgine iz evidence zalog (75 %) / Plan ne upošteva časa pri kooperantu (65 %) / Kooperanti ne držijo rokov ali količin (30 %) / Kakovost dela kooperantov (30 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
kapaciteta  Administracija kooperacije         = V2 × admin ura × 12
kapaciteta  Čakanje na vračilo iz kooperacije  = V3 × proizvodna ura × 12
izguba      Izgube pri kooperaciji             = V4
```
PANTHEON naslavlja: izdajni in prevzemni dokumenti za zunanje operacije · zaloga pri kooperantu kot ločeno skladišče · kooperacijska operacija v tehnološkem postopku z rokom vračila.

### K6 · Plan, kapacitete in roki

*Čakanje na plan, risbo ali prioriteto, nadure zaradi sprememb in penali zaradi zamujenih dobav.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Kako danes planirate zasedenost strojev?** — V sistemu nad delovnimi nalogi / V Excelu / Na tabli / V glavi vodje proizvodnje | izbira · *samo kontekst* | ni izbrano |
| 2 | **Koliko skupnih človek-ur mesečno proizvodnja čaka zaradi nejasne prioritete, manjkajoče risbe ali napačne verzije dokumentacije?**<br>*Čakanje na material sodi v področje Zaloge, čakanje na vračilo iz kooperacije pa v področje Kooperacija.*<br>**?** Ure, ko delo stoji, ker ni jasno, kaj naprej — čakanje na plan, risbo, verzijo ali potrditev. Ocena: 5 ljudi × 20 min × 21 dni ≈ 35 ur na mesec. | h/mesec | 0 |
| 3 | **Koliko nadur mesečno nastane predvsem zaradi sprememb plana in nujnih naročil?** | h/mesec | 0 |
| 4 | **Kolikšni so bili v zadnjih 12 mesecih penali, popusti in dodatni prevozi zaradi zamujenih dobav?**<br>*Doplačila za nujne nabave materiala sodijo v področje Zaloge, stroški zaradi kakovosti pa v področje Sledljivost.*<br>**?** Samo posledice zamude: pogodbeni penal, popust za zamujen rok, nujni prevoz h kupcu. Primer: 6 zamud × 500 EUR popusta + 4 nujni prevozi × 300 EUR ≈ 4.200 EUR na leto. | EUR/leto · »Ne vem« | 0 |
| 5 | **Kolikšen delež naročil odpremite v potrjenem roku?** — Nad 95 % / 85–95 % / Pod 85 % / Ne merimo | izbira · *samo kontekst* | ni izbrano |
| 6 | **Kaj je glavni vzrok?** — Plan ni ažuren ali kapacitete niso znane (65 %) / Kosovnice, risbe in postopki so v več verzijah (75 %) / Stanje nalogov ni vidno sproti (65 %) / Kupci spreminjajo naročila in odpoklice (30 %) / Okvare strojev in orodij (15 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
kapaciteta  Čakanje in nadure v proizvodnji  = (V2 + V3) × proizvodna ura × 12
izguba      Penali in popusti zaradi zamud   = V4
```
PANTHEON naslavlja: planiranje kapacitet nad delovnimi nalogi · statusi nalogov in rokov, vidni prodaji in proizvodnji hkrati · verzioniranje kosovnic in tehnoloških postopkov.

### K7–K10 · Analitika in poročanje · Računovodstvo in finance · Kadri in plače · Dokumentacija in e-poslovanje

Štiri horizontalna področja, dobesedno enaka v vseh petih dejavnostih: po 5 vprašanj (3× ure, 1× EUR/leto z »Ne vem« oziroma kontekstno vprašanje, glavni vzrok). Celotne tabele so v **Prilogi A**. Vse ure v horizontalah se vrednotijo po **admin uri**.

### Zadnja stran (Korak 8 od 10) · Kratka diagnostika in Tvegani stroški

Naslov strani: **»Kratka diagnostika in Tvegani stroški«** (pri obiskovalcih brez PANTHEON-a samo »Kratka diagnostika«). Brez tekoče vsote in brez opombe o urah — na tej strani ni zneskov.

**Kratka diagnostika** — *Štiri vprašanja o podatkih in odpornosti procesa. Ne prispevajo k finančnemu rezultatu.*
Vsa štiri z isto lestvico: **Da, zanesljivo · Večinoma · Le približno · Ne · Nismo preverili** (privzeto označeno **»Nismo preverili«**, `shared.ts:51`).

| # | Vprašanje |
|---|---|
| D1 | **Ali operaterji sproti javljajo izdelane kose, čas in izmet po operaciji?** |
| D2 | **Ali so kosovnice in tehnološki postopki v sistemu v eni sami veljavni verziji?** |
| D3 | **Ali bi presojo kupca (ISO 9001, IATF 16949) prestali brez večtedenske priprave dokumentacije?** |
| D4 | **Ali proizvodnja teče normalno tudi brez tehnologa oziroma ključne osebe?** |

```
tveganje  Zanesljivost podatkov  ← (D1 + D2) / 6   (nizko ≤ 30 %, srednje ≤ 60 %, sicer visoko; neodgovorjena se izločijo)
tveganje  Procesna odpornost     ← (D3 + D4) / 6
```
Če par ostane pri »Nismo preverili«: *»Ni ocenjeno — ti vprašanji sta ostali pri „Nismo preverili". Stopnje tveganja zato ne prikazujemo; ocene si ne izmišljamo.«*

Opombe k stopnjam (izpišejo se na rezultatih):
- *Zanesljivost podatkov* — nizko: »Operacije se javljajo sproti, kosovnice so v eni veljavni verziji in strošek naloga je znan ob zaključku. Odstopanje od kalkulacije opazite, ko ga je še mogoče popraviti.« · srednje: »Podatki so delni. Razliko med kalkulacijo in dejanskim stroškom naloga praviloma opazite šele ob obračunu, ko naloga ni več mogoče popraviti.« · visoko: »Dejanskega stroška naloga in veljavne verzije kosovnice ne poznate. Dokler tega ni, natančnega zneska prodaje pod lastno ceno ni mogoče izračunati — in prav to je težava.«
- *Procesna odpornost* — nizko: »Dokumentacija za presojo je pripravljena sproti in proizvodnja ni odvisna od posameznika.« · srednje: »Dokazila za presojo se zbirajo šele ob presoji, tehnologija pa sloni na nekaj ljudeh. Ob odsotnosti tehnologa se odločitve odložijo.« · visoko: »Presoja kupca bi zahtevala tedne priprave, znanje o tehnologiji pa je v glavi ene osebe. Ena presoja ali ena odsotnost lahko ustavi dobave.«

**Tvegani stroški (modul E)** — samo, če je v V2.2 izbran PANTHEON: tri kljukice (SQL Server 2016, Windows Server 2016, e-računi ZIERDED) — glej **Prilogo B**.

## Korak 9 od 10 — Obrazec s kontaktom

> **Rezultat in PDF poročilo s tremi ukrepi za vaše kovinarstvo**
> Po oddaji se na zaslonu odpre vaš izračun, PDF poročilo za upravo ali lastnika pa prejmete na vpisani e-naslov — razčlenjeno po področjih, s formulo pod vsako postavko in tremi ukrepi, ki jih je pri delovnem nalogu, materialu in zalogah mogoče začeti ta teden.

Polja, privolitve in poziv k posvetu so enaki v vseh dejavnostih — **Priloga C**. Gumb **»Pokaži rezultate«**.

## Korak 10 od 10 — Rezultat

> **Toliko vas stane sedanji način dela v kovinarstvu**

Kartica *Neposredni letni stroški* nosi panožno opombo: *»Denar, ki dejansko odteka: presežna poraba materiala nad normativom, inventurne razlike in odpisi, nujne nabave, izgube v kooperaciji, reklamacije in penali zaradi zamud.«* Naslov PDF-ja: **Analiza skritih stroškov v kovinarstvu**. Sestava zaslona — **Priloga D**.

## Kovinarstvo v številkah

| | Vprašanj |
|---|---|
| Uvodni zaslon + Koraki 1–4 (fiksno): dejavnost 1 · zaposleni 1 · kontekst 3 · triaža 10 · osnova 3 | 18 |
| Privzeta tri področja (K1 5 + K2 5 + K3 6) | +16 |
| Diagnostika | +4 |
| **Tipična pot skupaj** | **38** *(+3 kljukice E, če je PANTHEON stranka)* |
| Vseh 10 področij (K1–K6: 32, horizontale: 20) + diagnostika | 74 *(+3)* |
| Obrazec | +10 (6 polj + 4 privolitve) |

**Denarni kanali:**

| Kanal | Kje nastane |
|---|---|
| Neposredna izguba | presežna poraba nad normativom (meja 0,5) · inventurne razlike · nujne nabave · reklamacije · izgube v kooperaciji · penali zaradi zamud · obresti in globe · napačne plače · prepozno potrjeni dokumenti |
| Nezaslužena marža | prodaja pod lastno ceno (K1) — edina postavka tega koša v kovinarstvu |
| Kapaciteta | 8 panožnih vrst ur (4 po proizvodni uri: ponovna izdelava, zastoji zaradi materiala, čakanje na kooperacijo, čakanje in nadure; 4 po admin uri) + 12 horizontalnih (vse po admin uri) |
| Enkratni kapital | zaloga × sprostljiv delež (K3) |
| Tveganje | 2 diagnostični oceni + do 3 roki iz modula E |

**Kar je namenoma brez zneska:** nastavitveni čas (samo način merjenja, K1.4), ostružki (K2.4), čas do šarže (K4.4), delež kooperacije (K5.1), način planiranja in dobave v roku (K6.1, K6.5). **Kar ni izmerjeno nikjer:** garancijski servis po predaji pri strojegradnji (servisHz je izpuščen), prihodek od prodaje ostružkov, energija po stroju.

---

# 2 · PREDELAVA PLASTIKE

Segment `plastika` (SKD C22.2: brizganje, ekstruzija, pihanje, termoformiranje). Pet panožnih področij + štiri horizontale + diagnostika + E (`segments.ts:118`). Brez horizontale *Reklamacije in poprodajni servis* (reklamacije kupcev meri panožno področje Granulat). Prag visoke izgube: 20.000 EUR (podjetja v panogi so večja).

**Posebnost te dejavnosti:** operativna ura je **strojna ura z operaterjem** (stroj + operater + energija + amortizacija), ne ura človeka. Tri od petih področij merijo strojne ure z enoto »strojnih h/mesec«; te ure so namenoma **zunaj ovojnice verjetnosti** (30 strojev × 3 izmene ne sme sprožiti opozorila, `plastika.ts:61`), motor pa jih sešteje v isto vsoto kapacitete kot delovne ure. Ročne človek-ure se v tej dejavnosti vrednotijo po **admin uri**, ker postavke za uro operaterja ni.

Izpeljava iz raziskave: `navodila/plastika/vprasalnik-plastika-izpeljava-iz-raziskave.md`.

## Uvodni zaslon

> **Koliko vas letno stane sedanji način dela v predelavi plastike?**
> Menjave orodij, izmet granulata, okvare sredi serije in odpoklici v Excelu nimajo svoje vrstice v izkazu. Plačate jih skozi maržo, opazite pa šele ob letnem rezultatu.

Spustni seznam: … · Kovinarstvo · **Predelava plastike** · Trgovina … (glej razdelek 1). Kampanjska povezava `<objava>/plastika/`.

## Korak 1 od 10 — Zaposleni

Enako kot pri kovinarstvu: **Koliko ljudi zaposlujete?** — celo število, v izračun ne vstopa.

## Korak 2 od 10 — Kontekst

> **Nekaj o vaši predelavi**
> Tri vprašanja brez številk: kaj izdelujete, kako danes vodite proizvodnjo in kdo ste v podjetju. Proizvajalec embalaže in orodjarna s predelavo imata iste stroje, a drugačne bolečine — iz odgovorov izvemo, o čem se je smiselno pogovoriti. V izračun zneskov ta odgovor ne vstopa.

**V2.1 — Kaj pretežno izdelujete?**
Tehnične dele po naročilu kupcev · Embalažo ali izdelke za trg EU · Lastne izdelke za trg · Orodja in serijsko predelavo hkrati · Kombinirano
→ *Proizvajalec embalaže za trg EU je od 12. 8. 2026 neposredni zavezanec uredbe PPWR.*

**V2.2 — Kako danes vodite proizvodnjo?** ← prodajni signal

| Odgovor | Vrzel sistema | PANTHEON? |
|---|---|---|
| PANTHEON MF in/ali MT | 8–20 % | da |
| PANTHEON brez proizvodnega modula | 15–30 % | da |
| Drug ERP ali MES za proizvodnjo | 15–30 % | ne |
| ERP za finance, proizvodnja v Excelu in na obratovalnih listih | 25–40 % | ne |
| Večinoma Excel, tabla in papir | 25–40 % | ne |

**V2.3 — Kakšna je vaša vloga?**
Direktor/-ica · Vodja proizvodnje · Tehnolog ali vodja vzdrževanja · Vodja kakovosti ali skladnosti · Finance ali računovodstvo · Drugo (lasten vpis)
→ *Utež ICP: direktor 1,00 · finance 0,80 · vse tri vloge »vodja« 0,60 · drugo 0,35.*

## Korak 3 od 10 — Triaža (9 področij)

> **Kje v predelavi plastike vas najbolj tišči?**
> Na hitro ocenite vsako področje — od menjav orodij in izmeta do planiranja strojev, okvar in zaloge granulata. Podrobna vprašanja zastavimo samo za največje težave, zato vprašalnik ostane kratek, izračun pa vezan na vaše stroje in ne na povprečje panoge.

| # | Področje | Vprašanje | 0 | 1 | 2 | 3 |
|---|---|---|---|---|---|---|
| T1 | **Izkoriščenost strojev, menjave orodij in javljanje** | Koliko strojnega časa izgubite z menjavami orodij in koliko ročnega dela imate z javljanjem proizvodnje? | Malo — menjave so hitre, podatki pridejo s strojev | Nekaj ur tedensko | Vsak dan | Stroji redno stojijo, podatki se prepisujejo |
| T2 | **Poraba granulata, izmet in reklamacije** | Kako pogosto nastajajo izmet, odstopanja porabe granulata od norme ali reklamacije? | Redko | Mesečno | Tedensko | Pri velikem deležu serij |
| T3 | **Planiranje strojev in odpoklici kupcev** | Kako pogosto se plan strojev spreminja ali odpoklici kupcev prehitijo plan? | Plan je stabilen | Občasno | Tedensko | Skoraj vsak dan |
| T4 | **Orodja, vzdrževanje in zastoji strojev** | Kako pogosto se stroj ali orodje pokvari sredi serije? | Redko | Nekajkrat na mesec | Tedensko | Skoraj vsak dan |
| T5 | **Zaloga granulata in gotovih izdelkov** | Kako pogosto imate preveč granulata, hkrati pa manjka pravi tip ali barva? | Zaloge so pod nadzorom | Občasno | Redno | Stalno |
| T6–T9 | Analitika in poročanje · Računovodstvo in finance · Kadri in plače · Dokumentacija in e-poslovanje | horizontale, vprašanja in možnosti kot v razdelku 1 (T7–T10) | | | | |

> *Podrobno bomo izračunali N od 9 področij — …* Privzeta tri: Stroji, Granulat, Planiranje.

## Korak 4 od 10 — Skupna finančna osnova

> **Skupna finančna osnova**
> Tri številke, ki veljajo za vsa področja. Strojna ura z operaterjem pomeni plačo operaterja s prispevki, energijo ter amortizacijo in vzdrževanje stroja — ne le neto plače, ker stroj stane tudi takrat, ko stoji. Administrativna ura in prihodek se vprašata enkrat — sta lastnost podjetja, ne posameznega področja.

**V4.1 — Približen polni strošek strojne ure z operaterjem**
*Stroj z operaterjem: plača operaterja, energija, amortizacija in vzdrževanje na uro obratovanja.*
**?** Strošek ene ure obratovanja stroja z operaterjem: plača operaterja s prispevki (če eden streže več strojev, sorazmeren del) + elektrika + amortizacija in vzdrževanje stroja, deljeno z urami obratovanja. Primer: operater 20 EUR + 40 kW × 0,15 EUR/kWh ≈ 6 EUR + amortizacija in vzdrževanje 6 EUR ≈ 32 EUR na uro. Če imate kalkulacijo strojne ure, vzemite njo.
Vnos EUR/h · povprečje panoge **30** · razponi: Do 25 EUR (21) · 25–35 EUR (29) · 35–50 EUR (42) · Več kot 50 EUR (60)

**V4.2 — Približen polni strošek administrativne oziroma vodstvene ure**
*Planer, vodja proizvodnje, tehnolog, nabava, priprava dela.*
Vnos EUR/h · povprečje panoge **26** · razponi kot pri kovinarstvu (Do 20 / 20–25 / 25–31 / Več kot 31 EUR)

**V4.3 — Letni prihodki od prodaje**
*Neto, brez DDV. V izračun zneskov ne vstopa — pove velikost podjetja za poročilo in primerjavo s panogo.*
**?** Čisti prihodki od prodaje iz zadnjega zaključenega leta, brez DDV — ne promet z DDV in ne prilivi na račun. Mediana v ciljnem segmentu panoge je 9,7 mio EUR (raziskava, list Naslovnica); po tem podatku prodajnik oceni velikost posla, v zneske izračuna ne vstopa.
Vnos EUR/leto · brez povprečja · razponi: Do 2 mio (1,2 mio) · 2–5 mio (3,2 mio) · 5–15 mio (8,5 mio) · Več kot 15 mio EUR (25 mio)

Brez marže, brez zaračunane postavke, brez stroška financiranja.

## Koraki 5–7 od 10 — Vaše številke

### P1 · Izkoriščenost strojev, menjave orodij in javljanje

*Strojni čas, ki ga vzamejo menjave orodij, in ure ročnega javljanja izdelanih kosov, izmeta in časov s strojev.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Koliko strojev imate v proizvodnji?**<br>*Podatek ne vstopa v izračun — služi za oceno obsega.*<br>**?** Brizgalni stroji, ekstruderji, pihalni in termoformirni stroji, ki dejansko obratujejo. Iz tega števila je mogoče presoditi, ali so strojne ure v naslednjih vprašanjih verjetne. | strojev · *samo kontekst* | 0 |
| 2 | **Kako merite izkoriščenost strojev?** — Sproti, z zajemom ciklov s strojev / Iz delovnih nalogov ali obratovalnih listov / Ocenjujemo / Ne merimo | izbira · *samo kontekst* | ni izbrano |
| 3 | **Koliko menjav orodij naredite na teden na vseh strojih skupaj?** | menjav/teden | 0 |
| 4 | **Koliko minut traja povprečna menjava orodja?**<br>*Od zadnjega dobrega kosa prejšnje serije do prvega dobrega kosa nove — ne le montaža orodja. Samo načrtovane menjave; okvaro orodja sredi serije štejte v področju Orodja.*<br>**?** Čas, ko stroj ne izdeluje: demontaža, montaža, ogrevanje, nastavitev in vzorčenje do potrjenega prvega kosa. Če menjav ne merite, vzemite zadnjih pet in ocenite. Primer: 12 menjav na teden po 45 minut ≈ 39 strojnih ur na mesec. | min | 0 |
| 5 | **Koliko skupnih ur mesečno gre za ročno javljanje izdelanih kosov, izmeta in časov s strojev ter prepis v Excel ali sistem?**<br>*Zapis na obratovalnem listu in prepis. Evidence prisotnosti za plačo (Kadri), poročila za vodstvo (Analitika) in prepisovanje odpoklicev kupcev (Planiranje) tu ne štejte.*<br>**?** Operater ob koncu izmene vpiše kose, izmet in zastoje na list, planer jih prepiše v preglednico ali sistem — isti podatek dvakrat. Ocena: serije na mesec × minut na serijo: 180 serij × 16 min ≈ 48 ur na mesec. | h/mesec | 0 |
| 6 | **Kaj je glavni vzrok?** — Zaporedje nalogov ne upošteva orodij, barv in materialov (65 %) / Časi menjav in cikli se ne merijo oziroma se javljajo ročno z zamikom (75 %) / Orodje, material ali nastavitve niso pripravljeni ob začetku menjave (65 %) / Usposobljenost nastavljalcev oziroma menjave ljudi (45 %) / Stari stroji ali orodja brez hitrih vpenjal (15 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
kapaciteta  Menjave orodij (strojne ure)                        = V3 × V4 / 60 × 4,33 × strojna ura × 12   ← meja 0,3
kapaciteta  Ročno javljanje in prepisovanje proizvodnih podatkov = V5 × admin ura × 12
```
Meja 0,3: sistem naslovi število menjav (zaporedje po orodju, barvi, materialu) in pripravo nanje, krajšanje same menjave je SMED — zadržana ocena, KALIBRACIJA (`plastika.ts:183`). Izkoriščenosti v odstotkih namenoma ne vprašamo: kdor ne meri, bi vpisal oceno, ki bi izgledala kot podatek.
PANTHEON naslavlja: ločena operacija menjave orodja v tehnološkem postopku · zajem ciklov, kosov in izmeta s proizvodnimi terminali MT · zaporedje nalogov po orodjih, barvah in materialih.

### P2 · Poraba granulata, izmet in reklamacije

*Granulat, ki konča kot izmet ali odpadna plastika, odstopanje porabe od norme in stroški reklamacij kupcev.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Kolikšna je letna vrednost porabljenega granulata, barvil in aditivov?**<br>*Nabavna vrednost materiala v zadnjih 12 mesecih — brez energije, dela in embalaže.*<br>**?** Vzemite postavko stroški materiala iz izkaza ali vsoto računov dobaviteljev granulata. Primer: 9 mio EUR prihodkov pri 45 % deležu materiala ≈ 4 mio EUR. | EUR/leto · »Ne vem« | 0 |
| 2 | **Kolikšen delež porabljenega materiala konča kot izmet, ki ga ne morete zmleti in vrniti v proces?**<br>*Samo material, ki gre iz hiše kot odpadek ali se proda kot odpadna plastika. Regranulat, ki se vrne v proces, ne šteje; odpise zaloge granulata merimo v področju Zaloge.*<br>**?** Delež vrednosti, ne kosov: vrednost odpadnega materiala delite z vrednostjo porabljenega. Primer: 120.000 EUR izmeta in odpadne plastike pri 4 mio EUR porabe je 3 %. | drsnik 0–30 %, korak 0,5 | **0 %** |
| 3 | **Ali dejansko porabo granulata na kos primerjate z normativom?** — Da, po vsaki seriji / Občasno ali za izbrane izdelke / Ne | izbira · *samo kontekst* | ni izbrano |
| 4 | **Kako vodite regranulat?** — Kot artikel v zalogi z deležem v recepturi / Evidenca mletja brez vrednosti / Ne vodimo | izbira · *samo kontekst* | ni izbrano |
| 5 | **Kolikšni so letni stroški reklamacij kupcev zaradi kakovosti?**<br>*Samo, kar še ni v izmetu: nadomestna dobava, sortiranje pri kupcu, dobropisi. Doplačila zaradi zamud rokov merimo v področju Planiranje.*<br>**?** Denar, ki je odtekel zaradi reklamacije: prevoz nadomestne serije, ure sortiranja, ki jih zaračuna kupec, dobropisi. Ocena: 10 reklamacij × 600 EUR ≈ 6.000 EUR na leto. | EUR/leto · »Ne vem« | 0 |
| 6 | **Kaj je glavni vzrok?** — Normativi porabe in recepture niso ažurni (75 %) / Izmet se javlja zbirno, brez vzroka in brez vezave na stroj in orodje (75 %) / Serija se zažene brez potrjenega prvega kosa (65 %) / Usposobljenost operaterjev in nastavljalcev (45 %) / Kakovost granulata ali dotrajana orodja (15 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
izguba  Izmet in odpadni material            = V1 × V2      ← meja 0,5
izguba  Reklamacije kupcev zaradi kakovosti  = V5
```
**Področje brez ur** — samo dve postavki neposredne izgube. Odstopanje porabe v odstotkih se ne vpraša (samo ali se sploh primerja, V3).
PANTHEON naslavlja: normativi porabe in recepture z deležem regranulata · javljanje izmeta z obveznim vzrokom, vezano na stroj in orodje · sledljivost šarže granulata do dobavljene serije.

### P3 · Planiranje strojev in odpoklici kupcev

*Ure razporejanja orodij na stroje in ponovnega planiranja, prepisovanje naročil in odpoklicov kupcev ter doplačila zaradi zamud.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Kako danes planirate stroje in orodja?** — V sistemu, z omejitvami strojev in orodij / V ERP-ju brez zanesljivega planiranja / V Excelu / Na tabli ali s sprotnim dogovorom | izbira · *samo kontekst* | ni izbrano |
| 2 | **Kako prihajajo naročila in odpoklici kupcev?** — Prek EDI ali portala neposredno v sistem / Po e-pošti, prepišemo jih v sistem / Po e-pošti, vodimo jih v Excelu / Po telefonu in z dogovorom | izbira · *samo kontekst* | ni izbrano |
| 3 | **Koliko ur mesečno porabite za razporejanje orodij na stroje, ponovno planiranje in usklajevanje prioritet?**<br>*Ure planerja in vodje proizvodnje. Ročno javljanje proizvodnih podatkov merimo v področju Stroji.*<br>**?** Sestanki o prioritetah, prestavljanje serij ob spremembi odpoklica, iskanje prostega stroja za nujno orodje. Ocena: 2 osebi × 1 h na dan × 21 dni ≈ 42 ur na mesec. | h/mesec | 0 |
| 4 | **Koliko ur mesečno porabite za prepisovanje in usklajevanje naročil ter odpoklicov kupcev?**<br>*Samo naročila in odpoklici. Potrjevanje računov in e-izmenjavo drugih dokumentov merimo v področju Dokumentacija.*<br>**?** Odpoklic pride po e-pošti ali s portala kupca, nekdo ga prepiše v Excel ali sistem in ob vsaki spremembi popravi. Ocena: 15 odpoklicev na teden × 20 min ≈ 22 ur na mesec. | h/mesec | 0 |
| 5 | **Koliko so vas v zadnjih 12 mesecih stali ekspresni prevozi, penali in popusti zaradi zamud rokov?**<br>*Samo doplačilo nad redno izvedbo in samo zaradi rokov. Reklamacije zaradi kakovosti merimo v področju Granulat; nadure so čas ekipe in sem ne sodijo.*<br>**?** Razlika med nujno in redno izvedbo, ne celotna cena: nujna dostava 900 EUR namesto 300 EUR → 600 EUR. K temu penali in popusti, ki jih je kupec odbil zaradi zamude. | EUR/leto · »Ne vem« | 0 |
| 6 | **Kaj je glavni vzrok?** — Plan ne upošteva razpoložljivosti orodij in strojev (65 %) / Naročila in odpoklici se prepisujejo ročno (75 %) / Stanje serij in nalogov ni vidno sproti (65 %) / Kupci spreminjajo odpoklice in količine (30 %) / Okvare strojev ali orodij (15 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
kapaciteta  Planiranje in usklajevanje prioritet                = V3 × admin ura × 12
kapaciteta  Prepisovanje naročil in odpoklicov kupcev           = V4 × admin ura × 12
izguba      Ekspresni prevozi, penali in popusti zaradi zamud   = V5
```
PANTHEON naslavlja: planiranje strojev in orodij s kapacitetnimi omejitvami · odpoklici kupcev v sistemu prek EDI ali portala · delovni nalogi in potrebe po materialu neposredno iz odpoklicev.

### P4 · Orodja, vzdrževanje in zastoji strojev

*Nenačrtovani zastoji zaradi okvar strojev in orodij sredi serije ter stroški nenačrtovanih popravil in nadomestnih delov.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Kolikokrat na mesec se orodje ali stroj pokvari sredi serije?**<br>*Podatek ne vstopa v izračun — služi za oceno obsega težave.*<br>**?** Vsaka zaustavitev, ki ni bila planirana: zlomljen izmetalec, puščanje hidravlike, okvara grelca. Če evidence ni, preštejte zadnji mesec po spominu — natančnost tu ni pomembna, ure v naslednjem vprašanju so. | okvar/mesec · *samo kontekst* | 0 |
| 2 | **Koliko strojnih ur mesečno stroji stojijo zaradi nenačrtovanih okvar strojev in orodij?**<br>*Samo nenačrtovane okvare. Menjave orodij merimo v področju Stroji, čakanje na material v področju Zaloge.*<br>**?** Od zaustavitve do ponovnega zagona serije, sešteto po strojih. Ocena: okvar na mesec × povprečno trajanje: 6 okvar × 4 h ≈ 24 strojnih ur na mesec. | strojnih h/mesec | 0 |
| 3 | **Kolikšni so letni stroški nenačrtovanih popravil orodij in strojev?**<br>*Nadomestni deli, zunanji servis in nujni prevozi delov — brez rednega, planiranega vzdrževanja.*<br>**?** Računi zunanjih servisov in orodjarjev za popravila, ki niso bila v planu, plus nujno naročeni deli. Iz kontov vzdrževanja izločite redne servise. Primer: 8 popravil × 1.500 EUR ≈ 12.000 EUR na leto. | EUR/leto · »Ne vem« | 0 |
| 4 | **Kako spremljate cikle in servisne intervale orodij?** — S števci na orodjih in servisnimi intervali v sistemu / Ročno, v Excelu ali na kartici orodja / Ne spremljamo | izbira · *samo kontekst* | ni izbrano |
| 5 | **Ali merite porabo energije po stroju?** — Da, s podštevci / Ocenjujemo iz nazivne moči / Ne, energija je v režiji | izbira · *samo kontekst* | ni izbrano |
| 6 | **Kaj je glavni vzrok?** — Cikli in servisni intervali orodij se ne spremljajo (75 %) / Vzdrževanje ni planirano — ukrepamo ob okvari (65 %) / Premalo vzdrževalcev ali znanja o orodjih (45 %) / Dobavitelji orodij in rezervnih delov (30 %) / Dotrajani stroji ali orodja (15 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
kapaciteta  Nenačrtovani zastoji strojev (strojne ure)   = V2 × strojna ura × 12   ← meja 0,2
izguba      Nenačrtovana popravila in nadomestni deli    = V3                      ← meja 0,2
```
Meja 0,2 na obeh postavkah: CMMS in načrtovano vzdrževanje znižata nenačrtovane zastoje za 10–20 %; orodje se obrabi ne glede na evidenco (`plastika.ts:575`). Energija ostane signal brez zneska.
PANTHEON naslavlja: števci ciklov in servisni intervali orodij z opomniki · evidenca zastojev z vzrokom po stroju in orodju · planirano vzdrževanje kot delovni nalog z nadomestnimi deli.

### P5 · Zaloga granulata in gotovih izdelkov

*Odpisi in inventurne razlike, stroji, ki čakajo na pravi granulat ali barvo, in kapital, vezan v zalogah.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Kolikšna je povprečna skupna vrednost zalog?**<br>*Vključite granulat, barvila in aditive, regranulat, nedokončano proizvodnjo in gotove izdelke.*<br>**?** Povprečno stanje med letom po nabavni vrednosti — ne stanje na današnji dan in ne letna poraba. Vzemite postavko iz bilance ali povprečje nekaj mesečnih stanj. | EUR | 0 |
| 2 | **Kolikšna je bila v zadnjih 12 mesecih vrednost odpisov zaloge in inventurnih razlik?**<br>*Zastaran ali kontaminiran granulat, inventurne razlike, razvrednoteni gotovi izdelki. Izmet iz proizvodnje merimo v področju Granulat.*<br>**?** Odpisi ob inventuri in razvrednotenja: granulat, ki se je navlažil ali mu je potekel rok, barve za ukinjene izdelke, gotovi izdelki brez kupca. Vzemite zapisnik zadnje inventure. | EUR/leto · »Ne vem« | 0 |
| 3 | **Koliko strojnih ur mesečno stroji stojijo, ker pravega granulata, barve ali embalaže ni na zalogi?**<br>*Samo čakanje stroja na material. Zastoje zaradi okvar merimo v področju Orodja, menjave orodij v področju Stroji.*<br>**?** Stroj z nameščenim orodjem čaka, ker granulata ni, ni posušen ali je napačne barve. Ocena: 4 zastoji × 3 h ≈ 12 strojnih ur na mesec. | strojnih h/mesec | 0 |
| 4 | **Kolikšen delež zalog bi po vaši oceni lahko zmanjšali brez tveganja za oskrbo?** — Do 5 % / 6–10 % / 11–20 % / Več kot 20 % / **Ne vem** (deleži 5 / 8 / 15 / 25 / 10 %)<br>**?** Ne koliko zaloge imate, ampak koliko bi je lahko trajno bilo manj, ne da bi kdaj zmanjkalo — tiste, ki leži zaradi previdnosti ali slabega pregleda. Groba ocena zadostuje. | izbira | Ne vem → 10 % |
| 5 | **Kako dober je vaš pregled nad zalogo granulata po tipih, barvah in šaržah?** — Sproten, po tipu, barvi in šarži / Večinoma zanesljiv / Deloma ERP, deloma Excel / Pogosto ugotovimo šele ob inventuri | izbira · *samo kontekst* | ni izbrano |
| 6 | **Kaj je glavni vzrok?** — Stanje zalog po tipih, barvah in šaržah ni zanesljivo (75 %) / Nabava ni povezana z odpoklici in planom proizvodnje (65 %) / Šarže in lokacije se ne vodijo (75 %) / Dobavitelji granulata in nihanje cen (30 %) / Zalogo zavestno držimo kot varovalko (65 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
izguba            Odpisi zaloge in inventurne razlike          = V2
kapaciteta        Čakanje strojev na material (strojne ure)    = V3 × strojna ura × 12
enkratni kapital  Sprostljiv obratni kapital v zalogah         = V1 × delež iz V4
```
PANTHEON naslavlja: zaloga granulata po tipu, barvi, šarži in lokaciji · potrebe po materialu iz odpoklicev in receptur · prevzem regranulata v zalogo kot artikel.

### P6–P9 · Horizontale

Analitika in poročanje · Računovodstvo in finance · Kadri in plače · Dokumentacija in e-poslovanje — **Priloga A**.

### Zadnja stran (Korak 8 od 10) · Kratka diagnostika in Tvegani stroški

**Kratka diagnostika** — *Šest vprašanj o podatkih, sledljivosti in odpornosti procesa ter eno o trgu EU. Ne prispevajo k finančnemu rezultatu.* — tri pari namesto dveh, ker je PPWR osrednja regulatorna tema panoge (`plastika.ts:744`). Lestvica kot povsod (Da, zanesljivo · Večinoma · Le približno · Ne · Nismo preverili).

| # | Vprašanje | Par |
|---|---|---|
| D1 | **Ali sproti evidentirate izdelane kose, izmet in porabo granulata po delovnem nalogu?** | Zanesljivost podatkov |
| D2 | **Ali poznate dejanski strošek kosa iz izmerjenega cikla, porabe in energije?** | Zanesljivost podatkov |
| D3 | **Ali lahko vsako dobavljeno serijo povežete s šaržo granulata, strojem in orodjem?** | Sledljivost in dokazovanje sestave (PPWR) |
| D4 | **Ali za vsak izdelek poznate sestavo materiala in delež reciklata, kot ju zahteva uredba PPWR?** | Sledljivost in dokazovanje sestave (PPWR) |
| D5 | **Ali proizvodnja teče normalno tudi brez tehnologa ali vodje proizvodnje?** | Procesna odpornost |
| D6 | **Ali so nastavitve strojev in tehnološki listi zapisani, verzionirani in dostopni ob stroju?** | Procesna odpornost |
| D7 | ☐ **Dajemo embalažo ali embalirane izdelke na trg EU (velja uredba PPWR)** | kljukica · *samo kontekst* — prodajni signal |

```
tveganje  Zanesljivost podatkov                        ← (D1 + D2) / 6
tveganje  Sledljivost in dokazovanje sestave (PPWR)    ← (D3 + D4) / 6
tveganje  Procesna odpornost                           ← (D5 + D6) / 6
```
Opomba PPWR pri visokem tveganju: *»Sledljivosti do šarže granulata praktično ni in sestava materiala po izdelku ni znana. Uredba PPWR velja od 12. 8. 2026 in zahteva tehnično dokumentacijo o sestavi embalaže s hrambo 5 oziroma 10 let — zahteve kupca po teh podatkih danes ne morete izpolniti.«* (nizko in srednje: `plastika.ts:731`). Opombi za podatke in proces: `plastika.ts:724`, `plastika.ts:738`.

**Tvegani stroški (modul E)** — samo uporabnikom PANTHEON, **Priloga B**.

## Korak 9 od 10 — Obrazec s kontaktom

> **Rezultat in PDF poročilo s tremi ukrepi za vašo predelavo**
> Po oddaji se na zaslonu odpre vaš izračun, PDF poročilo za upravo ali lastnika pa prejmete na vpisani e-naslov — razčlenjeno po področjih, s formulo pod vsako postavko in tremi ukrepi, ki jih je pri menjavah, izmetu in planiranju mogoče začeti ta teden.

Polja — **Priloga C**.

## Korak 10 od 10 — Rezultat

> **Toliko vas stane sedanji način dela v predelavi plastike**

Panožni opombi na karticah: *Neposredni letni stroški* — »Denar, ki dejansko odteka: izmet in odpadna plastika, reklamacije, nenačrtovana popravila orodij, odpisi zaloge granulata, ekspresni prevozi in penali.« · *Vrednost izgubljene kapacitete* — »Strojne in delovne ure skupaj. To ni prihranek pri plačah ne pri amortizaciji — stroj in ekipa ostaneta, njun čas pa se lahko usmeri v izdelavo.« (v PDF-ju: »strojne in delovne ure skupaj; ni prihranek pri plačah ne pri amortizaciji.«). Naslov PDF-ja: **Analiza skritih stroškov v predelavi plastike**. Sestava zaslona — **Priloga D**.

## Predelava plastike v številkah

| | Vprašanj |
|---|---|
| Uvodni zaslon + Koraki 1–4: dejavnost 1 · zaposleni 1 · kontekst 3 · triaža 9 · osnova 3 | 17 |
| Privzeta tri področja (P1 6 + P2 6 + P3 6) | +18 |
| Diagnostika (6 + kljukica PPWR) | +7 |
| **Tipična pot skupaj** | **42** *(+3 kljukice E)* |
| Vseh 9 področij (P1–P5: 30, horizontale: 20) + diagnostika | 74 *(+3)* |
| Obrazec | +10 |

**Denarni kanali:**

| Kanal | Kje nastane |
|---|---|
| Neposredna izguba | izmet in odpadni material (meja 0,5) · reklamacije · ekspresni prevozi in penali · nenačrtovana popravila (meja 0,2) · odpisi zaloge · obresti in globe · napačne plače · prepozno potrjeni dokumenti |
| Nezaslužena marža | — (v tej dejavnosti ni postavke) |
| Kapaciteta | 3 postavke v **strojnih urah** × strojna ura (menjave z mejo 0,3, nenačrtovani zastoji z mejo 0,2, čakanje na material) + 3 človek-ure × admin ura (javljanje, planiranje, odpoklici) + 12 horizontalnih |
| Enkratni kapital | zaloga × sprostljiv delež (P5) |
| Tveganje | **3** diagnostične ocene (edina dejavnost s tremi) + do 3 roki iz modula E |

**Kar je namenoma brez zneska:** izkoriščenost strojev v odstotkih (samo način merjenja), odstopanje porabe od norme (samo ali se primerja), regranulat, energija po stroju, PPWR (tveganje in signal, ne evri), nadure (da se ista ura ne šteje dvakrat).

---

# 3 · INŽENIRING

Segment `inzeniring` (inženiring in izvedba na ključ: projektiranje, nabava opreme, montaža s podizvajalci, zagon, prevzem; SKD M71 in F43). Pet panožnih področij + štiri horizontale + diagnostika + E (`segments.ts:300`). Brez horizontale *Dokumentacija in e-poslovanje* (projektno dokumentacijo meri panožno področje), **z** horizontalo *Reklamacije in poprodajni servis* (meri garancijske ure in dele PO predaji na lasten strošek; panožno področje Obračun meri samo neobračunani servis — različna koša, brez preseka). Prag visoke izgube: 20.000 EUR.

**Posebnost te dejavnosti:** za razliko od storitev **ne vpraša zaračunane urne postavke** — inženiring ne prodaja ur, ampak projekte. Nezaračunano delo se vpraša v evrih (dodatna dela brez aneksa, servis) in gre v neposredno izgubo; vse interne ure gredo v kapaciteto po strošku ure. Edino področje, ki bere prihodek, je Obračun po fazah (denar, vezan v fazah brez računa).

Izpeljava iz raziskave: `navodila/inzeniring/vprasalnik-inzeniring-izpeljava-iz-raziskave.md`.

## Uvodni zaslon

> **Koliko marže projekta vam letno vzamejo aneksi, oprema in ure?**
> Dodatna dela brez aneksa, oprema, ki konča na drugem projektu, zaključene faze brez računa in ure, ki jih nihče ne pripiše projektu. Nič od tega nima svojega konta — plačate skozi maržo.

Spustni seznam: … · Gradbeništvo · **Inženiring** · Maloprodaja … (glej razdelek 1). Kampanjska povezava `<objava>/inzeniring/`. Projektantski biro brez izvedbe ostane v storitvah (`industries.ts:58`).

## Korak 1 od 10 — Zaposleni

Enako kot pri kovinarstvu.

## Korak 2 od 10 — Kontekst

> **Nekaj o vašem inženiringu**
> Tri vprašanja brez številk: kaj izvajate, kako danes vodite projekte, ure in opremo ter kdo ste v podjetju. Projektant in izvajalec na ključ imata isti poklic, a drugačne bolečine — iz odgovorov izvemo, o čem se je smiselno pogovoriti. V izračun zneskov ta odgovor ne vstopa.

**V2.1 — Kaj pretežno izvajate?**
Projektiranje in inženiring brez lastne izvedbe · Izvedba na ključ — energetika in elektro sistemi · Izvedba na ključ — industrijski in procesni sistemi · Inženiring z lastnim servisom in vzdrževanjem po prevzemu · Več od tega ali skupina povezanih družb
→ *Prodajniku pove, ali gre pogovor o urah (biro) ali o opremi in fazah (izvedba na ključ).*

**V2.2 — Kako danes vodite projekte, ure in opremo?** ← prodajni signal

| Odgovor | Vrzel sistema | PANTHEON? |
|---|---|---|
| PANTHEON s projekti, evidenco ur in zalogo po projektu | 8–20 % | da |
| PANTHEON brez projektnega spremljanja | 15–30 % | da |
| Drug ERP ali projektno orodje | 15–30 % | ne |
| Računovodski program in projektni Excel | 25–40 % | ne |
| Večinoma Excel, e-pošta in papir | 25–40 % | ne |

**V2.3 — Kakšna je vaša vloga?**
Direktor/-ica ali lastnik · Tehnični direktor ali vodja tehnike · Vodja projektov · Finance ali računovodstvo · Nabava ali servis · Drugo (lasten vpis)
→ *Utež ICP: direktor 1,00 · finance 0,80 · vodja tehnike in vodja projektov 0,60 · nabava ali servis in drugo 0,35.*

## Korak 3 od 10 — Triaža (9 področij)

> **Kje pri vodenju projektov vas najbolj tišči?**
> Na hitro ocenite vsako področje — od marže projekta in aneksov do opreme, obračuna po fazah in projektne dokumentacije. Podrobna vprašanja zastavimo samo za največje težave, zato vprašalnik ostane kratek, izračun pa vezan na vaše projekte in ne na povprečje panoge.

| # | Področje | Vprašanje | 0 | 1 | 2 | 3 |
|---|---|---|---|---|---|---|
| T1 | **Marža projekta in evidenca ur** | Kako hitro po zaključku projekta veste, kakšno maržo je dejansko prinesel? | Sproti, med izvedbo | V nekaj tednih po zaključku | Šele ob letnem obračunu | Marže po projektu ne poznamo |
| T2 | **Spremembe obsega in aneksi** | Kako pogosto izvedete dodatna dela, preden je sprememba obsega pisno potrjena? | Nikoli — aneks je pred izvedbo | Občasno, pri manjših spremembah | Redno, aneks uredimo za nazaj | Praviloma; del sprememb nikoli ne zaračunamo |
| T3 | **Oprema, nabava in podizvajalci** | Kako pogosto se oprema, naročena za en projekt, porabi drugje ali ekipa na terenu čaka nanjo? | Oprema je vezana na projekt in prispe pravočasno | Občasno | Redno, brez sledi v evidenci | Ne vemo, katera oprema je čigava |
| T4 | **Obračun po fazah, zadržki in vzdrževalne pogodbe** | Koliko časa mine od zaključka faze ali prevzema do izstavitve računa? | Nekaj dni, ob zapisniku | Do dva tedna | Mesec ali več | Odvisno, kdo se spomni |
| T5 | **Projektna dokumentacija, razpisi in prevzem** | Kako hitro najdete veljavni načrt, meritev ali dobavnico za katerikoli projekt? | V nekaj minutah, iz sistema | V nekaj urah, iz map | V nekaj dneh, s klici | Odvisno, kdo je projekt vodil |
| T6 | **Analitika in poročanje** | horizontala (razdelek 1, T7) | | | | |
| T7 | **Računovodstvo in finance** | horizontala (razdelek 1, T8) | | | | |
| T8 | **Kadri in plače** | horizontala (razdelek 1, T9) | | | | |
| T9 | **Reklamacije in poprodajni servis** | Koliko dela vam povzročajo garancijska popravila, servis in vodenje reklamacij po predaji? | Skoraj nič — primerov je malo | Nekaj primerov na mesec | Vsak teden več primerov | S servisom se nekdo ukvarja vsak dan |

Privzeta tri: Marža, Aneksi, Oprema.

## Korak 4 od 10 — Skupna finančna osnova

> **Skupna finančna osnova**
> Štiri številke, ki veljajo za vsa področja. Polni strošek ure pomeni bruto plačo s prispevki delodajalca ter regresom, malico in prevozom — ne neto izplačila in ne režije. Letno vrednost projektov in strošek financiranja vprašamo enkrat — sta lastnost podjetja, ne posameznega področja; množita denar, vezan v fazah brez računa.

**V4.1 — Približen polni strošek inženirske ure**
*Inženir, tehnik, vodja montaže, serviser — kdor dela na projektu ali na terenu.*
**?** (skupno pojasnilo polnega stroška ure, glej razdelek 1)
Vnos EUR/h · povprečje panoge **30** · razponi: Do 22 EUR (18) · 22–28 EUR (25) · 28–35 EUR (32) · Več kot 35 EUR (40)

**V4.2 — Približen polni strošek administrativne oziroma vodstvene ure**
*Vodja projekta pri obračunu, nabava, priprava ponudb, računovodstvo.*
Vnos EUR/h · povprečje panoge **26** · razponi: Do 20 / 20–25 / 25–31 / Več kot 31 EUR

**V4.3 — Letna vrednost izvedenih projektov**
*Neto, brez DDV — vključno z opremo in podizvajalci, ki gredo skozi vaše račune. Če razpona ne izberete, postavk, vezanih na prihodek, ne bomo ocenili — prihodka si ne izmišljamo.*
Vnos EUR/leto · brez povprečja (privzeto 0) · razponi: Do 2 mio EUR (1,2 mio) · 2–5 mio EUR (3,2 mio) · 5–12 mio EUR (8 mio) · Več kot 12 mio EUR (18 mio)
→ *Množi ga področje Obračun po fazah. Če je to področje izbrano in izpolnjeno, prihodek pa manjka, pade zanesljivost na »nizko«.*

**V4.4 — Letni strošek financiranja obratnega kapitala**
*Obrestna mera posojila oziroma donos, ki bi ga denar prinesel drugje. Množi denar, vezan v zaključenih fazah, ki še niso zaračunane.*
**?** Koliko vas stane, da je denar vezan v terjatvah in zalogah namesto na računu: obrestna mera vašega posojila ali donos, ki bi ga denar prinesel drugje. Primer: pri 8 % vas 100.000 EUR zaloge stane 8.000 EUR na leto.
Vnos % · povprečje panoge **8,5 %** · razponi: Do 5 % (4 %) · 5–8 % (6,5 %) · 8–12 % (10 %) · Več kot 12 % (15 %)

Brez marže in brez zaračunane urne postavke.

## Koraki 5–7 od 10 — Vaše številke

### I1 · Marža projekta in evidenca ur

*Ure, ki niso pripisane projektu, delo nad lastno kalkulacijo in ročno sestavljanje stanja stroškov in marže po projektih.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Kako primerjate kalkulacijo projekta z dejanskimi stroški?** — Sproti, v sistemu po projektu in fazi / Ob zaključku projekta / Občasno, v Excelu / Ne primerjamo | izbira · *samo kontekst* | ni izbrano |
| 2 | **Koliko ur mesečno gre za naknadno vpisovanje, rekonstrukcijo in razporejanje ur inženirjev na projekte in faze?**<br>*Samo razporejanje ur na projekte in faze za stroške projekta. Evidenco prisotnosti, dopustov in podlago za plačo merimo v področju Kadri in plače.*<br>**?** Vodja projekta ali pisarna ob koncu meseca sestavlja, kdo je koliko delal na katerem projektu, in to prepiše v preglednico ali sistem. Ocena: 4 vodje × 4 h na mesec + 8 h pisarne ≈ 24 ur na mesec. | h/mesec | 0 |
| 3 | **Koliko ur inženirjev in monterjev mesečno porabite nad lastno kalkulacijo pri nespremenjenem obsegu projekta?**<br>*Samo ure nad lastno kalkulacijo pri nespremenjenem obsegu. Dodatna dela po zahtevi naročnika, ki niso bila zaračunana, vpišite v evrih v področju Spremembe obsega in aneksi.*<br>**?** Projekt s fiksno ceno, kalkuliran na 400 ur, je vzel 460 — 60 ur je šlo iz marže, ne da bi kdo kaj spremenil. Ocena: 3 projekti na mesec × 15 % nad kalkulacijo × 300 ur ≈ 135 ur na mesec. | h/mesec | 0 |
| 4 | **Koliko ur mesečno vodje projektov in računovodstvo porabijo za sestavljanje stanja stroškov in marže po projektih ter oceno nedokončanih projektov?**<br>*Samo stanje posameznega projekta. Redna poročila za vodstvo merimo v področju Analitika in poročanje, knjiženje in pripravo listin pa v področju Računovodstvo in finance.*<br>**?** Zbiranje računov dobaviteljev, podizvajalskih situacij in ur, da nastane stanje stroškov enega projekta; ob zaključkih še ocena stopnje dokončanosti za bilanco. Ocena: 5 projektov × 3 h ≈ 15 ur na mesec. | h/mesec | 0 |
| 5 | **Koliko dni po zaključku projekta poznate njegovo dejansko maržo?**<br>*Podatek ne vstopa v izračun — pove, kako hitro se odstopanje sploh opazi.*<br>**?** Dnevi od primopredaje do trenutka, ko so vsi stroški projekta knjiženi in primerjani s kalkulacijo. Če marže po projektu ne računate, vpišite 0 in to povejte v naslednjem vprašanju. | dni · *samo kontekst* | 0 |
| 6 | **Kaj je glavni vzrok?** — Ure se na projekte vpisujejo šele ob koncu meseca ali po spominu (75 %) / Kalkulacija in dejanski stroški projekta niso v istem sistemu (75 %) / Stanje stroškov projekta ni vidno sproti, ampak šele ob zaključku (65 %) / Inženirji evidence ne vodijo dosledno (45 %) / Naročniki spreminjajo obseg med izvedbo (30 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
kapaciteta  Naknadno razporejanje ur na projekte              = V2 × admin ura × 12
kapaciteta  Delo nad lastno kalkulacijo                       = V3 × inženirska ura × 12
kapaciteta  Sestavljanje stanja stroškov in marže projektov   = V4 × admin ura × 12
```
**Neposredna izguba: 0 EUR** — delo nad kalkulacijo je po strošku ure, ne po ceni (za to delo ni bilo dogovora o plačilu, `inzeniring.ts:157`).
PANTHEON naslavlja: projektno stroškovno mesto: stroški, prihodki in marža po projektu in fazi · evidenca ur inženirjev z obvezno projektno in fazno oznako · primerjava kalkulacije z dejanskimi stroški brez prepisovanja v Excel.

### I2 · Spremembe obsega in aneksi

*Dodatna dela, izvedena pred aneksom in nikoli zaračunana, naknadno dokazovanje sprememb ter ponudbe in kalkulacije iz starih datotek.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Kolikšna je bila v zadnjih 12 mesecih vrednost dodatnih del in opreme po zahtevi naročnika, ki ste jih izvedli brez aneksa in jih niste zaračunali?**<br>*Vrednost po ponudbi ali kalkulaciji — delo in oprema skupaj. Preseganje lastne kalkulacije pri nespremenjenem obsegu merimo v urah v področju Marža projekta.*<br>**?** Naročnik je zahteval dodatno napeljavo, drug tip opreme ali prestavitev — izvedli ste, aneksa ni bilo, račun tudi ne. Ocena: 8 projektov × 2 spremembi × 1.500 EUR ≈ 24.000 EUR na leto. | EUR/leto · »Ne vem« | 0 |
| 2 | **Koliko ur mesečno gre za naknadno dokazovanje sprememb, pripravo aneksov za nazaj in usklajevanje z naročnikom ali nadzorom?**<br>*Samo delo okrog sprememb obsega. Ročno pripravo situacij in računov merimo v področju Obračun po fazah.*<br>**?** Iskanje e-pošte in gradbenega dnevnika, ki dokazuje, da je bila sprememba naročena, in sestavljanje aneksa, ko je delo že opravljeno. Ocena: 6 sprememb × 3 h ≈ 18 ur na mesec. | h/mesec | 0 |
| 3 | **Koliko ur mesečno porabite za iskanje starih kalkulacij, ponovno poizvedovanje cen opreme in prepisovanje med ponudbo, naročilom in projektom?**<br>*Samo iskanje, poizvedovanje in prepisovanje — ne celotne priprave ponudbe.*<br>**?** Ponudba se začne z lansko datoteko: cene opreme je treba znova preveriti pri dobaviteljih, postavke prepisati v naročilo in projekt. Ocena: 5 ponudb × 4 h ≈ 20 ur na mesec. | h/mesec | 0 |
| 4 | **Kdaj se sprememba obsega praviloma potrdi?** — Pisno pred izvedbo / Ustno pred izvedbo, pisno po njej / Šele ob obračunu / Pogosto nikoli | izbira · *samo kontekst* | ni izbrano |
| 5 | **Kaj je glavni vzrok?** — Obseg v pogodbi in ponudbi ni natančno zapisan (75 %) / Spremembe se ne beležijo kot dodatno naročilo s statusom (75 %) / Cene opreme in stare kalkulacije niso na enem mestu (75 %) / Naročnik ali nadzor sprememb ne potrdi pisno (30 %) / Vodje dodatno delo raje opravijo, kot dokumentirajo (45 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
izguba      Dodatna dela brez aneksa, nikoli zaračunana         = V1     (po ponudbeni vrednosti — edini znesek v tej dejavnosti, ki meri izgubljen prihodek)
kapaciteta  Naknadno dokazovanje sprememb in aneksi za nazaj    = V2 × admin ura × 12
kapaciteta  Iskanje kalkulacij in poizvedovanje cen opreme      = V3 × admin ura × 12
```
PANTHEON naslavlja: pogodbe in aneksi z zapisanim obsegom · sprememba obsega kot dodatno naročilo s statusom, ne kot tiha dodelava · ponudba, kalkulacija in cene opreme iz istega šifranta artiklov.

### I3 · Oprema, nabava in podizvajalci

*Oprema, ki ostane po projektih ali konča na drugem projektu, ekspresne dobave in kazni zaradi zamud opreme, čakanje na terenu ter usklajevanje podizvajalcev.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Kolikšna je nabavna vrednost opreme in materiala na zalogi, ki nista vezana na noben odprt projekt (ostanki projektov)?**<br>*Samo ostanki projektov: oprema, naročena za projekt, ki je zaključen, in material, ki ga nihče ne načrtuje. Načrtovane zaloge rezervnih delov za servis sem ne sodijo.*<br>**?** Sprehod po skladišču: kabli, omarice, ventili in naprave, za katere nihče ne ve, na kateri projekt gredo. Ocena: 12 zaključenih projektov × 1,5 % vrednosti opreme ostane ≈ 40.000 EUR. | EUR · »Ne vem« | 0 |
| 2 | **Kolikšen delež te opreme bi po vaši oceni lahko porabili na projektih ali prodali, ne da bi kaj zmanjkalo?** — Do 5 % / 6–10 % / 11–20 % / Več kot 20 % / **Ne vem** (5 / 8 / 15 / 25 / 10 %)<br>**?** Oprema brez projekta je denar, ki stoji na polici. Delež, ki bi ga z evidenco po projektu vgradili drugje ali vrnili dobavitelju, je sprostljiv kapital; ostanek je odpis, ki ga tu ne štejemo. | izbira | Ne vem → 10 % |
| 3 | **Koliko ste v zadnjih 12 mesecih plačali za ekspresne dobave, dodatne prevoze, stojnine podizvajalcev in pogodbene kazni zaradi zamud opreme?**<br>*Samo stroški, ki ste jih plačali vi zaradi opreme in rokov. Globe zaradi davčnih obračunov merimo v področju Računovodstvo in finance.*<br>**?** Razlika med nujno in redno izvedbo: letalska dostava namesto kamiona, monterji, ki jih plačate za čakanje, penal naročniku, ker oprema ni prišla. Ocena: 6 dogodkov × 2.000 EUR ≈ 12.000 EUR na leto. | EUR/leto · »Ne vem« | 0 |
| 4 | **Koliko ur mesečno lastni monterji in inženirji na terenu čakajo na opremo, material ali podizvajalca?**<br>*Samo čakanje na opremo, material in podizvajalce. Čas brez dostopa do načrtov in podatkov merimo v področju Projektna dokumentacija.*<br>**?** Ekipa je na objektu, omarica pa še ni prispela ali podizvajalec še ni končal svoje faze. Ocena: 2 ekipi × 3 osebe × 4 h na teden ≈ 100 ur na mesec. | h/mesec | 0 |
| 5 | **Koliko ur mesečno gre za spremljanje dobavnih rokov, iskanje opreme po projektih, usklajevanje podizvajalcev in preverjanje njihovih situacij?**<br>*Nabava in vodje projektov. Ure, ki ste jih že vpisali v drugem področju, tu ne ponavljajte.*<br>**?** Klici dobaviteljem za potrditev roka, iskanje, kje je oprema za projekt, primerjava podizvajalske situacije s pogodbo in izvedbo. Ocena: 2 osebi × 1,5 h na dan ≈ 63 ur na mesec. | h/mesec | 0 |
| 6 | **Kaj je glavni vzrok?** — Naročilo in prevzem opreme ne nosita projektne oznake (75 %) / Dobavni roki opreme niso povezani s terminskim planom (65 %) / Podizvajalci in njihove situacije nimajo enotne evidence (75 %) / Nabava poteka mimo okvirnih pogodb, vsakič znova (65 %) / Dobavitelji opreme zamujajo (30 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
enkratni kapital  Sprostljiv kapital v opremi brez projekta          = V1 × delež iz V2
izguba            Ekspresne dobave, stojnine in kazni zaradi opreme  = V3
kapaciteta        Čakanje na terenu na opremo ali podizvajalca       = V4 × inženirska ura × 12
kapaciteta        Spremljanje rokov in usklajevanje podizvajalcev    = V5 × admin ura × 12
```
PANTHEON naslavlja: zaloga po projektu: naročilo, prevzem in izdaja opreme nosijo projektno oznako · naročila dobaviteljem s potrjenimi roki, vidnimi ob terminskem planu projekta · podizvajalske pogodbe in prejete situacije, vezane na projekt in fazo.

### I4 · Obračun po fazah, zadržki in vzdrževalne pogodbe

*Denar, vezan v zaključenih fazah brez računa, zapadli zadržki in garancije, neobračunani servis po prevzemu ter ročna priprava situacij.* — **edino področje, ki množi prihodek** (`usesRevenue`).

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Koliko dni po zaključku faze (prevzemu, dobavi opreme, mejniku) v povprečju izdate situacijo ali račun?**<br>*Do izdaje računa, ne do plačila. Zamude naročnikov pri plačilu tu ne štejejo — to je pogodbeni rok, ne napaka obračuna.*<br>**?** Dnevi od potrjenega mejnika do datuma računa. Zapisnik o prevzemu faze je hkrati dokazilo o datumu opravljene storitve za DDV — prepozen račun pomeni tudi DDV v napačnem obdobju. Primer: faza končana 3., račun 24. → 21. | dni | 0 |
| 2 | **Kolikšna je vrednost zapadlih, nespornih, a še neunovčenih zadržanih sredstev in bančnih garancij?**<br>*Samo zadržki in garancije, ki jih že smete zahtevati, pa jih še niste. Odprte terjatve v roku sem ne sodijo.*<br>**?** Zadržek 5–10 % vrednosti projekta se sprosti po garancijski dobi ali ob prevzemu — če nihče ne spremlja datuma, ostane pri naročniku. Ocena: 4 projekti × 15.000 EUR zadržka po roku ≈ 60.000 EUR. | EUR · »Ne vem« | 0 |
| 3 | **Kolikšna je bila v zadnjih 12 mesecih vrednost servisnih posegov in vzdrževalnih pogodb po prevzemu, ki bi jih smeli zaračunati, pa jih niste?**<br>*Samo zaračunljivo delo po pogodbi ali na klic. Garancijska popravila na vaš strošek — ure, deli, kulanca — merimo v področju Reklamacije in poprodajni servis.*<br>**?** Serviser gre na objekt po klicu, poseg ni na nobenem nalogu, račun ne nastane; ali pa vzdrževalna pogodba poteče, ne da bi jo kdo obnovil. Ocena: 30 posegov × 400 EUR ≈ 12.000 EUR na leto. | EUR/leto · »Ne vem« | 0 |
| 4 | **Koliko ur mesečno gre za ročno pripravo situacij in obračunov po fazah, poročil o napredku za naročnika in spremljanje zadržkov?**<br>*Samo obračun projektov. Usklajevanje bank, kartic in odprtih postavk merimo v področju Računovodstvo in finance.*<br>**?** Vodja projekta zbere količine in mejnike, računovodstvo jih prepiše v situacijo, nekdo ročno preverja, kateri zadržek zapade. Ocena: 8 situacij × 3 h + 6 h spremljanja ≈ 30 ur na mesec. | h/mesec | 0 |
| 5 | **Kaj sproži izstavitev računa za fazo?** — Zapisnik o prevzemu v sistemu / Vodja projekta sporoči računovodstvu / Pregled ob koncu meseca / Ko vpraša naročnik ali banka | izbira · *samo kontekst* | ni izbrano |
| 6 | **Kaj je glavni vzrok?** — Zaključek faze in izstavitev računa nista povezana v sistemu (75 %) / Zadržki, garancije in vzdrževalne pogodbe nimajo opomnikov (65 %) / Servisni posegi po prevzemu niso vezani na pogodbo (75 %) / Obračun je odvisen od ene osebe, ki spremlja mejnike (45 %) / Naročnik prevzema ne potrdi pravočasno (30 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
izguba            Denar, vezan v zaključenih fazah brez računa          = letna vrednost projektov / 365 × V1 × strošek financiranja
enkratni kapital  Zapadli, neunovčeni zadržki in garancije              = V2   (100 %, brez deleža — po definiciji zapadlo in nesporno)
izguba            Neobračunani servisni posegi in vzdrževalne pogodbe   = V3
kapaciteta        Ročna priprava situacij in spremljanje zadržkov       = V4 × admin ura × 12
```
Brez odgovora o prihodku je prva postavka 0 — prometa si ne izmišljamo (`inzeniring.ts:536`).
PANTHEON naslavlja: obračun po mejnikih namesto ob zaključku projekta · zapisnik o prevzemu kot datum opravljene storitve za DDV in sprožilec računa · vzdrževalne pogodbe s ponavljajočim fakturiranjem in evidenco posegov po napravi.

### I5 · Projektna dokumentacija, razpisi in prevzem

*Iskanje veljavnih načrtov in dokazil, zbiranje referenc za razpise, ponovno sestavljanje dokumentacije ob predaji in teren brez dostopa do podatkov.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Kje je danes projektna dokumentacija?** — V dokumentnem sistemu, vezana na projekt / V omrežnih mapah po projektih / V e-pošti in osebnih računalnikih / Različno, odvisno od projekta | izbira · *samo kontekst* | ni izbrano |
| 2 | **Koliko ur mesečno inženirji porabijo za iskanje veljavne različice načrtov, specifikacij, dopisov in dobavnic?**<br>*Samo iskanje projektnih dokumentov. Iskanje opreme in usklajevanje rokov merimo v področju Oprema.*<br>**?** Katera različica načrta velja, kje je potrjena specifikacija, kdo ima dobavnico — vsak inženir po nekaj minut na dan. Ocena: 8 inženirjev × 20 min na dan × 21 dni ≈ 56 ur na mesec. | h/mesec | 0 |
| 3 | **Koliko ur mesečno gre za zbiranje referenc, potrdil in sestavljanje razpisne dokumentacije iz starih projektov?**<br>*Samo reference in razpisi. Poročila za vodstvo merimo v področju Analitika in poročanje.*<br>**?** Za vsak razpis znova: potrdila naročnikov, opisi in fotografije zaključenih projektov, seznam kadrov. Ocena: 2 razpisa na mesec × 12 h ≈ 24 ur na mesec. | h/mesec | 0 |
| 4 | **Koliko dodatnih ur mesečno gre ob predaji za ponovno zbiranje meritev, CE izjav, zagonskih poročil in dokumentacije izvedenih del?**<br>*Ne celotne priprave projekta izvedenih del — samo čas, izgubljen z iskanjem in ponovnim zbiranjem dokazil, ki že obstajajo.*<br>**?** Meritve so pri električarju, CE izjave pri dobavitelju, zagonsko poročilo v e-pošti — ob prevzemu jih nekdo zbira dneve. Ocena: 3 prevzemi × 10 h ≈ 30 ur na mesec. | h/mesec | 0 |
| 5 | **Koliko ur mesečno monterji in inženirji na terenu izgubijo, ker nimajo dostopa do načrtov, stanja naročil in podatkov o projektu?**<br>*Klici v pisarno in čakanje na podatek. Čakanje na opremo ali podizvajalca merimo v področju Oprema, potne naloge v področju Kadri in plače.*<br>**?** Monter kliče v pisarno, ker ne ve, ali je bila sprememba potrjena in kdaj pride oprema; inženir vozi načrte na objekt. Ocena: 6 ljudi na terenu × 2 h na teden ≈ 50 ur na mesec. | h/mesec | 0 |
| 6 | **Kaj je glavni vzrok?** — Dokumenti so v mapah, e-pošti in osebnih računalnikih (75 %) / Meritve, certifikati in protokoli nastajajo ločeno od projekta (75 %) / Teren nima dostopa do sistema in načrtov (65 %) / Znanje o projektu je pri enem inženirju (45 %) / Vsak naročnik in razpis zahteva svojo obliko dokumentacije (30 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
kapaciteta  Iskanje veljavne projektne dokumentacije     = V2 × inženirska ura × 12
kapaciteta  Reference in razpisna dokumentacija          = V3 × admin ura × 12
kapaciteta  Ponovno zbiranje dokumentacije ob predaji    = V4 × inženirska ura × 12
kapaciteta  Teren brez dostopa do projektnih podatkov    = V5 × inženirska ura × 12
```
**Neposredna izguba: 0 EUR.**
PANTHEON naslavlja: dokumenti, vezani na projekt: načrti, meritve, protokoli in dobavnice na enem mestu · dostop do projektnih podatkov prek brskalnika tudi s terena · reference in dokazila iz zaključenih projektov brez ponovnega zbiranja.

### I6–I9 · Horizontale

Analitika in poročanje · Računovodstvo in finance · Kadri in plače · **Reklamacije in poprodajni servis** — **Priloga A**. V servisu se garancijske ure vrednotijo po **inženirski uri** (edina horizontala z operativno uro).

### Zadnja stran (Korak 8 od 10) · Kratka diagnostika in Tvegani stroški

**Kratka diagnostika** — *Štiri vprašanja o podatkih in odpornosti procesa. Ne prispevajo k finančnemu rezultatu.*

| # | Vprašanje |
|---|---|
| D1 | **Ali veste, koliko ur je posamezen inženir porabil za posamezen projekt in fazo?** ← najmočnejši kvalifikacijski filter raziskave (H02) |
| D2 | **Ali je vsak kos opreme od naročila do vgradnje vezan na projekt?** |
| D3 | **Ali je vsaka sprememba obsega pisno potrjena, preden jo izvedete?** |
| D4 | **Ali projekt teče normalno tudi brez vodilnega inženirja ali vodje projekta?** |

```
tveganje  Zanesljivost podatkov  ← (D1 + D2) / 6
tveganje  Procesna odpornost     ← (D3 + D4) / 6
```
Opombe k stopnjam: *podatki* — nizko »Ure in oprema so pripisane projektu sproti; marža projekta je znana med izvedbo, ne šele ob zaključku.« · srednje »Podatki so delni. Del ur in opreme se projektu pripiše za nazaj, zato je marža ob zaključku ocena, ne izmerjena.« · visoko »Ure in oprema niso vezane na projekt. Dokler tega ni, natančnega zneska izgubljene marže ni mogoče izračunati — in prav to je težava.« · *proces* — nizko »Spremembe obsega so potrjene pred izvedbo in projekt ne stoji, ko vodilnega inženirja ni.« · srednje »Del sprememb se izvede pred potrditvijo, znanje o projektu pa je pri nekaj ljudeh; ob odsotnosti se izvedba upočasni.« · visoko »Dodatna dela se izvajajo brez potrditve, projekt pa živi v glavi enega inženirja. Ena odsotnost ali en spor z naročnikom stane maržo celotnega projekta.«

**Tvegani stroški (modul E)** — samo uporabnikom PANTHEON, **Priloga B**.

## Korak 9 od 10 — Obrazec s kontaktom

> **Rezultat in PDF poročilo s tremi ukrepi za vaše projekte na ključ**
> Po oddaji se na zaslonu odpre vaš izračun, PDF poročilo za upravo ali lastnika pa prejmete na vpisani e-naslov — razčlenjeno po področjih, s formulo pod vsako postavko in tremi ukrepi, ki jih je pri marži projektov, aneksih in opremi mogoče začeti ta teden.

Polja — **Priloga C**.

## Korak 10 od 10 — Rezultat

> **Toliko vas stane projekt, katerega marže ne poznate do zaključka**

Kartica *Neposredni letni stroški*: »Denar, ki dejansko odteka: dodatna dela brez aneksa, ekspresne dobave in kazni zaradi opreme, neobračunani servisni posegi in strošek denarja, vezanega v zaključenih fazah brez računa.« Naslov PDF-ja: **Analiza marže projektov in skritih stroškov v inženiringu**. Sestava — **Priloga D**.

## Inženiring v številkah

| | Vprašanj |
|---|---|
| Uvodni zaslon + Koraki 1–4: dejavnost 1 · zaposleni 1 · kontekst 3 · triaža 9 · osnova **4** | 18 |
| Privzeta tri področja (I1 6 + I2 5 + I3 6) | +17 |
| Diagnostika | +4 |
| **Tipična pot skupaj** | **39** *(+3 kljukice E)* |
| Vseh 9 področij (I1–I5: 29, horizontale: 20) + diagnostika | 71 *(+3)* |
| Obrazec | +10 |

**Denarni kanali:**

| Kanal | Kje nastane |
|---|---|
| Neposredna izguba | dodatna dela brez aneksa · ekspresne dobave, stojnine in kazni · denar v fazah brez računa (prihodek × dni × strošek financiranja) · neobračunani servis · obresti in globe · napačne plače · nadomestni deli in kulanca |
| Nezaslužena marža | — (v tej dejavnosti ni postavke) |
| Kapaciteta | 5 postavk po inženirski uri (delo nad kalkulacijo, čakanje na terenu, iskanje dokumentacije, zbiranje ob predaji, teren brez podatkov) + 7 po admin uri + horizontale (garancijska popravila po inženirski uri) |
| Enkratni kapital | oprema brez projekta × sprostljiv delež (I3) **in** zapadli zadržki in garancije v celoti (I4) — edina dejavnost z dvema postavkama tega koša |
| Tveganje | 2 diagnostični oceni + do 3 roki iz modula E |

**Kar je namenoma brez zneska:** način primerjave kalkulacije (I1.1), dnevi do znane marže (I1.5), trenutek potrditve spremembe (I2.4), sprožilec računa (I4.5), lokacija dokumentacije (I5.1). **Kar ni izmerjeno:** načrtovana zaloga rezervnih delov za servis, poročila za naročnika in banko (del horizontale Analitika), zaračunana urna postavka (namenoma).

---

# 4 · GRADBENIŠTVO

Segment `gradbenistvo` (SKD F41–F43: gradnja stavb, inženirski objekti, specializirana gradbena dela). Pet panožnih področij + **vseh pet horizontal** + diagnostika + E (`segments.ts:337`). Edina od petih dejavnosti z vsemi horizontalami: *Reklamacije in poprodajni servis* meri odpravo pomanjkljivosti po primopredaji, ki je noben panožni modul ne meri; *Dokumentacija in e-poslovanje* meri potrjevanje računov za material, panožno področje Podizvajalci pa situacije podizvajalcev. Prag visoke izgube: 20.000 EUR.

**Posebnost te dejavnosti:** ura delavca na gradbišču vstopa v **natanko eno postavko** (čakanje ekipe na gradbišču); vse ostalo ročno delo s podatki opravlja vodja gradbišča, kalkulant ali obračun in se vrednoti po admin uri (privzeto **28** EUR, ne 26 kot drugod). Dva zneska sta namenoma *samo kontekst*, ker jih PANTHEON ne skrajša oziroma ne prepreči: dnevi do potrditve situacije pri nadzoru in penali, ki jih povzročijo podizvajalci (`gradbenistvo.ts:43`).

Izpeljave iz raziskave v `navodila/` za gradbeništvo **ni**; kampanjsko gradivo: `navodila/kampanje/linkedin-gradbenistvo-heyreach.md`.

## Uvodni zaslon

> **Koliko vas stane, da maržo projekta izveste šele ob zaključku?**
> Material, delo, podizvajalci in mehanizacija se seštejejo šele ob zaključnem obračunu, ko za ukrepanje ni več časa. Ročne situacije, neobračunana dodatna dela in zadržki nimajo svoje vrstice v izkazu.

Spustni seznam: … · Storitvena in projektna podjetja · **Gradbeništvo** · Inženiring · … Kampanjska povezava `<objava>/gradbenistvo/`. Do septembra 2026 je gradbinca sem pripeljalo »Drugo« → storitve (`industries.ts:52`).

## Korak 1 od 10 — Zaposleni

Enako kot pri kovinarstvu.

## Korak 2 od 10 — Kontekst

> **Nekaj o vašem podjetju in gradbiščih**
> Tri vprašanja brez številk: kaj gradite, kje danes vodite pogodbe, situacije in ure ter kdo ste v podjetju. Iz odgovorov izvemo, kako danes delate — to nam pove, o čem se je smiselno pogovoriti. V izračun zneskov ta odgovor ne vstopa.

**V2.1 — Kaj pretežno izvajate?**
Gradnja stavb (novogradnje in prenove) · Inženirski objekti (ceste, infrastruktura, komunala) · Specializirana gradbena dela (instalacije, fasade, strehe, zaključna dela) · Inženiring in gradnja na ključ · Kombinirano

**V2.2 — Kje danes vodite pogodbe, situacije in ure po projektih?** ← prodajni signal; dobesedno vprašanje Q7 z lista Kalkulator raziskave

| Odgovor | Vrzel sistema | PANTHEON? |
|---|---|---|
| PANTHEON s projektnim stroškovnim mestom in evidenco ur | 8–20 % | da |
| PANTHEON brez projektnega spremljanja | 15–30 % | da |
| Drug ERP ali gradbeni program za kalkulacije in situacije | 15–30 % | ne |
| Računovodski program in Excel za projekte | 25–40 % | ne |
| Večinoma Excel, gradbeni dnevnik na papirju in e-pošta | 25–40 % | ne |

**V2.3 — Kakšna je vaša vloga?**
Direktor/-ica · Vodja gradbišča ali projekta · Vodja priprave dela, kalkulacij ali obračuna · Finance ali računovodstvo · Drugo (lasten vpis)
→ *Utež ICP: direktor 1,00 · finance 0,80 · obe vlogi »vodja« 0,60 · drugo 0,35.*

## Korak 3 od 10 — Triaža (10 področij)

> **Kje pri vodenju projektov vas najbolj tišči?**
> Na hitro ocenite vsako področje — od marže projekta in situacij do ur in materiala na gradbišču, podizvajalcev in plačil. Podrobna vprašanja zastavimo samo za največje težave, zato vprašalnik ostane kratek, izračun pa vezan na vaše projekte in ne na povprečje panoge.

| # | Področje | Vprašanje | 0 | 1 | 2 | 3 |
|---|---|---|---|---|---|---|
| T1 | **Marža projekta in kontrola stroškov** | Kako pogosto izveste, da projekt odstopa od kalkulacije, šele ko za ukrepanje ni več časa? | Sproti med izvedbo | Občasno prepozno | Redno prepozno | Skoraj vedno šele ob zaključnem obračunu |
| T2 | **Situacije, obračun in dodatna dela** | Koliko ročnega dela in popravkov zahtevajo situacije in obračun dodatnih del? | Situacija nastane iz sistema | Nekaj ur na situacijo | Več dni vsak mesec | Obračun je vsak mesec velik projekt |
| T3 | **Ure, material in mehanizacija na gradbišču** | Kako dobro veste, koliko ur, materiala in strojnih ur je porabil posamezen projekt? | Sproti, po projektu | Približno, ob koncu meseca | Šele ob obračunu, z lovljenjem podatkov | Tega ne vemo |
| T4 | **Podizvajalci, pogodbe in zadržki** | Koliko dela in sporov vam povzročajo situacije, pogodbe in zadržki podizvajalcev? | Malo — vse je v sistemu | Nekaj ur na mesec | Vsak mesec več dni preverjanja | Spori in dvojni obračuni so stalnica |
| T5 | **Plačila, zadržana sredstva in terjatve** | Kako pogosto čakate na plačilo ali sprostitev zadržkov dlje, kot bi morali? | Plačila in zadržki prihajajo ob roku | Občasno | Redno, pri več naročnikih | Zamude so pravilo |
| T6–T10 | Analitika in poročanje · Računovodstvo in finance · Kadri in plače · Dokumentacija in e-poslovanje · Reklamacije in poprodajni servis | horizontale (razdelek 1, T7–T10; servis razdelek 3, T9) | | | | |

Privzeta tri (izrecno `defaultIds`, `segments.ts:361`): Marža, Situacije, Gradbišče — vsak izvajalec jih ima; podizvajalcev specialist praviloma nima.

## Korak 4 od 10 — Skupna finančna osnova

> **Skupna finančna osnova**
> Štiri številke, ki veljajo za vsa področja. Polni strošek ure pomeni bruto plačo s prispevki delodajalca ter regresom, malico in prevozom — ne neto izplačila in ne režije. Letno vrednost izvedenih del in strošek financiranja vprašamo enkrat — sta lastnost podjetja, ne posameznega področja.

**V4.1 — Približen polni strošek ure delavca na gradbišču**
*Zidar, tesar, monter, strojnik — kdor dela na gradbišču.*
Vnos EUR/h · povprečje panoge **21** · razponi: Do 17 EUR (16) · 17–20 EUR (18) · 20–25 EUR (22) · Več kot 25 EUR (29)
→ *Sidro je posredno (SURS zidarja in tesarja še nima), nabor prevzet od proizvodne ure — KALIBRACIJA (`contexts/gradbenistvo.ts:11`).*

**V4.2 — Približen polni strošek ure vodje gradbišča oziroma pisarne**
*Vodja gradbišča, priprava dela, kalkulant, obračun — kdor dela s podatki o projektu.*
Vnos EUR/h · povprečje panoge **28** · razponi: Do 20 / 20–25 / 25–31 / Več kot 31 EUR

**V4.3 — Letna vrednost izvedenih del**
*Prihodki od prodaje, neto, brez DDV. Če razpona ne izberete, denarja v prekoračenih plačilnih rokih ne bomo ocenili — prihodka si ne izmišljamo.*
Vnos EUR/leto · brez povprečja (privzeto 0) · razponi: Do 1 mio EUR (0,6 mio) · 1–3 mio EUR (1,8 mio) · 3–10 mio EUR (5,5 mio) · Več kot 10 mio EUR (15 mio)
→ *Množi ga področje Plačila. Če je izbrano in izpolnjeno, prihodek pa manjka, pade zanesljivost na »nizko«.*

**V4.4 — Letni strošek financiranja obratnega kapitala**
*Obrestna mera posojila oziroma donos, ki bi ga denar prinesel drugje. Množi denar, vezan v prekoračenih plačilnih rokih naročnikov.*
Vnos % · povprečje panoge **8,5 %** · razponi: Do 5 % (4 %) · 5–8 % (6,5 %) · 8–12 % (10 %) · Več kot 12 % (15 %)

Brez marže (izgubljena marža je vprašana kot znesek, ker raziskava svetuje »sprašuj po pogostosti, ne po odstotku«) in brez zaračunane postavke (gradbinec ne prodaja ur — v evre gre situacija po popisu).

## Koraki 5–7 od 10 — Vaše številke

### G1 · Marža projekta in kontrola stroškov

*Kdaj izveste, da projekt odstopa od kalkulacije, ročno seštevanje plana in realizacije ter marža, izgubljena zaradi prepozne informacije.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Kdaj po koncu meseca veste, koliko je zaslužil posamezen projekt?** — Sproti med izvedbo / V desetih dneh / Do konca naslednjega meseca / Šele ob zaključnem obračunu projekta ← »najmočnejše vprašanje v panogi« (raziskava, Kalkulator Q3) | izbira · *samo kontekst* | ni izbrano |
| 2 | **Koliko projektov imate hkrati v teku?**<br>*Podatek ne vstopa v izračun — pove obseg, na katerem nastajajo spodnje postavke.*<br>**?** Gradbišča in pogodbe, na katerih se ta mesec dela ali obračunava; zaključeni projekti v garancijski dobi ne štejejo. Groba ocena zadostuje. | projektov · *samo kontekst* | 0 |
| 3 | **Koliko ur mesečno porabite za ročno primerjavo plana in realizacije po projektih — zbiranje stroškov iz računov, ur in dobavnic v Excel?**<br>*Samo spremljanje stroškov projekta. Priprava situacij sodi v področje Situacije, obračun in dodatna dela, poročila za vodstvo v Analitika in poročanje, knjiženje v Računovodstvo in finance.*<br>**?** Ure, ko nekdo iz računov, dobavnic in evidenc ur sestavlja, koliko je projekt do zdaj stal, in to primerja s kalkulacijo. Ocena: 2 osebi × 6 h na teden ≈ 50 ur na mesec. | h/mesec | 0 |
| 4 | **Kolikšno maržo ste v zadnjih 12 mesecih izgubili na projektih, pri katerih ste odstopanje od kalkulacije opazili prepozno, da bi ukrepali?**<br>*Brez neobračunanih dodatnih del, izginulega materiala in preplačil podizvajalcem — te vpišete v svojih področjih. Tu štejejo prekoračitve lastnih ur, strojnih ur in cen materiala, ki bi jih ob pravočasni informaciji še lahko ustavili.*<br>**?** Ne vrednost projekta, ampak razlika med načrtovano in dejansko maržo pri projektih, kjer ste odstopanje videli šele ob obračunu. Primer: kalkulirana marža 60.000 EUR, dosežena 35.000 EUR → 25.000 EUR; seštejte zadnjih 12 mesecev. | EUR/leto · »Ne vem« | 0 |
| 5 | **Pri kolikšnem deležu projektov marža na koncu odstopa od načrtovane?** — Skoraj pri nobenem / Pri manj kot tretjini / Pri tretjini do polovici / Pri večini | izbira · *samo kontekst* | ni izbrano |
| 6 | **Kaj je glavni vzrok?** — Stroški se projektu pripišejo z zamikom ali sploh ne (75 %) / Ure in material nimajo projektne oznake (75 %) / Plan in realizacija sta v ločenih orodjih (75 %) / Kalkulacija ponudbe ni podlaga za spremljanje izvedbe (65 %) / Naročnik spreminja obseg med izvedbo (30 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
kapaciteta         Ročna primerjava plana in realizacije          = V3 × admin ura × 12
nezaslužena marža  Marža, izgubljena zaradi prepozne informacije  = V4
```
**Neposredna izguba: 0 EUR** — izgubljena marža gre v koš *nezaslužena marža* (stoji na predpostavki, da bi jo ob pravočasni informaciji rešili, `gradbenistvo.ts:171`). Meja proti Situacijam, Gradbišču in Podizvajalcem živi samo v besedilu polja V4.
PANTHEON naslavlja: projektno stroškovno mesto s sprotnim knjiženjem stroškov · plan proti realizaciji po projektu, brez ročnega seštevanja · kalkulacija ponudbe kot izhodišče za spremljanje izvedbe.

### G2 · Situacije, obračun in dodatna dela

*Ročna priprava situacij iz izmer in popisa, popravki po vrnitvi z nadzora in dodatna dela, ki niso bila nikoli obračunana.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Koliko ur mesečno porabite za pripravo situacij — količine iz izmer in popisa, cene, priloge?**<br>*Samo priprava lastnih situacij naročniku. Preverjanje situacij podizvajalcev sodi v področje Podizvajalci, pogodbe in zadržki.*<br>**?** Delo od izmer na gradbišču do oddane situacije: prepis količin v popis, cene, sestavljanje prilog in dokazil. Ocena: 8 situacij × 3 h ≈ 24 ur na mesec. | h/mesec | 0 |
| 2 | **Koliko ur mesečno gre za popravke in ponovno pripravo situacij, ki jih je nadzor zavrnil ali potrdil samo delno?**<br>*Ne vključujte prve priprave iz prejšnjega vprašanja — samo delo po vrnitvi z nadzora.*<br>**?** Iskanje manjkajočih prilog, ponovne izmere, popravljene količine in ponovna oddaja. Ocena: 2 vrnjeni situaciji × 5 h ≈ 10 ur na mesec. | h/mesec | 0 |
| 3 | **Kolikšno vrednost izvedenih dodatnih del in sprememb obsega v letu dni ne obračunate, ker niso bila pisno potrjena?**<br>*Delo je opravljeno in strošek zanj že nastal — manjka samo račun. Ne vpisujte marže, ki ste jo izgubili zaradi prepozne informacije; to meri področje Marža projekta in kontrola stroškov.*<br>**?** Dodatna dela po ustnem dogovoru, nepredvidena dela in spremembe načrta, ki jih naročnik ob situaciji ni priznal, ker ni bilo aneksa. Ocena: 5 primerov × 4.000 EUR ≈ 20.000 EUR na leto. | EUR/leto · »Ne vem« | 0 |
| 4 | **Koliko dni v povprečju mine od oddaje situacije do njene potrditve pri nadzoru in naročniku?**<br>*Podatek ne vstopa v izračun — služi za oceno obsega težave. Zamude plačil po zapadlosti meri področje Plačila, zadržana sredstva in terjatve.*<br>**?** Dnevi od datuma oddaje situacije do podpisa nadzornika oziroma potrditve naročnika, ne do plačila. Primer: oddana 5., potrjena 23. → 18 dni; povprečje zadnjih šestih situacij. | dni · *samo kontekst* | 0 |
| 5 | **Kdaj se sprememba obsega praviloma pisno potrdi?** — Pred izvedbo / Med izvedbo / Ob situaciji / Šele ob zaključnem obračunu ali sploh ne | izbira · *samo kontekst* | ni izbrano |
| 6 | **Kaj je glavni vzrok?** — Količine se iz izmer in popisa prepisujejo ročno (75 %) / Popis del ni v sistemu, ampak v Excelu (75 %) / Dodatna dela se izvedejo pred pisno potrditvijo (65 %) / Nadzor situacije vrača ali potrjuje z zamudo (30 %) / Vodje gradbišč izmere oddajo z zamudo (45 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
kapaciteta  Priprava situacij                                  = V1 × admin ura × 12
kapaciteta  Popravki vrnjenih situacij                         = V2 × admin ura × 12
izguba      Neobračunana dodatna dela in spremembe obsega      = V3
```
Dnevi do potrditve (V4) so namenoma brez zneska: določata jih nadzor in naročnik, PANTHEON jih ne skrajša (`gradbenistvo.ts:254`).
PANTHEON naslavlja: popis del in količine v sistemu, situacija brez ponovnega vnosa · sprememba obsega kot aneks z lastnim statusom, ne kot tiha dodelava · pregled izvedenih, a še neobračunanih del pred zaključkom meseca.

### G3 · Ure, material in mehanizacija na gradbišču

*Čakanje ekipe na material in navodila, naknadni pripis ur projektu, material, ki ni ne vgrajen ne vrnjen, in vodje gradbišč brez podatkov na terenu.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Koliko skupnih ur mesečno delavci na gradbišču čakajo na material, stroj ali navodilo?**<br>*Samo ure delavcev na gradbišču, ki stojijo. Ure vodij gradbišč za klice v pisarno so v spodnjem vprašanju.*<br>**?** Ekipa stoji, ker material ni prišel, stroj ni prost ali načrt ni jasen. Ocena: 12 delavcev × 2 h na teden ≈ 100 ur na mesec. | h/mesec | 0 |
| 2 | **Koliko ur mesečno porabite za naknadno zbiranje in razporejanje ur delavcev po projektih in postavkah?**<br>*Samo pripis ur projektu kot podlaga za stroške projekta. Evidenco prisotnosti in podlago za plačo meri področje Kadri in plače.*<br>**?** Prepis gradbenih listov in dnevnikov v evidenco po projektih, iskanje ur brez projekta, usklajevanje z vodji gradbišč. Ocena: 1 oseba × 8 h na teden ≈ 34 ur na mesec. | h/mesec | 0 |
| 3 | **Kolikšna je bila v zadnjih 12 mesecih vrednost materiala, ki je bil naročen ali izdan na gradbišče, a ni bil ne vgrajen ne vrnjen?**<br>*Razlika med naročenim in obračunanim ter inventurne razlike po gradbiščih. Material, ki ste ga porabili več zaradi napačne kalkulacije, sodi v Marža projekta in kontrola stroškov.*<br>**?** Primerjajte dobavnice na gradbišče z vgrajenimi količinami iz situacij in ostankom, vrnjenim v skladišče; razlika je ta postavka. Ocena: 6 gradbišč × 2.000 EUR ≈ 12.000 EUR na leto. | EUR/leto · »Ne vem« | 0 |
| 4 | **Koliko ur mesečno vodje gradbišč porabijo za klice v pisarno in čakanje na podatek — aktualni načrt, popis, stanje naročila — ki ga na terenu nimajo?**<br>*Samo čas na terenu brez podatka. Iskanje dokumentov v arhivu in potrjevanje meri področje Dokumentacija in e-poslovanje.*<br>**?** Vsak klic "katera verzija načrta velja" ali "je material že naročen" in čakanje na odgovor. Ocena: 4 vodje × 3 h na teden ≈ 50 ur na mesec. | h/mesec | 0 |
| 5 | **Kako se strojne ure lastne mehanizacije pripišejo projektu?** — Sproti, po stroju in projektu / Ocenjeno ob koncu meseca / Ostanejo v splošnih stroških / Lastne mehanizacije nimamo | izbira · *samo kontekst* | ni izbrano |
| 6 | **Kaj je glavni vzrok?** — Ure in material se zapisujejo na papir ali v Excel (75 %) / Vsako gradbišče vodi svojo evidenco (75 %) / Material se izdaja brez prevzemnice in projekta (65 %) / Dobavitelji dobavljajo na gradbišče brez naročilnice (30 %) / Disciplina zapisovanja na terenu (45 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
kapaciteta  Čakanje ekipe na gradbišču             = V1 × ura delavca × 12   ← edina postavka po delavčevi uri v segmentu
kapaciteta  Naknadni pripis ur projektom           = V2 × admin ura × 12
izguba      Material brez vgradnje in vračila      = V3
kapaciteta  Klici in čakanje na podatke s terena   = V4 × admin ura × 12
```
Mehanizacija v splošnih stroških (V5) ni strošek, ampak popačenje marže — zato kontekst in ne znesek.
PANTHEON naslavlja: evidenca ur z obvezno projektno oznako, potrjena po gradbišču · naročila materiala vezana na projekt in terminski plan, dobava vidna vodji gradbišča · vsako gradbišče kot skladišče: izdaja, poraba in vračilo materiala po projektu · spletni dostop do načrtov, popisov in naročil za vodje gradbišč.

### G4 · Podizvajalci, pogodbe in zadržki

*Preverjanje situacij podizvajalcev proti pogodbi, dvojno ali preveč plačane postavke in penali, ki jih povzročijo podizvajalci.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Koliko podizvajalcev vodite hkrati?**<br>*Podatek ne vstopa v izračun — pove, koliko pogodb in situacij je treba vsak mesec preveriti.*<br>**?** Podizvajalci z veljavno pogodbo na vsaj enem odprtem gradbišču ta mesec; dobavitelji materiala ne štejejo. Groba ocena zadostuje. | podizvajalcev · *samo kontekst* | 0 |
| 2 | **Koliko ur mesečno porabite za preverjanje situacij podizvajalcev — primerjavo s pogodbo in izmerami — in njihovo potrjevanje?**<br>*Samo situacije podizvajalcev. Potrjevanje računov za material in storitve meri področje Dokumentacija in e-poslovanje, priprava lastnih situacij pa Situacije, obračun in dodatna dela.*<br>**?** Iskanje pogodbe, primerjava obračunanih količin z izmerami, preverjanje, ali je bilo isto delo že obračunano, odbitek zadržka. Ocena: 8 podizvajalcev × 2 h ≈ 16 ur na mesec. | h/mesec | 0 |
| 3 | **Kolikšna je bila v zadnjih 12 mesecih vrednost dvojno ali preveč plačanih situacij podizvajalcev in spornih postavk, ki jih niste mogli uveljaviti?**<br>*Samo, kar ste dejansko plačali preveč. Dodatna dela, ki jih vi niste obračunali naročniku, sodijo v področje Situacije, obračun in dodatna dela.*<br>**?** Isto delo obračunano na dveh situacijah, količine nad izmerami, zadržek, ki ni bil odbit, in sporne postavke, ki ste jih na koncu priznali. Ocena: 3 primeri × 3.000 EUR ≈ 9.000 EUR na leto. | EUR/leto · »Ne vem« | 0 |
| 4 | **Kolikšni so bili v zadnjih 12 mesecih pogodbeni penali in stroški zamud, ki so jih povzročili podizvajalci?**<br>*Podatek ne vstopa v izračun — služi za oceno obsega težave.*<br>**?** Penali naročnika in dodatni stroški (nadure, prestavljanje drugih ekip), ki so nastali, ker podizvajalec ni prišel ali ni dokončal pravočasno. Seštejte zadnjih 12 mesecev. | EUR/leto · *samo kontekst* | 0 |
| 5 | **Kaj je glavni vzrok?** — Pogodbe, situacije in zadržki podizvajalcev niso na enem mestu (75 %) / Situacija podizvajalca se ne primerja s pogodbo in izmerami (75 %) / Zadržki in roki se ne spremljajo po datumih (65 %) / Podizvajalci obračunajo več, kot je izvedeno (30 %) / Vodje gradbišč izvedbo potrdijo brez preverjanja (45 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
kapaciteta  Preverjanje in potrjevanje situacij podizvajalcev          = V2 × admin ura × 12
izguba      Preplačane in dvojno obračunane situacije podizvajalcev    = V3
```
Penali podizvajalcev (V4) so namenoma brez zneska: PANTHEON zamude ne prepreči (`gradbenistvo.ts:533`) — prodajnik obseg vidi, poročilo pa zanj ne obljublja prihranka.
PANTHEON naslavlja: pogodbe, situacije in zadržki podizvajalcev, vezani na projekt · primerjava situacije podizvajalca s pogodbo in izmerami pred potrditvijo · opomnik po datumu za sprostitev zadržkov in potek garancij.

### G5 · Plačila, zadržana sredstva in terjatve

*Denar, vezan v prekoračenih plačilnih rokih in zadržkih, odpisane terjatve ter ure opominjanja in usklajevanja.* — **edino področje, ki množi prihodek** (`usesRevenue`).

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Za koliko dni v povprečju naročniki prekoračijo dogovorjeni plačilni rok?**<br>*Samo dnevi PO zapadlosti, ne celoten plačilni rok. Čas potrjevanja situacije pri nadzoru je vprašan v področju Situacije, obračun in dodatna dela in v izračun ne vstopa.*<br>**?** Povprečna razlika med datumom zapadlosti in datumom plačila pri situacijah zadnjih 12 mesecev. Primer: rok 60 dni, plačano po 95 dneh → 35 dni. | dni | 0 |
| 2 | **Kolikšna je skupna vrednost zadržanih sredstev pri naročnikih — zadržki na situacijah in garancijski zadržki?**<br>*Stanje danes, ne letni znesek. Zadržkov, ki jih vi držite podizvajalcem, ne vpisujte.*<br>**?** Seštevek vseh zneskov, ki jih naročniki zadržujejo do primopredaje ali do poteka garancije — običajno 5 do 10 % vsake situacije. Iz saldakontov ali iz zadnjih situacij. | EUR | 0 |
| 3 | **Kolikšen delež tega bi po vaši oceni lahko sprostili s sprotnim spremljanjem rokov in pravočasnim unovčenjem?**<br>*Brez pogajanj z naročnikom — samo zadržki, ki so že zapadli ali jih lahko nadomesti bančna garancija.*<br>**?** Ne koliko denarja je zadržanega, ampak koliko bi ga trajno lahko bilo manj, če bi vsak zadržek ob poteku roka takoj terjali ali ga nadomestili z garancijo. Groba ocena zadostuje. — Do 5 % / 6–10 % / 11–20 % / Več kot 20 % / **Ne vem** (5 / 8 / 15 / 25 / 10 %) | izbira | Ne vem → 10 % |
| 4 | **Kolikšna je bila v zadnjih 12 mesecih vrednost odpisanih terjatev — stečaji naročnikov, neizterljive situacije?**<br>*Samo dokončno odpisano. Zadržki, ki jih še lahko unovčite, so v zgornjem vprašanju.*<br>**?** Terjatve, ki ste jih v zadnjem letu odpisali ali prijavili v stečajno maso brez pričakovanega poplačila. Iz zaključnega računa ali saldakontov. | EUR/leto · »Ne vem« | 0 |
| 5 | **Koliko ur mesečno porabite za opominjanje, usklajevanje odprtih postavk z naročniki in preverjanje zapadlih zadržkov in garancij?**<br>*Ne vključujte popravkov vrnjenih situacij — te meri področje Situacije, obračun in dodatna dela.*<br>**?** Klici in e-pošta zaradi neplačanih situacij, usklajevanje odprtih postavk, iskanje datumov zapadlosti zadržkov in garancij. Ocena: 1 oseba × 4 h na teden ≈ 17 ur na mesec. | h/mesec | 0 |
| 6 | **Kaj je glavni vzrok?** — Zapadlosti situacij, zadržkov in garancij se ne spremljajo po datumih (75 %) / Situacija je zavrnjena zaradi manjkajočih prilog ali napak (75 %) / Obračun se pripravi pozno po izvedbi (65 %) / Naročniki plačujejo z zamudo (30 %) / Razpoložljivost ljudi za izterjavo (45 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
izguba            Denar, vezan v prekoračenih plačilnih rokih   = letna vrednost del / 365 × V1 × strošek financiranja
izguba            Odpisane terjatve                             = V4
kapaciteta        Opominjanje in usklajevanje plačil            = V5 × admin ura × 12
enkratni kapital  Sprostljiva zadržana sredstva                 = V2 × delež iz V3
```
Šteje se samo prekoračitev NAD dogovorjenim rokom; brez prihodka je prva postavka 0 (`gradbenistvo.ts:673`).
PANTHEON naslavlja: saldakonti s koledarjem zapadlosti situacij, zadržkov in garancij · samodejni opomniki in pregled odprtih postavk po naročniku · stanje odprtih postavk naročnika, vidno pred sprejemom novega posla.

### G6–G10 · Horizontale

Analitika in poročanje · Računovodstvo in finance · Kadri in plače · Dokumentacija in e-poslovanje · Reklamacije in poprodajni servis — **Priloga A**. Garancijska popravila v servisu so po **uri delavca**.

### Zadnja stran (Korak 8 od 10) · Kratka diagnostika in Tvegani stroški

**Kratka diagnostika** — *Štiri vprašanja o podatkih in odpornosti procesa. Ne prispevajo k finančnemu rezultatu.*

| # | Vprašanje |
|---|---|
| D1 | **Ali so vse ure delavcev in strojne ure pripisane projektu, na katerem so nastale?** |
| D2 | **Ali poznate dejansko maržo posameznega projekta že med izvedbo, ne šele ob zaključku?** |
| D3 | **Ali so spremembe obsega in dodatna dela pisno potrjeni, preden se izvedejo?** |
| D4 | **Ali gradbišče in obračun tečeta normalno tudi brez vodje gradbišča ali ene ključne osebe?** |

```
tveganje  Zanesljivost podatkov  ← (D1 + D2) / 6
tveganje  Procesna odpornost     ← (D3 + D4) / 6
```
Opombe k stopnjam: *podatki* — nizko »Ure in strojne ure so pripisane projektu, marža projekta je znana med izvedbo. Odstopanje opazite, ko ga je še mogoče popraviti.« · srednje »Podatki so delni. Odstopanje od kalkulacije praviloma opazite šele ob situaciji ali zaključnem obračunu, ko projekta ni več mogoče popraviti.« · visoko »Dokler stroški niso pripisani projektu, marže ni mogoče izračunati — in prav to je težava. Natančnega zneska izgubljene marže zato ni, dejanski pa je praviloma višji od vpisanega.« · *proces* — nizko »Spremembe obsega so potrjene pred izvedbo in gradbišče ni odvisno od posameznika.« · srednje »Spremembe so potrjene le delno. Ob sporu o dodatnih delih je težko dokazati, kaj je bilo naročeno.« · visoko »Dodatna dela se izvajajo brez pisne potrditve, znanje o gradbišču pa je v glavi ene osebe. En spor ali odhod vodje gradbišča lahko ustavi obračun več projektov.«

**Tvegani stroški (modul E)** — samo uporabnikom PANTHEON, **Priloga B**.

## Korak 9 od 10 — Obrazec s kontaktom

> **Rezultat in PDF poročilo s tremi ukrepi za vaša gradbišča**
> Po oddaji se na zaslonu odpre vaš izračun, PDF poročilo za upravo ali lastnika pa prejmete na vpisani e-naslov — razčlenjeno po področjih, s formulo pod vsako postavko in tremi ukrepi, ki jih je pri marži projekta, situacijah in gradbišču mogoče začeti ta teden.

Polja — **Priloga C**.

## Korak 10 od 10 — Rezultat

> **Toliko vas stane, da projekt seštejete šele ob zaključku**

Kartica *Neposredni letni stroški*: »Denar, ki dejansko odteka: neobračunana dodatna dela, material brez vgradnje in vračila, preplačane situacije podizvajalcev, denar v prekoračenih plačilnih rokih in odpisane terjatve.« Naslov PDF-ja: **Analiza skritih stroškov vodenja gradbenih projektov**. Sestava — **Priloga D**.

## Gradbeništvo v številkah

| | Vprašanj |
|---|---|
| Uvodni zaslon + Koraki 1–4: dejavnost 1 · zaposleni 1 · kontekst 3 · triaža **10** · osnova **4** | 19 |
| Privzeta tri področja (G1 6 + G2 6 + G3 6) | +18 |
| Diagnostika | +4 |
| **Tipična pot skupaj** | **41** *(+3 kljukice E)* |
| Vseh 10 področij (G1–G5: 29, horizontale: **25**) + diagnostika | 77 *(+3)* — najdaljši od petih vprašalnikov |
| Obrazec | +10 |

**Denarni kanali:**

| Kanal | Kje nastane |
|---|---|
| Neposredna izguba | neobračunana dodatna dela · material brez vgradnje in vračila · preplačane situacije podizvajalcev · denar v prekoračenih rokih (prihodek × dni × strošek financiranja) · odpisane terjatve · obresti in globe · napačne plače · prepozno potrjeni dokumenti · nadomestni deli in kulanca |
| Nezaslužena marža | marža, izgubljena zaradi prepozne informacije (G1) |
| Kapaciteta | 1 postavka po uri delavca (čakanje ekipe) + 7 po admin uri + horizontale (garancijska popravila po uri delavca) |
| Enkratni kapital | zadržana sredstva × sprostljiv delež (G5) |
| Tveganje | 2 diagnostični oceni + do 3 roki iz modula E |

**Kar je namenoma brez zneska:** trenutek, ko je marža znana (G1.1), število projektov in podizvajalcev, delež projektov z odstopanjem (G1.5), dnevi do potrditve situacije (G2.4), trenutek potrditve spremembe (G2.5), pripis mehanizacije (G3.5), **penali podizvajalcev** (G4.4). **Kar ni izmerjeno:** dvojno štetje med G1.4 in G2/G3/G4 preprečuje samo besedilo polja — test tega ne more ujeti (`gradbenistvo.ts:38`).

---

# 5 · ŽIVILSTVO

Segment `zivilstvo` (SKD C10 živila, C11 pijače: meso, mleko, pekarstvo, pijače, predelava). Pet panožnih področij + štiri horizontale + diagnostika + E (`segments.ts:88`). Brez horizontale *Reklamacije in poprodajni servis* (živilo garancijskega servisa nima; reklamacije in odpoklic meri panožno področje Sledljivost). Prag visoke izgube: 15.000 EUR.

Izpeljava iz raziskave: `navodila/zivilstvo/vprasalnik-zivilstvo-izpeljava-iz-raziskave.md`.

## Uvodni zaslon

> **Koliko vas letno stanejo kalo, potekli roki in ročna sledljivost?**
> Razlika med recepturo in dejanskim donosom, odpisi zaradi roka, HACCP mape in odpoklic, ki ga sestavljate iz papirjev — nič od tega nima svoje vrstice v izkazu. Plačate skozi maržo.

Spustni seznam: Proizvodnja · **Živilstvo (hrana in pijača)** · Kovinarstvo · … (oznaka v oklepaju za obiskovalca, ki besede »živilstvo« ne poveže s pijačami). Kampanjska povezava `<objava>/zivilstvo/`.

## Korak 1 od 10 — Zaposleni

Enako kot pri kovinarstvu.

## Korak 2 od 10 — Kontekst

> **Nekaj o vaši živilski proizvodnji**
> Tri vprašanja brez številk: kaj proizvajate, kako danes vodite proizvodnjo in sledljivost ter kdo ste v podjetju. Mlekarna in mesnica imata iste zakone, a drugačne bolečine — iz odgovorov izvemo, o čem se je smiselno pogovoriti. V izračun zneskov ta odgovor ne vstopa.

**V2.1 — Kaj pretežno proizvajate?**
Mesni izdelki · Mlečni izdelki · Pekarski in slaščičarski izdelki · Pijače · Predelava sadja, zelenjave in drugih surovin · Več skupin izdelkov
→ *Skupina izdelkov namesto načina proizvodnje — vertikale imajo posebna pravila (raziskava, segment S5).*

**V2.2 — Kako danes vodite proizvodnjo in sledljivost šarž?** ← prodajni signal

| Odgovor | Vrzel sistema | PANTHEON? |
|---|---|---|
| PANTHEON s proizvodnim modulom in šaržami | 8–20 % | da |
| PANTHEON brez proizvodnega modula | 15–30 % | da |
| Drug ERP ali namenski program za živilsko proizvodnjo | 15–30 % | ne |
| Kombinacija ERP-ja, Excela in papirnih evidenc | 25–40 % | ne |
| Večinoma Excel, papir in HACCP mape | 25–40 % | ne |

**V2.3 — Kakšna je vaša vloga?**
Direktor/-ica · Vodja proizvodnje · Vodja kakovosti ali tehnolog · Finance ali računovodstvo · Nabava ali skladišče · Drugo (lasten vpis)
→ *Vodja kakovosti je lastna vloga zaradi hipoteze H02 (boljši prvi stik kot direktor). Utež ICP: direktor 1,00 · finance 0,80 · vodja proizvodnje in vodja kakovosti 0,60 · nabava in drugo 0,35.*

## Korak 3 od 10 — Triaža (9 področij)

> **Kje v živilski proizvodnji vas najbolj tišči?**
> Na hitro ocenite vsako področje — od donosa šarže in rokov uporabnosti do sledljivosti, HACCP evidenc in naročil trgovcev. Podrobna vprašanja zastavimo samo za največje težave, zato vprašalnik ostane kratek, izračun pa vezan na vaše šarže in ne na povprečje panoge.

| # | Področje | Vprašanje | 0 | 1 | 2 | 3 |
|---|---|---|---|---|---|---|
| T1 | **Donos, kalo in recepture** | Kako pogosto je dejanski izhod šarže občutno manjši od tistega po recepturi? | Donos držimo po recepturi | Občasno, pri posameznih izdelkih | Redno, razlike ne poznamo natančno | Donosa sploh ne merimo |
| T2 | **Roki uporabnosti, zaloge in odpisi** | Kako pogosto odpisujete surovine ali izdelke zaradi poteka roka uporabnosti? | Skoraj nikoli | Nekajkrat na leto | Vsak mesec | Vsak teden |
| T3 | **Sledljivost šarž, reklamacije in odpoklic** | Kako hitro bi ob reklamaciji ali odpoklicu ugotovili, katere surovine so šle v šaržo in kateri kupci so jo prejeli? | V nekaj minutah, iz sistema | V nekaj urah, iz evidenc | V nekaj dneh, s papirji in klici | Ne bi mogli z gotovostjo |
| T4 | **HACCP evidence, deklaracije in presoje** | Koliko ročnega dela zahtevajo HACCP evidence, priprava na presoje in deklaracije? | Malo — evidence so elektronske | Nekaj ur na teden | Vsak dan po nekaj ur | Pred presojo se ustavi pol podjetja |
| T5 | **Naročila kupcev, planiranje in nujne dobave** | Kako pogosto naročila kupcev in plan proizvodnje usklajujete ročno ali rešujete nujno? | Naročila in plan tečejo iz sistema | Nekajkrat na mesec | Vsak teden | Vsak dan |
| T6–T9 | Analitika in poročanje · Računovodstvo in finance · Kadri in plače · Dokumentacija in e-poslovanje | horizontale (razdelek 1, T7–T10) | | | | |

Privzeta tri: Donos, Roki, Sledljivost. Triažno vprašanje T3 je prepis vprašanja Q02 raziskave — po hipotezi H01 najmočnejši prodajni sprožilec v panogi.

## Korak 4 od 10 — Skupna finančna osnova

> **Skupna finančna osnova**
> Tri številke, ki veljajo za vsa področja. Polni strošek ure pomeni bruto plačo s prispevki delodajalca ter regresom, malico in prevozom — ne neto izplačila in ne režije. Prihodek vprašamo enkrat — je lastnost podjetja, ne posameznega področja.

**V4.1 — Približen polni strošek neposredne proizvodne ure**
*Operater na liniji, mesar, pek, pakirec — kdor dela na šarži.*
Vnos EUR/h · povprečje panoge **18** · razponi: Do 17 EUR (16) · 17–19 EUR (18) · 19–23 EUR (21) · Več kot 23 EUR (26)
→ *Sidro je posredno (SURS oddelkov C10/C11 ne izkazuje ločeno; proizvodni pasovi zamaknjeni za en pas navzdol) — KALIBRACIJA.*

**V4.2 — Približen polni strošek administrativne oziroma vodstvene ure**
*Tehnolog, vodja kakovosti, planer, nabava, prodaja.*
Vnos EUR/h · povprečje panoge **26** · razponi: Do 20 / 20–25 / 25–31 / Več kot 31 EUR

**V4.3 — Letni prihodki od prodaje**
*Neto, brez DDV. Če razpona ne izberete, postavk, vezanih na prihodek, ne bomo ocenili — prihodka si ne izmišljamo.*
Vnos EUR/leto · brez povprečja · razponi: Do 2 mio (1,2 mio) · 2–5 mio (3,2 mio) · 5–15 mio (8,5 mio) · Več kot 15 mio EUR (25 mio)
→ *Noben živilski modul prihodka ne množi — bere ga samo prodajna priprava.*

Brez marže, brez zaračunane postavke, brez stroška financiranja.

## Koraki 5–7 od 10 — Vaše številke

### Ž1 · Donos, kalo in recepture

*Razlika med teoretičnim in dejanskim donosom šarže, ročno beleženje porabe in ponovna predelava neustreznih šarž.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Kolikšna je letna vrednost porabljenih surovin in embalaže?**<br>*Nabavna vrednost surovin, dodatkov in embalaže v zadnjih 12 mesecih — brez energije in dela.*<br>**?** Vzemite postavko stroški materiala iz izkaza ali vsoto računov dobaviteljev surovin in embalaže. Primer: 2,5 mio EUR prihodkov pri 55 % deležu surovin ≈ 1,4 mio EUR. | EUR/leto · »Ne vem« | 0 |
| 2 | **Kolikšen delež surovine izgubite kot razliko med teoretičnim donosom po recepturi in dejanskim izhodom šarže?**<br>*Samo izguba nad tehnološko nujnim kalom, ki ga receptura že upošteva. Odpise zaradi poteka roka merimo posebej v področju Roki uporabnosti.*<br>**?** Primerjajte, koliko izdelka bi po recepturi moralo nastati iz porabljene surovine, in koliko ga je res nastalo. Primer: iz 1.000 kg surovine po recepturi 900 kg izdelka, dejansko 855 kg → 5 %. | drsnik 0–20 %, korak 0,5 | **0 %** |
| 3 | **Koliko skupnih ur mesečno gre za ročno beleženje porabe surovin in izhoda šarž ter prepis teh zapisov v Excel ali sistem?**<br>*Zapis na proizvodnem listu in prepis. HACCP in temperaturne evidence merimo posebej v področju Kakovost.*<br>**?** Tehtanje in vpis na proizvodni list, nato prepis v preglednico ali program — isti podatek, vpisan dvakrat. Ocena: 3 linije × 30 min na dan × 21 dni ≈ 32 ur na mesec. | h/mesec | 0 |
| 4 | **Koliko skupnih ur mesečno porabite za ponovno predelavo, prebiranje ali prepakiranje neustreznih šarž?** | h/mesec | 0 |
| 5 | **Kje so danes recepture in kdo jih spreminja?** — V sistemu, z verzijami in datumom / V Excelu pri tehnologu / V mapah na papirju / V glavi tehnologa ali mojstra | izbira · *samo kontekst* | ni izbrano |
| 6 | **Kaj je glavni vzrok?** — Recepture in normativi niso ažurni ali obstajajo v več verzijah (75 %) / Poraba surovin in izhod šarže se ne beležita sproti (75 %) / Kalkulacija ne upošteva dejanskega donosa, zato odstopanja nihče ne išče (65 %) / Napake pri tehtanju in izvedbi oziroma menjave ljudi (45 %) / Nihanje kakovosti surovine ali oprema (15 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
izguba      Odstopanje donosa in kalo nad recepturo   = V1 × V2                        ← meja 0,6
kapaciteta  Ročno beleženje in prepis porabe šarž     = V3 × proizvodna ura × 12
kapaciteta  Ponovna predelava in prepakiranje šarž    = V4 × proizvodna ura × 12
```
Meja 0,6: surovina niha po sezoni, vlagi in maščobi tudi ob popolnih podatkih (raziskava A16/A17, `zivilstvo.ts:147`). Beleženje na liniji je po proizvodni uri, ker ga opravi operater med delom.
PANTHEON naslavlja: recepture kot normativi z verzijami in dejanskim donosom po šarži · javljanje porabe in izhoda šarže na proizvodnem terminalu · kalkulacija lastne cene izdelka na dejanski, ne teoretični donos.

### Ž2 · Roki uporabnosti, zaloge in odpisi

*Odpisi zaradi poteka roka, inventurne razlike v hladilnicah in kapital, vezan v surovinah in gotovih izdelkih.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Kolikšna je povprečna skupna vrednost zalog surovin, embalaže in gotovih izdelkov?**<br>*Povprečno stanje med letom po nabavni oziroma lastni ceni — vključno s hladilnicami in zamrzovalnicami.*<br>**?** Povprečje nekaj mesečnih stanj ali postavka zaloge iz bilance — ne stanje na današnji dan in ne letna poraba. Primer: 180.000 EUR surovin + 40.000 EUR embalaže + 220.000 EUR izdelkov ≈ 440.000 EUR. | EUR | 0 |
| 2 | **Kolikšna je bila v zadnjih 12 mesecih vrednost odpisov in razprodaj pod ceno zaradi poteka ali kratkega roka uporabnosti?**<br>*Surovine in gotovi izdelki. Kalo med proizvodnjo merimo posebej v področju Donos.*<br>**?** Vsota odpisov s konta plus razlika v ceni pri razprodajah izdelkov s kratkim rokom. Primer: 14 odpisov × 600 EUR + 5.000 EUR znižanj ≈ 13.400 EUR na leto. | EUR/leto · »Ne vem« | 0 |
| 3 | **Kolikšne so bile v zadnjih 12 mesecih inventurne razlike v skladiščih, hladilnicah in zamrzovalnicah?**<br>*Samo neto manko po inventuri — brez odpisov zaradi roka iz prejšnjega vprašanja.*<br>**?** Razlika med knjižnim in dejanskim stanjem ob letni ali ciklični inventuri, v evrih. Če vodite samo količine, jih pomnožite z nabavno ceno. Primer: 1,2 % od 440.000 EUR ≈ 5.300 EUR. | EUR/leto · »Ne vem« | 0 |
| 4 | **Kolikšen delež zalog bi po vaši oceni lahko trajno zmanjšali, ne da bi zmanjkalo surovine za proizvodnjo ali izdelka za kupca?** — Do 5 % / 6–10 % / 11–20 % / Več kot 20 % / **Ne vem** (5 / 8 / 15 / 25 / 10 %)<br>**?** Ne koliko zaloge imate, ampak koliko bi je lahko trajno bilo manj, ne da bi kdaj zmanjkalo — tiste, ki leži zaradi previdnosti ali slabega pregleda. Groba ocena zadostuje. | izbira | Ne vem → 10 % |
| 5 | **Kako izdajate zalogo glede na rok uporabnosti?** — Sistem predlaga po roku (FEFO) / Skladiščnik izbere sam, roki so vidni / Po vrsti prevzema (FIFO), brez rokov / Kakor pride pod roko | izbira · *samo kontekst* | ni izbrano |
| 6 | **Kaj je glavni vzrok?** — Zaloge s kratkim rokom niso vidne pravočasno (75 %) / Naročanje surovin ni vezano na plan proizvodnje in naročila kupcev (65 %) / Izdaja ne poteka po roku uporabnosti (FEFO) (65 %) / Nihanje naročil kupcev in trgovskih verig (30 %) / Zalogo zavestno držimo kot varovalko (65 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
izguba            Odpisi zaradi poteka roka uporabnosti            = V2
izguba            Inventurne razlike v skladiščih in hladilnicah   = V3
enkratni kapital  Sprostljiv obratni kapital v zalogah             = V1 × delež iz V4
```
**Področje brez ur.** Odpisi zaradi roka in inventurne razlike sta ločena odliva z različnima vzrokoma (B03, B13).
PANTHEON naslavlja: roki uporabnosti in serije na zalogi, izdaja po načelu FEFO · več skladišč, hladilnic in lokacij z izpisom zaloge po preostalem roku · planiranje potreb po surovinah iz naročil kupcev in receptur.

### Ž3 · Sledljivost šarž, reklamacije in odpoklic

*Ročno sestavljanje sledljivosti šarže, reševanje reklamacij brez znane šarže ter dobropisi in stroški odpoklicev.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Koliko ur mesečno gre za ročno iskanje in sestavljanje sledljivosti — šarže dobaviteljev, izdaje v proizvodnjo, dobavnice kupcem?**<br>*Ob reklamacijah, presojah, zahtevah trgovcev in vajah odpoklica. Pripravo na presojo kot celoto merimo v področju Kakovost.*<br>**?** Čas, ko nekdo lista prevzemnice, proizvodne liste in dobavnice, da sestavi pot ene šarže. Ocena: 6 zahtev × 3 h ≈ 18 ur na mesec. | h/mesec | 0 |
| 2 | **Koliko ur mesečno porabite za reševanje reklamacij kupcev in iskanje vzroka?**<br>*Sprejem, pregled, komunikacija s kupcem in dobaviteljem. Ur sledljivosti iz prejšnjega vprašanja ne ponavljajte.*<br>**?** Pisarniški in tehnološki čas na reklamacijo: pregled vzorca, zapis, odgovor kupcu, uveljavljanje pri dobavitelju surovine. Ocena: 8 reklamacij × 2 h ≈ 16 ur na mesec. | h/mesec | 0 |
| 3 | **Kolikšni so bili v zadnjih 12 mesecih neposredni stroški reklamacij — dobropisi, vračila, nadomestne dobave, uničenje?**<br>*Brez stroškov odpoklica iz naslednjega vprašanja in brez izdelkov, odpisanih zaradi roka.*<br>**?** Denar, ki je odtekel zaradi reklamacij: dobropis kupcu, prevzem in uničenje vrnjenega blaga, nadomestna dostava. Ocena: 30 reklamacij × 350 EUR ≈ 10.500 EUR na leto. | EUR/leto · »Ne vem« | 0 |
| 4 | **Koliko so vas v zadnjih 12 mesecih stali odpoklici ali umiki s trga — umik, uničenje, obveščanje, izpad prodaje?**<br>*Če odpoklica ni bilo, pustite 0 — to je podatek, ne izgovor.*<br>**?** Vse, kar je odpoklic stal: prevzem blaga s polic, uničenje, obveščanje kupcev in inšpekcije, nadomestna proizvodnja. Ocenite po zadnjem dogodku; brez dogodka pustite 0. | EUR/leto · »Ne vem« | 0 |
| 5 | **Kako pogosto izvedete vajo odpoklica (simulacijo sledljivosti ene šarže)?** — Vsaj vsako četrtletje, z merjenjem časa / Enkrat na leto, pred presojo / Samo kadar jo zahteva presoja ali inšpekcija / Nikoli | izbira · *samo kontekst* | ni izbrano |
| 6 | **Kaj je glavni vzrok?** — Šarža dobavitelja se ob prevzemu ne zabeleži (75 %) / Šarža ni na dobavnici kupcu (75 %) / Proizvodnja, kakovost in prodaja vodijo ločene evidence (75 %) / Reklamacije rešujemo vsak po svoje, brez enotnega postopka (65 %) / Napake izvirajo pri dobaviteljih surovin (30 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
kapaciteta  Ročno sestavljanje sledljivosti                  = V1 × admin ura × 12
kapaciteta  Reševanje reklamacij in iskanje vzroka           = V2 × admin ura × 12
izguba      Dobropisi, vračila in uničenje ob reklamacijah   = V3
izguba      Stroški odpoklicev in umikov s trga              = V4                    ← meja 0,5
```
Meja 0,5: sledljivost odpoklic omeji na eno šaržo, ne prepreči ga (raziskava A19: 10–45 %, `zivilstvo.ts:415`).
PANTHEON naslavlja: serije in šarže od prevzema surovine prek proizvodnje do dobavnice kupcu · izsleditev šarže v obe smeri z eno poizvedbo, brez listanja evidenc · reklamacijski postopek s statusi, vezan na šaržo in dobavitelja.

### Ž4 · HACCP evidence, deklaracije in presoje

*Ročne HACCP in temperaturne evidence, priprava na presoje in inšpekcije ter posodabljanje deklaracij in alergenov.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Koliko skupnih ur mesečno gre za ročno vodenje HACCP evidenc in temperaturnih zapisov na papirju ter njihov prepis?**<br>*Kritične kontrolne točke, temperature hladilnic in vozil, čiščenje. Beleženje porabe in izhoda šarž merimo v področju Donos.*<br>**?** Vsak zapis na kontrolni točki in vsak temperaturni obhod, nato prepis in arhiviranje listov. Ocena: 4 točke × 3 zapisi na dan × 5 min × 30 dni ≈ 30 ur na mesec. | h/mesec | 0 |
| 2 | **Koliko skupnih ur na leto porabite za pripravo na presoje (IFS, BRC, ISO) in inšpekcije — zbiranje dokazil, urejanje evidenc, popravke?**<br>*Letna vrednost, ker presoja ni vsak mesec. Samo priprava, ne sama presoja.*<br>**?** Dnevi, ko vodja kakovosti in ekipa zbirajo zapise, iščejo dokazila in dopolnjujejo mape. Ocena: 2 presoji × 3 ljudje × 5 dni × 8 h ≈ 240 ur na leto. | **h/leto** | 0 |
| 3 | **Koliko ur mesečno gre za ročno posodabljanje deklaracij, hranilnih vrednosti in alergenov ob spremembi recepture ali dobavitelja?** | h/mesec | 0 |
| 4 | **Koliko so v zadnjih 12 mesecih stale napačne deklaracije ali etikete — ponovno tiskanje, prepakiranje, umik izdelka, globe?**<br>*Samo posledice napačne oznake. Reklamacije zaradi kakovosti izdelka merimo v področju Sledljivost.*<br>**?** Napačen alergen, rok ali sestavina na etiketi: nova naklada etiket, ročno prelepljanje, umik serije s police. Ocena: 3 dogodki × 1.500 EUR ≈ 4.500 EUR na leto. | EUR/leto · »Ne vem« | 0 |
| 5 | **Kje vodite HACCP evidence in temperaturne zapise?** — Elektronsko, s samodejnim zajemom temperatur / Elektronsko, z ročnim vnosom / Na papirju, s prepisom v Excel / Samo na papirju v mapah | izbira · *samo kontekst* | ni izbrano |
| 6 | **Kaj je glavni vzrok?** — Evidence so na papirju in ločene od sistema (75 %) / Recepture, deklaracije in šifranti niso povezani (75 %) / Dokazila za presojo zbiramo vsakič znova, ker niso na enem mestu (75 %) / Zahteve trgovcev in presojevalcev se pogosto spreminjajo (30 %) / Premalo ljudi oziroma znanje pri eni osebi (45 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
kapaciteta  Ročne HACCP in temperaturne evidence     = V1 × proizvodna ura × 12    ← meja 0,5
kapaciteta  Priprava na presoje in inšpekcije        = V2 × admin ura              (ure so letne; v prikazu ur/mesec = V2 / 12)
kapaciteta  Posodabljanje deklaracij in alergenov    = V3 × admin ura × 12
izguba      Napačne deklaracije in etikete           = V4
```
Meja 0,5 pri HACCP: zapis na kontrolni točki ostane obvezen tudi elektronsko (Uredba (ES) 852/2004), odpade prepis, iskanje in arhiviranje; elektronske evidence so praviloma zunanji sistem (`zivilstvo.ts:529`). Edino polje v vseh petih dejavnostih z enoto **h/leto** (V2).
PANTHEON naslavlja: deklaracija in alergeni iz recepture — sprememba sestavine je vidna pri vsakem izdelku, ki jo vsebuje · dokumentni arhiv, vezan na šaržo in artikel: dokazila za presojo na enem mestu, ne v mapah · šarže, izdaje in izvidi, ki jih presojevalec zahteva, iz sistema in ne iz papirjev.

### Ž5 · Naročila kupcev, planiranje in nujne dobave

*Ročni vnos naročil trgovcev, planiranje proizvodnje in nabave na pamet ter ekspresne nabave, penali in odbitki zaradi nedobave.*

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Koliko ur mesečno gre za ročni vnos in prepisovanje naročil kupcev — iz e-pošte, telefona in portalov trgovskih verig?**<br>*Samo vnos in potrjevanje naročil. Ure, ki ste jih že vpisali v drugem področju, tu ne ponavljajte.*<br>**?** Naročilo, ki pride po e-pošti ali telefonu in ga nekdo pretipka v sistem ali preglednico, nato preveri cene in količine. Ocena: 40 naročil na dan × 4 min ≈ 56 ur na mesec. | h/mesec | 0 |
| 2 | **Koliko ur mesečno porabite za planiranje proizvodnje in naročanje surovin — usklajevanje naročil, zalog, rokov surovin in kapacitet?**<br>*Vodja proizvodnje, nabava, tehnolog. Reševanja posameznih reklamacij ne štejte.*<br>**?** Tedenski in dnevni plan, preračun potreb po surovinah, klici dobaviteljem, prestavljanje šarž. Ocena: 2 osebi × 1,5 h na dan ≈ 63 ur na mesec. | h/mesec | 0 |
| 3 | **Koliko ste v zadnjih 12 mesecih doplačali za ekspresne nabave surovin ali embalaže in nujne dostave kupcem?**<br>*Samo doplačilo nad redno ceno oziroma rednim prevozom.*<br>**?** Razlika med nujno in redno izvedbo: manjša količina po višji ceni, dodatni prevoz, nočna dostava. Primer: nujna embalaža 2.400 EUR namesto 1.800 EUR → vpišite 600 EUR. | EUR/leto · »Ne vem« | 0 |
| 4 | **Kolikšni so bili v zadnjih 12 mesecih penali, odbitki in dobropisi trgovcem zaradi nedobave, delne dobave ali zamude?**<br>*Samo zaradi količin in rokov. Dobropise zaradi kakovosti izdelka merimo v področju Sledljivost.*<br>**?** Trgovske verige nedobavo zaračunajo: odbitek na računu, pogodbeni penal, izpad z akcijskega letaka. Ocena: 12 dogodkov × 500 EUR ≈ 6.000 EUR na leto. | EUR/leto · »Ne vem« | 0 |
| 5 | **Kako večinoma prihajajo naročila kupcev?** — Elektronsko (EDI, portal, spletno naročanje) neposredno v sistem / Elektronsko, a jih prepišemo / Po e-pošti / Po telefonu in na sestankih | izbira · *samo kontekst* | ni izbrano |
| 6 | **Kaj je glavni vzrok?** — Naročila prihajajo po e-pošti in telefonu in jih prepisujemo (75 %) / Plan proizvodnje ni povezan z naročili in zalogami surovin (65 %) / Roki surovin in kapacitete ob planiranju niso vidni (75 %) / Kupci in trgovske verige spreminjajo naročila v zadnjem hipu (30 %) / Okvare opreme in izpadi linije (15 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
kapaciteta  Ročni vnos naročil kupcev                        = V1 × admin ura × 12
kapaciteta  Planiranje proizvodnje in naročanje surovin      = V2 × admin ura × 12
izguba      Ekspresne nabave in nujne dostave                = V3
izguba      Penali in odbitki trgovcev zaradi nedobave       = V4
```
PANTHEON naslavlja: naročila kupcev prek e-izmenjave in spletnega naročanja neposredno v sistem · planiranje potreb po surovinah iz naročil, receptur in rokov zaloge · statusi naročil in dobavljivost, vidni prodaji in proizvodnji hkrati.

### Ž6–Ž9 · Horizontale

Analitika in poročanje · Računovodstvo in finance · Kadri in plače · Dokumentacija in e-poslovanje — **Priloga A**.

### Zadnja stran (Korak 8 od 10) · Kratka diagnostika in Tvegani stroški

**Kratka diagnostika** — *Štiri vprašanja o podatkih in odpornosti procesa. Ne prispevajo k finančnemu rezultatu.*

| # | Vprašanje |
|---|---|
| D1 | **Ali sproti evidentirate porabo surovin in izhod vsake šarže?** |
| D2 | **Ali poznate dejanski strošek in donos posameznega izdelka?** |
| D3 | **Ali lahko v eni uri za katero koli šaržo ugotovite dobavitelje surovin in kupce, ki so jo prejeli?** ← hipoteza H01, KPI K01 (cilj pod 1 h) |
| D4 | **Ali proizvodnja in kakovost delujeta normalno tudi brez tehnologa ali vodje kakovosti?** |

```
tveganje  Zanesljivost podatkov  ← (D1 + D2) / 6
tveganje  Procesna odpornost     ← (D3 + D4) / 6
```
Opombe k stopnjam: *podatki* — nizko »Poraba in izhod šarže se evidentirata sproti, dejanski donos in lastna cena izdelka sta znana. Odstopanje opazite pri šarži, ne ob letnem obračunu.« · srednje »Podatki so delni. Razliko med recepturo in dejanskim donosom praviloma opazite šele ob inventuri ali obračunu, ko je surovina že porabljena.« · visoko »Dejanskega donosa in lastne cene izdelka ne poznate. Dokler tega ni, natančnega zneska kala in prodaje pod lastno ceno ni mogoče izračunati — in prav to je težava.« · *proces* — nizko »Sledljivost šarže je urejena v obe smeri in proizvodnja ni odvisna od posameznika. Odpoklic bi omejili na eno šaržo.« · srednje »Sledljivost je delna. Ob resnem odpoklicu bi bilo obseg težko omejiti, priprava na presojo pa sloni na nekaj ljudeh.« · visoko »Sledljivosti praktično ni, recepture in znanje so pri eni osebi. En odpoklic bi pomenil umik vsega, odsotnost tehnologa pa zastoj proizvodnje.«

**Tvegani stroški (modul E)** — samo uporabnikom PANTHEON, **Priloga B**.

## Korak 9 od 10 — Obrazec s kontaktom

> **Rezultat in PDF poročilo s tremi ukrepi za vaš živilski obrat**
> Po oddaji se na zaslonu odpre vaš izračun, PDF poročilo za upravo ali lastnika pa prejmete na vpisani e-naslov — razčlenjeno po področjih, s formulo pod vsako postavko in tremi ukrepi, ki jih je pri donosu, rokih in sledljivosti mogoče začeti ta teden.

Polja — **Priloga C**.

## Korak 10 od 10 — Rezultat

> **Toliko vas stane sedanji način dela v živilski proizvodnji**

Kartica *Neposredni letni stroški*: »Denar, ki dejansko odteka: kalo nad recepturo, odpisi zaradi roka, inventurne razlike, dobropisi in odpoklici, napačne etikete, ekspresne nabave in penali trgovcev.« Naslov PDF-ja: **Analiza skritih stroškov v živilski proizvodnji**. Sestava — **Priloga D**.

## Živilstvo v številkah

| | Vprašanj |
|---|---|
| Uvodni zaslon + Koraki 1–4: dejavnost 1 · zaposleni 1 · kontekst 3 · triaža 9 · osnova 3 | 17 |
| Privzeta tri področja (Ž1 6 + Ž2 6 + Ž3 6) | +18 |
| Diagnostika | +4 |
| **Tipična pot skupaj** | **39** *(+3 kljukice E)* |
| Vseh 9 področij (Ž1–Ž5: 30, horizontale: 20) + diagnostika | 71 *(+3)* |
| Obrazec | +10 |

**Denarni kanali:**

| Kanal | Kje nastane |
|---|---|
| Neposredna izguba | kalo nad recepturo (meja 0,6) · odpisi zaradi roka · inventurne razlike · dobropisi in uničenje · odpoklici (meja 0,5) · napačne etikete · ekspresne nabave · penali trgovcev · obresti in globe · napačne plače · prepozno potrjeni dokumenti |
| Nezaslužena marža | — (v tej dejavnosti ni postavke) |
| Kapaciteta | 3 postavke po proizvodni uri (beleženje šarž, ponovna predelava, HACCP z mejo 0,5) + 6 po admin uri (sledljivost, reklamacije, presoje v h/leto, deklaracije, vnos naročil, planiranje) + 12 horizontalnih |
| Enkratni kapital | zaloga × sprostljiv delež (Ž2) |
| Tveganje | 2 diagnostični oceni + do 3 roki iz modula E |

**Kar je namenoma brez zneska:** lokacija receptur (Ž1.5), FEFO (Ž2.5), vaja odpoklica (Ž3.5), način vodenja HACCP (Ž4.5), kanal naročil (Ž5.5). **Kar ni izmerjeno nikjer:** PPWR embalažna dokumentacija (B19), javna naročila (B11), odprema in hladna veriga (B16), elektronske HACCP evidence in samodejni zajem temperatur (zunanji sistem — zato meja 0,5), laboratorij.

---

# Primerjava petih dejavnosti

| | Kovinarstvo | Predelava plastike | Inženiring | Gradbeništvo | Živilstvo |
|---|---|---|---|---|---|
| Panožna področja | **6** | 5 | 5 | 5 | 5 |
| Horizontale (izpuščena) | 4 (servis) | 4 (servis) | 4 (**dokumentacija**) | **5** (nobena) | 4 (servis) |
| Področij v triaži | 10 | 9 | 9 | 10 | 9 |
| Privzeta tri | Nalog · Material · Zaloge | Stroji · Granulat · Planiranje | Marža · Aneksi · Oprema | Marža · Situacije · Gradbišče | Donos · Roki · Sledljivost |
| Operativna ura (povprečje) | proizvodna, 22 EUR | **strojna ura z operaterjem, 30 EUR** | inženirska, 30 EUR | delavec na gradbišču, 21 EUR | proizvodna, 18 EUR |
| Admin ura (povprečje) | 26 EUR | 26 EUR | 26 EUR | **28 EUR** | 26 EUR |
| Prihodek | vprašan, ne množi | vprašan, ne množi | »letna vrednost projektov« — množi Obračun | »letna vrednost izvedenih del« — množi Plačila | vprašan, ne množi |
| Strošek financiranja | — | — | 8,5 % | 8,5 % | — |
| Postavk v finančni osnovi | 3 | 3 | **4** | **4** | 3 |
| Nezaslužena marža | prodaja pod lastno ceno | — | — | marža, izgubljena zaradi prepozne informacije | — |
| Enkratni kapital | zaloge | zaloge | oprema brez projekta **+** zapadli zadržki | zadržana sredstva | zaloge |
| Meje naslovljivosti | material 0,5 | menjave 0,3 · izmet 0,5 · okvare 0,2 | — | — | kalo 0,6 · odpoklic 0,5 · HACCP 0,5 |
| Diagnostika | 4 vprašanja, 2 oceni | **6 + kljukica PPWR, 3 ocene** | 4, 2 | 4, 2 | 4, 2 |
| Prag visoke izgube | 15.000 EUR | 20.000 EUR | 20.000 EUR | 20.000 EUR | 15.000 EUR |
| Tipična pot (3 področja) | 38 vprašanj | 42 | 39 | 41 | 39 |
| Vsa področja + diagnostika | 74 | 74 | 71 | 77 | 71 |

Skupno vsem petim: 10 korakov ob treh področjih; kontekst s tremi vprašanji; modul E samo uporabnikom PANTHEON; glavni vzrok kot edini koeficient; »Ne vem« kot poštena vrzel, ne ničla; obrazec pred rezultatom; PDF na e-naslov.

---

# Priloga A — Horizontalna področja (dobesedno enaka v vseh dejavnostih)

Pet področij iz `horizontal.ts`; katera so v kateri dejavnosti, pove tabela primerjave. Vse ure se vrednotijo po **admin uri**, razen garancijskih popravil v servisu (operativna ura). Razmejitveni napotki namenoma ne imenujejo sosednjih področij — ta so v vsaki dejavnosti druga (`horizontal.ts:18`).

## H1 · Analitika in poročanje

*Ročna priprava poročil za vodstvo, izredne analize in združevanje podatkov iz več virov.*
Triaža: **Koliko ročnega dela zahteva priprava poročil in ključnih številk za odločanje?** — Poročila se sestavijo sama / Nekaj ur ob koncu meseca / Vsak teden po nekaj ur / S poročili se nekdo ukvarja skoraj vsak dan

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Koliko ur mesečno gre za ročno pripravo rednih poročil za vodstvo ali lastnike vašega podjetja?**<br>*Samo poročila, po katerih vodite svoje podjetje. Ure, ki ste jih že vpisali v drugem področju, tu ne ponavljajte.*<br>**?** Ročno sestavljanje poročil: izvoz v Excel, lepljenje, oblikovanje, usklajevanje številk pred sestankom. Ocena: 4 poročila × 3 h ≈ 12 ur na mesec. | h/mesec | 0 |
| 2 | **Koliko ur mesečno vzamejo izredne analize in vprašanja "na hitro potrebujemo številko"?** | h/mesec | 0 |
| 3 | **Koliko ur mesečno gre za zbiranje in ročno združevanje podatkov iz različnih virov v eno preglednico?** | h/mesec | 0 |
| 4 | **Kako stare so ključne številke, ko jih vodstvo vidi?** — Sprotne, iz sistema / Stare nekaj dni / Stare nekaj tednov / Vidimo jih šele ob obračunu | izbira · *samo kontekst* | ni izbrano |
| 5 | **Kaj je glavni vzrok?** — Podatki so v več sistemih in preglednicah (75 %) / Poročila ročno sestavlja ena oseba (75 %) / Vsak oddelek ima svoje številke (75 %) / Zahteve po poročilih se pogosto spreminjajo (65 %) / Podatke dobimo od zunanjega računovodstva (30 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
kapaciteta × 3  Ročna priprava rednih poročil / Izredne analize in iskanje številk / Združevanje podatkov iz več virov  = ure × admin ura × 12
```
**Neposredna izguba: 0 EUR.** PANTHEON naslavlja: nadzorne plošče in poročila nad živimi podatki, brez ročnega sestavljanja · ena resnica: isti podatek za vse oddelke in poročila · vrtilne analize po strankah, artiklih in obdobjih neposredno iz sistema.

## H2 · Računovodstvo in finance

*Ročno knjiženje in priprava dokumentov, usklajevanje evidenc ter davčni obračuni in poročanje.*
Triaža: **Koliko ročnega dela je v vašem računovodstvu in financah (knjiženje, usklajevanje, obračuni)?** — Večina poteka samodejno / Nekaj ur ob koncu meseca / Več dni vsak mesec / Konec meseca je vsakič zamašek

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Koliko ur mesečno gre za ročno knjiženje in pripravo dokumentov za računovodstvo (interno ali zunanji servis)?**<br>*Ure, ki ste jih že vpisali v drugem področju, tu ne ponavljajte.*<br>**?** Ročno knjiženje in priprava dokumentov zanj: vnos računov, priprava plačil, urejanje prilog. Ocena: 1 oseba × 6 h na teden ≈ 26 ur na mesec. | h/mesec | 0 |
| 2 | **Koliko ur mesečno porabite za usklajevanje — banka, kartice kupcev in dobaviteljev, medsebojni IOP?**<br>*Štejte samo usklajevanje evidenc, ne opominjanja kupcev.*<br>**?** Ure, ko primerjate dve evidenci, ki se ne ujemata: banka proti odprtim postavkam, zaloga proti knjigovodstvu. Ocena: 2 osebi × 5 h ≈ 10 ur na mesec. | h/mesec | 0 |
| 3 | **Koliko ur mesečno vzamejo davčni obračuni, DDV in poročanje državi?** | h/mesec | 0 |
| 4 | **Koliko so v zadnjih 12 mesecih znašale zamudne obresti, globe in stroški popravkov zaradi davčnih obračunov in poročanja?**<br>*Samo posledice napačnega ali prepoznega obračuna. Stroške prepozno potrjenih dokumentov merimo posebej.*<br>**?** Zamudne obresti, globe zaradi prepozne oddaje in stroški popravkov. Ocena: 2 samoprijavi × 400 EUR + 600 EUR obresti ≈ 1.400 EUR na leto. | EUR/leto · »Ne vem« | 0 |
| 5 | **Kaj je glavni vzrok?** — Dokumenti do knjiženja potujejo ročno (75 %) / Isti podatek vnašamo v več sistemov (75 %) / Napake odkrijemo šele pri usklajevanju (65 %) / Odvisni smo od zunanjega servisa (30 %) / Nihče nima financ v celoti za svojo nalogo (65 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
kapaciteta × 3  Ročno knjiženje in priprava dokumentov / Usklajevanje evidenc / Obračuni in poročanje državi  = ure × admin ura × 12
izguba          Zamudne obresti, globe in popravki = V4
```
PANTHEON naslavlja: samodejno knjiženje prejetih in izdanih dokumentov · DDV in davčna poročila neposredno iz sistema, brez prepisovanja · kartice kupcev in dobaviteljev, usklajene brez ročnega primerjanja.

## H3 · Kadri in plače

*Evidence delovnega časa, priprava obračuna plač in kadrovska administracija.*
Triaža: **Koliko dela zahtevajo evidence delovnega časa, dopusti in priprava plač?** — Malo — večina poteka samodejno / Nekaj ur na mesec / Nekaj dni vsak mesec / Vsak mesec je to velik projekt

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Koliko ur mesečno gre za zbiranje in urejanje evidenc prisotnosti in delovnih ur vaših zaposlenih?**<br>*Evidenca za plačo, ne za račun naročniku. Ure, ki ste jih že vpisali v drugem področju, tu ne ponavljajte.*<br>**?** Zbiranje in urejanje evidenc: prepisovanje listov, lovljenje manjkajočih vnosov, popravki pred plačami. Ocena: 2 osebi × 5 h ≈ 10 ur na mesec. | h/mesec | 0 |
| 2 | **Koliko ur mesečno vzame priprava podatkov za obračun plač in popravki po obračunu?** | h/mesec | 0 |
| 3 | **Koliko ur mesečno gre za dopuste, potne naloge, potrdila in drugo kadrovsko administracijo?** | h/mesec | 0 |
| 4 | **Koliko so v zadnjih 12 mesecih stali napačni obračuni plač (poračuni, zamudne obresti, zunanja pomoč)?** | EUR/leto · »Ne vem« | 0 |
| 5 | **Kaj je glavni vzrok?** — Evidence ur se zbirajo ročno — papir ali preglednice (75 %) / Podatki za plače pridejo iz več virov (75 %) / Pravila za dodatke in nadomestila so zapletena (65 %) / Zunanji obračun plač zahteva ročno pripravo podatkov (30 %) / Kadrovska evidenca ni nikogaršnja glavna naloga (65 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
kapaciteta × 3  Evidence prisotnosti in delovnih ur / Priprava in popravki obračuna plač / Kadrovska administracija  = ure × admin ura × 12
izguba          Stroški napačnih obračunov plač = V4
```
PANTHEON naslavlja: registracija delovnega časa, neposredno povezana z obračunom plač · obračun plač po slovenski zakonodaji, brez zunanjih preglednic · dopusti, potni nalogi in kadrovske evidence na enem mestu.

## H4 · Dokumentacija in e-poslovanje

*Potrjevanje dokumentov, iskanje in arhiviranje ter tiskanje in ročno pošiljanje, ki bi lahko potekalo elektronsko.* (Ni v inženiringu.)
Triaža: **Koliko časa se izgubi s potrjevanjem, iskanjem in ročnim pošiljanjem dokumentov?** — Dokumenti so urejeni in dostopni / Občasno kaj iščemo / Potrjevanje in iskanje se redno vlečeta / Dokumentacija je stalna težava

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Koliko ur mesečno gre za ročno potrjevanje dokumentov — računov, naročil, pogodb — in priganjanje podpisnikov?**<br>*Ure, ki ste jih že vpisali v drugem področju, tu ne ponavljajte.*<br>**?** Čas za lovljenje podpisov: pošiljanje v podpis, opominjanje, iskanje, kje se je dokument ustavil. Ocena: 60 dokumentov × 10 min ≈ 10 ur na mesec. | h/mesec | 0 |
| 2 | **Koliko ur mesečno gre za iskanje in arhiviranje dokumentov?** | h/mesec | 0 |
| 3 | **Koliko ur mesečno gre za tiskanje, skeniranje in ročno pošiljanje dokumentov, ki bi lahko potovali elektronsko?** | h/mesec | 0 |
| 4 | **Koliko so v zadnjih 12 mesecih stali izgubljeni ali prepozno potrjeni dokumenti (zamujeni skonti, opomini dobaviteljev, ponovna izstavitev)?**<br>*Samo posledice poti dokumenta. Obresti in globe zaradi davčnih obračunov merimo posebej.*<br>**?** Zamujeni skonti, ponovna izstavitev izgubljenih dokumentov, opomini zaradi računa, ki je obtičal v potrjevanju. Ocena: 20 skontov × 80 EUR ≈ 1.600 EUR na leto. | EUR/leto · »Ne vem« | 0 |
| 5 | **Kaj je glavni vzrok?** — Dokumenti so v mapah in e-pošti, ne v sistemu (75 %) / Potrjevanje poteka ročno, po e-pošti ali na papirju (75 %) / Dokumenti prihajajo papirno ali kot skeni (30 %) / Ni jasno, katera različica dokumenta je veljavna (75 %) / Le ena oseba ve, kje kaj je (75 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
kapaciteta × 3  Potrjevanje dokumentov / Iskanje in arhiviranje dokumentov / Tiskanje, skeniranje in ročno pošiljanje  = ure × admin ura × 12
izguba          Stroški izgubljenih in prepozno potrjenih dokumentov = V4
```
PANTHEON naslavlja: elektronsko potrjevanje dokumentov z revizijsko sledjo · e-računi in e-izmenjava skladno z ZIERDED, brez ročnega pošiljanja · dokumentni arhiv, povezan s knjižbami, naročili in posli.

## H5 · Reklamacije in poprodajni servis

*Garancijska popravila in servisni posegi po predaji, vodenje reklamacijskega postopka ter nadomestni deli in zunanji servis.* (Samo v inženiringu in gradbeništvu.)
Triaža: **Koliko dela vam povzročajo garancijska popravila, servis in vodenje reklamacij po predaji?** — Skoraj nič — primerov je malo / Nekaj primerov na mesec / Vsak teden več primerov / S servisom se nekdo ukvarja vsak dan

| # | Vprašanje | Tip | Privzeto |
|---|---|---|---|
| 1 | **Koliko ur mesečno gre za garancijska popravila in servisne posege po predaji izdelka, blaga ali projekta?**<br>*Ure, ki ste jih že vpisali v drugem področju, tu ne ponavljajte.*<br>**?** Ure tehnikov in serviserjev za garancijske in servisne posege po predaji. Ocena: 10 primerov × 2,5 h ≈ 25 ur na mesec. | h/mesec | 0 |
| 2 | **Koliko ur mesečno vzame vodenje reklamacijskega postopka — sprejem in evidenca primerov, komunikacija s stranko ter uveljavljanje garancij in RMA pri dobaviteljih?**<br>*Štejte samo garancijske in servisne primere, ne urejanja običajnih vračil in dobropisov.*<br>**?** Pisarniški del reklamacije: sprejem prijave, dokumentacija, usklajevanje z dobaviteljem. Ocena: 20 primerov × 45 min ≈ 15 ur na mesec. | h/mesec | 0 |
| 3 | **Koliko so v zadnjih 12 mesecih znašali nadomestni deli, zunanji servis in kulanca pri garancijskih popravilih?**<br>*Samo stroški, ki še niso zajeti drugje — dobropisi, vračila kupnine in poškodovano blago sem ne sodijo.*<br>**?** Denar, ki odteče poleg porabljenih ur: nadomestni deli, prevozi na teren, zunanji servis. Ocena: povprečen primer × število primerov na leto. | EUR/leto · »Ne vem« | 0 |
| 4 | **Kako spremljate odprte reklamacijske in servisne primere?** — V sistemu, s statusi in roki / V skupni preglednici / Po e-pošti in po spominu / Evidence nimamo | izbira · *samo kontekst* | ni izbrano |
| 5 | **Kaj je glavni vzrok?** — Primere vodimo ročno — po e-pošti in v preglednicah (75 %) / Ne vidimo zgodovine izdelka in prejšnjih posegov (75 %) / Postopek reševanja ni enoten — vsak primer teče po svoje (65 %) / Napake izvirajo pri dobaviteljih ali proizvajalcih (30 %) / Okvare zaradi obrabe in narave izdelka (15 %) / Ne vemo (45 %) | izbira | ni izbrano → 45 % |

```
kapaciteta  Garancijska popravila in servisni posegi    = V1 × OPERATIVNA ura × 12   ← edina horizontala z operativno uro
kapaciteta  Vodenje reklamacijskega postopka            = V2 × admin ura × 12
izguba      Nadomestni deli, zunanji servis in kulanca  = V3
```
PANTHEON naslavlja: servisni nalogi z zgodovino izdelka in vseh posegov na enem mestu · reklamacijski postopek s statusi in roki, ne po e-pošti · poraba nadomestnih delov, povezana z zalogo in nabavo.

---

# Priloga B — Tvegani stroški (modul E)

*Roki, ki vas dohitijo, tudi če danes vse deluje.* Prikaže se **samo**, če je v koraku Kontekst pri sedanjem sistemu izbrana možnost PANTHEON (`contexts/index.ts:68`). Vsebinsko enak za vse dejavnosti, tri kljukice (privzeto neodkljukane), vsaka odkljukana da tveganje »visoko« z opozorilom:

| Kljukica | Opozorilo na rezultatih |
|---|---|
| **Uporabljamo SQL Server 2016** | Podpora za SQL Server 2016 je potekla 14. 7. 2026 — rok je že mimo. |
| **Uporabljamo Windows Server 2016** | Podpora za Windows Server 2016 se konča 12. 1. 2027. |
| **Nimamo urejenega kanala za e-račune** | Od 1. 1. 2028 velja ZIERDED: brez urejenega e-računa vam kupec preprosto ne bo mogel plačati — globa do 3.000 EUR je ob tem obrobna. |

Odkljukan modul E odloči o izbiri follow-up sekvence (`CalculatorFlow.tsx:646`) in nosi 10 % ocene ICP (dimenzija »nujnost«).

---

# Priloga C — Obrazec s kontaktom (Korak 6+n)

Naslov in podnaslov sta panožna (izpisana v razdelkih 1–5); vse ostalo je enako (`EmailGate.tsx`).

| Polje | Obvezno | Opomba |
|---|---|---|
| Ime | da | napaka: »Vpišite ime.« |
| Priimek | da | »Vpišite priimek.« |
| Ime podjetja | da | »Vpišite ime podjetja.« — edino, kar pride iz obrazca v strankin PDF |
| E-naslov | da | namig: »Na ta naslov vam pošljemo PDF poročilo.« · napaka: »Vpišite veljaven e-naslov (npr. ime@podjetje.si).« |
| Telefonska številka | ne (neobvezno) | mehko: »Videti je, da številka ni popolna. Oddaje to ne ustavi.« |
| Davčna številka | ne (neobvezno) | ogrado »npr. 12345679«; mehko: »Videti je, da davčna ni veljavna (osem števk). Oddaje to ne ustavi.« |

**Privolitve:**
- ☐ * Dovoljujem, da Datalab SI d.o.o. in Datalab d.d. moje osebne podatke do preklica hranita in obdelujeta za namene, podrobno opisane v pravilniku o zasebnosti, ki vključujejo spremljanje mojih aktivnosti na spletni strani ter mojih zanimanj z namenom oblikovanja personaliziranih vsebin in ponudb. — **obvezna**; napaka: »Brez privolitve za obdelavo podatkov vam rezultata in poročila ne smemo pripraviti.« (povezava na pravilnik še ni znana, `EmailGate.tsx:17`)
- ☐ Dovoljujem, da me obveščate o prilagojenih ponudbah glede programa PANTHEON.
- ☐ Dovoljujem, da se moje osebne podatke uporabi za namene obveščanja o podjetniških vsebinah in dogodkih — PANTHEON baza znanja.

**Poziv k posvetu** (ločen okvir pod obrazcem): naslov **»Želite, da vaše številke pregledamo skupaj?«** · ☐ **Da, želim brezplačen posvet — kontaktirajte me.** · *Brez obveznosti. Svetovalec pogleda vaš izračun in pove, katere postavke je v vašem primeru mogoče nasloviti najhitreje.* · ob kljukici brez telefona: »Pustite tudi telefonsko številko — svetovalec vas doseže hitreje.«

Gumba: **Nazaj** · **Pokaži rezultate** (med oddajo »Pripravljam …«). Gumb ni onemogočen: ob kliku z manjkajočimi polji se nad gumbom izpiše »Rezultatov še ne moremo pokazati.« s seznamom manjkajočega, fokus skoči v prvo pomanjkljivo polje. Ob oddaji se nič ne prenese; lead odide na Google Sheet webhook (oba PDF-ja kot prilogi obvestila), strankino poročilo gre na vpisani e-naslov, obiskovalec pristane na rezultatih. Oddan obrazec se ne prikaže drugič (tudi po »Nazaj na vnos« in popravkih gre naravnost na rezultate).

---

# Priloga D — Rezultat (Korak 7+n)

Brez vprašanj. Sestava zaslona (`ResultsView.tsx`), od zgoraj:

1. **Naslovni pas:** panožni naslov (npr. »Toliko vas stane sedanji način dela v kovinarstvu«), oznaka »Skupaj na leto«, **znesek = neposredna izguba + nezaslužena marža + kapaciteta** (kot razpon, kadar osnova stoji na izbranih pasovih; s predpono »najmanj« ob nizki zanesljivosti). Opomba: *»V vsoti so tri vrste zneska: denar, ki odteka, marža, ki je niste zaslužili, in vrednost izgubljenega časa. Sprostljiv obratni kapital je zunaj nje — enkraten znesek se z letnimi ne sešteva.«* Časovne leče: **Na delovni dan · Na mesec · V treh letih** (»Ob nespremenjenem načinu dela in brez rasti. Zmnožek letnega zneska s tremi …«). Oznaka zanesljivosti (Visoka / Srednja / Nizka).
2. **Koliko področij je izmerjenih:** vrstica »Izmerjeno N od M področij« — kadar niso izmerjena vsa; področja z oceno ≥ 2, ki niso izmerjena, se omenijo posebej.
3. **Česa ta znesek ne vsebuje:** režije na sproščene ure · rasti podjetja in plač · neizmerjenih področij · vsega, kar je označeno z »Ne vem«. *»Dejanski strošek je torej višji od prikazanega, ne nižji.«*
4. **Iz česa je znesek sestavljen:** naložena vrstica treh vrst denarja + pojasnilo zanesljivosti z razlogom (npr. urni postavki sta panožna ocena).
5. **Kartice:** Neposredni letni stroški (panožna opomba) · Nezaslužena letna marža (če obstaja) · Vrednost izgubljene kapacitete (h/mesec + EUR; pri plastiki strojne in delovne ure skupaj) · Sprostljiv obratni kapital (enkratno, ločeno) · **Ocenjen naslovljiv potencial** = Σ (znesek × naslovljivi delež po glavnem vzroku, omejen z mejo naslovljivosti) — *»Letno. … Ni obljuba prihranka, ampak konservativen poslovni potencial, ki ga je mogoče preveriti na uvodnem sestanku.«*
6. **Razčlenitev po področjih:** graf (ena vrstica na področje, razvrščeno po velikosti) + seznam postavk neposredne izgube in nezaslužene marže s formulo pod vsako.
7. **Kje se izgublja kapaciteta:** postavke z urami in EUR.
8. **Kako znesek raste z odlašanjem:** kumulativni stolpci po letih; *»To je X vsak delovni dan oziroma Y za vsak mesec brez odločitve.«*
9. **Podatki in procesna tveganja:** 2 (plastika 3) diagnostični oceni z opombo + roki iz modula E. *»Ta ocena namenoma nima zneska …«*
10. **Česa nismo izmerili:** poimensko našteta področja, ki niso izbrana ali so ostala prazna, z lastno triažno oceno (pike) in gumbom **»Izračunaj še to«** (pelje naravnost na stran tistega področja).
11. **Kaj sledi:** potrditev posveta (če je bil označen), obvestilo »Poročilo smo poslali na <e-naslov>«, blok **»Želite se pogovoriti takoj?«** s prodajnim kontaktom.
12. **Noga:** **Nazaj na vnos** (na zadnjo stran vnosov) · **Prenesi PDF poročilo** — samo kot rezerva, kadar poročilo ni šlo po e-pošti (ali v internem načinu `?debug=1`, kjer je na voljo tudi priprava za svetovalca).

Strankin PDF nosi panožni naslov dokumenta (razdelki 1–5), ime podjetja iz obrazca, velikostni razred, iste kartice in razčlenitev ter tri ukrepe za področje z največjim zneskom (`content/actions/actions.ts`).
