import type {
  ContextOption,
  ContextQuestion,
  CostAssumption,
  CostQuestion,
  SegmentContext,
} from '../config/contexts';
import { MAIN_CAUSE_KEY } from '../config/modules/addressableShare';
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
 * Oznaka izbranega razpona urne postavke, kadar je vrednost le ocena.
 *
 * Ujame se po `midpointEUR` in ne po id-ju, ker se izbrani pas nikjer ne shrani —
 * profil hrani samo sredino. Enako počne StepCostBasis pri ponovnem prikazu koraka.
 *
 * Vrednost, enaka privzetku dejavnosti, se NE prizna za izbran razpon. CostAssumption
 * hrani le `{ valueEUR, estimated }` in nedotaknjenega polja od izbire ne loči; pri
 * nekaterih dejavnostih pa se privzetek slučajno ujema s sredino enega od razponov
 * (veleprodaja: privzetih 24 EUR je hkrati sredina razpona 20–28). Brez tega pogoja
 * bi poročilo trdilo, da je stranka nekaj izbrala, česar se ni dotaknila. Kdor tak
 * razpon res izbere, je prikazan konservativno — smer napake je vedno ista: raje
 * priznamo manj podatka, kot da bi si ga izmislili.
 */
export function costBandLabel(
  question: CostQuestion | undefined,
  assumption: CostAssumption,
): string | null {
  if (!question || !assumption.estimated) return null;
  if (assumption.valueEUR === question.fallbackEUR) return null;
  return question.bands.find((band) => band.midpointEUR === assumption.valueEUR)?.label ?? null;
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
