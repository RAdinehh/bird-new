import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import PurchasesPage from '../mod/tra/PurchasesPage';
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

describe('PurchasesPage', () => {
  it('رندر بدون خطا', () => {
    const { container } = renderWithRouter(<PurchasesPage />);
    expect(container).toBeTruthy();
  });
});
