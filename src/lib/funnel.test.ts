import { describe, expect, it, vi } from 'vitest';
import {
  MAX_EVENTS_PER_BATCH,
  MAX_PENDING,
  MAX_STRING_LENGTH,
  createFunnelQueue,
  describeVisit,
  newVisitId,
  sanitizeProps,
  sendBeaconOrFetch,
  type FunnelEnvelope,
  type FunnelVisit,
} from './funnel';

const VISIT: FunnelVisit = {
  id: 'obisk-1',
  startedAt: '2026-09-05T08:00:00.000Z',
  device: 'desktop',
  utmSource: 'linkedin',
  internal: false,
};

/** Vrsta s takojšnjim odlogom, ki ga test sproži sam — brez časovnikov. */
function queueWithManualFlush() {
  const send = vi.fn<(body: string) => boolean>().mockReturnValue(true);
  let deferred: (() => void) | null = null;
  let tick = 0;
  const queue = createFunnelQueue({
    visit: VISIT,
    send,
    now: () => new Date(Date.UTC(2026, 8, 5, 8, 0, tick++)),
    defer: (flush) => {
      deferred = flush;
    },
  });
  const runDeferred = () => {
    const flush = deferred;
    deferred = null;
    flush?.();
  };
  const sent = (): FunnelEnvelope[] => send.mock.calls.map(([body]) => JSON.parse(body));
  return { queue, send, runDeferred, sent };
}

describe('createFunnelQueue', () => {
  it('dogodke istega trenutka združi v en paket z obiskom in zaporedjem', () => {
    const { queue, runDeferred, sent } = queueWithManualFlush();

    queue.record('lm10_triage_done', { segment: 'proizvodnja', selectedAreas: 3 });
    queue.record('lm10_step_view', { step: 'costBasis', stepIndex: 4 });
    expect(queue.pending()).toBe(2);

    runDeferred();

    expect(sent()).toHaveLength(1);
    const [envelope] = sent();
    expect(envelope.visit).toEqual(VISIT);
    expect(envelope.events.map((event) => [event.seq, event.event])).toEqual([
      [1, 'lm10_triage_done'],
      [2, 'lm10_step_view'],
    ]);
    expect(envelope.events[0].t).toBe('2026-09-05T08:00:00.000Z');
    expect(envelope.events[1].t).toBe('2026-09-05T08:00:01.000Z');
    expect(queue.pending()).toBe(0);
  });

  it('zaporedje teče čez pakete naprej — sprejemnik po njem ureja obisk', () => {
    const { queue, runDeferred, sent } = queueWithManualFlush();

    queue.record('lm10_step_view', { step: 'industry' });
    runDeferred();
    queue.record('lm10_step_view', { step: 'employeeCount' });
    runDeferred();

    expect(sent().map((envelope) => envelope.events[0].seq)).toEqual([1, 2]);
  });

  it('flush pošlje takoj, mimo odloga, in s prazno vrsto ne pošlje nič', () => {
    const { queue, send, runDeferred, sent } = queueWithManualFlush();

    queue.record('lm10_step_view', { step: 'inputs' });
    queue.flush();
    expect(sent()).toHaveLength(1);

    // Odlog, ki še visi, ob praznem stanju ne pošlje drugega paketa.
    runDeferred();
    queue.flush();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('več kot MAX_EVENTS_PER_BATCH dogodkov gre v več paketov', () => {
    const { queue, runDeferred, sent } = queueWithManualFlush();

    for (let i = 0; i < MAX_EVENTS_PER_BATCH + 5; i++) queue.record('lm10_step_view', { i });
    runDeferred();

    expect(sent().map((envelope) => envelope.events.length)).toEqual([MAX_EVENTS_PER_BATCH, 5]);
  });

  it('nad MAX_PENDING odpadejo najstarejši — merjenje sme izgubiti dogodek', () => {
    const { queue } = queueWithManualFlush();

    for (let i = 0; i < MAX_PENDING + 10; i++) queue.record('lm10_step_view', { i });

    expect(queue.pending()).toBe(MAX_PENDING);
  });

  it('pošiljanje, ki vrže, ne vrže naprej in vrsto vseeno izprazni', () => {
    const send = vi.fn().mockImplementation(() => {
      throw new Error('beacon');
    });
    let deferred: (() => void) | null = null;
    const queue = createFunnelQueue({ visit: VISIT, send, defer: (flush) => (deferred = flush) });

    queue.record('lm10_step_view', { step: 'industry' });
    expect(() => deferred?.()).not.toThrow();
    expect(queue.pending()).toBe(0);
  });

  /**
   * Trditev o obliki, ne o izvedbi: karkoli bi kdaj dodal lastnost obisku, mora
   * mimo tega testa — obisk je edino mesto, kjer bi se lahko prikradel podatek,
   * ki ni razred (npr. user agent ali ime podjetja).
   */
  it('ovojnica nosi samo obisk in dogodke, obisk pa samo pet razredov', () => {
    const { queue, runDeferred, sent } = queueWithManualFlush();
    queue.record('lm10_step_view', { step: 'industry' });
    runDeferred();

    const [envelope] = sent();
    expect(Object.keys(envelope).sort()).toEqual(['events', 'visit']);
    expect(Object.keys(envelope.visit).sort()).toEqual(
      ['device', 'id', 'internal', 'startedAt', 'utmSource'].sort(),
    );
    expect(Object.keys(envelope.events[0]).sort()).toEqual(['event', 'props', 'seq', 't']);
  });
});

describe('sanitizeProps', () => {
  it('obdrži nize in končna števila, vse drugo izpusti, nize obreže', () => {
    const clean = sanitizeProps({
      step: 'inputs',
      stepIndex: 5,
      nan: Number.NaN,
      flag: true,
      nested: { a: 1 },
      long: 'x'.repeat(MAX_STRING_LENGTH + 50),
    });

    expect(clean).toEqual({ step: 'inputs', stepIndex: 5, long: 'x'.repeat(MAX_STRING_LENGTH) });
  });
});

describe('describeVisit', () => {
  const base = { id: 'obisk-1', startedAt: new Date('2026-09-05T08:00:00Z') };

  it('prebere utm_source in interni način iz naslova, razred zaslona iz širine', () => {
    expect(describeVisit({ ...base, search: '?s=proizvodnja&utm_source=linkedin&debug=1', narrowScreen: true })).toEqual({
      id: 'obisk-1',
      startedAt: '2026-09-05T08:00:00.000Z',
      device: 'mobile',
      utmSource: 'linkedin',
      internal: true,
    });
  });

  it('brez parametrov: prazen vir, ni interni, namizje', () => {
    expect(describeVisit({ ...base, search: '', narrowScreen: false })).toMatchObject({
      device: 'desktop',
      utmSource: '',
      internal: false,
    });
  });

  it('interni način vklopi samo natanko debug=1 — isto pravilo kot App.tsx', () => {
    expect(describeVisit({ ...base, search: '?debug=true', narrowScreen: false }).internal).toBe(false);
    expect(describeVisit({ ...base, search: '?debug=1', narrowScreen: false }).internal).toBe(true);
  });

  it('predolg utm_source obreže — naslov je javen vhod', () => {
    const search = `?utm_source=${'a'.repeat(500)}`;
    expect(describeVisit({ ...base, search, narrowScreen: false }).utmSource).toHaveLength(MAX_STRING_LENGTH);
  });
});

describe('newVisitId', () => {
  it('uporabi randomUUID, kadar obstaja', () => {
    const uuid = '01234567-89ab-cdef-0123-456789abcdef';
    expect(newVisitId({ randomUUID: () => uuid })).toBe(uuid);
  });

  it('brez varnega konteksta vrne naključen niz, ki ni prazen in ni ponovljiv', () => {
    const first = newVisitId(undefined);
    const second = newVisitId(undefined);
    expect(first.length).toBeGreaterThan(8);
    expect(first).not.toBe(second);
  });
});

describe('sendBeaconOrFetch', () => {
  it('najprej beacon; ob sprejemu fetch ne pride na vrsto', () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    const fetchImpl = vi.fn();

    expect(sendBeaconOrFetch('https://x', '{}', { sendBeacon, fetch: fetchImpl as never })).toBe(true);
    expect(sendBeacon).toHaveBeenCalledWith('https://x', '{}');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  /**
   * Isti razlog kot v submitLead.ts: `application/json` sproži predhodno zahtevo
   * CORS, na katero Apps Script ne odgovori. Beacon z nizom pošlje text/plain
   * sam od sebe; rezerva prek fetch mora to izbrati izrecno.
   */
  it('zavrnjen ali manjkajoč beacon pade na fetch s text/plain in keepalive', () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true });

    expect(sendBeaconOrFetch('https://x', '{}', { sendBeacon: () => false, fetch: fetchImpl as never })).toBe(true);
    expect(sendBeaconOrFetch('https://x', '{}', { fetch: fetchImpl as never })).toBe(true);

    const [, init] = fetchImpl.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.keepalive).toBe(true);
    expect(init.headers['Content-Type']).toBe('text/plain;charset=utf-8');
  });

  it('brez obeh poti vrne false; napaka nikoli ne vrže', () => {
    expect(sendBeaconOrFetch('https://x', '{}', {})).toBe(false);

    const throwing = vi.fn().mockImplementation(() => {
      throw new Error('beacon');
    });
    const rejecting = vi.fn().mockRejectedValue(new Error('offline'));
    expect(() =>
      sendBeaconOrFetch('https://x', '{}', { sendBeacon: throwing, fetch: rejecting as never }),
    ).not.toThrow();
  });
});
