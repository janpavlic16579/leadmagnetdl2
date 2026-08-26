# Zunanja sidra za koeficiente kalkulatorja: koristi ERP in strošek kapitala

Zapisnik spletne preverbe, **25. avgust 2026**. Namen: vsakemu mehkemu koeficientu
kalkulatorja (naslovljivi deleži, sprostljivi deleži zaloge, strošek kapitala, maloprodajna
izgubljena prodaja) dati **zapisan zunanji vir**, po istem vzorcu, kot sta ga urnim
postavkam in maržam dala `urne-postavke-raziskava-2026-08.md` in
`prispevne-marze-raziskava-2026-08.md`. Uporablja ga
[POROCILO-optimizacija-client-reporta.md](../navodila/client-report/POROCILO-optimizacija-client-reporta.md).

Pravilo branja: **primarno preverjeni viri** (PDF prebran neposredno) so označeni s ✓;
vendorski ali sekundarni viri so izrecno označeni in se pred CFO ne uporabljajo sami.
Kjer trdnega vira ni, je to zapisano — takih številk v kalkulator ne prenašamo.

---

## A. Izmerjene koristi uvedbe ERP

### A1. Znižanje zalog (→ `REDUCIBLE_SHARES`, `shared.ts:120`)

| Metrika | Razpon | Sidro za kalkulator | Vir |
|---|---|---|---|
| Znižanje stroškov zalog po uvedbi ERP, srednje velika proizvodna podjetja | 13,4–25,0 % po ponudnikih; **povprečje 17,2 %** | 10–15 % (konservativno) | ✓ Aberdeen Group, *The Total Cost of ERP Ownership in Mid-Size Companies* (Jutras), 2007, tabela 7; anketa 1.680 podjetij |
| Delež podjetij, ki so pričakovano korist pri zalogah dosegla | 56–63 % | ~60 % | ✓ Panorama Consulting, *2026 ERP Report* str. 21; *2024 ERP Report* str. 22 |

Posledica: današnji "Ne vem" → 0,05 pomeni **polovico spodnje meje** konservativnega
benchmarka; 0,10 je spodnji rob izmerjenega razpona in ostane pod povprečjem 17,2 %.

### A2. Administrativni in operativni stroški (→ naslovljivi deleži, teaser za neizmerjena področja)

| Metrika | Razpon | Sidro | Vir |
|---|---|---|---|
| Znižanje administrativnih stroškov | 9,3–21,4 %; **povprečje 13,3 %** | 10 % | ✓ Aberdeen 2007, tabela 7 |
| Znižanje proizvodno-operativnih stroškov | 11,0–18,1 %; **povprečje 13,1 %** | 10 % | ✓ Aberdeen 2007, tabela 7 |
| Podjetja z realizirano koristjo "produktivnost in učinkovitost" | **87,3 %** (2026); 90,4 % (2024) | ~85 % | ✓ Panorama 2026/2024 |
| Prihranek časa finančnega osebja; mesečno zapiranje | +10 % produktivnosti FTE; **−55 % časa zapiranja** | 8–10 % | Forrester TEI za MS Dynamics 365 BC, 2023 — **naročnik vendor**, samo kot sekundarna opora |

Opozorilo: Panoramin zgodovinski "~11 % znižanja operativnih stroškov" v primarnih
poročilih 2024/2026 **ni več potrjen** (poročila merijo delež podjetij z realizirano
koristjo, ne odstotka prihranka). Čistejši sklic je Aberdeen 13,1/13,3 %.

### A3. Ročna obdelava dokumentov (→ naslovljivi delež `data`)

| Metrika | Razpon | Sidro | Vir |
|---|---|---|---|
| Strošek obdelave enega prejetega računa | povpr. **10,18 USD**, best-in-class 2,78 USD | ročno ~10 EUR → avtomatizirano ~3 EUR | Ardent Partners, *State of ePayables 2024* / *AP Metrics That Matter* |
| Prihranek procesa ob e-fakturiranju | **60–80 %** | −60 % | Billentis (Koch), *The e-invoicing journey 2019–2025* |
| Čas obdelave strukturiranega e-računa proti PDF/papirju | **~88 % manj** | −60/70 % | Politecnico di Milano, citirano v Billentis 2026 |
| Cikel obdelave računa | 14,6 dni ročno → 3–5 dni | −50 % | Levvel Research, *2020 Payables Insight Report* |

Ročni prenosi podatkov so torej edini problemski razred z izmerjeno odpravljivostjo
**60–88 %** — naslovljivi delež `data` = 0,75–0,80 leži znotraj tega, ne nad tem.

### A4. Dobave, plan, napake (→ deleža `planning` in `external`)

| Metrika | Razpon | Sidro | Vir |
|---|---|---|---|
| Izboljšanje popolnih in pravočasnih dobav | +12,8 do +28,8 %; **povpr. +16,9 %** | +10–15 % | ✓ Aberdeen 2007 |
| Skladnost s proizvodnim planom | +15,2 do +21,3 %; **povpr. +17,2 %** | +15 % | ✓ Aberdeen 2007 |
| Znižanje izmeta (scrap) | 20–40 % samo v vendorskih študijah | **brez trdnega vira — ne uporabljati** | — |
| Učinek ERP na DSO | −41 % ob visoki avtomatizaciji terjatev | 10–20 %, previdno | Vanson Bourne za Billtrust — **naročnik vendor** |

### A5. Prazne police v maloprodaji (→ `modules/maloprodaja.ts`, postavka praznih polic)

Vse iz ene, javno dostopne in primarno prebrane študije:
✓ **Gruen & Corsten, *A Comprehensive Guide to Retail Out-of-Stock Reduction in the FMCG
Industry*, 2007/08** (GMA/FMI/NACDS; nadgradnja Corsten & Gruen 2003, 72.000 kupcev):

| Metrika | Vrednost |
|---|---|
| Povprečna stopnja OOS (artikel ni na voljo) | **8,3 % svetovno, 8,6 % Evropa** |
| Odziv kupca ob prazni polici | kupi drugje 31 % · zamenja artikel 26 % + 19 % · odloži 15 % · ne kupi 9 % |
| V trgovini ostane (substitucija + vrnitev) | **~45–60 %** nakupov |
| **Neto izguba trgovca** | **~4 % letnega prometa** (globalno 3,9 %) |
| Delež vzrokov OOS na ravni trgovine (naročanje, napovedovanje, police) | **72 %** (upstream le 28 %) |
| Dosegljivo znižanje OOS z disciplino naročanja in polic | **~40 %** |
| Točnost knjižnih zalog brez discipline | le 32–45 % artiklov; točno stanje prepolovi OOS (4,1 % proti 8,9 %) |

Posledice za kalkulator:
- neto izguba ~4 % prometa je **nad** največjo vrednostjo, ki jo današnji vnos sploh dopušča
  (drsnik do 3 %, nato še ×(1 − substitucija));
- 72 % vzrokov na ravni naročanja/polic neposredno podpira naslovljiva deleža
  `planning` (0,65–0,70) in `data` (0,75–0,80) ter nizko vlogo `external` (upstream 28 %);
- −40 % OOS z boljšim naročanjem → zagovorljiv prihranek **~1,5 % prometa**
  (konservativno 1 %).

### A6. Doba povračila ERP projekta (→ tabela povračila v PDF)

| Metrika | Razpon | Sidro | Vir |
|---|---|---|---|
| Tipičen payback ERP | **1,5–3 leta**; 35 % podjetij povrne v 3 letih, 15 % v 2 | "tipično 2–3 leta" | ✓ Panorama, *2015 ERP Report*; *2013 ERP Report* |
| Projekt v/pod proračunom · pravočasno · mediana trajanja | 70,0 % · 77,6 % · 9 mesecev | — | ✓ Panorama, *2026 ERP Report* str. 4, 23, 25 |
| Podjetja, ki dosežejo ROI pričakovanja | **83 %** | 80 % | Panorama *2023 ERP Report* (sekundarno citirano) |
| Payback e-fakturiranja | **0,5–1,5 leta** | 1 leto | Billentis 2019–2025 |
| Donos ERP | 7,23 USD na 1 USD | samo kontekst, ne obljuba | Nucleus Research, 2014 |

### A7. Strošek držanja zalog (→ postavka financiranja presežne zaloge)

| Metrika | Razpon | Sidro | Vir |
|---|---|---|---|
| Letni strošek držanja zalog (kapital + prostor + zavarovanje + zastaranje + kalo) | **15–30 %** vrednosti zaloge | **18–20 %** | APICS/ASCM (15–25 % oz. 20–30 %); CSCMP *State of Logistics* (dno 19,1 %) |
| Delež kapitala v tem strošku | 40–60 % | — | Lokad, *Inventory costs* |

Kalkulator od tega danes zaračuna samo kapital (6 %). Ker so odpisi/zastaranje ločena
postavka, dvojnega štetja z dvigom kapitala na 8 % ni; morebitna razširitev na "kapital +
prostor + zavarovanje" (~12 %) je možna samo kot ločeno označena vrstica in ob preverbi,
da prostor ni štet drugje.

---

## B. Strošek kapitala slovenskega MSP, avgust 2026 (→ `RECEIVABLES_CAPITAL_COST`, `fallback: 0.06`)

### B1. Dolžniška spodnja meja

| Metrika | Vrednost | Vir |
|---|---|---|
| Slovenija, nova posojila nefinančnim družbam | ~3,5–3,7 % (okt. 2025) | Banka Slovenije, *Informacija o poslovanju bank*, dec. 2025, str. 13 |
| Evroobmočje, **mala posojila ≤ 250k EUR** (tipično MSP) | **3,91 %** (jun. 2026), trend navzgor | ECB MIR, junij 2026 |
| ECB: mejni depozit / MRO | 2,25 % / 2,40 % — **dvig** +25 b. t. junija 2026 | ECB, Key interest rates |
| EURIBOR 3M | 2,54 % (24. 8. 2026) | euribor-rates.eu |
| SAFE: pogoji financiranja MSP | **zaostrovanje**: neto +43 % MSP poroča višje obresti (Q2 2026), +37 % višje provizije (Q1) | ECB SAFE 2026 |
| Ocena posojilne mere slovenskega MSP avg. 2026 | **≈ 4,0–4,5 %** | izpeljava iz obeh vrstic zgoraj |

### B2. WACC — pravilna mera za vezan obratni kapital

| Metrika | Vrednost | Vir |
|---|---|---|
| Povprečni WACC vseh panog (DACH, ~300 podjetij) | **8,5 %** (2025); industrija 9,4 % | KPMG, *Cost of Capital Study 2025* |
| WACC evropskih MSP z velikostno premijo | **10–14 %** večina sektorjev | Damodaran (jan. 2026) + Argos premija, prek ValorSME |
| Velikostna premija za malo nekotirajoče podjetje | +3–5 o. t. na strošek lastniškega kapitala | Kroll / Duff & Phelps |
| Konvencija v business case izračunih | obratni kapital se vrednoti po **WACC**, ne po posojilni meri; kapital je 40–60 % stroška držanja zalog | Lokad; standardna praksa |
| Faktoring v Sloveniji (tržna cena denarja v terjatvah) | efektivno **~6–12 % letno** (provizija 0,5–2,5 % na račun + 6M EURIBOR + pribitek + limitna nadomestila) | tarifa Banka Sparkasse 2025; SPOT; A.B.S. Factoring |

### B3. Sklep

Sedanjih 6 % ni zgornja meja, ampak konservativna sredina med dolgom (~4 %) in WACC
(8,5–14 %). **Najvišja pred CFO še udobno branljiva vrednost je 8 %** (ozek razpon 8–9 %):
brani se s KPMG povprečnim WACC 8,5 % — ki za malo nekotirajoče podjetje še ne vsebuje
velikostne premije — sekundarno s ceno faktoringa in s SAFE trendom zaostrovanja. Nad
~9–10 % bi CFO upravičeno izpodbijal. Priporočilo: **6 % → 8 %**, v pojasnilu polja
"oportunitetni strošek = strošek kapitala podjetja (WACC, povpr. 8,5 %); posojilna spodnja
meja ~4 %". Lastni pasovi vprašanja (do 18 %, sredina tretjega pasu 10 % —
`contexts/maloprodaja.ts:161`) ostanejo nespremenjeni.

---

## C. Sinteza: kateri koeficient nosi kateri vir

| Koeficient v kodi | Zdaj | Predlog | Primarna obramba |
|---|---:|---:|---|
| `ADDRESSABLE_SHARE.data` (`addressableShare.ts:43`) | 0,75 | 0,80 | Billentis 60–80 % prihranka procesa; Politecnico −88 % časa (A3) — 0,80 je zgornji rob, prvi za umik ob izpodbijanju |
| `ADDRESSABLE_SHARE.planning` | 0,65 | 0,70 | Gruen & Corsten: 72 % vzrokov OOS na ravni naročanja/polic; Aberdeen +17 % skladnost plana (A4, A5) |
| `ADDRESSABLE_SHARE.people` | 0,45 | 0,50 | posredno: Panorama 87 % realizacije produktivnosti; sistemsko vodeni postopki — **presoja, ne meritev** (označiti v komentarju) |
| `ADDRESSABLE_SHARE.external` | 0,25 | 0,30 | Gruen & Corsten: upstream le 28 % vzrokov; zgodnejši signal — skromen dvig |
| `ADDRESSABLE_SHARE.physical` | 0,15 | 0,15 | brez vira za dvig (izmet: samo vendorske študije) — ne dvigati |
| `ADDRESSABLE_SHARE.unknown` | 0,30 | 0,45–0,50 | sinteza A2–A4: ERP naslovi 50–70 % transakcijskega dela, pred CFO ~50 %; plus tehtano povprečje realnih odgovorov (~0,6) |
| `REDUCIBLE_SHARES` "Ne vem" (`shared.ts:120`) | 0,05 | 0,10 | Aberdeen −17,2 % povpr. (13,4–25 %); 0,10 = spodnji rob (A1) |
| `REDUCIBLE_SHARES` "> 20 %" | 0,22 | 0,25 | strankin lasten odgovor ("več kot 20"); Aberdeen zgornji rob 25 % |
| `RECEIVABLES_CAPITAL_COST` + `fallback: 0.06` (`shared.ts:27`) | 6 % | 8 % | KPMG WACC 8,5 %; faktoring 6–12 %; SAFE zaostrovanje (B) |
| Maloprodaja: izgubljena prodaja (`maloprodaja.ts:109`) | privzeto 0, strop 3 % | pasovi z benchmark privzetkom ~1,5 % neto | Gruen & Corsten: neto ~4 % prometa; −40 % OOS dosegljivo → prihranek ~1,5 % (A5) |

## Kdaj preveriti znova

- Panorama izda nov letni ERP Report (vsako pomlad) — deleži realizacije koristi;
- ECB MIR/SAFE pokažeta premik posojilnih mer za > 1 o. t. ali KPMG nov WACC;
- po prvih ~50 vnosih kalkulatorja: porazdelitev glavnih vzrokov (za `unknown`),
  porazdelitev pasov zaloge in prihodkov — lastna empirija ima prednost pred benchmarki;
- Aberdeen 2007 je metodološko soliden, a star — če se pojavi novejša neodvisna meritev
  odstotkov (ne deležev podjetij), zamenja sidro A1/A2.
