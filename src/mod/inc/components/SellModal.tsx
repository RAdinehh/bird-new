/**
 * SellModal.tsx — ثبت فروش جوجه از نتیجه‌ی هچ
 */
import { toFa, toEn } from '../../../shr/utils/fa';
import {
  Btn, BtnRow, Field, Grid2, Modal, MoneyField, NumField, Select,
} from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';

export interface SellForm {
  buyerId: string;
  count: string;
  unitPrice: string;
  date: string;
}

export interface SellModalProps {
  open: boolean;
  maxCount: number;
  form: SellForm;
  setForm: (f: SellForm) => void;
  contacts: { id: string; name: string; roles?: string[] }[];
  onSell: () => void;
  onClose: () => void;
}

export default function SellModal(props: SellModalProps) {
  const { open, maxCount, form, setForm, contacts, onSell, onClose } = props;

  const customers = contacts.filter(c => (c.roles || []).includes('customer'));

  const cnt = parseInt(toEn(form.count)) || 0;
  const up = parseFloat(toEn(form.unitPrice).replace('٫', '.')) || 0;
  const total = cnt * up;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="📥 ثبت فروش جوجه"
      footer={
        <BtnRow>
          <Btn variant="primary" onClick={onSell}>ثبت فاکتور</Btn>
          <Btn onClick={onClose}>لغو</Btn>
        </BtnRow>
      }
    >
      <Field label="خریدار" required>
        {customers.length === 0 ? (
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', padding: 10, textAlign: 'center' }}>
            مخاطبی نیست
          </div>
        ) : (
          <Select
            value={form.buyerId}
            onChange={e => setForm({ ...form, buyerId: e.target.value })}
          >
            <option value="">— انتخاب خریدار —</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        )}
      </Field>
      <Grid2>
        <Field label="تعداد" required>
          <NumField
            value={form.count}
            onChange={e => setForm({ ...form, count: e.target.value })}
            max={maxCount} min={0} unit="عدد"
          />
        </Field>
        <Field label="قیمت هر جوجه" required>
          <MoneyField
            value={form.unitPrice}
            onChange={e => setForm({ ...form, unitPrice: e.target.value })}
          />
        </Field>
      </Grid2>
      <Field label="تاریخ">
        <DatePicker
          value={form.date}
          onChange={v => setForm({ ...form, date: v })}
          autoToday
        />
      </Field>
      {total > 0 && (
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          padding: 'var(--pad-normal)',
          background: 'var(--accent-soft)',
          color: 'var(--accent)',
          borderRadius: 'var(--r-sm)',
          fontWeight: 700,
        }}>
          <span>💰 جمع کل:</span>
          <span>{toFa(total.toLocaleString('fa-IR'))} ت</span>
        </div>
      )}
    </Modal>
  );
}
