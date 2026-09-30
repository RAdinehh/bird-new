/**
 * helpers.tsx — helperهای مشترک ماژول inc
 */
import type { ReactNode, CSSProperties } from 'react';
import { format as formatJ } from 'date-fns-jalali';

export function todayJalali(): string {
  const d = new Date();
  return formatJ(d, 'yyyy/MM/dd');
}

export function Row({ l, v }: { l: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
      <span style={{ color: 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span>
    </div>
  );
}

export function chip(active: boolean): React.CSSProperties {
  return {
    padding: '6px 11px', fontSize: 'var(--fs-sm)',
    background: active ? 'var(--info-soft)' : 'var(--btn-bg)',
    border: '1px solid ' + (active ? 'var(--info)' : 'var(--border)'),
    borderRadius: 'var(--r-sm)',
    color: active ? 'var(--info)' : 'var(--muted)',
    fontWeight: active ? 600 : 500, cursor: 'pointer',
    fontFamily: 'inherit', whiteSpace: 'nowrap',
    flexShrink: 0
  };
}
