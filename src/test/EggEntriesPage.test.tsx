import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderWithRouter } from './helpers';
import EggEntriesPage from '../mod/inc/EggEntriesPage';
import { useInc } from '../mod/inc/store';
import { useBrd } from '../mod/brd/store';
import { useFlk } from '../mod/flk/store';
import { useCtc } from '../mod/ctc/store';

vi.mock('../cor/store/dialog', () => ({
  showConfirmAsync: vi.fn().mockResolvedValue(true),
  showAlert: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../cor/store/toast', () => ({ showToast: vi.fn() }));
vi.mock('../cor/logger/auditLog', () => ({ logAction: vi.fn() }));
vi.mock('../mod/tra/store', () => ({
  useTra: () => ({ addInvoice: vi.fn(), deleteInvoice: vi.fn() }),
}));
vi.mock('../mod/egg/store', () => ({
  useEgg: () => ({ addProduction: vi.fn(), deleteProduction: vi.fn() }),
}));

beforeEach(() => {
  useInc.setState({ devices: [], eggEntries: [], candlings: [], hatchGroups: [], hatchResults: [] } as any);
  useBrd.setState({ birds: [], breeds: [] });
  useFlk.setState({ flocks: [] });
  useCtc.setState({ contacts: [] } as any);
  vi.clearAllMocks();
});

describe('EggEntriesPage', () => {
  it('رندر بدون خطا', () => {
    const { container } = renderWithRouter(<EggEntriesPage />);
    expect(container).toBeTruthy();
  });
});
