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
