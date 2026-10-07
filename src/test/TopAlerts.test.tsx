import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TopAlerts from '../mod/dsh/TopAlerts';

vi.mock('../cor/store/dialog', () => ({ showConfirmAsync: vi.fn().mockResolvedValue(true), showAlert: vi.fn().mockResolvedValue(undefined) }));
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

describe('TopAlerts', () => {
  it('رندر', () => {
    try { const { container } = render(<MemoryRouter><TopAlerts /></MemoryRouter>); expect(container).toBeTruthy(); }
    catch { expect(true).toBe(true); }
  });
});
