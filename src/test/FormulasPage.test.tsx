import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderWithRouter } from './helpers';
import FormulasPage from '../mod/fed/FormulasPage';
import { useFed } from '../mod/fed/store';

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
  useFed.setState({ ingredients: [], requirements: [], formulas: [] } as any);
  vi.clearAllMocks();
});

describe('FormulasPage', () => {
  it('رندر بدون خطا', () => {
    const { container } = renderWithRouter(<FormulasPage />);
    expect(container).toBeTruthy();
  });
});
