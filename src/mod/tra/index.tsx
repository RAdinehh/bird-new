/**
 * index.tsx — بخش tra
 */
import {useState, useRef, useEffect} from 'react';
import PurchasesPage from './PurchasesPage';
import SalesPage from './SalesPage';
import DealsPage from './DealsPage';
import ReceivablesPage from './ReceivablesPage';

const tabs = [
  { id: 'purchases', label: 'خرید' },
  { id: 'sales', label: 'فروش' },
  { id: 'deals', label: 'معاملات خاص' },
  { id: 'receivables', label: 'مطالبات' }
] as const;

type TabId = typeof tabs[number]['id'];

export default function Tra() {
  const [tab, setTab] = useState<TabId>('purchases');
  const scrollRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);
  const clickToRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ids = ['purchases', 'sales', 'deals', 'receivables'] as string[];
    const idx = ids.indexOf(tab);
    if (idx < 0) return;
    const child = el.children[idx] as HTMLElement | undefined;
    if (!child) return;
    const cr = child.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    const delta = cr.left - er.left;
    if (Math.abs(delta) < 4) return;
    syncingRef.current = true;
    el.scrollBy({
      left: delta,
      behavior: clickToRef.current ? 'auto' : 'smooth',
    });
    clickToRef.current = false;
    const t = setTimeout(() => { syncingRef.current = false; }, 400);
    return () => clearTimeout(t);
  }, [tab]);

  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onScroll = () => {
    if (syncingRef.current) return;
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      const el = scrollRef.current;
      if (!el) return;
      const er = el.getBoundingClientRect();
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < el.children.length; i++) {
        const c = el.children[i] as HTMLElement;
        const cr = c.getBoundingClientRect();
        const d = Math.abs(cr.left - er.left);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      }
      const ids = ['purchases', 'sales', 'deals', 'receivables'] as string[];
      const newTab = ids[bestIdx];
      if (newTab && newTab !== tab) setTab(newTab as TabId);
    }, 90);
  };

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
            onClick={() => { clickToRef.current = true; setTab(t.id); }}
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
                right: 12, left: 12, height: 3,
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
            direction: 'rtl',
            overflowX: 'auto',
            overflowY: 'hidden',
            touchAction: 'pan-x',
            scrollSnapType: 'x mandatory',
            width: '100%',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div key="purchases" style={{ minWidth: '100%', flexShrink: 0, scrollSnapAlign: 'start' }}><PurchasesPage /></div>
          <div key="sales" style={{ minWidth: '100%', flexShrink: 0, scrollSnapAlign: 'start' }}><SalesPage /></div>
          <div key="deals" style={{ minWidth: '100%', flexShrink: 0, scrollSnapAlign: 'start' }}><DealsPage /></div>
          <div key="receivables" style={{ minWidth: '100%', flexShrink: 0, scrollSnapAlign: 'start' }}><ReceivablesPage /></div>
        </div>
    </div>
  );
}
