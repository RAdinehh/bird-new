import { useState } from 'react';
import { useCarousel } from '../../shr/hooks/useCarousel';
import BirdsPage from './BirdsPage';
import BreedsPage from './BreedsPage';

const tabs = [
  { id: 'birds', label: 'پرنده‌ها' },
  { id: 'breeds', label: 'نژادها' },
] as const;

type TabId = typeof tabs[number]['id'];

const TAB_IDS = ['birds', 'breeds'];

export default function Brd() {
  const [tab, setTab] = useState<TabId>('birds');
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
        padding: '0 12px',
        background: 'var(--header-bg)',
        position: 'sticky', top: 52, zIndex: 11,
      }}>
        {tabs.map(t => (
          <div
            key={t.id}
            onClick={() => { setInstant(); setTab(t.id); }}
            style={{
              padding: '11px 14px',
              fontSize: 'var(--fs-base)',
              fontWeight: 600,
              color: tab === t.id ? 'var(--accent)' : 'var(--muted)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'color .15s',
            }}
          >
            {t.label}
            {tab === t.id ? (
              <div style={{
                position: 'absolute', bottom: 0, right: 14, left: 14,
                height: 3, background: 'var(--accent)',
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
          overflowX: 'hidden',
          width: '100%',
          minHeight: 'calc(100vh - 120px)',
          touchAction: 'pan-y',
          isolation: 'isolate',
        }}
      >
        <div
          ref={trackRef}
          style={{
            display: 'flex',
            direction: 'ltr',
            willChange: 'transform',
            touchAction: 'pan-y',
            width: '100%',
            minWidth: 0,
          }}
        >
          <div style={{ flex: '0 0 100%', width: '100%', minWidth: 0, maxWidth: '100%', direction: 'rtl', overflow: 'hidden', boxSizing: 'border-box', isolation: 'isolate' }}>
            <BirdsPage />
          </div>
          <div style={{ flex: '0 0 100%', width: '100%', minWidth: 0, maxWidth: '100%', direction: 'rtl', overflow: 'hidden', boxSizing: 'border-box', isolation: 'isolate' }}>
            <BreedsPage />
          </div>
        </div>
      </div>
    </div>
  );
}
