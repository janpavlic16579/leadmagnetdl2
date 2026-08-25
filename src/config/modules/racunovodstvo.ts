import { addressableShareOf, mainCauseField, type CauseOption } from './addressableShare';
import type { ModuleDefinition, RiskLevel } from './moduleTypes';
import {
  ASSURANCE_CHOICES,
  ASSURANCE_UNANSWERED,
  ASSURANCE_UNANSWERED_NOTE,
  assuranceRiskLevel,
  MONTHS_PER_YEAR,
} from './shared';

/**
 * Pet medsebojno izključujočih se stroškovnih področij za računovodski servis.
 *
 * Zgrajeno po istih dveh načelih kot proizvodnja (glej proizvodnja.ts):
 *
 * 1. compute() vrne DEJANSKI sedanji strošek — brez množenja z "deležem izboljšave".
 *    Koliko od tega je realno mogoče nasloviti, izračuna motor iz naslovljivega
 *    deleža (glavni vzrok) in pasu izboljšave (sedanji sistem podjetja).
 *
 * 2. Ista ura ali evro se ne sme pojaviti v dveh področjih. Meje so zapisane v
 *    besedilih help, ker jih upošteva samo obiskovalec ob vnosu.
 *
 * Servis se od proizvodnje in logistike loči po tem, da njegova zaloga NI blago,
 * ampak čas ekipe. Zato ima večina postavk koš 'capacity' in ne 'directLoss':
 * ura, ki gre za prepisovanje, je že plačana in se z boljšim procesom ne izbriše
 * iz plačne mase — sprosti se za drugo delo. Prav to je zgodba segmenta
 * ("koliko novih strank z isto ekipo"), zato je vrednotenje po strošku ure in ne
 * po ceniku namerno konservativno: izračun ne trdi, da bi stranka to uro plačala.
 *
 * Enega področja tu namenoma NI: koša 'oneTimeCapital'. Servis ne drži zaloge in
 * si zato ne more sprostiti obratnega kapitala — vsiljena postavka bi bila prazna
 * številka, ki bi delovala kot prihranek.
 *
 * Strošek računovodske (referent, knjigovodja) in vodstvene (vodja, davčni
 * svetovalec, podpis pod obračun) ure prideta iz konteksta: sta lastnost servisa,
 * ne posameznega področja.
 *
 * PANTHEON: seznami funkcionalnosti spodaj ostajajo znotraj objavljenega
 * slovenskega cenika in opisujejo delo, ki ga računovodski program opravlja —
 * nobena postavka ne obljublja funkcionalnosti izven njega.
 */

// --- 1. Zajem in vnos listin ------------------------------------------------

const ZAJEM_CAUSES: CauseOption[] = [
  { label: 'Listine prihajajo v papirni ali slikovni obliki', category: 'data' },
  { label: 'Nimamo samodejnega zajema e-računov in bančnih izpiskov', category: 'data' },
  { label: 'Podatke vodimo v več ločenih programih', category: 'data' },
  { label: 'Stranke oddajajo listine neurejeno', category: 'external' },
  // Standardizacija in razporejanje sta proces, ne lastnost ekipe.
  { label: 'Delo ni standardizirano oziroma enakomerno razporejeno', category: 'planning' },
];

export const zajemRs: ModuleDefinition = {
  id: 'zajemRs',
  title: 'Zajem in vnos listin',
  summary: 'Ročni vnos prejetih listin, prepisovanje istih podatkov med programi ter urejanje arhiva.',
  triage: {
    prompt: 'Koliko dela pri vas še vedno pomeni ročni vnos in prepisovanje listin?',
    options: [
      { value: 0, label: 'Večina se zajame samodejno' },
      { value: 1, label: 'Nekaj ur tedensko' },
      { value: 2, label: 'Vsak dan po več ur' },
      { value: 3, label: 'To je glavnina dela ekipe' },
    ],
  },
  fields: [
    {
      key: 'documentsPerMonth',
      label: 'Koliko listin skupno mesečno obdelate za vse stranke?',
      kind: 'number',
      unit: 'listin/mesec',
      default: 0,
      help: 'Prejeti in izdani računi, bančne postavke, potni nalogi, pogodbe — vse, kar se knjiži.',
      explainer:
        'Vse listine vseh strank skupaj. Hitra ocena: število strank × povprečno listin na stranko. ' +
        'Primer: 60 strank × 80 listin ≈ 4.800 listin na mesec.',
    },
    {
      key: 'manualSharePercent',
      label: 'Kolikšen delež teh listin je treba vnesti ali prepisati ročno?',
      kind: 'percent',
      min: 0,
      max: 1,
      step: 0.05,
      // Privzetek je 0 in ne 0,6: skupaj s številom listin in minutami na listino je to
      // zmnožek treh polj, zato bi vsak privzetek nad 0 sam ustvaril znesek, ki ga
      // obiskovalec ni potrdil (pri 4.800 listinah je 0,6 pomenilo 41.472 EUR na leto).
      // Ocena zanesljivosti nedotaknjenega privzetka ne šteje med izpolnjena polja, zato
      // bi se tak znesek izpisal celo z oznako "najmanj" — izmišljena številka s pridihom
      // konservativnosti. Delež je hkrati edino od treh polj, ki trdi, da težava obstaja.
      default: 0,
      help:
        'Delež listin, ki jih nekdo dejansko odtipka ali postavko za postavko prekontrolira. ' +
        'E-računi in uvoženi bančni izpiski, ki gredo skozi brez posega, sem ne sodijo.',
      explainer:
        'Vzemite en teden: koliko listin je šlo v knjiženje brez posega in koliko jih je nekdo ' +
        'vnašal ročno. Primer: od 1.200 tedenskih listin je 700 e-računov in izpiskov, 500 ' +
        'ročnih — to je približno 40 %.',
    },
    {
      key: 'minutesPerManualDocument',
      label: 'Koliko minut v povprečju vzame ena ročno vnesena listina?',
      kind: 'slider',
      min: 0.5,
      max: 15,
      step: 0.5,
      unit: 'min',
      default: 3,
      help: 'Od prejema do knjižene listine. Iskanje manjkajočih listin sem ne sodi — to meri področje Listine strank.',
      explainer:
        'Od trenutka, ko listina pride, do knjižene postavke: odpiranje, branje, vnos, kontiranje. ' +
        'Izmerite na desetih listinah in vzemite povprečje. Primer: 3 minute pri skeniranem računu, 6 ' +
        'pri papirnem.',
    },
    {
      key: 'retypingHoursPerMonth',
      label:
        'Koliko ur mesečno porabite samo za prepisovanje istih podatkov med programi (plače, glavna knjiga, poročila, portali)?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Ne vključujte vnosa listin iz zgornjih vprašanj.',
      explainer:
        'Isti podatek, vpisan drugič: iz enega programa v drugega, iz Excela v knjigovodstvo, iz e-pošte ' +
        'v evidenco. Vnos listin je že v zgornjih vprašanjih. Primer: 2 osebi × 3 h na teden ≈ 26 ur na ' +
        'mesec.',
    },
    {
      key: 'filingHoursPerMonth',
      label: 'Koliko ur mesečno porabite za skeniranje, razvrščanje in arhiviranje listin?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    mainCauseField(ZAJEM_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(ZAJEM_CAUSES, input.mainCause);
    const rate = context.operationalHourCostEUR;
    const manualHoursPerMonth =
      (input.documentsPerMonth * input.manualSharePercent * input.minutesPerManualDocument) / 60;

    // Tri ločene postavke namesto ene vsote: razčlenitev pokaže, kje ročno delo
    // dejansko nastaja, in obiskovalec vidi, da vprašanja niso podvojena.
    return [
      {
        bucket: 'capacity',
        label: 'Ročni vnos listin',
        valueEUR: manualHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: manualHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Prepisovanje podatkov med programi',
        valueEUR: input.retypingHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.retypingHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Skeniranje, razvrščanje in arhiviranje',
        valueEUR: input.filingHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.filingHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Samodejni zajem e-računov in bančnih izpiskov',
    'Elektronski arhiv z listino, pripeto ob knjižbo',
    'Plače, glavna knjiga in poročila iz iste baze, brez ponovnega vnosa',
  ],
};

// --- 2. Listine strank in komunikacija --------------------------------------

const STRANKE_CAUSES: CauseOption[] = [
  { label: 'Stranke nimajo enotnega načina oddaje listin', category: 'data' },
  { label: 'Nimamo portala oziroma samopostrežnega vpogleda za stranke', category: 'data' },
  { label: 'Obveznosti in roki po stranki niso nikjer sledeni', category: 'planning' },
  { label: 'Stranke se ne držijo dogovorov', category: 'external' },
  // Dodelitev strank je procesna nastavitev sistema.
  { label: 'Odgovornost za posamezno stranko ni jasno določena', category: 'planning' },
];

export const strankeRs: ModuleDefinition = {
  id: 'strankeRs',
  title: 'Listine strank in komunikacija',
  summary: 'Opominjanje strank, lovljenje manjkajočih listin in odgovarjanje na ponavljajoča se vprašanja.',
  triage: {
    prompt: 'Koliko časa porabite za lovljenje listin in odgovarjanje strankam?',
    options: [
      { value: 0, label: 'Stranke oddajajo pravočasno in urejeno' },
      { value: 1, label: 'Občasno je treba opomniti' },
      { value: 2, label: 'Vsak mesec veliko usklajevanja' },
      { value: 3, label: 'Lovljenje listin je stalnica' },
    ],
  },
  fields: [
    {
      key: 'chasingHoursPerMonth',
      label: 'Koliko ur mesečno porabite za opominjanje strank in lovljenje manjkajočih listin?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'inquiryHoursPerMonth',
      label:
        'Koliko ur mesečno porabite za odgovarjanje na ponavljajoča se vprašanja strank (saldo, stanje, kdaj zapade, kje je dokument)?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Svetovanje sem ne sodi — neobračunano svetovanje meri področje Neobračunano delo.',
      explainer:
        'Ure za lovljenje manjkajočih listin in pojasnil: klici, e-pošta, opomniki strankam. Primer: pri ' +
        '15 strankah od 60 je treba mesečno posredovati × 30 min ≈ 8 ur.',
    },
    {
      key: 'lateClientsSharePercent',
      label: 'Kolikšen delež strank redno odda listine prepozno?',
      kind: 'percent',
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.3,
      contextOnly: true,
      help: 'Podatek ne vstopa v izračun — služi za oceno obsega težave.',
      explainer: 'Groba ocena zadostuje: delež strank, ki listine redno odda po dogovorjenem roku.',
    },
    {
      key: 'deliveryMethod',
      label: 'Kako stranke danes oddajajo listine?',
      kind: 'choice',
      default: 2,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Prek portala ali samodejne izmenjave' },
        { value: 1, label: 'Po e-pošti, v dogovorjeni obliki' },
        { value: 2, label: 'Po e-pošti, vsaka po svoje' },
        { value: 3, label: 'Osebno oziroma v papirju' },
      ],
    },
    mainCauseField(STRANKE_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(STRANKE_CAUSES, input.mainCause);

    return [
      {
        // Listine lovi referent, ki stranko vodi — zato operativna ura.
        bucket: 'capacity',
        label: 'Opominjanje in lovljenje listin',
        valueEUR: input.chasingHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.chasingHoursPerMonth,
        addressableShare,
      },
      {
        // Na vsebinsko vprašanje stranke praviloma odgovori vodja ali izkušen
        // računovodja, ne referent — zato vodstvena ura.
        bucket: 'capacity',
        label: 'Odgovarjanje na ponavljajoča se vprašanja',
        valueEUR: input.inquiryHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.inquiryHoursPerMonth,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Spletni vpogled stranke v lastne dokumente in saldo',
    'Izmenjava dokumentov med bazo stranke in bazo servisa',
    'Koledar obveznosti in opomniki po stranki',
  ],
};

// --- 3. Obračuni, roki in konice --------------------------------------------

const OBRACUNI_CAUSES: CauseOption[] = [
  { label: 'Podatki niso pripravljeni pravočasno', category: 'planning' },
  { label: 'Obračuni in poročila se sestavljajo ročno', category: 'data' },
  { label: 'Delo ni enakomerno razporejeno čez mesec', category: 'planning' },
  { label: 'Stranke oddajo listine prepozno', category: 'external' },
  { label: 'Premalo ljudi za obseg dela', category: 'people' },
];

export const obracuniRs: ModuleDefinition = {
  id: 'obracuniRs',
  title: 'Obračuni, roki in konice',
  summary: 'Nadure ob rokih, ročna priprava obračunov, zunanja pomoč v konicah in globe zaradi zamud.',
  triage: {
    prompt: 'Kako pogosto se obračuni in oddaje rešujejo v zadnjem trenutku?',
    options: [
      { value: 0, label: 'Roke držimo brez konic' },
      { value: 1, label: 'Nekajkrat letno' },
      { value: 2, label: 'Vsak mesec ob DDV in plačah' },
      { value: 3, label: 'Skoraj vedno' },
    ],
  },
  fields: [
    {
      key: 'overtimeHoursPerMonth',
      label:
        'Koliko nadur mesečno v povprečju nastane zaradi konic ob obračunih in rokih (DDV, plače, zaključni računi)?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      // Ključ je `closingPrepHoursPerMonth` in ne `reportPrepHoursPerMonth`: pod slednjim
      // imenom je isto polje obstajalo tudi v horizontali Analitika in poročanje, ki je v
      // tem segmentu prav tako aktivna. Isti ključ z drugim pomenom je pomenil, da je
      // obiskovalec isto uro vpisal dvakrat — enkrat po računovodski (24 EUR), enkrat po
      // vodstveni uri (30 EUR). Ime `filingPrepHoursPerMonth` je zasedeno po pomenu:
      // "filing" v tem modulu pomeni arhiviranje.
      key: 'closingPrepHoursPerMonth',
      label:
        'Koliko ur mesečno porabite za ročno pripravo obračunov in poročil za stranke in državo — sestavljanje v Excelu, ročne kontrole in uskladitve pred oddajo?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help:
        'Samo obračuni in poročila za stranke in državo. Vnos listin meri področje Zajem, ' +
        'poročila za vaše lastno vodstvo pa področje Analitika in poročanje.',
      explainer:
        'Ure za obračune in poročila strank: DDV, plače, medletna poročila, priprava podatkov za ' +
        'oddajo. Vnos listin je že v področju Zajem. Primer: 2 osebi × 8 h ob koncu meseca ≈ 16 ur.',
    },
    {
      key: 'externalHelpCostEUR',
      label:
        'Koliko ste v zadnjih 12 mesecih porabili za zunanjo pomoč, študentsko delo ali podizvajalce v konicah?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
    },
    {
      key: 'latePenaltyCostEUR',
      label:
        'Kolikšni so bili v zadnjih 12 mesecih stroški glob in zamudnih obresti zaradi prepozno oddanih obračunov?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Samo posledice ZAMUDE. Doplačila zaradi napačne vsebine meri področje Napake in popravki.',
      explainer:
        'Samo posledice ZAMUDE pri oddaji: globe, zamudne obresti, doplačila za nujno urejanje. Seštejte ' +
        'zadnjih 12 mesecev; če jih ni bilo, vpišite 0.',
    },
    {
      key: 'closingProcess',
      label: 'Kako pripravljate mesečne obračune?',
      kind: 'choice',
      default: 2,
      contextOnly: true,
      choices: [
        { value: 0, label: 'Samodejno iz programa' },
        { value: 1, label: 'Iz programa, z nekaj ročnimi kontrolami' },
        { value: 2, label: 'Program in Excel' },
        { value: 3, label: 'Pretežno ročno' },
      ],
    },
    mainCauseField(OBRACUNI_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(OBRACUNI_CAUSES, input.mainCause);
    const rate = context.operationalHourCostEUR;

    return [
      {
        // Nadura je izplačana, a v koš 'capacity': tudi urejen servis dela enak
        // obseg dela, le brez konice. Prihranek ni odpuščanje, ampak razporeditev.
        bucket: 'capacity',
        label: 'Nadure ob obračunih in rokih',
        valueEUR: input.overtimeHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.overtimeHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'capacity',
        label: 'Ročna priprava obračunov in poročil',
        valueEUR: input.closingPrepHoursPerMonth * rate * MONTHS_PER_YEAR,
        hoursPerMonth: input.closingPrepHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Zunanja pomoč v konicah',
        valueEUR: input.externalHelpCostEUR,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Globe in obresti zaradi zamude pri oddaji',
        valueEUR: input.latePenaltyCostEUR,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Obračun DDV in priprava obrazcev za oddajo iz programa',
    'Obračun plač s pripadajočimi obrazci',
    'Koledar obveznosti z opomniki po stranki',
  ],
};

// --- 4. Napake, popravki in odgovornost -------------------------------------

const POPRAVKI_CAUSES: CauseOption[] = [
  { label: 'Podatki se vnašajo ročno in se ne kontrolirajo sproti', category: 'data' },
  { label: 'Kontrole so ročne in odvisne od posameznika', category: 'data' },
  { label: 'Vhodne listine so nepopolne ali nejasne', category: 'external' },
  { label: 'Delo poteka pod časovnim pritiskom', category: 'planning' },
  { label: 'Znanje in usposobljenost ekipe', category: 'people' },
];

export const popravkiRs: ModuleDefinition = {
  id: 'popravkiRs',
  title: 'Napake in popravki',
  summary: 'Popravljanje knjižb, dodatne kontrole pred oddajo, samoprijave in dobropisi zaradi lastne napake.',
  triage: {
    prompt: 'Kako pogosto je treba popravljati knjižbe, obračune ali že oddane obrazce?',
    options: [
      { value: 0, label: 'Redko' },
      { value: 1, label: 'Mesečno' },
      { value: 2, label: 'Tedensko' },
      { value: 3, label: 'Stalno' },
    ],
  },
  fields: [
    {
      key: 'correctionHoursPerMonth',
      label:
        'Koliko ur mesečno porabite za iskanje in popravljanje napačnih knjižb ter usklajevanje kontov, ki se ne izidejo?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
    },
    {
      key: 'reviewHoursPerMonth',
      label: 'Koliko ur mesečno porabi vodja za dodatne kontrole pred oddajo, ker podatkom ni mogoče povsem zaupati?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Samo kontrole zaradi negotovosti v podatke, ne rednega strokovnega pregleda in podpisa.',
      explainer:
        'Dodatne kontrole, ki jih delate SAMO zato, ker podatkom ne morete povsem zaupati — ne reden ' +
        'strokovni pregled in podpis. Primer: vodja 3 h na teden ≈ 13 ur na mesec.',
    },
    {
      key: 'selfReportCostEUR',
      label:
        'Kolikšni so bili v zadnjih 12 mesecih stroški samoprijav, doplačil in zamudnih obresti zaradi napačne vsebine, ki jih je krila vaša hiša?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
      help: 'Globe zaradi prepozne oddaje meri področje Obračuni, ne to.',
      explainer:
        'Stroški popravkov vsebinskih napak: samoprijave, popravki obračunov, zamudne obresti, doplačan ' +
        'davek. Seštejte zadnjih 12 mesecev.',
    },
    {
      key: 'creditNoteCostEUR',
      label:
        'Kolikšna je bila v zadnjih 12 mesecih vrednost dobropisov, popustov ali odpisanih storitev zaradi lastne napake?',
      kind: 'number',
      unit: 'EUR/leto',
      default: 0,
      allowUnknown: true,
    },
    mainCauseField(POPRAVKI_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(POPRAVKI_CAUSES, input.mainCause);

    return [
      {
        bucket: 'capacity',
        label: 'Popravljanje knjižb in usklajevanje kontov',
        valueEUR: input.correctionHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.correctionHoursPerMonth,
        addressableShare,
      },
      {
        // Kontrola pred oddajo je vodstvena ura: podpis pod obračun nosi
        // odgovornost, ki je referent ne more prevzeti.
        bucket: 'capacity',
        label: 'Dodatne kontrole pred oddajo',
        valueEUR: input.reviewHoursPerMonth * context.adminHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.reviewHoursPerMonth,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Samoprijave, doplačila in obresti',
        valueEUR: input.selfReportCostEUR,
        addressableShare,
      },
      {
        bucket: 'directLoss',
        label: 'Dobropisi in odpisane storitve',
        valueEUR: input.creditNoteCostEUR,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Kontrole obveznih polj in davčnih evidenc ob knjiženju',
    'Revizijska sled vsakega vnosa in popravka',
    'Predloge knjiženja, ki preprečijo napačen konto',
  ],
};

// --- 5. Neobračunano delo in donosnost strank -------------------------------

const DONOSNOST_CAUSES: CauseOption[] = [
  { label: 'Ne vemo, koliko časa porabimo za posamezno stranko', category: 'data' },
  { label: 'Dodatnega dela ne evidentiramo', category: 'data' },
  { label: 'Cenik ne sledi dejanskemu obsegu dela', category: 'planning' },
  { label: 'Stranke pričakujejo več, kot je dogovorjeno', category: 'external' },
  { label: 'Težko se odločimo za dvig cene', category: 'people' },
];

export const donosnostRs: ModuleDefinition = {
  id: 'donosnostRs',
  title: 'Neobračunano delo in donosnost strank',
  summary: 'Opravljeno delo, ki ni zaračunano, in stranke, ki po ceniku ne pokrijejo lastne cene.',
  triage: {
    prompt: 'Koliko dela opravite, a ga ne zaračunate?',
    options: [
      { value: 0, label: 'Zaračunamo skoraj vse' },
      { value: 1, label: 'Nekaj dodatnega dela' },
      { value: 2, label: 'Precej dela ostane nezaračunanega' },
      { value: 3, label: 'Cenik že dolgo ne pokriva dejanskega obsega' },
    ],
  },
  fields: [
    {
      key: 'unbilledHoursPerMonth',
      label:
        'Koliko ur mesečno opravite dela, ki ga stranki ne zaračunate (dodatna vprašanja, izredna poročila, svetovanje, popravki po njeni krivdi)?',
      kind: 'number',
      unit: 'h/mesec',
      default: 0,
      help: 'Vrednotimo po vašem strošku ure, ne po ceniku — izračun ne predpostavlja, da bi stranka to uro plačala.',
      explainer:
        'Ure, opravljene za stranko, ki nikoli ne pridejo na račun: dodatna vprašanja, svetovanje med ' +
        'letom, urejanje nereda pred obračunom. Primer: 40 strank × 1 h na mesec ≈ 40 ur.',
    },
    {
      key: 'belowCostClients',
      label: 'Koliko strank je po vaši oceni pod lastno ceno?',
      kind: 'number',
      unit: 'strank',
      default: 0,
    },
    {
      key: 'belowCostDeficitEUR',
      label: 'Kolikšen je povprečen mesečni primanjkljaj pri taki stranki?',
      kind: 'number',
      unit: 'EUR/mesec',
      default: 0,
      help: 'Razlika med tem, kar stranka plača, in tem, kar vas dejansko stane.',
      explainer:
        'Koliko na mesec izgubite pri eni taki stranki: kar plača, minus vaše ure × strošek ure. Primer: ' +
        'plača 150 EUR, porabite 12 ur × 26 EUR = 312 EUR → primanjkljaj 162 EUR.',
    },
    {
      /**
       * Ne vstopa v compute() tega področja, zato contextOnly — a ni okras:
       * naslov segmenta ("+X strank brez nove zaposlitve") deli sproščene ure
       * prav s to številko. Privzetih 8 h velja, dokler obiskovalec ne pove
       * svoje; ker je vrednost vedno izpolnjena, bi jo štetje med izpolnjena
       * polja tiho zvišalo oceno zanesljivosti.
       */
      key: 'hoursPerClientPerMonth',
      label: 'Koliko ur mesečno v povprečju porabite za eno stranko?',
      kind: 'number',
      unit: 'h/stranko',
      default: 8,
      contextOnly: true,
      help: 'Iz te številke izpeljemo, koliko dodatnih strank bi sprejeli s sproščenim časom.',
      explainer:
        'Povprečje čez vse stranke: skupne mesečne ure vseh zaposlenih delite s številom strank. Primer: ' +
        '600 ur / 60 strank = 10 ur na stranko.',
    },
    {
      key: 'declinedClientsPerYear',
      label: 'Koliko strank ste v zadnjih 12 mesecih zavrnili, ker niste imeli kapacitete?',
      kind: 'number',
      unit: 'strank/leto',
      default: 0,
      contextOnly: true,
      help: 'Podatek ne vstopa v izračun — pokaže, koliko rasti danes ni mogoče sprejeti.',
      explainer:
        'Koliko strank ste v zadnjih 12 mesecih zavrnili ali odsvetovali, ker niste imeli kapacitete.',
    },
    mainCauseField(DONOSNOST_CAUSES),
  ],
  compute: (input, context) => {
    const addressableShare = addressableShareOf(DONOSNOST_CAUSES, input.mainCause);

    return [
      {
        bucket: 'capacity',
        label: 'Neobračunano opravljeno delo',
        valueEUR: input.unbilledHoursPerMonth * context.operationalHourCostEUR * MONTHS_PER_YEAR,
        hoursPerMonth: input.unbilledHoursPerMonth,
        addressableShare,
      },
      {
        // Primanjkljaj ni izgubljen čas: te ure so opravljene in plačane, manjka pa
        // prihodek, ki bi jih pokril.
        //
        // Koš je vseeno 'lostMargin' in ne 'directLoss': znesek stoji na oceni stroška
        // po stranki, ki je servis po lastni diagnostiki (knowsClientProfitability)
        // pogosto ne pozna, njegova odprava pa predpostavlja dvig cene ali odhod
        // stranke — torej odločitev servisa in odziv stranke, ne knjižen odliv.
        bucket: 'lostMargin',
        label: 'Stranke pod lastno ceno',
        // Brez `note`: motor ga izriše samo pri košu 'risk' (RiskCard, pdf.ts) — tu bi bil
        // mrtev podatek. Pridržek nosi besedilo kartice nezaslužene marže na rezultatih.
        valueEUR: input.belowCostClients * input.belowCostDeficitEUR * MONTHS_PER_YEAR,
        addressableShare,
      },
    ];
  },
  pantheon: [
    'Evidenca opravljenega dela po stranki in storitvi',
    'Obračun storitev po ceniku iz evidentiranih ur',
    'Pregled donosnosti posamezne stranke',
  ],
};

// --- Kratka diagnostika -----------------------------------------------------

const DATA_RISK_NOTE: Record<RiskLevel, string> = {
  low: 'Porabljen čas in donosnost po stranki sta znana. Ceno in obseg dela je mogoče uskladiti, preden stranka postane izgubljena.',
  medium:
    'Podatki so delni. Da je stranka nedonosna, praviloma ugotovite šele ob koncu leta, ko pogodbe ni več mogoče popraviti.',
  high: 'Koliko vas posamezna stranka dejansko stane, ni znano. Dokler ni, ni mogoče izračunati, katere stranke servis financira iz drugih — in prav to je težava.',
};

const PROCESS_RISK_NOTE: Record<RiskLevel, string> = {
  low: 'Revizijska sled je urejena in servis ni odvisen od posameznika.',
  medium: 'Sledljivost je delna. Ob inšpekcijskem pregledu ali reklamaciji stranke je izvor napake težko dokazati.',
  high: 'Revizijske sledi praktično ni, znanje o strankah pa je v glavah posameznikov. Odsotnost ene osebe lahko ustavi obračune za več strank.',
};

/**
 * Štiri vprašanja, ki se prikažejo vedno in NE prispevajo nobenega evra.
 *
 * Namenoma brez zneska: kjer servis ne ve, koliko ur porabi za stranko, natančnega
 * zneska ni mogoče izračunati, navidezno natančna številka pa bi prav to težavo
 * skrila. Modul zato nima triaže in ne more biti "največja postavka".
 */
export const diagnostikaRs: ModuleDefinition = {
  id: 'diagnostikaRs',
  title: 'Kratka diagnostika',
  summary: 'Štiri vprašanja o podatkih in odpornosti procesa. Ne prispevajo k finančnemu rezultatu.',
  fields: [
    {
      key: 'knowsHoursPerClient',
      label: 'Ali veste, koliko ur mesečno porabite za posamezno stranko?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'knowsClientProfitability',
      label: 'Ali veste, katere stranke so za vas donosne in katere ne?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'auditTrail',
      label: 'Ali lahko za vsak vnos zanesljivo ugotovite, kdo ga je naredil in kdaj?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
    {
      key: 'keyPersonIndependence',
      label: 'Ali servis deluje normalno tudi brez ključne osebe?',
      kind: 'choice',
      default: ASSURANCE_UNANSWERED,
      choices: ASSURANCE_CHOICES,
    },
  ],
  compute: (input) => {
    const dataLevel = assuranceRiskLevel(input.knowsHoursPerClient, input.knowsClientProfitability);
    const processLevel = assuranceRiskLevel(input.auditTrail, input.keyPersonIndependence);

    return [
      {
        bucket: 'risk',
        label: 'Zanesljivost podatkov',
        ...(dataLevel
          ? { riskLevel: dataLevel, note: DATA_RISK_NOTE[dataLevel] }
          : { note: ASSURANCE_UNANSWERED_NOTE }),
      },
      {
        bucket: 'risk',
        label: 'Procesna odpornost',
        ...(processLevel
          ? { riskLevel: processLevel, note: PROCESS_RISK_NOTE[processLevel] }
          : { note: ASSURANCE_UNANSWERED_NOTE }),
      },
    ];
  },
  pantheon: [
    'Evidenca opravljenih ur po stranki',
    'Revizijska sled vseh vnosov in sprememb',
    'Dokumentiran postopek namesto znanja v glavah',
  ],
};

/** Vrstni red je hkrati prioriteta — odloči ob izenačenju v triaži. */
export const RACUNOVODSTVO_MODULES: ModuleDefinition[] = [
  zajemRs,
  strankeRs,
  obracuniRs,
  popravkiRs,
  donosnostRs,
  diagnostikaRs,
];
