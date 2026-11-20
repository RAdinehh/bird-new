import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  text: string;
}

function renderKeywordBolds(str: string) {
  const parts = str.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <strong
          key={i}
          style={{
            fontWeight: 700,
            color: 'var(--text)',
          }}
        >
          {part}
        </strong>
      );
    }
    return part;
  });
}

function splitIntoBlocks(rawText: string): string[] {
  const normalized = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\s+(\*\*[^*\n]+?\*\*)/g, '\n$1')
    .replace(/\n{2,}/g, '\n');

  return normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function renderBlock(block: string, idx: number) {
  const startBoldMatch = block.match(/^\*\*([^*]+?)\*\*(.*)$/);
  if (startBoldMatch) {
    const title = startBoldMatch[1].trim();
    const rest = startBoldMatch[2].trim();

    return (
      <div
        key={idx}
        style={{
          margin: 0,
          padding: 0,
          fontSize: '13px',
          lineHeight: 1.42,
          color: 'var(--text)',
          wordBreak: 'break-word',
        }}
      >
        <span
          style={{
            fontWeight: 800,
            fontSize: '13.5px',
            color: 'var(--text)',
          }}
        >
          {title}
        </span>
        {rest ? (
          <>
            {' '}
            <span
              style={{
                fontWeight: 400,
                fontSize: '13px',
                color: 'var(--text-secondary, var(--text))',
              }}
            >
              {renderKeywordBolds(rest)}
            </span>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div
      key={idx}
      style={{
        margin: 0,
        padding: 0,
        fontSize: '13px',
        fontWeight: 400,
        lineHeight: 1.42,
        color: 'var(--text-secondary, var(--text))',
        wordBreak: 'break-word',
      }}
    >
      {renderKeywordBolds(block)}
    </div>
  );
}

export function HelpIcon({ text }: Props) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLSpanElement | HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    const raf = requestAnimationFrame(() => {
      if (!btnRef.current || !popoverRef.current) return;
      const btnRect = btnRef.current.getBoundingClientRect();
      const popRect = popoverRef.current.getBoundingClientRect();
      const popW = popRect.width || Math.min(240, window.innerWidth - 24);
      const popH = popRect.height || 180;
      const margin = 12;

      let left = (window.innerWidth - popW) / 2;
      let top = btnRect.bottom + 6;

      if (left + popW > window.innerWidth - margin) left = window.innerWidth - popW - margin;
      if (left < margin) left = margin;

      if (top + popH > window.innerHeight - margin) {
        const aboveTop = btnRect.top - popH - 6;
        top = aboveTop >= margin ? aboveTop : Math.max(margin, (window.innerHeight - popH) / 2);
      }

      setCoords({ top, left });
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setOpen(false), 5000);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
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

  const blocks = splitIntoBlocks(text);

  return (
    <>
      <span
        ref={btnRef as unknown as React.RefObject<HTMLSpanElement>}
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
        }}
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
          marginInlineStart: 2,
          marginInlineEnd: 0,
          padding: '0 1px',
          background: 'transparent',
          border: 'none',
          borderRadius: 0,
          color: open ? 'var(--accent)' : 'var(--muted, var(--text))',
          fontSize: 15,
          fontWeight: 700,
          lineHeight: 1,
          cursor: 'pointer',
          userSelect: 'none',
          verticalAlign: 'middle',
        }}
      >
        ؟
      </span>
      {open &&
        createPortal(
          <div
            ref={popoverRef}
            role="tooltip"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
              position: 'fixed',
              top: coords ? coords.top : 72,
              left: coords ? coords.left : 24,
              width: 'min(70vw, 240px)',
              maxWidth: 'calc(100vw - 24px)',
              zIndex: 9999,
              background: 'var(--card-solid, var(--surface))',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md, 10px)',
              padding: '10px 12px',
              lineHeight: 1.42,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              boxShadow: '0 6px 14px rgba(0, 0, 0, 0.28), 0 1px 3px rgba(0, 0, 0, 0.2)',
            }}
          >
            {blocks.map((block, idx) => renderBlock(block, idx))}
          </div>,
          document.body,
        )}
    </>
  );
}
