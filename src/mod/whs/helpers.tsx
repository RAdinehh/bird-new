/**
 * helpers.tsx — ماژول whs
 */
import type { ReactNode, CSSProperties } from 'react';
import { showAlert } from '../../cor/store/dialog';
import { Dot, StatBox } from '../../shr/components/ExpandableCard';
import { Btn, BtnRow, Empty, Field, Grid2, Grid3, Input, Modal, MoneyField, NumField, PageContainer, Select, Tag } from '../../shr/components/ui';
import { toEn, toFa } from '../../shr/utils/fa';
import { useCtc } from '../ctc/store';
import { CATEGORY_ICON, CATEGORY_LABEL, MOVEMENT_REASON, UNIT_LABEL, daysToExpiry, expiryWarning, stockWarning, type Item, type Movement, type MovementReason, type MovementType, useWhs } from './store';

export function Row({ l, v }: { l: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between',
       fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
       borderRadius: 'var(--r-sm)' }}>
      <span style={{ color: 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span>
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div style={{
      paddingTop: 10, marginTop: 4,
      borderTop: '1px dashed var(--border)',
      fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)'
    }}>{children}</div>
  );
}

export function chip(active: boolean): CSSProperties {
  return {
    padding: '6px 11px', fontSize: 'var(--fs-sm)',
    background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
    border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border)'}`,
    borderRadius: 'var(--r-sm)',
    color: active ? 'var(--accent)' : 'var(--muted)',
    fontWeight: active ? 600 : 500, cursor: 'pointer',
    fontFamily: 'inherit', whiteSpace: 'nowrap'
  };
}

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
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10
      }}>
        <span style={{ fontSize: 'var(--fs-lg)' }}>{icon}</span>
        <div style={{ flex: 1, fontSize: 'var(--fs-base)', fontWeight: 700 }}>{title}</div>
        <Tag tone={tone}>{toFa(items.length)}</Tag>
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
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {it.name}
            </div>
            <div style={{
              fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {renderLine(it)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
