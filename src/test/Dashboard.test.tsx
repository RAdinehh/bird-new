import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import Dashboard from '../mod/dsh/Dashboard';
import { useFlk } from '../mod/flk/store';
import { useDlg } from '../mod/dlg/store';
import { useBrd } from '../mod/brd/store';
import { useTra } from '../mod/tra/store';
import { useInc } from '../mod/inc/store';
import { useEgg } from '../mod/egg/store';
import { useWhs } from '../mod/whs/store';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../cor/store/dialog', () => ({ showConfirmAsync: vi.fn().mockResolvedValue(true), showAlert: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../cor/store/toast', () => ({ showToast: vi.fn() }));
vi.mock('../cor/logger/auditLog', () => ({ logAction: vi.fn() }));

beforeEach(() => {
  useFlk.setState({ flocks: [] });
  useDlg.setState({ logs: [] } as any);
  useBrd.setState({ birds: [], breeds: [] });
  useTra.setState({ invoices: [], deals: [] } as any);
  useInc.setState({ devices: [], eggEntries: [], candlings: [], hatchGroups: [], hatchResults: [] } as any);
  useEgg.setState({ productions: [], stocks: [], sales: [] } as any);
  useWhs.setState({ items: [], movements: [] } as any);
  vi.clearAllMocks();
});

describe('Dashboard', () => {
  it('رندر بدون خطا', () => {
    const { container } = render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(container).toBeTruthy();
  });
});
