import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextPaint } from './nextPaint';

describe('nextPaint', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('brez requestAnimationFrame (node) se razreši takoj', async () => {
    expect(typeof globalThis.requestAnimationFrame).toBe('undefined');
    await expect(nextPaint()).resolves.toBeUndefined();
  });

  it('se razreši šele PO izrisu: rAF, nato setTimeout 0', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        setTimeout(() => callback(16), 16);
        return 1;
      }),
    );
    let done = false;
    void nextPaint().then(() => {
      done = true;
    });

    // rAF je tekel, izris še ni končan (setTimeout 0 znotraj rAF še čaka).
    await vi.advanceTimersByTimeAsync(16);
    expect(done).toBe(false);
    // Lažni časovniki časovnik z zamikom 0, ustvarjen MED tikom, načrtujejo
    // 1 ms pozneje (varovalo pred neskončno zanko) — zato 1 in ne 0.
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toBe(true);
  });

  it('skrit zavihek: rAF nikoli ne pokliče, varovalo razreši po 100 ms', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    let done = false;
    void nextPaint().then(() => {
      done = true;
    });

    await vi.advanceTimersByTimeAsync(99);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toBe(true);
  });
});
