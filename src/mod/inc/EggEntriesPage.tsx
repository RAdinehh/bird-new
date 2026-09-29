import ProgressTracker from '../../shr/components/ProgressTracker';
import { useState, useMemo } from 'react';
import {
  useInc, DEAL_LABEL, ENTRY_STATUS_LABEL, addDaysJalali,
  daysAgo, daysToHatch, isLockdown, isHatchWindow,
  incubationDays, type EggEntry, type DealType
} from './store';
import { useBrd } from '../brd/store';
import { useFlk } from '../flk/store';
import { useCtc } from '../ctc/store';
import { useTra } from '../tra/store';
import { useEgg } from '../egg/store';
import { Btn, BtnRow, Empty, Field, Grid2, Input, Modal, MoneyField, NumField, PageContainer, SectionTitle, Select, Tag } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import DatePicker from '../../shr/components/DatePicker';
import { toFa, toEn } from '../../shr/utils/fa';
import { clampPercent, complement } from '../../shr/utils/smart';
import { showAlert } from '../../cor/store/dialog';
import SmartSelect from '../../shr/components/SmartSelect';

interface F {
  id?: string;
  deviceId: string;
  birdId: string;
  breedId: string;
  count: string;
  entryDate: string;
  trayNumbers: string;
  dealType: DealType;
  dealData: Record<string, string>;
  dealStatus: 'active' | 'withdrawn';
  dealWithdrawnAt: string;
  dealWithdrawnReason: string;
  flockId: string;
  unitPrice: string;
  shippingCost: string;
  notes: string;
}

const empty = (): F => ({
  deviceId: '', birdId: '', breedId: '', count: '',
  entryDate: '', trayNumbers: '',
  dealType: 'own', dealData: {}, dealStatus: 'active',
  dealWithdrawnAt: '', dealWithdrawnReason: '', flockId: '',
  unitPrice: '', shippingCost: '', notes: '',
});

export default function EggEntriesPage({ initialDevice = '', onGoTo }: { initialDevice?: string; onGoTo?: (t: any) => void } = {}) {
  const { devices, eggEntries, candlings, hatches, addEntry, updateEntry, deleteEntry } = useInc();
  const { birds, breeds } = useBrd();
  const { flocks } = useFlk();
  const { contacts } = useCtc();
  const { addInvoice, deleteInvoice } = useTra();
  const { addProduction, deleteProduction } = useEgg();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty());
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterDev, setFilterDev] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [q, setQ] = useState('');

  const suppliers = useMemo(() => (contacts || []).filter((p: any) => (p.roles || []).includes('supplier')), [contacts]);
  const allPersons = contacts || [];

  const openNew = () => {
    if (devices.length === 0) { showAlert('اول یک دستگاه بسازید'); return; }
    if (birds.length === 0) { showAlert('اول پرنده بسازید'); return; }
    setForm({ ...empty(), deviceId: initialDevice || devices[0].id, birdId: birds[0].id });
    setErr(''); setOpen(true);
  };

  const openEdit = (e: EggEntry) => {
    setForm({
      id: e.id, deviceId: e.deviceId, birdId: e.birdId, breedId: e.breedId,
      count: e.count ? toFa(e.count) : '',
      entryDate: e.entryDate,
      trayNumbers: e.trayNumbers,
      dealType: e.dealType,
      dealData: Object.fromEntries(Object.entries(e.dealData || {}).map(([k, v]) => [k, v == null ? '' : String(v)])),
      dealStatus: (e as any).dealStatus || 'active',
      dealWithdrawnAt: (e as any).dealWithdrawnAt || '',
      dealWithdrawnReason: (e as any).dealWithdrawnReason || '',
      flockId: (e as any).flockId || '',
      unitPrice: e.unitPrice ? toFa(e.unitPrice) : '',
      shippingCost: (e as any).shippingCost ? toFa((e as any).shippingCost) : '',
      notes: e.notes,
    });
    setErr(''); setOpen(true);
  };

  const setD = (k: string, v: string) => setForm(f => ({ ...f, dealData: { ...f.dealData, [k]: v } }));
  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫', '.')) || null : null;
  const int = (s: string) => s ? parseInt(toEn(s)) || null : null;

  const selectedDevice = devices.find(d => d.id === form.deviceId);
  const selectedBird = birds.find(b => b.id === form.birdId);
  const maxCapacity = useMemo(() => {
    if (!selectedDevice || !selectedBird) return 0;
    const cap = (selectedDevice.capacityByBird || []).find(c => c.birdName === selectedBird.name);
    return cap?.capacity || 0;
  }, [selectedDevice, selectedBird]);

  const save = () => {
    if (!form.count.trim() || !form.entryDate.trim()) { setErr('تعداد و تاریخ ورود اجباری است'); return; }
    if (maxCapacity && (parseInt(toEn(form.count)) || 0) > maxCapacity) {
      if (!confirm('تعداد (' + toFa(parseInt(toEn(form.count))) + ') از ظرفیت (' + toFa(maxCapacity) + ') بیشتر است. ادامه؟')) return;
    }
    const bird = birds.find(b => b.id === form.birdId);
    const birdName = bird?.name || 'مرغ';
    const expectedHatchDate = addDaysJalali(form.entryDate, incubationDays(birdName));
    const dealData: Record<string, any> = {};
    for (const [k, v] of Object.entries(form.dealData)) {
      const n = parseFloat(toEn(v).replace('٫', '.'));
      dealData[k] = !isNaN(n) && String(n) === toEn(v).replace('٫', '.') ? n : v;
    }
    const count = int(form.count);
    const unitPrice = num(form.unitPrice);
    const data = {
      deviceId: form.deviceId,
      hatchGroupId: '',
      birdId: form.birdId,
      breedId: form.breedId,
      count,
      entryDate: form.entryDate,
      expectedHatchDate,
      source: form.dealType === 'own' ? 'own' : 'external',
      dealType: form.dealType,
      dealStatus: form.dealStatus,
      dealWithdrawnAt: form.dealWithdrawnAt,
      dealWithdrawnReason: form.dealWithdrawnReason,
      dealData,
      flockId: form.flockId,
      trayNumbers: form.trayNumbers.trim(),
      unitPrice,
      totalPrice: count && unitPrice ? count * unitPrice : null,
      shippingCost: num(form.shippingCost),
      status: 'incubating' as const,
      notes: form.notes.trim(),
    };
    if (form.id) updateEntry(form.id, data as any);
    else {
      addEntry(data as any);
      // ═══ اتصال خودکار به ماژول‌های دیگر ═══
      try {
        const countNum = parseInt(toEn(form.count)) || 0;
        const unitPriceNum = parseFloat(toEn(form.unitPrice).replace('٫', '.')) || 0;
        const shippingNum = parseFloat(toEn(form.shippingCost).replace('٫', '.')) || 0;
        const deviceName = devices.find(d => d.id === form.deviceId)?.name || '';

        if (form.dealType === 'purchase' && form.dealData.sellerId) {
          const totalAmount = (countNum * unitPriceNum) + shippingNum;
          if (totalAmount > 0) {
            addInvoice({
              type: 'purchase',
              date: form.entryDate,
              partyId: form.dealData.sellerId,
              category: 'egg',
              items: [{
                id: 'egg-' + Date.now(),
                name: 'تخم نطفه‌دار',
                quantity: countNum,
                unit: 'عدد',
                unitPrice: unitPriceNum,
                total: countNum * unitPriceNum,
              }],
              total: totalAmount,
              payments: [],
              dueDate: form.entryDate,
              relatedFlockId: '',
              relatedEntryId: '',
              notes: 'خرید تخم — ' + deviceName,
            } as any);
          }
        } else if (form.dealType === 'own' && form.flockId) {
          addProduction({
            flockId: form.flockId,
            date: form.entryDate,
            totalCount: countNum,
            brokenCount: 0,
            softCount: 0,
            dirtyCount: 0,
            avgWeight: null,
            notes: 'ورودی به جوجه‌کشی — ' + deviceName,
          });
        } else if (form.dealType === 'rent' && form.dealData.lessorId && form.dealData.rentAmount) {
          const rentAmount = parseFloat(toEn(form.dealData.rentAmount).replace('٫', '.')) || 0;
          if (rentAmount > 0) {
            const rentInvId = addInvoice({
              type: 'purchase',
              date: form.entryDate,
              partyId: form.dealData.lessorId,
              category: 'service',
              items: [{
                id: 'rent-' + Date.now(),
                name: 'اجاره دستگاه جوجه‌کشی',
                quantity: 1,
                unit: 'خدمت',
                unitPrice: rentAmount,
                total: rentAmount,
              }],
              total: rentAmount,
              payments: [],
              dueDate: form.dealData.rentDueDate || form.entryDate,
              relatedFlockId: '',
              relatedEntryId: '',
              notes: 'اجاره — ' + deviceName,
            } as any);
          }
        }
      } catch (e) { /* silent */ }
      setOpen(false);
      if (onGoTo && confirm('ورودی ثبت شد. به کندلینگ برو؟')) {
        setTimeout(() => onGoTo('candlings'), 100);
        return;
      }
    }
    setOpen(false);
  };

  const breedsForBird = breeds.filter(b => b.birdId === form.birdId);

  const list = useMemo(() => {
    return eggEntries.filter(e => {
      if (filterDev && e.deviceId !== filterDev) return false;
      if (filterSource && e.dealType !== filterSource) return false;
      if (filterStatus && e.status !== filterStatus) return false;
      if (q.trim()) {
        const t = q.trim().toLowerCase();
        const dev = devices.find(d => d.id === e.deviceId);
        const bird = birds.find(b => b.id === e.birdId);
        const partnerName = (e.dealData?.partnerId && (contacts.find((c: any) => c.id === e.dealData.partnerId) as any)?.name) || e.dealData?.partnerName || '';
        const sellerName = (e.dealData?.sellerId && (contacts.find((c: any) => c.id === e.dealData.sellerId) as any)?.name) || e.dealData?.sellerName || '';
        const haystack = [dev?.name, bird?.name, partnerName, sellerName, e.trayNumbers, e.notes].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(t)) return false;
      }
      return true;
    });
  }, [eggEntries, filterDev, filterSource, filterStatus, q, devices, birds, contacts]);

  const target = delId ? eggEntries.find(e => e.id === delId) : null;

  return (
    <PageContainer>
      {devices.length > 0 && eggEntries.length > 0 && (
        <>
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="🔍 جستجو (گله، فروشنده، شریک، یادداشت...)" />
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            <button onClick={() => { setFilterDev(''); setFilterSource(''); setFilterStatus(''); }} style={chip(!filterDev && !filterSource && !filterStatus)}>همه</button>
            {devices.map(d => (
              <button key={d.id} onClick={() => setFilterDev(filterDev === d.id ? '' : d.id)} style={chip(filterDev === d.id)}>{d.name}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            <span style={{ color: 'var(--muted)', alignSelf: 'center', fontSize: 'var(--fs-xs)' }}>منبع:</span>
            {[
              { id: 'own', label: '🏠 خودم' },
              { id: 'purchase', label: '📥 خریداری' },
              { id: 'partnership', label: '🤝 شراکتی' },
              { id: 'rent', label: '🏢 اجاره' },
              { id: 'consignment', label: '📦 امانی' },
            ].map(src => (
              <button key={src.id} onClick={() => setFilterSource(filterSource === src.id ? '' : src.id)} style={chip(filterSource === src.id)}>{src.label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            <span style={{ color: 'var(--muted)', alignSelf: 'center', fontSize: 'var(--fs-xs)' }}>وضعیت:</span>
            {[
              { id: 'incubating', label: 'در انکوباسیون' },
              { id: 'candled', label: 'کندل‌شده' },
              { id: 'locked', label: 'Lock-down' },
              { id: 'hatched', label: 'هچ‌شده' },
              { id: 'failed', label: 'ناموفق' },
            ].map(st => (
              <button key={st.id} onClick={() => setFilterStatus(filterStatus === st.id ? '' : st.id)} style={chip(filterStatus === st.id)}>{st.label}</button>
            ))}
          </div>
        </>
      )}

      {list.length === 0 ? (
        <Empty icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><ellipse cx="12" cy="14" rx="7" ry="9"/></svg>}
          title={eggEntries.length === 0 ? 'هنوز تخمی وارد دستگاه نشده' : 'ورودی مطابق فیلتر نیست'}
          desc={devices.length === 0 ? 'اول یک دستگاه بسازید.' : 'اولین بچ خود را ثبت کنید.'}
          action={<Btn variant="primary" onClick={openNew}>+ ورود تخم</Btn>} />
      ) : (
        <>
          {list.map((e, i) => {
            const dev = devices.find(d => d.id === e.deviceId);
            const bird = birds.find(b => b.id === e.birdId);
            const breed = breeds.find(b => b.id === e.breedId);
            const age = daysAgo(e.entryDate);
            const remain = daysToHatch(e.expectedHatchDate);
            const locked = isLockdown(e);
            const hatchWindow = isHatchWindow(e);
            const myCandlings = candlings.filter(c => c.eggEntryId === e.id);
            const myHatch = hatches.find(h => h.eggEntryId === e.id);
            const isOpen = expandedId === e.id;

            let accent: any = 'accent';
            if (hatchWindow) accent = 'purple';
            else if (locked) accent = 'warn';

            let statusLabel = ENTRY_STATUS_LABEL[e.status];
            let statusTone: any = 'green';
            if (hatchWindow) { statusLabel = 'پنجره هچ'; statusTone = 'purple'; }
            else if (locked) { statusLabel = 'Lock-down'; statusTone = 'amber'; }
            else if (remain > 0) { statusLabel = toFa(remain) + ' روز مانده'; statusTone = 'blue'; }
            else if (myHatch) { statusLabel = 'هچ‌شده'; statusTone = 'green'; }

            const partnerName = (e.dealData?.partnerId && (contacts.find((c: any) => c.id === e.dealData.partnerId) as any)?.name) || e.dealData?.partnerName || '';
            const sellerName = (e.dealData?.sellerId && (contacts.find((c: any) => c.id === e.dealData.sellerId) as any)?.name) || e.dealData?.sellerName || '';
            const consigneeName = (e.dealData?.consigneeId && (contacts.find((c: any) => c.id === e.dealData.consigneeId) as any)?.name) || e.dealData?.consigneeName || '';
            const lessorName = (e.dealData?.lessorId && (contacts.find((c: any) => c.id === e.dealData.lessorId) as any)?.name) || '';

            return (
              <ExpandableCard key={e.id} accent={accent} index={toFa(i + 1)} iconEmoji="🥚"
                title={toFa(e.count || 0) + ' تخم · ' + (bird?.name || '—') + (breed ? ' (' + breed.name + ')' : '')}
                subtitle={(dev?.name || '—') + ' · روز ' + toFa(age) + ' از ' + toFa(incubationDays(bird?.name || 'مرغ'))}
                isOpen={isOpen} onToggle={() => setExpandedId(isOpen ? null : e.id)}
                badge={<Tag tone={statusTone}>{statusLabel}</Tag>}
                summary={<>
                  <span>ورود: <b style={{ color: 'var(--text)' }}>{toFa(e.entryDate)}</b></span>
                  {e.expectedHatchDate && <span>هچ: <b style={{ color: 'var(--text)' }}>{toFa(e.expectedHatchDate)}</b></span>}
                  <span>{DEAL_LABEL[e.dealType]}</span>
                </>}
              >
                {(() => {
                  const b = birds.find(x => x.id === e.birdId);
                  const total = incubationDays(b?.name || 'مرغ');
                  return <ProgressTracker current={age} target={total} label={hatchWindow ? 'پنجره هچ باز است' : locked ? 'در Lock-down' : 'در حال انکوباسیون'} unit="روز" color={hatchWindow ? 'purple' : locked ? 'warn' : 'accent'} />;
                })()}

                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>📋 مشخصات</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Row l="دستگاه" v={dev?.name || '—'} />
                  <Row l="پرنده" v={(bird?.name || '—') + (breed ? ' · ' + breed.name : '')} />
                  <Row l="تعداد" v={toFa(e.count || 0) + ' تخم'} />
                  <Row l="تاریخ ورود" v={toFa(e.entryDate)} />
                  <Row l="هچ پیش‌بینی" v={toFa(e.expectedHatchDate)} />
                  {e.trayNumbers && <Row l="طبقات" v={e.trayNumbers} />}
                  <Row l="وضعیت" v={ENTRY_STATUS_LABEL[e.status]} />
                </div>

                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>🤝 منبع</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Row l="نوع" v={DEAL_LABEL[e.dealType]} />
                  {e.dealType === 'own' && (e as any).flockId && <Row l="گله" v={(flocks.find((f: any) => f.id === (e as any).flockId)?.name) || '—'} />}
                  {e.dealType === 'purchase' && sellerName && <Row l="فروشنده" v={String(sellerName)} />}
                  {e.dealType === 'partnership' && partnerName && <Row l="شریک" v={String(partnerName)} />}
                  {e.dealType === 'partnership' && e.dealData.partnerPercent && <Row l="درصد شریک" v={toFa(e.dealData.partnerPercent) + '٪'} />}
                  {e.dealType === 'rent' && lessorName && <Row l="اجاره‌دهنده" v={String(lessorName)} />}
                  {e.dealType === 'rent' && e.dealData.rentAmount && <Row l="اجاره" v={toFa(Number(e.dealData.rentAmount).toLocaleString('fa-IR')) + ' ت'} />}
                  {e.dealType === 'consignment' && consigneeName && <Row l="امانت‌دار" v={String(consigneeName)} />}
                  {(e as any).dealStatus === 'withdrawn' && (
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)', fontWeight: 700, padding: '4px 8px', background: 'var(--danger-soft)', borderRadius: 'var(--r-sm)' }}>
                      ⚠️ کنار کشیده {((e as any).dealWithdrawnAt ? ' (' + toFa((e as any).dealWithdrawnAt) + ')' : '')}
                    </div>
                  )}
                </div>

                {(e.unitPrice || e.totalPrice || (e as any).shippingCost) && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>💰 مالی</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {e.unitPrice && <Row l="قیمت هر تخم" v={toFa(e.unitPrice.toLocaleString('fa-IR')) + ' ت'} />}
                      {(e as any).shippingCost && <Row l="هزینه حمل" v={toFa((e as any).shippingCost.toLocaleString('fa-IR')) + ' ت'} />}
                      {e.totalPrice && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '8px 10px', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
                          <span>جمع تخم:</span><span>{toFa(e.totalPrice.toLocaleString('fa-IR'))} ت</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {e.notes && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>📝 یادداشت</div>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: '8px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{e.notes}</div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => openEdit(e)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={() => setDelId(e.id)} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          <Btn variant="primary" full onClick={openNew}>+ ورود تخم</Btn>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'ویرایش ورودی تخم' : 'ورود تخم به دستگاه'}
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}>

        <SectionTitle>📦 دستگاه و منبع</SectionTitle>
        <Grid2>
          <Field label="دستگاه" required>
            <SmartSelect value={form.deviceId} onChange={v => setForm(f => ({ ...f, deviceId: v }))} options={devices.map(c => ({ value: c.id, label: c.name }))} placeholder="— انتخاب —" modalTitle="انتخاب دستگاه" autoThreshold={6} />
          </Field>
          <Field label="نوع منبع" required>
            <Select value={form.dealType} onChange={e => setForm({ ...form, dealType: e.target.value as DealType, dealData: {}, flockId: '' })}>
              <option value="own">🏠 گله خودم</option>
              <option value="partnership">🤝 شراکتی</option>
              <option value="purchase">📥 خریداری</option>
              <option value="rent">🏢 اجاره‌ای</option>
              <option value="consignment">📦 امانی</option>
            </Select>
          </Field>
        </Grid2>
        {maxCapacity > 0 && (
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', padding: '0 4px' }}>ظرفیت دستگاه: {toFa(maxCapacity)} تخم</div>
        )}

        {form.dealType === 'own' && (
          <Field label="انتخاب گله" hint="گله‌ای که تخم از آن آمده">
            {flocks.filter((fl: any) => fl.status === 'active').length === 0 ? (
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', padding: 10, textAlign: 'center', background: 'var(--input-bg)', borderRadius: 'var(--r-md)' }}>
                هنوز گله فعالی ثبت نشده — اول از ماژول گله اضافه کنید
              </div>
            ) : (
              <Select value={form.flockId} onChange={e => {
                const fid = e.target.value;
                const fl = flocks.find((x: any) => x.id === fid);
                setForm(f => ({
                  ...f,
                  flockId: fid,
                  birdId: fl?.birdId || f.birdId,
                  breedId: fl?.breedId || f.breedId,
                }));
              }}>
                <option value="">— انتخاب گله —</option>
                {flocks.filter((fl: any) => fl.status === 'active').map((fl: any) => <option key={fl.id} value={fl.id}>{fl.name}</option>)}
              </Select>
            )}
          </Field>
        )}

        {form.dealType === 'purchase' && (
          <DepBox title="📥 اطلاعات خرید">
            <Field label="فروشنده" required>
              {suppliers.length === 0 ? (
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', padding: 10, textAlign: 'center', background: 'var(--input-bg)', borderRadius: 'var(--r-md)' }}>
                  هنوز فروشنده‌ای در مخاطبین نیست
                </div>
              ) : (
                <Select value={form.dealData.sellerId || ''} onChange={e => setD('sellerId', e.target.value)}>
                  <option value="">— انتخاب فروشنده —</option>
                  {suppliers.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>
              )}
            </Field>
            <Field label="تاریخ خرید">
              <DatePicker value={form.dealData.purchaseDate || ''} onChange={v => setD('purchaseDate', v)} />
            </Field>
          </DepBox>
        )}

        {form.dealType === 'partnership' && (
          <DepBox title="🤝 اطلاعات شراکت">
            <Field label="شریک" required>
              {allPersons.length === 0 ? (
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', padding: 10, textAlign: 'center', background: 'var(--input-bg)', borderRadius: 'var(--r-md)' }}>
                  هنوز مخاطبی ثبت نشده
                </div>
              ) : (
                <Select value={form.dealData.partnerId || ''} onChange={e => setD('partnerId', e.target.value)}>
                  <option value="">— انتخاب شریک —</option>
                  {allPersons.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>
              )}
            </Field>
            <Grid2>
              <Field label="درصد شریک" hint="۰ تا ۱۰۰">
                <NumField placeholder="۵۰" value={form.dealData.partnerPercent || ''} onChange={e => { const v = clampPercent(parseInt(toEn(e.target.value)) || 0); setD('partnerPercent', v === null ? '' : String(v)); }} unit="٪" min={0} />
              </Field>
              <Field label="درصد من" hint="خودکار">
                <Input readOnly dir="ltr" value={toFa(complement(parseInt(toEn(form.dealData.partnerPercent || '0')) || 0) ?? 100) + '٪'} unit="٪" />
              </Field>
            </Grid2>
          </DepBox>
        )}

        {form.dealType === 'rent' && (
          <DepBox title="🏢 اطلاعات اجاره">
            <Field label="اجاره‌دهنده" required>
              {allPersons.length === 0 ? (
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', padding: 10, textAlign: 'center', background: 'var(--input-bg)', borderRadius: 'var(--r-md)' }}>
                  هنوز مخاطبی ثبت نشده
                </div>
              ) : (
                <Select value={form.dealData.lessorId || ''} onChange={e => setD('lessorId', e.target.value)}>
                  <option value="">— انتخاب اجاره‌دهنده —</option>
                  {allPersons.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>
              )}
            </Field>
            <Grid2>
              <Field label="مبلغ اجاره"><MoneyField placeholder="۰" value={form.dealData.rentAmount || ''} onChange={e => setD('rentAmount', e.target.value)} /></Field>
              <Field label="سرسید"><Input placeholder="۱۴۰۵/۰۸/۰۱" value={form.dealData.rentDueDate || ''} onChange={e => setD('rentDueDate', e.target.value)} /></Field>
            </Grid2>
          </DepBox>
        )}

        {form.dealType === 'consignment' && (
          <DepBox title="📦 اطلاعات امانت">
            <Field label="امانت‌دار" required>
              {allPersons.length === 0 ? (
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', padding: 10, textAlign: 'center', background: 'var(--input-bg)', borderRadius: 'var(--r-md)' }}>
                  هنوز مخاطبی ثبت نشده
                </div>
              ) : (
                <Select value={form.dealData.consigneeId || ''} onChange={e => setD('consigneeId', e.target.value)}>
                  <option value="">— انتخاب امانت‌دار —</option>
                  {allPersons.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>
              )}
            </Field>
            <Grid2>
              <Field label="درصد امانت‌دار" hint="۰ تا ۱۰۰">
                <NumField placeholder="۲۰" value={form.dealData.consigneePercent || ''} onChange={e => { const v = clampPercent(parseInt(toEn(e.target.value)) || 0); setD('consigneePercent', v === null ? '' : String(v)); }} unit="٪" min={0} />
              </Field>
              <Field label="درصد من" hint="خودکار">
                <Input readOnly dir="ltr" value={toFa(complement(parseInt(toEn(form.dealData.consigneePercent || '0')) || 0) ?? 100) + '٪'} unit="٪" />
              </Field>
            </Grid2>
          </DepBox>
        )}

        {(form.dealType === 'partnership' || form.dealType === 'consignment') && (
          <div style={{ padding: 10, background: form.dealStatus === 'withdrawn' ? 'var(--danger-soft)' : 'var(--input-bg)', border: '1px solid ' + (form.dealStatus === 'withdrawn' ? 'var(--danger)' : 'var(--border)'), borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={form.dealStatus === 'withdrawn'} onChange={e => setForm({ ...form, dealStatus: e.target.checked ? 'withdrawn' : 'active' })} style={{ width: 18, height: 18, accentColor: 'var(--danger)' }} />
              <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: form.dealStatus === 'withdrawn' ? 'var(--danger)' : 'var(--text)' }}>شریک/صاحب کنار کشید</span>
            </div>
            {form.dealStatus === 'withdrawn' && (
              <Grid2>
                <Field label="تاریخ کنارکشیدن">
                  <DatePicker value={form.dealWithdrawnAt} onChange={v => setForm({ ...form, dealWithdrawnAt: v })} />
                </Field>
                <Field label="دلیل">
                  <Input placeholder="..." value={form.dealWithdrawnReason} onChange={e => setForm({ ...form, dealWithdrawnReason: e.target.value })} />
                </Field>
              </Grid2>
            )}
          </div>
        )}

        <SectionTitle>📋 مشخصات تخم</SectionTitle>
        <Grid2>
          <Field label="پرنده" required hint={form.dealType === 'own' && form.flockId ? 'خودکار از گله' : undefined}>
            <SmartSelect value={form.birdId} onChange={v => setForm(f => ({ ...f, birdId: v, breedId: '' }))} options={birds.map(c => ({ value: c.id, label: c.name }))} placeholder="— انتخاب —" modalTitle="انتخاب پرنده" autoThreshold={6} />
          </Field>
          <Field label="نژاد">
            <Select value={form.breedId} onChange={e => setForm({ ...form, breedId: e.target.value })}>
              <option value="">—</option>
              {breedsForBird.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </Field>
        </Grid2>
        <Grid2>
          <Field label="تعداد تخم" required>
            <NumField placeholder="۳۰۰" value={form.count} onChange={e => setForm({ ...form, count: e.target.value })} unit="عدد" min={0} />
          </Field>
          <Field label="طبقات (Tray)">
            <Input placeholder="۱-۲-۳" dir="ltr" value={form.trayNumbers} onChange={e => setForm({ ...form, trayNumbers: e.target.value })} />
          </Field>
        </Grid2>
        {(form.dealType === 'purchase' || form.dealType === 'partnership') ? (
          <>
            <Grid2>
              <Field label="تاریخ ورود" required>
                <DatePicker value={form.entryDate} onChange={v => setForm({ ...form, entryDate: v })} placeholder="انتخاب تاریخ" />
              </Field>
              <Field label="قیمت هر تخم">
                <MoneyField placeholder="۰" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} />
              </Field>
            </Grid2>
            <Field label="هزینه حمل">
              <MoneyField placeholder="۰" value={form.shippingCost} onChange={e => setForm({ ...form, shippingCost: e.target.value })} />
            </Field>
          </>
        ) : (
          <Field label="تاریخ ورود" required>
            <DatePicker value={form.entryDate} onChange={v => setForm({ ...form, entryDate: v })} placeholder="انتخاب تاریخ" />
          </Field>
        )}
        <SectionTitle>📝 یادداشت</SectionTitle>
        <Input placeholder="..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />

        {err && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)', textAlign: 'center' }}>✕ {err}</div>}
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="حذف ورودی تخم"
        footer={<BtnRow><Btn variant="danger" onClick={() => { if (delId) deleteEntry(delId); setDelId(null); }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}>
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)', lineHeight: 1.9 }}>
          حذف این ورودی؟
          <br /><span style={{ color: 'var(--muted)', fontSize: 'var(--fs-base)' }}>تمام کندلینگ‌ها و هچ‌های مربوط هم حذف می‌شوند.</span>
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

function DepBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--accent-soft)', border: '1px dashed var(--accent-border)', borderRadius: 'var(--r-md)', padding: 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', marginTop: 4 }}>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
        {title}
      </div>
      {children}
    </div>
  );
}

function chip(active: boolean): React.CSSProperties {
  return {
    padding: '6px 11px', fontSize: 'var(--fs-sm)',
    background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
    border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
    borderRadius: 'var(--r-sm)',
    color: active ? 'var(--accent)' : 'var(--muted)',
    fontWeight: active ? 600 : 500, cursor: 'pointer',
    fontFamily: 'inherit', whiteSpace: 'nowrap'
  };
}
