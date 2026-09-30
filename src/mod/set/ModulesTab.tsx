import { useSet, MODULE_LABELS } from './store';
import { Tag } from '../../shr/components/ui';
import { toFa } from '../../shr/utils/fa';

export default function ModulesTab() {
  const { modules, toggleModule } = useSet();

  const enabledCount = Object.values(modules).filter(v => v).length;
  const totalCount = Object.keys(MODULE_LABELS).length;

  // گروه‌بندی ماژول‌ها
  const groups = [
    { title: 'پایه', icon: '🏗', ids: ['brd', 'hal', 'ctc'] },
    { title: 'پرورش', icon: '🐔', ids: ['flk', 'inc', 'egg', 'dlg'] },
    { title: 'منابع', icon: '📦', ids: ['whs', 'fed'] },
    { title: 'کسب‌وکار', icon: '💰', ids: ['tra'] },
    { title: 'تحلیل', icon: '📊', ids: ['rep', 'alt', 'arc'] },
    { title: 'سیستم', icon: '⚙', ids: ['dsh', 'set'] }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>

      <div style={{
        background: 'var(--info-soft)',
        border: '1px solid var(--info)',
        borderRadius: 'var(--r-md)',
        padding: 'var(--pad-comfy)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--info)', fontWeight: 700 }}>
          ماژول‌های فعال
        </div>
        <div style={{ fontSize: 'var(--fs-lg)', color: 'var(--info)', fontWeight: 700 }}>
          {toFa(enabledCount)} / {toFa(totalCount)}
        </div>
      </div>

      {groups.map(g => (
        <div key={g.title}>
          <div style={{
            fontSize: 'var(--fs-xs)',
            fontWeight: 700,
            color: 'var(--muted)',
            padding: '4px 4px 8px',
            letterSpacing: '.5px',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span style={{ fontSize: 'var(--fs-base)' }}>{g.icon}</span>
            <span>{g.title}</span>
          </div>

          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            overflow: 'hidden'
          }}>
            {g.ids.map((id, idx) => {
              const m = MODULE_LABELS[id];
              if (!m) return null;
              const isSet = id === 'set';
              const isEnabled = modules[id] !== false;

              return (
                <div key={id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: 'var(--pad-comfy)',
                  borderBottom: idx < g.ids.length - 1 ? '1px solid var(--border)' : 'none',
                  opacity: isEnabled ? 1 : 0.5
                }}>
                  <div style={{
                    width: 36, height: 36,
                    borderRadius: 'var(--r-md)',
                    background: 'var(--input-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 'var(--fs-md)', flexShrink: 0
                  }}>{m.icon}</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700 }}>{m.name}</div>
                      {isSet ? <Tag tone="gray">الزامی</Tag> : null}
                    </div>
                    <div style={{
                      fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>{m.desc}</div>
                  </div>

                  <button
                    type="button"
                    disabled={isSet}
                    onClick={() => !isSet && toggleModule(id)}
                    style={{
                      width: 44, height: 24, borderRadius: 12,
                      background: isEnabled ? 'var(--accent)' : 'var(--dim)',
                      position: 'relative', border: 'none',
                      cursor: isSet ? 'not-allowed' : 'pointer',
                      padding: 0, flexShrink: 0,
                      opacity: isSet ? 0.5 : 1
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 2, right: isEnabled ? 22 : 2,
                      width: 20, height: 20, borderRadius: '50%',
                      background: '#fff', transition: 'right .2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,.2)'
                    }} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
