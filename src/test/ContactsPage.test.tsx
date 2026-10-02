import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContactsPage from '../mod/ctc/ContactsPage';
import { useCtc } from '../mod/ctc/store';

vi.mock('../cor/store/dialog', () => ({
  showConfirmAsync: vi.fn().mockResolvedValue(true),
  showAlert: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../cor/store/toast', () => ({ showToast: vi.fn() }));
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
    const { container } = render(<ContactsPage />);
    expect(container).toBeTruthy();
  });

  it('دکمه افزودن مخاطب', () => {
    render(<ContactsPage />);
    expect(screen.getAllByText(/افزودن مخاطب/).length).toBeGreaterThan(0);
  });

  it('تب‌های نقش وجود دارن', () => {
    render(<ContactsPage />);
    expect(screen.getAllByText(/همه|مشتریان|فروشندگان|کارگران/).length).toBeGreaterThan(0);
  });

  it('با مخاطب رندر میشه', () => {
    useCtc.setState({ contacts: [makeContact()] } as any);
    const { container } = render(<ContactsPage />);
    expect(container).toBeTruthy();
  });

  it('نام مخاطب دیده میشه', () => {
    useCtc.setState({ contacts: [makeContact({ name: 'نام یکتا تست' })] } as any);
    render(<ContactsPage />);
    expect(screen.getByText('نام یکتا تست')).toBeInTheDocument();
  });

  it('جستجو فیلتر میکنه', async () => {
    useCtc.setState({
      contacts: [
        makeContact({ name: 'علی' }),
        makeContact({ name: 'رضا' }),
      ]
    } as any);
    render(<ContactsPage />);

    const input = screen.getByPlaceholderText(/جستجو/);
    fireEvent.change(input, { target: { value: 'علی' } });

    await waitFor(() => {
      expect(screen.getByText('علی')).toBeInTheDocument();
      expect(screen.queryByText('رضا')).not.toBeInTheDocument();
    });
  });

  it('کلیک افزودن → Modal باز میشه', async () => {
    render(<ContactsPage />);
    fireEvent.click(screen.getAllByText(/افزودن مخاطب/)[0]);
    await waitFor(() => {
      expect(screen.getByText('لغو')).toBeInTheDocument();
    });
  });

  it('لغو → Modal بسته میشه', async () => {
    render(<ContactsPage />);
    fireEvent.click(screen.getAllByText(/افزودن مخاطب/)[0]);
    await waitFor(() => expect(screen.getByText('لغو')).toBeInTheDocument());
    fireEvent.click(screen.getByText('لغو'));
    await waitFor(() => expect(screen.queryByText('لغو')).not.toBeInTheDocument());
  });
});
