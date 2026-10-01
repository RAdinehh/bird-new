/**
 * index.tsx — بخش inc
 */
import {useState, useRef, useEffect} from 'react';
import { useSearchParams } from 'react-router-dom';
import DevicesPage from './DevicesPage';
import EggEntriesPage from './EggEntriesPage';
import CandlingsPage from './CandlingsPage';
import HatchesPage from './HatchesPage';

const tabs = [
  { id: 'devices', label: 'دستگاه‌ها' },
  { id: 'eggs', label: 'ورودی تخم' },
  { id: 'candlings', label: 'کندلینگ' },
  { id: 'hatches', label: 'هچ' }
] as const;
type TabId = typeof tabs[number]['id'];

export default function Inc() {
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab') as TabId;
  const validTabs: TabId[] = ['devices', 'eggs', 'candlings', 'hatches'];
  const tab: TabId = validTabs.includes(tabParam) ? tabParam : 'devices';
  const [pendingEntry, setPendingEntry] = useState('');
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

  const setTab = (t: TabId) => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', t);
      next.delete('entry');
      next.delete('device');
      return next;
    });
  };
  const scrollRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ids = ['devices', 'eggs', 'candlings', 'hatches'] as string[];
    const idx = ids.indexOf(tab);
    if (idx < 0) return;
    const target = idx * el.clientWidth;
    if (Math.abs(el.scrollLeft - target) < 4) return;
    syncingRef.current = true;
    el.scrollTo({ left: target, behavior: 'smooth' });
    const t = setTimeout(() => { syncingRef.current = false; }, 500);
    return () => clearTimeout(t);
  }, [tab]);

  const onScroll = () => {
    if (syncingRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const w = el.clientWidth;
    if (w <= 0) return;
    const idx = Math.round(el.scrollLeft / w);
    const ids = ['devices', 'eggs', 'candlings', 'hatches'] as string[];
    const newTab = ids[idx];
    if (newTab && newTab !== tab) setTab(newTab as TabId);
  };

  return (
    <div style={{ touchAction: 'pan-y' }}>
      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid var(--border)',
        padding: '0 8px', background: 'var(--header-bg)',
        position: 'sticky', top: 52, zIndex: 11, overflowX: 'auto', scrollbarWidth: 'none'
      }}>
        {tabs.map(t => (
          <div key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '11px 12px', fontSize: 'var(--fs-base)', fontWeight: 600,
            color: tab === t.id ? 'var(--accent)' : 'var(--muted)',
            cursor: 'pointer', position: 'relative', whiteSpace: 'nowrap'
          }}>
            {t.label}
            {tab === t.id && <div style={{ position: 'absolute', bottom: 0,
               right: 12, left: 12, height: 3, background: 'var(--accent)',
               borderRadius: '3px 3px 0 0' }} />}
          </div>
        ))}
      </div>
      <div
          ref={scrollRef}
          onScroll={onScroll}
          style={{
            display: 'flex',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            width: '100%',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div key="devices" style={{ minWidth: '100%', flexShrink: 0, scrollSnapAlign: 'start', contentVisibility: 'auto', containIntrinsicSize: '0 800px' }}><DevicesPage /></div>
          <div key="eggs" style={{ minWidth: '100%', flexShrink: 0, scrollSnapAlign: 'start', contentVisibility: 'auto', containIntrinsicSize: '0 800px' }}><EggEntriesPage initialDevice={params.get('device') || ''} onGoTo={goTo} /></div>
          <div key="candlings" style={{ minWidth: '100%', flexShrink: 0, scrollSnapAlign: 'start', contentVisibility: 'auto', containIntrinsicSize: '0 800px' }}><CandlingsPage initialEntry={pendingEntry || params.get('entry') || ''} onGoTo={goTo} /></div>
          <div key="hatches" style={{ minWidth: '100%', flexShrink: 0, scrollSnapAlign: 'start', contentVisibility: 'auto', containIntrinsicSize: '0 800px' }}><HatchesPage initialEntry={params.get('entry') || ''} onGoTo={goTo} /></div>
        </div>
    </div>
  );
}
