import React from 'react';
/**
 * helpers.tsx — ماژول hal
 */
import type { ReactNode, CSSProperties } from 'react';
import { toFa } from '../../shr/utils/fa';
import { Field, Input, NumField, Select } from '../../shr/components/ui';

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

export function Row({ l, v, accent }: { l: string; v: string; accent?: boolean }) {
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
    <span style={{ padding: '4px 10px', background: 'var(--input-bg)', borderRadius: 6, fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
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

/** kg/m² بستر بر اساس زیرنوع */
export const LITTER_KG_PER_M2: Record<string, number> = {
  litter_wood_shavings: 4.5,
  wood_shavings: 4.5,
  litter_roll: 2.5,
  litter_sand: 30,
  sand: 30,
  litter_straw: 6,
  straw: 6,
};

/** تشخیص زیرنوع‌های بستر */
export function isLitterLike(type: string): boolean {
  return Object.keys(LITTER_KG_PER_M2).includes(type);
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
      gap: 8,
      padding: '8px 10px',
      background: 'var(--input-bg)',
      borderRadius: 10,
      minWidth: 0,
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      </div>
    </div>
  );
}
