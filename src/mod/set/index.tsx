/**
 * index.tsx — تنظیمات (گروه‌بندی منطقی)
 */
import {useState, useRef, useEffect} from 'react';
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

  const ALL_TAB_IDS = ALL_TABS.map(t => t.id as string);
  const scrollRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);
  const clickToRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ids = ['profile', 'appearance', 'modules', 'notifications', 'backup', 'incubation', 'logs', 'about'] as string[];
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
      const ids = ['profile', 'appearance', 'modules', 'notifications', 'backup', 'incubation', 'logs', 'about'] as string[];
      const newTab = ids[bestIdx];
      if (newTab && newTab !== tab) setTab(newTab as TabId);
    }, 90);
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
                  onClick={() => { clickToRef.current = true; changeTab(t.id); }}
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
          <div key="profile" style={{ minWidth: '100%', flexShrink: 0, scrollSnapAlign: 'start' }}><ProfileTab /></div>
          <div key="appearance" style={{ minWidth: '100%', flexShrink: 0, scrollSnapAlign: 'start' }}><AppearanceTab /></div>
          <div key="modules" style={{ minWidth: '100%', flexShrink: 0, scrollSnapAlign: 'start' }}><ModulesTab /></div>
          <div key="notifications" style={{ minWidth: '100%', flexShrink: 0, scrollSnapAlign: 'start' }}><NotificationsTab /></div>
          <div key="backup" style={{ minWidth: '100%', flexShrink: 0, scrollSnapAlign: 'start' }}><BackupTab /></div>
          <div key="incubation" style={{ minWidth: '100%', flexShrink: 0, scrollSnapAlign: 'start' }}><IncubationProfilesTab /></div>
          <div key="logs" style={{ minWidth: '100%', flexShrink: 0, scrollSnapAlign: 'start' }}><LogsTab /></div>
          <div key="about" style={{ minWidth: '100%', flexShrink: 0, scrollSnapAlign: 'start' }}><AboutTab /></div>
        </div>
      </div>
    </div>
  );
}
