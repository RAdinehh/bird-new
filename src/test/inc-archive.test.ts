import { describe, it, expect } from 'vitest';
import { splitIncEntriesForArchive } from '../mod/inc/archivePolicy';
import type { EggEntry } from '../mod/inc/store';

function makeEntry(overrides: Partial<EggEntry> = {}): EggEntry {
  return {
    id: overrides.id ?? 'inc-1',
    deviceId: 'dev-1',
    hatchGroupId: 'grp-1',
    birdId: 'bird-1',
    breedId: 'breed-1',
    count: 1000,
    entryDate: '2025-01-01',
    expectedHatchDate: '2025-01-22',
    source: 'own',
    dealType: 'own',
    dealStatus: 'active',
    dealWithdrawnAt: '',
    dealWithdrawnReason: '',
    dealData: {},
    trayNumbers: '1-10',
    unitPrice: 10000,
    totalPrice: 10000000,
    shippingCost: 0,
    status: 'done',
    generatedInvoiceId: '',
    notes: '',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-22T00:00:00.000Z',
    ...overrides,
  };
}

describe('inc archivePolicy', () => {
  it('keeps active entries and archives completed/failed entries up to cutoffIso', () => {
    const entries: EggEntry[] = [
      makeEntry({ id: 'old-done', status: 'done', expectedHatchDate: '2025-01-10' }),
      makeEntry({ id: 'old-failed', status: 'failed', expectedHatchDate: '2025-01-12' }),
      makeEntry({ id: 'still-incubating', status: 'incubating', expectedHatchDate: '2025-01-05' }),
      makeEntry({ id: 'still-locked', status: 'locked', expectedHatchDate: '2025-01-05' }),
      makeEntry({ id: 'after-cutoff', status: 'hatched', expectedHatchDate: '2025-02-05' }),
    ];

    const res = splitIncEntriesForArchive(entries, { cutoffIso: '2025-01-20' });
    expect(res.toArchive.map(e => e.id)).toEqual(['old-done', 'old-failed']);
    expect(res.keep.map(e => e.id)).toEqual(['still-incubating', 'still-locked', 'after-cutoff']);
  });
});
