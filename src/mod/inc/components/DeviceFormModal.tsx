/**
 * DeviceFormModal — فرم افزودن/ویرایش دستگاه
 */
import { toFa, toEn } from '../../../shr/utils/fa';
import {
  Btn, BtnRow, ErrorBox, Field, Grid2, Input, MoneyField, Modal,
  NumField, SectionTitle, Select,
} from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import type { DeviceMode, DeviceStatus } from '../store';
import type { F } from '../types-devices';
import { warrantyInfo } from '../api/warranty';
import CapacityEditor from './CapacityEditor';

export interface DeviceFormModalProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  form: F;
  setForm: React.Dispatch<React.SetStateAction<F>>;
  err: string;
  vErrors: Record<string, string>;
  devices: any[];
  birds: any[];

  save: () => void;
}

export default function DeviceFormModal(props: DeviceFormModalProps) {
  const { open, setOpen, form, setForm, err, vErrors, devices, birds, save } = props;
  const warrantyForm = warrantyInfo(form.purchasedAt, parseInt(toEn(form.warranty)) || null);

  return (
      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'ویرایش دستگاه' : 'افزودن دستگاه'}
        footer={<BtnRow><Btn variant="primary" onClick={save} disabled={Object.keys(vErrors).length > 0}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}>

        <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📋</span> مشخصات اصلی</SectionTitle>
        <Field label="نام دستگاه" required hint={
          form.name && devices.some(x => x.id !== form.id && x.name.trim() === form.name.trim())
            ? '⚠️ این نام قبلاً استفاده شده'
            : undefined
        }>
          <Input
            placeholder="مثلاً — دستگاه ۱"
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            error={form.name && devices.some(x => x.id !== form.id && x.name.trim() === form.name.trim()) ? ' ' : undefined}
          />
        </Field>
        <Grid2>
          <Field label="حالت" required>
            <Select value={form.mode} onChange={e => setForm({...form, mode: e.target.value as DeviceMode})}>
              <option value="setter">ستر</option>
              <option value="hatcher">هچر</option>
              <option value="setter+hatcher">ستر + هچر</option>
            </Select>
          </Field>
          <Field label="وضعیت" required>
            <Select value={form.status} onChange={e => setForm({...form, status: e.target.value as DeviceStatus})}>
              <option value="active">✅ فعال</option>
              <option value="idle">⏸ غیرفعال</option>
              <option value="maintenance"><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>🔧</span> تعمیر</option>
              <option value="broken">❌ خراب</option>
            </Select>
          </Field>
        </Grid2>

        <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📊</span> ظرفیت بر اساس پرنده</SectionTitle>
        <CapacityEditor
          birds={birds}
          capacityByBird={form.capacityByBird}
          onChange={(next: any) => setForm(f => ({ ...f, capacityByBird: next }))}
        />

        <SectionTitle>⚙ مشخصات فنی</SectionTitle>
        <Grid2>
          <Field label="تعداد راگ" hint="قفسه">
            <NumField placeholder="۰" value={form.racks} onChange={e => setForm({...form, racks: e.target.value})} unit="عدد" min={0} />
          </Field>
          <Field label="تعداد سبد" hint="Tray">
            <NumField placeholder="۰" value={form.trays} onChange={e => setForm({...form, trays: e.target.value})} unit="عدد" min={0} />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="تعداد فن">
            <NumField placeholder="۰" value={form.fans} onChange={e => setForm({...form, fans: e.target.value})} unit="عدد" min={0} />
          </Field>
          <Field label="توان موتور">
            <NumField placeholder="۰" value={form.motorPower} onChange={e => setForm({...form, motorPower: e.target.value})} unit="W" min={0} />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="سنسور دما">
            <NumField placeholder="۰" value={form.tempSensors} onChange={e => setForm({...form, tempSensors: e.target.value})} unit="عدد" min={0} />
          </Field>
          <Field label="سنسور رطوبت">
            <NumField placeholder="۰" value={form.humiditySensors} onChange={e => setForm({...form, humiditySensors: e.target.value})} unit="عدد" min={0} />
          </Field>
        </Grid2>

        <SectionTitle>🌡 پایش زنده</SectionTitle>
        <Grid2>
          <Field label="EST فعلی" hint="دمای پوسته تخم">
            <NumField placeholder="۳۷.۸" value={form.estCurrent} onChange={e => setForm({...form, estCurrent: e.target.value})} unit="°C" min={30} max={45} />
          </Field>
          <Field label="CO₂ فعلی">
            <NumField placeholder="۰.۴" value={form.co2Current} onChange={e => setForm({...form, co2Current: e.target.value})} unit="٪" min={0} max={5} />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="O₂ فعلی">
            <NumField placeholder="۲۰.۹" value={form.o2Current} onChange={e => setForm({...form, o2Current: e.target.value})} unit="٪" min={15} max={25} />
          </Field>
          <Field label="دما محیط">
            <NumField placeholder="۳۷.۵" value={form.temp} onChange={e => setForm({...form, temp: e.target.value})} unit="°C" min={30} max={45} />
          </Field>
        </Grid2>

        <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>💰</span> مالی</SectionTitle>
        <Grid2>
          <Field label="قیمت خرید">
            <MoneyField placeholder="۰" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
          </Field>
          <Field label="تاریخ خرید">
            <DatePicker value={form.purchasedAt} onChange={v => setForm({...form, purchasedAt: v})}  autoToday />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="گارانتی (ماه)">
            <NumField placeholder="۲۴" value={form.warranty} onChange={e => setForm({...form, warranty: e.target.value})} unit="ماه" min={0} max={120} />
          </Field>
          <Field label="هزینه جانبی" hint="نصب، حمل">
            <MoneyField placeholder="۰" value={form.extraCost} onChange={e => setForm({...form, extraCost: e.target.value})} />
          </Field>
        </Grid2>
        {warrantyForm && (
          <div style={{ padding: 'var(--pad-normal)', background: warrantyForm.expired ? 'var(--danger-soft)' : 'var(--accent-soft)', border: '1px solid ' + (warrantyForm.expired ? 'var(--danger)' : 'var(--accent-border)'), borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', color: warrantyForm.expired ? 'var(--danger)' : 'var(--accent)', fontWeight: 700, textAlign: 'center' }}>
            {warrantyForm.expired ? '⏰ گارانتی تمام شده — ' : '✅ گارانتی تا — '}{toFa(warrantyForm.end)}
          </div>
        )}

        <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📝</span> یادداشت</SectionTitle>
        <Input placeholder="..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />

        <ErrorBox>{err}</ErrorBox>
      </Modal>
  );
}
