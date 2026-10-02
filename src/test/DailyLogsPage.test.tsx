import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderWithRouter } from './helpers';
import DailyLogsPage from '../mod/dlg/DailyLogsPage';
import { useDlg } from '../mod/dlg/store';
import { useFlk } from '../mod/flk/store';
import { useBrd } from '../mod/brd/store';

vi.mock('../cor/store/dialog', () => ({
  showConfirmAsync: vi.fn().mockResolvedValue(true),
  showAlert: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../cor/store/toast', () => ({ showToast: vi.fn() }));
vi.mock('../cor/logger/auditLog', () => ({ logAction: vi.fn() }));

beforeEach(() => {
  useDlg.setState({ logs: [] } as any);
  useFlk.setState({ flocks: [] });
  useBrd.setState({ birds: [], breeds: [] });
  vi.clearAllMocks();
});

describe('DailyLogsPage', () => {
  it('رندر بدون خطا', () => {
    const { container } = renderWithRouter(<DailyLogsPage />);
    expect(container).toBeTruthy();
  });
});
