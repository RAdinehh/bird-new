import { useState } from 'react';
import FinancialPage from './FinancialPage';
import ProductionPage from './ProductionPage';
import FlockReportPage from './FlockReportPage';
import ComparePage from './ComparePage';

const tabs = [
  { id: 'financial', label: 'مالی' },
  { id: 'production', label: 'تولید' },
  { id: 'flock', label: 'گله' },
  { id: 'compare', label: 'مقایسه' }
] as const;

type TabId = typeof tabs[number]['id'];

export default function Rep() {
  const [tab, setTab] = useState<TabId>('financial');

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
                right: 12, left: 12, height: 36.5,
                background: 'var(--accent)',
                borderRadius: '3px 3px 0 0'
              }} />
            ) : null}
          </div>
        ))}
      </div>

      {tab === 'financial' ? <FinancialPage /> : null}
      {tab === 'production' ? <ProductionPage /> : null}
      {tab === 'flock' ? <FlockReportPage /> : null}
      {tab === 'compare' ? <ComparePage /> : null}
    </div>
  );
}
