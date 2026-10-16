import React from 'react';
/**
 * helpers.tsx — ماژول hal
 */
import type { ReactNode, CSSProperties } from 'react';

export function chip(active: boolean): CSSProperties {
  return {
    padding: '6px 11px', fontSize: 'var(--fs-sm)',
    background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
    border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border)'}`,
    borderRadius: 'var(--r-sm)',
    color: active ? 'var(--accent)' : 'var(--muted)',
    fontWeight: active ? 600 : 500, cursor: 'pointer',
    fontFamily: 'inherit', whiteSpace: 'nowrap',
  };
}

export function Row({ l, v, accent }: { l: ReactNode; v: ReactNode; accent?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)',
      padding: 'var(--pad-tight)',
      background: accent ? 'var(--accent-soft)' : 'var(--input-bg)',
      borderRadius: 'var(--r-sm)',
      color: accent ? 'var(--accent)' : undefined,
      fontWeight: accent ? 700 : undefined,
    }}>
      <span style={{ color: accent ? 'var(--accent)' : 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600 }}>{v}</span>
    </div>
  );
}

export function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ padding: 'var(--pad-btn-sm)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
      {label}: <b style={{ color: 'var(--text)' }}>{value}</b>
    </span>
  );
}

// ═══════════════════════════════════════════════
// SourceList — لیست منابع توزیع‌شده
// ═══════════════════════════════════════════════



export function isFanLike(type: string): boolean {
  return ['fan_tunnel', 'fan_ceiling', 'fan', 'cooler', 'cooling_pad', 'air_inlet'].includes(type);
}

/** تشخیص زیرنوع‌های خانواده لامپ/روشنایی */
export function isLampLike(type: string): boolean {
  return ['lamp_led', 'lamp_fluorescent', 'lamp', 'dimmer'].includes(type);
}

/** تشخیص زیرنوع‌های دانخوری */
export function isFeederLike(type: string): boolean {
  return type.startsWith('feeder') || type === 'feeder';
}

/** تشخیص زیرنوع‌های آبخوری */
export function isDrinkerLike(type: string): boolean {
  return ['nipple', 'cup', 'trough', 'fountain_drinker', 'drinker'].includes(type);
}

// ═══════════════════════════════════════════════
// SourceCard — کارت فشرده گروه منابع (برای Grid2)
// ═══════════════════════════════════════════════



export function EnvCard({ icon, label, value, tone }: { icon: string; label: string; value: string; tone?: 'accent' | 'warn' | 'danger' | 'info' | 'muted' }) {
  const color = tone === 'accent' ? 'var(--accent)'
              : tone === 'warn' ? 'var(--warn)'
              : tone === 'danger' ? 'var(--danger)'
              : tone === 'info' ? 'var(--info)'
              : 'var(--text)';
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-2)',
      padding: 'var(--pad-tight)',
      background: 'var(--input-bg)',
      borderRadius: 'var(--r-md)',
      minWidth: 0,
    }}>
      <span style={{ fontSize: 'var(--fs-base)', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--muted)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
        <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      </div>
    </div>
  );
}



/** 🆕 گرید دو ستونه برای Row های کوتاه (عدد، تاریخ) */
export function RowGrid({ children }: { children: ReactNode }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'var(--sp-1)',
    }}>
      {children}
    </div>
  );
}

export function RowWithStatus({
  l, v, tone, icon, hint,
}: {
  l: string;
  v: string;
  tone?: 'good' | 'warn' | 'danger' | 'none';
  icon?: string;
  hint?: string;
}) {
  const defaultIcon = tone === 'good' ? '✅'
             : tone === 'warn' ? '⚠️'
             : tone === 'danger' ? '❌'
             : null;
  const showIcon = icon || defaultIcon;
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: 'var(--fs-sm)',
      padding: 'var(--pad-tight)',
      background: 'var(--input-bg)',
      borderRadius: 'var(--r-sm)',
      gap: 'var(--sp-2)',
    }}>
      <span style={{ color: 'var(--muted)', flexShrink: 0 }}>{l}:</span>
      <span style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sp-1)',
        fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
        minWidth: 0,
      }}>
        {showIcon && <span style={{ fontSize: 'var(--fs-sm)', flexShrink: 0 }}>{showIcon}</span>}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {v}{hint && <span style={{ color: 'var(--muted)', fontWeight: 500, marginRight: 4 }}> • {hint}</span>}
        </span>
      </span>
    </div>
  );
}


