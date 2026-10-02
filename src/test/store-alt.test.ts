import { describe, it, expect, beforeEach } from 'vitest';
import {
  useAlt, activeAlerts, countByLevel, LEVEL_LABEL, LEVEL_ICON, LEVEL_COLOR, CATEGORY_LABEL,
} from '../mod/alt/store';

const makeAlert = () => ({
  level: 'important' as const,
  category: 'stock' as const,
  title: 'کمبود دان',
  message: 'دان رو به اتمام است',
  source: 'whs',
  sourceId: 'item-1',
  date: '1405/07/09',
  notes: '',
});

beforeEach(() => {
  useAlt.setState({ alerts: [] });
});

describe('useAlt — store', () => {
  it('add → رکورد با status=active', () => {
    useAlt.getState().add(makeAlert());
    const alerts = useAlt.getState().alerts;
    expect(alerts).toHaveLength(1);
    expect(alerts[0].status).toBe('active');
    expect(alerts[0].id).toBeTruthy();
    expect(alerts[0].createdAt).toBeTruthy();
  });

  it('findOrCreate → اگه نبود، اضافه میکنه', () => {
    useAlt.getState().findOrCreate(makeAlert());
    expect(useAlt.getState().alerts).toHaveLength(1);
  });

  it('findOrCreate → اگه بود (active)، دوباره اضافه نمیکنه', () => {
    const s = useAlt.getState();
    s.findOrCreate(makeAlert());
    s.findOrCreate(makeAlert());
    expect(useAlt.getState().alerts).toHaveLength(1);
  });

  it('findOrCreate → اگه dismissed بود، دوباره فعال میکنه', () => {
    const s = useAlt.getState();
    s.findOrCreate(makeAlert());
    const id = useAlt.getState().alerts[0].id;
    s.dismiss(id);

    s.findOrCreate(makeAlert());
    expect(useAlt.getState().alerts[0].status).toBe('active');
    expect(useAlt.getState().alerts).toHaveLength(1);
  });

  it('dismiss → status=dismissed', () => {
    const s = useAlt.getState();
    s.add(makeAlert());
    const id = useAlt.getState().alerts[0].id;
    s.dismiss(id);
    expect(useAlt.getState().alerts[0].status).toBe('dismissed');
  });

  it('snooze → status=snoozed + snoozeUntil', () => {
    const s = useAlt.getState();
    s.add(makeAlert());
    const id = useAlt.getState().alerts[0].id;
    s.snooze(id, '1405/10/01');
    expect(useAlt.getState().alerts[0].status).toBe('snoozed');
    expect(useAlt.getState().alerts[0].snoozeUntil).toBe('1405/10/01');
  });

  it('restore → status=active + snoozeUntil پاک', () => {
    const s = useAlt.getState();
    s.add(makeAlert());
    const id = useAlt.getState().alerts[0].id;
    s.snooze(id, '1405/10/01');
    s.restore(id);
    expect(useAlt.getState().alerts[0].status).toBe('active');
    expect(useAlt.getState().alerts[0].snoozeUntil).toBe('');
  });

  it('remove → فقط هدف', () => {
    const s = useAlt.getState();
    s.add({ ...makeAlert(), title: 'A' });
    s.add({ ...makeAlert(), title: 'B' });
    const id1 = useAlt.getState().alerts[0].id;
    s.remove(id1);
    expect(useAlt.getState().alerts).toHaveLength(1);
    expect(useAlt.getState().alerts[0].title).toBe('B');
  });

  it('clearAll → همه پاک میشن', () => {
    const s = useAlt.getState();
    s.add(makeAlert());
    s.add(makeAlert());
    s.clearAll();
    expect(useAlt.getState().alerts).toEqual([]);
  });
});

describe('activeAlerts', () => {
  it('فقط active رو برمیگردونه', () => {
    const alerts = [
      { id: '1', status: 'active', snoozeUntil: '', level: 'info' },
      { id: '2', status: 'dismissed', snoozeUntil: '', level: 'info' },
    ] as any;
    expect(activeAlerts(alerts)).toHaveLength(1);
    expect(activeAlerts(alerts)[0].id).toBe('1');
  });

  it('snoozed با تاریخ گذشته → فعال', () => {
    const past = '1400/01/01';
    const alerts = [
      { id: '1', status: 'snoozed', snoozeUntil: past, level: 'info' },
    ] as any;
    expect(activeAlerts(alerts)).toHaveLength(1);
  });

  it('snoozed با تاریخ آینده → فعال نیست', () => {
    const future = '1500/01/01';
    const alerts = [
      { id: '1', status: 'snoozed', snoozeUntil: future, level: 'info' },
    ] as any;
    expect(activeAlerts(alerts)).toHaveLength(0);
  });
});

describe('countByLevel', () => {
  it('شمارش درست', () => {
    const alerts = [
      { id: '1', status: 'active', snoozeUntil: '', level: 'critical' },
      { id: '2', status: 'active', snoozeUntil: '', level: 'critical' },
      { id: '3', status: 'active', snoozeUntil: '', level: 'important' },
      { id: '4', status: 'active', snoozeUntil: '', level: 'info' },
      { id: '5', status: 'dismissed', snoozeUntil: '', level: 'critical' },
    ] as any;
    const c = countByLevel(alerts);
    expect(c.critical).toBe(2);
    expect(c.important).toBe(1);
    expect(c.info).toBe(1);
    expect(c.total).toBe(4);
  });
});

describe('constants', () => {
  it('LEVEL_LABEL درست', () => {
    expect(LEVEL_LABEL.critical).toBe('بحرانی');
  });
  it('LEVEL_ICON درست', () => {
    expect(LEVEL_ICON.critical).toBe('🔴');
  });
  it('LEVEL_COLOR درست', () => {
    expect(LEVEL_COLOR.critical).toBe('danger');
  });
  it('CATEGORY_LABEL درست', () => {
    expect(CATEGORY_LABEL.stock).toBe('انبار');
  });
});
