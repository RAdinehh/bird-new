import { useState, useEffect } from 'react';
import { useSet } from '../../mod/set/store';

interface Props {
  id: string;
  icon?: string;
  title: string;
  description: string;
  tone?: 'info' | 'warn' | 'success' | 'danger';
  actionLabel?: string;
  onAction?: () => void;
}

const TONE_COLORS: Record<string, { bg: string; border: string; fg: string; icon: string }> = {
  info: { bg: 'var(--info-soft)', border: 'var(--info)', fg: 'var(--info)', icon: 'ℹ️' },
  warn: { bg: 'var(--warn-soft)', border: 'var(--warn)', fg: 'var(--warn)', icon: '⚠️' },
  success: { bg: 'var(--accent-soft)', border: 'var(--accent-border)', fg: 'var(--accent)', icon: '✅' },
  danger: { bg: 'var(--danger-soft)', border: 'var(--danger)', fg: 'var(--danger)', icon: '❌' },
};

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

export default function HelpBanner({
  id, icon, title, description, tone = 'info', actionLabel, onAction,
}: Props) {
  const noAnim = useNoAnim();
  const [hidden, setHidden] = useState(false);
  const storageKey = 'help-banner-' + id;

  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey) === 'hidden') setHidden(true);
    } catch {
      /* silent */
    }
  }, [storageKey]);

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(storageKey, 'hidden');
    } catch {
      /* silent */
    }
  };

  if (hidden) return null;

  const c = TONE_COLORS[tone] || TONE_COLORS.info;

  return (
    <div
      role="region"
      aria-label={title}
      style={{
        padding: '10px 12px',
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 'var(--r-md)',
        marginBottom: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        position: 'relative',
        transition: noAnim ? 'none' : 'opacity var(--dur-base)',
      }}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="بستن راهنما"
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
          outline: 'none',
          borderRadius: 'var(--r-sm)',
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onFocus={e => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-soft)';
        }}
        onBlur={e => {
          e.currentTarget.style.opacity = '0.6';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        ✕
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          paddingLeft: 20,
          fontSize: 'var(--fs-sm)',
          fontWeight: 700,
          color: c.fg,
        }}
      >
        <span aria-hidden="true">{icon || c.icon}</span>
        <span>{title}</span>
      </div>

      <div
        style={{
          fontSize: 'var(--fs-xs)',
          lineHeight: 1.7,
          color: c.fg,
          paddingLeft: 20,
        }}
      >
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
            color: 'var(--avatar-text)',
            border: 'none',
            borderRadius: 'var(--r-sm)',
            fontSize: 'var(--fs-xs)',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            outline: 'none',
          }}
          onFocus={e => {
            e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-soft)';
          }}
          onBlur={e => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
