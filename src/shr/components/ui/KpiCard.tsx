import React from 'react';
import { toFa } from '../../utils/fa';

export type KpiTone = 'accent' | 'warn' | 'danger' | 'info' | 'purple';

interface KpiCardProps {
  icon: string;
  label: string;
  value: number | string;
  unit?: string;
  sub?: string;
  color?: KpiTone;
  tone?: KpiTone;
  onClick?: () => void;
  noFormat?: boolean;
  size?: 'md' | 'lg';
}

export function KpiCard({
  icon, label, value, unit, sub, color, tone, onClick, noFormat, size = 'md',
}: KpiCardProps) {
  const finalColor: KpiTone = color || tone || 'accent';
  const colors: Record<KpiTone, { bg: string; fg: string; border: string }> = {
    accent: { bg: 'var(--accent-soft)', fg: 'var(--accent)', border: 'var(--accent-border)' },
    warn:   { bg: 'var(--warn-soft)',   fg: 'var(--warn)',   border: 'var(--warn)' },
    danger: { bg: 'var(--danger-soft)', fg: 'var(--danger)', border: 'var(--danger)' },
    info:   { bg: 'var(--info-soft)',   fg: 'var(--info)',   border: 'var(--info)' },
    purple: { bg: 'var(--purple-soft)', fg: 'var(--purple)', border: 'var(--purple)' },
  };
  const c = colors[finalColor] || colors.accent;
  const displayValue = typeof value === 'number'
    ? (noFormat ? toFa(String(value)) : toFa(value.toLocaleString('fa-IR')))
    : String(value);

  if (size === 'lg') {
    return (
      <div style={{
        padding: '16px 10px', background: c.bg,
        border: `1px solid ${c.border}`, borderRadius: 'var(--r-md)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 4, textAlign: 'center', minHeight: 118,
      }}>
        <span style={{ fontSize: '1.8em', lineHeight: 1, marginBottom: 2 }}>{icon}</span>
        <div style={{ fontSize: 'var(--fs-xs)', color: c.fg, fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.15 }}>{displayValue}</div>
        {sub && <div style={{ fontSize: '10px', color: 'var(--muted)', lineHeight: 1.3 }}>{sub}</div>}
      </div>
    );
  }

  return (
    <div role="button" tabIndex={0} onClick={onClick} style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)', padding: '10px 8px 11px',
      cursor: onClick ? 'pointer' : 'default', minHeight: 92,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 5, textAlign: 'center', width: '100%', boxSizing: 'border-box',
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 9, background: c.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, lineHeight: 1, flexShrink: 0,
      }}>{icon}</div>
      <div style={{
        fontSize: 11, color: 'var(--muted)', fontWeight: 600,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
      }}>{label}</div>
      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
        <span style={{
          fontSize: 'clamp(15px, 3.8vw, 17px)', fontWeight: 800,
          color: 'var(--text)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.15,
        }}>{displayValue}</span>
        {unit ? <span style={{ fontSize: 10, color: 'var(--muted)', marginRight: 3 }}>{unit}</span> : null}
      </div>
      {sub ? <div style={{ fontSize: 10, color: 'var(--muted)' }}>{sub}</div> : null}
    </div>
  );
}
