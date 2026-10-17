/**
 * setup.ts — Global test setup
 * حفظ mock های اصلی + ResizeObserver برای useCarousel
 */
import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// ═══════════════════════════════════════════════
// 🆕 ResizeObserver — useCarousel از این استفاده می‌کنه
// jsdom این API رو نداره
// ═══════════════════════════════════════════════
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
}

// ═══════════════════════════════════════════════
// 🆕 matchMedia — برای prefers-reduced-motion
// ═══════════════════════════════════════════════
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// ═══════════════════════════════════════════════
// 🆕 IntersectionObserver — برای virtualization
// ═══════════════════════════════════════════════
class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}

if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;
}
