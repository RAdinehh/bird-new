import { describe, it, expect, beforeEach } from 'vitest';
import { safeStorage } from '../shr/utils/storage';

beforeEach(() => {
  try { localStorage.clear(); } catch { /* silent */ }
});

describe('safeStorage', () => {
  it('set + get', () => {
    safeStorage.set('k', 'v');
    expect(safeStorage.get('k')).toBe('v');
  });

  it('get ناموجود → null', () => {
    expect(safeStorage.get('nonexistent')).toBeNull();
  });

  it('remove', () => {
    safeStorage.set('k', 'v');
    safeStorage.remove('k');
    expect(safeStorage.get('k')).toBeNull();
  });

  it('setJSON + getJSON', () => {
    safeStorage.setJSON('obj', { a: 1, b: 'x' });
    expect(safeStorage.getJSON('obj', null)).toEqual({ a: 1, b: 'x' });
  });

  it('getJSON روی داده خراب → fallback', () => {
    safeStorage.set('bad', '{invalid json');
    expect(safeStorage.getJSON('bad', 'default')).toBe('default');
  });

  it('keys', () => {
    safeStorage.set('a', '1');
    safeStorage.set('b', '2');
    const keys = safeStorage.keys();
    expect(keys).toContain('a');
    expect(keys).toContain('b');
  });
});
