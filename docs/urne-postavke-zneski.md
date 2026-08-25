# Urne postavke: trenutni zneski in zneski po raziskavi

Delovni list za implementacijo. Vsebuje **samo številke** — kaj je zdaj v kodi in kaj pravi
raziskava. Izpeljave tu ni; ta je v
[`urne-postavke-raziskava-2026-08.md`](urne-postavke-raziskava-2026-08.md), kaj velja kot
referenca pa pove [`urne-postavke.md`](urne-postavke.md).

Stanje kode: **25. avgust 2026**, po kalibraciji `bb04776`.

> **Zakaj ta list obstaja.** Druga preverba (24. 8.) je ugotovila, da formula
> `(bruto × 12 × 1,171 + 4.787) / 1.700` **podceni izmerjeni strošek dela za 12,4 %**.
> Napaka je bila obidena — privzetki so nastavljeni kot sredina med formulo in meritvijo —
> ne pa odpravljena. Formula je zato še vedno v pojasnilu, ki ga bere obiskovalec, in v
> glavi referenčnega dokumenta.

---

## 1. Parametri formule

| Člen | Zdaj v kodi | Po raziskavi | Sprememba |
|---|---|---|---|
| Prispevki delodajalca | 17,10 % | 17,10 % | — |
| Dodatki (regres, malica, prevoz) | 4.787 € | **5.960 €** | +24,5 % |
| Opravljene ure na leto | 1.700 | **1.571** | −7,6 % |

Vir za oba popravljena člena: nacionalni računi 2025 (D.1 37.194 mio € / 1.375.222 tisoč ur
/ 875,3 tisoč zaposlenih). Razčlenitev je v razdelku 2 raziskave.

---

## 2. Zneski, ki iz parametrov sledijo

| Znesek | Zdaj | Po raziskavi | Sprememba |
|---|---|---|---|
| Primer v pojasnilu (bruto 2.100 €) | ~20 €/h | **~22,6 €/h** | +11,9 % |
| Delitelj v pojasnilu | ~140 ur/mesec | **~131 ur/mesec** | −6,4 % |
| Polni strošek ure na minimalni plači | 15,07 €/h | **17,05 €/h** | +13,1 % |
| Kontrola: povprečna plača 2.536 € | 23,78 €/h | **26,48 €/h** | meritev je 27,05 |

Popravljena formula se meritvi približa na ~2 % (26,48 proti 27,05); trenutna zgreši za
12,4 %.

Manjše neskladje ob strani: `urne-postavke.md:107,110` navaja dno **15,07 €/h**, raziskava
pa **15,06 €/h**. Razlika je zaokroževanje in ni vplivala na noben pas.

---

## 3. Privzetki — sprememb ni

Vseh devet je nastavila kalibracija 24. 8. iz izmerjenih podatkov. **Ne spreminjaj jih** —
tabela je tu zato, da je jasno, česa se ni treba dotakniti.

| Vprašanje | Zdaj | Po raziskavi |
|---|---|---|
| Proizvodnja, operativna ura | 21 | enako |
| Logistika, operativna ura | 20 | enako |
| Veleprodaja, operativna ura | 20 | enako |
| Maloprodaja, operativna ura | 19 | enako |
| Storitve, izvedbena ura | 29 | enako |
| Računovodstvo, operativna ura | 25 | enako |
| Splošno, operativna ura | 20 | enako |
| Administrativna ura (skupna) | 26 | enako |
| Računovodstvo, vodstvena ura | 33 | enako |
| Storitve, zaračunana postavka | 55 | enako |
| `DEFAULT_COST_CONTEXT` (operativna / admin / zaračunana) | 20 / 26 / 55 | enako |

---

## 4. Pasovi — premakne se samo dno

Meje pasov so kvartili dejanske porazdelitve plač in ostanejo. Premakne se **spodnja meja
prvega pasu s 15 na 17 €**, ker je 15 € izpeljanih iz podcenjujoče formule in zato zdaj
leži pod polnim stroškom ure delavca na minimalni plači.

| Nabor (datoteka) | Zdaj | Po raziskavi |
|---|---|---|
| `PRODUCTION_HOUR_BANDS` (proizvodnja.ts) | 15–17 · 17–20 · 20–25 · 25–33 | ⚠ 17–17 · 17–20 · 20–25 · 25–33 |
| `OPERATIONAL_HOUR_BANDS` (logistika.ts) | 15–17 · 17–19 · 19–23 · 23–30 | ⚠ 17–17 · 17–19 · 19–23 · 23–30 |
| `WHOLESALE_HOUR_BANDS` (trgovina.ts) | 15–17 · 17–19 · 19–23 · 23–30 | ⚠ 17–17 · 17–19 · 19–23 · 23–30 |
| `SHOP_HOUR_BANDS` (maloprodaja.ts) | 15–17 · 17–20 · 20–24 · 24–31 | ⚠ 17–17 · 17–20 · 20–24 · 24–31 |
| `OPERATIONAL_HOUR_BANDS` (splosno.ts) | 15–17 · 17–19 · 19–23 · 23–30 | ⚠ 17–17 · 17–19 · 19–23 · 23–30 |
| `OPERATIONAL_HOUR_BANDS` (racunovodstvo.ts) | 15–19 · 19–24 · 24–30 · 30–40 | **17**–19 · 19–24 · 24–30 · 30–40 |
| `DELIVERY_HOUR_BANDS` (storitve.ts) | 15–22 · 22–28 · 28–35 · 35–46 | **17**–22 · 22–28 · 28–35 · 35–46 |
| `ADMIN_HOUR_BANDS` (shared.ts) | 15–20 · 20–25 · 25–31 · 31–41 | **17**–20 · 20–25 · 25–31 · 31–41 |
| `CHARGE_OUT_BANDS` (storitve.ts) | 30–42 · 42–60 · 60–85 · 85–130 | enako — cena, ne strošek |

⚠ **Pri petih naborih se prvi pas skrči na nič** (15–17 → 17–17), ker je njegova zgornja meja
prav 17. Teh pet ni mehanski popravek — glej odprto točko spodaj.

Tri nabori (računovodstvo, storitve, administrativna ura) imajo prvi pas širši od 17 in se
popravijo z eno številko.

---

## 5. Kje kaj popraviti

| Kaj | Datoteka in vrstica | Iz | V |
|---|---|---|---|
| Delitelj in primer v pojasnilu | `src/config/contexts/shared.ts:48–49` | 140 ur/mesec, 1.700 ur, primer 20 €/h | 131 ur/mesec, 1.571 ur, primer 22,6 €/h |
| Delitelj v pojasnilu za admin uro | `src/config/contexts/shared.ts:54` | 140 ur/mesec | 131 ur/mesec |
| Formula v glavi reference | `docs/urne-postavke.md:31` | `+ 4.787) / 1.700` | `+ 5.960) / 1.571` |
| Tabela členov | `docs/urne-postavke.md:37–38` | 4.787 € · 1.700 | 5.960 € · 1.571 |
| Izračun dna | `docs/urne-postavke.md:107,110` | 15,07 €/h | 17,05 €/h |
| Opis postavke | `README.md:408` | »približno 1.700 produktivnimi urami« | »približno 1.571 opravljenimi urami« |
| Spodnja meja pasov | `src/config/contexts/*.ts` (8 naborov) | `minEUR: 15` | `minEUR: 17` |

Razdelka `docs/urne-postavke.md:58–78` (razčlenitev dodatkov) in `:81–102` (izpeljava
delitelja) neskladje že opisujeta — po popravku glave ju je treba prebrati in uskladiti,
da ne opisujeta obeh vrednosti hkrati.

---

## 6. Odprti odločitvi pred izvedbo

**A. Pet naborov, kjer prvi pas odpade.** Možnosti: zliti prva dva v enega (logistika bi
dobila `17–19 · 19–23 · 23–30`, torej tri pasove namesto štirih), ali potegniti nov rez
znotraj obstoječega razpona in ohraniti štiri. Prva možnost je poštenejša — če dejanska
porazdelitev pod 17 € nima mase, četrti pas ni vsebina, ampak videz natančnosti.

**B. Ali privzetke preračunati.** Trenutni so sredina med »potjo A« (formula) in »potjo B«
(meritev). Če pot A popravimo, se sredina premakne navzgor in delno razveljavi znižanje z
24. 8. To bi bila tretja kalibracija v enem mesecu; ta list je zato **ne predlaga**, jo pa
zabeleži, ker je logična posledica popravka.

Test `src/config/contexts/contexts.test.ts` po obeh spremembah zahteva, da privzetek leži v
**natanko enem** pasu in da so sredine pasov znotraj vprašanja različne.

---

## 7. Opozorilo: zastarel zapisnik

[`urne-postavke-raziskava-2026.md`](urne-postavke-raziskava-2026.md) (18. 8.) vsebuje dve
napaki, ki ju je druga preverba ovrgla:

1. domnevo, da novejših plač po poklicih od leta 2022 ni — SURS je 16. 4. 2026 objavil
   tabelo `0711360S` za oktober 2025;
2. sidra iz povprečja **vseh** sektorjev, čeprav javni sektor povprečje dvigne za 8,4 % in
   ciljno podjetje kalkulatorja je zasebno MSP.

Njegovih zneskov ne uporabljaj za implementacijo. Ostaja kot zapis prve preverbe.
