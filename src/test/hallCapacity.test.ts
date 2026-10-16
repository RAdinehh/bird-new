/**
 * hallCapacity.test.ts — تست دقیق محاسبات ظرفیت سالن/بخش
 */
import { describe, it, expect } from 'vitest';
import { checkHallCapacity } from '../mod/flk/api/hallCapacity';
import type { Hall, Zone } from '../mod/hal/store';
import type { Flock } from '../mod/flk/store';

// ═══ Mock helpers ═══
function mockHall(over: Partial<Hall> = {}): Hall {
  return {
    id: 'h1', name: 'بالا', code: '', length: 10, width: 5, height: 3,
    capacity: 500, targetTemp: null, targetHumidity: null,
    ventilation: null, light: null,
    ventilationSystem: '', feederType: '', drinkerType: '', litterType: '',
    address: '', builtAt: '', lastSanitizedAt: '', notes: '',
    createdAt: '', updatedAt: '',
    ...over,
  } as Hall;
}

function mockZone(over: Partial<Zone> = {}): Zone {
  return {
    id: 'z1', hallId: 'h1', name: 'شمالی', capacity: 50, notes: '',
    createdAt: '', updatedAt: '',
    ...over,
  } as Zone;
}

function mockFlock(over: Partial<Flock> = {}): Flock {
  return {
    id: 'f1', name: 'گله', type: 'layer', birdId: 'b1', breedId: 'br1',
    hallId: 'h1', zoneId: '', initialCount: 100, currentCount: 100,
    maleCount: null, femaleCount: null,
    layingStartDay: 140, endOfCycleDay: null,
    hatchDate: '', purchaseDate: '', startDate: '',
    source: 'purchase', purchasePrice: null, deliveryCost: null, otherCosts: null,
    status: 'active', notes: '',
    createdAt: '', updatedAt: '',
    ...over,
  } as Flock;
}

const mockBreedStd = {
  byBreedId: () => ({ space: { densityMax: 9 } }),
} as any;

describe('checkHallCapacity', () => {
  // ═══ ۱. سالن بدون بخش ═══
  it('سالن ۵۰۰، بدون بخش، گله جدید ۲۰۰ → ok', () => {
    const r = checkHallCapacity('h1', undefined, 200, [], [mockHall()], [], mockBreedStd);
    expect(r).not.toBeNull();
    expect(r!.ok).toBe(true);
    expect(r!.capacity).toBe(500);
    expect(r!.total).toBe(200);
    expect(r!.remaining).toBe(300); // 500 - 200 بعد از ذخیره
  });

  it('سالن ۵۰۰، بدون بخش، گله جدید ۶۰۰ → overflow', () => {
    const r = checkHallCapacity('h1', undefined, 600, [], [mockHall()], [], mockBreedStd);
    expect(r!.ok).toBe(false);
    expect(r!.over).toBe(100);
  });

  // ═══ ۲. سالن + بخش با ظرفیت ═══
  it('سالن ۵۰۰، بخش شمالی ۵۰، گله جدید ۳۰ در بخش → ok', () => {
    const zones = [mockZone({ id: 'z1', name: 'شمالی', capacity: 50 })];
    const r = checkHallCapacity('h1', 'z1', 30, [], [mockHall()], zones, mockBreedStd);
    expect(r!.ok).toBe(true);
    expect(r!.scope).toBe('zone');
    expect(r!.capacity).toBe(50);
  });

  it('سالن ۵۰۰، بخش شمالی ۵۰، گله جدید ۸۰ در بخش → overflow', () => {
    const zones = [mockZone({ id: 'z1', name: 'شمالی', capacity: 50 })];
    const r = checkHallCapacity('h1', 'z1', 80, [], [mockHall()], zones, mockBreedStd);
    expect(r!.ok).toBe(false);
    expect(r!.over).toBe(30);
  });

  // ═══ ۳. بدون بخش + بخش‌های رزرو ═══
  it('سالن ۵۰۰، بخش‌ها خالی ۵۰+۱۰۰ → بدون بخش کل ۵۰۰', () => {
    const zones = [
      mockZone({ id: 'z1', name: 'شمالی', capacity: 50 }),
      mockZone({ id: 'z2', name: 'جنوبی', capacity: 100 }),
    ];
    const r = checkHallCapacity('h1', undefined, 200, [], [mockHall()], zones, mockBreedStd);
    expect(r!.ok).toBe(true);
    expect(r!.capacity).toBe(500); // 🆕 بخش‌های خالی رزرو نمی‌شن
    expect(r!.scope).toBe('hall');
  });

  it('سالن ۵۰۰، بخش‌ها خالی، بدون بخش ۶۰۰ → overflow ۱۰۰', () => {
    const zones = [
      mockZone({ id: 'z1', name: 'شمالی', capacity: 50 }),
      mockZone({ id: 'z2', name: 'جنوبی', capacity: 100 }),
    ];
    const r = checkHallCapacity('h1', undefined, 600, [], [mockHall()], zones, mockBreedStd);
    expect(r!.ok).toBe(false);
    expect(r!.over).toBe(100); // 600 - 500 (کل سالن)
  });

  // ═══ ۴. سالن بدون ظرفیت ولی بخش‌ها دارن ═══
  it('سالن بدون capacity → area mode', () => {
    const hall = mockHall({ capacity: null, length: 10, width: 5 });
    const zones = [
      mockZone({ id: 'z1', capacity: 50 }),
      mockZone({ id: 'z2', capacity: 100 }),
    ];
    const r = checkHallCapacity('h1', undefined, 100, [], [hall], zones, mockBreedStd);
    // 🆕 بدون capacity → area mode (10×5=50)
    expect(r!.mode).toBe('area');
    expect(r!.capacity).toBe(50);
  });

  // ═══ ۵. گله‌های موجود ═══
  it('سالن ۵۰۰، گله ۳۵۱ فعلی + گله جدید ۱۲۰ → باقی ۲۹', () => {
    const flocks = [mockFlock({ id: 'f1', zoneId: '', currentCount: 351 })];
    const r = checkHallCapacity('h1', undefined, 120, flocks, [mockHall()], [], mockBreedStd);
    expect(r!.ok).toBe(true);
    expect(r!.current).toBe(351);
    expect(r!.total).toBe(471);
    expect(r!.remaining).toBe(29); // 500 - 471
  });

  it('سالن ۵۰۰، گله ۴۰۰ فعلی + گله جدید ۱۵۰ → overflow ۵۰', () => {
    const flocks = [mockFlock({ id: 'f1', zoneId: '', currentCount: 400 })];
    const r = checkHallCapacity('h1', undefined, 150, flocks, [mockHall()], [], mockBreedStd);
    expect(r!.ok).toBe(false);
    expect(r!.over).toBe(50);
  });

  // ═══ ۶. exclude flock در edit ═══
  it('ویرایش گله: exclude خودش', () => {
    const flocks = [
      mockFlock({ id: 'f1', zoneId: '', currentCount: 400 }),
      mockFlock({ id: 'f2', zoneId: '', currentCount: 50 }),
    ];
    const r = checkHallCapacity('h1', undefined, 200, flocks, [mockHall()], [], mockBreedStd, 'f1');
    expect(r!.current).toBe(50); // فقط f2
    expect(r!.total).toBe(250);
    expect(r!.ok).toBe(true);
  });

  // ═══ ۶.۵ بخش خالی رزرو نمی‌کنه ═══
  it('سالن ۵۰۰، بخش شمالی ۱۰۰ (خالی) → گله بدون بخش کل ۵۰۰ در دسترس', () => {
    const zones = [mockZone({ id: 'z1', name: 'شمالی', capacity: 100 })];
    const r = checkHallCapacity('h1', undefined, 400, [], [mockHall()], zones, mockBreedStd);
    expect(r!.ok).toBe(true);
    expect(r!.capacity).toBe(500); // 🆕 کل سالن (بخش خالی رزرو نمی‌شه)
  });

  it('سالن ۵۰۰، بخش شمالی ۱۰۰ (با گله ۸۰) → گله بدون بخش ۴۰۰', () => {
    const zones = [mockZone({ id: 'z1', name: 'شمالی', capacity: 100 })];
    const flocks = [mockFlock({ id: 'f1', zoneId: 'z1', currentCount: 80 })];
    const r = checkHallCapacity('h1', undefined, 300, flocks, [mockHall()], zones, mockBreedStd);
    expect(r!.ok).toBe(true);
    expect(r!.capacity).toBe(400);
    expect(r!.current).toBe(0);
  });

  it('🆕 سالن ۵۰۰، Z1 اشغال (۱۰۰)، Z2 خالی (۱۵۰) → no-zone ۴۰۰', () => {
    const zones = [
      mockZone({ id: 'z1', name: 'شمالی', capacity: 100 }),
      mockZone({ id: 'z2', name: 'جنوبی', capacity: 150 }),
    ];
    const flocks = [mockFlock({ id: 'f1', zoneId: 'z1', currentCount: 80 })];
    const r = checkHallCapacity('h1', undefined, 400, flocks, [mockHall()], zones, mockBreedStd);
    expect(r!.ok).toBe(true);
    expect(r!.capacity).toBe(400);
  });

  it('🆕 سالن ۵۰۰، Z1 اشغال → no-zone ۴۵۰ → overflow ۵۰', () => {
    const zones = [mockZone({ id: 'z1', name: 'شمالی', capacity: 100 })];
    const flocks = [mockFlock({ id: 'f1', zoneId: 'z1', currentCount: 80 })];
    const r = checkHallCapacity('h1', undefined, 450, flocks, [mockHall()], zones, mockBreedStd);
    expect(r!.ok).toBe(false);
    expect(r!.over).toBe(50);
  });

  // ═══ ۷. breakdown ═══
  it('breakdown: سالن ۵۰۰، بخش ۵۰+۱۰۰', () => {
    const zones = [
      mockZone({ id: 'z1', name: 'شمالی', capacity: 50 }),
      mockZone({ id: 'z2', name: 'جنوبی', capacity: 100 }),
    ];
    const r = checkHallCapacity('h1', undefined, 100, [], [mockHall()], zones, mockBreedStd);
    expect(r!.breakdown).toBeDefined();
    expect(r!.breakdown!.zones).toHaveLength(2);
    expect(r!.breakdown!.noZone.capacity).toBe(500); // 🆕 بخش‌های خالی رزرو نمی‌شن
  });
});
