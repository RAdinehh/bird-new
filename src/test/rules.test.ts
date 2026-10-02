import { describe, it, expect, beforeEach } from 'vitest';
import { format, addDays, startOfDay } from 'date-fns-jalali';
import { detectAllAlerts } from '../mod/alt/rules';
import { useWhs } from '../mod/whs/store';
import { useTra } from '../mod/tra/store';
import { useFlk } from '../mod/flk/store';
import { useDlg } from '../mod/dlg/store';
import { useEgg } from '../mod/egg/store';
import { useInc } from '../mod/inc/store';
import { useAlt } from '../mod/alt/store';
import { useSet } from '../mod/set/store';

const todayJ = () => format(new Date(), 'yyyy/MM/dd');
const daysAgoJ = (n: number) => format(addDays(startOfDay(new Date()), -n), 'yyyy/MM/dd');

// helper: تنظیم همه storeها به حالت خالی
function resetStores() {
  useWhs.setState({ items: [], movements: [] } as any);
  useTra.setState({ invoices: [], deals: [] } as any);
  useFlk.setState({ flocks: [] } as any);
  useDlg.setState({ logs: [] } as any);
  useEgg.setState({ productions: [], stocks: [], sales: [] } as any);
  useInc.setState({ devices: [], eggEntries: [], candlings: [], hatchGroups: [], hatchResults: [] } as any);
  useAlt.setState({ alerts: [] } as any);
  useSet.getState().reset();
}

beforeEach(() => {
  resetStores();
});

// ═══════════════════════════════════════════════
// ۱. انبار — موجودی
// ═══════════════════════════════════════════════
describe('rules — stock warnings', () => {
  it('stock=0 → critical alert', () => {
    useWhs.setState({
      items: [{
        id: 'i1', name: 'دان', category: 'feed', unit: 'kg',
        currentStock: 0, minStock: 20, lastPrice: 1000, expireDate: '',
      }] as any,
    });

    const alerts = detectAllAlerts();
    const stockAlert = alerts.find(a => a.sourceId === 'i1:stock-critical');
    expect(stockAlert).toBeTruthy();
    expect(stockAlert!.level).toBe('critical');
    expect(stockAlert!.category).toBe('stock');
  });

  it('stock < min → low alert', () => {
    useWhs.setState({
      items: [{
        id: 'i1', name: 'دان', category: 'feed', unit: 'kg',
        currentStock: 10, minStock: 20, lastPrice: 1000, expireDate: '',
      }] as any,
    });

    const alerts = detectAllAlerts();
    const low = alerts.find(a => a.sourceId === 'i1:stock-low');
    expect(low).toBeTruthy();
    expect(low!.level).toBe('important');
  });

  it('stock سالم → هیچ alert', () => {
    useWhs.setState({
      items: [{
        id: 'i1', name: 'دان', category: 'feed', unit: 'kg',
        currentStock: 100, minStock: 20, lastPrice: 1000, expireDate: '',
      }] as any,
    });

    const alerts = detectAllAlerts();
    expect(alerts.filter(a => a.category === 'stock')).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════
// ۲. انبار — انقضا
// ═══════════════════════════════════════════════
describe('rules — expiry warnings', () => {
  it('منقضی → critical', () => {
    useWhs.setState({
      items: [{
        id: 'i1', name: 'واکسن', category: 'vaccine', unit: 'vial',
        currentStock: 5, minStock: 1, lastPrice: 1000,
        expireDate: daysAgoJ(5),
      }] as any,
    });

    const alerts = detectAllAlerts();
    const exp = alerts.find(a => a.sourceId === 'i1:expired');
    expect(exp).toBeTruthy();
    expect(exp!.level).toBe('critical');
  });

  it('نزدیک انقضا (10 روز) → important', () => {
    useWhs.setState({
      items: [{
        id: 'i1', name: 'واکسن', category: 'vaccine', unit: 'vial',
        currentStock: 5, minStock: 1, lastPrice: 1000,
        expireDate: format(addDays(startOfDay(new Date()), 10), 'yyyy/MM/dd'),
      }] as any,
    });

    const alerts = detectAllAlerts();
    const soon = alerts.find(a => a.sourceId === 'i1:expiring-soon');
    expect(soon).toBeTruthy();
    expect(soon!.level).toBe('important');
  });

  it('انقضای دور (100 روز) → هیچ alert', () => {
    useWhs.setState({
      items: [{
        id: 'i1', name: 'واکسن', category: 'vaccine', unit: 'vial',
        currentStock: 5, minStock: 1, lastPrice: 1000,
        expireDate: format(addDays(startOfDay(new Date()), 100), 'yyyy/MM/dd'),
      }] as any,
    });

    const alerts = detectAllAlerts();
    expect(alerts.filter(a => a.sourceId?.includes('expire'))).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════
// ۳. فاکتورها — طلب/بدهی
// ═══════════════════════════════════════════════
describe('rules — invoices', () => {
  it('طلب 70 روزه از مشتری → critical', () => {
    useTra.setState({
      invoices: [{
        id: 'inv1', type: 'sale', total: 100000, date: daysAgoJ(70),
        payments: [], number: 'S001',
      }] as any,
    });

    const alerts = detectAllAlerts();
    const a = alerts.find(x => x.sourceId === 'inv1:overdue-receivable');
    expect(a).toBeTruthy();
    expect(a!.level).toBe('critical');
  });

  it('طلب 45 روزه → important', () => {
    useTra.setState({
      invoices: [{
        id: 'inv1', type: 'sale', total: 100000, date: daysAgoJ(45),
        payments: [],
      }] as any,
    });

    const alerts = detectAllAlerts();
    const a = alerts.find(x => x.sourceId === 'inv1:receivable');
    expect(a).toBeTruthy();
    expect(a!.level).toBe('important');
  });

  it('فاکتور تسویه‌شده → هیچ alert', () => {
    useTra.setState({
      invoices: [{
        id: 'inv1', type: 'sale', total: 100000, date: daysAgoJ(100),
        payments: [{ amount: 100000, date: todayJ() }],
      }] as any,
    });

    const alerts = detectAllAlerts();
    expect(alerts.filter(a => a.category === 'payment')).toHaveLength(0);
  });

  it('بدهی 70 روزه به فروشنده → critical', () => {
    useTra.setState({
      invoices: [{
        id: 'inv1', type: 'purchase', total: 100000, date: daysAgoJ(70),
        payments: [],
      }] as any,
    });

    const alerts = detectAllAlerts();
    const a = alerts.find(x => x.sourceId === 'inv1:overdue-payable');
    expect(a).toBeTruthy();
    expect(a!.level).toBe('critical');
  });
});

// ═══════════════════════════════════════════════
// ۴. گله
// ═══════════════════════════════════════════════
describe('rules — flocks', () => {
  it('گله layer سن 470 روز → end-of-cycle alert', () => {
    useFlk.setState({
      flocks: [{
        id: 'f1', name: 'گله ۱', type: 'layer', status: 'active',
        startDate: daysAgoJ(470), birdId: 'b1', breedId: 'br1',
        currentCount: 1000, initialCount: 1000,
      }] as any,
    });

    const alerts = detectAllAlerts();
    const a = alerts.find(x => x.sourceId === 'f1:end-of-cycle');
    expect(a).toBeTruthy();
    expect(a!.level).toBe('important');
  });

  it('گله breeder سن 300 روز → optimal alert', () => {
    useFlk.setState({
      flocks: [{
        id: 'f1', name: 'گله مادر', type: 'breeder', status: 'active',
        startDate: daysAgoJ(300), birdId: 'b1', breedId: 'br1',
        currentCount: 500, initialCount: 500,
      }] as any,
    });

    const alerts = detectAllAlerts();
    const a = alerts.find(x => x.sourceId === 'f1:breeder-optimal');
    expect(a).toBeTruthy();
    expect(a!.level).toBe('info');
  });

  it('گله بایگانی‌شده → هیچ alert', () => {
    useFlk.setState({
      flocks: [{
        id: 'f1', name: 'گله قدیمی', type: 'layer', status: 'archived',
        startDate: daysAgoJ(500), birdId: 'b1', breedId: 'br1',
      }] as any,
    });

    const alerts = detectAllAlerts();
    expect(alerts.filter(a => a.source === 'flk')).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════
// ۵. ثبت روزانه — تلفات و دما
// ═══════════════════════════════════════════════
describe('rules — daily logs', () => {
  it('تلفات > 5 در هزار → critical', () => {
    useFlk.setState({
      flocks: [{
        id: 'f1', name: 'گله', type: 'layer', status: 'active',
        currentCount: 1000, initialCount: 1000, birdId: 'b1', breedId: 'br1',
      }] as any,
    });
    useDlg.setState({
      logs: [{
        id: 'l1', flockId: 'f1', date: todayJ(),
        deaths: [{ count: 8 }],
        temperature: null, humidity: null,
      }] as any,
    });

    const alerts = detectAllAlerts();
    const a = alerts.find(x => x.sourceId === 'l1:high-mortality');
    expect(a).toBeTruthy();
    expect(a!.level).toBe('critical');
  });

  it('تلفات 2-5 در هزار → important', () => {
    useFlk.setState({
      flocks: [{
        id: 'f1', name: 'گله', type: 'layer', status: 'active',
        currentCount: 1000, initialCount: 1000, birdId: 'b1', breedId: 'br1',
      }] as any,
    });
    useDlg.setState({
      logs: [{
        id: 'l1', flockId: 'f1', date: todayJ(),
        deaths: [{ count: 3 }],
        temperature: null, humidity: null,
      }] as any,
    });

    const alerts = detectAllAlerts();
    const a = alerts.find(x => x.sourceId === 'l1:mortality');
    expect(a).toBeTruthy();
    expect(a!.level).toBe('important');
  });

  it('دمای 35 درجه → critical', () => {
    useDlg.setState({
      logs: [{
        id: 'l1', date: todayJ(), temperature: 35,
        deaths: [], humidity: null,
      }] as any,
    });

    const alerts = detectAllAlerts();
    const a = alerts.find(x => x.sourceId === 'l1:temp-critical');
    expect(a).toBeTruthy();
    expect(a!.level).toBe('critical');
  });

  it('دمای 16 درجه → critical (زیر 15 نه، 16=warn)', () => {
    // طبق threshold کد: < 15 → critical, 15-18 → warn (important)
    useDlg.setState({
      logs: [{
        id: 'l1', date: todayJ(), temperature: 16,
        deaths: [], humidity: null,
      }] as any,
    });

    const alerts = detectAllAlerts();
    const a = alerts.find(x => x.sourceId === 'l1:temp-warning');
    expect(a).toBeTruthy();
    expect(a!.level).toBe('important');
  });

  it('دمای 22 (خوب) → هیچ alert', () => {
    useDlg.setState({
      logs: [{
        id: 'l1', date: todayJ(), temperature: 22,
        deaths: [], humidity: null,
      }] as any,
    });

    const alerts = detectAllAlerts();
    expect(alerts.filter(a => a.category === 'temp')).toHaveLength(0);
  });

  it('لاگ قدیمی (5 روز پیش) → نادیده', () => {
    useDlg.setState({
      logs: [{
        id: 'l1', date: daysAgoJ(5), temperature: 40,
        deaths: [{ count: 100 }],
      }] as any,
    });

    const alerts = detectAllAlerts();
    expect(alerts.filter(a => a.sourceId?.startsWith('l1:'))).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════
// ۶. تخم‌گذاری
// ═══════════════════════════════════════════════
describe('rules — egg production', () => {
  it('henDay < 50% + گله بزرگ → important', () => {
    useFlk.setState({
      flocks: [{
        id: 'f1', name: 'گله', type: 'layer', status: 'active',
        currentCount: 1000, initialCount: 1000, birdId: 'b1', breedId: 'br1',
      }] as any,
    });
    useEgg.setState({
      productions: [{
        id: 'p1', flockId: 'f1', date: todayJ(),
        totalCount: 400,  // 40%
        brokenCount: 0, softCount: 0, dirtyCount: 0,
      }] as any,
    });

    const alerts = detectAllAlerts();
    const a = alerts.find(x => x.sourceId === 'p1:low-rate');
    expect(a).toBeTruthy();
    expect(a!.level).toBe('important');
  });

  it('henDay > 90% → هیچ alert', () => {
    useFlk.setState({
      flocks: [{
        id: 'f1', name: 'گله', type: 'layer', status: 'active',
        currentCount: 1000, initialCount: 1000, birdId: 'b1', breedId: 'br1',
      }] as any,
    });
    useEgg.setState({
      productions: [{
        id: 'p1', flockId: 'f1', date: todayJ(),
        totalCount: 950, brokenCount: 0, softCount: 0, dirtyCount: 0,
      }] as any,
    });

    const alerts = detectAllAlerts();
    expect(alerts.filter(a => a.sourceId === 'p1:low-rate')).toHaveLength(0);
  });

  it('گله کوچک (< 100) → نادیده', () => {
    useFlk.setState({
      flocks: [{
        id: 'f1', name: 'گله', type: 'layer', status: 'active',
        currentCount: 50, initialCount: 50, birdId: 'b1', breedId: 'br1',
      }] as any,
    });
    useEgg.setState({
      productions: [{
        id: 'p1', flockId: 'f1', date: todayJ(),
        totalCount: 10,  // 20%
        brokenCount: 0, softCount: 0, dirtyCount: 0,
      }] as any,
    });

    const alerts = detectAllAlerts();
    expect(alerts.filter(a => a.sourceId === 'p1:low-rate')).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════
// ۷. جوجه‌کشی
// ═══════════════════════════════════════════════
describe('rules — incubation', () => {
  it('Lock-down امروز (روز 18) → important', () => {
    useInc.setState({
      eggEntries: [{
        id: 'e1', entryDate: daysAgoJ(18),   // ۱۸ روز پیش = روز ۱۹ امروز
        expectedHatchDate: format(addDays(startOfDay(new Date()), 3), 'yyyy/MM/dd'),
        count: 100, status: 'incubating',
      }] as any,
    });

    const alerts = detectAllAlerts();
    const a = alerts.find(x => x.sourceId === 'e1:lockdown');
    // ⚠️ نکته: daysAgoJ(18) → اگه fix درست باشه، age === 18 الان
    // ولی بالای helper منه daysAgoJ میگه 18 روز پیش
    // اگر کد جدید درست باشه باید trigger بشه
    expect(a).toBeTruthy();
    expect(a!.level).toBe('important');
  });

  it('پنجره هچ (2 روز قبل) → critical', () => {
    useInc.setState({
      eggEntries: [{
        id: 'e1', entryDate: daysAgoJ(19),
        expectedHatchDate: format(addDays(startOfDay(new Date()), 2), 'yyyy/MM/dd'),
        count: 100, status: 'incubating',
      }] as any,
    });

    const alerts = detectAllAlerts();
    const a = alerts.find(x => x.sourceId === 'e1:hatch-window');
    expect(a).toBeTruthy();
    expect(a!.level).toBe('critical');
  });

  it('نزدیک هچ (3 روز) → info', () => {
    useInc.setState({
      eggEntries: [{
        id: 'e1', entryDate: daysAgoJ(18),
        expectedHatchDate: format(addDays(startOfDay(new Date()), 3), 'yyyy/MM/dd'),
        count: 100, status: 'incubating',
      }] as any,
    });

    const alerts = detectAllAlerts();
    const a = alerts.find(x => x.sourceId === 'e1:hatch-near');
    expect(a).toBeTruthy();
    expect(a!.level).toBe('info');
  });

  it('رکورد hatched → نادیده', () => {
    useInc.setState({
      eggEntries: [{
        id: 'e1', entryDate: daysAgoJ(25),
        expectedHatchDate: daysAgoJ(3),
        count: 100, status: 'hatched',
      }] as any,
    });

    const alerts = detectAllAlerts();
    expect(alerts.filter(a => a.sourceId?.startsWith('e1:'))).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════
// ۸. تست‌های ساختاری
// ═══════════════════════════════════════════════
describe('rules — structure', () => {
  it('همه‌ی alert ها notes دارن', () => {
    useWhs.setState({
      items: [{
        id: 'i1', name: 'دان', category: 'feed', unit: 'kg',
        currentStock: 0, minStock: 20, lastPrice: 1000, expireDate: '',
      }] as any,
    });

    const alerts = detectAllAlerts();
    alerts.forEach(a => {
      expect(a.notes).toBeDefined();
      expect(typeof a.notes).toBe('string');
    });
  });

  it('همه‌ی alert ها level و category معتبر', () => {
    useWhs.setState({
      items: [{
        id: 'i1', name: 'دان', category: 'feed', unit: 'kg',
        currentStock: 0, minStock: 20, lastPrice: 1000, expireDate: '',
      }] as any,
    });

    const alerts = detectAllAlerts();
    const validLevels = ['critical', 'important', 'info'];
    const validCats = ['stock', 'vaccine', 'payment', 'temp', 'mortality', 'reproduction', 'other'];

    alerts.forEach(a => {
      expect(validLevels).toContain(a.level);
      expect(validCats).toContain(a.category);
    });
  });

  it('همه storeها خالی → هیچ alert', () => {
    const alerts = detectAllAlerts();
    expect(alerts).toHaveLength(0);
  });
});
