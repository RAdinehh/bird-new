/** components/ui/Sheet.tsx */
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export function Sheet({
  open, onClose, title, footer, children, noScroll = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** اگه true، بدنه اسکرول نمی‌شه و ارتفاع به محتوا میاد */
  noScroll?: boolean;
}) {
  // انیمیشن ورود: اول mount با translateY(100%)، بعد به translateY(0)
  const [mounted, setMounted] = React.useState(false);
  const [animating, setAnimating] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setMounted(true);
      setAnimating(true);
    } else {
      setAnimating(false);
      setMounted(false);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      data-sheet-open="true"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15,23,42,.45)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        touchAction: 'none',
        opacity: 1,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '100%',
          background: 'var(--card-solid, #fff)',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: '10px 14px 18px',
          boxShadow: '0 -8px 30px rgba(0,0,0,.25)',
          maxHeight: noScroll ? 'calc(100dvh - 80px)' : '85vh',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          transform: 'translateY(0)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--dim)', opacity: 0.5 }} />
        </div>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 4, gap: 8,
        }}>
          {title ? (
            <div style={{
              fontSize: 'var(--fs-md)', fontWeight: 700,
              textAlign: 'right', flex: 1, minWidth: 0,
            }}>{title}</div>
          ) : <div style={{ flex: 1 }} />}
          {/* Close button — چپ */}
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, flexShrink: 0,
              background: 'var(--btn-bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              color: 'var(--muted)',
              cursor: 'pointer', padding: 0,
              fontFamily: 'inherit',
              fontSize: 14,
              outline: 'none',
              transition: 'background var(--dur-fast) var(--ease-out)',
            }}
          >
            ✕
          </button>
        </div>
        <div style={{
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          minHeight: 0,
        }}>
          {children}
        </div>
        {footer ? <div style={{ paddingTop: 4 }}>{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}
