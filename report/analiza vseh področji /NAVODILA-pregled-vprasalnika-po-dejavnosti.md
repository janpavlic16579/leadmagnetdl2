# Navodila: podroben pregled vprašalnika za eno dejavnost

> **Kaj je to.** Ponovljiv postopek za strokovni pregled ene dejavnosti v ROI kalkulatorju. Vsako vprašanje dobi sodbo **ohrani / izboljšaj / odstrani / premakni**, vrzeli pa predloge **dodaj** s konkretnim besedilom, tipom, privzetkom in formulo.
>
> **Kako uporabiti.** Odpri novo sejo, povej: »Naredi podroben pregled dejavnosti **<DEJAVNOST>** po navodilih v `NAVODILA-pregled-vprasalnika-po-dejavnosti.md`.« Model prebere ta dokument, izpolni tabelo parametrov iz razdelka 2 in požene delovni tok iz razdelka 6.
>
> **Izvedeno za:** proizvodnja (12 agentov, 115 sodb — glej `proizvodnja/vprasalnik-proizvodnja-trenutno-stanje.md`).
> **Zadnja posodobitev:** 12. avgust 2026.

---

## 1. Poti in dejstva, ki ne smejo biti uganjena

**Repozitorij:** `/Users/janpavlic/Documents/Datalab/aplikacije/ROI kalkulator`

> ⚠️ Ne `Datalab/Claude code` — ta pot je zastarela kopija. V pregledu proizvodnje so agenti zaradi nje brali starejšo kodo in trije predlogi so bili posledično ovrženi kot že rešeni.

**Baza znanja:** `/Users/janpavlic/Documents/Datalab/reports/GPT baza znanja`

Ključne datoteke, ki jih mora prebrati **vsak** pregledovalec, ne glede na dejavnost:

| Datoteka | Zakaj |
|---|---|
| `src/config/modules/moduleTypes.ts` | koši, `FieldKind`, `contextOnly`, `allowUnknown`, `usesRevenue`, `typicalAnnualLossBand` |
| `src/config/modules/addressableShare.ts` | kategorije vzrokov in naslovljivi deleži |
| `src/config/modules/shared.ts` | `MONTHS_PER_YEAR`, `RECEIVABLES_CAPITAL_COST`, `ASSURANCE_CHOICES`, `reducibleShareField` |
| `src/config/modules/horizontal.ts` | pet horizontal, ki nastopajo v več segmentih |
| `src/config/segments.ts` | kateri moduli sestavljajo segment in v kakšnem vrstnem redu |
| `src/lib/potential.ts` | potencial, `assessConfidence` |
| `src/lib/moduleEngine.ts` | agregacija po koših, `resolveActiveModules`, `isModuleAnswered` |
| `src/lib/plausibility.ts` | ovojnica verjetnosti vnesenih ur |
| `src/lib/salesReport.ts`, `src/lib/salesPlaybook.ts` | kam gredo `contextOnly` odgovori in »Ne vem« |
| `src/config/icp.ts` | dimenzije in uteži lead scoringa |

---

## 2. Parametri po dejavnostih

Model naj pred zagonom izpolni to vrstico za izbrano dejavnost.

| Segment | Prikazno ime | Raziskava (mapa v bazi znanja) | Modul | Kontekst |
|---|---|---|---|---|
| `proizvodnja` | Proizvodnja 10–249 zaposlenih | `proizvodnja/proizvodnja.md` | `proizvodnja.ts` | `contexts/proizvodnja.ts` |
| `logistika` | Logistika in transport 10–249 | `logistika/Logisticna_in_transportna_nisa_celovita_baza_znanja.md` | `logistika.ts` | `contexts/logistika.ts` |
| `trgovina` | Veleprodaja in distribucija | `veleprodaja/Deep_research_veleprodaja_distribucija.md` | `trgovina.ts` | `contexts/trgovina.ts` |
| `maloprodaja` | Maloprodaja | `maloprodaja/Raziskava_maloprodaja_PANTHEON.md` | `maloprodaja.ts` | `contexts/maloprodaja.ts` |
| `storitve` | Storitve in projekti 10–249 | `storitve/Storitvene_dejavnosti_deep_research.md` | `storitve.ts` | `contexts/storitve.ts` |
| `racunovodstvo` | Računovodski servis | `računovodstvo/Datalab_globinska_raziskava_racunovodski_servisi.md` | `racunovodstvo.ts` | `contexts/racunovodstvo.ts` |
| `splosno` | Direktor / CFO — splošno | ⚠️ raziskave **ni** (mapa `drugo:splošno` je prazna) | `splosno.ts` | `contexts/splosno.ts` |

Vsaka mapa ima poleg `.md` še `.xlsx` s strukturiranimi registri (bolečine, KPI, ROI model, ICP, vprašalnik) — `.pdf` je isto kot `.md`, zato ga **ne beri**.

### Sestava segmentov (stanje 12. 8. 2026)

| Segment | Panožni moduli | Horizontale | Vedno |
|---|---|---|---|
| `proizvodnja` | planiranje · material · zaloge · nalogi · zamude | vseh 5 | diagnostika · E |
| `logistika` | odprema · napake · skladisce · dokumentacija · roki | analitika · finance · kadri | diagnostika_logistika · E |
| `trgovina` | narocila · skladisce · zaloge · odprema · terjatve | vseh 5 | diagnostika_trgovina · E |
| `maloprodaja` | razpolozljivostMp · zalogeMp · marzeMp · blagajnaMp · prevzemMp · kanaliMp *(6!)* | vseh 5 | diagnostikaMp · E |
| `storitve` | projekti · obracun · obseg · administracija · terjatve | vseh 5 | diagnostika_storitve · E |
| `racunovodstvo` | zajemRs · strankeRs · obracuniRs · popravkiRs · donosnostRs | analitika · kadri | diagnostikaRs · E |
| `splosno` | podatkiSp · usklajevanjeSp · napakeSp · denarSp · zalogeSp | finance · kadri · dokumenti | diagnostikaSp · E |

Izpuščene horizontale so povsod utemeljene v komentarjih `segments.ts` — pregled naj **preveri, ali utemeljitev še drži**, ne pa je privzeto sprejme.

---

## 3. Razdelitev na šest pregledovalcev

Delo se razdeli tako, da vsak agent dobi obvladljiv obseg **in** da so v istem obsegu moduli, ki se lahko med sabo podvajajo — dvojno štetje se vidi samo, če isti bralec vidi obe strani meje.

| # | Obseg | Pravilo delitve |
|---|---|---|
| 1 | **Koraki 1–5** | dejavnost, velikost, kontekst (3 vprašanja), **vsa** triažna vprašanja, skupna finančna osnova |
| 2 | **Panožna modula A + B** | dva modula, ki merita **čas in administracijo** |
| 3 | **Panožna modula C + D** | dva modula, ki merita **material, zaloge ali denar** |
| 4 | **Panožni modul E + diagnostika + modul E (tehnični)** | zadnji panožni modul, vedno prikazana diagnostika in tehnični roki |
| 5 | **Horizontale** | vseh 24–32 vprašanj **z vidika te dejavnosti** |
| 6 | **Vrzeli** | kaj manjka proti katalogu bolečin — tu so vsi verdikti »dodaj« |

**Parjenje po dejavnostih** (predlog; pomembno je, da sta v paru modula, ki si delita ure ali evre):

- `proizvodnja` → (planiranje + nalogi) · (material + zaloge) · (zamude + diagnostika)
- `logistika` → (odprema + roki) · (skladisce + napake) · (dokumentacija + diagnostika)
- `trgovina` → (narocila + odprema) · (skladisce + zaloge) · (terjatve + diagnostika)
- `maloprodaja` → (razpolozljivostMp + kanaliMp) · (zalogeMp + marzeMp) · (blagajnaMp + prevzemMp + diagnostika) — **šest modulov, zato je zadnji agent najtežji**
- `storitve` → (projekti + administracija) · (obracun + obseg) · (terjatve + diagnostika)
- `racunovodstvo` → (zajemRs + obracuniRs) · (strankeRs + donosnostRs) · (popravkiRs + diagnostika)
- `splosno` → (podatkiSp + usklajevanjeSp) · (napakeSp + zalogeSp) · (denarSp + diagnostika)

---

## 4. Merila presoje

Vsak pregledovalec uporabi **vseh šest**:

**a) Ali odgovor vstopa v izračun?**
Če je `contextOnly`, mora imeti prodajno ali diagnostično vrednost — preveri v `salesReport.ts` (`buildMeasuredArea` → `measured.answers`) in `salesPlaybook.ts` (rezervne iztočnice). `contextOnly` polje brez obeh je kandidat za odstranitev; polje, ki v poročilu **je**, ni.

**b) Odgovorljivost iz glave v 30 sekundah.**
»Koliko skupnih človek-ur mesečno …« nihče ne vodi. Raziskave predpisujejo pot **št. dogodkov × čas na dogodek** (dinamični vzorec: količina dogodkov → čas na dogodek → delež problematičnih). Preveri, ali polje že ima `explainer` s tako izpeljavo — v proizvodnji so bile tri kritike ovržene prav zato, ker je izpeljava že obstajala.

**c) Meje dvojnega štetja.**
Ali `help` jasno loči od sosednjih področij, **v obe smeri**? Pogosta napaka: meja je zapisana samo pri enem od dveh sosedov. Preveri tudi proti horizontalam — te so v več segmentih hkrati, zato njihova besedila ne smejo imenovati sosednjih področij.

**d) Privzetki in enote.**
Ali privzetek ustvari znesek brez uporabnikove potrditve? (V proizvodnji: `scrapSharePercent` 3 % — vpis materiala je zadoščal.) Ali enota drži: `h/mesec` proti `h/leto` (letne postavke se v `compute` **ne** množijo z 12)?

**e) Skladnost z raziskavo.**
Navedi poglavje ali ID bolečine, ki vprašanje podpira ali predlaga boljšega. Če vprašanja ne podpira nobena bolečina iz kataloga, je to argument za odstranitev.

**f) Ali bi bilo bolje vprašati prek KPI, ki ga podjetje že pozna?**
OTIF, % izmeta, inventurna razlika, DSO, zasedenost, delež zaračunanih ur. KPI je preverljiv in težje polepšan kot samoocena tipa »Da / Večinoma / Le približno / Ne«.

---

## 5. Trda pravila, ki jih predlog ne sme kršiti

Ta izhajajo iz raziskav in so v vseh dejavnostih enaka.

1. **Prihranek časa ni prihranek plače**, dokler ni opredeljena monetizacija. Ure sproščene kapacitete se ne smejo prikazati kot denar, ki ga podjetje dobi nazaj.
2. **Prihodek ni korist** — pri dodatni prodaji je korist prispevna marža.
3. **Sprostitev zaloge ali terjatev je enkratni denarni učinek**, ne letni prihranek. Koš `oneTimeCapital` se nikoli ne sešteva z letnimi.
4. **Tveganje se ne monetizira** brez verjetnosti in posledice. Koš `risk` nima EUR — namerno.
5. **Ista ura ali evro ne smeta v dve področji.** Kontrolni seznam podvajanj: zastoj in izgubljena prodaja istega dogodka · izmet in materialno odstopanje iste količine · dodelava in dodatne ure · reklamacija in servis istega primera · čakanje na material pri planiranju in nabavi · osnovna ura nadure in nadurni dodatek · sprostitev kapitala kot letna korist · odpis zaloge in ista postavka v stopnji držanja.
6. **Ni lažne natančnosti.** Kjer podjetje podatka nima, je pošten odgovor razpon ali »ne vem«, ne izmišljena številka. Jamstvo aplikacije se glasi: *»nobene številke si nismo izmislili«* — vsak predlog ga mora spoštovati.
7. **Panožni benchmark ni cilj podjetja** brez primerljivega modela poslovanja.

---

## 6. Shema in tehnične omejitve, ki jih mora predlog spoštovati

Predlog, ki jih krši, je neizvedljiv — recenzent ga mora popraviti ali ovreči.

- **Vrednosti so števila.** Vnos je `Record<string, number>`; `checkbox` je 0/1, `percent` je ulomek (0,03 = 3 %), prikaz × 100 dela widget.
- **Vrednosti izbir so zaporedni indeksi**, ne deleži — več možnosti si lahko deli isti naslovljivi delež, izid se poišče v tabeli. Enake vrednosti bi označile dva radia hkrati. Odstranitev sredinske možnosti premakne pomen shranjenih vrednosti.
- **Koši:** `directLoss` (trdi denar, ki odteka — naslovna kartica) · `lostMargin` (denar, ki ni prišel — ločena kartica, prenese ugovor »tega nakupa morda sploh ne bi bilo«) · `capacity` (vrednost sproščenega časa) · `oneTimeCapital` (enkratno) · `risk` (brez EUR).
- **`compute()` vrne dejanski sedanji strošek.** Naslovljivi delež in pas izboljšave uveljavi motor. Modul ne sme sam vračunati »deleža izboljšave«.
- **Vsako polje s `help` mora imeti tudi `explainer`** — to zahteva `explainers.test.ts`. Konvencija: `help` = meja proti sosednjim področjem (kratko, vedno vidno), `explainer` = izpeljava s številčnim primerom (za gumbom »?«).
- **`allowUnknown: true`** je za zneske, ki jih podjetje bodisi vodi bodisi ne. Brez njega neznanje tiho postane potrjena ničla, prodajnik pa izgubi iztočnico iz `unknownAnswers`.
- **`usesRevenue` / `usesMargin`** povesta, da modul uporablja prihodek oz. maržo iz koraka 5. Brez zastavice odgovor ne vstopa niti v oceno zanesljivosti.
- **Pogojnega prikaza modula ni.** V `ModuleDefinition` ni `showIf` — predlog »ta modul pokažemo samo podjetjem z X« zahteva novo zmožnost motorja in ga je treba označiti kot tak.
- **`plausibility.ts` sešteva polja z enoto `h/mesec` in `h/leto`** in jih primerja s kapaciteto zaposlenih. Zmnožek dveh polj (npr. št. okvar × trajanje) ji **uide** — novo urno področje potrebuje izrecno razširitev.
- **Nova zastavica ali polje v `SegmentContext`** zahteva tudi vnos v `BusinessProfile` in `emptyProfileFor`. Korak konteksta izriše natanko tri vprašanja — četrto zahteva razširitev sheme.
- **Novi stolpci v `exportRecord.ts` gredo na konec**, nikoli vmes.
- **Vsak nov modul potrebuje** vnos v `content/methodology.ts` (formula + utemeljitev za »Prikaži izračun«) in v `content/actions/actions.ts` (3 ukrepi) — brez slednjega ne more biti »največja postavka« z akcijskim načrtom.

---

## 7. Znane medsegmentne ugotovitve

Te so bile potrjene pri proizvodnji in **verjetno veljajo tudi drugod**. Vsak pregled naj jih izrecno preveri v svojem segmentu, ne prepiše.

| Ugotovitev | Kje preveriti |
|---|---|
| **Izgubljena marža v napačnem košu** — postavka gre v `directLoss`, čeprav obstaja koš `lostMargin` s svojo kartico. Potrjeno v `logistika.ts` (roki) in `storitve.ts` (terjatve). | `compute()` vsakega modula, ki meri odpovedana naročila ali nezasluženo prodajo |
| **Neničelni privzetki deležev**, ki ob vnosu osnove sami ustvarijo znesek | vsa polja `kind: 'percent'` s `default > 0` |
| **Diagnostika ustvari oceni tveganja brez enega klika** — privzetki dajo »srednje« tveganje obiskovalcu, ki se koraka ni dotaknil | `diagnostika*.compute` + `riskLevelFromScore` |
| **ZIERDED kljukica vidna samo strankam PANTHEON**, čeprav zakon velja za vsa podjetja; ICP nujnost bere izključno `values.E` | `legacy.ts` modul E, `isTechnicalRiskModuleVisible`, `icp.ts` urgency |
| **ICP kaznuje ne-PANTHEON leade** do 8/100 točk, ker jim modul E ni bil prikazan; `wasTechnicalRiskModuleShown` obstaja, a ICP je ne uporablja | `icp.ts` + `salesReport.ts` |
| **»Zamudne obresti« naštete v dveh horizontalah** (`financeHz.annualPenaltyEUR` in `dokumentiHz.annualDocDelayEUR`) — velja v vsakem segmentu, ki ima obe | `horizontal.ts` |
| **`dokumentiHz` vzrok »Potrjevanje ročno« je `planning` (65 %)**, čeprav je ročni prenos dokumentov `data` (75 %) — dva notranja precedensa temu nasprotujeta | `horizontal.ts` DOKUMENTI_CAUSES |
| **`timesheetHoursPerMonth` zajame operativno evidenco dela**, ne le prisotnosti — podvaja se s panožnimi moduli povsod, kjer se delo vpisuje na naloge, projekte ali stranke | `horizontal.ts` kadriHz |
| **Manjkajoči `allowUnknown`** na EUR poljih, ki jih podjetja pogosto ne vodijo ločeno | vsa polja `unit: 'EUR/leto'` |
| **Prihodek in marža vprašana, a neuporabljena** — segment ju ima v koraku 5, noben modul pa nima `usesRevenue`/`usesMargin` | `contexts/<segment>.ts` proti `<segment>.ts` |
| **`businessType` je mrtev podatek** — odgovor ne krmili ne triaže ne modulov, čeprav raziskave na modelu poslovanja gradijo celotno segmentacijo | `contexts/<segment>.ts` + `segments.ts` |

---

## 8. Delovni tok

Skript je pripravljen za `Workflow`. Zamenjaj `<...>` z vrednostmi iz razdelka 2 in obsegi iz razdelka 3.

```js
export const meta = {
  name: '<segment>-vprasalnik-audit',
  description: 'Podroben pregled vprašalnika <segment>: ohrani/izboljšaj/odstrani po vprašanjih',
  phases: [
    { title: 'Pregled', detail: 'šest pregledovalcev po področjih vprašalnika' },
    { title: 'Preverba', detail: 'skeptična preverba vsake ugotovitve ob kodi in raziskavi' },
  ],
}

const ROOT = '/Users/janpavlic/Documents/Datalab/aplikacije/ROI kalkulator'
const KB = '/Users/janpavlic/Documents/Datalab/reports/GPT baza znanja'
const RESEARCH = `${KB}/<mapa>/<raziskava>.md`
const SEGMENT = '<segment>'

const COMMON = `Si izkušen svetovalec za digitalizacijo slovenskih MSP in oblikovanje diagnostičnih
vprašalnikov. Delaš strokovni pregled ROI-kalkulatorja ("koliko denarja puščamo na mizi")
za dejavnost ${SEGMENT.toUpperCase()}.

OBVEZNO najprej preberi (Read; poti vsebujejo presledke):
1. "${ROOT}/src/config/modules/${SEGMENT}.ts" — panožni moduli (vprašanja + formule)
2. "${ROOT}/src/config/contexts/${SEGMENT}.ts" — kontekst, pasovi izboljšave, urne postavke
3. "${ROOT}/src/config/segments.ts" — sestava segmenta in komentarji o izpuščenih horizontalah
4. "${ROOT}/src/config/modules/moduleTypes.ts", "addressableShare.ts", "shared.ts"
5. "${ROOT}/src/lib/potential.ts", "moduleEngine.ts", "plausibility.ts"
6. "${ROOT}/src/lib/salesReport.ts", "salesPlaybook.ts" — kam gredo contextOnly odgovori
7. Raziskavo "${RESEARCH}" (beri po delih) — katalog bolečin z ID-ji, KPI slovar,
   finančni model s kontrolami proti podvajanju, diagnostični vprašalnik.

NALOGA: za VSAKO vprašanje v svojem obsegu izdaj sodbo:
- "ohrani" — dobro; povej, kaj varuje ali meri
- "izboljsaj" — konkretno novo besedilo + tip + enota + privzetek + help + explainer
- "odstrani" — ne prinaša vrednosti; povej, kaj se izgubi in zakaj je to sprejemljivo
- "premakni" — sodi v drug korak, modul ali koš; povej kam in zakaj
- "dodaj" — manjkajoče vprašanje ZNOTRAJ tvojega obsega

MERILA — uporabi vseh šest: (a) ali odgovor vstopa v izračun, in če je contextOnly, ali ima
prodajno vrednost; (b) odgovorljivost iz glave v 30 sekundah — je bolje vprašati po št.
dogodkov × čas na dogodek?; (c) meje dvojnega štetja, v obe smeri; (d) privzetki in enote —
ali privzetek ustvari znesek brez potrditve; (e) skladnost z raziskavo — navedi ID bolečine
ali poglavje; (f) ali bi bilo bolje vprašati prek KPI, ki ga podjetje že pozna.

TRDA PRAVILA, ki jih predlog ne sme kršiti: prihranek časa ni prihranek plače · prihodek ni
korist · sprostitev kapitala je enkratna · tveganje se ne monetizira · ista ura ali evro ne
smeta v dve področji · ni lažne natančnosti.

SHEMA: vrednosti so števila; vrednosti izbir so zaporedni indeksi; vsako polje s help mora
imeti tudi explainer (help = meja, explainer = izpeljava s primerom); pogojnega prikaza
modula (showIf) motor NIMA; nov modul potrebuje vnos v content/methodology.ts in
content/actions/actions.ts.

Vsak item: question (točno besedilo ali ključ polja); verdict; severity (visoka = vpliva na
znesek ali verodostojnost, srednja = na kakovost podatkov, nizka = kozmetika); rationale
(2–5 stavkov s sklicem file:line in na raziskavo); proposal (konkretno, v slovenščini; prazno
pri "ohrani"); researchRef.

Piši v slovenščini. Bodi izčrpen — NOBENO vprašanje iz tvojega obsega ne sme manjkati,
tudi dobro ne (to dobi "ohrani" z utemeljitvijo).`

const AREAS = [
  { key: 'koraki',   label: 'Koraki 1–5', scope: `TVOJ OBSEG: ...` },
  { key: 'modul-ab', label: '<modul A> + <modul B>', scope: `TVOJ OBSEG: ...` },
  { key: 'modul-cd', label: '<modul C> + <modul D>', scope: `TVOJ OBSEG: ...` },
  { key: 'modul-e',  label: '<modul E> + diagnostika + modul E', scope: `TVOJ OBSEG: ...` },
  { key: 'horiz',    label: 'Horizontale z vidika <segment>', scope: `TVOJ OBSEG: ...` },
  { key: 'vrzeli',   label: 'Manjkajoča področja', scope: `TVOJ OBSEG: ...` },
]

const FINDINGS_SCHEMA = {
  type: 'object', required: ['area', 'items'],
  properties: {
    area: { type: 'string' },
    items: { type: 'array', items: { type: 'object',
      required: ['question','verdict','severity','rationale','proposal','researchRef'],
      properties: {
        question: { type: 'string' },
        verdict: { type: 'string', enum: ['ohrani','izboljsaj','odstrani','premakni','dodaj'] },
        severity: { type: 'string', enum: ['visoka','srednja','nizka'] },
        rationale: { type: 'string' }, proposal: { type: 'string' }, researchRef: { type: 'string' },
      } } },
  },
}

const VERIFIED_SCHEMA = JSON.parse(JSON.stringify(FINDINGS_SCHEMA))
VERIFIED_SCHEMA.properties.items.items.required.push('status', 'correction')
VERIFIED_SCHEMA.properties.items.items.properties.status =
  { type: 'string', enum: ['potrjeno','popravljeno','ovrzeno'] }
VERIFIED_SCHEMA.properties.items.items.properties.correction = { type: 'string' }

function verifyPrompt(area, findings) {
  return `Si skeptičen recenzent. Dobil si ugotovitve pregleda področja "${area.label}".
Vsako ugotovitev poskusi OVREČI, preden jo potrdiš.

1. Preveri dejansko stanje v kodi (Read) — ali trditev v rationale drži DOBESEDNO,
   vključno s številkami vrstic? Napačne sklice popravi. POZOR: agenti pogosto opišejo
   stanje, ki v kodi ne obstaja več (privzetki, razponi, manjkajoči helpi, ki že obstajajo).
2. Preveri proti trdim pravilom raziskave. Predlog, ki jih krši, POPRAVI ali OVRZI.
3. Pri "odstrani" za contextOnly polja: ta polnijo prodajno poročilo — če ugotovitev tega
   ne upošteva, jo popravi ali ovrzi.
4. Pri "dodaj": ali formula podvaja obstoječi modul? Je vprašanje odgovorljivo iz glave?
   Spoštuje shemo (števila, zaporedni indeksi, help⇒explainer, ni showIf)?
5. Pri "izboljsaj": je predlog dovolj konkreten, da ga razvijalec izvede brez dodatnih
   odločitev? Če ne, ga konkretiziraj.

Vrni VSE iteme (tudi ovržene) s status in correction. Piši v slovenščini.

UGOTOVITVE:
${JSON.stringify(findings, null, 2)}`
}

const results = await pipeline(
  AREAS,
  (a) => agent(COMMON + '\n\n' + a.scope,
    { label: 'pregled:' + a.key, phase: 'Pregled', schema: FINDINGS_SCHEMA }),
  (f, a) => agent(verifyPrompt(a, f),
    { label: 'preverba:' + a.key, phase: 'Preverba', schema: VERIFIED_SCHEMA, effort: 'high' }),
)

return { areas: results.filter(Boolean) }
```

### Če delovni tok pade na omejitvi seje

Rezultati končanih agentov so shranjeni. Nadaljuj z:

```
Workflow({ scriptPath: "<pot iz izpisa>", resumeFromRunId: "<runId iz izpisa>" })
```

Nedotaknjeni agenti se vrnejo iz predpomnilnika, na novo tečejo samo padli. Deluje **samo v isti seji**.

---

## 9. Branje rezultata

Izhod je velik (~200 kB) in ga ni mogoče prebrati naenkrat. Postopek:

```bash
python3 -c "
import json
d = json.load(open('<pot do .output>'))
for a in d['result']['areas']:
    print('='*90); print(a['area'])
    for i in a['items']:
        print(' -', i['verdict'].upper().ljust(9), i['severity'].ljust(7),
              i['status'].ljust(11), i['question'][:95])
"
```

Nato po področjih izpiši podrobnosti (`rationale`, `proposal`, `correction`) v datoteko v delovni imenik in jo preberi z `Read`.

**Ovržene iteme izloči iz končnega pregleda**, a v poročilu povej, koliko jih je bilo in zakaj — to je merilo kakovosti pregleda, ne sramota.

---

## 10. Oblika končnega poročila

1. **Bilanca** — koliko ohrani / izboljšaj / dodaj / premakni / odstrani; koliko potrjeno / popravljeno / ovrženo.
2. **Deset ugotovitev z največjo težo** — samo `severity: visoka`, urejene po vplivu na znesek in verodostojnost.
3. **Koraki 1–5, vprašanje po vprašanju** — tabela sodba + kaj narediti.
4. **Panožni moduli in diagnostika** — po modulih, vsako polje s sodbo.
5. **Horizontale** — strnjeno; »ohrani« naštej, podrobno le izboljšave.
6. **Manjkajoča področja** — ločeno »dodaj zdaj«, »dodaj kmalu«, **»NE dodajaj zdaj«** z razlogi. Zadnja skupina je obvezna: pregled, ki predlaga vse, ni pregled.
7. **Kaj je pregled ovrgel** — z vzorcem, zakaj (npr. »koda je bila boljša od spomina«).
8. **Predlagan vrstni red izvedbe** — od poceni in takoj vidnega do novih področij.

---

## 11. Kaj se je pri prvem pregledu izkazalo za pomembno

- **Skeptična preverba se izplača.** Od 115 sodb so bile 3 ovržene in 94 popravljenih v podrobnostih — večinoma napačni sklici na vrstice, nekajkrat pa opis stanja, ki v kodi ne obstaja več. Brez preverbe bi tretjina predlogov ciljala mimo.
- **Daj agentom pravo pot.** Napačna pot je edini razlog, da so bili trije predlogi »popravi to« dejansko »to je že popravljeno«.
- **Zahtevaj sodbo za vsako vprašanje, tudi dobro.** Brez tega agenti poročajo samo probleme in pregled izgubi merilo, kaj se ne sme spreminjati.
- **Zahtevaj skupino »ne bi dodal«.** Pri proizvodnji so trije od desetih paketov padli v to skupino z dobrimi razlogi (SMED je fizična disciplina, ki je ERP ne odpravi; kooperantske evre že meri drugo področje; tveganja odpoklica se ne monetizira).
- **Verdikt »premakni« je pogosto najcenejši popravek z največjim učinkom** — prestavitev postavke v pravi koš je ena vrstica, spremeni pa, kako se znesek brani pred ugovorom.
