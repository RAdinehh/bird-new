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

  it('thresholds پیش‌فرض', () => {
    const t = useSet.getState().thresholds;
    expect(t.eggDropPercent).toBe(10);
    expect(t.mortalityPerThousand).toBe(5);
    expect(t.tempDeviation).toBe(2);
    expect(t.humidityDeviation).toBe(10);
    expect(t.waterFeedMin).toBe(1.6);
    expect(t.waterFeedMax).toBe(2.2);
    expect(t.criticalTempHigh).toBe(32);
    expect(t.criticalTempLow).toBe(18);
  });
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

  it('update thresholds — merge نه replace', () => {
    useSet.getState().update({
      thresholds: { ...useSet.getState().thresholds, eggDropPercent: 15 },
    });
    expect(useSet.getState().thresholds.eggDropPercent).toBe(15);
    // بقیه حفظ شن
    expect(useSet.getState().thresholds.mortalityPerThousand).toBe(5);
  });

  it('update partial thresholds — merge', () => {
    // اگه فقط eggDropPercent بدیم، بقیه هم باید بمونن (migration)
    const before = useSet.getState().thresholds;
    useSet.getState().update({
      thresholds: { ...before, eggDropPercent: 20 },
    });
    const after = useSet.getState().thresholds;
    expect(after.eggDropPercent).toBe(20);
    expect(after.mortalityPerThousand).toBe(before.mortalityPerThousand);
  });
});

describe('useSet — reset', () => {
  it('reset همه چیز رو برمیگردونه به پیش‌فرض', () => {
    useSet.getState().update({ theme: 'dark' });
    expect(useSet.getState().theme).toBe('dark');
    useSet.getState().reset();
    expect(useSet.getState().theme).not.toBe('dark');
  });

  it('reset thresholds رو برمیگردونه', () => {
    useSet.getState().update({
      thresholds: { ...useSet.getState().thresholds, eggDropPercent: 99 },
    });
    useSet.getState().reset();
    expect(useSet.getState().thresholds.eggDropPercent).toBe(10);
  });
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
