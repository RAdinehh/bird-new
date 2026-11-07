import { describe, it, expect, beforeEach } from 'vitest';
import { useFlk } from '../mod/flk/store';
import { aggregateConsumptionEvents } from '../mod/flk/consumptionEventsCalc';
import type { ConsumptionEvent } from '../mod/flk/types-store';

const mkFeed = (o: Partial<Omit<ConsumptionEvent, 'id' | 'createdAt' | 'updatedAt'>> = {}): Omit<ConsumptionEvent, 'id' | 'createdAt' | 'updatedAt'> => ({
  flockId: 'f1',
  type: 'feed',
  date: '1405/08/01',
  amount: 25,
  unit: 'kg',
  sex: '',
  source: 'bulk_manual',
  confidence: 'exact',
  ...o,
});

const mkWater = (o: Partial<Omit<ConsumptionEvent, 'id' | 'createdAt' | 'updatedAt'>> = {}): Omit<ConsumptionEvent, 'id' | 'createdAt' | 'updatedAt'> => ({
  flockId: 'f1',
  type: 'water',
  date: '1405/08/01',
  amount: 50,
  unit: 'L',
  sex: '',
  source: 'daily_manual',
  confidence: 'exact',
  ...o,
});

const stub = (ev: any, id: string): ConsumptionEvent => ({ ...ev, id, createdAt: '', updatedAt: '' });

beforeEach(() => {
  useFlk.setState({ flocks: [], groups: [], groupMembers: [], consumptionEvents: [] } as any);
});

describe('addConsumptionEvent / list / remove / update', () => {
  it('add feed → event اضافه می‌شود', () => {
    const id = useFlk.getState().addConsumptionEvent(mkFeed());
    expect(id).toBeTruthy();
    expect(useFlk.getState().consumptionEvents).toHaveLength(1);
  });

  it('add water → event اضافه می‌شود', () => {
    useFlk.getState().addConsumptionEvent(mkWater());
    expect(useFlk.getState().consumptionEvents[0].type).toBe('water');
  });

  it('list → فقط flock + sort desc', () => {
    useFlk.getState().addConsumptionEvent(mkFeed({ date: '1405/08/01' }));
    useFlk.getState().addConsumptionEvent(mkFeed({ date: '1405/08/05' }));
    useFlk.getState().addConsumptionEvent(mkFeed({ flockId: 'f2', date: '1405/08/03' }));
    const list = useFlk.getState().listConsumptionEvents('f1');
    expect(list).toHaveLength(2);
    expect(list[0].date).toBe('1405/08/05');
  });

  it('remove → حذف', () => {
    const id = useFlk.getState().addConsumptionEvent(mkFeed());
    useFlk.getState().removeConsumptionEvent(id);
    expect(useFlk.getState().consumptionEvents).toHaveLength(0);
  });

  it('update → patch اعمال می‌شود', () => {
    const id = useFlk.getState().addConsumptionEvent(mkFeed({ amount: 20 }));
    useFlk.getState().updateConsumptionEvent(id, { amount: 30 });
    expect(useFlk.getState().consumptionEvents.find(e => e.id === id)!.amount).toBe(30);
  });
});

describe('aggregateConsumptionEvents', () => {
  it('خالی → hasData=false', () => {
    expect(aggregateConsumptionEvents([], '1405/08/01', '1405/08/31').hasData).toBe(false);
  });

  it('feed + water → totalFeedKg + totalWaterL جدا', () => {
    const events = [
      stub(mkFeed({ amount: 25 }), 'e1'),
      stub(mkFeed({ amount: 10 }), 'e2'),
      stub(mkWater({ amount: 80 }), 'e3'),
    ];
    const r = aggregateConsumptionEvents(events, '1405/08/01', '1405/08/31');
    expect(r.totalFeedKg).toBe(35);
    expect(r.totalWaterL).toBe(80);
    expect(r.byType.feed).toBe(35);
    expect(r.byType.water).toBe(80);
  });

  it('typeFilter=feed → فقط دان', () => {
    const events = [stub(mkFeed({ amount: 30 }), 'e1'), stub(mkWater({ amount: 100 }), 'e2')];
    const r = aggregateConsumptionEvents(events, '1405/08/01', '1405/08/31', 'feed');
    expect(r.totalFeedKg).toBe(30);
    expect(r.totalWaterL).toBe(0);
    expect(r.eventCount).toBe(1);
  });

  it('typeFilter=water → فقط آب', () => {
    const events = [stub(mkFeed({ amount: 30 }), 'e1'), stub(mkWater({ amount: 100 }), 'e2')];
    const r = aggregateConsumptionEvents(events, '1405/08/01', '1405/08/31', 'water');
    expect(r.totalFeedKg).toBe(0);
    expect(r.totalWaterL).toBe(100);
  });

  it('بازه — خارج از window → ignore', () => {
    const events = [stub(mkFeed({ date: '1405/07/15', amount: 30 }), 'e1'), stub(mkFeed({ date: '1405/08/10', amount: 20 }), 'e2')];
    const r = aggregateConsumptionEvents(events, '1405/08/01', '1405/08/31');
    expect(r.totalFeedKg).toBe(20);
    expect(r.eventCount).toBe(1);
  });

  it('sex تفکیک — male + female جدا (فقط feed)', () => {
    const events = [
      stub(mkFeed({ amount: 30, sex: 'male' }), 'e1'),
      stub(mkFeed({ amount: 40, sex: 'female' }), 'e2'),
      stub(mkFeed({ amount: 10, sex: '' }), 'e3'),
      stub(mkWater({ amount: 200 }), 'e4'),
    ];
    const r = aggregateConsumptionEvents(events, '1405/08/01', '1405/08/31', 'feed');
    expect(r.bySex.male).toBe(30);
    expect(r.bySex.female).toBe(40);
    expect(r.bySex.unknown).toBe(10);
  });

  it('confidence متنوع → mixed', () => {
    const events = [
      stub(mkFeed({ amount: 20, source: 'bulk_manual', confidence: 'exact' }), 'e1'),
      stub(mkFeed({ amount: 5, source: 'sensor_level', confidence: 'estimated' }), 'e2'),
    ];
    const r = aggregateConsumptionEvents(events, '1405/08/01', '1405/08/31');
    expect(r.confidence).toBe('mixed');
    expect(r.bySource.bulk_manual).toBe(20);
    expect(r.bySource.sensor_level).toBe(5);
  });
});
