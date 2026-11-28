/**
 * ProductionFormModal — فرم افزودن/ویرایش تولید تخم
 */
import { useFormat } from '../../../shr/units/useFormat';

import { Btn, BtnRow, Field, Grid2, Modal, NumField, Select, Textarea, ErrorBox } from '../../../shr/components/ui';
import { SectionTitle } from '../helpers';
import { FieldHint } from '../../../shr/intelligence';
import DatePicker from '../../../shr/components/DatePicker';
import { toFa, toEn } from '../../../shr/utils/fa';
import SmartSelect from '../../../shr/components/SmartSelect';

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
  const fmt = useFormat();
  const { open, setOpen, form, setForm, err, vErrors, activeFlocks, flockCount, onSave } = props;

  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || null : null;
  
  const int = (s: any) => { const v = parseInt(toEn(String(s || ''))); return isNaN(v) ? 0 : v; };
  const healthy = int(form.eatingCount) + int(form.fertileCount);
  const totalEggs = healthy + int(form.brokenCount) + int(form.softCount) + int(form.dirtyCount);
  const selectedFlock = activeFlocks.find((f) => f.id === form.flockId);
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
            <SmartSelect
              value={form.flockId}
              placeholder="— انتخاب —"
              modalTitle="انتخاب گله"
              options={activeFlocks.map((f) => ({ value: String(f.id), label: String(f.name), icon: 'flock' }))}
              onChange={(val: string) => setForm({ ...form, flockId: val })}
            />
          </Field>
          <Field label="تاریخ" required>
            <DatePicker value={form.date} onChange={v => setForm({ ...form, date: v })}  autoToday />
          </Field>
        </Grid2>

        {flockCount > 0 ? (
          <div style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 600, textAlign: 'center' }}>
            تعداد گله: {fmt.count(flockCount)} پرنده
          </div>
        ) : null}

        <SectionTitle>🥚 تخم‌گذاری</SectionTitle>

        <Grid2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
            <Field label="🥚 تخم خوراکی">
              <NumField placeholder="۰" value={form.eatingCount} onChange={(e: any) => setForm({ ...form, eatingCount: e.target.value })} unit="عدد" min={0} integer />
            </Field>
            {!vErrors.eatingCount && <FieldHint fieldPath="egg.eatingCount" value={form.eatingCount} context={{ femaleCount: (selectedFlock as any)?.femaleCount ?? flockCount }} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
            <Field label="🌱 تخم نطفه‌دار" error={vErrors.fertileCount}>
              <NumField placeholder="۰" value={form.fertileCount} onChange={(e: any) => setForm({ ...form, fertileCount: e.target.value })} unit="عدد" min={0} integer />
            </Field>
            {!vErrors.fertileCount && <FieldHint fieldPath="egg.fertileCount" value={form.fertileCount} context={{ femaleCount: (selectedFlock as any)?.femaleCount ?? flockCount }} />}
          </div>
        </Grid2>

        {(int(form.eatingCount) > 0 || int(form.fertileCount) > 0) && (
          <div style={{ padding: 'var(--pad-normal)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 600, lineHeight: 1.7, textAlign: 'center' }}>
            📊 ترکیب سالم: <b>{fmt.num(eatingPercent)}٪ خوراکی</b> • <b>{fmt.num(fertilePercent)}٪ نطفه‌دار</b>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
            <Field label="تخم شکسته" error={vErrors.brokenCount}>
              <NumField placeholder="۰" value={form.brokenCount} onChange={(e: any) => setForm({ ...form, brokenCount: e.target.value })} unit="عدد" min={0} integer />
            </Field>
            {!vErrors.brokenCount && <FieldHint fieldPath="egg.brokenCount" value={form.brokenCount} context={{ femaleCount: (selectedFlock as any)?.femaleCount ?? flockCount }} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
            <Field label="تخم نرم" error={vErrors.softCount}>
              <NumField placeholder="۰" value={form.softCount} onChange={(e: any) => setForm({ ...form, softCount: e.target.value })} unit="عدد" min={0} integer />
            </Field>
            {!vErrors.softCount && <FieldHint fieldPath="egg.softCount" value={form.softCount} context={{ femaleCount: (selectedFlock as any)?.femaleCount ?? flockCount }} />}
          </div>
        </Grid2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
          <Field label="تخم کثیف" error={vErrors.dirtyCount}>
            <NumField placeholder="۰" value={form.dirtyCount} onChange={(e: any) => setForm({ ...form, dirtyCount: e.target.value })} unit="عدد" min={0} integer />
          </Field>
          {!vErrors.dirtyCount && <FieldHint fieldPath="egg.dirtyCount" value={form.dirtyCount} context={{ femaleCount: (selectedFlock as any)?.femaleCount ?? flockCount }} />}
        </div>

        {totalEggs > 0 ? (
          <div style={{ padding: 'var(--pad-normal)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
              <span style={{ color: 'var(--muted)' }}>🥚 تخم سالم:</span>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{fmt.count(healthy)}</span>
            </div>
            {int(form.brokenCount) > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
                <span style={{ color: 'var(--muted)' }}>💔 شکسته:</span>
                <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{fmt.count(int(form.brokenCount))}</span>
              </div>
            ) : null}
            {int(form.softCount) > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
                <span style={{ color: 'var(--muted)' }}>⚪ نرم:</span>
                <span style={{ fontWeight: 700, color: 'var(--warn)' }}>{fmt.count(int(form.softCount))}</span>
              </div>
            ) : null}
            {int(form.dirtyCount) > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
                <span style={{ color: 'var(--muted)' }}>🧹 کثیف:</span>
                <span style={{ fontWeight: 700, color: 'var(--warn)' }}>{fmt.count(int(form.dirtyCount))}</span>
              </div>
            ) : null}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--accent-border)', paddingTop: 6, marginTop: 2 }}>
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)', fontWeight: 700 }}>جمع کل:</span>
              <span style={{ fontSize: 'var(--fs-md)', color: 'var(--accent)', fontWeight: 700 }}>{fmt.count(totalEggs)} عدد</span>
            </div>
            {flockCount > 0 && healthy > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                <span>نرخ تخم‌گذاری:</span>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{fmt.code(liveRate)}٪</span>
              </div>
            ) : null}
          </div>
        ) : null}

        {(int(form.eatingCount) > 0 || int(form.fertileCount) > 0 || (int(form.brokenCount) + int(form.softCount) + int(form.dirtyCount)) > 0) && (
          <div style={{ padding: 'var(--pad-normal)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 600, lineHeight: 1.7 }}>
            {int(form.eatingCount) > 0 && <div>✓ {fmt.count(int(form.eatingCount))} تخم مرغ خوراکی → انبار</div>}
            {int(form.fertileCount) > 0 && <div>✓ {fmt.count(int(form.fertileCount))} تخم نطفه‌دار → انبار</div>}
            {(int(form.brokenCount) + int(form.softCount) + int(form.dirtyCount)) > 0 && (
              <div>✓ {fmt.count(int(form.brokenCount) + int(form.softCount) + int(form.dirtyCount))} تخم مصرفی → انبار مصرفی</div>
            )}
          </div>
        )}

        <SectionTitle>⚖ وزن (اختیاری)</SectionTitle>
        <Field label="وزن میانگین تخم" hint="اختیاری" error={vErrors.avgWeight}>
          <NumField placeholder="۰" value={form.avgWeight} onChange={(e: any) => setForm({ ...form, avgWeight: e.target.value })} unit="گرم" min={0} />
        </Field>
        {!vErrors.avgWeight && <FieldHint fieldPath="egg.avgWeight" value={form.avgWeight} context={{ species: (selectedFlock as any)?.birdKind }} />}

        <Field label="یادداشت">
            <Textarea placeholder="توضیحات" value={form.notes} onChange={(e: any) => setForm({ ...form, notes: e.target.value })} />
          </Field>

        <ErrorBox>{err}</ErrorBox>
      </Modal>
  );
}
