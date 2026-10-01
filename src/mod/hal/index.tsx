/**
 * index.tsx — بخش hal
 */
import { useState } from 'react';
import { useCarousel } from '../../shr/hooks/useCarousel';
import HallsPage from './HallsPage';
import ZonesPage from './ZonesPage';
import EquipmentPage from './EquipmentPage';

const tabs = [
  { id: 'halls', label: 'سالن‌ها' },
  { id: 'zones', label: 'بخش‌ها' },
  { id: 'equip', label: 'تجهیزات' },
] as const;

type TabId = typeof tabs[number]['id'];

const TAB_IDS = ['halls', 'zones', 'equip'];

export default function Hal() {
  const [tab, setTab] = useState<TabId>('halls');
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
        overflowX: 'auto', scrollbarWidth: 'none',
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
                position: 'absolute', bottom: 0,
                right: 14, left: 14, height: 3,
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
          <div key="halls" style={{ width: '100%', maxWidth: '100%', flexShrink: 0, direction: 'rtl', boxSizing: 'border-box', overflow: 'hidden', isolation: 'isolate', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}>
            <HallsPage />
          </div>
          <div key="zones" style={{ width: '100%', maxWidth: '100%', flexShrink: 0, direction: 'rtl', boxSizing: 'border-box', overflow: 'hidden', isolation: 'isolate', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}>
            <ZonesPage />
          </div>
          <div key="equip" style={{ width: '100%', maxWidth: '100%', flexShrink: 0, direction: 'rtl', boxSizing: 'border-box', overflow: 'hidden', isolation: 'isolate', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}>
            <EquipmentPage />
          </div>
        </div>
      </div>
    </div>
  );
}
