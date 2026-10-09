/**
 * ProductionSection.tsx — گروه ۶: تولید
 *
 * شامل: بیولوژی (biology) + تولید تخم (production) + جوجه‌کشی (hatchingParams)
 */
import SettingsGroup from '../../../SettingsGroup';
import { HatchingEditor } from '../editors';
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

export default function ProductionSection({ std, def, updateBird }: SectionProps) {
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
          🧬 بیولوژی {bioChanged && <span style={{ color: 'var(--warn)' }}>🔸</span>}
        </div>
        <G2>
          <F label="سن بلوغ جنسی (روز)">
            <input
              type="text" inputMode="decimal"
              value={std.biology.sexualMaturityDay ?? ''}
              onChange={e => updateBird({ biology: { ...std.biology, sexualMaturityDay: parseNum(e.target.value) } })}
              style={inputStyle(std.biology.sexualMaturityDay !== def.biology.sexualMaturityDay)}
            />
          </F>
          <F label="سن تخم‌گذاری (روز)">
            <input
              type="text" inputMode="decimal"
              value={std.biology.layingStartDay ?? ''}
              onChange={e => updateBird({ biology: { ...std.biology, layingStartDay: parseNum(e.target.value) } })}
              style={inputStyle(std.biology.layingStartDay !== def.biology.layingStartDay)}
            />
          </F>
        </G2>
        <G2>
          <F label="سن کشتار (روز)">
            <input
              type="text" inputMode="decimal"
              value={std.biology.cullDay ?? ''}
              onChange={e => updateBird({ biology: { ...std.biology, cullDay: parseNum(e.target.value) } })}
              style={inputStyle(std.biology.cullDay !== def.biology.cullDay)}
            />
          </F>
          <F label="نسبت نر:ماده">
            <input
              type="text" inputMode="decimal"
              value={std.biology.maleFemaleRatio ?? ''}
              onChange={e => updateBird({ biology: { ...std.biology, maleFemaleRatio: parseNum(e.target.value) } })}
              style={inputStyle(std.biology.maleFemaleRatio !== def.biology.maleFemaleRatio)}
            />
          </F>
        </G2>
      </div>

      {/* تولید تخم */}
      {std.production && (
        <div style={{ marginBottom: 12, paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>
            🥚 تولید تخم {prodChanged && <span style={{ color: 'var(--warn)' }}>🔸</span>}
          </div>
          <div style={{
            padding: '8px 12px', background: 'var(--input-bg)',
            borderRadius: 'var(--r-md)', display: 'grid',
            gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, lineHeight: 1.7,
          }}>
            <div>تخم/سال: <b>{std.production.eggsPerYear}</b></div>
            <div>پیک: <b>{std.production.peakLayingPct}٪</b></div>
            <div>وزن تخم: <b>{std.production.eggWeightG}g</b></div>
            <div>چرخه: <b>{std.production.cycleDays} روز</b></div>
            {std.production.fertilityPct != null && (
              <div>نطفه‌داری: <b>{std.production.fertilityPct}٪</b></div>
            )}
            {std.production.hatchabilityPct != null && (
              <div>هچ: <b>{std.production.hatchabilityPct}٪</b></div>
            )}
          </div>
        </div>
      )}

      {/* انکوباسیون */}
      <div style={{ marginBottom: 12, paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>
          🐣 انکوباسیون {incChanged && <span style={{ color: 'var(--warn)' }}>🔸</span>}
        </div>
        <G2>
          <F label="کل دوره (روز)">
            <input
              type="text" inputMode="decimal"
              value={std.incubation.totalDays}
              onChange={e => {
                const n = parseNum(e.target.value);
                if (n !== null && n > 0) updateBird({ incubation: { ...std.incubation, totalDays: n } });
              }}
              style={inputStyle(std.incubation.totalDays !== def.incubation.totalDays)}
            />
          </F>
          <F label="روز Lockdown">
            <input
              type="text" inputMode="decimal"
              value={std.incubation.lockdownDay}
              onChange={e => {
                const n = parseNum(e.target.value);
                if (n !== null && n > 0) updateBird({ incubation: { ...std.incubation, lockdownDay: n } });
              }}
              style={inputStyle(std.incubation.lockdownDay !== def.incubation.lockdownDay)}
            />
          </F>
        </G2>
        <div style={{
          padding: '8px 12px', background: 'var(--input-bg)',
          borderRadius: 'var(--r-md)', display: 'grid',
          gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11.5, lineHeight: 1.7,
        }}>
          <div>ستر: <b>{std.incubation.setterTemp}°C · {std.incubation.setterHumidity}٪</b></div>
          <div>هچر: <b>{std.incubation.hatcherTemp}°C · {std.incubation.hatcherHumidity}٪</b></div>
          {std.incubation.turningPerDay != null && (
            <div>چرخش/روز: <b>{std.incubation.turningPerDay}</b></div>
          )}
          {std.incubation.chickYieldPct != null && (
            <div>وزن جوجه: <b>{std.incubation.chickYieldPct}٪</b></div>
          )}
        </div>
        {std.incubation.candlingDays && std.incubation.candlingDays.length > 0 && (
          <div style={{
            marginTop: 8, padding: '6px 10px',
            background: 'var(--input-bg)', borderRadius: 'var(--r-sm)',
            fontSize: 11, color: 'var(--muted)', lineHeight: 1.8,
          }}>
            🔍 <b style={{ color: 'var(--text)' }}>روزهای تخم‌نما:</b>{' '}
            {std.incubation.candlingDays.join(' · ')}
          </div>
        )}
      </div>

      {/* پارامترهای جوجه‌کشی (اختیاری) */}
      <div style={{ paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>
          📦 پارامترهای جوجه‌کشی {hatchChanged && <span style={{ color: 'var(--warn)' }}>🔸</span>}
        </div>
        <HatchingEditor std={std} def={def} updateBird={updateBird} />
      </div>
    </SettingsGroup>
  );
}
