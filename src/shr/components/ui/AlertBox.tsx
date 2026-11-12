/** AlertBox — کادر هشدار/اطلاع/موفقیت استاندارد (قانون ۳۴) */
import React from 'react';

type Tone = 'warn' | 'danger' | 'info' | 'success' | 'accent';
type Variant = 'dashed' | 'solid' | 'flat';
type Size = 'xs' | 'sm';
type Align = 'start' | 'center';

const TONE_MAP: Record<Tone, { color: string; soft: string; icon: string }> = {
  warn:    { color: 'var(--warn)',    soft: 'var(--warn-soft)',    icon: '⚠' },
  danger:  { color: 'var(--danger)',  soft: 'var(--danger-soft)',  icon: '⛔' },
  info:    { color: 'var(--info)',    soft: 'var(--info-soft)',    icon: 'ℹ' },
  success: { color: 'var(--success)', soft: 'var(--success-soft)', icon: '✓' },
  accent:  { color: 'var(--accent)',  soft: 'var(--accent-soft)',  icon: '•' },
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
  const t = TONE_MAP[tone];
  const borderStyle =
    variant === 'dashed' ? `1px dashed ${t.color}`
    : variant === 'solid' ? `1px solid ${t.color}`
    : 'none';
  const bg = variant === 'flat' ? t.soft : t.soft;
  const fontWeight = size === 'xs' ? 600 : 700;
  const fontSize = size === 'xs' ? 'var(--fs-xs)' : 'var(--fs-sm)';
  const showIcon = icon === undefined ? t.icon : icon;

  return (
    <div
      style={{
        padding: 'var(--pad-normal)',
        background: bg,
        border: borderStyle,
        borderRadius: 'var(--r-md)',
        fontSize,
        color: t.color,
        fontWeight,
        textAlign: align === 'center' ? 'center' : 'start',
        display: 'flex',
        alignItems: align === 'center' ? 'center' : 'flex-start',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        gap: 6,
        ...style,
      }}
    >
      {showIcon !== false && <span style={{ flexShrink: 0 }}>{showIcon}</span>}
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
