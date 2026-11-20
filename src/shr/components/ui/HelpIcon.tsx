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
  const btnRef = useRef<HTMLSpanElement | HTMLButtonElement>(null);
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

      let left = (window.innerWidth - popW) / 2;
      let top = btnRect.bottom + 6;

      // وسط‌چین افقی در صفحه با رعایت حاشیه ایمن
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
      <span
        ref={btnRef as unknown as React.RefObject<HTMLSpanElement>}
        role="button"
        tabIndex={0}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            setOpen(!open);
          }
        }}
        aria-label="راهنما"
        aria-expanded={open}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 18,
          height: 18,
          borderRadius: '999px',
          border: '1px solid var(--border)',
          background: open ? 'var(--accent)' : 'var(--card-solid, var(--surface))',
          color: open ? '#fff' : 'var(--text)',
          fontSize: 11,
          fontWeight: 700,
          lineHeight: 1,
          cursor: 'pointer',
          userSelect: 'none',
          verticalAlign: 'middle',
        }}
      >
        ؟
      </span>
      {open && createPortal(
        <div
          ref={popoverRef}
          role="tooltip"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'fixed',
            top: coords ? coords.top : 64,
            left: coords ? coords.left : 16,
            width: 'min(90vw, 340px)',
            maxWidth: 'calc(100vw - 16px)',
            zIndex: 9999,
            background: 'var(--card-solid, var(--surface))',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md, 10px)',
            padding: '10px 12px',
            fontSize: 'var(--fs-xs, 12px)',
            lineHeight: 1.7,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
          }}
        >
          {renderBold(text)}
        </div>,
        document.body,
      )}
    </>
  );
}
