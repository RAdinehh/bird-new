import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderWithRouter } from './helpers';
import CandlingsPage from '../mod/inc/CandlingsPage';
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

describe('CandlingsPage', () => {
  it('رندر بدون خطا', () => {
    const { container } = renderWithRouter(<CandlingsPage />);
    expect(container).toBeTruthy();
  });
});
