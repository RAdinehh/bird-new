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
  it('سالن ۵۰۰، بخش‌ها ۵۰+۱۰۰ → بدون بخش ۳۵۰', () => {
    const zones = [
      mockZone({ id: 'z1', name: 'شمالی', capacity: 50 }),
      mockZone({ id: 'z2', name: 'جنوبی', capacity: 100 }),
    ];
    const r = checkHallCapacity('h1', undefined, 200, [], [mockHall()], zones, mockBreedStd);
    expect(r!.ok).toBe(true);
    expect(r!.capacity).toBe(350); // 500 - 150 (بخش‌ها)
    expect(r!.scope).toBe('hall');
  });

  it('سالن ۵۰۰، بخش‌ها ۱۵۰، بدون بخش ۴۰۰ → overflow ۵۰', () => {
    const zones = [
      mockZone({ id: 'z1', name: 'شمالی', capacity: 50 }),
      mockZone({ id: 'z2', name: 'جنوبی', capacity: 100 }),
    ];
    const r = checkHallCapacity('h1', undefined, 400, [], [mockHall()], zones, mockBreedStd);
    expect(r!.ok).toBe(false);
    expect(r!.over).toBe(50); // 400 - 350
  });

  // ═══ ۴. سالن بدون ظرفیت ولی بخش‌ها دارن ═══
  it('سالن بدون capacity، بخش ۵۰+۱۰۰ → noZoneCap = 0', () => {
    const hall = mockHall({ capacity: null });
    const zones = [
      mockZone({ id: 'z1', capacity: 50 }),
      mockZone({ id: 'z2', capacity: 100 }),
    ];
    const r = checkHallCapacity('h1', undefined, 100, [], [hall], zones, mockBreedStd);
    // 🆕 بخش‌ها ظرفیت سالن رو پر کردن → بدون بخش صفر
    expect(r!.capacity).toBe(0);
    expect(r!.ok).toBe(false); // 100 > 0
    expect(r!.over).toBe(100);
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

  // ═══ ۷. breakdown ═══
  it('breakdown: سالن ۵۰۰، بخش ۵۰+۱۰۰', () => {
    const zones = [
      mockZone({ id: 'z1', name: 'شمالی', capacity: 50 }),
      mockZone({ id: 'z2', name: 'جنوبی', capacity: 100 }),
    ];
    const r = checkHallCapacity('h1', undefined, 100, [], [mockHall()], zones, mockBreedStd);
    expect(r!.breakdown).toBeDefined();
    expect(r!.breakdown!.zones).toHaveLength(2);
    expect(r!.breakdown!.noZone.capacity).toBe(350);
  });
});
