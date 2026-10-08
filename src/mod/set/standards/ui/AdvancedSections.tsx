/**
 * AdvancedSections — دما/تغذیه/فضا/تجهیزات/تلفات/بستر
 */
import SettingsGroup from '../../SettingsGroup';
import { EnvEditor, FeedEditor, GrowthEditor, MortalityEditor, LitterEditor } from './editors';
import type { BirdStandard } from '../types';

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{label}</label>
    {children}
  </div>
);

const G2 = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>{children}</div>
);

interface Props {
  std: BirdStandard;
  def: BirdStandard;
  envChanged: boolean;
  feedChanged: boolean;
  mortChanged: boolean;
  updateBird: (patch: Partial<BirdStandard>) => void;
}

export default function AdvancedSections({ std, def, envChanged, feedChanged, mortChanged, updateBird }: Props) {
  return (
    <>
        <SettingsGroup
          icon="🌡"
          title="دما و رطوبت"
          subtitle={envChanged ? '🔸 تغییر یافته' : `${std.env.length} مرحله سنی`}
          exclusiveGroup="std-sections"
          persist={false}
          tone="danger"
        >
          <EnvEditor env={std.env} onChange={(env: any) => updateBird({ env })} />
        </SettingsGroup>

        {/* تغذیه و رشد */}
        <SettingsGroup
          icon="🌾"
          title="تغذیه و رشد"
          subtitle={feedChanged ? '🔸 تغییر یافته' : `${std.feed.length} مرحله دان · ${std.growth.weightByAge.length} نقطه رشد`}
          exclusiveGroup="std-sections"
          persist={false}
          tone="purple"
        >
          <FeedEditor feed={std.feed} onChange={(feed: any) => updateBird({ feed })} />
          <div style={{ height: 8 }} />
          <GrowthEditor
            growth={std.growth.weightByAge}
            onChange={(wba: any) => updateBird({ growth: { ...std.growth, weightByAge: wba } })}
          />
        </SettingsGroup>

        {/* فضای پرورش */}
        <SettingsGroup
          icon="📐"
          title="فضای پرورش"
          subtitle={`تراکم ${std.space.densityMax} پرنده/m²`}
          exclusiveGroup="std-sections"
          persist={false}
          tone="info"
        >
          <G2>
            <F label="تراکم (پرنده/m²)">
              <input
                type="text"
                inputMode="decimal"
                value={std.space.densityMax}
                onChange={e => {
                  const en = e.target.value.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٫،]/g, '.').replace(/[^\d.]/g, '');
                  const n = parseFloat(en);
                  if (!isNaN(n) && n >= 0) updateBird({ space: { ...std.space, densityMax: n } });
                }}
                style={{
                  width: '100%', height: 34, padding: '0 10px',
                  background: 'var(--input-bg)',
                  border: '1px solid ' + (std.space.densityMax !== def.space.densityMax ? 'var(--warn)' : 'var(--border)'),
                  borderRadius: 'var(--r-md)',
                  color: 'var(--text)', fontFamily: 'inherit',
                  fontSize: 'var(--fs-base)', fontWeight: 700,
                  textAlign: 'center', outline: 'none', boxSizing: 'border-box',
                  direction: 'rtl',
                }}
              />
            </F>
            <F label="فضای دانخوری (cm/پرنده)">
              <input
                type="text"
                inputMode="decimal"
                value={std.space.feederSpaceCm}
                onChange={e => {
                  const en = e.target.value.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٫،]/g, '.').replace(/[^\d.]/g, '');
                  const n = parseFloat(en);
                  if (!isNaN(n) && n >= 0) updateBird({ space: { ...std.space, feederSpaceCm: n } });
                }}
                style={{
                  width: '100%', height: 34, padding: '0 10px',
                  background: 'var(--input-bg)',
                  border: '1px solid ' + (std.space.feederSpaceCm !== def.space.feederSpaceCm ? 'var(--warn)' : 'var(--border)'),
                  borderRadius: 'var(--r-md)',
                  color: 'var(--text)', fontFamily: 'inherit',
                  fontSize: 'var(--fs-base)', fontWeight: 700,
                  textAlign: 'center', outline: 'none', boxSizing: 'border-box',
                  direction: 'rtl',
                }}
              />
            </F>
          </G2>
          <F label="فضای آبخوری (cm/پرنده)">
            <input
              type="text"
              inputMode="decimal"
              value={std.space.drinkerSpaceCm}
              onChange={e => {
                const en = e.target.value.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٫،]/g, '.').replace(/[^\d.]/g, '');
                const n = parseFloat(en);
                if (!isNaN(n) && n >= 0) updateBird({ space: { ...std.space, drinkerSpaceCm: n } });
              }}
              style={{
                width: '100%', height: 34, padding: '0 10px',
                background: 'var(--input-bg)',
                border: '1px solid ' + (std.space.drinkerSpaceCm !== def.space.drinkerSpaceCm ? 'var(--warn)' : 'var(--border)'),
                borderRadius: 'var(--r-md)',
                color: 'var(--text)', fontFamily: 'inherit',
                fontSize: 'var(--fs-base)', fontWeight: 700,
                textAlign: 'center', outline: 'none', boxSizing: 'border-box',
                direction: 'rtl',
              }}
            />
          </F>
        </SettingsGroup>

        {/* تجهیزات */}
        <SettingsGroup
          icon="⚙️"
          title="تجهیزات"
          subtitle={`${std.equipment.lampWattPerM2} W/m² · فن ${std.equipment.fanM3PerKg} m³/h/kg`}
          exclusiveGroup="std-sections"
          persist={false}
          tone="purple"
        >
          <div style={{
            padding: '8px 12px',
            background: 'var(--input-bg)',
            borderRadius: 'var(--r-md)',
            marginBottom: 8,
          }}>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>دانخوری</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 'var(--fs-sm)' }}>
              <div>بشقابی: <b>{std.equipment.feeder.panBirdsPerUnit ?? '—'} پرنده/عدد</b></div>
              <div>زنجیری: <b>{std.equipment.feeder.chainCmPerBird ?? '—'} cm/پرنده</b></div>
              <div>لوله‌ای: <b>{std.equipment.feeder.tubeCmPerBird ?? '—'} cm/پرنده</b></div>
              <div>دستی: <b>{std.equipment.feeder.manualCmPerBird ?? '—'} cm/پرنده</b></div>
            </div>
          </div>
          <div style={{
            padding: '8px 12px',
            background: 'var(--input-bg)',
            borderRadius: 'var(--r-md)',
            marginBottom: 8,
          }}>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>آبخوری</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 'var(--fs-sm)' }}>
              <div>نیپل: <b>{std.equipment.drinker.nippleBirdsPerUnit ?? '—'} پرنده/عدد</b></div>
              <div>کاپ: <b>{std.equipment.drinker.cupBirdsPerUnit ?? '—'} پرنده/عدد</b></div>
              <div>ناودانی: <b>{std.equipment.drinker.troughCmPerBird ?? '—'} cm/پرنده</b></div>
              <div>دستی: <b>{std.equipment.drinker.manualCmPerBird ?? '—'} cm/پرنده</b></div>
            </div>
          </div>
          <G2>
            <F label="روشنایی (W/m²)">
              <input
                type="text"
                inputMode="decimal"
                value={std.equipment.lampWattPerM2}
                onChange={e => {
                  const en = e.target.value.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٫،]/g, '.').replace(/[^\d.]/g, '');
                  const n = parseFloat(en);
                  if (!isNaN(n) && n >= 0) updateBird({ equipment: { ...std.equipment, lampWattPerM2: n } });
                }}
                style={{
                  width: '100%', height: 34, padding: '0 10px',
                  background: 'var(--input-bg)',
                  border: '1px solid ' + (std.equipment.lampWattPerM2 !== def.equipment.lampWattPerM2 ? 'var(--warn)' : 'var(--border)'),
                  borderRadius: 'var(--r-md)',
                  color: 'var(--text)', fontFamily: 'inherit',
                  fontSize: 'var(--fs-base)', fontWeight: 700,
                  textAlign: 'center', outline: 'none', boxSizing: 'border-box',
                  direction: 'rtl',
                }}
              />
            </F>
            <F label="فن (m³/h/kg)">
              <input
                type="text"
                inputMode="decimal"
                value={std.equipment.fanM3PerKg}
                onChange={e => {
                  const en = e.target.value.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٫،]/g, '.').replace(/[^\d.]/g, '');
                  const n = parseFloat(en);
                  if (!isNaN(n) && n >= 0) updateBird({ equipment: { ...std.equipment, fanM3PerKg: n } });
                }}
                style={{
                  width: '100%', height: 34, padding: '0 10px',
                  background: 'var(--input-bg)',
                  border: '1px solid ' + (std.equipment.fanM3PerKg !== def.equipment.fanM3PerKg ? 'var(--warn)' : 'var(--border)'),
                  borderRadius: 'var(--r-md)',
                  color: 'var(--text)', fontFamily: 'inherit',
                  fontSize: 'var(--fs-base)', fontWeight: 700,
                  textAlign: 'center', outline: 'none', boxSizing: 'border-box',
                  direction: 'rtl',
                }}
              />
            </F>
          </G2>
        </SettingsGroup>

        {/* تلفات */}
        <SettingsGroup
          icon="💀"
          title="تلفات مجاز"
          subtitle={mortChanged ? '🔸 تغییر یافته' : `${std.mortality.length} مرحله · کل ${std.mortalityTotalPct}٪`}
          exclusiveGroup="std-sections"
          persist={false}
          tone="danger"
        >
          <MortalityEditor
            mortality={std.mortality}
            onChange={(mortality: any) => updateBird({ mortality })}
          />
          <F label="تلفات کل چرخه (٪)">
            <input
              type="text"
              inputMode="decimal"
              value={std.mortalityTotalPct}
              onChange={e => {
                const en = e.target.value.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٫،]/g, '.').replace(/[^\d.]/g, '');
                const n = parseFloat(en);
                if (!isNaN(n) && n >= 0) updateBird({ mortalityTotalPct: n });
              }}
              style={{
                width: '100%', height: 34, padding: '0 10px',
                background: 'var(--input-bg)',
                border: '1px solid ' + (std.mortalityTotalPct !== def.mortalityTotalPct ? 'var(--warn)' : 'var(--border)'),
                borderRadius: 'var(--r-md)',
                color: 'var(--text)', fontFamily: 'inherit',
                fontSize: 'var(--fs-base)', fontWeight: 700,
                textAlign: 'center', outline: 'none', boxSizing: 'border-box',
                direction: 'rtl',
              }}
            />
          </F>
        </SettingsGroup>
        {/* بستر */}
        {std.litter ? (
          <SettingsGroup
            icon="🛏"
            title="بستر"
            subtitle={`${std.litter.recommended.length} ماده · ${std.litter.kgPerM2} kg/m²`}
            exclusiveGroup="std-sections"
            persist={false}
            tone="accent"
          >
            <LitterEditor
              litter={std.litter}
              onChange={(litter: any) => updateBird({ litter })}
            />
          </SettingsGroup>
        ) : null}
      </>
    );
  }
