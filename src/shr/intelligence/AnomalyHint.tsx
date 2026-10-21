/**
 * intelligence/AnomalyHint.tsx — یک خط نازک زیر فیلد
 */
import type { Warning } from './types';
import { formatWarning, formatWarningDetail } from './formatWarning';

const TONES = {
  yellow: { bg: 'var(--warn-soft)', color: 'var(--warn)', icon: '⚠️' },
  orange: { bg: 'var(--warn-soft)', color: 'var(--warn)', icon: '🟠' },
  red:    { bg: 'var(--danger-soft)', color: 'var(--danger)', icon: '🔴' },
} as const;

export function AnomalyHint({ warning }: { warning: Warning | null }) {
  if (!warning) return null;
  const c = TONES[warning.level];
  const msg = formatWarning(warning);
  const detail = formatWarningDetail(warning);
  return (
    <div
      role="status" title={detail}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '1px 6px',
        marginTop: 2,
        background: c.bg,
        color: c.color,
        borderRadius: 'var(--r-sm)',
        fontSize: 'var(--fs-2xs)',
        fontWeight: 600,
        lineHeight: 1.3,
      }}
    >
      <span aria-hidden="true" style={{ flexShrink: 0, lineHeight: 1 }}>{c.icon}</span>
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {msg}
      </span>
    </div>
  );
}
