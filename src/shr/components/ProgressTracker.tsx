import React from 'react';
import { toFa } from '../utils/fa';

interface Props {
  current: number;
  target: number;
  label: string;
  unit?: string;
  color?: 'accent' | 'warn' | 'danger' | 'info' | 'purple';
  showRemaining?: boolean;
  showStart?: boolean;
  compact?: boolean;
}

export default function ProgressTracker({
  current,
  target,
  label,
  unit = 'روز',
  color = 'accent',
  showRemaining = true,
  showStart = true,
  compact = false
}: Props) {
  const clamped = Math.min(current, target);
  const percent = target > 0 ? (clamped / target) * 100 : 0;
  const remain = Math.max(0, target - current);
  const done = current >= target;

  const c = 'var(--' + color + ')';
  const cs = 'var(--' + color + '-soft)';
  const cb = 'var(--' + color + '-border)';

  return (
    <div style={{
      padding: compact ? '10px 12px' : '12px 14px',
      background: done ? 'var(--accent-soft)' : cs,
      border: '1px solid ' + (done ? 'var(--accent-border)' : cb),
      borderRadius: 'var(--r-md)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }}>
      {/* سرصفحه */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--fs-xs)', color: done ? 'var(--accent)' : c, fontWeight: 700 }}>
          {done ? '✅ ' + label + ' — رسید' : '⏳ ' + label}
        </span>
        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 600 }}>
          {toFa(Math.round(percent))}٪
        </span>
      </div>

      {/* نوار پیشرفت */}
      <div style={{
        height: compact ? 8 : 10,
        background: 'var(--input-bg)',
        border: '1px solid ' + (done ? 'var(--accent-border)' : cb),
        borderRadius: 6,
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: percent + '%',
          background: done
            ? 'linear-gradient(90deg, var(--accent), #16a34a)'
            : 'linear-gradient(90deg, ' + c + ', ' + c + ')',
          borderRadius: 6,
          transition: 'width .4s'
        }} />
      </div>

      {/* روزشمار */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 'var(--fs-xs)',
        color: 'var(--muted)'
      }}>
        {showStart ? (
          <span>
            روز <b style={{ color: c }}>{toFa(current)}</b> از {toFa(target)} {unit}
          </span>
        ) : <span />}
        {showRemaining && !done ? (
          <span style={{ color: c, fontWeight: 700 }}>
            {toFa(remain)} {unit} مانده
          </span>
        ) : done ? (
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>آماده</span>
        ) : null}
      </div>
    </div>
  );
}

/** نسخه‌ی کوچک برای کارت‌های لیست — یک خط نازک + درصد */
export function MiniProgress({ current, target, color = 'accent' }: {
  current: number;
  target: number;
  color?: 'accent' | 'warn' | 'danger' | 'info' | 'purple';
}) {
  const clamped = Math.min(current, target);
  const percent = target > 0 ? (clamped / target) * 100 : 0;
  const remain = Math.max(0, target - current);
  const done = current >= target;
  const c = 'var(--' + color + ')';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)' }}>
        <span style={{ color: c, fontWeight: 700 }}>
          {done ? '✅ آماده' : '⏳ ' + toFa(remain) + ' روز مانده'}
        </span>
        <span style={{ color: 'var(--muted)' }}>
          {toFa(current)} / {toFa(target)}
        </span>
      </div>
      <div style={{
        height: 6,
        background: 'var(--input-bg)',
        border: '1px solid var(--border)',
        borderRadius: 4,
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: percent + '%',
          background: done
            ? 'linear-gradient(90deg, var(--accent), #16a34a)'
            : c,
          borderRadius: 4,
          transition: 'width .4s'
        }} />
      </div>
    </div>
  );
}
