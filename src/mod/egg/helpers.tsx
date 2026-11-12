/**
 * helpers.tsx — helperهای مشترک ماژول egg
 */
import type { ReactNode, CSSProperties } from 'react';
export { Row } from '../../shr/components/ui';


export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div style={{ paddingTop: 12, marginTop: 4, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-base)', fontWeight: 600, color: 'var(--text)', letterSpacing: '.3px' }}>{children}</div>
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

export { AccordionSection } from '../../shr/components/AccordionSection';
