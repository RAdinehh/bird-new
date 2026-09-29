import { useState } from 'react';
import ProfileTab from './ProfileTab';
import AppearanceTab from './AppearanceTab';
import ModulesTab from './ModulesTab';
import NotificationsTab from './NotificationsTab';
import BackupTab from './BackupTab';
import AboutTab from './AboutTab';
import LogsTab from './LogsTab';
import IncubationProfilesTab from './IncubationProfilesTab';

const tabs = [
  { id: 'profile', label: 'پروفایل' },
  { id: 'appearance', label: 'ظاهر' },
  { id: 'modules', label: 'ماژول‌ها' },
  { id: 'notifications', label: 'اعلان‌ها' },
  { id: 'backup', label: 'پشتیبان' },
  { id: 'incubation', label: '🐣 انکوباسیون' },
  { id: 'logs', label: 'لاگ خطاها' },
  { id: 'about', label: 'درباره' }
] as const;

type TabId = typeof tabs[number]['id'];

export default function Set() {
  const [tab, setTab] = useState<TabId>('profile');
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
            cursor: 'pointer', position: 'relative', transition: 'color .15s',
            whiteSpace: 'nowrap'
          }}>
            {t.label}
            {tab === t.id && (
              <div style={{ position: 'absolute', bottom: 0, right: 12, left: 12, height: 2.5, background: 'var(--accent)', borderRadius: '3px 3px 0 0' }} />
            )}
          </div>
        ))}
      </div>
      <div style={{ padding: 'var(--sp-3)' }}>
        {tab === 'profile' && <ProfileTab />}
        {tab === 'appearance' && <AppearanceTab />}
        {tab === 'modules' && <ModulesTab />}
        {tab === 'notifications' && <NotificationsTab />}
        {tab === 'backup' && <BackupTab />}
        {tab === 'incubation' && <IncubationProfilesTab />}
        {tab === 'logs' && <LogsTab />}
        {tab === 'about' && <AboutTab />}
      </div>
    </div>
  );
}
