/**
 * intelligence/AnomalyHint.tsx
 *
 * نمایش بصری هشدار — سه رنگ بر اساس سطح.
 * بدون هیچ کلیک، بدون dismiss. فقط نمایش.
 */
import type { Warning } from './types';

const TONES = {
  yellow: {
    bg: 'var(--warn-soft)',
    color: 'var(--warn)',
    icon: '⚠️',
  },
  orange: {
    bg: 'var(--warn-soft)',
    color: 'var(--warn)',
    icon: '🟠',
  },
  red: {
    bg: 'var(--danger-soft)',
    color: 'var(--danger)',
    icon: '🔴',
  },
} as const;

export function AnomalyHint({ warning }: { warning: Warning | null }) {
  if (!warning) return null;
  const c = TONES[warning.level];
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px',
        marginTop: 4,
        background: c.bg,
        color: c.color,
        borderRadius: 'var(--r-sm)',
        fontSize: 'var(--fs-xs)',
        fontWeight: 600,
        lineHeight: 1.5,
      }}
    >
      <span aria-hidden="true">{c.icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>{warning.reason}</span>
    </div>
  );
}
