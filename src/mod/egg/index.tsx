/**
 * index.tsx — بخش egg
 */
import { useSwipeTabs } from '../../shr/hooks/useSwipeTabs';
import { useState } from 'react';
import ProductionsPage from './ProductionsPage';
import StockPage from './StockPage';

const tabs = [
  { id: 'productions', label: 'تخم‌گذاری' },
  { id: 'stock', label: 'انبار و فروش' }
] as const;

type TabId = typeof tabs[number]['id'];

export default function Egg() {
  const [tab, setTab] = useState<TabId>('productions');

  const TAB_IDS = ['productions', 'stock'];
  const swipeRef = useSwipeTabs(TAB_IDS, tab, (id) => setTab(id as TabId));

  return (
    <div ref={swipeRef} style={{ touchAction: 'pan-y' }}>
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: '1px solid var(--border)',
        padding: '0 8px',
        background: 'var(--header-bg)',
        position: 'sticky', top: 52, zIndex: 11,
        overflowX: 'auto', scrollbarWidth: 'none'
      }}>
        {tabs.map(t => (
          <div
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '11px 14px',
              fontSize: 'var(--fs-base)',
              fontWeight: 600,
              color: tab === t.id ? 'var(--accent)' : 'var(--muted)',
              cursor: 'pointer',
              position: 'relative',
              whiteSpace: 'nowrap'
            }}
          >
            {t.label}
            {tab === t.id ? (
              <div style={{
                position: 'absolute', bottom: 0,
                right: 14, left: 14, height: 3,
                background: 'var(--accent)',
                borderRadius: '3px 3px 0 0'
              }} />
            ) : null}
          </div>
        ))}
      </div>

      {tab === 'productions' ? <ProductionsPage /> : null}
      {tab === 'stock' ? <StockPage /> : null}
    </div>
  );
}
