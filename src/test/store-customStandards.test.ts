/**
 * تست دیباگ: آیا updateStandard واقعاً state رو آپدیت می‌کنه؟
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useSet } from '../mod/set/store';
import { DEFAULT_STANDARDS } from '../mod/set/standards/data';

describe('useSet.updateStandard', () => {
  beforeEach(() => {
    useSet.setState({ customStandards: {} });
  });

  it('بعد از updateStandard، customStandards آپدیت میشه', () => {
    const before = useSet.getState().customStandards || {};
    expect(Object.keys(before).length).toBe(0);

    const custom = { ...DEFAULT_STANDARDS.marandi, key: 'برنز', nameFa: 'برنز' };
    useSet.getState().updateStandard('برنز', custom);

    const after = useSet.getState().customStandards || {};
    expect(Object.keys(after)).toContain('برنز');
    expect(after['برنز'].nameFa).toBe('برنز');
  });

  it('دو تا update پشت سر هم کار می‌کنه', () => {
    const c1 = { ...DEFAULT_STANDARDS.marandi, key: 'a', nameFa: 'A' };
    const c2 = { ...DEFAULT_STANDARDS.marandi, key: 'b', nameFa: 'B' };
    useSet.getState().updateStandard('a', c1);
    useSet.getState().updateStandard('b', c2);
    const after = useSet.getState().customStandards || {};
    expect(Object.keys(after).length).toBe(2);
  });
});

describe('useSet.resetStandard', () => {
  beforeEach(() => {
    useSet.setState({
      customStandards: {
        'برنز': { ...DEFAULT_STANDARDS.marandi, key: 'برنز' },
        'لاری': { ...DEFAULT_STANDARDS.marandi, key: 'لاری' },
      }
    });
  });

  it('resetStandard فقط یکی رو حذف می‌کنه', () => {
    useSet.getState().resetStandard('برنز');
    const after = useSet.getState().customStandards || {};
    expect(Object.keys(after)).toEqual(['لاری']);
  });
});
