import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAutoLock } from '../shr/hooks/useAutoLock';

describe('useAutoLock', () => {
  it('initial → unlocked', () => {
    const { result } = renderHook(() => useAutoLock());
    expect(result.current.locked).toBe(false);
    expect(typeof result.current.unlock).toBe('function');
  });
});
