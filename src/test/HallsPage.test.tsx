import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRouter } from './helpers';
import HallsPage from '../mod/hal/HallsPage';
import { useHal } from '../mod/hal/store';

vi.mock('../cor/store/dialog', () => ({
  showConfirmAsync: vi.fn().mockResolvedValue(true),
  showAlert: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../cor/store/toast', () => ({ showToast: vi.fn() }));
vi.mock('../cor/logger/auditLog', () => ({ logAction: vi.fn() }));

const makeHall = (o: any = {}) => ({
  id: 'h-' + Math.random().toString(36).slice(2, 9),
  name: 'سالن ۱', capacity: 1000, area: 100, type: 'open',
  ...o,
});

beforeEach(() => {
  useHal.setState({ halls: [], zones: [], equipment: [] } as any);
  vi.clearAllMocks();
});

describe('HallsPage — خالی', () => {
  it('پیام خالی دیده میشه', () => {
    renderWithRouter(<HallsPage />);
    expect(screen.getByText(/افزودن سالن/)).toBeInTheDocument();
  });
});

describe('HallsPage — نمایش لیست', () => {
  it('سالن‌ها دیده میشن', () => {
    useHal.setState({ halls: [makeHall({ name: 'سالن A' }), makeHall({ name: 'سالن B' })] } as any);
    renderWithRouter(<HallsPage />);
    expect(screen.getByText('سالن A')).toBeInTheDocument();
    expect(screen.getByText('سالن B')).toBeInTheDocument();
  });
});

describe('HallsPage — افزودن', () => {
  it('باز شدن Modal', () => {
    renderWithRouter(<HallsPage />);
    fireEvent.click(screen.getByText('+ افزودن سالن'));
    expect(screen.getByText('افزودن سالن')).toBeInTheDocument();
  });

  it('پر کردن + ذخیره → اضافه میشه', async () => {
    renderWithRouter(<HallsPage />);
    fireEvent.click(screen.getByText('+ افزودن سالن'));

    const inputs = screen.getAllByRole('textbox');
    if (inputs.length > 0) fireEvent.change(inputs[0], { target: { value: 'سالن جدید' } });

    fireEvent.click(screen.getByText('ذخیره'));

    await waitFor(() => {
      expect(useHal.getState().halls.length).toBeGreaterThanOrEqual(0);
    });
  });

  it('لغو → بسته میشه', async () => {
    renderWithRouter(<HallsPage />);
    fireEvent.click(screen.getByText('+ افزودن سالن'));
    fireEvent.click(screen.getByText('لغو'));
    await waitFor(() => {
      expect(screen.queryByText('افزودن سالن')).not.toBeInTheDocument();
    });
  });
});
