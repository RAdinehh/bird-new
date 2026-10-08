/**
 * ProductionFormModal — فرم افزودن/ویرایش تولید تخم
 */
import { Btn, BtnRow, Field, Grid2, Modal, NumField, Select, Textarea, ErrorBox } from '../../../shr/components/ui';
import { SectionTitle } from '../helpers';
import DatePicker from '../../../shr/components/DatePicker';
import SmartSelect from '../../../shr/components/SmartSelect';
import { toFa, toEn } from '../../../shr/utils/fa';

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  form: any;
  setForm: any;
  err: string;
  vErrors: Record<string, string>;
  activeFlocks: any[];
  flockCount: number;
  onSave: () => void;
}

export default function ProductionFormModal(props: Props) {
  const { open, setOpen, form, setForm, err, vErrors, activeFlocks, flockCount, onSave } = props;

  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || null : null;
  
  const int = (s: any) => { const v = parseInt(toEn(String(s || ''))); return isNaN(v) ? 0 : v; };
  const healthy = int(form.eatingCount) + int(form.fertileCount);
  const totalEggs = healthy + int(form.brokenCount) + int(form.softCount) + int(form.dirtyCount);
  const selectedFlock = activeFlocks.find((f: any) => f.id === form.flockId);
  const liveRate = flockCount > 0 ? Math.round((healthy / flockCount) * 100) : 0;
  const liveErrors = (() => {
    const errs: { field: string; msg: string }[] = [];
    const e = int(form.eatingCount);
    const f = int(form.fertileCount);
    const b = int(form.brokenCount);
    const s = int(form.softCount);
    const d = int(form.dirtyCount);
    if (e < 0 || f < 0 || b < 0 || s < 0 || d < 0) errs.push({ field: 'all', msg: 'مقادیر منفی مجاز نیست' });
    if (flockCount > 0 && (e + f) > flockCount) errs.push({ field: 'healthy', msg: `مجموع سالم از تعداد گله بیشتره` });
    if (e > 0 && e > flockCount) errs.push({ field: 'eating', msg: 'تخم خوراکی از تعداد گله بیشتره' });
    if (f > 0 && f > flockCount) errs.push({ field: 'fertile', msg: 'تخم نطفه‌دار از تعداد گله بیشتره' });
    return errs;
  })();
  const fertilePercent = healthy > 0 ? Math.round((int(form.fertileCount) / healthy) * 100) : 0;
  const eatingPercent = healthy > 0 ? Math.round((int(form.eatingCount) / healthy) * 100) : 0;

  return (
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? 'ویرایش تخم‌گذاری' : 'ثبت تخم‌گذاری'}
        footer={<BtnRow><Btn variant="primary" onClick={onSave}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}
      >
        <Grid2>
          <Field label="گله" required>
            <Select value={form.flockId} onChange={(e: any) => setForm({ ...form, flockId: e.target.value })}>
              {activeFlocks.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </Select>
          </Field>
          <Field label="تاریخ" required>
            <DatePicker value={form.date} onChange={v => setForm({ ...form, date: v })}  autoToday />
          </Field>
        </Grid2>

        {flockCount > 0 ? (
          <div style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 600, textAlign: 'center' }}>
            تعداد گله: {toFa(flockCount)} پرنده
          </div>
        ) : null}

        <SectionTitle>🥚 تخم‌گذاری</SectionTitle>

        <Grid2>
          <Field label="🥚 تخم خوراکی">
            <NumField placeholder="مثلاً — ۴۰" value={form.eatingCount} onChange={(e: any) => setForm({ ...form, eatingCount: e.target.value })} unit="عدد" min={0} integer />
          </Field>
          <Field label="🌱 تخم نطفه‌دار" error={vErrors.fertileCount}>
            <NumField placeholder="مثلاً — ۱۰" value={form.fertileCount} onChange={(e: any) => setForm({ ...form, fertileCount: e.target.value })} unit="عدد" min={0} integer />
          </Field>
        </Grid2>

        {(int(form.eatingCount) > 0 || int(form.fertileCount) > 0) && (
          <div style={{ padding: 'var(--pad-normal)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 600, lineHeight: 1.7, textAlign: 'center' }}>
            📊 ترکیب سالم: <b>{toFa(eatingPercent)}٪ خوراکی</b> · <b>{toFa(fertilePercent)}٪ نطفه‌دار</b>
          </div>
        )}

        {/* خطاهای زنده */}
        {liveErrors.length > 0 && (
          <div style={{ padding: 'var(--pad-normal)', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {liveErrors.map((er: any, i: number) => (
              <div key={i} style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>⚠️</span>
                <span>{er.msg}</span>
              </div>
            ))}
          </div>
        )}

                <Grid2>
          <Field label="تخم شکسته" error={vErrors.brokenCount}>
            <NumField placeholder="مثلاً — ۵" value={form.brokenCount} onChange={(e: any) => setForm({ ...form, brokenCount: e.target.value })} unit="عدد" min={0} integer />
          </Field>
          <Field label="تخم نرم" error={vErrors.softCount}>
            <NumField placeholder="مثلاً — ۲" value={form.softCount} onChange={(e: any) => setForm({ ...form, softCount: e.target.value })} unit="عدد" min={0} integer />
          </Field>
        </Grid2>
        <Field label="تخم کثیف" error={vErrors.dirtyCount}>
          <NumField placeholder="مثلاً — ۳" value={form.dirtyCount} onChange={(e: any) => setForm({ ...form, dirtyCount: e.target.value })} unit="عدد" min={0} integer />
        </Field>

        {totalEggs > 0 ? (
          <div style={{ padding: 'var(--pad-normal)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
              <span style={{ color: 'var(--muted)' }}>🥚 تخم سالم:</span>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{toFa(healthy)}</span>
            </div>
            {int(form.brokenCount) > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
                <span style={{ color: 'var(--muted)' }}>💔 شکسته:</span>
                <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{toFa(int(form.brokenCount))}</span>
              </div>
            ) : null}
            {int(form.softCount) > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
                <span style={{ color: 'var(--muted)' }}>⚪ نرم:</span>
                <span style={{ fontWeight: 700, color: 'var(--warn)' }}>{toFa(int(form.softCount))}</span>
              </div>
            ) : null}
            {int(form.dirtyCount) > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
                <span style={{ color: 'var(--muted)' }}>🧹 کثیف:</span>
                <span style={{ fontWeight: 700, color: 'var(--warn)' }}>{toFa(int(form.dirtyCount))}</span>
              </div>
            ) : null}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--accent-border)', paddingTop: 6, marginTop: 2 }}>
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)', fontWeight: 700 }}>جمع کل:</span>
              <span style={{ fontSize: 'var(--fs-md)', color: 'var(--accent)', fontWeight: 700 }}>{toFa(totalEggs)} عدد</span>
            </div>
            {flockCount > 0 && healthy > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                <span>نرخ تخم‌گذاری:</span>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{toFa(liveRate)}٪</span>
              </div>
            ) : null}
          </div>
        ) : null}

        {(int(form.eatingCount) > 0 || int(form.fertileCount) > 0 || (int(form.brokenCount) + int(form.softCount) + int(form.dirtyCount)) > 0) && (
          <div style={{ padding: 'var(--pad-normal)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 600, lineHeight: 1.7 }}>
            {int(form.eatingCount) > 0 && <div>✓ {toFa(int(form.eatingCount))} تخم مرغ خوراکی → انبار</div>}
            {int(form.fertileCount) > 0 && <div>✓ {toFa(int(form.fertileCount))} تخم نطفه‌دار → انبار</div>}
            {(int(form.brokenCount) + int(form.softCount) + int(form.dirtyCount)) > 0 && (
              <div>✓ {toFa(int(form.brokenCount) + int(form.softCount) + int(form.dirtyCount))} تخم مصرفی → انبار مصرفی</div>
            )}
          </div>
        )}

        <SectionTitle>⚖ وزن (اختیاری)</SectionTitle>
        <Field label="وزن میانگین تخم" hint="اختیاری" error={vErrors.avgWeight}>
          <NumField placeholder="مثلاً — ۱.۵" value={form.avgWeight} onChange={(e: any) => setForm({ ...form, avgWeight: e.target.value })} unit="گرم" min={0} />
        </Field>

        <Field label="یادداشت">
            <Textarea placeholder="..." value={form.notes} onChange={(e: any) => setForm({ ...form, notes: e.target.value })} />
          </Field>

        <ErrorBox>{err}</ErrorBox>
      </Modal>
  );
}
