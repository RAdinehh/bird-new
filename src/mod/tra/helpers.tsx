/**
 * helpers.ts — helperهای مشترک ماژول tra
 */
import { parse as parseJ, differenceInDays as diffDaysJ } from 'date-fns-jalali';
import type { ReactNode } from 'react';

export function Row({ l, v }: { l: string; v: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', minWidth: 0 }}>
      <span style={{ color: 'var(--muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: 'var(--text)', textAlign: 'left', wordBreak: 'break-word', minWidth: 0, flex: 1 }}>{v}</span>
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div style={{ paddingTop: 12, marginTop: 4, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px' }}>
      {children}
    </div>
  );
}

export function chip(active: boolean): React.CSSProperties {
  return {
    padding: '6px 11px', fontSize: 'var(--fs-sm)',
    background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
    border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border)'}`,
    borderRadius: 'var(--r-sm)',
    color: active ? 'var(--accent)' : 'var(--muted)',
    fontWeight: active ? 600 : 500, cursor: 'pointer',
    fontFamily: 'inherit', whiteSpace: 'nowrap',
    flexShrink: 0
  };
}

export function Line({ l, v }: { l: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)' }}>
      <span style={{ color: 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span>
    </div>
  );
}

export function tab(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: '7px 12px', fontSize: 'var(--fs-sm)',
    background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
    border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border)'}`,
    borderRadius: 'var(--r-sm)',
    color: active ? 'var(--accent)' : 'var(--muted)',
    fontWeight: active ? 700 : 500, cursor: 'pointer',
    fontFamily: 'inherit', whiteSpace: 'nowrap',
  };
}

export function filterChip(active: boolean, color = 'accent'): React.CSSProperties {
  return {
    padding: '4px 10px', fontSize: 'var(--fs-xs)',
    background: active ? `var(--${color}-soft, var(--accent-soft))` : 'var(--btn-bg)',
    border: `1px solid ${active ? `var(--${color})` : 'var(--border)'}`,
    borderRadius: 'var(--r-sm)',
    color: active ? `var(--${color})` : 'var(--muted)',
    fontWeight: active ? 700 : 500, cursor: 'pointer',
    fontFamily: 'inherit', whiteSpace: 'nowrap',
  };
}

export { AccordionSection } from '../../shr/components/AccordionSection';


// ═══ توابع کمکی ReceivablesPage ═══
import type { Invoice } from './store';

export function daysUntilDue(inv: Invoice): number | null {
  if (!inv.dueDate) return null;
  try {
    const en = inv.dueDate.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    const d = parseJ(en, 'yyyy/MM/dd', new Date());
    if (isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return diffDaysJ(d, today);
  } catch { return null; }
}

export function dueTone(days: number | null): 'green' | 'amber' | 'orange' | 'red' {
  if (days === null) return 'green';
  if (days < 0) return 'red';
  if (days <= 3) return 'red';
  if (days <= 7) return 'orange';
  if (days <= 14) return 'amber';
  return 'green';
}

export function dueLabel(days: number | null): string {
  if (days === null) return '—';
  if (days < 0) return `${Math.abs(days)} روز گذشته`;
  if (days === 0) return 'امروز';
  return `${days} روز مانده`;
}

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
