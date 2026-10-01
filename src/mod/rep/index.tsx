/**
 * index.tsx — بخش rep
 */
import { useState } from 'react';
import { useCarousel } from '../../shr/hooks/useCarousel';
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

const TAB_IDS = ['financial', 'production', 'flock', 'compare'];

export default function Rep() {
  const [tab, setTab] = useState<TabId>('financial');
  const { containerRef, trackRef, setInstant } = useCarousel(
    TAB_IDS,
    tab,
    (id) => setTab(id as TabId)
  );

  return (
    <div>
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: '1px solid var(--border)',
        padding: '0 8px',
        background: 'var(--header-bg)',
        position: 'sticky', top: 52, zIndex: 11,
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {tabs.map(t => (
          <div
            key={t.id}
            onClick={() => { setInstant(); setTab(t.id); }}
            style={{
              padding: '11px 12px',
              fontSize: 'var(--fs-base)',
              fontWeight: 600,
              color: tab === t.id ? 'var(--accent)' : 'var(--muted)',
              cursor: 'pointer',
              position: 'relative',
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
            {tab === t.id ? (
              <div style={{
                position: 'absolute', bottom: 0,
                right: 12, left: 12, height: 3,
                background: 'var(--accent)',
                borderRadius: '3px 3px 0 0',
              }} />
            ) : null}
          </div>
        ))}
      </div>

      <div
        ref={containerRef}
        style={{
          overflow: 'hidden',
          width: '100%',
          minHeight: 'calc(100vh - 120px)',
          isolation: 'isolate',
          touchAction: 'pan-y',
        }}
      >
        <div
          ref={trackRef}
          style={{
            display: 'flex',
            direction: 'ltr',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            touchAction: 'pan-y',
          }}
        >
          <div key="financial" style={{ width: '100%', maxWidth: '100%', flexShrink: 0, direction: 'rtl', boxSizing: 'border-box', overflow: 'hidden', isolation: 'isolate', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}>
            <FinancialPage />
          </div>
          <div key="production" style={{ width: '100%', maxWidth: '100%', flexShrink: 0, direction: 'rtl', boxSizing: 'border-box', overflow: 'hidden', isolation: 'isolate', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}>
            <ProductionPage />
          </div>
          <div key="flock" style={{ width: '100%', maxWidth: '100%', flexShrink: 0, direction: 'rtl', boxSizing: 'border-box', overflow: 'hidden', isolation: 'isolate', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}>
            <FlockReportPage />
          </div>
          <div key="compare" style={{ width: '100%', maxWidth: '100%', flexShrink: 0, direction: 'rtl', boxSizing: 'border-box', overflow: 'hidden', isolation: 'isolate', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}>
            <ComparePage />
          </div>
        </div>
      </div>
    </div>
  );
}
