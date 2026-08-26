# Optimizacija client reporta: najvišje še branljive številke

Namen: **dvigniti zneske, ki jih strankino poročilo prikaže, na najvišjo raven, ki jo je še
mogoče braniti pred skeptičnim direktorjem ali CFO** — ker mora poročilo upravičiti projekt,
ki veliko stane. Stanje kode: avgust 2026, veja `main`.

Ključna ugotovitev pregleda: kalkulator je zgrajen tako, da **vsaka dvoumnost pade navzdol**
("smer napake je vedno navzdol" — `src/lib/potential.ts:216`). To je pravilna strategija za
zaupanje, a pomeni, da prikazana številka ni sredina realnega razpona, ampak **spodnja meja
spodnje meje**. Med "spodnjo mejo" in "izmišljeno številko" je širok pas, ki je danes
neizkoriščen. Optimizacija torej ni napihovanje — je **premik koeficientov s spodnjega roba
branljivega razpona na njegovo sredino** in **prikaz denarja, ki danes tiho izpade na 0**.

Vsa mehka mesta v kodi so že označena s `KALIBRACIJA: začetne ocene, ne empirija` — ta
dokument je odgovor na ta opozorila.

---

## 1. Povzetek za vodstvo

**Najprej napaka, ki jo je treba popraviti pred vsem drugim:** strankin PDF kot glavno
številko prikaže samo koš neposredne izgube (`pdf.ts:293`), zaslon pa vsoto treh košev. V
zglednem primeru uprava v PDF-ju vidi 17.000 EUR namesto 71.452 EUR — dokument, ki naj
upraviči projekt, danes vodi s 24 % dejansko izmerjene številke (poglavje 4.5).

Nato tri vrste potez, razvrščene po (učinek × branljivost) / trud:

| Nivo | Kaj | Učinek na prikazano | Trud | Tveganje |
|---|---|---|---|---|
| **1 — prikaz** | 3-letni pogled, cena odlašanja, tabela povračila investicije, dnevni ekvivalent, kvantificirana "spodnja meja" | sidro ×3 brez spremembe izračuna | dnevi | zanemarljivo |
| **2 — koeficienti** | glavni vzrok brez privzetka; naslovljivi delež "Ne vemo" 0,30 → 0,45–0,50; strošek kapitala 6 % → 8 %; sprostljiva zaloga "Ne vem" 0,05 → 0,10; urne postavke na izmerjeno pot B | potencial pasivnega obiskovalca +50–80 %, kapaciteta +5 %, kapitalske postavke +33–100 % | ~teden + zapisniki virov | nizko, če je vsak premik zapisan v docs/ |
| **3 — novi podatki** | prihodek iz števila zaposlenih, maloprodajni pasovi izgubljene prodaje, ocenjeni razponi za neizmerjena področja, triaža 3 → 4 področja | hero +20–50 % (danes nevidne postavke) | tedni, A/B | srednje — vsaka ocena mora biti označena kot ocena |

**Česa ne delati** (poglavje 8): privzetki > 0 na količinskih poljih, vrnitev dvojnega
množitelja, režijski pribitek na ure, enkratni kapital v letni vsoti, skrivanje pokritosti.
Vsaka od teh potez da višjo številko danes in izgubljen posel na prvem sestanku s CFO.

Pričakovan skupni učinek na tipičen pasiven vnos (proizvodnja, 3 področja, vzroki "Ne
vemo"): **prva številka PDF-ja s 17.000 na 71.452 EUR (odprava napake), s 3-letnim
pogledom sidro ~214.000 EUR; potencial z 21.400 na ~35.700 EUR/leto (+67 %)**, plus tabela
povračila, ki investicijo 100.000 EUR prikaže kot povrnjeno v ~2,8 leta — vse s številkami,
ki jih je mogoče braniti vrstico za vrstico.

---

## 2. Kje danes številka nastane in kje vse se pristriže

Pot zneska (podrobno v [POROCILO-client-report-formule.md](../metodologija/POROCILO-client-report-formule.md)):

```
vnosi → moduli → koši (izguba + marža + kapaciteta = HERO) → × naslovljiv delež = POTENCIAL
```

Vsaka postavka gre skozi vrsto tihih dušilcev. Popis vseh (⬇ = sistematično znižuje):

| # | Dušilec | Kje v kodi | Mehanizem |
|---|---|---|---|
| ⬇0 | **PDF vodi z najmanjšim košem, ne s skupno vsoto** — potrjena napaka | `src/lib/pdf.ts:284` (naslov) in `:293` (znesek: `totals.directLossEUR`) | zaslon kot hero pokaže vsoto treh košev (`ResultsView.tsx:76`), PDF — dokument, ki roma do uprave — pa kot veliko številko samo neposredno izgubo; v zglednem primeru 17.000 namesto 71.452 EUR. Formule-POROCILO (poglavje 2) dokumentira namero, da sta enaka |
| ⬇1 | **Pokritost: merijo se samo 3 področja od 9–11** | `src/config/segments.ts:85` (`recommendedCount: 3`) | neizmerjeno področje = 0 EUR; obiskovalec s 5 bolečimi področji pokaže ~60 % svoje izgube |
| ⬇2 | **Samo letni horizont** | `ResultsView.tsx:76`, `pdf.ts` | ERP business case je 3–5-leten; poročilo sidra nikoli ne pomnoži |
| ⬇3 | **Naslovljiv delež "Ne vemo" = 0,30 in je privzet** | `addressableShare.ts:43` in `:77` (`default: all.length - 1`) | kdor vprašanja o vzroku ne premisli, dobi skoraj najnižji koeficient; realni odgovori nosijo 0,45–0,75 |
| ⬇4 | **Urne postavke: sredina formule (pot A) in meritve (pot B), čeprav je A dokazano ~12 % prenizka** | `docs/urne-postavke.md` (razdelek "Izmerjeni strošek dela"), privzetki v `src/config/contexts/*.ts` | lastna raziskava ugotavlja, da so vsi trije členi poti A vzeti po zakonskih minimumih — in nato vseeno povpreči navzdol |
| ⬇5 | **Ura brez režije** | `docs/urne-postavke.md` ("Kaj postavka pomeni") | zavestna odločitev; ostane, a se nikjer ne pove kot razlog, da je znesek spodnja meja |
| ⬇6 | **Strošek kapitala 6 %** | `shared.ts:27`, `fallback: 0.06` v treh kontekstih | pod WACC MSP; lastni pasovi vprašanja segajo do 18 % (`contexts/maloprodaja.ts:161`) |
| ⬇7 | **Sprostljiva zaloga: "Ne vem" → 0,05** | `shared.ts:120` (`REDUCIBLE_SHARES`) | benchmark znižanj zalog ob uvedbi ERP/MRP je 10–30 % (docs/erp-koristi) |
| ⬇8 | **Prihodek brez odgovora = 0 → postavke na prihodku tiho izpadejo** | `contexts/*.ts` (`fallback: 0`), `potential.ts:77` | pri maloprodaji izpade prav največja postavka (prazne police); hkrati zanesljivost pade na "nizko" |
| ⬇9 | **Maloprodaja: delež izgubljene prodaje privzeto 0, pomoč svetuje "pustite 0", drsnik omejen na 3 %** | `modules/maloprodaja.ts:109–121` | najmočnejša panožna postavka je za pasivnega obiskovalca vedno 0 |
| ⬇10 | **"Ne vem" na EUR poljih → 0** | `moduleEngine.ts:96` (`withoutUnknowns`) | pošteno, a brez ponujene panožne ocene je "Ne vem" enako "ni stroška" |
| ⬇11 | **Neizmerjena področja so naštet seznam brez številk** | `ResultsView.tsx:218`, `pdf.ts` (`drawUnmeasuredSection`) | "dejanski strošek je višji" ostane trditev brez zneska |
| — | Nezaslužena marža v splošnem segmentu pristane v košu neposredne izgube | `modules/splosno.ts:341` | kozmetična nedoslednost, vsota ista — popraviti mimogrede |

Dušilca ⬇5 in delno ⬇10 sta zavestni ogradi, ki ju kaže obdržati — a **unovčiti** (poglavje 4.4):
konservativnost, ki je stranka ne vidi, ne prepriča nikogar.

---

## 3. Načelo: najvišja še branljiva vrednost

Vsaka sprememba mora prestati tri teste, ki jih bo izvedel CFO na sestanku:

1. **Test vira.** Za vsako številko, ki ni strankin vnos, mora obstajati zapisan zunanji vir
   (vzorec že obstaja: `docs/urne-postavke.md`, `docs/prispevne-marze-raziskava-2026-08.md`).
   Koeficient brez vira je v kodi označen s KALIBRACIJA — po tej prenovi takih ne sme biti več.
2. **Test praznega obrazca.** Prazen obrazec mora še vedno pokazati 0 EUR. To je največje
   premoženje kalkulatorja (prodajni ugovor `inflatedNumber` v `content/sales/objections.ts`
   stoji izključno na tem). Višje številke gradimo na *označenih ocenah, ki jih obiskovalec
   sprejme s klikom* — vzorec "Vzemi povprečje panoge" že obstaja pri urnih postavkah.
3. **Test enega množitelja.** Odprava dvojnega diskonta (commit `88bca93`) je pokazala, da
   dva koeficienta za isto stvar uničita rezultat. Simetrično velja navzgor: noben nov
   množitelj brez nove informacije. Višji prikaz dosežemo s *horizontom, pokritostjo in
   kalibracijo obstoječih koeficientov*, ne z novimi faktorji.

---

## 4. Nivo 1 — prikaz: sidro ×3 brez dotika izračuna

Najhitrejši in najvarnejši sveženj: izračun ostane do evra enak, spremeni se, **kaj poročilo
z njim pove**. Vse spodnje je standard poslovnih business case-ov, ne trik.

### 4.1 Tri leta, ne eno leto

ERP projekt se odloča na 3–5-letnem horizontu; poročilo, ki pokaže samo letni znesek, samo
sebi prepolovi sidro. Dodati na zaslon rezultatov in v PDF (pod hero, ločena vrstica):

> **V treh letih: 214.000 EUR** — ob nespremenjenem načinu dela in ničelni rasti.
> K temu enkratno še 25.000 EUR vezanega obratnega kapitala.

- Formula: `3 × hero` (in `3 × potencial` na kartici potenciala). Brez rasti, brez
  inflacije, brez diskontiranja — vsaka od teh predpostavk bi bila napadljiva, gola
  multiplikacija ni (in je celo konservativna: plače rastejo ~4–5 % letno, torej kapacitetne
  postavke z njimi).
- Enkratni kapital se navede *ob* trojnem znesku, nikoli sešteto z njim — pravilo enega koša
  ostane (`moduleEngine.ts:127`).
- Umestitev: `ResultsView.tsx` pod `heroNote`, `pdf.ts` v `drawHeroSection`.

### 4.2 Cena odlašanja

Prodajni playbook jo že govori (`objections.ts`, `noTimeToImplement`: "vsak mesec odlašanja
je dvanajstina prikazanega zneska") — poročilo pa je ne pokaže. Ena vrstica ob hero znesku:

> To je **283 EUR vsak delovni dan**. Vsak mesec brez odločitve stane ~5.950 EUR.

Formuli: `hero / 252` in `hero / 12`. Dnevni ekvivalent je najmočnejše sidro za direktorja,
ker ga zna preveriti na pamet.

### 4.3 Tabela povračila investicije — most do "dragega projekta"

Danes poročilo potencial izračuna in ga pusti viseti — nikjer ga ne primerja z nobeno
investicijo, zato primerjavo naredi stranka sama, s prvo številko ponudbe. Dodati v PDF
(za razdelkom potenciala) nevtralno tabelo **brez cen PANTHEON** (skladno z ogrado v
`content/sales/licences.ts`: cen v poročilu ni in jih ne sme biti):

> Pri vašem ocenjenem naslovljivem potencialu **53.600 EUR/leto** se investicija povrne:
>
> | Investicija | Povračilo |
> |---|---|
> | 30.000 EUR | ~7 mesecev |
> | 60.000 EUR | ~13 mesecev |
> | 120.000 EUR | ~27 mesecev |
>
> Za primerjavo: tipična doba povračila ERP projektov v raziskavah je 1,5–3 leta
> (Panorama Consulting, ERP Report 2013/2015 — glej docs/erp-koristi-benchmarki-2026-08.md,
> razdelek A6). Povračilo pod tem razponom pomeni nadpovprečen projekt.

- Formula: `investicija / potencial × 12` mesecev. Stopnje izbrati tako, da pokrijejo realen
  razred PANTHEON projektov, ne da bi ga imenovale.
- Učinek: "drag projekt" dobi kontekst, v katerem je 100.000+ EUR videti *kratko*, dokler je
  potencial dovolj visok — kar je natanko naloga nivojev 2 in 3.
- Prikazati samo, kadar potencial > ~10.000 EUR/leto, sicer tabela deluje proti nam.

### 4.4 Kvantificirana "spodnja meja" — konservativnost unovčiti

Vse ograde, ki znesek držijo nizko, so danes razpršene po opombah. Zbrati jih v en okvir
**"Česa ta znesek NE vsebuje"** (zaslon + PDF, tik pod hero):

> V znesku ni: režije na sproščene ure (najemnina, vodenje, amortizacija tečejo naprej),
> rasti podjetja, rasti plač (~4–5 % letno), 7 neizmerjenih področij in vsega, kar ste
> označili z "Ne vem". **Dejanski strošek je višji od prikazanega.**

To je isti argument, ki ga prodajnik že uporablja pri ugovoru "številka je pretirana" —
prestavljen iz obrambe v napoved. Psihološko obrne breme: namesto da stranka napada število
navzdol, ga sama začne popravljati navzgor.

### 4.5 PDF vodi z najmanjšo številko — potrjena napaka, popravek pred vsem drugim

`drawHeroSection` (`pdf.ts:284–298`) kot veliko številko dokumenta izriše
`totals.directLossEUR` z naslovom "NEPOSREDNI LETNI STROŠKI" — samo prvi koš. Zaslon kot
hero pokaže vsoto treh košev, "Skupaj na leto" (`ResultsView.tsx:76`), in
[POROCILO-client-report-formule.md](../metodologija/POROCILO-client-report-formule.md)
(poglavje 2) izrecno dokumentira, da PDF prikazuje isti hero. V zglednem primeru iz
poglavja 10: obiskovalec na zaslonu vidi **71.452 EUR**, uprava v PDF-ju pa kot glavno
številko **17.000 EUR** — marža (20.000) in kapaciteta (34.452) sta pomanjšani v stranski
kartici. PDF je natanko tisti artefakt, ki mora upravičiti drag projekt, in danes nosi
24 % zaslonske številke.

Popravek: hero blok v PDF prikaže `directLoss + lostMargin + capacity` z naslovom
"Skupaj na leto" in `heroNote` z zaslona (sestava vsote), neposredna izguba pa se pridruži
stranskim karticam. Skladno z obstoječim vzorcem `heroRange` na zaslonu
(`ResultsView.tsx:77–84`) tudi razpon sešteje tri koše. To je poteza z največjim
razmerjem učinek/trud v celotnem dokumentu: **+320 % na prvi številki dokumenta** v
zglednem primeru, ničelno metodološko tveganje, ker zaslon to številko že prikazuje.

### 4.6 Drobno

- `splosno.ts:341`: "Izgubljena prispevna marža" v koš `lostMargin` kot povsod drugod —
  odpravi edino nedoslednost, ki bi jo natančen bralec lahko uporabil proti metodologiji.

---

## 5. Nivo 2 — koeficienti: s spodnjega roba na sredino branljivega

Vsak koeficient tu dobi svoj zapisnik v `docs/` po vzorcu urnih postavk (kaj smo primerjali,
kaj se ni ujemalo, zakaj se je premaknil). Brez zapisnika se koeficient ne premakne — to je
pogoj, da spremembe preživijo naslednji pregled.

### 5.1 Glavni vzrok: odvzeti privzetek "Ne vemo" (največji učinek na potencial)

`addressableShare.ts:77` nastavi `default` na zadnjo možnost — "Ne vemo" (0,30). Vprašanje
je radio z že izbranim odgovorom, torej ga pasivni obiskovalec nikoli ne premisli, potencial
pa pade na 40 % tistega, kar bi pokazal odgovor "podatki" (0,75).

Sprememba: **brez prednastavljene izbire**; korak zahteva odgovor (možnost "Ne vemo"
ostane, a jo je treba izbrati). Realni odgovori se gibljejo 0,45–0,75, torej se povprečni
naslovljivi delež aktivnega odgovora (~0,6) skoraj podvoji proti današnjemu privzetku.

To je najčistejša poteza celotnega dokumenta: številko dvigne **strankin lasten odgovor**,
ne naša ocena — in prav na ta odgovor se sklicuje besedilo kartice potenciala
("po glavnih vzrokih, ki ste jih navedli", `copyTypes.ts:341`).

### 5.2 Naslovljivi deleži: kalibracija navzgor z viri

`ADDRESSABLE_SHARE` (`addressableShare.ts:43`) je edini koeficient nad zneskom — vsaka
stotinka gre naravnost v prikazani potencial. Predlagane vrednosti (utemeljitve in viri v
`docs/erp-koristi-benchmarki-2026-08.md`):

| Kategorija | Zdaj | Predlog | Utemeljitev (viri: docs/erp-koristi-benchmarki, razdelki A3–A5, C) |
|---|---:|---:|---|
| `data` | 0,75 | **0,80** | izmerjena odpravljivost ročne obdelave dokumentov je 60–88 % (Billentis: −60–80 % stroška procesa; Politecnico di Milano: −88 % časa na e-račun). 0,80 je zgornji rob dokazanega — najagresivnejši predlog dokumenta in prvi za umik, če ga kdo izpodbija |
| `planning` | 0,65 | **0,70** | Gruen & Corsten: 72 % vzrokov praznih polic nastane pri naročanju/napovedovanju/policah, torej v dometu sistema; Aberdeen: +17 % skladnost s planom, +17 % pravočasne dobave |
| `people` | 0,45 | **0,50** | obvezna polja, vodeni postopki in opozorila del "kadrovskih" napak strukturno preprečijo; Panorama: 87 % podjetij realizira produktivnostno korist. Edini predlog brez neposredne meritve — v komentarju označiti kot presojo |
| `external` | 0,25 | **0,30** | Gruen & Corsten: upstream (dobavitelji) povzroči le 28 % praznih polic — "zunanji" problem je večinoma notranji; zgodnejši signal in varnostne zaloge naslovijo del ostanka |
| `physical` | 0,15 | 0,15 | za izmet/okvare obstajajo samo vendorske študije (docs, A4) — brez neodvisnega vira se ne dviga; prav ta nedvignjeni delež je dokaz discipline celotne lestvice |
| `unknown` | 0,30 | **0,45–0,50** | glej spodaj |

"Ne vemo" na 0,45–0,50: privzetek, ki je bistveno pod povprečjem dejanskih odgovorov
(~0,6), sistematično kaznuje ravno neodgovor, ki naj bi bil nevtralen. Nevtralno je
**tehtano povprečje kategorij po dejanski porazdelitvi odgovorov** — do prvih ~50 vnosov
zastaviti 0,45 (sredina med `people` in `planning`), potem umeriti na izmerjeni mix
(poglavje 9). Zunanja opora obstaja neodvisno od mixa: sinteza benchmarkov (docs, razdelek
A) je, da ERP naslovi 50–70 % ročnega transakcijskega dela in napak — "pred CFO
zagovarjaj ~50 %". Skupaj s 5.1 to pomeni: aktivni odgovor ~0,6+, neodgovor 0,45–0,50 —
oba nad današnjim 0,30, oba branljiva.

### 5.3 Strošek kapitala: 6 % → 8 %

`shared.ts:27` in `fallback: 0.06` (`contexts/maloprodaja.ts:167`, `trgovina.ts:161`,
`splosno.ts:165`). 6 % je blizu obrestne mere posojila, ne stroška kapitala podjetja.
Preverba (docs/erp-koristi-benchmarki, razdelek B): posojilna spodnja meja slovenskega MSP
je ~4,0–4,5 % (ECB MIR: mala posojila 3,91 %, jun. 2026), a konvencija za obratni kapital
v business case izračunih je **WACC** — KPMG Cost of Capital Study 2025 meri povprečje
8,5 %, evropska MSP z velikostno premijo 10–14 %, faktoring (dejanska tržna cena denarja v
terjatvah) efektivno 6–12 %, SAFE pa kaže zaostrovanje pogojev (neto +43 % MSP poroča
višje obresti, Q2 2026).

Predlog: **8 %** — brani se s KPMG 8,5 % (ki velikostne premije še ne vsebuje), ostane pod
sredino tretjega pasu lastne lestvice (10 %, `contexts/maloprodaja.ts:164`) in pod pragom
~9–10 %, nad katerim bi CFO upravičeno ugovarjal. Učinek: postavke financiranja zalog in
zamud pri plačilih **+33 %**. V pojasnilo polja dodati: "oportunitetni strošek = strošek
kapitala podjetja (WACC), ne obrestna mera posojila".

### 5.4 Sprostljiva zaloga: "Ne vem" 0,05 → 0,10; "Več kot 20 %" 0,22 → 0,25

`shared.ts:120` (`REDUCIBLE_SHARES = [0.05, 0.08, 0.15, 0.22, 0.05]`). Dva popravka:

- **"Ne vem" → 0,10**: Aberdeen (anketa 1.680 podjetij) meri povprečno znižanje stroškov
  zalog ob ERP **17,2 %** (razpon po ponudnikih 13,4–25 %); konservativno sidro pred CFO
  je 10–15 % (docs/erp-koristi-benchmarki, A1). Današnjih 0,05 pomeni, da neodgovor
  obljubi *pol manj od spodnjega roba konservativnega benchmarka* — to ni konservativnost,
  to je absurd, ki ga zna izkoristiti konkurenčen ponudnik z višjo številko.
- **"Več kot 20 %" → 0,25**: stranka je sama rekla "več kot 20", mi računamo z 22 — sredina
  odprtega razpona je kvečjemu 25.

Odprto vprašanje kalibracije iz komentarja v kodi (sklic A18, ki ga ni bilo mogoče preveriti)
s tem dobi odgovor: namesto rekonstrukcije stare predpostavke se pasovi privežejo na
zunanji benchmark, ki je zapisan in preverljiv.

### 5.5 Urne postavke: sidro na izmerjeno pot B

`docs/urne-postavke.md` sam ugotavlja: formula (pot A) je proti meritvi iz nacionalnih
računov (pot B) **12,4 % prenizka**, ker so vsi trije členi vzeti po zakonskih minimumih —
in nato privzetke vseeno postavi na *sredino* obeh poti. Sredina med "dokazano prenizko" in
"izmerjeno" ni nevtralna — je za polovico napake prenizka.

Predlog: privzetki in sredine pasov se sidrajo na **pot B** (izmerjeni strošek dela,
Eurostat `nama_10_a10`: 27,05 EUR/h za 2025, ~28,2 za 2026), skalirano z razmerjem plače
poklica do povprečja — pot A ostane kontrola od spodaj. Učinek: privzetki +5–6 %
(proizvodna operativna 21 → 22, administrativna 26 → 27–28), enako sredine pasov; vse
kapacitetne postavke zrastejo sorazmerno. Obramba je udobna: "to je izmerjeni strošek dela
iz nacionalnih računov, ne naša ocena" — močnejša od današnje.

Česa ne: režijskega pribitka (glej 8.3). Ločnica "strošek dela, brez režije" ostane —
unovči se v okvirju 4.4.

---

## 6. Nivo 3 — novi podatki: denar, ki je danes neviden

### 6.1 Prihodek iz števila zaposlenih (odpravi dušilec ⬇8)

Število zaposlenih se vpraša v 2. koraku in ne vstopa v nobeno formulo. Hkrati prihodek brez
odgovora pomeni, da postavke na prihodku tiho izpadejo in zanesljivost pade na "nizko"
(`potential.ts:238`). SURS tabeli `1450404S`/`1450632S` — isti vir, ki ga že uporablja
raziskava marž — dajeta **prihodek na zaposlenega po dejavnosti in velikostnem razredu**.

Predlog: ob praznem prihodku korak ponudi gumb po obstoječem vzorcu "Vzemi povprečje
panoge": *"Ocena iz velikosti podjetja: 45 zaposlenih v proizvodnji ≈ 8–12 mio EUR"* —
označeno kot ocena (`source: industryAverage`), teče kot razpon, zanesljivost pade enako
kot pri urni postavki. Načelo "prihodka si ne izmišljamo" ostane nedotaknjeno: obiskovalec
oceno **sprejme s klikom**, formula in vir sta zapisana.

### 6.2 Maloprodaja: izgubljena prodaja — odpraviti tihi dvojni diskont in ničlo (dušilec ⬇9)

`modules/maloprodaja.ts:109–121`: največja postavka panoge ima privzetek 0, pomoč izrecno
svetuje "pustite 0", drsnik je omejen na 3 % — in **formula vsebuje še en dvojni diskont**
iste vrste, kot ga je pri potencialu odpravil commit `88bca93`:

- Vprašanje se glasi "Kolikšen delež letne prodaje … **izgubite**" — "izgubite" je že neto
  formulacija (kar je odšlo, ne kar je bilo ogroženo).
- Formula (`maloprodaja.ts:170–174`) ta vnos nato pomnoži **še** z (1 − substitucija) —
  torej isti odbitek substitucije drugič, če je obiskovalec vprašanje razumel dobesedno.
- Benchmark (Gruen & Corsten, 72.000 kupcev; docs/erp-koristi-benchmarki, A5): trgovec ob
  praznih policah **neto** izgubi ~4 % letnega prometa. Današnji vnos pa zmore največ
  3 % × 0,55 = **1,65 % neto** — strop je pod izmerjenim povprečjem panoge.

Predlog (ohrani substitucijo kot točko zaupanja — komentar v kodi pravilno ugotavlja, da
je prav precenjen stockout najpogostejša napaka kalkulatorjev):

1. Vprašanje preformulirati v **bruto** povpraševanje: "Kolikšen del povpraševanja zadene
   ob artikel, ki ga ni na zalogi?" s pasovi namesto drsnika: "Do 2 %" / "2–5 %" /
   "5–10 %" / **"Vzemi povprečje panoge (~8 % artiklov ni na voljo)"** / "Ne vem" (0,
   privzeto). Privzetek ostane ničla — test praznega obrazca (poglavje 3) velja tudi tu;
   povprečje panoge je zavestna izbira z enim klikom, po vzorcu urnih postavk, in teče kot
   označena ocena z razponom. Substitucija ostane in svoj del odšteje enkrat, upravičeno.
2. "Ne vem" na substituciji: 0,45 → **0,50** zadržanega (študija izmeri 45–60 %
   zadržanega: 45 % substituira + 15 % odloži in se vrne).
3. Rezultat za obiskovalca, ki sprejme povprečje panoge: ~8 % × 0,50 = **~4 % neto** —
   natanko izmerjeno povprečje panoge, torej najvišja branljiva vrednost. Za trgovca z
   2 mio EUR prometa in 31 % maržo to pomeni **~24.800 EUR/leto** na postavki, ki je ob
   nasvetu "pustite 0" danes skoraj vedno 0. Pomoč se obrne: namesto "pustite 0" →
   "povprečje panoge je izmerjeno; svojo številko vpišite, če jo imate".

### 6.3 Neizmerjena področja: označen ocenjen razpon (dušilec ⬇1 + ⬇11)

Razdelka "Česa nismo izmerili" ne spreminjati v izračun — ampak področjem, ki jih je
obiskovalec v triaži sam ocenil z 2–3 ("vsak teden" / "vsak dan"), dodati **označen
benchmark razpon** namesto praznine:

> Roki in nujni stroški — vaša ocena: "vsak dan". Podjetja vaše velikosti v tem področju
> tipično izgubljajo **8.000–15.000 EUR letno** (ocena panoge, ne vaša številka —
> izmerite z gumbom spodaj).

Razponi se izpeljejo iz porazdelitve dejanskih vnosov drugih obiskovalcev istega segmenta
in velikostnega razreda (podatki se že izvažajo — `exportRecord.ts`), do takrat iz
benchmark virov. V hero ne vstopajo nikoli; PDF jih prikaže v razdelku neizmerjenega z
enako oznako. Učinek: "celotna slika" v glavi bralca zraste s 3 izmerjenih področij na
vseh 10, ne da bi se ena sama številka zlagala.

Opcijsko (A/B): pod hero dodati vsoto "izmerjeno + ocenjeno za neizmerjena boleča
področja" kot drugo, jasno označeno vrstico. Konzervativna izvedba: prikaži samo, kadar
sta vsaj 2 področji z oceno ≥ 2 neizmerjeni.

### 6.4 Triaža: 3 → 4 področja (A/B)

`segments.ts` (`recommendedCount: 3` povsod). Vsako dodatno izmerjeno področje doda
~25–35 % hero zneska. Cena je daljši vprašalnik — zato A/B: če drop-off na koraku vnosa
zraste za manj kot ~10 %, je zamenjava dobičkonosna. Alternativa brez A/B: po zadnjem
področju vmesni zaslon "Želite izmeriti še [področje z naslednjo najvišjo oceno]?
(+2 minuti)" — obiskovalec, ki je prišel do konca, pogosto hoče večjo številko sam.

### 6.5 Benchmark enokliki za velika EUR polja (dušilec ⬇10)

Za polja z `allowUnknown` in velikim dometom (ekspresne dobave, penali, odpisi zalog)
ponuditi tretjo pot po vzorcu urnih postavk: "Ne vem — vzemi oceno panoge (X EUR za
podjetje vaše velikosti)". Samo tam, kjer vir obstaja; sicer polje ostane kot je.
Prioriteta: postavke, ki v porazdelitvi dejanskih vnosov nosijo največ denarja.

---

## 7. Zunanja sidra

Zbrana, primarno preverjena in ovrednotena v ločeni raziskavi:
[docs/erp-koristi-benchmarki-2026-08.md](../../docs/erp-koristi-benchmarki-2026-08.md)
(25. 8. 2026). Najtrdnejša sidra, na katerih stojijo poglavja 5 in 6:

| Sidro | Vrednost | Vir (primarno preverjen) | Nosi |
|---|---|---|---|
| Znižanje stroškov zalog ob ERP | povpr. **17,2 %** (13,4–25 %) | Aberdeen Group 2007, 1.680 podjetij | 5.4 (sprostljiva zaloga) |
| Znižanje administrativnih / operativnih stroškov | povpr. **13,3 % / 13,1 %** | Aberdeen 2007 | 6.3 (teaser), naslovljivi deleži |
| Odpravljivost ročne obdelave dokumentov | **60–88 %** | Billentis; Politecnico di Milano; Ardent Partners (~10 USD/račun ročno) | 5.2 (`data` 0,80) |
| Prazne police: neto izguba trgovca | **~4 % prometa**; 72 % vzrokov na ravni naročanja; −40 % OOS dosegljivo | Gruen & Corsten 2007/08, 72.000 kupcev | 6.2, 5.2 (`planning`, `external`) |
| Strošek držanja zalog | **15–30 %**, sidro ~20 % letno | APICS/ASCM; CSCMP State of Logistics | kontekst za 5.3/5.4 |
| WACC podjetij | povpr. **8,5 %**; evropska MSP 10–14 % | KPMG Cost of Capital Study 2025; Damodaran + Argos | 5.3 (kapital 8 %) |
| Posojila MSP (spodnja meja) | **3,9–4,5 %**, trend navzgor; SAFE: zaostrovanje | ECB MIR jun. 2026; Banka Slovenije dec. 2025; ECB SAFE 2026 | 5.3 |
| Payback ERP projekta | tipično **1,5–3 leta**; 83 % doseže ROI pričakovanja | Panorama ERP Report 2013/2015/2023 | 4.3 (tabela povračila) |
| Realizacija koristi | produktivnost 87 %, zaloge ~60 % podjetij | Panorama 2026 (str. 21) | okvir pričakovanj |

**Kje virov NI** (in zato ne dvigamo): izmet/scrap (samo vendorske študije), neposreden
učinek ERP na DSO (samo vendorsko naročena raziskava), Panoramin zgodovinski "11 %
znižanja operativnih stroškov" (v poročilih 2024/2026 nepotrjen — uporabljati Aberdeen
13 %). Točno to razlikovanje je obramba celotnega dokumenta: ker za tri stvari izrecno
priznamo, da vira ni, so vse ostale številke verodostojnejše.

---

## 8. Rdeče črte: višje številke, ki bi nas stale posla

1. **Privzetek > 0 na katerem koli količinskem polju.** Prazen obrazec mora pokazati 0.
   Kalkulator, ki ob praznem obrazcu pokaže znesek, izgubi edini argument, ki drži ves
   prodajni playbook ("izračun je spodnja meja" — `objections.ts`, `inflatedNumber`).
2. **Nov množitelj brez nove informacije.** Odprava dvojnega diskonta je bila pravilna;
   simetrična napaka navzgor (npr. "faktor polne slike" nad vsoto) bi bila prvi ugovor
   vsakega CFO. Vse dvige delamo v obstoječih koeficientih ali kot ločene, označene vrstice.
3. **Režija na urne postavke.** "Strošek dela je javno objavljen podatek, delo plus režija
   ni podatek nikogar" (`docs/urne-postavke.md`) — računovodja postavko preveri v minuti.
   Režija se pove z besedami (4.4), ne s številko.
4. **Enkratni kapital v letno vsoto.** Pravilo enega koša je strukturna zaščita pred
   ugovorom dvojnega štetja; 3-letni pogled ga navaja ločeno.
5. **Skrivanje pokritosti ali zanesljivosti.** "Izmerjeno 3 od 10" in oznaka "najmanj" sta
   paradoksno naša najmočnejša dvigala — povesta, da je resnica višja. Ostaneta.
6. **Cene PANTHEON v poročilu.** Ograda iz `licences.ts` velja; tabela povračila (4.3)
   uporablja nevtralne stopnje investicije.

---

## 9. Merjenje in kalibracija: od "začetne ocene" do empirije

Koda na štirih mestih zahteva preverbo "po prvih ~50 vnosih" — a brez instrumentacije teh
50 vnosov ne bo mogoče analizirati. Ob uvedbi nivoja 2:

1. **Beležiti porazdelitve** (v obstoječi `analytics.ts` / izvoz): izbrane kategorije
   glavnega vzroka po modulih, delež "Ne vem" po poljih, izbrane pasove, delež praznih
   prihodkov, drop-off po korakih.
2. **Register koeficientov**: ena tabela v `docs/` z vsemi mehkimi koeficienti (naslovljivi
   deleži, sprostljivi deleži, strošek kapitala, pragovi zanesljivosti), vsak z virom,
   datumom zadnje preverbe in sprožilcem za naslednjo — po vzorcu "Kdaj to preveriti znova"
   iz `docs/urne-postavke.md`.
3. **Po 50+ vnosih**: `unknown` delež nastaviti na tehtano povprečje dejanskega mixa
   vzrokov; benchmark razpone za neizmerjena področja (6.3) zamenjati z lastnimi
   percentili; pasove triaže 3→4 odločiti s podatki o drop-offu.

---

## 10. Številčni zgled: isti vnos, pred in po

Testna seja iz proizvodnje (preverjeni zgled iz
[POROCILO-client-report-formule.md](../metodologija/POROCILO-client-report-formule.md),
razdelek 9.1): izguba 17.000 + marža 20.000 + kapaciteta 34.452 = **hero 71.452 EUR/leto**.

| Prikazana številka | Danes (vzroki "Ne vemo") | Po nivoju 1 | Po nivojih 1+2 | Po 1+2+3 |
|---|---:|---:|---:|---:|
| **PDF: prva številka dokumenta** | **17.000** (napaka ⬇0) | **71.452** | ~73.600 | ~88–103.000 |
| Hero na zaslonu (letno) | 71.452 | 71.452 + "283 EUR/delovni dan" | ~73.600 (ure na pot B) | ~88–103.000 (+ ocenjena boleča neizmerjena področja, označeno) |
| Hero (3 leta) | — | **214.356** | ~220.800 | ~265–309.000 |
| Potencial (letno) | 21.436 | 21.436 | **33.100–36.800** (vzrok brez privzetka oz. "Ne vemo" 0,45–0,50) | do ~46.000 (širša pokritost) |
| Potencial (3 leta) | — | 64.308 | ~99–110.000 | ~138.000 |
| Povračilo 100k EUR investicije | ni prikazano | 56 mesecev (ob starem potencialu) | **~33 mesecev** | **~26 mesecev** |
| Enkratni kapital ("Ne vem" zaloga 500k) | 25.000 | 25.000 | **50.000** | 50.000 |

Vse vrednosti nastanejo iz strankinih lastnih vnosov, javno preverljivih postavk in
označenih ocen — nobena ne zahteva, da bi na sestanku karkoli umaknili.

---

## 11. Predlagan vrstni red uvedbe

| Korak | Vsebina | Odvisnosti |
|---|---|---|
| 0 | **4.5: PDF hero = vsota treh košev** (napaka) | nič — en blok v `pdf.ts` |
| 1 | Preostanek nivoja 1 (4.1–4.4, 4.6) | nič — samo prikaz |
| 2 | Zapisnika: naslovljivi deleži + strošek kapitala (`docs/`), nato 5.1–5.3 | benchmark raziskava (docs/erp-koristi) |
| 3 | 5.4 + 5.5 (zaloga, urne postavke na pot B) | dopolnitev `docs/urne-postavke.md` |
| 4 | Instrumentacija (9.1) — pred nivojem 3, da A/B sploh lahko merimo | — |
| 5 | 6.1 (prihodek iz zaposlenih) in 6.2 (maloprodajni pasovi) | SURS izpeljava prihodka/zaposlenega |
| 6 | 6.3 teaser za neizmerjena področja; 6.4 triaža A/B; 6.5 enokliki | podatki iz koraka 4 |

Nivo 1 je smiselno objaviti takoj: ne spremeni nobene formule, sidro pa pomnoži s tri.
