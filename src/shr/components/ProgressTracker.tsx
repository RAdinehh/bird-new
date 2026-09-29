import React, { useState, useEffect } from 'react';
import { toFa } from '../utils/fa';
import { useSet } from '../../mod/set/store';

type Tone = 'accent' | 'warn' | 'danger' | 'info' | 'purple';

interface Props {
  current: number;
  target: number;
  label: string;
  unit?: string;
  color?: Tone;
  showRemaining?: boolean;
  showStart?: boolean;
  compact?: boolean;
}

// hook مشترک برای lowPowerMode + prefers-reduced-motion
function useNoAnim() {
  const lowPower = useSet((st: any) => st.lowPowerMode);
  const [prefersReduced, setPrefersReduced] = useState(false);
  useEffect(() => {
    try {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReduced(mq.matches);
      const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } catch {
      /* silent */
    }
  }, []);
  return !!(lowPower || prefersReduced);
}

export default function ProgressTracker({
  current,
  target,
  label,
  unit = 'روز',
  color = 'accent',
  showRemaining = true,
  showStart = true,
  compact = false,
}: Props) {
  const noAnim = useNoAnim();

  const clamped = Math.min(current, target);
  const percent = target > 0 ? (clamped / target) * 100 : 0;
  const remain = Math.max(0, target - current);
  const done = current >= target;

  const c = `var(--${color})`;
  const cs = `var(--${color}-soft)`;
  const cb = `var(--${color}-border)`;

  const ariaLabel = `${label}: ${toFa(Math.round(percent))} درصد — ${toFa(current)} از ${toFa(target)} ${unit}`;

  return (
    <div
      style={{
        padding: compact ? '10px 12px' : '12px 14px',
        background: done ? 'var(--accent-soft)' : cs,
        border: `1px solid ${done ? 'var(--accent-border)' : cb}`,
        borderRadius: 'var(--r-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {/* سرصفحه */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: 'var(--fs-xs)',
            color: done ? 'var(--accent)' : c,
            fontWeight: 700,
          }}
        >
          {done ? '✅ ' + label + ' — رسید' : '⏳ ' + label}
        </span>
        <span
          style={{
            fontSize: 'var(--fs-xs)',
            color: 'var(--muted)',
            fontWeight: 600,
          }}
        >
          {toFa(Math.round(percent))}٪
        </span>
      </div>

      {/* نوار پیشرفت — a11y */}
      <div
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel}
        style={{
          height: compact ? 8 : 10,
          background: 'var(--input-bg)',
          border: `1px solid ${done ? 'var(--accent-border)' : cb}`,
          borderRadius: 'var(--r-sm)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: percent + '%',
            background: done
              ? 'linear-gradient(90deg, var(--accent), var(--accent))'
              : c,
            borderRadius: 'var(--r-sm)',
            transition: noAnim ? 'none' : 'width var(--dur-slow)',
          }}
        />
      </div>

      {/* روزشمار */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 'var(--fs-xs)',
          color: 'var(--muted)',
        }}
      >
        {showStart ? (
          <span>
            روز <b style={{ color: c }}>{toFa(current)}</b> از {toFa(target)} {unit}
          </span>
        ) : (
          <span />
        )}
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

/** نسخه‌ی کوچک برای کارت‌های لیست */
export function MiniProgress({
  current,
  target,
  color = 'accent',
}: {
  current: number;
  target: number;
  color?: Tone;
}) {
  const noAnim = useNoAnim();

  const clamped = Math.min(current, target);
  const percent = target > 0 ? (clamped / target) * 100 : 0;
  const remain = Math.max(0, target - current);
  const done = current >= target;
  const c = `var(--${color})`;

  const ariaLabel = `${toFa(Math.round(percent))} درصد — ${toFa(current)} از ${toFa(target)}`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        marginTop: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 'var(--fs-xs)',
        }}
      >
        <span style={{ color: c, fontWeight: 700 }}>
          {done ? '✅ آماده' : '⏳ ' + toFa(remain) + ' روز مانده'}
        </span>
        <span style={{ color: 'var(--muted)' }}>
          {toFa(current)} / {toFa(target)}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel}
        style={{
          height: 6,
          background: 'var(--input-bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-sm)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: percent + '%',
            background: done ? 'var(--accent)' : c,
            borderRadius: 'var(--r-sm)',
            transition: noAnim ? 'none' : 'width var(--dur-slow)',
          }}
        />
      </div>
    </div>
  );
}
