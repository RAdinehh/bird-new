/**
 * index.tsx — بخش egg
 */
import {useState, useRef, useEffect} from 'react';
import ProductionsPage from './ProductionsPage';
import StockPage from './StockPage';

const tabs = [
  { id: 'productions', label: 'تخم‌گذاری' },
  { id: 'stock', label: 'انبار و فروش' }
] as const;

type TabId = typeof tabs[number]['id'];

export default function Egg() {
  const [tab, setTab] = useState<TabId>('productions');
  const scrollRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ids = ['productions', 'stock'] as string[];
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
    const ids = ['productions', 'stock'] as string[];
    const newTab = ids[idx];
    if (newTab && newTab !== tab) setTab(newTab as TabId);
  };

  return (
    <div style={{ touchAction: 'pan-y' }}>
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
              padding: '11px 14px',
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
                right: 14, left: 14, height: 3,
                background: 'var(--accent)',
                borderRadius: '3px 3px 0 0'
              }} />
            ) : null}
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
          <div key="productions" style={{ minWidth: '100%', flexShrink: 0, scrollSnapAlign: 'start', contentVisibility: 'auto', containIntrinsicSize: '0 800px' }}><ProductionsPage /></div>
          <div key="stock" style={{ minWidth: '100%', flexShrink: 0, scrollSnapAlign: 'start', contentVisibility: 'auto', containIntrinsicSize: '0 800px' }}><StockPage /></div>
        </div>
    </div>
  );
}
