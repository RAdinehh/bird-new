/**
 * setup.ts — Global test setup
 */
import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// ═══════════════════════════════════════════════
// 🆕 ResizeObserver — هوشمند (callback می‌زنه)
// useCarousel برای اندازه‌گیری از این استفاده می‌کنه
// ═══════════════════════════════════════════════
class ResizeObserverMock {
  private cb: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
  }
  observe(target: Element) {
    const fakeEntry = {
      target,
      contentRect: {
        width: 400, height: 300, top: 0, left: 0, right: 400, bottom: 300, x: 0, y: 0,
        toJSON: () => ({}),
      },
      borderBoxSize: [{ inlineSize: 400, blockSize: 300 }],
      contentBoxSize: [{ inlineSize: 400, blockSize: 300 }],
      devicePixelContentBoxSize: [{ inlineSize: 400, blockSize: 300 }],
    } as unknown as ResizeObserverEntry;
    Promise.resolve().then(() => this.cb([fakeEntry], this as unknown as ResizeObserver));
  }
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
}

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

class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}

if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;
}
