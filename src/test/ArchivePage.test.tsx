import { describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithRouter } from './helpers';
import ArchivePage from '../mod/arc/ArchivePage';

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

describe('ArchivePage', () => {
  it('رندر بدون خطا و نمایش تب سایر مخازن', () => {
    const { container, getByText } = renderWithRouter(<ArchivePage />);
    expect(container).toBeTruthy();
    const storesTab = getByText(/سایر مخازن/);
    fireEvent.click(storesTab);
    expect(getByText(/رکورد سایر مخازن/)).toBeTruthy();
  });
});
