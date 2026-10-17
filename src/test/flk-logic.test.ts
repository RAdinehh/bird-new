/**
 * flk-logic.test.ts — تست جامع منطق flk
 * هدف: به چالش کشیدن edge cases و یافتن باگ‌های پنهان
 */
import { describe, it, expect } from 'vitest';
import { checkHallCapacity } from '../mod/flk/api/hallCapacity';
import { getLifecycle, TYPE_LABEL, STATUS_LABEL, getAgeDays, getEffectiveStartDate } from '../mod/flk/store';
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
    id: 'z1', hallId: 'h1', name: 'شمالی', capacity: 100, notes: '',
    createdAt: '', updatedAt: '',
    ...over,
  } as Zone;
}
function mockFlock(over: Partial<Flock> = {}): Flock {
  return {
    id: 'f1', name: 'گله', type: 'layer', birdId: 'b1', breedId: 'br1',
    hallId: 'h1', zoneId: '', initialCount: 100, currentCount: 100,
    maleCount: null, femaleCount: null, layingStartDay: 140, endOfCycleDay: null,
    hatchDate: '', purchaseDate: '', startDate: '',
    source: 'purchase', purchasePrice: null, deliveryCost: null, otherCosts: null,
    status: 'active', notes: '', createdAt: '', updatedAt: '',
    ...over,
  } as Flock;
}
const mockBreedStd = {
  byBreedId: () => ({ space: { densityMax: 9 } }),
} as any;

// ═══════════════════════════════════════════
// ۱. checkHallCapacity — Edge Cases
// ═══════════════════════════════════════════
describe('checkHallCapacity — edge cases', () => {
  it('hallId خالی → null', () => {
    expect(checkHallCapacity('', undefined, 100, [], [mockHall()], [], mockBreedStd)).toBeNull();
  });

  it('newCount = 0 → null', () => {
    expect(checkHallCapacity('h1', undefined, 0, [], [mockHall()], [], mockBreedStd)).toBeNull();
  });

  it('hall پیدا نشد → null', () => {
    expect(checkHallCapacity('nonexistent', undefined, 100, [], [mockHall()], [], mockBreedStd)).toBeNull();
  });

  it('negative newCount → null (blocked)', () => {
    const r = checkHallCapacity('h1', undefined, -100, [], [mockHall()], [], mockBreedStd);
    // ✅ بعد از fix: negative count → null
    expect(r).toBeNull();
  });

  it('zone capacity = 0 → fallback به hall', () => {
    const zones = [mockZone({ id: 'z1', capacity: 0 })];
    const r = checkHallCapacity('h1', 'z1', 100, [], [mockHall()], zones, mockBreedStd);
    // ⚠️ zone با capacity 0 → چه رفتاری؟
    expect(r!.scope).toBe('hall');
    expect(r!.capacity).toBe(500);
  });

  it('همه بخش‌ها archived → نادیده گرفته', () => {
    const zones = [
      mockZone({ id: 'z1', capacity: 100, archived: true } as any),
      mockZone({ id: 'z2', capacity: 200, archived: true } as any),
    ];
    const r = checkHallCapacity('h1', undefined, 100, [], [mockHall()], zones, mockBreedStd);
    // ⚠️ archived zoneها نباید رزرو کنن
    expect(r!.capacity).toBe(500);
  });

  it('سالن area=0 و capacity=0 → null', () => {
    const hall = mockHall({ capacity: 0, length: 0, width: 0 });
    const r = checkHallCapacity('h1', undefined, 100, [], [hall], [], mockBreedStd);
    expect(r).toBeNull();
  });

  it('دقت area mode با اعشار', () => {
    const hall = mockHall({ capacity: null, length: 7.5, width: 3.3 });
    const r = checkHallCapacity('h1', undefined, 10, [], [hall], [], mockBreedStd);
    // ⚠️ 7.5*3.3 = 24.75 → Math.round = 25
    expect(r!.mode).toBe('area');
    expect(r!.capacity).toBe(25);
  });

  it('flock با currentCount=0 (همه مردن)', () => {
    const flocks = [mockFlock({ zoneId: '', currentCount: 0, initialCount: 500 })];
    const r = checkHallCapacity('h1', undefined, 400, flocks, [mockHall()], [], mockBreedStd);
    // ⚠️ currentCount=0 باید باعث بشه فضای بیشتری بمونه
    // fallback: currentCount || initialCount → یعنی 500 (باگ؟)
    console.log('currentCount=0 result total:', r!.total);
    // این تست نشان می‌دهد fallback مشکوک است
  });

  it('flock status=sold (نباید حساب شه)', () => {
    const flocks = [mockFlock({ status: 'sold', currentCount: 400 })];
    const r = checkHallCapacity('h1', undefined, 200, flocks, [mockHall()], [], mockBreedStd);
    // ⚠️ sold نباید حساب شه
    expect(r!.current).toBe(0);
    expect(r!.ok).toBe(true);
  });

  it('flock status=merged (نباید حساب شه)', () => {
    const flocks = [mockFlock({ status: 'merged', currentCount: 300 })];
    const r = checkHallCapacity('h1', undefined, 200, flocks, [mockHall()], [], mockBreedStd);
    expect(r!.current).toBe(0);
  });

  it('breeding: male + female total از hall cap بیشتر', () => {
    const flocks = [mockFlock({
      type: 'breeder',
      zoneId: 'z1',
      currentCount: 50,
      maleCount: 10,
      femaleCount: 40,
    })];
    const zones = [mockZone({ id: 'z1', capacity: 100 })];
    const r = checkHallCapacity('h1', 'z1', 60, flocks, [mockHall()], zones, mockBreedStd);
    // zone cap = 100، used = 50، new = 60 → total 110 > 100 → overflow 10
    expect(r!.ok).toBe(false);
    expect(r!.over).toBe(10);
  });

  it('دقت over در حالت area (با newBreedId)', () => {
    const hall = mockHall({ capacity: null, length: 10, width: 5 }); // area = 50
    const flocks = [mockFlock({ zoneId: '', currentCount: 450 })]; // 450/9 = 50
    // ✅ newBreedId پاس شد تا area محاسبه شه
    const r = checkHallCapacity('h1', undefined, 90, flocks, [hall], [], mockBreedStd, undefined, 'br1');
    // total: 50 + 10 = 60 > 50 → over = 10
    expect(r!.over).toBeGreaterThan(0);
    expect(r!.ok).toBe(false);
  });

  it('باگ قبلی: currentCount=0 → نباید initialCount استفاده شه', () => {
    const flocks = [mockFlock({ zoneId: '', currentCount: 0, initialCount: 500 })];
    const r = checkHallCapacity('h1', undefined, 400, flocks, [mockHall()], [], mockBreedStd);
    // ✅ بعد از fix: currentCount=0 → count=0، پس total=400 (نه 900)
    expect(r!.current).toBe(0);
    expect(r!.total).toBe(400);
  });

  it('negative newCount → null (باگ قبلی)', () => {
    const r = checkHallCapacity('h1', undefined, -100, [], [mockHall()], [], mockBreedStd);
    expect(r).toBeNull();
  });

  it('breakdown با zoneهای خالی + اشغال‌شده', () => {
    const zones = [
      mockZone({ id: 'z1', capacity: 100 }), // خالی
      mockZone({ id: 'z2', capacity: 150 }), // اشغال
      mockZone({ id: 'z3', capacity: 50 }),  // خالی
    ];
    const flocks = [mockFlock({ zoneId: 'z2', currentCount: 100 })];
    const r = checkHallCapacity('h1', undefined, 200, flocks, [mockHall()], zones, mockBreedStd);
    // noZone capacity = 500 - 150 (فقط z2) = 350
    expect(r!.breakdown!.noZone.capacity).toBe(350);
  });
});

// ═══════════════════════════════════════════
// ۲. getLifecycle — همه انواع × همه سنین
// ═══════════════════════════════════════════
describe('getLifecycle — edge cases', () => {
  it('broiler age 0 → brooding', () => {
    const lc = getLifecycle('broiler', 0, null, null);
    expect(lc).toBeDefined();
    expect(lc.color).toBeDefined();
  });

  it('broiler age 42 (پایان چرخه)', () => {
    const lc = getLifecycle('broiler', 42, null, null);
    expect(lc).toBeDefined();
  });

  it('broiler age 100 (بعد از چرخه)', () => {
    const lc = getLifecycle('broiler', 100, null, null);
    // ⚠️ بعد از پایان چرخه چه اتفاقی می‌افته؟
    console.log('broiler age 100:', lc.label);
    expect(lc).toBeDefined();
  });

  it('layer age 0', () => {
    const lc = getLifecycle('layer', 0, null, null);
    expect(lc).toBeDefined();
  });

  it('layer age 140 (شروع تخم‌گذاری)', () => {
    const lc = getLifecycle('layer', 140, null, null);
    expect(lc).toBeDefined();
  });

  it('layer age 700 (پایان)', () => {
    const lc = getLifecycle('layer', 700, null, null);
    expect(lc).toBeDefined();
  });

  it('layer age 1000 (خیلی زیاد)', () => {
    const lc = getLifecycle('layer', 1000, null, null);
    // ⚠️ این نباید crash کنه
    expect(lc).toBeDefined();
  });

  it('invalid type → fallback', () => {
    const lc = getLifecycle('invalid' as any, 50, null, null);
    // ⚠️ type نامعتبر نباید crash کنه
    expect(lc).toBeDefined();
  });

  it('negative age', () => {
    const lc = getLifecycle('layer', -10, null, null);
    // ⚠️ age منفی چه رفتاری داره؟
    expect(lc).toBeDefined();
  });

  it('endOfCycleDay override', () => {
    const lc1 = getLifecycle('layer', 300, null, null);
    const lc2 = getLifecycle('layer', 300, 200, null);
    // ⚠️ endOfCycleDay=200 → الان past cycle?
    console.log('with cycle=200:', lc2.label);
    console.log('without:', lc1.label);
    expect(lc1).toBeDefined();
    expect(lc2).toBeDefined();
  });

  it('birdCycleDays override', () => {
    const lc = getLifecycle('layer', 300, null, 500);
    expect(lc).toBeDefined();
  });
});

// ═══════════════════════════════════════════
// ۳. Labels consistency
// ═══════════════════════════════════════════
describe('Labels consistency', () => {
  it('TYPE_LABEL همه انواع رو داره', () => {
    expect(TYPE_LABEL.layer).toBeDefined();
    expect(TYPE_LABEL.broiler).toBeDefined();
    expect(TYPE_LABEL.breeder).toBeDefined();
  });

  it('STATUS_LABEL همه وضعیت‌ها رو داره', () => {
    expect(STATUS_LABEL.active).toBeDefined();
    expect(STATUS_LABEL.archived).toBeDefined();
    expect(STATUS_LABEL.sold).toBeDefined();
    expect(STATUS_LABEL.merged).toBeDefined();
  });
});

// ═══════════════════════════════════════════
// ۴. getAgeDays / getEffectiveStartDate
// ═══════════════════════════════════════════
describe('getAgeDays + getEffectiveStartDate', () => {
  it('effective = hatchDate اولویت', () => {
    const f = mockFlock({ hatchDate: '1405/07/01', purchaseDate: '1405/07/10', startDate: '1405/07/15' });
    expect(getEffectiveStartDate(f)).toBe('1405/07/01');
  });

  it('بدون hatchDate → purchaseDate', () => {
    const f = mockFlock({ hatchDate: '', purchaseDate: '1405/07/10', startDate: '1405/07/15' });
    expect(getEffectiveStartDate(f)).toBe('1405/07/10');
  });

  it('فقط startDate', () => {
    const f = mockFlock({ hatchDate: '', purchaseDate: '', startDate: '1405/07/15' });
    expect(getEffectiveStartDate(f)).toBe('1405/07/15');
  });

  it('بدون تاریخ → age 0', () => {
    const f = mockFlock({ hatchDate: '', purchaseDate: '', startDate: '' });
    expect(getAgeDays(f)).toBe(0);
  });
});
