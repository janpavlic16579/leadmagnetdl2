import type { SegmentId } from './segmentTypes';

/**
 * Dejavnosti, med katerimi obiskovalec izbira v Koraku 1, in preslikava v segment.
 *
 * To je edino mesto, kjer se ureja seznam — marketing lahko doda dejavnost brez
 * poseganja v logiko. Dejavnosti, ki nimajo svojega segmenta, se preslikajo v
 * 'splosno' (splošni pogled za direktorja/CFO).
 *
 * Vrstni red določa vrstni red v spustnem seznamu; 'drugo' naj ostane zadnja.
 */
export interface IndustryOption {
  id: string;
  /** Oznaka za prikaz in za izvozni zapis (CRM). */
  label: string;
  /**
   * Besedilo, ki ga vidi obiskovalec, kadar se od oznake za CRM razlikuje.
   * Pod-dejavnosti pod "Drugo" potrebujeta obe: prodajnik mora v zapisu videti
   * "Drugo — storitve", obiskovalec pa cel stavek o svojem načinu dela.
   */
  choiceLabel?: string;
  segment: SegmentId;
}

export const INDUSTRIES: IndustryOption[] = [
  { id: 'proizvodnja', label: 'Proizvodnja', segment: 'proizvodnja' },
  { id: 'trgovina', label: 'Trgovina, veleprodaja in distribucija', segment: 'trgovina' },
  { id: 'racunovodstvo', label: 'Računovodski servisi', segment: 'racunovodstvo' },
  { id: 'storitve', label: 'Storitvena in projektna podjetja', segment: 'storitve' },
  // Maloprodaja meri druge stvari kot veleprodaja: polica, blagajna in manko proti
  // pošiljki, plačilnemu roku in komisioniranju. Skupen segment bi enega od obeh
  // spraševal po številkah, ki jih sploh ne vodi.
  { id: 'maloprodaja', label: 'Maloprodaja', segment: 'maloprodaja' },
  // PANTHEON nima posebne logistične licence ne vertikale — vertikale so samo
  // Farming, Vet in Public Service. Logistiko pokrivata Enterprise izdaji SE in ME
  // na ravni financ, naročil, dokumentacije, stroškov in obračunavanja. To je
  // omejitev PONUDBE, ne vprašalnika: prevozniku in skladiščniku veleprodajna
  // vprašanja o pošiljkah in plačilnih rokih niso merila njegovih stroškov, zato
  // ima logistika svoj segment z lastnimi moduli (config/modules/logistika.ts).
  { id: 'logistika', label: 'Logistika in transport', segment: 'logistika' },
  // Odkar imajo storitve svoj segment, je 'splosno' iz spustnega seznama sicer
  // nedosegljiv — ostal bi le kot varovalo za neznano dejavnost in kampanjski ?s=.
  // Ta vnos ga vrne med izbire; po dogovoru v komentarju zgoraj je zadnji.
  { id: 'drugo', label: 'Drugo', segment: 'splosno' },
];

/**
 * Pod-dejavnosti, ki se prikažejo šele po izbiri "Drugo".
 *
 * Velik del obiskovalcev, ki izberejo "Drugo", NI zunaj obstoječih segmentov —
 * gradbinec, agencija in IT-hiša so storitveno-projektna podjetja, izberejo pa
 * "Drugo", ker v seznamu ni njihove PANOGE, čeprav obstaja njihov POSLOVNI MODEL.
 * Vprašanje je zato zastavljeno po modelu in ne po panogi: seznama panog ni
 * mogoče dopolniti do popolnosti, modelov pa je malo.
 *
 * Kdor zavrne vse štiri, pade v 'splosno' — tam ga čaka vprašalnik, ki namenoma
 * ne predpostavi, kaj podjetje počne (config/modules/splosno.ts).
 *
 * Oznake se začnejo z "Drugo — ", ker gredo v izvozni zapis za CRM: prodajnik
 * mora videti, da se obiskovalec ni prepoznal v nobeni panogi, tudi če je nato
 * odgovarjal na storitvena vprašanja.
 */
export const DRUGO_SUB_INDUSTRIES: IndustryOption[] = [
  {
    id: 'drugo_izdelki',
    label: 'Drugo — izdelki',
    choiceLabel: 'Izdelujemo ali predelujemo izdelke',
    segment: 'proizvodnja',
  },
  {
    id: 'drugo_blago',
    label: 'Drugo — blago',
    choiceLabel: 'Prodajamo ali distribuiramo blago',
    segment: 'trgovina',
  },
  {
    id: 'drugo_storitve',
    label: 'Drugo — storitve',
    choiceLabel: 'Zaračunavamo ure, projekte ali storitve',
    segment: 'storitve',
  },
  {
    id: 'drugo_prevoz',
    label: 'Drugo — prevoz in skladiščenje',
    choiceLabel: 'Prevažamo ali skladiščimo za druge',
    segment: 'logistika',
  },
  {
    id: 'drugo_nic',
    label: 'Drugo — nerazvrščeno',
    choiceLabel: 'Nič od tega ne ustreza',
    segment: 'splosno',
  },
];

export const SUB_INDUSTRY_QUESTION = 'Kaj je najbliže vašemu načinu dela?';

/** Kar vidi obiskovalec; brez lastne oznake je to kar oznaka dejavnosti. */
export function industryChoiceLabel(option: IndustryOption): string {
  return option.choiceLabel ?? option.label;
}

/** Id 'drugo' sam po sebi ni izbira, ampak vrata do pod-dejavnosti. */
export const DRUGO_ID = 'drugo';

/**
 * Ali je izbira dejavnosti popoln odgovor.
 *
 * Sam 'drugo' ni: manjka podizbira in vprašalnika še ne poznamo. Predikat ima
 * dva odjemalca — gumb "Naprej" v Koraku 1 in izbiro nagovora na uvodnem
 * zaslonu — in prav zato mora biti en sam. Segment tega ne more povedati:
 * getSegmentForIndustry('') vrne 'splosno' enako kot 'drugo_nic', zato je
 * razlika med "ni izbral" in "izbral je splošno" samo tu.
 */
export function isCompleteIndustryChoice(industryId: string): boolean {
  return industryId.length > 0 && industryId !== DRUGO_ID;
}

/** Spustni seznam in pod-dejavnosti skupaj — edini vir za preslikavo in oznake. */
const ALL_INDUSTRIES: IndustryOption[] = [...INDUSTRIES, ...DRUGO_SUB_INDUSTRIES];

/** Varovalo: neznana ali prazna dejavnost pade v splošni pogled, nikoli v napako. */
export const FALLBACK_SEGMENT: SegmentId = 'splosno';

export function getSegmentForIndustry(industryId: string): SegmentId {
  return ALL_INDUSTRIES.find((industry) => industry.id === industryId)?.segment ?? FALLBACK_SEGMENT;
}

export function getIndustryLabel(industryId: string): string {
  return ALL_INDUSTRIES.find((industry) => industry.id === industryId)?.label ?? '';
}

/** Pod-dejavnost za dani id, če gre zanjo — StepIndustry po njej izpelje izbiro v seznamu. */
export function findSubIndustry(industryId: string): IndustryOption | undefined {
  return DRUGO_SUB_INDUSTRIES.find((industry) => industry.id === industryId);
}

/**
 * Dejavnost, ki jo prednastavi kampanjska povezava ?s=.
 *
 * Segment nima več lastnega stanja: `?s=proizvodnja` ne obide Koraka 1, ampak v
 * njem izbere dejavnost. Obiskovalec tako vidi, kaj je povezava predpostavila, in
 * lahko izbiro popravi — prej je ročni override obstal do konca seje in je spustni
 * seznam v Koraku 1 postal okrasen.
 *
 * Id 'drugo' je izrecno izpuščen: preslika se sicer v 'splosno', a sam po sebi ni
 * popoln odgovor (StepIndustry zahteva podizbiro), zato bi ?s=splosno pripeljal
 * obiskovalca na zaslon z onemogočenim gumbom Naprej. Zanj se poišče 'drugo_nic'.
 */
export function getIndustryForSegment(segmentId: SegmentId): string {
  const match = ALL_INDUSTRIES.find(
    (industry) => industry.segment === segmentId && industry.id !== DRUGO_ID,
  );
  return match?.id ?? '';
}
