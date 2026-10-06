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
      top: 90,
      left: 0,
      right: 0,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      pointerEvents: 'none',
      padding: '0 12px',
    }}>
      {toasts.map((t: Toast) => {
        const color = TYPE_COLOR[t.type];
        const isSuccess = t.type === 'success';
        return (
          <div
            key={t.id}
            onClick={() => remove(t.id)}
            role="status"
            aria-live="polite"
            style={{
              background: isSuccess ? 'var(--accent)' : 'var(--card-solid)',
              border: isSuccess ? 'none' : '1px solid ' + color,
              borderRadius: 12,
              padding: '8px 12px',
              maxWidth: 200,
              width: '100%',
              boxShadow: isSuccess
                ? '0 4px 12px rgba(0,0,0,.18), 0 2px 4px rgba(0,0,0,.10)'
                : '0 4px 12px rgba(0,0,0,.12), 0 2px 4px rgba(0,0,0,.06)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 'var(--fs-sm)',
              fontWeight: 600,
              color: isSuccess ? 'var(--avatar-text, #fff)' : 'var(--text)',
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
                background: isSuccess ? 'rgba(255,255,255,0.22)' : 'var(--card-solid)',
                color: isSuccess ? 'var(--avatar-text, #fff)' : color,
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
