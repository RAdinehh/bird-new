/**
 * SmartRuleEditor.tsx — ویرایشگر قانون گروه هوشمند
 * جدا شده از GroupsPage.tsx
 */
import { Select, Field, Input, Grid2 } from '../../../shr/components/ui';
import type { FlockGroupRule, FlockGroupType, FlockStatus } from '../store';

export interface SmartRuleEditorProps {
  rule: FlockGroupRule;
  onChange: (rule: FlockGroupRule) => void;
  breeds: Array<{ id: string; name: string; birdId: string }>;
  halls: Array<{ id: string; name: string }>;
}

export function SmartRuleEditor({ rule, onChange, breeds, halls }: SmartRuleEditorProps) {
  const update = (patch: Partial<FlockGroupRule>) => {
    const next: FlockGroupRule = { ...rule, ...patch };
    // حذف فیلدهای خالی
    Object.keys(next).forEach(k => {
      const v = (next as Record<string, unknown>)[k];
      if (v === '' || v === undefined || v === null) {
        delete (next as Record<string, unknown>)[k];
      }
    });
    onChange(next);
  };

  return (
    <div style={{
      padding: 'var(--pad-normal)',
      background: 'var(--purple-soft)',
      border: '1px solid var(--purple)',
      borderRadius: 'var(--r-md)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--purple)' }}>
        🤖 قوانین خودکار
        <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>
          (فقط گله‌های منطبق عضو می‌شن)
        </span>
      </div>

      <Field label="نوع گله">
        <Select value={rule.type || ''} onChange={e => update({ type: e.target.value as FlockGroupRule['type'] || undefined })}>
          <option value="">همه</option>
          <option value="layer">تخم‌گذار</option>
          <option value="broiler">گوشتی</option>
          <option value="breeder">مادر</option>
        </Select>
      </Field>

      <Field label="نژاد">
        <Select value={rule.breedId || ''} onChange={e => update({ breedId: e.target.value || undefined })}>
          <option value="">همه</option>
          {breeds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </Select>
      </Field>

      <Field label="سالن">
        <Select value={rule.hallId || ''} onChange={e => update({ hallId: e.target.value || undefined })}>
          <option value="">همه</option>
          {halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
        </Select>
      </Field>

      <Field label="وضعیت">
        <Select value={rule.status || ''} onChange={e => update({ status: e.target.value as FlockGroupRule['status'] || undefined })}>
          <option value="">همه</option>
          <option value="active">فعال</option>
          <option value="archived">آرشیو</option>
          <option value="sold">فروخته‌شده</option>
        </Select>
      </Field>

      <Field label="منبع">
        <Select value={rule.source || ''} onChange={e => update({ source: e.target.value || undefined })}>
          <option value="">همه</option>
          <option value="purchase">خریداری</option>
          <option value="hatch">جوجه‌کشی خودم</option>
          <option value="gift">اهدا</option>
        </Select>
      </Field>

      <Grid2>
        <Field label="سن از (روز)">
          <Input
            value={rule.minAge || ''}
            onChange={e => update({ minAge: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="—"
            inputMode="numeric"
          />
        </Field>
        <Field label="سن تا (روز)">
          <Input
            value={rule.maxAge || ''}
            onChange={e => update({ maxAge: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="—"
            inputMode="numeric"
          />
        </Field>
      </Grid2>

      <div style={{ fontSize: 10, color: 'var(--purple)', fontStyle: 'italic' }}>
        {Object.keys(rule).length === 0
          ? '⚠️ هیچ شرطی تعریف نشده — همه گله‌ها عضو می‌شن'
          : '✅ گله‌هایی که با همه شرط‌های بالا منطبق باشن، خودکار عضو می‌شن'}
      </div>
    </div>
  );
}
