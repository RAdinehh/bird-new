import { describe, it, expect, beforeEach, vi } from 'vitest';

const {
  archiveStoreData,
  mockExportArchiveRecords,
  mockImportArchiveRecords,
  mockClearArchive,
  mockCountArchived,
} = vi.hoisted(() => {
  const storeData = new Map<string, any[]>();
  return {
    archiveStoreData: storeData,
    mockExportArchiveRecords: vi.fn(async (storeName: string) => storeData.get(storeName) ?? []),
    mockImportArchiveRecords: vi.fn(
      async (records: any[], _mode: 'replace' | 'merge', storeName: string) => {
        storeData.set(storeName, [...records]);
        return records.length;
      }
    ),
    mockClearArchive: vi.fn(async (storeName: string) => {
      storeData.set(storeName, []);
    }),
    mockCountArchived: vi.fn(async (storeName: string) => (storeData.get(storeName) ?? []).length),
  };
});

vi.mock('../cor/storage/historyArchive', () => ({
      listFlockSummaries: vi.fn().mockResolvedValue([]),
      saveFlockSummary: vi.fn().mockResolvedValue(undefined),
      deleteFlockSummary: vi.fn().mockResolvedValue(undefined),
      getFlockSummary: vi.fn().mockResolvedValue(null),
  ARCHIVE_STORES: {
    dlg: 'dlg_logs',
    tra: 'tra_invoices',
    flk: 'flk_closed',
    whs: 'whs_moves',
    inc: 'inc_batches',
  },
  exportArchiveRecords: mockExportArchiveRecords,
  importArchiveRecords: mockImportArchiveRecords,
  clearArchive: mockClearArchive,
  countArchived: mockCountArchived,
}));

vi.mock('../cor/storage/rawStore', () => ({
  IDB_KEYS: ['pm-flk', 'pm-dlg', 'pm-whs', 'pm-tra', 'pm-inc'],
  rawGet: vi.fn(async () => null),
  rawSet: vi.fn(async () => true),
  rawRemove: vi.fn(async () => true),
}));

import * as backup from '../shr/utils/backup';
import { ARCHIVE_STORES } from '../cor/storage/historyArchive';

describe('backup', () => {
  const allStores = Object.values(ARCHIVE_STORES);

  beforeEach(() => {
    archiveStoreData.clear();
    vi.clearAllMocks();
    for (const storeName of allStores) {
      archiveStoreData.set(storeName, [
        { id: `${storeName}-rec-1`, flockId: 'flk-1', date: '1404/01/10' },
      ]);
    }
  });

  it('exports موجودن', () => {
    expect(Object.keys(backup).length).toBeGreaterThan(0);
  });

  it('exportAll همه استورهای ARCHIVE_STORES را در فایل پشتیبان قرار می‌دهد', async () => {
    const json = await backup.exportAll();
    const checked = backup.validateBackup(json);

    expect(checked.valid).toBe(true);
    for (const storeName of allStores) {
      expect(mockExportArchiveRecords).toHaveBeenCalledWith(storeName);
    }

    const archiveSection = checked.data?.data?.__archive_logs as Record<string, any[]>;
    for (const storeName of allStores) {
      expect(archiveSection[storeName]?.[0]?.id).toBe(`${storeName}-rec-1`);
    }
  });

  it('importAll در حالت replace همه استورهای ARCHIVE_STORES را پاک و بازیابی می‌کند', async () => {
    const json = await backup.exportAll();
    const checked = backup.validateBackup(json);
    expect(checked.valid).toBe(true);

    archiveStoreData.clear();
    const res = await backup.importAll(checked.data!, 'replace');
    expect(res.success).toBe(true);

    for (const storeName of allStores) {
      expect(mockClearArchive).toHaveBeenCalledWith(storeName);
      expect(mockImportArchiveRecords).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: `${storeName}-rec-1` })]),
        'replace',
        storeName
      );
    }
  });
});
