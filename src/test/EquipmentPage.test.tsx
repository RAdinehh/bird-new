import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EquipmentPage from '../mod/hal/EquipmentPage';
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

describe('EquipmentPage', () => {
  it('رندر بدون خطا', () => {
    const { container } = render(<EquipmentPage />);
    expect(container).toBeTruthy();
  });
});
