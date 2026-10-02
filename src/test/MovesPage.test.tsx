import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRouter } from './helpers';
import MovesPage from '../mod/whs/MovesPage';
import { useWhs } from '../mod/whs/store';
import { useCtc } from '../mod/ctc/store';

vi.mock('../cor/store/dialog', () => ({
  showConfirmAsync: vi.fn().mockResolvedValue(true),
  showAlert: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../cor/store/toast', () => ({ showToast: vi.fn() }));
vi.mock('../cor/logger/auditLog', () => ({ logAction: vi.fn() }));

beforeEach(() => {
  useWhs.setState({ items: [], movements: [] } as any);
  useCtc.setState({ contacts: [] } as any);
  vi.clearAllMocks();
});

describe('MovesPage', () => {
  it('رندر بدون خطا', () => {
    const { container } = renderWithRouter(<MovesPage />);
    expect(container).toBeTruthy();
  });

  it('دکمه ثبت گردش وجود داره', () => {
    renderWithRouter(<MovesPage />);
    expect(screen.getAllByText(/ثبت گردش|افزودن/).length).toBeGreaterThan(0);
  });
});
