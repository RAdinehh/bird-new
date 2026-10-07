import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRouter } from './helpers';
import ContactsPage from '../mod/ctc/ContactsPage';
import { useCtc } from '../mod/ctc/store';

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

const makeContact = (o: any = {}) => ({
  id: 'c-' + Math.random().toString(36).slice(2, 9),
  name: 'احمد', phone: '09121234567', phone2: '', email: '',
  address: '', city: '', nationalId: '',
  roles: ['customer'], notes: '',
  customerType: '', customerTypes: ['wholesale'],
  trustScore: null, defaultDiscount: null,
  supplierTypes: [], position: '', startDate: '',
  salaryType: 'monthly', salaryAmount: null, insurance: false,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  ...o,
});

beforeEach(() => {
  useCtc.setState({ contacts: [] } as any);
  vi.clearAllMocks();
});

describe('ContactsPage', () => {
  it('رندر بدون خطا (خالی)', () => {
    const { container } = renderWithRouter(<ContactsPage />);
    expect(container).toBeTruthy();
  });

  it('دکمه افزودن مخاطب', () => {
    renderWithRouter(<ContactsPage />);
    expect(screen.getAllByLabelText(/افزودن مخاطب/).length).toBeGreaterThan(0);
  });

  it('تب‌های نقش وجود دارن', () => {
    renderWithRouter(<ContactsPage />);
    expect(screen.getAllByText(/همه|مشتریان|فروشندگان|کارگران/).length).toBeGreaterThan(0);
  });

  it('با مخاطب رندر میشه', () => {
    useCtc.setState({ contacts: [makeContact()] } as any);
    const { container } = renderWithRouter(<ContactsPage />);
    expect(container).toBeTruthy();
  });

  it('نام مخاطب دیده میشه', () => {
    useCtc.setState({ contacts: [makeContact({ name: 'نام یکتا تست' })] } as any);
    renderWithRouter(<ContactsPage />);
    expect(screen.getByText('نام یکتا تست')).toBeInTheDocument();
  });

  it('کلیک افزودن → Modal باز میشه', async () => {
    renderWithRouter(<ContactsPage />);
    fireEvent.click(screen.getAllByLabelText(/افزودن مخاطب/)[0]);
    await waitFor(() => {
      expect(screen.getByText('لغو')).toBeInTheDocument();
    });
  });

  it('لغو → Modal بسته میشه', async () => {
    renderWithRouter(<ContactsPage />);
    fireEvent.click(screen.getAllByLabelText(/افزودن مخاطب/)[0]);
    await waitFor(() => expect(screen.getByText('لغو')).toBeInTheDocument());
    fireEvent.click(screen.getByText('لغو'));
    await waitFor(() => expect(screen.queryByText('لغو')).not.toBeInTheDocument());
  });
});
