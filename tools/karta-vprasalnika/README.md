# Karta vprašalnika

Orodje, ki iz konfiguracije kalkulatorja zgradi eno samostojno HTML stran z interaktivno karto
celotnega vprašalnika — vsa vprašanja, odgovori, triažne ocene in koši, od izbire dejavnosti prek
obrazca s kontaktom do rezultatov.

**To ni del aplikacije.** Kalkulator te mape ne uvaža in zanjo ne ve; odvisnost gre samo v eno
smer — orodje bere `src/config/**`, nikoli obratno.

## Poganjanje

Dva ukaza iz korena repozitorija:

```bash
npx tsx tools/karta-vprasalnika/extract.ts
```

```bash
node tools/karta-vprasalnika/build-diagram.mjs
```

Prvi prebere konfiguracijo in zapiše `questionnaire.json`, drugi iz njega sestavi
`diagram-vprasalnika.html`. Obe datoteki nastaneta v tej mapi in nista v gitu.

`tsx` je potreben, ker konfiguracija uvaža brez končnic (`./segmentTypes`), česar Node z
`--experimental-strip-types` ne razreši. Namenoma ni med `devDependencies` aplikacije, da orodje
ne poseže v njene odvisnosti in v `npm ci` na CI.

## Kaj je kje

| Datoteka | Vloga |
|---|---|
| `extract.ts` | prebere `src/config/**` in izpiše strukturo vprašalnika v JSON |
| `build-diagram.mjs` | iz JSON-a sestavi celo stran: postavitev, slog, iskanje, filtre in povezave |

Vsebina karte ni nikjer napisana na roko — vprašanja, odgovori in koši se preberejo iz
konfiguracije, zato je karta ob vsakem poganjanju točna. Ročno napisani so le postavitev, slog in
interakcije, vsi v `build-diagram.mjs`.

Koše, v katere posamezen modul vrača, `extract.ts` ugotovi tako, da vsakemu modulu pokliče
`compute()` z vzorčnim vnosom in pogleda, kaj vrne. Zato se seznam košev ne more razhajati s
formulami — ni druge evidence, ki bi jo bilo treba vzdrževati.

## Kontrola ob gradnji

`build-diagram.mjs` primerja izrisano s konfiguracijo in se ustavi ob razhajanju: število polj,
triažnih vprašanj, kontekstnih vprašanj, modulov in vozlišč z iskalnim indeksom. Pričakovanja se
izpeljejo iz konfiguracije in ne iz vpisanih števil, zato kontrola lovi izpad pri izrisu, ne pa
spremembe vprašalnika — ta se sme spreminjati, ne da bi bilo treba popravljati skripto.

Ob spremembi vprašalnika je torej dovolj pognati oba ukaza; števila v glavi strani in razpon
»obiskovalec vidi N–M« se posodobijo sama.

## Razmerje do gradnje aplikacije

Mapa je namenoma zunaj vseh poti aplikacije:

| Orodje | Zajame to mapo | Zakaj |
|---|---|---|
| `npm run build` (`tsc -b && vite build`) | ne | `tsconfig.app.json` vključuje le `src` in `content`; vhod za Vite je le korenski `index.html` |
| `npm run test` (vitest) | ne | privzeti vzorec lovi le `*.test.*` in `*.spec.*` |
| `npm run lint` (oxlint) | da | oxlint prečeše cel repozitorij; obe skripti morata ostati brez opozoril |

Cena te ločitve je, da se tipi v tej mapi **ne preverjajo** — `tsc -b` je ne vidi. V zameno
orodje ne more podreti gradnje aplikacije.

## Objava

### GitHub Pages

<https://janpavlic16579.github.io/leadmagnetdl/karta/>

Karto zgradi CI ob vsaki objavi — korak »Zgradi karto vprašalnika« v
`.github/workflows/deploy.yml` požene oba skripta in zapiše izhod v `public/karta/index.html`,
od koder ga Vite prekopira v `dist`. Zaporedje je nujno: kar ob `vite build` še ne obstaja,
ne bo objavljeno.

Ker karta nastane iz konfiguracije ob sami objavi, objavljena različica **ne more zastarati**.
Datoteke zato ni v gitu (`public/karta/` je v korenskem `.gitignore`).

Dvoje je treba vedeti:

- **Lokalni `npm run build` karte ne vključi**, dokler je ne zgradiš ročno v `public/karta/`.
  To je namerno — edino zanesljivo mesto za svežo karto je objava.
- Objava se sproži **le ob potisku na `main`**. Delo na veji na Pages ne pride.

Karta je javno berljiva vsakomur, ki pozna naslov. Iz kalkulatorja nanjo namenoma ni povezave.

### Artefakt na claude.ai

<https://claude.ai/code/artifact/1a435117-a560-4e61-97e1-3b5693e01dc3>

Ob ponovni objavi je treba uporabiti isti naslov, sicer nastane nova povezava.
