# LinkedIn sekvenca — gradbeništvo → kalkulator LM-10

Kampanja: HeyReach, povabilo + 4 sporočila.
Segment kalkulatorja: `gradbenistvo` (Gradbeništvo — lasten vprašalnik od 7. 9. 2026; do tedaj `storitve`).
Cilj: obiskovalec izpolni kalkulator, dobi svoj izračun in sprejme 30-minutni pregled izračuna.
Podlaga: skill `datalab-copywriting` + interni kontekst niš (v. 1.0, 7. 9. 2026).
Različica 2 — prepisano po Katjinem kontekstu za gradbeništvo. Stanje: 7. 9. 2026.

---

## 1. Diagnoza

**Kdo bere.** Direktor ali lastnik gradbenega podjetja z 10–249 zaposlenimi. Po ICP modelu v
`src/config/icp.ts` je to ciljni razred (1,00), direktor/lastnik pa najvišja bližina odločevalcu
(1,00; finance 0,80; vodja 0,60).

**Osrednja bolečina (iz internega konteksta, pogl. 2.3).** *Stroški projekta so znani šele po
zaključku; plan in realizacija se primerjata ročno.* To je ostrejša in bolj gradbeniška formulacija kot
»nezaračunano delo«, s katerim je bila napisana prva različica — nezaračunano delo je posledica, ne
vzrok. Sekvenca zdaj vodi z vzrokom.

**Druga bolečina, ki nosi celotno alternativno različico.** *Situacije podizvajalcev in roki so
razpršeni po Excelu in mailih* — nepregledna mreža podizvajalcev, počasno preverjanje, kdo je že
obračunal in kdo zamuja.

**Zunanji sprožilec.** Gradbeništvo je v letošnji analizi plačilne discipline dejavnost z najslabšo
plačilno disciplino v Sloveniji (ebonitete.si, junij 2026, računi zadnjih 12 mesecev). Uporabimo ga kot
vstopno točko, ker jo vsak gradbinec pozna iz svoje blagajne — nato pogovor premaknemo z zamude plačila
na strošek, ki ga sploh ne vidi.

**Stopnja zavedanja: 2.** Ve, da mu manjka denar; ni ga razčlenil. Zato prvo sporočilo ne omenja
produkta in nima povezave, drugo pa vodi z ugotovitvijo, ne s kalkulatorjem.

**Ena ideja sekvence:** dokler stroške projekta seštejete šele ob zaključku, je za ukrepanje prepozno —
v desetih minutah si lahko izračunate, koliko vas to letno stane.

**Zakaj ta kalkulator deluje kot vaba:** rezultat se pokaže **pred** vnosom e-naslova. To je edini
stavek v sekvenci, ki odpravi glavni ugovor proti vsakemu lead magnetu. Nikoli ga ne izpustite.

**Jezik, ki ga uporabljamo dobesedno iz vira:** *material, delo, podizvajalci in mehanizacija* ·
*plan proti realizaciji* · *pogodbe, situacije, roki in plačila* · *hitrejši obračuni projektov* ·
*profitabilnost projektov*. To so besede, ob katerih gradbinec ve, da pišete njemu.

---

## 2. Sekvenca

| # | Korak | Zamik | Namen | Povezava |
|---|---|---|---|---|
| 0 | Povabilo | — | Povezava brez prodaje | ne |
| 1 | Sporočilo 1 | +2 dni po sprejetju | Kvalifikacijsko vprašanje | **ne** |
| 2 | Sporočilo 2 | +5 dni | Ugotovitev + kalkulator | da |
| 3 | Sporočilo 3 | +10 dni | 30-minutni pregled izračuna | ne |
| 4 | Sporočilo 4 | +18 dni | Zaprtje, vrata odprta | da |

### Povabilo (do 300 znakov)

> Pozdravljeni, [Ime]. Delam pri Datalabu in se z gradbenimi podjetji pogovarjam o eni stvari: kdaj
> sploh vidijo, ali projekt drži maržo — sproti ali šele ob zaključku. Vesel bom povezave.

### Sporočilo 1 — +2 dni po sprejetju

> Hvala za povezavo, [Ime].
>
> Eno vprašanje: kdaj pri vas veste, ali projekt drži maržo — sproti med izvedbo ali šele ob
> zaključnem obračunu?

*Brez povezave. Sporočilo lovi odgovor, ne klika. Vsak odgovor je uporaben: »sproti« pomeni, da imajo
proces in gremo v drugo bolečino (podizvajalci); »ob obračunu« pomeni, da je bolečina že tam in
sporočilo 2 pade na pripravljena tla.*

### Sporočilo 2 — +5 dni

> [Ime], ena ugotovitev iz letošnje analize plačilne discipline: gradbeništvo je dejavnost z najslabšo
> plačilno disciplino v Sloveniji.
>
> Zamude plačil vidite. Kar se ne vidi, je strošek projekta, dokler projekt ni zaključen — material,
> delo, podizvajalci in mehanizacija se seštejejo šele takrat, ko za ukrepanje ni več časa.
>
> Sestavili smo kalkulator, ki to sešteje v letni znesek po vaših številkah. Izračun vidite takoj,
> e-naslov vas vpraša šele na koncu in samo, če želite PDF. Vzame okoli deset minut:
> [POVEZAVA]

### Sporočilo 3 — +10 dni

> [Ime], ponudba velja ne glede na to, ali ste kalkulator odprli.
>
> Vzamem 30 minut in skupaj pogledava vaše številke po projektih: kaj je delo, ki ni prišlo na
> situacijo, kaj zadržani zneski in kaj zgolj zamik plačila. Brez predstavitve programa — urne postavke
> v izračunu so izpeljane iz strukturne statistike plač SURS, zato se pogovarjava o vaših podatkih, ne
> o mojih ocenah.
>
> Naj predlagam dva termina?

### Sporočilo 4 — +18 dni

> [Ime], zapiram temo, da vam ne sedi v predalu.
>
> Povezava do izračuna ostaja odprta tudi brez mene: [POVEZAVA]. Če se pri vas kaj premakne — večji
> projekt, pri katerem plana in realizacije ne boste hoteli primerjati ročno, ali priprava na obvezne
> e-račune med podjetji leta 2028 — mi pišite.

---

## 3. Alternativna veja: podizvajalci

Druga bolečina iz vira je dovolj močna, da zasluži svojo vejo. Uporabite jo za podjetja, ki v sporočilu
1 odgovorijo »sproti« (marže torej obvladujejo), in kot celotno različico B pri A/B testu.

**Sporočilo 1B**

> Hvala za povezavo, [Ime].
>
> Eno vprašanje: kje so pri vas pogodbe, situacije in roki podizvajalcev — v sistemu ali po Excelih in
> mailih?

**Sporočilo 2B**

> [Ime], pri gradbenih podjetjih se najdražji del meseca navadno skriva tam, kjer ga nihče ne meri: v
> preverjanju, kdo od podizvajalcev je delo že obračunal, kdo zamuja in katera situacija še ni
> potrjena.
>
> Sestavili smo kalkulator, ki ta čas in denar sešteje v letni znesek po vaših številkah. Izračun
> vidite takoj, e-naslov vas vpraša šele na koncu. Vzame okoli deset minut:
> [POVEZAVA]

Sporočili 3 in 4 ostaneta enaki.

---

## 4. Prenos na strojegradnjo in konstrukcije

Interni kontekst (pogl. 1) pravi, da je podsegment *konstrukcije in strojegradnja* najpogosteje
projektno usmerjena proizvodnja, kjer se profitabilnost meri po projektih — torej velja isti argument.
Isto sekvenco uporabite s tremi zamenjavami:

| Kje | Iz | V |
|---|---|---|
| Povabilo | »gradbenimi podjetji« | »podjetji v strojegradnji in konstrukcijah« |
| Sporočilo 2 | »material, delo, podizvajalci in mehanizacija« | »material, delo, kooperacija in strojne ure« |
| Sporočilo 2 | ugotovitev o plačilni disciplini | ugotovitev o plačilni disciplini **ne velja** za to panogo — zamenjajte jo s testom C spodaj |

Povezava za strojegradnjo ostane `?s=storitve` (ne `/gradbenistvo/`): gradbeni vprašalnik sprašuje po
situacijah, gradbiščih in zadržkih, ki jih strojegradnja nima — projektno vodenje pokrije storitveni.

⚠️ Za kovinskopredelovalno panogo obstaja referenca **ALPOS METALURGIJA d.o.o.** (ERP, MES, WMS), a je
interni kontekst izrecno označil kot »pred javno uporabo preveri pri Katji«. Do potrditve je v
sporočilih ne uporabljajte.

---

## 5. Kaj testirati

Eno spremembo naenkrat.

**Test A — povezava že v sporočilu 1.** Ta sekvenca jo zadrži do sporočila 2, ker prvo sporočilo lovi
odgovor. Za višji delež klikov na račun nižjega deleža odgovorov zamenjajte sporočilo 1 z:

> Hvala za povezavo, [Ime].
>
> Sestavili smo kalkulator, ki gradbenemu podjetju izračuna letni znesek stroškov, ki jih vidi šele ob
> zaključku projekta. Izračun vidite takoj, e-naslov vas vpraša šele na koncu: [POVEZAVA]

**Test B — veja podizvajalcev** (razdelek 3) proti veji marže po projektih.

**Test C — stroškovni sprožilec namesto plačilne discipline:**

> [Ime], minimalna plača je letos 1.482,00 € bruto — 15,97 % več kot lani, strošek delodajalca 11,25 %
> več. V dejavnosti, kjer je delo največja postavka projekta, se vsaka ura, ki je ne vidite sproti,
> letos podraži.

**Test D — vloga naslovnika.** Direktorju pustite sporočilo 3, kot je. Vodji projektov zamenjajte
zadnji stavek: »Če o programih ne odločate vi, mi povejte, komu naj to pošljem — izračun je narejen
tako, da ga lahko posredujete naprej.«

---

## 6. Nastavitev v HeyReach

- **Spremenljivke:** `[Ime]` je edina obvezna. Imena podjetja ne vstavljajte v vsako sporočilo — pri
  štirih sporočilih zveni avtomatizirano.
- **Izhod iz sekvence ob odgovoru:** obvezno vklopljen.
- **Seznam:** gradbena podjetja z 10–249 zaposlenimi; funkcije direktor / lastnik / prokurist / vodja
  financ. Seznami pod 200 kontaktov se odzivajo bistveno bolje — raje tri ožje veje kot ena široka.
- **Kvalifikacijski signal (Katjin, pogl. 6 konteksta):** podjetja, ki zaloge in evidence še vodijo v
  Excelu, so sama po sebi signal nizke digitalne zrelosti. Kjer to vidite iz objav ali spletne strani,
  dajte kontaktu prednost.
- **Merilo uspeha:** ne število povezav, ampak število oddanih vprašalnikov z e-naslovom. Vsak oddani
  vprašalnik prinese ICP oceno in prodajno pripravo; povezava brez izračuna ne prinese ničesar.

---

## 7. Meje — česa v teh sporočilih ne smete

Iz internega konteksta, pogl. 6 in 7:

1. **Nobene reference in nobene številke iz gradbeništva.** Vir izrecno pravi, da ju nimamo — ne
   obstaja niti ena zgodba prej/potem. Vse trditve v sekvenci zato stojijo na **zunanjih** virih
   (plačilna disciplina, SURS, ZIERDED). Ne dodajajte »naše stranke so prihranile …«.
2. **Imen ALPOS in PharmaLinea ne uporabljajte javno,** dokler Katja ne potrdi.
3. **Ozkih grl PANTHEON-a proti konkurenci se ne dotikajte** — na to vprašanje odgovora še ni, zato
   primerjav s Saop, miniMAX ali Business Central v tej sekvenci ni.
4. **Stiropor kot niše ne uporabljajte** — priporočilo ni utemeljeno.
5. **Interni kontekst je zaupen.** Nič iz njega ne gre v sporočilo dobesedno kot citat vira; uporabljena
   je samo vsebina bolečin.

---

## 8. Tri stvari pred zagonom

**1. Katja še ni potrdila, da gradbeništvo gre v isti outbound val kot proizvodnja** (odprto vprašanje
št. 8 v internem kontekstu). Preverite, preden zaženete — sicer lahko dve kampanji trkata v isti
seznam.

**2. Gradbeništvo je od 7. 9. 2026 v spustnem seznamu dejavnosti kalkulatorja** — z lastnim
vprašalnikom (`src/config/modules/gradbenistvo.ts`): marža projekta, situacije in dodatna dela, ure in
material na gradbišču, podizvajalci in zadržki, plačila in zadržana sredstva. Kampanjska povezava naj
uporabi pot `/gradbenistvo/` (§9): obiskovalec preskoči uvodni zaslon in pristane na koraku z
zaposlenimi z že izbranim gradbeništvom. Vprašanje iz sporočila 1 (»kdaj veste, ali projekt drži
maržo«) je hkrati prvo vprašanje področja Marža projekta — sekvenca in vprašalnik govorita isto.

**3. V izvoznem zapisu ni ICP ocene** (`docs/icp-ocena.md`, 6.3). Če boste kampanjo merili po kakovosti
leadov, dodajte `icpTotal` in `icpBand` v `LeadExportRecord` prej — sicer po 50 vnosih ni česa umeriti.

---

## 9. Povezava

```
<javni naslov objave>/gradbenistvo/?utm_source=linkedin&utm_campaign=gradbenistvo
```

Pot `/gradbenistvo/` preskoči uvodni zaslon; `?s=gradbenistvo` dejavnost samo prednastavi in uvodni zaslon
pusti (README, razdelek Segmenti). Za vejo podizvajalcev uporabite `utm_campaign=gradbenistvo-podizvajalci`,
za strojegradnjo `?s=storitve&utm_campaign=strojegradnja` — sicer v Google Sheetu ne boste ločili, katera veja
je delovala.

Javni naslov je `VITE_PUBLIC_URL` tiste objave, na katero kampanja kaže; pot objave ni več trdo zapisana —
na Vercelu je koren (`https://leadmagnetdl2.vercel.app/gradbenistvo/`), na GitHub Pages `/leadmagnetdl2/`
(README, razdelek **Objava**). Dokler je Vercelov projekt na načrtu Hobby, ki je po Vercelovih pravilih
nekomercialen, naj kampanja kaže na Pages. Preverite objavljeni naslov pred zagonom. Skrajševalnikov ne
uporabljajte — izgubite predogledno kartico, ki je v `index.html` že nastavljena.

---

## 10. Pravno

- **LinkedIn ni e-pošta.** Člen 226 ZEKom-2 o nezaželenih komercialnih sporočilih se nanaša na
  elektronsko pošto, SMS in klice; sporočila v LinkedInu podenj ne padejo. GDPR pa velja za osebne
  podatke, ki jih o kontaktu hranite v HeyReachu in CRM-ju.
- **Odklonitev spoštujte takoj.** Kdor odgovori »ne«, gre iz sekvence in iz ponovnega ciljanja.
- **Preverljivost trditev.** Plačilna disciplina: ebonitete.si, junij 2026. Minimalna plača 2026:
  1.482,00 € bruto. Obvezni e-računi med podjetji: 1. 1. 2028 (ZIERDED, sprejet 23. 10. 2025) — nikoli
  2026 ali 2027. Urne postavke: SURS, strukturna statistika plač, oktober 2025.

---

## 11. QA — opravljeno

| Kontrola | Stanje |
|---|---|
| Ena ideja, izrekljiva v enem stavku | ✓ |
| Vsaka trditev ima zunanji vir | ✓ |
| Nobene besede s prepovedanega seznama (tudi »na enem mestu« iz vira je zamenjano z »v sistemu«) | ✓ |
| Razmerje vi : mi nad 3 : 1 | ✓ |
| Nobene reference brez potrditve | ✓ |
| Datum e-računov 1. 1. 2028 | ✓ |
| Dosledno vikanje, vi/vaš z malo začetnico | ✓ |
| CTA v velelniku 2. os. mn. | ✓ |
| Ena prošnja na sporočilo | ✓ |
| Sporočilo 1 brez povezave | ✓ |
| Brez umetne nujnosti | ✓ |
| Tipografija: 1.482,00 €, 15,97 %, 1. 1. 2028 | ✓ |

Odprto: test 5 sekund — pokažite povabilo in sporočilo 2 nekomu iz gradbeništva, ki Datalaba ne pozna.

---

## Viri

- Interni kontekst ciljnih niš, v. 1.0, 7. 9. 2026 (Katja Pirnat, e-pošta »Gradbeniki«, 8. 5. 2026) —
  zaupno, ni za stranke
- Plačilna disciplina 2026 — https://www.ebonitete.si/placilna-disciplina-slovenskih-podjetij-2026/
- Kalkulator LM-10: `README.md`, `docs/icp-ocena.md`, `src/config/industries.ts`,
  `src/config/copy/gradbenistvo.ts`, `src/config/modules/gradbenistvo.ts`
