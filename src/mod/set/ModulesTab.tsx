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

export default function ModulesTab() {
  const { modules, toggleModule } = useSet();
  const enabledCount = Object.values(modules).filter(v => v).length;
  const totalCount = Object.keys(MODULE_LABELS).length;

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
      <div style={{
        background: 'var(--info-soft)', border: '1px solid var(--info)',
        borderRadius: 'var(--r-md)', padding: '10px var(--sp-3)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--info)', fontWeight: 700 }}>
          ماژول‌های فعال
        </span>
        <span style={{ fontSize: 'var(--fs-md)', color: 'var(--info)', fontWeight: 700 }}>
          {toFa(enabledCount)} / {toFa(totalCount)}
        </span>
      </div>

      {groups.map(g => {
        const eic = g.ids.filter(id => modules[id] !== false).length;
        return (
          <div key={g.title} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)', overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px var(--sp-3)', background: 'var(--input-bg)',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span aria-hidden="true">{g.icon}</span>
                <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700 }}>{g.title}</span>
              </div>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 600 }}>
                {toFa(eic)}/{toFa(g.ids.length)}
              </span>
            </div>

            {g.ids.map((id, idx) => {
              const m = MODULE_LABELS[id];
              if (!m) return null;
              const isSet = id === 'set';
              const isOn = modules[id] !== false;
              return (
                <div key={id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px var(--sp-3)',
                  borderBottom: idx < g.ids.length - 1 ? '1px solid var(--border)' : 'none',
                  opacity: isOn ? 1 : 0.55, transition: 'opacity .2s',
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
                      fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{m.desc}</div>
                  </div>

                  <Toggle enabled={isOn} disabled={isSet} onToggle={() => !isSet && toggleModule(id)} />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
