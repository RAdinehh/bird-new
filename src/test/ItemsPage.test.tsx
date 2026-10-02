import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRouter } from './helpers';
import ItemsPage from '../mod/whs/ItemsPage';
import { useWhs } from '../mod/whs/store';
import { useCtc } from '../mod/ctc/store';

vi.mock('../cor/store/dialog', () => ({
  showConfirmAsync: vi.fn().mockResolvedValue(true),
  showAlert: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../cor/store/toast', () => ({ showToast: vi.fn() }));
vi.mock('../cor/logger/auditLog', () => ({ logAction: vi.fn() }));

const makeItem = (o: any = {}) => ({
  id: 'i-' + Math.random().toString(36).slice(2, 9),
  name: 'آیتم ۱', category: 'feed', unit: 'kg',
  currentStock: 100, minStock: 20, lastPrice: 1000, expireDate: '',
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  ...o,
});

beforeEach(() => {
  useWhs.setState({ items: [], movements: [] } as any);
  useCtc.setState({ contacts: [] } as any);
  vi.clearAllMocks();
});

describe('ItemsPage', () => {
  it('بدون خطا رندر میشه (خالی)', () => {
    const { container } = renderWithRouter(<ItemsPage />);
    expect(container).toBeTruthy();
  });

  it('دکمه افزودن وجود داره', () => {
    renderWithRouter(<ItemsPage />);
    expect(screen.getAllByText(/افزودن قلم/).length).toBeGreaterThan(0);
  });

  it('با آیتم → بدون خطا', () => {
    useWhs.setState({ items: [makeItem()] } as any);
    const { container } = renderWithRouter(<ItemsPage />);
    expect(container).toBeTruthy();
  });

  it('کلیک افزودن → Modal باز میشه', async () => {
    renderWithRouter(<ItemsPage />);
    const addBtns = screen.getAllByText(/\+ افزودن قلم/);
    fireEvent.click(addBtns[0]);
    await waitFor(() => {
      expect(screen.getByText('لغو')).toBeInTheDocument();
    });
  });

  it('لغو → Modal بسته میشه', async () => {
    renderWithRouter(<ItemsPage />);
    fireEvent.click(screen.getAllByText(/\+ افزودن قلم/)[0]);
    await waitFor(() => expect(screen.getByText('لغو')).toBeInTheDocument());
    fireEvent.click(screen.getByText('لغو'));
    await waitFor(() => {
      expect(screen.queryByText('لغو')).not.toBeInTheDocument();
    });
  });
});
