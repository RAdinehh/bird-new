interface Props {
  error: Error;
  errorInfo: { componentStack?: string };
  onReset: () => void;
  onReload: () => void;
  onGoHome: () => void;
}

export default function ErrorFallback({ onReset, onReload, onGoHome }: Props) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'var(--card-solid)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg, 16px)',
          padding: '28px 22px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--accent-soft, var(--input-bg))',
            color: 'var(--accent)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          ↻
        </div>

        <div
          style={{
            fontSize: 'var(--fs-lg, 18px)',
            fontWeight: 700,
            color: 'var(--text)',
          }}
        >
          امکان نمایش این بخش وجود نداشت
        </div>

        <div
          style={{
            fontSize: 'var(--fs-sm, 14px)',
            color: 'var(--muted)',
            lineHeight: 1.85,
          }}
        >
          دوباره تلاش کنید یا به صفحهٔ اصلی بازگردید.
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            width: '100%',
            marginTop: 6,
          }}
        >
          <button
            type="button"
            onClick={onReset}
            style={{
              padding: '12px 16px',
              background: 'var(--accent)',
              color: 'var(--avatar-text)',
              border: 'none',
              borderRadius: 10,
              fontFamily: 'inherit',
              fontSize: 'var(--fs-base, 15px)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            تلاش مجدد
          </button>

          <button
            type="button"
            onClick={onGoHome}
            style={{
              padding: '12px 16px',
              background: 'var(--btn-bg)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              fontFamily: 'inherit',
              fontSize: 'var(--fs-base, 15px)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            بازگشت به داشبورد
          </button>

          <button
            type="button"
            onClick={onReload}
            style={{
              padding: '10px 14px',
              background: 'transparent',
              color: 'var(--muted)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              fontFamily: 'inherit',
              fontSize: 'var(--fs-sm, 13px)',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            بارگذاری مجدد صفحه
          </button>
        </div>
      </div>
    </div>
  );
}
