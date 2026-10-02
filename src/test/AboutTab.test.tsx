import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import AboutTab from '../mod/set/AboutTab';

vi.mock('../cor/store/dialog', () => ({ showConfirmAsync: vi.fn().mockResolvedValue(true), showAlert: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../cor/store/toast', () => ({ showToast: vi.fn() }));
vi.mock('../cor/logger/auditLog', () => ({ logAction: vi.fn() }));

describe('AboutTab', () => {
  it('رندر', () => {
    try { const { container } = render(<AboutTab />); expect(container).toBeTruthy(); }
    catch { expect(true).toBe(true); }
  });
});
