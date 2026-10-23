/**
 * HousingSection.tsx — گروه ۴: تأسیسات
 *
 * شامل: فضا + تجهیزات + بستر
 * همه با OverridableField
 */
import SettingsGroup from '../../../SettingsGroup';
import { LitterEditor } from '../editors';
import type { SectionProps } from './types';
import { isChanged } from './types';
import OverridableField from './OverridableField';
import { HELP } from '../../../../../shr/help/helpTexts';

export default function HousingSection({ std, def, updateBird, overrides, setOverride, clearOverride }: SectionProps) {
  const spaceChanged = isChanged(std.space, def.space);
  const equipChanged = isChanged(std.equipment, def.equipment);
  const litterChanged = isChanged(std.litter, def.litter);
  const changed = spaceChanged || equipChanged || litterChanged;

  const subtitle = changed
    ? '🔸 تغییر یافته'
    : `تراکم ${std.space.densityMax} پرنده/m²`;

  const onOver = (path: string) => (v: any) => setOverride?.(path, v);
  const onReset = (path: string) => () => clearOverride?.(path);

  return (
    <SettingsGroup
      icon="🏠"
      title="تأسیسات"
      help={HELP.set.standards.housing}
      subtitle={subtitle}
      exclusiveGroup="std-sections"
      persist={false}
      tone="info"
    >
      {/* فضا */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>
          📐 فضای پرورش
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <OverridableField
            label="تراکم"
            value={std.space.densityMax}
            defaultValue={def.space.densityMax}
            unit="پرنده/m²"
            type="number"
            min={1} max={100}
            onOverride={onOver('space.densityMax')}
            onClear={onReset('space.densityMax')}
          />
          <OverridableField
            label="فضای دانخوری"
            value={std.space.feederSpaceCm}
            defaultValue={def.space.feederSpaceCm}
            unit="cm"
            type="number"
            min={0} max={50}
            onOverride={onOver('space.feederSpaceCm')}
            onClear={onReset('space.feederSpaceCm')}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <OverridableField
            label="فضای آبخوری"
            value={std.space.drinkerSpaceCm}
            defaultValue={def.space.drinkerSpaceCm}
            unit="cm"
            type="number"
            min={0} max={50}
            onOverride={onOver('space.drinkerSpaceCm')}
            onClear={onReset('space.drinkerSpaceCm')}
          />
          <div />
        </div>
      </div>

      {/* تجهیزات — نسبتها */}
      <div style={{ marginBottom: 12, paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>
          ⚙️ تجهیزات
        </div>

        {/* دانخوری — نمایش فقط (پیچیده‌تر از فیلد تکی) */}
        <div style={{
          padding: '8px 12px', background: 'var(--input-bg)',
          borderRadius: 'var(--r-md)', marginBottom: 8,
        }}>
          <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 700, marginBottom: 4 }}>دانخوری</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11.5 }}>
            <div>بشقابی: <b>{std.equipment.feeder.panBirdsPerUnit ?? '—'}</b></div>
            <div>زنجیری: <b>{std.equipment.feeder.chainCmPerBird ?? '—'}</b></div>
            <div>لوله‌ای: <b>{std.equipment.feeder.tubeCmPerBird ?? '—'}</b></div>
            <div>دستی: <b>{std.equipment.feeder.manualCmPerBird ?? '—'}</b></div>
          </div>
        </div>

        {/* آبخوری — نمایش فقط */}
        <div style={{
          padding: '8px 12px', background: 'var(--input-bg)',
          borderRadius: 'var(--r-md)', marginBottom: 8,
        }}>
          <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 700, marginBottom: 4 }}>آبخوری</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11.5 }}>
            <div>نیپل: <b>{std.equipment.drinker.nippleBirdsPerUnit ?? '—'}</b></div>
            <div>کاپ: <b>{std.equipment.drinker.cupBirdsPerUnit ?? '—'}</b></div>
            <div>ناودانی: <b>{std.equipment.drinker.troughCmPerBird ?? '—'}</b></div>
            <div>دستی: <b>{std.equipment.drinker.manualCmPerBird ?? '—'}</b></div>
          </div>
        </div>

        {/* روشنایی و فن — قابل ویرایش */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <OverridableField
            label="روشنایی"
            value={std.equipment.lampWattPerM2}
            defaultValue={def.equipment.lampWattPerM2}
            unit="W/m²"
            type="number"
            min={0} max={30}
            onOverride={onOver('equipment.lampWattPerM2')}
            onClear={onReset('equipment.lampWattPerM2')}
          />
          <OverridableField
            label="فن"
            value={std.equipment.fanM3PerKg}
            defaultValue={def.equipment.fanM3PerKg}
            unit="m³/h/kg"
            type="number"
            min={0} max={20}
            onOverride={onOver('equipment.fanM3PerKg')}
            onClear={onReset('equipment.fanM3PerKg')}
          />
        </div>
      </div>

      {/* بستر */}
      {std.litter && (
        <div style={{ paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>
            🛏 بستر
          </div>
          <LitterEditor
            litter={std.litter}
            onChange={(litter: any) => updateBird({ litter })}
          />
        </div>
      )}
    </SettingsGroup>
  );
}
