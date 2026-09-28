import React from 'react';

type AccentKey = 'accent' | 'warn' | 'dim' | 'purple' | 'info' | 'green' | 'amber' | 'blue' | 'gray';

interface Props {
  accent?: AccentKey;
  index?: number | string;
  icon?: React.ReactNode;
  iconEmoji?: string;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  summary?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

// همه‌ی رنگ‌های ممکن
const COLORS: Record<AccentKey, { c: string; s: string }> = {
  accent: { c: 'var(--accent)', s: 'var(--accent-soft)' },
  green:  { c: 'var(--accent)', s: 'var(--accent-soft)' },
  warn:   { c: 'var(--warn)',   s: 'var(--warn-soft)' },
  amber:  { c: 'var(--warn)',   s: 'var(--warn-soft)' },
  dim:    { c: 'var(--dim)',    s: 'var(--input-bg)' },
  gray:   { c: 'var(--dim)',    s: 'var(--input-bg)' },
  purple: { c: 'var(--purple)', s: 'var(--purple-soft)' },
  info:   { c: 'var(--info)',   s: 'var(--info-soft)' },
  blue:   { c: 'var(--info)',   s: 'var(--info-soft)' }
};

export default function ExpandableCard({
  accent = 'accent', index, iconEmoji = '📋',
  title, subtitle, badge, summary, isOpen, onToggle, children
}: Props) {
  const safeAccent = COLORS[accent] ? accent : 'accent';
  const { c: color, s: soft } = COLORS[safeAccent];

  return (
    <div style={{
      position: 'relative',
      background: 'var(--card)',
      backdropFilter: 'blur(8px)',
      border: `1px solid ${isOpen ? color : 'var(--border)'}`,
      borderRadius: 'var(--r-lg)',
      overflow: 'hidden',
      marginBottom: 8,
      transition: 'border-color .2s'
    }}>
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 4, background: color, zIndex: 1 }} />

      <div onClick={onToggle} style={{ padding: '12px 18px 12px 16px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 'var(--r-md)',
            background: soft, color: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0, position: 'relative'
          }}>
            {iconEmoji}
            {index !== undefined && (
              <span style={{
                position: 'absolute', top: -4, left: -4, width: 18, height: 18, borderRadius: '50%',
                background: color, color: 'var(--avatar-text)',
                fontSize: 'var(--fs-xs)', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--card-solid)'
              }}>{index}</span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</div>
          </div>

          {badge}

          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isOpen ? color : 'var(--dim)'} strokeWidth="2.5" strokeLinecap="round"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .25s', flexShrink: 0 }}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>

        {summary && (
          <div style={{
            display: 'flex', gap: 14, marginTop: 10, paddingTop: 10,
            borderTop: '1px dashed var(--border)',
            fontSize: 'var(--fs-xs)', color: 'var(--muted)', flexWrap: 'wrap'
          }}>{summary}</div>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateRows: isOpen ? '1fr' : '0fr',
        transition: 'grid-template-rows 250ms cubic-bezier(.16,1,.3,1)',
        willChange: 'grid-template-rows'
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ padding: '0 18px 14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
