/**
 * HousingSection.tsx — گروه ۴: تأسیسات
 *
 * شامل: فضا (space) + تجهیزات (equipment) + بستر (litter)
 */
import SettingsGroup from '../../../SettingsGroup';
import { LitterEditor } from '../editors';
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

const G2 = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>{children}</div>
);

export default function HousingSection({ std, def, updateBird }: SectionProps) {
  const spaceChanged = isChanged(std.space, def.space);
  const equipChanged = isChanged(std.equipment, def.equipment);
  const litterChanged = isChanged(std.litter, def.litter);
  const changed = spaceChanged || equipChanged || litterChanged;

  const subtitle = changed
    ? '🔸 تغییر یافته'
    : `تراکم ${std.space.densityMax} پرنده/m²`;

  return (
    <SettingsGroup
      icon="🏠"
      title="تأسیسات"
      subtitle={subtitle}
      exclusiveGroup="std-sections"
      persist={false}
      tone="info"
    >
      {/* فضا */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>
          📐 فضای پرورش {spaceChanged && <span style={{ color: 'var(--warn)' }}>🔸</span>}
        </div>
        <G2>
          <F label="تراکم (پرنده/m²)">
            <input
              type="text" inputMode="decimal"
              value={std.space.densityMax}
              onChange={e => {
                const n = parseNum(e.target.value);
                if (n !== null && n >= 0) updateBird({ space: { ...std.space, densityMax: n } });
              }}
              style={inputStyle(std.space.densityMax !== def.space.densityMax)}
            />
          </F>
          <F label="فضای دانخوری (cm/پرنده)">
            <input
              type="text" inputMode="decimal"
              value={std.space.feederSpaceCm}
              onChange={e => {
                const n = parseNum(e.target.value);
                if (n !== null && n >= 0) updateBird({ space: { ...std.space, feederSpaceCm: n } });
              }}
              style={inputStyle(std.space.feederSpaceCm !== def.space.feederSpaceCm)}
            />
          </F>
        </G2>
        <F label="فضای آبخوری (cm/پرنده)">
          <input
            type="text" inputMode="decimal"
            value={std.space.drinkerSpaceCm}
            onChange={e => {
              const n = parseNum(e.target.value);
              if (n !== null && n >= 0) updateBird({ space: { ...std.space, drinkerSpaceCm: n } });
            }}
            style={inputStyle(std.space.drinkerSpaceCm !== def.space.drinkerSpaceCm)}
          />
        </F>
      </div>

      {/* تجهیزات */}
      <div style={{ marginBottom: 12, paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>
          ⚙️ تجهیزات {equipChanged && <span style={{ color: 'var(--warn)' }}>🔸</span>}
        </div>

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

        <G2>
          <F label="روشنایی (W/m²)">
            <input
              type="text" inputMode="decimal"
              value={std.equipment.lampWattPerM2}
              onChange={e => {
                const n = parseNum(e.target.value);
                if (n !== null && n >= 0) updateBird({ equipment: { ...std.equipment, lampWattPerM2: n } });
              }}
              style={inputStyle(std.equipment.lampWattPerM2 !== def.equipment.lampWattPerM2)}
            />
          </F>
          <F label="فن (m³/h/kg)">
            <input
              type="text" inputMode="decimal"
              value={std.equipment.fanM3PerKg}
              onChange={e => {
                const n = parseNum(e.target.value);
                if (n !== null && n >= 0) updateBird({ equipment: { ...std.equipment, fanM3PerKg: n } });
              }}
              style={inputStyle(std.equipment.fanM3PerKg !== def.equipment.fanM3PerKg)}
            />
          </F>
        </G2>
      </div>

      {/* بستر */}
      {std.litter && (
        <div style={{ paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>
            🛏 بستر {litterChanged && <span style={{ color: 'var(--warn)' }}>🔸</span>}
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
