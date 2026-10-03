import type { ReactNode } from 'react';

export function RangeCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
      padding: '10px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      minWidth: 0,
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>
      <div style={{
        fontSize: 'var(--fs-sm)',
        fontWeight: 700,
        color: 'var(--accent)',
        textAlign: 'right',
        paddingBottom: 6,
        borderBottom: '1px dashed var(--border)',
      }}>{title}</div>
      {children}
    </div>
  );
}
