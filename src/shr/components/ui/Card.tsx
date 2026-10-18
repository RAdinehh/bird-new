/** components/ui/Card.tsx */
import React from 'react';

interface CardProps {
  accent?: 'accent' | 'warn' | 'dim' | 'purple';
  onClick?: () => void; children: React.ReactNode; style?: React.CSSProperties;
}
export function Card({ accent = 'accent', onClick, children, style }: CardProps) {
  const colors = { accent: 'var(--accent)', warn: 'var(--warn)', dim: 'var(--dim)', purple: 'var(--purple)' };
  return (
    <div onClick={onClick} style={{
      position: 'relative', background: 'var(--card)',
      border: '1px solid var(--border)', borderRadius: 'var(--r-lg)',
      padding: 'var(--sp-3) var(--sp-4)', overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default', minWidth: 0, ...style
    }}>
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 4, background: colors[accent] }} />
      {children}
    </div>
  );
}
export function Tag({
  tone = 'gray',
  children,
}: {
  tone?: 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'purple' | 'accent' | 'warn' | 'danger' | 'info' | 'dim';
  children: React.ReactNode;
}) {
  const tones: Record<string, { bg: string; color: string }> = {
    green: { bg: 'var(--accent-soft)', color: 'var(--accent)' },
    accent: { bg: 'var(--accent-soft)', color: 'var(--accent)' },
    amber: { bg: 'var(--warn-soft)', color: 'var(--warn)' },
    warn: { bg: 'var(--warn-soft)', color: 'var(--warn)' },
    red: { bg: 'var(--danger-soft)', color: 'var(--danger)' },
    danger: { bg: 'var(--danger-soft)', color: 'var(--danger)' },
    blue: { bg: 'var(--info-soft)', color: 'var(--info)' },
    info: { bg: 'var(--info-soft)', color: 'var(--info)' },
    gray: { bg: 'var(--input-bg)', color: 'var(--muted)' },
    dim: { bg: 'var(--input-bg)', color: 'var(--dim)' },
    purple: { bg: 'var(--purple-soft)', color: 'var(--purple)' },
  };
  const t = tones[tone] || tones.gray;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 'var(--fs-xs)',
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: 'var(--r-sm)',
        background: t.bg,
        color: t.color,
        whiteSpace: 'nowrap',
        lineHeight: 1.5,
      }}
    >
      {children}
    </span>
  );
}
interface EmptyProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  action?: React.ReactNode;
  tone?: 'accent' | 'warn' | 'info' | 'danger';
}
export function Empty({ icon, title, desc, action, tone = 'accent' }: EmptyProps) {
  const toneBg: Record<string, string> = {
    accent: 'var(--accent-soft)',
    warn: 'var(--warn-soft)',
    info: 'var(--info-soft)',
    danger: 'var(--danger-soft)',
  };
  const toneColor: Record<string, string> = {
    accent: 'var(--accent)',
    warn: 'var(--warn)',
    info: 'var(--info)',
    danger: 'var(--danger)',
  };

  return (
    <div
      role="status"
      data-empty-cta={action ? 'true' : 'false'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 'var(--r-xl)',
          background: toneBg[tone],
          color: toneColor[tone],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700 }}>{title}</div>
      <div
        style={{
          fontSize: 'var(--fs-base)',
          color: 'var(--muted)',
          lineHeight: 1.8,
          maxWidth: 280,
        }}
      >
        {desc}
      </div>
      {action}
    </div>
  );
}
export function Chip({
  active,
  onClick,
  children,
  tone = 'accent',
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  tone?: 'accent' | 'warn' | 'danger' | 'info' | 'purple';
}) {
  const activeBg: Record<string, string> = {
    accent: 'var(--accent-soft)',
    warn: 'var(--warn-soft)',
    danger: 'var(--danger-soft)',
    info: 'var(--info-soft)',
    purple: 'var(--purple-soft)',
  };
  const activeBorder: Record<string, string> = {
    accent: 'var(--accent-border)',
    warn: 'var(--warn)',
    danger: 'var(--danger)',
    info: 'var(--info)',
    purple: 'var(--purple)',
  };
  const activeColor: Record<string, string> = {
    accent: 'var(--accent)',
    warn: 'var(--warn)',
    danger: 'var(--danger)',
    info: 'var(--info)',
    purple: 'var(--purple)',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: '6px 11px',
        fontSize: 'var(--fs-sm)',
        background: active ? activeBg[tone] : 'var(--btn-bg)',
        border: '1px solid ' + (active ? activeBorder[tone] : 'var(--border)'),
        borderRadius: 'var(--r-sm)',
        color: active ? activeColor[tone] : 'var(--muted)',
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
        outline: 'none',
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-soft)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {children}
    </button>
  );
}
