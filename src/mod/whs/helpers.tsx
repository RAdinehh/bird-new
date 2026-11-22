/**
 * helpers.tsx — ماژول whs
 */
import { getGlobalFormat } from '../../shr/units/useFormat';

import type { ReactNode, CSSProperties } from 'react';
import { Tag } from '../../shr/components/ui';
import { toFa } from '../../shr/utils/fa';
import { CATEGORY_ICON, type Item } from './store';
export { Row } from '../../shr/components/ui';


export { SectionTitle } from '../../shr/components/ui';

export { chipStyle as chip } from '../../shr/utils/chipStyle';

export function WarningGroup({ title, icon, color, items, renderLine }: {
  title: string;
  icon: string;
  color: 'red' | 'amber';
  items: Item[];
  renderLine: (it: Item) => string;
}) {
  const tone: 'red' | 'amber' = color;

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10
      }}>
        <span style={{ fontSize: 'var(--fs-lg)' }}>{icon}</span>
        <div style={{ flex: 1, fontSize: 'var(--fs-base)', fontWeight: 700 }}>{title}</div>
        <Tag tone={tone}>{getGlobalFormat().count(items.length)}</Tag>
      </div>

      {items.map(it => (
        <div
          key={it.id}
          style={{
            padding: '10px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
            borderBottom: '1px solid var(--border)'
          }}
        >
          <span style={{ fontSize: 'var(--fs-md)', flexShrink: 0 }}>{CATEGORY_ICON[it.category]}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 'var(--fs-sm)', fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>
              {it.name}
            </div>
            <div style={{
              fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2,
              whiteSpace: 'nowrap',
            }}>
              {renderLine(it)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
