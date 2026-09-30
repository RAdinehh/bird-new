/**
 * DevicesPage — دستگاه‌های انکوباسیون (ظرفیت، تعمیرات، گارانتی)
 */
import { useState, useMemo } from 'react';
import { useInc, type Device, type DeviceMode, type DeviceStatus, type DeviceCapacity } from './store';
import { useSet } from '../set/store';
import { useBrd } from '../brd/store';
import { Btn, BtnRow, Empty, Field, Grid2, Input, Modal, MoneyField, NumField, PageContainer, Select, SectionTitle, Tag, ErrorBox } from '../../shr/components/ui';
import ExpandableCard, { StatBox, Dot } from '../../shr/components/ExpandableCard';
import DatePicker from '../../shr/components/DatePicker';
import { toFa, toEn } from '../../shr/utils/fa';
import { showAlert, showConfirmAsync } from '../../cor/store/dialog';
import { parse as parseJ, addMonths, format as formatJ } from 'date-fns-jalali';
import { Row } from './helpers';

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

function normalizeBird(name: string): string {
  return (name || '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/\s+/g, ' ').trim();
}

function warrantyInfo(purchasedAt: string, months: number | null): { end: string; expired: boolean } | null {
  if (!purchasedAt || !months) return null;
  try {
    const d = parseJ(toEn(purchasedAt), 'yyyy/MM/dd', new Date());
    if (isNaN(d.getTime())) return null;
    const end = formatJ(addMonths(d, months), 'yyyy/MM/dd');
    const t = new Date();
    const today = formatJ(t, 'yyyy/MM/dd');
    return { end, expired: end < today };
  } catch { return null; }
}

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

  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫', '.')) || null : null;
  const int = (s: string) => s ? parseInt(toEn(s)) || null : null;

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

  const addCapacity = (birdName: string) => {
    if (!birdName.trim()) return;
    if (form.capacityByBird.some(c => normalizeBird(c.birdName) === normalizeBird(birdName))) return;
    const profile = profiles.find(p => normalizeBird(p.birdName) === normalizeBird(birdName));
    setForm(f => ({
      ...f,
      capacityByBird: [...f.capacityByBird, { birdName, capacity: null }],
      temp: f.temp || (profile ? String(profile.setterTemp) : ''),
      humidity: f.humidity || (profile ? String(profile.setterHumidity) : ''),
    }));
  };

  const removeCapacity = (birdName: string) => {
    setForm(f => ({ ...f, capacityByBird: f.capacityByBird.filter(c => normalizeBird(c.birdName) !== normalizeBird(birdName)) }));
  };

  const updateCapacity = (birdName: string, capacity: number | null) => {
    setForm(f => ({
      ...f,
      capacityByBird: f.capacityByBird.map(c => normalizeBird(c.birdName) === normalizeBird(birdName) ? { ...c, capacity } : c),
    }));
  };

  const save = () => {
    if (!form.id) {
      const dup = devices.find((x: any) => x.name.trim() === form.name.trim());
      if (dup) { showAlert('دستگاهی با نام «' + dup.name + '» قبلاً ثبت شده', '❌ نام تکراری'); return; }
    }
    if (!form.name.trim()) { setErr('نام دستگاه اجباری است'); return; }
    const data = {
      name: form.name.trim(),
      code: '',
      capacity: null,
      capacityByBird: form.capacityByBird,
      mode: form.mode,
      status: form.status,
      temp: num(form.temp),
      humidity: num(form.humidity),
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
    const logs = [...((dev as any).maintenanceLogs || []), log];
    updateDevice(deviceId, { maintenanceLogs: logs } as any);
    setMaintForm({ date: '', type: '', cost: '', description: '' });
    setMaintDeviceId(null);
    showAlert('تعمیر ثبت شد', '✅');
  };

  const removeMaintenance = async (deviceId: string, logId: string) => {
    const dev = devices.find(d => d.id === deviceId);
    if (!dev) return;
    if (!await showConfirmAsync('تأیید', 'حذف این رکورد تعمیر؟', { danger: true })) return;
    const logs = ((dev as any).maintenanceLogs || []).filter((l: any) => l.id !== logId);
    updateDevice(deviceId, { maintenanceLogs: logs } as any);
  };

  const target = delId ? devices.find(d => d.id === delId) : null;
  const accentFor = (s: DeviceStatus): any => s === 'active' ? 'accent' : s === 'idle' ? 'dim' : 'warn';
  const warrantyForm = warrantyInfo(form.purchasedAt, parseInt(toEn(form.warranty)) || null);

  return (
    <PageContainer>
      {devices.length === 0 ? (
        <Empty icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="4" y="2" width="16" height="20" rx="2"/></svg>}
          title="هنوز دستگاهی نساخته‌اید" desc="اولین دستگاه جوجه‌کشی خود را اضافه کنید."
          action={<Btn variant="primary" onClick={openNew}>+ افزودن دستگاه</Btn>} />
      ) : (
        <>
          {devices.map((d, i) => {
            const entries = eggEntries.filter(e => e.deviceId === d.id);
            const totalEggs = entries.reduce((a, e) => a + (e.count || 0), 0);
            const activeEntries = entries.filter(e => e.status === 'incubating' || e.status === 'candled' || e.status === 'locked').length;
            const isOpen = expandedId === d.id;
            const caps = d.capacityByBird || [];
            const logs: any[] = (d as any).maintenanceLogs || [];
            const totalCap = caps.reduce((a, c) => a + (c.capacity || 0), 0);
            const usagePercent = totalCap > 0 ? Math.round((totalEggs / totalCap) * 100) : 0;
            const w = warrantyInfo(d.purchasedAt, d.warranty);
            return (
              <ExpandableCard key={d.id} accent={accentFor(d.status)} index={toFa(i + 1)} iconEmoji="🥚"
                title={d.name} subtitle={MODE_FA[d.mode] + ' · ' + STATUS_FA[d.status]}
                isOpen={isOpen} onToggle={() => setExpandedId(isOpen ? null : d.id)}
                badge={activeEntries > 0 ? <Tag tone="green">{toFa(activeEntries)} ورودی فعال</Tag> : undefined}
                stats={<>
                  <StatBox icon="📊" label="استفاده" value={toFa(totalEggs) + '/' + toFa(totalCap)} tone={usagePercent > 90 ? 'warn' : 'accent'} />
                  <Dot />
                  <StatBox icon="🔄" label="ورودی" value={toFa(activeEntries)} />
                  <Dot />
                  <StatBox icon="🛠" label="تعمیر" value={toFa(logs.length)} />
                </>}
              >
                {caps.length > 0 && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>📊 ظرفیت</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {caps.map(c => (
                        <div key={c.birdName} style={{ padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
                          <span>{c.birdName}</span>
                          <span style={{ fontWeight: 600 }}>{c.capacity ? toFa(c.capacity) : '—'}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {(d.temp || d.humidity) && (
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
                    {w && w.expired && (
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)', fontWeight: 700, padding: '4px 8px', background: 'var(--danger-soft)', borderRadius: 'var(--r-sm)', textAlign: 'center' }}>
                        ⏰ گارانتی تمام شده ({toFa(w.end)})
                      </div>
                    )}
                  </>
                )}

                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>🛠 تعمیرات</div>
                {logs.length === 0 ? (
                  <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', padding: 8, textAlign: 'center' }}>تعمیری ثبت نشده</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4 }}>
                    {logs.slice().reverse().slice(0, 6).map((m: any) => (
                      <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 'var(--fs-sm)', padding: '8px 24px 8px 8px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', position: 'relative' }}>
                        <button
                          type="button"
                          onClick={() => removeMaintenance(d.id, m.id)}
                          title="حذف"
                          aria-label="حذف"
                          style={{
                            position: 'absolute',
                            top: 3,
                            left: 3,
                            background: 'var(--danger-soft)',
                            border: '1px solid var(--danger)',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            borderRadius: 'var(--r-sm)',
                            fontSize: 10,
                            lineHeight: 1,
                            padding: '2px 5px',
                            fontWeight: 700,
                            minWidth: 18,
                            height: 18,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'inherit',
                          }}
                        >✕</button>
                        <span style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.type}</span>
                        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{toFa(m.date)}</span>
                        {m.cost ? <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 600 }}>{toFa(m.cost.toLocaleString('fa-IR'))} ت</span> : null}
                      </div>
                    ))}
                  </div>
                )}
                <Btn size="sm" full onClick={() => { setMaintDeviceId(d.id); setMaintForm({ date: '', type: '', cost: '', description: '' }); }}>+ ثبت تعمیر</Btn>

                {d.notes && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>📝 یادداشت</div>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 8, background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{d.notes}</div>
                  </>
                )}

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
          <Input placeholder="مثلاً — دستگاه ۱" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
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
        {birds.length === 0 ? (
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', padding: 10, textAlign: 'center', background: 'var(--input-bg)', borderRadius: 'var(--r-md)' }}>
            هنوز پرنده‌ای در ماژول «پرنده و نژاد» ثبت نشده
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {birds.map(b => (
              <button
                key={b.id}
                type="button"
                onClick={() => addCapacity(b.name)}
                style={{
                  padding: '6px 12px',
                  background: 'var(--btn-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 'var(--fs-sm)',
                  fontWeight: 600,
                }}
              >+ {b.name}</button>
            ))}
          </div>
        )}
        {form.capacityByBird.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            {form.capacityByBird.map(c => (
              <div key={c.birdName} style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700 }}>{c.birdName}</span>
                  <button type="button" onClick={() => removeCapacity(c.birdName)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 'var(--fs-xs)', padding: 0 }}>✕</button>
                </div>
                <NumField value={String(c.capacity || '')} onChange={e => updateCapacity(c.birdName, parseInt(toEn(e.target.value)) || null)} unit="تخم" min={0} placeholder="۰" />
              </div>
            ))}
          </div>
        )}

        <SectionTitle>🌡 شرایط عملیاتی</SectionTitle>
        <Grid2>
          <Field label="دمای هدف" hint="°C">
            <NumField placeholder="۳۷٫۸" value={form.temp} onChange={e => setForm({...form, temp: e.target.value})} unit="°C" min={20} max={45} />
          </Field>
          <Field label="رطوبت هدف" hint="٪">
            <NumField placeholder="۵۵" value={form.humidity} onChange={e => setForm({...form, humidity: e.target.value})} unit="٪" min={0} max={100} />
          </Field>
        </Grid2>

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
        {warrantyForm && (
          <div style={{ padding: 'var(--pad-normal)', background: warrantyForm.expired ? 'var(--danger-soft)' : 'var(--accent-soft)', border: '1px solid ' + (warrantyForm.expired ? 'var(--danger)' : 'var(--accent-border)'), borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', color: warrantyForm.expired ? 'var(--danger)' : 'var(--accent)', fontWeight: 700, textAlign: 'center' }}>
            {warrantyForm.expired ? '⏰ گارانتی تمام شده — ' : '✅ گارانتی تا — '}{toFa(warrantyForm.end)}
          </div>
        )}

        <SectionTitle>📝 یادداشت</SectionTitle>
        <Input placeholder="..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />

        <ErrorBox>{err}</ErrorBox>
      </Modal>

      <Modal open={!!maintDeviceId} onClose={() => setMaintDeviceId(null)} title="ثبت تعمیر"
        footer={<BtnRow><Btn variant="primary" onClick={() => { if (maintDeviceId) addMaintenance(maintDeviceId); }}>ذخیره</Btn><Btn onClick={() => setMaintDeviceId(null)}>لغو</Btn></BtnRow>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field label="تاریخ" required>
            <DatePicker value={maintForm.date} onChange={v => setMaintForm({ ...maintForm, date: v })} />
          </Field>
          <Field label="نوع تعمیر" required>
            <Input placeholder="تعویض فن..." value={maintForm.type} onChange={e => setMaintForm({ ...maintForm, type: e.target.value })} />
          </Field>
          <Field label="هزینه">
            <MoneyField placeholder="۰" value={maintForm.cost} onChange={e => setMaintForm({ ...maintForm, cost: e.target.value })} />
          </Field>
          <Field label="توضیحات">
            <Input placeholder="جزئیات..." value={maintForm.description} onChange={e => setMaintForm({ ...maintForm, description: e.target.value })} />
          </Field>
        </div>
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
