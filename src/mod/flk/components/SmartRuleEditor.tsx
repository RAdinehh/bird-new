/**
 * SmartRuleEditor.tsx — ویرایشگر قانون گروه هوشمند
 * چیدمان ۲ ستونه + مرحله زندگی (preset) + hint هوشمند
 */
import { useState } from 'react';
import { Select, Field, Input, Grid2 } from '../../../shr/components/ui';
import type { FlockGroupRule, FlockGroupType, FlockStatus } from '../store';
import { toEn, toFa } from '../../../shr/utils/fa';

export interface SmartRuleEditorProps {
  rule: FlockGroupRule;
  onChange: (rule: FlockGroupRule) => void;
  breeds: Array<{ id: string; name: string; birdId: string }>;
  halls: Array<{ id: string; name: string }>;
}

export function SmartRuleEditor({ rule, onChange, breeds, halls }: SmartRuleEditorProps) {
  const update = (patch: Partial<FlockGroupRule>) => {
    const next: FlockGroupRule = { ...rule, ...patch };
    Object.keys(next).forEach(k => {
      const v = (next as Record<string, unknown>)[k];
      if (v === '' || v === undefined || v === null || (typeof v === 'number' && isNaN(v))) {
        delete (next as Record<string, unknown>)[k];
      }
    });
    onChange(next);
  };

  const parseAge = (s: string): number | undefined => {
    if (!s) return undefined;
    const n = parseInt(toEn(s).replace(/[^0-9-]/g, ''), 10);
    if (isNaN(n)) return undefined;
    // 🆕 حداکثر ۶۰۰ روز (سن واقعی مرغ)
    return Math.min(600, Math.max(0, n));
  };

  const ageConflict =
    typeof rule.minAge === 'number' &&
    typeof rule.maxAge === 'number' &&
    rule.minAge >= rule.maxAge;

  type AgeStage = 'all' | 'chick' | 'pullet' | 'adult' | 'old' | 'custom';
  const STAGES: Array<{ key: AgeStage; label: string; min?: number; max?: number }> = [
    { key: 'all', label: 'همه' },
    { key: 'chick', label: 'جوجه (۰-۶۰ روز)', min: 0, max: 60 },
    { key: 'pullet', label: 'نیمچه (۶۰-۱۴۰ روز)', min: 60, max: 140 },
    { key: 'adult', label: 'بالغ (۱۴۰-۵۰۰ روز)', min: 140, max: 500 },
    { key: 'old', label: 'پیر (۵۰۰+ روز)', min: 500 },
    { key: 'custom', label: 'سفارشی' },
  ];

  const detectStage = (): AgeStage => {
    if (forceCustom) return 'custom';
    const { minAge, maxAge } = rule;
    if (typeof minAge !== 'number' && typeof maxAge !== 'number') return 'all';
    if (minAge === 0 && maxAge === 60) return 'chick';
    if (minAge === 60 && maxAge === 140) return 'pullet';
    if (minAge === 140 && maxAge === 500) return 'adult';
    if (minAge === 500 && typeof maxAge !== 'number') return 'old';
    return 'custom';
  };

  const [forceCustom, setForceCustom] = useState(false);

  const currentStage = detectStage();

  const applyStage = (stageKey: AgeStage) => {
    if (stageKey === 'custom') {
      setForceCustom(true);
      return;
    }
    setForceCustom(false);
    if (stageKey === 'all') {
      update({ minAge: undefined, maxAge: undefined });
      return;
    }
    const st = STAGES.find(x => x.key === stageKey);
    if (!st) return;
    update({ minAge: st.min, maxAge: st.max });
  };

  return (
    <div style={{
      padding: 'var(--pad-normal)',
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRight: '4px solid var(--purple)',
      borderRadius: 'var(--r-md)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--purple)' }}>
        🤖 قوانین خودکار
        <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>
          (فقط گله‌های منطبق عضو می‌شن)
        </span>
      </div>

      <Grid2>
        <Field label="نوع گله" hint={!rule.type ? 'مثلاً: تخم‌گذار — خالی = همه' : undefined}>
          <Select value={rule.type || ''} onChange={e => update({ type: e.target.value as FlockGroupRule['type'] || undefined })}>
            <option value="">همه</option>
            <option value="layer">تخم‌گذار</option>
            <option value="broiler">گوشتی</option>
            <option value="breeder">مادر</option>
          </Select>
        </Field>
        <Field label="نژاد" hint={!rule.breedId ? 'نژاد خاص — خالی = همه' : undefined}>
          <Select value={rule.breedId || ''} onChange={e => update({ breedId: e.target.value || undefined })}>
            <option value="">همه</option>
            {breeds.map(b => {
              const purposeMap: Record<string, string> = { layer: '🥚 تخم‌گذار', breeder: '🐣 مادر', broiler: '🍗 گوشتی', ornamental: '🌸 زینتی' };
              const purposeLabels = ((b as any).purposes || []).map((p: string) => purposeMap[p] || p);
              const label = purposeLabels.length > 0 ? `${b.name} — ${purposeLabels.join('، ')}` : b.name;
              return <option key={b.id} value={b.id}>{label}</option>;
            })}
          </Select>
        </Field>
      </Grid2>

      <Grid2>
        <Field label="سالن" hint={!rule.hallId ? 'محل نگهداری — خالی = همه' : undefined}>
          <Select value={rule.hallId || ''} onChange={e => update({ hallId: e.target.value || undefined })}>
            <option value="">همه</option>
            {halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </Select>
        </Field>
        <Field label="وضعیت" hint={!rule.status ? 'وضعیت گله — خالی = همه' : undefined}>
          <Select value={rule.status || ''} onChange={e => update({ status: e.target.value as FlockGroupRule['status'] || undefined })}>
            <option value="">همه</option>
            <option value="active">فعال</option>
            <option value="archived">آرشیو</option>
            <option value="sold">فروخته‌شده</option>
          </Select>
        </Field>
      </Grid2>

      <Grid2>
        <Field label="منبع" hint={!rule.source ? 'گله‌ها از کجا اومدن — خالی = همه' : undefined}>
          <Select value={rule.source || ''} onChange={e => update({ source: e.target.value || undefined })}>
            <option value="">همه</option>
            <option value="purchase">خریداری</option>
            <option value="hatch">جوجه‌کشی خودم</option>
            <option value="gift">اهدا</option>
          </Select>
        </Field>
        <Field label="مرحله زندگی" hint={currentStage === 'all' ? 'بدون محدودیت سنی — همه گله‌ها' : undefined}>
          <Select value={currentStage} onChange={e => applyStage(e.target.value as AgeStage)}>
            {STAGES.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </Select>
        </Field>
      </Grid2>

      {currentStage === 'custom' && (
        <Grid2>
          <Field label="سن از (روز)" hint={!rule.minAge ? 'حداقل سن (حداکثر ۶۰۰) — مثلاً: ۱۴۰' : undefined}>
            <Input
              value={typeof rule.minAge === 'number' ? toFa(rule.minAge) : ''}
              onChange={e => update({ minAge: parseAge(e.target.value) })}
              placeholder="—"
              inputMode="numeric"
              min={0}
              max={600}
              showWords={false}
            />
          </Field>
          <Field label="سن تا (روز)" hint={!rule.maxAge ? 'حداکثر سن (حداکثر ۶۰۰) — مثلاً: ۲۰۰' : undefined}>
            <Input
              value={typeof rule.maxAge === 'number' ? toFa(rule.maxAge) : ''}
              onChange={e => update({ maxAge: parseAge(e.target.value) })}
              placeholder="—"
              inputMode="numeric"
              min={0}
              max={600}
              showWords={false}
            />
          </Field>
        </Grid2>
      )}

      {ageConflict && (
        <div style={{
          padding: '6px 10px',
          background: 'var(--danger-soft)',
          border: '1px solid var(--danger)',
          borderRadius: 'var(--r-sm)',
          fontSize: 'var(--fs-xs)',
          color: 'var(--danger)',
          fontWeight: 600,
        }}>
          ⚠️ سن از ({rule.minAge}) باید کمتر از سن تا ({rule.maxAge}) باشه
        </div>
      )}

      <div style={{ fontSize: 10, color: 'var(--purple)', fontStyle: 'italic' }}>
        {Object.keys(rule).length === 0
          ? '⚠️ هیچ شرطی تعریف نشده — همه گله‌ها عضو می‌شن'
          : ageConflict
            ? '🔴 بازه سنی نامعتبر ئه (سن از باید کمتر از سن تا باشه)'
            : '✅ گله‌هایی که با همه شرط‌های بالا منطبق باشن، خودکار عضو می‌شن'}
      </div>
    </div>
  );
}
