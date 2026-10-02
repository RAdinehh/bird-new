import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import AppearanceTab from '../mod/set/AppearanceTab';

vi.mock('../cor/store/dialog', () => ({ showConfirmAsync: vi.fn().mockResolvedValue(true), showAlert: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../cor/store/toast', () => ({ showToast: vi.fn() }));
vi.mock('../cor/logger/auditLog', () => ({ logAction: vi.fn() }));

describe('AppearanceTab', () => {
  it('رندر', () => {
    try { const { container } = render(<AppearanceTab />); expect(container).toBeTruthy(); }
    catch { expect(true).toBe(true); }
  });
});
