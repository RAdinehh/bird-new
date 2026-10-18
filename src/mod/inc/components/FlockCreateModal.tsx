/**
 * FlockCreateModal.tsx — ساخت گله‌ی جدید از نتیجه‌ی هچ
 */
import { Btn, BtnRow, Field, Grid2, Input, Modal, Select } from '../../../shr/components/ui';
import { toFa } from '../../../shr/utils/fa';

export interface FlockForm {
  name: string;
  type: string;
  hallId: string;
  zoneId: string;
  // 🆕 editable overrides (پیش‌فرض از هچ/تخم)
  maleCount?: string;
  femaleCount?: string;
  unknownCount?: string;
  unitPrice?: string;
  shippingCost?: string;
  layingStartDay?: string;
}

/** 🆕 داده‌های منبع (هچ + تخم) */
export interface FlockSourceData {
  maleCount?: number | null;
  femaleCount?: number | null;
  unknownCount?: number | null;
  unitPrice?: number | null;
  shippingCost?: number | null;
  layingStartDay?: number | null;
  eggCount?: number | null;
}

export interface FlockCreateModalProps {
  open: boolean;
  count: number;
  form: FlockForm;
  setForm: (f: FlockForm) => void;
  halls: { id: string; name: string }[];
  zones: { id: string; name: string; hallId: string }[];
  /** 🆕 داده‌های منبع برای نمایش + محاسبه */
  sourceData?: FlockSourceData;
  onCreate: () => void;
  onClose: () => void;
}

export default function FlockCreateModal(props: FlockCreateModalProps) {
  const { open, count, form, setForm, halls, zones, sourceData, onCreate, onClose } = props;

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

      {sourceData && (sourceData.maleCount || sourceData.femaleCount || sourceData.unknownCount) ? (
        <>
          <div style={{ padding: 8, background: 'var(--accent-soft)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 600, marginTop: 4, marginBottom: 6 }}>
            🔹 جنسیت از نتیجه هچ — در صورت نیاز اصلاح کنید
          </div>
          <Grid2>
            <Field label="نر">
              <Input type="text" inputMode="numeric" placeholder="۰" value={form.maleCount ?? ''} onChange={e => setForm({ ...form, maleCount: e.target.value })} />
            </Field>
            <Field label="ماده">
              <Input type="text" inputMode="numeric" placeholder="۰" value={form.femaleCount ?? ''} onChange={e => setForm({ ...form, femaleCount: e.target.value })} />
            </Field>
          </Grid2>
          <Field label="نامشخص" hint="پرنده‌هایی که جنسیتشان معلوم نیست">
            <Input type="text" inputMode="numeric" placeholder="۰" value={form.unknownCount ?? ''} onChange={e => setForm({ ...form, unknownCount: e.target.value })} />
          </Field>
        </>
      ) : null}

      {sourceData && sourceData.unitPrice ? (
        <>
          <div style={{ padding: 8, background: 'var(--warn-soft)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--warn)', fontWeight: 600, marginTop: 4, marginBottom: 6 }}>
            💰 هزینه‌های تخم خریداری‌شده
          </div>
          <Grid2>
            <Field label="قیمت هر تخم (تومان)">
              <Input type="text" inputMode="numeric" dir="ltr" placeholder="۰" value={form.unitPrice ?? ''} onChange={e => setForm({ ...form, unitPrice: e.target.value })} />
            </Field>
            <Field label="هزینه حمل (تومان)">
              <Input type="text" inputMode="numeric" dir="ltr" placeholder="۰" value={form.shippingCost ?? ''} onChange={e => setForm({ ...form, shippingCost: e.target.value })} />
            </Field>
          </Grid2>
          {(() => {
            const eggCount = sourceData.eggCount || 0;
            const hatched = count || 0;
            const uPrice = parseFloat(form.unitPrice || '0') || 0;
            const shipCost = parseFloat(form.shippingCost || '0') || 0;
            const totalCost = uPrice * eggCount + shipCost;
            const perChick = hatched > 0 ? Math.round(totalCost / hatched) : 0;
            return (
              <div style={{ padding: 10, background: 'var(--input-bg)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.8 }}>
                <div>🧮 محاسبه: ({toFa(eggCount)} تخم × {toFa(uPrice.toLocaleString('fa-IR'))} ت) + {toFa(shipCost.toLocaleString('fa-IR'))} ت حمل</div>
                <div style={{ color: 'var(--accent)', fontWeight: 700, marginTop: 4 }}>
                  ➜ میانگین قیمت هر جوجه: {toFa(perChick.toLocaleString('fa-IR'))} تومان
                </div>
              </div>
            );
          })()}
        </>
      ) : null}

      {sourceData && sourceData.layingStartDay ? (
        <Field label="سن شروع تخم‌گذاری (روز)" hint="🔹 از استاندارد نژاد — قابل ویرایش">
          <Input type="text" inputMode="numeric" placeholder="۰" value={form.layingStartDay ?? ''} onChange={e => setForm({ ...form, layingStartDay: e.target.value })} />
        </Field>
      ) : null}
    </Modal>
  );
}
