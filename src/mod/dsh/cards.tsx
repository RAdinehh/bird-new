/**
 * cards.tsx — helperهای مشترک: SectionTitle، KpiCard، MiniStat، MiniEmpty
 */
import type { ReactNode } from 'react';
import { toFa } from '../../shr/utils/fa';

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div style={{
      paddingTop: 12, marginTop: 4,
      borderTop: '1px dashed var(--border)',
      fontSize: 'var(--fs-base)', fontWeight: 600,
      color: 'var(--text)', letterSpacing: '.3px'
    }}>{children}</div>
  );
}

export { KpiCard } from '../../shr/components/ui/KpiCard';

export { MiniStat } from '../../shr/components/ui/MiniStat';


export function MiniEmpty({ icon, title, hint }: { icon: string; title: string; hint: string }) {
  return (
    <div style={{
      padding: 24, textAlign: 'center',
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
    }}>
      <div style={{ fontSize: 'var(--fs-hero)', marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', lineHeight: 1.8 }}>{hint}</div>
    </div>
  );
}
