/**
 * State.tsx — کامپوننت‌های حالت‌های ویژه (Loading/Error/Empty)
 * همه ماژول‌ها می‌توانند از این‌ها استفاده کنند
 */
import type { ReactNode } from 'react';

interface StateProps {
  icon?: string;
  title: string;
  hint?: string;
  action?: ReactNode;
}

export function Empty({ icon = '📭', title, hint, action }: StateProps) {
  return (
    <div style={{
      padding: 32, textAlign: 'center',
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
    }}>
      <div style={{ fontSize: 48, lineHeight: 1 }}>{icon}</div>
      <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700 }}>{title}</div>
      {hint ? (
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', lineHeight: 1.8, maxWidth: 320 }}>
          {hint}
        </div>
      ) : null}
      {action}
    </div>
  );
}

export function Loading({ text = 'در حال بارگذاری...' }: { text?: string }) {
  return (
    <div style={{
      padding: 32, textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10
    }}>
      <div className="spinner" />
      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)' }}>{text}</div>
    </div>
  );
}

export function ErrorState({ title = 'خطا در بارگذاری', hint, onRetry }: {
  title?: string; hint?: string; onRetry?: () => void;
}) {
  return (
    <div style={{
      padding: 32, textAlign: 'center',
      background: 'var(--danger-soft)', border: '1px solid var(--danger)',
      borderRadius: 'var(--r-lg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
    }}>
      <div style={{ fontSize: 48, lineHeight: 1 }}>⚠️</div>
      <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--danger)' }}>{title}</div>
      {hint ? (
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', lineHeight: 1.8 }}>{hint}</div>
      ) : null}
      {onRetry ? (
        <button
          onClick={onRetry}
          style={{
            marginTop: 8, padding: '8px 16px',
            background: 'var(--accent)', color: 'var(--btn-fg, white)',
            border: 'none', borderRadius: 'var(--r-md)',
            fontSize: 'var(--fs-sm)', fontWeight: 700, cursor: 'pointer'
          }}
        >
          تلاش دوباره
        </button>
      ) : null}
    </div>
  );
}
