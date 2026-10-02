import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import DealsPage from '../mod/tra/DealsPage';
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

describe('DealsPage', () => {
  it('رندر بدون خطا', () => {
    const { container } = renderWithRouter(<DealsPage />);
    expect(container).toBeTruthy();
  });
});
