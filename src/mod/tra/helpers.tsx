/**
 * helpers.ts — helperهای مشترک ماژول tra
 */
import type { ReactNode } from 'react';

export function Row({ l, v }: { l: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
      <span style={{ color: 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span>
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div style={{ paddingTop: 12, marginTop: 4, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px' }}>
      {children}
    </div>
  );
}

export function chip(active: boolean): React.CSSProperties {
  return {
    padding: '6px 11px', fontSize: 'var(--fs-sm)',
    background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
    border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border)'}`,
    borderRadius: 'var(--r-sm)',
    color: active ? 'var(--accent)' : 'var(--muted)',
    fontWeight: active ? 600 : 500, cursor: 'pointer',
    fontFamily: 'inherit', whiteSpace: 'nowrap',
    flexShrink: 0
  };
}

export function Line({ l, v }: { l: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)' }}>
      <span style={{ color: 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span>
    </div>
  );
}

export function tab(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: '7px 12px', fontSize: 'var(--fs-sm)',
    background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
    border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border)'}`,
    borderRadius: 'var(--r-sm)',
    color: active ? 'var(--accent)' : 'var(--muted)',
    fontWeight: active ? 700 : 500, cursor: 'pointer',
    fontFamily: 'inherit', whiteSpace: 'nowrap',
  };
}

export function filterChip(active: boolean, color = 'accent'): React.CSSProperties {
  return {
    padding: '4px 10px', fontSize: 'var(--fs-xs)',
    background: active ? `var(--${color}-soft, var(--accent-soft))` : 'var(--btn-bg)',
    border: `1px solid ${active ? `var(--${color})` : 'var(--border)'}`,
    borderRadius: 'var(--r-sm)',
    color: active ? `var(--${color})` : 'var(--muted)',
    fontWeight: active ? 700 : 500, cursor: 'pointer',
    fontFamily: 'inherit', whiteSpace: 'nowrap',
  };
}

// ═══ Accordion Section ═══
import { useState } from 'react';

export function AccordionSection({
  title, icon, defaultOpen = true, summary, children,
}: {
  title: string;
  icon?: string;
  defaultOpen?: boolean;
  summary?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginTop: 4 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 4px', marginTop: 4,
          background: 'none', border: 'none', borderTop: '1px solid var(--border)',
          cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right',
        }}
      >
        <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px' }}>
          {icon && <span style={{ fontSize: '1.05em', lineHeight: 1 }}>{icon}</span>}
          {title}
        </span>
        {!open && summary && (
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 600 }}>{summary}</span>
        )}
        <span style={{
          fontSize: 10, color: 'var(--muted)',
          transform: open ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 180ms',
          display: 'inline-block',
        }}>▼</span>
      </button>
      {open && <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>{children}</div>}
    </div>
  );
}
