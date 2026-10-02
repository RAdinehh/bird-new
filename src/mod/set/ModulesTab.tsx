import { useSet, MODULE_LABELS } from './store';
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
        width: 38, height: 22, borderRadius: 11,
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
        width: 16, height: 16, borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 2px rgba(0,0,0,.25)',
        transition: 'right .2s',
      }} />
    </button>
  );
}

// ترتیب همه ماژول‌ها
const ALL_IDS = [
  'brd', 'hal', 'ctc',
  'flk', 'inc', 'egg', 'dlg',
  'whs', 'fed',
  'tra',
  'rep', 'alt', 'arc',
  'cal', 'doc',
  'dsh', 'set',
];

export default function ModulesTab() {
  const { modules, toggleModule } = useSet();
  const enabledCount = Object.values(modules).filter(v => v).length;
  const totalCount = Object.keys(MODULE_LABELS).length;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--sp-2)',
      margin: '0 calc(-1 * var(--sp-2))',
    }}>
      {/* نوار شمارش */}
      <div style={{
        padding: '10px 14px',
        background: 'var(--accent-soft)',
        border: '1px solid var(--accent-border)',
        borderRadius: 'var(--r-md)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)', fontWeight: 700 }}>
          ماژول‌های فعال
        </span>
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {toFa(enabledCount)} از {toFa(totalCount)}
        </span>
      </div>

      {/* گرید ۲ ستونه */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 6,
      }}>
        {ALL_IDS.map(id => {
          const m = MODULE_LABELS[id];
          if (!m) return null;
          const isSet = id === 'set';
          const isOn = modules[id] !== false;
          return (
            <div
              key={id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 12px',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                opacity: isOn ? 1 : 0.55,
                transition: 'opacity .2s',
                minWidth: 0,
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }} aria-hidden="true">
                {m.icon}
              </span>
              <span style={{
                flex: 1,
                fontSize: 'var(--fs-base)',
                fontWeight: 600,
                color: 'var(--text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {m.name}
              </span>
              <Toggle
                enabled={isOn}
                disabled={isSet}
                onToggle={() => !isSet && toggleModule(id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
