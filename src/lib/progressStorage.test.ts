import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clearProgress, readProgress, saveProgress, type StoredProgress } from './progressStorage';
import { emptyProfileFor, getSegmentContext } from '../config/contexts';

/** Vitest teče v okolju 'node', kjer sessionStorage ne obstaja. */
function installSessionStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  });
  return store;
}

const PROGRESS: StoredProgress = {
  step: 'inputs',
  basicInfo: { industry: 'proizvodnja', employeeCount: 45 },
  profile: emptyProfileFor(getSegmentContext('proizvodnja')),
  moduleInputs: { zamude: { expediteCostEUR: 12_000 } },
  triageScores: { zamude: 3 },
  triageSelection: ['zamude'],
  inputsModuleId: 'zamude',
  submitted: false,
  reportSent: false,
};

describe('progressStorage', () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = installSessionStorage();
  });

  it('shranjen napredek se prebere nazaj cel', () => {
    saveProgress(PROGRESS);
    expect(readProgress()).toEqual(PROGRESS);
  });

  it('prazna shramba vrne null', () => {
    expect(readProgress()).toBeNull();
  });

  it('pokvarjen zapis vrne null in ne vrže', () => {
    store.set('lm10-napredek', '{ni JSON');
    expect(readProgress()).toBeNull();
  });

  it('zapis stare različice sheme se zavrže', () => {
    // Sicer bi po objavi nove različice orodja obudil vprašalnik, ki mu vsebina
    // ne ustreza več — npr. odgovore za modul, ki ga segment ne pozna. Ali pa
    // zapis s korakom 'results' iz časa, ko so rezultati stali pred obrazcem:
    // ta bi obrazec obšel.
    store.set('lm10-napredek', JSON.stringify({ ...PROGRESS, version: 0 }));
    expect(readProgress()).toBeNull();
    expect(store.has('lm10-napredek')).toBe(false);
  });

  it('kontaktnih podatkov ne hrani', () => {
    // Trditev v Koraku 1 ("nič ne zapusti brskalnika, dokler se sami ne odločite
    // oddati obrazca") velja za shrambo enako kot za omrežje.
    saveProgress(PROGRESS);
    const raw = store.get('lm10-napredek') ?? '';
    for (const field of ['email', 'firstName', 'lastName', 'phone', 'taxNumber', 'consent']) {
      expect(raw, field).not.toContain(field);
    }
  });

  it('oddaja preživi osvežitev, kontakt pa ne', () => {
    // Obrazec stoji pred rezultati: brez zastavice bi osvežitev na rezultatih
    // vrnila vprašalnik in terjala drugo oddajo. Kontakt kljub temu ne sme v
    // shrambo — zastavica je edino, kar iz obrazca ostane.
    saveProgress({ ...PROGRESS, step: 'results', submitted: true });
    expect(readProgress()?.submitted).toBe(true);
    const raw = store.get('lm10-napredek') ?? '';
    for (const field of ['email', 'firstName', 'lastName', 'phone', 'taxNumber', 'consent']) {
      expect(raw, field).not.toContain(field);
    }
  });

  it('poslano poročilo preživi osvežitev — brez naslova', () => {
    saveProgress({ ...PROGRESS, step: 'results', submitted: true, reportSent: true });
    expect(readProgress()?.reportSent).toBe(true);
    // Naslov je kontakt; zastavica pove le, da je poročilo odšlo.
    expect(store.get('lm10-napredek') ?? '').not.toContain('@');
  });

  it('zapis brez zastavice o poslanem poročilu pomeni, da poročilo ni odšlo', () => {
    // Dodano brez dviga sheme: zapis iz prejšnje različice orodja se ne zavrže,
    // rezultati pa mu ponudijo gumb za prenos — varna razlaga manjkajočega polja.
    saveProgress(PROGRESS);
    const stored = JSON.parse(store.get('lm10-napredek') ?? '{}') as Record<string, unknown>;
    delete stored.reportSent;
    store.set('lm10-napredek', JSON.stringify(stored));
    expect(readProgress()?.reportSent).toBe(false);
  });

  it('clearProgress zapis odstrani', () => {
    saveProgress(PROGRESS);
    clearProgress();
    expect(readProgress()).toBeNull();
  });

  it('nedosegljiva shramba ne vrže — orodje deluje brez nje', () => {
    vi.stubGlobal('sessionStorage', {
      getItem: () => {
        throw new Error('zasebno brskanje');
      },
      setItem: () => {
        throw new Error('zasebno brskanje');
      },
      removeItem: () => {
        throw new Error('zasebno brskanje');
      },
    });
    expect(() => saveProgress(PROGRESS)).not.toThrow();
    expect(() => clearProgress()).not.toThrow();
    expect(readProgress()).toBeNull();
  });
});
