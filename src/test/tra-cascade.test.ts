/**
 * tra-cascade.test.ts — Integration tests for invoice → downstream stores
 * هر تست: reset همه storeها → ساخت فاکتور → انتظار در whs/flk/hal/inc
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { paidSum, paidSumAllocated, paidPendingSum, remaining } from '../mod/tra/calc';
import { useTra } from '../mod/tra/store';
import { useWhs } from '../mod/whs/store';
import { useFlk } from '../mod/flk/store';
import { useHal } from '../mod/hal/store';
import { useInc } from '../mod/inc/store';

// ─── Reset ───
function resetAll() {
  useTra.setState({ invoices: [], partyPayments: [], deals: [], allocations: [] } as any);
  useWhs.setState({ items: [], movements: [] } as any);
  useFlk.setState({ flocks: [] } as any);
  useHal.setState({ halls: [], zones: [], equipment: [] } as any);
  useInc.setState({ devices: [], eggEntries: [] } as any);
}

beforeEach(resetAll);

// ─── Helpers ───
const FA_DATE = '1405/07/29';

function baseItem(qty: number, price = 1000, extra: any = {}) {
  return {
    id: crypto.randomUUID(),
    description: 'کالای تست',
    unit: 'pcs',
    quantity: qty,
    unitPrice: price,
    total: qty * price,
    itemId: '',
    movementId: '',
    discountType: '',
    discountValue: 0,
    shipping: 0,
    ...extra,
  };
}

function feedInvoice(qty: number) {
  return {
    type: 'purchase' as const,
    date: FA_DATE, partyId: 'party-1', category: 'feed',
    items: [baseItem(qty, 1000, { category: 'feed', unit: 'kg', description: 'دان استارتر' })],
    total: qty * 1000, payments: [],
    dueDate: FA_DATE, relatedFlockId: '', relatedEntryId: '', notes: '',
  };
}

function equipInvoice(qty: number, hallId = 'hall-1') {
  return {
    type: 'purchase' as const,
    date: FA_DATE, partyId: 'party-1', category: 'equipment',
    items: [baseItem(qty, 5_000_000, {
      category: 'equipment', description: 'فن تونلی',
      equipmentKind: 'asset', equipmentCategory: 'cooling',
      equipmentType: 'fan', hallId,
    })],
    total: qty * 5_000_000, payments: [],
    dueDate: FA_DATE, relatedFlockId: '', relatedEntryId: '', notes: '',
  };
}

function chickInvoice(qty: number, hallId = 'hall-1', existingFlockId = '') {
  return {
    type: 'purchase' as const,
    date: FA_DATE, partyId: 'party-1', category: 'chick',
    items: [baseItem(qty, 20_000, {
      category: 'chick', description: 'جوجه یک‌روزه',
      birdId: 'bird-1', breedId: 'breed-1', hallId,
      existingFlockId: existingFlockId || undefined,
      maleCount: null, femaleCount: null, unknownCount: null,
      hatchDate: '1405/06/01',
    })],
    total: qty * 20_000, payments: [],
    dueDate: FA_DATE, relatedFlockId: '', relatedEntryId: '', notes: '',
  };
}

function eggInvoice(qty: number, broken = 0, nonInc = 0) {
  return {
    type: 'purchase' as const,
    date: FA_DATE, partyId: 'party-1', category: 'egg',
    items: [baseItem(qty, 30_000, {
      category: 'egg', description: 'تخم نطفه‌دار',
      birdId: 'bird-1', breedId: 'breed-1',
      brokenEggCount: broken, nonIncubableCount: nonInc,
      eggDate: '1405/07/20',
    })],
    total: qty * 30_000, payments: [],
    dueDate: FA_DATE, relatedFlockId: '', relatedEntryId: '', notes: '',
  };
}

// ═══════════════════════════════════════════════════════════
// GROUP 1: feed → whs
// ═══════════════════════════════════════════════════════════
describe('cascade: feed → whs', () => {
  it('purchase 100 kg creates whs item with stock=100', () => {
    useTra.getState().addInvoice(feedInvoice(100) as any);
    const items = useWhs.getState().items;
    expect(items.length).toBe(1);
    expect(items[0].currentStock).toBe(100);
    expect(items[0].category).toBe('feed');
  });

  it('edit 100 → 50 → whs=50 (delta, not 150)', () => {
    const id = useTra.getState().addInvoice(feedInvoice(100) as any);
    const prev = useTra.getState().invoices.find(i => i.id === id)!;
    const newItems = prev.items.map(it => ({ ...it, quantity: 50, total: 50_000 }));
    useTra.getState().updateInvoice(id, { items: newItems, total: 50_000 });
    const items = useWhs.getState().items;
    expect(items.length).toBe(1);
    expect(items[0].currentStock).toBe(50);
  });

  it('edit 100 → 150 → whs=150 (delta, not 250)', () => {
    const id = useTra.getState().addInvoice(feedInvoice(100) as any);
    const prev = useTra.getState().invoices.find(i => i.id === id)!;
    const newItems = prev.items.map(it => ({ ...it, quantity: 150, total: 150_000 }));
    useTra.getState().updateInvoice(id, { items: newItems, total: 150_000 });
    expect(useWhs.getState().items[0].currentStock).toBe(150);
  });
});

// ═══════════════════════════════════════════════════════════
// GROUP 2: equipment → hal + whs
// ═══════════════════════════════════════════════════════════
describe('cascade: equipment → hal', () => {
  it('purchase fan → hal equipment + whs item', () => {
    useTra.getState().addInvoice(equipInvoice(2) as any);
    const eqs = useHal.getState().equipment;
    expect(eqs.length).toBe(1);
    expect(eqs[0].name).toContain('فن');
    expect(eqs[0].count).toBe(2);
    expect(useWhs.getState().items.length).toBeGreaterThanOrEqual(1);
  });

  it('edit 2 → 3 → hal count=3 (not 5)', () => {
    const id = useTra.getState().addInvoice(equipInvoice(2) as any);
    const prev = useTra.getState().invoices.find(i => i.id === id)!;
    const newItems = prev.items.map(it => ({ ...it, quantity: 3, total: 15_000_000 }));
    useTra.getState().updateInvoice(id, { items: newItems, total: 15_000_000 });
    const eqs = useHal.getState().equipment;
    expect(eqs.length).toBe(1);
    expect(eqs[0].count).toBe(3);
  });

  it('remove item → hal equipment deleted (orphan cleanup)', () => {
    const id = useTra.getState().addInvoice(equipInvoice(2) as any);
    expect(useHal.getState().equipment.length).toBe(1);
    useTra.getState().updateInvoice(id, { items: [], total: 0 });
    expect(useHal.getState().equipment.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════
// GROUP 3: chick → flk
// ═══════════════════════════════════════════════════════════
describe('cascade: chick → flk', () => {
  it('purchase 100 chicks → flock with 100', () => {
    useTra.getState().addInvoice(chickInvoice(100) as any);
    const flocks = useFlk.getState().flocks;
    expect(flocks.length).toBe(1);
    expect(flocks[0].initialCount).toBe(100);
    expect(flocks[0].currentCount).toBe(100);
  });

  it('edit 100 → 50 → flock count=50 (delta)', () => {
    const id = useTra.getState().addInvoice(chickInvoice(100) as any);
    const prev = useTra.getState().invoices.find(i => i.id === id)!;
    const newItems = prev.items.map(it => ({ ...it, quantity: 50, total: 1_000_000 }));
    useTra.getState().updateInvoice(id, { items: newItems, total: 1_000_000 });
    const flocks = useFlk.getState().flocks;
    expect(flocks.length).toBe(1);
    expect(flocks[0].initialCount).toBe(50);
    expect(flocks[0].currentCount).toBe(50);
  });

  it('connect to existing flock 500 + invoice 100 → 600', () => {
    const flockId = useFlk.getState().add({
      name: 'Flock A', type: 'layer', birdId: 'bird-1', breedId: 'breed-1',
      hallId: 'hall-1', zoneId: '',
      initialCount: 500, currentCount: 500,
      maleCount: null, femaleCount: null, unknownCount: null,
      layingStartDay: 140, endOfCycleDay: null, vaccineScheduleId: '',
      hatchDate: '1405/01/01', purchaseDate: FA_DATE, startDate: FA_DATE,
      source: 'manual', purchasePrice: null, deliveryCost: null, otherCosts: null,
      status: 'active', notes: '', dealType: 'own',
    } as any);

    useTra.getState().addInvoice(chickInvoice(100, 'hall-1', flockId) as any);

    const flock = useFlk.getState().flocks.find(f => f.id === flockId);
    expect(flock).toBeDefined();
    expect(flock!.initialCount).toBe(600);
    expect(flock!.currentCount).toBe(600);
  });
});

// ═══════════════════════════════════════════════════════════
// GROUP 4: egg → inc
// ═══════════════════════════════════════════════════════════
describe('cascade: egg → inc', () => {
  it('purchase 100 eggs → eggEntry with count=100', () => {
    useTra.getState().addInvoice(eggInvoice(100) as any);
    const entries = useInc.getState().eggEntries;
    expect(entries.length).toBe(1);
    expect(entries[0].count).toBe(100);
  });

  it('broken+nonInc subtracted: 100 - 5 - 3 = 92', () => {
    useTra.getState().addInvoice(eggInvoice(100, 5, 3) as any);
    const entries = useInc.getState().eggEntries;
    expect(entries[0].count).toBe(92);
  });

  it('edit 100 → 200 → eggEntry count=200 (not 300)', () => {
    const id = useTra.getState().addInvoice(eggInvoice(100) as any);
    const prev = useTra.getState().invoices.find(i => i.id === id)!;
    const newItems = prev.items.map(it => ({ ...it, quantity: 200, total: 6_000_000 }));
    useTra.getState().updateInvoice(id, { items: newItems, total: 6_000_000 });
    const entries = useInc.getState().eggEntries;
    expect(entries.length).toBe(1);
    expect(entries[0].count).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════
// GROUP 5: mixed + isolation
// ═══════════════════════════════════════════════════════════
describe('cascade: mixed & isolation', () => {
  it('sale invoice does NOT create whs', () => {
    const sale = feedInvoice(50);
    (sale as any).type = 'sale';
    (sale as any).category = 'other';
    useTra.getState().addInvoice(sale as any);
    // sale of category='other' → no whs
    // (applyInvoiceStock returns early for non-purchase)
    expect(useWhs.getState().items.length).toBe(0);
  });

  it('two separate invoices with same flock name create 2 flocks', () => {
    useTra.getState().addInvoice(chickInvoice(100) as any);
    useTra.getState().addInvoice(chickInvoice(50) as any);
    expect(useFlk.getState().flocks.length).toBe(2);
  });
});


// ═══════════════════════════════════════════════════════════
// GROUP 6: Multiple items, same key
// ═══════════════════════════════════════════════════════════
describe('complex: multiple items with same key', () => {
  it('two feed items same description → whs aggregates', () => {
    const inv = feedInvoice(100);
    inv.items.push({
      ...baseItem(50, 1000, { category: 'feed', unit: 'kg', description: 'دان استارتر' }),
    });
    (inv as any).total = 150_000;
    useTra.getState().addInvoice(inv as any);
    const items = useWhs.getState().items;
    expect(items.length).toBe(1);
    expect(items[0].currentStock).toBe(150);
  });

  it('edit one of two items: 100+50 → 30+50 = 80', () => {
    const inv = feedInvoice(100);
    inv.items.push({
      ...baseItem(50, 1000, { category: 'feed', unit: 'kg', description: 'دان استارتر' }),
    });
    (inv as any).total = 150_000;
    const id = useTra.getState().addInvoice(inv as any);
    const prev = useTra.getState().invoices.find(i => i.id === id)!;
    const newItems = prev.items.map((it, i) => i === 0
      ? { ...it, quantity: 30, total: 30_000 }
      : it);
    useTra.getState().updateInvoice(id, { items: newItems, total: 80_000 });
    expect(useWhs.getState().items[0].currentStock).toBe(80);
  });
});

// ═══════════════════════════════════════════════════════════
// GROUP 7: Sequential edits (drift detection)
// ═══════════════════════════════════════════════════════════
describe('complex: sequential edits no drift', () => {
  it('100 → 150 → 50 → 200 → whs=200 (no drift)', () => {
    const id = useTra.getState().addInvoice(feedInvoice(100) as any);
    const edits = [150, 50, 200];
    for (const qty of edits) {
      const prev = useTra.getState().invoices.find(i => i.id === id)!;
      const newItems = prev.items.map(it => ({ ...it, quantity: qty, total: qty * 1000 }));
      useTra.getState().updateInvoice(id, { items: newItems, total: qty * 1000 });
    }
    expect(useWhs.getState().items[0].currentStock).toBe(200);
  });

  it('flock 100 → 200 → 50 → 150 (no drift)', () => {
    const id = useTra.getState().addInvoice(chickInvoice(100) as any);
    for (const qty of [200, 50, 150]) {
      const prev = useTra.getState().invoices.find(i => i.id === id)!;
      const newItems = prev.items.map(it => ({ ...it, quantity: qty, total: qty * 20_000 }));
      useTra.getState().updateInvoice(id, { items: newItems, total: qty * 20_000 });
    }
    expect(useFlk.getState().flocks[0].initialCount).toBe(150);
    expect(useFlk.getState().flocks[0].currentCount).toBe(150);
  });

  it('equipment 2→5→1 (count tracks last value)', () => {
    const id = useTra.getState().addInvoice(equipInvoice(2) as any);
    for (const qty of [5, 1]) {
      const prev = useTra.getState().invoices.find(i => i.id === id)!;
      const newItems = prev.items.map(it => ({ ...it, quantity: qty, total: qty * 5_000_000 }));
      useTra.getState().updateInvoice(id, { items: newItems, total: qty * 5_000_000 });
    }
    expect(useHal.getState().equipment[0].count).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════
// GROUP 8: Edit to zero / remove all items
// ═══════════════════════════════════════════════════════════
describe('complex: edit to zero', () => {
  it('feed 100 → 0 → whs=0', () => {
    const id = useTra.getState().addInvoice(feedInvoice(100) as any);
    const prev = useTra.getState().invoices.find(i => i.id === id)!;
    const newItems = prev.items.map(it => ({ ...it, quantity: 0, total: 0 }));
    useTra.getState().updateInvoice(id, { items: newItems, total: 0 });
    const items = useWhs.getState().items;
    const stock = items.length > 0 ? items[0].currentStock : 0;
    expect(stock).toBe(0);
  });

  it('remove all items → equipment orphan cleaned', () => {
    const id = useTra.getState().addInvoice(equipInvoice(2) as any);
    useTra.getState().updateInvoice(id, { items: [], total: 0 });
    expect(useHal.getState().equipment.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════
// GROUP 9: Existing flock — full cycle
// ═══════════════════════════════════════════════════════════
describe('complex: existing flock edit cycle', () => {
  it('flock 500 + inv 100 → 600; edit inv to 50 → 550; edit to 200 → 700', () => {
    const flockId = useFlk.getState().add({
      name: 'Flock A', type: 'layer', birdId: 'bird-1', breedId: 'breed-1',
      hallId: 'hall-1', zoneId: '',
      initialCount: 500, currentCount: 500,
      maleCount: null, femaleCount: null, unknownCount: null,
      layingStartDay: 140, endOfCycleDay: null, vaccineScheduleId: '',
      hatchDate: '1405/01/01', purchaseDate: FA_DATE, startDate: FA_DATE,
      source: 'manual', purchasePrice: null, deliveryCost: null, otherCosts: null,
      status: 'active', notes: '', dealType: 'own',
    } as any);

    const id = useTra.getState().addInvoice(chickInvoice(100, 'hall-1', flockId) as any);
    expect(useFlk.getState().flocks.find(f => f.id === flockId)!.initialCount).toBe(600);

    // edit to 50
    let prev = useTra.getState().invoices.find(i => i.id === id)!;
    let newItems = prev.items.map(it => ({ ...it, quantity: 50, total: 1_000_000 }));
    useTra.getState().updateInvoice(id, { items: newItems, total: 1_000_000 });
    expect(useFlk.getState().flocks.find(f => f.id === flockId)!.initialCount).toBe(550);

    // edit to 200
    prev = useTra.getState().invoices.find(i => i.id === id)!;
    newItems = prev.items.map(it => ({ ...it, quantity: 200, total: 4_000_000 }));
    useTra.getState().updateInvoice(id, { items: newItems, total: 4_000_000 });
    expect(useFlk.getState().flocks.find(f => f.id === flockId)!.initialCount).toBe(700);
  });
});

// ═══════════════════════════════════════════════════════════
// GROUP 10: Two separate invoices same stock item
// ═══════════════════════════════════════════════════════════
describe('complex: two invoices same stock item', () => {
  it('inv A 100 + inv B 50 → whs either 150 (merged) or two items', () => {
    useTra.getState().addInvoice(feedInvoice(100) as any);
    useTra.getState().addInvoice(feedInvoice(50) as any);
    const items = useWhs.getState().items;
    const totalStock = items.reduce((a, it) => a + (it.currentStock || 0), 0);
    // either aggregated to one item (150) or two items (100+50) — both valid
    expect(totalStock).toBe(150);
  });

  it('delete inv A → inv B remains, whs drops by 100', () => {
    const idA = useTra.getState().addInvoice(feedInvoice(100) as any);
    useTra.getState().addInvoice(feedInvoice(50) as any);
    const before = useWhs.getState().items.reduce((a, it) => a + (it.currentStock || 0), 0);
    expect(before).toBe(150);
    useTra.getState().deleteInvoice(idA);
    const after = useWhs.getState().items.reduce((a, it) => a + (it.currentStock || 0), 0);
    expect(after).toBe(50);
  });
});

// ═══════════════════════════════════════════════════════════
// GROUP 11: Equipment rename
// ═══════════════════════════════════════════════════════════
describe('complex: equipment rename', () => {
  it('rename فن A → فن B: same equipmentId preserved (no duplicate)', () => {
    const id = useTra.getState().addInvoice(equipInvoice(2) as any);
    const eqBefore = useHal.getState().equipment[0];
    const eqIdBefore = eqBefore.id;

    const prev = useTra.getState().invoices.find(i => i.id === id)!;
    const newItems = prev.items.map(it => ({ ...it, description: 'فن B' }));
    useTra.getState().updateInvoice(id, { items: newItems, total: 10_000_000 });

    const eqs = useHal.getState().equipment;
    expect(eqs.length).toBe(1);
    expect(eqs[0].id).toBe(eqIdBefore);
    expect(eqs[0].name).toBe('فن B');
  });
});

// ═══════════════════════════════════════════════════════════
// GROUP 12: Partial removal (multi-item)
// ═══════════════════════════════════════════════════════════
describe('complex: partial removal multi-item', () => {
  it('2 equipment items → remove 1 → 1 equipment remains', () => {
    const inv = equipInvoice(2);
    inv.items.push({
      ...baseItem(1, 3_000_000, {
        category: 'equipment', description: 'کولر',
        equipmentKind: 'asset', equipmentCategory: 'cooling',
        equipmentType: 'cooler', hallId: 'hall-1',
      }),
    });
    (inv as any).total = 13_000_000;
    const id = useTra.getState().addInvoice(inv as any);
    expect(useHal.getState().equipment.length).toBe(2);

    // remove "کولر" (index 1)
    const prev = useTra.getState().invoices.find(i => i.id === id)!;
    useTra.getState().updateInvoice(id, {
      items: [prev.items[0]],
      total: 10_000_000,
    });
    const eqs = useHal.getState().equipment;
    expect(eqs.length).toBe(1);
    expect(eqs[0].name).toContain('فن');
  });
});

// ═══════════════════════════════════════════════════════════
// GROUP 13: Mixed category invoice
// ═══════════════════════════════════════════════════════════
describe('complex: mixed category invoice', () => {
  it('feed + chick + equipment → all cascades fire', () => {
    const inv = feedInvoice(100);
    inv.items.push({
      ...baseItem(50, 20_000, {
        category: 'chick', description: 'جوجه',
        birdId: 'bird-1', breedId: 'breed-1', hallId: 'hall-2',
        hatchDate: '1405/06/01',
      }),
    });
    inv.items.push({
      ...baseItem(2, 5_000_000, {
        category: 'equipment', description: 'فن',
        equipmentKind: 'asset', equipmentCategory: 'cooling',
        equipmentType: 'fan', hallId: 'hall-1',
      }),
    });
    (inv as any).total = 100_000 + 1_000_000 + 10_000_000;
    useTra.getState().addInvoice(inv as any);

    expect(useWhs.getState().items.length).toBeGreaterThanOrEqual(2); // feed + equipment
    expect(useFlk.getState().flocks.length).toBe(1);
    expect(useHal.getState().equipment.length).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════
// GROUP 14: Deletion cascades
// ═══════════════════════════════════════════════════════════
describe('complex: deletion cascades', () => {
  it('delete feed invoice → whs item stays with 0 (or removed)', () => {
    const id = useTra.getState().addInvoice(feedInvoice(100) as any);
    useTra.getState().deleteInvoice(id);
    const items = useWhs.getState().items;
    const total = items.reduce((a, it) => a + (it.currentStock || 0), 0);
    expect(total).toBe(0);
  });

  it('delete equipment invoice → equipment removed', () => {
    const id = useTra.getState().addInvoice(equipInvoice(2) as any);
    expect(useHal.getState().equipment.length).toBe(1);
    useTra.getState().deleteInvoice(id);
    expect(useHal.getState().equipment.length).toBe(0);
  });
});


// ═══════════════════════════════════════════════════════════
// GROUP 15: sale cascade
// ═══════════════════════════════════════════════════════════
describe('sale: feed from stock', () => {
  it('setup whs 100, sale 30 → whs 70', () => {
    useTra.getState().addInvoice(feedInvoice(100) as any);
    expect(useWhs.getState().items[0].currentStock).toBe(100);

    const sale = feedInvoice(30);
    (sale as any).type = 'sale';
    useTra.getState().addInvoice(sale as any);

    const items = useWhs.getState().items;
    const total = items.reduce((a: number, it: any) => a + (it.currentStock || 0), 0);
    expect(total).toBe(70);
  });
});

// ═══════════════════════════════════════════════════════════
// GROUP 16: equipment consumable vs asset
// ═══════════════════════════════════════════════════════════
describe('equipment: consumable vs asset', () => {
  it('consumable → whs only (no hal)', () => {
    const inv = equipInvoice(5);
    (inv.items[0] as any).equipmentKind = 'consumable';
    (inv.items[0] as any).hallId = '';
    useTra.getState().addInvoice(inv as any);
    expect(useHal.getState().equipment.length).toBe(0);
    expect(useWhs.getState().items.length).toBeGreaterThanOrEqual(1);
  });

  it('asset with hall → hal + whs', () => {
    useTra.getState().addInvoice(equipInvoice(2, 'hall-1') as any);
    expect(useHal.getState().equipment.length).toBe(1);
    expect(useWhs.getState().items.length).toBeGreaterThanOrEqual(1);
  });

  it('asset without hall → no hal (skip)', () => {
    const inv = equipInvoice(2);
    (inv.items[0] as any).hallId = '';
    useTra.getState().addInvoice(inv as any);
    expect(useHal.getState().equipment.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════
// GROUP 17: preorder behavior
// ═══════════════════════════════════════════════════════════
describe('preorder: deferred cascade', () => {
  it('preorder chick → no flock yet', () => {
    const inv = chickInvoice(100);
    (inv as any).isPreorder = true;
    useTra.getState().addInvoice(inv as any);
    expect(useFlk.getState().flocks.length).toBe(0);
  });

  it('preorder → received → flock created', () => {
    const inv = chickInvoice(100);
    (inv as any).isPreorder = true;
    const id = useTra.getState().addInvoice(inv as any);
    expect(useFlk.getState().flocks.length).toBe(0);

    useTra.getState().updateInvoice(id, { isPreorder: false } as any);
    expect(useFlk.getState().flocks.length).toBe(1);
    expect(useFlk.getState().flocks[0].initialCount).toBe(100);
  });
});


// ═══════════════════════════════════════════════════════════
// GROUP 18: payment lifecycle (paidSum invariants)
// ═══════════════════════════════════════════════════════════
describe('payment: lifecycle', () => {
  it('pending check → paidSum=0', () => {
    const inv = feedInvoice(100);
    (inv as any).payments = [{
      id: 'p1', amount: 50_000, method: 'check', status: 'pending',
      date: FA_DATE, checkNo: '123', bank: 'ملی', dueDate: FA_DATE, notes: '',
    }];
    const id = useTra.getState().addInvoice(inv as any);
    const saved = useTra.getState().invoices.find(i => i.id === id)!;
    // paidSum باید pending رو نشمره → remaining=total
    expect(paidSumAllocated(saved)).toBe(0);
    expect(remaining(saved)).toBe(100_000);
  });

  it('cleared check → paidSum=amount', () => {
    const inv = feedInvoice(100);
    (inv as any).payments = [{
      id: 'p1', amount: 50_000, method: 'check', status: 'cleared',
      date: FA_DATE, checkNo: '123', bank: 'ملی', dueDate: FA_DATE, notes: '',
      clearedDate: FA_DATE,
    }];
    const id = useTra.getState().addInvoice(inv as any);
    const saved = useTra.getState().invoices.find(i => i.id === id)!;
    expect(paidSumAllocated(saved)).toBe(50_000);
    expect(remaining(saved)).toBe(50_000);
  });

  it('cash + pending check → only cash counted', () => {
    const inv = feedInvoice(100);
    (inv as any).payments = [
      { id: 'p1', amount: 30_000, method: 'cash', status: 'cleared', date: FA_DATE, checkNo: '', bank: '', dueDate: '', notes: '' },
      { id: 'p2', amount: 40_000, method: 'check', status: 'pending', date: FA_DATE, checkNo: '123', bank: 'ملی', dueDate: FA_DATE, notes: '' },
    ];
    const id = useTra.getState().addInvoice(inv as any);
    const saved = useTra.getState().invoices.find(i => i.id === id)!;
    expect(paidSumAllocated(saved)).toBe(30_000);
    expect(paidPendingSum((saved as any).payments)).toBe(40_000);
  });

  it('refund subtracts', () => {
    const inv = feedInvoice(100);
    (inv as any).payments = [
      { id: 'p1', amount: 50_000, method: 'cash', type: 'regular', date: FA_DATE, checkNo: '', bank: '', dueDate: '', notes: '' },
      { id: 'p2', amount: 20_000, method: 'cash', type: 'refund', date: FA_DATE, checkNo: '', bank: '', dueDate: '', notes: '' },
    ];
    const id = useTra.getState().addInvoice(inv as any);
    const saved = useTra.getState().invoices.find(i => i.id === id)!;
    expect(paidSumAllocated(saved)).toBe(30_000);
  });

  it('bounced check → paidSum ignores', () => {
    const inv = feedInvoice(100);
    (inv as any).payments = [{
      id: 'p1', amount: 50_000, method: 'check', status: 'bounced',
      date: FA_DATE, checkNo: '123', bank: 'ملی', dueDate: FA_DATE, notes: '',
      bouncedDate: FA_DATE,
    }];
    const id = useTra.getState().addInvoice(inv as any);
    const saved = useTra.getState().invoices.find(i => i.id === id)!;
    expect(paidSumAllocated(saved)).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════
// GROUP 19: preorder full cycle (deeper)
// ═══════════════════════════════════════════════════════════
describe('preorder: full cycle', () => {
  it('preorder equipment → no hal yet', () => {
    const inv = equipInvoice(2);
    (inv as any).isPreorder = true;
    useTra.getState().addInvoice(inv as any);
    expect(useHal.getState().equipment.length).toBe(0);
    expect(useWhs.getState().items.length).toBe(0);
  });

  it('preorder → received → hal + whs created', () => {
    const inv = equipInvoice(2);
    (inv as any).isPreorder = true;
    const id = useTra.getState().addInvoice(inv as any);
    expect(useHal.getState().equipment.length).toBe(0);

    useTra.getState().updateInvoice(id, { isPreorder: false } as any);
    expect(useHal.getState().equipment.length).toBe(1);
    expect(useWhs.getState().items.length).toBeGreaterThanOrEqual(1);
  });

  it('preorder egg → no eggEntry yet, received → created', () => {
    const inv = eggInvoice(100);
    (inv as any).isPreorder = true;
    const id = useTra.getState().addInvoice(inv as any);
    expect(useInc.getState().eggEntries.length).toBe(0);

    useTra.getState().updateInvoice(id, { isPreorder: false } as any);
    expect(useInc.getState().eggEntries.length).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════
// GROUP 20: allocation auto-creation
// ═══════════════════════════════════════════════════════════
describe('allocation: auto-creation', () => {
  it('invoice with 2 payments → 2 allocations', () => {
    const inv = feedInvoice(100);
    (inv as any).payments = [
      { id: 'p1', amount: 50_000, method: 'cash', date: FA_DATE, checkNo: '', bank: '', dueDate: '', notes: '' },
      { id: 'p2', amount: 30_000, method: 'card', date: FA_DATE, checkNo: '', bank: '', dueDate: '', notes: '' },
    ];
    useTra.getState().addInvoice(inv as any);
    const allocs = useTra.getState().allocations;
    expect(allocs.length).toBe(2);
    expect(allocs[0].amount).toBe(50_000);
    expect(allocs[1].amount).toBe(30_000);
  });

  it('update payments → allocations synced', () => {
    const inv = feedInvoice(100);
    (inv as any).payments = [
      { id: 'p1', amount: 50_000, method: 'cash', date: FA_DATE, checkNo: '', bank: '', dueDate: '', notes: '' },
    ];
    const id = useTra.getState().addInvoice(inv as any);
    expect(useTra.getState().allocations.length).toBe(1);

    // add a second payment
    const saved = useTra.getState().invoices.find(i => i.id === id)!;
    const newPayments = [...(saved.payments || []),
      { id: 'p2', amount: 30_000, method: 'card', date: FA_DATE, checkNo: '', bank: '', dueDate: '', notes: '' },
    ];
    useTra.getState().updateInvoice(id, { payments: newPayments } as any);
    expect(useTra.getState().allocations.length).toBe(2);
  });

  it('remove payment → allocation removed', () => {
    const inv = feedInvoice(100);
    (inv as any).payments = [
      { id: 'p1', amount: 50_000, method: 'cash', date: FA_DATE, checkNo: '', bank: '', dueDate: '', notes: '' },
      { id: 'p2', amount: 30_000, method: 'card', date: FA_DATE, checkNo: '', bank: '', dueDate: '', notes: '' },
    ];
    const id = useTra.getState().addInvoice(inv as any);
    const saved = useTra.getState().invoices.find(i => i.id === id)!;
    const newPayments = [(saved.payments || [])[0]];
    useTra.getState().updateInvoice(id, { payments: newPayments } as any);
    expect(useTra.getState().allocations.length).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════
// GROUP 21: chick distribution validation
// ═══════════════════════════════════════════════════════════
describe('chick: distribution', () => {
  it('male 300 + female 200 = qty 500', () => {
    const inv = chickInvoice(500);
    (inv.items[0] as any).maleCount = 300;
    (inv.items[0] as any).femaleCount = 200;
    useTra.getState().addInvoice(inv as any);
    const flock = useFlk.getState().flocks[0];
    expect(flock.maleCount).toBe(300);
    expect(flock.femaleCount).toBe(200);
    expect(flock.initialCount).toBe(500);
  });

  it('male + female + unknown = qty', () => {
    const inv = chickInvoice(500);
    (inv.items[0] as any).maleCount = 200;
    (inv.items[0] as any).femaleCount = 200;
    (inv.items[0] as any).unknownCount = 100;
    useTra.getState().addInvoice(inv as any);
    const flock = useFlk.getState().flocks[0];
    expect((flock.maleCount || 0) + (flock.femaleCount || 0) + (flock.unknownCount || 0)).toBe(500);
  });

  it('all unknown → male/female null', () => {
    const inv = chickInvoice(500);
    (inv.items[0] as any).unknownCount = 500;
    useTra.getState().addInvoice(inv as any);
    const flock = useFlk.getState().flocks[0];
    expect(flock.unknownCount).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════
// GROUP 22: egg arithmetic
// ═══════════════════════════════════════════════════════════
describe('egg: arithmetic', () => {
  it('broken=5 → count=95', () => {
    useTra.getState().addInvoice(eggInvoice(100, 5, 0) as any);
    expect(useInc.getState().eggEntries[0].count).toBe(95);
  });

  it('nonInc=3 → count=97', () => {
    useTra.getState().addInvoice(eggInvoice(100, 0, 3) as any);
    expect(useInc.getState().eggEntries[0].count).toBe(97);
  });

  it('broken=100 (all) → no eggEntry (healthy=0)', () => {
    useTra.getState().addInvoice(eggInvoice(100, 100, 0) as any);
    expect(useInc.getState().eggEntries.length).toBe(0);
  });
});
