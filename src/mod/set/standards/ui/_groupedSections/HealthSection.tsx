/**
 * HealthSection.tsx — گروه ۵: سلامت
 *
 * شامل: تلفات (mortality) + اهداف عملکردی (targets) + نقاط کلیدی (milestones)
 */
import SettingsGroup from '../../../SettingsGroup';
import { MortalityEditor, TargetsEditor, MilestonesEditor } from '../editors';
import type { SectionProps } from './types';
import { isChanged, parseNum } from './types';

const inputStyle = (changed: boolean) => ({
  width: '100%', height: 34, padding: '0 10px',
  background: 'var(--input-bg)',
  border: '1px solid ' + (changed ? 'var(--warn)' : 'var(--border)'),
  borderRadius: 'var(--r-md)',
  color: 'var(--text)', fontFamily: 'inherit',
  fontSize: 'var(--fs-base)', fontWeight: 700,
  textAlign: 'center' as const, outline: 'none', boxSizing: 'border-box' as const,
  direction: 'rtl' as const,
});

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
    <label style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600 }}>{label}</label>
    {children}
  </div>
);

export default function HealthSection({ std, def, updateBird }: SectionProps) {
  const mortChanged = isChanged(std.mortality, def.mortality) || std.mortalityTotalPct !== def.mortalityTotalPct;
  const targetsChanged = isChanged(std.targets, def.targets);
  const milestonesChanged = isChanged(std.keyMilestones, def.keyMilestones);
  const changed = mortChanged || targetsChanged || milestonesChanged;

  const subtitle = changed
    ? '🔸 تغییر یافته'
    : `${std.mortality.length} مرحله · کل ${std.mortalityTotalPct}٪`;

  return (
    <SettingsGroup
      icon="💀"
      title="سلامت"
      subtitle={subtitle}
      exclusiveGroup="std-sections"
      persist={false}
      tone="danger"
    >
      {/* تلفات */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>
          💀 تلفات مجاز {mortChanged && <span style={{ color: 'var(--warn)' }}>🔸</span>}
        </div>
        <MortalityEditor
          mortality={std.mortality}
          onChange={(mortality: any) => updateBird({ mortality })}
        />
        <div style={{ marginTop: 8 }}>
          <F label="تلفات کل چرخه (٪)">
            <input
              type="text" inputMode="decimal"
              value={std.mortalityTotalPct}
              onChange={e => {
                const n = parseNum(e.target.value);
                if (n !== null && n >= 0) updateBird({ mortalityTotalPct: n });
              }}
              style={inputStyle(std.mortalityTotalPct !== def.mortalityTotalPct)}
            />
          </F>
        </div>
      </div>

      {/* اهداف عملکردی */}
      <div style={{ marginBottom: 12, paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>
          🎯 اهداف عملکردی {targetsChanged && <span style={{ color: 'var(--warn)' }}>🔸</span>}
        </div>
        <TargetsEditor std={std} def={def} updateBird={updateBird} />
      </div>

      {/* نقاط کلیدی */}
      <div style={{ paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>
          🏁 نقاط کلیدی {milestonesChanged && <span style={{ color: 'var(--warn)' }}>🔸</span>}
        </div>
        <MilestonesEditor std={std} def={def} updateBird={updateBird} />
      </div>
    </SettingsGroup>
  );
}
