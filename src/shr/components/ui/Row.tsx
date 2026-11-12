import type { ReactNode } from 'react';

export function Row({ l, v, accent, warn, autoFrom }: { l: ReactNode; v: ReactNode; accent?: boolean; warn?: boolean; autoFrom?: string }) {
  const bg = warn ? 'var(--warn-soft)' : accent ? 'var(--accent-soft)' : 'var(--input-bg)';
  const color = warn ? 'var(--warn)' : accent ? 'var(--accent)' : 'var(--muted)';
  const textColor = warn ? 'var(--warn)' : accent ? 'var(--accent)' : 'var(--text)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: autoFrom ? 'var(--sp-1)' : 0, padding: 'var(--pad-tight)', background: bg, borderRadius: 'var(--r-sm)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
        <span style={{ color, display: 'flex', alignItems: 'center', gap: 'var(--sp-1)' }}>
          {l}:
          {autoFrom && (
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', flexShrink: 0 }} />
          )}
        </span>
        <span style={{ fontWeight: 600, color: textColor }}>{v}</span>
      </div>
      {autoFrom && (
        <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--accent)', fontWeight: 600, opacity: 0.85, textAlign: 'left' }}>
          {'✨ از ' + autoFrom}
        </div>
      )}
    </div>
  );
}

export function RowGrid({ children }: { children: ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-1)' }}>{children}</div>;
}
