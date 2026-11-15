/** SummaryCard — کارت خلاصه استاندارد (accent/info/warn/danger) */
import React from 'react';

type Tone = 'accent' | 'info' | 'warn' | 'danger';

interface SummaryCardProps {
  tone?: Tone;
  title?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function SummaryCard({
  tone = 'accent',
  title,
  children,
  style,
}: SummaryCardProps) {
  return (
    <div
      style={{
        padding: '8px 12px',
        background: `var(--${tone}-soft)`,
        border: `1px solid var(--${tone}-border)`,
        borderRadius: 'var(--r-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        fontSize: 'var(--fs-sm)',
        color: `var(--${tone})`,
        ...style,
      }}
    >
      {title && (
        <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700 }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}


// ────────────────────────────────────────────────
// SummarySection & SummaryRow — الگوی استاندارد جهانی
// ────────────────────────────────────────────────

export function SummarySection({ title, meta, children, first = false }: { title?: React.ReactNode; meta?: React.ReactNode; children: React.ReactNode; first?: boolean }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      borderTop: first ? 'none' : '1px dashed var(--border)',
      paddingTop: first ? 0 : 6,
      marginTop: first ? 0 : 6,
    }}>
      {(title || meta) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          {title && <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)' }}>{title}</span>}
          {meta && <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{meta}</span>}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</div>
    </div>
  );
}

export function SummaryRow({ label, value, detail }: { label: React.ReactNode; value: React.ReactNode; detail?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
      <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 500, color: 'var(--muted)', flexShrink: 0 }}>{label}</span>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, minWidth: 0 }}>
        <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)', textAlign: 'left', wordBreak: 'break-word' }}>{value}</span>
        {detail && <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--muted)', textAlign: 'left', wordBreak: 'break-word' }}>{detail}</span>}
      </div>
    </div>
  );
}
