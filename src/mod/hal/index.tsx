import { useState } from 'react';
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
  return (
    <div>
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
              <div style={{ position: 'absolute', bottom: 0, right: 14, left: 14, height: 2.5, background: 'var(--accent)', borderRadius: '3px 3px 0 0' }} />
            )}
          </div>
        ))}
      </div>
      {tab === 'halls' && <HallsPage />}
      {tab === 'zones' && <ZonesPage />}
      {tab === 'equip' && <EquipmentPage />}
    </div>
  );
}
