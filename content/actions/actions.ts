export interface ActionPlanEntry {
  headline: string;
  actions: string[];
}

/**
 * Akcijski načrt po ID-ju modula iz src/config/modules/.
 * Uredništvo vsebine (marketing) lahko besedila spodaj spreminja brez poseganja
 * v logiko izračuna.
 */
export const ACTION_PLANS: Record<string, ActionPlanEntry> = {
  // --- Obstoječi moduli -----------------------------------------------------
  A_trgovina: {
    headline: 'Največji strošek: ročno delo',
    actions: [
      'Vzpostavite en sam kanal za prejem dokumentov (npr. ena e-poštna skrinka ali portal) namesto razpršenih virov.',
      'Določite eno osebo, ki dokumente potrjuje — brez podvajanja pregleda.',
      'Popišite trenutni proces v 5 korakih in odstranite tiste, ki ne dodajajo vrednosti.',
    ],
  },
  B_trgovina: {
    headline: 'Največji strošek: napake',
    actions: [
      'Pripravite checklist pred odpremo za 10 najpogostejših napak.',
      'Uvedite dvojno preverjanje samo za transakcije nad določeno vrednostjo, ne za vse.',
      'Tedensko beležite vzroke napak, da odkrijete ponavljajoči se izvor.',
    ],
  },
  C_trgovina: {
    headline: 'Največji strošek: vezan kapital v zalogah',
    actions: [
      'Uvedite tedenski ABC pregled zalog (A = najvišja vrednost/promet).',
      'Zamrznite nova naročila za C-artikle z nizkim obratom.',
      'Določite mesečni cilj znižanja zalog in ga spremljajte na enem grafu.',
    ],
  },
  D_trgovina: {
    headline: 'Največji strošek: počasen denarni tok',
    actions: [
      'Uvedite avtomatski opomnik 3 dni pred zapadlostjo računa.',
      'Začnite izterjavo najkasneje 7 dni po zapadlosti, brez izjem.',
      'Ponudite popust za predčasno plačilo najvišjim dolžnikom.',
    ],
  },

  // --- Proizvodnja ----------------------------------------------------------
  planiranje: {
    headline: 'Največji strošek: zastoji in spreminjanje plana',
    actions: [
      'Teden dni beležite vsak zastoj z vzrokom (material / informacija / plan) — brez tega ne veste, kateri od treh vas res stane.',
      'Zamrznite proizvodni plan za prvih 48 ur; spremembe uvrščajte šele za tem oknom.',
      'Pred sprostitvijo delovnega naloga preverite razpoložljivost materiala, ne po njej.',
    ],
  },
  material: {
    headline: 'Največji strošek: izmet in dodelave',
    actions: [
      'Za 10 izdelkov z največ izmeta primerjajte dejansko porabo z normativom — običajno je odstopanje sistematično, ne naključno.',
      'Zabeležite vzrok vsake dodelave en mesec; večina jih izvira iz nekaj ponavljajočih se razlogov.',
      'Preverite, ali so sestavnice ažurne — zastarel normativ tiho ustvarja presežno porabo.',
    ],
  },
  zaloge: {
    headline: 'Največji strošek: zaloge in razpoložljivost materiala',
    actions: [
      'Popišite artikle brez prometa v zadnjih 12 mesecih in določite datum za razprodajo ali odpis.',
      'Za 20 najbolj kritičnih materialov določite minimalno zalogo in točko naročanja.',
      'Vsako nujno nabavo zabeležite z vzrokom — pokažejo, kje minimalne zaloge manjkajo.',
    ],
  },
  nalogi: {
    headline: 'Največji strošek: delovni nalogi in podatki',
    actions: [
      'Popišite, kje isti podatek vnesete več kot enkrat — to so mesta, kjer nastajajo tudi napake.',
      'Preverite, koliko delovnih nalogov je mogoče ustvariti neposredno iz naročila kupca.',
      'Uvedite sprotno poročanje na eni delovni postaji kot poskus, preden ga razširite.',
    ],
  },
  zamude: {
    headline: 'Največji strošek: roki in nujni stroški',
    actions: [
      'Za vsako ekspresno dostavo zadnjega meseca zabeležite vzrok — večina jih izvira iz prepoznega naročila, ne iz kupčeve spremembe.',
      'Uvedite tedenski pregled naročil, ki jim grozi zamuda, dokler je še čas za ukrepanje.',
      'Kupca obvestite o zamudi takoj, ko jo predvidite — penali in popusti so pogosto posledica molka, ne zamude same.',
    ],
  },
  // --- Logistika in transport -----------------------------------------------
  odprema: {
    headline: 'Največji strošek: prazne vožnje in čakanje',
    actions: [
      'Teden dni beležite vsako čakanje z vzrokom (stranka / naklad / razpored) — brez tega ne veste, kateri od treh vas res stane.',
      'Za pet najpogostejših relacij preverite, koliko voženj se vrača praznih, in poiščite povratni tovor prav zanje.',
      'Razpored za naslednji dan zaključite ob fiksni uri; spremembe po tem uvrščajte v izjeme, ki jih boste tedensko prešteli.',
    ],
  },
  napake: {
    headline: 'Največji strošek: napačne dostave in poškodbe',
    actions: [
      'Za vsako reklamacijo zadnjega meseca zabeležite, kje je napaka nastala (naročilo / komisioniranje / prevoz) — večina jih izvira iz enega koraka.',
      'Uvedite kontrolo pred odpremo samo za pošiljke nad določeno vrednostjo ali za znane problematične stranke, ne za vse.',
      'Preverite, koliko podatkov o pošiljki se prepiše ročno — tam, kjer se prepisuje, nastajajo tudi napačne dostave.',
    ],
  },
  skladisce: {
    headline: 'Največji strošek: skladiščne operacije in zaloga',
    actions: [
      'Za 20 artiklov z največ prometa preverite, ali so na eni sami lokaciji — razpršenost je najpogostejši vzrok iskanja.',
      'Uvedite ciklično štetje za skupino A namesto ene letne inventure, da razlike ujamete, ko so še pojasnljive.',
      'Popišite artikle brez prometa v zadnjih 12 mesecih in določite datum za razprodajo ali odpis.',
    ],
  },
  dokumentacija: {
    headline: 'Največji strošek: dokumentacija in podatki',
    actions: [
      'Popišite, kje isti podatek o pošiljki vnesete več kot enkrat — to so mesta, kjer nastajajo tudi napake.',
      'Za tri največje stranke preverite, ali je izmenjavo dokumentov mogoče prevzeti elektronsko namesto prek njihovega portala.',
      'Izmerite, koliko dni mine od dostave do dokazila v sistemu — ta zamik je zgornja meja hitrosti vašega obračuna.',
    ],
  },
  roki: {
    headline: 'Največji strošek: zamude in nujni prevozi',
    actions: [
      'Za vsak nujni podnajem zadnjega meseca zabeležite vzrok — večina jih izvira iz prepoznega naročila, ne iz kupčeve spremembe.',
      'Uvedite dnevni pregled pošiljk, ki jim grozi zamuda, dokler je še čas za ukrepanje.',
      'Stranko obvestite o zamudi takoj, ko jo predvidite — penali in popusti so pogosto posledica molka, ne zamude same.',
    ],
  },

  // --- Veleprodaja in distribucija ------------------------------------------
  narocila_trgovina: {
    headline: 'Največji strošek: naročila, ponudbe in cene',
    actions: [
      'Za tri največje kupce preverite, ali lahko naročila pošiljajo v obliki, ki jo sistem prebere sam — ročni prepis je hkrati čas in vir napačnih količin.',
      'Popišite, kje isti podatek o naročilu vnesete več kot enkrat; to so mesta, kjer nastajajo tudi napake v ceni.',
      'Zberite vse veljavne rabate in pogodbene cene na eno mesto in določite eno osebo, ki odstopanja potrjuje.',
    ],
  },
  skladisce_trgovina: {
    headline: 'Največji strošek: skladišče in komisioniranje',
    actions: [
      'Teden dni beležite vsak primer, ko blaga ni bilo na pričakovani lokaciji — brez tega ne veste, ali gre za lokacije, za prevzeme ali za razporeditev skladišča.',
      'Za 20 najpogosteje komisioniranih artiklov določite fiksno lokacijo blizu odpremne cone.',
      'Uvedite pravilo, da se prevzem knjiži isti dan; blago, prodano pred prevzemom, tiho pokvari vsako naslednjo zalogo.',
    ],
  },
  zaloge_trgovina: {
    headline: 'Največji strošek: zaloge in izpad prodaje',
    actions: [
      'Popišite artikle brez prometa v zadnjih 12 mesecih in določite datum za razprodajo ali odpis — dokler ležijo, plačujete zanje prostor in denar.',
      'Za 20 najbolje prodajanih artiklov določite minimalno zalogo in točko naročanja; prav pri njih manjkajoč artikel največ stane.',
      'En mesec beležite vsako naročilo, ki ga niste mogli dobaviti iz zaloge — to je edini način, da izgubljeno maržo sploh izmerite.',
    ],
  },
  odprema_trgovina: {
    headline: 'Največji strošek: odprema, vračila in reklamacije',
    actions: [
      'Za vsako reklamacijo zadnjega meseca zabeležite, na katerem koraku je napaka nastala — pri podatku o artiklu, pri komisioniranju ali pri prevozniku.',
      'Uvedite preverjanje s črtno kodo najprej na eni odpremni liniji kot poskus, preden ga razširite na vse.',
      'Kupca o nepopolni pošiljki obvestite sami, preden jo odkrije — dobropis je pogosto posledica molka, ne same napake.',
    ],
  },
  terjatve_trgovina: {
    headline: 'Največji strošek: plačilni roki in terjatve',
    actions: [
      'Uvedite samodejni opomnik tri dni pred zapadlostjo računa; večina zamud je pozabljivost, ne nelikvidnost.',
      'Začnite izterjavo najkasneje sedem dni po zapadlosti, brez izjem — z vsakim tednom se možnost poplačila zmanjša.',
      'Pri vnosu naročila naj bo vidno stanje odprtih postavk kupca; odločitev o dobavi je najcenejša takrat, ne po zapadlosti.',
    ],
  },

  // --- Maloprodaja ----------------------------------------------------------
  zalogeMp: {
    headline: 'Največji strošek: zaloge, police in odpisi',
    actions: [
      'Popišite artikle brez prodaje v zadnjih 6 mesecih in določite datum za razprodajo ali odpis — dokler ležijo, plačujete zanje polico in denar.',
      'Za 20 najbolje prodajanih artiklov določite minimalno zalogo in točko naročanja; prav pri njih prazna polica največ stane.',
      'En mesec beležite vsak artikel, po katerem je kupec vprašal in ga ni bilo — to je edini način, da izgubljeno prodajo sploh izmerite.',
    ],
  },
  marzeMp: {
    headline: 'Največji strošek: nabavne cene, akcije in marža',
    actions: [
      'Za 20 artiklov z največjim prometom primerjajte dogovorjeno nabavno ceno z zadnjimi prejetimi računi — odstopanje je običajno sistematično, ne naključno.',
      'Popišite dogovorjene rabate in bonuse po dobavitelju na eno mesto in preverite, kateri v zadnjem letu niso bili uveljavljeni.',
      'Po vsaki akciji preverite, ali so se cene na blagajni vrnile na redne — pozabljena akcija je tiha izguba, ki traja mesece.',
    ],
  },
  razpolozljivostMp: {
    headline: 'Največji strošek: prazne police in nedobavljivi artikli',
    actions: [
      'En mesec beležite vprašanja "imate to?", na katera je odgovor ne — brez tega je delež izgubljene prodaje ugibanje, in prav on nosi največji del zneska.',
      'Za dvajset artiklov z največ prometa preverite, ali sistem sam predlaga naročilo; ročno naročanje po izkušnjah odpove prav ob konicah, ko je polica najdražja.',
      'Preglejte, koliko ekspresnih dobav ste plačali zadnje četrtletje in za katere artikle — ponavljajoči se artikli niso logistična, ampak nabavna težava.',
    ],
  },
  blagajnaMp: {
    headline: 'Največji strošek: blagajna, zaključki in manko',
    actions: [
      'Namesto ene letne inventure uvedite sprotno štetje po skupinah — razliko boste videli, ko je vzrok še mogoče ugotoviti.',
      'Za mesec dni ločeno beležite znane odpise (poškodbe, potek) od neznanih razlik; razmerje med njima pove, ali gre za proces ali za krajo.',
      'Z uro izmerite zaključek ene blagajne — pomnožen z odprtimi dnevi in številom blagajn je to običajno večji znesek, kot se pričakuje.',
    ],
  },
  prevzemMp: {
    headline: 'Največji strošek: prevzem blaga in dokumenti',
    actions: [
      'Za tri največje dobavitelje preverite, ali lahko dobavnico pošljejo elektronsko — ročni prepis je hkrati čas in vir napak v zalogi.',
      'Uvedite pravilo, da se prevzem opravi isti dan; blago, prodano pred prevzemom, tiho pokvari zalogo in maržo.',
      'Popišite, kje isti podatek o dobavi vnesete več kot enkrat — to so mesta, kjer nastajajo tudi razlike.',
    ],
  },
  kanaliMp: {
    headline: 'Največji strošek: spletna prodaja in usklajenost kanalov',
    actions: [
      'Preverite, koliko spletnih naročil je bilo v zadnjem mesecu odpovedanih zaradi zaloge, ki je sistem ni imel pravilne.',
      'Določite eno osebo, odgovorno za usklajenost artiklov in cen med kanali — brez tega usklajevanje opravljajo vsi in nihče.',
      'Izmerite, koliko časa mine od spletnega naročila do odpremnega dokumenta; ta zamik je zgornja meja hitrosti vaše dostave.',
    ],
  },

  // --- Storitve in projekti -------------------------------------------------
  projekti_storitve: {
    headline: 'Največji strošek: čakanje in prerazporejanje ekipe',
    actions: [
      'Teden dni beležite vsak zastoj z vzrokom (odločitev / vhodni podatki / naročnik) — brez tega ne veste, kateri od treh vas res stane.',
      'Zamrznite razpored ekipe za prvih 48 ur; spremembe uvrščajte šele za tem oknom.',
      'Pred sprejemom novega posla preverite dejansko zasedenost ekipe, ne občutka.',
    ],
  },
  obracun_storitve: {
    headline: 'Največji strošek: delo, ki ni zaračunano',
    actions: [
      'En mesec zahtevajte evidenco ur na dan izvedbe — ure, zapisane po spominu ob obračunu, so tiste, ki najpogosteje izginejo.',
      'Pred zaključkom meseca preglejte seznam opravljenih ur brez računa in za vsako odločite: zaračunati ali odpisati z zapisanim razlogom.',
      'Za tri največje naročnike primerjajte opravljene in zaračunane ure zadnjega četrtletja — razlika je vaša izhodiščna številka.',
    ],
  },
  obseg_storitve: {
    headline: 'Največji strošek: presežen obseg in dodelave',
    actions: [
      'Za vsak tekoči projekt zapišite, kaj NI vključeno — večina presežnega obsega izvira iz nezapisane predpostavke, ne iz zahteve naročnika.',
      'Uvedite pravilo, da vsaka sprememba obsega dobi svojo oceno ur, tudi če je na koncu ne zaračunate.',
      'Zabeležite vzrok vsake dodelave en mesec; večina jih izvira iz nekaj ponavljajočih se razlogov.',
    ],
  },
  administracija_storitve: {
    headline: 'Največji strošek: projektna administracija in podatki',
    actions: [
      'Popišite, kje isti podatek vnesete več kot enkrat — to so mesta, kjer nastajajo tudi napake.',
      'Preverite, koliko ponudb je mogoče sestaviti iz obstoječih predlog namesto od začetka.',
      'Uvedite samodejno mesečno poročilo o napredku za enega naročnika kot poskus, preden ga razširite.',
    ],
  },
  terjatve_storitve: {
    headline: 'Največji strošek: roki, plačila in vezan denar',
    actions: [
      'Popišite projekte, kjer je od opravljenega dela do računa minilo več kot 30 dni — to je vaš najhitreje sprostljiv denar.',
      'Uvedite obračun po mejnikih namesto ob zaključku pri vseh projektih, daljših od dveh mesecev.',
      'Naročnika obvestite o zamudi takoj, ko jo predvidite — kazni in popusti so pogosto posledica molka, ne zamude same.',
    ],
  },

  // --- Računovodski servis --------------------------------------------------
  zajemRs: {
    headline: 'Največji strošek: zajem in vnos listin',
    actions: [
      'Za pet strank z največ listinami preverite, katere prihajajo že v e-obliki — te je mogoče prevzeti brez enega samega vnosa.',
      'Popišite, kje isti podatek vnesete več kot enkrat (plače, glavna knjiga, poročilo) — to so mesta, kjer nastajajo tudi napake.',
      'Dogovorite se z eno stranko za enoten način oddaje in mesec dni merite, koliko časa prihranite; šele nato razširite.',
    ],
  },
  strankeRs: {
    headline: 'Največji strošek: lovljenje listin in komunikacija',
    actions: [
      'Mesec dni beležite, katere stranke morate opomniti in kolikokrat — običajno gre za nekaj istih, ne za vse.',
      'Za tri najpogostejša vprašanja strank pripravite odgovor, do katerega stranka pride sama (izpis, vpogled, kratko navodilo).',
      'V pogodbo zapišite rok za oddajo listin in posledico zamude — brez zapisanega roka je opominjanje vaš strošek, ne njihov.',
    ],
  },
  obracuniRs: {
    headline: 'Največji strošek: konice ob rokih in obračunih',
    actions: [
      'Narišite obseg dela po dnevih v mesecu — konica je skoraj vedno posledica prepozne oddaje, ne premajhne ekipe.',
      'Za stranke, ki oddajo pravočasno, obračun zaprite pred rokom in tako sprostite zadnje dni za zamudnike.',
      'Vsako plačilo zunanje pomoči zabeležite z vzrokom; po treh mesecih se pokaže, ali gre za obseg ali za razporeditev.',
    ],
  },
  popravkiRs: {
    headline: 'Največji strošek: napake in popravki',
    actions: [
      'Mesec dni beležite vzrok vsakega popravka; večina jih izvira iz nekaj ponavljajočih se razlogov, ne iz nepazljivosti.',
      'Za konte, ki se najpogosteje ne izidejo, uvedite kontrolo ob knjiženju namesto pregleda pred oddajo.',
      'Preverite, katere kontrole vodja opravlja zato, ker podatkom ne zaupa — te je mogoče avtomatizirati, strokovnega pregleda pa ne.',
    ],
  },
  donosnostRs: {
    headline: 'Največji strošek: neobračunano delo in stranke pod lastno ceno',
    actions: [
      'En mesec beležite čas po stranki, tudi grobo — brez tega ni mogoče vedeti, katera stranka servis financira in katera ga bremeni.',
      'Za pet strank primerjajte porabljene ure s tem, kar plačujejo; razlika je praviloma sistematična, ne naključna.',
      'Za dodatno delo se dogovorite vnaprej, tudi če ga ne zaračunate — nezapisan dogovor postane pričakovanje.',
    ],
  },

  // --- Splošno (dejavnost izven ponujenih) ----------------------------------
  podatkiSp: {
    headline: 'Največji strošek: ročno delo s podatki',
    actions: [
      'Popišite, kje isti podatek vnesete več kot enkrat — to so hkrati mesta, kjer nastajajo napake.',
      'Za eno redno poročilo izmerite, koliko časa gre za zbiranje podatkov in koliko za razmislek; prvo je odpravljivo, drugo ne.',
      'Določite, kateri sistem je za vsak ključni podatek edini vir resnice — dokler sta dva, se bosta razhajala.',
    ],
  },
  usklajevanjeSp: {
    headline: 'Največji strošek: iskanje informacij in usklajevanje',
    actions: [
      'Teden dni beležite vsak zastoj z vzrokom (manjka podatek / manjka odločitev / čakamo zunanjega) — brez tega ne veste, kateri od treh vas res stane.',
      'Za tri najpogostejša statusna vprašanja poskrbite, da odgovor vidi tisti, ki sprašuje, ne da bi moral koga poklicati.',
      'Odločitvam, ki blokirajo delo, določite rok in nosilca; večina zastojev ni posledica težke odločitve, ampak nedodeljene.',
    ],
  },
  napakeSp: {
    headline: 'Največji strošek: napake in ponovno delo',
    actions: [
      'Mesec dni beležite vzrok vsakega popravka; večina jih izvira iz nekaj ponavljajočih se razlogov, ne iz nepazljivosti.',
      'Ugotovite, kje v procesu napako opazite — čim bližje nastanku, tem ceneje jo odpravite.',
      'Za korak z največ popravki uvedite kontrolo ob vnosu namesto pregleda na koncu.',
    ],
  },
  denarSp: {
    headline: 'Največji strošek: plačilni roki in terjatve',
    actions: [
      'Izpišite kupce, ki najbolj presegajo dogovorjeni rok — praviloma je za večino zamude odgovorna manjšina kupcev.',
      'Uvedite opomnik tri dni PRED zapadlostjo; opomin po zapadlosti je že reševanje škode.',
      'Preverite, koliko dni mine od opravljenega dela do izdanega računa — ta zamik je vaš, ne kupčev.',
    ],
  },
  zalogeSp: {
    headline: 'Največji strošek: zaloge in vezan kapital',
    actions: [
      'Popišite artikle brez prometa v zadnjih 12 mesecih in določite datum za razprodajo ali odpis.',
      'Za 20 najbolj kritičnih artiklov določite minimalno zalogo in točko naročanja.',
      'Primerjajte knjigovodsko stanje z dejanskim na vzorcu — razlika pove, ali je težava v zalogi ali v podatku o njej.',
    ],
  },

  // --- Horizontalna področja (v več segmentih) -------------------------------
  analitikaHz: {
    headline: 'Največji strošek: ročna priprava poročil in analiz',
    actions: [
      'Za eno redno poročilo izmerite, koliko časa gre za zbiranje podatkov in koliko za razmislek; prvo je odpravljivo, drugo ne.',
      'Popišite, iz koliko virov se podatki za poročila ročno združujejo — vsak vir več je mesto, kjer se številke razhajajo.',
      'Določite, kateri sistem je za vsako ključno številko edini vir resnice — dokler sta dva, bo vsak oddelek imel svojo.',
    ],
  },
  financeHz: {
    headline: 'Največji strošek: ročno delo v računovodstvu in financah',
    actions: [
      'Preštejte, kolikokrat se isti dokument na poti do knjižbe prime v roke — vsak prijem nad enim je kandidat za avtomatizacijo.',
      'Za zadnje usklajevanje zabeležite, katere razlike so se pojavile in kje so nastale; večina jih izvira iz ročnega prenosa podatkov.',
      'Preverite, katere podatke zunanji servis ali banka že lahko izmenjuje elektronsko namesto prek izpisov in preglednic.',
    ],
  },
  kadriHz: {
    headline: 'Največji strošek: evidence delovnega časa in obračun plač',
    actions: [
      'En mesec beležite vsak popravek po obračunu plač z vzrokom — večina jih izvira iz evidenc ur, ne iz samega obračuna.',
      'Preverite, koliko virov podatkov se ročno združuje za en obračun (prisotnost, dopusti, potni nalogi, dodatki).',
      'Za najpogostejša kadrovska opravila (potrdila, dopusti) določite en sam kanal namesto e-pošte, papirja in ustnih dogovorov.',
    ],
  },
  dokumentiHz: {
    headline: 'Največji strošek: potrjevanje in iskanje dokumentov',
    actions: [
      'Za deset zadnjih računov izmerite čas od prejema do potrditve — zamik pove, koliko skontov in rokov vas stane potrjevanje.',
      'Popišite, kje vse ležijo dokumenti enega posla (e-pošta, mape, papir) — vsako mesto več je mesto iskanja.',
      'Za tri največje partnerje preverite, ali je izmenjavo dokumentov mogoče prevzeti elektronsko namesto s tiskanjem in skeniranjem.',
    ],
  },

  servisHz: {
    headline: 'Največji strošek: reklamacije in poprodajni servis',
    actions: [
      'Mesec dni beležite vsak servisni primer z vzrokom in porabljenim časom — večina ur praviloma odpade na nekaj ponavljajočih se tipov napak.',
      'Vsakemu odprtemu primeru določite status, nosilca in rok; primeri, ki živijo samo v e-pošti, se rešujejo najdlje.',
      'Preverite, koliko garancijskih zahtevkov proti dobaviteljem dejansko uveljavite — neuveljavljen zahtevek je strošek, ki bi ga moral nositi dobavitelj.',
    ],
  },

  // Diagnostika tu namenoma nima vnosa: findHighestModule sešteva samo koša
  // directLoss in capacity, zato modul, ki vrača izključno oceno tveganja, nikoli
  // ne more biti največja postavka. Vnos bi bil mrtva koda.
};

export function getActionPlan(highestModule: string | null): ActionPlanEntry | null {
  if (!highestModule) return null;
  return ACTION_PLANS[highestModule] ?? null;
}
