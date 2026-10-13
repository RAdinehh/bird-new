import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRouter } from './helpers';
import { useFlk } from '../mod/flk/store';
import ZonesPage from '../mod/hal/ZonesPage';
import { useHal } from '../mod/hal/store';

const mockConfirm = vi.fn().mockResolvedValue(true);
vi.mock('../cor/store/dialog', () => ({
  showConfirmAsync: (...args: any[]) => mockConfirm(...args),
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
  useHal.setState({ halls: [], zones: [], equipment: [] } as any);
  useFlk.setState({ flocks: [] } as any);
  mockConfirm.mockClear();
  vi.clearAllMocks();
});

describe('ZonesPage', () => {
  it('رندر بدون خطا', () => {
    const { container } = renderWithRouter(<ZonesPage />);
    expect(container).toBeTruthy();
  });
});

describe('ZonesPage — خالی (بدون سالن)', () => {
  it('پیام «اول یک سالن بسازید» دیده می‌شه', () => {
    renderWithRouter(<ZonesPage />);
    expect(screen.getByText(/اول یک سالن بسازید/)).toBeInTheDocument();
  });
});

describe('ZonesPage — با سالن', () => {
  it('پیام empty راهنما نمایش داده نمی‌شه', () => {
    useHal.setState({
      halls: [{ id: 'h1', name: 'سالن A' }],
      zones: [], equipment: [],
    } as any);
    renderWithRouter(<ZonesPage />);
    expect(screen.queryByText(/اول یک سالن بسازید/)).not.toBeInTheDocument();
  });
});

describe('ZonesPage — نمایش لیست بخش‌ها', () => {
  it('اسم بخش دیده می‌شه', () => {
    useHal.setState({
      halls: [{ id: 'h1', name: 'سالن A' }],
      zones: [{
        id: 'z1', hallId: 'h1', name: 'بخش شمالی',
        capacity: 100, notes: '', createdAt: '', updatedAt: '',
      }],
      equipment: [],
    } as any);
    renderWithRouter(<ZonesPage />);
    expect(screen.getAllByText('بخش شمالی').length).toBeGreaterThan(0);
  });
});

describe('hal/store — cascade تجهیزات (Fix 1)', () => {
  it('حذف بخش → zoneId تجهیزات پاک می‌شه', () => {
    useHal.setState({
      halls: [],
      zones: [{
        id: 'z1', hallId: 'h1', name: 'بخش',
        capacity: null, notes: '', createdAt: '', updatedAt: '',
      }],
      equipment: [
        { id: 'e1', hallId: 'h1', zoneId: 'z1', name: 'فن',
          category: 'ventilation', type: '', unit: 'pcs',
          count: 1, notes: '', createdAt: '', updatedAt: '' } as any,
        { id: 'e2', hallId: 'h1', zoneId: 'z1', name: 'هیتر',
          category: 'heating', type: '', unit: 'pcs',
          count: 1, notes: '', createdAt: '', updatedAt: '' } as any,
      ],
    } as any);

    useHal.getState().deleteZone('z1');

    const equipment = useHal.getState().equipment;
    expect(equipment[0].zoneId).toBe('');
    expect(equipment[1].zoneId).toBe('');
    expect(useHal.getState().zones.length).toBe(0);
  });
});

