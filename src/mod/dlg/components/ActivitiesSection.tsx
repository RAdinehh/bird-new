/**
 * ActivitiesSection — فعالیت‌ها + یادداشت
 */
import { Btn, Field, Input, Textarea, Grid2 } from '../../../shr/components/ui';
import { toFa } from '../../../shr/utils/fa';
import type { F } from '../types';

interface Props {
  form: F;
  setForm: React.Dispatch<React.SetStateAction<F>>;
}

export default function ActivitiesSection({ form, setForm }: Props) {
  return (
    <>

      <Btn size="sm" full onClick={() => setForm(f => ({ ...f, activities: [...f.activities, { id: crypto.randomUUID(), type: '', notes: '' }] }))}>
        + فعالیت
      </Btn>
      {form.activities.map((a, i) => (
        <div key={a.id} style={{ padding: 'var(--pad-normal)', background: 'var(--card-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>فعالیت {toFa(i + 1)}</span>
            <button type="button" onClick={() => setForm(f => ({ ...f, activities: f.activities.filter(x => x.id !== a.id) }))} style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer', borderRadius: 'var(--r-sm)', width: 28, height: 28, padding: 0, fontFamily: 'inherit', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
          <Grid2>
            <Field label="نوع فعالیت">
              <Input placeholder="..." value={a.type} onChange={e => setForm(f => ({ ...f, activities: f.activities.map(x => x.id === a.id ? { ...x, type: e.target.value } : x) }))} />
            </Field>
            <Field label="یادداشت">
              <Input placeholder="..." value={a.notes || ''} onChange={e => setForm(f => ({ ...f, activities: f.activities.map(x => x.id === a.id ? { ...x, notes: e.target.value } : x) }))} />
            </Field>
          </Grid2>
        </div>
      ))}

      <Field label="یادداشت">
        <Textarea rows={3} placeholder="..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
      </Field>

    </>
  );
}
