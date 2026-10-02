import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LockScreen from '../shr/components/LockScreen';

vi.mock('../mod/set/store', () => ({
  useSet: () => ({ pin: '1234', pinEnabled: false }),
}));

describe('LockScreen', () => {
  it('رندر بدون خطا', () => {
    const { container } = render(<LockScreen onUnlock={() => {}} />);
    expect(container).toBeTruthy();
  });
});
