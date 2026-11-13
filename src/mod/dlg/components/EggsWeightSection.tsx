import { useState } from 'react';
/**
 * EggsWeightSection — تخم و وزن‌کشی
 */
import { Btn, Field, Grid2, NumField, Select } from '../../../shr/components/ui';
import { toFa, toEn } from '../../../shr/utils/fa';
import { avgWeight, cvWeight } from '../store';
import { calculateWeightMetrics } from '../../../shr/calc/formulas/weight';
import type { F } from '../types';
import { useFlk, getAgeDays } from '../../flk/store';

interface Props {
  form: F;
  setForm: React.Dispatch<React.SetStateAction<F>>;
  vErrors: Record<string, string>;
  flockAliveCount: number;
  showError: (field: string) => string | undefined;
  markTouched: (field: string) => void;
}

export default function EggsWeightSection({ form, setForm, vErrors, flockAliveCount, showError, markTouched }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || null : null;

  // context
  const { flocks } = useFlk();
  const selectedFlock = flocks.find(f => f.id === form.flockId);
  const flockAge = selectedFlock ? getAgeDays(selectedFlock) : null;
  const femaleCount = selectedFlock?.femaleCount ?? flockAliveCount;

  return (
    <>
          <Grid2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
              <Field label="🥚 تخم خوراکی" error={showError('eatingEggs')}>
                <NumField placeholder="۰" value={form.eatingEggs} onChange={e => setForm({...form, eatingEggs: e.target.value})} unit="عدد" min={0} max={flockAliveCount || undefined} />
              </Field>
              
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
              <Field label="🌱 تخم نطفه‌دار" error={showError('fertileEggs')}>
                <NumField placeholder="۰" value={form.fertileEggs} onChange={e => setForm({...form, fertileEggs: e.target.value})} unit="عدد" min={0} />
              </Field>
              
            </div>
          </Grid2>
          <Grid2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
              <Field label="💔 شکسته" error={showError('brokenEggs')}>
                <NumField placeholder="۰" value={form.brokenEggs} onChange={e => setForm({...form, brokenEggs: e.target.value})} unit="عدد" min={0} />
              </Field>
              
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
              <Field label="📦 سایر" help="همه تخم‌های غیرسالم را اینجا وارد کنید: نرم، کثیف، ترک‌خورده یا هر مورد دیگر. تفکیک دقیق در صفحه «تخم‌گذاری» موجود است." error={showError('otherEggs')}>
                <NumField placeholder="۰" value={form.otherEggs} onChange={e => setForm({...form, otherEggs: e.target.value})} unit="عدد" min={0} />
              </Field>
              
            </div>
          </Grid2>
      {form.weightSamples.length > 0 && (
        <Grid2>
          <Field label="جنسیت">
            <Select value={form.weightGender} onChange={e => setForm({ ...form, weightGender: e.target.value as any })}>
              <option value="">— نامشخص —</option>
              <option value="male">نر</option>
              <option value="female">ماده</option>
              <option value="mixed">مخلوط</option>
            </Select>
          </Field>
          <Field label="خلاصه">
            <div style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)' }}>
              {(() => {
                const samples = form.weightSamples
                  .map(w => ({ id: w.id, weight: num(w.weight) || 0 }))
                  .filter(w => w.weight > 0);

                // 🆕 calculateWeightMetrics وقتی ۳ نمونه یا بیشتر (MIN_SAMPLES=3)
                if (samples.length >= 3) {
                  const result = calculateWeightMetrics({
                    samples,
                    previousAvgWeightG: null,
                    ageDays: flockAge ?? 0,
                    standardWeightG: null,
                  });
                  if (result.hasData) {
                    const avgKg = Math.round((result.avgWeightG / 1000) * 1000) / 1000;
                    return <>میانگین: {toFa(avgKg)} kg • CV: {toFa(result.cvPct)}٪ • یکنواختی: {toFa(result.uniformityPct)}٪</>;
                  }
                }

                // fallback: ۲ نمونه — legacy
                if (form.weightSamples.length >= 2) {
                  return <>میانگین: {toFa(avgWeight(form.weightSamples.map(w => ({ id: w.id, weight: num(w.weight) || 0 }))))} kg • CV: {toFa(cvWeight(form.weightSamples.map(w => ({ id: w.id, weight: num(w.weight) || 0 }))))}٪</>;
                }

                return <>💡 حداقل ۲ نمونه اضافه کن تا میانگین محاسبه شود</>;
              })()}
            </div>
          </Field>
        </Grid2>
      )}

      {form.weightSamples.map((w, i) => (
        <div key={w.id} style={{ padding: 'var(--pad-normal)', background: 'var(--card-solid)', border: `1px solid ${expandedId === w.id ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
          <div onClick={() => setExpandedId(expandedId === w.id ? null : w.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: expandedId === w.id ? 'default' : 'pointer' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 'var(--fs-base)', fontWeight: 800, color: 'var(--text)' }}>نمونه {toFa(i + 1)}</span>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{w.weight ? `${toFa(Number(w.weight))} کیلوگرم` : 'بدون وزن'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button type="button" onClick={(e) => { e.stopPropagation(); setForm(f => ({ ...f, weightSamples: f.weightSamples.filter(x => x.id !== w.id) })) }} style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer', borderRadius: 'var(--r-sm)', width: 28, height: 28, padding: 0, fontFamily: 'inherit', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
          </div>
          {expandedId === w.id && (
            <div style={{ marginTop: 4 }}>
              <NumField
                placeholder="وزن (kg)"
                value={w.weight}
                error={showError(`weightSamples.${i}.weight`)}
                onBlur={() => markTouched(`weightSamples.${i}.weight`)}
                onChange={e => setForm(f => ({ ...f, weightSamples: f.weightSamples.map(x => x.id === w.id ? { ...x, weight: e.target.value } : x) }))}
                unit="kg" min={0} />
            </div>
          )}
        </div>
      ))}

      <Btn size="sm" full variant="outline" onClick={() => {
        const newId = crypto.randomUUID();
        setForm(f => ({ ...f, weightSamples: [...f.weightSamples, { id: newId, weight: '' }] }));
        setExpandedId(newId);
      }}>
        + افزودن نمونه وزن
      </Btn>

    </>
  );
}
