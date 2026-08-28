import { describe, it, expect } from 'vitest';
import { MODULE_E_ITEMS } from '../config/modules/moduleE';
import { deadlineChipText, riskDeadline, slovenianDateLabel } from './deadlines';

describe('slovenianDateLabel', () => {
  it('ISO zapis prevede v slovenski datum brez vodilnih ničel', () => {
    expect(slovenianDateLabel('2026-07-14')).toBe('14. 7. 2026');
    expect(slovenianDateLabel('2028-01-01')).toBe('1. 1. 2028');
  });
});

describe('riskDeadline', () => {
  const sqlServer = MODULE_E_ITEMS[0];

  it('na dan roka še ni poteklo, naslednji dan pa', () => {
    const label = sqlServer.label;

    expect(riskDeadline({ moduleId: 'E', label }, new Date(2026, 6, 13))?.expired).toBe(false);
    expect(riskDeadline({ moduleId: 'E', label }, new Date(2026, 6, 14))?.expired).toBe(false);
    expect(riskDeadline({ moduleId: 'E', label }, new Date(2026, 6, 15))?.expired).toBe(true);
  });

  it('vrne datum roka v obeh oblikah', () => {
    const deadline = riskDeadline({ moduleId: 'E', label: sqlServer.label }, new Date(2026, 0, 1));

    expect(deadline?.dateISO).toBe(sqlServer.warningDate);
    expect(deadline?.dateLabel).toBe('14. 7. 2026');
  });

  /**
   * Ujemanje teče po oznaki, ker izhod modula ključa ne nosi (moduleE.compute).
   * Preimenovanje polja bi žeton tiho izklopilo — ta test to ujame.
   */
  it('vsako tveganje modula E se razreši prek svoje oznake', () => {
    for (const item of MODULE_E_ITEMS) {
      const deadline = riskDeadline({ moduleId: 'E', label: item.label }, new Date(2026, 0, 1));

      expect(deadline, item.key).not.toBeNull();
      expect(deadline?.dateISO).toBe(item.warningDate);
    }
  });

  it('tveganja drugih modulov in neznane oznake roka nimajo', () => {
    expect(riskDeadline({ moduleId: 'planiranje', label: sqlServer.label }, new Date())).toBeNull();
    expect(riskDeadline({ moduleId: 'E', label: 'Neznano tveganje' }, new Date())).toBeNull();
    expect(riskDeadline({ label: sqlServer.label }, new Date())).toBeNull();
  });
});

describe('deadlineChipText', () => {
  it('pretekli rok dobi svojo besedo', () => {
    expect(deadlineChipText({ dateISO: '2026-07-14', dateLabel: '14. 7. 2026', expired: true })).toBe(
      'poteklo 14. 7. 2026',
    );
    expect(deadlineChipText({ dateISO: '2028-01-01', dateLabel: '1. 1. 2028', expired: false })).toBe(
      'rok 1. 1. 2028',
    );
  });
});
