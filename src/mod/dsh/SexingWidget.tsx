/**
 * SexingWidget.tsx — کارت «🕐 زمان تفکیک» در Dashboard
 * فاز ۷.۱ — نمای گله‌های breeder unsplit که به sexingAge رسیده‌اند
 */
import { useMemo } from 'react';
import { useBrd } from '../brd/store';
import { getStandardFor } from '../set/standards/resolve';
import { SectionTitle } from './cards';
import { toFa } from '../../shr/utils/fa';
import { computeSexingStats } from './sexingWidgetLogic';

interface Props {
  nav: (p: string) => void;
  activeFlocks: any[];
}

export default function SexingWidget({ nav, activeFlocks }: Props) {
  const brd = useBrd();

  const stats = useMemo(() => {
    const getStdSexingAge = (breedName: string): number | null => {
      try {
        const std = getStandardFor(breedName, {});
        return std?.sexingAgeDay ?? null;
      } catch { return null; }
    };
    return computeSexingStats(activeFlocks, brd.breeds, getStdSexingAge);
  }, [activeFlocks, brd.breeds]);

  if (stats.total === 0) return null;

  const items = [
    { count: stats.overdue, label: 'گذشته از موعد', color: 'danger' as const, icon: '🔴' },
    { count: stats.thisWeek, label: 'این هفته', color: 'warn' as const, icon: '🟠' },
    { count: stats.twoWeeks, label: '۲ هفته آینده', color: 'info' as const, icon: '🟡' },
  ].filter(x => x.count > 0);

  return (
    <div style={{ marginBottom: 12 }}>
      <SectionTitle>🕐 زمان تفکیک جنسیت</SectionTitle>
      <div
        role="button"
        tabIndex={0}
        onClick={() => nav('/flocks')}
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          padding: '12px',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {items.map(it => (
            <div key={it.label} style={{
              flex: '1 1 100px',
              padding: '8px 10px',
              background: `var(--${it.color}-soft)`,
              border: `1px solid var(--${it.color})`,
              borderRadius: 'var(--r-sm)',
              textAlign: 'center',
              minWidth: 90,
            }}>
              <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: `var(--${it.color})` }}>
                {it.icon} {toFa(it.count)}
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{it.label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
          {toFa(stats.total)} گله breeder بدون تفکیک — کلیک برای مشاهده
        </div>
      </div>
    </div>
  );
}
