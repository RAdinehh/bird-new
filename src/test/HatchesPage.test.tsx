import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderWithRouter } from './helpers';
import HatchesPage from '../mod/inc/HatchesPage';
import { useInc } from '../mod/inc/store';

vi.mock('../cor/store/dialog', () => ({
  showConfirmAsync: vi.fn().mockResolvedValue(true),
  showAlert: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../cor/store/toast', () => ({ showToast: vi.fn() }));
vi.mock('../cor/logger/auditLog', () => ({ logAction: vi.fn() }));

beforeEach(() => {
  useInc.setState({ devices: [], eggEntries: [], candlings: [], hatchGroups: [], hatchResults: [] } as any);
  vi.clearAllMocks();
});

describe('HatchesPage', () => {
  it('رندر بدون خطا', () => {
    const { container } = renderWithRouter(<HatchesPage />);
    expect(container).toBeTruthy();
  });
});
