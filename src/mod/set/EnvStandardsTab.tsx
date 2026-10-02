/**
 * EnvStandardsTab.tsx — استانداردهای نژادها (طرح کارتی)
 */

import { useState } from 'react';
import { useSet } from './store';
import {
  Btn, Field, Grid2, NumField, Input, PageContainer, Sheet, Modal, ErrorBox,
} from '../../shr/components/ui';
import SettingsGroup from './SettingsGroup';
import { showToast } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';
import { useBrd } from '../brd/store';
import { useFlk } from '../flk/store';
import { toFa } from '../../shr/utils/fa';
import {
  DEFAULT_STANDARDS,
  getStandardsGroupedByBird,
  type BirdStandard,
  type EnvRange,
  type FeedRange,
  type GrowthRange,
  type MortalityRange,
} from './standards';

// ═══════════════════════════════════════════════
// RangeCard — یک کارت برای هر رنج سنی
// ═══════════════════════════════════════════════
function RangeCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--input-bg)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
      padding: '10px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{
        fontSize: 'var(--fs-sm)',
        fontWeight: 700,
        color: 'var(--accent)',
        textAlign: 'right',
        paddingBottom: 6,
        borderBottom: '1px dashed var(--border)',
      }}>{title}</div>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════
// CompactField — لیبل بالا، ورودی پایین (برای گرید ۲ ستونه)
// ═══════════════════════════════════════════════
function CompactField({
  label, value, onChange, unit,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  unit: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <span style={{
        fontSize: 11,
        color: 'var(--muted)',
        fontWeight: 600,
        textAlign: 'right',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input
          type="text"
          inputMode="decimal"
          value={value === null || value === undefined ? '' : String(value)}
          onChange={(e) => {
            let v = e.target.value;
            // تبدیل ارقام فارسی به لاتین
            v = v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
            // فقط اعداد و نقطه منفی مجاز
            v = v.replace(/[^\d.-]/g, '');
            if (v === '' || v === '-' || v === '.') {
              onChange(null);
              return;
            }
            const n = Number(v);
            if (!isNaN(n)) onChange(n);
          }}
          onFocus={(e) => e.target.select()}
          style={{
            flex: 1,
            height: 32,
            padding: '0 6px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)',
            color: 'var(--text)',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 600,
            textAlign: 'center',
            outline: 'none',
            fontVariantNumeric: 'tabular-nums',
            direction: 'ltr',
            minWidth: 0,
          }}
        />
        <span style={{
          fontSize: 10,
          color: 'var(--muted)',
          flexShrink: 0,
          minWidth: 24,
          textAlign: 'left',
        }}>{unit}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// FieldsGrid — گرید ۲ ستونه برای فیلدها
// ═══════════════════════════════════════════════
function FieldsGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px 8px',
    }}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════
// EnvEditor — دما و رطوبت
// ═══════════════════════════════════════════════
function EnvEditor({ env, onChange }: { env: EnvRange[]; onChange: (n: EnvRange[]) => void }) {
  const update = (i: number, patch: Partial<EnvRange>) => {
    onChange(env.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {env.map((r, i) => (
        <RangeCard
          key={i}
          title={`روز ${toFa(r.dayFrom)} تا ${r.dayTo === 9999 ? 'پایان' : toFa(r.dayTo)}`}
        >
          <FieldsGrid>
            <CompactField
              label="🌡 دما هدف"
              value={r.temp.target}
              onChange={v => update(i, { temp: { ...r.temp, target: v ?? 0 } })}
              unit="°C"
            />
            <CompactField
              label="دما حداقل"
              value={r.temp.min}
              onChange={v => update(i, { temp: { ...r.temp, min: v ?? 0 } })}
              unit="°C"
            />
            <CompactField
              label="دما حداکثر"
              value={r.temp.max}
              onChange={v => update(i, { temp: { ...r.temp, max: v ?? 0 } })}
              unit="°C"
            />
            <CompactField
              label="💧 رطوبت حداقل"
              value={r.humidity.min}
              onChange={v => update(i, { humidity: { ...r.humidity, min: v ?? 0 } })}
              unit="٪"
            />
            <CompactField
              label="رطوبت حداکثر"
              value={r.humidity.max}
              onChange={v => update(i, { humidity: { ...r.humidity, max: v ?? 0 } })}
              unit="٪"
            />
          </FieldsGrid>
        </RangeCard>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// FeedEditor — تغذیه
// ═══════════════════════════════════════════════
function FeedEditor({ feed, onChange }: { feed: FeedRange[]; onChange: (n: FeedRange[]) => void }) {
  const update = (i: number, patch: Partial<FeedRange>) => {
    onChange(feed.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {feed.map((r, i) => (
        <RangeCard
          key={i}
          title={`روز ${toFa(r.dayFrom)} تا ${r.dayTo === 9999 ? 'پایان' : toFa(r.dayTo)}`}
        >
          <FieldsGrid>
            <CompactField
              label="🌾 دان"
              value={r.feedG}
              onChange={v => update(i, { feedG: v ?? 0 })}
              unit="گرم"
            />
            <CompactField
              label="💧 آب"
              value={r.waterMl}
              onChange={v => update(i, { waterMl: v ?? 0 })}
              unit="ml"
            />
            <CompactField
              label="🥩 پروتئین"
              value={r.proteinPct ?? null}
              onChange={v => update(i, { proteinPct: v ?? undefined })}
              unit="٪"
            />
            <CompactField
              label="⚡ انرژی"
              value={r.energyKcal ?? null}
              onChange={v => update(i, { energyKcal: v ?? undefined })}
              unit="kcal"
            />
          </FieldsGrid>
        </RangeCard>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// GrowthEditor — رشد
// ═══════════════════════════════════════════════
function GrowthEditor({ growth, onChange }: { growth: GrowthRange[]; onChange: (n: GrowthRange[]) => void }) {
  const update = (i: number, patch: Partial<GrowthRange>) => {
    onChange(growth.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {growth.map((r, i) => (
        <RangeCard
          key={i}
          title={`روز ${toFa(r.dayFrom)} تا ${r.dayTo === 9999 ? 'پایان' : toFa(r.dayTo)}`}
        >
          <FieldsGrid>
            <CompactField
              label="⚖️ وزن"
              value={r.weightG}
              onChange={v => update(i, { weightG: v ?? 0 })}
              unit="گرم"
            />
            <CompactField
              label="📈 ADG"
              value={r.adgG}
              onChange={v => update(i, { adgG: v ?? 0 })}
              unit="گرم"
            />
            <CompactField
              label="🎯 FCR"
              value={r.fcr}
              onChange={v => update(i, { fcr: v ?? 0 })}
              unit="—"
            />
          </FieldsGrid>
        </RangeCard>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// MortalityEditor — تلفات
// ═══════════════════════════════════════════════
function MortalityEditor({ mortality, onChange }: { mortality: MortalityRange[]; onChange: (n: MortalityRange[]) => void }) {
  const update = (i: number, patch: Partial<MortalityRange>) => {
    onChange(mortality.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {mortality.map((r, i) => (
        <RangeCard
          key={i}
          title={`روز ${toFa(r.dayFrom)} تا ${r.dayTo === 9999 ? 'پایان' : toFa(r.dayTo)}`}
        >
          <CompactField
            label="💀 حداکثر تلفات"
            value={r.maxPct}
            onChange={v => update(i, { maxPct: v ?? 0 })}
            unit="٪"
          />
        </RangeCard>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// StandardDetail — صفحه جزئیات
// ═══════════════════════════════════════════════
function StandardDetail({ birdKey, onClose }: { birdKey: string; onClose: () => void }) {
  const s = useSet();
  const custom = (s as any).customStandards || {};
  const isCustom = !!custom[birdKey];
  const std: BirdStandard = custom[birdKey] || DEFAULT_STANDARDS[birdKey] || {
    ...DEFAULT_STANDARDS.marandi,
    key: birdKey,
  };

  const updateBird = (patch: Partial<BirdStandard>) => {
    (s as any).updateStandard(birdKey, { ...std, ...patch });
  };

  const resetBird = async () => {
    const ok = await showConfirmAsync(
      'بازگشت به پیش‌فرض',
      'همه ویرایش‌های این نژاد حذف شود؟',
      { danger: true }
    );
    if (!ok) return;
    (s as any).resetStandard(birdKey);
    showToast('بازگشت به پیش‌فرض انجام شد', 'success', 2000);
  };

  return (
    <Sheet open={true} onClose={onClose} title={std.nameFa + ' — استاندارد'}>
      <PageContainer>
        {/* نام‌ها */}
        <SettingsGroup icon="📝" title="نام‌ها" tone="info">
          <Field label="نام نژاد (فارسی)">
            <Input value={std.nameFa} onChange={e => updateBird({ nameFa: e.target.value })} />
          </Field>
          <Field label="نام نژاد (انگلیسی)">
            <Input value={std.nameEn} onChange={e => updateBird({ nameEn: e.target.value })} />
          </Field>
          <Field label="پرنده مادر" hint="مرغ، بوقلمون، اردک، ...">
            <Input value={std.birdName} onChange={e => updateBird({ birdName: e.target.value })} />
          </Field>
        </SettingsGroup>

        {/* بیولوژی */}
        <SettingsGroup icon="🧬" title="بیولوژی" tone="accent">
          <Grid2>
            <Field label="سن شروع تخم‌گذاری">
              <NumField
                value={std.biology.layingStartDay?.toString() ?? ''}
                onChange={e => updateBird({ biology: { ...std.biology, layingStartDay: e.target.value ? Number(e.target.value) : null } })}
                unit="روز"
                min={0}
              />
            </Field>
            <Field label="سن کشتار">
              <NumField
                value={std.biology.cullDay?.toString() ?? ''}
                onChange={e => updateBird({ biology: { ...std.biology, cullDay: e.target.value ? Number(e.target.value) : null } })}
                unit="روز"
                min={0}
              />
            </Field>
          </Grid2>
          <Grid2>
            <Field label="دوره انکوباسیون">
              <NumField
                value={std.incubation.totalDays.toString()}
                onChange={e => updateBird({ incubation: { ...std.incubation, totalDays: Number(e.target.value) || 21 } })}
                unit="روز"
                min={1}
              />
            </Field>
            <Field label="روز Lockdown">
              <NumField
                value={std.incubation.lockdownDay.toString()}
                onChange={e => updateBird({ incubation: { ...std.incubation, lockdownDay: Number(e.target.value) || 18 } })}
                unit="روز"
                min={1}
              />
            </Field>
          </Grid2>
        </SettingsGroup>

        {/* دما و رطوبت */}
        <SettingsGroup icon="🌡" title="دما و رطوبت" subtitle="بر اساس سن" tone="warn">
          <EnvEditor env={std.env} onChange={env => updateBird({ env })} />
        </SettingsGroup>

        {/* تغذیه */}
        <SettingsGroup icon="🌾" title="تغذیه" subtitle="دان، آب، پروتئین، انرژی" tone="accent">
          <FeedEditor feed={std.feed} onChange={feed => updateBird({ feed })} />
        </SettingsGroup>

        {/* رشد */}
        <SettingsGroup icon="⚖️" title="رشد" subtitle="وزن، ADG، FCR" tone="purple">
          <GrowthEditor
            growth={std.growth.weightByAge}
            onChange={wba => updateBird({ growth: { ...std.growth, weightByAge: wba } })}
          />
        </SettingsGroup>

        {/* فضا و تراکم */}
        <SettingsGroup icon="📐" title="فضا و تراکم" tone="info">
          <Grid2>
            <Field label="تراکم (پرنده/m²)">
              <NumField
                value={std.space.densityMax.toString()}
                onChange={e => updateBird({ space: { ...std.space, densityMax: Number(e.target.value) || 0 } })}
                unit="پرنده"
                min={1}
              />
            </Field>
            <Field label="فضای دانخوری">
              <NumField
                value={std.space.feederSpaceCm.toString()}
                onChange={e => updateBird({ space: { ...std.space, feederSpaceCm: Number(e.target.value) || 0 } })}
                unit="cm"
                min={1}
              />
            </Field>
          </Grid2>
        </SettingsGroup>

        {/* تلفات */}
        <SettingsGroup icon="💀" title="تلفات مجاز" tone="danger">
          <MortalityEditor
            mortality={std.mortality}
            onChange={mortality => updateBird({ mortality })}
          />
          <Field label="تلفات کل چرخه (٪)">
            <NumField
              value={std.mortalityTotalPct.toString()}
              onChange={e => updateBird({ mortalityTotalPct: Number(e.target.value) || 0 })}
              unit="٪"
              min={0}
            />
          </Field>
        </SettingsGroup>

        {isCustom ? (
          <Btn onClick={resetBird} full>🔄 بازگشت به پیش‌فرض</Btn>
        ) : null}
      </PageContainer>
    </Sheet>
  );
}

// ═══════════════════════════════════════════════
// AddBirdModal — افزودن نژاد جدید
// ═══════════════════════════════════════════════
function AddBirdModal({
  open, onClose, existingCustom, onAdd,
}: {
  open: boolean;
  onClose: () => void;
  existingCustom: Record<string, BirdStandard>;
  onAdd: (key: string, nameFa: string, nameEn: string, birdName: string, template: BirdStandard) => void;
}) {
  const [customNameFa, setCustomNameFa] = useState('');
  const [customNameEn, setCustomNameEn] = useState('');
  const [customBirdName, setCustomBirdName] = useState('مرغ');
  const [templateKey, setTemplateKey] = useState<string>('marandi');
  const [err, setErr] = useState('');

  const allStandardKeys = Object.keys(DEFAULT_STANDARDS);
  const existingKeys = Object.keys(existingCustom);

  const reset = () => {
    setCustomNameFa('');
    setCustomNameEn('');
    setCustomBirdName('مرغ');
    setTemplateKey('marandi');
    setErr('');
  };

  const handleAdd = () => {
    if (!customNameFa.trim()) { setErr('نام نژاد اجباری است'); return; }
    if (!customBirdName.trim()) { setErr('نام پرنده مادر اجباری است'); return; }
    const key = customNameFa.trim().toLowerCase().replace(/\s+/g, '-');
    if (allStandardKeys.includes(key) || existingKeys.includes(key)) {
      setErr('این نام قبلاً هست');
      return;
    }
    const template = existingCustom[templateKey] || DEFAULT_STANDARDS[templateKey];
    onAdd(key, customNameFa.trim(), customNameEn.trim() || customNameFa.trim(), customBirdName.trim(), template);
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="افزودن نژاد جدید"
      footer={
        <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
          <Btn onClick={handleAdd} variant="primary" full>افزودن</Btn>
          <Btn onClick={onClose} full>لغو</Btn>
        </div>
      }
    >
      <Field label="پرنده مادر" required hint="مرغ، بوقلمون، اردک، ...">
        <Input
          value={customBirdName}
          onChange={e => setCustomBirdName(e.target.value)}
          placeholder="مرغ"
        />
      </Field>

      <Field label="نام نژاد (فارسی)" required>
        <Input
          value={customNameFa}
          onChange={e => setCustomNameFa(e.target.value)}
          placeholder="مثلاً — لاری"
        />
      </Field>

      <Field label="نام نژاد (انگلیسی)">
        <Input
          value={customNameEn}
          onChange={e => setCustomNameEn(e.target.value)}
          placeholder="Lari"
        />
      </Field>

      <Field label="کپی مقادیر از" hint="یک نژاد مشابه">
        <select
          value={templateKey}
          onChange={e => setTemplateKey(e.target.value)}
          style={{
            width: '100%',
            height: 38,
            background: 'var(--input-bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            padding: '0 10px',
            color: 'var(--text)',
            fontFamily: 'inherit',
            fontSize: 'var(--fs-base)',
          }}
        >
          {[...allStandardKeys, ...existingKeys].map(k => {
            const std = existingCustom[k] || DEFAULT_STANDARDS[k];
            return <option key={k} value={k}>{std.nameFa}</option>;
          })}
        </select>
      </Field>

      <div style={{
        padding: 'var(--pad-normal)',
        background: 'var(--input-bg)',
        borderRadius: 'var(--r-sm)',
        fontSize: 'var(--fs-xs)',
        color: 'var(--muted)',
        lineHeight: 1.8,
      }}>
        💡 تمام مقادیر از نژاد انتخاب‌شده کپی می‌شود.
      </div>

      <ErrorBox>{err}</ErrorBox>
    </Modal>
  );
}

// ═══════════════════════════════════════════════
// EnvStandardsTab — کامپوننت اصلی
// ═══════════════════════════════════════════════
export default function EnvStandardsTab() {
  const s = useSet();
  const custom = (s as any).customStandards || {};
  const { flocks } = useFlk();
  const { birds: brdBirds } = useBrd();

  const [selectedBird, setSelectedBird] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [onlyActive, setOnlyActive] = useState(true);

  const grouped = getStandardsGroupedByBird(custom);

  const activeBirdNames = new Set<string>();
  (flocks || [])
    .filter((f: any) => f.status === 'active')
    .forEach((f: any) => {
      const brd = (brdBirds || []).find((b: any) => b.id === f.birdId);
      if (brd?.name) activeBirdNames.add(brd.name.trim());
    });

  const visibleGroups = onlyActive
    ? Object.entries(grouped).filter(([birdName]) => activeBirdNames.has(birdName))
    : Object.entries(grouped);

  const handleAddBreed = (
    key: string, nameFa: string, nameEn: string, birdName: string, template: BirdStandard,
  ) => {
    const newStd: BirdStandard = {
      ...template,
      key,
      nameFa,
      nameEn,
      birdName,
    };
    (s as any).updateStandard(key, newStd);
    showToast(nameFa + ' اضافه شد', 'success', 2000);
  };

  const resetAll = async () => {
    const ok = await showConfirmAsync(
      'بازگشت همه',
      'همه ویرایش‌های استانداردها حذف شود؟',
      { danger: true }
    );
    if (!ok) return;
    Object.keys(custom).forEach(k => (s as any).resetStandard(k));
    showToast('همه به پیش‌فرض برگشتند', 'success', 2000);
  };

  return (
    <PageContainer>
      <div style={{
        padding: 'var(--pad-normal)',
        background: 'var(--accent-soft)',
        border: '1px solid var(--accent-border)',
        borderRadius: 'var(--r-md)',
        fontSize: 'var(--fs-sm)',
        color: 'var(--text)',
        lineHeight: 1.9,
      }}>
        <b>💡 استانداردها</b> — نژادها بر اساس پرنده مادر گروه‌بندی شده‌اند.
        روی هر نژاد بزن تا مقادیرش رو ویرایش کنی.
      </div>

      {/* Toggle */}
      <button
        type="button"
        onClick={() => setOnlyActive(!onlyActive)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: onlyActive ? 'var(--accent-soft)' : 'var(--input-bg)',
          border: '1px solid ' + (onlyActive ? 'var(--accent-border)' : 'var(--border)'),
          borderRadius: 'var(--r-md)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 'var(--fs-sm)',
          fontWeight: 600,
          color: onlyActive ? 'var(--accent)' : 'var(--muted)',
        }}
      >
        <span>{onlyActive ? '✓ فقط پرنده‌های فعال' : '👁 همه پرنده‌ها'}</span>
        <span style={{
          width: 36,
          height: 20,
          borderRadius: 10,
          background: onlyActive ? 'var(--accent)' : 'var(--border)',
          position: 'relative',
          transition: 'background 200ms',
        }}>
          <span style={{
            position: 'absolute',
            top: 2,
            [onlyActive ? 'right' : 'left']: 2,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#fff',
            transition: 'all 200ms',
          }} />
        </span>
      </button>

      {/* لیست گروه‌ها */}
      {visibleGroups.length === 0 ? (
        <div style={{
          padding: 'var(--pad-comfy)',
          textAlign: 'center',
          fontSize: 'var(--fs-sm)',
          color: 'var(--muted)',
          lineHeight: 2,
          background: 'var(--input-bg)',
          borderRadius: 'var(--r-md)',
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🐔</div>
          <div style={{ fontWeight: 700, color: 'var(--text)' }}>هنوز گله فعالی ندارید</div>
          <div style={{ fontSize: 'var(--fs-xs)', marginTop: 4 }}>
            ابتدا در ماژول «گله» یک گله بسازید
          </div>
          <button
            type="button"
            onClick={() => setOnlyActive(false)}
            style={{
              marginTop: 10,
              padding: '6px 12px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              color: 'var(--text)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 'var(--fs-xs)',
            }}
          >
            👁 نمایش همه پرنده‌ها
          </button>
        </div>
      ) : (
        visibleGroups.map(([birdName, breeds]) => (
          <SettingsGroup
            key={birdName}
            icon="🐔"
            title={birdName}
            subtitle={toFa(breeds.length) + ' نژاد'}
            tone="accent"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {breeds.map((std) => {
                const isCustom = !!custom[std.key];
                const isNative = std.category === 'native';
                const flockCount = (flocks || []).filter((f: any) => {
                  if (f.status !== 'active') return false;
                  const brd = (brdBirds || []).find((b: any) => b.id === f.birdId);
                  return brd?.name?.trim() === birdName;
                }).length;

                return (
                  <button
                    key={std.key}
                    type="button"
                    onClick={() => setSelectedBird(std.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r-md)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      textAlign: 'right',
                      minHeight: 52,
                    }}
                  >
                    <span style={{ fontSize: 20, flexShrink: 0 }}>
                      {isNative ? '🇮🇷' : '🔬'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 'var(--fs-base)',
                        fontWeight: 700,
                        color: 'var(--text)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}>
                        {std.nameFa}
                        {isCustom ? (
                          <span style={{ fontSize: 10, color: 'var(--accent)' }}>✓</span>
                        ) : null}
                      </div>
                      <div style={{
                        fontSize: 'var(--fs-xs)',
                        color: 'var(--muted)',
                        marginTop: 2,
                      }}>
                        {isNative ? 'بومی' : 'صنعتی'}
                        {flockCount > 0 ? ' · ' + toFa(flockCount) + ' گله' : ''}
                      </div>
                    </div>
                    <span style={{ color: 'var(--muted)', fontSize: 14 }}>‹</span>
                  </button>
                );
              })}
            </div>
          </SettingsGroup>
        ))
      )}

      <Btn onClick={() => setShowAddModal(true)} full>
        ➕ افزودن نژاد جدید
      </Btn>

      {Object.keys(custom).length > 0 ? (
        <Btn onClick={resetAll} full>🔄 بازگشت همه به پیش‌فرض</Btn>
      ) : null}

      {selectedBird ? (
        <StandardDetail birdKey={selectedBird} onClose={() => setSelectedBird(null)} />
      ) : null}

      <AddBirdModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        existingCustom={custom}
        onAdd={handleAddBreed}
      />
    </PageContainer>
  );
}
