import { toFa } from '../utils/fa';

interface Props {
  error: Error;
  errorInfo: { componentStack?: string };
  onReset: () => void;
  onReload: () => void;
  onGoHome: () => void;
}

export default function ErrorFallback({ error, errorInfo, onReset, onReload, onGoHome }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)',
      padding: '24px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      maxWidth: 480,
      margin: '0 auto'
    }}>

      <div style={{
        width: 80, height: 80,
        borderRadius: '50%',
        background: 'var(--danger-soft)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 40
      }}>⚠</div>

      <div style={{
        fontSize: 'var(--fs-xl)',
        fontWeight: 700,
        textAlign: 'center',
        color: 'var(--danger)'
      }}>
        خطایی رخ داد
      </div>

      <div style={{
        fontSize: 'var(--fs-sm)',
        color: 'var(--muted)',
        textAlign: 'center',
        lineHeight: 1.9,
        maxWidth: 320
      }}>
        متأسفانه یک خطای غیرمنتظره پیش آمد. می‌توانید:
        <br />
        صفحه را دوباره بارگذاری کنید یا به داشبورد برگردید.
        <br />
        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--dim)' }}>
          داده‌های شما محفوظ است.
        </span>
      </div>

      {/* جزئیات خطا (فقط برای کاربر پیشرفته) */}
      <details style={{
        width: '100%',
        maxWidth: 400,
        background: 'var(--input-bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        padding: '10px 12px',
        fontSize: 'var(--fs-xs)',
        color: 'var(--muted)'
      }}>
        <summary style={{
          cursor: 'pointer',
          fontWeight: 700,
          color: 'var(--text)',
          padding: '4px 0'
        }}>
          🔍 جزئیات فنی
        </summary>
        <div style={{
          marginTop: 8,
          padding: '8px 10px',
          background: 'var(--card-solid)',
          borderRadius: 'var(--r-sm)',
          fontFamily: 'monospace',
          fontSize: 11,
          color: 'var(--danger)',
          wordBreak: 'break-word',
          maxHeight: 150,
          overflowY: 'auto',
          direction: 'ltr',
          textAlign: 'left'
        }}>
          {error.name}: {error.message}
          {errorInfo.componentStack ? '\n\n' + errorInfo.componentStack.slice(0, 500) : ''}
        </div>
        <button
          type="button"
          onClick={() => {
            const text = error.name + ': ' + error.message + '\n\n' + (errorInfo.componentStack || '');
            navigator.clipboard.writeText(text).catch(() => {});
          }}
          style={{
            marginTop: 6,
            padding: '4px 10px',
            background: 'var(--btn-bg)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            color: 'var(--muted)',
            fontSize: 'var(--fs-xs)',
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          📋 کپی متن خطا
        </button>
      </details>

      {/* دکمه‌ها */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: '100%',
        maxWidth: 320,
        marginTop: 8
      }}>
        <button
          type="button"
          onClick={onGoHome}
          style={{
            padding: '12px 16px',
            background: 'var(--accent)',
            color: 'var(--avatar-text)',
            border: 'none',
            borderRadius: 10,
            fontFamily: 'inherit',
            fontSize: 'var(--fs-base)',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          🏠 بازگشت به داشبورد
        </button>

        <button
          type="button"
          onClick={onReset}
          style={{
            padding: '12px 16px',
            background: 'var(--btn-bg)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            fontFamily: 'inherit',
            fontSize: 'var(--fs-base)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          🔄 تلاش مجدد
        </button>

        <button
          type="button"
          onClick={onReload}
          style={{
            padding: '12px 16px',
            background: 'var(--btn-bg)',
            color: 'var(--muted)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            fontFamily: 'inherit',
            fontSize: 'var(--fs-base)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          ↻ بارگذاری مجدد صفحه
        </button>
      </div>
    </div>
  );
}
