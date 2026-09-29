import { useState } from 'react';
import { useInc, DEVICE_MODE_LABEL, DEVICE_STATUS_LABEL, type Device, type DeviceMode, type DeviceStatus } from './store';
import { Btn, BtnRow, Empty, Field, Grid2, Grid3, Input, Modal, PageContainer, Select, Tag } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import { toFa, toEn } from '../../shr/utils/fa';
import { showConfirmAsync , showAlert} from '../../cor/store/dialog';

interface F { id?: string; name: string; code: string; capacity: string; mode: DeviceMode; status: DeviceStatus; temp: string; humidity: string; rotationEnabled: boolean; purchasedAt: string; price: string; warranty: string; notes: string; }
const empty: F = { name:'', code:'', capacity:'', mode:'setter+hatcher', status:'idle', temp:'', humidity:'', rotationEnabled:true, purchasedAt:'', price:'', warranty:'', notes:'' };

export default function DevicesPage() {
  const { devices, eggEntries, addDevice, updateDevice, deleteDevice } = useInc();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty);
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const openNew = () => { setForm(empty); setErr(''); setOpen(true); };
  const openEdit = (d: Device) => {
    setForm({
      id: d.id, name: d.name, code: d.code,
      capacity: d.capacity ? toFa(d.capacity) : '',
      mode: d.mode, status: d.status,
      temp: d.temp ? toFa(d.temp) : '',
      humidity: d.humidity ? toFa(d.humidity) : '',
      rotationEnabled: d.rotationEnabled,
      purchasedAt: d.purchasedAt, price: d.price ? toFa(d.price) : '',
      warranty: d.warranty ? toFa(d.warranty) : '', notes: d.notes
    });
    setErr(''); setOpen(true);
  };
  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || null : null;
  const int = (s: string) => s ? parseInt(toEn(s)) || null : null;
  const save = () => {
    // 🔒 جلوگیری قاطع از نام تکراری دستگاه
    if (!form.id) {
      const _trimmed = form.name.trim();
      const _dup = devices.find((x: any) => x.name.trim() === _trimmed);
      if (_dup) {
        showAlert(
          `دستگاهای با نام «${_dup.name}» قبلاً ثبت شده. لطفاً نام دیگری انتخاب کنید یا همان را ویرایش کنید.`,
          '❌ نام تکراری'
        );
        return;
      }
    }

    if (!form.name.trim()) { setErr('نام دستگاه اجباری است'); return; }
    const data = {
      name: form.name.trim(), code: form.code.trim(),
      capacity: int(form.capacity),
      mode: form.mode, status: form.status,
      temp: num(form.temp), humidity: num(form.humidity),
      rotationEnabled: form.rotationEnabled,
      purchasedAt: form.purchasedAt.trim(), price: num(form.price),
      warranty: int(form.warranty), notes: form.notes.trim()
    };
    if (form.id) updateDevice(form.id, data); else addDevice(data);
    setOpen(false);
  };
  const target = delId ? devices.find(d => d.id === delId) : null;

  const accentFor = (s: DeviceStatus): any => s === 'active' ? 'accent' : s === 'idle' ? 'dim' : s === 'maintenance' ? 'warn' : 'warn';

  return (
    <PageContainer>
      {devices.length === 0 ? (
        <Empty icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h8M8 14h8"/></svg>}
          title="هنوز دستگاهی نساخته‌اید" desc="اولین دستگاه جوجه‌کشی خود را اضافه کنید."
          action={<Btn variant="primary" onClick={openNew}>+ افزودن دستگاه</Btn>} />
      ) : (
        <>
          {devices.map((d, i) => {
            const entries = eggEntries.filter(e => e.deviceId === d.id);
            const totalEggs = entries.reduce((a, e) => a + (e.count || 0), 0);
            const activeEntries = entries.filter(e => e.status === 'incubating' || e.status === 'candled' || e.status === 'locked').length;
            const isOpen = expandedId === d.id;
            return (
              <ExpandableCard key={d.id} accent={accentFor(d.status)} index={toFa(i + 1)} iconEmoji="🥚"
                title={d.name}
                subtitle={`${DEVICE_MODE_LABEL[d.mode]} · ${DEVICE_STATUS_LABEL[d.status]}${d.capacity ? ` · ظرفیت ${toFa(d.capacity)}` : ''}`}
                isOpen={isOpen} onToggle={() => setExpandedId(isOpen ? null : d.id)}
                badge={activeEntries > 0 ? <Tag tone="green">{toFa(activeEntries)} بچ فعال</Tag> : undefined}
                summary={<>
                  {totalEggs > 0 && <span>تخم‌ها: <b style={{ color: 'var(--text)' }}>{toFa(totalEggs)}</b></span>}
                  {d.temp && <span>دما: <b style={{ color: 'var(--text)' }}>{toFa(d.temp)}°</b></span>}
                  {d.humidity && <span>رطوبت: <b style={{ color: 'var(--text)' }}>{toFa(d.humidity)}٪</b></span>}
                </>}
              >
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>⚙ مشخصات دستگاه</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Row l="نام" v={d.name} />
                  {d.code && <Row l="کد" v={d.code} />}
                  <Row l="حالت" v={DEVICE_MODE_LABEL[d.mode]} />
                  <Row l="وضعیت" v={DEVICE_STATUS_LABEL[d.status]} />
                  {d.capacity && <Row l="ظرفیت" v={`${toFa(d.capacity)} تخم مرغ`} />}
                  <Row l="چرخش خودکار" v={d.rotationEnabled ? '✓ فعال' : '✕ غیرفعال'} />
                </div>

                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>🌡 شرایط</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {d.temp && <Row l="دمای هدف" v={`${toFa(d.temp)} °C`} />}
                  {d.humidity && <Row l="رطوبت هدف" v={`${toFa(d.humidity)} ٪`} />}
                </div>

                {(d.purchasedAt || d.price || d.warranty) && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>💰 مالی</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {d.price && <Row l="قیمت خرید" v={`${toFa(d.price.toLocaleString('fa-IR'))} ت`} />}
                      {d.purchasedAt && <Row l="تاریخ خرید" v={toFa(d.purchasedAt)} />}
                      {d.warranty && <Row l="گارانتی" v={`${toFa(d.warranty)} ماه`} />}
                    </div>
                  </>
                )}

                {d.notes && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>📝 یادداشت</div>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: '8px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{d.notes}</div>
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
        <Field label="نام دستگاه" required><Input placeholder="مثلاً: دستگاه ۱" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></Field>
        <Grid2>
          <Field label="کد"><Input placeholder="D-01" dir="ltr" value={form.code} onChange={e => setForm({...form, code: e.target.value})} /></Field>
          <Field label="ظرفیت"><Input placeholder="۵۰۰" inputMode="numeric" dir="ltr" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} unit="تخم" min={0} /></Field>
        </Grid2>
        <Grid2>
          <Field label="حالت" required>
            <Select value={form.mode} onChange={e => setForm({...form, mode: e.target.value as DeviceMode})}>
              <option value="setter">فقط Setter</option>
              <option value="hatcher">فقط Hatcher</option>
              <option value="setter+hatcher">Setter + Hatcher</option>
            </Select>
          </Field>
          <Field label="وضعیت">
            <Select value={form.status} onChange={e => setForm({...form, status: e.target.value as DeviceStatus})}>
              <option value="active">فعال</option>
              <option value="idle">خاموش</option>
              <option value="maintenance">در تعمیر</option>
              <option value="broken">خراب</option>
            </Select>
          </Field>
        </Grid2>
        <Grid2>
          <Field label="دمای هدف"><Input placeholder="۳۷٫۸" inputMode="decimal" dir="ltr" value={form.temp} onChange={e => setForm({...form, temp: e.target.value})} unit="°C" {min={-10}} /></Field>
          <Field label="رطوبت هدف"><Input placeholder="۵۵" inputMode="numeric" dir="ltr" value={form.humidity} onChange={e => setForm({...form, humidity: e.target.value})} unit="٪" {min={-10}} /></Field>
        </Grid2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
          <div style={{ fontSize: 'var(--fs-base)', fontWeight: 600 }}>چرخش خودکار</div>
          <button onClick={() => setForm({...form, rotationEnabled: !form.rotationEnabled})} style={{ width: 38, height: 22, borderRadius: 11, background: form.rotationEnabled ? 'var(--accent)' : 'var(--dim)', position: 'relative', border: 'none', cursor: 'pointer', padding: 0 }}>
            <span style={{ position: 'absolute', top: 2, right: form.rotationEnabled ? 18 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'right .2s' }} />
          </button>
        </div>
        <Grid3>
          <Field label="قیمت خرید"><Input placeholder="۰" inputMode="numeric" dir="ltr" value={form.price} onChange={e => setForm({...form, price: e.target.value})} unit="ت" {min={1}} /></Field>
          <Field label="تاریخ خرید"><Input placeholder="۱۴۰۵/۰۷/۰۴" value={form.purchasedAt} onChange={e => setForm({...form, purchasedAt: e.target.value})} /></Field>
          <Field label="گارانتی"><Input placeholder="۱۲" inputMode="numeric" dir="ltr" value={form.warranty} onChange={e => setForm({...form, warranty: e.target.value})} unit="ماه" min={0} /></Field>
        </Grid3>
        <Field label="یادداشت"><Input placeholder="..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></Field>
        {err && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)' }}>✕ {err}</div>}
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="حذف دستگاه"
        footer={<BtnRow><Btn variant="danger" onClick={() => { if (delId) deleteDevice(delId); setDelId(null); }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}>
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)', lineHeight: 1.9 }}>
          حذف <b>{target?.name}</b>؟
          <br /><span style={{ color: 'var(--muted)', fontSize: 'var(--fs-base)' }}>تمام ورودی‌های تخم و کندلینگ‌های آن هم حذف می‌شوند.</span>
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
