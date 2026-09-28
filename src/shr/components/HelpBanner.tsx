import { useState, useEffect } from 'react';

interface Props {
  id: string;              // کد یکتا برای ذخیره در localStorage
  icon?: string;           // ایموجی
  title: string;
  description: string;
  tone?: 'info' | 'warn' | 'success' | 'danger';
  actionLabel?: string;    // دکمه اختیاری
  onAction?: () => void;
}

const TONE_COLORS: Record<string, { bg: string; border: string; fg: string; icon: string }> = {
  info:    { bg: 'var(--info-soft)',   border: 'var(--info)',   fg: 'var(--info)',   icon: 'ℹ️' },
  warn:    { bg: 'var(--warn-soft)',   border: 'var(--warn)',   fg: 'var(--warn)',   icon: '⚠️' },
  success: { bg: 'var(--accent-soft)', border: 'var(--accent-border)', fg: 'var(--accent)', icon: '✅' },
  danger:  { bg: 'var(--danger-soft)', border: 'var(--danger)', fg: 'var(--danger)', icon: '❌' },
};

export default function HelpBanner({
  id, icon, title, description, tone = 'info', actionLabel, onAction
}: Props) {
  const [hidden, setHidden] = useState(false);
  const storageKey = 'help-banner-' + id;

  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey) === 'hidden') setHidden(true);
    } catch {}
  }, [storageKey]);

  const dismiss = () => {
    setHidden(true);
    try { localStorage.setItem(storageKey, 'hidden'); } catch {}
  };

  if (hidden) return null;

  const c = TONE_COLORS[tone] || TONE_COLORS.info;

  return (
    <div style={{
      padding: '10px 12px',
      background: c.bg,
      border: '1px solid ' + c.border,
      borderRadius: 'var(--r-md)',
      marginBottom: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      position: 'relative',
    }}>
      <button
        type="button"
        onClick={dismiss}
        style={{
          position: 'absolute',
          top: 6,
          left: 6,
          background: 'transparent',
          border: 'none',
          color: c.fg,
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 14,
          opacity: 0.6,
          padding: 4,
        }}
        title="بستن"
      >✕</button>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        paddingLeft: 20,
        fontSize: 'var(--fs-sm)',
        fontWeight: 700,
        color: c.fg,
      }}>
        <span>{icon || c.icon}</span>
        <span>{title}</span>
      </div>

      <div style={{
        fontSize: 'var(--fs-xs)',
        lineHeight: 1.7,
        color: c.fg,
        paddingLeft: 20,
      }}>
        {description}
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            alignSelf: 'flex-start',
            marginLeft: 20,
            marginTop: 2,
            padding: '5px 12px',
            background: c.fg,
            color: 'white',
            border: 'none',
            borderRadius: 'var(--r-sm)',
            fontSize: 'var(--fs-xs)',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
