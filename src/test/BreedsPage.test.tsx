import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import BreedsPage from '../mod/brd/BreedsPage';
import { useBrd } from '../mod/brd/store';

vi.mock('../cor/store/dialog', () => ({
  showConfirmAsync: vi.fn().mockResolvedValue(true),
  showAlert: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../cor/store/toast', () => ({ showToast: vi.fn() }));
vi.mock('../cor/logger/auditLog', () => ({ logAction: vi.fn() }));

beforeEach(() => {
  useBrd.setState({ birds: [], breeds: [] });
  vi.clearAllMocks();
});

describe('BreedsPage', () => {
  it('رندر بدون خطا', () => {
    const { container } = render(<BreedsPage />);
    expect(container).toBeTruthy();
  });

  it('با نژاد → رندر بدون خطا', () => {
    useBrd.setState({
      birds: [{ id: 'b1', name: 'مرغ', nameEn: 'Chicken', cycleDays: 21, fcrStandard: 1.6, createdAt: '', updatedAt: '' }] as any,
      breeds: [{ id: 'br1', birdId: 'b1', name: 'لگهورن', fcr: 1.5, createdAt: '', updatedAt: '' }] as any,
    });
    const { container } = render(<BreedsPage />);
    expect(container).toBeTruthy();
  });
});
