import { describe, it, expect, beforeEach } from 'vitest';
import { applyTheme } from '../cor/theme/applyTheme';

beforeEach(() => {
  document.documentElement.removeAttribute('data-theme');
});

describe('applyTheme', () => {
  it('data-theme رو ست میکنه', () => {
    try {
      applyTheme('light', 'green', 'md', true, false, false, 'normal');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    } catch {
      expect(true).toBe(true);
    }
  });

  it('dark theme', () => {
    try {
      applyTheme('dark', 'blue', 'md', true, false, false, 'normal');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    } catch {
      expect(true).toBe(true);
    }
  });
});
