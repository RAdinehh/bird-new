/**
 * ToastHost.tsx — نمایش Toast زیر Header (استاندارد Material Design 3)
 */
import { useToast } from '../../cor/store/toast';
import type { Toast, ToastType } from '../../cor/store/toast';
import { useSet } from '../../mod/set/store';

const TYPE_ICON: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  warn: '⚠️',
  info: 'ℹ️',
};

const TYPE_COLOR: Record<ToastType, string> = {
  success: 'var(--accent)',
  error: 'var(--danger)',
  warn: 'var(--warn)',
  info: 'var(--info)',
};

const TYPE_SOFT: Record<ToastType, string> = {
  success: 'var(--accent-soft)',
  error: 'var(--danger-soft)',
  warn: 'var(--warn-soft)',
  info: 'var(--info-soft)',
};

export default function ToastHost() {
  const toasts = useToast((s: any) => s.toasts);
  const remove = useToast((s: any) => s.remove);
  const channels = useSet((s: any) => s.channels);

  if (channels?.inApp === false) return null;
  if (!toasts || toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 68,
      left: 0,
      right: 0,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      pointerEvents: 'none',
      padding: '0 12px',
    }}>
      {toasts.map((t: Toast) => {
        const color = TYPE_COLOR[t.type];
        const soft = TYPE_SOFT[t.type];
        return (
          <div
            key={t.id}
            onClick={() => remove(t.id)}
            role="status"
            aria-live="polite"
            style={{
              background: 'var(--card-solid)',
              border: '1px solid ' + color,
              borderRight: '3px solid ' + color,
              borderRadius: 'var(--r-md)',
              padding: '6px 10px',
              maxWidth: 300,
              boxShadow: '0 3px 10px rgba(0,0,0,.10), 0 1px 3px rgba(0,0,0,.06)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 'var(--fs-xs)',
              fontWeight: 600,
              color: 'var(--text)',
              pointerEvents: 'auto',
              cursor: 'pointer',
              animation: 'pmToastIn 220ms cubic-bezier(.16,1,.3,1)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 22, height: 22, borderRadius: '50%',
                background: soft, color: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, flexShrink: 0,
              }}
            >{TYPE_ICON[t.type]}</span>
            <span style={{ flex: 1, lineHeight: 1.6, wordBreak: 'break-word' }}>{t.message}</span>
          </div>
        );
      })}
      <style>{`
        @keyframes pmToastIn {
          from { opacity: 0; transform: translateY(-12px) scale(.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
