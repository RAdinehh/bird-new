import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  text: string;
}

function renderBold(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} style={{ fontWeight: 800, color: 'var(--text)' }}>{part}</strong>;
    }
    return part;
  });
}

export function HelpIcon({ text }: Props) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  // ─── اندازه‌گیری و موقعیت‌یابی بعد از paint اولیه ───
  useEffect(() => {
    if (!open) { setCoords(null); return; }
    const raf = requestAnimationFrame(() => {
      if (!btnRef.current || !popoverRef.current) return;
      const btnRect = btnRef.current.getBoundingClientRect();
      const popRect = popoverRef.current.getBoundingClientRect();
      const popW = popRect.width || Math.min(240, window.innerWidth - 32);
      const popH = popRect.height || 120;
      const margin = 8;

      let left = btnRect.left - popW + btnRect.width;
      let top = btnRect.bottom + 6;

      // جلوگیری از بیرون‌زدگی راست/چپ
      if (left + popW > window.innerWidth - margin) left = window.innerWidth - popW - margin;
      if (left < margin) left = margin;

      // 🆕 اگر فضای زیر کافی نیست → بالای دکمه
      if (top + popH > window.innerHeight - margin) {
        const aboveTop = btnRect.top - popH - 6;
        top = aboveTop >= margin ? aboveTop : margin;
      }

      setCoords({ top, left });
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);

  // ─── بستن خودکار ۵ ثانیه ───
  useEffect(() => {
    if (!open) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setOpen(false), 5000);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [open]);

  // ─── Escape ───
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // ─── کلیک بیرون ───
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
        aria-expanded={open}
        style={{
          width: 16, height: 16,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          padding: 0,
          color: open ? 'var(--accent)' : 'var(--muted)',
          fontSize: 14, fontWeight: 700,
          lineHeight: 1,
          cursor: 'help',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'inherit',
          flexShrink: 0,
          marginRight: 4,
          opacity: open ? 1 : 0.65,
          transition: 'opacity 150ms',
          userSelect: 'none',
        }}
      >?</button>
      {open && createPortal(
        <div
          ref={popoverRef}
          role="tooltip"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'fixed',
            top: coords?.top ?? 0,
            left: coords?.left ?? 0,
            visibility: coords ? 'visible' : 'hidden',
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
            maxHeight: 'min(320px, 55dvh)',
            overflowY: 'auto',
            boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
            textAlign: 'right',
            direction: 'rtl',
          }}
        >{renderBold(text)}</div>,
        document.body
      )}
    </>
  );
}
