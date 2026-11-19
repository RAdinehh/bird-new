import { describe, it, expect } from 'vitest';
import { splitInvoicesForArchive } from '../mod/tra/archivePolicy';
import type { Invoice } from '../mod/tra/types';

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: overrides.id ?? 'inv-1',
    type: overrides.type ?? 'sale',
    number: 'S140401001',
    date: '2025-01-10',
    partyId: 'party-1',
    category: 'egg',
    items: [],
    total: 100000,
    payments: [],
    dueDate: '2025-01-20',
    relatedFlockId: '',
    relatedEntryId: '',
    notes: '',
    createdAt: '2025-01-10T00:00:00.000Z',
    updatedAt: '2025-01-10T00:00:00.000Z',
    workflowStatus: 'paid',
    paidAt: '2025-01-12T00:00:00.000Z',
    ...overrides,
  };
}

describe('tra archivePolicy', () => {
  it('keeps unsettled, disputed, or pending-check invoices and archives settled invoices before cutoffIso', () => {
    const invoices: Invoice[] = [
      makeInvoice({ id: 'old-settled', paidAt: '2025-01-05T00:00:00.000Z', date: '2025-01-04' }),
      makeInvoice({ id: 'unsettled', paidAt: '', workflowStatus: 'confirmed', date: '2025-01-02' }),
      makeInvoice({ id: 'disputed', disputeStatus: 'open', date: '2025-01-02' }),
      makeInvoice({
        id: 'bounced-check',
        date: '2025-01-02',
        payments: [
          {
            id: 'p1',
            date: '2025-01-02',
            amount: 100000,
            method: 'check',
            checkNo: '123',
            bank: 'mellat',
            dueDate: '2025-01-05',
            notes: '',
            status: 'bounced',
          },
        ],
      }),
      makeInvoice({ id: 'after-cutoff', paidAt: '2025-02-01T00:00:00.000Z', date: '2025-02-01' }),
    ];

    const res = splitInvoicesForArchive(invoices, { cutoffIso: '2025-01-15T00:00:00.000Z' });
    expect(res.toArchive.map(i => i.id)).toEqual(['old-settled']);
    expect(res.keep.map(i => i.id)).toEqual([
      'unsettled',
      'disputed',
      'bounced-check',
      'after-cutoff',
    ]);
  });
});
