import type { BusinessProfile } from '../config/contexts';
import type { TriageScores } from './moduleEngine';
import type { BasicInfo, FlowStep, ModuleInputsState } from '../types';

/**
 * Ohranjanje napredka med osvežitvijo strani.
 *
 * Vprašalnik obljublja "okoli deset minut", vse odgovore pa je hranil izključno
 * v pomnilniku komponente. Osvežitev, pomotoma pritisnjen gumb Nazaj ali gib
 * "swipe back" na telefonu so obiskovalca vrnili na Korak 1 s praznim
 * vprašalnikom — brez opozorila in brez poti nazaj. Pri orodju, ki naj bi
 * pripeljalo do e-naslova, je to najdražja možna izguba.
 *
 * `sessionStorage` in ne `localStorage`: napredek velja za ta zavihek in to sejo.
 * Trditev v Koraku 1 ("nič ne zapusti brskalnika") s tem ostane resnična, hkrati
 * pa tuji vnosi ne čakajo na naslednjega uporabnika istega računalnika.
 *
 * Kontaktnih podatkov iz obrazca tu NAMENOMA ni — ne pred oddajo ne po njej.
 * Po oddaji ostane v zapisu samo zastavica `submitted`: obrazec stoji PRED
 * rezultati, zato bi osvežitev na rezultatih brez nje vrnila vprašalnik in
 * terjala drugo oddajo — podvojen lead.
 */

const STORAGE_KEY = 'lm10-napredek';

/**
 * Različica sheme. Ob spremembi oblike stanja jo je treba dvigniti — sicer bi
 * star zapis obudil vprašalnik, ki mu vsebina ne ustreza več (npr. odgovori za
 * modul, ki ga segment ne pozna).
 *
 * 2: `submitted`. Dvig ni bil formalnost: zapis različice 1 s korakom 'results'
 * je nastal, ko so rezultati stali PRED obrazcem — po objavi bi obiskovalca
 * postavil na rezultate z `submitted = false` in obrazec obšel.
 */
const SCHEMA_VERSION = 2;

export interface StoredProgress {
  step: FlowStep;
  basicInfo: BasicInfo;
  profile: BusinessProfile;
  moduleInputs: ModuleInputsState;
  triageScores: TriageScores;
  triageSelection: string[] | null;
  inputsModuleId: string | null;
  /** Obrazec je oddan — edino, kar se iz obrazca shrani (glej glavo). */
  submitted: boolean;
}

interface Envelope extends StoredProgress {
  version: number;
}

export function saveProgress(progress: StoredProgress): void {
  try {
    const envelope: Envelope = { version: SCHEMA_VERSION, ...progress };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // Zasebno brskanje, poln ali blokiran sessionStorage. Shranjevanje je udobje
    // in ne pogoj: brez njega tok deluje natanko tako kot prej.
  }
}

export function clearProgress(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Glej saveProgress.
  }
}

/**
 * Prebere shranjen napredek. `null` = nič uporabnega — prazno, pokvarjeno ali
 * iz stare različice sheme.
 *
 * Vsebina ni preverjena polje za poljem: prihaja iz iste aplikacije v istem
 * zavihku, ne od zunaj. Preverjena sta različica in oblika ovojnice, ker sta
 * edina, ki lahko odpovesta po objavi nove različice orodja.
 */
export function readProgress(): StoredProgress | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;

    const envelope = parsed as Partial<Envelope>;
    if (envelope.version !== SCHEMA_VERSION) {
      clearProgress();
      return null;
    }
    if (!envelope.step || !envelope.basicInfo || !envelope.profile) return null;

    return {
      step: envelope.step,
      basicInfo: envelope.basicInfo,
      profile: envelope.profile,
      moduleInputs: envelope.moduleInputs ?? {},
      triageScores: envelope.triageScores ?? {},
      triageSelection: envelope.triageSelection ?? null,
      inputsModuleId: envelope.inputsModuleId ?? null,
      submitted: envelope.submitted ?? false,
    };
  } catch {
    return null;
  }
}
