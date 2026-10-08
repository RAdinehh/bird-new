/**
 * BasicSections — شناسه نژاد + بیولوژی
 */
import SettingsGroup from '../../SettingsGroup';
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
  nameChanged: boolean;
  spaceChanged: boolean;
  bioChanged: boolean;
  updateBird: (patch: Partial<BirdStandard>) => void;
}

export default function BasicSections({ std, def, nameChanged, spaceChanged, bioChanged, updateBird }: Props) {
  return (
    <>
        <SettingsGroup
          icon="📝"
          title="شناسه نژاد"
          subtitle={(nameChanged || spaceChanged) ? '🔸 تغییر یافته' : `${std.nameFa} · ${std.birdName}`}
          exclusiveGroup="std-sections"
          persist={false}
          tone="info"
        >
          <G2>
            <F label="نام فارسی">
              <input
                type="text"
                value={std.nameFa}
                onChange={e => updateBird({ nameFa: e.target.value })}
                style={{
                  width: '100%', height: 34, padding: '0 10px',
                  background: 'var(--input-bg)',
                  border: '1px solid ' + (std.nameFa !== def.nameFa ? 'var(--warn)' : 'var(--border)'),
                  borderRadius: 'var(--r-md)',
                  color: 'var(--text)', fontFamily: 'inherit',
                  fontSize: 'var(--fs-base)', fontWeight: 600,
                  textAlign: 'right', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </F>
            <F label="نام انگلیسی">
              <input
                type="text"
                value={std.nameEn}
                onChange={e => updateBird({ nameEn: e.target.value })}
                dir="ltr"
                style={{
                  width: '100%', height: 34, padding: '0 10px',
                  background: 'var(--input-bg)',
                  border: '1px solid ' + (std.nameEn !== def.nameEn ? 'var(--warn)' : 'var(--border)'),
                  borderRadius: 'var(--r-md)',
                  color: 'var(--text)', fontFamily: 'inherit',
                  fontSize: 'var(--fs-base)', fontWeight: 600,
                  textAlign: 'left', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </F>
          </G2>
          <F label="پرنده مادر">
            <input
              type="text"
              value={std.birdName}
              onChange={e => updateBird({ birdName: e.target.value })}
              style={{
                width: '100%', height: 34, padding: '0 10px',
                background: 'var(--input-bg)',
                border: '1px solid ' + (std.birdName !== def.birdName ? 'var(--warn)' : 'var(--border)'),
                borderRadius: 'var(--r-md)',
                color: 'var(--text)', fontFamily: 'inherit',
                fontSize: 'var(--fs-base)', fontWeight: 600,
                textAlign: 'right', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </F>
        </SettingsGroup>

        {/* بیولوژی */}
        <SettingsGroup
          icon="🧬"
          title="بیولوژی"
          subtitle={bioChanged ? '🔸 تغییر یافته' : 'تخم‌گذاری، کشتار، انکوباسیون'}
          exclusiveGroup="std-sections"
          persist={false}
          tone="accent"
        >
          <G2>
            <F label="سن تخم‌گذاری (روز)">
              <input
                type="text"
                inputMode="decimal"
                value={std.biology.layingStartDay ?? ''}
                onChange={e => {
                  const en = e.target.value.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٫،]/g, '.').replace(/[^\d.-]/g, '');
                  const n = en ? parseFloat(en) : null;
                  updateBird({ biology: { ...std.biology, layingStartDay: n && !isNaN(n) ? n : null } });
                }}
                style={{
                  width: '100%', height: 34, padding: '0 10px',
                  background: 'var(--input-bg)',
                  border: '1px solid ' + (std.biology.layingStartDay !== def.biology.layingStartDay ? 'var(--warn)' : 'var(--border)'),
                  borderRadius: 'var(--r-md)',
                  color: 'var(--text)', fontFamily: 'inherit',
                  fontSize: 'var(--fs-base)', fontWeight: 700,
                  textAlign: 'center', outline: 'none', boxSizing: 'border-box',
                  direction: 'rtl',
                }}
              />
            </F>
            <F label="سن کشتار (روز)">
              <input
                type="text"
                inputMode="decimal"
                value={std.biology.cullDay ?? ''}
                onChange={e => {
                  const en = e.target.value.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٫،]/g, '.').replace(/[^\d.-]/g, '');
                  const n = en ? parseFloat(en) : null;
                  updateBird({ biology: { ...std.biology, cullDay: n && !isNaN(n) ? n : null } });
                }}
                style={{
                  width: '100%', height: 34, padding: '0 10px',
                  background: 'var(--input-bg)',
                  border: '1px solid ' + (std.biology.cullDay !== def.biology.cullDay ? 'var(--warn)' : 'var(--border)'),
                  borderRadius: 'var(--r-md)',
                  color: 'var(--text)', fontFamily: 'inherit',
                  fontSize: 'var(--fs-base)', fontWeight: 700,
                  textAlign: 'center', outline: 'none', boxSizing: 'border-box',
                  direction: 'rtl',
                }}
              />
            </F>
          </G2>
          <G2>
            <F label="دوره انکوباسیون (روز)">
              <input
                type="text"
                inputMode="decimal"
                value={std.incubation.totalDays}
                onChange={e => {
                  const en = e.target.value.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٫،]/g, '.').replace(/[^\d.]/g, '');
                  const n = parseFloat(en);
                  if (!isNaN(n) && n > 0) updateBird({ incubation: { ...std.incubation, totalDays: n } });
                }}
                style={{
                  width: '100%', height: 34, padding: '0 10px',
                  background: 'var(--input-bg)',
                  border: '1px solid ' + (std.incubation.totalDays !== def.incubation.totalDays ? 'var(--warn)' : 'var(--border)'),
                  borderRadius: 'var(--r-md)',
                  color: 'var(--text)', fontFamily: 'inherit',
                  fontSize: 'var(--fs-base)', fontWeight: 700,
                  textAlign: 'center', outline: 'none', boxSizing: 'border-box',
                  direction: 'rtl',
                }}
              />
            </F>
            <F label="روز Lockdown">
              <input
                type="text"
                inputMode="decimal"
                value={std.incubation.lockdownDay}
                onChange={e => {
                  const en = e.target.value.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٫،]/g, '.').replace(/[^\d.]/g, '');
                  const n = parseFloat(en);
                  if (!isNaN(n) && n > 0) updateBird({ incubation: { ...std.incubation, lockdownDay: n } });
                }}
                style={{
                  width: '100%', height: 34, padding: '0 10px',
                  background: 'var(--input-bg)',
                  border: '1px solid ' + (std.incubation.lockdownDay !== def.incubation.lockdownDay ? 'var(--warn)' : 'var(--border)'),
                  borderRadius: 'var(--r-md)',
                  color: 'var(--text)', fontFamily: 'inherit',
                  fontSize: 'var(--fs-base)', fontWeight: 700,
                  textAlign: 'center', outline: 'none', boxSizing: 'border-box',
                  direction: 'rtl',
                }}
              />
            </F>
          </G2>
          <G2>
            <F label="چرخش در روز">
              <input
                type="text"
                inputMode="decimal"
                value={std.incubation.turningPerDay ?? ''}
                onChange={e => {
                  const en = e.target.value.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٫،]/g, '.').replace(/[^\d.]/g, '');
                  const n = parseFloat(en);
                  updateBird({ incubation: { ...std.incubation, turningPerDay: !isNaN(n) ? n : undefined } });
                }}
                style={{
                  width: '100%', height: 34, padding: '0 10px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                  color: 'var(--text)', fontFamily: 'inherit',
                  fontSize: 'var(--fs-base)', fontWeight: 700,
                  textAlign: 'center', outline: 'none', boxSizing: 'border-box',
                  direction: 'rtl',
                }}
              />
            </F>
            <F label="وزن جوجه (٪ تخم)">
              <input
                type="text"
                inputMode="decimal"
                value={std.incubation.chickYieldPct ?? ''}
                onChange={e => {
                  const en = e.target.value.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٫،]/g, '.').replace(/[^\d.]/g, '');
                  const n = parseFloat(en);
                  updateBird({ incubation: { ...std.incubation, chickYieldPct: !isNaN(n) ? n : undefined } });
                }}
                style={{
                  width: '100%', height: 34, padding: '0 10px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                  color: 'var(--text)', fontFamily: 'inherit',
                  fontSize: 'var(--fs-base)', fontWeight: 700,
                  textAlign: 'center', outline: 'none', boxSizing: 'border-box',
                  direction: 'rtl',
                }}
              />
            </F>
          </G2>
          {std.incubation.candlingDays && std.incubation.candlingDays.length > 0 && (
            <div style={{
              padding: '6px 10px',
              background: 'var(--input-bg)',
              borderRadius: 'var(--r-sm)',
              fontSize: 'var(--fs-xs)',
              color: 'var(--muted)',
              lineHeight: 1.8,
            }}>
              🔍 <b style={{ color: 'var(--text)' }}>روزهای تخم‌نما:</b>{' '}
              {std.incubation.candlingDays.join(' · ')}
            </div>
          )}
          {(std.incubation.setterTemp || std.incubation.hatcherTemp) && (
            <div style={{
              padding: '8px 12px',
              background: 'var(--input-bg)',
              borderRadius: 'var(--r-md)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              fontSize: 'var(--fs-xs)',
              lineHeight: 1.8,
            }}>
              <div>
                <b style={{ color: 'var(--text)' }}>ستر:</b>{' '}
                {std.incubation.setterTemp}°C · {std.incubation.setterHumidity}٪
              </div>
              <div>
                <b style={{ color: 'var(--text)' }}>هچر:</b>{' '}
                {std.incubation.hatcherTemp}°C · {std.incubation.hatcherHumidity}٪
              </div>
            </div>
          )}
        </SettingsGroup>
    </>
  );
}
