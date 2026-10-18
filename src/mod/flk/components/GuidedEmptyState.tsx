/**
 * GuidedEmptyState.tsx — Empty state راهنمایی‌شده برای گله
 * طبق NN/g (Guided Empty State) + SAP Fiori
 * طراحی: فشرده، ۳ مسیر، فارسی خالص
 */
import { useNavigate } from 'react-router-dom';

interface Props {
  onManualAdd: () => void;
}

export default function GuidedEmptyState({ onManualAdd }: Props) {
  const nav = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: '16px 12px',
      maxWidth: 480,
      margin: '0 auto',
    }}>
      {/* عنوان و توضیح — فشرده */}
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <div style={{ fontSize: 40, marginBottom: 6 }} aria-hidden="true">🐔</div>
        <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, marginBottom: 4 }}>
          هنوز گله‌ای ندارید
        </h2>
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', lineHeight: 1.6 }}>
          اولین گله خود را از یکی از این سه راه بسازید.
        </p>
      </div>

      {/* کارت ۱: خرید از معاملات */}
      <button
        type="button"
        onClick={() => nav('/tra')}
        style={{
          display: 'flex',
          gap: 10,
          padding: '10px 12px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          textAlign: 'right',
          cursor: 'pointer',
          fontFamily: 'inherit',
          color: 'var(--text)',
          alignItems: 'center',
          transition: 'border-color .15s, background .15s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <div style={{
          width: 36, height: 36,
          background: 'var(--accent-soft)',
          color: 'var(--accent)',
          borderRadius: 'var(--r-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          flexShrink: 0,
        }} aria-hidden="true">🛒</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--fs-base)', marginBottom: 2 }}>
            از معاملات (خرید)
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
            تعداد، قیمت و تاریخ خودکار
          </div>
        </div>
        <div style={{ color: 'var(--dim)', fontSize: 16 }} aria-hidden="true">‹</div>
      </button>

      {/* کارت ۲: تفریخ از جوجه‌کشی */}
      <button
        type="button"
        onClick={() => nav('/inc')}
        style={{
          display: 'flex',
          gap: 10,
          padding: '10px 12px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          textAlign: 'right',
          cursor: 'pointer',
          fontFamily: 'inherit',
          color: 'var(--text)',
          alignItems: 'center',
          transition: 'border-color .15s, background .15s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <div style={{
          width: 36, height: 36,
          background: 'var(--accent-soft)',
          color: 'var(--accent)',
          borderRadius: 'var(--r-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          flexShrink: 0,
        }} aria-hidden="true">🥚</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--fs-base)', marginBottom: 2 }}>
            از جوجه‌کشی (تفریخ)
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
            تعداد نر/ماده خودکار
          </div>
        </div>
        <div style={{ color: 'var(--dim)', fontSize: 16 }} aria-hidden="true">‹</div>
      </button>

      {/* کارت ۳: دستی */}
      <button
        type="button"
        onClick={onManualAdd}
        style={{
          display: 'flex',
          gap: 10,
          padding: '10px 12px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          textAlign: 'right',
          cursor: 'pointer',
          fontFamily: 'inherit',
          color: 'var(--text)',
          alignItems: 'center',
          transition: 'border-color .15s, background .15s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--warn)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <div style={{
          width: 36, height: 36,
          background: 'var(--warn-soft)',
          color: 'var(--warn)',
          borderRadius: 'var(--r-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          flexShrink: 0,
        }} aria-hidden="true">✏️</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--fs-base)', marginBottom: 2 }}>
            ایجاد دستی (پیشرفته)
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)' }}>
            ⚠️ بدون اتصال به فاکتور/هچ
          </div>
        </div>
        <div style={{ color: 'var(--dim)', fontSize: 16 }} aria-hidden="true">‹</div>
      </button>

      {/* راهنمای پایین */}
      <p style={{ textAlign: 'center', fontSize: 'var(--fs-xs)', color: 'var(--dim)', marginTop: 4 }}>
        اگر مطمئن نیستید، ابتدا معاملات یا جوجه‌کشی را ببینید.
      </p>
    </div>
  );
}
