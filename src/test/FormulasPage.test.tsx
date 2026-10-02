import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderWithRouter } from './helpers';
import FormulasPage from '../mod/fed/FormulasPage';
import { useFed } from '../mod/fed/store';

vi.mock('../cor/store/dialog', () => ({
  showConfirmAsync: vi.fn().mockResolvedValue(true),
  showAlert: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../cor/store/toast', () => ({ showToast: vi.fn() }));
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
