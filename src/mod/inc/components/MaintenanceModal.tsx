/**
 * MaintenanceModal.tsx — ثبت رکورد تعمیر برای دستگاه
 */
import { Btn, BtnRow, Field, Input, Modal, MoneyField, Textarea } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';

export interface MaintForm {
  date: string;
  type: string;
  cost: string;
  description: string;
}

export interface MaintenanceModalProps {
  open: boolean;
  form: MaintForm;
  setForm: (f: MaintForm) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function MaintenanceModal(props: MaintenanceModalProps) {
  const { open, form, setForm, onSave, onClose } = props;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="ثبت تعمیر"
      footer={
        <BtnRow>
          <Btn variant="primary" onClick={onSave}>ذخیره</Btn>
          <Btn onClick={onClose}>لغو</Btn>
        </BtnRow>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Field label="تاریخ" required>
          <DatePicker value={form.date} onChange={v => setForm({ ...form, date: v })} autoToday />
        </Field>
        <Field label="نوع تعمیر" required>
          <Input
            placeholder="تعویض فن..."
            value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value })}
          />
        </Field>
        <Field label="هزینه">
          <MoneyField
            placeholder="۰"
            value={form.cost}
            onChange={e => setForm({ ...form, cost: e.target.value })}
          />
        </Field>
        <Field label="توضیحات">
          <Textarea
            placeholder="جزئیات..."
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
        </Field>
      </div>
    </Modal>
  );
}
