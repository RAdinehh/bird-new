/**
 * ToastHost.tsx — نمایش Toast بالای صفحه
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

export default function ToastHost() {
  const toasts = useToast((s: any) => s.toasts);
  const remove = useToast((s: any) => s.remove);
  const channels = useSet((s: any) => s.channels);

  if (channels?.inApp === false) return null;
  if (!toasts || toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 8,
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
        return (
          <div
            key={t.id}
            onClick={() => remove(t.id)}
            style={{
              background: 'var(--card-solid)',
              border: '1px solid ' + color,
              borderRadius: 'var(--r-md)',
              padding: '10px 14px',
              minWidth: 240,
              maxWidth: 400,
              boxShadow: '0 4px 12px rgba(0,0,0,.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 'var(--fs-sm)',
              fontWeight: 600,
              color: 'var(--text)',
              pointerEvents: 'auto',
              cursor: 'pointer',
              animation: 'pmToastIn 200ms cubic-bezier(.16,1,.3,1)',
            }}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }} aria-hidden="true">{TYPE_ICON[t.type]}</span>
            <span style={{ flex: 1 }}>{t.message}</span>
          </div>
        );
      })}
      <style>{`
        @keyframes pmToastIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
