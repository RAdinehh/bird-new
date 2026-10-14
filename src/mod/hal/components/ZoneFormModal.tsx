/**
 * ZoneFormModal — مودال فرم بخش (Zone)
 * استخراج‌شده از ZonesPage طبق FOUNDATION ۳.۳ (فایل ≤ ۴۰۰ خط)
 */
import { Btn, BtnRow, ErrorBox, Field, Grid2, Input, Modal, NumField, Textarea } from '../../../shr/components/ui';
import SmartSelect from '../../../shr/components/SmartSelect';
import type { Hall } from '../store';

interface ZoneFormData {
  id: string;
  hallId: string;
  name: string;
  capacity: string;
  notes: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  form: ZoneFormData;
  setForm: React.Dispatch<React.SetStateAction<ZoneFormData>>;
  err: string;
  vErrors: Record<string, any>;
  crossWarn?: string | null;
  halls: Hall[];
  birds: Array<{ id: string; name: string }>;
  breeds: Array<{ id: string; name: string }>;
  save: () => void;
  /** 🆕 پاک کردن خطا هنگام تایپ */
  onErrorClear?: () => void;
}

export default function ZoneFormModal({
  open, onClose, form, setForm, err, vErrors, crossWarn, halls, birds, breeds, save, onErrorClear,
}: Props) {
  const isEdit = !!form.id;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'ویرایش بخش' : 'افزودن بخش'}
      footer={
        <BtnRow>
          <Btn variant="primary" onClick={save} disabled={Object.keys(vErrors).length > 0}>ذخیره</Btn>
          <Btn onClick={onClose}>لغو</Btn>
        </BtnRow>
      }
    >
      <Field label="سالن" required hint="سالنی که این بخش داخلش تعریف می‌شود">
        <SmartSelect
          value={form.hallId}
          onChange={v => setForm((f) => ({ ...f, hallId: v }))}
          options={halls.map(c => ({ value: c.id, label: c.name }))}
          placeholder="— انتخاب کنید —"
          modalTitle="انتخاب سالن"
          autoThreshold={6}
        />
      </Field>

      {form.hallId && (() => {
        const hall = halls.find((h: Hall) => h.id === form.hallId);
        const hallBird = hall?.birdId ? birds.find((b) => b.id === hall.birdId) : null;
        const hallBreed = hall?.breedId ? breeds.find((b) => b.id === hall.breedId) : null;
        if (!hallBird && !hallBreed) return null;
        return (
          <div style={{
            fontSize: 'var(--fs-xs)', color: 'var(--muted)',
            padding: '6px 10px', background: 'var(--input-bg)',
            border: '1px dashed var(--border)', borderRadius: 'var(--r-sm)',
            display: 'flex', alignItems: 'center', gap: 6,
            lineHeight: 1.6, marginTop: -4,
          }}>
            <span style={{ fontSize: 'var(--fs-sm)' }}>📋</span>
            <span>
              ارثی از سالن:
              {hallBird ? ` 🐔 ${hallBird.name}` : ''}
              {hallBreed ? ` · 🧬 ${hallBreed.name}` : ''}
            </span>
          </div>
        );
      })()}

      <Grid2>
        <Field label="نام بخش" required>
          <Input
            placeholder="مثلاً — بخش A"
            value={form.name}
            onChange={e => { onErrorClear?.(); setForm({ ...form, name: e.target.value }); }}
          />
        </Field>
        <Field label="ظرفیت" hint="حداکثر تعداد پرنده در این بخش (اختیاری)">
          <NumField
            placeholder="۰"
            value={form.capacity}
            onChange={e => setForm({ ...form, capacity: e.target.value })}
            unit="پرنده"
            min={0}
            max={100000}
            autoClamp
          />
          {crossWarn && (
            <div style={{
              fontSize: 'var(--fs-xs)', color: 'var(--warn)', fontWeight: 700,
              paddingRight: 4, lineHeight: 1.5, display: 'flex',
              alignItems: 'center', gap: 4, marginTop: 4,
            }}>
              ⚠️ {crossWarn}
            </div>
          )}
        </Field>
      </Grid2>

      <Field label="یادداشت">
        <Textarea
          placeholder="..."
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
        />
      </Field>

      <ErrorBox>{err}</ErrorBox>
    </Modal>
  );
}
