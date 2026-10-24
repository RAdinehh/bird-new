/**
 * FlockDetailsSection.tsx — تاریخ‌ها + هزینه‌ها + واکسن + یادداشت
 */
import { Field, Grid2, MoneyField, Textarea, Select } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import { toFa } from '../../../shr/utils/fa';
import { jalaliBounds, checkDateBounds } from '../api/flocksCalc';
import { schedulesByType, getSchedule } from '../../cal/vaccineSchedules';
import type { F } from '../types-flocks';
import { FieldHint } from '../../../shr/intelligence';

interface Props {
  form: F;
  setForm: (updater: F | ((prev: F) => F)) => void;
  showError: (k: string) => string | undefined;
  markTouched: (k: string) => void;
  liveCosts: { bird: number; del: number; oth: number; total: number; per: number };
  vaccineEnabled: boolean;
  /** 🆕 اگه فاکتور/هچ لینک شده، تاریخ‌های منبع قفل می‌شن */
  isSourceLinked?: boolean;
}

const dividerStyle = { paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)' } as const;

export default function FlockDetailsSection({ form, setForm, showError, markTouched, liveCosts, vaccineEnabled, isSourceLinked }: Props) {
  return (
    <>
      <div style={dividerStyle}>📅 تاریخ‌ها</div>

      <Grid2>
        <Field
          label={isSourceLinked && form.hatchId ? <span>تاریخ هچ <span style={{ fontSize: 10, color: 'var(--warn)' }}>🔒</span></span> : 'تاریخ هچ'}
          hint={isSourceLinked && form.hatchId ? '🔒 از هچ — برای تغییر، لینک هچ را پاک کنید' : 'خروج جوجه از دستگاه'}
          error={showError('hatchDate')}
          onTouch={() => markTouched('hatchDate')}
        >
          <DatePicker value={form.hatchDate} onChange={v => !(isSourceLinked && form.hatchId) && setForm({ ...form, hatchDate: v })} placeholder="انتخاب" autoToday min={jalaliBounds(18).min} max={jalaliBounds(18).max} warn={checkDateBounds(form.hatchDate, jalaliBounds(18))} disabled={isSourceLinked && !!form.hatchId} />
        </Field>
        <Field
          label={isSourceLinked && form.sourceInvoiceId ? <span>تاریخ خرید <span style={{ fontSize: 10, color: 'var(--warn)' }}>🔒</span></span> : 'تاریخ خرید'}
          hint={isSourceLinked && form.sourceInvoiceId ? '🔒 از فاکتور — برای تغییر، لینک فاکتور را پاک کنید' : 'روزی که گله رسید'}
          error={showError('purchaseDate')}
          onTouch={() => markTouched('purchaseDate')}
        >
          <DatePicker value={form.purchaseDate} onChange={v => !(isSourceLinked && form.sourceInvoiceId) && setForm({ ...form, purchaseDate: v })} placeholder="انتخاب" autoToday min={jalaliBounds(18).min} max={jalaliBounds(18).max} warn={checkDateBounds(form.purchaseDate, jalaliBounds(18))} disabled={isSourceLinked && !!form.sourceInvoiceId} />
        </Field>
        
        <Field label="تاریخ شروع نگهداری" hint="اگه دقیق نمی‌دونی" error={showError('startDate')} onTouch={() => markTouched('startDate')}>
          <DatePicker value={form.startDate} onChange={v => setForm({ ...form, startDate: v })} placeholder="اختیاری" min={jalaliBounds(24).min} max={jalaliBounds(24).max} warn={checkDateBounds(form.startDate, jalaliBounds(24))} />
        </Field>
      </Grid2>

      <div style={dividerStyle}>💰 هزینه‌ها</div>
      <Grid2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
          <Field label={isSourceLinked && form.sourceInvoiceId ? <span>قیمت هر پرنده <span style={{ fontSize: 10, color: 'var(--warn)' }}>🔒</span></span> : 'قیمت هر پرنده'} hint={isSourceLinked && form.sourceInvoiceId ? '🔒 از فاکتور — برای تغییر، فاکتور را ویرایش کنید' : undefined} error={showError('purchasePrice')} onTouch={() => markTouched('purchasePrice')}>
            <MoneyField placeholder="۰" min={1000} max={5000000} disabled={isSourceLinked && !!form.sourceInvoiceId} value={form.purchasePrice} onChange={e => !(isSourceLinked && form.sourceInvoiceId) && setForm({ ...form, purchasePrice: e.target.value })} />
          </Field>
          <FieldHint fieldPath="flk.purchasePrice" value={form.purchasePrice} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
          <Field label={isSourceLinked && form.sourceInvoiceId ? <span>هزینه حمل <span style={{ fontSize: 10, color: 'var(--warn)' }}>🔒</span></span> : 'هزینه حمل'} hint={isSourceLinked && form.sourceInvoiceId ? '🔒 از فاکتور — برای تغییر، فاکتور را ویرایش کنید' : undefined} error={showError('deliveryCost')} onTouch={() => markTouched('deliveryCost')}>
            <MoneyField placeholder="۰" max={500000000} disabled={isSourceLinked && !!form.sourceInvoiceId} value={form.deliveryCost} onChange={e => !(isSourceLinked && form.sourceInvoiceId) && setForm({ ...form, deliveryCost: e.target.value })} />
          </Field>
          <FieldHint fieldPath="flk.deliveryCost" value={form.deliveryCost} />
        </div>
      </Grid2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
        <Field label="سایر هزینه‌ها" hint="واکسن اولیه، دارو، تجهیزات همراه" error={showError('otherCosts')} onTouch={() => markTouched('otherCosts')}>
          <MoneyField placeholder="۰" max={500000000} value={form.otherCosts} onChange={e => setForm({ ...form, otherCosts: e.target.value })} />
        </Field>
        <FieldHint fieldPath="flk.otherCosts" value={form.otherCosts} />
      </div>

      {liveCosts.total > 0 && (
        <div style={{ padding: 'var(--pad-comfy)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 'var(--fs-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
            <span>قیمت پرنده‌ها:</span>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>{toFa(liveCosts.bird.toLocaleString('fa-IR'))} ت</span>
          </div>
          {liveCosts.del > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
              <span>هزینه حمل:</span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{toFa(liveCosts.del.toLocaleString('fa-IR'))} ت</span>
            </div>
          )}
          {liveCosts.oth > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
              <span>سایر:</span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{toFa(liveCosts.oth.toLocaleString('fa-IR'))} ت</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--accent-border)', paddingTop: 6, marginTop: 2 }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>جمع کل:</span>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{toFa(liveCosts.total.toLocaleString('fa-IR'))} ت</span>
          </div>
          {liveCosts.per > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>💰 هر پرنده:</span>
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{toFa(Math.round(liveCosts.per).toLocaleString('fa-IR'))} ت</span>
            </div>
          )}
        </div>
      )}

      <div style={dividerStyle}>💉 برنامه واکسن</div>
      {vaccineEnabled && (
        <Field
          label="برنامه واکسن"
          hint={form.vaccineScheduleId ? undefined : 'اگه انتخاب کنی، واکسن‌ها خودکار به تقویم اضافه می‌شن'}
          autoFrom={form.vaccineScheduleId ? (() => {
            const sch = getSchedule(form.vaccineScheduleId);
            return sch ? `تقویم • ${sch.items.length} مرحله` : 'تقویم';
          })() : undefined}
        >
          <Select value={form.vaccineScheduleId} onChange={e => setForm({ ...form, vaccineScheduleId: e.target.value })}>
            <option value="">— بدون برنامه —</option>
            {schedulesByType(form.type as 'layer' | 'broiler' | 'breeder').map(sch => (
              <option key={sch.id} value={sch.id}>{sch.label}</option>
            ))}
          </Select>
        </Field>
      )}

      <div style={dividerStyle}>📝 یادداشت</div>
      <Field label="یادداشت">
        <Textarea placeholder="..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
      </Field>
    </>
  );
}
