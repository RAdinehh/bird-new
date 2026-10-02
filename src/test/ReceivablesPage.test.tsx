import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import ReceivablesPage from '../mod/tra/ReceivablesPage';
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

describe('ReceivablesPage', () => {
  it('رندر بدون خطا', () => {
    const { container } = renderWithRouter(<ReceivablesPage />);
    expect(container).toBeTruthy();
  });
});
