/**
 * index.tsx — بخش hal
 */
import { useEffect, useMemo } from 'react';
import { useUrlFilter } from '../../shr/hooks/useUrlFilter';
import { useCarousel } from '../../shr/hooks/useCarousel';
import HallsPage from './HallsPage';
import ZonesPage from './ZonesPage';
import EquipmentPage from './EquipmentPage';
import ArchivePage from './components/ArchivePage';
import { useHal } from './store';

const BASE_TABS = [
  { id: 'halls', label: 'سالن‌ها' },
  { id: 'zones', label: 'بخش‌ها' },
  { id: 'equip', label: 'تجهیزات' },
];

type TabId = 'halls' | 'zones' | 'equip' | 'archive';

const TAB_IDS = ['halls', 'zones', 'equip', 'archive'];

export default function Hal() {
  const { halls, zones, equipment } = useHal();
  const archivedCount = useMemo(() => {
    return (
      halls.filter(h => h.archived).length +
      zones.filter(z => z.archived).length +
      equipment.filter(e => e.status === 'archived').length
    );
  }, [halls, zones, equipment]);

  const [tabParam, setTabParam] = useUrlFilter('tab', 'halls');
  const tab = (TAB_IDS.includes(tabParam) ? tabParam : 'halls') as TabId;

  useEffect(() => {
    if (!tabParam || !TAB_IDS.includes(tabParam)) setTabParam('halls');
  }, [tabParam, setTabParam]);
  const visibleTabs = useMemo(() => {
    if (archivedCount > 0) {
      return [...BASE_TABS, { id: 'archive', label: `📦 آرشیو (${archivedCount})` }];
    }
    return BASE_TABS;
  }, [archivedCount]);

  const { containerRef, trackRef, setInstant } = useCarousel(
    TAB_IDS,
    tab,
    (id) => setTabParam(id as TabId)
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
        {visibleTabs.map((t: { id: string; label: string }) => (
          <div
            key={t.id}
            onClick={() => { setInstant(); setTabParam(t.id); }}
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
          overflowX: 'hidden',
          width: '100%',
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
            touchAction: 'pan-y',
            width: '100%',
            minWidth: 0,
          }}
        >
          <div key="halls" style={{ flex: '0 0 100%', width: '100%', minWidth: 0, maxWidth: '100%', direction: 'rtl', overflow: 'hidden', boxSizing: 'border-box', isolation: 'isolate' }}>
            <HallsPage active={tab === 'halls'} />
          </div>
          <div key="zones" style={{ flex: '0 0 100%', width: '100%', minWidth: 0, maxWidth: '100%', direction: 'rtl', overflow: 'hidden', boxSizing: 'border-box', isolation: 'isolate' }}>
            <ZonesPage active={tab === 'zones'} />
          </div>
          <div key="equip" style={{ flex: '0 0 100%', width: '100%', minWidth: 0, maxWidth: '100%', direction: 'rtl', overflow: 'hidden', boxSizing: 'border-box', isolation: 'isolate' }}>
            <EquipmentPage active={tab === 'equip'} />
          </div>
          <div key="archive" style={{ flex: '0 0 100%', width: '100%', minWidth: 0, maxWidth: '100%', direction: 'rtl', overflow: 'hidden', boxSizing: 'border-box', isolation: 'isolate' }}>
            <ArchivePage active={tab === 'archive'} />
          </div>
        </div>
      </div>
    </div>
  );
}
