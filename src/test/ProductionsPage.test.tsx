import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductionsPage from '../mod/egg/ProductionsPage';
import { useEgg } from '../mod/egg/store';
import { useFlk } from '../mod/flk/store';

vi.mock('../cor/store/dialog', () => ({
  showConfirmAsync: vi.fn().mockResolvedValue(true),
  showAlert: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../cor/store/toast', () => ({ showToast: vi.fn() }));
vi.mock('../cor/logger/auditLog', () => ({ logAction: vi.fn() }));

beforeEach(() => {
  useEgg.setState({ productions: [], stocks: [], sales: [] } as any);
  useFlk.setState({ flocks: [] });
  vi.clearAllMocks();
});

describe('ProductionsPage', () => {
  it('رندر بدون خطا (خالی)', () => {
    const { container } = render(<ProductionsPage />);
    expect(container).toBeTruthy();
  });

  it('رندر با تولید', () => {
    useEgg.setState({
      productions: [{
        id: 'p1', date: '1405/07/09', flockId: 'f1',
        totalCount: 100, brokenCount: 0, softCount: 0, dirtyCount: 0,
      }] as any,
    });
    const { container } = render(<ProductionsPage />);
    expect(container).toBeTruthy();
  });
});
