/**
 * traStore atomic — allocations باید در snapshot/restore باشد
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useTra } from '../mod/tra/store';
import { traStore } from '../cor/atomic';

describe('traStore atomic — allocations', () => {
  beforeEach(() => {
    useTra.setState({
      invoices: [],
      settlements: [],
      deals: [],
      allocations: [{ id: 'a1', invoiceId: 'inv1', amount: 1000 }],
    } as any);
  });

  it('snapshot شامل allocations', () => {
    const snap = traStore.getSnapshot() as any;
    expect(snap).toHaveProperty('allocations');
    expect(snap.allocations).toHaveLength(1);
    expect(snap.allocations[0].id).toBe('a1');
  });

  it('restore allocations را برمی‌گرداند', () => {
    const snap = traStore.getSnapshot() as any;
    useTra.setState({ allocations: [] } as any);
    expect(useTra.getState().allocations).toHaveLength(0);

    traStore.restore(snap);
    expect(useTra.getState().allocations).toHaveLength(1);
    expect(useTra.getState().allocations[0].id).toBe('a1');
  });
});
