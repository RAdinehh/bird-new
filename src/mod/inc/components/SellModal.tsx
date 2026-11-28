/**
 * SellModal.tsx — ثبت فروش جوجه از نتیجه‌ی هچ
 */
import { useFormat } from '../../../shr/units/useFormat';

import { toFa, toEn } from '../../../shr/utils/fa';
import {
  Btn, BtnRow, ErrorBox, Field, Grid2, Modal, MoneyField, NumField, Select,
} from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import SmartSelect from '../../../shr/components/SmartSelect';

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
  err?: string;
}

export default function SellModal(props: SellModalProps) {
  const fmt = useFormat();
  const { open, maxCount, form, setForm, contacts, onSell, onClose, err } = props;

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
      {err && <ErrorBox>{err}</ErrorBox>}
      <Field label="خریدار" required>
        {customers.length === 0 ? (
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', padding: 10, textAlign: 'center' }}>
            مخاطبی نیست
          </div>
        ) : (
          <SmartSelect
            value={form.buyerId}
            placeholder="— انتخاب خریدار —"
            modalTitle="انتخاب خریدار"
            options={customers.map(c => ({ value: c.id, label: c.name, icon: '👤' }))}
            onChange={v => setForm({ ...form, buyerId: v })}
          />
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
          <span>{fmt.money(total)}</span>
        </div>
      )}
    </Modal>
  );
}
