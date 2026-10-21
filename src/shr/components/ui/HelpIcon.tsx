import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  text: string;
}

export function HelpIcon({ text }: Props) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  // موقعیت‌یابی دقیق برای جلوگیری از بیرون‌زدگی
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const btnRect = btnRef.current.getBoundingClientRect();
    const popoverWidth = Math.min(240, window.innerWidth - 32);
    const popoverHeight = 80; // تخمین ارتفاع
    const margin = 8;

    let left = btnRect.left - popoverWidth + btnRect.width;
    let top = btnRect.bottom + 6;

    // جلوگیری از بیرون‌زدگی از سمت راست
    if (left + popoverWidth > window.innerWidth - margin) {
      left = window.innerWidth - popoverWidth - margin;
    }
    // جلوگیری از بیرون‌زدگی از سمت چپ
    if (left < margin) left = margin;
    // جلوگیری از بیرون‌زدگی از پایین
    if (top + popoverHeight > window.innerHeight - margin) {
      top = btnRect.top - popoverHeight - 6; // نمایش در بالای دکمه
    }

    setCoords({ top, left });
  }, [open]);

  // بستن خودکار با تایمر (۵ ثانیه)
  useEffect(() => {
    if (!open) return;

    const startTimer = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setOpen(false);
      }, 5000); // ۵ ثانیه استاندارد
    };

    startTimer();
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [open]);

  // بستن با Escape (WCAG)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // بستن با کلیک بیرون
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  // توقف تایمر هنگام هاور (برای دسکتاپ)
  const handleMouseEnter = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  const handleMouseLeave = () => {
    if (open) {
      timerRef.current = window.setTimeout(() => setOpen(false), 5000);
    }
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        aria-label="راهنما"
        style={{
          width: 18, height: 18,
          borderRadius: '50%',
          border: '1px solid var(--muted)',
          background: open ? 'var(--accent-soft)' : 'transparent',
          color: open ? 'var(--accent)' : 'var(--muted)',
          fontSize: 11, fontWeight: 800,
          lineHeight: 1,
          cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'inherit', padding: 0,
          flexShrink: 0,
          marginRight: 4,
        }}
      >?</button>
      {open && coords && createPortal(
        <div
          ref={popoverRef}
          role="tooltip"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            zIndex: 9999,
            background: 'var(--card-solid)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            padding: '10px 12px',
            fontSize: 'var(--fs-sm)',
            color: 'var(--text)',
            lineHeight: 1.6,
            maxWidth: 240,
            minWidth: 160,
            boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
            textAlign: 'right',
            direction: 'rtl',
          }}
        >{text}</div>,
        document.body
      )}
    </>
  );
}
