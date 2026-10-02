import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSwipeTabs } from '../shr/hooks/useSwipeTabs';

describe('useSwipeTabs', () => {
  it('ref برمیگردونه', () => {
    const { result } = renderHook(() => useSwipeTabs(['a', 'b'], 'a', () => {}));
    expect(result.current).toHaveProperty('current');
  });

  it('با ids خالی بدون خطا', () => {
    const { result } = renderHook(() => useSwipeTabs([], '', () => {}));
    expect(result.current).toBeTruthy();
  });
});
