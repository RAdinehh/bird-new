import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRouter } from './helpers';
import FlocksPage from '../mod/flk/FlocksPage';
import { useFlk } from '../mod/flk/store';
import { useBrd } from '../mod/brd/store';
import { useHal } from '../mod/hal/store';

vi.mock('../cor/store/dialog', () => ({
  showConfirmAsync: vi.fn().mockResolvedValue(true),
  showAlert: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../cor/store/toast', () => ({ showToast: vi.fn() }));
vi.mock('../cor/logger/auditLog', () => ({ logAction: vi.fn() }));

const makeFlock = (o: any = {}) => ({
  id: 'f-' + Math.random().toString(36).slice(2, 9),
  name: 'گله ۱', type: 'layer', status: 'active',
  birdId: 'b1', breedId: 'br1', hallId: '', zoneId: '',
  initialCount: 1000, currentCount: 1000,
  maleCount: null, femaleCount: null,
  layingStartDay: 140, vaccineScheduleId: '',
  hatchDate: '', purchaseDate: '', startDate: '1405/01/01', endDate: '',
  source: '', purchasePrice: 0, deliveryCost: 0, otherCosts: 0,
  notes: '',
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  ...o,
});

beforeEach(() => {
  useFlk.setState({ flocks: [] });
  useBrd.setState({ birds: [], breeds: [] });
  useHal.setState({ halls: [], zones: [], equipment: [] } as any);
  vi.clearAllMocks();
});

describe('FlocksPage — خالی', () => {
  it('رندر میشه بدون خطا', () => {
    const { container } = renderWithRouter(<FlocksPage />);
    expect(container).toBeTruthy();
  });
});

describe('FlocksPage — تب‌ها', () => {
  it('تب‌ها وجود دارن', () => {
    renderWithRouter(<FlocksPage />);
    // معمولاً همه، فعال، بایگانی
    expect(screen.getAllByText(/همه|فعال|بایگانی/).length).toBeGreaterThan(0);
  });
});

describe('FlocksPage — نمایش لیست', () => {
  it('گله‌های فعال دیده میشن', () => {
    useFlk.setState({ flocks: [makeFlock({ name: 'گله A' })] });
    renderWithRouter(<FlocksPage />);
    expect(screen.getByText('گله A')).toBeInTheDocument();
  });

  it('گله بایگانی پیش‌فرض پنهانه', () => {
    useFlk.setState({
      flocks: [makeFlock({ name: 'بایگانی', status: 'archived' })]
    });
    renderWithRouter(<FlocksPage />);
    // در تب all یا active، گله بایگانی دیده نمیشه
    expect(screen.queryByText('بایگانی')).not.toBeInTheDocument();
  });
});

describe('FlocksPage — افزودن', () => {
  it('دکمه افزودن دیده میشه وقتی خالیه', () => {
    renderWithRouter(<FlocksPage />);
    expect(screen.getByText(/افزودن گله/)).toBeInTheDocument();
  });
});
