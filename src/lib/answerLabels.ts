import { industryAverageBand } from '../config/contexts';
import type {
  ContextOption,
  ContextQuestion,
  CostAssumption,
  CostQuestion,
  SegmentContext,
} from '../config/contexts';
import { MAIN_CAUSE_KEY } from '../config/modules/addressableShare';
import { isUnknownAnswer } from '../config/modules/moduleTypes';
import type { ModuleDefinition, ModuleField } from '../config/modules/moduleTypes';
import { formatNumber, formatPercent } from './format';

/**
 * Preslikava shranjenih odgovorov nazaj v slovensko besedilo.
 *
 * Vprašalnik hrani samo strojne vrednosti: profil ima `currentSystem: 'pantheonWms'`,
 * triaža oceno 0–3, glavni vzrok pa indeks izbire. To je pravilno — id je stabilen,
 * oznaka je vsebina in se sme spremeniti — a pomeni, da nihče, ki zapis bere pozneje,
 * iz njega ne razbere ničesar. Doslej te plasti ni bilo, ker odgovorov nikoli nismo
 * prikazali nazaj; prodajno poročilo je prvi bralec, ki jih potrebuje.
 *
 * Vse funkcije so totalne: neznan id vrne null in ne vrže izjeme. Poročilo, ki se
 * podre zaradi ene manjkajoče oznake, je slabše od poročila z eno prazno celico.
 */

/** Oznaka izbrane možnosti kontekstnega vprašanja (dejavnost, sistem, vloga). */
export function contextOptionLabel(
  question: ContextQuestion<ContextOption> | undefined,
  id: string | null,
): string | null {
  if (!question || id === null) return null;
  return question.options.find((option) => option.id === id)?.label ?? null;
}

/**
 * Vloga, kot jo prebere svetovalec: "Drugo — vodja IT", kadar si jo je obiskovalec
 * vpisal sam. Skupna za HTML poročilo in PDF, ker morata vrstici ostati enaki —
 * dvakrat sestavljen niz bi se prej ali slej razšel v presledku ali pomišljaju.
 */
export function roleDisplay(roleLabel: string | null, roleOther: string | null): string {
  const own = roleOther?.trim();
  if (!roleLabel) return own || '—';
  return own ? `${roleLabel} — ${own}` : roleLabel;
}

/** Je izbrani sistem obstoječi PANTHEON — od tega je odvisna vidnost modula E. */
export function isPantheonCustomer(
  context: SegmentContext | undefined,
  systemId: string | null,
): boolean {
  if (!context || systemId === null) return false;
  return context.currentSystem.options.some(
    (option) => option.id === systemId && option.isPantheon === true,
  );
}

/**
 * Oznaka razpona urne postavke, kadar vrednost ni vnesena številka.
 *
 * Pas se najde po zapisanem `bandId`. Prej se je ugibal z ujemanjem `midpointEUR`,
 * kar je terjalo posebno varovalo: vrednost, enaka privzetku dejavnosti, se ni
 * priznala za izbiro, ker nedotaknjenega polja ni bilo mogoče ločiti od izbranega
 * pasu z isto sredino. Varovalo je odpadlo skupaj z ugibanjem — in je moralo, ker
 * je povprečje panoge NATANKO privzetek dejavnosti: z njim bi izrecno izbiro
 * obiskovalca razglasili za neodgovor.
 *
 * Povprečje panoge dobi oznako pasu, v katerem leži. Da je to NAŠA ocena in ne
 * obiskovalčeva, pove `source` v prodajni pripravi (hourAssumptionSource) — tu se
 * imenuje samo razpon, v katerem se izračun giblje.
 */
export function costBandLabel(
  question: CostQuestion | undefined,
  assumption: CostAssumption,
): string | null {
  if (!question) return null;
  if (assumption.source === 'band') {
    return question.bands.find((band) => band.id === assumption.bandId)?.label ?? null;
  }
  if (assumption.source === 'industryAverage') return industryAverageBand(question)?.label ?? null;
  return null;
}

/** Polje z glavnim vzrokom, če ga modul ima (diagnostični in E ga nimata). */
export function mainCauseField(definition: ModuleDefinition): ModuleField | undefined {
  return definition.fields.find((field) => field.key === MAIN_CAUSE_KEY);
}

/**
 * Oznaka izbranega glavnega vzroka.
 *
 * Seznami vzrokov so v modulih privatni, a jih mainCauseField() ob sestavljanju
 * vpeče med izbire polja — od tam so dosegljivi brez novega izvoza.
 */
export function mainCauseLabel(definition: ModuleDefinition, index: number): string | null {
  const field = mainCauseField(definition);
  return field?.choices?.find((choice) => choice.value === index)?.label ?? null;
}

/** Besedilo triažne ocene ("Skoraj vsak dan"), ne le številka 0–3. */
export function triageScoreLabel(definition: ModuleDefinition, score: number): string | null {
  return definition.triage?.options.find((option) => option.value === score)?.label ?? null;
}

/**
 * Odgovor na eno polje, kot ga je smiselno prebrati.
 *
 * Odstotki so shranjeni kot ulomek in bi se sicer izpisali kot "0,03" — enota, ki
 * je obiskovalec ni videl. Enota se pripne le, kadar obstaja; polja tipa choice in
 * checkbox je nimajo.
 */
export function fieldAnswerText(field: ModuleField, value: number): string {
  // Sentinela "ne vem" pri številskih poljih je -1 (config/modules/moduleTypes.ts).
  // Brez te veje se je v prodajni pripravi izpisala dobesedno — "−1 EUR/leto",
  // z virom "vneseno". Prodajnik je torej bral izmišljen negativen znesek tam,
  // kjer je stranka izrecno povedala, da podatka nima.
  if (isUnknownAnswer(value)) return '„Ne vem"';
  if (field.kind === 'choice') {
    return field.choices?.find((choice) => choice.value === value)?.label ?? String(value);
  }
  if (field.kind === 'checkbox') {
    return value === 1 ? 'Da' : 'Ne';
  }
  if (field.kind === 'percent') {
    return formatPercent(value);
  }
  return field.unit ? `${formatNumber(value)} ${field.unit}` : formatNumber(value);
}

/**
 * Je vrednost obiskovalčev podatek ali le privzetek, ki se ga ni dotaknil.
 *
 * Ista primerjava kot v isModuleAnswered in assessConfidence: nedotaknjen drsnik s
 * privzetkom nad 0 ne sme veljati za odgovor, sicer bi prazen obrazec izpadel kot
 * izpolnjen.
 */
export function isAnswered(field: ModuleField, value: number | undefined): boolean {
  return value !== undefined && value !== field.default;
}

/** Je pri izbirnem polju izbran odgovor "Ne vem". */
export function isUnknownChoice(field: ModuleField, value: number | undefined): boolean {
  if (field.kind !== 'choice') return false;
  return field.choices?.find((choice) => choice.value === value)?.unknown === true;
}

/**
 * Od kod vrednost prihaja — v enem izrazu, ki se izpiše ob odgovoru.
 *
 * Trije primeri, ki jih mora prodajnik ločiti: strankin podatek, izrecno priznano
 * neznanje in nedotaknjen privzetek. Zadnja dva sta oba "mehka", a povesta različno:
 * "Ne vem" je odgovor, privzetek pa je odsotnost odgovora.
 */
export function answerSource(field: ModuleField, value: number | undefined): string {
  if (isUnknownChoice(field, value) || isUnknownAnswer(value)) return '„Ne vem"';
  return isAnswered(field, value) ? 'vneseno' : 'privzeto';
}
