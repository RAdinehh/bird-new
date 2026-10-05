/**
 * cards.tsx — helperهای مشترک: SectionTitle، KpiCard، MiniStat، MiniEmpty
 */
import type { ReactNode } from 'react';
import { toFa } from '../../shr/utils/fa';

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div style={{
      fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)',
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
  const colors: Record<string, { bg: string; fg: string }> = {
    accent: { bg: 'var(--accent-soft)', fg: 'var(--accent)' },
    warn:   { bg: 'var(--warn-soft)',   fg: 'var(--warn)' },
    danger: { bg: 'var(--danger-soft)', fg: 'var(--danger)' },
    info:   { bg: 'var(--info-soft)',   fg: 'var(--info)' },
  };
  const c = colors[color] || colors.info;
  return (
    <div role="button" tabIndex={0}
      onClick={onClick}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        padding: '10px 8px 11px',
        cursor: onClick ? 'pointer' : 'default',
        minHeight: 92,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        textAlign: 'center',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{
        width: 30,
        height: 30,
        borderRadius: 9,
        background: c.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        lineHeight: 1,
        flexShrink: 0,
      }}>{icon}</div>
      <div style={{
        fontSize: 11,
        color: 'var(--muted)',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
      }}>
        {label}
      </div>
      <div style={{
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
      }}>
        <span style={{
          fontSize: 'clamp(15px, 3.8vw, 17px)',
          fontWeight: 800,
          color: 'var(--text)',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.15,
        }}>
          {noFormat ? toFa(String(value)) : toFa(value.toLocaleString('fa-IR'))}
        </span>
        {unit ? (
          <span style={{
            fontSize: 10,
            color: 'var(--muted)',
            marginRight: 3,
          }}>
            {unit}
          </span>
        ) : null}
      </div>
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
