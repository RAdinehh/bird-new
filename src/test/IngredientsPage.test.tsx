import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRouter } from './helpers';
import IngredientsPage from '../mod/fed/IngredientsPage';
import { useFed } from '../mod/fed/store';

vi.mock('../cor/store/dialog', () => ({
  showConfirmAsync: vi.fn().mockResolvedValue(true),
  showAlert: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../cor/store/toast', () => ({ showToast: vi.fn() }));
vi.mock('../cor/logger/auditLog', () => ({ logAction: vi.fn() }));

const makeIng = (o: any = {}) => ({
  id: 'ing-' + Math.random().toString(36).slice(2, 9),
  name: 'آیتم', category: 'energy',
  protein: 8.5, energy: 3350, fat: 4, fiber: 2,
  calcium: 0.02, phosphorus: 0.3, methionine: 0.15, lysine: 0.25,
  price: 15000, maxPercent: 0, minPercent: 0,
  isHidden: false, stockItemId: '',
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  ...o,
});

beforeEach(() => {
  useFed.setState({ ingredients: [], requirements: [], formulas: [] } as any);
  vi.clearAllMocks();
});

describe('IngredientsPage', () => {
  it('رندر بدون خطا', () => {
    const { container } = renderWithRouter(<IngredientsPage />);
    expect(container).toBeTruthy();
  });

  it('دکمه افزودن وجود داره', () => {
    renderWithRouter(<IngredientsPage />);
    expect(screen.getAllByText(/افزودن ماده/).length).toBeGreaterThan(0);
  });

  it('با ماده → رندر بدون خطا', () => {
    useFed.setState({ ingredients: [makeIng()] } as any);
    const { container } = renderWithRouter(<IngredientsPage />);
    expect(container).toBeTruthy();
  });

  it('کلیک افزودن → Modal باز', async () => {
    renderWithRouter(<IngredientsPage />);
    fireEvent.click(screen.getAllByText(/افزودن ماده/)[0]);
    await waitFor(() => {
      expect(screen.getByText('لغو')).toBeInTheDocument();
    });
  });

  it('مواد مخفی پیش‌فرض دیده نمیشن', () => {
    useFed.setState({
      ingredients: [makeIng({ name: 'مخفی-تست', isHidden: true })] as any
    });
    renderWithRouter(<IngredientsPage />);
    expect(screen.queryByText('مخفی-تست')).not.toBeInTheDocument();
  });

  it('مواد غیرمخفی دیده میشن', () => {
    useFed.setState({ ingredients: [makeIng({ name: 'نمایان-تست' })] } as any);
    renderWithRouter(<IngredientsPage />);
    expect(screen.getByText('نمایان-تست')).toBeInTheDocument();
  });
});
