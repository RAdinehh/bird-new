/**
 * EnvStandardsTab.tsx — ویرایش استانداردهای محیطی، تغذیه‌ای، رشد و تولیدی
 *
 * کاربر می‌تواند هر مقدار را ویرایش کند.
 * تغییرات در customStandards ذخیره می‌شود.
 */

import { useState } from 'react';
import { useSet } from './store';
import { Btn, Field, Grid2, NumField, Input, PageContainer, ErrorBox } from '../../shr/components/ui';
import SettingsGroup from './SettingsGroup';
import { showToast } from '../../cor/store/toast';
import { showConfirmAsync, showAlert } from '../../cor/store/dialog';
import { useBrd } from '../brd/store';
import { Modal } from '../../shr/components/ui';
import { toFa, parseFaNum } from '../../shr/utils/fa';
import {
  DEFAULT_STANDARDS,
  type BirdStandard,
  type EnvRange,
  type FeedRange,
  type GrowthRange,
  type MortalityRange,
} from './standards';

// ═══ Row برای ویرایش عدد ═══
function NumCell({
  value, onChange, unit, width = 80, min = 0,
}: { value: number | null; onChange: (v: number | null) => void; unit?: string; width?: number; min?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: width }}>
      <input
        type="number"
        value={value ?? ''}
        min={min}
        onChange={(e) => {
          const v = e.target.value === '' ? null : Number(e.target.value);
          onChange(v);
        }}
        style={{
          flex: 1, height: 30, padding: '0 6px',
          background: 'var(--input-bg)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-sm)', color: 'var(--text)',
          fontFamily: 'inherit', fontSize: 'var(--fs-sm)',
          outline: 'none', textAlign: 'center', minWidth: 0,
          fontVariantNumeric: 'tabular-nums',
          direction: 'ltr',
        }}
      />
      {unit && <span style={{ fontSize: 10, color: 'var(--muted)', flexShrink: 0 }}>{unit}</span>}
    </div>
  );
}

function TabHeader({ children }: { children: string }) {
  return (
    <div style={{
      fontSize: 'var(--fs-xs)', color: 'var(--muted)',
      fontWeight: 700, padding: '6px 4px', textAlign: 'center',
    }}>{children}</div>
  );
}

// ═══ ویرایش env ═══
function EnvEditor({ env, onChange }: { env: EnvRange[]; onChange: (next: EnvRange[]) => void }) {
  const update = (i: number, patch: Partial<EnvRange>) => {
    const next = env.map((r, idx) => idx === i ? { ...r, ...patch } : r);
    onChange(next);
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: 560, display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr 1fr 1fr', gap: 4 }}>
        <TabHeader>روز</TabHeader>
        <TabHeader>دما هدف</TabHeader>
        <TabHeader>دما min</TabHeader>
        <TabHeader>دما max</TabHeader>
        <TabHeader>رطوبت min</TabHeader>
        <TabHeader>رطوبت max</TabHeader>

        {env.map((r, i) => (
          <div key={i} style={{ display: 'contents' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 600,
              fontVariantNumeric: 'tabular-nums', direction: 'ltr',
            }}>{r.dayFrom}-{r.dayTo === 9999 ? '∞' : r.dayTo}</div>
            <NumCell value={r.temp.target} onChange={v => update(i, { temp: { ...r.temp, target: v ?? 0 } })} unit="°C" />
            <NumCell value={r.temp.min} onChange={v => update(i, { temp: { ...r.temp, min: v ?? 0 } })} unit="°C" />
            <NumCell value={r.temp.max} onChange={v => update(i, { temp: { ...r.temp, max: v ?? 0 } })} unit="°C" />
            <NumCell value={r.humidity.min} onChange={v => update(i, { humidity: { ...r.humidity, min: v ?? 0 } })} unit="٪" />
            <NumCell value={r.humidity.max} onChange={v => update(i, { humidity: { ...r.humidity, max: v ?? 0 } })} unit="٪" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══ ویرایش feed ═══
function FeedEditor({ feed, onChange }: { feed: FeedRange[]; onChange: (next: FeedRange[]) => void }) {
  const update = (i: number, patch: Partial<FeedRange>) => {
    const next = feed.map((r, idx) => idx === i ? { ...r, ...patch } : r);
    onChange(next);
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: 480, display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr 1fr', gap: 4 }}>
        <TabHeader>روز</TabHeader>
        <TabHeader>دان (g)</TabHeader>
        <TabHeader>آب (ml)</TabHeader>
        <TabHeader>پروتئین ٪</TabHeader>
        <TabHeader>انرژی kcal</TabHeader>

        {feed.map((r, i) => (
          <div key={i} style={{ display: 'contents' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 600,
              fontVariantNumeric: 'tabular-nums', direction: 'ltr',
            }}>{r.dayFrom}-{r.dayTo === 9999 ? '∞' : r.dayTo}</div>
            <NumCell value={r.feedG} onChange={v => update(i, { feedG: v ?? 0 })} unit="g" />
            <NumCell value={r.waterMl} onChange={v => update(i, { waterMl: v ?? 0 })} unit="ml" />
            <NumCell value={r.proteinPct ?? null} onChange={v => update(i, { proteinPct: v ?? undefined })} unit="٪" />
            <NumCell value={r.energyKcal ?? null} onChange={v => update(i, { energyKcal: v ?? undefined })} unit="k" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══ ویرایش growth ═══
function GrowthEditor({ growth, onChange }: { growth: GrowthRange[]; onChange: (next: GrowthRange[]) => void }) {
  const update = (i: number, patch: Partial<GrowthRange>) => {
    const next = growth.map((r, idx) => idx === i ? { ...r, ...patch } : r);
    onChange(next);
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: 480, display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr', gap: 4 }}>
        <TabHeader>روز</TabHeader>
        <TabHeader>وزن (g)</TabHeader>
        <TabHeader>ADG (g)</TabHeader>
        <TabHeader>FCR</TabHeader>

        {growth.map((r, i) => (
          <div key={i} style={{ display: 'contents' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 600,
              fontVariantNumeric: 'tabular-nums', direction: 'ltr',
            }}>{r.dayFrom}-{r.dayTo === 9999 ? '∞' : r.dayTo}</div>
            <NumCell value={r.weightG} onChange={v => update(i, { weightG: v ?? 0 })} unit="g" />
            <NumCell value={r.adgG} onChange={v => update(i, { adgG: v ?? 0 })} unit="g" />
            <NumCell value={r.fcr} onChange={v => update(i, { fcr: v ?? 0 })} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══ ویرایش mortality ═══
function MortalityEditor({ mortality, onChange }: { mortality: MortalityRange[]; onChange: (next: MortalityRange[]) => void }) {
  const update = (i: number, patch: Partial<MortalityRange>) => {
    const next = mortality.map((r, idx) => idx === i ? { ...r, ...patch } : r);
    onChange(next);
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: 360, display: 'grid', gridTemplateColumns: '100px 1fr', gap: 4 }}>
        <TabHeader>روز</TabHeader>
        <TabHeader>حداکثر ٪</TabHeader>

        {mortality.map((r, i) => (
          <div key={i} style={{ display: 'contents' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 600,
              fontVariantNumeric: 'tabular-nums', direction: 'ltr',
            }}>{r.dayFrom}-{r.dayTo === 9999 ? '∞' : r.dayTo}</div>
            <NumCell value={r.maxPct} onChange={v => update(i, { maxPct: v ?? 0 })} unit="٪" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══ کامپوننت اصلی ═══
export default function EnvStandardsTab() {
  const s = useSet();
  const custom = (s as any).customStandards || {};

  // برای هر پرنده: از custom یا default
  const getEffective = (key: string): BirdStandard => {
    return custom[key] || DEFAULT_STANDARDS[key];
  };

  const updateBird = (key: string, patch: Partial<BirdStandard>) => {
    const base = getEffective(key);
    (s as any).updateStandard(key, { ...base, ...patch });
  };

  const resetBird = async (key: string) => {
    const ok = await showConfirmAsync(
      `بازگشت به پیش‌فرض`,
      `همه ویرایش‌های «${DEFAULT_STANDARDS[key].nameFa}» حذف شود؟`,
      { danger: true }
    );
    if (!ok) return;
    (s as any).resetStandard(key);
    showToast('بازگشت به پیش‌فرض انجام شد', 'success', 2000);
  };

  const birdKeys = Object.keys(DEFAULT_STANDARDS);

  return (
    <PageContainer>
      {/* بنر راهنما */}
      <div style={{
        padding: 'var(--pad-normal)',
        background: 'var(--accent-soft)',
        border: '1px solid var(--accent-border)',
        borderRadius: 'var(--r-md)',
        fontSize: 'var(--fs-sm)',
        color: 'var(--text)',
        lineHeight: 1.9,
      }}>
        <b>💡 استانداردها</b> — اینجا همه‌ی مقادیر پیش‌فرض پرنده‌ها رو می‌بینی.
        می‌تونی هر عدد رو ویرایش کنی. تغییرات روی همه‌ی ماژول‌ها اعمال می‌شه.
        جاهایی که کاربر مقدار دستی وارد کنه، اون مقدار اولویت داره.
      </div>

      {birdKeys.map((key) => {
        const std = getEffective(key);
        const isCustom = !!custom[key];

        return (
          <SettingsGroup
            key={key}
            icon={std.category === 'native' ? '🇮🇷' : '🔬'}
            title={std.nameFa + (isCustom ? ' ✓ ویرایش‌شده' : '')}
            subtitle={std.nameEn}
            tone={std.category === 'native' ? 'accent' : 'info'}
          >
            {/* اطلاعات پایه */}
            <Grid2>
              <Field label="نام فارسی">
                <Input
                  value={std.nameFa}
                  onChange={e => updateBird(key, { nameFa: e.target.value })}
                />
              </Field>
              <Field label="نام انگلیسی">
                <Input
                  value={std.nameEn}
                  onChange={e => updateBird(key, { nameEn: e.target.value })}
                />
              </Field>
            </Grid2>

            {/* بیولوژی */}
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, paddingTop: 4 }}>🧬 بیولوژی</div>
            <Grid2>
              <Field label="سن شروع تخم‌گذاری (روز)">
                <NumField
                  value={std.biology.layingStartDay?.toString() ?? ''}
                  onChange={e => updateBird(key, { biology: { ...std.biology, layingStartDay: e.target.value ? Number(e.target.value) : null } })}
                  unit="روز" min={0}
                />
              </Field>
              <Field label="سن کشتار (روز)">
                <NumField
                  value={std.biology.cullDay?.toString() ?? ''}
                  onChange={e => updateBird(key, { biology: { ...std.biology, cullDay: e.target.value ? Number(e.target.value) : null } })}
                  unit="روز" min={0}
                />
              </Field>
            </Grid2>
            <Grid2>
              <Field label="دوره انکوباسیون (روز)">
                <NumField
                  value={std.incubation.totalDays.toString()}
                  onChange={e => updateBird(key, { incubation: { ...std.incubation, totalDays: Number(e.target.value) || 21 } })}
                  unit="روز" min={1}
                />
              </Field>
              <Field label="روز Lockdown">
                <NumField
                  value={std.incubation.lockdownDay.toString()}
                  onChange={e => updateBird(key, { incubation: { ...std.incubation, lockdownDay: Number(e.target.value) || 18 } })}
                  unit="روز" min={1}
                />
              </Field>
            </Grid2>

            {/* محیط */}
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, paddingTop: 4 }}>🌡 دما و رطوبت (بر اساس سن)</div>
            <EnvEditor env={std.env} onChange={env => updateBird(key, { env })} />

            {/* تغذیه */}
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, paddingTop: 4 }}>🌾 تغذیه (بر اساس سن)</div>
            <FeedEditor feed={std.feed} onChange={feed => updateBird(key, { feed })} />

            {/* رشد */}
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, paddingTop: 4 }}>⚖️ رشد (وزن، ADG، FCR)</div>
            <GrowthEditor growth={std.growth.weightByAge} onChange={wba => updateBird(key, { growth: { ...std.growth, weightByAge: wba } })} />

            {/* فضا و تجهیزات */}
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, paddingTop: 4 }}>📐 فضا و تراکم</div>
            <Grid2>
              <Field label="تراکم (پرنده/m²)">
                <NumField value={std.space.densityMax.toString()} onChange={e => updateBird(key, { space: { ...std.space, densityMax: Number(e.target.value) || 0 } })} unit="پرنده" min={1} />
              </Field>
              <Field label="فضای دانخوری (cm/پرنده)">
                <NumField value={std.space.feederSpaceCm.toString()} onChange={e => updateBird(key, { space: { ...std.space, feederSpaceCm: Number(e.target.value) || 0 } })} unit="cm" min={1} />
              </Field>
            </Grid2>

            {/* تلفات */}
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, paddingTop: 4 }}>💀 تلفات مجاز (٪)</div>
            <MortalityEditor mortality={std.mortality} onChange={mortality => updateBird(key, { mortality })} />
            <Field label="تلفات کل چرخه (٪)">
              <NumField value={std.mortalityTotalPct.toString()} onChange={e => updateBird(key, { mortalityTotalPct: Number(e.target.value) || 0 })} unit="٪" min={0} />
            </Field>

            {/* Reset */}
            {isCustom && (
              <Btn
                onClick={() => resetBird(key)}
                full
                style={{ marginTop: 8 }}
              >
                🔄 بازگشت به پیش‌فرض {DEFAULT_STANDARDS[key].nameFa}
              </Btn>
            )}
          </SettingsGroup>
        );
      })}
    </PageContainer>
  );
}
