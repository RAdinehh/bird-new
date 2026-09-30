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
        borderRadius: 'var(--r-md)',
        padding: 'var(--pad-normal)',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 44
      }}
    >
      <span style={{ fontSize: 'var(--fs-md)', flexShrink: 0, lineHeight: 1 }}>{icon}</span>
      <span style={{
        fontSize: 'var(--fs-xs)',
        color: 'var(--muted)',
        fontWeight: 600,
        flex: 1,
        minWidth: 0,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 'clamp(13px, 3.5vw, var(--fs-md))',
        fontWeight: 700,
        color: 'var(--' + color + ')',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
        flexShrink: 0
      }}>
        {noFormat ? toFa(String(value)) : toFa(value.toLocaleString('fa-IR'))}
      </span>
      {unit ? (
        <span style={{
          fontSize: 'var(--fs-xs)',
          color: 'var(--muted)',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}>
          {unit}
        </span>
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
