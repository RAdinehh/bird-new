/**
 * ProductionSection.tsx — گروه ۶: تولید
 *
 * شامل: بیولوژی + تولید تخم + انکوباسیون + جوجه‌کشی
 * همه فیلدها با OverridableField
 */
import SettingsGroup from '../../../SettingsGroup';
import { HatchingEditor, IncubationProfileEditor } from '../editors';
import type { SectionProps } from './types';
import { isChanged } from './types';
import OverridableField from './OverridableField';

export default function ProductionSection({ std, def, updateBird, overrides, setOverride, clearOverride }: SectionProps) {
  const bioChanged = isChanged(std.biology, def.biology);
  const prodChanged = isChanged(std.production, def.production);
  const hatchChanged = isChanged(std.hatchingParams, def.hatchingParams);
  const incChanged = isChanged(std.incubation, def.incubation);
  const changed = bioChanged || prodChanged || hatchChanged || incChanged;

  const subtitle = changed
    ? '🔸 تغییر یافته'
    : std.production
      ? `${std.production.eggsPerYear} تخم/سال`
      : `${std.incubation.totalDays} روز انکوباسیون`;

  // helper: تبدیل مسیر به onOverride
  const onOver = (path: string) => (v: any) => setOverride?.(path, v);
  const onReset = (path: string) => () => clearOverride?.(path);

  return (
    <SettingsGroup
      icon="🥚"
      title="تولید"
      subtitle={subtitle}
      exclusiveGroup="std-sections"
      persist={false}
      tone="accent"
    >
      {/* بیولوژی */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>
          🧬 بیولوژی
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <OverridableField
            label="سن بلوغ جنسی"
            value={std.biology.sexualMaturityDay}
            defaultValue={def.biology.sexualMaturityDay}
            unit="روز"
            type="number"
            min={1} max={2000}
            onOverride={onOver('biology.sexualMaturityDay')}
            onClear={onReset('biology.sexualMaturityDay')}
          />
          <OverridableField
            label="سن تخم‌گذاری"
            value={std.biology.layingStartDay}
            defaultValue={def.biology.layingStartDay}
            unit="روز"
            type="number"
            min={1} max={2000}
            onOverride={onOver('biology.layingStartDay')}
            onClear={onReset('biology.layingStartDay')}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <OverridableField
            label="سن کشتار"
            value={std.biology.cullDay}
            defaultValue={def.biology.cullDay}
            unit="روز"
            type="number"
            min={1} max={2000}
            onOverride={onOver('biology.cullDay')}
            onClear={onReset('biology.cullDay')}
          />
          <OverridableField
            label="نسبت نر:ماده"
            value={std.biology.maleFemaleRatio}
            defaultValue={def.biology.maleFemaleRatio}
            type="number"
            min={0} max={100}
            decimals={2}
            onOverride={onOver('biology.maleFemaleRatio')}
            onClear={onReset('biology.maleFemaleRatio')}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <OverridableField
            label="سن پیک تولید"
            value={std.biology.peakLayingDay}
            defaultValue={def.biology.peakLayingDay}
            unit="روز"
            type="number"
            min={1} max={2000}
            onOverride={onOver('biology.peakLayingDay')}
            onClear={onReset('biology.peakLayingDay')}
          />
          <OverridableField
            label="پایان چرخه"
            value={std.biology.endOfCycleDay}
            defaultValue={def.biology.endOfCycleDay}
            unit="روز"
            type="number"
            min={1} max={2000}
            onOverride={onOver('biology.endOfCycleDay')}
            onClear={onReset('biology.endOfCycleDay')}
          />
        </div>
      </div>

      {/* تولید تخم */}
      {std.production && (
        <div style={{ marginBottom: 12, paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>
            🥚 تولید تخم
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <OverridableField
              label="تخم در سال"
              value={std.production.eggsPerYear}
              defaultValue={def.production?.eggsPerYear ?? null}
              unit="عدد"
              type="number"
              min={0} max={1000}
              onOverride={onOver('production.eggsPerYear')}
              onClear={onReset('production.eggsPerYear')}
            />
            <OverridableField
              label="وزن تخم"
              value={std.production.eggWeightG}
              defaultValue={def.production?.eggWeightG ?? null}
              unit="گرم"
              type="number"
              min={10} max={200}
            decimals={1}
              onOverride={onOver('production.eggWeightG')}
              onClear={onReset('production.eggWeightG')}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            <OverridableField
              label="پیک تولید"
              value={std.production.peakLayingPct}
              defaultValue={def.production?.peakLayingPct ?? null}
              unit="٪"
              type="number"
              min={0} max={100}
            decimals={1}
              onOverride={onOver('production.peakLayingPct')}
              onClear={onReset('production.peakLayingPct')}
            />
            <OverridableField
              label="طول چرخه"
              value={std.production.cycleDays}
              defaultValue={def.production?.cycleDays ?? null}
              unit="روز"
              type="number"
              min={1} max={2000}
              onOverride={onOver('production.cycleDays')}
              onClear={onReset('production.cycleDays')}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            <OverridableField
              label="نطفه‌داری"
              value={std.production.fertilityPct ?? null}
              defaultValue={def.production?.fertilityPct ?? null}
              unit="٪"
              type="number"
              min={0} max={100}
            decimals={1}
              onOverride={onOver('production.fertilityPct')}
              onClear={onReset('production.fertilityPct')}
            />
            <OverridableField
              label="درصد هچ"
              value={std.production.hatchabilityPct ?? null}
              defaultValue={def.production?.hatchabilityPct ?? null}
              unit="٪"
              type="number"
              min={0} max={100}
            decimals={1}
              onOverride={onOver('production.hatchabilityPct')}
              onClear={onReset('production.hatchabilityPct')}
            />
          </div>
        </div>
      )}

      {/* انکوباسیون */}
      <div style={{ marginBottom: 12, paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>
          🐣 انکوباسیون
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <OverridableField
            label="کل دوره"
            value={std.incubation.totalDays}
            defaultValue={def.incubation.totalDays}
            unit="روز"
            type="number"
            min={1} max={60}
            onOverride={onOver('incubation.totalDays')}
            onClear={onReset('incubation.totalDays')}
          />
          <OverridableField
            label="روز Lockdown"
            value={std.incubation.lockdownDay}
            defaultValue={def.incubation.lockdownDay}
            unit="روز"
            type="number"
            min={1} max={60}
            onOverride={onOver('incubation.lockdownDay')}
            onClear={onReset('incubation.lockdownDay')}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <OverridableField
            label="دمای ستر"
            value={std.incubation.setterTemp}
            defaultValue={def.incubation.setterTemp}
            unit="°C"
            type="number"
            min={30} max={45}
            decimals={1}
            onOverride={onOver('incubation.setterTemp')}
            onClear={onReset('incubation.setterTemp')}
          />
          <OverridableField
            label="رطوبت ستر"
            value={std.incubation.setterHumidity}
            defaultValue={def.incubation.setterHumidity}
            unit="٪"
            type="number"
            min={0} max={100}
            onOverride={onOver('incubation.setterHumidity')}
            onClear={onReset('incubation.setterHumidity')}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <OverridableField
            label="دمای هچر"
            value={std.incubation.hatcherTemp}
            defaultValue={def.incubation.hatcherTemp}
            unit="°C"
            type="number"
            min={30} max={45}
            decimals={1}
            onOverride={onOver('incubation.hatcherTemp')}
            onClear={onReset('incubation.hatcherTemp')}
          />
          <OverridableField
            label="رطوبت هچر"
            value={std.incubation.hatcherHumidity}
            defaultValue={def.incubation.hatcherHumidity}
            unit="٪"
            type="number"
            min={0} max={100}
            onOverride={onOver('incubation.hatcherHumidity')}
            onClear={onReset('incubation.hatcherHumidity')}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <OverridableField
            label="چرخش در روز"
            value={std.incubation.turningPerDay ?? null}
            defaultValue={def.incubation.turningPerDay ?? null}
            type="number"
            min={0} max={48}
            onOverride={onOver('incubation.turningPerDay')}
            onClear={onReset('incubation.turningPerDay')}
          />
          <OverridableField
            label="وزن جوجه"
            value={std.incubation.chickYieldPct ?? null}
            defaultValue={def.incubation.chickYieldPct ?? null}
            unit="٪"
            type="number"
            min={0} max={100}
            decimals={1}
            onOverride={onOver('incubation.chickYieldPct')}
            onClear={onReset('incubation.chickYieldPct')}
          />
        </div>

        {/* روزهای تخم‌نما (فقط نمایش) */}
        {std.incubation.candlingDays && std.incubation.candlingDays.length > 0 && (
          <div style={{
            marginTop: 10, padding: '6px 10px',
            background: 'var(--input-bg)', borderRadius: 'var(--r-sm)',
            fontSize: 11, color: 'var(--muted)', lineHeight: 1.8,
          }}>
            🔍 <b style={{ color: 'var(--text)' }}>روزهای تخم‌نما:</b>{' '}
            {std.incubation.candlingDays.join(' · ')}
          </div>
        )}
      </div>

      {/* پروفایل دما/رطوبت روز‌به‌روز */}
      <div style={{ paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>
          🌡 پروفایل دما/رطوبت روز‌به‌روز
        </div>
        <IncubationProfileEditor
          profile={std.incubation.tempProfile || []}
          onChange={(tempProfile) => updateBird({ incubation: { ...std.incubation, tempProfile } })}
          setterTemp={std.incubation.setterTemp}
          setterHumidity={std.incubation.setterHumidity}
          hatcherTemp={std.incubation.hatcherTemp}
          hatcherHumidity={std.incubation.hatcherHumidity}
        />
      </div>

      {/* پارامترهای جوجه‌کشی (اختیاری) */}
      <div style={{ paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>
          📦 پارامترهای جوجه‌کشی
        </div>
        <HatchingEditor std={std} def={def} updateBird={updateBird} />
      </div>
    </SettingsGroup>
  );
}
