import { useState, useMemo } from 'react';
import { useInc, type Device, type DeviceMode, type DeviceStatus, type DeviceCapacity } from './store';
import { useSet } from '../set/store';
import { useBrd } from '../brd/store';
import { Btn, BtnRow, Empty, Field, Grid2, Input, Modal, MoneyField, NumField, PageContainer, Select, Tag } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import DatePicker from '../../shr/components/DatePicker';
import { toFa, toEn } from '../../shr/utils/fa';
import { showAlert } from '../../cor/store/dialog';
import { addMonths, parse as parseJ } from 'date-fns-jalali';

const STATUS_FA: Record<DeviceStatus, string> = {
  active: '✅ فعال',
  idle: '⏸ غیرفعال',
  maintenance: '🔧 تعمیر',
  broken: '❌ خراب',
};

const MODE_FA: Record<DeviceMode, string> = {
  'setter': 'ستر',
  'hatcher': 'هچر',
  'setter+hatcher': 'ستر + هچر',
};

interface F {
  id?: string;
  name: string;
  capacityByBird: DeviceCapacity[];
  mode: DeviceMode;
  status: DeviceStatus;
  temp: string;
  humidity: string;
  purchasedAt: string;
  price: string;
  warranty: string;
  racks: string;
  trays: string;
  fans: string;
  tempSensors: string;
  humiditySensors: string;
  motorPower: string;
  extraCost: string;
  notes: string;
}

const empty: F = {
  name: '',
  capacityByBird: [],
  mode: 'setter+hatcher',
  status: 'active',
  temp: '',
  humidity: '',
  purchasedAt: '',
  price: '',
  warranty: '',
  racks: '',
  trays: '',
  fans: '',
  tempSensors: '',
  humiditySensors: '',
  motorPower: '',
  extraCost: '',
  notes: '',
};

export default function DevicesPage() {
  const { devices, eggEntries, addDevice, updateDevice, deleteDevice } = useInc();
  const settings = useSet();
  const { birds } = useBrd();
  const profiles: any[] = (settings as any).incubationProfiles || [];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty);
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [maintDeviceId, setMaintDeviceId] = useState<string | null>(null);
  const [maintForm, setMaintForm] = useState({ date: '', type: '', cost: '', description: '' });

  const openNew = () => { setForm(empty); setErr(''); setOpen(true); };

  const openEdit = (d: Device) => {
    setForm({
      id: d.id, name: d.name,
      capacityByBird: d.capacityByBird || [],
      mode: d.mode, status: d.status,
      temp: d.temp ? toFa(d.temp) : '',
      humidity: d.humidity ? toFa(d.humidity) : '',
      purchasedAt: d.purchasedAt,
      price: d.price ? toFa(d.price) : '',
      warranty: d.warranty ? toFa(d.warranty) : '',
      racks: d.racks ? String(d.racks) : '',
      trays: d.trays ? String(d.trays) : '',
      fans: d.fans ? String(d.fans) : '',
      tempSensors: d.tempSensors ? String(d.tempSensors) : '',
      humiditySensors: d.humiditySensors ? String(d.humiditySensors) : '',
      motorPower: d.motorPower ? String(d.motorPower) : '',
      extraCost: d.extraCost ? toFa(d.extraCost) : '',
      notes: d.notes,
    });
    setErr(''); setOpen(true);
  };

  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫', '.')) || null : null;
  const int = (s: string) => s ? parseInt(toEn(s)) || null : null;

  const addCapacity = (birdName: string) => {
    if (!birdName.trim()) return;
    if (form.capacityByBird.some(c => c.birdName === birdName)) return;
    setForm(f => ({ ...f, capacityByBird: [...f.capacityByBird, { birdName, capacity: null }] }));
    const profile = profiles.find(p => p.birdName === birdName);
    if (profile) {
      setForm(f => ({
        ...f,
        capacityByBird: [...f.capacityByBird, { birdName, capacity: null }],
        temp: f.temp || String(profile.setterTemp),
        humidity: f.humidity || String(profile.setterHumidity),
      }));
    }
  };

  const removeCapacity = (birdName: string) => {
    setForm(f => ({ ...f, capacityByBird: f.capacityByBird.filter(c => c.birdName !== birdName) }));
  };

  const updateCapacity = (birdName: string, capacity: number | null) => {
    setForm(f => ({
      ...f,
      capacityByBird: f.capacityByBird.map(c => c.birdName === birdName ? { ...c, capacity } : c),
    }));
  };

  const warrantyEnd = useMemo(() => {
    if (!form.purchasedAt || !form.warranty) return null;
    try {
      const date = parseJ(toEn(form.purchasedAt), 'yyyy/MM/dd', new Date());
      if (isNaN(date.getTime())) return null;
      const months = parseInt(toEn(form.warranty)) || 0;
      const end = addMonths(date, months);
      const y = end.getFullYear();
      const m = String(end.getMonth() + 1).padStart(2, '0');
      const d = String(end.getDate()).padStart(2, '0');
      return y + '/' + m + '/' + d;
    } catch { return null; }
  }, [form.purchasedAt, form.warranty]);

  const save = () => {
    if (!form.id) {
      const dup = devices.find((x: any) => x.name.trim() === form.name.trim());
      if (dup) { showAlert('دستگاهی با نام «' + dup.name + '» قبلاً ثبت شده', '❌ نام تکراری'); return; }
    }
    if (!form.name.trim()) { setErr('نام دستگاه اجباری است'); return; }
    const isActive = form.status === 'active';
    const data = {
      name: form.name.trim(),
      code: '',
      capacity: null,
      capacityByBird: form.capacityByBird,
      mode: form.mode,
      status: form.status,
      temp: isActive ? num(form.temp) : null,
      humidity: isActive ? num(form.humidity) : null,
      purchasedAt: form.purchasedAt.trim(),
      price: num(form.price),
      warranty: int(form.warranty),
      racks: int(form.racks),
      trays: int(form.trays),
      fans: int(form.fans),
      tempSensors: int(form.tempSensors),
      humiditySensors: int(form.humiditySensors),
      motorPower: num(form.motorPower),
      extraCost: num(form.extraCost),
      maintenanceLogs: [],
      equipmentId: '',
      notes: form.notes.trim(),
    };
    if (form.id) updateDevice(form.id, data); else addDevice(data);
    setOpen(false);
  };


  const addMaintenance = (deviceId: string) => {
    const dev = devices.find(d => d.id === deviceId);
    if (!dev) return;
    if (!maintForm.date || !maintForm.type) { showAlert('تاریخ و نوع تعمیر اجباری است'); return; }
    const log = {
      id: Date.now().toString(),
      date: maintForm.date,
      type: maintForm.type.trim(),
      cost: parseFloat(toEn(maintForm.cost).replace('٫', '.')) || null,
      description: maintForm.description.trim(),
    };
    const logs = [...(dev.maintenanceLogs || []), log];
    updateDevice(deviceId, { maintenanceLogs: logs } as any);
    setMaintForm({ date: '', type: '', cost: '', description: '' });
    setMaintDeviceId(null);
    showAlert('تعمیر ثبت شد', '✅');
  };

  const removeMaintenance = (deviceId: string, logId: string) => {
    const dev = devices.find(d => d.id === deviceId);
    if (!dev) return;
    if (!confirm('حذف این رکورد تعمیر؟')) return;
    const logs = (dev.maintenanceLogs || []).filter(l => l.id !== logId);
    updateDevice(deviceId, { maintenanceLogs: logs } as any);
  };

  const target = delId ? devices.find(d => d.id === delId) : null;
  const accentFor = (s: DeviceStatus): any => s === 'active' ? 'accent' : s === 'idle' ? 'dim' : 'warn';

  return (
    <PageContainer>
      {devices.length === 0 ? (
        <Empty icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h8M8 14h8"/></svg>}
          title="هنوز دستگاهی نساخته‌اید"
          desc="اولین دستگاه جوجه‌کشی خود را اضافه کنید."
          action={<Btn variant="primary" onClick={openNew}>+ افزودن دستگاه</Btn>} />
      ) : (
        <>
          {devices.map((d, i) => {
            const entries = eggEntries.filter(e => e.deviceId === d.id);
            const totalEggs = entries.reduce((a, e) => a + (e.count || 0), 0);
            const activeEntries = entries.filter(e => e.status === 'incubating' || e.status === 'candled' || e.status === 'locked').length;
            const isOpen = expandedId === d.id;
            const caps = d.capacityByBird || [];
            const totalCap = caps.reduce((a, c) => a + (c.capacity || 0), 0);
            return (
              <ExpandableCard key={d.id} accent={accentFor(d.status)} index={toFa(i + 1)} iconEmoji="🥚"
                title={d.name}
                subtitle={MODE_FA[d.mode] + ' · ' + STATUS_FA[d.status]}
                isOpen={isOpen} onToggle={() => setExpandedId(isOpen ? null : d.id)}
                badge={activeEntries > 0 ? <Tag tone="green">{toFa(activeEntries)} ورودی فعال</Tag> : undefined}
                summary={<>
                  {totalEggs > 0 && <span>تخم: <b>{toFa(totalEggs)}</b></span>}
                  {d.temp && <span>🌡 {toFa(d.temp)}°</span>}
                  {d.humidity && <span>💧 {toFa(d.humidity)}٪</span>}
                </>}
              >
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>📊 ظرفیت</div>
                {caps.length === 0 ? (
                  <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', padding: 8 }}>ظرفیتی تعریف نشده</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {caps.map(c => (
                      <div key={c.birdName} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-sm)' }}>
                        <span>{c.birdName}</span>
                        <span style={{ fontWeight: 600 }}>{c.capacity ? toFa(c.capacity) : '—'} تخم</span>
                      </div>
                    ))}
                  </div>
                )}

                {d.status === 'active' && (d.temp || d.humidity) && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>🌡 شرایط</div>
                    {d.temp && <Row l="دمای هدف" v={toFa(d.temp) + ' °C'} />}
                    {d.humidity && <Row l="رطوبت هدف" v={toFa(d.humidity) + ' ٪'} />}
                  </>
                )}

                {(d.purchasedAt || d.price || d.warranty) && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>💰 مالی</div>
                    {d.price && <Row l="قیمت" v={toFa(d.price.toLocaleString('fa-IR')) + ' ت'} />}
                    {d.purchasedAt && <Row l="تاریخ خرید" v={toFa(d.purchasedAt)} />}
                    {d.warranty && <Row l="گارانتی" v={toFa(d.warranty) + ' ماه'} />}
                  </>
                )}

                {d.notes && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>📝 یادداشت</div>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 8, background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{d.notes}</div>
                  </>
                )}

                
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>🛠 تعمیرات</div>
                {(d.maintenanceLogs || []).length === 0 ? (
                  <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', padding: 8, textAlign: 'center' }}>تعمیری ثبت نشده</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {(d.maintenanceLogs || []).slice().reverse().slice(0, 5).map(m => (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-sm)', padding: '6px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                          <span style={{ fontWeight: 600 }}>{m.type}</span>
                          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{toFa(m.date)}{m.cost ? ' · ' + toFa(m.cost.toLocaleString('fa-IR')) + ' ت' : ''}</span>
                        </div>
                        <button type="button" onClick={() => removeMaintenance(d.id, m.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, padding: 4 }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <Btn size="sm" full onClick={() => { setMaintDeviceId(d.id); setMaintForm({ date: '', type: '', cost: '', description: '' }); }}>+ ثبت تعمیر</Btn>

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => openEdit(d)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={() => setDelId(d.id)} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          <Btn variant="primary" full onClick={openNew}>+ افزودن دستگاه</Btn>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'ویرایش دستگاه' : 'افزودن دستگاه'}
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}>

        <SectionTitle>📋 مشخصات اصلی</SectionTitle>
        <Field label="نام دستگاه" required>
          <Input placeholder="مثلاً: دستگاه ۱" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        </Field>
        <Grid2>
          <Field label="حالت" required>
            <Select value={form.mode} onChange={e => setForm({...form, mode: e.target.value as DeviceMode})}>
              <option value="setter">ستر</option>
              <option value="hatcher">هچر</option>
              <option value="setter+hatcher">ستر + هچر</option>
            </Select>
          </Field>
          <Field label="وضعیت" required>
            <Select value={form.status} onChange={e => setForm({...form, status: e.target.value as DeviceStatus})}>
              <option value="active">✅ فعال</option>
              <option value="idle">⏸ غیرفعال</option>
              <option value="maintenance">🔧 تعمیر</option>
              <option value="broken">❌ خراب</option>
            </Select>
          </Field>
        </Grid2>

        <SectionTitle>📊 ظرفیت بر اساس پرنده</SectionTitle>
        {form.capacityByBird.length === 0 && (
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', textAlign: 'center', padding: 8 }}>
            هنوز پرنده‌ای اضافه نشده
          </div>
        )}
        {form.capacityByBird.map(c => (
          <div key={c.birdName} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 10, background: 'var(--input-bg)', borderRadius: 'var(--r-md)', marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700 }}>{c.birdName}</span>
              <button type="button" onClick={() => removeCapacity(c.birdName)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, padding: 4 }}>✕</button>
            </div>
            <NumField value={String(c.capacity || '')} onChange={e => updateCapacity(c.birdName, parseInt(toEn(e.target.value)) || null)} unit="تخم" min={0} placeholder="۰" />
          </div>
        ))}
        <Grid2>
          <Select onChange={e => { if (e.target.value) { addCapacity(e.target.value); e.target.value = ''; } }} value="">
            <option value="">+ انتخاب از لیست پرنده‌ها...</option>
            {birds.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
          </Select>
          <Input
            id="custom-bird-input"
            placeholder="یا نام دلخواه..."
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const v = (e.target as HTMLInputElement).value.trim();
                if (v) { addCapacity(v); (e.target as HTMLInputElement).value = ''; }
              }
            }}
          />
        </Grid2>
        <Btn variant="primary" size="sm" onClick={() => {
          const el = document.getElementById('custom-bird-input') as HTMLInputElement;
          const v = el?.value.trim();
          if (v) { addCapacity(v); el.value = ''; }
        }} style={{ alignSelf: 'flex-start' }}>+ افزودن پرنده دلخواه</Btn>

        {form.status === 'active' && (
          <>
            <SectionTitle>🌡 شرایط عملیاتی</SectionTitle>
            <Grid2>
              <Field label="دمای هدف" hint="°C">
                <NumField placeholder="۳۷٫۸" value={form.temp} onChange={e => setForm({...form, temp: e.target.value})} unit="°C" min={20} max={45} />
              </Field>
              <Field label="رطوبت هدف" hint="٪">
                <NumField placeholder="۵۵" value={form.humidity} onChange={e => setForm({...form, humidity: e.target.value})} unit="٪" min={0} max={100} />
              </Field>
            </Grid2></>
        )}

        <SectionTitle>⚙ مشخصات فنی</SectionTitle>
        <Grid2>
          <Field label="تعداد راگ" hint="قفسه">
            <NumField placeholder="۰" value={form.racks} onChange={e => setForm({...form, racks: e.target.value})} unit="عدد" min={0} />
          </Field>
          <Field label="تعداد سبد" hint="Tray">
            <NumField placeholder="۰" value={form.trays} onChange={e => setForm({...form, trays: e.target.value})} unit="عدد" min={0} />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="تعداد فن">
            <NumField placeholder="۰" value={form.fans} onChange={e => setForm({...form, fans: e.target.value})} unit="عدد" min={0} />
          </Field>
          <Field label="توان موتور">
            <NumField placeholder="۰" value={form.motorPower} onChange={e => setForm({...form, motorPower: e.target.value})} unit="W" min={0} />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="سنسور دما">
            <NumField placeholder="۰" value={form.tempSensors} onChange={e => setForm({...form, tempSensors: e.target.value})} unit="عدد" min={0} />
          </Field>
          <Field label="سنسور رطوبت">
            <NumField placeholder="۰" value={form.humiditySensors} onChange={e => setForm({...form, humiditySensors: e.target.value})} unit="عدد" min={0} />
          </Field>
        </Grid2>

        <SectionTitle>💰 مالی</SectionTitle>
        <Grid2>
          <Field label="قیمت خرید">
            <MoneyField placeholder="۰" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
          </Field>
          <Field label="تاریخ خرید">
            <DatePicker value={form.purchasedAt} onChange={v => setForm({...form, purchasedAt: v})} />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="گارانتی (ماه)">
            <NumField placeholder="۲۴" value={form.warranty} onChange={e => setForm({...form, warranty: e.target.value})} unit="ماه" min={0} max={120} />
          </Field>
          <Field label="هزینه جانبی" hint="نصب، حمل">
            <MoneyField placeholder="۰" value={form.extraCost} onChange={e => setForm({...form, extraCost: e.target.value})} />
          </Field>
        </Grid2>
        {warrantyEnd && (
          <div style={{ padding: '8px 12px', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', color: 'var(--accent)', fontWeight: 600, textAlign: 'center' }}>
            ✅ گارانتی تا: {toFa(warrantyEnd)}
          </div>
        )}

        <SectionTitle>📝 یادداشت</SectionTitle>
        <Input placeholder="..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />

        {err && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)', textAlign: 'center' }}>✕ {err}</div>}
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="حذف دستگاه"
        footer={<BtnRow><Btn variant="danger" onClick={() => { if (delId) deleteDevice(delId); setDelId(null); }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}>
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)', lineHeight: 1.9 }}>
          حذف <b>{target?.name}</b>؟
        </div>
      </Modal>
    </PageContainer>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '6px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
      <span style={{ color: 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ paddingTop: 12, marginTop: 6, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)' }}>{children}</div>
  );
}
