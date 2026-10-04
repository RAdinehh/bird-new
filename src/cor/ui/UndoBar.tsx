import { useEffect, useState } from 'react';
import { useSet } from '../../mod/set/store';

interface UndoBarProps {
  label: string;
  onUndo: () => void;
  onDismiss?: () => void;
  duration?: number;
}

export default function UndoBar({ label, onUndo, onDismiss, duration = 5000 }: UndoBarProps) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!onDismiss || paused) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [onDismiss, paused, duration]);

  const lowPower = useSet((st: any) => st.lowPowerMode);
  const noAnim = !!lowPower;

  return (
    <div
      role="alert"
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        position: 'fixed',
        bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 90,
        maxWidth: 460,
        width: 'calc(100% - 32px)',
        background: 'var(--accent)',
        color: 'var(--avatar-text, #fff)',
        borderRadius: 16,
        padding: '12px 16px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: '0 10px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.1)',
        animation: noAnim ? 'none' : 'pmSheetIn 260ms cubic-bezier(.16,1,.3,1)',
        direction: 'rtl',
      }}
    >
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 'var(--fs-sm)', fontWeight: 600 }}>
        {label}
      </span>
      <button
        type="button"
        onClick={onUndo}
        aria-label="بازگردانی"
        style={{
          background: 'rgba(255,255,255,0.18)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 10,
          color: 'inherit',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 'var(--fs-sm)',
          padding: '7px 14px',
          flexShrink: 0,
        }}
      >
        بازگردانی
      </button>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="بستن"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 16,
            padding: '4px 6px',
            opacity: 0.75,
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      )}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          left: 0,
          height: 3,
          background: 'rgba(255,255,255,0.2)',
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            background: 'rgba(255,255,255,0.85)',
            animation: (noAnim || paused) ? 'none' : `pmUndoProgress ${duration}ms linear forwards`,
            transformOrigin: 'right',
          }}
        />
      </div>
    </div>
  );
}
