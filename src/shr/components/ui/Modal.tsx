/** components/ui/Modal.tsx */
import React, { useRef, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  preventClose?: boolean;
  contentGap?: number;
  headerAction?: React.ReactNode;
  /** اگه true، وسط صفحه باز می‌شه (نه از پایین) */
  center?: boolean;
}
const MODAL_SIZES: Record<'sm' | 'md' | 'lg', number> = {
  sm: 320,
  md: 480,
  lg: 640,
};
export function Modal({
  open, onClose, title, children, footer,
  size = 'md', preventClose = false, contentGap, headerAction,
  center = false,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const focusedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const preventCloseRef = useRef(preventClose);
  preventCloseRef.current = preventClose;
  const titleId = useRef<string>('modal-title-' + Math.random().toString(36).slice(2, 9));

  // ─── Snap / drag (mobile bottom-sheet) ───
  const [snap, setSnap] = React.useState<'partial' | 'full'>('partial');
  const [dragY, setDragY] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const dragActive = useRef(false);
  const dragStartY = useRef(0);
  const dragLastY = useRef(0);
  const dragStartT = useRef(0);
  const rafRef = useRef(0);

  React.useEffect(() => {
    if (open) { setSnap('partial'); setDragY(0); setDragging(false); if (modalRef.current) modalRef.current.style.transform = ''; }
  }, [open]);

  const onDragStart = (e: React.TouchEvent) => {
    dragActive.current = true;
    dragStartY.current = e.touches[0].clientY;
    dragLastY.current = 0;
    dragStartT.current = Date.now();
    if (modalRef.current) modalRef.current.style.transition = 'none';
  };
  const onDragMove = (e: React.TouchEvent) => {
    if (!dragActive.current) return;
    const touchY = e.touches[0].clientY;
    const min = snap === 'full' ? 0 : -240;
    const dy = Math.max(min, Math.min(560, touchY - dragStartY.current));
    dragLastY.current = dy;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      if (modalRef.current) {
        modalRef.current.style.transform = `translateY(${dragLastY.current}px)`;
      }
    });
  };
  const onDragEnd = () => {
    if (!dragActive.current) return;
    dragActive.current = false;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0; }
    const dy = dragLastY.current;
    const dt = Math.max(1, Date.now() - dragStartT.current);
    const v = dy / dt;
    const fast = Math.abs(v) > 0.5;
    const el = modalRef.current;
    if (!el) return;

    if (snap === 'partial') {
      if (dy < -60 || (fast && v < -0.4)) {
        setSnap('full');
        el.style.transition = 'transform 300ms cubic-bezier(.2,.9,.3,1)';
        el.style.transform = '';
        return;
      }
      if (dy > 110 || (fast && v > 0.5)) {
        el.style.transition = 'transform 240ms ease-out';
        el.style.transform = `translateY(${window.innerHeight}px)`;
        setTimeout(() => {
          if (!preventCloseRef.current) onCloseRef.current();
        }, 240);
        return;
      }
    } else {
      if (dy > 60 || (fast && v > 0.4)) {
        setSnap('partial');
        el.style.transition = 'transform 300ms cubic-bezier(.2,.9,.3,1)';
        el.style.transform = '';
        return;
      }
    }
    el.style.transition = 'transform 300ms cubic-bezier(.2,.9,.3,1)';
    el.style.transform = '';
  };

  // Esc + body scroll lock + focus return
  useEffect(() => {
    if (!open) return;
    window.__modalDepth = (window.__modalDepth || 0) + 1;

    previousFocus.current = document.activeElement as HTMLElement;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !preventCloseRef.current) {
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    // autofocus فقط بار اول — فقط روی دکمه‌ها (کیبورد خودکار باز نشود)
    if (!focusedRef.current) {
      focusedRef.current = true;
      const t = setTimeout(() => {
        // اگه کاربر خودش چیزی focus کرده، دست نزن
        const active = document.activeElement as HTMLElement | null;
        if (active && modalRef.current?.contains(active)) return;
        let target: HTMLElement | null = null;
        const btns = modalRef.current?.querySelectorAll('button:not([disabled])');
        if (btns && btns.length > 0) {
          for (let i = btns.length - 1; i >= 0; i--) {
            const btn = btns[i] as HTMLElement;
            const text = (btn.textContent || '').trim();
            const aria = btn.getAttribute('aria-label') || '';
            const isClose = /^[✕×xX]$/.test(text)
              || aria.includes('بستن')
              || aria.includes('close')
              || aria.includes('Close');
            if (!isClose) { target = btn; break; }
          }
        }
        if (target) {
          try { target.focus({ preventScroll: true }); } catch { /* silent */ }
        }
      }, 250);
      // اگه Modal بسته شد، تایمر پاک شه
      (window as any).__modalFocusTimers = (window as any).__modalFocusTimers || [];
      (window as any).__modalFocusTimers.push(() => clearTimeout(t));
    }

    return () => {
      window.__modalDepth = Math.max(0, (window.__modalDepth || 0) - 1);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      // برگشت focus
      try {
        previousFocus.current?.focus();
      } catch {
        /* silent */
      }
    };
  }, [open]);

  // Focus trap: Tab / Shift+Tab
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

  // تشخیص prefers-reduced-motion
  const [prefersReduced, setPrefersReduced] = React.useState(false);
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
  const noAnim = prefersReduced;

  if (!open) return null;

  const maxWidth = MODAL_SIZES[size] || MODAL_SIZES.md;
  const isFull = snap === 'full';

  return createPortal(

    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !preventClose) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay)',
        zIndex: 100 + (window.__modalDepth || 0),
        display: 'flex',
        alignItems: center ? 'center' : 'flex-end',
        justifyContent: 'center',
        padding: center ? '16px' : 0,
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId.current}
        onKeyDown={handleKeyDown}
        style={{
          background: 'var(--card-solid)',
          borderTopLeftRadius: isFull ? 0 : 'var(--r-2xl)',
          borderTopRightRadius: isFull ? 0 : 'var(--r-2xl)',
          borderBottomLeftRadius: center && !isFull ? 'var(--r-2xl)' : 0,
          borderBottomRightRadius: center && !isFull ? 'var(--r-2xl)' : 0,
          boxSizing: 'border-box',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          width: '100%',
          maxWidth,
          maxHeight: isFull ? '100%' : '85vh',
          height: isFull ? '100%' : undefined,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'max-height 320ms cubic-bezier(.2,.9,.3,1), height 320ms cubic-bezier(.2,.9,.3,1), border-radius 220ms ease, transform 300ms cubic-bezier(.2,.9,.3,1)',
        }}
      >
        {/* Drag handle (فقط موبایل و نه در حالت center) */}
        {!center && (
        <div
          onTouchStart={onDragStart}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
          onTouchCancel={onDragEnd}
          style={{
            padding: '14px 0 10px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'grab',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            flexShrink: 0,
          }}
        >
          <div style={{
            width: 48, height: 5, borderRadius: 3,
            background: 'var(--border)',
          }} />
        </div>
        )}
        {/* Header */}
        <div
          style={{
            padding: 'calc(10px + env(safe-area-inset-top)) 14px 10px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div
            id={titleId.current}
            style={{ flex: 1, fontSize: 'var(--fs-lg)', fontWeight: 700 }}
          >
            {title}
          </div>
          {headerAction}
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--r-md)',
              background: 'var(--btn-bg)',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'inherit',
              fontSize: 14,
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-soft)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '0 14px 14px 14px',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: contentGap ?? 12,
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: '10px 14px 18px',
              borderTop: '1px solid var(--border)',
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
