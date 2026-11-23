/** AlertBox — کادر هشدار/اطلاع/موفقیت استاندارد */
import React from 'react';

type Tone = 'warn' | 'danger' | 'info' | 'success' | 'accent';
type Variant = 'dashed' | 'solid' | 'flat';
type Size = 'xs' | 'sm';
type Align = 'start' | 'center';

const TONE_MAP: Record<Tone, { color: string; soft: string }> = {
  warn:    { color: 'var(--warn)',    soft: 'var(--warn-soft)' },
  danger:  { color: 'var(--danger)',  soft: 'var(--danger-soft)' },
  info:    { color: 'var(--info)',    soft: 'var(--info-soft)' },
  success: { color: 'var(--success)', soft: 'var(--success-soft)' },
  accent:  { color: 'var(--accent)',  soft: 'var(--accent-soft)' },
};

interface AlertBoxProps {
  tone?: Tone;
  variant?: Variant;
  size?: Size;
  align?: Align;
  icon?: React.ReactNode | false;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function AlertBox({
  tone = 'warn',
  variant = 'dashed',
  size = 'sm',
  align = 'start',
  icon,
  children,
  style,
}: AlertBoxProps) {
  void size;
  const t = TONE_MAP[tone];
  const borderStyle =
    variant === 'dashed' ? `1px dashed ${t.color}`
    : variant === 'solid' ? `1px solid ${t.color}`
    : 'none';

  return (
    <div
      style={{
        padding: '8px 12px',
        background: t.soft,
        border: borderStyle,
        borderRadius: 'var(--r-md)',
        fontSize: 'var(--fs-sm)',
        fontFamily: 'inherit',
        color: t.color,
        fontWeight: 500,
        lineHeight: 1.55,
        textAlign: align === 'center' ? 'center' : 'start',
        display: 'flex',
        alignItems: align === 'center' ? 'center' : 'flex-start',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        gap: 6,
        ...style,
      }}
    >
      {icon && <span style={{ flexShrink: 0, lineHeight: 1.55 }}>{icon}</span>}
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
