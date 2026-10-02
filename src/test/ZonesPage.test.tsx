import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ZonesPage from '../mod/hal/ZonesPage';
import { useHal } from '../mod/hal/store';

vi.mock('../cor/store/dialog', () => ({
  showConfirmAsync: vi.fn().mockResolvedValue(true),
  showAlert: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../cor/store/toast', () => ({ showToast: vi.fn() }));
vi.mock('../cor/logger/auditLog', () => ({ logAction: vi.fn() }));

beforeEach(() => {
  useHal.setState({ halls: [], zones: [], equipment: [] } as any);
  vi.clearAllMocks();
});

describe('ZonesPage', () => {
  it('رندر بدون خطا', () => {
    const { container } = render(<ZonesPage />);
    expect(container).toBeTruthy();
  });
});
