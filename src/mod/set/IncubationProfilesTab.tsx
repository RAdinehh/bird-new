import { useState } from 'react';
import { useSet, type IncubationProfile } from './store';
import { Btn, Field, Grid2, NumField, PageContainer } from '../../shr/components/ui';
import SettingsGroup from './SettingsGroup';
import { showAlert } from '../../cor/store/dialog';

export default function IncubationProfilesTab() {
  const s = useSet();
  const profiles: IncubationProfile[] = (s as any).incubationProfiles || [];
  const [newName, setNewName] = useState('');

  const update = (id: string, patch: Partial<IncubationProfile>) => {
    const next = profiles.map(p => p.id === id ? { ...p, ...patch } : p);
    s.update({ incubationProfiles: next } as any);
  };

  const add = () => {
    if (!newName.trim()) { showAlert('نام پرنده را وارد کنید'); return; }
    const id = 'custom-' + Date.now();
    const next = [...profiles, {
      id, birdName: newName.trim(),
      setterTemp: 37.7, setterHumidity: 50,
      hatcherTemp: 37.2, hatcherHumidity: 62,
      totalDays: 21, lockdownDay: 18,
    }];
    s.update({ incubationProfiles: next } as any);
    setNewName('');
  };

  const remove = (id: string) => {
    if (!confirm('حذف این پرنده؟')) return;
    s.update({ incubationProfiles: profiles.filter(p => p.id !== id) } as any);
  };

  return (
    <PageContainer>
      <SettingsGroup icon="🐣" title="برنامه‌های انکوباسیون" subtitle={`${profiles.length} پرنده`} defaultOpen tone="accent">
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.8, padding: '4px 2px 8px' }}>
          💡 این تنظیمات هنگام ساخت دستگاه جوجه‌کشی خودکار پر می‌شوند. هر فیلد را می‌توانید دستی تغییر دهید.
        </div>

        {profiles.map(p => (
          <div key={p.id} style={{ padding: 12, background: 'var(--input-bg)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 'var(--fs-md)' }}>{p.birdName}</span>
              <button onClick={() => remove(p.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--fs-base)' }}>✕</button>
            </div>

            <Grid2>
              <Field label="دما ستر" hint="°C">
                <NumField placeholder="مثلاً: ۲۵" value={String(p.setterTemp)} onChange={e => update(p.id, { setterTemp: parseFloat(e.target.value) || 0 })} unit="°C" min={30} max={45} />
              </Field>
              <Field label="رطوبت ستر" hint="٪">
                <NumField placeholder="مثلاً: ۶۰" value={String(p.setterHumidity)} onChange={e => update(p.id, { setterHumidity: parseFloat(e.target.value) || 0 })} unit="٪" min={0} max={100} />
              </Field>
            </Grid2>

            <Grid2>
              <Field label="دما هچر" hint="°C">
                <NumField placeholder="مثلاً: ۲۵" value={String(p.hatcherTemp)} onChange={e => update(p.id, { hatcherTemp: parseFloat(e.target.value) || 0 })} unit="°C" min={30} max={45} />
              </Field>
              <Field label="رطوبت هچر" hint="٪">
                <NumField placeholder="مثلاً: ۶۰" value={String(p.hatcherHumidity)} onChange={e => update(p.id, { hatcherHumidity: parseFloat(e.target.value) || 0 })} unit="٪" min={0} max={100} />
              </Field>
            </Grid2>

            <Grid2>
              <Field label="مدت کل" hint="روز">
                <NumField placeholder="مثلاً: ۳۰" value={String(p.totalDays)} onChange={e => update(p.id, { totalDays: parseInt(e.target.value) || 0 })} unit="روز" min={10} max={40} />
              </Field>
              <Field label="Lock-down" hint="روز توقف چرخش">
                <NumField placeholder="مثلاً: ۱۸" value={String(p.lockdownDay)} onChange={e => update(p.id, { lockdownDay: parseInt(e.target.value) || 0 })} unit="روز" min={10} max={40} />
              </Field>
            </Grid2>
          </div>
        ))}

        <div style={{ paddingTop: 8, borderTop: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Field label="افزودن پرنده جدید">
            <Grid2>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="مثلاً: طوطی"
                onKeyDown={e => { if (e.key === 'Enter') add(); }}
                style={{ height: 38, padding: '0 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 'var(--fs-base)', outline: 'none' }}
              />
              <Btn variant="primary" onClick={add}>+ افزودن</Btn>
            </Grid2>
          </Field>
        </div>
      </SettingsGroup>
    </PageContainer>
  );
}
