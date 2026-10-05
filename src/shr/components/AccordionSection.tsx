/**
 * AccordionSection — بخش قابل باز/بسته در فرم‌ها
 */
import { useState, type ReactNode } from 'react';

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
