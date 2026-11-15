/**
 * helpers.tsx — helperهای مشترک ماژول egg
 */
import type { ReactNode, CSSProperties } from 'react';
export { Row } from '../../shr/components/ui';


export { SectionTitle } from '../../shr/components/ui';

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
