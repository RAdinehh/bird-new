/**
 * FlockCreateModal.tsx — ساخت گله‌ی جدید از نتیجه‌ی هچ
 */
import { Btn, BtnRow, Field, Grid2, Input, Modal, Select } from '../../../shr/components/ui';

export interface FlockForm {
  name: string;
  type: string;
  hallId: string;
  zoneId: string;
}

export interface FlockCreateModalProps {
  open: boolean;
  count: number;
  form: FlockForm;
  setForm: (f: FlockForm) => void;
  halls: { id: string; name: string }[];
  zones: { id: string; name: string; hallId: string }[];
  onCreate: () => void;
  onClose: () => void;
}

export default function FlockCreateModal(props: FlockCreateModalProps) {
  const { open, count, form, setForm, halls, zones, onCreate, onClose } = props;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="🐔 ساخت گله جدید"
      footer={
        <BtnRow>
          <Btn variant="primary" onClick={onCreate}>ساخت گله</Btn>
          <Btn onClick={onClose}>لغو</Btn>
        </BtnRow>
      }
    >
      <Field label="نام گله" required>
        <Input
          placeholder="مثلاً — گله بهار ۱۴۰۵"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
      </Field>
      <Grid2>
        <Field label="نوع" required>
          <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="layer">تخم‌گذار</option>
            <option value="broiler">گوشتی</option>
            <option value="breeder">مادر</option>
          </Select>
        </Field>
        <Field label="تعداد">
          <Input placeholder="مثلاً — ۱۰۰" value={String(count || 0)} readOnly dir="ltr" unit="پرنده" />
        </Field>
      </Grid2>
      <Grid2>
        <Field label="سالن">
          <Select
            value={form.hallId}
            onChange={e => setForm({ ...form, hallId: e.target.value, zoneId: '' })}
          >
            <option value="">—</option>
            {halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </Select>
        </Field>
        <Field label="بخش">
          <Select
            value={form.zoneId}
            onChange={e => setForm({ ...form, zoneId: e.target.value })}
          >
            <option value="">—</option>
            {zones.filter(z => !form.hallId || z.hallId === form.hallId)
              .map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
          </Select>
        </Field>
      </Grid2>
    </Modal>
  );
}
