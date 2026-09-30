/**
 * cards.tsx — helperهای مشترک: SectionTitle، KpiCard، MiniStat، MiniEmpty
 */
import type { ReactNode } from 'react';
import { toFa } from '../../shr/utils/fa';

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div style={{
      fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)',
      padding: '8px 4px 8px', letterSpacing: '.5px'
    }}>{children}</div>
  );
}

export function KpiCard({ icon, label, value, unit, color, onClick, noFormat }: {
  icon: string;
  label: string;
  value: number;
  unit: string;
  color: 'accent' | 'warn' | 'danger' | 'info';
  onClick?: () => void;
  noFormat?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: 'var(--pad-card)',
        cursor: onClick ? 'pointer' : 'default',
        minHeight: 92,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 'var(--fs-md)' }}>{icon}</span>
        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 600 }}>
          {label}
        </span>
      </div>
      <div style={{
        fontSize: 'clamp(14px, 4vw, var(--fs-xl))',
        fontWeight: 700,
        color: 'var(--' + color + ')',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1.15,
        wordBreak: 'break-word',
        overflowWrap: 'anywhere'
      }}>
        {noFormat ? toFa(String(value)) : toFa(value.toLocaleString('fa-IR'))}
      </div>
      {unit ? (
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>{unit}</div>
      ) : null}
    </div>
  );
}

export function MiniStat({ label, value, suffix, color, noFormat }: {
  label: string;
  value: number;
  suffix: string;
  color: 'accent' | 'warn' | 'danger' | 'info';
  noFormat?: boolean;
}) {
  return (
    <div style={{
      padding: 'var(--pad-inner)',
      background: 'var(--' + color + '-soft)',
      border: '1px solid var(--' + color + ')',
      borderRadius: 'var(--r-md)',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--' + color + ')', fontWeight: 700 }}>
        {label}
      </div>
      <div style={{
        fontSize: 'clamp(13px, 3.5vw, var(--fs-md))', fontWeight: 700,
        color: 'var(--' + color + ')',
        marginTop: 4,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1.2,
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
