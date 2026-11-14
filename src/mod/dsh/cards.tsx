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

export function MiniStat({ label, value, suffix, color, noFormat }: {
  label: string;
  value: number;
  suffix: string;
  color: 'accent' | 'warn' | 'danger' | 'info';
  noFormat?: boolean;
}) {
  return (
    <div style={{
      padding: '8px 10px',
      background: 'var(--' + color + '-soft)',
      border: '1px solid var(--' + color + ')',
      borderRadius: 'var(--r-md)',
      textAlign: 'center',
      minHeight: 60,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    }}>
      <div style={{ fontSize: 11, color: 'var(--' + color + ')', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {label}
      </div>
      <div style={{
        fontSize: 'clamp(13px, 3.5vw, 16px)', fontWeight: 800,
        color: 'var(--' + color + ')',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1.15,
        wordBreak: 'break-word'
      }}>
        {noFormat ? toFa(String(Math.round(value))) : toFa((Math.round(value * 100) / 100).toLocaleString('fa-IR'))}{suffix}
      </div>
    </div>
  );
}


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
