/**
 * store-hal.test.ts — تست‌های L11 برای hal store
 * پوشش: addHall/updateHall/deleteHall (cascade) + addZone/updateZone/deleteZone (cascade) + addEquip/updateEquip/deleteEquip
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useHal } from '../mod/hal/store';
import type { Hall, Zone, Equipment } from '../mod/hal/store';

const mkHall = (o: Partial<Hall> = {}): Omit<Hall, 'id' | 'createdAt' | 'updatedAt'> => ({
  name: 'سالن ۱', code: '', length: 10, width: 5, height: 3, capacity: 500,
  targetTemp: null, targetHumidity: null, ventilation: null, light: null,
  ventilationSystem: '', feederType: '', drinkerType: '', litterType: '',
  address: '', builtAt: '', lastSanitizedAt: '', notes: '',
  ...o,
});

const mkZone = (o: Partial<Zone> = {}): Omit<Zone, 'id' | 'createdAt' | 'updatedAt'> => ({
  hallId: 'h1', name: 'شمالی', capacity: 50, notes: '',
  ...o,
});

const mkEquip = (o: Partial<Equipment> = {}): Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'> => ({
  hallId: 'h1', category: 'ventilation', type: 'fan', name: 'فن', count: 2,
  unit: 'pcs', unitPrice: 1000, purchasedAt: '1405/08/01', warranty: 12, notes: '',
  ...o,
});

/** برای اطمینان از تغییر updatedAt (حتی در همان میلی‌ثانیه) */
const OLD_TS = '2020-01-01T00:00:00.000Z';

beforeEach(() => {
  useHal.setState({ halls: [], zones: [], equipment: [] });
});

// ══════════════════════════════════════════════════════════
// Hall CRUD
// ══════════════════════════════════════════════════════════
describe('addHall', () => {
  it('id و createdAt خودکار تولید می‌شود', () => {
    useHal.getState().addHall(mkHall());
    const halls = useHal.getState().halls;
    expect(halls).toHaveLength(1);
    expect(halls[0].id).toBeTruthy();
    expect(halls[0].createdAt).toBeTruthy();
    expect(halls[0].updatedAt).toBeTruthy();
  });
});

describe('updateHall', () => {
  it('نام تغییر می‌کند و updatedAt عوض می‌شود', () => {
    useHal.getState().addHall(mkHall());
    const id = useHal.getState().halls[0].id;
    useHal.setState(s => ({ halls: s.halls.map(h => ({ ...h, updatedAt: OLD_TS })) }));
    useHal.getState().updateHall(id, { name: 'سالن جدید' });
    const h = useHal.getState().halls[0];
    expect(h.name).toBe('سالن جدید');
    expect(h.updatedAt).not.toBe(OLD_TS);
  });

  it('id ناموجود → state بدون تغییر', () => {
    useHal.getState().addHall(mkHall());
    const before = useHal.getState().halls.length;
    useHal.getState().updateHall('nonexistent', { name: 'x' });
    expect(useHal.getState().halls).toHaveLength(before);
  });
});

describe('deleteHall — cascade', () => {
  it('hall + zoneهای مربوط + equipment مربوط حذف می‌شوند', () => {
    useHal.getState().addHall(mkHall());
    const hallId = useHal.getState().halls[0].id;
    useHal.getState().addZone(mkZone({ hallId }));
    useHal.getState().addEquip(mkEquip({ hallId }));
    expect(useHal.getState().zones).toHaveLength(1);
    expect(useHal.getState().equipment).toHaveLength(1);

    useHal.getState().deleteHall(hallId);

    expect(useHal.getState().halls).toHaveLength(0);
    expect(useHal.getState().zones).toHaveLength(0);
    expect(useHal.getState().equipment).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════
// Zone CRUD
// ══════════════════════════════════════════════════════════
describe('addZone', () => {
  it('id خودکار، hallId ذخیره می‌شود', () => {
    useHal.getState().addZone(mkZone({ hallId: 'h-x', name: 'جنوبی' }));
    const zones = useHal.getState().zones;
    expect(zones).toHaveLength(1);
    expect(zones[0].hallId).toBe('h-x');
    expect(zones[0].name).toBe('جنوبی');
    expect(zones[0].id).toBeTruthy();
  });
});

describe('updateZone', () => {
  it('نام تغییر، updatedAt عوض', () => {
    useHal.getState().addZone(mkZone());
    const id = useHal.getState().zones[0].id;
    useHal.setState(s => ({ zones: s.zones.map(z => ({ ...z, updatedAt: OLD_TS })) }));
    useHal.getState().updateZone(id, { name: 'بخش جدید' });
    const z = useHal.getState().zones[0];
    expect(z.name).toBe('بخش جدید');
    expect(z.updatedAt).not.toBe(OLD_TS);
  });

  it('id ناموجود → no-op', () => {
    useHal.getState().addZone(mkZone());
    useHal.getState().updateZone('nonexistent', { name: 'x' });
    expect(useHal.getState().zones).toHaveLength(1);
  });
});

describe('deleteZone — cascade به equipment', () => {
  it('zone حذف + zoneId تجهیزات مربوط خالی می‌شود', () => {
    useHal.getState().addHall(mkHall());
    const hallId = useHal.getState().halls[0].id;
    useHal.getState().addZone(mkZone({ hallId }));
    const zoneId = useHal.getState().zones[0].id;
    useHal.getState().addEquip(mkEquip({ hallId, zoneId }));
    expect(useHal.getState().equipment[0].zoneId).toBe(zoneId);

    useHal.getState().deleteZone(zoneId);

    expect(useHal.getState().zones).toHaveLength(0);
    expect(useHal.getState().equipment).toHaveLength(1);
    expect(useHal.getState().equipment[0].zoneId).toBe('');
  });
});

// ══════════════════════════════════════════════════════════
// Equipment CRUD
// ══════════════════════════════════════════════════════════
describe('addEquip', () => {
  it('id برمی‌گرداند و equipment اضافه می‌شود', () => {
    useHal.getState().addHall(mkHall());
    const hallId = useHal.getState().halls[0].id;
    const id = useHal.getState().addEquip(mkEquip({ hallId }));
    expect(id).toBeTruthy();
    expect(useHal.getState().equipment).toHaveLength(1);
    expect(useHal.getState().equipment[0].id).toBe(id);
  });
});

describe('updateEquip', () => {
  it('patch اعمال، updatedAt عوض', () => {
    useHal.getState().addHall(mkHall());
    const hallId = useHal.getState().halls[0].id;
    const id = useHal.getState().addEquip(mkEquip({ hallId }));
    useHal.setState(s => ({ equipment: s.equipment.map(e => ({ ...e, updatedAt: OLD_TS })) }));
    useHal.getState().updateEquip(id, { name: 'فن جدید' });
    const e = useHal.getState().equipment[0];
    expect(e.name).toBe('فن جدید');
    expect(e.updatedAt).not.toBe(OLD_TS);
  });
});

describe('deleteEquip', () => {
  it('equipment حذف می‌شود', () => {
    useHal.getState().addHall(mkHall());
    const hallId = useHal.getState().halls[0].id;
    const id = useHal.getState().addEquip(mkEquip({ hallId }));
    expect(useHal.getState().equipment).toHaveLength(1);
    useHal.getState().deleteEquip(id);
    expect(useHal.getState().equipment).toHaveLength(0);
  });
});
