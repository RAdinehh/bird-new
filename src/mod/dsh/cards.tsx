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


export { MiniEmpty } from '../../shr/components/ui/MiniEmpty';
