import { useState, useEffect, useRef } from 'react';

interface Props {
  text: string;
}

export function HelpIcon({ text }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        aria-label="راهنما"
        title={text}
        style={{
          width: 16, height: 16,
          borderRadius: '50%',
          border: '1px solid var(--muted)',
          background: open ? 'var(--accent-soft)' : 'transparent',
          color: open ? 'var(--accent)' : 'var(--muted)',
          fontSize: 10, fontWeight: 800,
          lineHeight: 1,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'inherit', padding: 0,
        }}
      >?</button>
      {open && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            zIndex: 1000,
            background: 'var(--card-solid)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)',
            padding: '8px 10px',
            fontSize: 'var(--fs-xs)',
            color: 'var(--text)',
            lineHeight: 1.5,
            maxWidth: 220,
            minWidth: 140,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            textAlign: 'right',
            direction: 'rtl',
          }}
        >{text}</div>
      )}
    </div>
  );
}
