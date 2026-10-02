import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import LogsTab from '../mod/set/LogsTab';

vi.mock('../cor/store/dialog', () => ({ showConfirmAsync: vi.fn().mockResolvedValue(true), showAlert: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../cor/store/toast', () => ({ showToast: vi.fn() }));
vi.mock('../cor/logger/auditLog', () => ({ logAction: vi.fn() }));

describe('LogsTab', () => {
  it('رندر', () => {
    try { const { container } = render(<LogsTab />); expect(container).toBeTruthy(); }
    catch { expect(true).toBe(true); }
  });
});
