/**
 * index.tsx — بخش hal
 */
import {useState, useRef, useEffect} from 'react';
import HallsPage from './HallsPage';
import ZonesPage from './ZonesPage';
import EquipmentPage from './EquipmentPage';

const tabs = [
  { id: 'halls', label: 'سالن‌ها' },
  { id: 'zones', label: 'بخش‌ها' },
  { id: 'equip', label: 'تجهیزات' }
] as const;

type TabId = typeof tabs[number]['id'];

export default function Hal() {
  const [tab, setTab] = useState<TabId>('halls');
  const scrollRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ids = ['halls', 'zones', 'equip'] as string[];
    const idx = ids.indexOf(tab);
    if (idx < 0) return;
    const target = idx * el.clientWidth;
    if (Math.abs(el.scrollLeft - target) < 4) return;
    syncingRef.current = true;
    el.scrollTo({ left: target, behavior: 'smooth' });
    const t = setTimeout(() => { syncingRef.current = false; }, 500);
    return () => clearTimeout(t);
  }, [tab]);

  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onScroll = () => {
    if (syncingRef.current) return;
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      const el = scrollRef.current;
      if (!el) return;
      const w = el.clientWidth;
      if (w <= 0) return;
      // در RTL با direction:ltr روی container، scrollLeft از 0 شروع می‌شه
      const idx = Math.round(el.scrollLeft / w);
      const ids = ['halls', 'zones', 'equip'] as string[];
      const newTab = ids[idx];
      if (newTab && newTab !== tab) setTab(newTab as TabId);
    }, 70);
  };

  return (
    <div style={{ touchAction: 'pan-y' }}>
      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid var(--border)',
        padding: '0 12px', background: 'var(--header-bg)',
        position: 'sticky', top: 52, zIndex: 11
      }}>
        {tabs.map(t => (
          <div key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '11px 14px', fontSize: 'var(--fs-base)', fontWeight: 600,
            color: tab === t.id ? 'var(--accent)' : 'var(--muted)',
            cursor: 'pointer', position: 'relative', transition: 'color .15s'
          }}>
            {t.label}
            {tab === t.id && (
              <div style={{ position: 'absolute', bottom: 0, right: 14,
                 left: 14, height: 3, background: 'var(--accent)', borderRadius: '3px 3px 0 0' }} />
            )}
          </div>
        ))}
      </div>
      <div
          ref={scrollRef}
          onScroll={onScroll}
          style={{
            display: 'flex',
            direction: 'ltr',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            width: '100%',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div key="halls" style={{ minWidth: '100%', flexShrink: 0, scrollSnapAlign: 'start', contentVisibility: 'auto', containIntrinsicSize: '0 800px', direction: 'rtl', touchAction: 'pan-y' }}><HallsPage /></div>
          <div key="zones" style={{ minWidth: '100%', flexShrink: 0, scrollSnapAlign: 'start', contentVisibility: 'auto', containIntrinsicSize: '0 800px', direction: 'rtl', touchAction: 'pan-y' }}><ZonesPage /></div>
          <div key="equip" style={{ minWidth: '100%', flexShrink: 0, scrollSnapAlign: 'start', contentVisibility: 'auto', containIntrinsicSize: '0 800px', direction: 'rtl', touchAction: 'pan-y' }}><EquipmentPage /></div>
        </div>
    </div>
  );
}
