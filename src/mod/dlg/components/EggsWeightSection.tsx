import { useState } from 'react';
/**
 * EggsWeightSection — تخم و وزن‌کشی
 */
import { Btn, Field, Grid2, NumField, Select } from '../../../shr/components/ui';
import { HelpIcon } from '../../../shr/components/ui/HelpIcon';
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

function cvText(cv: number): { text: string; color: string } {
 if (!isFinite(cv) || cv < 0) return { text: '—', color: 'var(--muted)' };
 if (cv <= 8) return { text: 'عالی — گله کاملاً همگن', color: 'var(--success, var(--accent))' };
 if (cv <= 10) return { text: 'خوب — در محدوده مطلوب صنعت', color: 'var(--success, var(--accent))' };
 if (cv <= 12) return { text: 'متوسط — توزیع دان و آبخوری را پایش کن', color: 'var(--warn, var(--accent))' };
 return { text: 'ضعیف — رقابت غذایی یا بیماری را فوری بررسی کن', color: 'var(--danger)' };
}

export default function EggsWeightSection({ form, setForm, vErrors, flockAliveCount, showError, markTouched }: Props) {
 const [expandedId, setExpandedId] = useState<string | null>(null);
 const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || null : null;

 const { flocks } = useFlk();
 const selectedFlock = flocks.find(f => f.id === form.flockId);
 const flockAge = selectedFlock ? getAgeDays(selectedFlock) : null;

 const renderSummary = () => {
  const samples = form.weightSamples
   .map(w => ({ id: w.id, weight: num(w.weight) || 0 }))
   .filter(w => w.weight > 0);

  if (samples.length >= 3) {
   const result = calculateWeightMetrics({
    samples,
    previousAvgWeightG: null,
    ageDays: flockAge ?? 0,
    standardWeightG: null,
   });
   if (result.hasData) {
    const avgG = Math.round(result.avgWeightG * 10) / 10;
    const lbl = cvText(result.cvPct);
    return (
     <div style={{ fontSize: 'var(--fs-xs)', lineHeight: 1.7 }}>
      <div>میانگین: <b>{toFa(avgG)} گرم</b> • یکنواختی: <b>{toFa(result.uniformityPct)}٪</b></div>
      <div style={{ color: lbl.color, fontWeight: 700 }}>CV {toFa(result.cvPct)}٪ — {lbl.text}</div>
     </div>
    );
   }
  }

  if (samples.length >= 2) {
   const avg = avgWeight(form.weightSamples.map(w => ({ id: w.id, weight: num(w.weight) || 0 })));
   const cv = cvWeight(form.weightSamples.map(w => ({ id: w.id, weight: num(w.weight) || 0 })));
   const lbl = cvText(cv);
   return (
    <div style={{ fontSize: 'var(--fs-xs)', lineHeight: 1.7 }}>
     <div>میانگین: <b>{toFa(avg)} گرم</b></div>
     <div style={{ color: lbl.color, fontWeight: 700 }}>CV {toFa(cv)}٪ — {lbl.text}</div>
    </div>
   );
  }

  return <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>💡 حداقل ۲ نمونه اضافه کن تا میانگین محاسبه شود</div>;
 };

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
   <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-base)', fontWeight: 800, color: 'var(--text)' }}>⚖️ وزن‌کشی تخم <HelpIcon text={`**محاسبه میانگین و یکنواختی:**
با ثبت حداقل ۲ نمونه وزن، میانگین محاسبه می‌شود. برای محاسبه دقیق‌تر (CV و یکنواختی) حداقل به ۳ نمونه نیاز است.
**راهنمای CV (ضریب تغییرات):**
- **CV ≤ ۸٪:** عالی (گله همگن)
- **۸٪ < CV ≤ ۱۰٪:** خوب (مطلوب صنعت)
- **۱۰٪ < CV ≤ ۱۲٪:** متوسط (نیاز به پایش)
- **CV > ۱۲٪:** ضعیف (مشکل غذایی یا بیماری)`} /></div>

    {form.weightSamples.map((w, i) => (
     <div key={w.id} style={{ padding: 'var(--pad-normal)', background: 'var(--card-solid)', border: `1px solid ${expandedId === w.id ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div onClick={() => setExpandedId(expandedId === w.id ? null : w.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: expandedId === w.id ? 'default' : 'pointer' }}>
       <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 'var(--fs-base)', fontWeight: 800, color: 'var(--text)' }}>نمونه {toFa(i + 1)}</span>
        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{num(w.weight) ? `${toFa(Number(num(w.weight)))} گرم` : 'بدون وزن'}</span>
       </div>
       <button type="button" onClick={(e) => { e.stopPropagation(); setForm(f => ({ ...f, weightSamples: f.weightSamples.filter(x => x.id !== w.id) })); if (expandedId === w.id) setExpandedId(null); }} style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer', borderRadius: 'var(--r-sm)', width: 28, height: 28, padding: 0, fontFamily: 'inherit', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>
      {expandedId === w.id && (<>
       <Grid2>
        <Field label="وزن (گرم)" error={showError(`weightSamples.${i}.weight`)}>
         <NumField placeholder="۰" value={w.weight} onBlur={() => markTouched(`weightSamples.${i}.weight`)} onChange={e => setForm(f => ({ ...f, weightSamples: f.weightSamples.map(x => x.id === w.id ? { ...x, weight: e.target.value } : x) }))} unit="گرم" min={0} />
        </Field>
        <Field label="جنسیت">
         <Select value={form.weightGender} onChange={e => setForm({ ...form, weightGender: e.target.value as any })}>
          <option value="">— نامشخص —</option>
          <option value="male">نر</option>
          <option value="female">ماده</option>
          <option value="mixed">مخلوط</option>
         </Select>
        </Field>
       </Grid2>
       <div style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
        {renderSummary()}
       </div>
      </>)}
     </div>
    ))}

    <Btn full onClick={() => {
     const newId = crypto.randomUUID();
     setForm(f => ({ ...f, weightSamples: [...f.weightSamples, { id: newId, weight: '' }] }));
     setExpandedId(newId);
    }}>
     + افزودن نمونه وزن
    </Btn>
   </div>
  </>
 );
}
