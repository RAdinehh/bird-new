import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCarousel } from '../shr/hooks/useCarousel';

describe('useCarousel — hook swipe', () => {
  it('ابتدایی برمیگردونه ref ها', () => {
    const { result } = renderHook(() =>
      useCarousel(['a', 'b', 'c'], 'a', () => {})
    );
    expect(result.current).toHaveProperty('containerRef');
    expect(result.current).toHaveProperty('trackRef');
    expect(result.current).toHaveProperty('setInstant');
    expect(typeof result.current.setInstant).toBe('function');
  });

  it('setInstant بدون خطا اجرا میشه', () => {
    const { result } = renderHook(() =>
      useCarousel(['a', 'b'], 'a', () => {})
    );
    act(() => {
      result.current.setInstant();
    });
    expect(true).toBe(true);
  });

  it('onChange در ابتدا صدا زده نمیشه', () => {
    const onChange = vi.fn();
    renderHook(() => useCarousel(['a', 'b'], 'a', onChange));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('با ids خالی کرش نمیکنه', () => {
    const { result } = renderHook(() =>
      useCarousel([], '', () => {})
    );
    expect(result.current).toHaveProperty('containerRef');
  });

  it('با active نامعتبر کرش نمیکنه', () => {
    renderHook(() =>
      useCarousel(['a', 'b'], 'nonexistent', () => {})
    );
    expect(true).toBe(true);
  });
});
