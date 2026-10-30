/**
 * deal-journey.test.ts — تست‌های end-to-end منطق معاملات خاص
 * بدون UI — فقط store و helper functions
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useTra } from '../mod/tra/store';
import { useWhs } from '../mod/whs/store';
import { useFlk } from '../mod/flk/store';
import { computeSettlement, createInvoiceFromSettlement } from '../mod/tra/settlement';
import type { Deal, Settlement, DealGood, DealSale, DealPayment } from '../mod/tra/types';

// ─── Builders ───
const mkGood = (o: Partial<DealGood> = {}): DealGood => ({
  id: 'good-1', name: 'جوجه', quantity: 1000, unit: 'pcs', estimatedPrice: 15000, category: 'chick', ...o,
});

const mkSale = (o: Partial<DealSale> = {}): DealSale => ({
  id: 'sale-1', goodId: 'good-1', date: '1405/08/15', quantity: 300, unitPrice: 20000, ...o,
});

const mkPay = (o: Partial<DealPayment> = {}): DealPayment => ({
  id: 'pay-1', date: '1405/08/20', amount: 1000000, direction: 'in', method: 'cash', ...o,
});

const mkDeal = (o: Partial<Deal> = {}): Deal => ({
  id: 'deal-1', type: 'consignment', date: '1405/08/09', partyId: 'party-1',
  description: 'test', value: 0, percent: null, dueDate: '1405/09/09',
  status: 'open', notes: '', dealNumber: '1405-001',
  createdAt: '2025-01-01', updatedAt: '2025-01-01',
  goods: [], deliveries: [], sales: [], payments: [],
  ...o,
});

beforeEach(() => {
  localStorage.clear();
  useTra.setState({ deals: [], invoices: [], settlements: [], allocations: [], partyPayments: [] });
  useWhs.setState({ items: [], movements: [] });
  useFlk.setState({ flocks: [] });
});

// ─── computeSettlement ───
describe('computeSettlement — ۵ نوع تسویه', () => {
  it('null برای بازه بدون داده', () => {
    const deal = mkDeal();
    expect(computeSettlement(deal, '1405/08/01', '1405/08/05')).toBeNull();
  });

  it('percent: ۱۰٪ از فروش', () => {
    const deal = mkDeal({ settlementType: 'percent', settlementValue: 10, sales: [mkSale({ quantity: 100, unitPrice: 20000 })] });
    const s = computeSettlement(deal, '1405/08/01', '1405/08/31');
    expect(s?.grossSales).toBe(2000000);
    expect(s?.commission).toBe(200000);
    expect(s?.netPayable).toBe(1800000);
  });

  it('per_unit: ۵۰۰۰ × ۱۰۰', () => {
    const deal = mkDeal({ settlementType: 'per_unit', settlementValue: 5000, sales: [mkSale({ quantity: 100, unitPrice: 20000 })] });
    const s = computeSettlement(deal, '1405/08/01', '1405/08/31');
    expect(s?.commission).toBe(500000);
    expect(s?.netPayable).toBe(1500000);
  });

  it('fixed: مبلغ ثابت', () => {
    const deal = mkDeal({ settlementType: 'fixed', settlementValue: 500000, sales: [mkSale({ quantity: 100, unitPrice: 20000 })] });
    const s = computeSettlement(deal, '1405/08/01', '1405/08/31');
    expect(s?.commission).toBe(500000);
  });

  it('barter: کمیسیون صفر', () => {
    const deal = mkDeal({ settlementType: 'barter', settlementValue: null, sales: [mkSale({ quantity: 100, unitPrice: 20000 })] });
    const s = computeSettlement(deal, '1405/08/01', '1405/08/31');
    expect(s?.commission).toBe(0);
    expect(s?.netPayable).toBe(2000000);
  });

  it('rental: × تعداد ماه', () => {
    const deal = mkDeal({ settlementType: 'rental', settlementValue: 1000000, startDate: '1405/08/01', endDate: '1405/11/01', sales: [mkSale({ quantity: 1, unitPrice: 1 })] });
    const s = computeSettlement(deal, '1405/08/01', '1405/11/01');
    expect(s?.commission).toBe(3000000);
  });

  it('paidAmount فقط پرداخت‌های direction=in', () => {
    const deal = mkDeal({
      settlementType: 'percent', settlementValue: 10,
      sales: [mkSale({ quantity: 100, unitPrice: 20000 })],
      payments: [mkPay({ amount: 500000, direction: 'in' }), mkPay({ id: 'p2', amount: 300000, direction: 'out' })],
    });
    const s = computeSettlement(deal, '1405/08/01', '1405/08/31');
    expect(s?.paidAmount).toBe(500000);
  });
});

// ─── createInvoiceFromSettlement ───
describe('createInvoiceFromSettlement', () => {
  it('فاکتور sale با workflowStatus=draft', () => {
    const deal = mkDeal({ id: 'deal-x', partyId: 'party-x' });
    const s: Settlement = {
      id: 'set-1', dealId: 'deal-x', periodStart: '1405/08/01', periodEnd: '1405/08/31',
      deliveriesSnapshot: [], salesSnapshot: [mkSale({ quantity: 100, unitPrice: 20000 })], paymentsSnapshot: [],
      grossSales: 2000000, commission: 200000, netPayable: 1800000, paidAmount: 0,
      status: 'draft', createdAt: '2025-01-01', updatedAt: '2025-01-01',
    };
    const inv = createInvoiceFromSettlement(deal, s);
    expect(inv.type).toBe('sale');
    expect(inv.partyId).toBe('party-x');
    expect(inv.relatedDealId).toBe('deal-x');
    expect(inv.workflowStatus).toBe('draft');
    expect(inv.total).toBe(1800000);
    expect(inv.items).toHaveLength(1);
    expect(inv.items[0].quantity).toBe(100);
  });

  it('payments خالی وقتی paidAmount=0', () => {
    const deal = mkDeal();
    const s: Settlement = {
      id: 'set-1', dealId: 'deal-1', periodStart: '1405/08/01', periodEnd: '1405/08/31',
      deliveriesSnapshot: [], salesSnapshot: [], paymentsSnapshot: [],
      grossSales: 0, commission: 0, netPayable: 0, paidAmount: 0,
      status: 'draft', createdAt: '2025-01-01', updatedAt: '2025-01-01',
    };
    const inv = createInvoiceFromSettlement(deal, s);
    expect(inv.payments).toHaveLength(0);
  });
});

// ─── Recycle Bin ───
describe('Recycle Bin — Deal', () => {
  it('deleteDeal → به recycle bin', () => {
    const d = mkDeal();
    useTra.setState({ deals: [d] });
    useTra.getState().deleteDeal(d.id);
    expect(useTra.getState().deals).toHaveLength(0);
    expect(useTra.getState().listDeletedDeals()).toHaveLength(1);
  });

  it('restore از recycle به لیست فعال', () => {
    const d = mkDeal();
    useTra.setState({ deals: [d] });
    useTra.getState().deleteDeal(d.id);
    const ok = useTra.getState().restoreDealFromBin(d.id);
    expect(ok).toBe(true);
    expect(useTra.getState().deals).toHaveLength(1);
    expect(useTra.getState().listDeletedDeals()).toHaveLength(0);
  });

  it('restore فیلدهای tracking را پاک می‌کند', () => {
    const d = mkDeal({
      deliveries: [{
        id: 'dv-1', goodId: 'good-1', date: '1405/08/09', type: 'out', quantity: 100,
        whsMovementId: 'mv-1', flockDeductedQuantity: -100, flockSourceId: 'flock-1',
      }],
    });
    useTra.setState({ deals: [d] });
    useTra.getState().deleteDeal(d.id);
    useTra.getState().restoreDealFromBin(d.id);
    const restored = useTra.getState().deals[0];
    expect(restored.deliveries[0].whsMovementId).toBeUndefined();
    expect(restored.deliveries[0].flockDeductedQuantity).toBeUndefined();
    expect(restored.deliveries[0].flockSourceId).toBeUndefined();
  });

  it('restore ناموفق اگر deal قبلاً وجود دارد', () => {
    const d = mkDeal();
    useTra.setState({ deals: [d] });
    useTra.getState().deleteDeal(d.id);
    useTra.setState({ deals: [...useTra.getState().deals, d] });
    const ok = useTra.getState().restoreDealFromBin(d.id);
    expect(ok).toBe(false);
  });
});
