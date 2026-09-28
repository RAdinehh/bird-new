import { useState, type ReactNode } from 'react';

interface Props {
  icon: string;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  tone?: 'accent' | 'warn' | 'info' | 'purple' | 'danger';
}

export default function SettingsGroup({
  icon,
  title,
  subtitle,
  defaultOpen = false,
  children,
  tone = 'accent'
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  const color = 'var(--' + tone + ')';
  const soft = 'var(--' + tone + '-soft)';
  const border = 'var(--' + tone + '-border)';

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid ' + (open ? border : 'var(--border)'),
      borderRadius: 'var(--r-lg)',
      overflow: 'hidden',
      transition: 'border-color .2s'
    }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: '13px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          background: open ? soft : 'transparent',
          transition: 'background .2s'
        }}
      >
        <div style={{
          width: 36, height: 36,
          borderRadius: 'var(--r-md)',
          background: open ? 'var(--card-solid)' : soft,
          border: '1px solid ' + (open ? border : 'transparent'),
          color: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
          flexShrink: 0
        }}>{icon}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 'var(--fs-base)',
            fontWeight: 700,
            color: open ? color : 'var(--text)'
          }}>{title}</div>
          {subtitle && !open ? (
            <div style={{
              fontSize: 'var(--fs-xs)',
              color: 'var(--muted)',
              marginTop: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>{subtitle}</div>
          ) : null}
        </div>

        <svg
          width="16" height="16" viewBox="0 0 24 24"
          fill="none"
          stroke={open ? color : 'var(--dim)'}
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform .25s',
            flexShrink: 0
          }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        transition: 'grid-template-rows 250ms cubic-bezier(.16,1,.3,1)',
        willChange: 'grid-template-rows'
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '12px 16px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--sp-3)',
            borderTop: '1px dashed var(--border)'
          }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
