/**
 * index.tsx — تنظیمات (۵ تب اصلی)
 */
import EnvStandardsTab from './EnvStandardsTab';
import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useCarousel } from '../../shr/hooks/useCarousel';
import ProfileTab from './ProfileTab';
import AppearanceTab from './AppearanceTab';
import ModulesTab from './ModulesTab';
import UnitsTab from './units/UnitsTab';
import NotificationsTab from './NotificationsTab';
import BackupTab from './BackupTab';
import AboutTab from './AboutTab';
import LogsTab from './LogsTab';
import SettingsGroup from './SettingsGroup';

type TabId =
  | 'account'
  | 'appearance'
  | 'config'
  | 'notifications'
  | 'system';

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
    label: 'تنظیمات',
    icon: '⚙️',
    tabs: [
      { id: 'account',       label: 'حساب کاربری',   icon: '👤' },
      { id: 'appearance',    label: 'ظاهر و نمایش',  icon: '🎨' },
      { id: 'config',        label: 'پیکربندی',      icon: '⚙️' },
      { id: 'notifications', label: 'اعلان‌ها',       icon: '🔔' },
      { id: 'system',        label: 'سیستم',          icon: '💾' },
    ],
  },
];

const ALL_TABS = GROUPS.flatMap(g => g.tabs);
const TAB_IDS = ALL_TABS.map(t => t.id as string);

const LAST_TAB_KEY = 'pm-set-last-tab-v2';

function getLastTab(): TabId {
  try {
    const saved = localStorage.getItem(LAST_TAB_KEY);
    if (saved && TAB_IDS.includes(saved)) return saved as TabId;
  } catch { /* silent */ }
  return 'account';
}

/** هر تب می‌تونه چند کامپوننت رو کنار هم نشون بده */
type TabComponent = React.ComponentType | {
  comp: React.ComponentType;
  icon: string;
  title: string;
  subtitle?: string;
  tone?: 'accent' | 'warn' | 'info' | 'purple' | 'danger';
};

const TAB_COMPONENTS: Record<TabId, TabComponent[]> = {
  account:       [ProfileTab],
  appearance:    [AppearanceTab],
  config: [
    { comp: EnvStandardsTab, icon: '📏', title: 'استانداردهای نژادها', subtitle: 'دما، رطوبت، دان، وزن، تلفات', tone: 'accent' },
    { comp: UnitsTab,        icon: '📐', title: 'واحدها و اندازه‌گیری', subtitle: 'ارز، دما، وزن، حجم، طول، مساحت', tone: 'info' },
    { comp: ModulesTab,      icon: '🧩', title: 'ماژول‌ها',              subtitle: 'فعال / غیرفعال کردن بخش‌های نرم‌افزار', tone: 'purple' },
  ],
  notifications: [NotificationsTab],
  system: [
    { comp: BackupTab, icon: '💾', title: 'پشتیبان‌گیری',      subtitle: 'آمار، پشتیبان، بازیابی، امنیت', tone: 'accent' },
    { comp: LogsTab,   icon: '📋', title: 'لاگ عملیات',         subtitle: 'تاریخچه فعالیت‌ها و خطاها',      tone: 'info' },
    { comp: AboutTab,  icon: 'ℹ️', title: 'درباره',            subtitle: 'اطلاعات برنامه، راهنما، تماس',   tone: 'purple' },
  ],
};

export default function Set() {
  const [tab, setTab] = useState<TabId>(getLastTab);
  const tabsBarRef = useRef<HTMLDivElement>(null);

  const changeTab = (id: TabId) => {
    setTab(id);
    try { localStorage.setItem(LAST_TAB_KEY, id); } catch { /* silent */ }
  };

  // وقتی تب فعال عوض میشه، نوار بالا رو اسکرول کن که تب فعال دیده شه
  useEffect(() => {
    const bar = tabsBarRef.current;
    if (!bar) return;
    const btn = bar.querySelector(`[data-tab-id="${tab}"]`) as HTMLElement | null;
    if (!btn) return;
    const barRect = bar.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const offset = (btnRect.left + btnRect.width / 2) - (barRect.left + barRect.width / 2);
    bar.scrollBy({ left: offset, behavior: 'smooth' });
  }, [tab]);

  const { containerRef, trackRef, setInstant } = useCarousel(
    TAB_IDS,
    tab,
    (id) => changeTab(id as TabId)
  );

  return (
    <div>
      <div
        ref={tabsBarRef}
        style={{
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
        }}
      >
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
                  data-tab-id={t.id}
                  onClick={() => { setInstant(); changeTab(t.id); }}
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

      <div style={{ padding: '8px 6px' }}>
        <div
          ref={containerRef}
          style={{
            overflow: 'hidden',
            overflowX: 'hidden',
            width: '100%',
            touchAction: 'pan-y',
            isolation: 'isolate',
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
            {ALL_TABS.map(t => {
              const comps = TAB_COMPONENTS[t.id];
              return (
                <div
                  key={t.id}
                  style={{
                    flex: '0 0 100%',
                    width: '100%',
                    minWidth: 0,
                    maxWidth: '100%',
                    direction: 'rtl',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                    isolation: 'isolate',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--sp-3)',
                  }}>
                    {comps.map((c, i) => {
                      // چک کن آبجکته یا کامپوننت ساده
                      const isWrapped = typeof c === 'object' && c !== null && 'comp' in c;
                      if (!isWrapped) {
                        const Comp = c as React.ComponentType;
                        return <Comp key={i} />;
                      }
                      const { comp: Comp, icon, title, subtitle, tone } = c as {
                        comp: React.ComponentType;
                        icon: string;
                        title: string;
                        subtitle?: string;
                        tone?: 'accent' | 'warn' | 'info' | 'purple' | 'danger';
                      };
                      return (
                        <SettingsGroup
                          key={i}
                          icon={icon}
                          title={title}
                          subtitle={subtitle}
                          tone={tone || 'accent'}
                        >
                          <Comp />
                        </SettingsGroup>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
