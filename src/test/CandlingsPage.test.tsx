import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderWithRouter } from './helpers';
import CandlingsPage from '../mod/inc/CandlingsPage';
import { useInc } from '../mod/inc/store';

vi.mock('../cor/store/dialog', () => ({
  showConfirmAsync: vi.fn().mockResolvedValue(true),
  showAlert: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../cor/store/toast', () => ({
  showToast: vi.fn(),
  toastMsg: {
    added: vi.fn(), saved: vi.fn(), updated: vi.fn(),
    deleted: vi.fn(), deletedBulk: vi.fn(),
    archived: vi.fn(), archivedBulk: vi.fn(),
    restored: vi.fn(), restoredBulk: vi.fn(),
    hidden: vi.fn(), visible: vi.fn(),
    paused: vi.fn(), activated: vi.fn(),
    error: vi.fn(), warn: vi.fn(), info: vi.fn(),
  },
}));
vi.mock('../cor/logger/auditLog', () => ({ logAction: vi.fn() }));

beforeEach(() => {
  useInc.setState({ devices: [], eggEntries: [], candlings: [], hatchGroups: [], hatchResults: [] } as any);
  vi.clearAllMocks();
});

describe('CandlingsPage', () => {
  it('رندر بدون خطا', () => {
    const { container } = renderWithRouter(<CandlingsPage />);
    expect(container).toBeTruthy();
  });
});
