import { PageContainer, Sheet } from '../../../../shr/components/ui';
import SettingsGroup from '../../SettingsGroup';
import { showToast } from '../../../../cor/store/toast';
import { showConfirmAsync } from '../../../../cor/store/dialog';
import { EnvEditor, FeedEditor, GrowthEditor, MortalityEditor } from './editors';
import { DEFAULT_STANDARDS, type BirdStandard } from '../index';
import { useSet } from '../../store';

// ═══ Field کوچیک با label بالا ═══
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <span style={{
        fontSize: 11,
        color: 'var(--muted)',
        fontWeight: 600,
        textAlign: 'right',
      }}>{label}</span>
      {children}
    </div>
  );
}

// ═══ Grid2 — ۲ ستونه ═══
function G2({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8,
    }}>
      {children}
    </div>
  );
}

function isChanged(a: unknown, b: unknown): boolean {
  try { return JSON.stringify(a) !== JSON.stringify(b); } catch { return false; }
}

export function StandardDetail({ birdKey, onClose }: { birdKey: string; onClose: () => void; }) {
  const s = useSet();
  const custom = (s as any).customStandards || {};
  const isCustom = !!custom[birdKey];
  const std: BirdStandard = custom[birdKey] || DEFAULT_STANDARDS[birdKey] || {
    ...DEFAULT_STANDARDS.marandi,
    key: birdKey,
  };
  const def = DEFAULT_STANDARDS[birdKey] || DEFAULT_STANDARDS.marandi;

  const updateBird = (patch: Partial<BirdStandard>) => {
    (s as any).updateStandard(birdKey, { ...std, ...patch });
  };

  const resetBird = async () => {
    const ok = await showConfirmAsync('بازگشت به پیش‌فرض', 'همه ویرایش‌های این نژاد حذف شود؟', { danger: true });
    if (!ok) return;
    (s as any).resetStandard(birdKey);
    showToast('بازگشت به پیش‌فرض انجام شد', 'success', 2000);
  };

  const nameChanged = std.nameFa !== def.nameFa || std.nameEn !== def.nameEn || std.birdName !== def.birdName;
  const bioChanged = isChanged(std.biology, def.biology);
  const spaceChanged = isChanged(std.space, def.space);
  const envChanged = isChanged(std.env, def.env);
  const feedChanged = isChanged(std.feed, def.feed) || isChanged(std.growth, def.growth);
  const mortChanged = isChanged(std.mortality, def.mortality) || std.mortalityTotalPct !== def.mortalityTotalPct;

  return (
    <Sheet open={true} onClose={onClose} title={std.nameFa + ' — استاندارد'}>
      <PageContainer>

        {/* شناسه نژاد */}
        <SettingsGroup
          icon="📝"
          title="شناسه نژاد"
          subtitle={(nameChanged || spaceChanged) ? '🔸 تغییر یافته' : `${std.nameFa} · ${std.birdName}`}
          exclusiveGroup="std-sections"
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
            <F label="فضای دانخوری (cm)">
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
        </SettingsGroup>

        {/* بیولوژی */}
        <SettingsGroup
          icon="🧬"
          title="بیولوژی"
          subtitle={bioChanged ? '🔸 تغییر یافته' : 'تخم‌گذاری، کشتار، انکوباسیون'}
          exclusiveGroup="std-sections"
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
        </SettingsGroup>

        {/* دما و رطوبت */}
        <SettingsGroup
          icon="🌡"
          title="دما و رطوبت"
          subtitle={envChanged ? '🔸 تغییر یافته' : `${std.env.length} مرحله سنی`}
          exclusiveGroup="std-sections"
          tone="danger"
        >
          <EnvEditor env={std.env} onChange={env => updateBird({ env })} />
        </SettingsGroup>

        {/* تغذیه و رشد */}
        <SettingsGroup
          icon="🌾"
          title="تغذیه و رشد"
          subtitle={feedChanged ? '🔸 تغییر یافته' : `${std.feed.length} مرحله دان · ${std.growth.weightByAge.length} نقطه رشد`}
          exclusiveGroup="std-sections"
          tone="purple"
        >
          <FeedEditor feed={std.feed} onChange={feed => updateBird({ feed })} />
          <div style={{ height: 8 }} />
          <GrowthEditor
            growth={std.growth.weightByAge}
            onChange={wba => updateBird({ growth: { ...std.growth, weightByAge: wba } })}
          />
        </SettingsGroup>

        {/* تلفات */}
        <SettingsGroup
          icon="💀"
          title="تلفات مجاز"
          subtitle={mortChanged ? '🔸 تغییر یافته' : `${std.mortality.length} مرحله · کل ${std.mortalityTotalPct}٪`}
          exclusiveGroup="std-sections"
          tone="danger"
        >
          <MortalityEditor
            mortality={std.mortality}
            onChange={mortality => updateBird({ mortality })}
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

        {isCustom ? (
          <button
            type="button"
            onClick={resetBird}
            style={{
              width: '100%',
              padding: '12px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)',
              color: 'var(--danger)',
              fontFamily: 'inherit',
              fontSize: 'var(--fs-base)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🔄 بازگشت به پیش‌فرض
          </button>
        ) : null}

      </PageContainer>
    </Sheet>
  );
}
