/**
 * helpers.tsx — helperهای مشترک ماژول dlg
 */
import type { ReactNode, CSSProperties } from 'react';
import { toFa } from '../../shr/utils/fa';

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div style={{ paddingTop: 10, marginTop: 4, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)' }}>{children}</div>
  );
}

export function Row({ l, v, warn }: { l: string; v: string; warn?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: warn ? 'var(--warn-soft)' : 'var(--input-bg)', borderRadius: 'var(--r-sm)', color: warn ? 'var(--warn)' : undefined, fontWeight: warn ? 700 : undefined }}>
      <span style={{ color: warn ? 'var(--warn)' : 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: warn ? 'var(--warn)' : 'var(--text)' }}>{v}</span>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// Form Components — گروه‌بندی جدید
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';

interface FormGroupProps {
  id: string;
  icon: string;
  title: string;
  sub?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function FormGroup({ id, icon, title, sub, open, onToggle, children }: FormGroupProps) {
  return (
    <div id={'fg-' + id} style={{
      position: 'relative',
      background: 'var(--card)',
      backdropFilter: 'blur(8px)',
      border: '1px solid ' + (open ? 'var(--accent)' : 'var(--border)'),
      borderRadius: 'var(--r-lg)',
      overflow: 'hidden',
      marginBottom: 8,
      flexShrink: 0,
      scrollMarginTop: 80,
      transition: 'border-color var(--dur-base)',
    }}>
      <div style={{
        position: 'absolute',
        top: 0, right: 0, bottom: 0,
        width: 4,
        background: open ? 'var(--accent)' : 'var(--accent-border)',
        zIndex: 1,
        transition: 'background var(--dur-base)',
      }} />
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-label={(open ? 'بستن ' : 'باز کردن ') + title}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 18px 12px 16px',
          cursor: 'pointer',
          userSelect: 'none',
          outline: 'none',
        }}
      >
        <div style={{
          width: 42, height: 42,
          borderRadius: 'var(--r-md)',
          background: 'var(--accent-soft)',
          color: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
          flexShrink: 0,
        }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 'var(--fs-md)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: open ? 'var(--accent)' : 'var(--text)',
            transition: 'color var(--dur-fast)',
          }}>{title}</div>
          {sub && !open ? (
            <div style={{
              fontSize: 'var(--fs-sm)',
              color: 'var(--muted)',
              marginTop: 3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>{sub}</div>
          ) : null}
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke={open ? 'var(--accent)' : 'var(--dim)'}
          strokeWidth="2.5" strokeLinecap="round"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform var(--dur-slow)',
            flexShrink: 0,
          }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      <div
        aria-hidden={!open}
        style={{
          maxHeight: open ? 6000 : 0,
          overflow: 'hidden',
          opacity: open ? 1 : 0,
          transition: 'max-height 350ms cubic-bezier(.16,1,.3,1), opacity 250ms ease',
        }}
      >
        <div style={{
          padding: '0 18px 14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

interface FormSubProps {
  icon?: string;
  title: string;
  children: ReactNode;
}

export function FormSub({ icon, title, children }: FormSubProps) {
  return (
    <div style={{
      borderTop: '1px dashed var(--border)',
      paddingTop: 12,
      marginTop: 2,
    }}>
      <div style={{
        fontSize: 'var(--fs-xs)',
        fontWeight: 700,
        color: 'var(--muted)',
        paddingBottom: 6,
        letterSpacing: '.3px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}>
        {icon && <span>{icon}</span>}
        <span>{title}</span>
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>{children}</div>
    </div>
  );
}

/** اولین FormSub نباید border-top داشته باشه */
export function FormSubFirst({ icon, title, children }: FormSubProps) {
  return (
    <div>
      <div style={{
        fontSize: 'var(--fs-xs)',
        fontWeight: 700,
        color: 'var(--muted)',
        paddingBottom: 6,
        letterSpacing: '.3px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}>
        {icon && <span>{icon}</span>}
        <span>{title}</span>
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>{children}</div>
    </div>
  );
}

interface FormTabsProps {
  tabs: { id: string; label: string; icon?: string }[];
  active: string;
  onChange: (id: string) => void;
}

export function FormTabs({ tabs, active, onChange }: FormTabsProps) {
  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 20,
      background: 'var(--card-solid, var(--card))',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding: 8,
      display: 'flex',
      gap: 8,
      marginBottom: 12,
      boxShadow: '0 1px 3px rgba(15,23,42,.08)',
    }}>
      {tabs.map(t => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            padding: '9px 12px',
            background: active === t.id ? 'var(--accent-soft)' : 'var(--btn-bg)',
            border: '1px solid ' + (active === t.id ? 'var(--accent-border)' : 'var(--border)'),
            borderRadius: 'var(--r-md)',
            fontFamily: 'inherit',
            fontSize: 'var(--fs-sm)',
            fontWeight: active === t.id ? 700 : 600,
            color: active === t.id ? 'var(--accent)' : 'var(--muted)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            minWidth: 0,
            transition: 'all var(--dur-fast)',
          }}
        >
          {t.icon && <span>{t.icon}</span>}
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Hook برای state گروه‌های باز/بسته */
export function useFormGroups(initial: Record<string, boolean>) {
  const [groups, setGroups] = useState<Record<string, boolean>>(initial);
  const toggle = (id: string) => setGroups(g => ({ ...g, [id]: !g[id] }));
  const openOnly = (id: string) => setGroups(g => ({ ...g, [id]: true }));
  const closeAll = () => setGroups({});
  const openAll = (ids: string[]) => setGroups(Object.fromEntries(ids.map(i => [i, true])));
  return { groups, toggle, openOnly, closeAll, openAll };
}
