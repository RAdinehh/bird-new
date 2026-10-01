import {useState, useRef, useEffect} from 'react';
import ItemsPage from './ItemsPage';
import MovesPage from './MovesPage';
import WarningsPage from './WarningsPage';
import { useWhs, stockWarning, expiryWarning } from './store';
import { toFa } from '../../shr/utils/fa';

const tabs = [
  { id: 'items', label: 'اقلام' },
  { id: 'moves', label: 'ورود/خروج' },
  { id: 'warnings', label: 'هشدارها' }
] as const;

type TabId = typeof tabs[number]['id'];

export default function Whs() {
  const [tab, setTab] = useState<TabId>('items');
  const { items } = useWhs();

  const warnCount = items.filter(i =>
    stockWarning(i) !== 'ok' || expiryWarning(i) !== 'ok'
  ).length;
  const scrollRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ids = ['items', 'moves', 'warnings'] as string[];
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
    const ids = ['items', 'moves', 'warnings'] as string[];
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
              padding: '11px 12px',
              fontSize: 'var(--fs-base)',
              fontWeight: 600,
              color: tab === t.id ? 'var(--accent)' : 'var(--muted)',
              cursor: 'pointer',
              position: 'relative',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'flex', alignItems: 'center', gap: 5
            }}
          >
            {t.label}
            {t.id === 'warnings' && warnCount > 0 ? (
              <span style={{
                fontSize: 12,
                background: 'var(--danger)',
                color: '#fff',
                padding: '1px 6px',
                borderRadius: 8,
                fontWeight: 700
              }}>{toFa(warnCount)}</span>
            ) : null}
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
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            width: '100%',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div key="items" style={{ minWidth: '100%', flexShrink: 0, scrollSnapAlign: 'start', contentVisibility: 'auto', containIntrinsicSize: '0 800px' }}><ItemsPage /></div>
          <div key="moves" style={{ minWidth: '100%', flexShrink: 0, scrollSnapAlign: 'start', contentVisibility: 'auto', containIntrinsicSize: '0 800px' }}><MovesPage /></div>
          <div key="warnings" style={{ minWidth: '100%', flexShrink: 0, scrollSnapAlign: 'start', contentVisibility: 'auto', containIntrinsicSize: '0 800px' }}><WarningsPage /></div>
        </div>
    </div>
  );
}
