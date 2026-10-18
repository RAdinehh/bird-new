/**
 * GuidedEmptyState.tsx — Empty state راهنمایی‌شده برای گله
 * طبق NN/g (Guided Empty State) + SAP Fiori + آنبوردینگ غیرخطی
 */
import { useNavigate } from 'react-router-dom';
import { Btn } from '../../../shr/components/ui';

interface Props {
  onManualAdd: () => void;
}

export default function GuidedEmptyState({ onManualAdd }: Props) {
  const nav = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--sp-3)',
      padding: 'var(--sp-4) var(--sp-3)',
      maxWidth: 480,
      margin: '0 auto',
    }}>
      {/* عنوان و توضیح */}
      <div style={{ textAlign: 'center', padding: 'var(--sp-3) 0' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }} aria-hidden="true">🐔</div>
        <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, marginBottom: 6 }}>
          هنوز گله‌ای ندارید
        </h2>
        <p style={{ fontSize: 'var(--fs-base)', color: 'var(--muted)', lineHeight: 1.8 }}>
          گله، واحد اصلی مدیریت در نرم‌افزار شماست. اولین گله خود را از یکی از سه راه زیر بسازید.
          تمام ثبت‌های روزانه، شاخص‌ها و گزارش‌ها خودکار به این گله متصل می‌شوند.
        </p>
      </div>

      {/* کارت ۱: خرید از معاملات */}
      <button
        type="button"
        onClick={() => nav('/tra')}
        style={{
          display: 'flex',
          gap: 12,
          padding: 'var(--sp-3)',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          textAlign: 'right',
          cursor: 'pointer',
          fontFamily: 'inherit',
          color: 'var(--text)',
          transition: 'border-color .15s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <div style={{
          width: 44, height: 44,
          background: 'var(--accent-soft)',
          color: 'var(--accent)',
          borderRadius: 'var(--r-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          flexShrink: 0,
        }} aria-hidden="true">🛒</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--fs-base)', marginBottom: 2 }}>
            از معاملات (خرید)
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.6 }}>
            مناسب خرید جوجه یا مرغ جدید.
            <br />
            <span style={{ color: 'var(--accent)' }}>تعداد، قیمت و تاریخ خودکار پر می‌شود.</span>
          </div>
        </div>
      </button>

      {/* کارت ۲: تفریخ از جوجه‌کشی */}
      <button
        type="button"
        onClick={() => nav('/inc')}
        style={{
          display: 'flex',
          gap: 12,
          padding: 'var(--sp-3)',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          textAlign: 'right',
          cursor: 'pointer',
          fontFamily: 'inherit',
          color: 'var(--text)',
          transition: 'border-color .15s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <div style={{
          width: 44, height: 44,
          background: 'var(--accent-soft)',
          color: 'var(--accent)',
          borderRadius: 'var(--r-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          flexShrink: 0,
        }} aria-hidden="true">🥚</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--fs-base)', marginBottom: 2 }}>
            از جوجه‌کشی (تفریخ)
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.6 }}>
            مناسب جوجه‌های تولیدی خودتان.
            <br />
            <span style={{ color: 'var(--accent)' }}>تعداد نر/ماده و批次 خودکار پر می‌شود.</span>
          </div>
        </div>
      </button>

      {/* کارت ۳: دستی */}
      <button
        type="button"
        onClick={onManualAdd}
        style={{
          display: 'flex',
          gap: 12,
          padding: 'var(--sp-3)',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          textAlign: 'right',
          cursor: 'pointer',
          fontFamily: 'inherit',
          color: 'var(--text)',
          transition: 'border-color .15s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--warn)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <div style={{
          width: 44, height: 44,
          background: 'var(--warn-soft)',
          color: 'var(--warn)',
          borderRadius: 'var(--r-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          flexShrink: 0,
        }} aria-hidden="true">✏️</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--fs-base)', marginBottom: 2 }}>
            ایجاد دستی (پیشرفته)
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.6 }}>
            مناسب ثبت گله‌های قدیمی یا یک‌باره.
            <br />
            <span style={{ color: 'var(--warn)' }}>⚠️ به فاکتور یا هچ لینک نمی‌شود؛ ممکن است هزینه‌ها دقیق نباشد.</span>
          </div>
        </div>
      </button>

      {/* راه فرار */}
      <p style={{ textAlign: 'center', fontSize: 'var(--fs-xs)', color: 'var(--dim)', marginTop: 'var(--sp-2)' }}>
        اگر مطمئن نیستید، اول در بخش <b>معاملات</b> یا <b>جوجه‌کشی</b> را ببینید.
      </p>
    </div>
  );
}
