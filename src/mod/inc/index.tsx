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
  const setTab = (t: TabId) => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', t);
      next.delete('entry');
      next.delete('device');
      return next;
    });
  };
  return (
    <div>
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
               right: 12, left: 12, height: 2.5, background: 'var(--accent)',
               borderRadius: '3px 3px 0 0' }} />}
          </div>
        ))}
      </div>
      {tab === 'devices' && <DevicesPage />}
      {tab === 'eggs' && <EggEntriesPage initialDevice={params.get('device') || ''} />}
      {tab === 'candlings' && <CandlingsPage initialEntry={params.get('entry') || ''} />}
      {tab === 'hatches' && <HatchesPage initialEntry={params.get('entry') || ''} />}
    </div>
  );
}
