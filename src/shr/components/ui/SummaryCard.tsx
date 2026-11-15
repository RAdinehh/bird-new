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
        padding: 'var(--pad-normal)',
        background: `var(--${tone}-soft)`,
        border: `1px solid var(--${tone}-border)`,
        borderRadius: 'var(--r-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
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
      gap: 6,
      borderTop: first ? 'none' : '1px dashed var(--border)',
      paddingTop: first ? 0 : 8,
      marginTop: first ? 0 : 8,
    }}>
      {(title || meta) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          {title && <span style={{ fontSize: 'var(--fs-base)', fontWeight: 800, color: 'var(--text)' }}>{title}</span>}
          {meta && <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{meta}</span>}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</div>
    </div>
  );
}

export function SummaryRow({ label, value, detail }: { label: React.ReactNode; value: React.ReactNode; detail?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)' }}>{label}</span>
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text)' }}>{value}</span>
      </div>
      {detail && <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', paddingRight: 4 }}>{detail}</span>}
    </div>
  );
}
