/** components/ui/Layout.tsx */
import React from 'react';

export function Grid2({ children }: { children: React.ReactNode }) {
  const count = React.Children.toArray(children).filter(Boolean).length;
  const cols = count >= 2 ? 2 : 1;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      gap: 'var(--sp-2)',
    }}>{children}</div>
  );
}
export function Grid3({ children }: { children: React.ReactNode }) {
  const count = React.Children.toArray(children).filter(Boolean).length;
  const cols = count >= 3 ? 3 : count >= 2 ? 2 : 1;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      gap: 'var(--sp-2)',
    }}>{children}</div>
  );
}
export function PageContainer({ children, bottomPad }: { children: React.ReactNode; bottomPad?: number }) {
  return <div style={{ padding: 'var(--sp-3)', paddingBottom: bottomPad ? `calc(var(--sp-3) + ${bottomPad}px)` : 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>{children}</div>;
}
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      paddingTop: 12,
      marginTop: 4,
      borderTop: '1px dashed var(--border)',
      fontSize: 'var(--fs-base)',
      fontWeight: 600,
      color: 'var(--text)',
      letterSpacing: '.3px',
    }}>{children}</div>
  );
}

/**
 * Section — کارت با عنوان (title داخل کارت، children بعد از title)
 * استفاده در گزارش‌ها، تنظیمات، AboutTab
 * برای LogCard/StatsCard به LogSection/StatsCard ماژول خودشان مراجعه کن
 */
export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding: '14px 16px',
    }}>
      <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, marginBottom: 4 }}>
        {title}
      </div>
      {children}
    </div>
  );
}
