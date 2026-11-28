/**
 * DiscardFormModal — فرم ثبت دور ریخت تخم
 *
 * برای تخم‌هایی که فروخته نمی‌شوند و دور ریخته می‌شوند:
 * شکسته/نرم/کثیف
 */
import { Btn, BtnRow, Field, Grid2, Modal, NumField, Select, Textarea, ErrorBox } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import SmartSelect from '../../../shr/components/SmartSelect';
import type { EggDiscard, EggDiscardType, EggDiscardReason } from '../store';

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  form: {
    date: string;
    type: EggDiscardType;
    count: string;
    reason: EggDiscardReason;
    notes: string;
  };
  setForm: (f: any) => void;
  err: string;
  onSave: () => void;
}

const TYPE_LABELS: Record<EggDiscardType, string> = {
  broken: 'شکسته',
  soft: 'نرم',
  dirty: 'کثیف',
};

const REASON_LABELS: Record<EggDiscardReason, string> = {
  rotten: 'فاسد شده',
  broken_handling: 'شکستن در جابجایی',
  expired: 'تاریخ گذشته',
  contaminated: 'آلوده',
  other: 'سایر',
};

export default function DiscardFormModal(props: Props) {
  const { open, setOpen, form, setForm, err, onSave } = props;

  const num = (s: string) => parseInt(s || '0') || 0;

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="🗑 ثبت دور ریخت تخم"
      footer={
        <BtnRow>
          <Btn variant="primary" onClick={onSave}>ذخیره</Btn>
          <Btn onClick={() => setOpen(false)}>لغو</Btn>
        </BtnRow>
      }
    >
      <Grid2>
        <Field label="تاریخ" required>
          <DatePicker
            value={form.date}
            onChange={v => setForm({ ...form, date: v })}
            autoToday
          />
        </Field>
        <Field label="نوع" required>
          <SmartSelect
            value={form.type}
            modalTitle="نوع تخم"
            options={[
              { value: 'broken', label: TYPE_LABELS.broken, icon: 'broken_egg' },
              { value: 'soft', label: TYPE_LABELS.soft, icon: 'soft_egg' },
              { value: 'dirty', label: TYPE_LABELS.dirty, icon: 'dirty_egg' },
            ]}
            onChange={v => setForm({ ...form, type: v as EggDiscardType })}
          />
        </Field>
      </Grid2>

      <Grid2>
        <Field label="تعداد" required>
          <NumField
            placeholder="۰"
            value={form.count}
            onChange={e => setForm({ ...form, count: e.target.value })}
            unit="عدد"
            min={0}
          />
        </Field>
        <Field label="دلیل" required>
          <SmartSelect
            value={form.reason}
            modalTitle="دلیل دور ریخت"
            options={[
              { value: 'rotten', label: REASON_LABELS.rotten, icon: 'rotten_egg' },
              { value: 'broken_handling', label: REASON_LABELS.broken_handling, icon: 'broken_egg' },
              { value: 'expired', label: REASON_LABELS.expired, icon: '⏳' },
              { value: 'contaminated', label: REASON_LABELS.contaminated, icon: 'cause_disease' },
              { value: 'other', label: REASON_LABELS.other, icon: 'other' },
            ]}
            onChange={v => setForm({ ...form, reason: v as EggDiscardReason })}
          />
        </Field>
      </Grid2>

      <Field label="یادداشت">
        <Textarea
          rows={2}
          placeholder="توضیحات"
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
        />
      </Field>

      {num(form.count) > 0 && (
        <div style={{
          padding: 'var(--pad-normal)',
          background: 'var(--warn-soft)',
          border: '1px solid var(--warn)',
          borderRadius: 'var(--r-md)',
          fontSize: 'var(--fs-sm)',
          color: 'var(--warn)',
          fontWeight: 600,
        }}>
          ⚠️ {num(form.count)} تخم {TYPE_LABELS[form.type]} از موجودی کم می‌شود
        </div>
      )}

      {err && <ErrorBox>{err}</ErrorBox>}
    </Modal>
  );
}
