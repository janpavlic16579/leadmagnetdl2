import { describe, expect, it } from 'vitest';
import { RELOAD_STORAGE_KEY, shouldReloadAfterPreloadError } from './preloadRecovery';

function fakeStorage(initial: Record<string, string> = {}) {
  const data: Record<string, string> = { ...initial };
  return {
    data,
    getItem: (key: string) => (key in data ? data[key] : null),
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
  };
}

describe('shouldReloadAfterPreloadError', () => {
  it('prvi padli kos osveži stran in si zapomni čas', () => {
    const storage = fakeStorage();
    expect(shouldReloadAfterPreloadError(storage, 1_000_000)).toBe(true);
    expect(storage.data[RELOAD_STORAGE_KEY]).toBe('1000000');
  });

  it('drugi padec v isti minuti ne osveži — sicer bi se stran vrtela v zanki', () => {
    const storage = fakeStorage();
    expect(shouldReloadAfterPreloadError(storage, 1_000_000)).toBe(true);
    expect(shouldReloadAfterPreloadError(storage, 1_000_000 + 30_000)).toBe(false);
  });

  it('po minuti sme znova — objava čez uro ne sme obtičati na stari', () => {
    const storage = fakeStorage({ [RELOAD_STORAGE_KEY]: '1000000' });
    expect(shouldReloadAfterPreloadError(storage, 1_000_000 + 61_000)).toBe(true);
  });

  it('pokvarjen zapis šteje kot nobeden', () => {
    const storage = fakeStorage({ [RELOAD_STORAGE_KEY]: 'x' });
    expect(shouldReloadAfterPreloadError(storage, 5)).toBe(true);
  });

  it('brez shrambe ali ob njeni napaki ne osveži — brez varovala pred zanko raje meja napak', () => {
    expect(shouldReloadAfterPreloadError(null, 5)).toBe(false);
    const broken = {
      getItem: () => {
        throw new Error('blokirano');
      },
      setItem: () => {},
    };
    expect(shouldReloadAfterPreloadError(broken, 5)).toBe(false);
  });
});
