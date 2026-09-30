/**
 * index.tsx — تنظیمات (گروه‌بندی منطقی)
 */
import { useState } from 'react';
import ProfileTab from './ProfileTab';
import AppearanceTab from './AppearanceTab';
import ModulesTab from './ModulesTab';
import NotificationsTab from './NotificationsTab';
import BackupTab from './BackupTab';
import AboutTab from './AboutTab';
import LogsTab from './LogsTab';
import IncubationProfilesTab from './IncubationProfilesTab';

type TabId =
  | 'profile' | 'appearance'
  | 'modules' | 'incubation' | 'notifications'
  | 'backup' | 'logs' | 'about';

interface TabDef {
  id: TabId;
  label: string;
  icon: string;
}

interface GroupDef {
  label: string;
  icon: string;
  tabs: TabDef[];
}

const GROUPS: GroupDef[] = [
  {
    label: 'حساب',
    icon: '👤',
    tabs: [
      { id: 'profile', label: 'پروفایل', icon: '👤' },
      { id: 'appearance', label: 'ظاهر', icon: '🎨' },
    ],
  },
  {
    label: 'مرغداری',
    icon: '🏭',
    tabs: [
      { id: 'modules', label: 'ماژول‌ها', icon: '🧩' },
      { id: 'incubation', label: 'انکوباسیون', icon: '🐣' },
      { id: 'notifications', label: 'اعلان‌ها', icon: '🔔' },
    ],
  },
  {
    label: 'سیستم',
    icon: '⚙️',
    tabs: [
      { id: 'backup', label: 'پشتیبان', icon: '💾' },
      { id: 'logs', label: 'لاگ', icon: '📋' },
      { id: 'about', label: 'درباره', icon: 'ℹ️' },
    ],
  },
];

const ALL_TABS = GROUPS.flatMap(g => g.tabs);

const LAST_TAB_KEY = 'pm-set-last-tab';

function getLastTab(): TabId {
  try {
    const saved = localStorage.getItem(LAST_TAB_KEY);
    if (saved) return saved as TabId;
  } catch {}
  return 'profile';
}

export default function Set() {
  const [tab, setTab] = useState<TabId>(getLastTab);

  // Persist tab change
  const changeTab = (id: TabId) => {
    setTab(id);
    try { localStorage.setItem(LAST_TAB_KEY, id); } catch {}
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        gap: 'var(--gap-xs)',
        borderBottom: '1px solid var(--border)',
        padding: '0 var(--sp-2)',
        background: 'var(--header-bg)',
        position: 'sticky',
        top: 52,
        zIndex: 11,
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {GROUPS.map((group, gi) => (
          <div key={group.label} style={{ display: 'flex', alignItems: 'center' }}>
            {gi > 0 && (
              <div aria-hidden="true" style={{
                width: 1,
                height: 20,
                background: 'var(--border)',
                margin: '0 var(--gap-xs)',
                flexShrink: 0,
              }} />
            )}
            {group.tabs.map(t => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => changeTab(t.id)}
                  style={{
                    padding: '10px var(--sp-2)',
                    fontSize: 'var(--fs-sm)',
                    fontWeight: 600,
                    color: active ? 'var(--accent)' : 'var(--muted)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span aria-hidden="true">{t.icon}</span>
                  <span>{t.label}</span>
                  {active && (
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 6,
                      left: 6,
                      height: 3,
                      background: 'var(--accent)',
                      borderRadius: '3px 3px 0 0',
                    }} />
                  )}
                </button>
              );
            })}
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
