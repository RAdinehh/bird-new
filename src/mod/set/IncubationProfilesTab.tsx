import { useState } from 'react';
import { useSet, type IncubationProfile } from './store';
import { Btn, Field, Grid2, NumField, Input, PageContainer } from '../../shr/components/ui';
import SettingsGroup from './SettingsGroup';
import { showAlert, showConfirmAsync } from '../../cor/store/dialog';
import { toFa } from '../../shr/utils/fa';

function SmallDeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="حذف"
      title="حذف"
      style={{
        background: 'var(--danger-soft)',
        border: '1px solid var(--danger)',
        color: 'var(--danger)',
        cursor: 'pointer',
        borderRadius: 'var(--r-sm)',
        width: 28, height: 28, minWidth: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, lineHeight: 1, padding: 0,
        fontFamily: 'inherit', fontWeight: 700, flexShrink: 0,
      }}
    >✕</button>
  );
}

export default function IncubationProfilesTab() {
  const s = useSet();
  const profiles: IncubationProfile[] = (s as any).incubationProfiles || [];
  const [newName, setNewName] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

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

  const remove = async (id: string) => {
    if (!await showConfirmAsync('تأیید', 'حذف این پرنده؟', { danger: true })) return;
    s.update({ incubationProfiles: profiles.filter(p => p.id !== id) } as any);
  };

  return (
    <PageContainer>
      <SettingsGroup icon="🐣" title="برنامه‌های انکوباسیون" subtitle={`${toFa(profiles.length)} پرنده`} defaultOpen tone="accent">
        <div style={{
          fontSize: 'var(--fs-xs)', color: 'var(--muted)',
          lineHeight: 1.8, marginBottom: 'var(--gap-sm)',
        }}>
          💡 این تنظیمات هنگام ساخت دستگاه جوجه‌کشی خودکار پر می‌شوند.
        </div>

        {profiles.map(p => {
          const open = openId === p.id;
          return (
            <div key={p.id} style={{
              background: 'var(--input-bg)',
              border: '1px solid ' + (open ? 'var(--accent-border)' : 'var(--border)'),
              borderRadius: 'var(--r-md)',
              marginBottom: 'var(--gap-xs)',
              overflow: 'hidden',
              transition: 'border-color .2s',
            }}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : p.id)}
                aria-expanded={open}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px var(--sp-3)',
                  background: 'transparent', border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit',
                  textAlign: 'right',
                }}
              >
                <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, flex: 1, color: 'var(--text)' }}>
                  {p.birdName}
                </span>
                <span style={{
                  fontSize: 'var(--fs-xs)', color: 'var(--muted)',
                  display: 'flex', gap: 4, flexShrink: 0,
                }}>
                  <span>{toFa(p.setterTemp)}°/{toFa(p.setterHumidity)}٪</span>
                  <span style={{ color: 'var(--dim)' }}>·</span>
                  <span>{toFa(p.totalDays)} روز</span>
                </span>
                <span aria-hidden="true" style={{
                  fontSize: 10, color: 'var(--muted)', flexShrink: 0,
                  transform: open ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform .2s',
                }}>▼</span>
              </button>

              {open && (
                <div style={{
                  padding: 'var(--sp-3)',
                  borderTop: '1px dashed var(--border)',
                  display: 'flex', flexDirection: 'column', gap: 'var(--gap-sm)',
                  background: 'var(--card)',
                }}>
                  <Grid2>
                    <Field label="دمای ستر" hint="°C">
                      <NumField value={String(p.setterTemp)} onChange={e => update(p.id, { setterTemp: parseFloat(e.target.value) || 0 })} unit="°C" min={30} max={45} />
                    </Field>
                    <Field label="رطوبت ستر" hint="٪">
                      <NumField value={String(p.setterHumidity)} onChange={e => update(p.id, { setterHumidity: parseFloat(e.target.value) || 0 })} unit="٪" min={0} max={100} />
                    </Field>
                  </Grid2>
                  <Grid2>
                    <Field label="دمای هچر" hint="°C">
                      <NumField value={String(p.hatcherTemp)} onChange={e => update(p.id, { hatcherTemp: parseFloat(e.target.value) || 0 })} unit="°C" min={30} max={45} />
                    </Field>
                    <Field label="رطوبت هچر" hint="٪">
                      <NumField value={String(p.hatcherHumidity)} onChange={e => update(p.id, { hatcherHumidity: parseFloat(e.target.value) || 0 })} unit="٪" min={0} max={100} />
                    </Field>
                  </Grid2>
                  <Grid2>
                    <Field label="مدت کل" hint="روز">
                      <NumField value={String(p.totalDays)} onChange={e => update(p.id, { totalDays: parseInt(e.target.value) || 0 })} unit="روز" min={10} max={40} />
                    </Field>
                    <Field label="Lock-down" hint="روز توقف چرخش">
                      <NumField value={String(p.lockdownDay)} onChange={e => update(p.id, { lockdownDay: parseInt(e.target.value) || 0 })} unit="روز" min={10} max={40} />
                    </Field>
                  </Grid2>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <SmallDeleteBtn onClick={() => remove(p.id)} />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div style={{
          paddingTop: 'var(--sp-3)',
          borderTop: '1px dashed var(--border)',
          display: 'flex', flexDirection: 'column', gap: 'var(--gap-sm)',
        }}>
          <Field label="افزودن پرنده جدید">
            <Grid2>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="مثلاً — طوطی"
                onKeyDown={(e: any) => { if (e.key === 'Enter') add(); }}
              />
              <Btn variant="primary" onClick={add}>+ افزودن</Btn>
            </Grid2>
          </Field>
        </div>
      </SettingsGroup>
    </PageContainer>
  );
}
