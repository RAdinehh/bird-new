/**
 * index.tsx — بخش tra
 */
import { useState } from 'react';
import PurchasesPage from './PurchasesPage';
import SalesPage from './SalesPage';
import DealsPage from './DealsPage';
import ReceivablesPage from './ReceivablesPage';

const tabs = [
  { id: 'purchases', label: 'خرید' },
  { id: 'sales', label: 'فروش' },
  { id: 'deals', label: 'معاملات خاص' },
  { id: 'receivables', label: 'مطالبات' }
] as const;

type TabId = typeof tabs[number]['id'];

export default function Tra() {
  const [tab, setTab] = useState<TabId>('purchases');

  return (
    <div>
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
              padding: '11px 12px',
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
                right: 12, left: 12, height: 3,
                background: 'var(--accent)',
                borderRadius: '3px 3px 0 0'
              }} />
            ) : null}
          </div>
        ))}
      </div>

      {tab === 'purchases' ? <PurchasesPage /> : null}
      {tab === 'sales' ? <SalesPage /> : null}
      {tab === 'deals' ? <DealsPage /> : null}
      {tab === 'receivables' ? <ReceivablesPage /> : null}
    </div>
  );
}
