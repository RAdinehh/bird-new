/**
 * helpers.tsx — helperهای مشترک ماژول inc
 */
import type { ReactNode, CSSProperties } from 'react';
import { format as formatJ } from 'date-fns-jalali';

export function todayJalali(): string {
  const d = new Date();
  return formatJ(d, 'yyyy/MM/dd');
}

export function Row({ l, v }: { l: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
      <span style={{ color: 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span>
    </div>
  );
}

export function chip(active: boolean): React.CSSProperties {
  return {
    padding: '6px 11px', fontSize: 'var(--fs-sm)',
    background: active ? 'var(--info-soft)' : 'var(--btn-bg)',
    border: '1px solid ' + (active ? 'var(--info)' : 'var(--border)'),
    borderRadius: 'var(--r-sm)',
    color: active ? 'var(--info)' : 'var(--muted)',
    fontWeight: active ? 600 : 500, cursor: 'pointer',
    fontFamily: 'inherit', whiteSpace: 'nowrap',
    flexShrink: 0
  };
}

/** تطبیق نام پرنده بدون ایموجی و فاصله */
export function normalizeBird(name: string): string {
  return (name || '')
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')  // حذف ایموجی
    .replace(/\s+/g, '')                       // حذف فاصله
    .trim()
    .toLowerCase();
}

/** پیدا کردن پروفایل انکوباسیون از لیست */
export function findProfile(profiles: any[], birdName: string) {
  if (!profiles || !birdName) return null;
  const target = normalizeBird(birdName);
  return profiles.find(p => normalizeBird(p.birdName) === target) || null;
}

/** پیش‌فرض‌های انکوباسیون بر اساس نام پرنده (Fallback) */
export const INCUBATION_DEFAULTS: Record<string, {
  setterTemp: number; setterHumidity: number;
  hatcherTemp: number; hatcherHumidity: number;
  totalDays: number; lockdownDay: number;
}> = {
  'مرغ':       { setterTemp: 37.7, setterHumidity: 50, hatcherTemp: 37.2, hatcherHumidity: 62, totalDays: 21, lockdownDay: 18 },
  'بوقلمون':   { setterTemp: 37.6, setterHumidity: 53, hatcherTemp: 37.1, hatcherHumidity: 68, totalDays: 28, lockdownDay: 25 },
  'اردک':      { setterTemp: 37.6, setterHumidity: 57, hatcherTemp: 37.2, hatcherHumidity: 72, totalDays: 28, lockdownDay: 25 },
  'غاز':       { setterTemp: 37.6, setterHumidity: 57, hatcherTemp: 37.1, hatcherHumidity: 72, totalDays: 30, lockdownDay: 27 },
  'بلدرچین':   { setterTemp: 37.6, setterHumidity: 53, hatcherTemp: 37.2, hatcherHumidity: 68, totalDays: 18, lockdownDay: 15 },
  'قرقاول':    { setterTemp: 37.6, setterHumidity: 53, hatcherTemp: 37.2, hatcherHumidity: 68, totalDays: 24, lockdownDay: 21 },
  'کبوتر':     { setterTemp: 37.6, setterHumidity: 53, hatcherTemp: 37.2, hatcherHumidity: 68, totalDays: 17, lockdownDay: 14 },
};

/** گرفتن پیش‌فرض بر اساس نام پرنده */
export function getIncubationDefault(birdName: string) {
  const n = normalizeBird(birdName);
  for (const [key, val] of Object.entries(INCUBATION_DEFAULTS)) {
    if (n.includes(normalizeBird(key))) return val;
  }
  return INCUBATION_DEFAULTS['مرغ'];
}
