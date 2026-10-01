/**
 * index.tsx — بخش whs
 */
import { useState } from 'react';
import { useCarousel } from '../../shr/hooks/useCarousel';
import ItemsPage from './ItemsPage';
import MovesPage from './MovesPage';
import WarningsPage from './WarningsPage';
import { useWhs, stockWarning, expiryWarning } from './store';
import { toFa } from '../../shr/utils/fa';

const tabs = [
  { id: 'items', label: 'اقلام' },
  { id: 'moves', label: 'ورود/خروج' },
  { id: 'warnings', label: 'هشدارها' },
] as const;

type TabId = typeof tabs[number]['id'];

const TAB_IDS = ['items', 'moves', 'warnings'];

export default function Whs() {
  const [tab, setTab] = useState<TabId>('items');
  const { items } = useWhs();
  const warnCount = items.filter(i =>
    stockWarning(i) !== 'ok' || expiryWarning(i) !== 'ok'
  ).length;

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
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <span>{t.label}</span>
            {t.id === 'warnings' && warnCount > 0 ? (
              <span style={{
                fontSize: 12,
                background: 'var(--danger)',
                color: '#fff',
                padding: '1px 6px',
                borderRadius: 8,
                fontWeight: 700,
              }}>{toFa(warnCount)}</span>
            ) : null}
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
          <div key="items" style={{ width: '100%', maxWidth: '100%', flexShrink: 0, direction: 'rtl', boxSizing: 'border-box', overflow: 'hidden', isolation: 'isolate', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}>
            <ItemsPage />
          </div>
          <div key="moves" style={{ width: '100%', maxWidth: '100%', flexShrink: 0, direction: 'rtl', boxSizing: 'border-box', overflow: 'hidden', isolation: 'isolate', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}>
            <MovesPage />
          </div>
          <div key="warnings" style={{ width: '100%', maxWidth: '100%', flexShrink: 0, direction: 'rtl', boxSizing: 'border-box', overflow: 'hidden', isolation: 'isolate', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}>
            <WarningsPage />
          </div>
        </div>
      </div>
    </div>
  );
}
