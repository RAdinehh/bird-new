import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderWithRouter } from './helpers';
import ArchivePage from '../mod/arc/ArchivePage';

vi.mock('../cor/store/dialog', () => ({
  showConfirmAsync: vi.fn().mockResolvedValue(true),
  showAlert: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../cor/store/toast', () => ({ showToast: vi.fn() }));
vi.mock('../cor/logger/auditLog', () => ({ logAction: vi.fn() }));

describe('ArchivePage', () => {
  it('رندر بدون خطا', () => {
    const { container } = renderWithRouter(<ArchivePage />);
    expect(container).toBeTruthy();
  });
});
