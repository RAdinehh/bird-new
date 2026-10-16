/**
 * LifecycleBar — نوار چرخه زندگی گله
 * Progress Fill: پس‌زمینه سفید + فیلد رنگی تا موقعیت فعلی
 * رنگ فیلد = رنگ مرحله فعلی • خط تیره = موقعیت
 */
import type { FlockType } from '../store';

interface Props {
  type: FlockType;
  ageDays: number;
  endOfCycleDay: number | null;
}

export default function LifecycleBar({ type, ageDays, endOfCycleDay }: Props) {
  const cycle = endOfCycleDay && endOfCycleDay > 0
    ? endOfCycleDay
    : (type === 'broiler' ? 42 : 700);

  const stages = type === 'broiler'
    ? [
        { color: 'var(--info)',   endDay: 7 },
        { color: 'var(--warn)',   endDay: 21 },
        { color: 'var(--accent)', endDay: 42 },
      ]
    : [
        { color: 'var(--info)',   endDay: 90 },
        { color: 'var(--warn)',   endDay: 140 },
        { color: 'var(--accent)', endDay: cycle },
      ];

  // مرحله فعلی
  let currentIdx = 0;
  for (let i = 0; i < stages.length; i++) {
    if (ageDays <= stages[i].endDay) {
      currentIdx = i;
      break;
    }
    currentIdx = i;
  }

  const currentColor = stages[currentIdx].color;

  // موقعیت دقیق بر اساس سن (نه مرکز مرحله)
  const pos = Math.min(100, Math.max(0, (ageDays / cycle) * 100));

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pos)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`سن گله: روز ${ageDays} از ${cycle}`}
      style={{
        position: 'relative',
        height: 16,
        background: 'var(--bg)',
        borderRadius: 'var(--r-sm)',
        overflow: 'hidden',
        border: '1px solid var(--border)',
      }}
    >
      {/* فیلد رنگی — از راست تا موقعیت فعلی (RTL) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: `${pos}%`,
          background: currentColor,
          transition: 'width 200ms ease-out',
        }}
      />

      {/* خط نشانگر موقعیت — نازک و تیره */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: `${pos}%`,
          width: 2,
          background: 'var(--text)',
          transform: 'translateX(50%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
