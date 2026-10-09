/**
 * HealthSection.tsx — گروه ۵: سلامت
 *
 * شامل: تلفات + اهداف + نقاط کلیدی
 */
import SettingsGroup from '../../../SettingsGroup';
import { MortalityEditor, TargetsEditor, MilestonesEditor } from '../editors';
import type { SectionProps } from './types';
import { isChanged } from './types';
import OverridableField from './OverridableField';

export default function HealthSection({ std, def, updateBird, overrides, setOverride, clearOverride }: SectionProps) {
  const mortChanged = isChanged(std.mortality, def.mortality) || std.mortalityTotalPct !== def.mortalityTotalPct;
  const targetsChanged = isChanged(std.targets, def.targets);
  const milestonesChanged = isChanged(std.keyMilestones, def.keyMilestones);
  const changed = mortChanged || targetsChanged || milestonesChanged;

  const subtitle = changed
    ? '🔸 تغییر یافته'
    : `${std.mortality.length} مرحله · کل ${std.mortalityTotalPct}٪`;

  const onOver = (path: string) => (v: any) => setOverride?.(path, v);
  const onReset = (path: string) => () => clearOverride?.(path);

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
          💀 تلفات مجاز
        </div>
        <MortalityEditor
          mortality={std.mortality}
          onChange={(mortality: any) => updateBird({ mortality })}
        />
        <div style={{ marginTop: 10 }}>
          <OverridableField
            label="تلفات کل چرخه"
            value={std.mortalityTotalPct}
            defaultValue={def.mortalityTotalPct}
            unit="٪"
            type="number"
            min={0} max={100}
            onOverride={onOver('mortalityTotalPct')}
            onClear={onReset('mortalityTotalPct')}
          />
        </div>
      </div>

      {/* اهداف عملکردی */}
      <div style={{ marginBottom: 12, paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>
          🎯 اهداف عملکردی
        </div>
        <TargetsEditor std={std} def={def} updateBird={updateBird} />
      </div>

      {/* نقاط کلیدی */}
      <div style={{ paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>
          🏁 نقاط کلیدی
        </div>
        <MilestonesEditor std={std} def={def} updateBird={updateBird} />
      </div>
    </SettingsGroup>
  );
}
