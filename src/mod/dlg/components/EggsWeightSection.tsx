/**
 * EggsWeightSection — تخم و وزن‌کشی
 */
import { Btn, Field, Grid2, NumField, Select } from '../../../shr/components/ui';
import { toFa, toEn } from '../../../shr/utils/fa';
import { avgWeight, cvWeight } from '../store';
import type { F } from '../types';
import { FieldHint } from '../../../shr/intelligence';
import { useFlk } from '../../flk/store';

interface Props {
  form: F;
  setForm: React.Dispatch<React.SetStateAction<F>>;
  vErrors: Record<string, string>;
  flockAliveCount: number;
  showError: (field: string) => string | undefined;
  markTouched: (field: string) => void;
}

export default function EggsWeightSection({ form, setForm, vErrors, flockAliveCount, showError, markTouched }: Props) {
  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || null : null;

  // context
  const { flocks } = useFlk();
  const selectedFlock = flocks.find(f => f.id === form.flockId);
  const femaleCount = selectedFlock?.femaleCount ?? flockAliveCount;

  return (
    <>
          <Grid2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
              <Field label="🥚 تخم خوراکی" error={showError('eatingEggs')}>
                <NumField placeholder="۰" value={form.eatingEggs} onChange={e => setForm({...form, eatingEggs: e.target.value})} unit="عدد" min={0} max={flockAliveCount || undefined} />
              </Field>
              {!showError('eatingEggs') && <FieldHint fieldPath="dlg.eatingEggs" value={form.eatingEggs} context={{ femaleCount, flockSize: flockAliveCount }} />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
              <Field label="🌱 تخم نطفه‌دار" error={showError('fertileEggs')}>
                <NumField placeholder="۰" value={form.fertileEggs} onChange={e => setForm({...form, fertileEggs: e.target.value})} unit="عدد" min={0} />
              </Field>
              {!showError('fertileEggs') && <FieldHint fieldPath="dlg.fertileEggs" value={form.fertileEggs} context={{ femaleCount, flockSize: flockAliveCount }} />}
            </div>
          </Grid2>
          <Grid2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
              <Field label="💔 شکسته" error={showError('brokenEggs')}>
                <NumField placeholder="۰" value={form.brokenEggs} onChange={e => setForm({...form, brokenEggs: e.target.value})} unit="عدد" min={0} />
              </Field>
              {!showError('brokenEggs') && <FieldHint fieldPath="dlg.brokenEggs" value={form.brokenEggs} context={{ femaleCount, flockSize: flockAliveCount }} />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
              <Field label="📦 سایر (نرم/کثیف)" error={showError('otherEggs')}>
                <NumField placeholder="۰" value={form.otherEggs} onChange={e => setForm({...form, otherEggs: e.target.value})} unit="عدد" min={0} />
              </Field>
              {!showError('otherEggs') && <FieldHint fieldPath="dlg.otherEggs" value={form.otherEggs} context={{ femaleCount, flockSize: flockAliveCount }} />}
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
              {form.weightSamples.length >= 2
                ? <>میانگین: {toFa(avgWeight(form.weightSamples.map(w => ({ id: w.id, weight: num(w.weight) || 0 }))))} kg • CV: {toFa(cvWeight(form.weightSamples.map(w => ({ id: w.id, weight: num(w.weight) || 0 }))))}٪</>
                : <>💡 حداقل ۲ نمونه اضافه کن تا میانگین محاسبه شود</>}
            </div>
          </Field>
        </Grid2>
      )}

      {form.weightSamples.map((w, i) => (
        <div key={w.id} style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <NumField
                placeholder="وزن (kg)"
                value={w.weight}
                error={showError(`weightSamples.${i}.weight`)}
                onBlur={() => markTouched(`weightSamples.${i}.weight`)}
                onChange={e => setForm(f => ({ ...f, weightSamples: f.weightSamples.map(x => x.id === w.id ? { ...x, weight: e.target.value } : x) }))}
                unit="kg" min={0} />
            </div>
            <button type="button" onClick={() => setForm(f => ({ ...f, weightSamples: f.weightSamples.filter(x => x.id !== w.id) }))}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 18, lineHeight: 1, padding: '4px 6px', flexShrink: 0 }}>✕</button>
          </div>
          {!showError(`weightSamples.${i}.weight`) && <FieldHint fieldPath="dlg.weightSamples" value={w.weight} context={{ species: selectedFlock?.breedId }} />}
        </div>
      ))}

      <Btn size="sm" full onClick={() => setForm(f => ({ ...f, weightSamples: [...f.weightSamples, { id: crypto.randomUUID(), weight: '' }] }))}>
        + افزودن نمونه وزن
      </Btn>

    </>
  );
}
