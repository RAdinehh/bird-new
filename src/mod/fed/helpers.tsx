/**
 * helpers.tsx — helperهای مشترک ماژول fed
 */
import type { ReactNode, CSSProperties } from 'react';
import { toFa } from '../../shr/utils/fa';

export function Row({ l, v }: { l: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)',
       padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
      <span style={{ color: 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span>
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div style={{ paddingTop: 10, marginTop: 4, borderTop: '1px dashed var(--border)',
       fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)' }}>{children}</div>
  );
}

export function NutrientRow({ l, value, target, unit }: { l: string; value: number; target?: number; unit: string }) {
  let diff = 0;
  let tone: 'ok' | 'low' | 'high' = 'ok';
  if (target !== undefined && target > 0) {
    diff = value - target;
    const pct = (diff / target) * 100;
    if (pct < -5) tone = 'low';
    else if (pct > 5) tone = 'high';
  }
  const color = tone === 'ok' ? 'var(--accent)' : tone === 'low' ? 'var(--danger)' : 'var(--warn)';

  return (
    <div style={{ padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
        <span style={{ color: 'var(--muted)' }}>{l}:</span>
        <span style={{ fontWeight: 600, color: color }}>{toFa(value)} {unit}</span>
      </div>
      {target !== undefined && target > 0 ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)', marginTop: 2, color: 'var(--muted)' }}>
          <span>هدف: {toFa(target)} {unit}</span>
          <span style={{ color: color }}>{diff >= 0 ? '+' : ''}{toFa(diff.toFixed(2))}</span>
        </div>
      ) : null}
    </div>
  );
}

export function chip(active: boolean): CSSProperties {
  return {
    padding: '6px 11px', fontSize: 'var(--fs-sm)',
    background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
    border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
    borderRadius: 'var(--r-sm)',
    color: active ? 'var(--accent)' : 'var(--muted)',
    fontWeight: active ? 600 : 500, cursor: 'pointer',
    fontFamily: 'inherit', whiteSpace: 'nowrap',
    flexShrink: 0
  };
}
