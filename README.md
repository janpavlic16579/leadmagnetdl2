# LM-10 — Kalkulator "Koliko vas stane sedanji način dela?"

Interaktivni kalkulator skritih stroškov sedanjega načina dela. Obiskovalec vnese 4–8 realnih številk in
takoj — še **pred** vnosom e-naslova — dobi razčlenjen letni izračun z razkrito metodologijo.

## Zagon

```bash
npm install
npm run dev
```

| Ukaz | Kaj naredi |
|---|---|
| `npm run dev` | razvojni strežnik (`http://localhost:5173`) |
| `npm run test` | unit testi formul (validacijski primeri iz specifikacije) |
| `npm run build` | produkcijski build |

## Segmenti

Segment se izbere prek URL parametra `?s=`; brez njega se prikaže izbirnik.

| URL | Segment | Aktivni moduli |
|---|---|---|
| `?s=proizvodnja` | Proizvodnja 10–249 zap. | A, B, C, E |
| `?s=trgovina` | Veleprodaja / logistika | A, B, C, D, E |
| `?s=racunovodstvo` | Računovodski servis | A, E |
| `?s=splosno` | Direktor / CFO | A, C, D, E |

Podprt je tudi `?utm_source=` — vir se zapiše v izvozni zapis.

## Moduli

- **A — ročno delo:** `(dokumenti/mesec × minute / 60) × EUR/h × 12`
- **B — napake:** `transakcije/mesec × % napak × strošek napake × 12`
- **C — vezan kapital v zalogah:** enkraten sproščen kapital `zaloge × % znižanja` in letni prihranek
  `sproščen kapital × % stroška kapitala`. **Ti dve številki se nikoli ne seštevata** — v skupno letno
  izgubo šteje samo letni prihranek.
- **D — počasen denarni tok:** `(prihodki / 365) × dni skrajšanja × obrestna mera`
- **E — tvegani stroški:** ni v EUR; vrne opozorila z datumi (SQL Server 2016, Windows Server 2016, ZIERDED).

Pri segmentu `racunovodstvo` modul A ne prikazuje EUR kot glavne številke, ampak **kapaciteto**
(sproščene ure ÷ 8 h na stranko = dodatne stranke); EUR je sekundarni prikaz.

## Kje kaj urejati

| Kaj | Datoteka |
|---|---|
| Segmenti, privzete vrednosti, besedila vprašanj, pragovi | `src/config/segments.ts` |
| Formule | `src/lib/calculations.ts` |
| Izbor follow-up sekvence | `src/lib/followUp.ts` |
| "3 ukrepi ta teden" (vsebina) | `content/actions/actions.ts` |
| Razlage metodologije | `content/methodology.ts` |

Dodajanje novega segmenta = nov vnos v `SEGMENTS`, brez spreminjanja logike.

## Zaupanjska zasnova

Ves izračun teče v brskalniku. Nič poslovnih podatkov ne zapusti naprave, dokler uporabnik sam ne odda
obrazca — to je na strani tudi izrecno napisano.

## Namesto CRM integracije

Datalab (še) nima znanega CRM API-ja, zato oddaja obrazca **ne kliče strežnika**. Namesto tega sproži
prenos treh datotek: PDF poročilo, JSON in CSV zapis z vsemi polji za ročni uvoz v CRM (segment,
velikostni razred, vsi vnosi, izračuni po modulih, označena E-tveganja, follow-up sekvenca, UTM vir).

Follow-up sekvence se **ne pošiljajo** — `selectFollowUpSequence()` samo izračuna, v katero sekvenco
zapis sodi, da je logika pripravljena, ko bo integracija na voljo.

## Odprta vprašanja pred objavo

1. Kateri CRM in ali ima API/webhook za lead s custom polji.
2. Kdo interno potrdi privzete vrednosti (25 EUR/h, 10 % strošek kapitala, 5 % znižanje zalog) — bodo javno vidne.
3. Domena: samostojna landing stran ali podstran datalab.si.
4. Strokovna potrditev besedil "3 ukrepov".
5. Ponudba "15-min pregled s svetovalcem" — kdo izvaja in kakšna je kapaciteta (brez odgovora se ne obljublja).

Pragovi za "visoko izgubo" v `src/config/segments.ts` so **začetne ocene** — kalibrirati jih je treba po
prvih ~50 vnosih.

## Namerno izven obsega (faza 2)

Benchmark proti vrstnikom (potrebna pravna presoja), prava CRM/e-mail integracija, lokalizacija HR/RS/BA.
