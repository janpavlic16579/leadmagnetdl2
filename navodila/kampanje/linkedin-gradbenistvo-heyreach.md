# LinkedIn sekvenca — gradbeništvo → kalkulator LM-10

Kampanja: HeyReach, povabilo + 4 sporočila.
Segment kalkulatorja: `storitve` (Storitvena in projektna podjetja).
Cilj: obiskovalec izpolni kalkulator, dobi svoj izračun in sprejme 30-minutni pregled izračuna.
Pisano po skillu `datalab-copywriting`. Stanje: 2. 9. 2026.

---

## 1. Diagnoza (zakaj je sekvenca taka, kot je)

**Kdo bere.** Direktor ali lastnik gradbenega podjetja z 10–249 zaposlenimi. Po ICP modelu v
`src/config/icp.ts` je to ciljni razred (vrednost 1,00), direktor/lastnik pa najvišja bližina
odločevalcu (1,00; finance 0,80; vodja 0,60). Vodja projektov ali gradbišča je sprejemljiv drugi
naslovnik, a odloča redkeje — če ciljate nanj, zamenjajte zadnji stavek M3.

**Sprožilec.** Gradbeništvo je v letošnji analizi plačilne discipline dejavnost z najslabšo plačilno
disciplino v Sloveniji (ebonitete.si, junij 2026, na podlagi računov zadnjih 12 mesecev). To je
vstopna točka, ker jo vsak gradbinec pozna iz lastne blagajne. Sekvenca nato premakne pogovor z
zamude plačila na **delo, ki na račun sploh ne pride** — točno tisto, kar kalkulator meri.

**Stopnja zavedanja: 2 (zaveda se problema).** Ve, da mu manjka denar; ni ga razčlenil. Zato prvo
sporočilo ne omenja produkta in ne vsebuje povezave, drugo pa vodi z ugotovitvijo, ne s kalkulatorjem.

**Ena ideja sekvence:** delo, ki ste ga opravili in ga niste zaračunali, je največja skrita postavka —
in v desetih minutah si jo lahko izračunate sami, brez oddaje e-naslova.

**Zakaj ta kalkulator sploh deluje kot vaba:** rezultat se pokaže **pred** vnosom e-naslova. To je
edini stavek v celotni sekvenci, ki odpravi glavni ugovor proti vsakemu lead magnetu. Nikoli ga ne
izpustite.

---

## 2. Sekvenca

Zamiki so od prejšnjega koraka. Skupno trajanje 35 dni.

| # | Korak | Zamik | Namen | Ima povezavo |
|---|---|---|---|---|
| 0 | Povabilo | — | Povezava brez prodaje | ne |
| 1 | Sporočilo 1 | +2 dni po sprejetju | Eno vprašanje, ki odpre temo | **ne** |
| 2 | Sporočilo 2 | +5 dni | Ugotovitev + kalkulator | da |
| 3 | Sporočilo 3 | +10 dni | 30-minutni pregled izračuna | ne |
| 4 | Sporočilo 4 | +18 dni | Zaprtje, vrata odprta | da |

### Povabilo (opomba ob povezavi, do 300 znakov)

> Pozdravljeni, [Ime]. Delam pri Datalabu in se ukvarjam z gradbenimi podjetji, ki lovijo razliko med
> opravljenim in zaračunanim delom — več dela, dodelave, zadržani zneski. Vesel bom povezave.

### Sporočilo 1 — +2 dni po sprejetju

> Hvala za povezavo, [Ime].
>
> Zanima me eno: kadar se med izvedbo pojavijo več in dodatna dela, jih pri vas zabeležite kot
> spremembo naročila sproti — ali se uredi šele ob situaciji?

*Brez povezave. To sporočilo lovi odgovor, ne klika. Vprašanje je zastavljeno tako, da nanj lahko
odgovori v treh besedah, in vsak odgovor je uporaben: »sproti« pomeni, da imajo proces, »ob situaciji«
pomeni, da je bolečina že tam.*

### Sporočilo 2 — +5 dni

> [Ime], ena ugotovitev iz letošnje analize plačilne discipline: gradbeništvo je dejavnost z najslabšo
> plačilno disciplino v Sloveniji.
>
> Zamude plačil vidite. Kar se ne vidi, je delo, ki na račun sploh ne pride — ure nad dogovorjenim
> obsegom, popravki po pripombah naročnika, odpisi ob obračunu.
>
> Sestavili smo kalkulator, ki to sešteje v letni znesek po vaših številkah. Izračun vidite takoj,
> e-naslov vas vpraša šele na koncu in samo, če želite PDF. Vzame okoli deset minut:
> [POVEZAVA]

### Sporočilo 3 — +10 dni

> [Ime], ponudba velja ne glede na to, ali ste kalkulator odprli.
>
> Vzamem 30 minut in skupaj pogledava vaše številke: kaj je pri vas nezaračunano delo, kaj zadržani
> znesek in kaj zgolj zamik plačila. Brez predstavitve programa — urne postavke v izračunu so izpeljane
> iz strukturne statistike plač SURS, zato se pogovarjava o vaših podatkih, ne o mojih ocenah.
>
> Naj predlagam dva termina?

### Sporočilo 4 — +18 dni

> [Ime], zapiram temo, da vam ne sedi v predalu.
>
> Povezava do izračuna ostaja odprta tudi brez mene: [POVEZAVA]. Če se pri vas kaj premakne — nov večji
> projekt, menjava programa ali priprava na obvezne e-račune med podjetji leta 2028 — mi pišite.

---

## 3. Povezava

Sestavite jo takole:

```
<javni naslov objave>/?s=storitve&utm_source=linkedin&utm_campaign=gradbenistvo
```

- `?s=storitve` v Koraku 1 prednastavi dejavnost »Storitvena in projektna podjetja«. Obiskovalec jo
  vidi in sme popraviti — kar je prav, a glej opozorilo v razdelku 6.
- `utm_source` se zapiše v izvozni zapis, zato boste v Google Sheetu ločili LinkedIn od e-pošte.
- Javni naslov je repozitorijska spremenljivka `VITE_PUBLIC_URL`; `base` v `vite.config.ts` je
  `/leadmagnetdl2/`. Preverite objavljeni naslov, preden kampanjo zaženete — povezava, ki vrne 404, je
  najdražja napaka v celotni sekvenci.
- Skrajševalnikov ne uporabljajte: LinkedIn skrajšane povezave slabše dostavlja, vi pa izgubite
  predogledno kartico, ki je v `index.html` že nastavljena (`og:title`, `og:description`).

---

## 4. Kaj testirati

Spremenite eno stvar naenkrat, sicer ne veste, kaj je delovalo.

**Test A — povezava v sporočilu 1.** Ta sekvenca zadrži povezavo do sporočila 2, ker prvo sporočilo
lovi odgovor. Če želite višji delež klikov na račun nižjega deleža odgovorov, zamenjajte sporočilo 1 z:

> Hvala za povezavo, [Ime].
>
> Sestavili smo kalkulator, ki gradbenemu podjetju izračuna letni znesek dela, ki je bilo opravljeno in
> ni prišlo na račun. Izračun vidite takoj, e-naslov vas vpraša šele na koncu: [POVEZAVA]

**Test B — vstopna točka v sporočilu 2.** Namesto plačilne discipline uporabite stroškovni sprožilec:

> [Ime], minimalna plača je letos 1.482,00 € bruto — 15,97 % več kot lani, strošek delodajalca 11,25 %
> več. V dejavnosti, kjer je delo največja postavka, to pomeni, da vsaka neevidentirana ura stane več
> kot lani.

**Test C — vloga naslovnika.** Direktor proti vodji projektov. Vodji zamenjajte zadnji stavek
sporočila 3 v: »Če o programih ne odločate vi, mi povejte, komu naj to pošljem — izračun je narejen
tako, da ga lahko posredujete naprej.«

---

## 5. Nastavitev v HeyReach

- **Osebne spremenljivke:** `[Ime]` je edina obvezna. Ne vstavljajte imena podjetja v vsako sporočilo —
  pri štirih sporočilih zveni avtomatizirano.
- **Dnevni obseg:** ostanite pri obstoječih omejitvah računa. Seznami pod 200 kontaktov se odzivajo
  bistveno bolje kot široki — raje trije ožji segmenti kot en velik.
- **Izhod iz sekvence ob odgovoru:** obvezno vklopljen. Nadaljevanje sekvence po odgovoru je
  najhitrejši način, da izgubite topel lead.
- **Seznam:** gradbena podjetja z 10–249 zaposlenimi, funkcije direktor / lastnik / prokurist /
  vodja financ. Podjetja pod 10 zaposlenih po ICP modelu dobijo 0,35 — ne izključujte jih, a ne dajte
  jim prednosti.
- **Merilo uspeha:** ne število povezav, ampak število oddanih vprašalnikov z e-naslovom. Vsak oddani
  vprašalnik prinese ICP oceno in prodajno pripravo; povezava brez izračuna ne prinese ničesar.

---

## 6. Tri stvari, ki jih je vredno urediti pred zagonom

**1. Gradbeništva ni v spustnem seznamu dejavnosti.** `src/config/industries.ts` gradbinca pošlje čez
»Drugo« → »Zaračunavamo ure, projekte ali storitve«. Komentar v datoteki to celo izrecno pove.
Kampanjska povezava `?s=storitve` sicer prednastavi pravi vprašalnik, a obiskovalec vidi oznako
»Storitvena in projektna podjetja« in se v njej morda ne prepozna — prav na prvem koraku, kjer je
opustitev najcenejša zanj in najdražja za vas. Popravek je ena vrstica v `INDUSTRIES`:

```ts
{ id: 'gradbenistvo', label: 'Gradbeništvo', segment: 'storitve' },
```

Datoteka je zasnovana točno za to: »marketing lahko doda dejavnost brez poseganja v logiko.«

**2. V izvoznem zapisu ni ICP ocene.** Po `docs/icp-ocena.md` (razdelek 6.3) ocena obstaja samo v PDF-ju
na napravi obiskovalca. Če boste to kampanjo merili po kakovosti leadov in ne le po številu, dodajte
`icpTotal` in `icpBand` v `LeadExportRecord`, preden zaženete — sicer po 50 vnosih ne boste imeli česa
umeriti.

**3. Manjka številka stranke.** Sekvenca stoji na zunanjih virih (plačilna disciplina, SURS, minimalna
plača), ker svojih rezultatov še nimate. Prva gradbena stranka, ki pove »po izračunu smo našli X € letno
nezaračunanega dela«, je vredna več kot vsi trije viri skupaj — takoj ko jo imate, gre v sporočilo 2.

---

## 7. Pravno

- **LinkedIn ni e-pošta.** Pravila ZEKom-2 o nezaželenih komercialnih sporočilih se nanašajo na
  elektronsko pošto, SMS in klice; sporočila znotraj LinkedIna pod ta člen ne padejo. Velja pa GDPR za
  obdelavo osebnih podatkov, ki jih o kontaktu hranite v HeyReachu in CRM-ju.
- **Odklonitev spoštujte takoj.** Kdor odgovori »ne« ali »ne zanima me«, gre iz sekvence in iz
  ponovnega ciljanja. V trgu te velikosti se vztrajanje vrne.
- **Trditve v sekvenci so preverljive.** Plačilna disciplina: ebonitete.si, junij 2026. Minimalna plača
  2026: 1.482,00 € bruto. Obvezni e-računi med podjetji: 1. 1. 2028 (ZIERDED, sprejet 23. 10. 2025) —
  nikoli ne pišite 2026 ali 2027. Urne postavke v kalkulatorju: SURS, strukturna statistika plač,
  oktober 2025.

---

## 8. QA — opravljeno

| Kontrola | Stanje |
|---|---|
| Ena ideja, izrekljiva v enem stavku | ✓ |
| Vsaka trditev ima vir | ✓ |
| Nobene besede s prepovedanega seznama | ✓ |
| Razmerje vi : mi nad 3 : 1 | ✓ |
| Nobene trditve o borzi, »91.501 uporabnikov«, »št. 1« | ✓ |
| Datum e-računov 1. 1. 2028 | ✓ |
| Dosledno vikanje, vi/vaš z malo začetnico | ✓ |
| CTA v velelniku 2. os. mn. | ✓ |
| Ena prošnja na sporočilo | ✓ |
| Sporočilo 1 brez povezave | ✓ |
| Brez umetne nujnosti in odštevalnikov | ✓ |
| Strah ni poimenovan | ✓ |
| Tipografija: 1.482,00 €, 15,97 %, 1. 1. 2028 | ✓ |

Odprto: test 5 sekund. Pokažite povabilo in sporočilo 2 nekomu iz gradbeništva, ki Datalaba ne pozna, in
ga vprašajte, kaj mu ponujate. Če ne zna odgovoriti, je težava v sporočilu 2.

---

## Viri

- Plačilna disciplina 2026 — https://www.ebonitete.si/placilna-disciplina-slovenskih-podjetij-2026/
- Kalkulator LM-10: `README.md`, `docs/icp-ocena.md`, `src/config/industries.ts`,
  `src/config/copy/storitve.ts`, `src/config/modules/storitve.ts`
