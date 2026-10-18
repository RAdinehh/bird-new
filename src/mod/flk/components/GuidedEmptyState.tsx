import { useNavigate } from 'react-router-dom';

interface Props {
  onManualAdd: () => void;
}

export default function GuidedEmptyState({ onManualAdd }: Props) {
  const nav = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--sp-6) var(--sp-4)', textAlign: 'center', width: '100%' }}>
      <div style={{ fontSize: 56, marginBottom: 'var(--sp-2)', lineHeight: 1 }} aria-hidden="true">🐔</div>
      <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--text)', marginBottom: 'var(--sp-1)' }}>
        هنوز گله‌ای ندارید
      </h2>
      <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', marginBottom: 'var(--sp-5)' }}>
        اولین گله خود را از یکی از این سه راه بسازید.
      </p>

      <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        {/* کادر خرید */}
        <button
          type="button"
          onClick={() => nav('/tra')}
          aria-label="ایجاد از معاملات (خرید)"
          style={{
            background: 'var(--accent-soft)',
            border: '1px solid var(--accent-border)',
            borderRadius: 'var(--r-lg)',
            padding: 'var(--sp-3) var(--sp-4)',
            display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
            cursor: 'pointer', textAlign: 'right', width: '100%', fontFamily: 'inherit'
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }} aria-hidden="true">🛒</div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: 'var(--accent)' }}>از معاملات (خرید)</div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.5 }}>تعداد، قیمت و تاریخ خودکار پر می‌شود</div>
          </div>
          <div style={{ color: 'var(--accent)', fontSize: 20, fontWeight: 300, marginLeft: 'var(--sp-1)' }} aria-hidden="true">‹</div>
        </button>

        {/* کادر جوجه‌کشی */}
        <button
          type="button"
          onClick={() => nav('/inc')}
          aria-label="ایجاد از جوجه‌کشی"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            padding: 'var(--sp-3) var(--sp-4)',
            display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
            cursor: 'pointer', textAlign: 'right', width: '100%', fontFamily: 'inherit'
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }} aria-hidden="true">🥚</div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 'var(--fs-md)', fontWeight: 600, color: 'var(--text)' }}>از جوجه‌کشی</div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.5 }}>انتقال خودکار جوجه‌های هچ‌شده</div>
          </div>
          <div style={{ color: 'var(--border)', fontSize: 20, fontWeight: 300, marginLeft: 'var(--sp-1)' }} aria-hidden="true">‹</div>
        </button>

        {/* کادر دستی */}
        <button
          type="button"
          onClick={onManualAdd}
          aria-label="ایجاد دستی"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            padding: 'var(--sp-3) var(--sp-4)',
            display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
            cursor: 'pointer', textAlign: 'right', width: '100%', fontFamily: 'inherit'
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }} aria-hidden="true">✏️</div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 'var(--fs-md)', fontWeight: 600, color: 'var(--text)' }}>ایجاد دستی</div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.5 }}>بدون اتصال به فاکتور یا جوجه‌کشی</div>
          </div>
          <div style={{ color: 'var(--border)', fontSize: 20, fontWeight: 300, marginLeft: 'var(--sp-1)' }} aria-hidden="true">‹</div>
        </button>
      </div>

      <div style={{ marginTop: 'var(--sp-5)', fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
        اگر مطمئن نیستید، ابتدا معاملات یا جوجه‌کشی را ببینید.
      </div>
    </div>
  );
}
