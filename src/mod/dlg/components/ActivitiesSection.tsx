/**
 * ActivitiesSection — فعالیت‌ها + یادداشت
 */
import { Btn, Field, Input, Textarea } from '../../../shr/components/ui';
import type { F } from '../types';

interface Props {
  form: F;
  setForm: React.Dispatch<React.SetStateAction<F>>;
}

export default function ActivitiesSection({ form, setForm }: Props) {
  return (
    <>

      <Btn size="sm" full onClick={() => setForm(f => ({ ...f, activities: [...f.activities, { id: crypto.randomUUID(), type: '', notes: '' }] }))}>
        + افزودن فعالیت
      </Btn>
      {form.activities.map((a) => (
        <div key={a.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Input placeholder="نوع فعالیت..." value={a.type} onChange={e => setForm(f => ({ ...f, activities: f.activities.map(x => x.id === a.id ? { ...x, type: e.target.value } : x) }))} />
          <button onClick={() => setForm(f => ({ ...f, activities: f.activities.filter(x => x.id !== a.id) }))} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 18, lineHeight: 1, padding: '4px 6px', flexShrink: 0 }}>✕</button>
        </div>
      ))}

      <Field label="یادداشت">
        <Textarea rows={3} placeholder="..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
      </Field>

    </>
  );
}
