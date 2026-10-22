/**
 * invariants.test.ts — Self-test for the invariant checker
 * مطمئن می‌شیم invariants:
 *  - در حالت سالم، خالی برمی‌گردونه
 *  - باگ‌های مصنوعی رو تشخیص می‌ده
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useTra } from '../mod/tra/store';
import { useWhs } from '../mod/whs/store';
import { useFlk } from '../mod/flk/store';
import { useHal } from '../mod/hal/store';
import { useInc } from '../mod/inc/store';
import { verifyInvariants } from '../shr/dev/invariants';

function resetAll() {
  useTra.setState({ invoices: [], partyPayments: [], deals: [], allocations: [] } as any);
  useWhs.setState({ items: [], movements: [] } as any);
  useFlk.setState({ flocks: [] } as any);
  useHal.setState({ halls: [], zones: [], equipment: [] } as any);
  useInc.setState({ devices: [], eggEntries: [] } as any);
}

beforeEach(resetAll);

describe('invariants: healthy state', () => {
  it('empty stores → no issues', () => {
    expect(verifyInvariants()).toEqual([]);
  });

  it('whs item with matching movement → no whs issue', () => {
    // currentStock=0 → initialStock=0, movement=100, currentStock=100 → consistent
    const itemId = useWhs.getState().addItem({
      name: 'دان', category: 'feed', unit: 'kg',
      minStock: 0, currentStock: 0, lastPrice: 1000,
      supplierId: '', expireDate: '', withdrawalDays: null,
      storage: 'room', notes: '',
    } as any);
    useWhs.getState().addMovement({
      itemId, type: 'in', quantity: 100, unitPrice: 1000,
      reason: 'purchase', date: '1405/07/29', partyId: '', notes: '',
    } as any);
    // Check specifically for whs issues (other issues may exist if setup incomplete)
    const issues = verifyInvariants();
    const whsIssues = issues.filter(i => i.includes('whs'));
    expect(whsIssues).toEqual([]);
  });
});

describe('invariants: detect whs mismatch', () => {
  it('movements ≠ currentStock → issue reported', () => {
    const itemId = useWhs.getState().addItem({
      name: 'دان', category: 'feed', unit: 'kg',
      minStock: 0, currentStock: 999, lastPrice: 1000,   // ← currentStock دستی خراب
      supplierId: '', expireDate: '', withdrawalDays: null,
      storage: 'room', notes: '',
    } as any);
    useWhs.getState().addMovement({
      itemId, type: 'in', quantity: 100, unitPrice: 1000,
      reason: 'purchase', date: '1405/07/29', partyId: '', notes: '',
    } as any);
    const issues = verifyInvariants();
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]).toContain('whs');
    expect(issues[0]).toContain('دان');
  });
});

describe('invariants: detect orphan flock', () => {
  it('flock references missing invoice → issue reported', () => {
    useFlk.getState().add({
      name: 'Flock A', type: 'layer', birdId: 'b', breedId: 'br',
      hallId: 'h', zoneId: '',
      initialCount: 100, currentCount: 100,
      maleCount: null, femaleCount: null, unknownCount: null,
      layingStartDay: 140, endOfCycleDay: null, vaccineScheduleId: '',
      hatchDate: '1405/01/01', purchaseDate: '1405/07/29', startDate: '1405/07/29',
      source: 'purchase', purchasePrice: null, deliveryCost: null, otherCosts: null,
      status: 'active', notes: '', dealType: 'own',
      sourceInvoiceId: 'missing-invoice-id',   // ← فاکتور وجود نداره
    } as any);

    const issues = verifyInvariants();
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some(i => i.includes('flk'))).toBe(true);
  });
});

describe('invariants: detect orphan equipment', () => {
  it('equipment references missing invoice → issue reported', () => {
    useHal.getState().addEquip({
      hallId: 'hall-1', zoneId: '',
      category: 'cooling' as any, type: 'fan', name: 'فن تونلی',
      count: 2, unit: 'pcs' as any, unitPrice: 5_000_000,
      purchasedAt: '1405/07/29', warranty: null,
      notes: '', sourceInvoiceId: 'missing-invoice',
    } as any);

    const issues = verifyInvariants();
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some(i => i.includes('hal'))).toBe(true);
  });
});

describe('invariants: detect orphan eggEntry', () => {
  it('eggEntry references missing invoice → issue reported', () => {
    useInc.getState().addEntry({
      deviceId: '', hatchGroupId: '', birdId: 'b', breedId: 'br',
      count: 100, entryDate: '1405/07/20', expectedHatchDate: '1405/08/10',
      source: 'purchase', dealType: 'own', dealStatus: 'active',
      dealWithdrawnAt: '', dealWithdrawnReason: '', dealData: {},
      trayNumbers: '', unitPrice: null, totalPrice: null, shippingCost: null,
      status: 'incubating', generatedInvoiceId: '', generatedProductionId: '',
      notes: '', sourceInvoiceId: 'missing-invoice',
    } as any);

    const issues = verifyInvariants();
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some(i => i.includes('inc'))).toBe(true);
  });
});

describe('invariants: detect negative payment', () => {
  it('negative payment (not refund) → issue reported', () => {
    useTra.getState().addInvoice({
      type: 'purchase', date: '1405/07/29', partyId: 'p', category: 'feed',
      items: [], total: 0,
      payments: [{
        id: 'p1', amount: -5000, method: 'cash', type: 'regular',
        date: '1405/07/29', checkNo: '', bank: '', dueDate: '', notes: '',
      }],
      dueDate: '1405/07/29', relatedFlockId: '', relatedEntryId: '', notes: '',
    } as any);

    const issues = verifyInvariants();
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some(i => i.includes('tra'))).toBe(true);
  });
});

describe('invariants: multiple issues', () => {
  it('three separate corruptions → three issues', () => {
    // whs mismatch
    const itemId = useWhs.getState().addItem({
      name: 'دان', category: 'feed', unit: 'kg',
      minStock: 0, currentStock: 999, lastPrice: 0,
      supplierId: '', expireDate: '', withdrawalDays: null,
      storage: 'room', notes: '',
    } as any);
    useWhs.getState().addMovement({
      itemId, type: 'in', quantity: 100, unitPrice: 0,
      reason: 'purchase', date: '1405/07/29', partyId: '', notes: '',
    } as any);

    // orphan flock
    useFlk.getState().add({
      name: 'F', type: 'layer', birdId: 'b', breedId: 'br',
      hallId: 'h', zoneId: '',
      initialCount: 10, currentCount: 10,
      maleCount: null, femaleCount: null, unknownCount: null,
      layingStartDay: 0, endOfCycleDay: null, vaccineScheduleId: '',
      hatchDate: '', purchaseDate: '', startDate: '',
      source: 'purchase', purchasePrice: null, deliveryCost: null, otherCosts: null,
      status: 'active', notes: '', dealType: 'own',
      sourceInvoiceId: 'missing-1',
    } as any);

    // orphan equipment
    useHal.getState().addEquip({
      hallId: 'h', zoneId: '',
      category: 'cooling' as any, type: 'fan', name: 'Fan',
      count: 1, unit: 'pcs' as any, unitPrice: null,
      purchasedAt: '', warranty: null,
      notes: '', sourceInvoiceId: 'missing-2',
    } as any);

    const issues = verifyInvariants();
    expect(issues.length).toBeGreaterThanOrEqual(3);
  });
});
