import { useState } from 'react';
import { useSet, MODULE_LABELS } from './store';
import { Tag } from '../../shr/components/ui';
import { toFa } from '../../shr/utils/fa';

function Toggle({ enabled, disabled, onToggle }: { enabled: boolean; disabled?: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label={enabled ? 'خاموش' : 'روشن'}
      style={{
        width: 40, height: 24, borderRadius: 12,
        background: enabled ? 'var(--accent)' : 'var(--border)',
        border: 'none', padding: 0, position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        flexShrink: 0, opacity: disabled ? 0.5 : 1,
        transition: 'background .2s', fontFamily: 'inherit',
      }}
    >
      <span aria-hidden="true" style={{
        position: 'absolute', top: 3,
        right: enabled ? 19 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,.25)',
        transition: 'right .2s',
      }} />
    </button>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{
        transform: open ? 'rotate(180deg)' : 'rotate(0)',
        transition: 'transform 220ms cubic-bezier(.2,.9,.3,1)',
        flexShrink: 0,
      }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function ModulesTab() {
  const { modules, toggleModule } = useSet();
  const enabledCount = Object.values(modules).filter(v => v).length;
  const totalCount = Object.keys(MODULE_LABELS).length;

  // اولین گروه پیش‌فرض باز
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'پایه': true,
  });

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const groups = [
    { title: 'پایه', icon: '🏗', ids: ['brd', 'hal', 'ctc'] },
    { title: 'پرورش', icon: '🐔', ids: ['flk', 'inc', 'egg', 'dlg'] },
    { title: 'منابع', icon: '📦', ids: ['whs', 'fed'] },
    { title: 'کسب‌وکار', icon: '💰', ids: ['tra'] },
    { title: 'تحلیل', icon: '📊', ids: ['rep', 'alt', 'arc'] },
    { title: 'سیستم', icon: '⚙', ids: ['dsh', 'set'] },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-sm)' }}>
      {/* شمارش کل */}
      <div style={{
        background: 'var(--accent-soft)',
        border: '1px solid var(--accent-border)',
        borderRadius: 'var(--r-md)',
        padding: '10px var(--sp-3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)', fontWeight: 700 }}>
          ماژول‌های فعال
        </span>
        <span style={{ fontSize: 'var(--fs-md)', color: 'var(--accent)', fontWeight: 700 }}>
          {toFa(enabledCount)} / {toFa(totalCount)}
        </span>
      </div>

      {/* گروه‌های آکاردئونی */}
      {groups.map(g => {
        const eic = g.ids.filter(id => modules[id] !== false).length;
        const isOpen = !!openGroups[g.title];

        return (
          <div
            key={g.title}
            style={{
              background: 'var(--card)',
              border: '1px solid ' + (isOpen ? 'var(--accent-border)' : 'var(--border)'),
              borderRadius: 'var(--r-lg)',
              overflow: 'hidden',
              transition: 'border-color 150ms',
            }}
          >
            {/* Header (کلیک‌پذیر) */}
            <button
              type="button"
              onClick={() => toggleGroup(g.title)}
              aria-expanded={isOpen}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px var(--sp-3)',
                background: isOpen ? 'var(--accent-soft)' : 'var(--input-bg)',
                border: 'none',
                borderBottom: isOpen ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'right',
                gap: 8,
                transition: 'background 150ms',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }} aria-hidden="true">{g.icon}</span>
                <span style={{
                  fontSize: 'var(--fs-base)',
                  fontWeight: 700,
                  color: isOpen ? 'var(--accent)' : 'var(--text)',
                }}>{g.title}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{
                  fontSize: 'var(--fs-xs)',
                  color: isOpen ? 'var(--accent)' : 'var(--muted)',
                  fontWeight: 600,
                  padding: '2px 8px',
                  background: isOpen ? 'var(--card)' : 'var(--card)',
                  borderRadius: 10,
                }}>
                  {toFa(eic)}/{toFa(g.ids.length)}
                </span>
                <span style={{ color: isOpen ? 'var(--accent)' : 'var(--muted)' }}>
                  <Chevron open={isOpen} />
                </span>
              </div>
            </button>

            {/* محتوا (فقط وقتی بازه) */}
            <div style={{
              display: 'grid',
              gridTemplateRows: isOpen ? '1fr' : '0fr',
              transition: 'grid-template-rows 250ms cubic-bezier(.2,.9,.3,1)',
            }}>
              <div style={{ overflow: 'hidden', minHeight: 0 }}>
                {g.ids.map((id, idx) => {
                  const m = MODULE_LABELS[id];
                  if (!m) return null;
                  const isSet = id === 'set';
                  const isOn = modules[id] !== false;
                  return (
                    <div key={id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px var(--sp-3)',
                      borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                      opacity: isOn ? 1 : 0.55,
                      transition: 'opacity .2s',
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 'var(--r-sm)',
                        background: 'var(--input-bg)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 'var(--fs-md)', flexShrink: 0,
                      }} aria-hidden="true">{m.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700 }}>{m.name}</span>
                          {isSet && <Tag tone="gray">الزامی</Tag>}
                        </div>
                        <div style={{
                          fontSize: 'var(--fs-xs)',
                          color: 'var(--muted)',
                          marginTop: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>{m.desc}</div>
                      </div>
                      <Toggle enabled={isOn} disabled={isSet} onToggle={() => !isSet && toggleModule(id)} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
