import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import InvoicePage from '../mod/tra/InvoicePage';
import { useTra } from '../mod/tra/store';
import { useCtc } from '../mod/ctc/store';
import { useWhs } from '../mod/whs/store';
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
  useWhs.setState({ items: [], movements: [] } as any);
  vi.clearAllMocks();
});

describe('InvoicePage', () => {
  it('رندر بدون خطا', () => {
    const { container } = renderWithRouter(<InvoicePage />);
    expect(container).toBeTruthy();
  });

  it('رندر با فاکتور', () => {
    useTra.setState({
      invoices: [{
        id: 'inv1', type: 'purchase', total: 100000, date: '1405/07/09',
        payments: [], items: [], number: 'P001',
      }] as any,
    });
    const { container } = renderWithRouter(<InvoicePage />);
    expect(container).toBeTruthy();
  });
});
