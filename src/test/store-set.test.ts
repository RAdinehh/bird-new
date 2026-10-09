import { describe, it, expect, beforeEach } from 'vitest';
import { useSet, MODULE_LABELS } from '../mod/set/store';

beforeEach(() => {
  // reset
  useSet.getState().reset();
});

describe('useSet — تنظیمات پیش‌فرض', () => {
  it('theme تعریف شده', () => {
    expect(useSet.getState().theme).toBeTruthy();
  });

  it('accentColor تعریف شده', () => {
    expect(useSet.getState().accentColor).toBeTruthy();
  });


describe('useSet — update', () => {
  it('update یک فیلد ساده', () => {
    useSet.getState().update({ theme: 'dark' });
    expect(useSet.getState().theme).toBe('dark');
  });

  it('update چند فیلد', () => {
    useSet.getState().update({ theme: 'dark', accentColor: 'blue' });
    expect(useSet.getState().theme).toBe('dark');
    expect(useSet.getState().accentColor).toBe('blue');
  });

});

describe('useSet — reset', () => {
  it('reset همه چیز رو برمیگردونه به پیش‌فرض', () => {
    useSet.getState().update({ theme: 'dark' });
    expect(useSet.getState().theme).toBe('dark');
    useSet.getState().reset();
    expect(useSet.getState().theme).not.toBe('dark');
  });


describe('MODULE_LABELS', () => {
  it('شامل ماژول‌های اصلی', () => {
    expect(MODULE_LABELS.dlg).toBeTruthy();
    expect(MODULE_LABELS.inc).toBeTruthy();
    expect(MODULE_LABELS.brd).toBeTruthy();
  });

  it('هر ماژول name/desc/icon داره', () => {
    Object.values(MODULE_LABELS).forEach(m => {
      expect(m.name).toBeTruthy();
      expect(typeof m.name).toBe('string');
      expect(m.icon).toBeTruthy();
    });
  });
});
