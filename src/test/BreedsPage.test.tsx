import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from './helpers';
import BreedsPage from '../mod/brd/BreedsPage';
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

beforeEach(() => {
  useBrd.setState({ birds: [], breeds: [] });
  vi.clearAllMocks();
});

describe('BreedsPage', () => {
  it('رندر بدون خطا', () => {
    const { container } = renderWithRouter(<BreedsPage />);
    expect(container).toBeTruthy();
  });

  it('با نژاد → رندر بدون خطا', () => {
    useBrd.setState({
      birds: [{ id: 'b1', name: 'مرغ', createdAt: '', updatedAt: '' }] as any,
      breeds: [{ id: 'br1', birdId: 'b1', name: 'مرندی', fcr: 1.79, createdAt: '', updatedAt: '' }] as any,
    });
    const { container } = renderWithRouter(<BreedsPage />);
    expect(container).toBeTruthy();
  });
});
