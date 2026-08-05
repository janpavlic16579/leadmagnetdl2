# LM-10 — Kalkulator "Koliko vas stane sedanji način dela?"

Interaktivni kalkulator skritih stroškov sedanjega načina dela. Obiskovalec vnese svoje številke in
takoj — še **pred** vnosom e-naslova — dobi razčlenjen letni izračun z razkrito metodologijo.

## Zagon

```bash
npm install
npm run dev
```

| Ukaz | Kaj naredi |
|---|---|
| `npm run dev` | razvojni strežnik |
| `npm run test` | unit testi formul in motorja |
| `npm run lint` | oxlint |
| `npm run build` | produkcijski build |

Aplikacija se objavlja na podpot `/leadmagnetdl/` (`base` v `vite.config.ts`). Poti do datotek v `public/`
je zato treba sestaviti prek `import.meta.env.BASE_URL` — Vite prepiše samo poti v `index.html`, ne pa
tudi tistih v kodi ali v CSS `url()`.

## Segmenti

Segment ima **en sam vir: dejavnost, izbrano v prvem koraku.** Kampanjski `?s=` segmenta ne določi
mimo vprašalnika, ampak v Koraku 1 **prednastavi ustrezno dejavnost** — obiskovalec vidi, kaj je
povezava predpostavila, in jo sme popraviti. Podprt je tudi `?utm_source=` — vir se zapiše v izvozni
zapis.

Prej je obstajal še ročni override (zaslon "Izberite profil izračuna" in `?s=`), ki se ni počistil
nikoli: od prve nastavitve naprej je bil spustni seznam v Koraku 1 okrasen — obiskovalec je zamenjal
dejavnost, vprašalnik in rezultati pa so ostali na starem segmentu. Zaslona ni več; gumb v pasu na
koraku z vnosi ("spremeni dejavnost") vrne na Korak 1.

Ob spremembi dejavnosti se odgovori zavržejo samo, kadar se spremeni tudi **segment** — `trgovina` in
`drugo_blago` vodita v isti vprašalnik, zato bi brisanje pomenilo izgubo dela brez razloga.

| URL | Segment | Koraki |
|---|---|---|
| `?s=proizvodnja` | Proizvodnja 10–249 zap. | 7 |
| `?s=logistika` | Logistika in transport 10–249 zap. | 7 |
| `?s=trgovina` | Veleprodaja in distribucija | 7 |
| `?s=maloprodaja` | Maloprodaja | 7 |
| `?s=storitve` | Storitve in projekti 10–249 zap. | 7 |
| `?s=racunovodstvo` | Računovodski servis | 7 |
| `?s=splosno` | Direktor / CFO | 7 |

## Tok

```
dejavnost → zaposleni → [kontekst] → [triaža] → [stroškovni predpostavki] → vnosi → rezultat → e-naslov
```

Dejavnost in število zaposlenih sta ločena koraka: iz dejavnosti se izpelje segment in s tem celoten
nadaljnji vprašalnik, število zaposlenih pa v nobeno formulo ne vstopi — uporabi se samo za velikostni
razred v poročilu.

Koraka v oglatih oklepajih vklopi **vnos dejavnosti v `src/config/contexts/`** — konfiguracija je hkrati
stikalo, zato zastavice brez konfiguracije (ki bi prikazala prazen korak) ni več. Triažo vklopi
`triage: { recommendedCount }` v `src/config/segments.ts`. Zaporedje in številčenje korakov se izpeljeta iz
tega, zato dodajanje koraka ne pomeni urejanja verige pogojev.

Kontekst določa tudi besedila: "Kako pretežno proizvajate?" prevozniku ne pomeni ničesar, zato ima vsaka
dejavnost svoja vprašanja, svoje možnosti sistema (in s tem pasove izboljšave) ter svoje razpone urnih
postavk — voznikova ura ni operaterjeva.

## Moduli

Moduli so **podatki**, ne koda: vsak modul v `src/config/modules/` sam pove, kaj vpraša, kako računa in v
kateri koš gre izid. Dodajanje dejavnosti = nova datoteka z definicijami + vpis v register.

### Proizvodnja — pet izključujočih se stroškovnih področij

| Modul | Meri |
|---|---|
| `planiranje` | Plan, kapacitete in navodila |
| `material` | Izmet, dodelave in kakovost |
| `zaloge` | Zaloge in razpoložljivost materiala |
| `nalogi` | Delovni nalogi in podatki |
| `zamude` | Roki in nujni stroški |
| `diagnostika` | Štiri vprašanja o podatkih in odpornosti procesa — brez evrov, vedno vidna |
| `E` | Tehnična opozorila (SQL Server, Windows Server, ZIERDED) — **samo obstoječim uporabnikom PANTHEON** |

Triaža predizbere tri področja in **ničesar ne omejuje** — obiskovalec sme obkljukati vsa.
`recommendedCount` pove, koliko jih je privzeto označenih in koliko jih priporočamo; neobvezni
`defaultIds` pa, **katera** so to. Ta seznam je ločen od `moduleIds` namenoma: tisti vrstni red
določa prikaz v razčlenitvi, grafu in PDF-ju ter razrešuje izenačenje pri "največji postavki", zato
privzete izbire ni mogoče popraviti prek njega, ne da bi se premaknili rezultati. Brez `defaultIds`
veljajo prva področja po `moduleIds`.

Področje, ki ga obiskovalec izbere in pusti prazno, prispeva 0 EUR, zato ne šteje ne v oceno
zanesljivosti ne med izmerjena — pokaže se po imenu v razdelku "Česa nismo izmerili". Brez tega bi
ista številka dobila slabšo oznako samo zato, ker je obiskovalec obkljukal več področij.

### Logistika in transport — pet izključujočih se stroškovnih področij

Zgrajena po istem vzorcu (`src/config/modules/logistika.ts`), z isto disciplino košev in naslovljivih
deležev. Vsako področje ima vsaj eno vprašanje, ki sme ostati 0: špediter brez vozil vpiše 0 praznih
kilometrov, skladiščnik tujega blaga 0 vrednosti zaloge — in izračun kljub temu ostane smiseln.

| Modul | Meri |
|---|---|
| `odprema` | Planiranje prevozov in izkoriščenost (prazni km, čakanje, razporejanje) |
| `napake` | Napačne dostave, poškodbe in reklamacije |
| `skladisce` | Skladiščne operacije in zaloga (iskanje, popisne razlike, vezan kapital) |
| `dokumentacija` | Prevozna dokumentacija in podatki (CMR, POD, prepisovanje) |
| `roki` | Zamude, stojnine in nujni prevozi |
| `diagnostika_logistika` | Štiri vprašanja o podatkih in odpornosti procesa — brez evrov, vedno vidna |
| `E` | Kot pri proizvodnji — samo obstoječim uporabnikom PANTHEON |

Meje med področji so zapisane v besedilih `help`, ker jih upošteva samo obiskovalec: čakanje na rampi je
`odprema`, iskanje v skladišču `skladisce`; reklamacija zaradi poškodbe je `napake`, obveščanje o zamudi
`roki`; stojnina, ki jo plačate vi, je strošek, tista, ki jo zaračunate, pa ni.

### Veleprodaja in distribucija — pet izključujočih se stroškovnih področij

Področja sledijo poti blaga in denarja, zato je meja med njimi **časovna in ne tematska** — to je edini
način, da si veleprodajalec ob vsakem vprašanju zna odgovoriti, ali "to sodi sem".

| Modul | Meri |
|---|---|
| `narocila_trgovina` | Naročila, ponudbe in cene (vnos, prepisovanje, izgubljena marža) |
| `skladisce_trgovina` | Skladišče in komisioniranje (iskanje, prevzemi, inventure, nadure) |
| `zaloge_trgovina` | Zaloge, nekurantnost in izpad prodaje (odpisi, izgubljena marža, vezan kapital) |
| `odprema_trgovina` | Odprema, vračila in reklamacije (ponovne dostave, dobropisi, vračila) |
| `terjatve_trgovina` | Plačilni roki in terjatve (zamude, opominjanje, odpisi) |
| `diagnostika_trgovina` | Štiri vprašanja o podatkih in odpornosti procesa — brez evrov, vedno vidna |
| `E` | Kot pri proizvodnji — samo obstoječim uporabnikom PANTHEON |

Dvoje je vredno vedeti pred urejanjem:

- **Fizično ponovno komisioniranje napačne pošiljke se namenoma ne šteje nikjer.** V `skladisce_trgovina`
  ne sodi, ker je posledica napake pri odpremi; v `odprema_trgovina` ne, ker se tam ure vrednotijo po
  administrativni postavki za pisarniško reševanje reklamacije. Podštevanje je boljše od dvojnega štetja.
- **`terjatve_trgovina` šteje samo prekoračitev NAD dogovorjenim rokom, ne celotnega DSO.** Financiranje
  roka, ki ste ga kupcu sami odobrili, je normalno poslovanje. Celoten DSO bi dal večjo številko, ki bi
  jo vsak finančnik takoj zavrnil. Letni strošek kapitala je konstanta `RECEIVABLES_CAPITAL_COST`
  (`src/config/modules/shared.ts`), ne vprašanje — omejitev na šest polj na modul je ostrejša od koristi.

### Maloprodaja — pet izključujočih se stroškovnih področij

| Modul | Meri |
|---|---|
| `zalogeMp` | Zaloge, police in odpisi |
| `marzeMp` | Nabavne cene, akcije in marža |
| `mankoMp` | Blagajna, manko in vračila |
| `prevzemMp` | Prevzem blaga, dokumenti in prenosi |
| `kanaliMp` | Spletna prodaja in usklajenost kanalov |
| `diagnostikaMp` | Štiri vprašanja o podatkih in odpornosti procesa — brez evrov, vedno vidna |

Najostrejša meja v maloprodaji je med **znano in neznano** izgubo blaga: odpisano, poteklo in prisilno
znižano blago je `zalogeMp` (vemo, kaj se je zgodilo), inventurni manko pa `mankoMp` (ne vemo). Trgovec
obe številki pozna ločeno; v enem znesku bi bila razlika izgubljena, z njo pa vsak ukrep, ki iz nje sledi.

### Storitve in projekti — pet izključujočih se stroškovnih področij

Edina dejavnost, ki poleg dveh stroškovnih ur vpraša tudi **zaračunano urno postavko**. Razlog je v naravi
izgube: proizvodnja izgublja material, storitveno podjetje pa opravljene ure, ki nikoli ne pridejo na
račun. Ta ura ni izgubljena kapaciteta, ampak izgubljen prihodek, zato se vrednoti po ceni in ne po
strošku.

| Modul | Meri |
|---|---|
| `projekti_storitve` | Plan, prioritete in zasedenost ekipe |
| `obracun_storitve` | Evidenca dela in zaračunavanje (nezaračunane ure, dobropisi) |
| `obseg_storitve` | Obseg, spremembe in dodelave |
| `administracija_storitve` | Projektna administracija in podatki |
| `terjatve_storitve` | Roki, plačila in vezan denar (vključno s kapitalom v nezaračunanem delu) |
| `diagnostika_storitve` | Štiri vprašanja o podatkih in odpornosti procesa — brez evrov, vedno vidna |
| `E` | Kot pri proizvodnji — samo obstoječim uporabnikom PANTHEON |

Najostrejša meja v tej dejavnosti je med **zaračunano in interno uro**, ker je edina, kjer isti podatek
lahko pristane v dveh koših hkrati:

- opravljena za naročnika, a ni prišla na račun → `obracun_storitve`, koš `directLoss`, po **zaračunani**
  postavki;
- interna, presežena ali administrativna → `projekti_storitve` / `obseg_storitve` /
  `administracija_storitve`, koš `capacity`, po **strošku** ure.

Nikoli oboje. Pravilo je zapisano v besedilih `help`, varuje pa ga test v
`src/config/modules/storitve.test.ts`: dvig zaračunane postavke sme premakniti natanko eno postavko v
celotni dejavnosti. Zato tudi nezaračunane ure namenoma nimajo `hoursPerMonth` — koš `directLoss` meri
denar, ne sproščene kapacitete.

### Računovodski servis — pet izključujočih se stroškovnih področij

Edina dejavnost, ki **nima koša `oneTimeCapital`**: servis ne drži zaloge in si zato ne more sprostiti
obratnega kapitala. Vsiljena postavka bi bila prazna številka, ki bi na zaslonu delovala kot prihranek.
Zato je težišče v košu `capacity` — zaloga servisa je čas ekipe, njegov material pa listina, ki jo
prinese nekdo drug.

| Modul | Meri |
|---|---|
| `zajemRs` | Zajem in vnos listin (ročni vnos, prepisovanje med programi, arhiviranje) |
| `strankeRs` | Listine strank in komunikacija (lovljenje listin, ponavljajoča se vprašanja) |
| `obracuniRs` | Obračuni, roki in konice (nadure, zunanja pomoč, globe zaradi zamude) |
| `popravkiRs` | Napake in popravki (popravljanje knjižb, kontrole, samoprijave, dobropisi) |
| `donosnostRs` | Neobračunano delo in donosnost strank |
| `diagnostikaRs` | Štiri vprašanja o podatkih in odpornosti procesa — brez evrov, vedno vidna |
| `E` | Kot pri proizvodnji — samo obstoječim uporabnikom PANTHEON |

Dve meji sta ostrejši kot drugod:

- **Zamuda proti napačni vsebini.** Globe in obresti zaradi *prepozne oddaje* so `obracuniRs`, doplačila
  in samoprijave zaradi *napačne vsebine* pa `popravkiRs`. Obe sta za obiskovalca „kazen od FURS-a", zato
  vprašanji druga drugo izrecno izključita v besedilu `help`.
- **Računovodska proti vodstveni uri.** Nista zamenljivi: referent lovi listine in popravlja knjižbe,
  vodja odgovarja strankam in podpiše obračun. Podpis pod obračun nosi odgovornost, ki je referent ne more
  prevzeti, zato ima ta ura svojo postavko. Test v `src/config/modules/racunovodstvo.test.ts` drži, katera
  postavka pripada kateremu izidu.

Za razliko od storitev se **neobračunana ura vrednoti po strošku, ne po ceniku** (koš `capacity`).
Izračun namenoma ne trdi, da bi stranka to uro plačala, če bi jo servis zaračunal; hkrati je to prav
tista ura, ki napaja naslov segmenta — „+X strank brez nove zaposlitve". Delitelj ni skrita konstanta:
povprečne ure na stranko vpraša `donosnostRs`, `segments.ts` pa hrani le rezervo za primer, ko tega
področja obiskovalec v triaži ne izbere. Da nobeno področje ne uporabi zaračunane postavke, varuje
poseben test.

### Splošno — pet področij, ki jih ima vsako podjetje

Sem pride le obiskovalec, ki je izbral „Drugo" in nato zavrnil vse štiri ponujene poslovne modele (glej
**Kategorija „drugo"** spodaj). Vprašanja zato kot edina v kalkulatorju **ne smejo predpostaviti, kaj
podjetje počne** — izmet, prazni kilometri in nezaračunane ure bi merili nekaj, česar nima.

| Modul | Meri |
|---|---|
| `podatkiSp` | Ročno delo s podatki in dokumenti (vnašanje, popravljanje, priprava poročil) |
| `usklajevanjeSp` | Iskanje informacij in usklajevanje (zastoji, iskanje, statusna vprašanja) |
| `napakeSp` | Napake in ponovno delo (popravljanje, reklamacije, izgubljena marža) |
| `denarSp` | Plačilni roki in terjatve (zamude, izterjava, odpisi) |
| `zalogeSp` | Zaloge in vezan kapital (odpisi, sprostljiv kapital) |
| `diagnostikaSp` | Štiri vprašanja o podatkih in odpornosti procesa — brez evrov, vedno vidna |
| `E` | Kot pri proizvodnji — samo obstoječim uporabnikom PANTHEON |

Kjer področje za podjetje ne velja (holding brez zalog), ga **reši triaža**: obiskovalec ga oceni z 0 in
se sploh ne vpraša. Vnaprejšnje ugibanje, katero področje je relevantno, zato ni potrebno — zato sta
privzeto obkljukani `podatkiSp` in `usklajevanjeSp`, edini dve, ki ju ima res vsako podjetje
(`triage.defaultIds`).

Cena univerzalnosti ni skrita v izračunu, ampak v **pasovih izboljšave**: ti so za ta segment ožji
(8–18 % do 20–35 % namesto 25–40 %), ker univerzalna vprašanja strošek zajamejo manj natančno.

### Kategorija „drugo"

„Drugo" v spustnem seznamu ni odgovor, ampak vrata do podvprašanja o **poslovnem modelu**
(`DRUGO_SUB_INDUSTRIES` v `src/config/industries.ts`). Razlog: gradbinec in agencija sta storitveno-
projektni podjetji, a v seznamu ne najdeta svoje *panoge* in zato izbereta „Drugo" — s tem pa izgubita
panožno prilagojen vprašalnik, ki bi jima ustrezal. Seznama panog ni mogoče dopolniti do popolnosti,
poslovnih modelov pa je malo. Štiri izbire preusmerijo v obstoječ segment, peta („nič od tega") pelje v
`splosno`.

Oznake pod-dejavnosti se v izvoznem zapisu začnejo z „Drugo — ", ker mora prodajnik videti, da se
obiskovalec ni prepoznal v nobeni panogi, tudi če je nato odgovarjal na storitvena vprašanja.

Trgovinski moduli `A_trgovina`–`D_trgovina` v `src/config/modules/legacy.ts` ostajajo, čeprav jih noben
segment ne uporablja: so edina priča migracijskega testa skladnosti v `src/lib/moduleEngine.test.ts`, ki
drži, da se matematika ob prepisu v register ni tiho spremenila.

### Koši

Vsak izid gre v natanko en koš, kar strukturno prepreči dvojno štetje:

- **`directLoss`** — denar, ki dejansko odteka
- **`capacity`** — vrednost izgubljenega časa; ni prihranek pri plačah
- **`oneTimeCapital`** — enkratno sprostljiv kapital v zalogah; se nikoli ne sešteva z letnimi zneski
- **`risk`** — kvalitativna ocena brez zneska

## Sedanji strošek proti potencialu

`compute()` vrne **dejanski sedanji strošek**. Koliko od tega je realno mogoče nasloviti, izračuna motor:

```
potencial = strošek × naslovljiv delež × pas izboljšave
```

- **naslovljiv delež** izhaja iz odgovora "Kaj je glavni vzrok?" v vsakem modulu
  (`src/config/modules/addressableShare.ts`) — vzrok v podatkih je 0,75, okvara stroja 0,15
- **pas izboljšave** visi na izbrani možnosti sistema v `src/config/contexts/<dejavnost>.ts` —
  Excel/papir 25–40 %, podjetje z ustreznim domenskim modulom 8–20 %. Ker je pas zapisan pri možnosti in
  ne v ločeni tabeli, možnosti brez pasu ni mogoče dodati

Rezultat je zato **razpon, ne obljuba**. Modul si pasu izboljšave ne more sam vračunati v znesek, ker
sedanjega sistema sploh ne pozna.

## Zanesljivost

Kdor urne postavke ne pozna, izbere razpon; vrednost tedaj ni 0, ampak sredina razpona. Rezultat dobi
oznako zanesljivosti (`src/lib/potential.ts`), pri nizki pa se zneski izpišejo kot "najmanj X EUR" namesto
navidezno natančnega zneska.

## Kje kaj urejati

| Kaj | Datoteka |
|---|---|
| Vprašanja, privzete vrednosti in formule modulov | `src/config/modules/` |
| Kateri moduli so v segmentu, prag visoke izgube | `src/config/segments.ts` |
| Dejavnost → segment (spustni seznam) | `src/config/industries.ts` |
| Naslovljivi deleži po vzroku | `src/config/modules/addressableShare.ts` |
| Kontekstna vprašanja, pasovi izboljšave, razponi urnih postavk, vidnost modula E | `src/config/contexts/` |
| Potencial in ocena zanesljivosti | `src/lib/potential.ts` |
| Razlage metodologije | `content/methodology.ts` |
| "3 ukrepi ta teden" | `content/actions/actions.ts` |

## Zaupanjska zasnova

Ves izračun teče v brskalniku. Nič poslovnih podatkov ne zapusti naprave, dokler uporabnik sam ne odda
obrazca — to je na strani tudi izrecno napisano.

## Kaj se prenese ob oddaji obrazca

Datalab (še) nima znanega CRM API-ja, zato oddaja obrazca **ne kliče strežnika**. Nastanejo tri datoteke:

| Datoteka | Za koga | Kaj vsebuje |
|---|---|---|
| `datalab-analiza-skritih-stroskov-<podjetje>-<datum>.pdf` | stranka | `src/lib/pdf.ts` — hero zneski, graf, razčlenitev, tveganja, 3 ukrepi |
| `datalab-prodajna-priprava-<podjetje>-<datum>.pdf` | svetovalec | `src/lib/pdfSales.ts` |
| `datalab-prodajna-priprava-<podjetje>-<datum>.html` | svetovalec | `src/lib/salesReportHtml.ts` — ista vsebina za branje na telefonu |

**Vse tri se prenesejo samodejno, a ZAPOREDNO in z razmikom ~1,2 s** (`downloadSequentially` v
`src/lib/download.ts`). Brskalnik iz ene geste zanesljivo dovoli en prenos; naslednje bodisi pogojuje
z dovoljenjem ("Prenesti več datotek?") bodisi jih tiho zavrže. Trije klici v isti niti so zato
loterija — in v praksi je izpadlo prav strankino poročilo.

Dve pravili, ki ju ni dovoljeno razveljaviti:

- **Strankina datoteka je vedno prva v vrsti** in se sestavi izven `try/catch`. Prvi prenos je edini
  zajamčen, napaka v prodajnem delu pa je ne sme odnesti s seboj.
- **Generatorji dokumenta ne prenašajo — vrnejo `DownloadFile`.** Dokler je vsak klical
  `doc.save()`, je dokument prenašal sam sebe po poti jsPDF, ki je ni mogoče ne zakasniti ne uvrstiti
  v vrsto. Zdaj vodi do prenosa ena sama pot, ki tudi `URL.revokeObjectURL` pokliče **zakasnjeno**:
  takojšen preklic je vir podatkov odstranil, preden ga je brskalnik prebral, in prenos je odpovedal.

Gumba "Povzetek v PDF" in "Povzetek v HTML" na zahvalnem zaslonu ostaneta kot rezerva, če bi kdo
dovoljenje za več datotek zavrnil.

### Priprava na pogovor

Vsebino sestavi **`buildSalesReport()`** (`src/lib/salesReport.ts`) — čista funkcija brez UI in brez
dostopa do datuma (časovni žig je parameter), zato je testljiva v okolju `node` in neodvisna od tega,
kako se poročilo dostavi. Prehod na webhook je zato zamenjava zadnjega koraka, ne ponovno pisanje.

Razdelki: kdo je stranka · kaj je izračun pokazal · **kje so številke trdne in kje ne** · kaj stranko
tišči (triaža **vseh** področij, tudi neizmerjenih) · po področjih z vsemi odgovori · tveganja · 3 ukrepi.

Dvoje je vgrajeno namenoma:

- **Datoteka pristane pri stranki**, zato v njej ni ničesar, česar ji svetovalec ne bi mogel povedati v
  obraz — nobenega točkovanja leada, nobenih scenarijev. Vsebina so dejstva: kaj je odgovorila, katere
  številke so trdne, kaj se splača preveriti.
- **Razlikovanje med "vneseno", "izbran razpon" in "ni odgovora".** `CostAssumption` hrani le
  `{ valueEUR, estimated }` in nedotaknjenega polja od izbire ne loči, pri nekaterih dejavnostih pa se
  privzetek slučajno ujema s sredino razpona (veleprodaja: 24 EUR je oboje). `costBandLabel()` zato
  vrednosti, enake privzetku, ne prizna za izbiro — raje priznamo manj podatka, kot da bi si ga izmislili.

Preslikavo shranjenega id-ja nazaj v slovensko oznako (`pantheonWms` → „PANTHEON s skladiščnim modulom
in lokacijami") dela `src/lib/answerLabels.ts`; pred tem je ni bilo nikjer, ker odgovorov nismo nikoli
prikazali nazaj.

### Izvoz za CRM

`src/lib/exportRecord.ts` (`LeadExportRecord`, CSV + JSON) je pripravljen, a **še ni ožičen** — funkcija
`buildLeadExportRecord` ni napisana in datoteke se ne prenašajo. Glava CSV je namenoma fiksna in enaka
za vse segmente; novi stolpci se dodajajo **na konec**, ker je vsaka obstoječa preslikava pozicijska.

Follow-up sekvence se **ne pošiljajo** — `selectFollowUpSequence()` samo izračuna, v katero sekvenco
zapis sodi, da je logika pripravljena, ko bo integracija na voljo.

## Odprta vprašanja pred objavo

1. Kateri CRM in ali ima API/webhook za lead s custom polji.
2. Kdo interno potrdi naslovljive deleže in pasove izboljšave — bodo javno vidne.
3. Domena: samostojna landing stran ali podstran datalab.si.
4. Strokovna potrditev besedil "3 ukrepov".
5. Ponudba "15-min pregled s svetovalcem" — kdo izvaja in kakšna je kapaciteta.

**Kalibracija:** naslovljivi deleži, pasovi izboljšave in prag visoke izgube v `segments.ts` so **začetne
ocene**, ne empirija. Po prvih ~50 vnosih jih je treba preveriti na realnih podatkih.

## Namerno izven obsega (faza 2)

Benchmark proti vrstnikom (potrebna pravna presoja), prava CRM/e-mail integracija, lokalizacija HR/RS/BA.
