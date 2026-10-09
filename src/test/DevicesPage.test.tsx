import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import DevicesPage from '../mod/inc/DevicesPage';
import { useInc } from '../mod/inc/store';
import { useBrd } from '../mod/brd/store';

vi.mock('../cor/store/dialog', () => ({
  showConfirmAsync: vi.fn().mockResolvedValue(true),
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

const makeDevice = (o: any = {}) => ({
  id: 'd-' + Math.random().toString(36).slice(2, 9),
  name: 'دستگاه ۱', mode: 'setter', status: 'active',
  capacityByBird: [],
  racks: '', trays: '', fans: '', motorPower: '',
  tempSensors: '', humiditySensors: '',
  price: '', purchasedAt: '', warranty: '', extraCost: '',
  notes: '', maintenanceLogs: [],
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  ...o,
});

beforeEach(() => {
  useInc.setState({ devices: [], eggEntries: [], candlings: [], hatchGroups: [], hatchResults: [] } as any);
  useBrd.setState({ birds: [], breeds: [] });
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('DevicesPage', () => {
  it('رندر بدون خطا (خالی)', () => {
    const { container } = render(<DevicesPage />);
    expect(container).toBeTruthy();
  });

  it('دکمه افزودن دستگاه', () => {
    render(<DevicesPage />);
    expect(screen.getAllByText(/افزودن دستگاه/).length).toBeGreaterThan(0);
  });

  it('با دستگاه رندر میشه', () => {
    useInc.setState({ devices: [makeDevice()], eggEntries: [], candlings: [], hatchGroups: [], hatchResults: [] } as any);
    const { container } = render(<DevicesPage />);
    expect(container).toBeTruthy();
  });

  it('نام دستگاه دیده میشه', () => {
    useInc.setState({ devices: [makeDevice({ name: 'نام یکتا' })], eggEntries: [], candlings: [], hatchGroups: [], hatchResults: [] } as any);
    render(<DevicesPage />);
    expect(screen.getByText('نام یکتا')).toBeInTheDocument();
  });

  it('کلیک افزودن → Modal باز میشه', async () => {
    render(<DevicesPage />);
    fireEvent.click(screen.getAllByText(/افزودن دستگاه/)[0]);
    await waitFor(() => {
      expect(screen.getByText('لغو')).toBeInTheDocument();
    });
  });

  it('لغو → Modal بسته میشه', async () => {
    render(<DevicesPage />);
    fireEvent.click(screen.getAllByText(/افزودن دستگاه/)[0]);
    await waitFor(() => expect(screen.getByText('لغو')).toBeInTheDocument());
    fireEvent.click(screen.getByText('لغو'));
    await waitFor(() => expect(screen.queryByText('لغو')).not.toBeInTheDocument());
  });
});
