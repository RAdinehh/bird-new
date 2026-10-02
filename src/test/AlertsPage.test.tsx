import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AlertsPage from '../mod/alt/AlertsPage';
import { useAlt } from '../mod/alt/store';

vi.mock('../cor/store/dialog', () => ({
  showConfirmAsync: vi.fn().mockResolvedValue(true),
  showAlert: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../cor/store/toast', () => ({ showToast: vi.fn() }));
vi.mock('../cor/logger/auditLog', () => ({ logAction: vi.fn() }));
vi.mock('../mod/alt/rules', () => ({ runRules: vi.fn().mockReturnValue(0) }));

const makeAlert = (o: any = {}) => ({
  id: 'a-' + Math.random().toString(36).slice(2, 9),
  level: 'important', category: 'stock',
  title: 'هشدار تست', message: 'پیام',
  source: 'whs', sourceId: 'i1',
  date: '1405/07/09', status: 'active', snoozeUntil: '',
  notes: '', createdAt: new Date().toISOString(),
  ...o,
});

beforeEach(() => {
  useAlt.setState({ alerts: [] });
  vi.clearAllMocks();
});

describe('AlertsPage', () => {
  it('رندر بدون خطا (خالی)', () => {
    const { container } = render(<AlertsPage />);
    expect(container).toBeTruthy();
  });

  it('تب‌های active/history', () => {
    render(<AlertsPage />);
    expect(screen.getAllByText(/فعال|تاریخچه/).length).toBeGreaterThan(0);
  });

  it('با هشدار → رندر بدون خطا', () => {
    useAlt.setState({ alerts: [makeAlert()] });
    const { container } = render(<AlertsPage />);
    expect(container).toBeTruthy();
  });

  it('عنوان هشدار دیده میشه', () => {
    useAlt.setState({ alerts: [makeAlert({ title: 'عنوان یکتا' })] });
    render(<AlertsPage />);
    expect(screen.getByText('عنوان یکتا')).toBeInTheDocument();
  });

  it('هشدار dismissed در تاریخچه', async () => {
    useAlt.setState({ alerts: [makeAlert({ title: 'ردشده', status: 'dismissed' })] });
    render(<AlertsPage />);
    // در تب active نباید دیده بشه
    expect(screen.queryByText('ردشده')).not.toBeInTheDocument();
  });
});
