import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFlk } from '../mod/flk/store';
import { useTra } from '../mod/tra/store';
import { useEgg } from '../mod/egg/store';
import { useDlg } from '../mod/dlg/store';
import { useWhs } from '../mod/whs/store';
import { useGroupKpi } from '../mod/flk/hooks/useGroupKpi';

const makeFlock = (o: any = {}) => ({
  id: 'f-' + Math.random().toString(36).slice(2, 9),
  name: 'گله', type: 'layer', status: 'active',
  birdId: 'b1', breedId: '', hallId: '', zoneId: '',
  initialCount: 1000, currentCount: 1000,
  maleCount: null, femaleCount: null,
  layingStartDay: 140, vaccineScheduleId: '',
  hatchDate: '', purchaseDate: '', startDate: '1405/01/01', endDate: '',
  source: '', purchasePrice: 0, deliveryCost: 0, otherCosts: 0,
  notes: '',
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  events: [],
  ...o,
});

const makeItem = (o: any = {}) => ({
  id: 'it-' + Math.random().toString(36).slice(2, 9),
  name: 'دان', category: 'feed', unit: 'kg',
  minStock: 0, currentStock: 0, lastPrice: 10000, avgPrice: 10000,
  supplierId: '', expireDate: '', withdrawalDays: null, storage: 'room', notes: '',
  createdAt: '2026-01-01', updatedAt: '2026-01-01',
  ...o,
});

beforeEach(() => {
  useFlk.setState({ flocks: [], groups: [], groupMembers: [] } as any);
  useTra.setState({ invoices: [], deals: [] } as any);
  useEgg.setState({ productions: [], sales: [] } as any);
  useDlg.setState({ logs: [] } as any);
  useWhs.setState({ items: [], movements: [] } as any);
});

describe('useGroupKpi — تلفات از events', () => {
  it('فقط events نوع death و cull حساب می‌شن', () => {
    const f = makeFlock({ initialCount: 1000, currentCount: 900 });
    useFlk.setState({ flocks: [f] } as any);
    useFlk.getState().addGroup({ name: 'G', type: 'custom' } as any);
    const gid = useFlk.getState().groups[0].id;
    useFlk.getState().addToGroup(gid, f.id);

    // ۲۰ death + ۳۰ sell + ۵۰ cull → باید ۷۰ تلفات باشه
    useFlk.getState().addEvent(f.id, { date: '1405/07/01', type: 'death', count: 20, sex: 'mixed', reason: '' } as any);
    useFlk.getState().addEvent(f.id, { date: '1405/07/02', type: 'sell', count: 30, sex: 'mixed', reason: '' } as any);
    useFlk.getState().addEvent(f.id, { date: '1405/07/03', type: 'cull', count: 50, sex: 'mixed', reason: '' } as any);

    const { result } = renderHook(() => useGroupKpi(gid));
    expect(result.current.totalDeaths).toBe(70);
  });

  it('بدون events → تلفات صفر (نه از initial-current)', () => {
    const f = makeFlock({ initialCount: 1000, currentCount: 900 });
    useFlk.setState({ flocks: [f] } as any);
    useFlk.getState().addGroup({ name: 'G', type: 'custom' } as any);
    const gid = useFlk.getState().groups[0].id;
    useFlk.getState().addToGroup(gid, f.id);

    const { result } = renderHook(() => useGroupKpi(gid));
    expect(result.current.totalDeaths).toBe(0);
  });

  it('نرخ تلفات = totalDeaths / totalInitial × ۱۰۰', () => {
    const f = makeFlock({ initialCount: 1000, currentCount: 950 });
    useFlk.setState({ flocks: [f] } as any);
    useFlk.getState().addGroup({ name: 'G', type: 'custom' } as any);
    const gid = useFlk.getState().groups[0].id;
    useFlk.getState().addToGroup(gid, f.id);

    useFlk.getState().addEvent(f.id, { date: '1405/07/01', type: 'death', count: 50, sex: 'mixed', reason: '' } as any);

    const { result } = renderHook(() => useGroupKpi(gid));
    expect(result.current.mortalityRate).toBeCloseTo(5, 1);
  });
});

describe('useGroupKpi — هزینه جاری از whs', () => {
  it('خوراک (reason=consumption) در هزینه گله حساب می‌شه', () => {
    const f = makeFlock({ initialCount: 100, purchasePrice: 1000 });
    const item = makeItem({ avgPrice: 5000 });
    useWhs.setState({
      items: [item],
      movements: [{
        id: 'm1', itemId: item.id, type: 'out', quantity: 10, unitPrice: 0,
        reason: 'consumption', date: '1405/07/01', partyId: '',
        notes: '', createdAt: '2026-01-01', flockId: f.id,
      }] as any,
    } as any);
    useFlk.setState({ flocks: [f] } as any);
    useFlk.getState().addGroup({ name: 'G', type: 'custom' } as any);
    const gid = useFlk.getState().groups[0].id;
    useFlk.getState().addToGroup(gid, f.id);

    const { result } = renderHook(() => useGroupKpi(gid));
    // cost پایه = 100 × 1000 = 100_000
    // operational = 10 × 5000 = 50_000
    // total = 150_000
    expect(result.current.byFlock[0].cost).toBe(150000);
  });

  it('movement با reason غیر consumption حساب نمی‌شه', () => {
    const f = makeFlock({ initialCount: 100, purchasePrice: 1000 });
    const item = makeItem({ avgPrice: 5000 });
    useWhs.setState({
      items: [item],
      movements: [{
        id: 'm1', itemId: item.id, type: 'out', quantity: 10, unitPrice: 0,
        reason: 'sale', date: '1405/07/01', partyId: '',
        notes: '', createdAt: '2026-01-01', flockId: f.id,
      }] as any,
    } as any);
    useFlk.setState({ flocks: [f] } as any);
    useFlk.getState().addGroup({ name: 'G', type: 'custom' } as any);
    const gid = useFlk.getState().groups[0].id;
    useFlk.getState().addToGroup(gid, f.id);

    const { result } = renderHook(() => useGroupKpi(gid));
    // فقط cost پایه
    expect(result.current.byFlock[0].cost).toBe(100000);
  });

  it('بدون flockId → حرکات به گله نسبت داده نمی‌شن', () => {
    const f = makeFlock({ initialCount: 100, purchasePrice: 1000 });
    const item = makeItem({ avgPrice: 5000 });
    useWhs.setState({
      items: [item],
      movements: [{
        id: 'm1', itemId: item.id, type: 'out', quantity: 10, unitPrice: 0,
        reason: 'consumption', date: '1405/07/01', partyId: '',
        notes: '', createdAt: '2026-01-01',
        // flockId نیست
      }] as any,
    } as any);
    useFlk.setState({ flocks: [f] } as any);
    useFlk.getState().addGroup({ name: 'G', type: 'custom' } as any);
    const gid = useFlk.getState().groups[0].id;
    useFlk.getState().addToGroup(gid, f.id);

    const { result } = renderHook(() => useGroupKpi(gid));
    expect(result.current.byFlock[0].cost).toBe(100000);
  });
});
