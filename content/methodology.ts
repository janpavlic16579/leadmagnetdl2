export interface ModuleMethodology {
  formula: string;
  rationale: string;
}

/**
 * Razlaga metodologije po ID-ju modula iz src/config/modules/.
 *
 * Urejano brez poseganja v izračunsko logiko — vsak modul ima eno razlagalno poved
 * ("zakaj tako računamo"). Manjkajoč vnos ni napaka: modul se prikaže brez razlage.
 */
export const MODULE_METHODOLOGY: Record<string, ModuleMethodology> = {
  // --- Obstoječi moduli (trgovina, računovodstvo, splošno) -------------------
  A_trgovina: {
    formula: '(dokumenti/mesec × minute/dokument / 60) × EUR/h × 12',
    rationale:
      'Ročno prepisovanje in vnos dokumentov porabi resnične delovne ure — sešteti čez leto dajo realen strošek te dejavnosti.',
  },
  B_trgovina: {
    formula: 'transakcije/mesec × % napak × strošek ene napake × 12',
    rationale:
      'Vsaka napaka terja ponovno dostavo, popravek ali izgubo zaupanja kupca — strošek je resničen, tudi če ga nihče posebej ne knjiži.',
  },
  C_trgovina: {
    formula: 'sproščen kapital = zaloge × % znižanja; letni prihranek = sproščen kapital × % stroška kapitala',
    rationale:
      'Denar, vezan v presežnih zalogah, vas stane toliko, kolikor bi ta denar zaslužil, če bi bil prost — zato prikazujemo enkraten sproščen kapital in letni prihranek ločeno.',
  },
  D_trgovina: {
    formula: '(letni prihodki / 365) × dni skrajšanja plačilnega roka × oportunitetni strošek',
    rationale:
      'Počasnejši plačilni rok pomeni, da je vaš denar dlje na poti, kot bi moral biti — to ima ceno, tudi če noben račun ni izgubljen.',
  },

  // --- Proizvodnja ----------------------------------------------------------
  planiranje: {
    formula:
      '(ure čakanja + nadure) × strošek proizvodne ure × 12; ure ponovnega planiranja × strošek administrativne ure × 12',
    rationale:
      'Ure, ko proizvodnja čaka na prioriteto ali navodilo, so plačane, a ne ustvarijo ničesar. Čakanje zaradi manjkajočega materiala tu ne šteje — to meri področje Zaloge, sicer bi bila ista ura šteta dvakrat.',
  },
  material: {
    formula: 'izmet = letna poraba materiala × delež izmeta; dodelave = ure × strošek proizvodne ure × 12',
    rationale:
      'Izmet in reklamacije so denar, ki odteče, ure dodelav pa so že plačan čas ekipe — zato so ločeni. Stroški reklamacij se vpisujejo samo, če še niso zajeti v izmetu ali dodelavah.',
  },
  zaloge: {
    formula:
      'letno = odpisi in razvrednotenja; kapaciteta = ure čakanja na material × strošek proizvodne ure × 12; enkratno = povprečna zaloga × ocenjen delež znižanja',
    rationale:
      'Področje meri dva nasprotna problema hkrati: preveč zaloge in premalo pravega materiala. Sprostljiv kapital je enkraten učinek in se z letnimi zneski nikoli ne sešteva — sicer bi ena velika zaloga povozila vse ostalo.',
  },
  nalogi: {
    formula: '(priprava nalogov + prepisovanje + popravki podatkov) × strošek administrativne ure × 12',
    rationale:
      'Vsaka od treh vrst dela je prikazana posebej, da je vidno, kje ročno delo dejansko nastaja. Rezultat je vrednost izgubljene kapacitete, ne prihranek pri plačah — zaposleni ostane, njegov čas pa se preusmeri.',
  },
  zamude: {
    formula:
      'ekspresni stroški + penali in popusti + izgubljena prispevna marža; komunikacija s kupci × strošek administrativne ure × 12',
    rationale:
      'Štejemo samo neposredne posledice zamud. Ure ponovnega planiranja ostanejo v področju Plan, vpisuje pa se le izgubljena marža, ne celotna vrednost odpovedanega naročila.',
  },
  diagnostika: {
    formula: 'ocena tveganja iz štirih odgovorov — brez zneska',
    rationale:
      'Kjer podjetje ne pozna lastne cene naloga ali nima sledljivosti, natančnega zneska ni mogoče izračunati — prav to je težava. Navidezno natančna številka bi jo skrila, zato prikazujemo stopnjo tveganja in ne evrov.',
  },

  // --- Logistika in transport -----------------------------------------------
  odprema: {
    formula:
      'prazni km/mesec × strošek km × 12; (ure čakanja × strošek operativne ure + ure razporejanja × strošek administrativne ure) × 12',
    rationale:
      'Gorivo in cestnine praznih voženj so že porabljen denar, čakanje voznika pa plačan čas, ki ne premakne ničesar — zato sta ločena. Da bi bil vsak prazen kilometer odpravljiv, izračun ne trdi: to omeji naslovljivi delež glavnega vzroka.',
  },
  napake: {
    formula:
      'pošiljke/mesec × delež napak × strošek ene napake × 12; + letna vrednost poškodovanega blaga; ure reklamacij × strošek administrativne ure × 12',
    rationale:
      'Strošek popravka (ponovna dostava, prepakiranje) in vrednost samega blaga sta vprašana ločeno, ker ju podjetja tudi ločeno vodijo. Šteje se samo škoda, ki je ni pokrilo zavarovanje — sicer bi bila izguba pripisana dvakrat.',
  },
  skladisce: {
    formula:
      'letno = popisne razlike in odpisi; kapaciteta = ure iskanja × strošek operativne ure × 12; enkratno = vrednost zaloge × ocenjen delež znižanja',
    rationale:
      'Področje meri lastno zalogo, ne tuje: kdor skladišči izključno tuje blago, tega kapitala ne sprošča on. Sprostljiv kapital je enkraten učinek in se z letnimi zneski nikoli ne sešteva.',
  },
  dokumentacija: {
    formula: '(priprava listin + prepisovanje + popravki podatkov) × strošek administrativne ure × 12',
    rationale:
      'Vsaka od treh vrst dela je prikazana posebej, da je vidno, kje ročno delo dejansko nastaja. Rezultat je vrednost izgubljene kapacitete, ne prihranek pri plačah — zaposleni ostane, njegov čas pa se preusmeri.',
  },
  roki: {
    formula:
      'nujni podnajemi + penali in stojnine + izgubljena prispevna marža; komunikacija s strankami × strošek administrativne ure × 12',
    rationale:
      'Štejemo samo neposredne posledice zamud in samo stojnine, ki jih plačate vi — tiste, ki jih zaračunate stranki, so prihodek. Ure razporejanja ostanejo v področju Planiranje prevozov, vpisuje pa se izgubljena marža, ne celotna vrednost posla.',
  },
  diagnostika_logistika: {
    formula: 'ocena tveganja iz štirih odgovorov — brez zneska',
    rationale:
      'Kjer podjetje ne pozna lastne cene vožnje ali ne more zanesljivo povedati, kje je pošiljka, natančnega zneska ni mogoče izračunati — prav to je težava. Navidezno natančna številka bi jo skrila, zato prikazujemo stopnjo tveganja in ne evrov.',
  },

  // --- Veleprodaja in distribucija ------------------------------------------
  narocila_trgovina: {
    formula:
      '(vnos naročil + prepisovanje + urejanje cenikov) × strošek administrativne ure × 12; + letno izgubljena marža zaradi napačnih cen',
    rationale:
      'Vsaka od treh vrst ročnega dela je prikazana posebej, da je vidno, kje dejansko nastaja — rezultat je vrednost izgubljene kapacitete, ne prihranek pri plačah. Vpisuje se samo razlika v marži, ne celotna vrednost računa; dobropisi zaradi napačne pošiljke ostanejo v področju Odprema.',
  },
  skladisce_trgovina: {
    formula:
      '(iskanje blaga + nadure) × strošek skladiščne ure × 12; ročno urejanje prevzemov × strošek skladiščne ure × 12; inventure (h/leto) × strošek skladiščne ure',
    rationale:
      'Področje meri samo izgubljen čas, ne celotnega komisioniranja — komisioniranje je delo, ki ga je treba opraviti, iskanje pa ne. Inventura je vprašana letno, ker se tudi tako izvaja, zato se pri njej z dvanajstimi meseci ne množi. Ponovno komisioniranje napačne pošiljke se namenoma ne šteje nikjer: podštevanje je boljše od dvojnega štetja.',
  },
  zaloge_trgovina: {
    formula:
      'letno = odpisi in nekurantnost + izgubljena marža zaradi manjkajočega blaga; enkratno = povprečna zaloga × ocenjen delež znižanja',
    rationale:
      'Področje meri dva nasprotna problema hkrati: preveč napačnega blaga in premalo pravega. Sprostljiv kapital je enkraten učinek in se z letnimi zneski nikoli ne sešteva — sicer bi ena velika zaloga povozila vse ostalo. Vpisuje se izgubljena marža, ne celotna vrednost nerealiziranega naročila.',
  },
  odprema_trgovina: {
    formula:
      'ponovne dostave + dobropisi in odškodnine + izguba vrednosti vrnjenega blaga; reševanje reklamacij × strošek administrativne ure × 12',
    rationale:
      'Štejejo se samo posledice, ki nastanejo, POTEM ko je blago odšlo — ura komisioniranja, ki je napako povzročila, je v področju Skladišče. Prevozni strošek se vpisuje samo v višini razlike nad običajno dostavo, ne celotne vožnje.',
  },
  terjatve_trgovina: {
    formula:
      '(letni prihodki / 365) × dni prekoračitve roka × letni strošek kapitala (vprašan v finančni osnovi, privzeto 6 %); + odpisane terjatve; opominjanje × strošek administrativne ure × 12',
    rationale:
      'Šteje se samo prekoračitev NAD dogovorjenim rokom. Financiranje roka, ki ste ga kupcu sami odobrili, je normalno poslovanje in ne strošek napake — če bi šteli celoten DSO, bi bil znesek videti večji, a bi ga vsak finančnik takoj zavrnil.',
  },
  diagnostika_trgovina: {
    formula: 'ocena tveganja iz štirih odgovorov — brez zneska',
    rationale:
      'Kjer veleprodajalec ne pozna marže po artiklu ali ne more zanesljivo povedati, kdo je pošiljko komisioniral, natančnega zneska ni mogoče izračunati — prav to je težava. Navidezno natančna številka bi jo skrila, zato prikazujemo stopnjo tveganja in ne evrov.',
  },

  // --- Maloprodaja ----------------------------------------------------------
  zalogeMp: {
    formula:
      'letno = odpisi in prisilna znižanja + izgubljena marža praznih polic; enkratno = povprečna zaloga × ocenjen delež znižanja',
    rationale:
      'Področje meri dva nasprotna problema hkrati: preveč napačnega blaga in premalo pravega. Sem sodi samo ZNANA izguba — neznano razliko, ki se pokaže šele ob inventuri, meri področje Blagajna, sicer bi bila ista izguba šteta dvakrat. Sprostljiv kapital je enkraten učinek in se z letnimi zneski nikoli ne sešteva.',
  },
  marzeMp: {
    formula:
      'letna nabavna vrednost × delež izgube zaradi napačnih cen; + neuveljavljeni rabati; ure vzdrževanja cenikov × strošek administrativne ure × 12',
    rationale:
      'Marža se v maloprodaji izgublja po centih na artikel, zato je vprašana kot delež nabavne vrednosti in ne kot znesek, ki ga nihče ne knjiži. Ure vzdrževanja cenikov so že plačan čas vodij — sproščene ure ne znižajo plačne mase, zato so kapaciteta in ne denar, ki odteka.',
  },
  razpolozljivostMp: {
    formula:
      'letni prihodek × delež izgubljene prodaje × prispevna marža × (1 − delež nadomeščenih nakupov); + ekspresne dobave; ure iskanja zaloge × strošek ure v poslovalnici × 12',
    rationale:
      'Izgubljena prodaja se vpiše kot delež prometa in ne kot znesek marže — promet trgovec pozna, maržo pa izpelje kalkulator iz skupne finančne osnove. Kdor kupi nadomestni artikel, ni izgubljen kupec, zato se ta delež odšteje; brez tega bi bila prazna polica ovrednotena kot popolna izguba nakupa. Ekspresne dobave so ločen izid, ker so denar, ki odteče, in ne nezaslužena marža.',
  },
  blagajnaMp: {
    formula:
      'blagajne × minute zaključka × 305 odprtih dni ÷ 60 × strošek ure v poslovalnici; + inventurni manko; ure inventur × strošek ure v poslovalnici',
    rationale:
      'Manko se vpiše v evrih, kot je bil ugotovljen ob inventuri, in ne izpelje iz odstotka prometa — odstotek je videti natančen, čeprav je ugibanje. Šteje se samo NEZNANA razlika: znano odpisano, poteklo ali znižano blago je že v področju Presežna zaloga. Prav razlika med obojim pove, ali gre za proces ali za krajo. Zaključek blagajne se vpraša po ENI blagajni, ker je to edina številka, ki jo je mogoče izmeriti z uro v roki.',
  },
  prevzemMp: {
    formula:
      '(prevzem + prenosi) × strošek ure v poslovalnici × 12; usklajevanje dokumentov × strošek administrativne ure × 12',
    rationale:
      'Delo z blagom in delo z dokumenti sta vrednotena po različnih urnih postavkah, ker ju opravljata različna človeka — ena povprečna ura ne bi opisala ne enega ne drugega. Šteje se samo administrativni del prenosa, ne prevoza.',
  },
  kanaliMp: {
    formula:
      'izgubljena marža odpovedanih spletnih naročil; (usklajevanje kanalov × administrativna ura + obdelava naročil × ura v poslovalnici) × 12',
    rationale:
      'Področje meri samo delo, ki nastane, KER obstaja drugi kanal. Vzdrževanje cenikov za poslovalnice ostane v področju Cene, izgubljena prodaja na polici pa v področju Zaloge — sicer bi bil isti evro štet dvakrat.',
  },
  diagnostikaMp: {
    formula: 'ocena tveganja iz štirih odgovorov — brez zneska',
    rationale:
      'Kjer trgovec ne pozna dejanske zaloge na polici ali marže po artiklu, natančnega zneska ni mogoče izračunati — prav to je težava. Navidezno natančna številka bi jo skrila, zato prikazujemo stopnjo tveganja in ne evrov.',
  },

  // --- Storitve in projekti -------------------------------------------------
  projekti_storitve: {
    formula:
      '(ure čakanja + nadure) × strošek izvedbene ure × 12; ure prerazporejanja × strošek administrativne ure × 12',
    rationale:
      'Ure, ko ekipa čaka na odločitev ali vhodne podatke, so plačane, a ne ustvarijo ničesar. Opravljene ure, ki niso bile zaračunane, tu ne štejejo — te meri področje Evidenca dela, sicer bi bila ista ura šteta dvakrat.',
  },
  obracun_storitve: {
    formula:
      'nezaračunane ure × ZARAČUNANA urna postavka × 12 + dobropisi; urejanje evidence × strošek administrativne ure × 12',
    rationale:
      'Nezaračunana ura je edina postavka v kalkulatorju, vrednotena po ceni in ne po strošku: strošek te ure je podjetje že plačalo in ga ne dobi nazaj, izgubljen je prihodek, ki bi ga morala prinesti. Urejanje evidence je nasprotno interno delo in zato kapaciteta.',
  },
  obseg_storitve: {
    formula:
      '(ure nad obsegom + ure popravkov) × strošek izvedbene ure × 12; odpisi in popusti ob obračunu',
    rationale:
      'Ure nad dogovorjenim obsegom so vrednotene po strošku in ne po ceni: za razliko od nezaračunanih ur tu ni bilo dogovora, da bodo plačane, zato ni izgubljenega prihodka, ampak porabljena kapaciteta. Ure, ki so ušle zaradi slabe evidence, ostanejo v področju Evidenca dela.',
  },
  administracija_storitve: {
    formula: '(ponudbe in poročila + prepisovanje + popravki podatkov) × strošek administrativne ure × 12',
    rationale:
      'Vsaka od treh vrst dela je prikazana posebej, da je vidno, kje ročno delo dejansko nastaja. Rezultat je vrednost izgubljene kapacitete, ne prihranek pri plačah — zaposleni ostane, njegov čas pa se preusmeri v zaračunljivo delo.',
  },
  terjatve_storitve: {
    formula:
      'kazni in popusti + izgubljena prispevna marža; usklajevanje z naročniki × strošek administrativne ure × 12; enkratno = nezaračunano delo in zapadle terjatve × ocenjen delež sprostitve',
    rationale:
      'Sprostljiv kapital je enkraten učinek in se z letnimi zneski nikoli ne sešteva — sicer bi ena velika terjatev povozila vse ostalo. Vpisuje se le izgubljena marža, ne celotna vrednost izgubljenega posla.',
  },
  diagnostika_storitve: {
    formula: 'ocena tveganja iz štirih odgovorov — brez zneska',
    rationale:
      'Kjer podjetje ne pozna marže projekta ali nima zapisanega dogovorjenega obsega, natančnega zneska ni mogoče izračunati — prav to je težava. Navidezno natančna številka bi jo skrila, zato prikazujemo stopnjo tveganja in ne evrov.',
  },

  // --- Računovodski servis ---------------------------------------------------
  zajemRs: {
    formula:
      '(listine/mesec × delež ročnih × minute/listino / 60 + prepisovanje + arhiviranje) × strošek računovodske ure × 12',
    rationale:
      'Tri vrste ročnega dela so prikazane ločeno, da je vidno, kje delo dejansko nastaja. Iskanje manjkajočih listin sem ne sodi — to meri področje Listine strank, sicer bi bila ista ura šteta dvakrat.',
  },
  strankeRs: {
    formula:
      'lovljenje listin × strošek računovodske ure × 12; odgovarjanje na vprašanja × strošek vodstvene ure × 12',
    rationale:
      'Postavki sta vrednoteni po različni uri, ker ju opravita različna človeka: listine lovi referent, ki stranko vodi, na vsebinsko vprašanje pa praviloma odgovori vodja. Ena sama urna postavka bi eno od obeh sistematično popačila.',
  },
  obracuniRs: {
    formula:
      'zunanja pomoč + globe in obresti zaradi zamude; (nadure + ročna priprava obračunov) × strošek računovodske ure × 12',
    rationale:
      'Zunanja pomoč in globe so denar, ki odteče; nadure so kapaciteta, ker urejen servis opravi enak obseg dela, le brez konice — prihranek ni odpuščanje, ampak razporeditev. Šteje se samo posledica ZAMUDE; doplačila zaradi napačne vsebine so v področju Napake in popravki.',
  },
  popravkiRs: {
    formula:
      'samoprijave in obresti + dobropisi; popravljanje knjižb × strošek računovodske ure × 12; kontrole pred oddajo × strošek vodstvene ure × 12',
    rationale:
      'Kontrola pred oddajo je vrednotena po vodstveni uri, ker podpis pod obračun nosi odgovornost, ki je referent ne more prevzeti. Vpisujejo se samo posledice napačne VSEBINE — globe zaradi prepozne oddaje ostanejo v področju Obračuni.',
  },
  donosnostRs: {
    formula:
      'neobračunane ure × strošek računovodske ure × 12; stranke pod lastno ceno × mesečni primanjkljaj × 12',
    rationale:
      'Neobračunana ura je vrednotena po strošku in ne po ceniku: izračun namenoma ne trdi, da bi jo stranka plačala, če bi jo zaračunali. Primanjkljaj pri stranki pod lastno ceno je nasprotno denar, ki vsak mesec res odteče — te ure so opravljene in plačane, manjka le prihodek, ki bi jih pokril.',
  },
  diagnostikaRs: {
    formula: 'ocena tveganja iz štirih odgovorov — brez zneska',
    rationale:
      'Kjer servis ne ve, koliko ur porabi za posamezno stranko, natančnega zneska ni mogoče izračunati — prav to je težava. Navidezno natančna številka bi jo skrila, zato prikazujemo stopnjo tveganja in ne evrov.',
  },

  // --- Splošno (dejavnost izven ponujenih) -----------------------------------
  podatkiSp: {
    formula: '(vnašanje + popravljanje podatkov + priprava poročil) × strošek administrativne ure × 12',
    rationale:
      'Vsaka od treh vrst dela je prikazana posebej, da je vidno, kje ročno delo dejansko nastaja. Iskanje podatka, ki ga ni mogoče najti, tu ne šteje — to meri področje Iskanje informacij, sicer bi bila ista ura šteta dvakrat.',
  },
  usklajevanjeSp: {
    formula:
      'zastoji × strošek neposredne ure × 12; (iskanje + statusna vprašanja) × strošek administrativne ure × 12',
    rationale:
      'Zastoj zadene tistega, ki dela, zato se vrednoti po neposredni uri; iskanje in usklajevanje sta pisarniško delo in gresta po administrativni. Čakanje na plačilo kupca sem ne sodi — to je področje Plačilni roki in terjatve.',
  },
  napakeSp: {
    formula:
      'ure ponovnega dela × strošek neposredne ure × 12; reklamacije in dobropisi + izgubljena prispevna marža',
    rationale:
      'Ure popravljanja so že plačan čas ekipe in zato kapaciteta, reklamacije in dobropisi pa denar, ki odteče. Popravljanje samega PODATKA tu ne šteje — to meri področje Ročno delo s podatki.',
  },
  denarSp: {
    formula:
      '(letni prihodki / 365) × dni prekoračitve roka × strošek kapitala + odpisane terjatve; izterjava × strošek administrativne ure × 12',
    rationale:
      'Šteje se samo prekoračitev NAD dogovorjenim rokom: financiranje roka, ki ste ga kupcu sami odobrili, je normalno poslovanje in ne strošek napake. Celoten plačilni rok bi dal večjo številko, ki bi jo vsak finančnik takoj zavrnil.',
  },
  zalogeSp: {
    formula: 'letno = odpisi in razvrednotenja; enkratno = povprečna zaloga × ocenjen delež znižanja',
    rationale:
      'Sprostljiv kapital je enkraten učinek in se z letnimi zneski nikoli ne sešteva — sicer bi ena velika zaloga povozila vse ostalo. Podjetje brez zalog vpiše 0 in področje v izračunu izgine.',
  },
  diagnostikaSp: {
    formula: 'ocena tveganja iz štirih odgovorov — brez zneska',
    rationale:
      'Kjer podjetje ne pozna lastne cene ali nima sledljivosti, natančnega zneska ni mogoče izračunati — prav to je težava. Navidezno natančna številka bi jo skrila, zato prikazujemo stopnjo tveganja in ne evrov.',
  },

  // --- Horizontalna področja (v več segmentih) --------------------------------
  analitikaHz: {
    formula:
      '(priprava rednih poročil + izredne analize + združevanje podatkov) × strošek administrativne ure × 12',
    rationale:
      'Vsaka od treh vrst dela je prikazana posebej, da je vidno, kje ročno delo dejansko nastaja. Ure, vpisane v drugem področju, se tu ne ponavljajo — ista ura se nikoli ne šteje dvakrat.',
  },
  financeHz: {
    formula:
      '(knjiženje in priprava dokumentov + usklajevanje + obračuni in poročanje) × strošek administrativne ure × 12; + letne zamudne obresti, globe in popravki',
    rationale:
      'Ure so že plačan čas ekipe in zato kapaciteta, obresti in globe pa denar, ki odteče — zato sta ločena. Opominjanje kupcev sem ne sodi: to meri področje terjatev, sicer bi bila ista ura šteta dvakrat.',
  },
  kadriHz: {
    formula:
      '(evidence ur + priprava obračuna plač + kadrovska administracija) × strošek administrativne ure × 12; + letni stroški napačnih obračunov',
    rationale:
      'Ure so že plačan čas ekipe in zato kapaciteta, poračuni in zamudne obresti pa denar, ki odteče — zato sta ločena. Rezultat je vrednost izgubljene kapacitete, ne prihranek pri plačah.',
  },
  dokumentiHz: {
    formula:
      '(potrjevanje + iskanje in arhiviranje + tiskanje in ročno pošiljanje) × strošek administrativne ure × 12; + letni stroški izgubljenih in prepozno potrjenih dokumentov',
    rationale:
      'Ure so že plačan čas ekipe in zato kapaciteta, zamujeni skonti in obresti pa denar, ki odteče — zato sta ločena. Ure, vpisane v drugem področju, se tu ne ponavljajo.',
  },
  servisHz: {
    formula:
      'servisni posegi × strošek neposredne ure × 12; vodenje postopka × strošek administrativne ure × 12; + letni stroški nadomestnih delov, zunanjega servisa in kulance',
    rationale:
      'Servisni poseg opravi tisti, ki sicer proizvaja ali izvaja storitev, zato se vrednoti po neposredni uri; vodenje postopka je pisarniško delo po administrativni. Dobropisi, vračila kupnine in poškodovano blago sem ne sodijo — te meri panožno področje, sicer bi bil isti evro štet dvakrat.',
  },
};
