/**
 * index.tsx — بخش inc
 */
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCarousel } from '../../shr/hooks/useCarousel';
import DevicesPage from './DevicesPage';
import EggEntriesPage from './EggEntriesPage';
import CandlingsPage from './CandlingsPage';
import HatchesPage from './HatchesPage';

const tabs = [
  { id: 'devices', label: 'دستگاه‌ها' },
  { id: 'eggs', label: 'ورودی تخم' },
  { id: 'candlings', label: 'کندلینگ' },
  { id: 'hatches', label: 'هچ' },
] as const;
type TabId = typeof tabs[number]['id'];

const TAB_IDS = ['devices', 'eggs', 'candlings', 'hatches'];

export default function Inc() {
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab') as TabId;
  const validTabs: TabId[] = ['devices', 'eggs', 'candlings', 'hatches'];
  const tab: TabId = validTabs.includes(tabParam) ? tabParam : 'devices';

  const [pendingEntry, setPendingEntry] = useState('');

  const setTab = (t: TabId) => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', t);
      next.delete('entry');
      next.delete('device');
      return next;
    });
  };

  const goTo = (t: any, payload?: { entry?: string }) => {
    if (payload?.entry) {
      setPendingEntry(payload.entry);
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('entry', payload.entry);
        window.history.replaceState({}, '', url.toString());
      } catch {}
    }
    setTab(t as TabId);
  };

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
            {tab === t.id && (
              <div style={{
                position: 'absolute', bottom: 0,
                right: 12, left: 12, height: 3,
                background: 'var(--accent)',
                borderRadius: '3px 3px 0 0',
              }} />
            )}
          </div>
        ))}
      </div>

      <div
        ref={containerRef}
        style={{
          overflow: 'hidden',
          width: '100%',
          minHeight: 'calc(100vh - 120px)',
          touchAction: 'pan-y',
        }}
      >
        <div
          ref={trackRef}
          style={{
            display: 'flex',
            direction: 'ltr',
            willChange: 'transform',
            touchAction: 'pan-y',
          }}
        >
          <div style={{ minWidth: '100%', flexShrink: 0, direction: 'rtl', contain: 'layout paint' }}>
            <DevicesPage />
          </div>
          <div style={{ minWidth: '100%', flexShrink: 0, direction: 'rtl', contain: 'layout paint' }}>
            <EggEntriesPage initialDevice={params.get('device') || ''} onGoTo={goTo} />
          </div>
          <div style={{ minWidth: '100%', flexShrink: 0, direction: 'rtl', contain: 'layout paint' }}>
            <CandlingsPage initialEntry={pendingEntry || params.get('entry') || ''} onGoTo={goTo} />
          </div>
          <div style={{ minWidth: '100%', flexShrink: 0, direction: 'rtl', contain: 'layout paint' }}>
            <HatchesPage initialEntry={params.get('entry') || ''} onGoTo={goTo} />
          </div>
        </div>
      </div>
    </div>
  );
}
