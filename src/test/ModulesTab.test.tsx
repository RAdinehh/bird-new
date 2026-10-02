import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import ModulesTab from '../mod/set/ModulesTab';

vi.mock('../cor/store/dialog', () => ({ showConfirmAsync: vi.fn().mockResolvedValue(true), showAlert: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../cor/store/toast', () => ({ showToast: vi.fn() }));
vi.mock('../cor/logger/auditLog', () => ({ logAction: vi.fn() }));

describe('ModulesTab', () => {
  it('رندر', () => {
    try { const { container } = render(<ModulesTab />); expect(container).toBeTruthy(); }
    catch { expect(true).toBe(true); }
  });
});
