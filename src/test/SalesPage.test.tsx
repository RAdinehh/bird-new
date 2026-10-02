import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import SalesPage from '../mod/tra/SalesPage';
import { useTra } from '../mod/tra/store';
import { useCtc } from '../mod/ctc/store';
import { renderWithRouter } from './helpers';

vi.mock('../cor/store/dialog', () => ({
  showConfirmAsync: vi.fn().mockResolvedValue(true),
  showAlert: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../cor/store/toast', () => ({ showToast: vi.fn() }));
vi.mock('../cor/logger/auditLog', () => ({ logAction: vi.fn() }));

beforeEach(() => {
  useTra.setState({ invoices: [], deals: [] } as any);
  useCtc.setState({ contacts: [] } as any);
  vi.clearAllMocks();
});

describe('SalesPage', () => {
  it('رندر بدون خطا', () => {
    const { container } = renderWithRouter(<SalesPage />);
    expect(container).toBeTruthy();
  });

  it('با فاکتور فروش → رندر', () => {
    useTra.setState({
      invoices: [{
        id: 'inv1', type: 'sale', total: 100000, date: '1405/07/09',
        payments: [], items: [], number: 'S001',
      }] as any,
    });
    const { container } = renderWithRouter(<SalesPage />);
    expect(container).toBeTruthy();
  });
});
