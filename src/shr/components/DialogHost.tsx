import { useEffect, useRef, useCallback, useState } from 'react';
import { useDialog, type DialogType } from '../../cor/store/dialog';
import { Btn } from './ui';
import { useSet } from '../../mod/set/store';
import { playBeep, vibrate } from '../../shr/utils/audio';

const TYPE_CONFIG: Record<DialogType, { icon: string; color: string }> = {
  alert: { icon: '⚠', color: 'warn' },
  confirm: { icon: '❓', color: 'accent' },
  success: { icon: '✅', color: 'accent' },
  error: { icon: '✕', color: 'danger' },
  danger: { icon: '🚨', color: 'danger' },
  info: { icon: 'ℹ️', color: 'info' },
};

function useNoAnim() {
  const lowPower = useSet((st: any) => st.lowPowerMode);
  const [prefersReduced, setPrefersReduced] = useState(false);
  useEffect(() => {
    try {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReduced(mq.matches);
      const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } catch {
      /* silent */
    }
  }, []);
  return !!(lowPower || prefersReduced);
}



/** چک ساعت سکوت */
function isQuietHour(): boolean {
  try {
    const s = useSet.getState();
    if (!s.quietHours?.enabled) return false;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const current = `${hh}:${mm}`;
    const from = s.quietHours.from || '22:00';
    const to = s.quietHours.to || '07:00';
    // اگه from > to (مثل 22 تا 7)
    if (from > to) {
      return current >= from || current <= to;
    }
    return current >= from && current <= to;
  } catch {
    return false;
  }
}

export default function DialogHost() {
  const { open, config, close } = useDialog();
  const noAnim = useNoAnim();

  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const confirmBtnId = useRef('dialog-confirm-' + Math.random().toString(36).slice(2, 9));
  const titleId = useRef('dialog-title-' + Math.random().toString(36).slice(2, 9));
  const messageId = useRef('dialog-msg-' + Math.random().toString(36).slice(2, 9));

  const handleConfirm = useCallback(() => {
    try {
      config?.onConfirm?.();
    } catch {
      /* silent */
    }
    close();
  }, [config, close]);

  const handleCancel = useCallback(() => {
    try {
      config?.onCancel?.();
    } catch {
      /* silent */
    }
    close();
  }, [config, close]);

  // Focus + Esc + scroll lock
  useEffect(() => {
    if (!open) return;

    previousFocus.current = document.activeElement as HTMLElement;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      // برای danger، focus روی cancel (امن‌ترین)
      if (type === 'danger' || type === 'confirm') {
        const cancelBtn = modalRef.current?.querySelector('button:not([id])') as HTMLElement;
        if (cancelBtn) { cancelBtn.focus(); return; }
      }
      const btn = document.getElementById(confirmBtnId.current);
      btn?.focus();
    }, 100);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      try {
        previousFocus.current?.focus();
      } catch {
        /* silent */
      }
    };
  }, [open, handleCancel]);

  // Focus trap
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const focusables = modalRef.current?.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables || focusables.length === 0) return;

    const first = focusables[0] as HTMLElement;
    const last = focusables[focusables.length - 1] as HTMLElement;
    const active = document.activeElement;

    if (e.shiftKey) {
      if (active === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  // صدای بوق + لرزش هنگام باز شدن دیالوگ
  useEffect(() => {
    if (!open || !config) return;
    try {
      const s = useSet.getState();
      if (s.channels?.sound !== false) playBeep(config.type);
      if (s.channels?.vibration !== false) vibrate(config.type);
    } catch {}
  }, [open, config?.type]);

  if (!open || !config) return null;

  // چک کانال in-app
  try {
    const s = useSet.getState();
    if (s.channels && s.channels.inApp === false) return null;
    if (isQuietHour() && (config.type === 'info' || config.type === 'success')) {
      return null; // ساعات سکوت فقط info/success رو بلاک می‌کنه
    }
  } catch {}

  const type: DialogType = config.type || 'info';
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.info;

  const color = `var(--${cfg.color})`;
  const soft = `var(--${cfg.color}-soft)`;

  const isConfirm = type === 'confirm' || type === 'danger';

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCancel();
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId.current}
        aria-describedby={config.message ? messageId.current : undefined}
        onKeyDown={handleKeyDown}
        style={{
          background: 'var(--card-solid)',
          borderRadius: 'var(--r-2xl)',
          width: '100%',
          maxWidth: 320,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '20px 20px 16px',
          gap: 12,
          animation: noAnim
            ? 'none'
            : 'pmScaleIn var(--dur-enter) var(--ease-out)',
          boxShadow: 'var(--shadow)',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: soft,
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {cfg.icon}
        </div>

        {config.title && (
          <div
            id={titleId.current}
            style={{
              fontSize: 'var(--fs-md)',
              fontWeight: 700,
              textAlign: 'center',
              color: 'var(--text)',
              lineHeight: 1.5,
            }}
          >
            {config.title}
          </div>
        )}

        {config.message && (
          <div
            id={messageId.current}
            style={{
              fontSize: 'var(--fs-sm)',
              color: 'var(--muted)',
              textAlign: 'center',
              lineHeight: 1.8,
              whiteSpace: 'pre-wrap',
            }}
          >
            {config.message}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: 8,
            width: '100%',
            marginTop: 4,
          }}
        >
          {isConfirm && (
            <Btn onClick={handleCancel} style={{ flex: 1 }}>
              {config.cancelText || 'لغو'}
            </Btn>
          )}
          <Btn
            id={confirmBtnId.current}
            variant={type === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            style={{ flex: 1 }}
          >
            {config.confirmText || 'تأیید'}
          </Btn>
        </div>
      </div>
    </div>
  );
}
